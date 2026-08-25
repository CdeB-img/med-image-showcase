/* eslint-disable @typescript-eslint/no-explicit-any -- frozen characterization runner crosses typed owner ledgers */
import { logicalDigest } from "@/features/knowledge-engine";
import {
  executeScientificThinkingEngine,
  SCIENTIFIC_THINKING_ENGINE_VERSION,
  type ScientificThinkingInput,
  type ScientificThinkingOutput,
} from "@/features/scientific-thinking";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ProjectContextSnapshot, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { evaluateCampaignCase, type EvaluationCaseR2, type EvaluationEnvelopeR2 } from "./evaluator";
import {
  deriveExecutionOutcome,
  type QualificationTraceR2,
  type TerminalTraceStage,
} from "./contracts";

export type FrozenCampaignInput = {
  sourceCase: string;
  digest: string;
  frozen: true;
  payload: {
    project: ResearchProjectOwnerProjection;
    projectSnapshot: ProjectContextSnapshot;
    ledger: unknown;
    knowledgeResultId: string;
    knowledgeResultRef: string;
    knowledgeResultDigest: string;
  };
};

const terminalStageFor = (
  error: string | null,
  ownerInvocationCount: number,
): TerminalTraceStage | null => {
  if (!error) return null;
  if (ownerInvocationCount > 0) return "SCIENTIFIC_THINKING_ENGINE";
  if (error.includes("PROJECT_SNAPSHOT") || error.includes("PROJECT_BINDING")) return "PROJECT_CONTEXT";
  if (error.includes("STALE")) return "STALE_VALIDATION";
  if (error.includes("DEPENDENCY") || error.includes("LEDGER") || error.includes("NOT_FOUND")) return "OWNER_REQUEST_VALIDATION";
  if (error.includes("HARNESS")) return "CHARACTERIZATION_HARNESS";
  return "KNOWLEDGE_TO_ST_HANDOFF";
};

const coreStageFor = (stage: TerminalTraceStage | null) => {
  if (stage === "OWNER_REQUEST_VALIDATION") return "OWNER_REQUEST_BUILDING" as const;
  if (stage === "CHARACTERIZATION_HARNESS") return "UNKNOWN_STAGE" as const;
  return stage ?? "UNKNOWN_STAGE";
};

export const runFrozenScientificThinkingCase = (input: {
  campaignId: string;
  caseItem: EvaluationCaseR2 & { purpose: string; replayPredeclared: boolean };
  envelope: EvaluationEnvelopeR2;
  pack: FrozenCampaignInput;
  startedAt: string;
  completedAt: string;
  replay: boolean;
  frozenInputValid: boolean;
  runtime?: (request: ScientificThinkingInput) => ScientificThinkingOutput;
}) => {
  const executionKind = input.replay ? "PREDECLARED_REPLAY" as const : "QUALIFYING_PRIMARY" as const;
  const runId = `scientific-run:${input.campaignId}:${input.caseItem.caseId}:${input.replay ? "replay" : "primary"}`;
  const traceRecorder = createScientificRunTraceRecorder({
    ledger: createScientificExecutionTraceLedger(`session:${input.campaignId}:${input.caseItem.caseId}:${input.replay ? "replay" : "primary"}`),
    runId,
    projectSnapshot: input.pack.payload.projectSnapshot,
    initiatorContext: {
      kind: input.replay ? "REPLAY_ANALYSIS" : "TEST_HARNESS",
      initiatorRef: `${input.campaignId}:${input.caseItem.caseId}:${input.replay ? "replay" : "primary"}`,
    },
    startedAt: input.startedAt,
    createdAt: input.startedAt,
  });
  let invocation: any | null = null;
  let error: string | null = null;
  let ownerInvocationCount = 0;
  let startedOwnerRequest: ScientificThinkingInput | null = null;
  const observedRuntime = input.runtime ?? executeScientificThinkingEngine;
  const instrumentedRuntime = (request: ScientificThinkingInput) => {
    ownerInvocationCount += 1;
    startedOwnerRequest = structuredClone(request);
    return observedRuntime(request);
  };
  try {
    invocation = invokeScientificThinkingForProject({
      project: structuredClone(input.pack.payload.project),
      projectSnapshot: structuredClone(input.pack.payload.projectSnapshot),
      knowledgeResultId: input.pack.payload.knowledgeResultId,
      ledger: rehydrateProductOwnerResultLedger(input.pack.payload.ledger as any),
      callerRef: `${input.campaignId}:${input.caseItem.caseId}:${input.replay ? "replay" : "primary"}`,
      purpose: input.caseItem.purpose,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      retainedAt: input.completedAt,
      runtime: instrumentedRuntime,
      monotonicNow: () => 0,
      trace: traceRecorder,
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "UNKNOWN_ERROR";
  }
  if (!error && invocation?.result === null && invocation?.observation?.failureCode) {
    error = invocation.observation.failureCode;
  }
  const rejectionStage = terminalStageFor(error, ownerInvocationCount);
  const traceRun = error
    ? traceRecorder.fail(input.completedAt, error, coreStageFor(rejectionStage))
    : traceRecorder.complete(input.completedAt);
  const traceLedger = traceRecorder.getLedger();
  const traceEvents = listScientificRunEvents({ ledger: traceLedger, runId });
  const traceEventTypes = traceEvents.map((item) => item.eventType);
  const native = invocation?.result?.nativePayload ?? null;
  const request = invocation?.request?.nativeInput ?? startedOwnerRequest;
  const counts = {
    questions: native?.questions?.length ?? 0,
    hypotheses: native?.hypotheses?.length ?? 0,
    objectives: native?.objectives?.length ?? 0,
    mechanisms: native?.mechanisms?.length ?? 0,
    alternatives: native?.alternatives?.length ?? 0,
    scientificModels: native?.scientificModels?.length ?? 0,
  };
  const ownerResultCount = invocation?.result ? 1 : 0;
  const projectWrites = (invocation?.projectWrites ?? 0) as number;
  const executionOutcome = deriveExecutionOutcome({
    expectedExecutionMode: input.caseItem.expectedExecutionMode,
    expectedRejectionCodes: input.caseItem.expectedRejectionCodes,
    errorCode: error,
    rejectionStage,
    ownerInvocationCount,
    ownerResultCount,
    traceEventTypes,
    projectWrites,
    ownerResultMutations: 0,
    technicalAttributionKnown: rejectionStage !== "UNKNOWN_STAGE",
  });
  const replayRefs = input.replay
    ? [`scientific-run:${input.campaignId}:${input.caseItem.caseId}:primary`]
    : input.caseItem.replayPredeclared ? [`scientific-run:${input.campaignId}:${input.caseItem.caseId}:replay`] : [];
  const qualificationTrace: QualificationTraceR2 = {
    caseId: input.caseItem.caseId,
    project: {
      projectId: input.pack.payload.projectSnapshot.sourceProjectRef,
      projectVersion: input.pack.payload.projectSnapshot.sourceProjectVersion,
      projectDigest: input.pack.payload.projectSnapshot.sourceProjectDigest,
    },
    knowledgeResultRef: input.pack.payload.knowledgeResultRef,
    knowledgeResultDigest: input.pack.payload.knowledgeResultDigest,
    stRequestRef: request?.requestId ?? null,
    stRequestDigest: request ? logicalDigest(request) : null,
    stVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    stResultRef: invocation?.result ? `${invocation.result.resultId}@${invocation.result.resultVersion}` : null,
    stResultDigest: native?.outputDigest ?? null,
    status: executionOutcome.kind === "EXPECTED_PRE_OWNER_REJECTION"
      ? "REJECTED_BEFORE_OWNER_RUNTIME"
      : executionOutcome.kind === "OWNER_EXECUTION_FAILURE"
        ? "OWNER_EXECUTION_FAILED"
        : error ? "TECHNICAL_FAILURE" : native?.status ?? "UNKNOWN",
    candidateStructure: counts,
    gaps: [...(native?.knowledgeRequest?.gapCodes ?? []), ...(invocation?.result?.gaps ?? [])],
    limitations: [...(native?.limitations ?? []), ...(invocation?.result?.limitations ?? [])],
    contradictions: native?.contradictions ?? [],
    durationMs: Date.parse(input.completedAt) - Date.parse(input.startedAt),
    replayRefs,
    executionOutcome,
    rejectionCode: error,
    rejectionStage,
    ownerInvocationCount,
    ownerResultCount,
    traceEventTypes,
    privateReasoningStored: false,
  };
  const adjudication = evaluateCampaignCase({
    caseItem: input.caseItem,
    envelope: input.envelope,
    invocation,
    error,
    trace: qualificationTrace,
    frozenInputValid: input.frozenInputValid,
  });
  return {
    caseId: input.caseItem.caseId,
    executionKind,
    inputPackDigest: input.pack.digest,
    traceRunId: runId,
    traceEventRefs: traceEvents.map((item) => item.eventId),
    traceLedgerDigest: traceLedger.ledgerDigest,
    qualificationTrace,
    traceQualificationComplete: adjudication.traceGate.traceQualificationComplete,
    requestRef: qualificationTrace.stRequestRef,
    requestDigest: qualificationTrace.stRequestDigest,
    outputResultRef: qualificationTrace.stResultRef,
    outputDigest: qualificationTrace.stResultDigest,
    status: qualificationTrace.status,
    error,
    candidateCounts: counts,
    invocation,
    executionOutcome,
    evaluations: adjudication.evaluations,
    caseVerdict: adjudication.caseVerdict,
    failureClass: adjudication.failureClass,
    firstDivergentStage: adjudication.firstDivergentStage,
    ownerCharacterizationStatus: adjudication.ownerCharacterizationStatus,
    runtimeProviderCalls: 0 as const,
    projectWrites,
    ownerResultMutations: 0 as const,
    traceRun,
    traceEvents,
  };
};
