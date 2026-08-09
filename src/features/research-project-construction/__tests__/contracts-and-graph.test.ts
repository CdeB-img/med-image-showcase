import { describe, expect, it } from "vitest";
import { executeResearchProjectConstruction } from "../engine";
import { questionRequiresImaging } from "../input";
import { makeProjectInput } from "./fixtures";
import { makeImagingIntent } from "@/features/imaging-study-designer/__tests__/fixtures";

describe("PRJ-001 — contrats de construction et Project Graph", () => {
  it("conserve la Question comme racine et relie chaque couche structurante", () => {
    const result = executeResearchProjectConstruction(makeProjectInput());
    const types = new Set(result.impactGraph.nodes.map((item) => item.type));
    ["QUESTION", "OBJECTIVE", "HYPOTHESIS", "POPULATION", "STUDY_DESIGN", "GROUP", "VISIT", "MEASUREMENT", "VARIABLE", "ENDPOINT", "ANALYSIS_REQUIREMENT"].forEach((type) => expect(types.has(type)).toBe(true));
    expect(result.impactGraph.nodes.filter((item) => item.type === "QUESTION")).toHaveLength(1);
    expect(result.impactGraph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ relation: "DEFINES" }),
      expect.objectContaining({ relation: "TESTS" }),
      expect.objectContaining({ relation: "CONSTRAINS" }),
      expect.objectContaining({ relation: "SHAPES" }),
      expect.objectContaining({ relation: "ORGANIZES" }),
      expect.objectContaining({ relation: "OBSERVED_AT" }),
      expect.objectContaining({ relation: "SCHEDULES" }),
      expect.objectContaining({ relation: "PRODUCES" }),
      expect.objectContaining({ relation: "CONTRIBUTES_TO" }),
      expect.objectContaining({ relation: "REQUIRES" }),
    ]));
    expect(result.impactGraph.nodes.every((item) => item.whyExists.length > 0)).toBe(true);
  });

  it("ne sélectionne aucun design, groupe sain, Critère principal ou modèle statistique", () => {
    const result = executeResearchProjectConstruction(makeProjectInput());
    expect(result.selectedStudyDesignCandidate).toBeNull();
    expect(result.studyDesignCandidates.every((item) => item.whyItAnswersQuestion && item.reviewState === "PENDING")).toBe(true);
    expect(result.groups.some((item) => /healthy|sain|témoin sain/i.test(item.label))).toBe(false);
    expect(result.groups.every((item) => item.justification.length > 0)).toBe(true);
    expect(result.visits.every((item) => item.justification.length > 0 && item.label !== "T0" && item.label !== "T1" && item.label !== "T2")).toBe(true);
    expect(result.endpointCandidates.every((item) => item.proposedRole === "UNDECIDED_CANDIDATE" && item.humanDecisionRequired)).toBe(true);
    expect(result.variables.every((item) => item.finalDataDictionaryName === null)).toBe(true);
    expect(result.analysisRequirements.every((item) => item.finalStatisticalModel === null && item.biostatisticsReviewRequired)).toBe(true);
  });

  it("n’invente aucune valeur statistique, prévalence, taille, centre, durée ou risque numérique", () => {
    const result = executeResearchProjectConstruction(makeProjectInput());
    expect(result.sizingRequirements.sampleSize).toBeNull();
    expect(result.sizingRequirements.power).toBeNull();
    expect(result.sizingRequirements.inputs.every((item) => item.value === null && item.source === "UNKNOWN")).toBe(true);
    expect(result.recruitmentModelRequirements.centerCount).toBeNull();
    expect(result.recruitmentModelRequirements.recruitmentRate).toBeNull();
    expect(result.recruitmentModelRequirements.recruitmentDuration).toBeNull();
    expect(result.multicenterAssessment.centerCount).toBeNull();
    expect(result.risks.every((item) => item.probability === null)).toBe(true);
  });

  it("qualifie séparément les moteurs futurs et interdit un score global", () => {
    const result = executeResearchProjectConstruction(makeProjectInput());
    const future = result.feasibilityAssessment.filter((item) => ["DATA_FEASIBILITY", "STATISTICAL_FEASIBILITY", "OPERATIONAL_FEASIBILITY", "REGULATORY_FEASIBILITY", "ECONOMIC_FEASIBILITY", "SAFETY_FEASIBILITY"].includes(item.domain));
    expect(future.every((item) => item.state === "NOT_EVALUATED_BY_SPECIALIZED_ENGINE")).toBe(true);
    expect("globalReadinessScore" in result).toBe(false);
    expect(result.economicsQuestions).toContainEqual(expect.objectContaining({ status: "FUNDING_STRATEGY_REQUIRES_SPECIALIZED_REVIEW" }));
    expect(result.provenance.llmContributionStatus).toBe("NO_LLM_SCIENTIFIC_DECISION");
  });

  it("publie exactement les quatorze familles de projection sans céder la vérité du projet", () => {
    const result = executeResearchProjectConstruction(makeProjectInput());
    expect(result.projectionReadiness.map((item) => item.projection)).toEqual(["Protocol", "Synopsis", "Funding", "Publication", "CRF", "Data Dictionary", "SAP", "Budget", "Timeline", "CPP", "ANSM", "Core Lab Manual", "Monitoring Plan", "Investigator Guide"]);
    expect(result.projectionReadiness.every((item) => item.notice === "DATA_AVAILABILITY_ONLY_NOT_APPROVAL")).toBe(true);
    expect(result.projectionNotice).toBe("RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH");
    expect(result.documentHandoff.boundary).toBe("NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS");
  });

  it("est strictement déterministe à entrées et contrôles identiques", () => {
    const input = makeProjectInput();
    const first = executeResearchProjectConstruction(input);
    const second = executeResearchProjectConstruction(input);
    expect(second).toEqual(first);
    expect(second.resultDigest).toBe(first.resultDigest);
  });

  it("respecte une exclusion explicite de l’imagerie sans effacer une modalité spécifique", () => {
    const without = makeImagingIntent({ question: "Construire une étude sans composante d’imagerie.", equipment: [] }).intent;
    const specific = makeImagingIntent({ question: "Construire une étude en IRM, sans autre composante d’imagerie.", equipment: [] }).intent;
    expect(questionRequiresImaging(without)).toBe(false);
    expect(questionRequiresImaging(specific)).toBe(true);
  });
});
