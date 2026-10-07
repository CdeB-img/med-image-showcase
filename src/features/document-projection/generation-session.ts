import type { FunctionalResetSession } from "../protocol-designer/functional-reset/session";
import type { DocumentArchiveClient } from "./generation-archive-client";
import { documentTextSha256 } from "./generation-archive-client";
import { freezeDocumentGeneration } from "./generation-exports";
import { buildStudyDeliverablePortfolio } from "./study-deliverable-portfolio";
import { unloadFunctionalResetDocumentPortfolio } from "./functional-reset-boundary";
import { DOC_ARCHIVE_CONTRACT, documentNativeIdentity, type DocumentGenerationRef, type DocumentPersistenceReceipt } from "./generation-persistence";
import type { DocumentProjection } from "./types";

/** Latest successful real generation only; a technical projection is not DOC. */
export const hasCurrentArchivedGeneration = (session: FunctionalResetSession) => Boolean(session.project
  && session.documentArchive?.currentGenerationId === session.documentArchive?.currentGeneration?.generationId
  && session.documentArchive?.currentGeneration?.project.projectId === session.project.projectId
  && session.documentArchive.currentGeneration.project.projectVersion === session.project.versionId
  && session.documentArchive.currentGeneration.project.projectDigest === session.project.projectDigest);

/** The archived current source, without a committed generation for this exact
 * Project, identifies an incomplete command. lastFailure is presentation only:
 * reload refreshes it and must not create a second authorization event.
 * A changed Project/administration is a new input, never a partial resume. */
export const failedDocumentRetryProjection = (session: FunctionalResetSession,
  administration?: Parameters<typeof import("./functional-reset-boundary").refreshFunctionalResetDocumentPortfolio>[0]["administration"]) => {
  const projection = session.documents.projections.at(-1);
  const binding = session.documents.projectRef;
  const archivedId = session.documentArchive?.currentProjectionId;
  const incomplete = archivedId ? session.documentArchive?.projectId === session.project?.projectId
    && projection?.projectionId === archivedId && !hasCurrentArchivedGeneration(session) : Boolean(session.documents.lastFailure);
  return incomplete && session.project && projection && !hasCurrentArchivedGeneration(session)
    && binding?.projectId === session.project.projectId && binding.projectVersion === session.project.versionId
    && binding.projectDigest === session.project.projectDigest
    && projection.source.projectId === session.project.projectId && projection.source.projectVersion === session.project.versionId
    && projection.source.projectDigest === session.project.projectDigest
    && projection.source.administrationDigest === administration?.digest ? projection : null;
};

/** Metadata only. A local pointer or an exception is not an archive verdict. */
export const readCurrentArchivedGeneration = async (session: FunctionalResetSession, client: DocumentArchiveClient) => {
  if (!session.project) return null;
  let cursor: number | undefined;
  do {
    const page = await client.history(cursor);
    const generation = page.entries.find(ref => ref.family === "DRCI" && ref.persistenceState === "COMMITTED"
      && ref.project.projectId === session.project!.projectId
      && ref.project.projectVersion === session.project!.versionId
      && ref.project.projectDigest === session.project!.projectDigest);
    if (generation) return generation;
    if (page.nextBeforeOrdinal === null) return null;
    if (cursor !== undefined && page.nextBeforeOrdinal >= cursor) throw new Error("DOC_ARCHIVE_CURSOR_INVALID");
    cursor = page.nextBeforeOrdinal;
  } while (cursor !== undefined);
  return null;
};

/** Publish the durable owner's identity/ordinal, never manufacture a Gn.
 * Scientific state and immutable historical bodies remain untouched. */
export const publishArchivedGeneration = (session: FunctionalResetSession, generation: DocumentGenerationRef,
  projectionId = session.documentArchive?.currentProjectionId ?? null): FunctionalResetSession => {
  if (!session.project || generation.family !== "DRCI" || generation.persistenceState !== "COMMITTED"
    || generation.project.projectId !== session.project.projectId || generation.project.projectVersion !== session.project.versionId
    || generation.project.projectDigest !== session.project.projectDigest) throw new Error("DOC_ARCHIVE_PROJECT_BINDING_INVALID");
  return { ...session, documents: { ...session.documents, lastFailure: null }, drciDraftPacks: [], openDocumentProjectionId: null,
    documentRetryUnsafe: false, documentArchive: { contract: DOC_ARCHIVE_CONTRACT, projectId: generation.project.projectId,
      historyState: "NOT_LOADED", storageMode: "DURABLE_ONLY", currentGenerationId: generation.generationId,
      currentProjectionId: projectionId, pendingRequestId: null, pendingRecovery: null,
      currentGeneration: { generationId: generation.generationId, project: generation.project,
        displayVersion: generation.displayVersion, generatedAt: generation.generatedAt } } };
};

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
  // A loaded historical/revision body is not the source of this command.
  if (!id || session.documents.projections.at(-1)?.projectionId === id) return session;
  const selected = await client.body(id);
  if (selected.body.native.family !== "TEMPLATE") throw new Error("DOC_ARCHIVE_NATIVE_FAMILY_MISMATCH");
  const projection = selected.body.native.value;
  const previous = ancestor && projection.priorProjectionId ? await client.body(projection.priorProjectionId) : null;
  if (previous && previous.body.native.family !== "TEMPLATE") throw new Error("DOC_ARCHIVE_NATIVE_FAMILY_MISMATCH");
  return { ...session, documents: { ...session.documents, projections: [
    ...(previous?.body.native.family === "TEMPLATE" ? [previous.body.native.value] : []), projection,
  ] } };
};
