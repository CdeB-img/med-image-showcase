export const QRY001_CONTRACT_VERSION = "1.0.0" as const;
export const QRY001_POLICY_VERSION = "PD-009-1.0" as const;

export const PD009_ACTION_CATEGORIES = [
  "CLARIFY_BY_ADAPTIVE_EXCHANGE",
  "BUILD_OR_REVISE_OBJECT",
  "COMPARE_OPTIONS",
  "TRIGGER_METHODOLOGICAL_REVIEW",
  "REQUEST_HUMAN_DECISION",
  "PRODUCE_PROVISIONAL_PROJECTION",
  "SUSPEND_OR_STOP",
  "REFUSE_PROTOCOL_PROJECTION",
] as const;

export type Pd009ActionCategory = (typeof PD009_ACTION_CATEGORIES)[number];

export const PD009_ACTION_LABELS: Record<Pd009ActionCategory, string> = {
  CLARIFY_BY_ADAPTIVE_EXCHANGE: "Clarifier par un Échange adaptatif",
  BUILD_OR_REVISE_OBJECT: "Construire ou réviser un objet",
  COMPARE_OPTIONS: "Comparer des Options",
  TRIGGER_METHODOLOGICAL_REVIEW: "Déclencher une Revue méthodologique",
  REQUEST_HUMAN_DECISION: "Demander une Décision humaine",
  PRODUCE_PROVISIONAL_PROJECTION: "Produire une Projection provisoire",
  SUSPEND_OR_STOP: "Suspendre ou arrêter",
  REFUSE_PROTOCOL_PROJECTION: "Refuser une projection protocolaire",
};

export type NavigationSourceType =
  | "PROJECT_MISSING_INFORMATION"
  | "PROJECT_UNKNOWN"
  | "PROJECT_AMBIGUITY"
  | "PROJECT_CONTRADICTION"
  | "DATA_NEED_STATE"
  | "STUDY_DATA_DECISION_REQUIREMENT"
  | "DATA_MANAGEMENT_DECISION_REQUIREMENT"
  | "BIOSTATISTICS_DECISION_REQUIREMENT"
  | "VALIDATION_FINDING"
  | "VALIDATION_HUMAN_REVIEW_REQUEST"
  | "VALIDATION_SEMANTIC_REVIEW_REQUEST"
  | "VALIDATION_GATE"
  | "DOMAIN_READINESS"
  | "DOCUMENT_GENERABILITY"
  | "KNOWLEDGE_GAP";

export type NavigationActionability =
  | "USER_ANSWERABLE"
  | "HUMAN_EXPERT_REVIEW"
  | "DOMAIN_OWNER_ACTION"
  | "SYSTEM_ACTION"
  | "EXTERNAL_EVIDENCE_ACTION"
  | "NOT_ACTIONABLE_NOW"
  | "DEFERRED";

export type NavigationBlockingState =
  | "ABSOLUTE_REFUSAL"
  | "BLOCKS_IRREVERSIBLE_DECISION"
  | "BLOCKS_CURRENT_BRANCH"
  | "NON_BLOCKING"
  | "UNKNOWN";

export type InformationValueVector = {
  blocking: NavigationBlockingState;
  discrimination: "SEPARATES_ACTIVE_OPTIONS" | "MAY_CHANGE_DECISION" | "NO_DECISION_EFFECT" | "UNKNOWN";
  impactScope: "CROSS_BRANCH" | "MULTIPLE_CRITICAL_OBJECTS" | "SINGLE_BRANCH" | "LOCAL" | "UNKNOWN";
  reducibility: "AVAILABLE_NOW" | "AVAILABLE_WITH_OWNER" | "NOT_ACTIONABLE_NOW" | "UNKNOWN";
  irreversibility: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | "NOT_AVAILABLE";
  temporalUrgency: "TIME_CRITICAL" | "TIME_BOUND" | "NOT_TIME_BOUND" | "UNKNOWN" | "NOT_AVAILABLE";
  burden: "LOW" | "MODERATE" | "HIGH" | "UNKNOWN" | "NOT_AVAILABLE";
  sensitivityRisk: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "UNKNOWN" | "NOT_AVAILABLE";
  pedagogicalValue: "DECISION_EXPLANATION_REQUIRED" | "USEFUL" | "LIMITED" | "UNKNOWN" | "NOT_AVAILABLE";
};

export type NavigationProvenance = {
  sourceRefs: string[];
  owner: string;
  evidence: string[];
  limitations: string[];
};

export type NavigationNeed = {
  needId: string;
  sourceRef: string;
  sourceType: NavigationSourceType;
  sourceVersion: string;
  sourceObjectKind: string;
  owner: string;
  informationIntent: string;
  affectedDecisionRefs: string[];
  affectedBranchRefs: string[];
  blocking: NavigationBlockingState;
  actionability: NavigationActionability;
  status: "OPEN" | "DEFERRED" | "RESOLVED" | "NOT_APPLICABLE";
  availableFromOwner: string | null;
  knownOptions: string[];
  provenance: NavigationProvenance;
  limitations: string[];
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

export type NavigationDependency = {
  dependencyId: string;
  prerequisiteRef: string;
  dependentRef: string;
  kind: "PROJECT_GRAPH" | "IMPACT_GRAPH" | "DAI_IMPACT" | "VAL_AFFECTED_BRANCH" | "VAL_AFFECTED_GATE" | "RDE_WORKFLOW";
  status: "OPEN" | "SATISFIED" | "DEFERRED" | "UNKNOWN";
  sourceRef: string;
};

export type NavigationImpact = {
  impactId: string;
  candidateRef: string;
  branchRefs: string[];
  decisionRefs: string[];
  gateRefs: string[];
  consequence: string;
  kind: "DOWNSTREAM" | "DEFER";
};

export type NextActionCandidate = {
  candidateId: string;
  actionCategory: Pd009ActionCategory;
  actionLabel: string;
  pd009RuleRefs: string[];
  targetRef: string;
  owner: string;
  sourceRefs: string[];
  navigationNeedRefs: string[];
  affectedDecisionRefs: string[];
  affectedBranchRefs: string[];
  informationValue: InformationValueVector;
  eligibility: "ELIGIBLE" | "INELIGIBLE" | "DEFERRED" | "NOT_APPLICABLE";
  eligibilityReasons: string[];
  dependencies: NavigationDependency[];
  impacts: NavigationImpact[];
  deferConsequence: string | null;
  explanation: string;
  capabilityRef: string | null;
  provenance: NavigationProvenance;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

export type ValidationGateSignal = {
  gateId: string;
  status: "ALLOWED" | "ALLOWED_WITH_LIMITATIONS" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_EVALUABLE" | "PREVIEW_ONLY";
  runRefs: string[];
  findingRefs: string[];
  reviewRequestRefs: string[];
  affectedBranchRefs: string[];
  owner: string;
  reason: string;
};

export type DomainReadinessSignal = {
  readinessId: string;
  owner: string;
  sourceVersion: string;
  status: "BLOCKER" | "WARNING" | "UNKNOWN" | "DECISION_REQUIRED" | "NOT_APPLICABLE" | "DEFERRED_TO_REALIZED_TIME" | "READY";
  affectedBranchRefs: string[];
  decisionRefs: string[];
  reason: string;
  sourceRef: string;
};

export type DocumentGenerabilitySignal = {
  projectionRef: string;
  sourceVersion: string;
  status: "GENERATABLE" | "PARTIALLY_GENERATABLE" | "NOT_GENERATABLE" | "BLOCKED" | "NOT_APPLICABLE" | "UNKNOWN" | "FUTURE";
  owner: string;
  affectedBranchRefs: string[];
  reason: string;
  ruleRef: string | null;
  resumeCondition: string | null;
};

export type QueryNavigationSourceState = {
  projectUnknowns: Array<{ ref: string; version: string; intent: string; owner: string; decisionRefs: string[]; branchRefs: string[]; knownOptions?: string[] }>;
  projectAmbiguities: Array<{ ref: string; version: string; intent: string; owner: string; decisionRefs: string[]; branchRefs: string[]; knownOptions?: string[] }>;
  projectContradictions: Array<{ ref: string; version: string; intent: string; owner: string; decisionRefs: string[]; branchRefs: string[] }>;
  dataNeeds: Array<{ dataNeedId: string; version: string; owner: string; openInformationIntent: string | null; decisionRefs: string[]; branchRefs: string[] }>;
  planningDecisionRequirements: Array<{
    ref: string;
    version: string;
    domain: "STUDY_DATA" | "DATA_MANAGEMENT" | "BIOSTATISTICS";
    owner: string;
    intent: string;
    decisionRefs: string[];
    branchRefs: string[];
    blockingLevel: string;
    knownOptions: string[];
  }>;
  validationFindings: Array<{ ref: string; version: string; owner: string; reason: string; blocking: boolean; decisionRefs: string[]; branchRefs: string[] }>;
  validationHumanReviews: Array<{ ref: string; version: string; owner: string; reason: string; blocking: boolean; decisionRefs: string[]; branchRefs: string[] }>;
  validationSemanticReviews: Array<{ ref: string; version: string; owner: string; reason: string; blocking: boolean; providerPolicy: "DISABLED_BY_DEFAULT" | "CONTRACT_ONLY"; decisionRefs: string[]; branchRefs: string[] }>;
  validationGates: ValidationGateSignal[];
  readiness: DomainReadinessSignal[];
  documentGenerability: DocumentGenerabilitySignal[];
  knowledgeGaps: Array<{ ref: string; version: string; owner: string; intent: string; decisionRefs: string[]; branchRefs: string[]; evidenceGap: boolean }>;
  dependencies: NavigationDependency[];
};

export type QueryNavigationContext = {
  contractVersion: typeof QRY001_CONTRACT_VERSION;
  contextId: string;
  contextDigest: string;
  projectRef: string;
  projectVersion: string;
  sourceStateDigest: string;
  sourceState: QueryNavigationSourceState;
  closedBranchRefs: string[];
  resolvedNeedRefs: string[];
  currentUsageRef: string;
  sufficiencyEvidenceRefs: string[];
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  reconstructible: true;
  limitations: string[];
};

export type NavigationSelectionTrace = {
  traceId: string;
  contextRef: string;
  sourceStateDigest: string;
  policyVersion: typeof QRY001_POLICY_VERSION;
  candidateRefs: string[];
  eligibleCandidateRefs: string[];
  comparisonOrder: string[];
  dominanceEdges: Array<{ dominantRef: string; dominatedRef: string; reason: string }>;
  nonDominatedCandidateRefs: string[];
  selectedCandidateRef: string | null;
  outcome:
    | "UNIQUE_ACTION_SELECTED"
    | "MULTIPLE_NON_DOMINATED_ACTIONS"
    | "HUMAN_CHOICE_REQUIRED"
    | "NO_ACTIONABLE_CANDIDATE"
    | "BLOCKED"
    | "DEFERRED"
    | "SUFFICIENT_FOR_CURRENT_STEP"
    | "REFUSED";
  explanations: string[];
  arbitraryScoreUsed: false;
  arbitraryTieBreakUsed: false;
  projectWriteAuthorized: false;
  digest: string;
};

export type NavigationSelection = {
  context: QueryNavigationContext;
  needs: NavigationNeed[];
  candidates: NextActionCandidate[];
  selected: NextActionCandidate | null;
  nonDominated: NextActionCandidate[];
  trace: NavigationSelectionTrace;
};

export type QueryNavigationValidationIssue = {
  code: string;
  message: string;
  path: string;
  blocking: boolean;
};

export type QueryNavigationValidationResult = {
  valid: boolean;
  issues: QueryNavigationValidationIssue[];
};
