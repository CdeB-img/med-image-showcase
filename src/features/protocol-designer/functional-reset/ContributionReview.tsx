import { Component, useState, type ReactNode } from "react";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import {
  ensureCanonicalProjectState,
  presentCanonicalTemporalAnchor,
  type HumanReviewProjectionItem,
  type ResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

const countInFrench = (count: number) => count === 1 ? "une modification" : count === 2 ? "deux modifications" : `${count} modifications`;

type Props = {
  contribution: ScientificInterpretationContributionEnvelope;
  candidate: ResearchProjectContributionCandidate;
  currentProject?: ResearchProjectOwnerProjection | null;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  actionable?: boolean;
  disabled?: boolean;
  detailedUnderstanding?: ReactNode;
  onConfirm: () => void;
  onCorrect: () => void;
  onReject: () => void;
};

const normalized = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const uniqueItems = <T extends { content: string }>(items: readonly T[]) => [...new Map(items.map((item) => [normalized(item.content), item])).values()];
const primaryEndpoint = (item: HumanReviewProjectionItem) => item.objectType === "ENDPOINT"
  && /PRIMARY|PRINCIPAL/i.test(item.scientificRole ?? "");
const summaryItemContent = (item: { content: string }) => {
  const withoutOperation = item.content.replace(/^\+\s+/u, "");
  const naturalRelation = withoutOperation.replace(/\s+—\s+comparaison avec\s+→\s+/iu, " en comparaison avec ");
  const typographicTiming = naturalRelation
    .replace(/\b(?:a|à)\s+(\d+(?:[.,]\d+)?)\s*min\b/iu, "à $1 min")
    .replace(/\bpost\s+injection\b/iu, "post-injection");
  return typographicTiming.length
    ? `${typographicTiming.charAt(0).toLocaleUpperCase("fr-FR")}${typographicTiming.slice(1)}`
    : typographicTiming;
};

type SummaryRow = { id: string; label: string; items: HumanReviewProjectionItem[] };

const initialSummaryRows = (candidate: ResearchProjectContributionCandidate): SummaryRow[] => {
  const items = candidate.humanReviewProjection.sections.flatMap((section) => section.items);
  // UNCERTAINTY remains part of the candidate/Project model but is rendered
  // once through the dedicated clarification row below.
  const objects = items.filter((item) => item.changeKind === "OBJECT" && item.objectType !== "UNCERTAINTY");
  const endpoints = uniqueItems(objects.filter(primaryEndpoint));
  const endpointTexts = endpoints.map((item) => normalized(item.content));
  const timedEndpointCores = endpointTexts.flatMap((endpoint) => {
    const marker = endpoint.search(/\b(?:a|au|apres|post)\s+(?:j|m)?\s*\d+/u);
    return marker > 0 ? [endpoint.slice(0, marker).trim()] : [];
  });
  const isEndpointMeasurement = (item: HumanReviewProjectionItem) => {
    const measurement = normalized(item.content);
    return endpointTexts.some((endpoint) => endpoint === measurement || endpoint.includes(measurement));
  };
  const isEndpointOccasionAlreadyVisible = (item: HumanReviewProjectionItem) => item.changeKind === "EXPECTED_VARIABLE_OCCASION"
    && timedEndpointCores.some((core) => core.length > 0 && normalized(item.content).includes(core));
  const bySection = (...sectionIds: string[]) => uniqueItems(objects.filter((item) => (
    item.projectSectionId && sectionIds.includes(item.projectSectionId)
  )));
  const relations = uniqueItems(items.filter((item) => item.changeKind === "RELATION"));
  const comparison = relations.length ? relations : bySection("INTERVENTION", "COMPARATOR");
  const evaluation = uniqueItems([
    ...items.filter((item) => item.projectSectionId === "TEMPORALITY" && !isEndpointOccasionAlreadyVisible(item)),
    ...bySection("IMAGING"),
    ...bySection("MEASUREMENTS").filter((item) => !primaryEndpoint(item) && !isEndpointMeasurement(item)),
  ]);
  const summarizedSections = new Set([
    "QUESTION", "POPULATION", "DESIGN", "INTERVENTION", "COMPARATOR", "TEMPORALITY", "IMAGING", "MEASUREMENTS",
  ]);
  const otherItems = uniqueItems(objects.filter((item) => !item.projectSectionId || !summarizedSections.has(item.projectSectionId)));
  return [
    { id: "study", label: "Étude", items: bySection("QUESTION", "POPULATION", "DESIGN") },
    { id: "comparison", label: "Comparaison", items: comparison },
    { id: "evaluation", label: "Évaluation", items: evaluation },
    { id: "primary-endpoint", label: "Critère principal", items: endpoints },
    { id: "other", label: "Autres éléments", items: otherItems },
  ].filter((row) => row.items.length);
};

const activeIssueItems = (contribution: ScientificInterpretationContributionEnvelope) => uniqueItems([
  ...contribution.scientificContent.clarificationNeeds,
  ...contribution.scientificContent.ambiguities,
].filter((item) => item.epistemicBoundary.activeState !== false));

type PreservedProjectProperty = { id: string; label: string; content: string };

const preservedProjectPropertiesForReview = (
  candidate: ResearchProjectContributionCandidate,
  currentProject: ResearchProjectOwnerProjection | null | undefined,
): PreservedProjectProperty[] => {
  if (!currentProject || candidate.canonicalChangeSet.baseProjectVersion !== currentProject.versionId) return [];
  const state = ensureCanonicalProjectState(currentProject);
  const activeObjects = new Map(state.objects
    .filter((object) => object.actuality === "CURRENT")
    .map((object) => [object.objectId, object] as const));
  const replacements = candidate.canonicalChangeSet.objectChanges.filter((change) => (
    change.operation === "REPLACE" && change.candidate
  ));
  const replacedObjectRefs = new Set(replacements.map((change) => change.objectId));
  const changedTemporalRefs = new Set(candidate.canonicalChangeSet.temporalQualificationChanges.map((change) => change.qualificationId));
  const changedOccasionRefs = new Set(candidate.canonicalChangeSet.expectedVariableOccasionChanges.map((change) => change.occasionId));
  const objectLabels = new Map([...activeObjects].map(([ref, object]) => [ref, object.content] as const));
  replacements.forEach((change) => {
    if (change.candidate) objectLabels.set(change.objectId, change.candidate.content);
  });

  const roles = replacements.flatMap((change): PreservedProjectProperty[] => {
    const previous = activeObjects.get(change.objectId);
    if (!previous?.scientificRole || previous.scientificRole !== change.candidate?.scientificRole) return [];
    if (!/PRIMARY|PRINCIPAL/iu.test(previous.scientificRole)) return [];
    return [{ id: `role:${change.objectId}`, label: "Rôle conservé", content: "Critère principal" }];
  });
  const temporalQualifications = state.temporalQualifications.flatMap((qualification): PreservedProjectProperty[] => (
    qualification.actuality === "CURRENT"
      && replacedObjectRefs.has(qualification.subjectProjectRef)
      && !changedTemporalRefs.has(qualification.qualificationId)
      ? [{
        id: `temporal:${qualification.qualificationId}`,
        label: "Temporalité conservée",
        content: presentCanonicalTemporalAnchor(qualification.anchor, objectLabels),
      }]
      : []
  ));
  const expectedOccasions = state.expectedVariableOccasions.flatMap((occasion): PreservedProjectProperty[] => (
    occasion.actuality === "CURRENT"
      && replacedObjectRefs.has(occasion.variableProjectRef)
      && !changedOccasionRefs.has(occasion.occasionId)
      ? [{
        id: `occasion:${occasion.occasionId}`,
        label: "Temporalité conservée",
        content: presentCanonicalTemporalAnchor(occasion.anchor, objectLabels),
      }]
      : []
  ));
  return [...new Map([...roles, ...temporalQualifications, ...expectedOccasions]
    .map((item) => [`${item.label}:${normalized(item.content)}`, item])).values()];
};

export default function ContributionReview({ contribution, candidate, currentProject, status, actionable = true, disabled = false, detailedUnderstanding, onConfirm, onCorrect, onReject }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isUpdate = candidate.changeSet.baseProjectVersion !== null;
  const sections = candidate.humanReviewProjection.sections;
  const changeCount = candidate.humanReviewProjection.coveredChangeRefs.length;
  const openPoints = candidate.humanReviewProjection.openPoints;
  const summaryRows = initialSummaryRows(candidate);
  const issueItems = activeIssueItems(contribution);
  const preservedProperties = status === "PENDING"
    ? preservedProjectPropertiesForReview(candidate, currentProject)
    : [];

  return <section className="rounded-3xl border border-primary/30 bg-card p-5 shadow-sm" aria-labelledby={`review-${contribution.identity.contributionId}`} data-testid="functional-contribution-review">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{isUpdate ? "Correction proposée" : "Synthèse de l’étude"}</p>
    <h3 id={`review-${contribution.identity.contributionId}`} className="mt-2 text-xl font-semibold">
      {isUpdate ? `J’ai compris ${countInFrench(changeCount)} :` : "Voici la structure essentielle à confirmer."}
    </h3>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{isUpdate
      ? "Voici les changements repérés dans votre dernier message. Ils ne seront appliqués qu’après votre confirmation."
      : "Cette proposition reste modifiable. Vous pouvez la confirmer ou décrire librement ce que vous souhaitez changer."}</p>

    {!isUpdate && <dl className="mt-4 divide-y rounded-2xl border bg-background px-4" data-testid="standard-initial-review-summary">
      {summaryRows.map((row) => <div key={row.id} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
        <dt className="text-sm font-semibold">{row.label}</dt>
        <dd className="text-sm leading-relaxed">{row.items.map(summaryItemContent).join(" · ")}</dd>
      </div>)}
      {issueItems.length > 0 && <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
        <dt className="text-sm font-semibold text-amber-800 dark:text-amber-200">À clarifier</dt>
        <dd className="text-sm leading-relaxed">{issueItems.map(summaryItemContent).join(" · ")}</dd>
      </div>}
    </dl>}

    {isUpdate && <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {sections.map((section) => <section key={section.sectionRef} className="rounded-2xl border p-3">
        <h4 className="text-sm font-semibold">{section.label}</h4>
        <ul className="mt-2 space-y-1.5 text-sm">{section.items.map((item) => <li key={item.reviewItemRef} className="break-words">
          <span className="block">{item.content}</span>
          {(item.statusLabel || item.specificationLabel) && <span className="mt-1 flex flex-wrap gap-1">
            {item.statusLabel && <span className="inline-flex rounded-full border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{item.statusLabel}</span>}
            {item.specificationLabel && <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-muted-foreground">{item.specificationLabel}</span>}
          </span>}
        </li>)}</ul>
      </section>)}
    </div>}

    {isUpdate && preservedProperties.length > 0 && <dl className="mt-3 divide-y rounded-2xl border border-dashed bg-background px-4" data-testid="standard-update-preserved-properties">
      {preservedProperties.map((property) => <div key={property.id} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
        <dt className="text-sm font-semibold">{property.label}</dt>
        <dd className="text-sm leading-relaxed">{property.content}</dd>
      </div>)}
    </dl>}

    {isUpdate && status === "PENDING" && <p className="mt-3 text-sm text-muted-foreground">Cette modification reste à confirmer ; le Research Project est inchangé.</p>}

    {!isUpdate && <details
      className="mt-4 rounded-2xl border border-dashed p-4"
      data-testid="functional-review-details"
      onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm font-semibold">Voir les détails</summary>
      {detailsOpen && <div className="mt-4 space-y-4">
        {detailedUnderstanding}
        <div className="grid gap-3 sm:grid-cols-2">
          {sections.map((section) => <section key={section.sectionRef} className="rounded-2xl border p-3">
            <h4 className="text-sm font-semibold">{section.label}</h4>
            <ul className="mt-2 space-y-1.5 text-sm">{section.items.map((item) => <li key={item.reviewItemRef} className="break-words">
              <span className="block">{item.content}</span>
              {(item.statusLabel || item.specificationLabel) && <span className="mt-1 flex flex-wrap gap-1">
                {item.statusLabel && <span className="inline-flex rounded-full border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{item.statusLabel}</span>}
                {item.specificationLabel && <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-muted-foreground">{item.specificationLabel}</span>}
              </span>}
            </li>)}</ul>
          </section>)}
        </div>
        {openPoints.length > 0 && <section className="rounded-2xl border border-dashed p-4" aria-labelledby={`open-${contribution.identity.contributionId}`}>
          <h4 id={`open-${contribution.identity.contributionId}`} className="text-sm font-semibold">Points encore ouverts</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{openPoints.map((point) => <li key={point.openPointRef}>{point.content}</li>)}</ul>
        </section>}
      </div>}
    </details>}

    {status === "PENDING" && !actionable
      ? <p role="status" className="mt-5 text-sm text-muted-foreground">Proposition conservée dans l’historique, non sélectionnée pour une décision dans ce tour.</p>
      : status === "PENDING" ? <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <button type="button" disabled={disabled} onClick={onConfirm} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Cela correspond à mon projet</button>
      <button type="button" disabled={disabled} onClick={onCorrect} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium">Décrire une correction</button>
      <button type="button" disabled={disabled} onClick={onReject} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-medium text-muted-foreground">Refuser cette proposition</button>
    </div> : status === "CONFIRMED"
      ? <p role="status" className="mt-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-100">{isUpdate ? "Modifications confirmées." : "Structure confirmée."}</p>
      : <p role="status" className="mt-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Proposition refusée. Le Research Project est inchangé.</p>}
  </section>;
}


// This is a local presentation acknowledgement, not a Human Decision.
// The render factory puts both review surfaces and candidate preparation inside
// the boundary. Arguments evaluated by the parent before this factory are not covered.
export type ContributionReviewPresentationFailure = Readonly<{
  stage: "PRESENTATION";
  code: "CONTRIBUTION_REVIEW_PRESENTATION_FAILED";
}>;
type ContributionReviewPresentationProps = Readonly<{
  presentationRef: string;
  renderReview: () => ReactNode;
  onPresented: () => void;
  onPresentationFailure: (failure: ContributionReviewPresentationFailure) => void;
}>;

function ContributionReviewPresentationContent({ renderReview }: Pick<ContributionReviewPresentationProps, "renderReview">) {
  return renderReview();
}

class ContributionReviewPresentationBoundary extends Component<
  ContributionReviewPresentationProps,
  { failed: boolean }
> {
  state = { failed: false };
  private mounted = false;
  private acknowledged = false;
  private failureReported = false;

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidMount() {
    this.mounted = true;
    // Defer only the acknowledgement until this commit has finished. A sibling
    // or descendant render/layout failure must win over a pending acknowledgement.
    // This does not schedule another render, provider call or scientific retry.
    queueMicrotask(() => {
      if (!this.mounted || this.state.failed || this.failureReported || this.acknowledged) return;
      this.acknowledged = true;
      this.props.onPresented();
    });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentDidCatch() {
    if (this.failureReported) return;
    this.failureReported = true;
    this.props.onPresentationFailure({
      stage: "PRESENTATION",
      code: "CONTRIBUTION_REVIEW_PRESENTATION_FAILED",
    });
  }

  render() {
    if (this.state.failed) return null;
    return <ContributionReviewPresentationContent renderReview={this.props.renderReview} />;
  }
}

/** Explicit identity prevents silently retrying a failed presentation on rerender.
 * The unchanged default ContributionReview remains usable by existing consumers.
 */
export function ContributionReviewPresentation(props: ContributionReviewPresentationProps) {
  return <ContributionReviewPresentationBoundary key={props.presentationRef} {...props} />;
}
