import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { buildSemanticIntegrityReport, runSemanticCriticCycles } from "../coverage";
import { stabilizeRelationOwnership } from "../relation-ownership";
import type {
  ScientificSemanticProvider,
  SemanticElementType,
  SemanticReconstructionCandidate,
  SemanticReconstructionRequest,
} from "../types";
import { acceptedCritic } from "./fixtures";

const requestFor = (content: string, previousModel: SemanticReconstructionRequest["previousModel"] = null): SemanticReconstructionRequest => ({
  schemaVersion: "SEM-001-1.1",
  sessionId: "semantic-r5f-relation-ownership",
  language: "fr",
  messages: [{ messageId: "user-source", role: "USER", content, createdAt: "2026-08-13T10:00:00.000Z" }],
  previousModel,
});

const relationCandidate = ({
  content = "Mesurer le signal au temps final.",
  sourceText = "signal",
  targetText = "temps final",
  sourceType = "OUTCOME",
  targetType = "TIMING",
  relationType = "REPEATED_AT",
  inventoryRelationType = relationType,
  reverseInventory = false,
}: {
  content?: string;
  sourceText?: string;
  targetText?: string;
  sourceType?: SemanticElementType;
  targetType?: SemanticElementType;
  relationType?: string;
  inventoryRelationType?: string;
  reverseInventory?: boolean;
} = {}): SemanticReconstructionCandidate => ({
  candidateId: "candidate-relation-ownership",
  language: "fr",
  normalizedMeaning: content,
  summaryForUser: content,
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "inventory-source", sourceMessageId: "user-source", sourceText, normalizedLabel: sourceText, localRole: "source endpoint", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-target"] },
      { inventoryItemId: "inventory-target", sourceMessageId: "user-source", sourceText: targetText, normalizedLabel: targetText, localRole: "target endpoint", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["inventory-source"] },
    ],
    explicitRelations: [{
      inventoryRelationId: "inventory-relation",
      sourceInventoryItemId: reverseInventory ? "inventory-target" : "inventory-source",
      targetInventoryItemId: reverseInventory ? "inventory-source" : "inventory-target",
      sourceMessageId: "user-source",
      sourceText: content.replace(/\.$/, ""),
      normalizedRelation: inventoryRelationType,
      polarity: "AFFIRMED",
    }],
  },
  elements: [
    { clientElementId: "element-source", type: sourceType, canonicalMeaning: sourceText, studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-source"], sourceMessageId: "user-source", sourceText, epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "element-target", type: targetType, canonicalMeaning: targetText, studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["inventory-target"], sourceMessageId: "user-source", sourceText: targetText, epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [{
    clientRelationId: "semantic-relation",
    sourceClientElementId: "element-source",
    targetClientElementId: "element-target",
    relationType,
    polarity: "AFFIRMED",
    inventoryRelationIds: ["inventory-relation"],
    epistemicStatus: "EXPLICIT_USER_STATED",
    confidence: 1,
    inferenceReason: null,
    requiresConfirmation: false,
  }],
  missingConcepts: [],
  ellipses: [],
  ambiguities: [],
  unknowns: [],
  contradictions: [],
  knowledgeRequests: [],
  clarificationCandidates: [],
  routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Relation scientifique explicite.", expectedCapabilities: [] },
  semanticWarnings: [],
});

describe("SEM-001R5F relation ownership", () => {
  it("aligns inventory direction with the Semantic Relation owner", () => {
    const initial = relationCandidate({ reverseInventory: true });
    expect(buildSemanticIntegrityReport(requestFor(initial.normalizedMeaning), initial).status).toBe("INCOMPLETE");

    const stabilized = stabilizeRelationOwnership(initial);
    expect(stabilized.adjustments).toHaveLength(1);
    expect(stabilized.candidate.semanticInventory.explicitRelations[0]).toMatchObject({
      sourceInventoryItemId: "inventory-source",
      targetInventoryItemId: "inventory-target",
    });
    expect(buildSemanticIntegrityReport(requestFor(initial.normalizedMeaning), stabilized.candidate).status).toBe("COMPLETE");
  });

  it("reaches one stable critic state without alternating directions", async () => {
    const initial = relationCandidate({ reverseInventory: true });
    let criticCalls = 0;
    const provider: ScientificSemanticProvider = {
      metadata: { provider: "TEST", model: "relation-ownership", temperature: null },
      reconstruct: async () => ({ callId: "unused", candidate: initial, attempts: [] }),
      critique: async (_request, candidate) => {
        criticCalls += 1;
        return { callId: `critic-${criticCalls}`, critic: acceptedCritic(candidate), attempts: [] };
      },
    };

    const result = await runSemanticCriticCycles(provider, requestFor(initial.normalizedMeaning), initial);
    expect(result.accepted).toBe(true);
    expect(result.terminalReason).toBe("CRITIC_ACCEPTED_AFTER_COMPLETE_AUDIT");
    expect(criticCalls).toBe(1);
    expect(result.candidate.semanticInventory.explicitRelations[0]).toMatchObject({
      sourceInventoryItemId: "inventory-source",
      targetInventoryItemId: "inventory-target",
    });
  });

  it("preserves source provenance, IDs, polarity and the endpoint set", () => {
    const initial = relationCandidate({ reverseInventory: true });
    const before = initial.semanticInventory.explicitRelations[0];
    const after = stabilizeRelationOwnership(initial).candidate.semanticInventory.explicitRelations[0];

    expect(after.inventoryRelationId).toBe(before.inventoryRelationId);
    expect(after.sourceMessageId).toBe(before.sourceMessageId);
    expect(after.sourceText).toBe(before.sourceText);
    expect(after.normalizedRelation).toBe(before.normalizedRelation);
    expect(after.polarity).toBe(before.polarity);
    expect(new Set([after.sourceInventoryItemId, after.targetInventoryItemId])).toEqual(new Set([before.sourceInventoryItemId, before.targetInventoryItemId]));
  });

  it("keeps Semantic Relation polarity authoritative when inventory provenance uses a different assertion status", () => {
    const initial = relationCandidate();
    initial.relations[0] = { ...initial.relations[0], relationType: "MAY_INFLUENCE", polarity: "CONDITIONAL" };

    const stabilized = stabilizeRelationOwnership(initial).candidate;

    expect(stabilized.relations[0].polarity).toBe("CONDITIONAL");
    expect(stabilized.semanticInventory.explicitRelations[0].polarity).toBe("AFFIRMED");
  });

  it("preserves a legitimate active/passive inverse relation", () => {
    const inverse = relationCandidate({
      content: "Mesurer le signal par méthode alpha.",
      sourceText: "signal",
      targetText: "méthode alpha",
      sourceType: "BIOMARKER",
      targetType: "METHOD",
      relationType: "MEASURED_BY",
      inventoryRelationType: "MEASURES",
      reverseInventory: true,
    });
    const stabilized = stabilizeRelationOwnership(inverse);
    expect(stabilized.adjustments).toHaveLength(0);
    expect(stabilized.candidate.semanticInventory.explicitRelations[0]).toMatchObject({
      sourceInventoryItemId: "inventory-target",
      targetInventoryItemId: "inventory-source",
    });
    expect(buildSemanticIntegrityReport(requestFor(inverse.normalizedMeaning), stabilized.candidate).status).toBe("COMPLETE");
  });

  it("preserves comparator, intervention, measurement, temporal and retained multi-turn relations", () => {
    const directCases = [
      relationCandidate({ content: "Comparer méthode alpha et méthode bêta.", sourceText: "méthode alpha", targetText: "méthode bêta", sourceType: "METHOD", targetType: "METHOD", relationType: "COMPARES_WITH" }),
      relationCandidate({ content: "La réponse change après intervention alpha.", sourceText: "réponse", targetText: "intervention alpha", sourceType: "OUTCOME", targetType: "INTERVENTION", relationType: "CHANGES_AFTER" }),
      relationCandidate({ content: "Mesurer le signal par méthode alpha.", sourceText: "signal", targetText: "méthode alpha", sourceType: "BIOMARKER", targetType: "METHOD", relationType: "MEASURED_BY" }),
      relationCandidate(),
    ];
    directCases.forEach((candidate) => expect(stabilizeRelationOwnership(candidate).candidate).toEqual(candidate));

    const firstCandidate = relationCandidate();
    const firstRequest = requestFor(firstCandidate.normalizedMeaning);
    const firstModel = canonicalizeSemanticReconstruction({
      request: firstRequest,
      candidate: firstCandidate,
      critic: acceptedCritic(firstCandidate),
      metadata: { provider: "TEST", model: "relation-ownership", temperature: null },
      reconstructionCallId: "reconstruction-1",
      criticCallId: "critic-1",
      now: "2026-08-13T10:00:01.000Z",
    });
    const retainedRelation = firstModel.relations[0];
    const secondRequest: SemanticReconstructionRequest = {
      ...requestFor("Ajouter un contexte clinique.", firstModel),
      messages: [
        ...firstRequest.messages,
        { messageId: "user-second", role: "USER", content: "Ajouter un contexte clinique.", createdAt: "2026-08-13T10:00:02.000Z" },
      ],
    };
    const secondCandidate = relationCandidate({ content: "Ajouter un contexte clinique.", sourceText: "Ajouter", targetText: "contexte clinique", sourceType: "SCIENTIFIC_INTENT", targetType: "CONDITION", relationType: "APPLIES_TO" });
    secondCandidate.semanticInventory.explicitFragments.forEach((fragment) => { fragment.sourceMessageId = "user-second"; });
    secondCandidate.semanticInventory.explicitRelations.forEach((relation) => { relation.sourceMessageId = "user-second"; });
    secondCandidate.elements.forEach((element) => { element.sourceMessageId = "user-second"; });
    const secondModel = canonicalizeSemanticReconstruction({
      request: secondRequest,
      candidate: secondCandidate,
      critic: acceptedCritic(secondCandidate),
      metadata: { provider: "TEST", model: "relation-ownership", temperature: null },
      reconstructionCallId: "reconstruction-2",
      criticCallId: "critic-2",
      now: "2026-08-13T10:00:03.000Z",
    });
    expect(secondModel.relations).toContainEqual({ ...retainedRelation, version: retainedRelation.version + 1 });
  });
});
