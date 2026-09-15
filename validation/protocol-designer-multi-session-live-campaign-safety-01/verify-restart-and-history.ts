// Separate offline process: replay old immutable evidence and prove that a
// fresh recorder still sees all consumed calls and the five-session limit.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { FileScientificInterpretationEvidenceStore } from '../../api/scientific-interpretation-evidence-store';
import { createRecordedProtocolDesignerFetch, createProtocolDesignerReplayFetch, readProtocolDesignerReplayRefs } from '../../api/protocol-designer-provider-replay';
import { validateCanaryCampaignPolicy } from '../../api/protocol-designer-canary-policy';
import type { ProviderObservedRequestInit } from '../../src/features/protocol-designer/provider-call-observability';

assert.match(process.env.NODE_OPTIONS ?? '', /offline-guard\.cjs/);
assert.equal(process.env.OPENAI_API_KEY, undefined); assert.equal(process.env.GEMINI_API_KEY, undefined);
const mission = resolve('validation/protocol-designer-multi-session-live-campaign-safety-01');
const phase = process.env.NOXIA_SAFETY_DRY_RUN_PHASE ?? 'final'; assert.match(phase, /^[a-z0-9-]+$/);
const root = join(mission, `dry-run-${phase}/private/canary-synthetic-qualified-multisession`);
const policy = validateCanaryCampaignPolicy(JSON.parse(await readFile(join(root, 'campaign-policy.json'), 'utf8')));
const journalPath = join(root, 'protocol-designer-exchanges.jsonl');
const before = await readFile(journalPath, 'utf8');
const refs = await readProtocolDesignerReplayRefs(root); assert.equal(refs.length, 5);
const raw = await new FileScientificInterpretationEvidenceStore(root).read(refs[0]); assert.ok(raw);
const first = raw.payload as { request: { endpoint: string; body: string }; callMetadata: NonNullable<ProviderObservedRequestInit['noxiaProviderObservation']> };
let transportInvocations = 0;
const run = createRecordedProtocolDesignerFetch({ root, campaignPolicy: policy, canaryCampaignId: policy.campaignId,
  fetchImpl: async () => { transportInvocations++; throw new Error('PROVIDER_FORBIDDEN'); } });
await assert.rejects(() => run(first.request.endpoint, { method: 'POST', body: first.request.body, noxiaProviderObservation: first.callMetadata }), /CANARY_LOGICAL_CALL_ALREADY_CONSUMED/);
await assert.rejects(() => run(first.request.endpoint, { method: 'POST', body: first.request.body,
  noxiaProviderObservation: { ...first.callMetadata, context: { ...first.callMetadata.context, sessionId: 'restart-sixth', conversationId: 'restart-conversation' } } }), /CANARY_MAX_SESSIONS_REACHED/);
assert.equal(transportInvocations, 0); assert.equal(await readFile(journalPath, 'utf8'), before);

const historic = resolve('.provider-evidence.local/canary-protocol-designer-v1-live-provider-long-horizon-01r-20260914');
const historicalJournal = await readFile(join(historic, 'protocol-designer-exchanges.jsonl'), 'utf8');
const historicalRefs = await readProtocolDesignerReplayRefs(historic); assert.equal(historicalRefs.length, 5);
const historicalReplay = createProtocolDesignerReplayFetch({ root: historic, refs: historicalRefs });
const store = new FileScientificInterpretationEvidenceStore(historic);
const rows = [];
for (const ref of historicalRefs) {
  const record = await store.read(ref); assert.ok(record);
  const e = record.payload as { request: { endpoint: string; body: string }; response: { body: string; status: number } };
  const result = await historicalReplay(e.request.endpoint, { method: 'POST', body: e.request.body });
  assert.equal(await result.text(), e.response.body); assert.equal(result.status, e.response.status);
  rows.push({ ref, status: 'PASS' });
}
assert.equal(await readFile(join(historic, 'protocol-designer-exchanges.jsonl'), 'utf8'), historicalJournal);
const receipt = { SEPARATE_PROCESS_RESTART: 'PASS', CONSUMED_LOGICAL_CALL_REJECTED: true, FIVE_SESSIONS_RESTORED: true,
  HISTORICAL_LIVE_01R_STRICT_TRANSPORT_REPLAY: '5/5 PASS', legacyResults: rows, historicalEvidenceUnchanged: true,
  campaignJournalUnchanged: true, campaignJournalSha256: createHash('sha256').update(before).digest('hex'),
  transportInvocations, PROVIDER_CALLS: 0, scope: 'Offline transport and persisted admission state; no scientific/live requalification.' };
await writeFile(join(mission, `qualification/restart-and-history-${phase}.json`), JSON.stringify(receipt, null, 2)+'\n', { flag: 'wx' });
console.log(JSON.stringify(receipt));
