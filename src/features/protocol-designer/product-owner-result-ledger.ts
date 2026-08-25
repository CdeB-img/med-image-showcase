import { logicalDigest } from "@/features/knowledge-engine";
import {
  assessSpecializedOwnerResultFreshnessAgainstSnapshot,
  type NativeOwnerInvocationObservation,
  type ProjectContextSnapshot,
  type ScientificReasoningOwnerObservation,
  type SpecializedOwnerHandoffRequest,
  type SpecializedOwnerResult,
} from "@/features/research-project-construction";

// The stable contract identity is retained so product sessions containing the
// original Knowledge-only v0.1 ledger can be migrated without losing history.
export const PRODUCT_OWNER_RESULT_LEDGER_CONTRACT = "PROTOCOL_DESIGNER_KNOWLEDGE_OWNER_LEDGER" as const;
export const PRODUCT_OWNER_RESULT_LEDGER_VERSION = "0.2.0" as const;
const LEGACY_KNOWLEDGE_LEDGER_VERSION = "0.1.0" as const;

export type ProductOwnerResultDependency = {
  owner: "KNOWLEDGE" | "SCIENTIFIC_THINKING";
  resultId: string;
  resultVersion: string;
  nativeResultDigest: string;
};

export type ProductOwnerInvocationObservation = NativeOwnerInvocationObservation | ScientificReasoningOwnerObservation;

export type ProductOwnerResultLedgerEntry<TNativeInput = unknown, TNativePayload = unknown> = {
  entryId: string;
  sequence: number;
  callerRef: string;
  retainedAt: string;
  request: Readonly<SpecializedOwnerHandoffRequest<TNativeInput>>;
  result: Readonly<SpecializedOwnerResult<TNativePayload>> | null;
  observation: Readonly<ProductOwnerInvocationObservation>;
  dependencies: readonly Readonly<ProductOwnerResultDependency>[];
  entryDigest: string;
  appendOnly: true;
  projectWriteAuthorized: false;
};

export type ProductOwnerResultLedger = {
  contract: typeof PRODUCT_OWNER_RESULT_LEDGER_CONTRACT;
  contractVersion: typeof PRODUCT_OWNER_RESULT_LEDGER_VERSION;
  sessionId: string;
  entries: readonly Readonly<ProductOwnerResultLedgerEntry>[];
  ledgerDigest: string;
  appendOnly: true;
  projectWriteAuthorized: false;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object";

const nativeResultDigest = (result: SpecializedOwnerResult | null) => {
  if (!result?.nativePayload || !isRecord(result.nativePayload)) return null;
  const digest = result.nativePayload.resultDigest ?? result.nativePayload.outputDigest;
  return typeof digest === "string" ? digest : null;
};

const entryMaterial = (entry: Omit<ProductOwnerResultLedgerEntry, "entryDigest">) => ({
  entryId: entry.entryId,
  sequence: entry.sequence,
  callerRef: entry.callerRef,
  retainedAt: entry.retainedAt,
  request: entry.request,
  result: entry.result,
  observation: entry.observation,
  dependencies: entry.dependencies,
  appendOnly: entry.appendOnly,
  projectWriteAuthorized: entry.projectWriteAuthorized,
});

const ledgerMaterial = (ledger: Omit<ProductOwnerResultLedger, "ledgerDigest">) => ({
  contract: ledger.contract,
  contractVersion: ledger.contractVersion,
  sessionId: ledger.sessionId,
  entries: ledger.entries,
  appendOnly: ledger.appendOnly,
  projectWriteAuthorized: ledger.projectWriteAuthorized,
});

const legacyEntryMaterial = (entry: Omit<ProductOwnerResultLedgerEntry, "entryDigest" | "dependencies">) => ({
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

const legacyLedgerMaterial = (ledger: Omit<ProductOwnerResultLedger, "ledgerDigest" | "contractVersion"> & { contractVersion: typeof LEGACY_KNOWLEDGE_LEDGER_VERSION }) => ({
  contract: ledger.contract,
  contractVersion: ledger.contractVersion,
  sessionId: ledger.sessionId,
  entries: ledger.entries,
  appendOnly: ledger.appendOnly,
  projectWriteAuthorized: ledger.projectWriteAuthorized,
});

const createLedger = (input: Omit<ProductOwnerResultLedger, "ledgerDigest">): Readonly<ProductOwnerResultLedger> => {
  const material = clone(input);
  return deepFreeze({ ...material, ledgerDigest: logicalDigest(ledgerMaterial(material)) });
};

export const createProductOwnerResultLedger = (sessionId: string): Readonly<ProductOwnerResultLedger> => createLedger({
  contract: PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
  contractVersion: PRODUCT_OWNER_RESULT_LEDGER_VERSION,
  sessionId,
  entries: [],
  appendOnly: true,
  projectWriteAuthorized: false,
});

const supportedOwnerCapability = (owner: unknown, capabilityId: unknown) => (
  (owner === "KNOWLEDGE" && capabilityId === "KNOWLEDGE_EVIDENCE")
  || (owner === "SCIENTIFIC_THINKING" && capabilityId === "SCIENTIFIC_THINKING_PROPOSAL")
);

const validateKnowledgeBoundary = (entry: ProductOwnerResultLedgerEntry) => {
  if (entry.request.owner !== "KNOWLEDGE") return;
  const nativeInput = entry.request.nativeInput;
  const nativePayload = entry.result?.nativePayload;
  if (!isRecord(nativeInput)
    || nativeInput.researchProjectId !== entry.request.sourceProject.sourceProjectRef
    || nativeInput.strategyVersion !== entry.request.sourceProject.sourceProjectVersion
    || nativeInput.externalSearchPolicy !== "INTERNAL_ONLY"
    || (entry.result !== null && (
      entry.result.projectContribution !== null
      || !isRecord(nativePayload)
      || !isRecord(nativePayload.request)
      || nativePayload.request.requestId !== nativeInput.requestId
    ))) {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_KNOWLEDGE_BOUNDARY_INVALID");
  }
};

const validateScientificThinkingBoundary = (entry: ProductOwnerResultLedgerEntry) => {
  if (entry.request.owner !== "SCIENTIFIC_THINKING") return;
  const nativeInput = entry.request.nativeInput;
  const nativePayload = entry.result?.nativePayload;
  if (!isRecord(nativeInput)
    || !isRecord(nativeInput.researchContext)
    || nativeInput.researchContext.researchProjectId !== entry.request.sourceProject.sourceProjectRef
    || !isRecord(nativeInput.scientificIntent)
    || nativeInput.scientificIntent.semanticModelDigest !== entry.request.sourceProject.sourceProjectDigest
    || (entry.result !== null && (
      !isRecord(nativePayload)
      || !isRecord(nativePayload.provenance)
      || nativePayload.provenance.inputRef !== nativeInput.requestId
    ))) {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_SCIENTIFIC_THINKING_BOUNDARY_INVALID");
  }
  const knowledgeInput = isRecord(nativeInput.knowledge) ? nativeInput.knowledge : null;
  if (!knowledgeInput) throw new Error("PRODUCT_OWNER_RESULT_LEDGER_SCIENTIFIC_THINKING_KNOWLEDGE_INPUT_INVALID");
  const knowledgeDependency = entry.dependencies.find((dependency) => dependency.owner === "KNOWLEDGE") ?? null;
  if (knowledgeInput.resultId === null) {
    if (knowledgeDependency) throw new Error("PRODUCT_OWNER_RESULT_LEDGER_UNEXPECTED_KNOWLEDGE_DEPENDENCY");
    return;
  }
  if (!knowledgeDependency
    || knowledgeDependency.resultId !== knowledgeInput.resultId
    || knowledgeDependency.resultVersion !== String(knowledgeInput.resultRevision)
    || knowledgeDependency.nativeResultDigest !== knowledgeInput.resultDigest) {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_KNOWLEDGE_DEPENDENCY_MISMATCH");
  }
};

const validateEntryBoundary = (entry: ProductOwnerResultLedgerEntry, priorEntries: readonly ProductOwnerResultLedgerEntry[]) => {
  if (!supportedOwnerCapability(entry.request.owner, entry.request.capabilityId)
    || entry.observation.owner !== entry.request.owner
    || entry.observation.capabilityId !== entry.request.capabilityId
    || entry.observation.handoffId !== entry.request.handoffId
    || entry.observation.sourceProjectRef !== entry.request.sourceProject.sourceProjectRef
    || entry.observation.sourceProjectVersion !== entry.request.sourceProject.sourceProjectVersion
    || entry.observation.sourceProjectDigest !== entry.request.sourceProject.sourceProjectDigest
    || entry.observation.projectWrites !== 0
    || entry.request.projectWriteAuthorized !== false
    || (entry.result !== null && (
      entry.result.owner !== entry.request.owner
      || entry.result.capabilityId !== entry.request.capabilityId
      || entry.result.handoffId !== entry.request.handoffId
      || entry.result.sourceProjectRef !== entry.request.sourceProject.sourceProjectRef
      || entry.result.sourceProjectVersion !== entry.request.sourceProject.sourceProjectVersion
      || entry.result.sourceProjectDigest !== entry.request.sourceProject.sourceProjectDigest
      || entry.result.projectWriteAuthorized !== false
      || (entry.result.projectContribution !== null
        && entry.result.projectContribution.decisionBoundary.projectWriteAuthorized !== false)
    ))) {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_ENTRY_BOUNDARY_INVALID");
  }
  for (const dependency of entry.dependencies) {
    const retained = priorEntries.find((candidate) => candidate.result?.resultId === dependency.resultId
      && candidate.result.resultVersion === dependency.resultVersion
      && candidate.result.owner === dependency.owner);
    if (!retained?.result || nativeResultDigest(retained.result) !== dependency.nativeResultDigest) {
      throw new Error("PRODUCT_OWNER_RESULT_LEDGER_DEPENDENCY_INVALID");
    }
  }
  validateKnowledgeBoundary(entry);
  validateScientificThinkingBoundary(entry);
};

export const rehydrateProductOwnerResultLedger = (value: unknown): Readonly<ProductOwnerResultLedger> => {
  if (isRecord(value)
    && value.contract === PRODUCT_OWNER_RESULT_LEDGER_CONTRACT
    && value.contractVersion === LEGACY_KNOWLEDGE_LEDGER_VERSION
    && typeof value.sessionId === "string"
    && Array.isArray(value.entries)
    && value.appendOnly === true
    && value.projectWriteAuthorized === false
    && typeof value.ledgerDigest === "string") {
    const legacy = clone(value) as Omit<ProductOwnerResultLedger, "contractVersion"> & { contractVersion: typeof LEGACY_KNOWLEDGE_LEDGER_VERSION };
    for (const [index, entry] of legacy.entries.entries()) {
      if (!isRecord(entry)
        || entry.sequence !== index + 1
        || typeof entry.entryId !== "string"
        || typeof entry.callerRef !== "string"
        || typeof entry.retainedAt !== "string"
        || typeof entry.entryDigest !== "string"
        || entry.appendOnly !== true
        || entry.projectWriteAuthorized !== false
        || !isRecord(entry.request)
        || !isRecord(entry.request.sourceProject)
        || !isRecord(entry.observation)) {
        throw new Error("PRODUCT_OWNER_RESULT_LEDGER_LEGACY_ENTRY_INVALID");
      }
      if (entry.request.owner !== "KNOWLEDGE"
        || entry.observation.owner !== "KNOWLEDGE"
        || (entry.result && entry.result.owner !== "KNOWLEDGE")) {
        throw new Error("PRODUCT_OWNER_RESULT_LEDGER_LEGACY_OWNER_INVALID");
      }
      const { entryDigest, ...material } = entry;
      if (logicalDigest(legacyEntryMaterial(material)) !== entryDigest) {
        throw new Error("PRODUCT_OWNER_RESULT_LEDGER_LEGACY_ENTRY_DIGEST_INVALID");
      }
    }
    const { ledgerDigest, ...legacyMaterial } = legacy;
    if (logicalDigest(legacyLedgerMaterial(legacyMaterial)) !== ledgerDigest) {
      throw new Error("PRODUCT_OWNER_RESULT_LEDGER_LEGACY_DIGEST_INVALID");
    }
    let migrated = createProductOwnerResultLedger(legacy.sessionId);
    for (const entry of legacy.entries) {
      migrated = appendProductOwnerInvocation({
        ledger: migrated,
        callerRef: entry.callerRef,
        retainedAt: entry.retainedAt,
        request: entry.request,
        result: entry.result,
        observation: entry.observation,
        dependencies: [],
      }).ledger;
    }
    return migrated;
  }
  if (!isRecord(value)
    || value.contract !== PRODUCT_OWNER_RESULT_LEDGER_CONTRACT
    || value.contractVersion !== PRODUCT_OWNER_RESULT_LEDGER_VERSION
    || typeof value.sessionId !== "string"
    || !Array.isArray(value.entries)
    || value.appendOnly !== true
    || value.projectWriteAuthorized !== false
    || typeof value.ledgerDigest !== "string") {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_INVALID");
  }
  const detached = clone(value) as ProductOwnerResultLedger;
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
      || !isRecord(entry.request.sourceProject)
      || !isRecord(entry.observation)
      || !Array.isArray(entry.dependencies)) {
      throw new Error("PRODUCT_OWNER_RESULT_LEDGER_ENTRY_INVALID");
    }
    validateEntryBoundary(entry, detached.entries.slice(0, index));
    const { entryDigest, ...material } = entry;
    if (logicalDigest(entryMaterial(material)) !== entryDigest) {
      throw new Error("PRODUCT_OWNER_RESULT_LEDGER_ENTRY_DIGEST_INVALID");
    }
  }
  const { ledgerDigest, ...material } = detached;
  if (logicalDigest(ledgerMaterial(material)) !== ledgerDigest) {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_DIGEST_INVALID");
  }
  return deepFreeze(detached);
};

export const appendProductOwnerInvocation = <TNativeInput, TNativePayload>(input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  callerRef: string;
  retainedAt: string;
  request: SpecializedOwnerHandoffRequest<TNativeInput>;
  result: SpecializedOwnerResult<TNativePayload> | null;
  observation: ProductOwnerInvocationObservation;
  dependencies?: readonly ProductOwnerResultDependency[];
}): { ledger: Readonly<ProductOwnerResultLedger>; entry: Readonly<ProductOwnerResultLedgerEntry<TNativeInput, TNativePayload>> } => {
  const current = rehydrateProductOwnerResultLedger(input.ledger);
  if (current.entries.some((entry) => entry.observation.invocationId === input.observation.invocationId
    || (input.result && entry.result?.resultId === input.result.resultId && entry.result.resultVersion === input.result.resultVersion))) {
    throw new Error("PRODUCT_OWNER_RESULT_LEDGER_DUPLICATE_RESULT");
  }
  const material: Omit<ProductOwnerResultLedgerEntry<TNativeInput, TNativePayload>, "entryDigest"> = {
    entryId: `owner-result-ledger-entry:${logicalDigest({
      sequence: current.entries.length + 1,
      handoffId: input.request.handoffId,
      resultRef: input.result ? `${input.result.resultId}@${input.result.resultVersion}` : null,
      observationRef: input.observation.invocationId,
    })}`,
    sequence: current.entries.length + 1,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt,
    request: clone(input.request),
    result: input.result ? clone(input.result) : null,
    observation: clone(input.observation),
    dependencies: clone([...(input.dependencies ?? [])]),
    appendOnly: true,
    projectWriteAuthorized: false,
  };
  validateEntryBoundary(material as ProductOwnerResultLedgerEntry<TNativeInput, TNativePayload>, current.entries);
  const entry = deepFreeze({ ...material, entryDigest: logicalDigest(entryMaterial(material)) });
  return {
    entry,
    ledger: createLedger({
      contract: PRODUCT_OWNER_RESULT_LEDGER_CONTRACT,
      contractVersion: PRODUCT_OWNER_RESULT_LEDGER_VERSION,
      sessionId: current.sessionId,
      entries: [...current.entries, entry],
      appendOnly: true,
      projectWriteAuthorized: false,
    }),
  };
};

export const readProductOwnerResult = (input: {
  ledger: Readonly<ProductOwnerResultLedger>;
  resultId: string;
  currentProjectSnapshot: Readonly<ProjectContextSnapshot>;
  expectedOwner?: "KNOWLEDGE" | "SCIENTIFIC_THINKING";
}) => {
  const ledger = rehydrateProductOwnerResultLedger(input.ledger);
  const entry = ledger.entries.find((candidate) => candidate.result?.resultId === input.resultId
    && (!input.expectedOwner || candidate.result.owner === input.expectedOwner));
  if (!entry?.result) throw new Error("PRODUCT_OWNER_RESULT_NOT_FOUND");
  const projectFreshness = assessSpecializedOwnerResultFreshnessAgainstSnapshot(entry.result, input.currentProjectSnapshot);
  const dependencyReasons = entry.dependencies.flatMap((dependency) => {
    const retained = ledger.entries.find((candidate) => candidate.result?.resultId === dependency.resultId
      && candidate.result.resultVersion === dependency.resultVersion
      && candidate.result.owner === dependency.owner);
    return !retained?.result || nativeResultDigest(retained.result) !== dependency.nativeResultDigest
      ? [`OWNER_DEPENDENCY_CHANGED:${dependency.owner}:${dependency.resultId}`]
      : [];
  });
  const staleReasons = [...projectFreshness.staleReasons, ...dependencyReasons];
  return deepFreeze({
    entry,
    freshness: { status: staleReasons.length ? "STALE_OWNER_RESULT" as const : "CURRENT" as const, staleReasons },
  });
};

export const ownerResultNativeDigest = nativeResultDigest;
