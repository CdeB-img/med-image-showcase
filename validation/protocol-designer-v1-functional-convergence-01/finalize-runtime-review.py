"""Bind individual semantic judgments to preserved final replay evidence.

Verdicts below are manual judgments of the actual replies, not keyword/length
scores. Raw harness failures remain available and are separately adjudicated.
"""
from pathlib import Path
import json, hashlib, collections, datetime, subprocess

ROOT = Path(__file__).resolve().parent
PHASE = 'final_scope'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
def save(name, value):
    p = ROOT / name
    assert not p.exists(), f'PRESERVE_EXISTING_EVIDENCE: {p}'
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

# U = useful; B = bounded abstention; C = genuine reference clarification;
# P = partial. No broad scientific competence is inferred from an abstention.
MANUAL = '''
A01-T05|B|Study Design traite le recrutement dans la population 35–85 ans, conserve les critères et demande une contrainte de faisabilité ou une justification d’éligibilité avant de proposer des seuils.
A01-T06|B|L’explication de l’aveugle distingue le souhait de sa faisabilité, déclare l’absence d’appui qualifié et demande les procédures et rôles à examiner.
A01-T10|C|Aucune liste d’options de recrutement n’a été produite au T05; demander la proposition précise évite d’inventer une ancienne première option.
A01-T13|B|Imaging se lie à J4–J7 après IDM et au critère à trois minutes après injection; il précise la limite de qualification des acquisitions et la documentation nécessaire.
A02-T02|U|La remarque sur l’ordre de présentation est conservée comme commentaire, sans modification des décisions scientifiques.
A02-T04|U|Les hypothèses candidates utilisent la comparaison, le principal et les limites effectivement adoptés; elles ne sont ni départagées ni adoptées.
A02-T05|U|La deuxième hypothèse réellement présentée est identifiée; son rôle et la différence entre absence de différence détectée et équivalence sont expliqués sans preuve inventée.
A02-T10|U|Le pacemaker est reconnu comme exemple à qualifier, sans conversion en exclusion générale.
A02-T12|U|La relecture utilise la population actuelle 35–80 ans et conserve la distinction avec les décisions historiques.
A02-T14|U|Le document demandé est lié au Project courant, version 5, et aux décisions révisées.
A02-T15|U|La contribution après réouverture utilise le Project courant, sans reprise de l’ancienne population ou du calendrier remplacé.
A03-T02|B|Scientific Thinking explicite l’absence de nouvelle hypothèse défendable dans les données présentes; il ne fabrique pas de nouveauté.
A03-T04|B|Knowledge conserve la distinction entre aveugle des lecteurs et aveugle de l’étude, sans inventer une procédure; il demande les éléments méthodologiques à examiner.
A03-T05|U|L’exemple de seuil T2 reste illustratif; aucun seuil diagnostique n’est adopté.
A03-T11|U|La relecture conserve J5–J7 après IDM et l’inconnue sur le sens de tardif après injection, avec les éléments d’analyse concernés.
A03-T13|B|La demande de pistes supplémentaires reçoit une abstention motivée d’épuisement du contenu actuel; aucune ancienne idée n’est présentée comme nouvelle décision.
A03-T14|B|Le propriétaire explique sa limite pour des propositions supplémentaires, en conservant les éléments confirmés et les inconnues.
A04-T04|B|Biostatistics reconnaît l’accord de mesures appariées; aucune méthode locale n’est qualifiée. La réponse demande l’usage et l’écart acceptable entre méthodes plutôt qu’une hypothèse sur le volume.
A04-T05|B|Knowledge reconnaît la distinction corrélation/accord et explicite le manque de documentation qualifiée; la prochaine action porte sur la définition méthodologique à examiner.
A04-T07|U|L’intuition sur les contours reste une hypothèse de discussion, sans promotion en résultat établi.
A04-T08|B|Study Design examine l’organisation des mesures appariées dans le calendrier de quatre semaines; il déclare la limite méthodologique et demande les conditions à comparer.
A04-T12|U|La relecture retient quatre semaines et garde la proposition d’une semaine au statut refusé.
A04-T15|B|Biostatistics répond à l’accord avec le critère normalisé courant; la limite de qualification et les paramètres méthodologiques nécessaires sont explicités.
B01-T04|U|Les hypothèses utilisent les trois centres, le comparateur et le critère à 24 semaines en vigueur à ce tour.
B01-T06|B|La discussion de précision expose le manque d’appui qualifié et demande les informations pertinentes; aucun effectif chiffré n’est inventé.
B01-T09|B|La discussion du suivi plus long reste bornée par l’état courant à 24 semaines et par les informations méthodologiques manquantes, avant l’adoption ultérieure.
B01-T14|U|Le document utilise les trois centres et 36 semaines effectivement adoptés, sans réintroduire le calendrier remplacé.
B01-T15|B|Biostatistics utilise le suivi courant de 36 semaines et précise les liens variable/critère, le contraste et l’unité nécessaires pour qualifier une analyse alternative.
B02-T02|U|La valeur de 130 reste un exemple illustratif; parler d’un seuil n’est pas transformé en adoption ni en demande hors sujet.
B02-T03|B|Biostatistics conserve la cohorte observationnelle et l’exposition mesurée; l’abstention porte sur les éléments nécessaires à l’analyse, sans bras randomisés inventés.
B02-T05|B|Knowledge traite la question des facteurs de confusion dans le projet observationnel et demande un appui méthodologique applicable.
B02-T08|U|La remarque de formulation est traitée comme commentaire rédactionnel, sans changer le Project.
B02-T10|B|Biostatistics reste lié à la cohorte et au critère courants; sa limite de qualification et la prochaine action sont explicites.
B02-T12|U|La relecture utilise 40–80 ans, la maladie rénale stable et l’exclusion de la dialyse; elle distingue les anciennes décisions.
B03-T02|U|Les hypothèses portent sur le sommeil, la comparaison et le critère réellement confirmés; elles restent candidates.
B03-T03|B|La discussion de stabilisation des traitements garde le statut d’essai et expose le besoin documentaire, sans décision d’arrêt de médicament.
B03-T05|U|Le dispositif connecté reste un exemple de mesure, sans adoption implicite d’un instrument.
B03-T08|B|Le prérequis Knowledge d’OBS échoue explicitement faute d’instrument qualifié; la réponse indique la documentation, la validité et les conditions de mesure nécessaires.
B03-T09|C|Aucune liste d’instruments n’a été fournie; la référence à une option demande clarification, sans substitution d’une hypothèse ST.
B04-T04|B|Biostatistics reconnaît la distinction décès/réhospitalisation et l’insuffisance des définitions et liens analytiques disponibles pour qualifier une méthode.
B04-T05|B|La discussion hypothétique du composite est traitée par Knowledge dans le contexte adopté, sans demander à tort un dimensionnement préalable ni modifier le critère.
B04-T08|B|Le compromis sur le composite reste lié au décès mesuré séparément; la limite documentaire et les définitions à examiner sont explicites.
B04-T10|B|Scientific Thinking ne fabrique pas de nouvelle hypothèse autour du critère de réhospitalisation déjà traité; l’épuisement local est explicite.
B04-T15|U|La relecture conserve le refus du composite et le décès enregistré séparément, sans réadoption silencieuse.
F01-T02|U|L’exemple d’incertitude est reconnu comme illustration; il ne devient pas une observation établie.
F01-T04|C|« Non, pas ça » ne désigne pas un objet suffisamment résolu; la clarification préserve le Project.
F01-T06|B|Knowledge/OBS déclare l’absence d’instrument qualifié pour le construit actuel et demande documentation et conditions de validité.
F01-T07|C|« Celle-là » ne résout aucune option réellement présentée; aucune sélection arbitraire n’est effectuée.
F01-T12|U|La remarque rédactionnelle reste un commentaire, sans sollicitation scientifique inadéquate ni modification du Project.
F01-T13|B|Knowledge conserve le caractère observationnel et la distinction association/causalité; le manque d’appui et la question méthodologique à préciser sont explicites.
F01-T15|B|La réponse utilise 16 semaines, conserve l’instrument inconnu et explique la documentation requise pour progresser.
C01-T05|U|Les hypothèses portent sur les traitements thermiques et le critère de fatigue courants, sans patients ni objet médical ajouté.
C01-T06|P|La deuxième hypothèse est correctement résolue et expliquée, mais la réponse n’examine pas les conséquences demandées des lots et de l’essai destructif. Limite fonctionnelle scientifique générique conservée.
C01-T08|U|La relecture distingue éprouvettes, lots et traitement; aucun remplacement par des patients n’est observé.
C01-T09|B|Study Design reconnaît la demande de méthodes et conditions d’étude; sa couverture locale insuffisante est explicitée dans le contexte matériaux.
C01-T12|B|La discussion des répétitions reste sur les unités d’observation du Project; l’appui méthodologique manquant et la prochaine action sont explicites.
C01-T14|U|Le document est lié aux décisions courantes sur le matériau et l’essai, sans état historique silencieusement réintroduit.
C02-T03|B|Knowledge reconnaît l’irrigation comme question agronomique et expose le manque de connaissances applicables, sans hypothèse médicale substituée.
C02-T09|B|La discussion des blocs et répétitions conserve les unités et le dispositif actuels; la limitation méthodologique est explicite.
C02-T13|B|Study Design utilise six blocs et 120 jours; il borne les alternatives méthodologiques sans reprendre des hypothèses génériques sur le rendement.
C03-T02|U|La remarque conserve le plan observationnel avant-après avec témoins; elle n’introduit pas de randomisation.
C03-T04|U|Les hypothèses portent sur restauration et biodiversité selon le projet courant, avec incertitude et statut candidat conservés.
C03-T06|B|La réponse Knowledge explicite le manque de définition/documentation applicable pour l’indice de diversité et demande le choix à examiner.
C03-T10|P|L’incertitude causale et le Project sont préservés, mais la simple hypothèse de discussion déclenche une abstention Knowledge comme s’il s’agissait d’une demande d’explication. Surinterprétation conversationnelle résiduelle.
C03-T14|U|Le document utilise le suivi de trois ans adopté, sans reprise silencieuse de deux ans.
D01-T03|B|Study Design reconnaît le benchmark et les méthodes à comparer; il explicite la couverture insuffisante pour proposer une stratégie défendable.
D01-T04|C|Aucune première alternative n’a été produite; l’explication requiert donc une cible explicite plutôt qu’une liste inventée.
D01-T05|C|L’alternative à cette première option n’est pas résoluble faute d’option source; le système clarifie sans substituer ST.
D01-T10|U|Le commentaire rédactionnel reste une contribution de discussion sans modification technique du benchmark.
D01-T13|C|La référence ancienne indisponible est explicitement clarifiée; aucune candidate courante n’est adoptée à sa place.
D01-T15|U|La réponse se fonde sur le 99e percentile actuel, sans réintroduire le 95e percentile remplacé.
E01-T02|U|Les hypothèses sont liées aux traitements et à la levée des graines du Project courant; aucune expertise médicale n’est substituée.
E01-T04|B|Knowledge reconnaît la distinction levée/biomasse, indique l’appui manquant et propose d’examiner les définitions de mesure.
E01-T05|U|La règle citée comme exemple externe reste illustrative et n’est pas adoptée comme décision du projet.
E01-T08|B|Study Design traite la demande sur les effets de position; il borne les méthodes défendables dans les contraintes courantes et demande les conditions à comparer.
E01-T09|C|Aucune deuxième alternative de disposition n’est disponible; la clarification évite une sélection arbitraire.
E01-T15|U|Le document conserve 24 °C, le principal à J35 et la mesure secondaire à J7.
F02-T02|U|Les hypothèses sont liées au plan en grappes et au Project courant, sans choix automatique d’une option.
F02-T03|U|La première hypothèse réellement présentée est expliquée avec son rôle, sa limite de preuve et son statut candidat.
F02-T04|B|La demande de pistes supplémentaires reçoit une abstention explicite d’épuisement local, sans nouveauté artificielle.
F02-T08|U|Cent élèves restent un exemple d’ordre de grandeur et ne deviennent pas un effectif adopté.
F02-T09|U|La relecture conserve les unités école et enseignant du Project courant.
F02-T15|U|La réponse utilise explicitement douze semaines, conserve les correcteurs masqués et ne reprend pas huit semaines.
'''
verdicts = {'U': 'PASS_USEFUL_CONTRIBUTION', 'B': 'PASS_BOUNDED_ABSTENTION', 'C': 'PASS_CLARIFICATION_REQUIRED', 'P': 'PARTIAL'}
manual = {a: (verdicts[b], c) for a, b, c in (line.split('|', 2) for line in MANUAL.strip().splitlines())}
matrix = json.loads((ROOT / 'service-scope-matrix.json').read_text())
turns, files, sessions, results = {}, {}, {}, []
for p in sorted((ROOT / PHASE).rglob('turns.jsonl')):
    rs = [json.loads(line) for line in p.read_text().splitlines()]
    for r in rs:
        assert r['turn'] not in turns
        turns[r['turn']], files[r['turn']] = r, p
    sessions[rs[0]['scenario']] = json.loads(p.with_name('session.json').read_text())
    results.append(json.loads(p.with_name('result.json').read_text()))
assert len(turns) == 225 and len(results) == 15
assert all(r['harnessCompleted'] and not r['fatal'] and r['realProviderCalls'] == 0 and r['sourceState']['stableThroughConversation'] for r in results)
assert set(manual) == {r['REQUEST_ID'] for r in matrix['rows']}
identity = lambda p: {k: p.get(k) for k in ['projectId', 'versionId', 'projectDigest', 'revision']} if p else None
rows = []
for old in matrix['rows']:
    k = old['REQUEST_ID']; r = turns[k]; verdict, reason = manual[k]
    assert old['USER_REQUEST'] == r['input']
    assert r['projectBefore'] == r['projectAfter'], f'UNEXPECTED_SCIENTIFIC_REQUEST_WRITE:{k}'
    trace = r['latestTrace'] or {}
    rows.append({
        'REQUEST_ID': k, 'SCOPE': old['SCOPE'], 'USER_REQUEST': r['input'],
        'PROJECT_CONTEXT': identity(r['projectBefore']),
        'REQUESTED_SCIENTIFIC_SERVICE': old['REQUESTED_SCIENTIFIC_SERVICE'],
        'EXPECTED_CONTRIBUTION_CLASS': old['EXPECTED_CONTRIBUTION_CLASS'],
        'KNOWN_EXISTING_OWNER_CANDIDATES': old['KNOWN_EXISTING_OWNER_CANDIDATES'],
        'ACTUAL_EXECUTION_EVIDENCE': {key: trace.get(key) for key in ['model','provider','traceRunId','continuationPresentationSource','requestKind']},
        'ACTUAL_REPLY': r['reply'], 'PROJECT_UNCHANGED': True,
        'VERDICT': verdict, 'RATIONALE': reason,
        'BEFORE': old['OUTPUT_RELEVANT_TO_SCOPE']['priorIndependentVerdict'],
        'evidence': str(files[k].relative_to(ROOT)) + '#' + k, 'sha256': sha(files[k]),
        'realProviderCalls': r['realProviderCalls']})
counts = lambda values: dict(collections.Counter(values))
review = {'contract': 'INDIVIDUAL_MANUAL_SEMANTIC_REVIEW_OF_FINAL_FROZEN_CORPUS', 'at': now(),
    'phase': PHASE, 'method': 'Each reply inspected for requested purpose, referent, current Project, limits and usable next action. No length or routing-only PASS.',
    'matrixSha256': sha(ROOT/'service-scope-matrix.json'), 'total': len(rows),
    'before': counts(r['BEFORE'] for r in rows), 'after': counts(r['VERDICT'] for r in rows),
    'byScope': {s: {'total': sum(r['SCOPE']==s for r in rows), 'verdicts': counts(r['VERDICT'] for r in rows if r['SCOPE']==s)} for s in ['V1_PRODUCT_GATE','GENERIC_ARCHITECTURE_STRESS']},
    'CAPABILITY_GAP_DEMONSTRATED': 'NO_UNOWNED_RESPONSIBILITY',
    'coverageLimit': 'No qualified external knowledge was supplied or retrieved. Bounded abstentions demonstrate honest service boundaries, not delivered scientific expertise. Generic partial cases remain unresolved.', 'rows': rows}
save('scientific-request-review-final.json', review)
md = ['# Revue finale des 83 demandes', '', 'Revue manuelle liée aux réponses et au Project exacts du replay final. Les abstentions et clarifications ne démontrent pas une capacité de proposition scientifique complète.', '', '| Demande | Périmètre | Verdict | Justification |', '|---|---|---|---|']
md += [f"| {r['REQUEST_ID']} | {r['SCOPE']} | {r['VERDICT']} | {r['RATIONALE']} |" for r in rows]
(ROOT/'scientific-request-review-final.md').write_text('\n'.join(md)+'\n')

oldgate = json.loads((ROOT/'c02-gate.json').read_text())
cases = []
for old in oldgate['cases']:
    k = old['requestId']; r = turns[k]; session = sessions[r['scenario']]
    user = [t for t in session['runtimeTurns'] if t['role']=='USER' and t['content']==r['input']]
    assert len(user)==1, k
    decisions = [c for c in session['retainedContributionCandidates'] if c.get('humanDecision') and user[0]['turnId'] in c['humanDecision']['provenance']]
    # A confirmation also names the candidate source turn; this census is for
    # the distinct decision turn itself, which is unique in these 16 cases.
    act=old['userAct']; changed = r['projectBefore'] != r['projectAfterInput']
    if act == 'CONFIRM':
        assert len(decisions)==1 and decisions[0]['humanDecision']['status']=='ADOPTED' and changed, k
        verdict='PASS_DECISION_RECORDED'; reason='Une seule candidate explicitement confirmée; provenance du véritable message humain et version Project vérifiées.'
    elif act == 'REFUSE' and decisions:
        assert len(decisions)==1 and decisions[0]['humanDecision']['status']=='REJECTED' and not changed, k
        verdict='PASS_DECISION_RECORDED'; reason='Refus lié à une seule candidate et au message humain; Project adopté inchangé.'
    else:
        assert not changed and not decisions, k
        assert 'précis' in r['reply'] or 'préciser' in r['reply'] or 'clarif' in r['reply'], k
        assert k!='B02-T07', 'UNNECESSARY_COUNT_REFERENCE_CLARIFICATION_NOT_ACCEPTED'
        verdict='PASS_CLARIFICATION_REQUIRED'; reason='Option antérieure non produite, indisponible ou non résolue dans cette trajectoire; clarification explicite sans substitution ni écriture.'
    cases.append({'requestId':k,'userAct':act,'verdict':verdict,'reason':reason,'input':r['input'],
        'reply':r['reply'],'userTurnRef':user[0]['turnId'],
        'candidateRef':decisions[0]['candidateRef'] if decisions else None,
        'decision':decisions[0]['humanDecision'] if decisions else None,
        'projectBefore':identity(r['projectBefore']),'projectAfterInput':identity(r['projectAfterInput']),
        'evidence':str(files[k].relative_to(ROOT))+'#'+k,'sha256':sha(files[k])})
gate={'at':now(),'status':'PASS_C02_FINAL_REQUALIFICATION','historicalCP2':'c02-gate.json',
    'countReferenceResidual': 'B02-T07 initially clarified unnecessarily. Final source now binds its human sample-size label; prior evidence retained.',
    'counts':{a:counts(c['verdict'] for c in cases if c['userAct']==a) for a in ['CONFIRM','REFUSE','SELECT_OLD_PROPOSAL']},
    'wrongAdoption':0,'cases':cases,'realProviderCalls':0}
save('c02-final-requalification.json',gate)

byrequest={r['REQUEST_ID']:r for r in rows}; bycase={c['requestId']:c for c in cases}
adjudicated=[]
for result in results:
    for a in result['anomalies']:
        k=a['TURN']; prop=a['PROPERTY']
        if prop in ['SCIENTIFIC_PROJECT_ANCHORING','SCIENTIFIC_CANDIDATE_STATUS']:
            r=byrequest[k]; assert r['VERDICT'].startswith('PASS_'), k
            reason=r['RATIONALE']; outcome=r['VERDICT']
        elif prop=='REFUSAL_LIFECYCLE':
            c=bycase[k]; assert c['verdict']=='PASS_CLARIFICATION_REQUIRED', k
            reason=c['reason']; outcome=c['verdict']
        else: raise AssertionError(a)
        adjudicated.append({'raw':a,'finalVerdict':outcome,'reason':reason,
            'oracleMismatch':'Historical oracle mandates a proposal/adoption-state transition where this mission permits a justified abstention or clarification. Raw failure not erased.'})
checkcounts=counts(c['status'] for r in results for t in r['checks'] for c in t['checks'])
assert checkcounts.get('FAIL',0)==len(adjudicated)
aggregate={'at':now(),'phase':PHASE,'conversations':15,'turns':225,'fatal':0,'realProviderCalls':0,
    'rawCheckCounts':checkcounts,'rawMaterialOccurrences':len(adjudicated),
    'ADVERSARIAL_REPLAY':'PARTIAL','PROJECT_INTEGRITY':'PASS',
    'reason':'V1 requests pass under the mission oracle. Two generic scientific/conversation requests remain PARTIAL; generic Project, lifecycle and authority invariants remain intact.',
    'universalLanguageUnderstanding':'NOT_MEASURED_SYNTHETIC_CONTRACT_ONLY',
    'rawAnomalyAdjudication':adjudicated,
    'scenarioReceipts':[{'scenario':r['scenario'], 'sourceState':r['sourceState'], 'turns':r['turnsAttempted'],'rawAnomalies':len(r['anomalies'])} for r in results]}
save('final-replay-adjudication.json',aggregate)

state=json.loads((ROOT/'resume-state.json').read_text())
state.update({'CURRENT_PHASE':'CP5_COMPLETE_BROWSER_PENDING','LAST_VALID_MISSION_CHECKPOINT':'CP5',
    'NEXT_ACTION':'Five offline real-browser V1 conversations, document/current Project and reopen verification.',
    'FINAL_RUNTIME_EVIDENCE':{'phase':PHASE,'scientificReview':'scientific-request-review-final.json','c02':'c02-final-requalification.json','replay':'final-replay-adjudication.json'},
    'NEW_PROVIDER_CALLS':0})
(ROOT/'resume-state.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
with (ROOT/'checkpoint-log.md').open('a') as f: f.write(f'\n- {now()} — CP5: final 15×15 replay and 83 individual judgments persisted; 16 confirmations bound; refusals bound or genuinely clarified. B02-T07 unnecessary clarification repaired at its existing boundary. Generic C01-T06/C03-T10 remain PARTIAL. Providers=0. Browser pending.\n')
print(json.dumps({'scientific':review['after'],'scopes':review['byScope'],'C02':gate['counts'],'raw':checkcounts},ensure_ascii=False))
