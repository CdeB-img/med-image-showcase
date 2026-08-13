import { describe, expect, it } from "vitest";
import { buildExplicitCoverageReport, buildSemanticIntegrityReport, buildSemanticTaxonomyReport } from "../coverage";
import { normalizeSemanticRelationEndpointGrounding } from "../provider";
import { stabilizeRelationOwnership } from "../relation-ownership";
import type { SemanticReconstructionRequest } from "../types";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

describe("SEM-001R5M generic functional provenance", () => {
  it("coalesces two comparison spokes through one functional node into one direct relation", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitRelations = [
      { inventoryRelationId: "ir-left", sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-ct", sourceMessageId: "user-1", sourceText: "comparer CT", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" },
      { inventoryRelationId: "ir-right", sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-mri", sourceMessageId: "user-1", sourceText: "comparer CT et IRM", normalizedRelation: "COMPARES_WITH", polarity: "AFFIRMED" },
    ];
    candidate.relations = [
      { ...candidate.relations[0], clientRelationId: "r-left", sourceClientElementId: "e-operation", targetClientElementId: "e-ct", inventoryRelationIds: ["ir-left"] },
      { ...candidate.relations[0], clientRelationId: "r-right", sourceClientElementId: "e-operation", targetClientElementId: "e-mri", inventoryRelationIds: ["ir-right"] },
    ];

    const stabilized = stabilizeRelationOwnership(candidate).candidate;
    expect(stabilized.relations).toHaveLength(1);
    expect(new Set([stabilized.relations[0].sourceClientElementId, stabilized.relations[0].targetClientElementId])).toEqual(new Set(["e-ct", "e-mri"]));
    expect(stabilized.relations[0]).toMatchObject({ relationType: "COMPARES_WITH", inventoryRelationIds: ["ir-left", "ir-right"] });
  });

  it("derives exact endpoint provenance for an explicit relation only when both endpoint spans are unique", () => {
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "Comparer technique alpha et technique beta pour étudier la cible gamma.", createdAt: "2026-08-13T00:00:00.000Z" }]);
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments[1] = { ...candidate.semanticInventory.explicitFragments[1], sourceText: "technique alpha", normalizedLabel: "technique alpha" };
    candidate.semanticInventory.explicitFragments[2] = { ...candidate.semanticInventory.explicitFragments[2], sourceText: "technique beta", normalizedLabel: "technique beta" };
    candidate.elements[1] = { ...candidate.elements[1], sourceText: "technique alpha", canonicalMeaning: "technique alpha" };
    candidate.elements[2] = { ...candidate.elements[2], sourceText: "technique beta", canonicalMeaning: "technique beta" };
    candidate.semanticInventory.explicitRelations = [{ ...candidate.semanticInventory.explicitRelations[0], sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-ct", sourceText: "Comparer technique alpha" }];
    candidate.relations[0] = { ...candidate.relations[0], inventoryRelationIds: ["ir-compare"] };

    const grounded = normalizeSemanticRelationEndpointGrounding(request, candidate);
    expect(grounded.relations[0].inventoryRelationIds[0]).toMatch(/^deterministic-semantic-grounding:/);
    const inventory = grounded.semanticInventory.explicitRelations.find((item) => item.inventoryRelationId === grounded.relations[0].inventoryRelationIds[0]);
    expect(inventory).toMatchObject({ sourceInventoryItemId: "i-ct", targetInventoryItemId: "i-mri" });
    expect(request.messages[0].content).toContain(inventory!.sourceText);
  });

  it("covers a relational connector through a direct relation between linked scientific endpoints", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-link",
      sourceMessageId: "user-1",
      sourceText: "comparer",
      normalizedLabel: "relation de comparaison",
      localRole: "link",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: ["i-ct", "i-mri"],
    });
    expect(buildExplicitCoverageReport(makeSemanticRequest(), candidate).entries.find((item) => item.inventoryItemId === "i-link")).toMatchObject({
      coverageStatus: "MAPPED",
      mappedClientRelationIds: ["r-compare"],
    });
  });

  it("scopes judging-variable selection to the selected side of an explicit contrast", () => {
    const request: SemanticReconstructionRequest = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "On suit diamètre brut, mais c'est la vitesse de croissance plutôt que le diamètre brut qui doit compter.", createdAt: "2026-08-13T00:00:00.000Z" }]);
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments = [
      { inventoryItemId: "i-selected", sourceMessageId: "user-1", sourceText: "vitesse de croissance", normalizedLabel: "vitesse de croissance", localRole: "selected endpoint", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-other", sourceMessageId: "user-1", sourceText: "diamètre brut", normalizedLabel: "diamètre brut", localRole: "deprioritized variable", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    ];
    candidate.elements = [
      { ...candidate.elements[1], clientElementId: "e-selected", type: "BIOMARKER", canonicalMeaning: "vitesse de croissance", sourceText: "vitesse de croissance", inventoryItemIds: ["i-selected"] },
      { ...candidate.elements[1], clientElementId: "e-other", type: "BIOMARKER", canonicalMeaning: "diamètre brut", sourceText: "diamètre brut", inventoryItemIds: ["i-other"] },
    ];
    candidate.relations = [];
    const findings = buildSemanticTaxonomyReport(request, candidate).findings;
    expect(findings).toContainEqual(expect.objectContaining({ code: "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT", clientElementId: "e-selected" }));
    expect(findings).not.toContainEqual(expect.objectContaining({ code: "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT", clientElementId: "e-other" }));
  });

  it("accepts an observable repeated in a test-retest design while rejecting a design-to-time pseudo-anchor", () => {
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "Test-retest du signal le même jour.", createdAt: "2026-08-13T00:00:00.000Z" }]);
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments = [
      { inventoryItemId: "i-signal", sourceMessageId: "user-1", sourceText: "signal", normalizedLabel: "signal", localRole: "observable", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-design", sourceMessageId: "user-1", sourceText: "Test-retest", normalizedLabel: "test-retest", localRole: "design", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
      { inventoryItemId: "i-time", sourceMessageId: "user-1", sourceText: "même jour", normalizedLabel: "même jour", localRole: "timing", polarity: "AFFIRMED", modifiers: [], linkedInventoryItemIds: [] },
    ];
    candidate.elements = [
      { ...candidate.elements[1], clientElementId: "e-signal", type: "BIOMARKER", canonicalMeaning: "signal", sourceText: "signal", inventoryItemIds: ["i-signal"] },
      { ...candidate.elements[1], clientElementId: "e-design", type: "STUDY_DESIGN", canonicalMeaning: "test-retest", sourceText: "Test-retest", inventoryItemIds: ["i-design"] },
      { ...candidate.elements[1], clientElementId: "e-time", type: "TIMING", canonicalMeaning: "même jour", sourceText: "même jour", inventoryItemIds: ["i-time"] },
    ];
    candidate.semanticInventory.explicitRelations = [
      { inventoryRelationId: "ir-design", sourceInventoryItemId: "i-signal", targetInventoryItemId: "i-design", sourceMessageId: "user-1", sourceText: "Test-retest du signal", normalizedRelation: "REPEATED_AT", polarity: "AFFIRMED" },
      { inventoryRelationId: "ir-time", sourceInventoryItemId: "i-design", targetInventoryItemId: "i-time", sourceMessageId: "user-1", sourceText: "Test-retest du signal le même jour", normalizedRelation: "REPEATED_AT", polarity: "AFFIRMED" },
    ];
    candidate.relations = [
      { ...candidate.relations[0], clientRelationId: "r-design", sourceClientElementId: "e-signal", targetClientElementId: "e-design", relationType: "REPEATED_AT", inventoryRelationIds: ["ir-design"] },
      { ...candidate.relations[0], clientRelationId: "r-invalid", sourceClientElementId: "e-design", targetClientElementId: "e-time", relationType: "REPEATED_AT", inventoryRelationIds: ["ir-time"] },
    ];
    const findings = buildSemanticIntegrityReport(request, candidate).findings;
    expect(findings).not.toContainEqual(expect.objectContaining({ code: "RELATION_DIRECTION_OR_ROLE_MISMATCH", clientRelationId: "r-design" }));
    expect(findings).toContainEqual(expect.objectContaining({ code: "RELATION_DIRECTION_OR_ROLE_MISMATCH", clientRelationId: "r-invalid" }));
  });
});
