import { describe, expect, it } from "vitest";
import { executeResearchProjectConstruction } from "../engine";
import { createResearchProjectConstructionSession, decideProjectChange, decideProjectGate, proposeStudyDesign, requestProjectChange } from "../session";
import { parseResearchProjectConstructionInput, parseResearchProjectDesignResult, RESEARCH_PROJECT_CONSTRUCTION_VERSION } from "../types";
import { makeProjectInput } from "./fixtures";

const result = () => executeResearchProjectConstruction(makeProjectInput());

describe("PRJ-001 — domaines contractuels testés séparément", () => {
  it("ProjectConstructionInput", () => expect(parseResearchProjectConstructionInput(makeProjectInput()).contractVersion).toBe(RESEARCH_PROJECT_CONSTRUCTION_VERSION));
  it("ProjectDesignResult", () => expect(parseResearchProjectDesignResult(result()).resultId).toMatch(/^research-project-design-result:/));
  it("Population", () => expect(result().populationDesign).toMatchObject({ operationalEligibility: { status: "FUTURE_SPECIALIZED_DEFINITION_REQUIRED" }, reviewState: "PENDING" }));
  it("Study Design candidates", () => expect(result().studyDesignCandidates.every((item) => item.whyItAnswersQuestion && item.estimandPurpose)).toBe(true));
  it("Groups", () => expect(result().groups.every((item) => item.populationId && item.justification)).toBe(true));
  it("Visits", () => expect(result().visits.every((item) => item.justification && item.dependencies.length)).toBe(true));
  it("Temporal Structure", () => expect(result().temporalStructure).toMatchObject({ repeatedMeasures: true }));
  it("Endpoint candidates", () => expect(result().endpointCandidates.every((item) => item.questionId && item.objectiveIds.length && item.hypothesisIds.length && item.populationId && item.timingIds.length)).toBe(true));
  it("Variables", () => expect(result().variables.every((item) => item.endpointIds.length && item.analysisRequirementIds.length && item.finalDataDictionaryName === null)).toBe(true));
  it("Analysis Requirements", () => expect(result().analysisRequirements.every((item) => item.reason && item.finalStatisticalModel === null)).toBe(true));
  it("Sizing Requirements", () => expect(result().sizingRequirements).toMatchObject({ status: "SPECIALIZED_ENGINE_REQUIRED", sampleSize: null, power: null }));
  it("Recruitment Requirements", () => expect(result().recruitmentModelRequirements.inputs.every((item) => item.value === null)).toBe(true));
  it("Feasibility", () => expect(new Set(result().feasibilityAssessment.map((item) => item.domain)).size).toBe(10));
  it("Biases", () => expect(result().biases.every((item) => item.affectedIds.length && item.justification)).toBe(true));
  it("Confounders", () => {
    const prognostic = executeResearchProjectConstruction(makeProjectInput({ question: "Une mesure initiale prédit-elle un événement futur ?", outcomes: ["événement futur"] }));
    expect(prognostic.confounders.every((item) => item.whyPlausible && item.biostatisticsDecisionRequired)).toBe(true);
  });
  it("Data handoff", () => expect(result().dataManagementRequirements.every((item) => item.status === "SPECIALIZED_ENGINE_REQUIRED" && item.sourceRefs.length)).toBe(true));
  it("Biostat handoff", () => expect(result().biostatisticsRequirements).toMatchObject({ status: "SPECIALIZED_ENGINE_REQUIRED" }));
  it("Regulatory questions", () => expect(result().regulatoryQuestions.every((item) => item.status === "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" && item.trigger)).toBe(true));
  it("Economics questions", () => expect(result().economicsQuestions.some((item) => item.status === "FUNDING_STRATEGY_REQUIRES_SPECIALIZED_REVIEW")).toBe(true));
  it("Alternatives", () => expect(result().alternatives.every((item) => item.reviewState === "PENDING" && item.cannotEstablish.length)).toBe(true));
  it("Project Decision Graph", () => expect(result().impactGraph).toMatchObject({ ontologyStatus: "NO_NEW_ONTOLOGY_RUNTIME_PROJECTION" }));
  it("Major Change", () => {
    let session = createResearchProjectConstructionSession(makeProjectInput());
    session = requestProjectChange(session, { eventType: "PopulationChanged", description: "Population modifiée.", sourceIds: [session.result.populationDesign.populationId] });
    expect(session.result.impactGraph.changes[0]).toMatchObject({ kind: "MAJOR", status: "PENDING_CONFIRMATION", requiresHumanConfirmation: true });
  });
  it("Impact Propagation", () => {
    let session = createResearchProjectConstructionSession(makeProjectInput());
    session = requestProjectChange(session, { eventType: "StudyDesignChanged", description: "Plan modifié.", sourceIds: [session.result.studyDesignCandidates[0].designId] });
    expect(session.result.impactGraph.impacts.some((item) => item.state === "INVALIDATED")).toBe(true);
    expect(session.result.impactGraph.impacts.some((item) => item.state === "OBSOLETE")).toBe(true);
  });
  it("Project Version", () => expect(result().candidateVersion).toMatchObject({ status: "CANDIDATE_NOT_FROZEN", priorVersion: "PRJ-TEST-1" }));
  it("Projection Readiness", () => expect(result().projectionReadiness).toHaveLength(14));
  it("Human Decisions", () => expect(result().decisionsRequired.every((item) => item.status === "PENDING" && item.reason)).toBe(true));
  it("Document handoff", () => expect(result().documentHandoff).toMatchObject({ status: "NOT_READY", boundary: "NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS" }));
  it("Determinism", () => {
    const input = makeProjectInput();
    expect(executeResearchProjectConstruction(structuredClone(input))).toEqual(executeResearchProjectConstruction(input));
  });
  it("Refusal", () => expect(executeResearchProjectConstruction(makeProjectInput({ imagingStatus: "REQUIRED_BUT_NOT_READY" })).refusal).toMatchObject({ code: "IMAGING_HANDOFF_NOT_READY" }));
});

describe("PRJ-001 — réouverture de décision", () => {
  it("réouvre la porte concernée après confirmation d’un changement", () => {
    let session = createResearchProjectConstructionSession(makeProjectInput());
    session = proposeStudyDesign(session, session.result.studyDesignCandidates[0].designId);
    session = decideProjectGate(session, "PRJ-GATE-STUDY-DESIGN", "APPROVED", "Plan adopté.", "Investigateur", "mandate:project-test");
    session = requestProjectChange(session, { eventType: "StudyDesignChanged", description: "Plan rouvert.", sourceIds: [session.result.studyDesignCandidates[0].designId] });
    session = decideProjectChange(session, session.result.impactGraph.changes[0].changeId, "CONFIRMED", "Investigateur", "mandate:project-test");
    expect(session.result.decisionsRequired.find((item) => item.gateId === "PRJ-GATE-STUDY-DESIGN")?.status).toBe("PENDING");
  });
});
