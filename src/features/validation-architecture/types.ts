export const VALIDATION_ARCHITECTURE_VERSION = "1.0.0" as const;
export const VALIDATION_SCHEMA_VERSION = "1.0.0" as const;

export const VALIDATION_STATUSES = [
  "VALID",
  "VALID_WITH_WARNINGS",
  "REVIEW_REQUIRED",
  "INVALID",
  "NOT_EVALUABLE",
  "VALIDATOR_UNAVAILABLE",
] as const;

export const VALIDATION_SEVERITIES = ["INFO", "WARNING", "ERROR", "BLOCKING"] as const;

export const VALIDATION_ERROR_CODES = [
  "OBJECT_LOST",
  "RELATION_LOST",
  "OBJECT_ADDED_WITHOUT_SOURCE",
  "RELATION_ADDED_WITHOUT_SOURCE",
  "UNKNOWN_STRENGTHENED",
  "UNKNOWN_REMOVED",
  "CONTRADICTION_HIDDEN",
  "CONTRADICTION_RESOLVED_WITHOUT_DECISION",
  "DECISION_LOST",
  "DECISION_RECREATED",
  "DECISION_STATUS_CHANGED",
  "PROVENANCE_LOST",
  "SOURCE_VERSION_MISMATCH",
  "DIGEST_MISMATCH",
  "OWNERSHIP_VIOLATION",
  "NOT_APPLICABLE_STRENGTHENED",
  "BLOCKED_BYPASSED",
  "FUTURE_SIMULATED",
  "REQUIREMENT_REINTERPRETED",
  "PATTERN_PROMOTED",
  "TEMPLATE_STRUCTURE_BYPASSED",
  "DOCUMENT_CONTENT_INVENTED",
  "SEMANTIC_DRIFT",
  "ROUTE_DRIFT",
  "DOWNSTREAM_INFORMATION_LOSS",
  "PROJECTION_DIVERGENCE",
] as const;

export const VALIDATOR_TYPES = [
  "SEMANTIC_FIDELITY",
  "ST_HANDOFF",
  "IMG_HANDOFF",
  "PROJECT_CONSISTENCY",
  "REGULATORY_CONSISTENCY",
  "TEMPLATE_CONSISTENCY",
  "DOCUMENT_FIDELITY",
  "CROSS_PROJECTION",
] as const;

export const VALIDATION_ARTIFACT_TYPES = [
  "ORIGINAL_REQUEST",
  "SEMANTIC_MODEL",
  "SCIENTIFIC_THINKING_OUTPUT",
  "IMAGING_DESIGN_RESULT",
  "RESEARCH_PROJECT_RESULT",
  "REGULATORY_RESOLUTION_RESULT",
  "DOCUMENTARY_PATTERN_CATALOG",
  "STUDY_TEMPLATE_INSTANCE",
  "DOCUMENT_PROJECTION",
  "RENDERER_OUTPUT",
  "COMPOSITE_SOURCE",
] as const;

export const VALIDATION_ELEMENT_KINDS = [
  "ORIGINAL_REQUEST",
  "OBJECT",
  "PROJECT_OBJECT",
  "UNKNOWN",
  "CONTRADICTION",
  "DECISION",
  "PROVENANCE",
  "REQUIREMENT",
  "PATTERN",
  "TEMPLATE_NODE",
  "DOCUMENT_CONTENT",
  "ROUTE",
  "ENGINE_CAPABILITY",
] as const;

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];
export type ValidationErrorCode = (typeof VALIDATION_ERROR_CODES)[number];
export type ValidatorType = (typeof VALIDATOR_TYPES)[number];
export type ValidationArtifactType = (typeof VALIDATION_ARTIFACT_TYPES)[number];
export type ValidationElementKind = (typeof VALIDATION_ELEMENT_KINDS)[number];
export type ValidatorStatus = "AVAILABLE" | "EXPERIMENTAL" | "BLOCKED" | "FUTURE";
export type ValidatorAvailability = "AVAILABLE" | "UNAVAILABLE" | "PENDING_SEM_QUALIFICATION";

export type ValidationElement = {
  ref: string;
  kind: ValidationElementKind;
  semanticKey: string;
  status: string;
  sourceRefs: string[];
  provenanceRefs: string[];
  owner: string;
  version?: string;
};

export type ValidationRelation = {
  ref: string;
  from: string;
  to: string;
  relationType: string;
  sourceRefs: string[];
  provenanceRefs: string[];
  owner: string;
};

export type ValidationArtifact = {
  artifactId: string;
  artifactType: ValidationArtifactType;
  version: string;
  digest: string;
  owner: string;
  sourceArtifactRefs: string[];
  elements: ValidationElement[];
  relations: ValidationRelation[];
  boundary: string;
};

export type ValidationHumanDecision = {
  decisionId: string;
  version: string;
  status: string;
  actor: string | null;
  mandate: string | null;
  targets: string[];
  provenance: string[];
};

export type ValidationContext = {
  checkpointId?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  purpose?: string;
  expectedOwners?: Partial<Record<ValidationElementKind, string>>;
  allowedTargetElementRefs?: string[];
  rendererOnlyChange?: boolean;
  expectedSourceArtifactRefs?: string[];
};

export type ValidationRequest = {
  validationId: string;
  validatorType: ValidatorType;
  sourceArtifact: ValidationArtifact;
  targetArtifact: ValidationArtifact;
  sourceVersion: string;
  targetVersion: string;
  sourceDigest: string;
  targetDigest: string;
  context: ValidationContext;
  expectedInvariantSet: string[];
  humanDecisions: ValidationHumanDecision[];
  unknowns: string[];
  contradictions: string[];
  limitations: string[];
  provenance: string[];
  requestedAt: string;
  validationPolicyVersion: string;
};

export type ValidationFindingEvidence = {
  invariantId: string;
  assertion: string;
  observed: string;
};

export type ValidationFinding = {
  findingId: string;
  code: ValidationErrorCode;
  severity: ValidationSeverity;
  sourceRefs: string[];
  targetRefs: string[];
  message: string;
  evidence: ValidationFindingEvidence[];
  impact: string;
  owner: string;
  recommendedAction: string;
  automaticCorrectionAllowed: false;
};

export type ValidationElementChange = {
  sourceRef: string | null;
  targetRef: string | null;
  kind: ValidationElementKind | "RELATION";
  reason: string;
};

export type ValidationStatusChange = {
  sourceRef: string;
  targetRef: string;
  from: string;
  to: string;
};

export type ValidationTraceEntry = {
  sequence: number;
  invariantId: string;
  outcome: "PASS" | "FAIL" | "NOT_EVALUABLE";
  sourceRefs: string[];
  targetRefs: string[];
  findingIds: string[];
  evidence: string;
};

export type ValidationResult = {
  validationId: string;
  validatorType: ValidatorType;
  status: ValidationStatus;
  findings: ValidationFinding[];
  preservedElements: ValidationElementChange[];
  lostElements: ValidationElementChange[];
  addedElements: ValidationElementChange[];
  strengthenedElements: ValidationElementChange[];
  weakenedElements: ValidationElementChange[];
  unmappedElements: ValidationElementChange[];
  statusChanges: ValidationStatusChange[];
  provenanceBreaks: ValidationElementChange[];
  unknownChanges: ValidationElementChange[];
  contradictionChanges: ValidationElementChange[];
  decisionChanges: ValidationElementChange[];
  sourceDigest: string;
  targetDigest: string;
  validatorVersion: string;
  resultDigest: string;
  trace: ValidationTraceEntry[];
  limitations: string[];
  boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION";
};

export type ValidationInvariant = {
  invariantId: string;
  statement: string;
  description: string;
  owner: string;
  authorityRefs: string[];
};

export type ValidatorDefinition = {
  validatorId: string;
  validatorType: ValidatorType;
  version: string;
  status: ValidatorStatus;
  sourceType: ValidationArtifactType | "MULTIPLE";
  targetType: ValidationArtifactType | "MULTIPLE";
  supportedInvariantIds: string[];
  availability: ValidatorAvailability;
  dependencies: string[];
  owner: string;
  limitations: string[];
  provenance: string[];
};

export type ValidatorRegistry = {
  registryId: string;
  version: string;
  validators: ValidatorDefinition[];
  digest: string;
  boundary: "TECHNICAL_VALIDATOR_REGISTRY_NOT_SCIENTIFIC_QUALIFICATION";
};

export type ValidationPolicy = {
  policyId: "ENGINE_HANDOFF" | "PROJECT_CONSTRUCTION" | "REGULATORY_COMPOSITION" | "TEMPLATE_COMPOSITION" | "DOCUMENT_PROJECTION" | "CROSS_PROJECTION" | "SEMANTIC_END_TO_END_FUTURE" | string;
  version: string;
  invariantIds: string[];
  blockingSeverities: ValidationSeverity[];
  warningsAccepted: boolean;
  requiredValidators: Array<{ validatorId: string; version: string }>;
  compatibleSources: Array<{ sourceType: ValidationArtifactType | "MULTIPLE"; versions: string[] }>;
  boundary: "TECHNICAL_VALIDATION_POLICY_NOT_SCIENTIFIC_STANDARD";
};

export type ValidationCheckpoint = {
  checkpointId: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  label: string;
  validatorId: string;
  sourceTypes: ValidationArtifactType[];
  targetTypes: ValidationArtifactType[];
  comparedElements: string[];
  status: "EXPERIMENTAL" | "PENDING_SEM_QUALIFICATION";
  boundary: string;
};

export const VALIDATION_ARCHITECTURE_AUDIT_CODES = [
  "VALIDATOR_WITHOUT_VERSION",
  "VALIDATOR_WITHOUT_OWNER",
  "VALIDATOR_WITHOUT_INVARIANTS",
  "UNKNOWN_INVARIANT",
  "POLICY_WITHOUT_VALIDATOR",
  "POLICY_WITHOUT_BLOCKING_RULE",
  "NON_DETERMINISTIC_VALIDATOR",
  "MISSING_PROVENANCE",
  "CIRCULAR_VALIDATION_DEPENDENCY",
  "VALIDATOR_MUTATES_SOURCE",
  "VALIDATOR_MUTATES_TARGET",
  "UNAVAILABLE_VALIDATOR_MARKED_AVAILABLE",
] as const;

export type ValidationArchitectureAuditCode = (typeof VALIDATION_ARCHITECTURE_AUDIT_CODES)[number];
export type ValidationArchitectureAuditFinding = {
  findingId: string;
  code: ValidationArchitectureAuditCode;
  severity: "ERROR" | "WARNING" | "INFORMATION";
  subjectId: string;
  message: string;
  evidenceRefs: string[];
  automaticCorrectionAllowed: false;
};

export type ValidationArchitectureAuditResult = {
  auditVersion: "VAL-000-AUDIT-1.0.0";
  registryDigest: string;
  findings: ValidationArchitectureAuditFinding[];
  counts: Record<"ERROR" | "WARNING" | "INFORMATION", number>;
  passed: boolean;
  boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX";
};

export type ValidationRunner = (request: ValidationRequest, validator: ValidatorDefinition, policy?: ValidationPolicy) => ValidationResult;

