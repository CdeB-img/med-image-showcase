import { describe, expect, it } from "vitest";
import { buildSemanticCoverage, criticAcceptIsConsistent } from "../coverage";
import type { SemanticReconstructionCandidate } from "../types";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

const functionalMeasurementCandidate = () => {
  const candidate = comparisonCandidate();
  candidate.normalizedMeaning = "Quantifier l'iode par spectrométrie.";
  candidate.semanticInventory.explicitFragments = [
    { inventoryItemId: "i-action", sourceMessageId: "user-1", sourceText: "quantifié", normalizedLabel: "quantifier", localRole: "action", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-target"] },
    { inventoryItemId: "i-target", sourceMessageId: "user-1", sourceText: "iode", normalizedLabel: "iode", localRole: "measured object", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-method"] },
    { inventoryItemId: "i-method", sourceMessageId: "user-1", sourceText: "spectrométrie", normalizedLabel: "spectrométrie", localRole: "method", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: ["i-target"] },
  ];
  candidate.semanticInventory.explicitRelations = [{
    inventoryRelationId: "ir-measure",
    sourceInventoryItemId: "i-target",
    targetInventoryItemId: "i-method",
    sourceMessageId: "user-1",
    sourceText: "iode quantifié par spectrométrie",
    normalizedRelation: "MEASURED_BY",
    polarity: "AFFIRMED",
  }];
  candidate.elements = [
    { ...candidate.elements[1], clientElementId: "e-target", type: "BIOMARKER", canonicalMeaning: "iode", inventoryItemIds: ["i-target"], sourceText: "iode" },
    { ...candidate.elements[2], clientElementId: "e-method", type: "METHOD", canonicalMeaning: "spectrométrie", inventoryItemIds: ["i-method"], sourceText: "spectrométrie" },
  ];
  candidate.relations = [{
    ...candidate.relations[0],
    clientRelationId: "r-measure",
    sourceClientElementId: "e-target",
    targetClientElementId: "e-method",
    relationType: "MEASURED_BY",
    inventoryRelationIds: ["ir-measure"],
  }];
  candidate.missingConcepts = [];
  candidate.ambiguities = [];
  candidate.unknowns = [];
  candidate.clarificationCandidates = [];
  return candidate;
};

const measurementRequest = () => makeSemanticRequest([{
  messageId: "user-1",
  role: "USER",
  content: "iode quantifié par spectrométrie",
  createdAt: "2026-08-12T10:00:00.000Z",
}]);

describe("SEM-001R3J generic critic consistency repair", () => {
  it("1 — forbids ACCEPT when a scientific fragment is genuinely absent", () => {
    const candidate = comparisonCandidate();
    candidate.elements = candidate.elements.filter((element) => element.clientElementId !== "e-context");
    expect(criticAcceptIsConsistent(acceptedCritic(candidate), buildSemanticCoverage(makeSemanticRequest(), candidate))).toBe(false);
  });

  it("2 — covers a functional fragment through its grounded typed relation", () => {
    const candidate = functionalMeasurementCandidate();
    expect(buildSemanticCoverage(measurementRequest(), candidate).explicit.entries.find((entry) => entry.inventoryItemId === "i-action"))
      .toMatchObject({ coverageStatus: "MAPPED", mappedClientElementIds: [], mappedClientRelationIds: ["r-measure"] });
  });

  it("3 — does not manufacture an object node for a measurement verb carried by a relation", () => {
    const candidate = functionalMeasurementCandidate();
    const coverage = buildSemanticCoverage(measurementRequest(), candidate);
    expect(candidate.elements.some((element) => element.inventoryItemIds.includes("i-action"))).toBe(false);
    expect(coverage.explicit.status).toBe("COMPLETE");
  });

  it("4 — keeps coverage incomplete when the actually measured object is absent", () => {
    const candidate = functionalMeasurementCandidate();
    candidate.elements = candidate.elements.filter((element) => element.clientElementId !== "e-target");
    expect(buildSemanticCoverage(measurementRequest(), candidate).explicit.entries.find((entry) => entry.inventoryItemId === "i-target"))
      .toMatchObject({ coverageStatus: "UNRESOLVED_EXPLICIT_FRAGMENT" });
  });

  it("5 — preserves ACCEPT for a complete reconstruction", () => {
    const candidate = functionalMeasurementCandidate();
    expect(criticAcceptIsConsistent(acceptedCritic(candidate), buildSemanticCoverage(measurementRequest(), candidate))).toBe(true);
  });

  it("6 — creates no inferred element or relation while evaluating the guards", () => {
    const candidate = functionalMeasurementCandidate();
    const before = structuredClone(candidate);
    buildSemanticCoverage(measurementRequest(), candidate);
    expect(candidate).toEqual(before);
  });

  it("7 — forbids ACCEPT when relations are complete but an independent object is incomplete", () => {
    const candidate = comparisonCandidate();
    candidate.elements = candidate.elements.filter((element) => element.clientElementId !== "e-context");
    const coverage = buildSemanticCoverage(makeSemanticRequest(), candidate);
    expect(coverage.relations.status).toBe("COMPLETE");
    expect(coverage.explicit.status).toBe("INCOMPLETE");
    expect(criticAcceptIsConsistent(acceptedCritic(candidate), coverage)).toBe(false);
  });

  it("8 — preserves a real ambiguity and its clarification without inventing a resolution", () => {
    const candidate: SemanticReconstructionCandidate = functionalMeasurementCandidate();
    candidate.ambiguities = ["La métrique de quantification reste à préciser."];
    candidate.clarificationCandidates = [{ question: "Quelle métrique de quantification ?", reason: "La métrique influence l'interprétation.", resolvesClientElementIds: [] }];
    const beforeElements = structuredClone(candidate.elements);
    buildSemanticCoverage(measurementRequest(), candidate);
    expect(candidate.ambiguities).toHaveLength(1);
    expect(candidate.clarificationCandidates).toHaveLength(1);
    expect(candidate.elements).toEqual(beforeElements);
  });
});
