import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { isPatientLevelExpression } from "@/features/knowledge-engine";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowRight, Check, ChevronRight, CircleAlert, History, LoaderCircle, MessageCircle, Pencil, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { acceptSemanticModel, createDegradedSemanticModel } from "./canonical";
import { requestSemanticReconstruction, SemanticClientError } from "./client";
import { verifySemanticModelWithKnowledge } from "./knowledge";
import { appendSemanticModel, clearSemanticWorkspace, createSemanticMessage, createSemanticWorkspaceSession, loadSemanticWorkspace, persistSemanticWorkspace } from "./session";
import { SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, type ScientificSemanticModel, type SemanticElement, type SemanticElementType, type SemanticWorkspaceSession } from "./types";

type Props = {
  onOpenStructuredProject: (model: ScientificSemanticModel) => void;
  onResumeStructuredProject?: () => void;
};

const EXAMPLES = [
  "Je souhaite caractériser un objet scientifique avec plusieurs familles d’observation.",
  "Je veux comparer deux stratégies et quantifier leur résultat avec une méthode d’imagerie.",
  "Je souhaite comparer deux interventions à un temps défini avec un critère principal et un critère secondaire.",
  "Je veux mesurer un processus biologique dans une population définie avec un biomarqueur.",
] as const;

const STATUS_LABELS: Record<SemanticElement["epistemicStatus"], string> = {
  EXPLICIT_USER_STATED: "Déclaré",
  INFERRED_HIGH_CONFIDENCE: "Proposé — très plausible",
  INFERRED_CANDIDATE: "Proposé",
  SUPPORTED_CANDIDATE: "Proposé — couvert par le corpus",
  UNSUPPORTED_CANDIDATE: "Proposé — non couvert",
  CONFIRMED_BY_USER: "Confirmé",
  REJECTED_BY_USER: "Écarté",
  UNKNOWN: "À préciser",
  AMBIGUOUS: "Ambigu",
};

const TYPE_LABELS: Partial<Record<SemanticElementType, string>> = {
  OPERATION: "Action scientifique", SCIENTIFIC_INTENT: "Intention", SCIENTIFIC_OBJECT: "Objet scientifique", ANATOMICAL_CONTEXT: "Contexte anatomique",
  CONDITION: "Contexte pathologique", POPULATION: "Population", INTERVENTION: "Intervention", COMPARATOR: "Comparateur", PHENOMENON: "Phénomène",
  MECHANISM: "Mécanisme candidat", BIOMARKER: "Biomarqueur candidat", MODALITY: "Modalité", METHOD: "Méthode", ENDPOINT: "Critère candidat",
  OUTCOME: "Résultat", TIMING: "Temporalité", STUDY_DESIGN: "Design", CONSTRAINT: "Contrainte", ASSUMPTION: "Hypothèse de lecture",
  EXPECTED_DIRECTION: "Direction attendue candidate", MISSING_CONCEPT: "Concept manquant", ELLIPSIS: "Ellipse", AMBIGUITY: "Ambiguïté", UNKNOWN: "Inconnu", CONTRADICTION: "Contradiction",
};

const GROUPS: Array<{ title: string; types: SemanticElementType[] }> = [
  { title: "Question et intention", types: ["OPERATION", "SCIENTIFIC_INTENT", "SCIENTIFIC_OBJECT", "ANATOMICAL_CONTEXT", "CONDITION", "PHENOMENON"] },
  { title: "Population et comparaison", types: ["POPULATION", "INTERVENTION", "COMPARATOR"] },
  { title: "Mesures et imagerie", types: ["BIOMARKER", "MODALITY", "METHOD", "ENDPOINT", "OUTCOME", "TIMING"] },
  { title: "Hypothèses de travail", types: ["MECHANISM", "ASSUMPTION", "EXPECTED_DIRECTION", "STUDY_DESIGN", "CONSTRAINT"] },
  { title: "À préciser", types: ["MISSING_CONCEPT", "ELLIPSIS", "AMBIGUITY", "UNKNOWN", "CONTRADICTION"] },
];

const toneFor = (status: SemanticElement["epistemicStatus"]) => {
  if (["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"].includes(status)) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100";
  if (["UNKNOWN", "AMBIGUOUS", "UNSUPPORTED_CANDIDATE"].includes(status)) return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-100";
  if (status === "REJECTED_BY_USER") return "border-border bg-muted text-muted-foreground line-through";
  return "border-primary/30 bg-primary/10 text-primary";
};

const ProjectElement = ({ element, onCorrect }: { element: SemanticElement; onCorrect: (element: SemanticElement) => void }) => (
  <li className="rounded-xl border bg-background p-3" data-testid={`semantic-element-${element.type.toLowerCase()}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{TYPE_LABELS[element.type] ?? element.type}</p>
        <p className="mt-1 break-words text-sm font-medium">{element.canonicalMeaning}</p>
      </div>
      <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${toneFor(element.epistemicStatus)}`}>{STATUS_LABELS[element.epistemicStatus]}</span>
    </div>
    {element.inferenceReason && <p className="mt-2 text-xs text-muted-foreground">Pourquoi proposé : {element.inferenceReason}</p>}
    {element.epistemicStatus !== "REJECTED_BY_USER" && <button onClick={() => onCorrect(element)} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"><Pencil className="h-3 w-3" /> Corriger dans la conversation</button>}
  </li>
);

export default function SemanticConversationalWorkspace({ onOpenStructuredProject, onResumeStructuredProject }: Props) {
  const [session, setSession] = useState<SemanticWorkspaceSession>(() => createSemanticWorkspaceSession());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expertOpen, setExpertOpen] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restored = loadSemanticWorkspace(window.localStorage);
    if (restored) setSession(restored);
  }, []);
  useEffect(() => {
    if (!session.messages.length) return;
    try { persistSemanticWorkspace(window.localStorage, session); } catch { /* sensitive sessions are never persisted */ }
  }, [session]);
  useEffect(() => {
    const node = transcriptEndRef.current;
    if (node && typeof node.scrollIntoView === "function") node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [session.messages.length, busy]);

  const model = session.currentModel;
  const visibleElements = useMemo(() => model?.elements.filter((item) => item.epistemicStatus !== "REJECTED_BY_USER") ?? [], [model]);
  const canAccept = model?.status === "CANDIDATE";
  const canContinue = model?.status === "ACCEPTED" && model.routeProposal.route !== "DOCUMENT";

  const analyze = async () => {
    const content = draft.trim();
    if (!content || busy) return;
    setError(null);
    if (detectSensitiveData(content).length) { setError("Retirez toute donnée personnelle, patient ou confidentielle avant de poursuivre."); return; }
    if (isPatientLevelExpression(content)) { setError("NOXIA n’interprète pas une valeur individuelle. Reformulez-la comme une question scientifique générale."); return; }
    const userMessage = createSemanticMessage("USER", content);
    const messages = [...session.messages, userMessage];
    const request = { schemaVersion: SCIENTIFIC_SEMANTIC_SCHEMA_VERSION, sessionId: session.sessionId, language: "fr" as const, messages, previousModel: session.currentModel };
    setSession((current) => ({ ...current, messages, updatedAt: userMessage.createdAt }));
    setDraft("");
    setBusy(true);
    try {
      const response = await requestSemanticReconstruction({ sessionId: session.sessionId, language: "fr", messages, previousModel: session.currentModel });
      const verified = response.mode === "LIVE_LLM" ? verifySemanticModelWithKnowledge(response.model) : response.model;
      const assistantMessage = createSemanticMessage("NOXIA", verified.summaryForUser);
      setSession((current) => appendSemanticModel(current, verified, assistantMessage));
    } catch (caught) {
      const degraded = createDegradedSemanticModel(request);
      const assistantMessage = createSemanticMessage("NOXIA", degraded.summaryForUser);
      setSession((current) => appendSemanticModel(current, degraded, assistantMessage));
      setError(caught instanceof SemanticClientError ? caught.message : "La compréhension avancée est indisponible. Votre texte reste conservé.");
    } finally { setBusy(false); }
  };

  const accept = () => {
    if (!model || !canAccept) return;
    const accepted = acceptSemanticModel(model);
    const assistantMessage = createSemanticMessage("NOXIA", "Cette compréhension est maintenant figée comme snapshot de travail. Les propositions non couvertes par Knowledge restent visibles comme telles.");
    setSession((current) => appendSemanticModel(current, accepted, assistantMessage));
  };

  const reset = () => {
    clearSemanticWorkspace(window.localStorage);
    setSession(createSemanticWorkspaceSession());
    setDraft(""); setError(null); setBusy(false);
  };

  const correct = (element: SemanticElement) => {
    setDraft(`Je corrige « ${element.canonicalMeaning} » : `);
    document.getElementById("semantic-message")?.focus();
  };

  return <main id="demo-main" className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Protocol Designer</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Construisons votre projet scientifique</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Écrivez comme à un collègue. NOXIA distingue ce que vous avez dit, ce qu’il propose et ce qui reste à préciser.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onResumeStructuredProject && <button onClick={onResumeStructuredProject} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Reprendre</button>}
          <button aria-expanded={expertOpen} aria-controls="semantic-expert-panel" onClick={() => setExpertOpen((current) => !current)} className="rounded-lg border px-3 py-2 text-sm">{expertOpen ? "Masquer l’audit" : "Audit / mode expert"}</button>
          <AlertDialog><AlertDialogTrigger asChild><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" /> Réinitialiser la conversation</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Réinitialiser cette conversation ?</AlertDialogTitle><AlertDialogDescription>Les messages, snapshots et corrections de cet espace local seront supprimés. Les autres données du navigateur ne seront pas touchées.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={reset}>Supprimer cette conversation</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
      </header>

      <div role="note" className="mb-5 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <span>Ne saisissez aucune donnée patient ou confidentielle. NOXIA structure une question de recherche ; il ne fournit ni avis médical, ni décision thérapeutique.</span>
      </div>

      {expertOpen && <section id="semantic-expert-panel" aria-labelledby="semantic-expert-title" className="mb-5 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Vue secondaire</p><h2 id="semantic-expert-title" className="mt-1 text-lg font-semibold">Audit du modèle sémantique</h2></div>
          <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">La conversation reste la surface principale</span>
        </div>
        {!model ? <p className="mt-4 text-sm text-muted-foreground">Aucun snapshot sémantique n’a encore été produit.</p> : <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Snapshot :</strong> {model.semanticModelId}</p>
            <p className="mt-2"><strong className="text-foreground">Version :</strong> {model.semanticModelVersion} · révision {model.revision}</p>
            <p className="mt-2"><strong className="text-foreground">Exécution :</strong> {model.executionSnapshot?.provider ?? "indisponible"} · {model.executionSnapshot?.model ?? "indisponible"}</p>
            <p className="mt-2"><strong className="text-foreground">Critique :</strong> {model.critic.verdict} · {model.critic.issues.length} signalement(s)</p>
            <p className="mt-2"><strong className="text-foreground">Knowledge :</strong> {model.knowledgeSnapshot?.coverageStatus ?? "non exécuté"}</p>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="text-sm font-semibold">Relations du graphe sémantique</h3>
            {model.relations.length ? <ul className="mt-2 space-y-2 text-xs text-muted-foreground">{model.relations.map((relation) => <li key={relation.semanticRelationId} className="break-words rounded-lg bg-muted/50 p-2">{relation.sourceElementId} — {relation.relationType} → {relation.targetElementId} · {STATUS_LABELS[relation.epistemicStatus]}</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">Aucune relation reconstruite.</p>}
          </div>
        </div>}
      </section>}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)]">
        <section aria-labelledby="conversation-title" className="flex min-h-[68vh] min-w-0 flex-col rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" /><h2 id="conversation-title" className="text-xl font-semibold">Conversation</h2></div><p className="mt-1 text-sm text-muted-foreground">Une correction en langage libre met à jour la compréhension sans effacer l’historique.</p></div>
          <div className="min-h-72 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
            {!session.messages.length && <div className="rounded-2xl bg-primary/10 p-5"><p className="font-semibold">Que cherchez-vous à démontrer, comparer, mesurer, prédire ou comprendre ?</p><p className="mt-2 text-sm text-muted-foreground">Une idée incomplète est recevable. Je commencerai par reconstruire le maximum avant de vous demander une précision utile.</p><div className="mt-4 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} onClick={() => setDraft(example)} className="rounded-full border bg-background px-3 py-2 text-left text-xs hover:border-primary">{example}</button>)}</div></div>}
            {session.messages.map((message) => <article key={message.messageId} className={`max-w-[92%] rounded-2xl p-4 ${message.role === "USER" ? "ml-auto rounded-br-sm bg-muted" : "mr-auto rounded-bl-sm bg-primary/10"}`}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{message.role === "USER" ? "Vous" : "NOXIA"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p></article>)}
            {busy && <div role="status" className="mr-auto flex max-w-[92%] items-center gap-3 rounded-2xl rounded-bl-sm bg-primary/10 p-4 text-sm"><LoaderCircle className="h-4 w-4 animate-spin" /> Je reconstruis les objets, leurs relations et les ambiguïtés…</div>}
            <div ref={transcriptEndRef} />
          </div>
          <div className="border-t p-4 sm:p-5">
            {model?.status === "SEMANTIC_RECONSTRUCTION_DEGRADED" && <div role="alert" className="mb-3 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"><CircleAlert className="h-5 w-5 shrink-0" /><span><strong>Compréhension avancée indisponible.</strong> Le texte est conservé, mais le mode local n’est pas présenté comme équivalent.</span></div>}
            {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
            <label htmlFor="semantic-message" className="sr-only">Votre question scientifique</label>
            <textarea id="semantic-message" maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 4000))} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void analyze(); }} className="min-h-28 w-full resize-y rounded-xl border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder={session.messages.length ? "Ajoutez une précision ou corrigez naturellement…" : "Décrivez librement votre question scientifique…"} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">⌘/Ctrl + Entrée pour envoyer · <span>{draft.length} / 4 000</span></p><button disabled={busy || !draft.trim()} onClick={() => void analyze()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{session.messages.length ? "Envoyer" : "Commencer la conversation"} <ArrowRight className="h-4 w-4" /></button></div>
          </div>
        </section>

        <aside aria-labelledby="project-title" className="min-w-0 rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 id="project-title" className="text-xl font-semibold">Projet en construction</h2></div><p className="mt-1 text-sm text-muted-foreground">Une vue structurée de la conversation, jamais une seconde source de vérité.</p></div>
          <div className="space-y-5 p-4 sm:p-5">
            {!model && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Les éléments du projet apparaîtront ici à mesure qu’ils seront compris.</div>}
            {model && <>
              <section className="rounded-xl bg-muted/50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Compréhension actuelle</p><p className="mt-2 text-sm leading-relaxed">{model.normalizedMeaning}</p>{model.routeProposal.route === "DOCUMENT" && <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">Une demande documentaire a été reconnue, mais aucun document ne peut être généré sans Research Project suffisamment construit et autorisé.</p>}</section>
              {GROUPS.map((group) => {
                const elements = visibleElements.filter((item) => group.types.includes(item.type));
                if (!elements.length) return null;
                return <section key={group.title}><h3 className="text-sm font-semibold">{group.title}</h3><ul className="mt-2 grid gap-2">{elements.map((element) => <ProjectElement key={element.semanticElementId} element={element} onCorrect={correct} />)}</ul></section>;
              })}
              {model.clarificationCandidates[0] && <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-100">Précision la plus utile</p><p className="mt-2 text-sm font-medium">{model.clarificationCandidates[0].question}</p><p className="mt-1 text-xs text-muted-foreground">{model.clarificationCandidates[0].reason}</p></section>}
              <div className="flex flex-col gap-2 sm:flex-row">
                {canAccept && <button onClick={accept} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Check className="h-4 w-4" /> Confirmer cette compréhension</button>}
                {canContinue && <button onClick={() => onOpenStructuredProject(model)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Poursuivre le raisonnement <ChevronRight className="h-4 w-4" /></button>}
              </div>
              <details className="rounded-xl border p-4 text-sm"><summary className="cursor-pointer font-semibold">Sources et raisonnement</summary><div className="mt-3 space-y-2 break-words text-xs text-muted-foreground"><p>Version du modèle sémantique : {model.semanticModelVersion} · révision {model.revision}</p><p>Snapshot : {model.semanticModelId}</p><p>Provider : {model.executionSnapshot?.provider ?? "indisponible"} · modèle : {model.executionSnapshot?.model ?? "indisponible"}</p><p>Prompts : {model.executionSnapshot?.reconstructionPromptVersion ?? "non exécuté"} / {model.executionSnapshot?.criticPromptVersion ?? "non exécuté"}</p><p>Knowledge : {model.knowledgeSnapshot ? `${model.knowledgeSnapshot.coverageStatus} · ${model.knowledgeSnapshot.resultId}` : "non exécuté"}</p><p>Critique : {model.critic.verdict} · {model.critic.issues.length} signalement(s)</p><p>Digest : {model.digest}</p>{model.history.length > 0 && <p className="inline-flex items-center gap-1"><History className="h-3 w-3" /> {model.history.length} état(s) antérieur(s) conservé(s)</p>}</div></details>
            </>}
          </div>
        </aside>
      </div>
    </div>
  </main>;
}
