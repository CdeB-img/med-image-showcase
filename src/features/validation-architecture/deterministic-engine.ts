import { validationDigest } from "./canonical";
import { getValidationCheckpointV1, inspectCheckpointApplicability } from "./checkpoint-registry";
import { getValidationInvariantReference } from "./invariant-registry";
import { findValidationArtifactAdapter } from "./product-adapters";
import { finalizeValidationRun } from "./product-canonical";
import {
  VAL001_CANONICALIZATION_VERSION,
  VAL001_CONTRACT_VERSION,
  type CheckpointApplicability,
  type CorridorValidationDisposition,
  type CorridorValidationSummary,
  type DomainValidationExecutionResult,
  type DomainValidationProvider,
  type ValidationArtifactReference,
  type ValidationArtifactSnapshot,
  type ValidationCheckpointDefinition,
  type ValidationCheckpointExecutionInput,
  type ValidationCorridorRequest,
  type ValidationCorridorResult,
  type ValidationDisposition,
  type ValidationEvidence,
  type ValidationFindingTrace,
  type ValidationHumanReviewRequest,
  type ValidationObservation,
  type ValidationProductFinding,
  type ValidationRun,
  type ValidationSemanticStatus,
  type ValidationSnapshotSemanticObject,
  type ValidationTechnicalStatus,
  type SemanticValidationReviewRequest,
} from "./product-contracts";
import type { ValidationSeverity, ValidationStatus } from "./types";

export const VAL001_DETERMINISTIC_ENGINE_VERSION = "1.0.0" as const;
export const VAL001_DOMAIN_VALIDATOR_ADAPTER_VERSION = "1.0.0" as const;

const compareText = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort(compareText);
const clone = <T>(value: T): T => structuredClone(value);

const evidence = (input: Partial<ValidationEvidence> & Pick<ValidationEvidence, "kind">): ValidationEvidence => {
  const material = {
    kind: input.kind,
    sourcePath: input.sourcePath ?? null,
    targetPath: input.targetPath ?? null,
    sourceObjectRef: input.sourceObjectRef ?? null,
    targetObjectRef: input.targetObjectRef ?? null,
    exactSourceSpan: input.exactSourceSpan ?? null,
    relationRef: input.relationRef ?? null,
    decisionRef: input.decisionRef ?? null,
    provenanceRef: input.provenanceRef ?? null,
    digest: input.digest ?? null,
    auditFindingRef: input.auditFindingRef ?? null,
    domainValidatorResultRef: input.domainValidatorResultRef ?? null,
    comparisonNote: input.comparisonNote ?? null,
  };
  return { evidenceId: input.evidenceId ?? `val-evidence:${validationDigest(material)}`, ...material };
};

export type ExactIdentityComparison = {
  identityMatch: "EXACT" | "VERSION_DIFFERENT" | "DIFFERENT_ID" | "MISSING";
  sourceRef: string | null;
  targetRef: string | null;
  sourceVersion: string | null;
  targetVersion: string | null;
};

export const compareExactIdentity = (
  source: Readonly<ValidationArtifactReference> | null,
  target: Readonly<ValidationArtifactReference> | null,
): ExactIdentityComparison => {
  if (!source || !target) return { identityMatch: "MISSING", sourceRef: source?.artifactId ?? null, targetRef: target?.artifactId ?? null, sourceVersion: source?.version ?? null, targetVersion: target?.version ?? null };
  if (source.artifactId !== target.artifactId) return { identityMatch: "DIFFERENT_ID", sourceRef: source.artifactId, targetRef: target.artifactId, sourceVersion: source.version, targetVersion: target.version };
  return { identityMatch: source.version === target.version ? "EXACT" : "VERSION_DIFFERENT", sourceRef: source.artifactId, targetRef: target.artifactId, sourceVersion: source.version, targetVersion: target.version };
};

export type CanonicalReferenceComparison = {
  sourceRef: string;
  targetRef: string | null;
  identityMatch: "EXACT" | "DIFFERENT_ID" | "MISSING";
  mapping: "EXACT_ID" | "EXPLICIT_SOURCE_REFERENCE" | "SEMANTIC_MAPPING_PENDING" | "UNMAPPED";
};

export const compareCanonicalReferences = (
  sourceObjects: readonly ValidationSnapshotSemanticObject[],
  targetObjects: readonly ValidationSnapshotSemanticObject[],
): CanonicalReferenceComparison[] => sourceObjects.map((source) => {
  const exact = targetObjects.find((target) => target.objectId === source.objectId);
  if (exact) return { sourceRef: source.objectId, targetRef: exact.objectId, identityMatch: "EXACT", mapping: "EXACT_ID" };
  const referenced = targetObjects.find((target) => target.sourceRefs.includes(source.objectId));
  if (referenced) return { sourceRef: source.objectId, targetRef: referenced.objectId, identityMatch: "DIFFERENT_ID", mapping: "EXPLICIT_SOURCE_REFERENCE" };
  const sameLabelOnly = source.semanticKey && targetObjects.find((target) => target.semanticKey === source.semanticKey);
  if (sameLabelOnly) return { sourceRef: source.objectId, targetRef: sameLabelOnly.objectId, identityMatch: "DIFFERENT_ID", mapping: "SEMANTIC_MAPPING_PENDING" };
  return { sourceRef: source.objectId, targetRef: null, identityMatch: "MISSING", mapping: "UNMAPPED" };
});

export const compareReferencedCollections = (
  sourceRefs: readonly string[],
  targetRefs: readonly string[],
) => ({
  preserved: unique(sourceRefs.filter((ref) => targetRefs.includes(ref))),
  missing: unique(sourceRefs.filter((ref) => !targetRefs.includes(ref))),
  added: unique(targetRefs.filter((ref) => !sourceRefs.includes(ref))),
});

const findSnapshot = (raw: unknown, supplied: ValidationArtifactSnapshot | null | undefined) => {
  if (supplied) return { snapshot: supplied, adapter: null };
  if (raw === undefined || raw === null) return { snapshot: null, adapter: null };
  const adapter = findValidationArtifactAdapter(raw);
  if (!adapter) return { snapshot: null, adapter: null };
  return { snapshot: adapter.buildSnapshot(raw as never), adapter };
};

const observation = (
  checkpointId: string,
  invariantRef: string,
  plane: ValidationObservation["plane"],
  sourceRef: string,
  targetRef: string,
  observationType: ValidationObservation["observationType"],
  note: string,
  deterministic = true,
): ValidationObservation => {
  const proof = evidence({ kind: "COMPARISON_NOTE", sourceObjectRef: sourceRef || null, targetObjectRef: targetRef || null, comparisonNote: note });
  const material = { checkpointId, invariantRef, plane, sourceRef, targetRef, observationType, proof: proof.evidenceId };
  return {
    observationId: `val-observation:${validationDigest(material)}`,
    checkpointId,
    invariantRef,
    plane,
    sourceRef,
    targetRef,
    observationType,
    sourcePath: null,
    targetPath: null,
    sourceValueRef: sourceRef || null,
    targetValueRef: targetRef || null,
    semanticKey: null,
    evidence: [proof],
    deterministic,
    confidenceKind: deterministic ? "DETERMINISTIC" : "SEMANTIC_REVIEW_PENDING",
    technicalStatus: "SUCCESS",
    limitations: [],
  };
};

const chooseInvariant = (checkpoint: ValidationCheckpointDefinition, preferred: string[]) =>
  preferred.find((ref) => checkpoint.invariantRefs.includes(ref)) ?? checkpoint.invariantRefs.find((ref) => getValidationInvariantReference(ref)?.evaluationLevel === "DETERMINISTIC") ?? checkpoint.invariantRefs[0] ?? "VAL-C08";

const targetForComparison = (comparison: CanonicalReferenceComparison, target: ValidationArtifactSnapshot) => comparison.targetRef ? target.semanticObjects.find((item) => item.objectId === comparison.targetRef) ?? null : null;

const structuralInvariantForTypes = (checkpoint: ValidationCheckpointDefinition, sourceType: string, targetType: string) => {
  const pair = `${sourceType}->${targetType}`;
  const preferred = pair === "Endpoint->Estimand" ? "BIO-C10"
    : pair === "Estimand->StatisticalModel" || pair === "Estimand->StatisticalMethodDefinition" ? "BIO:ESTIMAND_MODEL_DISTINCT"
      : pair === "CanonicalVariable->AnalysisVariableRole" ? "BIO:VARIABLE_ANALYTICAL_ROLE_DISTINCT"
        : pair === "ProjectPopulation->AnalysisPopulation" ? "BIO:ANALYSIS_PROJECT_POPULATION_DISTINCT"
          : pair === "FactualMissingness->MissingDataStrategy" ? "BIO:FACTUAL_ANALYTICAL_MISSINGNESS_DISTINCT"
            : pair === "ExpectedVariableOccasion->VariableOccurrence" ? "CDM:EXPECTED_OCCURRENCE_DISTINCT"
              : pair === "DatasetReleaseRequirement->DatasetRelease" || pair === "AnalysisSpecification->AnalysisExecution" ? "DM:PLANNED_REALIZED_DISTINCT"
                : null;
  return preferred && checkpoint.invariantRefs.includes(preferred) ? preferred : null;
};

export const buildDeterministicObservations = (
  checkpoint: Readonly<ValidationCheckpointDefinition>,
  source: Readonly<ValidationArtifactSnapshot>,
  target: Readonly<ValidationArtifactSnapshot>,
): ValidationObservation[] => {
  const observations: ValidationObservation[] = [];
  const ownershipInvariant = chooseInvariant(checkpoint, ["OBS:MEASUREMENT_DEFINITION_OWNERSHIP", "VAL-C08"]);
  const identityInvariant = chooseInvariant(checkpoint, ["CDM-C01", "PROJECT:VERSION_CONTINUITY", "VAL-C08"]);
  const epistemicInvariant = chooseInvariant(checkpoint, ["AUDIT-D:CANDIDATE_PROMOTED_TO_PROJECT", "AUDIT-D:REJECTED_OR_SUPERSEDED_STATE_ACTIVE", "PROJECT:HUMAN_DECISION_REQUIRED"]);

  compareCanonicalReferences(source.semanticObjects, target.semanticObjects).forEach((comparison) => {
    const sourceObject = source.semanticObjects.find((item) => item.objectId === comparison.sourceRef);
    const targetObject = targetForComparison(comparison, target);
    if (!sourceObject) return;
    if (comparison.mapping === "SEMANTIC_MAPPING_PENDING" || comparison.mapping === "UNMAPPED") {
      observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["OBS:MEASURE_MEANING_PRESERVED", "DM:NO_SCIENTIFIC_REDEFINITION", "BIO-C10", "VAL-C08"]), "SEMANTIC_FIDELITY", sourceObject.objectId, targetObject?.objectId ?? "", "NON_MAPPED", "Identity and explicit source references do not prove semantic equivalence.", false));
      return;
    }
    observations.push(observation(checkpoint.checkpointId, identityInvariant, "IDENTITY_VERSION", sourceObject.objectId, targetObject?.objectId ?? sourceObject.objectId, "PRESERVED", `Canonical reference preserved by ${comparison.mapping}.`));
    if (!targetObject) return;
    if (sourceObject.owner !== targetObject.owner) observations.push(observation(checkpoint.checkpointId, ownershipInvariant, "OWNERSHIP", sourceObject.objectId, targetObject.objectId, "CONFLICT", `Owner changed from ${sourceObject.owner} to ${targetObject.owner}.`));
    if (sourceObject.objectType !== targetObject.objectType && comparison.mapping === "EXACT_ID") observations.push(observation(checkpoint.checkpointId, structuralInvariantForTypes(checkpoint, sourceObject.objectType, targetObject.objectType) ?? identityInvariant, "STRUCTURAL", sourceObject.objectId, targetObject.objectId, "CONFLICT", `The same canonical identity changed type from ${sourceObject.objectType} to ${targetObject.objectType}.`));
    const candidate = /CANDIDATE/.test(`${sourceObject.status} ${source.epistemicStates.find((state) => state.subjectId === sourceObject.objectId)?.adoptionStatus ?? ""}`);
    const adopted = ["ADOPTED", "APPROVED", "CONFIRMED", "HUMAN_CONFIRMED"].includes(targetObject.status);
    if (candidate && adopted && !target.decisions.some((decision) => decision.actorPresent && decision.mandatePresent && decision.targetRefs.includes(targetObject.objectId))) observations.push(observation(checkpoint.checkpointId, epistemicInvariant, "DECISION", sourceObject.objectId, targetObject.objectId, "STRENGTHENED", "Candidate state became adopted without an authorized Human Decision reference."));
    const unknown = ["UNKNOWN", "NOT_GENERATABLE", "NOT_EVALUATED", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE"].includes(sourceObject.status);
    const strengthenedFromUnknown = ["KNOWN", "ADOPTED", "APPROVED", "CONFIRMED", "GENERATABLE"].includes(targetObject.status);
    if (unknown && strengthenedFromUnknown && !target.decisions.some((decision) => decision.actorPresent && decision.mandatePresent && decision.targetRefs.includes(targetObject.objectId))) observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["DOC:NOT_GENERATABLE_PRESERVED", "BIO:NO_UNSOURCED_DIMENSIONING_ASSUMPTION", "PROJECT:HUMAN_DECISION_REQUIRED"]), "EPISTEMIC", sourceObject.objectId, targetObject.objectId, "STRENGTHENED", "An explicitly unknown or non-generatable source state became asserted without source or Human Decision evidence."));
    if (["REJECTED", "SUPERSEDED"].includes(sourceObject.status) && ["ACTIVE", "ADOPTED", "KNOWN"].includes(targetObject.status)) observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["AUDIT-D:REJECTED_OR_SUPERSEDED_STATE_ACTIVE", "VAL-C08"]), "EPISTEMIC", sourceObject.objectId, targetObject.objectId, "STRENGTHENED", "A rejected or superseded source state became active downstream."));
    if (sourceObject.polarity && targetObject.polarity && sourceObject.polarity !== targetObject.polarity) observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["AUDIT-D:CRITICAL_NEGATION_LOST", "AUDIT-D:NEGATION_NOT_EXPLICITLY_REPRESENTED"]), "SEMANTIC_FIDELITY", sourceObject.objectId, targetObject.objectId, "CONFLICT", `Structured polarity changed from ${sourceObject.polarity} to ${targetObject.polarity}.`));
  });

  const duplicateIds = target.semanticObjects.map((item) => item.objectId).filter((id, index, ids) => ids.indexOf(id) !== index);
  unique(duplicateIds).forEach((id) => observations.push(observation(checkpoint.checkpointId, identityInvariant, "IDENTITY_VERSION", id, id, "CONFLICT", "Duplicate canonical identity is present in the target snapshot.")));

  const forbiddenRealized = new Set(["VariableOccurrence", "DatasetRelease", "AnalysisExecution", "AnalysisResult"]);
  target.semanticObjects.filter((item) => forbiddenRealized.has(item.objectType)).forEach((item) => observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["CDM:EXPECTED_OCCURRENCE_DISTINCT", "DM:PLANNED_REALIZED_DISTINCT"]), "EPISTEMIC", item.sourceRefs[0] ?? "design-time", item.objectId, "STRENGTHENED", `Realized-time object ${item.objectType} is present in the design-time corridor.`)));

  source.relations.forEach((sourceRelation) => {
    const targetRelation = target.relations.find((item) => item.relationId === sourceRelation.relationId || (item.sourceObjectId === sourceRelation.sourceObjectId && item.targetObjectId === sourceRelation.targetObjectId && item.relationType === sourceRelation.relationType));
    if (!targetRelation) {
      observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["AUDIT-D:RELATION_DIRECTION_INVERTED", "OBS:MEASURE_MEANING_PRESERVED"]), "SEMANTIC_FIDELITY", sourceRelation.relationId, "", "NON_MAPPED", "No exact or explicitly referenced downstream relation proves preservation.", false));
    } else if (sourceRelation.relationType !== targetRelation.relationType) {
      observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["AUDIT-D:CAUSALITY_ADDED_AGAINST_EXPLICIT_NEGATION", "AUDIT-D:RELATION_DIRECTION_INVERTED"]), "SEMANTIC_FIDELITY", sourceRelation.relationId, targetRelation.relationId, "NON_MAPPED", `Structured relation type changed from ${sourceRelation.relationType} to ${targetRelation.relationType}; semantic promotion requires review.`, false));
    } else if (sourceRelation.polarity !== targetRelation.polarity || sourceRelation.sourceObjectId !== targetRelation.sourceObjectId || sourceRelation.targetObjectId !== targetRelation.targetObjectId) {
      observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["AUDIT-D:RELATION_DIRECTION_INVERTED", "AUDIT-D:CRITICAL_NEGATION_LOST"]), "SEMANTIC_FIDELITY", sourceRelation.relationId, targetRelation.relationId, "CONFLICT", "Structured relation direction or polarity changed."));
    } else {
      observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["AUDIT-D:RELATION_DIRECTION_INVERTED", "VAL-C08"]), "STRUCTURAL", sourceRelation.relationId, targetRelation.relationId, "PRESERVED", "Structured relation identity, direction and polarity are preserved."));
    }
  });

  if (target.reference.artifactType.includes("PROJECTION") && target.reference.sourceOfTruth) observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["VAL-C13", "VAL-C12", "VAL-C09"]), "PROJECTION", source.reference.artifactId, target.reference.artifactId, "CONFLICT", "A projection is marked as source of truth."));
  if (target.projectWriteAuthorized || target.metadata.projectWriteAuthorized === true) observations.push(observation(checkpoint.checkpointId, chooseInvariant(checkpoint, ["DOC:NO_WRITE_BACK", "VAL-C09"]), "OWNERSHIP", source.reference.artifactId, target.reference.artifactId, "CONFLICT", "Target snapshot exposes project-write authorization."));

  return observations.sort((left, right) => compareText(left.observationId, right.observationId));
};

const findingClassFor = (item: ValidationObservation) => {
  if (item.observationType === "STRENGTHENED" && item.plane === "DECISION") return "UNAUTHORIZED_ADOPTION";
  if (item.observationType === "STRENGTHENED" && item.plane === "EPISTEMIC") return "DESIGN_REALIZED_BOUNDARY_VIOLATION";
  if (item.plane === "OWNERSHIP") return "OWNERSHIP_VIOLATION";
  if (item.plane === "IDENTITY_VERSION") return "IDENTITY_CONTINUITY_VIOLATION";
  if (item.plane === "PROJECTION") return "PROJECTION_SOURCE_OF_TRUTH_VIOLATION";
  return "STRUCTURED_INVARIANT_VIOLATION";
};

export const deriveValidationFindings = (
  checkpoint: Readonly<ValidationCheckpointDefinition>,
  sourceRef: ValidationArtifactReference,
  targetRef: ValidationArtifactReference,
  observations: readonly ValidationObservation[],
): ValidationProductFinding[] => observations.filter((item) => item.deterministic && ["CONFLICT", "STRENGTHENED"].includes(item.observationType)).map((item) => {
  const invariant = getValidationInvariantReference(item.invariantRef);
  const severity = invariant?.severityDefault ?? "ERROR";
  const disposition = invariant?.defaultDisposition ?? "REQUIRE_REVIEW";
  const material = { checkpointId: checkpoint.checkpointId, invariantRef: item.invariantRef, observationId: item.observationId };
  return {
    findingId: `val-finding:${validationDigest(material)}`,
    checkpointId: checkpoint.checkpointId,
    invariantRef: item.invariantRef,
    observationRefs: [item.observationId],
    findingClass: findingClassFor(item),
    domainFailureClassRef: invariant?.domainFailureClassRef ?? null,
    severity,
    disposition,
    sourceArtifactRef: sourceRef,
    targetArtifactRef: targetRef,
    evidence: item.evidence,
    owner: invariant?.owner ?? checkpoint.targetOwner,
    reviewOwner: invariant?.owner ?? checkpoint.targetOwner,
    technicalStatus: "SUCCESS",
    semanticStatus: "FINDINGS_PRESENT",
    reviewRequired: disposition !== "CONTINUE" && disposition !== "CONTINUE_WITH_WARNING",
    humanDecisionRequired: invariant?.evaluationLevel === "HUMAN_ARBITRATION" || disposition === "REQUIRE_HUMAN_DECISION",
    blocking: severity === "BLOCKING" || disposition === "BLOCK_HANDOFF" || disposition === "FAIL_CLOSED",
    limitations: [],
    provenance: unique(item.evidence.flatMap((proof) => [proof.provenanceRef ?? "", proof.digest ?? ""])),
    automaticCorrectionAllowed: false,
    autoDecisionAllowed: false,
  };
});

export const resolveDomainValidationProviders = (
  providers: readonly DomainValidationProvider[],
  source: Readonly<ValidationArtifactSnapshot>,
  target: Readonly<ValidationArtifactSnapshot>,
  checkpoint: Readonly<ValidationCheckpointDefinition>,
) => providers.filter((provider) => provider.deterministic && provider.invariantRefs.some((ref) => checkpoint.invariantRefs.includes(ref)) && provider.supports(source, target, checkpoint));

export const adaptDomainValidationResultToVal = (result: ReturnType<DomainValidationProvider["validateReadOnly"]>) => ({ observations: clone(result.observations), findings: clone(result.findings) });

export const runDomainValidatorsReadOnly = (
  providers: readonly DomainValidationProvider[],
  source: Readonly<ValidationArtifactSnapshot>,
  target: Readonly<ValidationArtifactSnapshot>,
  checkpoint: Readonly<ValidationCheckpointDefinition>,
): DomainValidationExecutionResult => {
  const result: DomainValidationExecutionResult = { observations: [], findings: [], validatorVersions: [], failures: [] };
  resolveDomainValidationProviders(providers, source, target, checkpoint).forEach((provider) => {
    result.validatorVersions.push({ validatorId: provider.providerId, version: provider.version });
    try {
      const adapted = adaptDomainValidationResultToVal(provider.validateReadOnly(source, target, checkpoint));
      result.observations.push(...adapted.observations);
      result.findings.push(...adapted.findings);
    } catch (cause) {
      result.failures.push({ providerId: provider.providerId, validatorVersion: provider.version, errorClass: cause instanceof Error ? cause.name : "UNKNOWN_PROVIDER_ERROR", affectedInvariantRefs: provider.invariantRefs.filter((ref) => checkpoint.invariantRefs.includes(ref)), checkpointId: checkpoint.checkpointId });
    }
  });
  return result;
};

export const collectSemanticReviewRequests = (
  validationRunId: string,
  checkpoint: Readonly<ValidationCheckpointDefinition>,
  source: Readonly<ValidationArtifactSnapshot>,
  target: Readonly<ValidationArtifactSnapshot>,
  observations: readonly ValidationObservation[],
): SemanticValidationReviewRequest[] => {
  const unresolved = observations.filter((item) => !item.deterministic && item.observationType === "NON_MAPPED");
  if (!unresolved.length) return [];
  return checkpoint.invariantRefs.map((ref) => getValidationInvariantReference(ref)).filter((item) => item?.evaluationLevel === "SEMANTIC_REVIEW" && item.semanticReviewEligible).map((invariant) => {
    const material = { validationRunId, checkpoint: checkpoint.checkpointId, invariant: invariant!.invariantId, source: source.snapshotDigest, target: target.snapshotDigest };
    return {
      requestId: `val-semantic-review:${validationDigest(material)}`,
      validationRunId,
      checkpointRef: { checkpointId: checkpoint.checkpointId, version: checkpoint.version },
      invariantRefs: [invariant!.invariantId],
      sourceSnapshotRef: source.snapshotDigest,
      targetSnapshotRef: target.snapshotDigest,
      observationsNeedingReview: unresolved.map((item) => item.observationId),
      exactEvidenceRefs: unique(unresolved.flatMap((item) => item.evidence.map((proof) => proof.evidenceId))),
      semanticQuestion: "Do the referenced target structures preserve the source obligation without loss, promotion, or ownership change?",
      requiredPreservations: unique(invariant!.validationPlanes),
      forbiddenPromotions: ["candidate-to-adopted", "association-to-causality", "unknown-to-known", "projection-to-source-of-truth"],
      responseSchemaVersion: "VAL-001-SEMANTIC-REVIEW-1.0",
      providerPolicy: "DISABLED_BY_DEFAULT",
      limitations: ["Part 3 prepares this request but performs no cognitive operation."],
      sourceMutationAuthorized: false,
      targetMutationAuthorized: false,
      autoFixAllowed: false,
    };
  });
};

export const collectHumanReviewRequests = (
  validationRunId: string,
  checkpoint: Readonly<ValidationCheckpointDefinition>,
  observations: readonly ValidationObservation[],
  findings: readonly ValidationProductFinding[],
  forceInvariantRefs: readonly string[] = [],
): ValidationHumanReviewRequest[] => checkpoint.invariantRefs.map((ref) => getValidationInvariantReference(ref)).filter((item) => item?.evaluationLevel === "HUMAN_ARBITRATION" && item.humanArbitrationEligible).filter((invariant) => {
  if (forceInvariantRefs.includes(invariant!.invariantId)) return true;
  return findings.some((finding) => finding.invariantRef === invariant!.invariantId || finding.humanDecisionRequired) || observations.some((item) => item.invariantRef === invariant!.invariantId && ["CONFLICT", "STRENGTHENED"].includes(item.observationType));
}).map((invariant) => {
  const linkedFindings = findings.filter((finding) => finding.invariantRef === invariant!.invariantId || finding.humanDecisionRequired);
  const material = { validationRunId, checkpoint: checkpoint.checkpointId, invariant: invariant!.invariantId, findings: linkedFindings.map((item) => item.findingId) };
  return {
    requestId: `val-human-review:${validationDigest(material)}`,
    validationRunId,
    checkpointId: checkpoint.checkpointId,
    findingRefs: linkedFindings.map((item) => item.findingId),
    questionIntent: `Resolve the governed question for ${invariant!.invariantId}.`,
    reason: "The owner invariant requires Human Arbitration; semantic evidence cannot close it.",
    alternatives: [],
    evidence: linkedFindings.flatMap((item) => item.evidence),
    domainOwner: invariant!.owner,
    requiredMandate: invariant!.owner,
    blocking: true,
    limitations: ["This request is not a Human Decision and cannot mutate the validated artifacts."],
    boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE",
  };
});

export const computeValidationDisposition = (input: {
  applicability: CheckpointApplicability;
  technicalStatus: ValidationTechnicalStatus;
  findings: readonly ValidationProductFinding[];
  semanticReviewRequests: readonly SemanticValidationReviewRequest[];
  humanReviewRequests: readonly ValidationHumanReviewRequest[];
}): ValidationDisposition => {
  if (input.applicability.status === "NOT_APPLICABLE") return "NOT_APPLICABLE";
  if (input.applicability.status !== "APPLICABLE" || input.technicalStatus !== "SUCCESS") return "NOT_EVALUABLE";
  if (input.findings.some((item) => item.disposition === "FAIL_CLOSED")) return "FAIL_CLOSED";
  if (input.findings.some((item) => item.blocking)) return "BLOCK_HANDOFF";
  if (input.humanReviewRequests.length) return "REQUIRE_HUMAN_DECISION";
  if (input.semanticReviewRequests.length || input.findings.some((item) => item.reviewRequired)) return "REQUIRE_REVIEW";
  if (input.findings.length) return "CONTINUE_WITH_WARNING";
  return "CONTINUE";
};

const statusFor = (input: {
  applicability: CheckpointApplicability;
  technicalStatus: ValidationTechnicalStatus;
  findings: readonly ValidationProductFinding[];
  semanticRequests: readonly SemanticValidationReviewRequest[];
  humanRequests: readonly ValidationHumanReviewRequest[];
}): { runStatus: ValidationRun["status"]; historical: ValidationStatus; semantic: ValidationSemanticStatus; deterministicResult: ValidationRun["deterministicResult"] } => {
  if (input.applicability.status === "NOT_APPLICABLE") return { runStatus: "NOT_APPLICABLE", historical: "NOT_EVALUABLE", semantic: "NOT_APPLICABLE", deterministicResult: "NOT_RUN" };
  if (input.applicability.status !== "APPLICABLE") return { runStatus: "NOT_EVALUABLE", historical: "NOT_EVALUABLE", semantic: "NOT_EVALUABLE", deterministicResult: "NOT_EVALUABLE" };
  if (input.technicalStatus !== "SUCCESS") return { runStatus: "TECHNICAL_FAILURE", historical: "VALIDATOR_UNAVAILABLE", semantic: "NOT_EVALUABLE", deterministicResult: "NOT_EVALUABLE" };
  if (input.humanRequests.length) return { runStatus: "PENDING_HUMAN_REVIEW", historical: "REVIEW_REQUIRED", semantic: "REVIEW_REQUIRED", deterministicResult: "COMPLETE" };
  if (input.semanticRequests.length) return { runStatus: "PENDING_SEMANTIC_REVIEW", historical: "REVIEW_REQUIRED", semantic: "REVIEW_REQUIRED", deterministicResult: "COMPLETE" };
  if (input.findings.length) return { runStatus: "COMPLETE_WITH_FINDINGS", historical: input.findings.some((item) => item.blocking) ? "INVALID" : "VALID_WITH_WARNINGS", semantic: "FINDINGS_PRESENT", deterministicResult: "COMPLETE" };
  return { runStatus: "COMPLETE", historical: "VALID", semantic: "NO_FINDING", deterministicResult: "COMPLETE" };
};

const terminalRun = (
  checkpoint: ValidationCheckpointDefinition,
  applicability: CheckpointApplicability,
  sourceRef: ValidationArtifactReference | null,
  targetRef: ValidationArtifactReference | null,
  technicalTimestamp: string,
  limitations: string[],
): ValidationRun => {
  const technicalStatus: ValidationTechnicalStatus = applicability.status === "NOT_APPLICABLE" ? "NOT_RUN" : "MISSING_ARTIFACT";
  const state = statusFor({ applicability, technicalStatus: applicability.status === "NOT_APPLICABLE" ? "SUCCESS" : technicalStatus, findings: [], semanticRequests: [], humanRequests: [] });
  const baseId = validationDigest({ checkpoint: checkpoint.checkpointId, version: checkpoint.version, applicability, sourceRef, targetRef });
  return finalizeValidationRun({
    validationRunId: `val-run:${baseId}`,
    schemaVersion: VAL001_CONTRACT_VERSION,
    startedAt: technicalTimestamp,
    completedAt: technicalTimestamp,
    status: state.runStatus,
    historicalValidationStatus: state.historical,
    checkpointRef: { checkpointId: checkpoint.checkpointId, version: checkpoint.version },
    sourceArtifactRef: sourceRef,
    targetArtifactRef: targetRef,
    sourceSnapshotDigest: null,
    targetSnapshotDigest: null,
    applicability,
    previousRunRef: null,
    reasonForRevalidation: null,
    invariantRefs: [...checkpoint.invariantRefs],
    adapterVersions: [],
    validatorVersions: [{ validatorId: "VAL-001-DETERMINISTIC-ENGINE", version: VAL001_DETERMINISTIC_ENGINE_VERSION }],
    semanticReviewPolicy: checkpoint.semanticReviewPolicy,
    humanReviewPolicy: checkpoint.humanReviewPolicy,
    canonicalizationVersion: VAL001_CANONICALIZATION_VERSION,
    observations: [], findings: [], evidenceRefs: [], deterministicResult: state.deterministicResult, semanticReviewRequests: [], humanReviewRequests: [],
    technicalStatus,
    semanticStatus: state.semantic,
    disposition: applicability.status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "NOT_EVALUABLE",
    limitations: unique([...checkpoint.limitations, ...limitations, applicability.reason]),
    qualificationAuthority: "PD-011",
    sourceMutationAuthorized: false, targetMutationAuthorized: false, projectWriteAuthorized: false, documentWriteAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false, pd011QualificationClaimed: false,
    boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION",
  });
};

export const runCheckpointValidation = (input: Readonly<ValidationCheckpointExecutionInput>): ValidationRun => {
  const checkpoint = getValidationCheckpointV1(input.request.checkpointId, input.request.checkpointVersion);
  if (!checkpoint) throw new Error(`VAL_CHECKPOINT_UNKNOWN:${input.request.checkpointId}@${input.request.checkpointVersion}`);
  const timestamp = input.technicalTimestamp ?? "1970-01-01T00:00:00.000Z";
  const sourceBuild = findSnapshot(input.source, input.sourceSnapshot);
  const targetBuild = findSnapshot(input.target, input.targetSnapshot);
  const sourceRef = sourceBuild.snapshot?.reference ?? input.request.sourceArtifact;
  const targetRef = targetBuild.snapshot?.reference ?? input.request.targetArtifact;
  const applicability = inspectCheckpointApplicability(checkpoint, { sourceArtifact: sourceRef, targetArtifact: targetRef, notApplicable: input.notApplicable, realizedTimeRequired: input.realizedTimeRequired, notReady: input.notReady, decisionsRequired: input.decisionsRequired, limitations: input.limitations });
  if (applicability.status !== "APPLICABLE") return terminalRun(checkpoint, applicability, sourceRef, targetRef, timestamp, input.limitations ?? []);
  if (!sourceBuild.snapshot || !targetBuild.snapshot) {
    const notReady = { ...applicability, status: "NOT_READY" as const, reason: "A read-only adapter could not build both immutable snapshots." };
    return terminalRun(checkpoint, notReady, sourceRef, targetRef, timestamp, ["ADAPTER_FAILURE", ...(input.limitations ?? [])]);
  }

  const runIdentity = `val-run:${validationDigest({ checkpoint: checkpoint.checkpointId, version: checkpoint.version, source: sourceBuild.snapshot.snapshotDigest, target: targetBuild.snapshot.snapshotDigest, invariants: checkpoint.invariantRefs })}`;
  const deterministicObservations = buildDeterministicObservations(checkpoint, sourceBuild.snapshot, targetBuild.snapshot);
  const deterministicFindings = deriveValidationFindings(checkpoint, sourceBuild.snapshot.reference, targetBuild.snapshot.reference, deterministicObservations);
  const domain = runDomainValidatorsReadOnly(input.domainValidationProviders ?? [], sourceBuild.snapshot, targetBuild.snapshot, checkpoint);
  const observations = [...deterministicObservations, ...domain.observations].sort((left, right) => compareText(left.observationId, right.observationId));
  const findings = [...deterministicFindings, ...domain.findings].sort((left, right) => compareText(left.findingId, right.findingId));
  const semanticReviewRequests = collectSemanticReviewRequests(runIdentity, checkpoint, sourceBuild.snapshot, targetBuild.snapshot, observations);
  const humanReviewRequests = collectHumanReviewRequests(runIdentity, checkpoint, observations, findings, input.forceHumanReviewInvariantRefs);
  const technicalStatus: ValidationTechnicalStatus = domain.failures.length ? "DOMAIN_VALIDATOR_FAILURE" : "SUCCESS";
  const disposition = computeValidationDisposition({ applicability, technicalStatus, findings, semanticReviewRequests, humanReviewRequests });
  const state = statusFor({ applicability, technicalStatus, findings, semanticRequests: semanticReviewRequests, humanRequests: humanReviewRequests });
  const adapters = [sourceBuild.adapter, targetBuild.adapter].filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => ({ adapterId: item.adapterId, version: item.adapterVersion }));
  if (!adapters.length) adapters.push({ adapterId: "VAL-IMMUTABLE-SNAPSHOT-INPUT", version: "1.0.0" });
  const validatorVersions = [{ validatorId: "VAL-001-DETERMINISTIC-ENGINE", version: VAL001_DETERMINISTIC_ENGINE_VERSION }, ...domain.validatorVersions];
  return finalizeValidationRun({
    validationRunId: runIdentity,
    schemaVersion: VAL001_CONTRACT_VERSION,
    startedAt: timestamp,
    completedAt: timestamp,
    status: state.runStatus,
    historicalValidationStatus: state.historical,
    checkpointRef: { checkpointId: checkpoint.checkpointId, version: checkpoint.version },
    sourceArtifactRef: sourceBuild.snapshot.reference,
    targetArtifactRef: targetBuild.snapshot.reference,
    sourceSnapshotDigest: sourceBuild.snapshot.snapshotDigest,
    targetSnapshotDigest: targetBuild.snapshot.snapshotDigest,
    applicability,
    previousRunRef: null,
    reasonForRevalidation: null,
    invariantRefs: [...checkpoint.invariantRefs],
    adapterVersions: adapters,
    validatorVersions,
    semanticReviewPolicy: checkpoint.semanticReviewPolicy,
    humanReviewPolicy: checkpoint.humanReviewPolicy,
    canonicalizationVersion: VAL001_CANONICALIZATION_VERSION,
    observations,
    findings,
    evidenceRefs: unique(observations.flatMap((item) => item.evidence.map((proof) => proof.evidenceId))),
    deterministicResult: state.deterministicResult,
    semanticReviewRequests,
    humanReviewRequests,
    technicalStatus,
    semanticStatus: state.semantic,
    disposition,
    limitations: unique([...(input.limitations ?? []), ...domain.failures.map((failure) => `${failure.providerId}:${failure.errorClass}`)]),
    qualificationAuthority: "PD-011",
    sourceMutationAuthorized: false, targetMutationAuthorized: false, projectWriteAuthorized: false, documentWriteAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false, pd011QualificationClaimed: false,
    boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION",
  });
};

export const replayValidationRun = (run: Readonly<ValidationRun>, input: Readonly<ValidationCheckpointExecutionInput>): ValidationRun => {
  const replay = runCheckpointValidation(input);
  if (run.configurationDigest !== replay.configurationDigest) throw new Error("VAL_REPLAY_CONFIGURATION_MISMATCH");
  return replay;
};

export const traceFindingAcrossCheckpoint = (
  sourceFinding: Readonly<ValidationProductFinding>,
  downstreamFindings: readonly ValidationProductFinding[],
  resolutionEvidenceRefs: readonly string[] = [],
): ValidationFindingTrace => {
  const downstream = downstreamFindings.find((item) => item.domainFailureClassRef === sourceFinding.domainFailureClassRef || item.provenance.includes(sourceFinding.findingId));
  if (downstream) return { sourceFindingRef: sourceFinding.findingId, downstreamFindingRef: downstream.findingId, status: "PRESERVED", evidenceRefs: downstream.evidence.map((item) => item.evidenceId) };
  if (resolutionEvidenceRefs.length) return { sourceFindingRef: sourceFinding.findingId, downstreamFindingRef: null, status: "RESOLUTION_EVIDENCE_PRESENT", evidenceRefs: unique(resolutionEvidenceRefs) };
  return { sourceFindingRef: sourceFinding.findingId, downstreamFindingRef: null, status: "RESOLUTION_NOT_PROVEN", evidenceRefs: [] };
};

const corridorDisposition = (runs: readonly ValidationRun[]): CorridorValidationDisposition => {
  if (runs.some((run) => ["BLOCK_HANDOFF", "FAIL_CLOSED"].includes(run.disposition))) return "BLOCKED";
  if (runs.some((run) => run.status === "TECHNICAL_FAILURE" || run.status === "NOT_EVALUABLE")) return "NOT_EVALUABLE";
  if (runs.some((run) => run.status === "PENDING_HUMAN_REVIEW" || run.status === "PENDING_SEMANTIC_REVIEW" || run.findings.length)) return "CONTINUE_WITH_REVIEW";
  return "CONTINUE";
};

const buildCorridorSummary = (corridorId: string, runs: readonly ValidationRun[], generatedAt: string): CorridorValidationSummary => {
  const severity: Record<ValidationSeverity, number> = { INFO: 0, WARNING: 0, ERROR: 0, BLOCKING: 0 };
  runs.flatMap((run) => run.findings).forEach((finding) => { severity[finding.severity] += 1; });
  const material = {
    corridorId,
    checkpointRunRefs: runs.map((run) => run.validationRunId),
    completeCount: runs.filter((run) => ["COMPLETE", "COMPLETE_WITH_FINDINGS"].includes(run.status)).length,
    findingsCountBySeverity: severity,
    pendingSemanticReviewCount: runs.reduce((sum, run) => sum + run.semanticReviewRequests.length, 0),
    pendingHumanReviewCount: runs.reduce((sum, run) => sum + run.humanReviewRequests.length, 0),
    blockedCheckpointRefs: runs.filter((run) => ["BLOCK_HANDOFF", "FAIL_CLOSED"].includes(run.disposition)).map((run) => run.checkpointRef.checkpointId),
    notEvaluableCheckpointRefs: runs.filter((run) => run.status === "NOT_EVALUABLE").map((run) => run.checkpointRef.checkpointId),
    technicalFailureRefs: runs.filter((run) => run.status === "TECHNICAL_FAILURE").map((run) => run.validationRunId),
    productGateImpactRefs: unique(runs.flatMap((run) => getValidationCheckpointV1(run.checkpointRef.checkpointId, run.checkpointRef.version)?.productGateRefs ?? [])),
    disposition: corridorDisposition(runs),
    limitations: unique(runs.flatMap((run) => run.limitations)),
    projectionOnly: true as const,
    scientificQualificationClaimed: false as const,
  };
  return { ...material, generatedAt, summaryDigest: validationDigest(material) };
};

export const runValidationCorridor = (request: Readonly<ValidationCorridorRequest>): ValidationCorridorResult => {
  const runs: ValidationRun[] = [];
  for (const checkpoint of request.checkpoints) {
    const dependencies = request.dependencyPolicy?.[checkpoint.request.checkpointId] ?? [];
    const blockedDependency = runs.find((run) => dependencies.includes(run.checkpointRef.checkpointId) && ["BLOCK_HANDOFF", "FAIL_CLOSED", "NOT_EVALUABLE"].includes(run.disposition));
    runs.push(runCheckpointValidation(blockedDependency ? { ...checkpoint, notReady: true, limitations: [...(checkpoint.limitations ?? []), `BLOCKED_BY_DEPENDENCY:${blockedDependency.checkpointRef.checkpointId}`] } : checkpoint));
  }
  const generatedAt = request.generatedAt ?? "1970-01-01T00:00:00.000Z";
  return { runs, summary: buildCorridorSummary(request.corridorId, runs, generatedAt) };
};
