import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sql } from "postgres";
import { createPostgresProjectSnapshotStore, type ProjectSnapshotReadPurpose } from "../../../../server/protocol-designer-project-snapshot";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256 } from "../../../../server/protocol-designer-document-archive";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";
import { stableStringify } from "../../knowledge-engine/canonical";
import { workingRevisionFixture } from "./working-revision-fixture";
import nativeCatalog from "./runtime-schema-catalog.json";

const db = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], catalog: [] as Record<string, unknown>[], queries: [] as string[] }));
vi.mock("postgres", () => ({ default: () => {
  const tag = async (parts: TemplateStringsArray, ...values: unknown[]) => {
    const query = parts.join("?").replace(/\s+/gu, " ").trim(); db.queries.push(query);
    if (query.startsWith("select c.relname")) return db.catalog.filter(row => (values[0] as string[]).includes(String(row.table_name)));
    if (query.startsWith("select pg_advisory")) return [];
    if (!query.startsWith("select ")) throw new Error("UNEXPECTED_PROJECT_WRITE");
    return db.rows.filter(row => row.session_key_hash === values[0] && row.project_id === values[1]
      && (!query.includes("version_id =") || row.version_id === values[2]));
  };
  return Object.assign(tag, { begin: async (callback: (sql: Sql) => unknown) => callback(tag as unknown as Sql),
    json: (value: unknown) => value, end: async () => {} });
} }));

beforeEach(() => { db.rows = []; db.queries = []; db.catalog = structuredClone(nativeCatalog); });
const setup = async () => {
  const run = await workingRevisionFixture();
  await run.owner.create(run.access2, run.createInput);
  db.rows = [run.project1, run.project2].map(project => ({
    session_key_hash: docSha256(run.sessionId), client_key_hash: docSha256(run.identity.clientAddress),
    access_proof_hash: docSha256(run.access2.proof!), project_id: project.projectId, version_id: project.versionId,
    project_digest: project.projectDigest, payload_sha256: docSha256(stableStringify(project)), canonical_payload: project,
  }));
  const snapshots = createPostgresProjectSnapshotStore("postgres://offline");
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), run.fixture.sql);
  const moved = { ...run.access2, identity: { ...run.identity, clientAddress: "198.51.100.25" } };
  return { ...run, snapshots, archive, moved };
};

describe("PRJ exact capability / documentary recovery after network mobility", () => {
  it("opens, edits, saves, reloads and restores the exact existing draft after an IP change", async () => {
    const run = await setup();
    const protectedBefore = stableStringify([run.fixture.rows(), run.fixture.bodies(), run.fixture.intents(), db.rows]);
    const opened = await run.archive.workingRevisions!.open(run.moved, run.createInput);
    const original = structuredClone(opened.revision.content), edited = structuredClone(original);
    edited.sections[0].blocks[0].text += " Qualification éditoriale réversible.";
    const saved = await run.archive.workingRevisions!.save(run.moved, { revisionId: opened.revision.revisionId,
      expectedSaveSequence: opened.revision.saveSequence, content: edited });
    expect(saved.revision.saveSequence).toBe(2);
    const reloaded = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    expect((await reloaded.workingRevisions!.get(run.moved, saved.revision.revisionId)).revision).toEqual(saved.revision);
    const restored = await reloaded.workingRevisions!.save(run.moved, { revisionId: saved.revision.revisionId,
      expectedSaveSequence: saved.revision.saveSequence, content: original });
    expect(restored.revision.content).toEqual(original);
    expect(restored.revision.contentDigest).toBe(opened.revision.contentDigest);
    expect(restored.revision.saveSequence).toBe(3);
    expect((await reloaded.workingRevisions!.getSave(run.moved, { revisionId: saved.revision.revisionId,
      saveSequence: 2, contentDigest: saved.revision.contentDigest })).revision).toEqual(saved.revision);
    expect(stableStringify([run.fixture.rows(), run.fixture.bodies(), run.fixture.intents(), db.rows])).toBe(protectedBefore);
  });
  it("recovers G1/G2, bodies and the same saved draft, reloads without DDL/writes/IP rebinding", async () => {
    const run = await setup(), before = stableStringify([run.fixture.rows(), run.fixture.bodies(), run.fixture.revisions(), run.fixture.intents(), db.rows]);
    const from = run.fixture.queries.length;
    const history = await run.archive.history(run.moved, undefined, "DRCI");
    expect(history.entries.map(ref => ref.displayVersion)).toEqual([2, 1]);
    expect((await run.archive.body(run.moved, run.g1.ref.generationId)).body).toEqual(run.g1.body);
    expect((await run.archive.body(run.moved, run.g2.ref.generationId)).body).toEqual(run.g2.body);
    const revisions = run.archive.workingRevisions!;
    expect((await revisions.active(run.moved))[0].revisionId).toBe(run.createInput.revisionId);
    const opened = await revisions.open(run.moved, run.createInput);
    expect(opened.revision.revisionId).toBe(run.createInput.revisionId);
    expect(opened.revision.saveSequence).toBe(1);
    expect((await revisions.getSave(run.moved, { revisionId: opened.revision.revisionId, saveSequence: 1,
      contentDigest: opened.revision.contentDigest })).revision).toEqual(opened.revision);
    expect(await run.archive.finalizationIntents!.recoverForBase(run.moved, run.g2.ref.generationId, opened.revision.logicalDocumentRef)).toBeNull();
    const reloaded = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    expect((await reloaded.workingRevisions!.get(run.moved, opened.revision.revisionId)).revision).toEqual(opened.revision);
    expect(stableStringify([run.fixture.rows(), run.fixture.bodies(), run.fixture.revisions(), run.fixture.intents(), db.rows])).toBe(before);
    expect([...db.queries, ...run.fixture.queries.slice(from)].every(query => query.startsWith("select "))).toBe(true);
  });
  it.each([null, "x".repeat(43)])("never recovers with missing/foreign proof (%s)", async proof => {
    const run = await setup();
    await expect(run.archive.history({ ...run.moved, proof })).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
  });
  it.each(["session", "project", "version", "digest"])("keeps exact %s binding", async field => {
    const run = await setup();
    const access = { ...run.moved, identity: { ...run.moved.identity }, project: { ...run.moved.project } };
    if (field === "session") access.identity.sessionId += "-foreign";
    if (field === "project") access.project.projectId += "-foreign";
    if (field === "version") access.project.versionId = `${access.project.projectId}:version:99`;
    if (field === "digest") access.project.projectDigest = "ke1-0000000000000000";
    await expect(run.archive.history(access)).rejects.toMatchObject({ code: field === "version" ? "PROJECT_SNAPSHOT_VERSION_MISMATCH"
      : field === "digest" ? "PROJECT_SNAPSHOT_DIGEST_MISMATCH" : "PROJECT_SNAPSHOT_SESSION_MISMATCH" });
  });
  it("fails closed on a corrupt canonical snapshot even with the exact capability", async () => {
    const run = await setup(); db.rows[1].payload_sha256 = "0".repeat(64);
    await expect(run.archive.history(run.moved)).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_STORE_CORRUPT", status: 503 });
  });
  it("retains network authorization for providers, PRJ, generations and non-save revision mutations", async () => {
    const run = await setup();
    await expect(run.snapshots.resolve(run.moved.identity, run.moved.project, run.moved.proof)).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
    await expect(run.snapshots.persist(run.moved.identity, run.project2, run.moved.proof)).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
    await expect(run.archive.admit(run.moved, { requestId: "new-request", requestSha256: docSha256("new"), generatedAt: run.g2.ref.generatedAt, reservedBytes: 1000 })).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
    const revision = (await run.owner.get(run.access2, run.createInput.revisionId)).revision;
    await expect(run.archive.workingRevisions!.abandon(run.moved, { revisionId: revision.revisionId, expectedSaveSequence: 1 })).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
    await expect(run.archive.workingRevisions!.finalizeSave(run.moved, { revisionId: revision.revisionId, expectedSaveSequence: 1 },
      "studio-finalization-intent:ke1-0000000000000000")).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
    await expect(run.archive.workingRevisions!.open(run.moved, { ...run.createInput, nativeDocumentRef: "PROTOCOL_SYNOPSIS" })).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
  });
  it.each([null, "x".repeat(43)])("rejects mobile saves with missing/foreign proof (%s)", async proof => {
    const run = await setup();
    const current = (await run.owner.get(run.access2, run.createInput.revisionId)).revision;
    await expect(run.archive.workingRevisions!.save({ ...run.moved, proof }, { revisionId: current.revisionId,
      expectedSaveSequence: current.saveSequence, content: current.content })).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH", status: 403 });
  });
  it.each(["session", "project", "version", "digest"])("rejects mobile save with foreign %s", async field => {
    const run = await setup();
    const current = (await run.owner.get(run.access2, run.createInput.revisionId)).revision;
    const access = { ...run.moved, identity: { ...run.moved.identity }, project: { ...run.moved.project } };
    if (field === "session") access.identity.sessionId += "-foreign";
    if (field === "project") access.project.projectId += "-foreign";
    if (field === "version") access.project.versionId = `${access.project.projectId}:version:99`;
    if (field === "digest") access.project.projectDigest = "ke1-0000000000000000";
    await expect(run.archive.workingRevisions!.save(access, { revisionId: current.revisionId,
      expectedSaveSequence: current.saveSequence, content: current.content })).rejects.toMatchObject({
        code: field === "version" ? "PROJECT_SNAPSHOT_VERSION_MISMATCH" : field === "digest"
          ? "PROJECT_SNAPSHOT_DIGEST_MISMATCH" : "PROJECT_SNAPSHOT_SESSION_MISMATCH" });
  });
  it("rejects mobile saving against corrupt durable Project evidence", async () => {
    const run = await setup();
    const current = (await run.owner.get(run.access2, run.createInput.revisionId)).revision;
    db.rows[1].payload_sha256 = "0".repeat(64);
    await expect(run.archive.workingRevisions!.save(run.moved, { revisionId: current.revisionId,
      expectedSaveSequence: current.saveSequence, content: current.content })).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_STORE_CORRUPT" });
  });
  it("retains optimistic concurrency, exact native anchors and missing-revision refusal after mobility", async () => {
    const run = await setup();
    const original = (await run.owner.get(run.access2, run.createInput.revisionId)).revision;
    const edited = structuredClone(original.content); edited.sections[0].blocks[0].text += " Test réversible.";
    const saved = await run.archive.workingRevisions!.save(run.moved, { revisionId: original.revisionId,
      expectedSaveSequence: original.saveSequence, content: edited });
    await expect(run.archive.workingRevisions!.save(run.moved, { revisionId: original.revisionId,
      expectedSaveSequence: original.saveSequence, content: original.content })).rejects.toMatchObject({ code: "DOC_REVISION_SAVE_CONFLICT" });
    const foreign = structuredClone(saved.revision.content); foreign.sections[0].blocks[0].nativeAnchor += "-foreign";
    await expect(run.archive.workingRevisions!.save(run.moved, { revisionId: original.revisionId,
      expectedSaveSequence: saved.revision.saveSequence, content: foreign })).rejects.toBeInstanceOf(Error);
    await expect(run.archive.workingRevisions!.save(run.moved, { revisionId: "document-working-revision:foreign",
      expectedSaveSequence: 1, content: edited })).rejects.toMatchObject({ code: "DOC_REVISION_NOT_FOUND" });
    expect((await run.archive.workingRevisions!.get(run.moved, original.revisionId)).revision).toEqual(saved.revision);
  });
  it("rejects unknown server purposes and client-supplied recovery flags", async () => {
    const run = await setup();
    await expect(run.snapshots.resolve(run.moved.identity, run.moved.project, run.moved.proof, "ANYTHING" as ProjectSnapshotReadPurpose)).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH" });
    const response = await executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_HISTORY", sessionId: run.sessionId,
      projectRef: run.moved.project, beforeOrdinal: null, purpose: "DOCUMENT_RECOVERY" }, proof: run.moved.proof,
      clientAddress: run.moved.identity.clientAddress, connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots });
    expect(response.status).toBe(400);
    const revision = (await run.owner.get(run.access2, run.createInput.revisionId)).revision;
    const save = await executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_REVISION_SAVE", sessionId: run.sessionId,
      projectRef: run.moved.project, revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence,
      content: revision.content, purpose: "DOCUMENT_REVISION_SAVE" }, proof: run.moved.proof,
      clientAddress: run.moved.identity.clientAddress, connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots });
    expect(save.status).toBe(400);
  });
});
