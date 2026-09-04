import type {
  BiomarkerRoleDeclaration,
  MeasurementDefinitionDeclaration,
  ObservablePropertyDeclaration,
  MeasurementQualificationDeclaration,
  ObservabilityMeasurementResult,
  ObservabilityMeasurementRuntimeInput,
} from "@/features/observability-measurement";
import type { KnowledgeOwnerHandoff } from "@/features/knowledge-engine";
import {
  invokeObservabilityMeasurementOwnerFromSnapshot,
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

export type ProductObservabilityOwnerInvocation = {
  ledger: Readonly<ProductOwnerResultLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<ObservabilityMeasurementRuntimeInput, ObservabilityMeasurementResult>>;
  request: Readonly<SpecializedOwnerHandoffRequest<ObservabilityMeasurementRuntimeInput>>;
  result: Readonly<SpecializedOwnerResult<ObservabilityMeasurementResult>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  upstreamOwnerResults: readonly Readonly<SpecializedOwnerResult>[];
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

const hasObservabilityHandoff = (result: Readonly<SpecializedOwnerResult>) => {
  const payload = result.nativePayload as { downstreamHandoffs?: readonly { targetOwner?: string }[] } | null;
  return payload?.downstreamHandoffs?.some((handoff) => handoff.targetOwner === "OBSERVABILITY_MEASUREMENT") ?? false;
};

const currentUpstreamResults = (
  ledger: Readonly<ProductOwnerResultLedger>,
  snapshot: Readonly<ProjectContextSnapshot>,
) => {
  const seen = new Set<string>();
  return [...ledger.entries].reverse().flatMap((entry): Readonly<SpecializedOwnerResult>[] => {
    const result = entry.result;
    if (!result
      || !["SCIENTIFIC_THINKING", "STUDY_DESIGN"].includes(result.owner)
      || result.sourceProjectRef !== snapshot.sourceProjectRef
      || result.sourceProjectVersion !== snapshot.sourceProjectVersion
      || result.sourceProjectDigest !== snapshot.sourceProjectDigest
      || result.sourceSnapshotDigest !== snapshot.snapshotDigest
      || !hasObservabilityHandoff(result)
      || seen.has(result.owner)) return [];
    seen.add(result.owner);
    return [result];
  });
};

export const invokeObservabilityForProjectSnapshot = (input: {
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  purpose: string;
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  observablePropertyDeclarations?: readonly ObservablePropertyDeclaration[];
  measurementDefinitionDeclarations?: readonly MeasurementDefinitionDeclaration[];
  biomarkerRoleDeclarations?: readonly BiomarkerRoleDeclaration[];
  measurementQualificationDeclarations?: readonly MeasurementQualificationDeclaration[];
  knowledgeHandoff?: Readonly<KnowledgeOwnerHandoff> | null;
  runtime?: (nativeInput: Readonly<ObservabilityMeasurementRuntimeInput>) => Readonly<ObservabilityMeasurementResult>;
  monotonicNow?: () => number;
  trace?: ScientificRunTraceRecorder;
}): ProductObservabilityOwnerInvocation => {
  const upstreamOwnerResults = currentUpstreamResults(input.ledger, input.projectSnapshot);
  try {
    const invocation = invokeObservabilityMeasurementOwnerFromSnapshot({
      projectSnapshot: input.projectSnapshot,
      upstreamOwnerResults,
      observablePropertyDeclarations: input.observablePropertyDeclarations,
      measurementDefinitionDeclarations: input.measurementDefinitionDeclarations,
      biomarkerRoleDeclarations: input.biomarkerRoleDeclarations,
      measurementQualificationDeclarations: input.measurementQualificationDeclarations,
      knowledgeHandoff: input.knowledgeHandoff,
      purpose: input.purpose,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      runtime: input.runtime,
      monotonicNow: input.monotonicNow,
    });
    const dependencies: ProductOwnerResultDependency[] = upstreamOwnerResults.map((result) => ({
      owner: result.owner as ProductOwnerResultDependency["owner"],
      resultId: result.resultId,
      resultVersion: result.resultVersion,
      nativeResultDigest: ownerResultNativeDigest(result) ?? (() => { throw new Error("OBS_UPSTREAM_RESULT_DIGEST_MISSING"); })(),
    }));
    if (input.knowledgeHandoff) {
      const knowledgeEntry = [...input.ledger.entries].reverse().find((entry) => entry.result?.resultId === input.knowledgeHandoff!.knowledgeResultRef
        && entry.result.owner === "KNOWLEDGE");
      if (!knowledgeEntry?.result) throw new Error("OBS_KNOWLEDGE_RESULT_LEDGER_ENTRY_MISSING");
      const digest = ownerResultNativeDigest(knowledgeEntry.result);
      if (!digest || digest !== input.knowledgeHandoff.knowledgeResultDigest) throw new Error("OBS_KNOWLEDGE_RESULT_DIGEST_MISMATCH");
      dependencies.push({ owner: "KNOWLEDGE", resultId: knowledgeEntry.result.resultId, resultVersion: knowledgeEntry.result.resultVersion, nativeResultDigest: digest });
    }
    const retained = appendProductOwnerInvocation({
      ledger: input.ledger,
      callerRef: input.callerRef,
      retainedAt: input.retainedAt ?? input.completedAt,
      request: invocation.request,
      result: invocation.result,
      observation: invocation.observation,
      dependencies,
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
      upstreamOwnerResults,
      projectWrites: 0,
      humanDecisionCreated: false,
      providerCalls: 0,
    }) as ProductObservabilityOwnerInvocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "OBS_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "OBSERVABILITY_MEASUREMENT",
      stage: code.includes("PROJECT") || code.includes("SNAPSHOT") ? "PROJECT_CONTEXT" : "OBSERVABILITY_MEASUREMENT_ENGINE",
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

export const readProductObservabilityOwnerResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => readProductOwnerResult({
  ledger: input.ledger,
  resultId: input.resultId,
  currentProjectSnapshot: input.currentProjectSnapshot,
  expectedOwner: "OBSERVABILITY_MEASUREMENT",
});
