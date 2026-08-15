import type { NavigationSelection, NextActionCandidate } from "./contracts";
import type { QueryNavigationMemory, QuestionPresentationRequest, SelectedNavigationAction } from "./lifecycle-contracts";

export const QRY001_PRODUCT_PROJECTION_VERSION = "1.0.0" as const;

export type QueryNavigationProductStatus =
  | "READY_TO_PRESENT"
  | "WAITING_FOR_HUMAN_REVIEW"
  | "WAITING_FOR_SYSTEM_PREREQUISITE"
  | "DEFERRED"
  | "BLOCKED"
  | "NOT_EVALUABLE"
  | "SUFFICIENT_FOR_CURRENT_STEP"
  | "MULTIPLE_OPTIONS"
  | "REFUSED"
  | "NO_ACTIONABLE_CANDIDATE";

export type QueryNavigationSummary = {
  status: QueryNavigationProductStatus;
  actionLabel: string | null;
  targetRef: string | null;
  owner: string | null;
  reason: string;
  whyNow: string;
  unlockConsequences: string[];
  affectedDecisionRefs: string[];
  affectedBranchRefs: string[];
  deferAllowed: boolean;
  deferConsequence: string | null;
  alternativeCount: number;
  systemPrerequisite: boolean;
};

export type QueryNavigationProductProjection = {
  projectionVersion: typeof QRY001_PRODUCT_PROJECTION_VERSION;
  projectionId: string;
  projectRef: string;
  projectVersion: string;
  sourceStateDigest: string;
  status: QueryNavigationProductStatus;
  summary: QueryNavigationSummary;
  selectedAction: SelectedNavigationAction | null;
  alternatives: NextActionCandidate[];
  questionPresentation: QuestionPresentationRequest | null;
  answerContract: QuestionPresentationRequest["expectedAnswerKind"] | null;
  selection: NavigationSelection;
  memory: QueryNavigationMemory;
  explanation: {
    pd009RuleRefs: string[];
    eligibility: string[];
    informationValue: NextActionCandidate["informationValue"] | null;
    dependencies: string[];
    impacts: string[];
    dominance: NavigationSelection["trace"]["dominanceEdges"];
    traceRef: string;
    traceDigest: string;
    validationRefs: string[];
    provenanceRefs: string[];
    limitations: string[];
  };
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  providerCalls: 0;
  pd011QualificationClaimed: false;
};
