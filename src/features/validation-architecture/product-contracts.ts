import type { ValidationSeverity, ValidationStatus } from "./types";

export const VAL001_CONTRACT_VERSION = "1.0.0" as const;
export const VAL001_CANONICALIZATION_VERSION = "VAL001-CANONICAL-1.0.0" as const;
export const VAL001_QUALIFICATION_AUTHORITY = "PD-011" as const;

export const VALIDATION_PRODUCT_ARTIFACT_TYPES = [
  "ORIGINAL_REQUEST",
  "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
  "SCIENTIFIC_THINKING_RESULT",
  "IMAGING_CONTRIBUTION",
  "OBSERVATION_HANDOFF",
  "RESEARCH_PROJECT",
  "STUDY_DATA_PLAN_CONTRIBUTION",
  "DATA_MANAGEMENT_PLANNING_CONTRIBUTION",
  "BIOSTATISTICS_PLANNING_CONTRIBUTION",
  "TEMPLATE_INSTANCE",
  "DOCUMENT_PROJECTION",
  "PROJECT_DATA_ANALYSIS_VIEW",
] as const;

export const VALIDATION_PLANES = [
  "STRUCTURAL",
  "IDENTITY_VERSION",
  "PROVENANCE_LINEAGE",
  "OWNERSHIP",
  "EPISTEMIC",
  "SEMANTIC_FIDELITY",
  "DECISION",
  "PROJECTION",
  "READINESS",
  "REPRODUCIBILITY",
] as const;

export const VALIDATION_EVALUATION_LEVELS = ["DETERMINISTIC", "SEMANTIC_REVIEW", "HUMAN_ARBITRATION"] as const;
export const VALIDATION_OBSERVATION_TYPES = ["PRESERVED", "ADDED", "LOST", "WEAKENED", "STRENGTHENED", "TRANSFORMED", "NON_MAPPED", "CONFLICT", "NOT_APPLICABLE", "NOT_EVALUABLE"] as const;
export const VALIDATION_DISPOSITIONS = ["CONTINUE", "CONTINUE_WITH_WARNING", "REQUIRE_REVIEW", "REQUIRE_CLARIFICATION", "REQUIRE_DOMAIN_OWNER", "REQUIRE_HUMAN_DECISION", "BLOCK_HANDOFF", "FAIL_CLOSED", "NOT_APPLICABLE", "NOT_EVALUABLE"] as const;
export const VALIDATION_TECHNICAL_STATUSES = ["SUCCESS", "ADAPTER_FAILURE", "SCHEMA_FAILURE", "MISSING_ARTIFACT", "DIGEST_FAILURE", "INTERNAL_ERROR", "NOT_RUN"] as const;
export const VALIDATION_SEMANTIC_STATUSES = ["NOT_RUN", "NO_FINDING", "FINDINGS_PRESENT", "REVIEW_REQUIRED", "NOT_EVALUABLE", "NOT_APPLICABLE"] as const;
export const VALIDATION_RUN_STATUSES = ["PENDING", "COMPLETE", "INCOMPLETE"] as const;
export const VALIDATION_CHECKPOINT_IMPLEMENTATION_STATUSES = ["CONTRACT_READY", "IMPLEMENTATION_PENDING", "NOT_APPLICABLE_V1"] as const;
export const VALIDATION_IDENTITY_MATCHES = ["EXACT", "VERSION_DIFFERENT", "DIFFERENT_ID", "MISSING"] as const;
export const SEMANTIC_EQUIVALENCE_ASSESSMENTS = ["NOT_REQUIRED", "PENDING", "EQUIVALENT", "PARTIALLY_EQUIVALENT", "NOT_EQUIVALENT", "AMBIGUOUS", "NOT_EVALUABLE"] as const;

export type ValidationProductArtifactType = (typeof VALIDATION_PRODUCT_ARTIFACT_TYPES)[number];
export type ValidationPlane = (typeof VALIDATION_PLANES)[number];
export type ValidationEvaluationLevel = (typeof VALIDATION_EVALUATION_LEVELS)[number];
export type ValidationObservationType = (typeof VALIDATION_OBSERVATION_TYPES)[number];
export type ValidationDisposition = (typeof VALIDATION_DISPOSITIONS)[number];
export type ValidationTechnicalStatus = (typeof VALIDATION_TECHNICAL_STATUSES)[number];
export type ValidationSemanticStatus = (typeof VALIDATION_SEMANTIC_STATUSES)[number];
export type ValidationRunStatus = (typeof VALIDATION_RUN_STATUSES)[number];
export type ValidationCheckpointImplementationStatus = (typeof VALIDATION_CHECKPOINT_IMPLEMENTATION_STATUSES)[number];
export type IdentityMatch = (typeof VALIDATION_IDENTITY_MATCHES)[number];
export type SemanticEquivalenceAssessment = (typeof SEMANTIC_EQUIVALENCE_ASSESSMENTS)[number];

export type ValidationArtifactReference = {
  artifactId: string;
  artifactType: ValidationProductArtifactType;
  version: string;
  owner: string;
  sourceOfTruth: boolean;
  contentDigest: string | null;
  schemaVersion: string | null;
  projectId: string | null;
  projectVersion: string | null;
  contributionId: string | null;
  projectionId: string | null;
  provenanceRefs: string[];
  immutableForRun: true;
};

export type ValidationSnapshotSemanticObject = {
  objectId: string;
  objectType: string;
  label: string | null;
  status: string;
  owner: string;
  sourceRefs: string[];
  provenanceRefs: string[];
  semanticKey: string | null;
  polarity: string | null;
  role: string | null;
  attributes: Record<string, unknown>;
};

export type ValidationSnapshotRelation = {
  relationId: string;
  sourceObjectId: string;
  targetObjectId: string;
  relationType: string;
  polarity: string | null;
  status: string;
  owner: string;
  sourceRefs: string[];
  provenanceRefs: string[];
};

export type ValidationSnapshotEpistemicState = {
  subjectId: string;
  epistemicStatus: string | null;
  adoptionStatus: string | null;
  activeState: boolean | null;
  sourceRefs: string[];
};

export type ValidationSnapshotDecisionReference = {
  decisionId: string;
  version: string;
  status: string;
  actorPresent: boolean;
  mandatePresent: boolean;
  targetRefs: string[];
  provenanceRefs: string[];
};

export type ValidationArtifactSnapshot = {
  reference: ValidationArtifactReference;
  artifactKind: ValidationProductArtifactType;
  owner: string;
  semanticObjects: ValidationSnapshotSemanticObject[];
  relations: ValidationSnapshotRelation[];
  epistemicStates: ValidationSnapshotEpistemicState[];
  decisions: ValidationSnapshotDecisionReference[];
  unknowns: string[];
  contradictions: string[];
  limitations: string[];
  provenance: string[];
  lineage: string[];
  sourceReferences: string[];
  projectionOnly: true;
  validationProjectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  metadata: Record<string, unknown>;
  snapshotDigest: string;
};

export interface ValidationArtifactAdapter<TSource> {
  readonly adapterId: string;
  readonly adapterVersion: string;
  readonly artifactTypes: readonly ValidationProductArtifactType[];
  accepts(source: unknown): source is TSource;
  buildReference(source: Readonly<TSource>): ValidationArtifactReference;
  buildSnapshot(source: Readonly<TSource>): ValidationArtifactSnapshot;
  collectApplicableInvariantRefs(source: Readonly<TSource>): string[];
  collectProvenance(source: Readonly<TSource>): string[];
  collectLimitations(source: Readonly<TSource>): string[];
}

export type ValidationCheckpointDefinition = {
  checkpointId: string;
  version: string;
  name: string;
  description: string;
  sourceArtifactTypes: ValidationProductArtifactType[];
  targetArtifactTypes: ValidationProductArtifactType[];
  sourceOwner: string;
  targetOwner: string;
  invariantRefs: string[];
  validationPlanes: ValidationPlane[];
  semanticReviewPolicy: "DISABLED_BY_DEFAULT" | "CONTRACT_ONLY";
  humanReviewPolicy: "NOT_REQUIRED" | "PREPARE_REQUEST_ONLY";
  severityPolicy: "DOMAIN_INVARIANT_POLICY";
  defaultDispositionPolicy: "DOMAIN_POLICY_THEN_CHECKPOINT_POLICY";
  productGateRefs: string[];
  applicableWhen: string[];
  notApplicableWhen: string[];
  limitations: string[];
  implementationStatus: ValidationCheckpointImplementationStatus;
  historicalCheckpointRefs: Array<{ checkpointId: string; version: string; mapping: "UNCHANGED" | "PARTIAL" | "SUPERSEDED" }>;
};

export type ValidationCheckpointRegistry = {
  registryId: "VAL-001-CHECKPOINT-REGISTRY";
  version: string;
  checkpoints: ValidationCheckpointDefinition[];
  digest: string;
  boundary: "DECLARATIVE_CHECKPOINTS_ONLY_NO_VALIDATION_EXECUTION";
};

export type ValidationInvariantReference = {
  invariantId: string;
  version: string | null;
  sourceAuthority: string;
  owner: string;
  shortDescription: string;
  validationPlanes: ValidationPlane[];
  severityDefault: ValidationSeverity;
  applicableCheckpoints: string[];
  machineEvaluable: boolean;
  semanticReviewEligible: boolean;
  humanArbitrationEligible: boolean;
  evaluationLevel: ValidationEvaluationLevel;
  validatorProvider: string;
  domainFailureClassRef: string | null;
  defaultDisposition: ValidationDisposition;
};

export type ValidationInvariantRegistry = {
  registryId: "VAL-001-INVARIANT-REFERENCE-REGISTRY";
  version: string;
  invariants: ValidationInvariantReference[];
  digest: string;
  boundary: "REFERENCES_ONLY_DOMAIN_AUTHORITIES_REMAIN_OWNERS";
};

export type ValidationEvidence = {
  evidenceId: string;
  kind: "SOURCE_PATH" | "TARGET_PATH" | "SOURCE_OBJECT" | "TARGET_OBJECT" | "SOURCE_SPAN" | "RELATION" | "DECISION" | "PROVENANCE" | "DIGEST" | "AUDIT_FINDING" | "DOMAIN_VALIDATOR_RESULT" | "COMPARISON_NOTE";
  sourcePath: string | null;
  targetPath: string | null;
  sourceObjectRef: string | null;
  targetObjectRef: string | null;
  exactSourceSpan: string | null;
  relationRef: string | null;
  decisionRef: string | null;
  provenanceRef: string | null;
  digest: string | null;
  auditFindingRef: string | null;
  domainValidatorResultRef: string | null;
  comparisonNote: string | null;
};

export type ValidationObservation = {
  observationId: string;
  checkpointId: string;
  invariantRef: string;
  plane: ValidationPlane;
  sourceRef: string;
  targetRef: string;
  observationType: ValidationObservationType;
  sourcePath: string | null;
  targetPath: string | null;
  sourceValueRef: string | null;
  targetValueRef: string | null;
  semanticKey: string | null;
  evidence: ValidationEvidence[];
  deterministic: boolean;
  confidenceKind: "DETERMINISTIC" | "SEMANTIC_REVIEW_PENDING" | "HUMAN_ARBITRATION_REQUIRED";
  technicalStatus: ValidationTechnicalStatus;
  limitations: string[];
};

export type ValidationProductFinding = {
  findingId: string;
  checkpointId: string;
  invariantRef: string;
  observationRefs: string[];
  findingClass: string;
  domainFailureClassRef: string | null;
  severity: ValidationSeverity;
  disposition: ValidationDisposition;
  sourceArtifactRef: ValidationArtifactReference;
  targetArtifactRef: ValidationArtifactReference;
  evidence: ValidationEvidence[];
  owner: string;
  reviewOwner: string;
  technicalStatus: ValidationTechnicalStatus;
  semanticStatus: ValidationSemanticStatus;
  reviewRequired: boolean;
  humanDecisionRequired: boolean;
  blocking: boolean;
  limitations: string[];
  provenance: string[];
  automaticCorrectionAllowed: false;
  autoDecisionAllowed: false;
};

export type SemanticValidationReviewRequest = {
  requestId: string;
  validationRunId: string;
  checkpointRef: { checkpointId: string; version: string };
  invariantRefs: string[];
  sourceSnapshotRef: string;
  targetSnapshotRef: string;
  observationsNeedingReview: string[];
  exactEvidenceRefs: string[];
  semanticQuestion: string;
  requiredPreservations: string[];
  forbiddenPromotions: string[];
  responseSchemaVersion: string;
  providerPolicy: "DISABLED_BY_DEFAULT";
  limitations: string[];
  sourceMutationAuthorized: false;
  targetMutationAuthorized: false;
  autoFixAllowed: false;
};

export type SemanticValidationReviewResult = {
  reviewId: string;
  requestId: string;
  status: "PENDING" | "COMPLETE" | "NOT_EVALUABLE";
  invariantAssessments: Array<{ invariantRef: string; assessment: SemanticEquivalenceAssessment; evidenceRefs: string[] }>;
  semanticEquivalenceAssessments: Array<{ sourceRef: string; targetRef: string; identityMatch: IdentityMatch; assessment: SemanticEquivalenceAssessment; evidenceRefs: string[] }>;
  detectedLosses: string[];
  detectedAdditions: string[];
  detectedPromotions: string[];
  ambiguities: string[];
  contradictions: string[];
  evidence: ValidationEvidence[];
  confidenceKind: "NOT_ASSESSED" | "SEMANTIC_REVIEW";
  requiresHumanReview: boolean;
  limitations: string[];
  sourceMutationAuthorized: false;
  targetMutationAuthorized: false;
  autoFixAllowed: false;
  autoDecisionAllowed: false;
};

export type ValidationHumanReviewRequest = {
  requestId: string;
  validationRunId: string;
  checkpointId: string;
  findingRefs: string[];
  questionIntent: string;
  reason: string;
  alternatives: string[];
  evidence: ValidationEvidence[];
  domainOwner: string;
  requiredMandate: string;
  blocking: boolean;
  limitations: string[];
  boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE";
};

export type ValidationProductGateReference = {
  gateId: "CONTRIBUTION_ADOPTION" | "PROJECT_FREEZE" | "PROTOCOL_GENERATION" | "DMP_GENERATION" | "SAP_GENERATION" | "V1_READY" | "CANDIDATE_PREVIEW";
  owner: string;
  blockingSeverities: ValidationSeverity[];
  requiredCheckpoints: string[];
  unresolvedFindingPolicy: "BLOCK_ON_BLOCKING" | "ALLOW_WITH_VISIBLE_FINDINGS" | "REQUIRE_REVIEW";
  limitations: string[];
  activeInProduct: false;
};

export type ValidationRunRequest = {
  checkpointId: string;
  checkpointVersion: string;
  sourceArtifact: ValidationArtifactReference | null;
  targetArtifact: ValidationArtifactReference | null;
  requestedPlanes: ValidationPlane[];
  requestedInvariantRefs: string[];
  includeSemanticReview: boolean;
  includeHumanReviewPreparation: boolean;
  caller: string;
  purpose: string;
  dryRun: true;
  limitations: string[];
  sourceMutationAuthorized: false;
  targetMutationAuthorized: false;
  projectWriteAuthorized: false;
  documentWriteAuthorized: false;
  autoFixAllowed: false;
  autoDecisionAllowed: false;
};

export type ValidationRun = {
  validationRunId: string;
  schemaVersion: typeof VAL001_CONTRACT_VERSION;
  startedAt: string;
  completedAt: string | null;
  status: ValidationRunStatus;
  historicalValidationStatus: ValidationStatus;
  checkpointRef: { checkpointId: string; version: string };
  sourceArtifactRef: ValidationArtifactReference;
  targetArtifactRef: ValidationArtifactReference;
  invariantRefs: string[];
  adapterVersions: Array<{ adapterId: string; version: string }>;
  validatorVersions: Array<{ validatorId: string; version: string }>;
  semanticReviewPolicy: "DISABLED_BY_DEFAULT" | "CONTRACT_ONLY";
  humanReviewPolicy: "NOT_REQUIRED" | "PREPARE_REQUEST_ONLY";
  canonicalizationVersion: typeof VAL001_CANONICALIZATION_VERSION;
  configurationDigest: string;
  observations: ValidationObservation[];
  findings: ValidationProductFinding[];
  evidenceRefs: string[];
  deterministicResult: "NOT_RUN" | "COMPLETE" | "NOT_EVALUABLE";
  semanticReviewRequests: SemanticValidationReviewRequest[];
  humanReviewRequests: ValidationHumanReviewRequest[];
  technicalStatus: ValidationTechnicalStatus;
  semanticStatus: ValidationSemanticStatus;
  disposition: ValidationDisposition;
  limitations: string[];
  resultDigest: string;
  qualificationAuthority: typeof VAL001_QUALIFICATION_AUTHORITY;
  sourceMutationAuthorized: false;
  targetMutationAuthorized: false;
  projectWriteAuthorized: false;
  documentWriteAuthorized: false;
  autoFixAllowed: false;
  autoDecisionAllowed: false;
  pd011QualificationClaimed: false;
  boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION";
};

export type DomainValidationProvider<TSource = ValidationArtifactSnapshot, TTarget = ValidationArtifactSnapshot> = {
  providerId: string;
  owner: string;
  invariantRefs: string[];
  version: string;
  deterministic: boolean;
  limitations: string[];
  supports(source: TSource, target: TTarget, checkpoint: ValidationCheckpointDefinition): boolean;
  validateReadOnly(source: Readonly<TSource>, target: Readonly<TTarget>, checkpoint: Readonly<ValidationCheckpointDefinition>): {
    observations: ValidationObservation[];
    findings: ValidationProductFinding[];
    sourceMutationAuthorized: false;
    targetMutationAuthorized: false;
  };
};

export type CheckpointApplicabilityStatus = "APPLICABLE" | "NOT_APPLICABLE" | "NOT_READY" | "MISSING_SOURCE" | "MISSING_TARGET";
export type CheckpointApplicability = {
  checkpointId: string;
  checkpointVersion: string;
  status: CheckpointApplicabilityStatus;
  reason: string;
  missingArtifacts: ValidationProductArtifactType[];
  decisionsRequired: string[];
  limitations: string[];
};

export const VALIDATION_CONTRACT_ERROR_CODES = [
  "VAL_CHECKPOINT_ID_MISSING", "VAL_CHECKPOINT_UNKNOWN", "VAL_CHECKPOINT_VERSION_MISSING", "VAL_SOURCE_ARTIFACT_MISSING", "VAL_TARGET_ARTIFACT_MISSING", "VAL_SOURCE_VERSION_MISSING", "VAL_TARGET_VERSION_MISSING", "VAL_SOURCE_DIGEST_INVALID", "VAL_TARGET_DIGEST_INVALID", "VAL_INVARIANT_REFERENCE_UNKNOWN", "VAL_INVARIANT_OWNER_MISSING", "VAL_DUPLICATE_INVARIANT_REFERENCE", "VAL_UNSUPPORTED_VALIDATION_PLANE", "VAL_CHECKPOINT_ARTIFACT_TYPE_MISMATCH", "VAL_ADAPTER_NOT_FOUND", "VAL_ADAPTER_VERSION_MISSING", "VAL_MUTATION_AUTHORIZED_FORBIDDEN", "VAL_PROJECT_WRITE_AUTHORIZED_FORBIDDEN", "VAL_AUTOFIX_FORBIDDEN", "VAL_AUTODECISION_FORBIDDEN", "VAL_PD011_PASS_CLAIM_FORBIDDEN", "VAL_SEMANTIC_REVIEW_NOT_EXECUTABLE_IN_PART2", "VAL_HUMAN_DECISION_EMBEDDED_FORBIDDEN", "VAL_OBSERVATION_WITHOUT_EVIDENCE", "VAL_FINDING_WITHOUT_INVARIANT", "VAL_FINDING_WITHOUT_OWNER", "VAL_TECHNICAL_SEMANTIC_STATUS_COLLAPSED", "VAL_NOT_EVALUABLE_PROMOTED_TO_VALID", "VAL_NOT_APPLICABLE_PROMOTED_TO_VALID", "VAL_PROJECTION_MARKED_SOURCE_OF_TRUTH", "VAL_CONFIGURATION_DIGEST_INVALID",
] as const;

export const VALIDATION_CONTRACT_WARNING_CODES = [
  "VAL_CHECKPOINT_NOT_READY", "VAL_SEMANTIC_REVIEW_REQUIRED", "VAL_HUMAN_ARBITRATION_REQUIRED", "VAL_NON_BLOCKING_FINDING", "VAL_DOMAIN_VALIDATOR_UNAVAILABLE", "VAL_SOURCE_LIMITATION_PROPAGATED", "VAL_TARGET_LIMITATION_PROPAGATED", "VAL_SEMANTIC_MAPPING_PENDING", "VAL_LEGACY_MAPPING_PARTIAL", "VAL_AUDIT_FINDING_PRESENT", "VAL_NOT_APPLICABLE", "VAL_PRODUCT_GATE_NOT_CONNECTED_YET",
] as const;

export type ValidationContractErrorCode = (typeof VALIDATION_CONTRACT_ERROR_CODES)[number];
export type ValidationContractWarningCode = (typeof VALIDATION_CONTRACT_WARNING_CODES)[number];
export type ValidationContractDiagnostic = {
  code: ValidationContractErrorCode | ValidationContractWarningCode;
  severity: "ERROR" | "WARNING";
  path: string;
  message: string;
};
export type ValidationContractValidationResult = {
  valid: boolean;
  errors: ValidationContractDiagnostic[];
  warnings: ValidationContractDiagnostic[];
};
