import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256, documentArchiveProjectLockIdentity, type DocumentArchiveAccess } from "../../../../server/protocol-designer-document-archive";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { confirmResearchProjectContribution } from "../../research-project-construction/contribution-owner-boundary";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { DOC_ARCHIVE_CONTRACT, documentNativeGeneratedAt, type DocumentGenerationBody } from "../generation-persistence";
import { portableDrciFixture } from "./portable-drci-fixture";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";
import type { DocumentHistoryPage } from "../generation-persistence";

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
  return { store, fixture, access, bodyFor, admit, snapshots, project };
};

describe("transactional DOC-owned Postgres archive (offline SQL boundary)", () => {
  it("filters technical projections before user-history pagination and keeps generation ordinals/lineage independent", async () => {
    const run = await setup();
    const handoffDecision = authorizeResearchProjectDocumentHandoff({ project: run.project,
      authority: { actorRef: "synthetic-owner", mandateRef: "PROJECT_OWNER", authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED" },
      confirmedAt: "2026-10-05T10:00:00.000Z" });
    let previous: ReturnType<typeof refreshFunctionalResetDocumentPortfolio> | undefined;
    const realIds: string[] = [], technicalIds: string[] = [];
    for (let i = 1; i <= 30; i++) {
      const real = run.bodyFor(i);
      previous = refreshFunctionalResetDocumentPortfolio({ project: run.project, previous, handoffDecision,
        requestedAt: documentNativeGeneratedAt(real.native), generateProtocol: true });
      const technical: DocumentGenerationBody = { ...real, native: { family: "TEMPLATE", value: previous.projections.at(-1)! } };
      for (const [suffix, body] of [["projection", technical], ["real", real]] as const) {
        const requestId = `${suffix}-${i}`;
        await run.store.admit(run.access, { requestId, requestSha256: docSha256(JSON.stringify(body)),
          generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: 1_000_000 });
        const receipt = await run.store.commit(run.access, requestId, body);
        (suffix === "real" ? realIds : technicalIds).push(receipt.generation.generationId);
        if (suffix === "real") {
          expect(receipt.generation.displayVersion).toBe(i);
          expect(receipt.generation.predecessorId).toBe(i === 1 ? null : realIds[i - 2]);
        }
      }
    }
    const history = async (beforeOrdinal: number | null) => {
      const result = await executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_HISTORY", sessionId: run.access.identity.sessionId,
        projectRef: run.access.project, beforeOrdinal }, proof: run.access.proof, clientAddress: run.access.identity.clientAddress,
        connection: null, environment: {}, snapshots: run.snapshots, archive: run.store });
      expect(result.status).toBe(200);
      return (result.body as { result: DocumentHistoryPage }).result;
    };
    const queryCount = run.fixture.queries.length;
    const first = await history(null), second = await history(first.nextBeforeOrdinal);
    expect(first.entries.map(ref => ref.displayVersion)).toEqual(Array.from({ length: 25 }, (_, i) => 30 - i));
    expect(second.entries.map(ref => ref.displayVersion)).toEqual([5, 4, 3, 2, 1]);
    expect(second.nextBeforeOrdinal).toBeNull();
    expect([...first.entries, ...second.entries].map(ref => ref.generationId)).toEqual([...realIds].reverse());
    expect(run.fixture.queries.slice(queryCount).join(" ")).not.toContain("doc_generation_body");
    expect((await run.store.history(run.access)).entries.some(ref => ref.family === "TEMPLATE")).toBe(true);
    expect((await run.store.body(run.access, technicalIds[0])).body.native.family).toBe("TEMPLATE");
  });
  it("encodes an unambiguous, namespaced and PostgreSQL-safe Project lock tuple", () => {
    const identity = documentArchiveProjectLockIdentity;
    expect(identity("ab", "c")).not.toBe(identity("a", "bc"));
    expect(identity("a\u0000b", "c")).not.toBe(identity("a", "b\u0000c"));
    expect(identity("session", "project-1")).not.toBe(identity("session", "project-2"));
    expect(identity("session-1", "project")).not.toBe(identity("session-2", "project"));
    expect(identity("session", "project")).toBe(identity("session", "project"));
    expect(identity("session", "project")).not.toContain("\u0000");
    expect(identity("session", "project")).toMatch(/^[a-f0-9]{64}$/u);
    expect(identity("session", "project")).not.toBe(docSha256(JSON.stringify(["another-owner", "session", "project"])));
  });
  it("keeps different requests under the same Project lock and request identities distinct", async () => {
    const { store, fixture, access, bodyFor, admit, snapshots } = await setup();
    await admit(1); await store.commit(access, "request-1", bodyFor(1));
    await admit(2); await store.commit(access, "request-2", bodyFor(2));
    await store.reject(access, "request-2");
    expect(new Set(fixture.projectLockArguments).size).toBe(1);
    expect(fixture.projectLockArguments[0]).toBe(documentArchiveProjectLockIdentity(docSha256(access.identity.sessionId), access.project.projectId));
    expect(fixture.rows().map(row => row.request_id)).toEqual(["request-1", "request-2"]);
    expect(fixture.rows().map(row => row.ordinal)).toEqual([1, 2]);
    const reloaded = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql);
    const receipt = await reloaded.admit(access, { requestId: "request-1", requestSha256: docSha256("native-intent-1"),
      generatedAt: documentNativeGeneratedAt(bodyFor(1).native), reservedBytes: 1_000_000 });
    expect(receipt.receipt?.generation.ordinal).toBe(1);
    expect(new Set(fixture.projectLockArguments).size).toBe(1);
    expect(fixture.rows()).toHaveLength(2);
  });
  it("serializes concurrent identical admission/commit without duplicate rows or bodies", async () => {
    const { store, fixture, access, bodyFor, admit } = await setup();
    await Promise.all([admit(1), admit(1)]);
    const receipts = await Promise.all([store.commit(access, "request-1", bodyFor(1)), store.commit(access, "request-1", bodyFor(1))]);
    expect(receipts[0]).toEqual(receipts[1]);
    expect(fixture.rows()).toHaveLength(1); expect(fixture.bodies()).toHaveLength(1);
    expect(new Set(fixture.projectLockArguments).size).toBe(1);
  });
  it("serializes different DRCI commands for one Project digest and reuses the sole committed generation", async () => {
    const { store, fixture, access, bodyFor } = await setup();
    const intent = (suffix: string) => ({ family: "DRCI" as const,
      requestId: `drci-draft:${access.project.projectDigest}:${suffix}`, requestSha256: docSha256(suffix),
      generatedAt: documentNativeGeneratedAt(bodyFor(1).native), reservedBytes: 1_000_000 });
    const results = await Promise.allSettled([store.admit(access, intent("click-1")), store.admit(access, intent("click-2"))]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(result => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: "DOC_ARCHIVE_GENERATION_IN_PROGRESS", status: 409 });
    expect(fixture.rows()).toHaveLength(1);
    const reserved = results.find(result => result.status === "fulfilled") as PromiseFulfilledResult<Awaited<ReturnType<typeof store.admit>>>;
    const committed = await store.commit(access, reserved.value.requestId, bodyFor(1));
    const reused = await store.admit(access, intent("click-3"));
    expect(reused.receipt?.generation).toEqual(committed.generation);
    expect(reused.receipt?.requestId).toBe(intent("click-3").requestId);
    expect(fixture.rows()).toHaveLength(1); expect(fixture.bodies()).toHaveLength(1);
    expect(new Set(fixture.projectLockArguments).size).toBe(1);
  });
  it("releases a known failed DRCI command for explicit retry without a false successful generation", async () => {
    const { store, fixture, access, bodyFor } = await setup();
    const intent = (suffix: string) => ({ family: "DRCI" as const,
      requestId: `drci-draft:${access.project.projectDigest}:${suffix}`, requestSha256: docSha256(suffix),
      generatedAt: documentNativeGeneratedAt(bodyFor(1).native), reservedBytes: 1_000_000 });
    await store.admit(access, intent("failed")); await store.reject(access, intent("failed").requestId);
    await store.admit(access, intent("retry"));
    const receipt = await store.commit(access, intent("retry").requestId, bodyFor(1));
    expect(receipt.generation.displayVersion).toBe(1);
    expect(receipt.generation.predecessorId).toBeNull();
    expect(fixture.rows().map(row => row.state)).toEqual(["REJECTED", "COMMITTED"]);
    expect(fixture.bodies()).toHaveLength(1);
  });
  it("does not redispatch beside an existing pre-digest DOC reservation", async () => {
    const { store, fixture, access, bodyFor } = await setup();
    const legacy = { requestId: "drci-draft:existing-command", requestSha256: docSha256("existing-command"),
      generatedAt: documentNativeGeneratedAt(bodyFor(1).native), reservedBytes: 1_000_000 };
    await store.admit(access, legacy);
    await expect(store.admit(access, { ...legacy, family: "DRCI",
      requestId: `drci-draft:${access.project.projectDigest}:new-command` })).rejects.toMatchObject({ code: "DOC_ARCHIVE_GENERATION_IN_PROGRESS" });
    expect(fixture.rows()).toHaveLength(1);
    await store.reject(access, legacy.requestId);
    expect((await store.admit(access, { ...legacy, family: "DRCI",
      requestId: `drci-draft:${access.project.projectDigest}:explicit-retry` })).receipt).toBeNull();
  });
  it("rejects a NUL SQL lock parameter instead of silently letting the adapter continue", async () => {
    const fixture = archiveSqlFixture();
    await expect(fixture.sql`select pg_advisory_xact_lock(hashtext(${"session\u0000project"}))`).rejects.toThrow("POSTGRES_TEXT_LOCK_ARGUMENT_INVALID");
    expect(fixture.rows()).toHaveLength(0);
  });
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
  it("rejects reuse of a committed native identity through another request, without overwriting it", async () => {
    const { store, fixture, access, bodyFor, admit } = await setup();
    await admit(1); const body = bodyFor(1), original = await store.commit(access, "request-1", body);
    await store.admit(access, { requestId: "same-native-new-request", requestSha256: docSha256("duplicate"), generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: 1_000_000 });
    await expect(store.commit(access, "same-native-new-request", body)).rejects.toThrow("DOC_ARCHIVE_GENERATION_ALREADY_COMMITTED");
    await expect(store.commit(access, "same-native-new-request", { ...body, rendererVersion: "different" })).rejects.toThrow("DOC_ARCHIVE_CONTENT_DIVERGENCE");
    expect(fixture.bodies()).toHaveLength(1);
    expect((await store.body(access, original.generation.generationId)).body).toEqual(body);
  });
  it.each([{ maxGenerationsPerProject: 1 }, { maxTotalDocBytesPerProject: 1_000_000 }])("holds capacity conservatively and releases only known terminal storage reservations: %j", async limits => {
    const { store, fixture, access, admit } = await setup(limits);
    await admit(1); await expect(admit(2)).rejects.toThrow("DOC_ARCHIVE_CAPACITY_EXCEEDED");
    await store.reject(access, "request-1"); await store.reject(access, "request-1");
    expect(fixture.rows()[0].state).toBe("REJECTED"); expect(await store.receipt(access, "request-1")).toBeNull();
    await expect(admit(1)).rejects.toThrow("DOC_ARCHIVE_INTENT_TERMINAL");
    await admit(2); expect(fixture.rows()).toHaveLength(2);
  });
  it("rejects invalid capacity configuration instead of guessing a writable limit", () => {
    for (const value of ["", "-1", "0", "NaN", "1.5"]) expect(() => documentArchiveCapacity({ NOXIA_DOC_MAX_GENERATIONS_PER_PROJECT: value })).toThrow("DOC_ARCHIVE_CAPACITY_CONFIG_INVALID");
  });
  it("paginates metadata only, with frozen labels rather than page-derived labels", async () => {
    const { store, fixture, access, bodyFor, admit } = await setup();
    for (let i = 1; i <= 30; i++) { await admit(i); await store.commit(access, `request-${i}`, bodyFor(i)); }
    const before = fixture.queries.length; const page = await store.history(access);
    expect(page.entries).toHaveLength(25); expect(page.entries[0].displayVersion).toBe(30);
    expect(page.nextBeforeOrdinal).toBe(6);
    expect((await store.history(access, page.nextBeforeOrdinal!)).entries.map(r => r.displayVersion)).toEqual([5, 4, 3, 2, 1]);
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
