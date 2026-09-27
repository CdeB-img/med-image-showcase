import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.NOXIA_PLAYWRIGHT_MODULE || '/Users/charles/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(pathToFileURL(modulePath));
const browser=await chromium.launch({headless:true,executablePath:process.env.NOXIA_CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const control=async(body={})=>(await fetch('http://127.0.0.1:4187/__control',{method:'POST',body:JSON.stringify(body)})).json();
const wait=async(check)=>{for(let i=0;i<150;i++){if(await check())return;await new Promise(r=>setTimeout(r,200));}throw Error('CONDITION_TIMEOUT');};
const state=page=>page.evaluate(async()=>{
 const {decodeSessionStorage}=await import('/src/features/protocol-designer/functional-reset/session-storage-codec.ts');
 const {FUNCTIONAL_RESET_STORAGE_KEY}=await import('/src/features/protocol-designer/functional-reset/session.ts');
 return decodeSessionStorage(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY));
});
const reports=[];
const initialStats=await control();
try{
 for(const outcome of ['VALID','CYCLE','NO_CHANGE','TRUNCATED','TIMEOUT']){
  const context=await browser.newContext({extraHTTPHeaders:{'x-forwarded-for':`synthetic-browser-${randomUUID()}`}});
  await context.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER_ERROR',e.message);});
  page.on('response',async r=>{if(r.url().includes('/api/')&&!r.ok())console.log('API_REJECTION',r.status(),await r.text());});
  await page.goto('http://127.0.0.1:4188/protocol-designer/demo');
  await page.getByRole('textbox',{name:'Votre message'}).fill('SYNTHETIC : Étudier le lien entre âge et ECV myocardique chez des volontaires sains, avec IRM cardiaque.');
  const before=await control({action:'prepare',outcome});
  await page.getByRole('button',{name:'Envoyer',exact:true}).click();
  await page.getByText('LOCAL_SYNTHETIC — structure scientifique proposée pour la qualification hors ligne.',{exact:true}).waitFor();
  await wait(async()=>(await state(page)).runtimeTurns.filter(t=>t.role==='NOXIA').length===1);
  assert.equal((await control()).wd,before.wd,'Chat must not trigger WD');
  const button=page.getByRole('button',{name:'Préparer la mise à jour du projet',exact:true});
  await button.click();await button.click();await wait(async()=>(await control()).wd===before.wd+1);
  const captured=(await state(page)).workingDraftPreparations.at(-1).checkpoint;
  // Real document navigation/reload while the separate server continues.
  await page.reload({waitUntil:'domcontentloaded'});
  await wait(async()=>(await control()).read>before.read);
  assert.equal((await state(page)).workingDraftPreparations.at(-1).checkpoint.preparationId,captured.preparationId);
  await page.goto('about:blank');
  await control({action:'release'});
  await wait(async()=>(await control()).done===before.done+1);
  await control({action:'restart'});
  await page.goto('http://127.0.0.1:4188/protocol-designer/demo');
  const expected=outcome==='VALID'?'READY_FOR_REVIEW':outcome==='NO_CHANGE'?'NO_CHANGE':outcome==='TIMEOUT'?'UNKNOWN/INTERRUPTED':'FAILED';
  await wait(async()=>(await state(page))?.workingDraftPreparations?.at(-1)?.status===expected);
  for(let i=0;i<2;i++)await page.reload({waitUntil:'networkidle'});
  const saved=await state(page);assert.equal(saved.workingDraftPreparations.at(-1).status,expected);
  assert.deepEqual(saved.workingDraftPreparations.at(-1).checkpoint,captured);
  assert.equal(saved.project,null);assert.equal(saved.drciDraftPacks?.length??0,0);
  const invitations=saved.entries.filter(e=>e.reviewInvitation);
  assert.equal(invitations.length,outcome==='VALID'?1:0);
  assert.equal((await control()).wd,before.wd+1,'reload must never redispatch');
  assert.equal((await control()).doc,0);
  if(outcome==='VALID'){
   await page.getByRole('button',{name:'Valider ces choix',exact:true}).click();
   await wait(async()=>(await state(page)).project?.revision===1);
   await page.reload({waitUntil:'networkidle'});
   const adopted=await state(page);assert.equal(adopted.project.revision,1);
   assert.equal(adopted.workingDraftPreparations.at(-1).decision,'ADOPTED');
   assert.equal((await control()).wd,before.wd+1);
  }
  assert.deepEqual(errors,[]);
  reports.push({outcome,terminal:expected,checkpointIdentical:true,hardReloads:outcome==='VALID'?4:3,navigationReentries:1,logicalReviews:invitations.length,providerRedispatch:0,pageErrors:0,sqlRestart:true});
  await writeFile('validation/explicit-project-preparation-01/browser-results.json',JSON.stringify({reports,partial:true,LIVE_PROVIDER_CALLS:0},null,2));
  await context.close();
 }
 await writeFile('validation/explicit-project-preparation-01/browser-results.json',JSON.stringify({reports,stats:Object.fromEntries(Object.entries(await control()).map(([key,value])=>[key,value-initialStats[key]])),LIVE_PROVIDER_CALLS:0},null,2));
 console.log(JSON.stringify({BROWSER_HARD_RELOAD:'PASS',scenarios:reports.length,LIVE_PROVIDER_CALLS:0}));
}finally{await browser.close();}
