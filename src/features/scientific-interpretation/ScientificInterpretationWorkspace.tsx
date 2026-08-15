import type { WorkspaceInteractionHandoff } from "@/features/adaptive-research-workspace/interactions";
import { isPatientLevelExpression } from "@/features/knowledge-engine";
import {
  type ConversationalHandoffRoute,
  type ConversationalOwnerProcessingResult,
  type ConversationalOwnerTarget,
  buildConversationalSemanticHandoff,
  routeConversationalHandoff,
} from "@/features/protocol-designer/conversation/ConversationalHandoffRouter";
import ConversationTimeline from "@/features/protocol-designer/conversation/ConversationTimeline";
import ConversationalProtocolDesignerShell from "@/features/protocol-designer/conversation/ConversationalProtocolDesignerShell";
import {
  appendConversationEvent,
  clearConversationalWorkspaceSession,
  completeConversationalOwnerHandoff,
  confirmConversationalUnderstanding,
  createConversationalWorkspaceSession,
  markConversationalHandoffPending,
  migrateConversationalWorkspaceSession,
  persistConversationalWorkspaceSession,
  registerConversationalContribution,
  type ConversationEventType,
  type ConversationalWorkspaceSession,
} from "@/features/protocol-designer/conversation/ConversationalWorkspaceSession";
import { buildContributionProjectPanelProjection, type ProjectPanelProjection } from "@/features/protocol-designer/conversation/ProjectPanel";
import UnderstandingReviewCard from "@/features/protocol-designer/conversation/UnderstandingReviewCard";
import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { INTAKE_SESSION_KEY } from "@/features/protocol-designer/intake/session";
import { CircleAlert, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ScientificInterpretationClientError, requestScientificInterpretationRuntime } from "./client";
import { executeContributionKnowledgeVerification } from "./knowledge";
import {
  acceptScientificInterpretationWorkingBasis,
  appendScientificInterpretationExecution,
  clearScientificInterpretationSession,
  createScientificInterpretationMessage,
  createScientificInterpretationSession,
  linkKnowledgeResultToScientificInterpretationSession,
  loadScientificInterpretationOwnerSessionV2,
  loadScientificInterpretationSession,
  migrateLegacySemanticSession,
  persistScientificInterpretationOwnerSessionV2,
  readLegacySemanticSession,
  type ScientificInterpretationWorkspaceSession,
} from "./session";
import type { V1ScientificInterpretationProjection } from "./v1-compatibility";

export type ConversationalOwnerHandoffHandler = (handoff: WorkspaceInteractionHandoff, ownerTarget: ConversationalOwnerTarget) => void;

type Props = {
  onOpenStructuredProject: (
    projection: V1ScientificInterpretationProjection,
    typedHandoff: ReturnType<typeof buildConversationalSemanticHandoff>,
  ) => void;
  onResumeStructuredProject?: () => void;
  onRoutedOwnerHandoff?: (
    route: ConversationalHandoffRoute,
    interaction: WorkspaceInteractionHandoff,
  ) => Promise<ConversationalOwnerProcessingResult> | ConversationalOwnerProcessingResult;
  onUnderstandingInvalidated?: (contributionRef: string) => void;
  renderContinuation?: (onOwnerHandoff: ConversationalOwnerHandoffHandler, mode: "STANDARD" | "EXPERT") => React.ReactNode;
  projectPanelProjection?: ProjectPanelProjection | null;
  initialDraft?: string;
};

const readLegacyGuidedWorkspace = (storage: Pick<Storage, "getItem">) => {
  const raw = storage.getItem(INTAKE_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const ownerFailureMessage = (caught: unknown) => caught instanceof ScientificInterpretationClientError
  ? caught.code === "RAW_PERSISTENCE_FAILURE"
    ? "La réponse brute n’a pas pu être conservée. La mise à jour est arrêtée et peut être réessayée."
    : caught.message
  : "La mise à jour n’a pas abouti. Votre réponse reste visible et vous pouvez réessayer.";

export default function ScientificInterpretationWorkspace({
  onOpenStructuredProject,
  onResumeStructuredProject,
  onRoutedOwnerHandoff,
  onUnderstandingInvalidated,
  renderContinuation,
  projectPanelProjection,
  initialDraft = "",
}: Props) {
  const [ownerSession, setOwnerSession] = useState<ScientificInterpretationWorkspaceSession>(() => createScientificInterpretationSession());
  const [conversationSession, setConversationSession] = useState<ConversationalWorkspaceSession>(() => createConversationalWorkspaceSession());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoredOwner = loadScientificInterpretationOwnerSessionV2(window.localStorage)
      ?? loadScientificInterpretationSession(window.localStorage);
    const restoredConversation = migrateConversationalWorkspaceSession({
      storage: window.localStorage,
      legacyScientificInterpretation: restoredOwner,
      legacyGuidedWorkspace: readLegacyGuidedWorkspace(window.localStorage),
    });
    setConversationSession(restoredConversation);
    if (restoredOwner) {
      setOwnerSession(restoredOwner);
      return;
    }
    const legacy = readLegacySemanticSession(window.localStorage);
    if (!legacy) return;
    void import("@/features/scientific-semantic-reconstruction/legacy-session-compatibility").then(({ convertLegacySessionModel }) => {
      const migrated = migrateLegacySemanticSession(legacy, convertLegacySessionModel);
      if (migrated) setOwnerSession(migrated);
    });
  }, []);

  useEffect(() => { if (initialDraft.trim()) setDraft(initialDraft); }, [initialDraft]);
  useEffect(() => {
    if (!ownerSession.messages.length) return;
    try { persistScientificInterpretationOwnerSessionV2(window.localStorage, ownerSession); } catch { /* sensitive sessions remain in memory only */ }
  }, [ownerSession]);
  useEffect(() => {
    if (!conversationSession.timeline.length && !conversationSession.migration.migratedAt) return;
    try { persistConversationalWorkspaceSession(window.localStorage, conversationSession); } catch { /* sensitive sessions remain in memory only */ }
  }, [conversationSession]);

  const contribution = ownerSession.currentContribution;
  const canAccept = Boolean(ownerSession.currentProjection && !ownerSession.reviewRequired && ownerSession.auditStatus !== "CRITICAL_FINDINGS");
  const canContinue = Boolean(ownerSession.currentProjection && ownerSession.workingBasisAcceptedAt);
  const contributionProjectProjection = useMemo(() => buildContributionProjectPanelProjection(contribution, {
    projectRef: conversationSession.currentProjectRef,
    projectVersion: conversationSession.currentProjectVersion,
    projectDigest: conversationSession.currentProjectDigest,
  }), [contribution, conversationSession.currentProjectDigest, conversationSession.currentProjectRef, conversationSession.currentProjectVersion]);
  const projectProjection = projectPanelProjection ?? contributionProjectProjection;

  const executeInterpretation = async (
    content: string,
    eventType: ConversationEventType,
    baseConversation: ConversationalWorkspaceSession,
    baseOwner: ScientificInterpretationWorkspaceSession,
    includeReview: boolean,
    pendingOwner?: { handoffRef: string; ownerRef: ConversationalOwnerTarget },
  ) => {
    const userMessage = createScientificInterpretationMessage("USER", content);
    const messages = [...baseOwner.messages, userMessage];
    let nextConversation = appendConversationEvent(baseConversation, {
      eventId: userMessage.turnId,
      type: eventType,
      createdAt: userMessage.createdAt ?? new Date().toISOString(),
      presentationStatus: "CURRENT",
      text: content,
      ownerRefs: ["USER"],
      replayContext: eventType === "USER_CORRECTION" ? { correctionRequested: true } : null,
    });
    if (pendingOwner) {
      nextConversation = markConversationalHandoffPending(
        nextConversation,
        pendingOwner.handoffRef,
        pendingOwner.ownerRef,
        userMessage.createdAt,
      );
    }
    const ownerWithMessage = { ...baseOwner, messages, updatedAt: userMessage.createdAt ?? new Date().toISOString() };
    setOwnerSession(ownerWithMessage);
    setConversationSession(nextConversation);
    const response = await requestScientificInterpretationRuntime({
      conversation: { conversationId: baseConversation.conversationId, language: "fr", turns: messages },
      previousContribution: baseOwner.currentContribution,
    });
    const assistantMessage = createScientificInterpretationMessage("NOXIA", response.contribution.scientificContent.normalizedUnderstanding ?? "La demande est conservée pour revue.");
    let nextOwner = appendScientificInterpretationExecution(ownerWithMessage, response, assistantMessage);
    const knowledge = executeContributionKnowledgeVerification(response.contribution);
    if (knowledge) nextOwner = linkKnowledgeResultToScientificInterpretationSession(nextOwner, knowledge.knowledgeResultRef);
    nextConversation = includeReview
      ? registerConversationalContribution(nextConversation, response.contribution.identity.contributionId, assistantMessage.createdAt)
      : {
        ...nextConversation,
        contributionRefs: [...new Set([...nextConversation.contributionRefs, response.contribution.identity.contributionId])],
        updatedAt: assistantMessage.createdAt,
      };
    nextConversation = appendConversationEvent(nextConversation, {
      eventId: assistantMessage.turnId,
      type: "NOXIA_INTERPRETATION",
      createdAt: assistantMessage.createdAt ?? response.contribution.identity.createdAt,
      presentationStatus: response.auditStatus === "CRITICAL_FINDINGS" ? "PARTIAL" : "SUCCESS",
      text: assistantMessage.content,
      ownerRefs: ["SCIENTIFIC_INTERPRETATION", response.contribution.identity.contributionId],
      replayContext: { contributionRef: response.contribution.identity.contributionId },
    });
    if (includeReview) nextConversation = appendConversationEvent(nextConversation, {
      eventId: `understanding-review:${response.contribution.identity.contributionId}`,
      type: "UNDERSTANDING_REVIEW",
      createdAt: response.contribution.identity.createdAt,
      presentationStatus: "PENDING",
      text: "Voici ce que j’ai compris. Confirmez, corrigez ou ajoutez une précision.",
      ownerRefs: [response.contribution.identity.contributionId],
      replayContext: { projectWriteAuthorized: false },
    });
    if (includeReview && baseConversation.understanding.status === "CONFIRMED_WORKING_CONTEXT") {
      onUnderstandingInvalidated?.(response.contribution.identity.contributionId);
      nextConversation = appendConversationEvent(nextConversation, {
        eventId: `dependent-projections-invalidated:${response.contribution.identity.contributionId}`,
        type: "OWNER_FEEDBACK",
        createdAt: response.contribution.identity.createdAt,
        presentationStatus: "PARTIAL",
        text: "Votre correction est conservée. Les projections qui dépendaient de la compréhension précédente devront être reconstruites après votre confirmation.",
        ownerRefs: [response.contribution.identity.contributionId, "PROTOCOL_DESIGNER"],
        replayContext: { dependencyInvalidationRequested: true, projectWriteAuthorized: false },
      });
    }
    setOwnerSession(nextOwner);
    setConversationSession(nextConversation);
    if (response.fallbackUsed) setError("Le runtime hybride a rencontré une défaillance. Le fallback legacy est conservé dans la trace.");
    else if (response.auditStatus === "CRITICAL_FINDINGS") setError("Une revue est requise avant d’utiliser cette compréhension.");
    return { response, nextOwner, nextConversation };
  };

  const submitDraft = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    setError(null);
    if (detectSensitiveData(content).length) { setError("Retirez toute donnée personnelle, patient ou confidentielle avant de poursuivre."); return; }
    if (isPatientLevelExpression(content)) { setError("NOXIA n’interprète pas une valeur individuelle. Reformulez-la comme une question scientifique générale."); return; }
    setDraft("");
    setBusy(true);
    try {
      const correction = /^\s*(je corrige|correction|l['’]irm et la biologie)/i.test(content);
      await executeInterpretation(content, correction ? "USER_CORRECTION" : "USER_MESSAGE", conversationSession, ownerSession, true);
    } catch (caught) {
      const message = ownerFailureMessage(caught);
      setError(message);
      setOwnerSession((current) => ({ ...current, technicalStatus: "FAIL_CLOSED", reviewRequired: true, updatedAt: new Date().toISOString() }));
      setConversationSession((current) => appendConversationEvent(current, {
        eventId: `interpretation-error:${Date.now()}`,
        type: "ERROR",
        createdAt: new Date().toISOString(),
        presentationStatus: "FAILURE",
        text: message,
        ownerRefs: ["SCIENTIFIC_INTERPRETATION"],
        replayContext: { recovery: "RETRY" },
      }));
    } finally { setBusy(false); }
  };

  const confirmUnderstanding = () => {
    if (!contribution || !canAccept) return;
    const now = new Date().toISOString();
    setOwnerSession((current) => acceptScientificInterpretationWorkingBasis(current, now));
    setConversationSession((current) => confirmConversationalUnderstanding(current, contribution.identity.contributionId, "CURRENT_RESEARCHER", now));
  };

  const continueReasoning = () => {
    if (!ownerSession.currentProjection || !contribution || !canContinue) return;
    const now = new Date().toISOString();
    setConversationSession((current) => appendConversationEvent(current, {
      eventId: `continue-reasoning:${contribution.identity.contributionId}`,
      type: "QRY_REQUEST",
      createdAt: now,
      presentationStatus: "PENDING",
      text: "La compréhension est conservée. NOXIA prépare maintenant la prochaine interaction utile dans cette conversation.",
      ownerRefs: [contribution.identity.contributionId, "QUERY_NAVIGATION"],
      replayContext: { phaseChanged: true, conversationChanged: false },
    }));
    onOpenStructuredProject(ownerSession.currentProjection, buildConversationalSemanticHandoff(contribution));
  };

  const handleOwnerHandoff: ConversationalOwnerHandoffHandler = async (interaction, ownerTarget) => {
    const raw = typeof interaction.response.rawResponse === "string" ? interaction.response.rawResponse.trim() : "";
    if (!raw) return;
    const now = new Date().toISOString();
    setBusy(true);
    try {
      const interpreted = await executeInterpretation(
        raw,
        "USER_MESSAGE",
        conversationSession,
        ownerSession,
        false,
        { handoffRef: interaction.handoffId, ownerRef: ownerTarget },
      );
      const route = routeConversationalHandoff({
        interaction,
        contribution: interpreted.response.contribution,
        ownerTarget,
        currentProjectRef: interpreted.nextConversation.currentProjectRef,
        currentProjectVersion: interpreted.nextConversation.currentProjectVersion,
        freshness: interaction.state === "STALE_BLOCKED" ? "STALE" : "CURRENT",
      });
      if (route.status === "STALE_BLOCKED") {
        setConversationSession((current) => appendConversationEvent({
          ...current,
          pendingHandoffRefs: current.pendingHandoffRefs.filter((ref) => ref !== interaction.handoffId),
        }, {
          eventId: `owner-stale:${interaction.handoffId}`,
          type: "OWNER_FEEDBACK",
          createdAt: now,
          presentationStatus: "STALE",
          text: "Le projet a changé depuis cette question. Votre réponse est conservée, mais elle ne peut pas être appliquée sans réévaluation.",
          ownerRefs: [ownerTarget, interaction.handoffId],
          replayContext: { freshness: route.freshness },
        }));
        return;
      }
      if (!onRoutedOwnerHandoff) throw new Error("CONVERSATIONAL_OWNER_CALLBACK_MISSING");
      const ownerResult = await onRoutedOwnerHandoff(route, interaction);
      if (ownerResult.status === "STALE") {
        setConversationSession((current) => appendConversationEvent({
          ...current,
          pendingHandoffRefs: current.pendingHandoffRefs.filter((ref) => ref !== interaction.handoffId),
        }, {
          eventId: `owner-result-stale:${interaction.handoffId}`,
          type: "OWNER_FEEDBACK",
          createdAt: new Date().toISOString(),
          presentationStatus: "STALE",
          text: `${ownerResult.feedbackText}${ownerResult.recoveryText ? ` ${ownerResult.recoveryText}` : ""}`,
          ownerRefs: [ownerTarget, interaction.handoffId],
          replayContext: { recovery: ownerResult.recoveryText ?? null },
        }));
        return;
      }
      if (ownerResult.status === "PARTIAL") {
        setConversationSession((current) => appendConversationEvent({
          ...current,
          pendingHandoffRefs: current.pendingHandoffRefs.filter((ref) => ref !== interaction.handoffId),
        }, {
          eventId: `owner-partial:${interaction.handoffId}`,
          type: "OWNER_FEEDBACK",
          createdAt: new Date().toISOString(),
          presentationStatus: "PARTIAL",
          text: `${ownerResult.feedbackText}${ownerResult.recoveryText ? ` ${ownerResult.recoveryText}` : ""}`,
          ownerRefs: [ownerTarget, interaction.handoffId],
          replayContext: { recovery: ownerResult.recoveryText ?? null },
        }));
        return;
      }
      if (ownerResult.status === "FAILURE" || !ownerResult.ownerResultRef) {
        setConversationSession((current) => appendConversationEvent({
          ...current,
          pendingHandoffRefs: current.pendingHandoffRefs.filter((ref) => ref !== interaction.handoffId),
        }, {
          eventId: `owner-failure:${interaction.handoffId}`,
          type: "ERROR",
          createdAt: new Date().toISOString(),
          presentationStatus: "FAILURE",
          text: `${ownerResult.feedbackText}${ownerResult.recoveryText ? ` ${ownerResult.recoveryText}` : ""}`,
          ownerRefs: [ownerTarget, interaction.handoffId],
          replayContext: { recovery: ownerResult.recoveryText ?? "RETRY" },
        }));
        return;
      }
      setConversationSession((current) => completeConversationalOwnerHandoff(current, {
        handoffRef: interaction.handoffId,
        ownerRef: ownerResult.ownerRef,
        ownerResultRef: ownerResult.ownerResultRef,
        projectRef: ownerResult.projectRef,
        projectVersion: ownerResult.projectVersion,
        projectDigest: ownerResult.projectDigest,
        qryMemoryRef: ownerResult.qryMemoryRef,
        qryActionRef: ownerResult.qryActionRef,
        completedAt: new Date().toISOString(),
        feedbackText: ownerResult.feedbackText,
      }));
    } catch (caught) {
      const message = ownerFailureMessage(caught);
      setConversationSession((current) => appendConversationEvent({
        ...current,
        pendingHandoffRefs: current.pendingHandoffRefs.filter((ref) => ref !== interaction.handoffId),
      }, {
        eventId: `owner-error:${interaction.handoffId}`,
        type: "ERROR",
        createdAt: new Date().toISOString(),
        presentationStatus: "FAILURE",
        text: `${message} Votre réponse reste conservée.`,
        ownerRefs: [ownerTarget, interaction.handoffId],
        replayContext: { recovery: "RETRY" },
      }));
    } finally { setBusy(false); }
  };

  const requestCorrection = () => {
    setDraft("Je corrige la compréhension précédente : ");
    setConversationSession((current) => ({ ...current, understanding: { ...current.understanding, status: "CORRECTION_REQUESTED" }, updatedAt: new Date().toISOString() }));
    window.setTimeout(() => document.getElementById("continuous-scientific-conversation-message")?.focus(), 0);
  };
  const addPrecision = () => {
    setDraft("J’ajoute une précision : ");
    window.setTimeout(() => document.getElementById("continuous-scientific-conversation-message")?.focus(), 0);
  };
  const reset = () => {
    clearScientificInterpretationSession(window.localStorage);
    clearConversationalWorkspaceSession(window.localStorage);
    setOwnerSession(createScientificInterpretationSession());
    setConversationSession(createConversationalWorkspaceSession());
    setDraft("");
    setError(null);
  };

  const mode = conversationSession.currentMode;
  const reviewStatus = conversationSession.understanding.status === "CONFIRMED_WORKING_CONTEXT"
    ? "CONFIRMED" as const
    : conversationSession.understanding.status === "CORRECTION_REQUESTED"
      ? "CORRECTION_REQUESTED" as const
      : "PENDING" as const;
  const continuation = renderContinuation?.(handleOwnerHandoff, mode);
  const expertProjection = <section className="mb-5 rounded-2xl border bg-card p-5 shadow-sm" aria-label="Inspection experte">
    <h2 className="text-lg font-semibold">Audit de l’interprétation scientifique</h2>
    {!contribution ? <p className="mt-3 text-sm text-muted-foreground">Aucune Contribution disponible.</p> : <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <p className="break-all">Contribution : {contribution.identity.contributionId}</p>
      <p>Runtime : {contribution.identity.runtimeId} · {contribution.identity.runtimeVersion}</p>
      <p>Audit : {ownerSession.auditStatus}</p>
      <p>Knowledge : {ownerSession.knowledgeResultRefs.at(-1) ?? "non exécuté"}</p>
    </div>}
  </section>;
  const timeline = <ConversationTimeline session={conversationSession} draft={draft} busy={busy} onDraftChange={setDraft} onSubmit={() => void submitDraft()}>
    <div role="note" className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><span>Ne saisissez aucune donnée patient ou confidentielle. NOXIA structure une question de recherche ; il ne fournit ni avis médical, ni décision thérapeutique.</span></div>
    {contribution && <UnderstandingReviewCard contribution={contribution} status={reviewStatus} onConfirm={confirmUnderstanding} onCorrect={requestCorrection} onAdd={addPrecision} />}
    {canContinue && <button type="button" onClick={continueReasoning} className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">Poursuivre le raisonnement</button>}
    {onResumeStructuredProject && !continuation && <button type="button" onClick={onResumeStructuredProject} className="min-h-11 w-full rounded-xl border px-4 py-3 font-semibold">Reprendre</button>}
    {continuation}
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"><CircleAlert className="h-5 w-5 shrink-0" /><span>{error}</span></div>}
    <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Réinitialiser la conversation</button>
  </ConversationTimeline>;

  return <ConversationalProtocolDesignerShell
    session={conversationSession}
    project={projectProjection}
    timeline={timeline}
    mode={mode}
    expertProjection={expertProjection}
    onModeChange={(nextMode) => setConversationSession((current) => ({ ...current, currentMode: nextMode, updatedAt: new Date().toISOString() }))}
    onRequestProjectEdit={(sectionId) => { setDraft(`Je souhaite modifier la section ${sectionId.toLocaleLowerCase("fr-FR")} : `); window.setTimeout(() => document.getElementById("continuous-scientific-conversation-message")?.focus(), 0); }}
  />;
}
