import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowUp, LoaderCircle, MessageSquareText, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { ProductBridgeClientError, requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import {
  authorizeResearchProjectDocumentHandoff,
  confirmResearchProjectContribution,
  mergeInitialResearchProjectContributions,
  prepareResearchProjectContributionCandidate,
  rejectResearchProjectContribution,
} from "@/features/research-project-construction";
import {
  functionalProtocolProjection,
  markFunctionalResetDocumentFailure,
  refreshFunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import {
  buildFunctionalResetQueryNavigation,
  isFunctionalResetQueryMisunderstanding,
} from "@/features/query-navigation";
import ContributionReview from "./ContributionReview";
import ProductUnderstandResponse from "./ProductUnderstandResponse";
import ProtocolPreview from "./ProtocolPreview";
import ResearchProjectPanel from "./ResearchProjectPanel";
import {
  executeProductUnderstandInteraction,
  routeProductEntry,
} from "./product-entry-routing";
import {
  clearFunctionalResetSession,
  createConversationEntryId,
  createFunctionalResetSession,
  createTurnId,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
  productEntryPromptForIntent,
  resolvePostAdoptionQueryContinuation,
  shouldMediatePostAdoptionQuery,
  type FunctionalResetSession,
} from "./session";

const loadInitialSession = () => typeof window === "undefined"
  ? createFunctionalResetSession()
  : loadFunctionalResetSession(window.localStorage);

const documentBlockerSignals = (documents: FunctionalResetSession["documents"]) =>
  documents.cards.flatMap((card) => card.blockerGroups.map((group) => ({
    dimension: group.dimension,
    items: [...group.items],
  })));

const persistenceFailureMessage = (
  status: "NOT_REQUESTED" | "NO_CHANGE" | "CANDIDATE" | "BLOCKED" | "TECHNICAL_FAILURE",
  candidateStatus: ReturnType<typeof prepareResearchProjectContributionCandidate>["status"] | null,
) => {
  if (status === "TECHNICAL_FAILURE") {
    return "Je vous ai répondu, mais NOXIA n’a pas pu préparer ces informations pour le Research Project. Le Project reste inchangé.";
  }
  if (status === "BLOCKED") {
    return "Je vous ai répondu, mais la proposition persistante est bloquée et n’a pas été enregistrée. Le Research Project reste inchangé.";
  }
  if (candidateStatus === "BLOCKED_BY_STRUCTURAL_CONFLICT") {
    return "Cette proposition entre en conflit avec l’état actuel du Research Project. Elle n’a pas été appliquée.";
  }
  if (candidateStatus === "REVIEW_PROJECTION_INCOMPLETE") {
    return "NOXIA ne peut pas vous demander de confirmer cette proposition, car la revue ne montre pas encore tous les changements. Le Research Project reste inchangé.";
  }
  return null;
};

type PostAdoptionContinuationJob = {
  conversationId: string;
  project: NonNullable<FunctionalResetSession["project"]>;
  queryNavigation: NonNullable<FunctionalResetSession["queryNavigation"]>;
  runtimeTurns: ScientificInterpretationTurn[];
  feedback: "Projet créé." | "Projet mis à jour.";
};

const resolvePostAdoptionContinuationJob = async (job: PostAdoptionContinuationJob) => {
  const fallback = resolvePostAdoptionQueryContinuation(job.queryNavigation);
  if (!fallback || !job.queryNavigation.currentAction || !job.queryNavigation.currentPresentation) return null;
  try {
    const continuation = await requestProtocolDesignerBridge({
      requestKind: "POST_ADOPTION_QRY_CONTINUATION",
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
      evaluatePersistentDelta: false,
    });
    const visible = resolvePostAdoptionQueryContinuation(job.queryNavigation, continuation.assistantReply);
    if (!visible) return null;
    return {
      turn: { ...continuation.assistantTurn, content: visible.content },
      content: visible.content,
      presentationSource: visible.presentationSource,
      mediationFailure: null,
      provider: continuation.observability.provider,
      model: continuation.observability.model,
      latencyMs: continuation.observability.conversationLatencyMs,
      calls: continuation.observability.calls,
    } as const;
  } catch (error) {
    return {
      turn: {
        turnId: createTurnId(),
        role: "NOXIA" as const,
        content: fallback.content,
        createdAt: new Date().toISOString(),
      },
      content: fallback.content,
      presentationSource: fallback.presentationSource,
      mediationFailure: error instanceof ProductBridgeClientError ? error.code : "POST_ADOPTION_MEDIATION_FAILURE",
      provider: "NONE",
      model: "NONE",
      latencyMs: 0,
      calls: 0,
    } as const;
  }
};

export default function ProtocolDesignerWorkspace() {
  const [session, setSession] = useState<FunctionalResetSession>(loadInitialSession);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const [postAdoptionContinuationJob, setPostAdoptionContinuationJob] = useState<PostAdoptionContinuationJob | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistFunctionalResetSession(window.localStorage, session);
    if (import.meta.env.DEV && session.bridgeTraces.length > 0) {
      console.debug("NOXIA_PRODUCT_BRIDGE_TRACE", JSON.stringify(session.bridgeTraces.at(-1)));
    }
  }, [session]);

  useEffect(() => {
    if (!postAdoptionContinuationJob) return;
    let active = true;
    const job = postAdoptionContinuationJob;
    void resolvePostAdoptionContinuationJob(job).then((continuation) => {
      if (!active || !continuation) return;
      const continuedAt = continuation.turn.createdAt;
      setSession((current) => ({
        ...current,
        runtimeTurns: [...job.runtimeTurns, continuation.turn],
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "TEXT",
          role: "NOXIA",
          content: continuation.content,
          createdAt: continuedAt,
        }],
        bridgeTraces: [...current.bridgeTraces, {
          turnId: continuation.turn.turnId,
          requestKind: "POST_ADOPTION_QRY_CONTINUATION" as const,
          raw: job.feedback,
          assistantReply: continuation.content,
          persistentExtractionCalled: false,
          persistentExtractionStatus: "NOT_REQUESTED" as const,
          providerArtifact: null,
          wireCandidate: null,
          persistentCandidate: null,
          deterministicValidation: null,
          projectChangeSetCandidate: null,
          canonicalProjectChangeSetCandidate: null,
          humanReviewProjection: null,
          humanDecision: job.project.confirmationDecision,
          projectVersionBefore: job.project.versionId,
          projectVersionAfter: job.project.versionId,
          qryNeedBefore: null,
          qryNeedAfter: job.queryNavigation.currentAction?.navigationNeedRefs[0] ?? null,
          provider: continuation.provider,
          model: continuation.model,
          conversationLatencyMs: continuation.latencyMs,
          extractionLatencyMs: null,
          calls: continuation.calls,
          continuationPresentationSource: continuation.presentationSource,
          continuationMediationFailure: continuation.mediationFailure,
        }].slice(-20),
        updatedAt: continuedAt,
      }));
    }).finally(() => {
      if (!active) return;
      setPostAdoptionContinuationJob((current) => current === job ? null : current);
      setBusy(false);
    });
    return () => { active = false; };
  }, [postAdoptionContinuationJob]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [busy, session.entries.length]);

  const projectExistedForReview = useMemo(() => {
    const firstProjectContributionIndex = session.entries.findIndex((entry) => entry.kind === "REVIEW" && entry.status === "CONFIRMED");
    return (entryIndex: number) => firstProjectContributionIndex >= 0 && entryIndex > firstProjectContributionIndex;
  }, [session.entries]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    const now = new Date().toISOString();
    const userTurn: ScientificInterpretationTurn = { turnId: createTurnId(), role: "USER", content, createdAt: now };
    const runtimeTurns = [...session.runtimeTurns, userTurn];
    const asksForExplanationOrRephrase = isFunctionalResetQueryMisunderstanding(content);
    const previousContext = [...session.bridgeTraces]
      .reverse()
      .find((trace) => trace.entryRouting)?.entryRouting?.scientificContext;
    const entryRouting = routeProductEntry({
      raw: content,
      sourceTurnRef: userTurn.turnId,
      routedAt: now,
      previousContext,
      forceUnderstand: asksForExplanationOrRephrase,
    });
    const qryNeedBefore = session.queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null;
    // UNDERSTAND is transversal: a pending QRY remains byte-for-byte available,
    // but it neither captures nor mutates the explanatory turn.
    const queryNavigation = session.queryNavigation;
    const withUser: FunctionalResetSession = {
      ...session,
      queryNavigation,
      runtimeTurns,
      entries: [
        ...session.entries,
        { entryId: createConversationEntryId(), kind: "TEXT", role: "USER", content, createdAt: now },
      ],
      updatedAt: now,
    };
    setSession(withUser);
    setDraft("");
    setCorrectionMode(false);
    setBusy(true);
    try {
      const emptyTraceMaterial = {
        turnId: userTurn.turnId,
        requestKind: "USER_TURN" as const,
        raw: content,
        persistentExtractionCalled: false,
        persistentExtractionStatus: "NOT_REQUESTED" as const,
        providerArtifact: null,
        wireCandidate: null,
        persistentCandidate: null,
        deterministicValidation: null,
        projectChangeSetCandidate: null,
        canonicalProjectChangeSetCandidate: null,
        humanReviewProjection: null,
        humanDecision: null,
        projectVersionBefore: session.project?.versionId ?? null,
        projectVersionAfter: session.project?.versionId ?? null,
        qryNeedBefore,
        qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
        extractionLatencyMs: null,
        entryRouting,
        projectWriteCount: 0,
        protocolProjectionCount: 0,
      };

      if (entryRouting.domainGate !== "IN_SCOPE") {
        const rejectedAt = new Date().toISOString();
        const assistantReply = "Cette entrée ne peut pas être transmise à un owner scientifique. Reformulez-la comme une question scientifique générale, sans donnée personnelle ni identifiante. Aucun projet ni protocole n’a été créé.";
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(),
          role: "NOXIA",
          content: assistantReply,
          createdAt: rejectedAt,
        };
        setSession((current) => ({
          ...current,
          queryNavigation,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(),
            kind: "ERROR",
            role: "NOXIA",
            content: assistantReply,
            createdAt: rejectedAt,
          }],
          bridgeTraces: [...current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply,
            provider: "DOMAIN_GATE",
            model: "DETERMINISTIC_LOCAL",
            conversationLatencyMs: 0,
            calls: 0,
            knowledgeResultRef: null,
            knowledgeResultDigest: null,
          }].slice(-20),
          updatedAt: rejectedAt,
        }));
        return;
      }

      if (entryRouting.routeIntent === "UNDERSTAND") {
        const knowledge = executeProductUnderstandInteraction({ raw: content, decision: entryRouting, createdAt: now });
        const answeredAt = new Date().toISOString();
        const assistantTurn: ScientificInterpretationTurn = {
          turnId: createTurnId(),
          role: "NOXIA",
          content: knowledge.assistantReply,
          createdAt: answeredAt,
        };
        setSession((current) => ({
          ...current,
          queryNavigation,
          runtimeTurns: [...runtimeTurns, assistantTurn],
          entries: [...current.entries, {
            entryId: createConversationEntryId(),
            kind: knowledge.status === "FAILURE" ? "ERROR" : "TEXT",
            role: "NOXIA",
            content: knowledge.assistantReply,
            knowledgePresentation: knowledge.presentation,
            createdAt: answeredAt,
          }],
          bridgeTraces: [...current.bridgeTraces, {
            ...emptyTraceMaterial,
            assistantReply: knowledge.assistantReply,
            provider: "KNOWLEDGE",
            model: "KE-001@1.2.0",
            conversationLatencyMs: 0,
            calls: 0,
            knowledgeResultRef: knowledge.knowledgeResultRef,
            knowledgeResultDigest: knowledge.knowledgeResultDigest,
          }].slice(-20),
          updatedAt: answeredAt,
        }));
        return;
      }

      const response = await requestProtocolDesignerBridge({
        requestKind: "USER_TURN",
        conversation: {
          conversationId: session.conversationId,
          language: "fr",
          turns: runtimeTurns,
          ...(queryNavigation?.currentAction && queryNavigation.currentPresentation ? {
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
        // Routing governs Project eligibility. Conversation-only turns remain
        // usable, but cannot trigger persistent extraction.
        evaluatePersistentDelta: entryRouting.projectConstructionEligible && !asksForExplanationOrRephrase,
      });
      const receivedAt = new Date().toISOString();
      const extractedContribution = entryRouting.projectConstructionEligible
        ? response.persistentExtraction.contribution
        : null;
      const contribution = extractedContribution && !session.project && session.pendingContribution
        ? mergeInitialResearchProjectContributions(session.pendingContribution, extractedContribution)
        : extractedContribution;
      const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
      const effectiveCandidate = candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" ? candidate : null;
      const effectiveExtractionStatus = entryRouting.projectConstructionEligible
        ? response.persistentExtraction.status
        : "NOT_REQUESTED" as const;
      const failureMessage = persistenceFailureMessage(effectiveExtractionStatus, candidate?.status ?? null);
      const replacedPendingContributionId = effectiveCandidate ? session.pendingContribution?.identity.contributionId ?? null : null;
      setSession((current) => ({
        ...current,
        queryNavigation,
        runtimeTurns: [...runtimeTurns, response.assistantTurn],
        pendingContribution: effectiveCandidate && contribution ? contribution : current.pendingContribution,
        entries: [
          ...current.entries.filter((entry) => !(replacedPendingContributionId
            && entry.kind === "REVIEW"
            && entry.status === "PENDING"
            && entry.contribution.identity.contributionId === replacedPendingContributionId)),
          { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: response.assistantReply, createdAt: receivedAt },
          ...(effectiveCandidate && contribution ? [{
            entryId: createConversationEntryId(),
            kind: "REVIEW" as const,
            role: "NOXIA" as const,
            contribution,
            candidate: effectiveCandidate,
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
        ],
        bridgeTraces: [...current.bridgeTraces, {
          turnId: userTurn.turnId,
          requestKind: "USER_TURN" as const,
          raw: content,
          assistantReply: response.assistantReply,
          persistentExtractionCalled: entryRouting.projectConstructionEligible && response.persistentExtraction.called,
          persistentExtractionStatus: effectiveExtractionStatus,
          persistentExtractionFailure: entryRouting.projectConstructionEligible ? response.persistentExtraction.failure ?? null : null,
          providerArtifact: entryRouting.projectConstructionEligible ? response.persistentExtraction.providerArtifact : null,
          wireCandidate: entryRouting.projectConstructionEligible ? response.persistentExtraction.wireCandidate : null,
          persistentCandidate: entryRouting.projectConstructionEligible ? response.persistentExtraction.candidate : null,
          deterministicValidation: entryRouting.projectConstructionEligible ? response.persistentExtraction.validation : null,
          projectChangeSetCandidate: candidate?.changeSet ?? null,
          canonicalProjectChangeSetCandidate: candidate?.canonicalChangeSet ?? null,
          humanReviewProjection: candidate?.humanReviewProjection ?? null,
          humanDecision: null,
          projectVersionBefore: session.project?.versionId ?? null,
          projectVersionAfter: session.project?.versionId ?? null,
          qryNeedBefore,
          qryNeedAfter: queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null,
          provider: response.observability.provider,
          model: response.observability.model,
          conversationLatencyMs: response.observability.conversationLatencyMs,
          extractionLatencyMs: response.observability.extractionLatencyMs,
          calls: response.observability.calls,
          entryRouting,
          knowledgeResultRef: null,
          knowledgeResultDigest: null,
          projectWriteCount: response.observability.projectWrites,
          protocolProjectionCount: 0,
        }].slice(-20),
        updatedAt: receivedAt,
      }));
    } catch (error) {
      const failedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : "L’interprétation scientifique est momentanément indisponible.";
      setSession((current) => ({
        ...current,
        entries: [...current.entries, { entryId: createConversationEntryId(), kind: "ERROR", role: "NOXIA", content: message, createdAt: failedAt }],
        updatedAt: failedAt,
      }));
    } finally {
      setBusy(false);
    }
  };

  const confirmContribution = async (contributionId: string) => {
    const contribution = session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return;
    const now = new Date().toISOString();
    setBusy(true);
    let continuationScheduled = false;
    try {
      const reviewEntry = session.entries.find((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId);
      const project = confirmResearchProjectContribution({
        contribution,
        current: session.project,
        projectId: session.projectId,
        authority: session.projectAuthority,
        confirmedAt: now,
        reviewedProjection: reviewEntry?.kind === "REVIEW"
          ? (reviewEntry.candidate ?? prepareResearchProjectContributionCandidate(reviewEntry.contribution, session.project)).humanReviewProjection
          : undefined,
      });
      let documents;
      let documentWarning = false;
      try {
        documents = refreshFunctionalResetDocumentPortfolio({
          project,
          previous: session.documents,
          requestedAt: now,
        });
      } catch (error) {
        documents = markFunctionalResetDocumentFailure(project, session.documents, error);
        documentWarning = true;
      }
      const queryNavigation = buildFunctionalResetQueryNavigation({
        project,
        previous: session.queryNavigation,
        documentBlockers: documentBlockerSignals(documents),
        recordedAt: now,
      });
      const feedback = session.project ? "Projet mis à jour." : "Projet créé.";
      const confirmationTurn: ScientificInterpretationTurn = {
        turnId: createTurnId(),
        role: "NOXIA",
        content: feedback,
        createdAt: now,
      };
      const runtimeTurns = [...session.runtimeTurns, confirmationTurn];
      setSession((current) => ({
        ...current,
        project,
        queryNavigation,
        documents,
        currentContribution: contribution,
        pendingContribution: null,
        runtimeTurns,
        entries: [
          ...current.entries.map((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId
            ? { ...entry, status: "CONFIRMED" as const, decision: project.confirmationDecision }
            : entry),
          { entryId: createConversationEntryId(), kind: "TEXT", role: "NOXIA", content: feedback, createdAt: now },
          ...(documentWarning ? [{ entryId: createConversationEntryId(), kind: "ERROR" as const, role: "NOXIA" as const, content: "NOXIA n’a pas pu mettre à jour la partie documentaire du projet. Le Research Project confirmé reste disponible.", createdAt: now }] : []),
        ],
        bridgeTraces: current.bridgeTraces.map((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId
          ? { ...trace, humanDecision: project.confirmationDecision, projectVersionAfter: project.versionId }
          : trace),
        updatedAt: now,
      }));

      if (shouldMediatePostAdoptionQuery(queryNavigation)
        && queryNavigation.currentAction && queryNavigation.currentPresentation && queryNavigation.standardQuestion) {
        continuationScheduled = true;
        setPostAdoptionContinuationJob({
          conversationId: session.conversationId,
          project,
          queryNavigation,
          runtimeTurns,
          feedback,
        });
      }
    } catch {
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: current.project?.versionId !== session.project?.versionId
            ? "Le projet est à jour, mais NOXIA n’a pas pu formuler la prochaine étape. Vous pouvez poursuivre librement."
            : "NOXIA n’a pas pu mettre à jour cette partie du projet. Votre contribution reste disponible pour réessayer.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
    } finally {
      if (!continuationScheduled) setBusy(false);
    }
  };

  const rejectContribution = (contributionId: string) => {
    const contribution = session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return;
    const now = new Date().toISOString();
    try {
      const decision = rejectResearchProjectContribution({
        contribution,
        current: session.project,
        authority: session.projectAuthority,
        rejectedAt: now,
      });
      setSession((current) => ({
        ...current,
        pendingContribution: null,
        entries: current.entries.map((entry) => entry.kind === "REVIEW" && entry.contribution.identity.contributionId === contributionId
          ? { ...entry, status: "REJECTED" as const, decision }
          : entry),
        bridgeTraces: current.bridgeTraces.map((trace) => trace.projectChangeSetCandidate?.sourceContributionRef === contributionId
          ? { ...trace, humanDecision: decision, projectVersionAfter: current.project?.versionId ?? null }
          : trace),
        updatedAt: now,
      }));
    } catch {
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: "NOXIA n’a pas pu enregistrer ce refus. Le Research Project reste inchangé.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
    }
  };

  const requestProtocolProjection = () => {
    if (!session.project) return;
    const now = new Date().toISOString();
    try {
      const decision = authorizeResearchProjectDocumentHandoff({
        project: session.project,
        authority: session.projectAuthority,
        confirmedAt: now,
      });
      const documents = refreshFunctionalResetDocumentPortfolio({
        project: session.project,
        previous: session.documents,
        handoffDecision: decision,
        requestedAt: now,
        generateProtocol: true,
      });
      const protocol = documents.projections.at(-1) ?? null;
      if (!protocol || documents.lastFailure) throw new Error(documents.lastFailure?.message ?? "DOC_PROTOCOL_PROJECTION_NOT_CREATED");
      setSession((current) => ({
        ...current,
        documents,
        openDocumentProjectionId: protocol.projectionId,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "TEXT",
          role: "NOXIA",
          content: protocol.readiness === "READY_FOR_REVIEW"
            ? "Une version de travail du protocole est disponible pour revue."
            : "Un premier aperçu partiel du protocole est disponible. Les sections encore ouvertes restent visibles.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
    } catch (error) {
      const documents = markFunctionalResetDocumentFailure(session.project, session.documents, error);
      setSession((current) => ({
        ...current,
        documents,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: "NOXIA n’a pas pu produire l’aperçu du protocole. Le Project et la conversation sont conservés.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
    }
  };

  const requestCorrection = () => {
    setCorrectionMode(true);
    composerRef.current?.focus();
  };

  const reset = () => {
    clearFunctionalResetSession(window.localStorage);
    setSession(createFunctionalResetSession());
    setDraft("");
    setBusy(false);
    setCorrectionMode(false);
    setPostAdoptionContinuationJob(null);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const openProjection = functionalProtocolProjection(session.documents, session.openDocumentProjectionId);
  const protocolCard = session.documents.cards.find((card) => card.kind === "PROTOCOL");
  const activeRouteIntent = [...session.bridgeTraces]
    .reverse()
    .find((trace) => trace.entryRouting)?.entryRouting?.routeIntent;
  const projectPanel = <ResearchProjectPanel
    project={session.project}
    documents={session.documents}
    onOpenProtocol={(projectionId) => setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }))}
    onRequestProtocol={requestProtocolProjection}
  />;

  return <main id="demo-main" className="min-h-screen bg-muted/30 text-foreground" data-testid="functional-reset-workspace">
    <Helmet>
      <title>Protocol Designer — NOXIA</title>
      <meta name="description" content="Comprenez, formalisez ou construisez un Research Project dans une conversation continue avec NOXIA." />
      <meta name="robots" content="noindex, follow" />
    </Helmet>

    <div className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">NOXIA</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Protocol Designer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Assistant méthodologique conversationnel</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm font-medium lg:hidden"><MessageSquareText className="h-4 w-4" />Voir mon projet</button></SheetTrigger>
            <SheetContent side="left" className="w-[min(92vw,420px)] overflow-y-auto p-4">
              <SheetHeader className="sr-only"><SheetTitle>Research Project</SheetTitle><SheetDescription>État actuel du projet et des documents.</SheetDescription></SheetHeader>
              <div className="pt-7">{projectPanel}</div>
            </SheetContent>
          </Sheet>
          <button type="button" aria-label="Recommencer" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm font-medium"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Recommencer</span><span className="sm:hidden">Reset</span></button>
        </div>
      </header>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(310px,.72fr)_minmax(0,1.5fr)]">
        <div className="hidden min-w-0 self-start lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">{projectPanel}</div>

        {openProjection ? <ProtocolPreview
          projection={openProjection}
          stale={protocolCard?.freshness === "STALE" || openProjection.source.projectVersion !== session.project?.versionId}
          onClose={() => setSession((current) => ({ ...current, openDocumentProjectionId: null }))}
        /> : <section aria-label="Conversation" className="flex min-h-[calc(100vh-7.5rem)] min-w-0 flex-col rounded-3xl border bg-background shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Conversation</h2>
            <p className="mt-1 text-sm text-muted-foreground">Décrivez votre question ou votre objectif. NOXIA oriente d’abord l’échange, puis n’ouvre un Research Project que si vous demandez de construire une étude.</p>
          </div>

          <div className="flex-1 space-y-5 px-4 py-5 sm:px-6" aria-live="polite">
            {session.entries.map((entry, index) => entry.kind === "REVIEW"
              ? <ContributionReview
                key={entry.entryId}
                contribution={entry.contribution}
                candidate={entry.candidate ?? prepareResearchProjectContributionCandidate(
                  entry.contribution,
                  projectExistedForReview(index) ? session.project : null,
                )}
                status={entry.status}
                onConfirm={() => confirmContribution(entry.contribution.identity.contributionId)}
                onCorrect={requestCorrection}
                onReject={() => rejectContribution(entry.contribution.identity.contributionId)}
              />
              : <article key={entry.entryId} className={`flex ${entry.role === "USER" ? "justify-end" : "justify-start"}`}>
                {entry.kind === "TEXT" && entry.role === "NOXIA" && entry.knowledgePresentation
                  ? <ProductUnderstandResponse presentation={entry.knowledgePresentation} />
                  : <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                    entry.kind === "ERROR" ? "border border-destructive/40 bg-destructive/10 text-destructive"
                      : entry.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`} role={entry.kind === "ERROR" ? "alert" : undefined}>{entry.content}</div>}
              </article>)}
            {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />NOXIA vous répond…</div></div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="sticky bottom-0 border-t bg-background/95 p-4 backdrop-blur sm:p-5">
            {correctionMode && <p className="mb-2 text-sm font-medium text-primary">Décrivez librement ce que vous souhaitez corriger. Vous pouvez regrouper plusieurs changements dans un seul message.</p>}
            <label htmlFor="protocol-designer-message" className="sr-only">Votre message</label>
            <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
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
                rows={2}
                maxLength={4_000}
                placeholder={correctionMode ? "Ce que je souhaite corriger…" : productEntryPromptForIntent(activeRouteIntent)}
                className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Envoyer" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
            </div>
          </form>
        </section>}
      </div>
    </div>
  </main>;
}
