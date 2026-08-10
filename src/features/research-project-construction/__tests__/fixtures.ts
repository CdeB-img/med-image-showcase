import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { answerImagingQuestion, createImagingDesignSession, decideImagingGate } from "@/features/imaging-study-designer";
import type { ImagingDesignResult } from "@/features/imaging-study-designer/types";
import { makeImagingInput } from "@/features/imaging-study-designer/__tests__/fixtures";
import { RESEARCH_PROJECT_CONSTRUCTION_VERSION, type ResearchProjectConstructionInput } from "../types";

type ProjectFixtureOptions = {
  question?: string;
  outcomes?: string[];
  population?: string[];
  pathology?: string[];
  methods?: string[];
  designDeclarations?: string[];
  centers?: string[];
  availableData?: string[];
  timings?: string[];
  constraints?: string[];
  interventions?: string[];
  objectives?: boolean;
  hypotheses?: boolean;
  imagingResult?: ImagingDesignResult | null;
  imagingStatus?: "FROZEN_BY_HUMAN" | "NOT_APPLICABLE" | "REQUIRED_BUT_NOT_READY";
  assertions?: string[];
  uncertainties?: string[];
};

export const makeProjectInput = (options: ProjectFixtureOptions = {}): ResearchProjectConstructionInput => {
  const question = options.question ?? "Chez les adultes atteints de maladie de Fabry, comment un marqueur évolue-t-il longitudinalement ?";
  const outcomes = options.outcomes ?? ["évolution du marqueur quantitatif"];
  const population = options.population ?? ["adultes atteints de maladie de Fabry"];
  const pathology = options.pathology ?? ["maladie de Fabry"];
  const imagingResult = options.imagingResult ?? null;
  const imagingStatus = options.imagingStatus ?? (imagingResult ? "FROZEN_BY_HUMAN" : "NOT_APPLICABLE");
  const material = { question, outcomes, population, pathology, imagingStatus, imagingResult: imagingResult?.resultDigest ?? null, options };
  const digest = logicalDigest(material);
  return {
    contractVersion: RESEARCH_PROJECT_CONSTRUCTION_VERSION,
    inputId: `research-project-construction-input:${digest}`,
    projectId: `research-project:${digest}`,
    strategyVersion: "PRJ-TEST-1",
    sourceHandoffs: {
      scientificThinking: { status: "AUTHORIZED", outputRef: "scientific-thinking-output:test" },
      imaging: {
        status: imagingStatus,
        resultRef: imagingResult?.resultId ?? null,
        projectHandoffReadiness: imagingResult?.projectConstructionHandoff.projectHandoffReadiness ?? null,
        equipmentCompatibilityStatus: imagingResult?.projectConstructionHandoff.equipmentCompatibilityStatus ?? null,
        executableProtocolReadiness: imagingResult?.projectConstructionHandoff.executableProtocolReadiness ?? null,
      },
    },
    confirmedScientificQuestion: { questionId: `question:${digest}`, text: question, confirmation: "HUMAN_CONFIRMED" },
    objectives: options.objectives === false ? [] : [{ objectiveId: `objective:${digest}`, text: `Examiner ${outcomes[0] ?? "l’outcome à préciser"} dans la Population déclarée.`, level: "PRIMARY", reviewState: "ADOPTED" }],
    hypotheses: options.hypotheses === false ? [] : [{ hypothesisId: `hypothesis:${digest}`, text: `Le phénomène étudié est associé à ${outcomes[0] ?? "un outcome à préciser"}.`, kind: "PRIMARY", reviewState: "ADOPTED" }],
    mechanisms: [],
    scientificContext: {
      centralScientificObject: outcomes[0] ?? question,
      pathologyOrCondition: pathology,
      phenomena: ["phénomène d’intérêt déclaré"],
      outcomes,
      exposuresOrInterventions: options.interventions ?? [],
      studyDesignDeclarations: options.designDeclarations ?? [],
      centerDeclarations: options.centers ?? [],
      availableData: options.availableData ?? [],
      methodPreferences: options.methods ?? [],
    },
    knowledgeResults: {
      resultId: "knowledge-result:test",
      resultDigest: "knowledge-digest:test",
      coverageStatus: "PARTIAL",
      assertions: (options.assertions ?? []).map((text, index) => ({ assertionId: `assertion:${index + 1}`, text, applicability: "APPLICABLE", sourceRef: `test-source:${index + 1}` })),
      gaps: [],
      limitations: ["Corpus de test volontairement borné."],
    },
    imagingDesignResult: imagingResult,
    knownPopulationInformation: population,
    knownTemporalInformation: options.timings ?? [],
    knownConstraints: options.constraints ?? [],
    existingDecisions: ["scientific-thinking-decision:test"],
    existingDecisionRecords: [],
    uncertainties: options.uncertainties ?? [],
    contradictions: [],
    userProvidedInformation: [
      ...population.map((value, index) => ({ informationId: `information:population:${index + 1}`, kind: "population", value, provenanceRef: "validated-intent:test" })),
      ...outcomes.map((value, index) => ({ informationId: `information:outcome:${index + 1}`, kind: "outcomesMentioned", value, provenanceRef: "validated-intent:test" })),
      ...(options.methods ?? []).map((value, index) => ({ informationId: `information:method:${index + 1}`, kind: "availableEquipment", value, provenanceRef: "validated-intent:test" })),
    ],
    provenance: ["validated-intent:test", "scientific-thinking-output:test", "knowledge-result:test"],
    trace: [{ sequence: 1, operation: "BUILD_TEST_INPUT", decision: "EXPLICIT_FIXTURE", inputDigest: digest, outputDigest: digest }],
  };
};

export const makeFrozenImagingResult = (): ImagingDesignResult => {
  let session = createImagingDesignSession(makeImagingInput({
    timings: ["mesure initiale", "suivi à définir scientifiquement"],
    fields: ["1,5 T"],
    manufacturers: ["Constructeur déclaré"],
    models: ["Modèle déclaré"],
    versions: ["Version déclarée"],
  }));
  for (let index = 0; index < 20; index += 1) {
    const question = session.result.adaptiveQuestions.find((item) => !item.answeredValue);
    if (!question) break;
    session = answerImagingQuestion(session, question.questionId, "UNKNOWN_EXPLICITLY_RECORDED");
  }
  for (let index = 0; index < 30; index += 1) {
    const gate = session.result.decisionsRequired.find((item) => item.status === "PENDING");
    if (!gate) break;
    session = decideImagingGate(session, gate.gateId, "APPROVED", "Décision humaine explicite pour fixture PRJ-001.", "Responsable Imaging", "mandate:prj-001-fixture", `2026-08-10T10:${String(index).padStart(2, "0")}:00.000Z`);
  }
  if (session.result.projectConstructionHandoff.status !== "FROZEN_BY_HUMAN") throw new Error("IMG_001B_LIVE_HANDOFF_NOT_FROZEN");
  return session.result;
};
