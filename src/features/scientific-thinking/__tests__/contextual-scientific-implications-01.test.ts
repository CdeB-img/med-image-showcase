import { afterEach, describe, expect, it, vi } from 'vitest';
import { prepareContextualScientificUnderstanding, type ContextualScientificProposal, type ExplicitContextResource } from '../contextual-understanding';
import { executeScientificThinkingEngine } from '../engine';
import { makeThinkingInput } from './fixtures';
import { executeKnowledgeEngine } from '../../knowledge-engine/engine';
import { buildPreProjectNavigationDecision, realizePreProjectNavigationDecision, type PreProjectScientificNavigationContribution } from '../../query-navigation/pre-project-navigation';
import { routeProductEntry } from '../../protocol-designer/functional-reset/product-entry-routing';
import { buildPreProjectScientificThinkingIntervention } from '../../protocol-designer/functional-reset/scientific-thinking-standard';
import { validatePersistentProjectDelta, contributionFromPersistentDelta } from '../../protocol-designer/product-bridge';
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from '../../research-project-construction/contribution-owner-boundary';
import { behaviorAuthority } from '../../protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';
import { logicalDigest } from '../../knowledge-engine/canonical';

const seed = "je veux faire une étude de l'infarctus a l'irm";
const makeInput = (text = seed, extra = {}) => makeThinkingInput({ originalExpression:text, validatedReformulation:text,
  scientificObjectTerms:[], resolvedConcepts:[], relations:[], population:[], pathologyOrCondition:[], phenomena:[],
  outcomes:[], methodsMentioned:['IRM'], scientificPurpose:[], existingHypotheses:[], context:[],
  information:{explicit:[text],interpreted:[]}, ...extra });
const proposal = (dimension:string, extra:Partial<ContextualScientificProposal> = {}):ContextualScientificProposal => ({
  ref:`owner:${dimension}`,owner:'IMAGING',dimension,origin:'INFERRED_CANDIDATE',triggerRefs:['user:1'],
  rationale:'Proposition locale/synthétique du domaine, à qualifier ; aucune génération live revendiquée.',
  stage:'DESIGN',force:'OPTIONAL_SCIENTIFIC',applicability:'APPLICABILITY_UNKNOWN',requiredIntentRefs:[],
  requiredResourceRefs:[],requiresNewCollection:false,knowledgeDependent:true,statementRefs:[],...extra });
const prepare = (text = seed, proposals:ContextualScientificProposal[] = [], options = {}) => {
  const native=makeInput(text);
  return prepareContextualScientificUnderstanding({scientificInput:native,source:{turnRef:'user:1',text},
    adaptiveQuestions:executeScientificThinkingEngine(native).adaptiveQuestions,proposals,...options});
};
const resource = (text:string, ref='contrast', available=false):ExplicitContextResource => ({ref,available,sourceTurnRef:'user:1',sourceText:text});
const contribution = (text=seed) => {
  const conversation={conversationId:'ctx:conversation',language:'fr' as const,turns:[{turnId:'user:1',role:'USER' as const,content:text}]};
  const wire={changes:[{operation:'ADD',candidateRef:'ctx:condition',proposedType:'CONDITION',content:'infarctus',sourceText:'infarctus',epistemicState:'KNOWN',assertionKind:'USER_STATED'},
    {operation:'ADD',candidateRef:'ctx:mri',proposedType:'IMAGING_MODALITY',content:'IRM',sourceText:'irm',epistemicState:'KNOWN',assertionKind:'USER_STATED'}],
    relations:[],temporalQualifications:[],expectedVariableOccasions:[]};
  const checked=validatePersistentProjectDelta(wire,text,null,conversation);
  expect(checked.validation.valid).toBe(true);
  return contributionFromPersistentDelta({candidate:checked.candidate!,conversation,currentProject:null,createdAt:'2026-09-17T10:00:00Z'})!;
};
afterEach(()=>vi.unstubAllGlobals());

describe('Contextual scientific implications — existing ST/QRY owners, offline',()=>{
  it('separates the exact seed from unknown dimensions without inventing patient values',()=>{
    const ctx=prepare(seed,[proposal('fonction VG'),proposal('troponine')]);
    expect(ctx.explicitContent).toEqual([{ref:'user:1',sourceText:seed,origin:'EXPLICIT_USER_STATED'}]);
    expect(ctx.implications.every(i=>i.value===null && i.epistemicState==='UNKNOWN' && i.projectRole===null && !i.userStated && !i.candidateIsAdopted)).toBe(true);
    expect(ctx.implications.find(i=>i.dimension==='troponine')).toMatchObject({origin:'UNSUPPORTED_CANDIDATE',visible:false});
    expect(ctx.visibleImplications.length).toBeLessThanOrEqual(3);
    expect(ctx.specializedGeneration).toBe('UPSTREAM_OWNER_REQUIRED_NOT_GENERATED_HERE');
  });
  it('rejects a stale scientific intent even when the caller reuses a turn ID',()=>{
    expect(()=>prepareContextualScientificUnderstanding({scientificInput:makeInput('ancienne question'),source:{turnRef:'user:1',text:seed},adaptiveQuestions:[]})).toThrow('CONTEXTUAL_INTENT_SOURCE_CHANGED');
  });
  it('does not promote owner proposals disguised as structural knowledge-free expectations',()=>{
    expect(()=>prepare(seed,[proposal('MVO',{knowledgeDependent:false})])).toThrow('CONTEXTUAL_DIMENSION_PROPOSAL_INVALID');
  });
  it('never surfaces speculative dimensions spontaneously',()=>{
    const ctx=prepare(seed,[proposal('piste spéculative',{force:'SPECULATIVE'})]);
    expect(ctx.visibleImplications.some(i=>i.dimension==='piste spéculative')).toBe(false);
  });
  it('keeps reporting expectations separate from eligibility',()=>{
    const ctx=prepare();const reporting=ctx.implications.filter(i=>i.stage==='REPORTING');
    expect(reporting.length).toBeGreaterThan(0);
    expect(reporting.every(i=>i.projectRole===null && i.limitations.includes('REPORTING_EXPECTATION_IS_NOT_ELIGIBILITY'))).toBe(true);
  });
  it('rejects an inferred numerical value instead of converting it into user content',()=>{
    expect(()=>prepare(seed,[{...proposal('âge'),value:'40–80 ans'} as unknown as ContextualScientificProposal])).toThrow('CONTEXTUAL_DIMENSION_PROPOSAL_INVALID');
  });
  it.each(['STEMI','NSTEMI','âge','sexe','traitement','timing IRM','LGE','endpoint','effectif'])(
    'never invents a %s value from the incomplete seed',dimension=>{
      const ctx=prepare(seed,[proposal(dimension)]);expect(ctx.implications.find(i=>i.dimension===dimension)?.value).toBeNull();
      expect(ctx.visibleImplications.some(i=>i.dimension===dimension)).toBe(false);
  });
  it('selects scientific finality before descriptive population questions using native PD-009',()=>{
    const native=makeInput();const output=executeScientificThinkingEngine(native);const ctx=prepare();
    const questions=output.adaptiveQuestions.filter(q=>!q.answeredValue);
    const contributions:PreProjectScientificNavigationContribution[]=questions.map(q=>({owner:'SCIENTIFIC_THINKING' as const,sourceRef:ctx.sourceRef,sourceVersion:output.contractVersion,
      informationNeedRef:q.questionId,informationNeed:q.label,whySelected:q.whyAsked,decisionImpact:q.decisionImpact,
      affectedDecisionRefs:[q.decisionBlock],affectedBranchRefs:q.decisionBlock==='SCIENTIFIC_FINALITY'?['question','measurement','design']:[q.decisionBlock],
      knownOptions:q.suggestedAnswers.map(a=>a.label)}));
    contributions.push({owner:'SCIENTIFIC_THINKING',sourceRef:ctx.sourceRef,sourceVersion:output.contractVersion,informationNeedRef:'age',informationNeed:'Quel âge ?',
      whySelected:'Description ultérieure',decisionImpact:'Description locale',affectedDecisionRefs:['description'],affectedBranchRefs:['description'],knownOptions:[]});
    const nav=buildPreProjectNavigationDecision({routing:routeProductEntry({sourceTurnRef:'user:1',raw:seed,routedAt:'2026-09-17T10:00:00Z'}),scientificContributions:contributions,contextualUnderstanding:ctx,sourceText:seed});
    expect(nav.selection.selected?.navigationNeedRefs).toContain('ST-AQ-FINALITY');
    const reply=realizePreProjectNavigationDecision({decision:nav}).assistantReply;
    expect((reply.match(/\?/g)??[]).length).toBe(1);expect(reply).not.toMatch(/UNKNOWN|Missing field|17 dimensions|INFERRED|Knowledge|Connaissance non résolue/);
    expect(nav.selection.trace.arbitraryScoreUsed).toBe(false);
  });
  it('does not add outcome or follow-up to a seed without an evolution/pronostic goal',()=>{
    expect(prepare().implications.some(i=>i.dimension==='résultat observé et temporalité du suivi')).toBe(false);
    expect(prepare('étude du pronostic et de la survie après infarctus').implications.some(i=>i.dimension==='résultat observé et temporalité du suivi')).toBe(true);
  });
  it('changes relevant dimensions with the declared comparison intent',()=>{
    expect(prepare().implications.some(i=>i.stage==='ANALYSIS')).toBe(false);
    expect(prepare('comparaison de traitements après infarctus').implications.some(i=>i.dimension==='comparabilité des groupes et facteurs de confusion')).toBe(true);
  });
  it('keeps tissue proposals inapplicable when their required scientific focus differs',()=>{
    const ctx=prepare('étude de fonction après IDM',[proposal('fibrose',{requiredIntentRefs:['focus:tissue']})],{intentRefs:['focus:function']});
    expect(ctx.implications.find(i=>i.dimension==='fibrose')).toMatchObject({applicability:'NOT_APPLICABLE',visible:false});
  });
  it('does not infer a prior infarction from fibrosis and diabetes',()=>{
    const ctx=prepare('fibrose diabète');expect(ctx.explicitContent[0]!.sourceText).toBe('fibrose diabète');
    expect(ctx.implications.some(i=>/infarct/i.test(i.dimension))).toBe(false);
  });
  it('blocks new collection in a retrospective study',()=>{
    const text='étude rétrospective avec les données existantes';const ctx=prepare(text,[proposal('nouvelle IRM',{requiresNewCollection:true})]);
    expect(ctx.implications.find(i=>i.dimension==='nouvelle IRM')).toMatchObject({applicability:'NOT_APPLICABLE',visible:false});
  });
  it('explicit no-contrast overrides LGE/ECV proposals and preserves a contrast-independent branch',()=>{
    const text='étude IRM post-IDM sans injection, pas de contraste';
    const ctx=prepare(text,[proposal('LGE',{requiredResourceRefs:['contrast']}),proposal('ECV',{requiredResourceRefs:['contrast']}),proposal('fonction')],{resources:[resource('pas de contraste')]});
    expect(ctx.implications.filter(i=>['LGE','ECV'].includes(i.dimension)).every(i=>i.applicability==='NOT_APPLICABLE' && !i.visible)).toBe(true);
    expect(ctx.implications.find(i=>i.dimension==='fonction')?.applicability).toBe('APPLICABILITY_UNKNOWN');
  });
  it('unknown contrast availability is not a permission to recommend a contrast sequence',()=>{
    expect(prepare(seed,[proposal('LGE',{applicability:'APPLICABLE',requiredResourceRefs:['contrast']})]).implications.find(i=>i.dimension==='LGE')).toMatchObject({applicability:'APPLICABILITY_UNKNOWN',visible:false});
  });
  it('rejects constraint records lacking exact user provenance',()=>{
    expect(()=>prepare(seed,[],{resources:[resource('pas de contraste')]})).toThrow('CONTEXTUAL_CONSTRAINT_SOURCE_NOT_EXPLICIT');
  });
  it('never resurrects a previously rejected proposal',()=>{
    const p=proposal('analyse avec seuil');expect(prepare(seed,[p],{rejectedProposalRefs:[p.ref]}).implications.some(i=>i.ref===p.ref)).toBe(false);
  });
  it('preserves exact complete Project binding without any mutation',()=>{
    const native=makeInput();native.researchContext={...native.researchContext,researchProjectId:'project',researchProjectVersion:'v2',researchProjectDigest:'d2',projectSnapshotDigest:'s2'};
    const before=logicalDigest(native);const ctx=prepareContextualScientificUnderstanding({scientificInput:native,source:{turnRef:'user:1',text:seed},adaptiveQuestions:[]});
    expect(ctx.sourceProject).toEqual(native.researchContext);expect(logicalDigest(native)).toBe(before);expect(ctx.projectWriteAuthorized).toBe(false);
    expect(()=>prepareContextualScientificUnderstanding({scientificInput:{...native,researchContext:{...native.researchContext,researchProjectVersion:null}},source:{turnRef:'user:1',text:seed},adaptiveQuestions:[]})).toThrow('CONTEXTUAL_PROJECT_BINDING_INCOMPLETE');
  });
  it('keeps implications outside native N1/PRJ adoption',()=>{
    const c=contribution();const native=prepareResearchProjectContributionCandidate(c,null);const before=logicalDigest(c);
    const ctx=prepare(seed,[proposal('fonction VG')]);
    const project=confirmResearchProjectContribution({contribution:c,current:null,projectId:'ctx:project',authority:behaviorAuthority,confirmedAt:'2026-09-17T10:00:00Z',reviewedProjection:native.humanReviewProjection});
    expect(logicalDigest(c)).toBe(before);expect(JSON.stringify(project.canonicalState)).not.toMatch(/FEVG|fonction VG/);expect(ctx.candidateIsAdopted).toBe(false);
  });
  it('reuses the actual preproject Standard ST handoff and a single local next question',()=>{
    vi.stubGlobal('fetch',vi.fn(()=>{throw new Error('NO_PROVIDER_ALLOWED');}));
    const intervention=buildPreProjectScientificThinkingIntervention({contribution:contribution(),sessionId:'ctx:session',sourceJourney:'DESIGN_STUDY'});
    expect(intervention).not.toBeNull();expect(intervention!.providerCalls).toBe(0);
    expect(intervention!.navigationContributions.length).toBeGreaterThan(0);
    const decision=buildPreProjectNavigationDecision({routing:routeProductEntry({sourceTurnRef:'user:1',raw:seed,routedAt:'2026-09-17T10:00:00Z'}),scientificContributions:intervention!.navigationContributions,contextualUnderstanding:intervention!.contextualUnderstanding,sourceText:seed});
    expect(decision.selection.selected?.navigationNeedRefs).toContain('ST-AQ-FINALITY');
    expect(realizePreProjectNavigationDecision({decision}).assistantReply).toContain('aucun choix n’est fixé');expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects a stale context paired with the same turn ID but changed raw text',()=>{
    expect(()=>buildPreProjectNavigationDecision({routing:routeProductEntry({sourceTurnRef:'user:1',raw:'autre intention',routedAt:'2026-09-17T10:00:00Z'}),contextualUnderstanding:prepare(),sourceText:'autre intention'})).toThrow('QRY_CONTEXTUAL_SOURCE_BINDING_INVALID');
  });
  it('knowledge support needs an actual applicable linked concept and cannot use a user preference as evidence',()=>{
    const text='Comprendre le T1 mapping et l’ECV en IRM.';const knowledge=executeKnowledgeEngine({originalQuestion:text});
    const concept=knowledge.resolvedConcepts.find(c=>c.conceptId==='biomarker:ecv')!;
    const refs=[concept.conceptId,...Object.values(concept.providerConcepts).flat()];
    const statement=knowledge.applicableAssertions.find(s=>s.conceptIds.some(id=>refs.includes(id)))!;
    expect(statement).toBeDefined();
    const supported=proposal(concept.preferredLabel,{applicability:'APPLICABLE',conceptRef:concept.conceptId,statementRefs:[statement.stableId]});
    expect(prepare(text,[supported],{knowledge}).implications.find(i=>i.ref===supported.ref)).toMatchObject({origin:'SUPPORTED_CANDIDATE',visible:true,value:null});
    expect(prepare(text,[{...supported,dimension:'MVO'}],{knowledge}).implications.find(i=>i.ref===supported.ref)).toMatchObject({origin:'UNSUPPORTED_CANDIDATE',visible:false});
    expect(prepare(text,[{...supported,statementRefs:['user:preference']}],{knowledge}).implications.find(i=>i.ref===supported.ref)?.origin).toBe('UNSUPPORTED_CANDIDATE');
    expect(prepare(seed,[supported],{knowledge}).implications.find(i=>i.ref===supported.ref)?.knowledgeResultRef).toBeNull();
  });
  it.each([
    ['AVC','AVC aigu et imagerie','contexte et temporalité de la lésion'],
    ['FIBROSIS','fibrose myocardique chez diabétiques','caractérisation tissulaire'],
    ['THROMBUS','thrombus post-IDM IRM vs échographie','performance et référence standard'],
    ['CEC','CEC et IRM pilote','signal, variance et faisabilité'],
    ['COHORT','cohorte observationnelle non principalement imagerie','facteurs de confusion et description de la cohorte'],
  ])('cross-domain owner contribution is qualified without a disease table: %s',(id,text,dimension)=>{
    const ctx=prepare(text,[proposal(dimension,{owner:'SEM',ref:`semantic:${id}`})]);
    expect(ctx.implications.find(i=>i.ref===`semantic:${id}`)).toMatchObject({value:null,origin:'UNSUPPORTED_CANDIDATE',visible:false});
    expect(ctx.explicitContent[0]!.sourceText).toBe(text);
  });
});
