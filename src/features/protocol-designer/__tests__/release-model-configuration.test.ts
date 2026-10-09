import { describe, expect, it } from "vitest";
import { resolveOpenAIProviderRuntimeConfiguration } from "../../../../server/protocol-designer-openai-provider-config";

const azure = { OPENAI_PROVIDER: "azure", AZURE_OPENAI_PROJECT_ENDPOINT: "https://synthetic.services.ai.azure.com/api/projects/release-test" };
describe("explicit release model opt-in without weakening the Preview selector", () => {
  it("keeps the default unchanged and is configuration-only, no provider", () => {
    expect(resolveOpenAIProviderRuntimeConfiguration({ ...azure, VERCEL_ENV: "production" }).transport?.terraRequestedModel).toBeUndefined();
  });
  it.each(["production", "preview"])("allows an explicit declared Azure deployment in %s", VERCEL_ENV => {
    expect(resolveOpenAIProviderRuntimeConfiguration({ ...azure, VERCEL_ENV, NOXIA_TERRA_MODEL: "gpt-6.1-sol" }).transport?.terraRequestedModel).toBe("gpt-6.1-sol");
  });
  it("continues to reject the Preview selector in Production", () => {
    expect(() => resolveOpenAIProviderRuntimeConfiguration({ ...azure, VERCEL_ENV: "production", NOXIA_PREVIEW_TERRA_MODEL: "gpt-6.1-sol" })).toThrow("PREVIEW_TERRA_MODEL_CONFIGURATION_INVALID");
  });
  it.each([{ ...azure, NOXIA_TERRA_MODEL: "unknown" }, { OPENAI_PROVIDER: "openai", NOXIA_TERRA_MODEL: "gpt-6.1-sol" },
    { ...azure, VERCEL_ENV: "preview", NOXIA_PREVIEW_TERRA_MODEL: "invalid", NOXIA_TERRA_MODEL: "gpt-6.1-sol" }])("fails closed for unsupported configuration", env => {
    expect(() => resolveOpenAIProviderRuntimeConfiguration(env)).toThrow(/MODEL_CONFIGURATION_INVALID/);
  });
});
