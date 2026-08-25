/* eslint-disable @typescript-eslint/no-explicit-any -- evaluator inspects frozen cross-owner evidence */
import { stableStringify } from "@/features/knowledge-engine";
import {
  adjudicateCase,
  evaluateMechanisticObligation,
  evaluateNegativeExpectation,
  evaluateTraceCompleteness,
  type FailureClass,
  type FirstDivergentStage,
  type NegativeExpectationMode,
  type ObligationOutcome,
  type QualificationTrace,
} from "./contracts";

export type EnvelopeObligation = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  statement: string;
  failureClass: FailureClass;
  firstDivergentStage: FirstDivergentStage;
  referenceRefs: string[];
};

export type EvaluationCase = {
  caseId: string;
  negativeExpectationMode: NegativeExpectationMode;
  explicitProjectQuestion: string | null;
  expectedGaps: string[];
  expectedLimitations: string[];
  expectedContradictions: string[];
  mechanisticObligation: boolean;
  alternativesObligation: boolean;
  staleExpected: boolean;
};

export type EvaluationEnvelope = {
  caseId: string;
  referenceStatus: "VALID" | "DEFECT";
  obligations: EnvelopeObligation[];
};

export type Evaluation = {
  obligationId: string;
  checkId: string;
  critical: boolean;
  outcome: ObligationOutcome;
  failureClass: FailureClass;
  firstDivergentStage: FirstDivergentStage | null;
  evidence: string[];
  note: string;
};

const candidateCounts = (native: any) => ({
  questions: native?.questions?.length ?? 0,
  hypotheses: native?.hypotheses?.length ?? 0,
  objectives: native?.objectives?.length ?? 0,
  mechanisms: native?.mechanisms?.length ?? 0,
  alternatives: native?.alternatives?.length ?? 0,
  scientificModels: native?.scientificModels?.length ?? 0,
});

const normalized = (value: string) => value.trim().replace(/[?.!]+$/, "").toLocaleLowerCase("fr-FR");
const includesExpected = (observed: string[], expected: string[]) => expected.every((item) => observed.includes(item));

export const evaluateCampaignCase = (input: {
  caseItem: EvaluationCase;
  envelope: EvaluationEnvelope;
  invocation: any | null;
  error: string | null;
  trace: QualificationTrace;
  frozenInputValid: boolean;
}) => {
  const traceGate = evaluateTraceCompleteness(input.trace);
  if (!traceGate.caseAdjudicable || !input.frozenInputValid || input.envelope.referenceStatus !== "VALID") {
    const gate = adjudicateCase({
      harnessDefect: !traceGate.caseAdjudicable,
      referenceDefect: input.envelope.referenceStatus !== "VALID",
      frozenInputValid: input.frozenInputValid,
      traceComplete: traceGate.caseAdjudicable,
      scientificConflictRequiresHuman: false,
      validOwnerCriticalViolation: false,
      nonCriticalLimitations: false,
    });
    return {
      traceGate,
      evaluations: input.envelope.obligations.map((item): Evaluation => ({
        obligationId: item.obligationId,
        checkId: item.checkId,
        critical: item.critical,
        outcome: "NON_ADJUDICABLE",
        failureClass: !traceGate.caseAdjudicable ? "TRACE_INCOMPLETE" : input.envelope.referenceStatus !== "VALID" ? "REFERENCE_ENVELOPE_DEFECT" : "FROZEN_INPUT_DEFECT",
        firstDivergentStage: gate.firstDivergentStage,
        evidence: traceGate.missingFields,
        note: "Owner adjudication is prohibited until harness, reference, frozen input and TRACE gates are valid.",
      })),
      caseVerdict: gate.caseVerdict,
      firstDivergentStage: gate.firstDivergentStage,
      ownerCharacterizationStatus: gate.status.ownerCharacterizationStatus,
    };
  }

  const native = input.invocation?.result?.nativePayload ?? null;
  const request = input.invocation?.request ?? null;
  const result = input.invocation?.result ?? null;
  const entry = input.invocation?.entry ?? null;
  const counts = candidateCounts(native);
  const outputText = stableStringify(native ?? "").toLocaleLowerCase("fr-FR");
  const observedGaps = [...(native?.knowledgeRequest?.gapCodes ?? []), ...(result?.gaps ?? [])];
  const observedLimitations = [...(native?.limitations ?? []), ...(result?.limitations ?? [])];
  const observedContradictions = native?.contradictions ?? [];

  const evaluations = input.envelope.obligations.map((item): Evaluation => {
    let outcome: ObligationOutcome = "VIOLATED";
    let evidence: string[] = [];
    let note = "Obligation not satisfied.";
    switch (item.checkId) {
      case "PROJECT_IDENTITY": {
        if (input.caseItem.staleExpected) {
          outcome = input.error === "STALE_KNOWLEDGE_RESULT" ? "SATISFIED" : "VIOLATED";
          evidence = [input.error ?? "NO_ERROR"];
          note = outcome === "SATISFIED" ? "The successor Project rejected the stale Knowledge binding before ST runtime." : "Expected stale rejection was absent.";
        } else {
          const source = request?.sourceProject;
          const project = input.trace.project;
          const passed = Boolean(source && project && result
            && source.sourceProjectRef === project.projectId
            && source.sourceProjectVersion === project.projectVersion
            && source.sourceProjectDigest === project.projectDigest
            && result.sourceProjectRef === project.projectId
            && result.sourceProjectVersion === project.projectVersion
            && result.sourceProjectDigest === project.projectDigest);
          outcome = passed ? "SATISFIED" : "VIOLATED";
          evidence = [`${source?.sourceProjectRef ?? "missing"}@${source?.sourceProjectVersion ?? "missing"}`, source?.sourceProjectDigest ?? "missing"];
          note = passed ? "Exact canonical Project identity is preserved." : "Project identity diverged.";
        }
        break;
      }
      case "KNOWLEDGE_LINEAGE": {
        if (input.caseItem.staleExpected) {
          outcome = input.error === "STALE_KNOWLEDGE_RESULT" ? "SATISFIED" : "VIOLATED";
          evidence = [input.error ?? "NO_ERROR"];
          note = outcome === "SATISFIED" ? "Stale upstream lineage was rejected fail-closed." : "Stale lineage was accepted.";
        } else {
          const dep = native?.knowledgeDependencies?.[0];
          const ledgerDep = entry?.dependencies?.find((candidate: any) => candidate.owner === "KNOWLEDGE");
          const passed = Boolean(dep && ledgerDep
            && dep.ownershipTransferred === false
            && dep.knowledgeResultRef === input.trace.knowledgeResultRef?.split("@")[0]
            && dep.knowledgeResultDigest === input.trace.knowledgeResultDigest
            && ledgerDep.resultId === dep.knowledgeResultRef
            && ledgerDep.nativeResultDigest === dep.knowledgeResultDigest);
          outcome = passed ? "SATISFIED" : "VIOLATED";
          evidence = [dep?.knowledgeResultRef ?? "missing", dep?.knowledgeResultDigest ?? "missing"];
          note = passed ? "Exact Knowledge ref/digest lineage is retained without ownership transfer." : "Knowledge lineage or ownership transfer boundary diverged.";
        }
        break;
      }
      case "ZERO_PROJECT_WRITE": {
        const passed = input.caseItem.staleExpected
          ? input.error === "STALE_KNOWLEDGE_RESULT"
          : input.invocation?.projectWrites === 0 && input.invocation?.humanDecisionBypassed === false && result?.projectWriteAuthorized === false;
        outcome = passed ? "SATISFIED" : "VIOLATED";
        evidence = [`projectWrites=${input.invocation?.projectWrites ?? 0}`, `projectWriteAuthorized=${String(result?.projectWriteAuthorized ?? false)}`];
        note = passed ? "No Project write, adoption or simulated Human Decision occurred." : "Project write boundary failed.";
        break;
      }
      case "NO_PROVIDER_CALL": {
        const passed = [input.invocation?.externalEvidenceCalls ?? 0, input.invocation?.geminiCalls ?? 0, input.invocation?.terraCalls ?? 0].every((value) => value === 0);
        outcome = passed ? "SATISFIED" : "VIOLATED";
        evidence = ["externalEvidenceCalls=0", "geminiCalls=0", "terraCalls=0"];
        note = passed ? "No LLM or external provider call occurred." : "A forbidden provider call occurred.";
        break;
      }
      case "NEGATIVE_EXPECTATION": {
        const pending = [...(native?.questions ?? []), ...(native?.hypotheses ?? []), ...(native?.objectives ?? [])].every((candidate: any) => candidate.reviewState !== "ADOPTED");
        const conditional = evaluateNegativeExpectation(input.caseItem.negativeExpectationMode, {
          status: native?.status ?? (input.error ? "REJECTED_BEFORE_OWNER_RUNTIME" : "UNKNOWN"),
          ...counts,
          candidatesPending: pending,
          conditionsExplicit: (native?.unknowns?.length ?? 0) > 0 || (native?.knowledgeRequest?.gapCodes?.length ?? 0) > 0,
          unknownsPreserved: (native?.unknowns?.length ?? 0) > 0 || input.caseItem.expectedGaps.length === 0,
          gapExplicit: observedGaps.length > 0 || (native?.unknowns?.length ?? 0) > 0,
          refusalCode: native?.refusal?.code ?? (input.error ? input.error : null),
        });
        outcome = conditional.outcome;
        evidence = [`mode=${input.caseItem.negativeExpectationMode}`, `status=${native?.status ?? "PRE_RUNTIME_REJECTION"}`, `hypotheses=${counts.hypotheses}`, `objectives=${counts.objectives}`];
        note = conditional.note;
        break;
      }
      case "MECHANISTIC_OR_EXPLANATORY": {
        if (!input.caseItem.mechanisticObligation) {
          outcome = "NOT_APPLICABLE";
          note = "No mechanistic obligation was pre-authored for this case.";
        } else {
          const mechanistic = evaluateMechanisticObligation({ mechanisms: native?.mechanisms ?? [], scientificModels: native?.scientificModels ?? [], hypotheses: native?.hypotheses ?? [] });
          outcome = mechanistic.outcome;
          evidence = [`mechanisms=${counts.mechanisms}`, `scientificModels=${counts.scientificModels}`, `evidenceKind=${mechanistic.evidenceKind ?? "none"}`];
          note = mechanistic.note;
        }
        break;
      }
      case "ALTERNATIVES_PRESERVED": {
        if (!input.caseItem.alternativesObligation) {
          outcome = "NOT_APPLICABLE";
          note = "No competing-alternatives obligation was pre-authored.";
        } else {
          const passed = counts.alternatives > 0 && counts.hypotheses >= 2;
          outcome = passed ? "SATISFIED" : "VIOLATED";
          evidence = [`alternatives=${counts.alternatives}`, `hypotheses=${counts.hypotheses}`];
          note = passed ? "A competing explanation remains visible and unselected." : "Competing alternatives were silently lost.";
        }
        break;
      }
      case "GAPS_PRESERVED": {
        const passed = includesExpected(observedGaps, input.caseItem.expectedGaps);
        outcome = passed ? "SATISFIED" : "VIOLATED";
        evidence = observedGaps;
        note = passed ? "All pre-authored Knowledge gaps remain inspectable." : "At least one expected Knowledge gap was lost.";
        break;
      }
      case "LIMITATIONS_PRESERVED": {
        const passed = input.caseItem.expectedLimitations.length === 0 || observedLimitations.length > 0;
        outcome = passed ? "SATISFIED" : "VIOLATED";
        evidence = observedLimitations;
        note = passed ? "Limitations remain explicit in ST/OwnerResult evidence." : "Expected limitations are absent.";
        break;
      }
      case "CONTRADICTIONS_PRESERVED": {
        const passed = input.caseItem.expectedContradictions.length === 0 || observedContradictions.length > 0;
        outcome = passed ? "SATISFIED" : "VIOLATED";
        evidence = observedContradictions;
        note = passed ? "Expected contradictions remain explicit." : "A Knowledge contradiction was lost.";
        break;
      }
      case "PROJECT_QUESTION_FIDELITY": {
        if (!input.caseItem.explicitProjectQuestion || input.caseItem.staleExpected) {
          outcome = "NOT_APPLICABLE";
          note = "No explicit current Project question is available for an exact fidelity check.";
        } else {
          const observed = native?.questions?.[0]?.text ?? "";
          const passed = normalized(observed) === normalized(input.caseItem.explicitProjectQuestion);
          outcome = passed ? "SATISFIED" : "VIOLATED";
          evidence = [input.caseItem.explicitProjectQuestion, observed];
          note = passed ? "The adopted Project question is reconstructed without semantic drift." : "The primary ST question drifted from the explicit Project question.";
        }
        break;
      }
      case "EPISTEMIC_SAFETY": {
        const primaryUnsupported = (native?.hypotheses ?? []).some((candidate: any) => candidate.kind === "PRIMARY" && candidate.support === "UNSUPPORTED" && !native?.knowledgeRequest);
        const promoted = [...(native?.questions ?? []), ...(native?.hypotheses ?? []), ...(native?.objectives ?? [])].some((candidate: any) => candidate.reviewState === "ADOPTED")
          || native?.selectedQuestionCandidate !== null
          || /scientifiquement prouv[ée]|regulatory approval|clinical validation|fait [ée]tabli|d[ée]cision adopt[ée]e/.test(outputText);
        const passed = !primaryUnsupported && !promoted && result?.projectWriteAuthorized === false;
        outcome = passed ? "SATISFIED" : "VIOLATED";
        evidence = [`primaryUnsupported=${primaryUnsupported}`, `promotion=${promoted}`, `projectWriteAuthorized=${String(result?.projectWriteAuthorized ?? false)}`];
        note = passed ? "No unsupported primary hypothesis, evidence promotion or adoption occurred." : "Epistemic safety boundary failed.";
        break;
      }
      case "STALE_PROTECTION": {
        if (!input.caseItem.staleExpected) {
          outcome = "NOT_APPLICABLE";
          note = "This case does not predeclare a stale input.";
        } else {
          const passed = input.error === "STALE_KNOWLEDGE_RESULT" && input.invocation === null;
          outcome = passed ? "SATISFIED" : "VIOLATED";
          evidence = [input.error ?? "NO_ERROR"];
          note = passed ? "Stale Knowledge was rejected before ST runtime and no conversion/recalculation occurred." : "Stale input was accepted or ambiguously handled.";
        }
        break;
      }
      default: {
        outcome = "NON_ADJUDICABLE";
        evidence = [item.checkId];
        note = "Unknown evaluator check; fail-closed as a harness defect.";
      }
    }
    return {
      obligationId: item.obligationId,
      checkId: item.checkId,
      critical: item.critical,
      outcome,
      failureClass: item.failureClass,
      firstDivergentStage: outcome === "VIOLATED" ? item.firstDivergentStage : null,
      evidence,
      note,
    };
  });

  const nonAdjudicable = evaluations.some((item) => item.outcome === "NON_ADJUDICABLE");
  const human = evaluations.some((item) => item.outcome === "HUMAN_ARBITRATION_REQUIRED");
  const critical = evaluations.find((item) => item.critical && item.outcome === "VIOLATED");
  const limited = evaluations.some((item) => !item.critical && ["PARTIALLY_SATISFIED", "VIOLATED"].includes(item.outcome));
  const caseVerdict = nonAdjudicable ? "NON_ADJUDICABLE"
    : human ? "HUMAN_ARBITRATION_REQUIRED"
      : critical ? "CRITICAL_VIOLATION"
        : limited ? "SATISFIED_WITH_NONCRITICAL_LIMITATIONS"
          : "FULLY_SATISFIED";
  return {
    traceGate,
    evaluations,
    caseVerdict,
    firstDivergentStage: critical?.firstDivergentStage ?? null,
    ownerCharacterizationStatus: nonAdjudicable ? "NOT_ADJUDICATED"
      : human ? "HUMAN_ARBITRATION_REQUIRED"
        : critical ? "OWNER_REPAIR_REQUIRED"
          : limited ? "CHARACTERIZED_WITH_LIMITATIONS"
            : "CHARACTERIZED_WITHIN_BOUNDED_SCOPE",
  };
};
