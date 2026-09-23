import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  OPENAI_RESPONSES_ENDPOINT,
  executeOpenAITerraConversation,
} from "../../../../api/protocol-designer-openai-extraction-provider";
import { boundCanaryProviderCall } from "../../../../server/protocol-designer-canary-policy";
import { openAIInputCountRequest } from "../../../../server/protocol-designer-provider-replay";
import {
  azureInputCountQualification,
  mapOpenAIModelForDestination,
  resolveOpenAIProviderRuntimeConfiguration,
} from "../../../../server/protocol-designer-openai-provider-config";

const azureEnvironment = {
  OPENAI_PROVIDER: "azure",
  AZURE_OPENAI_PROJECT_ENDPOINT: "https://noxia-01.services.ai.azure.com/api/projects/noxia-prod",
  AZURE_OPENAI_API_KEY: "azure-secret-for-local-test",
  OPENAI_API_KEY: "openai-count-secret-for-local-test",
};

const response = (model: string) => new Response(JSON.stringify({
  id: "response-local",
  model,
  status: "completed",
  output_text: "Réponse locale.",
  usage: { input_tokens: 12, output_tokens: 4, total_tokens: 16 },
}), { status: 200, headers: { "content-type": "application/json", "x-request-id": "request-local" } });

describe("OpenAI/Azure provider switch", () => {
  it("keeps the existing OpenAI transport byte-compatible by default", async () => {
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      expect(init?.headers).toEqual({
        "content-type": "application/json",
        authorization: "Bearer openai-local-test",
      });
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        model: "gpt-5.6-terra",
        reasoning: { effort: "medium" },
        store: false,
        service_tier: "default",
      });
      return response("gpt-5.6-terra");
    });

    await executeOpenAITerraConversation(
      { instruction: "instruction", context: "contexte" },
      "openai-local-test",
      provider,
    );

    expect(provider).toHaveBeenCalledOnce();
    expect(provider.mock.calls[0]?.[0]).toBe(OPENAI_RESPONSES_ENDPOINT);
    expect(resolveOpenAIProviderRuntimeConfiguration({ OPENAI_API_KEY: "openai-local-test" }))
      .toEqual({ apiKey: "openai-local-test" });
  });

  it("changes only destination, authentication and deployment model for Azure", async () => {
    const configuration = resolveOpenAIProviderRuntimeConfiguration(azureEnvironment);
    const provider = vi.fn<typeof fetch>(async (url, init) => {
      expect(url).toBe("https://noxia-01.services.ai.azure.com/api/projects/noxia-prod/openai/v1/responses");
      expect(init?.headers).toEqual({
        "content-type": "application/json",
        "api-key": "azure-secret-for-local-test",
      });
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({
        model: "gpt-5.6-sol",
        instructions: "instruction",
        input: "contexte",
        reasoning: { effort: "medium" },
        max_output_tokens: 8000,
        store: false,
        service_tier: "default",
      });
      return response("gpt-5.6-sol");
    });

    await executeOpenAITerraConversation(
      { instruction: "instruction", context: "contexte" },
      configuration.apiKey!,
      provider,
      undefined,
      configuration.transport,
    );

    expect(provider).toHaveBeenCalledOnce();
    expect(mapOpenAIModelForDestination("gpt-5.6-luna", "azure")).toBe("gpt-5.6-terra");
    expect(mapOpenAIModelForDestination("gpt-5.6-terra", "azure")).toBe("gpt-5.6-sol");
    expect(mapOpenAIModelForDestination("gpt-5.6-sol", "azure")).toBe("gpt-5.6-sol");
  });

  it("counts the Azure payload through OpenAI for the observed qualified deployment", () => {
    const configuration = resolveOpenAIProviderRuntimeConfiguration(azureEnvironment);
    const endpoint = configuration.transport!.responsesEndpoint;
    const body = JSON.stringify({
      model: "gpt-5.6-sol",
      instructions: "instruction",
      input: "contexte",
      reasoning: { effort: "medium" },
      max_output_tokens: 8000,
      store: false,
      service_tier: "default",
    });

    expect(boundCanaryProviderCall(endpoint, body)).toMatchObject({
      provider: "OPENAI",
      model: "gpt-5.6-sol",
      inputTokenUpperBound: 1_050_000,
      outputTokenUpperBound: 8000,
    });
    expect(boundCanaryProviderCall(endpoint, body)!.upperBoundUsd).toBeGreaterThan(6);
    expect(openAIInputCountRequest({ endpoint, method: "POST", body })).toEqual({
      endpoint: `${OPENAI_RESPONSES_ENDPOINT}/input_tokens`,
      method: "POST",
      body: JSON.stringify({ model: "gpt-5.6-sol", instructions: "instruction", input: "contexte", reasoning: { effort: "medium" } }),
    });
    expect(configuration.countApiKey).toBe("openai-count-secret-for-local-test");
    expect(azureInputCountQualification("gpt-5.6-sol")).toBeTruthy();
    expect(azureInputCountQualification("gpt-5.6-terra")).toBeTruthy();
    expect(azureInputCountQualification("gpt-6-sol")).toBeNull();
  });

  it("requires the independent OpenAI count credential for Azure", () => {
    expect(() => resolveOpenAIProviderRuntimeConfiguration({
      ...azureEnvironment,
      OPENAI_API_KEY: "",
    })).toThrow("AZURE_OPENAI_PRECOUNT_API_KEY_MISSING");
  });

  it("rolls back to OpenAI by configuration only", () => {
    expect(resolveOpenAIProviderRuntimeConfiguration({
      ...azureEnvironment,
      OPENAI_PROVIDER: "openai",
      OPENAI_API_KEY: "openai-restored",
    })).toEqual({ apiKey: "openai-restored" });
  });

  it("keeps both provider secrets in server-only configuration", () => {
    const workspace = readFileSync("src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx", "utf8");
    const client = readFileSync("src/features/protocol-designer/product-bridge-client.ts", "utf8");
    expect(`${workspace}\n${client}`).not.toMatch(/AZURE_OPENAI_API_KEY|OPENAI_API_KEY|VITE_(?:AZURE_)?OPENAI/u);
  });

  it("fails closed on an untrusted Azure project endpoint", () => {
    expect(() => resolveOpenAIProviderRuntimeConfiguration({
      ...azureEnvironment,
      AZURE_OPENAI_PROJECT_ENDPOINT: "https://example.com/api/projects/noxia-prod",
    })).toThrow("AZURE_OPENAI_PROJECT_ENDPOINT_INVALID");
  });
});
