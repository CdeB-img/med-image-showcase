import { useMemo, useState } from "react";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type { ValidationGateSignal } from "./contracts";
import { buildQueryNavigationProductProjection } from "./product";
import { appendNavigationLifecycleEvent, createQueryNavigationMemory, rememberSelectedNavigationAction } from "./lifecycle";

const humanize = (value: string) => value.replace(/_/g, " ").toLocaleLowerCase("fr-FR");

export default function QueryNavigationPanel({ project, validationGates }: { project: Readonly<ResearchProjectDesignResult>; validationGates?: ValidationGateSignal[] }) {
  const [expert, setExpert] = useState(false);
  const [chosenCandidateRef, setChosenCandidateRef] = useState<string | null>(null);
  const [memory, setMemory] = useState(() => createQueryNavigationMemory(project.resultId, project.candidateVersion.versionId));
  const [interactionStatus, setInteractionStatus] = useState<string | null>(null);
  const projection = useMemo(() => buildQueryNavigationProductProjection(project, memory, chosenCandidateRef, validationGates), [chosenCandidateRef, memory, project, validationGates]);

  const choose = (candidateRef: string) => {
    const next = buildQueryNavigationProductProjection(project, memory, candidateRef, validationGates);
    setChosenCandidateRef(candidateRef);
    if (next.selectedAction) {
      let updated = rememberSelectedNavigationAction(memory, next.selectedAction);
      updated = appendNavigationLifecycleEvent(updated, {
        eventType: "ACTION_SELECTED",
        actionRef: next.selectedAction.selectedActionId,
        presentationRef: next.questionPresentation?.presentationId ?? null,
        responseRef: null,
        projectRef: next.projectRef,
        projectVersion: next.projectVersion,
        sourceStateDigest: next.sourceStateDigest,
        reason: "HUMAN_NAVIGATION_PREFERENCE_ONLY",
        evidenceRefs: [candidateRef],
        recordedAt: new Date().toISOString(),
      });
      setMemory(updated);
    }
    setInteractionStatus("Action de navigation choisie. Aucune décision scientifique ni écriture Project n’a été créée.");
  };

  const lifecycleOnly = (eventType: "ACTION_DEFERRED" | "ACTION_DECLINED", status: string) => {
    if (!projection.selectedAction) return;
    setMemory(appendNavigationLifecycleEvent(memory, {
      eventType,
      actionRef: projection.selectedAction.selectedActionId,
      presentationRef: projection.questionPresentation?.presentationId ?? null,
      responseRef: null,
      projectRef: projection.projectRef,
      projectVersion: projection.projectVersion,
      sourceStateDigest: projection.sourceStateDigest,
      reason: status,
      evidenceRefs: [],
      recordedAt: new Date().toISOString(),
    }));
    setInteractionStatus(status);
  };

  return <section className="mt-8 rounded-2xl border border-primary/40 bg-card p-5 shadow-sm" data-testid="query-navigation-panel" aria-labelledby="query-navigation-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">QRY-001 · navigation scientifique</p><h3 id="query-navigation-title" className="mt-2 text-2xl font-bold">Prochaine action</h3></div><div className="flex gap-2"><span className="rounded-full border bg-muted px-2.5 py-1 text-xs">{humanize(projection.status)}</span><button type="button" aria-pressed={expert} onClick={() => setExpert((value) => !value)} className="rounded-full border px-3 py-1 text-xs">{expert ? "Mode standard" : "Mode expert"}</button></div></div>
    <p className="mt-2 text-xs text-muted-foreground">Statut du Project : {humanize(project.candidateVersion.status)}</p>
    {projection.status === "MULTIPLE_OPTIONS" ? <div className="mt-4"><p className="text-sm"><strong>Plusieurs actions restent possibles.</strong> Aucun premier choix arbitraire n’est appliqué.</p><div className="mt-3 grid gap-2">{projection.alternatives.map((candidate) => <button key={candidate.candidateId} type="button" onClick={() => choose(candidate.candidateId)} className="rounded-lg border p-3 text-left"><span className="font-medium">{candidate.actionLabel}</span><span className="mt-1 block text-sm text-muted-foreground"><strong>Pourquoi :</strong> {candidate.explanation}</span><span className="mt-1 block text-sm text-muted-foreground"><strong>Pourquoi maintenant :</strong> {candidate.explanation}</span><span className="mt-1 block text-sm text-muted-foreground"><strong>Influence :</strong> {[...candidate.affectedDecisionRefs, ...candidate.affectedBranchRefs].join(", ") || "navigation courante"}</span><span className="mt-1 block text-sm text-muted-foreground"><strong>Si différée :</strong> {candidate.deferConsequence ?? "conséquence non applicable"}</span></button>)}</div><button type="button" onClick={() => setInteractionStatus("Aucune préférence fournie ; toutes les actions restent ouvertes et aucune valeur par défaut n’est appliquée.")} className="mt-3 rounded-full border px-3 py-2 text-sm">Je ne sais pas</button></div> : <div className="mt-4"><p className="font-medium">{projection.summary.actionLabel ?? humanize(projection.status)}</p><p className="mt-2 text-sm"><strong>Pourquoi :</strong> {projection.summary.reason}</p><p className="mt-2 text-sm"><strong>Pourquoi maintenant :</strong> {projection.summary.whyNow}</p>{projection.summary.unlockConsequences.length > 0 && <p className="mt-2 text-sm"><strong>Débloque :</strong> {projection.summary.unlockConsequences.join(" · ")}</p>}{projection.summary.deferAllowed && <p className="mt-2 text-sm"><strong>Si différée :</strong> {projection.summary.deferConsequence ?? "le besoin reste ouvert"}</p>}{projection.summary.systemPrerequisite && <p role="status" className="mt-3 rounded-lg bg-amber-500/10 p-3 text-sm">Gate VAL : NOT_EVALUABLE. Prérequis système/validation ; ceci n’est pas une question scientifique à résoudre par l’utilisateur.</p>}</div>}
    {projection.questionPresentation && <div className="mt-4 rounded-xl bg-muted/60 p-4"><p className="font-medium">{projection.questionPresentation.intent}</p><p className="mt-2 text-sm"><strong>Contrat de réponse :</strong> {humanize(projection.questionPresentation.expectedAnswerKind)}</p><p className="mt-2 text-sm"><strong>Influence :</strong> {[...projection.questionPresentation.affectedDecisionRefs, ...projection.questionPresentation.affectedBranchRefs].join(", ") || "navigation courante"}</p><div className="mt-3 flex flex-wrap gap-2">{projection.questionPresentation.knownOptions.map((option) => <button key={option} type="button" onClick={() => setInteractionStatus(`Cible Human Decision Envelope préparée pour ${option}. Aucune décision créée.`)} className="rounded-full border px-3 py-2 text-sm">{humanize(option)}</button>)}{projection.questionPresentation.expectedAnswerKind === "FREE_TEXT" && <button type="button" onClick={() => setInteractionStatus("Handoff Scientific Interpretation préparé. La réponse brute n’est pas écrite dans Project.")} className="rounded-full border px-3 py-2 text-sm">Préparer une réponse libre</button>}{projection.questionPresentation.expectedAnswerKind === "HUMAN_REVIEW_DECISION" && <button type="button" onClick={() => setInteractionStatus("Cible Human Decision Envelope préparée. Aucun arbitrage ni décision n’a été créé par QRY.")} className="rounded-full border px-3 py-2 text-sm">Préparer la revue humaine</button>}<button type="button" onClick={() => lifecycleOnly("ACTION_DEFERRED", "Action différée ; le besoin reste ouvert jusqu’à un trigger explicite.")} className="rounded-full border px-3 py-2 text-sm">Plus tard</button><button type="button" onClick={() => lifecycleOnly("ACTION_DECLINED", "Action déclinée ; aucune valeur par défaut n’a été appliquée.")} className="rounded-full border px-3 py-2 text-sm">Je ne sais pas</button></div></div>}
    {interactionStatus && <p role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-sm">{interactionStatus}</p>}
    {expert && <details open className="mt-5 text-sm"><summary className="cursor-pointer font-medium">Preuves et trace QRY</summary><dl className="mt-3 grid gap-2 break-all"><div><dt className="font-medium">Project</dt><dd>{projection.projectRef} · {projection.projectVersion}</dd></div><div><dt className="font-medium">Trace</dt><dd>{projection.explanation.traceRef} · {projection.explanation.traceDigest}</dd></div><div><dt className="font-medium">Règles</dt><dd>{projection.explanation.pd009RuleRefs.join(", ") || "non applicable"}</dd></div><div><dt className="font-medium">Valeur d’information</dt><dd>{projection.explanation.informationValue ? JSON.stringify(projection.explanation.informationValue) : "non applicable"}</dd></div><div><dt className="font-medium">Alternatives</dt><dd>{projection.alternatives.map((item) => item.candidateId).join(", ") || "aucune"}</dd></div><div><dt className="font-medium">Impacts</dt><dd>{projection.explanation.impacts.join(", ") || "aucun"}</dd></div><div><dt className="font-medium">VAL</dt><dd>{projection.explanation.validationRefs.join(", ") || "aucun run"}</dd></div><div><dt className="font-medium">Limites</dt><dd>{projection.explanation.limitations.join(" · ")}</dd></div></dl></details>}
  </section>;
}
