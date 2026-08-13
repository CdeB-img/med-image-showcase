import { z } from "zod";
import { humanDecisionEnvelopeSchema, type HumanDecisionEnvelope } from "@/features/protocol-designer/human-decision";

export const SCIENTIFIC_THINKING_ENGINE_VERSION = "1.1.0" as const;

export const SEMANTIC_TYPES = [
  "OBSERVATION",
  "INTUITION",
  "ASSUMPTION",
  "SCIENTIFIC_QUESTION",
  "HYPOTHESIS",
  "OBJECTIVE",
  "MECHANISM",
] as const;
export type ScientificSemanticType = (typeof SEMANTIC_TYPES)[number];

export const SCIENTIFIC_THINKING_OPERATIONS = [
  "CLARIFY_IDEA",
  "REFORMULATE_QUESTION",
  "SPLIT_QUESTION",
  "MERGE_QUESTIONS",
  "REDUCE_SCOPE",
  "EXPAND_SCOPE",
  "IDENTIFY_ASSUMPTION",
  "CHALLENGE_ASSUMPTION",
  "GENERATE_ALTERNATIVE_HYPOTHESIS",
  "REFINE_HYPOTHESIS",
  "REJECT_NON_TESTABLE_HYPOTHESIS",
  "IDENTIFY_MECHANISM",
  "IDENTIFY_MISSING_INFORMATION",
  "IDENTIFY_CONTRADICTION",
  "IDENTIFY_CONCEPTUAL_BIAS",
  "PROPOSE_OBJECTIVES",
  "PRIORITIZE_OBJECTIVES_FOR_REVIEW",
  "REQUEST_KNOWLEDGE",
  "REQUEST_HUMAN_DECISION",
  "PREPARE_RESEARCH_DESIGN_HANDOFF",
] as const;
export type ScientificThinkingOperation = (typeof SCIENTIFIC_THINKING_OPERATIONS)[number];
export type OperationStatus = "EXECUTED" | "AVAILABLE" | "NOT_APPLICABLE" | "BLOCKED";

export const HUMAN_GATE_TYPES = [
  "QUESTION_CONFIRMATION",
  "HYPOTHESIS_ADOPTION",
  "OBJECTIVE_HIERARCHY",
  "MAJOR_SCOPE_CHANGE",
  "BRANCH_ABANDONMENT",
  "DESIGN_TRANSITION",
] as const;
export type HumanGateType = (typeof HUMAN_GATE_TYPES)[number];
export type HumanGateStatus = "PENDING" | "APPROVED" | "REJECTED" | "NOT_REQUIRED";

export type KnowledgeSupport = "SUPPORTED" | "PARTIAL" | "UNSUPPORTED" | "CONFLICTING" | "UNAVAILABLE";
export type CandidateReviewState = "PENDING" | "ADOPTED" | "REJECTED";
export type TestabilityState = "TESTABLE_CANDIDATE" | "NEEDS_CLARIFICATION" | "NON_TESTABLE";

export type ScientificThinkingInput = {
  contractVersion: typeof SCIENTIFIC_THINKING_ENGINE_VERSION;
  requestId: string;
  originalExpression: string;
  validatedReformulation: string;
  language: "fr" | "en";
  scientificIntent: {
    intentRef: string;
    userExpertise: string;
    sourceJourney: "UNDERSTAND" | "FORMALIZE_IDEA" | "DESIGN_STUDY";
    semanticModelRef?: string;
    semanticModelDigest?: string;
  };
  researchContext: {
    sessionId: string;
    contextVersion: number;
    researchProjectId: string | null;
    previousDecisionIds: string[];
  };
  scientificObjectTerms: string[];
  resolvedConcepts: Array<{ conceptId: string; label: string; status: "RESOLVED" | "UNRESOLVED" }>;
  relations: string[];
  population: string[];
  pathologyOrCondition: string[];
  phenomena: string[];
  outcomes: string[];
  methodsMentioned: string[];
  scientificPurpose: string[];
  context: string[];
  missingInformation: string[];
  contradictions: string[];
  safetyFlags: string[];
  information: {
    explicit: string[];
    interpreted: string[];
  };
  knowledge: {
    resultId: string | null;
    resultDigest: string | null;
    coverageStatus: string;
    support: KnowledgeSupport;
    sourceIds: string[];
    gapCodes: string[];
    unresolvedConcepts: string[];
    limitations: string[];
  };
};

export type IdeaElement = {
  elementId: string;
  type: ScientificSemanticType;
  text: string;
  source: "USER_EXPLICIT" | "NOXIA_CANDIDATE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  support: KnowledgeSupport;
};

export type QuestionCandidate = {
  questionId: string;
  text: string;
  kind: "PRIMARY" | "SECONDARY" | "METHODOLOGICAL_BRANCH";
  rationale: string;
  testability: TestabilityState;
  scope: "TOO_BROAD" | "BALANCED" | "TOO_NARROW";
  support: KnowledgeSupport;
  reviewState: CandidateReviewState;
  linkedAssumptionIds: string[];
  sourceTerms: string[];
};

export type HypothesisCandidate = {
  hypothesisId: string;
  text: string;
  kind: "PRIMARY" | "ALTERNATIVE" | "NULL_OR_COMPETING";
  falsifiability: TestabilityState;
  observableCondition: string;
  direction: string | null;
  limitations: string[];
  unknowns: string[];
  support: KnowledgeSupport;
  reviewState: CandidateReviewState;
  linkedQuestionIds: string[];
};

export type ObjectiveCandidate = {
  objectiveId: string;
  text: string;
  level: "PRIMARY" | "SECONDARY" | "EXPLORATORY";
  support: KnowledgeSupport;
  reviewState: CandidateReviewState;
  linkedQuestionIds: string[];
  linkedHypothesisIds: string[];
};

export type MechanismCandidate = {
  mechanismId: string;
  text: string;
  status: "MECHANISM_TO_DOCUMENT" | "KNOWLEDGE_SUPPORTED_MECHANISM";
  support: KnowledgeSupport;
  linkedHypothesisIds: string[];
};

export type AssumptionCandidate = {
  assumptionId: string;
  text: string;
  challenge: string;
  support: KnowledgeSupport;
  status: "OPEN" | "CHALLENGED";
};

export type ScientificThinkingAdaptiveQuestion = {
  questionId: string;
  label: string;
  whyAsked: string;
  decisionImpact: string;
  decisionBlock: "SCIENTIFIC_FINALITY" | "RELATION" | "SCOPE" | "TESTABILITY";
  blocking: boolean;
  suggestedAnswers: Array<{ value: string; label: string; consequence: string }>;
  acceptsFreeText: true;
  acceptsUnknown: true;
  answeredValue: string | null;
};

export type HumanDecisionGate = {
  gateId: string;
  type: HumanGateType;
  label: string;
  reason: string;
  status: HumanGateStatus;
  decidedAt: string | null;
};

export type ChangeEvent = {
  changeId: string;
  kind: "MINOR" | "MAJOR";
  description: string;
  affectedElementIds: string[];
  requiresHumanConfirmation: boolean;
  status: "RECORDED" | "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED";
};

export type ReasoningGraphNode = {
  nodeId: string;
  type: ScientificSemanticType | "SITUATION" | "UNKNOWN" | "DECISION" | "KNOWLEDGE_GAP" | "METHOD_PREFERENCE";
  label: string;
  status: "USER_STATED" | "CANDIDATE" | "HUMAN_CONFIRMED" | "REJECTED" | "OPEN";
  sourceRef: string;
};

export type ReasoningGraphEdge = {
  edgeId: string;
  from: string;
  to: string;
  relation: "REFORMULATED_AS" | "SUPPORTS" | "DEPENDS_ON" | "CHALLENGES" | "CONTRADICTS" | "ADDRESSES" | "EXPLAINS" | "REQUIRES" | "REQUIRES_INFORMATION" | "REFINES" | "ALTERNATIVE_TO" | "INFORMS";
};

export type ScientificReasoningGraph = {
  projectionVersion: "RUNTIME_PROJECTION_1.0";
  ontologyStatus: "NO_NEW_ONTOLOGY";
  nodes: ReasoningGraphNode[];
  edges: ReasoningGraphEdge[];
};

export type ScientificThinkingTraceEvent = {
  sequence: number;
  operation: ScientificThinkingOperation | "CLASSIFY_INPUT" | "BUILD_GRAPH" | "ASSESS_HANDOFF";
  mode: "DETERMINISTIC" | "HUMAN_REQUIRED";
  decision: string;
  inputDigest: string;
  outputDigest: string;
};

export type ResearchDesignHandoff = {
  handoffVersion: "1.1";
  status: "NOT_READY" | "READY_FOR_HUMAN_AUTHORIZATION" | "AUTHORIZED";
  questionId: string | null;
  hypothesisIds: string[];
  objectiveIds: string[];
  mechanisms: MechanismCandidate[];
  knownInformation: string[];
  acceptedUnknowns: string[];
  unresolvedUnknowns: string[];
  contradictions: string[];
  decisionRecordIds: string[];
  humanDecisions: HumanDecisionEnvelope[];
  alternativesNotSelected: string[];
  limitations: string[];
  provenanceRefs: string[];
  knowledgeResultRef: string | null;
  blockedBy: string[];
  boundary: "NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN";
};

export type ScientificThinkingOutput = {
  contractVersion: typeof SCIENTIFIC_THINKING_ENGINE_VERSION;
  outputId: string;
  outputDigest: string;
  status: "CANDIDATES_PROPOSED" | "CLARIFICATION_REQUIRED" | "REFUSED";
  candidateNotice: "ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW";
  originalIdea: string;
  understoodProblem: string;
  centralScientificObject: string;
  semanticElements: IdeaElement[];
  questions: QuestionCandidate[];
  selectedQuestionCandidate: QuestionCandidate | null;
  hypotheses: HypothesisCandidate[];
  objectives: ObjectiveCandidate[];
  mechanisms: MechanismCandidate[];
  assumptions: AssumptionCandidate[];
  unknowns: string[];
  ambiguities: string[];
  contradictions: string[];
  conceptualBiases: string[];
  reasoningIssues: string[];
  methodPreferences: string[];
  alternatives: string[];
  operations: Array<{ operation: ScientificThinkingOperation; status: OperationStatus; reason: string }>;
  adaptiveQuestions: ScientificThinkingAdaptiveQuestion[];
  humanGates: HumanDecisionGate[];
  changes: ChangeEvent[];
  refusal: null | { code: "PATIENT_LEVEL" | "OUT_OF_DOMAIN" | "NON_TESTABLE" | "INSUFFICIENT_INPUT"; reason: string; resumeCondition: string };
  knowledgeRequest: null | { status: "REQUIRED" | "OPTIONAL"; reason: string; unresolvedConcepts: string[]; gapCodes: string[] };
  proposedNextAction: "CLARIFY" | "REVIEW_CANDIDATES" | "REQUEST_KNOWLEDGE" | "REQUEST_HUMAN_DECISION" | "HANDOFF_TO_RESEARCH_DESIGN" | "STOP";
  humanDecisionRequired: boolean;
  provenance: {
    engineVersion: typeof SCIENTIFIC_THINKING_ENGINE_VERSION;
    inputRef: string;
    knowledgeResultRef: string | null;
    sourceRefs: string[];
    policyRefs: ["RDE-001", "RDE-002", "PD-003", "PD-009", "KE-001"];
    llmContributionStatus: "UPSTREAM_LANGUAGE_INTERPRETATION_CANDIDATE_ONLY";
  };
  graph: ScientificReasoningGraph;
  handoff: ResearchDesignHandoff;
  trace: ScientificThinkingTraceEvent[];
};

export type ScientificThinkingSession = {
  input: ScientificThinkingInput;
  output: ScientificThinkingOutput;
  answers: Record<string, string>;
  selectedQuestionId: string | null;
  hypothesisReviews: Record<string, CandidateReviewState>;
  objectiveReviews: Record<string, CandidateReviewState>;
  gateStatuses: Partial<Record<HumanGateType, HumanGateStatus>>;
  acceptedUnknowns: string[];
  changes: ChangeEvent[];
  decisionHistory: HumanDecisionEnvelope[];
  revisions: number;
};

const stringArray = z.array(z.string().min(1).max(500)).max(100);
export const scientificThinkingInputSchema = z.object({
  contractVersion: z.literal(SCIENTIFIC_THINKING_ENGINE_VERSION),
  requestId: z.string().min(1).max(200),
  originalExpression: z.string().min(3).max(4_000),
  validatedReformulation: z.string().min(3).max(4_000),
  language: z.enum(["fr", "en"]),
  scientificIntent: z.object({ intentRef: z.string(), userExpertise: z.string(), sourceJourney: z.enum(["UNDERSTAND", "FORMALIZE_IDEA", "DESIGN_STUDY"]), semanticModelRef: z.string().optional(), semanticModelDigest: z.string().optional() }).strict(),
  researchContext: z.object({ sessionId: z.string(), contextVersion: z.number().int().min(0), researchProjectId: z.string().nullable(), previousDecisionIds: stringArray }).strict(),
  scientificObjectTerms: stringArray,
  resolvedConcepts: z.array(z.object({ conceptId: z.string(), label: z.string(), status: z.enum(["RESOLVED", "UNRESOLVED"]) }).strict()),
  relations: stringArray,
  population: stringArray,
  pathologyOrCondition: stringArray,
  phenomena: stringArray,
  outcomes: stringArray,
  methodsMentioned: stringArray,
  scientificPurpose: stringArray,
  context: stringArray,
  missingInformation: stringArray,
  contradictions: stringArray,
  safetyFlags: stringArray,
  information: z.object({ explicit: stringArray, interpreted: stringArray }).strict(),
  knowledge: z.object({
    resultId: z.string().nullable(), resultDigest: z.string().nullable(), coverageStatus: z.string(),
    support: z.enum(["SUPPORTED", "PARTIAL", "UNSUPPORTED", "CONFLICTING", "UNAVAILABLE"]),
    sourceIds: stringArray, gapCodes: stringArray, unresolvedConcepts: stringArray, limitations: stringArray,
  }).strict(),
}).strict();

const candidateReviewSchema = z.enum(["PENDING", "ADOPTED", "REJECTED"]);
const supportSchema = z.enum(["SUPPORTED", "PARTIAL", "UNSUPPORTED", "CONFLICTING", "UNAVAILABLE"]);
const questionCandidateSchema = z.object({
  questionId: z.string(), text: z.string(), kind: z.enum(["PRIMARY", "SECONDARY", "METHODOLOGICAL_BRANCH"]), rationale: z.string(),
  testability: z.enum(["TESTABLE_CANDIDATE", "NEEDS_CLARIFICATION", "NON_TESTABLE"]), scope: z.enum(["TOO_BROAD", "BALANCED", "TOO_NARROW"]),
  support: supportSchema, reviewState: candidateReviewSchema, linkedAssumptionIds: stringArray, sourceTerms: stringArray,
}).strict();
const hypothesisCandidateSchema = z.object({
  hypothesisId: z.string(), text: z.string(), kind: z.enum(["PRIMARY", "ALTERNATIVE", "NULL_OR_COMPETING"]),
  falsifiability: z.enum(["TESTABLE_CANDIDATE", "NEEDS_CLARIFICATION", "NON_TESTABLE"]), observableCondition: z.string(), direction: z.string().nullable(),
  limitations: stringArray, unknowns: stringArray, support: supportSchema, reviewState: candidateReviewSchema, linkedQuestionIds: stringArray,
}).strict();
const objectiveCandidateSchema = z.object({
  objectiveId: z.string(), text: z.string(), level: z.enum(["PRIMARY", "SECONDARY", "EXPLORATORY"]), support: supportSchema,
  reviewState: candidateReviewSchema, linkedQuestionIds: stringArray, linkedHypothesisIds: stringArray,
}).strict();
const mechanismCandidateSchema = z.object({
  mechanismId: z.string(), text: z.string(), status: z.enum(["MECHANISM_TO_DOCUMENT", "KNOWLEDGE_SUPPORTED_MECHANISM"]), support: supportSchema, linkedHypothesisIds: stringArray,
}).strict();

export const scientificThinkingOutputSchema = z.object({
  contractVersion: z.literal(SCIENTIFIC_THINKING_ENGINE_VERSION),
  outputId: z.string().min(1), outputDigest: z.string().min(1),
  status: z.enum(["CANDIDATES_PROPOSED", "CLARIFICATION_REQUIRED", "REFUSED"]),
  candidateNotice: z.literal("ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW"),
  originalIdea: z.string(), understoodProblem: z.string(), centralScientificObject: z.string(),
  semanticElements: z.array(z.object({ elementId: z.string(), type: z.enum(SEMANTIC_TYPES), text: z.string(), source: z.enum(["USER_EXPLICIT", "NOXIA_CANDIDATE"]), confidence: z.enum(["HIGH", "MEDIUM", "LOW"]), support: supportSchema }).strict()),
  questions: z.array(questionCandidateSchema), hypotheses: z.array(hypothesisCandidateSchema), objectives: z.array(objectiveCandidateSchema),
  selectedQuestionCandidate: questionCandidateSchema.nullable(),
  mechanisms: z.array(mechanismCandidateSchema), assumptions: z.array(z.object({ assumptionId: z.string(), text: z.string(), challenge: z.string(), support: supportSchema, status: z.enum(["OPEN", "CHALLENGED"]) }).strict()), unknowns: stringArray, ambiguities: stringArray,
  contradictions: stringArray, conceptualBiases: stringArray, methodPreferences: stringArray, alternatives: stringArray,
  reasoningIssues: stringArray,
  operations: z.array(z.object({ operation: z.enum(SCIENTIFIC_THINKING_OPERATIONS), status: z.enum(["EXECUTED", "AVAILABLE", "NOT_APPLICABLE", "BLOCKED"]), reason: z.string() }).strict()),
  adaptiveQuestions: z.array(z.object({ questionId: z.string(), label: z.string(), whyAsked: z.string(), decisionImpact: z.string(), decisionBlock: z.enum(["SCIENTIFIC_FINALITY", "RELATION", "SCOPE", "TESTABILITY"]), blocking: z.boolean(), suggestedAnswers: z.array(z.object({ value: z.string(), label: z.string(), consequence: z.string() }).strict()), acceptsFreeText: z.literal(true), acceptsUnknown: z.literal(true), answeredValue: z.string().nullable() }).strict()),
  humanGates: z.array(z.object({ gateId: z.string(), type: z.enum(HUMAN_GATE_TYPES), label: z.string(), reason: z.string(), status: z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_REQUIRED"]), decidedAt: z.string().nullable() }).strict()),
  changes: z.array(z.object({ changeId: z.string(), kind: z.enum(["MINOR", "MAJOR"]), description: z.string(), affectedElementIds: stringArray, requiresHumanConfirmation: z.boolean(), status: z.enum(["RECORDED", "PENDING_CONFIRMATION", "CONFIRMED", "REJECTED"]) }).strict()),
  refusal: z.object({ code: z.enum(["PATIENT_LEVEL", "OUT_OF_DOMAIN", "NON_TESTABLE", "INSUFFICIENT_INPUT"]), reason: z.string(), resumeCondition: z.string() }).strict().nullable(),
  knowledgeRequest: z.object({ status: z.enum(["REQUIRED", "OPTIONAL"]), reason: z.string(), unresolvedConcepts: stringArray, gapCodes: stringArray }).strict().nullable(),
  proposedNextAction: z.enum(["CLARIFY", "REVIEW_CANDIDATES", "REQUEST_KNOWLEDGE", "REQUEST_HUMAN_DECISION", "HANDOFF_TO_RESEARCH_DESIGN", "STOP"]), humanDecisionRequired: z.boolean(),
  provenance: z.object({ engineVersion: z.literal(SCIENTIFIC_THINKING_ENGINE_VERSION), inputRef: z.string(), knowledgeResultRef: z.string().nullable(), sourceRefs: stringArray, policyRefs: z.tuple([z.literal("RDE-001"), z.literal("RDE-002"), z.literal("PD-003"), z.literal("PD-009"), z.literal("KE-001")]), llmContributionStatus: z.literal("UPSTREAM_LANGUAGE_INTERPRETATION_CANDIDATE_ONLY") }).strict(),
  graph: z.object({ projectionVersion: z.literal("RUNTIME_PROJECTION_1.0"), ontologyStatus: z.literal("NO_NEW_ONTOLOGY"), nodes: z.array(z.unknown()), edges: z.array(z.unknown()) }).strict(),
  handoff: z.object({ handoffVersion: z.literal("1.1"), status: z.enum(["NOT_READY", "READY_FOR_HUMAN_AUTHORIZATION", "AUTHORIZED"]), questionId: z.string().nullable(), hypothesisIds: stringArray, objectiveIds: stringArray, mechanisms: z.array(mechanismCandidateSchema), knownInformation: stringArray, acceptedUnknowns: stringArray, unresolvedUnknowns: stringArray, contradictions: stringArray, decisionRecordIds: stringArray, humanDecisions: z.array(humanDecisionEnvelopeSchema), alternativesNotSelected: stringArray, limitations: stringArray, provenanceRefs: stringArray, knowledgeResultRef: z.string().nullable(), blockedBy: stringArray, boundary: z.literal("NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN") }).strict(),
  trace: z.array(z.object({ sequence: z.number().int(), operation: z.union([z.enum(SCIENTIFIC_THINKING_OPERATIONS), z.enum(["CLASSIFY_INPUT", "BUILD_GRAPH", "ASSESS_HANDOFF"])]), mode: z.enum(["DETERMINISTIC", "HUMAN_REQUIRED"]), decision: z.string(), inputDigest: z.string(), outputDigest: z.string() }).strict()),
}).strict();

export const scientificThinkingSessionSchema = z.object({
  input: scientificThinkingInputSchema,
  output: scientificThinkingOutputSchema,
  answers: z.record(z.string()),
  selectedQuestionId: z.string().nullable(),
  hypothesisReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])),
  objectiveReviews: z.record(z.enum(["PENDING", "ADOPTED", "REJECTED"])),
  gateStatuses: z.record(z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_REQUIRED"])),
  acceptedUnknowns: stringArray,
  changes: z.array(z.unknown()),
  decisionHistory: z.array(humanDecisionEnvelopeSchema),
  revisions: z.number().int().min(1),
}).strict();

export const parseScientificThinkingInput = (value: unknown) => scientificThinkingInputSchema.parse(value) as ScientificThinkingInput;
export const parseScientificThinkingOutput = (value: unknown) => scientificThinkingOutputSchema.parse(value) as ScientificThinkingOutput;
