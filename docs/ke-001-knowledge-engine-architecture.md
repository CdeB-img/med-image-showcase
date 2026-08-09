# KE-001 — Knowledge Engine Architecture

## Runtime Knowledge Contract & Foundational Arbitration

| Champ | Valeur |
|---|---|
| Identifiant documentaire | KE-001 |
| Famille documentaire | KE — Knowledge Engine |
| Version | 1.0 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE` |
| Niveau documentaire | `NIVEAU_1 — architecture normative spécialisée` |
| Source maîtresse | `docs/ke-001-knowledge-engine-architecture.md` |
| Éditions dérivées | aucune |
| Date d’état | 9 août 2026 |
| Domaine de responsabilité | orchestration reproductible de connaissances scientifiques gouvernées, contextualisées, traçables et honnêtement incomplètes |
| Autorités supérieures | Charte fondatrice, Scientific Product Manifesto, Product Specification et références normatives spécialisées dans leurs domaines respectifs |
| État d’admission | admis atomiquement par le SOURCE-OF-TRUTH-INDEX version 1.25 |
| État d’implémentation | architecture cible ; aucun Knowledge Engine général conforme à KE-001 n’est démontré |
| Principe directeur | une demande explicite, un contexte conservé, des fournisseurs gouvernés, aucune substitution silencieuse, un résultat structuré avant toute narration |

---

## 0. Gouvernance, mission et règle de lecture

### 0.1 Nature exacte de la mission

KE-001 est le contrat fonctionnel et runtime du futur Knowledge Engine de NOXIA. Il arbitre les questions d’autorité, d’ownership, de contexte, de fédération, d’applicabilité, de preuve, de contradiction, de lacune, de synthèse, de traçabilité et d’évaluation qui empêchaient ENG-001 de commencer sans inventer une politique scientifique.

KE-001 n’est ni un corpus, ni un Knowledge Graph, ni une Prompt Library, ni un moteur documentaire, ni un moteur de décision clinique. Il ne crée aucune connaissance médicale, assertion, source, preuve, relation scientifique, recommandation, protocole, Scientific Program ou Reasoning Book.

La mission autorise et réalise dans la même opération :

- l’arbitrage des treize blocages `KE-B01` à `KE-B13` d’ENG-001A ;
- la correction minimale des seules contradictions documentaires démontrées dans RDE-001, RDE-002 et RDE-003 ;
- l’admission séparée de RDE-001 version 1.1, RDE-002 version 1.1, RDE-003 version 1.1 et KE-001 version 1.0 ;
- la mise à jour atomique du SOURCE-OF-TRUTH-INDEX.

Elle n’autorise aucune implémentation. `OFFICIAL` qualifie ici l’autorité documentaire ; il ne signifie ni moteur livré, ni activation produit, ni validation scientifique, ni PASS PD-011, ni publication.

### 0.2 Corpus documentaire consulté

La lecture a commencé par `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis a suivi l’ordre imposé : Charte fondatrice ; Scientific Product Manifesto ; Product Specification ; PD-003 ; PD-004 ; Manuel UX officiel ; PD-005 ; PD-007 ; PD-009 ; PD-011 ; PD-012 ; PD-013 ; Scientific Territory Model ; Scientific Knowledge Catalog ; Scientific Assertion Layer ; Scientific Knowledge Graph ; corpus structurés P4/P4R/P5 ; RB-003 ; RB-004 ; RB-005 ; P17 ; RDE-001 ; RDE-002 ; RDE-003 ; ENG-001A.

Le manifeste de l’Editorial Engine a été consulté uniquement pour vérifier la frontière de compilation. Il confirme qu’un moteur éditorial transforme des faits et politiques fournis sans découvrir, posséder ou arbitrer la vérité scientifique. Aucune intégration à l’Editorial Engine n’est décidée ici.

### 0.3 Plans de vérité explicitement séparés

| Plan | Contenu applicable | Effet dans KE-001 |
|---|---|---|
| Principes établis | science avant technologie ; contexte avant réponse ; incertitude visible ; décision humaine ; traçabilité ; reproductibilité ; arrêt honnête | invariants non négociables |
| Objets canoniques | objets, relations, cycles et traces de PD-003 | seul vocabulaire durable du projet ; les enveloppes runtime KE n’ajoutent pas d’ontologie métier |
| Références normatives | Product Specification, PD-003/004/005/007/009/011/012/013, Territory, Catalog, Assertion Layer et Knowledge Graph | autorités spécialisées coordonnées, jamais absorbées |
| Connaissances officielles | corpus structurés admis, RB admis, assertions et sources dans leur version et domaine | matière interrogeable après déclaration par un fournisseur gouverné |
| Architecture RDE | RDE-001/002/003 version 1.1 | parenté, workflow et moteurs consommateurs admis dans la même opération |
| Décisions KE-001 | contrats runtime, ownership, statuts, politiques et arrêts du présent document | nouvelles décisions normatives bornées au Knowledge Engine |
| État réellement implémenté | démonstrateur V1 et services spécialisés/fixtures bornés ; registres généraux d’assertions décrits comme vides dans l’état consulté | aucune preuve d’un Knowledge Engine général conforme |
| Hypothèses | technologie d’indexation, stockage, cache, transport, modèles et fournisseurs futurs | choix d’implémentation non normatifs tant que les contrats sont conservés |
| Extensions futures | nouveaux corpus, terminologies, fournisseurs, projections et campagnes d’évaluation | absentes jusqu’à admission explicite |

### 0.4 Autorités et préséance

En cas de tension, la règle suivante s’applique :

1. les constitutions gouvernent les principes ;
2. PD-003 gouverne les objets métier et les mutations du projet ;
3. PD-009 gouverne la prochaine action scientifique, les arrêts, les reprises et les décisions humaines ;
4. PD-005 gouverne les rôles IA, jamais l’autorité d’une connaissance ;
5. PD-012/PD-013 gouvernent l’identité, l’ownership et le portefeuille des Programs, jamais la force d’une preuve ;
6. les architectures du Catalog, de l’Assertion Layer et du Knowledge Graph gouvernent leurs propres structures ;
7. les corpus et sources gouvernés portent le contenu scientifique dans leur domaine et leur version ;
8. KE-001 gouverne la composition runtime de ces autorités sans en changer le sens ;
9. PD-011 gouverne exclusivement l’évaluation, PASS/FAIL et la promotion d’une implémentation.

Une autorité documentaire plus récente ne rend pas une source scientifique plus forte. Une source scientifique plus récente ne modifie pas silencieusement un état de projet historique.

### 0.5 Contradictions arbitrées sans effacement historique

| Tension constatée | Décision KE-001 | Conséquence |
|---|---|---|
| Knowledge présenté à la fois comme recherche, sélection, évaluation et synthèse | Knowledge orchestre ces opérations et calcule les résultats structurés déterministes ; les rôles R06–R09 proposent sous contrôle, les corpus gardent l’autorité, l’humain garde les décisions | aucune capacité probabiliste ne devient autorité scientifique |
| Catalog, Programs, KG, RB et corpus structurés pouvaient tous sembler routeurs ou sources | le Registry runtime KE est l’unique inventaire d’exécution ; Catalog et Programs fournissent des signaux de routage/ownership ; seuls les providers déclarés retournent du contenu | pas de lecture implicite de tous les documents |
| RB officiels mais narratifs, corpus structurés atomiques | fédération sans assimilation : chaque adapter expose sa granularité et son statut ; aucun passage de RB ne devient une ScientificAssertion par simple extraction | provenance et force restent visibles |
| Scientific Assertion Layer général vide alors que des corpus spécialisés existent | le provider général peut retourner `NO_MATCH` sans masquer les providers spécialisés | aucun vide général n’annule une connaissance spécialisée |
| Synthèse runtime, Synthèse de preuves et réponse narrative confondues | trois objets distincts : `RuntimeKnowledgeSynthesis`, Synthèse de preuves canonique gouvernée, Projection narrative du Document Engine | aucune narration n’actualise la connaissance |
| `KnowledgeUnavailable` et `NO_SUPPORTED_KNOWLEDGE` employés comme synonymes | le premier est un événement de workflow ; le second est une projection consommateur d’une lacune qualifiée | un même gap peut produire l’un, l’autre ou les deux selon l’impact |

---

# Partie I — Contrat du Knowledge Engine

## 1. A — Mission, non-mission et responsabilité exacte

### 1.1 Définition

Le **Knowledge Engine** est l’orchestrateur scientifique fédéré qui transforme une demande de connaissance bornée et son contexte en un `KnowledgeResult` structuré, reproductible, versionné et traçable.

Il compose quatre responsabilités inséparables :

1. construire et valider un plan de requête reproductible ;
2. sélectionner et interroger les providers autorisés via des adapters communs ;
3. résoudre déterministement applicabilité, assertions, contradictions, lacunes et limites ;
4. produire une synthèse runtime structurée sans créer de connaissance officielle ni de narration libre.

### 1.2 Ce que Knowledge fait

- lit les objets PD-003 explicitement inclus dans le contexte autorisé ;
- lit l’action et les gardes choisies par PD-009 ;
- résout les concepts enregistrés et conserve les inconnues ;
- construit un `QueryPlan` et un snapshot du registry ;
- collecte des résultats via des providers déclarés ;
- filtre par cycle documentaire, domaine de validité et applicabilité ;
- conserve les positions compatibles, divergentes, contradictoires et insuffisantes ;
- produit assertions applicables, sources, limites, controverses, lacunes et traces ;
- émet une Contribution candidate et des événements de workflow lorsque requis.

### 1.3 Ce que Knowledge ne fait jamais

- choisir la prochaine action scientifique à la place de PD-009 ;
- créer, corriger, publier, rétracter ou activer un corpus, une source, une preuve ou une assertion ;
- modifier directement le Dossier, la Version de stratégie, l’État de connaissance effectif, une Décision ou une Projection ;
- transformer une relation proposée par un LLM en relation scientifique effective ;
- fabriquer une propriété pour une modalité, un biomarqueur, un équipement ou une population non couverts ;
- produire une recommandation clinique individuelle, une interprétation patient-level ou un protocole exécutable ;
- résoudre une contradiction en supprimant une position ;
- substituer un corpus proche à un corpus absent ;
- rédiger directement la réponse utilisateur finale.

### 1.4 Ownership par opération

| Opération | Propriétaire | Rôle de Knowledge |
|---|---|---|
| choisir l’action `REQUEST_KNOWLEDGE`, clarifier, réduire la portée, rechercher à l’extérieur, arrêter ou demander une décision | PD-009 | consomme l’action et retourne états/gaps |
| proposer stratégie de recherche | rôle R06 | reçoit une proposition ; valide, normalise ou refuse |
| extraire des candidats depuis une nouvelle source | rôle R07 | exige texte admissible, localisateur et traçabilité |
| proposer qualité et applicabilité d’une preuve | rôle R08 | applique ensuite les règles déterministes et politiques versionnées |
| proposer une organisation des preuves/controverses | rôle R09 | ne délègue jamais le calcul final de `RuntimeKnowledgeSynthesis` |
| construire questions, mécanismes et hypothèses candidates | Scientific Thinking Engine | fournit les connaissances applicables et les gaps |
| proposer la stratégie d’étude | Study Design Engine | fournit les connaissances applicables ; ne choisit pas la stratégie |
| raisonner sur phénomènes, biomarqueurs, modalités et mesures | Imaging Engine | fournit assertions/limites ; ne choisit pas la modalité |
| générer une restitution | Document Engine | fournit le `KnowledgeResult` et les liens de provenance |
| adopter une Contribution et modifier le projet | acteur humain sous Mandat, via les objets et décisions PD-003 | ne modifie jamais directement |
| modifier l’État de connaissance effectif | processus gouverné PD-003 avec Décision/Version et autorité scientifique | signale l’impact ; ne l’exécute pas |

### 1.5 Objets PD-003 lus, proposés et interdits en mutation

| Catégorie | Contrat |
|---|---|
| Lus si autorisés | Dossier de recherche, Version de stratégie, Intention, Situation, Contexte, Question, Objectifs, Hypothèses, Population, Cohorte, Phénomène, Biomarqueur, Variable, Critère, Modalité, Acquisition, Visite, Méthode, Contraintes, Informations, Besoins d’information, Domaines de validité, État de connaissance effectif, Dépendances, Décisions, Limites, Incertitudes, Contradictions et sources/preuves liées |
| Proposés comme Contribution | Information de projet sourcée, Besoin d’information, Limite, Incertitude, Contradiction, option de clarification, lien de provenance, relation candidate et analyse d’impact candidate |
| Jamais mutés directement | tous les objets canoniques, leurs cycles, décisions, versions, projections, sources, preuves, assertions et synthèses effectives |

Une trace d’exécution KE est un enregistrement runtime immuable lié à une Contribution. Elle n’est pas un nouvel objet métier canonique.

---

# Partie II — Entrée, contexte et plan de requête

## 2. B — `KnowledgeRequest`

### 2.1 Statut

`KnowledgeRequest` est une enveloppe runtime versionnée. Elle matérialise une action PD-009 et peut être liée à un Besoin d’information PD-003. Elle n’ajoute aucun type canonique au modèle métier.

### 2.2 Champs obligatoires

| Champ | Cardinalité | Règle |
|---|---:|---|
| `requestId` | 1 | identité stable de la demande |
| `requestRevision` | 1 | incrémentée à toute modification décisive |
| `requestType` | 1 | `EXPLAIN`, `COMPARE`, `SUPPORT_REASONING`, `CHECK_APPLICABILITY`, `IDENTIFY_GAP`, `UPDATE_IMPACT` ou `DISCOVER_EVIDENCE` |
| `originActionRef` | 1 | action PD-009 qui autorise l’exécution |
| `purpose` | 1 | décision ou compréhension que le résultat doit instruire |
| `originalExpression` | 1 | verbatim utilisateur ou expression source, conservé |
| `normalizedQuestion` | 1 | formulation structurée sans perte des termes spécialisés |
| `scientificObjectRefs` | 1..n | objets scientifiques concernés, avec rôle dans la demande |
| `relationConstraints` | 0..n | relations demandées ou exclues ; aucune relation inconnue n’est présumée |
| `contextPackage` | 1 | contexte minimal et ses états épistémiques |
| `hardConstraints` | 0..n | dimensions jamais relaxables dans ce plan |
| `allowedRelaxations` | 0..n | niveaux explicitement permis |
| `requiredOutput` | 1..n | assertions, comparaison, limites, controverse, gap, sources, etc. |
| `consumer` | 1 | parcours/moteur et usage attendu |
| `knowledgePolicyRef` | 1 | politique d’autorité/applicabilité versionnée |
| `freshnessRequirement` | 1 | date d’état attendue ou `AS_OF_PROJECT_VERSION` |
| `externalSearchPolicy` | 1 | `INTERNAL_ONLY`, `EXTERNAL_ALLOWED`, `EXTERNAL_REQUIRED` ou `EXTERNAL_FORBIDDEN` |
| `privacyClass` | 1 | classification W applicable |
| `projectSnapshotRef` | 0..1 | version immuable lue ; absent seulement pour une session sans Dossier |
| `sessionKnowledgeStateRef` | 0..1 | état runtime local pour un parcours sans Dossier |
| `knownUnknowns` | 0..n | informations nécessaires mais absentes |
| `knownContradictions` | 0..n | valeurs incompatibles conservées séparément |
| `explicitExclusions` | 0..n | négations/exclusions non relaxables |
| `createdBy` | 1 | acteur ou composant autorisé |
| `createdAt` | 1 | date/heure de création |

### 2.3 Gardes d’entrée

Une Question scientifique canonique n’est pas obligatoire pour `EXPLAIN`. Une intention, un terme ou une relation explicitement bornés suffisent. Pour `COMPARE`, `SUPPORT_REASONING`, `CHECK_APPLICABILITY` ou `UPDATE_IMPACT`, la finalité, les objets comparés et les dimensions décisives doivent être présents ou qualifiés inconnus.

Une session sans Dossier utilise un `sessionKnowledgeStateRef` éphémère, conservant demande originale, contexte, décisions de session et résultats. Elle ne prétend pas disposer d’un État de connaissance effectif canonique.

Toute requête longue lit un `projectSnapshotRef` immuable. Si le projet change avant la fin, le résultat reste lié à l’ancien snapshot et reçoit `STALE_BY_PROJECT_CHANGE`; il n’est jamais fusionné automatiquement. Une nouvelle révision est requise pour les branches affectées.

## 3. C — `ContextPackage`

### 3.1 Dimensions

Le contexte ne se réduit pas à une chaîne de texte. Il peut inclure : domaine, pathologie, phénomène, population, cohorte, anatomie, modalité, acquisition/méthode, mesure, temps, intervention, comparateur, équipement/version, site, usage, objectif, niveau d’analyse et juridiction. Seules les dimensions nécessaires à la demande sont transmises.

Chaque valeur possède : provenance, état (`KNOWN`, `ASSUMED`, `UNKNOWN`, `NOT_APPLICABLE`, `CONTRADICTORY`, `OBSOLETE`, `WITHHELD`), force (`HARD` ou `SOFT`), temporalité et exclusions.

### 3.2 États globaux

| État | Définition | Effet |
|---|---|---|
| `EXACT` | toutes les dimensions critiques connues sont compatibles avec la requête et le résultat | résultat utilisable dans ce domaine |
| `PARTIAL` | une dimension non critique manque ou une branche seulement est couverte | résultat limité ; aucune généralisation |
| `UNKNOWN` | une dimension critique manque et l’applicabilité ne peut être décidée | clarification, gap ou arrêt |
| `CONTRADICTORY` | au moins deux valeurs critiques incompatibles coexistent | branches séparées ; aucune fusion |
| `OUT_OF_VALIDITY_DOMAIN` | une contrainte dure contredit le domaine de validité du contenu | contenu exclu de la conclusion |

### 3.3 Relaxation explicite

| Niveau | Ce qui peut changer | Autorité | Trace obligatoire |
|---|---|---|---|
| R0 | aucune relaxation | exécution par défaut | contexte exact |
| R1 | détail technique non décisif explicitement marqué `SOFT` | règle déclarée dans `allowedRelaxations` | dimension retirée, motif, perte de portée, nouvelle révision de plan |
| R2 | population, pathologie, phénomène, biomarqueur, modalité, temps ou usage scientifique | nouvelle action PD-009 ou Décision humaine explicite | requête distincte, comparaison exact/relaxé et avertissement visible |

Ne sont jamais relaxables silencieusement : négations et exclusions ; données `WITHHELD` ; dimension patient-level ; pathologie/phénomène/biomarqueur explicitement demandé ; modalités d’une comparaison ; sécurité ; juridiction ; équipement lorsqu’il conditionne une compatibilité ; valeur contradictoire ; condition de refus.

Un résultat relaxé ne remplace jamais le résultat exact. Il est présenté comme une branche différente et ne peut justifier une propriété dans le contexte initial.

### 3.4 Préservation de la spécificité

Le `normalizedQuestion` conserve les termes spécialisés, leur rôle et leurs relations. La preuve de non-généralisation est constituée par : verbatim ; concepts résolus ; contraintes relationnelles ; dimensions du contexte ; exclusions ; plan exact ; écarts de relaxation ; localisateurs ; et comparaison entre objets demandés et objets présents dans chaque conclusion.

## 4. D — Runtime Knowledge Provider Registry

### 4.1 Autorité et nature

Le **Runtime Knowledge Provider Registry** est l’inventaire versionné des surfaces interrogeables par KE. Il est gouverné par KE-001 et alimenté uniquement par des admissions documentaires/scientifiques déjà autorisées. Il ne remplace ni le SOURCE-OF-TRUTH-INDEX, ni PD-013, ni le Catalog, ni le Knowledge Graph.

Le registry est une cible d’implémentation ; aucun fichier, registre ou service nouveau n’est créé par KE-001.

### 4.2 Entrée de provider

| Champ | Règle |
|---|---|
| identité et version | stables, non réutilisées |
| type | `STRUCTURED_CORPUS`, `KNOWLEDGE_GRAPH`, `REASONING_BOOK`, `EXTERNAL_DISCOVERY`, `USER_DOCUMENT` |
| autorité source | document/corpus officiel ou politique candidate explicite |
| statut documentaire/scientifique | courant, historique, remplacé, rétracté, candidat ou privé |
| domaines couverts | déclarés positivement ; absence de déclaration = absence de couverture |
| capacités | concept, assertion, evidence, source, graph, documentary statement, discovery |
| adapter contract/version | obligatoire |
| policy refs | applicabilité, preuves, fraîcheur, confidentialité |
| source representation | version, digest, localisateur et lien vers la source maîtresse |
| Program/Territory links | routage et impact seulement |
| dépendances | autres providers requis, sans cascade implicite |
| disponibilité | état et motif distincts de la couverture scientifique |

### 4.3 Providers initiaux déclarables

| Surface existante | Rôle runtime décidé | Limite |
|---|---|---|
| Scientific Knowledge Graph général | provider de concepts, relations, assertions et preuves effectivement présentes | un registre général vide retourne `NO_MATCH`, jamais une couverture négative universelle |
| P4R | provider structuré courant pour le périmètre ECV/T1 consolidé | P4 reste version historique/rejouable, non provider courant concurrent |
| P5 | provider structuré pour ses domaines explicitement couverts | aucune extension par analogie |
| RB-003, RB-004, RB-005 | providers documentaires gouvernés, chacun dans son domaine/version | passages et décisions ne deviennent pas automatiquement des ScientificAssertions |
| source externe | provider de découverte de candidats, si politique U l’autorise | aucun candidat n’est officiel par découverte |
| document utilisateur | provider privé de déclarations candidates, si politique V l’autorise | jamais preuve scientifique générale par défaut |

Les corpus P4R/P5 sont découverts par leurs domaines déclarés, identités de concepts et liens de Territory/Program/Catalog disponibles. Le Catalog est un signal de couverture et de priorité, pas un moteur de preuve. Un Program peut router vers un RB officiel même si son portefeuille `ScientificAssertionRefs` est vide, parce que le lien d’actif officiel est une relation d’ownership ; le Program n’est jamais interrogé comme contenu.

Un actif possédé par un Program et consommé par un autre conserve son owner ; la requête enregistre les deux ProgramRefs et ne transfère ni identité ni autorité.

### 4.4 Sélection des providers

La sélection est déterministe :

1. filtrer par statut autorisé, disponibilité, confidentialité et date d’état ;
2. faire correspondre les concepts et domaines déclarés ;
3. inclure tous les providers exacts capables de répondre au type de demande ;
4. inclure les providers plus larges seulement dans une branche relaxée autorisée ;
5. enregistrer chaque inclusion et exclusion ;
6. ne jamais utiliser l’ordre du registry comme hiérarchie scientifique.

## 5. E — Contrat commun d’un Corpus Adapter

### 5.1 Entrée

Tout adapter reçoit : `KnowledgeRequest`, `ContextPackage`, fragment de `QueryPlan`, snapshot du provider registry, policy refs, version/digest de la représentation source et budget d’exécution non scientifique.

### 5.2 Sortie minimale

| Élément | Exigence |
|---|---|
| provider/version | obligatoires |
| statut d’exécution | succès, indisponible, échec, timeout ou refus de politique |
| couverture déclarée | domaine exact interrogé |
| résultats atomiques | identités, type, contenu structuré ou statement documentaire |
| contexte de validité | dimensions connues/inconnues/exclues |
| provenance | corpus, révision, source, localisateur et digest |
| relations de preuve | supporte, réfute, qualifie, mentionne, dérive, corrige ou rétracte |
| limites | du provider et du résultat |
| continuation | complète, page suivante, épuisée ou non déterminable |
| diagnostics | exclusions et raisons, sans transformer la panne en lacune scientifique |

### 5.3 Garanties

Un adapter doit être déterministe à entrée/version identiques ; il ne peut augmenter la portée d’un énoncé, fabriquer un localisateur, cacher un statut de cycle de vie, convertir un texte en assertion effective ou supprimer un résultat contradictoire.

Pour un Reasoning Book, l’exécution porte sur une représentation dérivée contrôlée, liée au DOCX maître par version et digest. L’adapter échoue en `SOURCE_REPRESENTATION_DRIFT` si le lien n’est plus vérifiable. Le runtime n’édite ni ne prend le PDF dérivé comme nouvelle autorité.

Les localisateurs stables d’un RB combinent identité/version du document, identité de section contrôlée, identité du bloc et digest du passage. Une modification crée une nouvelle révision et une relation de remplacement ; elle ne réutilise pas silencieusement le localisateur.

## 6. F — Résolution de concepts

### 6.1 Ordre de résolution

1. identifiant exact d’un concept dans une terminologie/provider gouverné ;
2. alias, acronyme ou traduction explicitement enregistrés ;
3. composition par objets et relations déjà gouvernés ;
4. proposition LLM ou humaine marquée `CONCEPT_CANDIDATE` ;
5. si aucune résolution gouvernée n’est disponible : `UNKNOWN_CONCEPT` et clarification/gap.

Un LLM peut proposer un alias ; il ne l’active pas. Un terme présent uniquement dans un RB peut être résolu comme `DOCUMENT_BOUND_CONCEPT` avec ce localisateur, sans devenir une identité globale.

### 6.2 Relations exactes

Chaque paire conceptuelle reçoit une relation parmi :

- `SAME_AS` — identité gouvernée démontrée ;
- `RELATED_TO` — relation pertinente sans inclusion ;
- `BROADER_THAN` ;
- `NARROWER_THAN` ;
- `CONTEXT_DEPENDENT_RELATION` — relation explicitement conditionnée ;
- `NOT_EQUIVALENT` ;
- `UNKNOWN_RELATION`.

### 6.3 Cas sensibles opposables

| Termes | Résolution obligatoire |
|---|---|
| no-reflow / MVO / obstruction microvasculaire | jamais synonymes universels ; relation contextuelle dans l’infarctus/reperfusion lorsque le corpus le soutient |
| T1 / valeur T1 / T1 mapping / carte T1 / séquence T1 | objets reliés mais non identiques : paramètre, mesure, méthode, représentation et acquisition |
| ECV / expansion extracellulaire / estimateur ECV / variable ECV / critère ECV | construit, phénomène, estimation, variable et usage décisionnel séparés |
| CT / Spectral CT | `BROADER_THAN` / `NARROWER_THAN` selon la direction |
| MRI / CMR | relation contextuelle ; CMR est l’application cardiaque de l’IRM, pas un alias universel |
| fibrose / cicatrice / expansion extracellulaire | `NOT_EQUIVALENT` sauf relation contextuelle explicitement sourcée |

## 7. G — `QueryPlan`

### 7.1 Champs obligatoires

| Champ | Règle |
|---|---|
| `queryPlanId`, révision, digest | identité et reproductibilité |
| request/context refs | versions exactes |
| registry snapshot | liste/digest des providers connus |
| resolved concepts | identité, rôle, état et relation |
| unresolved concepts | conservés, jamais supprimés |
| subqueries | intersection, alternatives et comparaisons explicites |
| provider selections | inclusions/exclusions avec motif |
| filters | population, pathologie, modalité, méthode, temps, équipement, usage et exclusions |
| matching semantics | `EXACT`, plage, `ANY_OF`, `ALL_OF`, exclusion, inconnu |
| source/evidence policy | version exacte |
| relaxation branches | niveau, autorité, perte de portée |
| stop conditions | épuisement, gap, conflit, indisponibilité ou limite d’itération |
| freshness | date et règle de révision |
| execution order | ordre technique sans préséance scientifique |

### 7.2 Sémantique des filtres

- les dimensions dures sont combinées par intersection ;
- les alternatives déclarées deviennent des sous-requêtes séparées ;
- `ANY_OF` autorise une valeur parmi un ensemble, `ALL_OF` exige toutes les valeurs ;
- une plage requiert un chevauchement compatible et conserve la plage de validité retournée ;
- `UNKNOWN` n’est ni joker ni exclusion ; il déclenche une règle d’applicabilité ;
- une exclusion l’emporte sur une correspondance positive dans la même branche ;
- une comparaison conserve une branche par objet comparé, même si l’une est vide.

La correspondance exacte est exécutée avant toute branche plus générale. Un fort rappel ne peut jamais fusionner les branches ni masquer un faible rappel exact.

## 8. H — Retrieval et couverture

### 8.1 États de couverture

| État | Signification |
|---|---|
| `NO_PROVIDER` | aucun provider enregistré ne déclare le domaine/capacité requis |
| `PROVIDER_NOT_APPLICABLE` | providers connus, tous incompatibles avec le contexte dur |
| `NO_MATCH` | providers applicables interrogés sans résultat correspondant |
| `PARTIAL` | une partie seulement de la demande ou du contexte est couverte |
| `SUPPORTED` | au moins un ensemble applicable soutient la demande avec provenance suffisante |
| `CONFLICTING` | positions applicables incompatibles persistent |
| `SOURCE_UNAVAILABLE` | contenu attendu mais provider/source non accessible |
| `COVERAGE_UNKNOWN` | inventaire ou exécution insuffisants pour conclure à une absence scientifique |

### 8.2 Règle d’absence honnête

« Aucune connaissance applicable n’a été trouvée » n’est licite que si : le registry snapshot est connu ; tous les providers exacts sélectionnés ont été interrogés ou exclus avec un motif scientifique/politique ; les erreurs techniques sont séparées ; les continuations sont épuisées ; les concepts critiques sont résolus ; et la phrase nomme le périmètre et les versions consultés.

Sinon le résultat doit dire `COVERAGE_UNKNOWN` ou `SOURCE_UNAVAILABLE`, jamais `NO_SUPPORTED_KNOWLEDGE`.

La complétude de recherche est une propriété du plan exécuté, non une preuve que toute la littérature mondiale a été couverte.

## 9. I — Applicabilité

### 9.1 Dimensions minimales

Applicabilité est évaluée sur : concept/proposition ; population ; pathologie ; phénomène ; anatomie ; modalité/méthode ; mesure ; temps ; intervention/comparateur ; équipement/version si décisif ; usage ; niveau d’analyse ; et temporalité de la source.

### 9.2 Algorithme normatif

1. exclure les révisions rétractées ou non admissibles selon la politique ;
2. comparer chaque dimension dure ; une incompatibilité produit `OUT_OF_VALIDITY_DOMAIN` ;
3. séparer les contextes contradictoires ;
4. qualifier les dimensions critiques absentes ;
5. retourner l’un des états suivants sans score global compensatoire.

| État | Condition | Usage |
|---|---|---|
| `APPLICABLE_EXACT` | toutes les dimensions critiques correspondent | conclusion dans le contexte exact |
| `APPLICABLE_WITH_LIMITATIONS` | différences non critiques explicites | conclusion limitée |
| `PARTIALLY_APPLICABLE` | seulement une branche/sous-population correspond | aucune extension à la branche absente |
| `UNKNOWN_APPLICABILITY` | dimension critique inconnue | clarification ou gap |
| `CONTRADICTORY_CONTEXT` | valeurs critiques incompatibles coexistent | résultats par branche |
| `OUT_OF_VALIDITY_DOMAIN` | incompatibilité dure | exclusion de la conclusion |

Le LLM ne décide jamais cet état. Il peut uniquement proposer l’identification linguistique des dimensions avant validation déterministe.

---

# Partie III — Sources, assertions, contradictions et lacunes

## 10. J — Autorité des sources et des preuves

### 10.1 Absence de hiérarchie universelle par type documentaire

Il n’existe pas de classement universel où le type de document suffirait à déterminer la force d’une conclusion. Chaque domaine utilise une `EvidencePolicy` versionnée. L’ordre de sélection P4/P4R reste une politique de construction du corpus ECV/T1 ; il ne devient pas la politique générale de NOXIA.

### 10.2 Ordre lexicographique de qualification

| Ordre | Dimension | Décision |
|---:|---|---|
| 1 | admissibilité documentaire | exclure de l’usage courant rétracté, non autorisé ou représentation non vérifiable |
| 2 | applicabilité | préférer exact ; séparer partiel, hors domaine et inconnu |
| 3 | adéquation proposition–source | la source doit pouvoir soutenir exactement le type de proposition |
| 4 | robustesse méthodologique | appliquer la politique propre au domaine et à la question |
| 5 | directness et localisateur | préférer preuve directe, passage complet et localisateur vérifiable |
| 6 | révision et fraîcheur | utiliser la révision courante ; comparer actualité et robustesse sans règle « plus récent gagne » |
| 7 | indépendance et convergence | éviter le double comptage de publications liées ; conserver les dépendances |

Un consensus ou standard est pertinent pour une proposition normative dans son domaine ; une étude primaire peut être plus directe pour un résultat nouveau ; une validation technique est nécessaire pour une propriété technique ; un document constructeur ne soutient que des caractéristiques techniques dans sa version ; une expérience locale décrit un contexte local, jamais une vérité générale.

Une source récente mais moins robuste ne remplace pas une source officielle plus ancienne : les deux sont conservées, leur rôle et leur date sont comparés, et la conclusion est bornée. Une correction désigne la révision courante ; une rétractation exclut l’assertion de l’usage courant et ouvre un impact ; une version remplacée reste disponible pour le replay historique.

### 10.3 Localisateurs et accès

Avant usage positif, une source possède au minimum : identité, révision/date, titre/type, auteur/organisation, identifiant persistant s’il existe, statut d’accès, et localisateur suffisamment précis pour vérifier le passage. Une source limitée au résumé est marquée `ABSTRACT_ONLY` ; elle peut soutenir une description strictement limitée au résumé, jamais une extraction qui exige le texte intégral, une propriété absente du résumé ou une recommandation conditionnelle.

R07 ne peut proposer une assertion que depuis le texte réellement accessible. La vérification de non-dépassement compare proposition, passage exact et portée ; toute extension produit `EXTRACTION_SCOPE_VIOLATION` et exclut le candidat.

Plusieurs EvidenceLinks ne sont jamais comptés comme votes. Ils sont regroupés par proposition, population, méthode, provenance commune et dépendance de données/auteurs, puis synthétisés selon l’EvidencePolicy.

## 11. K — Résolution des assertions

### 11.1 Unités runtime

| Unité retournée | Statut | Usage |
|---|---|---|
| `ScientificAssertionRevision` gouvernée | assertion atomique, versionnée et contextualisée | peut devenir prémisse si effective et applicable |
| Énoncé de connaissance PD-003 lié | objet de connaissance du projet/corpus | lu selon son cycle et son domaine |
| `GovernedDocumentaryStatement` | décision, limitation ou passage explicite d’un RB officiel avec localisateur | explication bornée ; ne devient pas assertion effective |
| `AssertionCandidate` | proposition extraite/proposée non activée | recherche, revue ou gap ; jamais vérité officielle |

La correspondance entre une ScientificAssertion et un Énoncé de connaissance est une relation gouvernée, pas une identité automatique. Une ScientificAssertion effective peut réaliser atomiquement un Énoncé ; un Énoncé narratif ou une décision de RB peut seulement être relié comme statement documentaire tant qu’aucune assertion atomique n’a été admise.

### 11.2 Résolution et déduplication

1. grouper les révisions par identité canonique ;
2. suivre `CORRECTS`, `RETRACTS` et remplacement pour déterminer la révision courante ;
3. grouper les propositions identiques uniquement par identité enregistrée ou règle déterministe ;
4. conserver séparément les propositions proches, plus larges, plus étroites ou contextuelles ;
5. traiter toute équivalence proposée par LLM comme candidate jusqu’à validation ;
6. rattacher toutes les sources et localisateurs sans compter les doublons comme convergence indépendante.

La même publication présente dans un RB et P4R/P5 conserve une seule SourceIdentity si l’identité est démontrée, plusieurs liens de provenance et aucune double pondération. Une proposition présente sous forme narrative et structurée conserve ses deux représentations ; la version structurée n’efface pas le texte, et le texte ne renforce pas artificiellement l’assertion.

### 11.3 Force maximale d’une conclusion

Une conclusion ne peut être plus forte que le plus petit sous-ensemble nécessaire de preuves effectivement récupéré, applicable, localisé et admissible. Les quantificateurs, causalité, comparaison, généralisation, temporalité et certitude de la conclusion doivent tous être soutenus. Toute dimension non soutenue est supprimée ou rendue limitation ; jamais complétée par le LLM.

## 12. L — Contradiction et controverse

### 12.1 États de relation entre positions

| État | Critère |
|---|---|
| `COMPATIBLE` | propositions coexistantes sans incompatibilité dans le même contexte |
| `CONTEXTUAL_DIFFERENCE` | différence expliquée par population, méthode, temps, modalité ou autre domaine de validité |
| `CONTRADICTION` | propositions incompatibles dans un contexte suffisamment identique |
| `CONTROVERSY` | contradiction ou divergence persistante, documentée comme question scientifique durable |
| `INSUFFICIENT_TO_COMPARE` | contexte, preuve ou localisateur insuffisant pour qualifier la relation |

### 12.2 Identité d’une controverse runtime

Une `RuntimeControversy` possède : identité stable dérivée de la proposition et du domaine ; révision ; positions ; contextes ; assertions/sources/localisateurs ; motif de non-résolution ; conséquences ; statut ; et condition de réexamen. Elle est une structure runtime. Elle ne devient Controverse scientifique canonique qu’après Contribution, revue et décision PD-003.

Knowledge ne choisit jamais silencieusement une position. Une politique peut sélectionner la position applicable à un contexte exact tout en conservant les autres comme hors contexte ; elle ne les déclare pas fausses.

## 13. M — Modèle des lacunes

### 13.1 Taxonomie

| Code runtime | Signification | Distinction technique |
|---|---|---|
| `NO_REGISTERED_PROVIDER` | aucun provider gouverné pour le domaine/capacité | architecture/couverture |
| `NO_APPLICABLE_PROVIDER` | providers présents mais hors contexte | applicabilité |
| `NO_ASSERTION_MATCH` | provider applicable sans proposition correspondante | connaissance atomique absente |
| `MISSING_CRITICAL_CONTEXT` | applicabilité indécidable faute de contexte | information projet absente |
| `MISSING_SOURCE_ACCESS` | source connue mais contenu/localisateur inaccessible | disponibilité de preuve |
| `MISSING_REVIEW_OR_ACTIVATION` | candidat présent mais non effectif | gouvernance scientifique |
| `CONFLICT_UNRESOLVED` | positions applicables incompatibles | controverse/contradiction |
| `PROVIDER_FAILURE` | panne, timeout ou erreur | technique, jamais absence scientifique |
| `PRIVACY_BLOCKED` | transmission ou usage interdit | politique |
| `OUT_OF_DOMAIN` | demande hors domaine NOXIA/du provider | frontière |

### 13.2 Mapping PD-003 et workflow

| Gap runtime | Objets/effets possibles |
|---|---|
| contexte manquant | Information inconnue + Besoin d’information si nécessaire à une action |
| assertion/source/revue manquante | Limite + Incertitude ; Besoin d’information seulement si une recherche est justifiée |
| contradiction | Contradiction ; éventuellement Controverse candidate |
| provider absent ou panne | Limite opérationnelle/Événement ; ne crée pas une absence de connaissance générale |
| branche comparative non couverte | Limite par branche ; l’objet/modalité reste présent |

Une lacune n’ouvre pas toujours un Besoin d’information. PD-009 décide si elle justifie clarification, recherche externe, réduction de portée, décision humaine ou arrêt.

`KnowledgeUnavailable` est l’événement RDE-002 émis lorsqu’un gap empêche ou réduit une action. `NO_SUPPORTED_KNOWLEDGE` est le libellé de projection employé par un moteur consommateur lorsque le gap qualifié est scientifique et que l’absence honnête est démontrée. Une panne utilise `SOURCE_UNAVAILABLE` ou `PROVIDER_FAILURE`, jamais `NO_SUPPORTED_KNOWLEDGE`.

Un résultat partiel comparatif est présentable si chaque branche reste visible, si la branche absente n’est pas décrite par analogie et si la comparaison est qualifiée `PARTIAL_COMPARISON`. `NON_COMPARABLE` exige une incompatibilité démontrée ; `COMPARISON_NOT_DOCUMENTED` désigne seulement un manque de connaissance.

---

# Partie IV — Synthèse et résultat

## 14. N — Synthèse structurée runtime

### 14.1 Distinction

`RuntimeKnowledgeSynthesis` est un calcul immuable propre à une exécution. Il n’est ni une Synthèse de preuves canonique publiée/effective, ni une narration. Il peut instruire une Contribution et être consommé dans son contexte, mais ne met à jour aucun corpus.

### 14.2 Structure

| Champ | Contenu |
|---|---|
| `synthesisId`, version, digest | identité/replay |
| question et contexte | demande exacte et domaine effectif |
| conclusions structurées | proposition, statut, applicabilité, force bornée |
| supporting/qualifying/refuting sets | assertions/statements et relations |
| convergence | indépendance et cohérence, sans vote |
| divergences | différences contextuelles et contradictions |
| controversies | identités runtime, positions et conséquences |
| limitations | portée, accès, méthodologie et couverture |
| gaps | taxonomie M et impacts |
| methodologicalImplications | implications descriptives, jamais recommandation clinique |
| sources/localizers | provenance exacte |
| policies/snapshots | registry, corpus, adapter, EvidencePolicy et contexte |

R09 peut proposer une organisation ou une explication des positions. Le calcul final des ensembles, statuts, limites et liens est déterministe et validé contre les résultats récupérés.

## 15. O — `KnowledgeResult`

### 15.1 Contrat exact

| Champ | Cardinalité | Règle |
|---|---:|---|
| `resultId`, `resultRevision`, `resultDigest` | 1 chacun | immuabilité et replay |
| `requestRef`, `queryPlanRef` | 1 chacun | versions exactes |
| `projectSnapshotRef` ou `sessionKnowledgeStateRef` | 1 | contexte source |
| `registrySnapshotRef` | 1 | inventaire exécuté |
| `enginePolicyRefs` | 1..n | versions des politiques |
| `runtimeStatus` | 1 | statut global P |
| `coverageStatus` | 1 | état H |
| `contextStatus` | 1 | état C |
| `applicabilitySummary` | 1 | états I par conclusion/branche |
| `resolvedConcepts` | 0..n | identités et relations |
| `unresolvedConcepts` | 0..n | inconnues conservées |
| `applicableAssertions` | 0..n | révisions effectives et applicables |
| `documentaryStatements` | 0..n | statements RB avec localisateurs |
| `candidateAssertions` | 0..n | séparés des assertions effectives |
| `sources` | 0..n | identités/révisions/statuts |
| `evidenceLinks` | 0..n | liens et localisateurs |
| `runtimeSynthesis` | 0..1 | obligatoire pour une conclusion composée |
| `contradictions` | 0..n | jamais supprimées |
| `controversies` | 0..n | runtime ou canoniques clairement distinguées |
| `gaps` | 0..n | codes M, impacts et conditions de reprise |
| `limitations` | 0..n | portée et conséquences |
| `relaxations` | 0..n | branches et perte de portée |
| `providerExecutions` | 0..n | inclusions, exclusions, succès et pannes ; vide seulement pour `NO_PROVIDER`, avec snapshot et exclusions conservés dans la trace |
| `trace` | 1 | chronologie, rôles, décisions et digests |
| `impactCandidates` | 0..n | branches/objets potentiellement affectés |
| `nextActionSignals` | 0..n | informations pour PD-009, jamais décision autonome |

### 15.2 Critères de recevabilité

Un `KnowledgeResult` est irrecevable s’il ne peut pas relier chaque conclusion à ses propositions, contextes, sources et localisateurs ; s’il mélange candidat/effectif ; s’il masque une panne ; s’il omet une branche demandée ; s’il contient une relation non résolue ; ou s’il dépend d’un texte LLM non validé.

## 16. P — Statuts runtime et usage autorisé

| Statut | Signification | Usage par moteurs spécialisés | Mutation du corpus/projet |
|---|---|---|---|
| `OFFICIAL_EFFECTIVE` | assertion/source effective dans sa version | prémisse dans son domaine exact | non |
| `GOVERNED_DOCUMENTARY` | statement d’un corpus narratif officiel, localisé | explication bornée ; limites visibles ; pas de paramètre exécutable | non |
| `RUNTIME_DERIVED` | synthèse déterministe de contenus autorisés | contribution méthodologique contextualisée | non |
| `ASSERTION_CANDIDATE` | proposition non revue/activée | recherche, question, gap ; pas de conclusion forte | non |
| `SOURCE_CANDIDATE` | source découverte non admise | revue et qualification uniquement | non |
| `USER_PROVIDED_INFORMATION` | déclaration/document privé du projet | contexte local avec provenance, jamais vérité générale | seulement après décision PD-003 |
| `LOCAL_PRACTICE` | expérience/contrainte locale sourcée | faisabilité locale, pas généralisation scientifique | seulement comme Information/Contrainte après décision |
| `UNAVAILABLE_OR_UNKNOWN` | absence/panne/contexte insuffisant qualifiés | arrêt, clarification ou branche partielle | non |

Scientific Thinking, Study Design et Imaging peuvent consommer les trois premiers statuts sous leur domaine et leurs limites. Les candidats ne peuvent soutenir qu’une proposition candidate, une recherche ou une incertitude. Une Projection ne présente jamais un candidat comme établi.

---

# Partie V — LLM, moteurs et boucles

## 17. Q — Matrice des opérations LLM

| Opération | LLM | Décision finale | Contrôle obligatoire |
|---|---|---|---|
| comprendre le langage et segmenter une demande | autorisé | validation par schéma/règles | verbatim et exclusions conservés |
| proposer synonymes, acronymes, traductions | proposition seulement | registry/règle ou humain | statut candidat visible |
| résoudre identité/équivalence de concepts | interdit comme autorité | déterministe ou humain | relation F |
| proposer termes de recherche | autorisé pour R06 | QueryPlan validé déterministement | concepts/contraintes inchangés |
| choisir providers | interdit | registry + règles | inclusions/exclusions tracées |
| classer un type documentaire | proposition seulement | métadonnée gouvernée/règle ou revue | incertitude conservée |
| extraire une assertion | proposition R07 seulement | validation passage/portée ; activation humaine/gouvernée | texte accessible + localisateur |
| qualifier robustesse/applicabilité | proposition R08 seulement | EvidencePolicy/règles/humain | aucune note opaque |
| ordonner sources/assertions | interdit comme autorité | J/K déterministes | ordre explicable |
| détecter une contradiction | peut signaler | comparaison structurée L | positions conservées |
| construire la synthèse runtime | peut proposer une organisation R09 | calcul N déterministe | aucun ajout de proposition |
| rédiger une réponse | autorisé uniquement dans Document Engine | projection contrôlée | fidélité phrase–assertion–source |
| recommander une modalité/stratégie | interdit à Knowledge | moteur propriétaire + décision humaine | alternatives, preuves, limites |
| interpréter patient-level | interdit | refus PD-009 | aucune exception |

Un changement de LLM ne doit modifier ni providers sélectionnés, ni assertions applicables, ni statuts, ni contradictions, ni gaps, ni arrêts. Seule la forme d’une Projection peut varier dans les limites du contrat de fidélité.

## 18. R — Frontières inter-moteurs

### 18.1 Handoffs

| Émetteur → récepteur | Entrée reçue | Sortie retournée | Interdit |
|---|---|---|---|
| PD-009 → Knowledge | action, finalité, contexte, gardes, politique externe | — | imposer une source ou une conclusion |
| Knowledge → PD-009 | `KnowledgeResult`, gaps, pannes, progress signals | action suivante | décider seul de clarifier/rechercher/arrêter |
| Scientific Thinking → Knowledge | question/concept/hypothèse candidate + besoin | assertions/limites/gaps | faire de l’hypothèse une vérité |
| Knowledge → Scientific Thinking | result contextualisé | contribution de raisonnement candidate | écrire Question/Hypothèse |
| Imaging → Knowledge | phénomène/biomarqueur/modalité/mesure candidate + contexte | connaissances et gaps par objet | choisir la modalité |
| Knowledge → Imaging | assertions applicables, limites et lacunes | options d’imagerie proposées par Imaging | inventer une propriété technique |
| Study Design → Knowledge | décision méthodologique à instruire | connaissances/controverses/gaps | construire le plan d’étude |
| Knowledge → Document | result + provenance + contraintes de narration | aucune ; Document produit la Projection | écrire la narration |

### 18.2 Événements de workflow

Les libellés suivants sont des types de trace RDE-002, non de nouveaux objets métier :

- `KnowledgeRequested` ;
- `KnowledgeResultAvailable` ;
- `KnowledgeUnavailable` ;
- `KnowledgeContextChanged` ;
- `KnowledgeImpactDetected` ;
- `KnowledgeReviewRequired`.

Le retour Knowledge → Scientific Thinking est matérialisé par `KnowledgeResultAvailable` ou `KnowledgeUnavailable` avec request/result refs. Le retour Imaging → Knowledge est `KnowledgeRequested` avec les objets d’imagerie candidats. Toute mutation durable utilise les objets Événement, Contribution, Décision, Version et Analyse d’impact de PD-003.

### 18.3 Démarrage sans Question stabilisée

Knowledge peut démarrer en `EXPLAIN` ou `IDENTIFY_GAP` depuis une Intention ou un concept. Scientific Thinking reste propriétaire de la stabilisation de la Question. Un biomarqueur candidat d’Imaging peut ouvrir un besoin de preuve ; son statut candidat empêche la circularité de le traiter comme déjà justifié.

## 19. S — Terminaison des boucles

### 19.1 Preuve de progrès

Une nouvelle itération est recevable seulement si au moins une dimension change de façon mesurable : concept critique résolu ; contexte critique renseigné ; nouveau provider autorisé ; nouvelle source admissible ; nouvelle assertion applicable ; contradiction requalifiée ; gap réduit ; ou action PD-009 révisée.

Une reformulation linguistique, un nouvel ordre de mots, un doublon de source ou une nouvelle sortie narrative ne constituent pas un progrès.

### 19.2 Conditions d’arrêt

La boucle s’arrête lorsque :

- le `requiredOutput` est satisfait avec provenance et applicabilité ;
- tous les providers du plan sont épuisés sans nouveau résultat ;
- aucune nouvelle source exploitable n’a été trouvée au cycle précédent ;
- une dimension critique exige une réponse humaine ;
- la politique interdit l’étape suivante ;
- une panne empêche de conclure et aucune alternative autorisée n’existe ;
- le prochain cycle reproduirait le même digest de plan et de résultat ;
- une condition PD-009 d’arrêt/refus est atteinte.

Knowledge émet les faits de terminaison ; PD-009 choisit poursuivre, clarifier, rechercher, réduire, suspendre ou arrêter. La boucle R06→R07→R08→R09→R06 ne repart que sur une nouvelle stratégie justifiée par un gap résiduel et un changement de plan.

### 19.3 Cache et réutilisation

Un résultat peut être réutilisé seulement avec les mêmes concepts/relations, contexte critique, policy refs, registry/corpus/adapter versions, date de fraîcheur et privacy class. La réutilisation inter-projets conserve le domaine de validité et ne transfère aucune donnée confidentielle. Une mise à jour de source invalide uniquement les résultats et branches liés par leur provenance/dépendance.

## 20. T — Propriétaire de la réponse `UNDERSTAND`

Le Knowledge Engine possède le `KnowledgeResult`, pas le texte utilisateur. Le **Document Engine** possède la `Conversation Knowledge Projection` du parcours `UNDERSTAND`.

Cette Projection :

- sélectionne uniquement les conclusions présentes dans le result ;
- conserve les termes spécialisés et la portée ;
- explique limites, contradictions, gaps et statut des candidats ;
- lie chaque phrase scientifique à une ou plusieurs assertions/statements et localisateurs ;
- sépare faits, interprétations méthodologiques, hypothèses et inconnues ;
- n’ajoute aucune relation, causalité, comparaison, recommandation ou certitude.

Un LLM peut reformuler dans cette frontière. Un validateur déterministe refuse toute phrase sans couverture structurée. Si le Document Engine n’est pas disponible, ENG-001 peut exposer le résultat structuré ou retourner `ENGINE_UNAVAILABLE`; Knowledge ne prend pas silencieusement ownership de la narration.

L’Editorial Engine externe n’est pas mobilisé par KE-001. Une future intégration exigerait une mission séparée et ne pourrait lui transférer aucune autorité scientifique.

---

# Partie VI — Sources externes, documents utilisateur et confidentialité

## 21. U — Recherche scientifique externe

| Politique | Condition |
|---|---|
| `INTERNAL_ONLY` | défaut ; corpus gouvernés suffisants ou aucune autorisation externe |
| `EXTERNAL_ALLOWED` | gap/fraîcheur justifiés, action PD-009 explicite, fournisseur autorisé et contexte minimisé |
| `EXTERNAL_REQUIRED` | demande explicitement actuelle et corpus internes trop anciens/incomplets ; sans accès, résultat `SOURCE_UNAVAILABLE` |
| `EXTERNAL_FORBIDDEN` | sensibilité, juridiction, refus utilisateur ou absence de fournisseur autorisé |

La recherche externe produit des `SOURCE_CANDIDATE` et éventuellement des `ASSERTION_CANDIDATE` via R06–R08. Elle ne met jamais à jour un corpus, une assertion effective ou un État de connaissance. Pour une demande de découverte bibliographique, les candidats peuvent être présentés dans une section séparée, avec leur statut, leur accès et leurs limites ; ils ne soutiennent pas une conclusion forte ou une recommandation tant qu’ils ne sont pas qualifiés selon la politique applicable.

La fraîcheur est une exigence de requête. « Plus récent » ne signifie ni « meilleur » ni « applicable ».

## 22. V — Documents fournis par l’utilisateur

Un document utilisateur est un provider privé lié à un projet/session et à une finalité précise. Il peut fournir : contexte, contrainte locale, hypothèse, source candidate ou contenu à comparer.

Il ne devient jamais automatiquement : source scientifique officielle, preuve effective, assertion gouvernée, propriété d’un équipement, décision humaine ou contenu d’un autre projet.

L’adapter conserve identité du document, auteur déclaré, date, version/digest, accès, localisateurs, déclarations exactes et statut `USER_PROVIDED_INFORMATION` ou `SOURCE_CANDIDATE`. Les conflits avec les corpus officiels restent visibles. L’utilisateur doit pouvoir retirer l’autorisation future ; les résultats historiques conservent seulement la trace permise par la politique du projet.

## 23. W — Confidentialité et minimisation

### 23.1 Classes

| Classe | Exemple | Transmission externe |
|---|---|---|
| `PUBLIC` | corpus/source publique gouvernée | autorisée selon politique |
| `INTERNAL` | architecture, métadonnées internes non sensibles | seulement fournisseur autorisé et finalité explicite |
| `CONFIDENTIAL_PROJECT` | hypothèse, stratégie, document industriel/non publié | interdite par défaut ; autorisation et minimisation obligatoires |
| `RESTRICTED_PERSONAL` | donnée patient identifiable ou réidentifiable | interdite aux providers externes et LLM non spécifiquement autorisés |

### 23.2 Minimisation

Chaque opération transmet uniquement : concepts nécessaires, contexte scientifique minimal, aucune identité directe, aucune date/combinaison réidentifiante non indispensable, aucun document entier si un passage suffit, et aucun historique de projet sans nécessité.

Avant tout appel externe ou LLM, une garde vérifie finalité, provider, classe, champs autorisés, redaction/pseudonymisation, juridiction et trace de consentement/mandat lorsqu’elle est requise. Une donnée patient n’est jamais nécessaire pour répondre à une question scientifique générale ; elle doit être retirée ou la demande refusée.

Le texte « J’ai un T2 élevé » est traité comme potentiellement patient-level : NOXIA ne l’interprète pas, n’établit pas de diagnostic et ne recommande rien. Il peut expliquer de façon générale, après séparation explicite du cas individuel, que l’interprétation dépend du contexte, de la méthode, des valeurs de référence et d’un professionnel habilité.

## 24. X — Reproductibilité

### 24.1 Égalité structurée attendue

À `KnowledgeRequest` canonique, snapshot de projet/session, registry, providers, adapters, corpus, policies et date de fraîcheur identiques, l’exécution doit produire le même : QueryPlan digest ; ensemble de concepts ; providers inclus/exclus ; résultats atomiques ; applicabilités ; assertions ; contradictions ; gaps ; RuntimeKnowledgeSynthesis ; KnowledgeResult digest ; et conditions d’arrêt.

Les digests de reproductibilité portent sur le contenu logique canonique. Ils excluent identifiant d’exécution, horodatage technique, latence et ordre d’arrivée. Ces métadonnées restent néanmoins dans la trace d’exécution.

### 24.2 Variations admises

La latence, l’ordre technique de récupération et la formulation narrative peuvent varier. Une Projection narrative n’est recevable que si sa couverture sémantique et ses liens phrase–assertion restent équivalents. Un LLM différent ne peut modifier le résultat structuré.

### 24.3 Replay et impact

Chaque exécution conserve versions/digests, date, acteur, request, plan, registry, adapter, policy, sources, localisateurs, décisions et diagnostics. Après mise à jour d’un corpus, le replay historique utilise les anciennes versions ; une nouvelle exécution crée un nouveau résultat et une Analyse d’impact cible les seules branches dépendantes.

---

# Partie VII — Cas de rupture et évaluation

## 25. Y — Huit cas architecturaux de rupture

| Cas | Entrée critique | Chemin exigé | Résultat architectural attendu | Refus/non-régression |
|---|---|---|---|---|
| 1 — no-reflow/MVO | question sur leur équivalence après infarctus | résolution F contextuelle → providers cardiaques exacts → L/K/L | relation contextuelle, distinctions visibles, sources/localisateurs | jamais synonymes universels |
| 2 — T1/ECV | comparaison du paramètre T1, du mapping et de l’ECV | concepts typés → P4R + providers exacts → applicabilité | assertions séparées par construit/méthode/variable, limites | aucune fusion T1=ECV |
| 3 — CT spectral | comparaison dual-energy/photon-counting dans un usage donné | RB-003/provider structuré s’il existe → branches par technologie | couverture par branche, gaps explicites | aucune acquisition constructeur ni propriété inventée |
| 4 — T2 individuel | « J’ai un T2 élevé » | garde W/patient-level → refus → explication générale éventuelle | aucune interprétation individuelle | tolérance zéro |
| 5 — modalité non couverte | modalité hors trois RB/corpus déclarés | registry exhaustif → `NO_PROVIDER` ou `NO_MATCH` | objet conservé, gap et condition de reprise | aucun fallback vers corpus proche |
| 6 — preuve contradictoire | deux assertions opposées | contextes séparés → L → synthèse structurée | contradiction ou différence contextuelle conservée | aucun vote par nombre de publications |
| 7 — document utilisateur | note industrielle contredisant un RB | adapter privé V → statut candidat/local → comparaison | deux statuts/provenances visibles | document privé jamais vérité générale |
| 8 — source corrigée/rétractée | résultat antérieur lié à une révision obsolète | lifecycle J → nouvelle exécution → impact ciblé | ancienne trace immuable, nouvelle conclusion/version | aucune réécriture historique |

Les résultats scientifiques exacts de référence ne sont pas inventés par KE-001. Ils seront établis à partir des corpus versionnés par les experts de la campagne PD-011.

## 26. Z — Contrat d’évaluation futur sous PD-011

### 26.1 Dimensions séparées

- rappel de providers et d’assertions applicables ;
- précision conceptuelle et relationnelle ;
- applicabilité et préservation du contexte ;
- provenance et localisateurs ;
- qualification des contradictions ;
- détection/taxonomie des lacunes ;
- abstention et séparation panne/absence ;
- stabilité au changement de LLM ;
- reproductibilité et replay ;
- minimisation des données sensibles ;
- fidélité d’une éventuelle Projection `UNDERSTAND`.

### 26.2 Erreurs à tolérance nulle

- relation scientifique inventée ou concept spécialisé généralisé ;
- source, assertion, preuve ou localisateur fabriqué ;
- révision rétractée utilisée comme actuelle ;
- candidat présenté comme effectif ;
- corpus proche substitué à un corpus absent ;
- contradiction structurante supprimée ;
- panne présentée comme absence scientifique ;
- donnée sensible transmise hors politique ;
- recommandation/interprétation patient-level ;
- mutation de projet/corpus sans Décision et version.

### 26.3 Références, experts et décision

La campagne doit préenregistrer cas, versions, réponses structurées exactes, experts par domaine, règles de désaccord, métriques, seuils contextualisés et erreurs critiques. Les huit cas Y font partie du jeu minimal, complétés par sources corrigées/rétractées, abstract-only, localisateur absent, provider indisponible, perturbations linguistiques et mises à jour de corpus.

Les experts scientifiques établissent les vérités de référence dans leur domaine ; un méthodologiste évalue l’applicabilité ; un expert documentaire/provenance vérifie les localisateurs ; un responsable privacy vérifie W. Leurs identités et Mandats seront nommés par la campagne, pas inventés par KE-001.

Le passage de candidat à moteur utilisable exige un artefact d’évaluation PD-011 versionné et une Décision de promotion explicite. Aucune recette technique, admission documentaire, couverture de tests ou décision KE-001 ne vaut PASS.

---

# Partie VIII — Clôture d’ENG-001A

## 27. Matrice des treize blocages

| ID | Blocage ENG-001A | Mode de clôture | Décision opposable | Section | État après l’opération |
|---|---|---|---|---|---|
| KE-B01 | RDE-001/002/003 non admis | correction RDE requise et réalisée | corrections minimales v1.1 et admission atomique séparée | 29 + addenda RDE | `RESOLVED` |
| KE-B02 | absence de contrat exact entrée/sortie | KE-001 | `KnowledgeRequest`, `ContextPackage`, `QueryPlan`, `KnowledgeResult` | B, C, G, O | `RESOLVED` |
| KE-B03 | absence de registre runtime unifié | KE-001 | Runtime Knowledge Provider Registry et adapters | D, E | `RESOLVED` |
| KE-B04 | absence de sémantique commune | KE-001 | concepts, filtres, relaxation, couverture et applicabilité | C, F, G, H, I | `RESOLVED` |
| KE-B05 | absence de hiérarchie sources/révisions | KE-001 | EvidencePolicy lexicographique, lifecycle et localisateurs | J, K | `RESOLVED` |
| KE-B06 | ownership/mutation indéfinis | KE-001 + PD-003/RDE | matrice d’ownership ; Contribution avant adoption ; aucune mutation directe | A, R | `RESOLVED` |
| KE-B07 | statut des résultats non effectifs | KE-001 | statuts runtime et règles de consommation | P | `RESOLVED` |
| KE-B08 | frontière LLM incomplète | KE-001 | matrice opérationnelle proposition/décision/contrôle | Q | `RESOLVED` |
| KE-B09 | boucles sans terminaison | KE-001 | progrès, arrêt, digest, cache et reprise | S, X | `RESOLVED` |
| KE-B10 | propriétaire `UNDERSTAND` absent | KE-001 + frontière RDE-001 | Document Engine propriétaire de la Conversation Knowledge Projection | T | `RESOLVED` |
| KE-B11 | coexistence RB/corpus structurés | KE-001 | fédération par provider, granularité/statut conservés, déduplication sans assimilation | D, E, K | `RESOLVED` |
| KE-B12 | absence de contrat d’évaluation | KE-001 ; exécution future PD-011 non bloquante pour coder | cas Y et campagne Z sous PD-011 | Y, Z | `RESOLVED_FOR_IMPLEMENTATION`; PASS futur non revendiqué |
| KE-B13 | politique sensible absente | KE-001 | classes, minimisation et garde d’appel externe/LLM | W | `RESOLVED` |

## 28. Matrice de résolution des 122 questions ENG-001A

La matrice ne répète pas l’audit : elle relie chaque question à une décision normative. « Campagne » ou « implémentation » dans la dernière colonne désigne un choix futur non architectural qui ne peut modifier le contrat.

| Q | Question ENG-001A (abrégée) | Section | Décision KE-001 | Autorité | Ouvert résiduel |
|---:|---|---|---|---|---|
| 1 | admission/arbitrages RDE-001 | 29 | v1.1 admise, A01–A10 clos sans nouvelle ontologie | Index, PD-003, RDE-001 | aucun |
| 2 | admission/identifiant RDE-002 | 29 | Workflow conserve RDE-002 ; roadmap corrigée | Index, RDE-001/002 | aucun |
| 3 | statut RDE-003 | 29 | première spécialisation admise v1.1, non implémentée | RDE-001/002/003 | aucun |
| 4 | autorité Knowledge | 0–1 | KE-001 devient l’autorité spécialisée | Index, KE-001 | aucun |
| 5 | droit d’ENG-001 à architecturer | 30 | ENG-001 implémente les contrats ; aucune politique scientifique nouvelle | KE-001 | choix techniques seulement |
| 6 | parcours visés | 1, 18 | service transversal ; premier usage possible UNDERSTAND sans exclusivité | RDE-001/002 | ordre de livraison |
| 7 | domaine initial | 4.3 | tous providers déclarés ; couverture initiale bornée aux actifs réellement adaptés | Index, registry KE | adapters livrés |
| 8 | NumPy/DICOM | 1.3, 13 | connaissance scientifique/méthodologique d’imagerie possible ; support logiciel général hors domaine | Domain Gate, KE-001 | règles lexicales d’entrée |
| 9 | recherche/sélection/évaluation/synthèse | 1.1–1.4 | orchestration + calcul déterministe, sans autorité source | PD-005/009, KE-001 | aucun |
| 10 | rôle R06 | 1.4, 7 | stratégie/termes proposés ; plan validé par KE | PD-005 R06 | aucun |
| 11 | rôle R09 | 1.4, 14 | organisation proposée ; synthèse structurée déterministe KE | PD-005 R09 | aucun |
| 12 | décide applicabilité | 9 | règles KE + EvidencePolicy, jamais LLM | KE-001 | politique par domaine |
| 13 | décide absence | 8, 13, 18 | KE qualifie les faits ; PD-009 choisit l’action | PD-009, KE-001 | aucun |
| 14 | objets lus | 1.5 | liste positive et minimisée | PD-003 | aucun |
| 15 | objets proposés | 1.5 | Contribution : information, besoin, limite, incertitude, contradiction, provenance/impact candidats | PD-003 | aucun |
| 16 | objets jamais modifiés | 1.3, 1.5 | tous les objets canoniques/corpus/projections | PD-003 | aucun |
| 17 | trace durable | 1.5, 24 | trace runtime immuable liée à Contribution | PD-003, KE-001 | support technique |
| 18 | adoption Contribution | 1.4 | humain sous Mandat via workflow/PD-003 | PD-003/009 | aucun |
| 19 | modification État de connaissance | 1.4 | processus gouverné PD-003 + décision/version ; jamais KE | PD-003 | aucun |
| 20 | réponse finale UNDERSTAND | 20 | Document Engine | RDE-001, KE-001 | implémentation Document |
| 21 | schéma demande | 2 | contrat `KnowledgeRequest` exact | KE-001 | représentation technique |
| 22 | Question obligatoire | 2.3 | non pour EXPLAIN ; oui ou inconnue qualifiée pour décisions/comparaisons | PD-003, KE-001 | aucun |
| 23 | parcours sans Dossier | 2.3 | état de session éphémère, pas État effectif canonique | PD-003 | durée technique |
| 24 | contexte minimal | 2–3 | dépend de requestType ; dimensions critiques présentes ou inconnues | KE-001 | tables par domaine |
| 25 | absent/supposé/contradictoire/refusé | 3.1 | états explicites, dont `WITHHELD` | PD-003, KE-001 | aucun |
| 26 | négations/exclusions | 2.2, 3.3 | champs non relaxables et verbatim conservé | KE-001 | aucun |
| 27 | invalidation par contexte | 2.3, 24.3 | nouvelle révision, stale et impact ciblé | PD-003, KE-001 | aucun |
| 28 | version lue | 2.3 | snapshot immuable | PD-003 | aucun |
| 29 | modification concurrente | 2.3 | résultat lié à l’ancien snapshot ; jamais fusion automatique | KE-001 | stratégie de concurrence technique |
| 30 | données sensibles interdites | 23 | données identifiantes/réidentifiantes interdites en externe | Charte, W | aucun |
| 31 | contexte minimal | 23.2 | minimisation par finalité et champ | W | implémentation redaction |
| 32 | preuve de non-généralisation | 3.4 | chaîne verbatim→concepts→contraintes→conclusions/localisateurs | PD-004, KE-001 | tests PD-011 |
| 33 | maintient liste des corpus | 4 | registry KE sous admissions existantes | Index, KE-001 | gouvernance opérationnelle |
| 34 | Catalog runtime | 4.3 | signal de couverture/priorité, jamais preuve ni routeur unique | Catalog, KE-001 | aucun |
| 35 | Programs runtime | 4.3 | ownership, routage, impact ; jamais contenu/preuve | PD-012/013 | aucun |
| 36 | portfolio assertion vide | 4.3 | peut router vers RB officiel via lien d’actif ; pas vers assertion absente | PD-013, Index | aucun |
| 37 | RB interrogeable sans assertion | 5, 11 | `GovernedDocumentaryStatement`, granularité/statut conservés | RB, KE-001 | adapter à livrer |
| 38 | DOCX ou dérivé | 5.3 | représentation contrôlée liée au DOCX maître par digest | Index, KE-001 | format technique |
| 39 | localisateur RB stable | 5.3 | document/version/section/bloc/digest | KE-001 | schéma technique |
| 40 | décision RB vs assertion | 11.1 | relation documentaire, jamais identité automatique | PD-003, Assertion Layer | admission scientifique future |
| 41 | découverte P4/P4R/P5 | 4.3 | domaines/concepts/liens déclarés dans registry ; P4R courant, P4 replay | corpus, KE-001 | adapter |
| 42 | interface spécialisée commune | 5 | Corpus Adapter commun | KE-001 | implémentation |
| 43 | absorption ou fédération | 4, 11 | fédération ; aucune migration implicite | Assertion Layer, KE-001 | évolution séparée |
| 44 | interrogation KG | 4.4 | lorsqu’il est sélectionné par concepts/domaines/capacité | KG, KE-001 | aucun |
| 45 | KG vide/corpus spécialisé | 4.3, 8 | `NO_MATCH` du KG ; autres providers poursuivent | KE-001 | aucun |
| 46 | dédup RB/structuré | 11.2 | SourceIdentity/proposition gouvernée ; provenance double sans double compte | Assertion Layer, KE-001 | règles d’identité |
| 47 | actif inter-Program | 4.3 | owner conservé, consumers tracés, aucun transfert | PD-012/013 | aucun |
| 48 | propagation source | 24.3 | provenance/dépendances → nouvelle exécution et impact ciblé | PD-003, KE-001 | implémentation graphe d’impact |
| 49 | stratégie reproductible | 7 | KE construit/valide ; R06 propose | PD-005, KE-001 | aucun |
| 50 | vocabulaire synonymes | 6 | providers/terminologies gouvernés ; candidat sinon | KG, KE-001 | enrichissement futur |
| 51 | distinctions T1 | 6.3 | paramètre/mesure/méthode/carte/acquisition séparés | PD-003, corpus | aucun |
| 52 | distinctions ECV | 6.3 | construit/estimateur/variable/critère séparés | PD-003, P4R | aucun |
| 53 | no-reflow/MVO | 6.3 | relation contextuelle, jamais synonymie universelle | corpus cardiaque, KE-001 | contenu exact par corpus |
| 54 | entité RB absente KG | 6.1 | `DOCUMENT_BOUND_CONCEPT`, sans identité globale | RB, KE-001 | promotion future |
| 55 | intersection/union | 7.2 | intersection dure, alternatives en sous-requêtes | KE-001 | aucun |
| 56 | combinaison filtres | 7.2 | dimensions explicites et branches séparées | KE-001 | aucun |
| 57 | EXACT/plage/ANY_OF/exclusion/inconnu | 7.2 | sémantique normative définie | KE-001 | aucun |
| 58 | exact vs général | 3.3, 7.2 | exact d’abord ; général uniquement branche relaxée | KE-001 | aucun |
| 59 | relaxation | 3.3 | R1 policy explicite ; R2 PD-009/humain ; trace complète | PD-009, KE-001 | aucun |
| 60 | empêcher encyclopédie | 3.4, 7 | contraintes exactes et résultat par branche | PD-004, KE-001 | tests |
| 61 | corpus omis | 8.2 | registry snapshot + inclusions/exclusions + épuisement | KE-001 | qualité registry |
| 62 | recherche déterministe | 7, 24 | plan/version/digest/replay | KE-001 | aucun |
| 63 | hiérarchie sources | 10 | EvidencePolicy lexicographique par domaine/question | corpus, KE-001 | politiques spécialisées |
| 64 | ordre P4 universel | 10.1 | non, borné à ECV/T1 | P4/P4R | aucun |
| 65 | récent moins robuste | 10.2 | positions comparées ; aucun remplacement automatique | EvidencePolicy | aucun |
| 66 | correction/rétractation | 10.2, 24 | courant exclut rétracté ; historique rejouable ; impact | Assertion Layer, KE-001 | aucun |
| 67 | abstract-only | 10.3 | seulement ce que le résumé soutient ; pas R07 full-text | PD-005, KE-001 | aucun |
| 68 | localisateur minimal | 10.3 | identité/révision + localisation vérifiable | Assertion Layer, KE-001 | format par source |
| 69 | dépassement extraction | 10.3 | validation proposition–passage ; violation exclue | R07, KE-001 | tests |
| 70 | regroupement EvidenceLinks | 10.3 | proposition/contexte/dépendances, jamais votes | Assertion Layer, KE-001 | politique domaine |
| 71 | contexte vs contradiction | 12.1 | cinq états explicites | PD-003, KE-001 | aucun |
| 72 | identité controverse | 12.2 | proposition+domaine, révision/positions/condition de reprise | PD-003, KE-001 | adoption canonique future |
| 73 | conclusion sans revue humaine | 16 | officielle/documentaire/runtime/candidate clairement séparées | PD-003, KE-001 | aucun |
| 74 | runtime vs Synthèse publiée | 14 | calcul d’exécution non effectif vs objet canonique gouverné | PD-003, KE-001 | aucun |
| 75 | phrase liée aux sources | 20 | couverture phrase–assertion–localisateur obligatoire | PD-003, Document Engine | implémentation validator |
| 76 | interdiction d’excès | 11.3 | force plafonnée par sous-ensemble effectivement soutenu | Charte, KE-001 | tests |
| 77 | taxonomie des absences | 13.1 | neuf codes distincts | KE-001 | aucun |
| 78 | deux libellés de gap | 13.2 | événement workflow vs projection consommateur | RDE-002/003, KE-001 | aucun |
| 79 | objets canoniques des gaps | 13.2 | Information/Besoin/Limite/Incertitude/Contradiction/Événement | PD-003 | aucun |
| 80 | gap ouvre toujours besoin | 13.2 | non ; PD-009 choisit selon action | PD-009 | aucun |
| 81 | externe/réduction/arrêt | 13.2, 18 | PD-009/humain ; Knowledge fournit les faits | PD-009 | aucun |
| 82 | refus connaissance vs panne | 8.2, 13 | couverture et exécution séparées | KE-001 | aucun |
| 83 | reprise après ajout | 19, 24 | nouveau snapshot/plan si changement mesurable | KE-001 | aucun |
| 84 | résultat partiel | 13.2 | oui, branches visibles et `PARTIAL_COMPARISON` | KE-001 | aucun |
| 85 | modalité non couverte | 13.2 | conservée comme objet + gap, aucune propriété | RDE-003, KE-001 | aucun |
| 86 | non comparable/non documenté | 13.2 | incompatibilité démontrée vs lacune | KE-001 | aucun |
| 87 | démarrer sans Question | 18.3 | EXPLAIN/IDENTIFY_GAP depuis intention/concept | PD-003, KE-001 | aucun |
| 88 | raffinage Scientific Thinking | 18 | il affine la Question ; Knowledge garde recherche/résultat | RDE-001, KE-001 | aucun |
| 89 | biomarqueur candidat circulaire | 18.3 | candidat ouvre un besoin, ne devient pas prémisse | RDE-003, KE-001 | aucun |
| 90 | événement K→ST | 18.2 | `KnowledgeResultAvailable`/`Unavailable` | RDE-002, KE-001 | aucun |
| 91 | événement Imaging→K | 18.2 | `KnowledgeRequested` avec objets candidats | RDE-002/003, KE-001 | aucun |
| 92 | critère de progrès | 19.1 | changement concept/contexte/provider/source/assertion/gap/action | KE-001 | aucun |
| 93 | arrêt R06–R09 | 19.2 | output satisfait, épuisement, digest identique, garde/limite | PD-005/009, KE-001 | aucun |
| 94 | qui émet l’arrêt | 19.2 | Knowledge émet faits ; PD-009 choisit l’action d’arrêt | PD-009 | aucun |
| 95 | reformulation et relance | 19.1 | digest canonique identique = aucun progrès | KE-001 | aucun |
| 96 | cache scientifique | 19.3 | clé complète versions/contexte/policies/privacy | KE-001 | technologie cache |
| 97 | réutilisation multi-moteurs/projets | 19.3 | oui si domaine/versions identiques et sans données sensibles | KE-001 | implémentation |
| 98 | invalidation ciblée | 24.3 | provenance/dépendances uniquement | PD-003, KE-001 | implémentation |
| 99 | termes de recherche LLM | 17 | proposition R06, validation déterministe | PD-005 | aucun |
| 100 | synonymes absents | 6, 17 | proposition seulement ; inconnu jusqu’à validation | KE-001 | aucun |
| 101 | type documentaire LLM | 17 | proposition ; métadonnée/règle/revue décide | KE-001 | aucun |
| 102 | extraction LLM et full-text | 10.3, 17 | seulement texte accessible, candidat R07 | PD-005 | aucun |
| 103 | applicabilité LLM | 9, 17 | interdit comme autorité | KE-001 | aucun |
| 104 | ordonner sources/assertions | 10, 17 | déterministe via policies | KE-001 | aucun |
| 105 | rédiger depuis résultat | 17, 20 | oui dans Document Engine seulement | RDE-001, KE-001 | Document Engine |
| 106 | contrôle absence d’ajout | 20 | validateur de couverture structurée | KE-001 | implémentation |
| 107 | sources par phrase | 20 | liens obligatoires phrase→conclusion→assertion→localisateur | PD-003, KE-001 | implémentation |
| 108 | général vs patient-level | 23 | garde explicite et refus individuel | Charte, PD-009 | aucun |
| 109 | « T2 élevé » | 23.2 | pas d’interprétation ; explication générale bornée possible | Charte, KE-001 | microcopie validée |
| 110 | recommandation de modalité | 1.3, 17 | moteur propriétaire + Décision humaine ; jamais Knowledge | PD-003/009, RDE-003 | aucun |
| 111 | cas KE | 25–26 | huit ruptures + familles Z | PD-011, KE-001 | campagne |
| 112 | résultats exacts des huit exercices | 25 | forme architecturale fixée ; contenu de référence expert/corpus versionné | PD-011 | vérités de référence campagne |
| 113 | experts | 26.3 | scientifiques domaine + méthodologiste + provenance + privacy, mandatés | PD-011 | identités campagne |
| 114 | métriques séparées | 26.1 | neuf dimensions non compensatoires | PD-011 | seuils campagne |
| 115 | tolérance zéro | 26.2 | dix familles critiques | PD-011 | aucun |
| 116 | test substitution corpus proche | 25 cas 5, 26 | cas positif d’abstention, erreur critique | RDE-003, PD-011 | campagne |
| 117 | stabilité LLM | 17, 24, 26 | égalité structurée, narration seulement équivalente | KE-001, PD-011 | campagne |
| 118 | corpus mis à jour | 24, 26 | replay ancien + nouveau result + impact | KE-001, PD-011 | campagne |
| 119 | corrigé/rétracté/abstract/localisateur | 10, 25, 26 | cas obligatoires et règles définies | KE-001, PD-011 | campagne |
| 120 | minimisation sensible | 23, 26 | tests de garde et absence de champs interdits | Charte, PD-011 | campagne |
| 121 | promotion du moteur | 26.3 | décision humaine après campagne préenregistrée ; aucun score seul | PD-011 | seuils/mandats campagne |
| 122 | artefact de promotion | 26.3 | artefact d’évaluation PD-011 versionné + Décision | PD-011 | nom/identité lors de la campagne |

---

# Partie IX — Corrections RDE, admissions et mandat ENG-001

## 29. Corrections ciblées et décisions d’admission

### 29.1 Principe de correction

Les versions 1.0 de RDE-001/002/003 sont conservées comme état historique dans leurs propres tableaux et formulations. Leur version 1.1 ajoute un arbitrage opposable, corrige les métadonnées et la roadmap, et remplace les décisions candidates. Aucun moteur, objet, corpus ou état d’implémentation n’est ajouté.

### 29.2 Matrice des corrections RDE

| Document | Contradiction démontrée | Correction minimale v1.1 | Effet |
|---|---|---|---|
| RDE-001 | domaine et fonction tous deux nommés Research Design Engine | fonction spécialisée renommée **Study Design Engine** ; les anciens libellés sont des alias historiques | ownership lexical non ambigu |
| RDE-001 | roadmap associait RDE-002 à Imaging et RDE-003 à Biostatistics | roadmap courante : RDE-002 Workflow, RDE-003 Imaging, KE-001 Knowledge ; aucun identifiant futur réservé | collision fermée |
| RDE-001 | macro-états/états de projection semblaient concurrencer PD-003 | macro-états confirmés comme vues calculées RDE-002 ; disponibilité de projection mappée au cycle PD-003 | aucune seconde machine canonique |
| RDE-001 | ownership d’écriture des moteurs incomplet | tous les moteurs émettent des Contributions ; seuls acteurs mandatés/processus PD-003 mutent les objets | aucune écriture prématurée |
| RDE-002 | parent et identifiant candidats | parent RDE-001 v1.1 et identité Workflow confirmés | dépendance admise |
| RDE-002 | événements/générabilité pouvaient devenir objets/états concurrents | événements = types de trace ; générabilité = vue locale ; mapping Projection explicite | PD-003 reste canonique |
| RDE-002 | contrat Knowledge trop général | handoffs, gaps et terminaison délégués explicitement à KE-001 | aucune invention ENG |
| RDE-003 | parents/roadmap candidats | RDE-001/002 v1.1 et identifiant Imaging confirmés | parenté fermée |
| RDE-003 | NonEvaluability, Imaging Endpoint et états d’équipement ambigus | composition d’objets PD-003, Critère+Variable, dimensions orthogonales confirmées | aucune nouvelle identité métier |
| RDE-003 | `NO_SUPPORTED_KNOWLEDGE` non aligné | mapping vers gap KE-001 et événement RDE-002 | absence/panne distinguées |

### 29.3 Mapping normatif des projections RDE

| Vue de disponibilité RDE-001/002 | Cycle canonique PD-003 | Règle |
|---|---|---|
| `NOT_AVAILABLE`, `STRUCTURE_ONLY`, `PARTIALLY_GENERATED` | demandée | états locaux de capacité/contenu ; la Projection peut ne pas encore exister comme contenu produit |
| `READY_FOR_REVIEW` | produite | prête pour relecture, pas relue |
| `READY_FOR_SUBMISSION` | relue | prête pour une décision humaine de diffusion/soumission, jamais déjà diffusée ou approuvée |
| diffusion effectivement décidée | diffusée | seul un acte humain/externe tracé produit cet état |
| `SUPERSEDED` | remplacée | lien vers la nouvelle Projection obligatoire |
| `ARCHIVED` | archivée | lecture historique seulement |

Les macro-états `IDEA` à `COMPLETED_STUDY` restent les vues de navigation déjà mappées par RDE-002 §19 aux objets PD-003. Ils ne sont pas des cycles métier supplémentaires.

### 29.4 Évaluation séparée des admissions

| Document | Conditions examinées | Décision documentaire | Ce que la décision ne prouve pas |
|---|---|---|---|
| RDE-001 v1.1 | agrégat non ontologique ; macro-vues ; nom distinct ; Contributions ; projection mappée ; limites d’implémentation | `ADMITTED_OFFICIAL_NIVEAU_1` | système RDE implémenté ou validé |
| RDE-002 v1.1 | parent admis ; identité réconciliée ; vues/événements/projections mappés ; frontière PD-009 ; état réel conservé | `ADMITTED_OFFICIAL_NIVEAU_1` | workflow complet implémenté |
| RDE-003 v1.1 | parents admis ; identité ; mapping PD-003 ; frontières moteurs ; corpus incomplets et refus conservés | `ADMITTED_OFFICIAL_NIVEAU_1` | Imaging Engine, compatibilité ou protocole livrés |
| KE-001 v1.0 | 13 blocages et 122 questions couverts ; contrats A–Z ; LLM/privacy/evaluation ; aucune connaissance créée | `ADMITTED_OFFICIAL_NIVEAU_1` | Knowledge Engine implémenté, activé ou PASS PD-011 |

ENG-001A reste un audit préparatoire non admis : il établit l’état `NOT_READY` antérieur à ces arbitrages et demeure utile comme traçabilité, sans acquérir une autorité normative concurrente.

## 30. Contrats que la mission ENG-001 doit implémenter

ENG-001 peut commencer sans décider de politique scientifique s’il implémente exactement :

1. `KnowledgeRequest` et snapshots de contexte B/C ;
2. résolution de concepts/relations F ;
3. Registry runtime et adapters D/E ;
4. `QueryPlan` déterministe G ;
5. couverture et séparation panne/absence H/M ;
6. applicabilité I ;
7. EvidencePolicy, lifecycle et localisateurs J ;
8. résolution/déduplication des assertions K ;
9. contradiction/controverse L ;
10. `RuntimeKnowledgeSynthesis` N ;
11. `KnowledgeResult` et statuts O/P ;
12. frontière LLM Q ;
13. handoffs, événements et ownership R/T ;
14. terminaison, cache, replay et impact S/X ;
15. recherche externe, documents utilisateur et privacy U/V/W ;
16. traces nécessaires aux cas Y et à la future campagne Z.

ENG-001 reste libre de choisir technologie, stockage, transport, indexation, cache, modèle ou fournisseur, à condition que ces choix ne modifient aucun champ obligatoire, état, hiérarchie, ownership, garde, refus, digest logique ou exigence de traçabilité.

## 31. Conditions de non-régression

Toute implémentation doit démontrer :

- même entrée/version/policies → même résultat structuré ;
- reformulation non décisive → mêmes concepts, providers et conclusions ;
- changement décisif → nouvelle révision et impacts ciblés ;
- corpus général vide → aucun masquage d’un corpus spécialisé ;
- corpus proche → aucune substitution ;
- candidat → jamais présenté comme effectif ;
- contradiction → positions conservées ;
- provider en panne → jamais « absence scientifique » ;
- contexte incomplet → aucune valeur plausible inventée ;
- relaxation → branche distincte et perte de portée visible ;
- changement LLM → résultat structuré inchangé ;
- source rétractée/corrigée → lifecycle et replay exacts ;
- document utilisateur → statut privé/local conservé ;
- demande patient-level → refus reproductible ;
- résultat non narrable fidèlement → Projection refusée ;
- absence de Document Engine → aucune réponse libre produite par Knowledge.

## 32. Décision finale

Les treize blocages d’ENG-001A sont clos au niveau architectural. Les 122 questions disposent d’une décision, d’une autorité et d’une frontière d’implémentation ou d’évaluation. RDE-001, RDE-002, RDE-003 et KE-001 sont admis séparément et atomiquement comme références normatives de niveau 1 ; aucun de ces statuts ne constitue une preuve d’implémentation ou d’évaluation.

Les éléments restant à fixer — technologies, représentations techniques, adapters effectivement livrés, experts et seuils de la future campagne — sont non architecturaux et ne peuvent modifier le présent contrat.

**Décision : `KNOWLEDGE_ENGINE_ARCHITECTURE_READY_FOR_ENG_001`.**
