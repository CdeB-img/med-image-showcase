import { mkdtemp, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createProtocolDesignerReplayFetch,
  createRecordedProtocolDesignerFetch,
  readProtocolDesignerReplayRefs,
} from "../../../../server/protocol-designer-provider-replay";
import type { ProviderObservedRequestInit } from "../provider-call-observability";
import { FileScientificInterpretationEvidenceStore } from "../../../../api/scientific-interpretation-evidence-store";
import { boundCanaryProviderCall, canaryBudgetAdmission, resolveCanaryExecution, settleCanaryProviderCall, SINGLE_ATTEMPT_FAIL_CLOSED } from "../../../../server/protocol-designer-canary-policy";

const endpoint = "https://api.openai.com/v1/responses";
const request = { method: "POST", body: JSON.stringify({ model: "gpt-5.6-terra", input: "Texte scientifique exact", reasoning: { effort: "low" } }),
  headers: { Authorization: "Bearer test-private-credential" } };

describe("durable provider adapter record/replay, mocks only", () => {
  afterEach(() => vi.restoreAllMocks());
  it("persists the actual payload, response, usage and context then replays without a provider", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-replay-"));
    const response = '{ "id": "resp-1", "model": "returned-version", "usage": {"input_tokens":17}, "output_text":"réponse" }';
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(response, { status: 200, headers: { "x-request-id": "req-1", "set-cookie": "private" } }));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, context: { sessionId: "s1", turnId: "t1" } });
    const observedRequest: ProviderObservedRequestInit = { ...request, noxiaProviderObservation: {
      context: { sessionId: "s1", conversationId: "c1", turnId: "t1", clientRequestId: "req1", testSessionId: "test1" },
      purpose: "PERSISTENT_DELTA", reasoningEffort: "low", retryIndex: 1, retryReason: "DETERMINISTIC_VALIDATION_REJECTED",
    } };
    expect(await (await record(endpoint, observedRequest)).text()).toBe(response);
    const refs = await readProtocolDesignerReplayRefs(root);
    const file = JSON.parse(await readFile(join(root, "raw", (await readdir(join(root, "raw")))
      .find((name) => name.endsWith(`-${refs[0]!.split(":")[1]}.json`))!), "utf8"));
    expect(file.payload.request.body).toBe(request.body);
    expect(file.payload).toMatchObject({ modelRequested: "gpt-5.6-terra", reasoningEffort: "low", context: { sessionId: "s1", turnId: "t1" }, attemptIndex: 0 });
    expect(file.payload.callMetadata).toEqual(observedRequest.noxiaProviderObservation);
    expect(file.payload.latencyMs).toBeGreaterThanOrEqual(0);
    expect(file.payload.response.body).toBe(response);
    expect(file.payload.response.headers).toEqual({ "content-type": "text/plain;charset=UTF-8", "x-request-id": "req-1" });
    expect(JSON.stringify(file)).not.toContain("test-private-credential");
    expect(JSON.stringify(file)).not.toContain("set-cookie");
    const replay = createProtocolDesignerReplayFetch({ root, refs });
    await expect(replay(endpoint, { ...request, body: request.body.replace("exact", "different") })).rejects.toThrow("REQUEST_MISMATCH");
    expect(await (await replay(endpoint, request)).text()).toBe(response);
    await expect(replay(endpoint, request)).rejects.toThrow("EXHAUSTED_NO_LIVE_FALLBACK");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("records HTTP failure and transport failure with no retry; redacts secrets", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-failure-"));
    const provider = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { api_key: "private", message: "test-private-credential" }, usage: { input_tokens: 8 } }), { status: 503 }))
      .mockRejectedValueOnce(new Error("secret transport detail"));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, secrets: ["test-private-credential"] });
    expect((await record(endpoint, request)).status).toBe(503);
    await expect(record(endpoint, request)).rejects.toThrow("secret transport detail");
    const refs = await readProtocolDesignerReplayRefs(root);
    const replay = createProtocolDesignerReplayFetch({ root, refs });
    const result = await replay(endpoint, request);
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("test-private-credential");
    await expect(replay(endpoint, request)).rejects.toThrow("NETWORK_FAILURE");
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it("rejects tampered evidence and unsupported endpoints without a provider", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-integrity-"));
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider });
    await expect(record("https://example.org", request)).rejects.toThrow("ENDPOINT_NOT_ALLOWED");
    await record(endpoint, request);
    const refs = await readProtocolDesignerReplayRefs(root);
    const path = join(root, "raw", (await readdir(join(root, "raw"))).find((name) => name.endsWith(`-${refs[0]!.split(":")[1]}.json`))!);
    const stored = JSON.parse(await readFile(path, "utf8"));
    stored.payload.response.body = "corrupted";
    await writeFile(path, JSON.stringify(stored));
    await expect(createProtocolDesignerReplayFetch({ root, refs })(endpoint, request)).rejects.toThrow("INTEGRITY_FAILURE");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("consumes a fixture only once even for concurrent identical requests", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-concurrent-"));
    await createRecordedProtocolDesignerFetch({ root, fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response("{}")) })(endpoint, request);
    const replay = createProtocolDesignerReplayFetch({ root, refs: await readProtocolDesignerReplayRefs(root) });
    const results = await Promise.allSettled([replay(endpoint, request), replay(endpoint, request)]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
  });

  it("blocks before a paid request when recording preflight is unavailable", async () => {
    const folder = await mkdtemp(join(tmpdir(), "noxia-provider-no-store-"));
    const root = join(folder, "not-a-directory");
    await writeFile(root, "synthetic");
    const provider = vi.fn<typeof fetch>();
    await expect(createRecordedProtocolDesignerFetch({ root, fetchImpl: provider })(endpoint, request)).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled();
  });

  it("does not lose received usage or trigger another call on completion IO failure", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-post-io-"));
    const original = FileScientificInterpretationEvidenceStore.prototype.persistAtomically;
    vi.spyOn(FileScientificInterpretationEvidenceStore.prototype, "persistAtomically")
      .mockImplementationOnce(function (input) { return original.call(this, input); })
      .mockRejectedValueOnce(new Error("synthetic disk full"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"usage":{"input_tokens":500}}'));
    const onPersistenceError = vi.fn();
    const response = await createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, onPersistenceError })(endpoint, request);
    expect(await response.json()).toEqual({ usage: { input_tokens: 500 } });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(onPersistenceError).toHaveBeenCalledWith("PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED");
    expect(await readProtocolDesignerReplayRefs(root)).toEqual([]);
    expect(await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8")).toContain("REQUEST_PREPARED");
  });

  it("replays start order when concurrent responses complete out of order", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-order-"));
    let finishFirst!: (value: Response) => void;
    let notifyFirst!: () => void;
    const startedFirst = new Promise<void>((resolve) => { notifyFirst = resolve; });
    const provider = vi.fn<typeof fetch>()
      .mockImplementationOnce(() => { notifyFirst(); return new Promise<Response>((resolve) => { finishFirst = resolve; }); })
      .mockResolvedValueOnce(new Response('"second"'));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider });
    const first = record(endpoint, request);
    await startedFirst;
    const secondRequest = { ...request, body: request.body.replace("exact", "second") };
    await record(endpoint, secondRequest);
    finishFirst(new Response('"first"'));
    await first;
    const replay = createProtocolDesignerReplayFetch({ root, refs: await readProtocolDesignerReplayRefs(root) });
    expect(await (await replay(endpoint, request)).text()).toBe('"first"');
    expect(await (await replay(endpoint, secondRequest)).text()).toBe('"second"');
  });

  it("keeps the adapter response usable when only its evidence copy fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-copy-"));
    const response = new Response('{"usage":{"input_tokens":321}}');
    vi.spyOn(response, "clone").mockImplementation(() => { throw new Error("synthetic capture failure"); });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const provider = vi.fn<typeof fetch>().mockResolvedValue(response);
    const onPersistenceError = vi.fn();
    const result = await createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, onPersistenceError })(endpoint, request);
    expect(await result.json()).toEqual({ usage: { input_tokens: 321 } });
    expect(onPersistenceError).toHaveBeenCalledWith("PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED");
    expect(provider).toHaveBeenCalledTimes(1);
    expect(await readProtocolDesignerReplayRefs(root)).toEqual([]);
  });
});

describe("canary B1-B8 — durable admission before every provider transport", () => {
  afterEach(() => vi.restoreAllMocks());
  const canaryRequest = (id = "r1", overrides = {}): ProviderObservedRequestInit => ({
    method: "POST", body: JSON.stringify({ model: "gpt-5.6-luna", instructions: "Instruction synthétique",
      input: "Texte synthétique", max_output_tokens: 8_000, store: false, ...overrides }),
    noxiaProviderObservation: {
      context: { sessionId: "s1", conversationId: "c1", turnId: "same-turn", clientRequestId: id, testSessionId: "offline" },
      purpose: "LANGUAGE_PROJECTION", reasoningEffort: "low", retryIndex: 0, retryReason: null,
    },
  });
  const response = (input = 1_000, output = 100, model = "gpt-5.6-luna") => new Response(JSON.stringify({
    id: "synthetic-response", model, status: "completed",
    usage: { input_tokens: input, output_tokens: output, input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 } },
    output_text: "synthetic text",
  }));
  const create = async (provider = vi.fn<typeof fetch>().mockImplementation(async () => response())) => {
    const root = await mkdtemp(join(tmpdir(), "noxia-canary-safety-"));
    const options = { root, fetchImpl: provider, canaryCampaignId: "offline-safety" };
    return { root, provider, options, run: createRecordedProtocolDesignerFetch(options) };
  };
  const exchanges = async (root: string) => Promise.all((await readProtocolDesignerReplayRefs(root))
    .map((ref) => new FileScientificInterpretationEvidenceStore(root).read(ref)));

  it("B1/B7: records the bound BEFORE spend, preserves payload/response and settles reported cost separately", async () => {
    const env = await create();
    env.provider.mockImplementation(async (_input, init) => {
      expect(init).toEqual({ ...canaryRequest(), body: JSON.stringify({
        ...JSON.parse(canaryRequest().body as string), service_tier: "default",
      }) });
      const journal = await readFile(join(env.root, "protocol-designer-exchanges.jsonl"), "utf8");
      expect(journal).toContain("REQUEST_PREPARED");
      expect(journal).not.toContain("COMPLETED");
      const prepared = await new FileScientificInterpretationEvidenceStore(env.root).read(JSON.parse(journal.trim()).rawOutputRef);
      expect(prepared?.payload).toMatchObject({ canaryAdmission: {
        committedBeforeUsd: 0, measuredBeforeUsd: 0, policy: SINGLE_ATTEMPT_FAIL_CLOSED,
        budgetPolicy: { absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 1 },
        bound: { inputBoundBasis: "DOCUMENTED_MODEL_CONTEXT_LIMIT", inputTokenUpperBound: 1_050_000, outputTokenUpperBound: 8_000 },
      } });
      return response();
    });
    const result = await env.run(endpoint, canaryRequest());
    expect(await result.text()).toBe(await response().text());
    const record = (await exchanges(env.root))[0]!.payload as { canaryAdmission: { bound: { upperBoundUsd: number } }; canarySettlement: { measuredCostUsd: number; committedCostUpperBoundUsd: number } };
    expect(record.canaryAdmission.bound.upperBoundUsd).toBeCloseTo(0.5394, 8);
    expect(record.canarySettlement.measuredCostUsd).toBeCloseTo(0.00032, 10);
    expect(record.canarySettlement.committedCostUpperBoundUsd).toBeCloseTo(0.00037, 8);
    const replay = createProtocolDesignerReplayFetch({ root: env.root, refs: await readProtocolDesignerReplayRefs(env.root) });
    expect(await (await replay(endpoint, canaryRequest())).text()).toBe(await response().text());
    expect(env.provider).toHaveBeenCalledTimes(1);
  });

  it("B2: denies a next Terra call that would exceed six dollars, even through a new recorder instance", async () => {
    const env = await create(vi.fn<typeof fetch>().mockImplementation(async () => response(900_000, 8_000)));
    await env.run(endpoint, canaryRequest());
    await env.run(endpoint, canaryRequest("r2"));
    const terra = canaryRequest("r3", { model: "gpt-5.6-terra" });
    terra.noxiaProviderObservation = { ...terra.noxiaProviderObservation!, purpose: "PERSISTENT_DELTA" };
    await expect(createRecordedProtocolDesignerFetch(env.options)(endpoint, terra)).rejects.toThrow("DENIED_HARD_BUDGET");
    expect(env.provider).toHaveBeenCalledTimes(2);
  });

  it("B3: stops at one measured dollar, not at one conservatively committed dollar", async () => {
    const env = await create(vi.fn<typeof fetch>().mockImplementation(async () => response(700_000, 8_000)));
    await env.run(endpoint, canaryRequest());
    await env.run(endpoint, canaryRequest("r2"));
    await env.run(endpoint, canaryRequest("r3"));
    // Engaged 1.0932 > 1, measured 0.8832 < 1: a fourth call is permitted.
    await env.run(endpoint, canaryRequest("r4"));
    await expect(env.run(endpoint, canaryRequest("r5"))).rejects.toThrow("DENIED_SOFT_STOP");
    expect(env.provider).toHaveBeenCalledTimes(4);
    const records = await exchanges(env.root);
    expect(records[3]!.payload).toMatchObject({ canaryAdmission: { measuredBeforeUsd: 0.8832, committedBeforeUsd: 1.0932 } });
    const bound = boundCanaryProviderCall(endpoint, canaryRequest("r", { service_tier: "default" }).body as string);
    expect(canaryBudgetAdmission(1.25, bound, 1)).toBe("DENIED_SOFT_STOP");
    expect(canaryBudgetAdmission(1.2, bound, 0.9)).toBe("ADMITTED");
    expect(canaryBudgetAdmission(NaN, bound, 0)).toBe("DENIED_UNKNOWN_CUMULATIVE_COST");
    expect(canaryBudgetAdmission(0, bound, NaN)).toBe("DENIED_UNKNOWN_CUMULATIVE_COST");
  });

  it.each([
    ["B4 unknown price/model", { model: "unknown-model" }],
    ["B5 unknown output ceiling", { max_output_tokens: undefined }],
    ["unsupported priority class", { service_tier: "priority" }],
    ["unsupported inherited auto class", { service_tier: "auto" }],
    ["unbounded external tool charge", { tools: [{ type: "web_search" }] }],
    ["hidden conversation state", { previous_response_id: "hidden-input" }],
    ["unbounded multimodal input", { input: [{ type: "image_url" }] }],
  ])("%s: refuses unknown bounds without a provider", async (_label, overrides) => {
    const env = await create();
    await expect(env.run(endpoint, canaryRequest("r1", overrides))).rejects.toThrow("DENIED_UNKNOWN_UPPER_BOUND");
    expect(env.provider).not.toHaveBeenCalled();
  });

  it("B6: recalculates inside the SAME turn; each logical call has its own reservation", async () => {
    const env = await create();
    await env.run(endpoint, canaryRequest());
    await env.run(endpoint, canaryRequest("r2"));
    const records = await exchanges(env.root);
    expect(records[1]!.payload).toMatchObject({ canaryAdmission: { committedBeforeUsd: 0.00037, measuredBeforeUsd: 0.00032 } });
    expect(env.provider).toHaveBeenCalledTimes(2);
  });

  it("B8: concurrent instances cannot spend the same reservation, and a duplicate logical call stays consumed", async () => {
    let finish!: (value: Response) => void;
    let started!: () => void;
    const entered = new Promise<void>((resolve) => { started = resolve; });
    const env = await create(vi.fn<typeof fetch>().mockImplementation(async () => {
      started(); return new Promise<Response>((resolve) => { finish = resolve; });
    }));
    const pending = env.run(endpoint, canaryRequest());
    await entered;
    await expect(createRecordedProtocolDesignerFetch(env.options)(endpoint, canaryRequest("r2")))
      .rejects.toThrow("CANARY_CONCURRENT_OR_UNSETTLED_EXECUTION");
    finish(response());
    await pending;
    await expect(createRecordedProtocolDesignerFetch(env.options)(endpoint, canaryRequest()))
      .rejects.toThrow("CANARY_LOGICAL_CALL_ALREADY_CONSUMED");
    const retry = canaryRequest("r3");
    retry.noxiaProviderObservation = { ...retry.noxiaProviderObservation!, retryIndex: 1 };
    await expect(env.run(endpoint, retry)).rejects.toThrow("CANARY_SINGLE_ATTEMPT_METADATA_REQUIRED");
    expect(env.provider).toHaveBeenCalledTimes(1);
  });

  it("cannot create a fresh budget by changing the session within the same campaign", async () => {
    const env = await create();
    await env.run(endpoint, canaryRequest());
    const next = canaryRequest("r2");
    next.noxiaProviderObservation = { ...next.noxiaProviderObservation!, context: { ...next.noxiaProviderObservation!.context, sessionId: "another-session" } };
    await expect(env.run(endpoint, next)).rejects.toThrow("CANARY_SESSION_MISMATCH");
    expect(env.provider).toHaveBeenCalledTimes(1);
  });

  it.each(["USAGE_MISSING", "OUTPUT_EXCEEDS_BOUND", "HTTP_FAILURE", "CAPTURE_FAILURE"])("stops after %s without releasing an uncertain reservation", async (kind) => {
    const env = await create();
    if (kind === "CAPTURE_FAILURE") {
      const original = FileScientificInterpretationEvidenceStore.prototype.persistAtomically;
      vi.spyOn(FileScientificInterpretationEvidenceStore.prototype, "persistAtomically")
        .mockImplementationOnce(function (input) { return original.call(this, input); })
        .mockRejectedValueOnce(new Error("synthetic disk full"));
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    } else env.provider.mockImplementation(async () => kind === "USAGE_MISSING" ? new Response("{}")
      : kind === "HTTP_FAILURE" ? new Response("{}", { status: 503 }) : response(1_000, 8_001));
    await env.run(endpoint, canaryRequest());
    await expect(env.run(endpoint, canaryRequest("r2"))).rejects.toThrow(/CANARY_STOP_/);
    expect(env.provider).toHaveBeenCalledTimes(1);
  });

  it("keeps unknown evidence fail-closed and requires explicit server configuration", async () => {
    const env = await create();
    await writeFile(join(env.root, "protocol-designer-exchanges.jsonl"), '{"bad":true}\n');
    await expect(env.run(endpoint, canaryRequest())).rejects.toThrow("CANARY_LEDGER_INTEGRITY_FAILURE");
    expect(env.provider).not.toHaveBeenCalled();
    expect(resolveCanaryExecution({})).toBeNull();
    expect(() => resolveCanaryExecution({ PROTOCOL_DESIGNER_LIVE_CANARY: "typo" })).toThrow("NO_NORMAL_FALLBACK");
    expect(() => resolveCanaryExecution({ PROTOCOL_DESIGNER_CANARY_ID: "orphan" })).toThrow("NO_NORMAL_FALLBACK");
    expect(resolveCanaryExecution({ PROTOCOL_DESIGNER_LIVE_CANARY: SINGLE_ATTEMPT_FAIL_CLOSED, PROTOCOL_DESIGNER_CANARY_ID: "offline" }))
      .toEqual({ attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: "offline" });
  });

  it("admits the first Terra call under six dollars without inventing a tighter token bound", async () => {
    const env = await create(vi.fn<typeof fetch>().mockImplementation(async () => response(1_000, 100, "gpt-5.6-terra")));
    const req = canaryRequest("terra", { model: "gpt-5.6-terra", service_tier: "default" });
    req.noxiaProviderObservation = { ...req.noxiaProviderObservation!, purpose: "PERSISTENT_DELTA" };
    const bound = boundCanaryProviderCall(endpoint, req.body as string);
    expect(bound?.upperBoundUsd).toBeCloseTo(5.394, 8);
    expect(canaryBudgetAdmission(0, bound, 0)).toBe("ADMITTED");
    expect(canaryBudgetAdmission(0.606, bound, 0.5)).toBe("ADMITTED");
    expect(canaryBudgetAdmission(0.606000001, bound, 0.5)).toBe("DENIED_HARD_BUDGET");
    await env.run(endpoint, req);
    expect(env.provider).toHaveBeenCalledTimes(1);
  });

  it.each(["MISSING", "EMPTY", "LOST_LAST_PAIR"])("refuses %s journal evidence instead of resetting spend or consumed calls", async (kind) => {
    const env = await create();
    await env.run(endpoint, canaryRequest());
    await env.run(endpoint, canaryRequest("r2"));
    const journal = join(env.root, "protocol-designer-exchanges.jsonl");
    if (kind === "MISSING") await unlink(journal);
    else if (kind === "EMPTY") await writeFile(journal, "");
    else await writeFile(journal, (await readFile(journal, "utf8")).trim().split("\n").slice(0, 2).join("\n") + "\n");
    await expect(createRecordedProtocolDesignerFetch(env.options)(endpoint, canaryRequest("r2"))).rejects.toThrow(/CANARY_LEDGER_/);
    expect(env.provider).toHaveBeenCalledTimes(2);
  });
  it("accounts for Gemini hidden reasoning and rejects missing or mismatched billing/model evidence", async () => {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";
    const request = { ...canaryRequest(), body: JSON.stringify({ systemInstruction: { parts: [{ text: "synthetic" }] },
      contents: [{ role: "user", parts: [{ text: "synthetic" }] }], generationConfig: { responseMimeType: "application/json" } }) };
    request.noxiaProviderObservation = { ...request.noxiaProviderObservation!, purpose: "CONVERSATION_REALIZATION" };
    const bound = boundCanaryProviderCall(url, request.body)!;
    expect(bound.upperBoundUsd).toBeCloseTo(0.4784128, 8);
    const body = { modelVersion: "gemini-3.5-flash-lite", usageMetadata: { promptTokenCount: 1_000,
      candidatesTokenCount: 100, thoughtsTokenCount: 200, totalTokenCount: 1_300 } };
    expect(settleCanaryProviderCall(bound, JSON.stringify(body))).toMatchObject({ billableOutputTokens: 300 });
    expect(settleCanaryProviderCall(bound, JSON.stringify({ ...body, modelVersion: "another-provider-model" }))).toBeNull();
    expect(settleCanaryProviderCall(bound, JSON.stringify({ usageMetadata: { promptTokenCount: 1_000, candidatesTokenCount: 100 } }))).toBeNull();
    const env = await create(vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify(body))));
    await env.run(url, request);
    expect((await exchanges(env.root))[0]?.payload).toMatchObject({ canarySettlement: { billableOutputTokens: 300 } });
    expect(env.provider).toHaveBeenCalledTimes(1);
  });
});
