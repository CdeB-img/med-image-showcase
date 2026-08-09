# RDE-001 — Research Design Engine Architecture

## Architecture fondatrice du domaine Research Design Engine de NOXIA

**Identifiant documentaire :** RDE-001  
**Famille documentaire :** RDE — Research Design Engine  
**Version :** 1.1  
**Statut :** `OFFICIAL — REFERENCE_NORMATIVE`  
**Niveau documentaire :** `NIVEAU_1 — architecture normative spécialisée`  
**Source maîtresse :** `docs/rde-001-research-design-engine-architecture.md`  
**Éditions dérivées :** aucune  
**Date d’état :** 9 août 2026  
**Domaine de responsabilité :** architecture du système de conception et de pilotage méthodologique des projets de recherche clinique de NOXIA  
**Autorités supérieures :** Charte fondatrice, Scientific Product Manifesto, puis Product Specification et références normatives spécialisées dans leurs domaines respectifs  
**État d’admission :** admis atomiquement par le SOURCE-OF-TRUTH-INDEX version 1.25  
**État d’implémentation :** architecture cible ; aucune implémentation complète du Research Design Engine n’est démontrée  
**Principe directeur :** un projet de recherche partagé, plusieurs capacités spécialisées, plusieurs projections, une décision humaine explicite

> Historique conservé : la version 1.0 du 8 août 2026 était candidate et ne pouvait être admise dans son mandat à livrable unique. La version 1.1 est l’arbitrage documentaire ciblé autorisé par KE-001 ; elle est admise atomiquement avec RDE-002, RDE-003 et KE-001. Cette admission ne prouve aucune implémentation ni évaluation.

---

## 0. Décision documentaire et règle de lecture

### 0.1 Nature exacte de la mission

La mission crée l’architecture fondatrice d’une nouvelle famille documentaire, **RDE**, destinée à organiser les futurs documents du Research Design Engine.

RDE-001 définit :

- la mission et les frontières du Research Design Engine ;
- la place du Research Project comme agrégat architectural central d’un projet particulier ;
- le Domain Gate et l’Intent Orchestrator ;
- les responsabilités des moteurs spécialisés ;
- les quatre parcours utilisateur ;
- les règles de continuité, de maturité, de changement et d’invalidation ;
- les projections documentaires et leurs états ;
- les contrats permanents, les critères d’acceptation et les non-régressions ;
- la trajectoire vers une Research Design Platform puis un Clinical Research OS.

La mission ne crée :

- aucun moteur exécutable ;
- aucun nouvel objet métier canonique opposable à PD-003 ;
- aucun prompt, agent, modèle, service, API, interface ou stockage ;
- aucun protocole clinique ou d’acquisition ;
- aucune recommandation ;
- aucune connaissance scientifique ;
- aucune capacité réglementaire, statistique, économique ou opérationnelle effectivement livrée ;
- aucune admission documentaire automatique.

### 0.2 Ordre de consultation appliqué

La lecture a commencé par `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis a suivi l’ordre imposé :

1. Charte fondatrice ;
2. Scientific Product Manifesto ;
3. Product Specification ;
4. PD-003 — Research Object Model ;
5. PD-004 — UX Manifesto ;
6. PD-009 — Decision Engine Architecture ;
7. PD-011 — Evaluation Framework ;
8. PD-012 — Scientific Program Architecture ;
9. PD-013 — Scientific Program Registry ;
10. P17 — consolidation des Scientific Programs et Reasoning Books ;
11. P-WEB-01 ;
12. P-WEB-02, plan QA et rapport d’implémentation ;
13. P-WEB-03 et son addendum P-WEB-03C ;
14. P-WEB-04R ;
15. P-WEB-05 ;
16. P-WEB-06 ;
17. P-WEB-06C.

PD-005 a ensuite été consulté comme autorité spécialisée complémentaire, car RDE-001 doit distinguer les moteurs fonctionnels des 43 rôles IA de la Prompt Library.

### 0.3 Les six plans de vérité

| Plan | Éléments applicables | Portée exacte dans RDE-001 |
|---|---|---|
| Principes établis | science avant technologie ; intention avant solution ; contexte conservé ; incertitude visible ; stratégie scientifique unique ; humain décisionnaire ; traçabilité ; reproductibilité ; arrêt honnête | Invariants supérieurs non modifiables |
| Références normatives | Product Specification, PD-003, PD-004, PD-005, PD-009, PD-011, PD-012 et PD-013 | Autorités spécialisées que RDE-001 coordonne sans les absorber |
| Corpus scientifiques | Scientific Programs, Reasoning Books, Scientific Corpora, Knowledge Graph et sources applicables | Connaissances consommables et datées ; jamais produites par un moteur RDE |
| Cible | plateforme cohérente de conception et de pilotage méthodologique d’un projet de recherche clinique | Architecture décrite ici, non capacité livrée |
| État réellement implémenté | Protocol Designer V1 conversationnel, trois parcours, trois fixtures, contexte local, questions adaptatives, décision humaine et rapport à 42 sections | Première application bornée ; ne prouve ni les onze moteurs ni le cycle complet d’une étude |
| Hypothèses | granularité des moteurs, agrégat Research Project, cycle long, états de projection, nouveaux domaines et phases d’évolution | Propositions à arbitrer, versionner et évaluer |

### 0.4 Autorité spécialisée et non-absorption

RDE-001 ne devient pas une constitution générale de NOXIA. Son autorité est limitée à l’architecture du Research Design Engine.

- PD-003 reste l’autorité sur les objets métier, leurs relations, leurs états et les Décisions humaines.
- PD-004 reste l’autorité sur l’expérience, la progressive disclosure et la visibilité des limites.
- PD-005 reste l’autorité sur les rôles IA composables et leurs contrats.
- PD-009 reste l’autorité sur la prochaine action scientifique, les branches, les impacts, les arrêts et le refus protocolaire.
- PD-011 reste l’unique autorité sur l’évaluation scientifique, PASS, FAIL et publication d’une version.
- PD-012 et PD-013 restent les autorités sur les Scientific Programs, leur ownership et leur registre.
- Les Scientific Corpora et le Knowledge Graph restent les autorités de connaissance applicables.
- Le Research Project n’est source de vérité que pour l’état d’un projet particulier ; il ne remplace aucune de ces autorités.

### 0.5 Contradictions et arbitrages requis par la version 1.0 — historique

| ID | Contradiction ou ambiguïté | Qualification | Traitement retenu dans cette version |
|---|---|---|---|
| A01 | Le document doit devenir officiel, mais le mandat impose de créer uniquement le document alors que l’index exige une mise à jour atomique | Contradiction de gouvernance bloquante | RDE-001 reste candidat ; admission et mise à jour de l’index exigent une décision ultérieure |
| A02 | Le mandat présente Research Project comme nouvel objet central ; PD-003 réserve l’autorité métier au Dossier de recherche et à ses objets | Risque de seconde ontologie | Research Project est défini comme agrégat architectural du Dossier de recherche et des objets PD-003, jamais comme remplacement |
| A03 | Le cycle IDEA → COMPLETED STUDY diffère des cycles du Dossier de recherche et de la Product Specification | Deux niveaux de cycle non alignés | Le cycle RDE est une macro-trajectoire cible ; les états PD-003 restent canoniques jusqu’à une table de correspondance admise |
| A04 | « Research Design Engine » nomme à la fois le domaine architectural et un moteur spécialisé de conception | Collision d’espace de noms | Le document distingue toujours « système RDE » et « fonction de conception de recherche » ; un nom canonique distinct reste à arbitrer |
| A05 | « Tous les moteurs ajoutent des connaissances » contredit l’interdiction pour un moteur de produire de la connaissance scientifique | Contradiction interne | Les moteurs ajoutent des contributions, décisions, liens de provenance et états de projet ; seuls les corpus gouvernés produisent une connaissance effective |
| A06 | Les états de projection proposés diffèrent du cycle canonique de Projection dans PD-003 | Extension sémantique non admise | Ils restent des états de disponibilité documentaire cibles et doivent être mappés avant implémentation |
| A07 | P-WEB-05 porte une partie de l’orchestration cible mais reste `CANDIDATE_NON_ADMIS` | Autorité insuffisante | Seuls les comportements réaffirmés et implémentés par P-WEB-06/P-WEB-06C sont considérés comme état courant ; le reste demeure hypothèse |
| A08 | L’architecture prévoit Regulatory, Safety, Economics, Data Management et Clinical Operations sans objets canoniques complets démontrés dans PD-003 | Extension de domaine | Les moteurs restent cibles ; aucune écriture effective n’est autorisée avant évolution coordonnée du modèle métier |
| A09 | `READY_FOR_SUBMISSION` peut être compris comme approbation réglementaire ou scientifique | Risque d’autorité indue | L’état signifie seulement « dossier documentaire prêt pour revue humaine de soumission », jamais autorisation, approbation ou PASS |
| A10 | Un pourcentage de complétude de projection peut devenir un score global de projet interdit par PD-004/PD-009 | Risque de faux progrès | Toute complétude est locale, explicable, fondée sur des exigences nommées et séparée de la qualité, de la validité et de la maturité scientifique |

---

# Partie I — Mission, gouvernance et principes

## 1. Définition du Research Design Engine

Le **Research Design Engine** est le système méthodologique partagé de NOXIA qui accompagne la transformation d’une intention de recherche en projet structuré, gouverné, révisable et projetable, puis soutient son pilotage méthodologique sans remplacer les responsabilités humaines ou les systèmes opérationnels de référence.

Il organise des capacités spécialisées autour d’un même état de projet. Il ne constitue ni un chatbot généraliste, ni un générateur de documents, ni un moteur de recommandations cliniques, ni un logiciel d’exécution hospitalière.

## 2. Mission

Le système RDE doit :

1. comprendre la demande et son intention sans réduire les termes spécialisés ;
2. conserver un contexte de projet unique et reconstructible ;
3. séparer faits, suppositions, inconnues, contradictions et décisions ;
4. mobiliser seulement les capacités nécessaires ;
5. maintenir une chaîne question → objectifs → hypothèses → mesures → analyses → interprétations ;
6. rendre visibles preuves, alternatives, limites, risques et dépendances ;
7. propager les changements sans réécrire l’histoire ;
8. produire plusieurs projections cohérentes du même projet ;
9. s’arrêter lorsque la progression ne serait plus honnête ;
10. laisser toute décision structurante à un acteur humain mandaté.

## 3. Frontières permanentes

Le système RDE ne doit jamais :

- produire une décision clinique individuelle ;
- déclarer un protocole, une étude ou une projection « validés » sans l’autorité humaine et le cadre applicables ;
- inventer une source, une donnée, un effet, une variance, un coût, un seuil ou un paramètre ;
- transformer une sortie de LLM en connaissance scientifique ;
- confondre dossier complet et projet scientifiquement valide ;
- remplacer RIS, PACS, EDC, CTMS, LIMS, eTMF, système réglementaire, logiciel statistique ou outil de pharmacovigilance ;
- modifier un corpus ou une décision par une projection documentaire ;
- créer un moteur ou un graphe indépendant par domaine ;
- rendre une modification majeure silencieuse ;
- poursuivre lorsqu’une condition de refus s’applique.

## 4. Gouvernance des décisions

Les moteurs produisent des Contributions, Options, Recommandations, Justifications, Analyses, Alertes, Revues et Projections. Ils ne produisent pas seuls une Décision active.

Une décision structurante exige :

- un objet précis ;
- les options recevables ;
- une justification ;
- les preuves et limites applicables ;
- un acteur humain ;
- un mandat ;
- une date et une version de projet ;
- les conditions de réouverture ;
- l’analyse des impacts.

## 5. Gouvernance des connaissances

Un moteur RDE consomme des connaissances qualifiées et datées. Il peut :

- demander une recherche ;
- référencer une connaissance applicable ;
- signaler une lacune ou une contradiction ;
- proposer une Contribution candidate ;
- attacher une provenance à un objet du projet.

Il ne peut pas rendre une connaissance effective, corriger un corpus, attribuer un niveau de preuve définitif ou publier une nouvelle vérité. Ces actes relèvent des autorités scientifiques et de leur gouvernance humaine.

---

# Partie II — Research Project, source de vérité du projet

## 6. Définition bornée

Le **Research Project** est l’agrégat architectural qui donne une vue unique et cohérente de l’état d’un projet de recherche particulier.

Il est construit à partir du **Dossier de recherche** canonique de PD-003, de sa Stratégie scientifique, de ses Versions de stratégie, de son État de connaissance effectif et de leurs objets reliés. Le terme ne crée pas une nouvelle identité métier tant que PD-003 n’a pas été modifié.

Le Research Project est la source de vérité pour :

- ce que ce projet cherche à accomplir ;
- ce que l’équipe a déclaré, décidé, supposé ou laissé inconnu ;
- quelles versions et dépendances sont actives ;
- quelles projections ont été produites depuis quel état.

Il n’est pas la source de vérité pour :

- la connaissance scientifique générale ;
- l’identité d’un Scientific Program ;
- le contenu d’un Reasoning Book ;
- une source externe ;
- un résultat clinique primaire conservé dans un système réglementé ;
- une autorisation réglementaire ou institutionnelle.

## 7. Contenu architectural du Research Project

| Domaine du projet | Contenu attendu | Autorité canonique actuelle |
|---|---|---|
| Origine | demande originale, Situation de recherche, Intention scientifique | PD-003 |
| Construction scientifique | Question, Objectifs, Hypothèses, phénomènes, phénotypes | PD-003 |
| Population et plan | Population, Plan d’étude, groupes, visites et temporalité | PD-003 |
| Mesures | Critères de jugement, Variables, Biomarqueurs, Modalités, Acquisitions | PD-003 |
| Analyse | Analyses, règles d’interprétation, dimensionnement, contrôles qualité | PD-003, avec capacités cibles à compléter |
| Argumentation | Sources, Preuves, connaissances, Justifications, Recommandations | PD-003 et autorités scientifiques |
| Gouvernance | Acteurs, Mandats, Décisions, Revues, Contributions | PD-003 |
| Risque | Incertitudes, Contradictions, Limites, Risques, Biais, Alertes | PD-003 |
| Évolution | Événements, Dépendances, Analyses d’impact, Versions | PD-003 |
| Économie, réglementation, sécurité, opérations | besoins, contraintes, contributions et projections cibles | Domaine incomplet à arbitrer avant écriture canonique |
| Restitution | Projections, Profils de projection, Rapport scientifique | PD-003, avec extensions cibles à mapper |

## 8. Macro-cycle cible

Le système RDE propose la macro-trajectoire suivante :

1. `IDEA` — intention ou problème encore exploratoire ;
2. `QUESTION` — question suffisamment explicite pour être structurée ;
3. `HYPOTHESIS` — objectifs et hypothèses candidates reliés ;
4. `STUDY_DESIGN` — stratégie d’étude en construction ou en revue ;
5. `PROTOCOL` — version de stratégie projetable en dossier protocolaire ;
6. `ACTIVE_STUDY` — étude en cours, pilotée par ses systèmes et responsabilités opérationnels ;
7. `COMPLETED_STUDY` — étude terminée, résultats, écarts et décisions conservés.

Ce macro-cycle :

- ne remplace pas les états canoniques du Dossier de recherche ;
- ne vaut pas readiness, qualité ou validation ;
- autorise retours, suspensions et abandons ;
- exige une correspondance normative avant implémentation ;
- ne transforme jamais `PROTOCOL` en protocole approuvé.

## 9. Maturité et stabilité

La maturité est multidimensionnelle. Elle distingue au minimum :

- maturité de la question ;
- maturité du modèle scientifique ;
- maturité de la stratégie de mesure ;
- maturité de l’analyse ;
- maturité opérationnelle ;
- maturité réglementaire ;
- maturité documentaire ;
- maturité des preuves ;
- maturité des décisions humaines.

Chaque dimension indique : exigences satisfaites, exigences ouvertes, blocages, inconnues, responsables et preuves. Il n’existe aucun score global de maturité.

La stabilité qualifie l’exposition au changement :

- `EXPLORATORY` — objets encore largement révisables ;
- `WORKING` — cohérence locale obtenue, décisions ouvertes ;
- `REVIEWED` — revue réalisée, réserves conservées ;
- `HUMAN_ADOPTED` — décisions humaines applicables enregistrées ;
- `FROZEN_VERSION` — version immuable créée pour un usage nommé ;
- `SUPERSEDED` — version remplacée mais conservée.

Ces libellés sont architecturaux tant qu’aucun alignement avec PD-003 n’est admis.

## 10. Changements et invalidation

Tout changement amont crée un Événement d’évolution et une Analyse d’impact avant la modification des décisions aval.

Une modification mineure :

- précise sans changer le sens ;
- conserve les décisions dont l’absence d’impact est démontrée ;
- crée une trace et, si nécessaire, une nouvelle version compatible.

Une modification majeure :

- change intention, question, objectif, hypothèse, population, critère principal, stratégie de mesure ou domaine ;
- annonce les objets et projections à reconstruire ;
- demande confirmation humaine ;
- invalide seulement les dépendances atteintes ;
- conserve l’état antérieur et les décisions historiques.

## 11. Règles de contribution des moteurs

Chaque moteur :

1. lit une version identifiée du Research Project ;
2. déclare son périmètre et ses préconditions ;
3. produit une contribution structurée ;
4. expose preuves, hypothèses, inconnues, limites et impacts ;
5. ne modifie pas directement un objet possédé par un autre moteur ou une décision humaine ;
6. soumet les écritures proposées à l’orchestration et aux validations applicables ;
7. crée une nouvelle version après adoption ;
8. conserve toute sortie refusée ou remplacée selon la gouvernance applicable.

---

# Partie III — Domain Gate et Intent Orchestrator

## 12. Domain Gate

Le Domain Gate qualifie la demande avant toute mobilisation scientifique.

| État | Signification | Effet |
|---|---|---|
| `IN_SCOPE` | La demande relève du domaine documenté et d’une capacité disponible | Poursuite vers l’intention et le projet |
| `BORDERLINE` | Le sujet est adjacent, incomplet ou dépend d’une expertise non disponible | Clarification, réduction de portée ou escalade |
| `OUT_OF_SCOPE` | La demande exige une décision clinique individuelle, une capacité absente ou un domaine non couvert | Refus explicite et conservation du contexte admissible |

Le Domain Gate ne décide pas de la vérité scientifique. Il vérifie domaine, responsabilité, confidentialité, action interdite et disponibilité réelle.

## 13. ScientificIntent de routage

`ScientificIntent` reste une enveloppe conversationnelle non canonique. Elle conserve :

- demande originale ;
- action recherchée ;
- termes et relations explicitement ancrés ;
- contexte autorisé ;
- intention principale et secondaires ;
- ambiguïtés et contradictions ;
- informations nécessaires au routage ;
- correction ou confirmation humaine ;
- destination proposée et justification ;
- éléments transférés ou exclus.

Les intentions cibles sont :

- `UNDERSTAND` ;
- `COMPARE` ;
- `FORMALIZE_IDEA` ;
- `DESIGN_STUDY` ;
- `GENERATE_DOCUMENT` ;
- `OPERATE_STUDY` ;
- `ANALYZE_RESULTS` ;
- `INTERPRET_DOCUMENT`.

Les intentions non couvertes par une surface réellement disponible restent `ENGINE_UNAVAILABLE` ou `ROUTING_REQUIRES_CLARIFICATION`.

## 14. Mission de l’Intent Orchestrator

L’Intent Orchestrator :

- reçoit une proposition linguistique bornée ;
- applique corrections humaines, Domain Gate et règles de routage ;
- distingue intention produit et Intention scientifique PD-003 ;
- choisit une surface de travail disponible ;
- transmet un contexte versionné ;
- conserve les intentions secondaires ;
- ne sélectionne aucune prochaine action scientifique interne au projet.

PD-009 commence son autorité dès qu’une action scientifique doit être choisie dans le projet.

## 15. Frontière du LLM

Le LLM peut :

- reformuler le langage ;
- structurer des mentions explicites ;
- signaler des ambiguïtés textuelles ;
- proposer une intention de routage ;
- rédiger une question de clarification autorisée.

Le LLM ne peut pas :

- répondre directement comme source scientifique ;
- choisir une connaissance, un biomarqueur, une modalité, une acquisition, un test statistique ou une conduite réglementaire ;
- inventer une relation scientifique ;
- prendre une décision ;
- modifier le Research Project ;
- contourner PD-009 ;
- déclarer une projection prête.

---

# Partie IV — Architecture des moteurs

## 16. Règle de composition

Les moteurs sont des domaines fonctionnels stables. Les rôles PD-005 sont des capacités IA remplaçables pouvant contribuer à un moteur. Un moteur n’est donc ni un prompt, ni un agent unique, ni un modèle.

La communication inter-moteurs portant sur l’état durable passe par le Research Project. Les échanges techniques temporaires, le Domain Gate et l’interprétation d’entrée ne deviennent pas des vérités de projet avant validation.

## 17. Tableau obligatoire des moteurs

| Moteur | Mission | Lit dans le Research Project | Produit ou propose | Dépendances principales | Conditions d’usage et d’arrêt | Interactions |
|---|---|---|---|---|---|---|
| Knowledge Engine | Fournir les connaissances applicables, leur provenance, leurs limites et leurs controverses | question, contexte, état de connaissance, besoins de preuve | références, synthèses applicables, lacunes, controverses ; aucune mutation scientifique automatique | corpus, Programs, Knowledge Graph, rôles R06–R09/R28/R42 | actif lorsqu’une décision exige une connaissance ; arrêt si preuve ou domaine insuffisant | alimente tous les moteurs ; ne modifie le projet qu’après adoption d’une contribution |
| Scientific Thinking Engine | Transformer une idée en questions, mécanismes et hypothèses candidates | intention, situation, contexte, connaissances, inconnues | questions candidates, objectifs, hypothèses et mécanismes proposés | Knowledge, PD-009, R02–R05/R10/R11 | avant étude structurée ou lors d’une réouverture ; arrêt sur hors-domaine ou décision humaine requise | prépare le Study Design Engine ; peut retourner vers Knowledge |
| Study Design Engine | Construire la stratégie d’étude cohérente | question, objectifs, hypothèses, population, contraintes, décisions | plan d’étude, options, critères, temporalité conceptuelle, dépendances et versions proposées | Scientific Thinking, Imaging, Biostatistics, Data, Regulatory, Economics, Safety | actif pour `DESIGN_STUDY` ; refuse une projection si les invariants PD-009 échouent | coordonne les contributions sans posséder les domaines spécialisés |
| Document Engine | Produire des projections fidèles du projet | version de stratégie, profil, décisions, preuves, limites | protocol, synopsis, dossier, rapport et autres projections | tous moteurs sources, R35–R39 | après définition d’un usage et d’une version ; arrêt si sources orphelines | ne réécrit jamais le projet depuis un document édité |
| Imaging Engine | Concevoir la stratégie scientifique d’imagerie | phénomènes, biomarqueurs, critères, population, contraintes | modalités, acquisitions conceptuelles, qualité, lecture, harmonisation, limites | Knowledge, Study Design, Safety, Data, Biostatistics, R12/R13/R18/R19/R21/R22 | lorsque l’imagerie sert un objectif ; arrêt sans chaîne de justification | alimente critères, données, analyses, budget et projections |
| Biostatistics Engine | Construire estimands, analyses et dimensionnement | objectifs, hypothèses, critères, variables, plan, données attendues | stratégie statistique, hypothèses numériques explicites, analyses, puissance si calculable | Study Design, Data, Imaging, R17/R23/R24/R26 | actif si une décision analytique est ouverte ; refuse toute valeur sans entrée | contraint population, visites, données, budget et SAP |
| Data Management Engine | Définir les données, leur intégrité et leur gouvernance | variables, sources, visites, analyses, contraintes | data dictionary, CRF conceptuel, règles de qualité, flux et gaps | Study Design, Biostatistics, Imaging, Regulatory, Safety, R25 | actif dès que des données sont prévues ; arrêt si responsabilités ou sources inconnues | alimente SAP, CRF, monitoring et opérations |
| Regulatory Engine | Préparer les exigences et dossiers à confirmer | territoire, population, intervention, données, produits, décisions | checklists, exigences, gaps, dossiers candidats et escalades | Data, Safety, Clinical Operations, R34, référentiels à jour | uniquement avec juridiction et usage identifiés ; aucun avis juridique | contraint calendrier, documents, sécurité et activation |
| Economics Engine | Modéliser ressources, coûts, scénarios et incertitudes | plan, visites, sites, modalités, ressources, calendrier | budget, hypothèses de coût, scénarios, sensibilités et inconnues | tous moteurs de conception, notamment Imaging et Operations | actif si un usage économique est demandé ; aucune valeur inventée | alimente funding, faisabilité et arbitrages humains |
| Safety Engine | Identifier risques, obligations de sécurité et escalades | population, interventions, imagerie, produits, procédures, opérations | risques, mesures de maîtrise proposées, gaps, exigences de revue | Imaging, Regulatory, Operations, Data, R27/R31/R34 | actif dès qu’un risque est plausible ; arrêt/escalade sur responsabilité dépassée | peut bloquer une branche via constat soumis à PD-009 |
| Clinical Operations Engine | Structurer l’exécution et le suivi d’une étude | version approuvée, sites, acteurs, visites, ressources, risques, déviations | calendrier opérationnel, responsabilités, monitoring, déviations et impacts | Study Design, Data, Safety, Regulatory, Economics | actif seulement pour étude existante et capacité admise ; jamais simulé si absent | consomme la version gelée ; renvoie événements et analyses d’impact |

## 18. Ownership fonctionnel

L’ownership d’un moteur est une autorité d’écriture fonctionnelle, pas une identité métier indépendante.

- Scientific Thinking est responsable des propositions de question et d’hypothèse.
- Study Design est responsable de la cohérence globale de la stratégie d’étude.
- Imaging est responsable des propositions de mesure et d’acquisition d’imagerie.
- Biostatistics est responsable des propositions d’analyse et de dimensionnement.
- Data Management est responsable des propositions de structure et de qualité des données.
- Regulatory, Safety, Economics et Clinical Operations sont responsables de leurs contributions spécialisées.
- Document est responsable de la fidélité d’une projection, jamais de son fond.
- Knowledge est responsable de la sélection contextualisée des connaissances applicables, jamais de leur autorité source.

Une décision humaine reste propriétaire de l’arbitrage engageant.

## 19. Interaction avec PD-005

Un moteur peut appeler un sous-ensemble minimal des rôles R01–R43. Il ne doit jamais recopier leur mission dans une seconde Prompt Library.

Exemples :

- Imaging mobilise notamment R12, R13, R18, R19, R21 et R22 ;
- Biostatistics mobilise R17, R23, R24 et R26 ;
- Data Management mobilise R25 ;
- Regulatory et Safety mobilisent R27, R31 et R34 ;
- Document mobilise R35 à R39 ;
- l’évaluation des rôles reste sous R43 et PD-011.

---

# Partie V — Parcours utilisateur

## 20. Parcours 1 — Comprendre

**But :** comprendre un concept, une relation, une méthode, un résultat publié ou une controverse.

**Moteurs dominants :** Knowledge, puis Scientific Thinking si une question nouvelle émerge.

**Sortie :** synthèse contextualisée, distinctions, preuves, limites, inconnues et transitions possibles.

**Refus :** absence de corpus applicable, demande clinique individuelle, conclusion plus forte que les preuves.

## 21. Parcours 2 — Formaliser

**But :** transformer une idée, une observation ou une intuition en question scientifique et hypothèses candidates.

**Moteurs dominants :** Scientific Thinking et Knowledge.

**Sortie :** question candidate, objectifs, hypothèses concurrentes, mécanismes, informations manquantes et décision humaine de créer ou non un projet.

**Refus :** hypothèse non réfutable, domaine non documenté ou demande d’adoption automatique.

## 22. Parcours 3 — Concevoir

**But :** construire une stratégie d’étude et ses projections sans préjuger d’une approbation.

**Moteurs dominants :** Study Design, Imaging, Biostatistics, Data Management, Regulatory, Economics et Safety selon le contexte.

**Sortie :** version de stratégie révisable, décisions ouvertes, projections disponibles et conditions de refus.

**Refus :** invariants PD-009 non satisfaits, décisions humaines absentes, contradictions structurantes ou connaissance insuffisante.

## 23. Parcours 4 — Piloter

**But :** accompagner méthodologiquement une étude existante sans remplacer ses systèmes opérationnels.

**Moteurs dominants :** Clinical Operations, Data Management, Safety, Regulatory, Economics et Document.

**Sortie :** état de suivi, responsabilités, déviations, impacts, documents actualisés et escalades.

**Condition d’entrée :** étude existante, version applicable, acteurs et mandats identifiés, capacités opérationnelles réellement disponibles.

**État courant :** non démontré par la V1 du Protocol Designer.

## 24. Transitions

Une transition :

- conserve la demande originale et le Research Project ;
- nomme la surface source et la destination ;
- explique pourquoi elle est proposée ;
- conserve les intentions secondaires ;
- transfère inconnues, contradictions, décisions et provenance ;
- montre le différentiel au retour ;
- ne crée ni second projet ni seconde stratégie ;
- exige une action humaine lorsqu’elle change l’objet ou la finalité.

## 25. Progression conversationnelle

Chaque question :

- porte sur une décision ou une incertitude identifiée ;
- explique pourquoi elle est posée ;
- indique ce qu’elle influence ;
- accepte texte libre, suggestions, « autre » et « je ne sais pas » ;
- traite les réponses partielles et contradictoires ;
- n’est pas reposée sans événement visible.

« Question X sur environ N » peut estimer la charge conversationnelle. Il ne mesure ni la maturité ni la qualité du projet.

---

# Partie VI — Projections documentaires

## 26. Principe

Une projection est une vue d’une version du Research Project pour un usage et un destinataire. Elle ne possède pas le fond scientifique et ne le modifie pas.

## 27. Tableau obligatoire des projections

| Projection | Usage principal | Moteurs contributeurs | Prérequis minimaux | Limites permanentes |
|---|---|---|---|---|
| Protocol | Dossier protocolaire structuré | Study Design, Imaging, Biostatistics, Data, Safety, Regulatory, Document | stratégie versionnée, décisions humaines, revue et absence de refus applicable | ne vaut ni approbation, ni protocole d’acquisition exécutable par défaut |
| Synopsis | Vue courte de cadrage | Study Design, Document | question, objectifs, plan et limites | la concision ne supprime aucune réserve structurante |
| Funding | Demande de financement | Economics, Study Design, Document | objectifs, ressources, calendrier, hypothèses de coût | aucun coût inventé ni probabilité de succès |
| Publication | Structure de publication | Document, Knowledge, Biostatistics | usage, résultats ou état de projet approprié, sources | aucune publication automatique ni correction du projet |
| CRF | Recueil conceptuel des données | Data, Study Design, Safety | variables, visites, sources et responsabilités | ne vaut pas EDC ni validation réglementaire |
| Data Dictionary | Définition des données | Data, Biostatistics, Imaging | variables, unités, provenance et règles | aucune valeur implicite |
| SAP | Plan d’analyse statistique | Biostatistics, Data, Study Design | estimands, critères, variables, hypothèses et décisions | aucune analyse inventée ; revue statistique humaine requise |
| Budget | Scénarios de ressources et coûts | Economics, Operations, Imaging | plan, ressources, sites, hypothèses explicites | aucune précision artificielle |
| Timeline | Dépendances et calendrier | Operations, Study Design, Regulatory | tâches, visites, responsabilités et contraintes | ne vaut pas engagement contractuel |
| CPP | Dossier documentaire pour revue éthique française | Regulatory, Safety, Data, Document | juridiction, projet et pièces identifiés | ne vaut ni avis favorable ni conseil juridique |
| ANSM | Dossier documentaire réglementaire français | Regulatory, Safety, Document | qualification réglementaire humaine et pièces applicables | ne vaut ni autorisation ni détermination réglementaire automatique |
| Core Lab Manual | Harmonisation et lecture centralisée | Imaging, Data, Operations, Safety, Document | stratégie, qualité, lecture, déviations et responsabilités | ne remplace pas un Core Lab ni son approbation |
| Monitoring Plan | Suivi opérationnel et qualité | Operations, Data, Safety, Regulatory | étude active, risques, responsabilités et données | ne remplace pas le CTMS ou le monitoring humain |
| Investigator Guide | Guide de mise en œuvre pour investigateurs | Operations, Safety, Regulatory, Document | version applicable et responsabilités validées | ne remplace pas formation, délégation ou documents institutionnels |

## 28. États cibles d’une projection

| État | Signification bornée |
|---|---|
| `NOT_AVAILABLE` | préconditions absentes ou moteur indisponible |
| `STRUCTURE_ONLY` | structure et exigences visibles, contenu non générable honnêtement |
| `PARTIALLY_GENERATED` | certaines sections proviennent d’objets validés ; lacunes visibles |
| `READY_FOR_REVIEW` | contenu suffisamment structuré pour une revue humaine nommée |
| `READY_FOR_SUBMISSION` | dossier documentaire complet pour une décision humaine de soumission ; aucune approbation implicite |
| `SUPERSEDED` | projection remplacée par une projection issue d’une version ultérieure |
| `ARCHIVED` | projection gelée en lecture historique |

Ces états doivent être mappés au cycle PD-003 avant implémentation. Ils ne portent aucune conclusion de qualité scientifique.

## 29. Complétude locale

Une projection peut afficher une complétude locale seulement si :

- la liste des exigences est nommée et versionnée ;
- chaque exigence est satisfaite, absente, non applicable, contradictoire ou bloquée ;
- le calcul est reconstructible ;
- le pourcentage éventuel n’est jamais appelé maturité, confiance, qualité ou readiness du projet ;
- une exigence critique absente reste bloquante malgré un total élevé.

## 30. Versionnement

Chaque projection conserve :

- son identifiant et sa version ;
- la Version de stratégie source ;
- l’État de connaissance effectif ;
- le profil et l’usage ;
- les moteurs et contributions mobilisés ;
- les décisions humaines ;
- les sources, limites et inconnues ;
- les impacts et la projection qu’elle remplace.

Une modification directe d’un document ne modifie jamais le Research Project. Elle peut devenir une Contribution soumise à revue, puis éventuellement produire une nouvelle version de projet et une nouvelle projection.

---

# Partie VII — Évolution de la plateforme

## 31. Phase 1 — Research Design Platform

La première phase étend le Protocol Designer vers une plateforme de conception :

- entrée conversationnelle gouvernée ;
- Research Project partagé ;
- Knowledge et Scientific Thinking ;
- fonction de conception de recherche ;
- Imaging, Biostatistics et Data Management ;
- projections cohérentes ;
- décisions, versions, impacts et refus ;
- évaluation selon PD-011.

## 32. Phase 2 — Clinical Research OS

La seconde phase ajoute, après admission séparée :

- Regulatory ;
- Economics ;
- Safety ;
- Clinical Operations ;
- suivi des déviations ;
- monitoring méthodologique ;
- coordination documentaire de l’étude ;
- intégrations gouvernées avec les systèmes de référence.

Clinical Research OS signifie couche de raisonnement, de coordination et de projection. Il ne signifie pas remplacement des systèmes transactionnels, réglementés ou hospitaliers.

## 33. Futurs moteurs documentaires

La famille documentaire comprend désormais :

- RDE-002 — Research Design Workflow ;
- RDE-003 — Imaging Engine Architecture.

KE-001 — Knowledge Engine Architecture appartient à la famille spécialisée KE et coordonne le contrat Knowledge sans devenir un sous-document RDE.

De futurs documents spécialisés pourront couvrir Biostatistics, Data Management, Regulatory, Economics, Safety ou Clinical Operations uniquement si une responsabilité autonome non dupliquée est démontrée. Aucun identifiant futur n’est réservé par cette roadmap.

## 34. Indépendance technologique

Les contrats RDE doivent survivre :

- au remplacement d’un LLM ;
- au changement d’un fournisseur ;
- à l’ajout ou au retrait d’un rôle PD-005 ;
- au changement d’une interface ;
- à l’évolution d’un système externe.

Les formats d’échange futurs doivent privilégier identités stables, provenance, versions et standards ouverts applicables. Aucun standard ne devient obligatoire par sa seule mention dans cette architecture.

## 35. Conditions d’évolution de RDE-001

RDE-001 évolue lorsqu’une décision modifie :

- la définition ou la frontière du système RDE ;
- le statut du Research Project ;
- le nombre ou la responsabilité des moteurs ;
- la relation avec PD-003, PD-005, PD-009 ou PD-011 ;
- les parcours, transitions ou contrats de contexte ;
- les familles ou états de projection ;
- les conditions de refus ;
- la trajectoire Research Design Platform / Clinical Research OS.

Il ne doit pas évoluer uniquement pour :

- changer de modèle ou de fournisseur ;
- ajouter une microcopie ;
- modifier un document projeté sans changer son contrat ;
- intégrer un nouveau corpus ;
- refléter une limitation technique momentanée ;
- faire paraître implémentée une cible absente.

---

# Partie VIII — Contrats permanents, acceptation et non-régression

## 36. Tableau obligatoire des contrats permanents

| Contract | Exigence permanente | Contrôle minimal | Violation bloquante |
|---|---|---|---|
| C1 — Projet unique | Tous les moteurs contribuent au même Research Project, composé des objets canoniques | identité, version et lignage communs | seconde source de vérité de projet |
| C2 — Science gouvernée | Les moteurs consomment des connaissances admises et n’en créent pas silencieusement | provenance et autorité de chaque connaissance | assertion ou source inventée |
| C3 — Décision humaine | Toute décision structurante possède Acteur, Mandat, justification et version | trace de Décision PD-003 | décision automatique ou implicite |
| C4 — Incertitude visible | Inconnues, contradictions, limites et risques restent explicites | registre local et transversal | suppression ou résolution artificielle |
| C5 — Navigation indépendante | PD-009 choisit l’action scientifique ; l’orchestration choisit seulement la capacité d’exécution | trace action → moteur → contribution | rôle ou LLM propriétaire de la prochaine action |
| C6 — Moteurs découplés | Les échanges durables passent par le Research Project et des contrats versionnés | objets lus/écrits et ownership | mutation directe non tracée entre moteurs |
| C7 — Projection fidèle | Une projection lit une version et ne modifie pas le fond | lignage projet → projection | document devenant source scientifique |
| C8 — Changement explicite | Toute modification majeure annonce et propage ses impacts | Événement, Analyse d’impact, confirmation | réécriture silencieuse |
| C9 — Arrêt honnête | Domaine, preuve, capacité ou mandat insuffisant conduit à un refus ou une escalade | motif, préservé, condition de reprise | réponse fabriquée pour terminer |
| C10 — État réel | Cible, implémentation, validation, publication et admission restent séparées | statut documentaire et preuve applicable | cible présentée comme livrée ou validée |

## 37. Matrice d’autorité

| Question | Autorité qui prime |
|---|---|
| Que signifie un objet du projet ? | PD-003 |
| Comment l’utilisateur le comprend et agit ? | PD-004 |
| Quelle prochaine action scientifique est recevable ? | PD-009 |
| Quelle capacité IA peut exécuter cette action ? | PD-005 |
| Quelle connaissance est applicable ? | autorités scientifiques, corpus et Knowledge Graph |
| Quel moteur porte la contribution fonctionnelle ? | RDE-001 version 1.1 |
| Une version a-t-elle démontré sa valeur ? | PD-011 |
| Un Program ou Reasoning Book existe-t-il officiellement ? | PD-012/PD-013 et SOURCE-OF-TRUTH-INDEX |

## 38. Critères d’acceptation formulés par la version 1.0 — historique

RDE-001 ne peut être admis que si :

1. son niveau, son statut, sa source maîtresse et ses autorités sont inscrits dans le SOURCE-OF-TRUTH-INDEX ;
2. Research Project est confirmé comme agrégat ou admis par évolution de PD-003 ;
3. la correspondance des macro-états avec les cycles existants est décidée ;
4. la collision de nom du système et de la fonction spécialisée est levée ;
5. les états de projection sont alignés avec PD-003 ;
6. l’ownership d’écriture de chaque moteur est défini sur des objets canoniques ;
7. les domaines non couverts par PD-003 disposent d’une trajectoire normative ;
8. P-WEB-05 n’est pas utilisé comme autorité implicite ;
9. aucune capacité cible n’est déclarée implémentée sans preuve ;
10. les tableaux contrats, moteurs et projections sont complets ;
11. les conditions de refus et d’escalade sont opposables ;
12. les liens, doublons et contradictions sont revalidés dans la même décision documentaire.

## 39. Contrats de non-régression

Toute évolution ou implémentation doit prouver :

- même demande et même contexte → même ensemble d’actions scientifiques admissibles ;
- reformulation non décisive → objet scientifique et décisions critiques préservés ;
- changement décisif → impacts et réouvertures attendus ;
- donnée absente → aucun fait inventé ;
- contradiction → deux positions conservées ;
- projection différente → même fond scientifique ;
- changement de LLM → contrats, objets, responsabilités et arrêts inchangés ;
- moteur indisponible → état explicite, jamais simulation ;
- modification documentaire → aucune mutation du projet sans contribution et décision ;
- évolution du corpus → nouvelle version et analyse d’impact, jamais réécriture historique ;
- décision humaine → auteur, mandat, portée, date et version conservés ;
- incapacité ou hors-domaine → refus reproductible.

## 40. Évaluation

Chaque moteur et composition doivent être évalués selon PD-011, avec :

- cas de référence, experts, incomplets, contradictoires, impossibles et hors domaine ;
- changements décisifs et perturbations non décisives ;
- comparaison à des référentiels pertinents ;
- erreurs critiques à tolérance nulle ;
- traçabilité complète ;
- décision humaine conservée ;
- résultats par domaine, moteur, parcours et projection ;
- aucun score global compensatoire.

Une recette technique ou un rapport `OFFICIAL` ne vaut jamais PASS PD-011.

## 41. État de la V1 au regard de RDE-001

| Capacité RDE | État observé au 8 août 2026 |
|---|---|
| Entrée conversationnelle et LLM borné | Implémentée dans le démonstrateur V1 |
| Domain Gate partiel | Implémenté de façon bornée sur sécurité, domaine et trois fixtures |
| Trois parcours comprendre/formaliser/concevoir | Implémentés dans la V1 |
| Contexte et modification majeure | Implémentés localement, avec preuve P-WEB-06C |
| Research Project canonique partagé | Non implémenté comme objet ou agrégat persistant officiel |
| Knowledge Engine général | Non démontré ; service borné aux corpus/fixtures |
| Scientific Thinking Engine complet | Non démontré ; parcours V1 borné |
| Study Design Engine complet | Non démontré ; dossier structuré sans protocole exécutable |
| Imaging Engine | Non implémenté comme moteur autonome |
| Biostatistics Engine | Non implémenté |
| Data Management Engine | Non implémenté |
| Regulatory, Economics, Safety | Non implémentés |
| Clinical Operations Engine | Non implémenté |
| Document Engine général | Non implémenté ; rapport et exports V1 bornés |
| Cycle jusqu’à ACTIVE/COMPLETED STUDY | Non implémenté |
| Évaluation scientifique PD-011 | Non démontrée |

## 42. Gouvernance d’admission de la version 1.0 — historique

La version 1.0 constatait que l’admission de RDE-001 exigeait une mission distincte autorisant explicitement :

- la mise à jour du SOURCE-OF-TRUTH-INDEX ;
- la décision sur les arbitrages A01 à A10 ;
- la qualification de RDE-001 comme référence de niveau 1 ;
- la désignation de la source maîtresse ;
- la définition des documents supérieurs et consommateurs ;
- la validation des liens et des contradictions ;
- la conservation de cette version candidate dans l’historique.

Cette autorisation n’existait pas dans la mission de version 1.0. Elle est fournie et exécutée par la mission KE-001 pour la version 1.1 ; le §42 est conservé comme historique.

## 43. Décision finale historique de la version 1.0

L’architecture est complète comme proposition : elle définit un projet central borné, les gardes d’entrée, l’orchestration des intentions, onze moteurs fonctionnels, quatre parcours, quatorze projections, dix contrats permanents, les règles de changement, la trajectoire de plateforme et les conditions d’évaluation.

Elle ne peut toutefois pas devenir une référence officielle dans cette opération. L’admission atomique dans le SOURCE-OF-TRUTH-INDEX est interdite par le périmètre « créer uniquement le document » ; plusieurs extensions doivent en outre être alignées explicitement avec PD-003 et les cycles de Projection, et la collision de nom entre le système et sa fonction de conception reste ouverte.

**Décision : `RDE_001_ARCHITECTURE_REQUIRES_ARBITRATION`.**

---

# Partie IX — Addendum normatif version 1.1

## 44. Portée de l’arbitrage

Le présent addendum, établi par la mission KE-001, remplace uniquement les statuts, collisions et conditions d’admission restés ouverts dans la version 1.0. Les principes, frontières, contrats, limites et constats d’implémentation antérieurs sont conservés.

Le nom canonique de la fonction spécialisée de conception est **Study Design Engine**. Les expressions historiques « fonction Research Design » et les libellés abrégés « Research Design » dans les tableaux de contributeurs désignent ce même moteur ; elles ne désignent jamais le système RDE entier.

## 45. Clôture A01–A10

| ID | Décision version 1.1 |
|---|---|
| A01 | la mission KE-001 autorise l’admission et la mise à jour atomique de l’index ; RDE-001 v1.1 est admis |
| A02 | Research Project reste définitivement un agrégat architectural du Dossier et des objets PD-003, sans identité canonique autonome |
| A03 | les macro-états sont des vues calculées ; RDE-002 §19 les relie aux objets/cycles PD-003, qui restent seuls canoniques |
| A04 | la fonction spécialisée est renommée Study Design Engine ; la collision est close |
| A05 | les moteurs émettent uniquement des Contributions, liens et états runtime ; aucune connaissance effective n’est créée |
| A06 | les états de disponibilité sont mappés au cycle Projection par le §46 ; aucune seconde machine d’état n’est admise |
| A07 | P-WEB-05 reste non admis ; aucune autorité implicite ne lui est attribuée |
| A08 | les domaines insuffisamment modélisés ne reçoivent aucune écriture canonique ; les moteurs restent des cibles fonctionnelles |
| A09 | `READY_FOR_SUBMISSION` signifie relue et prête à une décision humaine, jamais approuvée, diffusée ou PASS |
| A10 | toute complétude reste locale, fondée sur des exigences nommées, non compensatoire et distincte de maturité/qualité |

## 46. Mapping des disponibilités de Projection

| Vue RDE | Cycle canonique PD-003 |
|---|---|
| `NOT_AVAILABLE`, `STRUCTURE_ONLY`, `PARTIALLY_GENERATED` | demandée ; disponibilité/contenu local seulement |
| `READY_FOR_REVIEW` | produite |
| `READY_FOR_SUBMISSION` | relue ; diffusion encore non décidée |
| diffusion décidée et tracée | diffusée |
| `SUPERSEDED` | remplacée |
| `ARCHIVED` | archivée |

## 47. Ownership d’écriture

Tous les moteurs fonctionnels produisent des Contributions et des traces. Aucun moteur ne possède la mutation directe d’un objet PD-003. L’adoption appartient à un acteur humain habilité sous Mandat, via les Décisions, Versions et cycles PD-003. Knowledge est gouverné en détail par KE-001 ; les domaines spécialisés conservent l’ownership de leurs propositions sans acquérir l’autorité scientifique des corpus.

## 48. État et décision version 1.1

RDE-001 est une référence normative officielle de niveau 1. Son architecture reste une cible et son état d’implémentation du §41 demeure inchangé.

**Décision : `RDE_001_ARCHITECTURE_ADMITTED_OFFICIAL`.**
