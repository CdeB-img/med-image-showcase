import type { DocumentProjection, ProjectionHistory, ProjectionLifecycleState } from "./types";
import { isDrciDraftPackCurrent, type DrciDraftPack } from "./drci-draft-contract";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary";

/** Read-only compatibility projection over existing native histories, not a store.
 * Pack digest identifies a generation, not its position in a displayed list.
 * Version labels are derived here from the complete history before UI filtering.
 */
export const documentGenerationsForProject = (packs: readonly DrciDraftPack[], projectId: string | undefined) =>
  [...new Map(packs.filter(pack => pack.project.projectId === projectId).map(pack => [pack.packDigest, pack])).values()]
    .sort((a, b) => a.generatedAt.localeCompare(b.generatedAt) || a.packDigest.localeCompare(b.packDigest))
    .map((pack, index) => ({
      documentGenerationId: `${pack.project.projectId}:document-generation:${pack.packDigest}`,
      documentVersion: index + 1,
      projectId: pack.project.projectId,
      projectVersionId: pack.project.projectVersion,
      projectDigest: pack.project.projectDigest,
      createdAt: pack.generatedAt,
      status: "AVAILABLE" as const,
      documentDraftPack: pack,
    }));

export const nextDocumentGenerationVersion = (packs: readonly DrciDraftPack[], projectId: string) =>
  documentGenerationsForProject(packs, projectId).length + 1;

export const currentDrciDraftPack = (packs: readonly DrciDraftPack[], project: ResearchProjectOwnerProjection) =>
  documentGenerationsForProject(packs, project.projectId).map(generation => generation.documentDraftPack)
    .filter(pack => isDrciDraftPackCurrent(pack, project)).at(-1) ?? null;

/** Separate native families: a template projection is not a generated DRCI pack.
 * Logical IDs bind Project + kind; physical files and generations do not define them.
 */
export const projectDocumentLifecycle = (
  projections: readonly DocumentProjection[], packs: readonly DrciDraftPack[], project: ResearchProjectOwnerProjection,
) => {
  const generations = documentGenerationsForProject(packs, project.projectId);
  return {
    projections: projections.filter(projection => projection.source.projectId === project.projectId).map(projection => ({
      logicalDocumentId: `${project.projectId}:document:TEMPLATE:${projection.projectionType}`,
      generationId: projection.projectionId,
      sourceProject: projection.source,
      projection,
    })),
    generations: generations.map((generation, index) => ({
      ...generation,
      previousGenerationId: generations[index - 1]?.documentGenerationId ?? null,
      documents: generation.documentDraftPack.documents.map(document => ({
        logicalDocumentId: `${project.projectId}:document:DRCI:${document.kind}`,
        kind: document.kind,
      })),
    })),
    currentPack: currentDrciDraftPack(packs, project),
  };
};

export const createProjectionHistory = (): ProjectionHistory => ({ seriesId: null, entries: [] });

export const appendProjectionHistory = (history: Readonly<ProjectionHistory>, projection: DocumentProjection): ProjectionHistory => {
  if (history.entries.some((entry) => entry.projection.projectionId === projection.projectionId)) return history as ProjectionHistory;
  if (history.seriesId && history.seriesId !== projection.seriesId) throw new Error("PROJECTION_SERIES_MISMATCH");
  const entries = history.entries.map((entry) => ({
    ...entry,
    historicalStatus: (["ARCHIVED", "INVALIDATED"] as ProjectionLifecycleState[]).includes(entry.historicalStatus) ? entry.historicalStatus : "SUPERSEDED" as const,
  }));
  return { seriesId: projection.seriesId, entries: [...entries, { projection, historicalStatus: projection.lifecycle }] };
};

const allowedTransitions: Partial<Record<ProjectionLifecycleState, ProjectionLifecycleState[]>> = {
  DRAFT: ["PARTIAL", "READY_FOR_REVIEW", "ARCHIVED", "INVALIDATED"],
  PARTIAL: ["READY_FOR_REVIEW", "SUPERSEDED", "ARCHIVED", "INVALIDATED"],
  READY_FOR_REVIEW: ["REVIEWED", "SUPERSEDED", "ARCHIVED", "INVALIDATED"],
  REVIEWED: ["SUPERSEDED", "ARCHIVED", "INVALIDATED"],
  SUPERSEDED: ["ARCHIVED"],
};

export const transitionProjectionHistory = (
  history: Readonly<ProjectionHistory>,
  projectionId: string,
  nextStatus: ProjectionLifecycleState,
): ProjectionHistory => {
  const entry = history.entries.find((item) => item.projection.projectionId === projectionId);
  if (!entry) throw new Error("PROJECTION_HISTORY_ENTRY_NOT_FOUND");
  if (!(allowedTransitions[entry.historicalStatus] ?? []).includes(nextStatus)) throw new Error("INVALID_PROJECTION_LIFECYCLE_TRANSITION");
  return {
    seriesId: history.seriesId,
    entries: history.entries.map((item) => item.projection.projectionId === projectionId ? { ...item, historicalStatus: nextStatus } : item),
  };
};
