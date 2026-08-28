import { describe, expect, it } from "vitest";
import { RC_TEST_02_REFERENCE_IDS } from "@/features/imaging-study-designer/__tests__/governed-reference-fixtures";
import { executeResearchProjectConstruction } from "../engine";
import { makeProjectInput, readGovernedImagingReferenceResult } from "./fixtures";

describe("PRJ-001 — dix cas obligatoires", () => {
  it("1. construit un candidat Fabry longitudinal avec handoff IMG gelé sans calcul de puissance", () => {
    const imaging = readGovernedImagingReferenceResult(RC_TEST_02_REFERENCE_IDS.fabryLongitudinalEcv);
    const result = executeResearchProjectConstruction(makeProjectInput({
      question: "Chez les adultes atteints de maladie de Fabry, comment l’ECV évolue-t-il longitudinalement en IRM cardiaque ?",
      outcomes: ["évolution longitudinale de l’ECV"],
      imagingResult: imaging,
      imagingStatus: "FROZEN_BY_HUMAN",
      timings: ["mesure initiale", "suivi à définir scientifiquement"],
    }));
    expect(result.imagingContribution.applicability).toBe("APPLICABLE");
    expect(result.studyDesignCandidates).toContainEqual(expect.objectContaining({ family: "PROSPECTIVE_LONGITUDINAL_COHORT" }));
    expect(result.visits.map((item) => item.temporalRole)).toEqual(["BASELINE", "FOLLOW_UP"]);
    expect(result.sizingRequirements.power).toBeNull();
    ["IMAGING", "BIOMARKER", "ACQUISITION", "VARIABLE"].forEach((type) => expect(result.impactGraph.nodes.some((item) => item.type === type)).toBe(true));
    expect(imaging.limitations).toContain("ECV_IS_NOT_COLLAGEN_PERCENTAGE");
    expect(imaging.limitations).toContain("ECV_IS_NOT_A_UNIVERSAL_FABRY_BIOMARKER_ROLE");
    expect(imaging.projectConstructionHandoff.executableProtocolReadiness).toBe("EXECUTABLE_PROTOCOL_NOT_READY");
    expect(imaging.projectConstructionHandoff.unknowns).toContain("LONGITUDINAL_COMPARABILITY_NOT_VALIDATED");
    expect(JSON.stringify(imaging)).toContain("NOT_INTERPRETABLE_AS_PROGRESS_OR_REGRESSION");
    expect(JSON.stringify(imaging)).toContain("SYNTHETIC_HAEMATOCRIT_NOT_AUTHORIZED_BY_THIS_REFERENCE");
  });

  it("2. construit une validation méthodologique comparative sans méthode automatiquement supérieure", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({
      question: "Valider la concordance et la répétabilité de deux méthodes de mesure A et B.",
      outcomes: ["accord entre mesures"], methods: ["méthode A", "méthode B"],
    }));
    expect(result.studyDesignCandidates).toContainEqual(expect.objectContaining({ family: "METHODOLOGICAL_VALIDATION" }));
    expect(result.analysisRequirements.map((item) => item.purpose)).toEqual(expect.arrayContaining(["AGREEMENT", "VALIDATION"]));
    expect(result.groups.filter((item) => item.role === "METHOD")).toHaveLength(2);
    expect(result.selectedStudyDesignCandidate).toBeNull();
  });

  it("3. sépare une mesure pronostique initiale d’un événement futur", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({
      question: "Une mesure initiale prédit-elle un événement futur chez les patients suivis ?",
      outcomes: ["survenue de l’événement futur"], assertions: ["La sévérité initiale est un facteur pronostique plausible."],
    }));
    expect(result.studyDesignCandidates).toContainEqual(expect.objectContaining({ family: "PROSPECTIVE_PROGNOSTIC_COHORT" }));
    expect(result.visits.map((item) => item.temporalRole)).toEqual(["BASELINE", "EVENT"]);
    expect(result.analysisRequirements.map((item) => item.purpose)).toEqual(expect.arrayContaining(["PREDICTION", "TIME_TO_EVENT", "ADJUSTMENT"]));
    expect(result.confounders).toContainEqual(expect.objectContaining({ label: "Sévérité initiale de la condition", knowledgeSupport: "SUPPORTED" }));
  });

  it("4. conserve les alternatives mono et multicentrique pour une Population rare sans nombre arbitraire", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({
      question: "Étudier longitudinalement une maladie rare avec un recrutement potentiellement multicentrique.",
      population: ["adultes atteints d’une maladie rare"], pathology: ["maladie rare"], outcomes: ["évolution clinique"],
    }));
    expect(result.recruitmentModelRequirements.raritySignal).toBe("PRESENT");
    expect(result.risks).toContainEqual(expect.objectContaining({ source: "Rareté déclarée de la Population", probability: null }));
    expect(result.multicenterAssessment.monocenterAlternativePreserved).toBe(true);
    expect(result.multicenterAssessment.centerCount).toBeNull();
    expect(result.adaptiveQuestions).toContainEqual(expect.objectContaining({ questionId: "PRJ-Q-RECRUITMENT" }));
  });

  it("5. propage la variabilité d’une étude multicentrique vers QA, Data et Biostatistics", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({
      question: "Comparer un marqueur dans une étude multicentrique avec variabilité des équipements.",
      centers: ["Centre A", "Centre B"], constraints: ["équipements hétérogènes"], outcomes: ["marqueur quantitatif"],
    }));
    expect(result.biases).toContainEqual(expect.objectContaining({ label: "Effet centre" }));
    expect(result.analysisRequirements).toContainEqual(expect.objectContaining({ purpose: "CENTER_EFFECT" }));
    expect(result.biostatisticsRequirements.multicenterStructure).toBe("MULTICENTRIC_DECLARED");
    expect(result.dataManagementRequirements.length).toBeGreaterThan(0);
  });

  it("6. produit un plan simple minimal suffisant avec une seule évaluation justifiée", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({ question: "Décrire la distribution d’un marqueur chez une Population définie.", outcomes: ["distribution du marqueur"] }));
    expect(result.studyDesignCandidates.map((item) => item.family)).toEqual(["CROSS_SECTIONAL_OBSERVATIONAL"]);
    expect(result.visits).toHaveLength(1);
    expect(result.visits[0].temporalRole).toBe("SINGLE_ASSESSMENT");
  });

  it("7. refuse de masquer une Imaging requise mais non gelée et indique le retour IMG/ST", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({ imagingStatus: "REQUIRED_BUT_NOT_READY" }));
    expect(result.status).toBe("REFUSED");
    expect(result.refusal).toEqual(expect.objectContaining({ code: "IMAGING_HANDOFF_NOT_READY" }));
    expect(result.refusal?.resumeCondition).toMatch(/IMG-001/);
  });

  it("8. le changement de Critère atteint Variables, Visits, Imaging, analyses, sizing, Data et projections", async () => {
    const { createResearchProjectConstructionSession, requestProjectChange } = await import("../session");
    let session = createResearchProjectConstructionSession(makeProjectInput());
    const endpoint = session.result.endpointCandidates[0];
    session = requestProjectChange(session, { eventType: "EndpointChanged", description: "Le Critère principal candidat change.", sourceIds: [endpoint.endpointId], targetIds: [endpoint.endpointId] });
    const states = new Map(session.result.impactGraph.impacts.map((item) => [item.targetType, item.state]));
    expect(states.get("ENDPOINT")).toBe("INVALIDATED");
    expect(states.get("VARIABLE")).toBe("REVIEW_REQUIRED");
    expect(states.get("VISIT")).toBe("REVIEW_REQUIRED");
    expect(states.get("IMAGING")).toBe("REVIEW_REQUIRED");
    expect(states.get("ANALYSIS_REQUIREMENT")).toBe("INVALIDATED");
    expect(states.get("SIZING")).toBe("NEWLY_REQUIRED");
    expect(states.get("DATA")).toBe("REVIEW_REQUIRED");
    expect(states.get("PROJECTION")).toBe("OBSOLETE");
  });

  it("9. prend en charge un projet sans imagerie et marque IMG NOT_APPLICABLE", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({ imagingStatus: "NOT_APPLICABLE" }));
    expect(result.imagingContribution).toEqual(expect.objectContaining({ applicability: "NOT_APPLICABLE", resultRef: null, variableIds: [] }));
    expect(result.feasibilityAssessment).toContainEqual(expect.objectContaining({ domain: "TECHNICAL_FEASIBILITY", state: "NOT_APPLICABLE" }));
  });

  it("10. conserve une entrée insuffisante comme projet partiel, questions et inconnues", () => {
    const result = executeResearchProjectConstruction(makeProjectInput({ population: [], pathology: [], outcomes: [], objectives: false, hypotheses: false, uncertainties: ["Population inconnue", "Outcome inconnu"] }));
    expect(result.status).toBe("PARTIAL_PROJECT");
    expect(result.endpointCandidates).toHaveLength(0);
    expect(result.missingInformation.length).toBeGreaterThan(0);
    expect(result.adaptiveQuestions.map((item) => item.questionId)).toEqual(expect.arrayContaining(["PRJ-Q-POPULATION", "PRJ-Q-OUTCOME"]));
    expect(result.populationDesign.populationConcept.conditionOrPathology).toEqual([]);
  });
});
