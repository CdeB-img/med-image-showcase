import { useState } from "react";
import { contributionDecisionScopeGroups } from "@/features/research-project-construction";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { ResearchProjectContributionCandidate, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { WorkingDraftMetadata } from "./continuous-project-build";
import ContributionReview, { reviewDecisionRefsInDisplayOrder } from "./ContributionReview";

type Props = Readonly<{
  contribution: ScientificInterpretationContributionEnvelope;
  candidate: ResearchProjectContributionCandidate;
  currentProject: ResearchProjectOwnerProjection | null;
  workingDraft: WorkingDraftMetadata;
  disabled: boolean;
  projectionMode?: "STANDARD" | "EXPERT";
  error?: string | null;
  capturedAt?: string;
  newerTurns?: readonly ScientificInterpretationTurn[];
  onAbandon?: () => void;
  onReprepare?: () => void;
  onConfirm: (refs?: readonly string[]) => void;
}>;

const visibleDecisionCount = (candidate: ResearchProjectContributionCandidate) => candidate.humanReviewProjection.sections
  .flatMap((section) => section.items)
  .filter((item) => item.changeKind !== "RELATION" && item.objectType !== "UNCERTAINTY")
  .length;

export default function ProjectFinalizationCard({
  contribution,
  candidate,
  currentProject,
  workingDraft,
  disabled,
  error,
  onConfirm, capturedAt, newerTurns = [], onAbandon, onReprepare, projectionMode = "EXPERT",
}: Props) {
  const [selectedGroups, setSelectedGroups] = useState<readonly string[]>([]);
  const groups = contributionDecisionScopeGroups(candidate, currentProject);
  const visibleRefs = reviewDecisionRefsInDisplayOrder(candidate);
  const decisionNumbers = new Map(visibleRefs.map((ref, index) => [ref, index + 1]));
  const requiresReconciliation = newerTurns.length > 0;
  const selectedRefs = groups.filter(group => selectedGroups.includes(group[0])).flat();
  const decisionCount = visibleDecisionCount(candidate);
  const openPointCount = workingDraft.metrics.openHighValueDecisions;
  const superseded = workingDraft.history.filter((item) => item.status === "SUPERSEDED");

  if (projectionMode === "STANDARD") return <section data-testid="project-finalization-card"
    className="border-t px-4 py-3 text-sm sm:px-5" aria-label="Confirmation du projet">
    {requiresReconciliation ? <div data-testid="preparation-newer-conversation">
      <p>Vos nouveaux échanges ne sont pas inclus dans les choix ci-dessus. Reprenons-les avant de mettre à jour le projet.</p>
      <ul className="mt-2 space-y-1">{newerTurns.map(turn => <li key={turn.turnId}>{turn.content}</li>)}</ul>
      {onReprepare && <button type="button" onClick={onReprepare} className="mt-2 min-h-11 rounded-xl border px-4 py-2">
        Repréparer avec les nouveaux échanges
      </button>}
    </div> : <p>Vous pouvez confirmer ces choix dans la conversation. Les points ouverts resteront ouverts.</p>}
    <button type="button" disabled={disabled || requiresReconciliation} onClick={() => onConfirm()}
      className="mt-2 min-h-11 rounded-xl border px-4 py-2 disabled:opacity-40">Valider ces choix</button>
    {onAbandon && <button type="button" disabled={disabled} onClick={onAbandon}
      className="ml-2 min-h-11 rounded-xl px-3 py-2">Poursuivre sans enregistrer</button>}
    {error && <p role="alert" className="mt-2 text-destructive">{error}</p>}
  </section>;

  return <section className="border-t bg-primary/5 px-4 py-4 sm:px-5" data-testid="project-finalization-card" aria-labelledby="project-finalization-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 id="project-finalization-title" className="text-sm font-semibold">
          {decisionCount} décision{decisionCount > 1 ? "s" : ""} prête{decisionCount > 1 ? "s" : ""} à confirmer
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{openPointCount === 0
          ? "Les choix présentés sont prêts à être confirmés."
          : `${openPointCount} point${openPointCount > 1 ? "s" : ""} reste${openPointCount > 1 ? "nt" : ""} à définir.`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">La validation utilise uniquement les choix de cette revue. Un message dans la conversation ne les adopte pas.</p>
        {superseded.length > 0 && <p className="mt-1 text-xs text-muted-foreground">
          {superseded.length} correction{superseded.length > 1 ? "s" : ""} prise{superseded.length > 1 ? "s" : ""} en compte.
        </p>}
      </div>
      <button type="button" disabled={disabled || requiresReconciliation && !selectedRefs.length}
        onClick={() => onConfirm(requiresReconciliation ? selectedRefs : undefined)}
        className="min-h-11 shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
        Valider ces choix
      </button>
    </div>
    {capturedAt && <p className="mt-2 text-xs text-muted-foreground">Préparation figée le {new Date(capturedAt).toLocaleString("fr-FR")}. Les échanges suivants restent hors de ce périmètre.</p>}
    {requiresReconciliation && <section data-testid="preparation-newer-conversation" className="mt-3 rounded-xl border p-3 text-sm">
      <h4 className="font-semibold">Échanges postérieurs à la préparation</h4>
      <ul className="my-2 space-y-1">{newerTurns.map(turn => <li key={turn.turnId}>{turn.content}</li>)}</ul>
      <p>Relisez ces échanges puis sélectionnez uniquement les groupes qui restent valides. Les éléments dépendants sont groupés par l’owner de revue. Si une correction affecte un groupe, ne le validez pas : demandez une nouvelle préparation.</p>
      {onReprepare && <button type="button" onClick={onReprepare}
        className="mt-3 min-h-11 rounded-xl border px-4 py-2 font-semibold">Repréparer avec les nouveaux échanges</button>}
      <div className="mt-3 space-y-3">{groups.map(group => <label key={group[0]} className="flex items-start gap-2">
        <input type="checkbox" disabled={disabled} checked={selectedGroups.includes(group[0])}
          onChange={event => setSelectedGroups(current => event.target.checked ? [...current, group[0]] : current.filter(ref => ref !== group[0]))} />
        <span>Confirmer ce groupe après relecture : {group.flatMap(ref => decisionNumbers.has(ref) ? [`choix ${decisionNumbers.get(ref)}`] : []).join(", ") || "liens associés aux choix de la revue"}
          <span className="block text-xs text-muted-foreground">Les liens associés sont inclus ; leur détail technique reste consultable.</span></span>
      </label>)}</div>
    </section>}
    {onAbandon && <button type="button" disabled={disabled} onClick={onAbandon} className="mt-3 min-h-9 rounded-lg border px-3 text-sm">Abandonner cette revue</button>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium">Voir / modifier les choix</summary>
      <div className="mt-3 space-y-3">
        {superseded.length > 0 && <section className="rounded-xl border bg-background p-3" aria-label="Choix remplacés ou retirés">
          <h4 className="font-semibold">Choix remplacés ou retirés</h4>
          <ul className="mt-2 space-y-1 text-muted-foreground">{superseded.map((item, index) => <li key={`${item.atom.ref}:${index}`}>{item.atom.content}</li>)}</ul>
        </section>}
        <ContributionReview contribution={contribution} candidate={candidate} currentProject={currentProject}
          status="PENDING" expanded readOnly onConfirm={() => undefined} onCorrect={() => undefined} onReject={() => undefined} />
      </div>
    </details>
  </section>;
}
