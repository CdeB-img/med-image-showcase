import { describe, expect, it } from "vitest";
import { semanticMeaningMatches } from "../competence";
import { buildSemanticTaxonomyReport } from "../coverage";
import { comparisonCandidate, makeSemanticRequest } from "./fixtures";

const studiedTargetCandidate = (literal: string, canonicalMeaning: string, localRole: string, studyRole: "SUBJECT" | "MEASUREMENT" = "SUBJECT") => {
  const candidate = comparisonCandidate();
  candidate.elements[0] = {
    ...candidate.elements[0],
    type: "SCIENTIFIC_INTENT",
    canonicalMeaning: "describe",
    sourceText: "décrire",
    inventoryItemIds: ["i-operation"],
  };
  candidate.elements[1] = {
    ...candidate.elements[1],
    type: "BIOMARKER",
    canonicalMeaning,
    sourceText: literal,
    studyRole,
    inventoryItemIds: ["i-ct"],
  };
  candidate.semanticInventory.explicitFragments[0] = {
    ...candidate.semanticInventory.explicitFragments[0],
    sourceText: "décrire",
    normalizedLabel: "describe",
    localRole: "scientific action",
  };
  candidate.semanticInventory.explicitFragments[1] = {
    ...candidate.semanticInventory.explicitFragments[1],
    sourceText: literal,
    normalizedLabel: canonicalMeaning,
    localRole,
  };
  candidate.semanticInventory.explicitRelations = [{
    inventoryRelationId: "ir-observe",
    sourceInventoryItemId: "i-operation",
    targetInventoryItemId: "i-ct",
    sourceMessageId: "user-1",
    sourceText: `décrire ${literal}`,
    normalizedRelation: "AIMS_TO_OBSERVE",
    polarity: "AFFIRMED",
  }];
  candidate.relations = [{
    ...candidate.relations[0],
    clientRelationId: "r-observe",
    sourceClientElementId: "e-operation",
    targetClientElementId: "e-ct",
    relationType: "AIMS_TO_OBSERVE",
    inventoryRelationIds: ["ir-observe"],
  }];
  return candidate;
};

const findingFor = (literal: string, canonicalMeaning: string, localRole: string, studyRole: "SUBJECT" | "MEASUREMENT" = "SUBJECT") => {
  const candidate = studiedTargetCandidate(literal, canonicalMeaning, localRole, studyRole);
  const request = makeSemanticRequest([{
    messageId: "user-1",
    role: "USER",
    content: `décrire ${literal}`,
    createdAt: "2026-08-12T10:00:00.000Z",
  }]);
  return buildSemanticTaxonomyReport(request, candidate).findings.find((item) => item.clientElementId === "e-ct");
};

describe("SEM-001R4B generic exclusion and studied-target equivalence", () => {
  it.each([
    ["le seuil n'est pas mon critère", "seuil exclu comme critère"],
    ["la mortalité n'est pas mon endpoint", "mortalité exclue comme endpoint"],
    ["l'histologie ne sera pas notre référence", "exclusion de l'histologie comme référence"],
    ["ce score n'est pas mon outcome", "score exclu en tant qu'outcome"],
  ])("recognizes equivalent explicit exclusion formulations: %s", (observed, expected) => {
    expect(semanticMeaningMatches(observed, expected)).toBe(true);
  });

  it("does not collapse exclusions that concern different scientific objects", () => {
    expect(semanticMeaningMatches("la mortalité n'est pas mon endpoint", "perfusion exclue comme endpoint")).toBe(false);
  });

  it.each([
    ["distribution tissulaire", "tissue distribution", "objet d'étude"],
    ["hétérogénéité tumorale", "tumour heterogeneity", "scientific target"],
    ["dynamique respiratoire", "respiratory dynamics", "subject"],
  ])("reclassifies an unquantified studied target from BIOMARKER to SCIENTIFIC_OBJECT: %s", (literal, meaning, localRole) => {
    expect(findingFor(literal, meaning, localRole)).toMatchObject({
      code: "TARGET_TYPED_AS_BIOMARKER",
      currentType: "BIOMARKER",
      expectedType: "SCIENTIFIC_OBJECT",
    });
  });

  it.each([
    ["volume tissulaire", "tissue volume"],
    ["indice tumoral", "tumour index"],
    ["T2*", "T2 star parameter"],
  ])("keeps an explicitly quantitative observable as BIOMARKER: %s", (literal, meaning) => {
    expect(findingFor(literal, meaning, "quantitative result", "MEASUREMENT")).toBeUndefined();
  });
});
