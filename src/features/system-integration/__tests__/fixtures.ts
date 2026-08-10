import { executeKnowledgeEngine } from "@/features/knowledge-engine";
import { buildImagingDesignInput, createImagingDesignSession, answerImagingQuestion, decideImagingGate, type ImagingDesignSession } from "@/features/imaging-study-designer";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { buildScientificSessionContext } from "@/features/protocol-designer/intake/journey";
import { buildValidatedIntent } from "@/features/protocol-designer/intake/session";
import type { HumanFieldReview, InterpretedFieldKey, ValidatedScientificIntent } from "@/features/protocol-designer/intake/types";
import { buildResearchProjectConstructionInput, createResearchProjectConstructionSession, decideProjectGate, proposeEndpointRole, proposeStudyDesign, type ResearchProjectConstructionSession } from "@/features/research-project-construction";
import { authorizeResearchDesignHandoff, buildScientificThinkingInput, createScientificThinkingSession, reviewScientificHypothesis, reviewScientificObjective, selectScientificQuestion, type ScientificThinkingSession } from "@/features/scientific-thinking";

export const SYS_TIME = "2026-08-10T16:00:00.000Z";

type IntentFields = Partial<Record<InterpretedFieldKey, string[]>>;

const explicitField = (value: string[]) => ({
  value,
  origin: "EXPLICIT_USER_STATEMENT" as const,
  confidence: "HIGH" as const,
  sourceText: value.join(", "),
  userValidated: true,
});

export const makeSystemIntent = (question: string, fields: IntentFields = {}): ValidatedScientificIntent => {
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = question;
  const reviews: Partial<Record<InterpretedFieldKey, HumanFieldReview>> = {};
  Object.entries(fields).forEach(([key, value]) => {
    if (!value?.length) return;
    interpretation[key as InterpretedFieldKey] = explicitField(value) as never;
    reviews[key as InterpretedFieldKey] = { state: "CONFIRMED", reviewedAt: SYS_TIME };
  });
  return buildValidatedIntent(interpretation, reviews, question, SYS_TIME);
};

export const makeSystemKnowledge = (intent: ValidatedScientificIntent, consumer: "PROTOCOL_DESIGNER_UNDERSTAND" | "SCIENTIFIC_THINKING_ENGINE" | "IMAGING_STUDY_DESIGNER" | "RESEARCH_PROJECT_CONSTRUCTION" = "SCIENTIFIC_THINKING_ENGINE") => {
  const context = buildScientificSessionContext(intent);
  return executeKnowledgeEngine({
    originalQuestion: intent.originalQuestion,
    scientificObjectTerms: context.preservedScientificTerms.map((term, index) => ({ term, role: index === 0 ? "SUBJECT" as const : index === 1 ? "COMPARATOR" as const : "CONTEXT" as const })),
    relations: context.detectedRelationships,
    consumer,
    createdAt: SYS_TIME,
    strategyVersion: consumer === "IMAGING_STUDY_DESIGNER" || consumer === "RESEARCH_PROJECT_CONSTRUCTION" ? `sys-${context.contextVersion}` : undefined,
  });
};

export const authorizeSystemThinking = (intent: ValidatedScientificIntent): { session: ScientificThinkingSession; knowledge: ReturnType<typeof makeSystemKnowledge> } => {
  const context = buildScientificSessionContext(intent);
  const knowledge = makeSystemKnowledge(intent, "SCIENTIFIC_THINKING_ENGINE");
  const input = buildScientificThinkingInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge, {
    sessionId: "SYS-001-SESSION",
    contextVersion: context.contextVersion,
    sourceJourney: "DESIGN_STUDY",
  });
  let session = createScientificThinkingSession(input);
  const question = session.output.questions.find((item) => item.testability === "TESTABLE_CANDIDATE");
  if (question) session = selectScientificQuestion(session, question.questionId, "Responsable scientifique SYS-001", "mandate:sys-001", SYS_TIME);
  session.output.hypotheses.forEach((item, index) => {
    session = reviewScientificHypothesis(session, item.hypothesisId, index === 0 ? "ADOPTED" : "REJECTED", "Responsable scientifique SYS-001", "mandate:sys-001", SYS_TIME);
  });
  const primary = session.output.objectives.find((item) => item.level === "PRIMARY");
  if (primary) session = reviewScientificObjective(session, primary.objectiveId, "ADOPTED", "Responsable scientifique SYS-001", "mandate:sys-001", SYS_TIME);
  session = authorizeResearchDesignHandoff(session, "Responsable scientifique SYS-001", "mandate:sys-001", SYS_TIME);
  return { session, knowledge };
};

export const createSystemImaging = (intent: ValidatedScientificIntent): ImagingDesignSession => {
  const context = buildScientificSessionContext(intent);
  const { session: thinking } = authorizeSystemThinking(intent);
  const knowledge = makeSystemKnowledge(intent, "IMAGING_STUDY_DESIGNER");
  const input = buildImagingDesignInput(intent, context.preservedScientificTerms, context.detectedRelationships, knowledge, thinking, {
    sessionId: "SYS-001-SESSION",
    contextVersion: context.contextVersion,
    strategyVersion: "SYS-001-IMG-1",
  });
  return createImagingDesignSession(input);
};

export const freezeSystemImaging = (intent: ValidatedScientificIntent): ImagingDesignSession => {
  let session = createSystemImaging(intent);
  for (let index = 0; index < 30; index += 1) {
    const question = session.result.adaptiveQuestions.find((item) => !item.answeredValue);
    if (!question) break;
    session = answerImagingQuestion(session, question.questionId, "UNKNOWN_EXPLICITLY_RECORDED");
  }
  for (let index = 0; index < 40; index += 1) {
    const gate = session.result.decisionsRequired.find((item) => item.status === "PENDING");
    if (!gate) break;
    session = decideImagingGate(session, gate.gateId, "APPROVED", "Décision humaine explicite du scénario SYS-001.", "Responsable Imaging SYS-001", "mandate:sys-001", `2026-08-10T16:${String(index).padStart(2, "0")}:00.000Z`);
  }
  return session;
};

export const authorizeSystemProject = (intent: ValidatedScientificIntent, imaging: ImagingDesignSession | null): ResearchProjectConstructionSession => {
  const context = buildScientificSessionContext(intent);
  const { session: thinking, knowledge } = authorizeSystemThinking(intent);
  const input = buildResearchProjectConstructionInput(intent, knowledge, thinking, imaging, {
    sessionId: "SYS-001-SESSION",
    contextVersion: context.contextVersion,
    strategyVersion: "SYS-001-PRJ-1",
  });
  let session = createResearchProjectConstructionSession(input);
  if (session.result.studyDesignCandidates[0]) session = proposeStudyDesign(session, session.result.studyDesignCandidates[0].designId);
  if (session.result.endpointCandidates[0]) session = proposeEndpointRole(session, session.result.endpointCandidates[0].endpointId, "PRIMARY_CANDIDATE");
  for (let index = 0; index < 50; index += 1) {
    const gate = session.result.decisionsRequired.find((item) => item.status === "PENDING" && item.gateId !== "PRJ-GATE-DOCUMENT-HANDOFF");
    if (!gate) break;
    session = decideProjectGate(session, gate.gateId, "APPROVED", "Décision humaine explicite du scénario SYS-001.", "Responsable scientifique SYS-001", "mandate:sys-001", `2026-08-10T17:${String(index).padStart(2, "0")}:00.000Z`);
  }
  session = decideProjectGate(session, "PRJ-GATE-DOCUMENT-HANDOFF", "APPROVED", "Projection Protocol autorisée pour la validation SYS-001.", "Responsable scientifique SYS-001", "mandate:sys-001", "2026-08-10T18:00:00.000Z");
  return session;
};

export const comparisonFields: IntentFields = {
  scientificDomain: ["imagerie médicale"],
  scientificPurpose: ["comparer deux modalités pour étudier un phénomène"],
  phenomenaOfInterest: ["fibrose myocardique"],
  outcomesMentioned: ["mesure de la fibrose myocardique"],
  availableEquipment: ["CT cardiaque", "IRM cardiaque"],
};
