import { interactionMatchesCurrentProject } from "./study-design-standard";
import { scientificThinkingInteractionMatchesCurrentProject } from "./scientific-thinking-standard";
import { observabilityInteractionMatchesCurrentProject } from "./observability-standard";
import { imagingInteractionMatchesCurrentProject } from "./imaging-standard";
import { biostatisticsInteractionMatchesCurrentProject } from "./biostatistics-standard";
/** Effect coordination only: PRJ owns adoption; QRY/DOC remain read-only consumers. */
import type { ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import type { DocumentAdministration } from "@/features/document-projection/administration";
import { markFunctionalResetDocumentFailure, refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { ensureServerProjectSnapshot } from "../product-bridge-client";
import { deriveFunctionalResetDataOwnerState } from "./canonical-study-data-standard";
import { attachCurrentKnowledgePrerequisiteWhenRequired } from "./knowledge-standard";
import type { ProjectAdoptionTrace } from "./project-adoption-trace";
import { saveFunctionalResetWorkspaceSession, type FunctionalResetSession, type SessionSave } from "./session";

export const documentBlockerSignals = (documents: FunctionalResetSession["documents"]) =>
  documents.cards.flatMap(card => card.blockerGroups.map(group => ({ dimension: group.dimension, items: [...group.items] })));

export const refreshAdoptedProjectConsumers = (input: Readonly<{
  previous: FunctionalResetSession;
  project: ResearchProjectOwnerProjection;
  administration: DocumentAdministration;
  recordedAt: string;
}>) => {
  const { project, previous, administration, recordedAt } = input;
  let documents;
  try {
    documents = refreshFunctionalResetDocumentPortfolio({ administration, project, previous: previous.documents, requestedAt: recordedAt });
  } catch (error) {
    documents = markFunctionalResetDocumentFailure(project, previous.documents, error);
  }
  const queryNavigation = attachCurrentKnowledgePrerequisiteWhenRequired({ project, navigation: buildFunctionalResetQueryNavigation({
    project, previous: previous.queryNavigation, documentBlockers: documentBlockerSignals(documents), recordedAt,
    dataOwnerState: deriveFunctionalResetDataOwnerState({ project, ledger: previous.knowledgeOwnerLedger }),
  }) });
  return { documents, queryNavigation };
};

export type ProjectAdoptionEffectResult =
  | { status: "NOT_COMMITTED"; error: unknown }
  | { status: "COMMITTED"; session: FunctionalResetSession; auxiliaryUpload: Promise<"UPLOADED" | "FAILED"> | null };

/** One scientific write, then optional auxiliary upload. Never retry or redispatch. */
export const persistAdoptedProjectSession = async (input: Readonly<{
  storage: Storage;
  session: FunctionalResetSession & { project: ResearchProjectOwnerProjection };
  previousProject: ResearchProjectOwnerProjection | null;
  save?: SessionSave;
  adoptionTrace?: ProjectAdoptionTrace;
  uploadSnapshot: boolean;
}>): Promise<ProjectAdoptionEffectResult> => {
  let session: FunctionalResetSession = input.session;
  const { project } = input.session;
  const trace = input.save ? input.adoptionTrace : undefined;
  if (trace) {
    trace.writeStarted(project, input.previousProject);
    session = { ...session, scientificExecutionTraceLedger: trace.ledger() };
  }
  const result = await saveFunctionalResetWorkspaceSession(input.storage, session, input.save);
  if (result.scientificPersisted === false) return { status: "NOT_COMMITTED", error: result.error };
  if (trace) {
    trace.writeSucceeded(project);
    session = { ...session, scientificExecutionTraceLedger: trace.ledger() };
  }
  const auxiliaryUpload = input.uploadSnapshot
    ? Promise.resolve().then(() => ensureServerProjectSnapshot(session.sessionId, project))
      .then(() => "UPLOADED" as const, () => "FAILED" as const)
    : null;
  return { status: "COMMITTED", session, auxiliaryUpload };
};

export function adoptedProjectInteractionState(current: FunctionalResetSession, contributionId: string, project: NonNullable<FunctionalResetSession["project"]>): Pick<FunctionalResetSession, "studyDesignInteraction" | "scientificThinkingInteraction" | "observabilityInteraction" | "imagingInteraction" | "biostatisticsInteraction" | "canonicalStudyDataInteraction" | "dataManagementInteraction"> {
  return {
    studyDesignInteraction: current.studyDesignInteraction?.pendingContributionRef === contributionId
      ? {
        ...current.studyDesignInteraction,
        status: "ADOPTED",
        adoptedProjectVersion: project.versionId,
        staleReason: null,
      }
      : current.studyDesignInteraction && !interactionMatchesCurrentProject(current.studyDesignInteraction, project)
        ? { ...current.studyDesignInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
        : current.studyDesignInteraction,
    scientificThinkingInteraction: current.scientificThinkingInteraction?.pendingContributionRef === contributionId
      ? {
        ...current.scientificThinkingInteraction,
        status: "ADOPTED",
        adoptedProjectVersion: project.versionId,
        staleReason: null,
      }
      : current.scientificThinkingInteraction && !scientificThinkingInteractionMatchesCurrentProject(current.scientificThinkingInteraction, project)
        ? { ...current.scientificThinkingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
        : current.scientificThinkingInteraction,
    observabilityInteraction: current.observabilityInteraction?.pendingContributionRef === contributionId
      ? {
        ...current.observabilityInteraction,
        status: "ADOPTED",
        adoptedProjectVersion: project.versionId,
        staleReason: null,
      }
      : current.observabilityInteraction && !observabilityInteractionMatchesCurrentProject(current.observabilityInteraction, project)
        ? { ...current.observabilityInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
        : current.observabilityInteraction,
    imagingInteraction: current.imagingInteraction?.pendingContributionRef === contributionId
      ? {
        ...current.imagingInteraction,
        status: "ADOPTED",
        adoptedProjectVersion: project.versionId,
        staleReason: null,
      }
      : current.imagingInteraction && !imagingInteractionMatchesCurrentProject(current.imagingInteraction, project)
        ? { ...current.imagingInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
        : current.imagingInteraction,
    biostatisticsInteraction: current.biostatisticsInteraction?.pendingContributionRef === contributionId
      ? {
        ...current.biostatisticsInteraction,
        status: "ADOPTED",
        adoptedProjectVersion: project.versionId,
        staleReason: null,
      }
      : current.biostatisticsInteraction && !biostatisticsInteractionMatchesCurrentProject(current.biostatisticsInteraction, project)
        ? { ...current.biostatisticsInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
        : current.biostatisticsInteraction,
    canonicalStudyDataInteraction: current.canonicalStudyDataInteraction
      && (current.canonicalStudyDataInteraction.sourceProjectVersion !== project.versionId
        || current.canonicalStudyDataInteraction.sourceProjectDigest !== project.projectDigest)
      ? { ...current.canonicalStudyDataInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
      : current.canonicalStudyDataInteraction,
    dataManagementInteraction: current.dataManagementInteraction
      && (current.dataManagementInteraction.sourceProjectVersion !== project.versionId
        || current.dataManagementInteraction.sourceProjectDigest !== project.projectDigest)
      ? { ...current.dataManagementInteraction, status: "STALE", staleReason: "SOURCE_PROJECT_VERSION_CHANGED" }
      : current.dataManagementInteraction,
  };
}
