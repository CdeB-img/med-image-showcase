/* eslint-disable @typescript-eslint/no-explicit-any -- frozen characterization runner crosses typed owner ledgers */
import { logicalDigest } from "@/features/knowledge-engine";
import { executeScientificThinkingEngine, SCIENTIFIC_THINKING_ENGINE_VERSION } from "@/features/scientific-thinking";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  createScientificExecutionTraceLedger,
  createScientificRunTraceRecorder,
  listScientificRunEvents,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ProjectContextSnapshot, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { evaluateCampaignCase, type EvaluationCase, type EvaluationEnvelope } from "./evaluator";
import type { QualificationTrace } from "./contracts";

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

export const runFrozenScientificThinkingCase = (input: {
  campaignId: string;
  caseItem: EvaluationCase & { purpose: string; replayPredeclared: boolean };
  envelope: EvaluationEnvelope;
  pack: FrozenCampaignInput;
  startedAt: string;
  completedAt: string;
  replay: boolean;
  frozenInputValid: boolean;
}) => {
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
      runtime: executeScientificThinkingEngine,
      monotonicNow: () => 0,
      trace: traceRecorder,
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "UNKNOWN_ERROR";
  }
  const traceRun = error
    ? traceRecorder.fail(input.completedAt, error, error.includes("STALE") ? "STALE_VALIDATION" : "UNKNOWN_STAGE")
    : traceRecorder.complete(input.completedAt);
  const traceLedger = traceRecorder.getLedger();
  const traceEvents = listScientificRunEvents({ ledger: traceLedger, runId });
  const native = invocation?.result?.nativePayload ?? null;
  const request = invocation?.request?.nativeInput ?? null;
  const counts = {
    questions: native?.questions?.length ?? 0,
    hypotheses: native?.hypotheses?.length ?? 0,
    objectives: native?.objectives?.length ?? 0,
    mechanisms: native?.mechanisms?.length ?? 0,
    alternatives: native?.alternatives?.length ?? 0,
    scientificModels: native?.scientificModels?.length ?? 0,
  };
  const noRequestRef = `NOT_CREATED:${error ?? "OWNER_RUNTIME_NOT_REACHED"}:ST_REQUEST`;
  const noResultRef = `NOT_CREATED:${error ?? "OWNER_RUNTIME_NOT_REACHED"}:ST_RESULT`;
  const replayRefs = input.replay
    ? [`scientific-run:${input.campaignId}:${input.caseItem.caseId}:primary`]
    : input.caseItem.replayPredeclared ? [`scientific-run:${input.campaignId}:${input.caseItem.caseId}:replay`] : [];
  const qualificationTrace: QualificationTrace = {
    caseId: input.caseItem.caseId,
    project: {
      projectId: input.pack.payload.projectSnapshot.sourceProjectRef,
      projectVersion: input.pack.payload.projectSnapshot.sourceProjectVersion,
      projectDigest: input.pack.payload.projectSnapshot.sourceProjectDigest,
    },
    knowledgeResultRef: input.pack.payload.knowledgeResultRef,
    knowledgeResultDigest: input.pack.payload.knowledgeResultDigest,
    stRequestRef: request?.requestId ?? noRequestRef,
    stRequestDigest: request ? logicalDigest(request) : logicalDigest(noRequestRef),
    stVersion: SCIENTIFIC_THINKING_ENGINE_VERSION,
    stResultRef: invocation?.result ? `${invocation.result.resultId}@${invocation.result.resultVersion}` : noResultRef,
    stResultDigest: native?.outputDigest ?? logicalDigest(noResultRef),
    status: error ? "FAILED" : native?.status ?? "UNKNOWN",
    candidateStructure: counts,
    gaps: [...(native?.knowledgeRequest?.gapCodes ?? []), ...(invocation?.result?.gaps ?? [])],
    limitations: [...(native?.limitations ?? []), ...(invocation?.result?.limitations ?? [])],
    contradictions: native?.contradictions ?? [],
    firstDivergentStage: error ? error.includes("STALE") ? "STALE_VALIDATION" : "UNKNOWN_STAGE" : null,
    durationMs: Date.parse(input.completedAt) - Date.parse(input.startedAt),
    replayRefs,
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
    executionKind: input.replay ? "PREDECLARED_REPLAY" as const : "QUALIFYING_PRIMARY" as const,
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
    evaluations: adjudication.evaluations,
    caseVerdict: adjudication.caseVerdict,
    firstDivergentStage: adjudication.firstDivergentStage,
    ownerCharacterizationStatus: adjudication.ownerCharacterizationStatus,
    runtimeProviderCalls: 0 as const,
    projectWrites: (invocation?.projectWrites ?? 0) as number,
    traceRun,
    traceEvents,
  };
};
