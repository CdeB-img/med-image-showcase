# SEM-003B3 — Simulated Calibration Reference Set Report

| Champ | Valeur |
|---|---|
| Statut | `OFFICIAL — LEVEL_3_EXECUTION_REPORT` |
| Version | 1.0 |
| Date d’état | 13 août 2026 |
| Nature | Rapport documentaire, architectural et méthodologique |
| Décision | `SEM003B3_SIMULATED_CALIBRATION_REFERENCE_SET_READY` |
| Autorité supérieure préservée | SEM-002 ; SEM-003 ; SEM-003B ; PD-011 |

## 1. Décision

Les dix références Calibration sont suffisamment stables pour préparer une calibration de développement B4. Elles sont désormais `CALIBRATION_VISIBLE` sur la base exclusive de `SIMULATED_PLURALISTIC_EXPERT_REVIEW`.

Cette décision ne constitue ni une revue humaine, ni une preuve indépendante, ni une qualification de SEM, ni une admission blind, ni un PASS PD-011.

## 2. Nature exacte de la revue

Une seule revue pluraliste simulée a été réalisée à travers trois personas distinctes :

- `REVIEWER_SIM_1 — SCIENTIFIC_DOMAIN_SPECIALIST` : cohérence scientifique, obligations, interdictions, candidats contextuels et ambiguïtés métier ;
- `REVIEWER_SIM_2 — METHODOLOGY_AND_OBS_SPECIALIST` : méthode, mesure, phénomène, observable, temporalité, comparateurs, clarification et frontières OBS ;
- `REVIEWER_SIM_3 — SEMANTIC_BENCHMARK_AND_GOVERNANCE_SPECIALIST` : statut épistémique, ownership, équivalence, parenté, contamination et gouvernance.

Chaque persona a produit un avis séparé pour chacune des quinze unités prioritaires. Le registre contient donc 45 avis de rôle et 48 dispositions simulées consolidées : 43 sur les dix références Calibration et cinq sur les équivalences Development.

Les identités `REVIEWER_SIM_1`, `REVIEWER_SIM_2` et `REVIEWER_SIM_3` ne doivent jamais être réinterprétées comme des identités humaines.

## 3. Résultats Calibration

| Mesure | Résultat |
|---|---:|
| Candidats examinés | 10 |
| `CALIBRATION_VISIBLE` | 10 |
| `DESIGN_ONLY` restant | 0 |
| Rejet | 0 |
| Incertitude empêchant la référence simulée | 0 |
| Items B1 résolus par la simulation | 39 |
| Items Development non bloquants encore ouverts | 23 |

Pour chaque référence admise :

- `referenceReviewBasis = SIMULATED_PLURALISTIC_EXPERT_REVIEW` ;
- `SIMULATED_REFERENCE_REVIEW = COMPLETE` ;
- `REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED` ;
- `FINAL_PD011_REFERENCE_ELIGIBILITY = NO` ;
- `BLIND_ELIGIBILITY = NO` ;
- `eligibleForCalibration = true` pour la calibration de développement ;
- `eligibleForFormalIndependentQualification = false` ;
- `eligibleForBlindQualification = false`.

Le cas `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` reste assorti d’une réserve scientifique future : la sélection d’un modèle de relation signal–histologie nécessite une expertise spécialisée. Cette réserve ne bloque pas le jugement sémantique actuellement évalué, car le benchmark exige précisément de ne sélectionner ni adopter ce modèle.

## 4. Correction objective versionnée

`SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` contenait une incohérence documentaire : la demande source citait l’échographie ovarienne tandis que la description d’ambiguïté citait l’IRM.

La correction unique est :

`L'usage scientifique de l'IRM est indécis.`

vers :

`L'usage scientifique de l'échographie ovarienne est indécis.`

Le Case et l’Acceptance Envelope passent de 1.0.0 à 1.0.1. Les trois interprétations — détection, caractérisation et suivi — restent inchangées. L’état 1.0.0 reste reconstructible au commit `8aad0e7`; les digests avant/après et les deux pointeurs modifiés sont enregistrés dans `semantic-validation/sem-003/review/artifacts/reference-revision-lineage.json`.

Aucune autre référence n’a reçu de révision de contenu.

## 5. Équivalences Development

Les cinq paires B2 portent désormais la disposition `SIMULATED_SEMANTICALLY_EQUIVALENT` après trois avis distincts portant respectivement sur les conséquences scientifiques, l’équivalence méthodologique et l’équivalence sémantique/ownership/provenance.

Le Level 1 vert n’a pas été utilisé comme preuve suffisante. Les dispositions simulées sont utilisables pour les tests Development de l’évaluateur et restent `independentQualificationEvidence = false`.

Le replay déterministe de l’évaluateur est entièrement vert : six schémas, 18 propriétés, 15 cas Development, 41 candidats et 10/10 tests. Aucun cas Calibration n’a servi à modifier ou régler l’évaluateur ; aucune réparation n’a été nécessaire.

## 6. Calibration Reference Set

Le manifeste machine `semantic-validation/sem-003/review/artifacts/calibration-reference-set.json` contient les dix paires Case/Envelope, leurs versions, leurs digests, leurs décisions simulées et leurs exclusions.

Son état est `READY_FOR_B4_DEVELOPMENT_CALIBRATION`. B3 n’autorise et n’exécute pas B4.

## 7. Distinction opérationnelle avec PD-011

PD-011 n’est pas modifié. La présente opération distingue seulement deux niveaux de preuve :

- développement/calibration de l’instrument : revue experte simulée explicitement étiquetée, utilisable pour tester les références et préparer la mesure ;
- qualification indépendante finale : références humaines indépendantes, protocole, métriques, répétitions, seuils, blind package et décision confirmatoire relevant des autorités applicables.

La revue simulée ne satisfait aucune gate de la seconde catégorie.

## 8. Validations déterministes

| Contrôle | Résultat |
|---|---|
| Génération corpus | PASS — 15 Development, 10 Calibration visibles, 25 cas |
| Validation corpus | PASS |
| Tests corpus | PASS — 20/20 |
| Génération revue | PASS — 25 unités, 15 prioritaires, 48 dispositions simulées |
| Validation revue | PASS — 23 ouverts, 39 résolus, 10 visibles |
| Tests revue | PASS — 29/29 |
| Validation évaluateur | PASS — 6 schémas, 18 propriétés, 41 candidats |
| Tests évaluateur | PASS — 10/10 |

## 9. Exclusions confirmées

- aucune exécution Calibration B4 ;
- aucune exécution SEM ;
- aucun appel LLM/provider ;
- aucune modification de l’évaluateur ;
- aucun réglage depuis Calibration ;
- aucun nombre de runs, seuil ou score fixé ;
- aucun Blind Set créé ;
- aucune qualification indépendante ;
- aucun PASS/FAIL scientifique ;
- aucun push ni déploiement.

## 10. Clôture

`SEM003B3_SIMULATED_CALIBRATION_REFERENCE_SET_READY`

La prochaine phase autorisée est la conception puis l’exécution séparée de B4 sur ce Calibration Reference Set. Toute revendication confirmatoire restera interdite tant que les exigences humaines indépendantes et PD-011 applicables ne seront pas satisfaites.
