import type { ScientificContributionItem, ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";

type ReviewStatus = "PENDING" | "CONFIRMED" | "CORRECTION_REQUESTED";

type ReviewSection = {
  id: string;
  label: string;
  items: ScientificContributionItem[];
};

const itemState = (item: ScientificContributionItem, status: ReviewStatus) => {
  if (status === "CORRECTION_REQUESTED" || (item.previousItemIds?.length ?? 0) > 0) return "Corrigé";
  if (item.epistemicBoundary.epistemicState === "UNKNOWN"
    || ["UNKNOWN", "AMBIGUOUS"].includes(item.epistemicBoundary.epistemicStatus ?? "")) return "À préciser";
  if (status === "CONFIRMED" || item.epistemicBoundary.epistemicStatus === "CONFIRMED_BY_USER") return "Confirmé";
  if (item.epistemicBoundary.epistemicStatus === "EXPLICIT_USER_STATED") {
    const source = item.epistemicBoundary.sourceText?.normalize("NFKC").trim().toLocaleLowerCase("fr-FR") ?? "";
    const content = item.content.normalize("NFKC").trim().toLocaleLowerCase("fr-FR");
    return source && source !== content ? "Reformulé" : "Déclaré";
  }
  return "Interprété — à confirmer";
};

const sectionsFor = (contribution: ScientificInterpretationContributionEnvelope): ReviewSection[] => {
  const items = [...new Map([
    ...contribution.scientificContent.explicitStatements,
    ...contribution.scientificContent.candidateObjects,
    ...contribution.scientificContent.inferredContext,
    ...contribution.scientificContent.contextualCandidates,
    ...contribution.scientificContent.temporalElements,
  ].map((item) => [item.itemId, item])).values()].filter((item) => item.epistemicBoundary.activeState !== false);
  const byType = (...types: string[]) => items.filter((item) => types.includes(item.proposedType ?? ""));
  return [
    { id: "objective", label: "Objectif", items: byType("SCIENTIFIC_INTENT", "OPERATION", "GOAL", "OBJECTIVE") },
    { id: "hypothesis", label: "Hypothèse de départ", items: byType("HYPOTHESIS") },
    { id: "condition", label: "Pathologie / condition", items: byType("CONDITION", "CLINICAL_CONDITION", "DISEASE_CONDITION") },
    { id: "context", label: "Contexte du projet", items: byType("PROJECT_INFORMATION", "PROJECT_CONTEXT", "CONTEXT") },
    { id: "intervention", label: "Intervention / exposition", items: byType("INTERVENTION", "EXPOSURE", "INTERVENTION_OR_EXPOSURE", "DRUG") },
    { id: "comparator", label: "Comparateur", items: byType("COMPARATOR") },
    { id: "population", label: "Population", items: byType("POPULATION") },
    { id: "design", label: "Design envisagé", items: byType("STUDY_DESIGN") },
    { id: "imaging", label: "Imagerie", items: byType("MODALITY", "IMAGING_MODALITY", "IMAGING_METHOD", "ACQUISITION") },
    { id: "measurements", label: "Éléments à observer ou mesurer", items: byType("CANONICAL_VARIABLE", "MEASURED_VARIABLE", "MEASUREMENT", "BIOMARKER", "BIOLOGICAL_BIOMARKER", "BIOLOGICAL_MEASUREMENT", "OUTCOME", "ENDPOINT", "SCIENTIFIC_OBJECT", "QUANTITATIVE_IMAGING_TARGET") },
    { id: "data-need", label: "Besoin de données", items: byType("DATA_NEED") },
    { id: "analysis-intent", label: "Intention d’analyse", items: byType("ANALYSIS_INTENT") },
    { id: "analysis", label: "Analyse", items: byType("ANALYSIS", "ANALYSIS_SPECIFICATION") },
    { id: "timing", label: "Temporalité", items: byType("TIMING", "TEMPORAL_ELEMENT") },
  ].filter((section) => section.items.length);
};

type Props = {
  contribution: ScientificInterpretationContributionEnvelope;
  status: ReviewStatus;
  onConfirm: () => void;
  onCorrect: () => void;
  onAdd: () => void;
  presentationOnly?: boolean;
};

export default function UnderstandingReviewCard({ contribution, status, onConfirm, onCorrect, onAdd, presentationOnly = false }: Props) {
  const sections = sectionsFor(contribution);
  const unknowns = [...contribution.scientificContent.unknowns, ...contribution.scientificContent.missingInformation];
  const normalizedUnderstanding = contribution.scientificContent.normalizedUnderstanding;
  const normalizedUnderstandingDuplicatesItem = Boolean(normalizedUnderstanding) && sections
    .some((section) => section.items.some((item) => item.content.trim() === normalizedUnderstanding?.trim()));
  return <section className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm" aria-labelledby="understanding-review-title" data-testid="understanding-review-card">
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Compréhension de travail</p>
    <h3 id="understanding-review-title" className="mt-2 text-xl font-semibold">Voici ce que j’ai compris</h3>
    <p className="mt-2 text-sm text-muted-foreground">{presentationOnly
      ? "Voici les éléments compris dans votre demande. Ils restent modifiables tant que vous n’avez pas confirmé votre projet."
      : "Vérifiez cette reformulation avant de poursuivre. Elle reste une Contribution candidate et n’écrit pas dans le Research Project."}</p>
    {normalizedUnderstanding && !normalizedUnderstandingDuplicatesItem && <p className="mt-4 rounded-xl bg-primary/10 p-4 text-sm">{normalizedUnderstanding}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{sections.map((section) => <section key={section.id} className="rounded-xl border p-3">
      <h4 className="text-sm font-semibold">{section.label}</h4>
      <ul className="mt-2 space-y-2">{section.items.map((item) => <li key={item.itemId} className="text-sm"><span className="block break-words">{item.content}</span><span className="mt-1 inline-flex rounded-full border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{itemState(item, status)}</span></li>)}</ul>
    </section>)}</div>
    {unknowns.length > 0 && <section className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3"><h4 className="text-sm font-semibold">Inconnues importantes</h4><ul className="mt-2 space-y-1 text-sm">{unknowns.map((item) => <li key={item.itemId}>{item.content}</li>)}</ul></section>}
    {!presentationOnly && <div className="mt-5 flex flex-wrap gap-2">
      {status !== "CONFIRMED" && <button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Cela correspond à mon objectif</button>}
      <button type="button" onClick={onCorrect} className="min-h-11 rounded-lg border px-4 py-2 text-sm">Modifier certains éléments</button>
      <button type="button" onClick={onAdd} className="min-h-11 rounded-lg border px-4 py-2 text-sm">Ajouter une précision</button>
    </div>}
    {status === "CONFIRMED" && <p role="status" className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-100">Compréhension confirmée comme base de travail. Aucune décision Project n’a été adoptée.</p>}
  </section>;
}
