import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  createHumanDecisionCandidate,
  engageHumanDecision,
  engagingStatusForGateDecision,
  reopenHumanDecision,
  type HumanDecisionEnvelope,
} from "@/features/protocol-designer/human-decision";
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
  decisionRecords: session.decisionHistory,
});

const rebuild = (session: ScientificThinkingSession): ScientificThinkingSession => ({
  ...session,
  output: executeScientificThinkingEngine(session.input, controlsFrom(session)),
  revisions: session.revisions + 1,
});

export const createScientificThinkingSession = (input: ScientificThinkingInput): ScientificThinkingSession => {
  const output = executeScientificThinkingEngine(input);
  const base: ScientificThinkingSession = {
    input,
    output,
    answers: {},
    selectedQuestionId: null,
    hypothesisReviews: {},
    objectiveReviews: {},
    gateStatuses: {},
    acceptedUnknowns: [],
    changes: [],
    decisionHistory: output.humanGates.filter((gate) => gate.status !== "NOT_REQUIRED").map((gate) => createHumanDecisionCandidate({
      decisionId: `scientific-thinking-decision:${logicalDigest({ requestId: input.requestId, gateId: gate.gateId })}`,
      gateId: gate.gateId,
      scope: [],
      targets: [],
      reason: gate.reason,
      provenance: [input.requestId, `scientific-thinking-output:${output.outputId}`],
      engineSource: "SCIENTIFIC_THINKING",
      projectVersion: `context-${input.researchContext.contextVersion}`,
    })),
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
  actor: string | null,
  mandate: string | null,
  now: string,
): { session: ScientificThinkingSession; record: HumanDecisionEnvelope; engaging: boolean } => {
  const gateId = `ST-G-${gate}`;
  const stableId = `scientific-thinking-decision:${logicalDigest({ requestId: session.input.requestId, gateId, targetIds })}`;
  const existing = [...session.decisionHistory].reverse().find((item) => item.gateId === gateId && targetIds.every((target) => item.targets.includes(target)))
    ?? session.decisionHistory.find((item) => item.gateId === gateId && item.status === "PENDING")
    ?? createHumanDecisionCandidate({
      decisionId: stableId,
      gateId,
      scope: [gate, ...targetIds],
      targets: targetIds,
      reason,
      provenance: [session.input.requestId, session.output.outputId],
      engineSource: "SCIENTIFIC_THINKING",
      projectVersion: `context-${session.input.researchContext.contextVersion}`,
    });
  const reopened = ["ADOPTED", "REJECTED", "DEFERRED", "REOPENED"].includes(existing.status)
    ? reopenHumanDecision(existing, {
      actor, mandate, reason: `Réexamen explicite : ${reason}`, timestamp: now,
      impact: { affectedObjects: targetIds, affectedEngines: ["SCIENTIFIC_THINKING", "IMAGING", "RESEARCH_PROJECT", "DOCUMENT"], reopenedGates: [gateId], obsoleteProjections: ["DOWNSTREAM_CANDIDATE_PROJECTIONS"] },
    })
    : { ...existing, scope: [...new Set([gate, ...targetIds])], targets: [...new Set(targetIds)], reason };
  const record = engageHumanDecision(reopened, {
    status: engagingStatusForGateDecision(decision === "APPROVED" ? "APPROVED" : "REJECTED"), actor, mandate, reason, timestamp: now,
  });
  const history = ["ADOPTED", "REJECTED", "DEFERRED", "REOPENED"].includes(existing.status)
    ? session.decisionHistory
    : session.decisionHistory.filter((item) => item.decisionId !== record.decisionId);
  return { session: { ...session, decisionHistory: [...history, record] }, record, engaging: record.status === "ADOPTED" || record.status === "REJECTED" };
};

export const answerScientificThinkingQuestion = (
  session: ScientificThinkingSession,
  questionId: string,
  answer: string,
): ScientificThinkingSession => rebuild({ ...session, answers: { ...session.answers, [questionId]: answer } });

export const selectScientificQuestion = (
  session: ScientificThinkingSession,
  questionId: string,
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  if (!session.output.questions.some((item) => item.questionId === questionId && item.testability === "TESTABLE_CANDIDATE")) return session;
  const recorded = recordDecision(session, "QUESTION_CONFIRMATION", "APPROVED", [questionId], "Question candidate confirmée par l’utilisateur.", actor, mandate, now);
  if (!recorded.engaging) return recorded.session;
  return rebuild({ ...recorded.session, selectedQuestionId: questionId, gateStatuses: { ...session.gateStatuses, QUESTION_CONFIRMATION: "APPROVED" } });
};

export const reviewScientificHypothesis = (
  session: ScientificThinkingSession,
  hypothesisId: string,
  review: Exclude<CandidateReviewState, "PENDING">,
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  if (!session.output.hypotheses.some((item) => item.hypothesisId === hypothesisId)) return session;
  const recorded = recordDecision(session, "HYPOTHESIS_ADOPTION", review === "ADOPTED" ? "APPROVED" : "REJECTED", [hypothesisId], `Hypothèse ${review === "ADOPTED" ? "adoptée" : "rejetée"} par l’utilisateur.`, actor, mandate, now);
  if (!recorded.engaging) return recorded.session;
  const reviews = { ...recorded.session.hypothesisReviews, [hypothesisId]: review };
  const allReviewed = session.output.hypotheses.every((item) => (reviews[item.hypothesisId] ?? "PENDING") !== "PENDING");
  const changed: ScientificThinkingSession = {
    ...recorded.session,
    hypothesisReviews: reviews,
    gateStatuses: { ...session.gateStatuses, HYPOTHESIS_ADOPTION: allReviewed ? "APPROVED" : "PENDING" },
  };
  return rebuild(changed);
};

export const reviewScientificObjective = (
  session: ScientificThinkingSession,
  objectiveId: string,
  review: Exclude<CandidateReviewState, "PENDING">,
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  const objective = session.output.objectives.find((item) => item.objectiveId === objectiveId);
  if (!objective) return session;
  const recorded = recordDecision(session, "OBJECTIVE_HIERARCHY", review === "ADOPTED" ? "APPROVED" : "REJECTED", [objectiveId], `Objectif ${review === "ADOPTED" ? "retenu" : "écarté"} par l’utilisateur.`, actor, mandate, now);
  if (!recorded.engaging) return recorded.session;
  const reviews = { ...recorded.session.objectiveReviews, [objectiveId]: review };
  const primaryAdopted = session.output.objectives.some((item) => item.level === "PRIMARY" && reviews[item.objectiveId] === "ADOPTED");
  const changed: ScientificThinkingSession = {
    ...recorded.session,
    objectiveReviews: reviews,
    gateStatuses: { ...session.gateStatuses, OBJECTIVE_HIERARCHY: primaryAdopted ? "APPROVED" : "PENDING" },
  };
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
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  const recorded = recordDecision(session, "BRANCH_ABANDONMENT", "APPROVED", abandonedQuestionIds, "Abandon de branche confirmé par l’utilisateur.", actor, mandate, now);
  if (!recorded.engaging) return recorded.session;
  return rebuild({ ...recorded.session, gateStatuses: { ...session.gateStatuses, BRANCH_ABANDONMENT: "APPROVED" } });
};

export const authorizeResearchDesignHandoff = (
  session: ScientificThinkingSession,
  actor: string | null = null,
  mandate: string | null = null,
  now = new Date().toISOString(),
): ScientificThinkingSession => {
  if (session.output.handoff.status !== "READY_FOR_HUMAN_AUTHORIZATION") return session;
  const recorded = recordDecision(session, "DESIGN_TRANSITION", "APPROVED", [
    ...(session.output.handoff.questionId ? [session.output.handoff.questionId] : []),
    ...session.output.handoff.hypothesisIds,
    ...session.output.handoff.objectiveIds,
  ], "Passage vers DESIGN_STUDY autorisé par l’utilisateur.", actor, mandate, now);
  if (!recorded.engaging) return recorded.session;
  return rebuild({ ...recorded.session, gateStatuses: { ...session.gateStatuses, DESIGN_TRANSITION: "APPROVED" } });
};
