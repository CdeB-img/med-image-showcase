import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { ScientificThinkingOutput } from "@/features/scientific-thinking/types";
import type { ImagingDesignResult } from "@/features/imaging-study-designer/types";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type {
  BiostatisticsPlanningPayload,
  DataAnalysisPlanningContribution,
  DataManagementPlanningPayload,
  ProjectDataAnalysisView,
  StudyDataPlanningPayload,
} from "@/features/data-analysis-planning/types";
import type { StudyTemplateInstance } from "@/features/study-template/types";
import type { DocumentProjection } from "@/features/document-projection/types";
import { adaptDocumentProjection, adaptImagingDesignResult, adaptResearchProjectResult, adaptScientificThinkingOutput, adaptStudyTemplateInstance } from "./adapters";
import { validationDigest } from "./canonical";
import { finalizeValidationArtifactSnapshot } from "./product-canonical";
import type {
  ValidationArtifactAdapter,
  ValidationArtifactReference,
  ValidationArtifactSnapshot,
  ValidationProductArtifactType,
  ValidationSnapshotDecisionReference,
  ValidationSnapshotEpistemicState,
  ValidationSnapshotRelation,
  ValidationSnapshotSemanticObject,
} from "./product-contracts";
import type { ValidationArtifact } from "./types";

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort(compare);
const normalize = (value: string) => value.normalize("NFKC").replace(/[’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));

type ReferenceInput = Omit<ValidationArtifactReference, "immutableForRun" | "contentDigest" | "schemaVersion" | "projectId" | "projectVersion" | "contributionId" | "projectionId" | "provenanceRefs"> & Partial<Pick<ValidationArtifactReference, "contentDigest" | "schemaVersion" | "projectId" | "projectVersion" | "contributionId" | "projectionId" | "provenanceRefs">>;
const reference = (input: ReferenceInput): ValidationArtifactReference => ({
  ...input,
  contentDigest: input.contentDigest ?? null,
  schemaVersion: input.schemaVersion ?? null,
  projectId: input.projectId ?? null,
  projectVersion: input.projectVersion ?? null,
  contributionId: input.contributionId ?? null,
  projectionId: input.projectionId ?? null,
  provenanceRefs: unique(input.provenanceRefs ?? []),
  immutableForRun: true,
});

const object = (input: Partial<ValidationSnapshotSemanticObject> & Pick<ValidationSnapshotSemanticObject, "objectId" | "objectType" | "status" | "owner">): ValidationSnapshotSemanticObject => ({
  objectId: input.objectId,
  objectType: input.objectType,
  label: input.label ?? null,
  status: input.status,
  owner: input.owner,
  sourceRefs: unique(input.sourceRefs ?? []),
  provenanceRefs: unique(input.provenanceRefs ?? []),
  semanticKey: input.semanticKey ?? (input.label ? normalize(input.label) : null),
  polarity: input.polarity ?? null,
  role: input.role ?? null,
  attributes: { ...(input.attributes ?? {}) },
});

const relation = (input: Partial<ValidationSnapshotRelation> & Pick<ValidationSnapshotRelation, "relationId" | "sourceObjectId" | "targetObjectId" | "relationType" | "owner">): ValidationSnapshotRelation => ({
  relationId: input.relationId,
  sourceObjectId: input.sourceObjectId,
  targetObjectId: input.targetObjectId,
  relationType: input.relationType,
  polarity: input.polarity ?? null,
  status: input.status ?? "ACTIVE",
  owner: input.owner,
  sourceRefs: unique(input.sourceRefs ?? []),
  provenanceRefs: unique(input.provenanceRefs ?? []),
});

const snapshot = (input: {
  reference: ValidationArtifactReference;
  semanticObjects?: ValidationSnapshotSemanticObject[];
  relations?: ValidationSnapshotRelation[];
  epistemicStates?: ValidationSnapshotEpistemicState[];
  decisions?: ValidationSnapshotDecisionReference[];
  unknowns?: string[];
  contradictions?: string[];
  limitations?: string[];
  provenance?: string[];
  lineage?: string[];
  sourceReferences?: string[];
  metadata?: Record<string, unknown>;
}): ValidationArtifactSnapshot => finalizeValidationArtifactSnapshot({
  reference: input.reference,
  artifactKind: input.reference.artifactType,
  owner: input.reference.owner,
  semanticObjects: input.semanticObjects ?? [],
  relations: input.relations ?? [],
  epistemicStates: input.epistemicStates ?? [],
  decisions: input.decisions ?? [],
  unknowns: unique(input.unknowns ?? []),
  contradictions: unique(input.contradictions ?? []),
  limitations: unique(input.limitations ?? []),
  provenance: unique(input.provenance ?? []),
  lineage: unique(input.lineage ?? []),
  sourceReferences: unique(input.sourceReferences ?? []),
  projectionOnly: true,
  validationProjectionOnly: true,
  sourceOfTruth: false,
  projectWriteAuthorized: false,
  metadata: input.metadata ?? {},
});

const legacySnapshot = (legacy: ValidationArtifact, artifactType: ValidationProductArtifactType, referenceOverride?: Partial<ValidationArtifactReference>, metadata: Record<string, unknown> = {}) => {
  const ref = reference({
    artifactId: legacy.artifactId,
    artifactType,
    version: legacy.version,
    owner: legacy.owner,
    sourceOfTruth: artifactType === "RESEARCH_PROJECT",
    contentDigest: legacy.digest,
    provenanceRefs: legacy.sourceArtifactRefs,
    ...referenceOverride,
  });
  const decisions = legacy.elements.filter((item) => item.kind === "DECISION").map((item): ValidationSnapshotDecisionReference => ({ decisionId: item.ref, version: item.version ?? "UNKNOWN", status: item.status, actorPresent: false, mandatePresent: false, targetRefs: [...item.sourceRefs], provenanceRefs: [...item.provenanceRefs] }));
  return snapshot({
    reference: ref,
    semanticObjects: legacy.elements.filter((item) => item.kind !== "DECISION").map((item) => object({ objectId: item.ref, objectType: item.kind, label: item.semanticKey, status: item.status, owner: item.owner, sourceRefs: item.sourceRefs, provenanceRefs: item.provenanceRefs, semanticKey: item.semanticKey, attributes: item.version ? { version: item.version } : {} })),
    relations: legacy.relations.map((item) => relation({ relationId: item.ref, sourceObjectId: item.from, targetObjectId: item.to, relationType: item.relationType, owner: item.owner, sourceRefs: item.sourceRefs, provenanceRefs: item.provenanceRefs })),
    decisions,
    unknowns: legacy.elements.filter((item) => item.kind === "UNKNOWN").map((item) => item.semanticKey),
    contradictions: legacy.elements.filter((item) => item.kind === "CONTRADICTION").map((item) => item.semanticKey),
    provenance: legacy.elements.flatMap((item) => item.provenanceRefs),
    lineage: legacy.sourceArtifactRefs,
    sourceReferences: legacy.sourceArtifactRefs,
    metadata: { legacyValidationArtifactBoundary: legacy.boundary, ...metadata },
  });
};

export type OriginalRequestSource = { requestId: string; text: string; language: string; provenanceRefs: string[]; version?: string };

export const ORIGINAL_REQUEST_ADAPTER: ValidationArtifactAdapter<OriginalRequestSource> = {
  adapterId: "VAL-ADAPTER-ORIGINAL-REQUEST",
  adapterVersion: "1.0.0",
  artifactTypes: ["ORIGINAL_REQUEST"],
  accepts: (source): source is OriginalRequestSource => isRecord(source) && typeof source.requestId === "string" && typeof source.text === "string" && Array.isArray(source.provenanceRefs),
  buildReference: (source) => reference({ artifactId: source.requestId, artifactType: "ORIGINAL_REQUEST", version: source.version ?? "1.0.0", owner: "USER", sourceOfTruth: true, contentDigest: validationDigest({ text: source.text, language: source.language }), provenanceRefs: source.provenanceRefs }),
  buildSnapshot(source) { const ref = this.buildReference(source); return snapshot({ reference: ref, semanticObjects: [object({ objectId: source.requestId, objectType: "OriginalRequest", label: source.text, status: "EXPLICIT_USER_STATED", owner: "USER", provenanceRefs: source.provenanceRefs })], provenance: source.provenanceRefs, sourceReferences: source.provenanceRefs, metadata: { language: source.language } }); },
  collectApplicableInvariantRefs: () => ["AUDIT-D:CRITICAL_NEGATION_LOST", "AUDIT-D:CAUSALITY_ADDED_AGAINST_EXPLICIT_NEGATION", "AUDIT-D:EXPLICIT_SOURCE_NOT_GROUNDED", "VAL-C08"],
  collectProvenance: (source) => unique(source.provenanceRefs),
  collectLimitations: () => [],
};

const contributionItems = (contribution: ScientificInterpretationContributionEnvelope) => [
  ...contribution.scientificContent.explicitStatements,
  ...contribution.scientificContent.candidateObjects,
  ...contribution.scientificContent.inferredContext,
  ...contribution.scientificContent.contextualCandidates,
  ...contribution.scientificContent.negationsAndConstraints,
  ...contribution.scientificContent.temporalElements,
  ...contribution.scientificContent.ambiguities,
  ...contribution.scientificContent.unknowns,
  ...contribution.scientificContent.missingInformation,
  ...contribution.scientificContent.correctionsAndSupersessions,
  ...contribution.scientificContent.openDecisions,
  ...contribution.scientificContent.clarificationNeeds,
];

export const SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER: ValidationArtifactAdapter<ScientificInterpretationContributionEnvelope> = {
  adapterId: "VAL-ADAPTER-SCIENTIFIC-INTERPRETATION-CONTRIBUTION",
  adapterVersion: "1.0.0",
  artifactTypes: ["SCIENTIFIC_INTERPRETATION_CONTRIBUTION"],
  accepts: (source): source is ScientificInterpretationContributionEnvelope => isRecord(source) && source.contract === "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  buildReference: (source) => reference({ artifactId: source.identity.contributionId, artifactType: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION", version: source.identity.contractVersion, owner: "SCIENTIFIC_INTERPRETATION", sourceOfTruth: false, contentDigest: source.identity.contributionDigest, schemaVersion: source.identity.contractVersion, contributionId: source.identity.contributionId, projectId: null, provenanceRefs: source.source.sourceRefs }),
  buildSnapshot(source) {
    const ref = this.buildReference(source);
    const items = contributionItems(source);
    return snapshot({
      reference: ref,
      semanticObjects: items.map((item) => object({ objectId: item.itemId, objectType: item.proposedType ?? "UNCLASSIFIED_CANDIDATE", label: item.content, status: item.epistemicBoundary.adoptionStatus ?? item.epistemicBoundary.epistemicStatus ?? "UNKNOWN", owner: item.epistemicBoundary.ownership ?? "SCIENTIFIC_INTERPRETATION", sourceRefs: item.epistemicBoundary.sourceTurnIds, provenanceRefs: [...item.epistemicBoundary.sourceTurnIds, ...(item.evidenceRefs ?? [])], polarity: item.polarity, role: item.studyRole, attributes: { confidence: item.confidence, activeState: item.epistemicBoundary.activeState, originType: item.epistemicBoundary.originType ?? null, originStatus: item.epistemicBoundary.originStatus ?? null } })),
      relations: source.scientificContent.candidateRelations.map((item) => relation({ relationId: item.relationId, sourceObjectId: item.sourceItemId, targetObjectId: item.targetItemId, relationType: item.relationType, polarity: item.polarity, status: item.epistemicBoundary.activeState === false ? "INACTIVE" : "ACTIVE", owner: item.epistemicBoundary.ownership ?? "SCIENTIFIC_INTERPRETATION", sourceRefs: item.epistemicBoundary.sourceTurnIds, provenanceRefs: item.epistemicBoundary.sourceTurnIds })),
      epistemicStates: items.map((item) => ({ subjectId: item.itemId, epistemicStatus: item.epistemicBoundary.epistemicStatus, adoptionStatus: item.epistemicBoundary.adoptionStatus, activeState: item.epistemicBoundary.activeState, sourceRefs: [...item.epistemicBoundary.sourceTurnIds] })),
      unknowns: [...source.scientificContent.unknowns, ...source.scientificContent.missingInformation].map((item) => item.content),
      contradictions: source.scientificContent.openDecisions.filter((item) => item.proposedType === "CONTRADICTION").map((item) => item.content),
      limitations: source.runtimeEvidence.validationErrors.map((item) => `${item.failureClass}:${item.message}`),
      provenance: [...source.source.sourceRefs, ...source.source.turns.map((item) => item.turnId)],
      lineage: source.source.turns.map((item) => item.turnId),
      sourceReferences: source.source.sourceRefs,
      metadata: { runtimeId: source.identity.runtimeId, runtimeVersion: source.identity.runtimeVersion, technicalStatus: source.runtimeEvidence.technicalStatus, parseStatus: source.runtimeEvidence.parseStatus, auditFindingRefs: source.audit.unresolvedFindings.map((item) => item.findingId), humanDecisionEnvelopeRef: source.epistemicBoundary.humanDecisionEnvelopeRef },
    });
  },
  collectApplicableInvariantRefs: () => ["AUDIT-D:CRITICAL_NEGATION_LOST", "AUDIT-D:CAUSALITY_ADDED_AGAINST_EXPLICIT_NEGATION", "AUDIT-D:CANDIDATE_PROMOTED_TO_PROJECT", "AUDIT-D:LOCAL_PRACTICE_PROMOTED_TO_PROJECT", "AUDIT-D:REJECTED_OR_SUPERSEDED_STATE_ACTIVE", "AUDIT-D:SELF_RELATION", "AUDIT-D:EXPLICIT_SOURCE_NOT_GROUNDED", "VAL-C08"],
  collectProvenance: (source) => unique([...source.source.sourceRefs, ...source.source.turns.map((item) => item.turnId)]),
  collectLimitations: (source) => unique(source.runtimeEvidence.validationErrors.map((item) => `${item.failureClass}:${item.message}`)),
};

export const SCIENTIFIC_THINKING_ADAPTER: ValidationArtifactAdapter<ScientificThinkingOutput> = {
  adapterId: "VAL-ADAPTER-SCIENTIFIC-THINKING", adapterVersion: "2.0.0", artifactTypes: ["SCIENTIFIC_THINKING_RESULT"],
  accepts: (source): source is ScientificThinkingOutput => isRecord(source) && typeof source.outputId === "string" && Array.isArray(source.questions) && isRecord(source.handoff),
  buildReference: (source) => reference({ artifactId: source.outputId, artifactType: "SCIENTIFIC_THINKING_RESULT", version: source.contractVersion, owner: "ST-001", sourceOfTruth: false, contentDigest: source.outputDigest, provenanceRefs: source.provenance.sourceRefs }),
  buildSnapshot(source) { return legacySnapshot(adaptScientificThinkingOutput(source), "SCIENTIFIC_THINKING_RESULT", { provenanceRefs: source.provenance.sourceRefs }, { candidateNotice: source.candidateNotice }); },
  collectApplicableInvariantRefs: () => ["VAL-C08", "AUDIT-D:CANDIDATE_PROMOTED_TO_PROJECT"],
  collectProvenance: (source) => unique(source.provenance.sourceRefs), collectLimitations: (source) => unique(source.handoff.limitations),
};

export type ObservationHandoffSource = {
  artifactType: "OBSERVATION_HANDOFF";
  handoffId: string;
  version: string;
  digest: string;
  owner: "OBS-001";
  measurementDefinitions: Array<{ measurementDefinitionId: string; label: string; owner: string; observablePropertyRef: string | null; status: string; provenanceRefs: string[]; limitations: string[] }>;
  unknowns: string[];
  contradictions: string[];
  provenanceRefs: string[];
  limitations: string[];
};

export type ImagingOrObservationSource = ImagingDesignResult | ObservationHandoffSource;
const isObservationHandoff = (source: unknown): source is ObservationHandoffSource => isRecord(source) && source.artifactType === "OBSERVATION_HANDOFF" && typeof source.handoffId === "string";
const isImagingDesignResult = (source: unknown): source is ImagingDesignResult => isRecord(source) && typeof source.resultId === "string" && Array.isArray(source.acquisitionStrategies);

export const IMAGING_OR_OBSERVATION_ADAPTER: ValidationArtifactAdapter<ImagingOrObservationSource> = {
  adapterId: "VAL-ADAPTER-IMAGING-OR-OBSERVATION", adapterVersion: "2.0.0", artifactTypes: ["IMAGING_CONTRIBUTION", "OBSERVATION_HANDOFF"],
  accepts: (source): source is ImagingOrObservationSource => isObservationHandoff(source) || isImagingDesignResult(source),
  buildReference: (source) => {
    if (isObservationHandoff(source)) return reference({ artifactId: source.handoffId, artifactType: "OBSERVATION_HANDOFF", version: source.version, owner: source.owner, sourceOfTruth: false, contentDigest: source.digest, provenanceRefs: source.provenanceRefs });
    if (!isImagingDesignResult(source)) throw new Error("VAL_IMAGING_OR_OBSERVATION_ADAPTER_UNSUPPORTED_SOURCE");
    return reference({ artifactId: source.resultId, artifactType: "IMAGING_CONTRIBUTION", version: source.contractVersion, owner: "IMG-001", sourceOfTruth: false, contentDigest: source.resultDigest, provenanceRefs: source.provenance.sourceRefs });
  },
  buildSnapshot(source) {
    if (isImagingDesignResult(source)) return legacySnapshot(adaptImagingDesignResult(source), "IMAGING_CONTRIBUTION", {}, { obsRuntimeCreated: false });
    if (!isObservationHandoff(source)) throw new Error("VAL_IMAGING_OR_OBSERVATION_ADAPTER_UNSUPPORTED_SOURCE");
    const ref = this.buildReference(source);
    return snapshot({ reference: ref, semanticObjects: source.measurementDefinitions.map((item) => object({ objectId: item.measurementDefinitionId, objectType: "MeasurementDefinition", label: item.label, status: item.status, owner: item.owner, sourceRefs: item.observablePropertyRef ? [item.observablePropertyRef] : [], provenanceRefs: item.provenanceRefs, attributes: { observablePropertyRef: item.observablePropertyRef } })), unknowns: source.unknowns, contradictions: source.contradictions, limitations: [...source.limitations, ...source.measurementDefinitions.flatMap((item) => item.limitations)], provenance: source.provenanceRefs, sourceReferences: source.provenanceRefs, metadata: { obsRuntimeCreated: false } });
  },
  collectApplicableInvariantRefs: () => ["OBS:OBSERVABLE_PROPERTY_MEASUREMENT_DEFINITION_DISTINCT", "OBS:MEASUREMENT_DEFINITION_OWNERSHIP", "OBS:MEASURE_MEANING_PRESERVED", "OBS:QUALITY_COMPARABILITY_PRESERVED", "VAL-C08"],
  collectProvenance: (source) => isObservationHandoff(source) ? unique(source.provenanceRefs) : isImagingDesignResult(source) ? unique(source.provenance.sourceRefs) : [],
  collectLimitations: (source) => isObservationHandoff(source) ? unique(source.limitations) : isImagingDesignResult(source) ? unique(source.limitations) : [],
};

const adoptedProjectStatus = (status: string) => ["ADOPTED", "APPROVED", "HUMAN_CONFIRMED", "KNOWN", "FROZEN_BY_HUMAN"].includes(status);
export const RESEARCH_PROJECT_ADAPTER: ValidationArtifactAdapter<ResearchProjectDesignResult> = {
  adapterId: "VAL-ADAPTER-RESEARCH-PROJECT", adapterVersion: "2.0.0", artifactTypes: ["RESEARCH_PROJECT"],
  accepts: (source): source is ResearchProjectDesignResult => isRecord(source) && typeof source.resultId === "string" && isRecord(source.candidateVersion) && isRecord(source.documentHandoff),
  buildReference: (source) => reference({ artifactId: source.resultId, artifactType: "RESEARCH_PROJECT", version: source.contractVersion, owner: "RESEARCH_PROJECT", sourceOfTruth: true, contentDigest: source.resultDigest, projectId: source.documentHandoff.projectId, projectVersion: source.candidateVersion.versionId, provenanceRefs: source.provenance.sourceRefs }),
  buildSnapshot(source) {
    const legacy = adaptResearchProjectResult(source);
    const filtered = { ...legacy, elements: legacy.elements.filter((item) => item.kind !== "PROJECT_OBJECT" || adoptedProjectStatus(item.status)) };
    return legacySnapshot(filtered, "RESEARCH_PROJECT", { projectId: source.documentHandoff.projectId, projectVersion: source.candidateVersion.versionId, sourceOfTruth: true }, { projectStateOnly: true, candidateVersionStatus: source.candidateVersion.status });
  },
  collectApplicableInvariantRefs: () => ["VAL-C09", "PROJECT:HUMAN_DECISION_REQUIRED", "PROJECT:VERSION_CONTINUITY", "PROJECT:STALE_CONTRIBUTION_REJECTED", "PROJECT:ATOMIC_ADOPTION", "PROJECT:FROZEN_VERSION_IMMUTABLE", "VAL-C08"],
  collectProvenance: (source) => unique(source.provenance.sourceRefs), collectLimitations: (source) => unique(source.limitations),
};

const contributionReference = (source: DataAnalysisPlanningContribution, artifactType: ValidationProductArtifactType) => reference({ artifactId: source.contributionId, artifactType, version: source.contributionVersion, owner: source.governance.owner, sourceOfTruth: false, contentDigest: source.integrity.contributionDigest, schemaVersion: source.envelopeVersion, projectId: source.sourceProjectId, projectVersion: source.sourceProjectVersion, contributionId: source.contributionId, provenanceRefs: source.provenance.sourceRefs });
const planningBase = (source: DataAnalysisPlanningContribution, artifactType: ValidationProductArtifactType, semanticObjects: ValidationSnapshotSemanticObject[], relations: ValidationSnapshotRelation[], metadata: Record<string, unknown>) => snapshot({ reference: contributionReference(source, artifactType), semanticObjects, relations, unknowns: source.content.readiness.blockingItems, limitations: source.provenance.limitations, provenance: source.provenance.sourceRefs, lineage: [source.sourceProjectId, source.sourceProjectVersion], sourceReferences: source.provenance.sourceRefs, metadata: { ...metadata, contributionType: source.contributionType, realizedTimeAuthorized: source.governance.realizedTimeAuthorized, projectWriteAuthorized: source.governance.projectWriteAuthorized } });

export const STUDY_DATA_PLAN_ADAPTER: ValidationArtifactAdapter<DataAnalysisPlanningContribution<StudyDataPlanningPayload>> = {
  adapterId: "VAL-ADAPTER-STUDY-DATA-PLAN", adapterVersion: "1.0.0", artifactTypes: ["STUDY_DATA_PLAN_CONTRIBUTION"],
  accepts: (source): source is DataAnalysisPlanningContribution<StudyDataPlanningPayload> => isRecord(source) && source.contributionType === "STUDY_DATA_PLAN",
  buildReference: (source) => contributionReference(source, "STUDY_DATA_PLAN_CONTRIBUTION"),
  buildSnapshot(source) {
    const content = source.content;
    const objects = [
      ...content.dataNeeds.map((item) => object({ objectId: item.dataNeedRef.objectId, objectType: "DataNeed", label: item.label, status: item.status, owner: item.dataNeedRef.owner, sourceRefs: [...item.objectiveRefs, ...item.endpointRefs].map((ref) => ref.objectId), provenanceRefs: item.provenance.sourceRefs })),
      ...content.canonicalVariables.map((item) => object({ objectId: item.variableRef.objectId, objectType: "CanonicalVariable", label: item.label, status: item.knowledgeStatus, owner: item.variableRef.owner, sourceRefs: [...item.dataNeedRefs.map((ref) => ref.objectId), item.observablePropertyRef?.objectId ?? "", item.measurementDefinitionRef?.objectId ?? ""], provenanceRefs: item.provenance.sourceRefs, role: item.projectRole, attributes: { plannedSource: item.plannedSource, plannedMethod: item.plannedMethod, unit: item.unit, valueDomain: item.valueDomain, applicability: item.applicability } })),
      ...content.expectedVariableOccasions.map((item) => object({ objectId: item.occasionRef.objectId, objectType: "ExpectedVariableOccasion", label: item.expectedTiming, status: item.status, owner: item.occasionRef.owner, sourceRefs: [item.variableRef.objectId, item.visitRef.objectId], provenanceRefs: item.provenance.sourceRefs, role: item.temporalRole })),
    ];
    const relations = content.expectedVariableOccasions.map((item) => relation({ relationId: `${item.occasionRef.objectId}:expects:${item.variableRef.objectId}`, sourceObjectId: item.occasionRef.objectId, targetObjectId: item.variableRef.objectId, relationType: "EXPECTED_FOR_VARIABLE", owner: "CDM-001", sourceRefs: [item.visitRef.objectId], provenanceRefs: item.provenance.sourceRefs }));
    return planningBase(source, "STUDY_DATA_PLAN_CONTRIBUTION", objects, relations, { realizedObjectKinds: [], expectedOnly: true });
  },
  collectApplicableInvariantRefs: () => ["CDM-C01", "CDM:EXPECTED_OCCURRENCE_DISTINCT", "CDM:FACTUAL_MISSINGNESS_PRESERVED", "CDM:PROVENANCE_LINEAGE_PRESERVED", "VAL-C09"],
  collectProvenance: (source) => unique(source.provenance.sourceRefs), collectLimitations: (source) => unique(source.provenance.limitations),
};

export const DATA_MANAGEMENT_PLAN_ADAPTER: ValidationArtifactAdapter<DataAnalysisPlanningContribution<DataManagementPlanningPayload>> = {
  adapterId: "VAL-ADAPTER-DATA-MANAGEMENT-PLAN", adapterVersion: "1.0.0", artifactTypes: ["DATA_MANAGEMENT_PLANNING_CONTRIBUTION"],
  accepts: (source): source is DataAnalysisPlanningContribution<DataManagementPlanningPayload> => isRecord(source) && source.contributionType === "DATA_MANAGEMENT_PLAN",
  buildReference: (source) => contributionReference(source, "DATA_MANAGEMENT_PLANNING_CONTRIBUTION"),
  buildSnapshot(source) {
    const content = source.content;
    const objects = [
      object({ objectId: content.definition.definitionId, objectType: "DataManagementDefinition", label: content.definition.collectionStrategy, status: content.definition.status, owner: content.definition.provenance.owner, provenanceRefs: content.definition.provenance.sourceRefs }),
      ...content.collectionSpecification.fields.map((item) => object({ objectId: item.fieldDefinitionId, objectType: "DataCollectionFieldProjection", label: item.projectedLabel, status: "DESIGN_TIME", owner: "DM-001", sourceRefs: [item.canonicalVariableRef.objectId, ...item.expectedOccasionRefs.map((ref) => ref.objectId)], provenanceRefs: item.provenance.sourceRefs, attributes: { projectedColumnName: item.projectedColumnName, unit: item.unit, valueDomain: item.valueDomain } })),
      ...content.definition.policies.map((item) => object({ objectId: item.policyId, objectType: `DataManagementPolicy:${item.kind}`, label: item.definition, status: item.status, owner: item.owner, provenanceRefs: item.provenance.sourceRefs })),
      ...content.datasetReleaseRequirements.map((item) => object({ objectId: item.requirementId, objectType: "DatasetReleaseRequirement", label: item.analysisRequirementRef, status: item.releaseStatus, owner: "DM-001", sourceRefs: [...item.canonicalVariableRefs.map((ref) => ref.objectId), ...item.expectedOccasionRefs.map((ref) => ref.objectId)], provenanceRefs: item.provenance.sourceRefs, attributes: { blockingLevel: item.blockingLevel } })),
    ];
    return planningBase(source, "DATA_MANAGEMENT_PLANNING_CONTRIBUTION", objects, [], { designTimeOnly: true, realizedOperations: "DEFERRED_TO_REALIZED_TIME", projections: [content.logicalCRF.projectionType, content.logicalDataDictionary.projectionType, content.logicalScheduleOfActivities.projectionType] });
  },
  collectApplicableInvariantRefs: () => ["CDM-C01", "CDM:EXPECTED_OCCURRENCE_DISTINCT", "DM:PLANNED_REALIZED_DISTINCT", "DM:QUERY_CORRECTION_DISTINCT", "DM:NO_IMPUTATION_EXECUTION", "DM:RELEASE_REQUIREMENT_IS_PROJECTION", "DM:NO_SCIENTIFIC_REDEFINITION", "VAL-C09"],
  collectProvenance: (source) => unique(source.provenance.sourceRefs), collectLimitations: (source) => unique(source.provenance.limitations),
};

export const BIOSTATISTICS_PLAN_ADAPTER: ValidationArtifactAdapter<DataAnalysisPlanningContribution<BiostatisticsPlanningPayload>> = {
  adapterId: "VAL-ADAPTER-BIOSTATISTICS-PLAN", adapterVersion: "1.0.0", artifactTypes: ["BIOSTATISTICS_PLANNING_CONTRIBUTION"],
  accepts: (source): source is DataAnalysisPlanningContribution<BiostatisticsPlanningPayload> => isRecord(source) && source.contributionType === "BIOSTATISTICS_PLAN",
  buildReference: (source) => contributionReference(source, "BIOSTATISTICS_PLANNING_CONTRIBUTION"),
  buildSnapshot(source) {
    const content = source.content;
    const objects = content.analysisSpecifications.flatMap((specification) => [
      object({ objectId: specification.analysisSpecificationId, objectType: "AnalysisSpecification", label: specification.purpose, status: specification.status, owner: "BIOSTATISTICS-001", sourceRefs: [...specification.objectiveRefs, ...specification.hypothesisRefs, ...specification.endpointRefs, ...specification.targetVariableRefs].map((ref) => ref.objectId), provenanceRefs: specification.provenance.sourceRefs, role: specification.role }),
      ...(specification.estimand ? [object({ objectId: specification.estimand.estimandId, objectType: "Estimand", label: specification.estimand.summaryMeasure, status: specification.estimand.status, owner: "BIOSTATISTICS-001", sourceRefs: [specification.estimand.endpointRef?.objectId ?? "", ...specification.estimand.variableRefs.map((ref) => ref.objectId)], provenanceRefs: specification.estimand.provenance.sourceRefs, attributes: { contrast: specification.estimand.contrast } })] : []),
      object({ objectId: specification.method.methodDefinitionId, objectType: "StatisticalMethodDefinition", label: specification.method.model ?? specification.method.methodFamily, status: specification.method.status, owner: "BIOSTATISTICS-001", sourceRefs: [specification.analysisSpecificationId], provenanceRefs: specification.method.provenance.sourceRefs, attributes: { source: specification.method.source } }),
      ...(specification.population ? [object({ objectId: specification.population.populationDefinitionId, objectType: "AnalysisPopulation", label: specification.population.inclusionRule, status: specification.population.status, owner: "BIOSTATISTICS-001", sourceRefs: [specification.population.projectPopulationRef.objectId], provenanceRefs: specification.population.provenance.sourceRefs, attributes: { mutatesProjectPopulation: specification.population.mutatesProjectPopulation } })] : []),
      ...specification.variableRoles.map((item) => object({ objectId: item.assignmentId, objectType: "AnalysisVariableRole", label: item.role, status: "ASSIGNED", owner: "BIOSTATISTICS-001", sourceRefs: [item.variableRef.objectId, item.analysisSpecificationRef], provenanceRefs: item.provenance.sourceRefs, role: item.role })),
      ...specification.sensitivityAnalyses.map((item) => object({ objectId: item.sensitivityId, objectType: "SensitivityAnalysis", label: item.fragilityTested, status: item.status, owner: "BIOSTATISTICS-001", sourceRefs: [item.primaryAnalysisSpecificationRef], provenanceRefs: item.provenance.sourceRefs, role: item.role })),
    ]);
    objects.push(...[content.logicalAnalysisPlan, content.logicalSAP, content.logicalStatisticalMethods, content.logicalExpectedOutputCatalog].map((item) => object({ objectId: item.projectionId, objectType: item.projectionType, label: item.reason, status: item.status, owner: "BIOSTATISTICS-001", sourceRefs: [...item.analysisSpecificationRefs, ...item.canonicalVariableRefs.map((ref) => ref.objectId)], provenanceRefs: item.provenance.sourceRefs, attributes: { projectionOnly: item.projectionOnly, sourceOfTruth: item.sourceOfTruth, projectWriteAuthorized: item.projectWriteAuthorized, missingObjects: item.missingObjects } })));
    return planningBase(source, "BIOSTATISTICS_PLANNING_CONTRIBUTION", objects, [], { calculatedSampleSize: content.dimensionnement.calculatedSampleSize, analysisExecution: "NOT_APPLICABLE", analysisResult: "NOT_APPLICABLE" });
  },
  collectApplicableInvariantRefs: () => ["BIO-C10", "BIO:ESTIMAND_MODEL_DISTINCT", "BIO:VARIABLE_ANALYTICAL_ROLE_DISTINCT", "BIO:ANALYSIS_PROJECT_POPULATION_DISTINCT", "BIO:FACTUAL_ANALYTICAL_MISSINGNESS_DISTINCT", "BIO:SENSITIVITY_PRIMARY_DISTINCT", "BIO:POST_HOC_STATUS_PRESERVED", "BIO:NO_UNSOURCED_DIMENSIONING_ASSUMPTION", "CDM-C01", "VAL-C09"],
  collectProvenance: (source) => unique(source.provenance.sourceRefs), collectLimitations: (source) => unique(source.provenance.limitations),
};

export const TEMPLATE_INSTANCE_ADAPTER: ValidationArtifactAdapter<StudyTemplateInstance> = {
  adapterId: "VAL-ADAPTER-TEMPLATE-INSTANCE", adapterVersion: "2.0.0", artifactTypes: ["TEMPLATE_INSTANCE"],
  accepts: (source): source is StudyTemplateInstance => isRecord(source) && typeof source.instanceId === "string" && Array.isArray(source.nodes) && isRecord(source.inputRefs),
  buildReference: (source) => reference({ artifactId: source.instanceId, artifactType: "TEMPLATE_INSTANCE", version: source.contractVersion, owner: "TMP-001", sourceOfTruth: false, contentDigest: source.digest, schemaVersion: source.contractVersion, projectId: source.inputRefs.researchProjectId, projectVersion: source.inputRefs.researchProjectVersion, provenanceRefs: source.provenance }),
  buildSnapshot(source) { return legacySnapshot(adaptStudyTemplateInstance(source), "TEMPLATE_INSTANCE", { projectId: source.inputRefs.researchProjectId, projectVersion: source.inputRefs.researchProjectVersion }, { inputRefs: source.inputRefs, readiness: source.readinessGraph.overall }); },
  collectApplicableInvariantRefs: () => ["VAL-C09", "VAL-C12", "CDM:PROVENANCE_LINEAGE_PRESERVED", "DOC:NOT_GENERATABLE_PRESERVED"],
  collectProvenance: (source) => unique(source.provenance), collectLimitations: (source) => unique(source.limitations.map((item) => item.reason)),
};

export const DOCUMENT_PROJECTION_ADAPTER: ValidationArtifactAdapter<DocumentProjection> = {
  adapterId: "VAL-ADAPTER-DOCUMENT-PROJECTION", adapterVersion: "2.0.0", artifactTypes: ["DOCUMENT_PROJECTION"],
  accepts: (source): source is DocumentProjection => isRecord(source) && typeof source.projectionId === "string" && Array.isArray(source.sections) && isRecord(source.source),
  buildReference: (source) => reference({ artifactId: source.projectionId, artifactType: "DOCUMENT_PROJECTION", version: source.contractVersion, owner: "DOC-001", sourceOfTruth: false, contentDigest: source.projectionDigest, projectId: source.source.projectId, projectVersion: source.source.projectVersion, projectionId: source.projectionId, provenanceRefs: source.provenanceRefs }),
  buildSnapshot(source) { return legacySnapshot(adaptDocumentProjection(source), "DOCUMENT_PROJECTION", { projectId: source.source.projectId, projectVersion: source.source.projectVersion, projectionId: source.projectionId }, { projectionType: source.projectionType, sectionStatuses: source.sections.map((item) => ({ sectionId: item.sectionId, status: item.status })) }); },
  collectApplicableInvariantRefs: () => ["VAL-C09", "VAL-C12", "VAL-C13", "DOC:SOURCE_REFERENCES_PRESERVED", "DOC:NOT_GENERATABLE_PRESERVED", "DOC:NO_WRITE_BACK"],
  collectProvenance: (source) => unique(source.provenanceRefs), collectLimitations: (source) => unique(source.limitations),
};

export const PROJECT_DATA_ANALYSIS_VIEW_ADAPTER: ValidationArtifactAdapter<ProjectDataAnalysisView> = {
  adapterId: "VAL-ADAPTER-PROJECT-DATA-ANALYSIS-VIEW", adapterVersion: "1.0.0", artifactTypes: ["PROJECT_DATA_ANALYSIS_VIEW"],
  accepts: (source): source is ProjectDataAnalysisView => isRecord(source) && typeof source.projectionId === "string" && source.projectionOnly === true && source.sourceOfTruth === false,
  buildReference: (source) => reference({ artifactId: source.projectionId, artifactType: "PROJECT_DATA_ANALYSIS_VIEW", version: source.projectVersion, owner: "PRODUCT_VIEW", sourceOfTruth: false, contentDigest: validationDigest({ project: source.projectRef, contributions: source.contributionRefs, readiness: source.readiness }), projectId: source.projectRef.objectId, projectVersion: source.projectVersion, projectionId: source.projectionId, provenanceRefs: source.contributionRefs.map((item) => item.contributionId) }),
  buildSnapshot(source) {
    const ref = this.buildReference(source);
    return snapshot({ reference: ref, semanticObjects: source.contributionRefs.flatMap((item) => item.adoptedTargetIds.map((targetId) => object({ objectId: targetId, objectType: "AdoptedProjectObjectReference", status: "ADOPTED", owner: "RESEARCH_PROJECT", sourceRefs: [item.contributionId], provenanceRefs: [item.contributionDigest] }))), decisions: source.decisions.map((item) => ({ decisionId: item.decisionId, version: String(item.version), status: item.status, actorPresent: Boolean(item.actor), mandatePresent: Boolean(item.mandate), targetRefs: [...item.targets], provenanceRefs: [...item.provenance] })), unknowns: source.unknowns, limitations: source.limitations, provenance: source.contributionRefs.flatMap((item) => [item.contributionId, item.contributionDigest]), lineage: [source.projectRef.objectId, source.projectVersion], sourceReferences: [source.projectRef.objectId], metadata: { readiness: source.readiness, projectionOnly: source.projectionOnly, sourceOfTruth: source.sourceOfTruth } });
  },
  collectApplicableInvariantRefs: () => ["VAL-C09", "PROJECT:VERSION_CONTINUITY", "PROJECT:HUMAN_DECISION_REQUIRED", "DOC:NOT_GENERATABLE_PRESERVED", "DOC:NO_WRITE_BACK"],
  collectProvenance: (source) => unique(source.contributionRefs.flatMap((item) => [item.contributionId, item.contributionDigest])), collectLimitations: (source) => unique(source.limitations),
};

export const VALIDATION_ARTIFACT_ADAPTERS = Object.freeze([
  ORIGINAL_REQUEST_ADAPTER,
  SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ADAPTER,
  SCIENTIFIC_THINKING_ADAPTER,
  IMAGING_OR_OBSERVATION_ADAPTER,
  RESEARCH_PROJECT_ADAPTER,
  STUDY_DATA_PLAN_ADAPTER,
  DATA_MANAGEMENT_PLAN_ADAPTER,
  BIOSTATISTICS_PLAN_ADAPTER,
  TEMPLATE_INSTANCE_ADAPTER,
  DOCUMENT_PROJECTION_ADAPTER,
  PROJECT_DATA_ANALYSIS_VIEW_ADAPTER,
]);

export const findValidationArtifactAdapter = (source: unknown) => VALIDATION_ARTIFACT_ADAPTERS.find((adapter) => adapter.accepts(source)) ?? null;
