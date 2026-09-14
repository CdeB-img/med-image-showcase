import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { FileScientificInterpretationEvidenceStore } from "./scientific-interpretation-evidence-store.js";
import type { ProviderObservedRequestInit } from "../src/features/protocol-designer/provider-call-observability.js";

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
};

export const createRecordedProtocolDesignerFetch = (options: {
  root: string;
  fetchImpl: typeof fetch;
  context?: unknown;
  secrets?: readonly string[];
  onPersisted?: (ref: string) => void;
  onPersistenceError?: (code: "PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED") => void;
}): typeof fetch => {
  const store = new FileScientificInterpretationEvidenceStore(options.root);
  let attemptIndex = 0;
  return async (input, init) => {
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
    const request = requestIdentity(input, init, options.secrets);
    const ref = options.refs[cursor];
    if (!ref) throw new Error("PROVIDER_REPLAY_EXHAUSTED_NO_LIVE_FALLBACK");
    const stored = await store.read(ref);
    if (!stored || digest(stored.payload) !== stored.rawOutputDigest) throw new Error("PROVIDER_REPLAY_EVIDENCE_INTEGRITY_FAILURE");
    const exchange = stored.payload as Exchange;
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
