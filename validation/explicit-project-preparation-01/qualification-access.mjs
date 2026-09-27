/** Existing Development integration credential, memory only; never env pull/export. */
import {spawnSync} from 'node:child_process';
import postgres from 'postgres';
import {assertQualificationIdentity} from '../durable-qualification-store-preflight.mjs';
export async function qualificationAccess() {
 const cli=process.env.NOXIA_VERCEL_CLI || '/Users/charles/.npm/_npx/67eb4586ca667318/node_modules/.bin/vercel';
 const read=(id,key)=>{
  const r=spawnSync(cli,['api',`/v1/projects/med-image-showcase/env/${id}?decrypt=true`,'--scope','cdeb-imgs-projects','--raw'],{encoding:'utf8',stdio:'pipe',timeout:45000});
  if(r.status!==0)throw Error('QUALIFICATION_CREDENTIAL_UNAVAILABLE');
  const d=JSON.parse(r.stdout);
  if(d.key!==key || d.target.length!==1 || d.target[0]!=='development' || !d.value)throw Error('QUALIFICATION_CREDENTIAL_SCOPE_INVALID');
  return d.value;
 };
 const url=read('8q1Un5SBjMSO9MOF','NOXIA_DURABLE_QUALIFICATION_DATABASE_URL');
 const project=read('TIAuYXimYagG7yC2','NOXIA_DURABLE_QUALIFICATION_NEON_PROJECT_ID');
 const identity=assertQualificationIdentity({NOXIA_DURABLE_DATABASE_ROLE:'qualification/test',NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID:project,NOXIA_DURABLE_DATABASE_DATABASE_URL:url},
  {NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID:'aged-art-41980988',NOXIA_DURABLE_DATABASE_DATABASE_URL:'postgres://ep-nameless-dew-b13ga6ek-pooler.c-5.eu-central-1.aws.neon.tech/neondb'});
 const sql=postgres(url,{max:1,prepare:false,connect_timeout:15});
 try {
  const result=await sql.begin(async tx=>{
   await tx.unsafe('SET TRANSACTION READ ONLY');
   return (await tx`select current_database() as db, current_setting('transaction_read_only') as ro, to_regclass('noxia_durable.public_bridge_admission')::text as admissions`)[0];
  });
  if(result.db!==identity.qualification.database || result.ro!=='on' || !result.admissions)throw Error('QUALIFICATION_READ_ONLY_PREFLIGHT_FAILED');
 }finally{await sql.end({timeout:5});}
 return {url,project,identity};
}
