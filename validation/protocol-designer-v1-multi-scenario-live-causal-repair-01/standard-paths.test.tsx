import {act,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {HelmetProvider} from 'react-helmet-async';
import {MemoryRouter} from 'react-router-dom';
import Page from '../../src/pages/ProtocolDesignerDemo';
import {handleProtocolDesignerBridge,type ApiResponse} from '../../api/protocol-designer-bridge';
import {FUNCTIONAL_RESET_STORAGE_KEY,type FunctionalResetSession} from '../../src/features/protocol-designer/functional-reset/session';
import {createRepairOfflineProvider,source} from './offline-provider';
import {mission} from './live-evidence';
import type {ProviderCallWitness} from '../protocol-designer-v1-autonomous-adversarial-stabilization-01/provider-transport';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
const current=()=>JSON.parse(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
const out=resolve(mission,process.env.NOXIA_STANDARD_PHASE ?? 'standard-paths-qualified');mkdirSync(out,{recursive:true});
const save=(name:string,value:unknown)=>writeFileSync(resolve(out,name+'.json'),JSON.stringify(value,null,2)+'\n');
it.each(['S1','S2','S3','S4','S5'])('real Standard and handler, offline provider boundary: %s',async(scenario)=>{
 expect(process.env.NODE_OPTIONS).toContain('offline-guard');
 localStorage.clear();window.history.replaceState({},'','/protocol-designer/demo');
 const witnesses:ProviderCallWitness[]=[];const provider=createRepairOfflineProvider(witnesses);const exchanges:unknown[]=[];const turns:unknown[]=[];
 vi.stubGlobal('fetch',async(resource:string|URL|Request,init?:RequestInit)=>{
  if(String(resource)!=='/api/protocol-designer-bridge')throw new Error('UNEXPECTED_BROWSER_ENDPOINT');
  let status=0;let body:unknown;const response:ApiResponse={status(n){status=n;return this},setHeader(){},json(v){body=v}};
  await handleProtocolDesignerBridge({method:init?.method,headers:{...Object.fromEntries(new Headers(init?.headers).entries()),host:'127.0.0.1:5201',origin:'http://127.0.0.1:5201'},body:init?.body},response,{NODE_ENV:'development',OPENAI_API_KEY:'offline-only',GEMINI_API_KEY:'offline-only',GEMINI_MODEL:'gemini-3.5-flash-lite'},{fetchImpl:provider,providerAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED'});
  exchanges.push({request:JSON.parse(String(init?.body)),status,body});
  return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
 });
 render(<HelmetProvider><MemoryRouter><Page/></MemoryRouter></HelmetProvider>);
 const ready=()=>waitFor(()=>expect(document.querySelector('.animate-spin')).toBeNull(),{timeout:8000});
 const submit=async(text:string)=>{
  const before=current();await act(async()=>{fireEvent.change(screen.getByLabelText('Votre message'),{target:{value:text}})});
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Envoyer'}));await new Promise(r=>setTimeout(r,0))});await ready();
  const after=current();turns.push({text,before,after,visible:document.body.textContent});save(scenario,{turns,exchanges,witnesses,providerCalls:0});
  expect(after.entries.slice(before.entries.length).filter(e=>e.kind==='ERROR')).toEqual([]);
  expect(after.project).toEqual(before.project);
 };
 const confirm=async()=>{const review=screen.getAllByTestId('functional-contribution-review').at(-1)!;await act(async()=>{fireEvent.click(within(review).getByRole('button',{name:'Cela correspond à mon projet'}));await new Promise(r=>setTimeout(r,0))});await ready()};
 await submit(source(scenario,1));
 if(['S1','S2','S4','S5'].includes(scenario)){await confirm();expect(current().project?.revision).toBe(1)}
 if(['S1','S4'].includes(scenario))await submit(source(scenario,2));
 if(scenario==='S1')expect(within(screen.getAllByTestId('functional-contribution-review').at(-1)!).getByText(/Compréhension partielle/)).toBeVisible();
 if(scenario==='S4'){const text=screen.getAllByTestId('functional-contribution-review').at(-1)!.textContent!;expect(text).toMatch(/Exclusion \/ absence : AVC aigu/);expect(text).toMatch(/Exclusion \/ absence : Essai de traitement/)}
 if(scenario==='S2')expect(current().runtimeTurns.at(-1)!.content).not.toContain('association entre Comparer');
 if(scenario==='S5'){
  await submit(source('S5',2));
  if(current().pendingContribution&&screen.queryAllByRole('button',{name:'Cela correspond à mon projet'}).length)await confirm();
  for(let n=3;n<=8;n++)await submit(source('S5',n));
 }
 save(scenario,{turns,session:current(),exchanges,witnesses,providerCalls:0});
});
