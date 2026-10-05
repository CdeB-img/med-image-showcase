import { ensureCanonicalProjectState } from "./canonical-project-backbone";
import type { ResearchProjectOwnerProjection } from "./contribution-owner-boundary";
import { researchProjectOwnerDigest } from "./project-owner-digest";

/** Verify persisted owner bytes before any consumer or supported legacy normalization. */
export const restoreResearchProjectOwnerProjection = (project: ResearchProjectOwnerProjection): ResearchProjectOwnerProjection => {
  if (researchProjectOwnerDigest(project) !== project.projectDigest) throw new Error("PROJECT_OWNER_DIGEST_MISMATCH");
  if (!project.canonicalState && project.canonicalBackboneStatus === "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE") {
    throw new Error("PROJECT_OWNER_CANONICAL_STATE_MISSING");
  }
  // The existing PRJ migration/normalizer owns compatibility. Verify the original
  // legacy digest first, then bind the normalized representation to that same
  // adoption/version/decision; this is not a new scientific adoption.
  const restored: ResearchProjectOwnerProjection = {
    ...project,
    canonicalBackboneStatus: "PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE",
    canonicalState: ensureCanonicalProjectState(project),
  };
  return { ...restored, projectDigest: researchProjectOwnerDigest(restored) };
};
