import { describe, expect, it } from "vitest";
import { executeImagingStudyDesigner } from "../engine";
import { makeImagingInput, withInput } from "./fixtures";

describe("IMG-001 — équipement, harmonisation, timing, QA et non-évaluabilité", () => {
  it("conserve la réalité équipement et ne suppose jamais une compatibilité", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ equipment: ["IRM"], manufacturers: ["Constructeur déclaré"], models: ["Modèle déclaré"] }));
    expect(result.equipmentAssessment.length).toBeGreaterThan(0);
    expect(result.equipmentAssessment.every((item) => item.assumptionForbidden)).toBe(true);
    expect(result.equipmentAssessment.map((item) => item.compatibility)).toContain("UNKNOWN_COMPATIBILITY");
  });

  it("rend une incompatibilité explicite et ne simule pas une technique absente", () => {
    const input = makeImagingInput();
    const incompatible = withInput(input, { declaredEquipment: input.declaredEquipment.map((item) => ({ ...item, modality: "CT", availability: "KNOWN_UNAVAILABLE" })) });
    const result = executeImagingStudyDesigner(incompatible);
    expect(result.equipmentAssessment.some((item) => item.compatibility === "INCOMPATIBLE")).toBe(true);
    expect(result.alternatives).toContainEqual(expect.objectContaining({ alternativeId: "IMG-ALTERNATIVE:NON-FEASIBLE" }));
  });

  it("construit une harmonisation multicentrique sans masquer l’hétérogénéité", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ centers: ["Centre A", "Centre B"], equipment: ["IRM", "IRM"], fields: ["1,5 T", "3 T"], manufacturers: ["A", "B"] }));
    expect(result.harmonizationStrategy.centerMode).toBe("MULTICENTRIC_HETEROGENEOUS");
    expect(result.harmonizationStrategy.variantsToQualify.length).toBeGreaterThan(0);
    expect(result.harmonizationStrategy.commonCore).toContain("Traçabilité des versions");
  });

  it("garde le timing inconnu tant qu’il n’est pas justifié", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ timings: [] }));
    expect(result.timingStrategy).toContainEqual(expect.objectContaining({ type: "UNKNOWN_TIMING", support: "UNKNOWN" }));
    expect(result.graph.brokenChains.some((item) => item.code === "UNJUSTIFIED_CRITICAL_TIMING")).toBe(true);
  });

  it("préserve un timing imposé sans le rebaptiser timing biologique", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ timings: ["visite de suivi imposée"] }));
    expect(result.timingStrategy[0]).toMatchObject({ type: "IMPOSED_TIMING", support: "UNKNOWN" });
    expect(result.timingStrategy[0].justification).toMatch(/déclarée|déclaré/i);
  });

  it("conçoit la QA avant l’acquisition sans seuil numérique", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.qualityStrategy.length).toBe(result.acquisitionStrategies.length * 3);
    expect(result.qualityStrategy.some((item) => item.timing === "BEFORE_ACQUISITION")).toBe(true);
    expect(JSON.stringify(result.qualityStrategy)).not.toMatch(/(?:seuil|cut.?off)\s*[:=]?\s*\d/i);
  });

  it("distingue explicitement donnée manquante et résultat biologiquement négatif", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    const states = new Set(result.nonEvaluabilityRules.map((item) => item.state));
    expect(states).toEqual(new Set(["MISSING", "NOT_ACQUIRED", "INCOMPLETE", "TECHNICALLY_INVALID", "QA_REJECTED", "ANALYZABLE_WITH_LIMITATIONS", "BIOLOGICALLY_NEGATIVE"]));
    expect(result.nonEvaluabilityRules.find((item) => item.state === "BIOLOGICALLY_NEGATIVE")?.cause).toMatch(/acquis|évaluable/i);
  });
});
