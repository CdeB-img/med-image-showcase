import { BookOpen, Check, CircleAlert, GitBranch, HelpCircle, Lightbulb, Network, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  answerScientificThinkingQuestion,
  authorizeResearchDesignHandoff,
  decideScientificThinkingBranch,
  reviewScientificHypothesis,
  reviewScientificObjective,
  selectScientificQuestion,
  setUnknownAccepted,
} from "./session";
import type { CandidateReviewState, ScientificThinkingSession } from "./types";

type Props = {
  session: ScientificThinkingSession;
  onChange: (session: ScientificThinkingSession) => void;
  onReturnToUnderstand: () => void;
  onExploreKnowledge?: () => void;
  onEnterResearchDesign: () => void;
  onEditOriginalIdea?: () => void;
};

const Box = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <section className={`min-w-0 break-words rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}>{children}</section>;
const Badge = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warning" }) => <span className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-medium ${tone === "good" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : tone === "warning" ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200" : "border-border bg-muted text-muted-foreground"}`}>{children}</span>;
const supportLabel = (support: string) => support === "SUPPORTED" ? "Corpus interne pertinent disponible" : support === "PARTIAL" ? "Couverture interne partielle" : support === "CONFLICTING" ? "Connaissances contradictoires" : "Candidat non soutenu par le corpus courant";
const reviewLabel: Record<CandidateReviewState, string> = { PENDING: "À revoir", ADOPTED: "Retenu par vous", REJECTED: "Rejeté par vous" };

export default function ScientificThinkingView({ session, onChange, onReturnToUnderstand, onExploreKnowledge, onEnterResearchDesign, onEditOriginalIdea }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const output = session.output;
  const applyAnswer = (questionId: string, value: string) => onChange(answerScientificThinkingQuestion(session, questionId, value));
  const keyboardActivate = (event: React.KeyboardEvent<HTMLButtonElement>, action: () => void) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    action();
  };
  const keyboardSurface = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target instanceof HTMLButtonElement) {
      event.preventDefault();
      event.target.click();
    } else if (event.target instanceof HTMLElement && event.target.tagName === "SUMMARY") {
      event.preventDefault();
      const details = event.target.closest("details");
      if (details) details.open = !details.open;
    }
  };

  if (output.refusal && output.refusal.code !== "NON_TESTABLE") return <div className="mt-8">
    <Box className="border-amber-500/50 bg-amber-500/10">
      <CircleAlert className="h-6 w-6 text-amber-600" />
      <Badge tone="warning">Arrêt explicite · {output.refusal.code}</Badge>
      <h2 className="mt-4 text-2xl font-bold">NOXIA n’exécute pas ce raisonnement</h2>
      <p className="mt-3">{output.refusal.reason}</p>
      <p className="mt-3 text-sm text-muted-foreground"><strong>Pour reprendre :</strong> {output.refusal.resumeCondition}</p>
    </Box>
    <button onClick={onReturnToUnderstand} className="mt-5 rounded-lg border px-4 py-3">Revenir à la compréhension</button>
  </div>;

  return <div className="mt-8 space-y-6" onKeyDown={keyboardSurface}>
    <div className="max-w-4xl rounded-2xl rounded-bl-sm bg-primary/10 p-6">
      <div className="flex items-start gap-3"><Lightbulb className="mt-1 h-5 w-5 shrink-0 text-primary" /><div>
        <div className="flex flex-wrap gap-2"><Badge tone={output.status === "CANDIDATES_PROPOSED" ? "good" : "warning"}>{output.status}</Badge><Badge>{output.semanticElements[0]?.type}</Badge></div>
        <h2 className="mt-3 text-2xl font-bold">NOXIA structure votre idée sans décider à votre place</h2>
        <p className="mt-3 text-sm text-muted-foreground">Tout contenu scientifique généré ci-dessous est une proposition de travail. Une absence de couverture reste visible et aucune méthode n’est sélectionnée.</p>
      </div></div>
    </div>

    {output.methodPreferences.length > 0 && <Box className="border-amber-500/40">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-amber-600" /><div>
        <h2 className="font-semibold">Préférence méthodologique conservée, non sélectionnée</h2>
        <p className="mt-2 text-sm">{output.methodPreferences.join(" · ")}</p>
        <p className="mt-2 text-sm text-muted-foreground">Cette mention ne remplace ni l’objet scientifique, ni la question, ni une future décision d’imagerie.</p>
      </div></div>
    </Box>}

    {output.knowledgeRequest && <Box className="border-amber-500/40 bg-amber-500/5">
      <div className="flex flex-wrap items-center gap-2"><Badge tone="warning">{output.knowledgeRequest.status}</Badge><h2 className="font-semibold">Connaissance insuffisante ou non disponible</h2></div>
      <p className="mt-2 text-sm">{output.knowledgeRequest.reason}</p>
      <p className="mt-2 text-xs text-muted-foreground">Le candidat reste visible avec le statut « non soutenu » ; aucun corpus voisin n’est substitué silencieusement.</p>
      {onExploreKnowledge && <button onClick={onExploreKnowledge} className="mt-4 inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm"><BookOpen className="h-4 w-4" /> Examiner les connaissances disponibles</button>}
    </Box>}

    <section aria-labelledby="st-questions-title">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">1 · Construire la question</p>
      <h2 id="st-questions-title" className="mt-2 text-2xl font-bold">Questions scientifiques candidates</h2>
      <div className="mt-4 grid gap-4">{output.questions.map((question) => <Box key={question.questionId} className={question.reviewState === "ADOPTED" ? "border-primary" : ""}>
        <div className="flex flex-wrap justify-between gap-2"><Badge tone={question.testability === "TESTABLE_CANDIDATE" ? "good" : "warning"}>{question.testability}</Badge><Badge tone={question.support === "SUPPORTED" ? "good" : "warning"}>{supportLabel(question.support)}</Badge></div>
        <p className="mt-4 text-lg font-semibold">{question.text}</p>
        <p className="mt-3 text-sm text-muted-foreground">{question.rationale}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2"><Badge tone={question.reviewState === "ADOPTED" ? "good" : "neutral"}>{reviewLabel[question.reviewState]}</Badge>
          <button disabled={question.testability !== "TESTABLE_CANDIDATE" || question.reviewState === "ADOPTED"} onClick={() => onChange(selectScientificQuestion(session, question.questionId))} onKeyDown={(event) => keyboardActivate(event, () => onChange(selectScientificQuestion(session, question.questionId)))} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Confirmer cette question</button>
          {question.kind === "METHODOLOGICAL_BRANCH" && <button onClick={() => onChange(decideScientificThinkingBranch(session, [question.questionId]))} className="rounded-lg border px-4 py-2 text-sm">Abandonner cette branche</button>}
        </div>
      </Box>)}</div>
    </section>

    {output.adaptiveQuestions.length > 0 && <section aria-labelledby="st-adaptive-title">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Clarification adaptative</p>
      <h2 id="st-adaptive-title" className="mt-2 text-2xl font-bold">Seulement les précisions qui changent le raisonnement</h2>
      <div className="mt-4 grid gap-4">{output.adaptiveQuestions.map((question, index) => <Box key={question.questionId}>
        <div className="flex flex-wrap justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Question {index + 1} sur environ {output.adaptiveQuestions.length}</p><Badge>{question.decisionBlock}</Badge></div>
        <h3 className="mt-3 text-lg font-semibold">{question.label}</h3>
        <div className="mt-4 grid gap-3 rounded-xl bg-muted/60 p-4 text-sm md:grid-cols-2"><p><strong>Pourquoi je vous la pose :</strong> {question.whyAsked}</p><p><strong>Ce qu’elle influence :</strong> {question.decisionImpact}</p></div>
        <div className="mt-4 flex flex-wrap gap-2">{question.suggestedAnswers.map((answer) => <button key={answer.value} aria-pressed={question.answeredValue === answer.value} onClick={() => applyAnswer(question.questionId, answer.value)} className={`rounded-full border px-3 py-2 text-sm ${question.answeredValue === answer.value ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{answer.label}</button>)}<button aria-pressed={question.answeredValue === "unknown"} onClick={() => applyAnswer(question.questionId, "unknown")} className="rounded-full border px-3 py-2 text-sm">Je ne sais pas</button></div>
        <label htmlFor={`st-free-${question.questionId}`} className="mt-5 block text-sm font-medium">Ou répondez avec vos propres mots</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`st-free-${question.questionId}`} value={drafts[question.questionId] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [question.questionId]: event.target.value.slice(0, 500) }))} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-ring" /><button disabled={!drafts[question.questionId]?.trim()} onClick={() => applyAnswer(question.questionId, drafts[question.questionId].trim())} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Enregistrer</button></div>
        {question.answeredValue && <p role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-sm"><Check className="mr-2 inline h-4 w-4" />Réponse conservée dans le contexte : {question.answeredValue}</p>}
      </Box>)}</div>
    </section>}

    {output.hypotheses.length > 0 && <section aria-labelledby="st-hypotheses-title">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">2 · Mettre l’idée à l’épreuve</p><h2 id="st-hypotheses-title" className="mt-2 text-2xl font-bold">Hypothèses candidates et concurrentes</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{output.hypotheses.map((hypothesis) => <Box key={hypothesis.hypothesisId}>
        <div className="flex flex-wrap gap-2"><Badge tone="warning">{hypothesis.kind}</Badge><Badge>{hypothesis.falsifiability}</Badge><Badge tone={hypothesis.support === "SUPPORTED" ? "good" : "warning"}>{supportLabel(hypothesis.support)}</Badge></div>
        <p className="mt-4 font-semibold">{hypothesis.text}</p><p className="mt-3 text-sm text-muted-foreground">Condition de réfutation : {hypothesis.observableCondition}</p>
        <div className="mt-4 flex flex-wrap gap-2"><button aria-pressed={hypothesis.reviewState === "ADOPTED"} onClick={() => onChange(reviewScientificHypothesis(session, hypothesis.hypothesisId, "ADOPTED"))} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Adopter comme hypothèse de travail</button><button aria-pressed={hypothesis.reviewState === "REJECTED"} onClick={() => onChange(reviewScientificHypothesis(session, hypothesis.hypothesisId, "REJECTED"))} className="rounded-lg border px-3 py-2 text-sm">Rejeter</button></div>
      </Box>)}</div>
    </section>}

    {output.objectives.length > 0 && <section aria-labelledby="st-objectives-title">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">3 · Hiérarchiser sans verrouiller</p><h2 id="st-objectives-title" className="mt-2 text-2xl font-bold">Objectifs proposés pour revue</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{output.objectives.map((objective) => <Box key={objective.objectiveId}>
        <div className="flex flex-wrap gap-2"><Badge>{objective.level}</Badge><Badge tone={objective.reviewState === "ADOPTED" ? "good" : "neutral"}>{reviewLabel[objective.reviewState]}</Badge></div><p className="mt-4">{objective.text}</p>
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onChange(reviewScientificObjective(session, objective.objectiveId, "ADOPTED"))} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Retenir dans la hiérarchie</button><button onClick={() => onChange(reviewScientificObjective(session, objective.objectiveId, "REJECTED"))} className="rounded-lg border px-3 py-2 text-sm">Écarter</button></div>
      </Box>)}</div>
    </section>}

    <details className="rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold">Voir les hypothèses implicites, mécanismes et biais</summary>
      <div className="mt-5 grid gap-4 lg:grid-cols-3"><div><h3 className="font-semibold">Hypothèses implicites</h3>{output.assumptions.length ? output.assumptions.map((item) => <div className="mt-3 text-sm" key={item.assumptionId}><p>{item.text}</p><p className="mt-1 text-muted-foreground">Mise à l’épreuve : {item.challenge}</p></div>) : <p className="mt-2 text-sm text-muted-foreground">Aucune supposition distincte repérée.</p>}</div><div><h3 className="font-semibold">Mécanismes</h3>{output.mechanisms.length ? output.mechanisms.map((item) => <p className="mt-3 text-sm" key={item.mechanismId}>• {item.text}</p>) : <p className="mt-2 text-sm text-muted-foreground">Aucun mécanisme ne peut encore être formulé sans ajouter de connaissance.</p>}</div><div><h3 className="font-semibold">Biais conceptuels</h3>{output.conceptualBiases.length ? output.conceptualBiases.map((item) => <p className="mt-3 text-sm" key={item}>• {item}</p>) : <p className="mt-2 text-sm text-muted-foreground">Aucun biais explicite détecté par les règles de cette V1.</p>}</div></div>
    </details>

    {output.unknowns.length > 0 && <Box>
      <h2 className="text-xl font-semibold">Inconnues conservées</h2><p className="mt-2 text-sm text-muted-foreground">Une inconnue acceptée reste une inconnue ; elle n’est ni inventée ni masquée dans le handoff.</p>
      <div className="mt-4 grid gap-2">{output.unknowns.slice(0, 12).map((unknown) => <label key={unknown} className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={session.acceptedUnknowns.includes(unknown)} onChange={(event) => onChange(setUnknownAccepted(session, unknown, event.target.checked))} className="mt-1" /><span>{unknown}<span className="mt-1 block text-xs text-muted-foreground">Accepter comme inconnue explicite pour la suite</span></span></label>)}</div>
    </Box>}

    <details className="rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold"><Network className="mr-2 inline h-5 w-5" />Scientific Reasoning Graph — projection de session</summary>
      <p className="mt-3 text-sm text-muted-foreground">Projection runtime uniquement ; aucune ontologie ni aucun Knowledge Graph normatif n’est créé.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><div><h3 className="font-semibold">Nœuds ({output.graph.nodes.length})</h3>{output.graph.nodes.map((node) => <p key={node.nodeId} className="mt-2 text-xs"><strong>{node.type}</strong> · {node.label} · {node.status}</p>)}</div><div><h3 className="font-semibold">Relations ({output.graph.edges.length})</h3>{output.graph.edges.map((edge) => <p key={edge.edgeId} className="mt-2 text-xs">{edge.from} — {edge.relation} → {edge.to}</p>)}</div></div>
    </details>

    <details className="rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold"><GitBranch className="mr-2 inline h-5 w-5" />Opérations et trace reproductible</summary>
      <div className="mt-4 grid gap-2">{output.operations.map((item) => <div key={item.operation} className="flex flex-col justify-between gap-1 rounded-lg border p-3 text-xs sm:flex-row"><span className="font-mono">{item.operation}</span><span>{item.status} · {item.reason}</span></div>)}</div>
      <h3 className="mt-6 font-semibold">Trace</h3>{output.trace.map((item) => <p className="mt-2 text-xs" key={item.sequence}>{item.sequence}. {item.operation} · {item.mode} · {item.decision}</p>)}
    </details>

    <details className="rounded-2xl border bg-card p-5">
      <summary className="cursor-pointer text-lg font-semibold">Décisions humaines et historique</summary>
      <h3 className="mt-5 font-semibold">Portes de décision</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{output.humanGates.map((gate) => <div key={gate.gateId} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong>{gate.label}</strong><Badge tone={gate.status === "APPROVED" ? "good" : gate.status === "PENDING" ? "warning" : "neutral"}>{gate.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{gate.reason}</p></div>)}</div>
      <h3 className="mt-6 font-semibold">Décisions enregistrées</h3>{session.decisionHistory.length ? session.decisionHistory.map((decision) => <p className="mt-2 text-xs" key={decision.decisionId}>{decision.decidedAt} · {decision.gate} · {decision.decision} · {decision.reason}</p>) : <p className="mt-2 text-sm text-muted-foreground">Aucune décision structurante n’a encore été enregistrée.</p>}
    </details>

    <Box className={output.handoff.status === "NOT_READY" ? "border-amber-500/40" : "border-primary/50"}>
      <div className="flex flex-wrap items-center gap-2"><Badge tone={output.handoff.status === "NOT_READY" ? "warning" : "good"}>{output.handoff.status}</Badge><h2 className="text-xl font-semibold">Passage vers Research Design</h2></div>
      <p className="mt-3 text-sm">Ce passage ne contient ni protocole, ni sélection de modalité, ni acquisition, ni plan statistique.</p>
      {output.handoff.blockedBy.length > 0 && <div className="mt-4 rounded-lg bg-muted p-4"><p className="font-semibold">Encore requis :</p>{output.handoff.blockedBy.map((item) => <p className="mt-1 text-sm" key={item}>• {item}</p>)}</div>}
      {output.handoff.status === "READY_FOR_HUMAN_AUTHORIZATION" && <button onClick={() => onChange(authorizeResearchDesignHandoff(session))} className="mt-5 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Autoriser le handoff vers la conception d’étude</button>}
      {output.handoff.status === "AUTHORIZED" && <button onClick={onEnterResearchDesign} className="mt-5 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrer dans la conception d’étude</button>}
    </Box>

    <div className="flex flex-wrap gap-3">{onEditOriginalIdea && <button onClick={onEditOriginalIdea} className="rounded-lg border px-4 py-3">Modifier l’idée de départ</button>}<button onClick={onReturnToUnderstand} className="rounded-lg border px-4 py-3">Revenir à la compréhension</button>{onExploreKnowledge && <button onClick={onExploreKnowledge} className="inline-flex items-center gap-2 rounded-lg border px-4 py-3"><HelpCircle className="h-4 w-4" /> Explorer l’objet scientifique</button>}</div>
  </div>;
}
