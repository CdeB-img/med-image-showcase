import type { FunctionalResetDocumentPortfolio } from "@/features/document-projection";
import {
  emptyResearchProjectSections,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

type Props = {
  project: ResearchProjectOwnerProjection | null;
  documents: FunctionalResetDocumentPortfolio;
  onOpenProtocol: (projectionId: string) => void;
  onRequestProtocol: () => void;
  onDeferProtocol: () => void;
};

export default function ResearchProjectPanel({ project, documents, onOpenProtocol, onRequestProtocol, onDeferProtocol }: Props) {
  const sections = project?.sections ?? emptyResearchProjectSections();
  const protocol = documents.cards.find((document) => document.kind === "PROTOCOL");
  const protocolState = protocol?.canOpen && protocol.freshness === "CURRENT"
    ? "Aperçu disponible"
    : protocol?.freshness === "STALE"
      ? "Aperçu à actualiser"
      : "Construction en cours";
  const protocolExplanation = protocol?.canOpen && protocol.freshness === "CURRENT"
    ? "Cette version de travail reflète le projet actuel."
    : protocol?.freshness === "STALE"
      ? "Le projet a évolué depuis le dernier aperçu."
      : "Le protocole progressera à partir des éléments confirmés dans la conversation.";

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
        <h3 id={`functional-project-${section.sectionId.toLocaleLowerCase("fr-FR")}`} className="text-sm font-semibold">{section.label}</h3>
        {section.elements.length > 0
          ? <ul className="mt-2 space-y-1.5 text-sm">{section.elements.map((element) => <li key={element.elementId} className="break-words leading-relaxed">{element.content}</li>)}</ul>
          : <p className="mt-2 text-sm text-muted-foreground">À préciser dans la conversation.</p>}
      </section>)}

      <section className="rounded-2xl border px-4 py-3" aria-labelledby="functional-project-documents">
        <h3 id="functional-project-documents" className="text-sm font-semibold">Documents</h3>
        {protocol && <div className="mt-3 space-y-2.5">
          <article className="rounded-xl bg-muted/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">Protocole</p>
              <span className="text-right text-xs font-medium text-muted-foreground">{protocolState}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{protocolExplanation}</p>
            {protocol.blockerGroups.length > 0 && <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-medium">Points restant à préciser</summary>
              <div className="mt-2 space-y-2">
                {protocol.blockerGroups.map((group) => <div key={group.dimension}>
                  <p className="font-medium">{group.dimension}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>)}
              </div>
            </details>}
            {protocol.canOpen && protocol.projectionId && <button type="button" onClick={() => onOpenProtocol(protocol.projectionId!)} className="mt-3 min-h-10 rounded-lg border bg-background px-3 text-xs font-medium">Ouvrir l’aperçu</button>}
            {protocol.canRequestProjection && project && <div className="mt-3 rounded-lg border bg-background p-2.5">
              <p className="text-xs leading-relaxed">{protocol.freshness === "STALE"
                ? "Le projet a changé. Souhaitez-vous mettre à jour le protocole de travail ?"
                : "Souhaitez-vous créer un premier aperçu du protocole de travail ?"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={onRequestProtocol} className="min-h-10 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground">{protocol.freshness === "STALE" ? "Actualiser l’aperçu" : "Créer l’aperçu"}</button>
                <button type="button" onClick={onDeferProtocol} className="min-h-10 rounded-lg border px-3 text-xs font-medium">Continuer le projet</button>
              </div>
            </div>}
          </article>
        </div>}
      </section>
    </div>
  </aside>;
}
