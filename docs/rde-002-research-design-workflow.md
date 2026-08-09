# RDE-002 — Research Design Engine

## Workflow, Orchestration & Decision Pipeline

| Champ | Valeur |
|---|---|
| Identifiant documentaire | RDE-002 |
| Famille documentaire | RDE — Research Design Engine |
| Version | 1.1 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE` |
| Niveau documentaire | `NIVEAU_1 — architecture normative spécialisée` |
| Source maîtresse | `docs/rde-002-research-design-workflow.md` |
| Éditions dérivées | aucune |
| Date d’état | 9 août 2026 |
| Domaine de responsabilité | fonctionnement dynamique, orchestration, transitions, décisions, reconstruction et générabilité des projections du Research Design Engine |
| Autorités supérieures | Charte fondatrice, Scientific Product Manifesto, Product Specification, références normatives spécialisées applicables et RDE-001 version 1.1 |
| État d’admission | admis atomiquement par le SOURCE-OF-TRUTH-INDEX version 1.25 |
| État d’implémentation | architecture cible ; aucun workflow RDE complet n’est démontré |
| Principe directeur | une action scientifique recevable à la fois, sur un projet partagé, avec impacts explicites et décisions humaines conservées |

> Historique conservé : la version 1.0 du 8 août 2026 restait candidate tant que RDE-001 et la collision d’identifiant n’étaient pas arbitrés. La version 1.1 est admise après RDE-001 v1.1, dans l’opération atomique KE-001. Cette admission ne démontre aucune machine d’état implémentée.

---

## 0. Décision documentaire et règle de lecture

### 0.1 Nature exacte de la mission

La mission définit le fonctionnement dynamique cible du Research Design Engine :

- comment une demande est qualifiée, comprise, reformulée et structurée ;
- comment le contexte admissible devient l’état partagé d’un projet ;
- comment l’action scientifique suivante est sélectionnée ;
- quand une capacité fonctionnelle est mobilisée ;
- quand une question adaptative est justifiée ;
- quand une décision humaine devient obligatoire ;
- comment un changement est analysé et propagé ;
- quand une projection devient générable ;
- quand le système poursuit, suspend, escalade ou refuse.

La mission ne crée :

- aucun moteur ;
- aucun objet métier ;
- aucun état canonique supplémentaire ;
- aucune architecture concurrente de RDE-001 ;
- aucun écran, frontend, composant, stockage, interface ou appel LLM ;
- aucun protocole clinique, paramètre d’acquisition, recommandation ou connaissance scientifique ;
- aucune preuve d’implémentation, d’évaluation PD-011, d’activation ou de publication.

RDE-002 orchestre des responsabilités déjà définies. Il ne les absorbe pas.

### 0.2 Ordre de consultation appliqué

La consultation a commencé par `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis a suivi l’ordre imposé :

1. Charte fondatrice ;
2. Scientific Product Manifesto ;
3. Product Specification ;
4. PD-003 — Research Object Model ;
5. PD-004 — UX Manifesto ;
6. PD-005 — Prompt Library Architecture ;
7. PD-009 — Decision Engine Architecture ;
8. PD-011 — Evaluation Framework ;
9. PD-012 — Scientific Program Architecture ;
10. PD-013 — Scientific Program Registry ;
11. P17 — consolidation des Scientific Programs et Reasoning Books ;
12. P-WEB-01 ;
13. P-WEB-02, plan de validation et rapport d’implémentation ;
14. P-WEB-03 et son addendum P-WEB-03C ;
15. P-WEB-04R ;
16. P-WEB-05 ;
17. P-WEB-06 ;
18. P-WEB-06C ;
19. RDE-001 — Research Design Engine Architecture.

### 0.3 Distinction obligatoire des plans de vérité

| Plan | Contenu applicable | Portée dans RDE-002 |
|---|---|---|
| Architecture | projet partagé, Domain Gate, Intent Orchestrator, moteurs fonctionnels, projections et frontières définis par RDE-001 | Structure consommée ; aucune modification |
| Workflow | états, événements, gardes, transitions, questions, décisions, impacts et générabilité | Objet propre de RDE-002 |
| Implémentation | trois parcours V1, contexte local, questions adaptatives, Knowledge Explorer, modification majeure et rapport à 42 sections constatés par P-WEB-06C | État borné ; ne démontre pas le workflow cible complet |
| Hypothèses | macro-états RDE, enveloppe `ScientificIntent`, disponibilité future des moteurs spécialisés et projections étendues | Cibles à arbitrer et évaluer |
| Décisions | décisions humaines PD-003, règles de navigation PD-009 et décisions documentaires d’admission | Autorités distinctes ; aucune décision implicite |

### 0.4 Autorités spécialisées non absorbées

- PD-003 reste l’unique autorité sur les objets, relations, cycles de vie, événements, décisions et projections canoniques.
- PD-004 reste l’autorité sur la forme vécue du questionnement, la progressive disclosure, le retour et la visibilité des limites.
- PD-005 reste l’autorité sur les rôles IA et leur activation ; RDE-002 ne décrit aucun prompt.
- PD-009 reste l’autorité sur la prochaine action scientifique, la valeur de l’information, les impacts, les arrêts et les refus.
- PD-011 reste l’unique autorité sur l’évaluation scientifique, PASS, FAIL, non-régression et publication d’une version.
- PD-012 et PD-013 restent les autorités sur l’architecture et l’état des Scientific Programs.
- RDE-001 version 1.1 gouverne les frontières du système RDE, le Research Project, les moteurs et les familles de projections.
- RDE-002 ne gouverne que leur fonctionnement dynamique coordonné.

### 0.5 Contradictions et arbitrages de la version 1.0 — historique

| ID | Tension documentaire | Qualification | Traitement retenu |
|---|---|---|---|
| W01 | RDE-002 est demandé comme référence officielle alors que RDE-001 est candidat, non indexé et requiert arbitrage | Dépendance normative bloquante | RDE-002 reste candidat ; aucune admission officielle n’est déclarée |
| W02 | Le SOURCE-OF-TRUTH-INDEX exige une mise à jour atomique pour tout nouveau niveau 1, mais l’admission de l’autorité parente n’est pas autorisée ni arbitrée | Gouvernance d’admission incomplète | Index inchangé ; admission suspendue |
| W03 | RDE-001 mentionne prospectivement « RDE-002 — Imaging Engine », tandis que le mandat courant attribue RDE-002 au workflow | Collision de roadmap, non réservation | Le mandat courant nomme le candidat ; la roadmap RDE-001 se déclare non réservante, mais devra être réconciliée avant admission |
| W04 | Le mandat emploie `DESIGN`, RDE-001 emploie `STUDY_DESIGN` | Alias de macro-état | `STUDY_DESIGN` reste le libellé RDE-001 ; `DESIGN` est seulement l’alias du mandat |
| W05 | Les macro-états RDE diffèrent des cycles du Dossier, de la Stratégie et des Projections dans PD-003 | Deux niveaux de lecture | Les macro-états restent des vues calculées ; les cycles PD-003 sont canoniques |
| W06 | La chaîne générale suggère une exécution linéaire de tous les moteurs | Risque d’orchestration systématique | La chaîne est un corridor de référence ; seuls les moteurs nécessaires à l’action PD-009 sont mobilisés |
| W07 | L’exemple `Protocol → CRF → SAP → Budget → Publication` peut faire d’une projection la source d’une autre | Contradiction avec PD-003 et RDE-001 | Toutes les projections dérivent d’une Version de stratégie commune ; les flèches expriment seulement des dépendances de contenu ou de disponibilité |
| W08 | Les événements nommés en anglais pourraient devenir de nouveaux objets métier | Risque de seconde ontologie | Ils sont des types de trace ou des occurrences des cycles PD-003 ; tout changement durable utilise l’Événement d’évolution canonique |
| W09 | `ACTIVE_STUDY` et `COMPLETED_STUDY` supposent des capacités opérationnelles absentes de la V1 | Cible contre état courant | Transitions définies mais non déclarées implémentées ; preuves externes et acteurs responsables obligatoires |

---

# Partie I — Contrat dynamique général

## 1. Définition du workflow RDE

Le workflow RDE est l’ensemble reconstructible des gardes, actions, transitions, événements, décisions et analyses d’impact qui font évoluer les objets PD-003 d’un même Dossier de recherche.

Il ne possède pas de vérité indépendante. À tout instant, son état est une vue calculée à partir :

- de la Version de stratégie active ;
- de l’État de connaissance effectif ;
- des objets, relations et cycles de vie PD-003 ;
- des Contributions et Informations de projet ;
- des Décisions et Mandats décisionnels ;
- des Incertitudes, Contradictions, Risques, Biais, Limites et Alertes ;
- des Besoins d’information et Échanges adaptatifs ;
- des Événements d’évolution et Analyses d’impact ;
- de l’usage et du Profil de projection recherchés ;
- des capacités réellement disponibles.

## 2. Unité de progression

L’unité de progression est une **action scientifique principale recevable** sélectionnée selon PD-009. Une action peut :

1. clarifier une information ;
2. construire ou réviser un objet ;
3. comparer des Options ;
4. demander une connaissance applicable ;
5. déclencher une Revue méthodologique ;
6. demander une Décision humaine ;
7. produire une Projection provisoire ;
8. suspendre, escalader ou refuser.

L’orchestration choisit la capacité qui exécute l’action. Elle ne choisit ni la prochaine décision scientifique, ni son contenu.

## 3. Enveloppe obligatoire d’une transition

Toute transition doit conserver :

| Élément | Exigence |
|---|---|
| Déclencheur | objet, Contribution, réponse, Décision, Revue, connaissance ou événement identifié |
| État de départ | Dossier, Version de stratégie, État de connaissance et objets actifs |
| Garde | préconditions, invariants et limites de responsabilité appliqués |
| Actions candidates | actions recevables, différées ou rejetées |
| Action retenue | raison explicite, sans score opaque |
| Responsable | moteur fonctionnel, acteur, source ou instance de revue |
| Sortie | contribution structurée ou objet canonique proposé |
| Décision | adoption humaine requise ou non, avec Mandat si elle engage la stratégie |
| Impact | objets à conserver, revoir, rouvrir, remplacer ou rendre obsolètes |
| Reprise | condition de progression, de retour, de suspension ou de clôture |
| Trace | provenance, date, version, justification et résultat observé |

Une transition sans garde, sans responsable ou sans trace est irrecevable.

## 4. Boucle décisionnelle de référence

Chaque cycle suit cet ordre logique :

1. ancrer le Dossier et sa version active ;
2. vérifier domaine, responsabilité et capacité ;
3. sélectionner le sous-graphe de dépendances pertinent ;
4. contrôler les invariants applicables ;
5. identifier les Décisions ouvertes ;
6. privilégier les actions non interrogatives déjà possibles ;
7. construire les Besoins d’information justifiés ;
8. sélectionner une action principale selon la valeur de l’information de PD-009 ;
9. mobiliser le moteur fonctionnel minimal nécessaire ;
10. qualifier sa sortie comme Contribution, Recommandation, Information, Revue ou autre objet approprié ;
11. obtenir toute Décision humaine requise ;
12. propager les impacts ;
13. créer une nouvelle Version de stratégie si un état adopté doit être figé ;
14. réévaluer l’action suivante, la générabilité d’une Projection ou une condition d’arrêt.

Cette boucle peut revenir en amont. Elle ne réinitialise jamais silencieusement le projet.

## 5. Conditions générales de poursuite

Le système peut continuer sans nouvelle décision humaine lorsque :

- l’action exécute une décision déjà active dans son périmètre ;
- elle structure une information explicitement fournie sans en changer le sens ;
- elle applique une règle méthodologique admise dans son Domaine de validité ;
- elle calcule ou expose une dépendance sans arbitrer entre Options ;
- elle prépare une Contribution, une comparaison ou une Revue qui sera ensuite soumise ;
- elle génère une Projection provisoire autorisée depuis une version identifiée ;
- aucune condition d’arrêt ou de refus n’est satisfaite.

Le système ne peut pas continuer comme si la stratégie était adoptée lorsqu’une Décision structurante reste ouverte.

---

# Partie II — De la demande au Research Project

## 6. Corridor général de référence

Le corridor complet est :

**Utilisateur → Domain Gate → Intent Orchestrator → `ScientificIntent` → Research Project → Knowledge Engine → Scientific Thinking Engine → Study Design Engine → moteurs spécialisés → Document Engine → Projections.**

Ce corridor décrit l’ordre maximal des responsabilités. Il n’impose pas le passage par tous les moteurs :

- `UNDERSTAND` peut s’arrêter après Knowledge ;
- `FORMALIZE_IDEA` mobilise surtout Knowledge et Scientific Thinking ;
- `DESIGN_STUDY` mobilise le Study Design Engine puis les spécialistes nécessaires ;
- `GENERATE_DOCUMENT` ne mobilise Document qu’après vérification de la version, du profil et des préconditions ;
- `OPERATE_STUDY` reste indisponible tant que les capacités et responsabilités opérationnelles ne sont pas admises.

## 7. Transition 1 — Utilisateur vers Domain Gate

- **Entrée :** demande originale, contexte explicitement fourni et objectif apparent.
- **Action :** conserver le verbatim comme Situation de recherche potentielle, sans le corriger ni l’enrichir scientifiquement.
- **Sortie :** demande qualifiable, éléments sensibles signalés et périmètre d’action demandé.
- **Garde :** aucune réponse scientifique n’est produite avant la qualification.
- **Blocage :** demande illégitime, décision clinique individuelle, action dangereuse, confidentialité non maîtrisable ou responsabilité absente.

La demande originale est figée comme origine. Toute reformulation ultérieure reste reliée à ce verbatim.

## 8. Transition 2 — Domain Gate vers Intent Orchestrator

Le Domain Gate produit l’une des qualifications de RDE-001 :

| Qualification | Conséquence workflow |
|---|---|
| `IN_SCOPE` | transmission de la demande et de ses limites à l’Intent Orchestrator |
| `BORDERLINE` | clarification de portée, réduction du résultat attendu ou escalade humaine |
| `OUT_OF_SCOPE` | refus explicite ; conservation de la part admissible du contexte et des conditions de reprise |

Le Domain Gate ne juge ni la vérité scientifique, ni la qualité de la question. Il vérifie seulement domaine, responsabilité, sécurité, confidentialité et disponibilité réelle.

## 9. Transition 3 — Intent Orchestrator vers `ScientificIntent`

L’Intent Orchestrator :

- distingue l’action recherchée du contenu scientifique ;
- conserve les termes spécialisés et leurs relations explicitement exprimées ;
- propose une intention principale et d’éventuelles intentions secondaires ;
- signale ambiguïtés et contradictions de routage ;
- déclare la surface disponible proposée et sa justification ;
- demande confirmation si deux intentions conduisent à des parcours différents.

`ScientificIntent` est l’enveloppe conversationnelle non canonique de RDE-001. Elle ne remplace pas l’Intention scientifique de PD-003.

**Sorties possibles :** `UNDERSTAND`, `COMPARE`, `FORMALIZE_IDEA`, `DESIGN_STUDY`, `GENERATE_DOCUMENT`, `OPERATE_STUDY`, `ANALYZE_RESULTS`, `INTERPRET_DOCUMENT`, `ROUTING_REQUIRES_CLARIFICATION` ou `ENGINE_UNAVAILABLE`.

## 10. Transition 4 — `ScientificIntent` vers Research Project

Une demande devient un Research Project uniquement si un travail de projet doit être créé ou repris et si l’utilisateur confirme la finalité correspondante.

La transition :

1. identifie ou initie le Dossier de recherche PD-003 ;
2. conserve la Situation de recherche originale ;
3. crée ou révise l’Intention scientifique canonique ;
4. rattache le Contexte du projet déjà explicite ;
5. qualifie connu, supposé, inconnu, non applicable et contradictoire ;
6. identifie acteurs et Mandats nécessaires ;
7. ouvre les premiers Besoins d’information ;
8. conserve la destination conversationnelle comme information de routage, sans la transformer en vérité scientifique.

Un parcours de compréhension peut rester sans Dossier durable. La création automatique d’un projet à partir de toute question serait une extension non autorisée.

## 11. Transition 5 — Research Project vers Knowledge Engine

Knowledge est mobilisé lorsqu’une action ou une Décision dépend d’une connaissance contextualisée qui n’est pas déjà présente et applicable dans l’État de connaissance effectif.

- **Préconditions :** question ou besoin identifié, contexte minimal, domaine applicable, corpus ou source gouvernée disponible.
- **Sorties :** connaissances applicables référencées, preuves, limites, controverses, lacunes ou impossibilité de conclure.
- **Fin :** le besoin de connaissance est satisfait, réduit, laissé ouvert ou déclaré hors domaine.
- **Refus :** source absente, Domaine de validité incompatible, demande de certitude supérieure aux preuves ou tentative de création silencieuse de connaissance.

La sortie de Knowledge devient une Contribution reliée à sa provenance. Elle ne modifie l’État de connaissance effectif qu’après la gouvernance applicable.

## 12. Transition 6 — Knowledge vers Scientific Thinking

Scientific Thinking est mobilisé lorsque la demande doit être transformée en Question, Objectifs, Hypothèses, mécanismes ou alternatives scientifiques.

- **Préconditions :** intention suffisamment comprise, connaissances et lacunes visibles, contexte minimal.
- **Sorties :** Question candidate, Objectifs candidats, Hypothèses concurrentes, mécanismes, inconnues et conditions de réfutabilité.
- **Décision humaine :** confirmation de la Question, hiérarchie des Objectifs et adoption des Hypothèses structurantes.
- **Retour :** vers Knowledge si un mécanisme, un construit ou une controverse exige un appui supplémentaire.
- **Arrêt :** question non scientifique, hypothèse non réfutable, domaine insuffisant ou demande d’adoption automatique.

## 13. Transition 7 — Scientific Thinking vers Study Design

Le Study Design Engine est mobilisé après confirmation humaine d’une Question suffisamment explicite et lorsqu’une stratégie d’étude est recherchée.

Elle organise :

- Population et Plan d’étude ;
- groupes, visites et temporalité ;
- Critères de jugement et Variables ;
- besoins de mesure, d’analyse, de qualité et de données ;
- Options, Compromis, Risques, Limites et Décisions ouvertes.

Elle ne choisit pas à la place des moteurs spécialisés. Si une décision relève d’Imaging, Biostatistics, Data Management, Regulatory, Economics, Safety ou Clinical Operations, elle crée la dépendance et demande la contribution correspondante.

## 14. Transition 8 — Study Design vers moteurs spécialisés

| Moteur | Déclencheur d’usage | Préconditions minimales | Sortie de workflow | Condition d’arrêt ou d’escalade |
|---|---|---|---|---|
| Imaging | une mesure ou acquisition d’imagerie sert un Objectif, une Hypothèse ou un Critère | phénomène, biomarqueur ou besoin de mesure, population et contraintes pertinentes | Options de Modalités, Acquisitions, qualité, lecture, harmonisation et limites | chaîne de justification absente, sécurité ou faisabilité non instruite |
| Biostatistics | une décision porte sur Critère, Analyse ou Dimensionnement | objectifs, hypothèses, population, plan, variables attendues et hypothèses quantitatives explicites | Analyses, stratégie de dimensionnement, sensibilités et inconnues | valeur ou distribution inventée, estimabilité impossible, décision statistique engageante sans humain |
| Data Management | des données, visites, variables ou analyses sont prévues | sources, variables, temporalité et responsabilités identifiables | structure conceptuelle de données, qualité, CRF et dictionnaire candidats | provenance, responsabilité ou source de donnée inconnue |
| Regulatory | une juridiction, une soumission ou une exigence réglementaire est en jeu | territoire, usage, population, intervention et qualification humaine | exigences, gaps, dossier candidat et escalade | juridiction inconnue, avis juridique demandé, référentiel non actuel |
| Economics | ressources, coûts, financement ou faisabilité économique sont demandés | plan, sites, calendrier, ressources et hypothèses nommées | scénarios, sensibilités et inconnues de coût | prix ou ressource sans source, précision artificielle |
| Safety | une intervention, exposition, procédure ou population peut créer un risque | contexte, population, procédure et responsabilité | Risques, mesures proposées, gaps et besoin de revue | risque dépassant le mandat, urgence ou responsabilité clinique |
| Clinical Operations | une étude existante doit être coordonnée méthodologiquement | version applicable, étude activée, acteurs, mandats et capacité réellement disponible | calendrier opérationnel, déviations, monitoring et impacts | capacité non admise, absence de système source ou de responsable |

Chaque moteur lit une version identifiée, produit une Contribution et ne modifie pas directement les objets possédés par un autre domaine.

## 15. Transition 9 — Moteurs spécialisés vers Study Design

Le Study Design Engine reçoit les contributions spécialisées et vérifie :

- leur version source ;
- leur périmètre et leur Domaine de validité ;
- leurs dépendances amont et aval ;
- les Options, Compromis et limites conservés ;
- les contradictions interdomaines ;
- les Décisions humaines nécessaires ;
- les impacts sur la cohérence globale.

Une contribution incompatible n’est ni fusionnée ni supprimée. Elle est rejetée, différée, contestée ou transformée en Contradiction avec justification. Une contribution adoptée conduit à la révision des objets PD-003 concernés et, si nécessaire, à une nouvelle Version de stratégie.

## 16. Transition 10 — Study Design vers Document Engine

Document est mobilisé seulement si :

- un usage et un Profil de projection sont identifiés ;
- une Version de stratégie source existe ou un état explicitement incomplet est autorisé ;
- les préconditions propres à la Projection sont évaluées ;
- les Décisions, inconnues, contradictions, limites et réserves à montrer sont identifiées ;
- aucune condition absolue de refus applicable n’est satisfaite.

Document sélectionne, ordonne et reformule. Il ne complète jamais un objet absent, n’invente aucune justification et ne transforme pas une Projection en source du projet.

## 17. Transition 11 — Document Engine vers Projections

La Projection produite conserve :

- identité et version ;
- Version de stratégie et État de connaissance sources ;
- Profil, usage, audience et date ;
- moteurs et Contributions mobilisés ;
- Décisions humaines applicables ;
- sources, limites, inconnues et contradictions ;
- exigences satisfaites, absentes, non applicables ou bloquées ;
- projection antérieure éventuellement remplacée.

La production n’implique ni relecture, ni diffusion, ni soumission, ni approbation. Ces étapes suivent le cycle canonique PD-003 : demandée → produite → relue → diffusée → remplacée ou archivée.

## 18. Transition 12 — Projection vers projet

Une Projection ne modifie jamais directement le Research Project.

Une correction issue de la relecture d’une Projection devient une nouvelle Contribution. Si elle change le fond :

1. elle cible les objets concernés ;
2. elle ouvre un Événement d’évolution ;
3. elle déclenche une Analyse d’impact ;
4. elle est soumise aux responsables habilités ;
5. elle produit éventuellement une nouvelle Version de stratégie ;
6. elle entraîne ensuite une nouvelle Projection.

---

# Partie III — Machine d’état complète

## 19. Statut des macro-états

Les macro-états ci-dessous sont des vues de navigation RDE-001. Ils ne remplacent pas les cycles canoniques du Dossier, de la Stratégie, des Décisions ou des Projections.

| Macro-état RDE | Lecture PD-003 dominante | Ne signifie jamais |
|---|---|---|
| `IDEA` | Dossier initié ou en clarification ; Situation et Intention en construction | idée valide, faisable ou nouvelle |
| `QUESTION` | Question candidate ou confirmée, objectifs encore ouverts | question scientifiquement suffisante par défaut |
| `HYPOTHESIS` | objectifs et Hypothèses en construction ou arbitrage | hypothèses prouvées |
| `STUDY_DESIGN` (`DESIGN`) | Stratégie en construction, revue ou proposition | protocole approuvé |
| `PROTOCOL` | version de stratégie projetable et Projection protocolaire identifiée | autorisation, PASS ou exécution clinique |
| `ACTIVE_STUDY` | étude externe active, version applicable et suivi méthodologique | contrôle opérationnel par NOXIA |
| `COMPLETED_STUDY` | étude externe terminée, résultats et écarts conservables | publication, validité ou succès scientifique |

## 20. État `IDEA`

| Propriété | Contrat |
|---|---|
| Entrée | demande admissible, idée, observation, publication à explorer ou problème méthodologique |
| Préconditions | Domain Gate franchi ou portée réduite ; verbatim conservé |
| Contenu minimal | Situation de recherche, `ScientificIntent` proposé, contexte explicite, inconnues initiales |
| Actions recevables | clarifier l’intention, consulter Knowledge, créer des Besoins d’information, comparer des formulations |
| Événements principaux | `RequestCaptured`, `DomainQualified`, `IntentProposed`, `IntentConfirmed`, `ProjectInitiated` |
| Sortie | Intention scientifique confirmée et Question candidate suffisamment explicite |
| Postconditions | origine intacte, reformulations tracées, finalité confirmée par l’humain |
| Blocages | hors domaine, demande clinique individuelle, aucune finalité scientifique discernable, moteur nécessaire indisponible |
| Transitions | vers `QUESTION`, maintien en clarification, suspension, réduction de portée ou refus |

## 21. État `QUESTION`

| Propriété | Contrat |
|---|---|
| Entrée | Question candidate issue d’une Intention confirmée |
| Préconditions | population ou contexte au niveau nécessaire pour comprendre la portée ; termes spécialisés préservés |
| Contenu minimal | Question, Justification de reformulation, ambiguïtés, informations manquantes et Domaine de validité |
| Actions recevables | reformuler, rechercher des preuves, définir Objectifs, identifier Hypothèses candidates |
| Événements principaux | `QuestionCreated`, `QuestionConfirmed`, `QuestionChanged`, `KnowledgeRequested`, `KnowledgeUnavailable` |
| Sortie | Question engageante confirmée, Objectifs hiérarchisés et Hypothèses candidates reliées |
| Postconditions | Décision humaine sur la Question ; alternatives et formulation d’origine conservées |
| Blocages | question non testable, portée contradictoire, contexte décisif inconnu ou conclusion présupposée |
| Transitions | vers `HYPOTHESIS`, retour vers `IDEA` si la finalité change, suspension ou arrêt honnête |

## 22. État `HYPOTHESIS`

| Propriété | Contrat |
|---|---|
| Entrée | Question confirmée et Objectifs en construction |
| Préconditions | connaissances applicables et lacunes visibles ; mécanismes distingués des faits |
| Contenu minimal | Objectifs, Hypothèses concurrentes, mécanismes, réfutabilité, inconnues et besoins de mesure |
| Actions recevables | comparer les Hypothèses, préciser population, phénomènes, critères et plan conceptuel |
| Événements principaux | `HypothesisProposed`, `HypothesisAccepted`, `HypothesisReopened`, `DecisionRequested`, `DecisionValidated` |
| Sortie | hiérarchie d’Objectifs et Hypothèses structurantes adoptées par un acteur habilité |
| Postconditions | moyens prévus pour examiner chaque Hypothèse ; contradictions non masquées |
| Blocages | hypothèse non réfutable, mécanisme présenté comme preuve, objectif sans lien avec la Question |
| Transitions | vers `STUDY_DESIGN`, retour vers `QUESTION`, suspension ou abandon conservé |

## 23. État `STUDY_DESIGN` (`DESIGN`)

| Propriété | Contrat |
|---|---|
| Entrée | Question, Objectifs et Hypothèses structurantes adoptés |
| Préconditions | contexte et population assez explicites pour comparer des plans ; moteurs nécessaires disponibles |
| Contenu minimal | Population, Plan, groupes, visites, Critères, Variables, mesures, Analyses, qualité, risques et Décisions ouvertes |
| Actions recevables | mobiliser les spécialistes, comparer Options, poser des questions adaptatives, revoir et reconstruire |
| Événements principaux | `PopulationChanged`, `EndpointChanged`, `BiomarkerChanged`, `AcquisitionChanged`, `AnalysisChanged`, `VersionCreated` |
| Sortie | Stratégie cohérente prête pour revue, revue réalisée, Décisions structurantes enregistrées et version figée |
| Postconditions | invariants PD-003 évalués ; impacts, preuves, limites et responsabilités reconstructibles |
| Blocages | critère principal absent, chaîne de mesure rompue, analyse impossible, contradiction ou risque bloquant, Mandat absent |
| Transitions | vers `PROTOCOL`, retour ciblé vers `HYPOTHESIS` ou `QUESTION`, suspension, révision ou refus de projection |

## 24. État `PROTOCOL`

| Propriété | Contrat |
|---|---|
| Entrée | Version de stratégie figée et demande de Projection protocolaire recevable |
| Préconditions | décisions humaines applicables, revue adaptée, profil et usage identifiés, aucune condition absolue de refus |
| Contenu minimal | Projection reliée à sa version, exigences locales, réserves, inconnues, responsabilités et circuit de revue |
| Actions recevables | produire, relire, corriger par Contribution, préparer d’autres Projections, analyser les changements |
| Événements principaux | `ProjectionRequested`, `ProjectionGenerated`, `ProjectionReviewed`, `ProjectionDisseminated`, `ProjectionSuperseded` |
| Sortie | dossier documentaire relu pour son usage ou preuve externe d’activation d’une étude |
| Postconditions | aucune approbation implicite ; toute correction de fond repasse par le projet |
| Blocages | projection trompeuse, juridiction ou responsabilité absente, changement non analysé, demande d’approbation automatique |
| Transitions | maintien/révision, retour vers `STUDY_DESIGN`, vers `ACTIVE_STUDY` sur preuve externe, clôture sans activation |

## 25. État `ACTIVE_STUDY`

| Propriété | Contrat |
|---|---|
| Entrée | preuve externe d’activation, version applicable, acteurs et systèmes de référence identifiés |
| Préconditions | Clinical Operations réellement disponible ; Mandats, calendrier, responsabilités et règles de déviation établis |
| Contenu minimal | version gelée applicable, sites, visites, événements, déviations, risques, décisions et projections opérationnelles |
| Actions recevables | suivre méthodologiquement, recevoir des Contributions, qualifier des déviations, analyser les impacts, versionner si autorisé |
| Événements principaux | `StudyActivated`, `ConstraintChanged`, `RiskChanged`, `ContributionSubmitted`, `ImpactAnalysisCompleted` |
| Sortie | preuve externe de fin d’étude, arrêt ou transition institutionnelle applicable |
| Postconditions | données et événements opérationnels restent sous l’autorité de leurs systèmes sources |
| Blocages | capacité non disponible, absence de source de vérité opérationnelle, urgence clinique ou sécurité hors mandat |
| Transitions | vers `COMPLETED_STUDY`, suspension, révision contrôlée ou retour à une version applicable distincte |

## 26. État `COMPLETED_STUDY`

| Propriété | Contrat |
|---|---|
| Entrée | preuve externe que l’étude est terminée et périmètre de clôture identifié |
| Préconditions | résultats, écarts et statuts proviennent des systèmes et responsables légitimes |
| Contenu minimal | version de référence, données/résultats référencés, déviations, analyses, limites, décisions et historique |
| Actions recevables | analyser, interpréter avec limites, produire des Projections, préparer une publication, rouvrir le projet |
| Événements principaux | `StudyCompleted`, `ProjectionGenerated`, `ProjectClosed`, `ProjectReopened`, `KnowledgeUpdated` |
| Sortie | clôture ou archivage du Dossier, nouvelles questions ou nouvelle Version de stratégie pour un projet dérivé |
| Postconditions | aucune réécriture des décisions ou résultats historiques |
| Blocages | données non traçables, analyses non autorisées, conclusion dépassant les résultats ou publication présentée comme automatique |
| Transitions | clôture, archivage, réouverture explicite ou création d’un projet distinct si la finalité change |

## 27. Matrice des transitions de macro-état

| Source | Destination | Garde obligatoire | Décision humaine | Effet historique |
|---|---|---|---|---|
| `IDEA` | `QUESTION` | Intention comprise, Question candidate explicite | confirmation de la finalité et de la Question engageante | origine et reformulations conservées |
| `QUESTION` | `HYPOTHESIS` | Objectifs reliables, connaissance suffisante pour proposer des Hypothèses | hiérarchie des Objectifs et Hypothèses structurantes | alternatives conservées |
| `HYPOTHESIS` | `STUDY_DESIGN` | Hypothèses examinables et besoins de mesure identifiés | adoption des Hypothèses structurantes | version de cadrage conservée |
| `STUDY_DESIGN` | `PROTOCOL` | stratégie revue, décisions enregistrées, version figée, aucune condition de refus | adoption de la stratégie et gel pour projection | projection liée à la version |
| `PROTOCOL` | `ACTIVE_STUDY` | activation externe démontrée, capacités opérationnelles disponibles | autorité institutionnelle externe et mandats de projet | version applicable conservée |
| `ACTIVE_STUDY` | `COMPLETED_STUDY` | fin externe démontrée, données et responsabilités traçables | confirmation par l’autorité responsable | état final et écarts conservés |
| état aval | état amont | Événement d’évolution et Analyse d’impact | obligatoire si décision structurante rouverte | aucune suppression ; nouvelle version |
| tout état | suspension | information, capacité, décision ou source indisponible | selon la cause | dernier état cohérent conservé |
| tout état | réouverture | motif, périmètre et version de reprise explicites | acteur habilité | état antérieur immuable |

Les sauts `IDEA → PROTOCOL`, `QUESTION → ACTIVE_STUDY` et `Projection → Décision active` sont interdits.

---

# Partie IV — Événements et conséquences

## 28. Nature des événements

Un nom tel que `QuestionCreated` est un type de trace lisible. Il ne constitue pas un nouvel objet métier.

- Si l’occurrence change le contexte, une connaissance utilisée, une décision ou la validité de la stratégie, elle est représentée par un **Événement d’évolution** PD-003.
- Si elle décrit seulement un passage de cycle de vie, elle reste rattachée à l’objet concerné.
- Si elle apporte du contenu, le contenu est une **Contribution**.
- Si elle engage la stratégie, elle est une **Décision** humaine.
- Si elle produit une restitution, elle suit le cycle de **Projection**.

## 29. Enveloppe d’événement

Toute occurrence durable conserve :

- type lisible ;
- origine et auteur ;
- date d’occurrence et date d’effet ;
- Dossier et Version de stratégie concernés ;
- objets directement visés ;
- état avant et après ;
- portée et urgence ;
- besoin éventuel d’Analyse d’impact ;
- Décision ou Mandat requis ;
- conséquences directes, en cascade et conditionnelles ;
- statut de traitement et condition de reprise.

## 30. Catalogue minimal des événements d’entrée et de cadrage

| Événement | Signification | Conséquence obligatoire |
|---|---|---|
| `RequestCaptured` | demande originale reçue | figer le verbatim et lancer Domain Gate |
| `DomainQualified` | domaine qualifié | poursuivre, clarifier, réduire ou refuser selon la qualification |
| `IntentProposed` | intention de routage proposée | conserver ambiguïtés et demander confirmation si le parcours change |
| `IntentConfirmed` | finalité confirmée | créer ou réviser l’Intention scientifique et sélectionner la surface |
| `IntentChanged` | finalité modifiée | révision majeure, Analyse d’impact et possible retour vers `IDEA` |
| `ProjectInitiated` | Dossier de recherche initié | attribuer identité, contexte, acteurs et besoins initiaux |
| `ProjectReopened` | Dossier clos ou suspendu repris | nommer motif, version de départ, périmètre et décisions à réexaminer |

## 31. Catalogue minimal des événements scientifiques et décisionnels

| Événement | Signification | Conséquence obligatoire |
|---|---|---|
| `QuestionCreated` | Question candidate créée | relier à l’Intention et conserver la reformulation source |
| `QuestionConfirmed` | Question engageante adoptée | enregistrer Décision humaine et ouvrir Objectifs/Hypothèses |
| `QuestionChanged` | sens ou portée de la Question modifié | révision majeure et reconstruction des dépendances aval |
| `HypothesisProposed` | Hypothèse candidate soumise | relier à un Objectif, mécanisme, réfutabilité et moyen d’examen |
| `HypothesisAccepted` | Hypothèse structurante adoptée | enregistrer Décision et ouvrir les besoins de design |
| `HypothesisReopened` | Hypothèse active réexaminée | rouvrir Critères, Variables, mesures, Analyses et Justifications touchés |
| `DecisionRequested` | arbitrage mûr pour l’humain | vérifier Options, Compromis, Incertitudes, acteur et Mandat |
| `DecisionValidated` | choix adopté par l’acteur habilité | activer la Décision, propager l’impact et préparer une version |
| `DecisionDeferred` | arbitrage différé | conserver les branches indépendantes et la condition de reprise |
| `DecisionReopened` | Décision active remise en question | conserver l’ancienne, créer une nouvelle Décision ouverte et analyser l’impact |
| `DecisionSuperseded` | nouvelle Décision remplace l’ancienne | relier les deux décisions et ne jamais éditer la décision passée |

`DecisionValidated` signifie décision humaine enregistrée. Il ne signifie ni validation scientifique PD-011, ni approbation réglementaire.

## 32. Catalogue minimal des événements de contribution et de connaissance

| Événement | Signification | Conséquence obligatoire |
|---|---|---|
| `ContributionSubmitted` | contenu proposé par un acteur, moteur ou source | qualifier auteur, cible, provenance et portée |
| `ContributionAccepted` | contenu intégré après traitement applicable | réviser les objets concernés et évaluer l’impact |
| `ContributionRejected` | contribution non intégrée | conserver le contenu original et le motif du rejet |
| `ContributionDeferred` | traitement reporté | conserver responsable, condition de reprise et branches affectées |
| `ContributionContested` | contenu contesté | ouvrir Contradiction, besoin de preuve ou Revue selon le cas |
| `KnowledgeRequested` | connaissance nécessaire à une action | mobiliser Knowledge si corpus applicable |
| `KnowledgeUpdated` | connaissance gouvernée utilisée par le projet a évolué | créer Événement d’évolution, nouvelle Analyse d’impact et jamais réécrire l’historique |
| `KnowledgeUnavailable` | preuve ou domaine insuffisant | réduire la portée, conserver une Limite, escalader ou arrêter |

## 33. Catalogue minimal des événements de changement

| Événement | Objets directement visés | Reconstruction minimale |
|---|---|---|
| `PopulationChanged` | Population, groupes ou éligibilité | Domaine de validité, faisabilité, Critères, Variables, Acquisitions, Analyses, Dimensionnement, risques et projections touchées |
| `EndpointChanged` | Critère de jugement | Variables, temps, acquisitions, Analyses, Dimensionnement, CRF, SAP, Protocol et Justifications touchés |
| `BiomarkerChanged` | Biomarqueur | Modalités, Acquisitions, Conditions, qualité, Variables, Analyses, interprétations et compromis |
| `AcquisitionChanged` | Acquisition, technique ou paramètre critique | Variables, Critères, qualité, harmonisation, Analyses, faisabilité, budget et documents d’imagerie |
| `AnalysisChanged` | Analyse ou hypothèses quantitatives | Variables, Critères, Dimensionnement, données, SAP et limites d’interprétation |
| `ConstraintChanged` | Contrainte de site, calendrier, ressource ou juridiction | Options, faisabilité, risques, calendrier, budget et projections concernées |
| `RiskChanged` | Risque ou mesure de maîtrise | Safety, Regulatory, Operations, données, décisions et projections touchées |
| `ImpactAnalysisCompleted` | scénario de changement | classer conservé, à revoir, invalidé, obsolète ou non affecté démontré |
| `VersionCreated` | état cohérent adopté ou explicitement incomplet | figer objets, relations, décisions, connaissances, inconnues et différences |

## 34. Catalogue minimal des événements de projection et d’étude

| Événement | Signification | Conséquence obligatoire |
|---|---|---|
| `ProjectionRequested` | usage documentaire demandé | identifier Profil, version, préconditions et refus applicables |
| `ProjectionGenerated` | restitution produite | lier aux sources ; état canonique `produite`, jamais `approuvée` |
| `ProjectionReviewed` | revue documentaire réalisée | conserver revue et corrections comme Contributions |
| `ProjectionDisseminated` | diffusion humaine autorisée | conserver audience, mandat et version diffusée |
| `ProjectionSuperseded` | projection devenue non courante | conserver l’ancienne et relier la nouvelle |
| `ProjectionArchived` | projection gelée en historique | interdire sa présentation comme état courant |
| `StudyActivated` | activation externe constatée | vérifier version applicable, systèmes sources, acteurs et capacité Operations |
| `StudyCompleted` | fin externe constatée | figer le statut, préserver écarts et ouvrir analyses/projections autorisées |
| `ProjectClosed` | Dossier clos | conserver décisions, versions, besoins ouverts et condition de réouverture |
| `StopConditionRaised` | poursuite non honnête détectée | suspendre la branche, expliquer motif et condition de reprise |
| `RefusalIssued` | Projection ou action refusée | conserver le travail valide et les exigences manquantes |

---

# Partie V — Graphe de dépendances et reconstruction

## 35. Graphe scientifique canonique

Le cœur de dépendance suit PD-003 :

**Situation de recherche → Intention scientifique → Question scientifique → Objectifs scientifiques → Hypothèses.**

Puis deux chaînes coordonnées :

- **Question + Contexte → Population + Plan d’étude → Groupes + Visites** ;
- **Hypothèses + Phénomènes → Biomarqueurs → Variables → Critères de jugement → Analyses + Règles d’interprétation**.

Les Modalités, Acquisitions, Conditions de mesure et Contrôles qualité relient les Biomarqueurs aux Variables réellement obtenables. Le Dimensionnement dépend des Critères, du Plan, de l’Analyse et d’hypothèses quantitatives explicites.

Après revue et décisions humaines :

**objets + relations + décisions + État de connaissance + incertitudes → Version de stratégie → Profil de projection → Projection.**

## 36. Projections : dépendance commune, jamais chaîne de vérité

`Protocol`, `CRF`, `SAP`, `Budget`, `Publication`, `CPP` et les autres projections ne se possèdent pas entre elles. Elles lisent la même Version de stratégie et peuvent partager des préconditions.

Ainsi :

- le CRF dépend des Variables, visites, sources et règles de qualité, pas du texte du Protocol ;
- le SAP dépend des Objectifs, Hypothèses, Critères, Variables, Plan et Analyses, pas du document CRF ;
- le Budget dépend du plan, des ressources, sites, modalités et hypothèses de coût, pas du document SAP ;
- une Publication dépend du projet, puis de résultats légitimes lorsqu’ils existent, pas du Budget ;
- CPP et ANSM dépendent d’une qualification réglementaire humaine et des pièces applicables, pas d’un simple statut `PROTOCOL`.

Une Projection peut signaler qu’une autre projection manque pour un dossier donné. Elle ne devient jamais sa source scientifique.

## 37. Classes d’impact

Toute Analyse d’impact classe chaque objet ou projection atteint :

| Classe | Signification | Traitement |
|---|---|---|
| Conservé | le changement ne modifie ni sens, ni validité, ni usage | conserver avec justification d’absence d’impact |
| À revoir | une dépendance est atteinte mais la conclusion peut rester recevable | nouvelle revue ciblée |
| Invalidé | le contenu ne peut plus soutenir la décision ou conclusion | rouvrir l’objet et interdire son usage courant |
| Obsolète | une version ou projection reste historique mais n’est plus courante | relier au remplacement futur |
| Nouvellement requis | le changement ouvre un besoin, une décision ou une projection | attribuer responsable et condition de satisfaction |
| Non affecté démontré | aucun chemin de dépendance pertinent | conserver la preuve de non-impact |

## 38. Procédure de reconstruction

1. capturer le changement comme Contribution ou Événement d’évolution ;
2. conserver l’état avant et la version source ;
3. identifier les objets directement modifiés ;
4. parcourir les Dépendances directes, en cascade et conditionnelles ;
5. classer les objets et projections selon la section 37 ;
6. exposer les Décisions à rouvrir et les nouvelles Incertitudes ;
7. expliquer à l’utilisateur ce qui sera reconstruit et ce qui restera valable ;
8. demander confirmation humaine pour toute modification majeure ;
9. mobiliser seulement les moteurs propriétaires des contributions affectées ;
10. soumettre les nouveaux arbitrages ;
11. créer une nouvelle Version de stratégie ;
12. régénérer seulement les Projections obsolètes ou explicitement demandées.

## 39. Changements majeurs minimaux

Sont majeurs au minimum :

- changement d’Intention ou de Question ;
- changement de hiérarchie des Objectifs ou d’Hypothèse structurante ;
- changement de Population ou Plan d’étude ;
- changement du Critère principal ;
- changement de Biomarqueur ou stratégie de mesure ;
- changement rendant une Analyse ou un Dimensionnement inapplicable ;
- changement de juridiction ou de qualification réglementaire ;
- changement d’usage d’une Projection engageante ;
- évolution de connaissance susceptible d’invalider une Justification ou Décision ;
- réouverture d’une Décision humaine structurante.

Le système annonce avant adoption : objets touchés, projections obsolètes, décisions rouvertes, travail conservé, responsables requis et condition de retour à un état cohérent.

---

# Partie VI — Questions adaptatives

## 40. Condition d’apparition

Une question apparaît seulement si un Besoin d’information satisfait toutes les conditions suivantes :

1. ses réponses plausibles conduisent à des conséquences différentes, ou son absence bloque une conclusion importante ;
2. l’effet atteint une Décision, une Incertitude structurante ou une Projection demandée ;
3. l’information n’existe pas déjà sous une forme applicable ;
4. l’utilisateur est une source légitime ;
5. la question n’exige pas un arbitrage avant présentation des Options ;
6. charge, sensibilité et risque sont proportionnés ;
7. « je ne sais pas », report, non-applicabilité et contradiction peuvent être traités honnêtement.

## 41. Priorisation et regroupement

La priorité suit PD-009 :

1. domaine, sécurité, Contradictions critiques et arrêts ;
2. informations bloquant une Décision irréversible ou une Projection valide ;
3. informations discriminant réellement les Options ;
4. à impact comparable, information la plus réductible avec la plus faible charge ;
5. à égalité, ordre logique de Dépendance ;
6. si le classement dépend d’une préférence, Décision humaine.

Une seule question principale est active. Plusieurs informations peuvent être regroupées uniquement si elles forment une unité indissociable pour la même Décision et si la séparation augmente la charge ou crée une incohérence.

## 42. Forme contractuelle d’une question

Chaque Échange adaptatif conserve :

- pourquoi la question est posée ;
- quelle Décision, Incertitude ou Projection elle influence ;
- une formulation non orientée ;
- des suggestions lorsque l’espace est réellement borné ;
- une réponse libre lorsque l’espace reste ouvert ;
- « je ne sais pas », « non applicable » et « différer » ;
- les conséquences prévisibles des réponses ;
- l’auteur, la date, l’interprétation et l’impact observé.

« Question X sur environ N » estime une charge de conversation. Cette indication reste dynamique et ne mesure ni complétude, ni maturité, ni qualité.

## 43. Disparition et inutilité

Une question disparaît de l’action courante lorsqu’elle est :

- satisfaite ;
- rendue non applicable avec justification ;
- différée avec condition de reprise ;
- attachée à une branche fermée ;
- rendue inutile par une Décision ;
- disponible depuis une autre source légitime ;
- sans effet démontré sur les décisions restantes.

Elle reste dans l’historique. Une question déjà répondue n’est reposée que si un Événement d’évolution rend la réponse obsolète ; l’ancienne réponse et son contexte sont alors rappelés.

## 44. Traitement des réponses non nominales

| Réponse | Traitement |
|---|---|
| Inconnue | conserver `inconnu`, évaluer l’impact et chercher une branche compatible |
| Différée | garder le Besoin ouvert et continuer uniquement sur les branches indépendantes |
| Non applicable | exiger la justification contextuelle et fermer seulement les dépendances concernées |
| Contradictoire | conserver les Contributions et ouvrir une Contradiction |
| Contestée | conserver la Contribution et demander preuve, qualification ou Revue |
| Partielle | intégrer la part explicite et maintenir le besoin résiduel |

---

# Partie VII — Conservation, histoire et versionnement

## 45. Contrat de contexte partagé

Le contexte partagé contient au minimum :

- demande originale et reformulations ;
- Situation, Intention, Question, Objectifs et Hypothèses ;
- objets scientifiques et relations applicables ;
- Contexte du projet, Population, Plan, contraintes et ressources ;
- réponses déjà obtenues et informations manquantes ;
- connaissances, preuves, limites et controverses mobilisées ;
- Options, Recommandations et Décisions ;
- inconnues, contradictions, risques, biais et alertes ;
- Contributions, Revues, Événements et Analyses d’impact ;
- Version de stratégie active et versions antérieures ;
- Projections, profils, usages et états ;
- capacités disponibles, refus et conditions de reprise.

Une transition de parcours ou de moteur transfère ce contexte par identité et version. Elle ne le résume pas au point de perdre les objets spécialisés.

## 46. Figé, modifiable, historisé et versionné

| Régime | Éléments | Règle |
|---|---|---|
| Figé | verbatim initial, Contributions originales, Décisions arbitrées, Versions figées, Revues conclues, Projections diffusées, Événements qualifiés | jamais édités ; une correction crée un successeur relié |
| Modifiable par révision | Question active, contexte courant, objets de stratégie en construction, Besoins et priorités | modification tracée ; changement de sens ou portée entraîne révision majeure |
| Historisé | réponses, options rejetées, branches fermées, refus, moteurs indisponibles, analyses d’impact et raisons de non-sélection | jamais supprimé pour simplifier le présent |
| Versionné | Stratégie, État de connaissance effectif, Mandats, Profils et Projections | toute utilisation engageante référence une version exacte |

## 47. Changement de parcours

Comprendre, formaliser, concevoir et piloter sont des surfaces sur le même contexte, pas des projets séparés.

Une transition conserve :

- surface source et destination ;
- raison et intention principale ;
- intentions secondaires ;
- version source ;
- objets transférés et exclus ;
- inconnues, contradictions et décisions ouvertes ;
- différentiel présenté au retour.

Si la transition change la finalité du projet, elle suit la procédure de modification majeure.

---

# Partie VIII — Décisions, arrêts et refus

## 48. Décisions toujours humaines

Conformément à PD-009, un acteur habilité décide toujours :

- la Question scientifique engageante ;
- la hiérarchie des Objectifs ;
- les Hypothèses structurantes ;
- la Population et le Plan d’étude ;
- le Critère principal ;
- l’acceptation d’un Compromis structurant ;
- l’acceptation d’une Incertitude ou d’un Risque résiduel critique ;
- le choix entre Options non dominées ;
- la clôture d’une Contradiction structurante ;
- l’adoption de la Stratégie scientifique ;
- l’adoption d’un Protocole d’imagerie ;
- le gel d’une Version destinée à une Projection engageante ;
- toute soumission, activation, diffusion ou clôture relevant d’une autorité externe.

## 49. Quand le système peut continuer

| Situation | Action autorisée |
|---|---|
| information déjà disponible et applicable | structurer sans question supplémentaire |
| décision humaine active | exécuter dans son périmètre et conserver sa trace |
| contribution spécialisée attendue | mobiliser le moteur compétent |
| plusieurs Options comparables | instruire leurs Compromis sans choisir |
| inconnue non bloquante | continuer les branches indépendantes en la conservant |
| projection provisoire honnête | produire avec réserves et décisions ouvertes |
| changement mineur sans impact démontré | réviser et conserver la preuve de non-impact |

## 50. Quand le système doit demander une décision

Il s’arrête devant l’acteur humain lorsque :

- une préférence, une valeur ou une responsabilité détermine le choix ;
- plusieurs Options non dominées subsistent ;
- un Mandat manque ou se contredit ;
- une Contradiction structurante ne peut être réduite ;
- un Risque résiduel majeur doit être accepté ;
- une Recommandation sensible repose sur des preuves limitées ;
- une modification majeure doit être adoptée ;
- une version ou projection engageante doit être gelée, revue, soumise ou diffusée ;
- une question éthique, réglementaire, juridique, clinique ou institutionnelle dépasse NOXIA.

L’absence de réponse ou d’objection ne vaut jamais Décision.

## 51. Arrêts

| Arrêt | Condition | Sortie obligatoire |
|---|---|---|
| Suffisance pour l’usage | la prochaine étape est humaine ou externe et les incertitudes résiduelles sont compatibles | état atteint, limites, décisions ouvertes et action attendue |
| Impossibilité temporaire | information, source, capacité ou décision différée | dernier état cohérent, responsable et condition de reprise |
| Limite de connaissance ou domaine | preuve ou Domaine de validité insuffisant | Limite, options défendables, données nécessaires et escalade |
| Absence de valeur supplémentaire | aucune question restante ne change le raisonnement | clôture du questionnement, pas du projet |
| Capacité indisponible | moteur requis non implémenté ou non admis | `ENGINE_UNAVAILABLE`, travail conservé et alternative licite éventuelle |

## 52. Refus de continuer ou de projeter

Le refus est obligatoire notamment si :

- le projet est hors domaine ou demande une décision clinique individuelle ;
- Question, Objectifs ou Hypothèses structurantes ne sont pas reliés ;
- Population, Plan ou temps principal restent indéterminés pour l’usage ;
- une chaîne Objectif → mesure → Variable → Critère → Analyse est rompue ;
- une valeur, source, preuve, coût ou paramètre devrait être inventé ;
- une Contradiction ou Alerte bloquante reste non arbitrée ;
- une Incertitude rendrait la conclusion plus forte que les preuves ;
- qualité, analyses, interprétations, risques ou responsabilités critiques sont absents ;
- une modification n’a pas reçu son Analyse d’impact ;
- une Projection prétend à une validation clinique, réglementaire ou institutionnelle ;
- l’utilisateur demande de masquer une limite, une alternative, une provenance ou une décision humaine.

Le refus conserve la raison, les objets concernés, le travail valide, les conclusions impossibles, les éléments nécessaires, l’acteur attendu, la condition de reprise, la version et l’État de connaissance.

---

# Partie IX — Générabilité des projections

## 53. Définition de « générable »

Une Projection est générable lorsque son usage, sa version source et ses exigences minimales permettent de produire honnêtement au moins l’état documentaire demandé.

`Générable` ne signifie jamais : complète, scientifiquement valide, approuvée, soumise, publiée ou exécutable. Les états cibles de RDE-001 (`STRUCTURE_ONLY`, `PARTIALLY_GENERATED`, `READY_FOR_REVIEW`, `READY_FOR_SUBMISSION`) restent à mapper au cycle canonique PD-003 avant implémentation.

## 54. Matrice de générabilité

| Projection RDE-001 | Première générabilité honnête | Prérequis pour contenu substantiel | Décision ou revue requise | Blocages propres |
|---|---|---|---|---|
| Synopsis | `QUESTION` en structure seule | Question, Objectifs, population/plan candidats, limites | confirmation de la Question pour diffusion | résumé qui masquerait les inconnues structurantes |
| Protocol | `STUDY_DESIGN` en structure seule | stratégie revue, décisions, version, mesures, analyses, qualité et risques | adoption humaine de la stratégie et gel | toute condition de refus PD-009 |
| Funding | `HYPOTHESIS` en structure seule | objectifs, plan, ressources, calendrier, scénarios de coût sourcés | revue humaine économique et scientifique | coût ou probabilité de succès inventé |
| CRF | `STUDY_DESIGN` | Variables, sources, visites, unités, qualité et responsabilités | revue Data et responsables du recueil | variable orpheline ou source inconnue |
| Data Dictionary | `STUDY_DESIGN` | Variables, définitions, formats conceptuels, provenance et règles | revue Data et spécialistes sources | unité, valeur ou dérivation implicite |
| SAP | `STUDY_DESIGN` | Objectifs, Hypothèses, Critères, Variables, Plan, Analyses et hypothèses quantitatives | revue statistique humaine | analyse ou valeur nécessaire inventée |
| Budget | `STUDY_DESIGN` en scénarios | plan, sites, visites, modalités, ressources, calendrier et prix sourcés | arbitrage économique humain | fausse précision ou ressources non attribuées |
| Timeline | `STUDY_DESIGN` en dépendances | tâches, visites, contraintes, responsables et événements externes | validation par responsables opérationnels | dates présentées comme engagements sans source |
| Publication | structure possible dès `PROTOCOL` ; contenu de résultats à `COMPLETED_STUDY` | question, méthodes, version ; puis résultats et analyses légitimes | auteurs, revue scientifique et circuit éditorial humains | résultat inventé, publication automatique ou conclusion excessive |
| CPP | `PROTOCOL` en structure de dossier | juridiction, qualification humaine, version et pièces applicables | revue éthique/réglementaire humaine | absence de juridiction, qualification ou pièce critique |
| ANSM | `PROTOCOL` en structure de dossier | qualification réglementaire humaine et pièces applicables | responsable réglementaire humain | conseil juridique ou autorisation implicite |
| Core Lab Manual | `STUDY_DESIGN` en structure | stratégie d’imagerie, qualité, lecture, harmonisation, déviations et responsabilités | revue Core Lab humaine | uniformité non justifiée ou capacité de site inconnue |
| Monitoring Plan | fin de `STUDY_DESIGN` en structure ; opérationnel après activation | risques, données, visites, responsabilités, version et systèmes sources | responsables Operations, Data, Safety et Regulatory | étude/capacité absente ou CTMS implicite |
| Investigator Guide | `PROTOCOL` en structure | version applicable, procédures, responsabilités, qualité, sécurité et déviations | revue institutionnelle et formation humaine | guide présenté comme délégation ou autorisation |

## 55. Dépendances de disponibilité entre projections

Une dépendance de dossier peut exiger plusieurs projections, mais elle ne change pas leur source commune.

- Protocol, SAP, CRF et Data Dictionary doivent être cohérents entre eux parce qu’ils partagent Objectifs, Critères, Variables, Visites et Analyses.
- Budget et Timeline consomment les mêmes ressources, visites, sites et contraintes ; une modification commune les rend simultanément à revoir.
- Core Lab Manual, Investigator Guide et Monitoring Plan consomment la version applicable, les règles de qualité et les responsabilités.
- CPP et ANSM peuvent exiger des pièces issues de plusieurs projections, mais leur complétude documentaire ne crée aucune approbation.
- Publication peut réutiliser une description versionnée du design, mais les résultats proviennent de sources légitimes externes au document Protocol.

## 56. Recalcul après changement

Une Projection est régénérée seulement si :

- sa Version de stratégie source est remplacée ;
- un objet dont elle dépend est classé à revoir ou invalidé ;
- son Profil ou usage change ;
- une correction de fond a été adoptée ;
- une exigence externe applicable évolue ;
- une nouvelle Projection est explicitement demandée.

Une simple modification éditoriale locale ne provoque pas de reconstruction scientifique. Une modification du fond repasse toujours par le projet.

---

# Partie X — Orchestration, traçabilité et non-régression

## 57. Règles d’orchestration

1. Domain Gate précède toute action scientifique.
2. Intent Orchestrator route ; il ne navigue pas dans la stratégie.
3. PD-009 sélectionne l’action scientifique suivante.
4. L’orchestration mobilise le sous-ensemble minimal de moteurs et de rôles PD-005.
5. Un moteur ne lit et ne propose que dans son périmètre.
6. Toute sortie structurante devient Contribution avant intégration.
7. Toute Décision engageante reste humaine.
8. Toute écriture durable utilise un objet PD-003.
9. Tout changement amont reçoit une Analyse d’impact.
10. Document projette une version ; il ne la corrige pas.

## 58. Trace minimale du workflow

Pour chaque action, NOXIA doit pouvoir reconstruire :

- demande et intention sources ;
- Dossier, version et État de connaissance lus ;
- sous-graphe de dépendances sélectionné ;
- règles et invariants appliqués ;
- actions candidates et raison du choix ;
- moteur et rôles mobilisés ;
- entrées réellement utilisées ;
- Contribution ou résultat produit ;
- limites, inconnues et contradictions ;
- acteur, Mandat et Décision éventuelle ;
- impacts directs, en cascade et conditionnels ;
- version ou projection produite ;
- condition d’arrêt ou de reprise.

## 59. Invariants de non-régression

Le workflow ne doit jamais :

1. perdre la demande originale ou le contexte spécialisé ;
2. créer un second Research Project lors d’un changement de parcours ;
3. supprimer, réécrire ou rendre implicite une Décision humaine ;
4. convertir une Contribution en vérité adoptée sans traitement ;
5. créer une connaissance, source, preuve, donnée, valeur, coût ou paramètre ;
6. contourner Domain Gate, PD-009 ou le moteur fonctionnel propriétaire ;
7. mobiliser tous les moteurs par défaut ;
8. court-circuiter une validation humaine ;
9. résoudre une Contradiction par sélection silencieuse ;
10. remplacer `inconnu` par une valeur plausible ;
11. traiter une Projection comme source du fond scientifique ;
12. propager un changement sans Analyse d’impact ;
13. reconstruire une branche dont l’absence d’impact est démontrée ;
14. masquer une Projection obsolète ou la présenter comme courante ;
15. confondre générabilité, complétude, maturité, validation et approbation ;
16. confondre état cible et capacité implémentée ;
17. poursuivre lorsqu’une capacité requise est indisponible ;
18. présenter une revue automatisée comme revue humaine ;
19. produire une décision clinique individuelle ;
20. faire dépendre la stabilité du workflow d’un modèle, d’un fournisseur ou d’une interface.

## 60. Cas minimaux de non-régression

| Cas | Résultat attendu |
|---|---|
| même demande, même état | même ensemble d’actions scientifiques recevables |
| reformulation non décisive | objets et décisions critiques préservés |
| changement de Question | impacts aval annoncés et décisions rouvertes |
| réponse « je ne sais pas » | inconnue conservée, aucune valeur par défaut |
| deux Contributions incompatibles | Contradiction conservée |
| moteur spécialisé absent | arrêt `ENGINE_UNAVAILABLE`, jamais simulation |
| changement de LLM | mêmes objets, gardes, responsabilités et arrêts |
| correction dans une Projection | Contribution créée, aucun fond modifié directement |
| nouvelle connaissance | ancienne version immuable, nouvelle Analyse d’impact |
| décision différée | branches indépendantes seules continuent |
| demande de protocole insuffisante | refus explicite avec condition de reprise |
| changement sans chemin de dépendance | absence d’impact démontrée, aucune reconstruction |

## 61. Évaluation

Toute future implémentation doit être évaluée selon PD-011 sur :

- cas de référence, experts, incomplets, ambigus, contradictoires, impossibles et hors domaine ;
- changements décisifs et perturbations non décisives ;
- navigation, sélection de questions et arrêts ;
- conservation du contexte et reproductibilité ;
- respect des responsabilités de moteur ;
- décisions humaines, Mandats et refus ;
- fidélité et cohérence inter-projections ;
- erreurs critiques à tolérance nulle ;
- résultats séparés par parcours, moteur, macro-état et projection.

Aucun test technique, nombre de cas ou rapport `OFFICIAL` ne constitue seul un PASS PD-011.

---

# Partie XI — État réel, hypothèses et admission

## 62. État réellement implémenté

| Capacité de workflow | État documenté au 8 août 2026 |
|---|---|
| Entrée conversationnelle et interprétation linguistique bornée | implémentées dans le démonstrateur V1 |
| Trois parcours `UNDERSTAND`, `FORMALIZE_IDEA`, `DESIGN_STUDY` | implémentés |
| Contexte conservé lors des transitions | implémenté localement dans la V1 |
| Questions adaptatives et réponse « je ne sais pas » | implémentées de façon bornée |
| Avertissement de modification majeure | implémenté de façon bornée |
| Knowledge Explorer transversal | implémenté sur trois corpus/fixtures officiels |
| Dossier de projet en huit étapes et rapport | implémentés dans le démonstrateur |
| Domain Gate général | partiel et borné |
| Research Project canonique persistant | non démontré |
| Machine d’état RDE complète | non implémentée |
| Graphe général de reconstruction | non implémenté |
| Knowledge, Scientific Thinking et Study Design complets | non démontrés comme moteurs autonomes |
| Imaging, Biostatistics et Data Management autonomes | non implémentés |
| Regulatory, Economics, Safety et Clinical Operations | non implémentés |
| Document Engine et quatorze projections | non implémentés comme capacité générale |
| `ACTIVE_STUDY` et `COMPLETED_STUDY` | non implémentés |
| Évaluation scientifique PD-011 | non démontrée |

## 63. Hypothèses à valider

1. Les sept macro-états RDE peuvent être mappés sans perte aux cycles PD-003.
2. `ScientificIntent` apporte une valeur de routage sans devenir une seconde Intention scientifique.
3. Le Research Project peut rester un agrégat architectural du Dossier sans nouvelle identité métier.
4. Les types d’événements lisibles peuvent être gouvernés sans créer une seconde taxonomie persistante.
5. Les contributions inter-moteurs peuvent être coordonnées sans moteur propriétaire global du fond.
6. La générabilité locale des projections peut être expliquée sans score global trompeur.
7. Les impacts peuvent être propagés de façon reproductible à partir des Dépendances PD-003.
8. Les phases `ACTIVE_STUDY` et `COMPLETED_STUDY` peuvent rester une couche méthodologique sans concurrencer les systèmes opérationnels.
9. L’ordre minimal des questions demeure stable sous changement de rôle IA ou de fournisseur.

## 64. Décisions normatives proposées par RDE-002

Sous réserve d’admission :

- le workflow est une vue sur PD-003, jamais une seconde source de vérité ;
- le corridor général est conditionnel, pas une cascade obligatoire ;
- PD-009 choisit l’action et l’orchestration choisit la capacité ;
- une contribution précède toute intégration ;
- une décision humaine précède tout engagement de stratégie ;
- une modification majeure précède toujours une Analyse d’impact et une confirmation ;
- toutes les projections dérivent d’une Version de stratégie commune ;
- `DESIGN` est l’alias de mandat de `STUDY_DESIGN`, sans nouvel état ;
- la progression vers `ACTIVE_STUDY` ou `COMPLETED_STUDY` exige une preuve externe ;
- l’arrêt et le refus sont des résultats normaux, explicables et reconstructibles.

## 65. Conditions d’évolution de RDE-002

RDE-002 évolue lorsqu’une décision admise modifie :

- la séquence Domain Gate → intention → projet ;
- les macro-états ou leurs gardes ;
- la typologie des événements et leurs conséquences ;
- les règles de sélection ou de regroupement des questions ;
- les frontières de décision humaine ;
- le graphe minimal de dépendances ou la reconstruction ;
- les conditions de générabilité d’une Projection ;
- les invariants d’orchestration, d’arrêt ou de non-régression ;
- son rapport à PD-003, PD-009 ou RDE-001.

Il ne doit pas évoluer pour :

- changer d’écran, de composant, de frontend ou de microcopie ;
- changer de LLM, fournisseur ou rôle PD-005 sans modifier le contrat ;
- ajouter un corpus ou une connaissance particulière ;
- refléter un incident technique ponctuel ;
- décrire comme implémentée une cible absente ;
- corriger directement un objet ou une Projection de projet.

## 66. Conditions d’admission de la version 1.0 — historique

RDE-002 ne peut devenir officiel que si :

1. RDE-001 est arbitré, admis et indexé ;
2. l’identifiant RDE-002 est réconcilié avec la roadmap non réservante de RDE-001 ;
3. les macro-états sont mappés aux cycles PD-003 ;
4. les types d’événements sont confirmés comme traces ou occurrences d’objets canoniques ;
5. les états de générabilité sont mappés au cycle des Projections PD-003 ;
6. la frontière PD-009/orchestration/moteurs est confirmée ;
7. les domaines encore incomplets dans PD-003 ne reçoivent aucune écriture canonique prématurée ;
8. la source maîtresse, le niveau, le rôle, les autorités et les conditions d’évolution sont inscrits dans le SOURCE-OF-TRUTH-INDEX ;
9. les liens, doublons et contradictions sont validés dans la même décision documentaire ;
10. aucune cible n’est présentée comme capacité implémentée ou évaluée.

## 67. Décision finale historique de la version 1.0

**RDE_002_WORKFLOW_REQUIRES_ARBITRATION**

---

# Partie XII — Addendum normatif version 1.1

## 68. Arbitrages W01–W09

| ID | Décision version 1.1 |
|---|---|
| W01 | RDE-001 v1.1 est admis et devient l’autorité parente |
| W02 | l’opération KE-001 autorise l’inscription atomique de RDE-002 |
| W03 | RDE-002 désigne définitivement le Workflow ; la roadmap RDE-001 est corrigée et ne réserve aucun identifiant futur |
| W04 | `DESIGN` reste uniquement un alias lisible de `STUDY_DESIGN` |
| W05 | les macro-états restent des vues calculées sur les objets/cycles PD-003, selon le §19 |
| W06 | le corridor reste conditionnel ; PD-009 sélectionne une action, pas tous les moteurs |
| W07 | toutes les Projections dérivent de la même Version de stratégie ; aucune Projection ne possède le fond |
| W08 | les événements anglais sont des types de trace ; toute évolution durable utilise les objets PD-003 |
| W09 | `ACTIVE_STUDY` et `COMPLETED_STUDY` restent cibles et exigent une preuve externe ; ils ne sont pas implémentés par admission |

## 69. Mapping de générabilité et de cycle

| Vue de générabilité | Cycle Projection PD-003 | Règle |
|---|---|---|
| non générable, structure seule, partielle | demandée | disponibilité locale, aucune qualité globale |
| prête pour revue | produite | revue humaine encore requise |
| prête pour soumission | relue | diffusion/soumission encore décidée par un humain |
| diffusée | diffusée | événement externe/humain tracé |
| obsolète/remplacée | remplacée | nouvelle Projection liée |
| archivée | archivée | historique immuable |

Les gardes de générabilité ne sont pas des états métier supplémentaires. Les événements du workflow sont des traces ou occurrences liées à un Événement d’évolution, une Contribution, une Décision, une Version ou une Analyse d’impact PD-003.

## 70. Contrat Knowledge

RDE-002 choisit quand une action Knowledge est recevable et conserve ses événements. KE-001 gouverne exclusivement `KnowledgeRequest`, contexte, providers, applicabilité, résultats, gaps et terminaison. `KnowledgeUnavailable` est un événement de workflow ; `NO_SUPPORTED_KNOWLEDGE` est une projection consommateur d’un gap scientifique qualifié, jamais le libellé d’une panne.

Le nom canonique de la fonction de conception est **Study Design Engine**. Toute mention historique « fonction Research Design » ou « Research Design » dans une liste de moteurs doit être lue comme cet alias, non comme le système RDE.

## 71. État et décision version 1.1

RDE-002 est une référence normative officielle de niveau 1. L’état réellement implémenté du §62 reste inchangé.

**Décision : `RDE_002_WORKFLOW_ADMITTED_OFFICIAL`.**
