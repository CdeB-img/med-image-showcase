import type { FunctionalResetDocumentPortfolio, StudyDeliverablePortfolio } from "@/features/document-projection";
import type { FunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  emptyResearchProjectSections,
  ensureCanonicalProjectState,
  presentCanonicalTemporalAnchor,
  researchProjectQuestionPresentation,
  type CanonicalProjectObjectVersion,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

type Props = {
  project: ResearchProjectOwnerProjection | null;
  documents: FunctionalResetDocumentPortfolio;
  mode: "STANDARD" | "EXPERT";
  onOpenProtocol: (projectionId: string) => void;
  onRequestProtocol: () => void;
  deliverablePortfolio?: StudyDeliverablePortfolio | null;
  onOpenDeliverables?: () => void;
  queryNavigation?: FunctionalResetQueryNavigation | null;
};

const projectVersionLabel = (versionId: string) => versionId.match(/:version:(\d+)$/)?.[1] ?? versionId;

type PermanentProjectGroup = {
  id: string;
  label: string;
  sectionIds: string[];
  includes: (object: CanonicalProjectObjectVersion) => boolean;
};

const CURRENT_PROJECT_GROUPS: readonly PermanentProjectGroup[] = [
  { id: "scientific-question", label: "Question scientifique", sectionIds: ["QUESTION"], includes: (object) => ["SCIENTIFIC_QUESTION", "SCIENTIFIC_MODEL"].includes(object.objectType) },
  { id: "objectives", label: "Objectifs", sectionIds: ["QUESTION"], includes: (object) => object.objectType === "OBJECTIVE" },
  { id: "hypotheses", label: "Hypothèses", sectionIds: ["QUESTION"], includes: (object) => object.objectType === "HYPOTHESIS" },
  { id: "population", label: "Population", sectionIds: ["POPULATION"], includes: (object) => ["CONDITION", "POPULATION", "ELIGIBILITY_CRITERION"].includes(object.objectType) },
  { id: "design", label: "Design", sectionIds: ["DESIGN"], includes: (object) => object.objectType === "STUDY_DESIGN" },
  { id: "intervention", label: "Intervention / exposition", sectionIds: ["INTERVENTION"], includes: (object) => object.objectType === "INTERVENTION_OR_EXPOSURE" || (object.objectType === "GROUP" && object.sectionId === "INTERVENTION") },
  { id: "comparator", label: "Comparateur", sectionIds: ["COMPARATOR"], includes: (object) => object.objectType === "GROUP" && object.sectionId === "COMPARATOR" },
  { id: "endpoints", label: "Critères / endpoints", sectionIds: ["MEASUREMENTS"], includes: (object) => object.objectType === "ENDPOINT" },
  { id: "imaging-methods", label: "Imagerie / méthodes / mesures", sectionIds: ["IMAGING", "MEASUREMENTS"], includes: (object) => ["IMAGING_MODALITY", "ACQUISITION", "CANONICAL_VARIABLE"].includes(object.objectType) && object.scientificRole !== "SAMPLE_COLLECTION" },
  { id: "biospecimens", label: "Prélèvements / échantillons", sectionIds: ["BIOSPECIMENS"], includes: (object) => object.scientificRole === "SAMPLE_COLLECTION" },
  { id: "temporality", label: "Temporalité / visites", sectionIds: ["TEMPORALITY"], includes: (object) => object.objectType === "VISIT" },
  { id: "data-variables", label: "Données / variables", sectionIds: ["MEASUREMENTS"], includes: (object) => object.objectType === "DATA_NEED" },
  { id: "analyses", label: "Analyses", sectionIds: ["ANALYSIS"], includes: (object) => object.objectType === "ANALYSIS_SPECIFICATION" },
  { id: "constraints", label: "Contraintes / faisabilité", sectionIds: [], includes: (object) => ["CONSTRAINT", "UNCERTAINTY", "CONTRADICTION", "PROJECT_INFORMATION"].includes(object.objectType) },
] as const;

const roleLabel = (role: string | null) => {
  const normalized = role?.toLocaleUpperCase("en-US") ?? "";
  if (normalized.includes("PRIMARY") || normalized.includes("PRINCIPAL")) return "Principal";
  if (normalized.includes("SECONDARY") || normalized.includes("SECONDAIRE")) return "Secondaire";
  if (normalized.includes("EXPLORATORY") || normalized.includes("EXPLORATOIRE")) return "Exploratoire";
  return null;
};

export default function ResearchProjectPanel({
  project,
  documents,
  mode,
  onOpenProtocol,
  onRequestProtocol,
  deliverablePortfolio,
  onOpenDeliverables,
  queryNavigation,
}: Props) {
  const sections = project?.sections ?? emptyResearchProjectSections();
  const canonicalProject = project ? ensureCanonicalProjectState(project) : null;
  const currentObjects = canonicalProject?.objects.filter((object) => object.actuality === "CURRENT") ?? [];
  const objectLabels = new Map(currentObjects.map((object) => [object.objectId, object.content]));
  const standardQuestion = project ? researchProjectQuestionPresentation(sections) : null;
  const definedSectionCount = sections.filter((section) => section.elements.length > 0).length;
  const openSectionCount = sections.length - definedSectionCount;
  const confirmedChanges = project?.appliedChangeSet?.changes.filter((change) => change.operation !== "NO_CHANGE") ?? [];
  const protocol = documents.cards.find((document) => document.kind === "PROTOCOL");
  const historicalProtocols = documents.projections.filter((projection) => projection.projectionType === "PROTOCOL"
    && projection.projectionId !== protocol?.projectionId);
  const protocolState = protocol?.stateLabel ?? "Projet à confirmer";
  const protocolExplanation = protocol?.explanation ?? "Aucun livrable généré.";
  const applicableQueryNavigation = project && queryNavigation
    && queryNavigation.projectRef === project.projectId
    && queryNavigation.projectVersion === project.versionId
    && queryNavigation.projectDigest === project.projectDigest
    ? queryNavigation : null;
  const openNeedSections = new Set<string>(Object.values(applicableQueryNavigation?.needSections ?? {}));
  const progressFor = (group: PermanentProjectGroup) => {
    const objects = currentObjects.filter(group.includes);
    const hasOpenNeed = group.sectionIds.some((sectionId) => openNeedSections.has(sectionId));
    const sectionStates = group.sectionIds
      .map((sectionId) => sections.find((section) => section.sectionId === sectionId)?.state)
      .filter((state): state is NonNullable<typeof state> => Boolean(state));
    const hasUnresolved = objects.some((object) => ["UNKNOWN", "WITHHELD"].includes(object.epistemicState));
    const hasResolved = objects.some((object) => !["UNKNOWN", "WITHHELD"].includes(object.epistemicState));
    const applicable = objects.length > 0 || hasOpenNeed;
    if (!applicable) return { applicable: false, value: 0, explanation: "Aucun élément adopté pertinent." };
    if (!hasResolved) return { applicable: true, value: objects.length ? 25 : 0, explanation: objects.length ? "Premiers éléments adoptés ; décisions encore ouvertes." : "À définir." };
    if (hasUnresolved || hasOpenNeed || sectionStates.includes("TO_CLARIFY")) return { applicable: true, value: 50, explanation: "Structure présente ; décisions matérielles ouvertes." };
    if (sectionStates.includes("PARTIAL")) return { applicable: true, value: 75, explanation: "Structure largement renseignée ; compléments encore attendus." };
    return { applicable: true, value: 100, explanation: "Aucune décision matérielle ouverte actuellement identifiée." };
  };
  const groupProgress = new Map(CURRENT_PROJECT_GROUPS.map((group) => [group.id, progressFor(group)]));
  const applicableProgress = [...groupProgress.values()].filter((progress) => progress.applicable);
  const globalProgress = project && applicableProgress.length
    ? Math.round((applicableProgress.reduce((sum, progress) => sum + progress.value, 0) / applicableProgress.length) / 5) * 5
    : 0;
  const confirmedDecisionCount = currentObjects.filter((object) => !["UNKNOWN", "WITHHELD"].includes(object.epistemicState)).length;
  const openMaterialPointCount = new Set(applicableQueryNavigation?.selection.candidates
    .filter((candidate) => candidate.eligibility === "ELIGIBLE")
    .flatMap((candidate) => candidate.navigationNeedRefs) ?? []).size;
  const nextUsefulDecision = applicableQueryNavigation?.standardQuestion?.priorityLead ?? null;

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

  const renderPermanentGroup = (group: PermanentProjectGroup) => {
    const groupObjects = currentObjects.filter(group.includes);
    const objectIds = new Set(groupObjects.map((object) => object.objectId));
    const endpointTimings = group.id === "endpoints" && canonicalProject
      ? canonicalProject.temporalQualifications.filter((qualification) => qualification.actuality === "CURRENT" && objectIds.has(qualification.subjectProjectRef))
      : [];
    const otherTimings = group.id === "temporality" && canonicalProject
      ? [
        ...canonicalProject.temporalQualifications.filter((qualification) => qualification.actuality === "CURRENT" && !currentObjects.some((object) => object.objectId === qualification.subjectProjectRef && object.objectType === "ENDPOINT")),
        ...canonicalProject.expectedVariableOccasions.filter((occasion) => occasion.actuality === "CURRENT"),
      ]
      : [];
    const legacyTimings = group.id === "temporality" && canonicalProject
      ? canonicalProject.legacyTemporalObjects.map((entry) => entry.legacyObject).filter((object) => object.actuality === "CURRENT")
      : [];
    const hasContent = groupObjects.length > 0 || endpointTimings.length > 0 || otherTimings.length > 0 || legacyTimings.length > 0;
    return <section key={group.id} className="rounded-2xl border px-4 py-3" aria-labelledby={`functional-project-group-${group.id}`} data-testid={`project-group-${group.id}`}>
      <h3 id={`functional-project-group-${group.id}`} className="text-sm font-semibold">{group.label}</h3>
      {hasContent ? <ul className="mt-2 space-y-1.5 text-sm">
        {groupObjects.map((object) => {
          const role = roleLabel(object.scientificRole);
          return <li key={object.objectVersionId} className="break-words leading-relaxed">
            {role && <span className="mr-1 font-medium">{role} :</span>}{object.content}
          </li>;
        })}
        {endpointTimings.map((qualification) => <li key={qualification.qualificationVersionId} className="break-words pl-3 text-xs leading-relaxed text-muted-foreground">
          {objectLabels.get(qualification.subjectProjectRef)} — {presentCanonicalTemporalAnchor(qualification.anchor, objectLabels)}
        </li>)}
        {otherTimings.map((timing) => <li key={"qualificationVersionId" in timing ? timing.qualificationVersionId : timing.occasionVersionId} className="break-words leading-relaxed">
          {presentCanonicalTemporalAnchor(timing.anchor, objectLabels)}
        </li>)}
        {legacyTimings.map((timing) => <li key={timing.objectVersionId} className="break-words leading-relaxed">{timing.content}</li>)}
      </ul> : <p className="mt-2 text-sm text-muted-foreground">À définir</p>}
    </section>;
  };

  return <aside aria-label="Research Project" className="rounded-3xl border bg-card shadow-sm" data-testid="functional-research-project" data-projection-mode={mode}>
    <div className="border-b px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Research Project</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Mon projet</h2>
        {project && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Version {project.revision}</span>}
      </div>
      <div className="mt-4 rounded-2xl border bg-muted/35 p-3" data-testid="project-cockpit">
        <div data-testid="project-global-progress">
          <div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">Avancement indicatif</span><span className="tabular-nums">{globalProgress} %</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-label={`Avancement indicatif du Research Project : ${globalProgress} %`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={globalProgress}>
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${globalProgress}%` }} />
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Complétude approximative des décisions actuellement nécessaires — pas une mesure de qualité scientifique.</p>
        <p className="mt-3 text-xs font-medium" data-testid="project-cockpit-counts">{confirmedDecisionCount} décision{confirmedDecisionCount > 1 ? "s" : ""} confirmée{confirmedDecisionCount > 1 ? "s" : ""} · {openMaterialPointCount} point{openMaterialPointCount > 1 ? "s" : ""} matériel{openMaterialPointCount > 1 ? "s" : ""} ouvert{openMaterialPointCount > 1 ? "s" : ""}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5" data-testid="project-section-progress">
          {CURRENT_PROJECT_GROUPS.map((group) => <div key={group.id} className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
            <span className="truncate text-muted-foreground">{group.label}</span>
            <span className="shrink-0 tabular-nums">{groupProgress.get(group.id)!.value} %</span>
          </div>)}
        </div>
        {nextUsefulDecision && <div className="mt-3 border-t pt-3 text-xs" data-testid="project-next-useful-decision">
          <p className="font-medium">Prochaine décision utile</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{nextUsefulDecision}</p>
        </div>}
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
        {CURRENT_PROJECT_GROUPS.map(renderPermanentGroup)}
      </>}

      <section className="rounded-2xl border px-4 py-3" aria-labelledby="functional-project-documents">
        <h3 id="functional-project-documents" className="text-sm font-semibold"><span>Documents</span><span> / Livrables de l’étude</span></h3>
        {deliverablePortfolio && onOpenDeliverables && <div className="mt-3">
          <ul className="space-y-1.5 text-xs text-muted-foreground" data-testid="study-deliverable-summary">
            {deliverablePortfolio.artifacts.map((item) => <li key={item.artifactId} className="flex items-start justify-between gap-3">
              <span>{item.name}</span><span className="shrink-0 font-medium">{item.status}</span>
            </li>)}
          </ul>
          <button type="button" onClick={onOpenDeliverables} className="mt-3 min-h-10 w-full rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground">
            Ouvrir les livrables de l’étude
          </button>
        </div>}
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
