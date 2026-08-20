import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
} from "@/features/scientific-interpretation/contracts";
import {
  contributionItems,
  prepareResearchProjectContributionCandidate,
  sectionForContributionItem,
  type ResearchProjectOwnerProjection,
  type ResearchProjectSectionId,
} from "@/features/research-project-construction";

const REVIEW_LABELS: Partial<Record<ResearchProjectSectionId, string>> = {
  QUESTION: "Projet",
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

const OPEN_POINT_LABELS: Partial<Record<ResearchProjectSectionId, string>> = {
  POPULATION: "population précise",
  DESIGN: "design de l’étude",
  IMAGING: "imagerie",
  MEASUREMENTS: "mesures et critère principal",
  TEMPORALITY: "temporalité",
  ANALYSIS: "analyse",
};

type Props = {
  contribution: ScientificInterpretationContributionEnvelope;
  project: ResearchProjectOwnerProjection | null;
  status: "PENDING" | "CONFIRMED";
  onConfirm: () => void;
  onCorrect: () => void;
};

export default function ContributionReview({ contribution, project, status, onConfirm, onCorrect }: Props) {
  const items = atomicItems(contribution);
  const changes = project ? changesFromLastUserTurn(contribution) : [];
  const displayItems = project ? changes : items;
  const sectionIds = [...new Set(displayItems.map((item) => sectionForContributionItem(item, contribution)).filter((id): id is ResearchProjectSectionId => Boolean(id && REVIEW_LABELS[id])))];
  const sections = [
    ...(!project ? [{
      id: "QUESTION" as const,
      label: REVIEW_LABELS.QUESTION!,
      items: [{ itemId: `proposal:${contribution.identity.contributionId}`, content: contribution.scientificContent.normalizedUnderstanding ?? contribution.source.originalRequest }],
    }] : []),
    ...sectionIds.map((id) => ({ id, label: REVIEW_LABELS[id]!, items: displayItems.filter((item) => sectionForContributionItem(item, contribution) === id) })),
  ];
  const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  const openPoints = candidate.proposedSections
    .filter((section) => section.state !== "DEFINED" && OPEN_POINT_LABELS[section.sectionId])
    .map((section) => OPEN_POINT_LABELS[section.sectionId]!);

  return <section className="rounded-3xl border border-primary/30 bg-card p-5 shadow-sm" aria-labelledby={`review-${contribution.identity.contributionId}`} data-testid="functional-contribution-review">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{project ? "Modifications proposées" : "Première structure proposée"}</p>
    <h3 id={`review-${contribution.identity.contributionId}`} className="mt-2 text-xl font-semibold">
      {project ? `J’ai compris ${countInFrench(changes.length)} :` : "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude."}
    </h3>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{project
      ? "Voici les changements repérés dans votre dernier message. Ils ne seront appliqués qu’après votre confirmation."
      : "Cette proposition reste modifiable. Vous pouvez la confirmer ou décrire librement ce que vous souhaitez changer."}</p>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {sections.map((section) => <section key={section.id} className="rounded-2xl border p-3">
        <h4 className="text-sm font-semibold">{section.label}</h4>
        <ul className="mt-2 space-y-1.5 text-sm">{section.items.map((item) => <li key={item.itemId} className="break-words">{project ? `• ${item.content}` : item.content}</li>)}</ul>
      </section>)}
    </div>

    {!project && openPoints.length > 0 && <section className="mt-4 rounded-2xl border border-dashed p-4" aria-labelledby={`open-${contribution.identity.contributionId}`}>
      <h4 id={`open-${contribution.identity.contributionId}`} className="text-sm font-semibold">Points encore ouverts</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{openPoints.map((point) => <li key={point}>{point}</li>)}</ul>
    </section>}

    {status === "PENDING" ? <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <button type="button" onClick={onConfirm} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Cela correspond à mon projet</button>
      <button type="button" onClick={onCorrect} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium">Décrire une correction</button>
    </div> : <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-100">{project ? "Modifications confirmées." : "Structure confirmée."}</p>}
  </section>;
}
