import type { DocumentArchiveStore, DocumentArchiveAccess } from "./protocol-designer-document-archive.js";
import type { ResearchProjectOwnerProjection } from "../src/features/research-project-construction/contribution-owner-boundary.js";
import { requireStudioEditSource, studioEditRequestSchema } from "../src/features/document-projection/studio-edit-proposal.js";

/** Existing DOC revision owner verifies the source before provider admission. */
export const resolveSavedStudioEditSource = async (archive: DocumentArchiveStore, access: DocumentArchiveAccess,
  project: ResearchProjectOwnerProjection, raw: unknown) => {
  const request = studioEditRequestSchema.parse(raw);
  if (!archive.workingRevisions) throw new Error("DOC_REVISION_UNAVAILABLE");
  const saved = await archive.workingRevisions.get(access, request.binding.revisionId);
  requireStudioEditSource(request, saved.revision, { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest });
  return saved.revision;
};
