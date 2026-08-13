# SEM-003C1R — Blind Qualification Purpose Contract Repair

## Rapport de réparation contractuelle et nouveau gel pré-observation

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL` |
| Niveau documentaire | `NIVEAU_3 — rapport de mission` |
| Source maîtresse | présent fichier Markdown |
| Date | 14 août 2026 |
| Evaluator antérieur | `SEM003_EVALUATOR` version `1.1.0` — `b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd` |
| Evaluator actif | `SEM003_EVALUATOR` version `1.2.0` — `c8b79236fafabfe7745b66c182daff8c89b9e6aaa1f4cd1ae00b0fe60bd948bb` |
| Purpose ajouté | `SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION` |
| Décision | `SEM003C1R_BLIND_QUALIFICATION_CONTRACT_READY` |

## 1. Résultat

Le défaut contractuel identifié par SEM-003C1 est réparé avant toute observation Blind. Le contrat de candidate Evaluator possède désormais une valeur unique et générique pour une qualification scientifique aveugle :

`SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION`

Cette valeur décrit la nature de l’évaluation. Elle ne décrit ni SEM, ni Instructor, ni PydanticAI, ni DSPy, ni LangExtract, ni Outlines. Les six architectures peuvent donc employer le même purpose lors de la future campagne commune.

Le mode `FUTURE_SEM_RUNTIME` exige désormais conjointement :

- le schéma candidate 1.2.0 ;
- le purpose Blind Qualification ;
- la source `FUTURE_SEM_RUNTIME_OUTPUT`.

Development exige son purpose Development et Calibration son purpose Calibration. Une candidate Blind ne peut donc plus être représentée comme Development ou Calibration, et l’inverse est rejeté par le schéma avant l’évaluation.

## 2. Classification et versionnement

La modification est additive sur l’inventaire des purposes, mais elle modifie l’identité contractuelle et les gardes de binding de l’Evaluator. Elle impose donc une nouvelle version mineure : 1.2.0. Le schéma de candidate et le schéma d’entrée acceptent 1.2.0 ; le schéma de résultat reste 1.1.0 parce que sa forme, ses propriétés et sa sémantique ne changent pas.

Le nouvel identity record recalcule les digests de chaque schéma et fichier de noyau couvert. Le gel `SEM003C1R-EVALUATOR-FREEZE-01` enregistre séparément :

- le configuration digest 1.2.0 ;
- le code digest ;
- le schemas digest ;
- les digests inchangés du registre P01–P18 et de la failure taxonomy ;
- le digest des 41 fixtures Development ;
- le digest historique du gel B4R ;
- le digest des artefacts comparatifs protégés ;
- le binding commun entre le gel SEM-003C1 et l’Evaluator 1.2.0.

## 3. Binding comparatif sans régénération des baselines

Le gel SEM-003C1 d’origine reste inchangé :

- freeze ID : `SEM003C1-COMPARATIVE-BASELINES-FREEZE-01` ;
- freeze digest : `6373b7b04838e75582048becb2efdf075b644740f1d3f6bbb381809ecdc010f1` ;
- six baseline manifests inchangés ;
- code, prompts, contracts de projection, normalisateurs et adapters sémantiques inchangés ;
- répertoire de résultats toujours vide hors sa politique `README.md`.

Le fichier `semantic-validation/sem-003/evaluator/registry/sem003c1r-comparative-evaluator-binding.json` constitue le seul binding successeur. Il relie les six baseline IDs gelés à l’identité Evaluator 1.2.0, au mode `FUTURE_SEM_RUNTIME`, au purpose Blind Qualification et à la source runtime. Il n’ajoute aucune compréhension à une sortie native ou normalisée.

Le bridge 1.1.0 gelé n’est ni réécrit ni régénéré. La preuve C1R applique le nouveau binding du côté Evaluator de confiance après la normalisation, sans donner à une baseline l’accès à une Acceptance Envelope ou à une référence.

## 4. Contrats préservés

| Contrat | Préservé ? | Preuve |
|---|---:|---|
| Propriétés P01–P18 | Oui | property registry digest `f0db9a687df425fd844c80580914bb91b3c5382663307fa9aea696015c876a70` |
| Failure classes et dispositions | Oui | failure taxonomy digest `a5e45a03676b049c8a6478c66dfbd218fcd29954e48e38cc74ab850b6a950e2b` |
| Règles Level 1 | Oui | aucune modification de l’algorithme de jugement ; seule la garde d’entrée est complétée |
| Règles Level 2 | Oui | aucune modification |
| Quatre modes Evaluator | Oui | liste strictement inchangée |
| Seuils, N et score | Oui | aucun ajout ou changement |
| Acceptance Envelopes | Oui | aucun fichier modifié |
| Blind Cases | Oui | aucun fichier modifié ou ouvert pendant C1R |
| 41 fixtures Development | Oui | 41/41 byte-identiques ; projection sémantique B4R inchangée |
| Preuves B4R | Oui | 13/13 tests PASS ; gel historique 1.1.0 conservé |
| Preuves B4 Restart | Oui | validateur PASS ; 7/7 tests PASS |
| Six baselines SEM-003C1 | Oui | freeze reproductible ; 17/17 contrôles et 10/10 tests PASS |
| SEM fonctionnel | Oui | aucun fichier fonctionnel SEM modifié |

La correction du validateur historique B4 Restart consiste uniquement à comparer son manifeste avec le hash d’identité enregistré au moment du gel 1.1.0, et non avec un fichier d’identité active susceptible d’évoluer. Elle ne change aucun résultat B4.

## 5. Validations

| Validation | Résultat |
|---|---|
| Gel C1R reproductible | `PASS` — Evaluator 1.2.0, configuration digest `c8b79236fafabfe7745b66c182daff8c89b9e6aaa1f4cd1ae00b0fe60bd948bb` |
| Tests contractuels C1R | `PASS — 10/10` |
| Evaluator validator | `PASS — 7 schémas, 18 propriétés, 15 Development cases, 41 candidates` |
| Evaluator tests | `PASS — 10/10` |
| B4R | `PASS — 13/13` |
| B4 Restart validator | `PASS — 38 Calibration results, 5 equivalences, 18 propriétés` |
| B4 Restart tests | `PASS — 7/7` |
| SEM-003C1 freeze | `PASS — 11 artefacts générés, 6 baselines` |
| SEM-003C1 validator | `PASS — 17/17` |
| SEM-003C1 tests | `PASS — 10/10` |
| SEM-003C | `PASS de préservation — tree Git et worktree inchangés` |
| Suite SEM locale | `PASS — 305/305` |
| Typecheck | `PASS` |
| Build | `PASS` |
| `git diff --check` | `PASS` |

Le validateur fonctionnel SEM-003C n’est pas relancé : son exécution ouvrirait les packages Blind que la mission interdit explicitement de lire. La preuve C1R vérifie à la place l’identité du tree Git déjà scellé et l’absence de diff sous `semantic-validation/sem-003/blind/`. Cette substitution ne produit ni résultat Blind ni nouvelle preuve scientifique.

## 6. Limites et non-revendications

- aucune entrée Blind n’est exécutée ;
- aucun contenu `sealed-reference` n’est consulté ;
- aucun appel LLM/provider n’est lancé ;
- aucune baseline n’est qualifiée ;
- aucun résultat comparatif n’existe ;
- aucun seuil P13–P18 ou PASS PD-011 n’est créé ;
- l’ancienne décision SEM-003C1 `PARTIAL` reste un snapshot historique exact ; C1R ferme sa gate par un binding successeur sans réécrire ce snapshot.

## 7. Décision et prochaine mission

Décision :

`SEM003C1R_BLIND_QUALIFICATION_CONTRACT_READY`

La seule mission suivante autorisée est :

`SEM-003D-COMP — Common Blind Comparative Qualification Campaign`

Elle devra employer le même Blind Set et le même purpose 1.2.0 pour les six baselines gelées. Aucun tuning, aucune réparation et aucune exécution séparée de SEM-003D n’est autorisé avant cette campagne commune.
