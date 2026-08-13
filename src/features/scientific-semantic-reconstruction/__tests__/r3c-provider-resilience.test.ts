import { describe, expect, it, vi } from "vitest";
import { R3cResilientSemanticProvider, R3C_TRANSIENT_WAIT_MS } from "../manual/r3c-provider-resilience";
import { SemanticProviderError } from "../provider";
import type { ScientificSemanticProvider, SemanticProviderAttempt } from "../types";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const failedAttempt = (attempt: number, status = 503): SemanticProviderAttempt => ({
  attempt,
  requestStarted: `2026-08-12T10:00:0${attempt}.000Z`,
  requestFinished: `2026-08-12T10:00:0${attempt}.100Z`,
  latencyMs: 100,
  outcome: "FAILED",
  category: "SERVER_ERROR",
  httpStatus: status,
  providerStatus: "UNAVAILABLE",
  providerCode: String(status),
  providerError: "Service unavailable",
  retryable: true,
});

const coverage = { explicit: {} as never, relations: {} as never, taxonomy: {} as never, cycle: 1 as const };

describe("SEM-001R3C campaign-only provider resilience", () => {
  it("waits 60 seconds and succeeds without replaying a completed operation", async () => {
    const sleep = vi.fn(async () => undefined);
    const traces: unknown[] = [];
    const delegate: ScientificSemanticProvider = {
      metadata: { provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite", temperature: null },
      reconstruct: vi.fn() as never,
      critique: vi.fn()
        .mockRejectedValueOnce(new SemanticProviderError("SERVER_ERROR", [failedAttempt(1)], {
          httpStatus: 503, providerStatus: "UNAVAILABLE", providerCode: "503", providerError: "Service unavailable", retryable: true, retryAfterMs: null,
        }))
        .mockResolvedValueOnce({ callId: "call-2", critic: {} as never, attempts: [{ ...failedAttempt(2, 200), outcome: "SUCCESS", category: null, providerStatus: null, providerCode: null, providerError: null, retryable: false }] }),
    };
    const provider = new R3cResilientSemanticProvider(delegate, { sleep, onAttempt: (trace) => traces.push(trace) });
    const result = await provider.critique({ ...makeSemanticRequest(), sessionId: "sem-001r3c:SEM-D16" }, comparisonCandidate(), coverage);
    expect(result.callId).toBe("call-2");
    expect(delegate.critique).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(R3C_TRANSIENT_WAIT_MS);
    expect(traces).toHaveLength(2);
  });

  it("stops the operation after five transient failures", async () => {
    const sleep = vi.fn(async () => undefined);
    const delegate: ScientificSemanticProvider = {
      metadata: { provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite", temperature: null },
      reconstruct: vi.fn() as never,
      critique: vi.fn(async () => { throw new SemanticProviderError("SERVER_ERROR", [failedAttempt(1)], {
        httpStatus: 503, providerStatus: "UNAVAILABLE", providerCode: "503", providerError: "Service unavailable", retryable: true, retryAfterMs: null,
      }); }),
    };
    const provider = new R3cResilientSemanticProvider(delegate, { sleep });
    await expect(provider.critique({ ...makeSemanticRequest(), sessionId: "sem-001r3c:SEM-D16" }, comparisonCandidate(), coverage)).rejects.toMatchObject({ category: "SERVER_ERROR" });
    expect(delegate.critique).toHaveBeenCalledTimes(5);
    expect(sleep).toHaveBeenCalledTimes(4);
  });

  it("does not retry deterministic configuration failures", async () => {
    const delegate: ScientificSemanticProvider = {
      metadata: { provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite", temperature: null },
      reconstruct: vi.fn() as never,
      critique: vi.fn(async () => { throw new SemanticProviderError("SCHEMA_REJECTION", [failedAttempt(1, 400)], {
        httpStatus: 400, providerStatus: "INVALID_ARGUMENT", providerCode: "400", providerError: "Schema rejected", retryable: false, retryAfterMs: null,
      }); }),
    };
    const provider = new R3cResilientSemanticProvider(delegate);
    await expect(provider.critique({ ...makeSemanticRequest(), sessionId: "sem-001r3c:SEM-D16" }, comparisonCandidate(), coverage)).rejects.toMatchObject({ category: "SCHEMA_REJECTION" });
    expect(delegate.critique).toHaveBeenCalledTimes(1);
  });

  it("forbids reconstruction in the continuation runner", () => {
    const delegate = { metadata: { provider: "GOOGLE_GEMINI", model: "gemini-3.5-flash-lite", temperature: null } } as ScientificSemanticProvider;
    const provider = new R3cResilientSemanticProvider(delegate);
    expect(() => provider.reconstruct(makeSemanticRequest())).toThrow("SEM001R3C_RECONSTRUCTION_FORBIDDEN");
  });
});
