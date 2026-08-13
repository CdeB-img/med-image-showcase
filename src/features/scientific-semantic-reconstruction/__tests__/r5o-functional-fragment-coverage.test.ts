import { describe, expect, it } from "vitest";
import { canonicalizeSemanticReconstruction } from "../canonical";
import { buildExplicitCoverageReport } from "../coverage";
import { stabilizeRelationOwnership } from "../relation-ownership";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "./fixtures";

describe("SEM-001R5O functional fragment and repetition ownership", () => {
  it("covers an exact functional predicate through the explicit relation it expresses", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-predicate",
      sourceMessageId: "user-1",
      sourceText: "opposer",
      normalizedLabel: "opposer",
      localRole: "action",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: [],
    });
    candidate.semanticInventory.explicitRelations[0].sourceText = "opposer CT et IRM";
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "Je veux opposer CT et IRM cardiaque.", createdAt: "2026-08-13T00:00:00.000Z" }]);
    expect(buildExplicitCoverageReport(request, candidate).entries.find((entry) => entry.inventoryItemId === "i-predicate")).toMatchObject({
      coverageStatus: "MAPPED",
      mappedClientRelationIds: ["r-compare"],
    });
  });

  it("covers a comparator pronoun through the linked comparison endpoints", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-comparator-pronoun",
      sourceMessageId: "user-1",
      sourceText: "lequel",
      normalizedLabel: "lequel",
      localRole: "comparator",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: ["i-ct", "i-mri"],
    });
    const request = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "CT et IRM, lequel comparer ?", createdAt: "2026-08-13T00:00:00.000Z" }]);
    expect(buildExplicitCoverageReport(request, candidate).entries.find((entry) => entry.inventoryItemId === "i-comparator-pronoun")).toMatchObject({
      coverageStatus: "MAPPED",
      mappedClientRelationIds: ["r-compare"],
    });
  });

  it("projects a repetition relation from a design wrapper to its unique linked observable", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments[0] = { ...candidate.semanticInventory.explicitFragments[0], sourceText: "Test-retest", normalizedLabel: "test-retest", localRole: "design", linkedInventoryItemIds: ["i-ct"] };
    candidate.semanticInventory.explicitFragments[2] = { ...candidate.semanticInventory.explicitFragments[2], sourceText: "même jour", normalizedLabel: "même jour", localRole: "timing", linkedInventoryItemIds: [] };
    candidate.semanticInventory.explicitRelations = [{ inventoryRelationId: "ir-repeat", sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-mri", sourceMessageId: "user-1", sourceText: "Test-retest ADC le même jour", normalizedRelation: "REPEATED_AT", polarity: "AFFIRMED" }];
    candidate.elements[0] = { ...candidate.elements[0], type: "STUDY_DESIGN", sourceText: "Test-retest", canonicalMeaning: "test-retest" };
    candidate.elements[1] = { ...candidate.elements[1], type: "BIOMARKER", sourceText: "ADC", canonicalMeaning: "ADC" };
    candidate.elements[2] = { ...candidate.elements[2], type: "TIMING", sourceText: "même jour", canonicalMeaning: "même jour" };
    candidate.relations = [{ ...candidate.relations[0], clientRelationId: "r-repeat", sourceClientElementId: "e-operation", targetClientElementId: "e-mri", relationType: "REPEATED_AT", inventoryRelationIds: ["ir-repeat"] }];

    const stabilized = stabilizeRelationOwnership(candidate).candidate;
    expect(stabilized.relations[0]).toMatchObject({ sourceClientElementId: "e-ct", targetClientElementId: "e-mri", relationType: "REPEATED_AT" });
    expect(stabilized.semanticInventory.explicitRelations[0]).toMatchObject({ sourceInventoryItemId: "i-ct", targetInventoryItemId: "i-mri", sourceText: "Test-retest ADC le même jour" });
  });

  it("does not project a repetition wrapper when more than one linked observable is possible", () => {
    const candidate = comparisonCandidate();
    candidate.semanticInventory.explicitFragments[0] = { ...candidate.semanticInventory.explicitFragments[0], localRole: "design", linkedInventoryItemIds: ["i-ct", "i-context"] };
    candidate.semanticInventory.explicitRelations = [{ inventoryRelationId: "ir-repeat", sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-mri", sourceMessageId: "user-1", sourceText: "comparer CT et IRM", normalizedRelation: "REPEATED_AT", polarity: "AFFIRMED" }];
    candidate.elements[0] = { ...candidate.elements[0], type: "STUDY_DESIGN" };
    candidate.elements[2] = { ...candidate.elements[2], type: "TIMING" };
    candidate.relations = [{ ...candidate.relations[0], sourceClientElementId: "e-operation", targetClientElementId: "e-mri", relationType: "REPEATED_AT", inventoryRelationIds: ["ir-repeat"] }];
    expect(stabilizeRelationOwnership(candidate).candidate.relations[0].sourceClientElementId).toBe("e-operation");
  });

  it("preserves prior explicit provenance for an unchanged ungrounded historical endpoint", () => {
    const firstCandidate = comparisonCandidate();
    const firstRequest = makeSemanticRequest();
    const firstModel = canonicalizeSemanticReconstruction({
      request: firstRequest,
      candidate: firstCandidate,
      critic: acceptedCritic(firstCandidate),
      metadata: { provider: "TEST", model: "deterministic", temperature: null },
      reconstructionCallId: "reconstruct-1",
      criticCallId: "critic-1",
      now: "2026-08-13T00:00:00.000Z",
    });
    const prior = firstModel.elements.find((element) => element.type === "MODALITY" && element.canonicalMeaning === "CT")!;
    const carryCandidate = comparisonCandidate();
    carryCandidate.semanticInventory = { explicitFragments: [], explicitRelations: [] };
    carryCandidate.elements = [{
      ...carryCandidate.elements[1],
      clientElementId: prior.semanticElementId,
      inventoryItemIds: [],
      sourceMessageId: null,
      sourceText: null,
      epistemicStatus: "INFERRED_HIGH_CONFIDENCE",
      inferenceReason: "Carried from prior context",
      requiresConfirmation: true,
      supersedesElementIds: [prior.semanticElementId],
    }];
    carryCandidate.relations = [];
    const secondRequest = makeSemanticRequest([{ messageId: "user-2", role: "USER", content: "Ajoutez un autre élément.", createdAt: "2026-08-13T00:01:00.000Z" }], firstModel);
    const secondModel = canonicalizeSemanticReconstruction({
      request: secondRequest,
      candidate: carryCandidate,
      critic: acceptedCritic(carryCandidate),
      metadata: { provider: "TEST", model: "deterministic", temperature: null },
      reconstructionCallId: "reconstruct-2",
      criticCallId: "critic-2",
      now: "2026-08-13T00:01:00.000Z",
    });
    expect(secondModel.elements.find((element) => element.semanticElementId === prior.semanticElementId)).toMatchObject({
      epistemicStatus: "EXPLICIT_USER_STATED",
      sourceSpan: prior.sourceSpan,
      inventoryItemIds: prior.inventoryItemIds,
      supersedesElementIds: [],
      provenance: { source: "DETERMINISTIC_CARRY_FORWARD" },
    });
  });
});
