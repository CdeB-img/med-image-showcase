import { createHash } from "node:crypto";
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
} from "./protocol-designer-canary-policy.js";
import {
  openAIInputCountRequest,
  readOpenAIInputTokenCount,
} from "./protocol-designer-provider-replay.js";
import { azureInputCountQualification, isOpenAIResponsesEndpoint, openAIProviderDestinationFromEndpoint, supportsOpenAIExactInputCount } from "./protocol-designer-openai-provider-config.js";

type Headers = Record<string, string | string[] | undefined>;
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

export interface PublicProtocolDesignerDurableGuard {
  prepareRequest(input: Readonly<{
    headers: Headers;
    remoteAddress?: string;
    body: unknown;
  }>): Promise<DurablePublicRequestPreparation>;
  createBudgetedFetch(context: DurablePublicRequestContext, fetchImpl?: typeof fetch, openAIInputCountApiKey?: string): typeof fetch;
  completeRequest(context: DurablePublicRequestContext, status: number, body: unknown): Promise<void>;
  close(): Promise<void>;
}

export class DurablePublicGuardError extends Error {
  constructor(
    readonly code: string,
    readonly status: 400 | 429 | 503 = 503,
  ) {
    super(code);
    this.name = "DurablePublicGuardError";
  }
}

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

const assertAzureEquivalenceOpen = async (tx: TransactionQuery, endpointDigest: string, model: string, qualificationRef: string) => {
  await tx`
    insert into noxia_durable.public_provider_equivalence_gate
      (generation_endpoint_digest, generation_model, count_qualification_ref, state)
    values (${endpointDigest}, ${model}, ${qualificationRef}, 'OPEN')
    on conflict (generation_endpoint_digest, generation_model) do nothing
  `;
  const rows = await tx`
    select state, count_qualification_ref from noxia_durable.public_provider_equivalence_gate
    where generation_endpoint_digest = ${endpointDigest} and generation_model = ${model}
    for update
  `;
  if (rows[0]?.state !== "OPEN" || rows[0]?.count_qualification_ref !== qualificationRef)
    throw new DurablePublicGuardError("PUBLIC_AZURE_INPUT_COUNT_EQUIVALENCE_CLOSED");
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

export const migrateProtocolDesignerDurableGuard = async (sql: Sql) => {
  await sql`create schema if not exists noxia_durable`;
  await sql.unsafe(`
    create table if not exists noxia_durable.public_guard_session (
      session_key_hash text primary key, client_key_hash text not null,
      admission_count integer not null default 0 check (admission_count >= 0),
      quota_updated_at timestamptz not null,
      measured_cost_usd numeric(18, 10) not null default 0 check (measured_cost_usd >= 0),
      committed_cost_upper_bound_usd numeric(18, 10) not null default 0 check (committed_cost_upper_bound_usd >= measured_cost_usd),
      provider_gate_closed boolean not null default false, version bigint not null default 0,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    );
    create table if not exists noxia_durable.public_bridge_admission (
      admission_key text primary key,
      session_key_hash text not null references noxia_durable.public_guard_session(session_key_hash),
      client_request_id_hash text not null, request_digest text not null,
      state text not null check (state in ('COUNTING', 'ACTIVE', 'COMPLETED')),
      response_status integer, response_body jsonb, created_at timestamptz not null default now(),
      completed_at timestamptz, updated_at timestamptz not null default now()
    );
    create index if not exists public_bridge_admission_session_idx
      on noxia_durable.public_bridge_admission(session_key_hash, created_at);
    create table if not exists noxia_durable.public_provider_operation (
      operation_key text primary key,
      admission_key text not null references noxia_durable.public_bridge_admission(admission_key),
      session_key_hash text not null references noxia_durable.public_guard_session(session_key_hash),
      operation_index integer not null check (operation_index >= 0), purpose text,
      endpoint_digest text not null, payload_digest text not null, configuration_digest text not null,
      state text not null check (state in (
        'COUNT_PENDING', 'COUNT_DISPATCHED', 'COUNT_COMPLETED', 'COUNT_FAILED', 'COUNT_UNKNOWN_AFTER_DISPATCH',
        'RESERVED', 'DISPATCHED', 'COMPLETED_RECEIVED', 'VALIDATED', 'CONSUMED', 'UNKNOWN_AFTER_DISPATCH',
        'INPUT_TOKEN_DIVERGENCE', 'QUALIFICATION_INVALID'
      )),
      reserved_upper_bound_usd numeric(18, 10) not null check (reserved_upper_bound_usd >= 0),
      measured_cost_usd numeric(18, 10), committed_cost_upper_bound_usd numeric(18, 10),
      provider_http_status integer, provider_response_body text, provider_response_headers jsonb,
      provider_response_digest text, dispatched_at timestamptz, dispatch_lease_expires_at timestamptz,
      completed_at timestamptz, settled_at timestamptz,
      count_payload_digest text, counted_input_tokens integer check (counted_input_tokens > 0),
      count_model text, count_pricing_snapshot_date text, count_http_status integer,
      count_response_digest text, count_failure_code text, count_dispatched_at timestamptz,
      count_lease_expires_at timestamptz, count_completed_at timestamptz,
      count_provider text, generation_provider text, generation_model text, count_qualification_ref text,
      qualification_failure_code text,
      post_usage_input_tokens integer, input_token_delta integer,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      unique (admission_key, operation_index)
    );
    create index if not exists public_provider_operation_session_idx
      on noxia_durable.public_provider_operation(session_key_hash, created_at);
    alter table noxia_durable.public_provider_operation
      add column if not exists dispatch_lease_expires_at timestamptz;
    alter table noxia_durable.public_bridge_admission
      drop constraint if exists public_bridge_admission_state_check;
    alter table noxia_durable.public_bridge_admission
      add constraint public_bridge_admission_state_check
      check (state in ('COUNTING', 'ACTIVE', 'COMPLETED'));
    alter table noxia_durable.public_provider_operation
      drop constraint if exists public_provider_operation_state_check;
    alter table noxia_durable.public_provider_operation
      add constraint public_provider_operation_state_check
      check (state in (
        'COUNT_PENDING', 'COUNT_DISPATCHED', 'COUNT_COMPLETED', 'COUNT_FAILED', 'COUNT_UNKNOWN_AFTER_DISPATCH',
        'RESERVED', 'DISPATCHED', 'COMPLETED_RECEIVED', 'VALIDATED', 'CONSUMED', 'UNKNOWN_AFTER_DISPATCH',
        'INPUT_TOKEN_DIVERGENCE', 'QUALIFICATION_INVALID'
      ));
    alter table noxia_durable.public_provider_operation
      drop constraint if exists public_provider_operation_reserved_upper_bound_usd_check;
    alter table noxia_durable.public_provider_operation
      add constraint public_provider_operation_reserved_upper_bound_usd_check
      check (reserved_upper_bound_usd >= 0);
    alter table noxia_durable.public_provider_operation
      add column if not exists count_payload_digest text,
      add column if not exists counted_input_tokens integer,
      add column if not exists count_model text,
      add column if not exists count_pricing_snapshot_date text,
      add column if not exists count_http_status integer,
      add column if not exists count_response_digest text,
      add column if not exists count_failure_code text,
      add column if not exists count_dispatched_at timestamptz,
      add column if not exists count_lease_expires_at timestamptz,
      add column if not exists count_completed_at timestamptz,
      add column if not exists count_provider text,
      add column if not exists generation_provider text,
      add column if not exists generation_model text,
      add column if not exists count_qualification_ref text,
      add column if not exists qualification_failure_code text,
      add column if not exists post_usage_input_tokens integer,
      add column if not exists input_token_delta integer;
    create table if not exists noxia_durable.public_provider_equivalence_gate (
      generation_endpoint_digest text not null,
      generation_model text not null,
      count_qualification_ref text not null,
      state text not null check (state in ('OPEN', 'CLOSED')),
      anomaly_operation_key text,
      invalidated_at timestamptz,
      primary key (generation_endpoint_digest, generation_model)
    );
    alter table noxia_durable.public_provider_equivalence_gate
      add column if not exists count_qualification_ref text;
    create table if not exists noxia_durable.public_rate_bucket (
      client_key_hash text primary key, window_started_at timestamptz not null,
      request_count integer not null check (request_count >= 0), updated_at timestamptz not null default now()
    );
  `);
};

export const createPostgresProtocolDesignerDurableGuard = (
  connectionString: string,
  options: Readonly<{ maxConnections?: number; sessionRequestLimit?: number }> = {},
): PublicProtocolDesignerDurableGuard => {
  const sessionRequestLimit = options.sessionRequestLimit ?? PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT;
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

  const createBudgetedFetch: PublicProtocolDesignerDurableGuard["createBudgetedFetch"] = (context, fetchImpl = fetch, openAIInputCountApiKey) => {
    let operationIndex = 0;
    return async (input, init) => {
      const index = operationIndex++;
      const request = providerRequest(input, init);
      const uncountedBound = request.body === null ? null : boundCanaryProviderCall(request.endpoint, request.body);
      const azureGeneration = openAIProviderDestinationFromEndpoint(request.endpoint) === "azure";
      const qualificationRef = azureGeneration && uncountedBound
        ? azureInputCountQualification(uncountedBound.model) : null;
      if (azureGeneration && !openAIInputCountApiKey?.trim()) {
        throw new DurablePublicGuardError("PUBLIC_AZURE_PRECOUNT_CREDENTIAL_MISSING");
      }
      if (azureGeneration && !qualificationRef) {
        throw new DurablePublicGuardError("PUBLIC_AZURE_INPUT_COUNT_MODEL_PAIR_UNQUALIFIED");
      }
      const endpointDigest = hash(request.endpoint);
      const payloadDigest = hash(request.body ?? "NO_BODY");
      const configurationDigest = hash(canonicalJson({
        purpose: request.observation?.purpose ?? null,
        reasoningEffort: request.observation?.reasoningEffort ?? null,
        retryIndex: request.observation?.retryIndex ?? null,
      }));
      const operationKey = hash(`${context.admissionKey}\u0000${index}`);
      const countRequest = request.body !== null && supportsOpenAIExactInputCount(request.endpoint)
        ? openAIInputCountRequest({ endpoint: request.endpoint, method: "POST", body: request.body })
        : null;
      const countPayloadDigest = countRequest ? hash(countRequest.body) : null;
      const identityMatches = (row: OperationRow) => row.endpoint_digest === endpointDigest
        && row.payload_digest === payloadDigest
        && row.configuration_digest === configurationDigest
        && row.count_payload_digest === countPayloadDigest
        && (!azureGeneration || (row.count_provider === "OPENAI"
          && row.generation_provider === "AZURE_OPENAI" && row.generation_model === uncountedBound?.model
          && row.count_qualification_ref === qualificationRef));
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
            if (azureGeneration) await assertAzureEquivalenceOpen(tx, endpointDigest, uncountedBound.model, qualificationRef!);
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
                ${azureGeneration ? "OPENAI" : null}, ${azureGeneration ? "AZURE_OPENAI" : null},
                ${azureGeneration ? uncountedBound.model : null}, ${qualificationRef}, ${now}, ${now}
              ) returning *
            `;
            return inserted[0] as OperationRow;
          });
          if ("denial" in prepared) throw new DurablePublicGuardError(prepared.denial);
          operation = prepared;

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
            let countResponse: Response;
            try {
              countResponse = await fetchImpl(countRequest.endpoint, {
                ...request.init,
                method: countRequest.method,
                body: countRequest.body,
                ...(azureGeneration ? { headers: {
                  "content-type": "application/json",
                  authorization: `Bearer ${openAIInputCountApiKey}`,
                } } : {}),
              });
            } catch (error) {
              const code = error instanceof Error && error.name === "AbortError"
                ? "PUBLIC_PROVIDER_INPUT_COUNT_TIMEOUT" : "PUBLIC_PROVIDER_INPUT_COUNT_NETWORK_FAILURE";
              await failCount(code);
              throw new DurablePublicGuardError(code);
            }
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
          }
          if (operation.counted_input_tokens) {
            bound = boundCanaryProviderCall(request.endpoint, request.body!, asNumber(operation.counted_input_tokens));
          }
        }

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
          if (azureGeneration && uncountedBound) await assertAzureEquivalenceOpen(tx, endpointDigest, uncountedBound.model, qualificationRef!);
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
          if (existing?.state === "INPUT_TOKEN_DIVERGENCE") return { denial: "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE" };
          if (existing?.state === "QUALIFICATION_INVALID") return { denial: existing.qualification_failure_code ?? "PUBLIC_AZURE_QUALIFICATION_INVALID" };
          if (existing?.state === "RESERVED") return existing;
          if (countRequest && existing?.state !== "COUNT_COMPLETED") {
            return { denial: existing?.state === "COUNT_FAILED"
              ? existing.count_failure_code ?? "PUBLIC_PROVIDER_INPUT_COUNT_FAILED"
              : "PUBLIC_PROVIDER_INPUT_COUNT_NOT_COMPLETED" };
          }
          const counted = existing?.counted_input_tokens ? asNumber(existing.counted_input_tokens) : undefined;
          const exactBound = request.body === null ? null : boundCanaryProviderCall(request.endpoint, request.body, counted);
          if (session.provider_gate_closed) return { denial: "PUBLIC_SESSION_BUDGET_CLOSED" };
          const measured = asNumber(session.measured_cost_usd);
          const committed = asNumber(session.committed_cost_upper_bound_usd);
          const admission = canaryBudgetAdmission(committed, exactBound, measured, PUBLIC_PROTOCOL_DESIGNER_BUDGET);
          if (admission !== "ADMITTED" || !exactBound) {
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
              set state = 'RESERVED', reserved_upper_bound_usd = ${exactBound.upperBoundUsd}, updated_at = ${reservationNow}
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
                reserved_upper_bound_usd, created_at, updated_at
              ) values (
                ${operationKey}, ${context.admissionKey}, ${context.sessionKey}, ${index}, ${operationPurpose},
                ${endpointDigest}, ${payloadDigest}, ${configurationDigest}, 'RESERVED',
                ${exactBound.upperBoundUsd}, ${reservationNow}, ${reservationNow}
              ) returning *
            `;
            reserved = inserted[0] as OperationRow;
          }
          await tx`
            update noxia_durable.public_guard_session
            set committed_cost_upper_bound_usd = committed_cost_upper_bound_usd + ${exactBound.upperBoundUsd},
                updated_at = ${reservationNow}, version = version + 1
            where session_key_hash = ${context.sessionKey}
          `;
          bound = exactBound;
          return reserved;
        });
        if ("denial" in reservation) throw new DurablePublicGuardError(reservation.denial);
        operation = reservation;
        if (operation.counted_input_tokens && request.body !== null) {
          bound = boundCanaryProviderCall(request.endpoint, request.body, asNumber(operation.counted_input_tokens));
        }
      } catch (error) {
        if (error instanceof DurablePublicGuardError) throw error;
        throw new DurablePublicGuardError("PUBLIC_DURABLE_STORE_UNAVAILABLE");
      }

      if (["COMPLETED_RECEIVED", "VALIDATED", "CONSUMED"].includes(operation.state)) {
        return recoveredProviderResponse(operation);
      }

      try {
        await sql.begin(async (tx) => {
          const rows = await tx`
            select state from noxia_durable.public_provider_operation
            where operation_key = ${operationKey}
            for update
          `;
          if (rows[0]?.state !== "RESERVED") throw new DurablePublicGuardError("PUBLIC_PROVIDER_OPERATION_NOT_RESERVED");
          if (azureGeneration && bound) await assertAzureEquivalenceOpen(tx, endpointDigest, bound.model, qualificationRef!);
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'DISPATCHED', dispatched_at = ${new Date()},
                dispatch_lease_expires_at = ${new Date(Date.now() + PROVIDER_DISPATCH_LEASE_MS)}, updated_at = ${new Date()}
            where operation_key = ${operationKey}
          `;
        });
      } catch (error) {
        if (error instanceof DurablePublicGuardError) throw error;
        throw new DurablePublicGuardError("PUBLIC_DURABLE_STORE_UNAVAILABLE");
      }

      let response: Response;
      try {
        response = await fetchImpl(input, request.init);
      } catch {
        await sql.begin(async (tx) => {
          await lockSession(tx, context, new Date());
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'UNKNOWN_AFTER_DISPATCH', updated_at = ${new Date()}
            where operation_key = ${operationKey} and state = 'DISPATCHED'
          `;
        });
        throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH");
      }

      let responseBody: string;
      try { responseBody = await response.clone().text(); }
      catch {
        await sql.begin(async (tx) => {
          await tx`
            update noxia_durable.public_provider_operation
            set state = 'UNKNOWN_AFTER_DISPATCH', provider_http_status = ${response.status}, updated_at = ${new Date()}
            where operation_key = ${operationKey} and state = 'DISPATCHED'
          `;
        });
        throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH");
      }

      const settlement = response.ok && bound ? settleCanaryProviderCall(bound, responseBody) : null;
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
          if (!providerBody) {
            qualificationFailureCode = "PUBLIC_AZURE_RESPONSE_UNREADABLE";
          } else if (typeof providerBody.model !== "string" || providerBody.model !== current.generation_model) {
            qualificationFailureCode = "PUBLIC_AZURE_GENERATION_MODEL_DRIFT";
          } else if (!Number.isSafeInteger(postInput) || typeof postInput !== "number"
            || postInput <= 0 || current.counted_input_tokens === null) {
            qualificationFailureCode = "PUBLIC_AZURE_POST_USAGE_INPUT_TOKENS_MISSING";
          } else if (typeof postInput === "number" && current.counted_input_tokens !== null
            && postInput !== asNumber(current.counted_input_tokens)) {
            qualificationFailureCode = "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE";
          }
          if (qualificationFailureCode) {
            const now = new Date();
            await tx`
              update noxia_durable.public_provider_operation
              set state = ${qualificationFailureCode === "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE" ? "INPUT_TOKEN_DIVERGENCE" : "QUALIFICATION_INVALID"},
                  qualification_failure_code = ${qualificationFailureCode},
                  post_usage_input_tokens = ${typeof postInput === "number" && Number.isSafeInteger(postInput) ? postInput : null},
                  input_token_delta = ${typeof postInput === "number" && Number.isSafeInteger(postInput) && current.counted_input_tokens !== null
                    ? postInput - asNumber(current.counted_input_tokens) : null},
                  provider_http_status = ${response.status}, provider_response_body = ${responseBody},
                  provider_response_headers = ${tx.json(responseHeaders)}, provider_response_digest = ${hash(responseBody)},
                  completed_at = ${now}, updated_at = ${now}
              where operation_key = ${operationKey}
            `;
            await tx`
              update noxia_durable.public_provider_equivalence_gate
              set state = 'CLOSED', anomaly_operation_key = ${operationKey}, invalidated_at = ${now}
              where generation_endpoint_digest = ${endpointDigest} and generation_model = ${current.generation_model}
                and count_qualification_ref = ${qualificationRef}
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
            set state = 'UNKNOWN_AFTER_DISPATCH', provider_http_status = ${response.status},
                provider_response_body = ${responseBody}, provider_response_headers = ${tx.json(responseHeaders)},
                provider_response_digest = ${hash(responseBody)}, completed_at = ${new Date()}, updated_at = ${new Date()}
            where operation_key = ${operationKey}
          `;
          return;
        }
        const reserved = asNumber(current.reserved_upper_bound_usd);
        await tx`
          update noxia_durable.public_provider_operation
          set state = 'COMPLETED_RECEIVED', measured_cost_usd = ${settlement.measuredCostUsd},
              committed_cost_upper_bound_usd = ${settlement.committedCostUpperBoundUsd},
              post_usage_input_tokens = ${azureGeneration ? asNumber(current.counted_input_tokens) : null},
              input_token_delta = ${azureGeneration ? 0 : null},
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
      if (qualificationFailureCode) throw new DurablePublicGuardError(qualificationFailureCode);
      if (!settlement) throw new DurablePublicGuardError("PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH");
      return response;
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

  return Object.freeze({ prepareRequest, createBudgetedFetch, completeRequest, close: () => sql.end({ timeout: 5 }) });
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

const sharedGuards = new Map<string, PublicProtocolDesignerDurableGuard>();

export const sharedPostgresProtocolDesignerDurableGuard = (
  connectionString: string,
  sessionRequestLimit = PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT,
) => {
  const key = hash(`${connectionString}\u0000${sessionRequestLimit}`);
  const existing = sharedGuards.get(key);
  if (existing) return existing;
  const guard = createPostgresProtocolDesignerDurableGuard(connectionString, { sessionRequestLimit });
  sharedGuards.set(key, guard);
  return guard;
};

/**
 * Explicit unit-test dependency only. The public handler never selects this
 * adapter from environment or on store failure.
 */
export const createMemoryProtocolDesignerGuardForTests = (): PublicProtocolDesignerDurableGuard => {
  const completed = new Map<string, { requestDigest: string; status: number; body: unknown }>();
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
    async close() {},
  });
};
