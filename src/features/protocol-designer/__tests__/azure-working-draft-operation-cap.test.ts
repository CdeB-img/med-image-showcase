import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import {
  executeOpenAILanguageProjection,
  executeOpenAIPersistentDelta,
} from "../../../../api/protocol-designer-openai-extraction-provider";
import { languageProjectionIdentityDigest, type LanguageProjectionRequest } from "../conversation-language-gateway";
import type { ProductBridgeRequest } from "../product-bridge";
import { resolveOpenAIProviderRuntimeConfiguration } from "../../../../server/protocol-designer-openai-provider-config";

const azure = resolveOpenAIProviderRuntimeConfiguration({
  OPENAI_PROVIDER: "azure",
  AZURE_OPENAI_PROJECT_ENDPOINT: "https://noxia-01.services.ai.azure.com/api/projects/noxia-prod",
  AZURE_OPENAI_API_KEY: "local-test-azure-key",
  OPENAI_API_KEY: "local-test-openai-key",
});

const conversationRequest = (workingDraft: boolean): ProductBridgeRequest => ({
  apiVersion: "1.0.0", currentProject: null, evaluatePersistentDelta: false,
  ...(workingDraft ? { prepareWorkingDraft: true } : {}),
  conversation: { conversationId: "local-cap-test", language: "fr", turns: [
    { turnId: "u1", role: "USER", content: "Étude prospective sur une mesure d'imagerie à deux visites." },
    { turnId: "a1", role: "NOXIA", content: "La comparaison des deux visites reste à préciser." },
    { turnId: "u2", role: "USER", content: "Je retiens deux visites ; le délai exact reste ouvert." },
  ] },
});

const languageRequest = (): LanguageProjectionRequest => {
  const sourceText = "Imaging may contribute.";
  return {
    apiVersion: "1.0.0", operation: "LANGUAGE_PROJECTION", projectionKind: "INPUT_TO_FRENCH",
    sourceText, sourceLanguageHint: "en", targetLanguage: "fr", translationContractVersion: "1.4.0",
    projectionIdentityDigest: languageProjectionIdentityDigest({
      projectionKind: "INPUT_TO_FRENCH", sourceText, sourceLanguage: "en", targetLanguage: "fr",
      provider: "OPENAI", model: "gpt-5.6-luna", protectedOpaqueLiterals: [],
    }),
    protectedOpaqueLiterals: [],
  };
};

const capturedRequest = () => {
  const bodies: Array<Record<string, unknown>> = [];
  const signals: Array<AbortSignal | null | undefined> = [];
  const fetchImpl = vi.fn<typeof fetch>(async (_url, init) => {
    bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    signals.push(init?.signal);
    return new Response(JSON.stringify({
      id: "local-cap-response", status: "completed", output_text: "{}",
      usage: { input_tokens: 12, output_tokens: 4, total_tokens: 16 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  });
  return { bodies, signals, fetchImpl };
};

const observedResponseTimeouts = async (run: () => Promise<unknown>) => {
  const timer = vi.spyOn(globalThis, "setTimeout");
  try {
    await run();
    return timer.mock.calls.map(([, delay]) => delay)
      .filter((delay) => delay === 120_000 || delay === 300_000);
  } finally {
    timer.mockRestore();
  }
};

describe.each([
  { provider: "OPENAI", transport: undefined, expectedWorkingDraftCap: 8000, expectedWorkingDraftTimeout: 120_000 },
  { provider: "AZURE", transport: azure.transport, expectedWorkingDraftCap: 16000, expectedWorkingDraftTimeout: 300_000 },
])("$provider operation-scoped output cap and timeout", ({ transport, expectedWorkingDraftCap, expectedWorkingDraftTimeout }) => {
  it("keeps Chat at 8000/120s and scopes the Working Draft cap and timeout", async () => {
    for (const workingDraft of [false, true]) {
      const { bodies, signals, fetchImpl } = capturedRequest();
      const timeouts = await observedResponseTimeouts(() => executeProtocolDesignerBridge({
        body: conversationRequest(workingDraft), apiKey: null, openAiApiKey: "local-test-key",
        openAiTransport: transport, chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl,
      }));
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(signals[0]).toBeInstanceOf(AbortSignal);
      expect(bodies[0]?.max_output_tokens).toBe(workingDraft ? expectedWorkingDraftCap : 8000);
      expect(timeouts).toEqual([workingDraft ? expectedWorkingDraftTimeout : 120_000]);
    }
  });

  it("keeps language projection at 8000/120s", async () => {
    const { bodies, signals, fetchImpl } = capturedRequest();
    const timeouts = await observedResponseTimeouts(() => executeOpenAILanguageProjection(languageRequest(),
      "local-test-key", fetchImpl, undefined, undefined, undefined, transport).catch(() => undefined));
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(bodies[0]?.max_output_tokens).toBe(8000);
    expect(timeouts).toEqual([120_000]);
  });

  it("keeps persistent delta at 8000/120s", async () => {
    const { bodies, signals, fetchImpl } = capturedRequest();
    const timeouts = await observedResponseTimeouts(() => executeOpenAIPersistentDelta({
      ...conversationRequest(false), evaluatePersistentDelta: true,
    }, "local-test-key", fetchImpl, undefined, undefined, transport).catch(() => undefined));
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(bodies[0]?.max_output_tokens).toBe(8000);
    expect(timeouts).toEqual([120_000]);
  });
});
