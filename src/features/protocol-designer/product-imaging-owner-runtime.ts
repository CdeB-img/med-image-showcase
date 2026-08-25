import { stableStringify, type KnowledgeResult } from "@/features/knowledge-engine";
import type { ImagingDesignInput, ImagingDesignResult } from "@/features/imaging-study-designer";
import type { ScientificThinkingOutput } from "@/features/scientific-thinking";
import {
  invokeImagingOwnerFromScientificThinking,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
  type ScientificReasoningOwnerObservation,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";
import {
  requireCurrentProductKnowledgeOwnerResult,
  type ProductKnowledgeOwnerLedger,
} from "./product-knowledge-owner-runtime";
import {
  requireCurrentProductScientificThinkingOwnerResult,
} from "./product-scientific-thinking-owner-runtime";
import {
  appendProductOwnerInvocation,
  ownerResultNativeDigest,
  readProductOwnerResult,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";

export type ProductImagingOwnerInvocation = {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<ImagingDesignInput, ImagingDesignResult>>;
  request: Readonly<SpecializedOwnerHandoffRequest<ImagingDesignInput>>;
  result: Readonly<SpecializedOwnerResult<ImagingDesignResult>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  knowledgeOwnerResult: Readonly<SpecializedOwnerResult<KnowledgeResult>>;
  scientificThinkingOwnerResult: Readonly<SpecializedOwnerResult<ScientificThinkingOutput>>;
  projectWrites: 0;
  humanDecisionBypassed: false;
  obsRuntimeCalls: 0;
  externalEvidenceCalls: 0;
  geminiCalls: 0;
  terraCalls: 0;
};

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const exactDependency = (result: SpecializedOwnerResult) => ({
  owner: result.owner as "KNOWLEDGE" | "SCIENTIFIC_THINKING",
  resultId: result.resultId,
  resultVersion: result.resultVersion,
  nativeResultDigest: ownerResultNativeDigest(result)!,
});

export const invokeImagingForProject = (input: {
  project: ResearchProjectOwnerProjection;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  knowledgeResultId: string;
  scientificThinkingResultId: string;
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  callerRef: string;
  purpose: string;
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  runtime?: (request: ImagingDesignInput) => ImagingDesignResult;
  monotonicNow?: () => number;
}): ProductImagingOwnerInvocation => {
  const projectBefore = stableStringify(input.project);
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("IMAGING_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  }
  const knowledgeOwnerResult = requireCurrentProductKnowledgeOwnerResult({
    ledger: input.ledger,
    resultId: input.knowledgeResultId,
    currentProjectSnapshot: input.projectSnapshot,
  });
  const scientificThinkingOwnerResult = requireCurrentProductScientificThinkingOwnerResult({
    ledger: input.ledger,
    resultId: input.scientificThinkingResultId,
    currentProjectSnapshot: input.projectSnapshot,
    currentKnowledgeResult: {
      resultId: knowledgeOwnerResult.resultId,
      resultVersion: knowledgeOwnerResult.resultVersion,
      nativeResultDigest: ownerResultNativeDigest(knowledgeOwnerResult)!,
    },
  });
  const invocation = invokeImagingOwnerFromScientificThinking({
    project: input.project,
    scientificThinkingResult: scientificThinkingOwnerResult,
    knowledgeOwnerResult,
    purpose: input.purpose,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    runtime: input.runtime,
    monotonicNow: input.monotonicNow,
  });
  if (!invocation.request) throw new Error("IMAGING_PRODUCT_HANDOFF_REQUEST_NOT_CREATED");
  if (stableStringify(input.project) !== projectBefore || invocation.observation.projectWrites !== 0) {
    throw new Error("IMAGING_PRODUCT_PROJECT_WRITE_BOUNDARY_VIOLATED");
  }
  const retained = appendProductOwnerInvocation({
    ledger: input.ledger,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt ?? input.completedAt,
    request: invocation.request,
    result: invocation.result,
    observation: invocation.observation,
    dependencies: [exactDependency(knowledgeOwnerResult), exactDependency(scientificThinkingOwnerResult)],
  });
  return deepFreeze({
    ledger: retained.ledger,
    entry: retained.entry,
    request: retained.entry.request,
    result: retained.entry.result,
    observation: retained.entry.observation,
    knowledgeOwnerResult,
    scientificThinkingOwnerResult,
    projectWrites: 0,
    humanDecisionBypassed: false,
    obsRuntimeCalls: 0,
    externalEvidenceCalls: 0,
    geminiCalls: 0,
    terraCalls: 0,
  }) as ProductImagingOwnerInvocation;
};

export const readProductImagingOwnerResult = (input: {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
  currentKnowledgeResult: { resultId: string; resultVersion: string; nativeResultDigest: string };
  currentScientificThinkingResult: { resultId: string; resultVersion: string; nativeResultDigest: string };
}) => {
  try {
    const readback = readProductOwnerResult({
      ledger: input.ledger,
      resultId: input.resultId,
      currentProjectSnapshot: input.currentProjectSnapshot,
      expectedOwner: "IMAGING",
    });
    const currentDependencies = [
      { owner: "KNOWLEDGE", ...input.currentKnowledgeResult },
      { owner: "SCIENTIFIC_THINKING", ...input.currentScientificThinkingResult },
    ];
    const dependencyReasons = currentDependencies.flatMap((current) => readback.entry.dependencies.some((dependency) => (
      dependency.owner === current.owner
      && dependency.resultId === current.resultId
      && dependency.resultVersion === current.resultVersion
      && dependency.nativeResultDigest === current.nativeResultDigest
    )) ? [] : [`${current.owner}_RESULT_DEPENDENCY_CHANGED`]);
    const staleReasons = [...readback.freshness.staleReasons, ...dependencyReasons];
    return deepFreeze({
      entry: readback.entry,
      freshness: { status: staleReasons.length ? "STALE_OWNER_RESULT" as const : "CURRENT" as const, staleReasons },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_OWNER_RESULT_NOT_FOUND") {
      throw new Error("PRODUCT_IMAGING_OWNER_RESULT_NOT_FOUND");
    }
    throw error;
  }
};

export const requireCurrentProductImagingOwnerResult = (input: Parameters<typeof readProductImagingOwnerResult>[0]) => {
  const readback = readProductImagingOwnerResult(input);
  if (readback.freshness.status === "STALE_OWNER_RESULT") throw new Error("STALE_IMAGING_RESULT");
  return readback.entry.result as Readonly<SpecializedOwnerResult<ImagingDesignResult>>;
};
