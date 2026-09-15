"""Read-only preservation check; writes a receipt only inside this mission."""
from pathlib import Path
import hashlib, json, subprocess, datetime

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
BASELINE = json.loads((ROOT / 'baseline.json').read_text())
PRODUCT = [
    'src/features/protocol-designer/intake/privacy.ts',
    'src/features/protocol-designer/product-bridge.ts',
    'src/features/protocol-designer/functional-reset/ContributionReview.tsx',
    'src/features/research-project-construction/scientific-reasoning-owner-chain.ts',
    'src/features/scientific-thinking/engine.ts',
    'src/features/research-project-construction/contribution-owner-boundary.ts',
]
NEW_TEST = 'src/features/protocol-designer/__tests__/v1-causal-repair-regression.test.tsx'

def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def check(rows, allowed=()):
    drift = [r['path'] for r in rows if r['path'] not in allowed
             and (not (REPO / r['path']).is_file() or sha(REPO / r['path']) != r['sha256'])]
    assert not drift, drift
    return {'checked': len([r for r in rows if r['path'] not in allowed]), 'drift': drift}

checks = {k: check(BASELINE[k], PRODUCT if k == 'trackedFiles' else ())
          for k in ['priorUntracked', 'privateEvidence', 'trackedFiles']}
live = REPO / 'validation/protocol-designer-v1-multi-session-live-evidence-acquisition-01r/evidence-manifest.json'
assert sha(live) == BASELINE['liveManifestSha256']
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=REPO, text=True).strip() == BASELINE['branch']
product_hashes = [{'path': p, 'sha256': sha(REPO / p)} for p in PRODUCT + [NEW_TEST]]
receipt = {
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
    'checks': checks, 'liveManifestSha256': sha(live),
    'productFiles': product_hashes, 'status': 'PASS',
    'scope': 'Every frozen pre-existing untracked/private file and all baseline tracked files except the six authorized product changes are byte-identical. New regression test explicitly listed.'
}
(ROOT / 'preservation-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'checks': checks, 'productFiles': len(product_hashes)}))
