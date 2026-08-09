import { describe, expect, it } from "vitest";
import { executeImagingStudyDesigner } from "../engine";
import { makeImagingInput } from "./fixtures";

describe("IMG-001 — chaîne phénomène, biomarqueur, modalité et acquisition", () => {
  it("mappe les phénomènes depuis objectifs/hypothèses avant tout biomarqueur", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.phenomena).toContainEqual(expect.objectContaining({ label: "fibrose myocardique", observability: "INDIRECT_ONLY" }));
    expect(result.phenomena[0].objectiveIds.length).toBeGreaterThan(0);
    expect(result.graph.edges.some((item) => item.relation === "IMPLICATES")).toBe(true);
  });

  it("sélectionne uniquement les biomarqueurs gouvernés et contextualisés", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.biomarkerCandidates.map((item) => item.label)).toEqual(expect.arrayContaining(["ECV", "T1 natif"]));
    expect(result.biomarkerCandidates.every((item) => item.phenomenonIds.length > 0 && item.evidenceRefs.length > 0)).toBe(true);
    expect(result.biomarkerCandidates.some((item) => /MOLLI|SASHA/.test(item.label))).toBe(false);
  });

  it("compare les biomarqueurs uniquement avec des dimensions supportées ou UNKNOWN", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.biomarkerComparison).toHaveLength(1);
    expect(result.biomarkerComparison[0].notice).toBe("NO_AUTOMATIC_RANKING");
    const allowed = new Set(["SUPPORTED", "PARTIALLY_SUPPORTED", "UNKNOWN", "NOT_APPLICABLE", "CONFLICTING"]);
    expect(Object.values(result.biomarkerComparison[0].dimensions).flatMap((item) => Object.values(item)).every((value) => allowed.has(value))).toBe(true);
  });

  it("ne crée une modalité qu’après un besoin de biomarqueur", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.modalityCandidates.length).toBeGreaterThan(0);
    expect(result.modalityCandidates.every((item) => item.biomarkerIds.length > 0)).toBe(true);
    expect(result.graph.edges.find((item) => item.to === result.modalityCandidates[0].modalityId)?.relation).toBe("REQUIRES");
    expect(result.modalityCandidates.map((item) => item.label)).not.toContain("noxia:radiology:modality:irm");
    expect(new Set(result.modalityCandidates.map((item) => item.label)).size).toBe(result.modalityCandidates.length);
  });

  it("compare les modalités sans sécurité ni coût inventés", () => {
    const input = makeImagingInput({ question: "Comparer l’ECV en IRM vs CT pour examiner la fibrose myocardique.", terms: ["fibrose myocardique", "ECV", "IRM", "CT"], equipment: ["IRM", "CT"] });
    const result = executeImagingStudyDesigner(input);
    expect(result.modalityCandidates.map((item) => item.label)).toEqual(expect.arrayContaining(["IRM", "CT"]));
    expect(result.modalityComparison[0].notice).toBe("NO_AUTOMATIC_RANKING");
    expect(JSON.stringify(result.modalityComparison)).not.toMatch(/co[uû]t|prix|s[uû]r|s[eé]curit[eé]/i);
  });

  it("construit les niveaux 1 et 2 sans paramètres exécutables", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.acquisitionStrategies.every((item) => item.level1.status === "CONCEPTUAL_STRATEGY" && item.level2.status === "METHODOLOGICAL_ACQUISITION_PLAN")).toBe(true);
    expect(result.acquisitionStrategies.every((item) => item.consequenceIfRemoved.length > 0)).toBe(true);
  });
});
