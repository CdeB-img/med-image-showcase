import { useConversationTurn } from "./useConversationTurn";
import { useProjectPreparation } from "./useProjectPreparation";
import { useVersionProduction } from "./useVersionProduction";
import { canCaptureProjectPreparation, projectPreparationReview, recordPreparationDecision } from "./project-preparation-lifecycle";
import { createProjectAdoptionTrace, type ProjectAdoptionTrace } from "./project-adoption-trace";
import ProjectFinalizationCard from "./ProjectFinalizationCard";
import { persistAdoptedProjectSession } from "./project-adoption-effects";
import { projectDrciDraftPackPortfolio } from "@/features/document-projection/drci-draft-pack";
import { projectDocumentLifecycle } from "@/features/document-projection/history";
import { isFunctionalDocumentProjectionCurrent } from "@/features/document-projection/functional-reset-boundary";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowUp, LoaderCircle, MessageSquareText, Pencil, RotateCcw } from "lucide-react";
import VoiceDictationControl from "@/features/protocol-designer/voice/VoiceDictationControl";
import { insertDictationAtCaret } from "@/features/protocol-designer/voice/voice-dictation-contract";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import { formatProductDevelopmentVersion } from "@/features/protocol-designer/product-development-version";
import DeployedCommitVersion from "@/features/protocol-designer/DeployedCommitVersion";
import { DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION, type ScientificTraceCaptureConfiguration } from "@/features/protocol-designer/scientific-execution-trace";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildStudyDeliverablePortfolio, functionalProtocolProjection } from "@/features/document-projection";
import { ContributionReviewPresentation, type ContributionReviewPresentationFailure } from "./ContributionReview";
import StudyProposalReview from "./StudyProposalReview";
import { assertStudyProposalCurrent } from "./study-proposal-standard";
import type { StudyProposalComposition } from "../product-bridge";
import UnderstandingReviewCard from "../conversation/UnderstandingReviewCard";
import DevelopmentDiagnostics from "./DevelopmentDiagnostics";
import { recordArtifactGeneratedTrace, recordProductErrorBoundary } from "./end-to-end-trace-adapter";
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
import { type ProductDocumentAction } from "./product-entry-routing";
import { clearFunctionalResetSession, createConversationEntryId, createFunctionalResetSession, createTurnId, loadFunctionalResetSession, saveFunctionalResetWorkspaceSession, type SessionSave, conversationConfirmationReceiptStatus, productEntryPromptForIntent, type FunctionalResetSession } from "./session";
import { readStudyDesignProposalFromLedger } from "./study-design-standard";
import { readObservabilityResultFromLedger } from "./observability-standard";
import { readImagingResultFromLedger } from "./imaging-standard";
import { readBiostatisticsResultFromLedger } from "./biostatistics-standard";
import { readCanonicalStudyDataResultFromLedger } from "./canonical-study-data-standard";
import { readDataManagementResultFromLedger } from "./data-management-standard";
import { documentAdministrationFrom } from "./project-administration";
import ProjectContinuum from "./ProjectContinuum";
import ProjectSourceLibraryView from "./ProjectSourceLibraryView";
import { acquireDocumentKnowledge } from "./documentary-conversation";
import { respondToConversationActionGroup as respondToConversationActionGroupTransition } from "./standard-conversation-action-group";
import { prepareDocumentInstruction, dispatchProductDocumentAction as prepareProductDocumentAction } from "./documentary-conversation";
import { prepareCanonicalStudyDataContinuationNavigation } from "./canonical-study-data-standard";
import ContributionReview from "./ContributionReview";
import { stageProjectConfirmation, stageProjectRejection, contributionHasAcknowledgedPresentation as hasAcknowledgedContributionPresentation, acknowledgeContributionReviewPresented as acknowledgeContributionReviewPresentedTransition, recordContributionReviewPresentationFailure as recordContributionReviewPresentationFailureTransition, type NaturalContributionDecisionContext } from "./project-review-decision";
import { projectPreparationConfirmationApplicable, projectPreparationConfirmationInput } from "./project-preparation-lifecycle";
import { stageStudyProposalSelection, stageStudyProposalDisposition } from "./project-review-decision";
import type { PostAdoptionContinuationJob } from "./post-adoption-continuation";
import { usePostAdoptionContinuation } from "./usePostAdoptionContinuation";
import { useDocumentGeneration, type DocumentGenerationStage } from "./useDocumentGeneration";
import { createDocumentArchiveClient } from "@/features/document-projection/generation-archive-client";
import { hasCurrentArchivedGeneration, hydrateDocumentCommandSession, persistTemplateGeneration, publishArchivedTemplate } from "@/features/document-projection/generation-session";

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
  const latestSessionRef = useRef(session);
  useEffect(() => { latestSessionRef.current = session; }, [session]);
  const preparationController = useProjectPreparation({ enabled: true, session,
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
  const [documentGenerationStage, setDocumentGenerationStage] = useState<DocumentGenerationStage>("PREPARING");
  const [documentGenerationStartedAt, setDocumentGenerationStartedAt] = useState<number | null>(null);
  const [documentGenerationElapsed, setDocumentGenerationElapsed] = useState(0);
  const [documentGenerationVersion, setDocumentGenerationVersion] = useState<number | null>(null);
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
    setDocumentSaveWarning, setDeliverableWorkspaceOpen, setDocumentGenerationVersion, setDocumentGenerationStartedAt, setDocumentGenerationElapsed, setDocumentGenerationComplete, setDocumentGenerationPending, setDocumentGenerationStage });
  const confirmationInFlightRef = useRef<string | null>(null);
  const versionProduction = useVersionProduction({ session, latest: latestSessionRef, setSession, save: onSessionChange,
    prepare: preparationController.start, generateDocuments: requestProtocolProjection, administration });

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
      if (!saved.scientificPersisted && session.documentArchive?.currentGenerationId) {
        const documentWarning = session.documentArchive?.currentGenerationId
          ? "Documents enregistrés dans l’archive ; lien local non enregistré dans ce navigateur. Les versions restent récupérables depuis l’archive du projet."
          : "Documents disponibles mais non enregistrés dans ce navigateur. Exportez le dossier avant de fermer cette page.";
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
  const acknowledgeContributionReviewPresented = (entryId: string) => {
    const presentedAt = new Date().toISOString();
    setSession((current) => acknowledgeContributionReviewPresentedTransition(current, entryId, presentedAt));
  };

  const recordContributionReviewPresentationFailure = (entryId: string, failure: ContributionReviewPresentationFailure) => {
    const failedAt = new Date().toISOString();
    setSession((current) => recordContributionReviewPresentationFailureTransition(current, entryId, failure, failedAt));
  };

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
    if (result.openDeliverables || result.projectionId && session.documentArchive?.storageMode === "DURABLE_ONLY") setDeliverableWorkspaceOpen(true);
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

  async function handleDocumentInstruction(instruction: string, recordUser = true, sourceTurnRef = createTurnId()) {
    const timestamp = new Date().toISOString();
    const source = latestSessionRef.current;
    if (!source.project) return;
    const client = createDocumentArchiveClient(source.sessionId, source.project);
    try {
    const loaded = await hydrateDocumentCommandSession(source, client, true);
    const result = prepareDocumentInstruction(loaded, administration, instruction, sourceTurnRef, timestamp);
    if (!result) return;
    setDocumentMessage(result.message);
    if (result.forwardToScience) {
      setSourceLibraryOpen(false); setDeliverableWorkspaceOpen(false);
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      void submitText(instruction);
      return;
    }
    let next = { ...latestSessionRef.current, ...result.update };
    if (next.sessionId !== source.sessionId || next.project?.projectDigest !== source.project.projectDigest) throw new Error("DOC_ARCHIVE_PROJECT_CHANGED");
    const changedProjection = result.update.documents?.projections.at(-1);
    if (changedProjection) {
      const receipt = await persistTemplateGeneration(next, changedProjection, client);
      next = publishArchivedTemplate(next, changedProjection, receipt);
    }
    setSession((current) => current.sessionId !== source.sessionId || current.project?.projectDigest !== source.project?.projectDigest ? current : ({ ...next, updatedAt: timestamp,
      entries: [...current.entries, ...(recordUser ? [{ entryId: sourceTurnRef, kind: "TEXT" as const, role: "USER" as const, content: instruction, createdAt: timestamp }] : []),
        { entryId: createConversationEntryId(), kind: "TEXT" as const, role: "NOXIA" as const, content: result.message, createdAt: timestamp }],
    }));
    if (result.closeSourceLibrary) setSourceLibraryOpen(false);
    } catch {
      setDocumentMessage("La révision documentaire n’a pas pu être enregistrée. Le Project et les versions archivées sont conservés ; aucune génération n’a été relancée.");
    }
  }

  const { submitText, submitTerraText, applyStudyDesignInput, applyObservabilityInput, applyImagingInput, applyBiostatisticsInput } = useConversationTurn({
    session, latestSessionRef, setSession, busy, setBusy, setBusyMessage, setDraft, correctionMode, setCorrectionMode,
    autonomousProjectBuild, traceCaptureConfiguration, setPostAdoptionContinuationJob, confirmContribution, rejectContribution,
    dispatchProductDocumentAction, handleDocumentInstruction, persistenceFailureMessage,
  });

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
    const { scope, userTurn } = projectPreparationConfirmationInput(review);
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
  const archiveClient = useMemo(() => session.project
    ? createDocumentArchiveClient(session.sessionId, session.project) : undefined, [session.sessionId, session.project]);
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
    documentArchive={session.documentArchive}
    mode={projectionMode}
    onOpenProtocol={(projectionId) => {
      setDeliverableWorkspaceOpen(Boolean(session.documentArchive?.storageMode === "DURABLE_ONLY"));
      setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }));
    }}
    onRequestProtocol={() => requestProtocolProjection()}
    onCompleteAdministration={onEditAdministration}
    deliverablePortfolio={deliverablePortfolio}
    queryNavigation={session.queryNavigation}
    suppressDocumentAction={Boolean(busy || (!session.project && preparedFinalization) || session.documentRetryUnsafe || documentGenerationPending || hasCurrentArchivedGeneration(session))}
    showDocumentAction={!deliverableWorkspaceOpen && !sourceLibraryOpen && (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" || projectionMode === "EXPERT")}
    technicalProjectionOnly={import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME !== "TERRA"}
    documentActionDisabledReason={session.documentRetryUnsafe
      ? "Le résultat de la dernière génération est incertain ; aucune nouvelle génération n’est autorisée depuis cette page."
      : documentGenerationPending ? "Une génération documentaire est déjà en cours."
        : hasCurrentArchivedGeneration(session) ? "Documents à jour."
        : !session.project && preparedFinalization ? "Validez d’abord les choix proposés."
          : busy ? "Attendez la fin de la réponse en cours." : undefined}
    onOpenDeliverables={() => {
      setSession((current) => ({ ...current, openDocumentProjectionId: null }));
      setDeliverableWorkspaceOpen(true);
    }}
  />;
  const projectFinalizationCard = projectionMode === "EXPERT" && preparationReview ? <ProjectFinalizationCard
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
    onReprepare={preparationReview.newerTurns.length && canCaptureProjectPreparation(session) && !busy && !workingDraftBusy
      ? () => void preparationController.start() : undefined}
    onAbandon={() => setSession(current => recordPreparationDecision(current, preparationReview.checkpoint.preparationId, "ABANDONED"))}
  /> : null;
  const currentDrciDraftPack = hasCurrentArchivedGeneration(session);
  const adoptedProjectDocumentAction = projectionMode === "EXPERT" && !preparedFinalization && session.project && !session.documentRetryUnsafe
    && (import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" || projectionMode === "EXPERT") ? <section
      className="mb-3 rounded-2xl border bg-background p-5 shadow-sm"
      data-testid="adopted-project-document-generation"
    >
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Documents du projet</p>
      <h2 className="mt-1 text-xl font-semibold">Choix enregistrés dans le projet · version {session.project.revision}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME !== "TERRA" ? "Diagnostic interne : cette projection n’est pas une génération documentaire."
        : currentDrciDraftPack ? "Documents à jour." : "Générez les quatre documents de travail depuis cette version du projet."}</p>
      <button type="button" disabled={documentGenerationPending || busy || currentDrciDraftPack} onClick={() => void requestProtocolProjection()}
        className="mt-4 min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
        {import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME !== "TERRA" ? "Calculer la projection technique" : "Générer les documents"}
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
          {projectionMode === "EXPERT" && <Sheet open={workingProjectOpen} onOpenChange={setWorkingProjectOpen}>
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
          </Sheet>}
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

      {projectionMode === "STANDARD" && <div className="mb-3" data-testid="version-production-action">
        <button type="button" disabled={busy || documentGenerationPending || !versionProduction.available}
          onClick={() => void versionProduction.generate()}
          className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40">
          {versionProduction.label}
        </button>
        {versionProduction.pending && <p role="status" className="mt-2 text-xs text-muted-foreground">Production de la version en cours… Vous pouvez poursuivre la conversation.</p>}
        {versionProduction.error && <p role="alert" className="mt-2 text-sm text-destructive">{versionProduction.error}</p>}
      </div>}
      <div className={`grid min-w-0 gap-5 lg:h-[calc(100dvh-13rem)] lg:min-h-[30rem] ${projectionMode === "EXPERT" ? "lg:grid-cols-[minmax(310px,.72fr)_minmax(0,1.5fr)]" : ""}`}>
        {projectionMode === "EXPERT" && <div className="hidden min-h-0 min-w-0 lg:block lg:overflow-y-auto lg:overscroll-contain" data-testid="project-scroll-panel">{projectPanel}</div>}

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
          archiveClient={archiveClient}
          currentGenerationId={session.documentArchive?.currentGenerationId}
          archiveOnly={Boolean(archiveClient)}
          diagnosticProjectionId={projectionMode === "EXPERT" ? session.documentArchive?.currentProjectionId : null}
          isArchivedProjectionCurrent={projection => Boolean(session.project && isFunctionalDocumentProjectionCurrent(projection, session.project, administration))}
          onArchivedFileDownloaded={(body, file) => {
            if (body.native.family !== "TEMPLATE" || file.format !== "HTML") return;
            const projection = body.native.value, generatedAt = new Date().toISOString();
            setSession(current => ({ ...current, scientificExecutionTraceLedger: recordArtifactGeneratedTrace({
              ledger: current.scientificExecutionTraceLedger,
              traceRunId: [...current.bridgeTraces].reverse().find(trace => trace.traceRunId && trace.projectVersionAfter === projection.source.projectVersion)?.traceRunId,
              conversationId: current.conversationId, generatedAt, projection, format: "HTML",
            }) }));
          }}
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
            {session.entries.map((entry, index) => projectionMode === "STANDARD" && (entry.kind !== "TEXT" && entry.kind !== "ERROR" || entry.kind === "TEXT" && entry.reviewInvitation) ? null : entry.kind === "FOLLOW_UP_ACTIONS"
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
                {projectionMode === "EXPERT" && entry.kind === "TEXT" && entry.role === "NOXIA" && entry.knowledgePresentation
                  ? <ProductUnderstandResponse presentation={entry.knowledgePresentation} />
                  : <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                    entry.kind === "ERROR" ? "border border-destructive/40 bg-destructive/10 text-destructive"
                      : entry.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`} role={entry.kind === "ERROR" ? "alert" : undefined}>{entry.content}</div>}
              </article>)}
            {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />{busyMessage}</div></div>}
            {projectionMode === "EXPERT" && autonomousProjectBuild && workingDraftBusy && <div role="status" className="px-4 py-2 text-xs text-muted-foreground">Structuration du projet en cours…</div>}
            {projectionMode === "EXPERT" && confirmationReceiptStatus && <div role="status" data-testid="conversation-confirmation-receipt"
              className="mx-4 rounded-xl border bg-primary/5 px-4 py-2 text-xs sm:mx-5">
              {confirmationReceiptStatus === "PREPARATION_FAILED"
                ? "Accord enregistré sur la proposition précédente ; la préparation a échoué. Le projet reste inchangé."
                : confirmationReceiptStatus === "SUPERSEDED"
                  ? "Accord conservé sur la proposition précédente ; un échange plus récent a remplacé sa préparation."
                  : confirmationReceiptStatus === "INTERRUPTED/UNKNOWN"
                    ? "Accord conservé sur la proposition précédente ; le résultat de sa préparation n’est pas vérifié."
                    : "Accord enregistré sur la proposition précédente — revue requise."}
            </div>}
            {projectionMode === "EXPERT" && autonomousProjectBuild && !workingDraftBusy && ["FAILED", "UNKNOWN/INTERRUPTED", "SUPERSEDED", "NO_CHANGE"].includes(session.workingDraftPreparations?.at(-1)?.status ?? "") && <div role="alert"
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
          {projectionMode === "EXPERT" && import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME !== "TERRA" && session.studyProposal && (!session.studyProposal.recomputation || session.pendingContribution?.identity.contributionId !== session.studyProposal.recomputation.contributionRef) && <div className="px-4 pb-4 sm:px-5"><StudyProposalReview key={session.studyProposal.digest}
            composition={session.studyProposal} project={session.project} disabled={busy} onValidate={validateStudyProposal} onDisposition={disposeStudyProposal}
            onDiscuss={subject => { setDraft(`Je souhaite discuter ${subject} : `); }} /></div>}
          {projectFinalizationCard}
          {projectionMode === "EXPERT" && autonomousProjectBuild && <div className="border-t px-4 py-3 sm:px-5">
            <button type="button" onClick={() => void preparationController.start()}
              disabled={busy || !canCaptureProjectPreparation(session)}
              className="min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-40">
              {projectionMode === "EXPERT" ? "Préparer la mise à jour du projet" : "Revoir les choix du projet"}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">{busy
              ? "Attendez la réponse complète : elle ne sera pas capturée avant sa fin."
              : workingDraftBusy ? "La préparation existante utilise les échanges figés au lancement. Aucun second calcul ne sera lancé."
                : !canCaptureProjectPreparation(session) ? "Échangez d’abord avec NOXIA pour disposer d’une réponse complète à préparer."
                : projectionMode === "EXPERT" ? "Capture les échanges jusqu’à la dernière réponse complète. Le projet ne change qu’après votre validation explicite de la revue."
                  : "Examinez les choix issus de la conversation. Votre confirmation explicite est nécessaire pour modifier le projet."}</p>
          </div>}
          <form onSubmit={submit} className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur sm:p-5" data-testid="conversation-composer">
            {projectionMode === "EXPERT" && !autonomousProjectBuild && import.meta.env.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME === "TERRA" && session.runtimeTurns.some(turn => turn.role === "USER") && <button
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
        <span>{documentGenerationVersion === null ? "Génération des documents" : `Génération G${documentGenerationVersion}`} {documentGenerationComplete ? "disponible" : "en cours"}</span>
        <span aria-hidden="true">{documentProgressExpanded ? "−" : "+"}</span>
      </button>
      {documentProgressExpanded && <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        <p>{documentGenerationComplete ? "Génération terminée." : documentGenerationStage === "PREPARING"
          ? "Préparation des documents…" : documentGenerationStage === "WRITING"
            ? "Rédaction du protocole et des documents associés ; validation et archivage côté serveur…"
            : "Vérification des documents archivés…"}</p>
        <p>{Math.floor(documentGenerationElapsed / 60)} min {String(documentGenerationElapsed % 60).padStart(2, "0")} s écoulées</p>
      </div>}
    </aside>}
  </main>;
}
