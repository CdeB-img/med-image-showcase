import { describe, expect, it } from "vitest";
import { executeImagingStudyDesigner } from "../engine";
import { decideImagingGate, createImagingDesignSession } from "../session";
import { makeImagingInput } from "./fixtures";

describe("IMG-001 — analyse d’image, Variables, Critères, Core Lab et alternatives", () => {
  it("sépare strictement stratégie d’analyse d’image et analyse statistique", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.imageAnalysisStrategy.every((item) => item.boundary === "NO_IMAGE_PROCESSING_NO_STATISTICAL_ANALYSIS")).toBe(true);
    expect(result.imageAnalysisStrategy.every((item) => item.operationNeeds.length > 0)).toBe(true);
    expect(JSON.stringify(result.imageAnalysisStrategy)).not.toMatch(/t-test|ANOVA|régression logistique|modèle de Cox/i);
  });

  it("relie chaque Variable à toute la chaîne Imaging et détecte les orphelines", () => {
    const result = executeImagingStudyDesigner(makeImagingInput());
    expect(result.imagingVariables.length).toBeGreaterThan(0);
    expect(result.imagingVariables.every((item) => item.questionId && item.objectiveIds.length && item.phenomenonIds.length && item.biomarkerIds.length && item.acquisitionIds.length && item.qualityRuleIds.length && item.analysisIds.length)).toBe(true);
    expect(result.graph.brokenChains.some((item) => item.code === "VARIABLE_WITHOUT_ACQUISITION")).toBe(false);
  });

  it("propose seulement une contribution de Critère indécise et laisse l’analyse statistique en aval", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ outcomes: ["caractérisation de la fibrose myocardique"] }));
    expect(result.endpointContributions.length).toBeGreaterThan(0);
    expect(result.endpointContributions.every((item) => item.proposedRole === "UNDECIDED_CANDIDATE" && item.statisticalAnalysisStillRequired && item.humanDecisionRequired)).toBe(true);
  });

  it("évalue le Core Lab sans option automatique optimale", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ centers: ["Centre A", "Centre B"], fields: ["1,5 T", "3 T"] }));
    expect(result.coreLabAssessment.notice).toBe("NO_AUTOMATIC_OPTIMUM");
    expect(result.coreLabAssessment.options).toEqual(["NO_CORE_LAB", "LOCAL_READING_WITH_STANDARDIZATION", "CENTRAL_QA", "CENTRAL_READING", "HYBRID"]);
    expect(result.decisionsRequired).toContainEqual(expect.objectContaining({ gateId: "IMG-GATE-CORE-LAB", status: "PENDING" }));
  });

  it("préserve plusieurs stratégies et leurs compromis sans les classer", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ question: "Comparer l’ECV en IRM vs CT pour examiner la fibrose myocardique.", terms: ["fibrose myocardique", "ECV", "IRM", "CT"], equipment: ["IRM", "CT"] }));
    expect(result.alternatives.length).toBeGreaterThanOrEqual(2);
    expect(result.alternatives.every((item) => item.reviewState === "PENDING" && item.decisionsToReopen.length > 0)).toBe(true);
    expect(result.modalityComparison[0].notice).toBe("NO_AUTOMATIC_RANKING");
  });

  it("prépare un handoff PRJ structuré mais ne le gèle jamais sans décisions humaines", () => {
    let session = createImagingDesignSession(makeImagingInput({ timings: ["temps défini par le protocole amont"] }));
    expect(session.result.projectConstructionHandoff.includedSections).toContain("Quality");
    expect(session.result.projectConstructionHandoff.excludedSections).toContain("STATISTICAL_SIZING");
    expect(session.result.projectConstructionHandoff.status).toBe("NOT_READY");
    const gate = session.result.decisionsRequired[0];
    session = decideImagingGate(session, gate.gateId, "APPROVED", "Décision humaine testée.", "2026-08-09T12:00:00.000Z");
    expect(session.decisionHistory).toHaveLength(1);
  });
});
