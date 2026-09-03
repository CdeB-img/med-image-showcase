import {
  DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT,
  DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
  executeDataManagementReasoningRuntime,
  validateDataManagementReasoningResult,
  type CanonicalStudyDataResult,
  type DataManagementReasoningResult,
  type DataManagementReasoningRuntimeInput,
  type SyntheticDataCorrection,
  type SyntheticDataFinding,
  type SyntheticDataLifecycle,
  type SyntheticDataQuery,
  type SyntheticDataReconciliation,
} from "@/features/data-analysis-planning";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT,
  SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION,
  createSpecializedOwnerHandoffRequestFromSnapshot,
  recordSpecializedOwnerResult,
  type ProjectContextSnapshot,
  type ScientificReasoningOwnerObservation,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";
import {
  PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
  PRODUCT_OWNER_RESULT_LEDGER_VERSION,
  appendProductOwnerInvocation,
  ownerResultNativeDigest,
  readProductOwnerResult,
  type ProductOwnerResultDependency,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import { recordOwnerInvocationTrace, recordRejectedHandoffTrace, type ScientificRunTraceRecorder } from "./scientific-execution-trace";

export type ProductDataManagementOwnerInvocation = {
  ledger: Readonly<ProductOwnerResultLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<DataManagementReasoningRuntimeInput, DataManagementReasoningResult>>;
  request: Readonly<SpecializedOwnerHandoffRequest<DataManagementReasoningRuntimeInput>>;
  result: Readonly<SpecializedOwnerResult<DataManagementReasoningResult>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  cdmOwnerResult: Readonly<SpecializedOwnerResult<CanonicalStudyDataResult>>;
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

const currentCdmResult = (
  ledger: Readonly<ProductOwnerResultLedger>,
  snapshot: Readonly<ProjectContextSnapshot>,
) => {
  const retained = [...ledger.entries].reverse().find((entry) => entry.result?.owner === "STUDY_DATA_CDM"
    && entry.result.capabilityId === "STUDY_DATA_PLANNING"
    && entry.result.sourceProjectRef === snapshot.sourceProjectRef
    && entry.result.sourceProjectVersion === snapshot.sourceProjectVersion
    && entry.result.sourceProjectDigest === snapshot.sourceProjectDigest
    && entry.result.sourceSnapshotDigest === snapshot.snapshotDigest);
  const payload = retained?.result?.nativePayload as CanonicalStudyDataResult | null | undefined;
  if (!retained?.result || payload?.contract !== "CANONICAL_STUDY_DATA_RESULT"
    || payload.resultDigest !== ownerResultNativeDigest(retained.result)) throw new Error("DATA_MANAGEMENT_CURRENT_CDM_RESULT_REQUIRED");
  return retained.result as SpecializedOwnerResult<CanonicalStudyDataResult>;
};

export const invokeDataManagementForProjectSnapshot = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  purpose: string;
  selectedNeed: DataManagementReasoningRuntimeInput["selectedNeed"];
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  findings?: readonly SyntheticDataFinding[];
  queries?: readonly SyntheticDataQuery[];
  corrections?: readonly SyntheticDataCorrection[];
  reconciliations?: readonly SyntheticDataReconciliation[];
  lifecycle?: SyntheticDataLifecycle | null;
  runtime?: (nativeInput: Readonly<DataManagementReasoningRuntimeInput>) => Readonly<DataManagementReasoningResult>;
  trace?: ScientificRunTraceRecorder;
}): ProductDataManagementOwnerInvocation => {
  const cdmOwnerResult = currentCdmResult(input.ledger, input.projectSnapshot);
  const cdmPayload = cdmOwnerResult.nativePayload!;
  const cdmDigest = ownerResultNativeDigest(cdmOwnerResult);
  if (!cdmDigest) throw new Error("DATA_MANAGEMENT_CDM_RESULT_DIGEST_MISSING");
  const nativeInput: DataManagementReasoningRuntimeInput = {
    contract: DATA_MANAGEMENT_REASONING_RUNTIME_CONTRACT,
    contractVersion: DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
    inputId: `data-management-runtime-input:${logicalDigest({
      project: input.projectSnapshot.snapshotDigest,
      cdm: cdmDigest,
      need: input.selectedNeed,
      findings: input.findings ?? [],
      queries: input.queries ?? [],
      corrections: input.corrections ?? [],
      reconciliations: input.reconciliations ?? [],
      lifecycle: input.lifecycle ?? null,
    })}`,
    projectId: input.projectSnapshot.sourceProjectRef,
    projectVersion: input.projectSnapshot.sourceProjectVersion,
    projectDigest: input.projectSnapshot.sourceProjectDigest,
    projectSnapshot: input.projectSnapshot,
    selectedNeed: structuredClone(input.selectedNeed),
    cdmResult: cdmPayload,
    upstreamOwnerInputs: [{
      sourceOwner: "STUDY_DATA_CDM",
      resultRef: cdmOwnerResult.resultId,
      resultVersion: cdmOwnerResult.resultVersion,
      resultDigest: cdmDigest,
      purpose: "Fonder les opérations Data Management sur la représentation CDM exacte.",
      requirementRefs: cdmPayload.downstreamHandoffs.flatMap((item) => item.informationNeeded),
      provenanceRefs: [cdmPayload.resultId, cdmPayload.resultDigest],
      ownershipTransferred: false,
    }],
    findings: structuredClone(input.findings ?? []),
    queries: structuredClone(input.queries ?? []),
    corrections: structuredClone(input.corrections ?? []),
    reconciliations: structuredClone(input.reconciliations ?? []),
    lifecycle: input.lifecycle ? structuredClone(input.lifecycle) : null,
    projectWriteAuthorized: false,
  };
  const handoffId = `data-management-handoff:${logicalDigest({ caller: input.callerRef, input: nativeInput.inputId })}`;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId,
    owner: "DATA_MANAGEMENT",
    capabilityId: "DATA_MANAGEMENT_PLANNING",
    purpose: input.purpose,
    sourceProject: input.projectSnapshot,
    nativeInputType: "DataManagementReasoningRuntimeInput",
    nativeInputVersion: DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
    nativeInput,
  });
  const invocationId = `scientific-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  try {
    const nativeOutput = (input.runtime ?? executeDataManagementReasoningRuntime)(request.nativeInput);
    const validation = validateDataManagementReasoningResult(nativeInput, nativeOutput);
    if (validation.status !== "PASS") throw new Error(validation.findings[0] ?? "DATA_MANAGEMENT_RESULT_INVALID");
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeOutput.resultId,
      resultVersion: nativeOutput.resultVersion,
      completedAt: input.completedAt,
      status: nativeOutput.informationNeeds.length || nativeOutput.limitations.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind: nativeOutput.collectionRequirements.length ? "INFORMATIONAL_ONLY" : "GAP",
      nativePayloadType: "DataManagementReasoningResult",
      nativePayloadVersion: nativeOutput.resultVersion,
      nativePayload: nativeOutput,
      stableProjectRefs: input.projectSnapshot.objects.map((item) => item.stableId),
      evidenceRefs: [cdmPayload.resultId, cdmPayload.resultDigest],
      unknowns: [...nativeOutput.unresolvedQuestions],
      gaps: nativeOutput.informationNeeds.map((item) => item.needId),
      limitations: [...nativeOutput.limitations],
      provenance: [nativeOutput.resultId, nativeOutput.resultDigest, nativeInput.inputId, cdmPayload.resultId],
      humanDecisionRequired: nativeOutput.resultStatus === "HUMAN_REVIEW_REQUIRED",
    });
    const observation: ScientificReasoningOwnerObservation = {
      contract: SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT,
      contractVersion: SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION,
      invocationId,
      handoffId,
      owner: "DATA_MANAGEMENT",
      capabilityId: "DATA_MANAGEMENT_PLANNING",
      ownerRuntimeVersion: DATA_MANAGEMENT_REASONING_RUNTIME_VERSION,
      sourceProjectRef: nativeInput.projectId,
      sourceProjectVersion: nativeInput.projectVersion,
      sourceProjectDigest: nativeInput.projectDigest,
      requestRef: handoffId,
      resultRef: `${result.resultId}@${result.resultVersion}`,
      status: result.status === "COMPLETED" ? "COMPLETED" : "COMPLETED_WITH_LIMITATIONS",
      failureCode: null,
      stableProjectRefs: result.stableProjectRefs,
      unknowns: result.unknowns,
      gaps: result.gaps,
      limitations: result.limitations,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      latencyMs: 0,
      runtimeStarts: 1,
      conversationalLlmCalls: 0,
      projectWrites: 0,
    };
    const dependencies: ProductOwnerResultDependency[] = [{
      owner: "STUDY_DATA_CDM",
      resultId: cdmOwnerResult.resultId,
      resultVersion: cdmOwnerResult.resultVersion,
      nativeResultDigest: cdmDigest,
    }];
    const retained = appendProductOwnerInvocation({
      ledger: input.ledger,
      callerRef: input.callerRef,
      retainedAt: input.retainedAt ?? input.completedAt,
      request,
      result,
      observation,
      dependencies,
    });
    recordOwnerInvocationTrace(input.trace, {
      entry: retained.entry,
      ledgerContract: PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
      ledgerVersion: PRODUCT_OWNER_RESULT_LEDGER_VERSION,
      handoffStage: "OWNER_REQUEST_BUILDING",
      nextExpectedHandoff: "BIOSTATISTICS",
    });
    return deepFreeze({
      ledger: retained.ledger,
      entry: retained.entry,
      request: retained.entry.request,
      result: retained.entry.result,
      observation: retained.entry.observation,
      cdmOwnerResult,
      projectWrites: 0,
      humanDecisionCreated: false,
      providerCalls: 0,
    }) as ProductDataManagementOwnerInvocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "DATA_MANAGEMENT_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "DATA_MANAGEMENT",
      stage: code.includes("PROJECT") || code.includes("CDM") ? "PROJECT_CONTEXT" : "DATA_MANAGEMENT_ENGINE",
      code,
      stale: code.includes("STALE"),
    });
    throw error;
  }
};

export const readProductDataManagementResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => readProductOwnerResult({
  ledger: input.ledger,
  resultId: input.resultId,
  currentProjectSnapshot: input.currentProjectSnapshot,
  expectedOwner: "DATA_MANAGEMENT",
});
