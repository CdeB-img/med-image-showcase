import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ProtocolDesignerDemo from '../../src/pages/ProtocolDesignerDemo';
import * as sessionModule from '../../src/features/protocol-designer/functional-reset/session';
import { handleProtocolDesignerBridge, type ApiResponse } from '../../api/protocol-designer-bridge';
import { createProtocolDesignerReplayFetch, readProtocolDesignerReplayRefs } from '../../server/protocol-designer-provider-replay';
import { FileScientificInterpretationEvidenceStore } from '../../api/scientific-interpretation-evidence-store';
import { T01,T02,T03,T04,T05 } from '../../src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-provider-replay';

const root=resolve('.provider-evidence.local/canary-protocol-designer-v1-live-provider-long-horizon-01r-20260914');
const out=resolve(process.env.NOXIA_REPLAY_OUTPUT_DIR ?? 'validation/protocol-designer-v1-autonomous-adversarial-stabilization-01/preflight');
const current=()=>JSON.parse(localStorage.getItem(sessionModule.FUNCTIONAL_RESET_STORAGE_KEY)!) as sessionModule.FunctionalResetSession;
const write=(file:string,value:unknown)=>writeFile(resolve(out,file),JSON.stringify(value,null,2)+'\n');
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});

it('reconstructs exact recorded live prefix through Standard and evaluates explicit T05 proposals',async()=>{
  expect(process.env.NODE_OPTIONS).toContain('offline-guard.cjs');
  const refs=await readProtocolDesignerReplayRefs(root);
  const store=new FileScientificInterpretationEvidenceStore(root);
  const exchanges=await Promise.all(refs.map(async ref=>(await store.read(ref))!.payload as {requestDigest:string;request:{body:string}}));
  const strictReplay=createProtocolDesignerReplayFetch({root,refs});
  let providerCalls=0, browserCalls=0, onServer=false, uuidSequence=0;
  let turnIds:string[]=[];
  const initialIds=['037528bc-223f-43ce-b6ed-493b731d5a68','9a4dd726-fbf4-4ab6-9598-19e165e81887'];
  const serverIds=['7ae57748-4ace-4ec2-8839-1e9ed77c91c6','b3daf019-0e36-4186-b3ad-5a17856eb5c8','11111111-1111-4111-8111-111111111114'];
  vi.spyOn(crypto,'randomUUID').mockImplementation(()=> (onServer?serverIds[browserCalls-1]:initialIds.shift()??`00000000-0000-4000-8000-${String(++uuidSequence).padStart(12,'0')}`) as ReturnType<Crypto['randomUUID']>);
  vi.spyOn(sessionModule,'createTurnId').mockImplementation(()=>turnIds.shift()??`turn:00000000-0000-4000-8000-${String(++uuidSequence).padStart(12,'0')}`);
  vi.useFakeTimers({toFake:['Date']});
  vi.setSystemTime(new Date('2026-09-14T19:09:50.000Z'));
  window.history.replaceState({},'', '/protocol-designer/demo');
  localStorage.clear();
  const requestChecks:{index:number;requestDigest:string;status:string}[]=[];
  const providerReplay:typeof fetch=async(input,init)=>{
    const expected=exchanges[providerCalls];
    expect(expected,'No unrecorded provider attempt is permitted').toBeTruthy();
    try {
      const response=await strictReplay(input,init);
      requestChecks.push({index:providerCalls+1,requestDigest:expected.requestDigest,status:'EXACT_QUALIFIED_REPLAY'});
      providerCalls++;
      return response;
    } catch(error) {
      await write('replay-request-mismatch.json',{call:providerCalls+1,expected:JSON.parse(expected.request.body),actual:JSON.parse(String(init?.body)),error:String(error)});
      throw error;
    }
  };
  const browserTransport=vi.fn(async(resource:string|URL|Request,init?:RequestInit)=>{
    expect(String(resource)).toBe('/api/protocol-designer-bridge');
    browserCalls++;onServer=true;
    let status=0;let body:unknown;const headers:Record<string,string>={};
    const response:ApiResponse={status(n){status=n;return this;},setHeader(k,v){headers[k]=v;},json(v){body=v;}};
    try {await handleProtocolDesignerBridge({method:init?.method,headers:{...Object.fromEntries(new Headers(init?.headers).entries()),host:'127.0.0.1:53219',origin:'http://127.0.0.1:53219'},body:init?.body},response,
      {NODE_ENV:'development',OPENAI_API_KEY:'offline-record-replay-only',GEMINI_API_KEY:'offline-record-replay-only',GEMINI_MODEL:'gemini-3.5-flash-lite'},
      {fetchImpl:providerReplay,now:()=>Date.now(),providerAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED'});
    }finally{onServer=false;}
    await write(`bridge-${browserCalls}.json`,{status,body});
    expect(status).toBe(200);
    return {ok:status===200,status,headers:new Headers(headers),json:async()=>body,text:async()=>JSON.stringify(body)} as Response;
  });
  vi.stubGlobal('fetch',browserTransport);
  render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo/></MemoryRouter></HelmetProvider>);
  const submit=async(text:string,time:string,ids:string[])=>{
    turnIds=ids;vi.setSystemTime(new Date(time));
    await act(async()=>{fireEvent.change(screen.getByLabelText('Votre message'),{target:{value:text}});});
    await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Envoyer'}));await new Promise(r=>setTimeout(r,0));});
    await waitFor(()=>expect(document.querySelector('.animate-spin')).toBeNull());
    expect(current().entries.filter(e=>e.kind==='ERROR')).toEqual([]);
  };
  const confirm=async(time:string,ids:string[])=>{
    turnIds=ids;vi.setSystemTime(new Date(time));
    const review=screen.getAllByTestId('functional-contribution-review').at(-1)!;
    await act(async()=>{fireEvent.click(within(review).getByRole('button',{name:'Cela correspond à mon projet'}));await new Promise(r=>setTimeout(r,0));});
    await waitFor(()=>expect(document.querySelector('.animate-spin')).toBeNull());
  };
  await submit(T01,'2026-09-14T19:10:39.705Z',['turn:da6b06d9-bc1f-4742-8ef4-0bf8ee2893e8']);
  expect(current().project).toBeNull();
  await confirm('2026-09-14T19:12:05.438Z',['turn:4532ecd6-e2a5-478b-970c-f231506d7e85','turn:c32fb715-346f-4529-9e5b-b6e44d461038']);
  expect(current().project?.revision).toBe(1);
  await submit(T02,'2026-09-14T19:15:23.096Z',['turn:df7cb5cf-58bc-4a45-9ea9-b445f582a001']);
  expect(current().project?.revision).toBe(1);
  await submit(T03,'2026-09-14T19:16:06.165Z',['turn:73f07170-dd19-47fd-8e42-bbe7de50bc29','turn:8ddedf10-b537-4f20-9734-40e7355b900b','turn:ff733969-f140-48d7-9313-553a16d8106d']);
  expect(current().project?.revision).toBe(2);
  await submit(T04,'2026-09-14T19:16:16.704Z',['turn:a689d86c-66dd-45be-907e-10318a5db6ae']);
  await confirm('2026-09-14T19:17:04.932Z',[]);
  expect(current().project?.revision).toBe(3);
  expect(providerCalls).toBe(5);
  const before=current();
  await write('prefix-session-v3.json',before);
  const previousReply=before.runtimeTurns.at(-1)!.content;
  await submit(T05,'2026-09-14T19:17:18.031Z',[]);
  const after=current();const reply=after.runtimeTurns.at(-1)!.content;
  const latest=after.bridgeTraces.at(-1)!;
  expect(after.project).toEqual(before.project);
  expect(providerCalls).toBe(5);
  expect(latest).toMatchObject({provider:'NONE',model:'SCIENTIFIC_THINKING_RUNTIME',calls:0,continuationPresentationSource:'ST_STANDARD_PROJECTION'});
  const red=reply===previousReply;
  const receipt={LIVE_01R_T05_OFFLINE_REPRODUCTION:red?'PASS':'FAIL_OR_REPAIRED',replayLevel:'REAL_STANDARD_REACT_RUNTIME_JSDOM_REAL_HANDLER_REAL_ADAPTERS_EXACT_QUALIFIED_PROVIDER_REPLAY',providerCalls:0,recordedResponsesUsed:providerCalls,browserHttpCalls:browserCalls,projectUnchanged:true,projectRevision:after.project!.revision,previousReply,reply,oldQuestionRepeated:red,requestChecks,qryBefore:before.queryNavigation,qryAfter:after.queryNavigation,ownerLedgerBefore:before.knowledgeOwnerLedger,ownerLedgerAfter:after.knowledgeOwnerLedger,scientificThinkingInteraction:after.scientificThinkingInteraction,latestTrace:latest};
  await write(process.env.EXPECT_LIVE_01R_RED==='1'?'red-reproduction.json':'green-replay.json',receipt);
  await write('last-session.json',after);
  if(process.env.EXPECT_LIVE_01R_RED==='1')expect(red).toBe(true);
  else {
    expect(reply,'An explicit proposal request must add useful content or explain lack of additional defensible options').not.toBe(previousReply);
    expect(reply).toMatch(/hypothèses scientifiques candidates/u);
    expect(reply).toContain('Hypothèse 1');
    expect(reply).toContain('Hypothèse 2');
    expect(reply).toContain('Pour la confronter');
    expect(reply).toContain('ne démontre pas l’équivalence');
    expect(reply).toContain('Le projet reste inchangé');
    expect(reply).not.toMatch(/ST-Q-|ST-H-|PROJECT_.*UNKNOWN|ke1-/u);
    const beforeEntries=before.knowledgeOwnerLedger.entries;
    const afterEntries=after.knowledgeOwnerLedger.entries;
    expect(afterEntries.length).toBe(beforeEntries.length+1);
    const nativeInput=afterEntries.at(-1)!.request.nativeInput as {requestedOperation:string;projectUnknowns:{text:string}[]};
    expect(nativeInput.requestedOperation).toBe('GENERATE_ALTERNATIVE_HYPOTHESIS');
    for(const unknown of nativeInput.projectUnknowns) expect(reply).toContain(unknown.text);
    const firstProposalResult=after.scientificThinkingInteraction!.ownerResultRef;
    await submit("qu'est-ce que tu me proposerais ?",'2026-09-14T19:18:00.000Z',[]);
    const repeated=current();
    expect(repeated.project).toEqual(before.project);
    expect(repeated.knowledgeOwnerLedger.entries).toHaveLength(afterEntries.length);
    expect(repeated.scientificThinkingInteraction!.ownerResultRef).toBe(firstProposalResult);
    expect(repeated.runtimeTurns.at(-1)!.content).toContain('pas d’hypothèse supplémentaire défendable');
    expect(providerCalls).toBe(5);
    expect(browserCalls).toBe(3);
    await write('repeat-proposal-receipt.json',{newProviderCalls:0,compatibleResultReused:true,projectUnchanged:true,reply:repeated.runtimeTurns.at(-1)!.content,interaction:repeated.scientificThinkingInteraction});
    await submit("Je choisis l'hypothèse 1",'2026-09-14T19:19:00.000Z',[]);
    expect(current().project).toEqual(before.project);
    expect(current().scientificThinkingInteraction!.status).toBe('PENDING_HUMAN_REVIEW');
    expect(current().pendingContribution).toBeTruthy();
    expect(providerCalls).toBe(5);
    expect(browserCalls).toBe(3);
    await write('selection-after-exhaustion-receipt.json',{newProviderCalls:0,projectUnchanged:true,status:current().scientificThinkingInteraction!.status,interaction:current().scientificThinkingInteraction});
  }
});
