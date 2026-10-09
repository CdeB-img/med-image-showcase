import type { Sql } from "postgres";
import nativeSchemaCatalog from "./runtime-schema-catalog.json";

/** CURRENT_STRUCTURAL_INVARIANT: SQL boundary double, not a scientific fixture.
 * Atomic rollback and serialization exercise the actual archive implementation. */
export const archiveSqlFixture = () => {
  let rows: Record<string, unknown>[] = [];
  let bodies: Record<string, unknown>[] = [];
  let revisions: Record<string, unknown>[] = [];
  let intents: Record<string, unknown>[] = [];
  const snapshots: Record<string, unknown>[] = [];
  let tail: Promise<unknown> = Promise.resolve();
  const queries: string[] = [];
  const projectLockArguments: string[] = [];
  let failCommit = false;
  let failRevision = false;
  let failIntent = false;
  let schemaCatalog: Record<string, unknown>[] = structuredClone(nativeSchemaCatalog);
  const tag = async (parts: TemplateStringsArray, ...v: unknown[]): Promise<Record<string, unknown>[]> => {
    const query = parts.join("?").replace(/\s+/gu, " ").trim(); queries.push(query);
    if (query.startsWith("select c.relname as table_name")) return structuredClone(schemaCatalog
      .filter(row => (v[0] as string[]).includes(String(row.table_name))));
    if (query.startsWith("select pg_advisory")) {
      if (v.length) {
        const argument = v[0];
        if (typeof argument !== "string" || argument.includes("\u0000")) throw new Error("POSTGRES_TEXT_LOCK_ARGUMENT_INVALID");
        projectLockArguments.push(argument);
      }
      return [];
    }
    if (query.startsWith("select revision from (")) {
      const latest = new Map<string, Record<string, unknown>>();
      for (const row of revisions.filter(r => r.session_key_hash === v[0] && r.project_id === v[1]
        && (query.includes(") active_drafts") || r.base_generation_id === v[2] && r.logical_document_ref === v[3]))) {
        const previous = latest.get(String(row.revision_id));
        if (!previous || Number(row.save_sequence) > Number(previous.save_sequence)) latest.set(String(row.revision_id), row);
      }
      return [...latest.values()].filter(r => r.status === "ACTIVE").slice(0, query.includes(") active_drafts") ? 100 : 2).map(r => ({ revision: structuredClone(r.revision) }));
    }
    if (query.startsWith("select distinct intent_id from noxia_durable.doc_studio_finalization_intent")) return [...new Set(intents
      .filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.revision_id === v[2] && r.save_sequence === v[3]
        && JSON.parse(String(r.record_text)).frozen.workingRevisionContentDigest === v[4]).map(r => String(r.intent_id)))]
      .slice(0, 2).map(intent_id => ({ intent_id }));
    if (query.startsWith("select intent_id from (")) {
      const latest = new Map<string, Record<string, unknown>>();
      for (const row of intents.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && (query.includes("baseGenerationId")
        ? JSON.parse(String(r.record_text)).frozen.baseGenerationId === v[2] && JSON.parse(String(r.record_text)).frozen.logicalDocumentRef === v[3]
        : r.revision_id === v[2]))) {
        const previous = latest.get(String(row.intent_id));
        if (!previous || Number(row.sequence) > Number(previous.sequence)) latest.set(String(row.intent_id), row);
      }
      return [...latest.values()].filter(row => JSON.parse(String(row.record_text)).state !== "CLOSED").slice(0, 2).map(row => ({ intent_id: row.intent_id }));
    }
    if (query.startsWith("select record_text, record_sha256 from noxia_durable.doc_studio_finalization_intent")) return intents
      .filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.intent_id === v[2])
      .sort((a, b) => Number(b.sequence) - Number(a.sequence)).slice(0, 1).map(r => structuredClone(r));
    if (query.startsWith("insert into noxia_durable.doc_studio_finalization_intent")) {
      if (failIntent) throw new Error("OFFLINE_INTENT_WRITE_FAILURE");
      if (intents.some(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.intent_id === v[2] && r.sequence === v[3]))
        throw new Error("DOC_INTENT_DUPLICATE_SEQUENCE");
      intents.push({ session_key_hash: v[0], project_id: v[1], intent_id: v[2], sequence: v[3], revision_id: v[4],
        save_sequence: v[5], intent_digest: v[6], record_text: v[7], record_sha256: v[8] }); return [];
    }
    if (query.startsWith("select revision from noxia_durable.doc_working_revision")) return revisions
      .filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.revision_id === v[2]
        && (!query.includes("and save_sequence =") || r.save_sequence === v[3]))
      .sort((a, b) => Number(b.save_sequence) - Number(a.save_sequence)).slice(0, 1).map(r => ({ revision: structuredClone(r.revision) }));
    if (query.startsWith("insert into noxia_durable.doc_working_revision")) {
      if (failRevision) throw new Error("OFFLINE_REVISION_WRITE_FAILURE");
      if (revisions.some(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.revision_id === v[2] && r.save_sequence === v[3]))
        throw new Error("DOC_REVISION_DUPLICATE_SEQUENCE");
      revisions.push({ session_key_hash: v[0], project_id: v[1], revision_id: v[2], save_sequence: v[3],
        base_generation_id: v[4], base_body_sha256: v[5], logical_document_ref: v[6], status: v[7], revision: structuredClone(v[8]) });
      return [];
    }
    if (query.startsWith("select version_id, project_digest from noxia_durable.public_project_snapshot")) return snapshots
      .filter(r => r.session_key_hash === v[0] && r.project_id === v[1]).sort((a, b) => Number(b.revision) - Number(a.revision)).slice(0, 1);
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
    if (query.startsWith("select request_id") && query.includes("metadata->>'family' = 'DRCI'")) return rows
      .filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.state === "COMMITTED" && (r.metadata as { family: string }).family === "DRCI")
      .sort((a, b) => Number(b.ordinal) - Number(a.ordinal)).slice(0, 1).map(r => structuredClone(r));
    if (query.startsWith("select request_id") && query.includes("left(request_id")) return rows
      .filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.state === "RESERVED" && String(r.request_id).startsWith(String(v[2])))
      .slice(0, 1).map(r => structuredClone(r));
    if (query.startsWith("select *") || query.startsWith("select request_id")) return rows.filter(r => r.session_key_hash === v[0] && r.project_id === v[1] && r.request_id === v[2]).map(r => structuredClone(r));
    throw new Error(`UNEXPECTED_ARCHIVE_SQL:${query}`);
  };
  const sql = Object.assign(tag, {
    unsafe: async (statement: string) => { queries.push(statement); throw new Error("OFFLINE_RUNTIME_DDL_FORBIDDEN"); }, json: (value: unknown) => value,
    begin: <T>(callback: (transaction: typeof sql) => Promise<T>) => {
      const next = tail.then(async () => {
        // Only row settlement mutates fields. Immutable TEXT/metadata are shared
        // safely; copying hundreds of frozen bodies would test the double's RAM,
        // not the archive. A failed transaction still restores all row changes.
        const beforeRows = rows.map(row => ({ ...row })), beforeBodies = [...bodies], beforeRevisions = [...revisions], beforeIntents = [...intents];
        try { return await callback(sql); } catch (error) { rows = beforeRows; bodies = beforeBodies; revisions = beforeRevisions; intents = beforeIntents; throw error; }
      });
      tail = next.catch(() => {}); return next;
    },
  });
  return { sql: sql as unknown as Sql, queries, projectLockArguments, rows: () => structuredClone(rows), bodies: () => structuredClone(bodies),
    setSchemaCatalog: (catalog: Record<string, unknown>[]) => { schemaCatalog = structuredClone(catalog); },
    revisions: () => structuredClone(revisions), failRevisionSave: (fail: boolean) => { failRevision = fail; },
    intents: () => structuredClone(intents), failIntentSave: (fail: boolean) => { failIntent = fail; },
    corruptRevision: (id: string, sequence: number) => {
      const row = revisions.find(r => r.revision_id === id && r.save_sequence === sequence)!;
      (row.revision as { contentDigest: string }).contentDigest = "ke1-corrupt";
    },
    corruptBody: (generationId: string) => {
      const row = rows.find(item => item.generation_id === generationId)!;
      const body = bodies.find(item => item.session_key_hash === row.session_key_hash && item.project_id === row.project_id && item.request_id === row.request_id)!;
      body.native_body_text = String(body.native_body_text) + "corrupt";
    },
    recordSnapshot: (sessionKey: string, project: { projectId: string; versionId: string; projectDigest: string; revision: number }) => {
      snapshots.push({ session_key_hash: sessionKey, project_id: project.projectId, version_id: project.versionId, project_digest: project.projectDigest, revision: project.revision });
    },
    failMetadataCommit: (fail: boolean) => { failCommit = fail; } };
};
