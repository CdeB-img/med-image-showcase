import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Sql } from "postgres";
import { migrateProtocolDesignerDurableGuard } from "../../../../server/protocol-designer-durable-guard";

// CURRENT_STRUCTURAL_INVARIANT / schema equivalence, no DB.
// Fingerprint of the 17 effective statements in acab54c59's campaign helper,
// normalized only for whitespace/case. SQL comment is metadata, not schema.
const baselineSchemaHash = "dd48eb8252517de87ce31c20d60f66875cfb475baa17782fcd8479c13ff176a9";
describe("durable guard canonical migration", () => {
  it("is exactly equivalent to the previously effective campaign schema", async () => {
    const unsafe = vi.fn().mockResolvedValue([]);
    await migrateProtocolDesignerDurableGuard({ unsafe } as unknown as Sql);
    const sql = unsafe.mock.calls[0][0] as string;
    const statements = sql.split("comment on schema")[0];
    expect(statements.split(";").filter(item => item.trim())).toHaveLength(17);
    expect(createHash("sha256").update(statements.toLowerCase().replace(/\s+/gu, "")).digest("hex")).toBe(baselineSchemaHash);
    expect(unsafe).toHaveBeenCalledOnce();
    expect(sql).toBe(readFileSync(resolve("server/migrations/001_protocol_designer_durable_guard.sql"), "utf8"));
  });

  it("does not introduce schema mutation into normal guard execution", () => {
    const source = readFileSync(resolve("server/protocol-designer-durable-guard.ts"), "utf8");
    const runtime = source.slice(source.indexOf("export const createPostgresProtocolDesignerDurableGuard"));
    expect(runtime).not.toContain("migrateProtocolDesignerDurableGuard(");
    expect(runtime).not.toMatch(/create table|alter table|create schema/iu);
  });
});
