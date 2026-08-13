export const SCIENTIFIC_SEMANTIC_MODEL_VERSION = "1.1" as const;
export const SCIENTIFIC_SEMANTIC_SCHEMA_VERSION = "SEM-001-1.1" as const;
export const SEMANTIC_RECONSTRUCTION_PROMPT_VERSION = "SEM-001-RECONSTRUCTION-1.4" as const;
export const SEMANTIC_CRITIC_PROMPT_VERSION = "SEM-001-CRITIC-1.5" as const;

export const SEMANTIC_ELEMENT_TYPES = [
  "OPERATION",
  "SCIENTIFIC_INTENT",
  "SUBJECT",
  "SCIENTIFIC_OBJECT",
  "ANATOMICAL_CONTEXT",
  "CONDITION",
  "POPULATION",
  "INTERVENTION",
  "COMPARATOR",
  "PHENOMENON",
  "MECHANISM",
  "BIOMARKER",
  "MODALITY",
  "METHOD",
  "ENDPOINT",
  "OUTCOME",
  "TIMING",
  "STUDY_DESIGN",
  "CONSTRAINT",
  "ASSUMPTION",
  "EXPECTED_DIRECTION",
  "MISSING_CONCEPT",
  "ELLIPSIS",
  "AMBIGUITY",
  "UNKNOWN",
  "CONTRADICTION",
] as const;
export type SemanticElementType = (typeof SEMANTIC_ELEMENT_TYPES)[number];

export const SEMANTIC_POLARITIES = ["AFFIRMED", "NEGATED", "UNCERTAIN", "CONDITIONAL"] as const;
export type SemanticPolarity = (typeof SEMANTIC_POLARITIES)[number];

export const SEMANTIC_STUDY_ROLES = [
  "NONE",
  "SUBJECT",
  "INTERVENTION_ARM",
  "COMPARATOR_ARM",
  "REFERENCE_STANDARD",
  "MEASUREMENT",
  "OUTCOME_ROLE",
] as const;
export type SemanticStudyRole = (typeof SEMANTIC_STUDY_ROLES)[number];

export const SEMANTIC_EPISTEMIC_STATUSES = [
  "EXPLICIT_USER_STATED",
  "INFERRED_HIGH_CONFIDENCE",
  "INFERRED_CANDIDATE",
  "SUPPORTED_CANDIDATE",
  "UNSUPPORTED_CANDIDATE",
  "CONFIRMED_BY_USER",
  "REJECTED_BY_USER",
  "UNKNOWN",
  "AMBIGUOUS",
] as const;
export type SemanticEpistemicStatus = (typeof SEMANTIC_EPISTEMIC_STATUSES)[number];

export const PROVIDER_EPISTEMIC_STATUSES = [
  "EXPLICIT_USER_STATED",
  "INFERRED_HIGH_CONFIDENCE",
  "INFERRED_CANDIDATE",
  "UNKNOWN",
  "AMBIGUOUS",
] as const;
export type ProviderEpistemicStatus = (typeof PROVIDER_EPISTEMIC_STATUSES)[number];

export const CRITIC_ISSUE_CODES = [
  "OBJECT_LOSS",
  "RELATION_LOSS",
  "COMPARATOR_LOSS",
  "INTERVENTION_LOSS",
  "MODALITY_LOSS",
  "TIMING_LOSS",
  "OUTCOME_LOSS",
  "UNSUPPORTED_DOMAIN_GENERALIZATION",
  "UNSUPPORTED_SPECIFICITY",
  "UNSUPPORTED_CAUSALITY",
  "UNSUPPORTED_EXPECTED_DIRECTION",
  "UNSUPPORTED_ENDPOINT_PROMOTION",
  "ELLIPSIS_NOT_RESOLVED",
  "AMBIGUITY_HIDDEN",
  "SEMANTIC_COLLAPSE",
  "TYPE_MISMATCH",
  "POLARITY_MISMATCH",
  "EXPLICIT_FRAGMENT_UNMAPPED",
  "EXPLICIT_RELATION_UNMAPPED",
  "EXPLICIT_SOURCE_FRAGMENT_MISSING_FROM_INVENTORY",
] as const;
export type SemanticCriticIssueCode = (typeof CRITIC_ISSUE_CODES)[number];

export const SEMANTIC_CRITIC_CHECKS = [
  "EVERY_EXPLICIT_OBJECT_REPRESENTED",
  "EVERY_COMPARATOR_REPRESENTED",
  "EVERY_INTERVENTION_REPRESENTED",
  "EVERY_MODALITY_REPRESENTED",
  "EVERY_EXPLICIT_RELATION_REPRESENTED",
  "NO_INCOMPATIBLE_OBJECT_TYPE",
  "NO_EXPLICIT_RELATION_WEAKENED",
  "NO_INFERENCE_PROMOTED",
  "NO_AMBIGUITY_HIDDEN",
  "NO_NEGATION_REVERSED_OR_IGNORED",
  "NO_TIMING_LOST",
  "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
  "NO_SPECIFIC_CONCEPT_GENERALIZED",
  "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
  "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
] as const;
export type SemanticCriticCheckCode = (typeof SEMANTIC_CRITIC_CHECKS)[number];

export type SemanticConversationMessage = {
  messageId: string;
  role: "USER" | "NOXIA";
  content: string;
  createdAt: string;
};

export type SemanticInventoryItem = {
  inventoryItemId: string;
  sourceMessageId: string;
  sourceText: string;
  normalizedLabel: string;
  localRole: string;
  polarity: SemanticPolarity;
  modifiers: string[];
  linkedInventoryItemIds: string[];
};

export type SemanticInventoryRelation = {
  inventoryRelationId: string;
  sourceInventoryItemId: string;
  targetInventoryItemId: string;
  sourceMessageId: string;
  sourceText: string;
  normalizedRelation: string;
  polarity: SemanticPolarity;
};

export type SemanticInventory = {
  explicitFragments: SemanticInventoryItem[];
  explicitRelations: SemanticInventoryRelation[];
};

export type ProviderCandidateElement = {
  clientElementId: string;
  type: SemanticElementType;
  canonicalMeaning: string;
  studyRole: SemanticStudyRole;
  polarity: SemanticPolarity;
  inventoryItemIds: string[];
  sourceMessageId: string | null;
  sourceText: string | null;
  epistemicStatus: ProviderEpistemicStatus;
  confidence: number;
  inferenceReason: string | null;
  requiresConfirmation: boolean;
  supersedesElementIds: string[];
};

export type ProviderCandidateRelation = {
  clientRelationId: string;
  sourceClientElementId: string;
  targetClientElementId: string;
  relationType: string;
  polarity: SemanticPolarity;
  inventoryRelationIds: string[];
  epistemicStatus: ProviderEpistemicStatus;
  confidence: number;
  inferenceReason: string | null;
  requiresConfirmation: boolean;
};

export type SemanticRouteProposal = {
  route: "UNDERSTAND" | "FORMALIZE_IDEA" | "DESIGN_STUDY" | "DOCUMENT" | "REVIEW_REROUTE";
  confidence: number;
  reason: string;
  expectedCapabilities: string[];
};

export type SemanticReconstructionCandidate = {
  candidateId: string;
  language: "fr" | "en";
  normalizedMeaning: string;
  summaryForUser: string;
  semanticInventory: SemanticInventory;
  elements: ProviderCandidateElement[];
  relations: ProviderCandidateRelation[];
  missingConcepts: string[];
  ellipses: string[];
  ambiguities: string[];
  unknowns: string[];
  contradictions: string[];
  knowledgeRequests: Array<{ elementClientIds: string[]; purpose: string }>;
  clarificationCandidates: Array<{ question: string; reason: string; resolvesClientElementIds: string[] }>;
  routeProposal: SemanticRouteProposal;
  semanticWarnings: string[];
};

export type ExplicitCoverageEntry = {
  inventoryItemId: string;
  sourceMessageId: string;
  sourceText: string;
  normalizedMeaning: string;
  mappedClientElementIds: string[];
  mappedClientRelationIds: string[];
  coverageStatus: "MAPPED" | "UNRESOLVED_EXPLICIT_FRAGMENT";
  reason: string;
};

export type ExplicitCoverageReport = {
  status: "COMPLETE" | "INCOMPLETE";
  entries: ExplicitCoverageEntry[];
};

export type RelationCoverageEntry = {
  inventoryRelationId: string;
  sourceInventoryItemId: string;
  targetInventoryItemId: string;
  normalizedRelation: string;
  mappedClientRelationIds: string[];
  coverageStatus: "MAPPED" | "EXPLICIT_RELATION_UNMAPPED";
  reason: string;
};

export type RelationCoverageReport = {
  status: "COMPLETE" | "INCOMPLETE";
  entries: RelationCoverageEntry[];
};

export type SemanticTaxonomyFinding = {
  code: "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD" | "ARM_JUDGING_VARIABLE_NOT_ENDPOINT" | "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT" | "UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION" | "IMAGING_FAMILY_TYPED_AS_METHOD" | "FIELD_STRENGTH_TYPED_AS_METHOD" | "MAPPING_TECHNIQUE_TYPED_AS_BIOMARKER" | "METHODOLOGICAL_OBJECTIVE_TYPED_AS_OUTCOME" | "TARGET_TYPED_AS_BIOMARKER" | "AGGREGATE_COMPARATOR_ROLE_MISSING" | "CHANGE_REQUEST_TYPED_AS_TIMING" | "INTERVENTION_ROLE_TYPED_AS_METHOD" | "MODIFICATION_TARGET_NOT_OUTCOME" | "MEASURED_TARGET_TYPED_AS_PHENOMENON" | "STUDY_SETTING_TYPED_AS_POPULATION" | "UNSELECTED_COMPARATOR_NOT_UNKNOWN" | "PARTICIPANT_GROUP_TYPED_AS_CONDITION";
  clientElementId: string;
  currentType: SemanticElementType;
  expectedType: SemanticElementType;
  expectedStudyRole: SemanticStudyRole;
  expectedPolarity?: SemanticPolarity;
  reason: string;
};

export type SemanticTaxonomyReport = {
  status: "COMPLETE" | "INCOMPLETE";
  findings: SemanticTaxonomyFinding[];
};

export type SemanticIntegrityFinding = {
  code: "INVENTORY_FRAGMENT_SOURCE_NOT_CONTIGUOUS" | "INVENTORY_RELATION_SOURCE_NOT_CONTIGUOUS" | "EXPLICIT_ELEMENT_SOURCE_NOT_CONTIGUOUS" | "RELATION_INVENTORY_ENDPOINT_MISMATCH" | "RELATION_POLARITY_MISMATCH" | "RELATION_DIRECTION_OR_ROLE_MISMATCH";
  inventoryItemId: string | null;
  inventoryRelationId: string | null;
  clientElementId: string | null;
  clientRelationId: string | null;
  reason: string;
};

export type SemanticIntegrityReport = {
  status: "COMPLETE" | "INCOMPLETE";
  findings: SemanticIntegrityFinding[];
};

export type SemanticCriticIssue = {
  code: SemanticCriticIssueCode;
  severity: "INFO" | "WARNING" | "CRITICAL";
  elementClientIds: string[];
  description: string;
  recommendedAction: string;
  resolved: boolean;
};

export type SemanticCriticCheck = {
  check: SemanticCriticCheckCode;
  result: "PASS" | "FAIL" | "NOT_APPLICABLE";
  evidence: string;
};

export type SemanticCriticRepair = {
  repairId: string;
  action: "UPSERT_INVENTORY_FRAGMENT" | "UPSERT_INVENTORY_RELATION" | "UPSERT_ELEMENT" | "UPSERT_RELATION" | "ADD_AMBIGUITY" | "SET_ROUTE";
  reason: string;
  sourceInventoryItemIds: string[];
  sourceInventoryRelationIds: string[];
  inventoryItemId?: string | null;
  inventorySourceMessageId?: string | null;
  inventorySourceText?: string | null;
  inventoryNormalizedLabel?: string | null;
  inventoryLocalRole?: string | null;
  inventoryPolarity?: SemanticPolarity | null;
  inventoryModifiers?: string[];
  inventoryLinkedItemIds?: string[];
  inventoryRelationId?: string | null;
  inventoryRelationSourceItemId?: string | null;
  inventoryRelationTargetItemId?: string | null;
  inventoryRelationSourceMessageId?: string | null;
  inventoryRelationSourceText?: string | null;
  inventoryNormalizedRelation?: string | null;
  inventoryRelationPolarity?: SemanticPolarity | null;
  elementClientElementId: string | null;
  elementType: SemanticElementType | null;
  elementCanonicalMeaning: string | null;
  elementStudyRole: SemanticStudyRole | null;
  elementPolarity: SemanticPolarity | null;
  elementInventoryItemIds: string[];
  elementSourceMessageId: string | null;
  elementSourceText: string | null;
  elementEpistemicStatus: ProviderEpistemicStatus | null;
  elementConfidence: number | null;
  elementInferenceReason: string | null;
  elementRequiresConfirmation: boolean | null;
  elementSupersedesElementIds: string[];
  relationClientRelationId: string | null;
  relationSourceClientElementId: string | null;
  relationTargetClientElementId: string | null;
  relationType: string | null;
  relationPolarity: SemanticPolarity | null;
  relationInventoryRelationIds: string[];
  relationEpistemicStatus: ProviderEpistemicStatus | null;
  relationConfidence: number | null;
  relationInferenceReason: string | null;
  relationRequiresConfirmation: boolean | null;
  ambiguity: string | null;
  route: SemanticRouteProposal["route"] | null;
  routeConfidence: number | null;
  routeReason: string | null;
  routeExpectedCapabilities: string[];
};

export type MissingExplicitSourceFragment = {
  sourceMessageId: string;
  sourceText: string;
  normalizedMeaning: string;
  reason: string;
  suggestedLocalRole: string;
  confidence: number;
};

export type SemanticCriticResult = {
  criticId: string;
  verdict: "ACCEPT" | "REVISE" | "CLARIFICATION_REQUIRED";
  checklist: SemanticCriticCheck[];
  missingExplicitSourceFragments: MissingExplicitSourceFragment[];
  issues: SemanticCriticIssue[];
  proposedRepairs: SemanticCriticRepair[];
  criticSummary: string;
};

export type SemanticSourceSpan = {
  messageId: string;
  text: string;
  start: number;
  end: number;
};

export type SemanticKnowledgeSupport = {
  status: "NOT_CHECKED" | "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" | "CONFLICTING" | "KNOWLEDGE_GAP";
  resultRef: string | null;
  assertionRefs: string[];
  gapRefs: string[];
  checkedAt: string | null;
};

export const SEMANTIC_PROVIDER_FAILURE_CATEGORIES = [
  "AUTHENTICATION",
  "INVALID_MODEL",
  "RATE_LIMIT",
  "QUOTA",
  "TIMEOUT",
  "NETWORK",
  "SERVER_ERROR",
  "INVALID_STRUCTURED_OUTPUT",
  "SCHEMA_REJECTION",
  "PROMPT_TOO_LARGE",
  "SAFETY_REFUSAL",
  "CLIENT_ERROR",
  "UNKNOWN_PROVIDER_FAILURE",
] as const;

export type SemanticProviderFailureCategory = typeof SEMANTIC_PROVIDER_FAILURE_CATEGORIES[number];

export type SemanticProviderAttempt = {
  attempt: number;
  requestStarted: string;
  requestFinished: string;
  latencyMs: number;
  outcome: "SUCCESS" | "FAILED";
  category: SemanticProviderFailureCategory | null;
  httpStatus: number | null;
  providerStatus: string | null;
  providerCode: string | null;
  providerError: string | null;
  retryable: boolean;
};

export type SemanticElement = {
  semanticElementId: string;
  type: SemanticElementType;
  canonicalMeaning: string;
  studyRole: SemanticStudyRole;
  polarity: SemanticPolarity;
  inventoryItemIds: string[];
  sourceSpan: SemanticSourceSpan | null;
  epistemicStatus: SemanticEpistemicStatus;
  confidence: number;
  relationships: string[];
  inferenceReason: string | null;
  knowledgeSupport: SemanticKnowledgeSupport;
  requiresConfirmation: boolean;
  provenance: {
    source: "USER_LANGUAGE" | "LLM_INFERENCE" | "USER_CORRECTION" | "DETERMINISTIC_CARRY_FORWARD";
    messageId: string | null;
    providerCallId: string | null;
    rawElementId: string | null;
  };
  supersedesElementIds: string[];
  version: number;
};

export type SemanticRelation = {
  semanticRelationId: string;
  sourceElementId: string;
  targetElementId: string;
  relationType: string;
  polarity: SemanticPolarity;
  inventoryRelationIds: string[];
  vocabularyStatus: "RUNTIME_CANDIDATE_RELATION";
  epistemicStatus: SemanticEpistemicStatus;
  confidence: number;
  inferenceReason: string | null;
  requiresConfirmation: boolean;
  version: number;
};

export type SemanticExecutionSnapshot = {
  provider: string;
  model: string;
  reconstructionPromptVersion: typeof SEMANTIC_RECONSTRUCTION_PROMPT_VERSION;
  criticPromptVersion: typeof SEMANTIC_CRITIC_PROMPT_VERSION;
  schemaVersion: typeof SCIENTIFIC_SEMANTIC_SCHEMA_VERSION;
  reconstructionCallId: string;
  criticCallId: string;
  criticCallIds: string[];
  reconstructionAttempts: SemanticProviderAttempt[];
  criticAttempts: SemanticProviderAttempt[];
  rawReconstruction: SemanticReconstructionCandidate;
  rawCritic: SemanticCriticResult;
  rawCritics: SemanticCriticResult[];
  temperature: number | null;
  executedAt: string;
};

export type SemanticModelHistoryEntry = {
  modelId: string;
  revision: number;
  digest: string;
  status: ScientificSemanticModel["status"];
  changedAt: string;
  changeReason: string;
};

export type ScientificSemanticModel = {
  semanticModelVersion: typeof SCIENTIFIC_SEMANTIC_MODEL_VERSION;
  semanticModelId: string;
  digest: string;
  revision: number;
  status: "CANDIDATE" | "CLARIFICATION_REQUIRED" | "ACCEPTED" | "SEMANTIC_RECONSTRUCTION_DEGRADED";
  originalRequest: string;
  normalizedMeaning: string;
  conversationMessageIds: string[];
  elements: SemanticElement[];
  relations: SemanticRelation[];
  explicitCoverageReport: ExplicitCoverageReport;
  relationCoverageReport: RelationCoverageReport;
  missingConcepts: string[];
  ellipses: string[];
  ambiguities: string[];
  unknowns: string[];
  contradictions: string[];
  clarificationCandidates: Array<{ question: string; reason: string; resolvesElementIds: string[] }>;
  knowledgeRequests: Array<{ elementIds: string[]; purpose: string }>;
  routeProposal: SemanticRouteProposal;
  summaryForUser: string;
  critic: { verdict: SemanticCriticResult["verdict"]; issues: SemanticCriticIssue[]; summary: string };
  executionSnapshot: SemanticExecutionSnapshot | null;
  knowledgeSnapshot: { resultId: string; resultDigest: string; coverageStatus: string; verifiedAt: string } | null;
  previousModelId: string | null;
  history: SemanticModelHistoryEntry[];
  acceptedAt: string | null;
  acceptanceRecord: { type: "SEMANTIC_INTERPRETATION_ACCEPTED"; acceptedElementIds: string[]; retainedCandidateIds: string[] } | null;
  createdAt: string;
  updatedAt: string;
};

export type SemanticReconstructionRequest = {
  schemaVersion: typeof SCIENTIFIC_SEMANTIC_SCHEMA_VERSION;
  sessionId: string;
  language: "fr" | "en";
  messages: SemanticConversationMessage[];
  previousModel: ScientificSemanticModel | null;
};

export type SemanticReconstructionResponse = {
  mode: "LIVE_LLM" | "DEGRADED";
  model: ScientificSemanticModel;
  providerStatus: "AVAILABLE" | "UNAVAILABLE" | "FAILED_VALIDATION" | "FAILED_CALL";
};

export type SemanticProviderMetadata = {
  provider: string;
  model: string;
  temperature: number | null;
};

export interface ScientificSemanticProvider {
  readonly metadata: SemanticProviderMetadata;
  reconstruct(request: SemanticReconstructionRequest): Promise<{ callId: string; candidate: SemanticReconstructionCandidate; attempts?: SemanticProviderAttempt[] }>;
  critique(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    coverage: { explicit: ExplicitCoverageReport; relations: RelationCoverageReport; taxonomy: SemanticTaxonomyReport; integrity?: SemanticIntegrityReport; cycle: 1 | 2 },
  ): Promise<{ callId: string; critic: SemanticCriticResult; attempts?: SemanticProviderAttempt[] }>;
}

export type SemanticApiErrorCode =
  | "METHOD_NOT_ALLOWED"
  | "INVALID_CONTENT_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_REQUEST"
  | "LOCAL_SAFETY_BLOCKED"
  | "ORIGIN_NOT_ALLOWED"
  | "RATE_LIMITED";

export type SemanticApiError = { error: { code: SemanticApiErrorCode; message: string; retryable: boolean } };

export type SemanticWorkspaceSession = {
  sessionVersion: "SEM-001-WORKSPACE-1.0";
  sessionId: string;
  messages: SemanticConversationMessage[];
  currentModel: ScientificSemanticModel | null;
  modelHistory: ScientificSemanticModel[];
  createdAt: string;
  updatedAt: string;
};
