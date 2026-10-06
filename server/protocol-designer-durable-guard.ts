import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres, { type Sql } from "postgres";
import {
  PUBLIC_PROTOCOL_DESIGNER_BUDGET,
  PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT,
  PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT,
  PUBLIC_PROTOCOL_DESIGNER_SESSION_TTL_MS,
  admitPublicProtocolDesignerRequest,
  createPublicProtocolDesignerBudgetedFetch,
} from "./protocol-designer-public-guard.js";
import {
  boundCanaryProviderCall,
  canaryBudgetAdmission,
  settleCanaryProviderCall,
  settleKnownIncompleteProviderUsage,
} from "./protocol-designer-canary-policy.js";
import {
  openAIInputCountRequest,
  readOpenAIInputTokenCount,
} from "./protocol-designer-provider-replay.js";
import { azureInputCountQualification, isOpenAIResponsesEndpoint, openAIProviderDestinationFromEndpoint, supportsOpenAIExactInputCount } from "./protocol-designer-openai-provider-config.js";
import { AZURE_LOCAL_INPUT_POLICY, boundPublicProviderCall } from "./protocol-designer-local-token-admission.js";
import {
  readDurableProviderFailureDiagnostic,
  type DurableProviderFailureDiagnostic,
  type DurableProviderFailurePhase,
} from "../src/features/protocol-designer/provider-call-observability.js";

type Headers = Record<string, string | string[] | undefined>;
type PublicBudgetPolicy = Readonly<{ absoluteHardCampaignBoundUsd: number; measuredCostSoftStopUsd: number }>;
type JsonObject = Record<string, unknown>;
type TransactionQuery = Sql | postgres.TransactionSql;
const PROVIDER_DISPATCH_LEASE_MS = 6 * 60 * 1_000;

export type DurablePublicGuardDenial = Readonly<{
  admitted: false;
  status: 400 | 429 | 503;
  code: string;
  message: string;
}>;

export type DurablePublicRequestContext = Readonly<{
  admitted: true;
  admissionKey: string;
  sessionKey: string;
  clientKey: string;
  clientRequestIdHash: string;
  requestDigest: string;
}>;

export type DurableRecoveredResponse = Readonly<{
  recovered: true;
  status: number;
  body: unknown;
}>;

export type DurablePublicRequestPreparation =
  | DurablePublicGuardDenial
  | DurablePublicRequestContext
  | DurableRecoveredResponse;

export type DurableWorkingDraftRecovery =
  | Readonly<{ state: "IN_PROGRESS" | "UNKNOWN" }>
  | Readonly<{ state: "COMPLETED"; response: unknown }>
  | Readonly<{ state: "FAILED"; errorCode: string | null }>
  | Readonly<{ state: "REJECTED"; status: 403 | 404; code: string }>;

export interface PublicProtocolDesignerDurableGuard {
  /** Existing native per-operation reservations support concurrent scopes.
   * Serial guards/canaries leave this absent; no budget policy is changed. */
  readonly concurrentProviderOperations?: true;
  prepareRequest(input: Readonly<{
    headers: Headers;
    remoteAddress?: string;
    body: unknown;
  }>): Promise<DurablePublicRequestPreparation>;
  createBudgetedFetch(context: DurablePublicRequestContext, fetchImpl?: typeof fetch): typeof fetch;
  completeRequest(context: DurablePublicRequestContext, status: number, body: unknown): Promise<void>;
  readWorkingDraftPreparation(input: Readonly<{
    headers: Headers; remoteAddress?: string; sessionId: string; sourceTurnRef: string; sourceResponseRef: string; clientRequestId?: string;
  }>): Promise<DurableWorkingDraftRecovery>;
  close(): Promise<void>;
}

export class DurablePublicGuardError extends Error {
  providerFailureDiagnostic?: DurableProviderFailureDiagnostic;
  constructor(
    readonly code: string,
    readonly status: 400 | 429 | 503 = 503,
  ) {
    super(code);
    this.name = "DurablePublicGuardError";
  }
}

const safeExceptionClass = (error: unknown): DurableProviderFailureDiagnostic["safeExceptionClass"] => {
  if (!error || typeof error !== "object" || !("name" in error)) return "OtherError";
  const name = error.name;
  return name === "AbortError" || name === "TypeError" || name === "Error"
    || name === "DurablePublicGuardError" || name === "CanaryAdmissionError" ? name : "OtherError";
};

const safeProviderResponseStatus = (body: string): Pick<DurableProviderFailureDiagnostic, "providerResponseStatus" | "incompleteReason"> => {
  try {
    const parsed: unknown = JSON.parse(body);
    if (!object(parsed)) return { providerResponseStatus: "UNKNOWN", incompleteReason: null };
    const providerResponseStatus = parsed.status === "completed" || parsed.status === "incomplete" || parsed.status === "failed"
      ? parsed.status : "UNKNOWN";
    const detail = object(parsed.incomplete_details) ? parsed.incomplete_details.reason : null;
    return { providerResponseStatus, incompleteReason: detail === "max_output_tokens" || detail === "content_filter" ? detail : null };
  } catch { return { providerResponseStatus: "UNKNOWN", incompleteReason: null }; }
};

const header = (headers: Headers, name: string) => {
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
};

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value as JsonObject)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
};

const object = (value: unknown): value is JsonObject => Boolean(value) && typeof value === "object" && !Array.isArray(value);
// Read projection only: a terminal HTTP error does not prove the provider operation failed.
const recoveredWorkingDraftFailure = (value: unknown, operationState?: unknown, providerBody?: unknown): DurableWorkingDraftRecovery => {
  const body = object(value) ? value : null;
  const observability = body && object(body.observability) ? body.observability : null;
  const records = Array.isArray(observability?.providerCalls) ? observability.providerCalls : [];
  const diagnostics = records.flatMap(record => object(record) && object(record.durableFailure) ? [record.durableFailure] : []);
  const observed = typeof providerBody === "string" ? safeProviderResponseStatus(providerBody)
    : diagnostics.find(d => d.bodyRead === true && ["incomplete", "failed"].includes(String(d.providerResponseStatus)));
  if (observed?.providerResponseStatus === "incomplete") return { state: "FAILED",
    errorCode: observed.incompleteReason === "max_output_tokens" ? "WORKING_DRAFT_INCOMPLETE_MAX_OUTPUT_TOKENS" : "WORKING_DRAFT_PROVIDER_INCOMPLETE" };
  if (observed?.providerResponseStatus === "failed") return { state: "FAILED", errorCode: "WORKING_DRAFT_PROVIDER_FAILED" };
  const states = [operationState, ...records.map(record => object(record) && object(record.durableFailure)
    ? record.durableFailure.lastConfirmedDurableState : null)];
  if (states.some(state => ["UNKNOWN_AFTER_DISPATCH", "COUNT_UNKNOWN_AFTER_DISPATCH", "INPUT_TOKEN_DIVERGENCE", "QUALIFICATION_INVALID"].includes(String(state)))) return { state: "UNKNOWN" };
  const error = body && object(body.error) ? body.error : null;
  const detail = Array.isArray(error?.details) ? error.details[0] : null;
  const code = typeof detail === "string" && /^[A-Z][A-Z0-9_:.-]{0,159}$/.test(detail) ? detail : error?.code;
  return { state: "FAILED", errorCode: typeof code === "string" ? code : null };
};


const publicIdentity = (body: unknown) => {
  if (!object(body)) return null;
  const observation = object(body.observabilityContext) ? body.observabilityContext : null;
  const conversation = object(body.conversation) ? body.conversation : null;
  const session = observation?.sessionId ?? observation?.conversationId ?? conversation?.conversationId;
  const request = observation?.clientRequestId;
  if (typeof session !== "string" || !session.trim() || session.length > 240
    || typeof request !== "string" || !request.trim() || request.length > 320) return null;
  return { sessionId: session.trim(), clientRequestId: request.trim() };
};

const clientAddress = (headers: Headers, remoteAddress?: string) => (
  header(headers, "x-forwarded-for")?.split(",")[0]?.trim()
  || remoteAddress?.trim()
  || "anonymous"
);

const asNumber = (value: unknown) => typeof value === "number" ? value : Number(value);

const denial = (code: string): DurablePublicGuardDenial => {
  if (code === "PUBLIC_SESSION_REQUIRED" || code === "PUBLIC_CLIENT_REQUEST_REQUIRED") {
    return { admitted: false, status: 400, code, message: "Session de conversation invalide." };
  }
  if (code === "PUBLIC_RATE_LIMITED") return { admitted: false, status: 429, code, message: "Limite temporaire atteinte." };
  if (code === "PUBLIC_SESSION_CLIENT_MISMATCH") return { admitted: false, status: 429, code, message: "Session de conversation indisponible." };
  if (code === "PUBLIC_SESSION_LIMITED") return { admitted: false, status: 429, code, message: "Limite de session atteinte." };
  return { admitted: false, status: 503, code, message: "Service temporairement indisponible." };
};

const safeResponseHeaders = (response: Response) => {
  const retained: Record<string, string> = {};
  for (const name of ["content-type", "x-request-id", "openai-request-id"]) {
    const value = response.headers.get(name);
    if (value) retained[name] = value;
  }
  return retained;
};

const providerRequest = (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
  const endpoint = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const observed = init as RequestInit & { noxiaProviderObservation?: {
    purpose?: unknown;
    context?: { clientRequestId?: unknown };
    reasoningEffort?: unknown;
    retryIndex?: unknown;
  } };
  const { noxiaProviderObservation, ...transportInit } = observed;
  if (typeof transportInit.body !== "string") {
    return { endpoint, body: null, init: transportInit, observation: noxiaProviderObservation };
  }
  if (!isOpenAIResponsesEndpoint(endpoint)) {
    return { endpoint, body: transportInit.body, init: transportInit, observation: noxiaProviderObservation };
  }
  let parsed: unknown;
  try { parsed = JSON.parse(transportInit.body); } catch {
    return { endpoint, body: null, init: transportInit, observation: noxiaProviderObservation };
  }
  if (!object(parsed)) return { endpoint, body: null, init: transportInit, observation: noxiaProviderObservation };
  const body = JSON.stringify({ ...parsed, service_tier: "default" });
  return { endpoint, body, init: { ...transportInit, body }, observation: noxiaProviderObservation };
};

type OperationRow = Readonly<{
  operation_key: string;
  state: string;
  endpoint_digest: string;
  payload_digest: string;
  configuration_digest: string;
  reserved_upper_bound_usd: string | number;
  provider_http_status: number | null;
  provider_response_body: string | null;
  provider_response_headers: Record<string, string> | null;
  dispatch_lease_expires_at: string | Date | null;
  count_payload_digest: string | null;
  counted_input_tokens: number | null;
  count_model: string | null;
  count_pricing_snapshot_date: string | null;
  count_http_status: number | null;
  count_response_digest: string | null;
  count_failure_code: string | null;
  count_lease_expires_at: string | Date | null;
  count_provider: string | null;
  generation_provider: string | null;
  generation_model: string | null;
  count_qualification_ref: string | null;
  qualification_failure_code: string | null;
  post_usage_input_tokens: number | null;
  input_token_delta: number | null;
  input_admission_policy: string | null;
  local_estimated_input_tokens: number | null;
  input_token_upper_bound: number | null;
}>;

const recoveredProviderResponse = (row: OperationRow) => {
  if (row.provider_http_status === null || row.provider_response_body === null) {
    throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESULT_NOT_RECOVERABLE");
  }
  const headers = typeof row.provider_response_headers === "string"
    ? JSON.parse(row.provider_response_headers) as Record<string, string>
    : row.provider_response_headers ?? {};
  return new Response(row.provider_response_body, {
    status: row.provider_http_status,
    headers,
  });
};

const ensureRateBucket = async (tx: TransactionQuery, clientKey: string, now: Date) => {
  await tx`
    insert into noxia_durable.public_rate_bucket
      (client_key_hash, window_started_at, request_count, updated_at)
    values (${clientKey}, ${now}, 0, ${now})
    on conflict (client_key_hash) do nothing
  `;
  const rows = await tx`
    select window_started_at, request_count
    from noxia_durable.public_rate_bucket
    where client_key_hash = ${clientKey}
    for update
  `;
  const row = rows[0];
  if (!row) throw new DurablePublicGuardError("PUBLIC_DURABLE_RATE_BUCKET_MISSING");
  const startedAt = new Date(row.window_started_at as string).getTime();
  const expired = now.getTime() - startedAt >= PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT.windowMs;
  const count = expired ? 0 : asNumber(row.request_count);
  if (count >= PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT.requests) throw new DurablePublicGuardError("PUBLIC_RATE_LIMITED", 429);
  await tx`
    update noxia_durable.public_rate_bucket
    set window_started_at = ${expired ? now : new Date(startedAt)}, request_count = ${count + 1}, updated_at = ${now}
    where client_key_hash = ${clientKey}
  `;
};

const lockSession = async (tx: TransactionQuery, context: DurablePublicRequestContext, now: Date) => {
  await tx`
    insert into noxia_durable.public_guard_session
      (session_key_hash, client_key_hash, admission_count, quota_updated_at, created_at, updated_at)
    values (${context.sessionKey}, ${context.clientKey}, 0, ${now}, ${now}, ${now})
    on conflict (session_key_hash) do nothing
  `;
  const rows = await tx`
    select * from noxia_durable.public_guard_session
    where session_key_hash = ${context.sessionKey}
    for update
  `;
  const session = rows[0];
  if (!session) throw new DurablePublicGuardError("PUBLIC_DURABLE_SESSION_MISSING");
  if (session.client_key_hash !== context.clientKey) throw new DurablePublicGuardError("PUBLIC_SESSION_CLIENT_MISMATCH", 429);
  return session;
};

// Additive, lazy migration in the existing gate. Legacy parity state/anomaly
// stays intact for history and older deployments. New policy is independently
// fail-closed for model/usage/envelope anomalies; no session is reopened.
const assertAzureLocalAdmissionOpen = async (tx: TransactionQuery, endpointDigest: string, model: string) => {
  const qualificationRef = azureInputCountQualification(model)
    ?? (model === "gpt-6-sol" ? "AZURE_LOCAL_ADMISSION_GPT_6_SOL_2026_09_28"
      // Explicit bounded Preview admission authorization, not a live PASS or
      // cross-provider equivalence claim. Existing runtime anomaly gates apply.
      : model === "gpt-6.1-sol" ? "AZURE_LOCAL_ADMISSION_GPT_6_1_SOL_PREVIEW_AUTHORIZED_2026_10_05" : null);
  if (!qualificationRef) throw new DurablePublicGuardError("PUBLIC_AZURE_LOCAL_ADMISSION_UNQUALIFIED_MODEL");
  await tx`
    insert into noxia_durable.public_provider_equivalence_gate
      (generation_endpoint_digest, generation_model, count_qualification_ref, state)
    values (${endpointDigest}, ${model}, ${qualificationRef}, 'OPEN')
    on conflict (generation_endpoint_digest, generation_model) do nothing
  `;
  await tx`
    update noxia_durable.public_provider_equivalence_gate
    set local_admission_policy = ${AZURE_LOCAL_INPUT_POLICY},
        local_admission_state = case when state = 'OPEN' or exists (
          select 1 from noxia_durable.public_provider_operation historical
          where historical.operation_key = anomaly_operation_key
            and historical.qualification_failure_code = 'PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE'
        ) then 'OPEN' else 'CLOSED' end,
        local_policy_activated_at = ${new Date()}
    where generation_endpoint_digest = ${endpointDigest} and generation_model = ${model}
      and local_admission_policy is null and local_admission_state is null
  `;
  const rows = await tx`
    select local_admission_state, local_admission_policy from noxia_durable.public_provider_equivalence_gate
    where generation_endpoint_digest = ${endpointDigest} and generation_model = ${model}
    for update
  `;
  if (rows[0]?.local_admission_state !== "OPEN" || rows[0]?.local_admission_policy !== AZURE_LOCAL_INPUT_POLICY)
    throw new DurablePublicGuardError("PUBLIC_AZURE_LOCAL_ADMISSION_CLOSED");
};

const ensureCountingAdmission = async (
  tx: TransactionQuery,
  context: DurablePublicRequestContext,
  session: Record<string, unknown>,
  now: Date,
) => {
  const rows = await tx`
    select * from noxia_durable.public_bridge_admission
    where admission_key = ${context.admissionKey}
    for update
  `;
  const existing = rows[0];
  if (existing) {
    if (existing.session_key_hash !== context.sessionKey || existing.request_digest !== context.requestDigest
      || existing.client_request_id_hash !== context.clientRequestIdHash) {
      throw new DurablePublicGuardError("PUBLIC_STALE_OPERATION_REJECTED");
    }
    return { row: existing, created: false };
  }
  if (session.provider_gate_closed) throw new DurablePublicGuardError("PUBLIC_SESSION_BUDGET_CLOSED");
  const inserted = await tx`
    insert into noxia_durable.public_bridge_admission
      (admission_key, session_key_hash, client_request_id_hash, request_digest, state, created_at, updated_at)
    values (${context.admissionKey}, ${context.sessionKey}, ${context.clientRequestIdHash}, ${context.requestDigest}, 'COUNTING', ${now}, ${now})
    returning *
  `;
  return { row: inserted[0]!, created: true };
};

const ensureAdmission = async (
  tx: TransactionQuery,
  context: DurablePublicRequestContext,
  session: Record<string, unknown>,
  now: Date,
  sessionRequestLimit: number,
) => {
  const rows = await tx`
    select * from noxia_durable.public_bridge_admission
    where admission_key = ${context.admissionKey}
    for update
  `;
  const existing = rows[0];
  if (existing) {
    if (existing.session_key_hash !== context.sessionKey || existing.request_digest !== context.requestDigest
      || existing.client_request_id_hash !== context.clientRequestIdHash) {
      throw new DurablePublicGuardError("PUBLIC_STALE_OPERATION_REJECTED");
    }
    if (existing.state !== "COUNTING") return { row: existing, created: false };
  }
  if (session.provider_gate_closed) throw new DurablePublicGuardError("PUBLIC_SESSION_BUDGET_CLOSED");
  const quotaUpdatedAt = new Date(session.quota_updated_at as string).getTime();
  const expired = now.getTime() - quotaUpdatedAt >= PUBLIC_PROTOCOL_DESIGNER_SESSION_TTL_MS;
  const admissionCount = expired ? 0 : asNumber(session.admission_count);
  if (admissionCount >= sessionRequestLimit) {
    throw new DurablePublicGuardError("PUBLIC_SESSION_LIMITED", 429);
  }
  await ensureRateBucket(tx, context.clientKey, now);
  await tx`
    update noxia_durable.public_guard_session
    set admission_count = ${admissionCount + 1}, quota_updated_at = ${now}, updated_at = ${now}, version = version + 1
    where session_key_hash = ${context.sessionKey}
  `;
  if (existing) {
    const activated = await tx`
      update noxia_durable.public_bridge_admission
      set state = 'ACTIVE', updated_at = ${now}
      where admission_key = ${context.admissionKey} and state = 'COUNTING'
      returning *
    `;
    if (!activated[0]) throw new DurablePublicGuardError("PUBLIC_ADMISSION_ACTIVATION_RACE");
    return { row: activated[0], created: false };
  }
  const inserted = await tx`
    insert into noxia_durable.public_bridge_admission
      (admission_key, session_key_hash, client_request_id_hash, request_digest, state, created_at, updated_at)
    values (${context.admissionKey}, ${context.sessionKey}, ${context.clientRequestIdHash}, ${context.requestDigest}, 'ACTIVE', ${now}, ${now})
    returning *
  `;
  return { row: inserted[0]!, created: true };
};

/** Explicit campaign migration only; the normal product guard never invokes DDL. */
export const migrateProtocolDesignerDurableGuard = async (sql: Sql) => {
  await sql.unsafe(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "migrations", "001_protocol_designer_durable_guard.sql"), "utf8"));
};

export const createPostgresProtocolDesignerDurableGuard = (
  connectionString: string,
  options: Readonly<{ maxConnections?: number; sessionRequestLimit?: number;
    budgetPolicy?: PublicBudgetPolicy }> = {},
): PublicProtocolDesignerDurableGuard => {
  const sessionRequestLimit = options.sessionRequestLimit ?? PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT;
  const budgetPolicy = options.budgetPolicy ?? PUBLIC_PROTOCOL_DESIGNER_BUDGET;
  if (!Number.isSafeInteger(sessionRequestLimit) || sessionRequestLimit < 1) {
    throw new DurablePublicGuardError("PUBLIC_SESSION_LIMIT_CONFIGURATION_INVALID");
  }
  const sql = postgres(connectionString, {
    max: options.maxConnections ?? 4,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });

  const prepareRequest: PublicProtocolDesignerDurableGuard["prepareRequest"] = async (input) => {
    const identity = publicIdentity(input.body);
    if (!identity) return denial(object(input.body) && object(input.body.observabilityContext)
      ? "PUBLIC_CLIENT_REQUEST_REQUIRED" : "PUBLIC_SESSION_REQUIRED");
    const context: DurablePublicRequestContext = Object.freeze({
      admitted: true,
      admissionKey: hash(`${identity.sessionId}\u0000${identity.clientRequestId}`),
      sessionKey: hash(identity.sessionId),
      clientKey: hash(clientAddress(input.headers, input.remoteAddress)),
      clientRequestIdHash: hash(identity.clientRequestId),
      requestDigest: hash(canonicalJson(input.body)),
    });
    try {
      const rows = await sql`
        select a.*, s.client_key_hash
        from noxia_durable.public_bridge_admission a
        join noxia_durable.public_guard_session s on s.session_key_hash = a.session_key_hash
        where a.admission_key = ${context.admissionKey}
      `;
      const existing = rows[0];
      if (!existing) return context;
      if (existing.client_key_hash !== context.clientKey) return denial("PUBLIC_SESSION_CLIENT_MISMATCH");
      if (existing.session_key_hash !== context.sessionKey || existing.request_digest !== context.requestDigest
        || existing.client_request_id_hash !== context.clientRequestIdHash) return denial("PUBLIC_STALE_OPERATION_REJECTED");
      if (existing.state === "COMPLETED" && existing.response_status !== null && existing.response_body !== null) {
        return { recovered: true, status: asNumber(existing.response_status), body: existing.response_body };
      }
      return context;
    } catch (error) {
      if (error instanceof DurablePublicGuardError) return denial(error.code);
      throw new DurablePublicGuardError("PUBLIC_DURABLE_STORE_UNAVAILABLE");
    }
  };

  const createBudgetedFetch: PublicProtocolDesignerDurableGuard["createBudgetedFetch"] = (context, fetchImpl = fetch) => {
    let operationIndex = 0;
    return async (input, init) => {
      const progress: {
        phase: DurableProviderFailurePhase;
        operationKey: string | null;
        clientRequestId: string | null;
        sessionId: string | null;
        turnId: string | null;
        providerCallId: string | null;
        generationProvider: DurableProviderFailureDiagnostic["generationProvider"];
        precountStarted: boolean;
        precountCompleted: boolean;
        reservationConfirmed: boolean;
        dispatchAttempted: boolean;
        headersReceived: boolean;
        bodyRead: boolean;
        inputCountHttpStatus: number | null;
        providerHttpStatus: number | null;
        providerResponseStatus: DurableProviderFailureDiagnostic["providerResponseStatus"];
        incompleteReason: DurableProviderFailureDiagnostic["incompleteReason"];
        safeExceptionClass: DurableProviderFailureDiagnostic["safeExceptionClass"];
        abortSignalAborted: boolean | null;
        lastConfirmedDurableState: string;
      } = {
        phase: "UNKNOWN", operationKey: null, clientRequestId: null, sessionId: null, turnId: null,
        providerCallId: null, generationProvider: "UNKNOWN", precountStarted: false, precountCompleted: false,
        reservationConfirmed: false, dispatchAttempted: false, headersReceived: false, bodyRead: false,
        inputCountHttpStatus: null, providerHttpStatus: null, providerResponseStatus: "UNKNOWN",
        incompleteReason: null, safeExceptionClass: null, abortSignalAborted: null,
        lastConfirmedDurableState: "UNKNOWN",
      };
      try {
      const index = operationIndex++;
      const request = providerRequest(input, init);
      const observedContext = request.observation?.context as { clientRequestId?: unknown; sessionId?: unknown; turnId?: unknown } | undefined;
      progress.clientRequestId = typeof observedContext?.clientRequestId === "string" ? observedContext.clientRequestId : null;
      progress.sessionId = typeof observedContext?.sessionId === "string" ? observedContext.sessionId : null;
      progress.turnId = typeof observedContext?.turnId === "string" ? observedContext.turnId : null;
      const purpose = request.observation?.purpose;
      const retryIndex = request.observation?.retryIndex;
      progress.providerCallId = progress.clientRequestId && typeof purpose === "string" && typeof retryIndex === "number"
        ? `provider-call:${progress.clientRequestId}:${purpose}:${retryIndex}` : null;
      progress.abortSignalAborted = request.init.signal?.aborted ?? null;
      const uncountedBound = request.body === null ? null : boundPublicProviderCall(request.endpoint, request.body);
      const azureGeneration = openAIProviderDestinationFromEndpoint(request.endpoint) === "azure";
      progress.generationProvider = azureGeneration ? "AZURE_OPENAI" : "OPENAI";
      if (azureGeneration && !uncountedBound) {
        throw new DurablePublicGuardError("PUBLIC_AZURE_LOCAL_INPUT_ADMISSION_DENIED");
      }
      const endpointDigest = hash(request.endpoint);
      const payloadDigest = hash(request.body ?? "NO_BODY");
      const configurationDigest = hash(canonicalJson({
        purpose: request.observation?.purpose ?? null,
        reasoningEffort: request.observation?.reasoningEffort ?? null,
        retryIndex: request.observation?.retryIndex ?? null,
        ...(azureGeneration ? { inputAdmissionPolicy: AZURE_LOCAL_INPUT_POLICY } : {}),
      }));
      const operationKey = hash(`${context.admissionKey}\u0000${index}`);
      progress.operationKey = operationKey;
      const countRequest = !azureGeneration && request.body !== null && supportsOpenAIExactInputCount(request.endpoint)
        ? openAIInputCountRequest({ endpoint: request.endpoint, method: "POST", body: request.body })
        : null;
      progress.phase = countRequest ? "PRECOUNT" : "RESERVATION";
      const countPayloadDigest = countRequest ? hash(countRequest.body) : null;
      const identityMatches = (row: OperationRow) => row.endpoint_digest === endpointDigest
        && row.payload_digest === payloadDigest
        && row.configuration_digest === configurationDigest
        && row.count_payload_digest === countPayloadDigest
        && (!azureGeneration || (row.count_provider === null
          && row.generation_provider === "AZURE_OPENAI" && row.generation_model === uncountedBound?.model
          && row.input_admission_policy === AZURE_LOCAL_INPUT_POLICY
          && asNumber(row.local_estimated_input_tokens) === uncountedBound?.localEstimatedInputTokens
          && asNumber(row.input_token_upper_bound) === uncountedBound?.inputTokenUpperBound));
      const operationPurpose = typeof request.observation?.purpose === "string" ? request.observation.purpose : null;
      let operation: OperationRow | undefined;
      let bound = uncountedBound;

      const failCount = async (code: string, status: number | null = null, responseBody: string | null = null) => {
        await sql.begin(async (tx) => {
          const rows = await tx`
            select state from noxia_durable.public_provider_operation
            where operation_key = ${operationKey}
            for update
          `;
          if (rows[0]?.state !== "COUNT_DISPATCHED") return;
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'COUNT_FAILED', count_http_status = ${status}, count_failure_code = ${code},
                count_response_digest = ${responseBody === null ? null : hash(responseBody)},
                count_completed_at = ${new Date()}, updated_at = ${new Date()}
            where operation_key = ${operationKey}
          `;
        });
        progress.lastConfirmedDurableState = "COUNT_FAILED";
      };

      try {
        if (countRequest) {
          const now = new Date();
          const prepared = await sql.begin(async (tx): Promise<OperationRow | { denial: string }> => {
            const session = await lockSession(tx, context, now);
            await ensureCountingAdmission(tx, context, session, now);
            const rows = await tx`
              select * from noxia_durable.public_provider_operation
              where operation_key = ${operationKey}
              for update
            `;
            const existing = rows[0] as OperationRow | undefined;
            if (existing) {
              if (!identityMatches(existing)) throw new DurablePublicGuardError("PUBLIC_STALE_OPERATION_REJECTED");
              if (existing.state === "COUNT_FAILED") return { denial: existing.count_failure_code ?? "PUBLIC_PROVIDER_INPUT_COUNT_FAILED" };
              if (existing.state === "INPUT_TOKEN_DIVERGENCE") return { denial: "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE" };
              if (existing.state === "QUALIFICATION_INVALID") return { denial: existing.qualification_failure_code ?? "PUBLIC_AZURE_QUALIFICATION_INVALID" };
              if (["COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"].includes(existing.state)) return existing;
              if (existing.state === "COUNT_UNKNOWN_AFTER_DISPATCH") return { denial: "PUBLIC_PROVIDER_INPUT_COUNT_UNKNOWN_AFTER_DISPATCH" };
              if (existing.state === "COUNT_DISPATCHED") {
                const leaseExpiresAt = existing.count_lease_expires_at
                  ? new Date(existing.count_lease_expires_at).getTime() : 0;
                if (leaseExpiresAt > now.getTime()) return { denial: "PUBLIC_INPUT_COUNT_IN_PROGRESS" };
                await tx`
                  update noxia_durable.public_provider_operation
                  set state = 'COUNT_UNKNOWN_AFTER_DISPATCH', count_failure_code = 'PUBLIC_PROVIDER_INPUT_COUNT_UNKNOWN_AFTER_DISPATCH',
                      updated_at = ${now}
                  where operation_key = ${operationKey} and state = 'COUNT_DISPATCHED'
                `;
                return { denial: "PUBLIC_PROVIDER_INPUT_COUNT_UNKNOWN_AFTER_DISPATCH" };
              }
              return existing;
            }
            if (session.provider_gate_closed) return { denial: "PUBLIC_SESSION_BUDGET_CLOSED" };
            if (!uncountedBound) return { denial: "PUBLIC_PROVIDER_DENIED_UNKNOWN_UPPER_BOUND" };
            const inserted = await tx`
              insert into noxia_durable.public_provider_operation (
                operation_key, admission_key, session_key_hash, operation_index, purpose,
                endpoint_digest, payload_digest, configuration_digest, state, reserved_upper_bound_usd,
                count_payload_digest, count_model, count_pricing_snapshot_date,
                count_provider, generation_provider, generation_model, count_qualification_ref, created_at, updated_at
              ) values (
                ${operationKey}, ${context.admissionKey}, ${context.sessionKey}, ${index}, ${operationPurpose},
                ${endpointDigest}, ${payloadDigest}, ${configurationDigest}, 'COUNT_PENDING', 0,
                ${countPayloadDigest}, ${uncountedBound.model}, ${uncountedBound.pricingSnapshotDate},
                ${null}, ${null}, ${null}, ${null}, ${now}, ${now}
              ) returning *
            `;
            return inserted[0] as OperationRow;
          });
          if ("denial" in prepared) {
            if (prepared.denial === "PUBLIC_PROVIDER_INPUT_COUNT_UNKNOWN_AFTER_DISPATCH") {
              progress.lastConfirmedDurableState = "COUNT_UNKNOWN_AFTER_DISPATCH";
            }
            throw new DurablePublicGuardError(prepared.denial);
          }
          operation = prepared;
          progress.lastConfirmedDurableState = operation.state;
          progress.precountCompleted = ["COUNT_COMPLETED", "RESERVED", "DISPATCHED", "COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"]
            .includes(operation.state);

          if (operation.state === "COUNT_PENDING") {
            const marked = await sql.begin(async (tx) => {
              const rows = await tx`
                select state from noxia_durable.public_provider_operation
                where operation_key = ${operationKey}
                for update
              `;
              if (rows[0]?.state !== "COUNT_PENDING") return false;
              await tx`
                update noxia_durable.public_provider_operation
                set state = 'COUNT_DISPATCHED', count_dispatched_at = ${new Date()},
                    count_lease_expires_at = ${new Date(Date.now() + PROVIDER_DISPATCH_LEASE_MS)}, updated_at = ${new Date()}
                where operation_key = ${operationKey}
              `;
              return true;
            });
            if (!marked) throw new DurablePublicGuardError("PUBLIC_INPUT_COUNT_IN_PROGRESS");
            progress.precountStarted = true;
            progress.lastConfirmedDurableState = "COUNT_DISPATCHED";
            let countResponse: Response;
            try {
              countResponse = await fetchImpl(countRequest.endpoint, {
                ...request.init,
                method: countRequest.method,
                body: countRequest.body,
              });
            } catch (error) {
              progress.safeExceptionClass = safeExceptionClass(error);
              progress.abortSignalAborted = request.init.signal?.aborted ?? null;
              const code = error instanceof Error && error.name === "AbortError"
                ? "PUBLIC_PROVIDER_INPUT_COUNT_TIMEOUT" : "PUBLIC_PROVIDER_INPUT_COUNT_NETWORK_FAILURE";
              await failCount(code);
              throw new DurablePublicGuardError(code);
            }
            progress.inputCountHttpStatus = countResponse.status;
            let countBody: string;
            try { countBody = await countResponse.clone().text(); }
            catch {
              await failCount("PUBLIC_PROVIDER_INPUT_COUNT_RESPONSE_UNREADABLE", countResponse.status);
              throw new DurablePublicGuardError("PUBLIC_PROVIDER_INPUT_COUNT_RESPONSE_UNREADABLE");
            }
            if (!countResponse.ok) {
              const code = `PUBLIC_PROVIDER_INPUT_COUNT_HTTP_${countResponse.status}`;
              await failCount(code, countResponse.status, countBody);
              throw new DurablePublicGuardError(code);
            }
            const tokens = readOpenAIInputTokenCount({ status: countResponse.status, body: countBody });
            if (tokens === null) {
              await failCount("PUBLIC_PROVIDER_INPUT_COUNT_INVALID", countResponse.status, countBody);
              throw new DurablePublicGuardError("PUBLIC_PROVIDER_INPUT_COUNT_INVALID");
            }
            const completed = await sql`
              update noxia_durable.public_provider_operation
              set state = 'COUNT_COMPLETED', counted_input_tokens = ${tokens}, count_http_status = ${countResponse.status},
                  count_response_digest = ${hash(countBody)}, count_completed_at = ${new Date()}, updated_at = ${new Date()}
              where operation_key = ${operationKey} and state = 'COUNT_DISPATCHED'
              returning *
            `;
            if (!completed[0]) throw new DurablePublicGuardError("PUBLIC_INPUT_COUNT_COMPLETION_RACE");
            operation = completed[0] as OperationRow;
            progress.precountCompleted = true;
            progress.lastConfirmedDurableState = "COUNT_COMPLETED";
          }
          if (operation.counted_input_tokens) {
            bound = boundCanaryProviderCall(request.endpoint, request.body!, asNumber(operation.counted_input_tokens));
          }
        }

        progress.phase = "RESERVATION";
        const reservationNow = new Date();
        const reservation = await sql.begin(async (tx): Promise<OperationRow | { denial: string }> => {
          const session = await lockSession(tx, context, reservationNow);
          const rows = await tx`
            select * from noxia_durable.public_provider_operation
            where operation_key = ${operationKey}
            for update
          `;
          const existing = rows[0] as OperationRow | undefined;
          if (existing && !identityMatches(existing)) throw new DurablePublicGuardError("PUBLIC_STALE_OPERATION_REJECTED");
          if (existing && ["COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"].includes(existing.state)) return existing;
          if (azureGeneration && uncountedBound) await assertAzureLocalAdmissionOpen(tx, endpointDigest, uncountedBound.model);
          if (existing?.state === "DISPATCHED") {
            const leaseExpiresAt = existing.dispatch_lease_expires_at
              ? new Date(existing.dispatch_lease_expires_at).getTime() : 0;
            if (leaseExpiresAt > reservationNow.getTime()) return { denial: "PUBLIC_OPERATION_IN_PROGRESS" };
            await tx`
              update noxia_durable.public_provider_operation
              set state = 'UNKNOWN_AFTER_DISPATCH', updated_at = ${reservationNow}
              where operation_key = ${operationKey} and state = 'DISPATCHED'
            `;
            // The original reservation remains in committed_cost_upper_bound_usd.
            // A distinct operation still passes canaryBudgetAdmission under this session lock.
            return { denial: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" };
          }
          if (existing?.state === "UNKNOWN_AFTER_DISPATCH") return { denial: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" };
          if (existing?.state?.startsWith("INCOMPLETE_")) return { denial: "PUBLIC_PROVIDER_INCOMPLETE" };
          if (existing?.state === "PROVIDER_HTTP_FAILED") return { denial: "PUBLIC_PROVIDER_HTTP_FAILURE" };
          if (existing?.state === "PROVIDER_RESULT_FAILED") return { denial: "PUBLIC_PROVIDER_RESULT_FAILED" };
          if (existing?.state === "PROVIDER_USAGE_UNSETTLED") return { denial: "PUBLIC_PROVIDER_USAGE_UNVERIFIED" };
          if (existing?.state === "INPUT_TOKEN_DIVERGENCE") return { denial: "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE" };
          if (existing?.state === "QUALIFICATION_INVALID") return { denial: existing.qualification_failure_code ?? "PUBLIC_AZURE_QUALIFICATION_INVALID" };
          if (existing?.state === "RESERVED") return existing;
          if (countRequest && existing?.state !== "COUNT_COMPLETED") {
            return { denial: existing?.state === "COUNT_FAILED"
              ? existing.count_failure_code ?? "PUBLIC_PROVIDER_INPUT_COUNT_FAILED"
              : "PUBLIC_PROVIDER_INPUT_COUNT_NOT_COMPLETED" };
          }
          const counted = existing?.counted_input_tokens ? asNumber(existing.counted_input_tokens) : undefined;
          const reservationBound = azureGeneration ? uncountedBound
            : request.body === null ? null : boundCanaryProviderCall(request.endpoint, request.body, counted);
          if (session.provider_gate_closed) return { denial: "PUBLIC_SESSION_BUDGET_CLOSED" };
          const measured = asNumber(session.measured_cost_usd);
          const committed = asNumber(session.committed_cost_upper_bound_usd);
          const admission = canaryBudgetAdmission(committed, reservationBound, measured, budgetPolicy);
          if (admission !== "ADMITTED" || !reservationBound) {
            await tx`
              update noxia_durable.public_guard_session
              set provider_gate_closed = true, updated_at = ${reservationNow}, version = version + 1
              where session_key_hash = ${context.sessionKey}
            `;
            return { denial: `PUBLIC_PROVIDER_${admission}` };
          }
          await ensureAdmission(tx, context, session, reservationNow, sessionRequestLimit);
          let reserved: OperationRow;
          if (existing) {
            const updated = await tx`
              update noxia_durable.public_provider_operation
              set state = 'RESERVED', reserved_upper_bound_usd = ${reservationBound.upperBoundUsd}, updated_at = ${reservationNow}
              where operation_key = ${operationKey} and state = 'COUNT_COMPLETED'
              returning *
            `;
            if (!updated[0]) throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESERVATION_RACE");
            reserved = updated[0] as OperationRow;
          } else {
            const inserted = await tx`
              insert into noxia_durable.public_provider_operation (
                operation_key, admission_key, session_key_hash, operation_index, purpose,
                endpoint_digest, payload_digest, configuration_digest, state,
                reserved_upper_bound_usd, created_at, updated_at,
                generation_provider, generation_model, input_admission_policy,
                local_estimated_input_tokens, input_token_upper_bound, input_pricing_snapshot_date
              ) values (
                ${operationKey}, ${context.admissionKey}, ${context.sessionKey}, ${index}, ${operationPurpose},
                ${endpointDigest}, ${payloadDigest}, ${configurationDigest}, 'RESERVED',
                ${reservationBound.upperBoundUsd}, ${reservationNow}, ${reservationNow},
                ${azureGeneration ? "AZURE_OPENAI" : null}, ${azureGeneration ? reservationBound.model : null},
                ${reservationBound.inputAdmissionPolicy ?? null}, ${reservationBound.localEstimatedInputTokens ?? null},
                ${azureGeneration ? reservationBound.inputTokenUpperBound : null}, ${reservationBound.pricingSnapshotDate}
              ) returning *
            `;
            reserved = inserted[0] as OperationRow;
          }
          await tx`
            update noxia_durable.public_guard_session
            set committed_cost_upper_bound_usd = committed_cost_upper_bound_usd + ${reservationBound.upperBoundUsd},
                updated_at = ${reservationNow}, version = version + 1
            where session_key_hash = ${context.sessionKey}
          `;
          bound = reservationBound;
          return reserved;
        });
        if ("denial" in reservation) {
          if (reservation.denial === "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH") {
            progress.lastConfirmedDurableState = "UNKNOWN_AFTER_DISPATCH";
          }
          throw new DurablePublicGuardError(reservation.denial);
        }
        operation = reservation;
        progress.lastConfirmedDurableState = operation.state;
        progress.reservationConfirmed = ["RESERVED", "DISPATCHED", "COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"]
          .includes(operation.state);
        if (operation.counted_input_tokens && request.body !== null) {
          bound = boundCanaryProviderCall(request.endpoint, request.body, asNumber(operation.counted_input_tokens));
        }
      } catch (error) {
        if (error instanceof DurablePublicGuardError) throw error;
        progress.safeExceptionClass = safeExceptionClass(error);
        progress.lastConfirmedDurableState = "UNKNOWN";
        throw new DurablePublicGuardError("PUBLIC_DURABLE_STORE_UNAVAILABLE");
      }

      if (["COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"].includes(operation.state)) {
        progress.phase = "PRE_DISPATCH";
        return recoveredProviderResponse(operation);
      }

      progress.phase = "PRE_DISPATCH";
      try {
        await sql.begin(async (tx) => {
          const rows = await tx`
            select state from noxia_durable.public_provider_operation
            where operation_key = ${operationKey}
            for update
          `;
          if (rows[0]?.state !== "RESERVED") throw new DurablePublicGuardError("PUBLIC_PROVIDER_OPERATION_NOT_RESERVED");
          if (azureGeneration && bound) await assertAzureLocalAdmissionOpen(tx, endpointDigest, bound.model);
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'DISPATCHED', dispatched_at = ${new Date()},
                dispatch_lease_expires_at = ${new Date(Date.now() + PROVIDER_DISPATCH_LEASE_MS)}, updated_at = ${new Date()}
            where operation_key = ${operationKey}
          `;
        });
      } catch (error) {
        if (error instanceof DurablePublicGuardError) throw error;
        progress.safeExceptionClass = safeExceptionClass(error);
        progress.lastConfirmedDurableState = "UNKNOWN";
        throw new DurablePublicGuardError("PUBLIC_DURABLE_STORE_UNAVAILABLE");
      }
      progress.lastConfirmedDurableState = "DISPATCHED";

      let response: Response;
      progress.phase = "DISPATCHED";
      progress.dispatchAttempted = true;
      try {
        response = await fetchImpl(input, request.init);
      } catch (error) {
        progress.safeExceptionClass = safeExceptionClass(error);
        progress.abortSignalAborted = request.init.signal?.aborted ?? null;
        await sql.begin(async (tx) => {
          await lockSession(tx, context, new Date());
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'UNKNOWN_AFTER_DISPATCH', updated_at = ${new Date()}
            where operation_key = ${operationKey} and state = 'DISPATCHED'
          `;
        });
        progress.lastConfirmedDurableState = "UNKNOWN_AFTER_DISPATCH";
        throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH");
      }
      progress.phase = "HEADERS_RECEIVED";
      progress.headersReceived = true;
      progress.providerHttpStatus = response.status;

      let responseBody: string;
      progress.phase = "BODY_READ";
      try { responseBody = await response.clone().text(); }
      catch (error) {
        progress.safeExceptionClass = safeExceptionClass(error);
        progress.abortSignalAborted = request.init.signal?.aborted ?? null;
        await sql.begin(async (tx) => {
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'UNKNOWN_AFTER_DISPATCH', provider_http_status = ${response.status}, updated_at = ${new Date()}
            where operation_key = ${operationKey} and state = 'DISPATCHED'
          `;
        });
        progress.lastConfirmedDurableState = "UNKNOWN_AFTER_DISPATCH";
        throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH");
      }
      progress.bodyRead = true;
      progress.phase = "SETTLEMENT";
      Object.assign(progress, safeProviderResponseStatus(responseBody));

      const incomplete = response.ok && progress.providerResponseStatus === "incomplete";
      const incompleteState = progress.incompleteReason === "content_filter" ? "INCOMPLETE_CONTENT_FILTERED"
        : progress.incompleteReason === "max_output_tokens" ? "INCOMPLETE_MAX_OUTPUT_TOKENS" : "INCOMPLETE_OTHER";
      const settlement = response.ok && bound
        ? incomplete ? settleKnownIncompleteProviderUsage(bound, responseBody)
          : settleCanaryProviderCall(bound, responseBody) : null;
      const unsettledState = incomplete ? "INCOMPLETE_UNSETTLED"
        : !response.ok ? "PROVIDER_HTTP_FAILED"
          : progress.providerResponseStatus === "completed" ? "PROVIDER_USAGE_UNSETTLED"
            : progress.providerResponseStatus === "failed" ? "PROVIDER_RESULT_FAILED" : "UNKNOWN_AFTER_DISPATCH";
      const responseHeaders = safeResponseHeaders(response);
      let qualificationFailureCode: string | null = null;
      await sql.begin(async (tx) => {
        const session = await lockSession(tx, context, new Date());
        const rows = await tx`
          select * from noxia_durable.public_provider_operation
          where operation_key = ${operationKey}
          for update
        `;
        const current = rows[0] as OperationRow | undefined;
        if (!current) throw new DurablePublicGuardError("PUBLIC_PROVIDER_OPERATION_MISSING");
        if (["COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"].includes(current.state)) return;
        if (current.state !== "DISPATCHED") throw new DurablePublicGuardError("PUBLIC_PROVIDER_OPERATION_NOT_DISPATCHED");
        if (azureGeneration && response.ok) {
          let providerBody: JsonObject | null = null;
          try {
            const parsed: unknown = JSON.parse(responseBody);
            providerBody = object(parsed) ? parsed : null;
          } catch { /* Fail closed below when Azure usage cannot be verified. */ }
          const usage = object(providerBody?.usage) ? providerBody.usage : null;
          const postInput = usage?.input_tokens;
          const measuredInput = typeof postInput === "number" && Number.isSafeInteger(postInput) && postInput > 0
            ? postInput : null;
          // Incomplete/failed without usable usage cannot establish an envelope overrun.
          // Keep the reservation and terminal operation; do not invalidate the shared policy.
          const nonQualifyingResponse = (providerBody?.status === "incomplete" || providerBody?.status === "failed")
            && (postInput === undefined || postInput === null || postInput === 0);
          if (!providerBody) {
            qualificationFailureCode = "PUBLIC_AZURE_RESPONSE_UNREADABLE";
          } else if (typeof providerBody.model !== "string" || providerBody.model !== current.generation_model) {
            qualificationFailureCode = "PUBLIC_AZURE_GENERATION_MODEL_DRIFT";
          } else if (measuredInput === null && !nonQualifyingResponse) {
            qualificationFailureCode = "PUBLIC_AZURE_POST_USAGE_INPUT_TOKENS_MISSING";
          } else if (measuredInput !== null && (!current.input_token_upper_bound || measuredInput > asNumber(current.input_token_upper_bound))) {
            qualificationFailureCode = "PUBLIC_AZURE_LOCAL_INPUT_BOUND_EXCEEDED";
          }
          if (qualificationFailureCode) {
            const now = new Date();
            await tx`
              update noxia_durable.public_provider_operation
              set state = ${"QUALIFICATION_INVALID"},
                  qualification_failure_code = ${qualificationFailureCode},
                  post_usage_input_tokens = ${typeof postInput === "number" && Number.isSafeInteger(postInput) ? postInput : null},
                  input_token_delta = ${typeof postInput === "number" && Number.isSafeInteger(postInput) && current.local_estimated_input_tokens !== null
                    ? postInput - asNumber(current.local_estimated_input_tokens) : null},
                  provider_http_status = ${response.status}, provider_response_body = ${responseBody},
                  provider_response_headers = ${tx.json(responseHeaders)}, provider_response_digest = ${hash(responseBody)},
                  completed_at = ${now}, updated_at = ${now}
              where operation_key = ${operationKey}
            `;
            await tx`
              update noxia_durable.public_provider_equivalence_gate
              set local_admission_state = 'CLOSED', local_anomaly_operation_key = ${operationKey}, local_invalidated_at = ${now}
              where generation_endpoint_digest = ${endpointDigest} and generation_model = ${current.generation_model}
                and local_admission_policy = ${AZURE_LOCAL_INPUT_POLICY}
            `;
            await tx`
              update noxia_durable.public_guard_session
              set provider_gate_closed = true, updated_at = ${now}, version = version + 1
              where session_key_hash = ${context.sessionKey}
            `;
            return;
          }
        }
        if (!settlement) {
          await tx`
            update noxia_durable.public_provider_operation
            set state = ${unsettledState}, provider_http_status = ${response.status},
                provider_response_body = ${responseBody}, provider_response_headers = ${tx.json(responseHeaders)},
                provider_response_digest = ${hash(responseBody)}, completed_at = ${new Date()}, updated_at = ${new Date()}
            where operation_key = ${operationKey}
          `;
          return;
        }
        const reserved = asNumber(current.reserved_upper_bound_usd);
        await tx`
          update noxia_durable.public_provider_operation
          set state = ${incomplete ? incompleteState : "COMPLETED_RECEIVED"}, measured_cost_usd = ${settlement.measuredCostUsd},
              committed_cost_upper_bound_usd = ${settlement.committedCostUpperBoundUsd},
              post_usage_input_tokens = ${azureGeneration ? settlement.inputTokens : null},
              input_token_delta = ${azureGeneration ? settlement.inputTokens - asNumber(current.local_estimated_input_tokens) : null},
              provider_http_status = ${response.status}, provider_response_body = ${responseBody},
              provider_response_headers = ${tx.json(responseHeaders)},
              provider_response_digest = ${hash(responseBody)}, completed_at = ${new Date()}, settled_at = ${new Date()}, updated_at = ${new Date()}
          where operation_key = ${operationKey}
        `;
        await tx`
          update noxia_durable.public_guard_session
          set committed_cost_upper_bound_usd = committed_cost_upper_bound_usd - ${reserved} + ${settlement.committedCostUpperBoundUsd},
              measured_cost_usd = measured_cost_usd + ${settlement.measuredCostUsd},
              updated_at = ${new Date()}, version = version + 1
          where session_key_hash = ${context.sessionKey}
        `;
      });
      progress.lastConfirmedDurableState = qualificationFailureCode
        ? qualificationFailureCode === "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE" ? "INPUT_TOKEN_DIVERGENCE" : "QUALIFICATION_INVALID"
        : settlement ? incomplete ? incompleteState : "COMPLETED_RECEIVED" : unsettledState;
      if (qualificationFailureCode) throw new DurablePublicGuardError(qualificationFailureCode);
      if (incomplete) {
        progress.phase = "PROVIDER_RESULT_VALIDATION";
        throw new DurablePublicGuardError("PUBLIC_PROVIDER_INCOMPLETE");
      }
      if (!settlement) throw new DurablePublicGuardError(!response.ok ? "PUBLIC_PROVIDER_HTTP_FAILURE"
        : unsettledState === "PROVIDER_USAGE_UNSETTLED" ? "PUBLIC_PROVIDER_USAGE_UNVERIFIED"
          : unsettledState === "PROVIDER_RESULT_FAILED" ? "PUBLIC_PROVIDER_RESULT_FAILED"
          : "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH");
      return response;
      } catch (error) {
        // This is diagnostic-only: the same error, durable state, and public response continue unchanged.
        const structuredErrorCode = error instanceof DurablePublicGuardError ? error.code
          : error && typeof error === "object" && "code" in error && typeof error.code === "string"
            ? error.code : null;
        if (!progress.safeExceptionClass) progress.safeExceptionClass = safeExceptionClass(error);
        if (progress.abortSignalAborted === null && init?.signal) progress.abortSignalAborted = init.signal.aborted;
        // A failed transaction cannot establish whether a write committed.
        if (!(error instanceof DurablePublicGuardError) && progress.phase !== "UNKNOWN") {
          progress.lastConfirmedDurableState = "UNKNOWN";
        }
        const diagnostic = readDurableProviderFailureDiagnostic({
          contract: "DURABLE_PROVIDER_TERMINAL_FAILURE",
          ...progress,
          structuredErrorCode,
        });
        if (diagnostic && error && typeof error === "object") {
          try { Object.defineProperty(error, "providerFailureDiagnostic", { value: diagnostic, configurable: true }); }
          catch { /* An immutable exception retains its original failure behavior. */ }
        }
        throw error;
      }
    };
  };

  const completeRequest: PublicProtocolDesignerDurableGuard["completeRequest"] = async (context, status, body) => {
    const now = new Date();
    await sql.begin(async (tx) => {
      const session = await lockSession(tx, context, now);
      const admission = await ensureAdmission(tx, context, session, now, sessionRequestLimit);
      if (admission.row.state === "COMPLETED") {
        if (asNumber(admission.row.response_status) !== status
          || hash(canonicalJson(admission.row.response_body)) !== hash(canonicalJson(body))) {
          throw new DurablePublicGuardError("PUBLIC_COMPLETED_RESULT_DIVERGENCE");
        }
        return;
      }
      await tx`
        update noxia_durable.public_provider_operation
        set state = 'CONSUMED', updated_at = ${now}
        where admission_key = ${context.admissionKey} and state in ('COMPLETED_RECEIVED', 'VALIDATED')
      `;
      await tx`
        update noxia_durable.public_bridge_admission
        set state = 'COMPLETED', response_status = ${status}, response_body = ${tx.json(body as postgres.JSONValue)},
            completed_at = ${now}, updated_at = ${now}
        where admission_key = ${context.admissionKey}
      `;
    });
  };

  const readWorkingDraftPreparation: PublicProtocolDesignerDurableGuard["readWorkingDraftPreparation"] = async (input) => {
    const { sessionId, sourceTurnRef, sourceResponseRef } = input;
    if (!sessionId || sessionId.length > 240 || !sourceTurnRef.startsWith("turn:") || sourceTurnRef.length > 240
      || !/^noxia-turn:[a-f\d-]{36}$/iu.test(sourceResponseRef)) {
      return { state: "REJECTED", status: 404, code: "WORKING_DRAFT_PREPARATION_NOT_FOUND" };
    }
    const clientRequestId = input.clientRequestId ?? `working-draft:${sourceTurnRef}`;
    if (!validWorkingDraftReadRequestId(sourceTurnRef, clientRequestId)) return { state: "REJECTED", status: 404, code: "WORKING_DRAFT_PREPARATION_NOT_FOUND" };
    const admissionKey = hash(`${sessionId}\u0000${clientRequestId}`);
    const sessionKey = hash(sessionId);
    const clientKey = hash(clientAddress(input.headers, input.remoteAddress));
    try {
      // The prior Chat response supplies an unguessable server-issued proof of
      // the exact proposal. Session ID and client address alone are insufficient.
      const chatAdmissionKey = hash(`${sessionId}\u0000product-bridge:${sourceTurnRef}`);
      const chat = await sql`
        select a.session_key_hash, a.state, a.response_status, a.response_body,
          s.client_key_hash
        from noxia_durable.public_bridge_admission a
        join noxia_durable.public_guard_session s on s.session_key_hash = a.session_key_hash
        where a.admission_key = ${chatAdmissionKey}
      `;
      const foreground = chat[0];
      const priorBody = object(foreground?.response_body) ? foreground.response_body : null;
      const priorTurn = priorBody && object(priorBody.assistantTurn) ? priorBody.assistantTurn : null;
      if (!foreground || foreground.session_key_hash !== sessionKey || foreground.client_key_hash !== clientKey
        || foreground.state !== "COMPLETED" || asNumber(foreground.response_status) !== 200
        || priorTurn?.turnId !== sourceResponseRef) {
        return { state: "REJECTED", status: 404, code: "WORKING_DRAFT_PREPARATION_NOT_FOUND" };
      }
      const admissions = await sql`
        select a.state, a.response_status, a.response_body, a.created_at,
          a.session_key_hash, a.client_request_id_hash, s.client_key_hash
        from noxia_durable.public_bridge_admission a
        join noxia_durable.public_guard_session s on s.session_key_hash = a.session_key_hash
        where a.admission_key = ${admissionKey}
      `;
      const admission = admissions[0];
      // Return the same answer for an absent operation and a different session/client.
      if (!admission || admission.session_key_hash !== sessionKey || admission.client_key_hash !== clientKey
        || admission.client_request_id_hash !== hash(clientRequestId)) {
        return { state: "REJECTED", status: 404, code: "WORKING_DRAFT_PREPARATION_NOT_FOUND" };
      }
      if (admission.state === "COMPLETED") {
        if (asNumber(admission.response_status) !== 200) {
          const operations = await sql`select state, provider_response_body from noxia_durable.public_provider_operation
            where admission_key = ${admissionKey} and operation_index = 0`;
          return recoveredWorkingDraftFailure(admission.response_body, operations[0]?.state, operations[0]?.provider_response_body);
        }
        return admission.response_body === null
          ? { state: "UNKNOWN" } : { state: "COMPLETED", response: admission.response_body };
      }
      const operations = await sql`
        select state, count_failure_code, count_lease_expires_at,
          dispatch_lease_expires_at, dispatched_at
        from noxia_durable.public_provider_operation
        where admission_key = ${admissionKey} and operation_index = 0
      `;
      const operation = operations[0];
      if (operation?.state === "COUNT_FAILED") return {
        state: "FAILED", errorCode: typeof operation.count_failure_code === "string" ? operation.count_failure_code : null,
      };
      if (["COUNT_UNKNOWN_AFTER_DISPATCH", "UNKNOWN_AFTER_DISPATCH", "INPUT_TOKEN_DIVERGENCE",
        "QUALIFICATION_INVALID", "CONSUMED"].includes(String(operation?.state))) return { state: "UNKNOWN" };
      const lease = operation?.state === "COUNT_DISPATCHED" ? operation.count_lease_expires_at
        : operation?.state === "DISPATCHED" ? operation.dispatch_lease_expires_at : null;
      const expiresAt = lease ? new Date(lease as string).getTime()
        : new Date(admission.created_at as string).getTime() + PROVIDER_DISPATCH_LEASE_MS;
      return expiresAt > Date.now() ? { state: "IN_PROGRESS" } : { state: "UNKNOWN" };
    } catch {
      throw new DurablePublicGuardError("PUBLIC_DURABLE_STORE_UNAVAILABLE");
    }
  };

  return Object.freeze({ concurrentProviderOperations: true as const, prepareRequest, createBudgetedFetch, completeRequest, readWorkingDraftPreparation,
    close: () => sql.end({ timeout: 5 }) });
};

export const durableGuardConnectionString = (environment: Record<string, string | undefined>) => (
  environment.NOXIA_DURABLE_DATABASE_DATABASE_URL?.trim()
  || environment.NOXIA_DURABLE_DATABASE_URL?.trim()
  || null
);

export const durableGuardSessionRequestLimit = (environment: Record<string, string | undefined>) => {
  const configured = environment.NOXIA_PUBLIC_SESSION_REQUEST_LIMIT?.trim();
  if (!configured) return PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT;
  if (!/^\d+$/u.test(configured)) {
    throw new DurablePublicGuardError("PUBLIC_SESSION_LIMIT_CONFIGURATION_INVALID");
  }
  const limit = Number(configured);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new DurablePublicGuardError("PUBLIC_SESSION_LIMIT_CONFIGURATION_INVALID");
  }
  return limit;
};

export const durableGuardPublicBudget = (environment: Record<string, string | undefined>) => {
  const preview = environment.VERCEL_ENV === "preview";
  const production = environment.VERCEL_ENV === "production";
  const configured = preview ? environment.NOXIA_PREVIEW_PUBLIC_SOFT_STOP_USD
    : production ? environment.NOXIA_PUBLIC_SOFT_STOP_USD : undefined;
  if (configured === undefined) return PUBLIC_PROTOCOL_DESIGNER_BUDGET;
  if (configured !== "3") throw new DurablePublicGuardError(preview
    ? "PUBLIC_PREVIEW_SOFT_STOP_CONFIGURATION_INVALID"
    : "PUBLIC_PRODUCTION_SOFT_STOP_CONFIGURATION_INVALID");
  return Object.freeze({ ...PUBLIC_PROTOCOL_DESIGNER_BUDGET, measuredCostSoftStopUsd: 3 });
};

const sharedGuards = new Map<string, PublicProtocolDesignerDurableGuard>();

export const sharedPostgresProtocolDesignerDurableGuard = (
  connectionString: string,
  sessionRequestLimit = PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT,
  budgetPolicy: PublicBudgetPolicy = PUBLIC_PROTOCOL_DESIGNER_BUDGET,
) => {
  const key = hash(`${connectionString}\u0000${sessionRequestLimit}\u0000${budgetPolicy.measuredCostSoftStopUsd}`);
  const existing = sharedGuards.get(key);
  if (existing) return existing;
  const guard = createPostgresProtocolDesignerDurableGuard(connectionString, { sessionRequestLimit, budgetPolicy });
  sharedGuards.set(key, guard);
  return guard;
};

/**
 * Explicit unit-test dependency only. The public handler never selects this
 * adapter from environment or on store failure.
 */
export const createMemoryProtocolDesignerGuardForTests = (): PublicProtocolDesignerDurableGuard => {
  const completed = new Map<string, { requestDigest: string; status: number; body: unknown }>();
  const prepared = new Map<string, DurablePublicRequestContext>();
  const prepareRequest: PublicProtocolDesignerDurableGuard["prepareRequest"] = async (input) => {
    const identity = publicIdentity(input.body);
    if (!identity) return denial("PUBLIC_SESSION_REQUIRED");
    const context: DurablePublicRequestContext = Object.freeze({
      admitted: true,
      admissionKey: hash(`${identity.sessionId}\u0000${identity.clientRequestId}`),
      sessionKey: hash(identity.sessionId),
      clientKey: hash(clientAddress(input.headers, input.remoteAddress)),
      clientRequestIdHash: hash(identity.clientRequestId),
      requestDigest: hash(canonicalJson(input.body)),
    });
    const existing = completed.get(context.admissionKey);
    if (existing) {
      if (existing.requestDigest !== context.requestDigest) return denial("PUBLIC_STALE_OPERATION_REJECTED");
      return { recovered: true, status: existing.status, body: existing.body };
    }
    const admission = admitPublicProtocolDesignerRequest({
      headers: input.headers,
      remoteAddress: input.remoteAddress,
      body: input.body,
    });
    if ("code" in admission) return admission;
    prepared.set(context.admissionKey, context);
    return Object.freeze({ ...context, sessionKey: admission.sessionKey });
  };
  return Object.freeze({
    prepareRequest,
    createBudgetedFetch: (context, fetchImpl = fetch) => createPublicProtocolDesignerBudgetedFetch(context.sessionKey, fetchImpl),
    async completeRequest(context, status, body) {
      const existing = completed.get(context.admissionKey);
      if (existing && (existing.requestDigest !== context.requestDigest
        || existing.status !== status || canonicalJson(existing.body) !== canonicalJson(body))) {
        throw new DurablePublicGuardError("PUBLIC_COMPLETED_RESULT_DIVERGENCE");
      }
      completed.set(context.admissionKey, { requestDigest: context.requestDigest, status, body });
    },
    readWorkingDraftPreparation: async (input): Promise<DurableWorkingDraftRecovery> => {
      const clientRequestId = input.clientRequestId ?? `working-draft:${input.sourceTurnRef}`;
      if (!validWorkingDraftReadRequestId(input.sourceTurnRef, clientRequestId)) return { state: "REJECTED", status: 404, code: "WORKING_DRAFT_PREPARATION_NOT_FOUND" };
      const key = hash(`${input.sessionId}\u0000${clientRequestId}`);
      const context = prepared.get(key);
      const chatKey = hash(`${input.sessionId}\u0000product-bridge:${input.sourceTurnRef}`);
      const chat = completed.get(chatKey);
      const chatBody = object(chat?.body) ? chat.body : null;
      const assistantTurn = chatBody && object(chatBody.assistantTurn) ? chatBody.assistantTurn : null;
      if (!context || context.sessionKey !== hash(input.sessionId)
        || context.clientKey !== hash(clientAddress(input.headers, input.remoteAddress))
        || chat?.status !== 200 || assistantTurn?.turnId !== input.sourceResponseRef) {
        return { state: "REJECTED", status: 404, code: "WORKING_DRAFT_PREPARATION_NOT_FOUND" };
      }
      const result = completed.get(key);
      return !result ? { state: "IN_PROGRESS" }
        : result.status !== 200 ? recoveredWorkingDraftFailure(result.body)
          : { state: "COMPLETED", response: result.body };
    },
    async close() {},
  });
};

// A checkpoint adds an identity suffix; it never replaces the server-issued Chat proof.
const validWorkingDraftReadRequestId = (source: string, id: string) => id === `working-draft:${source}`
  || id.startsWith(`working-draft:${source}:checkpoint:`) && /^ke1-[a-f0-9]{16}$/.test(id.slice(`working-draft:${source}:checkpoint:`.length));
