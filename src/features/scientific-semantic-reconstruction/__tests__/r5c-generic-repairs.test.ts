import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { buildSemanticCoverage } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";
import { acceptedCritic } from "./fixtures";

const request: SemanticReconstructionRequest = {
  schemaVersion: "SEM-001-1.1",
  sessionId: "semantic-r5c-generic-taxonomy",
  language: "fr",
  messages: [{
    messageId: "user-generic",
    role: "USER",
    content: "Comparer la technique alpha et la technique bêta pour la réponse fonctionnelle à six mois.",
    createdAt: "2026-08-13T00:00:00.000Z",
  }],
  previousModel: null,
};

const candidate = (responseType: "OUTCOME" | "ENDPOINT"): SemanticReconstructionCandidate => ({
  candidateId: "candidate-r5c-generic-taxonomy",
  language: "fr",
  normalizedMeaning: "Comparaison de techniques pour une réponse fonctionnelle.",
  summaryForUser: "Comparaison de techniques pour une réponse fonctionnelle.",
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "i-alpha", sourceMessageId: "user-generic", sourceText: "technique alpha", normalizedLabel: "technique alpha", localRole: "method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-beta"] },
      { inventoryItemId: "i-beta", sourceMessageId: "user-generic", sourceText: "technique bêta", normalizedLabel: "technique bêta", localRole: "method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-alpha"] },
      { inventoryItemId: "i-response", sourceMessageId: "user-generic", sourceText: "réponse fonctionnelle", normalizedLabel: "réponse fonctionnelle", localRole: "outcome", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-timing", sourceMessageId: "user-generic", sourceText: "six mois", normalizedLabel: "six mois", localRole: "timing", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    ],
    explicitRelations: [{ inventoryRelationId: "ir-compare", sourceInventoryItemId: "i-alpha", targetInventoryItemId: "i-beta", sourceMessageId: "user-generic", sourceText: "Comparer la technique alpha et la technique bêta", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" }],
  },
  elements: [
    { clientElementId: "e-alpha", type: "METHOD", canonicalMeaning: "technique alpha", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["i-alpha"], sourceMessageId: "user-generic", sourceText: "technique alpha", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-beta", type: "METHOD", canonicalMeaning: "technique bêta", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["i-beta"], sourceMessageId: "user-generic", sourceText: "technique bêta", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-response", type: responseType, canonicalMeaning: "réponse fonctionnelle", studyRole: "OUTCOME_ROLE", polarity: "AFFIRMED", inventoryItemIds: ["i-response"], sourceMessageId: "user-generic", sourceText: "réponse fonctionnelle", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    { clientElementId: "e-timing", type: "TIMING", canonicalMeaning: "six mois", studyRole: "NONE", polarity: "AFFIRMED", inventoryItemIds: ["i-timing"], sourceMessageId: "user-generic", sourceText: "six mois", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [{ clientRelationId: "r-compare", sourceClientElementId: "e-alpha", targetClientElementId: "e-beta", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: ["ir-compare"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false }],
  missingConcepts: [], ellipses: [], ambiguities: [], unknowns: [], contradictions: [], knowledgeRequests: [], clarificationCandidates: [],
  routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Comparaison méthodologique.", expectedCapabilities: [] },
  semanticWarnings: [],
});

describe("SEM-001R5C generic outcome and endpoint distinction", () => {
  it("rejects endpoint promotion when a result is only the context of a method comparison", () => {
    expect(buildSemanticCoverage(request, candidate("ENDPOINT")).taxonomy.findings).toContainEqual(expect.objectContaining({
      code: "UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
      expectedType: "OUTCOME",
    }));
  });

  it("accepts the same result as OUTCOME when no judging criterion is selected", () => {
    expect(buildSemanticCoverage(request, candidate("OUTCOME")).taxonomy.findings).not.toContainEqual(expect.objectContaining({
      code: "UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
    }));
  });

  it("does not let an inventory localRole self-promote a contextual result to ENDPOINT", () => {
    const promoted = candidate("ENDPOINT");
    promoted.elements.filter((item) => ["e-alpha", "e-beta"].includes(item.clientElementId)).forEach((item) => { item.studyRole = "COMPARATOR_ARM"; });
    promoted.semanticInventory.explicitFragments.find((item) => item.inventoryItemId === "i-response")!.localRole = "endpoint";
    promoted.semanticInventory.explicitRelations.push(
      { inventoryRelationId: "ir-alpha-response", sourceInventoryItemId: "i-alpha", targetInventoryItemId: "i-response", sourceMessageId: "user-generic", sourceText: "Comparer la technique alpha et la technique bêta pour la réponse fonctionnelle", normalizedRelation: "OBSERVES", polarity: "AFFIRMED" },
      { inventoryRelationId: "ir-beta-response", sourceInventoryItemId: "i-beta", targetInventoryItemId: "i-response", sourceMessageId: "user-generic", sourceText: "Comparer la technique alpha et la technique bêta pour la réponse fonctionnelle", normalizedRelation: "OBSERVES", polarity: "AFFIRMED" },
    );
    promoted.relations.push(
      { clientRelationId: "r-alpha-response", sourceClientElementId: "e-alpha", targetClientElementId: "e-response", relationType: "OBSERVES", polarity: "AFFIRMED", inventoryRelationIds: ["ir-alpha-response"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false },
      { clientRelationId: "r-beta-response", sourceClientElementId: "e-beta", targetClientElementId: "e-response", relationType: "OBSERVES", polarity: "AFFIRMED", inventoryRelationIds: ["ir-beta-response"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false },
    );
    expect(buildSemanticCoverage(request, promoted).taxonomy.findings).toContainEqual(expect.objectContaining({
      code: "UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
      expectedType: "OUTCOME",
    }));
  });
});

describe("SEM-001R5C generic multi-turn rejection", () => {
  const firstModel = canonicalizeSemanticReconstruction({
    request,
    candidate: candidate("OUTCOME"),
    critic: acceptedCritic(candidate("OUTCOME")),
    metadata: { provider: "TEST", model: "generic-test", temperature: null },
    reconstructionCallId: "generic-first-reconstruction",
    criticCallId: "generic-first-critic",
    now: "2026-08-13T00:00:01.000Z",
  });
  const alphaId = firstModel.elements.find((item) => item.canonicalMeaning === "technique alpha")!.semanticElementId;
  const betaId = firstModel.elements.find((item) => item.canonicalMeaning === "technique bêta")!.semanticElementId;
  const secondRequest: SemanticReconstructionRequest = {
    ...request,
    messages: [
      ...request.messages,
      { messageId: "user-correction", role: "USER", content: "Conservez la technique bêta, retirez la technique alpha et ajoutez la technique gamma.", createdAt: "2026-08-13T00:00:02.000Z" },
    ],
    previousModel: firstModel,
  };
  const secondCandidate: SemanticReconstructionCandidate = {
    ...candidate("OUTCOME"),
    candidateId: "candidate-r5c-generic-correction",
    semanticInventory: {
      explicitFragments: [
        ...candidate("OUTCOME").semanticInventory.explicitFragments,
        { inventoryItemId: "i-beta-retained", sourceMessageId: "user-correction", sourceText: "Conservez la technique bêta", normalizedLabel: "conserver technique bêta", localRole: "retained method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
        { inventoryItemId: "i-alpha-rejected", sourceMessageId: "user-correction", sourceText: "retirez la technique alpha", normalizedLabel: "retirer technique alpha", localRole: "rejected method", polarity: "NEGATED", modifiers: [], linkedInventoryItemIds: [] },
        { inventoryItemId: "i-gamma-added", sourceMessageId: "user-correction", sourceText: "ajoutez la technique gamma", normalizedLabel: "ajouter technique gamma", localRole: "added method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      ],
      explicitRelations: [
        ...candidate("OUTCOME").semanticInventory.explicitRelations,
        { inventoryRelationId: "ir-beta-gamma", sourceInventoryItemId: "i-beta-retained", targetInventoryItemId: "i-gamma-added", sourceMessageId: "user-correction", sourceText: "Conservez la technique bêta, retirez la technique alpha et ajoutez la technique gamma", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" },
      ],
    },
    elements: [
      { clientElementId: "e-alpha", type: "METHOD", canonicalMeaning: "technique alpha", studyRole: "MEASUREMENT", polarity: "NEGATED", inventoryItemIds: ["i-alpha", "i-alpha-rejected"], sourceMessageId: "user-correction", sourceText: "retirez la technique alpha", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [alphaId] },
      { clientElementId: "e-beta", type: "METHOD", canonicalMeaning: "technique bêta", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["i-beta", "i-beta-retained"], sourceMessageId: "user-correction", sourceText: "Conservez la technique bêta", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [betaId] },
      { clientElementId: "e-gamma", type: "METHOD", canonicalMeaning: "technique gamma", studyRole: "MEASUREMENT", polarity: "AFFIRMED", inventoryItemIds: ["i-gamma-added"], sourceMessageId: "user-correction", sourceText: "ajoutez la technique gamma", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
    ],
    relations: [
      { clientRelationId: "r-historical", sourceClientElementId: "e-alpha", targetClientElementId: "e-beta", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: ["ir-compare"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false },
      { clientRelationId: "r-current", sourceClientElementId: "e-beta", targetClientElementId: "e-gamma", relationType: "COMPARES_WITH", polarity: "AFFIRMED", inventoryRelationIds: ["ir-beta-gamma"], epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false },
    ],
  };

  it("does not require an old affirmed relation to remain active after one endpoint is explicitly superseded", () => {
    const withoutHistoricalRelation = { ...secondCandidate, relations: secondCandidate.relations.filter((item) => item.clientRelationId !== "r-historical") };
    const historicalEntry = buildSemanticCoverage(secondRequest, withoutHistoricalRelation).relations.entries.find((item) => item.inventoryRelationId === "ir-compare");
    expect(historicalEntry).toEqual(expect.objectContaining({ coverageStatus: "MAPPED" }));
    expect(historicalEntry?.mappedClientRelationIds).toContain(`superseded:e-alpha`);
  });

  it("marks a self-superseding negated identity and its historical relation as rejected", () => {
    const model = canonicalizeSemanticReconstruction({
      request: secondRequest,
      candidate: secondCandidate,
      critic: acceptedCritic(secondCandidate),
      metadata: { provider: "TEST", model: "generic-test", temperature: null },
      reconstructionCallId: "generic-second-reconstruction",
      criticCallId: "generic-second-critic",
      now: "2026-08-13T00:00:03.000Z",
    });
    const rejected = model.elements.find((item) => item.canonicalMeaning === "technique alpha");
    const retained = model.elements.find((item) => item.canonicalMeaning === "technique bêta");
    const added = model.elements.find((item) => item.canonicalMeaning === "technique gamma");
    expect(rejected?.epistemicStatus).toBe("REJECTED_BY_USER");
    expect(rejected?.provenance.source).toBe("USER_CORRECTION");
    expect(retained?.epistemicStatus).toBe("EXPLICIT_USER_STATED");
    expect(added?.epistemicStatus).toBe("EXPLICIT_USER_STATED");
    expect(model.relations.find((item) => item.sourceElementId === alphaId || item.targetElementId === alphaId)?.epistemicStatus).toBe("REJECTED_BY_USER");
    expect(model.relations.find((item) => item.sourceElementId === betaId && item.targetElementId === added?.semanticElementId)?.epistemicStatus).toBe("EXPLICIT_USER_STATED");
  });
});
