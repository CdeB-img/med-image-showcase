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
  onConfirm: () => void;
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
  onConfirm,
}: Props) {
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
        <p className="mt-1 text-xs text-muted-foreground">Validez-vous ces choix ? Vous pouvez répondre dans la conversation ou utiliser le bouton.</p>
        {superseded.length > 0 && <p className="mt-1 text-xs text-muted-foreground">
          {superseded.length} correction{superseded.length > 1 ? "s" : ""} prise{superseded.length > 1 ? "s" : ""} en compte.
        </p>}
      </div>
      <button type="button" disabled={disabled} onClick={onConfirm}
        className="min-h-11 shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
        Valider ces choix
      </button>
    </div>
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium">Voir le détail</summary>
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
