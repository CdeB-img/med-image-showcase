/** Separate localhost replay server using the product handler, existing record/replay and qualification SQL. */
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {qualificationAccess} from './qualification-access.mjs';
import {handleProtocolDesignerBridge} from '../../api/protocol-designer-bridge';
import {createPostgresProtocolDesignerDurableGuard} from '../../server/protocol-designer-durable-guard';
import {createPostgresProjectSnapshotStore} from '../../server/protocol-designer-project-snapshot';
import {createRecordedProtocolDesignerFetch,createProtocolDesignerReplayFetch,readProtocolDesignerReplayRefs} from '../../server/protocol-designer-provider-replay';
import {controlledStudyProposal,DOMAINS} from '../../src/features/protocol-designer/functional-reset/__tests__/study-proposal-fixtures';
process.umask(0o077);
globalThis.fetch=async()=>{throw Error('LIVE_NETWORK_FORBIDDEN');};
const {url}=await qualificationAccess();
let guard=createPostgresProtocolDesignerDurableGuard(url,{maxConnections:3});
const snapshotStore=createPostgresProjectSnapshotStore(url);
const root=resolve('validation/explicit-project-preparation-01/browser-replay-evidence');await mkdir(root,{recursive:true});
let release=()=>{};let hold:Promise<void>|null=null;let outcome='VALID';
const stats={chat:0,wd:0,count:0,read:0,done:0,doc:0};
const synthetic:typeof fetch=async(input,init)=>{
 const endpoint=String(input),p=JSON.parse(String(init?.body));
 if(endpoint.endsWith('/input_tokens')){stats.count++;return new Response(JSON.stringify({object:'response.input_tokens',input_tokens:120}));}
 const isWd=p.instructions?.includes('Tu prépares en arrière-plan');
 if(isWd){stats.wd++;if(hold)await hold;}
 else stats.chat++;
 if(isWd&&outcome==='TIMEOUT'){const e=new Error('SYNTHETIC_TIMEOUT');e.name='AbortError';throw e;}
 let text='LOCAL_SYNTHETIC — structure scientifique proposée pour la qualification hors ligne.';
 if(isWd){
  const context=JSON.parse(p.input);const proposal=controlledStudyProposal(context.contextDigest,DOMAINS[0]);
  if(outcome==='CYCLE'){proposal.atoms[0].dependsOn=[proposal.atoms[1].ref];proposal.atoms[1].dependsOn=[proposal.atoms[0].ref];}
  text=JSON.stringify({requestType:outcome==='NO_CHANGE'?'INSUFFICIENT':'STUDY_UPDATE',proposal:outcome==='NO_CHANGE'?null:proposal,explicitDecisions:[],inferredAtomRefs:[],rejectedAtomRefs:[]});
 }
 return new Response(JSON.stringify({id:`synthetic-${randomUUID()}`,model:p.model,status:isWd&&outcome==='TRUNCATED'?'incomplete':'completed',
  ...(isWd&&outcome==='TRUNCATED'?{incomplete_details:{reason:'max_output_tokens'}}:{}),
  output:[{content:[{type:'output_text',text}]}],usage:{input_tokens:120,output_tokens:40,total_tokens:160,input_tokens_details:{cached_tokens:0}}}));
};
const replay:typeof fetch=async(input,init)=>{
 const dir=resolve(root,randomUUID());
 const record=createRecordedProtocolDesignerFetch({root:dir,fetchImpl:synthetic,secrets:['synthetic-local-token-qualification']});
 try{await (await record(input,init)).text();}catch{/* Transport outcome is replayed from its recorded evidence. */}
 const refs=await readProtocolDesignerReplayRefs(dir);
 const read=createProtocolDesignerReplayFetch({root:dir,refs,secrets:['synthetic-local-token-qualification']});
 return read(input,init);
};
const environment={VERCEL_ENV:'preview',NODE_ENV:'production',OPENAI_API_KEY:'synthetic-local-token-qualification',
 VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME:'TERRA',VITE_AUTONOMOUS_PROJECT_BUILD:'ON'};
const server=createServer(async(req,res)=>{
 try{
  const chunks=[];for await(const c of req)chunks.push(c);const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
  if(req.url==='/__control'){
   if(body.action==='prepare'){outcome=body.outcome??'VALID';hold=new Promise<void>(r=>{release=r;});}
   if(body.action==='release'){release();hold=null;}
   if(body.action==='restart'){await guard.close();guard=createPostgresProtocolDesignerDurableGuard(url,{maxConnections:3});}
   res.setHeader('content-type','application/json');res.end(JSON.stringify(stats));return;
  }
  if(req.url!=='/api/protocol-designer-bridge'){res.statusCode=404;res.end();return;}
  if(body.operation==='READ_WORKING_DRAFT_PREPARATION')stats.read++;
  if(body.documentDraftRequest){stats.doc++;throw Error('DOCUMENT_CALL_FORBIDDEN');}
  await handleProtocolDesignerBridge({method:req.method,headers:req.headers,body,socket:req.socket},{
   setHeader:(name,value)=>{if(!res.headersSent)res.setHeader(name,value);},status(code){res.statusCode=code;return this;},json(value){res.end(JSON.stringify(value));}
  },environment,{durableGuard:guard,projectSnapshotStore:snapshotStore,fetchImpl:replay,providerAttemptPolicy:'SINGLE_ATTEMPT_FAIL_CLOSED'});
  if(body.prepareWorkingDraft)stats.done++;
 }catch(e){console.error('REPLAY_SERVER_FAILURE',e instanceof Error?e.message:'UNKNOWN');res.statusCode=500;res.end(JSON.stringify({error:{code:'REPLAY_SERVER_FAILURE'}}));}
});
server.listen(4187,'127.0.0.1',()=>console.log('REPLAY_SQL_SERVER_READY'));
process.on('SIGTERM',()=>{server.close();void guard.close().finally(()=>process.exit(0));});
