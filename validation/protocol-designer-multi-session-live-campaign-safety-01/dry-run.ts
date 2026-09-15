// Evidence-only dry-run: real local middleware/bridge, existing synthetic
// first-turn browser recordings, nonzero historical usage as simulation data.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ViteDevServer } from 'vite';
import { localProductBridge } from '../../vite.config';
import { stableStringify } from '../../src/features/knowledge-engine/canonical';
import { FileScientificInterpretationEvidenceStore } from '../../api/scientific-interpretation-evidence-store';
import { createRecordedProtocolDesignerFetch, createProtocolDesignerReplayFetch, readProtocolDesignerReplayRefs } from '../../server/protocol-designer-provider-replay';
import { addCanaryCosts, canaryBudgetAdmission, campaignBudgetPolicy, createCanaryCampaignPolicy,
  QUALIFIED_CAMPAIGN_MODELS, SINGLE_ATTEMPT_FAIL_CLOSED } from '../../server/protocol-designer-canary-policy';
import type { ProviderObservedRequestInit } from '../../src/features/protocol-designer/provider-call-observability';
import type { CanaryCampaignPolicy, CanaryCallBound } from '../../server/protocol-designer-canary-policy';

type DryRunExchange = {
  request: { endpoint: string; body: string }; response: { body: string };
  canaryAdmission: { campaignPolicy: CanaryCampaignPolicy; sessionId: string; committedBeforeUsd: number; measuredBeforeUsd: number; bound: CanaryCallBound };
  canarySettlement: { measuredCostUsd: number; committedCostUpperBoundUsd: number };
  callMetadata: NonNullable<ProviderObservedRequestInit['noxiaProviderObservation']>;
};

assert.match(process.env.NODE_OPTIONS ?? '', /offline-guard\.cjs/);
assert.equal(process.env.OPENAI_API_KEY, undefined); assert.equal(process.env.GEMINI_API_KEY, undefined);
const mission = resolve('validation/protocol-designer-multi-session-live-campaign-safety-01');
const phase = process.env.NOXIA_SAFETY_DRY_RUN_PHASE ?? 'first'; assert.match(phase, /^[a-z0-9-]+$/);
const destination = join(mission, `dry-run-${phase}`); await mkdir(destination);
const evidenceRoot = join(destination, 'private');
const fixture = JSON.parse(await readFile(join(mission, 'dry-run-inputs.json'), 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(stableStringify(value)).digest('hex');
const bytesHash = (value: string) => createHash('sha256').update(value).digest('hex');
const policy = createCanaryCampaignPolicy({ campaignId: 'synthetic-qualified-multisession', maxSessions: 5,
  measuredSoftStopUsd: 3, absoluteHardBoundUsd: 10, singleAttemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED,
  allowedProviderModels: QUALIFIED_CAMPAIGN_MODELS, createdAt: '2026-09-15T00:00:00.000Z' });
const root = join(evidenceRoot, `canary-${policy.campaignId}`);
const journalPath = join(root, 'protocol-designer-exchanges.jsonl');
const store = new FileScientificInterpretationEvidenceStore(root);
let syntheticTransports = 0, committed = 0, measured = 0;
const summaries = [];
const allExchanges = [];
for (const scenario of fixture.scenarios) {
  assert.equal(scenario.request.currentProject, null);
  let cursor = 0;
  const fetchImpl: typeof fetch = async (url, init) => {
    const witness = scenario.providerWitnesses[cursor++]; assert.ok(witness, 'NO_SYNTHETIC_OR_LIVE_FALLBACK');
    assert.equal(String(url), witness.endpoint); assert.equal(init?.method, 'POST');
    const expected = { ...witness.requestBody, service_tier: 'default' };
    assert.equal(hash(JSON.parse(String(init?.body))), hash(expected), 'EXACT_EXISTING_PROVIDER_REQUEST');
    const before = (await readFile(journalPath, 'utf8')).trim().split('\n').map((s) => JSON.parse(s));
    assert.equal(before.at(-1).disposition, 'REQUEST_PREPARED');
    syntheticTransports += 1;
    return new Response(JSON.stringify({ ...witness.responseBody, usage: fixture.nonzeroUsage }), { status: witness.responseStatus });
  };
  // New middleware/recorder instances exercise persistent campaign ownership.
  const plugin = localProductBridge({ apiKey: 'synthetic', openAiApiKey: 'synthetic',
    geminiModel: 'gemini-3.5-flash-lite', openAiExtractionModel: 'gpt-5.6-terra' }, evidenceRoot,
  { attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: policy.campaignId, campaignPolicy: policy }, fetchImpl);
  let handler: (request: IncomingMessage, response: ServerResponse, next: () => void) => Promise<void>;
  assert.equal(typeof plugin.configureServer, 'function');
  if (typeof plugin.configureServer !== 'function') throw new Error('SERVER_HOOK_REQUIRED');
  await plugin.configureServer({ middlewares: { use: (_route: string, h: typeof handler) => { handler = h; } } } as unknown as ViteDevServer);
  let payload = '';
  const request = { method: 'POST', url: '/protocol-designer-bridge', async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(scenario.request)); } };
  const response = { statusCode: 200, setHeader: () => undefined, end: (text: string) => { payload = text; } };
  await handler!(request as IncomingMessage, response as unknown as ServerResponse, () => { throw new Error('NO_MIDDLEWARE_FALLBACK'); });
  assert.equal(response.statusCode, 200, payload); assert.equal(cursor, scenario.providerWitnesses.length);
  const scope = { campaignId: policy.campaignId, sessionId: scenario.request.observabilityContext.sessionId };
  const refs = await readProtocolDesignerReplayRefs(root, scope); assert.equal(refs.length, cursor);
  const replay = createProtocolDesignerReplayFetch({ root, refs, scope });
  const journalBeforeReplay = await readFile(journalPath, 'utf8');
  for (const ref of refs) {
    const raw = await store.read(ref); assert.ok(raw); assert.equal(hash(raw.payload), raw.rawOutputDigest);
    const e = raw.payload as DryRunExchange;
    assert.deepEqual(e.canaryAdmission.campaignPolicy, policy);
    assert.equal(e.canaryAdmission.sessionId, scope.sessionId);
    assert.equal(e.canaryAdmission.committedBeforeUsd, committed); assert.equal(e.canaryAdmission.measuredBeforeUsd, measured);
    assert.equal(e.callMetadata.retryIndex, 0); assert.equal(e.callMetadata.retryReason, null);
    assert.ok(e.canarySettlement.measuredCostUsd > 0);
    assert.equal(canaryBudgetAdmission(committed, e.canaryAdmission.bound, measured, campaignBudgetPolicy(policy)), 'ADMITTED');
    committed = addCanaryCosts(committed, e.canarySettlement.committedCostUpperBoundUsd);
    measured = addCanaryCosts(measured, e.canarySettlement.measuredCostUsd);
    assert.equal(await (await replay(e.request.endpoint, { method: 'POST', body: e.request.body })).text(), e.response.body);
    allExchanges.push({ ...e, ref, scenario: scenario.id });
  }
  assert.equal(await readFile(journalPath, 'utf8'), journalBeforeReplay);
  summaries.push({ scenario: scenario.id, sessionId: scope.sessionId, conversationId: scenario.request.observabilityContext.conversationId,
    calls: cursor, committedUsd: committed, measuredUsd: measured, strictReplay: 'PASS', responseStatus: response.statusCode });
}
assert.deepEqual(summaries.map((s) => s.scenario), ['A01', 'A02', 'A04', 'B01', 'F01']);
assert.equal(new Set(summaries.map((s) => s.sessionId)).size, 5);
const journal = await readFile(journalPath, 'utf8');
const first = allExchanges[0];
const request: ProviderObservedRequestInit = { method: 'POST', body: first.request.body,
  noxiaProviderObservation: { ...first.callMetadata, context: { ...first.callMetadata.context, sessionId: 'sixth-session', conversationId: 'sixth-conversation' } } };
await assert.rejects(() => createRecordedProtocolDesignerFetch({ root, canaryCampaignId: policy.campaignId, campaignPolicy: policy,
  fetchImpl: async () => { throw new Error('TRANSPORT_MUST_NOT_BE_REACHED'); } })(first.request.endpoint, request), /CANARY_MAX_SESSIONS_REACHED/);
assert.equal(canaryBudgetAdmission(10 - first.canaryAdmission.bound.upperBoundUsd + 0.0001, first.canaryAdmission.bound, 2, campaignBudgetPolicy(policy)), 'DENIED_HARD_BUDGET');
assert.equal(canaryBudgetAdmission(3, first.canaryAdmission.bound, 3, campaignBudgetPolicy(policy)), 'DENIED_SOFT_STOP');
for (const summary of summaries) {
  const scope = { campaignId: policy.campaignId, sessionId: summary.sessionId };
  const replay = createProtocolDesignerReplayFetch({ root, scope, refs: await readProtocolDesignerReplayRefs(root, scope) });
  for (const e of allExchanges.filter((e) => e.canaryAdmission.sessionId === scope.sessionId)) {
    assert.equal(await (await replay(e.request.endpoint, { method: 'POST', body: e.request.body })).text(), e.response.body);
  }
}
assert.equal(await readFile(journalPath, 'utf8'), journal);
const receipt = { MULTI_SESSION_ACQUISITION_DRY_RUN: 'PASS', DRY_RUN_5_SESSIONS: 'PASS', policy, scenarios: summaries,
  syntheticProviderTransports: syntheticTransports, PROVIDER_CALLS: 0, measuredCostSimulationUsd: measured,
  committedCostSimulationUsd: committed, beforeTransportPrepared: true, singleAttempt: true, sessionLimit: 'PASS',
  hardBoundAdmissionProbe: 'PASS', softStopAdmissionProbe: 'PASS', STRICT_OFFLINE_REPLAY_ALL_SESSIONS: 'PASS',
  journalUnchangedByReplay: true, journalSha256: bytesHash(journal), fixtureSourceSha256: fixture.sourceSha256,
  evidenceRoot: root, scope: 'Real local middleware and bridge, five existing synthetic first-turn browser requests; no browser/scientific trajectory qualification claimed.',
  nonzeroUsageRole: fixture.usageRole };
await writeFile(join(destination, 'receipt.json'), JSON.stringify(receipt, null, 2)+'\n', { flag: 'wx' });
console.log(JSON.stringify(receipt));
