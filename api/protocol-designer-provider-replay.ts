import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { FileScientificInterpretationEvidenceStore } from "./scientific-interpretation-evidence-store.js";
import type { ProviderObservedRequestInit } from "../src/features/protocol-designer/provider-call-observability.js";
import {
  addCanaryCosts, boundCanaryProviderCall, canaryBudgetAdmission, CanaryAdmissionError,
  settleCanaryProviderCall, SINGLE_ATTEMPT_FAIL_CLOSED, CANARY_BUDGET_POLICY, type CanaryCallBound,
} from "./protocol-designer-canary-policy.js";

// DEV transport evidence only. Scientific state and provider selection stay with
// their existing owners; the existing atomic evidence store owns persistence.
const digest = (value: unknown) => createHash("sha256").update(stableStringify(value)).digest("hex");
const recordKind = "PROTOCOL_DESIGNER_PROVIDER_EXCHANGE_V1";
let recordingSequence = 0;
const safeText = (text: string, secrets: readonly string[]) => {
  let result = text;
  for (const secret of secrets.filter(Boolean)) result = result.split(secret).join("[REDACTED]");
  return result.replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "Bearer [REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]")
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]");
};
const redact = (value: unknown, secrets: readonly string[]): unknown => {
  if (typeof value === "string") return safeText(value, secrets);
  if (Array.isArray(value)) return value.map((item) => redact(item, secrets));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key, /^(authorization|api[-_]?key|secret|password|access[-_]?token|refresh[-_]?token|cookie)$/i.test(key)
      ? "[REDACTED]" : redact(item, secrets),
  ]));
  return value;
};
const safeBody = (text: string, secrets: readonly string[]) => {
  try {
    const parsed = JSON.parse(text);
    const redacted = redact(parsed, secrets);
    return JSON.stringify(parsed) === JSON.stringify(redacted) ? text : JSON.stringify(redacted);
  } catch { return safeText(text, secrets); }
};
const requestIdentity = (input: Parameters<typeof fetch>[0], init?: RequestInit, secrets: readonly string[] = []) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (!(url.origin === "https://api.openai.com" && url.pathname === "/v1/responses")
    && !(url.origin === "https://generativelanguage.googleapis.com" && /^\/v1beta\/models\/[^/]+:generateContent$/.test(url.pathname))) {
    throw new Error("PROVIDER_EVIDENCE_ENDPOINT_NOT_ALLOWED");
  }
  if (init?.method !== "POST" || typeof init.body !== "string") throw new Error("PROVIDER_EVIDENCE_REQUEST_CONTRACT_INVALID");
  return { endpoint: `${url.origin}${url.pathname}`, method: "POST", body: safeBody(init.body, secrets) };
};
type RequestIdentity = ReturnType<typeof requestIdentity>;
const withCanaryServiceTier = (request: RequestIdentity, init?: RequestInit): RequestInit | undefined => {
  if (request.endpoint !== "https://api.openai.com/v1/responses") return init;
  const payload = JSON.parse(init!.body as string);
  // Execution/billing policy only. Never inherit auto/priority from the provider
  // project; leave an explicit unsupported tier intact so admission rejects it.
  return payload.service_tier === undefined
    ? { ...init, body: JSON.stringify({ ...payload, service_tier: "default" }) } : init;
};
type CanaryAdmission = {
  policy: typeof SINGLE_ATTEMPT_FAIL_CLOSED;
  campaignId: string;
  sessionId: string;
  logicalCallId: string;
  committedBeforeUsd: number;
  measuredBeforeUsd: number;
  budgetPolicy: typeof CANARY_BUDGET_POLICY;
  bound: CanaryCallBound;
};
type Exchange = {
  kind: typeof recordKind;
  request: RequestIdentity;
  requestDigest: string;
  context: unknown;
  callMetadata: unknown;
  attemptIndex: number;
  recordingSequence: number;
  provider: "OPENAI" | "GOOGLE_GEMINI";
  modelRequested: string | null;
  reasoningEffort: string | null;
  startedAt: string;
  latencyMs: number;
  response: { status: number; headers: Record<string, string>; body: string } | null;
  transportError: string | null;
  canaryAdmission?: CanaryAdmission;
  canarySettlement?: ReturnType<typeof settleCanaryProviderCall>;
};

// The existing prepared/completed evidence is also the admission ledger. There
// is no independent mutable cost counter that a new HTTP request could reset.
const readCanaryState = async (root: string, campaignId: string) => {
  let rawFiles: string[];
  try { rawFiles = await readdir(join(root, "raw")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new CanaryAdmissionError("CANARY_LEDGER_UNREADABLE");
    rawFiles = [];
  }
  let journal: string;
  try { journal = await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" && rawFiles.length === 0) {
      return { committed: 0, measured: 0, sessionId: null, logicalIds: new Set<string>() };
    }
    throw new CanaryAdmissionError("CANARY_LEDGER_UNREADABLE");
  }
  const prepared = new Map<string, Exchange>();
  const completed = new Set<string>();
  const logicalIds = new Set<string>();
  const store = new FileScientificInterpretationEvidenceStore(root);
  let committed = 0;
  let measured = 0;
  const rawDigests = new Set<string>();
  let sessionId: string | null = null;
  try {
    for (const line of journal.split("\n").filter(Boolean)) {
      const entry = JSON.parse(line);
      const record = await store.read(entry.rawOutputRef);
      if (!record || digest(record.payload) !== record.rawOutputDigest) throw new Error("integrity");
      rawDigests.add(record.rawOutputDigest);
      const exchange = record.payload as Exchange;
      const admission = exchange.canaryAdmission;
      if (exchange.kind !== recordKind || !admission || admission.campaignId !== campaignId
        || admission.policy !== SINGLE_ATTEMPT_FAIL_CLOSED || digest(admission.budgetPolicy) !== digest(CANARY_BUDGET_POLICY)
        || entry.requestDigest !== exchange.requestDigest
        || digest(exchange.request) !== exchange.requestDigest) throw new Error("binding");
      if (sessionId !== null && sessionId !== admission.sessionId) throw new Error("session");
      sessionId = admission.sessionId;
      if (entry.disposition === "REQUEST_PREPARED") {
        if (prepared.has(entry.operationId) || logicalIds.has(admission.logicalCallId)) throw new Error("duplicate");
        const bound = boundCanaryProviderCall(exchange.request.endpoint, exchange.request.body);
        if (digest(bound) !== digest(admission.bound) || admission.committedBeforeUsd !== committed
          || admission.measuredBeforeUsd !== measured
          || canaryBudgetAdmission(committed, bound, measured) !== "ADMITTED") throw new Error("reservation");
        prepared.set(entry.operationId, exchange);
        logicalIds.add(admission.logicalCallId);
      } else if (entry.disposition === "COMPLETED") {
        const before = prepared.get(entry.operationId);
        if (!before || completed.has(entry.operationId) || before.requestDigest !== exchange.requestDigest
          || digest(before.canaryAdmission) !== digest(admission)) throw new Error("completion");
        if (exchange.transportError || !exchange.response || exchange.response.status < 200 || exchange.response.status >= 300) {
          throw new CanaryAdmissionError("CANARY_STOP_PREVIOUS_PROVIDER_FAILURE");
        }
        const settlement = settleCanaryProviderCall(admission.bound, exchange.response.body);
        if (!settlement || digest(settlement) !== digest(exchange.canarySettlement)) {
          throw new CanaryAdmissionError("CANARY_STOP_UNKNOWN_OR_UNBOUNDED_ACTUAL_COST");
        }
        committed = addCanaryCosts(committed, settlement.committedCostUpperBoundUsd);
        measured = addCanaryCosts(measured, settlement.measuredCostUsd);
        completed.add(entry.operationId);
      } else throw new Error("disposition");
    }
    if (prepared.size !== completed.size) throw new CanaryAdmissionError("CANARY_STOP_UNSETTLED_PREVIOUS_CALL");
    // A lost/truncated journal must not reset spend or consumed logical calls
    // while their raw evidence remains. Dedicated campaign roots contain only
    // these prepared/completed records; an orphan closes the gate.
    if (rawFiles.length !== rawDigests.size || rawFiles.some((name) => {
      const match = /-([0-9a-f]{64})\.json$/.exec(name);
      return !match || !rawDigests.has(match[1]!);
    })) throw new CanaryAdmissionError("CANARY_LEDGER_ORPHAN_RAW_EVIDENCE");
  } catch (error) {
    if (error instanceof CanaryAdmissionError) throw error;
    throw new CanaryAdmissionError("CANARY_LEDGER_INTEGRITY_FAILURE");
  }
  return { committed, measured, sessionId, logicalIds };
};

export const createRecordedProtocolDesignerFetch = (options: {
  root: string;
  fetchImpl: typeof fetch;
  context?: unknown;
  secrets?: readonly string[];
  onPersisted?: (ref: string) => void;
  onPersistenceError?: (code: "PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED") => void;
  /** Server configuration only. Use one dedicated root for the entire campaign. */
  canaryCampaignId?: string;
  onCanaryDenied?: (code: string) => void;
}): typeof fetch => {
  if (options.canaryCampaignId !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(options.canaryCampaignId)) {
    throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK");
  }
  const store = new FileScientificInterpretationEvidenceStore(options.root);
  let attemptIndex = 0;
  const record = async (input: Parameters<typeof fetch>[0], init?: RequestInit, canaryAdmission?: CanaryAdmission) => {
    const request = requestIdentity(input, init, options.secrets);
    const callMetadata = (init as ProviderObservedRequestInit | undefined)?.noxiaProviderObservation ?? null;
    const payload = JSON.parse(request.body) as { model?: string; reasoning?: { effort?: string } };
    const started = Date.now();
    const exchange: Exchange = {
      kind: recordKind, request, requestDigest: digest(request),
      context: redact(options.context ?? null, options.secrets ?? []),
      callMetadata: redact(callMetadata, options.secrets ?? []),
      attemptIndex: attemptIndex++, startedAt: new Date(started).toISOString(),
      recordingSequence: recordingSequence++,
      provider: request.endpoint.includes("api.openai.com") ? "OPENAI" : "GOOGLE_GEMINI",
      modelRequested: payload.model ?? request.endpoint.split("/models/")[1]?.split(":")[0] ?? null,
      reasoningEffort: payload.reasoning?.effort ?? null,
      latencyMs: 0, response: null, transportError: null,
      ...(canaryAdmission ? { canaryAdmission } : {}),
    };
    // A failed recording preflight blocks BEFORE a paid call. A prepared record
    // without completion is explicit evidence of an interrupted/failed capture.
    const operationId = randomUUID();
    await mkdir(options.root, { recursive: true, mode: 0o700 });
    const prepared = await store.persistAtomically({ operationId, payload: { ...exchange, disposition: "REQUEST_PREPARED" } });
    await appendFile(join(options.root, "protocol-designer-exchanges.jsonl"), `${JSON.stringify({
      disposition: "REQUEST_PREPARED", operationId, rawOutputRef: prepared.rawOutputRef,
      requestDigest: exchange.requestDigest, startedAt: exchange.startedAt, recordingSequence: exchange.recordingSequence,
    })}\n`, { encoding: "utf8", mode: 0o600 });
    let response: Response | undefined;
    let transportError: unknown;
    let responseCaptureFailed = false;
    try {
      response = await options.fetchImpl(input, init);
    } catch (caught) {
      transportError = caught;
      exchange.transportError = caught instanceof Error && caught.name === "AbortError" ? "AbortError" : "NETWORK_FAILURE";
    }
    if (response) try {
      const headers = Object.fromEntries(["content-type", "x-request-id"].flatMap((key) => {
        const value = response!.headers.get(key);
        return value ? [[key, safeText(value, options.secrets ?? [])]] : [];
      }));
      exchange.response = { status: response.status, headers, body: safeBody(await response.clone().text(), options.secrets ?? []) };
    } catch {
      responseCaptureFailed = true;
    }
    exchange.latencyMs = Date.now() - started;
    if (canaryAdmission) exchange.canarySettlement = exchange.response
      ? settleCanaryProviderCall(canaryAdmission.bound, exchange.response.body) : null;
    try {
      if (responseCaptureFailed) throw new Error("RESPONSE_CAPTURE_FAILED");
      const record = await store.persistAtomically({ operationId, payload: exchange });
      await appendFile(join(options.root, "protocol-designer-exchanges.jsonl"), `${JSON.stringify({
        disposition: "COMPLETED", operationId,
        rawOutputRef: record.rawOutputRef, requestDigest: exchange.requestDigest,
        startedAt: exchange.startedAt, recordingSequence: exchange.recordingSequence, context: exchange.context,
      })}\n`, { encoding: "utf8", mode: 0o600 });
      options.onPersisted?.(record.rawOutputRef);
    } catch {
      // Never turn a received response into a fake network failure or lose its
      // usage/cost at the adapter. Do not retry a paid call to repair evidence IO.
      try { options.onPersistenceError?.("PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED"); } catch { /* observer only */ }
      console.error("PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED", operationId);
    }
    if (transportError) throw transportError;
    return response!;
  };
  if (!options.canaryCampaignId) return record;
  return async (input, init) => {
    let ownsLock = false;
    const lock = join(options.root, "canary-admission.lock");
    try {
      await mkdir(options.root, { recursive: true, mode: 0o700 });
      // Filesystem exclusion covers HTTP concurrency, multiple policy instances
      // and process restarts. A crash leaves a closed gate, never an auto-reset.
      try {
        const handle = await open(lock, "wx", 0o600);
        ownsLock = true;
        await handle.close();
      } catch { throw new CanaryAdmissionError("CANARY_CONCURRENT_OR_UNSETTLED_EXECUTION"); }
      let request = requestIdentity(input, init, options.secrets);
      init = withCanaryServiceTier(request, init);
      request = requestIdentity(input, init, options.secrets);
      const metadata = (init as ProviderObservedRequestInit | undefined)?.noxiaProviderObservation;
      const context = metadata?.context;
      if (!metadata || metadata.retryIndex !== 0 || metadata.retryReason !== null
        || !context?.sessionId || !context.turnId || !context.clientRequestId) {
        throw new CanaryAdmissionError("CANARY_SINGLE_ATTEMPT_METADATA_REQUIRED");
      }
      const state = await readCanaryState(options.root, options.canaryCampaignId!);
      if (state.sessionId !== null && state.sessionId !== context.sessionId) throw new CanaryAdmissionError("CANARY_SESSION_MISMATCH");
      const logicalCallId = digest([context.sessionId, context.turnId, context.clientRequestId, metadata.purpose]);
      if (state.logicalIds.has(logicalCallId)) throw new CanaryAdmissionError("CANARY_LOGICAL_CALL_ALREADY_CONSUMED");
      const bound = boundCanaryProviderCall(request.endpoint, request.body);
      const admission = canaryBudgetAdmission(state.committed, bound, state.measured);
      if (admission !== "ADMITTED" || !bound) throw new CanaryAdmissionError(admission);
      const expectedModel = { LANGUAGE_PROJECTION: "gpt-5.6-luna", PERSISTENT_DELTA: "gpt-5.6-terra", CONVERSATION_REALIZATION: "gemini-3.5-flash-lite" }[metadata.purpose];
      if (bound.model !== expectedModel) throw new CanaryAdmissionError("CANARY_PROVIDER_MODEL_PURPOSE_MISMATCH");
      return await record(input, init, {
        policy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: options.canaryCampaignId!,
        sessionId: context.sessionId, logicalCallId, committedBeforeUsd: state.committed,
        measuredBeforeUsd: state.measured, budgetPolicy: CANARY_BUDGET_POLICY, bound,
      });
    } catch (error) {
      const code = error instanceof CanaryAdmissionError ? error.code : "CANARY_ADMISSION_OR_EVIDENCE_FAILURE";
      options.onCanaryDenied?.(code);
      throw error instanceof CanaryAdmissionError ? error : new CanaryAdmissionError(code);
    } finally {
      if (ownsLock) await unlink(lock);
    }
  };
};

/** Strict adapter replay: one recorded response per matching request, never live fallback. */
export const createProtocolDesignerReplayFetch = (options: {
  root: string;
  refs: readonly string[];
  secrets?: readonly string[];
}): typeof fetch => {
  const store = new FileScientificInterpretationEvidenceStore(options.root);
  let cursor = 0;
  let pending: Promise<unknown> = Promise.resolve();
  const replay = async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    let request = requestIdentity(input, init, options.secrets);
    const ref = options.refs[cursor];
    if (!ref) throw new Error("PROVIDER_REPLAY_EXHAUSTED_NO_LIVE_FALLBACK");
    const stored = await store.read(ref);
    if (!stored || digest(stored.payload) !== stored.rawOutputDigest) throw new Error("PROVIDER_REPLAY_EVIDENCE_INTEGRITY_FAILURE");
    const exchange = stored.payload as Exchange;
    if (exchange.canaryAdmission && JSON.parse(exchange.request.body).service_tier === "default") {
      request = requestIdentity(input, withCanaryServiceTier(request, init), options.secrets);
    }
    if (exchange.kind !== recordKind || exchange.requestDigest !== digest(request)
      || digest(exchange.request) !== exchange.requestDigest) throw new Error("PROVIDER_REPLAY_REQUEST_MISMATCH");
    cursor += 1;
    if (exchange.transportError) {
      const error = new Error(exchange.transportError);
      error.name = exchange.transportError;
      throw error;
    }
    if (!exchange.response) throw new Error("PROVIDER_REPLAY_RESPONSE_MISSING");
    return new Response(exchange.response.body, { status: exchange.response.status, headers: exchange.response.headers });
  };
  return (input, init) => {
    const result = pending.then(() => replay(input, init));
    pending = result.catch(() => undefined);
    return result;
  };
};

export const readProtocolDesignerReplayRefs = async (root: string) => (await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8"))
  .split("\n").filter(Boolean).map((line) => JSON.parse(line) as {
    disposition: string; rawOutputRef: string; startedAt: string; recordingSequence: number;
  }).filter((record) => record.disposition === "COMPLETED")
  .sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.recordingSequence - b.recordingSequence)
  .map((record) => record.rawOutputRef);
