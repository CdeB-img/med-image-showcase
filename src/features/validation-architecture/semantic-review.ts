import type { HumanDecisionEnvelope, HumanDecisionEngineSource } from "@/features/protocol-designer/human-decision";
import { createHumanDecisionCandidate, hasHumanDecisionAuthority, isEngagingHumanDecision } from "@/features/protocol-designer/human-decision";
import { validationDigest } from "./canonical";
import { getValidationInvariantReference } from "./invariant-registry";
import { finalizeValidationRun } from "./product-canonical";
import { SEMANTIC_EQUIVALENCE_ASSESSMENTS } from "./product-contracts";
import type {
  SemanticEquivalenceAssessment,
  SemanticValidationReviewRequest,
  SemanticValidationReviewResult,
  ValidationArtifactSnapshot,
  ValidationEvidence,
  ValidationHumanReviewOutcomeReference,
  ValidationHumanReviewRequest,
  ValidationObservation,
  ValidationProductFinding,
  ValidationRun,
  ValidationTechnicalStatus,
} from "./product-contracts";

export const VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION = "VAL-001-SEMANTIC-REVIEW-1.0" as const;
export const SEMANTIC_REVIEW_PROVIDER_POLICY = "DISABLED_BY_DEFAULT" as const;

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort(compare);

export type SemanticReviewConfiguration = {
  reviewerId: string;
  reviewerVersion: string;
  providerIdentity: string;
  modelIdentity: string;
  promptVersion: string;
  responseSchemaVersion: typeof VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION;
  canonicalizationVersion: string;
  sourceSnapshotDigest: string;
  targetSnapshotDigest: string;
  invariantRefs: string[];
  checkpointRef: { checkpointId: string; version: string };
  providerPolicy: typeof SEMANTIC_REVIEW_PROVIDER_POLICY | "EXPLICITLY_ENABLED";
};

export type MinimalSemanticReviewPayload = {
  requestId: string;
  checkpointRef: SemanticValidationReviewRequest["checkpointRef"];
  invariantRefs: string[];
  question: string;
  requiredPreservations: string[];
  forbiddenPromotions: string[];
  source: Pick<ValidationArtifactSnapshot, "reference" | "owner" | "semanticObjects" | "relations" | "epistemicStates" | "decisions" | "unknowns" | "contradictions" | "limitations" | "snapshotDigest">;
  target: Pick<ValidationArtifactSnapshot, "reference" | "owner" | "semanticObjects" | "relations" | "epistemicStates" | "decisions" | "unknowns" | "contradictions" | "limitations" | "snapshotDigest">;
  unresolvedObservations: ValidationObservation[];
  responseSchemaVersion: typeof VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION;
};

export interface SemanticValidationReviewer {
  readonly reviewerId: string;
  readonly version: string;
  readonly modelProviderIdentity: { provider: string; model: string };
  readonly responseSchemaVersion: typeof VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION;
  readonly promptVersion: string;
  readonly limitations: readonly string[];
  supports(request: Readonly<SemanticValidationReviewRequest>): boolean;
  review(request: Readonly<SemanticValidationReviewRequest>, payload: Readonly<MinimalSemanticReviewPayload>): Promise<SemanticValidationReviewResult>;
}

export type StructuredSemanticReviewTransport = {
  transportId: string;
  execute(payload: Readonly<MinimalSemanticReviewPayload>, configuration: Readonly<SemanticReviewConfiguration>): Promise<{
    providerStatus: "SUCCESS" | "PROVIDER_UNAVAILABLE" | "TIMEOUT" | "RATE_LIMIT" | "SCHEMA_REJECTION";
    rawResponse: string;
    providerRequestId: string | null;
  }>;
};

export type SemanticReviewRawStore = {
  persistBeforeParse(record: {
    requestId: string;
    provider: string;
    model: string;
    promptVersion: string;
    schemaVersion: string;
    rawResponse: string;
    providerStatus: string;
    providerRequestId: string | null;
    startedAt: string;
    responseReceivedAt: string;
    parsingStatus: "NOT_STARTED";
    validationStatus: "NOT_STARTED";
  }): Promise<{ rawResponseRef: string }>;
  recordDisposition?(record: {
    rawResponseRef: string;
    parsingStatus: "NOT_RUN" | "FAILED" | "SUCCEEDED";
    validationStatus: "NOT_RUN" | "FAILED" | "PASSED";
    completedAt: string;
  }): Promise<void>;
};

const contextualText = (values: readonly string[], refs: Set<string>) => refs.size ? values.filter((value) => [...refs].some((ref) => value.includes(ref))) : [...values];

const snapshotPayload = (snapshot: Readonly<ValidationArtifactSnapshot>, refs: Set<string>) => ({
  reference: snapshot.reference,
  owner: snapshot.owner,
  semanticObjects: snapshot.semanticObjects.filter((item) => !refs.size || refs.has(item.objectId) || item.sourceRefs.some((ref) => refs.has(ref))),
  relations: snapshot.relations.filter((item) => !refs.size || refs.has(item.relationId) || refs.has(item.sourceObjectId) || refs.has(item.targetObjectId)),
  epistemicStates: snapshot.epistemicStates.filter((item) => !refs.size || refs.has(item.subjectId)),
  decisions: snapshot.decisions.filter((item) => !refs.size || item.targetRefs.some((ref) => refs.has(ref))),
  unknowns: contextualText(snapshot.unknowns, refs),
  contradictions: contextualText(snapshot.contradictions, refs),
  limitations: contextualText(snapshot.limitations, refs),
  snapshotDigest: snapshot.snapshotDigest,
});

export const buildMinimalSemanticReviewPayload = (
  request: Readonly<SemanticValidationReviewRequest>,
  source: Readonly<ValidationArtifactSnapshot>,
  target: Readonly<ValidationArtifactSnapshot>,
  observations: readonly ValidationObservation[],
): MinimalSemanticReviewPayload => {
  const selected = observations.filter((item) => request.observationsNeedingReview.includes(item.observationId));
  const refs = new Set(selected.flatMap((item) => [item.sourceRef, item.targetRef]).filter(Boolean));
  return {
    requestId: request.requestId,
    checkpointRef: request.checkpointRef,
    invariantRefs: [...request.invariantRefs],
    question: request.semanticQuestion,
    requiredPreservations: [...request.requiredPreservations],
    forbiddenPromotions: [...request.forbiddenPromotions],
    source: snapshotPayload(source, refs),
    target: snapshotPayload(target, refs),
    unresolvedObservations: structuredClone(selected),
    responseSchemaVersion: VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  };
};

export type ExternalPayloadInspection = { allowed: boolean; violations: string[] };

export const inspectSemanticReviewPayloadForExternalUse = (payload: Readonly<MinimalSemanticReviewPayload>): ExternalPayloadInspection => {
  const violations: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (typeof value === "string") {
      if (/\b(?:AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{12,}|Bearer\s+[0-9A-Za-z._-]{12,})\b/.test(value)) violations.push(`${path}:SECRET_VALUE_FORBIDDEN`);
      if (/\b(?:patient[_ -]?id|patient[_ -]?identifier|medical[_ -]?record|mrn)\s*[:=]/i.test(value)) violations.push(`${path}:PATIENT_IDENTIFIER_FORBIDDEN`);
      if (/\b(?:BLIND_SEALED|SEM3-BLIND-|sealed-reference)\b/i.test(value)) violations.push(`${path}:BLIND_CONTENT_FORBIDDEN`);
      return;
    }
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (!value || typeof value !== "object") return;
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const normalized = key.toLowerCase();
      if (["patientid", "patientidentifier", "rawclinicaldata", "clinicalrecord", "medicalrecord", "apikey", "api_key", "secret", "password", "credential"].includes(normalized)) violations.push(`${path}.${key}:FORBIDDEN_SENSITIVE_FIELD`);
      if ((normalized === "exposurestatus" && item === "BLIND_SEALED") || (normalized === "blind" && item === true)) violations.push(`${path}.${key}:BLIND_CONTENT_FORBIDDEN`);
      if (normalized === "externalizable" && item === false) violations.push(`${path}.${key}:NON_EXTERNALIZABLE_ARTIFACT`);
      visit(item, `${path}.${key}`);
    });
  };
  visit(payload, "payload");
  return { allowed: violations.length === 0, violations: unique(violations) };
};

export const inspectSemanticReviewExecutionEligibility = (input: {
  run: Readonly<ValidationRun>;
  request: Readonly<SemanticValidationReviewRequest>;
  payload: Readonly<MinimalSemanticReviewPayload>;
}): { eligible: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  const invariantRefs = input.request.invariantRefs.map((ref) => getValidationInvariantReference(ref));
  if (input.run.deterministicResult !== "COMPLETE") reasons.push("DETERMINISTIC_VALIDATION_NOT_COMPLETE");
  if (input.run.status !== "PENDING_SEMANTIC_REVIEW") reasons.push("RUN_NOT_PENDING_SEMANTIC_REVIEW");
  if (!input.run.semanticReviewRequests.some((request) => request.requestId === input.request.requestId)) reasons.push("SEMANTIC_REVIEW_REQUEST_NOT_ATTACHED_TO_RUN");
  if (!input.request.invariantRefs.every((ref) => input.run.invariantRefs.includes(ref))) reasons.push("SEMANTIC_REVIEW_INVARIANT_NOT_ATTACHED_TO_RUN");
  if (!input.run.sourceSnapshotDigest || !input.run.targetSnapshotDigest) reasons.push("SNAPSHOT_DIGEST_MISSING");
  if (!input.request.semanticQuestion.trim()) reasons.push("SEMANTIC_QUESTION_MISSING");
  if (!input.request.exactEvidenceRefs.length || !input.request.observationsNeedingReview.length) reasons.push("SEMANTIC_REVIEW_EVIDENCE_MISSING");
  if (invariantRefs.some((invariant) => !invariant || !invariant.semanticReviewEligible)) reasons.push("INVARIANT_NOT_SEMANTIC_REVIEW_ELIGIBLE");
  if (invariantRefs.some((invariant) => invariant?.evaluationLevel === "HUMAN_ARBITRATION") || input.run.humanReviewRequests.some((request) => request.blocking)) reasons.push("HUMAN_ARBITRATION_HAS_PRIORITY");
  reasons.push(...inspectSemanticReviewPayloadForExternalUse(input.payload).violations);
  return { eligible: reasons.length === 0, reasons: unique(reasons) };
};

export const computeSemanticReviewConfigurationDigest = (configuration: Readonly<SemanticReviewConfiguration>) => validationDigest({ ...configuration, invariantRefs: unique(configuration.invariantRefs) });

export const canReuseSemanticReviewResult = (
  result: Readonly<SemanticValidationReviewResult>,
  configuration: Readonly<SemanticReviewConfiguration>,
): boolean => Boolean(
  result.status === "COMPLETE"
  && result.technicalStatus === "SUCCESS"
  && result.configurationDigest === computeSemanticReviewConfigurationDigest(configuration)
  && result.sourceSnapshotDigest === configuration.sourceSnapshotDigest
  && result.targetSnapshotDigest === configuration.targetSnapshotDigest
  && result.reviewerId === configuration.reviewerId
  && result.reviewerVersion === configuration.reviewerVersion
  && result.providerIdentity === configuration.providerIdentity
  && result.modelIdentity === configuration.modelIdentity
  && result.promptVersion === configuration.promptVersion
  && result.responseSchemaVersion === configuration.responseSchemaVersion
);

const hasSemanticReviewResultShape = (value: unknown): value is SemanticValidationReviewResult => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Partial<SemanticValidationReviewResult>;
  return typeof result.reviewId === "string"
    && typeof result.requestId === "string"
    && ["PENDING", "COMPLETE", "NOT_EVALUABLE"].includes(result.status ?? "")
    && Array.isArray(result.invariantAssessments)
    && Array.isArray(result.semanticEquivalenceAssessments)
    && Array.isArray(result.detectedLosses)
    && Array.isArray(result.detectedAdditions)
    && Array.isArray(result.detectedPromotions)
    && Array.isArray(result.ambiguities)
    && Array.isArray(result.contradictions)
    && Array.isArray(result.evidence)
    && Array.isArray(result.limitations)
    && typeof result.requiresHumanReview === "boolean"
    && result.sourceMutationAuthorized === false
    && result.targetMutationAuthorized === false
    && result.autoFixAllowed === false
    && result.autoDecisionAllowed === false;
};

const providerFailureResult = (request: SemanticValidationReviewRequest, configuration: SemanticReviewConfiguration, technicalStatus: ValidationTechnicalStatus, rawResponseRef: string | null, limitation: string): SemanticValidationReviewResult => ({
  reviewId: `val-semantic-result:${validationDigest({ request: request.requestId, technicalStatus, configuration: computeSemanticReviewConfigurationDigest(configuration) })}`,
  requestId: request.requestId,
  status: "NOT_EVALUABLE",
  invariantAssessments: [],
  semanticEquivalenceAssessments: [],
  detectedLosses: [], detectedAdditions: [], detectedPromotions: [], ambiguities: [], contradictions: [], evidence: [],
  confidenceKind: "NOT_ASSESSED",
  requiresHumanReview: false,
  limitations: [limitation],
  sourceMutationAuthorized: false, targetMutationAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false,
  reviewerId: configuration.reviewerId,
  reviewerVersion: configuration.reviewerVersion,
  providerIdentity: configuration.providerIdentity,
  modelIdentity: configuration.modelIdentity,
  promptVersion: configuration.promptVersion,
  responseSchemaVersion: configuration.responseSchemaVersion,
  configurationDigest: computeSemanticReviewConfigurationDigest(configuration),
  sourceSnapshotDigest: configuration.sourceSnapshotDigest,
  targetSnapshotDigest: configuration.targetSnapshotDigest,
  rawResponseRef,
  technicalStatus,
});

export const executeStructuredSemanticReview = async (input: {
  request: SemanticValidationReviewRequest;
  payload: MinimalSemanticReviewPayload;
  configuration: SemanticReviewConfiguration;
  transport: StructuredSemanticReviewTransport;
  rawStore: SemanticReviewRawStore;
  parse: (raw: string) => unknown;
  now?: () => string;
}): Promise<SemanticValidationReviewResult> => {
  if (input.configuration.providerPolicy !== "EXPLICITLY_ENABLED") return providerFailureResult(input.request, input.configuration, "PROVIDER_UNAVAILABLE", null, "Semantic review provider is disabled by default.");
  const inspection = inspectSemanticReviewPayloadForExternalUse(input.payload);
  if (!inspection.allowed) return providerFailureResult(input.request, input.configuration, "SCHEMA_REJECTION", null, inspection.violations.join(";"));
  const now = input.now ?? (() => new Date().toISOString());
  const startedAt = now();
  const response = await input.transport.execute(input.payload, input.configuration);
  const persisted = await input.rawStore.persistBeforeParse({ requestId: input.request.requestId, provider: input.configuration.providerIdentity, model: input.configuration.modelIdentity, promptVersion: input.configuration.promptVersion, schemaVersion: input.configuration.responseSchemaVersion, rawResponse: response.rawResponse, providerStatus: response.providerStatus, providerRequestId: response.providerRequestId, startedAt, responseReceivedAt: now(), parsingStatus: "NOT_STARTED", validationStatus: "NOT_STARTED" });
  const finalizeRaw = async (parsingStatus: "NOT_RUN" | "FAILED" | "SUCCEEDED", validationStatus: "NOT_RUN" | "FAILED" | "PASSED") => input.rawStore.recordDisposition?.({ rawResponseRef: persisted.rawResponseRef, parsingStatus, validationStatus, completedAt: now() });
  if (response.providerStatus !== "SUCCESS") { await finalizeRaw("NOT_RUN", "NOT_RUN"); return providerFailureResult(input.request, input.configuration, response.providerStatus, persisted.rawResponseRef, `Transport status ${response.providerStatus}.`); }
  let parsed: unknown;
  try { parsed = input.parse(response.rawResponse); } catch { await finalizeRaw("FAILED", "NOT_RUN"); return providerFailureResult(input.request, input.configuration, "PARSING_FAILURE", persisted.rawResponseRef, "Raw response could not be parsed."); }
  if (!hasSemanticReviewResultShape(parsed)) { await finalizeRaw("SUCCEEDED", "FAILED"); return providerFailureResult(input.request, input.configuration, "INVALID_STRUCTURED_OUTPUT", persisted.rawResponseRef, "Parsed response does not satisfy the semantic review transport contract."); }
  const result = { ...parsed, rawResponseRef: persisted.rawResponseRef };
  const validation = validateSemanticReviewResult(input.request, result, input.configuration);
  if (!validation.valid) { await finalizeRaw("SUCCEEDED", "FAILED"); return providerFailureResult(input.request, input.configuration, "INTERNAL_VALIDATION_FAILURE", persisted.rawResponseRef, validation.errors.join(";")); }
  await finalizeRaw("SUCCEEDED", "PASSED");
  return result;
};

export type SemanticReviewValidation = { valid: boolean; errors: string[] };

export const validateSemanticReviewResult = (
  request: Readonly<SemanticValidationReviewRequest>,
  result: Readonly<SemanticValidationReviewResult>,
  configuration?: Readonly<SemanticReviewConfiguration>,
): SemanticReviewValidation => {
  const errors: string[] = [];
  if (!hasSemanticReviewResultShape(result)) return { valid: false, errors: ["SEMANTIC_REVIEW_INVALID_STRUCTURED_OUTPUT"] };
  const allowedTopLevel = new Set([
    "reviewId", "requestId", "status", "invariantAssessments", "semanticEquivalenceAssessments", "detectedLosses", "detectedAdditions", "detectedPromotions", "ambiguities", "contradictions", "evidence", "confidenceKind", "requiresHumanReview", "limitations", "sourceMutationAuthorized", "targetMutationAuthorized", "autoFixAllowed", "autoDecisionAllowed", "reviewerId", "reviewerVersion", "providerIdentity", "modelIdentity", "promptVersion", "responseSchemaVersion", "configurationDigest", "sourceSnapshotDigest", "targetSnapshotDigest", "rawResponseRef", "technicalStatus",
  ]);
  Object.keys(result).filter((key) => !allowedTopLevel.has(key)).forEach((key) => errors.push(`SEMANTIC_REVIEW_UNKNOWN_FIELD:${key}`));
  const allowedAssessmentFields = new Set(["invariantRef", "assessment", "evidenceRefs", "sourceEvidenceRefs", "targetEvidenceRefs", "reasoningSummary", "preservedDimensions", "changedDimensions", "lostDimensions", "addedDimensions", "forbiddenPromotionsDetected", "ambiguity", "confidenceKind", "requiresHumanReview", "limitations"]);
  result.invariantAssessments.forEach((assessment, index) => {
    Object.keys(assessment).filter((key) => !allowedAssessmentFields.has(key)).forEach((key) => errors.push(`SEMANTIC_REVIEW_UNKNOWN_ASSESSMENT_FIELD:${index}:${key}`));
    if (!SEMANTIC_EQUIVALENCE_ASSESSMENTS.includes(assessment.assessment)) errors.push(`SEMANTIC_REVIEW_INVALID_ASSESSMENT:${index}`);
    if (!Array.isArray(assessment.evidenceRefs)) errors.push(`SEMANTIC_REVIEW_INVALID_EVIDENCE_REFS:${index}`);
  });
  if (result.status === "COMPLETE" && (!result.technicalStatus || result.technicalStatus === "SUCCESS")) request.invariantRefs.filter((invariantRef) => !result.invariantAssessments.some((assessment) => assessment.invariantRef === invariantRef)).forEach((invariantRef) => errors.push(`SEMANTIC_REVIEW_MISSING_INVARIANT:${invariantRef}`));
  if (result.requestId !== request.requestId) errors.push("SEMANTIC_REVIEW_REQUEST_MISMATCH");
  if (result.sourceMutationAuthorized || result.targetMutationAuthorized || result.autoFixAllowed || result.autoDecisionAllowed) errors.push("SEMANTIC_REVIEW_FORBIDDEN_ACTION");
  const forbiddenKeys = ["adopt", "reject", "rewrite", "changeProject", "updateTarget", "correct", "correctedTarget", "correctedTargetArtifact", "preferredOption", "recommendedMethod", "finalScientificConclusion"];
  forbiddenKeys.forEach((key) => { if (key in (result as unknown as Record<string, unknown>)) errors.push(`SEMANTIC_REVIEW_FORBIDDEN_FIELD:${key}`); });
  result.invariantAssessments.forEach((assessment) => {
    if (!request.invariantRefs.includes(assessment.invariantRef)) errors.push(`SEMANTIC_REVIEW_UNKNOWN_INVARIANT:${assessment.invariantRef}`);
    const sourceEvidence = assessment.sourceEvidenceRefs ?? assessment.evidenceRefs;
    const targetEvidence = assessment.targetEvidenceRefs ?? assessment.evidenceRefs;
    if (["EQUIVALENT", "EQUIVALENT_WITH_QUALIFICATION", "PARTIALLY_EQUIVALENT"].includes(assessment.assessment) && (!sourceEvidence.length || !targetEvidence.length)) errors.push(`SEMANTIC_REVIEW_EQUIVALENCE_WITHOUT_BILATERAL_EVIDENCE:${assessment.invariantRef}`);
  });
  if (configuration) {
    const digest = computeSemanticReviewConfigurationDigest(configuration);
    if (result.configurationDigest !== digest) errors.push("SEMANTIC_REVIEW_CONFIGURATION_MISMATCH");
    if (result.sourceSnapshotDigest !== configuration.sourceSnapshotDigest || result.targetSnapshotDigest !== configuration.targetSnapshotDigest) errors.push("SEMANTIC_REVIEW_STALE_SNAPSHOT");
    if (result.reviewerId !== configuration.reviewerId || result.reviewerVersion !== configuration.reviewerVersion || result.modelIdentity !== configuration.modelIdentity || result.promptVersion !== configuration.promptVersion || result.responseSchemaVersion !== configuration.responseSchemaVersion) errors.push("SEMANTIC_REVIEW_IDENTITY_DRIFT");
  }
  return { valid: errors.length === 0, errors: unique(errors) };
};

const semanticEvidence = (result: SemanticValidationReviewResult, invariantRef: string): ValidationEvidence => ({
  evidenceId: `val-semantic-evidence:${validationDigest({ review: result.reviewId, invariantRef })}`,
  kind: "COMPARISON_NOTE",
  sourcePath: null, targetPath: null, sourceObjectRef: null, targetObjectRef: null, exactSourceSpan: null, relationRef: null, decisionRef: null,
  provenanceRef: result.reviewId,
  digest: result.configurationDigest ?? validationDigest(result),
  auditFindingRef: null, domainValidatorResultRef: null,
  comparisonNote: `Bounded semantic assessment ${invariantRef}; no source or target mutation authorized.`,
});

export const applySemanticReviewEvidenceToValidationRun = (
  run: Readonly<ValidationRun>,
  result: Readonly<SemanticValidationReviewResult>,
): ValidationRun => finalizeValidationRun({
  ...structuredClone(run),
  validationRunId: `val-run:${validationDigest({ previous: run.validationRunId, semanticReview: result.reviewId })}`,
  previousRunRef: run.validationRunId,
  reasonForRevalidation: "SEMANTIC_REVIEW_EVIDENCE_ATTACHED",
  semanticReviewResults: [...(run.semanticReviewResults ?? []), structuredClone(result)],
  evidenceRefs: unique([...run.evidenceRefs, ...result.evidence.map((item) => item.evidenceId)]),
  resultDigest: "",
  configurationDigest: run.configurationDigest,
});

const semanticFindingClass = (assessment: SemanticEquivalenceAssessment, result: SemanticValidationReviewResult, invariantRef: string): string => {
  const dimensions = result.invariantAssessments.find((item) => item.invariantRef === invariantRef)?.changedDimensions ?? [];
  if (assessment === "AMBIGUOUS") return "SEMANTIC_AMBIGUITY";
  if (assessment === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_SEMANTIC_EVIDENCE";
  if (assessment === "EQUIVALENT_WITH_QUALIFICATION") return "SEMANTIC_EQUIVALENCE_QUALIFIED";
  if (assessment === "PARTIALLY_EQUIVALENT") return "SEMANTIC_PARTIAL_LOSS";
  if (result.detectedPromotions.length || dimensions.includes("causality")) return "SEMANTIC_PROMOTION";
  if (dimensions.includes("polarity")) return "SEMANTIC_POLARITY_CHANGE";
  if (dimensions.includes("temporality")) return "SEMANTIC_TEMPORAL_CHANGE";
  if (dimensions.includes("ownership")) return "SEMANTIC_OWNER_CHANGE";
  if (dimensions.includes("scope")) return "SEMANTIC_SCOPE_CHANGE";
  return "SEMANTIC_LOSS";
};

const semanticFinding = (run: ValidationRun, invariantRef: string, assessment: SemanticEquivalenceAssessment, result: SemanticValidationReviewResult): ValidationProductFinding => {
  const invariant = getValidationInvariantReference(invariantRef);
  const proof = semanticEvidence(result, invariantRef);
  const blocking = ["NOT_EQUIVALENT"].includes(assessment) && invariant?.severityDefault === "BLOCKING";
  return {
    findingId: `val-finding:${validationDigest({ run: run.validationRunId, review: result.reviewId, invariantRef, assessment })}`,
    checkpointId: run.checkpointRef.checkpointId,
    invariantRef,
    observationRefs: [],
    findingClass: semanticFindingClass(assessment, result, invariantRef),
    domainFailureClassRef: invariant?.domainFailureClassRef ?? null,
    severity: assessment === "EQUIVALENT_WITH_QUALIFICATION" ? "WARNING" : invariant?.severityDefault ?? "ERROR",
    disposition: assessment === "AMBIGUOUS" || assessment === "INSUFFICIENT_EVIDENCE" ? "REQUIRE_HUMAN_DECISION" : blocking ? "BLOCK_HANDOFF" : "REQUIRE_REVIEW",
    sourceArtifactRef: run.sourceArtifactRef!, targetArtifactRef: run.targetArtifactRef!, evidence: [proof], owner: invariant?.owner ?? "NOXIA_PRODUCT", reviewOwner: invariant?.owner ?? "NOXIA_PRODUCT",
    technicalStatus: "SUCCESS", semanticStatus: "FINDINGS_PRESENT", reviewRequired: true,
    humanDecisionRequired: assessment === "AMBIGUOUS" || assessment === "INSUFFICIENT_EVIDENCE" || invariant?.evaluationLevel === "HUMAN_ARBITRATION",
    blocking, limitations: result.limitations, provenance: [result.reviewId], automaticCorrectionAllowed: false, autoDecisionAllowed: false,
  };
};

export const resolveAfterSemanticReview = (input: {
  run: ValidationRun;
  request: SemanticValidationReviewRequest;
  result: SemanticValidationReviewResult;
  configuration?: SemanticReviewConfiguration;
}): ValidationRun => {
  const validation = validateSemanticReviewResult(input.request, input.result, input.configuration);
  if (!validation.valid) return finalizeValidationRun({
    ...structuredClone(input.run),
    validationRunId: `val-run:${validationDigest({ previous: input.run.validationRunId, rejectedSemanticReview: input.result.reviewId })}`,
    previousRunRef: input.run.validationRunId,
    reasonForRevalidation: "SEMANTIC_REVIEW_RESULT_REJECTED",
    status: "TECHNICAL_FAILURE",
    historicalValidationStatus: "VALIDATOR_UNAVAILABLE",
    technicalStatus: "INTERNAL_VALIDATION_FAILURE",
    semanticStatus: "NOT_EVALUABLE",
    disposition: "NOT_EVALUABLE",
    limitations: unique([...input.run.limitations, ...validation.errors]),
    resultDigest: "",
    configurationDigest: input.run.configurationDigest,
  });
  const next = applySemanticReviewEvidenceToValidationRun(input.run, input.result);
  if (input.result.technicalStatus && input.result.technicalStatus !== "SUCCESS") return finalizeValidationRun({ ...structuredClone(next), status: "TECHNICAL_FAILURE", historicalValidationStatus: "VALIDATOR_UNAVAILABLE", technicalStatus: input.result.technicalStatus, semanticStatus: "NOT_EVALUABLE", disposition: "NOT_EVALUABLE", limitations: unique([...next.limitations, ...input.result.limitations]), resultDigest: "", configurationDigest: next.configurationDigest });
  const assessments = input.result.invariantAssessments;
  const findings = assessments.filter((item) => !["EQUIVALENT", "NOT_REQUIRED", "NOT_APPLICABLE"].includes(item.assessment)).map((item) => semanticFinding(next, item.invariantRef, item.assessment, input.result));
  const hInvariant = assessments.some((item) => getValidationInvariantReference(item.invariantRef)?.evaluationLevel === "HUMAN_ARBITRATION");
  const needsHuman = hInvariant || input.result.requiresHumanReview || assessments.some((item) => item.requiresHumanReview || ["AMBIGUOUS", "INSUFFICIENT_EVIDENCE"].includes(item.assessment));
  const humanRequest: ValidationHumanReviewRequest[] = needsHuman ? [{
    requestId: `val-human-review:${validationDigest({ run: next.validationRunId, review: input.result.reviewId })}`,
    validationRunId: next.validationRunId,
    checkpointId: next.checkpointRef.checkpointId,
    findingRefs: findings.map((item) => item.findingId),
    questionIntent: "Arbitrate the unresolved semantic mapping without changing the validated artifacts.",
    reason: hInvariant ? "A Level H invariant remains human-owned." : "Semantic evidence remains ambiguous or insufficient.",
    alternatives: [], evidence: input.result.evidence, domainOwner: findings[0]?.reviewOwner ?? "RESEARCH_PROJECT", requiredMandate: findings[0]?.reviewOwner ?? "RESEARCH_PROJECT", blocking: true,
    limitations: ["The semantic reviewer cannot choose the engaging interpretation."], boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE",
  }] : [];
  const unresolvedRequestIds = new Set([input.request.requestId]);
  const remainingRequests = next.semanticReviewRequests.filter((item) => !unresolvedRequestIds.has(item.requestId));
  return finalizeValidationRun({
    ...structuredClone(next),
    status: humanRequest.length ? "PENDING_HUMAN_REVIEW" : findings.length ? "COMPLETE_WITH_FINDINGS" : "COMPLETE",
    historicalValidationStatus: humanRequest.length || findings.length ? "REVIEW_REQUIRED" : "VALID",
    findings: [...next.findings, ...findings],
    semanticReviewRequests: remainingRequests,
    humanReviewRequests: [...next.humanReviewRequests, ...humanRequest],
    technicalStatus: "SUCCESS",
    semanticStatus: humanRequest.length ? "REVIEW_REQUIRED" : findings.length ? "FINDINGS_PRESENT" : "NO_FINDING",
    disposition: humanRequest.length ? "REQUIRE_HUMAN_DECISION" : findings.some((item) => item.blocking) ? "BLOCK_HANDOFF" : findings.length ? "REQUIRE_REVIEW" : "CONTINUE",
    resultDigest: "",
    configurationDigest: next.configurationDigest,
  });
};

const engineSourceFor = (checkpointId: string): HumanDecisionEngineSource => checkpointId.includes("DOC") || checkpointId.includes("TMP") ? "DOCUMENT" : checkpointId.includes("IMG") || checkpointId.includes("OBS") ? "IMAGING" : checkpointId.includes("PRJ") || checkpointId.includes("BIO") || checkpointId.includes("DATA") ? "RESEARCH_PROJECT" : "SCIENTIFIC_THINKING";

export const buildHumanDecisionTargetFromValidationReviewRequest = (request: Readonly<ValidationHumanReviewRequest>): HumanDecisionEnvelope => createHumanDecisionCandidate({
  decisionId: `human-decision:${validationDigest({ validationReview: request.requestId })}`,
  gateId: request.requestId,
  scope: unique([request.checkpointId, ...request.findingRefs]),
  targets: [request.requestId],
  reason: request.reason,
  provenance: unique([request.validationRunId, ...request.evidence.map((item) => item.evidenceId)]),
  engineSource: engineSourceFor(request.checkpointId),
});

export const resolveValidationAfterHumanDecision = (input: {
  run: ValidationRun;
  request: ValidationHumanReviewRequest;
  decision: HumanDecisionEnvelope;
  reasonForRevalidation?: string;
}): { accepted: boolean; errors: string[]; outcomeReference: ValidationHumanReviewOutcomeReference | null; run: ValidationRun } => {
  const errors: string[] = [];
  const expected = buildHumanDecisionTargetFromValidationReviewRequest(input.request);
  if (!input.run.humanReviewRequests.some((request) => request.requestId === input.request.requestId)) errors.push("HUMAN_REVIEW_REQUEST_NOT_ATTACHED_TO_RUN");
  if (input.decision.gateId !== input.request.requestId || !input.decision.targets.includes(input.request.requestId)) errors.push("HUMAN_DECISION_WRONG_VALIDATION_REQUEST");
  if (input.decision.engineSource !== expected.engineSource) errors.push("HUMAN_DECISION_WRONG_DOMAIN_OWNER");
  if (!expected.scope.every((ref) => input.decision.scope.includes(ref))) errors.push("HUMAN_DECISION_SCOPE_INCOMPLETE");
  if (!expected.provenance.every((ref) => input.decision.provenance.includes(ref))) errors.push("HUMAN_DECISION_PROVENANCE_INCOMPLETE");
  if (!hasHumanDecisionAuthority(input.decision)) errors.push("HUMAN_DECISION_AUTHORITY_MISSING");
  if (input.decision.mandate !== input.request.requiredMandate) errors.push("HUMAN_DECISION_MANDATE_MISMATCH");
  if (!isEngagingHumanDecision(input.decision.status)) errors.push("HUMAN_DECISION_NOT_ENGAGING");
  if (errors.length) return { accepted: false, errors, outcomeReference: null, run: input.run };
  const outcomeReference: ValidationHumanReviewOutcomeReference = {
    humanDecisionId: input.decision.decisionId,
    version: input.decision.version,
    actor: input.decision.actor!, mandate: input.decision.mandate!, targetRefs: [...input.decision.targets], disposition: input.decision.status,
    provenance: [...input.decision.provenance], validationReviewRequestRef: input.request.requestId, projectVersion: input.decision.projectVersion,
  };
  const unresolvedByDisposition = input.decision.status !== "ADOPTED";
  const blockingFindingRefs = new Set(input.run.findings.filter((finding) => finding.blocking).map((finding) => finding.findingId));
  const unresolvedFindingRefs = new Set(input.request.findingRefs.filter((findingRef) => unresolvedByDisposition || blockingFindingRefs.has(findingRef)));
  const remainsBlocking = input.run.findings.some((finding) => finding.blocking && unresolvedFindingRefs.has(finding.findingId));
  const next = finalizeValidationRun({
    ...structuredClone(input.run),
    validationRunId: `val-run:${validationDigest({ previous: input.run.validationRunId, humanDecision: input.decision.decisionId, version: input.decision.version })}`,
    previousRunRef: input.run.validationRunId,
    reasonForRevalidation: input.reasonForRevalidation ?? "HUMAN_DECISION_EVIDENCE_ATTACHED",
    humanReviewOutcomeRefs: [...(input.run.humanReviewOutcomeRefs ?? []), outcomeReference],
    humanReviewRequests: input.run.humanReviewRequests.filter((item) => item.requestId !== input.request.requestId),
    findingLifecycleRefs: [
      ...(input.run.findingLifecycleRefs ?? []),
      ...input.request.findingRefs.map((findingRef) => ({ findingRef, status: unresolvedFindingRefs.has(findingRef) ? "REVIEW_REQUIRED" as const : "RESOLVED_BY_HUMAN_DECISION" as const, observedInRunRef: input.run.validationRunId, resolutionEvidenceRefs: [input.decision.decisionId], humanDecisionRef: input.decision.decisionId, supersedingRunRef: null })),
    ],
    status: "COMPLETE_WITH_FINDINGS",
    historicalValidationStatus: remainsBlocking || unresolvedByDisposition ? "REVIEW_REQUIRED" : "VALID_WITH_WARNINGS",
    semanticStatus: input.run.findings.length ? "FINDINGS_PRESENT" : "NO_FINDING",
    disposition: remainsBlocking ? "REQUIRE_DOMAIN_OWNER" : unresolvedByDisposition ? "REQUIRE_HUMAN_DECISION" : "CONTINUE_WITH_WARNING",
    resultDigest: "",
    configurationDigest: input.run.configurationDigest,
  });
  return { accepted: true, errors: [], outcomeReference, run: next };
};

export type SemanticReviewObservability = {
  semanticReviewRequests: number;
  semanticReviewCalls: number;
  semanticReviewCacheHits: number;
  semanticReviewTechnicalFailures: number;
  invalidStructuredOutputs: number;
  semanticEquivalent: number;
  semanticQualified: number;
  semanticNotEquivalent: number;
  semanticAmbiguous: number;
  insufficientEvidence: number;
  humanReviewEscalations: number;
  callsAvoidedByDeterministicValidation: number;
  deferred: number;
  notRequired: number;
};

export const buildSemanticReviewObservability = (input: {
  runs: readonly ValidationRun[];
  semanticReviewCalls?: number;
  semanticReviewCacheHits?: number;
  deterministicAvoidedInvariantRefs?: readonly string[];
  deferredInvariantRefs?: readonly string[];
  notRequiredInvariantRefs?: readonly string[];
}): SemanticReviewObservability => {
  const results = input.runs.flatMap((run) => run.semanticReviewResults ?? []);
  const assessments = results.flatMap((result) => result.invariantAssessments.map((item) => item.assessment));
  return {
    semanticReviewRequests: input.runs.reduce((total, run) => total + run.semanticReviewRequests.length, 0),
    semanticReviewCalls: input.semanticReviewCalls ?? 0,
    semanticReviewCacheHits: input.semanticReviewCacheHits ?? 0,
    semanticReviewTechnicalFailures: results.filter((result) => result.technicalStatus && result.technicalStatus !== "SUCCESS").length,
    invalidStructuredOutputs: results.filter((result) => result.technicalStatus === "INVALID_STRUCTURED_OUTPUT").length,
    semanticEquivalent: assessments.filter((assessment) => assessment === "EQUIVALENT").length,
    semanticQualified: assessments.filter((assessment) => assessment === "EQUIVALENT_WITH_QUALIFICATION" || assessment === "PARTIALLY_EQUIVALENT").length,
    semanticNotEquivalent: assessments.filter((assessment) => assessment === "NOT_EQUIVALENT").length,
    semanticAmbiguous: assessments.filter((assessment) => assessment === "AMBIGUOUS").length,
    insufficientEvidence: assessments.filter((assessment) => assessment === "INSUFFICIENT_EVIDENCE").length,
    humanReviewEscalations: input.runs.reduce((total, run) => total + run.humanReviewRequests.length, 0),
    callsAvoidedByDeterministicValidation: unique(input.deterministicAvoidedInvariantRefs ?? []).length,
    deferred: unique(input.deferredInvariantRefs ?? []).length,
    notRequired: unique(input.notRequiredInvariantRefs ?? []).length,
  };
};
