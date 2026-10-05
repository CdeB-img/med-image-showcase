import { useProjectPreparation } from "./useProjectPreparation";
import { canCaptureProjectPreparation, projectPreparationReview, recordPreparationDecision } from "./project-preparation-lifecycle";
import { createProjectAdoptionTrace, type ProjectAdoptionTrace } from "./project-adoption-trace";
import ProjectFinalizationCard from "./ProjectFinalizationCard";
import { documentBlockerSignals, persistAdoptedProjectSession } from "./project-adoption-effects";
import { projectDrciDraftPackPortfolio } from "@/features/document-projection/drci-draft-pack";
import { projectDocumentLifecycle } from "@/features/document-projection/history";
import { isFunctionalDocumentProjectionCurrent } from "@/features/document-projection/functional-reset-boundary";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildBoundedConversationReferentContext, requestsScientificExplanation, buildCurrentNavigationEvidence, currentGovernedNavigationInput, selectBoundedConversationInteraction } from "@/features/query-navigation/current-navigation-evidence";
import { Helmet } from "react-helmet-async";
import { ArrowUp, LoaderCircle, MessageSquareText, Pencil, RotateCcw } from "lucide-react";
import VoiceDictationControl from "@/features/protocol-designer/voice/VoiceDictationControl";
import { insertDictationAtCaret } from "@/features/protocol-designer/voice/voice-dictation-contract";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { ProductBridgeClientError, requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import { NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION, naturalConversationContext, type ProductBridgeRequest } from "@/features/protocol-designer/product-bridge";
import { appendLanguageProjectionFailure, DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL, DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT, detectConversationLanguage, languageProjectionFailure } from "@/features/protocol-designer/conversation-language-gateway";
import { formatProductDevelopmentVersion } from "@/features/protocol-designer/product-development-version";
import DeployedCommitVersion from "@/features/protocol-designer/DeployedCommitVersion";
import type { ProviderCallRecord } from "@/features/protocol-designer/provider-call-observability";
import { GOVERNED_REALIZATION_SYSTEM_INSTRUCTION } from "@/features/query-navigation/governed-conversation-realization";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildPreProjectTraceRealizationOutcome, captureProductBridgeTraceText, createPreProjectScientificTraceSegment, createProductTraceRunId, DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION, recordConversationLanguageGatewayTrace, recordConversationLanguageGatewayFailureTrace, recordLocalizedConversationResponseTrace, recordProductEntryRoutingTrace, type ScientificTraceCaptureConfiguration, type ScientificTraceRealizationOutcome } from "@/features/protocol-designer/scientific-execution-trace";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildStudyDeliverablePortfolio, functionalProtocolProjection } from "@/features/document-projection";
import { buildPreProjectNavigationDecision, buildFunctionalResetQueryNavigation, buildCurrentProjectImpactProjection, isFunctionalResetQueryMisunderstanding, realizePreProjectNavigationDecision } from "@/features/query-navigation";
import { ContributionReviewPresentation, type ContributionReviewPresentationFailure } from "./ContributionReview";
import StudyProposalReview from "./StudyProposalReview";
import { requireStudyProposalReview, assertStudyProposalCurrent } from "./study-proposal-standard";
import type { StudyProposalComposition } from "../product-bridge";
import { retainValidatedContributionCandidate, retainUndecidedContributionScope, markContributionCandidateNonCurrent, recordContributionDownstreamFailure, buildScientificDiscussionContext, type RetainedContributionCandidate } from "./contribution-lifecycle";
import { retainScientificDiscussionResult } from "./contribution-discussion-retention";
import UnderstandingReviewCard from "../conversation/UnderstandingReviewCard";
import DevelopmentDiagnostics from "./DevelopmentDiagnostics";
import { recordArtifactGeneratedTrace, recordInitialProductTrace, recordGovernedConversationTrace, recordProductErrorBoundary, recordConversationContextPacketPreflight, recordCurrentProjectImpactNavigationTrace, recordRetainedContributionValidation, productTraceExtractionExecution } from "./end-to-end-trace-adapter";
import ProductUnderstandResponse from "./ProductUnderstandResponse";
import ProtocolPreview from "./ProtocolPreview";
import ResearchProjectPanel from "./ResearchProjectPanel";
import StudyDesignStandardCard from "./StudyDesignStandardCard";
import StudyDeliverableWorkspace from "./StudyDeliverableWorkspace";
import ObservabilityStandardCard from "./ObservabilityStandardCard";
import ImagingStandardCard from "./ImagingStandardCard";
import BiostatisticsStandardCard from "./BiostatisticsStandardCard";
import CanonicalStudyDataStandardCard from "./CanonicalStudyDataStandardCard";
import DataManagementStandardCard from "./DataManagementStandardCard";
import StandardConversationActionGroup from "./StandardConversationActionGroup";
import { buildStandardConversationActionGroup, type StandardConversationActionGroupPresentation } from "./standard-conversation-action-group";
import { executeProductUnderstandInteraction, recognizeCurrentProjectDirection, recognizeProductDocumentAction, routeProductEntry, type ProductDocumentAction } from "./product-entry-routing";
import { buildCandidateScientificChallenge, classifyNaturalConversationActs, detectConversationStylePreference, isProjectStateQuestion, isUserFeedbackOnAssistantOutput, isExternalEvidenceRequest, isExplicitProjectRecordingRequest, readNaturalCandidateDecision } from "./natural-conversation-policy";
import { appendFunctionalResetProviderCallRecords, clearFunctionalResetSession, createConversationEntryId, createFunctionalResetSession, createTurnId, loadFunctionalResetSession, saveFunctionalResetWorkspaceSession, type SessionSave, recordConversationConfirmationReceipt, conversationConfirmationReceiptStatus, productEntryPromptForIntent, type FunctionalResetSession } from "./session";
import { isStudyDesignQueryDispatch, readStudyDesignProposalFromLedger } from "./study-design-standard";
import { buildPreProjectScientificThinkingIntervention, isScientificThinkingQueryDispatch } from "./scientific-thinking-standard";
import { isObservabilityQueryDispatch, readObservabilityResultFromLedger } from "./observability-standard";
import { isImagingQueryDispatch, readImagingResultFromLedger } from "./imaging-standard";
import { isBiostatisticsQueryDispatch, readBiostatisticsResultFromLedger } from "./biostatistics-standard";
import { deriveFunctionalResetDataOwnerState, readCanonicalStudyDataResultFromLedger } from "./canonical-study-data-standard";
import { readDataManagementResultFromLedger } from "./data-management-standard";
import { attachCurrentKnowledgePrerequisiteWhenRequired } from "./knowledge-standard";
import { documentAdministrationFrom } from "./project-administration";
import ProjectContinuum from "./ProjectContinuum";
import ProjectSourceLibraryView from "./ProjectSourceLibraryView";
import { acquireDocumentKnowledge, resolveDocumentaryIntent } from "./documentary-conversation";
import { visibleStructuredUnderstandingEvidence } from "./product-entry-routing";
import { respondToConversationActionGroup as respondToConversationActionGroupTransition } from "./standard-conversation-action-group";
import { prepareDocumentInstruction, dispatchProductDocumentAction as prepareProductDocumentAction } from "./documentary-conversation";
import { prepareCanonicalStudyDataContinuationNavigation } from "./canonical-study-data-standard";
import ContributionReview from "./ContributionReview";
import { prepareScientificThinkingInteraction } from "./scientific-thinking-standard";
import { prepareStudyDesignInteraction } from "./study-design-standard";
import { prepareObservabilityInteraction } from "./observability-standard";
import { prepareImagingInteraction } from "./imaging-standard";
import { prepareBiostatisticsInteraction } from "./biostatistics-standard";
import { stageProjectConfirmation, stageProjectRejection, contributionHasAcknowledgedPresentation as hasAcknowledgedContributionPresentation, acknowledgeContributionReviewPresented as acknowledgeContributionReviewPresentedTransition, recordContributionReviewPresentationFailure as recordContributionReviewPresentationFailureTransition, type NaturalContributionDecisionContext } from "./project-review-decision";
import { projectPreparationConfirmationApplicable, projectPreparationConfirmationInput } from "./project-preparation-lifecycle";
import { stageStudyProposalSelection, stageStudyProposalDisposition } from "./project-review-decision";
import { productBridgeClientErrorCode, providerRecordsFromError, languageProjectionRequestFromError, languageProjectionDiagnosticFromError, languageBoundaryFor, prepareMultilingualUserTurn, localizeCanonicalFrenchResponse, normalizePreparedUserInput, type PreparedGatewayUserInput } from "../conversation-language-effects";
import { projectTerraBridgeTrace, projectConversationBridgeTrace, projectEmptyBridgeTrace, appendBridgeTrace } from "./bridge-trace-projection";
import type { PostAdoptionContinuationJob } from "./post-adoption-continuation";
import { usePostAdoptionContinuation } from "./usePostAdoptionContinuation";
import { useDocumentGeneration } from "./useDocumentGeneration";

const loadInitialSession = () => typeof window === "undefined"
  ? createFunctionalResetSession()
  : loadFunctionalResetSession(window.localStorage);

const persistenceFailureMessage = (
  status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE",
  candidateStatus: ReturnType<typeof prepareResearchProjectContributionCandidate>["status"] | null,
  recordingRequested: boolean,
) => {
  if (!recordingRequested) return null;
  if (status === "TECHNICAL_FAILURE" || status === "BLOCKED"
    || candidateStatus === "BLOCKED_BY_STRUCTURAL_CONFLICT" || candidateStatus === "REVIEW_PROJECTION_INCOMPLETE")
    return "Je conserve la discussion, mais l’enregistrement n’a pas abouti.";
  return null;
};

type ProtocolDesignerWorkspaceProps = Readonly<{
  traceCaptureConfiguration?: ScientificTraceCaptureConfiguration;
  initialSession?: FunctionalResetSession;
  onSessionChange?: SessionSave;
  onLeaveWorkspace?: () => void;
  onEditAdministration?: () => void;
  onNewProject?: () => void;
  onOpenProfile?: () => void;
  onRenameProject?: () => void;
}>;

const VALIDATED_CANDIDATE_DEGRADED_REPLY = "J’ai identifié plusieurs éléments dans votre projet. Voici ce que j’ai compris ; vous pouvez les corriger avant toute confirmation.";

export default function ProtocolDesignerWorkspace({
  traceCaptureConfiguration = DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION,
  initialSession, onSessionChange, onLeaveWorkspace, onEditAdministration, onNewProject, onOpenProfile, onRenameProject,
}: ProtocolDesignerWorkspaceProps) {
  const [session, setSession] = useState<FunctionalResetSession>(() => initialSession ?? loadInitialSession());
  const administration = useMemo(() => session.workspace
    ? documentAdministrationFrom(session.projectId, session.workspace) : undefined, [session.projectId, session.workspace]);
  const autonomousProjectBuild = import.meta.env.VITE_AUTONOMOUS_PROJECT_BUILD === "ON";
  const [workingProjectOpen, setWorkingProjectOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const foregroundInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const latestSessionRef = useRef(session);
  useEffect(() => { latestSessionRef.current = session; }, [session]);
  const preparationController = useProjectPreparation({ enabled: autonomousProjectBuild, session,
    latest: latestSessionRef, setSession, save: onSessionChange, captureConfiguration: traceCaptureConfiguration });
  const workingDraftBusy = preparationController.busy;
  const [projectionMode, setProjectionMode] = useState<"STANDARD" | "EXPERT">("STANDARD");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("NOXIA vous répond…");
  const [correctionMode, setCorrectionMode] = useState(false);
  const [deliverableWorkspaceOpen, setDeliverableWorkspaceOpen] = useState(false);
  const [documentSaveWarning, setDocumentSaveWarning] = useState<string | null>(null);
  const [sessionSaveWarning, setSessionSaveWarning] = useState<string | null>(null);
  const saveWarningRef = useRef({ session: sessionSaveWarning, document: documentSaveWarning });
  saveWarningRef.current = { session: sessionSaveWarning, document: documentSaveWarning };
  const [sourceLibraryOpen, setSourceLibraryOpen] = useState(false);
  const [documentMessage, setDocumentMessage] = useState("");
  const [documentGenerationPending, setDocumentGenerationPending] = useState(false);
  const [documentGenerationStartedAt, setDocumentGenerationStartedAt] = useState<number | null>(null);
  const [documentGenerationElapsed, setDocumentGenerationElapsed] = useState(0);
  const [documentGenerationVersion, setDocumentGenerationVersion] = useState(1);
  const [documentGenerationComplete, setDocumentGenerationComplete] = useState(false);
  const [documentProgressExpanded, setDocumentProgressExpanded] = useState(true);
  const [postAdoptionContinuationJob, setPostAdoptionContinuationJob] = useState<PostAdoptionContinuationJob | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const pendingVoiceCaretRef = useRef<number | null>(null);
  const conversationScrollRef = useRef<HTMLDivElement>(null);
  const [conversationScrolled, setConversationScrolled] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const latestReplyRef = useRef<HTMLElement>(null);
  const { requestProtocolProjection, documentRecoveryRef } = useDocumentGeneration({ latestSessionRef, setSession, administration, projectionMode, onSessionChange,
    setDocumentSaveWarning, setDeliverableWorkspaceOpen, setDocumentGenerationVersion, setDocumentGenerationStartedAt, setDocumentGenerationElapsed, setDocumentGenerationComplete, setDocumentGenerationPending });
  const confirmationInFlightRef = useRef<string | null>(null);
  const mixedTurnInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (documentGenerationStartedAt === null || !documentGenerationPending) return;
    const refresh = () => setDocumentGenerationElapsed(Math.floor((Date.now() - documentGenerationStartedAt) / 1000));
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [documentGenerationPending, documentGenerationStartedAt]);

  useEffect(() => {
    if (!documentGenerationComplete || documentGenerationPending) return;
    const timer = window.setTimeout(() => setDocumentGenerationComplete(false), 8000);
    return () => window.clearTimeout(timer);
  }, [documentGenerationComplete, documentGenerationPending]);

  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, Math.min(window.innerWidth < 640 ? window.innerHeight * 0.28 : window.innerHeight * 0.35, 12 * 22))}px`;
    if (pendingVoiceCaretRef.current !== null) {
      textarea.focus();
      textarea.setSelectionRange(pendingVoiceCaretRef.current, pendingVoiceCaretRef.current);
      pendingVoiceCaretRef.current = null;
    }
  }, [draft]);

  const insertVoiceTranscript = (transcript: string) => {
    const textarea = composerRef.current;
    const requestedCaret = textarea?.selectionStart;
    setDraft((current) => {
      const insertion = insertDictationAtCaret(current, transcript, requestedCaret ?? current.length);
      pendingVoiceCaretRef.current = insertion.caret;
      return insertion.text;
    });
  };

  useEffect(() => {
    let active = true;
    void saveFunctionalResetWorkspaceSession(window.localStorage, session, onSessionChange).then(saved => {
      if (!active) return;
      // Async save completions must not schedule a redundant UI render. That
      // can replay queued session updaters and restart their persistence effect.
      const warning = saved.scientificPersisted ? null : "Enregistrement local impossible. Gardez cet écran ouvert et réessayez la sauvegarde avant de poursuivre.";
      if (saveWarningRef.current.session !== warning) {
        saveWarningRef.current.session = warning;
        setSessionSaveWarning(warning);
      }
      if (!saved.scientificPersisted && session.drciDraftPacks?.length) {
        const documentWarning = "Documents disponibles mais non enregistrés dans ce navigateur. Exportez le dossier avant de fermer cette page.";
        if (saveWarningRef.current.document !== documentWarning) {
          saveWarningRef.current.document = documentWarning;
          setDocumentSaveWarning(documentWarning);
        }
      }
    });
    if (import.meta.env.DEV && session.bridgeTraces.length > 0) {
      console.debug("NOXIA_PRODUCT_BRIDGE_TRACE", JSON.stringify(session.bridgeTraces.at(-1)));
    }
    return () => { active = false; };
  }, [session, onSessionChange]);

  usePostAdoptionContinuation({ postAdoptionContinuationJob, setSession, setBusy, setPostAdoptionContinuationJob });

  useEffect(() => {
    if (!busy && import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA")
      latestReplyRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    else endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [busy, session.entries.length]);

  const projectExistedForReview = useMemo(() => {
    const firstProjectContributionIndex = session.entries.findIndex((entry) => entry.kind === "REVIEW" && entry.status === "CONFIRMED");
    return (entryIndex: number) => firstProjectContributionIndex >= 0 && entryIndex > firstProjectContributionIndex;
  }, [session.entries]);

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

  const continueFromCanonicalStudyData = () => {
    const project = session.project;
    const interaction = session.canonicalStudyDataInteraction;
    if (!project || !interaction || interaction.status !== "ACTIVE" || busy) return;
    const result = readCanonicalStudyDataResultFromLedger({
      ledger: session.knowledgeOwnerLedger,
      resultRef: interaction.ownerResultRef,
    });
    if (!result || result.sourceProject.projectVersion !== project.versionId
      || result.sourceProject.projectDigest !== project.projectDigest) {
      setSession((current) => ({
        ...current,
        canonicalStudyDataInteraction: current.canonicalStudyDataInteraction
          ? { ...current.canonicalStudyDataInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
          : null,
      }));
      return;
    }
    const recordedAt = new Date().toISOString();
    const queryNavigation = prepareCanonicalStudyDataContinuationNavigation({ ...session, project }, recordedAt);
    setSession((current) => ({
      ...current,
      queryNavigation,
      canonicalStudyDataInteraction: current.canonicalStudyDataInteraction
        ? { ...current.canonicalStudyDataInteraction, status: "COMPLETED" }
        : null,
      updatedAt: recordedAt,
    }));
    setBusyMessage("Je prépare la prochaine décision utile…");
    setBusy(true);
    setPostAdoptionContinuationJob({
      sessionId: session.sessionId,
      conversationId: session.conversationId,
      project,
      queryNavigation,
      ownerResultLedger: session.knowledgeOwnerLedger,
      scientificExecutionTraceLedger: session.scientificExecutionTraceLedger,
      runtimeTurns: session.runtimeTurns,
      feedback: "Préparer la gestion opérationnelle des données.",
      traceRunId: interaction.traceRunId,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await submitText(draft.trim());
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
      const preparationState = refusesScope ? { ...withReceipt, workingDraftPreparations: withReceipt.workingDraftPreparations?.map(p =>
        p.checkpoint && p.decision === "PENDING" ? { ...p, postCutoffBlocker: `REFUSAL_OR_CORRECTION:${userTurn.turnId}` } : p) } : withReceipt;
      return { ...preparationState, pendingMixedUserTurnRef: null, runtimeTurns, entries: [...current.entries,
        ...(!retry && !continuedTurn ? [{ entryId: createConversationEntryId(), kind: "TEXT" as const, role: "USER" as const, content, createdAt: now }] : [])], updatedAt: now };
    });
    const records: ProviderCallRecord[] = [];
    try {
      const discussion = buildScientificDiscussionContext({ retained: session.retainedContributionCandidates ?? [],
        retention: session.scientificDiscussionRetention,
        studyProposal: session.studyProposal,
        currentProject: session.project, conversationId: session.conversationId, runtimeTurns: requestTurns,
        selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null });
      const response = await requestProtocolDesignerBridge({ conversation: { conversationId: session.conversationId, language: "fr", turns: requestTurns },
        ...(autonomousProjectBuild && session.studyProposal?.state === "CURRENT" ? { studyProposalContext: session.studyProposal } : {}),
        currentProject: session.project, evaluatePersistentDelta: prepareRecording,
        scientificDiscussionContext: discussion,
        ...(session.project && session.queryNavigation ? { currentNavigation: currentGovernedNavigationInput({
          project: session.project, navigation: session.queryNavigation, ownerResultLedger: session.knowledgeOwnerLedger }) } : {}),
        observabilityContext: { sessionId: session.sessionId, conversationId: session.conversationId,
          turnId: userTurn.turnId, clientRequestId: `product-bridge:${userTurn.turnId}`, testSessionId: null } });
      records.push(...response.observability.providerCalls ?? []);
      const latest = latestSessionRef.current;
      if (latest.sessionId !== session.sessionId || latest.project?.versionId !== session.project?.versionId) {
        throw new Error("Le projet a changé pendant cette réponse. Rouvrez son état courant ; aucune décision n'a été appliquée.");
      }
      const receivedAt = new Date().toISOString();
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
      const delivered: FunctionalResetSession = { ...latest, pendingMixedUserTurnRef: null,
        ...(!response.conversationFailure && response.scientificConversation?.retainedScientificResult ? {
          scientificDiscussionRetention: retainScientificDiscussionResult({ state: latest.scientificDiscussionRetention,
            conversationId: session.conversationId, runtimeTurns: [...runtimeTurns, response.assistantTurn],
            userTurn, assistantTurn: response.assistantTurn, result: response.scientificConversation.retainedScientificResult,
            retained: latest.retainedContributionCandidates ?? [] }),
        } : {}),
        scientificExecutionTraceLedger: contextTraceLedger,
        runtimeTurns: response.conversationFailure ? runtimeTurns : [...runtimeTurns, response.assistantTurn],
        entries: [...latest.entries, { entryId: createConversationEntryId(), kind: response.conversationFailure ? "ERROR" : "TEXT",
          role: "NOXIA", content: response.assistantReply, createdAt: receivedAt,
          ...(response.conversationFailure ? { turnId: userTurn.turnId, failureCode: response.conversationFailure.code } : {}) }], updatedAt: receivedAt };
      latestSessionRef.current = delivered;
      setSession(delivered);
      if (response.conversationFailure) setDraft(current => current || content);
      const contribution = prepareRecording ? response.persistentExtraction.contribution : null;
      let candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> | null = null;
      let retained = session.retainedContributionCandidates;
      let preparationFailed = false;
      try {
        candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
        if (contribution && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION")
          retained = retainValidatedContributionCandidate({ retained: session.retainedContributionCandidates ?? [],
            contribution, candidate, validation: response.persistentExtraction.validation,
            validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1", sourceTurnRef: userTurn.turnId,
            baseProject: session.project, dependencyBindings: [], traceRunId, retainedAt: receivedAt });
      } catch (error) {
        preparationFailed = true;
        candidate = null;
        console.warn("PROJECT_REVIEW_PREPARATION_FAILED", error);
      }
      const reviewable = !preparationFailed && contribution && candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION";
      setSession(current => ({ ...current, currentContribution: !preparationFailed && contribution ? contribution : current.currentContribution,
        pendingContribution: reviewable ? contribution : current.pendingContribution,
        retainedContributionCandidates: reviewable ? retained : current.retainedContributionCandidates,
        entries: [...current.entries,
          ...(reviewable ? [{ entryId: createConversationEntryId(), kind: "REVIEW" as const, role: "NOXIA" as const,
            contribution, candidate, traceRunId, status: "PENDING" as const, createdAt: receivedAt }] : []),
          ...(prepareRecording && !reviewable ? [{ entryId: createConversationEntryId(), kind: "ERROR" as const,
            role: "NOXIA" as const, content: !preparationFailed && response.persistentExtraction.status === "NO_CHANGE"
              ? "Aucun nouveau changement à enregistrer. Le projet adopté est conservé."
              : "Je conserve la discussion, mais l’enregistrement n’a pas abouti.", createdAt: receivedAt }] : [])],
        bridgeTraces: appendBridgeTrace(current.bridgeTraces, projectTerraBridgeTrace({ turnId: userTurn.turnId, traceRunId, content, response, candidate, projectVersionBefore: session.project?.versionId ?? null, projectVersionAfter: current.project?.versionId ?? null })), updatedAt: receivedAt }));
    } catch (error) {
      if (error instanceof ProductBridgeClientError) records.push(...error.observability?.providerCalls ?? []);
      setDraft(current => current || content);
      setSession(current => ({ ...current, entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR",
        role: "NOXIA", content: error instanceof Error ? error.message : "La réponse n'a pas abouti. Votre message et le projet sont conservés.",
        turnId: userTurn.turnId, failureCode: error instanceof ProductBridgeClientError ? error.code : "CONVERSATION_CLIENT_FAILURE",
        createdAt: new Date().toISOString() }] }));
    } finally {
      setSession(current => appendFunctionalResetProviderCallRecords(current, { turnId: userTurn.turnId,
        traceRunId, requestKind: "USER_TURN", records }));
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
      const proposalCorrection = Boolean(session.studyProposal && recognizeCurrentProjectDirection(preparedInput.workingText, true) === "MODIFY_EXISTING_PROJECT_OBJECT");
      const currentProjectDirection = correctionMode && session.project
        ? "MODIFY_EXISTING_PROJECT_OBJECT"
        : recognizeCurrentProjectDirection(preparedInput.workingText, session.project !== null);
      const userTurn: ScientificInterpretationTurn = continuedTurn ?? { turnId, role: "USER", content, createdAt: now };
      const runtimeTurns = continuedTurn ? session.runtimeTurns : [...session.runtimeTurns, userTurn];
      const boundedReferentContext = buildBoundedConversationReferentContext({
        retained: session.retainedContributionCandidates ?? [], currentProject: session.project,
        conversationId: session.conversationId, runtimeTurns,
        selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null,
        requestingTurnRef: userTurn.turnId,
      });
      const scientificDiscussionContext = buildScientificDiscussionContext({
        retention: session.scientificDiscussionRetention,
        studyProposal: session.studyProposal,
        retained: session.retainedContributionCandidates ?? [], currentProject: session.project,
        conversationId: session.conversationId, runtimeTurns,
        selectedReviewRef: session.pendingContribution?.identity.contributionId ?? null,
      });
      const boundedInteraction = selectBoundedConversationInteraction({
        sourceText: preparedInput.workingText, correctionMode: correctionMode || proposalCorrection || Boolean(continuedTurn), referentContext: boundedReferentContext,
      });
      const visibleProposalDecision = readNaturalCandidateDecision(preparedInput.workingText);
      const adoptsVisibleProposal = Boolean(boundedReferentContext.visibleProposal
        && boundedReferentContext.visibleProposal.options.length === 1
        && visibleProposalDecision?.act === "CONFIRM" && !visibleProposalDecision.qualified
        && boundedInteraction?.kind === "ACKNOWLEDGE_USER_DIRECTION"
        && boundedInteraction.evidenceRefs.includes(boundedReferentContext.visibleProposal.options[0]!.ref));
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
      const asksForExplanationOrRephrase = isFunctionalResetQueryMisunderstanding(preparedInput.workingText);
      const previousContext = [...session.bridgeTraces]
        .reverse()
        .find((trace) => trace.entryRouting)?.entryRouting?.scientificContext;
      const entryRouting = routeProductEntry({
        raw: preparedInput.workingText,
        sourceTurnRef: userTurn.turnId,
        routedAt: now,
        previousContext,
        forceUnderstand: asksForExplanationOrRephrase,
        currentProjectAvailable: session.project !== null,
        explicitCorrectionMode: correctionMode || proposalCorrection || Boolean(continuedTurn) || Boolean(boundedInteraction?.correctionChangeRefs?.length),
        adoptsVisibleProposal,
      });
      let entryTraceLedger = recordConversationLanguageGatewayTrace({
        ledger: session.scientificExecutionTraceLedger,
        traceRunId,
        conversationId: session.conversationId,
        turn: preparedGateway.turn,
        observedAt: now,
        captureConfiguration: traceCaptureConfiguration,
      });
      entryTraceLedger = recordProductEntryRoutingTrace({
        ledger: entryTraceLedger,
        traceRunId,
        conversationId: session.conversationId,
        routing: entryRouting,
        routerInputRef: preparedGateway.turn.provenance.projectionRef ?? userTurn.turnId,
        routerInputDigest: preparedGateway.turn.frenchWorkingTextDigest ?? preparedGateway.turn.originalTextDigest,
        observedAt: now,
      });
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
        handleDocumentInstruction(preparedInput.workingText, false, userTurn.turnId);
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

      const requestedProposalNavigation = () => {
        if (boundedInteraction?.kind !== "USER_REQUESTS_ASSISTED_PROPOSAL" || !session.project) return null;
        const proposalNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({
          project: session.project,
          navigation: buildFunctionalResetQueryNavigation({
            project: session.project,
            previous: session.queryNavigation,
            documentBlockers: documentBlockerSignals(session.documents),
            recordedAt: now,
            forceRebuild: true,
            requestedAction: "ASSISTED_PROPOSAL",
            requestedServiceInput: { sourceTurnRef: userTurn.turnId, sourceText: preparedInput.workingText },
            dataOwnerState: deriveFunctionalResetDataOwnerState({ project: session.project, ledger: session.knowledgeOwnerLedger }),
          }),
        });
        const existingOwnerCanPropose = isScientificThinkingQueryDispatch(proposalNavigation)
          || isStudyDesignQueryDispatch(proposalNavigation)
          || isObservabilityQueryDispatch(proposalNavigation)
          || isImagingQueryDispatch(proposalNavigation)
          || isBiostatisticsQueryDispatch(proposalNavigation);
        return existingOwnerCanPropose ? proposalNavigation : null;
      };
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
        const knowledge = executeProductUnderstandInteraction({ raw: preparedInput.workingText, decision: entryRouting, createdAt: now,
          currentProject: session.project, retained: session.retainedContributionCandidates });
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

      const preProjectNavigation = session.project
        ? undefined
        : buildPreProjectNavigationDecision({ routing: entryRouting });
      const bridgeRequest: Omit<ProductBridgeRequest, "apiVersion"> = {
        requestKind: "USER_TURN",
        observabilityContext: {
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          turnId: userTurn.turnId,
          clientRequestId: `product-bridge:${userTurn.turnId}`,
          testSessionId: null,
        },
        conversation: {
          conversationId: session.conversationId,
          language: "fr",
          turns: runtimeTurns,
          ...(entryRouting.currentProjectDirection === "MODIFY_EXISTING_PROJECT_OBJECT"
            || entryRouting.currentProjectDirection === "ADD_PROJECT_OBJECT" ? {
            interactionContext: {
              interactionRef: `project-correction:${userTurn.turnId}`,
              sourceActionRef: queryNavigation?.currentAction?.selectedActionId ?? null,
              owner: "RESEARCH_PROJECT",
              purpose: "Préparer une modification candidate du Research Project courant à partir du dernier message utilisateur, sans adoption.",
              expectedResponseKind: "SCIENTIFIC_CORRECTION" as const,
              targetRefs: queryNavigation?.currentAction?.targetRef ? [queryNavigation.currentAction.targetRef] : [],
              informationNeedRefs: [...(queryNavigation?.currentAction?.navigationNeedRefs ?? [])],
              projectRef: session.project?.projectId ?? null,
              projectVersion: session.project?.versionId ?? null,
              projectDigest: session.project?.projectDigest ?? null,
            },
          } : queryNavigation?.currentAction && queryNavigation.currentPresentation ? {
            interactionContext: {
              interactionRef: queryNavigation.currentPresentation.presentationId,
              sourceActionRef: queryNavigation.currentAction.selectedActionId,
              owner: "QUERY_NAVIGATION",
              purpose: [
                queryNavigation.currentPresentation.intent,
                queryNavigation.standardQuestion
                  ? `Question actuellement présentée au chercheur : ${queryNavigation.standardQuestion.text}`
                  : null,
              ].filter((value): value is string => Boolean(value)).join("\n"),
              expectedResponseKind: "QRY_INFORMATION_RESPONSE" as const,
              targetRefs: [queryNavigation.currentAction.targetRef],
              informationNeedRefs: [...queryNavigation.currentAction.navigationNeedRefs],
              projectRef: queryNavigation.projectRef,
              projectVersion: queryNavigation.projectVersion,
              projectDigest: queryNavigation.projectDigest,
            },
          } : {}),
        },
        currentProject: session.project,
        ...(session.project ? { currentNavigation: currentGovernedNavigationInput({
          project: session.project, navigation: queryNavigation, ownerResultLedger: session.knowledgeOwnerLedger,
        }) } : {}),
        ...(preProjectNavigation ? { preProjectNavigation } : {}),
        boundedReferentContext,
        scientificDiscussionContext,
        ...(session.studyProposal ? { studyProposalContext: session.studyProposal } : {}),
        ...(boundedInteraction ? { boundedInteraction } : {}),
        ...(session.conversationPreferences?.responseLength === "CONCISE"
          ? { conversationPresentation: { responseLength: "CONCISE" as const } }
          : {}),
        languageBoundary: languageBoundaryFor(preparedGateway.state),
        // Routing governs Project eligibility. Conversation-only turns remain
        // usable, but cannot trigger persistent extraction.
        evaluatePersistentDelta: entryRouting.projectConstructionEligible && !asksForExplanationOrRephrase,
      };
      const assertSubmissionContextCurrent = () => {
        const latest = latestSessionRef.current;
        if (latest.sessionId !== session.sessionId || latest.conversationId !== session.conversationId
          || latest.project?.projectId !== session.project?.projectId
          || latest.project?.versionId !== session.project?.versionId
          || latest.project?.projectDigest !== session.project?.projectDigest) {
          throw new ProductBridgeClientError("SUBMISSION_CONTEXT_CHANGED",
            "Le contexte a changé pendant le traitement. Cette réponse n’a pas été appliquée ; le projet courant et les décisions déjà enregistrées sont conservés.");
        }
      };
      const response = await requestProtocolDesignerBridge(bridgeRequest);
      onProviderCallRecords(response.observability.providerCalls ?? []);
      assertSubmissionContextCurrent();
      const receivedAt = new Date().toISOString();
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
      if (candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" && contribution) {
        const retained = retainValidatedContributionCandidate({
          retained: [], contribution, candidate,
          validation: response.persistentExtraction.validation,
          validatorRef: "PERSISTENT_PROJECT_DELTA_AND_PRJ_CONTRIBUTION_V1",
          sourceTurnRef: userTurn.turnId, baseProject: session.project,
          dependencyBindings: [], traceRunId, retainedAt: receivedAt,
        });
        retainedThisTurn = retained[0] ?? null;
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
          setSession((current) => ({ ...current,
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
          const remainder = retainUndecidedContributionScope({ record: originalRecord, currentBefore: session.project,
            currentAfter: session.project, settledChangeRefs: boundedInteraction.correctionChangeRefs,
            decisionSourceRef: userTurn.turnId, retainedAt: receivedAt });
          const remainderEntryId = remainder ? createConversationEntryId() : null;
          setSession(current => ({ ...current, retainedContributionCandidates: [...markContributionCandidateNonCurrent({
            retained: current.retainedContributionCandidates ?? [], candidateRef: originalRecord.candidateRef,
            actuality: "SUPERSEDED", reasonRef: userTurn.turnId, recordedAt: receivedAt,
          }), ...(remainder ? [remainder] : [])], entries: [...current.entries,
            ...(remainder ? [{ entryId: remainderEntryId!, kind: "REVIEW" as const, role: "NOXIA" as const,
              contribution: remainder.contribution, candidate: remainder.candidate, status: "PENDING" as const, createdAt: receivedAt }] : [])] }));
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
        setSession((current) => ({ ...current, scientificExecutionTraceLedger: entryTraceLedger }));
      }
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
      const failureMessage = persistenceFailureMessage(effectiveExtractionStatus, candidate?.status ?? null,
        isExplicitProjectRecordingRequest(content));
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
      setSession((current) => {
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
      });
      if (deferredProposalNavigation) {
        delegateAssistedProposal(deferredProposalNavigation, scientificExecutionTraceLedger);
      }
    } catch (error) {
      const failedAt = new Date().toISOString();
      setDraft(current => current || content);
      onProviderCallRecords(providerRecordsFromError(error));
      const durableFailure = [...observedProviderCalls].reverse().find(record => record.status === "FAILED" && record.durableFailure)
        ?.durableFailure;
      const failureCode = productBridgeClientErrorCode(error) ?? "PRODUCT_BRIDGE_REQUEST_FAILED";
      const failedProjectionRequest = languageProjectionRequestFromError(error);
      const failedProjectionDiagnostic = languageProjectionDiagnosticFromError(error);
      const languageGatewayFailed = failedProjectionRequest !== null || failureCode.includes("LANGUAGE_PROJECTION");
      const message = languageGatewayFailed
        ? "La projection linguistique nécessaire n’a pas abouti. Votre message original est conservé et n’a pas été transmis au routeur scientifique. Vous pouvez réessayer."
        : error instanceof Error ? error.message : "L’interprétation scientifique est momentanément indisponible.";
      setSession((current) => {
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
      });
    } finally {
      setSession((current) => appendFunctionalResetProviderCallRecords(current, {
        turnId, traceRunId, requestKind: "USER_TURN", records: observedProviderCalls,
      }));
      if (!busyLifecycleDelegated) setBusy(false);
    }
  };

  const acknowledgeContributionReviewPresented = (entryId: string) => {
    const presentedAt = new Date().toISOString();
    setSession((current) => acknowledgeContributionReviewPresentedTransition(current, entryId, presentedAt));
  };

  const recordContributionReviewPresentationFailure = (entryId: string, failure: ContributionReviewPresentationFailure) => {
    const failedAt = new Date().toISOString();
    setSession((current) => recordContributionReviewPresentationFailureTransition(current, entryId, failure, failedAt));
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

  const contributionHasAcknowledgedPresentation = (contributionId: string) => hasAcknowledgedContributionPresentation(session, contributionId);

  const confirmContribution = async (
    contributionId: string,
    naturalDecision?: NaturalContributionDecisionContext,
    proposalSelection?: Readonly<{ composition: StudyProposalComposition; selectedOptions: readonly string[]; selectedAtoms: readonly string[];
      expectedDigest: string; contribution: ScientificInterpretationContributionEnvelope; candidate: ReturnType<typeof prepareResearchProjectContributionCandidate> }>,
    adoptionTrace?: ProjectAdoptionTrace,
  ) => {
    const session = latestSessionRef.current;
    if (busy && !naturalDecision) return false;
    if (confirmationInFlightRef.current === contributionId) return false;
    const contribution = proposalSelection?.contribution ?? session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return false;
    if (proposalSelection) {
      if (session.studyProposal?.digest !== proposalSelection.expectedDigest || proposalSelection.composition.digest !== proposalSelection.expectedDigest) return false;
      assertStudyProposalCurrent(proposalSelection.composition, latestSessionRef.current.project);
    } else if (!contributionHasAcknowledgedPresentation(contributionId)) return false;
    const now = new Date().toISOString();
    confirmationInFlightRef.current = contributionId;
    setBusyMessage("J’enregistre les éléments confirmés…");
    setBusy(true);
    try {
      const staged = stageProjectConfirmation({ session, readCurrentSession: () => latestSessionRef.current,
        contributionId, contribution, now, naturalDecision, proposalSelection, adoptionTrace, administration });
      let nextSession = staged.nextSession;
      const project = staged.project;
      const commit = await persistAdoptedProjectSession({ storage: window.localStorage, session: { ...nextSession, project },
        previousProject: staged.previousProject, save: onSessionChange, adoptionTrace, uploadSnapshot: import.meta.env.MODE !== "development" });
      if (commit.status === "NOT_COMMITTED") throw new Error("PROJECT_PERSISTENCE_FAILED");
      nextSession = commit.session;
      latestSessionRef.current = nextSession;
      setSession(nextSession);
      setReviewError(null);
      // Project writes supply context; they never select another scientific
      // speaker. QRY/owner results remain available for an explicit request.
      return nextSession;
    } catch (error) {
      console.warn("PROJECT_CONFIRMATION_FAILED", error);
      adoptionTrace?.fail(error, latestSessionRef.current.project);
      const workingReview = autonomousProjectBuild && Boolean(proposalSelection);
      if (workingReview) setReviewError("La validation du projet n’a pas abouti. Les choix restent disponibles dans cette revue.");
      setSession((current) => {
        const correlatedTrace = current.bridgeTraces.find((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId);
        const scientificExecutionTraceLedger = adoptionTrace?.ledger() ?? (correlatedTrace?.traceRunId
          ? recordProductErrorBoundary({
            ledger: current.scientificExecutionTraceLedger,
            traceRunId: correlatedTrace.traceRunId,
            turnId: correlatedTrace.turnId,
            conversationId: current.conversationId,
            startedAt: now,
            failedAt: now,
            owner: "TRACE",
            responsibilityOwner: "RESEARCH_PROJECT",
            executor: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
            componentId: "PRJ001_CONTRIBUTION_OWNER_BOUNDARY",
            componentVersion: "1.0.0",
            provider: "NONE",
            code: "PROJECT_CONFIRMATION_BOUNDARY_FAILED",
            category: "BOUNDARY_REJECTION",
            sourceDigest: contribution.identity.contributionDigest,
            project: current.project,
          })
          : current.scientificExecutionTraceLedger);
        return {
        ...current,
        entries: workingReview ? current.entries : [...current.entries, {
          entryId: createConversationEntryId(), kind: "ERROR" as const, role: "NOXIA" as const,
          content: current.project?.versionId !== session.project?.versionId
            ? "Le projet est à jour, mais NOXIA n’a pas pu formuler la prochaine étape. Vous pouvez poursuivre librement."
            : "NOXIA n’a pas pu mettre à jour cette partie du projet. Votre contribution reste disponible pour réessayer.",
          createdAt: now,
        }],
        scientificExecutionTraceLedger,
        updatedAt: now,
      };
      });
      return null;
    } finally {
      confirmationInFlightRef.current = null;
      setBusy(false);
    }
  };

  const validateStudyProposal = async (selectedOptions: readonly string[], selectedAtoms: readonly string[], expectedDigest: string) => {
    const composition = session.studyProposal;
    if (busy || !composition || composition.digest !== expectedDigest) return;
    try {
      const now = new Date().toISOString();
      const { userTurn, contribution, candidate } = stageStudyProposalSelection(session, composition, selectedOptions, selectedAtoms, now);
      await confirmContribution(contribution.identity.contributionId, { userTurn, originalText: userTurn.content,
        gatewayState: session.conversationLanguageGateway, traceLedger: session.scientificExecutionTraceLedger,
        stylePreference: null, selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs },
      { composition, selectedOptions, selectedAtoms, expectedDigest, contribution, candidate });
    } catch (error) {
      const message = error instanceof Error && error.message === "STUDY_PROPOSAL_DEPENDENCY_NOT_SELECTED"
        ? "Une proposition sélectionnée dépend d'un autre choix. Sélectionnez ce choix ou discutez une alternative ; rien n'a été enregistré."
        : "Ces choix n'ont pas pu être enregistrés. Les propositions et le projet confirmé sont conservés.";
      setSession(current => ({ ...current, entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: message, createdAt: new Date().toISOString() }] }));
    }
  };

  const disposeStudyProposal = (status: "REJECTED" | "DEFERRED", selectedOptions: readonly string[], selectedAtoms: readonly string[], digest: string) => {
    const composition = session.studyProposal;
    if (busy || !composition || composition.digest !== digest) return;
    try {
      const now = new Date().toISOString();
      setSession(stageStudyProposalDisposition(session, composition, status, selectedOptions, selectedAtoms, now));
    } catch { setSession(current => ({ ...current, entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: "Cette décision n'a pas été enregistrée. Le projet et les propositions sont conservés.", createdAt: new Date().toISOString() }] })); }
  };

  const rejectContribution = (
    contributionId: string,
    naturalDecision?: NaturalContributionDecisionContext,
  ) => {
    if (busy && !naturalDecision) return;
    const contribution = session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return;
    if (!contributionHasAcknowledgedPresentation(contributionId)) return;
    const now = new Date().toISOString();
    try {
      setSession(stageProjectRejection(session, contribution, contributionId, now, naturalDecision));
    } catch {
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: "Ce refus n’a pas pu être enregistré. Le projet reste inchangé.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
    }
  };

  const respondToConversationActionGroup = (entryId: string, input: {
    selectedActionRefs: readonly string[];
    freeTextRequest: string | null;
    defer: boolean;
  }) => {
    const respondedAt = new Date().toISOString();
    setSession((current) => respondToConversationActionGroupTransition(current, entryId, input, respondedAt));
  };

  function appendProductDocumentCommandResult(input: {
    command: { content: string; createdAt: string };
    assistantContent: string;
    projectionId?: string | null;
  }) {
    const answeredAt = new Date().toISOString();
    setSession((current) => ({
      ...current,
      runtimeTurns: [...current.runtimeTurns, { turnId: createTurnId(), role: "NOXIA", content: input.assistantContent, createdAt: answeredAt }],
      ...(input.projectionId !== undefined ? { openDocumentProjectionId: input.projectionId } : {}),
      entries: [...current.entries, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "USER",
        content: input.command.content,
        createdAt: input.command.createdAt,
      }, {
        entryId: createConversationEntryId(),
        kind: "TEXT",
        role: "NOXIA",
        content: input.assistantContent,
        createdAt: answeredAt,
      }],
      updatedAt: answeredAt,
    }));
  }

  function dispatchProductDocumentAction(action: ProductDocumentAction, command: { content: string; createdAt: string }) {
    const result = prepareProductDocumentAction(session, action);
    appendProductDocumentCommandResult({ command, ...result });
    if (result.clearProjection) setSession((current) => ({ ...current, openDocumentProjectionId: null }));
    if (result.openDeliverables) setDeliverableWorkspaceOpen(true);
  }

  function acquireSources() {
    if (!session.project) return;
    try {
      const evidence = acquireDocumentKnowledge(session, new Date().toISOString());
      setSession((current) => ({ ...current, ...evidence }));
      setDocumentMessage(`${evidence.sourceLibrary.sources.length} source(s) du corpus local conservée(s). Les qualifications existantes sont distinctes de votre intérêt pour ces références.`);
    } catch {
      setDocumentMessage("Les sources ne peuvent pas être préparées dans cet état. Le projet et les documents sont conservés ; aucune recherche externe n’a été lancée.");
    }
  }

  function handleDocumentInstruction(instruction: string, recordUser = true, sourceTurnRef = createTurnId()) {
    const timestamp = new Date().toISOString();
    const result = prepareDocumentInstruction(session, administration, instruction, sourceTurnRef, timestamp);
    if (!result) return;
    setDocumentMessage(result.message);
    if (result.forwardToScience) {
      setSourceLibraryOpen(false); setDeliverableWorkspaceOpen(false);
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      void submitText(instruction);
      return;
    }
    setSession((current) => ({ ...current, ...result.update, updatedAt: timestamp,
      entries: [...current.entries, ...(recordUser ? [{ entryId: sourceTurnRef, kind: "TEXT" as const, role: "USER" as const, content: instruction, createdAt: timestamp }] : []),
        { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const, content: result.message, createdAt: timestamp }],
    }));
    if (result.closeSourceLibrary) setSourceLibraryOpen(false);
  }

  const requestCorrection = () => {
    setCorrectionMode(true);
    composerRef.current?.focus();
  };

  const preparationReview = autonomousProjectBuild ? projectPreparationReview(session) : null;
  const preparedFinalization = preparationReview?.prepared ?? null;
  const visibleConfirmationReceipt = session.conversationConfirmationReceipts?.at(-1);
  const confirmationReceiptStatus = visibleConfirmationReceipt
    ? conversationConfirmationReceiptStatus(session, visibleConfirmationReceipt) : null;

  const confirmProject = async (selectedChangeRefs?: readonly string[]) => {
    const current = latestSessionRef.current;
    const review = projectPreparationReview(current);
    const adoptionTrace = createProjectAdoptionTrace(current, review, selectedChangeRefs);
    adoptionTrace.received();
    if (!review || !projectPreparationConfirmationApplicable(review, busy, workingDraftBusy, selectedChangeRefs)) {
      setReviewError("Relisez le périmètre de cette préparation avant de confirmer. Une base incompatible exige une nouvelle préparation.");
      adoptionTrace.fail(new Error("PROJECT_REVIEW_NOT_APPLICABLE"), current.project);
      setSession(value => ({ ...value, scientificExecutionTraceLedger: adoptionTrace.ledger() }));
      return null;
    }
    const { prepared, composition, checkpoint } = review;
    setReviewError(null);
    const { scope, userTurn } = projectPreparationConfirmationInput(review, createTurnId(), new Date().toISOString());
    try {
    const result = await confirmContribution(prepared.contribution.identity.contributionId, {
      userTurn, originalText: "Valider ces choix", gatewayState: current.conversationLanguageGateway,
      traceLedger: adoptionTrace.ledger(), stylePreference: null,
      selectedChangeRefs: selectedChangeRefs ?? prepared.candidate.humanReviewProjection.coveredChangeRefs,
      prepareRemainingTurn: false,
    }, { composition, selectedOptions: scope.selectedOptionRefs, selectedAtoms: scope.selectedAtomRefs,
      expectedDigest: composition.digest, contribution: prepared.contribution, candidate: prepared.candidate }, adoptionTrace);
    if (result && typeof result === "object") {
      const adopted = recordPreparationDecision(result, checkpoint.preparationId, "ADOPTED");
      latestSessionRef.current = adopted;
      setSession(adopted);
      return adopted;
    }
    if (result === false) {
      adoptionTrace.fail(new Error("PROJECT_CONFIRMATION_OWNER_NOT_ENTERED"), latestSessionRef.current.project);
      setSession(value => ({ ...value, scientificExecutionTraceLedger: adoptionTrace.ledger() }));
    }
    return result;
    } catch (error) {
      // Preserve the existing rejection; only retain its passive observation.
      adoptionTrace.fail(error, latestSessionRef.current.project);
      setSession(value => ({ ...value, scientificExecutionTraceLedger: adoptionTrace.ledger() }));
      throw error;
    }
  };

  const reset = () => {
    if (onNewProject) { onNewProject(); return; }
    clearFunctionalResetSession(window.localStorage);
    setSession(createFunctionalResetSession());
    setDraft("");
    setBusy(false);
    setCorrectionMode(false);
    setDeliverableWorkspaceOpen(false);
    setPostAdoptionContinuationJob(null);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const openProjection = functionalProtocolProjection(session.documents, session.openDocumentProjectionId);
  const recordOpenProjectionArtifact = (format: "HTML", generatedAt: string) => {
    if (!openProjection) return;
    setSession((current) => {
      const correlatedTrace = [...current.bridgeTraces]
        .reverse()
        .find((trace) => trace.traceRunId && trace.projectVersionAfter === openProjection.source.projectVersion);
      return {
        ...current,
        scientificExecutionTraceLedger: recordArtifactGeneratedTrace({
          ledger: current.scientificExecutionTraceLedger,
          traceRunId: correlatedTrace?.traceRunId,
          conversationId: current.conversationId,
          generatedAt,
          projection: openProjection,
          format,
        }),
      };
    });
  };
  const protocolCard = session.documents.cards.find((card) => card.kind === "PROTOCOL");
  const documentLifecycle = useMemo(() => session.project
    ? projectDocumentLifecycle(session.documents.projections, session.drciDraftPacks ?? [], session.project) : null,
    [session.project, session.documents.projections, session.drciDraftPacks]);
  const currentProtocolProjection = session.project
    ? [...session.documents.projections].reverse().find((projection) => projection.projectionType === "PROTOCOL"
      && projection.source.projectId === session.project!.projectId
      && isFunctionalDocumentProjectionCurrent(projection, session.project!, administration)) ?? null
    : null;
  const deliverablePortfolio = useMemo(() => {
    if (!session.project) return null;
    const portfolio = buildStudyDeliverablePortfolio({ project: session.project, protocolProjection: currentProtocolProjection,
      generatedAt: currentProtocolProjection?.requestedAt ?? session.project.adoptedAt });
    const pack = documentLifecycle?.currentPack;
    return pack ? projectDrciDraftPackPortfolio(portfolio, pack, session.project) : portfolio;
  }, [currentProtocolProjection, session.project, documentLifecycle]);
  const activeRouteIntent = [...session.bridgeTraces]
    .reverse()
    .find((trace) => trace.entryRouting)?.entryRouting?.routeIntent;
  const workspaceTitle = session.workspace?.title?.trim() || "Projet sans titre";
  const hasNamedProject = workspaceTitle !== "Projet sans titre";
  const projectPanel = <ResearchProjectPanel
    project={session.project}
    documents={session.documents}
    mode={projectionMode}
    onOpenProtocol={(projectionId) => {
      setDeliverableWorkspaceOpen(false);
      setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }));
    }}
    onRequestProtocol={() => requestProtocolProjection()}
    onCompleteAdministration={onEditAdministration}
    deliverablePortfolio={deliverablePortfolio}
    queryNavigation={session.queryNavigation}
    suppressDocumentAction={Boolean(busy || (!session.project && preparedFinalization) || session.documentRetryUnsafe || documentGenerationPending)}
    showDocumentAction={!deliverableWorkspaceOpen && !sourceLibraryOpen}
    documentActionDisabledReason={session.documentRetryUnsafe
      ? "Le résultat de la dernière génération est incertain ; aucune nouvelle génération n’est autorisée depuis cette page."
      : documentGenerationPending ? "Une génération documentaire est déjà en cours."
        : !session.project && preparedFinalization ? "Validez d’abord les choix proposés."
          : busy ? "Attendez la fin de la réponse en cours." : undefined}
    onOpenDeliverables={() => {
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      setDeliverableWorkspaceOpen(true);
    }}
  />;
  const projectFinalizationCard = preparationReview ? <ProjectFinalizationCard
    key={`${preparationReview.checkpoint.preparationId}:${preparationReview.newerTurns.map(t => t.turnId).join(":")}`}
    contribution={preparationReview.prepared.contribution} candidate={preparationReview.prepared.candidate}
    currentProject={session.project} workingDraft={preparationReview.workingDraft}
    disabled={busy || workingDraftBusy || !preparationReview.applicable || Boolean(preparationReview.blocker)}
    error={preparationReview.blocker === "PROJECT_BASE_CHANGED"
      ? "La version du projet a changé. Cette revue est conservée ; préparez une nouvelle mise à jour depuis la version courante."
      : preparationReview.blocker ? "Un refus, une correction ou un binding incompatible empêche l’adoption de cette revue. Préparez une nouvelle mise à jour intégrant les échanges concernés."
        : reviewError}
    capturedAt={preparationReview.checkpoint.capturedAt} newerTurns={preparationReview.newerTurns}
    onConfirm={refs => void confirmProject(refs)}
    onAbandon={() => setSession(current => recordPreparationDecision(current, preparationReview.checkpoint.preparationId, "ABANDONED"))}
  /> : null;
  const currentDrciDraftPack = session.project
    ? documentLifecycle?.currentPack
    : null;
  const adoptedProjectDocumentAction = !preparedFinalization && session.project && !session.documentRetryUnsafe ? <section
      className="mb-3 rounded-2xl border bg-background p-5 shadow-sm"
      data-testid="adopted-project-document-generation"
    >
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Documents du projet</p>
      <h2 className="mt-1 text-xl font-semibold">Choix enregistrés dans le projet · version {session.project.revision}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{currentDrciDraftPack ? "Une version documentaire existe déjà. Une nouvelle génération sera conservée séparément." : "Générez les quatre documents de travail depuis cette version du projet."}</p>
      <button type="button" disabled={documentGenerationPending || busy} onClick={() => void requestProtocolProjection()}
        className="mt-4 min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
        Générer les documents
      </button>
    </section> : null;
  const documentGenerationRecovery = !preparedFinalization && session.project && session.documents.lastFailure ? <section
    className="border-t bg-destructive/5 px-4 py-4 sm:px-5"
    data-testid="document-generation-recovery"
  >
    <p className="text-sm font-semibold">Documents indisponibles</p>
    <p className="mt-1 text-sm text-muted-foreground">La génération des documents n’a pas abouti. Votre projet et les versions précédentes sont conservés.</p>
    {!!session.documents.lastFailure.operationEvidence?.succeededCallIds.length && <p className="mt-1 text-sm text-muted-foreground">Une partie du travail fournisseur a abouti. Ses preuves sont conservées, mais aucun dossier complet n’a été enregistré pour cette tentative.</p>}
    {documentRecoveryRef.current?.projectDigest === session.project.projectDigest
      ? <button type="button" disabled={documentGenerationPending} onClick={() => void documentRecoveryRef.current?.resume()}
          className="mt-3 min-h-10 rounded-xl border bg-background px-3 text-sm font-medium disabled:opacity-40">Retrouver les documents</button>
      : <p className="mt-2 text-xs text-muted-foreground">{session.documentRetryUnsafe ? "Le résultat de l’opération est incertain ; aucune nouvelle génération n’est autorisée depuis cette page." : "Le projet et les anciennes versions sont conservés. Vous pouvez relancer une génération explicite."}</p>}
  </section> : null;



  return <main
    id="demo-main"
    className="min-h-screen bg-muted/30 text-foreground"
    data-testid="functional-reset-workspace"
    data-product-mode={projectionMode}
  >
    <Helmet>
      <title>Protocol Designer — NOXIA</title>
      <meta name="description" content="Concevez et révisez un protocole scientifique sourcé dans une conversation continue." />
      <meta name="robots" content="noindex, follow" />
    </Helmet>

    {sessionSaveWarning && !session.drciDraftPacks?.length && !onSessionChange
      && <p role="alert" className="m-4 rounded-xl border p-4 text-sm">{sessionSaveWarning}</p>}
    <div className="mx-auto max-w-[1480px] px-4 pb-5 sm:px-6 lg:px-8">
      <header className="sticky top-16 z-40 -mx-4 mb-5 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" data-testid="project-top-navigation">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">NOXIA · Protocol Designer<DeployedCommitVersion /></p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{projectionMode === "EXPERT" ? "Diagnostic technique" : hasNamedProject ? workspaceTitle : "Construisons votre projet scientifique"}</h1>
              {projectionMode === "STANDARD" && onRenameProject && <button type="button" onClick={onRenameProject} aria-label={`Renommer ${workspaceTitle}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>}
              {projectionMode === "EXPERT" && <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground/70" data-testid="protocol-designer-development-version">{formatProductDevelopmentVersion(
                typeof __NOXIA_BUILD_GIT_SHA__ === "undefined" ? null : __NOXIA_BUILD_GIT_SHA__,
              )}</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{projectionMode === "STANDARD" ? "Conception de l’étude" : workspaceTitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          {onLeaveWorkspace && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={onLeaveWorkspace} className="min-h-11 rounded-xl border bg-background px-3 text-sm font-medium">← Mes projets</button>}
          {onOpenProfile && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={onOpenProfile} className="min-h-11 rounded-xl border bg-background px-3 text-sm">Profil / organisation</button>}
          {onEditAdministration && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={onEditAdministration} className="min-h-11 rounded-xl border bg-background px-3 text-sm">Informations du projet</button>}
          {session.project && <button type="button" disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={() => setSourceLibraryOpen(true)} className="min-h-11 rounded-xl border bg-background px-3 text-sm">Sources</button>}
          <Sheet open={workingProjectOpen} onOpenChange={setWorkingProjectOpen}>
            <SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm font-medium"><MessageSquareText className="h-4 w-4" />Voir mon projet</button></SheetTrigger>
            <SheetContent side="left" className="w-[min(92vw,420px)] overflow-y-auto p-4">
              <SheetHeader className="sr-only"><SheetTitle>Projet de recherche</SheetTitle><SheetDescription>État actuel du projet et des documents.</SheetDescription></SheetHeader>
              <div className="space-y-4 pt-7">{projectPanel}
                <section aria-label="Propositions et points ouverts"><h2 className="text-base font-semibold">Propositions et points ouverts</h2>
                  <p className="mb-3 text-sm text-muted-foreground">Les propositions de la conversation restent en discussion jusqu’à confirmation des choix à enregistrer.</p>
                  {!session.entries.some(entry => entry.kind === "REVIEW") && <p className="text-sm text-muted-foreground">Les pistes discutées figurent dans la conversation. Aucun choix n’est encore soumis à confirmation.</p>}
                  {session.entries.filter(entry => entry.kind === "REVIEW").map(entry => entry.kind === "REVIEW" && <ContributionReview
                    key={entry.entryId} contribution={entry.contribution} candidate={entry.candidate ?? prepareResearchProjectContributionCandidate(entry.contribution, projectExistedForReview(session.entries.indexOf(entry)) ? session.project : null)}
                    status={entry.status} reviewDecision={entry.decision} decisionPartition={entry.decisionPartition} expanded readOnly
                    onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />)}
                </section>
              </div>
            </SheetContent>
          </Sheet>
          <details className="relative">
            <summary aria-label="Plus d’options" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border bg-background text-xl marker:hidden">⋯</summary>
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-background p-1 shadow-xl">
              <button type="button" onClick={() => setProjectionMode((mode) => mode === "STANDARD" ? "EXPERT" : "STANDARD")} className="min-h-10 w-full rounded-lg px-3 text-left text-sm hover:bg-muted">{projectionMode === "STANDARD" ? "Diagnostic technique" : "Quitter le diagnostic"}</button>
              <button type="button" aria-label={onNewProject ? "Nouveau projet" : "Recommencer"} disabled={busy || Boolean(postAdoptionContinuationJob)} onClick={reset} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted"><RotateCcw className="h-4 w-4" />{onNewProject ? "Nouveau projet" : "Recommencer"}</button>
            </div>
          </details>
          </div>
        </div>
      </header>
      <ProjectContinuum documentsAvailable={Boolean(session.project || preparedFinalization)} documentsOpen={Boolean(openProjection) || deliverableWorkspaceOpen}
        disabled={busy || Boolean(postAdoptionContinuationJob)}
        onConversation={() => { setSourceLibraryOpen(false); setDeliverableWorkspaceOpen(false); setSession((current) => ({ ...current, openDocumentProjectionId: null })); }}
        onDocuments={() => { setSourceLibraryOpen(false); setSession((current) => ({ ...current, openDocumentProjectionId: null })); setDeliverableWorkspaceOpen(true); }} />

      {projectionMode === "EXPERT" && <DevelopmentDiagnostics session={session} />}

      <div className="grid min-w-0 gap-5 lg:h-[calc(100dvh-13rem)] lg:min-h-[30rem] lg:grid-cols-[minmax(310px,.72fr)_minmax(0,1.5fr)]">
        <div className="hidden min-h-0 min-w-0 lg:block lg:overflow-y-auto lg:overscroll-contain" data-testid="project-scroll-panel">{projectPanel}</div>

        {sourceLibraryOpen ? <ProjectSourceLibraryView library={session.sourceLibrary} documents={session.documents.projections} onAcquire={acquireSources} onInstruction={handleDocumentInstruction} onClose={() => setSourceLibraryOpen(false)} message={documentMessage} /> : deliverableWorkspaceOpen && !session.project && projectFinalizationCard ? <section
          aria-labelledby="project-documents-title"
          className="min-w-0 rounded-3xl border bg-background shadow-sm"
          data-testid="project-document-finalization-workspace"
        >
          <header className="border-b px-5 py-5 sm:px-6">
            <button type="button" onClick={() => setDeliverableWorkspaceOpen(false)} className="min-h-10 rounded-lg border px-3 text-sm font-medium">← Retour à la conversation</button>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-primary">Protocole / documents</p>
            <h2 id="project-documents-title" className="mt-1 text-2xl font-semibold">Documents du projet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Confirmez les décisions scientifiques. Vous pourrez ensuite générer les documents séparément.</p>
          </header>
          {busy && <p role="status" className="border-b bg-primary/5 px-5 py-3 text-sm font-medium">
            Validation des choix…
          </p>}
          {projectFinalizationCard}
        </section> : deliverableWorkspaceOpen && deliverablePortfolio ? <div className="min-w-0">
          {documentGenerationPending && <p role="status" className="mb-3 rounded-xl border bg-primary/5 px-5 py-3 text-sm font-medium">Génération des documents en cours…</p>}
          {adoptedProjectDocumentAction}
          {documentGenerationRecovery}
          <StudyDeliverableWorkspace
          portfolio={deliverablePortfolio}
          documentPacks={session.drciDraftPacks}
          projectId={session.project?.projectId}
          saveWarning={documentSaveWarning ?? sessionSaveWarning}
          onClose={() => setDeliverableWorkspaceOpen(false)}
          />
        </div> : openProjection ? <ProtocolPreview
          onDocumentInstruction={handleDocumentInstruction}
          documentMessage={documentMessage}
          projection={openProjection}
          stale={!session.project || !isFunctionalDocumentProjectionCurrent(openProjection, session.project, administration)}
          onClose={() => setSession((current) => ({ ...current, openDocumentProjectionId: null }))}
          onArtifactGenerated={recordOpenProjectionArtifact}
          onCompleteAdministration={onEditAdministration}
          onRegenerate={() => requestProtocolProjection()}
          history={session.documents.projections}
          onOpenVersion={(projectionId) => setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }))}
        /> : <section aria-label="Conversation" className="flex min-h-[calc(100vh-7.5rem)] min-w-0 flex-col rounded-3xl border bg-background shadow-sm lg:h-full lg:min-h-0">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Conversation</h2>
          </div>

          <div ref={conversationScrollRef} onScroll={event => setConversationScrolled(event.currentTarget.scrollTop > 320)}
            className="min-h-0 flex-1 space-y-5 px-4 py-5 sm:px-6 lg:overflow-y-auto lg:overscroll-contain"
            aria-live="polite" data-testid="conversation-scroll-panel">
            {session.entries.map((entry, index) => entry.kind === "FOLLOW_UP_ACTIONS"
              ? <StandardConversationActionGroup
                key={entry.entryId}
                presentation={entry.presentation}
                response={entry.response}
                actionable={!entry.response
                  && session.project?.versionId === entry.presentation.sourceProjectVersion
                  && session.project?.projectDigest === entry.presentation.sourceProjectDigest}
                onRespond={(input) => respondToConversationActionGroup(entry.entryId, input)}
              />
              : entry.kind === "REVIEW"
              ? preparedFinalization?.contribution.identity.contributionId === entry.contribution.identity.contributionId
                && entry.status === "PENDING" ? null
              : session.entries.some((item) => item.entryId === `${entry.entryId}:presentation-failure`)
                || session.retainedContributionCandidates?.some((candidate) => candidate.candidateRef === entry.contribution.identity.contributionId
                  && candidate.downstreamState === "DOWNSTREAM_FAILED_NOT_PRESENTED") ? null : <ContributionReviewPresentation
                key={entry.entryId}
                presentationRef={entry.entryId}
                onPresented={() => acknowledgeContributionReviewPresented(entry.entryId)}
                onPresentationFailure={(failure) => recordContributionReviewPresentationFailure(entry.entryId, failure)}
                renderReview={() => <ContributionReview
                contribution={entry.contribution}
                candidate={entry.candidate ?? prepareResearchProjectContributionCandidate(
                  entry.contribution,
                  projectExistedForReview(index) ? session.project : null,
                )}
                currentProject={projectExistedForReview(index) ? session.project : null}
                status={entry.status}
                reviewDecision={entry.decision}
                decisionPartition={entry.decisionPartition}
                actionable={session.pendingContribution?.identity.contributionId === entry.contribution.identity.contributionId}
                disabled={busy || autonomousProjectBuild && workingDraftBusy}
                detailedUnderstanding={import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" ? undefined : session.studyProposal?.recomputation?.contributionRef === entry.contribution.identity.contributionId
                  && entry.status === "PENDING" ? <StudyProposalReview composition={session.studyProposal} project={session.project}
                    readOnly onValidate={() => undefined} onDiscuss={() => undefined} /> : entry.decision?.targets.some(ref => entry.candidate?.humanReviewProjection.coveredChangeRefs.includes(ref)) ? undefined : <UnderstandingReviewCard
                  contribution={entry.contribution}
                  status={entry.status === "REJECTED" ? "CORRECTION_REQUESTED" : entry.status}
                  onConfirm={() => undefined}
                  onCorrect={() => undefined}
                  onAdd={() => undefined}
                  presentationOnly
                />}
                onConfirm={() => confirmContribution(entry.contribution.identity.contributionId)}
                onConfirmScope={import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" ? selectedChangeRefs => {
                  const now = new Date().toISOString();
                  const text = "Je confirme uniquement les éléments sélectionnés dans cette revue ; les autres restent en discussion.";
                  void confirmContribution(entry.contribution.identity.contributionId, {
                    userTurn: { turnId: createTurnId(), role: "USER", content: text, createdAt: now }, originalText: text,
                    gatewayState: session.conversationLanguageGateway, traceLedger: session.scientificExecutionTraceLedger,
                    stylePreference: null, selectedChangeRefs,
                  });
                } : undefined}
                onCorrect={requestCorrection}
                onReject={() => rejectContribution(entry.contribution.identity.contributionId)}
              />}
              />
              : entry.kind === "STUDY_DESIGN_PROPOSAL"
                ? <StudyDesignStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readStudyDesignProposalFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.studyDesignInteraction?.ownerResultRef ?? "",
                  })?.proposalId === entry.presentation.proposalRef ? session.studyDesignInteraction : null}
                  onSelect={(optionRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === optionRef);
                    if (option) applyStudyDesignInput(`Je retiens l’option « ${option.label} » pour revue.`, optionRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "OBSERVABILITY_PROPOSAL"
                ? <ObservabilityStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readObservabilityResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.observabilityInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.observabilityInteraction : null}
                  onSelect={(measurementRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === measurementRef);
                    if (option) applyObservabilityInput(`Je retiens la mesure « ${option.measurementLabel} » pour revue.`, measurementRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "IMAGING_PROPOSAL"
                ? <ImagingStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readImagingResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.imagingInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.imagingInteraction : null}
                  onSelect={(optionRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === optionRef);
                    if (option) applyImagingInput(`Je retiens la stratégie ${option.acquisitionLabel ?? option.modalityLabel} pour revue.`, optionRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "BIOSTATISTICS_PROPOSAL"
                ? <BiostatisticsStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readBiostatisticsResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.biostatisticsInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.biostatisticsInteraction : null}
                  onSelect={(strategyRef) => {
                    const option = entry.presentation.options.find((candidate) => candidate.optionRef === strategyRef);
                    if (option) applyBiostatisticsInput(`Je retiens la stratégie « ${option.label} » pour revue.`, strategyRef);
                  }}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "CDM_RESULT"
                ? <CanonicalStudyDataStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readCanonicalStudyDataResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.canonicalStudyDataInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.canonicalStudyDataInteraction : null}
                  onContinue={continueFromCanonicalStudyData}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : entry.kind === "DATA_MANAGEMENT_RESULT"
                ? <DataManagementStandardCard
                  key={entry.entryId}
                  presentation={entry.presentation}
                  interaction={readDataManagementResultFromLedger({
                    ledger: session.knowledgeOwnerLedger,
                    resultRef: session.dataManagementInteraction?.ownerResultRef ?? "",
                  })?.resultId === entry.presentation.resultRef ? session.dataManagementInteraction : null}
                  onDiscuss={() => {
                    setDraft("");
                    composerRef.current?.focus();
                  }}
                />
              : <article key={entry.entryId} data-testid={entry.kind === "TEXT" && entry.reviewInvitation ? "project-review-invitation" : undefined} ref={entry.role === "NOXIA" && entry.kind === "TEXT" && !session.entries.slice(index + 1).some(item => item.kind === "TEXT" && item.role === "NOXIA") ? latestReplyRef : undefined} className={`scroll-mt-64 flex ${entry.role === "USER" ? "justify-end" : "justify-start"}`}>
                {entry.kind === "TEXT" && entry.role === "NOXIA" && entry.knowledgePresentation
                  ? <ProductUnderstandResponse presentation={entry.knowledgePresentation} />
                  : <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                    entry.kind === "ERROR" ? "border border-destructive/40 bg-destructive/10 text-destructive"
                      : entry.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`} role={entry.kind === "ERROR" ? "alert" : undefined}>{entry.content}</div>}
              </article>)}
            {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{busyMessage}</div></div>}
            {autonomousProjectBuild && workingDraftBusy && <div role="status" className="px-4 py-2 text-xs text-muted-foreground">Structuration du projet en cours…</div>}
            {confirmationReceiptStatus && <div role="status" data-testid="conversation-confirmation-receipt"
              className="mx-4 rounded-xl border bg-primary/5 px-4 py-2 text-xs sm:mx-5">
              {confirmationReceiptStatus === "PREPARATION_FAILED"
                ? "Accord enregistré sur la proposition précédente ; la préparation a échoué. Le projet reste inchangé."
                : confirmationReceiptStatus === "SUPERSEDED"
                  ? "Accord conservé sur la proposition précédente ; un échange plus récent a remplacé sa préparation."
                  : confirmationReceiptStatus === "INTERRUPTED/UNKNOWN"
                    ? "Accord conservé sur la proposition précédente ; le résultat de sa préparation n’est pas vérifié."
                    : "Accord enregistré sur la proposition précédente — revue requise."}
            </div>}
            {autonomousProjectBuild && !workingDraftBusy && ["FAILED", "UNKNOWN/INTERRUPTED", "SUPERSEDED", "NO_CHANGE"].includes(session.workingDraftPreparations?.at(-1)?.status ?? "") && <div role="alert"
              data-testid="working-draft-terminal-status" className="mx-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-xs sm:mx-5">
              {session.workingDraftPreparations?.at(-1)?.status === "UNKNOWN/INTERRUPTED"
                ? "La préparation a été interrompue ; son résultat n’est pas vérifié. La conversation et le dernier projet sont conservés."
                : session.workingDraftPreparations?.at(-1)?.status === "SUPERSEDED"
                  ? "Cette préparation historique a été remplacée ; son résultat ne peut pas être validé."
                  : session.workingDraftPreparations?.at(-1)?.status === "NO_CHANGE"
                    ? "Cet échange ne crée pas de nouveaux choix à valider. La conversation et le dernier projet sont conservés."
                  : ["WORKING_DRAFT_PROVIDER_INCOMPLETE", "WORKING_DRAFT_INCOMPLETE_MAX_OUTPUT_TOKENS"].includes(session.workingDraftPreparations?.at(-1)?.code ?? "")
                    ? "La génération de cette préparation s’est interrompue côté fournisseur. Aucun nouveau projet n’a été créé ; la conversation et le dernier projet sont conservés."
                  : session.workingDraftPreparations?.at(-1)?.code === "WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID"
                    ? "La source liée à cette préparation ne satisfait pas le contrat d’entrée scientifique. Aucune génération payante n’a été lancée ; la conversation et le projet sont conservés."
                  : session.workingDraftPreparations?.at(-1)?.code?.includes("DEPENDENCY_CYCLE")
                    ? "La préparation a échoué : des dépendances scientifiques forment un cycle. Aucune revue adoptable n’a été créée. La conversation et le projet sont conservés."
                  : "La structuration du projet n’a pas abouti. La conversation et le dernier projet sont conservés ; vous pouvez poursuivre la discussion."}
              {session.workingDraftPreparations?.at(-1)?.code && <details className="mt-1"><summary>Diagnostic de cette préparation</summary><code>{session.workingDraftPreparations.at(-1)!.code}</code></details>}
            </div>}
            <div ref={endRef} />
          </div>

          {conversationScrolled && <button type="button" aria-label="Retour en haut de la conversation"
            className="hidden min-h-10 self-end rounded-xl border bg-background px-3 text-sm lg:mr-5 lg:inline-flex lg:items-center lg:gap-1"
            onClick={() => conversationScrollRef.current?.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>
            <ArrowUp className="h-4 w-4" /> Haut
          </button>}
          {import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME !== "TERRA" && session.studyProposal && (!session.studyProposal.recomputation || session.pendingContribution?.identity.contributionId !== session.studyProposal.recomputation.contributionRef) && <div className="px-4 pb-4 sm:px-5"><StudyProposalReview key={session.studyProposal.digest}
            composition={session.studyProposal} project={session.project} disabled={busy} onValidate={validateStudyProposal} onDisposition={disposeStudyProposal}
            onDiscuss={subject => { setDraft(`Je souhaite discuter ${subject} : `); }} /></div>}
          {projectFinalizationCard}
          {autonomousProjectBuild && <div className="border-t px-4 py-3 sm:px-5">
            <button type="button" onClick={() => void preparationController.start()}
              disabled={busy || !canCaptureProjectPreparation(session)}
              className="min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-40">
              Préparer la mise à jour du projet
            </button>
            <p className="mt-1 text-xs text-muted-foreground">{busy
              ? "Attendez la réponse complète : elle ne sera pas capturée avant sa fin."
              : workingDraftBusy ? "La préparation existante utilise les échanges figés au lancement. Aucun second calcul ne sera lancé."
                : !canCaptureProjectPreparation(session) ? "Échangez d’abord avec NOXIA pour disposer d’une réponse complète à préparer."
                : "Capture les échanges jusqu’à la dernière réponse complète. Le projet ne change qu’après votre validation explicite de la revue."}</p>
          </div>}
          <form onSubmit={submit} className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur sm:p-5" data-testid="conversation-composer">
            {!autonomousProjectBuild && import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" && session.runtimeTurns.some(turn => turn.role === "USER") && <button
              type="button" disabled={busy} className="mb-2 min-h-9 rounded-lg border px-3 text-sm disabled:opacity-40"
              onClick={() => void submitTerraText("Je retiens les choix de travail de vos propositions précédentes, tels que corrigés par mes messages, pour préparer leur enregistrement. Présentez une revue groupée avant toute adoption.", true)}
            >Préparer l’enregistrement</button>}
            {correctionMode && <p className="mb-2 text-sm font-medium text-primary">Décrivez librement ce que vous souhaitez corriger. Vous pouvez regrouper plusieurs changements dans un seul message.</p>}
            <label htmlFor="protocol-designer-message" className="sr-only">Votre message</label>
            <div className="flex flex-wrap items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <textarea
                ref={composerRef}
                id="protocol-designer-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={3}
                maxLength={4_000}
                placeholder={correctionMode ? "Ce que je souhaite corriger…" : productEntryPromptForIntent(activeRouteIntent)}
                className="min-h-[4.5rem] max-h-[28dvh] min-w-0 basis-full resize-none overflow-y-auto bg-transparent px-3 py-2 text-sm outline-none sm:max-h-[min(35dvh,16.5rem)] sm:basis-0 sm:flex-1 lg:resize-y"
              />
              <VoiceDictationControl disabled={busy} language="fr-FR" onTranscript={insertVoiceTranscript} />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Envoyer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
            </div>
          </form>
        </section>}
      </div>
    </div>
    {(documentGenerationPending || documentGenerationComplete) && <aside role="status" aria-label="Progression de la génération documentaire"
      className="fixed bottom-24 right-4 z-50 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border bg-background p-3 shadow-xl lg:bottom-28"
      data-testid="document-generation-progress">
      <button type="button" className="flex min-h-8 w-full items-center justify-between gap-2 text-left text-sm font-semibold"
        aria-expanded={documentProgressExpanded} onClick={() => setDocumentProgressExpanded(value => !value)}>
        <span>Documents V{documentGenerationVersion} {documentGenerationComplete ? "disponibles" : "en cours"}</span>
        <span aria-hidden="true">{documentProgressExpanded ? "−" : "+"}</span>
      </button>
      {documentProgressExpanded && <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        <div role="progressbar" aria-label="Progression estimée des documents" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={documentGenerationComplete ? 100 : Math.min(90, Math.round(documentGenerationElapsed / 240 * 90))}
          className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${documentGenerationComplete ? 100 : Math.min(90, Math.round(documentGenerationElapsed / 240 * 90))}%` }} />
        </div>
        <p>{documentGenerationComplete ? "Génération terminée." : "Progression temporelle estimée ; vérification en attente du résultat réel."}</p>
        <p>{Math.floor(documentGenerationElapsed / 60)} min {String(documentGenerationElapsed % 60).padStart(2, "0")} s écoulées · durée habituelle : 3–4 min</p>
      </div>}
    </aside>}
  </main>;
}
