import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPostgresProtocolDesignerDurableGuard,
  type PublicProtocolDesignerDurableGuard,
} from "../../../../server/protocol-designer-durable-guard";
import { readDurableProviderFailureDiagnostic } from "../provider-call-observability";
import { AZURE_LOCAL_INPUT_POLICY, boundPublicProviderCall } from "../../../../server/protocol-designer-local-token-admission";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../product-bridge";
import { createFunctionalResetSession } from "../functional-reset/session";
import { addProjectPreparation, captureProjectPreparation, consumeProjectPreparation, projectPreparationReview } from "../functional-reset/project-preparation-lifecycle";
import { prepareWorkingDraftRequest } from "../functional-reset/continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "../functional-reset/__tests__/study-proposal-fixtures";

type Row = Record<string, unknown>;
type SqlTag = ((parts: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>) & {
  begin: <T>(callback: (transaction: SqlTag) => Promise<T>) => Promise<T>;
  json: (value: unknown) => unknown;
  end: () => Promise<void>;
};
type FakeStore = {
  session: Row | null;
  admission: Row | null;
  operation: Row | null;
  gate: Row | null;
  rate: Row | null;
  failSettlement: boolean;
  initialAdmissionCount: number;
  historicalAnomalyCode?: string;
  sql: SqlTag;
};
let store: FakeStore;
vi.mock("postgres", () => ({ default: () => store.sql }));

const fakeStore = (): FakeStore => {
  const db: FakeStore = { session: null, admission: null, operation: null, gate: null,
    rate: null, failSettlement: false, initialAdmissionCount: 0, sql: null as unknown as SqlTag };
  const query = async (parts: TemplateStringsArray, ...values: unknown[]): Promise<Row[]> => {
    const sql = parts.join(" ? ").replace(/\s+/gu, " ").toLowerCase();
    if (sql.includes("select a.*, s.client_key_hash")) return db.admission && db.session
      ? [{ ...db.admission, client_key_hash: db.session.client_key_hash }] : [];
    if (sql.includes("insert into noxia_durable.public_guard_session")) {
      db.session ??= { session_key_hash: values[0], client_key_hash: values[1], admission_count: db.initialAdmissionCount,
        quota_updated_at: values[2], measured_cost_usd: 0, committed_cost_upper_bound_usd: 0,
        provider_gate_closed: false };
      return [];
    }
    if (sql.includes("select * from noxia_durable.public_guard_session")) return db.session ? [db.session] : [];
    if (sql.includes("insert into noxia_durable.public_bridge_admission")) {
      db.admission ??= { admission_key: values[0], session_key_hash: values[1],
        client_request_id_hash: values[2], request_digest: values[3], state: sql.includes("'counting'") ? "COUNTING" : "ACTIVE" };
      return [db.admission];
    }
    if (sql.includes("select * from noxia_durable.public_bridge_admission")) return db.admission ? [db.admission] : [];
    if (sql.includes("update noxia_durable.public_bridge_admission") && sql.includes("set state = 'active'")) {
      if (db.admission) db.admission.state = "ACTIVE";
      return db.admission ? [db.admission] : [];
    }
    if (sql.includes("insert into noxia_durable.public_rate_bucket")) {
      db.rate ??= { window_started_at: values[1], request_count: 0 };
      return [];
    }
    if (sql.includes("select window_started_at, request_count")) return db.rate ? [db.rate] : [];
    if (sql.includes("update noxia_durable.public_rate_bucket")) {
      if (db.rate) Object.assign(db.rate, { window_started_at: values[0], request_count: values[1] });
      return [];
    }
    if (sql.includes("insert into noxia_durable.public_provider_equivalence_gate")) {
      db.gate ??= { state: "OPEN", count_qualification_ref: values[2], invalidated_at: null, anomaly_operation_key: null };
      return [];
    }
    if (sql.includes("select local_admission_state, local_admission_policy")) return db.gate ? [db.gate] : [];
    if (sql.includes("update noxia_durable.public_provider_equivalence_gate")) {
      if (db.gate && sql.includes("set local_admission_policy") && !db.gate.local_admission_policy && !db.gate.local_admission_state) {
        Object.assign(db.gate, { local_admission_policy: values[0],
          local_admission_state: db.gate.state === "OPEN" || db.historicalAnomalyCode === "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE"
            ? "OPEN" : "CLOSED", local_policy_activated_at: values[1] });
      } else if (db.gate && sql.includes("set local_admission_state = 'closed'")) {
        Object.assign(db.gate, { local_admission_state: "CLOSED", local_anomaly_operation_key: values[0], local_invalidated_at: values[1] });
      }
      return [];
    }
    if (sql.includes("insert into noxia_durable.public_provider_operation")) {
      const counted = sql.includes("'count_pending'");
      db.operation = { operation_key: values[0], admission_key: values[1], session_key_hash: values[2],
        endpoint_digest: values[5], payload_digest: values[6], configuration_digest: values[7],
        state: counted ? "COUNT_PENDING" : "RESERVED", reserved_upper_bound_usd: counted ? 0 : values[8],
        count_payload_digest: counted ? values[8] : null, counted_input_tokens: null,
        count_provider: counted ? values[11] : null, generation_provider: counted ? values[12] : values[11],
        generation_model: counted ? values[13] : values[12], count_qualification_ref: counted ? values[14] : null,
        input_admission_policy: counted ? null : values[13], local_estimated_input_tokens: counted ? null : values[14],
        input_token_upper_bound: counted ? null : values[15] };
      return [db.operation];
    }
    if (sql.includes("select * from noxia_durable.public_provider_operation")
      || sql.includes("select state from noxia_durable.public_provider_operation")) return db.operation ? [db.operation] : [];
    if (sql.includes("update noxia_durable.public_provider_operation")) {
      if (!db.operation) return [];
      if (sql.includes("set state = 'count_dispatched'")) db.operation.state = "COUNT_DISPATCHED";
      else if (sql.includes("set state = 'count_failed'")) {
        db.operation.state = "COUNT_FAILED";
        db.operation.count_http_status = values[0];
        db.operation.count_failure_code = values[1];
      } else if (sql.includes("set state = 'count_completed'")) {
        db.operation.state = "COUNT_COMPLETED";
        db.operation.counted_input_tokens = values[0];
        db.operation.count_http_status = values[1];
      } else if (sql.includes("set state = 'reserved'")) {
        db.operation.state = "RESERVED";
        db.operation.reserved_upper_bound_usd = values[0];
      } else if (sql.includes("set state = 'dispatched'")) db.operation.state = "DISPATCHED";
      else if (sql.includes("set state = 'unknown_after_dispatch'")) {
        db.operation.state = "UNKNOWN_AFTER_DISPATCH";
        if (sql.includes("provider_http_status")) db.operation.provider_http_status = values[0];
        if (sql.includes("provider_response_body")) db.operation.provider_response_body = values[1];
      } else if (sql.includes("set state = 'count_unknown_after_dispatch'")) db.operation.state = "COUNT_UNKNOWN_AFTER_DISPATCH";
      else if (sql.includes("set state = 'completed_received'")) {
        if (db.failSettlement) throw new Error("SYNTHETIC_SQL_SETTLEMENT_FAILURE");
        db.operation.state = "COMPLETED_RECEIVED";
        db.operation.measured_cost_usd = values[0];
        db.operation.committed_cost_upper_bound_usd = values[1];
        db.operation.provider_http_status = values[4];
        db.operation.post_usage_input_tokens = values[2];
        db.operation.input_token_delta = values[3];
        db.operation.provider_response_body = values[5];
        db.operation.provider_response_headers = values[6];
      } else if (sql.includes("set state = ?")) {
        db.operation.state = values[0];
        db.operation.qualification_failure_code = values[1];
        db.operation.provider_http_status = values[4];
      } else throw new Error("UNHANDLED_OPERATION_UPDATE");
      return sql.includes("returning *") ? [db.operation] : [];
    }
    if (sql.includes("update noxia_durable.public_guard_session")) {
      if (!db.session) return [];
      if (sql.includes("set admission_count")) db.session.admission_count = values[0];
      else if (sql.includes("set committed_cost_upper_bound_usd = committed_cost_upper_bound_usd +")) {
        db.session.committed_cost_upper_bound_usd = Number(db.session.committed_cost_upper_bound_usd) + Number(values[0]);
      } else if (sql.includes("set committed_cost_upper_bound_usd = committed_cost_upper_bound_usd -")) {
        db.session.committed_cost_upper_bound_usd = Number(db.session.committed_cost_upper_bound_usd) - Number(values[0]) + Number(values[1]);
        db.session.measured_cost_usd = Number(db.session.measured_cost_usd) + Number(values[2]);
      } else if (sql.includes("set provider_gate_closed = true")) db.session.provider_gate_closed = true;
      return [];
    }
    throw new Error(`UNHANDLED_SYNTHETIC_SQL:${sql.slice(0, 110)}`);
  };
  db.sql = Object.assign(query, {
    begin: async <T>(callback: (transaction: SqlTag) => Promise<T>) => callback(db.sql),
    json: (value: unknown) => value,
    end: async () => {},
  });
  return db;
};

const ENDPOINT = "https://synthetic.services.ai.azure.com/api/projects/qualification/openai/v1/responses";
const COUNT_ENDPOINT = "https://api.openai.com/v1/responses/input_tokens";
const INPUT = 100;
const requestBody = JSON.stringify({ model: "gpt-5.6-sol", instructions: "synthetic", input: "synthetic",
  reasoning: { effort: "medium" }, max_output_tokens: 8_000, store: false, service_tier: "default" });
const observation = { purpose: "CONVERSATION_REALIZATION", reasoningEffort: "medium", retryIndex: 0,
  context: { sessionId: "synthetic-session", turnId: "synthetic-turn", clientRequestId: "synthetic-request" } };
const countSuccess = (tokens = INPUT) => new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: tokens }), { status: 200 });
const generation = (options: { status?: number; responseStatus?: string; input?: number; reason?: string; model?: string; omitUsage?: boolean } = {}) =>
  new Response(JSON.stringify({ model: options.model ?? "gpt-5.6-sol", status: options.responseStatus ?? "completed",
    ...(options.reason ? { incomplete_details: { reason: options.reason } } : {}),
    ...(!options.omitUsage ? { usage: { input_tokens: options.input ?? INPUT, output_tokens: 30,
      total_tokens: (options.input ?? INPUT) + 30 } } : {}) }),
  { status: options.status ?? 200 });

let guard: PublicProtocolDesignerDurableGuard;
beforeEach(() => { store = fakeStore(); guard = createPostgresProtocolDesignerDurableGuard("postgres://synthetic", { sessionRequestLimit: 512 }); });
afterEach(async () => { await guard.close(); });

const run = async (provider: typeof fetch, options: { sessionId?: string; clientRequestId?: string; endpoint?: string; body?: string } = {}) => {
  const sessionId = options.sessionId ?? "synthetic-session";
  const clientRequestId = options.clientRequestId ?? "synthetic-request";
  const prepared = await guard.prepareRequest({ headers: { "x-forwarded-for": "203.0.113.9" }, body: {
    observabilityContext: { sessionId, conversationId: "synthetic-conversation",
      turnId: "synthetic-turn", clientRequestId },
  } });
  if (!("admitted" in prepared) || !prepared.admitted) throw new Error("SYNTHETIC_PREPARE_FAILED");
  const budgeted = guard.createBudgetedFetch(prepared, provider);
  const controller = new AbortController();
  try {
    const response = await budgeted(options.endpoint ?? ENDPOINT, { method: "POST", body: options.body ?? requestBody, signal: controller.signal,
      noxiaProviderObservation: { ...observation, context: { ...observation.context, sessionId, clientRequestId } } } as RequestInit);
    return { response, diagnostic: null, error: null };
  } catch (error) {
    return { response: null, diagnostic: readDurableProviderFailureDiagnostic(error), error };
  }
};

describe("durable provider terminal failure capture with the real guard and offline SQL/fetch doubles", () => {
  it.each(["short", "rich"])("reaches READY_FOR_REVIEW through the real guard/bridge/owners for synthetic %s input", async size => {
    const session = createFunctionalResetSession();
    session.runtimeTurns = [{ turnId: "u1", role: "USER", createdAt: session.updatedAt,
      content: size === "short" ? "Étude synthétique chez des adultes." :
        "Étude synthétique chez des adultes. " + "Paramètre synthétique complémentaire à qualifier. ".repeat(24) }];
    const calls: string[] = [];
    const dispatch = async (body: ProductBridgeRequest) => {
      const admission = await guard.prepareRequest({ headers: { "x-forwarded-for": "203.0.113.9" }, body });
      if (!("admitted" in admission) || !admission.admitted) throw new Error("SYNTHETIC_ADMISSION_FAILED");
      const provider = vi.fn<typeof fetch>(async (url) => {
        calls.push(String(url));
        expect(String(url)).toBe(ENDPOINT);
        const output = body.prepareWorkingDraft ? JSON.stringify({ requestType: "STUDY_UPDATE",
          proposal: controlledStudyProposal(prepareWorkingDraftRequest(body).inputDigest, DOMAINS[1]),
          explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }) : "Proposition synthétique non adoptée.";
        return new Response(JSON.stringify({ model: "gpt-5.6-sol", status: "completed", output_text: output,
          usage: { input_tokens: 6214, output_tokens: 2000 } }), { status: 200 });
      });
      const result = await executeProtocolDesignerBridge({ body, apiKey: null, openAiApiKey: "SYNTHETIC_AZURE_ONLY",
        openAiTransport: { destination: "azure", responsesEndpoint: ENDPOINT }, chatRuntime: "TERRA", autonomousProjectBuild: true,
        fetchImpl: guard.createBudgetedFetch(admission, provider) });
      expect(result.status).toBe(200);
      expect(store.operation).toMatchObject({ state: "COMPLETED_RECEIVED", counted_input_tokens: null,
        generation_provider: "AZURE_OPENAI", post_usage_input_tokens: 6214 });
      return result.body as ProductBridgeResponse;
    };
    const conversation = await dispatch({ apiVersion: "1.0.0", currentProject: null, evaluatePersistentDelta: false,
      conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
      observabilityContext: { sessionId: session.sessionId, conversationId: session.conversationId,
        turnId: "u1", clientRequestId: "synthetic-conversation", testSessionId: null } });
    session.runtimeTurns.push(conversation.assistantTurn);
    const preparation = captureProjectPreparation(session);
    // The SQL double stores one operation slot; retain the same session ledger across both requests.
    store.operation = null; store.admission = null;
    const workingDraft = await dispatch(preparation.checkpoint!.request);
    const ready = consumeProjectPreparation(addProjectPreparation(session, preparation), preparation.checkpoint!.preparationId, workingDraft);
    expect(ready.workingDraftPreparations?.at(-1)?.status).toBe("READY_FOR_REVIEW");
    expect(projectPreparationReview(ready)?.applicable).toBe(true);
    expect(ready.project).toBeNull();
    expect(calls).toEqual([ENDPOINT, ENDPOINT]);
  });

  it.each(["PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE", "PUBLIC_AZURE_GENERATION_MODEL_DRIFT", "PUBLIC_AZURE_POST_USAGE_INPUT_TOKENS_MISSING"])(
    "migrates %s without changing historical evidence or reopening a session", async code => {
      store.gate = { state: "CLOSED", count_qualification_ref: "historical", anomaly_operation_key: "historical-operation",
        invalidated_at: "2026-09-27T00:00:00Z" };
      store.historicalAnomalyCode = code;
      const historical = { ...store.gate };
      const provider = vi.fn(async () => generation());
      const result = await run(provider);
      expect(store.gate).toMatchObject(historical);
      if (code === "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE") {
        expect(result.error).toBeNull();
        expect(provider).toHaveBeenCalledOnce();
        expect(store.gate?.local_admission_state).toBe("OPEN");
      } else {
        expect(result.diagnostic?.structuredErrorCode).toBe("PUBLIC_AZURE_LOCAL_ADMISSION_CLOSED");
        expect(provider).not.toHaveBeenCalled();
        expect(store.gate?.local_admission_state).toBe("CLOSED");
      }
    });

  it("does not reset a closed session, release an unknown reservation or redispatch an unknown operation", async () => {
    const failed = await run(vi.fn(async () => { throw new TypeError("synthetic"); }));
    expect(failed.diagnostic?.lastConfirmedDurableState).toBe("UNKNOWN_AFTER_DISPATCH");
    const reserve = store.session?.committed_cost_upper_bound_usd;
    const provider = vi.fn(async () => generation());
    await run(provider);
    expect(provider).not.toHaveBeenCalled();
    expect(store.session?.committed_cost_upper_bound_usd).toBe(reserve);
    store.session!.provider_gate_closed = true;
    store.operation = null;
    store.admission = null;
    const next = await run(provider, { clientRequestId: "second-request" });
    expect(next.diagnostic?.structuredErrorCode).toBe("PUBLIC_SESSION_BUDGET_CLOSED");
    expect(provider).not.toHaveBeenCalled();
    expect(store.session?.provider_gate_closed).toBe(true);
    expect(store.session?.committed_cost_upper_bound_usd).toBe(reserve);
  });

  it("retains the durable soft stop before any Azure network call", async () => {
    await run(vi.fn(async () => generation()));
    Object.assign(store.session!, { measured_cost_usd: 1, committed_cost_upper_bound_usd: 1 });
    store.admission = null;
    store.operation = null;
    const provider = vi.fn(async () => generation());
    const next = await run(provider, { clientRequestId: "second-request" });
    expect(next.diagnostic?.structuredErrorCode).toBe("PUBLIC_PROVIDER_DENIED_SOFT_STOP");
    expect(provider).not.toHaveBeenCalled();
    expect(store.session?.provider_gate_closed).toBe(true);
  });

  it("A: retains input-count HTTP 400 without Azure dispatch or reservation", async () => {
    const calls: string[] = [];
    const result = await run(vi.fn(async (input) => {
      calls.push(String(input));
      return new Response("synthetic rejection", { status: 400 });
    }), { endpoint: "https://api.openai.com/v1/responses" });
    expect(calls).toEqual([COUNT_ENDPOINT]);
    expect(result.diagnostic).toMatchObject({ phase: "PRECOUNT", structuredErrorCode: "PUBLIC_PROVIDER_INPUT_COUNT_HTTP_400",
      inputCountHttpStatus: 400, precountStarted: true, precountCompleted: false,
      reservationConfirmed: false, dispatchAttempted: false, lastConfirmedDurableState: "COUNT_FAILED" });
    expect(store.operation?.state).toBe("COUNT_FAILED");
    expect(store.session?.committed_cost_upper_bound_usd).toBe(0);
  });

  it.each([{ name: "timeout", cause: "AbortError", code: "PUBLIC_PROVIDER_INPUT_COUNT_TIMEOUT" },
    { name: "network", cause: "TypeError", code: "PUBLIC_PROVIDER_INPUT_COUNT_NETWORK_FAILURE" }])("B: distinguishes input-count $name", async ({ cause, code }) => {
    const result = await run(vi.fn(async () => { throw Object.assign(new Error("synthetic"), { name: cause }); }),
      { endpoint: "https://api.openai.com/v1/responses" });
    expect(result.diagnostic).toMatchObject({ phase: "PRECOUNT", structuredErrorCode: code,
      safeExceptionClass: cause, dispatchAttempted: false, lastConfirmedDurableState: "COUNT_FAILED" });
    expect(store.operation?.state).toBe("COUNT_FAILED");
  });

  it("C: retains a reservation admission refusal after successful counting", async () => {
    const provider = vi.fn(async (input: RequestInfo | URL) => String(input) === COUNT_ENDPOINT
      ? countSuccess() : generation());
    store.initialAdmissionCount = 512;
    // An exhausted session is detected inside ensureAdmission, after exact count.
    const result = await run(provider, { endpoint: "https://api.openai.com/v1/responses" });
    expect(result.diagnostic?.phase).toBe("RESERVATION");
    expect(result.diagnostic?.structuredErrorCode).toBe("PUBLIC_SESSION_LIMITED");
    expect(result.diagnostic?.dispatchAttempted).toBe(false);
    expect(store.operation?.state).toBe("COUNT_COMPLETED");
  });

  it.each([{ name: "abort", cause: "AbortError" }, { name: "network", cause: "TypeError" }])("D/E: preserves post-dispatch $name and UNKNOWN reserve", async ({ cause }) => {
    const calls: string[] = [];
    const result = await run(vi.fn(async (input) => {
      calls.push(String(input));
      if (String(input) === COUNT_ENDPOINT) return countSuccess();
      throw Object.assign(new Error("synthetic"), { name: cause });
    }));
    expect(calls).toEqual([ENDPOINT]);
    expect(result.diagnostic).toMatchObject({ phase: "DISPATCHED", structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
      safeExceptionClass: cause, precountCompleted: false, reservationConfirmed: true,
      dispatchAttempted: true, headersReceived: false, lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" });
    expect(store.operation?.state).toBe("UNKNOWN_AFTER_DISPATCH");
    expect(Number(store.session?.committed_cost_upper_bound_usd)).toBeGreaterThan(0);
    expect(store.session?.provider_gate_closed).toBe(false);
  });

  it("F: distinguishes HTTP 500 with headers and preserved reserve", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess()
      : new Response(JSON.stringify({ error: { type: "server_error" } }), { status: 500 })));
    expect(result.diagnostic).toMatchObject({ phase: "SETTLEMENT", providerHttpStatus: 500,
      headersReceived: true, bodyRead: true, structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
      lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" });
    expect(store.operation?.state).toBe("UNKNOWN_AFTER_DISPATCH");
    expect(store.gate?.state).toBe("OPEN");
  });

  it("G: distinguishes unreadable response body after headers", async () => {
    const unreadable = { status: 200, ok: true, headers: new Headers(),
      clone: () => ({ text: async () => { throw new TypeError("synthetic body read"); } }) } as unknown as Response;
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess() : unreadable));
    expect(result.diagnostic).toMatchObject({ phase: "BODY_READ", providerHttpStatus: 200,
      headersReceived: true, bodyRead: false, safeExceptionClass: "TypeError",
      lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" });
    expect(store.operation?.state).toBe("UNKNOWN_AFTER_DISPATCH");
  });

  it("H: records incomplete/max_output_tokens separately from a network failure", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess()
      : generation({ responseStatus: "incomplete", reason: "max_output_tokens" })));
    expect(result.diagnostic).toMatchObject({ phase: "SETTLEMENT", headersReceived: true, bodyRead: true,
      providerResponseStatus: "incomplete", incompleteReason: "max_output_tokens",
      structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    expect(store.operation?.state).toBe("UNKNOWN_AFTER_DISPATCH");
  });

  it("I: closes local policy on an observed conservative envelope overrun", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess()
      : generation({ input: boundPublicProviderCall(ENDPOINT, requestBody)!.inputTokenUpperBound + 1 })));
    expect(result.diagnostic).toMatchObject({ phase: "SETTLEMENT", structuredErrorCode: "PUBLIC_AZURE_LOCAL_INPUT_BOUND_EXCEEDED",
      lastConfirmedDurableState: "QUALIFICATION_INVALID", headersReceived: true, bodyRead: true });
    expect(store.operation?.state).toBe("QUALIFICATION_INVALID");
    expect(store.gate?.local_admission_state).toBe("CLOSED");
    expect(store.gate?.state).toBe("OPEN");
    expect(store.session?.provider_gate_closed).toBe(true);
  });

  it("A: settles actual Azure usage independently from its local estimate", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT
      ? countSuccess(12_984) : generation({ input: 1298 })));
    expect(result.error).toBeNull();
    expect(store.operation).toMatchObject({ state: "COMPLETED_RECEIVED", counted_input_tokens: null,
      post_usage_input_tokens: 1298, input_admission_policy: AZURE_LOCAL_INPUT_POLICY });
    expect(store.operation?.input_token_delta).toBe(1298 - Number(store.operation?.local_estimated_input_tokens));
    expect(store.gate?.state).toBe("OPEN");
    expect(store.session?.provider_gate_closed).toBe(false);
  });

  it("B/F: an envelope overrun closes the pair and denies another session before dispatch", async () => {
    const first = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT
      ? countSuccess(12_984) : generation({ input: 100_000 })));
    expect(first.diagnostic?.structuredErrorCode).toBe("PUBLIC_AZURE_LOCAL_INPUT_BOUND_EXCEEDED");
    expect(store.gate?.local_admission_state).toBe("CLOSED");
    const invalidatedAt = store.gate?.local_invalidated_at;
    const anomalyOperationKey = store.gate?.local_anomaly_operation_key;
    store.session = null;
    store.admission = null;
    store.operation = null;
    const provider = vi.fn(async () => countSuccess());
    const second = await run(provider, { sessionId: "second-session", clientRequestId: "second-request" });
    expect(second.diagnostic).toMatchObject({ phase: "RESERVATION",
      structuredErrorCode: "PUBLIC_AZURE_LOCAL_ADMISSION_CLOSED", dispatchAttempted: false });
    expect(provider).not.toHaveBeenCalled();
    expect(store.gate).toMatchObject({ local_admission_state: "CLOSED", local_invalidated_at: invalidatedAt,
      local_anomaly_operation_key: anomalyOperationKey });
  });

  it.each([{ name: "absent", omitUsage: true }, { name: "zero", input: 0 }])(
    "C: incomplete/content_filter with $name usage is local and non-qualifying", async ({ omitUsage, input }) => {
      const result = await run(vi.fn(async (endpoint) => String(endpoint) === COUNT_ENDPOINT
        ? countSuccess(12_984) : generation({ responseStatus: "incomplete", reason: "content_filter",
          input: input ?? undefined, omitUsage })));
      expect(result.diagnostic).toMatchObject({ phase: "SETTLEMENT", providerHttpStatus: 200,
        providerResponseStatus: "incomplete", incompleteReason: "content_filter",
        structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
        lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" });
      expect(store.operation).toMatchObject({ state: "UNKNOWN_AFTER_DISPATCH", counted_input_tokens: null,
        input_admission_policy: AZURE_LOCAL_INPUT_POLICY });
      expect(store.operation?.provider_response_body).toContain('"reason":"content_filter"');
      expect(store.operation?.measured_cost_usd).toBeUndefined();
      expect(Number(store.session?.committed_cost_upper_bound_usd)).toBeGreaterThan(0);
      expect(store.session?.provider_gate_closed).toBe(false);
      expect(store.gate?.state).toBe("OPEN");

      // A separate operation may still qualify; the filtered result never becomes its proof.
      store.session = null;
      store.admission = null;
      store.operation = null;
      const provider = vi.fn(async (endpoint) => String(endpoint) === COUNT_ENDPOINT
        ? countSuccess(12_984) : generation({ input: 1298 }));
      const following = await run(provider, { sessionId: "second-session", clientRequestId: "second-request" });
      expect(following.error).toBeNull();
      expect(provider).toHaveBeenCalledOnce();
      expect(store.gate?.state).toBe("OPEN");
    });

  it("E: Azure model drift still closes the pair", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT
      ? countSuccess() : generation({ model: "another-model" })));
    expect(result.diagnostic?.structuredErrorCode).toBe("PUBLIC_AZURE_GENERATION_MODEL_DRIFT");
    expect(store.operation?.state).toBe("QUALIFICATION_INVALID");
    expect(store.gate?.local_admission_state).toBe("CLOSED");
  });

  it("E: changing the endpoint on the same operation is rejected before provider dispatch", async () => {
    const first = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess() : generation()));
    expect(first.error).toBeNull();
    const provider = vi.fn(async () => countSuccess());
    const second = await run(provider, { endpoint:
      "https://synthetic.services.ai.azure.com/api/projects/different/openai/v1/responses" });
    expect(second.diagnostic?.structuredErrorCode).toBe("PUBLIC_STALE_OPERATION_REJECTED");
    expect(provider).not.toHaveBeenCalled();
  });

  it.each([{ responseStatus: "completed", input: 0 }, { responseStatus: "incomplete", input: 100_000 }])(
    "preserves fail-closed for contradictory Azure usage: $responseStatus/$input", async ({ responseStatus, input }) => {
      const result = await run(vi.fn(async (endpoint) => String(endpoint) === COUNT_ENDPOINT
        ? countSuccess() : generation({ responseStatus, input })));
      expect(result.diagnostic?.structuredErrorCode).toBe(responseStatus === "completed"
        ? "PUBLIC_AZURE_POST_USAGE_INPUT_TOKENS_MISSING" : "PUBLIC_AZURE_LOCAL_INPUT_BOUND_EXCEEDED");
      expect(store.gate?.local_admission_state).toBe("CLOSED");
    });

  it("J: reports UNKNOWN when a settlement write itself fails", async () => {
    store.failSettlement = true;
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess() : generation()));
    expect(result.diagnostic).toMatchObject({ phase: "SETTLEMENT", headersReceived: true, bodyRead: true,
      lastConfirmedDurableState: "UNKNOWN", structuredErrorCode: null });
    expect(store.operation?.state).toBe("DISPATCHED");
  });

  it("K: leaves successful settlement and its financial ledger unchanged", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess() : generation()));
    expect(result.error).toBeNull();
    expect(result.response?.status).toBe(200);
    expect(store.operation?.state).toBe("COMPLETED_RECEIVED");
    expect(Number(store.operation?.measured_cost_usd)).toBeGreaterThan(0);
    expect(Number(store.session?.measured_cost_usd)).toBe(Number(store.operation?.measured_cost_usd));
    expect(store.session?.provider_gate_closed).toBe(false);
  });
});
