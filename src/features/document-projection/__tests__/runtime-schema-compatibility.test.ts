import { describe, expect, it } from "vitest";
import type { Sql } from "postgres";
import nativeCatalog from "./runtime-schema-catalog.json";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { workingRevisionFixture } from "./working-revision-fixture";
import { createRuntimeSchemaVerification, runtimeSchemaFingerprint } from "../../../../server/protocol-designer-schema-compatibility";
import { runtimeSchemaFingerprints, type RuntimeSchemaTable } from "../../../../server/protocol-designer-runtime-schema-contract";
import { createPostgresDocumentArchive, documentArchiveCapacity, DocumentArchiveError } from "../../../../server/protocol-designer-document-archive";
import { ProjectSnapshotError } from "../../../../server/protocol-designer-project-snapshot";

const tables = Object.keys(runtimeSchemaFingerprints) as RuntimeSchemaTable[];
const verification = (sql: Sql) => createRuntimeSchemaVerification(sql, tables, "DOC_ARCHIVE", code => new DocumentArchiveError(code, 503));
describe("explicit installation / read-only runtime schema compatibility", () => {
  it("native PostgreSQL catalog fixture matches all five qualified contracts", () => {
    for (const row of nativeCatalog)
      expect(runtimeSchemaFingerprint(row)).toBe(runtimeSchemaFingerprints[row.table_name as RuntimeSchemaTable]);
  });
  it("one SELECT per cold owner, shared by concurrent checks, no runtime DDL", async () => {
    const fixture = archiveSqlFixture(), verify = verification(fixture.sql);
    await Promise.all([verify(), verify(), verify()]);
    expect(fixture.queries).toHaveLength(1);
    expect(fixture.queries[0]).toMatch(/^select /u);
    await verification(fixture.sql)();
    expect(fixture.queries).toHaveLength(2);
  });
  it("checks NOT NULL through column metadata, not PostgreSQL 18 duplicate constraint rows", async () => {
    const fixture = archiveSqlFixture();
    await verification(fixture.sql)();
    expect(fixture.queries[0]).toContain("'notNull', a.attnotnull");
    expect(fixture.queries[0]).toContain("k.contype <> 'n'");
    expect(fixture.queries[0]).toContain("'validated', k.convalidated");
    expect(fixture.queries[0]).toContain("not nn.convalidated");
    expect(fixture.queries[0]).toContain("to_jsonb(nn)->>'conenforced'");
    expect(fixture.queries[0]).toContain("k.convalidated and coalesce((to_jsonb(k)->>'conenforced')::boolean, true)");
  });
  it("a missing NOT NULL still fails closed independently of constraint representation", async () => {
    const fixture = archiveSqlFixture(), changed = structuredClone(nativeCatalog);
    changed.find(row => row.table_name === "public_project_snapshot")!.columns
      .find(column => column.name === "access_proof_hash")!.notNull = false;
    fixture.setSchemaCatalog(changed);
    await expect(verification(fixture.sql)()).rejects.toMatchObject({ code: "DOC_ARCHIVE_SCHEMA_INCOMPATIBLE", status: 503 });
  });
  it.each(tables)("missing %s fails closed, is bounded and does not self-install", async table => {
    const fixture = archiveSqlFixture();
    fixture.setSchemaCatalog(nativeCatalog.filter(row => row.table_name !== table));
    await expect(verification(fixture.sql)()).rejects.toMatchObject({ code: "DOC_ARCHIVE_SCHEMA_MISSING", status: 503 });
    expect(fixture.queries).toHaveLength(1);
  });
  it.each(["columns", "constraints", "indexes", "triggers"] as const)("incompatible %s fails closed without repair", async field => {
    const fixture = archiveSqlFixture(), changed = structuredClone(nativeCatalog);
    changed.find(row => row.table_name === "doc_working_revision")![field] = [] as never;
    fixture.setSchemaCatalog(changed);
    await expect(verification(fixture.sql)()).rejects.toMatchObject({ code: "DOC_ARCHIVE_SCHEMA_INCOMPATIBLE", status: 503 });
    expect(fixture.queries).toHaveLength(1);
  });
  it("failed check is not cached; an EXTERNAL authorized installation permits retry", async () => {
    const fixture = archiveSqlFixture(), verify = verification(fixture.sql);
    fixture.setSchemaCatalog([]);
    await expect(verify()).rejects.toThrow("DOC_ARCHIVE_SCHEMA_MISSING");
    fixture.setSchemaCatalog(nativeCatalog);
    await verify();
    expect(fixture.queries).toHaveLength(2);
  });
  it("catalog access error preserves bounded owner code, never SQL/credentials", async () => {
    const sql = (async () => { throw new Error("private-connection-string"); }) as unknown as Sql;
    const verify = createRuntimeSchemaVerification(sql, ["public_project_snapshot"], "PROJECT_SNAPSHOT",
      code => new ProjectSnapshotError(code, 503));
    await expect(verify()).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SCHEMA_VERIFICATION_FAILED", status: 503 });
    await expect(verify()).rejects.not.toThrow("private-connection-string");
  });
  it.each([
    ["doc_generation", "DOC_ARCHIVE", "history"],
    ["doc_working_revision", "DOC_REVISION", "revision"],
    ["doc_studio_finalization_intent", "STUDIO_INTENT", "intent"],
  ] as const)("native %s owner surfaces its missing-schema failure before normal writes", async (table, owner, operation) => {
    const run = await workingRevisionFixture(), beforeBodies = run.fixture.bodies();
    await run.owner.create(run.access2, run.createInput);
    run.fixture.setSchemaCatalog(nativeCatalog.filter(row => row.table_name !== table));
    const cold = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    const call = operation === "history" ? cold.history(run.access2)
      : operation === "revision" ? cold.workingRevisions!.create(run.access2, run.createInput)
      : cold.finalizationIntents!.recoverActive(run.access2, run.createInput.revisionId);
    await expect(call).rejects.toMatchObject({ code: `${owner}_SCHEMA_MISSING`, status: 503 });
    expect(run.fixture.bodies()).toEqual(beforeBodies);
    expect(run.fixture.queries.some(query => /^(create|alter|drop|grant|do)\b/iu.test(query))).toBe(false);
  });
});
