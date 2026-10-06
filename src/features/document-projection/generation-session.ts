import type { FunctionalResetSession } from "../protocol-designer/functional-reset/session";
import type { DocumentArchiveClient } from "./generation-archive-client";
import { documentTextSha256 } from "./generation-archive-client";
import { freezeDocumentGeneration } from "./generation-exports";
import { buildStudyDeliverablePortfolio } from "./study-deliverable-portfolio";
import { unloadFunctionalResetDocumentPortfolio } from "./functional-reset-boundary";
import { DOC_ARCHIVE_CONTRACT, documentNativeIdentity, type DocumentPersistenceReceipt } from "./generation-persistence";
import type { DocumentProjection } from "./types";

/** Latest successful real generation only; a technical projection is not DOC. */
export const hasCurrentArchivedGeneration = (session: FunctionalResetSession) => Boolean(session.project
  && session.documentArchive?.currentGeneration?.project.projectId === session.project.projectId
  && session.documentArchive.currentGeneration.project.projectDigest === session.project.projectDigest);

/** New generations only. No legacy import, relabeling or migration path. */
export const persistTemplateGeneration = async (session: FunctionalResetSession, projection: DocumentProjection, client: DocumentArchiveClient) => {
  if (!session.project || projection.source.projectDigest !== session.project.projectDigest
    || projection.source.projectVersion !== session.project.versionId) throw new Error("DOC_ARCHIVE_PROJECT_BINDING_INVALID");
  const native = { family: "TEMPLATE" as const, value: projection };
  const portfolio = buildStudyDeliverablePortfolio({ project: session.project, protocolProjection: projection, generatedAt: projection.requestedAt });
  const body = await freezeDocumentGeneration({ native, artifacts: portfolio.artifacts, sha256: documentTextSha256, renderOrigin: "GENERATION_TIME",
    buildCommit: typeof __NOXIA_BUILD_GIT_SHA__ === "string" && __NOXIA_BUILD_GIT_SHA__ ? __NOXIA_BUILD_GIT_SHA__ : null });
  const receipt = await client.commit(`doc-template:${projection.projectionId}`, body);
  if (receipt.contract !== DOC_ARCHIVE_CONTRACT || receipt.generation.generationId !== documentNativeIdentity(native)
    || receipt.generation.bodySha256 !== await documentTextSha256(JSON.stringify(body))) throw new Error("DOC_ARCHIVE_COMMIT_NOT_VERIFIED");
  return receipt;
};

export const publishArchivedTemplate = (session: FunctionalResetSession, projection: DocumentProjection, receipt: DocumentPersistenceReceipt): FunctionalResetSession => ({
  ...session, documents: unloadFunctionalResetDocumentPortfolio(session.documents, projection),
  drciDraftPacks: [], documentArchive: { ...session.documentArchive,
    contract: DOC_ARCHIVE_CONTRACT, projectId: session.projectId, historyState: "NOT_LOADED", storageMode: "DURABLE_ONLY",
    currentProjectionId: receipt.generation.generationId, currentGenerationId: session.documentArchive?.currentGenerationId ?? null,
    pendingRequestId: null },
});

/** A command reads its current generation, not the full historical series.
 * These native values are temporary owner input and never session history. */
export const hydrateDocumentCommandSession = async (session: FunctionalResetSession, client: DocumentArchiveClient, ancestor = false) => {
  const id = session.documentArchive?.currentProjectionId;
  if (!id || session.documents.projections.length) return session;
  const selected = await client.body(id);
  if (selected.body.native.family !== "TEMPLATE") throw new Error("DOC_ARCHIVE_NATIVE_FAMILY_MISMATCH");
  const projection = selected.body.native.value;
  const previous = ancestor && projection.priorProjectionId ? await client.body(projection.priorProjectionId) : null;
  if (previous && previous.body.native.family !== "TEMPLATE") throw new Error("DOC_ARCHIVE_NATIVE_FAMILY_MISMATCH");
  return { ...session, documents: { ...session.documents, projections: [
    ...(previous?.body.native.family === "TEMPLATE" ? [previous.body.native.value] : []), projection,
  ] } };
};
