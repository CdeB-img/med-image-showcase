import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createCanaryCampaignPolicy, SINGLE_ATTEMPT_FAIL_CLOSED } from "../../../../server/protocol-designer-canary-policy";
import { createRecordedProtocolDesignerFetch, readCanaryState, readProtocolDesignerReplayRefs, createProtocolDesignerReplayFetch, type CanaryProviderRequestInit } from "../../../../server/protocol-designer-provider-replay";

const endpoint = "https://api.openai.com/v1/responses";
const policy = (overrides = {}) => createCanaryCampaignPolicy({ campaignId: "terra-demo-test", maxSessions: 2,
  measuredSoftStopUsd: 3, absoluteHardBoundUsd: 5, singleAttemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED,
  allowedProviderModels: ["gpt-5.6-terra"], createdAt: "2026-09-17T00:00:00.000Z",
  exactInputCounting: { maxInputTokens: 24000, maxGenerationAttempts: 64, maxTokenCountRequests: 64, maxProviderHttpRequests: 128 }, ...overrides });
const request = (turn = "t1"): CanaryProviderRequestInit => ({ method: "POST", headers: { authorization: "Bearer private-test" },
  body: JSON.stringify({ model: "gpt-5.6-terra", instructions: "Instruction inchangée", input: `message ${turn}`,
    reasoning: { effort: "medium" }, max_output_tokens: 8000, store: false, service_tier: "default" }),
  signal: new AbortController().signal,
  noxiaProviderObservation: { context: { sessionId: "s1", conversationId: "c1", turnId: turn, clientRequestId: turn, testSessionId: null },
    purpose: "CONVERSATION_REALIZATION", reasoningEffort: "medium", retryIndex: 0, retryReason: null } });
const generation = (tokens = 100) => new Response(JSON.stringify({ model: "gpt-5.6-terra", status: "completed",
  usage: { input_tokens: tokens, output_tokens: 20 }, output_text: "texte libre" }));
const setup = async (campaignPolicy = policy(), count = 100, result = generation()) => {
  const base = await mkdtemp(join(tmpdir(), "noxia-terra-finance-"));
  const root = join(base, `canary-${campaignPolicy.campaignId}`);
  const provider = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    return String(input).endsWith("/input_tokens")
      ? new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: count })) : result.clone();
  });
  return { root, provider, run: () => createRecordedProtocolDesignerFetch({ root, campaignPolicy,
    canaryCampaignId: campaignPolicy.campaignId, fetchImpl: provider, secrets: ["private-test"] }) };
};

describe("Terra demo: the existing recorder owns counting, reservation and settlement", () => {
  it("counts the exact input, leaves generation unchanged and reconstructs costs across restarts", async () => {
    const p = policy(); const { root, provider, run } = await setup(p);
    expect(await (await run()(endpoint, request())).json()).toMatchObject({ output_text: "texte libre" });
    const count = JSON.parse(provider.mock.calls[0]![1]!.body as string);
    expect(count).toEqual({ model: "gpt-5.6-terra", instructions: "Instruction inchangée", input: "message t1", reasoning: { effort: "medium" } });
    expect(provider.mock.calls[1]![1]!.body).toBe(request().body);
    expect(await readCanaryState(root, p.campaignId, p)).toMatchObject({ generationAttempts: 1, tokenCountRequests: 1,
      providerHttpRequests: 2, measured: 0.00044, committed: 0.00049 });
    await run()(endpoint, request("t2"));
    expect((await readCanaryState(root, p.campaignId, p)).providerHttpRequests).toBe(4);
    const journal = await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8");
    expect(journal).not.toContain("private-test");
    const scope = { campaignId: p.campaignId, sessionId: "s1" };
    const replay = createProtocolDesignerReplayFetch({ root, refs: await readProtocolDesignerReplayRefs(root, scope), scope });
    expect(await (await replay(endpoint, request())).json()).toMatchObject({ output_text: "texte libre" });
    expect(provider).toHaveBeenCalledTimes(4);
  });
  it("blocks generation above the input ceiling and consumes the count exactly once", async () => {
    const { run, provider } = await setup(policy(), 24001);
    await expect(run()(endpoint, request())).rejects.toThrow("CONVERSATION_MEMORY_LIMIT");
    await expect(run()(endpoint, request())).rejects.toThrow("COUNT_ALREADY_CONSUMED");
    expect(provider).toHaveBeenCalledTimes(1);
  });
  it("closes after a rejected token count and dispatches no generation or subsequent HTTP", async () => {
    const p = policy(); const { root, run, provider } = await setup(p);
    provider.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Input must contain json" } }), { status: 400 }));
    await expect(run()(endpoint, request())).rejects.toThrow("CANARY_STOP_PREVIOUS_PROVIDER_FAILURE");
    await expect(readCanaryState(root, p.campaignId, p)).rejects.toThrow("CANARY_STOP_PREVIOUS_PROVIDER_FAILURE");
    await expect(run()(endpoint, request("t2"))).rejects.toThrow("CANARY_STOP_PREVIOUS_PROVIDER_FAILURE");
    expect(provider).toHaveBeenCalledTimes(1);
  });
  it("blocks generation at the hard cap after exact count, without reducing the output reserve", async () => {
    const { run, provider } = await setup(policy({ absoluteHardBoundUsd: 0.01, measuredSoftStopUsd: 0.005 }));
    await expect(run()(endpoint, request())).rejects.toThrow("DENIED_HARD_BUDGET");
    expect(provider).toHaveBeenCalledTimes(1);
  });
  it("checks HTTP limits before counting and preserves the measured soft stop", async () => {
    const p = policy({ measuredSoftStopUsd: 0.0004 }); const { root, provider, run } = await setup(p);
    await run()(endpoint, request());
    await expect(run()(endpoint, request("t2"))).rejects.toThrow("DENIED_SOFT_STOP");
    expect((await readCanaryState(root, p.campaignId, p)).providerHttpRequests).toBe(2);
    expect(provider).toHaveBeenCalledTimes(2);
    const capped = await setup(policy({ exactInputCounting: { maxInputTokens: 24000, maxGenerationAttempts: 1, maxTokenCountRequests: 1, maxProviderHttpRequests: 2 } }));
    await capped.run()(endpoint, request());
    await expect(capped.run()(endpoint, request("t2"))).rejects.toThrow("HTTP_LIMIT_REACHED");
    expect(capped.provider).toHaveBeenCalledTimes(2);
  });
  it("closes the campaign when generation usage is absent or exceeds the counted input", async () => {
    for (const result of [new Response('{"status":"completed"}'), generation(101)]) {
      const { run, provider } = await setup(policy(), 100, result);
      await run()(endpoint, request());
      await expect(run()(endpoint, request("t2"))).rejects.toThrow("UNKNOWN_OR_UNBOUNDED_ACTUAL_COST");
      expect(provider).toHaveBeenCalledTimes(2);
    }
  });
  it("refuses a truncated journal and never resets spend", async () => {
    const { root, run, provider } = await setup(); await run()(endpoint, request());
    await writeFile(join(root, "protocol-designer-exchanges.jsonl"), "");
    await expect(run()(endpoint, request("t2"))).rejects.toThrow("ORPHAN_RAW_EVIDENCE");
    expect(provider).toHaveBeenCalledTimes(2);
  });
  it("retains the full reserve and blocks all subsequent HTTP after an incomplete generation, even with reported usage", async () => {
    const p = policy();
    const { root, run, provider } = await setup(p, 100, new Response(JSON.stringify({ model: "gpt-5.6-terra",
      status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, usage: { input_tokens: 100, output_tokens: 8000 } })));
    await run()(endpoint, request());
    await expect(readCanaryState(root, p.campaignId, p)).rejects.toThrow("UNKNOWN_OR_UNBOUNDED_ACTUAL_COST");
    await expect(run()(endpoint, request("t2"))).rejects.toThrow("UNKNOWN_OR_UNBOUNDED_ACTUAL_COST");
    expect(provider).toHaveBeenCalledTimes(2);
    const journal = await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8");
    expect(journal).toContain("COMPLETED");
  });
  it("never dispatches an unqualified payload, another model or an automatic retry", async () => {
    for (const changed of [
      { ...request(), body: (request().body as string).replace("gpt-5.6-terra", "gpt-5.6-luna") },
      { ...request(), body: JSON.stringify({ ...JSON.parse(request().body as string), tools: [] }) },
      { ...request(), noxiaProviderObservation: { ...request().noxiaProviderObservation!, retryIndex: 1 } },
    ]) { const { run, provider } = await setup(); await expect(run()(endpoint, changed)).rejects.toThrow(); expect(provider).not.toHaveBeenCalled(); }
  });
});
