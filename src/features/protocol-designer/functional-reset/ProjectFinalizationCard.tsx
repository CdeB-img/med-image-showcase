import { useState } from "react";
import { contributionDecisionScopeGroups } from "@/features/research-project-construction";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { ResearchProjectContributionCandidate, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { WorkingDraftMetadata } from "./continuous-project-build";
import ContributionReview from "./ContributionReview";

type Props = Readonly<{
  contribution: ScientificInterpretationContributionEnvelope;
  candidate: ResearchProjectContributionCandidate;
  currentProject: ResearchProjectOwnerProjection | null;
  workingDraft: WorkingDraftMetadata;
  disabled: boolean;
  error?: string | null;
  capturedAt?: string;
  newerTurns?: readonly ScientificInterpretationTurn[];
  onAbandon?: () => void;
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
  onConfirm, capturedAt, newerTurns = [], onAbandon,
}: Props) {
  const [selectedGroups, setSelectedGroups] = useState<readonly string[]>([]);
  const groups = contributionDecisionScopeGroups(candidate, currentProject);
  const items = candidate.humanReviewProjection.sections.flatMap(section => section.items);
  const requiresReconciliation = newerTurns.length > 0;
  const selectedRefs = groups.filter(group => selectedGroups.includes(group[0])).flat();
  const decisionCount = visibleDecisionCount(candidate);
  const openPointCount = workingDraft.metrics.openHighValueDecisions;
  const superseded = workingDraft.history.filter((item) => item.status === "SUPERSEDED");

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
      <div className="mt-3 space-y-3">{groups.map(group => <label key={group[0]} className="flex items-start gap-2">
        <input type="checkbox" disabled={disabled} checked={selectedGroups.includes(group[0])}
          onChange={event => setSelectedGroups(current => event.target.checked ? [...current, group[0]] : current.filter(ref => ref !== group[0]))} />
        <span>Confirmer ce groupe après relecture : {items.filter(item => group.includes(item.changeRef)).map(item => item.content).join(" · ")}</span>
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
