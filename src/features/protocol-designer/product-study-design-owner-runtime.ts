import type {
  StudyDesignProposalContribution,
  StudyDesignRuntimeInput,
} from "@/features/study-design";
import {
  invokeStudyDesignOwnerFromSnapshot,
  type ProjectContextSnapshot,
  type ScientificReasoningOwnerObservation,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";
import {
  PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
  PRODUCT_OWNER_RESULT_LEDGER_VERSION,
  appendProductOwnerInvocation,
  readProductOwnerResult,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import {
  recordOwnerInvocationTrace,
  recordRejectedHandoffTrace,
  type ScientificRunTraceRecorder,
} from "./scientific-execution-trace";

export type ProductStudyDesignOwnerInvocation = {
  ledger: Readonly<ProductOwnerResultLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<StudyDesignRuntimeInput, StudyDesignProposalContribution>>;
  request: Readonly<SpecializedOwnerHandoffRequest<StudyDesignRuntimeInput>>;
  result: Readonly<SpecializedOwnerResult<StudyDesignProposalContribution>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  downstreamHandoffRequests: readonly Readonly<SpecializedOwnerHandoffRequest>[];
  projectWrites: 0;
  humanDecisionCreated: false;
  providerCalls: 0;
};

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

export const invokeStudyDesignForProjectSnapshot = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  purpose: string;
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  runtime?: (nativeInput: Readonly<StudyDesignRuntimeInput>) => Readonly<StudyDesignProposalContribution>;
  monotonicNow?: () => number;
  trace?: ScientificRunTraceRecorder;
}): ProductStudyDesignOwnerInvocation => {
  try {
    const invocation = invokeStudyDesignOwnerFromSnapshot({
      projectSnapshot: input.projectSnapshot,
      purpose: input.purpose,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      runtime: input.runtime,
      monotonicNow: input.monotonicNow,
    });
    const retained = appendProductOwnerInvocation({
      ledger: input.ledger,
      callerRef: input.callerRef,
      retainedAt: input.retainedAt ?? input.completedAt,
      request: invocation.request,
      result: invocation.result,
      observation: invocation.observation,
      dependencies: [],
    });
    recordOwnerInvocationTrace(input.trace, {
      entry: retained.entry,
      ledgerContract: PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
      ledgerVersion: PRODUCT_OWNER_RESULT_LEDGER_VERSION,
      handoffStage: "OWNER_REQUEST_BUILDING",
      nextExpectedHandoff: null,
    });
    return deepFreeze({
      ledger: retained.ledger,
      entry: retained.entry,
      request: retained.entry.request,
      result: retained.entry.result,
      observation: retained.entry.observation,
      downstreamHandoffRequests: invocation.downstreamHandoffRequests,
      projectWrites: 0,
      humanDecisionCreated: false,
      providerCalls: 0,
    }) as ProductStudyDesignOwnerInvocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "STUDY_DESIGN_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "STUDY_DESIGN",
      stage: code.includes("PROJECT") || code.includes("SNAPSHOT") ? "PROJECT_CONTEXT" : "STUDY_DESIGN_ENGINE",
      code,
      expectedProject: input.trace?.getRun().project ?? null,
      receivedProject: {
        projectId: input.projectSnapshot.sourceProjectRef,
        projectVersion: input.projectSnapshot.sourceProjectVersion,
        projectDigest: input.projectSnapshot.sourceProjectDigest,
        snapshotRef: input.projectSnapshot.snapshotDigest,
      },
      stale: code.includes("STALE"),
    });
    throw error;
  }
};

export const readProductStudyDesignOwnerResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => readProductOwnerResult({
  ledger: input.ledger,
  resultId: input.resultId,
  currentProjectSnapshot: input.currentProjectSnapshot,
  expectedOwner: "STUDY_DESIGN",
});
