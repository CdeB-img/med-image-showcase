/** Passive adoption observations on the SAME immutable preparation TRACE run.
 * No scientific state, review scope, transaction or retry is owned here. */
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ResearchProjectAdoptionObservation, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { appendProductTraceStage, createProductTraceRunId,
  type ScientificExecutionTraceLedger, type ScientificProductTraceStage,
  type ScientificTraceTechnicalMetadata } from "../scientific-execution-trace";
import type { projectPreparationReview } from "./project-preparation-lifecycle";
import type { FunctionalResetSession } from "./session";

type Review = NonNullable<ReturnType<typeof projectPreparationReview>>;
type AdoptionStage = Extract<ScientificProductTraceStage, "HUMAN_CONFIRMATION_RECEIVED" | "HUMAN_DECISION_ENVELOPE_CREATED"
  | "PROJECT_APPLY_STARTED" | "PROJECT_VERSION_WRITE_STARTED" | "PROJECT_VERSION_WRITE_SUCCEEDED" | "PROJECT_VERSION_WRITE_FAILED">;
const reference = (value: string | null | undefined) => value && /^[a-zA-Z0-9_.:@/-]{1,512}$/.test(value) ? value : "UNKNOWN";
const identifier = (value: string) => /^[A-Za-z_$][A-Za-z0-9_.$]{0,127}$/.test(value) ? value : "UNKNOWN";
const errorCode = (error: unknown) => error instanceof Error && /^[A-Z][A-Z0-9_.:@/-]{1,255}$/.test(error.message)
  ? error.message : "UNKNOWN";
export const sanitizedAdoptionStackTop = (error: unknown): string => {
  if (!(error instanceof Error)) return "UNKNOWN";
  // Extract only identifiers/location numbers. Never retain an error message,
  // full URL, query string, source path or the rest of the stack.
  const frame = error.stack?.split("\n").find(line => /^\s*at\s/.test(line));
  const fn = frame?.match(/^\s*at\s+([A-Za-z_$][\w.$]{0,127})(?:\s|\()/)?.[1];
  const location = frame?.match(/\/([A-Za-z0-9_-]{1,80}\.(?:tsx?|jsx?)):(\d+):(\d+)\)?$/);
  return [fn ? identifier(fn) : "UNKNOWN", ...(location ? [`${location[1]}:${location[2]}:${location[3]}`] : [])].join("@");
};

export const createProjectAdoptionTrace = (session: FunctionalResetSession, review: Review | null,
  selectedChangeRefs?: readonly string[]) => {
  let ledger = session.scientificExecutionTraceLedger;
  let stage: AdoptionStage = "HUMAN_CONFIRMATION_RECEIVED";
  let failureFunction = "confirmProject";
  let failureInvariant = "CURRENT_APPLICABLE_PREPARATION_REVIEW";
  let owner = "UI";
  let expected = review?.checkpoint.request.currentProject ?? session.project;
  let envelope: ScientificTraceTechnicalMetadata = {};
  let applyRecorded = false;
  let failed = false;
  const cp = review?.checkpoint;
  const runId = cp ? createProductTraceRunId(cp.sessionId, cp.request.observabilityContext?.turnId
    ?? cp.request.conversation.turns.filter(t => t.role === "USER").at(-1)?.turnId ?? cp.cutoffTurnId) : null;
  // Scope identity is a digest of the existing review, NOT a new review registry.
  let metadata: ScientificTraceTechnicalMetadata = {};
  try {
    const projection = review?.prepared.candidate.humanReviewProjection;
    metadata = {
      sessionId: reference(session.sessionId), clientPreparationId: reference(cp?.preparationId),
      reviewId: reference(projection?.sourceChangeSetRef), reviewDigest: projection ? logicalDigest(projection) : "UNKNOWN",
      humanAttemptId: `human-adoption-attempt:${crypto.randomUUID()}`,
      canonicalReviewDecisionCount: projection?.expectedChangeRefs.length ?? null,
      visibleChoiceCount: projection?.sections.flatMap(s => s.items)
        .filter(item => item.changeKind !== "RELATION" && item.objectType !== "UNCERTAINTY").length ?? null,
      coveredChangeRefCount: projection?.coveredChangeRefs.length ?? null,
      submittedChangeRefCount: selectedChangeRefs?.length ?? projection?.coveredChangeRefs.length ?? null,
    };
  } catch { /* An observation failure never changes the product path. */ }

  const append = (eventStage: ScientificProductTraceStage, status: "SUCCEEDED" | "STARTED" | "FAILED",
    actual: ResearchProjectOwnerProjection | null, error?: unknown, attributionOwner = owner) => {
    try {
      if (!runId || !ledger.runBindings.some(b => b.runId === runId)) return;
      const code = status === "FAILED" ? errorCode(error) : eventStage;
      const timestamp = new Date().toISOString();
      ledger = appendProductTraceStage({ ledger, traceRunId: runId, timestamp, status,
        owner: attributionOwner === "TRACE" ? "TRACE" : attributionOwner === "RESEARCH_PROJECT" ? "RESEARCH_PROJECT" : "UI",
        ...(status === "FAILED" ? { error: { category: "OWNER_RUNTIME", code } } : {}),
        technicalMetadata: { ...metadata, ...envelope,
          expectedProjectVersion: reference(expected?.versionId ?? "NONE"), actualProjectVersion: reference(actual?.versionId ?? "NONE"),
          expectedProjectDigest: reference(expected?.projectDigest ?? "NONE"), actualProjectDigest: reference(actual?.projectDigest ?? "NONE"),
          ...(status === "FAILED" ? { firstFailedStage: stage, firstFailedOwner: attributionOwner,
            failureFunction: identifier(failureFunction), failureInvariant: reference(failureInvariant),
            internalErrorCode: code, publicErrorCode: "PROJECT_CONFIRMATION_BOUNDARY_FAILED",
            sanitizedStackTop: sanitizedAdoptionStackTop(error) } : {}),
        },
        envelope: { stage: eventStage, turnId: cp!.request.observabilityContext?.turnId ?? "UNKNOWN",
          responsibilityOwner: attributionOwner, decisionOwner: "HUMAN", executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
          provider: "NONE", componentId: "PROJECT_ADOPTION_LIFECYCLE", componentVersion: "1.0.0",
          reasonCode: code, conversationId: session.conversationId,
          input: [{ ref: reference(cp!.preparationId), version: "1.0.0", digest: reference(cp!.inputDigest) }],
          ...(actual ? { project: { projectId: actual.projectId, projectVersion: actual.versionId,
            projectDigest: actual.projectDigest, snapshotRef: actual.projectDigest } } : {}),
        },
      }).ledger;
    } catch (error) {
      // One minimal observation on the existing ledger; no repair or retry of
      // the adoption/failed projection. Even this observation is non-vetoing.
      try {
        if (runId) ledger = appendProductTraceStage({ ledger, traceRunId: runId, timestamp: new Date().toISOString(),
          status: "FAILED", owner: "TRACE", error: { category: "OWNER_RUNTIME", code: errorCode(error) },
          technicalMetadata: { humanAttemptId: metadata.humanAttemptId ?? "UNKNOWN", clientPreparationId: reference(cp?.preparationId),
            firstFailedStage: eventStage, firstFailedOwner: "TRACE", failureFunction: "appendProductTraceStage",
            failureInvariant: "PASSIVE_TRACE_PROJECTION_VALID", internalErrorCode: errorCode(error),
            publicErrorCode: "PROJECT_ADOPTION_TRACE_PROJECTION_FAILED", sanitizedStackTop: sanitizedAdoptionStackTop(error) },
          envelope: { stage: "ERROR_BOUNDARY", responsibilityOwner: "TRACE", decisionOwner: "NOT_APPLICABLE",
            executor: "PROJECT_ADOPTION_LIFECYCLE", componentId: "PROJECT_ADOPTION_LIFECYCLE", provider: "NONE",
            reasonCode: "PROJECT_ADOPTION_TRACE_PROJECTION_FAILED", conversationId: session.conversationId },
        }).ledger;
      } catch { /* The same TRACE validator remains fail-closed for TRACE data. */ }
      // Fixed code only: the failing TRACE itself must not leak its input/error.
      console.warn("PROJECT_ADOPTION_LIFECYCLE_TRACE_PROJECTION_FAILED");
    }
  };
  return {
    ledger: (): Readonly<ScientificExecutionTraceLedger> => ledger,
    useLedger: (value: Readonly<ScientificExecutionTraceLedger>) => { ledger = value; },
    received: () => append("HUMAN_CONFIRMATION_RECEIVED", "SUCCEEDED", session.project),
    at: (next: AdoptionStage, fn: string, invariant: string, nextOwner = "RESEARCH_PROJECT") => {
      stage = next; failureFunction = fn; failureInvariant = invariant; owner = nextOwner;
    },
    observeOwner: (observation: ResearchProjectAdoptionObservation) => {
      stage = observation.stage; failureFunction = observation.failureFunction; failureInvariant = observation.failureInvariant; owner = "RESEARCH_PROJECT";
      if (observation.decision) {
        try { envelope = { humanDecisionEnvelopeId: reference(observation.decision.decisionId),
          humanDecisionEnvelopeDigest: logicalDigest(observation.decision) }; } catch { /* passive */ }
      }
      if (stage === "HUMAN_DECISION_ENVELOPE_CREATED" && observation.status === "SUCCEEDED") append(stage, "SUCCEEDED", session.project);
      if (stage === "PROJECT_APPLY_STARTED" && !applyRecorded) { applyRecorded = true; append(stage, "STARTED", session.project); }
    },
    writeStarted: (project: ResearchProjectOwnerProjection, actual: ResearchProjectOwnerProjection | null) => {
      stage = "PROJECT_VERSION_WRITE_STARTED"; failureFunction = "onSessionChange";
      failureInvariant = "PROJECT_VERSION_PERSISTED_WITHOUT_STALE_WRITE"; owner = "RESEARCH_PROJECT"; expected = project;
      append(stage, "STARTED", actual);
    },
    writeSucceeded: (project: ResearchProjectOwnerProjection) => append("PROJECT_VERSION_WRITE_SUCCEEDED", "SUCCEEDED", project),
    fail: (error: unknown, actual: ResearchProjectOwnerProjection | null) => {
      if (failed) return; failed = true;
      append(stage === "PROJECT_VERSION_WRITE_STARTED" ? "PROJECT_VERSION_WRITE_FAILED" : stage, "FAILED", actual, error);
    },
    projectionFailed: (error: unknown, actual: ResearchProjectOwnerProjection | null) => {
      const previous = { stage, failureFunction, failureInvariant, owner };
      stage = "PROJECT_APPLY_STARTED"; failureFunction = "recordProjectAdoptionTrace"; failureInvariant = "PASSIVE_TRACE_PROJECTION_VALID";
      append("ERROR_BOUNDARY", "FAILED", actual, error, "TRACE");
      ({ stage, failureFunction, failureInvariant, owner } = previous);
    },
  };
};
export type ProjectAdoptionTrace = ReturnType<typeof createProjectAdoptionTrace>;
