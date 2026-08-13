# SEM-003B4 — Evaluator Calibration & Measurement Protocol

## Rapport de préflight et arrêt obligatoire avant Calibration

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL — NIVEAU_3` |
| Date | 13 août 2026 |
| Baseline Git | `bec2662448644f5643536e649645de976fe2d0d5` |
| Evaluator | version `1.0.0` |
| Digest avant/après | `13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5` — inchangé |
| Décision | `SEM003B4_EVALUATOR_REPAIR_REQUIRED` |

## 1. Décision

La Calibration n’a pas commencé. Le gel pré-exécution est valide, mais l’évaluateur B2/B3 ne possède aucun chemin contractuel véridique pour évaluer des candidats synthétiques B4 contre les dix références `CALIBRATION_VISIBLE`.

Conformément aux conditions d’arrêt de B4, aucun candidat, aucune attente, aucun résultat, aucune métrique, aucun seuil et aucun manifeste d’évaluateur calibré n’ont été produits après ce constat.

## 2. Evaluator freeze

Le manifeste `B4_CALIBRATION_BASELINE_MANIFEST` fige :

- l’évaluateur version `1.0.0` et son digest de configuration ;
- le code, les six schémas, le registre P01–P18 et la failure taxonomy ;
- les dix références B3 avec leurs versions et digests, dont le cas ovarien en `1.0.1` ;
- les quinze références Development et les preuves B2/B3 associées ;
- l’environnement logiciel et le HEAD de départ.

Les digests avant et après le préflight sont identiques. L’évaluateur n’a pas été modifié.

## 3. Deux défauts génériques bloquants

### 3.1 Mode synthétique Calibration absent

Le contrat gelé accepte trois modes :

- `DEVELOPMENT_SYNTHETIC`, réservé par le noyau aux cas `DEVELOPMENT_AUTHORING` et `DEVELOPMENT_VISIBLE` ;
- `FUTURE_SEM_RUNTIME`, réservé aux sorties `FUTURE_SEM_RUNTIME_OUTPUT` ;
- `HUMAN_ADJUDICATION`, réservé aux sorties `HUMAN_ADJUDICATED_OUTPUT`.

Or les dix références B3 sont `CALIBRATION_AUTHORING` et `CALIBRATION_VISIBLE`, tandis que les candidats demandés par B4 doivent porter une provenance synthétique B4 et ne sont pas des sorties SEM. Les reclasser en Development, runtime SEM ou décision humaine falsifierait la provenance ou le statut d’exposition.

### 3.2 Dispositions simulées B3 non consommables au Level 2

Les cinq équivalences Development portent `SIMULATED_SEMANTICALLY_EQUIVALENT`. Le seul contrat de décision consommable par le Level 2 exige l’autorité constante `HUMAN_ADJUDICATION`. Utiliser les décisions B3 dans ce contrat les transformerait à tort en revues humaines, contrairement à leur provenance gouvernée.

Le contrôle B4-C10 est donc bloquant : les décisions B3 ne peuvent pas être consommées correctement par B2 sans évolution générique de contrat.

## 4. Calibration et mesure

| Élément | État |
|---|---|
| Calibration cases gelés | 10 |
| Fixtures synthétiques | 0 |
| Attentes préengagées | 0 |
| Résultats observés | 0 |
| Propriétés mesurées P01–P18 | 0 — `NOT_EXECUTED_AFTER_STOP` |
| Invariants P01–P12 | 12/12 confirmés absolus et non compensables ; sensibilité non mesurée |
| Équivalences B3 | 5 disponibles ; 0 consommable sans fausse attribution humaine |
| Dispositions mesurées | 0 |
| Failure classes mesurées | 0 |
| Répétitions | `NOT_APPLICABLE — deterministic calibration not started` |
| Measurement Protocol | `NOT_PRODUCED_BY_MANDATORY_STOP` |
| Seuils | `THRESHOLD_NOT_YET_ADMITTED` |
| `NOT_EVALUABLE` | contrat B2 présent ; comportement B4 non calibré |

Aucune décision READY n’est recevable. La qualité, la discrimination et la reproductibilité de l’instrument restent non mesurées.

## 5. Anti-overfitting et frontières

| Contrôle | Résultat |
|---|---|
| Calibration utilisée pour tuner l’évaluateur | `NO` |
| Références modifiées après freeze/exécution | `NO` |
| Attentes modifiées post hoc | `NO` |
| Case ID Calibration dans le noyau | `0` |
| Semantic key Calibration dans le noyau | `0` |
| SEM modifié ou exécuté | `NO` |
| Appels LLM/provider | `0` |
| Browser/downstream | `NOT_EXECUTED` |
| Blind créé | `NO` |
| Qualification SEM/PD-011 | `NO` |
| Revue humaine réelle | `NOT_PERFORMED` |
| Éligibilité finale PD-011 | `NO` |
| Éligibilité blind | `NO` |

## 6. Contrôles et validations

Le préflight attribue un état explicite aux trente contrôles B4 : dix préconditions passent, B4-C10 révèle le défaut bloquant et dix-neuf contrôles restent `NOT_EXECUTED_AFTER_STOP`. Aucun contrôle non exécuté n’est compté comme réussite.

| Validation | Résultat |
|---|---|
| Authoring validator/tests | `PASS — 3 exemples ; 17/17 tests` |
| Corpus validator/tests | `PASS — 25 couples ; 20/20 tests` |
| Evaluator validator/tests | `PASS — 6 schémas, 18 propriétés, 41 candidats ; 10/10 tests` |
| B3 review validator/tests | `PASS — 23 ouverts, 39 résolus, 10 visibles ; 29/29 tests` |
| B4 preflight validator/tests | `PASS — 11/11 tests ; décision bloquante conservée` |
| Typecheck | `PASS` |
| Build | `PASS — avertissements Vite non bloquants préexistants` |
| `git diff --check` | `PASS` |

Ces succès techniques valident le gel et le diagnostic. Ils ne calibrent pas l’évaluateur.

## 7. Modification minimale nécessaire

Une mission séparée, exécutée uniquement sur Development, doit :

1. ajouter un mode générique `CALIBRATION_SYNTHETIC` et une provenance `B4_SYNTHETIC_CALIBRATION`, sans connaissance de cas ;
2. ajouter un adapter d’adjudication qui conserve explicitement `SIMULATED_PLURALISTIC_EXPERT_REVIEW` sans le transformer en `HUMAN_ADJUDICATION` ;
3. versionner l’évaluateur et recalculer son identité ;
4. valider ces mécanismes uniquement sur Development ;
5. produire un nouveau freeze, puis recommencer B4 depuis zéro.

Les références Calibration B3 ne doivent pas être utilisées pour développer cette réparation.

## 8. Clôture

`SEM003B4_EVALUATOR_REPAIR_REQUIRED`

Prochaine mission unique : `SEM-003B4R — Calibration Contract Repair on Development Only`.

SEM-003C n’est pas autorisé.
