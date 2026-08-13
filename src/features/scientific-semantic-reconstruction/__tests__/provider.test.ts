import { describe, expect, it, vi } from "vitest";
import { GeminiScientificSemanticProvider, SemanticProviderError } from "../provider";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const googleResponse = (status: number, body: unknown, headers?: Record<string, string>) => new Response(
  JSON.stringify(body),
  { status, headers: { "content-type": "application/json", ...headers } },
);

const successfulBody = (value: unknown) => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] }, finishReason: "STOP" }],
});

const providerWith = (fetchImpl: typeof fetch, maxAttempts = 3) => new GeminiScientificSemanticProvider({
  apiKey: "test-key-never-logged",
  model: "gemini-test",
  fetchImpl,
  maxAttempts,
  retryBaseMs: 1,
  sleepImpl: async () => undefined,
});

const captureProviderError = async (operation: Promise<unknown>) => {
  try {
    await operation;
    throw new Error("EXPECTED_PROVIDER_ERROR");
  } catch (caught) {
    expect(caught).toBeInstanceOf(SemanticProviderError);
    return caught as SemanticProviderError;
  }
};

describe("GeminiScientificSemanticProvider failure taxonomy and retries", () => {
  it.each([
    [401, { error: { code: 401, status: "UNAUTHENTICATED", message: "API key invalid" } }, "AUTHENTICATION"],
    [404, { error: { code: 404, status: "NOT_FOUND", message: "Model gemini-test is not found" } }, "INVALID_MODEL"],
    [413, { error: { code: 413, status: "INVALID_ARGUMENT", message: "Prompt too large" } }, "PROMPT_TOO_LARGE"],
    [400, { error: { code: 400, status: "INVALID_ARGUMENT", message: "response schema unsupported" } }, "SCHEMA_REJECTION"],
    [400, { error: { code: 400, status: "INVALID_ARGUMENT", message: "invalid request" } }, "CLIENT_ERROR"],
  ] as const)("classifies deterministic HTTP %s as %s without retry", async (status, body, category) => {
    const fetchImpl = vi.fn(async () => googleResponse(status, body)) as unknown as typeof fetch;
    const caught = await captureProviderError(providerWith(fetchImpl).reconstruct(makeSemanticRequest()));
    expect(caught.category).toBe(category);
    expect(caught.attempts).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("classifies exhausted quota and does not retry", async () => {
    const body = { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Quota exhausted; check billing", details: [{ "@type": "QuotaFailure", quotaValue: "0" }] } };
    const fetchImpl = vi.fn(async () => googleResponse(429, body, { "retry-after": "1" })) as unknown as typeof fetch;
    const caught = await captureProviderError(providerWith(fetchImpl).reconstruct(makeSemanticRequest()));
    expect(caught.category).toBe("QUOTA");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries a transient rate limit and records both attempts", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(googleResponse(429, { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "Too many requests per minute" } }, { "retry-after": "0" }))
      .mockResolvedValueOnce(googleResponse(200, successfulBody(comparisonCandidate()))) as unknown as typeof fetch;
    const result = await providerWith(fetchImpl).reconstruct(makeSemanticRequest());
    expect(result.attempts).toHaveLength(2);
    expect(result.attempts?.map((attempt) => attempt.category)).toEqual(["RATE_LIMIT", null]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("treats a positive free-tier request limit with RetryInfo as transient", async () => {
    const body = { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric generate_content_free_tier_requests, limit: 20. Please retry in 32s.", details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "32s" }] } };
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(googleResponse(429, body))
      .mockResolvedValueOnce(googleResponse(200, successfulBody(comparisonCandidate()))) as unknown as typeof fetch;
    const delays: number[] = [];
    const provider = new GeminiScientificSemanticProvider({ apiKey: "test-key", model: "gemini-test", fetchImpl, maxAttempts: 2, sleepImpl: async (delay) => { delays.push(delay); } });
    const result = await provider.reconstruct(makeSemanticRequest());
    expect(result.attempts?.[0]).toMatchObject({ category: "RATE_LIMIT", retryable: true });
    expect(delays).toEqual([30_000]);
  });

  it("retries bounded server errors and returns the final classified error", async () => {
    const fetchImpl = vi.fn(async () => googleResponse(503, { error: { code: 503, status: "UNAVAILABLE", message: "Service unavailable" } })) as unknown as typeof fetch;
    const caught = await captureProviderError(providerWith(fetchImpl, 2).reconstruct(makeSemanticRequest()));
    expect(caught.category).toBe("SERVER_ERROR");
    expect(caught.attempts).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("classifies network failures and retries within the bound", async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError("network details must not leak"); }) as unknown as typeof fetch;
    const caught = await captureProviderError(providerWith(fetchImpl, 2).reconstruct(makeSemanticRequest()));
    expect(caught.category).toBe("NETWORK");
    expect(caught.attempts).toHaveLength(2);
    expect(caught.details?.providerError).toBe("Provider network request failed.");
  });

  it("does not retry safety refusals or malformed JSON", async () => {
    const safetyFetch = vi.fn(async () => googleResponse(200, { promptFeedback: { blockReason: "SAFETY" } })) as unknown as typeof fetch;
    const safety = await captureProviderError(providerWith(safetyFetch).reconstruct(makeSemanticRequest()));
    expect(safety.category).toBe("SAFETY_REFUSAL");
    expect(safetyFetch).toHaveBeenCalledTimes(1);

    const malformedFetch = vi.fn(async () => googleResponse(200, { candidates: [{ content: { parts: [{ text: "not-json" }] } }] })) as unknown as typeof fetch;
    const malformed = await captureProviderError(providerWith(malformedFetch).reconstruct(makeSemanticRequest()));
    expect(malformed.category).toBe("INVALID_STRUCTURED_OUTPUT");
    expect(malformedFetch).toHaveBeenCalledTimes(1);
  });

  it("marks schema-invalid structured output as a failed attempt", async () => {
    const fetchImpl = vi.fn(async () => googleResponse(200, successfulBody({ candidateId: "incomplete" }))) as unknown as typeof fetch;
    const caught = await captureProviderError(providerWith(fetchImpl).reconstruct(makeSemanticRequest()));
    expect(caught.category).toBe("INVALID_STRUCTURED_OUTPUT");
    expect(caught.attempts).toHaveLength(2);
    expect(caught.attempts.at(-1)).toMatchObject({ outcome: "FAILED", category: "INVALID_STRUCTURED_OUTPUT", retryable: false });
    expect(caught.diagnostic?.rawProviderOutput).toContain("incomplete");
    expect(caught.diagnostic?.validationIssues.some((issue) => issue.path === "language")).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("performs one bounded correction when a reconstruction violates the local structured contract", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(googleResponse(200, successfulBody({ candidateId: "incomplete" })))
      .mockResolvedValueOnce(googleResponse(200, successfulBody(comparisonCandidate()))) as unknown as typeof fetch;
    const result = await providerWith(fetchImpl).reconstruct(makeSemanticRequest());
    expect(result.candidate.candidateId).toBe(comparisonCandidate().candidateId);
    expect(result.attempts).toHaveLength(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("omits deprecated sampling parameters when temperature is not applicable", async () => {
    const fetchImpl = vi.fn(async () => googleResponse(200, successfulBody(comparisonCandidate()))) as unknown as typeof fetch;
    const provider = providerWith(fetchImpl);
    await provider.reconstruct(makeSemanticRequest());
    const init = vi.mocked(fetchImpl).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { generationConfig: Record<string, unknown> };
    expect(provider.metadata.temperature).toBeNull();
    expect(body.generationConfig).not.toHaveProperty("temperature");
    expect(body.generationConfig).not.toHaveProperty("topP");
    expect(body.generationConfig).not.toHaveProperty("topK");
  });

  it("applies the request-start limiter to every retry attempt", async () => {
    const beforeAttempt = vi.fn(async () => undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(googleResponse(503, { error: { code: 503, status: "UNAVAILABLE", message: "Service unavailable" } }))
      .mockResolvedValueOnce(googleResponse(200, successfulBody(comparisonCandidate()))) as unknown as typeof fetch;
    const provider = new GeminiScientificSemanticProvider({ apiKey: "test-key", model: "gemini-test", fetchImpl, maxAttempts: 2, beforeAttempt, retryBaseMs: 1, retryJitterRatio: 0, sleepImpl: async () => undefined });
    await provider.reconstruct(makeSemanticRequest());
    expect(beforeAttempt).toHaveBeenCalledTimes(2);
  });
});
