import { describe, expect, it, vi } from "vitest";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import { executeNaturalConversation } from "../../../../api/protocol-designer-bridge-provider";
import { executeOpenAIPersistentDelta } from "../../../../api/protocol-designer-openai-extraction-provider";
import type { ProductBridgeRequest } from "../product-bridge";
import {
  advanceProviderSessionCostUsd,
  estimateProviderCallCostUsd,
  providerCallWaterfall,
  providerSessionCostUsd,
  type ProviderCallObservationContext,
  type ProviderCallRecord,
} from "../provider-call-observability";
import {
  protocolDesignerProviderCallsAllowed,
  protocolDesignerPublicUiEnabled,
  protocolDesignerStandardConversationCallsAllowed,
} from "../public-runtime-access";

const context: ProviderCallObservationContext = {
  sessionId: "session:test",
  conversationId: "conversation:test",
  turnId: "turn:user:1",
  clientRequestId: "request:test:1",
  testSessionId: "long-horizon:test",
};

const bridgeRequest: ProductBridgeRequest = {
  apiVersion: "1.0.0",
  conversation: {
    conversationId: context.conversationId!,
    language: "fr",
    turns: [{ turnId: context.turnId!, role: "USER", content: "Je souhaite construire une étude." }],
  },
  currentProject: null,
  evaluatePersistentDelta: false,
  observabilityContext: context,
};

const emptyRecordForTest: ProviderCallRecord = {
  contract: "PROTOCOL_DESIGNER_PROVIDER_CALL_OBSERVABILITY",
  contractVersion: "1.0.0",
  callId: "provider-call:test",
  provider: "OPENAI",
  modelRequested: "gpt-5.6-terra",
  modelReturned: "gpt-5.6-terra",
  modelVersion: "gpt-5.6-terra",
  purpose: "PERSISTENT_DELTA",
  reasoningEffort: null,
  context,
  usage: {
    inputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
  },
  latencyMs: 0,
  retryIndex: 0,
  retryReason: null,
  status: "SUCCEEDED",
  failureReason: null,
  providerRequestId: null,
  providerResponseId: null,
  estimatedCostUsd: 0,
  pricingSnapshotDate: "2026-09-14",
  startedAt: "2026-09-14T00:00:00.000Z",
  completedAt: "2026-09-14T00:00:00.000Z",
};

describe("V1 long-horizon provider observability", () => {
  it("records one Gemini attempt with correlation, usage, latency and reproducible cost", async () => {
    const records: ProviderCallRecord[] = [];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      responseId: "gemini-response-1",
      modelVersion: "gemini-3.5-flash-lite-20260914",
      candidates: [{ content: { parts: [{ text: "Réponse naturelle." }] } }],
      usageMetadata: { promptTokenCount: 1_000, cachedContentTokenCount: 600, candidatesTokenCount: 200, totalTokenCount: 1_200 },
    }), { status: 200 }));

    await executeNaturalConversation(
      bridgeRequest,
      "test-key",
      fetchImpl as typeof fetch,
      "gemini-3.5-flash-lite",
      {
        context,
        purpose: "CONVERSATION_REALIZATION",
        reasoningEffort: null,
        retryIndex: 0,
        retryReason: null,
        onRecord: (record) => records.push(record),
      },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      provider: "GOOGLE_GEMINI",
      modelRequested: "gemini-3.5-flash-lite",
      modelReturned: "gemini-3.5-flash-lite-20260914",
      modelVersion: "gemini-3.5-flash-lite-20260914",
      purpose: "CONVERSATION_REALIZATION",
      context,
      retryIndex: 0,
      retryReason: null,
      status: "SUCCEEDED",
      providerResponseId: "gemini-response-1",
      usage: { inputTokens: 1_000, cachedInputTokens: 600, outputTokens: 200, totalTokens: 1_200 },
    });
    expect(records[0]!.estimatedCostUsd).toBe(0.000638);
  });

  it("records an OpenAI Terra extraction at the actual adapter boundary", async () => {
    const records: ProviderCallRecord[] = [];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "resp-terra-1",
      model: "gpt-5.6-terra",
      status: "completed",
      output_text: JSON.stringify({ changes: [], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }),
      usage: {
        input_tokens: 10_000,
        input_tokens_details: { cached_tokens: 8_000, cache_write_tokens: 1_000 },
        output_tokens: 500,
        output_tokens_details: { reasoning_tokens: 100 },
        total_tokens: 10_500,
      },
    }), { status: 200, headers: { "x-request-id": "req-terra-1" } }));

    await executeOpenAIPersistentDelta(
      bridgeRequest,
      "test-key",
      fetchImpl as typeof fetch,
      "gpt-5.6-terra",
      {
        context,
        purpose: "PERSISTENT_DELTA",
        reasoningEffort: null,
        retryIndex: 1,
        retryReason: "RECOVERABLE_PROVIDER_OUTPUT_VALIDATION_FAILURE",
        onRecord: (record) => records.push(record),
      },
    );

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      provider: "OPENAI",
      modelRequested: "gpt-5.6-terra",
      modelReturned: "gpt-5.6-terra",
      providerRequestId: "req-terra-1",
      providerResponseId: "resp-terra-1",
      retryIndex: 1,
      retryReason: "RECOVERABLE_PROVIDER_OUTPUT_VALIDATION_FAILURE",
      usage: {
        inputTokens: 10_000,
        cachedInputTokens: 8_000,
        cacheWriteTokens: 1_000,
        outputTokens: 500,
        reasoningTokens: 100,
      },
    });
    expect(records[0]!.estimatedCostUsd).toBe(0.0121);
    expect(providerSessionCostUsd(records)).toBe(0.0121);
    expect(providerCallWaterfall(records)[0]!.cumulativeCostUsd).toBe(0.0121);
  });

  it("does not invent a cost for an unknown model or incomplete usage", () => {
    expect(estimateProviderCallCostUsd("unknown", {
      inputTokens: 1,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 1,
      reasoningTokens: 0,
      totalTokens: 2,
    })).toBeNull();
  });

  it("keeps the cumulative session cost monotonic after the UI trace window is truncated", () => {
    const completed = {
      ...emptyRecordForTest,
      estimatedCostUsd: 0.01,
    } satisfies ProviderCallRecord;
    expect(advanceProviderSessionCostUsd(0.2, [completed, completed])).toBe(0.22);
  });
});

describe("public Protocol Designer runtime boundaries", () => {
  it("keeps legacy provider surfaces closed while the Standard bridge is enabled", () => {
    expect(protocolDesignerPublicUiEnabled(true)).toBe(true);
    expect(protocolDesignerPublicUiEnabled(false)).toBe(true);
    expect(protocolDesignerProviderCallsAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(protocolDesignerProviderCallsAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(protocolDesignerProviderCallsAllowed({ VERCEL_ENV: "production" })).toBe(false);
    expect(protocolDesignerStandardConversationCallsAllowed({ VERCEL_ENV: "production" })).toBe(true);
  });

  it("admits the production Standard bridge through its server-side provider", async () => {
    let statusCode = 0;
    let body: unknown = null;
    const response: ApiResponse = {
      status(code) { statusCode = code; return this; },
      setHeader() {},
      json(value) { body = value; },
    };

    const provider = vi.fn(async () => new Response(JSON.stringify({
      responseId: "gemini-public-standard",
      modelVersion: "gemini-3.5-flash-lite",
      candidates: [{ content: { parts: [{ text: "Réponse Standard réelle." }] } }],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, totalTokenCount: 120 },
    }), { status: 200 }));
    await handleProtocolDesignerBridge({
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.12" },
      body: bridgeRequest,
    }, response, { NODE_ENV: "production", GEMINI_API_KEY: "server-only", GEMINI_MODEL: "gemini-3.5-flash-lite" }, { fetchImpl: provider });

    expect(statusCode).toBe(200);
    expect(body).toMatchObject({
      observability: { calls: 1, projectWrites: 0, providerCalls: [{ provider: "GOOGLE_GEMINI" }] },
    });
    expect((body as { assistantReply: string }).assistantReply).not.toBe("Conversation momentanément indisponible.");
    expect(provider).toHaveBeenCalledTimes(1);
  });
});
