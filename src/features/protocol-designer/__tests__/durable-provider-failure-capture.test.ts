import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPostgresProtocolDesignerDurableGuard,
  type PublicProtocolDesignerDurableGuard,
} from "../../../../server/protocol-designer-durable-guard";
import { readDurableProviderFailureDiagnostic } from "../provider-call-observability";

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
      db.gate ??= { state: "OPEN", count_qualification_ref: values[2] };
      return [];
    }
    if (sql.includes("select state, count_qualification_ref")) return db.gate ? [db.gate] : [];
    if (sql.includes("update noxia_durable.public_provider_equivalence_gate")) {
      if (db.gate) db.gate.state = "CLOSED";
      return [];
    }
    if (sql.includes("insert into noxia_durable.public_provider_operation")) {
      const counted = sql.includes("'count_pending'");
      db.operation = { operation_key: values[0], admission_key: values[1], session_key_hash: values[2],
        endpoint_digest: values[5], payload_digest: values[6], configuration_digest: values[7],
        state: counted ? "COUNT_PENDING" : "RESERVED", reserved_upper_bound_usd: counted ? 0 : values[8],
        count_payload_digest: counted ? values[8] : null, counted_input_tokens: null,
        count_provider: counted ? values[11] : null, generation_provider: counted ? values[12] : null,
        generation_model: counted ? values[13] : null, count_qualification_ref: counted ? values[14] : null };
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
      } else if (sql.includes("set state = 'count_unknown_after_dispatch'")) db.operation.state = "COUNT_UNKNOWN_AFTER_DISPATCH";
      else if (sql.includes("set state = 'completed_received'")) {
        if (db.failSettlement) throw new Error("SYNTHETIC_SQL_SETTLEMENT_FAILURE");
        db.operation.state = "COMPLETED_RECEIVED";
        db.operation.measured_cost_usd = values[0];
        db.operation.committed_cost_upper_bound_usd = values[1];
        db.operation.provider_http_status = values[4];
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
const countSuccess = () => new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: INPUT }), { status: 200 });
const generation = (options: { status?: number; responseStatus?: string; input?: number; reason?: string } = {}) =>
  new Response(JSON.stringify({ model: "gpt-5.6-sol", status: options.responseStatus ?? "completed",
    ...(options.reason ? { incomplete_details: { reason: options.reason } } : {}),
    usage: { input_tokens: options.input ?? INPUT, output_tokens: 30, total_tokens: (options.input ?? INPUT) + 30 } }),
  { status: options.status ?? 200 });

let guard: PublicProtocolDesignerDurableGuard;
beforeEach(() => { store = fakeStore(); guard = createPostgresProtocolDesignerDurableGuard("postgres://synthetic", { sessionRequestLimit: 512 }); });
afterEach(async () => { await guard.close(); });

const run = async (provider: typeof fetch) => {
  const prepared = await guard.prepareRequest({ headers: { "x-forwarded-for": "203.0.113.9" }, body: {
    observabilityContext: { sessionId: "synthetic-session", conversationId: "synthetic-conversation",
      turnId: "synthetic-turn", clientRequestId: "synthetic-request" },
  } });
  if (!("admitted" in prepared) || !prepared.admitted) throw new Error("SYNTHETIC_PREPARE_FAILED");
  const budgeted = guard.createBudgetedFetch(prepared, provider, "SYNTHETIC_COUNT_ONLY");
  const controller = new AbortController();
  try {
    const response = await budgeted(ENDPOINT, { method: "POST", body: requestBody, signal: controller.signal,
      noxiaProviderObservation: observation } as RequestInit);
    return { response, diagnostic: null, error: null };
  } catch (error) {
    return { response: null, diagnostic: readDurableProviderFailureDiagnostic(error), error };
  }
};

describe("durable provider terminal failure capture with the real guard and offline SQL/fetch doubles", () => {
  it("A: retains input-count HTTP 400 without Azure dispatch or reservation", async () => {
    const calls: string[] = [];
    const result = await run(vi.fn(async (input) => {
      calls.push(String(input));
      return new Response("synthetic rejection", { status: 400 });
    }));
    expect(calls).toEqual([COUNT_ENDPOINT]);
    expect(result.diagnostic).toMatchObject({ phase: "PRECOUNT", structuredErrorCode: "PUBLIC_PROVIDER_INPUT_COUNT_HTTP_400",
      inputCountHttpStatus: 400, precountStarted: true, precountCompleted: false,
      reservationConfirmed: false, dispatchAttempted: false, lastConfirmedDurableState: "COUNT_FAILED" });
    expect(store.operation?.state).toBe("COUNT_FAILED");
    expect(store.session?.committed_cost_upper_bound_usd).toBe(0);
  });

  it.each([{ name: "timeout", cause: "AbortError", code: "PUBLIC_PROVIDER_INPUT_COUNT_TIMEOUT" },
    { name: "network", cause: "TypeError", code: "PUBLIC_PROVIDER_INPUT_COUNT_NETWORK_FAILURE" }])("B: distinguishes input-count $name", async ({ cause, code }) => {
    const result = await run(vi.fn(async () => { throw Object.assign(new Error("synthetic"), { name: cause }); }));
    expect(result.diagnostic).toMatchObject({ phase: "PRECOUNT", structuredErrorCode: code,
      safeExceptionClass: cause, dispatchAttempted: false, lastConfirmedDurableState: "COUNT_FAILED" });
    expect(store.operation?.state).toBe("COUNT_FAILED");
  });

  it("C: retains a reservation admission refusal after successful counting", async () => {
    const provider = vi.fn(async (input: RequestInfo | URL) => String(input) === COUNT_ENDPOINT
      ? countSuccess() : generation());
    store.initialAdmissionCount = 512;
    // An exhausted session is detected inside ensureAdmission, after exact count.
    const result = await run(provider);
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
    expect(calls).toEqual([COUNT_ENDPOINT, ENDPOINT]);
    expect(result.diagnostic).toMatchObject({ phase: "DISPATCHED", structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
      safeExceptionClass: cause, precountCompleted: true, reservationConfirmed: true,
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

  it("I: preserves input-count divergence and closes the existing pair gate", async () => {
    const result = await run(vi.fn(async (input) => String(input) === COUNT_ENDPOINT ? countSuccess()
      : generation({ input: INPUT + 1 })));
    expect(result.diagnostic).toMatchObject({ phase: "SETTLEMENT", structuredErrorCode: "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE",
      lastConfirmedDurableState: "INPUT_TOKEN_DIVERGENCE", headersReceived: true, bodyRead: true });
    expect(store.operation?.state).toBe("INPUT_TOKEN_DIVERGENCE");
    expect(store.gate?.state).toBe("CLOSED");
    expect(store.session?.provider_gate_closed).toBe(true);
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
