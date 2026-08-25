import { logicalDigest, stableStringify } from "@/features/knowledge-engine";

export const HARNESS_VERSION = "2.0.0" as const;

export const FAILURE_TAXONOMY = Object.freeze([
  "CHARACTERIZATION_HARNESS_DEFECT",
  "REFERENCE_ENVELOPE_DEFECT",
  "FROZEN_INPUT_DEFECT",
  "TRACE_INCOMPLETE",
  "ST_CRITICAL_REASONING_OMISSION",
  "UNSUPPORTED_HYPOTHESIS",
  "EVIDENCE_PROMOTION",
  "KNOWLEDGE_GAP_LOSS",
  "CONTRADICTION_LOSS",
  "PROJECT_QUESTION_DRIFT",
  "LINEAGE_BREAK",
  "OWNERSHIP_LEAK",
  "STALE_INPUT_ACCEPTED",
  "NON_DETERMINISTIC_BEHAVIOR",
  "UNKNOWN_FAILURE",
] as const);

export type FailureClass = (typeof FAILURE_TAXONOMY)[number];

export const FIRST_DIVERGENT_STAGES = Object.freeze([
  "CHARACTERIZATION_HARNESS",
  "CHARACTERIZATION_REFERENCE",
  "FROZEN_INPUT_PACK",
  "TRACE_INSTRUMENTATION",
  "ST_REQUEST_ACCEPTANCE",
  "ST_CONTEXT_NORMALIZATION",
  "ST_PROJECT_QUESTION_RECONSTRUCTION",
  "ST_KNOWLEDGE_EVIDENCE_SELECTION",
  "ST_CANDIDATE_ELIGIBILITY",
  "ST_OBJECTIVE_CANDIDATE_CONSTRUCTION",
  "ST_HYPOTHESIS_CANDIDATE_CONSTRUCTION",
  "ST_ALTERNATIVE_CONSTRUCTION",
  "ST_SCIENTIFIC_MODEL_CONSTRUCTION",
  "ST_CANDIDATE_FILTERING",
  "ST_EPISTEMIC_GUARD",
  "ST_OUTPUT_CANONICALIZATION",
  "ST_OWNER_RESULT_PACKAGING",
  "STALE_VALIDATION",
  "UNKNOWN_STAGE",
] as const);

export type FirstDivergentStage = (typeof FIRST_DIVERGENT_STAGES)[number];
export type NegativeExpectationMode =
  | "STRICT_NO_CANDIDATE_EXPECTED"
  | "CONDITIONAL_CANDIDATE_ALLOWED"
  | "CLARIFICATION_OR_GAP_EXPECTED"
  | "CANDIDATE_REQUIRED";

export type CampaignStatus =
  | "READY_FOR_ADJUDICATION"
  | "BLOCKED_BY_CHARACTERIZATION_HARNESS"
  | "INVALID_FROZEN_INPUT"
  | "COMPLETE";
export type HarnessStatus = "READY" | "NOT_READY";
export type ReferenceStatus = "VALID" | "DEFECT" | "INSUFFICIENT";
export type OwnerCharacterizationStatus =
  | "NOT_ADJUDICATED"
  | "CHARACTERIZED_WITHIN_BOUNDED_SCOPE"
  | "CHARACTERIZED_WITH_LIMITATIONS"
  | "OWNER_REPAIR_REQUIRED"
  | "REFERENCE_EVIDENCE_INSUFFICIENT"
  | "HUMAN_ARBITRATION_REQUIRED";

export type StatusModel = {
  campaignStatus: CampaignStatus;
  harnessStatus: HarnessStatus;
  referenceStatus: ReferenceStatus;
  ownerCharacterizationStatus: OwnerCharacterizationStatus;
};

export type KnowledgeGateInput = {
  expectedProject: { projectId: string; projectVersion: string; projectDigest: string };
  observedProject: { projectId: string; projectVersion: string; projectDigest: string };
  resultRef: string | null;
  resultDigest: string | null;
  provenanceRefs: string[];
  applicabilityRepresented: boolean;
  sourceRefs: string[];
  evidenceRefs: string[];
  evidenceRequired: boolean;
  gapsExpected: string[];
  gapsObserved: string[];
  limitationsExpected: string[];
  limitationsObserved: string[];
  contradictionsExpected: string[];
  contradictionsObserved: string[];
  preEncodedStDecision: boolean;
  stale: boolean;
  purposeCoherent: boolean;
  frozen: boolean;
  digestValid: boolean;
};

export type KnowledgeGateResult = {
  status: "USABLE" | "NOT_USABLE" | "NON_ADJUDICABLE";
  explicitField: "KNOWLEDGE_INPUT_USABLE_FOR_ST_CHARACTERIZATION";
  usableForStCharacterization: "YES" | "NO";
  checks: Record<string, boolean>;
  missingComponents: string[];
  note: string;
};

const containsAll = (observed: readonly string[], expected: readonly string[]) =>
  expected.every((item) => observed.includes(item));

export const evaluateKnowledgeInputGate = (input: KnowledgeGateInput): KnowledgeGateResult => {
  const checks = {
    frozen: input.frozen,
    digestValid: input.digestValid,
    resultIdentityPresent: Boolean(input.resultRef && input.resultDigest),
    projectIdCoherent: input.expectedProject.projectId === input.observedProject.projectId,
    projectVersionCoherent: input.expectedProject.projectVersion === input.observedProject.projectVersion,
    projectDigestCoherent: input.expectedProject.projectDigest === input.observedProject.projectDigest,
    provenanceAvailable: input.provenanceRefs.length > 0,
    applicabilityRepresented: input.applicabilityRepresented,
    sourcesAvailableWhenRequired: !input.evidenceRequired || input.sourceRefs.length > 0,
    evidenceAvailableWhenRequired: !input.evidenceRequired || input.evidenceRefs.length > 0,
    gapsPreserved: containsAll(input.gapsObserved, input.gapsExpected),
    limitationsPreserved: containsAll(input.limitationsObserved, input.limitationsExpected),
    contradictionsPreserved: containsAll(input.contradictionsObserved, input.contradictionsExpected),
    noPreEncodedStDecision: !input.preEncodedStDecision,
    currentNotStale: !input.stale,
    purposeCoherent: input.purposeCoherent,
  };
  const missingComponents = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  const invalidFixture = !checks.frozen || !checks.digestValid || !checks.resultIdentityPresent;
  const status = invalidFixture ? "NON_ADJUDICABLE" : missingComponents.length ? "NOT_USABLE" : "USABLE";
  return {
    status,
    explicitField: "KNOWLEDGE_INPUT_USABLE_FOR_ST_CHARACTERIZATION",
    usableForStCharacterization: status === "USABLE" ? "YES" : "NO",
    checks,
    missingComponents,
    note: status === "USABLE"
      ? "The frozen KnowledgeResult is admissible for the pre-authored obligation; gaps and contradictions are permitted when preserved."
      : "The gate does not decide whether ST ought to generate a hypothesis; it only rejects an inadmissible characterization input.",
  };
};

export type QualificationTrace = {
  caseId?: string | null;
  project?: { projectId?: string | null; projectVersion?: string | null; projectDigest?: string | null } | null;
  knowledgeResultRef?: string | null;
  knowledgeResultDigest?: string | null;
  stRequestRef?: string | null;
  stRequestDigest?: string | null;
  stVersion?: string | null;
  stResultRef?: string | null;
  stResultDigest?: string | null;
  status?: string | null;
  candidateStructure?: {
    questions?: number;
    hypotheses?: number;
    objectives?: number;
    mechanisms?: number;
    alternatives?: number;
    scientificModels?: number;
  } | null;
  gaps?: string[] | null;
  limitations?: string[] | null;
  contradictions?: string[] | null;
  firstDivergentStage?: FirstDivergentStage | null;
  durationMs?: number | null;
  replayRefs?: string[] | null;
};

export type TraceCompletenessResult = {
  traceQualificationComplete: "YES" | "NO";
  missingFields: string[];
  caseAdjudicable: boolean;
};

export const evaluateTraceCompleteness = (trace: QualificationTrace): TraceCompletenessResult => {
  const required: Record<string, boolean> = {
    caseId: Boolean(trace.caseId),
    projectId: Boolean(trace.project?.projectId),
    projectVersion: Boolean(trace.project?.projectVersion),
    projectDigest: Boolean(trace.project?.projectDigest),
    knowledgeResultRef: Boolean(trace.knowledgeResultRef),
    knowledgeResultDigest: Boolean(trace.knowledgeResultDigest),
    stRequestRef: Boolean(trace.stRequestRef),
    stRequestDigest: Boolean(trace.stRequestDigest),
    stVersion: Boolean(trace.stVersion),
    stResultRef: Boolean(trace.stResultRef),
    stResultDigest: Boolean(trace.stResultDigest),
    status: Boolean(trace.status),
    candidateStructure: Boolean(trace.candidateStructure
      && Object.values(trace.candidateStructure).every((value) => Number.isInteger(value) && Number(value) >= 0)),
    gaps: Array.isArray(trace.gaps),
    limitations: Array.isArray(trace.limitations),
    contradictions: Array.isArray(trace.contradictions),
    durationMs: typeof trace.durationMs === "number" && trace.durationMs >= 0,
    replayRefs: Array.isArray(trace.replayRefs),
  };
  if (trace.status === "FAILED" || trace.status === "CRITICAL_VIOLATION") {
    required.firstDivergentStage = Boolean(trace.firstDivergentStage);
  }
  const missingFields = Object.entries(required).filter(([, present]) => !present).map(([name]) => name);
  return { traceQualificationComplete: missingFields.length ? "NO" : "YES", missingFields, caseAdjudicable: missingFields.length === 0 };
};

export type CandidateObservation = {
  status: string;
  questions: number;
  hypotheses: number;
  objectives: number;
  mechanisms: number;
  scientificModels: number;
  candidatesPending: boolean;
  conditionsExplicit: boolean;
  unknownsPreserved: boolean;
  gapExplicit: boolean;
  refusalCode: string | null;
};

export type ObligationOutcome =
  | "SATISFIED"
  | "PARTIALLY_SATISFIED"
  | "VIOLATED"
  | "NOT_APPLICABLE"
  | "NON_ADJUDICABLE"
  | "HUMAN_ARBITRATION_REQUIRED";

export const evaluateNegativeExpectation = (
  mode: NegativeExpectationMode,
  observed: CandidateObservation,
): { outcome: ObligationOutcome; note: string } => {
  const candidateCount = observed.hypotheses + observed.objectives + observed.mechanisms + observed.scientificModels;
  if (mode === "STRICT_NO_CANDIDATE_EXPECTED") {
    const passed = candidateCount === 0 && ["REFUSED", "REJECTED_BEFORE_OWNER_RUNTIME"].includes(observed.status);
    return { outcome: passed ? "SATISFIED" : "VIOLATED", note: passed ? "No candidate escaped a contractually strict stop." : "A strict stop produced or retained a scientific candidate." };
  }
  if (mode === "CONDITIONAL_CANDIDATE_ALLOWED") {
    const passed = candidateCount === 0
      ? observed.gapExplicit || observed.status === "CLARIFICATION_REQUIRED"
      : observed.candidatesPending && observed.conditionsExplicit && observed.unknownsPreserved;
    return { outcome: passed ? "SATISFIED" : "VIOLATED", note: passed ? "Conditional candidates or a bounded gap remain admissible without forced output." : "Conditional candidate safety was not preserved." };
  }
  if (mode === "CLARIFICATION_OR_GAP_EXPECTED") {
    const passed = observed.gapExplicit
      && ["CLARIFICATION_REQUIRED", "REFUSED", "CANDIDATES_PROPOSED"].includes(observed.status)
      && (candidateCount === 0 || (observed.candidatesPending && observed.conditionsExplicit));
    return { outcome: passed ? "SATISFIED" : "VIOLATED", note: passed ? "The missing information remains primary and any candidate is explicitly bounded." : "The expected clarification or gap is absent or was overwritten by an unbounded candidate." };
  }
  const passed = observed.hypotheses > 0 && observed.objectives > 0 && observed.candidatesPending;
  return { outcome: passed ? "SATISFIED" : "VIOLATED", note: passed ? "A supported candidate opportunity was covered without adoption." : "A valid candidate obligation was not covered." };
};

export const evaluateMechanisticObligation = (observed: {
  mechanisms: Array<{ linkedHypothesisIds?: string[]; status?: string; text?: string }>;
  scientificModels: Array<{ candidate?: boolean; explanatoryRelationExplicit?: boolean }>;
  hypotheses: Array<{ hypothesisId?: string; text?: string }>;
}): { outcome: ObligationOutcome; evidenceKind: string | null; note: string } => {
  const linkedMechanism = observed.mechanisms.find((item) => (item.linkedHypothesisIds?.length ?? 0) > 0 && Boolean(item.text));
  const model = observed.scientificModels.find((item) => item.candidate && item.explanatoryRelationExplicit);
  if (linkedMechanism) return { outcome: "SATISFIED", evidenceKind: "MECHANISM_CANDIDATE", note: "A linked, explicitly explanatory mechanism candidate is inspectable; no exact wording or count was required." };
  if (model) return { outcome: "SATISFIED", evidenceKind: "SCIENTIFIC_MODEL_CANDIDATE", note: "An explicitly explanatory candidate Scientific Model is inspectable." };
  return { outcome: "VIOLATED", evidenceKind: null, note: observed.hypotheses.length
    ? "Hypotheses exist, but no inspectable explanatory relation is represented as a mechanism or candidate Scientific Model."
    : "No mechanistic or explanatory candidate is inspectable." };
};

export type AdjudicationInput = {
  harnessDefect: boolean;
  referenceDefect: boolean;
  frozenInputValid: boolean;
  traceComplete: boolean;
  scientificConflictRequiresHuman: boolean;
  validOwnerCriticalViolation: boolean;
  nonCriticalLimitations: boolean;
};

export const adjudicateCase = (input: AdjudicationInput) => {
  if (input.harnessDefect) return {
    caseVerdict: "NON_ADJUDICABLE" as const,
    failureClass: "CHARACTERIZATION_HARNESS_DEFECT" as FailureClass,
    firstDivergentStage: "CHARACTERIZATION_HARNESS" as FirstDivergentStage,
    status: { campaignStatus: "BLOCKED_BY_CHARACTERIZATION_HARNESS", harnessStatus: "NOT_READY", referenceStatus: "VALID", ownerCharacterizationStatus: "NOT_ADJUDICATED" } satisfies StatusModel,
  };
  if (input.referenceDefect) return {
    caseVerdict: "NON_ADJUDICABLE" as const,
    failureClass: "REFERENCE_ENVELOPE_DEFECT" as FailureClass,
    firstDivergentStage: "CHARACTERIZATION_REFERENCE" as FirstDivergentStage,
    status: { campaignStatus: "READY_FOR_ADJUDICATION", harnessStatus: "READY", referenceStatus: "DEFECT", ownerCharacterizationStatus: "NOT_ADJUDICATED" } satisfies StatusModel,
  };
  if (!input.frozenInputValid) return {
    caseVerdict: "NON_ADJUDICABLE" as const,
    failureClass: "FROZEN_INPUT_DEFECT" as FailureClass,
    firstDivergentStage: "FROZEN_INPUT_PACK" as FirstDivergentStage,
    status: { campaignStatus: "INVALID_FROZEN_INPUT", harnessStatus: "READY", referenceStatus: "VALID", ownerCharacterizationStatus: "NOT_ADJUDICATED" } satisfies StatusModel,
  };
  if (!input.traceComplete) return {
    caseVerdict: "NON_ADJUDICABLE" as const,
    failureClass: "TRACE_INCOMPLETE" as FailureClass,
    firstDivergentStage: "TRACE_INSTRUMENTATION" as FirstDivergentStage,
    status: { campaignStatus: "BLOCKED_BY_CHARACTERIZATION_HARNESS", harnessStatus: "NOT_READY", referenceStatus: "VALID", ownerCharacterizationStatus: "NOT_ADJUDICATED" } satisfies StatusModel,
  };
  if (input.scientificConflictRequiresHuman) return {
    caseVerdict: "HUMAN_ARBITRATION_REQUIRED" as const,
    failureClass: null,
    firstDivergentStage: null,
    status: { campaignStatus: "COMPLETE", harnessStatus: "READY", referenceStatus: "VALID", ownerCharacterizationStatus: "HUMAN_ARBITRATION_REQUIRED" } satisfies StatusModel,
  };
  if (input.validOwnerCriticalViolation) return {
    caseVerdict: "CRITICAL_VIOLATION" as const,
    failureClass: "ST_CRITICAL_REASONING_OMISSION" as FailureClass,
    firstDivergentStage: "ST_CANDIDATE_FILTERING" as FirstDivergentStage,
    status: { campaignStatus: "COMPLETE", harnessStatus: "READY", referenceStatus: "VALID", ownerCharacterizationStatus: "OWNER_REPAIR_REQUIRED" } satisfies StatusModel,
  };
  return {
    caseVerdict: input.nonCriticalLimitations ? "SATISFIED_WITH_NONCRITICAL_LIMITATIONS" as const : "FULLY_SATISFIED" as const,
    failureClass: null,
    firstDivergentStage: null,
    status: { campaignStatus: "COMPLETE", harnessStatus: "READY", referenceStatus: "VALID", ownerCharacterizationStatus: input.nonCriticalLimitations ? "CHARACTERIZED_WITH_LIMITATIONS" : "CHARACTERIZED_WITHIN_BOUNDED_SCOPE" } satisfies StatusModel,
  };
};

export const ACCEPTANCE_ENVELOPE_SCHEMA = Object.freeze({
  requiredFields: [
    "caseId", "negativeExpectationMode", "requiredObligations", "forbiddenBehaviors", "allowedAlternatives",
    "expectedGaps", "expectedLimitations", "criticalObligations", "referenceRefs", "authoredBeforeObservation",
    "mutableAfterObservation",
  ],
  negativeExpectationModes: [
    "STRICT_NO_CANDIDATE_EXPECTED", "CONDITIONAL_CANDIDATE_ALLOWED", "CLARIFICATION_OR_GAP_EXPECTED", "CANDIDATE_REQUIRED",
  ],
  ownerVerdictPreconditions: ["HARNESS_READY", "REFERENCE_VALID", "FROZEN_INPUT_VALID", "TRACE_COMPLETE"],
});

export const ADJUDICATION_RULES = Object.freeze({
  precedence: ["HARNESS", "REFERENCE", "FROZEN_INPUT", "TRACE", "SCIENTIFIC_HUMAN_CONFLICT", "OWNER"],
  harnessDefectMapsToHumanArbitration: false,
  referenceDefectMapsToOwnerRepair: false,
  traceIncompleteMapsToOwnerVerdict: false,
  privateChainOfThoughtRecorded: false,
});

export const contractDigest = () => logicalDigest({
  version: HARNESS_VERSION,
  taxonomy: FAILURE_TAXONOMY,
  stages: FIRST_DIVERGENT_STAGES,
  knowledgeGate: stableStringify(evaluateKnowledgeInputGate),
  traceGate: stableStringify(evaluateTraceCompleteness),
  negativeExpectation: stableStringify(evaluateNegativeExpectation),
  mechanisticObligation: stableStringify(evaluateMechanisticObligation),
  acceptanceEnvelopeSchema: ACCEPTANCE_ENVELOPE_SCHEMA,
  adjudicationRules: ADJUDICATION_RULES,
});
