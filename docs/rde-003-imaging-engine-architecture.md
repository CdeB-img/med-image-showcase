# RDE-003 — Imaging Engine Architecture

## Première spécialisation fonctionnelle du Research Design Engine

| Champ | Valeur |
|---|---|
| Identifiant documentaire | RDE-003 |
| Famille documentaire | RDE — Research Design Engine |
| Version | 1.1 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE` |
| Niveau documentaire | `NIVEAU_1 — architecture normative spécialisée` |
| Source maîtresse | `docs/rde-003-imaging-engine-architecture.md` |
| Éditions dérivées | aucune |
| Date d’état | 9 août 2026 |
| Domaine de responsabilité | raisonnement fonctionnel reproductible sur la place de l’imagerie dans un projet de recherche |
| Autorités supérieures | Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-005, PD-009, RDE-001/RDE-002 version 1.1 et KE-001 version 1.0 dans son domaine |
| Corpus scientifiques applicables | RB-003 version 1.0, RB-004 version 1.1 et RB-005 version 1.0, chacun dans son domaine de validité |
| État d’admission | admis atomiquement par le SOURCE-OF-TRUTH-INDEX version 1.25 |
| État d’implémentation | architecture proposée ; aucun Imaging Engine autonome n’est démontré |
| Principe directeur | question avant modalité, phénomène avant biomarqueur, qualité avant interprétation |

> Historique conservé : la version 1.0 du 8 août 2026 était candidate tant que ses parents, son identifiant et ses mappings PD-003 n’étaient pas arbitrés. La version 1.1 est admise avec RDE-001/RDE-002 v1.1 et KE-001 v1.0. Cette admission ne démontre aucun Imaging Engine autonome, catalogue d’équipements ou protocole exécutable.

---

## 0. Gouvernance et décision documentaire

### 0.1 Nature exacte de la mission

La mission définit l’architecture fonctionnelle de l’Imaging Engine, première spécialisation du système RDE. Elle précise :

- son contrat d’entrée et de sortie ;
- les objets PD-003 qu’il lit et les Contributions qu’il peut proposer ;
- la chaîne Question → Phénomène → Biomarqueur → Modalité → Acquisition → Mesure → Qualité → Analyse → Interprétation ;
- ses douze sous-domaines fonctionnels ;
- ses interactions avec les autres moteurs ;
- ses événements, impacts, refus, projections, contrats et évaluations futures.

La mission ne crée :

- aucun moteur exécutable ;
- aucun objet métier canonique ;
- aucun Decision Engine ou workflow parallèle ;
- aucun Knowledge Graph ou corpus ;
- aucun catalogue d’équipements effectif ;
- aucun protocole d’acquisition exécutable ;
- aucun paramètre, seuil, timing, coût ou valeur scientifique ;
- aucune recommandation clinique ou interprétation individuelle ;
- aucune projection rédigée par l’Imaging Engine ;
- aucune implémentation, activation ou preuve PD-011.

### 0.2 Autorités consultées dans l’ordre imposé

La lecture a commencé par `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis a porté, dans l’ordre demandé, sur :

1. Charte fondatrice ;
2. Scientific Product Manifesto ;
3. Product Specification ;
4. PD-003 — Research Object Model ;
5. PD-004 — UX Manifesto et Manuel UX officiel applicable ;
6. PD-005 — Prompt Library Architecture ;
7. PD-007 — Implementation Readiness ;
8. PD-009 — Decision Engine Architecture ;
9. PD-011 — Evaluation Framework ;
10. PD-012 — Scientific Program Architecture ;
11. PD-013 — Scientific Program Registry ;
12. Scientific Territory Model ;
13. Scientific Knowledge Catalog ;
14. Scientific Assertion Layer ;
15. Scientific Knowledge Graph documentaire ;
16. RB-003 — Spectral Imaging ;
17. RB-004 — Cardiac MRI & Quantitative Cardiac Imaging ;
18. RB-005 — Neuro Perfusion & Metabolism Foundations ;
19. P17 ;
20. P-WEB-04R ;
21. P-WEB-05 ;
22. P-WEB-06 ;
23. P-WEB-06C ;
24. RDE-001 ;
25. RDE-002.

Le manifeste de l’Editorial Engine a ensuite été consulté uniquement pour confirmer sa frontière : compiler des faits et politiques explicites vers plusieurs projections sans posséder la science, sans publier et sans devenir un moteur scientifique. L’Editorial Engine n’est ni intégré ni modifié.

### 0.3 Plans de vérité explicitement séparés

| Plan | Éléments applicables | Portée dans RDE-003 |
|---|---|---|
| Principes établis | science avant technologie ; intention avant solution ; modalité non racine ; humain décisionnaire ; incertitude visible ; reproductibilité ; arrêt honnête | Invariants supérieurs |
| Objets métier canoniques | objets, relations, cycles et traces PD-003 | Seul vocabulaire durable du projet |
| Connaissances scientifiques | RB-003, RB-004, RB-005, leurs sources, limites, controverses et domaines | Corpus datés ; aucune généralisation hors périmètre |
| Architecture RDE officielle | Research Project, Domain Gate, moteurs fonctionnels, workflow, événements et reconstruction RDE-001/RDE-002 version 1.1 | Architecture parente normative ; aucune implémentation déduite |
| Architecture Imaging proposée | contrat, sous-domaines, contributions, gardes, impacts et refus décrits ici | Cible fonctionnelle candidate |
| État réellement implémenté | démonstrateur V1, Guided Intake, trois fixtures/corpus et traitements bornés | Ne démontre aucun Imaging Engine autonome |
| Hypothèses | catalogue d’équipements, compatibilité générale, profils documentaires, orchestration multimodale et protocoles exécutables futurs | À valider séparément |
| Extensions futures | inventaires de capacités, connaissances exécutables, moteurs spécialisés d’exécution et nouveaux corpus | Non créées et non promises |
| Capacités non démontrées | moteur général multimodal, propagation complète, Core Lab générique, harmonisation automatique, protocole exécutable | Doivent rester explicitement indisponibles |

### 0.4 Matrice d’autorité

| Question | Autorité qui prime |
|---|---|
| Que signifie un objet du projet ? | PD-003 |
| Comment présenter choix, limites et retours ? | PD-004 |
| Quel rôle IA peut contribuer ? | PD-005 |
| Quelle prochaine action scientifique est recevable ? | PD-009 |
| Une version est-elle scientifiquement évaluée ? | PD-011 |
| Quel corpus ou Program existe officiellement ? | PD-012, PD-013 et SOURCE-OF-TRUTH-INDEX |
| Quelle connaissance d’imagerie est applicable ? | corpus admis, assertions revues et Knowledge Engine |
| Quel moteur porte la contribution fonctionnelle d’imagerie ? | RDE-001 version 1.1 puis RDE-003 version 1.1 |
| Comment cette contribution est-elle intégrée et reconstruite ? | RDE-002 version 1.1 |
| Comment une projection est-elle compilée ? | Document Engine ; Editorial Engine seulement à sa frontière générique de compilation |

### 0.5 Contradictions et arbitrages de la version 1.0 — historique

| ID | Documents concernés | Nature et autorité | Qualification | Traitement dans RDE-003 |
|---|---|---|---|---|
| IMG-A01 | SOURCE-OF-TRUTH-INDEX ; RDE-001 ; RDE-002 ; mandat RDE-003 | Les parents sont candidats et un niveau 1 doit être indexé pour devenir officiel | Bloquante pour l’admission | RDE-003 reste candidat |
| IMG-A02 | RDE-001 §33 ; mandat RDE-002 ; mandat RDE-003 | La roadmap non réservante de RDE-001 associait RDE-002 à Imaging et RDE-003 à Biostatistics | Non bloquante pour la rédaction, à réconcilier avant admission | L’identifiant courant suit le mandat ; aucune réservation rétroactive |
| IMG-A03 | PD-003 ; mandat RDE-003 | La non-évaluabilité est demandée comme objet explicite, mais PD-003 ne définit pas d’objet autonome de ce nom | Bloquante si une nouvelle identité métier est exigée | Représentation par Contrôle qualité + Information de projet + Limite/Alerte + Événement ; extension PD-003 requise pour un objet autonome |
| IMG-A04 | PD-003 ; mandat RDE-003 | « Imaging Endpoint » n’est pas un objet canonique | Résoluble par l’autorité métier | C’est un Critère de jugement alimenté par une Variable d’imagerie, jamais un nouveau type |
| IMG-A05 | PD-003 ; mandat RDE-003 | `AVAILABLE`, `DECLARED_AVAILABLE`, `PREFERRED`, `REQUIRED`, `UNKNOWN`, `NOT_AVAILABLE` mélangent état, provenance, préférence et contrainte | Bloquante si un enum unique est exigé | Représentation orthogonale par Information, provenance, Option/Recommandation/Décision et Contrainte |
| IMG-A06 | Scientific Territory Model ; Scientific Knowledge Graph ; PD-003 | Le Territory exclut le parc installé du Knowledge Graph, tandis que PD-003 permet l’environnement technique d’un projet | Différence de domaine, non contradiction | L’équipement local vit dans le Research Project ; le graphe ne porte que des objets documentaires sourcés |
| IMG-A07 | Scientific Assertion Layer ; Knowledge Graph ; mandat RDE-003 | Le schéma représente constructeur/modèle/version, mais les collections d’assertions revues sont vides dans l’état documenté | Capacité de représentation contre connaissance disponible | Aucun moteur général de compatibilité n’est déclaré disponible |
| IMG-A08 | PD-003 ; mandat RDE-003 | La chaîne demandée place l’endpoint après l’analyse, alors que PD-003 relie le Critère à l’Objectif, la Variable, la Population et le temps avant l’analyse | Différence entre chaîne de cohérence et ordre de création | L’endpoint est défini en amont puis vérifié en boucle avec mesure et Analyse |
| IMG-A09 | PD-003 ; PD-007 ; RDE-001 ; mandat RDE-003 | Un protocole exécutable futur est autorisé sous conditions, mais aucune connaissance exécutable générale n’est démontrée | Cible contre état réel | Toute demande actuelle reçoit un refus gouverné ; aucune sortie exécutable |
| IMG-A10 | PD-003 ; PD-005 R22/R23 ; RDE-001 | Frontière entre analyse d’image, analyse statistique et futur moteur d’exécution | Ownership à protéger | Imaging spécifie la mesure et la lecture ; Biostatistics possède l’inférence ; aucun moteur d’exécution n’est créé |
| IMG-A11 | RDE-001 ; PD-003 ; liste documentaire RDE-003 | Plusieurs documents spécialisés peuvent dupliquer des Projections existantes | Risque de seconde logique documentaire | Ils sont classés comme sections, profils ou candidats ; Document Engine reste seul producteur |
| IMG-A12 | RB-003 ; RB-004 ; RB-005 ; mandat multimodal | Trois corpus officiels ne couvrent pas toutes les modalités, pathologies, équipements et usages | Limite scientifique majeure | `NO_SUPPORTED_KNOWLEDGE` ou recherche gouvernée ; aucun repli vers le corpus le plus proche |

---

# Partie I — Mission, frontières et contrat du moteur

## 1. Définition de l’Imaging Engine

L’Imaging Engine est le domaine fonctionnel du système RDE chargé de rendre reconstructible la contribution de l’imagerie à une stratégie de recherche.

Il transforme un besoin scientifique déjà ancré en propositions structurées sur :

- les phénomènes biologiques pertinents ;
- les biomarqueurs capables de les approcher ;
- les modalités et acquisitions compatibles avec le contexte ;
- les conditions de mesure, la qualité, la lecture et l’harmonisation ;
- les Variables et Critères de jugement d’imagerie ;
- les limites d’interprétation et les impacts sur les autres domaines.

Il ne constitue ni un agent unique, ni un prompt, ni un modèle, ni une ontologie, ni un Decision Engine. Il mobilise un sous-ensemble des rôles PD-005 uniquement après que PD-009 a sélectionné une action scientifique.

## 2. Mission

L’Imaging Engine doit :

1. préserver la spécificité de la Question et du contexte ;
2. partir du phénomène ou construit, jamais de la disponibilité d’une modalité ;
3. distinguer phénomène, biomarqueur, observable, Variable, Critère et interprétation ;
4. comparer les Options d’imagerie selon une tâche et un Domaine de validité ;
5. confronter toute stratégie aux capacités locales réellement déclarées et datées ;
6. concevoir la qualité et la non-évaluabilité avant l’acquisition ;
7. rendre explicites les dépendances entre acquisition, mesure, analyse et interprétation ;
8. coordonner l’imagerie avec Study Design, Knowledge, Biostatistics, Data, Safety, Regulatory, Economics et Operations ;
9. produire seulement des Contributions intégrables selon RDE-002 ;
10. refuser toute inférence, compatibilité ou exécution non soutenue.

## 3. Frontières permanentes

L’Imaging Engine n’est jamais :

- un générateur de protocoles par mots-clés ;
- un catalogue de séquences à parcourir sans objectif ;
- un moteur de recommandations cliniques ;
- un outil d’interprétation patient ;
- un PACS, viewer, EDC, CTMS, Core Lab ou système de stockage ;
- un logiciel d’analyse ou de reconstruction ;
- un moteur statistique, réglementaire, économique ou de sécurité ;
- un Knowledge Graph parallèle ;
- un rédacteur ou compilateur documentaire ;
- un LLM spécialisé propriétaire de la décision.

Il ne choisit pas la prochaine action scientifique et n’active aucune Décision.

## 4. Chaîne scientifique centrale

La chaîne normative est :

**Question scientifique → Objectif → Hypothèse → Phénomène biologique → Biomarqueur → Modalité → Technique ou séquence → Acquisition → Condition de mesure et Paramètres critiques → Variable → Contrôle qualité → Procédure de lecture et Analyse d’image → Critère de jugement → Règle d’interprétation → Contribution aux Projections.**

Cette chaîne est un graphe de justification, pas un tunnel :

- plusieurs Phénomènes peuvent coexister ;
- un Phénomène peut nécessiter plusieurs Biomarqueurs ;
- un Biomarqueur peut être approché par plusieurs Modalités ;
- une Modalité peut produire plusieurs Variables ;
- une Acquisition peut servir plusieurs objectifs justifiés ;
- une Analyse ou une contrainte peut conduire à réviser le Critère, la Variable ou l’Acquisition ;
- aucun maillon aval ne réécrit silencieusement un choix amont.

Exemple interdit : **IRM disponible → T1 mapping proposé.**

Comportement recevable : **construit explicitement défini → phénomènes et biomarqueurs candidats sourcés → comparaison contextualisée des modalités → acquisitions et dépendances seulement si les gardes sont satisfaites.**

## 5. Contrat formel du moteur

| Élément | Contrat |
|---|---|
| Mission | produire des Contributions d’imagerie cohérentes, contextualisées, traçables et révisables |
| Entrée | version identifiée du Research Project, action PD-009, usage et niveau de conclusion attendus |
| Sortie | Contributions, Options, Recommandations candidates, Justifications, Dépendances, Limites, Risques, Alertes et besoins de décision |
| Objets lus | objets PD-003 nécessaires à la question, au contexte, à la stratégie, aux preuves et aux décisions |
| Objets enrichis | objets d’imagerie PD-003 uniquement par proposition puis intégration RDE-002 |
| Ownership fonctionnel | cohérence de la chaîne de mesure d’imagerie, qualité, lecture, harmonisation et limites |
| Préconditions | Question ancrée, objectif ou besoin de compréhension explicite, contexte minimal, domaine/capacité disponibles |
| Postconditions | contribution qualifiée, provenance, alternatives, inconnues, impacts et décisions humaines visibles |
| Dépendances | Knowledge, Study Design, Data, Biostatistics, Safety et autres moteurs selon l’action |
| Décisions humaines | toute sélection structurante, protocole, Critère principal, compromis critique, risque résiduel et gel de version |
| Arrêts | preuve, domaine, matériel, timing, qualité, analyse ou responsabilité insuffisants |
| Refus | patient-level, protocole exécutable non soutenu, compatibilité supposée, recommandation au-delà des preuves |
| Impacts aval | Variables, Critères, Analyses, Dimensionnement, données, risques, budget, calendrier et Projections |
| Projections rendues possibles | contributions structurées aux quatorze familles RDE-001 et profils d’imagerie |
| Traçabilité | version lue, objets, corpus, assertions, action, rôle, contribution, décision, impacts et refus |
| Évaluation | campagne PD-011 par domaine, modalité, contexte, sous-domaine et erreur critique |

## 6. Objets lus

L’Imaging Engine lit au minimum, lorsque pertinents :

- Dossier de recherche, Stratégie et Version active ;
- Situation, Intention, Question, Objectifs et Hypothèses ;
- Pathologie ou condition, Structure anatomique, Population, Phénotype et Phénomènes ;
- Plan d’étude, Groupes, Visites, Intervention ou exposition ;
- Biomarqueurs, Variables et Critères de jugement ;
- Modalités, Acquisitions, Techniques, Paramètres, Conditions de mesure et Protocole d’imagerie ;
- Sites et environnements techniques, Contraintes et Règles d’harmonisation ;
- Contrôles qualité, Procédures de lecture, Analyses et Règles d’interprétation ;
- Informations, Besoins, Options, Recommandations, Décisions et Justifications ;
- Dépendances, Incertitudes, Risques, Biais, Limites, Contradictions et Alertes ;
- Sources, Preuves, État de connaissance effectif et Domaines de validité ;
- Contributions, Revues, Événements d’évolution, Analyses d’impact et Projections.

Un objet absent n’est jamais tenu pour satisfait.

## 7. Objets proposés ou enrichis

L’Imaging Engine peut proposer des révisions de :

- Phénomènes biologiques liés à la Question ;
- Biomarqueurs et Variables d’imagerie ;
- Modalités, Techniques, Acquisitions et Paramètres critiques ;
- Conditions de mesure et temporalités d’imagerie ;
- Sites et environnements techniques dans le périmètre d’imagerie ;
- Règles d’harmonisation ;
- Contrôles qualité et Procédures de lecture ;
- Analyses d’image et Règles d’interprétation ;
- Critères de jugement alimentés par l’imagerie ;
- Dépendances, Options, Compromis et Recommandations candidates ;
- Incertitudes, Risques, Biais, Limites, Contradictions et Alertes ;
- Contributions aux profils et Projections.

Il ne les modifie jamais directement : RDE-002 gouverne qualification, décision, intégration, impact et versionnement.

## 8. Ce que l’Imaging Engine ne possède jamais

Il ne possède jamais :

- la Question, les Objectifs ou les Hypothèses ;
- la Population ou le Plan d’étude ;
- le Critère principal comme décision de projet ;
- la décision statistique, le Dimensionnement ou le SAP ;
- la décision réglementaire, de sécurité, économique ou opérationnelle ;
- les coûts, calendriers institutionnels ou responsabilités externes ;
- les connaissances des corpus et du Knowledge Graph ;
- les documents finaux ou leur diffusion ;
- une Décision humaine active ;
- les données patient, images, mesures ou résultats réels conservés dans les systèmes sources.

## 9. Matrice des responsabilités autorisées

| Responsabilité | Autorisée ? | Objet canonique | Condition | Autorité |
|---|---:|---|---|---|
| Lire la Question et son contexte | Oui | Question, Contexte, Version | action PD-009 identifiée | PD-003/PD-009 |
| Reformuler la Question | Contribution seulement | Contribution ciblant Question | ambiguïté d’imagerie ; décision humaine | PD-003/RDE-002 |
| Proposer un Phénomène | Oui, comme contribution | Phénomène biologique | lien à Question/Objectif et connaissance applicable | PD-003/Knowledge |
| Sélectionner un Biomarqueur | Recommandation candidate | Biomarqueur, Option, Recommandation | Phénomène explicite, alternatives et limites | PD-003/PD-005 R12 |
| Comparer des Modalités | Oui | Modalité, Option, Compromis | même tâche, contexte et sources comparables | PD-003/PD-005 R13 |
| Retenir une Modalité | Non seul | Décision | acteur et Mandat | PD-003/PD-009 |
| Proposer une Acquisition | Oui, conceptuellement | Acquisition, Technique, Paramètre critique | stratégie suffisamment stable et preuve applicable | PD-003/PD-005 R18 |
| Produire des paramètres exécutables | Non dans l’état actuel | Protocole d’imagerie, Paramètre critique | connaissance exécutable, matériel/version et autorisation non démontrés | PD-003 ; future gouvernance |
| Qualifier un équipement de projet | Oui | Site et environnement technique, Information | source locale, date et niveau de vérification | PD-003 |
| Déclarer une compatibilité universelle | Non | — | aucune source actuelle ne l’autorise | Knowledge/PD-003 |
| Proposer une harmonisation | Oui | Règle d’harmonisation | variabilité, objectif de comparabilité et faisabilité explicites | PD-003/PD-005 R19 |
| Concevoir la qualité | Oui | Contrôle qualité | pour toute Acquisition ou mesure | PD-003/PD-005 R21 |
| Définir une lecture d’image | Oui | Procédure de lecture | Variable, qualité, lecteurs et responsabilité identifiés | PD-003/PD-005 R22 |
| Exécuter segmentation ou quantification | Non | — | futur moteur ou système externe requis | Frontière RDE-001 |
| Proposer une Variable dérivée | Oui | Variable, Analyse, Dépendance | méthode, entrées, unité, QA et provenance | PD-003 |
| Construire un Critère d’imagerie | Contribution conjointe | Critère de jugement | Question, Objectif, Variable, Population et temps reliés | PD-003/R17/R22/R23 |
| Choisir le Critère principal | Non | Décision | acteur et Mandat | PD-009 |
| Définir l’analyse statistique | Non | Analyse/Dimensionnement | Biostatistics propriétaire | RDE-001/PD-005 R23-R24 |
| Identifier une cause de non-évaluabilité | Oui | Contrôle, Information, Limite, Alerte | cause, étape, impact et action explicites | PD-003 |
| Décider l’exclusion analytique | Non seul | Décision, Analyse | Imaging + Data + Biostatistics + humain | PD-003/RDE-002 |
| Recommander un Core Lab | Candidate seulement | Option, Recommandation, Compromis | besoin démontré, alternatives, coût/charge externes | PD-003/RDE-001 |
| Rédiger une Projection | Non | Projection | Document Engine propriétaire | RDE-001 |
| Modifier une Décision humaine | Non | Décision | nouvelle Décision humaine après impact | PD-003/RDE-002 |
| Interpréter une mesure patient | Non | — | hors domaine permanent | Charte/PD-009 |

---

# Partie II — Sous-domaines fonctionnels

## 10. Règle de composition interne

Les douze sous-domaines sont des responsabilités internes de l’Imaging Engine. Ils ne deviennent ni des moteurs logiciels, ni des agents, ni des sources de vérité distinctes. Une action peut en mobiliser plusieurs ; l’orchestration utilise seulement le sous-ensemble nécessaire.

## 11. Biological Phenomenon Mapping

| Élément | Contrat |
|---|---|
| Mission | relier la Question, les Objectifs et Hypothèses aux Phénomènes biologiques pertinents |
| Entrées | Question, population, pathologie, phénotype, connaissances et inconnues |
| Sorties | Phénomènes candidats, relations, primauté éventuelle, observabilité et limites |
| Décisions | choix du phénomène principal et portée des secondaires par l’humain |
| Dépendances | Knowledge, Scientific Thinking, rôles R10-R11 |
| Limites | aucune causalité inventée ; un phénomène non observable reste explicitement tel |

## 12. Biomarker Selection

| Élément | Contrat |
|---|---|
| Mission | identifier et comparer les Biomarqueurs capables d’approcher les Phénomènes retenus |
| Entrées | phénomènes, objectifs, population, temporalité, facteurs de confusion, preuves et contraintes |
| Sorties | Biomarqueurs candidats, rôle, statut de mesure, alternatives, limites et dépendances |
| Décisions | biomarqueurs indispensables, secondaires ou exploratoires adoptés par l’humain |
| Dépendances | Knowledge, R12, Quality, Modality Comparison et Biostatistics |
| Limites | aucun biomarqueur universel ; aucune équivalence automatique entre observable et biologie |

## 13. Modality Comparison

| Élément | Contrat |
|---|---|
| Mission | comparer les Modalités capables d’informer le même construit dans le contexte réel |
| Entrées | biomarqueurs, population, sites, contraintes, tâche, preuves, contributions Safety/Economics |
| Sorties | Options multimodales, complémentarités, compromis, non-comparabilités et recommandation conditionnelle |
| Décisions | choix, combinaison ou rejet de Modalités par acteur habilité |
| Dépendances | Knowledge, R13, Equipment Compatibility, Safety, Economics et Study Design |
| Limites | aucune comparaison générale IRM versus CT ; aucune valeur absente inventée |

## 14. Acquisition Strategy

| Élément | Contrat |
|---|---|
| Mission | traduire le besoin de mesure en Acquisitions conceptuelles justifiées |
| Entrées | biomarqueurs, modalités, critères, visites, équipements, contraintes, connaissances techniques |
| Sorties | Acquisitions, Techniques, Paramètres critiques conceptuels, Conditions, alternatives et conséquences d’omission |
| Décisions | adoption du Protocole d’imagerie et des compromis par l’humain |
| Dépendances | R18, Timing, Equipment, QA, Harmonization et Image Analysis |
| Limites | aucun paramètre exécutable sans connaissance, version et matériel gouvernés |

## 15. Equipment Compatibility

| Élément | Contrat |
|---|---|
| Mission | confronter les exigences de la stratégie aux environnements techniques déclarés et datés |
| Entrées | Site/environnement, constructeur, modèle, génération, version, options, capacités, technique requise |
| Sorties | correspondance exacte, alternatives candidates, écarts, inconnues et incompatibilités |
| Décisions | adaptation locale, exclusion de site, étude de pont ou changement de stratégie par l’humain |
| Dépendances | informations locales, sources constructeur gouvernées, Harmonization, Safety et Operations |
| Limites | aucun inventaire complet actuel ; aucune compatibilité supposée par proximité de nom |

## 16. Multicenter Harmonization

| Élément | Contrat |
|---|---|
| Mission | préserver la comparabilité sans masquer les différences de site, système ou version |
| Entrées | stratégie commune, sites, équipements, variantes, biomarqueurs, QA, analyses et objectif de comparabilité |
| Sorties | noyau commun, variantes autorisées, études de pont, contrôles, stratification et écarts résiduels |
| Décisions | niveau de variabilité accepté, exclusion ou adaptation par l’humain |
| Dépendances | R19, Equipment, QA, Core Lab, Data et Biostatistics |
| Limites | harmoniser n’est pas uniformiser ; correction de site ne prouve pas conservation biologique |

## 17. Quality Assurance

| Élément | Contrat |
|---|---|
| Mission | définir avant l’acquisition comment prévenir, détecter, qualifier et traiter les écarts |
| Entrées | acquisitions, paramètres critiques, biomarqueurs, sites, analyses, risques et usage scientifique |
| Sorties | Contrôles qualité, critères d’aptitude, actions, non-évaluabilité, formation et traçabilité |
| Décisions | acceptation avec réserve, répétition, correction ou exclusion par responsables habilités |
| Dépendances | R21, Equipment, Harmonization, Image Analysis, Data et Core Lab |
| Limites | aucun seuil inventé ; contrôle final seul insuffisant |

## 18. Core Lab Design

| Élément | Contrat |
|---|---|
| Mission | évaluer puis structurer la contribution possible d’un Core Lab sans l’imposer |
| Entrées | nombre/variabilité des centres, complexité, volume, lecture, aveugle, qualité, expertise et contributions de coût |
| Sorties | Options centralisée, certifiée, locale ou hybride ; responsabilités, QA, adjudication et charge |
| Décisions | création, périmètre et gouvernance du Core Lab par l’humain |
| Dépendances | QA, Harmonization, Data, Operations, Economics, Safety et Regulatory |
| Limites | le Core Lab n’est ni autorité automatique ni système opérationnel livré |

## 19. Image Analysis Strategy

| Élément | Contrat |
|---|---|
| Mission | définir comment les images deviennent des Variables mesurables et reproductibles |
| Entrées | acquisitions, biomarqueurs, critères, QA, logiciels déclarés, lecteurs et données |
| Sorties | Procédure de lecture, besoins de segmentation/recalage/normalisation, quantification, répétitions et sorties attendues |
| Décisions | méthode et responsabilité de lecture/mesure adoptées par l’humain |
| Dépendances | R22, QA, Data, Biostatistics et Core Lab |
| Limites | aucune exécution ; aucune absorption de l’analyse statistique ou de l’interprétation clinique |

## 20. Non-evaluability & Missingness

| Élément | Contrat |
|---|---|
| Mission | rendre explicites les échecs d’acquisition, de qualité, de lecture ou de mesure et leurs conséquences |
| Entrées | résultats QA, événements, variables attendues, analyses, visites et contexte |
| Sorties | cause, étape, prévisibilité, récupérabilité, répétabilité possible, impacts et action candidate |
| Décisions | répétition, acceptation avec réserve, exclusion ou traitement analytique par acteurs responsables |
| Dépendances | QA, Data, Biostatistics, Safety, Economics et Operations |
| Limites | absence de donnée ≠ valeur normale ; Imaging ne choisit pas seul la règle statistique de missingness |

## 21. Imaging Endpoint Construction

| Élément | Contrat |
|---|---|
| Mission | co-construire un Critère de jugement alimenté par une Variable d’imagerie |
| Entrées | Question, Objectif, Hypothèse, Phénomène, Biomarqueur, Variable, Acquisition, QA, temps et Analyse prévue |
| Sorties | Critère candidat, définition opérationnelle, temps, méthode, non-évaluabilité et dépendances |
| Décisions | statut principal/secondaire/exploratoire et adoption par l’humain |
| Dépendances | Study Design, R17, R22, Biostatistics et Data |
| Limites | aucun objet `ImagingEndpoint` séparé ; endpoint sans Analyse ou Variable interdit |

## 22. Imaging Documentation Projection

| Élément | Contrat |
|---|---|
| Mission | préparer les objets et Contributions nécessaires aux documents d’imagerie |
| Entrées | Version de stratégie, Profil, décisions, sources, limites, QA et usage |
| Sorties | blocs structurés, exigences, lacunes, provenance et conditions de générabilité |
| Décisions | profil, revue, diffusion ou soumission par les acteurs compétents |
| Dépendances | Document Engine, Data, Regulatory, Safety, Economics et Operations selon la Projection |
| Limites | aucune rédaction finale ; aucune Projection ne devient source scientifique |

---

# Partie III — Contrats scientifiques et méthodologiques

## 23. Phénomènes biologiques

### 23.1 Rôle

Le Phénomène biologique est le maillon entre l’Hypothèse et le Biomarqueur. L’Imaging Engine peut considérer plusieurs phénomènes simultanés, notamment les familles citées dans le mandat — fibrose, œdème, inflammation, nécrose, ischémie, perfusion, obstruction microvasculaire, hémorragie, infiltration, remodelage, fonction, déformation, métabolisme, perméabilité et diffusion — uniquement comme concepts à qualifier par des connaissances applicables.

Cette liste n’affirme ni leur présence dans un projet, ni leur observabilité, ni leur relation causale.

### 23.2 Contrat

Pour chaque Phénomène candidat, la Contribution indique :

- relation à la Question, à l’Objectif et à l’Hypothèse ;
- contexte pathologique, population et temporalité ;
- statut principal, secondaire ou alternatif proposé ;
- relations possibles avec d’autres Phénomènes ;
- caractère directement observable, indirectement approchable ou non observable par l’imagerie disponible ;
- connaissances, preuves, controverses et inconnues ;
- facteurs de confusion biologiques et techniques ;
- conséquences si le Phénomène reste indéterminé.

Un Phénomène principal n’est jamais élu par fréquence de mention ou disponibilité d’une Modalité. Son adoption est humaine.

## 24. Contrat du biomarqueur d’imagerie

Un Biomarqueur reste contextualisé au couple construit–méthode–population–temps–usage. Ses caractéristiques ne deviennent pas un nouvel objet autonome ; elles sont portées par les objets et relations PD-003.

| Dimension requise | Représentation canonique ou autorité |
|---|---|
| Phénomène(s) approché(s) | relation Phénomène → Biomarqueur |
| Type de mesure | Variable, Analyse, Procédure de lecture et Règle d’interprétation |
| Qualitatif, semi-quantitatif ou quantitatif | qualification de la Variable et connaissance applicable |
| Domaine de validité | Domaine de validité, Contexte, Population et Condition de mesure |
| Limites | Limite, Incertitude et Règle d’interprétation |
| Facteurs de confusion | Biais, Phénotype, Condition de mesure, Informations de projet |
| Dépendances techniques | Dépendance vers Modalité, Technique, Acquisition, Paramètre, logiciel et équipement déclaré |
| Répétabilité et reproductibilité | connaissances applicables, Analyse, Contrôle qualité et Revue méthodologique |
| Sensibilité constructeur/modèle/champ/logiciel | contexte technique de l’assertion et Site/environnement du projet |
| Timing biologique | Visite, Condition de mesure, Justification et connaissance |
| Niveau de preuve | Preuve, Synthèse de preuves et État de connaissance effectif |
| Compatibilité multicentrique | Règle d’harmonisation, Site, Contrôle qualité et Analyse |
| Non-évaluabilité | résultat QA + Information + Limite/Alerte + événement et impact |

Le moteur refuse de qualifier un Biomarqueur d’universel, de substitut validé ou de transportable sans preuve et Domaine de validité correspondants.

## 25. Modalités

### 25.1 Classes représentables

L’architecture accepte comme classes génériques :

- IRM ;
- CT ;
- PET ;
- SPECT ;
- échographie ;
- radiographie ;
- imagerie hybride ;
- toute autre Modalité admise par le territoire et disposant d’une connaissance gouvernée.

L’acceptation architecturale d’une classe ne prouve aucune couverture scientifique exploitable. RB-003 soutient un corpus spectral CT, RB-004 un corpus CMR et RB-005 certaines familles de perfusion/métabolisme cérébral ; ils ne constituent pas une base universelle pour toutes les comparaisons.

### 25.2 Contrat de comparaison

Une comparaison multimodale doit conserver séparément :

- construit ou Phénomène visé ;
- Biomarqueur et Variable réellement produits ;
- compartiment, temporalité et référence ;
- résolution spatiale, temporelle et physiologique selon la tâche ;
- répétabilité, reproductibilité et non-évaluabilité ;
- invasivité, irradiation et contraste, à partir de Safety ;
- accessibilité, durée, équipement, traitement et lecture ;
- compatibilité multicentrique et dépendances matérielles ;
- coûts et ressources, uniquement depuis Economics ;
- limites, risques, preuves, controverses et données manquantes.

Les valeurs ne sont comparées que si leurs définitions, conditions et sources sont compatibles. Sinon, la sortie correcte est « non comparable dans l’état actuel ».

## 26. Acquisition

### 26.1 Hiérarchie

La hiérarchie fonctionnelle est :

**Modalité → Technique ou Séquence → Acquisition → Paramètres critiques conceptuels → éventuelle configuration exécutable externe.**

PD-003 reste l’autorité : une Technique spécialise une Acquisition ; un Paramètre critique peut porter une valeur, plage ou règle ; le Protocole d’imagerie organise les Acquisitions par groupe et visite.

### 26.2 Trois niveaux strictement séparés

| Niveau | Contenu | Sortie Imaging actuelle | Autorité requise |
|---|---|---|---|
| Stratégie conceptuelle | information recherchée, rôle des acquisitions, ordre logique, dépendances et alternatives | Contribution possible si connaissance applicable | Imaging + décision humaine |
| Protocole méthodologique | acquisitions, conditions, paramètres critiques, QA, lecture, harmonisation et gestion des écarts | proposition seulement si chaque maillon est soutenu et revu | PD-003, RDE-002, humains compétents |
| Protocole exécutable | valeurs exactes compatibles avec constructeur, modèle, génération, version, options et contexte | non générable dans l’état démontré | future connaissance exécutable et gouvernance séparée |

`NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE` est un motif lisible de refus, pas un nouvel état canonique. Il est représenté par une Limite ou Alerte, les Informations manquantes, les Dépendances rompues et la condition de reprise.

## 27. Catalogue d’équipements et réalité locale

### 27.1 Représentation actuelle

PD-003 permet de représenter dans **Site et environnement technique** : équipement, constructeur, modèle, version, champ, accessoires, compétences, capacités, disponibilité et pratiques locales. L’information est datée et rattachée à sa source.

Le Knowledge Graph peut décrire des familles, modèles, générations, logiciels et Capability Statements sourcés. Il exclut cependant le parc réellement installé, les licences et l’affectation opérationnelle. Ces deux plans ne doivent jamais être fusionnés.

### 27.2 Catalogue futur

Un futur catalogue d’équipements pourrait documenter :

- constructeur, modèle, modalité et génération ;
- version logicielle et options ;
- force de champ IRM ou technologie CT pertinente ;
- capacités, techniques ou séquences documentées ;
- restrictions, période et état de commercialisation ;
- source, version, date de vérification et Domaine de validité.

Il resterait une source documentaire de capacités, jamais un inventaire implicite des centres. Sa création exige une mission, une autorité, une actualisation et une évaluation propres.

### 27.3 Disponibilité, provenance, préférence et exigence

Les six libellés du mandat sont décomposés :

| Libellé demandé | Sens gouverné | Objet ou qualification |
|---|---|---|
| `AVAILABLE` | capacité vérifiée pour une période et un site | Information de projet `connu`, source et date |
| `DECLARED_AVAILABLE` | capacité déclarée mais non vérifiée indépendamment | Information avec provenance déclarative ; « déclaré » n’est pas un état épistémique |
| `PREFERRED` | option préférée mais non nécessaire | Option/Recommandation ou Décision si adoptée |
| `REQUIRED` | exigence de la stratégie | Contrainte, Dépendance et Décision applicable |
| `UNKNOWN` | disponibilité non établie | Information `inconnu` et Besoin d’information |
| `NOT_AVAILABLE` | absence confirmée dans le contexte et la période | Information `connu` négative et Contrainte |

Ils ne forment jamais un enum unique.

### 27.4 Procédure de compatibilité

1. rechercher une correspondance exacte de famille, modèle, génération, logiciel, options et période ;
2. vérifier la source et la date ;
3. confronter chaque capacité requise à la capacité documentée ;
4. si la correspondance exacte manque, identifier des alternatives uniquement si leur compatibilité est sourcée ;
5. exposer les écarts et leurs impacts ;
6. laisser `inconnu` tout élément non vérifié ;
7. soumettre adaptation, étude de pont, exclusion ou changement à décision humaine.

La proximité de nom, de constructeur ou de génération ne prouve jamais la compatibilité.

## 28. Timing biologique et calendrier

Le timing est représenté par les Visites, Conditions de mesure, Contraintes, Informations de projet et Justifications. Une proposition distingue :

| Dimension | Question architecturale |
|---|---|
| Biologiquement pertinente | quelle cinétique du Phénomène ou Biomarqueur rend le temps informatif ? |
| Méthodologiquement utile | quel temps permet d’examiner l’Hypothèse ou le Critère ? |
| Opérationnelle | quel temps est réalisable selon sites, participants et ressources ? |
| Imposée | quelle Intervention, sécurité, règle ou fenêtre externe contraint le temps ? |
| Non déterminable | quelles connaissances ou décisions manquent pour proposer honnêtement un temps ? |

Imaging propose la justification scientifique du temps ; Study Design coordonne les Visites ; Safety et Operations apportent leurs contraintes. Aucun temps n’est inventé pour compléter un calendrier.

## 29. Monocentrique et multicentrique

| Configuration | Exigence minimale |
|---|---|
| Monocentrique | environnement daté, chaîne de mesure explicite, QA, dérive temporelle et dépendances logicielles visibles |
| Multicentrique homogène | démontrer l’homogénéité revendiquée, définir noyau commun, qualification et surveillance |
| Multicentrique hétérogène | stratifier sites/systèmes/versions, définir variantes, études de pont, harmonisation, analyse de site et non-évaluabilité |

Pour le multicentrique, l’Imaging Engine examine selon pertinence : constructeurs, modèles, champs, logiciels, options, techniques, reconstruction, injection, timing, nomenclature, qualification, phantoms, transfert, lecture, Core Lab, déviations et non-évaluabilité.

Chaque différence est classée :

- acceptable pour l’usage ;
- à harmoniser ;
- incompatible ;
- inconnue ;
- soumise à Décision humaine.

Cette classe est contextualisée ; elle n’est pas une propriété universelle d’un équipement.

## 30. Quality Assurance by design

### 30.1 Architecture QA

| Étape | Objet contrôlé | Sortie canonique |
|---|---|---|
| Conception | chaîne Question–Biomarqueur–Variable–Critère | Revue, Alerte, Besoin d’information |
| Qualification du site | équipement, logiciel, compétences, transfert | Site qualifié, Contrainte, Action requise |
| Qualification de l’équipement | capacités et stabilité pertinentes | Information vérifiée, Limite, incompatibilité |
| Pré-acquisition | préparation, timing, conditions et paramètres critiques | Contrôle qualité et critères d’acceptation |
| Acquisition | complétude, conformité, mouvement, artefacts et écarts | résultat conforme, avec réserve ou non conforme |
| Post-acquisition | intégrité, reconstruction, métadonnées et transfert | Information, Alerte, action corrective |
| Mesure/lecture | segmentation, aveugle, répétitions, cohérence | Variable qualifiée, réserve ou non-évaluabilité |
| Analyse | entrées, exclusions, versions et traçabilité | Revue conjointe Imaging/Data/Biostatistics |
| Suivi | dérive, mise à jour, déviation et correction | Événement d’évolution et Analyse d’impact |

### 30.2 Règles permanentes

- Toute mesure est reliée à ses Conditions de mesure et Contrôles qualité.
- Tout contrôle définit objet, moment, méthode, critère, résultat, responsable et conséquence d’échec.
- Une image visuellement satisfaisante ne prouve pas une mesure valide.
- Une bonne répétabilité ne prouve pas l’exactitude.
- Une correction ne supprime ni la donnée originale, ni la déviation, ni sa provenance.
- Une exclusion exige une règle et une décision applicables ; elle n’efface pas l’échec du dénominateur.

## 31. Core Lab

### 31.1 Porte d’utilité

Un Core Lab est considéré seulement si une décision de recherche peut être améliorée par une centralisation, une certification ou une supervision structurée. L’évaluation examine :

- nombre et hétérogénéité des centres ;
- variabilité des acquisitions et logiciels ;
- complexité et importance des lectures ;
- besoin d’aveugle, d’adjudication ou de répétabilité ;
- expertise locale et charge de formation ;
- volume, transfert, QA et archivage ;
- exigences réglementaires ou industrielles apportées par leurs moteurs ;
- coût et faisabilité apportés par Economics et Operations.

Le moteur conserve aussi les Options sans Core Lab, Core Lab partiel, certification locale ou lecture hybride.

### 31.2 Composants possibles

- qualification des centres et équipements ;
- manuel d’acquisition et formation ;
- réception, contrôle d’intégrité et QA ;
- lecture, répétitions, aveugle et adjudication ;
- gestion des déviations et non-évaluabilité ;
- mesures, exports et dictionnaire ;
- suivi de dérive, versionnement et archivage ;
- responsabilités, Mandats et circuit de décision.

Ces composants sont des responsabilités et Projections possibles. RDE-003 ne crée ni Core Lab opérationnel ni workflow d’affectation.

## 32. Image Analysis Strategy

### 32.1 Contenu autorisé

L’Imaging Engine peut définir les besoins scientifiques de :

- lecture humaine ou assistée ;
- segmentation, extraction, recalage et normalisation ;
- quantification et règles de calcul ;
- répétabilité, reproductibilité et changements de conditions ;
- aveugle, nombre de lecteurs, répétitions et adjudication ;
- contrôles d’entrée, versions logicielles et sorties attendues ;
- critères d’acceptabilité et conditions de non-évaluabilité.

### 32.2 Frontières

| Domaine | Ownership |
|---|---|
| Définition du mesurande et de la mesure d’image | Imaging |
| Procédure de lecture et QA d’imagerie | Imaging |
| Structure, provenance et intégrité des données | Data Management |
| Modèle statistique, missingness analytique et inférence | Biostatistics |
| Exécution de segmentation/reconstruction/quantification | système externe ou futur moteur séparé |
| Interprétation scientifique de résultats réels | contribution conjointe, données réelles et humain |
| Interprétation clinique individuelle | interdite |

## 33. Critères de jugement d’imagerie

Un « Imaging Endpoint » est un **Critère de jugement PD-003** dont la Variable et la méthode d’obtention proviennent de l’imagerie.

La chaîne de cohérence est :

**Question → Objectif → Hypothèse → Phénomène → Biomarqueur → Modalité/Acquisition → Variable → QA → Procédure de lecture/Analyse d’image → Critère → Analyse statistique → Règle d’interprétation.**

Le Critère est défini avant l’analyse statistique, puis révisé en boucle si l’estimabilité, la qualité ou la non-évaluabilité le rendent inadéquat.

Le moteur détecte au minimum :

- Biomarqueur sans Objectif ou Phénomène ;
- Variable sans Acquisition ou méthode d’obtention ;
- Critère sans Variable, Population, temps ou Analyse prévue ;
- Acquisition sans justification scientifique ;
- protocole sans critère de qualité ;
- mesure non transportable présentée comme générale ;
- dépendance technique critique inconnue ;
- confusion entre Critère, mesure et interprétation.

Le statut principal, secondaire ou exploratoire reste une Décision humaine coordonnée avec Study Design et Biostatistics.

## 34. Non-évaluabilité et données manquantes

### 34.1 Représentation canonique actuelle

En l’absence d’un objet PD-003 autonome, un cas de non-évaluabilité est représenté explicitement par :

1. le Contrôle qualité et son résultat ;
2. une Information de projet qualifiant l’état observé ;
3. la Variable ou Acquisition concernée ;
4. la cause sous forme de Contrainte, Limite, Risque ou Alerte ;
5. un Événement d’évolution si l’état modifie la stratégie ;
6. une Analyse d’impact ;
7. l’action et la Décision applicables ;
8. la trace dans Data et l’Analyse statistique.

### 34.2 Contrat minimal

Chaque occurrence conserve :

- cause et étape de détection ;
- caractère prévisible ou inattendu ;
- caractère récupérable ;
- répétition possible, licite et utile ;
- Variable, Critère et visite touchés ;
- impact statistique fourni par Biostatistics ;
- impacts économiques et calendaires fournis par leurs moteurs ;
- action candidate, responsable et Décision humaine ;
- version de règles QA appliquée ;
- population, site, système et version concernés.

Les états « non acquis », « interrompu », « incomplet », « techniquement invalide », « rejeté QA », « analysable avec réserve », « manquant » et « physiologiquement négatif » ne sont jamais fusionnés.

Si une identité autonome de NonEvaluability est jugée nécessaire pour agréger ces occurrences, PD-003 doit évoluer avant toute implémentation.

---

# Partie IV — Interactions, événements et impacts

## 35. Principe des interactions inter-moteurs

Les échanges durables passent par le même Research Project. Imaging ne transmet pas un document libre comme nouvelle vérité et ne modifie jamais directement l’objet appartenant à un autre domaine.

| Interaction | Imaging fournit | Imaging reçoit | Ownership externe préservé |
|---|---|---|---|
| Imaging ↔ Study Design | besoins de mesure, options, faisabilité, dépendances et impacts | Question, Objectifs, Population, Plan, Visites et Critères candidats | cohérence globale et décisions de design |
| Imaging ↔ Knowledge | besoins de connaissances, contexte exact et lacunes | assertions/corpus applicables, preuves, controverses et limites | autorité scientifique des connaissances |
| Imaging ↔ Biostatistics | Variables, qualité, répétabilité, non-évaluabilité et Critères candidats | estimabilité, modèle, distribution sourcée, missingness et Dimensionnement | inférence statistique |
| Imaging ↔ Data Management | Variables, unités, formats attendus, sources, QA et dérivations | dictionnaire, intégrité, flux, identifiants, CRF et transfert | structure et gouvernance des données |
| Imaging ↔ Safety | expositions, contraste, procédures et risques techniques candidats | évaluation de sécurité et contraintes humaines | sécurité et escalade |
| Imaging ↔ Regulatory | dispositif, méthode, documents et contexte déclarés | exigences, qualification et contraintes juridictionnelles | détermination réglementaire humaine |
| Imaging ↔ Economics | examens, ressources, Core Lab, lecture, stockage, transfert et QA requis | coûts sourcés, scénarios et sensibilités | économie et budget |
| Imaging ↔ Clinical Operations | exigences sites, formation, QA, monitoring et déviations | disponibilité, calendrier, responsabilités et événements opérationnels | exécution et systèmes sources |
| Imaging ↔ Document | objets, Contributions, sources, limites et profils | usage, audience, version et exigences de projection | rédaction et compilation documentaire |

## 36. Contrat de handoff

Toute contribution sortante indique :

- moteur source et version du contrat ;
- action PD-009 à laquelle elle répond ;
- Dossier, Version de stratégie et État de connaissance lus ;
- objets sources et cibles ;
- contenu proposé, alternatives et éléments exclus ;
- preuves, Domaine de validité et contexte technique ;
- inconnues, limites, risques et contradictions ;
- décisions humaines requises ;
- impacts directs et aval ;
- condition d’arrêt, de reprise ou de réexamen.

Une contribution entrante sans provenance, objet cible ou responsabilité est rejetée ou renvoyée pour clarification.

## 37. Événements d’imagerie

Les noms ci-dessous sont des types lisibles d’Événement d’évolution RDE-002 ou de changement d’objet PD-003. Ils ne créent aucune seconde taxonomie canonique.

### 37.1 Règle d’impact

Pour chaque événement, l’Imaging Engine :

1. conserve l’état avant ;
2. identifie les objets directement affectés ;
3. parcourt les Dépendances ;
4. mobilise les moteurs propriétaires nécessaires ;
5. propose les Décisions à rouvrir ;
6. marque les Projections à revoir ou obsolètes ;
7. démontre ce qui reste valide ;
8. contribue à l’Analyse d’impact RDE-002.

### 37.2 Matrice des événements et impacts

| Événement | Objets directs | Aval minimal | Moteurs à réinterroger | Décisions à rouvrir | Projections à revoir | Éléments conservés par défaut |
|---|---|---|---|---|---|---|
| `BiomarkerChanged` | Biomarqueur, Justification | Modalités, Acquisitions, Variables, QA, Critères, Analyses | Knowledge, Study Design, Biostatistics, Data, Safety | biomarqueur, modalité, Critère | Protocol, CRF, Data Dictionary, SAP, Core Lab Manual, Publication | Question/Objectifs sauf chemin d’impact |
| `ModalityChanged` | Modalité, Option | Techniques, équipements, Safety, Acquisitions, QA, Variables, budget | Knowledge, Safety, Economics, Data, Biostatistics, Operations | modalité, compromis, stratégie | Protocol, Funding, CRF, SAP, Budget, Timeline, CPP/ANSM, guides | Phénomène/Biomarqueur s’ils restent observables |
| `AcquisitionChanged` | Acquisition, Technique, Paramètre | Variables, QA, lecture, Analyses, Critères, timing | Data, Biostatistics, Safety, Operations, Study Design | protocole, risques, variantes | Protocol, CRF, Data Dictionary, SAP, Core Lab Manual, guides | objectifs non dépendants |
| `EquipmentChanged` | Site/environnement | compatibilité, variantes, QA, harmonisation, faisabilité | Operations, Safety, Economics, Data, Study Design | site, adaptation, étude de pont | Protocol, Budget, Timeline, Core Lab Manual, Monitoring, Guide | stratégie commune si compatibilité démontrée |
| `FieldStrengthChanged` | Site, Technique, Paramètres | Biomarqueur, mesure, QA, lecture, harmonisation | Knowledge, Data, Biostatistics, Operations | variante, comparabilité, Critère si touché | Protocol, Data Dictionary, SAP, Core Lab Manual, Publication | données/versions historiques |
| `SoftwareVersionChanged` | Site, Analyse, Procédure | reconstruction, Variable, QA, comparabilité, dérivation | Knowledge, Data, Biostatistics, Operations | qualification, pont, usage courant | Data Dictionary, SAP, Core Lab Manual, Monitoring, Publication | résultats historiques avec version source |
| `TimingChanged` | Visite, Condition de mesure | Phénomène, Biomarqueur, Acquisition, Critère, Analyse | Study Design, Safety, Operations, Biostatistics | visite, Critère, compromis | Protocol, CRF, SAP, Timeline, guides | objets non temporels sans dépendance |
| `QualityRuleChanged` | Contrôle qualité | évaluabilité, Variables, exclusions, analyses, sites | Data, Biostatistics, Operations, Safety | acceptabilité, exclusions, version | Protocol, CRF, SAP, Core Lab Manual, Monitoring | anciens résultats sous ancienne règle |
| `CoreLabStrategyChanged` | Option, Procédure de lecture, Harmonisation | rôles, QA, transfert, données, coûts, calendrier | Data, Operations, Economics, Regulatory, Biostatistics | centralisation, lecture, responsabilités | Funding, Budget, Timeline, Core Lab Manual, Monitoring, Guide | stratégie scientifique hors impacts démontrés |
| `ImageAnalysisChanged` | Analyse, Procédure, Variable dérivée | QA, Critère, Data, statistiques, interprétation | Data, Biostatistics, Knowledge, Study Design | méthode, Variable, Critère | Data Dictionary, SAP, Core Lab Manual, Publication | images sources et anciennes dérivations |
| `ImagingEndpointChanged` | Critère de jugement, Variable | Acquisition, QA, Analyse, Dimensionnement, Data | Study Design, Biostatistics, Data, Operations | Critère principal, plan, puissance | Protocol, Synopsis, Funding, CRF, SAP, Budget, Publication | Question/Hypothèse jusqu’à impact contraire |

« Conservé par défaut » signifie seulement « non invalidé sans chemin de dépendance ». L’absence d’impact doit être démontrée avant maintien engageant.

---

# Partie V — Projections documentaires

## 38. Principe

L’Imaging Engine ne rédige aucune Projection. Il fournit au Document Engine des objets et Contributions reliés à une Version de stratégie. Une Projection différente ne crée ni nouvelle stratégie d’imagerie, ni nouvelle science.

## 39. Contributions aux quatorze Projections RDE-001

| Projection | Contribution Imaging | Préconditions propres | Limite permanente |
|---|---|---|---|
| Protocol | justification d’imagerie, acquisitions conceptuelles, QA, lecture, limites et responsabilités | stratégie revue, décisions humaines, version source | ne vaut ni protocole exécutable ni approbation |
| Synopsis | rôle de l’imagerie, biomarqueurs, modalités retenues et limites critiques | Question/Objectifs confirmés et état explicitement incomplet possible | ne simplifie pas une inconnue bloquante |
| Funding | besoins d’imagerie, faisabilité, Core Lab, qualité et ressources | hypothèses de coûts fournies par Economics | aucun coût ou bénéfice inventé |
| Publication | description versionnée des méthodes, QA, non-évaluabilité et limites | données/résultats réels requis pour toute conclusion | aucune interprétation ou publication automatique |
| CRF | Variables, temps, sources, états QA et non-évaluabilité | Data Management propriétaire de la structure | Imaging ne définit pas seul le CRF |
| Data Dictionary | définitions de Variables, unités, dérivations, provenance et version | méthode et qualité explicites | aucune valeur ou format supposé |
| SAP | structure des mesures, répétabilité, qualité, missingness observé et facteurs de site | Biostatistics propriétaire des modèles | aucune analyse statistique créée par Imaging |
| Budget | examens, équipements, qualification, lecture, transfert, stockage et QA requis | Economics fournit valeurs et scénarios | aucune fausse précision |
| Timeline | dépendances de timing, qualification, formation, acquisition, lecture et QA | Operations coordonne les dates | timing biologique non réduit à l’organisation |
| CPP | description d’imagerie, exposition, contraste, données et risques candidats | Regulatory/Safety qualifient les exigences | ne vaut aucun avis éthique |
| ANSM | dispositif, méthode et pièces d’imagerie applicables | qualification réglementaire humaine | aucune détermination réglementaire automatique |
| Core Lab Manual | qualification, acquisition, transmission, QA, lecture, adjudication, déviations et versions | stratégie Core Lab adoptée | ne crée pas un Core Lab opérationnel |
| Monitoring Plan | paramètres critiques, conformité, dérive, déviations et actions | étude/capacité Operations réelles | ne remplace pas le monitoring humain/CTMS |
| Investigator Guide | exigences d’imagerie, responsabilités, qualité, sécurité et escalades | version applicable et revue humaine | ne vaut ni formation achevée ni délégation |

## 40. Documents et profils spécifiques d’imagerie

| Intitulé | Classification proposée | Projection ou profil parent | Traitement |
|---|---|---|---|
| Imaging Protocol Section | Section d’une Projection existante | Protocol | pas d’identité documentaire autonome par défaut |
| Acquisition Manual | Profil d’usage | Protocol, Core Lab Manual ou Investigator Guide | autonomie seulement si audience/contrat distincts sont admis |
| Site Qualification Checklist | Profil de check-list | Core Lab Manual ou Monitoring Plan | même Version de stratégie et mêmes règles QA |
| Scanner/MRI Compatibility Matrix | Profil comparatif | fiche site, comparateur ou annexe Core Lab | ne devient pas catalogue d’équipements |
| Core Lab Manual | Projection existante RDE-001 | Core Lab Manual | aucune duplication |
| Imaging CRF Specification | Profil ou section | CRF | Data Management reste propriétaire |
| Imaging Data Dictionary | Profil ou section | Data Dictionary | Data Management reste propriétaire |
| QA Plan | Profil transversal ; candidat autonome seulement si nécessaire | Protocol, Core Lab Manual ou Monitoring Plan | PD-003 permet un plan qualité, RDE-001 doit décider la famille documentaire |
| Reader Manual | Profil spécialisé candidat | Core Lab Manual ou Investigator Guide | autonomie à arbitrer selon audience et cycle |
| Deviation Handling Plan | Profil ou section | Monitoring Plan/Core Lab Manual | les déviations restent événements/alertes/décisions du projet |
| Imaging Methods — Funding | Section adaptée | Funding | aucune nouvelle science |
| Imaging Methods — Publication | Section adaptée | Publication | aucune conclusion sans résultats réels |

Les candidats `QA Plan` et `Reader Manual` ne sont pas créés par leur mention. Toute identité autonome future doit démontrer un usage, une audience, un cycle et une responsabilité non dupliqués.

## 41. Frontière avec le Document et l’Editorial Engine

- Imaging possède la fidélité scientifique de ses Contributions, pas leur rédaction finale.
- Document Engine possède la composition de la Projection RDE.
- L’Editorial Engine peut ultérieurement compiler des faits et politiques explicites en représentations cohérentes dans son contrat générique.
- L’Editorial Engine ne juge pas la validité scientifique, ne choisit pas la Projection, ne publie pas et ne reçoit aucune ontologie Imaging propre.
- Toute correction de fond issue d’un document revient comme Contribution puis suit RDE-002.

---

# Partie VI — Refus, arrêts et exemples architecturaux

## 42. Conditions d’arrêt ou de refus

L’Imaging Engine suspend, escalade ou refuse lorsque :

1. le Phénomène ou construit reste insuffisamment défini pour l’usage ;
2. aucun Biomarqueur défendable n’est soutenu ;
3. le Biomarqueur ne s’applique pas à la population, au temps ou au contexte ;
4. aucune Modalité disponible ne peut approcher honnêtement le besoin ;
5. une Modalité raisonnable n’est pas couverte par une connaissance applicable ;
6. l’équipement exact, la version ou une option critique restent inconnus ;
7. l’équipement déclaré est incompatible ou sa compatibilité n’est pas démontrable ;
8. une stratégie conceptuelle est transformée en protocole exécutable sans connaissance gouvernée ;
9. le timing ne peut être justifié ;
10. l’hétérogénéité multicentrique ne peut être harmonisée ou stratifiée ;
11. les critères QA ou les conséquences d’échec sont insuffisants ;
12. la Procédure de lecture ou l’Analyse d’image n’est pas définie ;
13. la Variable ou le Critère n’est pas mesurable ;
14. la non-évaluabilité ou les données manquantes sont assimilées à un résultat normal ;
15. une Information, source, preuve, valeur, coût, timing, paramètre ou capacité devrait être inventé ;
16. une Contradiction structurante reste non arbitrée ;
17. une contribution Safety, Regulatory, Economics, Data ou Biostatistics nécessaire manque ;
18. la demande porte sur un patient, un diagnostic, une conduite ou une interprétation individuelle ;
19. la recommandation attendue dépasserait les preuves ou le Domaine de validité ;
20. l’utilisateur exige la disparition d’une modalité, limite, alternative, provenance ou décision humaine.

## 43. Sorties d’arrêt

| Sortie lisible | Représentation canonique | Usage |
|---|---|---|
| `NO_SUPPORTED_KNOWLEDGE` | Limite + Besoin d’information + corpus interrogé | aucune connaissance applicable |
| `EQUIPMENT_COMPATIBILITY_UNKNOWN` | Information inconnue + Dépendance + Besoin | matériel/version non vérifiés |
| `NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE` | Limite/Alerte + dépendances manquantes | protocole exécutable non soutenu |
| `RESEARCH_CLARIFICATION_REQUIRED` | Besoin + Échange adaptatif | ambiguïté scientifique réductible |
| `ENGINE_UNAVAILABLE` | Limite de capacité + condition de reprise | moteur ou contribution requise absents |
| `OUT_OF_SCOPE` | constat Domain Gate + refus | patient-level, action clinique ou responsabilité interdite |

Ces libellés ne sont pas des états métier supplémentaires.

## 44. Contenu obligatoire du refus

Tout refus explique :

- ce qui bloque et pourquoi ;
- les objets, connaissances, équipements ou responsabilités concernés ;
- ce qui reste scientifiquement exploitable ;
- les conclusions ou Projections rendues impossibles ;
- l’information, la preuve, la version ou l’expertise manquante ;
- l’acteur ou moteur à solliciter ;
- les Options de réduction de portée ;
- la condition de reprise ;
- le Dossier, la Version de stratégie et l’État de connaissance applicables.

Le refus ne propose jamais un protocole « indicatif » pour contourner la garde.

## 45. Exemple architectural 1 — Comparer IRM cardiaque et CT cardiaque pour une lésion myocardique

### 45.1 Ancrage

La demande reste centrée sur **la lésion myocardique**. Elle ne devient pas une comparaison générale IRM/CT.

### 45.2 Ambiguïtés décisionnelles

Avant comparaison, le moteur demande seulement ce qui peut changer la stratégie :

- nature et finalité de la lésion recherchée ;
- phénomène principal ou ensemble de phénomènes ;
- population et contexte pathologique ;
- moment biologique ;
- Critère ou décision de recherche ;
- CT conventionnel ou spectral lorsque cette distinction change l’information ;
- contraintes d’accès, contraste, irradiation ou équipement à obtenir des moteurs compétents.

### 45.3 Phénomènes candidats

Œdème, inflammation, nécrose, fibrose/cicatrice, perfusion ou obstruction microvasculaire peuvent être présentés comme **axes candidats à qualifier**, parce qu’ils appartiennent aux vocabulaires du mandat et des corpus. Leur présence, primauté et observabilité ne sont jamais présumées.

### 45.4 Comparaison

- RB-004 peut soutenir des concepts CMR dans son domaine.
- RB-003 peut soutenir des concepts de CT spectral dans son domaine.
- Aucun des deux n’autorise une équivalence transmodale générale ni une performance comparative pour la lésion non précisée.
- Si la branche CT exacte n’est pas couverte, elle reste visible comme Option accompagnée du motif `NO_SUPPORTED_KNOWLEDGE` ; elle n’est ni supprimée ni remplacée par RB-004.
- Knowledge doit rechercher une preuve comparative applicable avant toute recommandation conditionnelle.

### 45.5 Sortie

La sortie est une carte d’Options, de besoins de clarification, de preuves et de limites. Elle n’est ni un choix clinique ni un protocole.

## 46. Exemple architectural 2 — No-reflow après reperfusion ou stenting

### 46.1 Conservation de la spécificité

Le terme `no-reflow` est conservé comme concept à résoudre. Il n’est pas réduit à « complication cardiaque ».

### 46.2 Relations à instruire

Le moteur conserve explicitement :

- l’événement ou contexte de reperfusion/stenting ;
- la temporalité ;
- la population et la pathologie ;
- les phénomènes candidats cités par le mandat, dont perfusion et obstruction microvasculaire ;
- les biomarqueurs, Modalités et Variables seulement après interrogation des connaissances applicables.

### 46.3 Séparation des parcours

- Dans `UNDERSTAND`, Knowledge et Scientific Thinking expliquent concepts, distinctions, preuves et inconnues sans créer de stratégie d’étude.
- Le passage à `DESIGN_STUDY` exige une Question, un Objectif, une Population et une Décision humaine de créer ou reprendre un projet.
- Imaging n’entre qu’après sélection de l’action pertinente par PD-009.

## 47. Exemple architectural 3 — Projet multicentrique IRM 1,5 T

`IRM 1,5 T` est une Information de départ, pas une stratégie complète ni une preuve d’homogénéité.

Le moteur :

1. conserve la force de champ déclarée et sa provenance ;
2. demande modèles, générations, versions, options et capacités seulement s’ils changent la compatibilité ;
3. identifie le Biomarqueur et la chaîne de mesure avant les Séquences ;
4. sépare timing biologique et calendrier opérationnel ;
5. qualifie les sites comme comparables, à harmoniser, incompatibles ou inconnus pour l’usage ;
6. propose noyau commun, variantes, QA et études de pont candidates ;
7. évalue l’utilité d’un Core Lab sans le rendre automatique ;
8. conserve toute capacité non vérifiée comme inconnue ;
9. demande les décisions humaines sur compromis, exclusions et centralisation ;
10. refuse les paramètres exécutables tant que les versions et connaissances ne sont pas gouvernées.

## 48. Exemple architectural 4 — Interprétation d’un T2 patient individuel

Le Domain Gate qualifie la demande d’interprétation individuelle `OUT_OF_SCOPE`.

Le système :

- ne classe pas la valeur ;
- ne formule ni diagnostic, ni probabilité, ni conduite ;
- n’utilise pas RB-004 comme substitut à une responsabilité clinique ;
- explique la frontière et recommande une évaluation par le professionnel responsable ;
- peut proposer, si l’utilisateur reformule, une explication méthodologique générale sur le statut d’une mesure, ses conditions, sa qualité et ses limites, sans utiliser les données du patient.

---

# Partie VII — Contrats permanents et non-régression

## 49. Tableau des contrats permanents

| Contract | Exigence | Autorité | Test futur | Violation bloquante |
|---|---|---|---|---|
| I1 — Question before modality | aucune Modalité n’est proposée depuis un mot-clé technique | Charte, Manifesto, PD-003 | demande mentionnant seulement une Modalité | modalité devenue racine |
| I2 — Phenomenon before biomarker | tout Biomarqueur est relié à un Phénomène/Objectif | PD-003, PD-005 R12 | biomarqueur populaire sans construit | biomarqueur orphelin |
| I3 — Biomarker contextuality | validité, population, temps, méthode et limites restent explicites | PD-003, corpus | même biomarqueur dans deux contextes | universalisation silencieuse |
| I4 — Equipment reality | capacités locales sourcées, datées et exactes | PD-003 §7.10 | équipement inconnu ou version différente | compatibilité supposée |
| I5 — Timing justification | tout temps possède une justification biologique/méthodologique ou reste inconnu | PD-003, PD-005 R20 | protocole exigeant une date absente | timing inventé |
| I6 — QA by design | QA et conséquences d’échec définies avant mesure | PD-003, R21, RB-004/RB-005 | stratégie quantitative sans QA | mesure interprétée sans aptitude |
| I7 — Multicenter explicitness | sites, systèmes, versions et variabilité restent visibles | PD-003, R19, corpus | multicentrique hétérogène | mutualisation silencieuse |
| I8 — Human scientific decision | tout choix structurant possède Acteur et Mandat | PD-003/PD-009 | choix de modalité ou Critère | décision automatique |
| I9 — No executable protocol without executable knowledge | aucun paramètre exécutable sans connaissance/version/matériel gouvernés | PD-003, PD-007 | demande directe de protocole | protocole plausible inventé |
| I10 — No patient-level interpretation | aucune interprétation ou recommandation individuelle | Charte/PD-009 | T2 patient ou image individuelle | conclusion clinique |
| I11 — Traceable recommendation | chaque recommandation conserve raison, preuve, contexte, alternative, limite et conséquence | PD-003, R28/R35 | recommandation de modalité | source ou alternative absente |
| I12 — Specific request remains specific | objet, pathologie, temps et intention ne sont pas généralisés | Manifesto/PD-004 | no-reflow ou ECV spécifique | réponse encyclopédique générique |
| I13 — No hidden fallback to closest corpus | corpus insuffisant conduit à un gap, jamais à une substitution | PD-011, P-WEB, RDE-002 | CT non couvert avec RB CMR disponible | branche/modalité supprimée |
| I14 — Cross-engine impacts explicit | tout changement nomme moteurs, décisions et projections touchés | PD-003/RDE-002 | changement modalité/champ/logiciel | impact non propagé |
| I15 — Projection does not own science | toute Projection dérive d’une Version et ne modifie pas le fond | PD-003/RDE-001/Editorial Manifesto | correction dans un manuel | document devenu source |

## 50. Cas minimaux de non-régression

| Cas | Résultat attendu |
|---|---|
| Même Question + même contexte + même État de connaissance | même ensemble d’Options méthodologiques admissibles |
| Changement de Modalité | QA, analyse, Safety, Data, budget et projections touchés sont identifiés |
| Changement de champ IRM | dépendances techniques et comparabilité sont réévaluées ; rien n’est supposé |
| Changement de version logicielle | résultats historiques conservent leur version ; nouvelle qualification ciblée |
| Équipement inconnu | aucun fallback vers un modèle voisin ; Besoin d’information |
| Comparaison CT/IRM | aucune Modalité ne disparaît parce qu’un corpus est incomplet |
| Biomarqueur spécifique | aucun remplacement par une fiche générique de biomarqueur |
| Corpus incomplet | `NO_SUPPORTED_KNOWLEDGE`, réduction de portée ou arrêt honnête |
| Phénomène non directement observable | limite explicite et biomarqueur indirect qualifié, jamais équivalence |
| Donnée absente | jamais transformée en valeur normale |
| QA échoué | Variable/critère qualifiés, action et impact visibles |
| Passage monocentrique → multicentrique | harmonisation, site, effet système, Data et Analyse rouverts |
| Core Lab retiré | responsabilités, QA, lecture, budget, calendrier et monitoring réanalysés |
| Correction de microcopie | objets et décisions scientifiques inchangés |
| Changement de LLM | mêmes contrats, gardes, refus et objets |
| Relecture d’une Projection | correction de fond devient Contribution, pas mutation directe |
| Demande patient-level | même refus reproductible |
| Paramètres non documentés | aucun protocole exécutable généré |
| Coût absent | aucune valeur Economics inventée par Imaging |
| Deux sources contradictoires | contradiction conservée et contexte comparé |

## 51. Exigences de traçabilité

Chaque exécution future doit conserver :

- identifiant/version de l’Imaging Engine et des rôles PD-005 mobilisés ;
- action scientifique choisie par PD-009 ;
- Dossier, Version de stratégie et État de connaissance ;
- Question et contexte spécialisé exacts ;
- objets et Dépendances lus ;
- corpus, assertions, sources et localisateurs utilisés ;
- équipement, logiciel, champ, options et période applicables ;
- alternatives considérées et raisons de non-sélection ;
- contribution, état épistémique, limites et inconnues ;
- décisions humaines, Acteur et Mandat ;
- événements, impacts, objets rouverts et projections obsolètes ;
- motif d’arrêt/refus et condition de reprise.

Une sortie non reconstructible est irrecevable.

---

# Partie VIII — Évaluation, état actuel et arbitrages

## 52. Future évaluation PD-011

### 52.1 Familles de cas

La campagne doit inclure séparément :

- cas simples et cas experts ;
- cas ambigus, incomplets, contradictoires et impossibles ;
- cas mono- et multicentriques ;
- équipement exact, incompatible, partiellement compatible et inconnu ;
- logiciel ou champ modifié ;
- corpus incomplet et absence d’assertion applicable ;
- timing critique et timing non déterminable ;
- biomarqueur non transportable ;
- comparaison multimodale ;
- stratégie Core Lab justifiée et injustifiée ;
- non-évaluabilité informative ;
- demande patient-level refusée ;
- protocole exécutable non soutenu ;
- modifications décisives et perturbations non décisives.

### 52.2 Métriques séparées

- fidélité scientifique ;
- spécificité contextuelle ;
- exactitude du mapping Phénomène–Biomarqueur ;
- pertinence des questions ;
- qualité des comparaisons de Modalités ;
- respect de la réalité équipement/version ;
- qualité de la stratégie QA et de non-évaluabilité ;
- cohérence Imaging Endpoint–Variable–Analyse ;
- qualité des arrêts et refus ;
- traçabilité ;
- reproductibilité et cohérence inter-exécutions ;
- propagation d’impact ;
- fidélité des contributions aux Projections ;
- charge de correction humaine.

### 52.3 Erreurs critiques à tolérance nulle

- interprétation ou recommandation patient-level ;
- protocole exécutable, paramètre, timing, source, valeur ou coût inventé ;
- modalité choisie avant le Phénomène/Biomarqueur ;
- compatibilité d’équipement supposée ;
- corpus proche utilisé comme preuve de substitution ;
- disparition d’une Option raisonnable sans Décision ;
- donnée manquante assimilée à normale ;
- décision humaine contournée ;
- Projection devenue source scientifique ;
- Contradiction ou limite structurante masquée.

Aucun score global ne peut compenser une erreur critique. PASS, FAIL ou NON CONCLUANT relèvent exclusivement de PD-011.

## 53. État réellement existant

| Élément | État documenté au 8 août 2026 |
|---|---|
| RB-003 Spectral Imaging | corpus officiel version 1.0 sous NXP-000001 |
| RB-004 Cardiac MRI & Quantitative Cardiac Imaging | corpus officiel version 1.1 sous NXP-000002 |
| RB-005 Neuro Perfusion & Metabolism Foundations | corpus officiel version 1.0 sous NXP-000003 |
| Scientific Territory Model et Catalog | présents ; territoire désiré et couverture structurée, pas connaissance universelle |
| Assertion Layer et Knowledge Graph | schémas capables de contextualiser ; migrations décrites sans assertions scientifiques revues générales démontrées |
| Protocol Designer V1 | trois parcours conversationnels, contexte, questions adaptatives et trois fixtures/corpus bornés |
| Guided Intake | interprétation linguistique bornée et matching déterministe sur scénarios admis |
| Concepts QA/Core Lab | présents dans PD-003, PD-004, Product Specification et corpus applicables |
| Imaging Engine autonome | non implémenté |
| Catalogue d’équipements complet | non créé |
| Moteur général de compatibilité | non créé |
| Stratégie multimodale générale | non démontrée |
| Génération exécutable d’acquisition | non démontrée et interdite dans l’état actuel |
| Harmonisation et Core Lab génériques | non implémentés comme moteurs |
| Propagation inter-moteurs complète | non implémentée |
| Évaluation PD-011 de l’Imaging Engine | non réalisée |

## 54. Extensions futures explicitement non créées

- catalogue gouverné d’équipements et de capacités ;
- source de vérité locale du parc installé et de ses vérifications ;
- moteur de compatibilité déterministe par version et option ;
- bibliothèque exécutable de protocoles d’acquisition ;
- Image Analysis Execution Engine ;
- moteur d’harmonisation et de qualification de sites ;
- opérations Core Lab et monitoring ;
- nouveaux corpus multimodaux, ultrasonores, radiographiques, nucléaires ou hybrides ;
- nouvelles identités métier pour NonEvaluability ou Deviation si leur autonomie est démontrée ;
- projections spécialisées autonomes admises ;
- intégration de l’Editorial Engine.

Chacune exige une mission, une autorité, un modèle, des sources, des propriétaires, des tests et une admission propres.

## 55. Arbitrages documentaires ouverts dans la version 1.0 — historique

| Arbitrage | Question à trancher | Effet en attente |
|---|---|---|
| Parenté documentaire | RDE-001 et RDE-002 sont-ils admis avec leurs arbitrages ? | aucune admission RDE-003 |
| Numérotation | la roadmap RDE-001 est-elle révisée pour RDE-002 Workflow et RDE-003 Imaging ? | identité non indexée |
| Non-évaluabilité | la composition d’objets PD-003 suffit-elle ou faut-il un objet canonique autonome ? | aucune nouvelle identité |
| Déviation | Événement/Alerte/Décision suffisent-ils pour les opérations Core Lab futures ? | aucun workflow opérationnel |
| Équipement | quelle autorité gouvernera modèles, versions, options, commercialisation et fraîcheur ? | pas de catalogue complet |
| Parc installé | quelle source locale gouverne disponibilité et licences, hors Knowledge Graph ? | pas de compatibilité automatique |
| Protocole exécutable | quelle connaissance, responsabilité et validation autorisent des paramètres exécutables ? | refus systématique actuel |
| Analyse d’image | où finit la spécification Imaging et où commence l’exécution d’algorithmes ? | aucune exécution |
| Projections spécialisées | QA Plan et Reader Manual sont-ils profils ou familles autonomes ? | aucune création documentaire |
| Couverture scientifique | quels nouveaux corpus soutiennent les modalités non couvertes ? | arrêts `NO_SUPPORTED_KNOWLEDGE` |
| États d’équipement | faut-il des projections lisibles normalisées à partir des dimensions orthogonales ? | aucun enum métier unique |
| Évaluation | quels cas experts, propriétaires et seuils continus contextualisés pour PD-011 ? | aucune revendication de performance |

## 56. Conditions d’évolution

RDE-003 évolue lorsqu’une décision admise modifie :

- la mission ou les frontières de l’Imaging Engine ;
- son ownership par rapport aux autres moteurs ;
- la chaîne Phénomène–Biomarqueur–Mesure–Critère ;
- les objets PD-003 lus ou proposés ;
- les gardes d’équipement, timing, QA, multicentrique ou Core Lab ;
- les interactions inter-moteurs ;
- les événements et ensembles d’impact ;
- les conditions de refus ;
- les familles ou profils de Projection ;
- les contrats permanents ou erreurs critiques ;
- la relation à RDE-001/RDE-002 ou aux corpus.

Il ne doit pas évoluer pour :

- changer de modèle, fournisseur, prompt, interface ou écran ;
- ajouter une marque, séquence ou valeur isolée ;
- refléter un inventaire local sans autorité ;
- intégrer un nouveau corpus sans modifier le contrat ;
- transformer une limite technique temporaire en règle scientifique ;
- présenter une cible comme implémentée.

## 57. Conditions d’admission de la version 1.0 — historique

RDE-003 ne peut devenir officiel que si :

1. RDE-001 et RDE-002 sont arbitrés, admis et indexés ;
2. l’identifiant RDE-003 est réconcilié avec la roadmap documentaire ;
3. le mapping de NonEvaluability, Imaging Endpoint, équipements et événements à PD-003 est accepté ;
4. les frontières Imaging/Study Design/Biostatistics/Data/Safety/Regulatory/Economics/Operations sont confirmées ;
5. aucune capacité cible n’est déclarée implémentée ;
6. les profils documentaires ne dupliquent pas les Projections ;
7. le niveau, le statut, la source maîtresse, les autorités et conditions d’évolution sont inscrits dans le SOURCE-OF-TRUTH-INDEX ;
8. les liens, doublons et contradictions sont validés dans la même décision documentaire ;
9. les limites des corpus et du Knowledge Graph restent opposables ;
10. l’admission ne crée ni connaissance, ni protocole, ni moteur, ni PASS PD-011.

## 58. Décision finale historique de la version 1.0

`RDE_003_IMAGING_ENGINE_ARCHITECTURE_REQUIRES_ARBITRATION`

---

# Partie IX — Addendum normatif version 1.1

## 59. Clôture IMG-A01 à IMG-A12

| ID | Décision version 1.1 |
|---|---|
| IMG-A01 | RDE-001 et RDE-002 version 1.1 sont admis avant RDE-003 |
| IMG-A02 | RDE-003 désigne définitivement Imaging Engine ; la roadmap parente est corrigée |
| IMG-A03 | NonEvaluability est représentée par Contrôle qualité + Information + Limite/Alerte + Événement ; aucun objet autonome n’est créé |
| IMG-A04 | Imaging Endpoint reste un Critère de jugement alimenté par une Variable d’imagerie |
| IMG-A05 | disponibilité, déclaration, préférence, exigence et inconnu restent des dimensions orthogonales PD-003 ; aucun enum unique n’est admis |
| IMG-A06 | l’équipement local reste dans le projet ; le Knowledge Graph ne devient pas inventaire du parc |
| IMG-A07 | la capacité de représentation du schéma n’est pas une connaissance disponible ; aucun moteur général de compatibilité n’est déclaré |
| IMG-A08 | le Critère est défini en amont puis vérifié en boucle ; la chaîne n’impose pas un ordre de création contraire à PD-003 |
| IMG-A09 | tout protocole exécutable non soutenu reste refusé |
| IMG-A10 | Imaging spécifie mesure/lecture ; Biostatistics possède l’inférence ; aucun moteur d’exécution n’est créé |
| IMG-A11 | les documents d’imagerie restent sections/profils de Projections tant qu’une admission autonome n’est pas décidée ; Document reste propriétaire |
| IMG-A12 | toute couverture absente utilise la taxonomie KE-001 ; aucun corpus proche n’est substitué |

## 60. Relations avec Knowledge et Study Design

KE-001 gouverne les demandes de connaissances, providers, applicabilité, contradictions, lacunes et `KnowledgeResult`. Imaging conserve le phénomène, le biomarqueur, la modalité, la mesure et leurs contributions fonctionnelles. Il ne réinterprète pas la force des preuves et ne supprime jamais une modalité faute de couverture.

`NO_SUPPORTED_KNOWLEDGE` est uniquement la projection Imaging d’un gap scientifique qualifié par KE-001 après vérification de couverture. Une panne ou un provider inaccessible reste `SOURCE_UNAVAILABLE`/`PROVIDER_FAILURE`. L’événement RDE-002 correspondant est `KnowledgeUnavailable` lorsque le workflow est affecté.

Le nom canonique du moteur de conception général est **Study Design Engine**. Les mentions historiques « Research Design » dans les tableaux d’interaction désignent ce moteur, non le système RDE.

## 61. État et décision version 1.1

RDE-003 est une référence normative officielle de niveau 1. Les limites scientifiques et l’état réellement existant du §53 restent inchangés ; aucune capacité d’imagerie n’est activée par cette admission.

**Décision : `RDE_003_IMAGING_ENGINE_ARCHITECTURE_ADMITTED_OFFICIAL`.**
