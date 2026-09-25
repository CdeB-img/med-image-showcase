import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import {
  DurablePublicGuardError,
  createPostgresProtocolDesignerDurableGuard,
  migrateProtocolDesignerDurableGuard,
  type DurablePublicRequestContext,
  type PublicProtocolDesignerDurableGuard,
} from "../../server/protocol-designer-durable-guard";
import { preflightDestructiveQualificationStore } from "../durable-qualification-store-preflight.mjs";

const connectionString = process.env.NOXIA_DURABLE_DATABASE_DATABASE_URL;
if (!connectionString) throw new Error("NOXIA_DURABLE_DATABASE_DATABASE_URL_REQUIRED");

const admin = postgres(connectionString, { max: 4, prepare: false });
let destructivePreflightPassed = false;
const guards: PublicProtocolDesignerDurableGuard[] = [];
const runId = `durable-qualification-${Date.now()}`;

const inputCountResponse = (tokens = 120) => new Response(JSON.stringify({
  object: "response.input_tokens",
  input_tokens: tokens,
}), { status: 200, headers: { "content-type": "application/json" } });

const guard = (options: { exposeCountRequests?: boolean; countedInputTokens?: number } = {}) => {
  const created = createPostgresProtocolDesignerDurableGuard(connectionString, { maxConnections: 2 });
  guards.push(created);
  if (options.exposeCountRequests) return created;
  return Object.freeze({
    ...created,
    createBudgetedFetch(context: DurablePublicRequestContext, fetchImpl: typeof fetch = fetch) {
      return created.createBudgetedFetch(context, async (input, init) => {
        const endpoint = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        if (endpoint === "https://api.openai.com/v1/responses/input_tokens") {
          return inputCountResponse(options.countedInputTokens ?? 120);
        }
        return fetchImpl(input, init);
      });
    },
  }) satisfies PublicProtocolDesignerDurableGuard;
};

const body = (name: string, request = "request-1", extra: Record<string, unknown> = {}) => ({
  observabilityContext: {
    sessionId: `${runId}:${name}`,
    conversationId: `${runId}:${name}:conversation`,
    turnId: `${runId}:${name}:turn`,
    clientRequestId: `${runId}:${name}:${request}`,
    testSessionId: "DURABLE_SYNTHETIC_ONLY",
  },
  syntheticQualificationPayload: true,
  ...extra,
});

const headers = (address = "203.0.113.44") => ({ "x-forwarded-for": address });
type SyntheticObservedRequest = RequestInit & { noxiaProviderObservation: {
  purpose: string;
  context: { clientRequestId: string };
  reasoningEffort: string;
  retryIndex: number;
} };

const prepare = async (
  instance: PublicProtocolDesignerDurableGuard,
  payload: unknown,
  address = "203.0.113.44",
): Promise<DurablePublicRequestContext> => {
  const result = await instance.prepareRequest({ headers: headers(address), body: payload });
  if (!("admitted" in result) || !result.admitted) throw new Error(`EXPECTED_ADMISSION:${JSON.stringify(result)}`);
  return result;
};

const openAiRequest = (model: "gpt-5.6-luna" | "gpt-5.6-terra" = "gpt-5.6-luna"): SyntheticObservedRequest => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ model, instructions: "technical synthetic qualification", input: "synthetic",
    text: {}, max_output_tokens: 8_000, store: false }),
  noxiaProviderObservation: {
    purpose: "CONVERSATION_REALIZATION",
    context: { clientRequestId: "synthetic-operation" },
    reasoningEffort: "medium",
    retryIndex: 0,
  },
});

const successfulResponse = (model: "gpt-5.6-luna" | "gpt-5.6-terra" = "gpt-5.6-luna", marker = "ok") => new Response(JSON.stringify({
  id: `synthetic-${marker}`,
  status: "completed",
  model,
  output: [],
  usage: { input_tokens: 120, output_tokens: 40, total_tokens: 160,
    input_tokens_details: { cached_tokens: 0 } },
}), { status: 200, headers: { "content-type": "application/json", "x-request-id": `synthetic-${marker}` } });

const querySingle = async (query: ReturnType<typeof admin>) => query[0] as Record<string, unknown> | undefined;

beforeAll(async () => {
  const preflight = await preflightDestructiveQualificationStore();
  if (connectionString !== preflight.environment.NOXIA_DURABLE_DATABASE_DATABASE_URL) {
    throw new Error("DIRECT_TEST_DATABASE_URL_DIFFERS_FROM_QUALIFICATION_FILE");
  }
  await migrateProtocolDesignerDurableGuard(admin);
  destructivePreflightPassed = true;
});

beforeEach(async () => {
  if (!destructivePreflightPassed) throw new Error("DESTRUCTIVE_PREFLIGHT_REQUIRED");
  await admin`truncate table
    noxia_durable.public_provider_operation,
    noxia_durable.public_bridge_admission,
    noxia_durable.public_guard_session,
    noxia_durable.public_rate_bucket
    restart identity cascade`;
});

afterAll(async () => {
  if (destructivePreflightPassed) {
    await admin`truncate table
      noxia_durable.public_provider_operation,
      noxia_durable.public_bridge_admission,
      noxia_durable.public_guard_session,
      noxia_durable.public_rate_bucket
      restart identity cascade`;
  }
  await Promise.all(guards.map((instance) => instance.close()));
  await admin.end({ timeout: 5 });
});

describe.sequential("shared Neon durable operation guard", () => {
  it("creates admission, reservation, settlement and consumption coherently", async () => {
    const instance = guard();
    const context = await prepare(instance, body("atomic"));
    const provider = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse());
    const response = await instance.createBudgetedFetch(context, provider)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    );
    expect(response.ok).toBe(true);
    const interim = await querySingle(await admin`
      select a.state as admission_state, o.state as operation_state, s.admission_count,
        s.measured_cost_usd, s.committed_cost_upper_bound_usd
      from noxia_durable.public_bridge_admission a
      join noxia_durable.public_provider_operation o on o.admission_key = a.admission_key
      join noxia_durable.public_guard_session s on s.session_key_hash = a.session_key_hash
      where a.admission_key = ${context.admissionKey}
    `);
    expect(interim).toMatchObject({ admission_state: "ACTIVE", operation_state: "COMPLETED_RECEIVED", admission_count: 1 });
    expect(Number(interim?.measured_cost_usd)).toBeGreaterThan(0);
    expect(Number(interim?.committed_cost_upper_bound_usd)).toBeGreaterThanOrEqual(Number(interim?.measured_cost_usd));
    await instance.completeRequest(context, 200, { syntheticResult: "qualified" });
    const completed = await querySingle(await admin`
      select a.state as admission_state, o.state as operation_state
      from noxia_durable.public_bridge_admission a
      join noxia_durable.public_provider_operation o using (admission_key)
      where a.admission_key = ${context.admissionKey}
    `);
    expect(completed).toEqual({ admission_state: "COMPLETED", operation_state: "CONSUMED" });
  });

  it("recovers a paid result across adapter restart without another dispatch or charge", async () => {
    const payload = body("restart");
    const first = guard();
    const firstContext = await prepare(first, payload);
    const firstProvider = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse("gpt-5.6-luna", "restart"));
    await first.createBudgetedFetch(firstContext, firstProvider)("https://api.openai.com/v1/responses", openAiRequest());
    expect(firstProvider).toHaveBeenCalledTimes(1);
    await first.close();

    const restarted = guard();
    const restartedContext = await prepare(restarted, payload);
    const forbiddenProvider = vi.fn<typeof fetch>();
    const recovered = await restarted.createBudgetedFetch(restartedContext, forbiddenProvider)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    );
    expect(forbiddenProvider).not.toHaveBeenCalled();
    expect(await recovered.json()).toMatchObject({ id: "synthetic-restart" });
    await restarted.completeRequest(restartedContext, 200, { recovered: true });

    const final = guard();
    const recoveredBridge = await final.prepareRequest({ headers: headers(), body: payload });
    expect(recoveredBridge).toEqual({ recovered: true, status: 200, body: { recovered: true } });
    const accounting = await querySingle(await admin`
      select count(*)::int as operations, sum(measured_cost_usd)::numeric as measured
      from noxia_durable.public_provider_operation
      where admission_key = ${firstContext.admissionKey}
    `);
    expect(accounting?.operations).toBe(1);
    expect(Number(accounting?.measured)).toBeGreaterThan(0);
  });

  it("prevents duplicate multi-worker dispatch while preserving later paid-result recovery", async () => {
    const payload = body("multi-worker");
    const workerA = guard();
    const workerB = guard();
    const contextA = await prepare(workerA, payload);
    const contextB = await prepare(workerB, payload);
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const providerA = vi.fn<typeof fetch>(async () => { await wait; return successfulResponse("gpt-5.6-luna", "multi"); });
    const providerB = vi.fn<typeof fetch>();
    const running = workerA.createBudgetedFetch(contextA, providerA)("https://api.openai.com/v1/responses", openAiRequest());
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const state = await querySingle(await admin`
        select state from noxia_durable.public_provider_operation where admission_key = ${contextA.admissionKey}
      `);
      if (state?.state === "DISPATCHED") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await expect(workerB.createBudgetedFetch(contextB, providerB)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    )).rejects.toMatchObject({ code: "PUBLIC_OPERATION_IN_PROGRESS" });
    expect(providerB).not.toHaveBeenCalled();
    release();
    await running;
    const recovered = await workerB.createBudgetedFetch(contextB, providerB)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    );
    expect(providerB).not.toHaveBeenCalled();
    expect(await recovered.json()).toMatchObject({ id: "synthetic-multi" });
  });

  it("retains UNKNOWN_AFTER_DISPATCH debt across restart and quota expiration", async () => {
    const payload = body("unknown");
    const first = guard();
    const context = await prepare(first, payload);
    const failingProvider = vi.fn<typeof fetch>().mockRejectedValue(new Error("synthetic transport interruption"));
    await expect(first.createBudgetedFetch(context, failingProvider)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    )).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    const before = await querySingle(await admin`
      select o.state, s.provider_gate_closed, s.committed_cost_upper_bound_usd
      from noxia_durable.public_provider_operation o
      join noxia_durable.public_guard_session s using (session_key_hash)
      where o.admission_key = ${context.admissionKey}
    `);
    expect(before?.state).toBe("UNKNOWN_AFTER_DISPATCH");
    expect(before?.provider_gate_closed).toBe(false);
    const debt = Number(before?.committed_cost_upper_bound_usd);
    expect(debt).toBeGreaterThan(0);
    await admin`
      update noxia_durable.public_guard_session
      set quota_updated_at = now() - interval '25 hours'
      where session_key_hash = ${context.sessionKey}
    `;
    await first.close();
    const restarted = guard();
    const retryContext = await prepare(restarted, payload);
    const forbiddenProvider = vi.fn<typeof fetch>();
    const retryFetch = restarted.createBudgetedFetch(retryContext, forbiddenProvider);
    await expect(restarted.createBudgetedFetch(retryContext, forbiddenProvider)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    )).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    await expect(retryFetch(
      "https://api.openai.com/v1/responses", openAiRequest(),
    )).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    expect(forbiddenProvider).not.toHaveBeenCalled();
    const independent = await prepare(restarted, body("unknown", "request-2"));
    const independentProvider = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse());
    await restarted.createBudgetedFetch(independent, independentProvider)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    );
    expect(independentProvider).toHaveBeenCalledTimes(1);
    const after = await querySingle(await admin`
      select provider_gate_closed, committed_cost_upper_bound_usd
      from noxia_durable.public_guard_session where session_key_hash = ${context.sessionKey}
    `);
    expect(after?.provider_gate_closed).toBe(false);
    expect(Number(after?.committed_cost_upper_bound_usd)).toBeGreaterThan(debt);
    const unknown = await querySingle(await admin`
      select state, reserved_upper_bound_usd from noxia_durable.public_provider_operation
      where admission_key = ${context.admissionKey}
    `);
    expect(unknown?.state).toBe("UNKNOWN_AFTER_DISPATCH");
    expect(Number(unknown?.reserved_upper_bound_usd)).toBe(debt);
  });

  it("converts an expired dispatch lease to retained UNKNOWN debt without redispatch", async () => {
    const payload = body("stale-dispatch");
    const workerA = guard();
    const workerB = guard();
    const contextA = await prepare(workerA, payload);
    const contextB = await prepare(workerB, payload);
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const providerA = vi.fn<typeof fetch>(async () => { await wait; return successfulResponse("gpt-5.6-luna", "late"); });
    const providerB = vi.fn<typeof fetch>();
    const running = workerA.createBudgetedFetch(contextA, providerA)("https://api.openai.com/v1/responses", openAiRequest());
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const state = await querySingle(await admin`
        select state from noxia_durable.public_provider_operation where admission_key = ${contextA.admissionKey}
      `);
      if (state?.state === "DISPATCHED") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await admin`
      update noxia_durable.public_provider_operation
      set dispatch_lease_expires_at = now() - interval '1 second'
      where admission_key = ${contextA.admissionKey}
    `;
    await expect(workerB.createBudgetedFetch(contextB, providerB)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    )).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    expect(providerB).not.toHaveBeenCalled();
    release();
    await expect(running).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_OPERATION_NOT_DISPATCHED" });
    const state = await querySingle(await admin`
      select o.state, s.provider_gate_closed, s.committed_cost_upper_bound_usd
      from noxia_durable.public_provider_operation o
      join noxia_durable.public_guard_session s using (session_key_hash)
      where o.admission_key = ${contextA.admissionKey}
    `);
    expect(state?.state).toBe("UNKNOWN_AFTER_DISPATCH");
    expect(state?.provider_gate_closed).toBe(false);
    expect(Number(state?.committed_cost_upper_bound_usd)).toBeGreaterThan(0);
  });

  it("rejects stale request mutation and cross-client result access", async () => {
    const payload = body("isolation");
    const instance = guard();
    const context = await prepare(instance, payload);
    await instance.createBudgetedFetch(context, vi.fn<typeof fetch>().mockResolvedValue(successfulResponse()))(
      "https://api.openai.com/v1/responses", openAiRequest(),
    );
    await instance.completeRequest(context, 200, { privateSyntheticResult: true });
    const stale = await instance.prepareRequest({ headers: headers(), body: body("isolation", "request-1", { changed: true }) });
    expect(stale).toMatchObject({ admitted: false, code: "PUBLIC_STALE_OPERATION_REJECTED" });
    const otherClient = await instance.prepareRequest({ headers: headers("198.51.100.99"), body: payload });
    expect(otherClient).toMatchObject({ admitted: false, code: "PUBLIC_SESSION_CLIENT_MISMATCH" });
    const otherSession = await instance.prepareRequest({ headers: headers(), body: body("isolation-other") });
    expect(otherSession).toMatchObject({ admitted: true });
  });

  it("settles concurrent operations once and remains coherent when results arrive out of order", async () => {
    const instance = guard();
    const context = await prepare(instance, body("accounting"));
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    const firstWait = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const secondWait = new Promise<void>((resolve) => { releaseSecond = resolve; });
    const provider = vi.fn<typeof fetch>()
      .mockImplementationOnce(async () => { await firstWait; return successfulResponse("gpt-5.6-luna", "first"); })
      .mockImplementationOnce(async () => { await secondWait; return successfulResponse("gpt-5.6-luna", "second"); });
    const budgeted = instance.createBudgetedFetch(context, provider);
    const first = budgeted("https://api.openai.com/v1/responses", openAiRequest());
    const second = budgeted("https://api.openai.com/v1/responses", {
      ...openAiRequest(),
      noxiaProviderObservation: { ...openAiRequest().noxiaProviderObservation, purpose: "PERSISTENT_DELTA" },
    } as SyntheticObservedRequest);
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const count = await querySingle(await admin`
        select count(*)::int as count from noxia_durable.public_provider_operation
        where admission_key = ${context.admissionKey} and state = 'DISPATCHED'
      `);
      if (count?.count === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    releaseSecond();
    await second;
    releaseFirst();
    await first;
    const totals = await querySingle(await admin`
      select s.measured_cost_usd as session_measured, s.committed_cost_upper_bound_usd as session_committed,
        sum(o.measured_cost_usd)::numeric as operation_measured,
        sum(o.committed_cost_upper_bound_usd)::numeric as operation_committed,
        count(*)::int as operations
      from noxia_durable.public_guard_session s
      join noxia_durable.public_provider_operation o using (session_key_hash)
      where s.session_key_hash = ${context.sessionKey}
      group by s.measured_cost_usd, s.committed_cost_upper_bound_usd
    `);
    expect(totals?.operations).toBe(2);
    expect(Number(totals?.session_measured)).toBeCloseTo(Number(totals?.operation_measured), 9);
    expect(Number(totals?.session_committed)).toBeCloseTo(Number(totals?.operation_committed), 9);
  });

  it("keeps a two-generation DOC admission partial and never repays its completed first scope", async () => {
    const payload = body("doc-partial");
    const first = guard();
    const context = await prepare(first, payload);
    const provider = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(successfulResponse("gpt-5.6-luna", "doc-first"))
      .mockRejectedValueOnce(new Error("synthetic crash after first scope persistence"));
    const budgeted = first.createBudgetedFetch(context, provider);
    await budgeted("https://api.openai.com/v1/responses", openAiRequest());
    await expect(budgeted("https://api.openai.com/v1/responses", {
      ...openAiRequest(), noxiaProviderObservation: {
        ...openAiRequest().noxiaProviderObservation, purpose: "DOCUMENT_PROJECTION",
      },
    } as SyntheticObservedRequest)).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    expect(provider).toHaveBeenCalledTimes(2);
    await first.close();

    const restarted = guard();
    const retry = await prepare(restarted, payload);
    const forbidden = vi.fn<typeof fetch>();
    const retryFetch = restarted.createBudgetedFetch(retry, forbidden);
    expect(await (await retryFetch("https://api.openai.com/v1/responses", openAiRequest())).json())
      .toMatchObject({ id: "synthetic-doc-first" });
    await expect(retryFetch("https://api.openai.com/v1/responses", {
      ...openAiRequest(), noxiaProviderObservation: {
        ...openAiRequest().noxiaProviderObservation, purpose: "DOCUMENT_PROJECTION",
      },
    } as SyntheticObservedRequest)).rejects.toMatchObject({ code: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    expect(forbidden).not.toHaveBeenCalled();
    const state = await querySingle(await admin`
      select a.state as admission_state,
        count(*) filter (where o.state = 'COMPLETED_RECEIVED')::int as completed_scopes,
        count(*) filter (where o.state = 'UNKNOWN_AFTER_DISPATCH')::int as unknown_scopes
      from noxia_durable.public_bridge_admission a
      join noxia_durable.public_provider_operation o using (admission_key)
      where a.admission_key = ${context.admissionKey}
      group by a.state
    `);
    expect(state).toEqual({ admission_state: "ACTIVE", completed_scopes: 1, unknown_scopes: 1 });
    const independent = await prepare(restarted, body("doc-partial", "chat-after-doc"));
    const independentProvider = vi.fn<typeof fetch>().mockResolvedValue(successfulResponse());
    await restarted.createBudgetedFetch(independent, independentProvider)(
      "https://api.openai.com/v1/responses", openAiRequest(),
    );
    expect(independentProvider).toHaveBeenCalledTimes(1);
  });

  it("admits concurrent Terra foreground and background after exact count under the unchanged hard bound", async () => {
    const instance = guard();
    const context = await prepare(instance, body("foreground-background"));
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const provider = vi.fn<typeof fetch>(async () => { await wait; return successfulResponse("gpt-5.6-terra", "foreground"); });
    const budgeted = instance.createBudgetedFetch(context, provider);
    const foreground = budgeted("https://api.openai.com/v1/responses", openAiRequest("gpt-5.6-terra"));
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const state = await querySingle(await admin`
        select state from noxia_durable.public_provider_operation where admission_key = ${context.admissionKey}
      `);
      if (state?.state === "DISPATCHED") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const background = budgeted("https://api.openai.com/v1/responses", {
      ...openAiRequest("gpt-5.6-terra"), noxiaProviderObservation: {
        ...openAiRequest("gpt-5.6-terra").noxiaProviderObservation, purpose: "PERSISTENT_DELTA",
      },
    } as SyntheticObservedRequest);
    for (let attempt = 0; attempt < 150 && provider.mock.calls.length < 2; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    release();
    const outcomes = await Promise.allSettled([foreground, background]);
    expect(outcomes).toEqual([
      expect.objectContaining({ status: "fulfilled" }),
      expect.objectContaining({ status: "fulfilled" }),
    ]);
    expect(provider).toHaveBeenCalledTimes(2);
    const totals = await querySingle(await admin`
      select committed_cost_upper_bound_usd from noxia_durable.public_guard_session
      where session_key_hash = ${context.sessionKey}
    `);
    expect(Number(totals?.committed_cost_upper_bound_usd)).toBeLessThan(6);
  });

  it("shares rate and eight-admission session quotas across independent adapters", async () => {
    const firstWorker = guard();
    const secondWorker = guard();
    const session = "shared-quotas";
    for (let index = 0; index < 6; index += 1) {
      const instance = index % 2 ? firstWorker : secondWorker;
      const context = await prepare(instance, body(session, `rate-${index}`));
      await instance.completeRequest(context, 200, { syntheticNoProviderResult: index });
    }
    const rateLimited = await prepare(firstWorker, body(session, "rate-limited"));
    await expect(firstWorker.completeRequest(rateLimited, 200, { shouldNotPersist: true }))
      .rejects.toMatchObject({ code: "PUBLIC_RATE_LIMITED", status: 429 });
    const countAfterRateLimit = await querySingle(await admin`
      select admission_count from noxia_durable.public_guard_session where session_key_hash = ${rateLimited.sessionKey}
    `);
    expect(countAfterRateLimit?.admission_count).toBe(6);

    for (let index = 6; index < 8; index += 1) {
      await admin`
        update noxia_durable.public_rate_bucket
        set window_started_at = now() - interval '61 seconds', request_count = 0
      `;
      const instance = index % 2 ? firstWorker : secondWorker;
      const context = await prepare(instance, body(session, `session-${index}`));
      await instance.completeRequest(context, 200, { syntheticNoProviderResult: index });
    }
    await admin`
      update noxia_durable.public_rate_bucket
      set window_started_at = now() - interval '61 seconds', request_count = 0
    `;
    const sessionLimited = await prepare(secondWorker, body(session, "session-limited"));
    await expect(secondWorker.completeRequest(sessionLimited, 200, { shouldNotPersist: true }))
      .rejects.toMatchObject({ code: "PUBLIC_SESSION_LIMITED", status: 429 });
    const final = await querySingle(await admin`
      select admission_count from noxia_durable.public_guard_session where session_key_hash = ${sessionLimited.sessionKey}
    `);
    expect(final?.admission_count).toBe(8);
  });
});
