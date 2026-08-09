import { z } from "zod";

export const IMAGING_STUDY_DESIGNER_VERSION = "1.0.0" as const;

export type SupportState = "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNKNOWN" | "NOT_APPLICABLE" | "CONFLICTING";
export type HumanReviewState = "PENDING" | "ADOPTED" | "REJECTED";
export type ImpactState = "PRESERVED" | "REVIEW_REQUIRED" | "INVALIDATED" | "OBSOLETE" | "NEWLY_REQUIRED" | "UNAFFECTED_DEMONSTRATED";

export type ImagingKnowledgeConcept = {
  conceptId: string;
  label: string;
  objectType: string;
  resolutionKind: string;
  originalTerms: string[];
};

export type ImagingKnowledgeStatement = {
  statementId: string;
  text: string;
  conceptIds: string[];
  status: string;
  applicability: string;
  sourceId: string;
  locator: string;
  limitations: string[];
  modality: string | null;
};

export type ImagingDesignInput = {
  contractVersion: typeof IMAGING_STUDY_DESIGNER_VERSION;
  inputId: string;
  researchProjectId: string | null;
  strategyVersion: string;
  sourceHandoff: {
    kind: "AUTHORIZED_ST_HANDOFF" | "VALIDATED_DESIGN_CONTEXT";
    stOutputRef: string | null;
    status: "AUTHORIZED" | "VALIDATED_WITHOUT_ST_HANDOFF";
    boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN";
  };
  originalExpression: string;
  confirmedScientificQuestion: { questionId: string; text: string; confirmation: "HUMAN_CONFIRMED" | "VALIDATED_CONTEXT" };
  objectives: Array<{ objectiveId: string; text: string; level: "PRIMARY" | "SECONDARY" | "EXPLORATORY"; reviewState: HumanReviewState }>;
  hypotheses: Array<{ hypothesisId: string; text: string; kind: "PRIMARY" | "ALTERNATIVE" | "NULL_OR_COMPETING"; reviewState: HumanReviewState }>;
  mechanisms: Array<{ mechanismId: string; text: string; support: string }>;
  centralScientificObject: string;
  scientificObjectTerms: string[];
  pathologyOrCondition: string[];
  populationContext: string[];
  temporalContext: string[];
  phenomenaDeclared: string[];
  outcomesDeclared: string[];
  methodPreferences: string[];
  knownConstraints: string[];
  declaredEquipment: Array<{
    equipmentId: string;
    siteLabel: string;
    modality: string | null;
    manufacturer: string | null;
    model: string | null;
    fieldStrength: string | null;
    softwareVersion: string | null;
    options: string[];
    availability: "KNOWN_AVAILABLE" | "DECLARED_AVAILABLE" | "UNKNOWN" | "KNOWN_UNAVAILABLE";
    period: string | null;
    provenanceRef: string;
  }>;
  centerContext: { mode: "MONOCENTRIC" | "MULTICENTRIC_HOMOGENEOUS" | "MULTICENTRIC_HETEROGENEOUS" | "MULTICENTRIC_HETEROGENEITY_UNKNOWN" | "UNKNOWN"; declarations: string[] };
  knowledge: {
    resultId: string | null;
    resultDigest: string | null;
    coverageStatus: string;
    concepts: ImagingKnowledgeConcept[];
    assertions: ImagingKnowledgeStatement[];
    documentaryStatements: ImagingKnowledgeStatement[];
    gaps: Array<{ code: string; explanation: string; affectedConceptIds: string[]; resumeCondition: string }>;
    limitations: string[];
    sourceIds: string[];
    matchingSemantics: "EXACT_FIRST_NO_IMPLICIT_FALLBACK" | "NO_RESULT";
  };
  decisions: string[];
  uncertainties: string[];
  contradictions: string[];
  safetyFlags: string[];
  provenance: string[];
  trace: Array<{ sequence: number; operation: string; decision: string; inputDigest: string; outputDigest: string }>;
};

export type PhenomenonCandidate = {
  phenomenonId: string;
  label: string;
  role: "PRIMARY" | "SECONDARY" | "ALTERNATIVE" | "UNCERTAIN";
  objectiveIds: string[];
  hypothesisIds: string[];
  mechanismIds: string[];
  context: string[];
  observability: "INDIRECT_ONLY" | "TO_BE_ESTABLISHED";
  knowledgeSupport: SupportState;
  evidenceRefs: string[];
  limitations: string[];
  confounders: string[];
  unknowns: string[];
  reviewState: HumanReviewState;
};

export type BiomarkerCandidate = {
  biomarkerId: string;
  label: string;
  conceptId: string;
  phenomenonIds: string[];
  objectiveIds: string[];
  measurementType: string;
  quantification: SupportState;
  domainOfValidity: string[];
  dependencies: string[];
  technicalSensitivity: SupportState;
  timingSensitivity: SupportState;
  reproducibility: SupportState;
  limitations: string[];
  confounders: string[];
  evidenceRefs: string[];
  applicability: SupportState;
  knowledgeGaps: string[];
  reviewState: HumanReviewState;
};

export type ModalityCandidate = {
  modalityId: string;
  label: string;
  conceptId: string;
  biomarkerIds: string[];
  phenomenonIds: string[];
  role: "CANDIDATE";
  support: SupportState;
  dimensions: Record<string, SupportState>;
  dependencies: string[];
  limitations: string[];
  risks: string[];
  evidenceRefs: string[];
  reviewState: HumanReviewState;
};

export type AcquisitionStrategy = {
  acquisitionId: string;
  modalityId: string;
  biomarkerIds: string[];
  role: "INDISPENSABLE_CANDIDATE" | "SECONDARY_CANDIDATE" | "EXPLORATORY_CANDIDATE";
  level1: { status: "CONCEPTUAL_STRATEGY"; measurementNeed: string; scientificReason: string };
  level2: {
    status: "METHODOLOGICAL_ACQUISITION_PLAN";
    acquisitionFamily: string;
    conditions: string[];
    dependencies: string[];
    timingRequirements: string[];
    qualityRequirements: string[];
    siteVariants: string[];
  };
  level3: {
    status: "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE";
    reason: string;
    forbiddenParameterFamilies: string[];
  };
  consequenceIfRemoved: string;
  reviewState: HumanReviewState;
};

export type ImagingGraphNodeType = "QUESTION" | "OBJECTIVE" | "HYPOTHESIS" | "PHENOMENON" | "BIOMARKER" | "MODALITY" | "ACQUISITION" | "MEASUREMENT_CONDITION" | "QUALITY_CONTROL" | "IMAGE_ANALYSIS" | "VARIABLE" | "ENDPOINT_CONTRIBUTION";
export type ImagingDecisionGraph = {
  projectionVersion: "RUNTIME_PROJECTION_1.0";
  ontologyStatus: "NO_NEW_ONTOLOGY";
  nodes: Array<{ nodeId: string; type: ImagingGraphNodeType; label: string; status: "CONFIRMED" | "CANDIDATE" | "OPEN" | "BLOCKED"; sourceRef: string }>;
  edges: Array<{ edgeId: string; from: string; to: string; relation: "ADDRESSES" | "INFORMS" | "IMPLICATES" | "APPROXIMATES" | "REQUIRES" | "PRODUCES" | "PROTECTS" | "ANALYZES" | "CONTRIBUTES_TO" }>;
  brokenChains: Array<{ code: string; label: string; affectedIds: string[]; consequence: string; visible: true }>;
};

export type ImagingDesignResult = {
  contractVersion: typeof IMAGING_STUDY_DESIGNER_VERSION;
  inputVersion: typeof IMAGING_STUDY_DESIGNER_VERSION;
  resultId: string;
  resultDigest: string;
  status: "STRATEGY_CANDIDATES" | "CLARIFICATION_REQUIRED" | "REFUSED" | "RETURN_TO_SCIENTIFIC_THINKING";
  projectionNotice: "RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE";
  scientificQuestion: ImagingDesignInput["confirmedScientificQuestion"];
  objectives: ImagingDesignInput["objectives"];
  hypotheses: ImagingDesignInput["hypotheses"];
  phenomena: PhenomenonCandidate[];
  biomarkerCandidates: BiomarkerCandidate[];
  biomarkerComparison: Array<{ comparisonId: string; candidateIds: string[]; dimensions: Record<string, Record<string, SupportState>>; notice: "NO_AUTOMATIC_RANKING" }>;
  modalityCandidates: ModalityCandidate[];
  modalityComparison: Array<{ comparisonId: string; candidateIds: string[]; scientificNeed: string; dimensions: Record<string, Record<string, SupportState>>; notice: "NO_AUTOMATIC_RANKING" }>;
  acquisitionStrategies: AcquisitionStrategy[];
  equipmentAssessment: Array<{
    assessmentId: string;
    equipmentId: string;
    acquisitionId: string;
    availability: ImagingDesignInput["declaredEquipment"][number]["availability"];
    compatibility: "EXACT_MATCH" | "COMPATIBLE_WITH_LIMITATIONS" | "UNKNOWN_COMPATIBILITY" | "INCOMPATIBLE";
    gaps: string[];
    evidenceRefs: string[];
    assumptionForbidden: true;
  }>;
  timingStrategy: Array<{ timingId: string; type: "BIOLOGICAL_TIMING" | "METHODOLOGICAL_TIMING" | "OPERATIONAL_TIMING" | "IMPOSED_TIMING" | "UNKNOWN_TIMING"; value: string; justification: string; linkedIds: string[]; support: SupportState }>;
  harmonizationStrategy: {
    centerMode: ImagingDesignInput["centerContext"]["mode"];
    commonCore: string[];
    acceptableVariants: string[];
    variantsToQualify: string[];
    incompatibilities: string[];
    unknowns: string[];
    bridgeStudy: SupportState;
    futureAnalyticalStratification: SupportState;
    additionalQualityControls: string[];
  };
  qualityStrategy: Array<{
    ruleId: string;
    objectId: string;
    surface: "SITE" | "EQUIPMENT" | "ACQUISITION" | "COMPLETENESS" | "ARTEFACT" | "RECONSTRUCTION" | "TRANSFER" | "MEASUREMENT" | "READING" | "DERIVATION" | "REPRODUCIBILITY";
    timing: "BEFORE_ACQUISITION" | "DURING_ACQUISITION" | "BEFORE_ANALYSIS" | "DURING_ANALYSIS";
    method: string;
    acceptanceConcept: string;
    responsibleActor: string;
    consequenceOfFailure: string;
    provenanceRef: string;
  }>;
  nonEvaluabilityRules: Array<{
    ruleId: string;
    state: "MISSING" | "NOT_ACQUIRED" | "INCOMPLETE" | "TECHNICALLY_INVALID" | "QA_REJECTED" | "ANALYZABLE_WITH_LIMITATIONS" | "BIOLOGICALLY_NEGATIVE";
    cause: string;
    stage: string;
    predictability: SupportState;
    recoverability: SupportState;
    repeatPossible: SupportState;
    variableIds: string[];
    endpointContributionIds: string[];
    qualityRuleIds: string[];
    proposedAction: string;
    humanDecisionRequired: true;
  }>;
  imageAnalysisStrategy: Array<{
    analysisId: string;
    acquisitionIds: string[];
    biomarkerIds: string[];
    operationNeeds: string[];
    readingModel: string;
    outputs: string[];
    reproducibilityNeed: string;
    boundary: "NO_IMAGE_PROCESSING_NO_STATISTICAL_ANALYSIS";
    reviewState: HumanReviewState;
  }>;
  imagingVariables: Array<{
    variableId: string;
    definition: string;
    questionId: string;
    objectiveIds: string[];
    hypothesisIds: string[];
    phenomenonIds: string[];
    biomarkerIds: string[];
    acquisitionIds: string[];
    qualityRuleIds: string[];
    analysisIds: string[];
    unit: string | null;
    timingIds: string[];
    nonEvaluabilityRuleIds: string[];
    provenance: string[];
    limitations: string[];
  }>;
  endpointContributions: Array<{
    contributionId: string;
    variableId: string;
    proposedRole: "UNDECIDED_CANDIDATE";
    timingIds: string[];
    measurementMethod: string;
    qualityRuleIds: string[];
    nonEvaluabilityRuleIds: string[];
    dependencies: string[];
    limitations: string[];
    statisticalAnalysisStillRequired: true;
    humanDecisionRequired: true;
  }>;
  coreLabAssessment: {
    status: "HUMAN_ASSESSMENT_REQUIRED";
    factors: string[];
    options: Array<"NO_CORE_LAB" | "LOCAL_READING_WITH_STANDARDIZATION" | "CENTRAL_QA" | "CENTRAL_READING" | "HYBRID">;
    unknowns: string[];
    notice: "NO_AUTOMATIC_OPTIMUM";
  };
  alternatives: Array<{
    alternativeId: string;
    label: string;
    preserves: string[];
    changes: string[];
    losses: string[];
    risks: string[];
    unknowns: string[];
    decisionsToReopen: string[];
    reviewState: HumanReviewState;
  }>;
  compromises: string[];
  dependencies: string[];
  missingInformation: string[];
  contradictions: string[];
  limitations: string[];
  risks: string[];
  decisionsRequired: Array<{ gateId: string; type: string; label: string; reason: string; status: "PENDING" | "APPROVED" | "REJECTED"; targetIds: string[] }>;
  adaptiveQuestions: Array<{
    questionId: string;
    label: string;
    whyAsked: string;
    decisionImpact: string;
    decisionBlock: string;
    suggestedAnswers: Array<{ value: string; label: string; consequence: string }>;
    acceptsFreeText: true;
    acceptsUnknown: true;
    answeredValue: string | null;
  }>;
  changes: Array<{ changeId: string; kind: "MINOR" | "MAJOR"; eventType: string; description: string; status: "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED"; requiresHumanConfirmation: boolean }>;
  impacts: Array<{ impactId: string; changeId: string; targetId: string; targetType: string; state: ImpactState; reason: string }>;
  graph: ImagingDecisionGraph;
  knowledgeHandoff: { requestRef: string | null; resultRef: string | null; resultDigest: string | null; coverageStatus: string; gapCodes: string[]; noClosestCorpusFallback: true };
  projectConstructionHandoff: {
    handoffVersion: "1.0";
    status: "NOT_READY" | "READY_FOR_HUMAN_FREEZE" | "FROZEN_BY_HUMAN";
    resultRef: string;
    includedSections: string[];
    excludedSections: ["STATISTICAL_SIZING", "COMPLETE_BUDGET", "FINAL_CRF", "REGULATORY_PLAN", "COMPLETE_OPERATIONAL_PLAN", "FINAL_SUBMISSION_PROTOCOL"];
    decisionRecordIds: string[];
    blockedBy: string[];
  };
  refusal: null | { code: "PATIENT_LEVEL" | "NO_DEFENSIBLE_IMAGING_CHAIN" | "ST_HANDOFF_NOT_AUTHORIZED"; reason: string; resumeCondition: string };
  nextActions: string[];
  provenance: { engineVersion: typeof IMAGING_STUDY_DESIGNER_VERSION; inputRef: string; knowledgeResultRef: string | null; sourceRefs: string[]; policyRefs: ["RDE-001", "RDE-002", "RDE-003", "KE-001", "ST-001"]; llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION" };
  trace: Array<{ sequence: number; operation: string; mode: "DETERMINISTIC" | "HUMAN_REQUIRED" | "FORBIDDEN"; decision: string; inputDigest: string; outputDigest: string }>;
};

export type ImagingDesignControls = {
  phenomenonReviews?: Record<string, HumanReviewState>;
  biomarkerReviews?: Record<string, HumanReviewState>;
  modalityReviews?: Record<string, HumanReviewState>;
  acquisitionReviews?: Record<string, HumanReviewState>;
  analysisReviews?: Record<string, HumanReviewState>;
  answers?: Record<string, string>;
  gateStatuses?: Record<string, "PENDING" | "APPROVED" | "REJECTED">;
  changes?: ImagingDesignResult["changes"];
  impacts?: ImagingDesignResult["impacts"];
  decisionRecordIds?: string[];
};

export type ImagingDesignSession = {
  input: ImagingDesignInput;
  result: ImagingDesignResult;
  controls: ImagingDesignControls;
  decisionHistory: Array<{ decisionId: string; gateId: string; decision: "APPROVED" | "REJECTED"; targetIds: string[]; reason: string; decidedAt: string }>;
  revisions: number;
};

const stringArray = z.array(z.string().min(1).max(4_000)).max(500);
const knowledgeStatementSchema = z.object({
  statementId: z.string(), text: z.string(), conceptIds: stringArray, status: z.string(), applicability: z.string(),
  sourceId: z.string(), locator: z.string(), limitations: stringArray, modality: z.string().nullable(),
}).strict();

export const imagingDesignInputSchema = z.object({
  contractVersion: z.literal(IMAGING_STUDY_DESIGNER_VERSION), inputId: z.string(), researchProjectId: z.string().nullable(), strategyVersion: z.string(),
  sourceHandoff: z.object({ kind: z.enum(["AUTHORIZED_ST_HANDOFF", "VALIDATED_DESIGN_CONTEXT"]), stOutputRef: z.string().nullable(), status: z.enum(["AUTHORIZED", "VALIDATED_WITHOUT_ST_HANDOFF"]), boundary: z.literal("NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN") }).strict(),
  originalExpression: z.string().min(3).max(4_000),
  confirmedScientificQuestion: z.object({ questionId: z.string(), text: z.string(), confirmation: z.enum(["HUMAN_CONFIRMED", "VALIDATED_CONTEXT"]) }).strict(),
  objectives: z.array(z.object({ objectiveId: z.string(), text: z.string(), level: z.enum(["PRIMARY", "SECONDARY", "EXPLORATORY"]), reviewState: z.enum(["PENDING", "ADOPTED", "REJECTED"]) }).strict()),
  hypotheses: z.array(z.object({ hypothesisId: z.string(), text: z.string(), kind: z.enum(["PRIMARY", "ALTERNATIVE", "NULL_OR_COMPETING"]), reviewState: z.enum(["PENDING", "ADOPTED", "REJECTED"]) }).strict()),
  mechanisms: z.array(z.object({ mechanismId: z.string(), text: z.string(), support: z.string() }).strict()),
  centralScientificObject: z.string(), scientificObjectTerms: stringArray, pathologyOrCondition: stringArray, populationContext: stringArray,
  temporalContext: stringArray, phenomenaDeclared: stringArray, outcomesDeclared: stringArray, methodPreferences: stringArray, knownConstraints: stringArray,
  declaredEquipment: z.array(z.object({ equipmentId: z.string(), siteLabel: z.string(), modality: z.string().nullable(), manufacturer: z.string().nullable(), model: z.string().nullable(), fieldStrength: z.string().nullable(), softwareVersion: z.string().nullable(), options: stringArray, availability: z.enum(["KNOWN_AVAILABLE", "DECLARED_AVAILABLE", "UNKNOWN", "KNOWN_UNAVAILABLE"]), period: z.string().nullable(), provenanceRef: z.string() }).strict()),
  centerContext: z.object({ mode: z.enum(["MONOCENTRIC", "MULTICENTRIC_HOMOGENEOUS", "MULTICENTRIC_HETEROGENEOUS", "MULTICENTRIC_HETEROGENEITY_UNKNOWN", "UNKNOWN"]), declarations: stringArray }).strict(),
  knowledge: z.object({ resultId: z.string().nullable(), resultDigest: z.string().nullable(), coverageStatus: z.string(), concepts: z.array(z.object({ conceptId: z.string(), label: z.string(), objectType: z.string(), resolutionKind: z.string(), originalTerms: stringArray }).strict()), assertions: z.array(knowledgeStatementSchema), documentaryStatements: z.array(knowledgeStatementSchema), gaps: z.array(z.object({ code: z.string(), explanation: z.string(), affectedConceptIds: stringArray, resumeCondition: z.string() }).strict()), limitations: stringArray, sourceIds: stringArray, matchingSemantics: z.enum(["EXACT_FIRST_NO_IMPLICIT_FALLBACK", "NO_RESULT"]) }).strict(),
  decisions: stringArray, uncertainties: stringArray, contradictions: stringArray, safetyFlags: stringArray, provenance: stringArray,
  trace: z.array(z.object({ sequence: z.number().int().positive(), operation: z.string(), decision: z.string(), inputDigest: z.string(), outputDigest: z.string() }).strict()),
}).strict();

const resultRequiredKeys = [
  "scientificQuestion", "objectives", "hypotheses", "phenomena", "biomarkerCandidates", "modalityCandidates", "acquisitionStrategies",
  "equipmentAssessment", "timingStrategy", "harmonizationStrategy", "qualityStrategy", "imageAnalysisStrategy", "imagingVariables",
  "endpointContributions", "nonEvaluabilityRules", "coreLabAssessment", "alternatives", "compromises", "dependencies", "missingInformation",
  "contradictions", "limitations", "risks", "decisionsRequired", "nextActions", "provenance", "trace",
] as const;

export const imagingDesignResultSchema = z.object({
  contractVersion: z.literal(IMAGING_STUDY_DESIGNER_VERSION), inputVersion: z.literal(IMAGING_STUDY_DESIGNER_VERSION), resultId: z.string(), resultDigest: z.string(),
  status: z.enum(["STRATEGY_CANDIDATES", "CLARIFICATION_REQUIRED", "REFUSED", "RETURN_TO_SCIENTIFIC_THINKING"]),
  projectionNotice: z.literal("RUNTIME_PROJECTION_DOES_NOT_OWN_CANONICAL_SCIENCE"),
  ...Object.fromEntries(resultRequiredKeys.map((key) => [key, z.unknown()])),
  biomarkerComparison: z.array(z.unknown()), modalityComparison: z.array(z.unknown()), changes: z.array(z.unknown()), impacts: z.array(z.unknown()), graph: z.unknown(),
  knowledgeHandoff: z.unknown(), projectConstructionHandoff: z.unknown(), adaptiveQuestions: z.array(z.unknown()), refusal: z.unknown().nullable(),
}).strict();

export const imagingDesignSessionSchema = z.object({
  input: imagingDesignInputSchema,
  result: imagingDesignResultSchema,
  controls: z.object({
    phenomenonReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])).optional(),
    biomarkerReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])).optional(),
    modalityReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])).optional(),
    acquisitionReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])).optional(),
    analysisReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])).optional(),
    answers: z.record(z.string()).optional(), gateStatuses: z.record(z.enum(["PENDING", "APPROVED", "REJECTED"])).optional(),
    changes: z.array(z.unknown()).optional(), impacts: z.array(z.unknown()).optional(), decisionRecordIds: stringArray.optional(),
  }).strict(),
  decisionHistory: z.array(z.object({ decisionId: z.string(), gateId: z.string(), decision: z.enum(["APPROVED", "REJECTED"]), targetIds: stringArray, reason: z.string(), decidedAt: z.string() }).strict()),
  revisions: z.number().int().positive(),
}).strict();

export const parseImagingDesignInput = (value: unknown) => imagingDesignInputSchema.parse(value) as ImagingDesignInput;
export const parseImagingDesignResult = (value: unknown) => imagingDesignResultSchema.parse(value) as ImagingDesignResult;
