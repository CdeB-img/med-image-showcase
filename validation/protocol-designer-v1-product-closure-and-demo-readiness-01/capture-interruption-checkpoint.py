"""Physical source snapshot and atomic resume update; never stages or changes Git."""
from pathlib import Path
import datetime, hashlib, json, shutil, subprocess

root = Path(__file__).resolve().parent
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
existing = sorted(root.glob('interruption-snapshot-*'))
number = max([int(p.name.rsplit('-', 1)[1]) for p in existing] or [0]) + 1
snapshot = root / f'interruption-snapshot-{number:02d}'
snapshot.mkdir()
tracked = subprocess.check_output(['git', 'diff', '--name-only', '--', 'src', 'api'], text=True).splitlines()
new = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '--', 'src', 'api'], text=True).splitlines()
new = [p for p in new if not any(word in p.lower() for word in ['blind', 'sealed'])]
patch = subprocess.check_output(['git', 'diff', '--binary', '--', 'src', 'api'])
(snapshot / 'tracked-source.patch').write_bytes(patch)
for path in new:
    target = snapshot / 'new-sources' / path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, target)
manifest = {
    'createdAt': now, 'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
    'branch': subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip(),
    'remote': subprocess.check_output(['git', 'remote', '-v'], text=True).splitlines(),
    'trackedModified': tracked, 'newSources': new,
    'sha256': {p: hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in tracked + new},
    'snapshot': str(snapshot), 'patchSha256': hashlib.sha256(patch).hexdigest(),
    'staged': subprocess.check_output(['git', 'diff', '--cached', '--name-only'], text=True).splitlines(),
}
payload = json.dumps(manifest, indent=2) + '\n'
(snapshot / 'source-manifest.json').write_text(payload)
(root / 'interruption-source-manifest.json').write_text(payload)
state = json.loads((root / 'resume-state.json').read_text())
state.update({'UPDATED_AT': now, 'SNAPSHOT': str(snapshot), 'SOURCE_MANIFEST_STATUS': 'CURRENT',
              'TRACKED_MODIFIED': tracked, 'NEW_SOURCE_FILES': new})
temporary = root / 'resume-state.json.tmp'
temporary.write_text(json.dumps(state, indent=2) + '\n')
temporary.replace(root / 'resume-state.json')
with (root / 'checkpoint-log.md').open('a') as log:
    log.write(f'\nSource snapshot {number:02d} — {now}: {len(tracked)} tracked changes, {len(new)} new sources; hashes and patch saved. No staging/commit.\n')
print(json.dumps({'snapshot': str(snapshot), 'tracked': len(tracked), 'new': len(new)}))
