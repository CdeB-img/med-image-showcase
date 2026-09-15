from pathlib import Path
import json,hashlib,collections,datetime,subprocess
ROOT=Path(__file__).resolve().parent
OLD=ROOT.parent/'protocol-designer-v1-functional-convergence-01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
save=lambda n,x:(ROOT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
turns={};files={};sessions={};results=[]
for p in sorted((ROOT/'post_audit').glob('*/*/turns.jsonl')):
 rows=list(map(json.loads,p.read_text().splitlines()));results.append(json.loads(p.with_name('result.json').read_text()))
 sessions[rows[0]['scenario']]=json.loads(p.with_name('session.json').read_text())
 for r in rows:
  assert r['turn'] not in turns
  turns[r['turn']]=r;files[r['turn']]=p
assert len(turns)==225 and len(results)==15
assert all(r['harnessCompleted'] and r['sourceState']['stableThroughConversation'] and not r['fatal'] for r in results)
prior=json.loads((OLD/'scientific-request-review-closure.json').read_text());review=[]
for old in prior['rows']:
 k=old['REQUEST_ID'];r=turns[k]
 assert r['reply']==old['ACTUAL_REPLY'] and r['input']==old['USER_REQUEST'],k
 assert r['projectBefore']==r['projectAfter'],k
 review.append({**old,'PROJECT_CONTEXT':{k:r['projectBefore'].get(k) for k in ['projectId','versionId','projectDigest','revision']},'evidence':str(files[k].relative_to(ROOT))+'#'+k,'sha256':sha(files[k]),'ACTUAL_EXECUTION_EVIDENCE':r['latestTrace'],'reviewTransfer':'EXACT_REPLY_EQUALITY_AND_CURRENT_PROJECT_NO_WRITE_VERIFIED'})
save('scientific-request-review.json',{'total':83,'method':'Prior individual judgments transferred only after exact equality of every reply; fresh Project identity and no-write checks. No improved scientific competence inferred.','priorReviewSha256':sha(OLD/'scientific-request-review-closure.json'),'counts':dict(collections.Counter(r['VERDICT'] for r in review)),'rows':review})
cases=[]
for old in json.loads((OLD/'c02-closure-requalification.json').read_text())['cases']:
 k=old['requestId'];r=turns[k];session=sessions[r['scenario']]
 user=[t for t in session['runtimeTurns'] if t['role']=='USER' and t['content']==r['input']];assert len(user)==1
 decisions=[c for c in session['retainedContributionCandidates'] if c.get('humanDecision') and user[0]['turnId'] in c['humanDecision']['provenance']]
 changed=r['projectBefore']!=r['projectAfterInput'];act=old['userAct']
 if act=='CONFIRM':assert len(decisions)==1 and decisions[0]['humanDecision']['status']=='ADOPTED' and changed,k
 elif act=='REFUSE' and decisions:assert len(decisions)==1 and decisions[0]['humanDecision']['status']=='REJECTED' and not changed,k
 else:assert not changed and not decisions and ('précis' in r['reply'] or 'clarif' in r['reply']) and k!='B02-T07',k
 verdict='PASS_DECISION_RECORDED' if decisions else 'PASS_CLARIFICATION_REQUIRED';assert verdict==old['verdict']
 cases.append({'requestId':k,'userAct':act,'verdict':verdict,'userTurnRef':user[0]['turnId'],'decision':decisions[0]['humanDecision'] if decisions else None,'projectBefore':r['projectBefore']['projectDigest'] if r['projectBefore'] else None,'projectAfterInput':r['projectAfterInput']['projectDigest'] if r['projectAfterInput'] else None,'evidence':str(files[k].relative_to(ROOT))+'#'+k})
save('c02-requalification.json',{'counts':{a:dict(collections.Counter(c['verdict'] for c in cases if c['userAct']==a)) for a in ['CONFIRM','REFUSE','SELECT_OLD_PROPOSAL']},'wrongAdoption':0,'cases':cases})
byrequest={r['REQUEST_ID']:r for r in review};bycase={r['requestId']:r for r in cases};adjudicated=[]
for result in results:
 for a in result['anomalies']:
  k=a['TURN'];prop=a['PROPERTY']
  if prop in ['SCIENTIFIC_PROJECT_ANCHORING','SCIENTIFIC_CANDIDATE_STATUS']:
   verdict=byrequest[k]['VERDICT'];assert verdict.startswith('PASS_');reason=byrequest[k]['RATIONALE']
  elif prop=='REFUSAL_LIFECYCLE':
   verdict=bycase[k]['verdict'];assert verdict=='PASS_CLARIFICATION_REQUIRED';reason='No resolved option to refuse; explicit clarification without Project write.'
  else:raise AssertionError(a)
  adjudicated.append({'raw':a,'verdict':verdict,'reason':reason})
counts=collections.Counter(c['status'] for r in results for t in r['checks'] for c in t['checks']);assert counts.get('FAIL',0)==len(adjudicated)
save('mass-requalification.json',{'conversations':15,'turns':225,'projectIntegrity':'PASS','adversarialReplay':'PARTIAL','v1FunctionalConvergence':'PASS_WITH_BOUNDED_ABSTENTIONS','rawCheckCounts':dict(counts),'rawAnomaliesRetained':len(adjudicated),'unresolvedGenericCases':['C01-T06','C03-T10'],'adjudication':adjudicated,'providerCalls':0})
# Browser sessions are read from the actual explicit receipt control, not from jsdom.
receipts=[json.loads(l) for l in (ROOT/'browser-post-audit/browser-receipts.jsonl').read_text().splitlines()];assert len(receipts)==5
browser=[]
for receipt in receipts:
 scenario=receipt['active']['scenarioId'];stored=list(receipt['body']['storage'].values());assert len(stored)==1
 session=json.loads(stored[0]);visible=receipt['body']['visible'];messages=[t['content'] for t in session['runtimeTurns'] if t['role']=='USER']
 assert not [e for e in session['entries'] if e['kind']=='ERROR'],scenario
 if scenario=='S1':assert 'Interprétation complète du passage à vérifier : « Je pensais à des adultes avec une myocardite aiguë récente.' in visible and session['project']['revision']==1
 if scenario=='S2':assert 'association entre Comparer' not in visible and session['project']['revision']==1
 if scenario=='S3':assert 'Voici la structure essentielle à confirmer.' in visible and session['project'] is None
 if scenario=='S4':assert '+ Exclusion / absence : AVC aigu' in visible and '+ Exclusion / absence : Essai de traitement' in visible and session['project']['revision']==1
 if scenario=='S5':
  assert len(messages)==8 and session['project']['revision']==2
  assert len(session['knowledgeOwnerLedger']['entries'])>0
  assert not session['documents']['projections']
  assert 'hypothèse supplémentaire défendable' in visible and 'appui documentaire applicable' in visible
 browser.append({'scenario':scenario,'status':'PASS_RECORDED_DEFECT','scientificNegativeControl':'PARTIAL' if scenario=='S5' else 'NOT_APPLICABLE','sessionId':session['sessionId'],'projectVersion':session['project']['versionId'] if session['project'] else None,'userTurns':len(messages),'visibleSha256':hashlib.sha256(visible.encode()).hexdigest(),'sessionSha256':hashlib.sha256(stored[0].encode()).hexdigest(),'providerCalls':0})
assert {b['scenario'] for b in browser}=={'S1','S2','S3','S4','S5'}
save('browser-qualification.json',{'level':'REAL_IAB_BROWSER_REAL_STANDARD_REAL_HANDLER_OFFLINE_PROVIDER_SUBSTITUTION','paths':browser,'rawReceiptSha256':sha(ROOT/'browser-post-audit/browser-receipts.jsonl'),'scope':'S1/S2/S4 retain recorded scientific deltas with explicit identity-only rebinding; S3/S5 use declared synthetic extraction, HOW uses the existing qualified synthetic adapter. Separate strict replay uses all seven original responses without rebinding.','initialCollectorIssue':'First collector accepted only 500 KB: S1/S2/S5 receipt writes were rejected although the button claimed success. Mission collector repaired to check HTTP success with 20 MB receipt-only limit; complete final receipts re-acquired. No product transport limit altered.'})
print(json.dumps({'scientific':collections.Counter(r['VERDICT'] for r in review),'turns':225,'rawAnomalies':len(adjudicated),'browserPaths':len(browser)}))
