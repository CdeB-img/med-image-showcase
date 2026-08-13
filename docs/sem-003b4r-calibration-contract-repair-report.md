# SEM-003B4R — Calibration Contract Repair on Development Only

## Rapport de réparation et gel de l’évaluateur

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL — NIVEAU_3` |
| Date | 13 août 2026 |
| Périmètre | mode, provenance et représentation de l’autorité |
| Décision | `SEM003B4R_EVALUATOR_REPAIRED_READY_FOR_B4_RESTART` |

## 1. Résultat

Les deux défauts génériques constatés par SEM-003B4 sont réparés sans lire le contenu scientifique des dix cas Calibration et sans exécuter B4 :

1. l’évaluateur accepte désormais le mode générique `CALIBRATION_SYNTHETIC` uniquement avec la provenance `B4_SYNTHETIC_CALIBRATION`, une référence `CALIBRATION_VISIBLE` de purpose `CALIBRATION_AUTHORING`, une candidate de purpose `SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION` et une éligibilité Calibration explicite ;
2. le Level 2 consomme une décision séparément de son autorité, de sa base de preuve et de son éligibilité. `SIMULATED_PLURALISTIC_EXPERT_REVIEW` reste simulé de bout en bout et ne devient jamais `HUMAN_ADJUDICATION`.

Aucune règle scientifique, propriété SEM-002, failure class, métrique, attente Calibration ou décision PD-011 n’est ajoutée.

## 2. Nouvelle identité gelée

| Élément | Avant | Après |
|---|---|---|
| Evaluator version | `1.0.0` | `1.1.0` |
| Configuration digest | `13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5` | `b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd` |
| Code digest | — | `ddf0e9b81bcea7c46b79a2389ea5a4b4f3ecf9d8be4940833b2fecb04713681c` |
| Schemas digest | — | `7e608d8b66f1cda8f7b8accfc62e37eb88d1306ebec2434dc3cc4aefee19b5aa` |
| Property Registry digest | `f0db9a687df425fd844c80580914bb91b3c5382663307fa9aea696015c876a70` | inchangé |
| Failure taxonomy digest | `a5e45a03676b049c8a6478c66dfbd218fcd29954e48e38cc74ab850b6a950e2b` | inchangé |

`SEM003_EVALUATOR_POST_B4R_FREEZE_MANIFEST` enregistre aussi le digest des tests Development, celui des cinq décisions B3 et celui de l’audit anti-overfitting. Cette identité est la seule autorisée pour recommencer B4.

## 3. Contrats réparés

### 3.1 Mode et provenance

Les quatre modes représentables sont désormais :

- `DEVELOPMENT_SYNTHETIC` ;
- `CALIBRATION_SYNTHETIC` ;
- `FUTURE_SEM_RUNTIME` ;
- `HUMAN_ADJUDICATION`.

Le nouveau mode refuse les métadonnées Development, toute exposition blind et les provenances runtime ou humaines. Il ne modifie aucune règle de jugement Level 1.

### 3.2 Décision, autorité et éligibilité

Le nouveau `Adjudication Decision Record` conserve séparément : décision, `authorityClass`, `evidenceBasis`, décision source, base de revue, éligibilités, provenance et cible d’adjudication.

La capability matrix autorise `SIMULATED_PLURALISTIC_EXPERT_REVIEW` uniquement pour les tests Development de l’évaluateur et la calibration de développement. Elle interdit explicitement d’en déduire une preuve indépendante, une admission blind ou une preuve finale PD-011. `HUMAN_ADJUDICATION` reste une classe distincte ; sa fixture B4R est `CONTRACT_TEST_ONLY`, ne prétend pas qu’un humain a rendu une décision et ne possède aucune éligibilité.

## 4. Preuve Development et non-régression

| Contrôle | Résultat |
|---|---|
| Cas Development utilisés | `15/15` |
| Fixtures historiques | `41/41` — projection sémantique inchangée |
| Digest de non-régression historique | `69c2e322efdf1055a9a44e36c7ab61de550212f3938925c239537995ba20cdbd` |
| Équivalences B3 consommées | `5/5` |
| Disposition des cinq paires | `ACCEPTABLE_SEMANTIC_EQUIVALENT` |
| Autorité conservée | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` |
| Revue humaine réelle | `false` |
| Propriétés | `P01–P18` inchangées |
| Invariants absolus | `P01–P12` inchangés et non compensables |
| Failure taxonomy | inchangée |

La garde B3-C24 a été corrigée pour vérifier l’identité historique B3 dans les manifestes B3 gelés, plutôt que d’interdire toute version ultérieure de l’évaluateur. Les preuves B3 restent attachées à la version `1.0.0` et à son digest historique.

## 5. Audit anti-overfitting et frontières

| Contrôle | Résultat |
|---|---|
| Case IDs Calibration référencés par le correctif | `0` |
| Semantic keys Calibration référencées | `0` |
| Sorties candidates Calibration lues | `0` |
| Attentes ou métriques Calibration lues | `0` |
| Règles dérivées de Calibration | `NO` |
| Relabeling simulé → humain | `NO` |
| SEM modifié / exécuté | `NO / NO` |
| Appels LLM/provider | `0` |
| Calibration scientifique B4 exécutée | `NO` |
| Blind créé | `NO` |
| Seuil ou N fixé | `NO` |

## 6. Validations

| Validation | Résultat |
|---|---|
| Authoring validator/tests | `PASS — 17/17` |
| Corpus validator/tests | `PASS — 20/20` |
| B3 review validator/tests | `PASS — 29/29` |
| Evaluator validator/tests | `PASS — 7 schémas, 18 propriétés, 41 candidats, 5 décisions ; 10/10` |
| B4R tests | `PASS — 13/13 ; B4R-C01–C28 couverts` |
| Total de tests explicites | `PASS — 89/89` |
| Typecheck | `PASS` |
| Build | `PASS — avertissements Vite non bloquants préexistants` |
| `git diff --check` | `PASS` |

## 7. Limites et prochaine mission

L’évaluateur n’est toujours ni calibré ni qualifié. Aucun Measurement Protocol final, seuil, valeur de `N`, résultat Calibration, revue humaine indépendante, éligibilité blind ou PASS PD-011 n’existe.

`SEM003B4R_EVALUATOR_REPAIRED_READY_FOR_B4_RESTART`

Prochaine mission unique : `SEM-003B4 — RESTART FROM FROZEN BASELINE`.

B4 doit recommencer depuis le gel `1.1.0` ; aucun artefact du préflight interrompu ne peut être repris comme résultat de cette nouvelle identité.
