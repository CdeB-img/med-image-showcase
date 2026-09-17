import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, readdir, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { realpath } from "node:fs/promises";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { FileScientificInterpretationEvidenceStore } from "../api/scientific-interpretation-evidence-store.js";
import type { ProviderObservedRequestInit } from "../src/features/protocol-designer/provider-call-observability.js";
import {
  addCanaryCosts, boundCanaryProviderCall, canaryBudgetAdmission, CanaryAdmissionError,
  settleCanaryProviderCall, SINGLE_ATTEMPT_FAIL_CLOSED, type CanaryCallBound,
  campaignBudgetPolicy, validateCanaryCampaignPolicy, type CanaryCampaignPolicy,
} from "./protocol-designer-canary-policy.js";

// Validation consumers share campaign accounting without extending the
// scientific Product Bridge observability contract or its provider purposes.
type ProductCallMetadata = NonNullable<ProviderObservedRequestInit["noxiaProviderObservation"]>;
export type CanaryProviderRequestInit = RequestInit & {
  noxiaProviderObservation?: Omit<ProductCallMetadata, "purpose"> & {
    purpose: ProductCallMetadata["purpose"] | "USER_PROXY_GENERATION";
  };
};
const canaryPurposeModels = Object.freeze({
  LANGUAGE_PROJECTION: "gpt-5.6-luna",
  PERSISTENT_DELTA: "gpt-5.6-terra",
  DOCUMENT_PROJECTION: "gpt-5.6-terra",
  CONVERSATION_REALIZATION: "gemini-3.5-flash-lite",
  SCIENTIFIC_THINKING_PROPOSAL: "gemini-3.5-flash-lite",
  USER_PROXY_GENERATION: "gpt-5.6-luna",
});

const purposeModel = (purpose: keyof typeof canaryPurposeModels, policy?: CanaryCampaignPolicy) =>
  policy?.exactInputCounting && purpose === "CONVERSATION_REALIZATION" ? "gpt-5.6-terra" : canaryPurposeModels[purpose];

// Count only the input-affecting fields of the exact, stateless generation
// request. The journal owns count provenance and money; this is not a transport.
export const openAIInputCountRequest = (request: { endpoint: string; method: string; body: string }) => {
  if (request.endpoint !== "https://api.openai.com/v1/responses" || !boundCanaryProviderCall(request.endpoint, request.body))
    throw new CanaryAdmissionError("CANARY_INPUT_COUNT_PAYLOAD_UNQUALIFIED");
  const payload = JSON.parse(request.body);
  const input = Object.fromEntries(["model", "instructions", "input", "reasoning", "text"]
    .filter((key) => payload[key] !== undefined).map((key) => [key, payload[key]]));
  return { endpoint: "https://api.openai.com/v1/responses/input_tokens", method: "POST", body: JSON.stringify(input) };
};
const countedTokens = (response: Exchange["response"]) => {
  if (!response || response.status < 200 || response.status >= 300) return null;
  try {
    const value = JSON.parse(response.body);
    return value.object === "response.input_tokens" && Number.isSafeInteger(value.input_tokens) && value.input_tokens > 0
      ? value.input_tokens as number : null;
  } catch { return null; }
};

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
  if (!(url.origin === "https://api.openai.com" && ["/v1/responses", "/v1/responses/input_tokens"].includes(url.pathname))
    && !(url.origin === "https://generativelanguage.googleapis.com" && /^\/v1beta\/models\/[^/]+:generateContent$/.test(url.pathname))) {
    throw new Error("PROVIDER_EVIDENCE_ENDPOINT_NOT_ALLOWED");
  }
  if (init?.method !== "POST" || typeof init.body !== "string") throw new Error("PROVIDER_EVIDENCE_REQUEST_CONTRACT_INVALID");
  return { endpoint: `${url.origin}${url.pathname}`, method: "POST", body: safeBody(init.body, secrets) };
};
type RequestIdentity = ReturnType<typeof requestIdentity>;
export const withCanaryServiceTier = (request: RequestIdentity, init?: RequestInit): RequestInit | undefined => {
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
  budgetPolicy: ReturnType<typeof campaignBudgetPolicy>;
  bound: CanaryCallBound;
  campaignPolicy?: CanaryCampaignPolicy;
  conversationId?: string;
  projectId?: string | null;
  tokenCountProof?: { requestDigest: string; inputTokens: number };
};
type CanaryCountAdmission = Omit<CanaryAdmission, "bound" | "tokenCountProof"> & { generationRequestDigest: string };

const readJsonIfPresent = async (path: string): Promise<unknown | undefined> => {
  try { return JSON.parse(await readFile(path, "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw new CanaryAdmissionError("CANARY_IDENTITY_OR_POLICY_CORRUPT");
  }
};
const persistExclusive = async (path: string, value: unknown) => {
  const handle = await open(path, "wx", 0o600);
  try { await handle.writeFile(`${JSON.stringify(value)}\n`); await handle.sync(); }
  finally { await handle.close(); }
};
const identityMatches = async (path: string, expected: unknown) => {
  const actual = await readJsonIfPresent(path);
  if (actual === undefined || digest(actual) !== digest(expected)) throw new CanaryAdmissionError("CANARY_IDENTITY_OR_POLICY_MISMATCH");
};
const campaignIdentity = (root: string, policy: CanaryCampaignPolicy) => ({
  campaignId: policy.campaignId, policyDigest: policy.policyDigest, evidenceRoot: root,
});
const sessionIdentity = (root: string, policy: CanaryCampaignPolicy, sessionId: string, conversationId: string) => ({
  ...campaignIdentity(root, policy), sessionId, conversationId,
});
const registryRoot = (root: string) => join(dirname(root), ".campaign-identities");
const campaignIdentityPath = (root: string, id: string) => join(registryRoot(root), `campaign-${digest(id)}.json`);
const sessionIdentityPath = (root: string, id: string) => join(registryRoot(root), `session-${digest(id)}.json`);

/** Registry files contain immutable identity/provenance only, never money.
 * The existing prepared/completed journal remains the sole budget ledger.
 * A partial initialization is an ambiguous state: refuse, never repair it. */
const ensureCampaignPolicy = async (root: string, policy: CanaryCampaignPolicy) => {
  const canonicalRoot = await realpath(root);
  if (basename(canonicalRoot) !== `canary-${policy.campaignId}`) throw new CanaryAdmissionError("CANARY_CAMPAIGN_ROOT_MISMATCH");
  const policyPath = join(root, "campaign-policy.json");
  const stored = await readJsonIfPresent(policyPath);
  if (stored === undefined) {
    const files = await readdir(root);
    if (files.some((file) => file !== "canary-admission.lock")
      || await readJsonIfPresent(campaignIdentityPath(canonicalRoot, policy.campaignId)) !== undefined) {
      throw new CanaryAdmissionError("CANARY_POLICY_MISSING_OR_HISTORICAL_CAMPAIGN");
    }
    await mkdir(registryRoot(canonicalRoot), { recursive: true, mode: 0o700 });
    await persistExclusive(campaignIdentityPath(canonicalRoot, policy.campaignId), campaignIdentity(canonicalRoot, policy));
    await persistExclusive(policyPath, policy);
    const ledger = await open(join(root, "protocol-designer-exchanges.jsonl"), "wx", 0o600);
    try { await ledger.sync(); } finally { await ledger.close(); }
  } else {
    if (digest(validateCanaryCampaignPolicy(stored)) !== digest(policy)) throw new CanaryAdmissionError("CANARY_CAMPAIGN_POLICY_CHANGED");
    await identityMatches(campaignIdentityPath(canonicalRoot, policy.campaignId), campaignIdentity(canonicalRoot, policy));
  }
  return canonicalRoot;
};

const verifySessionIdentities = async (root: string, policy: CanaryCampaignPolicy, sessions: ReadonlyMap<string, string>) => {
  for (const [sessionId, conversationId] of sessions) {
    await identityMatches(sessionIdentityPath(root, sessionId), sessionIdentity(root, policy, sessionId, conversationId));
  }
  for (const name of await readdir(registryRoot(root))) {
    if (!name.startsWith("session-")) continue;
    const stored = await readJsonIfPresent(join(registryRoot(root), name)) as { campaignId?: string; sessionId?: string } | undefined;
    if (stored?.campaignId === policy.campaignId && !sessions.has(stored.sessionId ?? "")) {
      throw new CanaryAdmissionError("CANARY_SESSION_EVIDENCE_WITHOUT_LEDGER");
    }
  }
};

// Historical evidence is read, never migrated. This avoids claiming a session
// whose older campaign predates the immutable identity registry.
const assertSessionNotInOtherCampaign = async (root: string, sessionId: string) => {
  for (const name of await readdir(dirname(root), { withFileTypes: true })) {
    if (!name.isDirectory() || !name.name.startsWith("canary-") || name.name === basename(root)) continue;
    const otherRoot = join(dirname(root), name.name);
    let journal: string;
    try { journal = await readFile(join(otherRoot, "protocol-designer-exchanges.jsonl"), "utf8"); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        const files = await readdir(otherRoot);
        if (files.length === 0) continue;
      }
      throw new CanaryAdmissionError("CANARY_SESSION_OWNERSHIP_EVIDENCE_MISSING");
    }
    const store = new FileScientificInterpretationEvidenceStore(otherRoot);
    const referencedRawDigests = new Set<string>();
    for (const line of journal.split("\n").filter(Boolean)) {
      const entry = JSON.parse(line);
      const record = await store.read(entry.rawOutputRef);
      if (!record || digest(record.payload) !== record.rawOutputDigest) throw new CanaryAdmissionError("CANARY_SESSION_OWNERSHIP_EVIDENCE_CORRUPT");
      const exchange = record.payload as Exchange;
      if (entry.requestDigest !== exchange.requestDigest || digest(exchange.request) !== exchange.requestDigest) {
        throw new CanaryAdmissionError("CANARY_SESSION_OWNERSHIP_EVIDENCE_CORRUPT");
      }
      referencedRawDigests.add(record.rawOutputDigest);
      if ((exchange.canaryAdmission ?? exchange.canaryCountAdmission)?.sessionId === sessionId) throw new CanaryAdmissionError("CANARY_SESSION_ALREADY_BOUND");
    }
    let rawFiles: string[];
    try { rawFiles = await readdir(join(otherRoot, "raw")); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      rawFiles = [];
    }
    if (rawFiles.length !== referencedRawDigests.size || rawFiles.some((file) => {
      const matched = /-([0-9a-f]{64})\.json$/.exec(file);
      return !matched || !referencedRawDigests.has(matched[1]!);
    })) {
      throw new CanaryAdmissionError("CANARY_SESSION_OWNERSHIP_EVIDENCE_INCOMPLETE");
    }
  }
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
  canaryCountAdmission?: CanaryCountAdmission;
  canarySettlement?: ReturnType<typeof settleCanaryProviderCall>;
};

// The existing prepared/completed evidence is also the admission ledger. There
// is no independent mutable cost counter that a new HTTP request could reset.
export const readCanaryState = async (root: string, campaignId: string, campaignPolicy?: CanaryCampaignPolicy) => {
  const budget = campaignBudgetPolicy(campaignPolicy);
  const sessions = new Map<string, string>();
  if (!campaignPolicy && await readJsonIfPresent(join(root, "campaign-policy.json")) !== undefined) {
    throw new CanaryAdmissionError("CANARY_POLICY_REQUIRED_NO_HISTORICAL_FALLBACK");
  }
  let rawFiles: string[];
  try { rawFiles = await readdir(join(root, "raw")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new CanaryAdmissionError("CANARY_LEDGER_UNREADABLE");
    rawFiles = [];
  }
  let journal: string;
  try { journal = await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8"); }
  catch (error) {
    if (!campaignPolicy && (error as NodeJS.ErrnoException).code === "ENOENT" && rawFiles.length === 0) {
      return { committed: 0, measured: 0, sessionId: null, logicalIds: new Set<string>(), sessions, generationAttempts: 0, tokenCountRequests: 0, providerHttpRequests: 0 };
    }
    throw new CanaryAdmissionError("CANARY_LEDGER_UNREADABLE");
  }
  const prepared = new Map<string, Exchange>();
  const completed = new Set<string>();
  const countProofs = new Map<string, { request: RequestIdentity; inputTokens: number; logicalCallId: string }>();
  let generationAttempts = 0;
  let tokenCountRequests = 0;
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
      const countAdmission = exchange.canaryCountAdmission;
      const admission = exchange.canaryAdmission ?? countAdmission;
      if (exchange.kind !== recordKind || !admission || admission.campaignId !== campaignId
        || admission.policy !== SINGLE_ATTEMPT_FAIL_CLOSED || digest(admission.budgetPolicy) !== digest(budget)
        || digest(admission.campaignPolicy ?? null) !== digest(campaignPolicy ?? null)
        || entry.requestDigest !== exchange.requestDigest
        || digest(exchange.request) !== exchange.requestDigest) throw new Error("binding");
      if (!campaignPolicy && sessionId !== null && sessionId !== admission.sessionId) throw new Error("session");
      if (campaignPolicy) {
        const metadata = exchange.callMetadata as CanaryProviderRequestInit["noxiaProviderObservation"];
        const context = metadata?.context;
        if (!context || !admission.sessionId || !admission.conversationId
          || context.sessionId !== admission.sessionId || context.conversationId !== admission.conversationId
          || !context.turnId || !context.clientRequestId || metadata.retryIndex !== 0 || metadata.retryReason !== null
          || admission.logicalCallId !== digest([context.sessionId, context.turnId, context.clientRequestId, metadata.purpose]) + (countAdmission ? ":count" : "")
          || !campaignPolicy.allowedProviderModels.includes(exchange.modelRequested ?? "")
          || purposeModel(metadata.purpose, campaignPolicy) !== exchange.modelRequested) throw new Error("session provenance");
        if (sessions.has(admission.sessionId) && sessions.get(admission.sessionId) !== admission.conversationId) throw new Error("conversation identity");
        sessions.set(admission.sessionId, admission.conversationId);
        if (sessions.size > campaignPolicy.maxSessions) throw new Error("session limit");
      }
      sessionId = admission.sessionId;
      if (entry.disposition === "REQUEST_PREPARED") {
        if (prepared.has(entry.operationId) || logicalIds.has(admission.logicalCallId)) throw new Error("duplicate");
        if (countAdmission) {
          if (!campaignPolicy?.exactInputCounting || exchange.request.endpoint !== "https://api.openai.com/v1/responses/input_tokens"
            || admission.committedBeforeUsd !== committed || admission.measuredBeforeUsd !== measured
            || measured >= budget.measuredCostSoftStopUsd || committed >= budget.absoluteHardCampaignBoundUsd
            || !/^[a-f0-9]{64}$/.test(countAdmission.generationRequestDigest)) throw new Error("count reservation");
          tokenCountRequests++;
        } else {
        generationAttempts++;
        const proof = exchange.canaryAdmission?.tokenCountProof;
        const storedCount = countProofs.get(exchange.requestDigest);
        if (campaignPolicy?.exactInputCounting && (!proof || !storedCount
          || proof.inputTokens !== storedCount.inputTokens || proof.requestDigest !== digest(storedCount.request)
          || storedCount.logicalCallId !== admission.logicalCallId + ":count"
          || digest(openAIInputCountRequest(exchange.request)) !== proof.requestDigest
          || proof.inputTokens > campaignPolicy.exactInputCounting.maxInputTokens)) throw new Error("count proof");
        if (!campaignPolicy?.exactInputCounting && proof) throw new Error("unexpected count proof");
        const bound = boundCanaryProviderCall(exchange.request.endpoint, exchange.request.body, proof?.inputTokens);
        if (digest(bound) !== digest(exchange.canaryAdmission?.bound) || admission.committedBeforeUsd !== committed
          || admission.measuredBeforeUsd !== measured
          || canaryBudgetAdmission(committed, bound, measured, budget) !== "ADMITTED") throw new Error("reservation");
        }
        const caps = campaignPolicy?.exactInputCounting;
        if (caps && (generationAttempts > caps.maxGenerationAttempts || tokenCountRequests > caps.maxTokenCountRequests
          || generationAttempts + tokenCountRequests > caps.maxProviderHttpRequests)) throw new Error("HTTP limits");
        prepared.set(entry.operationId, exchange);
        logicalIds.add(admission.logicalCallId);
      } else if (entry.disposition === "COMPLETED") {
        const before = prepared.get(entry.operationId);
        if (!before || completed.has(entry.operationId) || before.requestDigest !== exchange.requestDigest
          || digest(before.canaryAdmission ?? before.canaryCountAdmission) !== digest(admission)) throw new Error("completion");
        if (exchange.transportError || !exchange.response || exchange.response.status < 200 || exchange.response.status >= 300) {
          throw new CanaryAdmissionError("CANARY_STOP_PREVIOUS_PROVIDER_FAILURE");
        }
        if (countAdmission) {
          const tokens = countedTokens(exchange.response);
          if (tokens === null || countProofs.has(countAdmission.generationRequestDigest)) throw new CanaryAdmissionError("CANARY_COUNT_FAILED_OR_DUPLICATE");
          countProofs.set(countAdmission.generationRequestDigest, { request: exchange.request, inputTokens: tokens, logicalCallId: admission.logicalCallId });
        } else {
        const settlement = settleCanaryProviderCall(exchange.canaryAdmission!.bound, exchange.response.body);
        if (!settlement || digest(settlement) !== digest(exchange.canarySettlement)) {
          throw new CanaryAdmissionError("CANARY_STOP_UNKNOWN_OR_UNBOUNDED_ACTUAL_COST");
        }
        committed = addCanaryCosts(committed, settlement.committedCostUpperBoundUsd);
        measured = addCanaryCosts(measured, settlement.measuredCostUsd);
        }
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
  return { committed, measured, sessionId, logicalIds, sessions, generationAttempts, tokenCountRequests, providerHttpRequests: generationAttempts + tokenCountRequests };
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
  campaignPolicy?: CanaryCampaignPolicy;
  /** Observed current Project identity only; never scientific authority. */
  projectId?: string | null;
  onCanaryDenied?: (code: string) => void;
}): typeof fetch => {
  options = { ...options, ...(options.secrets ? { secrets: [...options.secrets] } : {}) };
  const campaignPolicy = options.campaignPolicy === undefined ? undefined : validateCanaryCampaignPolicy(options.campaignPolicy);
  if (campaignPolicy && campaignPolicy.campaignId !== options.canaryCampaignId) throw new CanaryAdmissionError("CANARY_CAMPAIGN_POLICY_ID_MISMATCH");
  if (options.canaryCampaignId !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(options.canaryCampaignId)) {
    throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK");
  }
  const store = new FileScientificInterpretationEvidenceStore(options.root);
  let attemptIndex = 0;
  const record = async (input: Parameters<typeof fetch>[0], init?: RequestInit, canaryAdmission?: CanaryAdmission, canaryCountAdmission?: CanaryCountAdmission) => {
    if (!canaryAdmission && !canaryCountAdmission && await readJsonIfPresent(join(options.root, "campaign-policy.json")) !== undefined) {
      throw new CanaryAdmissionError("CANARY_POLICY_REQUIRED_NO_NORMAL_FALLBACK");
    }
    const request = requestIdentity(input, init, options.secrets);
    const callMetadata = (init as CanaryProviderRequestInit | undefined)?.noxiaProviderObservation ?? null;
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
      ...(canaryCountAdmission ? { canaryCountAdmission } : {}),
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
      const metadata = (init as CanaryProviderRequestInit | undefined)?.noxiaProviderObservation;
      const context = metadata?.context;
      if (!metadata || metadata.retryIndex !== 0 || metadata.retryReason !== null
        || !context?.sessionId || !context.turnId || !context.clientRequestId) {
        throw new CanaryAdmissionError("CANARY_SINGLE_ATTEMPT_METADATA_REQUIRED");
      }
      const canonicalRoot = campaignPolicy ? await ensureCampaignPolicy(options.root, campaignPolicy) : options.root;
      const state = await readCanaryState(options.root, options.canaryCampaignId!, campaignPolicy);
      if (campaignPolicy) {
        await verifySessionIdentities(canonicalRoot, campaignPolicy, state.sessions);
        if (!context.conversationId || (state.sessions.has(context.sessionId) && state.sessions.get(context.sessionId) !== context.conversationId)) {
          throw new CanaryAdmissionError("CANARY_SESSION_CONVERSATION_MISMATCH");
        }
        if (!state.sessions.has(context.sessionId) && state.sessions.size >= campaignPolicy.maxSessions) throw new CanaryAdmissionError("CANARY_MAX_SESSIONS_REACHED");
      } else {
        if (state.sessionId !== null && state.sessionId !== context.sessionId) throw new CanaryAdmissionError("CANARY_SESSION_MISMATCH");
        // Preserve old evidence and limits while preventing a registered new
        // campaign session from escaping into a historical recorder.
        const legacyRoot = await realpath(options.root);
        const existing = await readJsonIfPresent(sessionIdentityPath(legacyRoot, context.sessionId));
        if (existing !== undefined) {
          const expected = { campaignId: options.canaryCampaignId, policyDigest: null, evidenceRoot: legacyRoot,
            sessionId: context.sessionId, conversationId: context.conversationId };
          if (digest(existing) !== digest(expected)) throw new CanaryAdmissionError("CANARY_SESSION_ALREADY_BOUND");
          if (state.sessionId === null) throw new CanaryAdmissionError("CANARY_SESSION_EVIDENCE_WITHOUT_LEDGER");
        }
      }
      const logicalCallId = digest([context.sessionId, context.turnId, context.clientRequestId, metadata.purpose]);
      if (state.logicalIds.has(logicalCallId)) throw new CanaryAdmissionError("CANARY_LOGICAL_CALL_ALREADY_CONSUMED");
      let bound = boundCanaryProviderCall(request.endpoint, request.body);
      const budget = campaignBudgetPolicy(campaignPolicy);
      if (!bound) throw new CanaryAdmissionError("DENIED_UNKNOWN_UPPER_BOUND");
      const exact = campaignPolicy?.exactInputCounting;
      const expectedModel = purposeModel(metadata.purpose, campaignPolicy);
      if (bound.model !== expectedModel) throw new CanaryAdmissionError("CANARY_PROVIDER_MODEL_PURPOSE_MISMATCH");
      if (!exact) {
        const admission = canaryBudgetAdmission(state.committed, bound, state.measured, budget);
        if (admission !== "ADMITTED") throw new CanaryAdmissionError(admission);
      } else {
        if (state.measured >= budget.measuredCostSoftStopUsd) throw new CanaryAdmissionError("DENIED_SOFT_STOP");
        if (state.committed >= budget.absoluteHardCampaignBoundUsd) throw new CanaryAdmissionError("DENIED_HARD_BUDGET");
        if (state.generationAttempts >= exact.maxGenerationAttempts || state.tokenCountRequests >= exact.maxTokenCountRequests
          || state.providerHttpRequests + 2 > exact.maxProviderHttpRequests) throw new CanaryAdmissionError("CANARY_HTTP_LIMIT_REACHED");
        if (state.logicalIds.has(logicalCallId + ":count")) throw new CanaryAdmissionError("CANARY_LOGICAL_COUNT_ALREADY_CONSUMED");
        openAIInputCountRequest(request); // qualified shape before count dispatch
      }
      if (campaignPolicy) {
        if (!campaignPolicy.allowedProviderModels.includes(bound.model)) throw new CanaryAdmissionError("CANARY_PROVIDER_NOT_IN_CAMPAIGN_POLICY");
        if (!state.sessions.has(context.sessionId)) {
          // Cross-campaign ownership uses an exclusive immutable claim shared
          // by all campaign roots in this private evidence store.
          const claim = sessionIdentityPath(canonicalRoot, context.sessionId);
          if (await readJsonIfPresent(claim) !== undefined) throw new CanaryAdmissionError("CANARY_SESSION_ALREADY_BOUND");
          await assertSessionNotInOtherCampaign(canonicalRoot, context.sessionId);
          await persistExclusive(claim, sessionIdentity(canonicalRoot, campaignPolicy, context.sessionId, context.conversationId!));
        }
      } else {
        // For the canonical local campaign layout, an exclusive identity claim
        // also closes the race with a newly activated policy campaign. Old raw
        // records, mono-session rules and budget defaults are not rewritten.
        const legacyRoot = await realpath(options.root);
        if (basename(legacyRoot) === `canary-${options.canaryCampaignId}`) {
          const claim = sessionIdentityPath(legacyRoot, context.sessionId);
          const expected = { campaignId: options.canaryCampaignId, policyDigest: null, evidenceRoot: legacyRoot,
            sessionId: context.sessionId, conversationId: context.conversationId };
          const existing = await readJsonIfPresent(claim);
          if (existing === undefined) {
            await mkdir(registryRoot(legacyRoot), { recursive: true, mode: 0o700 });
            await persistExclusive(claim, expected);
          } else if (digest(existing) !== digest(expected)) throw new CanaryAdmissionError("CANARY_SESSION_ALREADY_BOUND");
        }
      }
      let tokenCountProof: CanaryAdmission["tokenCountProof"];
      if (exact) {
        const countRequest = openAIInputCountRequest(request);
        const response = await record(countRequest.endpoint, { ...init, body: countRequest.body }, undefined, {
          policy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: options.canaryCampaignId!, sessionId: context.sessionId,
          conversationId: context.conversationId!, logicalCallId: logicalCallId + ":count",
          committedBeforeUsd: state.committed, measuredBeforeUsd: state.measured, budgetPolicy: budget,
          campaignPolicy, generationRequestDigest: digest(request),
        });
        // Re-read durable completion before authorizing generation, including IO
        // failures. A count response without its journal proof cannot pay a call.
        await readCanaryState(options.root, options.canaryCampaignId!, campaignPolicy);
        const tokens = countedTokens({ status: response.status, headers: {}, body: await response.text() });
        if (tokens === null) throw new CanaryAdmissionError("CANARY_INPUT_COUNT_UNAVAILABLE");
        if (tokens > exact.maxInputTokens) throw new CanaryAdmissionError("CONVERSATION_MEMORY_LIMIT");
        bound = boundCanaryProviderCall(request.endpoint, request.body, tokens);
        const admission = canaryBudgetAdmission(state.committed, bound, state.measured, budget);
        if (admission !== "ADMITTED" || !bound) throw new CanaryAdmissionError(admission);
        tokenCountProof = { requestDigest: digest(countRequest), inputTokens: tokens };
      }
      return await record(input, init, {
        policy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: options.canaryCampaignId!,
        sessionId: context.sessionId, logicalCallId, committedBeforeUsd: state.committed,
        measuredBeforeUsd: state.measured, budgetPolicy: budget, bound,
        ...(tokenCountProof ? { tokenCountProof } : {}),
        ...(campaignPolicy ? { campaignPolicy, conversationId: context.conversationId!, projectId: options.projectId ?? null } : {}),
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
  scope?: Readonly<{ campaignId: string; sessionId: string }>;
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
    if (exchange.canaryAdmission?.campaignPolicy || options.scope) {
      if (!options.scope || exchange.canaryAdmission?.campaignId !== options.scope.campaignId
        || exchange.canaryAdmission?.sessionId !== options.scope.sessionId
        || ((init as CanaryProviderRequestInit | undefined)?.noxiaProviderObservation
          && (init as CanaryProviderRequestInit).noxiaProviderObservation!.context.sessionId !== options.scope.sessionId)) {
        throw new Error("PROVIDER_REPLAY_SESSION_SCOPE_MISMATCH");
      }
    }
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

export const readProtocolDesignerReplayRefs = async (root: string, scope?: Readonly<{ campaignId: string; sessionId: string }>) => {
  const entries = (await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8"))
  .split("\n").filter(Boolean).map((line) => JSON.parse(line) as {
    disposition: string; rawOutputRef: string; startedAt: string; recordingSequence: number;
  }).filter((record) => record.disposition === "COMPLETED")
  .sort((a, b) => a.startedAt.localeCompare(b.startedAt) || a.recordingSequence - b.recordingSequence)
  .map((record) => record.rawOutputRef);
  if (!scope) return entries;
  const store = new FileScientificInterpretationEvidenceStore(root);
  const selected: string[] = [];
  for (const ref of entries) {
    const record = await store.read(ref);
    if (!record || digest(record.payload) !== record.rawOutputDigest) throw new Error("PROVIDER_REPLAY_EVIDENCE_INTEGRITY_FAILURE");
    const admission = (record.payload as Exchange).canaryAdmission;
    if (admission?.campaignId === scope.campaignId && admission.sessionId === scope.sessionId) selected.push(ref);
  }
  return selected;
};
