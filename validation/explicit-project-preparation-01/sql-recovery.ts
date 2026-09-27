import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {qualificationAccess} from './qualification-access.mjs';
import {createPostgresProtocolDesignerDurableGuard, type DurablePublicRequestContext} from '../../server/protocol-designer-durable-guard';
const {url,project,identity}=await qualificationAccess();
const sql=postgres(url,{max:1,prepare:false});
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const sessionId=`qualification-explicit-${randomUUID()}`;
const turn=`turn:${randomUUID()}`,proof=`noxia-turn:${randomUUID()}`;
const clientRequestId=`working-draft:${turn}:checkpoint:ke1-1234567890abcdef`;
const headers={'x-forwarded-for':`qualification-${randomUUID()}`};
const body=(id:string)=>({observabilityContext:{sessionId,conversationId:sessionId,turnId:turn,clientRequestId:id}});
let guard=createPostgresProtocolDesignerDurableGuard(url,{maxConnections:1});
try {
 const dispatch=async(context:DurablePublicRequestContext,id:string,hold?:Promise<void>,started?:()=>void)=>{
  const fake:typeof fetch=async(input)=>{
   if(String(input).endsWith('/input_tokens'))return new Response(JSON.stringify({object:'response.input_tokens',input_tokens:120}));
   started?.();if(hold)await hold;
   return new Response(JSON.stringify({status:'completed',usage:{input_tokens:120,output_tokens:40,input_tokens_details:{cached_tokens:0}}}));
  };
  return guard.createBudgetedFetch(context,fake)('https://api.openai.com/v1/responses',{
   method:'POST',body:JSON.stringify({model:'gpt-5.6-luna',instructions:'Technical synthetic qualification',text:{},input:'SYNTHETIC_QUALIFICATION_ONLY',max_output_tokens:8000,store:false}),
   noxiaProviderObservation:{purpose:'CONVERSATION_REALIZATION',context:{sessionId,clientRequestId:id,turnId:turn},reasoningEffort:'medium',retryIndex:0},
  } as RequestInit);
 };
 const chat=await guard.prepareRequest({headers,body:body(`product-bridge:${turn}`)});
 assert.ok('admitted' in chat && chat.admitted);await dispatch(chat,`product-bridge:${turn}`);await guard.completeRequest(chat,200,{assistantTurn:{turnId:proof}});
 const wd=await guard.prepareRequest({headers,body:body(clientRequestId)});
 assert.ok('admitted' in wd && wd.admitted);
 const ref={headers,sessionId,sourceTurnRef:turn,sourceResponseRef:proof,clientRequestId};
 let release!:()=>void, started!:()=>void;
 const hold=new Promise<void>(r=>{release=r;}), dispatched=new Promise<void>(r=>{started=r;});
 const pending=dispatch(wd,clientRequestId,hold,started);await dispatched;
 assert.equal((await guard.readWorkingDraftPreparation(ref)).state,'IN_PROGRESS');release();await pending;
 const result={apiVersion:'1.0.0',workingDraftUpdate:{requestType:'INSUFFICIENT',proposal:null},workingStudyProposal:null};
 await guard.completeRequest(wd,200,result);await guard.close();
 guard=createPostgresProtocolDesignerDurableGuard(url,{maxConnections:1});
 const snapshot=async()=>JSON.stringify(await sql`select row_to_json(s) as row from noxia_durable.public_guard_session s where session_key_hash=${hash(sessionId)}`)
  +JSON.stringify(await sql`select row_to_json(a) as row from noxia_durable.public_bridge_admission a where session_key_hash=${hash(sessionId)} order by admission_key`)
  +JSON.stringify(await sql`select row_to_json(o) as row from noxia_durable.public_provider_operation o where session_key_hash=${hash(sessionId)} order by operation_key`);
 const before=await snapshot();
 for(let i=0;i<3;i++)assert.deepEqual(await guard.readWorkingDraftPreparation(ref),{state:'COMPLETED',response:result});
 for(const patch of [{sessionId:'other'},{sourceResponseRef:`noxia-turn:${randomUUID()}`},{sourceTurnRef:`turn:${randomUUID()}`},
  {clientRequestId:`product-bridge:${turn}`},{clientRequestId:`working-draft:${turn}:checkpoint:ke1-0000000000000000`},{headers:{'x-forwarded-for':'other'}}])
   assert.equal((await guard.readWorkingDraftPreparation({...ref,...patch})).state,'REJECTED');
 assert.equal(await snapshot(),before);
 console.log(JSON.stringify({QUALIFICATION_PROJECT:project,QUALIFICATION_HOST:identity.qualification.host,
  PREFLIGHT:'PASS',SQL_RECOVERY:'PASS',SQL_RESTART:'PASS',SQL_ISOLATION:'PASS',READ_HAS_NO_WRITES:'PASS',PROVIDER_CALLS:0,
  PRODUCTION_CONNECTIONS:0,TRUNCATE:0,SYNTHETIC_SESSION:sessionId}));
}finally{await guard.close();await sql.end({timeout:5});}
