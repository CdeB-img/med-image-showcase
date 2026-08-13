import { describe, expect, it } from "vitest";
import { buildImagingDesignInput } from "@/features/imaging-study-designer";
import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { buildResearchProjectConstructionInput } from "@/features/research-project-construction";
import { buildScientificThinkingInput, createScientificThinkingSession } from "@/features/scientific-thinking";
import { acceptSemanticModel, canonicalizeSemanticReconstruction } from "../canonical";
import { semanticModelToScientificSessionContext, semanticModelToValidatedIntent } from "../adapters";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const acceptedFixture = () => {
  const candidate = comparisonCandidate();
  candidate.routeProposal = { route: "DESIGN_STUDY", confidence: .95, reason: "construction", expectedCapabilities: ["SCIENTIFIC_THINKING", "IMAGING", "PROJECT"] };
  const model = acceptSemanticModel(canonicalizeSemanticReconstruction({ request: makeSemanticRequest(), candidate, critic: acceptedCritic(candidate), metadata: { provider: "TEST", model: "test", temperature: 0 }, reconstructionCallId: "p1", criticCallId: "p2" }));
  const intent = semanticModelToValidatedIntent(model);
  const context = semanticModelToScientificSessionContext(model);
  const knowledge = executeKnowledgeEngine({ originalQuestion: intent.originalQuestion, scientificObjectTerms: context.preservedScientificTerms.map((term, index) => ({ term, role: index === 0 ? "SUBJECT" as const : "CONTEXT" as const })), relations: context.detectedRelationships, context: { modality: ["CT", "IRM"] }, unknowns: context.missingInformation, consumer: "SCIENTIFIC_THINKING_ENGINE", createdAt: model.updatedAt });
  return { model, intent, context, knowledge };
};

describe("SEM-001 downstream diagnostics", () => {
  it("SEM → ST keeps snapshot reference, modalities and relation", () => {
    const { model, intent, context, knowledge } = acceptedFixture();
    const input = buildScientificThinkingInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge, { sessionId: "sem-st", contextVersion: 1, sourceJourney: "DESIGN_STUDY" });
    expect(input.scientificIntent.semanticModelRef).toBe(model.semanticModelId);
    expect(input.methodsMentioned).toEqual(expect.arrayContaining(["CT", "IRM"]));
    expect(input.relations.join(" ")).toContain("COMPARES_WITH");
  });

  it("SEM → IMG preserves both compared modalities and their relationship", () => {
    const { intent, context, knowledge } = acceptedFixture();
    const input = buildImagingDesignInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge, null, { sessionId: "sem-img", contextVersion: 1 });
    expect(context.preservedScientificTerms).toEqual(expect.arrayContaining(["CT", "IRM"]));
    expect(input.methodPreferences).toEqual(expect.arrayContaining(["CT", "IRM"]));
    expect(input.scientificRelationships.join(" ")).toContain("CT COMPARES_WITH IRM");
    expect(input.knownConstraints.join(" ")).not.toContain("COMPARES_WITH");
    expect(input.confirmedScientificQuestion.confirmation).toBe("VALIDATED_CONTEXT");
    expect(input.sourceHandoff.status).toBe("VALIDATED_WITHOUT_ST_HANDOFF");
  });

  it.each([
    ["CT", "IRM"],
    ["T1", "T2"],
    ["PET", "CT"],
    ["Echo", "CMR"],
    ["ADC", "perfusion"],
    ["élastographie par résonance magnétique", "élastographie ultrasonore"],
    ["DWI corps entier", "PET PSMA"],
  ])("preserves the comparative invariant %s / %s through SEM → IMG", (left, right) => {
    const candidate = comparisonCandidate();
    const message = `Je veux comparer ${left} et ${right} dans un contexte cardiaque.`;
    candidate.normalizedMeaning = message;
    candidate.summaryForUser = message;
    candidate.elements[1] = { ...candidate.elements[1], canonicalMeaning: left, sourceText: left };
    candidate.elements[2] = { ...candidate.elements[2], canonicalMeaning: right, sourceText: right };
    candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "i-ct")!.sourceText = left;
    candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "i-ct")!.normalizedLabel = left;
    candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "i-mri")!.sourceText = right;
    candidate.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "i-mri")!.normalizedLabel = right;
    candidate.semanticInventory.explicitRelations[0].sourceText = `comparer ${left} et ${right}`;
    const model = acceptSemanticModel(canonicalizeSemanticReconstruction({
      request: makeSemanticRequest([{ messageId: "user-1", role: "USER", content: message, createdAt: "2026-08-11T10:00:00.000Z" }]),
      candidate,
      critic: acceptedCritic(candidate),
      metadata: { provider: "TEST", model: "test", temperature: 0 },
      reconstructionCallId: "p1",
      criticCallId: "p2",
    }));
    const intent = semanticModelToValidatedIntent(model);
    const context = semanticModelToScientificSessionContext(model);
    const input = buildImagingDesignInput(intent, context.preservedScientificTerms, context.detectedRelationships, null, null, { sessionId: `sem-img-${left}`, contextVersion: 1 });
    expect(input.methodPreferences).toEqual(expect.arrayContaining([left, right]));
    expect(input.scientificRelationships.join(" ")).toContain(`${left} COMPARES_WITH ${right}`);
  });

  it("SEM → PRJ keeps imaging as required but not silently ready", () => {
    const { intent, context, knowledge } = acceptedFixture();
    const thinkingInput = buildScientificThinkingInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge, { sessionId: "sem-prj", contextVersion: 1, sourceJourney: "DESIGN_STUDY" });
    const thinking = createScientificThinkingSession(thinkingInput);
    const input = buildResearchProjectConstructionInput(intent, knowledge, thinking, null, { sessionId: "sem-prj", contextVersion: 1 });
    expect(input.sourceHandoffs.imaging.status).toBe("REQUIRED_BUT_NOT_READY");
    expect(input.scientificContext.methodPreferences).toEqual(expect.arrayContaining(["CT", "IRM"]));
    expect(input.provenance.some((item) => item.startsWith("validated-intent:"))).toBe(true);
  });
});
