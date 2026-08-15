import { selectNextAction } from "./engine";
import type { NavigationSelection, NextActionCandidate, QueryNavigationContext } from "./contracts";
import {
  candidateIdentityMaterial,
  type NavigationFreshness,
  type NavigationLifecycleReplay,
  type NavigationLifecycleStatus,
  type NavigationRebuildResult,
  type QueryNavigationLifecycleEvent,
  type QueryNavigationMemory,
  type QuestionPresentationRequest,
  type SelectedNavigationAction,
} from "./lifecycle-contracts";
import { computeNavigationMemoryDigest, computeSelectedActionDigest, makeLifecycleId } from "./lifecycle-canonical";

const unique = (values: readonly string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

export const buildSelectedNavigationAction = (selection: NavigationSelection, candidate = selection.selected): SelectedNavigationAction => {
  if (!candidate || !selection.trace.nonDominatedCandidateRefs.includes(candidate.candidateId)) throw new Error("QRY_SELECTED_ACTION_MUST_BE_NON_DOMINATED");
  const identity = candidateIdentityMaterial(candidate, selection.context.projectVersion);
  const action: SelectedNavigationAction = {
    lifecycleVersion: "1.0.0",
    selectedActionId: makeLifecycleId("selected-action", identity),
    selectionTraceRef: selection.trace.traceId,
    actionCandidateRef: candidate.candidateId,
    projectRef: selection.context.projectRef,
    projectVersion: selection.context.projectVersion,
    sourceStateDigest: selection.context.sourceStateDigest,
    targetRef: candidate.targetRef,
    owner: candidate.owner,
    actionCategory: candidate.actionCategory,
    navigationNeedRefs: unique(candidate.navigationNeedRefs),
    affectedDecisionRefs: unique(candidate.affectedDecisionRefs),
    affectedBranchRefs: unique(candidate.affectedBranchRefs),
    pd009RuleRefs: unique(candidate.pd009RuleRefs),
    prerequisites: unique(candidate.dependencies.filter((item) => item.status !== "SATISFIED").map((item) => item.prerequisiteRef)),
    reason: candidate.explanation,
    alternativeCandidateRefs: unique(selection.nonDominated.filter((item) => item.candidateId !== candidate.candidateId).map((item) => item.candidateId)),
    lifecycleStatus: "SELECTED",
    provenanceRefs: unique(candidate.provenance.sourceRefs),
    limitations: unique(candidate.provenance.limitations),
    projectWriteAuthorized: false,
    autoExecutionAuthorized: false,
    sourceOfTruth: false,
    digest: "",
  };
  action.digest = computeSelectedActionDigest(action);
  return action;
};

const answerKindFor = (candidate: NextActionCandidate) => candidate.actionCategory === "COMPARE_OPTIONS" ? "SINGLE_OPTION" as const
  : candidate.actionCategory === "REQUEST_HUMAN_DECISION" ? "HUMAN_REVIEW_DECISION" as const
    : "FREE_TEXT" as const;

export const buildQuestionPresentationRequest = (action: SelectedNavigationAction, candidate: NextActionCandidate): QuestionPresentationRequest => {
  if (!["CLARIFY_BY_ADAPTIVE_EXCHANGE", "COMPARE_OPTIONS", "REQUEST_HUMAN_DECISION"].includes(action.actionCategory)) throw new Error("QRY_ACTION_IS_NOT_PRESENTABLE_AS_QUESTION");
  return {
    presentationId: makeLifecycleId("presentation", { selectedActionRef: action.selectedActionId, needRefs: action.navigationNeedRefs, projectVersion: action.projectVersion, answerKind: answerKindFor(candidate) }),
    selectedActionRef: action.selectedActionId,
    informationNeedRefs: action.navigationNeedRefs.length ? [...action.navigationNeedRefs] : [action.targetRef],
    informationNeedRef: action.navigationNeedRefs[0] ?? action.targetRef,
    intent: candidate.explanation,
    targetRef: action.targetRef,
    expectedAnswerKind: answerKindFor(candidate),
    answerOwner: action.owner,
    affectedDecisionRefs: [...action.affectedDecisionRefs],
    affectedBranchRefs: [...action.affectedBranchRefs],
    whyNow: candidate.explanation,
    unknownOrDeferConsequence: candidate.deferConsequence ?? "NEED_REMAINS_OPEN",
    knownOptions: [...candidate.knownOptionRefs],
    contextRefs: unique([...action.pd009RuleRefs, ...action.prerequisites]),
    projectRef: action.projectRef,
    projectVersion: action.projectVersion,
    provenanceRefs: [...action.provenanceRefs],
    limitations: [...action.limitations],
    presentationOnly: true,
    wordingOwnedBy: "PD-004",
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};

export const createQueryNavigationMemory = (projectRef: string, projectVersion: string, persistence: QueryNavigationMemory["persistence"] = "SESSION_SCOPED"): QueryNavigationMemory => {
  const memory: QueryNavigationMemory = {
    memoryId: makeLifecycleId("memory", { projectRef }),
    projectRef,
    projectVersion,
    events: [],
    selectedActions: [],
    presentations: [],
    responses: [],
    resolvedNeedRefs: [],
    resolutionRefs: [],
    humanDecisionRefs: [],
    contributionRefs: [],
    validationRunRefs: [],
    previousSelectionTraceRefs: [],
    persistence,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    digest: "",
  };
  memory.digest = computeNavigationMemoryDigest(memory);
  return memory;
};

const finalizeMemory = (memory: QueryNavigationMemory): QueryNavigationMemory => {
  const next = { ...memory, digest: "" };
  next.digest = computeNavigationMemoryDigest(next);
  return next;
};

export const rememberSelectedNavigationAction = (memory: QueryNavigationMemory, action: SelectedNavigationAction): QueryNavigationMemory => finalizeMemory({
  ...structuredClone(memory),
  selectedActions: [...memory.selectedActions.map((item) => structuredClone(item)), structuredClone(action)],
  previousSelectionTraceRefs: unique([...memory.previousSelectionTraceRefs, action.selectionTraceRef]),
  digest: "",
});

export const rememberQuestionPresentation = (memory: QueryNavigationMemory, presentation: QuestionPresentationRequest): QueryNavigationMemory => finalizeMemory({
  ...structuredClone(memory),
  presentations: [...memory.presentations.map((item) => structuredClone(item)), structuredClone(presentation)],
  digest: "",
});

export const rememberQuestionResponse = (memory: QueryNavigationMemory, response: import("./lifecycle-contracts").QuestionResponseEnvelope): QueryNavigationMemory => finalizeMemory({
  ...structuredClone(memory),
  responses: [...memory.responses.map((item) => structuredClone(item)), structuredClone(response)],
  digest: "",
});

export const rememberAuthoritativeResolution = (memory: QueryNavigationMemory, needRef: string, resolutionRef: string): QueryNavigationMemory => finalizeMemory({
  ...structuredClone(memory),
  resolvedNeedRefs: unique([...memory.resolvedNeedRefs, needRef]),
  resolutionRefs: unique([...memory.resolutionRefs, resolutionRef]),
  digest: "",
});

export const appendNavigationLifecycleEvent = (memory: QueryNavigationMemory, event: Omit<QueryNavigationLifecycleEvent, "eventId" | "sequence" | "projectWriteAuthorized">): QueryNavigationMemory => {
  const nextSequence = memory.events.length ? Math.max(...memory.events.map((item) => item.sequence)) + 1 : 1;
  const nextEvent: QueryNavigationLifecycleEvent = {
    ...structuredClone(event),
    eventId: makeLifecycleId("event", { memoryId: memory.memoryId, sequence: nextSequence, eventType: event.eventType, actionRef: event.actionRef, projectVersion: event.projectVersion }),
    sequence: nextSequence,
    projectWriteAuthorized: false,
  };
  const next: QueryNavigationMemory = { ...structuredClone(memory), events: [...memory.events.map((item) => structuredClone(item)), nextEvent], digest: "" };
  next.digest = computeNavigationMemoryDigest(next);
  return next;
};

const statusForEvent = (event: QueryNavigationLifecycleEvent): NavigationLifecycleStatus => ({
  ACTION_SELECTED: "SELECTED",
  ACTION_PRESENTED: "PRESENTED",
  RESPONSE_RECEIVED: "ANSWERED",
  ACTION_DEFERRED: "DEFERRED",
  ACTION_DECLINED: "DECLINED",
  ACTION_SUPERSEDED: "SUPERSEDED",
  ACTION_INVALIDATED: "INVALIDATED",
  ACTION_COMPLETED: "COMPLETED",
  ACTION_CANCELLED: "CANCELLED",
  ACTION_REOPENED: "SELECTED",
}[event.eventType] as NavigationLifecycleStatus);

export const replayQueryNavigationLifecycle = (memory: QueryNavigationMemory): NavigationLifecycleReplay => {
  const states: Record<string, NavigationLifecycleStatus> = {};
  let expected = 1;
  let validCausalOrder = true;
  memory.events.forEach((event) => {
    if (event.sequence !== expected) validCausalOrder = false;
    expected += 1;
    states[event.actionRef] = statusForEvent(event);
  });
  return {
    actionStates: states,
    lastSequence: memory.events.at(-1)?.sequence ?? 0,
    validCausalOrder,
    digest: computeNavigationMemoryDigest(memory),
  };
};

export const navigationQuestionIdentity = (action: SelectedNavigationAction, expectedAnswerKind: string) => makeLifecycleId("question-identity", {
  navigationNeedRefs: action.navigationNeedRefs,
  targetRef: action.targetRef,
  affectedDecisionRefs: action.affectedDecisionRefs,
  affectedBranchRefs: action.affectedBranchRefs,
  actionCategory: action.actionCategory,
  expectedAnswerKind,
  projectVersion: action.projectVersion,
});

export const detectDuplicateNavigationNeed = (left: SelectedNavigationAction, right: SelectedNavigationAction) => navigationQuestionIdentity(left, "ANY") === navigationQuestionIdentity(right, "ANY");

export const detectDuplicateQuestionAction = (action: SelectedNavigationAction, presentation: QuestionPresentationRequest, memory: QueryNavigationMemory) => {
  const identity = navigationQuestionIdentity(action, presentation.expectedAnswerKind);
  return memory.presentations.some((existing) => {
    const selected = memory.selectedActions.find((item) => item.selectedActionId === existing.selectedActionRef);
    return selected ? navigationQuestionIdentity(selected, existing.expectedAnswerKind) === identity : false;
  });
};

export const isNavigationNeedAlreadyResolved = (action: SelectedNavigationAction, memory: QueryNavigationMemory) => action.navigationNeedRefs.some((ref) => memory.resolvedNeedRefs.includes(ref));

export const canPresentNavigationAction = (action: SelectedNavigationAction, memory: QueryNavigationMemory, resumeTriggerRefs: readonly string[] = []) => {
  if (isNavigationNeedAlreadyResolved(action, memory)) return false;
  const state = replayQueryNavigationLifecycle(memory).actionStates[action.selectedActionId];
  if (["COMPLETED", "DECLINED", "SUPERSEDED", "INVALIDATED", "CANCELLED"].includes(state)) return false;
  if (state === "DEFERRED" && !resumeTriggerRefs.length) return false;
  return true;
};

export const inspectNavigationActionFreshness = (action: SelectedNavigationAction, current: { projectVersion: string; sourceStateDigest: string }, lifecycleStatus?: NavigationLifecycleStatus): NavigationFreshness => {
  if (lifecycleStatus === "SUPERSEDED") return { status: "SUPERSEDED", presentationAllowed: false, responsePromotionAllowed: false, reason: "ACTION_SUPERSEDED" };
  if (lifecycleStatus === "INVALIDATED") return { status: "INVALIDATED", presentationAllowed: false, responsePromotionAllowed: false, reason: "ACTION_INVALIDATED" };
  if (action.projectVersion !== current.projectVersion) return { status: "STALE_PROJECT_VERSION", presentationAllowed: false, responsePromotionAllowed: false, reason: "PROJECT_VERSION_CHANGED" };
  if (action.sourceStateDigest !== current.sourceStateDigest) return { status: "STALE_SOURCE_STATE", presentationAllowed: false, responsePromotionAllowed: false, reason: "SOURCE_STATE_CHANGED" };
  return { status: "CURRENT", presentationAllowed: true, responsePromotionAllowed: false, reason: "ACTION_MATCHES_CURRENT_SOURCE_STATE" };
};

export const rebuildNavigationAfterStateChange = (previous: NavigationSelection, nextContext: QueryNavigationContext): NavigationRebuildResult => {
  const preserved = structuredClone(previous.trace);
  const next = selectNextAction(nextContext);
  return {
    previousTraceRef: preserved.traceId,
    previousTracePreserved: preserved,
    nextTrace: next.trace,
    sourceStateChanged: previous.context.sourceStateDigest !== nextContext.sourceStateDigest || previous.context.projectVersion !== nextContext.projectVersion,
  };
};
