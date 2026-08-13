import { describe, expect, it } from "vitest";
import { buildExplicitCoverageReport, buildRelationCoverageReport } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";

const request: SemanticReconstructionRequest = {
  schemaVersion: "SEM-001-1.1",
  sessionId: "unary-transition-coverage",
  language: "fr",
  messages: [{ messageId: "user-current", role: "USER", content: "Conservez la méthode alpha et ajoutez la méthode bêta.", createdAt: "2026-08-13T09:00:00.000Z" }],
  previousModel: null,
};

const candidate = (): SemanticReconstructionCandidate => ({
  candidateId: "unary-transition-candidate",
  language: "fr",
  normalizedMeaning: "Conserver une méthode et en ajouter une autre.",
  summaryForUser: "La méthode alpha est conservée et la méthode bêta ajoutée.",
  semanticInventory: {
    explicitFragments: [
      { inventoryItemId: "i-retain", sourceMessageId: "user-current", sourceText: "Conservez", normalizedLabel: "conserver", localRole: "action retain", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-alpha"] },
      { inventoryItemId: "i-alpha", sourceMessageId: "user-current", sourceText: "méthode alpha", normalizedLabel: "méthode alpha", localRole: "retained method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-add", sourceMessageId: "user-current", sourceText: "ajoutez", normalizedLabel: "ajouter", localRole: "action add", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-beta"] },
      { inventoryItemId: "i-beta", sourceMessageId: "user-current", sourceText: "méthode bêta", normalizedLabel: "méthode bêta", localRole: "added method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    ],
    explicitRelations: [
      { inventoryRelationId: "ir-retain", sourceInventoryItemId: "i-retain", targetInventoryItemId: "i-alpha", sourceMessageId: "user-current", sourceText: "Conservez la méthode alpha", normalizedRelation: "RETAINS", polarity: "AFFIRMED" },
      { inventoryRelationId: "ir-add", sourceInventoryItemId: "i-add", targetInventoryItemId: "i-beta", sourceMessageId: "user-current", sourceText: "ajoutez la méthode bêta", normalizedRelation: "ADDS", polarity: "AFFIRMED" },
    ],
  },
  elements: [
    { clientElementId: "e-alpha", type: "METHOD", canonicalMeaning: "méthode alpha", studyRole: "SUBJECT", polarity: "AFFIRMED", inventoryItemIds: ["i-alpha"], sourceMessageId: "user-current", sourceText: "méthode alpha", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: ["prior-alpha"] },
    { clientElementId: "e-beta", type: "METHOD", canonicalMeaning: "méthode bêta", studyRole: "COMPARATOR_ARM", polarity: "AFFIRMED", inventoryItemIds: ["i-beta"], sourceMessageId: "user-current", sourceText: "méthode bêta", epistemicStatus: "EXPLICIT_USER_STATED", confidence: 1, inferenceReason: null, requiresConfirmation: false, supersedesElementIds: [] },
  ],
  relations: [],
  missingConcepts: [], ellipses: [], ambiguities: [], unknowns: [], contradictions: [], knowledgeRequests: [], clarificationCandidates: [],
  routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Le dessin d'étude est modifié.", expectedCapabilities: ["SCIENTIFIC_THINKING"] },
  semanticWarnings: [],
});

describe("SEM generic unary state-transition coverage", () => {
  it("maps retain/add actions to explicit object state without inventing self-relations", () => {
    const current = candidate();
    const fragments = buildExplicitCoverageReport(request, current);
    const relations = buildRelationCoverageReport(request, current);
    expect(fragments.entries.find((entry) => entry.inventoryItemId === "i-retain")?.mappedClientRelationIds).toEqual(["state-transition:e-alpha"]);
    expect(fragments.entries.find((entry) => entry.inventoryItemId === "i-add")?.mappedClientRelationIds).toEqual(["state-transition:e-beta"]);
    expect(relations.entries.find((entry) => entry.inventoryRelationId === "ir-retain")?.mappedClientRelationIds).toEqual(["state-transition:e-alpha"]);
    expect(relations.entries.find((entry) => entry.inventoryRelationId === "ir-add")?.mappedClientRelationIds).toEqual(["state-transition:e-beta"]);
    expect(current.relations).toEqual([]);
  });

  it("does not map a retain/add transition when the object state contradicts the action", () => {
    const current = candidate();
    current.elements[0].supersedesElementIds = [];
    current.elements[1].polarity = "NEGATED";
    expect(buildExplicitCoverageReport(request, current).entries.find((entry) => entry.inventoryItemId === "i-retain")?.coverageStatus).toBe("UNRESOLVED_EXPLICIT_FRAGMENT");
    expect(buildExplicitCoverageReport(request, current).entries.find((entry) => entry.inventoryItemId === "i-add")?.coverageStatus).toBe("UNRESOLVED_EXPLICIT_FRAGMENT");
    expect(buildRelationCoverageReport(request, current).entries.find((entry) => entry.inventoryRelationId === "ir-retain")?.coverageStatus).toBe("EXPLICIT_RELATION_UNMAPPED");
    expect(buildRelationCoverageReport(request, current).entries.find((entry) => entry.inventoryRelationId === "ir-add")?.coverageStatus).toBe("EXPLICIT_RELATION_UNMAPPED");
  });
});
