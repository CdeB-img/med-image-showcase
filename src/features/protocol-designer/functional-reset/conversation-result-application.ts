import { buildCurrentNavigationEvidence } from "@/features/query-navigation/current-navigation-evidence";
import { GOVERNED_REALIZATION_SYSTEM_INSTRUCTION } from "@/features/query-navigation/governed-conversation-realization";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { retainUndecidedContributionScope, markContributionCandidateNonCurrent } from "./contribution-lifecycle";
import { recordGovernedConversationTrace, recordRetainedContributionValidation } from "./end-to-end-trace-adapter";
import { buildStandardConversationActionGroup } from "./standard-conversation-action-group";
import { appendLanguageProjectionFailure, DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL, DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT, detectConversationLanguage, languageProjectionFailure } from "@/features/protocol-designer/conversation-language-gateway";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { recordConversationLanguageGatewayFailureTrace } from "@/features/protocol-designer/scientific-execution-trace";
import { recordContributionDownstreamFailure } from "./contribution-lifecycle";
import { recordProductErrorBoundary } from "./end-to-end-trace-adapter";
import { productBridgeClientErrorCode, languageProjectionRequestFromError, languageProjectionDiagnosticFromError } from "../conversation-language-effects";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../product-bridge";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION, naturalConversationContext } from "@/features/protocol-designer/product-bridge";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildPreProjectTraceRealizationOutcome, createPreProjectScientificTraceSegment, recordLocalizedConversationResponseTrace, type ScientificTraceCaptureConfiguration, type ScientificTraceRealizationOutcome } from "@/features/protocol-designer/scientific-execution-trace";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildPreProjectNavigationDecision, buildCurrentProjectImpactProjection, realizePreProjectNavigationDecision } from "@/features/query-navigation";
import { requireStudyProposalReview } from "./study-proposal-standard";
import { retainValidatedContributionCandidate, type RetainedContributionCandidate } from "./contribution-lifecycle";
import { retainScientificDiscussionResult } from "./contribution-discussion-retention";
import { recordInitialProductTrace, recordConversationContextPacketPreflight, recordCurrentProjectImpactNavigationTrace, productTraceExtractionExecution } from "./end-to-end-trace-adapter";
import { type StandardConversationActionGroupPresentation } from "./standard-conversation-action-group";
import { routeProductEntry } from "./product-entry-routing";
import { buildCandidateScientificChallenge } from "./natural-conversation-policy";
import { createConversationEntryId, type FunctionalResetSession } from "./session";
import { buildPreProjectScientificThinkingIntervention } from "./scientific-thinking-standard";
import { visibleStructuredUnderstandingEvidence } from "./product-entry-routing";
import { prepareMultilingualUserTurn, localizeCanonicalFrenchResponse } from "../conversation-language-effects";
import { projectTerraBridgeTrace, projectConversationBridgeTrace, appendBridgeTrace } from "./bridge-trace-projection";

// Receipt application only: no dispatch, persistence or scientific authority is introduced.
const VALIDATED_CANDIDATE_DEGRADED_REPLY = "J’ai identifié plusieurs éléments dans votre projet. Voici ce que j’ai compris ; vous pouvez les corriger avant toute confirmation.";

export function deliverTerraConversationResult(input: {
  latest: FunctionalResetSession; session: FunctionalResetSession; traceRunId: string; userTurn: ScientificInterpretationTurn;
  runtimeTurns: ScientificInterpretationTurn[]; response: ProductBridgeResponse; receivedAt: string; traceCaptureConfiguration: ScientificTraceCaptureConfiguration;
}): FunctionalResetSession {
  const { latest, session, traceRunId, userTurn, runtimeTurns, response, receivedAt, traceCaptureConfiguration } = input;
  // A non-adopting conversation may complete while an independently captured
  // checkpoint is materialized. Preserve the intervening governed events and
  // source receipts; never replace them with the dispatch-time transcript.
  const deliveredTurns = latest.runtimeTurns.some(t => t.turnId === userTurn.turnId) ? latest.runtimeTurns : runtimeTurns;
  // Keep the scientific request/response causally paired before an intervening
  // native adoption control. All events and original timestamps survive;
  // entries below still present replies in their actual arrival order. Never
  // classify arbitrary user prose as a control or relax Knowledge validation.
  const sourceIndex = deliveredTurns.findIndex(t => t.turnId === userTurn.turnId);
  const controlIndex = deliveredTurns.findIndex((turn, index) => index > sourceIndex && turn.role === "USER"
    && latest.scientificDiscussionRetention?.sourceCoverage.some(source => source.turnRef === turn.turnId
      && source.sourceDigest === logicalDigest(turn.content) && source.coverage === "COMPLETE"
      && source.nonPersistentReason === "GOVERNED_OWNER_EVENT" && source.classificationOwner === "RESEARCH_PROJECT"
      && Boolean(source.ownerEventRef)));
  const completedTurns = controlIndex < 0 ? [...deliveredTurns, response.assistantTurn]
    : [...deliveredTurns.slice(0, controlIndex), response.assistantTurn, ...deliveredTurns.slice(controlIndex)];
  let contextTraceLedger = latest.scientificExecutionTraceLedger;
  try {
    contextTraceLedger = recordConversationContextPacketPreflight({
      ledger: contextTraceLedger, traceRunId, turnId: userTurn.turnId, conversationId: session.conversationId,
      observedAt: receivedAt, sourceDigest: logicalDigest(userTurn.content), project: session.project,
      measurement: response.observability.conversationContextPacketPreflight,
      captureConfiguration: traceCaptureConfiguration,
    });
  } catch { /* TRACE must never veto a received conversation result. */ }
  // Deliver native Chat text before any local transaction preparation. A
  // rejected candidate must never erase or replace this conversational turn.
  const delivered: FunctionalResetSession = {
    ...latest, pendingMixedUserTurnRef: null,
    ...(!response.conversationFailure && response.scientificConversation?.retainedScientificResult ? {
      scientificDiscussionRetention: retainScientificDiscussionResult({
        state: latest.scientificDiscussionRetention,
        conversationId: session.conversationId, runtimeTurns: completedTurns,
        userTurn, assistantTurn: response.assistantTurn, result: response.scientificConversation.retainedScientificResult,
        retained: latest.retainedContributionCandidates ?? []
      }),
    } : {}),
    scientificExecutionTraceLedger: contextTraceLedger,
    runtimeTurns: response.conversationFailure ? deliveredTurns : completedTurns,
    entries: [...latest.entries, {
      entryId: createConversationEntryId(), kind: response.conversationFailure ? "ERROR" : "TEXT",
      role: "NOXIA", content: response.assistantReply, createdAt: receivedAt,
      ...(response.conversationFailure ? { turnId: userTurn.turnId, failureCode: response.conversationFailure.code } : {})
    }], updatedAt: receivedAt
  };
  return delivered;
}

export function prepareTerraRecordingResult(input: {
  session: FunctionalResetSession; response: ProductBridgeResponse; prepareRecording: boolean; traceRunId: string; userTurn: ScientificInterpretationTurn; receivedAt: string; content: string;
}) {
  const { session, response, prepareRecording, traceRunId, userTurn, receivedAt, content } = input;
  const contribution = prepareRecording ? response.persistentExtraction.contribution : null;
  let candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> | null = null;
  let retained = session.retainedContributionCandidates;
  let preparationFailed = false;
  try {
    candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
    if (contribution && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION")
      retained = retainValidatedContributionCandidate({
        retained: session.retainedContributionCandidates ?? [],
        contribution, candidate, validation: response.persistentExtraction.validation,
        validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1", sourceTurnRef: userTurn.turnId,
        baseProject: session.project, dependencyBindings: [], traceRunId, retainedAt: receivedAt
      });
  } catch (error) {
    preparationFailed = true;
    candidate = null;
    console.warn("PROJECT_REVIEW_PREPARATION_FAILED", error);
  }
  const reviewable = !preparationFailed && contribution && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION";
  const apply = (current: FunctionalResetSession): FunctionalResetSession => ({
    ...current, currentContribution: !preparationFailed && contribution ? contribution : current.currentContribution,
    pendingContribution: reviewable ? contribution : current.pendingContribution,
    retainedContributionCandidates: reviewable ? retained : current.retainedContributionCandidates,
    entries: [...current.entries,
    ...(reviewable ? [{
      entryId: createConversationEntryId(), kind: "REVIEW" as const, role: "NOXIA" as const,
      contribution, candidate, traceRunId, status: "PENDING" as const, createdAt: receivedAt
    }] : []),
    ...(prepareRecording && !reviewable ? [{
      entryId: createConversationEntryId(), kind: "ERROR" as const,
      role: "NOXIA" as const, content: !preparationFailed && response.persistentExtraction.status === "NO_CHANGE"
        ? "Aucun nouveau changement à enregistrer. Le projet adopté est conservé."
        : "Je conserve la discussion, mais l’enregistrement n’a pas abouti.", createdAt: receivedAt
    }] : [])],
    bridgeTraces: appendBridgeTrace(current.bridgeTraces, projectTerraBridgeTrace({ turnId: userTurn.turnId, traceRunId, content, response, candidate, projectVersionBefore: session.project?.versionId ?? null, projectVersionAfter: current.project?.versionId ?? null })), updatedAt: receivedAt
  });
  return apply;
}

export function prepareConfiguredConversationReceipt(input: {
  session: FunctionalResetSession; response: ProductBridgeResponse; entryRouting: ReturnType<typeof routeProductEntry>;
  content: string; preProjectNavigation: ReturnType<typeof buildPreProjectNavigationDecision> | undefined; bridgeRequest: Omit<ProductBridgeRequest, "apiVersion">;
}) {
  const { session, response, entryRouting, content, preProjectNavigation, bridgeRequest } = input;
  const extractedContribution = entryRouting.projectConstructionEligible
    ? response.persistentExtraction.contribution
    : null;
  // An independent new candidate does not supersede/merge an older one by
  // recency. Both identities remain retained; this turn presents its receipt.
  const contribution = extractedContribution;
  const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
  const effectiveCandidate = (!response.scientificConversation?.studyProposal || response.scientificConversation.studyProposal.recomputation) && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" ? candidate : null;
  const scientificThinkingIntervention = !response.scientificConversation && !session.project && effectiveCandidate && contribution
    ? buildPreProjectScientificThinkingIntervention({
      contribution,
      sessionId: session.sessionId,
      sourceJourney: entryRouting.routeIntent === "DOCUMENT" ? "FORMALIZE_IDEA" : entryRouting.routeIntent,
      reasoning: response.contextualReasoning,
      conversationTurns: bridgeRequest.conversation.turns,
    })
    : null;
  const enrichedPreProjectNavigation = preProjectNavigation && scientificThinkingIntervention?.navigationContributions.length
    ? buildPreProjectNavigationDecision({
      routing: entryRouting,
      scientificContributions: scientificThinkingIntervention.navigationContributions,
      contextualUnderstanding: scientificThinkingIntervention.contextualUnderstanding,
      sourceText: content,
    })
    : null;
  const selectedPreProjectNavigation = enrichedPreProjectNavigation ?? (preProjectNavigation && response.currentTurnNavigation ? {
    ...preProjectNavigation,
    action: response.currentTurnNavigation.envelope.action,
    selection: response.currentTurnNavigation.selection,
    selectedInformationNeedRef: response.currentTurnNavigation.envelope.selectedInformationNeedRef,
    selectedInformationNeed: response.currentTurnNavigation.envelope.action === "ASK_QUESTION" ? response.currentTurnNavigation.envelope.purpose : null,
    scientificReason: response.currentTurnNavigation.envelope.purpose,
    realizationDirective: response.currentTurnNavigation.envelope.purpose,
    alreadyProvidedInformationRefs: response.currentTurnNavigation.envelope.alreadyProvidedInformationRefs,
  } : preProjectNavigation);
  const realizedBridgeRequest = {
    ...bridgeRequest,
    ...(selectedPreProjectNavigation ? { preProjectNavigation: selectedPreProjectNavigation } : {}),
    ...(!enrichedPreProjectNavigation && response.currentTurnNavigation ? { governedRealization: response.currentTurnNavigation.envelope } : {}),
  };
  const providerContext = response.scientificConversation?.providerInput.context ?? naturalConversationContext(realizedBridgeRequest);
  return { contribution, candidate, effectiveCandidate, enrichedPreProjectNavigation, selectedPreProjectNavigation, realizedBridgeRequest, providerContext };
}

export function realizeConfiguredConversationReceipt(input: {
  session: FunctionalResetSession; response: ProductBridgeResponse; entryRouting: ReturnType<typeof routeProductEntry>;
  userTurn: ScientificInterpretationTurn; receipt: ReturnType<typeof prepareConfiguredConversationReceipt>; validatedCandidateDegradedPath: boolean;
}) {
  const { session, response, entryRouting, userTurn, receipt, validatedCandidateDegradedPath } = input;
  const { contribution, effectiveCandidate, enrichedPreProjectNavigation, selectedPreProjectNavigation } = receipt;
  const structuredUnderstanding = visibleStructuredUnderstandingEvidence({
    contribution: effectiveCandidate ? contribution : null,
    sourceTurnRef: userTurn.turnId,
    explicitDimensions: entryRouting.explicitScientificDimensions,
  });
  const preProjectRealization = response.scientificConversation ? null : !enrichedPreProjectNavigation && response.governedRealization ? {
    ...response.governedRealization,
    provider: response.governedRealization.providerReplyAccepted ? response.observability.provider : "NONE",
    model: response.governedRealization.providerReplyAccepted ? response.observability.model : "LOCAL_WHAT_REALIZATION",
    conformanceReason: response.governedRealization.conformance.diagnostics.join("|") || "STRUCTURED_CLAIMS_CONFORM_VISIBLE_FIDELITY_NOT_ADJUDICATED",
    representedDimensionRefs: response.governedRealization.conformance.representedContentRefs,
    missingDimensionRefs: response.governedRealization.conformance.missingRequiredContentRefs,
  } : selectedPreProjectNavigation
    ? realizePreProjectNavigationDecision({
      decision: selectedPreProjectNavigation,
      providerReply: response.observability.conversationCalls === 1
        && response.observability.conversationResponseReceived
        ? response.assistantReply
        : null,
      provider: response.observability.provider,
      model: response.observability.model,
      structuredUnderstanding,
    })
    : null;
  const candidateScientificChallenge = !response.scientificConversation && effectiveCandidate
    ? buildCandidateScientificChallenge(effectiveCandidate)
    : null;
  const baseCanonicalAssistantReply = validatedCandidateDegradedPath
    ? VALIDATED_CANDIDATE_DEGRADED_REPLY
    : preProjectRealization?.assistantReply ?? response.assistantReply;
  const canonicalAssistantReply = candidateScientificChallenge
    ? `${baseCanonicalAssistantReply}\n\n${candidateScientificChallenge}`
    : baseCanonicalAssistantReply;
  const canonicalAssistantTurn = { ...response.assistantTurn, content: canonicalAssistantReply };
  return { structuredUnderstanding, preProjectRealization, canonicalAssistantReply, canonicalAssistantTurn };
}

export function applyConfiguredConversationReceipt(input: {
  session: FunctionalResetSession; response: ProductBridgeResponse; entryRouting: ReturnType<typeof routeProductEntry>;
  content: string; userTurn: ScientificInterpretationTurn; traceRunId: string; receivedAt: string; traceCaptureConfiguration: ScientificTraceCaptureConfiguration;
  receipt: ReturnType<typeof prepareConfiguredConversationReceipt>; presentation: ReturnType<typeof realizeConfiguredConversationReceipt>;
  localized: Awaited<ReturnType<typeof localizeCanonicalFrenchResponse>>; preparedGateway: Awaited<ReturnType<typeof prepareMultilingualUserTurn>>;
  deferredProposalNavigation: FunctionalResetSession["queryNavigation"]; continuedTurn: ScientificInterpretationTurn | undefined; runtimeTurns: ScientificInterpretationTurn[];
  explicitCurrentProjectChange: boolean; entryTraceLedger: FunctionalResetSession["scientificExecutionTraceLedger"]; queryNavigation: FunctionalResetSession["queryNavigation"];
  contextualActionPresentation: StandardConversationActionGroupPresentation | null; currentProjectImpactProjection: ReturnType<typeof buildCurrentProjectImpactProjection>;
  retainedThisTurn: RetainedContributionCandidate | null; governedRealizationOutcome: ScientificTraceRealizationOutcome | undefined;
  qryNeedBefore: string | null; visibleAssistantReply: string; standaloneAssistantReplyVisible: boolean; failureMessage: string | null;
}) {
  const { governedRealizationOutcome } = input;
  const { session, response, entryRouting, content, userTurn, traceRunId, receivedAt, traceCaptureConfiguration, localized, preparedGateway, deferredProposalNavigation, continuedTurn, runtimeTurns, explicitCurrentProjectChange, entryTraceLedger, queryNavigation, contextualActionPresentation, currentProjectImpactProjection, retainedThisTurn, qryNeedBefore, visibleAssistantReply, standaloneAssistantReplyVisible, failureMessage } = input;
  const { contribution, candidate, effectiveCandidate, enrichedPreProjectNavigation, realizedBridgeRequest, providerContext } = input.receipt;
  const { structuredUnderstanding, preProjectRealization, canonicalAssistantReply, canonicalAssistantTurn } = input.presentation;
  const preProjectTrace = !response.scientificConversation && response.currentTurnNavigation && !enrichedPreProjectNavigation ? null : createPreProjectScientificTraceSegment({
    sessionId: session.sessionId,
    sourceTurnRef: userTurn.turnId,
    traceRunId,
    sourceText: content,
    routing: entryRouting,
    request: response.scientificConversation ? {
      ...realizedBridgeRequest, preProjectNavigation: undefined, governedRealization: undefined,
      conversation: { ...realizedBridgeRequest.conversation, interactionContext: undefined },
    } : realizedBridgeRequest,
    providerBoundary: {
      systemInstruction: response.scientificConversation?.providerInput.systemInstruction ?? NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context: providerContext,
      assistantReply: canonicalAssistantReply,
      provider: response.scientificConversation?.responseOwner === "DETERMINISTIC" ? "NONE" : preProjectRealization?.provider ?? response.observability.provider,
      model: response.scientificConversation?.responseOwner === "DETERMINISTIC" ? "LOCAL_WHAT_REALIZATION" : preProjectRealization?.model ?? response.observability.model,
      formulationOwner: response.scientificConversation?.responseOwner === "DETERMINISTIC" || preProjectRealization?.executor === "LOCAL_DETERMINISTIC_REALIZATION"
        ? "LOCAL_RUNTIME"
        : undefined,
      visibleStructuredUnderstandingDimensionRefs: structuredUnderstanding?.representedDimensionRefs,
      ...(response.scientificConversation ? { realizationOutcome: governedRealizationOutcome } : preProjectRealization ? {
        realizationOutcome: buildPreProjectTraceRealizationOutcome({
          attemptedProvider: response.observability.provider,
          providerReply: response.assistantReply,
          realization: preProjectRealization,
        }),
      } : {}),
    },
    captureConfiguration: traceCaptureConfiguration,
  });
  const effectiveExtractionStatus = entryRouting.projectConstructionEligible
    ? response.persistentExtraction.status
    : "NOT_REQUESTED" as const;
  let scientificExecutionTraceLedger = recordInitialProductTrace({
    ledger: entryTraceLedger,
    traceRunId,
    conversationId: session.conversationId,
    segment: preProjectTrace,
    observedAt: receivedAt,
    contribution,
    candidate,
    reviewCandidate: retainedThisTurn ? null : effectiveCandidate,
    retainedCandidate: retainedThisTurn,
    extractionStatus: effectiveExtractionStatus,
    extractionLatencyMs: response.observability.extractionLatencyMs,
    extractionExecution: productTraceExtractionExecution({
      contribution,
      providerArtifact: response.persistentExtraction.providerArtifact,
      observedProvider: response.observability.extractionProvider,
      observedModelRequested: response.observability.extractionModelRequested,
      observedModelReturned: response.observability.extractionModelReturned,
    }),
  });
  if (session.project && currentProjectImpactProjection && contextualActionPresentation) {
    scientificExecutionTraceLedger = recordCurrentProjectImpactNavigationTrace({
      ledger: scientificExecutionTraceLedger,
      traceRunId,
      conversationId: session.conversationId,
      observedAt: receivedAt,
      project: session.project,
      impact: currentProjectImpactProjection,
      queryNavigation,
      presentation: contextualActionPresentation,
    });
  }
  scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
    ledger: scientificExecutionTraceLedger,
    traceRunId,
    conversationId: session.conversationId,
    response: localized.response,
    observedAt: receivedAt,
  });
  const responseEntries: FunctionalResetSession["entries"] = [
    ...(standaloneAssistantReplyVisible ? [{
      entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const,
      content: visibleAssistantReply, createdAt: receivedAt,
    }] : []),
    ...(contextualActionPresentation ? [{
      entryId: createConversationEntryId(),
      kind: "FOLLOW_UP_ACTIONS" as const,
      role: "NOXIA" as const,
      presentation: contextualActionPresentation,
      response: null,
      createdAt: receivedAt,
    }] : []),
    ...(effectiveCandidate && contribution ? [{
      entryId: createConversationEntryId(),
      kind: "REVIEW" as const,
      role: "NOXIA" as const,
      contribution,
      candidate: effectiveCandidate,
      traceRunId,
      status: "PENDING" as const,
      decision: null,
      createdAt: receivedAt,
    }] : []),
    ...(failureMessage ? [{
      entryId: createConversationEntryId(),
      kind: "ERROR" as const,
      role: "NOXIA" as const,
      content: failureMessage,
      createdAt: receivedAt,
    }] : []),
  ];
  const apply = (current: FunctionalResetSession): FunctionalResetSession => {
    return {
      ...current,
      queryNavigation,
      pendingMixedUserTurnRef: continuedTurn ? null : current.pendingMixedUserTurnRef,
      runtimeTurns: deferredProposalNavigation ? runtimeTurns : [...runtimeTurns, canonicalAssistantTurn],
      pendingContribution: effectiveCandidate && contribution ? contribution : current.pendingContribution,
      studyProposal: response.scientificConversation?.studyProposal ?? (effectiveCandidate && current.studyProposal
        ? requireStudyProposalReview(current.studyProposal, current.project) : current.studyProposal),
      retainedContributionCandidates: current.retainedContributionCandidates,
      entries: [...current.entries, ...responseEntries],
      bridgeTraces: appendBridgeTrace(current.bridgeTraces, projectConversationBridgeTrace({ turnId: userTurn.turnId, traceRunId, content, visibleAssistantReply, response, entryRouting, effectiveExtractionStatus, candidate, projectVersion: session.project?.versionId ?? null, qryNeedBefore, queryNavigation, preProjectRealization, preparedGateway, localized, preProjectTrace })),
      conversationLanguageGateway: localized.state,
      scientificExecutionTraceLedger,
      updatedAt: receivedAt,
    };
  };
  return { apply, scientificExecutionTraceLedger, governedRealizationOutcome };
}

export function prepareConfiguredConversationFailure(input: {
  error: unknown; observedProviderCalls: readonly ProviderCallRecord[]; turnId: string; traceRunId: string;
  content: string; now: string; failedAt: string;
  preparedGatewaySnapshot: Awaited<ReturnType<typeof prepareMultilingualUserTurn>> | null;
  retainedThisTurn: RetainedContributionCandidate | null; downstreamStage: string;
  governedRealizationOutcome: ScientificTraceRealizationOutcome | undefined;
  traceCaptureConfiguration: ScientificTraceCaptureConfiguration;
}) {
  const { error, observedProviderCalls, turnId, traceRunId, content, now, failedAt, preparedGatewaySnapshot,
    retainedThisTurn, downstreamStage, governedRealizationOutcome, traceCaptureConfiguration } = input;
  const durableFailure = [...observedProviderCalls].reverse().find(record => record.status === "FAILED" && record.durableFailure)
    ?.durableFailure;
  const failureCode = productBridgeClientErrorCode(error) ?? "PRODUCT_BRIDGE_REQUEST_FAILED";
  const failedProjectionRequest = languageProjectionRequestFromError(error);
  const failedProjectionDiagnostic = languageProjectionDiagnosticFromError(error);
  const languageGatewayFailed = failedProjectionRequest !== null || failureCode.includes("LANGUAGE_PROJECTION");
  const message = languageGatewayFailed
    ? "La projection linguistique nécessaire n’a pas abouti. Votre message original est conservé et n’a pas été transmis au routeur scientifique. Vous pouvez réessayer."
    : error instanceof Error ? error.message : "L’interprétation scientifique est momentanément indisponible.";
  return (current: FunctionalResetSession): FunctionalResetSession => {
    const missingUserTurn = !current.runtimeTurns.some((turn) => turn.turnId === turnId);
    const detection = detectConversationLanguage(content);
    const projectionKind = failedProjectionRequest?.projectionKind
      ?? (preparedGatewaySnapshot ? "OUTPUT_FROM_FRENCH" as const : "INPUT_TO_FRENCH" as const);
    const projectionSourceText = failedProjectionRequest?.sourceText ?? content;
    const failure = languageGatewayFailed ? languageProjectionFailure({
      projectionKind,
      sourceText: projectionSourceText,
      sourceLanguage: failedProjectionRequest?.sourceLanguageHint
        ?? (projectionKind === "OUTPUT_FROM_FRENCH" ? "fr" : detection.detectedLanguage ?? "UNKNOWN"),
      targetLanguage: failedProjectionRequest?.targetLanguage
        ?? (projectionKind === "OUTPUT_FROM_FRENCH"
          ? preparedGatewaySnapshot?.state.conversationLanguage ?? "fr"
          : "fr"),
      provider: "OPENAI",
      model: DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
      reasoningEffort: DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
      failureCategory: failureCode,
      occurredAt: failedAt,
    }) : null;
    const conversationLanguageGateway = failure
      ? appendLanguageProjectionFailure({
        state: preparedGatewaySnapshot?.state ?? current.conversationLanguageGateway,
        failure,
      })
      : preparedGatewaySnapshot?.state ?? current.conversationLanguageGateway;
    let scientificExecutionTraceLedger = current.scientificExecutionTraceLedger;
    if (failure) {
      scientificExecutionTraceLedger = recordConversationLanguageGatewayFailureTrace({
        ledger: scientificExecutionTraceLedger,
        traceRunId,
        conversationId: current.conversationId,
        turnId,
        originalTextDigest: preparedGatewaySnapshot?.turn.originalTextDigest ?? failure.sourceTextDigest,
        projectionSourceTextDigest: failure.sourceTextDigest,
        detection,
        projectionKind,
        targetLanguage: failure.targetLanguage,
        provider: failure.provider,
        model: failure.model,
        reasoningEffort: failure.reasoningEffort,
        contextScopeId: failure.contextScopeId,
        failureCode,
        conformanceDiagnostic: failedProjectionDiagnostic,
        observedAt: failedAt,
        captureConfiguration: traceCaptureConfiguration,
      });
    }
    scientificExecutionTraceLedger = recordProductErrorBoundary({
      ledger: scientificExecutionTraceLedger,
      traceRunId,
      turnId,
      conversationId: current.conversationId,
      startedAt: now,
      failedAt,
      owner: languageGatewayFailed ? "LANGUAGE_GATEWAY" : "TRACE",
      responsibilityOwner: durableFailure ? "DURABLE_PROVIDER_GUARD" : languageGatewayFailed ? "LANGUAGE_GATEWAY" : "PRODUCT_BRIDGE",
      executor: languageGatewayFailed ? "OPENAI_LANGUAGE_PROJECTION" : "PRODUCT_BRIDGE_CLIENT",
      componentId: languageGatewayFailed ? "CONVERSATION_LANGUAGE_GATEWAY" : "PRODUCT_BRIDGE_CLIENT",
      componentVersion: "UNKNOWN",
      provider: durableFailure?.generationProvider ?? (languageGatewayFailed ? "OPENAI" : "UNKNOWN"),
      code: durableFailure?.structuredErrorCode ?? failureCode,
      category: languageGatewayFailed ? "BOUNDARY_REJECTION" : "UNKNOWN",
      sourceDigest: failure?.sourceTextDigest ?? "UNKNOWN",
      retainedCandidate: retainedThisTurn,
      realizationOutcome: governedRealizationOutcome,
      durableFailure,
    });
    return {
      ...current,
      runtimeTurns: missingUserTurn
        ? [...current.runtimeTurns, { turnId, role: "USER", content, createdAt: now }]
        : current.runtimeTurns,
      entries: [
        ...current.entries,
        ...(missingUserTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : []),
        { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: message, createdAt: failedAt },
      ],
      conversationLanguageGateway,
      retainedContributionCandidates: retainedThisTurn ? recordContributionDownstreamFailure({
        retained: current.retainedContributionCandidates ?? [],
        candidateRef: retainedThisTurn.candidateRef, stage: downstreamStage,
        code: failureCode, occurredAt: failedAt,
      }) : current.retainedContributionCandidates,
      scientificExecutionTraceLedger,
      updatedAt: failedAt,
    };
  };
}

export function stageConfiguredConversationCandidate(input: {
  session: FunctionalResetSession; response: ProductBridgeResponse; receipt: ReturnType<typeof prepareConfiguredConversationReceipt>;
  entryRouting: ReturnType<typeof routeProductEntry>; content: string; userTurn: ScientificInterpretationTurn; traceRunId: string; receivedAt: string;
  boundedInteraction: ProductBridgeRequest["boundedInteraction"]; boundedReferentContext: NonNullable<ProductBridgeRequest["boundedReferentContext"]>;
  entryTraceLedger: FunctionalResetSession["scientificExecutionTraceLedger"]; queryNavigation: FunctionalResetSession["queryNavigation"];
  publish: (apply: (current: FunctionalResetSession) => FunctionalResetSession) => void;
  onRetainedCandidate: (retained: RetainedContributionCandidate | null) => void;
  onRealizationOutcome: (outcome: ScientificTraceRealizationOutcome | undefined) => void;
}) {
  const { session, response, receipt, entryRouting, content, userTurn, traceRunId, receivedAt, boundedInteraction,
    boundedReferentContext, publish, onRetainedCandidate, onRealizationOutcome } = input;
  const { candidate, contribution, enrichedPreProjectNavigation, providerContext } = receipt;
  let { entryTraceLedger, queryNavigation } = input;
  let retainedThisTurn: RetainedContributionCandidate | null = null;
  let contextualActionPresentation: StandardConversationActionGroupPresentation | null = null;
  let currentProjectImpactProjection: NonNullable<ReturnType<typeof buildCurrentProjectImpactProjection>> | null = null;
  let governedRealizationOutcome: ScientificTraceRealizationOutcome | undefined;
  if (candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" && contribution) {
    const retained = retainValidatedContributionCandidate({
      retained: [], contribution, candidate,
      validation: response.persistentExtraction.validation,
      validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1",
      sourceTurnRef: userTurn.turnId, baseProject: session.project,
      dependencyBindings: [], traceRunId, retainedAt: receivedAt,
    });
    retainedThisTurn = retained[0] ?? null;
    onRetainedCandidate(retainedThisTurn);
    if (retainedThisTurn) {
      const record = retainedThisTurn;
      entryTraceLedger = recordRetainedContributionValidation({
        ledger: entryTraceLedger, traceRunId, conversationId: session.conversationId,
        retainedCandidate: record,
        extractionExecution: productTraceExtractionExecution({
          contribution, providerArtifact: response.persistentExtraction.providerArtifact,
          observedProvider: response.observability.extractionProvider,
          observedModelRequested: response.observability.extractionModelRequested,
          observedModelReturned: response.observability.extractionModelReturned,
        }),
        extractionLatencyMs: response.observability.extractionLatencyMs,
        extractedAt: response.stageTimestamps?.extractionCompletedAt,
        validatedAt: response.stageTimestamps?.extractionCompletedAt,
      });
      publish((current) => ({
        ...current,
        scientificExecutionTraceLedger: entryTraceLedger,
        retainedContributionCandidates: retainValidatedContributionCandidate({
          retained: current.retainedContributionCandidates ?? [],
          contribution: record.contribution, candidate: record.candidate, validation: record.validation,
          validatorRef: record.validatorRef, sourceTurnRef: record.sourceTurnRef,
          baseProject: record.baseProject, dependencyBindings: record.dependencyBindings,
          traceRunId: record.traceRunId, retainedAt: record.retainedAt,
        }),
      }));
    }
  }
  if (retainedThisTurn && boundedInteraction?.kind === "ACKNOWLEDGE_USER_DIRECTION"
    && boundedInteraction.correctionChangeRefs?.length && boundedReferentContext.candidateRef) {
    const originalRecord = session.retainedContributionCandidates?.find(record => record.candidateRef === boundedReferentContext.candidateRef);
    if (originalRecord) {
      const remainder = retainUndecidedContributionScope({
        record: originalRecord, currentBefore: session.project,
        currentAfter: session.project, settledChangeRefs: boundedInteraction.correctionChangeRefs,
        decisionSourceRef: userTurn.turnId, retainedAt: receivedAt
      });
      const remainderEntryId = remainder ? createConversationEntryId() : null;
      publish(current => ({
        ...current, retainedContributionCandidates: [...markContributionCandidateNonCurrent({
          retained: current.retainedContributionCandidates ?? [], candidateRef: originalRecord.candidateRef,
          actuality: "SUPERSEDED", reasonRef: userTurn.turnId, recordedAt: receivedAt,
        }), ...(remainder ? [remainder] : [])], entries: [...current.entries,
        ...(remainder ? [{
          entryId: remainderEntryId!, kind: "REVIEW" as const, role: "NOXIA" as const,
          contribution: remainder.contribution, candidate: remainder.candidate, status: "PENDING" as const, createdAt: receivedAt
        }] : [])]
      }));
    }
  }
  const explicitCurrentProjectChange = entryRouting.currentProjectDirection === "MODIFY_EXISTING_PROJECT_OBJECT"
    || entryRouting.currentProjectDirection === "ADD_PROJECT_OBJECT";
  if (session.project && retainedThisTurn && !explicitCurrentProjectChange) {
    const impact = buildCurrentProjectImpactProjection({
      project: session.project,
      candidate: retainedThisTurn.candidate,
      candidateDigest: retainedThisTurn.candidateDigest,
      sourceTurnRef: retainedThisTurn.sourceTurnRef,
    });
    if (impact) {
      currentProjectImpactProjection = impact;
      const evidence = buildCurrentNavigationEvidence({
        sourceTurnRef: userTurn.turnId,
        sourceText: content,
        currentProject: session.project,
        validatedCandidate: retainedThisTurn,
        currentProjectImpact: impact,
      });
      queryNavigation = buildFunctionalResetQueryNavigation({
        project: session.project,
        previous: session.queryNavigation,
        recordedAt: receivedAt,
        currentNavigationEvidence: evidence,
        forceRebuild: true,
      });
      contextualActionPresentation = buildStandardConversationActionGroup({ impact, navigation: queryNavigation });
    }
  }
  if (!response.scientificConversation && !enrichedPreProjectNavigation && (response.currentTurnNavigation || response.conversationFailure)) {
    const nativeTrace = recordGovernedConversationTrace({
      ledger: entryTraceLedger, traceRunId, conversationId: session.conversationId,
      sourceDigest: logicalDigest(content), observedAt: receivedAt,
      response, retainedCandidate: retainedThisTurn, providerContext,
      systemInstruction: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION,
    });
    entryTraceLedger = nativeTrace.ledger;
    governedRealizationOutcome = nativeTrace.realizationOutcome;
    onRealizationOutcome(governedRealizationOutcome);
    publish((current) => ({ ...current, scientificExecutionTraceLedger: entryTraceLedger }));
  }

  return {
    retainedThisTurn, entryTraceLedger, queryNavigation, contextualActionPresentation, currentProjectImpactProjection,
    governedRealizationOutcome, explicitCurrentProjectChange
  };
}
