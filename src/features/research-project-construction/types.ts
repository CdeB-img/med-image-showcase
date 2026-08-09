import { z } from "zod";
import type { ImagingDesignResult } from "@/features/imaging-study-designer/types";

export const RESEARCH_PROJECT_CONSTRUCTION_VERSION = "1.0.0" as const;

export type ProjectImpactState = "PRESERVED" | "REVIEW_REQUIRED" | "INVALIDATED" | "OBSOLETE" | "NEWLY_REQUIRED" | "UNAFFECTED_DEMONSTRATED";
export type ProjectReviewState = "PENDING" | "ADOPTED" | "REJECTED";
export type SpecializedEvaluationState = "READY" | "READY_WITH_OPEN_ITEMS" | "READY_WITH_LIMITATIONS" | "PARTIAL" | "SPECIALIZED_ENGINE_REQUIRED" | "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" | "NOT_APPLICABLE" | "BLOCKED";
export type ProjectionAvailability = "NOT_AVAILABLE" | "STRUCTURE_ONLY" | "PARTIALLY_GENERATABLE" | "READY_FOR_PROJECTION";

export type ResearchProjectConstructionInput = {
  contractVersion: typeof RESEARCH_PROJECT_CONSTRUCTION_VERSION;
  inputId: string;
  projectId: string;
  strategyVersion: string;
  sourceHandoffs: {
    scientificThinking: { status: "AUTHORIZED" | "VALIDATED_CONTEXT"; outputRef: string | null };
    imaging: { status: "FROZEN_BY_HUMAN" | "NOT_APPLICABLE" | "REQUIRED_BUT_NOT_READY"; resultRef: string | null };
  };
  confirmedScientificQuestion: { questionId: string; text: string; confirmation: "HUMAN_CONFIRMED" | "VALIDATED_CONTEXT" };
  objectives: Array<{ objectiveId: string; text: string; level: "PRIMARY" | "SECONDARY" | "EXPLORATORY"; reviewState: ProjectReviewState }>;
  hypotheses: Array<{ hypothesisId: string; text: string; kind: "PRIMARY" | "ALTERNATIVE" | "NULL_OR_COMPETING"; reviewState: ProjectReviewState }>;
  mechanisms: Array<{ mechanismId: string; text: string; support: string }>;
  scientificContext: {
    centralScientificObject: string;
    pathologyOrCondition: string[];
    phenomena: string[];
    outcomes: string[];
    exposuresOrInterventions: string[];
    studyDesignDeclarations: string[];
    centerDeclarations: string[];
    availableData: string[];
    methodPreferences: string[];
  };
  knowledgeResults: {
    resultId: string | null;
    resultDigest: string | null;
    coverageStatus: string;
    assertions: Array<{ assertionId: string; text: string; applicability: string; sourceRef: string }>;
    gaps: Array<{ code: string; explanation: string; resumeCondition: string }>;
    limitations: string[];
  };
  imagingDesignResult: ImagingDesignResult | null;
  knownPopulationInformation: string[];
  knownTemporalInformation: string[];
  knownConstraints: string[];
  existingDecisions: string[];
  uncertainties: string[];
  contradictions: string[];
  userProvidedInformation: Array<{ informationId: string; kind: string; value: string; provenanceRef: string }>;
  provenance: string[];
  trace: Array<{ sequence: number; operation: string; decision: string; inputDigest: string; outputDigest: string }>;
};

export type PopulationDesign = {
  populationId: string;
  populationConcept: {
    conditionOrPathology: string[];
    stage: string[];
    phenotype: string[];
    clinicalContext: string[];
    exposureOrIntervention: string[];
    questionRequiredCharacteristics: string[];
    conceptuallyJustifiedExclusions: Array<{ label: string; justification: string; sourceRef: string }>;
    relevantSubpopulations: Array<{ label: string; justification: string; status: "CANDIDATE" }>;
  };
  operationalEligibility: {
    status: "FUTURE_SPECIALIZED_DEFINITION_REQUIRED";
    requirements: Array<{ requirement: string; whyNeeded: string; finalWordingStatus: "NOT_DEFINED" }>;
  };
  justification: string;
  sourceRefs: string[];
  missingInformation: string[];
  reviewState: ProjectReviewState;
};

export type StudyDesignCandidate = {
  designId: string;
  family: "CROSS_SECTIONAL_OBSERVATIONAL" | "PROSPECTIVE_LONGITUDINAL_COHORT" | "RETROSPECTIVE_LONGITUDINAL_COHORT" | "PROSPECTIVE_PROGNOSTIC_COHORT" | "METHODOLOGICAL_VALIDATION" | "COMPARATIVE_OBSERVATIONAL" | "CASE_CONTROL";
  label: string;
  whyItAnswersQuestion: string;
  estimandPurpose: string;
  limitations: string[];
  biases: string[];
  constraints: string[];
  decisionsImplied: string[];
  sourceSignals: string[];
  reviewState: ProjectReviewState;
};

export type ProjectGroup = {
  groupId: string;
  role: "STUDY_POPULATION" | "REFERENCE" | "EXPOSURE" | "COMPARATOR" | "WITHIN_SUBJECT" | "METHOD";
  label: string;
  justification: string;
  populationId: string;
  sourceRefs: string[];
  reviewState: ProjectReviewState;
};

export type ProjectVisit = {
  visitId: string;
  label: string;
  temporalRole: "BASELINE" | "EVENT" | "FOLLOW_UP" | "REPEATED_MEASUREMENT" | "SINGLE_ASSESSMENT";
  timingValue: string | null;
  timingStatus: "KNOWN" | "SCIENTIFIC_WINDOW_TO_DEFINE" | "OPERATIONAL_WINDOW_FUTURE";
  justification: string;
  hypothesisIds: string[];
  endpointIds: string[];
  measurementIds: string[];
  dependencies: string[];
};

export type ProjectVariable = {
  variableId: string;
  definition: string;
  source: "IMAGING" | "USER_PROVIDED" | "SCIENTIFIC_CONTEXT";
  sourceRef: string;
  role: "OUTCOME_CANDIDATE" | "EXPOSURE_CANDIDATE" | "MEASUREMENT_CANDIDATE" | "CONFOUNDER_CANDIDATE";
  timingIds: string[];
  endpointIds: string[];
  analysisRequirementIds: string[];
  qualityRequirements: string[];
  provenance: string[];
  knowledgeStatus: "KNOWN" | "PARTIAL" | "UNKNOWN";
  finalDataDictionaryName: null;
};

export type EndpointCandidate = {
  endpointId: string;
  label: string;
  proposedRole: "PRIMARY_CANDIDATE" | "SECONDARY_CANDIDATE" | "EXPLORATORY_CANDIDATE" | "UNDECIDED_CANDIDATE";
  questionId: string;
  objectiveIds: string[];
  hypothesisIds: string[];
  variableIds: string[];
  populationId: string;
  timingIds: string[];
  analysisRequirementIds: string[];
  measurementMethod: string;
  justification: string;
  limitations: string[];
  humanDecisionRequired: true;
};

export type AnalysisRequirement = {
  requirementId: string;
  purpose: "DESCRIPTION" | "COMPARISON" | "ASSOCIATION" | "PREDICTION" | "CHANGE_OVER_TIME" | "REPEATED_MEASURES" | "AGREEMENT" | "VALIDATION" | "TIME_TO_EVENT" | "CENTER_EFFECT" | "ADJUSTMENT";
  reason: string;
  endpointIds: string[];
  variableIds: string[];
  dependencies: string[];
  finalStatisticalModel: null;
  biostatisticsReviewRequired: true;
};

export type ResearchProjectDesignResult = {
  contractVersion: typeof RESEARCH_PROJECT_CONSTRUCTION_VERSION;
  inputVersion: typeof RESEARCH_PROJECT_CONSTRUCTION_VERSION;
  resultId: string;
  resultDigest: string;
  status: "PROJECT_CANDIDATES" | "PARTIAL_PROJECT" | "REFUSED";
  projectionNotice: "RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH";
  scientificQuestion: ResearchProjectConstructionInput["confirmedScientificQuestion"];
  objectives: ResearchProjectConstructionInput["objectives"];
  hypotheses: ResearchProjectConstructionInput["hypotheses"];
  populationDesign: PopulationDesign;
  studyDesignCandidates: StudyDesignCandidate[];
  selectedStudyDesignCandidate: null | { designId: string; decisionRecordId: string; humanSelected: true };
  groups: ProjectGroup[];
  comparators: Array<{ comparatorId: string; groupIds: string[]; kind: string; justification: string; reviewState: ProjectReviewState }>;
  visits: ProjectVisit[];
  temporalStructure: {
    rationale: string;
    anchor: string | null;
    biologicalWindows: string[];
    operationalWindows: Array<{ requirement: string; status: "FUTURE_DEFINITION_REQUIRED" }>;
    repeatedMeasures: boolean;
    unknowns: string[];
  };
  endpointCandidates: EndpointCandidate[];
  variables: ProjectVariable[];
  measurementDependencies: Array<{ dependencyId: string; measurementRef: string; requiredFor: string[]; reason: string; status: "KNOWN" | "PARTIAL" | "UNKNOWN" }>;
  analysisRequirements: AnalysisRequirement[];
  sizingRequirements: {
    status: "SPECIALIZED_ENGINE_REQUIRED";
    inputs: Array<{ name: string; value: null; source: "UNKNOWN"; requiredWhen: string; reason: string }>;
    sampleSize: null;
    power: null;
    notice: "NO_STATISTICAL_VALUE_INVENTED";
  };
  imagingContribution: {
    applicability: "APPLICABLE" | "NOT_APPLICABLE" | "REQUIRED_BUT_NOT_READY";
    resultRef: string | null;
    variableIds: string[];
    acquisitionRefs: string[];
    qualityRefs: string[];
    limitations: string[];
  };
  dataManagementRequirements: Array<{ requirementId: string; kind: string; reason: string; sourceRefs: string[]; status: "SPECIALIZED_ENGINE_REQUIRED" }>;
  biostatisticsRequirements: {
    status: "SPECIALIZED_ENGINE_REQUIRED";
    questionRef: string;
    hypothesisIds: string[];
    designCandidateIds: string[];
    groupIds: string[];
    endpointIds: string[];
    variableIds: string[];
    timingIds: string[];
    repeatedMeasures: boolean;
    multicenterStructure: string;
    analysisPurposes: string[];
    knownAssumptions: string[];
    unknownAssumptions: string[];
    missingNumericalInputs: string[];
  };
  regulatoryQuestions: Array<{ questionId: string; question: string; trigger: string; status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }>;
  safetyQuestions: Array<{ questionId: string; question: string; trigger: string; status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }>;
  economicsQuestions: Array<{ questionId: string; question: string; trigger: string; status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" | "FUNDING_STRATEGY_REQUIRES_SPECIALIZED_REVIEW" }>;
  operationsQuestions: Array<{ questionId: string; question: string; trigger: string; status: "NOT_EVALUATED_BY_SPECIALIZED_ENGINE" }>;
  feasibilityAssessment: Array<{ domain: string; state: SpecializedEvaluationState; basis: string[]; gaps: string[]; specializedEngine: string | null }>;
  recruitmentModelRequirements: {
    status: "REQUIREMENTS_ONLY";
    raritySignal: "PRESENT" | "ABSENT" | "UNKNOWN";
    inputs: Array<{ name: string; value: null; source: "UNKNOWN"; reason: string }>;
    centerCount: null;
    recruitmentRate: null;
    recruitmentDuration: null;
  };
  multicenterAssessment: {
    declaredMode: string;
    scientificNecessity: "POSSIBLE" | "NOT_DEMONSTRATED" | "UNKNOWN";
    operationalNecessity: "POSSIBLE" | "NOT_EVALUATED_BY_SPECIALIZED_ENGINE";
    factors: string[];
    monocenterAlternativePreserved: boolean;
    centerCount: null;
    notice: "MULTICENTER_IS_NOT_AUTOMATICALLY_SUPERIOR";
  };
  biases: Array<{ biasId: string; label: string; justification: string; affectedIds: string[]; mitigationCandidate: string; provenance: string[] }>;
  confounders: Array<{ confounderId: string; label: string; whyPlausible: string; affectedIds: string[]; measurementNeed: string; knowledgeSupport: "SUPPORTED" | "UNKNOWN"; biostatisticsDecisionRequired: true }>;
  risks: Array<{ riskId: string; source: string; affectedIds: string[]; probability: null; impact: string; detectability: string; mitigationCandidate: string; futureOwner: string; provenance: string[] }>;
  limitations: string[];
  contradictions: string[];
  missingInformation: string[];
  alternatives: Array<{ alternativeId: string; designId: string; label: string; enables: string[]; cannotEstablish: string[]; requirements: string[]; risks: string[]; timingConsequences: string[]; endpointConsequences: string[]; dataConsequences: string[]; specializedNeeds: string[]; uncertainty: string; reviewState: ProjectReviewState }>;
  compromises: Array<{ compromiseId: string; options: string[]; gains: string[]; losses: string[]; nonCompensableItems: string[]; humanDecisionRequired: true }>;
  decisionsRequired: Array<{ gateId: string; type: string; label: string; reason: string; targetIds: string[]; status: "PENDING" | "APPROVED" | "REJECTED" }>;
  dependencies: Array<{ dependencyId: string; from: string; to: string; reason: string; changeEffect: ProjectImpactState }>;
  impactGraph: {
    ontologyStatus: "NO_NEW_ONTOLOGY_RUNTIME_PROJECTION";
    nodes: Array<{ nodeId: string; type: string; label: string; status: string; whyExists: string }>;
    edges: Array<{ edgeId: string; from: string; to: string; relation: string }>;
    changes: ProjectChange[];
    impacts: ProjectImpact[];
  };
  localReadiness: Array<{ domain: string; state: SpecializedEvaluationState; requirementsSatisfied: string[]; openItems: string[] }>;
  projectionReadiness: Array<{ projection: "Protocol" | "Synopsis" | "Funding" | "Publication" | "CRF" | "Data Dictionary" | "SAP" | "Budget" | "Timeline" | "CPP" | "ANSM" | "Core Lab Manual" | "Monitoring Plan" | "Investigator Guide"; availability: ProjectionAvailability; basis: string[]; missing: string[]; notice: "DATA_AVAILABILITY_ONLY_NOT_APPROVAL" }>;
  adaptiveQuestions: Array<{ questionId: string; label: string; whyAsked: string; decisionImpact: string; decisionBlock: string; suggestedAnswers: Array<{ value: string; label: string; consequence: string }>; acceptsFreeText: true; acceptsUnknown: true; answeredValue: string | null }>;
  candidateVersion: {
    versionId: string;
    priorVersion: string;
    status: "CANDIDATE_NOT_FROZEN" | "FROZEN_BY_HUMAN";
    objectRefs: string[];
    decisionRecordIds: string[];
    knowledgeResultRef: string | null;
    unknowns: string[];
    contradictions: string[];
    limitations: string[];
    dependencies: string[];
    changesFromPrevious: string[];
    frozenAt: string | null;
    actor: string | null;
    mandateRef: string | null;
  };
  documentHandoff: {
    handoffVersion: "1.0";
    status: "NOT_READY" | "READY_FOR_HUMAN_AUTHORIZATION" | "AUTHORIZED";
    projectId: string;
    candidateVersionRef: string;
    includedSections: string[];
    specializedEngineRequirements: string[];
    decisionRecordIds: string[];
    blockedBy: string[];
    boundary: "NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS";
  };
  provenance: { engineVersion: typeof RESEARCH_PROJECT_CONSTRUCTION_VERSION; inputRef: string; sourceRefs: string[]; policyRefs: string[]; llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION" };
  trace: Array<{ sequence: number; operation: string; mode: "DETERMINISTIC" | "HUMAN_REQUIRED" | "FORBIDDEN"; decision: string; inputDigest: string; outputDigest: string }>;
  refusal: null | { code: "QUESTION_NOT_CONFIRMED" | "IMAGING_HANDOFF_NOT_READY" | "STRUCTURING_CONTRADICTION"; reason: string; resumeCondition: string };
};

export type ProjectChangeEvent = "PopulationChanged" | "StudyDesignChanged" | "GroupChanged" | "VisitChanged" | "EndpointChanged" | "VariableChanged" | "TimingChanged" | "ImagingStrategyChanged" | "ConstraintChanged" | "KnowledgeUpdated" | "DecisionReopened";
export type ProjectChange = { changeId: string; eventType: ProjectChangeEvent; kind: "MAJOR"; description: string; sourceIds: string[]; targetIds: string[]; status: "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED"; requiresHumanConfirmation: true };
export type ProjectImpact = { impactId: string; changeId: string; targetId: string; targetType: string; state: ProjectImpactState; reason: string };

export type ProjectDecisionRecord = {
  decisionId: string;
  gateId: string;
  decision: "APPROVED" | "REJECTED";
  targetIds: string[];
  reason: string;
  actor: string;
  mandateRef: string | null;
  decidedAt: string;
};

export type ResearchProjectControls = {
  selectedDesignId?: string | null;
  answers?: Record<string, string>;
  gateStatuses?: Record<string, "PENDING" | "APPROVED" | "REJECTED">;
  endpointRoles?: Record<string, EndpointCandidate["proposedRole"]>;
  changes?: ProjectChange[];
  impacts?: ProjectImpact[];
  decisionRecordIds?: string[];
  versionDecisionRecordIds?: string[];
  studyDesignDecisionId?: string | null;
  priorFrozenVersionId?: string | null;
  frozenVersion?: { actor: string; mandateRef: string | null; frozenAt: string } | null;
};

export type ResearchProjectConstructionSession = {
  input: ResearchProjectConstructionInput;
  result: ResearchProjectDesignResult;
  controls: ResearchProjectControls;
  decisionHistory: ProjectDecisionRecord[];
  versionHistory: ResearchProjectDesignResult["candidateVersion"][];
  revisions: number;
};

const stringArray = z.array(z.string().min(1).max(4_000)).max(1_000);
export const researchProjectConstructionInputSchema = z.object({
  contractVersion: z.literal(RESEARCH_PROJECT_CONSTRUCTION_VERSION), inputId: z.string(), projectId: z.string(), strategyVersion: z.string(),
  sourceHandoffs: z.object({ scientificThinking: z.object({ status: z.enum(["AUTHORIZED", "VALIDATED_CONTEXT"]), outputRef: z.string().nullable() }).strict(), imaging: z.object({ status: z.enum(["FROZEN_BY_HUMAN", "NOT_APPLICABLE", "REQUIRED_BUT_NOT_READY"]), resultRef: z.string().nullable() }).strict() }).strict(),
  confirmedScientificQuestion: z.object({ questionId: z.string(), text: z.string().min(3), confirmation: z.enum(["HUMAN_CONFIRMED", "VALIDATED_CONTEXT"]) }).strict(),
  objectives: z.array(z.object({ objectiveId: z.string(), text: z.string(), level: z.enum(["PRIMARY", "SECONDARY", "EXPLORATORY"]), reviewState: z.enum(["PENDING", "ADOPTED", "REJECTED"]) }).strict()),
  hypotheses: z.array(z.object({ hypothesisId: z.string(), text: z.string(), kind: z.enum(["PRIMARY", "ALTERNATIVE", "NULL_OR_COMPETING"]), reviewState: z.enum(["PENDING", "ADOPTED", "REJECTED"]) }).strict()),
  mechanisms: z.array(z.object({ mechanismId: z.string(), text: z.string(), support: z.string() }).strict()),
  scientificContext: z.object({ centralScientificObject: z.string(), pathologyOrCondition: stringArray, phenomena: stringArray, outcomes: stringArray, exposuresOrInterventions: stringArray, studyDesignDeclarations: stringArray, centerDeclarations: stringArray, availableData: stringArray, methodPreferences: stringArray }).strict(),
  knowledgeResults: z.object({ resultId: z.string().nullable(), resultDigest: z.string().nullable(), coverageStatus: z.string(), assertions: z.array(z.object({ assertionId: z.string(), text: z.string(), applicability: z.string(), sourceRef: z.string() }).strict()), gaps: z.array(z.object({ code: z.string(), explanation: z.string(), resumeCondition: z.string() }).strict()), limitations: stringArray }).strict(),
  imagingDesignResult: z.unknown().nullable(), knownPopulationInformation: stringArray, knownTemporalInformation: stringArray, knownConstraints: stringArray, existingDecisions: stringArray, uncertainties: stringArray, contradictions: stringArray,
  userProvidedInformation: z.array(z.object({ informationId: z.string(), kind: z.string(), value: z.string(), provenanceRef: z.string() }).strict()), provenance: stringArray,
  trace: z.array(z.object({ sequence: z.number().int().positive(), operation: z.string(), decision: z.string(), inputDigest: z.string(), outputDigest: z.string() }).strict()),
}).strict();

const requiredResultKeys = ["scientificQuestion", "objectives", "hypotheses", "populationDesign", "studyDesignCandidates", "selectedStudyDesignCandidate", "groups", "comparators", "visits", "temporalStructure", "endpointCandidates", "variables", "measurementDependencies", "analysisRequirements", "sizingRequirements", "imagingContribution", "dataManagementRequirements", "biostatisticsRequirements", "regulatoryQuestions", "safetyQuestions", "economicsQuestions", "operationsQuestions", "feasibilityAssessment", "recruitmentModelRequirements", "multicenterAssessment", "biases", "confounders", "risks", "limitations", "contradictions", "missingInformation", "alternatives", "compromises", "decisionsRequired", "dependencies", "impactGraph", "localReadiness", "projectionReadiness", "adaptiveQuestions", "candidateVersion", "documentHandoff", "provenance", "trace"] as const;
export const researchProjectDesignResultSchema = z.object({
  contractVersion: z.literal(RESEARCH_PROJECT_CONSTRUCTION_VERSION), inputVersion: z.literal(RESEARCH_PROJECT_CONSTRUCTION_VERSION), resultId: z.string(), resultDigest: z.string(), status: z.enum(["PROJECT_CANDIDATES", "PARTIAL_PROJECT", "REFUSED"]), projectionNotice: z.literal("RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH"),
  ...Object.fromEntries(requiredResultKeys.map((key) => [key, z.unknown()])), refusal: z.unknown().nullable(),
}).strict();

export const researchProjectConstructionSessionSchema = z.object({
  input: researchProjectConstructionInputSchema,
  result: researchProjectDesignResultSchema,
  controls: z.object({ selectedDesignId: z.string().nullable().optional(), answers: z.record(z.string()).optional(), gateStatuses: z.record(z.enum(["PENDING", "APPROVED", "REJECTED"])).optional(), endpointRoles: z.record(z.enum(["PRIMARY_CANDIDATE", "SECONDARY_CANDIDATE", "EXPLORATORY_CANDIDATE", "UNDECIDED_CANDIDATE"])).optional(), changes: z.array(z.unknown()).optional(), impacts: z.array(z.unknown()).optional(), decisionRecordIds: stringArray.optional(), versionDecisionRecordIds: stringArray.optional(), studyDesignDecisionId: z.string().nullable().optional(), priorFrozenVersionId: z.string().nullable().optional(), frozenVersion: z.object({ actor: z.string(), mandateRef: z.string().nullable(), frozenAt: z.string() }).nullable().optional() }).strict(),
  decisionHistory: z.array(z.object({ decisionId: z.string(), gateId: z.string(), decision: z.enum(["APPROVED", "REJECTED"]), targetIds: stringArray, reason: z.string(), actor: z.string(), mandateRef: z.string().nullable(), decidedAt: z.string() }).strict()),
  versionHistory: z.array(z.unknown()),
  revisions: z.number().int().positive(),
}).strict();

export const parseResearchProjectConstructionInput = (value: unknown) => researchProjectConstructionInputSchema.parse(value) as ResearchProjectConstructionInput;
export const parseResearchProjectDesignResult = (value: unknown) => researchProjectDesignResultSchema.parse(value) as ResearchProjectDesignResult;
