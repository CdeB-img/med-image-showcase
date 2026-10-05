import { writeFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import ProtocolDesignerWorkspace from '../ProtocolDesignerWorkspace';
import { createFunctionalResetSession, type FunctionalResetSession } from '../session';
import { buildPersistentSourceCatalog, type ProductBridgeRequest, type ProductBridgeResponse } from '../../product-bridge';
import { executeProtocolDesignerBridge } from '../../../../../api/protocol-designer-bridge';
import { CASES, wire } from '../../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures';
const bridge=vi.hoisted(()=>vi.fn());
vi.mock('../../product-bridge-client',async original=>({...await original<object>(),requestProtocolDesignerBridge:bridge}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();bridge.mockReset();localStorage.clear();});
it('actual Standard native context preserves the infarction/imaging source and current tissue-damage focus without adoption',async()=>{
 const network=vi.fn(()=>{throw Error('LIVE_FORBIDDEN')});vi.stubGlobal('fetch',network);
 const requests:ProductBridgeRequest[]=[];
 const packets:ReturnType<typeof JSON.parse>[]=[];
 bridge.mockImplementation(async(r:ProductBridgeRequest):Promise<ProductBridgeResponse>=>{
  requests.push(r);
  const last=r.conversation.turns.at(-1)!;
  const fakeFetch=vi.fn(async(url:RequestInfo|URL,init?:RequestInit)=>{
   const payload=JSON.parse(String(init!.body));
   if(String(url)==='https://api.openai.com/v1/responses'){
    const args=wire(last.content,last.content===CASES[0].text?CASES[0].explicit:[['OBJECTIVE','dommages tissulaires précoces']]);
    const catalog=buildPersistentSourceCatalog(r.conversation);
    const changes=args.changes.map(c=>{const {sourceText,...rest}=c;return {...rest,sourceAnchorId:catalog.anchors.find(a=>a.exactText===sourceText)!.anchorId};});
    return new Response(JSON.stringify({id:'offline:openai',model:'gpt-5.6-terra',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({...args,changes})}]}]}));
   }
   if(String(url).startsWith('https://generativelanguage.googleapis.com/')){
    const packet=JSON.parse(payload.contents[0].parts[0].text);
    packets.push(packet);
    const text=last.content===CASES[0].text
      ? 'LOCAL_SYNTHETIC — La fonction myocardique et l’âge et sexe restent des dimensions à discuter. Quelle finalité retenez-vous ?'
      : 'LOCAL_SYNTHETIC — Par rapport à quel événement souhaitez-vous situer l’observation précoce ?';
    return new Response(JSON.stringify({responseId:'offline:gemini',candidates:[{content:{parts:[{text}]}}]}));
   }
   throw Error('UNEXPECTED_ENDPOINT');
  });
  const reply=await executeProtocolDesignerBridge({body:{...r,apiVersion:'1.0.0'},apiKey:'LOCAL_SYNTHETIC',openAiApiKey:'LOCAL_SYNTHETIC',fetchImpl:fakeFetch,providerAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED'});
  expect(reply.status).toBe(200);return reply.body as ProductBridgeResponse;
 });
 let latest:FunctionalResetSession;
 const base=createFunctionalResetSession();const initial={...base,conversationLanguageGateway:{...base.conversationLanguageGateway,conversationLanguage:'fr' as const}};
 render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={initial} onSessionChange={s=>{latest=s;}} /></HelmetProvider>);
 const submit=(text:string)=>{fireEvent.change(screen.getByRole('textbox'),{target:{value:text}});fireEvent.click(screen.getByRole('button',{name:'Envoyer'}));};
 const responses=()=>latest?.entries.flatMap(e=>e.kind==='TEXT'&&e.role==='NOXIA'&&!initial.entries.some(old=>old.entryId===e.entryId)?[e.content]:[])??[];
 submit(CASES[0].text);
 await waitFor(()=>expect(responses().some(s=>s.includes('fonction myocardique'))).toBe(true),{timeout:10000});
 expect(packets[0].currentMessage).toMatchObject({text:CASES[0].text,provenance:'USER_STATED'});
 expect(packets[0].domainContext.imaging.status).toBe('PROPOSALS_NOT_ADOPTED');
 // CURRENT_SEMANTIC_INVARIANT: preserve the real scientific source, not a
 // frozen model-generated list of inferred dimensions (tested in the owner suite).
 expect(packets[0].explicitConstraints.statements).toContainEqual(expect.objectContaining({content:CASES[0].text}));
 expect(latest!.project).toBeNull();expect(latest!.pendingContribution!.scientificContent.candidateObjects).toHaveLength(2);
 const first=responses().at(-1)!;expect((first.match(/\?/g)??[])).toHaveLength(1);expect(first).toContain('âge et sexe');
 submit('je veux surtout voir les dommages tissulaires précoces');
 await waitFor(()=>expect(responses().some(s=>s.includes('Par rapport à quel événement')),
  JSON.stringify({requests:requests.map(r=>({raw:r.conversation.turns.at(-1)?.content,evaluate:r.evaluatePersistentDelta,nav:r.preProjectNavigation})),responses:responses()})).toBe(true),{timeout:10000});
 expect(latest!.project).toBeNull();expect(network).not.toHaveBeenCalled();expect(bridge).toHaveBeenCalledTimes(2);
 expect(packets[1].currentMessage.text).toBe('je veux surtout voir les dommages tissulaires précoces');
 writeFileSync('validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/standard-handler-offline.json',JSON.stringify({provenance:'ACTUAL_STANDARD_HANDLER_CURRENT_BRIDGE_LOCAL_SYNTHETIC_PROVIDER_FETCH',inputs:[CASES[0].text,'je veux surtout voir les dommages tissulaires précoces'],responses:responses(),project:latest!.project,networkCalls:0,bridgeCalls:2},null,2)+'\n');
},25000);
