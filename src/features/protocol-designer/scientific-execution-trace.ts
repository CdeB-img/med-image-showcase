import { logicalDigest } from "@/features/knowledge-engine";
import type {
  ProjectContextSnapshot,
  SpecializedOwnerResult,
} from "@/features/research-project-construction";
import type {
  ProductOwnerResultDependency,
  ProductOwnerResultLedgerEntry,
} from "./product-owner-result-ledger";
import type { ProductValidationRunLedgerEntry } from "./product-validation-run-ledger";

export const SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT = "SCIENTIFIC_EXECUTION_TRACE_LEDGER" as const;
export const SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION = "0.1.0" as const;
export const SCIENTIFIC_RUN_SCHEMA_VERSION = "0.1.0" as const;
export const SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION = "0.1.0" as const;

export type ScientificTraceOwner =
  | "RESEARCH_PROJECT"
  | "KNOWLEDGE"
  | "SCIENTIFIC_THINKING"
  | "IMAGING"
  | "REGULATORY_RESOLUTION"
  | "VAL"
  | "TRACE";

export type ScientificExecutionTraceEventType =
  | "RUN_STARTED"
  | "OWNER_INVOCATION_STARTED"
  | "OWNER_INVOCATION_COMPLETED"
  | "OWNER_INVOCATION_FAILED"
  | "HANDOFF_STARTED"
  | "HANDOFF_ACCEPTED"
  | "HANDOFF_REJECTED"
  | "RESULT_PERSISTED"
  | "STALE_RESULT_REJECTED"
  | "VALIDATION_STARTED"
  | "VALIDATION_COMPLETED"
  | "RUN_COMPLETED"
  | "RUN_FAILED";

export type FirstDivergentStage =
  | "PROJECT_CONTEXT"
  | "OWNER_REQUEST_BUILDING"
  | "KNOWLEDGE_ENGINE"
  | "KNOWLEDGE_TO_ST_HANDOFF"
  | "SCIENTIFIC_THINKING_ENGINE"
  | "ST_TO_IMAGING_HANDOFF"
  | "IMAGING_ENGINE"
  | "VAL_INPUT_ADAPTER"
  | "VAL_ENGINE"
  | "REG_REQUEST_BUILDING"
  | "REG_ENGINE"
  | "OWNER_RESULT_PERSISTENCE"
  | "STALE_VALIDATION"
  | "UNKNOWN_STAGE";

export type ScientificRunProjectBinding = {
  projectId: string;
  projectVersion: string;
  projectDigest: string;
  snapshotRef: string;
};

export type ScientificTraceRequestReference = {
  requestId: string;
  requestSchemaVersion: string;
  requestDigest: string;
};

export type ScientificTraceArtifactReference = {
  artifactType: "OWNER_RESULT" | "OWNER_RESULT_LEDGER_ENTRY" | "VALIDATION_RUN" | "VALIDATION_RUN_LEDGER_ENTRY";
  owner: ScientificTraceOwner;
  artifactId: string;
  artifactVersion: string;
  artifactDigest: string;
};

export type ScientificTraceDependencyReference = {
  owner: ScientificTraceOwner;
  resultId: string;
  resultVersion: string;
  resultDigest: string;
};

export type ScientificTraceStaleObservation = {
  status: "NOT_EVALUATED" | "CURRENT" | "STALE_REJECTED";
  expectedProject: ScientificRunProjectBinding | null;
  receivedProject: ScientificRunProjectBinding | null;
  expectedDependencyRefs: readonly ScientificTraceDependencyReference[];
  receivedDependencyRefs: readonly ScientificTraceDependencyReference[];
};

export type ScientificTraceDiagnostic = {
  stage: FirstDivergentStage;
  code: string;
};

export type ScientificTraceError = {
  category: "BOUNDARY_REJECTION" | "OWNER_RUNTIME" | "PERSISTENCE" | "VALIDATION" | "UNKNOWN";
  code: string;
};

export type ScientificTraceTechnicalMetadata = Readonly<Record<string, string | number | boolean | null>>;

export type ScientificExecutionTraceEvent = {
  contract: "SCIENTIFIC_EXECUTION_TRACE_EVENT";
  schemaVersion: typeof SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION;
  eventId: string;
  runId: string;
  sequence: number;
  eventType: ScientificExecutionTraceEventType;
  timestamp: string;
  owner: ScientificTraceOwner;
  engine: string | null;
  engineVersion: string | null;
  project: ScientificRunProjectBinding;
  requestRef: ScientificTraceRequestReference | null;
  inputOwnerResultRefs: readonly ScientificTraceArtifactReference[];
  dependencyRefs: readonly ScientificTraceDependencyReference[];
  outputResultRef: ScientificTraceArtifactReference | null;
  status: string;
  sourceRefs: readonly string[];
  sourceCount: number;
  evidenceRefs: readonly string[];
  unknownRefs: readonly string[];
  gapRefs: readonly string[];
  limitationRefs: readonly string[];
  contradictionRefs: readonly string[];
  stale: ScientificTraceStaleObservation;
  durationMs: number | null;
  error: ScientificTraceError | null;
  diagnostic: ScientificTraceDiagnostic | null;
  previousEventId: string | null;
  nextExpectedHandoff: string | null;
  technicalMetadata: ScientificTraceTechnicalMetadata;
  logicalDigest: string;
  eventDigest: string;
  appendOnly: true;
  derived: true;
  projectWriteAuthorized: false;
  repairAuthorized: false;
  scientificDecisionAuthorized: false;
  privateReasoningStored: false;
};

export type ScientificRunBinding = {
  contract: "SCIENTIFIC_RUN_BINDING";
  schemaVersion: typeof SCIENTIFIC_RUN_SCHEMA_VERSION;
  runId: string;
  project: ScientificRunProjectBinding;
  initiatorContext: {
    kind: "EXPLICIT_PRODUCT_CALL" | "TEST_HARNESS" | "REPLAY_ANALYSIS";
    initiatorRef: string;
  };
  startedAt: string;
  createdAt: string;
  bindingDigest: string;
  appendOnly: true;
  derived: true;
  projectWriteAuthorized: false;
};

export type ScientificExecutionTraceLedger = {
  contract: typeof SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT;
  contractVersion: typeof SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION;
  sessionId: string;
  runBindings: readonly Readonly<ScientificRunBinding>[];
  events: readonly Readonly<ScientificExecutionTraceEvent>[];
  ledgerDigest: string;
  appendOnly: true;
  derived: true;
  readOnlyObservedArtifacts: true;
  projectWriteAuthorized: false;
  ownerResultWriteAuthorized: false;
  validationRunWriteAuthorized: false;
  repairAuthorized: false;
  scientificDecisionAuthorized: false;
  privateReasoningStored: false;
};

export type ScientificRun = {
  contract: "SCIENTIFIC_RUN";
  schemaVersion: typeof SCIENTIFIC_RUN_SCHEMA_VERSION;
  runId: string;
  startedAt: string;
  completedAt: string | null;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  project: ScientificRunProjectBinding;
  initiatorContext: ScientificRunBinding["initiatorContext"];
  eventCount: number;
  firstEventId: string;
  lastEventId: string;
  logicalDigest: string;
  createdAt: string;
  immutableAfterFinalization: true;
  appendOnly: true;
  derived: true;
  authoritative: false;
};

export type ScientificExecutionTraceEventInput = {
  eventType: ScientificExecutionTraceEventType;
  timestamp: string;
  owner?: ScientificTraceOwner;
  engine?: string | null;
  engineVersion?: string | null;
  requestRef?: ScientificTraceRequestReference | null;
  inputOwnerResultRefs?: readonly ScientificTraceArtifactReference[];
  dependencyRefs?: readonly ScientificTraceDependencyReference[];
  outputResultRef?: ScientificTraceArtifactReference | null;
  status: string;
  sourceRefs?: readonly string[];
  sourceCount?: number;
  evidenceRefs?: readonly string[];
  unknownRefs?: readonly string[];
  gapRefs?: readonly string[];
  limitationRefs?: readonly string[];
  contradictionRefs?: readonly string[];
  stale?: ScientificTraceStaleObservation;
  durationMs?: number | null;
  error?: ScientificTraceError | null;
  diagnostic?: ScientificTraceDiagnostic | null;
  nextExpectedHandoff?: string | null;
  technicalMetadata?: ScientificTraceTechnicalMetadata;
};

export type ScientificRunTraceRecorder = {
  readonly runId: string;
  append: (input: ScientificExecutionTraceEventInput) => Readonly<ScientificExecutionTraceEvent>;
  complete: (completedAt: string) => Readonly<ScientificRun>;
  fail: (completedAt: string, errorCode: string, stage?: FirstDivergentStage) => Readonly<ScientificRun>;
  getLedger: () => Readonly<ScientificExecutionTraceLedger>;
  getRun: () => Readonly<ScientificRun>;
};

const clone = <T>(value: T): T => structuredClone(value);

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as Record<string, unknown>).forEach((nested) => deepFreeze(nested));
    Object.freeze(value);
  }
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const unique = <T>(values: readonly T[]) => [...new Set(values)];

const FORBIDDEN_FIELD = /(secret|token|password|authorization|cookie|credential|api.?key|chain.?of.?thought|private.?reasoning|transcript|raw.?prompt|patient)/i;
const FORBIDDEN_VALUE = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]+|\bsk-[A-Za-z0-9_-]{8,}|\bAIza[A-Za-z0-9_-]{12,})/i;
const DIAGNOSTIC_CODE = /^[A-Z0-9][A-Z0-9_.:@/-]{1,255}$/;
const TECHNICAL_METADATA_KEYS = new Set([
  "boundedStatus",
  "callerRef",
  "entryDigest",
  "entryId",
  "invocationId",
  "ledgerContract",
  "ledgerVersion",
  "llmCalls",
  "observationContract",
  "observationVersion",
  "profileId",
  "profileVersion",
  "projectWrites",
  "repairAuthorized",
  "runtimeStarts",
  "scientificQualificationClaimed",
  "validationEntryDigest",
  "validationEntryId",
]);

const assertNoForbiddenData = (value: unknown, path = "trace") => {
  if (typeof value === "string") {
    if (FORBIDDEN_VALUE.test(value)) throw new Error("SCIENTIFIC_TRACE_SECRET_MATERIAL_FORBIDDEN");
    if (value.includes("\n") || value.length > 1024) throw new Error("SCIENTIFIC_TRACE_UNBOUNDED_TEXT_FORBIDDEN");
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((nested, index) => assertNoForbiddenData(nested, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_FIELD.test(key) && key !== "privateReasoningStored") {
      throw new Error("SCIENTIFIC_TRACE_PRIVATE_OR_SENSITIVE_FIELD_FORBIDDEN");
    }
    assertNoForbiddenData(nested, `${path}.${key}`);
  }
};

const validateCode = (code: string) => {
  if (!DIAGNOSTIC_CODE.test(code)) throw new Error("SCIENTIFIC_TRACE_DIAGNOSTIC_CODE_INVALID");
};

const boundedTechnicalCode = (code: string, prefix: string) => DIAGNOSTIC_CODE.test(code)
  ? code
  : `${prefix}_${logicalDigest(code).slice(0, 24).toUpperCase()}`;

const validateMetadata = (metadata: ScientificTraceTechnicalMetadata) => {
  for (const [key, value] of Object.entries(metadata)) {
    if (!TECHNICAL_METADATA_KEYS.has(key)) throw new Error("SCIENTIFIC_TRACE_METADATA_KEY_NOT_ALLOWED");
    if (!["string", "number", "boolean"].includes(typeof value) && value !== null) {
      throw new Error("SCIENTIFIC_TRACE_METADATA_VALUE_INVALID");
    }
  }
};

const projectBindingFromSnapshot = (snapshot: Readonly<ProjectContextSnapshot>): ScientificRunProjectBinding => ({
  projectId: snapshot.sourceProjectRef,
  projectVersion: snapshot.sourceProjectVersion,
  projectDigest: snapshot.sourceProjectDigest,
  snapshotRef: snapshot.snapshotDigest,
});

const bindingMaterial = (binding: Omit<ScientificRunBinding, "bindingDigest">) => ({ ...binding });

const logicalEventMaterial = (event: Omit<ScientificExecutionTraceEvent, "logicalDigest" | "eventDigest">) => ({
  eventType: event.eventType,
  owner: event.owner,
  engine: event.engine,
  engineVersion: event.engineVersion,
  project: event.project,
  requestRef: event.requestRef,
  inputOwnerResultRefs: event.inputOwnerResultRefs,
  dependencyRefs: event.dependencyRefs,
  outputResultRef: event.outputResultRef,
  status: event.status,
  sourceRefs: event.sourceRefs,
  sourceCount: event.sourceCount,
  evidenceRefs: event.evidenceRefs,
  unknownRefs: event.unknownRefs,
  gapRefs: event.gapRefs,
  limitationRefs: event.limitationRefs,
  contradictionRefs: event.contradictionRefs,
  stale: event.stale,
  error: event.error,
  diagnostic: event.diagnostic,
  nextExpectedHandoff: event.nextExpectedHandoff,
  technicalMetadata: event.technicalMetadata,
  appendOnly: event.appendOnly,
  derived: event.derived,
  projectWriteAuthorized: event.projectWriteAuthorized,
  repairAuthorized: event.repairAuthorized,
  scientificDecisionAuthorized: event.scientificDecisionAuthorized,
  privateReasoningStored: event.privateReasoningStored,
});

const eventMaterial = (event: Omit<ScientificExecutionTraceEvent, "eventDigest">) => ({ ...event });

const ledgerMaterial = (ledger: Omit<ScientificExecutionTraceLedger, "ledgerDigest">) => ({ ...ledger });

const createLedger = (input: Omit<ScientificExecutionTraceLedger, "ledgerDigest">): Readonly<ScientificExecutionTraceLedger> => {
  const detached = clone(input);
  return deepFreeze({ ...detached, ledgerDigest: logicalDigest(ledgerMaterial(detached)) });
};

export const createScientificExecutionTraceLedger = (sessionId: string): Readonly<ScientificExecutionTraceLedger> => createLedger({
  contract: SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT,
  contractVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
  sessionId,
  runBindings: [],
  events: [],
  appendOnly: true,
  derived: true,
  readOnlyObservedArtifacts: true,
  projectWriteAuthorized: false,
  ownerResultWriteAuthorized: false,
  validationRunWriteAuthorized: false,
  repairAuthorized: false,
  scientificDecisionAuthorized: false,
  privateReasoningStored: false,
});

const bindingFor = (ledger: Readonly<ScientificExecutionTraceLedger>, runId: string) => {
  const binding = ledger.runBindings.find((candidate) => candidate.runId === runId);
  if (!binding) throw new Error("SCIENTIFIC_TRACE_RUN_NOT_FOUND");
  return binding;
};

const eventsFor = (ledger: Readonly<ScientificExecutionTraceLedger>, runId: string) => ledger.events.filter((event) => event.runId === runId);

const isTerminal = (event: Readonly<ScientificExecutionTraceEvent>) => event.eventType === "RUN_COMPLETED" || event.eventType === "RUN_FAILED";

export const verifyScientificExecutionTraceEventDigest = (event: Readonly<ScientificExecutionTraceEvent>) => {
  const { eventDigest, ...material } = event;
  const { logicalDigest: storedLogicalDigest, ...logicalMaterial } = material;
  return logicalDigest(logicalEventMaterial(logicalMaterial)) === storedLogicalDigest
    && logicalDigest(eventMaterial(material)) === eventDigest;
};

const validateProjectBinding = (value: unknown): value is ScientificRunProjectBinding => isRecord(value)
  && typeof value.projectId === "string"
  && typeof value.projectVersion === "string"
  && typeof value.projectDigest === "string"
  && typeof value.snapshotRef === "string";

const TRACE_OWNERS = new Set<ScientificTraceOwner>([
  "RESEARCH_PROJECT",
  "KNOWLEDGE",
  "SCIENTIFIC_THINKING",
  "IMAGING",
  "REGULATORY_RESOLUTION",
  "VAL",
  "TRACE",
]);
const TRACE_EVENT_TYPES = new Set<ScientificExecutionTraceEventType>([
  "RUN_STARTED",
  "OWNER_INVOCATION_STARTED",
  "OWNER_INVOCATION_COMPLETED",
  "OWNER_INVOCATION_FAILED",
  "HANDOFF_STARTED",
  "HANDOFF_ACCEPTED",
  "HANDOFF_REJECTED",
  "RESULT_PERSISTED",
  "STALE_RESULT_REJECTED",
  "VALIDATION_STARTED",
  "VALIDATION_COMPLETED",
  "RUN_COMPLETED",
  "RUN_FAILED",
]);
const DIVERGENT_STAGES = new Set<FirstDivergentStage>([
  "PROJECT_CONTEXT",
  "OWNER_REQUEST_BUILDING",
  "KNOWLEDGE_ENGINE",
  "KNOWLEDGE_TO_ST_HANDOFF",
  "SCIENTIFIC_THINKING_ENGINE",
  "ST_TO_IMAGING_HANDOFF",
  "IMAGING_ENGINE",
  "VAL_INPUT_ADAPTER",
  "VAL_ENGINE",
  "REG_REQUEST_BUILDING",
  "REG_ENGINE",
  "OWNER_RESULT_PERSISTENCE",
  "STALE_VALIDATION",
  "UNKNOWN_STAGE",
]);
const ARTIFACT_TYPES = new Set<ScientificTraceArtifactReference["artifactType"]>([
  "OWNER_RESULT",
  "OWNER_RESULT_LEDGER_ENTRY",
  "VALIDATION_RUN",
  "VALIDATION_RUN_LEDGER_ENTRY",
]);
const ERROR_CATEGORIES = new Set<ScientificTraceError["category"]>([
  "BOUNDARY_REJECTION",
  "OWNER_RUNTIME",
  "PERSISTENCE",
  "VALIDATION",
  "UNKNOWN",
]);

const isStringArray = (value: unknown): value is string[] => Array.isArray(value)
  && value.every((item) => typeof item === "string");
const validateRequestReference = (value: unknown): value is ScientificTraceRequestReference => isRecord(value)
  && typeof value.requestId === "string"
  && typeof value.requestSchemaVersion === "string"
  && typeof value.requestDigest === "string";
const validateArtifactReference = (value: unknown): value is ScientificTraceArtifactReference => isRecord(value)
  && ARTIFACT_TYPES.has(value.artifactType as ScientificTraceArtifactReference["artifactType"])
  && TRACE_OWNERS.has(value.owner as ScientificTraceOwner)
  && typeof value.artifactId === "string"
  && typeof value.artifactVersion === "string"
  && typeof value.artifactDigest === "string";
const validateDependencyReference = (value: unknown): value is ScientificTraceDependencyReference => isRecord(value)
  && TRACE_OWNERS.has(value.owner as ScientificTraceOwner)
  && typeof value.resultId === "string"
  && typeof value.resultVersion === "string"
  && typeof value.resultDigest === "string";
const validateStaleObservation = (value: unknown): value is ScientificTraceStaleObservation => isRecord(value)
  && ["NOT_EVALUATED", "CURRENT", "STALE_REJECTED"].includes(String(value.status))
  && (value.expectedProject === null || validateProjectBinding(value.expectedProject))
  && (value.receivedProject === null || validateProjectBinding(value.receivedProject))
  && Array.isArray(value.expectedDependencyRefs)
  && value.expectedDependencyRefs.every(validateDependencyReference)
  && Array.isArray(value.receivedDependencyRefs)
  && value.receivedDependencyRefs.every(validateDependencyReference);
const validateError = (value: unknown): value is ScientificTraceError => isRecord(value)
  && ERROR_CATEGORIES.has(value.category as ScientificTraceError["category"])
  && typeof value.code === "string";
const validateDiagnostic = (value: unknown): value is ScientificTraceDiagnostic => isRecord(value)
  && DIVERGENT_STAGES.has(value.stage as FirstDivergentStage)
  && typeof value.code === "string";

const validateEventShape = (event: unknown): event is ScientificExecutionTraceEvent => isRecord(event)
  && event.contract === "SCIENTIFIC_EXECUTION_TRACE_EVENT"
  && event.schemaVersion === SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION
  && typeof event.eventId === "string"
  && typeof event.runId === "string"
  && typeof event.sequence === "number"
  && TRACE_EVENT_TYPES.has(event.eventType as ScientificExecutionTraceEventType)
  && typeof event.timestamp === "string"
  && TRACE_OWNERS.has(event.owner as ScientificTraceOwner)
  && (event.engine === null || typeof event.engine === "string")
  && (event.engineVersion === null || typeof event.engineVersion === "string")
  && validateProjectBinding(event.project)
  && (event.requestRef === null || validateRequestReference(event.requestRef))
  && Array.isArray(event.inputOwnerResultRefs)
  && event.inputOwnerResultRefs.every(validateArtifactReference)
  && Array.isArray(event.dependencyRefs)
  && event.dependencyRefs.every(validateDependencyReference)
  && (event.outputResultRef === null || validateArtifactReference(event.outputResultRef))
  && typeof event.status === "string"
  && isStringArray(event.sourceRefs)
  && typeof event.sourceCount === "number"
  && isStringArray(event.evidenceRefs)
  && isStringArray(event.unknownRefs)
  && isStringArray(event.gapRefs)
  && isStringArray(event.limitationRefs)
  && isStringArray(event.contradictionRefs)
  && validateStaleObservation(event.stale)
  && (event.durationMs === null || typeof event.durationMs === "number")
  && (event.error === null || validateError(event.error))
  && (event.diagnostic === null || validateDiagnostic(event.diagnostic))
  && (event.previousEventId === null || typeof event.previousEventId === "string")
  && (event.nextExpectedHandoff === null || typeof event.nextExpectedHandoff === "string")
  && isRecord(event.technicalMetadata)
  && typeof event.logicalDigest === "string"
  && typeof event.eventDigest === "string"
  && event.appendOnly === true
  && event.derived === true
  && event.projectWriteAuthorized === false
  && event.repairAuthorized === false
  && event.scientificDecisionAuthorized === false
  && event.privateReasoningStored === false;

export const rehydrateScientificExecutionTraceLedger = (value: unknown): Readonly<ScientificExecutionTraceLedger> => {
  if (!isRecord(value)
    || value.contract !== SCIENTIFIC_EXECUTION_TRACE_LEDGER_CONTRACT
    || value.contractVersion !== SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION
    || typeof value.sessionId !== "string"
    || !Array.isArray(value.runBindings)
    || !Array.isArray(value.events)
    || typeof value.ledgerDigest !== "string"
    || value.appendOnly !== true
    || value.derived !== true
    || value.readOnlyObservedArtifacts !== true
    || value.projectWriteAuthorized !== false
    || value.ownerResultWriteAuthorized !== false
    || value.validationRunWriteAuthorized !== false
    || value.repairAuthorized !== false
    || value.scientificDecisionAuthorized !== false
    || value.privateReasoningStored !== false) {
    throw new Error("SCIENTIFIC_EXECUTION_TRACE_LEDGER_INVALID");
  }
  assertNoForbiddenData(value);
  const detached = clone(value) as ScientificExecutionTraceLedger;
  const runIds = new Set<string>();
  for (const binding of detached.runBindings) {
    if (!isRecord(binding)
      || binding.contract !== "SCIENTIFIC_RUN_BINDING"
      || binding.schemaVersion !== SCIENTIFIC_RUN_SCHEMA_VERSION
      || typeof binding.runId !== "string"
      || !validateProjectBinding(binding.project)
      || !isRecord(binding.initiatorContext)
      || !["EXPLICIT_PRODUCT_CALL", "TEST_HARNESS", "REPLAY_ANALYSIS"].includes(String(binding.initiatorContext.kind))
      || typeof binding.initiatorContext.initiatorRef !== "string"
      || typeof binding.startedAt !== "string"
      || typeof binding.createdAt !== "string"
      || typeof binding.bindingDigest !== "string"
      || binding.appendOnly !== true
      || binding.derived !== true
      || binding.projectWriteAuthorized !== false
      || runIds.has(binding.runId)) {
      throw new Error("SCIENTIFIC_TRACE_RUN_BINDING_INVALID");
    }
    const { bindingDigest, ...material } = binding;
    if (logicalDigest(bindingMaterial(material)) !== bindingDigest) throw new Error("SCIENTIFIC_TRACE_RUN_BINDING_DIGEST_INVALID");
    runIds.add(binding.runId);
  }
  const sequences = new Map<string, number>();
  const previousIds = new Map<string, string | null>();
  const finalizedRuns = new Set<string>();
  for (const event of detached.events) {
    if (!validateEventShape(event) || !runIds.has(event.runId)) throw new Error("SCIENTIFIC_TRACE_EVENT_INVALID");
    const expectedSequence = (sequences.get(event.runId) ?? 0) + 1;
    if (event.sequence !== expectedSequence || event.previousEventId !== (previousIds.get(event.runId) ?? null)) {
      throw new Error("SCIENTIFIC_TRACE_EVENT_SEQUENCE_INVALID");
    }
    if (finalizedRuns.has(event.runId)) throw new Error("SCIENTIFIC_TRACE_FINALIZED_RUN_IS_IMMUTABLE");
    if (event.sequence === 1 && event.eventType !== "RUN_STARTED") throw new Error("SCIENTIFIC_TRACE_RUN_START_EVENT_MISSING");
    if (!verifyScientificExecutionTraceEventDigest(event)) throw new Error("SCIENTIFIC_TRACE_EVENT_DIGEST_INVALID");
    validateMetadata(event.technicalMetadata);
    if (event.error) validateCode(event.error.code);
    if (event.diagnostic) validateCode(event.diagnostic.code);
    sequences.set(event.runId, event.sequence);
    previousIds.set(event.runId, event.eventId);
    if (isTerminal(event)) finalizedRuns.add(event.runId);
  }
  const { ledgerDigest, ...material } = detached;
  if (logicalDigest(ledgerMaterial(material)) !== ledgerDigest) throw new Error("SCIENTIFIC_EXECUTION_TRACE_LEDGER_DIGEST_INVALID");
  return deepFreeze(detached);
};

export const appendScientificExecutionTraceEvent = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  event: ScientificExecutionTraceEventInput;
}): { ledger: Readonly<ScientificExecutionTraceLedger>; event: Readonly<ScientificExecutionTraceEvent> } => {
  const current = rehydrateScientificExecutionTraceLedger(input.ledger);
  assertNoForbiddenData(input.event);
  validateMetadata(input.event.technicalMetadata ?? {});
  if (input.event.error) validateCode(input.event.error.code);
  if (input.event.diagnostic) validateCode(input.event.diagnostic.code);
  const binding = bindingFor(current, input.runId);
  const runEvents = eventsFor(current, input.runId);
  if (runEvents.some(isTerminal)) throw new Error("SCIENTIFIC_TRACE_FINALIZED_RUN_IS_IMMUTABLE");
  const previous = runEvents.at(-1) ?? null;
  if (!previous && input.event.eventType !== "RUN_STARTED") throw new Error("SCIENTIFIC_TRACE_RUN_START_EVENT_MISSING");
  if (previous && input.event.eventType === "RUN_STARTED") throw new Error("SCIENTIFIC_TRACE_DUPLICATE_RUN_START");
  const stale = input.event.stale ?? {
    status: "NOT_EVALUATED" as const,
    expectedProject: null,
    receivedProject: null,
    expectedDependencyRefs: [],
    receivedDependencyRefs: [],
  };
  const sequence = runEvents.length + 1;
  const logicalBase: Omit<ScientificExecutionTraceEvent, "logicalDigest" | "eventDigest"> = {
    contract: "SCIENTIFIC_EXECUTION_TRACE_EVENT",
    schemaVersion: SCIENTIFIC_EXECUTION_TRACE_EVENT_SCHEMA_VERSION,
    eventId: "PENDING",
    runId: input.runId,
    sequence,
    eventType: input.event.eventType,
    timestamp: input.event.timestamp,
    owner: input.event.owner ?? "TRACE",
    engine: input.event.engine ?? null,
    engineVersion: input.event.engineVersion ?? null,
    project: clone(binding.project),
    requestRef: clone(input.event.requestRef ?? null),
    inputOwnerResultRefs: clone([...(input.event.inputOwnerResultRefs ?? [])]),
    dependencyRefs: clone([...(input.event.dependencyRefs ?? [])]),
    outputResultRef: clone(input.event.outputResultRef ?? null),
    status: input.event.status,
    sourceRefs: unique(input.event.sourceRefs ?? []),
    sourceCount: input.event.sourceCount ?? unique(input.event.sourceRefs ?? []).length,
    evidenceRefs: unique(input.event.evidenceRefs ?? []),
    unknownRefs: unique(input.event.unknownRefs ?? []),
    gapRefs: unique(input.event.gapRefs ?? []),
    limitationRefs: unique(input.event.limitationRefs ?? []),
    contradictionRefs: unique(input.event.contradictionRefs ?? []),
    stale: clone(stale),
    durationMs: input.event.durationMs ?? null,
    error: clone(input.event.error ?? null),
    diagnostic: clone(input.event.diagnostic ?? null),
    previousEventId: previous?.eventId ?? null,
    nextExpectedHandoff: input.event.nextExpectedHandoff ?? null,
    technicalMetadata: clone(input.event.technicalMetadata ?? {}),
    appendOnly: true,
    derived: true,
    projectWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
  };
  const eventId = `scientific-trace-event:${logicalDigest({
    runId: input.runId,
    sequence,
    eventType: input.event.eventType,
    previousEventId: previous?.eventId ?? null,
    logical: logicalEventMaterial(logicalBase),
  })}`;
  const withId = { ...logicalBase, eventId };
  const eventLogicalDigest = logicalDigest(logicalEventMaterial(withId));
  const event = deepFreeze({
    ...withId,
    logicalDigest: eventLogicalDigest,
    eventDigest: logicalDigest(eventMaterial({ ...withId, logicalDigest: eventLogicalDigest })),
  });
  const ledger = createLedger({
    contract: current.contract,
    contractVersion: current.contractVersion,
    sessionId: current.sessionId,
    runBindings: [...current.runBindings],
    events: [...current.events, event],
    appendOnly: true,
    derived: true,
    readOnlyObservedArtifacts: true,
    projectWriteAuthorized: false,
    ownerResultWriteAuthorized: false,
    validationRunWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
  });
  return { ledger, event };
};

export const startScientificRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  initiatorContext: ScientificRunBinding["initiatorContext"];
  startedAt: string;
  createdAt?: string;
}): { ledger: Readonly<ScientificExecutionTraceLedger>; binding: Readonly<ScientificRunBinding>; event: Readonly<ScientificExecutionTraceEvent>; run: Readonly<ScientificRun> } => {
  const current = rehydrateScientificExecutionTraceLedger(input.ledger);
  if (current.runBindings.some((binding) => binding.runId === input.runId)) throw new Error("SCIENTIFIC_TRACE_DUPLICATE_RUN_ID");
  assertNoForbiddenData(input.initiatorContext);
  const material: Omit<ScientificRunBinding, "bindingDigest"> = {
    contract: "SCIENTIFIC_RUN_BINDING",
    schemaVersion: SCIENTIFIC_RUN_SCHEMA_VERSION,
    runId: input.runId,
    project: projectBindingFromSnapshot(input.projectSnapshot),
    initiatorContext: clone(input.initiatorContext),
    startedAt: input.startedAt,
    createdAt: input.createdAt ?? input.startedAt,
    appendOnly: true,
    derived: true,
    projectWriteAuthorized: false,
  };
  const binding = deepFreeze({ ...material, bindingDigest: logicalDigest(bindingMaterial(material)) });
  const withBinding = createLedger({
    contract: current.contract,
    contractVersion: current.contractVersion,
    sessionId: current.sessionId,
    runBindings: [...current.runBindings, binding],
    events: [...current.events],
    appendOnly: true,
    derived: true,
    readOnlyObservedArtifacts: true,
    projectWriteAuthorized: false,
    ownerResultWriteAuthorized: false,
    validationRunWriteAuthorized: false,
    repairAuthorized: false,
    scientificDecisionAuthorized: false,
    privateReasoningStored: false,
  });
  const appended = appendScientificExecutionTraceEvent({
    ledger: withBinding,
    runId: input.runId,
    event: {
      eventType: "RUN_STARTED",
      timestamp: input.startedAt,
      owner: "TRACE",
      engine: "SCIENTIFIC_EXECUTION_TRACE",
      engineVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
      status: "RUNNING",
      diagnostic: { stage: "PROJECT_CONTEXT", code: "PROJECT_SNAPSHOT_BOUND" },
    },
  });
  return { ledger: appended.ledger, binding, event: appended.event, run: getScientificRun({ ledger: appended.ledger, runId: input.runId }) };
};

export const getScientificExecutionTraceEvent = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; eventId: string }) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  const event = ledger.events.find((candidate) => candidate.eventId === input.eventId);
  if (!event) throw new Error("SCIENTIFIC_TRACE_EVENT_NOT_FOUND");
  return event;
};

export const listScientificRunEvents = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; runId: string }) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  bindingFor(ledger, input.runId);
  return deepFreeze([...eventsFor(ledger, input.runId)]);
};

export const getScientificRun = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; runId: string }): Readonly<ScientificRun> => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  const binding = bindingFor(ledger, input.runId);
  const events = eventsFor(ledger, input.runId);
  if (!events.length) throw new Error("SCIENTIFIC_TRACE_EMPTY_RUN_INVALID");
  const last = events.at(-1)!;
  const status: ScientificRun["status"] = last.eventType === "RUN_COMPLETED" ? "COMPLETED" : last.eventType === "RUN_FAILED" ? "FAILED" : "RUNNING";
  const run = {
    contract: "SCIENTIFIC_RUN" as const,
    schemaVersion: SCIENTIFIC_RUN_SCHEMA_VERSION,
    runId: binding.runId,
    startedAt: binding.startedAt,
    completedAt: status === "RUNNING" ? null : last.timestamp,
    status,
    project: clone(binding.project),
    initiatorContext: clone(binding.initiatorContext),
    eventCount: events.length,
    firstEventId: events[0].eventId,
    lastEventId: last.eventId,
    logicalDigest: logicalDigest({
      project: binding.project,
      status,
      events: events.map((event) => event.logicalDigest),
    }),
    createdAt: binding.createdAt,
    immutableAfterFinalization: true as const,
    appendOnly: true as const,
    derived: true as const,
    authoritative: false as const,
  };
  return deepFreeze(run);
};

export const verifyScientificRunDigest = (input: { ledger: Readonly<ScientificExecutionTraceLedger>; run: Readonly<ScientificRun> }) => {
  const reconstructed = getScientificRun({ ledger: input.ledger, runId: input.run.runId });
  return reconstructed.logicalDigest === input.run.logicalDigest
    && reconstructed.eventCount === input.run.eventCount
    && reconstructed.lastEventId === input.run.lastEventId;
};

export const finalizeScientificRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  completedAt: string;
  status: "COMPLETED" | "FAILED";
  errorCode?: string;
  stage?: FirstDivergentStage;
}) => {
  if (input.status === "FAILED" && !input.errorCode) throw new Error("SCIENTIFIC_TRACE_FAILED_RUN_ERROR_REQUIRED");
  const appended = appendScientificExecutionTraceEvent({
    ledger: input.ledger,
    runId: input.runId,
    event: {
      eventType: input.status === "COMPLETED" ? "RUN_COMPLETED" : "RUN_FAILED",
      timestamp: input.completedAt,
      owner: "TRACE",
      engine: "SCIENTIFIC_EXECUTION_TRACE",
      engineVersion: SCIENTIFIC_EXECUTION_TRACE_LEDGER_VERSION,
      status: input.status,
      error: input.errorCode ? { category: "UNKNOWN", code: input.errorCode } : null,
      diagnostic: input.errorCode ? { stage: input.stage ?? "UNKNOWN_STAGE", code: input.errorCode } : null,
    },
  });
  return { ledger: appended.ledger, event: appended.event, run: getScientificRun({ ledger: appended.ledger, runId: input.runId }) };
};

export const findScientificRunsByProject = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.runBindings.filter((binding) => binding.project.projectId === input.projectId
    && binding.project.projectVersion === input.projectVersion
    && binding.project.projectDigest === input.projectDigest)
    .map((binding) => getScientificRun({ ledger, runId: binding.runId })));
};

export const findScientificTraceEventsByProject = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  projectId: string;
  projectVersion: string;
  projectDigest: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.events.filter((event) => event.project.projectId === input.projectId
    && event.project.projectVersion === input.projectVersion
    && event.project.projectDigest === input.projectDigest));
};

export const findScientificTraceEventsByOwnerResult = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  resultId: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.events.filter((event) => (
    event.outputResultRef?.artifactType === "OWNER_RESULT"
      && event.outputResultRef.artifactId === input.resultId
  ) || event.inputOwnerResultRefs.some((ref) => ref.artifactType === "OWNER_RESULT" && ref.artifactId === input.resultId)));
};

export const findScientificTraceEventsByValidationRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  validationRunId: string;
}) => {
  const ledger = rehydrateScientificExecutionTraceLedger(input.ledger);
  return deepFreeze(ledger.events.filter((event) => (
    event.outputResultRef?.artifactType === "VALIDATION_RUN"
      && event.outputResultRef.artifactId === input.validationRunId
  ) || event.inputOwnerResultRefs.some((ref) => ref.artifactType === "VALIDATION_RUN"
    && ref.artifactId === input.validationRunId)));
};

const referenceHashes = (values: readonly string[], prefix: string) => unique(values.map((value) => `${prefix}:${logicalDigest(value)}`));

const collectBoundedReferences = (input: unknown, options: {
  collectionKeys: readonly string[];
  identifierKeys: readonly string[];
  prefix: string;
  preserveStringRefs?: boolean;
}): string[] => {
  const collected: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (depth > 10 || collected.length >= 500 || !value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (options.collectionKeys.includes(key) && Array.isArray(nested)) {
        for (const item of nested) {
          if (typeof item === "string") {
            collected.push(options.preserveStringRefs && key.toLowerCase().endsWith("refs")
              ? item
              : `${options.prefix}:${logicalDigest(item)}`);
          } else if (isRecord(item)) {
            const identifier = options.identifierKeys.map((candidate) => item[candidate]).find((candidate) => typeof candidate === "string");
            collected.push(typeof identifier === "string" ? identifier : `${options.prefix}:${logicalDigest(item)}`);
          }
          if (collected.length >= 500) break;
        }
      }
      visit(nested, depth + 1);
    }
  };
  visit(input, 0);
  return unique(collected);
};

const ownerResultNativeDigest = (result: Readonly<SpecializedOwnerResult> | null) => {
  if (!result?.nativePayload || !isRecord(result.nativePayload)) return result ? logicalDigest(result) : null;
  const digest = result.nativePayload.resultDigest ?? result.nativePayload.outputDigest ?? result.nativePayload.resolutionId;
  return typeof digest === "string" ? digest : logicalDigest(result.nativePayload);
};

const ownerResultRef = (result: Readonly<SpecializedOwnerResult>): ScientificTraceArtifactReference => ({
  artifactType: "OWNER_RESULT",
  owner: result.owner as ScientificTraceOwner,
  artifactId: result.resultId,
  artifactVersion: result.resultVersion,
  artifactDigest: ownerResultNativeDigest(result)!,
});

const ownerResultLedgerEntryRef = (
  entry: Readonly<ProductOwnerResultLedgerEntry>,
  ledgerVersion: string,
): ScientificTraceArtifactReference => ({
  artifactType: "OWNER_RESULT_LEDGER_ENTRY",
  owner: entry.request.owner as ScientificTraceOwner,
  artifactId: entry.entryId,
  artifactVersion: ledgerVersion,
  artifactDigest: entry.entryDigest,
});

const dependencyRef = (dependency: Readonly<ProductOwnerResultDependency>): ScientificTraceDependencyReference => ({
  owner: dependency.owner,
  resultId: dependency.resultId,
  resultVersion: dependency.resultVersion,
  resultDigest: dependency.nativeResultDigest,
});

const requestRef = (entry: Readonly<ProductOwnerResultLedgerEntry>): ScientificTraceRequestReference => ({
  requestId: entry.request.handoffId,
  requestSchemaVersion: `${entry.request.contractVersion}:${entry.request.nativeInputVersion}`,
  requestDigest: logicalDigest(entry.request),
});

const ownerStage = (owner: ScientificTraceOwner): FirstDivergentStage => owner === "KNOWLEDGE"
  ? "KNOWLEDGE_ENGINE"
  : owner === "SCIENTIFIC_THINKING"
    ? "SCIENTIFIC_THINKING_ENGINE"
    : owner === "IMAGING"
      ? "IMAGING_ENGINE"
      : owner === "REGULATORY_RESOLUTION"
        ? "REG_ENGINE"
        : owner === "VAL"
          ? "VAL_ENGINE"
          : "UNKNOWN_STAGE";

const nextHandoffFor = (owner: ScientificTraceOwner) => owner === "KNOWLEDGE"
  ? "KNOWLEDGE_TO_SCIENTIFIC_THINKING"
  : owner === "SCIENTIFIC_THINKING"
    ? "SCIENTIFIC_THINKING_TO_IMAGING"
    : owner === "IMAGING"
      ? "SCIENTIFIC_LOOP_TO_VAL"
      : null;

const traceSummary = (entry: Readonly<ProductOwnerResultLedgerEntry>) => {
  const nativePayload = entry.result?.nativePayload ?? null;
  const sourceRefs = unique([
    ...(entry.result?.provenance ?? []),
    ...collectBoundedReferences(nativePayload, {
      collectionKeys: ["sourceRefs", "sources"],
      identifierKeys: ["sourceId", "id"],
      prefix: "source",
      preserveStringRefs: true,
    }),
  ]);
  const evidenceRefs = unique([
    ...(entry.result?.evidenceRefs ?? []),
    ...collectBoundedReferences(nativePayload, {
      collectionKeys: ["evidenceRefs", "evidence"],
      identifierKeys: ["evidenceId", "linkId", "id"],
      prefix: "evidence",
      preserveStringRefs: true,
    }),
  ]);
  return {
    sourceRefs,
    sourceCount: sourceRefs.length,
    evidenceRefs,
    unknownRefs: unique([
      ...referenceHashes(entry.result?.unknowns ?? entry.observation.unknowns, "unknown"),
      ...collectBoundedReferences(nativePayload, {
        collectionKeys: ["unknowns", "unresolvedUnknowns"],
        identifierKeys: ["unknownId", "id"],
        prefix: "unknown",
      }),
    ]),
    gapRefs: unique([
      ...referenceHashes(entry.result?.gaps ?? entry.observation.gaps, "gap"),
      ...collectBoundedReferences(nativePayload, {
        collectionKeys: ["gaps", "gapRefs"],
        identifierKeys: ["gapId", "code", "id"],
        prefix: "gap",
        preserveStringRefs: true,
      }),
    ]),
    limitationRefs: unique([
      ...referenceHashes(entry.result?.limitations ?? entry.observation.limitations, "limitation"),
      ...collectBoundedReferences(nativePayload, {
        collectionKeys: ["limitations"],
        identifierKeys: ["limitationId", "code", "id"],
        prefix: "limitation",
      }),
    ]),
    contradictionRefs: collectBoundedReferences(nativePayload, {
      collectionKeys: ["contradictions", "contradictionRefs", "controversies"],
      identifierKeys: ["contradictionId", "conflictId", "controversyId", "id"],
      prefix: "contradiction",
      preserveStringRefs: true,
    }),
  };
};

export const recordOwnerInvocationTrace = (trace: ScientificRunTraceRecorder | undefined, input: {
  entry: Readonly<ProductOwnerResultLedgerEntry>;
  ledgerContract: string;
  ledgerVersion: string;
  handoffStage: FirstDivergentStage;
  nextExpectedHandoff?: string | null;
}) => {
  if (!trace) return;
  const entry = input.entry;
  const traceProject = trace.getRun().project;
  if (traceProject.projectId !== entry.request.sourceProject.sourceProjectRef
    || traceProject.projectVersion !== entry.request.sourceProject.sourceProjectVersion
    || traceProject.projectDigest !== entry.request.sourceProject.sourceProjectDigest
    || traceProject.snapshotRef !== entry.request.sourceProject.snapshotDigest) {
    throw new Error("SCIENTIFIC_TRACE_PROJECT_BINDING_MISMATCH");
  }
  const owner = entry.request.owner as ScientificTraceOwner;
  const dependencies = entry.dependencies.map(dependencyRef);
  const resultRef = entry.result ? ownerResultRef(entry.result) : null;
  const summary = traceSummary(entry);
  trace.append({
    eventType: "HANDOFF_STARTED",
    timestamp: entry.observation.startedAt,
    owner,
    status: "STARTED",
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    inputOwnerResultRefs: dependencies.map((dependency) => ({
      artifactType: "OWNER_RESULT",
      owner: dependency.owner,
      artifactId: dependency.resultId,
      artifactVersion: dependency.resultVersion,
      artifactDigest: dependency.resultDigest,
    })),
    diagnostic: { stage: input.handoffStage, code: "HANDOFF_INPUT_BOUND" },
  });
  trace.append({
    eventType: "HANDOFF_ACCEPTED",
    timestamp: entry.observation.startedAt,
    owner,
    status: "ACCEPTED",
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    diagnostic: { stage: input.handoffStage, code: "HANDOFF_CONTRACT_ACCEPTED" },
  });
  trace.append({
    eventType: "OWNER_INVOCATION_STARTED",
    timestamp: entry.observation.startedAt,
    owner,
    engine: entry.request.capabilityId,
    engineVersion: entry.observation.ownerRuntimeVersion,
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    status: "STARTED",
    diagnostic: { stage: ownerStage(owner), code: "OWNER_INVOCATION_STARTED" },
    technicalMetadata: {
      invocationId: entry.observation.invocationId,
      observationContract: entry.observation.contract,
      observationVersion: entry.observation.contractVersion,
      runtimeStarts: entry.observation.runtimeStarts,
      projectWrites: entry.observation.projectWrites,
    },
  });
  const completed = entry.result !== null && ![
    "OWNER_RUNTIME_FAILURE",
    "INVALID_OWNER_RESULT",
    "STALE_OWNER_RESULT",
  ].includes(entry.observation.status);
  const failureCode = completed
    ? null
    : boundedTechnicalCode(entry.observation.failureCode ?? "OWNER_RESULT_NOT_COMPLETED", "OWNER_RUNTIME_FAILURE");
  trace.append({
    eventType: completed ? "OWNER_INVOCATION_COMPLETED" : "OWNER_INVOCATION_FAILED",
    timestamp: entry.observation.completedAt,
    owner,
    engine: entry.request.capabilityId,
    engineVersion: entry.observation.ownerRuntimeVersion,
    requestRef: requestRef(entry),
    dependencyRefs: dependencies,
    outputResultRef: resultRef,
    status: entry.observation.status,
    ...summary,
    durationMs: entry.observation.latencyMs,
    error: completed ? null : { category: "OWNER_RUNTIME", code: failureCode! },
    diagnostic: { stage: ownerStage(owner), code: completed ? "OWNER_RESULT_OBSERVED" : failureCode! },
    nextExpectedHandoff: input.nextExpectedHandoff ?? nextHandoffFor(owner),
  });
  trace.append({
    eventType: "RESULT_PERSISTED",
    timestamp: entry.retainedAt,
    owner,
    engine: input.ledgerContract,
    engineVersion: input.ledgerVersion,
    requestRef: requestRef(entry),
    inputOwnerResultRefs: resultRef ? [resultRef] : [],
    dependencyRefs: dependencies,
    outputResultRef: ownerResultLedgerEntryRef(entry, input.ledgerVersion),
    status: entry.result ? "OWNER_RESULT_RETAINED" : "FAILED_OBSERVATION_RETAINED",
    ...summary,
    diagnostic: { stage: "OWNER_RESULT_PERSISTENCE", code: "OWNER_LEDGER_ENTRY_APPENDED" },
    nextExpectedHandoff: input.nextExpectedHandoff ?? nextHandoffFor(owner),
    technicalMetadata: {
      ledgerContract: input.ledgerContract,
      ledgerVersion: input.ledgerVersion,
      entryId: entry.entryId,
      entryDigest: entry.entryDigest,
      callerRef: entry.callerRef,
    },
  });
};

export const recordRejectedHandoffTrace = (trace: ScientificRunTraceRecorder | undefined, input: {
  timestamp: string;
  owner: ScientificTraceOwner;
  stage: FirstDivergentStage;
  code: string;
  expectedProject?: ScientificRunProjectBinding | null;
  receivedProject?: ScientificRunProjectBinding | null;
  expectedDependencyRefs?: readonly ScientificTraceDependencyReference[];
  receivedDependencyRefs?: readonly ScientificTraceDependencyReference[];
  stale?: boolean;
}) => {
  if (!trace) return;
  const code = boundedTechnicalCode(input.code, "BOUNDARY_REJECTION");
  validateCode(code);
  trace.append({
    eventType: "HANDOFF_STARTED",
    timestamp: input.timestamp,
    owner: input.owner,
    status: "STARTED",
    diagnostic: { stage: input.stage, code: "HANDOFF_VALIDATION_STARTED" },
  });
  if (input.stale) {
    trace.append({
      eventType: "STALE_RESULT_REJECTED",
      timestamp: input.timestamp,
      owner: input.owner,
      status: "STALE_REJECTED",
      stale: {
        status: "STALE_REJECTED",
        expectedProject: input.expectedProject ?? null,
        receivedProject: input.receivedProject ?? null,
        expectedDependencyRefs: input.expectedDependencyRefs ?? [],
        receivedDependencyRefs: input.receivedDependencyRefs ?? [],
      },
      error: { category: "BOUNDARY_REJECTION", code },
      diagnostic: { stage: "STALE_VALIDATION", code },
    });
  }
  trace.append({
    eventType: "HANDOFF_REJECTED",
    timestamp: input.timestamp,
    owner: input.owner,
    status: "REJECTED",
    stale: input.stale ? {
      status: "STALE_REJECTED",
      expectedProject: input.expectedProject ?? null,
      receivedProject: input.receivedProject ?? null,
      expectedDependencyRefs: input.expectedDependencyRefs ?? [],
      receivedDependencyRefs: input.receivedDependencyRefs ?? [],
    } : undefined,
    error: { category: "BOUNDARY_REJECTION", code },
    diagnostic: { stage: input.stage, code },
  });
};

const validationRunRef = (entry: Readonly<ProductValidationRunLedgerEntry>): ScientificTraceArtifactReference => ({
  artifactType: "VALIDATION_RUN",
  owner: "VAL",
  artifactId: entry.run.validationRunId,
  artifactVersion: entry.profile.profileVersion,
  artifactDigest: entry.run.resultDigest,
});

const validationRunLedgerEntryRef = (
  entry: Readonly<ProductValidationRunLedgerEntry>,
  ledgerVersion: string,
): ScientificTraceArtifactReference => ({
  artifactType: "VALIDATION_RUN_LEDGER_ENTRY",
  owner: "VAL",
  artifactId: entry.entryId,
  artifactVersion: ledgerVersion,
  artifactDigest: entry.entryDigest,
});

export const recordValidationRunTrace = (trace: ScientificRunTraceRecorder | undefined, input: {
  entry: Readonly<ProductValidationRunLedgerEntry>;
  ledgerContract: string;
  ledgerVersion: string;
  startedAt: string;
  completedAt: string;
  durationMs?: number | null;
}) => {
  if (!trace) return;
  const traceProject = trace.getRun().project;
  if (traceProject.projectId !== input.entry.projectSnapshotRef.projectId
    || traceProject.projectVersion !== input.entry.projectSnapshotRef.projectVersion
    || traceProject.projectDigest !== input.entry.projectSnapshotRef.projectDigest
    || traceProject.snapshotRef !== input.entry.projectSnapshotRef.snapshotDigest) {
    throw new Error("SCIENTIFIC_TRACE_PROJECT_BINDING_MISMATCH");
  }
  const ownerRefs: ScientificTraceArtifactReference[] = input.entry.ownerResultRefs.map((ref) => ({
    artifactType: "OWNER_RESULT",
    owner: ref.owner,
    artifactId: ref.resultId,
    artifactVersion: ref.resultVersion,
    artifactDigest: ref.nativeResultDigest,
  }));
  trace.append({
    eventType: "HANDOFF_STARTED",
    timestamp: input.startedAt,
    owner: "VAL",
    inputOwnerResultRefs: ownerRefs,
    status: "STARTED",
    diagnostic: { stage: "VAL_INPUT_ADAPTER", code: "VAL_INPUT_CHAIN_BOUND" },
  });
  trace.append({
    eventType: "HANDOFF_ACCEPTED",
    timestamp: input.startedAt,
    owner: "VAL",
    inputOwnerResultRefs: ownerRefs,
    status: "ACCEPTED",
    diagnostic: { stage: "VAL_INPUT_ADAPTER", code: "VAL_INPUT_CHAIN_ACCEPTED" },
  });
  trace.append({
    eventType: "VALIDATION_STARTED",
    timestamp: input.startedAt,
    owner: "VAL",
    engine: input.entry.profile.validationEngineId,
    engineVersion: input.entry.profile.validationEngineVersion,
    inputOwnerResultRefs: ownerRefs,
    status: "STARTED",
    diagnostic: { stage: "VAL_ENGINE", code: "VALIDATION_STARTED" },
    technicalMetadata: {
      profileId: input.entry.profile.profileId,
      profileVersion: input.entry.profile.profileVersion,
      scientificQualificationClaimed: input.entry.profile.scientificQualificationClaimed,
    },
  });
  trace.append({
    eventType: "VALIDATION_COMPLETED",
    timestamp: input.completedAt,
    owner: "VAL",
    engine: input.entry.profile.validationEngineId,
    engineVersion: input.entry.profile.validationEngineVersion,
    inputOwnerResultRefs: ownerRefs,
    outputResultRef: validationRunRef(input.entry),
    status: input.entry.boundedStatus,
    durationMs: input.durationMs ?? null,
    diagnostic: { stage: "VAL_ENGINE", code: "STRUCTURAL_FIDELITY_OBSERVED" },
    technicalMetadata: {
      boundedStatus: input.entry.boundedStatus,
      scientificQualificationClaimed: false,
      repairAuthorized: false,
    },
  });
  trace.append({
    eventType: "RESULT_PERSISTED",
    timestamp: input.entry.retainedAt,
    owner: "VAL",
    engine: input.ledgerContract,
    engineVersion: input.ledgerVersion,
    inputOwnerResultRefs: [...ownerRefs, validationRunRef(input.entry)],
    outputResultRef: validationRunLedgerEntryRef(input.entry, input.ledgerVersion),
    status: "VALIDATION_RUN_RETAINED",
    diagnostic: { stage: "OWNER_RESULT_PERSISTENCE", code: "VALIDATION_LEDGER_ENTRY_APPENDED" },
    technicalMetadata: {
      ledgerContract: input.ledgerContract,
      ledgerVersion: input.ledgerVersion,
      validationEntryId: input.entry.entryId,
      validationEntryDigest: input.entry.entryDigest,
      callerRef: input.entry.callerRef,
    },
  });
};

export const createScientificRunTraceRecorder = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  projectSnapshot: Readonly<ProjectContextSnapshot>;
  initiatorContext: ScientificRunBinding["initiatorContext"];
  startedAt: string;
  createdAt?: string;
}): ScientificRunTraceRecorder => {
  let current = startScientificRun(input).ledger;
  const recorder: ScientificRunTraceRecorder = {
    runId: input.runId,
    append: (eventInput) => {
      const appended = appendScientificExecutionTraceEvent({ ledger: current, runId: input.runId, event: eventInput });
      current = appended.ledger;
      return appended.event;
    },
    complete: (completedAt) => {
      const finalized = finalizeScientificRun({ ledger: current, runId: input.runId, completedAt, status: "COMPLETED" });
      current = finalized.ledger;
      return finalized.run;
    },
    fail: (completedAt, errorCode, stage = "UNKNOWN_STAGE") => {
      const finalized = finalizeScientificRun({ ledger: current, runId: input.runId, completedAt, status: "FAILED", errorCode, stage });
      current = finalized.ledger;
      return finalized.run;
    },
    getLedger: () => current,
    getRun: () => getScientificRun({ ledger: current, runId: input.runId }),
  };
  return Object.freeze(recorder);
};

export type ScientificReplayPlan = {
  contract: "SCIENTIFIC_TRACE_REPLAY_PLAN";
  status: "REPLAY_PLANNABLE" | "PARTIALLY_PLANNABLE" | "NOT_PLANNABLE";
  runId: string;
  fromEventId: string;
  project: ScientificRunProjectBinding;
  eventsToReuse: readonly string[];
  eventsToRecompute: readonly string[];
  requiredRequestRefs: readonly ScientificTraceRequestReference[];
  requiredOwnerResultRefs: readonly ScientificTraceArtifactReference[];
  requiredValidationRunRefs: readonly ScientificTraceArtifactReference[];
  missingComponents: readonly string[];
  executionAuthorized: false;
};

export const buildReplayPlan = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
  fromEventId: string;
}): Readonly<ScientificReplayPlan> => {
  const events = listScientificRunEvents({ ledger: input.ledger, runId: input.runId });
  const fromIndex = events.findIndex((event) => event.eventId === input.fromEventId);
  if (fromIndex < 0) throw new Error("SCIENTIFIC_TRACE_REPLAY_EVENT_NOT_IN_RUN");
  const run = getScientificRun({ ledger: input.ledger, runId: input.runId });
  const downstream = events.slice(fromIndex);
  const requiredRequestRefs = downstream.flatMap((event) => event.requestRef ? [event.requestRef] : []);
  const requiredOwnerResultRefs = downstream.flatMap((event) => [
    ...event.inputOwnerResultRefs.filter((ref) => ref.artifactType === "OWNER_RESULT"),
    ...(event.outputResultRef?.artifactType === "OWNER_RESULT" ? [event.outputResultRef] : []),
  ]);
  const requiredValidationRunRefs = downstream.flatMap((event) => [
    ...event.inputOwnerResultRefs.filter((ref) => ref.artifactType === "VALIDATION_RUN"),
    ...(event.outputResultRef?.artifactType === "VALIDATION_RUN" ? [event.outputResultRef] : []),
  ]);
  const missingComponents = unique([
    ...(downstream.some((event) => ["OWNER_INVOCATION_STARTED", "OWNER_INVOCATION_COMPLETED", "OWNER_INVOCATION_FAILED"].includes(event.eventType) && !event.requestRef)
      ? ["REQUEST_REFERENCE"] : []),
    ...(downstream.some((event) => event.eventType === "OWNER_INVOCATION_FAILED" && !event.outputResultRef)
      ? ["FAILED_OWNER_RESULT_ARTIFACT"] : []),
    ...(run.status === "RUNNING" ? ["FINALIZED_RUN"] : []),
  ]);
  const status = missingComponents.length === 0 ? "REPLAY_PLANNABLE" : requiredRequestRefs.length || requiredOwnerResultRefs.length
    ? "PARTIALLY_PLANNABLE"
    : "NOT_PLANNABLE";
  return deepFreeze({
    contract: "SCIENTIFIC_TRACE_REPLAY_PLAN",
    status,
    runId: input.runId,
    fromEventId: input.fromEventId,
    project: clone(run.project),
    eventsToReuse: events.slice(0, fromIndex).map((event) => event.eventId),
    eventsToRecompute: downstream.map((event) => event.eventId),
    requiredRequestRefs: unique(requiredRequestRefs.map((ref) => JSON.stringify(ref))).map((value) => JSON.parse(value) as ScientificTraceRequestReference),
    requiredOwnerResultRefs: unique(requiredOwnerResultRefs.map((ref) => JSON.stringify(ref))).map((value) => JSON.parse(value) as ScientificTraceArtifactReference),
    requiredValidationRunRefs: unique(requiredValidationRunRefs.map((ref) => JSON.stringify(ref))).map((value) => JSON.parse(value) as ScientificTraceArtifactReference),
    missingComponents,
    executionAuthorized: false as const,
  });
};

const stageForEvent = (event: Readonly<ScientificExecutionTraceEvent>): FirstDivergentStage => {
  if (event.diagnostic?.stage) return event.diagnostic.stage;
  if (event.eventType === "STALE_RESULT_REJECTED") return "STALE_VALIDATION";
  if (event.eventType === "RESULT_PERSISTED") return "OWNER_RESULT_PERSISTENCE";
  return ownerStage(event.owner);
};

export type ScientificRunComparison = {
  contract: "SCIENTIFIC_TRACE_RUN_COMPARISON";
  leftRunId: string;
  rightRunId: string;
  equivalent: boolean;
  comparedEventCount: number;
  firstDivergentStage: FirstDivergentStage | null;
  leftEventId: string | null;
  rightEventId: string | null;
  divergentFields: readonly string[];
  scientificJudgmentPerformed: false;
};

export const compareScientificRuns = (input: {
  leftLedger: Readonly<ScientificExecutionTraceLedger>;
  leftRunId: string;
  rightLedger: Readonly<ScientificExecutionTraceLedger>;
  rightRunId: string;
}): Readonly<ScientificRunComparison> => {
  const left = listScientificRunEvents({ ledger: input.leftLedger, runId: input.leftRunId });
  const right = listScientificRunEvents({ ledger: input.rightLedger, runId: input.rightRunId });
  const count = Math.max(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    const leftEvent = left[index] ?? null;
    const rightEvent = right[index] ?? null;
    if (leftEvent?.logicalDigest !== rightEvent?.logicalDigest) {
      const fields = unique([
        ...(!leftEvent || !rightEvent ? ["EVENT_PRESENCE"] : []),
        ...(leftEvent?.eventType !== rightEvent?.eventType ? ["EVENT_TYPE"] : []),
        ...(leftEvent?.owner !== rightEvent?.owner ? ["OWNER"] : []),
        ...(leftEvent?.requestRef?.requestDigest !== rightEvent?.requestRef?.requestDigest ? ["REQUEST_DIGEST"] : []),
        ...(leftEvent?.outputResultRef?.artifactDigest !== rightEvent?.outputResultRef?.artifactDigest ? ["OUTPUT_DIGEST"] : []),
        ...(leftEvent?.status !== rightEvent?.status ? ["STATUS"] : []),
        ...((leftEvent?.dependencyRefs ?? []).map((ref) => ref.resultDigest).join("|") !== (rightEvent?.dependencyRefs ?? []).map((ref) => ref.resultDigest).join("|") ? ["DEPENDENCY_DIGESTS"] : []),
      ]);
      return deepFreeze({
        contract: "SCIENTIFIC_TRACE_RUN_COMPARISON",
        leftRunId: input.leftRunId,
        rightRunId: input.rightRunId,
        equivalent: false,
        comparedEventCount: index + 1,
        firstDivergentStage: stageForEvent(leftEvent ?? rightEvent!),
        leftEventId: leftEvent?.eventId ?? null,
        rightEventId: rightEvent?.eventId ?? null,
        divergentFields: fields.length ? fields : ["OBSERVABLE_EVENT_STRUCTURE"],
        scientificJudgmentPerformed: false as const,
      });
    }
  }
  return deepFreeze({
    contract: "SCIENTIFIC_TRACE_RUN_COMPARISON",
    leftRunId: input.leftRunId,
    rightRunId: input.rightRunId,
    equivalent: true,
    comparedEventCount: count,
    firstDivergentStage: null,
    leftEventId: null,
    rightEventId: null,
    divergentFields: [],
    scientificJudgmentPerformed: false as const,
  });
};

export const locateFirstObservableDivergence = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  runId: string;
}) => {
  const events = listScientificRunEvents(input);
  const event = events.find((candidate) => candidate.eventType === "HANDOFF_REJECTED"
    || candidate.eventType === "OWNER_INVOCATION_FAILED"
    || candidate.eventType === "STALE_RESULT_REJECTED"
    || candidate.eventType === "RUN_FAILED") ?? null;
  return deepFreeze({
    readiness: event ? "ATTRIBUTED_FROM_OBSERVABLE_EVENT" as const : "NO_DIVERGENCE_OBSERVED" as const,
    stage: event ? stageForEvent(event) : null,
    eventId: event?.eventId ?? null,
    diagnosticCode: event?.diagnostic?.code ?? null,
    inferenceBeyondObservedStage: false as const,
  });
};
