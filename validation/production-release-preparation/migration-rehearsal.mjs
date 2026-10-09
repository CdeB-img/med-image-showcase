// Synthetic PostgreSQL rehearsal only. Never reads deployment credentials.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { loadHistoricalGuard } from './historical-runtime.mjs';

const target = new URL(process.env.NOXIA_RELEASE_TEST_DATABASE_URL ?? 'invalid:');
assert(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname), 'LOCAL_TEST_DATABASE_REQUIRED');
assert(/^\/noxia_release_test_[a-z0-9_]+$/u.test(target.pathname), 'DEDICATED_TEST_DATABASE_REQUIRED');
const sql = postgres(target.toString(), { max: 4, prepare: false, onnotice: () => {} });
const root = fileURLToPath(new URL('../../server/migrations/', import.meta.url));
const files = ['001_protocol_designer_durable_guard.sql', '002_doc_generation_archive.sql',
  '003_doc_archive_terminal_reservations.sql', '004_doc_working_revision.sql', '005_doc_studio_finalization_intent.sql'];
const migrations = files.map(name => readFileSync(`${root}${name}`, 'utf8'));
const sha = text => createHash('sha256').update(text).digest('hex');
const addedStates = ['INCOMPLETE_CONTENT_FILTERED', 'INCOMPLETE_MAX_OUTPUT_TOKENS', 'INCOMPLETE_OTHER',
  'INCOMPLETE_UNSETTLED', 'PROVIDER_HTTP_FAILED', 'PROVIDER_RESULT_FAILED', 'PROVIDER_USAGE_UNSETTLED'];
const checks = [];
const check = async (name, effect) => { await effect(); checks.push(name); console.log(`PASS ${name}`); };
const snapshot = async () => JSON.stringify(await sql`select row_to_json(s) as row from noxia_durable.public_guard_session s order by session_key_hash`);
const rejects = async (query, pattern) => assert.rejects(query, pattern);

try {
  const [identity] = await sql`select current_database() as database`;
  assert.equal(identity.database, target.pathname.slice(1));
  const [empty] = await sql`select count(*)::int as count from information_schema.tables where table_schema = 'noxia_durable'`;
  assert.equal(empty.count, 0, 'REHEARSAL_REQUIRES_FRESH_DATABASE');
  // Reconstruct the observed Production delta: all 001 columns exist, but its
  // provider-state CHECK still accepts only the historical terminal states.
  await sql.unsafe(migrations[0].replace(/'INCOMPLETE_CONTENT_FILTERED'[\s\S]*?'PROVIDER_USAGE_UNSETTLED',/gu, ''));
  await sql`insert into noxia_durable.public_guard_session (session_key_hash, client_key_hash, admission_count, quota_updated_at,
    measured_cost_usd, committed_cost_upper_bound_usd) values ('synthetic-session', 'synthetic-client', 2, now(), 0.25, 0.5)`;
  await sql`insert into noxia_durable.public_bridge_admission (admission_key, session_key_hash, client_request_id_hash, request_digest, state)
    values ('synthetic-admission', 'synthetic-session', 'synthetic-client-request', 'synthetic-request', 'COMPLETED')`;
  await sql`insert into noxia_durable.public_provider_operation
    (operation_key, admission_key, session_key_hash, operation_index, endpoint_digest, payload_digest, configuration_digest, state, reserved_upper_bound_usd)
    values ('synthetic-operation', 'synthetic-admission', 'synthetic-session', 0, 'synthetic-endpoint', 'synthetic-payload', 'synthetic-config', 'CONSUMED', 0.25)`;
  const legacy = await snapshot();
  const legacyOperation = JSON.stringify(await sql`select * from noxia_durable.public_provider_operation order by operation_key`);
  await check('old_constraint_rejects_new_terminal_state', () => rejects(sql`update noxia_durable.public_provider_operation set state = 'INCOMPLETE_CONTENT_FILTERED'`, /state_check/));
  await check('failed_ordered_migration_rolls_back_atomically', async () => {
    await rejects(sql.begin(async tx => {
      for (const source of migrations.slice(0, 3)) await tx.unsafe(source);
      await tx.unsafe('select deliberately_missing_release_rehearsal_function()');
    }), /deliberately_missing/);
    const [result] = await sql`select to_regclass('noxia_durable.doc_generation') as table`;
    assert.equal(result.table, null);
    await rejects(sql`update noxia_durable.public_provider_operation set state = 'INCOMPLETE_CONTENT_FILTERED'`, /state_check/);
    assert.equal(await snapshot(), legacy);
  });
  await check('ordered_001_to_005_preserves_nonempty_legacy', async () => {
    await sql.begin(async tx => { for (const source of migrations) await tx.unsafe(source); });
    assert.equal(await snapshot(), legacy);
    assert.equal(JSON.stringify(await sql`select * from noxia_durable.public_provider_operation order by operation_key`), legacyOperation);
    assert.equal((await sql`select count(*)::int as count from information_schema.tables where table_schema = 'noxia_durable' and table_name like 'doc_%'`)[0].count, 4);
  });
  await check('all_seven_new_states_admitted_by_constraint', async () => {
    for (const state of addedStates) await sql`update noxia_durable.public_provider_operation set state = ${state} where operation_key = 'synthetic-operation'`;
    await sql`update noxia_durable.public_provider_operation set state = 'CONSUMED' where operation_key = 'synthetic-operation'`;
  });
  await check('unknown_provider_state_rejected', () => rejects(sql`update noxia_durable.public_provider_operation set state = 'NOT_A_NATIVE_STATE'`, /state_check/));

  const body = JSON.stringify({ fixture: 'synthetic-native-body-only' }); const digest = sha(body);
  await sql`insert into noxia_durable.doc_generation (session_key_hash, project_id, request_id, request_sha256, generated_at,
    reserved_bytes, state, ordinal, generation_id, body_sha256, body_bytes, metadata)
    values ('synthetic-session', 'synthetic-project', 'synthetic-request', ${sha('request')}, '2026-10-09T00:00:00Z', 2000,
      'COMMITTED', 1, 'synthetic-generation', ${digest}, ${Buffer.byteLength(body)}, ${sql.json({ fixture: true })})`;
  await sql`insert into noxia_durable.doc_generation_body values ('synthetic-session', 'synthetic-project', 'synthetic-request', ${body}, ${digest})`;
  const revision = sequence => ({ revisionId: 'synthetic-revision', saveSequence: sequence, status: 'ACTIVE',
    baseGenerationId: 'synthetic-generation', baseGenerationBodyDigest: digest, logicalDocumentRef: 'synthetic-native-document' });
  const appendSave = (tx, sequence, payload = revision(sequence)) => tx`insert into noxia_durable.doc_working_revision
    values ('synthetic-session', 'synthetic-project', 'synthetic-revision', ${sequence}, 'synthetic-generation', ${digest}, 'synthetic-native-document', 'ACTIVE', ${tx.json(payload)})`;
  await appendSave(sql, 1);
  const intent = { finalizationIntentId: 'synthetic-intent', intentDigest: 'synthetic-intent-digest', sequence: 1 };
  await sql`insert into noxia_durable.doc_studio_finalization_intent values ('synthetic-session', 'synthetic-project', 'synthetic-intent', 1,
    'synthetic-revision', 1, 'synthetic-intent-digest', ${JSON.stringify(intent)}, ${sha(JSON.stringify(intent))})`;
  await check('committed_metadata_and_native_body_immutable', async () => {
    await rejects(sql`update noxia_durable.doc_generation set metadata = '{}'`, /DOC_ARCHIVE_IMMUTABLE/);
    await rejects(sql`delete from noxia_durable.doc_generation`, /DOC_ARCHIVE_IMMUTABLE/);
    await rejects(sql`update noxia_durable.doc_generation_body set native_body_text = 'changed'`, /DOC_ARCHIVE_IMMUTABLE/);
    await rejects(sql`delete from noxia_durable.doc_generation_body`, /DOC_ARCHIVE_IMMUTABLE/);
  });
  await check('save_and_intent_history_append_only', async () => {
    await rejects(sql`delete from noxia_durable.doc_working_revision`, /DOC_REVISION_SAVE_IMMUTABLE/);
    await rejects(sql`update noxia_durable.doc_working_revision set status = 'ABANDONED'`, /DOC_REVISION_SAVE_IMMUTABLE/);
    await rejects(sql`delete from noxia_durable.doc_studio_finalization_intent`, /DOC_STUDIO_INTENT_EVIDENCE_IMMUTABLE/);
    await rejects(sql`update noxia_durable.doc_studio_finalization_intent set intent_digest = 'changed'`, /DOC_STUDIO_INTENT_EVIDENCE_IMMUTABLE/);
  });
  await check('native_revision_binding_check_rejects_mismatch', () => rejects(appendSave(sql, 2, { ...revision(2), baseGenerationId: 'foreign' }), /check/));
  await check('missing_native_revision_binding_fails_closed', () => rejects(appendSave(sql, 2, {}), /check/));
  await check('missing_native_intent_binding_fails_closed', () => rejects(sql`insert into noxia_durable.doc_studio_finalization_intent
    values ('synthetic-session', 'synthetic-project', 'synthetic-intent-missing', 1, 'synthetic-revision', 1, 'missing', '{}', ${sha('{}')})`, /check/));
  await check('revision_foreign_key_rejects_unknown_generation', () => rejects(sql`insert into noxia_durable.doc_working_revision
    values ('synthetic-session', 'synthetic-project', 'foreign-revision', 1, 'foreign', ${digest}, 'doc', 'ACTIVE',
      ${sql.json({ revisionId: 'foreign-revision', saveSequence: 1, status: 'ACTIVE', baseGenerationId: 'foreign', baseGenerationBodyDigest: digest, logicalDocumentRef: 'doc' })})`, /foreign key/));
  await check('concurrent_same_save_has_one_winner_no_overwrite', async () => {
    const result = await Promise.allSettled([appendSave(sql, 2), appendSave(sql, 2)]);
    assert.equal(result.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal((await sql`select count(*)::int as count from noxia_durable.doc_working_revision`)[0].count, 2);
  });
  await check('historical_frozen_save_still_addressable_after_later_save', async () => {
    const [found] = await sql`select r.save_sequence from noxia_durable.doc_studio_finalization_intent i join noxia_durable.doc_working_revision r
      using (session_key_hash, project_id, revision_id, save_sequence) where i.intent_id = 'synthetic-intent'`;
    assert.equal(Number(found.save_sequence), 1);
  });
  await check('rerun_all_migrations_idempotent_with_nonempty_document_history', async () => {
    for (const source of migrations) await sql.unsafe(source);
    assert.equal((await sql`select native_body_text from noxia_durable.doc_generation_body`)[0].native_body_text, body);
    assert.equal((await sql`select count(*)::int as count from noxia_durable.doc_working_revision`)[0].count, 2);
    assert.equal(await snapshot(), legacy);
  });
  await check('halfway_save_transaction_rollback_keeps_history', async () => {
    await rejects(sql.begin(async tx => { await appendSave(tx, 3); throw new Error('SYNTHETIC_SAVE_FAILURE'); }), /SYNTHETIC_SAVE_FAILURE/);
    assert.equal((await sql`select max(save_sequence) as sequence from noxia_durable.doc_working_revision`)[0].sequence, '2');
  });
  await check('preexisting_invalid_revision_blocks_hardening_without_rewriting_or_deleting', async () => {
    await rejects(sql.begin(async tx => {
      await tx.unsafe('alter table noxia_durable.doc_working_revision drop constraint doc_working_revision_native_binding_required');
      await appendSave(tx, 3, {});
      await tx.unsafe(migrations[3]);
    }), /violated|check/);
    assert.equal((await sql`select count(*)::int as count from noxia_durable.doc_working_revision`)[0].count, 2);
  });
  await check('preexisting_invalid_intent_blocks_hardening_without_rewriting_or_deleting', async () => {
    await rejects(sql.begin(async tx => {
      await tx.unsafe('alter table noxia_durable.doc_studio_finalization_intent drop constraint doc_studio_intent_native_binding_required');
      await tx`insert into noxia_durable.doc_studio_finalization_intent values ('synthetic-session', 'synthetic-project', 'synthetic-invalid-intent',
        1, 'synthetic-revision', 1, 'missing', '{}', ${sha('{}')})`;
      await tx.unsafe(migrations[4]);
    }), /violated|check/);
    assert.equal((await sql`select count(*)::int as count from noxia_durable.doc_studio_finalization_intent`)[0].count, 1);
  });
  await check('old_runtime_state_subset_and_guard_data_still_valid_after_migrations', async () => {
    assert.equal(JSON.stringify(await sql`select * from noxia_durable.public_provider_operation order by operation_key`), legacyOperation);
    assert.equal(await snapshot(), legacy);
    // This proves SQL subset compatibility, NOT old runtime comprehension of
    // new terminal states, v4 sessions, Studio or current documentary history.
  });
  await check('exact_previous_guard_runs_on_upgraded_schema_with_mocked_provider_only', async () => {
    const old = await loadHistoricalGuard();
    const guard = old.createPostgresProtocolDesignerDurableGuard(target.toString(), { maxConnections: 2, sessionRequestLimit: 16 });
    try {
      const request = { headers: { 'x-forwarded-for': '203.0.113.81' }, body: { observabilityContext: {
        sessionId: 'synthetic-rollback-session', conversationId: 'synthetic-rollback-conversation',
        turnId: 'turn:synthetic-rollback', clientRequestId: 'synthetic-rollback-request' } } };
      const context = await guard.prepareRequest(request); assert.equal(context.admitted, true);
      let mocks = 0;
      const fixtureFetch = async endpoint => {
        mocks++;
        return new Response(JSON.stringify(String(endpoint).endsWith('/input_tokens') ? { object: 'response.input_tokens', input_tokens: 120 }
          : { id: 'synthetic-rollback-response', status: 'completed', model: 'gpt-5.6-terra',
            usage: { input_tokens: 120, output_tokens: 20 } }), { status: 200, headers: { 'content-type': 'application/json' } });
      };
      const response = await guard.createBudgetedFetch(context, fixtureFetch)('https://api.openai.com/v1/responses', {
        method: 'POST', body: JSON.stringify({ model: 'gpt-5.6-terra', instructions: 'Synthetic fixture', input: 'Synthetic input',
          reasoning: { effort: 'medium' }, max_output_tokens: 2000, store: false, service_tier: 'default' }) });
      assert.equal(response.status, 200); assert.equal(mocks, 2);
      await guard.completeRequest(context, 200, { synthetic: true });
      const recovered = await guard.prepareRequest(request); assert.equal(recovered.recovered, true);
      const [operation] = await sql`select state from noxia_durable.public_provider_operation where admission_key = ${context.admissionKey}`;
      assert.equal(operation.state, 'CONSUMED');
    } finally { await guard.close(); }
  });
  console.log(JSON.stringify({ result: 'PASS', checks: checks.length, migrations: files.map((name, index) => ({ name, sha256: sha(migrations[index]) })),
    providerCalls: 0, productionWrites: 0, functionalRollback: 'NOT_QUALIFIED' }));
} finally { await sql.end(); }
