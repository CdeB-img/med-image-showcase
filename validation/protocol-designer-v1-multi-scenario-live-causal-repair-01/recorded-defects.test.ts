import { expect, it } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { adoptInitial, extraction, recorded, rows, findings, baseline, mission } from './live-evidence';
import { createProtocolDesignerReplayFetch, readProtocolDesignerReplayRefs } from '../../api/protocol-designer-provider-replay';
import { detectSensitiveData } from '../../src/features/protocol-designer/intake/privacy';
import { routeProductEntry } from '../../src/features/protocol-designer/functional-reset/product-entry-routing';
import { buildScientificThinkingInputFromProjectSnapshot } from '../../src/features/research-project-construction';
import { executeScientificThinkingEngine } from '../../src/features/scientific-thinking/engine';

const red = process.env.NOXIA_EXPECT_RED === '1';
const phase = red ? 'red' : 'green';
const out = resolve(mission, phase);
mkdirSync(out, { recursive: true });
const save = (name: string, data: unknown) => writeFileSync(resolve(out, `${name}.json`), JSON.stringify(data, null, 2) + '\n');

it('replays all seven immutable live responses exactly without any live transport', async () => {
  expect(process.env.NODE_OPTIONS).toContain('offline-guard.cjs');
  const before = readFileSync(resolve(baseline.evidenceRoot, 'protocol-designer-exchanges.jsonl'), 'utf8');
  let used = 0;
  for (const sessionId of new Set<string>(rows.map((row: {session:string}) => row.session))) {
    const scope = {campaignId: baseline.campaignId, sessionId};
    const refs = await readProtocolDesignerReplayRefs(baseline.evidenceRoot, scope);
    const replay = createProtocolDesignerReplayFetch({root: baseline.evidenceRoot, refs, scope});
    for (const row of rows.filter((r: {session:string}) => r.session === sessionId)) {
      const {exchange} = recorded(row.call);
      const response = await replay(exchange.request.endpoint, {method:'POST', body:exchange.request.body});
      expect(await response.text()).toBe(exchange.response.body);
      used++;
    }
  }
  expect(used).toBe(7);
  expect(readFileSync(resolve(baseline.evidenceRoot, 'protocol-designer-exchanges.jsonl'), 'utf8')).toBe(before);
  save('strict-transport-replay', {responsesUsed: used, liveProviderCalls: 0, historicalLedgerUnchanged: true});
});

it('S1 reproduces omitted explicit population with the exact recorded Terra delta', () => {
  const initial = adoptInitial(1);
  const turn = extraction(2, initial.project);
  const contents = turn.checked.candidate!.changes.map(x => x.content).join('\n');
  const review = JSON.stringify({review: turn.prepared.humanReviewProjection, issues: turn.contribution.scientificContent.clarificationNeeds});
  expect(turn.raw).toContain('adultes avec une myocardite aiguë récente');
  expect(contents).not.toMatch(/adultes|aiguë/);
  const surfaced = /non interprété|non représenté|UNREPRESENTED/.test(review) && review.includes('adultes avec une myocardite aiguë récente');
  save('S1', {redReproduced: !surfaced, initialProject: initial.project, ...turn, missingPopulationSurfaced: surfaced});
  if (red) { expect(surfaced).toBe(false); expect(turn.prepared.humanReviewProjection.status).toBe('COMPLETE'); }
  else expect(surfaced).toBe(true);
});

it('S2 reconstructs the recorded Project and executes the actual local ST adapter and engine', () => {
  const {project} = adoptInitial(4);
  const before = JSON.stringify(project);
  const input = buildScientificThinkingInputFromProjectSnapshot({project, purpose: 'Formuler ou préciser la question scientifique à partir du contenu adopté.'});
  const output = executeScientificThinkingEngine(input);
  const wrong = output.questions.some(q => q.text.includes('association entre Comparer') && q.text.includes('Comprendre'));
  save('S2', {redReproduced: wrong, project, input, output});
  expect(JSON.stringify(project)).toBe(before);
  if(red) expect(wrong).toBe(true); else expect(wrong).toBe(false);
});

it.each(['S3','S5'])('%s reproduces the exact pre-provider privacy boundary', (scenario) => {
  const finding = findings.find((f: {scenario:string}) => f.scenario === scenario);
  const sensitive = detectSensitiveData(finding.userText);
  const route = routeProductEntry({raw:finding.userText, sourceTurnRef:`repair:${scenario}`, routedAt:'2026-09-15T12:00:00.000Z'});
  save(scenario, {raw: finding.userText, sensitive, route, redReproduced:route.domainGate==='OUT_OF_SCOPE', providerCalls:0});
  if(red) { expect(sensitive).toContainEqual({code:'PATIENT_IDENTIFIER'}); expect(route.domainGate).toBe('OUT_OF_SCOPE'); }
  else { expect(sensitive).toEqual([]); expect(route.domainGate).not.toBe('OUT_OF_SCOPE'); }
});

it('S4 replays exact upstream NEGATED values through the actual Human Review boundary', () => {
  const initial = adoptInitial(5);
  const turn = extraction(6, initial.project);
  const negations = turn.checked.validation.acceptedChanges.filter(c => c.polarity === 'NEGATED');
  expect(negations.map(c => c.content)).toEqual(['AVC aigu','Essai de traitement']);
  const review = turn.prepared.humanReviewProjection.sections.flatMap(s => s.items).map(i => i.content);
  const wrong = review.includes('+ AVC aigu') && review.includes('+ Essai de traitement');
  save('S4', {redReproduced: wrong, initialProject: initial.project, ...turn, review});
  if(red) expect(wrong).toBe(true); else { expect(wrong).toBe(false); expect(review.join('\n')).toMatch(/AVC aigu/); expect(review.join('\n')).toMatch(/(?:Exclusion|Pas de|Absent|absence|exclu)/i); }
});

it('uses both recorded Gemini replies through the real governed realization validator', async()=>{
  const {parseGovernedRealizationProviderOutput,realizeGovernedConversation}=await import('../../src/features/query-navigation/governed-conversation-realization');
  const checks=[3,7].map(call=>{
    const saved=recorded(call);
    const envelope=JSON.parse(saved.request.contents[0].parts[0].text);
    const output=parseGovernedRealizationProviderOutput(saved.text);
    expect(output).not.toBeNull();
    const result=realizeGovernedConversation({envelope,providerReply:output!.assistantReply,providerClaim:output!.claim,requireProviderClaim:true});
    return {call,responseSha256:saved.row.response_sha256,scope:'EXACT_RECORDED_HISTORICAL_WHAT_ENVELOPE_NOT_REPAIRED_CURRENT_WHAT',result};
  });
  save('recorded-gemini-native-conformance',{checks,liveProviderCalls:0});
  expect(checks).toHaveLength(2);
});
