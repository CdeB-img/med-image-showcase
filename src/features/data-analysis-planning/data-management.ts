import { uniqueSorted } from "@/features/knowledge-engine/canonical";
import {
  createPlanningContribution,
  digestPlanningValue,
  planningProvenance,
  proposedChange,
} from "./contracts";
import type {
  DataAnalysisPlanningContext,
  DataAnalysisPlanningContribution,
  DataCollectionFieldDefinition,
  DataManagementPlanningPayload,
  DataManagementPolicyDefinition,
  DatasetReleaseRequirement,
  LogicalDataProjection,
  PlanningDecisionRequirement,
  PlanningReadiness,
  StudyDataPlanningPayload,
} from "./types";

export type DataManagementPlanningOptions = {
  collectionStrategy?: string | null;
  sourceHandling?: string | null;
  projectedColumnNames?: Record<string, string | null>;
  structuralControls?: Record<string, string[]>;
  contextualControls?: Record<string, string[]>;
  policies?: Partial<Record<DataManagementPolicyDefinition["kind"], string | null>>;
  owners?: string[];
};

const policyKinds: DataManagementPolicyDefinition["kind"][] = ["QUERY", "CORRECTION", "RECONCILIATION", "TRANSFORMATION", "SNAPSHOT", "FREEZE", "LOCK", "RELEASE"];

const decision = (context: Readonly<DataAnalysisPlanningContext>, target: string, kind: string, reason: string, blockingLevel: PlanningDecisionRequirement["blockingLevel"]): PlanningDecisionRequirement => ({
  decisionRequirementId: `dm-decision:${digestPlanningValue({ target, kind, project: context.projectRef })}`,
  target,
  questionIntent: kind,
  reason,
  affectedObjects: [target],
  affectedBranches: ["DATA_MANAGEMENT_PLAN", "BIOSTATISTICS_PLAN", "DOCUMENT_PROJECTIONS"],
  blockingLevel,
  owner: "DATA_MANAGEMENT",
  evidence: [context.projectRef.objectId, context.projectRef.objectVersion],
  knownOptions: [],
  defaultOption: "NONE",
  provenance: planningProvenance(context.project, "DATA_MANAGEMENT", [target]),
});

export const collectDataManagementDecisionRequirements = (
  context: Readonly<DataAnalysisPlanningContext>,
  policies: ReadonlyArray<DataManagementPolicyDefinition>,
  collectionStrategy: string | null,
): PlanningDecisionRequirement[] => [
  ...(collectionStrategy ? [] : [decision(context, context.projectRef.objectId, "DEFINE_COLLECTION_STRATEGY", "La stratégie de collecte reste à définir.", "BLOCKING_FOR_DM_PLAN")]),
  ...policies.filter((item) => item.status === "UNKNOWN").map((item) => decision(context, item.policyId, `DEFINE_${item.kind}_POLICY_OR_NOT_APPLICABLE`, `La politique ${item.kind} reste inconnue.`, item.kind === "RELEASE" ? "BLOCKING_FOR_FUTURE_EXECUTION" : "OPEN_DECISION_NON_BLOCKING")),
];

export const computeDataManagementPlanningReadiness = (
  fields: ReadonlyArray<DataCollectionFieldDefinition>,
  policies: ReadonlyArray<DataManagementPolicyDefinition>,
  decisionsRequired: ReadonlyArray<PlanningDecisionRequirement>,
): PlanningReadiness => {
  const blockers = decisionsRequired.filter((item) => item.blockingLevel === "BLOCKING_FOR_DM_PLAN").map((item) => item.reason);
  const warnings = decisionsRequired.filter((item) => item.blockingLevel !== "BLOCKING_FOR_DM_PLAN").map((item) => item.reason);
  return {
    overallStatus: !fields.length || blockers.length ? "BLOCKED" : decisionsRequired.length ? "READY_WITH_OPEN_DECISIONS" : "READY",
    domainStatuses: {
      collectionSpecification: fields.length ? "KNOWN" : "UNKNOWN",
      controls: fields.some((item) => item.structuralControls.length || item.contextualControls.length) ? "PARTIAL" : "UNKNOWN",
      policies: policies.every((item) => item.status !== "UNKNOWN") ? "KNOWN" : "PARTIAL",
      realizedOperations: "NOT_APPLICABLE",
    },
    blockingCount: blockers.length,
    warningCount: warnings.length,
    unknownCount: policies.filter((item) => item.status === "UNKNOWN").length,
    blockingItems: uniqueSorted(blockers),
    warningItems: uniqueSorted(warnings),
    decisionsRequired: uniqueSorted(decisionsRequired.map((item) => item.decisionRequirementId)),
    limitations: ["Plan uniquement : aucune ingestion, query, correction, transformation, freeze, lock ou release n’est exécutée."],
  };
};

const logicalProjection = (
  context: Readonly<DataAnalysisPlanningContext>,
  type: LogicalDataProjection["projectionType"],
  fields: DataCollectionFieldDefinition[],
): LogicalDataProjection => ({
  projectionId: `${type.toLowerCase()}:${digestPlanningValue({ project: context.projectRef, fields: fields.map((item) => item.fieldDefinitionId) })}`,
  projectionType: type,
  projectionOnly: true,
  sourceOfTruth: false,
  projectWriteAuthorized: false,
  variableRefs: fields.map((item) => item.canonicalVariableRef),
  occasionRefs: fields.flatMap((item) => item.expectedOccasionRefs),
  fields,
  rows: fields.map((item) => ({ rowId: `${type.toLowerCase()}-row:${digestPlanningValue(item.canonicalVariableRef)}`, variableRef: item.canonicalVariableRef, occasionRefs: item.expectedOccasionRefs })),
  limitations: ["Projection logique de design-time ; aucune donnée réalisée ni formulaire exécutable."],
  provenance: planningProvenance(context.project, "DATA_MANAGEMENT", [context.projectRef.objectId, ...fields.map((item) => item.fieldDefinitionId)]),
});

export const buildDataManagementPlanningContribution = (
  context: Readonly<DataAnalysisPlanningContext>,
  studyData: Readonly<DataAnalysisPlanningContribution<StudyDataPlanningPayload>>,
  options: Readonly<DataManagementPlanningOptions> = {},
): DataAnalysisPlanningContribution<DataManagementPlanningPayload> => {
  const project = context.project;
  const fields: DataCollectionFieldDefinition[] = studyData.content.canonicalVariables.map((variable) => ({
    fieldDefinitionId: `collection-field:${digestPlanningValue({ variable: variable.variableRef, projectVersion: context.projectRef.objectVersion })}`,
    canonicalVariableRef: variable.variableRef,
    expectedOccasionRefs: studyData.content.expectedVariableOccasions.filter((item) => item.variableRef.objectId === variable.variableRef.objectId).map((item) => item.occasionRef),
    projectedLabel: variable.label,
    projectedColumnName: options.projectedColumnNames?.[variable.variableRef.objectId] ?? null,
    unit: variable.unit,
    valueDomain: variable.valueDomain,
    structuralControls: uniqueSorted(options.structuralControls?.[variable.variableRef.objectId] ?? []),
    contextualControls: uniqueSorted(options.contextualControls?.[variable.variableRef.objectId] ?? variable.qualityRequirements),
    provenance: planningProvenance(project, "DATA_MANAGEMENT", [variable.variableRef.objectId, ...variable.provenance.sourceRefs]),
  }));
  const policies: DataManagementPolicyDefinition[] = policyKinds.map((kind) => {
    const explicit = options.policies && Object.prototype.hasOwnProperty.call(options.policies, kind) ? options.policies[kind] ?? null : null;
    return {
      policyId: `dm-policy:${kind.toLowerCase()}:${digestPlanningValue(context.projectRef)}`,
      kind,
      status: explicit ? "KNOWN" : "UNKNOWN",
      definition: explicit,
      owner: "DATA_MANAGEMENT",
      provenance: planningProvenance(project, "DATA_MANAGEMENT", [context.projectRef.objectId]),
    };
  });
  const definitionProvenance = planningProvenance(project, "DATA_MANAGEMENT", [studyData.contributionId]);
  const definition = {
    definitionId: `data-management-definition:${digestPlanningValue({ project: context.projectRef, data: studyData.integrity.contentDigest })}`,
    version: "1.0.0",
    collectionStrategy: options.collectionStrategy ?? null,
    sourceHandling: options.sourceHandling ?? null,
    controls: fields.flatMap((field) => [
      ...field.structuralControls.map((value, index) => ({ controlId: `structural-control:${digestPlanningValue({ field: field.fieldDefinitionId, index, value })}`, kind: "STRUCTURAL" as const, definition: value, sourceRef: field.fieldDefinitionId })),
      ...field.contextualControls.map((value, index) => ({ controlId: `contextual-control:${digestPlanningValue({ field: field.fieldDefinitionId, index, value })}`, kind: "CONTEXTUAL" as const, definition: value, sourceRef: field.fieldDefinitionId })),
    ]),
    policies,
    owners: uniqueSorted(options.owners ?? ["DATA_MANAGEMENT"]),
    status: "CANDIDATE" as const,
    provenance: definitionProvenance,
  };
  const collectionSpecification = {
    specificationId: `data-collection-specification:${digestPlanningValue({ project: context.projectRef, fields: fields.map((item) => item.fieldDefinitionId) })}`,
    version: "1.0.0",
    fields,
    status: "CANDIDATE" as const,
    provenance: definitionProvenance,
  };
  const datasetReleaseRequirements: DatasetReleaseRequirement[] = project.analysisRequirements.map((analysis) => ({
    requirementId: `dataset-release-requirement:${digestPlanningValue({ analysis: analysis.requirementId, project: context.projectRef })}`,
    analysisRequirementRef: analysis.requirementId,
    canonicalVariableRefs: studyData.content.canonicalVariables.filter((item) => analysis.variableIds.includes(item.variableRef.objectId)).map((item) => item.variableRef),
    expectedOccasionRefs: studyData.content.expectedVariableOccasions.filter((item) => analysis.variableIds.includes(item.variableRef.objectId)).map((item) => item.occasionRef),
    qualityConditions: uniqueSorted(studyData.content.canonicalVariables.filter((item) => analysis.variableIds.includes(item.variableRef.objectId)).flatMap((item) => item.qualityRequirements)),
    openFindingsPolicy: null,
    freezeRequired: null,
    lockRequired: null,
    releaseStatus: "DESIGN_PHASE_ABSENT",
    blockingLevel: "DEFERRED_TO_REALIZED_TIME",
    provenance: planningProvenance(project, "DATA_MANAGEMENT", [analysis.requirementId, ...analysis.variableIds]),
  }));
  const decisionsRequired = collectDataManagementDecisionRequirements(context, policies, definition.collectionStrategy);
  const readiness = computeDataManagementPlanningReadiness(fields, policies, decisionsRequired);
  const content: DataManagementPlanningPayload = {
    definition,
    collectionSpecification,
    logicalCRF: logicalProjection(context, "LOGICAL_CRF", fields),
    logicalDataDictionary: logicalProjection(context, "LOGICAL_DATA_DICTIONARY", fields),
    logicalScheduleOfActivities: logicalProjection(context, "LOGICAL_SCHEDULE_OF_ACTIVITIES", fields),
    datasetReleaseRequirements,
    readiness,
    decisionsRequired,
    diagnostics: [],
  };
  const changes = [
    proposedChange({ operation: "PROPOSE_CREATE", objectKind: "DataManagementDefinition", objectId: definition.definitionId, sourceProjectVersion: context.projectRef.objectVersion, value: definition, provenance: definitionProvenance }),
    proposedChange({ operation: "PROPOSE_CREATE", objectKind: "DataCollectionSpecification", objectId: collectionSpecification.specificationId, sourceProjectVersion: context.projectRef.objectVersion, value: collectionSpecification, provenance: definitionProvenance }),
    ...policies.map((item) => proposedChange({ operation: "PROPOSE_CREATE", objectKind: "DataManagementPolicyDefinition", objectId: item.policyId, sourceProjectVersion: context.projectRef.objectVersion, value: item, provenance: item.provenance })),
    ...datasetReleaseRequirements.map((item) => proposedChange({ operation: "PROPOSE_CREATE", objectKind: "DatasetReleaseRequirement", objectId: item.requirementId, sourceProjectVersion: context.projectRef.objectVersion, value: item, provenance: item.provenance })),
  ];
  return createPlanningContribution({ type: "DATA_MANAGEMENT_PLAN", project, content, changes, owner: "DATA_MANAGEMENT", sourceRefs: [studyData.contributionId, context.contextId], limitations: readiness.limitations });
};

export const analyzeDataManagementPlanningImpact = (
  previous: Readonly<DataAnalysisPlanningContribution<DataManagementPlanningPayload>>,
  next: Readonly<DataAnalysisPlanningContribution<DataManagementPlanningPayload>>,
) => {
  const priorFields = new Map(previous.content.collectionSpecification.fields.map((item) => [item.canonicalVariableRef.objectId, digestPlanningValue(item)]));
  const nextFields = new Map(next.content.collectionSpecification.fields.map((item) => [item.canonicalVariableRef.objectId, digestPlanningValue(item)]));
  return uniqueSorted([...new Set([...priorFields.keys(), ...nextFields.keys()])]).map((objectRef) => ({
    objectRef,
    changeType: !priorFields.has(objectRef) ? "ADDED" as const : !nextFields.has(objectRef) ? "INVALIDATED" as const : priorFields.get(objectRef) === nextFields.get(objectRef) ? "UNCHANGED" as const : "REQUIRES_REVIEW" as const,
    affectedBranches: ["CRF", "DATA_DICTIONARY", "SCHEDULE_OF_ACTIVITIES", "BIOSTATISTICS", "DOCUMENTS"],
    automaticallyApplied: false as const,
  }));
};
