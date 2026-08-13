# SEM-003B1 — Development & Calibration Scientific Case Authoring

## Rapport de construction du premier corpus réel de compréhension scientifique

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL` |
| Niveau documentaire | `NIVEAU_3 — rapport de mission` |
| Source maîtresse | `docs/sem-003b1-development-calibration-scientific-case-authoring-report.md` |
| Date | 13 août 2026 |
| Corpus | `SEM-003B1-DEVELOPMENT-CALIBRATION-CORPUS` version `1.0.0` |
| Baseline Git d’authoring | `1423090348b6caf6dd719f5ca030c29d1e99de38` |
| Index après clôture | version `1.33`, `OFFICIAL` |
| Décision | `SEM003B1_DEVELOPMENT_READY_CALIBRATION_REVIEW_REQUIRED` |

---

## 1. Décision et portée

Le corpus Development est `DEVELOPMENT_CORPUS_READY_FOR_EVALUATOR_DEVELOPMENT`. Il contient des références candidates suffisamment structurées pour construire le futur évaluateur, sans prétendre qu’elles ont reçu une adjudication scientifique humaine définitive.

Les dix cas destinés à la Calibration sont `CALIBRATION_AUTHORING_CANDIDATE_READY`, restent `DESIGN_ONLY` et portent `HUMAN_REVIEW_REQUIRED`. Aucun cas n’est `CALIBRATION_VISIBLE` : les preuves de revue humaine et la gate SEM-003B n’existent pas encore.

La mission n’a ni évalué ni modifié SEM. Elle n’a produit ni score, ni seuil, ni valeur de N, ni qualification PASS/FAIL, ni blind set.

## 2. Corpus produit

| Indicateur | Résultat |
|---|---:|
| Development | 15 |
| Candidats Calibration `DESIGN_ONLY` | 10 |
| Calibration réellement visible | 0 |
| Total | 25 |
| Tours de conversation | 134 |
| Single-turn | 5 |
| Multi-turn | 20 — 80 % |
| Multi-turn réellement dépendants du contexte | 20 |
| Cas dépassant 7 tours | 5 |
| Difficulté | 3 BASIC ; 4 INTERMEDIATE ; 11 ADVANCED ; 7 COMPOSITIONAL |
| Exemples synthétiques pour développement futur de l’évaluateur | 5 cas, jamais présentés comme sorties SEM |
| Artefacts machine du corpus | 59 fichiers ; 58 inventoriés avec digest, manifeste auto-exclu |

Répartition des domaines : 10 cas cardiovasculaires/imagerie cardiovasculaire (40 %), 7 autres domaines d’imagerie médicale (28 %) et 8 cas transversaux cliniques ou biomédicaux (32 %).

## 3. Couverture

- catégories SEM-003 : 15/15 ; aucune absente ;
- propriétés SEM-002 : 18/18 ; aucune absente ;
- missing information : 24 cas ;
- ambiguïté : 8 cas ;
- enrichissement contextuel : 7 cas ;
- correction : 7 cas ; changement d’avis : 5 cas ;
- négation/non-causalité : 6 cas ;
- méthode/mesure : 6 cas ; phénomène/observable : 6 cas ;
- frontière d’ownership : 21 cas.

Les fréquences ne constituent ni pondération ni seuil. La matrice complète se trouve dans `semantic-validation/sem-003/corpus/coverage/coverage-matrix.json`.

## 4. Synthèse des cas

| Case | Set | Groupe | Tours | Difficulté | Catégorie principale | Propriétés majeures |
|---|---|---|---:|---|---|---|
| SEM3-DEV-CARDIAC-AGING-TRAJECTORY | DEV | CARDIO | 8 | COMPOSITIONAL | CHANGE_OF_MIND | correction ; timing ; provenance |
| SEM3-DEV-CORONARY-PERFUSION-PRIORITY | DEV | CARDIO | 7 | ADVANCED | ELLIPSIS | relations ; timing ; contenu explicite |
| SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE | DEV | CARDIO | 6 | ADVANCED | METHOD_VERSUS_MEASUREMENT | plans conceptuels ; relations ; contenu |
| SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL | DEV | CARDIO | 8 | COMPOSITIONAL | MULTIDIMENSIONAL_REQUEST | correction ; timing ; polarité |
| SEM3-DEV-PERICARDIAL-FAT-NONCAUSAL | DEV | CARDIO | 5 | ADVANCED | NEGATION_AND_NON_CAUSALITY | correction ; non-causalité ; relations |
| SEM3-DEV-PLAQUE-INTERVENTION-CONTEXT | DEV | CARDIO | 6 | ADVANCED | INTERVENTION_AND_IMAGING | timing ; contenu ; relations |
| SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN | DEV | OTHER_IMG | 7 | COMPOSITIONAL | UNDER_SPECIFIED_REQUEST | timing ; relations ; information manquante |
| SEM3-DEV-BODY-COMPOSITION-AMBIGUITY | DEV | OTHER_IMG | 1 | INTERMEDIATE | SCIENTIFIC_AMBIGUITY | ambiguïté ; plans conceptuels ; relations |
| SEM3-DEV-PANCREATIC-COMPOSITION-LONGITUDINAL | DEV | OTHER_IMG | 5 | INTERMEDIATE | COMPLETE_SCIENTIFIC_REQUEST | timing ; contenu ; plans conceptuels |
| SEM3-DEV-INTESTINAL-MOTILITY-METHOD | DEV | OTHER_IMG | 1 | BASIC | METHOD_VERSUS_MEASUREMENT | contenu ; plans conceptuels ; information manquante |
| SEM3-DEV-OUTCOME-PRIORITY-CHANGE | DEV | TRANSVERSAL | 6 | COMPOSITIONAL | CHANGE_OF_MIND | correction ; timing ; relations |
| SEM3-DEV-TRANSLATIONAL-HYPOXIA-CANDIDATES | DEV | TRANSVERSAL | 4 | ADVANCED | KNOWLEDGE_CANDIDATE | contenu ; relations ; provenance |
| SEM3-DEV-ROUTINE-DATA-COMPARATOR-GAP | DEV | TRANSVERSAL | 1 | BASIC | UNDER_SPECIFIED_REQUEST | contenu ; timing ; ambiguïté |
| SEM3-DEV-INFLAMMATION-MULTIDIMENSIONAL | DEV | TRANSVERSAL | 6 | ADVANCED | STRONG_CONTEXTUAL_IMPLICIT | timing ; provenance ; polarité |
| SEM3-DEV-TRIAL-IMAGING-OUTCOME-CORRECTION | DEV | TRANSVERSAL | 8 | COMPOSITIONAL | MULTI_TURN_CORRECTION | relations ; timing ; correction |
| SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP | CAL | CARDIO | 7 | ADVANCED | COMPARISON_AND_TIMING | timing ; contenu ; provenance |
| SEM3-CAL-ATRIAL-FIBROSIS-ABLATION | CAL | CARDIO | 6 | ADVANCED | INTERVENTION_AND_IMAGING | timing ; contenu ; ambiguïté |
| SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS | CAL | CARDIO | 8 | COMPOSITIONAL | ELLIPSIS | contenu ; relations ; correction |
| SEM3-CAL-CARDIO-RHYTHM-REMODELING | CAL | CARDIO | 5 | ADVANCED | NEGATION_AND_NON_CAUSALITY | relations ; timing ; correction |
| SEM3-CAL-NEURODEGENERATION-PROGRESSION | CAL | OTHER_IMG | 1 | INTERMEDIATE | COMPLETE_SCIENTIFIC_REQUEST | timing ; contenu ; plans conceptuels |
| SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY | CAL | OTHER_IMG | 1 | BASIC | SCIENTIFIC_AMBIGUITY | ambiguïté ; plans conceptuels ; contenu |
| SEM3-CAL-MSK-INFLAMMATION-RESPONSE | CAL | OTHER_IMG | 6 | ADVANCED | STRONG_CONTEXTUAL_IMPLICIT | timing ; relations ; provenance |
| SEM3-CAL-CORTISOL-SAMPLING-SUMMARY | CAL | TRANSVERSAL | 5 | INTERMEDIATE | METHOD_VERSUS_MEASUREMENT | timing ; plans conceptuels ; information manquante |
| SEM3-CAL-TRIAL-COMPARATOR-DECISION | CAL | TRANSVERSAL | 7 | ADVANCED | UNDER_SPECIFIED_REQUEST | timing ; contenu ; ambiguïté |
| SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT | CAL | TRANSVERSAL | 9 | COMPOSITIONAL | MULTIDIMENSIONAL_REQUEST | contenu ; correction ; plans conceptuels |

## 5. Revues, parenté et contamination

La Review Queue contient 62 items et zéro item `BLOCKING` : 25 revues scientifiques, 9 revues méthodologiques, 10 gates Calibration, 10 revues de parenté et 8 adjudications d’ambiguïté. Aucune approbation humaine n’est inventée.

L’audit d’authoring n’identifie aucun doublon évident, aucune reprise de H01–H30, aucune réutilisation d’un exemple SEM-002/SEM-003 comme Calibration et aucun blocage de contamination. La vérification historique a été ciblée sur les 30 `originalRequest` des checkpoints R5P ; ni leurs sorties, ni leurs Gold, ni leurs décisions d’évaluation n’ont servi à écrire le corpus. Cette conclusion n’est pas une revue indépendante : les dix candidats Calibration restent `PARENTAGE_REVIEW_REQUIRED`.

Development et Calibration couvrent des familles de compétences comparables avec des faits discriminants, domaines, ambiguïtés, temporalités et chaînes de raisonnement distincts. Aucun cas Calibration n’est une traduction, paraphrase ou difficulté augmentée d’un cas Development.

## 6. Contrat et validations

Le Case Schema version 1.1.0 reçoit une extension additive et générique des classes de difficulté `BASIC`, `INTERMEDIATE`, `ADVANCED` et `COMPOSITIONAL`, tout en conservant la lecture des fixtures 1.0.0. Aucun objet métier, runtime SEM ou jugement scientifique automatique n’est ajouté.

| Validation | Résultat |
|---|---|
| 25 Case + 25 Acceptance Envelopes | `PASS` |
| Contrats SEM-003B existants | `PASS` — 3/3 fixtures, 17/17 tests |
| Validateur corpus | `PASS` — structure et contrats uniquement |
| Tests corpus | `PASS` — 20/20 |
| Registre, couverture, parenté, review queue et digests | `PASS` |
| Liens locaux | `PASS` — aucune référence locale manquante |
| Typecheck | `PASS` |
| Build | `PASS` — avertissements Vite non bloquants préexistants |
| `git diff --check` | `PASS` |
| Fichiers SEM fonctionnels modifiés | `NO` |

## 7. Limites et prochaine gate

- les références restent candidates jusqu’aux revues scientifiques et méthodologiques applicables ;
- les dix candidats Calibration ne peuvent pas être utilisés formellement avant gate humaine ;
- aucune qualification de l’évaluateur, calibration de métriques ou campagne n’a eu lieu ;
- aucun cas ne peut devenir aveugle ; le futur blind set devra utiliser des contenus entièrement nouveaux ;
- les connaissances contextuelles candidates sont explicitement non exhaustives et soumises à revue.

Prochaine mission unique recommandée : `SEM-003B2 — Scientific Understanding Evaluator Development & Calibration`, d’abord sur Development, puis sur les candidats Calibration seulement après les revues requises.

## 8. Frontières finales

- `SEM modified = NO`
- `SEM runtime executed = NO`
- `LLM/provider calls = 0`
- `H01–H30 reused = NO`
- `Calibration performed = NO`
- `Blind set created = NO`
- `N fixed = NO`
- `Thresholds fixed = NO`
- `PASS/FAIL qualification performed = NO`
- `Human reviews invented = NO`

Décision finale :

`SEM003B1_DEVELOPMENT_READY_CALIBRATION_REVIEW_REQUIRED`
