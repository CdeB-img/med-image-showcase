import {
  BIOSTATISTICS_REASONING_RUNTIME_CONTRACT,
  BIOSTATISTICS_REASONING_RUNTIME_VERSION,
  executeBiostatisticsReasoningRuntime,
  validateBiostatisticsReasoningResult,
  type BiostatisticsAnalyticalDecisions,
  type BiostatisticsReasoningResult,
  type BiostatisticsReasoningRuntimeInput,
  type BiostatisticsUpstreamOwnerInput,
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
import {
  recordOwnerInvocationTrace,
  recordRejectedHandoffTrace,
  type ScientificRunTraceRecorder,
} from "./scientific-execution-trace";

export type ProductBiostatisticsOwnerInvocation = {
  ledger: Readonly<ProductOwnerResultLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<BiostatisticsReasoningRuntimeInput, BiostatisticsReasoningResult>>;
  request: Readonly<SpecializedOwnerHandoffRequest<BiostatisticsReasoningRuntimeInput>>;
  result: Readonly<SpecializedOwnerResult<BiostatisticsReasoningResult>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  upstreamOwnerResults: readonly Readonly<SpecializedOwnerResult>[];
  projectWrites: 0;
  humanDecisionCreated: false;
  providerCalls: 0;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object";
const records = (value: unknown) => Array.isArray(value) ? value.filter(isRecord) : [];
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const matchingBiostatisticsHandoffs = (result: Readonly<SpecializedOwnerResult>) => {
  const payload = isRecord(result.nativePayload) ? result.nativePayload : null;
  return records(payload?.downstreamHandoffs).filter((handoff) => handoff.targetOwner === "BIOSTATISTICS");
};

const currentUpstreamResults = (
  ledger: Readonly<ProductOwnerResultLedger>,
  snapshot: Readonly<ProjectContextSnapshot>,
) => {
  const seen = new Set<string>();
  return [...ledger.entries].reverse().flatMap((entry): Readonly<SpecializedOwnerResult>[] => {
    const result = entry.result;
    if (!result
      || !["SCIENTIFIC_THINKING", "STUDY_DESIGN", "OBSERVABILITY_MEASUREMENT", "IMAGING"].includes(result.owner)
      || result.sourceProjectRef !== snapshot.sourceProjectRef
      || result.sourceProjectVersion !== snapshot.sourceProjectVersion
      || result.sourceProjectDigest !== snapshot.sourceProjectDigest
      || result.sourceSnapshotDigest !== snapshot.snapshotDigest
      || matchingBiostatisticsHandoffs(result).length === 0
      || seen.has(result.owner)) return [];
    seen.add(result.owner);
    return [result];
  }).reverse();
};

const upstreamInput = (result: Readonly<SpecializedOwnerResult>): BiostatisticsUpstreamOwnerInput => {
  const payload = isRecord(result.nativePayload) ? result.nativePayload : {};
  const handoffs = matchingBiostatisticsHandoffs(result);
  const options = records(payload.options);
  const designAxes = options.flatMap((option) => {
    const axes = isRecord(option.axes) ? option.axes : null;
    return axes && typeof axes.structuralForm === "string" && typeof axes.comparisonStructure === "string"
      ? [{ structuralForm: axes.structuralForm, comparisonStructure: axes.comparisonStructure }]
      : [];
  });
  const measurementDefinitions = records(payload.measurementDefinitions);
  const measurementValueNatures = measurementDefinitions.flatMap((definition) =>
    typeof definition.valueNature === "string" ? [definition.valueNature] : []);
  const imagingVariables = records(payload.imagingVariables);
  const designConsequences = records(payload.designConsequences);
  const repeatedMeasurementRefs = unique([
    ...imagingVariables.flatMap((variable) => strings(variable.timingIds).length > 1 && typeof variable.variableId === "string" ? [variable.variableId] : []),
    ...designConsequences.flatMap((consequence) => consequence.structuralForm === "LONGITUDINAL" && typeof consequence.consequenceRef === "string" ? [consequence.consequenceRef] : []),
  ]);
  const resultDigest = ownerResultNativeDigest(result);
  if (!resultDigest) throw new Error("BIOSTATISTICS_UPSTREAM_RESULT_DIGEST_MISSING");
  return {
    sourceOwner: result.owner as Exclude<BiostatisticsUpstreamOwnerInput["sourceOwner"], "RESEARCH_PROJECT">,
    resultRef: result.resultId,
    resultVersion: result.resultVersion,
    resultDigest,
    needRefs: unique(handoffs.flatMap((handoff) => [
      ...strings(handoff.informationNeeded),
      ...strings(handoff.provenanceRefs),
      ...(typeof handoff.handoffId === "string" ? [handoff.handoffId] : []),
    ])),
    purpose: handoffs.flatMap((handoff) => typeof handoff.purpose === "string" ? [handoff.purpose] : [])[0]
      ?? "Qualifier les conséquences analytiques du résultat upstream.",
    designAxes,
    measurementValueNatures,
    repeatedMeasurementRefs,
    limitations: unique([
      ...result.limitations,
      ...strings(payload.limitations),
      ...measurementDefinitions.flatMap((definition) => strings(definition.limitations)),
      ...imagingVariables.flatMap((variable) => strings(variable.limitations)),
    ]),
    provenanceRefs: unique([result.resultId, resultDigest, ...result.provenance]),
    ownershipTransferred: false,
  };
};

export const invokeBiostatisticsForProjectSnapshot = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  purpose: string;
  selectedNeed: BiostatisticsReasoningRuntimeInput["selectedNeed"];
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  analyticalDecisions?: BiostatisticsAnalyticalDecisions;
  dataRelease?: BiostatisticsReasoningRuntimeInput["dataRelease"];
  runtime?: (nativeInput: Readonly<BiostatisticsReasoningRuntimeInput>) => Readonly<BiostatisticsReasoningResult>;
  trace?: ScientificRunTraceRecorder;
}): ProductBiostatisticsOwnerInvocation => {
  const upstreamOwnerResults = currentUpstreamResults(input.ledger, input.projectSnapshot);
  const projectOccasionCounts = new Map<string, number>();
  input.projectSnapshot.expectedVariableOccasions.forEach((occasion) => {
    projectOccasionCounts.set(occasion.variableProjectRef, (projectOccasionCounts.get(occasion.variableProjectRef) ?? 0) + 1);
  });
  const directProjectLineage: BiostatisticsUpstreamOwnerInput = {
    sourceOwner: "RESEARCH_PROJECT",
    resultRef: input.projectSnapshot.sourceProjectRef,
    resultVersion: input.projectSnapshot.sourceProjectVersion,
    resultDigest: input.projectSnapshot.sourceProjectDigest,
    needRefs: [input.selectedNeed.needRef],
    purpose: input.selectedNeed.purpose,
    designAxes: [],
    measurementValueNatures: [],
    repeatedMeasurementRefs: input.projectSnapshot.expectedVariableOccasions
      .filter((item) => (projectOccasionCounts.get(item.variableProjectRef) ?? 0) > 1)
      .map((item) => item.stableId),
    limitations: [],
    provenanceRefs: [input.projectSnapshot.snapshotDigest, input.selectedNeed.needRef],
    ownershipTransferred: false,
  };
  const nativeInput: BiostatisticsReasoningRuntimeInput = {
    contract: BIOSTATISTICS_REASONING_RUNTIME_CONTRACT,
    contractVersion: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
    inputId: `biostatistics-runtime-input:${logicalDigest({ project: input.projectSnapshot.snapshotDigest, need: input.selectedNeed, upstream: upstreamOwnerResults.map((result) => result.resultId) })}`,
    projectId: input.projectSnapshot.sourceProjectRef,
    projectVersion: input.projectSnapshot.sourceProjectVersion,
    projectDigest: input.projectSnapshot.sourceProjectDigest,
    projectSnapshot: input.projectSnapshot,
    selectedNeed: structuredClone(input.selectedNeed),
    upstreamOwnerInputs: [directProjectLineage, ...upstreamOwnerResults.map(upstreamInput)],
    dataRelease: input.dataRelease ?? {
      status: "REQUIRED_UNRESOLVED",
      releaseRef: null,
      releaseVersion: null,
      releaseDigest: null,
      openFindingRefs: [],
      owner: "DATA_MANAGEMENT",
    },
    analyticalDecisions: structuredClone(input.analyticalDecisions ?? {}),
    projectWriteAuthorized: false,
  };
  const handoffId = `biostatistics-handoff:${logicalDigest({ caller: input.callerRef, input: nativeInput.inputId })}`;
  const request = createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId,
    owner: "BIOSTATISTICS",
    capabilityId: "BIOSTATISTICS_PLANNING",
    purpose: input.purpose,
    sourceProject: input.projectSnapshot,
    nativeInputType: "BiostatisticsReasoningRuntimeInput",
    nativeInputVersion: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
    nativeInput,
  });
  const invocationId = `scientific-owner-invocation:${logicalDigest({ handoffId, startedAt: input.startedAt })}`;
  try {
    const nativeOutput = (input.runtime ?? executeBiostatisticsReasoningRuntime)(request.nativeInput);
    const validation = validateBiostatisticsReasoningResult(nativeInput, nativeOutput);
    if (validation.status !== "PASS") throw new Error(validation.findings[0] ?? "BIOSTATISTICS_RESULT_INVALID");
    const result = recordSpecializedOwnerResult({
      request,
      resultId: nativeOutput.resultId,
      resultVersion: nativeOutput.resultVersion,
      completedAt: input.completedAt,
      status: nativeOutput.informationNeeds.length || nativeOutput.limitations.length ? "COMPLETED_WITH_LIMITATIONS" : "COMPLETED",
      resultKind: nativeOutput.analysisSpecifications.length ? "RECOMMENDATION_OPTION" : "GAP",
      nativePayloadType: "BiostatisticsReasoningResult",
      nativePayloadVersion: nativeOutput.resultVersion,
      nativePayload: nativeOutput,
      stableProjectRefs: input.projectSnapshot.objects.map((item) => item.stableId),
      evidenceRefs: unique(nativeOutput.sourceOwnerLineage.flatMap((item) => item.provenanceRefs)),
      unknowns: [...nativeOutput.unresolvedQuestions],
      gaps: nativeOutput.analysisSpecifications.length ? [] : nativeOutput.informationNeeds.map((item) => item.needId),
      limitations: [...nativeOutput.limitations],
      provenance: [nativeOutput.resultId, nativeOutput.resultDigest, nativeInput.inputId],
      humanDecisionRequired: true,
    });
    const observation: ScientificReasoningOwnerObservation = {
      contract: SCIENTIFIC_REASONING_OWNER_CHAIN_CONTRACT,
      contractVersion: SCIENTIFIC_REASONING_OWNER_CHAIN_VERSION,
      invocationId,
      handoffId,
      owner: "BIOSTATISTICS",
      capabilityId: "BIOSTATISTICS_PLANNING",
      ownerRuntimeVersion: BIOSTATISTICS_REASONING_RUNTIME_VERSION,
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
    const dependencies: ProductOwnerResultDependency[] = upstreamOwnerResults.map((upstream) => ({
      owner: upstream.owner as ProductOwnerResultDependency["owner"],
      resultId: upstream.resultId,
      resultVersion: upstream.resultVersion,
      nativeResultDigest: ownerResultNativeDigest(upstream) ?? (() => { throw new Error("BIOSTATISTICS_UPSTREAM_RESULT_DIGEST_MISSING"); })(),
    }));
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
      nextExpectedHandoff: nativeOutput.downstreamHandoffs[0]?.targetOwner ?? null,
    });
    return deepFreeze({
      ledger: retained.ledger,
      entry: retained.entry,
      request: retained.entry.request,
      result: retained.entry.result,
      observation: retained.entry.observation,
      upstreamOwnerResults,
      projectWrites: 0,
      humanDecisionCreated: false,
      providerCalls: 0,
    }) as ProductBiostatisticsOwnerInvocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "BIOSTATISTICS_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "BIOSTATISTICS",
      stage: code.includes("PROJECT") || code.includes("SNAPSHOT") ? "PROJECT_CONTEXT" : "BIOSTATISTICS_ENGINE",
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

export const readProductBiostatisticsOwnerResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => readProductOwnerResult({
  ledger: input.ledger,
  resultId: input.resultId,
  currentProjectSnapshot: input.currentProjectSnapshot,
  expectedOwner: "BIOSTATISTICS",
});
