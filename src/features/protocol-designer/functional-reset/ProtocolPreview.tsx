import { ArrowLeft, CircleAlert } from "lucide-react";
import type { DocumentProjection } from "@/features/document-projection";

const ENGINE_LANGUAGE: Record<string, string> = {
  APPLICABLE: "applicable",
  REQUIRED_BUT_NOT_READY: "à préciser avec l’expertise Imaging",
  SPECIALIZED_ENGINE_REQUIRED: "expertise spécialisée nécessaire",
  NOT_EVALUATED_BY_SPECIALIZED_ENGINE: "non évalué par l’expertise spécialisée",
  NO_STATISTICAL_VALUE_INVENTED: "aucune valeur statistique n’a été inventée",
  IMAGING: "imagerie",
  EXPOSURE: "intervention",
  COMPARISON: "comparaison",
};

const userLanguage = (value: string) => value
  .replace(/MeasurementDefinitions/gi, "définitions de mesure")
  .replace(/ObservableProperties/gi, "propriétés observées")
  .replace(/BiomarkerRoles/gi, "rôles des biomarqueurs")
  .replace(/Research Project/gi, "projet")
  .replace(/Biostatistics/gi, "analyse statistique")
  .replace(/Imaging/gi, "imagerie")
  .replace(/\b[A-Z][A-Z0-9_]{2,}\b/g, (token) => ENGINE_LANGUAGE[token] ?? token.toLocaleLowerCase("fr-FR").replace(/_/g, " "));

type StandardSectionDefinition = {
  id: string;
  title: string;
  sourceSectionIds: string[];
  include?: (raw: string) => boolean;
};

const STANDARD_SECTIONS: StandardSectionDefinition[] = [
  { id: "question", title: "Question scientifique", sourceSectionIds: ["scientific-question"] },
  { id: "objectives", title: "Objectifs", sourceSectionIds: ["objectives-hypotheses"] },
  { id: "population", title: "Population", sourceSectionIds: ["population"] },
  { id: "design", title: "Design", sourceSectionIds: ["study-design"] },
  { id: "intervention", title: "Intervention", sourceSectionIds: ["groups-comparators"], include: (raw) => /Groupe EXPOSURE/i.test(raw) },
  { id: "comparator", title: "Comparateur", sourceSectionIds: ["groups-comparators"], include: (raw) => /Groupe COMPARATOR/i.test(raw) },
  { id: "imaging", title: "Imagerie", sourceSectionIds: ["imaging"], include: (raw) => /Référence d’acquisition conceptuelle/i.test(raw) },
  { id: "measurements", title: "Mesures", sourceSectionIds: ["endpoints-variables"] },
  { id: "temporality", title: "Temporalité", sourceSectionIds: ["visits-temporal"] },
  { id: "analysis", title: "Analyse", sourceSectionIds: ["analysis-statistics"], include: (raw) => /Exigence\s+(?:COMPARISON|comparaison)/i.test(raw) },
];

const readableItem = (raw: string) => {
  const group = raw.match(/Groupe (?:EXPOSURE|COMPARATOR)\s*:\s*(.+?)(?:\s+—|$)/i);
  if (group?.[1]) return userLanguage(group[1].trim());
  const withoutCommitment = raw.replace(/^(?:Confirmé|Adopté|Candidat|Exigence|Inconnu|Limite|Contradiction|Rejeté)\s+—\s+/i, "");
  const separator = withoutCommitment.indexOf(":");
  return userLanguage((separator >= 0 ? withoutCommitment.slice(separator + 1) : withoutCommitment).trim());
};

const unique = (values: string[]) => [...new Map(values.map((value) => [
  value.normalize("NFKC").toLocaleLowerCase("fr-FR").replace(/\s+/g, " ").trim(),
  value,
])).values()];

const standardProjection = (projection: DocumentProjection) => STANDARD_SECTIONS.map((definition) => {
  const sourceSections = projection.sections.filter((section) => definition.sourceSectionIds.includes(section.sectionId));
  const values = unique(sourceSections.flatMap((section) => section.blocks
    .filter((block) => block.kind !== "EMPTY_STATE")
    .flatMap((block) => block.items)
    .filter((raw) => definition.include?.(raw) ?? true)
    .map(readableItem)
    .filter(Boolean)));
  const needsClarification = values.length === 0 || sourceSections.some((section) =>
    ["NOT_GENERATABLE", "BLOCKED", "UNKNOWN", "FUTURE"].includes(section.status)
    || section.unknowns.length > 0
    || section.contradictions.length > 0);
  return { ...definition, values, needsClarification };
});

type Props = {
  projection: DocumentProjection;
  stale: boolean;
  onClose: () => void;
};

export default function ProtocolPreview({ projection, stale, onClose }: Props) {
  const sections = standardProjection(projection);
  const openPoints = sections.filter((section) => section.needsClarification).map((section) => section.title);
  const sourceVersion = projection.source.projectVersion.match(/:version:(\d+)$/)?.[1] ?? projection.source.projectVersion;

  return <section className="min-h-[calc(100vh-7.5rem)] rounded-3xl border bg-background shadow-sm" aria-label="Aperçu du protocole" data-testid="functional-protocol-preview">
    <header className="sticky top-0 z-10 rounded-t-3xl border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />Retour à la conversation
      </button>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-primary">Protocole de travail</p>
      <h2 className="mt-1 text-2xl font-semibold">PROTOCOLE DE TRAVAIL</h2>
      <p className="mt-2 text-sm text-muted-foreground">Aperçu produit à partir du Research Project version {sourceVersion}.</p>
      {stale && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Le projet a changé depuis cette version du protocole. Son contenu reste consultable, mais il n’est plus présenté comme courant.</p>
      </div>}
    </header>

    <div className="space-y-5 p-5 sm:p-6">
      <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Version de travail en lecture seule.</p>
        <p className="mt-1 text-muted-foreground">Elle reprend uniquement les informations projetées par la chaîne documentaire actuelle. Elle ne constitue ni un protocole final ni une validation scientifique ou réglementaire.</p>
      </div>

      {sections.map((section) => <article key={section.id} className="rounded-2xl border p-4 sm:p-5" aria-labelledby={`protocol-preview-${section.id}`}>
        <h3 id={`protocol-preview-${section.id}`} className="text-lg font-semibold">{section.title}</h3>
        {section.values.length > 0
          ? <ul className="mt-3 space-y-2 text-sm leading-relaxed">{section.values.map((item) => <li key={item} className="rounded-xl bg-muted/50 px-3 py-2">{item}</li>)}</ul>
          : <p className="mt-3 rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground">À préciser dans la conversation.</p>}
      </article>)}

      <section className="rounded-2xl border bg-muted/40 p-4" aria-labelledby="protocol-preview-open-points">
        <h3 id="protocol-preview-open-points" className="font-semibold">Points restant à préciser</h3>
        {openPoints.length > 0
          ? <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{openPoints.map((title) => <li key={title}>{title}</li>)}</ul>
          : <p className="mt-2 text-sm text-muted-foreground">Aucun point général supplémentaire n’est signalé dans cet aperçu.</p>}
      </section>
    </div>
  </section>;
}
