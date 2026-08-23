import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowUp, LoaderCircle, MessageSquareText, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { requestProtocolDesignerBridge } from "@/features/protocol-designer/product-bridge-client";
import {
  authorizeResearchProjectDocumentHandoff,
  confirmResearchProjectContribution,
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
  clarifyFunctionalResetQueryAfterMisunderstanding,
  isFunctionalResetQueryMisunderstanding,
  recordFunctionalResetQueryResponse,
} from "@/features/query-navigation";
import ContributionReview from "./ContributionReview";
import ProtocolPreview from "./ProtocolPreview";
import ResearchProjectPanel from "./ResearchProjectPanel";
import {
  clearFunctionalResetSession,
  createConversationEntryId,
  createFunctionalResetSession,
  createTurnId,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
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

export default function ProtocolDesignerWorkspace() {
  const [session, setSession] = useState<FunctionalResetSession>(loadInitialSession);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [correctionMode, setCorrectionMode] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistFunctionalResetSession(window.localStorage, session);
    if (import.meta.env.DEV && session.bridgeTraces.length > 0) {
      console.debug("NOXIA_PRODUCT_BRIDGE_TRACE", JSON.stringify(session.bridgeTraces.at(-1)));
    }
  }, [session]);

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
    const responseId = createConversationEntryId();
    const asksForExplanationOrRephrase = isFunctionalResetQueryMisunderstanding(content);
    const misunderstanding = Boolean(session.queryNavigation && asksForExplanationOrRephrase);
    const standaloneQuestion = content.endsWith("?")
      && !/[.;\n]/.test(content.slice(0, -1))
      && (content.match(/,/g)?.length ?? 0) === 0;
    const qryNeedBefore = session.queryNavigation?.currentAction?.navigationNeedRefs[0] ?? null;
    const queryNavigation = session.queryNavigation
      ? misunderstanding
        ? clarifyFunctionalResetQueryAfterMisunderstanding({
          navigation: session.queryNavigation,
          rawResponse: content,
          actorRef: session.projectAuthority.actorRef,
          actorRole: "RESEARCHER",
          receivedAt: now,
          responseId,
        })
        : recordFunctionalResetQueryResponse({
          navigation: session.queryNavigation,
          rawResponse: content,
          actorRef: session.projectAuthority.actorRef,
          actorRole: "RESEARCHER",
          receivedAt: now,
          responseId,
        })
      : null;
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
      const response = await requestProtocolDesignerBridge({
        conversation: {
          conversationId: session.conversationId,
          language: "fr",
          turns: runtimeTurns,
          ...(queryNavigation?.currentAction && queryNavigation.currentPresentation ? {
            interactionContext: {
              interactionRef: queryNavigation.currentPresentation.presentationId,
              sourceActionRef: queryNavigation.currentAction.selectedActionId,
              owner: "QUERY_NAVIGATION",
              purpose: queryNavigation.currentPresentation.intent,
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
        // QRY clarification/explanation requests are already identified by the
        // existing product contract and must remain one-call conversation turns.
        evaluatePersistentDelta: !asksForExplanationOrRephrase && !standaloneQuestion,
      });
      const receivedAt = new Date().toISOString();
      const contribution = response.persistentExtraction.contribution;
      const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, session.project) : null;
      const effectiveCandidate = candidate?.changeSet.status === "PENDING_HUMAN_CONFIRMATION" ? candidate : null;
      setSession((current) => ({
        ...current,
        queryNavigation,
        runtimeTurns: [...runtimeTurns, response.assistantTurn],
        pendingContribution: effectiveCandidate ? contribution : null,
        entries: [
          ...current.entries,
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
        ],
        bridgeTraces: import.meta.env.DEV ? [...current.bridgeTraces, {
          turnId: userTurn.turnId,
          raw: content,
          assistantReply: response.assistantReply,
          persistentExtractionCalled: response.persistentExtraction.called,
          persistentExtractionStatus: response.persistentExtraction.status,
          persistentCandidate: response.persistentExtraction.candidate,
          deterministicValidation: response.persistentExtraction.validation,
          projectChangeSetCandidate: effectiveCandidate?.changeSet ?? null,
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
        }] : current.bridgeTraces,
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

  const confirmContribution = (contributionId: string) => {
    const contribution = session.pendingContribution;
    if (!contribution || contribution.identity.contributionId !== contributionId) return;
    const now = new Date().toISOString();
    try {
      const project = confirmResearchProjectContribution({
        contribution,
        current: session.project,
        projectId: session.projectId,
        authority: session.projectAuthority,
        confirmedAt: now,
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
      const nextQuestion = queryNavigation.standardQuestion
        ? `${queryNavigation.standardQuestion.priorityLead}\n\n${queryNavigation.standardQuestion.text}`
        : null;
      const feedback = [session.project ? "Projet mis à jour." : "Projet créé.", nextQuestion]
        .filter((value): value is string => Boolean(value))
        .join("\n\n");
      setSession((current) => ({
        ...current,
        project,
        queryNavigation,
        documents,
        currentContribution: contribution,
        pendingContribution: null,
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
    } catch {
      setSession((current) => ({
        ...current,
        entries: [...current.entries, {
          entryId: createConversationEntryId(),
          kind: "ERROR",
          role: "NOXIA",
          content: "NOXIA n’a pas pu mettre à jour cette partie du projet. Votre contribution reste disponible pour réessayer.",
          createdAt: now,
        }],
        updatedAt: now,
      }));
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
    window.setTimeout(() => composerRef.current?.focus(), 0);
  };

  const openProjection = functionalProtocolProjection(session.documents, session.openDocumentProjectionId);
  const protocolCard = session.documents.cards.find((card) => card.kind === "PROTOCOL");
  const projectPanel = <ResearchProjectPanel
    project={session.project}
    documents={session.documents}
    onOpenProtocol={(projectionId) => setSession((current) => ({ ...current, openDocumentProjectionId: projectionId }))}
    onRequestProtocol={requestProtocolProjection}
  />;

  return <main id="demo-main" className="min-h-screen bg-muted/30 text-foreground" data-testid="functional-reset-workspace">
    <Helmet>
      <title>Protocol Designer — NOXIA</title>
      <meta name="description" content="Construisez votre Research Project dans une conversation continue avec NOXIA." />
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
            <p className="mt-1 text-sm text-muted-foreground">Décrivez votre idée, confirmez la structure proposée, puis faites évoluer le projet dans le même échange.</p>
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
                <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${
                  entry.kind === "ERROR" ? "border border-destructive/40 bg-destructive/10 text-destructive"
                    : entry.role === "USER" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`} role={entry.kind === "ERROR" ? "alert" : undefined}>{entry.content}</div>
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
                placeholder={correctionMode ? "Ce que je souhaite corriger…" : session.project ? "Ajouter ou modifier un élément du projet…" : "Décrivez votre projet de recherche…"}
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
