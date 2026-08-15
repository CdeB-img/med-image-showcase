import { inspectNavigationActionFreshness } from "@/features/query-navigation/lifecycle";
import type { NavigationResponseDisposition, QuestionResponseEnvelope } from "@/features/query-navigation/lifecycle-contracts";
import { buildHumanDecisionTargetFromNavigationAction, buildQuestionResponseEnvelope, routeNavigationResponse } from "@/features/query-navigation/response-routing";
import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";

export const UX001_WORKSPACE_INTERACTION_VERSION = "1.0.0" as const;

export type WorkspaceResponseState =
  | "READY"
  | "RECEIVED"
  | "INTERPRETATION_PENDING"
  | "HUMAN_REVIEW_REQUIRED"
  | "OWNER_ACTION_PENDING"
  | "DEFERRED"
  | "DECLINED"
  | "UNKNOWN_PRESERVED"
  | "STALE_BLOCKED";

export type WorkspaceInteractionHandoff = {
  interactionVersion: typeof UX001_WORKSPACE_INTERACTION_VERSION;
  handoffId: string;
  sourceActionRef: string;
  sourceProjectRef: string;
  sourceProjectVersion: string;
  sourceStateDigest: string;
  targetRef: string;
  answerOwner: string;
  response: QuestionResponseEnvelope;
  route: ReturnType<typeof routeNavigationResponse>;
  state: WorkspaceResponseState;
  rawResponsePreserved: true;
  responseIsProjectTruth: false;
  contributionAdopted: false;
  humanDecisionCreated: false;
  projectWriteAuthorized: false;
  validationWriteAuthorized: false;
  providerCalls: 0;
};
export type WorkspaceResponseInput = {
  projection: Readonly<QueryNavigationProductProjection>;
  currentProjectVersion: string;
  currentSourceStateDigest: string;
  disposition: NavigationResponseDisposition;
  rawResponse: unknown;
  selectedOptionRefs?: string[];
  actorRef: string;
  actorRole: string;
  receivedAt: string;
  responseId: string;
};

const stateFor = (disposition: NavigationResponseDisposition, destination: WorkspaceInteractionHandoff["route"]["destination"]): WorkspaceResponseState => {
  if (destination === "REJECTED_STALE_RESPONSE") return "STALE_BLOCKED";
  if (disposition === "DEFER") return "DEFERRED";
  if (disposition === "DECLINE" || disposition === "CANCEL") return "DECLINED";
  if (disposition === "CANNOT_ANSWER") return "UNKNOWN_PRESERVED";
  if (destination === "SCIENTIFIC_INTERPRETATION") return "INTERPRETATION_PENDING";
  if (destination === "HUMAN_DECISION") return "HUMAN_REVIEW_REQUIRED";
  return "OWNER_ACTION_PENDING";
};

export const createWorkspaceInteractionHandoff = (input: WorkspaceResponseInput): WorkspaceInteractionHandoff => {
  const action = input.projection.selectedAction;
  const presentation = input.projection.questionPresentation;
  if (!action || !presentation) throw new Error("UX_WORKSPACE_PRESENTABLE_ACTION_REQUIRED");
  const freshness = inspectNavigationActionFreshness(action, { projectVersion: input.currentProjectVersion, sourceStateDigest: input.currentSourceStateDigest });
  const response = buildQuestionResponseEnvelope({
    responseId: input.responseId,
    selectedActionRef: action.selectedActionId,
    presentationRef: presentation.presentationId,
    projectRef: action.projectRef,
    projectVersionAtPresentation: action.projectVersion,
    responseKind: presentation.expectedAnswerKind,
    rawResponse: structuredClone(input.rawResponse),
    actorRef: input.actorRef,
    actorRole: input.actorRole,
    selectedOptionRefs: [...(input.selectedOptionRefs ?? [])],
    disposition: input.disposition,
    receivedAt: input.receivedAt,
    provenanceRefs: [presentation.presentationId, ...presentation.provenanceRefs],
  });
  const route = routeNavigationResponse(action, presentation, response, freshness);
  return {
    interactionVersion: "1.0.0",
    handoffId: `workspace-handoff:${response.responseId}`,
    sourceActionRef: action.selectedActionId,
    sourceProjectRef: action.projectRef,
    sourceProjectVersion: action.projectVersion,
    sourceStateDigest: action.sourceStateDigest,
    targetRef: action.targetRef,
    answerOwner: presentation.answerOwner,
    response,
    route,
    state: stateFor(input.disposition, route.destination),
    rawResponsePreserved: true,
    responseIsProjectTruth: false,
    contributionAdopted: false,
    humanDecisionCreated: false,
    projectWriteAuthorized: false,
    validationWriteAuthorized: false,
    providerCalls: 0,
  };
};

export const buildWorkspaceHumanDecisionTarget = (projection: Readonly<QueryNavigationProductProjection>, actorRef: string, mandateRef: string) => {
  if (!projection.selectedAction) throw new Error("UX_WORKSPACE_SELECTED_ACTION_REQUIRED");
  return buildHumanDecisionTargetFromNavigationAction(projection.selectedAction, actorRef, mandateRef);
};

export const inspectWorkspaceInteractionFreshness = (projection: Readonly<QueryNavigationProductProjection>, currentProjectVersion: string, currentSourceStateDigest: string) => projection.selectedAction
  ? inspectNavigationActionFreshness(projection.selectedAction, { projectVersion: currentProjectVersion, sourceStateDigest: currentSourceStateDigest })
  : { status: "CURRENT" as const, presentationAllowed: true, responsePromotionAllowed: false as const, reason: "NO_SELECTED_ACTION" };

export const deduplicateWorkspaceAttentionBySource = <T extends { sourceRef: string }>(items: readonly T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.sourceRef)) return false;
    seen.add(item.sourceRef);
    return true;
  }).map((item) => structuredClone(item));
};
