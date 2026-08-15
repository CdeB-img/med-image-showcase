import { useMemo, useState } from "react";
import { answerImagingQuestion, decideImagingGate, reviewImagingCandidate } from "./session";
import type { ImagingDesignSession } from "./types";

type Props = {
  session: ImagingDesignSession;
  onChange: (session: ImagingDesignSession) => void;
  onProjectConstructionHandoff: () => void;
  onShowExpert: () => void;
};

type PendingCandidate = {
  category: "phenomenon" | "biomarker" | "modality" | "acquisition" | "analysis";
  candidateId: string;
  label: string;
  kind: string;
};

const State = ({ children, adopted = false }: { children: React.ReactNode; adopted?: boolean }) => <span className={`rounded-full border px-2 py-1 text-xs ${adopted ? "border-emerald-500/40 bg-emerald-500/10" : "bg-muted"}`}>{children}</span>;

export default function ImagingStudyDesignerStandardView({ session, onChange, onProjectConstructionHandoff, onShowExpert }: Props) {
  const [draft, setDraft] = useState("");
  const [actor, setActor] = useState("");
  const [mandate, setMandate] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const result = session.result;
  const question = result.adaptiveQuestions.find((item) => !item.answeredValue);
  const currentDecision = result.decisionsRequired.find((item) => item.status === "PENDING");
  const authorityReady = Boolean(actor.trim() && mandate.trim());
  const pendingCandidate = useMemo<PendingCandidate | null>(() => {
    const phenomenon = result.phenomena.find((item) => item.reviewState === "PENDING");
    if (phenomenon) return { category: "phenomenon", candidateId: phenomenon.phenomenonId, label: phenomenon.label, kind: "phénomène à examiner" };
    const biomarker = result.biomarkerCandidates.find((item) => item.reviewState === "PENDING");
    if (biomarker) return { category: "biomarker", candidateId: biomarker.biomarkerId, label: biomarker.label, kind: "mesure candidate" };
    const modality = result.modalityCandidates.find((item) => item.reviewState === "PENDING");
    if (modality) return { category: "modality", candidateId: modality.modalityId, label: modality.label, kind: "modalité candidate" };
    const acquisition = result.acquisitionStrategies.find((item) => item.reviewState === "PENDING");
    if (acquisition) return { category: "acquisition", candidateId: acquisition.acquisitionId, label: acquisition.level2.acquisitionFamily, kind: "stratégie d’acquisition candidate" };
    const analysis = result.imageAnalysisStrategy.find((item) => item.reviewState === "PENDING");
    if (analysis) return { category: "analysis", candidateId: analysis.analysisId, label: analysis.readingModel, kind: "stratégie d’analyse d’image candidate" };
    return null;
  }, [result.acquisitionStrategies, result.biomarkerCandidates, result.imageAnalysisStrategy, result.modalityCandidates, result.phenomena]);

  const apply = (next: ImagingDesignSession, message: string) => {
    onChange(next);
    setFeedback(message);
    setDraft("");
  };

  return <section className="mt-8" data-testid="imaging-study-designer-standard">
    <div className="mb-4 flex justify-end"><button type="button" onClick={onShowExpert} className="min-h-10 rounded-lg border px-3 py-2 text-sm">Mode Expert</button></div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(18rem,.78fr)_minmax(0,1.4fr)]">
      <aside aria-label="Research Project en construction" className="min-w-0 self-start rounded-2xl border bg-muted/20 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Research Project</p>
        <h2 className="mt-2 text-xl font-bold">Compréhension actuelle</h2>
        <p className="mt-2 text-sm">{result.scientificQuestion.text}</p>
        <p className="mt-2 text-xs text-muted-foreground">Les éléments Imaging restent des propositions tant qu’une décision humaine ne les a pas retenus.</p>
        <div className="mt-5 space-y-3">
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Question</strong><State adopted>Retenue</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Population</strong><State>{session.input.populationContext.length ? "Compris" : "À préciser"}</State></div><p className="mt-1 text-xs text-muted-foreground">{session.input.populationContext.join(" · ") || "Aucune population confirmée"}</p></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Imagerie</strong><State adopted={result.modalityCandidates.some((item) => item.reviewState === "ADOPTED")}>{result.modalityCandidates.filter((item) => item.reviewState === "ADOPTED").length} modalité(s) retenue(s)</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Variables / mesures</strong><State adopted={result.biomarkerCandidates.some((item) => item.reviewState === "ADOPTED")}>{result.biomarkerCandidates.filter((item) => item.reviewState === "ADOPTED").length} mesure(s) retenue(s)</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Analyse</strong><State adopted={result.imageAnalysisStrategy.some((item) => item.reviewState === "ADOPTED")}>{result.imageAnalysisStrategy.filter((item) => item.reviewState === "ADOPTED").length} élément(s) retenu(s)</State></div></div>
          <div className="rounded-xl border bg-background p-3"><div className="flex justify-between gap-2"><strong className="text-sm">Documents</strong><State>Pas encore générables</State></div><p className="mt-1 text-xs text-muted-foreground">La stratégie Imaging doit d’abord rejoindre un Research Project gouverné.</p></div>
        </div>
      </aside>

      <main className="min-w-0" aria-labelledby="img-standard-conversation-title">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">NOXIA</p>
        <h2 id="img-standard-conversation-title" className="mt-2 text-2xl font-bold">Conversation scientifique</h2>
        <p className="mt-2 text-sm text-muted-foreground">La stratégie Imaging progresse sans supposer de modalité optimale ni produire de paramètres constructeur.</p>
        {feedback && <div role="status" className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">{feedback}</div>}

        {question && <article className="mt-5 rounded-2xl border border-primary/40 bg-card p-5">
          <h3 className="text-xl font-semibold">{question.label}</h3>
          <p className="mt-2 text-sm"><strong>Pourquoi maintenant :</strong> {question.whyAsked}</p>
          <p className="mt-2 text-sm text-muted-foreground">Cette précision peut changer : {question.decisionImpact}</p>
          <div className="mt-4 flex flex-wrap gap-2">{question.suggestedAnswers.map((answer) => <button key={answer.value} type="button" onClick={() => apply(answerImagingQuestion(session, question.questionId, answer.value), `Réponse enregistrée : ${answer.label}. La stratégie a été reconstruite par son moteur propriétaire.`)} className="min-h-11 rounded-full border px-3 py-2 text-sm">{answer.label}</button>)}</div>
          <label htmlFor={`img-standard-${question.questionId}`} className="mt-5 block text-sm font-medium">Votre réponse</label>
          <textarea id={`img-standard-${question.questionId}`} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 500))} className="mt-2 min-h-28 w-full rounded-xl border bg-background p-3" />
          <button type="button" disabled={!draft.trim()} onClick={() => apply(answerImagingQuestion(session, question.questionId, `free:${draft.trim()}`), "Votre réponse a été conservée dans le contexte Imaging.")} className="mt-3 min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Envoyer ma réponse</button>
          {!draft.trim() && <p className="mt-2 text-xs text-muted-foreground">Écrivez une réponse avant de l’envoyer, ou utilisez un raccourci.</p>}
        </article>}

        {!question && pendingCandidate && <article className="mt-5 rounded-2xl border border-primary/40 bg-card p-5">
          <p className="text-sm text-muted-foreground">NOXIA propose un {pendingCandidate.kind}. Cette proposition n’est pas encore retenue.</p>
          <h3 className="mt-2 text-xl font-semibold">{pendingCandidate.label}</h3>
          <div className="mt-5 rounded-xl bg-muted/50 p-4"><p className="font-medium">Identification requise pour cette décision</p><p className="mt-1 text-xs text-muted-foreground">Retenir ou écarter cet élément modifie la stratégie Imaging gouvernée.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label htmlFor="img-standard-actor" className="text-sm">Votre nom ou rôle</label><input id="img-standard-actor" value={actor} onChange={(event) => setActor(event.target.value.slice(0, 100))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div><div><label htmlFor="img-standard-mandate" className="text-sm">Votre habilitation pour ce choix</label><input id="img-standard-mandate" value={mandate} onChange={(event) => setMandate(event.target.value.slice(0, 160))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div></div></div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!authorityReady} onClick={() => apply(reviewImagingCandidate(session, pendingCandidate.category, pendingCandidate.candidateId, "ADOPTED", actor, mandate), "Cette proposition a été retenue ; la prochaine action est maintenant visible.")} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Retenir cette proposition</button><button type="button" disabled={!authorityReady} onClick={() => apply(reviewImagingCandidate(session, pendingCandidate.category, pendingCandidate.candidateId, "REJECTED", actor, mandate), "Cette proposition a été écartée et retirée du point d’attention.")} className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50">Cette proposition ne correspond pas à mon projet</button></div>
          {!authorityReady && <p className="mt-2 text-xs text-muted-foreground">Renseignez les deux éléments d’identification pour enregistrer cette décision.</p>}
        </article>}

        {!question && !pendingCandidate && currentDecision && <article className="mt-5 rounded-2xl border border-primary/40 bg-card p-5"><h3 className="text-xl font-semibold">{currentDecision.label}</h3><p className="mt-2 text-sm text-muted-foreground">{currentDecision.reason}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label htmlFor="img-gate-actor" className="text-sm">Votre nom ou rôle</label><input id="img-gate-actor" value={actor} onChange={(event) => setActor(event.target.value.slice(0, 100))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div><div><label htmlFor="img-gate-mandate" className="text-sm">Votre habilitation</label><input id="img-gate-mandate" value={mandate} onChange={(event) => setMandate(event.target.value.slice(0, 160))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2" /></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!authorityReady || currentDecision.gateId === "IMG-GATE-HANDOFF-FREEZE" && result.projectConstructionHandoff.status !== "READY_FOR_HUMAN_FREEZE"} onClick={() => apply(decideImagingGate(session, currentDecision.gateId, "APPROVED", "Décision explicitement approuvée dans la conversation Imaging.", actor, mandate), "Décision enregistrée ; la stratégie et sa prochaine action ont été mises à jour.")} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">Confirmer cette décision</button><button type="button" disabled={!authorityReady} onClick={() => apply(decideImagingGate(session, currentDecision.gateId, "REJECTED", "Décision explicitement refusée dans la conversation Imaging.", actor, mandate), "Décision refusée et conservée dans la trace.")} className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50">Ne pas retenir</button></div>{!authorityReady && <p className="mt-2 text-xs text-muted-foreground">Votre identité et votre habilitation sont nécessaires pour cette décision.</p>}{currentDecision.gateId === "IMG-GATE-HANDOFF-FREEZE" && result.projectConstructionHandoff.status !== "READY_FOR_HUMAN_FREEZE" && <p className="mt-2 text-xs text-muted-foreground">Cette autorisation deviendra disponible lorsque les revues Imaging nécessaires seront terminées.</p>}</article>}

        {!question && !pendingCandidate && !currentDecision && result.projectConstructionHandoff.status === "FROZEN_BY_HUMAN" && <article className="mt-5 rounded-2xl border border-emerald-500/40 bg-card p-5"><h3 className="text-xl font-semibold">La stratégie Imaging peut rejoindre le Research Project</h3><p className="mt-2 text-sm text-muted-foreground">Le gel humain est conservé avec ses inconnues et ses limites ; aucun protocole exécutable n’est supposé.</p><button type="button" onClick={onProjectConstructionHandoff} className="mt-4 min-h-12 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Continuer vers le Research Project</button></article>}
        {!question && !pendingCandidate && !currentDecision && result.projectConstructionHandoff.status === "NOT_READY" && <article className="mt-5 rounded-2xl border border-amber-500/40 bg-card p-5" role="status"><h3 className="text-xl font-semibold">La stratégie Imaging reste en construction</h3><p className="mt-2 text-sm text-muted-foreground">Aucun passage vers le Research Project n’est simulé tant que les conditions réelles ne sont pas satisfaites.</p>{result.projectConstructionHandoff.blockedBy.map((item) => <p key={item} className="mt-2 text-sm">Il reste à traiter : {item}</p>)}</article>}
      </main>
    </div>
  </section>;
}
