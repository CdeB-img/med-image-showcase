import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import ContributionReview from '../ContributionReview';
import ProtocolDesignerWorkspace from '../ProtocolDesignerWorkspace';
import { createFunctionalResetSession } from '../session';
import { prepareResearchProjectContributionCandidate } from '@/features/research-project-construction';
import { prepareTerraConversation } from '@/features/scientific-thinking/scientific-collaborator-conversation';
import { contributionFromPersistentDelta, type PersistentProjectDeltaCandidate } from '../../product-bridge';
import { buildOpenAIPersistentDeltaPayload } from '../../../../../api/protocol-designer-openai-extraction-provider';
import { bridgeRequest } from '../../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures';
import { buildConciseAdoptionReply } from '../natural-conversation-policy';
import { adoptBehaviorContribution, richStudyContribution } from './p1-behavior-01a-contract-fixtures';

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const fixture = () => {
 const raw = 'Mesures répétées après intervention.';
 const wire: PersistentProjectDeltaCandidate = {contract:'PERSISTENT_PROJECT_DELTA_CANDIDATE',contractVersion:'0.4.0',projectWriteAuthorized:false,
 changes:[{operation:'ADD',candidateRef:'acq',semanticIdentity:'acq',proposedType:'ACQUISITION',content:'Mesure&#xA0;répétée',sourceText:raw,polarity:'AFFIRMED',epistemicStatus:'EXPLICIT_USER_STATED',epistemicState:'KNOWN',assertionKind:'USER_STATED',evidenceRefs:[]}],relations:[],expectedVariableOccasions:[],
 temporalQualifications:[1,2].map(n => ({operation:'ADD' as const,qualificationId:`q${n}`,subjectProjectRef:'acq',temporalRole:'ACQUISITION_TIME',sourceText:raw,assertionKind:'USER_STATED' as const,evidenceRefs:[],anchor:{kind:'TIMEPOINT' as const,direction:'AFTER' as const,unit:'MONTH',offset:3,lowerBound:null,upperBound:null,relativeEventLabel:'intervention',tolerance:null,reference:{status:'EXPLICIT' as const,bindingStatus:'PROJECT_REF_UNRESOLVED' as const}}}))};
 const contribution = contributionFromPersistentDelta({candidate:wire,currentProject:null,conversation:{conversationId:'compact',language:'fr',turns:[{turnId:'u',role:'USER',content:raw}]}})!;
 return {contribution,candidate:prepareResearchProjectContributionCandidate(contribution,null)};
};
const review = (expanded = false) => { const data=fixture(); const before=JSON.stringify(data); render(<ContributionReview {...data} status="PENDING" expanded={expanded} onConfirm={()=>undefined} onCorrect={()=>undefined} onReject={()=>undefined}/>); return {data,before}; };
describe('Referential understanding / compact review / continuous advancement — generic mechanics', () => {
 it.each([
  'mesures à J3 après chirurgie, puis 3 mois et 1 an',
  'Après le traitement, une visite à J7 et à 6 mois ; après réhospitalisation, une mesure à 1 an. Quel est le référentiel de la dernière visite ?',
  'Adultes randomisés entre traitement et placebo, mesures avant traitement, à six semaines et un an : propose une structure.',
  'étude sur le remodelage post-infarctus',
  'Quelle différence entre délai de suivi et fenêtre de visite ?',
 ])('same temporal and initiative owner, literal input and non-adoption: %s', text => {
  const r={...bridgeRequest(text),evaluatePersistentDelta:false}; const packet=prepareTerraConversation(r);
  expect(packet.instruction).toBe(prepareTerraConversation({...r,conversation:{...r.conversation,turns:[{turnId:'different',role:'USER',content:'autre domaine'}]}}).instruction);
  expect(packet.instruction).toContain('événement index explicitement attaché');
  expect(packet.instruction).toContain('la série conserve un référentiel unique');
  expect(packet.instruction).toContain('ne tranche pas en déclarant un événement « principal »');
  expect(packet.instruction).toContain('Ne change ni ne complète un calendrier minimal absent');
  expect(packet.instruction).toContain('prochaine décision à forte valeur');
  expect(packet.instruction).not.toMatch(/infarctus|reperfusion|chirurgie|réhospitalisation|Tor des/iu);
  expect(JSON.parse(packet.context).RECENT_CONVERSATION.at(-1).content).toBe(text);
  expect(JSON.parse(packet.context).TRANSACTION_REQUESTED).toBe(false);
 });
 it('inferred candidate references require a visible proposal source, not a forged explicit user claim', () => {
  const payload=buildOpenAIPersistentDeltaPayload({...bridgeRequest('enregistre ces choix'),nativeConversationRecording:true});
  expect(payload.instructions).toContain('jamais une citation utilisateur prétendument explicite');
  expect(payload.instructions).toContain('conserve cette référence UNKNOWN');
 });
 it('deduplicates typed temporal identity, decodes entities and excludes metadata without changing the candidate', () => {
  const {data,before}=review(); const summary=screen.getByTestId('standard-initial-review-summary');
  expect(summary.textContent).not.toMatch(/&#|référentiel à|sourceAnchorId|formulation d/iu);
  expect(summary.textContent).toContain('Mesure répétée');
  expect(summary.textContent?.match(/M3/g)).toHaveLength(1);
  expect(summary.querySelectorAll('div.grid').length).toBeLessThanOrEqual(3);
  expect(screen.queryByTestId('review-audit-detail')).toBeNull();
  expect(JSON.stringify(data)).toBe(before);
  fireEvent.click(screen.getByTestId('functional-review-details'));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.queryByTestId('review-full-scientific-delta')).toBeNull();
  expect(screen.getByTestId('review-audit-detail').textContent).toContain('Message d’origine');
  expect(screen.getByTestId('review-audit-detail').textContent).toContain('référentiel à');
  expect(JSON.stringify(data)).toBe(before);
 });
 it('keeps independent measurements even when their temporal anchors are identical', () => {
  const {contribution,candidate}=fixture(); const changed=structuredClone(candidate);
  const original=changed.humanReviewProjection.sections.find(section=>section.items.some(item=>item.changeKind==='TEMPORAL_QUALIFICATION'))!;
  const item=original.items.find(row=>row.changeKind==='TEMPORAL_QUALIFICATION')!;
  const temporal=changed.canonicalChangeSet.temporalQualificationChanges[0]!;
  const second=structuredClone(temporal);second.changeRef='independent';second.candidate!.subjectProjectRef='independent-measurement';
  changed.canonicalChangeSet.temporalQualificationChanges.push(second);
  original.items.push({...item,reviewItemRef:'independent-review',changeRef:'independent',content:'Deuxième mesure : à M3 (3 mois) après intervention'});
  render(<ContributionReview contribution={contribution} candidate={changed} status="PENDING" expanded onConfirm={()=>undefined} onCorrect={()=>undefined} onReject={()=>undefined}/>);
  expect(screen.getByTestId('standard-initial-review-summary').textContent).toContain('Deuxième mesure');
 });
 it('project details are available on desktop and remain a separate read-only surface', () => {
  vi.stubEnv('VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME','TERRA');
  const session=createFunctionalResetSession();const {contribution,candidate}=fixture();
  session.pendingContribution=contribution;
  session.entries.push({entryId:'r',kind:'REVIEW',role:'NOXIA',contribution,candidate,status:'PENDING',createdAt:new Date().toISOString()});
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session}/></HelmetProvider>);
  const trigger=screen.getByRole('button',{name:'Voir mon projet'}); expect(trigger.className).not.toContain('lg:hidden');
  fireEvent.click(trigger);expect(screen.getByRole('heading',{name:'Propositions et points ouverts'})).toBeVisible();
  expect(screen.getByRole('heading',{name:'Propositions en discussion'})).toBeVisible();
  expect(within(screen.getByRole('dialog')).queryByRole('button',{name:'Confirmer les choix et enregistrer'})).toBeNull();
  expect(session.project).toBeNull();
 });
 it('shows all scientific choices before confirmation without requiring the technical graph', () => {
  const data=fixture(),confirm=vi.fn();
  render(<ContributionReview {...data} status="PENDING" onConfirm={confirm} onCorrect={()=>undefined} onReject={()=>undefined}/>);
  expect(screen.getByTestId('standard-initial-review-summary')).toHaveTextContent('Mesure répétée');
  expect(confirm).not.toHaveBeenCalled();
  expect(screen.queryByTestId('review-audit-detail')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Confirmer les choix et enregistrer'}));expect(confirm).toHaveBeenCalledTimes(1);
 });
 it('creation receipt states the adoption scope explicitly', () => {
  const project=adoptBehaviorContribution(richStudyContribution(), null, 0);
  expect(buildConciseAdoptionReply({project,projectExisted:false,stylePreference:null})).toBe('Projet créé avec les choix que vous avez confirmés.');
 });
});
