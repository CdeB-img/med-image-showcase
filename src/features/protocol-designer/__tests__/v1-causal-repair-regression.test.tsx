// Offline regression coverage; no private recordings or provider credentials required.
import {expect,it,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {detectSensitiveData} from '@/features/protocol-designer/intake/privacy';
import {routeProductEntry} from '@/features/protocol-designer/functional-reset/product-entry-routing';
import Review from '@/features/protocol-designer/functional-reset/ContributionReview';
import {adoptBehaviorContribution,behaviorContribution,behaviorItem,behaviorTurn} from '@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';
import {buildHumanReviewProjection,prepareResearchProjectContributionCandidate,ensureCanonicalProjectState,buildScientificThinkingInputFromProjectSnapshot} from '@/features/research-project-construction';
import {executeScientificThinkingEngine} from '@/features/scientific-thinking/engine';
import {contributionFromPersistentDelta,type PersistentProjectDeltaCandidate} from '@/features/protocol-designer/product-bridge';
afterEach(cleanup);
const accepted = [
 'une étude sur un panel de patient pour voir les lésions', 'un dossier fictif pour une étude scientifique',
 'une population de patients sans identité', 'Le patient présente une inflammation dans ce scénario synthétique.',
 'Groupe 1234, bras A, dose 1000 mg pendant 2026 jours', 'Numéro scientifique NX-PERIPH-01, molécule fictive',
 'Étudier le patient avant et après chirurgie', 'dossier scientifique', 'patient pour une IRM',
 'patient sous traitement', 'patient dans un groupe', 'dossier de recherche',
];
it.each(accepted)('accepts non-identifying scientific text: %s', text => expect(detectSensitiveData(text)).toEqual([]));
const blocked: [string,string][] = [
 ['patient Jean Dupont','IDENTIFIABLE_CASE'], ['Mme Jeanne Dupont','IDENTIFIABLE_CASE'],
 ['dossier n° 12345678','PATIENT_IDENTIFIER'], ['dossier: ABCD','PATIENT_IDENTIFIER'],
 ['dossier AB1234','PATIENT_IDENTIFIER'], ['patient id 12345678','PATIENT_IDENTIFIER'],
 ['patient # ABCD','PATIENT_IDENTIFIER'], ['patient AB1234','PATIENT_IDENTIFIER'],
 ['id patient ABCD','PATIENT_IDENTIFIER'], ['IPP: 12345678','PATIENT_IDENTIFIER'],
 ['MRN 12345678','PATIENT_IDENTIFIER'], ['hospital id ABCD','PATIENT_IDENTIFIER'],
 ['identifiant patient AB1234','PATIENT_IDENTIFIER'], ['patient numéro ABCD','PATIENT_IDENTIFIER'],
 ['patient - AB1234','PATIENT_IDENTIFIER'], ['dossier - 12345678','PATIENT_IDENTIFIER'], ['patient=AB1234','PATIENT_IDENTIFIER'], ['14 rue des Lilas','POSTAL_ADDRESS'],
 ['jean.dupont@example.org','EMAIL'], ['06 12 34 56 78','PHONE'],
 ['né le 14/09/1970','DATE_OF_BIRTH'],
];
it.each(blocked)('continues blocking %s', (text,code) => {
 for(const prefix of ['', 'Dossier fictif : ', 'Toutes les données sont synthétiques : ']){
  const raw=prefix+text;
  expect(detectSensitiveData(raw)).toContainEqual({code});
  expect(routeProductEntry({raw,sourceTurnRef:'privacy-test',routedAt:'2026-09-15T12:00:00Z'}).domainGate).toBe('OUT_OF_SCOPE');
 }
});
it('preserves compact identifiers across case and delimiters', () => {
 for(const marker of ['IPP','mrn','Id patient','hospital ID','patient id','dossier numéro'])
 for(const delimiter of [' ',': ',' # ',' = '])
 for(const value of ['ABCD','123456','Ab12-34'])
 expect(detectSensitiveData(`${marker}${delimiter}${value}`)).toContainEqual({code:'PATIENT_IDENTIFIER'});
});
const domains=['thrombus IRM et échographie','myocardite','suivi clinique et hospitalisation','neuro et cognition','stress et croissance végétale'];
it.each(domains)('does not turn objectives into operands: %s',domain=>{
 const turn=behaviorTurn(`turn:${domain}`,`Comparer ${domain}. Comprendre les différences.`);
 const contribution=behaviorContribution({contributionId:`contribution:${domain}`,turns:[turn],candidateObjects:[
  behaviorItem({itemId:'obj:a',proposedType:'OBJECTIVE',content:`Comparer ${domain}`,turnId:turn.turnId}),
  behaviorItem({itemId:'obj:b',proposedType:'OBJECTIVE',content:'Comprendre les différences',turnId:turn.turnId}),
 ]});
 const project=adoptBehaviorContribution(contribution,null,1);const before=JSON.stringify(project);
 const input=buildScientificThinkingInputFromProjectSnapshot({project});const output=executeScientificThinkingEngine(input);
 expect(input.scientificObjectTerms).toEqual([]);expect(input.scientificPurpose).toHaveLength(2);
 expect(output.questions.some(q=>q.text.startsWith('Existe-t-il une association entre'))).toBe(false);
 expect(output.questions.some(q=>q.testability==='NEEDS_CLARIFICATION')).toBe(true);
 expect(JSON.stringify(project)).toBe(before);
});
it.each(domains)('retains useful variable association candidates: %s',domain=>{
 const turn=behaviorTurn(`turn:positive:${domain}`,`Explorer une association dans ${domain}`);
 const contribution=behaviorContribution({contributionId:`positive:${domain}`,turns:[turn],candidateObjects:[
  behaviorItem({itemId:'obj',proposedType:'OBJECTIVE',content:`Explorer une association dans ${domain}`,turnId:turn.turnId}),
  behaviorItem({itemId:'var:a',proposedType:'MEASURED_VARIABLE',content:'Variable A',turnId:turn.turnId}),
  behaviorItem({itemId:'var:b',proposedType:'MEASURED_VARIABLE',content:'Variable B',turnId:turn.turnId}),
 ]});
 const project=adoptBehaviorContribution(contribution,null,2);
 const input=buildScientificThinkingInputFromProjectSnapshot({project});const output=executeScientificThinkingEngine(input);
 expect(input.scientificObjectTerms).toEqual(['Variable A','Variable B']);
 expect(output.questions.some(q=>q.text.includes('association entre Variable A et Variable B'))).toBe(true);
 expect(output.questions.every(q=>q.reviewState==='PENDING')).toBe(true);
});
const types=['ELIGIBILITY_CRITERION','INTERVENTION','CONDITION','PROJECT_INFORMATION'];
const prepare=(type:string,polarity:string)=>{
 const turn=behaviorTurn(`polarity:${type}:${polarity}`,'Une qualification explicite.');
 const contribution=behaviorContribution({contributionId:`contribution:${turn.turnId}`,turns:[turn],candidateObjects:[behaviorItem({itemId:'qualified',proposedType:type,content:'Événement étudié',turnId:turn.turnId,polarity})]});
 return {contribution,prepared:prepareResearchProjectContributionCandidate(contribution,null)};
};
it.each(types)('preserves negation for %s in initial review and canonical adoption',type=>{
 const {contribution,prepared}=prepare(type,'NEGATED');const before=JSON.stringify(prepared.canonicalChangeSet);
 const items=prepared.humanReviewProjection.sections.flatMap(s=>s.items);
 expect(items[0].content).toBe('Exclusion / absence : Événement étudié');
 render(<Review contribution={contribution} candidate={prepared} status="PENDING" onConfirm={()=>{}} onCorrect={()=>{}} onReject={()=>{}} />);
 expect(screen.getByText(/Exclusion \/ absence : Événement étudié/)).toBeVisible();
 const project=adoptBehaviorContribution(contribution,null,1);
 expect(ensureCanonicalProjectState(project).objects[0].projection.sourcePolarity).toBe('NEGATED');
 expect(JSON.stringify(prepared.canonicalChangeSet)).toBe(before);
});
it.each([['AFFIRMED','Événement étudié'],['UNCERTAIN','Incertain : Événement étudié'],['CONDITIONAL','Sous condition : Événement étudié']])('preserves %s', (polarity,label)=>{
 const {prepared}=prepare('CONDITION',polarity);
 expect(prepared.humanReviewProjection.sections.flatMap(s=>s.items)[0].content).toBe(label);
});
it('keeps the old negation explicit on removal and both polarities on replacement',()=>{
 const {contribution}=prepare('CONDITION','NEGATED');const current=adoptBehaviorContribution(contribution,null,1);
 const old=ensureCanonicalProjectState(current).objects[0];
 const {prepared}=prepare('CONDITION','AFFIRMED');const base=prepared.canonicalChangeSet; const candidate=base.objectChanges[0].candidate!;
 const change={...base.objectChanges[0],objectId:old.objectId,previousVersionRef:old.objectVersionId};
 const removal=buildHumanReviewProjection({...base,baseProjectVersion:current.versionId,objectChanges:[{...change,operation:'REMOVE',candidate:null}]},current);
 expect(removal.sections.flatMap(s=>s.items)[0].content).toMatch(/^− Exclusion \/ absence : Événement étudié/);
 const replacement=buildHumanReviewProjection({...base,baseProjectVersion:current.versionId,objectChanges:[{...change,operation:'REPLACE',candidate:{...candidate,objectId:old.objectId}}]},current);
 expect(replacement.sections.flatMap(s=>s.items)[0].content).toContain('Exclusion / absence : Événement étudié → Événement étudié');
});
it.each(['Adultes atteints de myocardite aiguë récente.', 'Population adulte avec maladie rénale stable.', 'Éprouvettes métalliques soumises à un stress thermique.'])('source selection does not certify all explicit facts: %s',raw=>{
 const turn=behaviorTurn('coverage:raw',raw);
 const candidate:PersistentProjectDeltaCandidate={contract:'PERSISTENT_PROJECT_DELTA_CANDIDATE',contractVersion:'0.4.0',projectWriteAuthorized:false,
 changes:[{operation:'ADD',sourceText:raw,content:'Phénomène étudié',proposedType:'PROJECT_INFORMATION',polarity:'AFFIRMED',epistemicStatus:'EXPLICIT_USER_STATED',epistemicState:'KNOWN',assertionKind:'USER_STATED',evidenceRefs:[]}],relations:[],temporalQualifications:[],expectedVariableOccasions:[]};
 const contribution=contributionFromPersistentDelta({candidate,conversation:{conversationId:'coverage',language:'fr',turns:[turn]},currentProject:null})!;
 expect(contribution.scientificContent.clarificationNeeds[0].epistemicBoundary.sourceText).toBe(raw);
 const prepared=prepareResearchProjectContributionCandidate(contribution,null);
 expect(prepared.status).toBe('CANDIDATE_PENDING_HUMAN_CONFIRMATION');
 render(<Review contribution={contribution} candidate={prepared} status="PENDING" onConfirm={()=>{}} onCorrect={()=>{}} onReject={()=>{}}/>);
 expect(screen.getByText(/Compréhension partielle/)).toBeVisible();
 const project=adoptBehaviorContribution(contribution,null,1);
 expect(ensureCanonicalProjectState(project).objects).toHaveLength(1);
 expect(ensureCanonicalProjectState(project).objects[0].content).toBe('Phénomène étudié');
 const complete=contributionFromPersistentDelta({candidate:{...candidate,changes:[{...candidate.changes[0],content:raw}]},conversation:{conversationId:'coverage',language:'fr',turns:[turn]},currentProject:null})!;
 expect(complete.scientificContent.clarificationNeeds).toEqual([]);
});
