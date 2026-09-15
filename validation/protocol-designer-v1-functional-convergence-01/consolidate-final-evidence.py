"""Verify and summarize preserved qualification receipts, without product writes."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()
load = lambda path: json.loads(path.read_text())
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
rel = lambda path: str(path.relative_to(ROOT))

def save(name, data):
    path = ROOT / name
    assert not path.exists(), f'PRESERVE_EXISTING_EVIDENCE:{path}'
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

freeze = load(ROOT / 'final-browser-source-freeze.json')
assert all(sha(REPO / path) == digest for path, digest in freeze['files'].items())
assert freeze['head'] == subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
baseline = load(ROOT / 'baseline.json')
protection = {}
for name in ['untracked', 'previousCampaignProtectedFiles']:
    rows = baseline[name]
    failures = [r['path'] for r in rows if not (REPO / r['path']).is_file() or sha(REPO / r['path']) != r['sha256']]
    assert not failures, failures
    protection[name] = {'files': len(rows), 'unchanged': len(rows), 'changedOrMissing': []}
save('preservation-final.json', {'at': NOW, 'baseline': 'baseline.json', 'baselineSha256': sha(ROOT / 'baseline.json'), **protection})

corpus = load(REPO / 'validation/protocol-designer-v1-autonomous-adversarial-stabilization-01/corpus.json')
frozen_turns = {t['id']: t for s in corpus['scenarios'] for t in s['turns']}
runtime = {}
sessions = {}
results = []
for path in sorted((ROOT / 'final_closure').glob('*/*/turns.jsonl')):
    rows = list(map(json.loads, path.read_text().splitlines()))
    for row in rows:
        runtime[row['turn']] = (row, path)
    sessions[rows[0]['scenario']] = load(path.with_name('session.json'))
    result = load(path.with_name('result.json'))
    assert result['harnessCompleted'] and not result['fatal'] and result['realProviderCalls'] == 0
    assert result['sourceState']['stableThroughConversation']
    results.append(result)
assert len(runtime) == 225 and len(results) == 15
prior = {r['turn']: r for p in (ROOT / 'final_scope').glob('*/*/turns.jsonl') for r in map(json.loads, p.read_text().splitlines())}
review = load(ROOT / 'scientific-request-review-closure.json')
scientific_ids = {r['REQUEST_ID'] for r in review['rows']}
assert len(scientific_ids) == 83
changed = [key for key, (row, _) in runtime.items() if row['reply'] != prior[key]['reply']]
assert set(changed) == {'A03-T15', 'C03-T15', 'F01-T14'}
assert all(runtime[key][0]['projectBefore'] == runtime[key][0]['projectAfter'] for key in changed)
assert all(runtime[key][0]['reply'] == prior[key]['reply'] for key in scientific_ids)
save('final-closure-binding.json', {
    'at': NOW, 'phase': 'FINAL_CLOSURE', 'sourceFreeze': 'final-browser-source-freeze.json',
    'sourceUnchanged': True, 'conversations': 15, 'turns': 225, 'scientificRepliesExactlyEqual': 83,
    'changedReplies': [{'requestId': key, 'reason': 'Past discussion reference now acknowledged without a Knowledge request',
                        'input': runtime[key][0]['input'], 'reply': runtime[key][0]['reply'], 'projectUnchanged': True} for key in sorted(changed)],
    'turnEvidence': [{'requestId': key, 'path': rel(path), 'sha256': sha(path),
                      'projectIdentity': {k: row['projectAfter'].get(k) for k in ['projectId', 'versionId', 'projectDigest', 'revision']} if row['projectAfter'] else None}
                     for key, (row, path) in sorted(runtime.items())],
    'realProviderCalls': 0,
})

documents = []
def strings(value):
    if isinstance(value, str): yield value
    elif isinstance(value, dict):
        for item in value.values(): yield from strings(item)
    elif isinstance(value, list):
        for item in value: yield from strings(item)
for scenario, session in sessions.items():
    for projection in session['documents']['projections']:
        project = session['project']
        assert projection['source']['projectId'] == project['projectId']
        assert projection['source']['projectVersion'] == project['versionId']
        assert projection['source']['projectDigest'] == project['projectDigest']
        content = '\n'.join(strings(projection['sections']))
        context = [o for o in project['canonicalState']['objects'] if o['actuality'] == 'CURRENT' and o['objectType'] == 'PROJECT_INFORMATION']
        assert all(o['content'] in content for o in context), scenario
        documents.append({'scenario': scenario, 'projectionId': projection['projectionId'],
                          'source': projection['source'], 'currentContext': [{'versionRef': o['objectVersionId'], 'text': o['content'], 'epistemicState': o['epistemicState']} for o in context],
                          'currentProjectBinding': True, 'literalContextProjected': True})
assert {d['scenario'] for d in documents} == {'A02', 'B01', 'C01', 'C03', 'E01'}
save('document-current-project-final.json', {'at': NOW, 'scope': 'Requested documents only; no complete document audit', 'documents': documents, 'realProviderCalls': 0})

observations = {p.stem: (load(p), p) for p in (ROOT / 'final-browser-evidence/observations').glob('*.json')}
assert len(observations) == 80
http_path = ROOT / 'final-browser-evidence/browser-http-exchanges.jsonl'
http = list(map(json.loads, http_path.read_text().splitlines()))
assert len(http) == 52 and all(r['realProviderCalls'] == 0 and r['responseStatus'] == 200 and not r['failure'] for r in http)
assert all(w['provenance'] == 'SYNTHETIC_CONTRACT_FIXTURE' for r in http for w in r['providerWitnesses'])
case_reviews = {
    'A01': 'Version 5: normalisation du principal, population 35–85, exemple pacemaker individuel, IRM J4–J7 distincte de trois minutes après injection, suivi douze mois; six mois refusé. Study Design/Knowledge/Imaging dans le scope ou abstention justifiée.',
    'A02': 'Version 5: population 35–80 premier STEMI, exclusions individuelles, IRM J3–J6, principal normalisé; FEVG/six mois refusé. Deuxième hypothèse présentée expliquée sans adoption. Document courant et exclusions visibles.',
    'A04': 'Version 4: mêmes examens et lecteurs, appariement conservé, principal normalisé et durée de segmentation secondaire, relecture quatre semaines; une semaine refusée. Accord traité par Biostatistics, méthode non qualifiée explicitée.',
    'B01': 'Version 5: essai ouvert, secondaire sécurité, trois centres confirmés, principal et visite à 36 semaines après nouvelle confirmation distincte du refus précédent. Document courant et analyse bornée cohérents.',
    'F01': 'Version 5: cohorte adulte, exclusion des mineurs, fatigue à seize semaines, 150 adultes seulement envisagés et instrument inconnu. Références ambiguës clarifiées; conservation après discussion correctement reconnue.',
}
browser_cases = []
for scenario, reason in case_reviews.items():
    items = []
    for number in range(1, 16):
        key = f'{scenario}-T{number:02}'
        observation, path = observations[key]
        assert observation['provenance'] == 'CUA_VISIBLE_DOM_OBSERVATION'
        assert observation['input'] == frozen_turns[key]['userText']
        assert observation['dom'] and observation['review'].startswith('PASS')
        items.append({'requestId': key, 'input': observation['input'], 'review': observation['review'], 'uiActions': observation['uiActions'], 'path': rel(path), 'sha256': sha(path)})
    reopened, reopen_path = observations[f'{scenario}-REOPEN']
    assert reopened['projectBefore'] == reopened['projectAfter']
    assert 'CLOSE_TAB_AND_REOPEN' in reopened['uiActions']
    case_http = [r for r in http if r['active']['scenarioId'] == scenario]
    project_ids = {r['request']['currentProject']['projectId'] for r in case_http if r['request'].get('currentProject')}
    assert len(project_ids) == 1
    browser_cases.append({'scenario': scenario, 'verdict': 'FUNCTIONAL_PASS', 'reason': reason, 'turns': items,
                         'reopen': {'visibleProjectIdentical': True, 'path': rel(reopen_path), 'sha256': sha(reopen_path)},
                         'httpRequests': len(case_http), 'observedProjectIds': sorted(project_ids), 'finalVisibleProject': reopened['projectAfter']})
doc_observations = []
for scenario, required in [('A02', ['version 5', '35 à 80', 'qualifier individuellement', 'J3 et J6', '3 minutes']), ('B01', ['version 5', 'trois centres confirmés', '36 semaines'])]:
    observation, path = observations[f'{scenario}-T14']
    assert all(text in observation['documentVisibleText'] for text in required)
    doc_observations.append({'scenario': scenario, 'visibleText': observation['documentVisibleText'], 'path': rel(path), 'sha256': sha(path)})
save('final-browser-review.json', {'at': NOW, 'status': 'PASS', 'functionalPass': 5, 'conversations': 5, 'retainedTurns': 75,
    'realReopens': 5, 'observations': 80, 'cases': browser_cases, 'documents': doc_observations,
    'sourceFreeze': 'final-browser-source-freeze.json', 'sourceUnchanged': True,
    'httpEvidence': {'path': rel(http_path), 'sha256': sha(http_path), 'requests': len(http), 'syntheticProviderResponses': sum(len(r['providerWitnesses']) for r in http), 'realProviderCalls': 0},
    'limits': ['DOM observations establish visible semantic state and version after reopening; exact canonical identities and digests are additionally verified in runtime replay, not inferred from hidden browser state.',
               'Unavailable historical options are clarified; successful selection is not claimed for these trajectories.',
               'Generic progression prompts can remain awkward next to correct candidate reviews; scientific competence is not inferred from bounded abstention.']})

suite_path = ROOT / 'qualification/full-suite-final-closure.json'
suite = load(suite_path)
receipt = load(ROOT / 'qualification/full-suite-final-closure-receipt.json')
assert receipt['exitCode'] == 0 and receipt['success'] and receipt['sourceUnchanged'] and receipt['failed'] == 0
assert suite['success'] and suite['numPassedTests'] == 4207 and suite['numFailedTests'] == 0
assert 'dangerouslyIgnoreUnhandledErrors' not in (REPO / 'vitest.config.ts').read_text()
soaks = [{'test': a['fullName'], 'status': a['status']} for r in suite['testResults'] for a in r['assertionResults'] if 'family for 15 meaningful Standard turns' in a['fullName']]
properties = [{'test': a['fullName'], 'status': a['status']} for r in suite['testResults'] for a in r['assertionResults'] if 'PROPERTY_REUSE_' in a['fullName']]
assert len(soaks) == 3 and len(properties) >= 5 and all(a['status'] == 'passed' for a in soaks + properties)
lint = load(ROOT / 'qualification/lint-affected-final-closure-receipt.json')
assert lint['exitCode'] == 0 and lint['errors'] == 0 and lint['warnings'] == 0
debt = load(ROOT / 'qualification/root-lint-debt-attribution.json')
assert all(sha(REPO / row['path']) == row['sha256'] for row in debt['files'])
build_log = (ROOT / 'qualification/build-final-closure.log').read_text()
assert '✓ built in' in build_log and 'NOXIA_TYPESCRIPT_GATE_CLEAN=CONFIGURATION_VERIFIED' in build_log
prefix = load(ROOT / 'qualification/recorded-live-prefix-final-closure/green-replay.json')
prefix_test = load(ROOT / 'qualification/recorded-live-prefix-final-closure-test.json')
assert prefix_test['success'] and prefix_test['numFailedTests'] == 0
save('qualification/technical-final-receipt.json', {'at': NOW, 'sourceFreeze': 'final-browser-source-freeze.json', 'sourceUnchanged': True,
    'fullSuite': {**receipt, 'unhandled': 0, 'unhandledEvidence': 'Vitest success=true, exit=0, no ignore-unhandled setting; raw report and log retained', 'report': rel(suite_path), 'sha256': sha(suite_path)},
    'TypeScript': 'PASS_APP_API_SERVER_AND_CONFIGURATION_GATES', 'build': 'PASS', 'buildLog': 'qualification/build-final-closure.log',
    'affectedLint': {'errors': 0, 'warnings': 0, 'files': len(lint['files'])}, 'rootLint': {'errors': 51, 'warnings': 36, 'attribution': 'Unchanged prior files; excluded from repair scope, not globally green'},
    'soaksABC': soaks, 'strongReuseProperties': properties, 'live01R': {k: prefix[k] for k in ['LIVE_01R_T05_OFFLINE_REPRODUCTION', 'providerCalls', 'recordedResponsesUsed', 'browserHttpCalls', 'projectUnchanged']},
    'NEW_PROVIDER_CALLS': 0})

state = load(ROOT / 'resume-state.json')
state.update({'CURRENT_PHASE': 'CP6_COMPLETE_CP7_QUALIFIED_COMMIT_PENDING', 'LAST_VALID_MISSION_CHECKPOINT': 'CP6',
              'LAST_VALID_CHECKPOINT': 'CP6_REAL_BROWSER_5_OF_5', 'COMPLETED_CHECKPOINTS': ['CP0', 'CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6'],
              'NEXT_DETERMINISTIC_ACTION': 'Finalize report and explicit Git whitelist; commit qualified source and compact evidence; then write exact final receipt.',
              'REAL_BROWSER_GATE': '5/5 FUNCTIONAL_PASS', 'NEW_PROVIDER_CALLS': 0, 'P1_COMPLETE': 'NO', 'P1_EXIT_GATE': 'NOT_SATISFIED', 'WAVE_2_AUTHORIZED': 'NO'})
(ROOT / 'resume-state.json').write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')
with (ROOT / 'checkpoint-log.md').open('a') as stream:
    stream.write(f'\n- {NOW} — CP6: final source, 5/5 real-browser FUNCTIONAL PASS, 75 turns + 5 reopens, 52 local bridge exchanges, 99 synthetic provider responses, zero real providers. Both requested browser documents include current context. 4207 tests pass, zero fail/unhandled; TypeScript/build/affected lint pass. Prior root lint debt and two generic partials retained. Explicit commit pending.\n')
print(json.dumps({'browser': '5/5', 'turns': 75, 'documents': len(documents), 'fullSuite': 4207, 'soaks': 3, 'strongProperties': len(properties), 'preservation': protection, 'realProviderCalls': 0}))
