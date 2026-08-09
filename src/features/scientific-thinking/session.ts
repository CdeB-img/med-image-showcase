import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { executeScientificThinkingEngine, type ScientificThinkingControls } from "./engine";
import type {
  CandidateReviewState,
  ChangeEvent,
  HumanGateStatus,
  HumanGateType,
  ScientificThinkingInput,
  ScientificThinkingSession,
} from "./types";

const controlsFrom = (session: ScientificThinkingSession): ScientificThinkingControls => ({
  answers: session.answers,
  selectedQuestionId: session.selectedQuestionId,
  hypothesisReviews: session.hypothesisReviews,
  objectiveReviews: session.objectiveReviews,
  gateStatuses: session.gateStatuses,
  acceptedUnknowns: session.acceptedUnknowns,
  changes: session.changes,
  decisionRecordIds: session.decisionHistory.map((item) => item.decisionId),
});

const rebuild = (session: ScientificThinkingSession): ScientificThinkingSession => ({
  ...session,
  output: executeScientificThinkingEngine(session.input, controlsFrom(session)),
  revisions: session.revisions + 1,
});

export const createScientificThinkingSession = (input: ScientificThinkingInput): ScientificThinkingSession => {
  const base: ScientificThinkingSession = {
    input,
    output: executeScientificThinkingEngine(input),
    answers: {},
    selectedQuestionId: null,
    hypothesisReviews: {},
    objectiveReviews: {},
    gateStatuses: {},
    acceptedUnknowns: [],
    changes: [],
    decisionHistory: [],
    revisions: 1,
  };
  return base;
};

const recordDecision = (
  session: ScientificThinkingSession,
  gate: HumanGateType,
  decision: HumanGateStatus,
  targetIds: string[],
  reason: string,
  now: string,
): ScientificThinkingSession => ({
  ...session,
  decisionHistory: [...session.decisionHistory, {
    decisionId: `scientific-thinking-decision:${logicalDigest({ gate, decision, targetIds, reason, revision: session.revisions })}`,
    gate, decision, targetIds, reason, decidedAt: now,
  }],
});

export const answerScientificThinkingQuestion = (
  session: ScientificThinkingSession,
  questionId: string,
  answer: string,
): ScientificThinkingSession => rebuild({ ...session, answers: { ...session.answers, [questionId]: answer } });

export const selectScientificQuestion = (
  session: ScientificThinkingSession,
  questionId: string,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  if (!session.output.questions.some((item) => item.questionId === questionId && item.testability === "TESTABLE_CANDIDATE")) return session;
  const changed = recordDecision({
    ...session,
    selectedQuestionId: questionId,
    gateStatuses: { ...session.gateStatuses, QUESTION_CONFIRMATION: "APPROVED" },
  }, "QUESTION_CONFIRMATION", "APPROVED", [questionId], "Question candidate confirmée par l’utilisateur.", now);
  return rebuild(changed);
};

export const reviewScientificHypothesis = (
  session: ScientificThinkingSession,
  hypothesisId: string,
  review: Exclude<CandidateReviewState, "PENDING">,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  if (!session.output.hypotheses.some((item) => item.hypothesisId === hypothesisId)) return session;
  const reviews = { ...session.hypothesisReviews, [hypothesisId]: review };
  const allReviewed = session.output.hypotheses.every((item) => (reviews[item.hypothesisId] ?? "PENDING") !== "PENDING");
  let changed: ScientificThinkingSession = {
    ...session,
    hypothesisReviews: reviews,
    gateStatuses: { ...session.gateStatuses, HYPOTHESIS_ADOPTION: allReviewed ? "APPROVED" : "PENDING" },
  };
  changed = recordDecision(changed, "HYPOTHESIS_ADOPTION", review === "ADOPTED" ? "APPROVED" : "REJECTED", [hypothesisId], `Hypothèse ${review === "ADOPTED" ? "adoptée" : "rejetée"} par l’utilisateur.`, now);
  return rebuild(changed);
};

export const reviewScientificObjective = (
  session: ScientificThinkingSession,
  objectiveId: string,
  review: Exclude<CandidateReviewState, "PENDING">,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  const objective = session.output.objectives.find((item) => item.objectiveId === objectiveId);
  if (!objective) return session;
  const reviews = { ...session.objectiveReviews, [objectiveId]: review };
  const primaryAdopted = session.output.objectives.some((item) => item.level === "PRIMARY" && reviews[item.objectiveId] === "ADOPTED");
  let changed: ScientificThinkingSession = {
    ...session,
    objectiveReviews: reviews,
    gateStatuses: { ...session.gateStatuses, OBJECTIVE_HIERARCHY: primaryAdopted ? "APPROVED" : "PENDING" },
  };
  changed = recordDecision(changed, "OBJECTIVE_HIERARCHY", review === "ADOPTED" ? "APPROVED" : "REJECTED", [objectiveId], `Objectif ${review === "ADOPTED" ? "retenu" : "écarté"} par l’utilisateur.`, now);
  return rebuild(changed);
};

export const setUnknownAccepted = (session: ScientificThinkingSession, unknown: string, accepted: boolean): ScientificThinkingSession => rebuild({
  ...session,
  acceptedUnknowns: accepted
    ? [...new Set([...session.acceptedUnknowns, unknown])]
    : session.acceptedUnknowns.filter((item) => item !== unknown),
});

export const addScientificThinkingChange = (session: ScientificThinkingSession, change: ChangeEvent): ScientificThinkingSession => rebuild({
  ...session,
  changes: [...session.changes.filter((item) => item.changeId !== change.changeId), change],
  gateStatuses: change.kind === "MAJOR" ? { ...session.gateStatuses, MAJOR_SCOPE_CHANGE: "PENDING" } : session.gateStatuses,
});

export const decideScientificThinkingBranch = (
  session: ScientificThinkingSession,
  abandonedQuestionIds: string[],
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  const changed = recordDecision({
    ...session,
    gateStatuses: { ...session.gateStatuses, BRANCH_ABANDONMENT: "APPROVED" },
  }, "BRANCH_ABANDONMENT", "APPROVED", abandonedQuestionIds, "Abandon de branche confirmé par l’utilisateur.", now);
  return rebuild(changed);
};

export const authorizeResearchDesignHandoff = (
  session: ScientificThinkingSession,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  if (session.output.handoff.status !== "READY_FOR_HUMAN_AUTHORIZATION") return session;
  const changed = recordDecision({
    ...session,
    gateStatuses: { ...session.gateStatuses, DESIGN_TRANSITION: "APPROVED" },
  }, "DESIGN_TRANSITION", "APPROVED", [
    ...(session.output.handoff.questionId ? [session.output.handoff.questionId] : []),
    ...session.output.handoff.hypothesisIds,
    ...session.output.handoff.objectiveIds,
  ], "Passage vers DESIGN_STUDY autorisé par l’utilisateur.", now);
  return rebuild(changed);
};
