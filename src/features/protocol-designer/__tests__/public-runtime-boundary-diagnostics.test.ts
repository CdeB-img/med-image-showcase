import { beforeEach, describe, expect, it, vi } from "vitest";
import { admitPublicProtocolDesignerRequest, createPublicProtocolDesignerBudgetedFetch,
  publicProtocolDesignerGuardStateForTests, resetPublicProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-public-guard";
import { boundCanaryProviderCall } from "../../../../server/protocol-designer-canary-policy";
import { openAIInputCountRequest } from "../../../../server/protocol-designer-provider-replay";

const sessionId = "synthetic-boundary-diagnostic";
const admissionInput = (index = 0) => ({ headers: { "x-forwarded-for": "203.0.113.29" },
  body: { observabilityContext: { sessionId, clientRequestId: "same-logical-operation" } }, now: Date.now() + index * 61_000 });
const admit = () => {
  const result = admitPublicProtocolDesignerRequest(admissionInput());
  if (!result.admitted) throw new Error("ADMISSION_FAILED");
  return result.sessionKey;
};
const endpoint = "https://api.openai.com/v1/responses";
const body = JSON.stringify({ model: "gpt-5.6-terra", instructions: "SYNTHETIC", input: "SYNTHETIC",
  reasoning: { effort: "medium" }, max_output_tokens: 8000, store: false, service_tier: "default" });
const nativeResponse = () => new Response(JSON.stringify({ model: "gpt-5.6-terra", status: "completed",
  usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 } }));

// Legacy process-local guard characterization only. The public bridge no longer
// selects this adapter when the durable store is absent. No live fetch.
describe("legacy process-local guard — isolated compatibility characterization", () => {
  beforeEach(resetPublicProtocolDesignerGuardForTests);
  it("counts an admitted bridge request even when reservation prevents dispatch", async () => {
    const provider = vi.fn<typeof fetch>();
    await expect(createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, {
      method: "POST", body: JSON.stringify({ model: "UNQUALIFIED" }),
    })).rejects.toThrow("PUBLIC_PROVIDER_DENIED_UNKNOWN_UPPER_BOUND");
    expect(provider).not.toHaveBeenCalled();
    expect(publicProtocolDesignerGuardStateForTests(sessionId)).toMatchObject({ requestCount: 1,
      committedCostUsd: 0, measuredCostUsd: 0, providerGateClosed: true });
  });
  it("retains an uncertain reservation after a dispatched transport failure", async () => {
    const provider = vi.fn<typeof fetch>().mockRejectedValue(new Error("SYNTHETIC_DISPATCH_FAILURE"));
    await expect(createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, { method: "POST", body }))
      .rejects.toThrow("SYNTHETIC_DISPATCH_FAILURE");
    expect(provider).toHaveBeenCalledTimes(1);
    expect(publicProtocolDesignerGuardStateForTests(sessionId)).toMatchObject({ requestCount: 1, measuredCostUsd: 0,
      providerGateClosed: true, providerCallInFlight: false });
    expect(publicProtocolDesignerGuardStateForTests(sessionId)!.committedCostUsd).toBeGreaterThan(5);
  });
  it("demonstrates that repeating a completed operation is not deduplicated", async () => {
    const provider = vi.fn<typeof fetch>().mockImplementation(async () => nativeResponse());
    for (let index = 0; index < 2; index++) await createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, { method: "POST", body });
    expect(provider).toHaveBeenCalledTimes(2);
    expect(publicProtocolDesignerGuardStateForTests(sessionId)!.requestCount).toBe(2);
  });
  it("demonstrates that an independently loaded worker cannot see another worker's envelope", async () => {
    const provider = vi.fn<typeof fetch>().mockImplementation(async () => nativeResponse());
    await createPublicProtocolDesignerBudgetedFetch(admit(), provider)(endpoint, { method: "POST", body });
    expect(publicProtocolDesignerGuardStateForTests(sessionId)!.measuredCostUsd).toBeGreaterThan(0);
    vi.resetModules();
    const other = await import("../../../../server/protocol-designer-public-guard");
    expect(other.publicProtocolDesignerGuardStateForTests(sessionId)).toBeNull();
    expect(other.admitPublicProtocolDesignerRequest(admissionInput()).admitted).toBe(true);
    expect(other.publicProtocolDesignerGuardStateForTests(sessionId)).toMatchObject({ requestCount: 1, measuredCostUsd: 0, committedCostUsd: 0 });
  });
  it("demonstrates that two workers both accept what each regards as the last admission", async () => {
    vi.resetModules(); const first = await import("../../../../server/protocol-designer-public-guard");
    vi.resetModules(); const second = await import("../../../../server/protocol-designer-public-guard");
    for (let index = 0; index < 7; index++) {
      expect(first.admitPublicProtocolDesignerRequest(admissionInput(index)).admitted).toBe(true);
      expect(second.admitPublicProtocolDesignerRequest(admissionInput(index)).admitted).toBe(true);
    }
    const results = await Promise.all([
      Promise.resolve().then(() => first.admitPublicProtocolDesignerRequest(admissionInput(7))),
      Promise.resolve().then(() => second.admitPublicProtocolDesignerRequest(admissionInput(7))),
    ]);
    expect(results.filter(result => result.admitted)).toHaveLength(2);
  });
  it("reuses exact-count payload preparation and preserves the qualified financial limits", () => {
    const counted = openAIInputCountRequest({ endpoint, method: "POST", body });
    expect(counted.endpoint).toBe("https://api.openai.com/v1/responses/input_tokens");
    const payload = JSON.parse(counted.body);
    expect(payload.input).toBe("SYNTHETIC"); expect(payload.max_output_tokens).toBeUndefined();
    const uncountedBound = boundCanaryProviderCall(endpoint, body)!;
    const countedBound = boundCanaryProviderCall(endpoint, body, 14671)!;
    expect(countedBound.inputTokenUpperBound).toBe(14671);
    expect(countedBound.upperBoundUsd).toBeLessThan(uncountedBound.upperBoundUsd);
    // Prepared count proof is usable by the existing canary journal; it is not
    // silently wired into the public process-local guard by this test.
  });
});
