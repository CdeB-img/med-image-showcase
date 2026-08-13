import { describe, expect, it } from "vitest";
import { buildSemanticTaxonomyReport } from "../coverage";
import type { SemanticReconstructionCandidate } from "../types";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const modalityCandidate = (sourceText: string, canonicalMeaning = sourceText) => {
  const candidate = comparisonCandidate();
  candidate.elements[1] = {
    ...candidate.elements[1],
    type: "METHOD",
    canonicalMeaning,
    sourceText,
    inventoryItemIds: ["i-ct"],
  };
  candidate.semanticInventory.explicitFragments[1] = {
    ...candidate.semanticInventory.explicitFragments[1],
    sourceText,
    normalizedLabel: canonicalMeaning,
    localRole: "method",
  };
  return candidate;
};

const findingFor = (candidate: SemanticReconstructionCandidate, clientElementId: string) =>
  buildSemanticTaxonomyReport(makeSemanticRequest(), candidate).findings.find((finding) => finding.clientElementId === clientElementId);

const observedPhysiologicalTarget = (targetLiteral = "ventilation", canonicalMeaning = "pulmonary ventilation") => {
  const candidate = comparisonCandidate();
  candidate.elements[0] = { ...candidate.elements[0], type: "SCIENTIFIC_INTENT", canonicalMeaning: "follow", sourceText: "suivre", inventoryItemIds: ["i-operation"] };
  candidate.semanticInventory.explicitFragments[0] = { ...candidate.semanticInventory.explicitFragments[0], sourceText: "suivre", normalizedLabel: "follow", localRole: "action" };
  candidate.elements[1] = { ...candidate.elements[1], type: "BIOMARKER", canonicalMeaning, sourceText: targetLiteral, studyRole: "OUTCOME_ROLE", inventoryItemIds: ["i-ct"] };
  candidate.semanticInventory.explicitFragments[1] = { ...candidate.semanticInventory.explicitFragments[1], sourceText: targetLiteral, normalizedLabel: canonicalMeaning, localRole: "outcome" };
  candidate.elements[2] = { ...candidate.elements[2], type: "MODALITY", canonicalMeaning: "pulmonary magnetic resonance imaging", sourceText: "IRM poumon", studyRole: "MEASUREMENT", inventoryItemIds: ["i-mri"] };
  candidate.semanticInventory.explicitFragments[2] = { ...candidate.semanticInventory.explicitFragments[2], sourceText: "IRM poumon", normalizedLabel: "IRM pulmonaire", localRole: "method" };
  candidate.relations = [
    { ...candidate.relations[0], clientRelationId: "r-follow", sourceClientElementId: "e-operation", targetClientElementId: "e-ct", relationType: "AIMS_TO_MODIFY", inventoryRelationIds: ["ir-follow"] },
    { ...candidate.relations[0], clientRelationId: "r-measure", sourceClientElementId: "e-ct", targetClientElementId: "e-mri", relationType: "MEASURED_BY", inventoryRelationIds: ["ir-measure"] },
  ];
  candidate.semanticInventory.explicitRelations = [
    { inventoryRelationId: "ir-follow", sourceInventoryItemId: "i-operation", targetInventoryItemId: "i-ct", sourceMessageId: "user-1", sourceText: `suivre ${targetLiteral}`, normalizedRelation: "AIMS_TO_MODIFY", polarity: "AFFIRMED" },
    { inventoryRelationId: "ir-measure", sourceInventoryItemId: "i-ct", targetInventoryItemId: "i-mri", sourceMessageId: "user-1", sourceText: `${targetLiteral} par IRM poumon`, normalizedRelation: "MEASURED_BY", polarity: "AFFIRMED" },
  ];
  return candidate;
};

describe("SEM-001R4 closure generic taxonomy guards", () => {
  it.each([
    ["IRM poumon", "pulmonary magnetic resonance imaging"],
    ["MRI pelvis", "pelvic magnetic resonance imaging"],
    ["CT thorax", "thoracic computed tomography"],
    ["échographie abdominale", "abdominal ultrasound"],
    ["PET cérébrale", "cerebral positron emission tomography"],
  ])("classifies a broad imaging family with an anatomical scope as MODALITY: %s", (literal, meaning) => {
    expect(findingFor(modalityCandidate(literal, meaning), "e-ct")).toMatchObject({
      code: "IMAGING_FAMILY_TYPED_AS_METHOD",
      expectedType: "MODALITY",
    });
  });

  it.each([
    ["IRM de perfusion", "perfusion MRI acquisition"],
    ["PET PSMA", "PSMA positron emission tomography"],
    ["TEP FDG", "FDG positron emission tomography"],
  ])("keeps a subordinate acquisition or tracer technique typed as METHOD: %s", (literal, meaning) => {
    expect(findingFor(modalityCandidate(literal, meaning), "e-ct")).toBeUndefined();
  });

  it("does not treat an observational follow-up verb as biological modification", () => {
    expect(findingFor(observedPhysiologicalTarget(), "e-ct")).toMatchObject({
      code: "TARGET_TYPED_AS_BIOMARKER",
      expectedType: "SCIENTIFIC_OBJECT",
      expectedStudyRole: "OUTCOME_ROLE",
    });
  });

  it("keeps an explicitly quantitative pulmonary volume as BIOMARKER", () => {
    expect(findingFor(observedPhysiologicalTarget("volume pulmonaire", "pulmonary volume"), "e-ct")).toBeUndefined();
  });
});
