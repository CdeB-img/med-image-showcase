import { uniqueSorted } from "@/features/knowledge-engine/canonical";
import {
  canonicalReference,
  createPlanningContribution,
  digestPlanningValue,
  planningProvenance,
  proposedChange,
} from "./contracts";
import type {
  CanonicalVariableDefinition,
  DataAnalysisPlanningContext,
  DataAnalysisPlanningContribution,
  DataNeedDefinition,
  ExpectedVariableOccasionDefinition,
  PlanningDecisionRequirement,
  PlanningReadiness,
  StudyDataPlanningPayload,
} from "./types";

export type StudyDataPlanningOptions = {
  units?: Record<string, string | null>;
  valueDomains?: Record<string, string | null>;
  plannedSources?: Record<string, string | null>;
  plannedMethods?: Record<string, string | null>;
  applicability?: Record<string, "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN">;
  qualityRequirements?: Record<string, string[]>;
};

const decision = (context: Readonly<DataAnalysisPlanningContext>, target: string, intent: string, reason: string, blockingLevel: PlanningDecisionRequirement["blockingLevel"]): PlanningDecisionRequirement => ({
  decisionRequirementId: `data-decision:${digestPlanningValue({ target, intent, project: context.projectRef })}`,
  target,
  questionIntent: intent,
  reason,
  affectedObjects: [target],
  affectedBranches: ["STUDY_DATA_PLAN", "DATA_MANAGEMENT_PLAN", "BIOSTATISTICS_PLAN", "DOCUMENT_PROJECTIONS"],
  blockingLevel,
  owner: "RESEARCH_PROJECT",
  evidence: [context.projectRef.objectId, context.projectRef.objectVersion],
  knownOptions: [],
  defaultOption: "NONE",
  provenance: planningProvenance(context.project, "RESEARCH_PROJECT", [target]),
});

export const collectStudyDataDecisionRequirements = (context: Readonly<DataAnalysisPlanningContext>, variables: ReadonlyArray<CanonicalVariableDefinition>): PlanningDecisionRequirement[] => variables.flatMap((variable) => [
  ...(variable.plannedSource ? [] : [decision(context, variable.variableRef.objectId, "DEFINE_PLANNED_SOURCE", "La source prévue reste inconnue.", "BLOCKING_FOR_DM_PLAN")]),
  ...(variable.plannedMethod ? [] : [decision(context, variable.variableRef.objectId, "DEFINE_PLANNED_METHOD", "La méthode prévue reste inconnue et ne peut pas être déduite.", "OPEN_DECISION_NON_BLOCKING")]),
  ...(variable.unit ? [] : [decision(context, variable.variableRef.objectId, "DEFINE_UNIT_OR_CONFIRM_NOT_APPLICABLE", "L’unité n’est pas renseignée.", "UNKNOWN_NON_BLOCKING")]),
  ...(variable.valueDomain ? [] : [decision(context, variable.variableRef.objectId, "DEFINE_VALUE_DOMAIN_OR_CONFIRM_NOT_APPLICABLE", "Le domaine de valeurs n’est pas renseigné.", "UNKNOWN_NON_BLOCKING")]),
]);

export const computeStudyDataPlanningReadiness = (
  variables: ReadonlyArray<CanonicalVariableDefinition>,
  occasions: ReadonlyArray<ExpectedVariableOccasionDefinition>,
  decisionsRequired: ReadonlyArray<PlanningDecisionRequirement>,
): PlanningReadiness => {
  const blockingItems = decisionsRequired.filter((item) => item.blockingLevel === "BLOCKING_FOR_DATA_PLAN").map((item) => item.reason);
  const warnings = decisionsRequired.filter((item) => item.blockingLevel !== "BLOCKING_FOR_DATA_PLAN").map((item) => item.reason);
  const unknownCount = variables.reduce((count, item) => count + [item.plannedSource, item.plannedMethod, item.unit, item.valueDomain].filter((value) => value === null).length, 0);
  const overallStatus: PlanningReadiness["overallStatus"] = !variables.length || blockingItems.length ? "BLOCKED" : decisionsRequired.length ? "READY_WITH_OPEN_DECISIONS" : "READY";
  return {
    overallStatus,
    domainStatuses: {
      canonicalVariables: variables.length ? "KNOWN" : "UNKNOWN",
      expectedOccasions: occasions.length ? "KNOWN" : "PARTIAL",
      sources: variables.every((item) => item.plannedSource) ? "KNOWN" : "PARTIAL",
      methods: variables.every((item) => item.plannedMethod) ? "KNOWN" : "PARTIAL",
      units: variables.every((item) => item.unit) ? "KNOWN" : "PARTIAL",
      valueDomains: variables.every((item) => item.valueDomain) ? "KNOWN" : "PARTIAL",
    },
    blockingCount: blockingItems.length,
    warningCount: warnings.length,
    unknownCount,
    blockingItems: uniqueSorted(blockingItems),
    warningItems: uniqueSorted(warnings),
    decisionsRequired: uniqueSorted(decisionsRequired.map((item) => item.decisionRequirementId)),
    limitations: ["Design-time uniquement : aucune VariableOccurrence ni valeur réalisée n’existe."],
  };
};

export const buildStudyDataPlanContribution = (
  context: Readonly<DataAnalysisPlanningContext>,
  options: Readonly<StudyDataPlanningOptions> = {},
): DataAnalysisPlanningContribution<StudyDataPlanningPayload> => {
  const project = context.project;
  const dataNeeds: DataNeedDefinition[] = project.variables.map((variable) => {
    const endpointRefs = context.endpointRefs.filter((endpoint) => project.endpointCandidates.some((candidate) => candidate.endpointId === endpoint.objectId && candidate.variableIds.includes(variable.variableId)));
    const dataNeedRef = canonicalReference(project, "DataNeed", `data-need:${digestPlanningValue({ variableId: variable.variableId, endpointRefs: endpointRefs.map((item) => item.objectId) })}`);
    return {
      dataNeedRef,
      label: `Donnée nécessaire pour ${variable.definition}`,
      objectiveRefs: context.objectiveRefs,
      endpointRefs,
      status: "CANDIDATE",
      provenance: planningProvenance(project, "RESEARCH_PROJECT", [variable.variableId, ...endpointRefs.map((item) => item.objectId)]),
    };
  });
  const canonicalVariables: CanonicalVariableDefinition[] = project.variables.map((variable) => {
    const variableRef = context.variableRefs.find((item) => item.objectId === variable.variableId)!;
    const measurementDefinitionRef = context.measurementDefinitionRefs.find((item) => item.objectId === variable.sourceRef) ?? null;
    return {
      variableRef,
      label: variable.definition,
      projectRole: variable.role,
      dataNeedRefs: dataNeeds.filter((item) => item.provenance.sourceRefs.includes(variable.variableId)).map((item) => item.dataNeedRef),
      observablePropertyRef: context.observablePropertyRefs[0] ?? null,
      measurementDefinitionRef,
      plannedSource: options.plannedSources?.[variable.variableId] ?? (variable.source === "USER_PROVIDED" ? "USER_DECLARED_SOURCE" : variable.source === "IMAGING" ? "IMAGING_SOURCE_PLANNED" : null),
      plannedMethod: options.plannedMethods?.[variable.variableId] ?? null,
      unit: options.units?.[variable.variableId] ?? null,
      valueDomain: options.valueDomains?.[variable.variableId] ?? null,
      applicability: options.applicability?.[variable.variableId] ?? "UNKNOWN",
      qualityRequirements: uniqueSorted(options.qualityRequirements?.[variable.variableId] ?? variable.qualityRequirements),
      knowledgeStatus: variable.knowledgeStatus,
      provenance: planningProvenance(project, "RESEARCH_PROJECT", [variable.variableId, variable.sourceRef], ["Le mapping ProjectVariable → CanonicalVariable est borné à DAI-001 et ne migre aucun objet historique."]),
    };
  });
  const expectedVariableOccasions: ExpectedVariableOccasionDefinition[] = project.variables.flatMap((variable) => variable.timingIds.map((timingId) => {
    const visit = project.visits.find((item) => item.visitId === timingId);
    const variableRef = context.variableRefs.find((item) => item.objectId === variable.variableId)!;
    return {
      occasionRef: canonicalReference(project, "ExpectedVariableOccasion", `${variable.variableId}@${timingId}`),
      variableRef,
      visitRef: canonicalReference(project, "Visit", timingId),
      temporalRole: visit?.temporalRole ?? "UNKNOWN",
      expectedTiming: visit?.timingValue ?? null,
      status: "EXPECTED_NOT_REALIZED",
      provenance: planningProvenance(project, "RESEARCH_PROJECT", [variable.variableId, timingId]),
    };
  }));
  const decisionsRequired = collectStudyDataDecisionRequirements(context, canonicalVariables);
  if (!dataNeeds.length) decisionsRequired.push(decision(context, context.projectRef.objectId, "DEFINE_DATA_NEEDS", "Aucun DataNeed ne peut être construit sans Variable Project.", "BLOCKING_FOR_DATA_PLAN"));
  const readiness = computeStudyDataPlanningReadiness(canonicalVariables, expectedVariableOccasions, decisionsRequired);
  const content: StudyDataPlanningPayload = {
    dataNeeds,
    canonicalVariables,
    expectedVariableOccasions,
    plannedSources: canonicalVariables.map((item) => ({ sourceId: `planned-source:${digestPlanningValue(item.variableRef)}`, variableRefs: [item.variableRef], value: item.plannedSource, status: item.plannedSource ? "KNOWN" : "UNKNOWN", provenance: item.provenance })),
    plannedMethods: canonicalVariables.map((item) => ({ methodId: `planned-method:${digestPlanningValue(item.variableRef)}`, variableRefs: [item.variableRef], measurementDefinitionRef: item.measurementDefinitionRef, value: item.plannedMethod, status: item.plannedMethod ? "KNOWN" : "UNKNOWN", provenance: item.provenance })),
    readiness,
    decisionsRequired,
    diagnostics: [],
  };
  const changes = [
    ...dataNeeds.map((item) => proposedChange({ operation: "PROPOSE_CREATE", objectKind: "DataNeed", objectId: item.dataNeedRef.objectId, sourceProjectVersion: context.projectRef.objectVersion, value: item, provenance: item.provenance })),
    ...canonicalVariables.map((item) => proposedChange({ operation: "PROPOSE_UPDATE", objectKind: "CanonicalVariable", objectId: item.variableRef.objectId, sourceProjectVersion: context.projectRef.objectVersion, value: item, provenance: item.provenance })),
    ...expectedVariableOccasions.map((item) => proposedChange({ operation: "PROPOSE_CREATE", objectKind: "ExpectedVariableOccasion", objectId: item.occasionRef.objectId, sourceProjectVersion: context.projectRef.objectVersion, value: item, provenance: item.provenance })),
  ];
  return createPlanningContribution({ type: "STUDY_DATA_PLAN", project, content, changes, owner: "RESEARCH_PROJECT", sourceRefs: [context.contextId, ...context.variableRefs.map((item) => item.objectId)], limitations: readiness.limitations });
};

export const analyzeDataPlanningImpact = (
  previous: Readonly<DataAnalysisPlanningContribution<StudyDataPlanningPayload>>,
  next: Readonly<DataAnalysisPlanningContribution<StudyDataPlanningPayload>>,
) => {
  const before = new Map(previous.content.canonicalVariables.map((item) => [item.variableRef.objectId, digestPlanningValue(item)]));
  const after = new Map(next.content.canonicalVariables.map((item) => [item.variableRef.objectId, digestPlanningValue(item)]));
  return uniqueSorted([...new Set([...before.keys(), ...after.keys()])]).map((objectRef) => ({
    objectRef,
    changeType: !before.has(objectRef) ? "ADDED" as const : !after.has(objectRef) ? "INVALIDATED" as const : before.get(objectRef) === after.get(objectRef) ? "UNCHANGED" as const : "REQUIRES_REVIEW" as const,
    affectedBranches: ["DATA_MANAGEMENT", "BIOSTATISTICS", "DOCUMENTS"],
    automaticallyApplied: false as const,
  }));
};
