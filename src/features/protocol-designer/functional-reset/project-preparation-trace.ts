/** Passive projection of the existing preparation lifecycle into TRACE v2.
 * All scientific and financial state remains with its existing owner. */
import { appendProductTraceStage, createProductTraceRunId, startProductTraceRun,
  type ScientificProductTraceStage, type ScientificTraceOwner, type ScientificTraceTechnicalMetadata } from "../scientific-execution-trace.js";
import type { ProjectPreparationCheckpoint } from "./project-preparation-lifecycle.js";
import type { FunctionalResetSession } from "./session.js";

export type PreparationTraceStage = Extract<ScientificProductTraceStage,
  "CLIENT_PREPARATION_START" | "BRIDGE_REQUEST_CREATED" | "BRIDGE_RESPONSE_RECEIVED" | "CLIENT_RESPONSE_CONSUMED"
  | "DURABLE_RECOVERY_STARTED" | "DURABLE_RECOVERY_COMPLETED" | "ADMISSION_REJECTED"
  | "PROVIDER_RESPONSE_RECEIVED" | "WORKING_DRAFT_VALIDATION" | "PROJECT_DELTA_VALIDATION"
  | "REVIEW_PROJECTION_VALIDATION" | "READY_FOR_REVIEW">;

const stageOwner = (stage: PreparationTraceStage): { owner: ScientificTraceOwner; responsibilityOwner: string; executor: string } => {
  if (stage === "PROJECT_DELTA_VALIDATION" || stage === "REVIEW_PROJECTION_VALIDATION")
    return { owner: "RESEARCH_PROJECT", responsibilityOwner: "RESEARCH_PROJECT", executor: "PRJ001_CONTRIBUTION_OWNER" };
  if (stage === "PROVIDER_RESPONSE_RECEIVED")
    return { owner: "CONVERSATION_MODEL", responsibilityOwner: "PROVIDER_BOUNDARY", executor: "DURABLE_PROVIDER_OPERATION" };
  if (stage === "ADMISSION_REJECTED")
    return { owner: "CONVERSATION_MODEL", responsibilityOwner: "DURABLE_PROVIDER_BUDGET", executor: "DURABLE_PROVIDER_ADMISSION" };
  if (stage === "WORKING_DRAFT_VALIDATION" || stage === "READY_FOR_REVIEW")
    return { owner: "UI", responsibilityOwner: "WORKING_DRAFT", executor: "PROJECT_PREPARATION_LIFECYCLE" };
  return { owner: "UI", responsibilityOwner: "CLIENT_PREPARATION", executor: "PROJECT_PREPARATION_LIFECYCLE" };
};

export const recordProjectPreparationTrace = (session: FunctionalResetSession, checkpoint: ProjectPreparationCheckpoint,
  stage: PreparationTraceStage, status: "STARTED" | "SUCCEEDED" | "FAILED" | "UNKNOWN", options: {
    code: string;
    metadata?: ScientificTraceTechnicalMetadata;
    failureFunction?: string;
    failureInvariant?: string;
    publicCode?: string;
    attribution?: "ROOT_CAUSE_PROVEN" | "SYMPTOM_ONLY";
  }): FunctionalResetSession => {
  try {
    // The immutable checkpoint is the correlation authority; never derive an
    // independent preparation identity from rendered UI state.
    const sourceTurnId = checkpoint.request.observabilityContext?.turnId ?? checkpoint.request.conversation.turns
      .filter(turn => turn.role === "USER").at(-1)?.turnId ?? checkpoint.cutoffTurnId;
    const runId = createProductTraceRunId(checkpoint.sessionId, sourceTurnId);
    let ledger = session.scientificExecutionTraceLedger;
    if (!ledger.runBindings.some(binding => binding.runId === runId)) ledger = startProductTraceRun({
      ledger, traceRunId: runId, turnId: sourceTurnId,
      conversationId: checkpoint.request.conversation.conversationId,
      startedAt: checkpoint.capturedAt, sourceDigest: checkpoint.scientificSourceIdentity?.sourceDigest ?? checkpoint.inputDigest,
    }).ledger;
    const owner = stageOwner(stage);
    const project = checkpoint.request.currentProject;
    ledger = appendProductTraceStage({
      ledger, traceRunId: runId, timestamp: new Date().toISOString(), status,
      owner: owner.owner, durationMs: null,
      ...(status === "FAILED" ? { error: { category: "OWNER_RUNTIME", code: options.code } } : {}),
      technicalMetadata: {
        clientPreparationId: checkpoint.preparationId,
        ...(options.metadata ?? {}),
        ...(status === "FAILED" ? {
          internalErrorCode: options.code,
          publicErrorCode: options.publicCode ?? options.code,
          failureFunction: options.failureFunction ?? "UNKNOWN",
          failureInvariant: options.failureInvariant ?? "UNKNOWN",
          attributionConfidence: options.attribution ?? "SYMPTOM_ONLY",
        } : {}),
      },
      envelope: {
        stage, turnId: sourceTurnId, responsibilityOwner: owner.responsibilityOwner,
        decisionOwner: "NOT_APPLICABLE", executor: owner.executor, provider: "NONE",
        componentId: owner.executor, componentVersion: "1.0.0",
        input: [{ ref: checkpoint.preparationId, version: "1.0.0", digest: checkpoint.inputDigest }],
        reasonCode: options.code, conversationId: checkpoint.request.conversation.conversationId,
        ...(project ? { project: { projectId: project.projectId, projectVersion: project.versionId,
          projectDigest: project.projectDigest, snapshotRef: project.projectDigest } } : {}),
      },
    }).ledger;
    return { ...session, scientificExecutionTraceLedger: ledger };
  } catch {
    // TRACE must never determine a preparation outcome.
    return session;
  }
};
