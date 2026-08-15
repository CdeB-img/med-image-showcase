import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { isPatientLevelExpression } from "@/features/knowledge-engine";
import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { ArrowRight, Check, ChevronRight, CircleAlert, History, LoaderCircle, MessageCircle, Pencil, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScientificInterpretationClientError, requestScientificInterpretationRuntime } from "./client";
import type { ScientificContributionItem } from "./contracts";
import { executeContributionKnowledgeVerification } from "./knowledge";
import {
  acceptScientificInterpretationWorkingBasis,
  appendScientificInterpretationExecution,
  clearScientificInterpretationSession,
  createScientificInterpretationMessage,
  createScientificInterpretationSession,
  linkKnowledgeResultToScientificInterpretationSession,
  loadScientificInterpretationSession,
  migrateLegacySemanticSession,
  persistScientificInterpretationSession,
  readLegacySemanticSession,
  type ScientificInterpretationWorkspaceSession,
} from "./session";
import type { V1ScientificInterpretationProjection } from "./v1-compatibility";

type Props = {
  onOpenStructuredProject: (projection: V1ScientificInterpretationProjection) => void;
  onResumeStructuredProject?: () => void;
  initialDraft?: string;
};

const EXAMPLES = [
  "Je souhaite caractériser un objet scientifique avec plusieurs familles d’observation.",
  "Je veux comparer deux stratégies et quantifier leur résultat avec une méthode d’imagerie.",
  "Je souhaite comparer deux interventions à un temps défini avec un critère principal et un critère secondaire.",
  "Je veux mesurer un processus biologique dans une population définie avec un biomarqueur.",
] as const;

const statusLabel = (item: ScientificContributionItem) => {
  if (item.epistemicBoundary.epistemicStatus === "EXPLICIT_USER_STATED") return "Déclaré";
  if (item.epistemicBoundary.epistemicStatus === "CONFIRMED_BY_USER") return "Confirmé";
  if (item.epistemicBoundary.epistemicStatus === "REJECTED_BY_USER") return "Écarté";
  if (["UNKNOWN", "AMBIGUOUS"].includes(item.epistemicBoundary.epistemicStatus ?? "")) return "À préciser";
  return "Proposé";
};

const toneFor = (item: ScientificContributionItem) => {
  const status = item.epistemicBoundary.epistemicStatus;
  if (["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(status ?? "")) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100";
  if (["UNKNOWN", "AMBIGUOUS", "UNSUPPORTED_CANDIDATE"].includes(status ?? "")) return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-100";
  if (status === "REJECTED_BY_USER") return "border-border bg-muted text-muted-foreground line-through";
  return "border-primary/30 bg-primary/10 text-primary";
};

const ProjectItem = ({ item, onCorrect }: { item: ScientificContributionItem; onCorrect: (item: ScientificContributionItem) => void }) => (
  <li className="rounded-xl border bg-background p-3" data-testid={`scientific-contribution-${(item.proposedType ?? "item").toLowerCase()}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{item.proposedType ?? "Élément scientifique"}</p><p className="mt-1 break-words text-sm font-medium">{item.content}</p></div>
      <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${toneFor(item)}`}>{statusLabel(item)}</span>
    </div>
    {item.epistemicBoundary.activeState !== false && <button onClick={() => onCorrect(item)} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"><Pencil className="h-3 w-3" /> Corriger dans la conversation</button>}
  </li>
);

const uniqueItems = (session: ScientificInterpretationWorkspaceSession) => {
  const contribution = session.currentContribution;
  if (!contribution) return [];
  return [...new Map([
    ...contribution.scientificContent.candidateObjects,
    ...contribution.scientificContent.explicitStatements,
    ...contribution.scientificContent.inferredContext,
    ...contribution.scientificContent.contextualCandidates,
  ].map((item) => [item.itemId, item])).values()];
};

export default function ScientificInterpretationWorkspace({ onOpenStructuredProject, onResumeStructuredProject, initialDraft = "" }: Props) {
  const [session, setSession] = useState<ScientificInterpretationWorkspaceSession>(() => createScientificInterpretationSession());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expertOpen, setExpertOpen] = useState(false);
  const [mobileProjectOpen, setMobileProjectOpen] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restored = loadScientificInterpretationSession(window.localStorage);
    if (restored) { setSession(restored); return; }
    const legacy = readLegacySemanticSession(window.localStorage);
    if (!legacy) return;
    void import("@/features/scientific-semantic-reconstruction/legacy-session-compatibility").then(({ convertLegacySessionModel }) => {
      const migrated = migrateLegacySemanticSession(legacy, convertLegacySessionModel);
      if (migrated) setSession(migrated);
    });
  }, []);
  useEffect(() => {
    if (initialDraft.trim()) setDraft(initialDraft);
  }, [initialDraft]);
  useEffect(() => {
    if (!session.messages.length) return;
    try { persistScientificInterpretationSession(window.localStorage, session); } catch { /* sensitive sessions are intentionally not stored */ }
  }, [session]);
  useEffect(() => { transcriptEndRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" }); }, [session.messages.length, busy]);

  const contribution = session.currentContribution;
  const visibleItems = useMemo(() => uniqueItems(session).filter((item) => item.epistemicBoundary.activeState !== false), [session]);
  const canAccept = Boolean(session.currentProjection && !session.reviewRequired && session.auditStatus !== "CRITICAL_FINDINGS");
  const canContinue = Boolean(session.currentProjection && session.workingBasisAcceptedAt);

  const analyze = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    setError(null);
    if (detectSensitiveData(content).length) { setError("Retirez toute donnée personnelle, patient ou confidentielle avant de poursuivre."); return; }
    if (isPatientLevelExpression(content)) { setError("NOXIA n’interprète pas une valeur individuelle. Reformulez-la comme une question scientifique générale."); return; }
    const userMessage = createScientificInterpretationMessage("USER", content);
    const messages = [...session.messages, userMessage];
    const previousContribution = session.currentContribution;
    setSession((current) => ({ ...current, messages, updatedAt: userMessage.createdAt ?? new Date().toISOString() }));
    setDraft("");
    setBusy(true);
    try {
      const response = await requestScientificInterpretationRuntime({
        conversation: { conversationId: session.sessionId, language: "fr", turns: messages },
        previousContribution,
      });
      const assistantMessage = createScientificInterpretationMessage("NOXIA", response.contribution.scientificContent.normalizedUnderstanding ?? "La demande est conservée pour revue.");
      let next = appendScientificInterpretationExecution({ ...session, messages }, response, assistantMessage);
      const knowledge = executeContributionKnowledgeVerification(response.contribution);
      if (knowledge) next = linkKnowledgeResultToScientificInterpretationSession(next, knowledge.knowledgeResultRef);
      setSession(next);
      if (response.fallbackUsed) setError("Le runtime hybride a rencontré une défaillance technique. Le rollback SEM legacy a été utilisé et reste visible dans la trace.");
      else if (response.auditStatus === "CRITICAL_FINDINGS") setError("Un contrôle déterministe critique exige une revue avant toute projection utilisable.");
    } catch (caught) {
      const clientError = caught instanceof ScientificInterpretationClientError ? caught : null;
      setSession((current) => ({ ...current, technicalStatus: "FAIL_CLOSED", reviewRequired: true, updatedAt: new Date().toISOString() }));
      setError(clientError?.code === "RAW_PERSISTENCE_FAILURE"
        ? "La sortie brute n’a pas pu être conservée : arrêt sécurisé, sans fallback."
        : clientError?.message ?? "L’interprétation scientifique est indisponible. Votre texte reste conservé.");
    } finally { setBusy(false); }
  };

  const accept = () => setSession((current) => acceptScientificInterpretationWorkingBasis(current));
  const reset = () => { clearScientificInterpretationSession(window.localStorage); setSession(createScientificInterpretationSession()); setDraft(""); setError(null); setBusy(false); };
  const correct = (item: ScientificContributionItem) => { setDraft(`Je corrige « ${item.content} » : `); document.getElementById("scientific-interpretation-message")?.focus(); };

  return <main id="demo-main" className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Protocol Designer</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Construisons votre projet scientifique</h1><p className="mt-2 max-w-3xl text-muted-foreground">Écrivez comme à un collègue. NOXIA distingue ce que vous avez dit, ce qu’il propose et ce qui reste à préciser.</p></div>
        <div className="flex flex-wrap gap-2">{onResumeStructuredProject && <button aria-label="Reprendre" onClick={onResumeStructuredProject} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Reprendre l’espace de recherche</button>}<button aria-expanded={expertOpen} onClick={() => setExpertOpen((current) => !current)} className="rounded-lg border px-3 py-2 text-sm">{expertOpen ? "Masquer la trace" : "Inspecter la trace"}</button><AlertDialog><AlertDialogTrigger asChild><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Réinitialiser la conversation</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Réinitialiser cette conversation ?</AlertDialogTitle><AlertDialogDescription>Seuls les messages, Contributions et corrections de cet espace conversationnel local seront supprimés. Un Research Project déjà ouvert n’est pas effacé par cette action.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset}>Supprimer cette conversation</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
      </header>
      <div role="note" className="mb-5 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><span>Ne saisissez aucune donnée patient ou confidentielle. NOXIA structure une question de recherche ; il ne fournit ni avis médical, ni décision thérapeutique.</span></div>

      {expertOpen && <section className="mb-5 rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Vue secondaire</p><h2 className="mt-1 text-lg font-semibold">Audit de l’interprétation scientifique</h2></div><span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">Contribution runtime-neutral</span></div>{!contribution ? <p className="mt-4 text-sm text-muted-foreground">Aucune Contribution n’a encore été produite.</p> : <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground"><p><strong className="text-foreground">Contribution :</strong> {contribution.identity.contributionId}</p><p className="mt-2"><strong className="text-foreground">Runtime :</strong> {contribution.identity.runtimeId} · {contribution.identity.runtimeVersion}</p><p className="mt-2"><strong className="text-foreground">Mode :</strong> {session.runtimeMode}</p><p className="mt-2"><strong className="text-foreground">Technique :</strong> {session.technicalStatus}</p><p className="mt-2"><strong className="text-foreground">Audit-D :</strong> {session.auditStatus} · {contribution.audit.unresolvedFindings.length} finding(s)</p><p className="mt-2"><strong className="text-foreground">Knowledge :</strong> {session.knowledgeResultRefs.at(-1) ?? "non exécuté"}</p></div><div className="rounded-xl border p-4"><h3 className="text-sm font-semibold">Relations candidates</h3>{contribution.scientificContent.candidateRelations.length ? <ul className="mt-2 space-y-2 text-xs text-muted-foreground">{contribution.scientificContent.candidateRelations.map((relation) => <li key={relation.relationId} className="break-words rounded-lg bg-muted/50 p-2">{relation.sourceItemId} — {relation.relationType} → {relation.targetItemId} · {relation.polarity ?? "polarité non fournie"}</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">Aucune relation candidate.</p>}</div></div>}</section>}

      <button
        type="button"
        aria-expanded={mobileProjectOpen}
        aria-controls="scientific-interpretation-project"
        onClick={() => setMobileProjectOpen((open) => !open)}
        className="sticky top-2 z-20 mb-5 min-h-11 w-full rounded-xl border bg-background px-4 py-3 text-left font-semibold shadow-sm lg:hidden"
      >
        {mobileProjectOpen ? "Masquer le Research Project" : "Voir le Research Project"}
      </button>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(300px,.65fr)_minmax(0,1.35fr)]">
        <section className="flex min-h-[68vh] min-w-0 flex-col rounded-2xl border bg-card shadow-sm"><div className="border-b p-5"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Conversation</h2></div><p className="mt-1 text-sm text-muted-foreground">Une correction en langage libre met à jour la compréhension sans effacer l’historique.</p></div><div className="min-h-72 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">{!session.messages.length && <div className="rounded-2xl bg-primary/10 p-5"><p className="font-semibold">Que cherchez-vous à démontrer, comparer, mesurer, prédire ou comprendre ?</p><p className="mt-2 text-sm text-muted-foreground">Une idée incomplète est recevable. Je commencerai par reconstruire le maximum avant de vous demander une précision utile.</p><div className="mt-4 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} onClick={() => setDraft(example)} className="rounded-full border bg-background px-3 py-2 text-left text-xs hover:border-primary">{example}</button>)}</div></div>}{session.messages.map((message) => <article key={message.turnId} className={`max-w-[92%] rounded-2xl p-4 ${message.role === "USER" ? "ml-auto rounded-br-sm bg-muted" : "mr-auto rounded-bl-sm bg-primary/10"}`}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{message.role === "USER" ? "Vous" : "NOXIA"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p></article>)}{busy && <div role="status" className="mr-auto flex max-w-[92%] items-center gap-3 rounded-2xl rounded-bl-sm bg-primary/10 p-4 text-sm"><LoaderCircle className="h-4 w-4 animate-spin" /> Je reconstruis les objets, leurs relations et les ambiguïtés…</div>}<div ref={transcriptEndRef} /></div><div className="border-t p-4 sm:p-5">{session.technicalStatus === "FAIL_CLOSED" && <div role="alert" className="mb-3 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"><CircleAlert className="h-5 w-5 shrink-0" /><span><strong>Arrêt sécurisé.</strong> Le texte est conservé ; aucune projection ni écriture Project n’a été produite.</span></div>}{error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}<label htmlFor="scientific-interpretation-message" className="sr-only">Votre question scientifique</label><textarea id="scientific-interpretation-message" maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 4000))} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void analyze(); }} className="min-h-28 w-full resize-y rounded-xl border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={session.messages.length ? "Ajoutez une précision ou corrigez naturellement…" : "Décrivez librement votre question scientifique…"} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">⌘/Ctrl + Entrée pour envoyer · <span>{draft.length} / 4 000</span></p><button disabled={busy || !draft.trim()} onClick={() => void analyze()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{session.messages.length ? "Envoyer" : "Commencer la conversation"} <ArrowRight className="h-4 w-4" /></button></div></div></section>

        <aside id="scientific-interpretation-project" aria-label="Research Project en construction" className={`${mobileProjectOpen ? "block" : "hidden"} order-first min-w-0 self-start rounded-2xl border bg-card shadow-sm lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`}><div className="border-b p-5"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Projet en construction</h2></div><p className="mt-1 text-sm text-muted-foreground">Une vue structurée candidate de la conversation, jamais une seconde source de vérité.</p></div><div className="space-y-5 p-4 sm:p-5">{!contribution && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Les éléments apparaîtront ici à mesure qu’ils seront compris.</div>}{contribution && <><section className="rounded-xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Compréhension actuelle</p><p className="mt-2 text-sm leading-relaxed">{contribution.scientificContent.normalizedUnderstanding ?? contribution.source.originalRequest}</p>{session.fallbackHistory.length > 0 && <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">Fallback legacy visible : {session.fallbackHistory.at(-1)?.failureClass}. Les identités hybride et legacy ne sont pas fusionnées.</p>}</section>{visibleItems.length > 0 && <section><h3 className="text-sm font-semibold">Éléments scientifiques</h3><ul className="mt-2 grid gap-2">{visibleItems.map((item) => <ProjectItem key={item.itemId} item={item} onCorrect={correct} />)}</ul></section>}{contribution.scientificContent.clarificationNeeds[0] && <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-100">Précision utile</p><p className="mt-2 text-sm font-medium">{contribution.scientificContent.clarificationNeeds[0].content}</p></section>}{session.auditStatus === "CRITICAL_FINDINGS" && <section className="rounded-xl border border-destructive/40 bg-destructive/10 p-4"><p className="text-sm font-semibold">Revue requise</p><ul className="mt-2 space-y-1 text-xs">{contribution.audit.unresolvedFindings.filter((item) => item.severity === "CRITICAL").map((item) => <li key={item.findingId}>{item.code} — {item.message}</li>)}</ul></section>}<div className="flex flex-col gap-2 sm:flex-row">{canAccept && !session.workingBasisAcceptedAt && <button onClick={accept} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Check className="h-4 w-4" /> Confirmer cette compréhension</button>}{canContinue && session.currentProjection && <button onClick={() => onOpenStructuredProject(session.currentProjection!)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Poursuivre le raisonnement <ChevronRight className="h-4 w-4" /></button>}</div><details className="rounded-xl border p-4 text-sm"><summary className="cursor-pointer font-semibold">Sources et raisonnement</summary><div className="mt-3 space-y-2 break-words text-xs text-muted-foreground"><p>Contribution : {contribution.identity.contributionId}</p><p>Runtime : {contribution.identity.runtimeId} · {contribution.identity.runtimeVersion}</p><p>Raw : {contribution.source.rawOutputRef ?? "non disponible"}</p><p>Audit-D : {contribution.audit.unresolvedFindings.length} finding(s)</p><p>Digest : {contribution.identity.contributionDigest}</p>{session.contributionHistory.length > 0 && <p className="inline-flex items-center gap-1"><History className="h-3 w-3" /> {session.contributionHistory.length} état(s) antérieur(s) conservé(s)</p>}</div></details></>}</div></aside>
      </div>
    </div>
  </main>;
}
