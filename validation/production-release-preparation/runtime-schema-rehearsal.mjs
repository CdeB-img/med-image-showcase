// Local synthetic PostgreSQL only. No deployment credentials or provider path.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import postgres from 'postgres';
// In-memory bundles are deliberately not written to disk. Keep assertion
// stacks readable instead of printing their entire data: source URL.
Error.prepareStackTrace = (error, frames) => `${error.name}: ${error.message}\n${frames.filter(frame =>
  !frame.getFileName()?.startsWith('data:')).slice(0, 6).map(frame => '    at ' + frame).join('\n')}`;
const target = new URL(process.env.NOXIA_RELEASE_TEST_DATABASE_URL ?? 'invalid:');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname));
assert(/^\/noxia_release_test_[a-z0-9_]+$/u.test(target.pathname));
const sql = postgres(target.toString(), { max: 4, prepare: false, onnotice: () => {} });
const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const module = await build({ stdin: { contents: `export * from './server/protocol-designer-schema-compatibility.ts';
  export * from './server/protocol-designer-project-snapshot.ts';
  export * from './server/protocol-designer-document-archive.ts';
  export * from './src/features/document-projection/generation-persistence.ts';
  export * from './src/features/document-projection/__tests__/working-revision-fixture.ts';
  export * from './src/features/protocol-designer/functional-reset/session.ts';
  export * from './src/features/protocol-designer/functional-reset/studio-finalization-lifecycle.ts';`, resolveDir: root }, bundle: true, write: false,
  format: 'esm', platform: 'node', logLevel: 'silent', plugins: [{ name: 'external-packages', setup(api) {
    api.onResolve({ filter: /^@\//u }, args => api.resolve(join(root, 'src', args.path.slice(2)),
      { resolveDir: root, kind: args.kind }));
    api.onResolve({ filter: /^[^./]/u }, args => args.path.startsWith('@/') ? undefined : ({ path: args.path.startsWith('node:') ? args.path
      : pathToFileURL(require.resolve(args.path)).href, external: true }));
  } }] });
const native = await import(`data:text/javascript;base64,${Buffer.from(module.outputFiles[0].text).toString('base64')}`);
const checks = [];
const check = async (name, effect) => { await effect(); checks.push(name); console.log(`PASS ${name}`); };
let runtimeSql, snapshots;
try {
  assert.equal((await sql`select count(*)::int as count from information_schema.tables where table_schema = 'noxia_durable'`)[0].count, 0);
  for (const file of ['001_protocol_designer_durable_guard.sql', '002_doc_generation_archive.sql',
    '003_doc_archive_terminal_reservations.sql', '004_doc_working_revision.sql', '005_doc_studio_finalization_intent.sql'])
    await sql.unsafe(readFileSync(`${root}server/migrations/${file}`, 'utf8'));
  await native.migrateProtocolDesignerProjectSnapshots(sql);
  const tables = ['public_project_snapshot', 'doc_generation', 'doc_generation_body', 'doc_working_revision', 'doc_studio_finalization_intent'];
  const catalog = await native.readRuntimeSchemaCatalog(sql, tables);
  assert.equal(catalog.length, 5);
  if (process.argv.includes('--capture')) {
    // Generated catalog evidence, not product/user data. Explicit capture only.
    writeFileSync('/private/tmp/noxia-phase2-runtime-schema-catalog.json', JSON.stringify(catalog, null, 2));
    console.log(JSON.stringify(Object.fromEntries(catalog.map(row => [row.table_name, native.runtimeSchemaFingerprint(row)]))));
  } else {
    const verify = native.createRuntimeSchemaVerification(sql, tables, 'TEST', code => new Error(code));
    await verify();
    console.log('PASS native_runtime_schema_contract');
    const initialCatalog = JSON.stringify(catalog);
    await check('explicit_migrations_idempotent', async () => {
      for (const file of ['001_protocol_designer_durable_guard.sql', '002_doc_generation_archive.sql',
        '003_doc_archive_terminal_reservations.sql', '004_doc_working_revision.sql', '005_doc_studio_finalization_intent.sql'])
        await sql.unsafe(readFileSync(`${root}server/migrations/${file}`, 'utf8'));
      await native.migrateProtocolDesignerProjectSnapshots(sql);
      assert.equal(JSON.stringify(await native.readRuntimeSchemaCatalog(sql, tables)), initialCatalog);
    });
    await sql.unsafe("create role noxia_runtime_test login password 'synthetic-local-role-only'");
    await sql.unsafe('grant usage on schema noxia_durable to noxia_runtime_test');
    await sql.unsafe('grant select, insert on all tables in schema noxia_durable to noxia_runtime_test');
    await sql.unsafe('grant update on noxia_durable.doc_generation to noxia_runtime_test');
    const limited = new URL(target); limited.username = 'noxia_runtime_test'; limited.password = 'synthetic-local-role-only';
    const statements = [];
    runtimeSql = postgres(limited.toString(), { max: 3, prepare: false, onnotice: () => {},
      debug: (_connection, statement) => statements.push(statement) });
    await check('runtime_role_has_no_schema_create_or_table_ownership', async () => {
      assert.equal((await runtimeSql`select has_schema_privilege(current_user, 'noxia_durable', 'CREATE') as allowed`)[0].allowed, false);
      await assert.rejects(runtimeSql.unsafe('create table noxia_durable.unauthorized_test (id int)'), /permission denied/);
      await assert.rejects(runtimeSql.unsafe('alter table noxia_durable.doc_generation add column unauthorized_test int'), /owner/);
      statements.length = 0;
    });
    // Existing deterministic native PRJ/G1/G2 fixture, not a new document type
    // and not a provider result. Actual production owners execute against SQL.
    const fixture = await native.workingRevisionFixture({ monocentric: true });
    snapshots = native.createPostgresProjectSnapshotStore(limited.toString());
    let access1, access2;
    await check('restricted_role_project_persist_and_exact_historical_resolve', async () => {
      const first = await snapshots.persist(fixture.identity, fixture.project1, null);
      const second = await snapshots.persist(fixture.identity, fixture.project2, first.proof);
      access1 = { identity: fixture.identity, project: first.ref, proof: first.proof };
      access2 = { identity: fixture.identity, project: second.ref, proof: second.proof };
      assert.equal((await snapshots.resolve(fixture.identity, first.ref, first.proof)).projectDigest, fixture.project1.projectDigest);
    });
    const owner = () => native.createPostgresDocumentArchive(limited.toString(), snapshots, native.documentArchiveCapacity({}), runtimeSql);
    const archive = owner();
    const commit = async (access, requestId, body) => {
      await archive.admit(access, { requestId, requestSha256: native.docSha256(JSON.stringify(body)),
        generatedAt: native.documentNativeGeneratedAt(body.native), reservedBytes: 1000000 });
      return (await archive.commit(access, requestId, body)).generation;
    };
    let g2, originalBodies;
    await check('restricted_role_archive_commit_and_historical_read_without_ddl', async () => {
      await commit(access1, 'projection-1', fixture.g1.projectionBody);
      await commit(access1, 'generation-1', fixture.g1.body);
      await commit(access2, 'projection-2', fixture.g2.projectionBody);
      g2 = await commit(access2, 'generation-2', fixture.g2.body);
      assert.equal(g2.displayVersion, 2);
      assert.equal((await archive.history(access2, undefined, 'DRCI')).entries.length, 2);
      originalBodies = JSON.stringify(await sql`select native_body_text, body_sha256 from noxia_durable.doc_generation_body order by request_id`);
    });
    let saved, intent;
    await check('restricted_role_revision_create_save_and_intent_freeze', async () => {
      let revision = (await archive.workingRevisions.create(access2, { ...fixture.createInput,
        baseGenerationId: g2.generationId, baseGenerationBodyDigest: g2.bodySha256 })).revision;
      const content = structuredClone(revision.content); content.title += ' — rédaction locale';
      saved = (await archive.workingRevisions.save(access2, { revisionId: revision.revisionId,
        expectedSaveSequence: revision.saveSequence, content })).revision;
      const session = { ...native.createFunctionalResetSession('2026-10-09T00:00:00Z'),
        sessionId: fixture.sessionId, projectId: fixture.project2.projectId, project: fixture.project2, runtimeTurns: [] };
      const frozen = await native.freezeStudioFinalizationWork({ session, revision: saved,
        source: await archive.body(access2, g2.generationId), projectionSource: await archive.body(access2, fixture.g2.projection.projectionId) });
      intent = await archive.finalizationIntents.create(access2, frozen);
      assert.equal(intent.state, 'FROZEN');
    });
    await check('cold_workers_read_save_historical_intent_without_ddl', async () => {
      const cold = owner(), revision = (await cold.workingRevisions.getSave(access2,
        { revisionId: saved.revisionId, saveSequence: saved.saveSequence, contentDigest: saved.contentDigest })).revision;
      assert.deepEqual(revision, saved);
      const unchanged = await cold.workingRevisions.save(access2, { revisionId: saved.revisionId,
        expectedSaveSequence: saved.saveSequence, content: saved.content });
      assert.equal(unchanged.revision.saveSequence, saved.saveSequence);
      assert.equal((await cold.finalizationIntents.get(access2, intent.finalizationIntentId)).intentDigest, intent.intentDigest);
      assert.equal((await cold.body(access1, fixture.g1.ref.generationId)).ref.bodySha256, fixture.g1.ref.bodySha256);
      assert.equal(statements.some(statement => /^(create|alter|drop|grant|revoke|do)\b/iu.test(statement.trim())), false);
    });
    await check('concurrent_stale_save_rejected_and_history_retained', async () => {
      const content = structuredClone(saved.content); content.title += ' — seconde rédaction';
      const next = await archive.workingRevisions.save(access2, { revisionId: saved.revisionId,
        expectedSaveSequence: saved.saveSequence, content });
      await assert.rejects(archive.workingRevisions.save(access2, { revisionId: saved.revisionId,
        expectedSaveSequence: saved.saveSequence, content: saved.content }), /CONFLICT/);
      assert.equal(next.revision.saveSequence, saved.saveSequence + 1);
      assert.equal((await owner().workingRevisions.getSave(access2, { revisionId: saved.revisionId,
        saveSequence: saved.saveSequence, contentDigest: saved.contentDigest })).revision.contentDigest, saved.contentDigest);
    });
    await check('runtime_invalid_source_binding_fails_closed', async () => {
      await assert.rejects(owner().workingRevisions.create(access2, { ...fixture.createInput,
        baseGenerationBodyDigest: 'a'.repeat(64) }), /SOURCE_DIGEST_MISMATCH/);
      assert.equal(JSON.stringify(await sql`select native_body_text, body_sha256 from noxia_durable.doc_generation_body order by request_id`), originalBodies);
    });
    await check('missing_schema_reported_without_implicit_installation', async () => {
      await assert.rejects(sql.begin(async tx => {
        await tx.unsafe('alter table noxia_durable.doc_generation rename to local_hidden_generation');
        await native.createRuntimeSchemaVerification(tx, ['doc_generation'], 'DOC_ARCHIVE', code => new Error(code))();
      }), /DOC_ARCHIVE_SCHEMA_MISSING/);
    });
    await check('weakened_constraint_and_disabled_trigger_are_incompatible', async () => {
      for (const statement of ['alter table noxia_durable.doc_working_revision drop constraint doc_working_revision_native_binding_required',
        'alter table noxia_durable.doc_working_revision disable trigger doc_working_revision_immutable']) {
        await assert.rejects(sql.begin(async tx => {
          await tx.unsafe(statement);
          await native.createRuntimeSchemaVerification(tx, ['doc_working_revision'], 'DOC_REVISION', code => new Error(code))();
        }), /DOC_REVISION_SCHEMA_INCOMPATIBLE/);
      }
    });
    await check('catalog_and_archived_bodies_unchanged_after_runtime_operations', async () => {
      assert.equal(JSON.stringify(await native.readRuntimeSchemaCatalog(sql, tables)), initialCatalog);
      assert.equal(JSON.stringify(await sql`select native_body_text, body_sha256 from noxia_durable.doc_generation_body order by request_id`), originalBodies);
    });
    console.log(JSON.stringify({ result: 'PASS', checks: checks.length, realProviderCalls: 0, remoteDatabaseWrites: 0, normalRuntimeDDL: 0 }));
  }
} finally { await snapshots?.close(); await runtimeSql?.end(); await sql.end(); }
