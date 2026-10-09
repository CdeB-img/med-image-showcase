import { createHash } from "node:crypto";
import type { Sql } from "postgres";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { runtimeSchemaFingerprints, type RuntimeSchemaTable } from "./protocol-designer-runtime-schema-contract.js";

/** Structural catalog only: no row bodies, proofs, DDL, installation or repair.
 * FK identity is read from catalogs, not search_path-dependent SQL deparsing. */
export const readRuntimeSchemaCatalog = async (sql: Sql, tables: readonly RuntimeSchemaTable[]) => sql`
  select c.relname as table_name, c.relkind as table_kind,
    coalesce((select jsonb_agg(jsonb_build_object(
      'name', a.attname, 'type', format_type(a.atttypid, a.atttypmod), 'notNull', a.attnotnull,
      'default', pg_get_expr(d.adbin, d.adrelid), 'identity', a.attidentity, 'generated', a.attgenerated)
      order by a.attname collate "C") from pg_catalog.pg_attribute a
      left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped), '[]'::jsonb) as columns,
    coalesce((select jsonb_agg(jsonb_build_object(
      'name', k.conname, 'type', k.contype, 'validated', k.convalidated,
      'deferrable', k.condeferrable, 'deferred', k.condeferred,
      'expression', pg_get_expr(k.conbin, k.conrelid),
      'keys', (select jsonb_agg(a.attname order by x.ordinality) from unnest(k.conkey) with ordinality x(num, ordinality)
        join pg_catalog.pg_attribute a on a.attrelid = k.conrelid and a.attnum = x.num),
      'foreignTable', (select n.nspname || '.' || r.relname from pg_catalog.pg_class r
        join pg_catalog.pg_namespace n on n.oid = r.relnamespace where r.oid = k.confrelid),
      'foreignKeys', (select jsonb_agg(a.attname order by x.ordinality) from unnest(k.confkey) with ordinality x(num, ordinality)
        join pg_catalog.pg_attribute a on a.attrelid = k.confrelid and a.attnum = x.num),
      'updateAction', k.confupdtype, 'deleteAction', k.confdeltype, 'matchType', k.confmatchtype)
      order by k.conname collate "C") from pg_catalog.pg_constraint k where k.conrelid = c.oid), '[]'::jsonb) as constraints,
    coalesce((select jsonb_agg(jsonb_build_object(
      'name', t.tgname, 'enabled', t.tgenabled, 'type', t.tgtype, 'arguments', encode(t.tgargs, 'hex'),
      'function', n.nspname || '.' || p.proname, 'body', p.prosrc,
      'language', l.lanname, 'securityDefiner', p.prosecdef, 'configuration', p.proconfig)
      order by t.tgname collate "C") from pg_catalog.pg_trigger t
      join pg_catalog.pg_proc p on p.oid = t.tgfoid
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      join pg_catalog.pg_language l on l.oid = p.prolang
      where t.tgrelid = c.oid and not t.tgisinternal), '[]'::jsonb) as triggers,
    coalesce((select jsonb_agg(jsonb_build_object(
      'name', r.relname, 'unique', i.indisunique, 'primary', i.indisprimary,
      'valid', i.indisvalid, 'ready', i.indisready, 'method', a.amname,
      'keys', (select jsonb_agg(pg_get_indexdef(i.indexrelid, x, true) order by x)
        from generate_series(1, i.indnatts) x), 'options', i.indoption::text,
      'predicate', pg_get_expr(i.indpred, i.indrelid)) order by r.relname collate "C")
      from pg_catalog.pg_index i join pg_catalog.pg_class r on r.oid = i.indexrelid
      join pg_catalog.pg_am a on a.oid = r.relam where i.indrelid = c.oid), '[]'::jsonb) as indexes
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'noxia_durable' and c.relname = any(${tables as RuntimeSchemaTable[]}::text[])
  order by c.relname collate "C"
`;

export const runtimeSchemaFingerprint = (catalog: Record<string, unknown>) =>
  createHash("sha256").update(stableStringify(catalog)).digest("hex");

/** Each existing owner verifies its own native tables once per cold instance.
 * Failed verification is not cached. Migration requires an explicit installer;
 * this function never acquires DDL privileges or repairs schema/data. */
export const createRuntimeSchemaVerification = (
  sql: Sql, tables: readonly RuntimeSchemaTable[], ownerCode: string,
  error: (code: string) => Error,
) => {
  let verified: Promise<void> | null = null;
  const verify = async () => {
    let rows: Awaited<ReturnType<typeof readRuntimeSchemaCatalog>>;
    try { rows = await readRuntimeSchemaCatalog(sql, tables); }
    catch { throw error(`${ownerCode}_SCHEMA_VERIFICATION_FAILED`); }
    for (const table of tables) {
      const row = rows.find(value => value.table_name === table);
      if (!row) throw error(`${ownerCode}_SCHEMA_MISSING`);
      if (runtimeSchemaFingerprint(row) !== runtimeSchemaFingerprints[table])
        throw error(`${ownerCode}_SCHEMA_INCOMPATIBLE`);
    }
  };
  return () => verified ??= verify().catch(cause => { verified = null; throw cause; });
};
