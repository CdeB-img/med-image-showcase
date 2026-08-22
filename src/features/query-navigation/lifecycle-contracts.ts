import type { NavigationSelectionTrace, NextActionCandidate, Pd009ActionCategory } from "./contracts";

export const QRY001_LIFECYCLE_VERSION = "1.0.0" as const;

export const NAVIGATION_LIFECYCLE_STATUSES = [
  "SELECTED",
  "PRESENTED",
  "ANSWERED",
  "COMPLETED",
  "DEFERRED",
  "DECLINED",
  "SUPERSEDED",
  "INVALIDATED",
  "CANCELLED",
  "BLOCKED",
  "NOT_APPLICABLE",
] as const;

export type NavigationLifecycleStatus = (typeof NAVIGATION_LIFECYCLE_STATUSES)[number];

export type ExpectedAnswerKind =
  | "FREE_TEXT"
  | "BOOLEAN"
  | "SINGLE_OPTION"
  | "MULTIPLE_OPTIONS"
  | "NUMERIC_WITH_UNIT"
  | "DATE_TIME"
  | "REFERENCE_SELECTION"
  | "HUMAN_REVIEW_DECISION"
  | "ACKNOWLEDGEMENT";

export type SelectedNavigationAction = {
  lifecycleVersion: typeof QRY001_LIFECYCLE_VERSION;
  selectedActionId: string;
  selectionTraceRef: string;
  actionCandidateRef: string;
  projectRef: string;
  projectVersion: string;
  sourceStateDigest: string;
  targetRef: string;
  owner: string;
  actionCategory: Pd009ActionCategory;
  navigationNeedRefs: string[];
  affectedDecisionRefs: string[];
  affectedBranchRefs: string[];
  pd009RuleRefs: string[];
  prerequisites: string[];
  reason: string;
  alternativeCandidateRefs: string[];
  lifecycleStatus: NavigationLifecycleStatus;
  provenanceRefs: string[];
  limitations: string[];
  projectWriteAuthorized: false;
  autoExecutionAuthorized: false;
  sourceOfTruth: false;
  digest: string;
};

export type QuestionPresentationRequest = {
  presentationId: string;
  selectedActionRef: string;
  informationNeedRefs: string[];
  /** Transitional scalar reader kept for QRY-001 compatibility. */
  informationNeedRef: string;
  intent: string;
  targetRef: string;
  expectedAnswerKind: ExpectedAnswerKind;
  answerOwner: string;
  affectedDecisionRefs: string[];
  affectedBranchRefs: string[];
  whyNow: string;
  unknownOrDeferConsequence: string;
  knownOptions: string[];
  contextRefs: string[];
  projectRef: string;
  projectVersion: string;
  provenanceRefs: string[];
  limitations: string[];
  presentationOnly: true;
  wordingOwnedBy: "PD-004";
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

export type NavigationResponseDisposition = "ANSWER" | "DEFER" | "DECLINE" | "CANNOT_ANSWER" | "REQUEST_CLARIFICATION" | "CANCEL";

export type QuestionResponseEnvelope = {
  responseId: string;
  selectedActionRef: string;
  presentationRef: string;
  projectRef: string;
  projectVersionAtPresentation: string;
  responseKind: ExpectedAnswerKind;
  rawResponse: unknown;
  actorRef: string;
  actorRole: string;
  selectedOptionRefs: string[];
  disposition: NavigationResponseDisposition;
  receivedAt: string;
  provenanceRefs: string[];
  rawResponseIsProjectTruth: false;
  projectWriteAuthorized: false;
  digest: string;
};

export type NavigationResponseRoute = {
  routeId: string;
  responseRef: string;
  destination: "SCIENTIFIC_INTERPRETATION" | "HUMAN_DECISION" | "DOMAIN_OWNER" | "NAVIGATION_LIFECYCLE_ONLY" | "REJECTED_STALE_RESPONSE";
  owner: string;
  inputRefs: string[];
  expectedOutputContract: string | null;
  projectWriteAuthorized: false;
  humanDecisionCreated: false;
  scientificParsingPerformed: false;
  reason: string;
};

export type HumanDecisionNavigationTarget = {
  targetId: string;
  sourceActionRef: string;
  decisionTargetRefs: string[];
  alternativeRefs: string[];
  requiredActor: true;
  requiredMandate: true;
  sourceOwner: string;
  boundary: "TARGET_ONLY_HUMAN_DECISION_NOT_CREATED";
  projectWriteAuthorized: false;
};

export type NavigationExecutionRequest = {
  executionRequestId: string;
  selectedActionRef: string;
  executorCapabilityRef: string;
  inputRefs: string[];
  projectRef: string;
  projectVersion: string;
  expectedOutputContract: string;
  humanDecisionRequired: boolean;
  providerSelectionAuthorized: false;
  projectWriteAuthorized: false;
  limitations: string[];
};

export type QueryNavigationLifecycleEvent = {
  eventId: string;
  sequence: number;
  eventType:
    | "ACTION_SELECTED"
    | "ACTION_PRESENTED"
    | "RESPONSE_RECEIVED"
    | "ACTION_DEFERRED"
    | "ACTION_DECLINED"
    | "ACTION_SUPERSEDED"
    | "ACTION_INVALIDATED"
    | "ACTION_COMPLETED"
    | "ACTION_CANCELLED"
    | "ACTION_REOPENED";
  actionRef: string;
  presentationRef: string | null;
  responseRef: string | null;
  projectRef: string;
  projectVersion: string;
  sourceStateDigest: string;
  reason: string;
  evidenceRefs: string[];
  recordedAt: string;
  projectWriteAuthorized: false;
};

export type QueryNavigationMemory = {
  memoryId: string;
  projectRef: string;
  projectVersion: string;
  events: QueryNavigationLifecycleEvent[];
  selectedActions: SelectedNavigationAction[];
  presentations: QuestionPresentationRequest[];
  responses: QuestionResponseEnvelope[];
  resolvedNeedRefs: string[];
  resolutionRefs: string[];
  humanDecisionRefs: string[];
  contributionRefs: string[];
  validationRunRefs: string[];
  previousSelectionTraceRefs: string[];
  persistence: "SESSION_SCOPED" | "EXTERNAL_PERSISTENCE_NOT_CONFIGURED";
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  digest: string;
};

export type NavigationLifecycleReplay = {
  actionStates: Record<string, NavigationLifecycleStatus>;
  lastSequence: number;
  validCausalOrder: boolean;
  digest: string;
};

export type NavigationFreshness = {
  status: "CURRENT" | "STALE_PROJECT_VERSION" | "STALE_SOURCE_STATE" | "SUPERSEDED" | "INVALIDATED";
  presentationAllowed: boolean;
  responsePromotionAllowed: false;
  reason: string;
};

export type NavigationLifecycleValidationResult = {
  valid: boolean;
  errors: Array<{ code: string; path: string; message: string }>;
};

export type NavigationRebuildResult = {
  previousTraceRef: string;
  previousTracePreserved: NavigationSelectionTrace;
  nextTrace: NavigationSelectionTrace;
  sourceStateChanged: boolean;
};

export const candidateIdentityMaterial = (candidate: NextActionCandidate, projectVersion: string) => ({
  actionCategory: candidate.actionCategory,
  targetRef: candidate.targetRef,
  owner: candidate.owner,
  navigationNeedRefs: [...candidate.navigationNeedRefs].sort(),
  affectedDecisionRefs: [...candidate.affectedDecisionRefs].sort(),
  affectedBranchRefs: [...candidate.affectedBranchRefs].sort(),
  projectVersion,
});
