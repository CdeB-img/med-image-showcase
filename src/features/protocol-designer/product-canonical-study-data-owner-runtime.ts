import {
  CANONICAL_STUDY_DATA_RUNTIME_CONTRACT,
  CANONICAL_STUDY_DATA_RUNTIME_VERSION,
  executeCanonicalStudyDataRuntime,
  validateCanonicalStudyDataResult,
  type CanonicalBiospecimenRepresentation,
  type CanonicalDerivationRequirement,
  type CanonicalStudyDataResult,
  type CanonicalStudyDataRuntimeInput,
  type ExplicitSyntheticVariableOccurrence,
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

export type ProductCanonicalStudyDataOwnerInvocation = {
  ledger: Readonly<ProductOwnerResultLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<CanonicalStudyDataRuntimeInput, CanonicalStudyDataResult>>;
  request: Readonly<SpecializedOwnerHandoffRequest<CanonicalStudyDataRuntimeInput>>;
  result: Readonly<SpecializedOwnerResult<CanonicalStudyDataResult>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  projectWrites: 0;
  humanDecisionCreated: false;
  providerCalls: 0;
};

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

export const invokeCanonicalStudyDataForProjectSnapshot = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  purpose: string;
  selectedNeed: CanonicalStudyDataRuntimeInput["selectedNeed"];
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  upstreamOwnerInputs?: CanonicalStudyDataRuntimeInput["upstreamOwnerInputs"];
  explicitSyntheticOccurrences?: readonly ExplicitSyntheticVariableOccurrence[];
  derivationRequirements?: readonly CanonicalDerivationRequirement[];
  biospecimenRepresentations?: readonly CanonicalBiospecimenRepresentation[];
  runtime?: (nativeInput: Readonly<CanonicalStudyDataRuntimeInput>) => Readonly<CanonicalStudyDataResult>;
  trace?: ScientificRunTraceRecorder;
}): ProductCanonicalStudyDataOwnerInvocation => {
  const directProjectLineage: CanonicalStudyDataRuntimeInput["upstreamOwnerInputs"][number] = {
    sourceOwner: "RESEARCH_PROJECT",
    resultRef: input.projectSnapshot.sourceProjectRef,
    resultVersion: input.projectSnapshot.sourceProjectVersion,
    resultDigest: input.projectSnapshot.sourceProjectDigest,
    purpose: input.selectedNeed.purpose,
    provenanceRefs: [input.projectSnapshot.snapshotDigest, input.selectedNeed.needRef],
    ownershipTransferred: false,
  };
  const nativeInput: CanonicalStudyDataRuntimeInput = {
    contract: CANONICAL_STUDY_DATA_RUNTIME_CONTRACT,
    contractVersion: CANONICAL_STUDY_DATA_RUNTIME_VERSION,
    inputId: `cdm-runtime-input:${logicalDigest({ project: input.projectSnapshot.snapshotDigest, need: input.selectedNeed, upstream: input.upstreamOwnerInputs ?? [] })}`,
    projectId: input.projectSnapshot.sourceProjectRef,
    projectVersion: input.projectSnapshot.sourceProjectVersion,
    projectDigest: input.projectSnapshot.sourceProjectDigest,
    projectSnapshot: input.projectSnapshot,
    selectedNeed: structuredClone(input.selectedNeed),
    upstreamOwnerInputs: [directProjectLineage, ...structuredClone(input.upstreamOwnerInputs ?? [])],
    explicitSyntheticOccurrences: structuredClone(input.explicitSyntheticOccurrences ?? []),
    derivationRequirements: structuredClone(input.derivationRequirements ?? []),
    biospecimenRepresentations: structuredClone(input.biospecimenRepresentations ?? []),
    projectWriteAuthorized: false,
  };
  const handoffId = `cdm-handoff:${logicalDigest({ caller: input.callerRef, input: nativeInput.inputId })}`;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId,
    owner: "STUDY_DATA_CDM",
    capabilityId: "STUDY_DATA_PLANNING",
    purpose: input.purpose,
    sourceProject: input.projectSnapshot,
    nativeInputType: "CanonicalStudyDataRuntimeInput",
    nativeInputVersion: CANONICAL_STUDY_DATA_RUNTIME_VERSION,
    nativeInput,
  });
  const invocationId = `scientific-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  try {
    const nativeOutput = (input.runtime ?? executeCanonicalStudyDataRuntime)(request.nativeInput);
    const validation = validateCanonicalStudyDataResult(nativeInput, nativeOutput);
    if (validation.status !== "PASS") throw new Error(validation.findings[0] ?? "CDM_RESULT_INVALID");
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeOutput.resultId,
      resultVersion: nativeOutput.resultVersion,
      completedAt: input.completedAt,
      status: nativeOutput.informationNeeds.length || nativeOutput.limitations.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind: nativeOutput.variableRepresentations.length ? "INFORMATIONAL_ONLY" : "GAP",
      nativePayloadType: "CanonicalStudyDataResult",
      nativePayloadVersion: nativeOutput.resultVersion,
      nativePayload: nativeOutput,
      stableProjectRefs: input.projectSnapshot.objects.map((item) => item.stableId),
      evidenceRefs: unique(nativeOutput.sourceOwnerLineage.flatMap((item) => item.provenanceRefs)),
      unknowns: [...nativeOutput.unresolvedQuestions],
      gaps: nativeOutput.informationNeeds.map((item) => item.needId),
      limitations: [...nativeOutput.limitations],
      provenance: [nativeOutput.resultId, nativeOutput.resultDigest, nativeInput.inputId],
      humanDecisionRequired: false,
    });
    const observation: ScientificReasoningOwnerObservation = {
      contract: SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT,
      contractVersion: SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION,
      invocationId,
      handoffId,
      owner: "STUDY_DATA_CDM",
      capabilityId: "STUDY_DATA_PLANNING",
      ownerRuntimeVersion: CANONICAL_STUDY_DATA_RUNTIME_VERSION,
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
    const dependencies: ProductOwnerResultDependency[] = nativeInput.upstreamOwnerInputs
      .flatMap((item): ProductOwnerResultDependency[] => {
        if (item.sourceOwner === "RESEARCH_PROJECT") return [];
        const retainedUpstream = input.ledger.entries.find((entry) => entry.result?.owner === item.sourceOwner
          && entry.result.resultId === item.resultRef
          && entry.result.resultVersion === item.resultVersion);
        if (!retainedUpstream?.result || ownerResultNativeDigest(retainedUpstream.result) !== item.resultDigest) {
          throw new Error("CDM_UPSTREAM_RESULT_NOT_RETAINED");
        }
        return [{
          owner: item.sourceOwner,
          resultId: item.resultRef,
          resultVersion: item.resultVersion,
          nativeResultDigest: item.resultDigest,
        }];
      });
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
      nextExpectedHandoff: "DATA_MANAGEMENT",
    });
    return deepFreeze({
      ledger: retained.ledger,
      entry: retained.entry,
      request: retained.entry.request,
      result: retained.entry.result,
      observation: retained.entry.observation,
      projectWrites: 0,
      humanDecisionCreated: false,
      providerCalls: 0,
    }) as ProductCanonicalStudyDataOwnerInvocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "CDM_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "STUDY_DATA_CDM",
      stage: code.includes("PROJECT") || code.includes("SNAPSHOT") ? "PROJECT_CONTEXT" : "CDM_ENGINE",
      code,
      stale: code.includes("STALE"),
    });
    throw error;
  }
};

export const readProductCanonicalStudyDataResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => readProductOwnerResult({
  ledger: input.ledger,
  resultId: input.resultId,
  currentProjectSnapshot: input.currentProjectSnapshot,
  expectedOwner: "STUDY_DATA_CDM",
});
