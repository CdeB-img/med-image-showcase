import type { HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";

export const DATA_ANALYSIS_PLANNING_VERSION = "1.0.0" as const;
export const DATA_ANALYSIS_CONTRIBUTION_ENVELOPE_TYPE = "DATA_ANALYSIS_PLANNING_CONTRIBUTION_ENVELOPE" as const;

export type PlanningContributionType = "STUDY_DATA_PLAN" | "DATA_MANAGEMENT_PLAN" | "BIOSTATISTICS_PLAN";
export type PlanningKnowledgeStatus = "KNOWN" | "PARTIAL" | "UNKNOWN" | "NOT_APPLICABLE";
export type PlanningDecisionStatus = "CANDIDATE" | "DECISION_PENDING" | "REJECTED" | "DEFERRED";
export type PlanningReadinessStatus = "BLOCKED" | "INCOMPLETE" | "READY_WITH_OPEN_DECISIONS" | "READY";
export type PlanningBlockingLevel =
  | "BLOCKING_FOR_DATA_PLAN"
  | "BLOCKING_FOR_DM_PLAN"
  | "BLOCKING_FOR_ANALYSIS_PLAN"
  | "BLOCKING_FOR_PRIMARY_ANALYSIS"
  | "BLOCKING_FOR_DIMENSIONING"
  | "BLOCKING_FOR_FUTURE_EXECUTION"
  | "OPEN_DECISION_NON_BLOCKING"
  | "UNKNOWN_NON_BLOCKING"
  | "NOT_APPLICABLE"
  | "DEFERRED_TO_REALIZED_TIME";

export type CanonicalReference<K extends string = string> = {
  objectKind: K;
  objectId: string;
  objectVersion: string;
  owner: string;
  sourceProjectId: string;
  sourceProjectVersion: string;
};

export type PlanningProvenance = {
  sourceRefs: string[];
  sourceProjectId: string;
  sourceProjectVersion: string;
  owner: string;
  evidence: string[];
  limitations: string[];
};

export type PlanningDiagnostic = {
  code: string;
  severity: "ERROR" | "WARNING" | "INFORMATION";
  message: string;
  targetRefs: string[];
  owner: string;
  blockingLevel: PlanningBlockingLevel;
  autoFixed: false;
};

export type PlanningDecisionRequirement = {
  decisionRequirementId: string;
  target: string;
  questionIntent: string;
  reason: string;
  affectedObjects: string[];
  affectedBranches: string[];
  blockingLevel: PlanningBlockingLevel;
  owner: string;
  evidence: string[];
  knownOptions: string[];
  defaultOption: "NONE";
  provenance: PlanningProvenance;
};

export type ProposedProjectObjectChange = {
  changeId: string;
  operation: "PROPOSE_CREATE" | "PROPOSE_UPDATE" | "PROPOSE_RELATION" | "PROPOSE_REMOVE_RELATION" | "NO_CHANGE" | "DEFER";
  objectKind: string;
  objectId: string;
  sourceProjectVersion: string;
  value: unknown;
  provenance: PlanningProvenance;
  status: "PROPOSED";
  projectWriteAuthorized: false;
};

export type DataAnalysisPlanningContext = {
  contractVersion: typeof DATA_ANALYSIS_PLANNING_VERSION;
  contextId: string;
  contextDigest: string;
  project: Readonly<ResearchProjectDesignResult>;
  projectRef: CanonicalReference<"ResearchProject">;
  objectiveRefs: CanonicalReference<"Objective">[];
  hypothesisRefs: CanonicalReference<"Hypothesis">[];
  endpointRefs: CanonicalReference<"Endpoint">[];
  populationRefs: CanonicalReference<"Population">[];
  variableRefs: CanonicalReference<"CanonicalVariable">[];
  expectedOccasionRefs: CanonicalReference<"ExpectedVariableOccasion">[];
  observablePropertyRefs: CanonicalReference<"ObservableProperty">[];
  measurementDefinitionRefs: CanonicalReference<"MeasurementDefinition">[];
  biomarkerRoleRefs: CanonicalReference<"BiomarkerRole">[];
  declaredDecisions: HumanDecisionEnvelope[];
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  unknowns: string[];
  limitations: string[];
};

export type DataNeedDefinition = {
  dataNeedRef: CanonicalReference<"DataNeed">;
  label: string;
  objectiveRefs: CanonicalReference<"Objective">[];
  endpointRefs: CanonicalReference<"Endpoint">[];
  status: PlanningDecisionStatus;
  provenance: PlanningProvenance;
};

export type CanonicalVariableDefinition = {
  variableRef: CanonicalReference<"CanonicalVariable">;
  label: string;
  projectRole: string;
  dataNeedRefs: CanonicalReference<"DataNeed">[];
  observablePropertyRef: CanonicalReference<"ObservableProperty"> | null;
  measurementDefinitionRef: CanonicalReference<"MeasurementDefinition"> | null;
  plannedSource: string | null;
  plannedMethod: string | null;
  unit: string | null;
  valueDomain: string | null;
  applicability: "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
  qualityRequirements: string[];
  knowledgeStatus: PlanningKnowledgeStatus;
  provenance: PlanningProvenance;
};

export type ExpectedVariableOccasionDefinition = {
  occasionRef: CanonicalReference<"ExpectedVariableOccasion">;
  variableRef: CanonicalReference<"CanonicalVariable">;
  visitRef: CanonicalReference<"Visit">;
  temporalRole: string;
  expectedTiming: string | null;
  status: "EXPECTED_NOT_REALIZED";
  provenance: PlanningProvenance;
};

export type StudyDataPlanningPayload = {
  dataNeeds: DataNeedDefinition[];
  canonicalVariables: CanonicalVariableDefinition[];
  expectedVariableOccasions: ExpectedVariableOccasionDefinition[];
  plannedSources: Array<{ sourceId: string; variableRefs: CanonicalReference<"CanonicalVariable">[]; value: string | null; status: PlanningKnowledgeStatus; provenance: PlanningProvenance }>;
  plannedMethods: Array<{ methodId: string; variableRefs: CanonicalReference<"CanonicalVariable">[]; measurementDefinitionRef: CanonicalReference<"MeasurementDefinition"> | null; value: string | null; status: PlanningKnowledgeStatus; provenance: PlanningProvenance }>;
  readiness: PlanningReadiness;
  decisionsRequired: PlanningDecisionRequirement[];
  diagnostics: PlanningDiagnostic[];
};

export type DataManagementPolicyDefinition = {
  policyId: string;
  kind: "QUERY" | "CORRECTION" | "RECONCILIATION" | "TRANSFORMATION" | "SNAPSHOT" | "FREEZE" | "LOCK" | "RELEASE";
  status: PlanningKnowledgeStatus;
  definition: string | null;
  owner: string;
  provenance: PlanningProvenance;
};

export type DataCollectionFieldDefinition = {
  fieldDefinitionId: string;
  canonicalVariableRef: CanonicalReference<"CanonicalVariable">;
  expectedOccasionRefs: CanonicalReference<"ExpectedVariableOccasion">[];
  projectedLabel: string;
  projectedColumnName: string | null;
  unit: string | null;
  valueDomain: string | null;
  structuralControls: string[];
  contextualControls: string[];
  provenance: PlanningProvenance;
};

export type DataCollectionSpecification = {
  specificationId: string;
  version: string;
  fields: DataCollectionFieldDefinition[];
  status: PlanningDecisionStatus;
  provenance: PlanningProvenance;
};

export type DataManagementDefinition = {
  definitionId: string;
  version: string;
  collectionStrategy: string | null;
  sourceHandling: string | null;
  controls: Array<{ controlId: string; kind: "STRUCTURAL" | "CONTEXTUAL"; definition: string; sourceRef: string }>;
  policies: DataManagementPolicyDefinition[];
  owners: string[];
  status: PlanningDecisionStatus;
  provenance: PlanningProvenance;
};

export type DatasetReleaseRequirement = {
  requirementId: string;
  analysisRequirementRef: string;
  canonicalVariableRefs: CanonicalReference<"CanonicalVariable">[];
  expectedOccasionRefs: CanonicalReference<"ExpectedVariableOccasion">[];
  qualityConditions: string[];
  openFindingsPolicy: string | null;
  freezeRequired: boolean | null;
  lockRequired: boolean | null;
  releaseStatus: "DESIGN_PHASE_ABSENT";
  blockingLevel: "DEFERRED_TO_REALIZED_TIME";
  provenance: PlanningProvenance;
};

export type LogicalDataProjection = {
  projectionId: string;
  projectionType: "LOGICAL_CRF" | "LOGICAL_DATA_DICTIONARY" | "LOGICAL_SCHEDULE_OF_ACTIVITIES";
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  variableRefs: CanonicalReference<"CanonicalVariable">[];
  occasionRefs: CanonicalReference<"ExpectedVariableOccasion">[];
  fields: DataCollectionFieldDefinition[];
  rows: Array<{ rowId: string; variableRef: CanonicalReference<"CanonicalVariable">; occasionRefs: CanonicalReference<"ExpectedVariableOccasion">[] }>;
  limitations: string[];
  provenance: PlanningProvenance;
};

export type DataManagementPlanningPayload = {
  definition: DataManagementDefinition;
  collectionSpecification: DataCollectionSpecification;
  logicalCRF: LogicalDataProjection;
  logicalDataDictionary: LogicalDataProjection;
  logicalScheduleOfActivities: LogicalDataProjection;
  datasetReleaseRequirements: DatasetReleaseRequirement[];
  readiness: PlanningReadiness;
  decisionsRequired: PlanningDecisionRequirement[];
  diagnostics: PlanningDiagnostic[];
};

export type EstimandDefinition = {
  estimandId: string;
  analysisSpecificationRef: string;
  populationRef: CanonicalReference<"Population"> | null;
  endpointRef: CanonicalReference<"Endpoint"> | null;
  variableRefs: CanonicalReference<"CanonicalVariable">[];
  contrast: string | null;
  summaryMeasure: string | null;
  temporalRefs: CanonicalReference<"ExpectedVariableOccasion">[];
  intercurrentEventStrategyRefs: string[];
  status: PlanningKnowledgeStatus;
  provenance: PlanningProvenance;
};

export type AnalysisVariableRoleAssignment = {
  assignmentId: string;
  analysisSpecificationRef: string;
  variableRef: CanonicalReference<"CanonicalVariable">;
  populationRef: CanonicalReference<"Population"> | null;
  temporalRefs: CanonicalReference<"ExpectedVariableOccasion">[];
  role: string;
  provenance: PlanningProvenance;
};

export type AnalysisPopulationDefinition = {
  populationDefinitionId: string;
  analysisSpecificationRef: string;
  projectPopulationRef: CanonicalReference<"Population">;
  inclusionRule: string | null;
  exclusionRule: string | null;
  status: PlanningKnowledgeStatus;
  mutatesProjectPopulation: false;
  provenance: PlanningProvenance;
};

export type StatisticalMethodDefinition = {
  methodDefinitionId: string;
  analysisSpecificationRef: string;
  methodFamily: string | null;
  model: string | null;
  status: PlanningKnowledgeStatus;
  source: "PROJECT_DECISION" | "HUMAN_CONTRIBUTION" | "EXISTING_SPECIFICATION" | "UNKNOWN";
  provenance: PlanningProvenance;
};

export type ModelAssumptionSet = {
  assumptionSetId: string;
  analysisSpecificationRef: string;
  assumptions: Array<{ assumptionId: string; category: string; statement: string | null; status: PlanningKnowledgeStatus; sourceRef: string | null }>;
  automaticallySatisfied: false;
  provenance: PlanningProvenance;
};

export type DiagnosticPlan = {
  diagnosticPlanId: string;
  analysisSpecificationRef: string;
  checks: Array<{ checkId: string; purpose: string; definition: string | null; status: PlanningKnowledgeStatus }>;
  executionAuthorized: false;
  provenance: PlanningProvenance;
};

export type MissingDataStrategy = {
  strategyId: string;
  analysisSpecificationRef: string;
  factualMissingnessOwner: "CDM-001";
  strategy: string | null;
  status: PlanningKnowledgeStatus;
  imputationExecuted: false;
  provenance: PlanningProvenance;
};

export type IntercurrentEventStrategy = {
  strategyId: string;
  analysisSpecificationRef: string;
  event: string | null;
  strategy: string | null;
  status: PlanningKnowledgeStatus;
  distinctFromMissingness: true;
  provenance: PlanningProvenance;
};

export type MultiplicityStrategy = {
  strategyId: string;
  analysisSpecificationRef: string;
  applicable: boolean | null;
  hypothesisFamilyRefs: string[];
  procedure: string | null;
  alpha: number | null;
  status: PlanningKnowledgeStatus;
  provenance: PlanningProvenance;
};

export type SensitivityAnalysisDefinition = {
  sensitivityId: string;
  primaryAnalysisSpecificationRef: string;
  fragilityTested: string;
  changedElements: string[];
  constantElements: string[];
  role: "SENSITIVITY";
  status: PlanningDecisionStatus;
  provenance: PlanningProvenance;
};

export type DimensioningAssumption = {
  assumptionId: string;
  parameter: string;
  proposedValue: number | string | null;
  unit: string | null;
  sourceType: "SCIENTIFIC_SOURCE" | "INTERNAL_DATA" | "PILOT_DATA" | "EXTERNAL_DATA" | "HISTORICAL_DATA" | "EXPERT_ASSUMPTION" | "PROJECT_DECISION" | "OPERATIONAL_CONSTRAINT" | "UNKNOWN";
  sourceReference: string | null;
  evidence: string[];
  owner: string;
  status: PlanningKnowledgeStatus;
  uncertainty: string[];
  limitations: string[];
};

export type DimensionnementDefinition = {
  dimensionnementId: string;
  objectiveRefs: CanonicalReference<"Objective">[];
  endpointRefs: CanonicalReference<"Endpoint">[];
  analysisSpecificationRefs: string[];
  populationRefs: CanonicalReference<"Population">[];
  assumptions: DimensioningAssumption[];
  scenarios: Array<{ scenarioId: string; assumptionRefs: string[]; owner: string; adoptionStatus: PlanningDecisionStatus }>;
  readiness: "NOT_DEFINED" | "INCOMPLETE" | "READY_FOR_CALCULATION";
  calculatedSampleSize: null;
  provenance: PlanningProvenance;
};

export type ExpectedAnalysisOutput = {
  outputId: string;
  analysisSpecificationRef: string;
  role: string;
  target: string;
  outputType: "DESCRIPTIVE_SUMMARY" | "ESTIMATE" | "UNCERTAINTY_INTERVAL" | "TEST_STATISTIC" | "MODEL_DIAGNOSTIC" | "TABLE" | "LISTING" | "FIGURE" | "SENSITIVITY_COMPARISON" | "SUBGROUP_OUTPUT";
  value: null;
  provenance: PlanningProvenance;
};

export type AnalysisSpecification = {
  analysisSpecificationId: string;
  version: string;
  sourceProjectVersion: string;
  objectiveRefs: CanonicalReference<"Objective">[];
  hypothesisRefs: CanonicalReference<"Hypothesis">[];
  endpointRefs: CanonicalReference<"Endpoint">[];
  targetVariableRefs: CanonicalReference<"CanonicalVariable">[];
  role: "PRIMARY" | "SECONDARY" | "SUPPORTIVE" | "EXPLORATORY" | "POST_HOC" | "UNDECIDED";
  purpose: string;
  estimand: EstimandDefinition | null;
  variableRoles: AnalysisVariableRoleAssignment[];
  population: AnalysisPopulationDefinition | null;
  method: StatisticalMethodDefinition;
  assumptions: ModelAssumptionSet;
  diagnostics: DiagnosticPlan;
  missingDataStrategy: MissingDataStrategy;
  intercurrentEvents: IntercurrentEventStrategy[];
  multiplicity: MultiplicityStrategy;
  sensitivityAnalyses: SensitivityAnalysisDefinition[];
  datasetReleaseRequirementRefs: string[];
  expectedOutputs: ExpectedAnalysisOutput[];
  status: PlanningDecisionStatus;
  provenance: PlanningProvenance;
};

export type LogicalAnalysisProjection = {
  projectionId: string;
  projectionType: "LOGICAL_ANALYSIS_PLAN" | "LOGICAL_SAP" | "LOGICAL_STATISTICAL_METHODS" | "LOGICAL_EXPECTED_OUTPUT_CATALOG";
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
  analysisSpecificationRefs: string[];
  canonicalVariableRefs: CanonicalReference<"CanonicalVariable">[];
  status: "GENERATABLE" | "GENERATABLE_WITH_LIMITATIONS" | "NOT_GENERATABLE" | "NOT_APPLICABLE" | "BLOCKED";
  reason: string;
  missingObjects: string[];
  decisionsRequired: string[];
  limitations: string[];
  provenance: PlanningProvenance;
};

export type BiostatisticsPlanningPayload = {
  analysisSpecifications: AnalysisSpecification[];
  dimensionnement: DimensionnementDefinition;
  logicalAnalysisPlan: LogicalAnalysisProjection;
  logicalSAP: LogicalAnalysisProjection;
  logicalStatisticalMethods: LogicalAnalysisProjection;
  logicalExpectedOutputCatalog: LogicalAnalysisProjection;
  readiness: PlanningReadiness;
  decisionsRequired: PlanningDecisionRequirement[];
  diagnostics: PlanningDiagnostic[];
};

export type PlanningReadiness = {
  overallStatus: PlanningReadinessStatus;
  domainStatuses: Record<string, PlanningReadinessStatus | PlanningKnowledgeStatus>;
  blockingCount: number;
  warningCount: number;
  unknownCount: number;
  blockingItems: string[];
  warningItems: string[];
  decisionsRequired: string[];
  limitations: string[];
};

export type PlanningContributionPayload = StudyDataPlanningPayload | DataManagementPlanningPayload | BiostatisticsPlanningPayload;

export type DataAnalysisPlanningContribution<T extends PlanningContributionPayload = PlanningContributionPayload> = {
  envelopeType: typeof DATA_ANALYSIS_CONTRIBUTION_ENVELOPE_TYPE;
  envelopeVersion: typeof DATA_ANALYSIS_PLANNING_VERSION;
  contributionId: string;
  contributionType: PlanningContributionType;
  contributionVersion: string;
  sourceProjectId: string;
  sourceProjectVersion: string;
  sourceProjectDigest: string;
  content: T;
  proposedChanges: ProposedProjectObjectChange[];
  governance: {
    owner: string;
    status: "CANDIDATE_NOT_ADOPTED";
    humanDecisionRequired: true;
    projectWriteAuthorized: false;
    realizedTimeAuthorized: false;
  };
  integrity: {
    contentDigest: string;
    contributionDigest: string;
    canonicalization: "KNOWLEDGE_ENGINE_STABLE_STRINGIFY";
  };
  provenance: PlanningProvenance;
};

export type ProjectDataAnalysisState = {
  stateVersion: typeof DATA_ANALYSIS_PLANNING_VERSION;
  sourceProjectId: string;
  sourceProjectVersion: string;
  adoptedObjects: Record<string, unknown>;
  decisions: HumanDecisionEnvelope[];
  contributionRefs: Array<{ contributionId: string; contributionDigest: string; adoptedTargetIds: string[]; rejectedTargetIds: string[]; deferredTargetIds: string[] }>;
  audit: Array<{ eventId: string; decisionId: string; priorProjectVersion: string; resultingProjectVersion: string; targetIds: string[]; disposition: string; provenance: string[] }>;
};

export type ProjectDataAnalysisView = {
  projectionId: string;
  projectRef: CanonicalReference<"ResearchProject">;
  projectVersion: string;
  data: StudyDataPlanningPayload | null;
  dataManagement: DataManagementPlanningPayload | null;
  biostatistics: BiostatisticsPlanningPayload | null;
  decisions: HumanDecisionEnvelope[];
  contributionRefs: ProjectDataAnalysisState["contributionRefs"];
  readiness: PlanningReadiness;
  unknowns: string[];
  limitations: string[];
  projectionOnly: true;
  sourceOfTruth: false;
};

export type PlanningValidationResult = {
  valid: boolean;
  findings: PlanningDiagnostic[];
};
