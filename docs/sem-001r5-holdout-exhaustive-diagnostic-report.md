# SEM-001R5 — Holdout Exhaustive Diagnostic

## Décision

`SEM_FINAL_DIAGNOSTIC_COMPLETE`

Cette décision signifie que le diagnostic exhaustif est terminé. Elle ne signifie ni qualification sémantique, ni `PASS` du Holdout, ni autorisation d'activation produit.

## Périmètre et règles observées

- Development : `30/30 COMPLETE`.
- Holdout : reprise à H11 ; H01–H10 ont été importés uniquement après vérification de compatibilité.
- Configuration effective : `ke1-75b68ddee7e53412`.
- Configuration sémantique effective : `ke1-01d917dec0ebcd82`.
- Chaîne R4B : le digest antérieur `ke1-90d945aefc3d0442` est conservé dans l'historique comme état remplacé par la dernière réparation générique R4B autorisée ; aucun résultat n'a été mélangé entre configurations.
- Provider : `GOOGLE_GEMINI`.
- Modèle : `gemini-3.5-flash-lite`.
- Gold utilisé uniquement après canonicalisation, pour l'évaluation.
- Aucun prompt, règle, Gold, seuil, taxonomie, évaluateur, canonicalisation, coverage ou routing n'a été réparé pendant SEM-001R5.
- Aucun cas `COMPLETE` compatible n'a été rappelé.
- Aucun commit, push ou déploiement.

## Résultat exhaustif

- Holdout terminal : `30/30`.
- Modèles canoniques produits : `26/30`.
- Échecs de pipeline fermés : `4/30` — H13, H21, H26 et H29.
- `PASS` : `10/30` — H01 à H09 et H19.
- `FAIL` : `20/30`.
- Familles de première cause : `4`.
- Arbitrages normatifs nécessaires : `7`.
- Réparations génériques établies : `3`.
- Incident de provider isolé à requalifier : `1`.
- Blocage technique hors Holdout : `1` — assertion de digest Gold gelé restée sur l'état antérieur à R4B.

`COMPLETE` décrit l'achèvement du pipeline d'un cas ; il ne vaut pas `PASS`. Les 26 cas `COMPLETE` comprennent 10 `PASS` et 16 `FAIL` d'évaluation.

## Tableau unique du Holdout

| Holdout | Premier étage divergent | Failure class | Owner | Generic ? | Gold ? | Arbitrage ? |
|---|---|---|---|---|---|---|
| H01 | — | PASS | — | — | Non | Non |
| H02 | — | PASS | — | — | Non | Non |
| H03 | — | PASS | — | — | Non | Non |
| H04 | — | PASS | — | — | Non | Non |
| H05 | — | PASS | — | — | Non | Non |
| H06 | — | PASS | — | — | Non | Non |
| H07 | — | PASS | — | — | Non | Non |
| H08 | — | PASS | — | — | Non | Non |
| H09 | — | PASS | — | — | Non | Non |
| H10 | Comparaison post-canonique avec le Gold | `GOLD_VS_OPERATIONAL_TAXONOMY_CONFLICT` | Gouvernance sémantique scientifique | NORMATIVE | Oui | Oui |
| H11 | Reconstruction | `EXPLICIT_ENDPOINT_AND_DERIVATION_NOT_RECONSTRUCTED` | Reconstruction sémantique | GENERIC | Non | Non |
| H12 | Comparaison post-canonique avec le Gold | `GOLD_RELATION_NOT_SOURCE_GROUNDED` | Gouvernance du Gold | NORMATIVE | Oui | Oui |
| H13 | Reconstruction — ancrage source | `NON_CONTIGUOUS_EXPLICIT_SOURCE_SPAN` | Reconstruction sémantique | GENERIC | Non | Non |
| H14 | Évaluation post-canonique | `COMPOSITE_UNKNOWN_EQUIVALENCE_FALSE_NEGATIVE` | Évaluateur | GENERIC | Non | Non |
| H15 | Reconstruction — classification | `STUDY_SETTING_TYPED_AS_POPULATION` | Reconstruction sémantique | GENERIC | Non | Non |
| H16 | Reconstruction — classification | `UNSELECTED_CHOICE_TYPED_AS_COMPARATOR` | Reconstruction sémantique | GENERIC | Non | Non |
| H17 | Comparaison post-canonique avec le Gold | `GOLD_VS_ONTOLOGY_BOUNDARY_CONFLICT` | Gouvernance sémantique scientifique | NORMATIVE | Oui | Oui |
| H18 | Évaluation post-canonique | `NEGATED_CONSTRAINT_PARAPHRASE_FALSE_NEGATIVE` | Évaluateur | GENERIC | Non | Non |
| H19 | — | PASS | — | — | Non | Non |
| H20 | Reconstruction — classification | `PARTICIPANT_GROUP_REDUCED_TO_CONDITION` | Reconstruction sémantique | GENERIC | Non | Non |
| H21 | Reconstruction — inventaire relationnel | `INVENTORY_RELATION_ENDPOINT_INCONSISTENCY` | Reconstruction sémantique | GENERIC | Non | Non |
| H22 | Comparaison post-canonique avec le Gold | `GOLD_DISTINCTION_RELATION_NOT_SOURCE_GROUNDED` | Gouvernance du Gold | NORMATIVE | Oui | Oui |
| H23 | Reconstruction — relation | `EXPLICIT_REPETITION_RELATION_ENDPOINT_MISMATCH` | Reconstruction sémantique | GENERIC | Non | Non |
| H24 | Reconstruction — classification | `QUANTITATIVE_OBSERVABLE_TYPED_AS_METHOD` | Reconstruction sémantique | GENERIC | Non | Non |
| H25 | Comparaison post-canonique avec le Gold | `GOLD_VS_INTERVENTION_AND_PHENOMENON_TAXONOMY_CONFLICT` | Gouvernance sémantique scientifique | NORMATIVE | Oui | Oui |
| H26 | Reconstruction — provenance et relation | `NON_CONTIGUOUS_SOURCE_AND_RELATION_ENDPOINT_INCONSISTENCY` | Reconstruction sémantique | GENERIC | Non | Non |
| H27 | Évaluation post-canonique | `NEGATED_CONSTRAINT_PARAPHRASE_FALSE_NEGATIVE` | Évaluateur | GENERIC | Non | Non |
| H28 | Comparaison post-canonique avec le Gold | `GOLD_VS_QUANTITATIVE_TARGET_OUTCOME_BOUNDARY_CONFLICT` | Gouvernance sémantique scientifique | NORMATIVE | Oui | Oui |
| H29 | Sortie structurée du provider | `MULTITURN_RETAINED_INVENTORY_STRUCTURED_NONCOMPLIANCE` | Contrat provider / modèle | ISOLATED | Non | Non |
| H30 | Comparaison post-canonique avec le Gold | `GOLD_VS_ENDPOINT_OUTCOME_AND_MODIFICATION_RELATION_CONFLICT` | Gouvernance sémantique scientifique | NORMATIVE | Oui | Oui |

## Attribution de la première cause réelle

Dans les lignes suivantes, `Oui` identifie la première cause. Les symptômes ultérieurs ne sont pas promus au rang de cause.

### H10

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Oui ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : le Gold impose un objet scientifique alors que la taxonomie opérationnelle et la relation de récupération décrivent un processus. Les deux libellés techniques sont également ambigus entre technique et observable.
- Conclusion : aucune correction du moteur n'est admissible avant décision de gouvernance.

### H11

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la variable explicitement désignée comme celle « qui doit compter » reste un biomarqueur et la dérivation depuis la mesure brute n'est pas reconstruite ; le routeur hérite ensuite d'un modèle incomplet.

### H12

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Non ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la source exprime une technique « pour » un résultat tardif, mais n'énonce pas littéralement une prédiction. Le Gold requiert une relation prédictive plus forte que le texte accessible au moteur.

### H13

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la reconstruction produit un `sourceText` explicite non contigu. La canonicalisation le refuse correctement avec `EXPLICIT_SOURCE_NOT_CONTIGUOUS`.

### H14

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Oui ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : le modèle conserve séparément la valeur inconnue et l'écart auquel elle s'applique. L'évaluateur ne reconnaît pas leur composition comme l'inconnu attendu.

### H15

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : un cadre multicentrique explicite est classé comme population avant toute comparaison au Gold. La relation entre incomplétude des données et non-évaluabilité n'est ensuite pas reconstruite.

### H16

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : un choix explicitement non effectué est instancié comme comparateur affirmé au lieu de rester un inconnu explicite.

### H17

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Oui ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la qualification de plusieurs processus/observables et de la cible explicative diverge entre le Gold et les frontières de la taxonomie opérationnelle. Forcer le moteur ferait trancher silencieusement une question d'ontologie métier.

### H18

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Oui ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la contrainte négative est présente et fidèle, mais l'évaluateur ne reconnaît pas l'équivalence entre deux formulations de l'exclusion.

### H20

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la reconstruction conserve la condition clinique mais perd la dimension de groupe de participants exprimée par la formulation collective.

### H21

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : l'inventaire rattache la relation négative à un fragment de contrainte plutôt qu'aux deux modalités. Les réparations du critic ne peuvent donc pas faire converger le graphe en deux cycles. `CRITIC_MAX_CYCLES_EXHAUSTED` est un symptôme en aval.

### H22

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Non ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la source contient un opérateur comparatif abrégé ; le Gold exige une relation de distinction, sémantiquement plus forte. L'intention cachée du fixture n'est pas une preuve accessible au moteur.

### H23

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la répétition est reliée au design, puis le timing au design, au lieu de conserver directement la variable répétée et son moment explicite.

### H24

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : une grandeur quantitative littérale est développée comme technique de production. Cela inverse la distinction générique METHOD / quantitative observable déjà arbitrée en R4B.

### H25

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Oui ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : des agents injectés sont des expositions/interventions dans la taxonomie opérationnelle, pas la technique d'imagerie elle-même ; les deux cibles nomment des processus que l'utilisateur cherche à séparer. Le Gold impose d'autres classes.

### H26

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Oui ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la reconstruction combine un `sourceText` non contigu et des extrémités de relation inversées. Le second critic accepte malgré un coverage encore incohérent ; `CRITIC_ACCEPT_INCONSISTENT_WITH_COVERAGE` reste une conséquence, non la première cause.

### H27

- Blocage : `GENERIC`.
- Produit : Oui ; Gold : Non ; Taxonomie : Non ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Oui ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : la contrainte négative explicite est fidèle, mais l'évaluateur ne reconnaît pas l'équivalence paraphrastique attendue.

### H28

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Oui ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : le Gold traite la cible quantitative comme objet scientifique, tandis que la taxonomie lui permet le statut d'observable quantitatif ; la cible de prédiction met aussi en tension BIOMARKER avec rôle d'outcome et OUTCOME. Une décision d'autorité est nécessaire avant toute adaptation.

### H29

- Blocage : `ISOLATED`.
- Produit : Non ; Gold : Non ; Taxonomie : Non ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Oui.
- Preuve : au second tour, deux générations HTTP 200 produisent une continuité d'inventaire invalide pour des éléments retenus du tour précédent. La première référence des identifiants absents de l'inventaire courant ; la seconde fournit des listes vides interdites. Le parser échoue fermé avec `INVALID_STRUCTURED_OUTPUT`.
- Qualification : aucun incident de capacité, aucun HTTP 429/5xx, aucun secret stocké.

### H30

- Blocage : `NORMATIVE`.
- Produit : Non ; Gold : Oui ; Taxonomie : Oui ; Prompt : Non ; Coverage : Non ; Critic : Non ; Evaluator : Non ; Canonicalization : Non ; Routing : Non ; Provider : Non.
- Preuve : une variable utilisée pour juger deux parcours satisfait la définition opérationnelle d'un endpoint, alors que le Gold impose OUTCOME. Le Gold exige aussi une relation de modification que le texte n'énonce pas.

## Regroupement par familles

- Gold / arbitrage normatif : `7` — H10, H12, H17, H22, H25, H28, H30.
- Prompt / reconstruction : `9` — H11, H13, H15, H16, H20, H21, H23, H24, H26.
- Evaluator : `3` — H14, H18, H27.
- Provider structured output : `1` — H29.
- Coverage comme première cause : `0`.
- Critic comme première cause : `0`.
- Canonicalization comme première cause : `0`.
- Routing comme première cause : `0`.

Une cinquième catégorie existe hors des 20 échecs Holdout : le contrat de test de gel du corpus. Elle n'est pas comptée comme famille sémantique du Holdout.

## Plan minimal de fermeture — aucune réparation appliquée

### Réparation générique A — classification contextuelle, rôles et route

Corrige le mécanisme générique responsable de H11, H15, H16, H20 et H24.

Règle : la classification doit dériver du rôle exprimé dans la phrase entière — variable de jugement, choix absent, groupe de participants, cadre d'étude, technique de production ou observable produit — et la route doit être calculée sur le modèle ainsi complété. La réparation ne doit contenir aucun identifiant de cas, terme métier, Gold ou valeur particulière.

### Réparation générique B — intégrité du graphe de reconstruction

Corrige le mécanisme générique responsable de H13, H21, H23 et H26, ainsi que les relations secondaires manquantes de H11 et H15.

Règle : tout fragment explicite doit être contigu ; tout identifiant d'inventaire doit exister dans le contexte applicable ; toute relation explicite doit conserver ses véritables extrémités, sa direction, sa polarité et son ancrage. La continuité multi-tour doit préserver l'inventaire historique sans fabriquer de références orphelines. Aucun contenu de cas ne doit entrer dans la règle.

### Réparation générique C — équivalence compositionnelle de l'évaluateur

Corrige le mécanisme générique responsable de H14, H18 et H27.

Règle : l'évaluateur doit reconnaître une signification attendue lorsqu'elle est portée soit par une paraphrase fidèle, soit par la composition explicite d'un objet et de la relation qui le qualifie, sans relâcher la polarité ou inventer un sens absent.

### Arbitrage normatif D

Concerne H10, H12, H17, H22, H25, H28 et H30.

Chaque décision doit choisir explicitement entre le texte source, le Gold et la taxonomie opérationnelle. Les Gold et seuils restent inchangés tant que l'autorité humaine n'a pas statué. Si un Gold est confirmé malgré une relation non explicitement ancrée, l'autorité doit aussi documenter la règle générique d'inférence admise.

### Requalification provider E

Concerne H29.

L'incident est isolé et ne prouve ni défaut de capacité ni défaut sémantique. Une nouvelle qualification sous configuration figée doit déterminer s'il est reproductible. Une réparation supplémentaire du contrat structuré n'est justifiée que s'il se reproduit.

### Réconciliation du contrat technique F

Ne concerne aucun cas Holdout supplémentaire.

L'assertion de gel doit être réconciliée avec l'arbitrage déjà autorisé qui a produit le corpus courant, ou l'autorité doit explicitement invalider cet arbitrage. Cette opération ne doit modifier ni le corpus, ni un Gold, ni un seuil pendant SEM-001R5. Elle n'est pas comptée parmi les trois réparations sémantiques génériques.

## Économie LLM

- Appels LLM consommés par SEM-001R5 : `49`.
- Appels LLM évités par checkpoints compatibles : `26`.
- Opérations LLM réutilisées : `26`, portées par `10` cas réutilisés.
- Replays déterministes de checkpoints : `0`.
- Régénérations structurées : `1`, incluse dans les 49 appels.
- Retries transitoires : `0`.
- Échecs de capacité provider : `0`.
- Appels historiques R4 exclus du compte R5 : `3`.

## Campagnes restantes estimées

Estimation minimale : `2` campagnes après arbitrage humain.

1. une campagne de réparation générique couvrant A, B et C, avec traitement de l'incident provider seulement s'il est reproductible ;
2. une campagne de qualification complète sous configuration figée.

Une troisième campagne devient nécessaire si un arbitrage normatif confirme un Gold qui impose une nouvelle règle sémantique générique après la première campagne de réparation.

## Validation technique et intégrité

- Le runner de diagnostic a atteint `SEM_FINAL_DIAGNOSTIC_COMPLETE`.
- Les 30 checkpoints Holdout sont présents et terminaux.
- Les sorties brutes provider sont conservées sans secret.
- Le Gold, les seuils et les composants sémantiques figés n'ont pas été modifiés par SEM-001R5.
- Le registre de réparations SEM-001R5 est vide et porte la politique `NO_REPAIR_DURING_R5`.
- Typecheck : `PASS`.
- Tests sémantiques : `256/257 PASS`, `1 FAIL`.
- Échec technique : `competence.test.ts` attend le digest Gold de gel antérieur, alors que le corpus courant correspond au digest R4B enregistré par le manifeste. SEM-001R5 n'a modifié ni le fixture ni ce test.
- La validation live/downstream est `NOT_APPLICABLE_DIAGNOSTIC_ONLY`.
- Aucune qualification finale n'est revendiquée.

## Artefacts

- Manifeste : `semantic-validation/sem-001r5/closure-campaign-manifest.json`.
- Résultats : `semantic-validation/sem-001r5/holdout-results.json`.
- Diagnostic forensique : `semantic-validation/sem-001r5/exhaustive-diagnostic.json`.
- Métriques : `semantic-validation/sem-001r5/semantic-metrics.json`.
- Ledger d'échecs : `semantic-validation/sem-001r5/failure-ledger.json`.
- Comptabilité LLM : `semantic-validation/sem-001r5/llm-call-accounting.json`.
- Diagnostics provider : `semantic-validation/sem-001r5/provider-diagnostics.json`.
- Résumé : `semantic-validation/sem-001r5/qualification-summary.json`.

## Clôture

Décision : `SEM_FINAL_DIAGNOSTIC_COMPLETE`.

La photographie exhaustive est acquise. Le Holdout n'est pas qualifié : 20 cas restent en échec, dont 7 nécessitent d'abord un arbitrage normatif. Aucune réparation n'a été effectuée pendant cette campagne.
