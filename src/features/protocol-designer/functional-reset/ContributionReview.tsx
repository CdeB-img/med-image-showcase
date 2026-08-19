import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
} from "@/features/scientific-interpretation/contracts";
import {
  contributionItems,
  sectionForContributionItem,
  type ResearchProjectSectionId,
} from "@/features/research-project-construction";

const REVIEW_LABELS: Partial<Record<ResearchProjectSectionId, string>> = {
  POPULATION: "Population",
  DESIGN: "Design",
  INTERVENTION: "Intervention",
  COMPARATOR: "Comparateur",
  IMAGING: "Imagerie",
  MEASUREMENTS: "Mesures / biomarqueurs",
  TEMPORALITY: "Temporalité",
  ANALYSIS: "Analyse",
};

const uniqueByContent = (items: ScientificContributionItem[]) => [...new Map(items.map((item) => [
  item.content.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/[.\s]+$/g, ""),
  item,
])).values()];

const atomicItems = (contribution: ScientificInterpretationContributionEnvelope) => uniqueByContent(
  contributionItems(contribution).filter((item) => sectionForContributionItem(item, contribution) !== null),
);

const changesFromLastUserTurn = (contribution: ScientificInterpretationContributionEnvelope) => {
  const lastTurn = [...contribution.source.turns].reverse().find((turn) => turn.role === "USER");
  if (!lastTurn) return [];
  return atomicItems(contribution).filter((item) => item.epistemicBoundary.sourceTurnIds.includes(lastTurn.turnId));
};

const countInFrench = (count: number) => count === 1 ? "une modification" : count === 2 ? "deux modifications" : `${count} modifications`;

type Props = {
  contribution: ScientificInterpretationContributionEnvelope;
  projectExists: boolean;
  status: "PENDING" | "CONFIRMED";
  onConfirm: () => void;
  onCorrect: () => void;
};

export default function ContributionReview({ contribution, projectExists, status, onConfirm, onCorrect }: Props) {
  const items = atomicItems(contribution);
  const changes = projectExists ? changesFromLastUserTurn(contribution) : [];
  const sectionIds = [...new Set(items.map((item) => sectionForContributionItem(item, contribution)).filter((id): id is ResearchProjectSectionId => Boolean(id && REVIEW_LABELS[id])))];
  const sections = sectionIds.map((id) => ({ id, label: REVIEW_LABELS[id]!, items: items.filter((item) => sectionForContributionItem(item, contribution) === id) }));

  return <section className="rounded-3xl border border-primary/30 bg-card p-5 shadow-sm" aria-labelledby={`review-${contribution.identity.contributionId}`} data-testid="functional-contribution-review">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Contribution à confirmer</p>
    <h3 id={`review-${contribution.identity.contributionId}`} className="mt-2 text-xl font-semibold">Voici ce que j’ai compris</h3>

    {projectExists && changes.length > 0
      ? <div className="mt-4 rounded-2xl bg-primary/10 p-4 text-sm">
        <p className="font-medium">J’ai compris {countInFrench(changes.length)} :</p>
        <ul className="mt-2 space-y-1.5">{changes.map((item) => <li key={item.itemId}>• {item.content}</li>)}</ul>
        <p className="mt-3">Tu confirmes ?</p>
      </div>
      : <section className="mt-4 rounded-2xl bg-primary/10 p-4">
        <h4 className="text-sm font-semibold">Objectif</h4>
        <p className="mt-2 text-sm leading-relaxed">{contribution.scientificContent.normalizedUnderstanding ?? contribution.source.originalRequest}</p>
      </section>}

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {sections.map((section) => <section key={section.id} className="rounded-2xl border p-3">
        <h4 className="text-sm font-semibold">{section.label}</h4>
        <ul className="mt-2 space-y-1.5 text-sm">{section.items.map((item) => <li key={item.itemId} className="break-words">{item.content}</li>)}</ul>
      </section>)}
    </div>

    {status === "PENDING" ? <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <button type="button" onClick={onConfirm} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Cela correspond à mon projet</button>
      <button type="button" onClick={onCorrect} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium">Je veux corriger quelque chose</button>
    </div> : <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-100">Confirmé et transmis au Research Project.</p>}
  </section>;
}
