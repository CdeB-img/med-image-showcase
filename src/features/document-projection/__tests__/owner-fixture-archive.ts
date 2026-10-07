import { createPostgresDocumentArchive, docSha256, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { restoreResearchProjectOwnerProjection } from "../../research-project-construction/project-owner-restore";
import type { FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import type { DocumentArchiveClient } from "../generation-archive-client";
import { documentNativeGeneratedAt, documentNativeProject, type DocumentNativeGeneration } from "../generation-persistence";
import { freezeDocumentGeneration } from "../generation-exports";
import { drciDraftPackArtifacts } from "../drci-draft-pack";
import { buildStudyDeliverablePortfolio } from "../study-deliverable-portfolio";
import { publishArchivedTemplate } from "../generation-session";
import { archiveSqlFixture } from "./archive-sql-fixture";

/** CURRENT_SEMANTIC_INVARIANT: unchanged meaningful native owner fixtures.
 * Some canonical owner fixtures use arbitrary Project IDs, unlike the browser
 * snapshot capability. This test port authenticates that exact fixture only;
 * it does NOT qualify production snapshot/network authorization (covered by
 * postgres-generation-archive and project-snapshot-resolver). Persistence,
 * native validation, frozen exports, hashes and SQL transactions remain real. */
export const archiveOwnerFixtureSession = async (source: FunctionalResetSession, generations: readonly DocumentNativeGeneration[]) => {
  const project = source.project!;
  if (restoreResearchProjectOwnerProjection(project).projectDigest !== project.projectDigest) throw new Error("OWNER_FIXTURE_NOT_CANONICAL");
  const sql = archiveSqlFixture();
  const access = { identity: { sessionId: source.sessionId, clientAddress: "192.0.2.9" },
    project: { projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest }, proof: "owner-fixture-only" };
  const archive = createPostgresDocumentArchive("postgres://offline", { async resolve(identity, ref, proof) {
    if (identity.sessionId !== source.sessionId || identity.clientAddress !== access.identity.clientAddress || proof !== access.proof
      || ref.projectId !== project.projectId || ref.projectDigest !== project.projectDigest || ref.versionId !== project.versionId) throw new Error("OWNER_FIXTURE_AUTHORITY_INVALID");
    return project;
  } }, documentArchiveCapacity({}), sql.sql);
  const client: DocumentArchiveClient = {
    async recover() { throw new Error("OFFLINE_RECOVERY_TRANSPORT_NOT_CONFIGURED"); },
    history: cursor => archive.history(access, cursor, "DRCI"), body: id => archive.body(access, id), receipt: id => archive.receipt(access, id),
    async commit(requestId, body) {
      await archive.admit(access, { requestId, requestSha256: docSha256(JSON.stringify(body)), generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: Buffer.byteLength(JSON.stringify(body)) });
      return archive.commit(access, requestId, body);
    },
  };
  let session: FunctionalResetSession = { ...source, projectId: project.projectId, documents: { ...source.documents, projections: [] }, drciDraftPacks: [] };
  for (const native of generations) {
    const artifacts = native.family === "DRCI" ? drciDraftPackArtifacts(native.value, project)
      : buildStudyDeliverablePortfolio({ project, protocolProjection: native.value, generatedAt: native.value.requestedAt }).artifacts;
    const body = await freezeDocumentGeneration({ native, artifacts, sha256: docSha256, renderOrigin: "GENERATION_TIME" });
    const receipt = await client.commit(`fixture-generation:${documentNativeGeneratedAt(native)}:${native.family}:${native.family === "DRCI" ? native.value.packDigest : native.value.projectionId}`, body);
    session = native.family === "TEMPLATE" ? publishArchivedTemplate(session, native.value, receipt)
      : { ...session, documentArchive: { ...session.documentArchive!, currentGenerationId: receipt.generation.generationId,
        currentGeneration: { generationId: receipt.generation.generationId, project: documentNativeProject(native), displayVersion: receipt.generation.displayVersion, generatedAt: receipt.generation.generatedAt } } };
  }
  return { session, client };
};
