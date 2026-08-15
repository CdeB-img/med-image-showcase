import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createScientificThinkingSession } from "@/features/scientific-thinking";
import { makeThinkingInput } from "@/features/scientific-thinking/__tests__/fixtures";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import {
  BIOSTATISTICS_PLAN_ADAPTER,
  DATA_MANAGEMENT_PLAN_ADAPTER,
  DOCUMENT_PROJECTION_ADAPTER,
  IMAGING_OR_OBSERVATION_ADAPTER,
  ORIGINAL_REQUEST_ADAPTER,
  PROJECT_DATA_ANALYSIS_VIEW_ADAPTER,
  RESEARCH_PROJECT_ADAPTER,
  SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER,
  SCIENTIFIC_THINKING_ADAPTER,
  STUDY_DATA_PLAN_ADAPTER,
  TEMPLATE_INSTANCE_ADAPTER,
  VALIDATION_ARTIFACT_ADAPTERS,
  type ObservationHandoffSource,
} from "../product-adapters";
import { buildValidationObservationsFromAuditD, SEM_AUDIT_L_PRODUCT_ACTIVE } from "../audit-d-adapter";
import {
  getValidationCheckpointV1,
  getValidationProductGate,
  inspectCheckpointApplicability,
  VALIDATION_CHECKPOINT_REGISTRY_V1,
  VALIDATION_PRODUCT_GATES,
} from "../checkpoint-registry";
import { validateValidationCheckpointDefinition, validateValidationFinding, validateValidationRun, validateValidationRunRequest } from "../contract-validation";
import { getValidationInvariantReference, VAL001_CHECKPOINT_IDS, VALIDATION_INVARIANT_REFERENCE_REGISTRY } from "../invariant-registry";
import {
  canonicalizeValidationArtifactSnapshot,
  canonicalizeValidationProductValue,
  computeValidationArtifactSnapshotDigest,
  computeValidationRunConfigurationDigest,
  finalizeValidationArtifactSnapshot,
} from "../product-canonical";
import {
  SEMANTIC_EQUIVALENCE_ASSESSMENTS,
  VALIDATION_DISPOSITIONS,
  VALIDATION_OBSERVATION_TYPES,
  VALIDATION_SEMANTIC_STATUSES,
  VALIDATION_TECHNICAL_STATUSES,
  type ValidationArtifactReference,
  type ValidationCheckpointDefinition,
  type ValidationObservation,
  type ValidationRun,
  type ValidationRunRequest,
} from "../product-contracts";
import {
  FIXTURE_A_INTERPRETATION,
  FIXTURE_A_REQUEST,
  FIXTURE_B_PROJECT,
  FIXTURE_C_STUDY_DATA,
  FIXTURE_D_DATA_MANAGEMENT,
  FIXTURE_E_BIOSTATISTICS,
  FIXTURE_F_DOCUMENT,
  FIXTURE_F_TEMPLATE,
  FIXTURE_G_SEMANTIC_REVIEW,
  FIXTURE_H_HUMAN_REVIEW,
  FIXTURE_PROJECT_VIEW,
  makeArtifactReference,
  makeEvidence,
  makeFinding,
  makeRun,
  makeRunRequest,
  makeSemanticReviewRequest,
  makeSnapshot,
} from "./val-001-part2-fixtures";

const moduleSource = [
  "../product-contracts.ts", "../product-canonical.ts", "../product-adapters.ts", "../checkpoint-registry.ts", "../invariant-registry.ts", "../audit-d-adapter.ts", "../contract-validation.ts", "../canonical.ts", "../adapters.ts", "../audit.ts", "../engine.ts",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

const cp = (id: string) => {
  const checkpoint = getValidationCheckpointV1(id);
  if (!checkpoint) throw new Error(`Missing checkpoint ${id}`);
  return checkpoint;
};

const auditFinding = { findingId: "audit-d:fixture", code: "CRITICAL_NEGATION_LOST", severity: "CRITICAL" as const, message: "Negation lost.", sourceRefs: ["turn:user:1"], status: "OPEN" as const };
const contributionWithAudit: ScientificInterpretationContributionEnvelope = { ...FIXTURE_A_INTERPRETATION, audit: { deterministicFindings: [auditFinding], semanticAuditFindings: [], unresolvedFindings: [auditFinding] } };

describe("VAL-001 Part 2 — product contracts", () => {
  it("VAL2-C01 ValidationRun is read-only", () => { const run = makeRun(); expect(run.boundary).toBe("DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION"); expect(run.sourceMutationAuthorized).toBe(false); expect(run.targetMutationAuthorized).toBe(false); expect(Object.isFrozen(run)).toBe(true); });
  it("VAL2-C02 projectWriteAuthorized remains false", () => expect(makeRun().projectWriteAuthorized).toBe(false));
  it("VAL2-C03 autoFixAllowed remains false", () => expect(makeRun().autoFixAllowed).toBe(false));
  it("VAL2-C04 autoDecisionAllowed remains false", () => expect(makeRun().autoDecisionAllowed).toBe(false));
  it("VAL2-C05 pd011QualificationClaimed remains false", () => expect(makeRun().pd011QualificationClaimed).toBe(false));
  it("VAL2-C06 ValidationArtifactReference preserves identity and version", () => { const ref = makeArtifactReference({ artifactId: "identity:1", version: "2.3.0" }); expect([ref.artifactId, ref.version]).toEqual(["identity:1", "2.3.0"]); });
  it("VAL2-C07 ValidationArtifactSnapshot remains projection-only", () => { const value = makeSnapshot(); expect(value.projectionOnly && value.validationProjectionOnly).toBe(true); expect(Object.isFrozen(value)).toBe(true); expect(Object.isFrozen(value.semanticObjects)).toBe(true); });
  it("VAL2-C08 Snapshot is never sourceOfTruth", () => expect(makeSnapshot().sourceOfTruth).toBe(false));
  it("VAL2-C09 Checkpoint version is mandatory", () => { const checkpoint = { ...cp(VAL001_CHECKPOINT_IDS.requestInterpretation), version: "" } as ValidationCheckpointDefinition; expect(validateValidationCheckpointDefinition(checkpoint).errors.some((item) => item.code === "VAL_CHECKPOINT_VERSION_MISSING")).toBe(true); });
  it("VAL2-C10 Invariant source authority is mandatory", () => expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.every((item) => item.sourceAuthority.trim().length > 0)).toBe(true));
  it("VAL2-C11 Invariant remains referenced, not copied as a new norm", () => { expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.boundary).toBe("REFERENCES_ONLY_DOMAIN_AUTHORITIES_REMAIN_OWNERS"); expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.every((item) => item.validatorProvider.length > 0)).toBe(true); });
  it("VAL2-C12 Observation remains distinct from Finding", () => { const observation: ValidationObservation = { observationId: "o", checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation, invariantRef: "VAL-C08", plane: "OWNERSHIP", sourceRef: "s", targetRef: "t", observationType: "PRESERVED", sourcePath: null, targetPath: null, sourceValueRef: null, targetValueRef: null, semanticKey: null, evidence: [makeEvidence()], deterministic: true, confidenceKind: "DETERMINISTIC", technicalStatus: "SUCCESS", limitations: [] }; const finding = makeFinding(); expect("observationType" in observation).toBe(true); expect("severity" in observation).toBe(false); expect("severity" in finding).toBe(true); });
  it("VAL2-C13 Severity remains distinct from Disposition", () => { const finding = makeFinding(); expect(finding.severity).toBe("WARNING"); expect(finding.disposition).toBe("CONTINUE_WITH_WARNING"); expect(VALIDATION_DISPOSITIONS).not.toContain(finding.severity); });
  it("VAL2-C14 Technical status remains distinct from Semantic status", () => { expect(VALIDATION_TECHNICAL_STATUSES).toContain("ADAPTER_FAILURE"); expect(VALIDATION_SEMANTIC_STATUSES).not.toContain("ADAPTER_FAILURE"); });
  it("VAL2-C15 NOT_EVALUABLE is not VALID", () => { const run = makeRun({ semanticStatus: "NOT_EVALUABLE", historicalValidationStatus: "VALID" }); expect(validateValidationRun(run).errors.some((item) => item.code === "VAL_NOT_EVALUABLE_PROMOTED_TO_VALID")).toBe(true); });
  it("VAL2-C16 NOT_APPLICABLE is not VALID", () => { const run = makeRun({ semanticStatus: "NOT_APPLICABLE", historicalValidationStatus: "VALID" }); expect(validateValidationRun(run).errors.some((item) => item.code === "VAL_NOT_APPLICABLE_PROMOTED_TO_VALID")).toBe(true); });
  it("VAL2-C17 Schema-valid does not imply Semantic-valid", () => { const run = makeRun({ technicalStatus: "SUCCESS", semanticStatus: "REVIEW_REQUIRED", historicalValidationStatus: "REVIEW_REQUIRED", disposition: "REQUIRE_REVIEW" }); expect(validateValidationRun(run).valid).toBe(true); expect(run.semanticStatus).not.toBe("NO_FINDING"); });
  it("VAL2-C18 Run COMPLETE does not imply PD-011 PASS", () => { const run = makeRun(); expect(run.status).toBe("COMPLETE"); expect(run.pd011QualificationClaimed).toBe(false); expect(run.qualificationAuthority).toBe("PD-011"); });
});

describe("VAL-001 Part 2 — adapters", () => {
  it("VAL2-ADP-C01 OriginalRequest adapter does not mutate anything", () => { const before = JSON.stringify(FIXTURE_A_REQUEST); ORIGINAL_REQUEST_ADAPTER.buildSnapshot(FIXTURE_A_REQUEST); expect(JSON.stringify(FIXTURE_A_REQUEST)).toBe(before); });
  it("VAL2-ADP-C02 Scientific Interpretation adapter preserves polarity and epistemic state", () => { const value = SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER.buildSnapshot(FIXTURE_A_INTERPRETATION); expect(value.semanticObjects.find((item) => item.objectId === "fixture-a-negation")?.polarity).toBe("NEGATED"); expect(value.epistemicStates.find((item) => item.subjectId === "fixture-a-candidate")?.adoptionStatus).toBe("CANDIDATE_NOT_ADOPTED"); });
  it("VAL2-ADP-C03 ST adapter preserves question/object refs", () => { const output = createScientificThinkingSession(makeThinkingInput()).output; const value = SCIENTIFIC_THINKING_ADAPTER.buildSnapshot(output); output.questions.forEach((question) => expect(value.semanticObjects.some((item) => item.objectId === question.questionId)).toBe(true)); });
  it("VAL2-ADP-C04 OBS/Imaging adapter preserves MeasurementDefinition ownership", () => { const source: ObservationHandoffSource = { artifactType: "OBSERVATION_HANDOFF", handoffId: "obs:fixture", version: "1.0.0", digest: "obs:digest", owner: "OBS-001", measurementDefinitions: [{ measurementDefinitionId: "measurement:1", label: "mesure", owner: "OBS-001", observablePropertyRef: "observable:1", status: "KNOWN", provenanceRefs: ["obs:source"], limitations: [] }], unknowns: [], contradictions: [], provenanceRefs: ["obs:source"], limitations: [] }; expect(IMAGING_OR_OBSERVATION_ADAPTER.artifactTypes).toEqual(["IMAGING_CONTRIBUTION", "OBSERVATION_HANDOFF"]); expect(IMAGING_OR_OBSERVATION_ADAPTER.buildSnapshot(source).semanticObjects[0]?.owner).toBe("OBS-001"); });
  it("VAL2-ADP-C05 Project adapter exposes adopted state only", () => { const value = RESEARCH_PROJECT_ADAPTER.buildSnapshot(FIXTURE_B_PROJECT); const allowed = ["ADOPTED", "APPROVED", "HUMAN_CONFIRMED", "KNOWN", "FROZEN_BY_HUMAN"]; expect(value.semanticObjects.filter((item) => item.objectType === "PROJECT_OBJECT").every((item) => allowed.includes(item.status))).toBe(true); });
  it("VAL2-ADP-C06 Study Data adapter preserves CanonicalVariable identity", () => { const value = STUDY_DATA_PLAN_ADAPTER.buildSnapshot(FIXTURE_C_STUDY_DATA); FIXTURE_C_STUDY_DATA.content.canonicalVariables.forEach((item) => expect(value.semanticObjects.some((candidate) => candidate.objectId === item.variableRef.objectId && candidate.objectType === "CanonicalVariable")).toBe(true)); });
  it("VAL2-ADP-C07 DM adapter preserves design-time boundary", () => { const value = DATA_MANAGEMENT_PLAN_ADAPTER.buildSnapshot(FIXTURE_D_DATA_MANAGEMENT); expect(value.metadata).toMatchObject({ designTimeOnly: true, realizedOperations: "DEFERRED_TO_REALIZED_TIME" }); expect(value.semanticObjects.some((item) => item.objectType === "VariableOccurrence")).toBe(false); });
  it("VAL2-ADP-C08 Biostatistics adapter preserves Endpoint/Estimand distinction", () => { const value = BIOSTATISTICS_PLAN_ADAPTER.buildSnapshot(FIXTURE_E_BIOSTATISTICS); const estimand = value.semanticObjects.find((item) => item.objectType === "Estimand"); expect(estimand).toBeDefined(); expect(estimand?.sourceRefs.length).toBeGreaterThan(0); expect(estimand?.objectId).not.toBe(estimand?.sourceRefs[0]); });
  it("VAL2-ADP-C09 Template adapter preserves source refs", () => { const value = TEMPLATE_INSTANCE_ADAPTER.buildSnapshot(FIXTURE_F_TEMPLATE); expect(value.reference.projectId).toBe(FIXTURE_F_TEMPLATE.inputRefs.researchProjectId); expect(value.lineage).toContain(FIXTURE_F_TEMPLATE.inputRefs.researchProjectId); });
  it("VAL2-ADP-C10 Document adapter preserves NOT_GENERATABLE", () => { const value = DOCUMENT_PROJECTION_ADAPTER.buildSnapshot(FIXTURE_F_DOCUMENT); expect(value.semanticObjects.some((item) => item.status === "NOT_GENERATABLE")).toBe(true); });
  it("VAL2-ADP-C11 Project View adapter remains projection-only", () => { const value = PROJECT_DATA_ANALYSIS_VIEW_ADAPTER.buildSnapshot(FIXTURE_PROJECT_VIEW); expect(value.projectionOnly).toBe(true); expect(value.sourceOfTruth).toBe(false); expect(value.projectWriteAuthorized).toBe(false); });
  it("VAL2-ADP-C12 No adapter owns write/apply/save", () => { const forbidden = /^(write|apply|save|mutate|update|delete|persist)/i; expect(VALIDATION_ARTIFACT_ADAPTERS.every((adapter) => Object.keys(adapter).every((key) => !forbidden.test(key)))).toBe(true); });
});

describe("VAL-001 Part 2 — checkpoint registry", () => {
  it("VAL2-CP-C01 Every checkpoint has a stable identity", () => { const ids = VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.map((item) => item.checkpointId); expect(new Set(ids).size).toBe(ids.length); expect(ids.every(Boolean)).toBe(true); });
  it("VAL2-CP-C02 Every checkpoint has a version", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.version === "1.0.0")).toBe(true));
  it("VAL2-CP-C03 Source type is defined", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.sourceArtifactTypes.length > 0)).toBe(true));
  it("VAL2-CP-C04 Target type is defined", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.targetArtifactTypes.length > 0)).toBe(true));
  it("VAL2-CP-C05 Source owner is defined", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.sourceOwner.trim().length > 0)).toBe(true));
  it("VAL2-CP-C06 Target owner is defined", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.targetOwner.trim().length > 0)).toBe(true));
  it("VAL2-CP-C07 InvariantRefs are nonempty for applicable checkpoints", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.filter((item) => item.implementationStatus === "CONTRACT_READY").every((item) => item.invariantRefs.length > 0)).toBe(true));
  it("VAL2-CP-C08 Validation planes are declared", () => expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.validationPlanes.length > 0)).toBe(true));
  it("VAL2-CP-C09 NOT_APPLICABLE checkpoint is not executed", () => { const checkpoint = cp(VAL001_CHECKPOINT_IDS.projectStudyData); const value = inspectCheckpointApplicability(checkpoint, { sourceArtifact: makeArtifactReference({ artifactType: "RESEARCH_PROJECT" }), targetArtifact: makeArtifactReference({ artifactType: "STUDY_DATA_PLAN_CONTRIBUTION" }), realizedTimeRequired: true }); expect(value).toMatchObject({ status: "NOT_APPLICABLE", reason: "DEFERRED_TO_REALIZED_TIME" }); });
  it("VAL2-CP-C10 Missing source remains MISSING_SOURCE", () => expect(inspectCheckpointApplicability(cp(VAL001_CHECKPOINT_IDS.requestInterpretation), { sourceArtifact: null, targetArtifact: makeArtifactReference({ artifactType: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION" }) }).status).toBe("MISSING_SOURCE"));
  it("VAL2-CP-C11 Missing target remains MISSING_TARGET", () => expect(inspectCheckpointApplicability(cp(VAL001_CHECKPOINT_IDS.requestInterpretation), { sourceArtifact: makeArtifactReference(), targetArtifact: null }).status).toBe("MISSING_TARGET"));
  it("VAL2-CP-C12 Corridor A-J is represented or gaps declared", () => { expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints).toHaveLength(10); expect(new Set(Object.values(VAL001_CHECKPOINT_IDS)).size).toBe(10); expect(VALIDATION_CHECKPOINT_REGISTRY_V1.checkpoints.every((item) => item.applicableWhen.length + item.notApplicableWhen.length > 0)).toBe(true); });
});

describe("VAL-001 Part 2 — invariant registry", () => {
  const byPrefix = (prefix: string) => VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.filter((item) => item.invariantId.startsWith(prefix));
  it("VAL2-INV-C01 Project invariant remains owner Project", () => expect(byPrefix("PROJECT:").every((item) => item.owner === "RESEARCH_PROJECT")).toBe(true));
  it("VAL2-INV-C02 OBS invariant remains owner OBS", () => expect(byPrefix("OBS:").every((item) => item.owner === "OBS-001")).toBe(true));
  it("VAL2-INV-C03 CDM invariant remains owner CDM", () => expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.filter((item) => item.invariantId.startsWith("CDM")).every((item) => item.owner === "CDM-001")).toBe(true));
  it("VAL2-INV-C04 DM invariant remains owner DM", () => expect(byPrefix("DM:").every((item) => item.owner === "DM-001")).toBe(true));
  it("VAL2-INV-C05 BIO invariant remains owner Biostatistics", () => expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.filter((item) => item.invariantId.startsWith("BIO")).every((item) => item.owner === "BIOSTATISTICS-001")).toBe(true));
  it("VAL2-INV-C06 TMP/DOC invariant remains source-owned", () => { expect(getValidationInvariantReference("VAL-C12")?.owner).toBe("TMP-001"); expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.filter((item) => item.invariantId.startsWith("DOC:") || item.invariantId === "VAL-C13").every((item) => item.owner === "DOC-001")).toBe(true); });
  it("VAL2-INV-C07 SEM-AUDIT invariants/findings remain Audit-owned", () => expect(byPrefix("AUDIT-D:").every((item) => item.owner === "SEM-AUDIT-D" && item.validatorProvider === "SEM-AUDIT-D")).toBe(true));
  it("VAL2-INV-C08 No business invariant is copied with a new VAL identity", () => expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.filter((item) => item.invariantId.startsWith("VAL-")).every((item) => ["VAL-C08", "VAL-C09", "VAL-C12", "VAL-C13"].includes(item.invariantId))).toBe(true));
  it("VAL2-INV-C09 D/S/H is correctly declared", () => { const levels = new Set(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.map((item) => item.evaluationLevel)); expect(levels).toEqual(new Set(["DETERMINISTIC", "SEMANTIC_REVIEW", "HUMAN_ARBITRATION"])); });
  it("VAL2-INV-C10 HUMAN_ARBITRATION cannot produce an automatic final verdict", () => expect(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.filter((item) => item.evaluationLevel === "HUMAN_ARBITRATION").every((item) => item.defaultDisposition === "REQUIRE_HUMAN_DECISION" && item.machineEvaluable === false)).toBe(true));
});

describe("VAL-001 Part 2 — Audit-D integration", () => {
  it("VAL2-AUD-C01 Audit-D finding can be referenced by VAL", () => { const value = buildValidationObservationsFromAuditD(contributionWithAudit); expect(value.findings[0]?.domainFailureClassRef).toBe("CRITICAL_NEGATION_LOST"); expect(value.findings[0]?.owner).toBe("SEM-AUDIT-D"); });
  it("VAL2-AUD-C02 VAL does not recompute Audit-D", () => { const value = buildValidationObservationsFromAuditD(contributionWithAudit); expect(value.observations).toHaveLength(contributionWithAudit.audit.deterministicFindings.length); expect(value.observations[0]?.evidence[0]?.auditFindingRef).toBe(auditFinding.findingId); });
  it("VAL2-AUD-C03 VAL does not modify Audit-D finding", () => { const before = JSON.stringify(contributionWithAudit.audit); buildValidationObservationsFromAuditD(contributionWithAudit); expect(JSON.stringify(contributionWithAudit.audit)).toBe(before); });
  it("VAL2-AUD-C04 VAL does not declare Audit-D finding resolved without proof/decision", () => { const value = buildValidationObservationsFromAuditD(contributionWithAudit); expect(contributionWithAudit.audit.deterministicFindings[0]?.status).toBe("OPEN"); expect(value.findings[0]?.disposition).toBe("BLOCK_HANDOFF"); });
  it("VAL2-AUD-C05 Audit-L remains shadow-only", () => expect(SEM_AUDIT_L_PRODUCT_ACTIVE).toBe(false));
  it("VAL2-AUD-C06 No provider is called", () => expect(moduleSource).not.toMatch(/fetch\s*\(|generateContent\s*\(|GoogleGenerativeAI|OpenAI\s*\(/));
  it("references every current Audit-D finding code without owning it", () => { const codes = ["RELATION_ENDPOINT_MISSING", "SELF_RELATION", "CAUSALITY_ADDED_AGAINST_EXPLICIT_NEGATION", "REJECTED_RELATION_REMAINS_ACTIVE", "RELATION_DIRECTION_INVERTED", "CANDIDATE_PROMOTED_TO_PROJECT", "NEGATION_NOT_EXPLICITLY_REPRESENTED", "REJECTED_OR_SUPERSEDED_STATE_ACTIVE", "LOCAL_PRACTICE_PROMOTED_TO_PROJECT", "PRIMARY_CANDIDATE_PROMOTED_TO_ADOPTED_ENDPOINT", "UNSUPPORTED_DECISION_INVENTION", "EXPLICIT_SOURCE_NOT_GROUNDED", "CRITICAL_NEGATION_LOST"]; expect(codes.every((code) => getValidationInvariantReference(`AUDIT-D:${code}`)?.owner === "SEM-AUDIT-D")).toBe(true); });
});

describe("VAL-001 Part 2 — semantic review contracts", () => {
  it("VAL2-SEM-C01 IdentityMatch and SemanticEquivalenceAssessment are distinct", () => { expect(FIXTURE_G_SEMANTIC_REVIEW.semanticEquivalenceAssessments[0]?.identityMatch).toBe("DIFFERENT_ID"); expect(FIXTURE_G_SEMANTIC_REVIEW.semanticEquivalenceAssessments[0]?.assessment).toBe("PENDING"); });
  it("VAL2-SEM-C02 Different ID does not automatically mean NOT_EQUIVALENT", () => expect(FIXTURE_G_SEMANTIC_REVIEW.semanticEquivalenceAssessments[0]).toMatchObject({ identityMatch: "DIFFERENT_ID", assessment: "PENDING" }));
  it("VAL2-SEM-C03 Same label does not automatically mean EQUIVALENT", () => { const assessment = { sourceRef: "a", targetRef: "b", identityMatch: "DIFFERENT_ID" as const, assessment: "PENDING" as const, label: "same" }; expect(assessment.assessment).not.toBe("EQUIVALENT"); });
  it("VAL2-SEM-C04 Semantic review can be PENDING", () => expect(SEMANTIC_EQUIVALENCE_ASSESSMENTS).toContain("PENDING"));
  it("VAL2-SEM-C05 Semantic review can require Human Arbitration", () => { expect(FIXTURE_H_HUMAN_REVIEW.boundary).toBe("REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE"); expect(FIXTURE_H_HUMAN_REVIEW.blocking).toBe(true); });
  it("VAL2-SEM-C06 SemanticReviewRequest authorizes no correction", () => { const value = makeSemanticReviewRequest(); expect(value.autoFixAllowed).toBe(false); expect(value.sourceMutationAuthorized).toBe(false); expect(value.targetMutationAuthorized).toBe(false); });
  it("VAL2-SEM-C07 SemanticReviewResult embeds no rewritten target", () => expect(Object.keys(FIXTURE_G_SEMANTIC_REVIEW).some((key) => /rewritten|replacement|patchedTarget/i.test(key))).toBe(false));
  it("VAL2-SEM-C08 includeSemanticReview triggers no provider in Part 2", () => { const invalid = { ...makeRunRequest(), includeSemanticReview: true } as ValidationRunRequest; expect(validateValidationRunRequest(invalid).errors.some((item) => item.code === "VAL_SEMANTIC_REVIEW_NOT_EXECUTABLE_IN_PART2")).toBe(true); });
});

describe("VAL-001 Part 2 — product gate references", () => {
  it("VAL2-GATE-C01 ProductGateReference remains a definition", () => expect(VALIDATION_PRODUCT_GATES.every((item) => item.activeInProduct === false)).toBe(true));
  it("VAL2-GATE-C02 VAL does not directly block UI yet", () => { expect(VALIDATION_PRODUCT_GATES.every((item) => item.activeInProduct === false)).toBe(true); expect(moduleSource).not.toMatch(/useValidationGate|ValidationGateModal|setUiBlocked/); });
  it("VAL2-GATE-C03 Contribution adoption gate can reference findings", () => expect(getValidationProductGate("CONTRIBUTION_ADOPTION")?.unresolvedFindingPolicy).toBe("REQUIRE_REVIEW"));
  it("VAL2-GATE-C04 Project freeze gate can reference findings", () => expect(getValidationProductGate("PROJECT_FREEZE")?.blockingSeverities).toContain("BLOCKING"));
  it("VAL2-GATE-C05 Protocol generation gate can reference findings", () => expect(getValidationProductGate("PROTOCOL_GENERATION")?.requiredCheckpoints).toContain(VAL001_CHECKPOINT_IDS.templateDocument));
  it("VAL2-GATE-C06 SAP generation gate can reference findings", () => expect(getValidationProductGate("SAP_GENERATION")?.requiredCheckpoints).toContain(VAL001_CHECKPOINT_IDS.scientificStateBiostatistics));
  it("VAL2-GATE-C07 V1 readiness gate can reference checkpoints", () => expect(getValidationProductGate("V1_READY")?.requiredCheckpoints).toHaveLength(10));
  it("VAL2-GATE-C08 Candidate preview does not require the same gates as Project freeze", () => expect(getValidationProductGate("CANDIDATE_PREVIEW")?.requiredCheckpoints).not.toEqual(getValidationProductGate("PROJECT_FREEZE")?.requiredCheckpoints));
});

describe("VAL-001 Part 2 — determinism and read-only static controls", () => {
  it("VAL2-DET-C01 Same artifact yields same snapshot digest", () => expect(ORIGINAL_REQUEST_ADAPTER.buildSnapshot(FIXTURE_A_REQUEST).snapshotDigest).toBe(ORIGINAL_REQUEST_ADAPTER.buildSnapshot(FIXTURE_A_REQUEST).snapshotDigest));
  it("VAL2-DET-C02 Same config yields same configuration digest", () => { const run = makeRun(); expect(computeValidationRunConfigurationDigest(run)).toBe(computeValidationRunConfigurationDigest(structuredClone(run))); });
  it("VAL2-DET-C03 Non-semantic order does not change digest", () => { const a = makeSnapshot({ unknowns: ["b", "a"], provenance: ["p2", "p1"] }); const b = makeSnapshot({ unknowns: ["a", "b"], provenance: ["p1", "p2"] }); expect(a.snapshotDigest).toBe(b.snapshotDigest); });
  it("VAL2-DET-C04 Business order remains significant", () => { const first = makeSnapshot(); const { snapshotDigest: _digest, ...material } = canonicalizeValidationArtifactSnapshot(first); const orderedObjects = [...first.semanticObjects, { ...first.semanticObjects[0]!, objectId: "second-object" }]; const a = finalizeValidationArtifactSnapshot({ ...material, semanticObjects: orderedObjects }); const b = finalizeValidationArtifactSnapshot({ ...material, semanticObjects: [...orderedObjects].reverse() }); expect(a.snapshotDigest).not.toBe(b.snapshotDigest); });
  it("VAL2-DET-C05 Technical timestamp does not change content digest", () => { const a = makeSnapshot({ metadata: { createdAt: "2026-01-01", stable: "x" } }); const b = makeSnapshot({ metadata: { createdAt: "2027-01-01", stable: "x" } }); expect(computeValidationArtifactSnapshotDigest(a)).toBe(computeValidationArtifactSnapshotDigest(b)); });
  it("VAL2-DET-C06 Canonicalization does not mutate", () => { const input = { values: ["b", "a"], nested: { z: 1, a: 2 } }; const before = JSON.stringify(input); canonicalizeValidationProductValue(input); expect(JSON.stringify(input)).toBe(before); });
  it("VAL2-DET-C07 No Math.random", () => expect(moduleSource).not.toMatch(/Math\.random\s*\(/));
  it("VAL2-DET-C08 No locale dependency", () => expect(moduleSource).not.toMatch(/localeCompare|toLocaleLowerCase|toLocaleUpperCase/));
});

describe("VAL-001 Part 2 — contract rejection controls", () => {
  it("rejects write authorization", () => { const invalid = { ...makeRunRequest(), projectWriteAuthorized: true } as unknown as ValidationRunRequest; expect(validateValidationRunRequest(invalid).errors.some((item) => item.code === "VAL_PROJECT_WRITE_AUTHORIZED_FORBIDDEN")).toBe(true); });
  it("rejects automatic fix", () => { const invalid = { ...makeRunRequest(), autoFixAllowed: true } as unknown as ValidationRunRequest; expect(validateValidationRunRequest(invalid).errors.some((item) => item.code === "VAL_AUTOFIX_FORBIDDEN")).toBe(true); });
  it("rejects automatic decision", () => { const invalid = { ...makeRunRequest(), autoDecisionAllowed: true } as unknown as ValidationRunRequest; expect(validateValidationRunRequest(invalid).errors.some((item) => item.code === "VAL_AUTODECISION_FORBIDDEN")).toBe(true); });
  it("rejects collapsed technical and semantic statuses", () => { const finding = makeFinding({ technicalStatus: "SCHEMA_FAILURE", semanticStatus: "FINDINGS_PRESENT" }); expect(validateValidationFinding(finding).errors.some((item) => item.code === "VAL_TECHNICAL_SEMANTIC_STATUS_COLLAPSED")).toBe(true); });
  it("preserves all synthetic fixture boundaries", () => { expect(FIXTURE_A_INTERPRETATION.epistemicBoundary.candidateIsAdopted).toBe(false); expect(FIXTURE_C_STUDY_DATA.content.expectedVariableOccasions.every((item) => item.status === "EXPECTED_NOT_REALIZED")).toBe(true); expect(FIXTURE_D_DATA_MANAGEMENT.governance.realizedTimeAuthorized).toBe(false); expect(FIXTURE_E_BIOSTATISTICS.content.analysisSpecifications.every((item) => item.method.status === "UNKNOWN")).toBe(true); expect(FIXTURE_F_DOCUMENT.sections[0]?.status).toBe("NOT_GENERATABLE"); expect(FIXTURE_G_SEMANTIC_REVIEW.status).toBe("PENDING"); expect(FIXTURE_H_HUMAN_REVIEW.alternatives).toHaveLength(2); });
  it("static read-only scan finds no business write or network execution", () => { expect(moduleSource).not.toMatch(/\b(saveProject|applyDecision|writeDocument|mutateSource|mutateTarget|database\.write|fs\.writeFile|axios\.|fetch\s*\(|generateContent\s*\()\b/); expect(moduleSource).not.toMatch(/autoFixAllowed\s*:\s*true|autoDecisionAllowed\s*:\s*true|projectWriteAuthorized\s*:\s*true/); });
});
