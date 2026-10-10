import { logicalDigest } from "../../knowledge-engine/canonical";
import { buildProjectContextSnapshot } from "../../research-project-construction/canonical-project-backbone";
import { appendProductTraceStage, createProductTraceRunId, startScientificRun,
  type ScientificProductTraceStage, type ScientificTraceCaptureConfiguration, type ScientificTraceOwner } from "../scientific-execution-trace";
import { readStudioAssessmentFailureDiagnostic } from "../../scientific-thinking/studio-runtime";
import { readStudioEditFailureDiagnostic } from "../../document-projection/studio-edit-proposal";
import type { FunctionalResetSession } from "./session";
import type { DocumentArchiveClient } from "../../document-projection/generation-archive-client";
import { readDurableProviderFailureDiagnostic } from "../provider-call-observability";

/** References-only projection into the existing TRACE ledger. Never an owner
 * result, execution engine, provider wrapper or second persistence system. */
export type DocumentWorkflowTraceObservation = Readonly<{
  operationRef: string;
  component: string;
  owner: ScientificTraceOwner;
  stage: ScientificProductTraceStage;
  status: "STARTED" | "COMPLETED" | "FAILED" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  deduplicate?: boolean;
  identity?: Readonly<{
    workingRevisionId?: string; saveSequence?: number; contentDigest?: string; logicalDocumentRef?: string;
    generationId?: string; displayVersion?: number; baseGenerationBodyDigest?: string;
    finalizationIntentId?: string; intentSequence?: number; intentStatus?: string; recoveryState?: string;
    requestDigest?: string; proposalId?: string; nodeId?: string; assessmentRef?: string;
    assessmentClassification?: string; providerOperationId?: string;
    assessmentRequestRef?: string;
    coverage?: string; itemCount?: number; affectedCount?: number;
    generationProjectVersion?: string; generationProjectDigest?: string;
    templateInstanceRef?: string; templateDefinitionRef?: string; projectionDigest?: string;
    regulatoryResolutionRef?: string; regulatoryCorpusDigest?: string;
    frozenProjectVersion?: string; frozenProjectDigest?: string; resolvedProjectVersion?: string; resolvedProjectDigest?: string;
  }>;
  error?: unknown;
}>;
export type DocumentWorkflowTraceSink = (observation: DocumentWorkflowTraceObservation) => void;

/** Trace failures must not change either a result, a thrown native error, or
 * the number of executions. No logging of error.message/stack/payload here. */
export const emitDocumentWorkflowTrace = (sink: DocumentWorkflowTraceSink | undefined, observation: DocumentWorkflowTraceObservation) => {
  try { sink?.(observation); } catch { /* Existing passive observability rule. */ }
};

const code = (value: unknown) => typeof value === "string" && /^[A-Z][A-Z0-9_]{0,119}$/u.test(value) ? value : "UNKNOWN";
const nativeMessageCode = (error: unknown) => error instanceof Error
  && /^(?:(?:DOC|STUDIO|PROJECT|SCIENTIFIC|WORKING|CONVERSATION|PROVIDER|PUBLIC|CANARY|PAYLOAD|REQUEST|BRIDGE|HTTP)_[A-Z0-9_]+|INPUT_TOKEN_DIVERGENCE|QUALIFICATION_INVALID)$/u.test(error.message)
  ? code(error.message) : "UNKNOWN";
const ref = (value: unknown) => typeof value === "string" && value.length <= 600 && /^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/u.test(value)
  && !/(?:bearer|authorization|password|secret|api[_-]?key|sk-)/iu.test(value) ? value : "UNKNOWN";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

export const documentWorkflowFailure = (error: unknown, owner: ScientificTraceOwner, component: string) => {
  try {
  const value = object(error);
  const diagnostic = readStudioAssessmentFailureDiagnostic(value.studioAssessmentFailureDiagnostic)
    ?? readStudioEditFailureDiagnostic(value.studioEditFailureDiagnostic);
  const calls = object(value.observability).providerCalls;
  const durable = readDurableProviderFailureDiagnostic(error) ?? (Array.isArray(calls)
    ? calls.map(readDurableProviderFailureDiagnostic).find(item => item !== null) ?? null : null);
  const nativeCode = (diagnostic?.code !== "STUDIO_EDIT_FAILED" ? diagnostic?.code : null)
    ?? durable?.structuredErrorCode ?? code(value.preparationFailureCode ?? value.code ?? nativeMessageCode(error));
  return { owner: diagnostic?.owner ?? owner, function: diagnostic?.function ?? component,
    code: code(nativeCode), attribution: diagnostic && diagnostic.code !== "STUDIO_EDIT_FAILED" ? "ROOT_CAUSE_PROVEN" : "OBSERVED_BOUNDARY_ONLY", durable };
  } catch {
    // Even malformed diagnostic accessors cannot replace the native exception.
    return { owner, function: component, code: "UNKNOWN", attribution: "OBSERVED_BOUNDARY_ONLY", durable: null };
  }
};

/** Does not inspect scientific text. Explicit scalars only, even if a producer
 * mistakenly supplies extra properties or an error containing private prose. */
export const recordDocumentWorkflowTrace = (session: FunctionalResetSession, observation: DocumentWorkflowTraceObservation,
  captureConfiguration?: ScientificTraceCaptureConfiguration, timestamp = new Date().toISOString()): FunctionalResetSession => {
  if (!session.project) return session; // Missing scientific identity is not invented.
  if (observation.status === "STARTED" && (!captureConfiguration || captureConfiguration.captureLevel === "LEVEL_1_CORE")) return session;
  const operationRef = ref(observation.operationRef), component = ref(observation.component);
  if (operationRef === "UNKNOWN" || component === "UNKNOWN") return session;
  const traceRunId = createProductTraceRunId(session.sessionId, operationRef);
  const native = observation.identity ?? {};
  const metadata: Record<string, string | number | boolean | null> = { operationRef, observationStatus: observation.status };
  for (const key of ["workingRevisionId", "contentDigest", "logicalDocumentRef", "generationId", "baseGenerationBodyDigest",
    "finalizationIntentId", "intentStatus", "recoveryState", "requestDigest", "proposalId", "nodeId", "assessmentRef",
    "assessmentClassification", "assessmentRequestRef", "providerOperationId", "coverage", "generationProjectVersion", "generationProjectDigest",
    "templateInstanceRef", "templateDefinitionRef", "projectionDigest", "regulatoryResolutionRef", "regulatoryCorpusDigest",
    "frozenProjectVersion", "frozenProjectDigest", "resolvedProjectVersion", "resolvedProjectDigest"] as const) {
    if (native[key] !== undefined) metadata[key] = ref(native[key]);
  }
  for (const key of ["saveSequence", "displayVersion", "intentSequence", "itemCount", "affectedCount"] as const) {
    if (Number.isSafeInteger(native[key]) && native[key]! >= 0) metadata[key] = native[key]!;
  }
  const failure = observation.status === "FAILED" ? documentWorkflowFailure(observation.error, observation.owner, component) : null;
  if (failure) Object.assign(metadata, { firstFailedStage: observation.stage, firstFailedOwner: failure.owner,
    failureFunction: ref(failure.function), failureInvariant: "UNKNOWN", internalErrorCode: failure.code,
    publicErrorCode: "UNKNOWN", attributionConfidence: failure.attribution });
  if (failure?.durable) Object.assign(metadata, { providerOperationId: failure.durable.operationKey ?? "UNKNOWN",
    providerHttpStatus: failure.durable.providerHttpStatus, providerResponseStatus: failure.durable.providerResponseStatus,
    dispatchAttempted: failure.durable.dispatchAttempted, lastConfirmedDurableState: failure.durable.lastConfirmedDurableState });
  let ledger = session.scientificExecutionTraceLedger;
  // Repeated pure projections/recovery of the same immutable state do not add
  // unbounded render noise. Different saves/outcomes/native codes still append.
  const observationDigest = logicalDigest({ component, stage: observation.stage, metadata });
  if (observation.deduplicate && ledger.events.some(event => event.runId === traceRunId && event.technicalMetadata.entryDigest === observationDigest)) return session;
  if (!ledger.runBindings.some(binding => binding.runId === traceRunId)) ledger = startScientificRun({ ledger, runId: traceRunId,
    projectSnapshot: buildProjectContextSnapshot({ project: session.project }),
    initiatorContext: { kind: "EXPLICIT_PRODUCT_CALL", initiatorRef: operationRef }, startedAt: timestamp, captureConfiguration }).ledger;
  const reference = { ref: operationRef, version: "UNKNOWN", digest: ref(native.requestDigest ?? native.contentDigest) };
  ledger = appendProductTraceStage({ ledger, traceRunId, timestamp, status: observation.status,
    owner: failure?.owner ?? observation.owner, technicalMetadata: { ...metadata, entryDigest: observationDigest },
    error: failure ? { category: "UNKNOWN", code: failure.code } : null,
    envelope: { stage: failure ? "ERROR_BOUNDARY" : observation.stage,
      responsibilityOwner: failure?.owner ?? observation.owner, decisionOwner: "NONE", executor: component,
      componentId: component, input: [reference], output: observation.status === "STARTED" ? [] : [reference],
      project: { projectId: session.project.projectId, projectVersion: session.project.versionId,
        projectDigest: session.project.projectDigest, snapshotRef: session.project.projectDigest },
      ownerRunId: operationRef, artifactId: ref(native.generationId ?? native.workingRevisionId ?? native.proposalId),
      reasonCode: failure?.code ?? `DOCUMENT_WORKFLOW_${observation.status}`, completedAt: timestamp,
    } }).ledger;
  return { ...session, scientificExecutionTraceLedger: ledger };
};

/** Observe a real execution exactly once. The callback receives the native
 * return value only after its existing validation; no reconstruction/repair. */
export const observeDocumentWorkflow = async <T>(sink: DocumentWorkflowTraceSink | undefined,
  observation: Omit<DocumentWorkflowTraceObservation, "status" | "error">, execute: () => Promise<T>,
  resultIdentity?: (result: T) => DocumentWorkflowTraceObservation["identity"]): Promise<T> => {
  emitDocumentWorkflowTrace(sink, { ...observation, status: "STARTED" });
  try {
    const result = await execute();
    try {
      const identity = { ...observation.identity, ...resultIdentity?.(result) };
      emitDocumentWorkflowTrace(sink, { ...observation, operationRef: identity.finalizationIntentId ?? observation.operationRef, identity, status: "COMPLETED" });
    }
    catch { /* Projection errors cannot reject a native success. */ }
    return result;
  } catch (error) {
    // Native control-flow signals are not a causal execution failure. The
    // existing coordinator still owns dispatch/retry/arbitration, unchanged.
    const control = ["STUDIO_DOCUMENT_PROVIDER_REQUIRED", "STUDIO_DOCUMENT_PROVIDER_FAILED", "STUDIO_INTENT_PREPARATION_IN_PROGRESS"]
      .includes(documentWorkflowFailure(error, observation.owner, observation.component).code);
    emitDocumentWorkflowTrace(sink, { ...observation, status: control ? "BLOCKED" : "FAILED", error }); throw error;
  }
};

const resultIdentity = (result: unknown): DocumentWorkflowTraceObservation["identity"] => {
  const record = object(result), revision = object(record.revision), receipt = object(record.receipt ?? object(record.resolution).documentReceipt),
    generation = object(record.generation ?? record.ref ?? receipt.generation), frozen = object(record.frozen), project = object(generation.project),
    frozenProject = object(frozen.sourceProject), resolved = object(object(record.resolution).resolvedProject);
  const scalar = (value: unknown) => typeof value === "string" ? value : undefined;
  const number = (value: unknown) => typeof value === "number" ? value : undefined;
  return {
    workingRevisionId: scalar(revision.revisionId ?? frozen.workingRevisionId), saveSequence: number(revision.saveSequence ?? frozen.workingRevisionSaveSequence),
    contentDigest: scalar(revision.contentDigest ?? frozen.workingRevisionContentDigest), logicalDocumentRef: scalar(revision.logicalDocumentRef ?? frozen.logicalDocumentRef),
    generationId: scalar(generation.generationId ?? frozen.baseGenerationId ?? revision.baseGenerationId), displayVersion: number(generation.displayVersion),
    baseGenerationBodyDigest: scalar(revision.baseGenerationBodyDigest ?? frozen.baseGenerationBodyDigest),
    generationProjectVersion: scalar(project.projectVersion), generationProjectDigest: scalar(project.projectDigest),
    frozenProjectVersion: scalar(frozenProject.projectVersion), frozenProjectDigest: scalar(frozenProject.projectDigest),
    resolvedProjectVersion: scalar(resolved.projectVersion), resolvedProjectDigest: scalar(resolved.projectDigest),
    finalizationIntentId: scalar(record.finalizationIntentId), intentSequence: number(record.sequence),
    intentStatus: record.finalizationIntentId ? scalar(record.state) : undefined,
    recoveryState: record.finalizationIntentId ? undefined : scalar(record.state),
    itemCount: Array.isArray(record.entries) ? record.entries.length : Array.isArray(result) ? result.length : undefined,
  };
};

/** Instrument the existing validated client ports, not their raw transport.
 * Arguments, result identities, errors and execution counts retained. */
export const traceDocumentArchiveClient = (client: DocumentArchiveClient, projectRef: string,
  sink: DocumentWorkflowTraceSink | undefined): DocumentArchiveClient => {
  if (!sink) return client;
  const wrap = <T extends object>(ports: T, prefix: string): T => Object.fromEntries(Object.entries(ports).map(([method, execute]) => {
    if (typeof execute !== "function") return [method, execute];
    return [method, (...args: unknown[]) => {
      let observation: Omit<DocumentWorkflowTraceObservation, "status" | "error"> | undefined;
      // Project only before execution. A projection exception cannot retry a
      // native operation: both paths converge on one execution below.
      try {
      const input = object(args[0]);
      const operationRef = String(input.finalizationIntentId ?? input.intentId ?? input.requestId ?? input.revisionId ?? input.workingRevisionId
        ?? (typeof args[0] === "string" ? args[0] : input.baseGenerationId ?? projectRef));
      const recoveringRevisionIntent = prefix === "StudioFinalizationIntent" && method === "recoverActive";
      const recoveringBaseIntent = prefix === "StudioFinalizationIntent" && method === "recoverForBase";
      const identity = { workingRevisionId: typeof input.revisionId === "string" ? input.revisionId
          : recoveringRevisionIntent && typeof args[0] === "string" ? args[0] : undefined,
        saveSequence: typeof input.expectedSaveSequence === "number" ? input.expectedSaveSequence : typeof input.saveSequence === "number" ? input.saveSequence : undefined,
        logicalDocumentRef: typeof input.logicalDocumentRef === "string" ? input.logicalDocumentRef : undefined,
        contentDigest: typeof input.contentDigest === "string" ? input.contentDigest : undefined,
        generationId: typeof input.baseGenerationId === "string" ? input.baseGenerationId
          : recoveringBaseIntent && typeof args[0] === "string" ? args[0] : undefined,
        finalizationIntentId: prefix === "StudioFinalizationIntent" && !recoveringRevisionIntent && !recoveringBaseIntent && typeof args[0] === "string" ? args[0] : undefined };
      // Frozen input is already the native owner's exact intent identity. Do
      // not synthesize it here; the returned native ID links later phases.
      observation = { operationRef, component: `${prefix}.${method}`, owner: "DOC",
        stage: /recover|get|body|history|active|read/u.test(method) ? "DURABLE_RECOVERY_COMPLETED" : "DOC_PROJECTION", identity };
      } catch { /* Passive projection unavailable; no native operation has run. */ }
      return observation ? observeDocumentWorkflow(sink, observation, () => execute(...args), resultIdentity) : execute(...args);
    }];
  })) as T;
  return { ...wrap(client, "DocumentArchive"),
    ...(client.workingRevisions ? { workingRevisions: wrap(client.workingRevisions, "DocumentWorkingRevision") } : {}),
    ...(client.finalizationIntents ? { finalizationIntents: wrap(client.finalizationIntents, "StudioFinalizationIntent") } : {}) };
};
