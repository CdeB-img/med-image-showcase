import { currentGovernedNavigationInput } from "@/features/query-navigation/current-navigation-evidence";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { createTurnId, resolveGovernedPostAdoptionReceipt, shouldMediatePostAdoptionQuery, type FunctionalResetSession } from "./session";
import { dispatchStudyDesignFromQuery, isStudyDesignQueryDispatch } from "./study-design-standard";
import { dispatchScientificThinkingFromQuery, isScientificThinkingQueryDispatch } from "./scientific-thinking-standard";
import { dispatchObservabilityFromQuery, isObservabilityQueryDispatch } from "./observability-standard";
import { dispatchImagingFromQuery, isImagingQueryDispatch } from "./imaging-standard";
import { dispatchBiostatisticsFromQuery, isBiostatisticsQueryDispatch } from "./biostatistics-standard";
import { dispatchCanonicalStudyDataFromQuery, isCanonicalStudyDataQueryDispatch } from "./canonical-study-data-standard";
import { dispatchDataManagementFromQuery, isDataManagementQueryDispatch } from "./data-management-standard";
import { dispatchKnowledgePrerequisiteFromQuery } from "./knowledge-standard";
import { isProductKnowledgePrerequisiteDispatch } from "@/features/query-navigation";
import { dispatchRegulatoryFromQuery, isRegulatoryQueryDispatch } from "./regulatory-standard";

// Execute only an already-selected, governed QRY continuation.
export type PostAdoptionContinuationJob = {
  sessionId: string;
  conversationId: string;
  project: NonNullable<FunctionalResetSession["project"]>;
  queryNavigation: NonNullable<FunctionalResetSession["queryNavigation"]>;
  ownerResultLedger: FunctionalResetSession["knowledgeOwnerLedger"];
  scientificExecutionTraceLedger: FunctionalResetSession["scientificExecutionTraceLedger"];
  runtimeTurns: ScientificInterpretationTurn[];
  feedback: string;
  traceRunId: string | null;
  previousScientificThinkingInteraction?: FunctionalResetSession["scientificThinkingInteraction"];
};

export const resolvePostAdoptionContinuationJob = async (
  job: PostAdoptionContinuationJob,
  onProviderCallRecords: (records: readonly ProviderCallRecord[]) => void,
) => {
  if (isProductKnowledgePrerequisiteDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchKnowledgePrerequisiteFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      startedAt: completedAt,
      completedAt,
    });
    if (dispatched.targetOwnerDispatchAuthorized && isObservabilityQueryDispatch(job.queryNavigation)) {
      const owner = dispatchObservabilityFromQuery({
        project: job.project,
        navigation: job.queryNavigation,
        ownerResultLedger: dispatched.ownerResultLedger,
        traceLedger: dispatched.traceLedger,
        sessionId: job.sessionId,
        conversationId: job.conversationId,
        presentationTurnRef: turnId,
        startedAt: completedAt,
        completedAt,
        knowledgeHandoff: dispatched.handoff,
      });
      const turn = { turnId, role: "NOXIA" as const, content: owner.presentation.plainText, createdAt: completedAt };
      return {
        kind: "OBSERVABILITY" as const,
        turn,
        content: turn.content,
        presentationSource: "OBS_STANDARD_PROJECTION" as const,
        mediationFailure: null,
        provider: "NONE",
        model: "OBSERVABILITY_MEASUREMENT_RUNTIME",
        latencyMs: 0,
        calls: 0,
        ...owner,
      };
    }
    if (dispatched.targetOwnerDispatchAuthorized && isRegulatoryQueryDispatch(job.queryNavigation)) {
      const owner = dispatchRegulatoryFromQuery({
        project: job.project,
        navigation: job.queryNavigation,
        ownerResultLedger: dispatched.ownerResultLedger,
        traceLedger: dispatched.traceLedger,
        sessionId: job.sessionId,
        conversationId: job.conversationId,
        startedAt: completedAt,
        completedAt,
        knowledgeHandoff: dispatched.handoff,
      });
      const turn = { turnId, role: "NOXIA" as const, content: owner.presentation.plainText, createdAt: completedAt };
      return {
        kind: "REGULATORY" as const,
        turn,
        content: turn.content,
        presentationSource: "REG_STANDARD_PROJECTION" as const,
        mediationFailure: null,
        provider: "NONE",
        model: "REG001_DETERMINISTIC_RUNTIME",
        latencyMs: 0,
        calls: 0,
        ...owner,
      };
    }
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "KNOWLEDGE" as const,
      turn,
      content: turn.content,
      presentationSource: "KNOWLEDGE_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "KNOWLEDGE_ENGINE_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isRegulatoryQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchRegulatoryFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "REGULATORY" as const,
      turn,
      content: turn.content,
      presentationSource: "REG_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "REG001_DETERMINISTIC_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isScientificThinkingQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchScientificThinkingFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
      previousInteraction: job.previousScientificThinkingInteraction,
    });
    const turn = {
      turnId,
      role: "NOXIA" as const,
      content: dispatched.presentation.plainText,
      createdAt: completedAt,
    };
    return {
      kind: "SCIENTIFIC_THINKING" as const,
      turn,
      content: turn.content,
      presentationSource: "ST_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "SCIENTIFIC_THINKING_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isObservabilityQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchObservabilityFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "OBSERVABILITY" as const,
      turn,
      content: turn.content,
      presentationSource: "OBS_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "OBSERVABILITY_MEASUREMENT_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isImagingQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchImagingFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "IMAGING" as const,
      turn,
      content: turn.content,
      presentationSource: "IMAGING_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "IMAGING_STUDY_DESIGNER_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isCanonicalStudyDataQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchCanonicalStudyDataFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "CDM" as const,
      turn,
      content: turn.content,
      presentationSource: "CDM_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "CANONICAL_STUDY_DATA_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isDataManagementQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchDataManagementFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "DATA_MANAGEMENT" as const,
      turn,
      content: turn.content,
      presentationSource: "DATA_MANAGEMENT_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "DATA_MANAGEMENT_REASONING_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isBiostatisticsQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchBiostatisticsFromQuery({
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = { turnId, role: "NOXIA" as const, content: dispatched.presentation.plainText, createdAt: completedAt };
    return {
      kind: "BIOSTATISTICS" as const,
      turn,
      content: turn.content,
      presentationSource: "BIOSTATISTICS_STANDARD_PROJECTION" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "BIOSTATISTICS_REASONING_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (isStudyDesignQueryDispatch(job.queryNavigation)) {
    const completedAt = new Date().toISOString();
    const turnId = createTurnId();
    const dispatched = dispatchStudyDesignFromQuery({
      sourceTurn: [...job.runtimeTurns].reverse().find((turn) => turn.role === "USER"),
      project: job.project,
      navigation: job.queryNavigation,
      ownerResultLedger: job.ownerResultLedger,
      traceLedger: job.scientificExecutionTraceLedger,
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      presentationTurnRef: turnId,
      startedAt: completedAt,
      completedAt,
    });
    const turn = {
      turnId,
      role: "NOXIA" as const,
      content: dispatched.presentation.plainText,
      createdAt: completedAt,
    };
    return {
      kind: "STUDY_DESIGN" as const,
      turn,
      content: turn.content,
      presentationSource: dispatched.proposal.options.length ? "RDE_STANDARD_PROJECTION" as const : "RDE_INFORMATION_NEED" as const,
      mediationFailure: null,
      provider: "NONE",
      model: "STUDY_DESIGN_RUNTIME",
      latencyMs: 0,
      calls: 0,
      ...dispatched,
    };
  }
  if (!shouldMediatePostAdoptionQuery(job.queryNavigation)
    || !job.queryNavigation.currentAction || !job.queryNavigation.currentPresentation) return null;
  const continuation = await requestProtocolDesignerBridge({
    requestKind: "POST_ADOPTION_QRY_CONTINUATION",
    observabilityContext: {
      sessionId: job.sessionId,
      conversationId: job.conversationId,
      turnId: [...job.runtimeTurns].reverse().find((candidate) => candidate.role === "USER")?.turnId ?? null,
      clientRequestId: `product-bridge:${[...job.runtimeTurns].reverse().find((candidate) => candidate.role === "USER")?.turnId ?? "NO_USER_TURN"}:POST_ADOPTION_QRY_CONTINUATION`,
      testSessionId: null,
    },
    conversation: {
      conversationId: job.conversationId,
      language: "fr",
      turns: job.runtimeTurns,
      interactionContext: {
        interactionRef: job.queryNavigation.currentPresentation.presentationId,
        sourceActionRef: job.queryNavigation.currentAction.selectedActionId,
        owner: "QUERY_NAVIGATION",
        purpose: [
          job.queryNavigation.currentPresentation.intent,
          `Question à formuler naturellement : ${job.queryNavigation.standardQuestion!.text}`,
        ].join("\n"),
        expectedResponseKind: "QRY_INFORMATION_RESPONSE",
        targetRefs: [job.queryNavigation.currentAction.targetRef],
        informationNeedRefs: [...job.queryNavigation.currentAction.navigationNeedRefs],
        projectRef: job.queryNavigation.projectRef,
        projectVersion: job.queryNavigation.projectVersion,
        projectDigest: job.queryNavigation.projectDigest,
      },
    },
    currentProject: job.project,
    currentNavigation: currentGovernedNavigationInput({
      project: job.project, navigation: job.queryNavigation, ownerResultLedger: job.ownerResultLedger,
    }),
    evaluatePersistentDelta: false,
  });
  const realizedAt = new Date().toISOString();
  onProviderCallRecords(continuation.observability.providerCalls ?? []);
  const visible = resolveGovernedPostAdoptionReceipt({ response: continuation, project: job.project, realizedAt });
  return {
    kind: "QUESTION" as const, // Existing conversation branch discriminant; the native WHAT may be non-interrogative.
    turn: { ...continuation.assistantTurn, content: visible.content, createdAt: realizedAt },
    ...visible,
  };
};

export type PostAdoptionContinuationResult = NonNullable<Awaited<ReturnType<typeof resolvePostAdoptionContinuationJob>>>;
