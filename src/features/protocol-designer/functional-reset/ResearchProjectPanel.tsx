import type { FunctionalResetDocumentPortfolio } from "@/features/document-projection";
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

type Props = {
  project: ResearchProjectOwnerProjection | null;
  documents: FunctionalResetDocumentPortfolio;
  onOpenProtocol: (projectionId: string) => void;
  onRequestProtocol: () => void;
  onDeferProtocol: () => void;
};

export default function ResearchProjectPanel({ project, documents, onOpenProtocol, onRequestProtocol, onDeferProtocol }: Props) {
  const sections = project?.sections ?? emptyResearchProjectSections();

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
          {documents.cards.map((document) => <article key={document.kind} className="rounded-xl bg-muted/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{document.label}</p>
              <span className="text-right text-xs font-medium text-muted-foreground">{document.stateLabel}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{document.explanation}</p>
            {document.blockerGroups.length > 0 && <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium">Éléments encore ouverts</summary>
              <div className="mt-2 space-y-2">
                {document.blockerGroups.map((group) => <div key={group.dimension}>
                  <p className="font-medium">{group.dimension}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>)}
              </div>
            </details>}
            {document.canOpen && document.projectionId && <button type="button" onClick={() => onOpenProtocol(document.projectionId!)} className="mt-3 min-h-10 rounded-lg border bg-background px-3 text-xs font-medium">Ouvrir</button>}
            {document.canRequestProjection && project && <div className="mt-3 rounded-lg border bg-background p-2.5">
              <p className="text-xs leading-relaxed">{document.freshness === "STALE"
                ? "Souhaites-tu actualiser le protocole depuis cette version du projet ?"
                : "Souhaites-tu utiliser cette version du projet pour produire une version de travail du protocole ?"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={onRequestProtocol} className="min-h-10 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground">{document.freshness === "STALE" ? "Actualiser" : "Oui, créer l’aperçu"}</button>
                <button type="button" onClick={onDeferProtocol} className="min-h-10 rounded-lg border px-3 text-xs font-medium">Pas encore</button>
              </div>
            </div>}
          </article>)}
        </div>
      </section>
    </div>
  </aside>;
}
