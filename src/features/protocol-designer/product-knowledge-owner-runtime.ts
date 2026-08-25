import {
  canPersistKnowledgeQuestion,
  stableStringify,
  type KnowledgeRequest,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import {
  invokeKnowledgeOwnerFromSnapshot,
  type NativeOwnerInvocationObservation,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";
import {
  PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
  PRODUCT_OWNER_RESULT_LEDGER_VERSION,
  appendProductOwnerInvocation,
  createProductOwnerResultLedger,
  readProductOwnerResult,
  rehydrateProductOwnerResultLedger,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import {
  recordOwnerInvocationTrace,
  recordRejectedHandoffTrace,
  type ScientificRunTraceRecorder,
} from "./scientific-execution-trace";

/** Historical API aliases retained while the underlying W1 ledger is now owner-generic. */
export const PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT = PRODUCT_OWNER_RESULT_LEDGER_CONTRACT;
export const PRODUCT_KNOWLEDGE_OWNER_LEDGER_VERSION = PRODUCT_OWNER_RESULT_LEDGER_VERSION;
export type ProductKnowledgeOwnerLedger = ProductOwnerResultLedger;
export type ProductKnowledgeOwnerLedgerEntry = ProductOwnerResultLedgerEntry<KnowledgeRequest, KnowledgeResult>;

export type ProductKnowledgeOwnerInvocation = {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  entry: Readonly<ProductKnowledgeOwnerLedgerEntry>;
  request: Readonly<SpecializedOwnerHandoffRequest<KnowledgeRequest>>;
  result: Readonly<SpecializedOwnerResult<KnowledgeResult>> | null;
  observation: Readonly<NativeOwnerInvocationObservation>;
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

export const createProductKnowledgeOwnerLedger = createProductOwnerResultLedger;
export const rehydrateProductKnowledgeOwnerLedger = rehydrateProductOwnerResultLedger;

export const appendProductKnowledgeOwnerInvocation = (input: {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  callerRef: string;
  retainedAt: string;
  request: SpecializedOwnerHandoffRequest<KnowledgeRequest>;
  result: SpecializedOwnerResult<KnowledgeResult> | null;
  observation: NativeOwnerInvocationObservation;
}) => {
  if (!canPersistKnowledgeQuestion(input.request.nativeInput.originalQuestion)
    || input.request.nativeInput.sensitivityClassification === "RESTRICTED_PERSONAL") {
    throw new Error("SENSITIVE_KNOWLEDGE_OWNER_RESULT_NOT_PERSISTED");
  }
  if (input.request.owner !== "KNOWLEDGE"
    || input.request.capabilityId !== "KNOWLEDGE_EVIDENCE"
    || input.request.nativeInput.externalSearchPolicy !== "INTERNAL_ONLY"
    || (input.result && (
      input.result.owner !== "KNOWLEDGE"
      || input.result.projectContribution !== null
      || input.result.nativePayload?.request.requestId !== input.request.nativeInput.requestId
    ))) {
    throw new Error("PRODUCT_KNOWLEDGE_OWNER_INVOCATION_BOUNDARY_INVALID");
  }
  return appendProductOwnerInvocation({ ...input, dependencies: [] });
};

type ProductKnowledgeOwnerInvocationInput = {
  project: ResearchProjectOwnerProjection;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  knowledgeRequest: KnowledgeRequest;
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  callerRef: string;
  purpose: string;
  startedAt: string;
  completedAt: string;
  retainedAt?: string;
  runtime?: (request: KnowledgeRequest) => KnowledgeResult;
  monotonicNow?: () => number;
};

const executeKnowledgeForProject = (input: ProductKnowledgeOwnerInvocationInput): ProductKnowledgeOwnerInvocation => {
  const projectBefore = stableStringify(input.project);
  if (!canPersistKnowledgeQuestion(input.knowledgeRequest.originalQuestion)
    || input.knowledgeRequest.sensitivityClassification === "RESTRICTED_PERSONAL") {
    throw new Error("SENSITIVE_KNOWLEDGE_OWNER_RESULT_NOT_PERSISTED");
  }
  if (input.project.projectId !== input.projectSnapshot.sourceProjectRef
    || input.project.versionId !== input.projectSnapshot.sourceProjectVersion
    || input.project.projectDigest !== input.projectSnapshot.sourceProjectDigest) {
    throw new Error("KNOWLEDGE_PRODUCT_PROJECT_SNAPSHOT_MISMATCH");
  }
  const invocation = invokeKnowledgeOwnerFromSnapshot({
    projectSnapshot: input.projectSnapshot,
    knowledgeRequest: input.knowledgeRequest,
    purpose: input.purpose,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    runtime: input.runtime,
    monotonicNow: input.monotonicNow,
  });
  if (stableStringify(input.project) !== projectBefore || invocation.observation.projectWrites !== 0) {
    throw new Error("KNOWLEDGE_PRODUCT_PROJECT_WRITE_BOUNDARY_VIOLATED");
  }
  const retained = appendProductKnowledgeOwnerInvocation({
    ledger: input.ledger,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt ?? input.completedAt,
    request: invocation.request,
    result: invocation.result,
    observation: invocation.observation,
  });
  return deepFreeze({
    ledger: retained.ledger,
    entry: retained.entry,
    request: retained.entry.request,
    result: retained.entry.result,
    observation: retained.entry.observation,
    projectWrites: 0,
    humanDecisionBypassed: false,
    externalEvidenceCalls: 0,
    geminiCalls: 0,
    terraCalls: 0,
  }) as ProductKnowledgeOwnerInvocation;
};

export const invokeKnowledgeForProject = (input: ProductKnowledgeOwnerInvocationInput & {
  trace?: ScientificRunTraceRecorder;
}): ProductKnowledgeOwnerInvocation => {
  try {
    const invocation = executeKnowledgeForProject(input);
    recordOwnerInvocationTrace(input.trace, {
      entry: invocation.entry,
      ledgerContract: PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
      ledgerVersion: PRODUCT_OWNER_RESULT_LEDGER_VERSION,
      handoffStage: "OWNER_REQUEST_BUILDING",
    });
    return invocation;
  } catch (error) {
    const code = error instanceof Error ? error.message : "KNOWLEDGE_PRODUCT_UNKNOWN_FAILURE";
    recordRejectedHandoffTrace(input.trace, {
      timestamp: input.completedAt,
      owner: "KNOWLEDGE",
      stage: code.includes("PROJECT_SNAPSHOT") || code.includes("PROJECT_BINDING") ? "PROJECT_CONTEXT"
        : code.includes("LEDGER") ? "OWNER_RESULT_PERSISTENCE"
          : "OWNER_REQUEST_BUILDING",
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

export const readProductKnowledgeOwnerResult = (input: {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
  trace?: ScientificRunTraceRecorder;
  observedAt?: string;
}) => {
  try {
    const readback = readProductOwnerResult({ ...input, expectedOwner: "KNOWLEDGE" });
    if (readback.freshness.status === "STALE_OWNER_RESULT") {
      recordRejectedHandoffTrace(input.trace, {
        timestamp: input.observedAt ?? readback.entry.result?.completedAt ?? readback.entry.retainedAt,
        owner: "KNOWLEDGE",
        stage: "STALE_VALIDATION",
        code: "STALE_OWNER_RESULT",
        expectedProject: input.trace?.getRun().project ?? null,
        receivedProject: {
          projectId: input.currentProjectSnapshot.sourceProjectRef,
          projectVersion: input.currentProjectSnapshot.sourceProjectVersion,
          projectDigest: input.currentProjectSnapshot.sourceProjectDigest,
          snapshotRef: input.currentProjectSnapshot.snapshotDigest,
        },
        stale: true,
      });
    }
    return readback;
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_OWNER_RESULT_NOT_FOUND") {
      throw new Error("PRODUCT_KNOWLEDGE_OWNER_RESULT_NOT_FOUND");
    }
    throw error;
  }
};

export const requireCurrentProductKnowledgeOwnerResult = (input: Parameters<typeof readProductKnowledgeOwnerResult>[0]) => {
  const readback = readProductKnowledgeOwnerResult(input);
  if (readback.freshness.status === "STALE_OWNER_RESULT") throw new Error("STALE_OWNER_RESULT");
  return readback.entry.result as Readonly<SpecializedOwnerResult<KnowledgeResult>>;
};
