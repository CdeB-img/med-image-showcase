import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import {
  type ResearchProjectContributionCandidate,
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
  candidate: ResearchProjectContributionCandidate;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  onConfirm: () => void;
  onCorrect: () => void;
  onReject: () => void;
};

export default function ContributionReview({ contribution, candidate, status, onConfirm, onCorrect, onReject }: Props) {
  const isUpdate = candidate.changeSet.baseProjectVersion !== null;
  const changes = candidate.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE");
  const canonicalFallback = changes.length ? [] : [
    ...candidate.canonicalChangeSet.objectChanges.map((change) => ({
      id: change.changeRef,
      label: REVIEW_LABELS[change.candidate?.sectionId ?? "ANALYSIS"] ?? "Projet",
      content: change.candidate?.content ?? `Retrait de ${change.objectId}`,
    })),
    ...candidate.canonicalChangeSet.relationChanges.map((change) => ({
      id: change.changeRef,
      label: "Analyse",
      content: change.candidate
        ? `${change.candidate.relationType} : ${change.candidate.sourceObjectRef} → ${change.candidate.targetObjectRef}`
        : `Retrait de la relation ${change.relationId}`,
    })),
  ];
  const initialSections = candidate.proposedSections
    .filter((section) => section.elements.length > 0 && REVIEW_LABELS[section.sectionId])
    .map((section) => ({
      id: section.sectionId,
      label: REVIEW_LABELS[section.sectionId]!,
      items: section.elements.map((element) => ({ itemId: element.elementId, content: element.content })),
    }));
  const changeSectionIds = [...new Set(changes.map((change) => change.targetSectionId))];
  const changeSections = changeSectionIds.map((id) => ({
    id,
    label: REVIEW_LABELS[id]!,
    items: changes.filter((change) => change.targetSectionId === id).map((change) => ({ itemId: change.changeId, content: change.presentation })),
  }));
  const canonicalSections = [...new Set(canonicalFallback.map((change) => change.label))].map((label) => ({
    id: `canonical:${label}`,
    label,
    items: canonicalFallback.filter((change) => change.label === label).map((change) => ({ itemId: change.id, content: change.content })),
  }));
  const sections = isUpdate ? (changeSections.length ? changeSections : canonicalSections) : (initialSections.length ? initialSections : canonicalSections);
  const changeCount = changes.length || canonicalFallback.length;
  const openPoints = candidate.proposedSections
    .filter((section) => section.state !== "DEFINED" && OPEN_POINT_LABELS[section.sectionId])
    .map((section) => OPEN_POINT_LABELS[section.sectionId]!);

  return <section className="rounded-3xl border border-primary/30 bg-card p-5 shadow-sm" aria-labelledby={`review-${contribution.identity.contributionId}`} data-testid="functional-contribution-review">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{isUpdate ? "Modifications proposées" : "Première structure proposée"}</p>
    <h3 id={`review-${contribution.identity.contributionId}`} className="mt-2 text-xl font-semibold">
      {isUpdate ? `J’ai compris ${countInFrench(changeCount)} :` : "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude."}
    </h3>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{isUpdate
      ? "Voici les changements repérés dans votre dernier message. Ils ne seront appliqués qu’après votre confirmation."
      : "Cette proposition reste modifiable. Vous pouvez la confirmer ou décrire librement ce que vous souhaitez changer."}</p>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {sections.map((section) => <section key={section.id} className="rounded-2xl border p-3">
        <h4 className="text-sm font-semibold">{section.label}</h4>
        <ul className="mt-2 space-y-1.5 text-sm">{section.items.map((item) => <li key={item.itemId} className="break-words">{item.content}</li>)}</ul>
      </section>)}
    </div>

    {!isUpdate && openPoints.length > 0 && <section className="mt-4 rounded-2xl border border-dashed p-4" aria-labelledby={`open-${contribution.identity.contributionId}`}>
      <h4 id={`open-${contribution.identity.contributionId}`} className="text-sm font-semibold">Points encore ouverts</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{openPoints.map((point) => <li key={point}>{point}</li>)}</ul>
    </section>}

    {status === "PENDING" ? <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <button type="button" onClick={onConfirm} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Cela correspond à mon projet</button>
      <button type="button" onClick={onCorrect} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium">Décrire une correction</button>
      <button type="button" onClick={onReject} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground">Refuser cette proposition</button>
    </div> : status === "CONFIRMED"
      ? <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-100">{isUpdate ? "Modifications confirmées." : "Structure confirmée."}</p>
      : <p role="status" className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Proposition refusée. Le Research Project est inchangé.</p>}
  </section>;
}
