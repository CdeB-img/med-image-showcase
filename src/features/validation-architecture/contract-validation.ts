import { getValidationCheckpointV1 } from "./checkpoint-registry";
import { getValidationInvariantReference, VALIDATION_INVARIANT_REFERENCE_REGISTRY } from "./invariant-registry";
import { VALIDATION_ARTIFACT_ADAPTERS } from "./product-adapters";
import { computeValidationRunConfigurationDigest, verifyValidationRunDigest } from "./product-canonical";
import {
  VALIDATION_PLANES,
  type ValidationCheckpointDefinition,
  type ValidationContractDiagnostic,
  type ValidationContractErrorCode,
  type ValidationContractValidationResult,
  type ValidationContractWarningCode,
  type ValidationProductArtifactType,
  type ValidationProductFinding,
  type ValidationRun,
  type ValidationRunRequest,
} from "./product-contracts";

const error = (code: ValidationContractErrorCode, path: string, message: string): ValidationContractDiagnostic => ({ code, severity: "ERROR", path, message });
const warning = (code: ValidationContractWarningCode, path: string, message: string): ValidationContractDiagnostic => ({ code, severity: "WARNING", path, message });
const result = (diagnostics: ValidationContractDiagnostic[]): ValidationContractValidationResult => ({ valid: diagnostics.every((item) => item.severity !== "ERROR"), errors: diagnostics.filter((item) => item.severity === "ERROR"), warnings: diagnostics.filter((item) => item.severity === "WARNING") });
const duplicates = (values: readonly string[]) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const hasAdapterFor = (artifactType: ValidationProductArtifactType) => VALIDATION_ARTIFACT_ADAPTERS.some((adapter) => adapter.artifactTypes.includes(artifactType));

export const validateValidationCheckpointDefinition = (checkpoint: Readonly<ValidationCheckpointDefinition>): ValidationContractValidationResult => {
  const diagnostics: ValidationContractDiagnostic[] = [];
  if (!checkpoint.checkpointId.trim()) diagnostics.push(error("VAL_CHECKPOINT_ID_MISSING", "checkpointId", "Checkpoint identity is required."));
  if (!checkpoint.version.trim()) diagnostics.push(error("VAL_CHECKPOINT_VERSION_MISSING", "version", "Checkpoint version is required."));
  if (!checkpoint.sourceOwner.trim() || !checkpoint.targetOwner.trim()) diagnostics.push(error("VAL_INVARIANT_OWNER_MISSING", "owners", "Source and target owners are required."));
  if (!checkpoint.sourceArtifactTypes.length || !checkpoint.targetArtifactTypes.length) diagnostics.push(error("VAL_CHECKPOINT_ARTIFACT_TYPE_MISMATCH", "artifactTypes", "Source and target artifact types are required."));
  duplicates(checkpoint.invariantRefs).forEach((invariantRef) => diagnostics.push(error("VAL_DUPLICATE_INVARIANT_REFERENCE", "invariantRefs", `Duplicate invariant reference: ${invariantRef}.`)));
  checkpoint.invariantRefs.forEach((invariantRef) => { if (!getValidationInvariantReference(invariantRef)) diagnostics.push(error("VAL_INVARIANT_REFERENCE_UNKNOWN", "invariantRefs", `Unknown invariant reference: ${invariantRef}.`)); });
  checkpoint.validationPlanes.forEach((plane) => { if (!VALIDATION_PLANES.includes(plane)) diagnostics.push(error("VAL_UNSUPPORTED_VALIDATION_PLANE", "validationPlanes", `Unsupported validation plane: ${plane}.`)); });
  if (checkpoint.implementationStatus !== "CONTRACT_READY") diagnostics.push(warning("VAL_CHECKPOINT_NOT_READY", "implementationStatus", "Checkpoint is declared but not ready for Part 3 execution."));
  if (checkpoint.historicalCheckpointRefs.some((item) => item.mapping !== "UNCHANGED")) diagnostics.push(warning("VAL_LEGACY_MAPPING_PARTIAL", "historicalCheckpointRefs", "Historical checkpoint identity is explicitly remapped or superseded."));
  if (checkpoint.productGateRefs.length) diagnostics.push(warning("VAL_PRODUCT_GATE_NOT_CONNECTED_YET", "productGateRefs", "Part 2 product gates are declarative only."));
  return result(diagnostics);
};

const validateArtifactReference = (artifact: ValidationRunRequest["sourceArtifact"], prefix: "SOURCE" | "TARGET") => {
  const diagnostics: ValidationContractDiagnostic[] = [];
  if (!artifact) {
    diagnostics.push(error(prefix === "SOURCE" ? "VAL_SOURCE_ARTIFACT_MISSING" : "VAL_TARGET_ARTIFACT_MISSING", `${prefix.toLowerCase()}Artifact`, `${prefix} artifact is required.`));
    return diagnostics;
  }
  if (!artifact.version.trim()) diagnostics.push(error(prefix === "SOURCE" ? "VAL_SOURCE_VERSION_MISSING" : "VAL_TARGET_VERSION_MISSING", `${prefix.toLowerCase()}Artifact.version`, `${prefix} version is required.`));
  if (!artifact.contentDigest?.trim()) diagnostics.push(error(prefix === "SOURCE" ? "VAL_SOURCE_DIGEST_INVALID" : "VAL_TARGET_DIGEST_INVALID", `${prefix.toLowerCase()}Artifact.contentDigest`, `${prefix} digest is required for a validation run.`));
  if (!artifact.immutableForRun) diagnostics.push(error("VAL_MUTATION_AUTHORIZED_FORBIDDEN", `${prefix.toLowerCase()}Artifact.immutableForRun`, "Artifacts must be immutable during a validation run."));
  return diagnostics;
};

export const validateValidationRunRequest = (request: Readonly<ValidationRunRequest>): ValidationContractValidationResult => {
  const diagnostics: ValidationContractDiagnostic[] = [];
  if (!request.checkpointId.trim()) diagnostics.push(error("VAL_CHECKPOINT_ID_MISSING", "checkpointId", "Checkpoint identity is required."));
  if (!request.checkpointVersion.trim()) diagnostics.push(error("VAL_CHECKPOINT_VERSION_MISSING", "checkpointVersion", "Checkpoint version is required."));
  const checkpoint = request.checkpointId ? getValidationCheckpointV1(request.checkpointId, request.checkpointVersion) : null;
  if (request.checkpointId && !checkpoint) diagnostics.push(error("VAL_CHECKPOINT_UNKNOWN", "checkpointId", "Checkpoint identity/version is not present in the VAL-001 registry."));
  diagnostics.push(...validateArtifactReference(request.sourceArtifact, "SOURCE"), ...validateArtifactReference(request.targetArtifact, "TARGET"));
  if (request.sourceArtifact && !hasAdapterFor(request.sourceArtifact.artifactType)) diagnostics.push(error("VAL_ADAPTER_NOT_FOUND", "sourceArtifact.artifactType", "No registered read-only adapter supports the source artifact type."));
  if (request.targetArtifact && !hasAdapterFor(request.targetArtifact.artifactType)) diagnostics.push(error("VAL_ADAPTER_NOT_FOUND", "targetArtifact.artifactType", "No registered read-only adapter supports the target artifact type."));
  if (checkpoint && request.sourceArtifact && request.targetArtifact && (!checkpoint.sourceArtifactTypes.includes(request.sourceArtifact.artifactType) || !checkpoint.targetArtifactTypes.includes(request.targetArtifact.artifactType))) diagnostics.push(error("VAL_CHECKPOINT_ARTIFACT_TYPE_MISMATCH", "artifacts", "Request artifact types do not match the checkpoint definition."));
  duplicates(request.requestedInvariantRefs).forEach((invariantRef) => diagnostics.push(error("VAL_DUPLICATE_INVARIANT_REFERENCE", "requestedInvariantRefs", `Duplicate invariant reference: ${invariantRef}.`)));
  request.requestedInvariantRefs.forEach((invariantRef) => { if (!getValidationInvariantReference(invariantRef)) diagnostics.push(error("VAL_INVARIANT_REFERENCE_UNKNOWN", "requestedInvariantRefs", `Unknown invariant reference: ${invariantRef}.`)); });
  request.requestedPlanes.forEach((plane) => { if (!VALIDATION_PLANES.includes(plane)) diagnostics.push(error("VAL_UNSUPPORTED_VALIDATION_PLANE", "requestedPlanes", `Unsupported validation plane: ${plane}.`)); });
  if (request.sourceMutationAuthorized || request.targetMutationAuthorized) diagnostics.push(error("VAL_MUTATION_AUTHORIZED_FORBIDDEN", "boundaries", "Source and target mutation are forbidden."));
  if (request.projectWriteAuthorized || request.documentWriteAuthorized) diagnostics.push(error("VAL_PROJECT_WRITE_AUTHORIZED_FORBIDDEN", "boundaries", "Project and document writes are forbidden."));
  if (request.autoFixAllowed) diagnostics.push(error("VAL_AUTOFIX_FORBIDDEN", "autoFixAllowed", "VAL never auto-fixes an artifact."));
  if (request.autoDecisionAllowed) diagnostics.push(error("VAL_AUTODECISION_FORBIDDEN", "autoDecisionAllowed", "VAL never creates an engaging decision."));
  if (request.includeSemanticReview) diagnostics.push(error("VAL_SEMANTIC_REVIEW_NOT_EXECUTABLE_IN_PART2", "includeSemanticReview", "Part 2 defines the semantic-review contract but cannot execute it."));
  if (request.includeHumanReviewPreparation) diagnostics.push(warning("VAL_HUMAN_ARBITRATION_REQUIRED", "includeHumanReviewPreparation", "Part 2 can prepare a review request but cannot create a Human Decision."));
  return result(diagnostics);
};

export const validateValidationFinding = (finding: Readonly<ValidationProductFinding>): ValidationContractValidationResult => {
  const diagnostics: ValidationContractDiagnostic[] = [];
  if (!finding.invariantRef.trim() || !getValidationInvariantReference(finding.invariantRef)) diagnostics.push(error("VAL_FINDING_WITHOUT_INVARIANT", "invariantRef", "Finding must reference a known owner invariant."));
  if (!finding.owner.trim() || !finding.reviewOwner.trim()) diagnostics.push(error("VAL_FINDING_WITHOUT_OWNER", "owner", "Finding and review owners are required."));
  if (!finding.evidence.length) diagnostics.push(error("VAL_OBSERVATION_WITHOUT_EVIDENCE", "evidence", "Finding requires reconstructible evidence."));
  if (finding.automaticCorrectionAllowed) diagnostics.push(error("VAL_AUTOFIX_FORBIDDEN", "automaticCorrectionAllowed", "Automatic correction is forbidden."));
  if (finding.autoDecisionAllowed) diagnostics.push(error("VAL_AUTODECISION_FORBIDDEN", "autoDecisionAllowed", "Automatic decision is forbidden."));
  if (finding.severity === "INFO" && finding.blocking) diagnostics.push(warning("VAL_NON_BLOCKING_FINDING", "blocking", "INFO severity should not silently become a blocking product disposition."));
  if (finding.technicalStatus !== "SUCCESS" && !["NOT_EVALUABLE", "NOT_RUN"].includes(finding.semanticStatus)) diagnostics.push(error("VAL_TECHNICAL_SEMANTIC_STATUS_COLLAPSED", "statuses", "Technical failure cannot be represented as a semantic finding."));
  return result(diagnostics);
};

export const validateValidationRun = (run: Readonly<ValidationRun>): ValidationContractValidationResult => {
  const diagnostics: ValidationContractDiagnostic[] = [];
  const checkpoint = getValidationCheckpointV1(run.checkpointRef.checkpointId, run.checkpointRef.version);
  if (!checkpoint) diagnostics.push(error("VAL_CHECKPOINT_UNKNOWN", "checkpointRef", "Run checkpoint identity/version is unknown."));
  if (!run.sourceArtifactRef.version) diagnostics.push(error("VAL_SOURCE_VERSION_MISSING", "sourceArtifactRef.version", "Source version is required."));
  if (!run.targetArtifactRef.version) diagnostics.push(error("VAL_TARGET_VERSION_MISSING", "targetArtifactRef.version", "Target version is required."));
  if (!run.sourceArtifactRef.contentDigest) diagnostics.push(error("VAL_SOURCE_DIGEST_INVALID", "sourceArtifactRef.contentDigest", "Source digest is required."));
  if (!run.targetArtifactRef.contentDigest) diagnostics.push(error("VAL_TARGET_DIGEST_INVALID", "targetArtifactRef.contentDigest", "Target digest is required."));
  if (!hasAdapterFor(run.sourceArtifactRef.artifactType) || !hasAdapterFor(run.targetArtifactRef.artifactType)) diagnostics.push(error("VAL_ADAPTER_NOT_FOUND", "artifactRefs", "A run references an artifact type without a registered read-only adapter."));
  if (!run.adapterVersions.length) diagnostics.push(error("VAL_ADAPTER_NOT_FOUND", "adapterVersions", "At least one adapter identity is required."));
  if (run.adapterVersions.some((item) => !item.version.trim())) diagnostics.push(error("VAL_ADAPTER_VERSION_MISSING", "adapterVersions", "Every adapter identity requires a version."));
  if (run.sourceMutationAuthorized || run.targetMutationAuthorized) diagnostics.push(error("VAL_MUTATION_AUTHORIZED_FORBIDDEN", "boundaries", "Artifact mutation is forbidden."));
  if (run.projectWriteAuthorized || run.documentWriteAuthorized) diagnostics.push(error("VAL_PROJECT_WRITE_AUTHORIZED_FORBIDDEN", "boundaries", "Project or document write is forbidden."));
  if (run.autoFixAllowed) diagnostics.push(error("VAL_AUTOFIX_FORBIDDEN", "autoFixAllowed", "Automatic correction is forbidden."));
  if (run.autoDecisionAllowed) diagnostics.push(error("VAL_AUTODECISION_FORBIDDEN", "autoDecisionAllowed", "Automatic decisions are forbidden."));
  if (run.pd011QualificationClaimed) diagnostics.push(error("VAL_PD011_PASS_CLAIM_FORBIDDEN", "pd011QualificationClaimed", "A VAL run never claims PD-011 qualification."));
  if (run.qualificationAuthority !== "PD-011") diagnostics.push(error("VAL_PD011_PASS_CLAIM_FORBIDDEN", "qualificationAuthority", "PD-011 remains the only qualification authority."));
  if (run.semanticReviewRequests.length) diagnostics.push(error("VAL_SEMANTIC_REVIEW_NOT_EXECUTABLE_IN_PART2", "semanticReviewRequests", "Part 2 cannot contain executed semantic review."));
  if (run.humanReviewRequests.some((item) => item.boundary !== "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE" || "decisionId" in item)) diagnostics.push(error("VAL_HUMAN_DECISION_EMBEDDED_FORBIDDEN", "humanReviewRequests", "A review request cannot embed or replace a Human Decision."));
  if (run.observations.some((observation) => !observation.evidence.length)) diagnostics.push(error("VAL_OBSERVATION_WITHOUT_EVIDENCE", "observations", "Every observation requires evidence."));
  run.findings.forEach((finding) => diagnostics.push(...validateValidationFinding(finding).errors));
  if (run.technicalStatus !== "SUCCESS" && !["NOT_EVALUABLE", "NOT_RUN"].includes(run.semanticStatus)) diagnostics.push(error("VAL_TECHNICAL_SEMANTIC_STATUS_COLLAPSED", "statuses", "Technical and semantic statuses are collapsed."));
  if (run.semanticStatus === "NOT_EVALUABLE" && run.historicalValidationStatus === "VALID") diagnostics.push(error("VAL_NOT_EVALUABLE_PROMOTED_TO_VALID", "historicalValidationStatus", "NOT_EVALUABLE cannot be promoted to VALID."));
  if (run.semanticStatus === "NOT_APPLICABLE" && run.historicalValidationStatus === "VALID") diagnostics.push(error("VAL_NOT_APPLICABLE_PROMOTED_TO_VALID", "historicalValidationStatus", "NOT_APPLICABLE cannot be promoted to VALID."));
  if (run.targetArtifactRef.artifactType.includes("PROJECTION") && run.targetArtifactRef.sourceOfTruth) diagnostics.push(error("VAL_PROJECTION_MARKED_SOURCE_OF_TRUTH", "targetArtifactRef.sourceOfTruth", "A projection cannot be marked as source of truth."));
  if (run.configurationDigest !== computeValidationRunConfigurationDigest(run)) diagnostics.push(error("VAL_CONFIGURATION_DIGEST_INVALID", "configurationDigest", "Run configuration digest is not reproducible."));
  if (run.status === "COMPLETE" && run.resultDigest && !verifyValidationRunDigest(run)) diagnostics.push(error("VAL_CONFIGURATION_DIGEST_INVALID", "resultDigest", "Completed run digest is not reproducible."));
  duplicates(run.invariantRefs).forEach((invariantRef) => diagnostics.push(error("VAL_DUPLICATE_INVARIANT_REFERENCE", "invariantRefs", `Duplicate invariant reference: ${invariantRef}.`)));
  run.invariantRefs.forEach((invariantRef) => { if (!VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.some((item) => item.invariantId === invariantRef)) diagnostics.push(error("VAL_INVARIANT_REFERENCE_UNKNOWN", "invariantRefs", `Unknown invariant: ${invariantRef}.`)); });
  if (run.findings.some((finding) => !finding.blocking)) diagnostics.push(warning("VAL_NON_BLOCKING_FINDING", "findings", "Run contains visible non-blocking findings."));
  if (run.semanticStatus === "REVIEW_REQUIRED" || run.findings.some((finding) => finding.reviewRequired)) diagnostics.push(warning("VAL_SEMANTIC_REVIEW_REQUIRED", "semanticStatus", "A semantic review remains required and unexecuted."));
  if (run.humanReviewRequests.length || run.findings.some((finding) => finding.humanDecisionRequired)) diagnostics.push(warning("VAL_HUMAN_ARBITRATION_REQUIRED", "humanReviewRequests", "A Human Review request remains distinct from a Human Decision."));
  if (!run.validatorVersions.length) diagnostics.push(warning("VAL_DOMAIN_VALIDATOR_UNAVAILABLE", "validatorVersions", "No domain validator version is recorded for this run."));
  if (run.findings.some((finding) => finding.findingClass === "AUDIT_FINDING_PRESENT")) diagnostics.push(warning("VAL_AUDIT_FINDING_PRESENT", "findings", "An existing Audit-D finding remains visible."));
  if (run.findings.some((finding) => finding.semanticStatus === "REVIEW_REQUIRED")) diagnostics.push(warning("VAL_SEMANTIC_MAPPING_PENDING", "findings", "A semantic mapping remains pending."));
  if (run.semanticStatus === "NOT_APPLICABLE") diagnostics.push(warning("VAL_NOT_APPLICABLE", "semanticStatus", "NOT_APPLICABLE remains distinct from VALID."));
  return result(diagnostics);
};
