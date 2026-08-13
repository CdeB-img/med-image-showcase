import { describe, expect, it } from "vitest";
import { buildSemanticTaxonomyReport, preserveContextualMeasurementAmbiguities } from "../coverage";
import type { SemanticReconstructionCandidate } from "../types";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const predictiveCandidate = (
  sourceText: string,
  canonicalMeaning: string,
  type: SemanticReconstructionCandidate["elements"][number]["type"] = "METHOD",
) => {
  const candidate = comparisonCandidate();
  candidate.elements[1] = {
    ...candidate.elements[1],
    type,
    canonicalMeaning,
    sourceText,
    studyRole: "MEASUREMENT",
    inventoryItemIds: ["i-ct"],
  };
  candidate.elements[2] = {
    ...candidate.elements[2],
    type: "OUTCOME",
    canonicalMeaning: "functional recovery",
    sourceText: "récupération fonctionnelle",
    studyRole: "OUTCOME_ROLE",
    inventoryItemIds: ["i-mri"],
  };
  candidate.semanticInventory.explicitFragments[1] = {
    ...candidate.semanticInventory.explicitFragments[1],
    sourceText,
    normalizedLabel: canonicalMeaning,
    localRole: "candidate predictor",
  };
  candidate.semanticInventory.explicitFragments[2] = {
    ...candidate.semanticInventory.explicitFragments[2],
    sourceText: "récupération fonctionnelle",
    normalizedLabel: "functional recovery",
    localRole: "outcome",
  };
  candidate.semanticInventory.explicitRelations = [{
    inventoryRelationId: "ir-predicts",
    sourceInventoryItemId: "i-ct",
    targetInventoryItemId: "i-mri",
    sourceMessageId: "user-1",
    sourceText: `${sourceText} prédit la récupération fonctionnelle`,
    normalizedRelation: "PREDICTS_CANDIDATE",
    polarity: "AFFIRMED",
  }];
  candidate.relations = [{
    ...candidate.relations[0],
    clientRelationId: "r-predicts",
    sourceClientElementId: "e-ct",
    targetClientElementId: "e-mri",
    relationType: "PREDICTS_CANDIDATE",
    inventoryRelationIds: ["ir-predicts"],
  }];
  return candidate;
};

const requestFor = (sourceText: string) => makeSemanticRequest([{
  messageId: "user-1",
  role: "USER",
  content: `${sourceText} prédit la récupération fonctionnelle`,
  createdAt: "2026-08-12T10:00:00.000Z",
}]);

const finding = (sourceText: string, canonicalMeaning: string) => {
  const candidate = predictiveCandidate(sourceText, canonicalMeaning);
  return buildSemanticTaxonomyReport(requestFor(sourceText), candidate).findings.find((item) => item.clientElementId === "e-ct");
};

describe("SEM-001R4B method versus quantitative-observable context", () => {
  it.each([
    ["cartographie paramétrique", "parametric mapping technique"],
    ["calcul du coefficient", "coefficient computation"],
    ["suivi de caractéristiques", "feature tracking"],
  ])("keeps an explicitly named production technique as METHOD: %s", (literal, meaning) => {
    expect(finding(literal, meaning)).toBeUndefined();
  });

  it.each([
    ["déformation myocardique", "myocardial deformation"],
    ["coefficient de diffusion", "diffusion coefficient"],
    ["fraction de perfusion", "perfusion fraction"],
  ])("reclassifies a quantitative observable used as predictor from METHOD to BIOMARKER: %s", (literal, meaning) => {
    expect(finding(literal, meaning)).toMatchObject({
      code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD",
      currentType: "METHOD",
      expectedType: "BIOMARKER",
      expectedStudyRole: "MEASUREMENT",
    });
  });

  it("keeps method and explicitly named result as two distinct objects", () => {
    const candidate = predictiveCandidate("analyse de déformation", "deformation analysis");
    candidate.elements.push({
      ...candidate.elements[1],
      clientElementId: "e-result",
      type: "BIOMARKER",
      canonicalMeaning: "deformation index",
      sourceText: "indice de déformation",
      inventoryItemIds: ["i-result"],
    });
    candidate.semanticInventory.explicitFragments.push({
      inventoryItemId: "i-result",
      sourceMessageId: "user-1",
      sourceText: "indice de déformation",
      normalizedLabel: "deformation index",
      localRole: "quantitative result",
      polarity: "AFFIRMED",
      modifiers: [],
      linkedInventoryItemIds: ["i-ct"],
    });
    expect(candidate.elements.filter((item) => ["METHOD", "BIOMARKER"].includes(item.type))).toEqual(expect.arrayContaining([
      expect.objectContaining({ clientElementId: "e-ct", type: "METHOD" }),
      expect.objectContaining({ clientElementId: "e-result", type: "BIOMARKER" }),
    ]));
  });

  it("does not turn a result used as predictor into METHOD", () => {
    const candidate = predictiveCandidate("indice fonctionnel", "functional index", "BIOMARKER");
    expect(buildSemanticTaxonomyReport(requestFor("indice fonctionnel"), candidate).findings.find((item) => item.clientElementId === "e-ct")).toBeUndefined();
  });

  it("preserves an existing ambiguity when relational context is insufficient", () => {
    const candidate = comparisonCandidate();
    candidate.elements[1] = { ...candidate.elements[1], type: "METHOD", canonicalMeaning: "unresolved signal", sourceText: "signal" };
    candidate.relations = [];
    candidate.ambiguities = ["Le terme signal ne précise ni méthode ni quantité."];
    const preserved = preserveContextualMeasurementAmbiguities(makeSemanticRequest(), candidate);
    expect(preserved.ambiguities).toContain("Le terme signal ne précise ni méthode ni quantité.");
    expect(buildSemanticTaxonomyReport(makeSemanticRequest(), preserved).findings.find((item) => item.clientElementId === "e-ct")).toBeUndefined();
  });

  it("adds an ambiguity instead of inventing the unnamed output of a predictive method", () => {
    const candidate = predictiveCandidate("cartographie paramétrique", "parametric mapping technique");
    const preserved = preserveContextualMeasurementAmbiguities(requestFor("cartographie paramétrique"), candidate);
    expect(preserved.elements).toHaveLength(candidate.elements.length);
    expect(preserved.elements.some((item) => item.type === "BIOMARKER")).toBe(false);
    expect(preserved.ambiguities).toEqual(expect.arrayContaining([expect.stringContaining("n'est pas explicitement nommée")]));
  });

  it("preserves source grounding, relations and epistemic status during contextual ambiguity preservation", () => {
    const candidate = predictiveCandidate("quantification paramétrique", "parametric quantification method");
    const preserved = preserveContextualMeasurementAmbiguities(requestFor("quantification paramétrique"), candidate);
    expect(preserved.elements).toEqual(candidate.elements);
    expect(preserved.relations).toEqual(candidate.relations);
    expect(preserved.elements[1]).toMatchObject({
      sourceText: "quantification paramétrique",
      epistemicStatus: "EXPLICIT_USER_STATED",
      studyRole: "MEASUREMENT",
    });
  });
});
