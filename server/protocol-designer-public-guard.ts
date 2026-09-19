import { createHash } from "node:crypto";
import {
  ABSOLUTE_HARD_CAMPAIGN_BOUND_USD,
  MEASURED_COST_SOFT_STOP_USD,
  addCanaryCosts,
  boundCanaryProviderCall,
  canaryBudgetAdmission,
  settleCanaryProviderCall,
} from "./protocol-designer-canary-policy.js";

export const PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT = Object.freeze({ requests: 6, windowMs: 60_000 });
export const PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT = 8;
export const PUBLIC_PROTOCOL_DESIGNER_SESSION_TTL_MS = 24 * 60 * 60 * 1_000;
export const PUBLIC_PROTOCOL_DESIGNER_BUDGET = Object.freeze({
  absoluteHardCampaignBoundUsd: ABSOLUTE_HARD_CAMPAIGN_BOUND_USD,
  measuredCostSoftStopUsd: MEASURED_COST_SOFT_STOP_USD,
});

type Headers = Record<string, string | string[] | undefined>;
type SessionState = {
  clientKey: string;
  requestCount: number;
  updatedAt: number;
  committedCostUsd: number;
  measuredCostUsd: number;
  providerCallInFlight: boolean;
  providerGateClosed: boolean;
};

const rateBuckets = new Map<string, { startedAt: number; count: number }>();
const sessions = new Map<string, SessionState>();
const MAX_ACTIVE_KEYS = 10_000;

const header = (headers: Headers, name: string) => {
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
};
const opaque = (value: string) => createHash("sha256").update(value).digest("hex");
const clientAddress = (headers: Headers, remoteAddress?: string) => (
  header(headers, "x-forwarded-for")?.split(",")[0]?.trim()
  || remoteAddress?.trim()
  || "anonymous"
);
const sessionIdentity = (body: unknown) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as { observabilityContext?: { sessionId?: unknown; conversationId?: unknown }; conversation?: { conversationId?: unknown } };
  const raw = record.observabilityContext?.sessionId
    ?? record.observabilityContext?.conversationId
    ?? record.conversation?.conversationId;
  return typeof raw === "string" && raw.trim().length > 0 && raw.length <= 240 ? raw.trim() : null;
};
const prune = (now: number) => {
  for (const [key, bucket] of rateBuckets) if (now - bucket.startedAt >= PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT.windowMs) rateBuckets.delete(key);
  for (const [key, state] of sessions) if (!state.providerCallInFlight && now - state.updatedAt >= PUBLIC_PROTOCOL_DESIGNER_SESSION_TTL_MS) sessions.delete(key);
};

export type PublicRequestAdmission =
  | Readonly<{ admitted: true; sessionKey: string }>
  | Readonly<{ admitted: false; status: 400 | 429 | 503; code: string; message: string }>;

export const admitPublicProtocolDesignerRequest = (input: {
  headers: Headers;
  remoteAddress?: string;
  body: unknown;
  now?: number;
}): PublicRequestAdmission => {
  const now = input.now ?? Date.now();
  prune(now);
  const clientKey = opaque(clientAddress(input.headers, input.remoteAddress));
  const bucket = rateBuckets.get(clientKey);
  if (!bucket || now - bucket.startedAt >= PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT.windowMs) {
    rateBuckets.set(clientKey, { startedAt: now, count: 1 });
  } else if (bucket.count >= PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT.requests) {
    return { admitted: false, status: 429, code: "PUBLIC_RATE_LIMITED", message: "Limite temporaire atteinte." };
  } else bucket.count += 1;

  const rawSessionId = sessionIdentity(input.body);
  if (!rawSessionId) return { admitted: false, status: 400, code: "PUBLIC_SESSION_REQUIRED", message: "Session de conversation invalide." };
  const sessionKey = opaque(rawSessionId);
  const existing = sessions.get(sessionKey);
  if (existing && existing.clientKey !== clientKey) {
    return { admitted: false, status: 429, code: "PUBLIC_SESSION_CLIENT_MISMATCH", message: "Session de conversation indisponible." };
  }
  if (existing?.providerGateClosed) {
    return { admitted: false, status: 503, code: "PUBLIC_SESSION_BUDGET_CLOSED", message: "Budget de cette session atteint ou non mesurable." };
  }
  if ((existing?.requestCount ?? 0) >= PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT) {
    return { admitted: false, status: 429, code: "PUBLIC_SESSION_LIMITED", message: "Limite de session atteinte." };
  }
  if (!existing && sessions.size >= MAX_ACTIVE_KEYS) {
    return { admitted: false, status: 503, code: "PUBLIC_GUARD_CAPACITY_REACHED", message: "Service temporairement indisponible." };
  }
  // A running transport holds this object through reservation and settlement.
  // Replacing it here strands its lock and loses its financial settlement.
  if (existing) {
    existing.requestCount += 1;
    existing.updatedAt = now;
  } else sessions.set(sessionKey, {
    clientKey, requestCount: 1, updatedAt: now, committedCostUsd: 0, measuredCostUsd: 0,
    providerCallInFlight: false, providerGateClosed: false,
  });
  return { admitted: true, sessionKey };
};

const providerRequest = (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
  const endpoint = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  if (typeof init?.body !== "string") return { endpoint, body: null, init };
  if (endpoint !== "https://api.openai.com/v1/responses") return { endpoint, body: init.body, init };
  let parsed: unknown;
  try { parsed = JSON.parse(init.body); } catch { return { endpoint, body: null, init }; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { endpoint, body: null, init };
  const body = JSON.stringify({ ...(parsed as Record<string, unknown>), service_tier: "default" });
  return { endpoint, body, init: { ...init, body } };
};

/**
 * Reuses the qualified canary upper-bound and usage settlement logic. Each
 * provider call reserves its documented worst case before transport. Unknown
 * payloads, concurrent calls, failed transport, or unmeasurable usage close the
 * session gate. The map is deliberately server-only and contains opaque keys.
 */
export const createPublicProtocolDesignerBudgetedFetch = (sessionKey: string, fetchImpl: typeof fetch = fetch): typeof fetch => (
  async (input, init) => {
    const state = sessions.get(sessionKey);
    if (!state || state.providerGateClosed) throw new Error("PUBLIC_SESSION_BUDGET_CLOSED");
    if (state.providerCallInFlight) throw new Error("PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED");
    const request = providerRequest(input, init);
    const bound = request.body === null ? null : boundCanaryProviderCall(request.endpoint, request.body);
    const admission = canaryBudgetAdmission(state.committedCostUsd, bound, state.measuredCostUsd, PUBLIC_PROTOCOL_DESIGNER_BUDGET);
    if (admission !== "ADMITTED" || !bound) {
      state.providerGateClosed = true;
      throw new Error(`PUBLIC_PROVIDER_${admission}`);
    }
    const committedBefore = state.committedCostUsd;
    state.committedCostUsd = addCanaryCosts(committedBefore, bound.upperBoundUsd);
    state.providerCallInFlight = true;
    state.updatedAt = Date.now();
    try {
      const response = await fetchImpl(input, request.init);
      let responseBody: string;
      try { responseBody = await response.clone().text(); }
      catch {
        state.providerGateClosed = true;
        return response;
      }
      const settlement = response.ok ? settleCanaryProviderCall(bound, responseBody) : null;
      if (!settlement) {
        state.providerGateClosed = true;
        return response;
      }
      state.committedCostUsd = addCanaryCosts(committedBefore, settlement.committedCostUpperBoundUsd);
      state.measuredCostUsd = addCanaryCosts(state.measuredCostUsd, settlement.measuredCostUsd);
      state.updatedAt = Date.now();
      return response;
    } catch (error) {
      state.providerGateClosed = true;
      throw error;
    } finally {
      // Response headers alone do not settle usage or release the reservation.
      state.providerCallInFlight = false;
    }
  }
);

export const resetPublicProtocolDesignerGuardForTests = () => {
  rateBuckets.clear();
  sessions.clear();
};

export const publicProtocolDesignerGuardStateForTests = (sessionId: string) => {
  const state = sessions.get(opaque(sessionId));
  return state ? { ...state } : null;
};
