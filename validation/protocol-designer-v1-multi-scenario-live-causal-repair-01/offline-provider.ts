// Mission-only provider boundary. Recorded science is preserved; identity rebinding
// is explicit and distinct from the separate byte-exact seven-response replay.
import {recorded,live} from './recorded-exchanges';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildPersistentSourceCatalog} from '../../src/features/protocol-designer/product-bridge';
import {adversarialExtractionContext,adversarialDeltaResponse} from '../protocol-designer-v1-autonomous-adversarial-stabilization-01/provider-transport';
import {createLongHorizonProviderReplay,replayJsonResponse,type ProviderCallWitness} from '../../src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-provider-replay';
import {logicalDigest} from '../../src/features/knowledge-engine/canonical';
export const language=JSON.parse(readFileSync(resolve(live,'natural-language-trajectories.json'),'utf8')).turns as {scenario:string;turn:number;text:string}[];
export const source=(scenario:string,turn:number)=>language.find(t=>t.scenario===scenario&&t.turn===turn)!.text;
const empty={changes:[],relations:[],temporalQualifications:[],expectedVariableOccasions:[]};
const spec=(key:string,type:string,content:string)=>({operation:'ADD' as const,key,type,content,epistemicState:'KNOWN' as const});
const synthetic:Record<string,ReturnType<typeof spec>[]>={
 'S3:1':[
  spec('cec:objective','OBJECTIVE','Explorer les lésions cardiaques dans une population de patients après circulation extracorporelle'),
  spec('cec:phenotype','MEASURED_VARIABLE','Lésions diffuses ou focales au rehaussement tardif'),
  spec('cec:inflammation','MEASURED_VARIABLE','Inflammation ou espace extracellulaire augmenté (T1 pré/post ECV)'),
  spec('cec:observation','PROJECT_INFORMATION','Observation rapportée : augmentation de la troponine lors de la circulation extracorporelle'),
 ],
 'S5:1':[
  spec('nx:objective','OBJECTIVE','Démontrer un effet direct dans le cerveau par liaison au récepteur neuronal R-NX'),
  spec('nx:drug','INTERVENTION','NX-PERIPH-01 injecté par voie IV'),
  spec('nx:exposure','CONSTRAINT','Dans ce scénario fictif, exposition cérébrale libre négligeable, très inférieure à celle nécessaire pour occuper le récepteur neuronal'),
  spec('nx:delivery','CONSTRAINT','BHE intacte, absence de métabolite actif central et de transporteur ou formulation amenant la molécule au cerveau'),
 ],
 'S5:2':[
  spec('nx:constraints-confirmed','CONSTRAINT',"Pas d’ouverture de BHE, pas de voie intrathécale, pas de formulation ciblant le cerveau et pas de métabolite central actif"),
  spec('nx:peripheral','PROJECT_INFORMATION','Action périphérique mesurable dans le scénario fictif'),
 ],
};
export const createRepairOfflineProvider=(witnesses:ProviderCallWitness[])=>{
 const how=createLongHorizonProviderReplay(witnesses,{how:'SUCCESS'});
 const counts=new Map<string,number>();
 return (async(resource:string|URL|Request,init?:RequestInit)=>{
  const endpoint=String(resource);if(endpoint.startsWith('https://generativelanguage.googleapis.com/'))return how(resource,init);
  if(endpoint!=='https://api.openai.com/v1/responses'||typeof init?.body!=='string')throw new Error('OFFLINE_UNEXPECTED_TRANSPORT');
  const body=JSON.parse(init.body);const context=adversarialExtractionContext(body);
  const turn=language.find(t=>t.text===context.sourceText);if(!turn)throw new Error('OFFLINE_SOURCE_NOT_FROZEN');
  const key=`${turn.scenario}:${turn.turn}`;counts.set(key,(counts.get(key)??0)+1);
  // No repair or retry transport is provided. Distinct browser sessions have a new instance.
  if(counts.get(key)!==1)throw new Error('OFFLINE_SINGLE_ATTEMPT_EXCEEDED');
  const call=({'S1:1':1,'S1:2':2,'S2:1':4,'S4:1':5,'S4:2':6} as Record<string,number>)[key];
  let output:unknown;
  let provenance='SYNTHETIC_CONTRACT_FIXTURE';
  if(call){
   const saved=recorded(call);const wire=JSON.parse(saved.text);
   const catalog=buildPersistentSourceCatalog({conversationId:'offline',language:'fr',turns:[{turnId:context.sourceTurnRef,role:'USER',content:context.sourceText}]});
   const historicalCatalog=JSON.parse(saved.request.input.split("CATALOGUE D'ANCRAGES DU DERNIER MESSAGE UTILISATEUR (sélectionne uniquement un anchorId exact ; FULL_TURN est toujours valide) :\n")[1].split('\n\nCONTRAT MACHINE')[0]);
   const historicalProject=JSON.parse(saved.request.input.split('RESEARCH PROJECT ADOPTÉ (lecture seule) :\n')[1]);
   const rebind=(value:unknown):unknown=>{
    if(Array.isArray(value))return value.map(rebind);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rebind(v)]));
    if(typeof value!=='string')return value;
    const anchor=historicalCatalog.anchors.find((a:{anchorId:string})=>a.anchorId===value);
    if(anchor){const target=catalog.anchors.find(a=>a.exactText===anchor.exactText&&a.fragmentKind===anchor.fragmentKind);if(!target)throw new Error('SOURCE_REBIND_NOT_EXACT');return target.anchorId;}
    const old=historicalProject?.objects.find((o:{stableId:string})=>o.stableId===value);
    if(old){const targets=context.currentProject?.objects.filter(o=>o.type===old.type&&o.content===old.content)??[];if(targets.length!==1)throw new Error('PROJECT_REBIND_NOT_UNIQUE');return targets[0].stableId;}
    return value;
   };
   output=rebind(wire);provenance='RECORDED_SCIENCE_IDENTITY_REBOUND_NOT_BYTE_EXACT';
  }else output=synthetic[key]?adversarialDeltaResponse(context,{id:key,semanticDelta:synthetic[key]}):empty;
  const response={id:`offline:${key}`,model:body.model,status:'completed',output_text:JSON.stringify(output),usage:{input_tokens:0,output_tokens:0,total_tokens:0}};
  witnesses.push({endpoint,requestDigest:logicalDigest({endpoint,body}),requestBody:body,responseBody:response,responseStatus:200,turnText:context.sourceText,provenance:provenance as ProviderCallWitness['provenance']});
  return replayJsonResponse(response);
 }) as typeof fetch;
};
