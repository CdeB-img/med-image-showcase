import { stableStringify, type KnowledgeResult } from "@/features/knowledge-engine";
import type { ScientificThinkingInput, ScientificThinkingOutput } from "@/features/scientific-thinking";
import {
  invokeScientificThinkingOwnerFromSnapshot,
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
  appendProductOwnerInvocation,
  ownerResultNativeDigest,
  readProductOwnerResult,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";

export type ProductScientificThinkingOwnerInvocation = {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  entry: Readonly<ProductOwnerResultLedgerEntry<ScientificThinkingInput, ScientificThinkingOutput>>;
  request: Readonly<SpecializedOwnerHandoffRequest<ScientificThinkingInput>>;
  result: Readonly<SpecializedOwnerResult<ScientificThinkingOutput>> | null;
  observation: Readonly<ScientificReasoningOwnerObservation>;
  knowledgeOwnerResult: Readonly<SpecializedOwnerResult<KnowledgeResult>> | null;
  projectWrites: 0;
  humanDecisionBypassed: false;
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

export const invokeScientificThinkingForProject = (input: {
  project: ResearchProjectOwnerProjection;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  knowledgeResultId?: string | null;
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  callerRef: string;
  purpose: string;
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  runtime?: (request: ScientificThinkingInput) => ScientificThinkingOutput;
  monotonicNow?: () => number;
}): ProductScientificThinkingOwnerInvocation => {
  const projectBefore = stableStringify(input.project);
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("SCIENTIFIC_THINKING_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  }
  let knowledgeOwnerResult: Readonly<SpecializedOwnerResult<KnowledgeResult>> | null = null;
  if (input.knowledgeResultId) {
    try {
      knowledgeOwnerResult = requireCurrentProductKnowledgeOwnerResult({
        ledger: input.ledger,
        resultId: input.knowledgeResultId,
        currentProjectSnapshot: input.projectSnapshot,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "STALE_OWNER_RESULT") throw new Error("STALE_KNOWLEDGE_RESULT");
      throw error;
    }
  }
  const invocation = invokeScientificThinkingOwnerFromSnapshot({
    projectSnapshot: input.projectSnapshot,
    projectRevision: input.project.revision,
    knowledgeOwnerResult,
    purpose: input.purpose,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    runtime: input.runtime,
    monotonicNow: input.monotonicNow,
  });
  if (stableStringify(input.project) !== projectBefore || invocation.observation.projectWrites !== 0) {
    throw new Error("SCIENTIFIC_THINKING_PRODUCT_PROJECT_WRITE_BOUNDARY_VIOLATED");
  }
  const dependencies = knowledgeOwnerResult ? [{
    owner: "KNOWLEDGE" as const,
    resultId: knowledgeOwnerResult.resultId,
    resultVersion: knowledgeOwnerResult.resultVersion,
    nativeResultDigest: ownerResultNativeDigest(knowledgeOwnerResult)!,
  }] : [];
  const retained = appendProductOwnerInvocation({
    ledger: input.ledger,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt ?? input.completedAt,
    request: invocation.request,
    result: invocation.result,
    observation: invocation.observation,
    dependencies,
  });
  return deepFreeze({
    ledger: retained.ledger,
    entry: retained.entry,
    request: retained.entry.request,
    result: retained.entry.result,
    observation: retained.entry.observation,
    knowledgeOwnerResult,
    projectWrites: 0,
    humanDecisionBypassed: false,
    externalEvidenceCalls: 0,
    geminiCalls: 0,
    terraCalls: 0,
  }) as ProductScientificThinkingOwnerInvocation;
};

export const readProductScientificThinkingOwnerResult = (input: {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
  currentKnowledgeResultId?: string | null;
  currentKnowledgeResult?: {
    resultId: string;
    resultVersion: string;
    nativeResultDigest: string;
  } | null;
}) => {
  try {
    const readback = readProductOwnerResult({
      ledger: input.ledger,
      resultId: input.resultId,
      currentProjectSnapshot: input.currentProjectSnapshot,
      expectedOwner: "SCIENTIFIC_THINKING",
    });
    const dependencyReasons = input.currentKnowledgeResult === undefined && input.currentKnowledgeResultId === undefined
      ? []
      : readback.entry.dependencies.some((dependency) => dependency.owner === "KNOWLEDGE"
        && (input.currentKnowledgeResult
          ? dependency.resultId === input.currentKnowledgeResult.resultId
            && dependency.resultVersion === input.currentKnowledgeResult.resultVersion
            && dependency.nativeResultDigest === input.currentKnowledgeResult.nativeResultDigest
          : dependency.resultId === input.currentKnowledgeResultId))
        ? []
        : ["KNOWLEDGE_RESULT_DEPENDENCY_CHANGED"];
    const staleReasons = [...readback.freshness.staleReasons, ...dependencyReasons];
    return deepFreeze({
      entry: readback.entry,
      freshness: { status: staleReasons.length ? "STALE_OWNER_RESULT" as const : "CURRENT" as const, staleReasons },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_OWNER_RESULT_NOT_FOUND") {
      throw new Error("PRODUCT_SCIENTIFIC_THINKING_OWNER_RESULT_NOT_FOUND");
    }
    throw error;
  }
};

export const requireCurrentProductScientificThinkingOwnerResult = (input: Parameters<typeof readProductScientificThinkingOwnerResult>[0]) => {
  const readback = readProductScientificThinkingOwnerResult(input);
  if (readback.freshness.status === "STALE_OWNER_RESULT") throw new Error("STALE_SCIENTIFIC_THINKING_RESULT");
  return readback.entry.result as Readonly<SpecializedOwnerResult<ScientificThinkingOutput>>;
};
