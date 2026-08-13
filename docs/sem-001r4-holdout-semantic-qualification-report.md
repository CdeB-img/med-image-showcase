# SEM-001R4 — Frozen Holdout Semantic Qualification

## 1. Baseline R3J

La campagne part de la décision `R3J_DEVELOPMENT_GATE_PASSED_READY_FOR_HOLDOUT_AUTHORIZATION`. Le Development est `30/30 COMPLETE`, ses seuils centraux sont franchis et ses absolute blockers sont nuls. Aucun résultat Development n'a été réutilisé comme résultat Holdout.

## 2. Freeze

La source de gel est `semantic-validation/sem-001r3j/development-freeze-candidate.json`. Les 28 contrôles préalables sur 28 sont conformes : corpus et Gold Frames Development/Holdout, prompts, schémas provider et internes, modèle canonique, garde-fous et compilateur atomique, coverage/repair, canonicalizer, évaluateur, routage, provider, modèle et seuils. L'empreinte sémantique R3J observée est `ke1-01606892072503be`. Aucune dérive n'a été détectée.

## 3. Campaign manifest

Le manifeste immuable `semantic-validation/sem-001r4/campaign-manifest.json` a été créé avant tout appel. Campaign ID : `sem-001r4-2026-08-12T19-14-19-051Z-ke1-8251dd1f215442bb`. Configuration digest : `ke1-8251dd1f215442bb`. Provider : Google Gemini. Modèle : `gemini-3.5-flash-lite`. Température : `null`. Limites : concurrence 1, cinq départs maximum sur 60 secondes, cinq tentatives maximum par opération.

## 4. Provider et appels

Trois appels LLM ont été réalisés : une reconstruction et deux cycles critic. Les trois réponses provider ont reçu HTTP 200. Retries : 0. Structured regenerations : 0. Appels évités par reprise/cache : 0. Cas COMPLETE repris : 0. Incidents provider : 0. Les réponses brutes sont conservées localement en mode restreint, sans en-têtes de requête ni secret.

## 5. Holdout

Résultat : `0/30 COMPLETE`. La campagne s'est arrêtée sur `SEM-H01` avant canonicalisation et avant évaluation Gold, conformément à la règle d'arrêt au premier défaut sémantique. Aucun cas suivant n'a été ouvert. Aucun checkpoint COMPLETE n'a été rejoué.

## 6. Métriques

Les 16 métriques officielles restent `NOT_CALCULATED`, car le gate `30/30 COMPLETE` n'est pas atteint. Aucun score, numérateur ou dénominateur partiel n'est présenté comme métrique officielle. Absolute blockers : `NOT_EVALUATED` ; aucun modèle canonique n'a été produit pour `SEM-H01` et aucun absolute blocker n'a donc été mesuré.

## 7. Blocker et failure

- Case : `SEM-H01`.
- Requête : « On voudrait opposer l'ADC cortical à la perfusion ASL pour caractériser le rein greffé. »
- First divergent stage : `BASE_CRITIC_OR_ACCEPTANCE_GUARD`.
- Failure class : `CRITIC_FAILURE`.
- Constat : les deux cycles critic ont conclu `REVISE`. Le contrôle `EVERY_EXPLICIT_RELATION_REPRESENTED` est resté `FAIL` pour la relation explicite entre l'intention d'étude et la comparaison, puis la borne `CRITIC_MAX_CYCLES_EXHAUSTED` a été atteinte.
- Qualification : `ISOLATED_UNTIL_SEPARATE_REPAIR_CAMPAIGN`.
- Recommended owner : `SEM_CRITIC_OWNER`.
- Aucune correction n'a été appliquée dans R4.

## 8. Décision

Décision : `R4_HOLDOUT_FAILED_REQUIRES_SEPARATE_REPAIR`.

Les validations techniques post-campagne passent : suite SEM 19/19 fichiers et 204/204 tests, typecheck, lint sans erreur avec 7 avertissements Fast Refresh préexistants, build et `git diff --check`. Aucun navigateur final, flux SEM→ST/IMG/PRJ live, second Holdout, commit, push, déploiement ou publication n'a été exécuté. Aucun `holdout-qualification-freeze.json` n'a été créé.

# Addendum SEM-001R4A — H01 Critic Failure Forensic Repair

## 1. Diagnostic H01

La chaîne persistée `SOURCE → INVENTORY → ELEMENTS → RELATIONS → CRITIC 1 → REPAIR → CRITIC 2 → FAILURE` montre que la comparaison directe entre les deux mesures et la relation entre l'opération de caractérisation et sa cible sont déjà présentes. La seule défaillance répétée concerne `rel-2`, relation de cadrage entre l'intention et le fragment fonctionnel de comparaison. Les deux critics ont proposé une arête vers un élément qui représente en réalité la première mesure, et non un nœud de comparaison. L'information scientifique n'est donc pas absente. Classification : cas **B**, `RELATION_COVERAGE_FALSE_POSITIVE`.

## 2. First divergent stage

Le premier étage divergent démontré est `DETERMINISTIC_RELATION_COVERAGE`. La qualification R4 `BASE_CRITIC_OR_ACCEPTANCE_GUARD` et son propriétaire provisoire `SEM_CRITIC_OWNER` décrivaient correctement le dernier étage atteint avant l'analyse forensic ; R4A les affine, sans réécrire l'état historique, car le faux négatif transmis au critic naît dans le rapport de couverture déterministe.

## 3. Correction générique

Seul le propriétaire `coverageAndRepair` évolue, de `ke1-07d6e2904ee94524` à `ke1-d6e251083701a33c`. Une relation de cadrage vers un fragment fonctionnel est désormais couverte uniquement si ce fragment est déjà porté par une relation scientifique explicite, sourcée, entre ses objets. Une relation finale, une orientation interdite, une relation inférée ou l'absence de relation directe restent des échecs. Aucun vocabulaire H01, case ID, Gold Frame, nœud ou arête artificielle n'est introduit. Le manifeste R4 reste immuable et en échec historique ; l'empreinte sémantique séparée R4A est `ke1-e56537b170ed91e5`.

## 4. Replay H01

Le replay repart de `DETERMINISTIC_RELATION_COVERAGE`. La reconstruction persistée est réutilisée sans mutation ; les deux sorties critic sont conservées comme preuves diagnostiques et leur unique constat devenu périmé est réconcilié déterministement, sans appliquer leurs réparations. H01 atteint ensuite canonicalisation, vérification locale et évaluation Gold indépendante. Résultats : Explicit Object Recall `1`, Explicit Relation Recall `1`, Critical Semantic Recall `1`, Critical Unsupported Inference `0`, absolute blockers `0`, route correctness `PASS`. Couvertures explicite, relationnelle et taxonomique : `COMPLETE`.

## 5. LLM accounting

Appels LLM réalisés : `0`. Retries : `0`. Appels évités par réutilisation compatible : `3` — une reconstruction et deux cycles critic persistés. Provider : `NOT_CALLED`.

## 6. Tests

La suite R4A ajoute 8 tests génériques, tous passants. La suite SEM complète passe avec 20/20 fichiers et 212/212 tests. `typecheck`, lint, build et `git diff --check` passent ; le lint conserve 7 avertissements Fast Refresh préexistants et aucune erreur. Aucune suite globale lourde ni frontière externe n'a été exécutée.

## 7. Décision

Décision : `R4A_H01_REPAIR_PASSED_READY_FOR_HOLDOUT_RESUME`. H01 : `PASS` ciblé. H02–H30 : `NOT_STARTED`. Le Holdout complet n'a pas été repris et aucune métrique agrégée Holdout n'a été calculée. Aucun commit, push ou déploiement n'a été réalisé.

# Journal SEM-001R4-CLOSURE — Autonomous Holdout Closure

## 1. Reprise et configurations

La reprise conserve R4 comme preuve historique immuable et importe le replay déterministe R4A de H01. Les évolutions génériques autorisées ont produit successivement les configurations `ke1-40860531ff1079a5`, `ke1-6493ea63aa9355bf` puis `ke1-c7a712b074be477c`. Chaque transition est enregistrée dans `semantic-validation/sem-001r4/closure-campaign-manifest.json`. Le corpus Holdout et son Gold digest restent inchangés (`ke1-08392b87b2cc140b` et `ke1-34ef12e65473a7f2`).

## 2. Classes corrigées

- H01 — `RELATION_COVERAGE_FALSE_POSITIVE` : garde relationnelle déterministe corrigée et replayée.
- H05 — `DETERMINISTIC_TAXONOMY_GUARD_GAP` : une famille d'imagerie avec portée anatomique reste MODALITY ; une vraie technique subordonnée reste METHOD. Dix tests génériques passent.
- H05/H06 — `MULTILINGUAL_EVALUATOR_FALSE_NEGATIVE` : équivalences IRM/MRI, TDM/CT, TEP/PET et ultrasonore/ultrasound rendues explicites sans fusionner des techniques distinctes. Neuf tests génériques passent.

Les checkpoints compatibles H01–H06 ont été rebasés déterministement sans nouvel appel LLM. Aucun Gold n'a servi d'oracle produit et aucun Gold n'a été modifié.

## 3. Blocage H07

Requête : « post myocardite : mapping natif et strain, lequel annonce la récupération VG ? »

La reconstruction live conserve les quatre objets, la comparaison et les deux relations prédictives. Elle classe `mapping natif` et `strain` comme METHOD. Le Gold H07 exige les deux comme BIOMARKER. Pour `strain`, une garde taxonomique générique peut encore être ajoutée. Pour `mapping natif`, le conflit est normatif : la taxonomie opérationnelle gelée et la garde `MAPPING_TECHNIQUE_TYPED_AS_BIOMARKER` imposent METHOD lorsqu'une technique de mapping est explicitement nommée, tandis que le Gold exige BIOMARKER.

Changer le modèle pour satisfaire silencieusement le Gold contredirait la taxonomie. Changer le Gold ou redéfinir la taxonomie dépasse les réparations autonomes autorisées. Aucun correctif partiel H07 n'est appliqué avant arbitrage.

## 4. État de campagne

- Décision : `SEM_CLOSURE_REQUIRES_HUMAN_ARBITRATION`.
- Holdout : `7/30 COMPLETE` ; H08–H30 non ouverts.
- Métriques officielles : `NOT_CALCULATED`, car 30/30 n'est pas atteint.
- Appels LLM consommés avec réponse structurée : 15.
- Départs de requête : 17, dont 2 retries réseau sans réponse provider exploitable.
- Appels évités par réutilisation compatible : 16.
- Replays déterministes : 6.
- Incidents provider durables : 0.
- Browser LIVE_LLM : `NOT_STARTED_GATE_CLOSED`.
- Flux SEM→ST, SEM→IMG et SEM→PRJ : `NOT_STARTED_GATE_CLOSED`.
- Validations ciblées : 78/78 PASS sur cinq fichiers lors de la rebase principale, puis 26/26 PASS sur trois fichiers sous la dernière configuration.
- Validations techniques complètes et globales : non lancées, leur gate post-Holdout restant fermé.

## 5. Arbitrage requis

Deux branches cohérentes sont possibles :

1. maintenir la taxonomie actuelle, qualifier `mapping natif` comme METHOD dans le Gold H07, réparer génériquement `strain` comme BIOMARKER, créer une nouvelle configuration gouvernée et rejouer H07 depuis le premier étage invalidé ;
2. redéfinir normativement les conditions dans lesquelles `mapping natif` désigne un BIOMARKER, puis aligner prompt, garde, tests et Gold avant une nouvelle configuration.

La première branche est la modification minimale compatible avec la doctrine actuelle. Aucun commit, push ou déploiement n'a été réalisé.

# Addendum SEM-001R4B — H07 Arbitration, Holdout Resume and H10 Stop

## 1. H07 et H08–H09

L'arbitrage humain H07 a été appliqué sans migration PD-003 V2 : `mapping natif` reste METHOD, `strain` est BIOMARKER dans son emploi prédictif, et la mesure quantitative non nommée issue du mapping reste une ambiguïté explicite. H07 passe à `1/1/1`, sans inférence non supportée ni bloqueur, après replay déterministe et sans appel LLM.

H08 a révélé deux lacunes génériques : équivalence des formulations d'exclusion et distinction entre un observable quantifié et un objet d'étude non quantifié. H09 a révélé des faux négatifs multilingues et de rôle d'étude pour `virtual non contrast` et un METHOD portant `REFERENCE_STANDARD`. Ces corrections ont été testées hors cas Holdout, puis les sorties provider compatibles ont été réutilisées. H01–H09 passent tous sans bloqueur sous la configuration `ke1-75b68ddee7e53412`.

## 2. Arrêt H10

H10 préserve explicitement l'exercice, le timing, le phosphore 31P, BOLD musculaire, la récupération énergétique, les relations d'observation et `RECOVERS_AFTER`. Le routage est correct, le taux d'inférence non supportée est nul et aucun fragment scientifique n'est absent.

Deux classifications METHOD peuvent faire l'objet d'une réparation générique ultérieure : une entité utilisée comme source de `OBSERVES` est la technique produisant l'observation, non la valeur observée. Cette correction n'a pas été appliquée partiellement.

Le blocage restant exige un arbitrage réel. Le Gold H10 impose `récupération énergétique=SCIENTIFIC_OBJECT`. La taxonomie opérationnelle définit SCIENTIFIC_OBJECT comme une cible qui n'appartient pas à une classe plus précise et exclut un processus simplement nommé ; elle définit PHENOMENON comme un processus physiologique étudié en tant que processus. Ici, le texte demande d'observer une récupération après exercice et le modèle conserve la relation explicite `RECOVERS_AFTER`. Modifier le modèle ou assouplir l'évaluateur pour satisfaire silencieusement SCIENTIFIC_OBJECT serait une dérive taxonomique ; modifier le Gold sans décision humaine est interdit.

## 3. État et décision

- Décision : `SEM_CLOSURE_REQUIRES_HUMAN_ARBITRATION`.
- Development : `30/30 COMPLETE`.
- Holdout : `10/30 COMPLETE`; H11–H30 `NOT_OPENED_GATE_CLOSED`.
- Métriques officielles : `NOT_CALCULATED`; les métriques partielles restent interdites.
- Provider : Gemini 3.5 Flash-Lite, 25 départs, 23 réponses structurées réussies, 2 retries réseau, aucune panne de capacité.
- Appels évités par reprise : 23 ; replays déterministes : 9.
- Tests ciblés : 98/98 PASS. Validations globales, browser LIVE_LLM et flux aval : gate fermé.
- Gold H10 et seuils : inchangés.
- Trace d'arbitrage : `semantic-validation/sem-001r4/h10-taxonomy-arbitration-request-r4b.json`.

Aucun commit, push ou déploiement n'a été réalisé.
