# SEM-002A — Scientific Understanding Competence Contract

## Normative Review and Governed Admission Report

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — NIVEAU_3` |
| Date | 13 août 2026 |
| Source maîtresse examinée | `docs/sem-002-scientific-understanding-competence-contract.md` |
| Projection machine | `semantic-validation/sem-002/scientific-understanding-competence-contract.json` — non normative |
| Index avant opération | version 1.30 ; `OFFICIAL` ; gelé |
| Index après opération | version 1.31 ; `OFFICIAL` ; gelé |
| Statut SEM-002 avant | `CANDIDATE_NORMATIVE_NOT_ADMITTED` ; `SEM002_COMPETENCE_CONTRACT_PROPOSED_NOT_ADMITTED` |
| Statut SEM-002 après | `ADMITTED_WITH_LIMITATIONS` ; `NIVEAU_1` |
| HEAD de départ | `e41c3e20c179b7e8e89adc8d80f9b81b14abb0d7` |
| Décision | `SEM002_ADMITTED_WITH_LIMITATIONS_READY_FOR_INDEPENDENT_BENCHMARK_DESIGN` |

## 1. Nature et périmètre

SEM-002A est une revue normative et une admission documentaire. Elle corrige la méthode de qualification décrite par le candidat SEM-002, classe ses propriétés, fixe ses frontières d'ownership et l'admet avec limitations comme référence méthodologique de niveau 1.

L'opération ne crée ni implémentation, ni prompt, ni provider, ni schéma runtime, ni Gold, ni seuil, ni jeu de cas, ni benchmark, ni campagne, ni PASS scientifique. Aucun appel LLM, Holdout, browser ou downstream n'a été exécuté. SEM-003 reste `NOT_STARTED`.

## 2. Baseline et autorité documentaire

Le dépôt canonique observé est `noxia-dev`, branche `main`, au HEAD de départ indiqué ci-dessus. Le seul index canonique présent dans ce dépôt est `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.30 avant l'opération. Les références antérieures à un index version 1.0 sont des copies de contexte historiques et reçoivent la qualification `DOCUMENTARY_CONTEXT_COPY_STALE` ; elles ne créent aucune autorité concurrente.

Le dépôt externe `editorial-engine` a été consulté uniquement pour sa frontière doctrinale, au commit `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`. Son worktree était déjà non propre et `docs/architecture-manifesto.md` y était non suivi. Aucun fichier externe n'a été modifié. Cette observation constitue une limitation de traçabilité de l'autorité externe enregistrée par l'index, pas une contradiction doctrinale locale ni une seconde source NOXIA.

La réconciliation physique a également constaté deux rapports SEM suivis par Git mais postérieurs à l'index 1.30 :

- `docs/sem-001r5c-h29-autonomous-replay-and-legacy-closure-report.md`, introduit par `21298ec1fa481dc8487cc7c8034ed3b766e58e6d` ;
- `docs/sem-001r5f-relation-ownership-and-critic-oscillation-resolution-report.md`, introduit par `e41c3e20c179b7e8e89adc8d80f9b81b14abb0d7`.

Ils sont enregistrés hors corpus gouverné avec les autres rapports SEM historiques. Cette classification ne les admet pas rétroactivement.

## 3. Autorités consultées et compatibilité

| Autorité | Contrat préservé | Conclusion |
|---|---|---|
| Charte fondatrice | science avant technique, incertitude visible, décision humaine | compatible |
| Scientific Product Manifesto V2 | chaîne scientifique, contexte, provenance, non-promotion | compatible |
| PD-003 V2 et compagnons ownership/relations/impact | objets, rôles, relations, axes épistémiques et état d'adaptation SEM | préservés ; aucune conformité runtime revendiquée |
| OBS-001 et compagnons | séparation propriété observable, définition de mesure, rôle biomarqueur et Project | préservée |
| PD-005 | architecture des rôles IA et de la Prompt Library | non redéfinie |
| PD-009 | prochaine action, valeur de l'information et clarification | non redéfini |
| PD-011 | métriques, seuils, répétitions, benchmark, PASS/FAIL et publication | propriétaire exclusif de la qualification formelle |
| Editorial Engine Architecture Manifesto | projection déterministe de faits gouvernés, hors jugement scientifique | frontière préservée |
| Rapports SEM-001 à SEM-001R5F | preuves historiques, variabilité et risque d'overfitting | non promus en norme ni en PASS |

Aucune contradiction normative réelle n'a été identifiée. Les différences observées relevaient de frontières de responsabilité, d'un état d'implémentation non conforme à la cible V2 ou d'anciens snapshots de campagne.

## 4. Correction méthodologique

Le candidat initial contenait dix-sept propriétés et risquait d'appliquer une exigence absolue de 100 % à des capacités qui doivent être évaluées statistiquement. La revue établit trois familles non interchangeables :

| Famille | Propriétés | Régime |
|---|---:|---|
| `SAFETY_FIDELITY_INVARIANT` | 12 | obligation absolue dans 100 % des sorties sémantiquement évaluables |
| `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | 5 | métriques et seuils contextualisés à préspécifier sous PD-011 |
| `CONTEXTUAL_ENRICHMENT` | 1 | pertinence, précision, rappel, rang, contextualisation et justification à mesurer statistiquement |
| **Total** | **18** | aucune agrégation globale compensatoire |

La décomposition de dix-sept à dix-huit propriétés est nécessaire et générique :

- `PROPERTY_CONTEXTUAL_INFERENCE_NOT_USER_FACT` conserve l'interdiction absolue de présenter une inférence comme déclaration utilisateur ou vérité Project ;
- `PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE` évalue statistiquement l'utilité des candidats contextuels.

Ainsi, « ne jamais attribuer MVO à la demande utilisateur » est un invariant absolu ; « produire MVO dans chaque génération » n'est pas une obligation. Aucun terme métier particulier n'est transformé en règle d'implémentation.

La criticité d'une violation et son mode d'agrégation sont désormais séparés. Une propriété statistique peut révéler une erreur critique sur un cas sans imposer une sortie identique à chaque génération. Une moyenne ne peut jamais compenser une violation critique de sécurité ou de fidélité.

## 5. Ownership admis

SEM-002 possède uniquement :

- la définition de la compétence de compréhension scientifique ;
- ses dimensions, familles et propriétés ;
- les classes méthodologiques d'inférence ;
- les règles d'équivalence sémantique ;
- l'architecture du futur benchmark de compréhension.

SEM-002 ne possède pas les objets PD-003/OBS-001, les rôles PD-005, la prochaine action PD-009, les métriques et décisions PD-011, les décisions du Research Project, ni une configuration SEM. Toute qualification future reste gouvernée par PD-011.

## 6. Limitations d'admission

- aucune implémentation runtime n'est démontrée ;
- aucun benchmark SEM-002 n'est créé ou exécuté ;
- aucun PASS scientifique n'est prononcé ;
- aucune conformité de SEM legacy à PD-003 V2 n'est démontrée ;
- aucun seuil statistique, aucune valeur de `N` et aucun nombre de répétitions ne sont admis ;
- aucune calibration multi-run n'est réalisée ;
- H01–H30 restent un corpus historique de non-régression, non un futur jeu aveugle indépendant ;
- l'autorité externe Editorial Engine reste affectée par la limitation de traçabilité décrite en section 2.

## 7. Admission et comptes

L'index version 1.31 admet exactement deux artefacts : le contrat SEM-002 de niveau 1 et le présent rapport SEM-002A de niveau 3. La projection JSON reste hors hiérarchie documentaire et non normative.

| Métrique | Avant | Après |
|---|---:|---:|
| Artefacts gouvernés | 107 | 109 |
| Artefacts gouvernés, index inclus | 108 | 110 |
| Fichiers documentaires présents hors corpus gouverné | 33 | 35 |

Le passage de 33 à 35 hors corpus correspond uniquement à la classification des deux rapports historiques R5C et R5F constatés après l'index 1.30. Il n'est pas produit par l'admission des deux nouveaux artefacts.

## 8. Validations

| Contrôle | Résultat |
|---|---|
| Structure Markdown, titres, tableaux et clôtures | `PASS` |
| JSON parseable et douze champs de projection requis | `PASS` |
| Cohérence Markdown/JSON : 18 propriétés, comptes 12/5/1 et 15 catégories | `PASS` |
| Liens et chemins locaux de l'opération | `PASS` |
| Contradictions, statuts et décisions résiduels | `PASS — aucune contradiction active` |
| Inventaire : 122 fichiers dans `docs/`, 35 hors corpus et 87 gouvernés | `PASS` |
| Tests documentaires existants pertinents | `NONE_AVAILABLE` |
| `git diff --check` | `PASS` |
| Code, tests, configuration SEM | `NOT_MODIFIED` |
| Appels LLM | `0` |

## 9. Décision finale

`SEM002_ADMITTED_WITH_LIMITATIONS_READY_FOR_INDEPENDENT_BENCHMARK_DESIGN`

SEM-003 : `NOT_STARTED`.
