import type { FunctionalResetDocumentPortfolio } from "@/features/document-projection";
import {
  emptyResearchProjectSections,
  researchProjectQuestionPresentation,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

type Props = {
  project: ResearchProjectOwnerProjection | null;
  documents: FunctionalResetDocumentPortfolio;
  mode: "STANDARD" | "EXPERT";
  onOpenProtocol: (projectionId: string) => void;
  onRequestProtocol: () => void;
};

const projectVersionLabel = (versionId: string) => versionId.match(/:version:(\d+)$/)?.[1] ?? versionId;

export default function ResearchProjectPanel({ project, documents, mode, onOpenProtocol, onRequestProtocol }: Props) {
  const sections = project?.sections ?? emptyResearchProjectSections();
  const standardQuestion = project ? researchProjectQuestionPresentation(sections) : null;
  const questionSection = sections.find((section) => section.sectionId === "QUESTION")!;
  const detailSections = sections.filter((section) => section.sectionId !== "QUESTION");
  const definedSectionCount = sections.filter((section) => section.elements.length > 0).length;
  const openSectionCount = sections.length - definedSectionCount;
  const confirmedChanges = project?.appliedChangeSet?.changes.filter((change) => change.operation !== "NO_CHANGE") ?? [];
  const protocol = documents.cards.find((document) => document.kind === "PROTOCOL");
  const historicalProtocols = documents.projections.filter((projection) => projection.projectionType === "PROTOCOL"
    && projection.projectionId !== protocol?.projectionId);
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

  const renderSection = (section: (typeof sections)[number]) => {
    const questionDetails = section.sectionId === "QUESTION"
      ? section.elements.filter((element) => /OBJECTIVE/i.test(element.sourceProposedType ?? ""))
      : [];
    return <section key={section.sectionId} className="rounded-2xl border px-4 py-3" aria-labelledby={`functional-project-${section.sectionId.toLocaleLowerCase("fr-FR")}`}>
      <h3 id={`functional-project-${section.sectionId.toLocaleLowerCase("fr-FR")}`} className="text-sm font-semibold">{section.label}</h3>
      {(section.sectionId === "QUESTION" && standardQuestion) || section.elements.length > 0
        ? <ul className="mt-2 space-y-1.5 text-sm">
          {section.sectionId === "QUESTION" && standardQuestion
            ? <li className="break-words leading-relaxed">{standardQuestion}</li>
            : null}
          {section.sectionId === "QUESTION"
            ? questionDetails.map((element) => <li key={element.elementId} className="break-words leading-relaxed"><span className="font-medium">Objectif :</span> {element.content}</li>)
            : section.elements.map((element) => <li key={element.elementId} className="break-words leading-relaxed">{element.content}</li>)}
        </ul>
        : <p className="mt-2 text-sm text-muted-foreground">À préciser dans la conversation.</p>}
    </section>;
  };

  return <aside aria-label="Research Project" className="rounded-3xl border bg-card shadow-sm" data-testid="functional-research-project" data-projection-mode={mode}>
    <div className="border-b px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Research Project</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Mon projet</h2>
        {project && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Version {project.revision}</span>}
      </div>
    </div>

    <div className="space-y-3 p-4">
      {mode === "EXPERT" ? sections.map(renderSection) : <>
        <section className="rounded-2xl border bg-muted/35 px-4 py-3" aria-labelledby="functional-project-summary">
          <h3 id="functional-project-summary" className="text-sm font-semibold">État du projet</h3>
          {project ? <div className="mt-2 space-y-1 text-sm">
            <p className="font-medium text-primary">Dernière version confirmée par vous</p>
            <p>{definedSectionCount} rubrique{definedSectionCount > 1 ? "s" : ""} avec des éléments confirmés.</p>
            <p className="text-muted-foreground">{openSectionCount} rubrique{openSectionCount > 1 ? "s" : ""} reste{openSectionCount > 1 ? "nt" : ""} à préciser.</p>
            {confirmedChanges.length > 0 && <p className="text-muted-foreground">{confirmedChanges.length} changement{confirmedChanges.length > 1 ? "s" : ""} confirmé{confirmedChanges.length > 1 ? "s" : ""} dans cette version.</p>}
          </div> : <p className="mt-2 text-sm text-muted-foreground">Aucun élément n’est encore confirmé. La conversation fera apparaître ici les informations que vous aurez validées.</p>}
          {confirmedChanges.length > 0 && <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">Voir les derniers changements confirmés</summary>
            <ul className="mt-2 space-y-1.5 text-muted-foreground">{confirmedChanges.map((change) => <li key={change.changeId}>{change.presentation}</li>)}</ul>
          </details>}
        </section>
        {renderSection(questionSection)}
        <details className="rounded-2xl border px-4 py-3" data-testid="standard-project-details">
          <summary className="cursor-pointer text-sm font-semibold">Voir toutes les rubriques du projet</summary>
          <div className="mt-3 space-y-3">{detailSections.map(renderSection)}</div>
        </details>
      </>}

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
              </div>
            </div>}
            {historicalProtocols.length > 0 && <details className="mt-3 text-xs" data-testid="protocol-history-disclosure">
              <summary className="cursor-pointer font-medium">Versions précédentes ({historicalProtocols.length})</summary>
              <ul className="mt-2 space-y-2">{historicalProtocols.map((projection) => <li key={projection.projectionId} className="rounded-lg border bg-background p-2.5">
                <p>Protocole issu du projet version {projectVersionLabel(projection.source.projectVersion)} · version historique</p>
                <button type="button" onClick={() => onOpenProtocol(projection.projectionId)} className="mt-2 min-h-10 rounded-lg border px-3 font-medium">Ouvrir cette version historique</button>
              </li>)}</ul>
            </details>}
          </article>
        </div>}
      </section>
    </div>
  </aside>;
}
