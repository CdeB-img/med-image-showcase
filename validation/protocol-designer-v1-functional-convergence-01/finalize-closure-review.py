"""Rebind the prior individual review to the qualified final source.

This does not score scientific usefulness. It requires exact reply equality
for all 83 previously examined requests before transferring their judgments.
Current documents are qualified separately by native and real-browser proofs.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
prior = json.loads((ROOT / 'scientific-request-review-final.json').read_text())
turns = {r['turn']: r for p in (ROOT / 'final_closure').glob('*/*/turns.jsonl')
         for r in map(json.loads, p.read_text().splitlines())}
assert len(turns) == 225
for row in prior['rows']:
    assert row['ACTUAL_REPLY'] == turns[row['REQUEST_ID']]['reply'], row['REQUEST_ID']

source = (ROOT / 'finalize-runtime-review.py').read_text()
replacements = {
    "PHASE = 'final_scope'": "PHASE = 'final_closure'",
    'scientific-request-review-final': 'scientific-request-review-closure',
    'c02-final-requalification.json': 'c02-closure-requalification.json',
    'final-replay-adjudication.json': 'closure-replay-adjudication.json',
    'Les hypothèses utilisent les trois centres, le comparateur et le critère à 24 semaines en vigueur à ce tour.':
        'Les hypothèses utilisent le comparateur et le critère à 24 semaines en vigueur à ce tour. Aucun nombre de centres n’était encore adopté au T04; la mention de trois centres dans la première rédaction du rapport était inexacte.',
    'Aucune liste d’options de recrutement n’a été produite au T05; demander la proposition précise évite d’inventer une ancienne première option.':
        'Aucune liste d’options de recrutement n’a été produite au T05; demander la proposition précise évite d’inventer la deuxième option mentionnée au T10.',
    'Le pacemaker est reconnu comme exemple à qualifier, sans conversion en exclusion générale.':
        'Les dispositifs implantés restent des exemples à qualifier individuellement, sans conversion en exclusion générale.',
    'Le document demandé est lié au Project courant, version 5, et aux décisions révisées.':
        'Le document final et son aperçu navigateur utilisent le Project version 5: population 35–80 ans, premier STEMI reconnu, exclusions individuelles, IRM J3–J6 et principal normalisé. L’omission de contexte du premier passage a été corrigée dans DOC.',
    'Le document utilise les trois centres et 36 semaines effectivement adoptés, sans réintroduire le calendrier remplacé.':
        'Le document final et son aperçu navigateur utilisent les trois centres confirmés et 36 semaines, version 5. Cette fidélité de contenu est vérifiée après correction DOC; le premier passage omettait les centres malgré une version source correcte.',
    'Each reply inspected for requested purpose, referent, current Project, limits and usable next action. No length or routing-only PASS.':
        'Prior individual semantic review transferred only after exact equality of all 83 actual replies; bound to current final-closure Project and trace identities. Native documents and five real-browser trajectories reviewed separately. No length or routing-only PASS.',
}
for before, after in replacements.items():
    assert before in source, before
    source = source.replace(before, after)
exec(compile(source, str(ROOT / 'finalize-runtime-review.py'), 'exec'), {'__file__': str(ROOT / 'finalize-runtime-review.py')})
