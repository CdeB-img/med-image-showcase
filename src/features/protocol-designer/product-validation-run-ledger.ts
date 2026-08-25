import { logicalDigest } from "@/features/knowledge-engine";
import { verifyValidationRunDigest, type ValidationRun } from "@/features/validation-architecture";

export const PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT = "PROTOCOL_DESIGNER_VALIDATION_RUN_LEDGER" as const;
export const PRODUCT_VALIDATION_RUN_LEDGER_VERSION = "0.1.0" as const;

export type ProductScientificOwnerResultReference = {
  owner: "KNOWLEDGE" | "SCIENTIFIC_THINKING" | "IMAGING";
  resultId: string;
  resultVersion: string;
  nativeResultDigest: string;
};

export type ProductValidationProfileReference = {
  profileId: "SCIENTIFIC_OWNER_CHAIN_FIDELITY";
  profileVersion: string;
  validationEngineId: "VAL-001-DETERMINISTIC-ENGINE";
  validationEngineVersion: string;
  scientificQualificationClaimed: false;
};

export type ProductValidationRunLedgerEntry = {
  entryId: string;
  sequence: number;
  callerRef: string;
  retainedAt: string;
  validationInvocationId: string;
  profile: Readonly<ProductValidationProfileReference>;
  projectSnapshotRef: {
    projectId: string;
    projectVersion: string;
    projectDigest: string;
    snapshotDigest: string;
  };
  ownerResultRefs: readonly Readonly<ProductScientificOwnerResultReference>[];
  ownerResultLedgerDigest: string;
  run: Readonly<ValidationRun>;
  boundedStatus: "STRUCTURAL_FIDELITY_PASS" | "STRUCTURAL_FIDELITY_FINDINGS" | "NOT_EVALUABLE";
  entryDigest: string;
  appendOnly: true;
  projectWriteAuthorized: false;
  repairAuthorized: false;
  humanDecisionBypassed: false;
  pd011QualificationClaimed: false;
};

export type ProductValidationRunLedger = {
  contract: typeof PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT;
  contractVersion: typeof PRODUCT_VALIDATION_RUN_LEDGER_VERSION;
  sessionId: string;
  entries: readonly Readonly<ProductValidationRunLedgerEntry>[];
  ledgerDigest: string;
  appendOnly: true;
  projectWriteAuthorized: false;
  repairAuthorized: false;
  pd011QualificationClaimed: false;
};

const clone = <T>(value: T): T => structuredClone(value);

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const entryMaterial = (entry: Omit<ProductValidationRunLedgerEntry, "entryDigest">) => ({
  ...entry,
  ownerResultRefs: [...entry.ownerResultRefs],
});

const ledgerMaterial = (ledger: Omit<ProductValidationRunLedger, "ledgerDigest">) => ({
  ...ledger,
  entries: [...ledger.entries],
});

const createLedger = (input: Omit<ProductValidationRunLedger, "ledgerDigest">): Readonly<ProductValidationRunLedger> => {
  const detached = clone(input);
  return deepFreeze({ ...detached, ledgerDigest: logicalDigest(ledgerMaterial(detached)) });
};

export const createProductValidationRunLedger = (sessionId: string): Readonly<ProductValidationRunLedger> => createLedger({
  contract: PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT,
  contractVersion: PRODUCT_VALIDATION_RUN_LEDGER_VERSION,
  sessionId,
  entries: [],
  appendOnly: true,
  projectWriteAuthorized: false,
  repairAuthorized: false,
  pd011QualificationClaimed: false,
});

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const rehydrateProductValidationRunLedger = (value: unknown): Readonly<ProductValidationRunLedger> => {
  if (!isRecord(value)
    || value.contract !== PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT
    || value.contractVersion !== PRODUCT_VALIDATION_RUN_LEDGER_VERSION
    || typeof value.sessionId !== "string"
    || !Array.isArray(value.entries)
    || typeof value.ledgerDigest !== "string"
    || value.appendOnly !== true
    || value.projectWriteAuthorized !== false
    || value.repairAuthorized !== false
    || value.pd011QualificationClaimed !== false) {
    throw new Error("PRODUCT_VALIDATION_RUN_LEDGER_INVALID");
  }
  const detached = clone(value) as ProductValidationRunLedger;
  for (const [index, entry] of detached.entries.entries()) {
    if (!isRecord(entry)
      || entry.sequence !== index + 1
      || typeof entry.entryId !== "string"
      || typeof entry.entryDigest !== "string"
      || typeof entry.validationInvocationId !== "string"
      || !isRecord(entry.run)
      || entry.appendOnly !== true
      || entry.projectWriteAuthorized !== false
      || entry.repairAuthorized !== false
      || entry.humanDecisionBypassed !== false
      || entry.pd011QualificationClaimed !== false
      || entry.run.projectWriteAuthorized !== false
      || entry.run.autoFixAllowed !== false
      || entry.run.autoDecisionAllowed !== false
      || entry.run.pd011QualificationClaimed !== false
      || !verifyValidationRunDigest(entry.run)) {
      throw new Error("PRODUCT_VALIDATION_RUN_LEDGER_ENTRY_INVALID");
    }
    const { entryDigest, ...material } = entry;
    if (logicalDigest(entryMaterial(material)) !== entryDigest) {
      throw new Error("PRODUCT_VALIDATION_RUN_LEDGER_ENTRY_DIGEST_INVALID");
    }
  }
  const { ledgerDigest, ...material } = detached;
  if (logicalDigest(ledgerMaterial(material)) !== ledgerDigest) {
    throw new Error("PRODUCT_VALIDATION_RUN_LEDGER_DIGEST_INVALID");
  }
  return deepFreeze(detached);
};

export const appendProductValidationRun = (input: {
  ledger: Readonly<ProductValidationRunLedger>;
  callerRef: string;
  retainedAt: string;
  validationInvocationId: string;
  profile: ProductValidationProfileReference;
  projectSnapshotRef: ProductValidationRunLedgerEntry["projectSnapshotRef"];
  ownerResultRefs: readonly ProductScientificOwnerResultReference[];
  ownerResultLedgerDigest: string;
  run: ValidationRun;
  boundedStatus: ProductValidationRunLedgerEntry["boundedStatus"];
}): { ledger: Readonly<ProductValidationRunLedger>; entry: Readonly<ProductValidationRunLedgerEntry> } => {
  const current = rehydrateProductValidationRunLedger(input.ledger);
  if (!verifyValidationRunDigest(input.run)
    || input.run.projectWriteAuthorized !== false
    || input.run.autoFixAllowed !== false
    || input.run.autoDecisionAllowed !== false
    || input.run.pd011QualificationClaimed !== false) {
    throw new Error("PRODUCT_VALIDATION_RUN_BOUNDARY_INVALID");
  }
  if (current.entries.some((entry) => entry.validationInvocationId === input.validationInvocationId
    || entry.run.validationRunId === input.run.validationRunId)) {
    throw new Error("PRODUCT_VALIDATION_RUN_LEDGER_DUPLICATE_RUN");
  }
  const material: Omit<ProductValidationRunLedgerEntry, "entryDigest"> = {
    entryId: `validation-run-ledger-entry:${logicalDigest({
      sequence: current.entries.length + 1,
      invocation: input.validationInvocationId,
      run: input.run.validationRunId,
    })}`,
    sequence: current.entries.length + 1,
    callerRef: input.callerRef,
    retainedAt: input.retainedAt,
    validationInvocationId: input.validationInvocationId,
    profile: clone(input.profile),
    projectSnapshotRef: clone(input.projectSnapshotRef),
    ownerResultRefs: clone([...input.ownerResultRefs]),
    ownerResultLedgerDigest: input.ownerResultLedgerDigest,
    run: clone(input.run),
    boundedStatus: input.boundedStatus,
    appendOnly: true,
    projectWriteAuthorized: false,
    repairAuthorized: false,
    humanDecisionBypassed: false,
    pd011QualificationClaimed: false,
  };
  const entry = deepFreeze({ ...material, entryDigest: logicalDigest(entryMaterial(material)) });
  return {
    entry,
    ledger: createLedger({
      contract: PRODUCT_VALIDATION_RUN_LEDGER_CONTRACT,
      contractVersion: PRODUCT_VALIDATION_RUN_LEDGER_VERSION,
      sessionId: current.sessionId,
      entries: [...current.entries, entry],
      appendOnly: true,
      projectWriteAuthorized: false,
      repairAuthorized: false,
      pd011QualificationClaimed: false,
    }),
  };
};

export const readProductValidationRun = (input: {
  ledger: Readonly<ProductValidationRunLedger>;
  validationRunId: string;
}) => {
  const ledger = rehydrateProductValidationRunLedger(input.ledger);
  const entry = ledger.entries.find((candidate) => candidate.run.validationRunId === input.validationRunId);
  if (!entry) throw new Error("PRODUCT_VALIDATION_RUN_NOT_FOUND");
  return deepFreeze({ entry, run: entry.run });
};
