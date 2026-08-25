import { logicalDigest, stableStringify, type KnowledgeResult } from "@/features/knowledge-engine";
import type { ImagingDesignInput, ImagingDesignResult } from "@/features/imaging-study-designer";
import type { ScientificThinkingInput, ScientificThinkingOutput } from "@/features/scientific-thinking";
import type {
  ProjectContextSnapshot,
  ResearchProjectOwnerProjection,
  SpecializedOwnerResult,
} from "@/features/research-project-construction";
import {
  VAL001_CONTRACT_VERSION,
  VAL001_DETERMINISTIC_ENGINE_VERSION,
  finalizeValidationArtifactSnapshot,
  replayValidationRun,
  runCheckpointValidation,
  validationDigest,
  type DomainValidationProvider,
  type ValidationArtifactReference,
  type ValidationArtifactSnapshot,
  type ValidationCheckpointDefinition,
  type ValidationCheckpointExecutionInput,
  type ValidationEvidence,
  type ValidationObservation,
  type ValidationPlane,
  type ValidationProductFinding,
  type ValidationRun,
  type ValidationSnapshotRelation,
  type ValidationSnapshotSemanticObject,
} from "@/features/validation-architecture";
import {
  ownerResultNativeDigest,
  rehydrateProductOwnerResultLedger,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import {
  appendProductValidationRun,
  type ProductScientificOwnerResultReference,
  type ProductValidationRunLedger,
  type ProductValidationRunLedgerEntry,
  type ProductValidationProfileReference,
} from "./product-validation-run-ledger";

export const SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE = "SCIENTIFIC_OWNER_CHAIN_FIDELITY" as const;
export const SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE_VERSION = "0.1.0" as const;
const SCIENTIFIC_OWNER_CHAIN_CHECKPOINT = "VAL-ST-OBS-IMG-001" as const;
const SCIENTIFIC_OWNER_CHAIN_VALIDATOR = "VAL-PRODUCT-SCIENTIFIC-OWNER-CHAIN-FIDELITY" as const;
const SCIENTIFIC_OWNER_CHAIN_VALIDATOR_VERSION = "0.1.0" as const;
const OBS_GAP = "OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED" as const;

type KnowledgeEntry = ProductOwnerResultLedgerEntry<unknown, KnowledgeResult>;
type ScientificThinkingEntry = ProductOwnerResultLedgerEntry<unknown, ScientificThinkingOutput>;
type ImagingEntry = ProductOwnerResultLedgerEntry<unknown, ImagingDesignResult>;

export type ScientificOwnerChainValidationInput = {
  validationInvocationId: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  knowledgeEntry: Readonly<KnowledgeEntry>;
  scientificThinkingEntry: Readonly<ScientificThinkingEntry>;
  imagingEntry: Readonly<ImagingEntry>;
  callerRef: string;
  purpose: string;
  completedAt: string;
};

export type ScientificOwnerChainValidationExecution = {
  run: Readonly<ValidationRun>;
  sourceSnapshot: Readonly<ValidationArtifactSnapshot>;
  targetSnapshot: Readonly<ValidationArtifactSnapshot>;
  profile: Readonly<ProductValidationProfileReference>;
  boundedStatus: ProductValidationRunLedgerEntry["boundedStatus"];
  nativeValEngineInvocations: 1;
  semanticReviewerCalls: 0;
  repairCalls: 0;
  projectWrites: 0;
  humanDecisionBypassed: false;
  scientificQualificationClaimed: false;
};

export type ProductScientificLoopValidationInvocation = ScientificOwnerChainValidationExecution & {
  validationLedger: Readonly<ProductValidationRunLedger>;
  validationEntry: Readonly<ProductValidationRunLedgerEntry>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  geminiCalls: 0;
  terraCalls: 0;
  externalEvidenceCalls: 0;
  obsRuntimeCalls: 0;
};

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort(compare);
const clone = <T>(value: T): T => structuredClone(value);
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const ownerResultRef = (result: SpecializedOwnerResult): ProductScientificOwnerResultReference => ({
  owner: result.owner as ProductScientificOwnerResultReference["owner"],
  resultId: result.resultId,
  resultVersion: result.resultVersion,
  nativeResultDigest: ownerResultNativeDigest(result) ?? "MISSING_NATIVE_RESULT_DIGEST",
});

const artifactReference = (input: {
  artifactId: string;
  artifactType: "SCIENTIFIC_THINKING_RESULT" | "IMAGING_CONTRIBUTION";
  version: string;
  owner: string;
  contentDigest: string;
  project: ProjectContextSnapshot;
  provenanceRefs: readonly string[];
}): ValidationArtifactReference => ({
  artifactId: input.artifactId,
  artifactType: input.artifactType,
  version: input.version,
  owner: input.owner,
  sourceOfTruth: false,
  contentDigest: input.contentDigest,
  schemaVersion: VAL001_CONTRACT_VERSION,
  projectId: input.project.sourceProjectRef,
  projectVersion: input.project.sourceProjectVersion,
  contributionId: null,
  projectionId: null,
  provenanceRefs: unique(input.provenanceRefs),
  immutableForRun: true,
});

const semanticObject = (input: {
  objectId: string;
  objectType: string;
  status: string;
  owner: string;
  sourceRefs?: readonly string[];
  provenanceRefs?: readonly string[];
  attributes?: Record<string, unknown>;
}): ValidationSnapshotSemanticObject => ({
  objectId: input.objectId,
  objectType: input.objectType,
  label: null,
  status: input.status,
  owner: input.owner,
  sourceRefs: unique(input.sourceRefs ?? []),
  provenanceRefs: unique(input.provenanceRefs ?? []),
  semanticKey: null,
  polarity: null,
  role: null,
  attributes: clone(input.attributes ?? {}),
});

const relation = (input: {
  relationId: string;
  sourceObjectId: string;
  targetObjectId: string;
  relationType: string;
  owner: string;
  provenanceRefs?: readonly string[];
}): ValidationSnapshotRelation => ({
  relationId: input.relationId,
  sourceObjectId: input.sourceObjectId,
  targetObjectId: input.targetObjectId,
  relationType: input.relationType,
  polarity: null,
  status: "ACTIVE",
  owner: input.owner,
  sourceRefs: [input.sourceObjectId, input.targetObjectId],
  provenanceRefs: unique(input.provenanceRefs ?? []),
});

const diagnosticObjects = (owner: string, resultId: string, input: {
  unknowns: readonly string[];
  gaps: readonly string[];
  limitations: readonly string[];
  contradictions: readonly string[];
}) => [
  ...input.unknowns.map((value) => semanticObject({ objectId: `val-diagnostic:${logicalDigest({ owner, resultId, kind: "UNKNOWN", value })}`, objectType: "UNKNOWN", status: "UNKNOWN", owner, sourceRefs: [resultId] })),
  ...input.gaps.map((value) => semanticObject({ objectId: `val-diagnostic:${logicalDigest({ owner, resultId, kind: "GAP", value })}`, objectType: "GAP", status: "OPEN", owner, sourceRefs: [resultId] })),
  ...input.limitations.map((value) => semanticObject({ objectId: `val-diagnostic:${logicalDigest({ owner, resultId, kind: "LIMITATION", value })}`, objectType: "LIMITATION", status: "ACTIVE", owner, sourceRefs: [resultId] })),
  ...input.contradictions.map((value) => semanticObject({ objectId: `val-diagnostic:${logicalDigest({ owner, resultId, kind: "CONTRADICTION", value })}`, objectType: "CONTRADICTION", status: "OPEN", owner, sourceRefs: [resultId] })),
];

const nativeContradictions = (result: SpecializedOwnerResult | null) => {
  if (!result?.nativePayload || !isRecord(result.nativePayload)) return [];
  if (Array.isArray(result.nativePayload.controversies)) {
    return result.nativePayload.controversies.flatMap((item) => isRecord(item) && typeof item.conflictId === "string" ? [item.conflictId] : []);
  }
  return strings(result.nativePayload.contradictions);
};

const buildSnapshots = (input: Readonly<ScientificOwnerChainValidationInput>) => {
  const knowledge = input.knowledgeEntry.result as SpecializedOwnerResult<KnowledgeResult> | null;
  const scientificThinking = input.scientificThinkingEntry.result as SpecializedOwnerResult<ScientificThinkingOutput> | null;
  const imaging = input.imagingEntry.result as SpecializedOwnerResult<ImagingDesignResult> | null;
  if (!knowledge || !scientificThinking || !imaging) throw new Error("SCIENTIFIC_OWNER_CHAIN_RESULT_MISSING");
  const projectObjectId = `${input.projectSnapshot.sourceProjectRef}@${input.projectSnapshot.sourceProjectVersion}`;
  const baseObjects = [
    semanticObject({ objectId: projectObjectId, objectType: "CanonicalResearchProjectSnapshot", status: "ADOPTED", owner: "RESEARCH_PROJECT", provenanceRefs: [input.projectSnapshot.sourceContributionRef], attributes: { projectDigest: input.projectSnapshot.sourceProjectDigest, snapshotDigest: input.projectSnapshot.snapshotDigest } }),
    semanticObject({ objectId: knowledge.resultId, objectType: "KnowledgeOwnerResult", status: knowledge.status, owner: knowledge.owner, sourceRefs: [projectObjectId], provenanceRefs: knowledge.provenance, attributes: ownerResultRef(knowledge) }),
    semanticObject({ objectId: scientificThinking.resultId, objectType: "ScientificThinkingOwnerResult", status: "CANDIDATE", owner: scientificThinking.owner, sourceRefs: [knowledge.resultId, projectObjectId], provenanceRefs: scientificThinking.provenance, attributes: ownerResultRef(scientificThinking) }),
    ...knowledge.evidenceRefs.map((evidenceRef) => semanticObject({ objectId: evidenceRef, objectType: "KnowledgeEvidenceReference", status: "PRESERVED", owner: "KNOWLEDGE", sourceRefs: [knowledge.resultId], provenanceRefs: knowledge.provenance })),
    ...diagnosticObjects(knowledge.owner, knowledge.resultId, { unknowns: knowledge.unknowns, gaps: knowledge.gaps, limitations: knowledge.limitations, contradictions: nativeContradictions(knowledge) }),
    ...diagnosticObjects(scientificThinking.owner, scientificThinking.resultId, { unknowns: scientificThinking.unknowns, gaps: scientificThinking.gaps, limitations: scientificThinking.limitations, contradictions: nativeContradictions(scientificThinking) }),
  ];
  const knowledgeToScientificThinking = relation({
    relationId: `val-relation:${logicalDigest({ from: knowledge.resultId, to: scientificThinking.resultId, type: "DEPENDS_ON" })}`,
    sourceObjectId: knowledge.resultId,
    targetObjectId: scientificThinking.resultId,
    relationType: "DEPENDS_ON",
    owner: "NOXIA_PRODUCT",
    provenanceRefs: [input.scientificThinkingEntry.entryId],
  });
  const imagingObject = semanticObject({ objectId: imaging.resultId, objectType: "ImagingOwnerResult", status: "CANDIDATE", owner: imaging.owner, sourceRefs: [scientificThinking.resultId, knowledge.resultId, projectObjectId], provenanceRefs: imaging.provenance, attributes: ownerResultRef(imaging) });
  const targetObjects = [
    ...baseObjects,
    imagingObject,
    ...diagnosticObjects(imaging.owner, imaging.resultId, { unknowns: imaging.unknowns, gaps: imaging.gaps, limitations: imaging.limitations, contradictions: nativeContradictions(imaging) }),
  ];
  const scientificThinkingToImaging = relation({
    relationId: `val-relation:${logicalDigest({ from: scientificThinking.resultId, to: imaging.resultId, type: "DEPENDS_ON" })}`,
    sourceObjectId: scientificThinking.resultId,
    targetObjectId: imaging.resultId,
    relationType: "DEPENDS_ON",
    owner: "NOXIA_PRODUCT",
    provenanceRefs: [input.imagingEntry.entryId],
  });
  const ownerRefs = [ownerResultRef(knowledge), ownerResultRef(scientificThinking), ownerResultRef(imaging)];
  const metadata = {
    validationProfile: SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE,
    validationProfileVersion: SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE_VERSION,
    validationInvocationId: input.validationInvocationId,
    projectSnapshotRef: {
      projectId: input.projectSnapshot.sourceProjectRef,
      projectVersion: input.projectSnapshot.sourceProjectVersion,
      projectDigest: input.projectSnapshot.sourceProjectDigest,
      snapshotDigest: input.projectSnapshot.snapshotDigest,
    },
    ownerResultRefs: ownerRefs,
    projectWriteAuthorized: false,
    repairAuthorized: false,
    scientificQualificationClaimed: false,
  };
  const sourceReference = artifactReference({ artifactId: scientificThinking.resultId, artifactType: "SCIENTIFIC_THINKING_RESULT", version: scientificThinking.resultVersion, owner: "SCIENTIFIC_THINKING", contentDigest: ownerResultNativeDigest(scientificThinking)!, project: input.projectSnapshot, provenanceRefs: scientificThinking.provenance });
  const targetReference = artifactReference({ artifactId: imaging.resultId, artifactType: "IMAGING_CONTRIBUTION", version: imaging.resultVersion, owner: "IMAGING", contentDigest: ownerResultNativeDigest(imaging)!, project: input.projectSnapshot, provenanceRefs: imaging.provenance });
  const sourceSnapshot = finalizeValidationArtifactSnapshot({
    reference: sourceReference,
    artifactKind: "SCIENTIFIC_THINKING_RESULT",
    owner: "SCIENTIFIC_THINKING",
    semanticObjects: baseObjects,
    relations: [knowledgeToScientificThinking],
    epistemicStates: baseObjects.map((item) => ({ subjectId: item.objectId, epistemicStatus: item.status, adoptionStatus: item.objectType === "CanonicalResearchProjectSnapshot" ? "ADOPTED" : "CANDIDATE", activeState: true, sourceRefs: item.sourceRefs })),
    decisions: [],
    unknowns: unique([...knowledge.unknowns, ...scientificThinking.unknowns]),
    contradictions: unique([...nativeContradictions(knowledge), ...nativeContradictions(scientificThinking)]),
    limitations: unique([...knowledge.limitations, ...scientificThinking.limitations]),
    provenance: unique([...knowledge.provenance, ...scientificThinking.provenance]),
    lineage: [input.knowledgeEntry.entryId, input.scientificThinkingEntry.entryId],
    sourceReferences: unique([...knowledge.evidenceRefs, ...knowledge.provenance]),
    projectionOnly: true,
    validationProjectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    metadata,
  });
  const targetSnapshot = finalizeValidationArtifactSnapshot({
    reference: targetReference,
    artifactKind: "IMAGING_CONTRIBUTION",
    owner: "IMAGING",
    semanticObjects: targetObjects,
    relations: [knowledgeToScientificThinking, scientificThinkingToImaging],
    epistemicStates: targetObjects.map((item) => ({ subjectId: item.objectId, epistemicStatus: item.status, adoptionStatus: item.objectType === "CanonicalResearchProjectSnapshot" ? "ADOPTED" : "CANDIDATE", activeState: true, sourceRefs: item.sourceRefs })),
    decisions: [],
    unknowns: unique([...knowledge.unknowns, ...scientificThinking.unknowns, ...imaging.unknowns]),
    contradictions: unique([...nativeContradictions(knowledge), ...nativeContradictions(scientificThinking), ...nativeContradictions(imaging)]),
    limitations: unique([...knowledge.limitations, ...scientificThinking.limitations, ...imaging.limitations]),
    provenance: unique([...knowledge.provenance, ...scientificThinking.provenance, ...imaging.provenance]),
    lineage: [input.knowledgeEntry.entryId, input.scientificThinkingEntry.entryId, input.imagingEntry.entryId],
    sourceReferences: unique([...knowledge.evidenceRefs, ...imaging.evidenceRefs, ...knowledge.provenance]),
    projectionOnly: true,
    validationProjectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    metadata,
  });
  return { sourceSnapshot, targetSnapshot, knowledge, scientificThinking, imaging, ownerRefs };
};

const evidence = (input: { sourceRef: string; targetRef: string; note: string; digest?: string | null }): ValidationEvidence => {
  const material = { sourceRef: input.sourceRef, targetRef: input.targetRef, note: input.note, digest: input.digest ?? null };
  return {
    evidenceId: `val-evidence:${validationDigest(material)}`,
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
    domainValidatorResultRef: SCIENTIFIC_OWNER_CHAIN_VALIDATOR,
    comparisonNote: input.note,
  };
};

const createProfileProvider = (input: Readonly<ScientificOwnerChainValidationInput>): DomainValidationProvider => ({
  providerId: SCIENTIFIC_OWNER_CHAIN_VALIDATOR,
  owner: "VAL-001",
  invariantRefs: ["VAL-C08"],
  version: SCIENTIFIC_OWNER_CHAIN_VALIDATOR_VERSION,
  deterministic: true,
  limitations: [
    "STRUCTURAL_FIDELITY_ONLY_NOT_SCIENTIFIC_QUALIFICATION",
    "OBS_RUNTIME_ABSENCE_IS_AN_EXPECTED_CAPABILITY_GAP",
    "NO_REPAIR_NO_SOURCE_OR_TARGET_MUTATION",
  ],
  supports: (_source, target, checkpoint) => checkpoint.checkpointId === SCIENTIFIC_OWNER_CHAIN_CHECKPOINT
    && target.metadata.validationProfile === SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE,
  validateReadOnly: (source, target, checkpoint) => {
    const before = stableStringify({ source, target, input });
    const knowledge = input.knowledgeEntry.result as SpecializedOwnerResult<KnowledgeResult> | null;
    const st = input.scientificThinkingEntry.result as SpecializedOwnerResult<ScientificThinkingOutput> | null;
    const imaging = input.imagingEntry.result as SpecializedOwnerResult<ImagingDesignResult> | null;
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
      digest?: string | null;
    }) => {
      const proof = evidence({ sourceRef: check.sourceRef, targetRef: check.targetRef, note: check.note, digest: check.digest });
      const observationType = check.passed ? "PRESERVED" as const : "CONFLICT" as const;
      const observationId = `val-observation:${validationDigest({ checkpoint: checkpoint.checkpointId, plane: check.plane, source: check.sourceRef, target: check.targetRef, observationType, note: check.note })}`;
      const observation: ValidationObservation = {
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
        evidence: [proof],
        deterministic: true,
        confidenceKind: "DETERMINISTIC",
        technicalStatus: "SUCCESS",
        limitations: [],
      };
      observations.push(observation);
      if (!check.passed) {
        const findingId = `val-finding:${validationDigest({ observationId, failureClass: check.failureClass })}`;
        findings.push({
          findingId,
          checkpointId: checkpoint.checkpointId,
          invariantRef: "VAL-C08",
          observationRefs: [observationId],
          findingClass: check.plane === "OWNERSHIP" ? "OWNERSHIP_VIOLATION" : check.plane === "IDENTITY_VERSION" ? "IDENTITY_CONTINUITY_VIOLATION" : "STRUCTURED_INVARIANT_VIOLATION",
          domainFailureClassRef: check.failureClass,
          severity: "BLOCKING",
          disposition: "BLOCK_HANDOFF",
          sourceArtifactRef: source.reference,
          targetArtifactRef: target.reference,
          evidence: [proof],
          owner: check.owner ?? "NOXIA_PRODUCT",
          reviewOwner: check.owner ?? "NOXIA_PRODUCT",
          technicalStatus: "SUCCESS",
          semanticStatus: "FINDINGS_PRESENT",
          reviewRequired: true,
          humanDecisionRequired: false,
          blocking: true,
          limitations: ["VAL reports the violation and performs no correction."],
          provenance: [proof.evidenceId],
          automaticCorrectionAllowed: false,
          autoDecisionAllowed: false,
        });
      }
    };
    if (!knowledge || !st || !imaging) {
      observe({ passed: false, plane: "STRUCTURAL", sourceRef: input.projectSnapshot.sourceProjectRef, targetRef: "MISSING_OWNER_RESULT", note: "One or more required owner results are absent.", failureClass: "OWNER_RESULT_MISSING" });
    } else {
      const projectTuple = [input.projectSnapshot.sourceProjectRef, input.projectSnapshot.sourceProjectVersion, input.projectSnapshot.sourceProjectDigest].join("|");
      for (const result of [knowledge, st, imaging]) {
        const observedTuple = [result.sourceProjectRef, result.sourceProjectVersion, result.sourceProjectDigest].join("|");
        observe({ passed: observedTuple === projectTuple, plane: "IDENTITY_VERSION", sourceRef: projectTuple, targetRef: `${result.owner}:${observedTuple}`, note: `${result.owner} must reference the exact current Project ID/version/digest.`, failureClass: `STALE_${result.owner}_RESULT`, owner: result.owner, digest: result.sourceProjectDigest });
      }
      observe({ passed: knowledge.owner === "KNOWLEDGE", plane: "OWNERSHIP", sourceRef: knowledge.resultId, targetRef: knowledge.owner, note: "Knowledge-owned content must remain Knowledge-owned.", failureClass: "OWNER_TRANSFER_VIOLATION", owner: "KNOWLEDGE" });
      observe({ passed: st.owner === "SCIENTIFIC_THINKING", plane: "OWNERSHIP", sourceRef: st.resultId, targetRef: st.owner, note: "Scientific Thinking candidates must remain Scientific Thinking-owned.", failureClass: "OWNER_TRANSFER_VIOLATION", owner: "SCIENTIFIC_THINKING" });
      observe({ passed: imaging.owner === "IMAGING", plane: "OWNERSHIP", sourceRef: imaging.resultId, targetRef: imaging.owner, note: "Imaging candidates must remain Imaging-owned.", failureClass: "OWNER_TRANSFER_VIOLATION", owner: "IMAGING" });
      const knowledgeDigest = ownerResultNativeDigest(knowledge) ?? "MISSING";
      const stDigest = ownerResultNativeDigest(st) ?? "MISSING";
      const stKnowledgeDependency = input.scientificThinkingEntry.dependencies.find((item) => item.owner === "KNOWLEDGE");
      const imagingKnowledgeDependency = input.imagingEntry.dependencies.find((item) => item.owner === "KNOWLEDGE");
      const imagingStDependency = input.imagingEntry.dependencies.find((item) => item.owner === "SCIENTIFIC_THINKING");
      const exactDependency = (dependency: typeof stKnowledgeDependency, result: SpecializedOwnerResult, digest: string) => Boolean(dependency
        && dependency.resultId === result.resultId
        && dependency.resultVersion === result.resultVersion
        && dependency.nativeResultDigest === digest);
      observe({ passed: exactDependency(stKnowledgeDependency, knowledge, knowledgeDigest), plane: "PROVENANCE_LINEAGE", sourceRef: knowledge.resultId, targetRef: st.resultId, note: "ST must preserve the exact Knowledge OwnerResult identity/version/digest dependency.", failureClass: "KNOWLEDGE_TO_ST_LINEAGE_MISSING" });
      observe({ passed: exactDependency(imagingKnowledgeDependency, knowledge, knowledgeDigest), plane: "PROVENANCE_LINEAGE", sourceRef: knowledge.resultId, targetRef: imaging.resultId, note: "Imaging must preserve the exact Knowledge OwnerResult dependency.", failureClass: "KNOWLEDGE_TO_IMAGING_LINEAGE_MISSING" });
      observe({ passed: exactDependency(imagingStDependency, st, stDigest), plane: "PROVENANCE_LINEAGE", sourceRef: st.resultId, targetRef: imaging.resultId, note: "Imaging must preserve the exact Scientific Thinking OwnerResult dependency.", failureClass: "ST_TO_IMAGING_LINEAGE_MISSING" });

      const stNative = st.nativePayload;
      const imagingInput = input.imagingEntry.request.nativeInput as ImagingDesignInput;
      const imagingNative = imaging.nativePayload;
      const stKnowledge = stNative?.knowledgeDependencies.find((item) => item.knowledgeResultRef === knowledge.resultId);
      const sourceIds = knowledge.nativePayload?.sources.map((item) => item.sourceId) ?? [];
      const evidenceRefs = knowledge.nativePayload?.evidence.map((item) => item.evidenceId) ?? [];
      observe({
        passed: Boolean(stKnowledge)
          && sourceIds.every((item) => stKnowledge!.sourceRefs.includes(item))
          && evidenceRefs.every((item) => stKnowledge!.evidenceRefs.includes(item))
          && sourceIds.every((item) => imagingInput.knowledge.sourceIds.includes(item)),
        plane: "PROVENANCE_LINEAGE",
        sourceRef: knowledge.resultId,
        targetRef: imaging.resultId,
        note: "Knowledge source/evidence references must remain reconstructible through ST and Imaging inputs.",
        failureClass: "KNOWLEDGE_EVIDENCE_LINEAGE_MISSING",
      });
      observe({ passed: imagingInput.sourceHandoff.stOutputRef === stNative?.outputId, plane: "PROVENANCE_LINEAGE", sourceRef: st.resultId, targetRef: imagingInput.sourceHandoff.stOutputRef, note: "Imaging native input must reference the exact ST output.", failureClass: "IMAGING_NATIVE_ST_REFERENCE_MISMATCH" });
      observe({ passed: imagingInput.knowledge.resultId === knowledge.nativePayload?.resultId && imagingInput.knowledge.resultDigest === knowledge.nativePayload?.resultDigest, plane: "PROVENANCE_LINEAGE", sourceRef: knowledge.resultId, targetRef: imagingInput.knowledge.resultId ?? "MISSING", note: "Imaging native input must reference the exact Knowledge result and digest.", failureClass: "IMAGING_NATIVE_KNOWLEDGE_REFERENCE_MISMATCH" });

      const knowledgeGapRefs = knowledge.nativePayload?.gaps.map((item) => item.gapId) ?? [];
      const knowledgeGapCodes = knowledge.nativePayload?.gaps.map((item) => item.code) ?? [];
      observe({ passed: knowledgeGapRefs.every((item) => stKnowledge?.gapRefs.includes(item)) && knowledgeGapCodes.every((item) => imagingNative?.knowledgeHandoff.gapCodes.includes(item)), plane: "EPISTEMIC", sourceRef: knowledge.resultId, targetRef: imaging.resultId, note: "Knowledge gaps must remain explicit through ST and Imaging.", failureClass: "REQUIRED_GAP_LOST", owner: "KNOWLEDGE" });
      observe({ passed: st.unknowns.every((item) => imaging.unknowns.includes(item)), plane: "EPISTEMIC", sourceRef: st.resultId, targetRef: imaging.resultId, note: "ST unknowns must remain visible in the retained Imaging OwnerResult.", failureClass: "UNKNOWN_LOST", owner: "SCIENTIFIC_THINKING" });
      const knowledgeLimitations = knowledge.nativePayload?.limitations ?? [];
      observe({ passed: knowledgeLimitations.every((item) => stNative?.handoff.limitations.includes(item)) && knowledgeLimitations.every((item) => imagingNative?.limitations.includes(item)), plane: "EPISTEMIC", sourceRef: knowledge.resultId, targetRef: imaging.resultId, note: "Knowledge limitations must remain visible through ST and Imaging.", failureClass: "LIMITATION_LOST", owner: "KNOWLEDGE" });
      const knowledgeContradictions = knowledge.nativePayload?.controversies.map((item) => item.conflictId) ?? [];
      const stContradictions = stNative?.contradictions ?? [];
      observe({ passed: knowledgeContradictions.every((item) => stKnowledge?.contradictionRefs.includes(item)) && stContradictions.every((item) => imagingNative?.contradictions.includes(item)), plane: "EPISTEMIC", sourceRef: knowledge.resultId, targetRef: imaging.resultId, note: "Knowledge contradictions and ST alternatives must remain visible; VAL chooses no winner.", failureClass: "CONTRADICTION_LOST", owner: "KNOWLEDGE" });
      observe({ passed: imaging.gaps.includes(OBS_GAP) && imaging.limitations.includes("OBS_RUNTIME_UNAVAILABLE_NO_AUTONOMOUS_QUALIFICATION"), plane: "READINESS", sourceRef: imaging.resultId, targetRef: OBS_GAP, note: "EXPECTED_CAPABILITY_GAP_PRESERVED: OBS absence remains visible and is not a scientific failure.", failureClass: "REQUIRED_GAP_LOST", owner: "OBS-001" });
      observe({ passed: [knowledge, st, imaging].every((item) => item.projectWriteAuthorized === false)
        && [input.knowledgeEntry, input.scientificThinkingEntry, input.imagingEntry].every((item) => item.observation.projectWrites === 0 && item.request.projectWriteAuthorized === false), plane: "OWNERSHIP", sourceRef: input.projectSnapshot.sourceProjectRef, targetRef: "VAL_OBSERVATION", note: "Owner invocation and VAL observation authorize zero Project writes.", failureClass: "PROJECT_WRITE_BOUNDARY_VIOLATION", owner: "RESEARCH_PROJECT" });
    }
    if (stableStringify({ source, target, input }) !== before) throw new Error("VAL_PRODUCT_PROFILE_MUTATED_OBSERVED_INPUT");
    return { observations, findings, sourceMutationAuthorized: false, targetMutationAuthorized: false };
  },
});

const profileReference = (): ProductValidationProfileReference => ({
  profileId: SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE,
  profileVersion: SCIENTIFIC_OWNER_CHAIN_VALIDATION_PROFILE_VERSION,
  validationEngineId: "VAL-001-DETERMINISTIC-ENGINE",
  validationEngineVersion: VAL001_DETERMINISTIC_ENGINE_VERSION,
  scientificQualificationClaimed: false,
});

const buildExecutionInput = (input: Readonly<ScientificOwnerChainValidationInput>) => {
  const { sourceSnapshot, targetSnapshot, ownerRefs } = buildSnapshots(input);
  const executionInput: ValidationCheckpointExecutionInput = {
    request: {
      checkpointId: SCIENTIFIC_OWNER_CHAIN_CHECKPOINT,
      checkpointVersion: "1.0.0",
      sourceArtifact: sourceSnapshot.reference,
      targetArtifact: targetSnapshot.reference,
      requestedPlanes: ["STRUCTURAL", "IDENTITY_VERSION", "PROVENANCE_LINEAGE", "OWNERSHIP", "EPISTEMIC", "READINESS", "REPRODUCIBILITY"],
      requestedInvariantRefs: ["VAL-C08"],
      includeSemanticReview: false,
      includeHumanReviewPreparation: false,
      caller: input.callerRef,
      purpose: input.purpose,
      dryRun: true,
      limitations: ["STRUCTURAL_FIDELITY_ONLY_NOT_SCIENTIFIC_QUALIFICATION"],
      sourceMutationAuthorized: false,
      targetMutationAuthorized: false,
      projectWriteAuthorized: false,
      documentWriteAuthorized: false,
      autoFixAllowed: false,
      autoDecisionAllowed: false,
    },
    sourceSnapshot,
    targetSnapshot,
    domainValidationProviders: [createProfileProvider(input)],
    limitations: [
      "SCIENTIFIC_OWNER_CHAIN_FIDELITY profile only",
      "OBS runtime is absent and is not simulated.",
      "PD-011 scientific qualification is outside this run.",
    ],
    technicalTimestamp: input.completedAt,
  };
  return { executionInput, sourceSnapshot, targetSnapshot, ownerRefs };
};

const boundedStatusFor = (run: Readonly<ValidationRun>): ProductValidationRunLedgerEntry["boundedStatus"] => {
  if (run.technicalStatus !== "SUCCESS" || ["NOT_EVALUABLE", "TECHNICAL_FAILURE"].includes(run.status)) return "NOT_EVALUABLE";
  return run.findings.length ? "STRUCTURAL_FIDELITY_FINDINGS" : "STRUCTURAL_FIDELITY_PASS";
};

export const executeScientificOwnerChainValidationProfile = (input: Readonly<ScientificOwnerChainValidationInput>): ScientificOwnerChainValidationExecution => {
  const { executionInput, sourceSnapshot, targetSnapshot } = buildExecutionInput(input);
  const run = runCheckpointValidation(executionInput);
  const boundedStatus = boundedStatusFor(run);
  return deepFreeze({
    run,
    sourceSnapshot,
    targetSnapshot,
    profile: profileReference(),
    boundedStatus,
    nativeValEngineInvocations: 1,
    semanticReviewerCalls: 0,
    repairCalls: 0,
    projectWrites: 0,
    humanDecisionBypassed: false,
    scientificQualificationClaimed: false,
  }) as ScientificOwnerChainValidationExecution;
};

export const replayScientificOwnerChainValidationProfile = (input: {
  previousRun: Readonly<ValidationRun>;
  observationInput: Readonly<ScientificOwnerChainValidationInput>;
}) => {
  const { executionInput } = buildExecutionInput(input.observationInput);
  return replayValidationRun(input.previousRun, executionInput);
};

const entryFor = <T>(ledger: Readonly<ProductOwnerResultLedger>, resultId: string, owner: string) => {
  const entry = ledger.entries.find((candidate) => candidate.result?.resultId === resultId && candidate.result.owner === owner);
  if (!entry?.result) throw new Error(`PRODUCT_${owner}_OWNER_RESULT_NOT_FOUND`);
  return entry as Readonly<ProductOwnerResultLedgerEntry<unknown, T>>;
};

export const validateScientificOwnerChainForProject = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ownerResultLedger: Readonly<ProductOwnerResultLedger>;
  validationLedger: Readonly<ProductValidationRunLedger>;
  knowledgeResultId: string;
  scientificThinkingResultId: string;
  imagingResultId: string;
  validationInvocationId: string;
  callerRef: string;
  purpose: string;
  completedAt: string;
  retainedAt?: string;
}): ProductScientificLoopValidationInvocation => {
  const projectBefore = stableStringify(input.project);
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("VAL_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  }
  const ownerResultLedger = rehydrateProductOwnerResultLedger(input.ownerResultLedger);
  const knowledgeEntry = entryFor<KnowledgeResult>(ownerResultLedger, input.knowledgeResultId, "KNOWLEDGE");
  const scientificThinkingEntry = entryFor<ScientificThinkingOutput>(ownerResultLedger, input.scientificThinkingResultId, "SCIENTIFIC_THINKING");
  const imagingEntry = entryFor<ImagingDesignResult>(ownerResultLedger, input.imagingResultId, "IMAGING");
  const observationInput: ScientificOwnerChainValidationInput = {
    validationInvocationId: input.validationInvocationId,
    projectSnapshot: input.projectSnapshot,
    knowledgeEntry,
    scientificThinkingEntry,
    imagingEntry,
    callerRef: input.callerRef,
    purpose: input.purpose,
    completedAt: input.completedAt,
  };
  const execution = executeScientificOwnerChainValidationProfile(observationInput);
  if (stableStringify(input.project) !== projectBefore || execution.run.projectWriteAuthorized !== false) {
    throw new Error("VAL_PRODUCT_PROJECT_WRITE_BOUNDARY_VIOLATED");
  }
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
    ownerResultRefs: [
      ownerResultRef(knowledgeEntry.result!),
      ownerResultRef(scientificThinkingEntry.result!),
      ownerResultRef(imagingEntry.result!),
    ],
    ownerResultLedgerDigest: ownerResultLedger.ledgerDigest,
    run: execution.run,
    boundedStatus: execution.boundedStatus,
  });
  return deepFreeze({
    ...execution,
    validationLedger: retained.ledger,
    validationEntry: retained.entry,
    ownerResultLedger,
    geminiCalls: 0,
    terraCalls: 0,
    externalEvidenceCalls: 0,
    obsRuntimeCalls: 0,
  }) as ProductScientificLoopValidationInvocation;
};
