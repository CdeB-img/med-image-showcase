# PRODUCT-CHECKPOINT-01H — UNDERSTAND Knowledge matching, ambiguity and applicability forensic

> Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE` — preuve d’implémentation non normative.
> Date: 2026-08-27.
> Mission: diagnostic local borné, sans réparation, sans provider externe et sans qualification scientifique.

## Decision

`DECISION = UNDERSTAND_MULTIPLE_KNOWLEDGE_ROOT_CAUSES_IDENTIFIED`

Deux causes indépendantes sont localisées :

1. **Cas A — comparaison no-reflow/MVO** : le premier écart contractuel apparaît dans `QUERY_PLANNING`, qui ne crée des branches comparatives que lorsqu’il existe plusieurs modalités. La cause directe du résultat à zéro élément applicable est ensuite `APPLICABILITY_OVERCONSTRAINT` : la dimension `intervention = STENTING`, pourtant `SOFT` dans le `KnowledgeRequest`, devient un garde d’exclusion absolu pour toute assertion qui ne porte pas une dimension `intervention`.
2. **Cas C — « T1 l’IRM »** : le premier écart apparaît dans `AMBIGUITY_HANDLING`. Le concept `ambiguous:t1` est correctement reconnu comme ambigu, mais aucune branche de sens ni clarification bloquante n’est créée. Aucun provider n’est sélectionné, puis `gap classification` transforme cet état de sens connu mais non résolu en `NO_PROVIDER` / « Connaissance interne absente ».

Classification bornée :

```text
CASE_A_ROOT = APPLICABILITY_OVERCONSTRAINT
CASE_A_CONTRIBUTING_ROOT = PARTIAL_COVERAGE_MODEL_GAP
CASE_C_ROOT = AMBIGUITY_ROUTING

SCIENTIFIC_PASS = NO
PD011_PASS = NO
WAVE_2_AUTHORIZED = NO
PRODUCT_TRACE_INTEGRATION = ABSENT
```

## Production baseline

| Élément | État vérifié |
|---|---|
| URL Production | `https://noxia-imagerie.fr` |
| Branche Production | `main` |
| SHA Production attendu et observé lors du checkpoint 01G immédiatement antérieur | `320d54bbab3c87833ea69583097860c28d010403` |
| Vercel project | `med-image-showcase` |
| Deployment ID | `dpl_CiMWTcgT3m5qSXfxtgWfut9rPrJx` |
| URL technique du déploiement | `https://med-image-showcase-hefm00bxv-cdeb-imgs-projects.vercel.app` |
| Date du déploiement observée | 2026-08-27 14:41:06 UTC+2 |
| Référence Git locale confirmant Production | `origin/main = 320d54bbab3c87833ea69583097860c28d010403` |

La Production n’a pas été rappelée pendant 01H : la contrainte `NETWORK_CALLS = 0` a été respectée. Cette mission réutilise l’observation Vercel/HTTP immédiatement antérieure de 01G et la confirme contre la référence Git locale `origin/main`. Aucun staging et aucun Preview utilisateur n’ont été utilisés.

État Git de départ :

```text
branch = protocol-designer-canonical-ingestion
HEAD = 320d54bbab3c87833ea69583097860c28d010403
origin/protocol-designer-canonical-ingestion = 312b4b9c45de57ed3a6339dcc703f79955fbc36c
main = 9be06edca1a7500ab7a43d065e94241e91d67bec
origin/main = 320d54bbab3c87833ea69583097860c28d010403
tracked changes before report = 0
```

Les artefacts historiques non suivis présents au préflight ont été laissés en place.

## Authorities

Ordre d’autorité respecté :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` courant ;
2. `NOXIA — Charte fondatrice` ;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2` ;
4. `Editorial Engine — Architecture Manifesto`.

Autorités spécialisées consultées selon l’Index :

- `docs/pd-003-v2-research-object-model.md` et `docs/pd-003-v2-ownership-matrix.md` ;
- `docs/obs-001-observability-measurement-architecture.md` ;
- `docs/pd-009-decision-engine-architecture.md` ;
- `docs/rde-001-research-design-engine-architecture.md` ;
- `docs/rde-002-research-design-workflow.md` ;
- `docs/ke-001-knowledge-engine-architecture.md` ;
- `docs/sem-002-scientific-understanding-competence-contract.md` ;
- les seuls contrats applicables de SEM-003, sans exécuter de qualification ;
- `docs/scientific-assertion-layer.md`, `docs/scientific-knowledge-graph-web.md`, `docs/p4-scientific-corpus.md`, `docs/p4r-scientific-consolidation.md` et `docs/p5-scientific-multidomain.md` ;
- RB-004 uniquement comme corpus documentaire gouverné, jamais comme assertion atomique implicite.

Preuves Level 3 consultées :

- `docs/implementation/product-checkpoint-01f-understand-scientific-synthesis-forensic.md`, y compris sa réconciliation 01F-R ;
- `docs/implementation/product-checkpoint-01g-understand-governed-scientific-synthesis-repair.md`.

Conclusions normatives opposables utilisées : une comparaison conserve une branche par objet comparé ; `UNKNOWN` n’est pas un joker ; une ambiguïté à branches divergentes justifie une clarification ; T1, valeur T1, T1 mapping, carte T1 et acquisition T1 ne sont pas des identités interchangeables ; MRI/CMR est une relation contextuelle et non un alias universel ; un Reasoning Book reste documentaire tant qu’aucune assertion atomique gouvernée n’en est dérivée.

## Case B positive control

Entrée exacte :

> Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d’étude ni de protocole.

Le contrôle confirme le chemin produit réparé par 01G :

| Étape | Observation locale déterministe |
|---|---|
| Routing | `UNDERSTAND`, exclusions `NO_STUDY` et `NO_PROTOCOL` conservées |
| Request | `knowledge-request:ke1-9d41d39b99c0ce4f`, `COMPARE`, relation comparative conservée |
| Concepts | ECV, IRM, CT et fibrose myocardique résolus exactement |
| Plan | branches distinctes `branch:modality:mri` et `branch:modality:ct` |
| Providers | `p4r-ecv-t1` et RB-004 exécutés ; Knowledge Graph interrogé sans match atomique |
| Candidats | 35 assertions P4R et 18 statements RB-004 |
| Résultat | 28 assertions applicables, 7 exclues, 18 statements documentaires, 20 sources, 46 EvidenceLinks |
| Coverage / synthesis | `PARTIAL` / `PARTIAL_ANSWER` |
| Présentation | réponse gouvernée produite, branches et manque de comparaison directe conservés |

Ce contrôle démontre que le routing, la construction comparative multi-modalité, l’appel Knowledge local et la composition 01G fonctionnent sur ce cas. Il ne constitue pas un `SCIENTIFIC_PASS`.

Observation secondaire, non causale pour A ou C : les sept assertions CT P4R sont exclues car leur modalité canonique `noxia:radiology:modality:ct` n’est pas normalisée comme `CT` par le garde d’applicabilité. Le contrôle demeure produit-positif grâce aux assertions IRM et aux statements documentaires, mais il n’est pas une preuve que toute la normalisation de modalité est correcte.

## Case A

Entrée exacte :

> Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.

Le `KnowledgeRequest` reconstruit est :

```text
requestId = knowledge-request:ke1-eb4eacd1f2f56c0d
requestType = COMPARE
knowledgePurpose = COMPARE
requestedClaimType = COMPARISON
relations = comparaison explicitement demandée ; relation temporelle déclarée
context.status = UNKNOWN
```

Objets préservés : `no-reflow`, `obstruction microvasculaire`, `angioplastie`, `stent`, `STEMI`, `IRM cardiaque`. L’extraction locale ajoute les fragments `obstruction microvascul` et `angioplast` sans supprimer les termes complets.

Résolution :

- `phenomenon:no-reflow` = `DOCUMENT_BOUND_CONCEPT`, relié à RB-004 ;
- `phenomenon:microvascular-obstruction` = `EXACT`, relié à P5 et RB-004 ;
- relation no-reflow → MVO = `CONTEXT_DEPENDENT_RELATION`, jamais synonymie universelle ;
- `intervention:stenting` = `EXACT`, mais sans mapping de provider ;
- `modality:mri` = `EXACT` ;
- `STEMI` reste un terme non résolu.

Dimensions :

| Dimension | Valeur | Force | Conséquence observée |
|---|---|---:|---|
| phenomenon | `NO_REFLOW`, `MICROVASCULAR_OBSTRUCTION` | `HARD` | présente dans l’unique branche |
| modality | `MRI` | `HARD` | filtre compatible avec P5 `MR` |
| intervention | `STENTING` | `SOFT` | néanmoins utilisée comme exclusion absolue par l’applicabilité |
| domain | `CARDIAC_IMAGING` | `SOFT` | non bloquante |
| biomarker / technique / usage | inconnues | `HARD` | gap de contexte conservé |

Le plan sélectionne P5 et RB-004 mais crée uniquement `branch:exact`, contenant simultanément no-reflow, MVO, stenting et MRI. Il ne crée pas une branche no-reflow et une branche MVO, parce que l’implémentation ne branche les comparaisons que lorsque plus d’une modalité est résolue.

Retrieval avant applicabilité :

- P5 : 5 assertions atomiques `OFFICIAL_EFFECTIVE` ;
- RB-004 : `NO_MATCH`, diagnostic `RB_HAS_NO_CONTROLLED_EXACT_NO_REFLOW_TEXT_BLOCK` ;
- provenance P5 : 3 sources et 6 EvidenceLinks.

Résultat après applicabilité : 0 assertion applicable, 5 assertions exclues, 0 statement documentaire, `PROVIDER_NOT_APPLICABLE`, puis synthèse `NO_APPLICABLE_KNOWLEDGE`.

Réponse aux questions de structure :

- le moteur n’impose pas génériquement que toutes les dimensions demandées coexistent dans une assertion ; il contrôle actuellement modalité, intervention et pathologie ;
- toutefois, toute intervention explicite est traitée comme obligatoire, même si le `KnowledgeRequest` l’a classée `SOFT` ;
- la couverture partielle est techniquement représentable pour une comparaison multi-modalité, mais pas pour une comparaison entre deux phénomènes dans une seule modalité ;
- ce double comportement convertit des candidats MVO pertinents mais incomplets sur l’intervention en un négatif global.

`CASE_A_ROOT = APPLICABILITY_OVERCONSTRAINT`
`CASE_A_CONTRIBUTING_ROOT = PARTIAL_COVERAGE_MODEL_GAP`

## Case C

Entrée exacte :

> je veux comprendre le role du T1 l'IRM

Le `KnowledgeRequest` reconstruit est :

```text
requestId = knowledge-request:ke1-d6d154a1aa176645
requestType = EXPLAIN
knowledgePurpose = UNDERSTAND
requestedClaimType = DEFINITION
scientificObjects = IRM ; t1
context.status = UNKNOWN
```

Le contexte n’infère que `modality = MRI`. Aucun domaine cardiaque, phénomène, biomarqueur, technique ou usage n’est connu.

La résolution technique produit :

- `modality:mri`, `EXACT` ;
- `ambiguous:t1`, `AMBIGUOUS`, libellé « T1 (acronyme à préciser) » ;
- ambiguïté explicite : « doit être désambiguïsé avant sélection d’un corpus » ;
- zéro mapping de provider pour `ambiguous:t1`.

Le plan reste pourtant `IN_SCOPE`, crée une seule `branch:exact`, n’active aucun provider et n’émet aucune branche de sens. Le Knowledge Engine retourne alors :

```text
provider executions included = 0
assertions = 0
documentary statements = 0
sources = 0
coverageStatus = NO_PROVIDER
synthesis state = NO_APPLICABLE_KNOWLEDGE
clarifications = 0
```

Le choix « Connaissance interne absente » vient ensuite du mapping de projection de `NO_PROVIDER`.

Cette absence n’est pas une absence physique du corpus T1. Les sondes canoniques directes, sans domaine cardiaque injecté et avec la seule modalité générique `MRI`, donnent :

| Terme exact | Concepts | Providers courants | Assertions applicables | Statements RB-004 | Sources | EvidenceLinks | Coverage |
|---|---|---|---:|---:|---:|---:|---|
| `T1 mapping` + IRM | `method:t1-mapping`, `modality:mri` | P4R + RB-004 | 27 | 18 | 15 | 36 | `SUPPORTED` |
| `T1 natif` + IRM | `measurement:native-t1`, `modality:mri` | P4R + RB-004 | 3 | 18 | 4 | 4 | `SUPPORTED` |

Les 27 et 3 assertions sont `OFFICIAL_EFFECTIVE`. Les sources exactes comprennent respectivement 13 `CURRENT` + 1 `CORRECTED` et 3 `CURRENT`; le document RB-004 est ajouté séparément comme `OFFICIAL_GOVERNED_DOCUMENTARY`.

La modalité générique IRM/CMR n’est donc pas le premier blocage du cas C : les requêtes canoniques `T1 mapping en IRM` et `T1 natif en IRM` atteignent P4R sans domaine cardiaque explicite. Le blocage se produit avant retrieval, au traitement de l’ambiguïté.

`CASE_C_ROOT = AMBIGUITY_ROUTING`

## Runtime corpus actually loaded

| Provider | Statut runtime | Contenu pertinent observé |
|---|---|---|
| `assertion-layer` | `AVAILABLE_EMPTY` | registre générique présent mais zéro assertion scientifique |
| `knowledge-graph` | `AVAILABLE` | concepts/relations ; aucune assertion T1 exacte retournée par la sonde |
| `p4-historical` | `REPLAY_ONLY` | non interrogé comme provider courant |
| `p4r-ecv-t1@1.1.0-ecv-t1-consolidated` | `AVAILABLE`, courant | assertions effectives T1 mapping, T1 natif et ECV, sources révisées et EvidenceLinks |
| `p5-multidomain@1.0.0-multidomain-wave-1` | `AVAILABLE`, courant | 5 assertions MVO récupérées pour A |
| `rb-004@1.1` | `AVAILABLE`, documentaire courant | projection contrôlée de 18 blocks pour les termes T1 exacts ; aucun block contrôlé exact no-reflow dans A |

La présence du DOCX maître RB-004 n’est jamais promue en assertion atomique. Son adapter n’expose que les blocks contrôlés de démonstration, avec `GOVERNED_DOCUMENTARY` et limites explicites.

## Concept and alias resolution

| Cas | Résolution correcte | Limite observée |
|---|---|---|
| A | no-reflow et MVO restent distincts ; relation contextuelle ; IRM et stenting préservés | `STEMI` non résolu ; `intervention:stenting` sans provider ; pas d’identité/branche séparée pour les objets comparés |
| B | ECV, IRM, CT et fibrose myocardique exacts | normalisation CT runtime imparfaite à l’applicabilité |
| C | IRM exact ; T1 reconnu comme ambigu | `ambiguous:t1` n’expose aucun sens candidat gouverné et aucun mapping provider |

Le défaut C n’est donc pas un alias arbitrairement choisi. C’est l’absence de transition gouvernée entre « ambiguïté reconnue » et « clarification/branches de sens ».

## Ambiguity handling

Distinctions normatives et techniques :

| État conceptuel | Norme | État technique actuel |
|---|---|---|
| `UNKNOWN_CONCEPT` | aucune résolution gouvernée ; gap/clarification | concept `unknown:*` et `unresolvedConcepts` disponibles |
| `AMBIGUOUS_CONCEPT` | sens candidats conservés, discriminants et impacts ; clarification si les branches divergent | `ResolvedConcept.kind = AMBIGUOUS` et texte d’ambiguïté disponibles |
| `KNOWN_CONCEPT_UNRESOLVED_SENSE` | connaissance potentiellement présente, mais sens non choisi | pas d’état global ni de branches de sens dédiés |
| `NO_RETRIEVED_KNOWLEDGE` | providers applicables interrogés sans match | `NO_MATCH` lorsque des providers ont été sélectionnés |
| `NO_APPLICABLE_KNOWLEDGE` | résultats retrouvés mais non applicables | `PROVIDER_NOT_APPLICABLE` lorsqu’il existe des assertions exclues |
| `CLARIFICATION_REQUIRED` | question à valeur d’information positive avant la branche dépendante | Domain Gate technique utilisé seulement pour `BEST_OPTION`; sinon dépend d’un gap `MISSING_CRITICAL_CONTEXT` |
| `KNOWLEDGE_ABSENT` | absence honnête après concepts critiques résolus et providers exacts épuisés | projection actuelle de `NO_PROVIDER`, y compris dans C malgré l’ambiguïté non résolue |

Dans C, la règle de gap d’ambiguïté ne s’active que si **tous** les concepts sont `UNKNOWN` ou `AMBIGUOUS`. La présence de `modality:mri = EXACT` rend ce prédicat faux. Le résultat conserve l’ambiguïté en annotation, mais ne crée ni `MISSING_CRITICAL_CONTEXT`, ni clarification. Il ajoute ensuite `NO_REGISTERED_PROVIDER`, qui devient visuellement une absence du corpus.

La clarification possède une valeur d’information positive : distinguer au minimum le paramètre/temps de relaxation T1, la méthode T1 mapping, une observation T1 native/post-contraste, une représentation/carte, une acquisition pondérée T1 ou un repère temporel de projet change l’identité, l’owner, le provider et le plan. Le runtime Knowledge courant possède des règles exactes pour `T1 mapping` et `T1 natif`; il ne matérialise pas toutes les autres branches dans son resolver. Aucune branche ne doit être choisie silencieusement.

## KnowledgeRequest comparison

| Cas | Request | Type / but | Objets centraux | Contexte connu | Inconnues critiques |
|---|---|---|---|---|---|
| A | `ke1-eb4eacd1f2f56c0d` | `COMPARE / COMPARE` | no-reflow, MVO, stenting, IRM | phénomènes, MRI, stenting, domaine cardiaque | biomarker, technique, usage |
| B | `ke1-9d41d39b99c0ce4f` | `COMPARE / COMPARE` | ECV, IRM, CT, fibrose | phénomène, biomarqueur, MRI+CT, domaine cardiaque | technique, usage |
| C | `ke1-d6d154a1aa176645` | `EXPLAIN / UNDERSTAND` | IRM, T1 ambigu | MRI | domain, phenomenon, biomarker, technique, usage |

Les termes utilisateurs ne sont pas perdus dans ces trois requêtes. Le premier défaut n’est donc pas la surface de routing réparée en 01B/01D/01G.

## Query planning comparison

| Cas | Domain Gate | Branches | Providers inclus | Verdict de plan |
|---|---|---|---|---|
| A | `IN_SCOPE` | une branche composite `branch:exact` | P5, RB-004 | divergence : comparaison entre phénomènes non branchée |
| B | `IN_SCOPE` | MRI, CT, comparaison directe | Knowledge Graph, P4R, RB-004 | contrôle positif ; branches multi-modalité visibles |
| C | `IN_SCOPE` | une branche `ambiguous:t1 + modality:mri` | aucun | divergence : ambiguïté conservée mais plan exécuté sans clarification ni sens candidat |

L’algorithme courant branche uniquement si `requestType = COMPARE` **et** s’il résout plus d’une modalité. Il ne respecte donc pas la règle générique « une branche par objet comparé » pour A.

## Candidate retrieval

| Cas | Résultat avant applicabilité | Provenance disponible |
|---|---|---|
| A | 5 assertions P5 MVO ; RB-004 `NO_MATCH` exact no-reflow | 3 sources, 6 EvidenceLinks |
| B | 35 assertions P4R + 18 statements RB-004 | 20 sources, 46 EvidenceLinks |
| C | aucun provider sélectionné, donc aucun candidat récupéré | 0 source, 0 EvidenceLink |

Pour A, les trois sources ne « survivent » pas comme conclusions applicables. `KnowledgeResult` déduplique et conserve les sources/EvidenceLinks de tous les `adapterResults` avant de séparer assertions applicables et exclues. Elles sont donc la provenance des cinq candidats rejetés, pas la preuve d’une réponse applicable.

## Applicability rejection matrix

### Cas A

| Assertion P5 récupérée | État | Raison exacte |
|---|---|---|
| `association-not-causality:revision:1` | `UNKNOWN_APPLICABILITY` | `STENTING` non documenté par l’assertion |
| `imh-distinct-mvo:revision:1` | `UNKNOWN_APPLICABILITY` | `STENTING` non documenté par l’assertion |
| `mvo-associated-remodeling:revision:1` | `UNKNOWN_APPLICABILITY` | `STENTING` non documenté par l’assertion |
| `mvo-dark-core-lge:revision:1` | `UNKNOWN_APPLICABILITY` | `STENTING` non documenté par l’assertion |
| `mvo-no-reflow:revision:1` | `UNKNOWN_APPLICABILITY` | `STENTING` non documenté par l’assertion |

Le garde ne teste pas la force `SOFT/HARD` de la dimension : toute présence de l’intervention entraîne l’exclusion si l’assertion ne porte pas une dimension `intervention`. La divergence n’est ni une incompatibilité démontrée ni une source indisponible ; c’est une applicabilité non documentée convertie en exclusion de toutes les conclusions.

### Contrôle B — observation secondaire

| Candidats | État | Raison |
|---|---|---|
| 7 assertions CT P4R | `OUT_OF_VALIDITY_DOMAIN` | l’identifiant canonique de modalité `noxia:radiology:modality:ct` n’est pas reconnu équivalent à `CT` par le comparateur runtime |

Cette observation ne rend pas B négatif, mais borne l’affirmation : B prouve le fonctionnement du chemin produit et de la synthèse partielle, pas la correction complète de chaque assertion CT.

## Output-state selection

| Sémantique attendue | État technique pertinent | Libellé produit actuel |
|---|---|---|
| réponse complète | `SUPPORTED` | Réponse étayée |
| réponse partielle | `PARTIAL` | Réponse partielle |
| contenu retrouvé mais contexte incompatible/non démontré | `PROVIDER_NOT_APPLICABLE` | Réponse non disponible dans ce contexte |
| providers sélectionnés sans match | `NO_MATCH` | Aucune correspondance exploitable |
| aucun provider sélectionné | `NO_PROVIDER` | Connaissance interne absente |
| ambiguïté | `ambiguities[]` seulement | annotation, sans état global dédié |
| clarification | `CLARIFICATION_REQUIRED` ou gap `MISSING_CRITICAL_CONTEXT` | question générée seulement si ce gap existe |

A devient « Réponse non disponible dans ce contexte » parce que cinq assertions sont présentes dans `excludedAssertions`, zéro conclusion reste applicable et aucun statement documentaire ne subsiste : `determineCoverage` choisit `PROVIDER_NOT_APPLICABLE`.

C devient « Connaissance interne absente » parce qu’aucun provider n’est inclus : `determineCoverage` choisit `NO_PROVIDER`, puis la projection mappe directement cet état au libellé produit. L’ambiguïté ne gouverne pas cette sélection.

## Corpus vs runtime distinctions

| Élément | DOCUMENT_PRESENT | SOURCE_REGISTERED | ASSERTION_PRESENT | ASSERTION_ACTIVE | RUNTIME_PROVIDER_LOADED | QUERY_RETRIEVABLE | APPLICABLE_TO_REQUEST |
|---|---|---|---|---|---|---|---|
| Scientific Assertion Layer générique | YES | NO | NO | NO | provider vide inspectable | NO | NO |
| P4R `T1 mapping` | YES | YES | YES | YES — 27 retrouvées | YES | YES avec sens exact | YES pour la sonde IRM exacte |
| P4R `T1 natif` | YES | YES | YES | YES — 3 retrouvées | YES | YES avec sens exact | YES pour la sonde IRM exacte |
| terme nu `T1` | YES comme famille documentaire | N/A pour le sens non résolu | pas d’assertion unique « ambiguous:t1 » | NO | P4R existe mais n’est pas sélectionné | NO tant que le sens reste nu | non évalué, retrieval non atteint |
| RB-004 T1 | YES | source documentaire oui | NO assertion atomique implicite | N/A | YES | YES pour `T1 mapping`/`T1 natif` via 18 blocks contrôlés | `APPLICABLE_WITH_LIMITATIONS` documentaire |
| P5 MVO | YES | YES — 3 sources observées dans A | YES — 5 candidates | YES | YES | YES dans A | NO dans A, `UNKNOWN_APPLICABILITY` sur `STENTING` |
| RB-004 no-reflow | YES dans le document gouverné | provider/source documentaires enregistrés | NO assertion atomique implicite | N/A | YES | NO block contrôlé exact dans A | NO |

`DOCUMENT_PRESENT` ne vaut donc ni `ASSERTION_ACTIVE`, ni `QUERY_RETRIEVABLE`, ni `APPLICABLE_TO_REQUEST`.

## First divergent stage A

```text
FIRST_DIVERGENT_STAGE_A = QUERY_PLANNING
DIRECT_ZERO_APPLICABLE_STAGE_A = APPLICABILITY
```

La résolution conserve correctement les deux phénomènes et leur relation contextuelle. Le request est bien `COMPARE`. Le premier écart opposable est le plan : une seule branche composite est créée, alors que KE-001 exige une branche par objet comparé. L’étage qui transforme ensuite le retrieval pertinent en zéro applicable est le garde d’intervention de `applicability.ts`, qui traite une dimension `SOFT` comme une condition obligatoire de présence dans chaque assertion.

## First divergent stage C

```text
FIRST_DIVERGENT_STAGE_C = AMBIGUITY_HANDLING
DOWNSTREAM_MISCLASSIFICATION_C = GAP_CLASSIFICATION
```

La résolution détecte bien `ambiguous:t1`; elle ne doit pas sélectionner silencieusement T1 mapping ou T1 natif. L’écart commence lorsque cette ambiguïté n’est ni représentée par des sens candidats, ni convertie en clarification. Le plan poursuit avec un concept non mappable, puis la présence du concept exact MRI empêche la règle « tous les concepts ambigus/inconnus » de produire `MISSING_CRITICAL_CONTEXT`. `NO_PROVIDER` devient alors une fausse apparence d’absence du corpus.

## Root cause(s)

### A

- `PARTIAL_COVERAGE_MODEL_GAP` : le query planner sait brancher les modalités, pas les objets comparés génériques ;
- `APPLICABILITY_OVERCONSTRAINT` : une intervention `SOFT` est utilisée comme garde absolu sans état branch-local utilisable ;
- limitation de corpus secondaire et honnête : RB-004 n’expose aucun block contrôlé exact no-reflow ;
- non-causes : alias no-reflow/MVO, Domain Gate, provider P5, disponibilité des sources.

### C

- `AMBIGUITY_ROUTING` : `ambiguous:t1` est un terminal de résolution sans sens candidats ni action de clarification ;
- provider selection ne peut utiliser que la modalité MRI, jugée insuffisante ;
- gap classification émet `NO_REGISTERED_PROVIDER` au lieu d’un manque de clarification parce qu’un autre concept est exact ;
- output projection présente ensuite `NO_PROVIDER` comme `KNOWLEDGE_ABSENT` ;
- non-causes : absence physique du corpus T1, panne P4R, modalité MRI générique, 01G ou Document Engine.

## What 01G fixed

`01G_CONVERSATIONAL_SYNTHESIS_REPAIR = EFFECTIVE_WITHIN_ITS_SCOPE`

01G a correctement :

- remplacé l’affichage principal des éléments atomiques par une synthèse gouvernée ;
- conservé assertions, sources, limites, gaps et contradictions comme éléments inspectables ;
- maintenu `UNDERSTAND`, zéro Project write, zéro Protocol projection et zéro provider externe ;
- produit le contrôle B attendu.

Les défauts A et C se situent avant ou dans le `KnowledgeResult`; ils ne contredisent pas le succès borné de 01G et ne justifient pas sa réouverture.

## What is not defective

- la surface conversationnelle exécute le Domain Gate et route A/B/C vers `UNDERSTAND` ;
- les termes scientifiques des cas A et B sont préservés ; le T1 nu de C est récupéré depuis le texte original même s’il n’est pas dans le registre de session ;
- le contrat `NO_STUDY` / `NO_PROTOCOL` du contrôle B reste respecté ;
- Project writes = 0 et Protocol projections = 0 sur ce corridor ;
- P5 est chargé et retourne les assertions MVO attendues ;
- P4R est chargé et retourne des assertions T1 effectives lorsque le sens exact est fourni ;
- RB-004 reste documentaire et n’est pas promu en assertion ;
- l’IRM générique n’empêche pas les sondes exactes T1 d’atteindre P4R ;
- la conservation de trois sources dans A est une conservation de provenance, pas une promotion scientifique ;
- le Document Engine n’est pas le premier étage divergent observé ;
- PRODUCT TRACE n’existe toujours pas : la trace de ce rapport est une reconstruction locale manuelle.

## Minimal future repair surface

Ce rapport n’autorise ni n’implémente ces réparations. Les plus petites surfaces propriétaires à considérer dans une mission séparée sont :

1. **A — query planning / coverage** : généraliser les branches comparatives aux objets effectivement comparés, pas uniquement aux modalités, tout en conservant chaque branche vide ou partielle ;
2. **A — applicability** : réconcilier la force `SOFT/HARD` du contexte avec les gardes d’applicabilité et empêcher qu’une dimension non documentée soit automatiquement confondue avec une incompatibilité globale ;
3. **C — ambiguity** : conserver des sens candidats gouvernés, calculer leur impact et utiliser le chemin existant de clarification lorsque le sens change le provider ou la conclusion ;
4. **C — gap/output state** : ne pas présenter `NO_PROVIDER` comme absence de connaissance lorsque le concept critique est explicitement ambigu et que des providers existent pour des sens gouvernés voisins ;
5. **normalisation secondaire** : aligner les identifiants canoniques de modalité P4R et les valeurs runtime avant de conclure hors domaine.

Une mission de réparation devra attribuer séparément les contrats au `query-planner`, à `applicability`, au `conflict-gap-analyzer` et, pour C, au `concept-resolver`/ambiguity routing. Elle ne doit ajouter ni corpus ni assertion pour masquer ces défauts de contrôle.

## Tests

Sondes locales déterministes, sans réseau :

- cas uniques A, B et C reconstruits de l’entrée au `KnowledgeResult` ;
- sondes exactes `T1 mapping` et `T1 natif` en IRM cardiaque ;
- sondes exactes `T1 mapping` et `T1 natif` avec modalité générique IRM ;
- 22 exécutions locales du Knowledge Engine au total : les cinq premières entrées ont été rejouées quatre fois uniquement pour réduire et vérifier la stabilité de la sortie de diagnostic ; les deux sondes MRI génériques ont été exécutées une fois ;
- résultats déterministes stables aux mêmes entrées et au même timestamp ;
- `externalCallMade = false` pour toutes les sondes.

Suites ciblées :

```text
src/features/knowledge-engine/__tests__/reasoning.test.ts                         9 passed
src/features/knowledge-engine/__tests__/contracts.test.ts                         9 passed
src/features/knowledge-engine/__tests__/eng-002-product-cases.test.ts             14 passed
src/features/protocol-designer/functional-reset/__tests__/
  product-checkpoint-01g-governed-synthesis.test.tsx                               6 passed

Test files = 4 passed / 4
Tests = 38 passed / 38
Failures = 0
Skipped = 0
```

Ces PASS sont des preuves techniques locales. Ils ne valident pas scientifiquement les réponses et montrent aussi que les scénarios A/C ne sont pas encore couverts comme régressions produit ciblées.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
NETWORK_CALLS = 0
NEW_BENCHMARKS = 0
NEW_CAMPAIGNS = 0
BROAD_REPLAYS = 0
```

Aucun Gemini, OpenAI, Terra, PubMed, navigateur, recherche externe ou evaluator LLM n’a été exécuté.

## Git

```text
RUNTIME_CODE_MODIFIED = NO
CORPUS_MODIFIED = NO
AUTHORITIES_MODIFIED = NO
NEW_ASSERTION = NO
NEW_ALIAS = NO
NEW_ENGINE_OR_OWNER = NO
COMMIT_CREATED = NO
PUSH = NO
MERGE_MAIN = NO
DEPLOYMENT = NO
HISTORICAL_UNTRACKED_ARTIFACTS_PRESERVED = YES
```

Le seul artefact persistant créé par 01H est ce rapport. Aucun fichier temporaire de sonde n’est conservé.
