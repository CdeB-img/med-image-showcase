import { describe, expect, it } from "vitest";
import { buildOpenAIPersistentDeltaPayload, executeOpenAILanguageProjection, executeOpenAIPersistentDelta } from "../../api/protocol-designer-openai-extraction-provider";
import { buildGovernedConversationEnvelope } from "../../src/features/query-navigation/governed-conversation-realization";
import { LANGUAGE_PROJECTION_CONTRACT_VERSION } from "../../src/features/protocol-designer/conversation-language-gateway";
import type { ProductBridgeRequest } from "../../src/features/protocol-designer/product-bridge";
import { T01, T02 } from "../../src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-provider-replay";
import { adversarialDeltaResponse, adversarialExtractionContext, createAdversarialProviderTransport,
  type AdversarialCorpus, type AdversarialTurn, type ProviderCallWitness } from "./provider-transport";

// Existing historical strings only. These are transport unit fixtures, not new campaign language.
const first: AdversarialTurn = { id: "T01", userText: T01,
  semanticDelta: [
    { operation: "ADD", key: "selftest:immediate", type: "INTERVENTION", content: "Mise en place immédiate d'un stent", studyRole: "INTERVENTION_ARM", epistemicState: "KNOWN" },
    { operation: "ADD", key: "selftest:delayed", type: "COMPARATOR", content: "Mise en place différée d'un stent", studyRole: "COMPARATOR_ARM", epistemicState: "KNOWN" },
    { operation: "ADD", key: "selftest:unknown", type: "PROJECT_INFORMATION", content: "La signification de précoce et tardif reste à préciser", epistemicState: "UNKNOWN" },
  ], semanticRelations: [{ key: "selftest:comparison", type: "COMPARES_WITH", sourceKey: "selftest:immediate", targetKey: "selftest:delayed" }] };
const second: AdversarialTurn = { id: "T02", userText: T02, semanticDelta: [], languageInvariantEvidence: {
  NEGATION: [], UNCERTAINTY: ["j'utiliserais peut être % de la masse vg"], CONDITIONALITY: [],
  COMPARISON: ["afin de pouvoir comparer les sujets entre eux."], TEMPORAL_RELATION: [],
} };
const corpus: AdversarialCorpus = { scenarios: [{ id: "TRANSPORT_SELFTEST", turns: [first, second] }] };
const requestFor = (content: string): ProductBridgeRequest => ({ apiVersion: "1.0.0", evaluatePersistentDelta: true,
  currentProject: null, conversation: { conversationId: "selftest:conversation", language: "fr",
    turns: [{ turnId: "selftest:actual-source-turn", role: "USER", content }] } });

describe("adversarial provider transport safety and contract self-test", () => {
  it("preserves paragraphs and blank lines through the actual provider source catalog", () => {
    const textWithParagraphs = `${T01}\n\n${T02}`;
    const context = adversarialExtractionContext(buildOpenAIPersistentDeltaPayload(requestFor(textWithParagraphs)));
    expect(context.sourceText).toBe(textWithParagraphs);
    expect(context.currentProject).toBeNull();
  });
  it("serves extraction, French identity language and governed HOW through the provider transport", async () => {
    const witnesses: ProviderCallWitness[] = [];
    const transport = createAdversarialProviderTransport(witnesses, { corpus });
    transport.setActiveTurn("TRANSPORT_SELFTEST", "T01");
    const extraction = await executeOpenAIPersistentDelta(requestFor(T01), "offline-only", transport);
    expect(extraction.value.structuredArgs).toMatchObject({
      changes: [{ candidateRef: "selftest:immediate" }, { candidateRef: "selftest:delayed" }, { epistemicState: "UNKNOWN" }],
      relations: [{ sourceObjectRef: "selftest:immediate", targetObjectRef: "selftest:delayed", relationType: "COMPARES_WITH" }],
    });
    expect(extraction.value.providerArtifact.sourceProjectId).toBeNull();
    const again = await executeOpenAIPersistentDelta(requestFor(T01), "offline-only", transport);
    expect(again.value.structuredArgs).toEqual(extraction.value.structuredArgs);
    expect(witnesses[0].requestDigest).toBe(witnesses[1].requestDigest);
    expect(witnesses[0].responseBody).toEqual(witnesses[1].responseBody);

    transport.setActiveTurn("TRANSPORT_SELFTEST", "T02");
    const language = await executeOpenAILanguageProjection({ apiVersion: "1.0.0", operation: "LANGUAGE_PROJECTION",
      projectionKind: "INPUT_TO_FRENCH", sourceText: T02, sourceLanguageHint: "UNKNOWN", targetLanguage: "fr",
      translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION, projectionIdentityDigest: "selftest:identity" },
    "offline-only", transport);
    expect(language.value.translatedText).toBe(T02);
    expect(language.value.semanticInvariants.find((item) => item.invariantId === "UNCERTAINTY"))
      .toMatchObject({ sourcePresent: true, preserved: true });

    const envelope = buildGovernedConversationEnvelope({ whatRef: "selftest:what", action: "RESPOND",
      purpose: "Restituer les éléments explicitement fournis.", sourceTurnRef: "selftest:actual-source-turn",
      projectBinding: null, targetRefs: ["selftest:uncertain"],
      authorizedContent: [{ ref: "selftest:uncertain", text: "La mesure reste à discuter.", status: "UNKNOWN" }],
      requiredContentRefs: ["selftest:uncertain"] });
    const how = await transport("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST", body: JSON.stringify({ contents: [{ parts: [{ text: JSON.stringify(envelope) }] }] }),
    });
    const howBody = await how.json();
    expect(JSON.parse(howBody.candidates[0].content.parts[0].text)).toMatchObject({
      claim: { whatRef: envelope.whatRef, adoptionClaimed: false, projectWriteClaimed: false },
    });
    expect(witnesses).toHaveLength(4);
    expect(witnesses.every((item) => item.provenance === "SYNTHETIC_CONTRACT_FIXTURE")).toBe(true);
  });

  it("fails closed for no active turn, unknown endpoint, wrong frozen text and absent replacement target", async () => {
    const witnesses: ProviderCallWitness[] = [];
    const transport = createAdversarialProviderTransport(witnesses, { corpus });
    const input = { method: "POST", body: JSON.stringify(buildOpenAIPersistentDeltaPayload(requestFor(T01))) };
    await expect(transport("https://api.openai.com/v1/responses", input)).rejects.toThrow("ACTIVE_FROZEN_TURN_REQUIRED");
    transport.setActiveTurn("TRANSPORT_SELFTEST", "T01");
    await expect(transport("https://invalid.example.test", input)).rejects.toThrow("UNEXPECTED_PROVIDER_ENDPOINT");
    transport.setActiveTurn("TRANSPORT_SELFTEST", "T02");
    await expect(transport("https://api.openai.com/v1/responses", input)).rejects.toThrow("EXTRACTION_SOURCE_OUTSIDE_ACTIVE_FROZEN_TURN");
    const context = adversarialExtractionContext(buildOpenAIPersistentDeltaPayload(requestFor(T01)));
    expect(() => adversarialDeltaResponse(context, { ...first,
      semanticDelta: [{ ...first.semanticDelta[0], operation: "REPLACE" }], semanticRelations: [] }))
      .toThrow("CURRENT_PROJECT_REQUIRED");
    expect(witnesses).toEqual([]);
  });
});
