"""Persist observations actually returned by the CUA browser; never infer UI success from HTTP."""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent
observed = json.load(sys.stdin)
scenario = observed['scenario']
corpus = json.loads((root / 'corpus.json').read_text())
gold = next(item for item in corpus['scenarios'] if item['id'] == scenario)
assert len(observed['versions']) == len(gold['turns']) == 15
turns = []
for item, versions in zip(gold['turns'], observed['versions']):
    before, after_input, after_ui = versions
    effect = item['expectedProjectEffect']
    input_ok = after_input == before + (effect['afterInput'] == 'ADOPT_PENDING')
    ui_ok = after_ui == after_input + (effect.get('afterUi') == 'ADOPT_PENDING')
    turns.append({'turn': item['id'], 'outcome': item['outcome'],
                  'observedVisibleVersions': versions,
                  'inputVersionMatchesGold': input_ok, 'uiVersionMatchesGold': ui_ok,
                  'scope': 'Visible version and actual UI actions; canonical identity/integrity separately evidenced by real handler and runtime replay'})
http_file = root / 'browser-evidence/browser-http-exchanges.jsonl'
http_lines = http_file.read_text().splitlines()
selected = [(i + 1, json.loads(line)) for i, line in enumerate(http_lines)
            if json.loads(line)['active']['scenarioId'] == scenario and i + 1 >= observed.get('httpLineStart', 1)]
receipt = {**observed, 'at': datetime.now(timezone.utc).isoformat(), 'turns': turns,
           'conversationCompleted': True, 'meaningfulTurns': 15,
           'qualificationVerdict': 'FAIL' if observed['materialFindings'] else 'NOT_ADJUDICATED',
           'source': 'CUA_REAL_BROWSER_STANDARD_UI_WITH_SYNTHETIC_EXTERNAL_PROVIDER_TRANSPORT',
           'newProviderCalls': 0,
           'httpEvidence': {'path': 'browser-http-exchanges.jsonl',
                            'lineNumbers': [i for i, _ in selected],
                            'lineSha256': {str(i): hashlib.sha256(http_lines[i-1].encode()).hexdigest() for i, _ in selected},
                            'requests': len(selected)},
           'limitations': ['Synthetic provider responses do not qualify live language fidelity.',
                           'CUA content export is unsupported by the in-app browser; this receipt preserves observed versions/actions/findings, while complete HTTP exchanges are stored separately.',
                           'Scientific response scope is independently reviewed in semantic-review-final.json; version preservation alone is not scientific PASS.']}
target = root / 'browser-evidence' / (scenario + '-observation.json')
assert not target.exists(), 'Do not overwrite a completed browser receipt'
target.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
state_file = root / 'resume-state.json'
state = json.loads(state_file.read_text())
state.setdefault('BROWSER_COMPLETED_SCENARIOS', []).append({'scenario': scenario, 'turns': 15,
    'receipt': str(target.relative_to(root)), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
    'verdict': receipt['qualificationVerdict']})
state['CURRENT_PHASE'] = 'FINAL_BROWSER_QUALIFICATION'
state['LAST_VALID_CHECKPOINT'] = 'REAL_BROWSER_' + scenario + '_15_TURNS_PERSISTED'
state['NEXT_DETERMINISTIC_ACTION'] = 'Continue remaining browser scenarios from frozen corpus; final report/qualification; no further product repair'
tmp = state_file.with_suffix('.tmp')
tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2) + '\n')
tmp.replace(state_file)
with (root / 'checkpoint-log.md').open('a') as log:
    log.write(f'- {receipt["at"]} — REAL_BROWSER {scenario}: 15/15 turns, {receipt["qualificationVerdict"]}; UI observations and HTTP line digests persisted; new providers=0.\n')
print(json.dumps({'scenario': scenario, 'turns': 15, 'verdict': receipt['qualificationVerdict'], 'httpRequests': len(selected)}))
