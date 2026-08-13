import { describe, expect, it, vi } from "vitest";
import type { SemanticAtomicCompositionProvider } from "../atomic-composition";
import { R3dResilientAtomicCompositionProvider, R3D_TRANSIENT_WAIT_MS } from "../manual/r3d-provider-resilience";
import { SemanticProviderError } from "../provider";
import type { SemanticProviderAttempt } from "../types";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const failedAttempt = (status = 503): SemanticProviderAttempt => ({
  attempt: 1, requestStarted: "2026-08-12T10:00:00.000Z", requestFinished: "2026-08-12T10:00:00.100Z", latencyMs: 100,
  outcome: "FAILED", category: status === 400 ? "SCHEMA_REJECTION" : "SERVER_ERROR", httpStatus: status,
  providerStatus: status === 400 ? "INVALID_ARGUMENT" : "UNAVAILABLE", providerCode: String(status), providerError: "Provider failure", retryable: status !== 400,
});

const failure = (category: "SERVER_ERROR" | "SCHEMA_REJECTION", status: number) => new SemanticProviderError(category, [failedAttempt(status)], {
  httpStatus: status, providerStatus: status === 400 ? "INVALID_ARGUMENT" : "UNAVAILABLE", providerCode: String(status), providerError: "Provider failure", retryable: status !== 400, retryAfterMs: null,
});

describe("SEM-001R3D atomicity/composition provider resilience", () => {
  it("retries one transient operation after the mandatory wait", async () => {
    const sleep = vi.fn(async () => undefined);
    const delegate: SemanticAtomicCompositionProvider = {
      metadata: { provider: "TEST", model: "generic", temperature: null },
      auditAtomicComposition: vi.fn().mockRejectedValueOnce(failure("SERVER_ERROR", 503)).mockResolvedValueOnce({ callId: "success", audit: {} as never, attempts: [] }),
    };
    const provider = new R3dResilientAtomicCompositionProvider(delegate, { sleep });
    await expect(provider.auditAtomicComposition(makeSemanticRequest(), comparisonCandidate(), 1)).resolves.toMatchObject({ callId: "success" });
    expect(delegate.auditAtomicComposition).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(R3D_TRANSIENT_WAIT_MS);
  });

  it("closes one operation after five consecutive transient failures", async () => {
    const sleep = vi.fn(async () => undefined);
    const delegate: SemanticAtomicCompositionProvider = { metadata: { provider: "TEST", model: "generic", temperature: null }, auditAtomicComposition: vi.fn(async () => { throw failure("SERVER_ERROR", 503); }) };
    const provider = new R3dResilientAtomicCompositionProvider(delegate, { sleep });
    await expect(provider.auditAtomicComposition(makeSemanticRequest(), comparisonCandidate(), 1)).rejects.toMatchObject({ category: "SERVER_ERROR" });
    expect(delegate.auditAtomicComposition).toHaveBeenCalledTimes(5);
    expect(sleep).toHaveBeenCalledTimes(4);
  });

  it("does not retry a deterministic provider-schema rejection", async () => {
    const delegate: SemanticAtomicCompositionProvider = { metadata: { provider: "TEST", model: "generic", temperature: null }, auditAtomicComposition: vi.fn(async () => { throw failure("SCHEMA_REJECTION", 400); }) };
    const provider = new R3dResilientAtomicCompositionProvider(delegate);
    await expect(provider.auditAtomicComposition(makeSemanticRequest(), comparisonCandidate(), 1)).rejects.toMatchObject({ category: "SCHEMA_REJECTION" });
    expect(delegate.auditAtomicComposition).toHaveBeenCalledTimes(1);
  });
});
