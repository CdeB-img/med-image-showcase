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
import type { ScientificThinkingSession } from "./types";

type Props = {
  session: ScientificThinkingSession;
  onChange: (session: ScientificThinkingSession) => void;
  onEnterResearchDesign: () => void;
  onShowExpert: () => void;
};

const State = ({ children, adopted = false }: { children: React.ReactNode; adopted?: boolean }) => <span className={`rounded-full border px-2 py-1 text-xs ${adopted ? "border-emerald-500/40 bg-emerald-500/10" : "bg-muted"}`}>{children}</span>;

export default function ScientificThinkingStandardView({ session, onChange, onEnterResearchDesign, onShowExpert }: Props) {
  const [draft, setDraft] = useState("");
  const [actor, setActor] = useState("");
  const [mandate, setMandate] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const output = session.output;
  const authorityReady = Boolean(actor.trim() && mandate.trim());
  const adaptive = output.adaptiveQuestions.find((item) => !item.answeredValue);
  const question = output.questions.find((item) => item.reviewState === "PENDING" && item.testability === "TESTABLE_CANDIDATE");
  const hypothesis = output.hypotheses.find((item) => item.reviewState === "PENDING");
  const objective = output.objectives.find((item) => item.reviewState === "PENDING");
  const unknown = output.unknowns.find((item) => !session.acceptedUnknowns.includes(item));
  const requiresGovernance = !adaptive && Boolean(question || hypothesis || objective || output.handoff.status === "READY_FOR_HUMAN_AUTHORIZATION");

  const apply = (next: ScientificThinkingSession, message: string) => {
    onChange(next);
    setFeedback(message);
    setDraft("");
  };

  return <section className="mt-8" data-testid="scientific-thinking-standard">
    <div className="mb-4 flex justify-end"><button type="button" onClick={onShowExpert} className="min-h-10 rounded-lg border px-3 py-2 text-sm">Mode Expert</button></div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(18rem,.78fr)_minmax(0,1.4fr)]">
      <aside aria-label="Research Project en construction" className="min-w-0 self-start rounded-2xl border bg-muted/20 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Research Project</p>
        <h2 className="mt-2 text-xl font-bold">Compréhension actuelle</h2>
        <p className="mt-2 text-sm">{output.selectedQuestionCandidate?.text ?? output.questions[0]?.text ?? output.understoodProblem}</p>
        <p className="mt-2 text-xs text-muted-foreground">Les propositions restent distinctes des éléments retenus par une décision humaine.</p>
        <div className="mt-5 space-y-3">
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Question</strong><State adopted={Boolean(output.selectedQuestionCandidate)}>{output.selectedQuestionCandidate ? "Retenue" : "À confirmer"}</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Hypothèses</strong><State adopted={output.hypotheses.some((item) => item.reviewState === "ADOPTED")}>{output.hypotheses.filter((item) => item.reviewState === "ADOPTED").length} retenue(s)</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Population</strong><State>{session.input.population.length ? "Compris" : "À préciser"}</State></div><p className="mt-1 text-xs text-muted-foreground">{session.input.population.join(" · ") || "Aucune population confirmée"}</p></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Design</strong><State>À construire</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Imagerie</strong><State>{session.input.methodsMentioned.length ? "Mentionnée" : "À préciser"}</State></div><p className="mt-1 text-xs text-muted-foreground">{session.input.methodsMentioned.join(" · ") || "Aucune modalité retenue"}</p></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Documents</strong><State>Pas encore générables</State></div><p className="mt-1 text-xs text-muted-foreground">Le Research Project propriétaire doit d’abord être construit.</p></div>
        </div>
      </aside>

      <main className="min-w-0" aria-labelledby="st-standard-conversation-title">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">NOXIA</p>
        <h2 id="st-standard-conversation-title" className="mt-2 text-2xl font-bold">Conversation scientifique</h2>
        <p className="mt-2 text-sm text-muted-foreground">Une seule étape utile est mise au premier plan. Les raccourcis sont facultatifs lorsqu’une réponse libre est possible.</p>
        {feedback && <div role="status" className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{feedback}</div>}

        {adaptive && <article className="mt-5 rounded-2xl border border-primary/40 bg-card p-5">
          <h3 className="text-xl font-semibold">{adaptive.label}</h3>
          <p className="mt-2 text-sm"><strong>Pourquoi maintenant :</strong> {adaptive.whyAsked}</p>
          <p className="mt-2 text-sm text-muted-foreground">Cette précision peut changer : {adaptive.decisionImpact}</p>
          <div className="mt-4 flex flex-wrap gap-2">{adaptive.suggestedAnswers.map((answer) => <button key={answer.value} type="button" onClick={() => apply(answerScientificThinkingQuestion(session, adaptive.questionId, answer.value), `Réponse enregistrée : ${answer.label}. La prochaine étape a été recalculée par le moteur propriétaire.`)} className="min-h-11 rounded-full border px-3 py-2 text-sm">{answer.label}</button>)}<button type="button" onClick={() => apply(answerScientificThinkingQuestion(session, adaptive.questionId, "unknown"), "Cette information reste explicitement inconnue ; aucune valeur n’a été inventée.")} className="min-h-11 rounded-full border px-3 py-2 text-sm">Je ne sais pas</button></div>
          <label htmlFor={`st-standard-${adaptive.questionId}`} className="mt-5 block text-sm font-medium">Votre réponse</label>
          <textarea id={`st-standard-${adaptive.questionId}`} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 500))} className="mt-2 min-h-28 w-full rounded-xl border bg-background p-3" />
          <button type="button" disabled={!draft.trim()} onClick={() => apply(answerScientificThinkingQuestion(session, adaptive.questionId, draft.trim()), "Votre réponse a été conservée dans le contexte scientifique.")} className="mt-3 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Envoyer ma réponse</button>
          {!draft.trim() && <p className="mt-2 text-xs text-muted-foreground">Écrivez une réponse avant de l’envoyer, ou utilisez un raccourci.</p>}
        </article>}

        {!adaptive && (question || hypothesis || objective) && <article className="mt-5 rounded-2xl border border-primary/40 bg-card p-5">
          <p className="text-sm text-muted-foreground">NOXIA vous demande une décision précise avant de poursuivre.</p>
          <h3 className="mt-2 text-xl font-semibold">{question ? "Cette formulation correspond-elle à votre projet ?" : hypothesis ? "Souhaitez-vous retenir cette hypothèse de travail ?" : "Souhaitez-vous retenir cet objectif ?"}</h3>
          <p className="mt-3">{question?.text ?? hypothesis?.text ?? objective?.text}</p>
          <div className="mt-5 rounded-xl bg-muted/50 p-4">
            <p className="font-medium">Identification requise pour cette décision</p>
            <p className="mt-1 text-xs text-muted-foreground">Cette décision modifie un objet scientifique gouverné ; son auteur et son habilitation doivent être tracés.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label htmlFor="st-standard-actor" className="text-sm">Votre nom ou rôle</label><input id="st-standard-actor" value={actor} onChange={(event) => setActor(event.target.value.slice(0, 100))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div><div><label htmlFor="st-standard-mandate" className="text-sm">Votre habilitation pour ce choix</label><input id="st-standard-mandate" value={mandate} onChange={(event) => setMandate(event.target.value.slice(0, 160))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div></div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {question && <button type="button" disabled={!authorityReady} onClick={() => apply(selectScientificQuestion(session, question.questionId, actor, mandate), "La question a été retenue et la prochaine étape est maintenant visible.")} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Oui, retenir cette question</button>}
            {question?.kind === "METHODOLOGICAL_BRANCH" && <button type="button" disabled={!authorityReady} onClick={() => apply(decideScientificThinkingBranch(session, [question.questionId], actor, mandate), "Cette piste a été écartée et retirée du point d’attention.")} className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50">Cette piste ne correspond pas à mon projet</button>}
            {hypothesis && <><button type="button" disabled={!authorityReady} onClick={() => apply(reviewScientificHypothesis(session, hypothesis.hypothesisId, "ADOPTED", actor, mandate), "Hypothèse retenue comme hypothèse de travail.")} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Retenir cette hypothèse</button><button type="button" disabled={!authorityReady} onClick={() => apply(reviewScientificHypothesis(session, hypothesis.hypothesisId, "REJECTED", actor, mandate), "Cette hypothèse a été écartée ; elle reste tracée sans devenir une vérité du projet.")} className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50">Cette hypothèse ne correspond pas à mon projet</button></>}
            {objective && <><button type="button" disabled={!authorityReady} onClick={() => apply(reviewScientificObjective(session, objective.objectiveId, "ADOPTED", actor, mandate), "Objectif retenu dans la hiérarchie de travail.")} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Retenir cet objectif</button><button type="button" disabled={!authorityReady} onClick={() => apply(reviewScientificObjective(session, objective.objectiveId, "REJECTED", actor, mandate), "Cet objectif a été écarté du point d’attention.")} className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50">Ne pas retenir cet objectif</button></>}
          </div>
          {!authorityReady && <p className="mt-2 text-xs text-muted-foreground">Renseignez les deux éléments d’identification pour enregistrer cette décision.</p>}
        </article>}

        {!adaptive && !question && !hypothesis && !objective && unknown && <article className="mt-5 rounded-2xl border bg-card p-5"><h3 className="text-xl font-semibold">Une information reste inconnue</h3><p className="mt-3">{unknown}</p><p className="mt-2 text-sm text-muted-foreground">Vous pouvez continuer en conservant explicitement cette inconnue ; elle ne sera pas remplacée par une valeur supposée.</p><button type="button" onClick={() => apply(setUnknownAccepted(session, unknown, true), "Inconnue conservée explicitement pour la suite.")} className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">Continuer avec cette inconnue</button></article>}

        {!adaptive && !question && !hypothesis && !objective && !unknown && output.handoff.status === "READY_FOR_HUMAN_AUTHORIZATION" && <article className="mt-5 rounded-2xl border border-primary/40 bg-card p-5"><h3 className="text-xl font-semibold">La réflexion peut passer à la conception de l’étude</h3><p className="mt-2 text-sm text-muted-foreground">Cette autorisation conserve les limites actuelles et ne choisit ni protocole, ni modalité, ni analyse statistique.</p>{requiresGovernance && <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label htmlFor="st-handoff-actor" className="text-sm">Votre nom ou rôle</label><input id="st-handoff-actor" value={actor} onChange={(event) => setActor(event.target.value.slice(0, 100))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div><div><label htmlFor="st-handoff-mandate" className="text-sm">Votre habilitation</label><input id="st-handoff-mandate" value={mandate} onChange={(event) => setMandate(event.target.value.slice(0, 160))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div></div>}<button type="button" disabled={!authorityReady} onClick={() => apply(authorizeResearchDesignHandoff(session, actor, mandate), "Passage vers la conception autorisé. Vous pouvez maintenant continuer.")} className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Autoriser le passage à la conception</button>{!authorityReady && <p className="mt-2 text-xs text-muted-foreground">Votre identité et votre habilitation sont requises pour cette autorisation.</p>}</article>}
        {output.handoff.status === "AUTHORIZED" && <button type="button" onClick={onEnterResearchDesign} className="mt-5 min-h-12 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Continuer vers la conception de l’étude</button>}
        {!adaptive && !question && !hypothesis && !objective && !unknown && output.handoff.status === "NOT_READY" && <article className="mt-5 rounded-2xl border border-amber-500/40 bg-card p-5" role="status"><h3 className="text-xl font-semibold">Le passage à la conception n’est pas encore disponible</h3><p className="mt-2 text-sm text-muted-foreground">NOXIA conserve le travail actuel sans inventer l’élément manquant.</p>{output.handoff.blockedBy.map((item) => <p key={item} className="mt-2 text-sm">Il reste à traiter : {item}</p>)}</article>}
      </main>
    </div>
  </section>;
}
