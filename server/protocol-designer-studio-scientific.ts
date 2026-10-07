import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import { createStudioReconciliationRequest } from "../src/features/document-projection/studio-reconciliation.js";
import type { StudioReconciliationRequest } from "../src/features/document-projection/studio-reconciliation-contract.js";
import type { ResearchProjectOwnerProjection } from "../src/features/research-project-construction/contribution-owner-boundary.js";
import type { DocumentArchiveAccess, DocumentArchiveStore } from "./protocol-designer-document-archive.js";

/** DOC verifies saved native bytes/anchors, not their scientific meaning. */
export const verifySavedStudioScientificSource = async (archive: DocumentArchiveStore, access: DocumentArchiveAccess,
  project: ResearchProjectOwnerProjection, request: StudioReconciliationRequest) => {
  if (!archive.workingRevisions) throw new Error("DOC_REVISION_UNAVAILABLE");
  const { revision } = await archive.workingRevisions.get(access, request.workingRevisionId);
  const source = await archive.body(access, revision.baseGenerationId);
  const projectionSource = source.body.native.family === "DRCI"
    ? await archive.body(access, source.body.native.value.protocolProjectionId) : undefined;
  const expected = await createStudioReconciliationRequest({ revision, source, projectionSource, currentProject: project,
    scientificState: request.scientificState });
  if (logicalDigest(expected) !== logicalDigest(request)) throw new Error("STUDIO_RECONCILIATION_STALE");
};
