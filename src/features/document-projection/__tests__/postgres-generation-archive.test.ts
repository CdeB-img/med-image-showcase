import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256, type DocumentArchiveAccess } from "../../../../server/protocol-designer-document-archive";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { confirmResearchProjectContribution } from "../../research-project-construction/contribution-owner-boundary";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { DOC_ARCHIVE_CONTRACT, documentNativeGeneratedAt, type DocumentGenerationBody } from "../generation-persistence";
import { portableDrciFixture } from "./portable-drci-fixture";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { logicalDigest } from "../../knowledge-engine/canonical";

const setup = async (limits = {}) => {
  const sessionId = "protocol-designer-session:archive-test";
  const snapshots = memoryProjectSnapshotStore();
  const project = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([{ turnId: "source", role: "USER", content: COLCHICINE_INITIAL, createdAt: "2026-10-05T10:00:00.000Z" }]),
    current: null, projectId: `${sessionId}:research-project`, confirmedAt: "2026-10-05T10:00:00.000Z",
    authority: { actorRef: "synthetic-owner", mandateRef: "PROJECT_OWNER", authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED" } });
  const identity = { sessionId, clientAddress: "192.0.2.1" };
  const registration = await snapshots.persist(identity, project, null);
  const access: DocumentArchiveAccess = { identity, project: registration.ref, proof: registration.proof };
  const fixture = archiveSqlFixture();
  const store = createPostgresDocumentArchive("postgres://offline", snapshots, { ...documentArchiveCapacity({}), ...limits }, fixture.sql);
  const { ancestor } = portableDrciFixture();
  const bodyFor = (index: number): DocumentGenerationBody => {
    const { packDigest: _digest, ...original } = ancestor;
    const material = { ...original, project: { projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest },
      generatedAt: new Date(Date.UTC(2026, 9, 5, 10, 0, index)).toISOString() };
    return { contract: DOC_ARCHIVE_CONTRACT, native: { family: "DRCI", value: { ...material, packDigest: logicalDigest(material) } },
      files: [{ artifactId: `drci-document:${index}`, fileName: "protocol.html", format: "HTML", mimeType: "text/html", content: "<p>Mesure quantitative, consentement et incertitudes conservées.</p>",
        byteLength: Buffer.byteLength("<p>Mesure quantitative, consentement et incertitudes conservées.</p>"), sha256: docSha256("<p>Mesure quantitative, consentement et incertitudes conservées.</p>"), renderOrigin: "GENERATION_TIME" }],
      rendererVersion: "1.0.0", buildCommit: null };
  };
  const admit = (index: number) => store.admit(access, { requestId: `request-${index}`, requestSha256: docSha256(`native-intent-${index}`), generatedAt: documentNativeGeneratedAt(bodyFor(index).native), reservedBytes: 1_000_000 });
  return { store, fixture, access, bodyFor, admit };
};

describe("transactional DOC-owned Postgres archive (offline SQL boundary)", () => {
  it("commits exact bytes, immutable references and idempotent receipts", async () => {
    const { store, fixture, access, bodyFor, admit } = await setup();
    await admit(1); const body = bodyFor(1);
    const receipt = await store.commit(access, "request-1", body);
    expect(receipt.generation.bodySha256).toBe(docSha256(JSON.stringify(body)));
    expect(await store.commit(access, "request-1", body)).toEqual(receipt);
    expect(fixture.bodies()).toHaveLength(1);
    expect((await store.body(access, receipt.generation.generationId)).body).toEqual(body);
    expect((await admit(1)).receipt).toEqual(receipt);
    await expect(store.commit(access, "request-1", { ...body, rendererVersion: "different" })).rejects.toThrow("DOC_ARCHIVE_CONTENT_DIVERGENCE");
    await expect(store.admit(access, { requestId: "request-1", requestSha256: docSha256("other"), generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: 1_000_000 })).rejects.toThrow("DOC_ARCHIVE_REQUEST_DIVERGENCE");
  });
  it("rolls body insertion back if metadata settlement fails, then recovers the same reservation", async () => {
    const { store, fixture, access, bodyFor, admit } = await setup();
    await admit(1); fixture.failMetadataCommit(true);
    await expect(store.commit(access, "request-1", bodyFor(1))).rejects.toThrow("OFFLINE_METADATA_WRITE_FAILURE");
    expect(fixture.bodies()).toHaveLength(0); expect(await store.receipt(access, "request-1")).toBeNull();
    fixture.failMetadataCommit(false); await store.commit(access, "request-1", bodyFor(1));
    expect(fixture.bodies()).toHaveLength(1); expect(fixture.rows()[0].ordinal).toBe(1);
  });
  it("paginates metadata only, with frozen labels rather than page-derived labels", async () => {
    const { store, fixture, access, bodyFor, admit } = await setup();
    for (let i = 1; i <= 30; i++) { await admit(i); await store.commit(access, `request-${i}`, bodyFor(i), 100 + i); }
    const before = fixture.queries.length; const page = await store.history(access);
    expect(page.entries).toHaveLength(25); expect(page.entries[0].displayVersion).toBe(130);
    expect(page.nextBeforeOrdinal).toBe(6);
    expect((await store.history(access, page.nextBeforeOrdinal!)).entries.map(r => r.displayVersion)).toEqual([105, 104, 103, 102, 101]);
    expect(fixture.queries.slice(before).join(" ")).not.toContain("doc_generation_body");
    expect(JSON.stringify(page)).not.toContain("Mesure quantitative");
  });
  it("denies capacity before dispatch and serializes concurrent reservations", async () => {
    const { store, fixture, access, admit } = await setup({ maxConcurrentDocWrites: 1 });
    const results = await Promise.allSettled([admit(1), admit(2)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(fixture.rows()).toHaveLength(1);
    await expect(store.admit(access, { requestId: "oversize", requestSha256: docSha256("x"), generatedAt: "2026-10-05T10:00:00.000Z", reservedBytes: 4_000_001 })).rejects.toThrow("DOC_ARCHIVE_CAPACITY_EXCEEDED");
  });
  it("rejects cross-session, cross-project, invalid proof and changed network on every read", async () => {
    const { store, access, bodyFor, admit } = await setup();
    await admit(1); const receipt = await store.commit(access, "request-1", bodyFor(1));
    for (const forbidden of [{ ...access, proof: "wrong" }, { ...access, identity: { ...access.identity, sessionId: "another" } },
      { ...access, identity: { ...access.identity, clientAddress: "192.0.2.2" } }, { ...access, project: { ...access.project, projectId: "another-project" } }]) {
      await expect(store.history(forbidden)).rejects.toThrow();
      await expect(store.body(forbidden, receipt.generation.generationId)).rejects.toThrow();
      await expect(store.receipt(forbidden, "request-1")).rejects.toThrow();
    }
  });
  it("defines immutable tables, history index, TEXT body and no pruning/cascade", () => {
    const migration = readFileSync("server/migrations/002_doc_generation_archive.sql", "utf8");
    expect(migration).toContain("native_body_text text not null");
    expect(migration).toContain("doc_generation_history_idx");
    expect(migration).toContain("DOC_ARCHIVE_IMMUTABLE");
    expect(migration.toLowerCase()).not.toContain("on delete cascade");
  });
});
