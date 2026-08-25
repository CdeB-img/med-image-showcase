import { logicalDigest, stableStringify } from "@/features/knowledge-engine";
import {
  evaluateKnowledgeInputGate as evaluateR1KnowledgeInputGate,
  type KnowledgeGateInput,
  type QualificationTrace,
} from "../../w1-qual-01r1-st/harness/contracts";

export const HARNESS_VERSION = "2.1.0" as const;

export const EXPECTED_EXECUTION_MODES = Object.freeze([
  "OWNER_EXECUTION_REQUIRED",
  "PRE_OWNER_REJECTION_EXPECTED",
] as const);

export type ExpectedExecutionMode = (typeof EXPECTED_EXECUTION_MODES)[number];

export const EXECUTION_OUTCOME_KINDS = Object.freeze([
  "OWNER_RESULT_PRODUCED",
  "EXPECTED_PRE_OWNER_REJECTION",
  "UNEXPECTED_PRE_OWNER_FAILURE",
  "OWNER_EXECUTION_FAILURE",
  "NON_ADJUDICABLE_TECHNICAL_FAILURE",
] as const);

export type ExecutionOutcomeKind = (typeof EXECUTION_OUTCOME_KINDS)[number];

export const TERMINAL_TRACE_STAGES = Object.freeze([
  "PROJECT_CONTEXT",
  "OWNER_REQUEST_VALIDATION",
  "KNOWLEDGE_TO_ST_HANDOFF",
  "STALE_VALIDATION",
  "SCIENTIFIC_THINKING_ENGINE",
  "CHARACTERIZATION_HARNESS",
  "UNKNOWN_STAGE",
] as const);

export type TerminalTraceStage = (typeof TERMINAL_TRACE_STAGES)[number];

export type ExecutionObservation = {
  expectedExecutionMode: ExpectedExecutionMode;
  expectedRejectionCodes: string[];
  errorCode: string | null;
  rejectionStage: TerminalTraceStage | null;
  ownerInvocationCount: number;
  ownerResultCount: number;
  traceEventTypes: string[];
  projectWrites: number;
  ownerResultMutations: number;
  technicalAttributionKnown: boolean;
};

export type CharacterizationExecutionOutcome = {
  kind: ExecutionOutcomeKind;
  terminalPlane: "OWNER_RESULT_TERMINAL" | "PRE_OWNER_TERMINAL";
  caseStatus: "SATISFIED" | "READY_FOR_SCIENTIFIC_ADJUDICATION" | "NON_ADJUDICABLE" | "OWNER_FAILURE";
  ownerResult: "PRODUCED" | "ABSENT_EXPECTED" | "ABSENT_UNEXPECTED";
  failureClass: "OWNER_EXECUTION_FAILURE" | "UNEXPECTED_PRE_OWNER_FAILURE" | "NON_ADJUDICABLE_TECHNICAL_FAILURE" | null;
  ownerRepairRequired: boolean;
  evidencePromotion: boolean;
  firstDivergentStage: TerminalTraceStage | null;
  sideEffectsSafe: boolean;
  reasons: string[];
};

const ownerTraceTypes = new Set([
  "OWNER_INVOCATION_STARTED",
  "OWNER_INVOCATION_COMPLETED",
  "OWNER_INVOCATION_FAILED",
]);

export const deriveExecutionOutcome = (
  input: ExecutionObservation,
): CharacterizationExecutionOutcome => {
  const reasons: string[] = [];
  const ownerTraceCount = input.traceEventTypes.filter((item) => ownerTraceTypes.has(item)).length;
  const sideEffectsSafe = input.projectWrites === 0 && input.ownerResultMutations === 0;
  const expectedCode = Boolean(input.errorCode && input.expectedRejectionCodes.includes(input.errorCode));
  const preOwnerWasNotInvoked = input.ownerInvocationCount === 0
    && input.ownerResultCount === 0
    && ownerTraceCount === 0;

  if (!sideEffectsSafe) reasons.push("SIDE_EFFECT_BOUNDARY_VIOLATED");
  if (input.ownerInvocationCount === 0 && ownerTraceCount > 0) reasons.push("FALSE_OWNER_EXECUTION_TRACE");
  if (input.ownerResultCount > input.ownerInvocationCount) reasons.push("OWNER_RESULT_WITHOUT_OWNER_INVOCATION");

  if (input.expectedExecutionMode === "PRE_OWNER_REJECTION_EXPECTED") {
    if (expectedCode && preOwnerWasNotInvoked && sideEffectsSafe && input.rejectionStage !== null) {
      return {
        kind: "EXPECTED_PRE_OWNER_REJECTION",
        terminalPlane: "PRE_OWNER_TERMINAL",
        caseStatus: "SATISFIED",
        ownerResult: "ABSENT_EXPECTED",
        failureClass: null,
        ownerRepairRequired: false,
        evidencePromotion: false,
        firstDivergentStage: null,
        sideEffectsSafe: true,
        reasons: [],
      };
    }
    if (!expectedCode) reasons.push("EXPECTED_REJECTION_CODE_NOT_OBSERVED");
    if (!preOwnerWasNotInvoked) reasons.push("OWNER_EXECUTION_OR_RESULT_OBSERVED_DURING_EXPECTED_PRE_OWNER_REJECTION");
    if (input.rejectionStage === null) reasons.push("PRE_OWNER_REJECTION_STAGE_MISSING");
    return {
      kind: "UNEXPECTED_PRE_OWNER_FAILURE",
      terminalPlane: "PRE_OWNER_TERMINAL",
      caseStatus: "NON_ADJUDICABLE",
      ownerResult: input.ownerResultCount === 0 ? "ABSENT_UNEXPECTED" : "PRODUCED",
      failureClass: "UNEXPECTED_PRE_OWNER_FAILURE",
      ownerRepairRequired: false,
      evidencePromotion: false,
      firstDivergentStage: input.rejectionStage ?? "UNKNOWN_STAGE",
      sideEffectsSafe,
      reasons,
    };
  }

  if (input.ownerInvocationCount > 0 && input.ownerResultCount === 1 && input.errorCode === null && sideEffectsSafe) {
    return {
      kind: "OWNER_RESULT_PRODUCED",
      terminalPlane: "OWNER_RESULT_TERMINAL",
      caseStatus: "READY_FOR_SCIENTIFIC_ADJUDICATION",
      ownerResult: "PRODUCED",
      failureClass: null,
      ownerRepairRequired: false,
      evidencePromotion: false,
      firstDivergentStage: null,
      sideEffectsSafe: true,
      reasons: [],
    };
  }

  if (input.ownerInvocationCount > 0 && input.ownerResultCount === 0 && input.errorCode !== null) {
    return {
      kind: "OWNER_EXECUTION_FAILURE",
      terminalPlane: "OWNER_RESULT_TERMINAL",
      caseStatus: "OWNER_FAILURE",
      ownerResult: "ABSENT_UNEXPECTED",
      failureClass: "OWNER_EXECUTION_FAILURE",
      ownerRepairRequired: true,
      evidencePromotion: false,
      firstDivergentStage: "SCIENTIFIC_THINKING_ENGINE",
      sideEffectsSafe,
      reasons,
    };
  }

  if (input.ownerInvocationCount === 0 && input.ownerResultCount === 0 && input.errorCode !== null && input.technicalAttributionKnown) {
    return {
      kind: "UNEXPECTED_PRE_OWNER_FAILURE",
      terminalPlane: "PRE_OWNER_TERMINAL",
      caseStatus: "NON_ADJUDICABLE",
      ownerResult: "ABSENT_UNEXPECTED",
      failureClass: "UNEXPECTED_PRE_OWNER_FAILURE",
      ownerRepairRequired: false,
      evidencePromotion: false,
      firstDivergentStage: input.rejectionStage ?? "UNKNOWN_STAGE",
      sideEffectsSafe,
      reasons,
    };
  }

  reasons.push("TERMINAL_STATE_NOT_UNAMBIGUOUSLY_ATTRIBUTABLE");
  return {
    kind: "NON_ADJUDICABLE_TECHNICAL_FAILURE",
    terminalPlane: input.ownerInvocationCount > 0 ? "OWNER_RESULT_TERMINAL" : "PRE_OWNER_TERMINAL",
    caseStatus: "NON_ADJUDICABLE",
    ownerResult: input.ownerResultCount > 0 ? "PRODUCED" : "ABSENT_UNEXPECTED",
    failureClass: "NON_ADJUDICABLE_TECHNICAL_FAILURE",
    ownerRepairRequired: false,
    evidencePromotion: false,
    firstDivergentStage: input.rejectionStage ?? "UNKNOWN_STAGE",
    sideEffectsSafe,
    reasons,
  };
};

export type KnowledgeGatePurpose = "OWNER_EXECUTION" | "FAIL_CLOSED_PRE_OWNER_REJECTION";
export type R2KnowledgeGateInput = KnowledgeGateInput & {
  testPurpose: KnowledgeGatePurpose;
};

export const evaluateKnowledgeInputGate = (input: R2KnowledgeGateInput) => {
  const base = evaluateR1KnowledgeInputGate(input);
  const onlyIntentionalStaleFailure = base.missingComponents.every((item) => item === "currentNotStale");
  if (input.testPurpose === "FAIL_CLOSED_PRE_OWNER_REJECTION"
    && base.status === "NOT_USABLE"
    && onlyIntentionalStaleFailure) {
    return {
      ...base,
      status: "INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST" as const,
      usableForStCharacterization: "NO" as const,
      validForDeclaredTestPurpose: "YES" as const,
      note: "The frozen KnowledgeResult is internally valid and intentionally stale only against the execution Project; it is admissible solely to test fail-closed pre-owner rejection.",
    };
  }
  return {
    ...base,
    validForDeclaredTestPurpose: (input.testPurpose === "OWNER_EXECUTION" && base.status === "USABLE" ? "YES" : "NO") as "YES" | "NO",
  };
};

export type QualificationTraceR2 = Omit<QualificationTrace,
  "stRequestRef" | "stRequestDigest" | "stResultRef" | "stResultDigest" | "firstDivergentStage"> & {
  stRequestRef?: string | null;
  stRequestDigest?: string | null;
  stResultRef?: string | null;
  stResultDigest?: string | null;
  executionOutcome: CharacterizationExecutionOutcome;
  rejectionCode: string | null;
  rejectionStage: TerminalTraceStage | null;
  ownerInvocationCount: number;
  ownerResultCount: number;
  traceEventTypes: string[];
  privateReasoningStored: false;
};

export type TraceCompletenessResultR2 = {
  traceQualificationComplete: "YES" | "NO";
  missingFields: string[];
  caseAdjudicable: boolean;
};

export const evaluateTraceCompleteness = (trace: QualificationTraceR2): TraceCompletenessResultR2 => {
  const required: Record<string, boolean> = {
    caseId: Boolean(trace.caseId),
    projectId: Boolean(trace.project?.projectId),
    projectVersion: Boolean(trace.project?.projectVersion),
    projectDigest: Boolean(trace.project?.projectDigest),
    knowledgeResultRef: Boolean(trace.knowledgeResultRef),
    knowledgeResultDigest: Boolean(trace.knowledgeResultDigest),
    stVersion: Boolean(trace.stVersion),
    status: Boolean(trace.status),
    durationMs: typeof trace.durationMs === "number" && trace.durationMs >= 0,
    replayRefs: Array.isArray(trace.replayRefs),
    executionOutcome: Boolean(trace.executionOutcome?.kind),
    ownerInvocationCount: Number.isInteger(trace.ownerInvocationCount) && trace.ownerInvocationCount >= 0,
    ownerResultCount: Number.isInteger(trace.ownerResultCount) && trace.ownerResultCount >= 0,
    traceEventTypes: Array.isArray(trace.traceEventTypes),
    privateReasoningStored: trace.privateReasoningStored === false,
  };
  if (trace.executionOutcome.kind === "OWNER_RESULT_PRODUCED") {
    Object.assign(required, {
      stRequestRef: Boolean(trace.stRequestRef),
      stRequestDigest: Boolean(trace.stRequestDigest),
      stResultRef: Boolean(trace.stResultRef),
      stResultDigest: Boolean(trace.stResultDigest),
      candidateStructure: Boolean(trace.candidateStructure
        && Object.values(trace.candidateStructure).every((value) => Number.isInteger(value) && Number(value) >= 0)),
      gaps: Array.isArray(trace.gaps),
      limitations: Array.isArray(trace.limitations),
      contradictions: Array.isArray(trace.contradictions),
    });
  } else if (trace.executionOutcome.kind === "EXPECTED_PRE_OWNER_REJECTION") {
    Object.assign(required, {
      rejectionCode: Boolean(trace.rejectionCode),
      rejectionStage: Boolean(trace.rejectionStage),
      stRequestAbsent: trace.stRequestRef === null && trace.stRequestDigest === null,
      stResultAbsent: trace.stResultRef === null && trace.stResultDigest === null,
      ownerNotInvoked: trace.ownerInvocationCount === 0,
      ownerResultAbsent: trace.ownerResultCount === 0,
    });
  } else {
    Object.assign(required, {
      rejectionOrFailureCode: Boolean(trace.rejectionCode),
      technicalStage: Boolean(trace.rejectionStage || trace.executionOutcome.firstDivergentStage),
    });
  }
  const missingFields = Object.entries(required).filter(([, present]) => !present).map(([name]) => name);
  return {
    traceQualificationComplete: missingFields.length ? "NO" : "YES",
    missingFields,
    caseAdjudicable: missingFields.length === 0,
  };
};

export const EXECUTION_OUTCOME_CONTRACT = Object.freeze({
  version: HARNESS_VERSION,
  expectedExecutionModes: EXPECTED_EXECUTION_MODES,
  outcomeKinds: EXECUTION_OUTCOME_KINDS,
  noOwnerResultAutomaticallyMeansOwnerFailure: false,
  expectedPreOwnerRejectionFailureClass: null,
  expectedPreOwnerRejectionOwnerRepairRequired: false,
});

export const TRACE_TERMINAL_CONTRACT = Object.freeze({
  validationBeforeOwnerSeparatedFromOwnerInvocation: true,
  fabricatedOwnerFailureEventPermitted: false,
  preOwnerRequestAndResultRefs: null,
  privateReasoningStored: false,
});

export const contractDigest = () => logicalDigest({
  version: HARNESS_VERSION,
  executionOutcomeContract: EXECUTION_OUTCOME_CONTRACT,
  traceTerminalContract: TRACE_TERMINAL_CONTRACT,
  deriveExecutionOutcome: stableStringify(deriveExecutionOutcome),
  traceCompleteness: stableStringify(evaluateTraceCompleteness),
  knowledgeGate: stableStringify(evaluateKnowledgeInputGate),
});
