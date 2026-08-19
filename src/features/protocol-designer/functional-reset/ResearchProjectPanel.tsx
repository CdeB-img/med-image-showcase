import type { DocumentProjection } from "@/features/document-projection";
import {
  emptyResearchProjectSections,
  type ResearchProjectOwnerProjection,
  type ResearchProjectSectionState,
} from "@/features/research-project-construction";

const STATE_LABEL: Record<ResearchProjectSectionState, string> = {
  DEFINED: "Défini",
  PARTIAL: "Partiel",
  TO_CLARIFY: "À préciser",
};

type DocumentCard = {
  id: string;
  label: "Protocole" | "DMP" | "SAP";
  state: string;
  explanation: string;
};

const cardFromProjection = (
  type: "PROTOCOL" | "DMP" | "SAP",
  label: DocumentCard["label"],
  projections: readonly DocumentProjection[],
  project: ResearchProjectOwnerProjection | null,
): DocumentCard => {
  const projection = [...projections].reverse().find((item) => item.projectionType === type);
  if (!projection) return {
    id: `document:${type.toLocaleLowerCase("fr-FR")}`,
    label,
    state: type === "PROTOCOL" ? "Pas encore générable" : type === "DMP" ? "Informations insuffisantes" : "Analyse non définie",
    explanation: "Aucune projection TMP/DOC active n’établit une disponibilité.",
  };
  const stale = !project
    || projection.source.projectDigest !== project.projectDigest
    || projection.source.projectVersion !== project.versionId;
  return {
    id: projection.projectionId,
    label,
    state: stale ? "À actualiser" : projection.readiness === "READY_FOR_REVIEW" ? "Disponible pour revue" : "Partiellement générable",
    explanation: stale
      ? "La projection TMP/DOC appartient à une version antérieure du Project."
      : projection.sections.flatMap((section) => section.statusReasons).at(0) ?? "État fourni par la projection TMP/DOC active.",
  };
};

type Props = {
  project: ResearchProjectOwnerProjection | null;
};

export default function ResearchProjectPanel({ project }: Props) {
  const sections = project?.sections ?? emptyResearchProjectSections();
  const projections = project?.documentProjections ?? [];
  const documents = [
    cardFromProjection("PROTOCOL", "Protocole", projections, project),
    cardFromProjection("DMP", "DMP", projections, project),
    cardFromProjection("SAP", "SAP", projections, project),
  ];

  return <aside aria-label="Research Project" className="rounded-3xl border bg-card shadow-sm" data-testid="functional-research-project">
    <div className="border-b px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Research Project</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Mon projet</h2>
        {project && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Version {project.revision}</span>}
      </div>
    </div>

    <div className="space-y-3 p-4">
      {sections.map((section) => <section key={section.sectionId} className="rounded-2xl border px-4 py-3" aria-labelledby={`functional-project-${section.sectionId.toLocaleLowerCase("fr-FR")}`}>
        <div className="flex items-start justify-between gap-3">
          <h3 id={`functional-project-${section.sectionId.toLocaleLowerCase("fr-FR")}`} className="text-sm font-semibold">{section.label}</h3>
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{STATE_LABEL[section.state]}</span>
        </div>
        {section.elements.length > 0
          ? <ul className="mt-2 space-y-1.5 text-sm">{section.elements.map((element) => <li key={element.elementId} className="break-words leading-relaxed">{element.content}</li>)}</ul>
          : <p className="mt-2 text-sm text-muted-foreground">Aucune information confirmée.</p>}
      </section>)}

      <section className="rounded-2xl border px-4 py-3" aria-labelledby="functional-project-documents">
        <h3 id="functional-project-documents" className="text-sm font-semibold">Documents</h3>
        <div className="mt-3 space-y-2.5">
          {documents.map((document) => <article key={document.id} className="rounded-xl bg-muted/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{document.label}</p>
              <span className="text-right text-xs font-medium text-muted-foreground">{document.state}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{document.explanation}</p>
          </article>)}
        </div>
      </section>
    </div>
  </aside>;
}
