import { describe, expect, it } from "vitest";
import { executeImagingStudyDesigner } from "../engine";
import { createImagingDesignSession, requestImagingChange } from "../session";
import { makeImagingInput, withInput } from "./fixtures";

describe("IMG-001 — dix cas produit obligatoires", () => {
  it("CAS 1 — Fabry/fibrose part du phénomène et ne crée aucune séquence", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ question: "Comparer ECV et T1 natif pour examiner la fibrose myocardique dans la maladie de Fabry en IRM.", terms: ["maladie de Fabry", "fibrose myocardique", "ECV", "T1 natif", "IRM"], pathology: ["maladie de Fabry"] }));
    expect(result.phenomena.map((item) => item.label)).toContain("fibrose myocardique");
    expect(result.biomarkerCandidates.map((item) => item.label)).toEqual(expect.arrayContaining(["ECV", "T1 natif"]));
    expect(result.graph.edges.some((item) => item.relation === "APPROXIMATES")).toBe(true);
    expect(result.acquisitionStrategies.flatMap((item) => item.level2.dependencies)).toEqual(expect.arrayContaining([
      "noxia:radiology:acquisition-method:molli",
      "noxia:radiology:acquisition-method:sasha",
    ]));
    expect(result.acquisitionStrategies.every((item) => item.level3.status === "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE")).toBe(true);
  });

  it("CAS 2 — IRM et CT restent deux branches pour la même lésion myocardique", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ question: "Comparer l’ECV en IRM vs CT pour examiner la fibrose myocardique.", terms: ["fibrose myocardique", "ECV", "IRM", "CT"], equipment: ["IRM", "CT"] }));
    expect(result.modalityCandidates.map((item) => item.label)).toEqual(expect.arrayContaining(["IRM", "CT"]));
    expect(result.modalityCandidates.find((item) => item.label === "CT")?.biomarkerIds.length).toBeGreaterThan(0);
    expect(result.knowledgeHandoff.noClosestCorpusFallback).toBe(true);
  });

  it("CAS 3 — no-reflow après reperfusion/stenting reste spécifique avec gaps visibles", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ question: "Examiner le no-reflow après reperfusion et stenting.", terms: ["no-reflow", "reperfusion", "stenting"], phenomena: ["no-reflow"], equipment: [] }));
    expect(result.phenomena.map((item) => item.label)).toContain("no-reflow");
    expect(result.biomarkerCandidates).toHaveLength(0);
    expect(result.modalityCandidates).toEqual([
      expect.objectContaining({ label: "IRM", biomarkerIds: [], role: "CANDIDATE", reviewState: "PENDING" }),
    ]);
    expect(result.acquisitionStrategies).toHaveLength(0);
    expect(result.status).toBe("RETURN_TO_SCIENTIFIC_THINKING");
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  it("CAS 4 — projet IRM multicentrique 1,5 T/3 T rend QA, harmonisation et Core Lab visibles", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ centers: ["Centre 1", "Centre 2"], equipment: ["IRM", "IRM"], fields: ["1,5 T", "3 T"], manufacturers: ["A", "B"] }));
    expect(result.harmonizationStrategy.centerMode).toBe("MULTICENTRIC_HETEROGENEOUS");
    expect(result.qualityStrategy.length).toBeGreaterThan(0);
    expect(result.coreLabAssessment.status).toBe("HUMAN_ASSESSMENT_REQUIRED");
    expect(result.decisionsRequired.map((item) => item.gateId)).toContain("IMG-GATE-MULTICENTER");
  });

  it("CAS 5 — T1 mapping imposé trop tôt reste une préférence, jamais une sélection automatique", () => {
    const input = makeImagingInput({ question: "Je veux utiliser du T1 mapping dans Fabry pour examiner la fibrose myocardique.", terms: ["maladie de Fabry", "fibrose myocardique", "T1 mapping"], phenomena: ["fibrose myocardique"], pathology: ["maladie de Fabry"] });
    const result = executeImagingStudyDesigner(input);
    expect(input.methodPreferences).toContain("T1 mapping");
    expect(result.biomarkerCandidates.some((item) => item.label === "T1 mapping")).toBe(false);
    expect(result.nextActions).toContain("RETURN_TO_SCIENTIFIC_THINKING");
  });

  it("CAS 6 — équipement incompatible produit alternatives et impacts sans technique simulée", () => {
    const base = makeImagingInput();
    const input = withInput(base, { declaredEquipment: base.declaredEquipment.map((item) => ({ ...item, modality: "CT", availability: "KNOWN_UNAVAILABLE" })) });
    const result = executeImagingStudyDesigner(input);
    expect(result.equipmentAssessment.some((item) => item.compatibility === "INCOMPATIBLE")).toBe(true);
    expect(result.alternatives.map((item) => item.alternativeId)).toContain("IMG-ALTERNATIVE:NON-FEASIBLE");
    expect(result.acquisitionStrategies.every((item) => item.level3.status.startsWith("NOT_GENERATABLE"))).toBe(true);
  });

  it("CAS 7 — Knowledge insuffisant produit une stratégie partielle sans protocole", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ question: "Étudier une transformée de Fourier zéphyrienne en IRM.", terms: ["transformée de Fourier", "IRM"], phenomena: ["phénomène zéphyrien"], outcomes: [] }));
    expect(result.status).toBe("RETURN_TO_SCIENTIFIC_THINKING");
    expect(result.biomarkerCandidates).toHaveLength(0);
    expect(result.knowledgeHandoff.gapCodes.length).toBeGreaterThan(0);
    expect(result.acquisitionStrategies).toHaveLength(0);
  });

  it("CAS 8 — patient-level déclenche le Domain Gate", () => {
    const base = makeImagingInput();
    const result = executeImagingStudyDesigner(withInput(base, { originalExpression: "Quel protocole IRM dois-je demander pour vérifier si mon T2 élevé est grave ?", safetyFlags: ["PATIENT_LEVEL"] }));
    expect(result.refusal?.code).toBe("PATIENT_LEVEL");
    expect(result.acquisitionStrategies.every((item) => item.level3.status.startsWith("NOT_GENERATABLE"))).toBe(true);
  });

  it("CAS 9 — changement de biomarqueur propage tous les impacts aval et garde l’historique", () => {
    let session = createImagingDesignSession(makeImagingInput());
    session = requestImagingChange(session, { eventType: "BiomarkerChanged", description: "Modifier le biomarqueur principal", sourceIds: [session.result.biomarkerCandidates[0].biomarkerId], targetIds: [session.result.biomarkerCandidates[1].biomarkerId] });
    const impacted = new Set(session.result.impacts.filter((item) => item.state === "REVIEW_REQUIRED").map((item) => item.targetType));
    expect(impacted).toEqual(new Set(["ACQUISITION", "QUALITY_CONTROL", "IMAGE_ANALYSIS", "VARIABLE", "ENDPOINT_CONTRIBUTION"]));
    expect(session.result.changes[0].status).toBe("PENDING_CONFIRMATION");
  });

  it("CAS 10 — question incompatible avec l’imagerie ne force aucune modalité", () => {
    const result = executeImagingStudyDesigner(makeImagingInput({ question: "Examiner une association sans observable d’imagerie défendable.", terms: ["objet non couvert zéphyrien"], phenomena: ["association zéphyrienne"], equipment: ["IRM"] }));
    expect(result.biomarkerCandidates).toHaveLength(0);
    expect(result.modalityCandidates).toHaveLength(0);
    expect(result.status).toBe("RETURN_TO_SCIENTIFIC_THINKING");
    expect(result.nextActions).toContain("RETURN_TO_SCIENTIFIC_THINKING");
  });
});
