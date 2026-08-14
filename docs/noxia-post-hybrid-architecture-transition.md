# NOXIA-ARCHITECTURE-TRANSITION-002

## Post-Hybrid Runtime Boundaries and Scientific Core Architecture

| Champ | Valeur |
|---|---|
| Décision | `NOXIA_POST_HYBRID_ARCHITECTURE_DEFINED_WITH_LIMITATIONS` |
| Date | 2026-08-14 |
| Statut | `TRANSITION_ARCHITECTURE — NON_NORMATIVE — NON_ADMITTED` |
| Portée | architecture documentaire cible, sans implémentation ni remplacement produit |
| Runtime candidat observé | `PYDANTIC_PLUS_SEM_AUDIT_RUNTIME_CANDIDATE` |
| Appels provider | `0` |
| Blind consulté ou exécuté | `NON` |
| Écriture Research Project | `NON` |
| Modification normative | `NON` |

Ce document fixe une architecture de transition. Il ne modifie ni la Charte fondatrice, ni le Scientific Product Manifesto V2, ni PD-003 V2, OBS-001, PD-009, PD-011 ou VAL. Il ne qualifie aucun runtime et n'admet aucun nouveau composant. Les constats d'implémentation sont datés ; les principes viennent uniquement des autorités existantes.

## 1. Décision architecturale

NOXIA doit être traité comme un unique `SCIENTIFIC_CORE` logique. Les anciennes unités nommées « moteurs » restent des capacités, des runtimes, des projections ou des preuves historiques selon leur responsabilité réelle ; elles ne deviennent pas des autorités scientifiques autonomes.

La cible retenue est :

```text
Conversation
  -> Structured Scientific Interpreter
  -> Candidate Scientific State
  -> Deterministic Guards
  -> SEM-AUDIT conditionnel
  -> Human Decision Envelope
  -> Research Project
  -> projections et capacités consommatrices
```

Le choix `WITH_LIMITATIONS` est requis parce que :

- le runtime PydanticAI est un candidat expérimental, pas le runtime produit ;
- `SEM-AUDIT-L` n'est ni intégré ni qualifié ;
- l'adjudication typée du prototype a échoué techniquement sur 11/11 appels et n'a produit aucune sortie scientifique ;
- `CandidateScientificState` est un contrat expérimental et non le modèle canonique PD-003 V2 ;
- aucun adaptateur d'adoption Candidate State -> Research Project V2 n'existe ;
- OBS possède une autorité documentaire mais aucun runtime produit observé ;
- QRY possède une frontière expérimentale, pas un runtime ;
- VAL ne possède pas encore le runner d'intégration `VAL-SEM-ST-001` ;
- les lecteurs Project, Scientific Thinking et Imaging restent explicitement V1/legacy-compatible.

Ces limitations empêchent un remplacement immédiat, pas la définition de la cible.

## 2. Vocabulaire et régime de preuve

| Terme | Sens appliqué |
|---|---|
| `SCIENTIFIC_CORE` | Système logique global de raisonnement scientifique NOXIA. |
| `CAPABILITY_MODULE` | Responsabilité métier ou scientifique bornée, sans présupposer un runtime autonome. |
| `RUNTIME` | Implémentation technique remplaçable d'une ou plusieurs capacités. |
| `PROJECTION` | Représentation dérivée d'un état gouverné ; elle ne crée pas de vérité. |
| `SOURCE_OF_TRUTH_OWNER` | Domaine propriétaire de l'état adopté, notamment Research Project pour la stratégie de projet et Knowledge pour les connaissances qualifiées. |
| `ENGINE_LAB` | Espace expérimental non normatif et sans admission produit implicite. |

Les plans suivants restent séparés :

| Plan | Autorité ou preuve | Ce qu'il ne prouve pas |
|---|---|---|
| Principes | Charte fondatrice et Scientific Product Manifesto V2 | état d'implémentation |
| Modèle conceptuel | PD-003 V2 et contrats spécialisés admis | migration des runtimes V1 |
| Cible | présent document et cartes de transition | existence produit |
| État observé | code, tests, registres Engine Lab, rapports datés | qualification PD-011 |
| Hypothèse expérimentale | résultats Hybrid Runtime et ablations | autorité scientifique ou adoption |

Une contradiction n'est jamais résolue silencieusement : lorsqu'un runtime V1 contredit ou ne couvre pas PD-003 V2, le runtime reste décrit comme legacy et une frontière de migration est déclarée.

## 3. Inventaire et décisions

La matrice complète est la source tabulaire de cette section : [`architecture/post-hybrid-component-matrix.csv`](../architecture/post-hybrid-component-matrix.csv).

### 3.1 Composants conservés ou renforcés

- `SEM-AUDIT-D` : garder et renforcer comme suite de gardes déterministes non mutantes ; sa décision de transition n'est pas une admission.
- `Research Project` : garder et renforcer comme propriétaire exclusif des décisions de projet adoptées.
- `Knowledge` : garder et renforcer comme propriétaire des connaissances générales qualifiées et de leur applicabilité.
- `Imaging` : garder et renforcer comme capacité spécialisée, puis migrer ses objets V1 vers les frontières PD-003 V2/OBS.
- `Validation` : garder et renforcer comme capacité diagnostique et d'évaluation, distincte de l'audit sémantique.
- `Document Projection` : garder et renforcer comme projection déclarative de l'état gouverné.
- `Template Engine` : garder comme composition déterministe de définitions ; il ne possède ni contenu scientifique ni décision.
- `Regulatory` : garder comme résolution bornée et datée, sans promotion automatique dans Project.
- `Adaptive Research Workspace` : garder et renforcer comme projection du Research Project vivant.

### 3.2 Composants simplifiés, recyclés ou différés

- `Structured Scientific Interpreter` : conserver la capacité mais remplacer progressivement son runtime legacy ; PydanticAI reste seulement le candidat observé.
- `Scientific Thinking` : simplifier en capacité de formulation et comparaison de candidats scientifiques, sans vérité indépendante.
- `SEM Single` : recycler ses garanties et surfaces de test vers une fonction d'audit non mutante, sans le promouvoir tel quel.
- `SEM-AUDIT-L` : recycler comme second regard conditionnel, explicable et fail-closed ; aucune décision Project.
- `OBS` : préserver intégralement son contrat, mais différer le runtime jusqu'à la disponibilité des objets PD-003 V2 et des handoffs qualifiés.
- `QRY` : différer le runtime ; la frontière PD-009/Engine Lab reste la cible de sélection de prochaine action.

### 3.3 Composant archivé

`SEM Full legacy` doit entrer dans une trajectoire d'archive fonctionnelle après intégration et qualification du runtime hybride. Archiver signifie retirer du chemin nominal futur tout en conservant le code, les tests, fixtures, rapports, résultats, digests et campagnes comme corpus de non-régression et preuve historique. La décision de fermeture définitive reste interdite avant l'intégration hybride.

## 4. Dépendances SEM restantes

La carte exhaustive est [`SEM_DEPENDENCY_MAP`](../architecture/sem-transition-map.md). Les dépendances critiques observées sont :

1. le point d'entrée serveur `api/scientific-semantic.ts` et ses prompts ;
2. `SemanticConversationalWorkspace` et son branchement dans `ProtocolDesignerDemo` ;
3. les adaptateurs `semanticModelToValidatedIntent` et `semanticModelToScientificSessionContext` ;
4. le `semanticSnapshot` de l'intake et les références/digests transmis à Scientific Thinking ;
5. la vérification Knowledge incorporée au pipeline SEM legacy ;
6. la session, l'historique, la canonicalisation, le critic, la couverture et le provider legacy ;
7. les tests, campagnes manuelles, fixtures, rapports et résultats SEM historiques ;
8. les runners expérimentaux qui utilisent SEM Full ou SEM Single comme baseline ou ablation.

Le `CandidateScientificState` hybride n'a actuellement aucun consommateur produit. Ses consommateurs observés sont exclusivement les gardes, l'audit, l'adjudication, la consolidation et le reporting du prototype Engine Lab. Il ne faut donc pas confondre preuve de forme expérimentale et intégration.

## 5. Architecture cible et frontières

### 5.1 Flux principal

| Frontière | Entrée | Sortie | Propriétaire | Responsabilité | Interdictions |
|---|---|---|---|---|---|
| Conversation -> Structured Interpreter | tours visibles, langue, contexte autorisé, état candidat précédent référencé | interprétation structurée et références au brut | capability `Scientific Interpretation`; source utilisateur conservée séparément | préserver explicites, relations, polarités, temporalités, corrections, inconnues et ambiguïtés | inventer une décision, effacer un tour, écrire Project, traiter le LLM comme vérité |
| Interpreter -> Candidate Scientific State | sortie native persistée et validable | état candidat versionné, provenance, erreurs de contrat | runtime hybride pour la forme ; aucun owner de vérité adopté | représenter ce qui est dit, inféré, proposé ou inconnu sans les confondre | convertir candidat en adopté, compléter silencieusement une propriété absente |
| Candidate -> Deterministic Guards | candidat, état précédent, brut, décisions déjà confirmées | constats déterministes et triggers d'audit | capability `Semantic Audit`, branche déterministe | vérifier invariants structuraux, provenance, ownership, polarité et historique | corriger la science, supprimer un élément, rendre une décision humaine |
| Guards -> SEM-AUDIT conditionnel | candidat inchangé, constats, source autorisée | findings non mutants ou indisponibilité explicite | capability `Semantic Audit`, branche LLM conditionnelle | rechercher une dérive sémantique seulement lorsque les triggers l'exigent | réécrire le candidat, auto-fixer, choisir endpoint/méthode, masquer un échec provider |
| Audit -> Human Decision Envelope | candidat, findings, options, preuves, inconnues | décision tracée avec acteur, mandat, statut et cible | humain ou processus explicitement autorisé | adopter, rejeter, différer, rouvrir ou demander clarification | simuler un reviewer, inférer un mandat, prendre un PASS PD-011 |
| Human Decision -> Research Project | paquet d'adoption versionné, décisions valides, provenance, mapping V2 | mutation Project détenue et journalisée, ou rejet explicite du handoff | `Research Project` | conserver uniquement l'état de projet adopté et ses versions | écrire sans acteur/mandat, importer Knowledge comme décision, accepter un mapping incomplet |

### 5.2 Consommateurs du Research Project et du contexte scientifique

| Consommateur | Entrée autorisée | Sortie | Owner | Responsabilité | Interdictions |
|---|---|---|---|---|---|
| Knowledge | requête de connaissance bornée, contexte minimal, inconnues ; pas une mutation Project | assertions, preuves, limites, applicability et contradictions | `Knowledge` | soutenir le raisonnement avec connaissances qualifiées | adopter dans Project, transformer support en décision |
| OBS | ScientificModel ou candidat explicitement routé, observables, mesures, preuves et inconnues | paquet d'observabilité/mesure avec statuts | `OBS` pour la sémantique de mesure ; Project pour la sélection | qualifier ObservableProperty, MeasurementDefinition et BiomarkerRole | confondre méthode, image quantitative, mesure, rôle et endpoint ; sélectionner automatiquement |
| Scientific Thinking | état Project courant, contexte Knowledge, candidats et décisions ouvertes | modèles/hypothèses/questions candidats | capability `Scientific Thinking`; Project adopte | rendre explicites les modèles et alternatives scientifiques | s'ériger en source de vérité, auto-adopter une hypothèse |
| Imaging | objectifs/modèles adoptés ou candidats explicitement marqués, handoff OBS, contraintes | stratégie d'imagerie candidate puis handoff versionné | capability `Imaging`; Project adopte | traduire une question en stratégie de mesure/imagerie traçable | imposer paramètres constructeur, créer un biomarqueur adopté, contourner OBS |
| Validation | artefact source/cible, invariants, décisions humaines, traces | diagnostics, constats, statut de validation selon contrat | `Validation`; PD-011 pour décision formelle | détecter pertes et dérives entre frontières | corriger l'artefact, s'auto-qualifier, remplacer SEM-AUDIT |
| Documents | Research Project versionné, templates, décisions et provenance | projections protocoles/synopsis/autres | `Document Projection`; Project reste owner | projeter de manière déterministe et déclarative | créer science, combler les inconnues, devenir une seconde vérité |
| QRY | état courant/adopté, inconnues, ambiguïtés, contradictions, décisions ouvertes et historique des questions | prochaine action/question classée et rationale | `QRY` pour la sélection ; Project conserve les réponses adoptées | maximiser la valeur décisionnelle d'une clarification | reconstruire la conversation, créer vérité ou décision, répéter sans réouverture |

`Knowledge` et `OBS` ne sont pas simplement des lecteurs aval : ils peuvent fournir un support ou un handoff spécialisé au raisonnement. Cette boucle ne modifie jamais Project sans Human Decision Envelope.

## 6. `HYBRID_SCIENTIFIC_RUNTIME_V1` — définition conceptuelle

### 6.1 Composition

Le runtime conceptuel combine :

- un adaptateur d'entrée conversationnelle ;
- un interpréteur structuré primaire ;
- un registre de la sortie native et de son identité ;
- un Candidate Scientific State versionné ;
- des gardes déterministes ;
- des triggers d'audit ;
- `SEM-AUDIT-L` conditionnel ;
- une consolidation fail-closed et non mutante tant qu'elle n'est pas autorisée ;
- un Human Decision Envelope ;
- un futur adaptateur de handoff PD-003 V2 vers Research Project ;
- des traces, digests, erreurs et métriques techniques distinctes des résultats scientifiques.

Cette composition est logique. Elle ne prescrit pas un framework, un langage, un provider ou un déploiement.

### 6.2 Cycle de vie de transition

Les libellés ci-dessous décrivent un cycle conceptuel, pas de nouveaux statuts normatifs :

1. `RECEIVED` — la conversation et son contexte autorisé sont reçus ;
2. `RAW_PERSISTED` — chaque sortie native est conservée avant parsing ;
3. `CANDIDATE_INTERPRETED` — un état candidat est construit sans adoption ;
4. `GUARDS_EVALUATED` — les invariants déterministes sont vérifiés ;
5. `AUDIT_NOT_REQUIRED`, `AUDIT_COMPLETE` ou `AUDIT_UNAVAILABLE` — le second regard est explicitement conditionnel ;
6. `HUMAN_REVIEW_REQUIRED` — les candidats, findings, inconnues et options sont exposés ;
7. décision humaine `ADOPTED`, `REJECTED`, `DEFERRED`, `REOPENED` ou incomplète selon le contrat existant ;
8. `PROJECT_HANDOFF_READY` — uniquement si l'autorité, le mapping V2 et les preuves sont complets ;
9. écriture future par le propriétaire Research Project, ou rejet explicite du handoff.

### 6.3 Invariants

1. La conversation source et chaque sortie native sont conservées avant toute validation.
2. Un parsing réussi ne prouve pas la compréhension scientifique.
3. Un échec de contrat n'efface pas une sortie native lisible, mais interdit son adoption automatique.
4. Chaque élément garde son statut épistémique, sa provenance et son owner.
5. Unknown, ambiguity, contradiction, correction, rejected et superseded restent visibles.
6. Une relation n'est jamais promue au-delà du support source ; association n'implique pas causalité.
7. Candidate n'est jamais synonyme de Project adopted.
8. Les gardes et audits émettent des findings ; ils ne modifient pas silencieusement le candidat.
9. Les appels conditionnels sont traçables ; indisponibilité provider et échec sémantique restent distincts.
10. L'adoption exige un Human Decision Envelope complet avec acteur et mandat.
11. Research Project est le seul owner de l'état de projet adopté.
12. Une projection ou un LLM ne devient jamais source de vérité.

### 6.4 Gestion des erreurs

Les catégories de transition suivantes doivent rester séparées :

| Catégorie | Disposition minimale |
|---|---|
| entrée invalide ou non autorisée | refuser avant provider ; conserver le diagnostic |
| conservation du brut impossible | fail closed ; aucun parsing ne devient preuve |
| échec provider | conserver statut/retry autorisé ; ne pas le compter comme défaut scientifique |
| échec structured contract | conserver le brut et l'erreur exacte ; aucune complétion silencieuse |
| guard déterministe bloquant | exposer le finding ; aucune adoption automatique |
| audit indisponible | conserver le candidat et l'indisponibilité ; appliquer la règle de risque préengagée |
| findings non résolus | orienter vers décision/clarification humaine |
| autorité humaine incomplète | `INCOMPLETE_FOR_ADOPTION` ; aucune écriture Project |
| mapping V1/V2 incomplet | rejeter le handoff, préserver le candidat et ouvrir une décision de migration |
| rejet Project | conserver la trace et le motif sans altérer la source |

La politique de retry, les seuils et les décisions de campagne relèvent de contrats ultérieurs et de PD-011 ; ils ne sont pas inventés ici.

## 7. Migration V1 vers PD-003 V2

La carte complète est [`V1_TO_V2_MIGRATION_BOUNDARIES`](../architecture/v1-v2-boundary-map.md).

Les règles centrales sont :

- le Semantic Model legacy et le Candidate Scientific State ne sont pas des Research Projects V2 ;
- `BIOMARKER` V1 ne se convertit pas univoquement : il faut distinguer ObservableProperty, MeasurementDefinition, mesure et BiomarkerRole ;
- `METHOD` ou `MODALITY` décrit une technique candidate, pas une sélection de projet ;
- un endpoint/outcome candidat ne devient une CanonicalVariable ou un rôle principal qu'après décision Project ;
- les hypothèses Scientific Thinking peuvent alimenter un ScientificModel candidat, jamais l'adopter seules ;
- une `ProjectVariable` V1 n'est pas automatiquement une `CanonicalVariable` ;
- une conversation peut exprimer un besoin ou une temporalité, mais ne crée jamais une `VariableOccurrence` observée ;
- toute migration conserve owner, version, provenance, inconnues, contradictions et limites.

La compatibilité legacy autorise des lecteurs V1 transitoires ; elle ne doit jamais être déclarée conformité V2.

## 8. `SEM-TRANSITION-001`

### 8.1 Valeur conservée

SEM Full a établi des contrats et des preuves réutilisables : conservation des explicites, relations, polarités, corrections, provenance, ownership, canonicalisation déterministe, fail-closed, rate limiting, checkpoints, digests et corpus de non-régression. La suite locale historique de 305 tests reste une preuve technique utile, pas une qualification scientifique finale.

### 8.2 Limites observées

- la qualification legacy est restée inconclusive ;
- le dernier état R5P documentait 21/26 Holdout complets et 5 échecs, sans métriques finales ;
- quatre cas legacy restaient non résolus par la stratégie historique ;
- les inversions entre configurations et les réparations répétées ont établi un risque de sur-ajustement ;
- l'ablation commune n'a pas justifié un critic systématique : quelques améliorations, des dégradations et une majorité sans effet matériel ;
- le contrat reste V1 et couplé à ses adaptateurs downstream.

### 8.3 Recyclage et archive

| Élément SEM | Destination |
|---|---|
| gardes déterministes génériques | `SEM-AUDIT-D` et validation des frontières |
| second passage utile sous trigger | `SEM-AUDIT-L` conditionnel |
| provenance, raw retention, digests, checkpoints | runtime hybride et observabilité technique |
| relation ownership et statuts épistémiques | Candidate State et handoff V2 |
| tests/fixtures/campagnes H01-H30 | corpus historique de non-régression |
| SEM Full comme chemin nominal | archive seulement après intégration hybride qualifiée |
| critic systématique et topologie legacy | non reconduits par défaut ; décision fondée sur qualification |

Aucun code, test, rapport, fixture ou résultat historique ne doit être supprimé.

### 8.4 Relation avec VAL

`SEM-AUDIT` détecte des dérives dans un état candidat au moment de l'interprétation. `VAL` évalue des artefacts et transformations contre des invariants et des contrats, puis produit un diagnostic de validation. Ils peuvent partager des traces et classes de risque, mais ne partagent ni ownership ni décision : Audit ne déclare pas un PASS PD-011 et VAL ne réécrit pas le candidat.

### 8.5 Gates de clôture

La fermeture fonctionnelle de SEM Full requiert au minimum :

1. contrat produit du runtime hybride admis ;
2. adapter Candidate State -> contribution PD-003 V2 explicitement gouverné ;
3. Human Decision Envelope intégré avant toute mutation ;
4. aucun consumer produit direct restant sur le Semantic Model legacy, ou adapter de compatibilité explicitement borné ;
5. qualification PD-011 du runtime et de ses audits dans une campagne indépendante ;
6. non-régression des obligations critiques, pas identité JSON ;
7. plan de rollback et conservation de toutes les preuves SEM ;
8. décision humaine distincte de clôture.

## 9. Roadmap de transition

Nouvelle phase : `HYBRID_FOUNDATION`.

| Ordre | Étape | Prérequis | Dépendances | Risques | Décisions ouvertes |
|---:|---|---|---|---|---|
| 1 | `HYBRID_RUNTIME` | contrat candidat, brut, guards, audit et décision humaine | PD-003 V2, SEM-002, PD-011, Engine Lab | confondre prototype et produit ; reproduire la topologie SEM | contrat produit, trigger Audit-L, traitement de l'adjudication |
| 2 | `SEM_TRANSITION` | runtime hybride intégré en shadow puis qualifié | carte SEM, adapters, non-régression | rupture des snapshots/sessions ; perte d'historique | durée de compatibilité, gate d'archive SEM Full |
| 3 | `QRY_PROTOTYPE` | état candidat/adopté stable, inconnues et décisions ouvertes | PD-009, Human Decision Envelope, Knowledge | chatbot générique ; répétition ; FINISH/STOP erroné | owner du dialogue, mesure de valeur de l'information |
| 4 | `CDM` | décisions Project et objets V2 stables | PD-003 V2, CDM-001, OBS | variable créée avant besoin ; confusion variable/occurrence | mapping ProjectVariable -> CanonicalVariable |
| 5 | `DATA MANAGEMENT` | CDM, sources, occurrences, provenance | qualité, réglementation, workflows documentaires | automatisation prématurée ; perte de lineage | frontières source/ingestion/curation |
| 6 | `BIOSTATISTICS` | variables, estimands, analyses et données qualifiées | CDM, Data Management, Scientific Model | méthode imposée sans décision ; interprétation excessive | contrats d'analyse et d'adjudication |
| 7 | `VAL` | frontières stabilisées et artefacts comparables | PD-011, OBS, SEM-AUDIT, CDM | fusion Audit/Validation ; auto-PASS | runner `VAL-SEM-ST-001`, seuils et panels |
| 8 | `UX WORKSPACE` | QRY et état Project vivant versionnés | PD-004, Project, toutes projections | UI comme source de vérité ; masquage des inconnues | vues par rôle, explicabilité, réouverture des décisions |

La roadmap est propositionnelle. Elle ne modifie aucune roadmap normative existante et n'autorise aucune étape suivante.

## 10. Décisions ouvertes

1. Quel contrat produit succède au `CandidateScientificState` expérimental sans en faire un objet métier concurrent de PD-003 V2 ?
2. Où s'arrête la représentation générique de l'interprétation et où commencent les paquets spécialisés OBS/ST/Imaging ?
3. Quels triggers rendent `SEM-AUDIT-L` nécessaire, optionnel ou interdit ?
4. L'adjudication doit-elle être déterministe, humaine, assistée ou mixte après son échec technique expérimental ?
5. Quel adaptateur remplace les fonctions legacy vers `ValidatedScientificIntent` sans perdre provenance, relations et historique ?
6. Quelle durée de coexistence est autorisée pour les lecteurs V1 ?
7. Quel protocole PD-011 qualifie simultanément compréhension, sécurité, robustesse du contrat et variabilité provider ?
8. Quelle autorité décide la fermeture définitive de SEM Full après intégration hybride ?

## 11. Preuves et exclusions

### Preuves principales

- `docs/pd-003-v2-research-object-model.md` — modèle conceptuel et ownership V2 ;
- `docs/pd-003-v2-engine-impact-matrix.md` — impacts explicitement requis sur les implémentations V1 ;
- `docs/pd-003-v2-legacy-compatibility.md` — compatibilité legacy bornée ;
- `docs/obs-001-observability-measurement-architecture.md` et `docs/obs-001-project-handoff-contract.md` — ownership de la mesure et handoff ;
- `docs/val-000-semantic-reasoning-validation-architecture-report.md` — responsabilité VAL ;
- `docs/noxia-core-transition-001-engine-lab-sem-recycling-and-capability-portfolio-report.md` — inventaire daté et décisions expérimentales ;
- `docs/hybrid-runtime-prototype-01-report.md` et `experiments/engine-lab/results/hybrid-runtime-prototype-01/` — résultat expérimental ;
- `src/features/scientific-semantic-reconstruction/` et `src/pages/ProtocolDesignerDemo.tsx` — dépendances produit legacy ;
- `src/features/protocol-designer/human-decision.ts` — enveloppe de décision ;
- `src/features/research-project-construction/` — owner Project implémenté V1 ;
- `experiments/engine-lab/registry/` — registres et frontière QRY expérimentaux.

### Exclusions vérifiées par périmètre

- aucun manifeste ou document normatif modifié ;
- aucun fichier fonctionnel ou test modifié ;
- aucun nouveau moteur ou runtime implémenté ;
- aucune écriture Research Project ;
- aucun provider appelé ;
- aucun Blind consulté ou exécuté ;
- aucun index de gouvernance modifié ;
- aucun push.

Le `SOURCE-OF-TRUTH-INDEX` n'est pas mis à jour : ces quatre livrables sont des documents de transition non admis, et la mission interdit toute modification normative. Leur éventuelle admission devra faire l'objet d'une mission de gouvernance distincte.

## 12. Conclusion

L'architecture cible est suffisamment définie pour ouvrir `HYBRID_FOUNDATION`, mais pas pour remplacer immédiatement SEM Full, écrire dans Research Project ou déclarer une conformité PD-003 V2.

`NOXIA_POST_HYBRID_ARCHITECTURE_DEFINED_WITH_LIMITATIONS`
