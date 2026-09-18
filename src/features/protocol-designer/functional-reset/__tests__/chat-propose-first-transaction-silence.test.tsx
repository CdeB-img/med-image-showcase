import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { executeProtocolDesignerBridge } from '../../../../../api/protocol-designer-bridge';
import { prepareTerraConversation } from '@/features/scientific-thinking/scientific-collaborator-conversation';
import { prepareResearchProjectContributionCandidate } from '@/features/research-project-construction';
import type { ProductBridgeRequest, ProductBridgeResponse } from '../../product-bridge';
import { bridgeRequest } from '../../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures';
import { isExplicitProjectRecordingRequest } from '../natural-conversation-policy';
import { createFunctionalResetSession, persistFunctionalResetSession, loadFunctionalResetSession } from '../session';
import { adoptBehaviorContribution, richStudyContribution } from './p1-behavior-01a-contract-fixtures';
import ProtocolDesignerWorkspace from '../ProtocolDesignerWorkspace';

const mocks = vi.hoisted(() => ({ bridge: vi.fn(), failPreparation: false }));
vi.mock('../../product-bridge-client', async original => ({ ...await original<object>(), requestProtocolDesignerBridge: mocks.bridge }));
vi.mock('@/features/research-project-construction', async original => {
  const real = await original<typeof import('@/features/research-project-construction')>();
  return { ...real, prepareResearchProjectContributionCandidate: vi.fn((...args: Parameters<typeof real.prepareResearchProjectContributionCandidate>) => {
    if (mocks.failPreparation) throw new Error('LOCAL_SYNTHETIC_PREPARATION_FAILURE');
    return real.prepareResearchProjectContributionCandidate(...args);
  }) };
});
afterEach(() => { cleanup(); mocks.bridge.mockReset(); mocks.failPreparation = false; localStorage.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const reply = 'LOCAL_SYNTHETIC — texte libre livré par le provider.\n\nAucune réponse scientifique attendue n’est encodée.';
const native = () => new Response(JSON.stringify({ id: 'LOCAL_SYNTHETIC', model: 'gpt-5.6-terra', status: 'completed', output: [{ content: [{ type: 'output_text', text: reply }] }], usage: { input_tokens: 100, output_tokens: 30, total_tokens: 130 } }));
const call = async (r: ProductBridgeRequest, provider: typeof fetch) => {
  const result = await executeProtocolDesignerBridge({ body: r, apiKey: null, openAiApiKey: 'LOCAL_SYNTHETIC', chatRuntime: 'TERRA', fetchImpl: provider, providerAttemptPolicy: 'SINGLE_ATTEMPT_FAIL_CLOSED' });
  expect(result.status).toBe(200); return result.body as ProductBridgeResponse;
};
const send = (text: string) => { fireEvent.change(screen.getByRole('textbox', {name: 'Votre message'}), {target: {value: text}}); fireEvent.click(screen.getByRole('button', {name: 'Envoyer'})); };
const mount = (session = createFunctionalResetSession()) => {
  vi.stubEnv('VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME', 'TERRA');
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={next => { persistFunctionalResetSession(localStorage, next); return true; }} /></HelmetProvider>);
  return session;
};

// These tests qualify common instructions/context/response isolation, not LLM scientific competence.
const domains = [
  ['pharmacological randomised', "Je souhaite comparer un médicament au placebo chez des adultes, randomisation en deux groupes, traitement durant douze semaines, symptômes recueillis avant traitement et en fin de suivi. Le but est de comparer leur amélioration ; le recrutement sera monocentrique."],
  ['observational imaging', "Nous voulons décrire les anomalies pulmonaires chez les patients adressés pour scanner, sans intervention, avec un examen unique et une lecture indépendante par deux radiologues. Nous comparerons les résultats aux symptômes recueillis le même jour."],
  ['methodological reproducibility', "Je propose une étude de reproductibilité d'une mesure de rigidité sur des matériaux. Chaque pièce sera mesurée par deux opérateurs et de nouveau une semaine après, avec le même appareil. L'objectif est de distinguer variabilité entre opérateurs et variabilité de répétition."],
  ['longitudinal follow-up', "Je veux suivre la qualité du sommeil d'étudiants pendant une année, par questionnaire chaque mois et journal de sommeil lors des examens. Je souhaite analyser les variations individuelles en fonction du calendrier universitaire, sans traitement imposé."],
  ['poor ambiguous', 'je veux faire une étude sur la myocardite'],
  ['targeted question', 'quelle différence entre analyse transversale et longitudinale ?'],
];
describe('Generic nominal scientific Chat — mechanics, pending human review', () => {
  it.each(domains)('RICH/POOR/TARGETED: same semantic behaviour owner and intact native text — %s', async (_domain, input) => {
    const request = {...bridgeRequest(input), evaluatePersistentDelta: false};
    const provider = vi.fn<typeof fetch>().mockResolvedValue(native());
    const result = await call(request, provider);
    const payload = JSON.parse(String(provider.mock.calls[0][1]?.body));
    expect(payload.instructions).toBe(prepareTerraConversation({...bridgeRequest('un autre sujet'), evaluatePersistentDelta: false}).instruction);
    for (const property of ['INTENT_INFORMATION_DENSITY', 'SCIENTIFIC_STRUCTURE_ALREADY_INFERABLE', 'NUMBER_OF_EXPLICIT_DECISIONS', 'NUMBER_OF_OPEN_HIGH_VALUE_ARBITRATIONS', 'USER_REQUEST_TYPE']) expect(payload.instructions).toContain(property);
    expect(payload.instructions).toContain('première architecture substantielle');
    expect(payload.instructions).toContain('Si la matière est insuffisante');
    expect(payload.instructions).toContain('Si la demande est une question ciblée');
    expect(payload.instructions).not.toMatch(/ultratrail|Tor des Géants|IRM mobile|médicament|pulmonaire|matériaux|étudiants/iu);
    expect(payload).toMatchObject({ model: 'gpt-5.6-terra', reasoning: {effort: 'medium'}, store: false });
    expect(JSON.parse(payload.input).RECENT_CONVERSATION.at(-1).content).toBe(input);
    expect(JSON.parse(payload.input).TRANSACTION_REQUESTED).toBe(false);
    expect(result.assistantReply).toBe(reply); expect(result.persistentExtraction.called).toBe(false);
    expect(result.observability.projectWrites).toBe(0); expect(provider).toHaveBeenCalledTimes(1);
  });
  it.each(['enregistre ça', 'Enregistrez ces choix', 'je veux enregistrer cela', 'vous pouvez enregistrer', 'peux-tu enregistrer ces choix ?', 'je valide', 'je retiens ces choix', 'ajoute-le au projet', 'mets à jour le projet'])('explicit recording operation, not adoption: %s', text => expect(isExplicitProjectRecordingRequest(text)).toBe(true));
  it.each(['ne l’enregistre pas', 'je ne veux pas enregistrer', 'enregistre pas ça', 'on adopte pas', 'comment enregistrer ces choix ?', 'quand faut-il enregistrer ?', 'je confirme que le suivi est à trois mois', 'je valide le format', 'tu as dit « enregistre ça »', 'ok je vois', 'je propose une étude', ...domains.map(d => d[1])])('no recording operation: %s', text => expect(isExplicitProjectRecordingRequest(text)).toBe(false));
  it.each(['BLOCKED', 'TECHNICAL_FAILURE'] as const)('NO_TRANSACTION_MESSAGE_WITHOUT_RECORD_INTENT: %s remains diagnostic only', async status => {
    mocks.bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      const result = await call({...request, apiVersion: '1.0.0'}, vi.fn<typeof fetch>().mockResolvedValue(native()));
      return {...result, persistentExtraction: {...result.persistentExtraction, called: true, status}};
    });
    const session = mount(); const before = JSON.stringify({project: session.project, documents: session.documents});
    send(domains[0][1]); await screen.findByText(/^LOCAL_SYNTHETIC — texte libre/u);
    await waitFor(() => expect(screen.getByRole('button', {name: 'Préparer l’enregistrement'})).toBeEnabled());
    expect(mocks.bridge.mock.calls[0][0].evaluatePersistentDelta).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
    const saved = loadFunctionalResetSession(localStorage);
    expect(saved.entries.filter(e => e.kind === 'ERROR' || e.kind === 'REVIEW')).toHaveLength(0);
    expect(JSON.stringify({project: saved.project, documents: saved.documents})).toBe(before);
    expect(saved.bridgeTraces.at(-1)?.persistentExtractionStatus).toBe(status);
  });
  it('ignores an unsolicited candidate even if downstream preparation would throw', async () => {
    const contribution = richStudyContribution();
    mocks.bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      const result = await call({...request, apiVersion: '1.0.0'}, vi.fn<typeof fetch>().mockResolvedValue(native()));
      return {...result, persistentExtraction: {...result.persistentExtraction, called: true, status: 'CANDIDATE', contribution}};
    });
    const session = mount(); mocks.failPreparation = true;
    send(domains[1][1]); await screen.findByText(/^LOCAL_SYNTHETIC — texte libre/u);
    await waitFor(() => expect(screen.getByRole('button', {name: 'Préparer l’enregistrement'})).toBeEnabled());
    const saved = loadFunctionalResetSession(localStorage);
    expect(saved.currentContribution).toBe(session.currentContribution); expect(saved.pendingContribution).toBeNull();
    expect(saved.entries.filter(e => e.kind === 'ERROR' || e.kind === 'REVIEW')).toHaveLength(0);
  });
  it('TRANSACTION_MESSAGE_WHEN_RECORD_REQUESTED + CHAT_RESPONSE_SURVIVES_TRANSACTION_FAILURE: provider failure', async () => {
    mocks.bridge.mockImplementation(async (request: ProductBridgeRequest) => call({...request, apiVersion: '1.0.0'}, vi.fn<typeof fetch>().mockResolvedValueOnce(native()).mockResolvedValueOnce(new Response('{}', {status: 503}))));
    mount(); send('enregistre ça'); await screen.findByText(/^LOCAL_SYNTHETIC — texte libre/u);
    expect(await screen.findByText('Je conserve la discussion, mais l’enregistrement n’a pas abouti.')).toHaveAttribute('role', 'alert');
    expect(mocks.bridge.mock.calls[0][0].evaluatePersistentDelta).toBe(true);
    const saved = loadFunctionalResetSession(localStorage); expect(saved.project).toBeNull();
    expect(saved.runtimeTurns.at(-1)?.content).toBe(reply);
  });
  it('CHAT_RESPONSE_SURVIVES_TRANSACTION_FAILURE: local candidate preparation exception', async () => {
    const contribution = richStudyContribution();
    mocks.bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      const result = await call({...request, apiVersion: '1.0.0', evaluatePersistentDelta: false}, vi.fn<typeof fetch>().mockResolvedValue(native()));
      return {...result, persistentExtraction: {...result.persistentExtraction, called: true, status: 'CANDIDATE', contribution}};
    });
    mount(); mocks.failPreparation = true; vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    send('je retiens ces choix'); await screen.findByText(/^LOCAL_SYNTHETIC — texte libre/u);
    await screen.findByText('Je conserve la discussion, mais l’enregistrement n’a pas abouti.');
    const saved = loadFunctionalResetSession(localStorage);
    expect(saved.runtimeTurns.at(-1)?.content).toBe(reply); expect(saved.project).toBeNull(); expect(saved.pendingContribution).toBeNull();
    expect(saved.entries.filter(e => e.kind === 'REVIEW')).toHaveLength(0);
    expect(prepareResearchProjectContributionCandidate).toHaveBeenCalled();
  });
  it('CONCISION_POLICY_PRESERVED + NO_LOCAL_WHAT_TEXT_SUBSTITUTION: no truncation', async () => {
    const long = 'LOCAL_SYNTHETIC '.repeat(500);
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({model: 'gpt-5.6-terra', output_text: long.trim()})));
    const r = {...bridgeRequest('Réponse détaillée demandée'), evaluatePersistentDelta: false};
    const result = await call(r, provider);
    expect(result.assistantReply).toBe(long.trim());
    const instruction = JSON.parse(String(provider.mock.calls[0][1]?.body)).instructions;
    for (const text of ['50–120', '100–200', '180–350', 'ne sont pas un cutoff', 'Ne termine pas automatiquement par une question', 'hypothèse artificielle', "sans notice d'enregistrement"]) expect(instruction).toContain(text);
  });
  it('PROJECT_AND_DOC_UNCHANGED / ECV: adopted Project and literal correction survive reload, short reply stays exact', async () => {
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const session = createFunctionalResetSession(); session.project = project; session.projectId = project.projectId;
    session.runtimeTurns = [{turnId: 'former-smokers', role: 'USER', content: 'anciens fumeurs seulement si ≤5 paquet-années ET arrêt ≥5 ans'}, {turnId: 'hta', role: 'USER', content: 'HTA connue exclue même traitée et contrôlée'}];
    const before = JSON.stringify({project: session.project, documents: session.documents});
    mocks.bridge.mockImplementation(async (request: ProductBridgeRequest) => call({...request, apiVersion: '1.0.0'}, vi.fn<typeof fetch>().mockResolvedValue(native())));
    mount(session); send('Rappelle-moi brièvement les décisions confirmées.'); await screen.findByText(/^LOCAL_SYNTHETIC — texte libre/u);
    await waitFor(() => expect(screen.getByRole('button', {name: 'Préparer l’enregistrement'})).toBeEnabled());
    const saved = loadFunctionalResetSession(localStorage), reopened = prepareTerraConversation({...bridgeRequest('Question après réouverture'), currentProject: saved.project, conversation: {conversationId: saved.conversationId, language: 'fr', turns: saved.runtimeTurns}, evaluatePersistentDelta: false});
    const packet = JSON.parse(reopened.context);
    expect(JSON.stringify({project: saved.project, documents: saved.documents})).toBe(before);
    expect(packet.CURRENT_PROJECT.version).toBe(project.versionId);
    expect(packet.RECENT_CONVERSATION[0].content).toBe(session.runtimeTurns[0].content);
    expect(packet.RECENT_CONVERSATION[1].content).toBe(session.runtimeTurns[1].content);
    expect(saved.entries.filter(e => e.kind === 'TEXT').at(-1)).toMatchObject({content: reply});
    expect(screen.getByTestId('conversation-composer')).toHaveClass('sticky');
  });
  it('frozen HUMAN_EXACT Tor and follow-ups are tests only; nominal source has no domain patch', () => {
    const frozen = JSON.parse(readFileSync('validation/noxia-chat-propose-first-transaction-silence-01/frozen-inputs.json', 'utf8'));
    expect(frozen.messages).toHaveLength(3);
    for (const text of frozen.messages) expect(isExplicitProjectRecordingRequest(text)).toBe(false);
    for (const file of ['src/features/scientific-thinking/scientific-collaborator-conversation.ts', 'src/features/protocol-designer/functional-reset/natural-conversation-policy.ts']) expect(readFileSync(file, 'utf8')).not.toMatch(/ultratrail|Tor des Géants|IRM mobile/iu);
  });
});
