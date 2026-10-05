import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { createPostgresDocumentArchive, docSha256, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { archiveSqlFixture } from "./archive-sql-fixture";
import type { DocumentArchiveClient } from "../generation-archive-client";
import { documentNativeGeneratedAt, type DocumentGenerationBody } from "../generation-persistence";
import { freezeDocumentGeneration } from "../generation-exports";
import { drciDraftPackArtifacts } from "../drci-draft-pack";
import type { DrciDraftPack } from "../drci-draft-contract";

/** CURRENT_STRUCTURAL_INVARIANT: UI transport adapter backed by the real DOC
 * archive and native Project validator; scientific source remains the calling suite's fixture. */
const projects = new Map<string, ReturnType<typeof state>>();
const state = () => {
  const snapshots = memoryProjectSnapshotStore(), fixture = archiveSqlFixture();
  return { snapshots, fixture, proof: null as string | null,
    store: createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql) };
};
export const resetOfflineArchiveClients = () => projects.clear();
const accessFor = async (sessionId: string, project: ResearchProjectOwnerProjection) => {
  let entry = projects.get(project.projectId);
  if (!entry) { entry = state(); projects.set(project.projectId, entry); }
  const identity = { sessionId, clientAddress: "192.0.2.1" };
  const registration = await entry.snapshots.persist(identity, project, entry.proof);
  entry.proof = registration.proof;
  return { store: entry.store, access: { identity, project: registration.ref, proof: registration.proof } };
};
export const offlineArchiveClient = (sessionId: string, project: ResearchProjectOwnerProjection): DocumentArchiveClient => ({
  async history(cursor) { const { store, access } = await accessFor(sessionId, project); return store.history(access, cursor); },
  async body(id) { const { store, access } = await accessFor(sessionId, project); return store.body(access, id); },
  async receipt(id) { const { store, access } = await accessFor(sessionId, project); return store.receipt(access, id); },
  async import(id, body, label) { const { store, access } = await accessFor(sessionId, project);
    await store.admit(access, { requestId: id, requestSha256: docSha256(JSON.stringify(body)), generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: Buffer.byteLength(JSON.stringify(body)) });
    return store.commit(access, id, body, label); },
});
export const offlineDocReceipt = async (sessionId: string, project: ResearchProjectOwnerProjection, requestId: string, pack: DrciDraftPack) => {
  const native = { family: "DRCI" as const, value: pack };
  const body: DocumentGenerationBody = await freezeDocumentGeneration({ native, artifacts: drciDraftPackArtifacts(pack, project), sha256: docSha256, renderOrigin: "GENERATION_TIME" });
  const { store, access } = await accessFor(sessionId, project);
  await store.admit(access, { requestId, requestSha256: docSha256(requestId), generatedAt: pack.generatedAt, reservedBytes: 4_000_000 });
  return store.commit(access, requestId, body);
};
