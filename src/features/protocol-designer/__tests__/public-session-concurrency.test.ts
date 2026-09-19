import { beforeEach, describe, expect, it, vi } from "vitest";
import { admitPublicProtocolDesignerRequest, createPublicProtocolDesignerBudgetedFetch,
  publicProtocolDesignerGuardStateForTests, resetPublicProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-public-guard";

const sessionId = "independent-concurrency-regression";
const admit = () => {
  const result = admitPublicProtocolDesignerRequest({ headers: { "x-forwarded-for": "203.0.113.9" },
    body: { observabilityContext: { sessionId } } });
  if ("code" in result) throw new Error(result.code);
  return result.sessionKey;
};
const request = { method: "POST", body: JSON.stringify({ model: "gpt-5.6-terra", input: "SYNTHETIC",
  instructions: "SYNTHETIC", max_output_tokens: 8000, reasoning: { effort: "medium" }, store: false }) };
const response = () => new Response(JSON.stringify({ id: "synthetic", status: "completed", model: "gpt-5.6-terra",
  usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 } }));
const endpoint = "https://api.openai.com/v1/responses";

describe("public session overlapping requests — independent transport boundary", () => {
  beforeEach(resetPublicProtocolDesignerGuardForTests);
  it("keeps the lock after headers until the response body settles usage", async () => {
    let finish!: () => void;
    const stream = new ReadableStream({ start(controller) { finish = () => {
      controller.enqueue(new TextEncoder().encode(JSON.stringify({ model: "gpt-5.6-terra", status: "completed",
        usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 } })));
      controller.close();
    }; } });
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(stream));
    const guarded = createPublicProtocolDesignerBudgetedFetch(admit(), provider);
    const first = guarded(endpoint, request);
    await Promise.resolve();
    expect(publicProtocolDesignerGuardStateForTests(sessionId)?.providerCallInFlight).toBe(true);
    await expect(guarded(endpoint, request)).rejects.toThrow("PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED");
    finish(); await first;
    expect(publicProtocolDesignerGuardStateForTests(sessionId)?.providerCallInFlight).toBe(false);
    expect(provider).toHaveBeenCalledTimes(1);
  });
  it("settles the same session after a concurrent admission and permits the next call without losing cost", async () => {
    let release!: (value: Response) => void;
    const pending = new Promise<Response>(resolve => { release = resolve; });
    const provider = vi.fn<typeof fetch>().mockReturnValueOnce(pending).mockImplementation(async () => response());
    const first = createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, request);
    expect(publicProtocolDesignerGuardStateForTests(sessionId)?.providerCallInFlight).toBe(true);
    await expect(createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, request))
      .rejects.toThrow("PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED");
    expect(provider).toHaveBeenCalledTimes(1);
    release(response()); await first;
    const settled = publicProtocolDesignerGuardStateForTests(sessionId)!;
    expect(settled.providerCallInFlight).toBe(false);
    expect(settled.committedCostUsd).toBeGreaterThan(0);
    expect(settled.committedCostUsd).toBeLessThan(0.01);
    await createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, request);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(publicProtocolDesignerGuardStateForTests(sessionId)?.committedCostUsd).toBeCloseTo(settled.committedCostUsd * 2);
    expect(publicProtocolDesignerGuardStateForTests(sessionId)?.requestCount).toBe(3);
  });
  it("does not release an uncertain reservation after overlapping admission and a failed transport", async () => {
    let fail!: (reason: Error) => void;
    const pending = new Promise<Response>((_resolve, reject) => { fail = reject; });
    const provider = vi.fn<typeof fetch>().mockReturnValueOnce(pending);
    const first = createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, request);
    const failed = expect(first).rejects.toThrow("synthetic failure");
    await expect(createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, request))
      .rejects.toThrow("PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED");
    fail(new Error("synthetic failure")); await failed;
    expect(publicProtocolDesignerGuardStateForTests(sessionId)).toMatchObject({ providerCallInFlight: false, providerGateClosed: true });
    expect(publicProtocolDesignerGuardStateForTests(sessionId)!.committedCostUsd).toBeGreaterThan(5);
    expect(() => admit()).toThrow("PUBLIC_SESSION_BUDGET_CLOSED");
    expect(provider).toHaveBeenCalledTimes(1);
  });
});
