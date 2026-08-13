import { describe, expect, it } from "vitest";
import { buildRelationCoverageReport } from "../coverage";
import type { SemanticReconstructionCandidate, SemanticReconstructionRequest } from "../types";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const request = (): SemanticReconstructionRequest => makeSemanticRequest([{
  messageId: "user-1",
  role: "USER",
  content: "We intend to compare marker A with marker B to characterize target C.",
  createdAt: "2026-08-12T10:00:00.000Z",
}]);

const framedComparisonCandidate = (): SemanticReconstructionCandidate => {
  const candidate = comparisonCandidate();
  candidate.language = "en";
  candidate.normalizedMeaning = "Compare marker A with marker B to characterize target C.";
  candidate.semanticInventory.explicitFragments = [
    { inventoryItemId: "i-intent", sourceMessageId: "user-1", sourceText: "We intend", normalizedLabel: "study intention", localRole: "intent", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-operator"] },
    { inventoryItemId: "i-operator", sourceMessageId: "user-1", sourceText: "compare", normalizedLabel: "compare", localRole: "comparison operator", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-a", "i-b"] },
    { inventoryItemId: "i-a", sourceMessageId: "user-1", sourceText: "marker A", normalizedLabel: "marker A", localRole: "comparison endpoint", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-b"] },
    { inventoryItemId: "i-b", sourceMessageId: "user-1", sourceText: "marker B", normalizedLabel: "marker B", localRole: "comparison endpoint", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-a"] },
    { inventoryItemId: "i-characterize", sourceMessageId: "user-1", sourceText: "characterize", normalizedLabel: "characterize", localRole: "operation", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-target"] },
    { inventoryItemId: "i-target", sourceMessageId: "user-1", sourceText: "target C", normalizedLabel: "target C", localRole: "scientific target", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-characterize"] },
  ];
  candidate.semanticInventory.explicitRelations = [
    { inventoryRelationId: "ir-frame", sourceInventoryItemId: "i-intent", targetInventoryItemId: "i-operator", sourceMessageId: "user-1", sourceText: "intend to compare", normalizedRelation: "AIMS_TO_MODIFY", polarity: "AFFIRMED" },
    { inventoryRelationId: "ir-compare", sourceInventoryItemId: "i-a", targetInventoryItemId: "i-b", sourceMessageId: "user-1", sourceText: "compare marker A with marker B", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" },
    { inventoryRelationId: "ir-finality", sourceInventoryItemId: "i-characterize", targetInventoryItemId: "i-target", sourceMessageId: "user-1", sourceText: "characterize target C", normalizedRelation: "OBSERVES", polarity: "AFFIRMED" },
  ];
  candidate.elements = [
    { ...candidate.elements[0], clientElementId: "e-intent", type: "SCIENTIFIC_INTENT", canonicalMeaning: "study intention", inventoryItemIds: ["i-intent"], sourceText: "We intend" },
    { ...candidate.elements[1], clientElementId: "e-a", type: "BIOMARKER", canonicalMeaning: "marker A", studyRole: "SUBJECT", inventoryItemIds: ["i-a"], sourceText: "marker A" },
    { ...candidate.elements[2], clientElementId: "e-b", type: "BIOMARKER", canonicalMeaning: "marker B", studyRole: "COMPARATOR_ARM", inventoryItemIds: ["i-b"], sourceText: "marker B" },
    { ...candidate.elements[0], clientElementId: "e-characterize", type: "OPERATION", canonicalMeaning: "characterize", inventoryItemIds: ["i-characterize"], sourceText: "characterize" },
    { ...candidate.elements[3], clientElementId: "e-target", type: "SCIENTIFIC_OBJECT", canonicalMeaning: "target C", inventoryItemIds: ["i-target"], sourceText: "target C" },
  ];
  candidate.relations = [
    { ...candidate.relations[0], clientRelationId: "r-compare", sourceClientElementId: "e-a", targetClientElementId: "e-b", relationType: "COMPARES_WITH", inventoryRelationIds: ["ir-compare"] },
    { ...candidate.relations[0], clientRelationId: "r-finality", sourceClientElementId: "e-characterize", targetClientElementId: "e-target", relationType: "OBSERVES", inventoryRelationIds: ["ir-finality"] },
  ];
  candidate.missingConcepts = [];
  candidate.ambiguities = [];
  candidate.unknowns = [];
  candidate.clarificationCandidates = [];
  return candidate;
};

const entry = (candidate: SemanticReconstructionCandidate, id: string) =>
  buildRelationCoverageReport(request(), candidate).entries.find((item) => item.inventoryRelationId === id);

describe("SEM-001R4A generic relation-coverage equivalence", () => {
  it("1 — recognizes an explicit direct comparison as carrier of its framed operator", () => {
    expect(entry(framedComparisonCandidate(), "ir-frame")).toMatchObject({
      coverageStatus: "MAPPED",
      mappedClientRelationIds: ["r-compare"],
    });
  });

  it("2 — keeps the framing relation unmapped when its direct scientific carrier is absent", () => {
    const candidate = framedComparisonCandidate();
    candidate.relations = candidate.relations.filter((relation) => relation.clientRelationId !== "r-compare");
    expect(entry(candidate, "ir-frame")).toMatchObject({ coverageStatus: "EXPLICIT_RELATION_UNMAPPED" });
  });

  it("3 — accepts the inverse orientation of a symmetric comparison carrier", () => {
    const candidate = framedComparisonCandidate();
    candidate.relations[0] = { ...candidate.relations[0], sourceClientElementId: "e-b", targetClientElementId: "e-a" };
    expect(entry(candidate, "ir-compare")).toMatchObject({ coverageStatus: "MAPPED" });
    expect(entry(candidate, "ir-frame")).toMatchObject({ coverageStatus: "MAPPED" });
  });

  it("4 — rejects inverse orientation when the relation contract is directional", () => {
    const candidate = framedComparisonCandidate();
    candidate.semanticInventory.explicitRelations = [{
      inventoryRelationId: "ir-measure",
      sourceInventoryItemId: "i-a",
      targetInventoryItemId: "i-b",
      sourceMessageId: "user-1",
      sourceText: "marker A with marker B",
      normalizedRelation: "MEASURED_BY",
      polarity: "AFFIRMED",
    }];
    candidate.elements.find((element) => element.clientElementId === "e-b")!.type = "METHOD";
    candidate.relations = [{ ...candidate.relations[0], sourceClientElementId: "e-b", targetClientElementId: "e-a", relationType: "MEASURED_BY", inventoryRelationIds: ["ir-measure"] }];
    expect(entry(candidate, "ir-measure")).toMatchObject({ coverageStatus: "EXPLICIT_RELATION_UNMAPPED" });
  });

  it("5 — does not use a comparison carrier to replace a missing finality relation", () => {
    const candidate = framedComparisonCandidate();
    candidate.relations = candidate.relations.filter((relation) => relation.clientRelationId !== "r-finality");
    expect(entry(candidate, "ir-finality")).toMatchObject({ coverageStatus: "EXPLICIT_RELATION_UNMAPPED" });
  });

  it("6 — does not use a finality relation to replace a missing comparison", () => {
    const candidate = framedComparisonCandidate();
    candidate.relations = candidate.relations.filter((relation) => relation.clientRelationId !== "r-compare");
    expect(entry(candidate, "ir-compare")).toMatchObject({ coverageStatus: "EXPLICIT_RELATION_UNMAPPED" });
  });

  it("7 — rejects an inferred carrier for an explicit functional construction", () => {
    const candidate = framedComparisonCandidate();
    candidate.relations[0] = { ...candidate.relations[0], epistemicStatus: "INFERRED_HIGH_CONFIDENCE", inferenceReason: "Synthetic inference", confidence: 0.9 };
    expect(entry(candidate, "ir-frame")).toMatchObject({ coverageStatus: "EXPLICIT_RELATION_UNMAPPED" });
  });

  it("8 — evaluates coverage without creating an element or relation", () => {
    const candidate = framedComparisonCandidate();
    const before = structuredClone(candidate);
    buildRelationCoverageReport(request(), candidate);
    expect(candidate).toEqual(before);
  });
});
