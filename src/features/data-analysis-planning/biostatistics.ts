import { uniqueSorted } from "@/features/knowledge-engine/canonical";
import {
  createPlanningContribution,
  digestPlanningValue,
  planningProvenance,
  proposedChange,
} from "./contracts";
import type {
  AnalysisSpecification,
  BiostatisticsPlanningPayload,
  DataAnalysisPlanningContext,
  DataAnalysisPlanningContribution,
  DataManagementPlanningPayload,
  DimensioningAssumption,
  ExpectedAnalysisOutput,
  LogicalAnalysisProjection,
  PlanningDecisionRequirement,
  PlanningDiagnostic,
  PlanningReadiness,
  StudyDataPlanningPayload,
} from "./types";

export type ExplicitEstimandInput = {
  contrast?: string | null;
  summaryMeasure?: string | null;
  endpointId?: string | null;
  variableIds: string[];
};

export type BiostatisticsPlanningOptions = {
  roles?: Record<string, AnalysisSpecification["role"]>;
  estimands?: Record<string, ExplicitEstimandInput>;
  methods?: Record<string, { methodFamily: string; model?: string | null; source: "PROJECT_DECISION" | "HUMAN_CONTRIBUTION" | "EXISTING_SPECIFICATION" }>;
  populationRules?: Record<string, { inclusionRule?: string | null; exclusionRule?: string | null }>;
  assumptions?: Record<string, Array<{ category: string; statement: string; sourceRef: string }>>;
  diagnostics?: Record<string, Array<{ purpose: string; definition: string }>>;
  missingDataStrategies?: Record<string, string>;
  intercurrentEvents?: Record<string, Array<{ event: string; strategy: string }>>;
  multiplicity?: Record<string, { applicable: boolean; procedure?: string | null; alpha?: number | null; hypothesisFamilyRefs?: string[] }>;
  sensitivities?: Array<{ primaryAnalysisRequirementId: string; fragilityTested: string; changedElements: string[]; constantElements: string[] }>;
  dimensioningAssumptions?: DimensioningAssumption[];
  expectedOutputs?: Record<string, Array<{ role: string; target: string; outputType: ExpectedAnalysisOutput["outputType"] }>>;
};

const diagnostic = (code: string, message: string, refs: string[], severity: PlanningDiagnostic["severity"] = "ERROR"): PlanningDiagnostic => ({
  code,
  severity,
  message,
  targetRefs: refs,
  owner: "BIOSTATISTICS",
  blockingLevel: severity === "ERROR" ? "BLOCKING_FOR_ANALYSIS_PLAN" : "UNKNOWN_NON_BLOCKING",
  autoFixed: false,
});

const decision = (context: Readonly<DataAnalysisPlanningContext>, analysisRef: string, intent: string, reason: string, blockingLevel: PlanningDecisionRequirement["blockingLevel"]): PlanningDecisionRequirement => ({
  decisionRequirementId: `bio-decision:${digestPlanningValue({ analysisRef, intent, project: context.projectRef })}`,
  target: analysisRef,
  questionIntent: intent,
  reason,
  affectedObjects: [analysisRef],
  affectedBranches: ["BIOSTATISTICS_PLAN", "DIMENSIONNEMENT", "SAP", "STATISTICAL_METHODS"],
  blockingLevel,
  owner: "BIOSTATISTICS_AND_HUMAN",
  evidence: [context.projectRef.objectId, context.projectRef.objectVersion],
  knownOptions: [],
  defaultOption: "NONE",
  provenance: planningProvenance(context.project, "BIOSTATISTICS", [analysisRef]),
});

const analysisId = (context: Readonly<DataAnalysisPlanningContext>, requirementId: string) => `analysis-specification:${digestPlanningValue({ project: context.projectRef, requirementId })}`;

export const collectBiostatisticsDecisionRequirements = (
  context: Readonly<DataAnalysisPlanningContext>,
  specifications: ReadonlyArray<AnalysisSpecification>,
): PlanningDecisionRequirement[] => specifications.flatMap((spec) => [
  ...(spec.role === "UNDECIDED" ? [decision(context, spec.analysisSpecificationId, "DEFINE_ANALYSIS_ROLE", "Le rôle de l’analyse n’est pas adopté.", "OPEN_DECISION_NON_BLOCKING")] : []),
  ...(!spec.estimand ? [decision(context, spec.analysisSpecificationId, "DEFINE_ESTIMAND_OR_CONFIRM_NOT_APPLICABLE", "L’estimand reste inconnu.", spec.role === "PRIMARY" ? "BLOCKING_FOR_PRIMARY_ANALYSIS" : "OPEN_DECISION_NON_BLOCKING")] : []),
  ...(spec.method.status === "UNKNOWN" ? [decision(context, spec.analysisSpecificationId, "DEFINE_STATISTICAL_METHOD", "La méthode statistique ne peut pas être déduite du type de Variable ou du design.", spec.role === "PRIMARY" ? "BLOCKING_FOR_PRIMARY_ANALYSIS" : "OPEN_DECISION_NON_BLOCKING")] : []),
  ...(spec.missingDataStrategy.status === "UNKNOWN" ? [decision(context, spec.analysisSpecificationId, "DEFINE_MISSING_DATA_STRATEGY_OR_CONFIRM_NOT_APPLICABLE", "La stratégie analytique du missingness reste distincte du missingness factuel et doit être décidée.", "OPEN_DECISION_NON_BLOCKING")] : []),
  ...(spec.multiplicity.status === "UNKNOWN" ? [decision(context, spec.analysisSpecificationId, "ASSESS_MULTIPLICITY_APPLICABILITY", "L’applicabilité de la multiplicité n’est pas décidée.", "OPEN_DECISION_NON_BLOCKING")] : []),
]);

export const computeBiostatisticsPlanningReadiness = (
  specifications: ReadonlyArray<AnalysisSpecification>,
  decisionsRequired: ReadonlyArray<PlanningDecisionRequirement>,
  dimensioningReadiness: "NOT_DEFINED" | "INCOMPLETE" | "READY_FOR_CALCULATION",
): PlanningReadiness => {
  const blockers = decisionsRequired.filter((item) => item.blockingLevel.startsWith("BLOCKING_FOR_")).map((item) => item.reason);
  const warnings = decisionsRequired.filter((item) => !item.blockingLevel.startsWith("BLOCKING_FOR_")).map((item) => item.reason);
  const unknownCount = specifications.reduce((count, item) => count + [item.role === "UNDECIDED", item.estimand === null, item.method.status === "UNKNOWN", item.missingDataStrategy.status === "UNKNOWN", item.multiplicity.status === "UNKNOWN"].filter(Boolean).length, 0);
  return {
    overallStatus: !specifications.length || blockers.length ? "BLOCKED" : decisionsRequired.length ? "READY_WITH_OPEN_DECISIONS" : "READY",
    domainStatuses: {
      analysisSpecifications: specifications.length ? "KNOWN" : "UNKNOWN",
      objectiveLinkage: specifications.every((item) => item.objectiveRefs.length) ? "KNOWN" : "UNKNOWN",
      endpointLinkage: specifications.every((item) => item.endpointRefs.length) ? "KNOWN" : "PARTIAL",
      canonicalVariables: specifications.every((item) => item.targetVariableRefs.length) ? "KNOWN" : "UNKNOWN",
      estimands: specifications.every((item) => item.estimand) ? "KNOWN" : "PARTIAL",
      methods: specifications.every((item) => item.method.status !== "UNKNOWN") ? "KNOWN" : "PARTIAL",
      populations: specifications.every((item) => item.population) ? "KNOWN" : "PARTIAL",
      assumptions: specifications.every((item) => item.assumptions.assumptions.length) ? "KNOWN" : "PARTIAL",
      diagnostics: specifications.every((item) => item.diagnostics.checks.length) ? "KNOWN" : "PARTIAL",
      missingData: specifications.every((item) => item.missingDataStrategy.status !== "UNKNOWN") ? "KNOWN" : "PARTIAL",
      multiplicity: specifications.every((item) => item.multiplicity.status !== "UNKNOWN") ? "KNOWN" : "PARTIAL",
      dimensionnement: dimensioningReadiness === "READY_FOR_CALCULATION" ? "KNOWN" : "PARTIAL",
      futureExecution: "NOT_APPLICABLE",
    },
    blockingCount: blockers.length,
    warningCount: warnings.length,
    unknownCount,
    blockingItems: uniqueSorted(blockers),
    warningItems: uniqueSorted(warnings),
    decisionsRequired: uniqueSorted(decisionsRequired.map((item) => item.decisionRequirementId)),
    limitations: ["Plan uniquement : aucun AnalysisDataset, aucune AnalysisExecution, aucun AnalysisResult et aucun calcul de Dimensionnement."],
  };
};

const logicalProjection = (
  context: Readonly<DataAnalysisPlanningContext>,
  type: LogicalAnalysisProjection["projectionType"],
  specifications: AnalysisSpecification[],
  decisionsRequired: PlanningDecisionRequirement[],
): LogicalAnalysisProjection => {
  const noMethods = specifications.length > 0 && specifications.every((item) => item.method.status === "UNKNOWN");
  const noOutputs = specifications.every((item) => item.expectedOutputs.length === 0);
  const status: LogicalAnalysisProjection["status"] = !specifications.length
    ? "NOT_GENERATABLE"
    : type === "LOGICAL_STATISTICAL_METHODS" && noMethods
      ? "NOT_GENERATABLE"
      : type === "LOGICAL_SAP" && noMethods
        ? "NOT_GENERATABLE"
        : type === "LOGICAL_EXPECTED_OUTPUT_CATALOG" && noOutputs
          ? "NOT_GENERATABLE"
          : decisionsRequired.length
            ? "GENERATABLE_WITH_LIMITATIONS"
            : "GENERATABLE";
  const missingObjects = uniqueSorted([
    ...(!specifications.length ? ["AnalysisSpecification"] : []),
    ...(noMethods && ["LOGICAL_STATISTICAL_METHODS", "LOGICAL_SAP"].includes(type) ? ["StatisticalMethodDefinition"] : []),
    ...(noOutputs && type === "LOGICAL_EXPECTED_OUTPUT_CATALOG" ? ["ExpectedAnalysisOutput"] : []),
  ]);
  return {
    projectionId: `${type.toLowerCase()}:${digestPlanningValue({ project: context.projectRef, specs: specifications.map((item) => item.analysisSpecificationId) })}`,
    projectionType: type,
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    analysisSpecificationRefs: specifications.map((item) => item.analysisSpecificationId),
    canonicalVariableRefs: specifications.flatMap((item) => item.targetVariableRefs),
    status,
    reason: status === "NOT_GENERATABLE" ? `${missingObjects.join(", ")} absent ; aucun texte méthodologique n’est inventé.` : status === "GENERATABLE_WITH_LIMITATIONS" ? "Les objets disponibles sont projetables avec décisions ouvertes visibles." : "Les objets requis sont explicitement disponibles.",
    missingObjects,
    decisionsRequired: decisionsRequired.map((item) => item.decisionRequirementId),
    limitations: ["Projection logique ; ni SAP final, ni résultat, ni source de vérité."],
    provenance: planningProvenance(context.project, "BIOSTATISTICS", [context.projectRef.objectId, ...specifications.map((item) => item.analysisSpecificationId)]),
  };
};

export const buildBiostatisticsPlanningContribution = (
  context: Readonly<DataAnalysisPlanningContext>,
  studyData: Readonly<DataAnalysisPlanningContribution<StudyDataPlanningPayload>>,
  dataManagement: Readonly<DataAnalysisPlanningContribution<DataManagementPlanningPayload>>,
  options: Readonly<BiostatisticsPlanningOptions> = {},
): DataAnalysisPlanningContribution<BiostatisticsPlanningPayload> => {
  const project = context.project;
  const diagnostics: PlanningDiagnostic[] = [];
  const specifications: AnalysisSpecification[] = project.analysisRequirements.flatMap((requirement) => {
    const objectiveRefs = context.objectiveRefs;
    const hypothesisRefs = context.hypothesisRefs.filter((item) => project.hypotheses.some((hypothesis) => hypothesis.hypothesisId === item.objectId));
    const endpointRefs = context.endpointRefs.filter((item) => requirement.endpointIds.includes(item.objectId));
    const targetVariableRefs = context.variableRefs.filter((item) => requirement.variableIds.includes(item.objectId));
    if (!objectiveRefs.length) {
      diagnostics.push(diagnostic("ANALYSIS_WITHOUT_OBJECTIVE", "Une AnalysisSpecification ne peut pas être construite sans Objective Project.", [requirement.requirementId]));
      return [];
    }
    if (!targetVariableRefs.length) {
      diagnostics.push(diagnostic("ANALYSIS_WITHOUT_CANONICAL_VARIABLE", "Une AnalysisSpecification ne peut pas être construite sans CanonicalVariable.", [requirement.requirementId]));
      return [];
    }
    const specId = analysisId(context, requirement.requirementId);
    const provenance = planningProvenance(project, "BIOSTATISTICS", [requirement.requirementId, ...requirement.endpointIds, ...requirement.variableIds]);
    const explicitEstimand = options.estimands?.[requirement.requirementId];
    const estimand = explicitEstimand ? {
      estimandId: `estimand:${digestPlanningValue({ specId, explicitEstimand })}`,
      analysisSpecificationRef: specId,
      populationRef: context.populationRefs[0] ?? null,
      endpointRef: context.endpointRefs.find((item) => item.objectId === explicitEstimand.endpointId) ?? endpointRefs[0] ?? null,
      variableRefs: targetVariableRefs.filter((item) => explicitEstimand.variableIds.includes(item.objectId)),
      contrast: explicitEstimand.contrast ?? null,
      summaryMeasure: explicitEstimand.summaryMeasure ?? null,
      temporalRefs: studyData.content.expectedVariableOccasions.filter((item) => requirement.variableIds.includes(item.variableRef.objectId)).map((item) => item.occasionRef),
      intercurrentEventStrategyRefs: [],
      status: "KNOWN" as const,
      provenance,
    } : null;
    const populationRules = options.populationRules?.[requirement.requirementId];
    const methodInput = options.methods?.[requirement.requirementId];
    const assumptionInputs = options.assumptions?.[requirement.requirementId] ?? [];
    const diagnosticInputs = options.diagnostics?.[requirement.requirementId] ?? [];
    const intercurrentInputs = options.intercurrentEvents?.[requirement.requirementId] ?? [];
    const multiplicityInput = options.multiplicity?.[requirement.requirementId];
    const expectedOutputs: ExpectedAnalysisOutput[] = (options.expectedOutputs?.[requirement.requirementId] ?? []).map((item) => ({
      outputId: `expected-analysis-output:${digestPlanningValue({ specId, item })}`,
      analysisSpecificationRef: specId,
      role: item.role,
      target: item.target,
      outputType: item.outputType,
      value: null,
      provenance,
    }));
    return [{
      analysisSpecificationId: specId,
      version: "1.0.0",
      sourceProjectVersion: context.projectRef.objectVersion,
      objectiveRefs,
      hypothesisRefs,
      endpointRefs,
      targetVariableRefs,
      role: options.roles?.[requirement.requirementId] ?? "UNDECIDED",
      purpose: requirement.purpose,
      estimand,
      variableRoles: targetVariableRefs.map((variableRef) => ({
        assignmentId: `analysis-variable-role:${digestPlanningValue({ specId, variableRef })}`,
        analysisSpecificationRef: specId,
        variableRef,
        populationRef: context.populationRefs[0] ?? null,
        temporalRefs: studyData.content.expectedVariableOccasions.filter((item) => item.variableRef.objectId === variableRef.objectId).map((item) => item.occasionRef),
        role: "ANALYTIC_ROLE_UNDECIDED",
        provenance,
      })),
      population: context.populationRefs[0] ? {
        populationDefinitionId: `analysis-population:${digestPlanningValue({ specId, population: context.populationRefs[0] })}`,
        analysisSpecificationRef: specId,
        projectPopulationRef: context.populationRefs[0],
        inclusionRule: populationRules?.inclusionRule ?? null,
        exclusionRule: populationRules?.exclusionRule ?? null,
        status: populationRules ? "KNOWN" : "PARTIAL",
        mutatesProjectPopulation: false,
        provenance,
      } : null,
      method: {
        methodDefinitionId: `statistical-method:${digestPlanningValue({ specId, methodInput: methodInput ?? null })}`,
        analysisSpecificationRef: specId,
        methodFamily: methodInput?.methodFamily ?? null,
        model: methodInput?.model ?? null,
        status: methodInput ? "KNOWN" : "UNKNOWN",
        source: methodInput?.source ?? "UNKNOWN",
        provenance,
      },
      assumptions: {
        assumptionSetId: `model-assumptions:${digestPlanningValue({ specId, assumptionInputs })}`,
        analysisSpecificationRef: specId,
        assumptions: assumptionInputs.map((item) => ({ assumptionId: `model-assumption:${digestPlanningValue({ specId, item })}`, category: item.category, statement: item.statement, status: "KNOWN" as const, sourceRef: item.sourceRef })),
        automaticallySatisfied: false,
        provenance,
      },
      diagnostics: {
        diagnosticPlanId: `diagnostic-plan:${digestPlanningValue({ specId, diagnosticInputs })}`,
        analysisSpecificationRef: specId,
        checks: diagnosticInputs.map((item) => ({ checkId: `diagnostic-check:${digestPlanningValue({ specId, item })}`, purpose: item.purpose, definition: item.definition, status: "KNOWN" as const })),
        executionAuthorized: false,
        provenance,
      },
      missingDataStrategy: {
        strategyId: `missing-data-strategy:${digestPlanningValue({ specId, strategy: options.missingDataStrategies?.[requirement.requirementId] ?? null })}`,
        analysisSpecificationRef: specId,
        factualMissingnessOwner: "CDM-001",
        strategy: options.missingDataStrategies?.[requirement.requirementId] ?? null,
        status: options.missingDataStrategies?.[requirement.requirementId] ? "KNOWN" : "UNKNOWN",
        imputationExecuted: false,
        provenance,
      },
      intercurrentEvents: intercurrentInputs.map((item) => ({
        strategyId: `intercurrent-event-strategy:${digestPlanningValue({ specId, item })}`,
        analysisSpecificationRef: specId,
        event: item.event,
        strategy: item.strategy,
        status: "KNOWN" as const,
        distinctFromMissingness: true,
        provenance,
      })),
      multiplicity: {
        strategyId: `multiplicity-strategy:${digestPlanningValue({ specId, multiplicityInput: multiplicityInput ?? null })}`,
        analysisSpecificationRef: specId,
        applicable: multiplicityInput?.applicable ?? null,
        hypothesisFamilyRefs: uniqueSorted(multiplicityInput?.hypothesisFamilyRefs ?? []),
        procedure: multiplicityInput?.procedure ?? null,
        alpha: multiplicityInput?.alpha ?? null,
        status: multiplicityInput ? "KNOWN" : "UNKNOWN",
        provenance,
      },
      sensitivityAnalyses: (options.sensitivities ?? []).filter((item) => item.primaryAnalysisRequirementId === requirement.requirementId).map((item) => ({
        sensitivityId: `sensitivity-analysis:${digestPlanningValue({ specId, item })}`,
        primaryAnalysisSpecificationRef: specId,
        fragilityTested: item.fragilityTested,
        changedElements: uniqueSorted(item.changedElements),
        constantElements: uniqueSorted(item.constantElements),
        role: "SENSITIVITY",
        status: "CANDIDATE",
        provenance,
      })),
      datasetReleaseRequirementRefs: dataManagement.content.datasetReleaseRequirements.filter((item) => item.analysisRequirementRef === requirement.requirementId).map((item) => item.requirementId),
      expectedOutputs,
      status: "CANDIDATE",
      provenance,
    }];
  });
  const dimensioningAssumptions = options.dimensioningAssumptions ?? project.sizingRequirements.inputs.map((item) => ({
    assumptionId: `dimensioning-assumption:${digestPlanningValue({ project: context.projectRef, parameter: item.name })}`,
    parameter: item.name,
    proposedValue: null,
    unit: null,
    sourceType: "UNKNOWN" as const,
    sourceReference: null,
    evidence: [],
    owner: "BIOSTATISTICS_AND_HUMAN",
    status: "UNKNOWN" as const,
    uncertainty: [],
    limitations: [item.reason],
  }));
  const dimensioningReady = dimensioningAssumptions.length === 0 ? "NOT_DEFINED" as const : dimensioningAssumptions.every((item) => item.proposedValue !== null && item.sourceType !== "UNKNOWN" && item.sourceReference) ? "READY_FOR_CALCULATION" as const : "INCOMPLETE" as const;
  const dimensionnement = {
    dimensionnementId: `dimensionnement:${digestPlanningValue({ project: context.projectRef, assumptions: dimensioningAssumptions })}`,
    objectiveRefs: context.objectiveRefs,
    endpointRefs: context.endpointRefs,
    analysisSpecificationRefs: specifications.map((item) => item.analysisSpecificationId),
    populationRefs: context.populationRefs,
    assumptions: dimensioningAssumptions,
    scenarios: dimensioningAssumptions.length ? [{ scenarioId: `dimensioning-scenario:${digestPlanningValue(dimensioningAssumptions.map((item) => item.assumptionId))}`, assumptionRefs: dimensioningAssumptions.map((item) => item.assumptionId), owner: "BIOSTATISTICS_AND_HUMAN", adoptionStatus: "CANDIDATE" as const }] : [],
    readiness: dimensioningReady,
    calculatedSampleSize: null,
    provenance: planningProvenance(project, "BIOSTATISTICS", [context.projectRef.objectId, ...project.sizingRequirements.inputs.map((item) => item.name)]),
  };
  const decisionsRequired = collectBiostatisticsDecisionRequirements(context, specifications);
  if (dimensioningReady !== "READY_FOR_CALCULATION") decisionsRequired.push(decision(context, dimensionnement.dimensionnementId, "DEFINE_DIMENSIONING_ASSUMPTIONS", "Les hypothèses de Dimensionnement ne permettent pas encore un futur calcul.", "BLOCKING_FOR_DIMENSIONING"));
  const readiness = computeBiostatisticsPlanningReadiness(specifications, decisionsRequired, dimensioningReady);
  const content: BiostatisticsPlanningPayload = {
    analysisSpecifications: specifications,
    dimensionnement,
    logicalAnalysisPlan: logicalProjection(context, "LOGICAL_ANALYSIS_PLAN", specifications, decisionsRequired),
    logicalSAP: logicalProjection(context, "LOGICAL_SAP", specifications, decisionsRequired),
    logicalStatisticalMethods: logicalProjection(context, "LOGICAL_STATISTICAL_METHODS", specifications, decisionsRequired),
    logicalExpectedOutputCatalog: logicalProjection(context, "LOGICAL_EXPECTED_OUTPUT_CATALOG", specifications, decisionsRequired),
    readiness,
    decisionsRequired,
    diagnostics,
  };
  const changes = [
    ...specifications.map((item) => proposedChange({ operation: "PROPOSE_CREATE", objectKind: "AnalysisSpecification", objectId: item.analysisSpecificationId, sourceProjectVersion: context.projectRef.objectVersion, value: item, provenance: item.provenance })),
    proposedChange({ operation: "PROPOSE_CREATE", objectKind: "Dimensionnement", objectId: dimensionnement.dimensionnementId, sourceProjectVersion: context.projectRef.objectVersion, value: dimensionnement, provenance: dimensionnement.provenance }),
  ];
  return createPlanningContribution({ type: "BIOSTATISTICS_PLAN", project, content, changes, owner: "BIOSTATISTICS", sourceRefs: [studyData.contributionId, dataManagement.contributionId, context.contextId], limitations: readiness.limitations });
};

export const analyzeBiostatisticsPlanningImpact = (
  previous: Readonly<DataAnalysisPlanningContribution<BiostatisticsPlanningPayload>>,
  next: Readonly<DataAnalysisPlanningContribution<BiostatisticsPlanningPayload>>,
) => {
  const prior = new Map(previous.content.analysisSpecifications.map((item) => [item.analysisSpecificationId, digestPlanningValue(item)]));
  const after = new Map(next.content.analysisSpecifications.map((item) => [item.analysisSpecificationId, digestPlanningValue(item)]));
  return uniqueSorted([...new Set([...prior.keys(), ...after.keys()])]).map((analysisSpecRef) => ({
    analysisSpecRef,
    changeType: !prior.has(analysisSpecRef) ? "ADDED" as const : !after.has(analysisSpecRef) ? "INVALIDATED" as const : prior.get(analysisSpecRef) === after.get(analysisSpecRef) ? "UNCHANGED" as const : "REQUIRES_REVIEW" as const,
    affectedBranches: ["ESTIMAND", "POPULATION", "VARIABLES", "METHOD", "MISSINGNESS", "MULTIPLICITY", "SENSITIVITIES", "DIMENSIONNEMENT", "OUTPUTS", "SAP"],
    automaticallyApplied: false as const,
  }));
};
