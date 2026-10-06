import type { Sql } from "postgres";

/** CURRENT_STRUCTURAL_INVARIANT: SQL boundary double, not a scientific fixture.
 * Atomic rollback and serialization exercise the actual archive implementation. */
export const archiveSqlFixture = () => {
  let rows: Record<string, unknown>[] = [];
  let bodies: Record<string, unknown>[] = [];
  let tail: Promise<unknown> = Promise.resolve();
  const queries: string[] = [];
  const projectLockArguments: string[] = [];
  let failCommit = false;
  const tag = async (parts: TemplateStringsArray, ...v: unknown[]): Promise<Record<string, unknown>[]> => {
    const query = parts.join("?").replace(/\s+/gu, " ").trim(); queries.push(query);
    if (query.startsWith("select pg_advisory")) {
      if (v.length) {
        const argument = v[0];
        if (typeof argument !== "string" || argument.includes("\u0000")) throw new Error("POSTGRES_TEXT_LOCK_ARGUMENT_INVALID");
        projectLockArguments.push(argument);
      }
      return [];
    }
    if (query.startsWith("insert into noxia_durable.doc_generation_body")) {
      bodies.push({ session_key_hash: v[0], project_id: v[1], request_id: v[2], native_body_text: v[3], body_sha256: v[4] }); return [];
    }
    if (query.startsWith("insert into noxia_durable.doc_generation")) {
      rows.push({ session_key_hash: v[0], project_id: v[1], request_id: v[2], request_sha256: v[3], generated_at: v[4], reserved_bytes: v[5], state: "RESERVED", ordinal: v[6] }); return [];
    }
    if (query.startsWith("update noxia_durable.doc_generation")) {
      if (query.includes("state = 'REJECTED'")) {
        const row = rows.find(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.request_id === v[2] && r.state === "RESERVED");
        if (row) row.state = "REJECTED"; return [];
      }
      if (failCommit) throw new Error("OFFLINE_METADATA_WRITE_FAILURE");
      const row = rows.find(r => r.session_key_hash === v[4] && r.project_id === v[5] && r.request_id === v[6])!;
      Object.assign(row, { state: "COMMITTED", generation_id: v[0], body_sha256: v[1], body_bytes: v[2], metadata: structuredClone(v[3]) }); return [];
    }
    if (query.startsWith("select count(*)")) {
      if (query.includes("active_writes")) return [{ active_writes: rows.filter(r => r.state === "RESERVED").length }];
      const project = rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1]);
      return [{ generations: project.filter(r => r.state !== "REJECTED").length, bytes: project.reduce((sum, r) => sum + Number(r.state === "COMMITTED" ? r.body_bytes : r.state === "RESERVED" ? r.reserved_bytes : 0), 0),
        writes: project.filter(r => r.state === "RESERVED").length, last_ordinal: Math.max(0, ...project.map(r => Number(r.ordinal))) }];
    }
    if (query.startsWith("select coalesce(max((metadata")) return [{ last_label: Math.max(0, ...rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.state === "COMMITTED" && (r.metadata as { family: string }).family === v[2]).map(r => Number((r.metadata as { displayVersion: number }).displayVersion))) }];
    if (query.startsWith("select g.metadata")) {
      const row = rows.find(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.generation_id === v[2] && r.state === "COMMITTED");
      return row ? [{ metadata: row.metadata, ...bodies.find(b => b.request_id === row.request_id && b.session_key_hash === row.session_key_hash && b.project_id === row.project_id) }] : [];
    }
    if (query.startsWith("select metadata")) {
      const filtered = query.includes("metadata->>'family'");
      return rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.state === "COMMITTED"
        && (!filtered || (r.metadata as { family: string }).family === v[2]) && Number(r.ordinal) < Number(v[filtered ? 3 : 2]))
        .sort((a, b) => Number(b.ordinal) - Number(a.ordinal)).slice(0, Number(v[filtered ? 4 : 3])).map(r => ({ metadata: structuredClone(r.metadata) }));
    }
    if (query.startsWith("select generation_id")) return rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.state === "COMMITTED"
      && (r.metadata as { family: string }).family === v[2])
      .sort((a, b) => Number(b.ordinal) - Number(a.ordinal)).slice(0, 1).map(r => ({ generation_id: r.generation_id }));
    if (query.startsWith("select body_sha256")) return rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.generation_id === v[2] && r.state === "COMMITTED").map(r => ({ body_sha256: r.body_sha256 }));
    if (query.startsWith("select *") || query.startsWith("select request_id")) return rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.request_id === v[2]).map(r => structuredClone(r));
    throw new Error(`UNEXPECTED_ARCHIVE_SQL:${query}`);
  };
  const sql = Object.assign(tag, {
    unsafe: async (statement: string) => { queries.push(statement); return []; }, json: (value: unknown) => value,
    begin: <T>(callback: (transaction: typeof sql) => Promise<T>) => {
      const next = tail.then(async () => {
        // Only row settlement mutates fields. Immutable TEXT/metadata are shared
        // safely; copying hundreds of frozen bodies would test the double's RAM,
        // not the archive. A failed transaction still restores all row changes.
        const beforeRows = rows.map(row => ({ ...row })), beforeBodies = [...bodies];
        try { return await callback(sql); } catch (error) { rows = beforeRows; bodies = beforeBodies; throw error; }
      });
      tail = next.catch(() => {}); return next;
    },
  });
  return { sql: sql as unknown as Sql, queries, projectLockArguments, rows: () => structuredClone(rows), bodies: () => structuredClone(bodies),
    failMetadataCommit: (fail: boolean) => { failCommit = fail; } };
};
