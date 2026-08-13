import { describe, expect, it } from "vitest";
import { buildSemanticCoverage } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";

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
});
