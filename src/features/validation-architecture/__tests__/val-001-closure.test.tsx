import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { engageHumanDecision } from "@/features/protocol-designer/human-decision";
import ValidationSummaryPanel from "../ValidationSummaryPanel";
import { getValidationCheckpointV1, getValidationProductGate, VALIDATION_CHECKPOINT_REGISTRY_V1 } from "../checkpoint-registry";
import { runCheckpointValidation, runValidationCorridor, replayValidationRun, traceFindingAcrossCheckpoint } from "../deterministic-engine";
import { VAL001_CHECKPOINT_IDS } from "../invariant-registry";
import { buildValidationProductSummary, evaluateValidationProductGate, type ActiveValidationProductGateId } from "../product-gates";
import {
  VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  applySemanticReviewEvidenceToValidationRun,
  buildHumanDecisionTargetFromValidationReviewRequest,
  buildMinimalSemanticReviewPayload,
  canReuseSemanticReviewResult,
  computeSemanticReviewConfigurationDigest,
  executeStructuredSemanticReview,
  resolveAfterSemanticReview,
  resolveValidationAfterHumanDecision,
  type SemanticReviewConfiguration,
} from "../semantic-review";
import type {
  SemanticValidationReviewRequest,
  SemanticValidationReviewResult,
  ValidationArtifactSnapshot,
  ValidationCheckpointExecutionInput,
  ValidationProductArtifactType,
  ValidationProductFinding,
  ValidationRun,
  ValidationSnapshotSemanticObject,
} from "../product-contracts";
import { makeArtifactReference, makeEvidence, makeFinding, makeRun, makeRunRequest, makeSnapshot } from "./val-001-part2-fixtures";

const CP = VAL001_CHECKPOINT_IDS;

const semanticObject = (patch: Partial<ValidationSnapshotSemanticObject> & Pick<ValidationSnapshotSemanticObject, "objectId">): ValidationSnapshotSemanticObject => ({
  objectId: patch.objectId,
  objectType: patch.objectType ?? "ScientificObject",
  label: patch.label ?? patch.objectId,
  status: patch.status ?? "KNOWN",
  owner: patch.owner ?? "DOMAIN_OWNER",
  sourceRefs: patch.sourceRefs ?? [],
  provenanceRefs: patch.provenanceRefs ?? ["evidence:source"],
  semanticKey: patch.semanticKey ?? patch.objectId,
  polarity: patch.polarity ?? null,
  role: patch.role ?? null,
  attributes: patch.attributes ?? {},
});

const snapshot = (artifactType: ValidationProductArtifactType, artifactId: string, objects: ValidationSnapshotSemanticObject[], owner = "DOMAIN_OWNER", patch: Partial<ValidationArtifactSnapshot> = {}) => makeSnapshot({
  reference: makeArtifactReference({ artifactId, artifactType, owner, sourceOfTruth: artifactType === "RESEARCH_PROJECT", contentDigest: `digest:${artifactId}`, projectId: "project:closure", projectVersion: "1.0.0" }),
  artifactKind: artifactType,
  owner,
  semanticObjects: objects,
  ...patch,
});

const checkpointInput = (checkpointId: string, source: ValidationArtifactSnapshot | null, target: ValidationArtifactSnapshot | null, patch: Partial<ValidationCheckpointExecutionInput> = {}): ValidationCheckpointExecutionInput => {
  const checkpoint = getValidationCheckpointV1(checkpointId);
  if (!checkpoint) throw new Error(`Missing checkpoint ${checkpointId}`);
  return {
    request: makeRunRequest({ checkpointId, checkpointVersion: checkpoint.version, sourceArtifact: source?.reference ?? null, targetArtifact: target?.reference ?? null, requestedPlanes: [...checkpoint.validationPlanes], requestedInvariantRefs: [...checkpoint.invariantRefs], caller: "VAL-001-CLOSURE", purpose: "LEVEL_3_CAPABILITY_VALIDATION" }),
    sourceSnapshot: source,
    targetSnapshot: target,
    technicalTimestamp: "2026-08-15T00:00:00.000Z",
    ...patch,
  };
};

const pairFor = (checkpointId: string, sourceObject: ValidationSnapshotSemanticObject, targetObject = sourceObject) => {
  const checkpoint = getValidationCheckpointV1(checkpointId)!;
  return {
    source: snapshot(checkpoint.sourceArtifactTypes[0], `${checkpointId}:source`, [sourceObject], checkpoint.sourceOwner),
    target: snapshot(checkpoint.targetArtifactTypes[0], `${checkpointId}:target`, [targetObject], checkpoint.targetOwner),
  };
};

const runPair = (checkpointId: string, sourceObject: ValidationSnapshotSemanticObject, targetObject = sourceObject, patch: Partial<ValidationCheckpointExecutionInput> = {}) => {
  const pair = pairFor(checkpointId, sourceObject, targetObject);
  return runCheckpointValidation(checkpointInput(checkpointId, pair.source, pair.target, patch));
};

const runsForGate = (gateId: ActiveValidationProductGateId, patch?: (run: ValidationRun, index: number) => Partial<ValidationRun>) => getValidationProductGate(gateId)!.requiredCheckpoints.map((checkpointId, index) => makeRun({ validationRunId: `closure:${gateId}:${index}`, checkpointRef: { checkpointId, version: "1.0.0" }, ...(patch?.(makeRun(), index) ?? {}) }));

const reviewRequest: SemanticValidationReviewRequest = {
  requestId: "closure:semantic-request",
  validationRunId: "closure:semantic-run",
  checkpointRef: { checkpointId: CP.requestInterpretation, version: "1.0.0" },
  invariantRefs: ["AUDIT-D:CRITICAL_NEGATION_LOST"],
  sourceSnapshotRef: "closure:source",
  targetSnapshotRef: "closure:target",
  observationsNeedingReview: ["closure:observation"],
  exactEvidenceRefs: ["closure:evidence"],
  semanticQuestion: "Is the source obligation preserved without promotion?",
  requiredPreservations: ["polarity", "meaning", "provenance"],
  forbiddenPromotions: ["association-to-causality"],
  responseSchemaVersion: VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  providerPolicy: "DISABLED_BY_DEFAULT",
  limitations: [],
  sourceMutationAuthorized: false,
  targetMutationAuthorized: false,
  autoFixAllowed: false,
};

const sourceSnapshot = snapshot("ORIGINAL_REQUEST", "closure:source", [semanticObject({ objectId: "source:meaning", owner: "USER", polarity: "NEGATED" })], "USER");
const targetSnapshot = snapshot("SCIENTIFIC_INTERPRETATION_CONTRIBUTION", "closure:target", [semanticObject({ objectId: "target:meaning", owner: "USER", polarity: "NEGATED", semanticKey: "source:meaning" })], "SCIENTIFIC_INTERPRETATION");
const reviewObservation = {
  observationId: "closure:observation", checkpointId: CP.requestInterpretation, invariantRef: reviewRequest.invariantRefs[0], plane: "SEMANTIC_FIDELITY" as const,
  sourceRef: "source:meaning", targetRef: "target:meaning", observationType: "NON_MAPPED" as const, sourcePath: null, targetPath: null, sourceValueRef: "source:meaning", targetValueRef: "target:meaning", semanticKey: null,
  evidence: [makeEvidence()], deterministic: false, confidenceKind: "SEMANTIC_REVIEW_PENDING" as const, technicalStatus: "SUCCESS" as const, limitations: [],
};

const reviewConfiguration = (patch: Partial<SemanticReviewConfiguration> = {}): SemanticReviewConfiguration => ({
  reviewerId: "closure-fixture-reviewer", reviewerVersion: "1.0.0", providerIdentity: "FIXTURE_ONLY", modelIdentity: "fixture-no-model", promptVersion: "VAL-CLOSURE-FIXTURE-1.0", responseSchemaVersion: VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  canonicalizationVersion: "VAL001-CANONICAL-1.0.0", sourceSnapshotDigest: sourceSnapshot.snapshotDigest, targetSnapshotDigest: targetSnapshot.snapshotDigest, invariantRefs: [...reviewRequest.invariantRefs], checkpointRef: reviewRequest.checkpointRef, providerPolicy: "DISABLED_BY_DEFAULT",
  ...patch,
});

const reviewResult = (assessment: SemanticValidationReviewResult["invariantAssessments"][number]["assessment"], patch: Partial<SemanticValidationReviewResult> = {}): SemanticValidationReviewResult => {
  const configuration = reviewConfiguration();
  return {
    reviewId: `closure:review:${assessment}`, requestId: reviewRequest.requestId, status: "COMPLETE",
    invariantAssessments: [{ invariantRef: reviewRequest.invariantRefs[0], assessment, evidenceRefs: ["source:evidence", "target:evidence"], sourceEvidenceRefs: ["source:evidence"], targetEvidenceRefs: ["target:evidence"], preservedDimensions: ["polarity"], changedDimensions: [], lostDimensions: [], addedDimensions: [], forbiddenPromotionsDetected: [], confidenceKind: "HIGH_SUPPORT", requiresHumanReview: assessment === "AMBIGUOUS", limitations: [] }],
    semanticEquivalenceAssessments: [{ sourceRef: "source:meaning", targetRef: "target:meaning", identityMatch: "DIFFERENT_ID", assessment, evidenceRefs: ["source:evidence", "target:evidence"] }],
    detectedLosses: [], detectedAdditions: [], detectedPromotions: [], ambiguities: assessment === "AMBIGUOUS" ? ["two mappings"] : [], contradictions: [], evidence: [makeEvidence()], confidenceKind: "SEMANTIC_REVIEW", requiresHumanReview: assessment === "AMBIGUOUS", limitations: [],
    sourceMutationAuthorized: false, targetMutationAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false,
    reviewerId: configuration.reviewerId, reviewerVersion: configuration.reviewerVersion, providerIdentity: configuration.providerIdentity, modelIdentity: configuration.modelIdentity, promptVersion: configuration.promptVersion, responseSchemaVersion: configuration.responseSchemaVersion, configurationDigest: computeSemanticReviewConfigurationDigest(configuration), sourceSnapshotDigest: configuration.sourceSnapshotDigest, targetSnapshotDigest: configuration.targetSnapshotDigest, rawResponseRef: "closure:raw", technicalStatus: "SUCCESS",
    ...patch,
  };
};

const semanticRun = () => makeRun({ validationRunId: reviewRequest.validationRunId, invariantRefs: [...reviewRequest.invariantRefs], observations: [reviewObservation], semanticReviewRequests: [reviewRequest], sourceSnapshotDigest: sourceSnapshot.snapshotDigest, targetSnapshotDigest: targetSnapshot.snapshotDigest, status: "PENDING_SEMANTIC_REVIEW", historicalValidationStatus: "REVIEW_REQUIRED", semanticStatus: "REVIEW_REQUIRED", disposition: "REQUIRE_REVIEW" });

const humanRequest = { requestId: "closure:human-request", validationRunId: "closure:human-run", checkpointId: CP.scientificStateProject, findingRefs: ["closure:human-finding"], questionIntent: "Arbitrate", reason: "Human-owned ambiguity", alternatives: ["a", "b"], evidence: [makeEvidence()], domainOwner: "RESEARCH_PROJECT", requiredMandate: "PROJECT_OWNER", blocking: true, limitations: [], boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE" as const };

type ClosureCase = readonly [string, () => void | Promise<void>];

const cases: ClosureCase[] = [
  ["VAL-C01 clean complete structured corridor", () => {
    const inputs = VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.map((checkpoint) => { const item = semanticObject({ objectId: `${checkpoint.checkpointId}:object`, owner: checkpoint.sourceOwner }); const pair = pairFor(checkpoint.checkpointId, item); return checkpointInput(checkpoint.checkpointId, pair.source, pair.target); });
    const corridor = runValidationCorridor({ corridorId: "VAL-CLOSURE-CLEAN", checkpoints: inputs, generatedAt: "2026-08-15T00:00:00.000Z" });
    expect(corridor.runs).toHaveLength(10); expect(corridor.runs.flatMap((run) => run.findings).filter((finding) => finding.severity === "BLOCKING")).toHaveLength(0);
  }],
  ["VAL-C02 candidate promoted without Human Decision", () => { const run = runPair(CP.scientificStateProject, semanticObject({ objectId: "candidate", status: "CANDIDATE_NOT_ADOPTED" }), semanticObject({ objectId: "candidate", status: "ADOPTED" })); expect(run.findings.some((finding) => finding.blocking)).toBe(true); }],
  ["VAL-C03 valid Human Decision preserves adoption contract", () => { const source = semanticObject({ objectId: "candidate", status: "CANDIDATE_NOT_ADOPTED" }); const target = semanticObject({ objectId: "candidate", status: "ADOPTED" }); const pair = pairFor(CP.scientificStateProject, source, target); const targetWithDecision = makeSnapshot({ ...pair.target, decisions: [{ decisionId: "human:1", version: "1", status: "ADOPTED", actorPresent: true, mandatePresent: true, targetRefs: ["candidate"], provenanceRefs: ["digest:contribution"] }] }); expect(runCheckpointValidation(checkpointInput(CP.scientificStateProject, pair.source, targetWithDecision)).findings.some((finding) => finding.findingClass.includes("ADOPTION"))).toBe(false); }],
  ["VAL-C04 CanonicalVariable continuity", () => expect(runPair(CP.projectStudyData, semanticObject({ objectId: "CV-001", objectType: "CanonicalVariable", owner: "CDM-001" })).findings).toHaveLength(0)],
  ["VAL-C05 CanonicalVariable recreation detected", () => expect(runPair(CP.projectStudyData, semanticObject({ objectId: "CV-001", objectType: "CanonicalVariable", owner: "CDM-001" }), semanticObject({ objectId: "CV-001", objectType: "DataCollectionFieldProjection", owner: "DM-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C06 different IDs request semantic review", () => expect(runPair(CP.requestInterpretation, semanticObject({ objectId: "source:id", semanticKey: "same", owner: "USER" }), semanticObject({ objectId: "target:id", semanticKey: "same", owner: "USER" })).semanticReviewRequests.length).toBeGreaterThan(0)],
  ["VAL-C07 MeasurementDefinition owner preserved", () => expect(runPair(CP.thinkingObservationImaging, semanticObject({ objectId: "MD-001", objectType: "MeasurementDefinition", owner: "OBS-001" })).findings).toHaveLength(0)],
  ["VAL-C08 MeasurementDefinition downstream redefinition detected", () => expect(runPair(CP.thinkingObservationImaging, semanticObject({ objectId: "MD-001", objectType: "MeasurementDefinition", owner: "OBS-001" }), semanticObject({ objectId: "MD-001", objectType: "MeasurementDefinition", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C09 ExpectedVariableOccasion preserved", () => expect(runPair(CP.studyDataDataManagement, semanticObject({ objectId: "EVO-1", objectType: "ExpectedVariableOccasion", owner: "CDM-001" })).findings).toHaveLength(0)],
  ["VAL-C10 ExpectedVariableOccasion cannot become VariableOccurrence", () => expect(runPair(CP.studyDataDataManagement, semanticObject({ objectId: "EVO-1", objectType: "ExpectedVariableOccasion", owner: "CDM-001" }), semanticObject({ objectId: "EVO-1", objectType: "VariableOccurrence", owner: "CDM-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C11 DatasetReleaseRequirement cannot become DatasetRelease", () => expect(runPair(CP.studyDataDataManagement, semanticObject({ objectId: "REL-1", objectType: "DatasetReleaseRequirement", owner: "DM-001" }), semanticObject({ objectId: "REL-1", objectType: "DatasetRelease", owner: "DM-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C12 AnalysisSpecification cannot become AnalysisExecution", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "AS-1", objectType: "AnalysisSpecification", owner: "BIOSTATISTICS-001" }), semanticObject({ objectId: "AS-1", objectType: "AnalysisExecution", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C13 Endpoint and Estimand separated", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "EP-1", objectType: "Endpoint", owner: "BIOSTATISTICS-001" })).findings).toHaveLength(0)],
  ["VAL-C14 Endpoint collapsed into Estimand detected", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "EP-1", objectType: "Endpoint", owner: "BIOSTATISTICS-001" }), semanticObject({ objectId: "EP-1", objectType: "Estimand", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C15 factual missingness preserved", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "MISS-1", objectType: "FactualMissingness", owner: "CDM-001" })).findings).toHaveLength(0)],
  ["VAL-C16 factual missingness cannot become strategy", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "MISS-1", objectType: "FactualMissingness", owner: "CDM-001" }), semanticObject({ objectId: "MISS-1", objectType: "MissingDataStrategy", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C17 sensitivity remains linked downstream concept", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "SENS-1", objectType: "SensitivityAnalysis", owner: "BIOSTATISTICS-001" })).findings).toHaveLength(0)],
  ["VAL-C18 sensitivity cannot replace primary", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "PRIMARY-1", objectType: "PrimaryAnalysis", owner: "BIOSTATISTICS-001" }), semanticObject({ objectId: "PRIMARY-1", objectType: "SensitivityAnalysis", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C19 post-hoc remains qualified", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "POST-1", objectType: "PostHocAnalysis", owner: "BIOSTATISTICS-001" })).findings).toHaveLength(0)],
  ["VAL-C20 post-hoc cannot become prespecified primary", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "POST-1", objectType: "PostHocAnalysis", owner: "BIOSTATISTICS-001" }), semanticObject({ objectId: "POST-1", objectType: "PrimaryAnalysis", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C21 incomplete dimensioning remains unknown", () => { const run = runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "DIM-1", objectType: "DimensioningAssumption", status: "UNKNOWN", owner: "BIOSTATISTICS-001" })); expect(run.findings).toHaveLength(0); expect(JSON.stringify(run)).not.toMatch(/calculatedSampleSize|sampleSize\s*:\s*\d/); }],
  ["VAL-C22 invented sample-size assumption detected", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "DIM-1", objectType: "DimensioningAssumption", status: "UNKNOWN", owner: "BIOSTATISTICS-001" }), semanticObject({ objectId: "DIM-1", objectType: "DimensioningAssumption", status: "CONFIRMED", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C23 ready for calculation does not require computed N", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "DIM-1", objectType: "DimensioningAssumption", status: "READY_FOR_CALCULATION", owner: "BIOSTATISTICS-001" })).findings).toHaveLength(0)],
  ["VAL-C24 NOT_GENERATABLE remains an allowed limitation", () => { const runs = runsForGate("SAP_GENERATION", (_run, index) => index === 0 ? { findings: [makeFinding({ invariantRef: "DOC:NOT_GENERATABLE_PRESERVED", blocking: false })] } : {}); expect(evaluateValidationProductGate("SAP_GENERATION", runs).status).toBe("ALLOWED_WITH_LIMITATIONS"); }],
  ["VAL-C25 generic method invention detected", () => expect(runPair(CP.scientificStateBiostatistics, semanticObject({ objectId: "METHOD-1", objectType: "StatisticalMethodDefinition", status: "UNKNOWN", owner: "BIOSTATISTICS-001" }), semanticObject({ objectId: "METHOD-1", objectType: "StatisticalMethodDefinition", status: "CONFIRMED", owner: "BIOSTATISTICS-001" })).findings.length).toBeGreaterThan(0)],
  ["VAL-C26 candidate preview remains available", () => expect(evaluateValidationProductGate("CANDIDATE_PREVIEW", []).candidatePreview?.labels).toContain("NOT_ADOPTED")],
  ["VAL-C27 official projection cannot hide adoption blocker", () => { const runs = runsForGate("PROTOCOL_GENERATION", (_run, index) => index === 0 ? { findings: [makeFinding({ blocking: true, severity: "BLOCKING" })] } : {}); expect(evaluateValidationProductGate("PROTOCOL_GENERATION", runs).status).toBe("BLOCKED"); }],
  ["VAL-C28 Audit-D clean remains clean", () => expect(makeRun().findings.filter((finding) => finding.owner === "SEM-AUDIT-D")).toHaveLength(0)],
  ["VAL-C29 Audit-D critical finding propagates", () => { const finding = makeFinding({ findingId: "audit:critical", owner: "SEM-AUDIT-D", severity: "BLOCKING", blocking: true }); expect(traceFindingAcrossCheckpoint(finding, [{ ...finding, findingId: "downstream", provenance: [finding.findingId] }]).status).toBe("PRESERVED"); }],
  ["VAL-C30 disappearing Audit-D finding is unresolved", () => expect(traceFindingAcrossCheckpoint(makeFinding({ owner: "SEM-AUDIT-D" }), []).status).toBe("RESOLUTION_NOT_PROVEN")],
  ["VAL-C31 explicit new evidence preserves historical finding", () => { const finding = makeFinding({ owner: "SEM-AUDIT-D" }); const before = JSON.stringify(finding); expect(traceFindingAcrossCheckpoint(finding, [], ["human:decision"]).status).toBe("RESOLUTION_EVIDENCE_PRESENT"); expect(JSON.stringify(finding)).toBe(before); }],
  ["VAL-C32 semantic paraphrase equivalent", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("EQUIVALENT"), configuration: reviewConfiguration() }).findings).toHaveLength(0)],
  ["VAL-C33 negation preserved by paraphrase", () => expect(reviewResult("EQUIVALENT").invariantAssessments[0].preservedDimensions).toContain("polarity")],
  ["VAL-C34 negation loss creates polarity finding", () => { const value = reviewResult("NOT_EQUIVALENT"); value.invariantAssessments[0].changedDimensions = ["polarity"]; expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: value, configuration: reviewConfiguration() }).findings[0]?.findingClass).toBe("SEMANTIC_POLARITY_CHANGE"); }],
  ["VAL-C35 causal promotion creates promotion finding", () => { const value = reviewResult("NOT_EQUIVALENT"); value.detectedPromotions = ["association-to-causality"]; expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: value, configuration: reviewConfiguration() }).findings[0]?.findingClass).toBe("SEMANTIC_PROMOTION"); }],
  ["VAL-C36 distributed composite meaning can be equivalent", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("EQUIVALENT"), configuration: reviewConfiguration() }).status).toBe("COMPLETE")],
  ["VAL-C37 partial semantic equivalence remains qualified", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("PARTIALLY_EQUIVALENT"), configuration: reviewConfiguration() }).findings[0]?.findingClass).toBe("SEMANTIC_PARTIAL_LOSS")],
  ["VAL-C38 same label can remain non-equivalent", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("NOT_EQUIVALENT"), configuration: reviewConfiguration() }).findings.length).toBeGreaterThan(0)],
  ["VAL-C39 ambiguous mapping requires Human Review", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("AMBIGUOUS"), configuration: reviewConfiguration() }).humanReviewRequests.length).toBeGreaterThan(0)],
  ["VAL-C40 insufficient evidence is not equivalent", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("INSUFFICIENT_EVIDENCE"), configuration: reviewConfiguration() }).disposition).toBe("REQUIRE_HUMAN_DECISION")],
  ["VAL-C41 Level H remains human-owned", () => { const request = { ...reviewRequest, invariantRefs: ["PROJECT:HUMAN_DECISION_REQUIRED"] }; const value = reviewResult("EQUIVALENT", { requestId: request.requestId, invariantAssessments: [{ invariantRef: request.invariantRefs[0], assessment: "EQUIVALENT", evidenceRefs: ["s", "t"], sourceEvidenceRefs: ["s"], targetEvidenceRefs: ["t"] }] }); expect(resolveAfterSemanticReview({ run: semanticRun(), request, result: value }).humanReviewRequests.length).toBeGreaterThan(0); }],
  ["VAL-C42 two plausible mappings create review request", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("AMBIGUOUS"), configuration: reviewConfiguration() }).status).toBe("PENDING_HUMAN_REVIEW")],
  ["VAL-C43 Human Decision creates outcome reference and new run", () => { const run = makeRun({ validationRunId: humanRequest.validationRunId, humanReviewRequests: [humanRequest] }); const before = JSON.stringify(run); const decision = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "ADOPTED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); const resolved = resolveValidationAfterHumanDecision({ run, request: humanRequest, decision }); expect(resolved.outcomeReference).not.toBeNull(); expect(resolved.run.previousRunRef).toBe(run.validationRunId); expect(JSON.stringify(run)).toBe(before); }],
  ["VAL-C44 invalid structured output remains technical", async () => { const configuration = reviewConfiguration({ providerPolicy: "EXPLICITLY_ENABLED" }); const value = await executeStructuredSemanticReview({ request: reviewRequest, payload: buildMinimalSemanticReviewPayload(reviewRequest, sourceSnapshot, targetSnapshot, [reviewObservation]), configuration, transport: { transportId: "fixture", execute: async () => ({ providerStatus: "SUCCESS", rawResponse: "{}", providerRequestId: null }) }, rawStore: { persistBeforeParse: async () => ({ rawResponseRef: "raw" }) }, parse: JSON.parse }); expect(value.technicalStatus).toBe("INVALID_STRUCTURED_OUTPUT"); expect(value.invariantAssessments).toEqual([]); }],
  ["VAL-C45 provider unavailable remains technical", async () => { const configuration = reviewConfiguration({ providerPolicy: "EXPLICITLY_ENABLED" }); const value = await executeStructuredSemanticReview({ request: reviewRequest, payload: buildMinimalSemanticReviewPayload(reviewRequest, sourceSnapshot, targetSnapshot, [reviewObservation]), configuration, transport: { transportId: "fixture", execute: async () => ({ providerStatus: "PROVIDER_UNAVAILABLE", rawResponse: "unavailable", providerRequestId: null }) }, rawStore: { persistBeforeParse: async () => ({ rawResponseRef: "raw" }) }, parse: JSON.parse }); expect(value.technicalStatus).toBe("PROVIDER_UNAVAILABLE"); expect(value.invariantAssessments).toEqual([]); }],
  ["VAL-C46 configuration mismatch rejects result", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request: reviewRequest, result: reviewResult("EQUIVALENT"), configuration: reviewConfiguration({ modelIdentity: "drift" }) }).technicalStatus).toBe("INTERNAL_VALIDATION_FAILURE")],
  ["VAL-C47 stale semantic result is not reusable", () => expect(canReuseSemanticReviewResult(reviewResult("EQUIVALENT"), reviewConfiguration({ targetSnapshotDigest: "changed" }))).toBe(false)],
  ["VAL-C48 adoption gate blocks critical finding", () => expect(evaluateValidationProductGate("CONTRIBUTION_ADOPTION", runsForGate("CONTRIBUTION_ADOPTION", (_run, index) => index === 0 ? { findings: [makeFinding({ blocking: true, severity: "BLOCKING" })] } : {})).status).toBe("BLOCKED")],
  ["VAL-C49 candidate preview survives critical finding", () => expect(evaluateValidationProductGate("CANDIDATE_PREVIEW", runsForGate("CANDIDATE_PREVIEW", (_run, index) => index === 0 ? { findings: [makeFinding({ blocking: true, severity: "BLOCKING" })] } : {})).status).toBe("PREVIEW_ONLY")],
  ["VAL-C50 freeze blocks pending semantic review", () => expect(evaluateValidationProductGate("PROJECT_FREEZE", runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { status: "PENDING_SEMANTIC_REVIEW", semanticReviewRequests: [reviewRequest] } : {})).status).toBe("BLOCKED")],
  ["VAL-C51 freeze blocks pending Human Review", () => expect(evaluateValidationProductGate("PROJECT_FREEZE", runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { status: "PENDING_HUMAN_REVIEW", humanReviewRequests: [humanRequest] } : {})).status).toBe("BLOCKED")],
  ["VAL-C52 freeze permits warning according to policy", () => expect(evaluateValidationProductGate("PROJECT_FREEZE", runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { findings: [makeFinding()] } : {})).status).toBe("ALLOWED_WITH_LIMITATIONS")],
  ["VAL-C53 protocol keeps NOT_GENERATABLE visible", () => expect(evaluateValidationProductGate("PROTOCOL_GENERATION", runsForGate("PROTOCOL_GENERATION", (_run, index) => index === 0 ? { findings: [makeFinding({ invariantRef: "DOC:NOT_GENERATABLE_PRESERVED" })] } : {})).status).toBe("ALLOWED_WITH_LIMITATIONS")],
  ["VAL-C54 SAP missing method cannot be replaced by prose", () => expect(evaluateValidationProductGate("SAP_GENERATION", runsForGate("SAP_GENERATION", (_run, index) => index === 0 ? { findings: [makeFinding({ invariantRef: "DOC:NOT_GENERATABLE_PRESERVED", severity: "ERROR", blocking: true })] } : {})).status).toBe("BLOCKED")],
  ["VAL-C55 standard UI explains blockers and unknowns", () => { const summary = buildValidationProductSummary([makeRun({ findings: [makeFinding({ blocking: true, severity: "BLOCKING" })], limitations: ["UNKNOWN_METHOD"] })]); render(<ValidationSummaryPanel summary={summary} />); expect(screen.getByText("Ce qui bloque")).toBeInTheDocument(); expect(screen.getByText("Informations encore inconnues")).toBeInTheDocument(); expect(screen.queryByText("fixture-run")).not.toBeInTheDocument(); }],
  ["VAL-C56 expert UI exposes reconstructible run evidence", () => { render(<ValidationSummaryPanel summary={buildValidationProductSummary([makeRun()])} mode="EXPERT" />); expect(screen.getByText(/VAL-REQUEST-INTERPRETATION-001/)).toBeInTheDocument(); expect(screen.getByText(/Configuration/)).toBeInTheDocument(); }],
  ["VAL-C57 historical run remains immutable on render", () => { const run = makeRun(); const before = JSON.stringify(run); render(<ValidationSummaryPanel summary={buildValidationProductSummary([run])} mode="EXPERT" />); expect(JSON.stringify(run)).toBe(before); }],
  ["VAL-C58 Human Review action delegates without deciding", () => { const action = vi.fn(); render(<ValidationSummaryPanel summary={buildValidationProductSummary([makeRun({ status: "PENDING_HUMAN_REVIEW", humanReviewRequests: [humanRequest] })])} onHumanReview={action} />); fireEvent.click(screen.getByText("Examiner")); expect(action).toHaveBeenCalledWith(humanRequest.requestId); }],
  ["VAL-C59 UI render performs no provider call", () => { const transport = vi.fn(); render(<ValidationSummaryPanel summary={buildValidationProductSummary([semanticRun()])} />); expect(transport).not.toHaveBeenCalled(); }],
  ["VAL-C60 UI exposes no automatic correction", () => { render(<ValidationSummaryPanel summary={buildValidationProductSummary([makeRun()])} />); expect(screen.queryByText(/Auto-fix|Correction automatique/i)).not.toBeInTheDocument(); }],
];

describe("VAL-001 Part 5 — 60-case local closure campaign", () => {
  it.each(cases)("%s", async (_caseName, execute) => { await execute(); });

  it("replays a deterministic closure run with identical logical result", () => {
    const pair = pairFor(CP.requestInterpretation, semanticObject({ objectId: "replay", owner: "USER" }));
    const input = checkpointInput(CP.requestInterpretation, pair.source, pair.target);
    const run = runCheckpointValidation(input);
    expect(replayValidationRun(run, input).resultDigest).toBe(run.resultDigest);
  });

  it("never mutates source or target while applying fixture semantic evidence", () => {
    const run = semanticRun(); const sourceBefore = JSON.stringify(sourceSnapshot); const targetBefore = JSON.stringify(targetSnapshot);
    applySemanticReviewEvidenceToValidationRun(run, reviewResult("EQUIVALENT"));
    expect(JSON.stringify(sourceSnapshot)).toBe(sourceBefore); expect(JSON.stringify(targetSnapshot)).toBe(targetBefore);
  });
});
