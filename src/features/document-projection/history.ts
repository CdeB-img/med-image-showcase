import type { DocumentProjection, ProjectionHistory, ProjectionLifecycleState } from "./types";

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
