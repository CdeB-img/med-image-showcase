import { ArrowLeft, CircleAlert } from "lucide-react";
import type { DocumentProjection } from "@/features/document-projection";

const SECTION_STATUS: Record<string, string> = {
  GENERATABLE: "Disponible",
  PARTIALLY_GENERATABLE: "Partiellement défini",
  NOT_GENERATABLE: "À compléter",
  BLOCKED: "Bloqué",
  NOT_APPLICABLE: "Non applicable",
  UNKNOWN: "À préciser",
  FUTURE: "Dépendance future",
};

const ENGINE_LANGUAGE: Record<string, string> = {
  APPLICABLE: "applicable",
  REQUIRED_BUT_NOT_READY: "à préciser avec l’expertise Imaging",
  SPECIALIZED_ENGINE_REQUIRED: "expertise spécialisée nécessaire",
  NOT_EVALUATED_BY_SPECIALIZED_ENGINE: "non évalué par l’expertise spécialisée",
  NO_STATISTICAL_VALUE_INVENTED: "aucune valeur statistique n’a été inventée",
  FROZEN_BY_HUMAN: "version utilisée après confirmation humaine",
  AUTHORIZED: "autorisé par le chercheur",
  NO_LLM_SCIENTIFIC_DECISION: "aucune décision scientifique prise par l’IA",
  IMAGING: "imagerie",
  EXPOSURE: "intervention",
  COMPARISON: "comparaison",
};

const userLanguage = (value: string) => value
  .replace(/Version source gelée/gi, "Version source utilisée")
  .replace(/MeasurementDefinitions/gi, "définitions de mesure")
  .replace(/ObservableProperties/gi, "propriétés observées")
  .replace(/BiomarkerRoles/gi, "rôles des biomarqueurs")
  .replace(/\b[A-Z][A-Z0-9_]{2,}\b/g, (token) => ENGINE_LANGUAGE[token] ?? token.toLocaleLowerCase("fr-FR").replace(/_/g, " "));

const hiddenTechnicalItem = (value: string) => /Projet source|Version source|Digest source|Moteur propriétaire source|Politique source|^Confirmé — Source :/i.test(value);

type Props = {
  projection: DocumentProjection;
  stale: boolean;
  onClose: () => void;
};

export default function ProtocolPreview({ projection, stale, onClose }: Props) {
  const sections = projection.sections.filter((section) => section.sectionId !== "provenance-version");
  const incomplete = sections.filter((section) => !["GENERATABLE", "NOT_APPLICABLE"].includes(section.status) || section.unknowns.length || section.contradictions.length);
  const sourceVersion = projection.source.projectVersion.match(/:version:(\d+)$/)?.[1] ?? projection.source.projectVersion;
  return <section className="min-h-[calc(100vh-7.5rem)] rounded-3xl border bg-background shadow-sm" aria-label="Aperçu du protocole" data-testid="functional-protocol-preview">
    <header className="sticky top-0 z-10 rounded-t-3xl border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" />Retour à la conversation
      </button>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-primary">Protocole — version de travail</p>
      <h2 className="mt-1 text-2xl font-semibold">Protocole</h2>
      <p className="mt-2 text-sm text-muted-foreground">Aperçu produit à partir du Research Project version {sourceVersion}.</p>
      {stale && <div role="status" className="mt-4 flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Le projet a changé depuis cette version du protocole. Son contenu reste consultable, mais il n’est plus présenté comme courant.</p>
      </div>}
    </header>

    <div className="space-y-5 p-5 sm:p-6">
      <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Cette projection est en lecture seule.</p>
        <p className="mt-1 text-muted-foreground">Elle reflète les informations confirmées du Project, conserve les inconnues et ne constitue ni un protocole final ni une validation scientifique ou réglementaire.</p>
      </div>

      {sections.map((section) => {
        const blocks = section.blocks.map((block) => ({ ...block, items: block.items.filter((item) => !hiddenTechnicalItem(item)) })).filter((block) => block.items.length);
        return <article key={section.sectionId} className="rounded-2xl border p-4 sm:p-5" aria-labelledby={`protocol-preview-${section.sectionId}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 id={`protocol-preview-${section.sectionId}`} className="text-lg font-semibold">{section.title}</h3>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{SECTION_STATUS[section.status] ?? "À préciser"}</span>
          </div>
          {blocks.map((block) => <div key={block.blockId} className="mt-4">
            {block.label && <p className="text-sm font-medium">{userLanguage(block.label)}</p>}
            <ul className="mt-2 space-y-2 text-sm leading-relaxed">
              {block.items.map((item) => <li key={item} className="rounded-xl bg-muted/50 px-3 py-2">{userLanguage(item)}</li>)}
            </ul>
          </div>)}
          {section.unknowns.length > 0 && <div className="mt-4 rounded-xl border border-dashed p-3">
            <p className="text-sm font-medium">À préciser</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{section.unknowns.slice(0, 6).map((item) => <li key={item}>{userLanguage(item)}</li>)}</ul>
          </div>}
          {section.limitations.length > 0 && <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium">Limites de cette section</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{section.limitations.slice(0, 6).map((item) => <li key={item}>{userLanguage(item)}</li>)}</ul>
          </details>}
        </article>;
      })}

      {incomplete.length > 0 && <section className="rounded-2xl border bg-muted/40 p-4" aria-labelledby="protocol-preview-incomplete">
        <h3 id="protocol-preview-incomplete" className="font-semibold">Sections encore à compléter</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{incomplete.map((section) => <li key={section.sectionId}>{section.title}</li>)}</ul>
      </section>}
    </div>
  </section>;
}
