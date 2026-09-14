import { afterEach, describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import handleScientificIntake from "../../../../api/scientific-intake";
import { handleScientificInterpretation } from "../../../../api/scientific-interpretation";
import handleScientificSemanticAlias from "../../../../api/scientific-semantic";
import { executeNaturalConversation } from "../../../../api/protocol-designer-bridge-provider";
import { executeOpenAIPersistentDelta } from "../../../../api/protocol-designer-openai-extraction-provider";
import {
  languageProjectionIdentityDigest,
  type LanguageProjectionRequest,
} from "../conversation-language-gateway";
import { requestConversationLanguageProjection, requestProtocolDesignerBridge } from "../product-bridge-client";
import {
  emptyProviderTokenUsage,
  materializeProviderCallRecord,
  providerCallRequestObservability,
  providerCallWaterfall,
  providerSessionCostSummary,
  type ProviderCallRecord,
  type ProviderObservedRequestInit,
} from "../provider-call-observability";
import { PROTOCOL_DESIGNER_PUBLIC_RUNTIME_POLICY } from "../public-runtime-access";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const captureResponse = () => {
  const result: { status: number; body: unknown } = { status: 0, body: null };
  const response: ApiResponse = {
    status(value) { result.status = value; return this; },
    setHeader() {},
    json(value) { result.body = value; },
  };
  return { result, response };
};

const observationContext = {
  sessionId: "session:cost-regression",
  conversationId: "conversation:cost-regression",
  turnId: "turn:cost-regression",
  clientRequestId: "request:cost-regression",
  testSessionId: "cost-regression",
};

const providerRecord = (priced: boolean) => materializeProviderCallRecord({
  provider: "OPENAI",
  modelRequested: "gpt-5.6-luna",
  modelReturned: "gpt-5.6-luna",
  instrumentation: {
    context: observationContext,
    purpose: "LANGUAGE_PROJECTION",
    reasoningEffort: "low",
    retryIndex: 0,
    retryReason: null,
    onRecord() {},
  },
  usage: priced ? {
    inputTokens: 1_000, cachedInputTokens: 0, cacheWriteTokens: 0,
    outputTokens: 100, reasoningTokens: 0, totalTokens: 1_100,
  } : emptyProviderTokenUsage(),
  latencyMs: 10,
  status: priced ? "SUCCEEDED" : "FAILED",
  failureReason: priced ? null : "NETWORK_FAILURE",
  providerRequestId: "request:provider",
  providerResponseId: "response:provider",
  startedAt: "2026-09-14T12:00:00.000Z",
  completedAt: "2026-09-14T12:00:00.010Z",
});

const languageRequest = (): LanguageProjectionRequest => {
  const sourceText = "Study SITEALPHA is pending.";
  const protectedOpaqueLiterals = [{ literal: "SITEALPHA", kind: "EXPLICIT_CONTEXT" as const, source: "EXPLICIT_CONTEXT" as const }];
  return {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projectionKind: "INPUT_TO_FRENCH",
    sourceText,
    sourceLanguageHint: "en",
    targetLanguage: "fr",
    translationContractVersion: "1.4.0",
    projectionIdentityDigest: languageProjectionIdentityDigest({
      projectionKind: "INPUT_TO_FRENCH", sourceText, sourceLanguage: "en", targetLanguage: "fr",
      provider: "OPENAI", model: "gpt-5.6-luna", protectedOpaqueLiterals,
    }),
    protectedOpaqueLiterals,
    observabilityContext: observationContext,
  };
};

describe("public Protocol Designer provider shutdown across exposed API routes", () => {
  it.each([
    ["bridge", handleProtocolDesignerBridge],
    ["intake", handleScientificIntake],
    ["interpretation", handleScientificInterpretation],
  ] as const)("blocks %s before credentials or network", async (_name, handler) => {
    const network = vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); });
    vi.stubGlobal("fetch", network);
    const environment = {
      NODE_ENV: "production",
      get GEMINI_API_KEY(): string { throw new Error("CREDENTIAL_READ_FORBIDDEN"); },
      get OPENAI_API_KEY(): string { throw new Error("CREDENTIAL_READ_FORBIDDEN"); },
    };
    const { result, response } = captureResponse();
    await handler({ method: "POST", headers: { "content-type": "application/json" }, body: {} }, response, environment);
    expect(result).toMatchObject({ status: 503, body: {
      error: { code: PROTOCOL_DESIGNER_PUBLIC_RUNTIME_POLICY },
      observability: { providerCalls: [], requestEstimatedCostUsd: 0, requestCostIncomplete: false },
    } });
    expect(network).not.toHaveBeenCalled();
  });

  it("also blocks the deprecated scientific-semantic alias", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const network = vi.fn(() => { throw new Error("NETWORK_FORBIDDEN"); });
    vi.stubGlobal("fetch", network);
    const { result, response } = captureResponse();
    await handleScientificSemanticAlias({ method: "POST", headers: { "content-type": "application/json" }, body: {
      messages: [{ role: "USER", content: "Je souhaite construire une étude." }],
    } }, response);
    expect(result).toMatchObject({ status: 503, body: { error: { code: PROTOCOL_DESIGNER_PUBLIC_RUNTIME_POLICY } } });
    expect(network).not.toHaveBeenCalled();
  });
});

describe("cost observations survive failed paid operations", () => {
  it("retains usage when a successful provider output is rejected by the language contract", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "resp:contract-rejected", model: "gpt-5.6-luna", status: "completed",
      usage: { input_tokens: 1_000, output_tokens: 100, total_tokens: 1_100 },
      output_text: JSON.stringify({
        detectedLanguage: "en", supportStatus: "SUPPORTED", qualificationStatus: "QUALIFIED",
        translatedText: "L’étude SITEBETA est en attente.", translatedTextLanguage: "fr", ambiguityPreserved: true,
        semanticInvariants: ["NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"].map((invariantId) => ({
          invariantId, attestationStatus: "ATTESTED", sourcePresent: false, preserved: false,
          sourceEvidence: [], targetEvidence: [],
        })),
        limitations: [],
      }),
    }), { status: 200, headers: { "x-request-id": "req:contract-rejected" } }));
    const result = await executeProtocolDesignerBridge({
      body: languageRequest(), apiKey: null, openAiApiKey: "mock-only", fetchImpl,
    });
    expect(result).toMatchObject({ status: 422, body: {
      error: { code: "LANGUAGE_PROJECTION_CONTRACT_FAILED:LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS" },
      observability: { requestEstimatedCostUsd: 0.00032, requestCostIncomplete: false, unpricedCallCount: 0,
        providerCalls: [{ context: observationContext, providerResponseId: "resp:contract-rejected",
          usage: { inputTokens: 1_000, outputTokens: 100 }, estimatedCostUsd: 0.00032 }] },
    } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each(["BRIDGE", "LANGUAGE"] as const)("preserves %s HTTP failure observations in the client error", async (kind) => {
    const observability = providerCallRequestObservability([providerRecord(true)]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      apiVersion: "1.0.0", error: { code: "TEST_FAILURE", message: "Mock rejection" }, observability,
    }), { status: 503 })));
    const call = kind === "LANGUAGE"
      ? requestConversationLanguageProjection(languageRequest())
      : requestProtocolDesignerBridge({
        conversation: { conversationId: "conversation:test", language: "fr", turns: [{ role: "USER", turnId: "turn:test", content: "Question scientifique." }] },
        currentProject: null, evaluatePersistentDelta: false,
      });
    await expect(call).rejects.toMatchObject({ code: "TEST_FAILURE", observability });
  });

  it("preserves a known subtotal and explicitly marks unknown-priced attempts", () => {
    const records = [providerRecord(true), providerRecord(false)];
    expect(providerSessionCostSummary(records)).toEqual({ estimatedCostUsd: 0.00032, costIncomplete: true, unpricedCallCount: 1 });
    expect(providerCallRequestObservability(records)).toMatchObject({ requestEstimatedCostUsd: 0.00032, requestCostIncomplete: true, unpricedCallCount: 1 });
    expect(providerCallWaterfall(records).at(-1)).toMatchObject({ cumulativeCostUsd: 0.00032, cumulativeCostIncomplete: true, cumulativeUnpricedCallCount: 1 });
    expect(providerSessionCostSummary([providerRecord(false)])).toEqual({ estimatedCostUsd: 0, costIncomplete: true, unpricedCallCount: 1 });
    expect(providerSessionCostSummary([])).toEqual({ estimatedCostUsd: 0, costIncomplete: false, unpricedCallCount: 0 });
  });

  it.each(["OPENAI", "GOOGLE_GEMINI"] as const)("records %s body-read failures after successful response headers", async (provider) => {
    const records: ProviderCallRecord[] = [];
    const response = new Response("partial body", { status: 200, headers: { "x-request-id": "req:body-read-failed" } });
    vi.spyOn(response, "text").mockRejectedValue(new Error("body transport interrupted"));
    const fetchImpl = vi.fn<typeof fetch>(async () => response);
    const request = {
      apiVersion: "1.0.0" as const,
      conversation: { conversationId: "conversation:body-read", language: "fr" as const,
        turns: [{ role: "USER" as const, turnId: "turn:body-read", content: "Je souhaite construire une étude." }] },
      currentProject: null, evaluatePersistentDelta: false,
    };
    const instrumentation = {
      context: observationContext, purpose: provider === "OPENAI" ? "PERSISTENT_DELTA" as const : "CONVERSATION_REALIZATION" as const,
      reasoningEffort: null, retryIndex: 0, retryReason: null,
      onRecord: (record: ProviderCallRecord) => records.push(record),
    };
    const call = provider === "OPENAI"
      ? executeOpenAIPersistentDelta(request, "mock-only", fetchImpl, "gpt-5.6-terra", instrumentation)
      : executeNaturalConversation(request, "mock-only", fetchImpl, "gemini-3.5-flash-lite", instrumentation);
    await expect(call).rejects.toMatchObject({
      provider, httpStatus: 200, providerStatus: "RESPONSE_BODY_READ_FAILURE", requestId: "req:body-read-failed",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const requestInit = fetchImpl.mock.calls[0]![1] as ProviderObservedRequestInit;
    expect(requestInit.noxiaProviderObservation).toEqual({
      context: observationContext, purpose: instrumentation.purpose, reasoningEffort: null, retryIndex: 0, retryReason: null,
    });
    expect(requestInit.noxiaProviderObservation).not.toHaveProperty("onRecord");
    expect(String(requestInit.body)).not.toContain("noxiaProviderObservation");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      provider, status: "FAILED", failureReason: "RESPONSE_BODY_READ_FAILURE",
      providerRequestId: "req:body-read-failed", retryIndex: 0,
      usage: { inputTokens: null, outputTokens: null }, estimatedCostUsd: null,
    });
    expect(providerSessionCostSummary(records).costIncomplete).toBe(true);
  });
});
