import { makeLifecycleId, computeQuestionResponseDigest } from "./lifecycle-canonical";
import type {
  HumanDecisionNavigationTarget,
  NavigationExecutionRequest,
  NavigationFreshness,
  NavigationResponseRoute,
  QuestionPresentationRequest,
  QuestionResponseEnvelope,
  SelectedNavigationAction,
} from "./lifecycle-contracts";

export type QuestionResponseInput = Omit<QuestionResponseEnvelope, "digest" | "rawResponseIsProjectTruth" | "projectWriteAuthorized">;

export const buildQuestionResponseEnvelope = (input: QuestionResponseInput): QuestionResponseEnvelope => {
  const response: QuestionResponseEnvelope = {
    ...structuredClone(input),
    rawResponseIsProjectTruth: false,
    projectWriteAuthorized: false,
    digest: "",
  };
  response.digest = computeQuestionResponseDigest(response);
  return response;
};

export const routeNavigationResponse = (action: SelectedNavigationAction, presentation: QuestionPresentationRequest, response: QuestionResponseEnvelope, freshness: NavigationFreshness): NavigationResponseRoute => {
  if (freshness.status !== "CURRENT") return {
    routeId: makeLifecycleId("route", { responseRef: response.responseId, destination: "REJECTED_STALE_RESPONSE" }),
    responseRef: response.responseId,
    destination: "REJECTED_STALE_RESPONSE",
    owner: "QUERY_NAVIGATION",
    inputRefs: [response.responseId, action.selectedActionId],
    expectedOutputContract: null,
    projectWriteAuthorized: false,
    humanDecisionCreated: false,
    scientificParsingPerformed: false,
    reason: freshness.reason,
  };
  if (response.disposition !== "ANSWER") return {
    routeId: makeLifecycleId("route", { responseRef: response.responseId, destination: "NAVIGATION_LIFECYCLE_ONLY", disposition: response.disposition }),
    responseRef: response.responseId,
    destination: "NAVIGATION_LIFECYCLE_ONLY",
    owner: "QUERY_NAVIGATION",
    inputRefs: [response.responseId],
    expectedOutputContract: null,
    projectWriteAuthorized: false,
    humanDecisionCreated: false,
    scientificParsingPerformed: false,
    reason: response.disposition,
  };
  const destination = presentation.expectedAnswerKind === "FREE_TEXT"
    ? "SCIENTIFIC_INTERPRETATION" as const
    : presentation.expectedAnswerKind === "HUMAN_REVIEW_DECISION" || ["SINGLE_OPTION", "MULTIPLE_OPTIONS"].includes(presentation.expectedAnswerKind)
      ? "HUMAN_DECISION" as const
      : "DOMAIN_OWNER" as const;
  return {
    routeId: makeLifecycleId("route", { responseRef: response.responseId, destination }),
    responseRef: response.responseId,
    destination,
    owner: destination === "HUMAN_DECISION" ? "HUMAN_DECISION" : destination === "SCIENTIFIC_INTERPRETATION" ? "SCIENTIFIC_INTERPRETATION" : action.owner,
    inputRefs: [response.responseId, presentation.presentationId, action.selectedActionId],
    expectedOutputContract: destination === "SCIENTIFIC_INTERPRETATION" ? "ScientificInterpretationContribution" : destination === "HUMAN_DECISION" ? "HumanDecisionEnvelope" : "DOMAIN_OWNER_RESULT",
    projectWriteAuthorized: false,
    humanDecisionCreated: false,
    scientificParsingPerformed: false,
    reason: "ROUTED_BY_ACTION_AND_ANSWER_CONTRACT_NOT_RESPONSE_CONTENT",
  };
};

export const buildHumanDecisionTargetFromNavigationAction = (action: SelectedNavigationAction, actorRef: string, mandateRef: string): HumanDecisionNavigationTarget => {
  if (!actorRef) throw new Error("QRY_HUMAN_DECISION_ACTOR_REQUIRED");
  if (!mandateRef) throw new Error("QRY_HUMAN_DECISION_MANDATE_REQUIRED");
  return {
    targetId: makeLifecycleId("human-decision-target", { actionRef: action.selectedActionId, decisions: action.affectedDecisionRefs, actorRef, mandateRef }),
    sourceActionRef: action.selectedActionId,
    decisionTargetRefs: [...action.affectedDecisionRefs],
    alternativeRefs: [...action.alternativeCandidateRefs],
    requiredActor: true,
    requiredMandate: true,
    sourceOwner: action.owner,
    boundary: "TARGET_ONLY_HUMAN_DECISION_NOT_CREATED",
    projectWriteAuthorized: false,
  };
};

export const buildNavigationExecutionRequest = (action: SelectedNavigationAction, executorCapabilityRef: string, expectedOutputContract: string): NavigationExecutionRequest => ({
  executionRequestId: makeLifecycleId("execution-request", { actionRef: action.selectedActionId, executorCapabilityRef, expectedOutputContract }),
  selectedActionRef: action.selectedActionId,
  executorCapabilityRef,
  inputRefs: [...action.provenanceRefs],
  projectRef: action.projectRef,
  projectVersion: action.projectVersion,
  expectedOutputContract,
  humanDecisionRequired: action.actionCategory === "REQUEST_HUMAN_DECISION" || action.actionCategory === "COMPARE_OPTIONS",
  providerSelectionAuthorized: false,
  projectWriteAuthorized: false,
  limitations: [...action.limitations],
});
