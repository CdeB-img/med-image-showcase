import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation/contracts";
import type { ResearchProjectDesignResult } from "@/features/research-project-construction/types";
import type { DocumentProjection } from "@/features/document-projection";
import { buildConversationalSemanticHandoff } from "./ConversationalHandoffRouter";

export type ProjectPanelSectionState = "CONFIRMED" | "TO_CLARIFY" | "IN_CONSTRUCTION" | "MENTIONED" | "NOT_APPLICABLE";
export type ProjectPanelDocumentSourceState = "NOT_GENERATABLE" | "PARTIALLY_GENERATABLE" | "GENERATABLE" | "STALE" | "NOT_APPLICABLE";

export type ProjectPanelSection = {
  sectionId: "QUESTION" | "HYPOTHESES" | "POPULATION" | "DESIGN" | "IMAGING" | "MEASUREMENTS" | "ANALYSIS";
  label: string;
  state: ProjectPanelSectionState;
  items: string[];
};

export type ProjectPanelDocument = {
  documentId: string;
  label: string;
  owner: "DOC-001" | "TMP-001";
  sourceState: ProjectPanelDocumentSourceState;
  explanation: string;
};

export type ProjectPanelProjection = {
  projectRef: string | null;
  projectVersion: string | null;
  projectDigest: string | null;
  sections: ProjectPanelSection[];
  documents: ProjectPanelDocument[];
  sourceOfTruth: false;
  projectWriteAuthorized: false;
};

const SECTION_STATE_LABEL: Record<ProjectPanelSectionState, string> = {
  CONFIRMED: "Confirmé",
  TO_CLARIFY: "À préciser",
  IN_CONSTRUCTION: "En construction",
  MENTIONED: "Mentionné",
  NOT_APPLICABLE: "Non applicable",
};

const DOCUMENT_STATE_LABEL: Record<ProjectPanelDocumentSourceState, string> = {
  NOT_GENERATABLE: "Pas encore générable",
  PARTIALLY_GENERATABLE: "Aperçu partiel disponible",
  GENERATABLE: "Aperçu disponible",
  STALE: "À actualiser après modification du projet",
  NOT_APPLICABLE: "Non applicable",
};

const emptyDocuments = (): ProjectPanelDocument[] => [
  { documentId: "document:protocol", label: "Protocole", owner: "DOC-001", sourceState: "NOT_GENERATABLE", explanation: "Le Research Project doit d’abord être suffisamment structuré." },
  { documentId: "document:dmp", label: "DMP", owner: "DOC-001", sourceState: "NOT_GENERATABLE", explanation: "Les variables, sources et responsabilités de données restent à préciser." },
  { documentId: "document:sap", label: "SAP", owner: "DOC-001", sourceState: "NOT_GENERATABLE", explanation: "La population d’analyse et le critère principal restent à préciser." },
];

const documentStateFrom = (
  projectionType: "PROTOCOL" | "DMP" | "SAP",
  label: string,
  project: Readonly<ResearchProjectDesignResult>,
  projections: readonly DocumentProjection[],
): ProjectPanelDocument => {
  const current = [...projections].reverse().find((item) => item.projectionType === projectionType);
  if (!current) return {
    documentId: `document:${projectionType.toLocaleLowerCase("fr-FR")}`,
    label,
    owner: "DOC-001",
    sourceState: "NOT_GENERATABLE",
    explanation: projectionType === "PROTOCOL"
      ? "Aucune projection Protocol courante n’a encore été produite par DOC-001."
      : `Aucune projection ${label} courante n’est disponible dans les états TMP/DOC de cette session.`,
  };
  const stale = current.source.projectDigest !== project.resultDigest || current.source.projectVersion !== project.candidateVersion.versionId;
  const sourceState: ProjectPanelDocumentSourceState = stale
    ? "STALE"
    : current.readiness === "READY_FOR_REVIEW"
      ? "GENERATABLE"
      : "PARTIALLY_GENERATABLE";
  return {
    documentId: current.projectionId,
    label,
    owner: current.ownership.structure === "TMP-001" ? "TMP-001" : "DOC-001",
    sourceState,
    explanation: stale
      ? "La projection DOC/TMP provient d’une version antérieure du Research Project."
      : current.sections.flatMap((section) => section.statusReasons).at(0)
        ?? "État dérivé de la projection DOC/TMP courante.",
  };
};

// eslint-disable-next-line react-refresh/only-export-components -- pure projection builder shared by the owner shell and contract tests
export const buildResearchProjectPanelProjection = (
  project: Readonly<ResearchProjectDesignResult>,
  documentProjections: readonly DocumentProjection[] = [],
): ProjectPanelProjection => {
  const selectedDesign = project.selectedStudyDesignCandidate
    ? project.studyDesignCandidates.find((item) => item.designId === project.selectedStudyDesignCandidate?.designId)
    : null;
  const populationItems = [
    ...project.populationDesign.populationConcept.conditionOrPathology,
    ...project.populationDesign.populationConcept.exposureOrIntervention,
    ...project.populationDesign.populationConcept.relevantSubpopulations.map((item) => item.label),
  ];
  const imagingItems = project.imagingContribution.applicability === "NOT_APPLICABLE"
    ? []
    : [...project.imagingContribution.variableIds, ...project.imagingContribution.requiredFutureReviews];
  return {
    projectRef: project.resultId,
    projectVersion: project.candidateVersion.versionId,
    projectDigest: project.resultDigest,
    sections: [
      { sectionId: "QUESTION", label: "Question", state: "CONFIRMED", items: [project.scientificQuestion.text] },
      { sectionId: "HYPOTHESES", label: "Hypothèses", state: project.hypotheses.some((item) => item.reviewState === "ADOPTED") ? "CONFIRMED" : "IN_CONSTRUCTION", items: project.hypotheses.map((item) => item.text) },
      { sectionId: "POPULATION", label: "Population", state: project.populationDesign.missingInformation.length ? "IN_CONSTRUCTION" : "CONFIRMED", items: populationItems },
      { sectionId: "DESIGN", label: "Design", state: selectedDesign ? "CONFIRMED" : "IN_CONSTRUCTION", items: selectedDesign ? [selectedDesign.label] : project.studyDesignCandidates.map((item) => item.label) },
      { sectionId: "IMAGING", label: "Imagerie", state: project.imagingContribution.applicability === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : project.imagingContribution.applicability === "REQUIRED_BUT_NOT_READY" ? "TO_CLARIFY" : "IN_CONSTRUCTION", items: imagingItems },
      { sectionId: "MEASUREMENTS", label: "Variables / mesures", state: project.variables.length ? "IN_CONSTRUCTION" : "TO_CLARIFY", items: project.variables.map((item) => item.definition) },
      { sectionId: "ANALYSIS", label: "Analyse", state: project.analysisRequirements.length ? "IN_CONSTRUCTION" : "TO_CLARIFY", items: project.analysisRequirements.map((item) => item.reason) },
    ],
    documents: [
      documentStateFrom("PROTOCOL", "Protocole", project, documentProjections),
      documentStateFrom("DMP", "DMP", project, documentProjections),
      documentStateFrom("SAP", "SAP", project, documentProjections),
    ],
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};

// eslint-disable-next-line react-refresh/only-export-components -- pure projection builder shared by the owner shell and contract tests
export const buildContributionProjectPanelProjection = (
  contribution: ScientificInterpretationContributionEnvelope | null,
  ownerRefs: { projectRef?: string | null; projectVersion?: string | null; projectDigest?: string | null } = {},
): ProjectPanelProjection => {
  if (!contribution) return {
    projectRef: ownerRefs.projectRef ?? null,
    projectVersion: ownerRefs.projectVersion ?? null,
    projectDigest: ownerRefs.projectDigest ?? null,
    sections: [],
    documents: emptyDocuments(),
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
  const typed = buildConversationalSemanticHandoff(contribution);
  const active = typed.scientificElements.filter((item) => item.activeState !== false);
  const values = (...kinds: typeof active[number]["semanticKind"][]) => active.filter((item) => kinds.includes(item.semanticKind)).map((item) => item.content);
  const sections: ProjectPanelSection[] = [
    { sectionId: "QUESTION", label: "Question", state: contribution.decisionBoundary.decisionRequired ? "IN_CONSTRUCTION" : "CONFIRMED", items: [contribution.scientificContent.normalizedUnderstanding ?? contribution.source.originalRequest] },
    { sectionId: "HYPOTHESES", label: "Hypothèses", state: "TO_CLARIFY", items: [] },
    { sectionId: "POPULATION", label: "Population", state: values("POPULATION").length ? "MENTIONED" : "TO_CLARIFY", items: values("POPULATION") },
    { sectionId: "DESIGN", label: "Design", state: values("STUDY_DESIGN", "INTERVENTION", "COMPARATOR").length ? "IN_CONSTRUCTION" : "TO_CLARIFY", items: values("STUDY_DESIGN", "INTERVENTION", "COMPARATOR") },
    { sectionId: "IMAGING", label: "Imagerie", state: values("IMAGING_MODALITY", "IMAGING_METHOD").length ? "MENTIONED" : "NOT_APPLICABLE", items: values("IMAGING_MODALITY", "IMAGING_METHOD") },
    { sectionId: "MEASUREMENTS", label: "Variables / mesures", state: values("BIOLOGICAL_MEASUREMENT", "QUANTITATIVE_TARGET", "OUTCOME").length ? "IN_CONSTRUCTION" : "TO_CLARIFY", items: values("BIOLOGICAL_MEASUREMENT", "QUANTITATIVE_TARGET", "OUTCOME") },
    { sectionId: "ANALYSIS", label: "Analyse", state: "TO_CLARIFY", items: [] },
  ];
  return {
    projectRef: ownerRefs.projectRef ?? null,
    projectVersion: ownerRefs.projectVersion ?? null,
    projectDigest: ownerRefs.projectDigest ?? null,
    sections,
    documents: emptyDocuments(),
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
};

type Props = {
  projection: ProjectPanelProjection;
  mode?: "STANDARD" | "EXPERT";
  onRequestEdit?: (sectionId: ProjectPanelSection["sectionId"]) => void;
};

export default function ProjectPanel({ projection, mode = "STANDARD", onRequestEdit }: Props) {
  return <aside
    aria-label="Research Project"
    className="min-w-0 self-start rounded-2xl border bg-card shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
    data-testid="conversation-project-panel"
  >
    <div className="border-b p-5">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Research Project</p>
      <h2 className="mt-2 text-xl font-semibold">Votre étude, au même endroit</h2>
      <p className="mt-2 text-sm text-muted-foreground">Projection vivante des owners ; aucune modification scientifique n’est effectuée dans ce panneau.</p>
    </div>
    <div className="space-y-5 p-4 sm:p-5">
      {!projection.sections.length && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Le projet apparaîtra ici à mesure que la conversation sera structurée.</p>}
      {projection.sections.map((section) => <section key={section.sectionId} aria-labelledby={`project-panel-${section.sectionId.toLowerCase()}`} className="rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 id={`project-panel-${section.sectionId.toLowerCase()}`} className="font-semibold">{section.label}</h3>
          <span className="rounded-full border bg-muted px-2 py-1 text-xs text-muted-foreground">{SECTION_STATE_LABEL[section.state]}</span>
        </div>
        {section.items.length ? <ul className="mt-3 space-y-2 text-sm">{section.items.map((item) => <li key={item} className="break-words">{item}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Aucun élément disponible.</p>}
        {onRequestEdit && <button type="button" onClick={() => onRequestEdit(section.sectionId)} className="mt-3 text-sm text-primary hover:underline">Modifier dans la conversation</button>}
      </section>)}

      <section aria-labelledby="project-panel-documents" className="rounded-xl border p-4">
        <h3 id="project-panel-documents" className="font-semibold">Documents</h3>
        <div className="mt-3 space-y-3">{projection.documents.map((document) => <article key={document.documentId} className="rounded-lg bg-muted/50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{document.label}</p><span className="text-xs text-muted-foreground">{DOCUMENT_STATE_LABEL[document.sourceState]}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">{document.explanation}</p>
        </article>)}</div>
      </section>

      {mode === "EXPERT" && <section aria-label="Références propriétaires" className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
        <h3 className="font-semibold text-foreground">Références propriétaires</h3>
        <p className="mt-2 break-all">{projection.projectRef ?? "Aucun Research Project créé"}</p>
        <p className="mt-1 break-all">{projection.projectVersion ?? "Version indisponible"}</p>
        <p className="mt-1 break-all">{projection.projectDigest ?? "Digest indisponible"}</p>
      </section>}
    </div>
  </aside>;
}
