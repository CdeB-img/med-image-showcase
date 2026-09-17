import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CASES, makeContext, realize, semanticFixture, turn, bridgeRequest, wire } from '../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures';
import { acceptContextualReasoningContribution, buildContextualReasoningProviderPayload } from '../contextual-reasoning';
import { prepareContextualScientificUnderstanding } from '../contextual-understanding';
import { parseProductBridgeRequest, buildPersistentSourceCatalog, type ProductBridgeResponse } from '../../protocol-designer/product-bridge';
import { executeProtocolDesignerBridge } from '../../../../api/protocol-designer-bridge';
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from '../../research-project-construction/contribution-owner-boundary';
import { behaviorAuthority } from '../../protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures';
import { boundCanaryProviderCall, canaryBudgetAdmission, createCanaryCampaignPolicy, campaignBudgetPolicy } from '../../../../server/protocol-designer-canary-policy';
import { buildOpenAIPersistentDeltaPayload } from '../../../../api/protocol-designer-openai-extraction-provider';
import { createRecordedProtocolDesignerFetch, createProtocolDesignerReplayFetch, readProtocolDesignerReplayRefs } from '../../../../server/protocol-designer-provider-replay';
const root='validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/';
afterEach(()=>vi.unstubAllGlobals());
const receive=(ctx:ReturnType<typeof makeContext>,out=semanticFixture(ctx.request))=>acceptContextualReasoningContribution({request:ctx.request,output:out,production:{provider:'LOCAL_SYNTHETIC',model:'NO_PROVIDER',responseId:null,mode:'LOCAL_SYNTHETIC'}});

describe('ST contextual reasoning — offline owner orchestration, not live intelligence qualification',()=>{
 it('existing recorder and strict replay accept the ST purpose without any new transport or ledger owner',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'noxia-local-synthetic-st-replay-'));
  const evidenceRoot=join(folder,'canary-local-synthetic-st-replay');
  try {
   const ctx=makeContext();const endpoint='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';
   const response=JSON.stringify({modelVersion:'gemini-3.5-flash-lite',responseId:'LOCAL_SYNTHETIC',candidates:[{content:{parts:[{text:JSON.stringify(semanticFixture(ctx.request))}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:100,totalTokenCount:200}});
   const provider=vi.fn<typeof fetch>().mockResolvedValue(new Response(response));
   const policy=createCanaryCampaignPolicy({campaignId:'local-synthetic-st-replay',maxSessions:3,measuredSoftStopUsd:1,absoluteHardBoundUsd:2,singleAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED',allowedProviderModels:['gpt-5.6-terra','gemini-3.5-flash-lite'],createdAt:'2026-09-17T10:00:00.000Z'});
   const context={sessionId:'local:session',conversationId:'local:conversation',turnId:'u1',clientRequestId:'local:req',testSessionId:'LOCAL_SYNTHETIC'};
   const init={method:'POST',body:JSON.stringify(buildContextualReasoningProviderPayload(ctx.request)),noxiaProviderObservation:{context,purpose:'SCIENTIFIC_THINKING_PROPOSAL' as const,reasoningEffort:null,retryIndex:0,retryReason:null}};
   const record=createRecordedProtocolDesignerFetch({root:evidenceRoot,fetchImpl:provider,canaryCampaignId:policy.campaignId,campaignPolicy:policy});
   expect(await (await record(endpoint,init)).text()).toBe(response);
   const refs=await readProtocolDesignerReplayRefs(evidenceRoot,{campaignId:policy.campaignId,sessionId:context.sessionId});expect(refs).toHaveLength(1);
   const replay=createProtocolDesignerReplayFetch({root:evidenceRoot,refs,scope:{campaignId:policy.campaignId,sessionId:context.sessionId}});
   expect(await (await replay(endpoint,init)).text()).toBe(response);expect(provider).toHaveBeenCalledTimes(1);
   writeFileSync(root+'st-purpose-strict-replay.json',JSON.stringify({provenance:'LOCAL_SYNTHETIC_PROVIDER_RESPONSE',purpose:'SCIENTIFIC_THINKING_PROPOSAL',record:'PASS',strictReplay:'PASS',realProviderCalls:0,existingRecorder:true},null,2)+'\n');
  } finally {rmSync(folder,{recursive:true,force:true});}
 });
 it('existing cost guard accepts the ST payload but safely denies unchanged Terra at proposed hard 2 USD',()=>{
  const ctx=makeContext();
  const gemini=boundCanaryProviderCall('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',JSON.stringify(buildContextualReasoningProviderPayload(ctx.request)));
  expect(gemini).not.toBeNull();
  const terra=buildOpenAIPersistentDeltaPayload(bridgeRequest());
  const bound=boundCanaryProviderCall('https://api.openai.com/v1/responses',JSON.stringify({...terra,service_tier:'default'}));
  expect(bound).not.toBeNull();expect(bound!.upperBoundUsd).toBeGreaterThan(2);
  const policy=createCanaryCampaignPolicy({campaignId:'contextual-reasoning-proposed',maxSessions:3,measuredSoftStopUsd:1,absoluteHardBoundUsd:2,singleAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED',allowedProviderModels:['gpt-5.6-terra','gemini-3.5-flash-lite'],createdAt:'2026-09-17T10:00:00.000Z'});
  expect(canaryBudgetAdmission(0,bound,0,campaignBudgetPolicy(policy))).toBe('DENIED_HARD_BUDGET');
  writeFileSync(root+'canary-budget-preflight.json',JSON.stringify({liveExecuted:false,gemini,terra:bound,admission:'DENIED_HARD_BUDGET',hard:2,soft:1},null,2)+'\n');
 });
 it.each(CASES)('$id actual native Knowledge / Imaging + synthetic specialized provider contribution',c=>{
  const network=vi.fn(()=>{throw Error('LIVE_FORBIDDEN')});vi.stubGlobal('fetch',network);
  const ctx=makeContext(c.text,c.explicit);const result=realize(ctx,semanticFixture(ctx.request,c.dimensions));
  expect(network).not.toHaveBeenCalled();expect(result.receipt.project).toBeNull();
  expect(result.st.contextualUnderstanding.visibleImplications.length).toBeGreaterThan(1);
  expect(result.st.contextualUnderstanding.visibleImplications.length).toBeLessThanOrEqual(5);
  expect(result.st.contextualUnderstanding.visibleImplications.some(p=>c.dimensions.some(d=>d[1]===p.dimension))).toBe(true);
  expect(result.st.contextualUnderstanding.implications.every(p=>p.value===null&&p.projectRole===null&&!p.userStated&&!p.candidateIsAdopted)).toBe(true);
  expect(result.visible).not.toMatch(/GENERAL_EXPERT|INFERRED_|owner|digest|QRY/);
  expect((result.visible.match(/\?/g)??[])).toHaveLength(1);
  expect(Boolean(result.receipt.specializedOwner)).toBe(c.dimensions.some(d=>d[0]==='IMAGING'));
  expect(result.decision.selection.trace.arbitraryScoreUsed).toBe(false);
 });
 it('retains actual NO_PROVIDER diagnostics while allowing explicitly non-documentary expert reasoning',()=>{
  const ctx=makeContext();expect(ctx.request.knowledge.coverageStatus).toBe('NO_PROVIDER');
  const r=realize(ctx);expect(r.st.contextualUnderstanding.visibleImplications.filter(p=>p.ref.startsWith('p:')).every(p=>p.basis==='GENERAL_EXPERT_REASONING'&&!p.evidenceRefs.length&&!p.statementRefs.length)).toBe(true);
 });
 it('reorders after the exact early tissue-damage continuation and asks one measurement question',()=>{
  const a=makeContext();const first=realize(a);expect(first.st.contextualUnderstanding.visibleImplications[0].dimension).toBe('fonction myocardique');
  const b=makeContext('je veux surtout voir les dommages tissulaires précoces',[['OBJECTIVE','dommages tissulaires précoces']],[turn(CASES[0].text)]);
  const fixture=semanticFixture(b.request);fixture.facts=[{ref:'focus:tissue',kind:'SCIENTIFIC_FOCUS',turnRef:'u2',sourceText:'dommages tissulaires précoces',available:null}];
  fixture.candidates[0].relevance='CONDITIONAL';fixture.candidates[2].force='NEAR_NECESSARY';fixture.candidates[2].requiredIntentRefs=['focus:tissue'];
  fixture.questions=[{ref:'q:timing',text:'Par rapport à quel événement souhaitez-vous situer l’observation précoce ?',rationale:'Relie le phénomène à sa temporalité.',decisionImpact:'Détermine l’observation et le design.',dimensionRefs:['p:2'],affectedBranches:['MEASUREMENT','DESIGN'],asksAboutFactRefs:[]}];
  const second=realize(b,fixture);expect(second.st.contextualUnderstanding.visibleImplications[0].dimension).toBe('caractérisation myocardique');
  expect(second.visible).toContain('Par rapport à quel événement');expect(second.visible).not.toContain('Souhaitez-vous caractériser');
  writeFileSync(root+'idm-offline-responses.json',JSON.stringify({provenance:'LOCAL_SYNTHETIC_SEMANTIC_PROVIDER_WITH_CURRENT_NATIVE_STANDARD_HANDOFF',turns:[{user:a.text,response:first.visible,implications:first.st.contextualUnderstanding},{user:b.text,response:second.visible,implications:second.st.contextualUnderstanding}],providerCalls:0},null,2)+'\n');
 });
 it.each(['value','projectRole'])('rejects inferred %s before any lifecycle write',field=>{
  const ctx=makeContext();const out=semanticFixture(ctx.request);(out.candidates[0] as unknown as Record<string,unknown>)[field]=55;
  expect(()=>receive(ctx,out)).toThrow();
 });
 it('reuses existing quantity-surface guard to block numeric values smuggled in prose',()=>{
  const ctx=makeContext();const out=semanticFixture(ctx.request);out.candidates[0].dimension='FEVG de 45 %';
  expect(()=>receive(ctx,out)).toThrow('ST_REASONING_INVENTED_QUANTITY');
 });
 it('rejects stale receipts and fabricated Knowledge references',()=>{
  const ctx=makeContext();const old=semanticFixture(ctx.request);old.contextDigest='other';expect(()=>receive(ctx,old)).toThrow('ST_REASONING_STALE_CONTEXT');
  const out=semanticFixture(ctx.request);out.candidates[0].basis='EVIDENCE_SUPPORTED';out.candidates[0].statementRefs=['nonexistent'];out.candidates[0].conceptRef='imaginary';
  expect(()=>realize(ctx,out)).toThrow('CONTEXTUAL_EVIDENCE_CLAIM_UNSUPPORTED');
 });
 it('general expert reasoning cannot carry invented evidence or borrow a user preference as support',()=>{
  const ctx=makeContext();const out=semanticFixture(ctx.request);out.candidates[0].statementRefs=['user:preference'];
  expect(()=>receive(ctx,out)).toThrow('ST_REASONING_GENERAL_IS_NOT_EVIDENCE');
 });
 it('does not accept Imaging ownership with no explicit imaging request',()=>{
  const ctx=makeContext(CASES[4].text,CASES[4].explicit);expect(ctx.request.imaging).toBeNull();
  expect(()=>receive(ctx)).toThrow('IMAGING_CONTEXTUAL_HANDOFF_INVALID');
 });
 it.each([
  ['contraste','IDM en IRM sans injection de contraste','LGE et ECV','sans injection de contraste'],
  ['PET','projet IRM sans PET disponible','méthode PET','sans PET disponible'],
  ['séquence','IRM sans séquence de diffusion disponible','diffusion','sans séquence de diffusion disponible'],
  ['budget','étude IRM sans budget pour examen supplémentaire','examen supplémentaire','sans budget pour examen supplémentaire'],
  ['modalité','étude IRM avec échographie indisponible','échographie','échographie indisponible'],
 ])('explicit unavailable %s filters dependent options but preserves independent dimensions',(_id,text,dimension,sourceText)=>{
  const ctx=makeContext(text,[['IMAGING_MODALITY','IRM']]);const out=semanticFixture(ctx.request);
  out.facts=[{ref:'resource',kind:'RESOURCE',turnRef:'u1',sourceText,available:false}];
  out.candidates[0].dimension=dimension;out.candidates[0].requiredResourceRefs=['resource'];
  const r=realize(ctx,out);expect(r.st.contextualUnderstanding.implications.find(p=>p.ref==='p:0')!.applicability).toBe('NOT_APPLICABLE');
  expect(r.visible).not.toContain(dimension);expect(r.st.contextualUnderstanding.visibleImplications.length).toBeGreaterThan(0);
 });
 it('retrospective restriction applies from an earlier user turn, not only the latest message',()=>{
  const ctx=makeContext('je veux examiner le dommage myocardique',[['PHENOMENON','dommage myocardique']],[turn('cohorte rétrospective avec IRM')]);
  const out=semanticFixture(ctx.request);out.candidates[0].requiresNewCollection=true;const r=realize(ctx,out);
  expect(r.st.contextualUnderstanding.implications.find(p=>p.ref==='p:0')!.applicability).toBe('NOT_APPLICABLE');
 });
 it.each(['population pédiatrique','population adulte'])('generic explicit restriction %s overrides an incompatible proposal',text=>{
  const ctx=makeContext('étude IRM '+text,[['IMAGING_MODALITY','IRM'],['POPULATION',text]]);const out=semanticFixture(ctx.request);
  out.facts=[{ref:'population:constraint',kind:'RESTRICTION',turnRef:'u1',sourceText:text,available:null}];out.candidates[0].conflictFactRefs=['population:constraint'];
  expect(realize(ctx,out).st.contextualUnderstanding.implications.find(p=>p.ref==='p:0')!.visible).toBe(false);
 });
 it('no unavailable resource may be manufactured from NOXIA prose',()=>{
  const ctx=makeContext();const out=semanticFixture(ctx.request);out.facts=[{ref:'contrast',kind:'RESOURCE',turnRef:'u1',sourceText:'sans contraste',available:false}];
  expect(()=>receive(ctx,out)).toThrow('ST_REASONING_FACT_NOT_USER_ANCHORED');
 });
 it.each([
  ['étude prospective sur 5 ans','TEMPORAL_STRUCTURE'],['comparer deux traitements','COMPARISON'],['IRM avant et après traitement','TEMPORAL_STRUCTURE'],['cohorte rétrospective','RESTRICTION'],['patients suivis tous les ans','TEMPORAL_STRUCTURE'],
 ])('does not re-ask already understood user structure: %s', (text,kind)=>{
  const ctx=makeContext(text,[['OBJECTIVE',text]]);const out=semanticFixture(ctx.request,[['SCIENTIFIC_THINKING','architecture de l’étude à préciser']]);
  out.facts=[{ref:'known:structure',kind:kind as 'TEMPORAL_STRUCTURE',turnRef:'u1',sourceText:text,available:null}];out.questions[0].asksAboutFactRefs=['known:structure'];
  const r=receive(ctx,out);expect(r.questions).toHaveLength(0);expect(r.facts[0].sourceText).toBe(text);expect(r.proposals[0].value).toBeNull();
 });
 it('reporting is not eligibility; explicit confirmation still goes through normal candidate and Human Review',()=>{
  const a=makeContext();const r=realize(a);expect(r.st.contextualUnderstanding.implications.find(p=>p.stage==='REPORTING')!.projectRole).toBeNull();
  const pending=prepareResearchProjectContributionCandidate(a.contribution,null);expect(JSON.stringify(pending.canonicalChangeSet)).not.toContain('fonction myocardique');
  const b=makeContext('je veux prévoir la fonction myocardique',[['PHENOMENON','fonction myocardique']],[turn(a.text)]);
  const candidate=prepareResearchProjectContributionCandidate(b.contribution,null);expect(candidate.status).toBe('CANDIDATE_PENDING_HUMAN_CONFIRMATION');
  expect(candidate.humanReviewProjection.expectedChangeRefs.length).toBeGreaterThan(0);
  const project=confirmResearchProjectContribution({contribution:b.contribution,current:null,projectId:'offline:project',authority:behaviorAuthority,confirmedAt:'2026-09-17T10:03:00Z'});
  expect(project).not.toBeNull();expect(JSON.stringify(project)).not.toMatch(/45 %|PRIMARY_ENDPOINT/);
  expect(r.receipt.projectWrites).toBe(0);
 });
 it('rejects a foreign Project-bound reasoning receipt and injected server provider operation',()=>{
  const ctx=makeContext();const receipt=receive(ctx);const forged={...receipt,project:{projectId:'other',versionId:'v2',projectDigest:'different'}};
  expect(()=>prepareContextualScientificUnderstanding({scientificInput:ctx.scientificInput,source:{turnRef:'u1',text:ctx.text},adaptiveQuestions:[],reasoning:forged})).toThrow('CONTEXTUAL_REASONING_CURRENT_BINDING_REQUIRED');
  expect(parseProductBridgeRequest({...bridgeRequest(),contextualReasoningRequest:ctx.request})!.contextualReasoningRequest).toBeUndefined();
 });
 it('no seed-specific clinical list or new provider transport in the owner additions',()=>{
  for(const f of ['src/features/scientific-thinking/contextual-reasoning.ts','src/features/scientific-thinking/contextual-reasoning-input.ts','src/features/imaging-study-designer/contextual-proposals.ts']){
   expect(readFileSync(f,'utf8')).not.toMatch(/infarctus|troponine|AVC|\bCEC\b|nativeFetch|new AbortController|fetch\(/);
  }
 });
 it('Bridge uses existing extraction/provider path and preserves native Scientific Thinking conversation without Project writes',async()=>{
  const body=bridgeRequest();const fetchMock=vi.fn(async(url:RequestInfo|URL,init?:RequestInit)=>{
   const address=String(url);const payload=JSON.parse(String(init!.body));
   if(address==='https://api.openai.com/v1/responses'){
    const catalog=buildPersistentSourceCatalog(body.conversation);const args=wire(CASES[0].text,CASES[0].explicit);
    const changes=args.changes.map(c=>{const {sourceText,...rest}=c;return {...rest,sourceAnchorId:catalog.anchors.find(a=>a.exactText===sourceText)!.anchorId};});
    return new Response(JSON.stringify({id:'offline:openai',model:'gpt-5.6-terra',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...args,changes})}]}],usage:{input_tokens:100,output_tokens:50,total_tokens:150}}));
   }
   if(address.startsWith('https://generativelanguage.googleapis.com/')){
    const packet=JSON.parse(payload.contents[0].parts[0].text);expect(packet.currentMessage.text).toBe(CASES[0].text);
    expect(payload.generationConfig.responseMimeType).toBe('text/plain');
    return new Response(JSON.stringify({responseId:'offline:gemini',modelVersion:'gemini-3.5-flash-lite',candidates:[{content:{parts:[{text:'LOCAL_SYNTHETIC native discussion'}]}}],usageMetadata:{promptTokenCount:100,candidatesTokenCount:100,totalTokenCount:200}}));
   }
   throw Error('UNEXPECTED_EXTERNAL_ENDPOINT');
  });
  const result=await executeProtocolDesignerBridge({body,apiKey:'LOCAL_SYNTHETIC',openAiApiKey:'LOCAL_SYNTHETIC',fetchImpl:fetchMock,providerAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED'});
  const response=result.body as ProductBridgeResponse;
  expect(result.status,JSON.stringify(result.body)).toBe(200);expect(response.scientificConversation?.responseOwner).toBe('LLM');expect(response.assistantReply).toBe('LOCAL_SYNTHETIC native discussion');expect(response.persistentExtraction.validation?.valid).toBe(true);
  expect(response.conversationFailure).toBeNull();expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(response.observability.providerCalls!.map(c=>c.purpose)).toEqual(['PERSISTENT_DELTA','CONVERSATION_REALIZATION']);
  expect(response.observability.providerCalls!.every(c=>c.retryIndex===0)).toBe(true);expect(response.observability.projectWrites).toBe(0);
  writeFileSync('validation/protocol-designer-v1-scientific-collaborator-conversation-path-01/legacy-bridge-adaptation.json',JSON.stringify({provenance:'LOCAL_SYNTHETIC_FETCH_ON_EXISTING_PRODUCT_BRIDGE',response},null,2)+'\n');
 });
});
