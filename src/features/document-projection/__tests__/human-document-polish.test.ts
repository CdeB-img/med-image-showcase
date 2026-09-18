import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { logicalDigest } from '@/features/knowledge-engine/canonical';
import type { ProjectSource } from '@/features/knowledge-engine/project-source-library';
import type { DocumentEvidenceContent } from '../scientific-document-revision';
import { documentBibliographyNeedsVerification, documentSourceLocator, validateDocumentEvidence } from '../scientific-document-revision';
import { drciDraftPackFiles, sequentialDocumentSectionTitles } from '../drci-draft-pack';
import { applyDrciHumanRevisionEntries, drciProseWordCount, materializeDrciDraftPack, pragmaticDimensioningOpenItems, prepareDrciDraftPack, validateDrciIndividualResultPolicy, type DrciDraftPack } from '../drci-draft-contract';
import { createProjectSession, readProjectSessions, saveProjectSession } from '@/features/protocol-designer/functional-reset/project-workspace-storage';
const claim='Une mesure de reproductibilité nécessite de documenter sa précision dans le contexte étudié';
const source:ProjectSource={source:{sourceId:'source:methodology:synthetic',revision:'1',title:'Measurement reproducibility.',status:'OFFICIAL_EFFECTIVE',doi:'10.1234/synthetic.001'},
 authors:['Auteur Méthode'],year:'2024',url:null,publicationType:'METHODOLOGY',origins:['EXISTING_CORPUS'],roles:['METHOD'],userRelevance:'NONE',interestHistory:[],knowledgeResultRefs:[],
 assertions:[{stableId:'assertion:method',revision:'assertion:method:1',providerId:'synthetic:qualified',status:'OFFICIAL_EFFECTIVE',text:claim,atomicContent:null,
 conceptIds:[],context:{},polarity:'POSITIVE',evidenceRelations:['SUPPORTS'],limitations:[],reviewStatus:'REVIEWED',locator:'section:1',applicability:'APPLICABLE_EXACT',applicabilityReasons:[]}],
 evidence:[{evidenceId:'synthetic:evidence:1',limitations:[],sourceId:'source:methodology:synthetic',assertionId:'assertion:method:1',relation:'SUPPORTS',locator:'section:1'}],
 scientificWeight:{assessment:'OWNER_QUALIFIED_ASSERTIONS',evidenceLevel:'NOT_ASSIGNED',status:'QUALIFIED'}};
const evidence:DocumentEvidenceContent={owner:'KNOWLEDGE',libraryDigest:'synthetic:library',paragraphs:[{paragraphId:'synthetic:paragraph',text:claim,
 assertionRefs:['assertion:method:1'],sourceRefs:[source.source.sourceId],limitations:[]}],sources:[source],excludedSourceRefs:[],emphasisSourceRef:null,depth:'SHORT',caution:false,notices:[],scope:'SCIENTIFIC_BACKGROUND_NOT_PROJECT_DECISION'};
const genericPack=():DrciDraftPack=>({contract:'DRCI_DRAFT_PACK_V1',editorialVersion:'CONCISE_V2',project:{projectId:'synthetic:project',projectVersion:'1',projectDigest:'synthetic:digest'},generatedAt:'2026-09-18',
 protocolProjectionId:'synthetic:projection',handoffDecisionDigest:'synthetic:handoff',sourceFacts:[],canonicalCrfPackageRef:'synthetic:crf',packDigest:'synthetic:pack',
 crossConsistency:'SOURCE_BINDINGS_CHECKED_HUMAN_REVIEW_PENDING',projectWriteAuthorized:false,reusedProtocolEvidenceRef:null,evidenceContent:structuredClone(evidence),preparationBinding:'synthetic:binding',
 documents:[{kind:'PROTOCOL_SYNOPSIS',title:'Étude de reproductibilité',sections:[{title:'Méthode',paragraphs:[`${claim} [[CITE:${source.source.sourceId}]]`],sourceRefs:[]}],missingElements:['Bibliographie: références à vérifier','Institution: contact à définir']}],crfRows:[]});
const policyDocuments=(paragraph:string)=>[{kind:'RECRUITMENT' as const,title:'Information candidate',sections:[{title:'Information',paragraphs:[paragraph],sourceRefs:[]}],missingElements:[]}];
const fact=(content:string,epistemicState='KNOWN')=>({ref:'synthetic:decision',type:'PROJECT_INFORMATION',content,epistemicState,polarity:'AFFIRMED'});
afterEach(()=>localStorage.clear());

describe('Generic standalone DOC polish, without domain-specific rules',()=>{
 it('A — standalone citations resolve to the admitted source without changing prose word counting',()=>{
  expect(validateDocumentEvidence(evidence)).toBe(true);
  const pack=genericPack();const before=drciProseWordCount(pack.documents[0].sections[0].paragraphs);
  const file=drciDraftPackFiles(pack)[0];
  expect(file.html).toContain('href="https://doi.org/10.1234/synthetic.001"');
  expect(file.html).toContain('title="Measurement reproducibility."');
  expect(file.markdown).toContain('[Auteur Méthode (2024)](https://doi.org/10.1234/synthetic.001)');
  expect(file.html).not.toContain('[[CITE:');expect(drciProseWordCount(pack.documents[0].sections[0].paragraphs)).toBe(before);
 });
 it('B — qualified used citations remove only the stale bibliography OPEN notice',()=>{
  const pack=genericPack();const frozen=JSON.stringify(pack);const file=drciDraftPackFiles(pack)[0];
  expect(documentBibliographyNeedsVerification([source.source.sourceId],evidence)).toBe(false);
  expect(file.markdown).not.toContain('références à vérifier');expect(file.markdown).toContain('Contact à définir');expect(JSON.stringify(pack)).toBe(frozen);
 });
 it('C — unresolved, unqualified, stale and non-resolvable citations keep a bibliography OPEN requirement',()=>{
  expect(documentBibliographyNeedsVerification(['unknown'],evidence)).toBe(true);
  const invalid=structuredClone(evidence);invalid.sources[0].scientificWeight.assessment='NOT_ASSESSED';
  expect(documentBibliographyNeedsVerification([source.source.sourceId],invalid)).toBe(true);
  const stale=structuredClone(evidence);stale.sources[0].assertions[0].status='UNAVAILABLE_OR_UNKNOWN';
  expect(documentBibliographyNeedsVerification([source.source.sourceId],stale)).toBe(true);
  const noLocator=structuredClone(evidence);delete noLocator.sources[0].source.doi;
  expect(documentBibliographyNeedsVerification([source.source.sourceId],noLocator)).toBe(true);
  const pack={...genericPack(),evidenceContent:undefined};pack.documents[0].sections[0].paragraphs=[claim];
  expect(drciDraftPackFiles(pack)[0].markdown).toContain('références à vérifier');
 });
 it('D — final section assembly numbers inserted references and completion sequentially',()=>{
  expect(sequentialDocumentSectionTitles(['1. Introduction','3. Méthodes','Références','9. À compléter'])).toEqual(['1. Introduction','2. Méthodes','3. Références','4. À compléter']);
  expect(sequentialDocumentSectionTitles(['Introduction','Références'])).toEqual(['Introduction','Références']);
  const pack=genericPack();pack.documents[0].kind='PROTOCOL_FULL';pack.documents[0].sections[0].title='1. Méthode';
  const file=drciDraftPackFiles(pack)[0];expect(file.markdown).toContain('## 2. Références scientifiques');expect(file.markdown).toContain('## 3. À définir');
 });
 it.each(['Cible pragmatique de faisabilité de 90 participants, non calculée.','TARGET_N = 220 ; NOT_FORMALLY_DIMENSIONED.','TARGET_N = 180 ; N_STATUS = FEASIBILITY.'])('E — pragmatic sizing stays explicitly OPEN: %s',content=>{
  expect(pragmaticDimensioningOpenItems([fact(content)])).toHaveLength(1);
  const pack={...genericPack(),sourceFacts:[fact(content)]};pack.documents[0].kind='PROTOCOL_FULL';
  expect(drciDraftPackFiles(pack)[0].markdown).toContain('Justification statistique de la cible et précision');
 });
 it('F — formal sizing, unknown values and negated facts do not create a pragmatic sizing OPEN',()=>{
  expect(pragmaticDimensioningOpenItems([fact('Effectif 90 participants : calcul de précision adopté, justification statistique adoptée.')])).toEqual([]);
  expect(pragmaticDimensioningOpenItems([fact('TARGET_N = 220 ; FORMALLY_DIMENSIONED.')])).toEqual([]);
  expect(pragmaticDimensioningOpenItems([fact('Cible pragmatique de 90 participants','UNKNOWN')])).toEqual([]);
  expect(pragmaticDimensioningOpenItems([{...fact('Cible pragmatique de 90 participants'),polarity:'NEGATED'}])).toEqual([]);
 });
 it('G — an OPEN incidental-finding policy rejects categorical individual-result promises and refusals',()=>{
  const open=[fact('Politique de découvertes fortuites et de restitution à définir','UNKNOWN')];
  for(const prose of ['Cette étude ne vise ni de fournir un résultat individuel.','Vous recevrez vos résultats individuels.','L’étude ne fournira aucun résultat individuel.'])
   expect(()=>validateDrciIndividualResultPolicy(policyDocuments(prose),open)).toThrow('DRCI_OPEN_INCIDENTAL_POLICY_CATEGORICAL_RESULT_CLAIM');
  expect(()=>validateDrciIndividualResultPolicy(policyDocuments('Aucun bénéfice individuel n’est garanti. Les résultats ne seront pas systématiquement délivrés ; la politique de découvertes fortuites reste à définir.'),open)).not.toThrow();
 });
 it('H — an adopted individual-result policy is preserved without imposing the OPEN-policy wording',()=>{
  const docs=policyDocuments('Les résultats individuels seront communiqués selon la procédure adoptée.');const frozen=JSON.stringify(docs);
  expect(()=>validateDrciIndividualResultPolicy(docs,[fact('Politique de découvertes fortuites : restitution des résultats individuels selon la procédure adoptée.')])).not.toThrow();
  expect(JSON.stringify(docs)).toBe(frozen);
 });
 it('uses only safe public source locators, including PMID fallback',()=>{
  expect(documentSourceLocator({...source,source:{...source.source,doi:undefined,pmid:'123456'},url:'javascript:alert(1)'})).toBe('https://pubmed.ncbi.nlm.nih.gov/123456/');
  expect(documentSourceLocator({...source,source:{...source.source,doi:undefined},url:'javascript:alert(1)'})).toBeNull();
 });
});

const load=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
const originalRoot='validation/noxia-synopsis-revision-json-mode-input-fix-live-gate-01';
const root='validation/noxia-drci-final-document-human-polish-no-reroll-01';
const parent=load(`${originalRoot}/PACK_PROVISIONAL.json`) as DrciDraftPack;
const revised=load(`${root}/PACK_PROVISIONAL.json`) as DrciDraftPack;
const project=load('validation/noxia-drci-final-pack-generation-retry-01/PROJECT_IMMUTABLE.json');
const packet=prepareDrciDraftPack(project,load('validation/noxia-drci-final-pack-generation-retry-01/NATIVE_DOC_SOURCE.json'));
const admit=(value={documents:revised.documents,crfRows:revised.crfRows},record=revised.humanRevision!)=>materializeDrciDraftPack(value,{project,packet,generatedAt:revised.generatedAt,
 reusedProtocolEvidenceRef:parent.reusedProtocolEvidenceRef,humanRevision:{parentPack:parent,record}});
describe('Current human-revised pack: native admission, ancestry and persistence',()=>{
 it('admits the complete pack with exact parent, Project, evidence and historical provider-revision provenance',()=>{
  expect(admit()).toEqual(revised);expect(revised.project).toEqual(parent.project);expect(revised.evidenceContent).toEqual(parent.evidenceContent);
  expect(revised.humanRevision!.priorSynopsisRevision).toEqual(parent.synopsisRevision);expect(revised.synopsisRevision).toBeUndefined();
  expect(applyDrciHumanRevisionEntries(parent,revised.humanRevision!.entries)).toEqual({documents:revised.documents,crfRows:revised.crfRows});
 });
 it('rejects drift of an original anchor, reason/origin, binding and unrecorded edits',()=>{
  const badAnchor=structuredClone(revised.humanRevision!);badAnchor.entries[0].originalText='invented';
  expect(()=>admit(undefined,badAnchor)).toThrow('DRCI_HUMAN_REVISION_ANCHOR_INVALID');
  const badOrigin=structuredClone(revised.humanRevision!);badOrigin.entries[0].revisionOrigin='PROVIDER' as 'HUMAN_REVIEW';
  expect(()=>admit(undefined,badOrigin)).toThrow();
  const badBinding=structuredClone(revised.humanRevision!);badBinding.projectBinding.projectDigest='other';expect(()=>admit(undefined,badBinding)).toThrow();
  const badValue=structuredClone({documents:revised.documents,crfRows:revised.crfRows});badValue.documents[0].sections[1].paragraphs[0]+=' Modification non autorisée.';
  expect(()=>admit(badValue)).toThrow('DRCI_HUMAN_REVISION_SCOPE_MISMATCH');
 });
 it('rejects orphan citations, a changed CRF and a synopsis outside its unchanged bounds',()=>{
  const orphan=structuredClone({documents:revised.documents,crfRows:revised.crfRows});orphan.documents[0].sections[0].paragraphs[0]+=' [[CITE:unknown]]';expect(()=>admit(orphan)).toThrow('DRCI_CITATION_REFERENCE_INVALID');
  const crf=structuredClone({documents:revised.documents,crfRows:revised.crfRows});crf.crfRows[0].label='Other label';expect(()=>admit(crf)).toThrow('DRCI_HUMAN_REVISION_SCOPE_MISMATCH');
  const oversized=structuredClone({documents:revised.documents,crfRows:revised.crfRows});oversized.documents.find(d=>d.kind==='PROTOCOL_SYNOPSIS')!.sections[0].paragraphs[0]+=' word'.repeat(751);expect(()=>admit(oversized)).toThrow('DRCI_SYNOPSIS_WORD_BOUND_EXCEEDED');
 });
 it('preserves the full CRF, UNKNOWN/NEGATED and discordant evidence, with resolvable citations and all actual OPEN items',()=>{
  expect(revised.crfRows).toEqual(parent.crfRows);expect(revised.documents.find(d=>d.kind==='CRF')).toEqual(parent.documents.find(d=>d.kind==='CRF'));expect(revised.sourceFacts).toEqual(parent.sourceFacts);
  const files=drciDraftPackFiles(revised);const synopsis=files.find(f=>f.kind==='PROTOCOL_SYNOPSIS')!;const full=files.find(f=>f.kind==='PROTOCOL_FULL')!;
  expect(drciProseWordCount(revised.documents.find(d=>d.kind==='PROTOCOL_SYNOPSIS')!.sections.flatMap(s=>s.paragraphs))).toBe(731);
  expect(synopsis.html.match(/<a href=/gu)).toHaveLength(revised.documents.find(d=>d.kind==='PROTOCOL_SYNOPSIS')!.sections.flatMap(s=>s.paragraphs).join(' ').match(/\[\[CITE:/gu)!.length);expect(synopsis.markdown).not.toContain('bibliographie à vérifier');
  expect(full.markdown).toContain('## 16. Références scientifiques');expect(full.markdown).toContain('## 17. À définir');
  expect(full.markdown).toContain('Justification statistique de la cible de 150 participants et précision');
  expect(full.markdown).toContain('coefficient de partition du contraste');expect(full.markdown).toContain('Neilan');expect(full.markdown).toContain('Rosmini');
  expect(files.find(f=>f.kind==='RECRUITMENT')!.markdown).toContain('délivrer systématiquement des résultats individuels');
  for(const fact of parent.sourceFacts.filter(f=>f.epistemicState==='UNKNOWN')) expect(revised.sourceFacts).toContainEqual(fact);
 });
 it('native session round-trip preserves the adopted Project and previous pack while keeping new export hashes stable',()=>{
  const saved=createProjectSession(localStorage,'Human-revised DRCI');saved.session.projectId=project.projectId;
  const session={...saved.session,project,projectId:project.projectId,drciDraftPacks:[parent]};
  saveProjectSession(localStorage,saved,session);const persisted=readProjectSessions(localStorage).projects[0];
  saveProjectSession(localStorage,persisted,{...persisted.session,drciDraftPacks:[parent,revised]});
  const reloaded=readProjectSessions(localStorage).projects[0].session;
  expect(reloaded.project).toEqual(project);expect(reloaded.drciDraftPacks).toEqual([parent,revised]);
  expect(drciDraftPackFiles(reloaded.drciDraftPacks!.at(-1)!).map(f=>logicalDigest(f.html))).toEqual(drciDraftPackFiles(revised).map(f=>logicalDigest(f.html)));
 });
});
