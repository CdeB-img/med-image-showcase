# SEM-003B4 — Evaluator Calibration & Measurement Protocol

## Rapport du redémarrage intégral sur évaluateur 1.1.0

**Statut :** OFFICIAL

**Niveau documentaire :** NIVEAU_3

**Version :** 1.0

**Date d’état :** 14 août 2026

**Source maîtresse :** présent fichier Markdown

**Décision :** `SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION`

---

## 1. Nature et portée

Ce rapport clôt le redémarrage intégral de SEM-003B4 depuis le gel B4R. Il porte exclusivement sur l’évaluateur déterministe de compréhension scientifique version 1.1.0 et sur le protocole technique permettant de l’utiliser comme futur instrument de mesure.

Il ne teste pas SEM. Il ne qualifie ni SEM, ni un provider, ni une compétence scientifique en production. Il ne crée, n’exécute ou n’expose aucun jeu aveugle.

La décision positive autorise uniquement la phase suivante de construction indépendante et de scellement du benchmark aveugle.

---

## 2. Autorités et état documentaire

L’opération a été conduite selon l’ordre de lecture gouverné par le `SOURCE-OF-TRUTH-INDEX`, puis la Charte fondatrice, le Scientific Product Manifesto V2, l’Architecture Manifesto externe de l’Editorial Engine, SEM-002, SEM-003, SEM-003B, les états SEM-003B1 à B4R, PD-003 V2, OBS-001, PD-009 et PD-011.

Les niveaux de preuve sont restés séparés :

- les principes et contrats admis gouvernent les propriétés et les frontières ;
- les dix références B3 sont un corpus `CALIBRATION_VISIBLE` fondé sur une revue simulée ;
- les fixtures B4 sont des instruments synthétiques visibles ;
- les résultats B4 décrivent le comportement technique déterministe de l’évaluateur ;
- aucune preuve humaine, aveugle ou confirmatoire PD-011 n’est créée.

Les bornes suivantes restent impératives :

- `REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED` ;
- `FINAL_PD011_REFERENCE_ELIGIBILITY = NO` ;
- `BLIND_ELIGIBILITY = NO` ;
- `SEM_QUALIFICATION = NOT_CLAIMED`.

---

## 3. Deux états B4 explicitement distincts

### 3.1 PREVIOUS INTERRUPTED PREFLIGHT — evaluator 1.0.0

Le rapport `docs/sem-003b4-evaluator-calibration-and-measurement-protocol-report.md` conserve l’état historique B4 initial :

- évaluateur : 1.0.0 ;
- digest : `13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5` ;
- décision : `SEM003B4_EVALUATOR_REPAIR_REQUIRED` ;
- zéro fixture Calibration exécutée ;
- zéro résultat observé.

Cet échec préflight n’est ni supprimé, ni requalifié rétrospectivement.

### 3.2 B4 RESTART — evaluator 1.1.0

Le présent rapport porte sur le nouvel état actif :

- évaluateur : 1.1.0 ;
- digest : `b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd` ;
- décision B4R préalable : `SEM003B4R_EVALUATOR_REPAIRED_READY_FOR_B4_RESTART` ;
- mode : `CALIBRATION_SYNTHETIC` ;
- provenance : `B4_SYNTHETIC_CALIBRATION`.

Les preuves de l’ancien préflight restent dans `semantic-validation/sem-003/calibration/`. Les preuves du redémarrage sont isolées dans `semantic-validation/sem-003/calibration/restart-v1.1.0/`.

---

## 4. Gel et préengagement avant observation

### 4.1 Baseline

Le gel actif est lié au commit `872b4b51f30d5f137d3aa920d689286626aa5dc7`. Il fige avant le premier candidat :

- l’identité et le digest de l’évaluateur ;
- les dix paires Case/Acceptance Envelope B3 et leurs versions ;
- les preuves simulées et les cinq équivalences B3 ;
- les 38 fixtures Calibration ;
- les 108 décisions simulées nécessaires aux sondes Level 2 ;
- les attentes par fixture ;
- les règles de mesure ;
- les taxonomies de dispositions et d’échecs ;
- la règle `NOT_EVALUABLE ≠ PASS` ;
- la règle terminale B4.

Le commit `94f8bdd` a enregistré le premier préengagement. Une première tentative de lancement s’est arrêtée avant le premier candidat parce que le contrôleur de propreté résolvait le répertoire parent de la racine Git NOXIA. Aucun résultat n’a été produit ou observé. La correction bornée du harnais et le nouveau gel ont été enregistrés dans `872b4b5` avant toute exécution de l’évaluateur.

### 4.2 Protocole figé

Le protocole machine est `semantic-validation/sem-003/calibration/restart-v1.1.0/precommitment/measurement-protocol.json`.

Il impose :

- aucune métrique composite ;
- un comptage séparé par famille et disposition ;
- `N = 1` par fixture déterministe ;
- un replay uniquement pour vérifier l’identité déterministe des sorties ;
- aucune sélection du meilleur résultat ;
- aucune exclusion silencieuse ;
- aucune modification post-observation de l’évaluateur, d’une fixture, d’une attente, d’une métrique ou d’une règle de décision.

---

## 5. Matrice exécutée

| Famille | Nombre | Fonction |
|---|---:|---|
| Références conformes | 10 | Vérifier les mappings absolus et la consommation des décisions Level 2 simulées |
| Sondes négatives P01–P12 | 12 | Vérifier la détection non compensable et l’absence de faux PASS |
| Sondes Level 2 satisfaites P13–P18 | 6 | Vérifier la consommation des décisions positives préengagées |
| Sondes Level 2 violées P13–P18 | 6 | Vérifier la consommation des décisions négatives préengagées |
| Variation acceptable avec réserve P17 | 1 | Distinguer `ACCEPTABLE_NONCRITICAL_VARIATION` |
| Dispositions limites | 3 | Distinguer fail-closed, indisponibilité provider synthétique et non-évaluabilité |
| **Total Calibration** | **38** | Toutes les observations sont comptées |
| Équivalences Development B3 | 5 | Vérifier Level 2 avec l’autorité simulée B3 conservée |

Les 43 évaluations ont reçu un replay déterministe. Les replays ne constituent pas des runs indépendants supplémentaires.

---

## 6. Résultats

### 6.1 Résultat global

- attentes Calibration : **38/38 conformes** ;
- écarts aux attentes : **0** ;
- replays Calibration identiques : **38/38** ;
- équivalences B3 : **5/5 conformes** ;
- replays équivalence identiques : **5/5** ;
- appels LLM/provider : **0** ;
- modification de l’évaluateur pendant Calibration : **NO**.

### 6.2 Propriétés P01–P18

| Propriétés | Nature | Sondes ciblées conformes | Règle ou seuil |
|---|---|---:|---|
| P01–P12 | invariants Safety/Fidelity | **12/12** | absolus, non compensables |
| P13 | information critique manquante | **2/2** | `THRESHOLD_NOT_YET_ADMITTED` |
| P14 | séparation des plans conceptuels | **2/2** | `THRESHOLD_NOT_YET_ADMITTED` |
| P15 | équivalence sémantique | **2/2** | `THRESHOLD_NOT_YET_ADMITTED` |
| P16 | valeur décisionnelle de la clarification | **2/2** | `THRESHOLD_NOT_YET_ADMITTED` |
| P17 | variation non critique | **3/3** | `THRESHOLD_NOT_YET_ADMITTED` |
| P18 | pertinence des candidats contextuels | **2/2** | `THRESHOLD_NOT_YET_ADMITTED` |

Les sondes P13–P18 prouvent que l’évaluateur consomme et applique correctement des décisions simulées préengagées. Elles ne mesurent pas l’exactitude d’un jugement scientifique humain indépendant et n’admettent aucun seuil de compétence SEM.

### 6.3 Invariants absolus

Les douze sondes négatives ciblées ont toutes été détectées. Aucun candidat portant une violation ciblée P01–P12 n’a reçu une disposition acceptable. Le nombre de faux PASS ciblés est **0**. Une moyenne ou un résultat Level 2 ne compense aucune violation absolue.

### 6.4 Équivalences

Les cinq représentations distribuées B3 ont reçu `ACCEPTABLE_SEMANTIC_EQUIVALENT`. Leurs décisions restent :

- `authorityClass = SIMULATED_PLURALISTIC_EXPERT_REVIEW` ;
- `realHumanReview = false` ;
- `formalIndependentQualification = false` ;
- `blindReferenceAdmission = false` ;
- `pd011FinalEvidence = false`.

Le résultat démontre la consommation correcte du Level 2 et l’absence de rejet fondé uniquement sur la forme. Il ne transforme pas les cinq adjudications en décisions humaines.

### 6.5 Dispositions

| Disposition | Nombre | Interprétation |
|---|---:|---|
| `ACCEPTABLE_SEMANTIC_EQUIVALENT` | 16 | Références et sondes positives attendues |
| `ACCEPTABLE_NONCRITICAL_VARIATION` | 1 | Variation P17 avec réserve préengagée |
| `SEMANTIC_FAILURE` | 18 | Violations intentionnelles P01–P18 |
| `SAFE_FAIL_CLOSED` | 1 | Disposition sûre, non comptée comme compréhension |
| `PROVIDER_EXECUTION_FAILURE` | 1 | Sonde contractuelle synthétique, sans provider réel |
| `NOT_EVALUABLE` | 1 | Disposition distincte d’un PASS |
| **Total** | **38** | Comptabilité exhaustive |

### 6.6 Failure classes exercées

Douze classes ont été réellement observées dans les sondes :

- `EXPLICIT_FIDELITY_FAILURE` : 5 constats ;
- `RELATION_SEMANTICS_FAILURE` : 1 ;
- `POLARITY_OR_CAUSALITY_FAILURE` : 5 ;
- `PROVENANCE_FAILURE` : 2 ;
- `CONCEPTUAL_PLAN_COLLAPSE` : 3 ;
- `MISSING_INFORMATION_FAILURE` : 2 ;
- `OWNERSHIP_BOUNDARY_FAILURE` : 2 ;
- `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` : 2 ;
- `CLARIFICATION_FAILURE` : 1 ;
- `CONTEXTUAL_UNDERSTANDING_FAILURE` : 1 ;
- `PROVIDER_EXECUTION_FAILURE` : 1 ;
- `QUALIFICATION_PROTOCOL_FAILURE` : 1.

Ces nombres décrivent les défauts intentionnellement injectés et les dispositions limites. Ils ne sont pas un taux d’échec de l’évaluateur.

---

## 7. Protocole de mesure retenu

Le protocole est suffisant pour employer l’évaluateur comme instrument lors d’une future qualification indépendante, sous les conditions suivantes :

1. figer avant le blind le provider, le modèle, les prompts, les schémas, l’adapter runtime, l’évaluateur et leurs digests ;
2. préenregistrer sous PD-011 les métriques, `N`, seuils, comparateurs, traitements des sorties non évaluables et règle de campagne ;
3. compter tous les runs, sans meilleur run ;
4. appliquer P01–P12 comme portes absolues non compensables ;
5. évaluer P13–P18 sur leur distribution, avec les seuils encore à admettre ;
6. distinguer échec provider, fail-closed, non-évaluabilité et échec sémantique ;
7. faire adjuger les cas aveugles selon une autorité réelle et indépendante ;
8. arrêter toute campagne aveugle avant réparation et retirer de l’aveugle tout cas exposé.

B4 n’admet volontairement aucun seuil P13–P18. Leur calibration scientifique requiert un corpus humain et une future décision PD-011 distincte.

---

## 8. Incertitudes et limites

- La validité scientifique indépendante des références reste non démontrée.
- Les références visibles B3 ne pourront pas devenir des preuves blind.
- L’exactitude de l’adjudication experte n’est pas mesurée par les décisions simulées.
- La performance sur un contenu scientifique réellement inédit reste inconnue.
- La fidélité du futur adapter SEM runtime reste hors périmètre.
- La variabilité et la fiabilité d’un provider restent hors périmètre.
- `N = 1` est une propriété du test technique déterministe, pas un seuil scientifique.
- Aucun score agrégé de compétence n’est calculé.
- Aucun PASS SEM ou PASS PD-011 n’est prononcé.

---

## 9. Audit anti-overfitting

| Contrôle | Résultat |
|---|---|
| Préengagement committé avant observation | PASS |
| Worktree propre avant première observation | PASS |
| Évaluateur modifié pendant Calibration | NO |
| Fixture ou attente modifiée après observation | NO |
| Métrique ou règle de décision modifiée après observation | NO |
| Gold ou Acceptance Envelope modifié | NO |
| Sélection du meilleur run | NO |
| Réparation post-observation | NO |
| Contenu blind créé ou consulté | NO |
| Appel LLM/provider | 0 |

---

## 10. Preuves machine

Les preuves principales sont :

- `semantic-validation/sem-003/calibration/restart-v1.1.0/precommitment/calibration-freeze-manifest.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/precommitment/fixture-expectation-manifest.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/precommitment/measurement-protocol.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/calibration-execution-manifest.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/property-level-results.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/failure-disposition-results.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/equivalence-results.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/uncertainty-limitations.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/evaluator-calibration-manifest.json` ;
- `semantic-validation/sem-003/calibration/restart-v1.1.0/artifacts/anti-overfitting-audit.json`.

Le commit `12fc284` enregistre les résultats et leurs validateurs. Aucun commit n’a été poussé.

---

## 11. Validations

| Validation | Résultat |
|---|---|
| Freeze B4 et contrôle de dérive | PASS |
| Tests de préengagement B4 | 5/5 PASS |
| Validateur du redémarrage B4 | PASS |
| Tests du redémarrage B4 | 7/7 PASS |
| Authoring validator/tests | PASS |
| Corpus validator/tests | PASS |
| B3 validator/tests | PASS |
| Evaluator validator/tests | PASS |
| B4R tests | PASS |
| Préflight historique B4/1.0 rejoué contre 1.1.0 | `EXPECTED_HISTORICAL_MISMATCH` — 2/11 tests échouent car ils exigent l'absence du mode Calibration ajouté par B4R |
| Typecheck | PASS |
| Build | PASS |
| `git diff --check` | PASS |

Les validations actives portent sur le même état fonctionnel de l’évaluateur 1.1.0 ; aucune modification fonctionnelle n’a été effectuée après Calibration. Le validateur historique sous `semantic-validation/sem-003/calibration/validator/` reste volontairement lié au gel 1.0.0 : ses erreurs `EVALUATOR_*_DRIFT`, `UNEXPECTED_CALIBRATION_MODE_PRESENT` et `UNEXPECTED_CALIBRATION_SOURCE_TYPE_PRESENT` sont la preuve attendue que l'ancien préflight n'est pas le validateur du redémarrage. Il n'est ni modifié, ni utilisé dans la décision active.

Le build émet uniquement ses avertissements préexistants relatifs aux données Browserslist, à deux annotations Rollup de `react-helmet-async` et à la taille de certains chunks ; aucune erreur de compilation n'est produite.

---

## 12. Décision et suite

Décision :

`SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION`

Cette décision signifie uniquement que :

- l’évaluateur 1.1.0 distingue les violations critiques exercées ;
- P01–P12 restent non compensables ;
- les décisions Level 2 simulées sont consommées sans falsification d’autorité ;
- les cinq variantes B3 ne sont pas rejetées pour leur structure ;
- `NOT_EVALUABLE`, fail-closed et échec provider restent distincts d’un succès ;
- le protocole de mesure est assez explicite pour préparer le benchmark indépendant.

Elle ne signifie pas que SEM est qualifié, que les références sont humaines, que des seuils P13–P18 sont admis ou qu’un blind set existe.

**Prochaine mission autorisée :** `SEM-003C — Independent Blind Construction & Sealing`.
