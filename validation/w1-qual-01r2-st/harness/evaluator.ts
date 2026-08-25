/* eslint-disable @typescript-eslint/no-explicit-any -- evaluator inspects frozen cross-owner evidence */
import {
  evaluateCampaignCase as evaluateR1CampaignCase,
  type EnvelopeObligation,
  type EvaluationCase,
  type EvaluationEnvelope,
} from "../../w1-qual-01r1-st/harness/evaluator";
import type { FailureClass, ObligationOutcome } from "../../w1-qual-01r1-st/harness/contracts";
import {
  evaluateTraceCompleteness,
  type ExpectedExecutionMode,
  type QualificationTraceR2,
} from "./contracts";

export type { EnvelopeObligation };

export type EvaluationCaseR2 = EvaluationCase & {
  expectedExecutionMode: ExpectedExecutionMode;
  expectedRejectionCodes: string[];
};

export type EvaluationEnvelopeR2 = EvaluationEnvelope & {
  expectedExecutionMode: ExpectedExecutionMode;
  ownerResultRequired: boolean;
};

export type EvaluationR2 = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  outcome: ObligationOutcome;
  failureClass: FailureClass | "OWNER_EXECUTION_FAILURE" | "UNEXPECTED_PRE_OWNER_FAILURE" | "NON_ADJUDICABLE_TECHNICAL_FAILURE" | null;
  firstDivergentStage: string | null;
  evidence: string[];
  note: string;
};

const preOwnerAdjudicableChecks = new Set([
  "PROJECT_IDENTITY",
  "KNOWLEDGE_LINEAGE",
  "ZERO_PROJECT_WRITE",
  "NO_PROVIDER_CALL",
  "NEGATIVE_EXPECTATION",
  "EPISTEMIC_SAFETY",
  "STALE_PROTECTION",
]);

const expectedPreOwnerEvaluations = (
  obligations: EnvelopeObligation[],
  trace: QualificationTraceR2,
): EvaluationR2[] => obligations.map((item) => {
  const applicable = preOwnerAdjudicableChecks.has(item.checkId);
  return {
    obligationId: item.obligationId,
    checkId: item.checkId,
    critical: item.critical,
    outcome: applicable ? "SATISFIED" : "NOT_APPLICABLE",
    failureClass: null,
    firstDivergentStage: null,
    evidence: applicable
      ? [
        `executionOutcome=${trace.executionOutcome.kind}`,
        `rejectionCode=${trace.rejectionCode}`,
        `ownerInvocations=${trace.ownerInvocationCount}`,
        `ownerResults=${trace.ownerResultCount}`,
      ]
      : [],
    note: applicable
      ? "The pre-authored fail-closed contract was satisfied without owner execution, OwnerResult, evidence promotion or side effect."
      : "This scientific-output obligation is not applicable because the contract required rejection before owner execution.",
  };
});

const technicalFailureEvaluations = (
  obligations: EnvelopeObligation[],
  trace: QualificationTraceR2,
): EvaluationR2[] => obligations.map((item) => ({
  obligationId: item.obligationId,
  checkId: item.checkId,
  critical: item.critical,
  outcome: "NON_ADJUDICABLE",
  failureClass: trace.executionOutcome.failureClass,
  firstDivergentStage: trace.executionOutcome.firstDivergentStage,
  evidence: [
    `executionOutcome=${trace.executionOutcome.kind}`,
    `error=${trace.rejectionCode ?? "NONE"}`,
    `ownerInvocations=${trace.ownerInvocationCount}`,
    `ownerResults=${trace.ownerResultCount}`,
  ],
  note: trace.executionOutcome.kind === "OWNER_EXECUTION_FAILURE"
    ? "The owner runtime started and failed before producing an OwnerResult; scientific-output obligations cannot be adjudicated."
    : "A technical failure before an expected owner execution prevents attribution of scientific-output obligations to ST.",
}));

export const evaluateCampaignCase = (input: {
  caseItem: EvaluationCaseR2;
  envelope: EvaluationEnvelopeR2;
  invocation: any | null;
  error: string | null;
  trace: QualificationTraceR2;
  frozenInputValid: boolean;
}) => {
  const traceGate = evaluateTraceCompleteness(input.trace);
  if (!traceGate.caseAdjudicable || !input.frozenInputValid || input.envelope.referenceStatus !== "VALID") {
    const failureClass = !traceGate.caseAdjudicable
      ? "TRACE_INCOMPLETE"
      : input.envelope.referenceStatus !== "VALID"
        ? "REFERENCE_ENVELOPE_DEFECT"
        : "FROZEN_INPUT_DEFECT";
    return {
      traceGate,
      executionOutcome: input.trace.executionOutcome,
      evaluations: input.envelope.obligations.map((item): EvaluationR2 => ({
        obligationId: item.obligationId,
        checkId: item.checkId,
        critical: item.critical,
        outcome: "NON_ADJUDICABLE",
        failureClass,
        firstDivergentStage: !traceGate.caseAdjudicable ? "TRACE_INSTRUMENTATION" : input.envelope.referenceStatus !== "VALID" ? "CHARACTERIZATION_REFERENCE" : "FROZEN_INPUT_PACK",
        evidence: traceGate.missingFields,
        note: "Owner adjudication is prohibited until harness, reference, frozen input and TRACE gates are valid.",
      })),
      caseVerdict: "NON_ADJUDICABLE" as const,
      firstDivergentStage: !traceGate.caseAdjudicable ? "TRACE_INSTRUMENTATION" : input.envelope.referenceStatus !== "VALID" ? "CHARACTERIZATION_REFERENCE" : "FROZEN_INPUT_PACK",
      ownerCharacterizationStatus: "NOT_ADJUDICATED" as const,
      failureClass,
    };
  }

  if (input.trace.executionOutcome.kind === "EXPECTED_PRE_OWNER_REJECTION") {
    return {
      traceGate,
      executionOutcome: input.trace.executionOutcome,
      evaluations: expectedPreOwnerEvaluations(input.envelope.obligations, input.trace),
      caseVerdict: "FULLY_SATISFIED" as const,
      firstDivergentStage: null,
      ownerCharacterizationStatus: "CHARACTERIZED_WITHIN_BOUNDED_SCOPE" as const,
      failureClass: null,
    };
  }

  if (input.trace.executionOutcome.kind === "OWNER_EXECUTION_FAILURE") {
    return {
      traceGate,
      executionOutcome: input.trace.executionOutcome,
      evaluations: technicalFailureEvaluations(input.envelope.obligations, input.trace),
      caseVerdict: "CRITICAL_VIOLATION" as const,
      firstDivergentStage: "SCIENTIFIC_THINKING_ENGINE" as const,
      ownerCharacterizationStatus: "OWNER_REPAIR_REQUIRED" as const,
      failureClass: "OWNER_EXECUTION_FAILURE" as const,
    };
  }

  if (["UNEXPECTED_PRE_OWNER_FAILURE", "NON_ADJUDICABLE_TECHNICAL_FAILURE"].includes(input.trace.executionOutcome.kind)) {
    return {
      traceGate,
      executionOutcome: input.trace.executionOutcome,
      evaluations: technicalFailureEvaluations(input.envelope.obligations, input.trace),
      caseVerdict: "NON_ADJUDICABLE" as const,
      firstDivergentStage: input.trace.executionOutcome.firstDivergentStage,
      ownerCharacterizationStatus: "NOT_ADJUDICATED" as const,
      failureClass: input.trace.executionOutcome.failureClass,
    };
  }

  const delegated = evaluateR1CampaignCase({
    caseItem: input.caseItem,
    envelope: input.envelope,
    invocation: input.invocation,
    error: input.error,
    trace: input.trace as any,
    frozenInputValid: input.frozenInputValid,
  });
  return {
    ...delegated,
    traceGate,
    executionOutcome: input.trace.executionOutcome,
    failureClass: delegated.evaluations.find((item) => item.critical && item.outcome === "VIOLATED")?.failureClass ?? null,
  };
};
