import { describe, expect, it } from "vitest";
import { PROVIDER_MODEL_DECLARATIONS, providerModelDeclaration, TERRA_REQUESTED_MODEL } from "../provider-model-contract";
import { providerModelPricing } from "../provider-call-observability";
import { mapOpenAIModelForDestination } from "../../../../server/protocol-designer-openai-provider-config";
import { QUALIFIED_CAMPAIGN_MODELS, boundCanaryProviderCall } from "../../../../server/protocol-designer-canary-policy";
import { buildOpenAITerraConversationPayload } from "../../../../api/protocol-designer-openai-extraction-provider";
import { STUDY_PROPOSAL_CAPACITY } from "@/features/scientific-thinking/study-proposal-capacity";

// CURRENT_STRUCTURAL_INVARIANT: configured identities/limits, not live capability.
describe("one declaration per existing provider fact", () => {
  it("preserves transport mappings and requested versus effective identities", () => {
    expect(buildOpenAITerraConversationPayload({ context: "{}", instruction: "LOCAL_SYNTHETIC" }).model).toBe(TERRA_REQUESTED_MODEL);
    expect(mapOpenAIModelForDestination(TERRA_REQUESTED_MODEL, "openai")).toBe("gpt-5.6-terra");
    expect(mapOpenAIModelForDestination(TERRA_REQUESTED_MODEL, "azure")).toBe("gpt-6-sol");
    expect(mapOpenAIModelForDestination("gpt-5.6-luna", "azure")).toBe("gpt-5.6-terra");
    expect(mapOpenAIModelForDestination("unknown", "azure")).toBe("unknown");
    expect(providerModelDeclaration("toString")).toBeNull();
    expect(providerModelDeclaration("gpt-6.1")).toBeNull();
  });
  it("references the existing dated pricing owner and model ceilings without merging admission/qualification", () => {
    expect(QUALIFIED_CAMPAIGN_MODELS).toEqual(Object.keys(PROVIDER_MODEL_DECLARATIONS));
    for (const model of QUALIFIED_CAMPAIGN_MODELS) expect(providerModelPricing(model)).not.toBeNull();
    expect(providerModelDeclaration("gpt-6-sol")!.limits.output).toBeGreaterThanOrEqual(STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens);
    const payload = { ...buildOpenAITerraConversationPayload({ context: "{}", instruction: "LOCAL_SYNTHETIC" }),
      model: "gpt-6-sol", max_output_tokens: STUDY_PROPOSAL_CAPACITY.workingDraftMaxOutputTokens };
    const bound = boundCanaryProviderCall("https://api.openai.com/v1/responses", JSON.stringify(payload), 100);
    expect(bound).toMatchObject({ model: "gpt-6-sol", outputTokenUpperBound: 64000, contextTokenLimit: 1_050_000 });
    expect(boundCanaryProviderCall("https://api.openai.com/v1/responses", JSON.stringify({ ...payload, model: "unknown" }), 100)).toBeNull();
  });
});
