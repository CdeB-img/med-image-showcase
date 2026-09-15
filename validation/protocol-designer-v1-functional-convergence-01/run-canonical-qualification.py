from pathlib import Path
import subprocess,os,json,datetime,hashlib,time
root=Path(__file__).resolve().parent
out=root/'qualification'
phase=os.environ.get('NOXIA_QUALIFICATION_PHASE','first')
assert phase.replace('-','').isalnum()
assert not (out/f'full-suite-{phase}.json').exists(), 'DO_NOT_OVERWRITE_QUALIFICATION'
files=subprocess.check_output(['git','ls-files','-z','--','src'],text=True).split('\0')
files=sorted(set([f for f in files if f.endswith(('.test.ts','.test.tsx','.test.mjs','.spec.ts','.spec.tsx','.spec.mjs'))]+['src/features/query-navigation/__tests__/functional-human-decision-binding.test.ts','src/features/query-navigation/__tests__/functional-scientific-service-scope.test.ts']))
repo=Path.cwd()
source=subprocess.check_output(['git','diff','--','src','api'],text=True)
(out/f'source-freeze-{phase}.json').write_text(json.dumps({'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'trackedDiffSha256':hashlib.sha256(source.encode()).hexdigest(),'testFiles':files,'extraTestHashes':{f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in files if f.endswith(('functional-human-decision-binding.test.ts','functional-scientific-service-scope.test.ts'))}},indent=2)+'\n')
guard=str(repo/'validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-guard.cjs')
env={**os.environ,'NODE_OPTIONS':'--require '+guard}
started=time.time()
with (out/f'full-suite-{phase}.log').open('w') as log:
 r=subprocess.run(['node','node_modules/vitest/vitest.mjs','run',*files,'--reporter=json','--outputFile='+str(out/f'full-suite-{phase}.json')],env=env,stdout=log,stderr=subprocess.STDOUT)
x=json.loads((out/f'full-suite-{phase}.json').read_text()) if (out/f'full-suite-{phase}.json').exists() else {}
receipt={'exitCode':r.returncode,'seconds':round(time.time()-started,2),'testFiles':len(files),'passed':x.get('numPassedTests'),'failed':x.get('numFailedTests'),'pending':x.get('numPendingTests'),'todo':x.get('numTodoTests'),'success':x.get('success'),'sourceUnchanged':source==subprocess.check_output(['git','diff','--','src','api'],text=True),'providerCalls':0}
(out/f'full-suite-{phase}-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n'); print(json.dumps(receipt))
