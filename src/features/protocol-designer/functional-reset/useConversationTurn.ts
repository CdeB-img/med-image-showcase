import { stageConfiguredConversationCandidate, prepareConfiguredConversationFailure } from "./conversation-result-application";
import { prepareConversationEntry, prepareRequestedProposalNavigation } from "./conversation-request";
import { type Dispatch, type SetStateAction, type MutableRefObject, useEffect, useRef } from "react";
import { requestsScientificExplanation } from "@/features/query-navigation/current-navigation-evidence";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { ProductBridgeClientError, requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { captureProductBridgeTraceText, createProductTraceRunId, recordConversationLanguageGatewayTrace, recordLocalizedConversationResponseTrace, type ScientificTraceCaptureConfiguration, type ScientificTraceRealizationOutcome } from "@/features/protocol-designer/scientific-execution-trace";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildCurrentProjectImpactProjection } from "@/features/query-navigation";
import { type RetainedContributionCandidate } from "./contribution-lifecycle";
import { type StandardConversationActionGroupPresentation } from "./standard-conversation-action-group";
import { executeProductUnderstandInteraction, recognizeProductDocumentAction, type ProductDocumentAction } from "./product-entry-routing";
import { classifyNaturalConversationActs, detectConversationStylePreference, isProjectStateQuestion, isUserFeedbackOnAssistantOutput, isExternalEvidenceRequest, isExplicitProjectRecordingRequest, readNaturalCandidateDecision } from "./natural-conversation-policy";
import { appendFunctionalResetProviderCallRecords, createConversationEntryId, createTurnId, recordConversationConfirmationReceipt, type FunctionalResetSession } from "./session";
import { resolveDocumentaryIntent } from "./documentary-conversation";
import { prepareScientificThinkingInteraction } from "./scientific-thinking-standard";
import { prepareStudyDesignInteraction } from "./study-design-standard";
import { prepareObservabilityInteraction } from "./observability-standard";
import { prepareImagingInteraction } from "./imaging-standard";
import { prepareBiostatisticsInteraction } from "./biostatistics-standard";
import { type NaturalContributionDecisionContext } from "./project-review-decision";
import { providerRecordsFromError, prepareMultilingualUserTurn, localizeCanonicalFrenchResponse, normalizePreparedUserInput, type PreparedGatewayUserInput } from "../conversation-language-effects";
import { projectEmptyBridgeTrace, appendBridgeTrace } from "./bridge-trace-projection";
import type { PostAdoptionContinuationJob } from "./post-adoption-continuation";
import { prepareConversationTurnContext, prepareConfiguredConversationRequest, prepareTerraConversationRequest, assertConversationSubmissionContextCurrent } from "./conversation-request";
import { deliverTerraConversationResult, prepareTerraRecordingResult, prepareConfiguredConversationReceipt, realizeConfiguredConversationReceipt, applyConfiguredConversationReceipt } from "./conversation-result-application";

type ConversationTurnPorts = Readonly<{
  session: FunctionalResetSession;
  latestSessionRef: MutableRefObject<FunctionalResetSession>;
  setSession: Dispatch<SetStateAction<FunctionalResetSession>>;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setBusyMessage: Dispatch<SetStateAction<string>>;
  setDraft: Dispatch<SetStateAction<string>>;
  correctionMode: boolean;
  setCorrectionMode: Dispatch<SetStateAction<boolean>>;
  autonomousProjectBuild: boolean;
  traceCaptureConfiguration: ScientificTraceCaptureConfiguration;
  setPostAdoptionContinuationJob: Dispatch<SetStateAction<PostAdoptionContinuationJob | null>>;
  confirmContribution: (contributionId: string, naturalDecision?: NaturalContributionDecisionContext) => Promise<FunctionalResetSession | false | null>;
  rejectContribution: (contributionId: string, naturalDecision?: NaturalContributionDecisionContext) => void;
  dispatchProductDocumentAction: (action: ProductDocumentAction, command: { content: string; createdAt: string }) => void;
  handleDocumentInstruction: (instruction: string, recordUser?: boolean, sourceTurnRef?: string) => void | Promise<void>;
  persistenceFailureMessage: (status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE",
    candidateStatus: ReturnType<typeof prepareResearchProjectContributionCandidate>["status"] | null, recordingRequested: boolean) => string | null;
}>;

// Foreground lifecycle only. Scientific decisions, requests, receipts and persistence
// remain delegated to their existing owners and application boundaries.
export function useConversationTurn({ session, latestSessionRef, setSession, busy, setBusy, setBusyMessage, setDraft,
  correctionMode, setCorrectionMode, autonomousProjectBuild, traceCaptureConfiguration, setPostAdoptionContinuationJob,
  confirmContribution, rejectContribution, dispatchProductDocumentAction, handleDocumentInstruction, persistenceFailureMessage,
}: ConversationTurnPorts) {
  const foregroundInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const mixedTurnInFlightRef = useRef<string | null>(null);

  const applyScientificThinkingInput = async (input: string | PreparedGatewayUserInput) => {
    const prepared = normalizePreparedUserInput(input);
    const command = prepareScientificThinkingInteraction(session, prepared);
    if ("apply" in command && command.apply) setSession(command.apply);
    if ("complete" in command && command.complete) {
      const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
        state: prepared.gatewayState, onProviderCallRecords: prepared.onProviderCallRecords,
        sessionId: session.sessionId, conversationId: session.conversationId,
        sourceTurnRef: prepared.turnId, responseId: `conversation-response:${prepared.turnId}`,
        canonicalFrenchResponse: command.canonicalResponse,
      }) : null;
      setSession(command.complete(localized));
    }
    return command.handled;
  };

  const applyStudyDesignInput = async (input: string | PreparedGatewayUserInput, explicitOptionRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const command = prepareStudyDesignInteraction(session, prepared, explicitOptionRef);
    if ("apply" in command && command.apply) setSession(command.apply);
    if ("complete" in command && command.complete) {
      const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
        state: prepared.gatewayState, onProviderCallRecords: prepared.onProviderCallRecords,
        sessionId: session.sessionId, conversationId: session.conversationId,
        sourceTurnRef: prepared.turnId, responseId: `conversation-response:${prepared.turnId}`,
        canonicalFrenchResponse: command.canonicalResponse,
      }) : null;
      setSession(command.complete(localized));
    }
    return command.handled;
  };

  const applyObservabilityInput = async (input: string | PreparedGatewayUserInput, explicitMeasurementRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const command = prepareObservabilityInteraction(session, prepared, explicitMeasurementRef);
    if ("apply" in command && command.apply) setSession(command.apply);
    if ("complete" in command && command.complete) {
      const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
        state: prepared.gatewayState, onProviderCallRecords: prepared.onProviderCallRecords,
        sessionId: session.sessionId, conversationId: session.conversationId,
        sourceTurnRef: prepared.turnId, responseId: `conversation-response:${prepared.turnId}`,
        canonicalFrenchResponse: command.canonicalResponse,
      }) : null;
      setSession(command.complete(localized));
    }
    return command.handled;
  };

  const applyImagingInput = async (input: string | PreparedGatewayUserInput, explicitOptionRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const command = prepareImagingInteraction(session, prepared, explicitOptionRef);
    if ("apply" in command && command.apply) setSession(command.apply);
    if ("complete" in command && command.complete) {
      const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
        state: prepared.gatewayState, onProviderCallRecords: prepared.onProviderCallRecords,
        sessionId: session.sessionId, conversationId: session.conversationId,
        sourceTurnRef: prepared.turnId, responseId: `conversation-response:${prepared.turnId}`,
        canonicalFrenchResponse: command.canonicalResponse,
      }) : null;
      setSession(command.complete(localized));
    }
    return command.handled;
  };

  const applyBiostatisticsInput = async (input: string | PreparedGatewayUserInput, explicitStrategyRef?: string) => {
    const prepared = normalizePreparedUserInput(input);
    const command = prepareBiostatisticsInteraction(session, prepared, explicitStrategyRef);
    if ("apply" in command && command.apply) setSession(command.apply);
    if ("complete" in command && command.complete) {
      const localized = prepared.gatewayState ? await localizeCanonicalFrenchResponse({
        state: prepared.gatewayState, onProviderCallRecords: prepared.onProviderCallRecords,
        sessionId: session.sessionId, conversationId: session.conversationId,
        sourceTurnRef: prepared.turnId, responseId: `conversation-response:${prepared.turnId}`,
        canonicalFrenchResponse: command.canonicalResponse,
      }) : null;
      setSession(command.complete(localized));
    }
    return command.handled;
  };

  const submitTerraText = async (content: string, prepareRecording = false, continuedTurn?: ScientificInterpretationTurn,
    pendingConfirmation: ReturnType<typeof readNaturalCandidateDecision> = null) => {
    if (foregroundInFlightRef.current) return;
    foregroundInFlightRef.current = true;
    const requestedSessionId = latestSessionRef.current.sessionId;
    setBusy(true);
    setBusyMessage("NOXIA réfléchit…");
    if (!mountedRef.current || latestSessionRef.current.sessionId !== requestedSessionId) {
      foregroundInFlightRef.current = false; setBusy(false); return;
    }
    const session = latestSessionRef.current;
    const now = new Date().toISOString();
    const lastTurn = session.runtimeTurns.at(-1), lastEntry = session.entries.at(-1);
    const retry = !continuedTurn && lastTurn?.role === "USER" && lastTurn.content === content
      && lastEntry?.kind === "ERROR" && lastEntry.turnId === lastTurn.turnId;
    const userTurn: ScientificInterpretationTurn = continuedTurn ?? (retry ? lastTurn : { turnId: createTurnId(), role: "USER", content, createdAt: now });
    const traceRunId = createProductTraceRunId(session.sessionId, userTurn.turnId);
    const runtimeTurns = continuedTurn || retry ? session.runtimeTurns : [...session.runtimeTurns, userTurn];
    const requestTurns = continuedTurn && runtimeTurns.at(-1)?.role === "NOXIA"
      && runtimeTurns.at(-2)?.turnId === continuedTurn.turnId ? runtimeTurns.slice(0, -1) : runtimeTurns;
    setDraft(""); setBusy(true); setBusyMessage("NOXIA réfléchit…");
    setSession(current => {
      const withReceipt = pendingConfirmation?.act === "CONFIRM" && !retry && !continuedTurn
        ? recordConversationConfirmationReceipt(current, userTurn, pendingConfirmation) : current;
      // Existing structured refusal policy is evidence, never a new compatibility classifier.
      const refusesScope = pendingConfirmation?.act === "REFUSE"
        || pendingConfirmation?.qualified && !pendingConfirmation.separableContinuation;
      const preparationState = refusesScope ? {
        ...withReceipt, workingDraftPreparations: withReceipt.workingDraftPreparations?.map(p =>
          p.checkpoint && p.decision === "PENDING" ? { ...p, postCutoffBlocker: `REFUSAL_OR_CORRECTION:${userTurn.turnId}` } : p)
      } : withReceipt;
      return {
        ...preparationState, pendingMixedUserTurnRef: null, runtimeTurns, entries: [...current.entries,
        ...(!retry && !continuedTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : [])], updatedAt: now
      };
    });
    const records: ProviderCallRecord[] = [];
    try {
      const response = await requestProtocolDesignerBridge(prepareTerraConversationRequest(session, requestTurns, userTurn, autonomousProjectBuild, prepareRecording));
      records.push(...response.observability.providerCalls ?? []);
      const latest = latestSessionRef.current;
      if (latest.sessionId !== session.sessionId || latest.project?.versionId !== session.project?.versionId) {
        throw new Error("Le projet a changé pendant cette réponse. Rouvrez son état courant ; aucune décision n'a été appliquée.");
      }
      const receivedAt = new Date().toISOString();
      const delivered = deliverTerraConversationResult({ latest, session, traceRunId, userTurn, runtimeTurns, response, receivedAt, traceCaptureConfiguration });
      latestSessionRef.current = delivered;
      setSession(delivered);
      if (response.conversationFailure) setDraft(current => current || content);
      setSession(prepareTerraRecordingResult({ session, response, prepareRecording, traceRunId, userTurn, receivedAt, content }));
    } catch (error) {
      if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
      setDraft(current => current || content);
      setSession(current => ({
        ...current, entries: [...current.entries, {
          entryId: createConversationEntryId(), kind: "ERROR",
          role: "NOXIA", content: error instanceof Error ? error.message : "La réponse n'a pas abouti. Votre message et le projet sont conservés.",
          turnId: userTurn.turnId, failureCode: error instanceof ProductBridgeClientError ? error.code : "CONVERSATION_CLIENT_FAILURE",
          createdAt: new Date().toISOString()
        }]
      }));
    } finally {
      setSession(current => appendFunctionalResetProviderCallRecords(current, {
        turnId: userTurn.turnId,
        traceRunId, requestKind: "USER_TURN", records
      }));
      setBusy(false);
      foregroundInFlightRef.current = false;
    }
  };
  const submitText = async (content: string, continuedTurn?: ScientificInterpretationTurn) => {
    if (!content || busy) return;
    if (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA") {
      if (continuedTurn) {
        await submitTerraText(content, false, continuedTurn);
        return;
      }
      await submitTerraText(content, autonomousProjectBuild ? false : isExplicitProjectRecordingRequest(content),
        undefined, readNaturalCandidateDecision(content));
      return;
    }
    const now = new Date().toISOString();
    if (continuedTurn) setSession(current => ({ ...current, pendingMixedUserTurnRef: null }));
    setDraft("");
    setCorrectionMode(false);
    setBusyMessage(session.project ? "Je vérifie les éléments déjà fournis…" : "Je structure votre projet…");
    setBusy(true);
    const turnId = continuedTurn?.turnId ?? createTurnId();
    const traceRunId = createProductTraceRunId(session.sessionId, continuedTurn ? `${turnId}:mixed-preparation` : turnId);
    let preparedGatewaySnapshot: Awaited<ReturnType<typeof prepareMultilingualUserTurn>> | null = null;
    let retainedThisTurn: RetainedContributionCandidate | null = null;
    let contextualActionPresentation: StandardConversationActionGroupPresentation | null = null;
    let currentProjectImpactProjection: NonNullable<ReturnType<typeof buildCurrentProjectImpactProjection>> | null = null;
    let governedRealizationOutcome: ScientificTraceRealizationOutcome | undefined;
    let busyLifecycleDelegated = false;
    const observedProviderCalls: ProviderCallRecord[] = [];
    const onProviderCallRecords = (records: readonly ProviderCallRecord[]) => { observedProviderCalls.push(...records); };
    let downstreamStage = "CONFORMANCE";
    try {
      const originalGatewayTurn = continuedTurn && session.conversationLanguageGateway.turns.find(turn => turn.turnId === continuedTurn.turnId);
      const preparedGateway = originalGatewayTurn
        ? { turn: originalGatewayTurn, state: session.conversationLanguageGateway, providerCalls: 0 as const, providerCallRecords: [] }
        : await prepareMultilingualUserTurn({ session, turnId, originalText: content, onProviderCallRecords });
      preparedGatewaySnapshot = preparedGateway;
      const preparedInput: PreparedGatewayUserInput = {
        originalText: content,
        workingText: preparedGateway.turn.frenchWorkingText ?? content,
        turnId,
        createdAt: now,
        multilingualTurn: preparedGateway.turn,
        gatewayState: preparedGateway.state,
        onProviderCallRecords,
      };
      const { proposalCorrection, currentProjectDirection, userTurn, runtimeTurns, boundedReferentContext, scientificDiscussionContext, boundedInteraction, adoptsVisibleProposal } = prepareConversationTurnContext(session, preparedInput, continuedTurn, correctionMode, now, turnId, content);
      // Explicit Project direction outranks an owner-driven continuation. The
      // router only recognizes the operation; extraction and PRJ validation
      // still resolve the stable scientific target and prepare the candidate.
      // Resolve current candidate decisions and QRY-owned purposes first. An
      // active scientific result is not authority to consume another act.
      if (currentProjectDirection === "NONE"
        && !requestsScientificExplanation(preparedInput.workingText)
        && !isUserFeedbackOnAssistantOutput(preparedInput.workingText)
        && !isExternalEvidenceRequest(preparedInput.workingText)
        && (!boundedInteraction
          || boundedInteraction.kind === "EXPLAIN_REFERENCED_CONTENT"
          || boundedInteraction.clarificationReason === "PAST_PROPOSAL_REFERENCE")) {
        if (await applyScientificThinkingInput(preparedInput)) return;
        if (await applyStudyDesignInput(preparedInput)) return;
        if (await applyObservabilityInput(preparedInput)) return;
        if (await applyImagingInput(preparedInput)) return;
        if (await applyBiostatisticsInput(preparedInput)) return;
      }
      const productDocumentAction = recognizeProductDocumentAction(preparedInput.workingText);
      if (productDocumentAction) {
        setSession((current) => ({ ...current, conversationLanguageGateway: preparedGateway.state }));
        setSession((current) => ({ ...current, runtimeTurns: [...current.runtimeTurns, userTurn] }));
        dispatchProductDocumentAction(productDocumentAction, { content, createdAt: now });
        return;
      }
      if ((boundedInteraction?.kind === "USER_CONFIRMS_CURRENT_CANDIDATE"
        || boundedInteraction?.kind === "USER_REFUSES_CURRENT_CANDIDATE")
        && boundedReferentContext.candidateRef) {
        const naturalDecision: NaturalContributionDecisionContext = {
          userTurn,
          originalText: content,
          gatewayState: preparedGateway.state,
          stylePreference: detectConversationStylePreference(preparedInput.workingText),
          selectedChangeRefs: boundedInteraction.selectedChangeRefs,
          refusedChangeRefs: boundedInteraction.refusedChangeRefs,
          correctionChangeRefs: boundedInteraction.correctionChangeRefs,
          prepareRemainingTurn: boundedInteraction.prepareRemainingTurn,
          traceLedger: recordConversationLanguageGatewayTrace({
            ledger: session.scientificExecutionTraceLedger,
            traceRunId,
            conversationId: session.conversationId,
            turn: preparedGateway.turn,
            observedAt: now,
            captureConfiguration: traceCaptureConfiguration,
          }),
        };
        if (boundedInteraction.kind === "USER_CONFIRMS_CURRENT_CANDIDATE") {
          busyLifecycleDelegated = Boolean(await confirmContribution(boundedReferentContext.candidateRef, naturalDecision));
        } else {
          rejectContribution(boundedReferentContext.candidateRef, naturalDecision);
          setBusy(false);
        }
        return;
      }
      const entry = prepareConversationEntry(session, preparedInput, preparedGateway, userTurn, traceRunId, now,
        traceCaptureConfiguration, correctionMode, proposalCorrection, continuedTurn, boundedInteraction, adoptsVisibleProposal);
      const { asksForExplanationOrRephrase, entryRouting } = entry;
      let entryTraceLedger = entry.entryTraceLedger;
      const qryNeedBefore = session.queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null;
      // UNDERSTAND is transversal: a pending QRY remains byte-for-byte available,
      // but it neither captures nor mutates the explanatory turn.
      let queryNavigation = session.queryNavigation;
      const withUser: FunctionalResetSession = {
        ...session,
        openDocumentProjectionId: null,
        pendingMixedUserTurnRef: null,
        queryNavigation,
        runtimeTurns,
        conversationLanguageGateway: preparedGateway.state,
        scientificExecutionTraceLedger: entryTraceLedger,
        entries: [
          ...session.entries,
          ...(!continuedTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : []),
        ],
        updatedAt: now,
      };
      setSession(withUser);
      const emptyTraceMaterial = projectEmptyBridgeTrace({ turnId: userTurn.turnId, content, projectVersion: session.project?.versionId ?? null, qryNeedBefore, queryNavigation, entryRouting, preparedGateway });

      if (entryRouting.domainGate !== "IN_SCOPE") {
        const rejectedAt = new Date().toISOString();
        const assistantReply = "Cette entrée ne peut pas être transmise à un owner scientifique. Reformulez-la comme une question scientifique générale, sans donnée personnelle ni identifiante. Aucun projet ni protocole n’a été créé.";
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          onProviderCallRecords,
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          sourceTurnRef: userTurn.turnId,
          responseId: `conversation-response:${userTurn.turnId}`,
          canonicalFrenchResponse: assistantReply,
        });
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(),
          role: "NOXIA",
          content: assistantReply,
          createdAt: rejectedAt,
        };
        const scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
          ledger: entryTraceLedger,
          traceRunId,
          conversationId: session.conversationId,
          response: localized.response,
          observedAt: rejectedAt,
        });
        setSession((current) => ({
          ...current,
          queryNavigation,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(),
            kind: "ERROR",
            role: "NOXIA",
            content: localized.response.localizedResponse,
            createdAt: rejectedAt,
          }],
          bridgeTraces: appendBridgeTrace(current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: captureProductBridgeTraceText({ value: localized.response.localizedResponse, field: "ASSISTANT_REPLY" }),
            provider: "DOMAIN_GATE",
            model: "DETERMINISTIC_LOCAL",
            conversationLatencyMs: 0,
            calls: preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: null,
            knowledgeResultDigest: null,
          }),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: rejectedAt,
        }));
        return;
      }

      const documentaryIntent = resolveDocumentaryIntent(preparedInput.workingText);
      if (session.project && !["PROJECT_CHANGE", "NOT_DOCUMENTARY"].includes(documentaryIntent.kind)) {
        await handleDocumentInstruction(preparedInput.workingText, false, userTurn.turnId);
        return;
      }

      const naturalConversationActs = classifyNaturalConversationActs(preparedInput.workingText);
      if ((entryRouting.currentProjectDirection === "PRESERVE_EXISTING_PROJECT"
        && !isProjectStateQuestion(preparedInput.workingText)
        && !naturalConversationActs.includes("NEW_INFORMATION")
        && !naturalConversationActs.includes("CLARIFICATION_RESPONSE"))
        || boundedInteraction?.kind === "CLARIFY_CANDIDATE_REFERENCE") {
        const answeredAt = new Date().toISOString();
        const assistantReply = boundedInteraction?.kind === "CLARIFY_CANDIDATE_REFERENCE"
          ? boundedInteraction.clarificationText ?? (boundedInteraction.clarificationReason === "PAST_PROPOSAL_REFERENCE"
            ? "Quelle option souhaitez-vous reprendre ? Précisez son libellé ou son numéro dans la liste concernée."
            : boundedInteraction.clarificationReason === "DECISION_SCOPE"
              ? "Quels éléments confirmez-vous, et lesquels souhaitez-vous modifier ou refuser ?"
              : boundedReferentContext.resolution === "AMBIGUOUS"
                ? "Quelle proposition souhaitez-vous confirmer ou refuser ?"
                : "Quelle proposition souhaitez-vous confirmer ou refuser ?")
          : "D’accord. Le projet courant reste inchangé.";
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          onProviderCallRecords,
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          sourceTurnRef: userTurn.turnId,
          responseId: `conversation-response:${userTurn.turnId}`,
          canonicalFrenchResponse: assistantReply,
        });
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(), role: "NOXIA", content: assistantReply, createdAt: answeredAt,
        };
        const scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
          ledger: entryTraceLedger,
          traceRunId,
          conversationId: session.conversationId,
          response: localized.response,
          observedAt: answeredAt,
        });
        setSession((current) => ({
          ...current,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA",
            content: localized.response.localizedResponse, createdAt: answeredAt,
          }],
          bridgeTraces: appendBridgeTrace(current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: captureProductBridgeTraceText({ value: localized.response.localizedResponse, field: "ASSISTANT_REPLY" }),
            provider: "PRODUCT_ENTRY_ROUTER",
            model: "DETERMINISTIC_LOCAL",
            conversationLatencyMs: 0,
            calls: preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: null,
            knowledgeResultDigest: null,
          }),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: answeredAt,
        }));
        return;
      }

      const requestedProposalNavigation = () => prepareRequestedProposalNavigation(session, boundedInteraction, userTurn, preparedInput, now);
      const delegateAssistedProposal = (
        proposalNavigation: NonNullable<ReturnType<typeof requestedProposalNavigation>>,
        ledger: typeof entryTraceLedger,
      ) => {
        if (!session.project) return;
        // Both entry paths share the same QRY selection and owner continuation.
        // The continuation owns the busy lifecycle until its result settles.
        busyLifecycleDelegated = true;
        setSession((current) => ({ ...current, queryNavigation: proposalNavigation, updatedAt: now }));
        setBusyMessage("Je prépare des propositions à partir du projet confirmé…");
        setPostAdoptionContinuationJob({
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          project: session.project,
          queryNavigation: proposalNavigation,
          ownerResultLedger: session.knowledgeOwnerLedger,
          scientificExecutionTraceLedger: ledger,
          runtimeTurns,
          feedback: content,
          traceRunId,
          previousScientificThinkingInteraction: session.scientificThinkingInteraction,
        });
      };
      const directProposalNavigation = !entryRouting.projectConstructionEligible
        ? requestedProposalNavigation() : null;
      // Assisted owner actions remain available through QRY; free discussion
      // now reaches the existing Bridge Scientific Thinking conversation.

      const answerReadOnlyInteraction = async (completedBridge?: Awaited<ReturnType<typeof requestProtocolDesignerBridge>>) => {
        const knowledge = executeProductUnderstandInteraction({
          raw: preparedInput.workingText, decision: entryRouting, createdAt: now,
          currentProject: session.project, retained: session.retainedContributionCandidates
        });
        const answeredAt = new Date().toISOString();
        const localized = await localizeCanonicalFrenchResponse({
          state: preparedGateway.state,
          onProviderCallRecords,
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          sourceTurnRef: userTurn.turnId,
          responseId: `conversation-response:${userTurn.turnId}`,
          canonicalFrenchResponse: knowledge.assistantReply,
        });
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(),
          role: "NOXIA",
          content: knowledge.assistantReply,
          createdAt: answeredAt,
        };
        const scientificExecutionTraceLedger = recordLocalizedConversationResponseTrace({
          ledger: entryTraceLedger,
          traceRunId,
          conversationId: session.conversationId,
          response: localized.response,
          observedAt: answeredAt,
        });
        setSession((current) => ({
          ...current,
          queryNavigation,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(),
            kind: knowledge.status === "FAILURE" ? "ERROR" : "TEXT",
            role: "NOXIA",
            content: localized.response.localizedResponse,
            knowledgePresentation: knowledge.presentation,
            createdAt: answeredAt,
          }],
          bridgeTraces: appendBridgeTrace(current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: captureProductBridgeTraceText({ value: localized.response.localizedResponse, field: "ASSISTANT_REPLY" }),
            provider: knowledge.responsibilityOwner ?? "KNOWLEDGE",
            model: knowledge.responsibilityOwner && knowledge.responsibilityOwner !== "KNOWLEDGE" ? "CURRENT_PROJECT_READ_ONLY" : "KE-001@1.2.1",
            conversationLatencyMs: completedBridge?.observability.conversationLatencyMs ?? 0,
            persistentExtractionCalled: completedBridge?.persistentExtraction.called ?? false,
            persistentExtractionStatus: completedBridge?.persistentExtraction.status ?? "NOT_REQUESTED",
            entryRouting,
            calls: (completedBridge?.observability.calls ?? 0) + preparedGateway.providerCalls + localized.providerCalls,
            languageGatewayCalls: preparedGateway.providerCalls + localized.providerCalls,
            knowledgeResultRef: knowledge.knowledgeResultRef,
            knowledgeResultDigest: knowledge.knowledgeResultDigest,
          }),
          conversationLanguageGateway: localized.state,
          scientificExecutionTraceLedger,
          updatedAt: answeredAt,
        }));
      };
      if (session.project && isProjectStateQuestion(preparedInput.workingText)
        && !isUserFeedbackOnAssistantOutput(preparedInput.workingText)
        && !isExternalEvidenceRequest(preparedInput.workingText)) {
        await answerReadOnlyInteraction();
        return;
      }
      // Scientific discussion is not conditional on a Knowledge match.

      const { preProjectNavigation, bridgeRequest } = prepareConfiguredConversationRequest({ session, entryRouting, userTurn, runtimeTurns, queryNavigation, boundedReferentContext, scientificDiscussionContext, boundedInteraction, preparedGateway, asksForExplanationOrRephrase });
      const assertSubmissionContextCurrent = () => assertConversationSubmissionContextCurrent(session, latestSessionRef.current);
      const response = await requestProtocolDesignerBridge(bridgeRequest);
      onProviderCallRecords(response.observability.providerCalls ?? []);
      assertSubmissionContextCurrent();
      const receivedAt = new Date().toISOString();
      const receipt = prepareConfiguredConversationReceipt({ session, response, entryRouting, content, preProjectNavigation, bridgeRequest });
      const { contribution, candidate, effectiveCandidate, enrichedPreProjectNavigation, selectedPreProjectNavigation, realizedBridgeRequest, providerContext } = receipt;
      const stagedReceipt = stageConfiguredConversationCandidate({
        session, response, receipt, entryRouting, content, userTurn, traceRunId, receivedAt,
        boundedInteraction, boundedReferentContext, entryTraceLedger, queryNavigation, publish: setSession,
        onRetainedCandidate: retained => { retainedThisTurn = retained; },
        onRealizationOutcome: outcome => { governedRealizationOutcome = outcome; }
      });
      retainedThisTurn = stagedReceipt.retainedThisTurn;
      entryTraceLedger = stagedReceipt.entryTraceLedger;
      queryNavigation = stagedReceipt.queryNavigation;
      contextualActionPresentation = stagedReceipt.contextualActionPresentation;
      currentProjectImpactProjection = stagedReceipt.currentProjectImpactProjection;
      governedRealizationOutcome = stagedReceipt.governedRealizationOutcome;
      const explicitCurrentProjectChange = stagedReceipt.explicitCurrentProjectChange;
      const validatedCandidateDegradedPath = Boolean(
        response.conversationFailure
        && retainedThisTurn
        && effectiveCandidate
        && contribution
        && ["HOW", "CONFORMANCE"].includes(response.conversationFailure.stage),
      );
      if (response.conversationFailure && !validatedCandidateDegradedPath) {
        downstreamStage = response.conversationFailure.stage;
        throw new ProductBridgeClientError(response.conversationFailure.code, response.conversationFailure.message);
      }
      // A mixed statement/request first traverses extraction. Only a successful
      // empty delta may resume the same proposal purpose; a candidate, blocked
      // extraction or technical failure must retain its own lifecycle.
      const deferredProposalNavigation = !response.scientificConversation && response.persistentExtraction.status === "NO_CHANGE"
        && !contribution && !candidate && !response.conversationFailure
        ? requestedProposalNavigation() : null;
      if (deferredProposalNavigation) queryNavigation = deferredProposalNavigation;
      if (!response.scientificConversation && !deferredProposalNavigation && session.project && !explicitCurrentProjectChange
        && response.persistentExtraction.status === "NO_CHANGE" && !contribution && !candidate
        && !response.conversationFailure) {
        // Product Entry's deferred path shares the same read-only owner as its
        // direct path. A validated empty delta is required: errors and actual
        // candidates never become an invented scientific answer.
        await answerReadOnlyInteraction(response);
        return;
      }
      const presentation = realizeConfiguredConversationReceipt({ session, response, entryRouting, userTurn, receipt, validatedCandidateDegradedPath });
      const { structuredUnderstanding, preProjectRealization, canonicalAssistantReply, canonicalAssistantTurn } = presentation;
      downstreamStage = "LOCALIZATION";
      const localized = await localizeCanonicalFrenchResponse({
        state: preparedGateway.state,
        onProviderCallRecords,
        sessionId: session.sessionId,
        conversationId: session.conversationId,
        sourceTurnRef: userTurn.turnId,
        responseId: `conversation-response:${userTurn.turnId}`,
        canonicalFrenchResponse: canonicalAssistantReply,
      });
      assertSubmissionContextCurrent();
      const visibleAssistantReply = localized.response.localizedResponse;
      const standaloneAssistantReplyVisible = Boolean(response.scientificConversation) || !deferredProposalNavigation
        && !(explicitCurrentProjectChange && effectiveCandidate && contribution);
      downstreamStage = "PRESENTATION";
      const effectiveExtractionStatus = entryRouting.projectConstructionEligible ? response.persistentExtraction.status : "NOT_REQUESTED" as const;
      const failureMessage = persistenceFailureMessage(effectiveExtractionStatus, candidate?.status ?? null,
        isExplicitProjectRecordingRequest(content));
      if (response.scientificConversation) governedRealizationOutcome = {
        contract: "SCIENTIFIC_TRACE_REALIZATION_OUTCOME", contractVersion: "1.0.0",
        declarationSource: "STRUCTURED_COMPONENT_OUTPUT",
        attemptedProvider: response.observability.conversationCalls === 1 ? response.observability.provider : "NONE",
        providerResponseReceived: response.observability.conversationResponseReceived === true,
        providerResponseAccepted: response.scientificConversation.responseOwner === "LLM",
        providerRejectionReason: response.scientificConversation.fallbackReason ?? "NONE",
        effectiveExecutor: response.scientificConversation.responseOwner === "LLM" ? "GEMINI_CONVERSATION_MODEL" : "LOCAL_DETERMINISTIC_REALIZATION",
        fallbackReason: response.scientificConversation.fallbackReason ?? "NONE",
      };
      const application = applyConfiguredConversationReceipt({ session, response, entryRouting, content, userTurn, traceRunId, receivedAt, traceCaptureConfiguration, receipt, presentation, localized, preparedGateway, deferredProposalNavigation, continuedTurn, runtimeTurns, explicitCurrentProjectChange, entryTraceLedger, queryNavigation, contextualActionPresentation, currentProjectImpactProjection, retainedThisTurn, governedRealizationOutcome, qryNeedBefore, visibleAssistantReply, standaloneAssistantReplyVisible, failureMessage });
      governedRealizationOutcome = application.governedRealizationOutcome;
      const scientificExecutionTraceLedger = application.scientificExecutionTraceLedger;
      setSession(application.apply);
      if (deferredProposalNavigation) {
        delegateAssistedProposal(deferredProposalNavigation, scientificExecutionTraceLedger);
      }
    } catch (error) {
      const failedAt = new Date().toISOString();
      setDraft(current => current || content);
      onProviderCallRecords(providerRecordsFromError(error));
      setSession(prepareConfiguredConversationFailure({
        error, observedProviderCalls, turnId, traceRunId, content, now, failedAt,
        preparedGatewaySnapshot, retainedThisTurn, downstreamStage, governedRealizationOutcome, traceCaptureConfiguration
      }));
    } finally {
      setSession((current) => appendFunctionalResetProviderCallRecords(current, {
        turnId, traceRunId, requestKind: "USER_TURN", records: observedProviderCalls,
      }));
      if (!busyLifecycleDelegated) setBusy(false);
    }
  };

  useEffect(() => {
    if (autonomousProjectBuild) return;
    const ref = session.pendingMixedUserTurnRef;
    if (!ref || busy || mixedTurnInFlightRef.current === ref) return;
    const turn = session.runtimeTurns.find(turn => turn.turnId === ref && turn.role === "USER");
    if (!turn) return;
    mixedTurnInFlightRef.current = ref;
    void submitText(turn.content, turn).finally(() => { mixedTurnInFlightRef.current = null; });
    // The persisted reference resumes once; normal renders must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.pendingMixedUserTurnRef, busy, autonomousProjectBuild]);

  return { submitText, submitTerraText, applyStudyDesignInput, applyObservabilityInput, applyImagingInput, applyBiostatisticsInput };
}
