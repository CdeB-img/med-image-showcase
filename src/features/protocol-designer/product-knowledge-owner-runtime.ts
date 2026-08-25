import {
  canPersistKnowledgeQuestion,
  logicalDigest,
  stableStringify,
  type KnowledgeRequest,
  type KnowledgeResult,
} from "@/features/knowledge-engine";
import {
  assessSpecializedOwnerResultFreshnessAgainstSnapshot,
  invokeKnowledgeOwnerFromSnapshot,
  type NativeOwnerInvocationObservation,
  type ProjectContextSnapshot,
  type ResearchProjectOwnerProjection,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";

export const PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT = "PROTOCOL_DESIGNER_KNOWLEDGE_OWNER_LEDGER" as const;
export const PRODUCT_KNOWLEDGE_OWNER_LEDGER_VERSION = "0.1.0" as const;

export type ProductKnowledgeOwnerLedgerEntry = {
  entryId: string;
  sequence: number;
  callerRef: string;
  retainedAt: string;
  request: Readonly<SpecializedOwnerHandoffRequest<KnowledgeRequest>>;
  result: Readonly<SpecializedOwnerResult<KnowledgeResult>> | null;
  observation: Readonly<NativeOwnerInvocationObservation>;
  entryDigest: string;
  appendOnly: true;
  projectWriteAuthorized: false;
};

export type ProductKnowledgeOwnerLedger = {
  contract: typeof PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT;
  contractVersion: typeof PRODUCT_KNOWLEDGE_OWNER_LEDGER_VERSION;
  sessionId: string;
  entries: readonly Readonly<ProductKnowledgeOwnerLedgerEntry>[];
  ledgerDigest: string;
  appendOnly: true;
  projectWriteAuthorized: false;
};

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

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const entryMaterial = (entry: Omit<ProductKnowledgeOwnerLedgerEntry, "entryDigest">) => ({
  entryId: entry.entryId,
  sequence: entry.sequence,
  callerRef: entry.callerRef,
  retainedAt: entry.retainedAt,
  request: entry.request,
  result: entry.result,
  observation: entry.observation,
  appendOnly: entry.appendOnly,
  projectWriteAuthorized: entry.projectWriteAuthorized,
});

const ledgerMaterial = (ledger: Omit<ProductKnowledgeOwnerLedger, "ledgerDigest">) => ({
  contract: ledger.contract,
  contractVersion: ledger.contractVersion,
  sessionId: ledger.sessionId,
  entries: ledger.entries,
  appendOnly: ledger.appendOnly,
  projectWriteAuthorized: ledger.projectWriteAuthorized,
});

const createEntry = (input: {
  sequence: number;
  callerRef: string;
  retainedAt: string;
  request: SpecializedOwnerHandoffRequest<KnowledgeRequest>;
  result: SpecializedOwnerResult<KnowledgeResult> | null;
  observation: NativeOwnerInvocationObservation;
}): Readonly<ProductKnowledgeOwnerLedgerEntry> => {
  const material: Omit<ProductKnowledgeOwnerLedgerEntry, "entryDigest"> = {
    entryId: `knowledge-owner-ledger-entry:${logicalDigest({
      sequence: input.sequence,
      handoffId: input.request.handoffId,
      resultRef: input.result ? `${input.result.resultId}@${input.result.resultVersion}` : null,
      observationRef: input.observation.invocationId,
    })}`,
    sequence: input.sequence,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt,
    request: clone(input.request),
    result: input.result ? clone(input.result) : null,
    observation: clone(input.observation),
    appendOnly: true,
    projectWriteAuthorized: false,
  };
  return deepFreeze({ ...material, entryDigest: logicalDigest(entryMaterial(material)) });
};

const createLedger = (input: Omit<ProductKnowledgeOwnerLedger, "ledgerDigest">): Readonly<ProductKnowledgeOwnerLedger> => {
  const material = clone(input);
  return deepFreeze({ ...material, ledgerDigest: logicalDigest(ledgerMaterial(material)) });
};

export const createProductKnowledgeOwnerLedger = (sessionId: string): Readonly<ProductKnowledgeOwnerLedger> => createLedger({
  contract: PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT,
  contractVersion: PRODUCT_KNOWLEDGE_OWNER_LEDGER_VERSION,
  sessionId,
  entries: [],
  appendOnly: true,
  projectWriteAuthorized: false,
});

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object";

export const rehydrateProductKnowledgeOwnerLedger = (value: unknown): Readonly<ProductKnowledgeOwnerLedger> => {
  if (!isRecord(value)
    || value.contract !== PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT
    || value.contractVersion !== PRODUCT_KNOWLEDGE_OWNER_LEDGER_VERSION
    || typeof value.sessionId !== "string"
    || !Array.isArray(value.entries)
    || value.appendOnly !== true
    || value.projectWriteAuthorized !== false
    || typeof value.ledgerDigest !== "string") {
    throw new Error("PRODUCT_KNOWLEDGE_OWNER_LEDGER_INVALID");
  }
  const detached = clone(value) as ProductKnowledgeOwnerLedger;
  for (const [index, entry] of detached.entries.entries()) {
    if (!isRecord(entry)
      || entry.sequence !== index + 1
      || typeof entry.entryId !== "string"
      || typeof entry.callerRef !== "string"
      || typeof entry.retainedAt !== "string"
      || typeof entry.entryDigest !== "string"
      || entry.appendOnly !== true
      || entry.projectWriteAuthorized !== false
      || !isRecord(entry.request)
      || entry.request.owner !== "KNOWLEDGE"
      || entry.request.capabilityId !== "KNOWLEDGE_EVIDENCE"
      || entry.request.projectWriteAuthorized !== false
      || !isRecord(entry.request.sourceProject)
      || !isRecord(entry.request.nativeInput)
      || entry.request.nativeInput.researchProjectId !== entry.request.sourceProject.sourceProjectRef
      || entry.request.nativeInput.strategyVersion !== entry.request.sourceProject.sourceProjectVersion
      || entry.request.nativeInput.externalSearchPolicy !== "INTERNAL_ONLY"
      || !isRecord(entry.observation)
      || entry.observation.owner !== "KNOWLEDGE"
      || entry.observation.capabilityId !== "KNOWLEDGE_EVIDENCE"
      || entry.observation.handoffId !== entry.request.handoffId
      || entry.observation.sourceProjectRef !== entry.request.sourceProject.sourceProjectRef
      || entry.observation.sourceProjectVersion !== entry.request.sourceProject.sourceProjectVersion
      || entry.observation.sourceProjectDigest !== entry.request.sourceProject.sourceProjectDigest
      || entry.observation.projectWrites !== 0
      || (entry.result !== null && (!isRecord(entry.result)
        || entry.result.owner !== "KNOWLEDGE"
        || entry.result.capabilityId !== "KNOWLEDGE_EVIDENCE"
        || entry.result.projectWriteAuthorized !== false
        || entry.result.projectContribution !== null
        || entry.result.handoffId !== entry.request.handoffId
        || entry.result.sourceProjectRef !== entry.request.sourceProject.sourceProjectRef
        || entry.result.sourceProjectVersion !== entry.request.sourceProject.sourceProjectVersion
        || entry.result.sourceProjectDigest !== entry.request.sourceProject.sourceProjectDigest
        || !isRecord(entry.result.nativePayload)
        || !isRecord(entry.result.nativePayload.request)
        || entry.result.nativePayload.request.requestId !== entry.request.nativeInput.requestId))) {
      throw new Error("PRODUCT_KNOWLEDGE_OWNER_LEDGER_ENTRY_INVALID");
    }
    const { entryDigest, ...material } = entry;
    if (logicalDigest(entryMaterial(material as Omit<ProductKnowledgeOwnerLedgerEntry, "entryDigest">)) !== entryDigest) {
      throw new Error("PRODUCT_KNOWLEDGE_OWNER_LEDGER_ENTRY_DIGEST_INVALID");
    }
  }
  const { ledgerDigest, ...material } = detached;
  if (logicalDigest(ledgerMaterial(material)) !== ledgerDigest) {
    throw new Error("PRODUCT_KNOWLEDGE_OWNER_LEDGER_DIGEST_INVALID");
  }
  return deepFreeze(detached);
};

export const appendProductKnowledgeOwnerInvocation = (input: {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  callerRef: string;
  retainedAt: string;
  request: SpecializedOwnerHandoffRequest<KnowledgeRequest>;
  result: SpecializedOwnerResult<KnowledgeResult> | null;
  observation: NativeOwnerInvocationObservation;
}): { ledger: Readonly<ProductKnowledgeOwnerLedger>; entry: Readonly<ProductKnowledgeOwnerLedgerEntry> } => {
  const current = rehydrateProductKnowledgeOwnerLedger(input.ledger);
  if (!canPersistKnowledgeQuestion(input.request.nativeInput.originalQuestion)
    || input.request.nativeInput.sensitivityClassification === "RESTRICTED_PERSONAL") {
    throw new Error("SENSITIVE_KNOWLEDGE_OWNER_RESULT_NOT_PERSISTED");
  }
  if (current.entries.some((entry) => entry.observation.invocationId === input.observation.invocationId
    || (input.result && entry.result?.resultId === input.result.resultId && entry.result.resultVersion === input.result.resultVersion))) {
    throw new Error("PRODUCT_KNOWLEDGE_OWNER_LEDGER_DUPLICATE_RESULT");
  }
  if (input.request.owner !== "KNOWLEDGE"
    || input.request.capabilityId !== "KNOWLEDGE_EVIDENCE"
    || input.observation.owner !== "KNOWLEDGE"
    || input.observation.capabilityId !== "KNOWLEDGE_EVIDENCE"
    || input.observation.handoffId !== input.request.handoffId
    || input.observation.sourceProjectRef !== input.request.sourceProject.sourceProjectRef
    || input.observation.sourceProjectVersion !== input.request.sourceProject.sourceProjectVersion
    || input.observation.sourceProjectDigest !== input.request.sourceProject.sourceProjectDigest
    || input.observation.projectWrites !== 0
    || (input.result && (input.result.handoffId !== input.request.handoffId
      || input.result.sourceProjectRef !== input.request.sourceProject.sourceProjectRef
      || input.result.sourceProjectVersion !== input.request.sourceProject.sourceProjectVersion
      || input.result.sourceProjectDigest !== input.request.sourceProject.sourceProjectDigest
      || input.result.projectWriteAuthorized !== false
      || input.result.projectContribution !== null
      || input.result.nativePayload?.request.requestId !== input.request.nativeInput.requestId))) {
    throw new Error("PRODUCT_KNOWLEDGE_OWNER_INVOCATION_BOUNDARY_INVALID");
  }
  const entry = createEntry({
    sequence: current.entries.length + 1,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt,
    request: input.request,
    result: input.result,
    observation: input.observation,
  });
  return {
    entry,
    ledger: createLedger({
      contract: PRODUCT_KNOWLEDGE_OWNER_LEDGER_CONTRACT,
      contractVersion: PRODUCT_KNOWLEDGE_OWNER_LEDGER_VERSION,
      sessionId: current.sessionId,
      entries: [...current.entries, entry],
      appendOnly: true,
      projectWriteAuthorized: false,
    }),
  };
};

export const invokeKnowledgeForProject = (input: {
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
}): ProductKnowledgeOwnerInvocation => {
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
  });
};

export const readProductKnowledgeOwnerResult = (input: {
  ledger: Readonly<ProductKnowledgeOwnerLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
}) => {
  const ledger = rehydrateProductKnowledgeOwnerLedger(input.ledger);
  const entry = ledger.entries.find((candidate) => candidate.result?.resultId === input.resultId);
  if (!entry?.result) throw new Error("PRODUCT_KNOWLEDGE_OWNER_RESULT_NOT_FOUND");
  return deepFreeze({
    entry,
    freshness: assessSpecializedOwnerResultFreshnessAgainstSnapshot(entry.result, input.currentProjectSnapshot),
  });
};

export const requireCurrentProductKnowledgeOwnerResult = (input: Parameters<typeof readProductKnowledgeOwnerResult>[0]) => {
  const readback = readProductKnowledgeOwnerResult(input);
  if (readback.freshness.status === "STALE_OWNER_RESULT") throw new Error("STALE_OWNER_RESULT");
  return readback.entry.result as Readonly<SpecializedOwnerResult<KnowledgeResult>>;
};
