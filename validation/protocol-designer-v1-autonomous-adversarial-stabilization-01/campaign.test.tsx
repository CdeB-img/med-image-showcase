import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { readFileSync, mkdirSync, writeFileSync, renameSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ProtocolDesignerDemo from '../../src/pages/ProtocolDesignerDemo';
import { ensureCanonicalProjectState } from '../../src/features/research-project-construction';
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from '../../src/features/protocol-designer/functional-reset/session';
import { handleProtocolDesignerBridge, type ApiResponse } from '../../api/protocol-designer-bridge';
import { createAdversarialProviderTransport, type ProviderCallWitness } from './provider-transport';

type Delta = { operation: string; key: string; type: string; content: string; epistemicState?: string; studyRole?: string };
type GoldTiming = { key: string; operation: string; subjectKey?: string; variableKey?: string; temporalRole?: string; anchor: Record<string, unknown> };
type Turn = {
  id: string; userText: string; intent: string; outcome: string; semanticDelta: Delta[];
  expectedProjectEffect: { afterInput: string; afterUi?: string };
  uiActions?: (string | { kind: string; capabilityGuard?: string })[];
  goldChecks?: { mustContainCurrent?: string[]; mustNotContainCurrent?: string[]; unknownKeys?: string[]; conserveKeys?: string[]; currentMeaningByKey?: Record<string, string>; expectedRelationKeys?: string[]; expectedVariableOccasionKeys?: string[] };
  selection?: { sourceTurn: number; ordinal: number; revalidateAgainstCurrentProject: boolean };
  semanticRelations?: { key: string; type: string; sourceKey: string; targetKey: string }[];
  temporalQualifications?: GoldTiming[];
  expectedVariableOccasions?: GoldTiming[];
};
type Scenario = { id: string; title: string; domain: string; turns: Turn[] };
type Anomaly = { ANOMALY_ID: string; SCENARIO: string; TURN: string; SEVERITY: string; PROPERTY: string; VISIBLE_SYMPTOM: string; FIRST_BLOCKING_BOUNDARY: string; LIKELY_OWNER: string; PROJECT_IMPACT: string; QRY_IMPACT: string; REUSE_IMPACT: string; PROVIDER_DEPENDENCY: string; CLUSTER_ID: string; CONFIDENCE: string };
const root = resolve('validation/protocol-designer-v1-autonomous-adversarial-stabilization-01');
const phase = process.env.NOXIA_CAMPAIGN_PHASE ?? 'DISCOVERY';
const corpus = JSON.parse(readFileSync(resolve(root, 'corpus.json'), 'utf8'));
const selected = new Set((process.env.NOXIA_SCENARIOS ?? '').split(',').filter(Boolean));
const resume = JSON.parse(readFileSync(resolve(root, 'resume-state.json'), 'utf8'));
for (const done of resume.COMPLETED_SCENARIOS) {
  const actual = createHash('sha256').update(readFileSync(resolve(root, done.result))).digest('hex');
  if (actual !== done.sha256) throw new Error(`CHECKPOINT_EVIDENCE_CORRUPTED:${done.key}`);
}
const scenarios = (corpus.scenarios as Scenario[]).filter(s => (!selected.size || selected.has(s.id))
  && !resume.COMPLETED_SCENARIOS.some((done: { key: string }) => done.key === `${phase}:${s.id}`));
const phaseRoot = resolve(root, phase.toLowerCase());
mkdirSync(phaseRoot, { recursive: true });
const sha = (value: unknown) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const folded = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const current = () => JSON.parse(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
const objects = (session: FunctionalResetSession) => session.project ? ensureCanonicalProjectState(session.project).objects.filter(o => o.actuality === 'CURRENT') : [];
const save = (file: string, data: unknown) => { const target = resolve(root, file); mkdirSync(resolve(target, '..'), { recursive: true }); writeFileSync(target + '.tmp', JSON.stringify(data, null, 2) + '\n'); renameSync(target + '.tmp', target); };
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const ready = () => waitFor(() => { expect(document.querySelector('.animate-spin')).toBeNull(); }, { timeout: 4000 });
const mount = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

for (const scenario of scenarios) it(`${phase} ${scenario.id} — ${scenario.title}`, async () => {
  expect(process.env.NODE_OPTIONS).toContain('offline-guard');
  const freeze = JSON.parse(readFileSync(resolve(root, 'corpus-freeze.json'), 'utf8'));
  expect(sha(readFileSync(resolve(root, 'corpus.json'), 'utf8'))).toBe(freeze.corpusSha256);
  const sourceState = { head: git('rev-parse', 'HEAD'), trackedDiffSha256: sha(git('diff', '--', 'src', 'api')), harnessSha256: sha(readFileSync(resolve(root, 'campaign.test.tsx'), 'utf8')), transportSha256: sha(readFileSync(resolve(root, 'provider-transport.ts'), 'utf8')), corpusSha256: freeze.corpusSha256 };
  localStorage.clear(); window.history.replaceState({}, '', '/protocol-designer/demo');
  const witnesses: ProviderCallWitness[] = [];
  const provider = createAdversarialProviderTransport(witnesses, { corpus });
  const exchanges: unknown[] = [];
  const anomalies: Anomaly[] = [];
  const receipts: unknown[] = [];
  const runId = `${new Date().toISOString().replace(/[:.]/gu, '-')}-${process.pid}`;
  const runRelative = `${phase.toLowerCase()}/${scenario.id}/${runId}`;
  const runRoot = resolve(root, runRelative); mkdirSync(runRoot, { recursive: true });
  const visibleProposals = new Map<number, { projectDigest: string; candidates: { text: string; id: string; turnRef: string }[] }>();
  const expectedObjects = new Map<string, Delta>();
  const expectedRelations = new Map<string, NonNullable<Turn['semanticRelations']>[number]>();
  const expectedTimings = new Map<string, GoldTiming>();
  const expectedOccasions = new Map<string, GoldTiming>();
  let pendingGraph: Turn | null = null;
  const semanticReferences = new Map<string, Delta>(scenario.turns.flatMap(t => t.semanticDelta.map(d => [`${t.id}:${d.key}`, d] as const)));
  const applyGold = (deltas: Delta[]) => { for (const delta of deltas) {
    if (delta.operation === 'REMOVE') expectedObjects.delete(delta.key);
    else expectedObjects.set(delta.key, delta);
  }
    for (const relation of pendingGraph?.semanticRelations ?? []) expectedRelations.set(relation.key, relation);
    for (const timing of pendingGraph?.temporalQualifications ?? []) expectedTimings.set(timing.key, timing);
    for (const occasion of pendingGraph?.expectedVariableOccasions ?? []) expectedOccasions.set(occasion.key, occasion);
    pendingGraph = null;
  };
  let pendingGold: Delta[] = [];
  let activeTurn: Turn;
  let fatal: string | null = null;
  const transport = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url) !== '/api/protocol-designer-bridge') throw new Error(`UNEXPECTED_BROWSER_ENDPOINT:${String(url)}`);
    let status = 0; let body: unknown; const headers: Record<string, string> = {};
    const response: ApiResponse = { status(n) { status = n; return this; }, setHeader(k, v) { headers[k] = v; }, json(v) { body = v; } };
    const start = witnesses.length;
    await handleProtocolDesignerBridge({ method: init?.method, headers: { ...Object.fromEntries(new Headers(init?.headers).entries()), host: '127.0.0.1:5201', origin: 'http://127.0.0.1:5201' }, body: init?.body }, response,
      { NODE_ENV: 'development', OPENAI_API_KEY: 'offline-only', GEMINI_API_KEY: 'offline-only', GEMINI_MODEL: 'gemini-3.5-flash-lite' },
      { fetchImpl: provider, providerAttemptPolicy: 'SINGLE_ATTEMPT_FAIL_CLOSED' });
    exchanges.push({ turn: activeTurn.id, status, request: JSON.parse(String(init?.body)), response: body, providerWitnesses: witnesses.slice(start), realProviderCalls: 0 });
    return { ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body, text: async () => JSON.stringify(body) } as Response;
  });
  vi.stubGlobal('fetch', transport);
  mount();
  for (const turn of scenario.turns) {
    activeTurn = turn; provider.setActiveTurn(scenario.id, turn.id);
    const before = current(); const beforeProject = sha(before.project); const startCalls = witnesses.length; const startHttp = exchanges.length;
    const checks: { property: string; status: string; detail: string }[] = [];
    const check = (property: string, pass: boolean, detail: string, severity = 'MATERIAL', boundary = 'STANDARD_RUNTIME') => {
      checks.push({ property, status: pass ? 'PASS' : 'FAIL', detail });
      if (!pass) anomalies.push({ ANOMALY_ID: `${phase}-${scenario.id}-${turn.id}-${property}-${checks.length}`, SCENARIO: scenario.id, TURN: turn.id, SEVERITY: severity, PROPERTY: property, VISIBLE_SYMPTOM: detail, FIRST_BLOCKING_BOUNDARY: boundary, LIKELY_OWNER: 'TO_BE_CAUSALLY_ATTRIBUTED', PROJECT_IMPACT: sha(current().project) === beforeProject ? 'UNCHANGED' : 'CHANGED', QRY_IMPACT: 'TO_BE_ASSESSED', REUSE_IMPACT: 'TO_BE_ASSESSED', PROVIDER_DEPENDENCY: witnesses.length > startCalls ? 'SYNTHETIC_PROVIDER_BOUNDARY_TRAVERSED' : 'LOCAL_RUNTIME', CLUSTER_ID: 'UNASSIGNED', CONFIDENCE: 'OBSERVED_SYMPTOM_CAUSE_PENDING' });
    };
    let afterInput: FunctionalResetSession = before;
    try {
      await ready();
      await act(async () => { fireEvent.change(screen.getByLabelText('Votre message'), { target: { value: turn.userText } }); });
      await waitFor(() => expect(screen.getByRole('button', { name: 'Envoyer' })).not.toBeDisabled());
      await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Envoyer' })); await new Promise(r => setTimeout(r, 0)); });
      await ready(); afterInput = current();
      const errors = afterInput.entries.slice(before.entries.length).filter(e => e.kind === 'ERROR').map(e => e.content);
      check('STANDARD_CONVERSATION', !errors.length, errors.length ? errors.join('\n') : 'Input completed without visible technical error', 'MATERIAL', 'STANDARD_INPUT_TO_RESPONSE');
      if (turn.expectedProjectEffect.afterInput === 'NO_WRITE') check('NO_PROJECT_WRITE_BEFORE_HUMAN_DECISION', sha(afterInput.project) === beforeProject, 'Project must remain byte-equivalent before a gold-authorized decision', 'FATAL', 'HUMAN_DECISION_TO_PROJECT');
      if (turn.outcome === 'CANDIDATE') {
        const pending = afterInput.pendingContribution;
        check('CONVERSATIONAL_ACT', Boolean(pending) && pending?.identity.contributionId !== before.pendingContribution?.identity.contributionId, 'Expected a new candidate awaiting human review', 'MATERIAL', 'CONVERSATIONAL_ACT_TO_CANDIDATE');
        if (turn.outcome === 'CANDIDATE') {
          pendingGold = turn.semanticDelta;
          pendingGraph = turn;
          const candidateText = JSON.stringify(pending?.scientificContent ?? {});
          for (const delta of turn.semanticDelta) check(`CANDIDATE_SEMANTICS_${delta.key}`, folded(candidateText).includes(folded(delta.content)), `Expected scientific candidate meaning: ${delta.content}`, 'MATERIAL', 'PROVIDER_CONTRACT_TO_CANDIDATE');
        }
      }
      if (turn.expectedProjectEffect.afterInput === 'ADOPT_PENDING') {
        check('HUMAN_DECISION_BOUNDARY', (afterInput.project?.revision ?? 0) === (before.project?.revision ?? 0) + 1, 'An explicit confirmation must adopt the current pending candidate exactly once', 'MATERIAL', 'CONFIRMATION_TO_PROJECT');
        if ((afterInput.project?.revision ?? 0) === (before.project?.revision ?? 0) + 1) await waitFor(() => expect(current().queryNavigation?.currentAction === null || current().bridgeTraces.some(trace => trace.requestKind === 'POST_ADOPTION_QRY_CONTINUATION' && trace.projectVersionBefore === current().project!.versionId)).toBe(true), { timeout: 4000 });
        applyGold(pendingGold); pendingGold = [];
      }
      if (turn.expectedProjectEffect.afterInput === 'REJECT_PENDING' || turn.outcome === 'REFUSE') {
        check('REFUSAL_PRESERVES_CURRENT_PROJECT', sha(afterInput.project) === beforeProject, 'Refusal must preserve the entire adopted Project', 'FATAL', 'REFUSAL_TO_PROJECT');
        const refusedTarget = before.retainedContributionCandidates?.find(record => record.contribution.identity.contributionId === before.pendingContribution?.identity.contributionId && !record.humanDecision);
        check('REFUSAL_LIFECYCLE', Boolean(refusedTarget) && afterInput.retainedContributionCandidates?.find(record => record.candidateRef === refusedTarget?.candidateRef)?.humanDecision?.status === 'REJECTED', 'The pending candidate identity must transition to explicitly rejected during this input', 'MATERIAL', 'REFUSAL_TO_CANDIDATE');
        pendingGold = []; pendingGraph = null;
      }
      const replies = afterInput.runtimeTurns.slice(before.runtimeTurns.length).filter(t => t.role === 'NOXIA').map(t => t.content).join('\n');
      if (turn.outcome === 'SELECT_OLD_PROPOSAL') {
        const prior = turn.selection && visibleProposals.get(turn.selection.sourceTurn);
        const selectedCandidate = prior?.candidates[(turn.selection?.ordinal ?? 1) - 1];
        const pending = afterInput.pendingContribution;
        const newPending = Boolean(pending && pending.identity.contributionId !== before.pendingContribution?.identity.contributionId);
        if (newPending) {
          check('OLD_PROPOSAL_SELECTION_IDENTITY', Boolean(selectedCandidate) && folded(JSON.stringify(pending!.scientificContent)).includes(folded(selectedCandidate!.text)), 'Selection must target the exact previously visible proposal, never substitute another', 'FATAL', 'REFERENCE_RESOLUTION_TO_HUMAN_REVIEW');
          if (selectedCandidate) pendingGold = [{ operation: 'ADD', key: `selected:${selectedCandidate.id}`, type: 'HYPOTHESIS', content: selectedCandidate.text }];
        } else {
          const referenceStale = !prior || prior.projectDigest !== before.project?.projectDigest;
          const referenceExplained = /précis|identifi|retrouv|ancien|référen|quelle|lequel|laquelle|version|applicab|obsolèt/iu.test(replies);
          check('OLD_REFERENCE_SAFE_ABSTENTION', referenceStale && referenceExplained, 'Missing/stale reference needs an explicit reference or applicability clarification; generic acknowledgement is insufficient', 'MATERIAL', 'OLD_REFERENCE_TO_CURRENT_PROJECT');
          checks.push({ property: 'OLD_REFERENCE_FUNCTIONAL_REACHABILITY', status: 'NOT_DEMONSTRATED', detail: 'No candidate selected; preserve this limitation separately from safe abstention.' });
          pendingGold = [];
        }
      }
      if (['PROPOSAL', 'DISCUSS', 'EXPLAIN'].includes(turn.outcome)) {
        check('DISCUSSION_NOT_CONFUSED_WITH_PROJECT_CORRECTION', !afterInput.pendingContribution || afterInput.pendingContribution.identity.contributionId === before.pendingContribution?.identity.contributionId, 'Scientific discussion/proposal/explanation must not become an asserted Project correction', 'MATERIAL', 'CONVERSATIONAL_ACT_TO_OWNER');
        check('SCIENTIFIC_RESPONSE_PRESENT', replies.trim().length > 60, 'Scientific intervention must produce a substantive visible response; length does not qualify scientific usefulness', 'MATERIAL', 'OWNER_TO_STANDARD_PROJECTION');
        if (turn.outcome !== 'PROPOSAL') checks.push({ property: 'SCIENTIFIC_USEFULNESS', status: 'REQUIRES_INDEPENDENT_SEMANTIC_REVIEW', detail: 'Requested explanation/discussion scope must be assessed against actual reply and frozen intent; no usefulness PASS is inferred from length.' });
        if (turn.outcome === 'PROPOSAL') {
          const prior = before.runtimeTurns.filter(t => t.role === 'NOXIA').at(-1)?.content ?? '';
          const exhausted = /(?:ne peux pas|pas d[’']|aucune?).{0,70}(?:hypothèse|alternative|proposition).{0,70}(?:supplémentaire|défendable|justifi)/iu.test(replies);
          check('PURPOSE_AND_REUSE', (replies.trim().length > 60 && replies !== prior) || exhausted, 'Proposal request must add useful content or provide a bounded explanation of exhaustion', 'MATERIAL', 'QRY_PURPOSE_TO_OWNER_REUSE');
          check('EXPLICIT_PROPOSAL_REMAINS_CANDIDATE', sha(afterInput.project) === beforeProject, 'Proposals cannot be silently adopted', 'FATAL', 'SCIENTIFIC_OWNER_TO_PROJECT');
          if (!exhausted) {
            const material = objects(afterInput).filter(o => ['PRIMARY_ENDPOINT', 'INTERVENTION_ARM', 'COMPARATOR_ARM'].includes(o.scientificRole ?? ''));
            check('SCIENTIFIC_PROJECT_ANCHORING', material.length > 0 && material.every(o => folded(replies).includes(folded(o.content))), 'New proposals must preserve current scientific comparison and criterion, not merely differ in wording', 'MATERIAL', 'OWNER_PURPOSE_TO_STANDARD_CONTENT');
            check('SCIENTIFIC_CANDIDATE_STATUS', /candidat|proposition|hypothèse|option/iu.test(replies), 'Scientific alternatives must remain explicitly discussable candidates', 'MATERIAL', 'OWNER_TO_STANDARD_PROJECTION');
          }
          const interaction = afterInput.scientificThinkingInteraction;
          const native = afterInput.knowledgeOwnerLedger.entries.find(e => e.result?.resultId === interaction?.ownerResultRef)?.result?.nativePayload as { hypotheses?: { text: string; hypothesisId: string }[] } | undefined;
          const visible = (native?.hypotheses ?? []).filter(h => replies.includes(h.text));
          if (visible.length && interaction) visibleProposals.set(scenario.turns.indexOf(turn) + 1, { projectDigest: interaction.sourceProjectDigest, candidates: visible.map(h => ({ text: h.text, id: h.hypothesisId, turnRef: interaction.presentationTurnRef })) });
        }
      }
      for (const action of turn.uiActions ?? []) {
        const kind = typeof action === 'string' ? action : action.kind;
        if (kind.includes('CONFIRM')) {
          const review = screen.queryAllByTestId('functional-contribution-review').at(-1);
          const button = review && within(review).queryByRole('button', { name: 'Cela correspond à mon projet' });
          check('HUMAN_REVIEW_REACHABLE', Boolean(button), 'Gold requires the actual Human Review confirmation control', 'MATERIAL', 'CANDIDATE_TO_HUMAN_REVIEW');
          const candidateSafe = !checks.some(c => c.status === 'FAIL' && (c.property.startsWith('CANDIDATE_SEMANTICS_') || c.property === 'CONVERSATIONAL_ACT'));
          if (button && candidateSafe) {
            const revision = current().project?.revision ?? 0;
            await act(async () => { fireEvent.click(button); await new Promise(r => setTimeout(r, 0)); }); await ready();
            check('PROJECT_VERSIONING', current().project?.revision === revision + 1, 'Human confirmation must increment Project revision exactly once', 'MATERIAL', 'HUMAN_REVIEW_TO_PERSISTENCE');
            if (current().project?.revision === revision + 1) await waitFor(() => expect(current().queryNavigation?.currentAction === null || current().bridgeTraces.some(trace => trace.requestKind === 'POST_ADOPTION_QRY_CONTINUATION' && trace.projectVersionBefore === current().project!.versionId)).toBe(true), { timeout: 4000 });
          }
          if (button && !candidateSafe) checks.push({ property: 'HUMAN_REVIEW_WITHHELD', status: 'BLOCKED_BY_CANDIDATE_MISMATCH', detail: 'A semantic mismatch is not human-authorized merely because the gold intended a later confirmation.' });
          applyGold(pendingGold); pendingGold = [];
        } else if (/RELOAD|RESTORE|REOPEN/u.test(kind)) {
          const persisted = current(); cleanup(); mount(); await ready();
          check('SESSION_RESTORATION', sha(current().project) === sha(persisted.project), 'Reopening must reconstruct the same adopted Project from persistence', 'FATAL', 'PERSISTENCE_TO_STANDARD');
        } else if (kind === 'SELECT_PREVIOUS_VISIBLE_PROPOSAL') {
          checks.push({ property: 'SELECTION_UI_SURFACE', status: 'CONVERSATIONAL_SELECTION_EXERCISED', detail: 'Scientific Thinking exposes selection through the submitted Standard message; no separate hypothesis selection button is available.' });
        } else if (/DOCUMENT|PROTOCOL/u.test(kind)) {
          const button = screen.queryByRole('button', { name: /^(?:Créer|Actualiser) l’aperçu$/u });
          if (!button) checks.push({ property: 'DOCUMENT_CAPABILITY', status: 'NOT_EVALUABLE', detail: 'Existing UI does not expose document generation at this state; no new capability created.' });
          else {
            const projectDigest = current().project?.projectDigest;
            await act(async () => { fireEvent.click(button); await new Promise(r => setTimeout(r, 0)); });
            const projection = current().documents.projections.at(-1);
            check('DOCUMENT_CURRENT_PROJECT', projection?.source.projectDigest === projectDigest, 'Document generation must reference current Project digest', 'MATERIAL', 'CURRENT_PROJECT_TO_DOCUMENT');
            const close = screen.queryByRole('button', { name: 'Retour à la conversation' });
            if (close) await act(async () => { fireEvent.click(close); });
          }
        }
      }
      const after = current();
      if (after.project) {
        check('CURRENT_PROJECT_DRIVES_QRY', after.queryNavigation?.projectRef === after.project.projectId && after.queryNavigation?.projectVersion === after.project.versionId && after.queryNavigation?.projectDigest === after.project.projectDigest, 'QRY must bind the exact current Project identity/version/digest', 'MATERIAL', 'PROJECT_TO_QRY');
        const requested = after.queryNavigation?.standardQuestion?.informationNeedRefs ?? [];
        check('RESOLVED_NEED_NOT_GENERICALLY_REASKED', !requested.some(ref => after.queryNavigation?.memory.resolvedNeedRefs.includes(ref)), 'Selected needs must not already be resolved', 'MATERIAL', 'QRY_NEED_SELECTION');
        const interaction = after.scientificThinkingInteraction;
        if (interaction?.status === 'ACTIVE') {
          check('REUSE_FRESHNESS', interaction.sourceProjectRef === after.project.projectId && interaction.sourceProjectVersion === after.project.versionId && interaction.sourceProjectDigest === after.project.projectDigest, 'Active Scientific Thinking interaction must remain bound to the current Project', 'MATERIAL', 'PROJECT_CHANGE_TO_OWNER_FRESHNESS');
          const entry = after.knowledgeOwnerLedger.entries.find(e => e.result?.resultId === interaction.ownerResultRef);
          check('OWNER_CORRECTNESS', entry?.request.owner === 'SCIENTIFIC_THINKING', 'Scientific Thinking interaction must reference a result produced by its declared owner', 'MATERIAL', 'QRY_TO_OWNER_RESULT');
        }
      }
      const active = objects(after); const currentText = active.map(o => o.content).join('\n');
      const findKey = (key: string) => active.filter(o => o.objectId === key || o.sourceItemRefs.includes(key));
      if (turn.goldChecks?.currentMeaningByKey) {
        expectedObjects.clear();
        for (const [key, ref] of Object.entries(turn.goldChecks.currentMeaningByKey)) {
          const meaning = semanticReferences.get(ref); if (!meaning) throw new Error(`HARNESS_UNRESOLVED_GOLD_REFERENCE:${ref}`);
          expectedObjects.set(key, meaning);
        }
        check('NO_UNAUTHORIZED_SCIENTIFIC_OBJECT', active.every(o => [...expectedObjects.keys()].some(key => o.objectId === key || o.sourceItemRefs.includes(key))), 'Every adopted object must be grounded in a gold-authorized human decision; examples and hypothetical rules cannot create extra objects', 'FATAL', 'HUMAN_DECISION_TO_PROJECT');
      }
      for (const delta of expectedObjects.values()) {
        check(`EARLY_INFORMATION_${delta.key}`, folded(currentText).includes(folded(delta.content)), `Adopted meaning remains available: ${delta.content}`, 'MATERIAL', 'PROJECT_PERSISTENCE_AND_PARTIAL_CORRECTION');
        if (!delta.key.startsWith('selected:')) {
          const matches = findKey(delta.key);
          check(`OBJECT_IDENTITY_${delta.key}`, matches.length === 1, `Exactly one current canonical object must carry the adopted semantic identity: ${delta.key}`, 'MATERIAL', 'PROJECT_OBJECT_IDENTITY');
          if (matches.length === 1) {
            check(`OBJECT_SEMANTICS_${delta.key}`, folded(matches[0].content).includes(folded(delta.content)), `The exact current object must retain its own adopted meaning: ${delta.key}`, 'MATERIAL', 'PARTIAL_CHANGESET_TO_CANONICAL_OBJECT');
            check(`OBJECT_TYPE_${delta.key}`, matches[0].projection.sourceProposedType === delta.type, `Adopted object must preserve its declared scientific type: ${delta.type}`, 'MATERIAL', 'SEMANTIC_TYPE_TO_CANONICAL_OBJECT');
            if (delta.studyRole) check(`OBJECT_ROLE_${delta.key}`, matches[0].projection.sourceStudyRole === delta.studyRole, `Adopted object must preserve its declared role: ${delta.studyRole}`, 'MATERIAL', 'SCIENTIFIC_ROLE_TO_CANONICAL_OBJECT');
            if (delta.epistemicState === 'UNKNOWN') check(`OBJECT_UNKNOWN_${delta.key}`, matches[0].epistemicState === 'UNKNOWN', `This exact object must preserve uncertainty: ${delta.key}`, 'MATERIAL', 'CANONICAL_UNKNOWN_PRESERVATION');
          }
        }
        if (delta.epistemicState === 'UNKNOWN') check(`UNKNOWN_${delta.key}`, active.some(o => folded(o.content).includes(folded(delta.content)) && o.epistemicState === 'UNKNOWN'), `Uncertainty must not become fact: ${delta.content}`, 'MATERIAL', 'CANDIDATE_TO_CANONICAL_PROJECT');
      }
      for (const ref of turn.goldChecks?.mustContainCurrent ?? []) {
        const content = semanticReferences.get(ref)?.content; if (!content) throw new Error(`HARNESS_UNRESOLVED_GOLD_REFERENCE:${ref}`);
        check(`GOLD_CURRENT_CONTENT_${ref}`, folded(currentText).includes(folded(content)), `Gold required current meaning: ${content}`);
      }
      for (const ref of turn.goldChecks?.mustNotContainCurrent ?? []) {
        const content = semanticReferences.get(ref)?.content; if (!content) throw new Error(`HARNESS_UNRESOLVED_GOLD_REFERENCE:${ref}`);
        const laterAuthorized = Object.values(turn.goldChecks?.currentMeaningByKey ?? {}).some(currentRef => currentRef !== ref && semanticReferences.get(currentRef)?.content === content);
        if (laterAuthorized) checks.push({ property: `GOLD_REJECTION_SUPERSEDED_${ref}`, status: 'SUPERSEDED_BY_LATER_EXPLICIT_GOLD_ADOPTION', detail: 'Rejection binds the rejected candidate, not an everlasting prohibition of identical content later re-proposed and confirmed.' });
        else check(`GOLD_NOT_ADOPTED_${ref}`, !folded(currentText).includes(folded(content)), `Gold forbidden adopted meaning: ${content}`, 'FATAL', 'HUMAN_DECISION_TO_PROJECT');
      }
      for (const key of turn.goldChecks?.unknownKeys ?? []) check(`GOLD_UNKNOWN_${key}`, findKey(key).length === 1 && findKey(key)[0].epistemicState === 'UNKNOWN', `Gold UNKNOWN must retain its exact object identity: ${key}`, 'MATERIAL', 'CANONICAL_UNKNOWN_PRESERVATION');
      for (const key of turn.goldChecks?.conserveKeys ?? []) {
        const prior = objects(before).find(o => o.objectId === key || o.sourceItemRefs.includes(key));
        if (prior) check(`PARTIAL_CORRECTION_PRESERVES_${key}`, active.some(o => o.objectId === prior.objectId && sha(o) === sha(prior)), `Untargeted object, attributes and provenance must remain byte-equivalent: ${key}`, 'FATAL', 'PARTIAL_CHANGESET_TO_CANONICAL_OBJECT');
      }
      if (after.project) {
        const canonical = ensureCanonicalProjectState(after.project);
        for (const relation of expectedRelations.values()) {
          const source = findKey(relation.sourceKey)[0]?.objectId; const target = findKey(relation.targetKey)[0]?.objectId;
          check(`RELATION_${relation.key}`, canonical.relations.some(r => r.actuality === 'CURRENT' && r.relationType === relation.type && r.sourceObjectRef === source && r.targetObjectRef === target), 'Adopted comparison retains exact current scientific endpoints', 'MATERIAL', 'SEMANTIC_RELATION_TO_PROJECT');
        }
        const anchorMatches = (actual: Record<string, unknown>, expected: Record<string, unknown>) => ['kind', 'direction', 'unit', 'offset', 'lowerBound', 'upperBound', 'relativeEventLabel'].every(k => actual[k] === expected[k]);
        for (const timing of expectedTimings.values()) {
          const target = findKey(timing.subjectKey!)[0]?.objectId;
          const matches = canonical.temporalQualifications.filter(q => q.actuality === 'CURRENT' && q.subjectProjectRef === target && q.temporalRole === timing.temporalRole);
          check(`TEMPORAL_QUALIFICATION_${timing.key}`, matches.length === 1 && anchorMatches(matches[0].anchor, timing.anchor), 'Adopted temporal qualification preserves interval, units, relative event and current target', 'MATERIAL', 'TEMPORAL_DELTA_TO_CURRENT_PROJECT');
        }
        for (const occasion of expectedOccasions.values()) {
          const target = findKey(occasion.variableKey!)[0]?.objectId;
          const matches = canonical.expectedVariableOccasions.filter(o => o.actuality === 'CURRENT' && o.variableProjectRef === target);
          check(`EXPECTED_OCCASION_${occasion.key}`, matches.some(o => anchorMatches(o.anchor, occasion.anchor)), 'Variable occasion retains its distinct temporal anchor after later acquisition changes', 'MATERIAL', 'EXPECTED_VARIABLE_OCCASION_PERSISTENCE');
        }
      }
      checks.push({ property: 'LANGUAGE_UNDERSTANDING', status: 'SYNTHETIC_CONTRACT_ONLY', detail: 'Provider language fidelity is not measured; real local act routing and downstream semantics are evaluated against independently frozen gold.' });
      if (active.length) check('PROVENANCE_PRESERVATION', active.every(o => o.objectId && o.objectVersionId && o.sourceContributionRef && o.decisionRefs.length && o.provenance.sourceTurnRefs.length), 'Every current object retains version, contribution, human decision and source-turn provenance', 'FATAL', 'CANONICAL_OBJECT_PROVENANCE');
      const receipt = { scenario: scenario.id, turn: turn.id, input: turn.userText, intendedMeaning: turn.intent, outcome: turn.outcome, checks, projectBefore: before.project, projectAfterInput: afterInput.project, projectAfter: after.project, qry: after.queryNavigation, reply: replies, interaction: after.scientificThinkingInteraction, ownerResultCountBefore: before.knowledgeOwnerLedger.entries.length, ownerResultCountAfter: after.knowledgeOwnerLedger.entries.length, latestTrace: after.bridgeTraces.slice(before.bridgeTraces.length).at(-1) ?? (after.bridgeTraces.at(-1)?.turnId !== before.bridgeTraces.at(-1)?.turnId ? after.bridgeTraces.at(-1) : null), visibleErrors: errors, httpCalls: exchanges.length - startHttp, syntheticProviderCalls: witnesses.length - startCalls, realProviderCalls: 0 };
      receipts.push(receipt); appendFileSync(resolve(runRoot, 'turns.jsonl'), JSON.stringify(receipt) + '\n');
      if (anomalies.some(a => a.TURN === turn.id && a.SEVERITY === 'FATAL')) { fatal = `FATAL_INVARIANT_AT:${turn.id}`; break; }
    } catch (error) {
      fatal = String(error); check('CONVERSATION_RUNTIME_COMPLETION', false, fatal, 'UNCLASSIFIED_EXECUTION_ISSUE', 'HARNESS_OR_RUNTIME_REQUIRES_ATTRIBUTION');
      const receipt = { scenario: scenario.id, turn: turn.id, input: turn.userText, error: fatal, checks, providerWitnesses: witnesses.slice(startCalls) };
      receipts.push(receipt); appendFileSync(resolve(runRoot, 'turns.jsonl'), JSON.stringify(receipt) + '\n');
      break;
    }
  }
  const result = { sourceState: { ...sourceState, stableThroughConversation: sourceState.trackedDiffSha256 === sha(git('diff', '--', 'src', 'api')) }, phase, scenario: scenario.id, title: scenario.title, turnsAttempted: receipts.length, plannedTurns: scenario.turns.length, harnessCompleted: !fatal, fatal, anomalies, checks: receipts, realProviderCalls: 0, syntheticProviderCalls: witnesses.length };
  save(`${runRelative}/result.json`, result);
  save(`${runRelative}/session.json`, current());
  save(`${runRelative}/http.json`, exchanges);
  const state = JSON.parse(readFileSync(resolve(root, 'resume-state.json'), 'utf8'));
  const key = `${phase}:${scenario.id}`;
  state.CURRENT_PHASE = phase;
  state.CURRENT_HEAD = git('rev-parse', 'HEAD');
  state.TRACKED_WORKTREE_STATE = git('diff', '--name-only') || 'CLEAN';
  state.STAGED_STATE = git('diff', '--cached', '--name-only') || 'CLEAN';
  state.COMPLETED_SCENARIOS = [...state.COMPLETED_SCENARIOS.filter((s: { key: string }) => s.key !== key), { key, phase, scenario: scenario.id, turns: receipts.length, result: `${runRelative}/result.json`, sha256: sha(readFileSync(resolve(runRoot, 'result.json'), 'utf8')) }];
  state.COMPLETED_TURNS = state.COMPLETED_SCENARIOS.reduce((n: number, s: { turns: number }) => n + s.turns, 0);
  state.DISCOVERED_ANOMALIES = [...state.DISCOVERED_ANOMALIES.filter((a: Anomaly) => !a.ANOMALY_ID.startsWith(`${phase}-${scenario.id}-`)), ...anomalies];
  state.LAST_VALID_CHECKPOINT = `${phase}_${scenario.id}_PERSISTED`;
  state.NEXT_DETERMINISTIC_ACTION = `Continue ${phase} from next uncompleted frozen scenario; preserve all existing proofs`;
  save('resume-state.json', state);
  appendFileSync(resolve(root, 'checkpoint-log.md'), `- ${new Date().toISOString()} — ${phase} ${scenario.id}: ${receipts.length}/${scenario.turns.length} turns; ${anomalies.length} observed anomalies; ${fatal ? 'conversation stopped, cause pending' : 'conversation completed'}. Evidence persisted. New providers=0.\n`);
  // This test qualifies evidence collection, not product success. Product verdicts
  // are the per-turn semantic oracle above, including all continuing anomalies.
  expect(receipts.length).toBeGreaterThan(0);
  expect(result.sourceState.stableThroughConversation).toBe(true);
});
