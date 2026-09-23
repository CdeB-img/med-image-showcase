import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { buildOpenAITerraConversationPayload } from "../../api/protocol-designer-openai-extraction-provider";
import { boundCanaryProviderCall } from "../../server/protocol-designer-canary-policy";
import {
  createPostgresProtocolDesignerDurableGuard,
  migrateProtocolDesignerDurableGuard,
  type DurablePublicRequestContext,
  type PublicProtocolDesignerDurableGuard,
} from "../../server/protocol-designer-durable-guard";
import { openAIInputCountRequest } from "../../server/protocol-designer-provider-replay";
import { prepareWorkingDraftRequest } from "../../src/features/protocol-designer/functional-reset/continuous-project-build";
import type { ProductBridgeRequest } from "../../src/features/protocol-designer/product-bridge";
import { prepareTerraConversation } from "../../src/features/scientific-thinking/scientific-collaborator-conversation";
import { preflightDestructiveQualificationStore } from "../durable-qualification-store-preflight.mjs";

const connectionString = process.env.NOXIA_DURABLE_DATABASE_DATABASE_URL;
if (!connectionString) throw new Error("NOXIA_DURABLE_DATABASE_DATABASE_URL_REQUIRED");
const admin = postgres(connectionString, { max: 4, prepare: false });
let destructivePreflightPassed = false;
const guards: PublicProtocolDesignerDurableGuard[] = [];
const runId = `exact-count-${Date.now()}`;
const OPENAI_RESPONSES = "https://api.openai.com/v1/responses";
const OPENAI_INPUT_TOKENS = "https://api.openai.com/v1/responses/input_tokens";
const AZURE_RESPONSES = "https://noxia-01.services.ai.azure.com/api/projects/noxia-prod/openai/v1/responses";
const AZURE_COUNT_KEY = "SYNTHETIC_OPENAI_COUNT_KEY";
const FOREGROUND_TOKENS = 1_841;
const BACKGROUND_TOKENS = 3_886;

const createGuard = () => {
  const guard = createPostgresProtocolDesignerDurableGuard(connectionString, { maxConnections: 3, sessionRequestLimit: 16 });
  guards.push(guard);
  return guard;
};
const headers = { "x-forwarded-for": "203.0.113.81" };
const admissionBody = (session: string, request: string) => ({
  observabilityContext: {
    sessionId: `${runId}:${session}`,
    conversationId: `${runId}:${session}:conversation`,
    turnId: `${runId}:${session}:${request}:turn`,
    clientRequestId: `${runId}:${session}:${request}`,
    testSessionId: "EXACT_COUNT_SYNTHETIC_ONLY",
  },
  nativeFixture: "REPRESENTATIVE_PROTOCOL_DESIGNER",
});
const prepare = async (guard: PublicProtocolDesignerDurableGuard, body: unknown) => {
  const result = await guard.prepareRequest({ headers, body });
  if (!("admitted" in result) || !result.admitted) throw new Error(`EXPECTED_ADMISSION:${JSON.stringify(result)}`);
  return result;
};
const endpoint = (input: Parameters<typeof fetch>[0]) => typeof input === "string"
  ? input : input instanceof URL ? input.href : input.url;
const countResponse = (tokens: number) => new Response(JSON.stringify({
  object: "response.input_tokens",
  input_tokens: tokens,
}), { status: 200, headers: { "content-type": "application/json" } });
const generationResponse = (tokens: number, marker: string) => new Response(JSON.stringify({
  id: `synthetic-${marker}`,
  status: "completed",
  model: "gpt-5.6-terra",
  output: [],
  usage: {
    input_tokens: tokens,
    output_tokens: 40,
    total_tokens: tokens + 40,
    input_tokens_details: { cached_tokens: 0 },
  },
}), { status: 200, headers: { "content-type": "application/json" } });
const observedInit = (body: string, request: string): RequestInit & { noxiaProviderObservation: Record<string, unknown> } => ({
  method: "POST",
  headers: { "content-type": "application/json", authorization: "Bearer SYNTHETIC_NOT_SENT" },
  body,
  noxiaProviderObservation: {
    purpose: "CONVERSATION_REALIZATION",
    context: { clientRequestId: request },
    reasoningEffort: "medium",
    retryIndex: 0,
  },
});

const nativeRequest = (): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  conversation: {
    conversationId: `${runId}:native-conversation`,
    language: "fr",
    turns: [
      { turnId: "u1", role: "USER", content: "Je veux comparer deux stratégies dans une étude randomisée avec un critère principal quantitatif et un suivi longitudinal.", createdAt: "2026-09-19T00:00:00.000Z" },
      { turnId: "a1", role: "NOXIA", content: "Je structure cette proposition scientifique sans l'adopter.", createdAt: "2026-09-19T00:00:01.000Z" },
      { turnId: "u2", role: "USER", content: "Conserve le double aveugle, précise les visites initiale et à trois mois, puis propose les arbitrages encore nécessaires.", createdAt: "2026-09-19T00:00:02.000Z" },
    ],
  },
  currentProject: null,
  evaluatePersistentDelta: false,
});
const foregroundPayload = () => JSON.stringify(buildOpenAITerraConversationPayload(prepareTerraConversation(nativeRequest(), true)));
const backgroundPayload = () => JSON.stringify(buildOpenAITerraConversationPayload(prepareWorkingDraftRequest({
  ...nativeRequest(),
  prepareWorkingDraft: true,
})));
const azurePayload = () => JSON.stringify({ ...JSON.parse(foregroundPayload()), model: "gpt-5.6-sol" });
const azureInit = (request: string) => ({ ...observedInit(azurePayload(), request),
  headers: { "content-type": "application/json", "api-key": "SYNTHETIC_AZURE_KEY" } });
const azureGenerationResponse = (tokens: number, model = "gpt-5.6-sol") => new Response(JSON.stringify({
  id: "synthetic-azure-result", status: "completed", model, output: [],
  usage: { input_tokens: tokens, output_tokens: 40, total_tokens: tokens + 40,
    input_tokens_details: { cached_tokens: 0 } },
}), { status: 200, headers: { "content-type": "application/json" } });

const queryOne = async (query: ReturnType<typeof admin>) => query[0] as Record<string, unknown> | undefined;

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
    noxia_durable.public_provider_equivalence_gate,
    noxia_durable.public_provider_operation,
    noxia_durable.public_bridge_admission,
    noxia_durable.public_guard_session,
    noxia_durable.public_rate_bucket
    restart identity cascade`;
});
afterAll(async () => {
  if (destructivePreflightPassed) {
    await admin`truncate table
      noxia_durable.public_provider_equivalence_gate,
      noxia_durable.public_provider_operation,
      noxia_durable.public_bridge_admission,
      noxia_durable.public_guard_session,
      noxia_durable.public_rate_bucket
      restart identity cascade`;
  }
  await Promise.all(guards.map((guard) => guard.close()));
  await admin.end({ timeout: 5 });
});

describe.sequential("qualified Azure generation on the existing durable journal", () => {
  it("precounts with OpenAI, reserves before Azure dispatch, and settles an exact match", async () => {
    const guard = createGuard();
    const context = await prepare(guard, admissionBody("azure-match", "request"));
    const provider = vi.fn<typeof fetch>(async (input, init) => {
      if (endpoint(input) === OPENAI_INPUT_TOKENS) {
        expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${AZURE_COUNT_KEY}`);
        expect(new Headers(init?.headers).get("api-key")).toBeNull();
        expect(JSON.parse(String(init?.body))).toMatchObject({ model: "gpt-5.6-sol" });
        return countResponse(FOREGROUND_TOKENS);
      }
      expect(endpoint(input)).toBe(AZURE_RESPONSES);
      expect(new Headers(init?.headers).get("api-key")).toBe("SYNTHETIC_AZURE_KEY");
      const reserved = await queryOne(await admin`
        select state, reserved_upper_bound_usd, count_provider, generation_provider,
          generation_model, count_qualification_ref, counted_input_tokens
        from noxia_durable.public_provider_operation
      `);
      expect(reserved).toMatchObject({ state: "DISPATCHED", count_provider: "OPENAI",
        generation_provider: "AZURE_OPENAI", generation_model: "gpt-5.6-sol",
        counted_input_tokens: FOREGROUND_TOKENS });
      expect(Number(reserved?.reserved_upper_bound_usd)).toBeGreaterThan(0);
      expect(reserved?.count_qualification_ref).toBeTruthy();
      return azureGenerationResponse(FOREGROUND_TOKENS);
    });
    const response = await guard.createBudgetedFetch(context, provider, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-match"));
    expect(response.status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(2);
    expect((await queryOne(await admin`
      select state, post_usage_input_tokens, input_token_delta from noxia_durable.public_provider_operation
    `))).toMatchObject({ state: "COMPLETED_RECEIVED", post_usage_input_tokens: FOREGROUND_TOKENS,
      input_token_delta: 0 });
  });

  it("retains the reservation, records divergence, and blocks later Azure dispatch", async () => {
    const guard = createGuard();
    const context = await prepare(guard, admissionBody("azure-divergence", "request"));
    const provider = vi.fn<typeof fetch>(async (input) => endpoint(input) === OPENAI_INPUT_TOKENS
      ? countResponse(FOREGROUND_TOKENS) : azureGenerationResponse(FOREGROUND_TOKENS + 1));
    await expect(guard.createBudgetedFetch(context, provider, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-divergence")))
      .rejects.toMatchObject({ code: "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE" });
    expect((await queryOne(await admin`
      select state, qualification_failure_code, input_token_delta, reserved_upper_bound_usd
      from noxia_durable.public_provider_operation
    `))).toMatchObject({ state: "INPUT_TOKEN_DIVERGENCE",
      qualification_failure_code: "PUBLIC_AZURE_INPUT_TOKEN_DIVERGENCE", input_token_delta: 1 });
    expect(Number((await queryOne(await admin`
      select committed_cost_upper_bound_usd from noxia_durable.public_guard_session
    `))?.committed_cost_upper_bound_usd)).toBeGreaterThan(0);
    expect((await queryOne(await admin`
      select state from noxia_durable.public_provider_equivalence_gate
    `))?.state).toBe("CLOSED");
    const later = await prepare(createGuard(), admissionBody("azure-later", "request"));
    const forbidden = vi.fn<typeof fetch>();
    await expect(guard.createBudgetedFetch(later, forbidden, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-later")))
      .rejects.toMatchObject({ code: "PUBLIC_AZURE_INPUT_COUNT_EQUIVALENCE_CLOSED" });
    expect(forbidden).not.toHaveBeenCalled();
  });

  it("fails closed when Azure returns another model version", async () => {
    const guard = createGuard();
    const context = await prepare(guard, admissionBody("azure-model-drift", "request"));
    const provider = vi.fn<typeof fetch>(async (input) => endpoint(input) === OPENAI_INPUT_TOKENS
      ? countResponse(FOREGROUND_TOKENS) : azureGenerationResponse(FOREGROUND_TOKENS, "gpt-5.6-sol-2026-09-23"));
    await expect(guard.createBudgetedFetch(context, provider, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-model-drift")))
      .rejects.toMatchObject({ code: "PUBLIC_AZURE_GENERATION_MODEL_DRIFT" });
    expect((await queryOne(await admin`
      select state, qualification_failure_code from noxia_durable.public_provider_operation
    `))).toMatchObject({ state: "QUALIFICATION_INVALID", qualification_failure_code: "PUBLIC_AZURE_GENERATION_MODEL_DRIFT" });
  });

  it("does not accept a successful Azure response without post-use input tokens", async () => {
    const guard = createGuard();
    const context = await prepare(guard, admissionBody("azure-missing-usage", "request"));
    const provider = vi.fn<typeof fetch>(async (input) => endpoint(input) === OPENAI_INPUT_TOKENS
      ? countResponse(FOREGROUND_TOKENS)
      : new Response(JSON.stringify({ model: "gpt-5.6-sol", status: "completed", output: [] }), { status: 200 }));
    await expect(guard.createBudgetedFetch(context, provider, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-missing-usage")))
      .rejects.toMatchObject({ code: "PUBLIC_AZURE_POST_USAGE_INPUT_TOKENS_MISSING" });
    expect((await queryOne(await admin`
      select state, qualification_failure_code from noxia_durable.public_provider_operation
    `))).toMatchObject({ state: "QUALIFICATION_INVALID",
      qualification_failure_code: "PUBLIC_AZURE_POST_USAGE_INPUT_TOKENS_MISSING" });
  });

  it("reuses an Azure precount after a worker restart without a second count", async () => {
    const body = admissionBody("azure-count-restart", "request");
    const first = createGuard();
    const firstContext = await prepare(first, body);
    let releaseCount!: () => void;
    const countGate = new Promise<void>((resolve) => { releaseCount = resolve; });
    const initialProvider = vi.fn<typeof fetch>(async (input) => {
      expect(endpoint(input)).toBe(OPENAI_INPUT_TOKENS);
      await countGate;
      return countResponse(FOREGROUND_TOKENS);
    });
    const interrupted = first.createBudgetedFetch(firstContext, initialProvider, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-count-restart"));
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const state = await queryOne(await admin`select state from noxia_durable.public_provider_operation`);
      if (state?.state === "COUNT_DISPATCHED") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await admin`update noxia_durable.public_guard_session set provider_gate_closed = true`;
    releaseCount();
    await expect(interrupted).rejects.toMatchObject({ code: "PUBLIC_SESSION_BUDGET_CLOSED" });
    await admin`update noxia_durable.public_guard_session set provider_gate_closed = false`;
    await first.close();
    const restarted = createGuard();
    const retryContext = await prepare(restarted, body);
    const resumedProvider = vi.fn<typeof fetch>(async (input) => {
      expect(endpoint(input)).toBe(AZURE_RESPONSES);
      return azureGenerationResponse(FOREGROUND_TOKENS);
    });
    await restarted.createBudgetedFetch(retryContext, resumedProvider, AZURE_COUNT_KEY)(
      AZURE_RESPONSES, azureInit("azure-count-restart"));
    expect(initialProvider).toHaveBeenCalledOnce();
    expect(resumedProvider).toHaveBeenCalledOnce();
    expect((await queryOne(await admin`
      select state, count_provider, generation_provider from noxia_durable.public_provider_operation
    `))).toMatchObject({ state: "COMPLETED_RECEIVED", count_provider: "OPENAI", generation_provider: "AZURE_OPENAI" });
  });
});

describe.sequential("exact input count on the existing durable public operation journal", () => {
  it("derives the count payload from the exact native generation payload", () => {
    for (const body of [foregroundPayload(), backgroundPayload()]) {
      const generation = JSON.parse(body);
      const count = JSON.parse(openAIInputCountRequest({ endpoint: OPENAI_RESPONSES, method: "POST", body }).body);
      expect(count).toEqual(Object.fromEntries(["model", "instructions", "input", "reasoning", "text"]
        .filter((key) => generation[key] !== undefined).map((key) => [key, generation[key]])));
      expect(generation).toMatchObject({ model: "gpt-5.6-terra", reasoning: { effort: "medium" }, max_output_tokens: 8_000, store: false, service_tier: "default" });
    }
  });

  it("admits representative foreground and background together with exact provider-returned counts", async () => {
    const session = "representative-pair";
    const foregroundGuard = createGuard();
    const backgroundGuard = createGuard();
    const foregroundContext = await prepare(foregroundGuard, admissionBody(session, "foreground"));
    const backgroundContext = await prepare(backgroundGuard, admissionBody(session, "background"));
    let release!: () => void;
    const generationGate = new Promise<void>((resolve) => { release = resolve; });
    const provider = vi.fn<typeof fetch>(async (input, init) => {
      if (endpoint(input) === OPENAI_INPUT_TOKENS) {
        const count = JSON.parse(String(init?.body));
        return count.instructions.startsWith("Tu prépares en arrière-plan") ? countResponse(BACKGROUND_TOKENS) : countResponse(FOREGROUND_TOKENS);
      }
      const generation = JSON.parse(String(init?.body));
      await generationGate;
      return generationResponse(generation.instructions.startsWith("Tu prépares en arrière-plan") ? BACKGROUND_TOKENS : FOREGROUND_TOKENS,
        generation.instructions.startsWith("Tu prépares en arrière-plan") ? "background" : "foreground");
    });
    const foreground = foregroundGuard.createBudgetedFetch(foregroundContext, provider)(
      OPENAI_RESPONSES,
      observedInit(foregroundPayload(), "foreground"),
    );
    const background = backgroundGuard.createBudgetedFetch(backgroundContext, provider)(
      OPENAI_RESPONSES,
      observedInit(backgroundPayload(), "background"),
    );
    for (let attempt = 0; attempt < 150; attempt += 1) {
      const state = await queryOne(await admin`
        select count(*) filter (where state = 'DISPATCHED')::int as dispatched,
          sum(reserved_upper_bound_usd)::numeric as reserved
        from noxia_durable.public_provider_operation
      `);
      if (state?.dispatched === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const reserved = await queryOne(await admin`
      select count(*) filter (where state = 'DISPATCHED')::int as dispatched,
        sum(reserved_upper_bound_usd)::numeric as combined,
        min(counted_input_tokens)::int as min_tokens,
        max(counted_input_tokens)::int as max_tokens
      from noxia_durable.public_provider_operation
    `);
    expect(Number(reserved?.dispatched)).toBe(2);
    expect(Number(reserved?.min_tokens)).toBe(FOREGROUND_TOKENS);
    expect(Number(reserved?.max_tokens)).toBe(BACKGROUND_TOKENS);
    expect(Number(reserved?.combined)).toBeCloseTo(0.2063175, 9);
    release();
    await Promise.all([foreground, background]);
    expect(provider.mock.calls.filter(([input]) => endpoint(input) === OPENAI_INPUT_TOKENS)).toHaveLength(2);
    expect(provider.mock.calls.filter(([input]) => endpoint(input) === OPENAI_RESPONSES)).toHaveLength(2);
  });

  it.each([
    ["HTTP", async () => new Response('{"error":"synthetic"}', { status: 400 }), "PUBLIC_PROVIDER_INPUT_COUNT_HTTP_400"],
    ["DECODE", async () => new Response('{"object":"wrong"}', { status: 200 }), "PUBLIC_PROVIDER_INPUT_COUNT_INVALID"],
    ["TIMEOUT", async () => { const error = new Error("synthetic timeout"); error.name = "AbortError"; throw error; }, "PUBLIC_PROVIDER_INPUT_COUNT_TIMEOUT"],
  ])("fails closed on %s count failure without generation or financial reservation", async (kind, countCall, code) => {
    const guard = createGuard();
    const context = await prepare(guard, admissionBody(`count-failure-${kind}`, "request"));
    const provider = vi.fn<typeof fetch>(countCall);
    await expect(guard.createBudgetedFetch(context, provider)(OPENAI_RESPONSES,
      observedInit(foregroundPayload(), `count-failure-${kind}`))).rejects.toMatchObject({ code });
    expect(provider).toHaveBeenCalledTimes(1);
    const restarted = createGuard();
    const retryContext = await prepare(restarted, admissionBody(`count-failure-${kind}`, "request"));
    const forbidden = vi.fn<typeof fetch>();
    await expect(restarted.createBudgetedFetch(retryContext, forbidden)(OPENAI_RESPONSES,
      observedInit(foregroundPayload(), `count-failure-${kind}`))).rejects.toMatchObject({ code });
    expect(forbidden).not.toHaveBeenCalled();
    const state = await queryOne(await admin`
      select o.state, o.reserved_upper_bound_usd, o.count_failure_code,
        a.state as admission_state, s.admission_count, s.committed_cost_upper_bound_usd
      from noxia_durable.public_provider_operation o
      join noxia_durable.public_bridge_admission a on a.admission_key = o.admission_key
      join noxia_durable.public_guard_session s on s.session_key_hash = o.session_key_hash
      where o.operation_key is not null
    `);
    expect(state).toMatchObject({ state: "COUNT_FAILED", count_failure_code: code,
      admission_state: "COUNTING", admission_count: 0 });
    expect(Number(state?.reserved_upper_bound_usd)).toBe(0);
    expect(Number(state?.committed_cost_upper_bound_usd)).toBe(0);
  });

  it("recovers a completed count after restart without recounting", async () => {
    const payload = admissionBody("count-restart", "request");
    const first = createGuard();
    const firstContext = await prepare(first, payload);
    let releaseCount!: () => void;
    const countGate = new Promise<void>((resolve) => { releaseCount = resolve; });
    const firstProvider = vi.fn<typeof fetch>(async (input) => {
      if (endpoint(input) !== OPENAI_INPUT_TOKENS) throw new Error("GENERATION_MUST_NOT_RUN_BEFORE_RECOVERY");
      await countGate;
      return countResponse(FOREGROUND_TOKENS);
    });
    const interrupted = first.createBudgetedFetch(firstContext, firstProvider)(OPENAI_RESPONSES,
      observedInit(foregroundPayload(), "count-restart"));
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const state = await queryOne(await admin`select state from noxia_durable.public_provider_operation`);
      if (state?.state === "COUNT_DISPATCHED") break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await admin`update noxia_durable.public_guard_session set provider_gate_closed = true`;
    releaseCount();
    await expect(interrupted).rejects.toMatchObject({ code: "PUBLIC_SESSION_BUDGET_CLOSED" });
    expect((await queryOne(await admin`select state, counted_input_tokens from noxia_durable.public_provider_operation`)))
      .toMatchObject({ state: "COUNT_COMPLETED", counted_input_tokens: FOREGROUND_TOKENS });
    await admin`update noxia_durable.public_guard_session set provider_gate_closed = false`;
    await first.close();

    const restarted = createGuard();
    const restartedContext = await prepare(restarted, payload);
    const recoveredProvider = vi.fn<typeof fetch>(async (input) => {
      if (endpoint(input) === OPENAI_INPUT_TOKENS) throw new Error("COUNT_MUST_BE_RECOVERED");
      return generationResponse(FOREGROUND_TOKENS, "count-recovered");
    });
    await restarted.createBudgetedFetch(restartedContext, recoveredProvider)(OPENAI_RESPONSES,
      observedInit(foregroundPayload(), "count-restart"));
    expect(recoveredProvider).toHaveBeenCalledTimes(1);
    expect(endpoint(recoveredProvider.mock.calls[0]![0])).toBe(OPENAI_RESPONSES);
  });

  it("rejects a stale count when the generation contract changes", async () => {
    const guard = createGuard();
    const context = await prepare(guard, admissionBody("stale-count", "request"));
    const provider = vi.fn<typeof fetch>(async (input) => endpoint(input) === OPENAI_INPUT_TOKENS
      ? countResponse(FOREGROUND_TOKENS) : generationResponse(FOREGROUND_TOKENS, "stale-base"));
    await guard.createBudgetedFetch(context, provider)(OPENAI_RESPONSES, observedInit(foregroundPayload(), "stale-count"));
    const altered = JSON.parse(foregroundPayload());
    altered.max_output_tokens = 7_999;
    const forbidden = vi.fn<typeof fetch>();
    await expect(guard.createBudgetedFetch(context, forbidden)(OPENAI_RESPONSES,
      observedInit(JSON.stringify(altered), "stale-count"))).rejects.toMatchObject({ code: "PUBLIC_STALE_OPERATION_REJECTED" });
    expect(forbidden).not.toHaveBeenCalled();
  });

  it("lets the atomic reservation transaction decide after two concurrent counts", async () => {
    const workerA = createGuard();
    const workerB = createGuard();
    const contextA = await prepare(workerA, admissionBody("count-race", "a"));
    const contextB = await prepare(workerB, admissionBody("count-race", "b"));
    let releaseCounts!: () => void;
    let releaseGeneration!: () => void;
    const countGate = new Promise<void>((resolve) => { releaseCounts = resolve; });
    const generationGate = new Promise<void>((resolve) => { releaseGeneration = resolve; });
    const provider = vi.fn<typeof fetch>(async (input) => {
      if (endpoint(input) === OPENAI_INPUT_TOKENS) { await countGate; return countResponse(600_000); }
      await generationGate;
      return generationResponse(600_000, "count-race-winner");
    });
    const first = workerA.createBudgetedFetch(contextA, provider)(OPENAI_RESPONSES,
      observedInit(foregroundPayload(), "race-a"));
    const second = workerB.createBudgetedFetch(contextB, provider)(OPENAI_RESPONSES,
      observedInit(foregroundPayload(), "race-b"));
    const resultsPromise = Promise.allSettled([first, second]);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (provider.mock.calls.filter(([input]) => endpoint(input) === OPENAI_INPUT_TOKENS).length === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    releaseCounts();
    for (let attempt = 0; attempt < 150; attempt += 1) {
      if (provider.mock.calls.filter(([input]) => endpoint(input) === OPENAI_RESPONSES).length === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    releaseGeneration();
    const results = await resultsPromise;
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect((results.find((result) => result.status === "rejected") as PromiseRejectedResult).reason)
      .toMatchObject({ code: "PUBLIC_PROVIDER_DENIED_HARD_BUDGET" });
    expect(provider.mock.calls.filter(([input]) => endpoint(input) === OPENAI_INPUT_TOKENS)).toHaveLength(2);
    expect(provider.mock.calls.filter(([input]) => endpoint(input) === OPENAI_RESPONSES)).toHaveLength(1);
    const reservations = await queryOne(await admin`
      select count(*) filter (where reserved_upper_bound_usd > 0)::int as reserved,
        sum(reserved_upper_bound_usd)::numeric as total
      from noxia_durable.public_provider_operation
    `);
    expect(reservations?.reserved).toBe(1);
    expect(Number(reservations?.total)).toBeLessThanOrEqual(6);
  });

  it("uses the existing conservative bound formula with counted input and real output contract", () => {
    const foreground = boundCanaryProviderCall(OPENAI_RESPONSES, foregroundPayload(), FOREGROUND_TOKENS)!;
    const background = boundCanaryProviderCall(OPENAI_RESPONSES, backgroundPayload(), BACKGROUND_TOKENS)!;
    expect(foreground).toMatchObject({ inputTokenUpperBound: FOREGROUND_TOKENS, outputTokenUpperBound: 8_000,
      inputBoundBasis: "PROVIDER_EXACT_INPUT_COUNT", upperBoundUsd: 0.1006025 });
    expect(background).toMatchObject({ inputTokenUpperBound: BACKGROUND_TOKENS, outputTokenUpperBound: 8_000,
      inputBoundBasis: "PROVIDER_EXACT_INPUT_COUNT", upperBoundUsd: 0.105715 });
    expect(foreground.upperBoundUsd + background.upperBoundUsd).toBeCloseTo(0.2063175, 9);
  });
});
