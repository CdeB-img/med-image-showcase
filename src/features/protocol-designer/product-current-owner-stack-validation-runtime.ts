import { logicalDigest, stableStringify, type KnowledgeResult } from "@/features/knowledge-engine";
import type { ProjectContextSnapshot, ResearchProjectOwnerProjection, SpecializedOwnerResult } from "@/features/research-project-construction";
import {
  VAL001_CONTRACT_VERSION,
  VAL001_DETERMINISTIC_ENGINE_VERSION,
  finalizeValidationArtifactSnapshot,
  runCheckpointValidation,
  validationDigest,
  type DomainValidationProvider,
  type ValidationArtifactReference,
  type ValidationArtifactSnapshot,
  type ValidationEvidence,
  type ValidationObservation,
  type ValidationPlane,
  type ValidationProductFinding,
  type ValidationRun,
} from "@/features/validation-architecture";
import {
  ownerResultNativeDigest,
  rehydrateProductOwnerResultLedger,
  type ProductOwnerResultDependency,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import {
  appendProductValidationRun,
  type ProductScientificOwnerResultReference,
  type ProductValidationProfileReference,
  type ProductValidationRunLedger,
  type ProductValidationRunLedgerEntry,
} from "./product-validation-run-ledger";
import type { ScientificRunTraceRecorder } from "./scientific-execution-trace";

export const CURRENT_OWNER_STACK_VALIDATION_PROFILE = "CURRENT_OWNER_STACK_FIDELITY" as const;
export const CURRENT_OWNER_STACK_VALIDATION_PROFILE_VERSION = "1.0.0" as const;
const CURRENT_OWNER_STACK_VALIDATOR = "VAL-PRODUCT-CURRENT-OWNER-STACK-FIDELITY" as const;
const CURRENT_OWNER_STACK_CHECKPOINT = "VAL-PRJ-PRODUCT-VIEW-001" as const;
const ALL_OWNERS: readonly ProductOwnerResultDependency["owner"][] = [
  "KNOWLEDGE",
  "SCIENTIFIC_THINKING",
  "STUDY_DESIGN",
  "OBSERVABILITY_MEASUREMENT",
  "IMAGING",
  "BIOSTATISTICS",
  "STUDY_DATA_CDM",
  "DATA_MANAGEMENT",
  "REGULATORY_RESOLUTION",
];

export type CurrentOwnerExpectation = {
  owner: ProductOwnerResultDependency["owner"];
  required: boolean;
  requirementRef: string;
  selectedActionRef: string | null;
  knowledgeRequired: boolean;
};

export type CurrentProjectionBinding = {
  projectionOwner: "TMP-001" | "DOC-002";
  projectionId: string;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
};

export type CurrentTraceBinding = {
  traceRunId: string;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  ownerResultLedgerDigest: string | null;
};

export type CurrentOwnerStackValidationInput = {
  validationInvocationId: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  expectations: readonly Readonly<CurrentOwnerExpectation>[];
  projectionBindings?: readonly Readonly<CurrentProjectionBinding>[];
  traceBindings?: readonly Readonly<CurrentTraceBinding>[];
  callerRef: string;
  purpose: string;
  completedAt: string;
};

export type CurrentOwnerStackValidationExecution = {
  run: Readonly<ValidationRun>;
  sourceSnapshot: Readonly<ValidationArtifactSnapshot>;
  targetSnapshot: Readonly<ValidationArtifactSnapshot>;
  profile: Readonly<ProductValidationProfileReference>;
  boundedStatus: ProductValidationRunLedgerEntry["boundedStatus"];
  recognizedOwners: readonly ProductOwnerResultDependency["owner"][];
  nativeValEngineInvocations: 1;
  semanticReviewerCalls: 0;
  repairCalls: 0;
  projectWrites: 0;
  traceWrites: 0;
  humanDecisionBypassed: false;
  scientificQualificationClaimed: false;
};

const clone = <T>(value: T): T => structuredClone(value);
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const reference = (input: {
  artifactId: string;
  artifactType: "RESEARCH_PROJECT" | "PROJECT_DATA_ANALYSIS_VIEW";
  version: string;
  owner: string;
  digest: string;
  project: Readonly<ProjectContextSnapshot>;
}): ValidationArtifactReference => ({
  artifactId: input.artifactId,
  artifactType: input.artifactType,
  version: input.version,
  owner: input.owner,
  sourceOfTruth: input.artifactType === "RESEARCH_PROJECT",
  contentDigest: input.digest,
  schemaVersion: VAL001_CONTRACT_VERSION,
  projectId: input.project.sourceProjectRef,
  projectVersion: input.project.sourceProjectVersion,
  contributionId: null,
  projectionId: input.artifactType === "PROJECT_DATA_ANALYSIS_VIEW" ? input.artifactId : null,
  provenanceRefs: unique([input.project.sourceContributionRef, input.project.snapshotDigest]),
  immutableForRun: true,
});

const ownerRef = (result: Readonly<SpecializedOwnerResult>): ProductScientificOwnerResultReference => ({
  owner: result.owner as ProductScientificOwnerResultReference["owner"],
  resultId: result.resultId,
  resultVersion: result.resultVersion,
  nativeResultDigest: ownerResultNativeDigest(result) ?? "MISSING_NATIVE_RESULT_DIGEST",
});

const buildSnapshots = (input: Readonly<CurrentOwnerStackValidationInput>) => {
  const projectObjectId = `${input.projectSnapshot.sourceProjectRef}@${input.projectSnapshot.sourceProjectVersion}`;
  const projectObject = {
    objectId: projectObjectId,
    objectType: "CanonicalResearchProjectSnapshot",
    label: null,
    status: "ADOPTED",
    owner: "RESEARCH_PROJECT",
    sourceRefs: [input.projectSnapshot.sourceContributionRef],
    provenanceRefs: [input.projectSnapshot.snapshotDigest],
    semanticKey: null,
    polarity: null,
    role: null,
    attributes: {
      projectDigest: input.projectSnapshot.sourceProjectDigest,
      snapshotDigest: input.projectSnapshot.snapshotDigest,
    },
  };
  const ownerObjects = input.ownerResultLedger.entries.flatMap((entry) => entry.result ? [{
    objectId: entry.result.resultId,
    objectType: `${entry.result.owner}OwnerResult`,
    label: null,
    status: "CANDIDATE",
    owner: entry.result.owner,
    sourceRefs: [projectObjectId, ...entry.dependencies.map((dependency) => dependency.resultId)],
    provenanceRefs: unique([entry.entryId, ...entry.result.provenance]),
    semanticKey: null,
    polarity: null,
    role: entry.result.capabilityId,
    attributes: ownerRef(entry.result),
  }] : []);
  const metadata = {
    validationProfile: CURRENT_OWNER_STACK_VALIDATION_PROFILE,
    validationProfileVersion: CURRENT_OWNER_STACK_VALIDATION_PROFILE_VERSION,
    validationInvocationId: input.validationInvocationId,
    ownerResultLedgerDigest: input.ownerResultLedger.ledgerDigest,
    expectations: clone(input.expectations),
    projectionBindings: clone(input.projectionBindings ?? []),
    traceBindings: clone(input.traceBindings ?? []),
    projectWriteAuthorized: false,
    traceWriteAuthorized: false,
    repairAuthorized: false,
    scientificQualificationClaimed: false,
  };
  const sourceReference = reference({
    artifactId: input.projectSnapshot.sourceProjectRef,
    artifactType: "RESEARCH_PROJECT",
    version: input.projectSnapshot.sourceProjectVersion,
    owner: "RESEARCH_PROJECT",
    digest: input.projectSnapshot.sourceProjectDigest,
    project: input.projectSnapshot,
  });
  const targetReference = reference({
    artifactId: `current-owner-stack:${input.ownerResultLedger.ledgerDigest}`,
    artifactType: "PROJECT_DATA_ANALYSIS_VIEW",
    version: CURRENT_OWNER_STACK_VALIDATION_PROFILE_VERSION,
    owner: "VAL-001",
    digest: input.ownerResultLedger.ledgerDigest,
    project: input.projectSnapshot,
  });
  const sourceSnapshot = finalizeValidationArtifactSnapshot({
    reference: sourceReference,
    artifactKind: "RESEARCH_PROJECT",
    owner: "RESEARCH_PROJECT",
    semanticObjects: [projectObject],
    relations: [],
    epistemicStates: [{ subjectId: projectObjectId, epistemicStatus: "ADOPTED", adoptionStatus: "ADOPTED", activeState: true, sourceRefs: projectObject.sourceRefs }],
    decisions: [],
    unknowns: [],
    contradictions: [],
    limitations: ["CURRENT_OWNER_STACK_STRUCTURAL_DIAGNOSTIC_ONLY"],
    provenance: unique(projectObject.provenanceRefs),
    lineage: [input.projectSnapshot.snapshotDigest],
    sourceReferences: [input.projectSnapshot.sourceContributionRef],
    projectionOnly: true,
    validationProjectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    metadata,
  });
  const targetSnapshot = finalizeValidationArtifactSnapshot({
    reference: targetReference,
    artifactKind: "PROJECT_DATA_ANALYSIS_VIEW",
    owner: "VAL-001",
    semanticObjects: [projectObject, ...ownerObjects],
    relations: input.ownerResultLedger.entries.flatMap((entry) => entry.result ? entry.dependencies.map((dependency) => ({
      relationId: `val-owner-dependency:${logicalDigest({ entry: entry.entryId, dependency })}`,
      sourceObjectId: dependency.resultId,
      targetObjectId: entry.result!.resultId,
      relationType: "DEPENDS_ON",
      polarity: null,
      status: "ACTIVE",
      owner: "NOXIA_PRODUCT",
      sourceRefs: [dependency.resultId, entry.result.resultId],
      provenanceRefs: [entry.entryId],
    })) : []),
    epistemicStates: [projectObject, ...ownerObjects].map((object) => ({ subjectId: object.objectId, epistemicStatus: object.status, adoptionStatus: object.owner === "RESEARCH_PROJECT" ? "ADOPTED" : "CANDIDATE", activeState: true, sourceRefs: object.sourceRefs })),
    decisions: [],
    unknowns: [],
    contradictions: [],
    limitations: ["CURRENT_OWNER_STACK_STRUCTURAL_DIAGNOSTIC_ONLY", "NO_SCIENTIFIC_QUALITY_OR_REGULATORY_ACCEPTABILITY_JUDGMENT"],
    provenance: unique(input.ownerResultLedger.entries.flatMap((entry) => [entry.entryId, ...(entry.result?.provenance ?? [])])),
    lineage: input.ownerResultLedger.entries.map((entry) => entry.entryId),
    sourceReferences: unique(input.ownerResultLedger.entries.flatMap((entry) => entry.result?.evidenceRefs ?? [])),
    projectionOnly: true,
    validationProjectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    metadata,
  });
  return { sourceSnapshot, targetSnapshot };
};

const proof = (input: { sourceRef: string; targetRef: string; note: string; digest?: string | null }): ValidationEvidence => ({
  evidenceId: `val-evidence:${validationDigest(input)}`,
  kind: "COMPARISON_NOTE",
  sourcePath: null,
  targetPath: null,
  sourceObjectRef: input.sourceRef || null,
  targetObjectRef: input.targetRef || null,
  exactSourceSpan: null,
  relationRef: null,
  decisionRef: null,
  provenanceRef: null,
  digest: input.digest ?? null,
  auditFindingRef: null,
  domainValidatorResultRef: CURRENT_OWNER_STACK_VALIDATOR,
  comparisonNote: input.note,
});

const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const knowledgePayload = (entry: Readonly<ProductOwnerResultLedgerEntry> | undefined) => entry?.result?.owner === "KNOWLEDGE" && isRecord(entry.result.nativePayload)
  ? entry.result.nativePayload as unknown as KnowledgeResult
  : null;

const createProvider = (input: Readonly<CurrentOwnerStackValidationInput>): DomainValidationProvider => ({
  providerId: CURRENT_OWNER_STACK_VALIDATOR,
  owner: "VAL-001",
  invariantRefs: ["VAL-C08"],
  version: CURRENT_OWNER_STACK_VALIDATION_PROFILE_VERSION,
  deterministic: true,
  limitations: [
    "STRUCTURAL_FIDELITY_ONLY_NOT_SCIENTIFIC_QUALIFICATION",
    "CONDITIONAL_ON_QRY_DECLARED_EXPECTATIONS_AND_PRESENT_OWNER_RESULTS",
    "NO_REPAIR_NO_PROJECT_OR_TRACE_MUTATION",
  ],
  supports: (_source, target, checkpoint) => checkpoint.checkpointId === CURRENT_OWNER_STACK_CHECKPOINT
    && target.metadata.validationProfile === CURRENT_OWNER_STACK_VALIDATION_PROFILE,
  validateReadOnly: (source, target, checkpoint) => {
    const before = stableStringify({ input, source, target });
    const observations: ValidationObservation[] = [];
    const findings: ValidationProductFinding[] = [];
    const observe = (check: {
      passed: boolean;
      plane: ValidationPlane;
      sourceRef: string;
      targetRef: string;
      note: string;
      failureClass: string;
      owner?: string;
      blocking?: boolean;
    }) => {
      const evidence = proof({ sourceRef: check.sourceRef, targetRef: check.targetRef, note: check.note });
      const observationType = check.passed ? "PRESERVED" as const : "CONFLICT" as const;
      const observationId = `val-observation:${validationDigest({ checkpoint: checkpoint.checkpointId, plane: check.plane, sourceRef: check.sourceRef, targetRef: check.targetRef, observationType, note: check.note })}`;
      observations.push({
        observationId,
        checkpointId: checkpoint.checkpointId,
        invariantRef: "VAL-C08",
        plane: check.plane,
        sourceRef: check.sourceRef,
        targetRef: check.targetRef,
        observationType,
        sourcePath: null,
        targetPath: null,
        sourceValueRef: check.sourceRef || null,
        targetValueRef: check.targetRef || null,
        semanticKey: null,
        evidence: [evidence],
        deterministic: true,
        confidenceKind: "DETERMINISTIC",
        technicalStatus: "SUCCESS",
        limitations: [],
      });
      if (!check.passed) findings.push({
        findingId: `val-finding:${validationDigest({ observationId, failureClass: check.failureClass })}`,
        checkpointId: checkpoint.checkpointId,
        invariantRef: "VAL-C08",
        observationRefs: [observationId],
        findingClass: check.plane === "OWNERSHIP" ? "OWNERSHIP_VIOLATION" : check.plane === "IDENTITY_VERSION" ? "IDENTITY_CONTINUITY_VIOLATION" : "STRUCTURED_INVARIANT_VIOLATION",
        domainFailureClassRef: check.failureClass,
        severity: check.blocking === false ? "WARNING" : "BLOCKING",
        disposition: check.blocking === false ? "REQUIRE_REVIEW" : "BLOCK_HANDOFF",
        sourceArtifactRef: source.reference,
        targetArtifactRef: target.reference,
        evidence: [evidence],
        owner: check.owner ?? "NOXIA_PRODUCT",
        reviewOwner: check.owner ?? "NOXIA_PRODUCT",
        technicalStatus: "SUCCESS",
        semanticStatus: "FINDINGS_PRESENT",
        reviewRequired: true,
        humanDecisionRequired: false,
        blocking: check.blocking !== false,
        limitations: ["VAL reports the structural fact and performs no correction."],
        provenance: [evidence.evidenceId],
        automaticCorrectionAllowed: false,
        autoDecisionAllowed: false,
      });
    };

    let ledgerValid = true;
    try {
      rehydrateProductOwnerResultLedger(input.ownerResultLedger);
    } catch {
      ledgerValid = false;
    }
    observe({ passed: ledgerValid, plane: "PROVENANCE_LINEAGE", sourceRef: input.ownerResultLedger.contract, targetRef: input.ownerResultLedger.ledgerDigest, note: "The current owner-result ledger must preserve its append-only contract and digest chain.", failureClass: "OWNER_RESULT_LEDGER_INVALID" });

    const projectTuple = [input.projectSnapshot.sourceProjectRef, input.projectSnapshot.sourceProjectVersion, input.projectSnapshot.sourceProjectDigest, input.projectSnapshot.snapshotDigest].join("|");
    for (const entry of input.ownerResultLedger.entries) {
      const result = entry.result;
      if (!result) continue;
      const resultTuple = [result.sourceProjectRef, result.sourceProjectVersion, result.sourceProjectDigest, result.sourceSnapshotDigest].join("|");
      const requestTuple = [entry.request.sourceProject.sourceProjectRef, entry.request.sourceProject.sourceProjectVersion, entry.request.sourceProject.sourceProjectDigest, entry.request.sourceProject.snapshotDigest].join("|");
      observe({ passed: resultTuple === projectTuple && requestTuple === projectTuple, plane: "IDENTITY_VERSION", sourceRef: projectTuple, targetRef: `${result.owner}:${resultTuple}`, note: `${result.owner} must bind both request and result to the exact current Project ID/version/digest/snapshot.`, failureClass: `STALE_${result.owner}_RESULT`, owner: result.owner });
      const native = isRecord(result.nativePayload) ? result.nativePayload : {};
      observe({
        passed: entry.projectWriteAuthorized === false
          && entry.request.projectWriteAuthorized === false
          && entry.observation.projectWrites === 0
          && result.projectWriteAuthorized === false
          && result.projectContribution === null
          && native.projectWriteAuthorized !== true,
        plane: "OWNERSHIP",
        sourceRef: result.resultId,
        targetRef: input.projectSnapshot.sourceProjectRef,
        note: `${result.owner} must remain a read-only candidate producer until an authorized Human/Project decision.`,
        failureClass: "UNAUTHORIZED_PROJECT_WRITE_OR_ADOPTION",
        owner: result.owner,
      });
      observe({ passed: native.candidateIsAdopted !== true, plane: "DECISION", sourceRef: result.resultId, targetRef: String(native.candidateIsAdopted ?? false), note: "An owner candidate must not be marked adopted by the owner runtime.", failureClass: "CANDIDATE_MARKED_ADOPTED", owner: result.owner });

      if (result.owner === "OBSERVABILITY_MEASUREMENT") {
        observe({
          passed: Array.isArray(native.observableProperties)
            && Array.isArray(native.measurementDefinitions)
            && Array.isArray(native.validityPerformanceQualifications)
            && Array.isArray(native.downstreamHandoffs),
          plane: "STRUCTURAL",
          sourceRef: result.resultId,
          targetRef: "OBSERVABILITY_QUALIFICATION_CURRENT_CONTRACT",
          note: "A present OBS result must expose the current property, measurement, qualification and downstream-handoff structures.",
          failureClass: "OBS_CURRENT_STRUCTURAL_FIELDS_MISSING",
          owner: "OBSERVABILITY_MEASUREMENT",
        });
      }
    }

    for (const expectation of input.expectations) {
      const present = input.ownerResultLedger.entries.some((entry) => entry.result?.owner === expectation.owner);
      observe({
        passed: !expectation.required || present,
        plane: "READINESS",
        sourceRef: expectation.selectedActionRef ?? expectation.requirementRef,
        targetRef: present ? expectation.owner : "MISSING_OWNER_RESULT",
        note: expectation.required ? `QRY declared ${expectation.owner} required for this action.` : `${expectation.owner} is not required for this action; absence is valid.`,
        failureClass: `REQUIRED_${expectation.owner}_RESULT_MISSING`,
        owner: expectation.owner,
      });
      if (expectation.required && expectation.knowledgeRequired) {
        const ownerEntry = input.ownerResultLedger.entries.find((entry) => entry.result?.owner === expectation.owner);
        const knowledgeDependency = ownerEntry?.dependencies.find((dependency) => dependency.owner === "KNOWLEDGE");
        observe({ passed: Boolean(knowledgeDependency), plane: "PROVENANCE_LINEAGE", sourceRef: expectation.requirementRef, targetRef: ownerEntry?.result?.resultId ?? "MISSING_OWNER_RESULT", note: `${expectation.owner} was declared to require an exact retained Knowledge result dependency.`, failureClass: `REQUIRED_KNOWLEDGE_FOR_${expectation.owner}_MISSING`, owner: expectation.owner });
      }
    }

    for (const [index, entry] of input.ownerResultLedger.entries.entries()) {
      if (!entry.result) continue;
      for (const dependency of entry.dependencies) {
        const prior = input.ownerResultLedger.entries.slice(0, index).find((candidate) => candidate.result?.owner === dependency.owner
          && candidate.result.resultId === dependency.resultId
          && candidate.result.resultVersion === dependency.resultVersion);
        observe({
          passed: Boolean(prior?.result) && ownerResultNativeDigest(prior!.result!) === dependency.nativeResultDigest,
          plane: "PROVENANCE_LINEAGE",
          sourceRef: dependency.resultId,
          targetRef: entry.result.resultId,
          note: "Every owner dependency must resolve to an earlier exact owner result identity/version/digest.",
          failureClass: "BROKEN_OR_IMPOSSIBLE_OWNER_SEQUENCE",
          owner: entry.result.owner,
        });
      }
      const knowledgeDependency = entry.dependencies.find((dependency) => dependency.owner === "KNOWLEDGE");
      if (!knowledgeDependency) continue;
      const retained = input.ownerResultLedger.entries.find((candidate) => candidate.result?.resultId === knowledgeDependency.resultId);
      const knowledge = knowledgePayload(retained);
      if (!knowledge) continue;
      const contentReadySources = new Set(knowledge.referenceSourceSnapshots.filter((source) => ["SECTION_INDEXED", "CLAIM_ANCHORED"].includes(source.contentAvailability)).map((source) => source.sourceId));
      const metadataOnlySources = new Set(knowledge.referenceSourceSnapshots.filter((source) => !contentReadySources.has(source.sourceId)).map((source) => source.sourceId));
      const supportedCandidates = knowledge.referenceEvidenceCandidates.filter((candidate) => contentReadySources.has(candidate.sourceId));
      observe({
        passed: supportedCandidates.length > 0,
        plane: "EPISTEMIC",
        sourceRef: knowledge.resultId,
        targetRef: entry.result.resultId,
        note: "A downstream owner dependency cannot promote a Knowledge result containing no section-indexed or claim-anchored evidence candidate.",
        failureClass: "METADATA_ONLY_EVIDENCE_PROMOTED_TO_OWNER_INPUT",
        owner: "KNOWLEDGE",
      });
      const nativeInput = isRecord(entry.request.nativeInput) ? entry.request.nativeInput : {};
      const knowledgeEvidence = isRecord(nativeInput.knowledgeEvidence) ? nativeInput.knowledgeEvidence : null;
      if (knowledgeEvidence) {
        observe({ passed: knowledgeEvidence.certaintyIncreaseAuthorized === false && knowledgeEvidence.ownershipTransferred === false, plane: "EPISTEMIC", sourceRef: knowledge.resultId, targetRef: entry.result.resultId, note: "The consumer must preserve Knowledge uncertainty and ownership without a certainty increase.", failureClass: "KNOWLEDGE_CERTAINTY_OR_OWNERSHIP_INCREASED", owner: "KNOWLEDGE" });
        const downstreamLimits = strings(knowledgeEvidence.limitations);
        observe({ passed: knowledge.limitations.every((limitation) => downstreamLimits.includes(limitation)), plane: "EPISTEMIC", sourceRef: knowledge.resultId, targetRef: entry.result.resultId, note: "Knowledge limitations must remain visible in a structured consumer evidence projection.", failureClass: "KNOWLEDGE_LIMITATION_LOST", owner: "KNOWLEDGE" });
      }
      if (entry.result.owner === "REGULATORY_RESOLUTION" && isRecord(entry.result.nativePayload)) {
        const requirements = Array.isArray(entry.result.nativePayload.applicableRequirements) ? entry.result.nativePayload.applicableRequirements.filter(isRecord) : [];
        const promotedMetadata = requirements.some((requirement) => strings(requirement.sourceIds).some((sourceId) => metadataOnlySources.has(sourceId)));
        observe({ passed: !promotedMetadata, plane: "EPISTEMIC", sourceRef: knowledge.resultId, targetRef: entry.result.resultId, note: "REG must not promote metadata-only evidence into an applicable Requirement.", failureClass: "UNSUPPORTED_REG_REQUIREMENT_PROMOTION", owner: "REGULATORY_RESOLUTION" });
      }
    }

    for (const binding of input.projectionBindings ?? []) {
      const tuple = [binding.projectId, binding.projectVersion, binding.projectDigest].join("|");
      const expected = [input.projectSnapshot.sourceProjectRef, input.projectSnapshot.sourceProjectVersion, input.projectSnapshot.sourceProjectDigest].join("|");
      observe({ passed: tuple === expected, plane: "IDENTITY_VERSION", sourceRef: expected, targetRef: `${binding.projectionOwner}:${binding.projectionId}:${tuple}`, note: "TMP/DOC projections must bind to the exact current Project ID/version/digest.", failureClass: `STALE_${binding.projectionOwner}_PROJECTION`, owner: binding.projectionOwner });
    }
    for (const binding of input.traceBindings ?? []) {
      const tuple = [binding.projectId, binding.projectVersion, binding.projectDigest].join("|");
      const expected = [input.projectSnapshot.sourceProjectRef, input.projectSnapshot.sourceProjectVersion, input.projectSnapshot.sourceProjectDigest].join("|");
      observe({ passed: tuple === expected && (!binding.ownerResultLedgerDigest || binding.ownerResultLedgerDigest === input.ownerResultLedger.ledgerDigest), plane: "PROVENANCE_LINEAGE", sourceRef: expected, targetRef: binding.traceRunId, note: "TRACE identity and retained owner-ledger identity must match the observed current Project state.", failureClass: "TRACE_OWNER_LEDGER_IDENTITY_MISMATCH", owner: "TRACE" });
    }
    if (stableStringify({ input, source, target }) !== before) throw new Error("CURRENT_OWNER_STACK_VAL_MUTATED_OBSERVED_INPUT");
    return { observations, findings, sourceMutationAuthorized: false, targetMutationAuthorized: false };
  },
});

const profileReference = (): ProductValidationProfileReference => ({
  profileId: CURRENT_OWNER_STACK_VALIDATION_PROFILE,
  profileVersion: CURRENT_OWNER_STACK_VALIDATION_PROFILE_VERSION,
  validationEngineId: "VAL-001-DETERMINISTIC-ENGINE",
  validationEngineVersion: VAL001_DETERMINISTIC_ENGINE_VERSION,
  scientificQualificationClaimed: false,
});

const boundedStatusFor = (run: Readonly<ValidationRun>): ProductValidationRunLedgerEntry["boundedStatus"] => {
  if (run.technicalStatus !== "SUCCESS" || ["NOT_EVALUABLE", "TECHNICAL_FAILURE"].includes(run.status)) return "NOT_EVALUABLE";
  return run.findings.length ? "STRUCTURAL_FIDELITY_FINDINGS" : "STRUCTURAL_FIDELITY_PASS";
};

export const executeCurrentOwnerStackValidationProfile = (input: Readonly<CurrentOwnerStackValidationInput>): CurrentOwnerStackValidationExecution => {
  const before = stableStringify(input);
  const { sourceSnapshot, targetSnapshot } = buildSnapshots(input);
  const run = runCheckpointValidation({
    request: {
      checkpointId: CURRENT_OWNER_STACK_CHECKPOINT,
      checkpointVersion: "1.0.0",
      sourceArtifact: sourceSnapshot.reference,
      targetArtifact: targetSnapshot.reference,
      requestedPlanes: ["STRUCTURAL", "IDENTITY_VERSION", "PROVENANCE_LINEAGE", "OWNERSHIP", "EPISTEMIC", "DECISION", "READINESS", "REPRODUCIBILITY"],
      requestedInvariantRefs: ["VAL-C08"],
      includeSemanticReview: false,
      includeHumanReviewPreparation: false,
      caller: input.callerRef,
      purpose: input.purpose,
      dryRun: true,
      limitations: ["CURRENT_OWNER_STACK_STRUCTURAL_DIAGNOSTIC_ONLY"],
      sourceMutationAuthorized: false,
      targetMutationAuthorized: false,
      projectWriteAuthorized: false,
      documentWriteAuthorized: false,
      autoFixAllowed: false,
      autoDecisionAllowed: false,
    },
    sourceSnapshot,
    targetSnapshot,
    domainValidationProviders: [createProvider(input)],
    limitations: ["CURRENT_OWNER_STACK_FIDELITY profile only", "No scientific, regulatory or document-quality judgment."],
    technicalTimestamp: input.completedAt,
  });
  if (stableStringify(input) !== before) throw new Error("CURRENT_OWNER_STACK_VAL_INPUT_MUTATED");
  return deepFreeze({
    run,
    sourceSnapshot,
    targetSnapshot,
    profile: profileReference(),
    boundedStatus: boundedStatusFor(run),
    recognizedOwners: [...ALL_OWNERS],
    nativeValEngineInvocations: 1,
    semanticReviewerCalls: 0,
    repairCalls: 0,
    projectWrites: 0,
    traceWrites: 0,
    humanDecisionBypassed: false,
    scientificQualificationClaimed: false,
  });
};

export const validateCurrentOwnerStackForProject = (input: CurrentOwnerStackValidationInput & {
  project: Readonly<ResearchProjectOwnerProjection>;
  validationLedger: Readonly<ProductValidationRunLedger>;
  retainedAt?: string;
  trace?: ScientificRunTraceRecorder;
}) => {
  const projectBefore = stableStringify(input.project);
  const traceBefore = input.trace ? stableStringify(input.trace.getRun()) : null;
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) throw new Error("CURRENT_OWNER_STACK_VAL_PROJECT_SNAPSHOT_MISMATCH");
  const execution = executeCurrentOwnerStackValidationProfile(input);
  const ownerResultRefs = input.ownerResultLedger.entries.flatMap((entry) => entry.result ? [ownerRef(entry.result)] : []);
  const retained = appendProductValidationRun({
    ledger: input.validationLedger,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt ?? input.completedAt,
    validationInvocationId: input.validationInvocationId,
    profile: execution.profile,
    projectSnapshotRef: {
      projectId: input.projectSnapshot.sourceProjectRef,
      projectVersion: input.projectSnapshot.sourceProjectVersion,
      projectDigest: input.projectSnapshot.sourceProjectDigest,
      snapshotDigest: input.projectSnapshot.snapshotDigest,
    },
    ownerResultRefs,
    ownerResultLedgerDigest: input.ownerResultLedger.ledgerDigest,
    run: execution.run,
    boundedStatus: execution.boundedStatus,
  });
  if (stableStringify(input.project) !== projectBefore || (input.trace && stableStringify(input.trace.getRun()) !== traceBefore)) throw new Error("CURRENT_OWNER_STACK_VAL_MUTATION_BOUNDARY_VIOLATED");
  return deepFreeze({
    ...execution,
    validationLedger: retained.ledger,
    validationEntry: retained.entry,
    ownerResultLedger: input.ownerResultLedger,
    providerCalls: 0 as const,
  });
};
