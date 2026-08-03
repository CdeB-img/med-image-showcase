# PD-009 — Decision Engine Architecture

## Scientific Decision Architecture du Protocol Designer

**Version :** 1.0  
**Date d’effet :** 2 août 2026  
**Statut :** référence normative officielle  
**Niveau documentaire :** niveau 1 — référence normative métier et produit  
**Domaine de responsabilité :** logique de navigation scientifique du Protocol Designer  
**Source maîtresse :** `docs/pd-009-decision-engine-architecture.md`  
**Éditions dérivées :** aucune  
**Autorité supérieure :** Charte fondatrice de NOXIA, puis *Scientific Product Manifesto* du Protocol Designer  
**Référence métier obligatoire :** `docs/pd-003-research-object-model.md`  
**Principe directeur :** choisir la prochaine action qui réduit une incertitude utile à une décision, sans décider à la place du chercheur

---

## 0. Décision documentaire et règle de lecture

### 0.1 Nature exacte de la mission

La présente mission crée une **architecture décisionnelle normative**. Elle ne crée ni agent d’intelligence artificielle, ni prompt, ni service, ni API, ni schéma de stockage, ni protocole d’imagerie.

Le Decision Engine décrit comment le Protocol Designer :

- détermine la prochaine action utile ;
- choisit si cette action doit être une question, une comparaison, une analyse, une revue, une demande de décision humaine ou un arrêt ;
- évalue l’information susceptible de réduire une incertitude décisionnelle ;
- conserve plusieurs chemins scientifiquement raisonnables ;
- propage les effets d’une réponse ou d’un changement ;
- refuse de poursuivre lorsque la progression ne serait plus scientifiquement honnête ;
- autorise ou refuse la projection d’un protocole à partir d’une stratégie.

Le mot **décision** possède ici deux sens qui ne doivent jamais être confondus :

1. le moteur sélectionne une **action de navigation** ;
2. seul un acteur humain habilité adopte une **Décision** au sens canonique de PD-003.

Le premier sens organise le raisonnement. Il ne transfère jamais au moteur la responsabilité attachée au second.

### 0.2 Documents consultés dans l’ordre d’autorité

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` — gouvernance, routage d’autorité et procédure d’arbitrage ;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx` — mission, principes durables et frontières générales ;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-edition-editoriale.docx` — philosophie spécialisée du Protocol Designer ;
4. `output/documents/noxia-protocol-designer-product-specification-v1.0.docx` — cible produit, états, transitions, parcours et critères d’acceptation ;
5. `docs/pd-003-research-object-model.md` — vocabulaire métier, relations, cycles de vie, invariants et traçabilité canoniques ;
6. `docs/pd-004-ux-manifesto.md` — règles de questionnement, de progressive disclosure, d’incertitude, d’arrêt et de décision humaine ;
7. `docs/pd-005-prompt-library-architecture.md` — rôles IA cibles appelés à contribuer au raisonnement, sans autorité sur la logique décisionnelle définie ici ;
8. `docs/pd-007-protocol-designer-implementation-readiness.md` — tranche verticale Fabry et readiness d’implémentation, apparue dans le dépôt après l’inventaire initial de la mission et relue intégralement avant confirmation de l’autonomie de PD-009.

### 0.3 Distinctions obligatoires

| Catégorie | Éléments applicables à PD-009 | Portée exacte |
|---|---|---|
| Principes établis | intention avant technique ; stratégie scientifique unique ; contexte indissociable de la connaissance ; incertitude conservée ; chercheur décisionnaire ; traçabilité et reproductibilité | Invariants issus des constitutions ; PD-009 ne peut pas les modifier |
| Références normatives | Product Specification, PD-003, PD-004, PD-005 et PD-007 dans leurs domaines respectifs | Contrats à respecter ; PD-003 prime pour les objets et leurs états ; PD-007 reste spécialisé sur la tranche V1 |
| Corpus scientifiques datés | aucun corpus scientifique n’est mobilisé pour définir la logique de navigation | PD-002 Fabry et les corpus P4–P5 ne sont ni modifiés ni généralisés en règles décisionnelles |
| Cible | moteur conceptuel déterministe, explicable et indépendant des modèles ; navigation par impact décisionnel ; arrêts et refus explicites ; projection ultérieure dans la tranche V1 de PD-007 | Architecture attendue, pas capacité livrée |
| État réellement implémenté | aucun module Decision Engine du Protocol Designer ni test correspondant n’a été identifié dans l’état du dépôt examiné le 2 août 2026 ; PD-009 est créé par la présente mission comme norme, pas comme implémentation | Absence d’implémentation constatée ; le présent document ne prouve aucune livraison logicielle |
| Hypothèses | ordre qualitatif de valeur de l’information, estimation de charge, critères de stabilité et règles de départage | Hypothèses d’architecture à évaluer sur des cas versionnés et avec des experts humains |

### 0.4 Contradictions et écarts documentaires explicitement arbitrés

#### Écart A — PD-007 est apparu après l’inventaire initial

Lors de la lecture initiale du SOURCE-OF-TRUTH-INDEX et de l’inventaire du dépôt, aucun fichier PD-007 n’était présent. `docs/pd-007-protocol-designer-implementation-readiness.md` est apparu pendant la mission. Il se déclare référence normative de niveau 1 et gouverne la première tranche verticale Fabry : sous-ensemble V1 des objets, neuf écrans, gates, tests d’admission et ordre des futures passes d’implémentation.

**Arbitrage après lecture intégrale :** PD-009 reste autonome. PD-007 spécialise une première implémentation et peut changer avec le cas vertical, les écrans, le périmètre V1 ou les gates. PD-009 porte une logique générale de navigation qui doit rester indépendante du cas Fabry, d’une tranche, d’un écran et de l’état d’implémentation. PD-007 consomme donc PD-009 dans son domaine ; il ne l’absorbe pas.

#### Écart B — PD-005 attribue une sélection décisionnelle à R01 et R04

La version 1.0 initiale de PD-005 décrivait R01 comme orchestrateur du raisonnement et R04 comme sélectionneur de la prochaine question. Cette formulation mêlait un rôle IA remplaçable à une responsabilité métier qui doit rester indépendante des modèles.

**Arbitrage appliqué :** PD-009 devient l’autorité sur la prochaine action, la prochaine question, les branches, les arrêts et le refus de produire un protocole. PD-005 version 1.1 limite R01 à l’orchestration d’exécution des rôles et R04 à la formulation et à la conduite d’un Échange adaptatif déjà sélectionné. Aucun des deux ne possède la décision de navigation.

#### Écart C — des alias et états d’affichage diffèrent de PD-003

La Product Specification et PD-005 emploient certains alias ou états qui ne sont pas des objets ou états canoniques de PD-003, notamment `ProjectIntent`, `ReasoningGraph`, `DecisionRecord`, « déclaré » ou « manquant ».

**Arbitrage :** le Decision Engine ne persiste et ne manipule que les objets et états de PD-003. Un alias technique éventuel n’a aucune autorité métier. « Déclaré » qualifie une origine de Contribution ou d’Information de projet ; ce n’est pas un état épistémique supplémentaire. « Manquant » est une présentation d’un état **inconnu** devenu nécessaire. Les états **non applicable** et **obsolète** restent conservés même si une projection UX les replie.

#### Écart D — la readiness apparaît dans la cible produit, pas dans PD-003

La Product Specification décrit plusieurs dimensions de readiness. PD-003 ne définit pas d’objet Readiness.

**Arbitrage :** PD-009 traite la readiness comme une **évaluation dérivée**, lisible et justifiée, des objets, relations et invariants de PD-003. Elle ne devient ni un nouvel objet métier, ni une note globale, ni une décision automatique.

#### Écart E — dettes de conformité identifiées dans PD-007

La lecture de PD-007 révèle trois écarts qui ne sont pas résolus silencieusement par PD-009 :

1. PD-007 diffère `Acteur du projet` et `Mandat décisionnel` tout en enregistrant des Décisions humaines. PD-003 exige qu’une Décision adoptée possède un décideur habilité. Une identité simple de « responsable scientifique » ne peut remplacer implicitement ces objets et leur responsabilité.
2. PD-007 emploie `Gate` et `Stop` dans certaines matrices comme s’ils pouvaient être des objets de parcours. Ils doivent rester des évaluations dérivées et être tracés par les objets PD-003 appropriés : Règle méthodologique, Revue méthodologique, Alerte méthodologique, Limite, Besoin d’information, Décision et Projection.
3. PD-007 diffère `État de connaissance effectif`, `Règle méthodologique` et `Événement d’évolution`, alors que PD-009 les mobilise pour la reproductibilité générale, l’explication des règles et la propagation. Une tranche V1 peut calculer certaines vues, mais elle doit encore identifier les versions, règles et déclencheurs canoniques nécessaires à toute Décision ou Projection engageante.

**Statut :** ces écarts n’invalident pas l’autonomie de PD-009. Ils constituent des dettes de conformité de PD-007 à résoudre avant l’implémentation des fonctions concernées. PD-009 n’a pas modifié le fichier concurrent PD-007.

### 0.5 Pourquoi l’architecture doit rester autonome

L’autonomie de PD-009 répond à cinq critères :

1. **Responsabilité distincte.** PD-003 définit ce qui existe dans le raisonnement ; PD-009 définit comment naviguer entre ces objets ; PD-005 définit quelles capacités IA peuvent contribuer.
2. **Stabilité différente.** La logique de décision doit survivre au remplacement d’un modèle, d’un rôle, d’une interface ou d’une technologie.
3. **Auditabilité.** Une règle de navigation doit pouvoir être relue sans ouvrir une architecture de prompts ou une future architecture technique.
4. **Non-duplication.** Une seule référence doit gouverner la sélection de la prochaine action ; les autres documents la consomment.
5. **Spécialisation de PD-007.** PD-007 gouverne un périmètre V1 Fabry et ses écrans ; lui confier la logique générale ferait dépendre cette logique d’une tranche et créerait une seconde responsabilité dans un document d’implémentation readiness.

---

## 1. Finalité du Decision Engine

Le Decision Engine maintient la progression d’une stratégie scientifique entre un état connu et le prochain état scientifiquement défendable.

Il ne cherche pas à remplir tous les objets, à maximiser le nombre de réponses, à terminer un parcours ni à produire un protocole le plus vite possible. Il cherche à obtenir **l’information minimale qui peut modifier utilement une décision**, à construire les comparaisons nécessaires et à arrêter le raisonnement lorsque poursuivre fabriquerait une certitude, une responsabilité ou une recommandation non justifiée.

Sa fonction générale est de répondre, à chaque instant, à six questions :

1. Quelles Décisions sont réellement ouvertes ?
2. Quels objets ou relations empêchent de les instruire honnêtement ?
3. Parmi ces lacunes, lesquelles peuvent être réduites maintenant ?
4. Quelle action modifierait le plus le raisonnement pour la charge et le risque les plus acceptables ?
5. Cette action relève-t-elle du moteur, d’une source, d’un acteur du projet ou d’une Revue méthodologique ?
6. Si aucune action recevable n’existe, faut-il produire une synthèse provisoire, demander une intervention humaine, suspendre ou refuser la projection protocolaire ?

---

## 2. Périmètre et non-périmètre

### 2.1 Le Decision Engine gouverne

- la lecture de l’état courant du raisonnement ;
- la détection des Décisions ouvertes et des dépendances non satisfaites ;
- l’identification et la priorité des Besoins d’information ;
- le choix entre questionner, analyser, comparer, revoir, escalader, suspendre ou arrêter ;
- l’ordre logique des actions et les retours en amont ;
- la coexistence d’Options raisonnables ;
- la propagation des impacts directs et en cascade ;
- les règles de réouverture après un Événement d’évolution ;
- les conditions conceptuelles de passage vers une Projection ;
- le refus de créer ou présenter un Protocole d’imagerie lorsque les invariants requis ne sont pas satisfaits.

### 2.2 Le Decision Engine ne gouverne pas

- le contenu scientifique d’un Énoncé de connaissance ;
- la sélection ou l’évaluation d’une Source scientifique ;
- la production d’une Preuve scientifique ou d’une Synthèse de preuves ;
- la formulation rédactionnelle finale d’une question ou d’un rapport ;
- le choix d’un modèle d’intelligence artificielle ;
- l’écriture, le stockage ou l’exécution d’un prompt ;
- l’appel d’une API ou l’ordonnancement technique d’un service ;
- l’adoption d’une Décision scientifique ;
- la validation scientifique, clinique, réglementaire ou institutionnelle d’un projet ;
- la production d’une recommandation clinique individuelle ;
- le calcul d’un score global de qualité, de confiance ou de readiness.

### 2.3 Neutralité technologique

Le Decision Engine peut être appliqué manuellement, sous forme de règles, par un moteur déterministe ou par une architecture hybride. Sa définition reste la même.

Un modèle de langage peut proposer une Contribution, caractériser une Option ou rédiger un Échange adaptatif. Il ne devient jamais la source de l’ordre de navigation. La présence ou l’absence d’un modèle ne modifie ni les objets, ni les règles, ni les responsabilités décrites ici.

---

## 3. Socle canonique : les objets de PD-003 uniquement

### 3.1 Règle d’exclusivité

PD-009 ne crée aucun objet métier supplémentaire. Les termes tels que « état courant du moteur », « candidat », « priorité », « branche », « porte » ou « action suivante » désignent des vues calculées, des qualifications ou des opérations sur les objets de PD-003. Ils ne doivent pas devenir silencieusement des entités persistées concurrentes.

Toute nouvelle information durable doit être représentée par un objet canonique approprié, notamment :

| Besoin décisionnel | Objet ou combinaison canonique |
|---|---|
| Conserver l’expression initiale | Situation de recherche |
| Qualifier la finalité | Intention scientifique |
| Représenter une donnée du projet | Information de projet |
| Dire ce qu’il manque et pourquoi | Besoin d’information |
| Poser une question et conserver sa réponse | Échange adaptatif |
| Comparer plusieurs possibilités | Option et Compromis |
| Formuler une proposition argumentée | Recommandation et Justification |
| Engager la stratégie | Décision, Acteur du projet et Mandat décisionnel |
| Représenter une ignorance ou fragilité | Incertitude |
| Conserver deux éléments incompatibles | Contradiction |
| Conserver un désaccord scientifique | Controverse scientifique |
| Signaler un problème actionnable | Alerte méthodologique |
| Vérifier le raisonnement | Revue méthodologique |
| Représenter un fait nouveau | Événement d’évolution |
| Déterminer les conséquences d’un changement | Analyse d’impact et Dépendance |
| Figer un état reconstructible | Version de stratégie et État de connaissance effectif |
| Restituer sans modifier le fond | Projection et Profil de projection |

### 3.2 État minimal lu à chaque décision de navigation

Avant de sélectionner une action, le moteur lit au minimum :

- le Dossier de recherche et la Version de stratégie active ;
- la Situation de recherche, l’Intention scientifique, la Question scientifique, les Objectifs scientifiques et les Hypothèses ;
- le Contexte du projet, les Informations de projet et leurs états épistémiques ;
- les Options, Recommandations et Décisions ouvertes, actives, différées ou remplacées ;
- les Incertitudes, Contradictions, Risques, Biais, Limites et Alertes méthodologiques ;
- les Dépendances directes et transversales ;
- les Besoins d’information et Échanges adaptatifs déjà ouverts, différés ou satisfaits ;
- les Revues méthodologiques applicables ;
- les Acteurs du projet et Mandats décisionnels ;
- l’État de connaissance effectif et les Domaines de validité applicables ;
- les Analyses d’impact non encore arbitrées ;
- les Projections demandées et leur usage déclaré.

Le moteur ne déduit jamais qu’un objet absent est implicitement satisfait.

### 3.3 États canoniques utilisés

Les états épistémiques sont exclusivement ceux de PD-003 :

- connu ;
- supposé ;
- inconnu ;
- non applicable ;
- contradictoire ;
- obsolète.

Les niveaux de confiance sont exclusivement :

- établie ;
- probable ;
- contextuelle ;
- controversée ;
- insuffisamment documentée.

Les objets conservent leurs cycles de vie propres. Le moteur ne remplace pas ces cycles par un statut universel. Il interprète ensemble, sans les confondre, l’état d’une Information de projet, celui d’une Décision, celui d’une connaissance et celui d’une Projection.

---

## 4. Objectifs décisionnels

### 4.1 Objectif primaire

Faire progresser la stratégie vers un état où la prochaine Décision humaine peut être instruite avec des Options explicites, des Justifications reconstructibles, des Incertitudes visibles et un contexte suffisant.

### 4.2 Objectifs secondaires

- réduire les ambiguïtés qui changent la signification de la Question scientifique ;
- éviter les questions sans conséquence ;
- maintenir la cohérence du réseau question–objectif–hypothèse–mesure–analyse–interprétation ;
- découvrir les Contradictions et les dépendances cachées avant qu’elles n’atteignent une Projection ;
- préserver des Options alternatives lorsque les preuves ou les préférences ne permettent pas un choix unique ;
- minimiser la charge cognitive et documentaire compatible avec l’honnêteté scientifique ;
- accélérer les retours ciblés plutôt que recommencer le parcours ;
- garantir qu’un arrêt soit aussi explicable et traçable qu’une poursuite.

### 4.3 Objectifs interdits

Le moteur ne doit jamais chercher à :

- maximiser le nombre de champs renseignés ;
- minimiser le nombre de questions au détriment d’une inconnue critique ;
- obtenir une stratégie unique lorsqu’un désaccord raisonnable subsiste ;
- faire converger artificiellement toutes les conclusions ;
- optimiser un score global opaque ;
- confirmer la préférence initiale de l’utilisateur ;
- produire un protocole parce qu’un livrable a été demandé ;
- clôturer une Contradiction par majorité documentaire ;
- substituer une valeur plausible à une Information de projet inconnue.

---

## 5. État du raisonnement et progression

### 5.1 L’état du raisonnement est une vue, pas un objet

À un instant donné, l’état du raisonnement correspond à la combinaison reconstructible de :

- la Version de stratégie active ;
- l’État de connaissance effectif ;
- les objets et relations présents ;
- leurs cycles de vie ;
- leurs états épistémiques et niveaux de confiance ;
- les Décisions humaines et Mandats décisionnels ;
- les Incertitudes, Contradictions et Alertes non closes ;
- les Événements d’évolution et Analyses d’impact en attente ;
- la Projection actuellement recherchée.

Cette vue n’a pas d’identité propre et ne doit pas être persistée comme une seconde vérité.

### 5.2 Phases logiques

Le moteur utilise les six phases de PD-003 comme ordre de dépendance :

1. **Clarifier** — Situation de recherche, Intention scientifique, Question scientifique et Informations de projet ;
2. **Structurer** — Objectifs, Hypothèses, Population, Phénomènes biologiques, Plan d’étude et Critères de jugement ;
3. **Construire** — Biomarqueurs, Modalités, Acquisitions, Analyses, Contrôles qualité, Options, Compromis et Recommandations ;
4. **Revoir** — cohérence, faisabilité, Biais, Risques, Limites, Contradictions, preuves et Mandats ;
5. **Proposer** — Décisions humaines, Version de stratégie et Projections ;
6. **Faire évoluer** — Événement d’évolution, Analyse d’impact, nouvel arbitrage et nouvelle Version de stratégie.

Ces phases sont une carte, jamais un tunnel. Une Dépendance nouvelle peut rouvrir une phase antérieure. Le moteur revient au plus petit sous-ensemble d’objets nécessaire ; il ne réinitialise pas le dossier.

### 5.3 Conditions de progression

Une progression est recevable si :

- les invariants nécessaires à l’action suivante sont satisfaits ou explicitement assumés ;
- aucune Contradiction bloquante n’est masquée ;
- les Incertitudes restantes sont compatibles avec le niveau de conclusion attendu ;
- les Options raisonnables n’ont pas été supprimées sans Décision ;
- l’acteur appelé à décider possède un Mandat décisionnel applicable ;
- les effets en aval ont été évalués lorsqu’une information ou décision amont change.

Une phase peut rester incomplète sans bloquer tout le projet si l’incomplétude n’affecte ni l’objectif courant, ni la Projection demandée, ni une Décision structurante. Cette non-pertinence doit être démontrée par les Dépendances, pas supposée.

---

## 6. Actions de navigation possibles

À chaque cycle, le moteur choisit une seule action principale parmi les catégories suivantes. Ces catégories ne sont pas des objets métier.

### 6.1 Clarifier par un Échange adaptatif

Action légitime lorsqu’un Besoin d’information satisfait les critères de pertinence, de réductibilité et d’impact décrits plus loin.

### 6.2 Construire ou réviser un objet

Action légitime lorsque l’information nécessaire existe, mais qu’un objet canonique ou une relation doit être produit, qualifié ou révisé avant toute nouvelle question.

### 6.3 Comparer des Options

Action légitime lorsqu’au moins deux Options scientifiquement ou méthodologiquement raisonnables doivent être examinées selon des Compromis communs.

### 6.4 Déclencher une Revue méthodologique

Action légitime lorsqu’une stratégie suffisamment construite doit être confrontée à des invariants, des Biais, des Risques, des Limites, des preuves ou un périmètre de responsabilité.

### 6.5 Demander une Décision humaine

Action légitime lorsqu’aucune information supplémentaire ne peut départager des Options sans préférence, responsabilité ou expertise humaine.

### 6.6 Produire une Projection provisoire

Action légitime lorsque le raisonnement doit être communiqué sans prétendre être complet. La Projection doit conserver les inconnues, réserves, Contradictions et Décisions ouvertes.

### 6.7 Suspendre ou arrêter

Action légitime lorsque l’utilisateur diffère, lorsqu’une information n’est pas accessible, lorsqu’une intervention humaine est attendue ou lorsqu’aucune action supplémentaire ne possède de valeur décisionnelle suffisante.

### 6.8 Refuser une projection protocolaire

Action obligatoire lorsqu’une condition absolue de la section 15.5 est satisfaite. Le refus conserve le travail acquis et explique les conditions de reprise.

---

## 7. Modèle conceptuel des transitions

### 7.1 Anatomie obligatoire d’une transition

Toute transition de navigation doit pouvoir exposer :

1. **déclencheur** — Information de projet, Contribution, Décision, Incertitude, Contradiction, Alerte, Revue ou Événement d’évolution ;
2. **état de départ** — Version de stratégie, objets et connaissances effectives ;
3. **règles appliquées** — Règles méthodologiques et invariants de PD-003 ;
4. **actions candidates** — questions, constructions, comparaisons, revues, arbitrages ou arrêts possibles ;
5. **action retenue** — et raison du rejet ou du report des principales alternatives ;
6. **responsable attendu** — moteur, acteur, source ou revue ;
7. **effet attendu** — Décisions ou Incertitudes susceptibles de changer ;
8. **résultat observé** — objets effectivement créés ou révisés ;
9. **impact propagé** — objets à revoir, Décisions à rouvrir, Projections obsolètes ;
10. **condition de reprise ou de clôture**.

### 7.2 Transitions de référence

| État ou événement source | Condition | Action suivante recevable | Trace canonique minimale |
|---|---|---|---|
| Situation de recherche ambiguë | plusieurs Intentions plausibles changent la Question | Échange adaptatif sur l’intention | Besoin d’information, Échange, Contribution |
| Intention confirmée | Question encore dépendante d’une information structurante | Échange ou reformulation | Information de projet, Question révisée |
| Question suffisamment comprise | Objectifs ou Hypothèses non structurés | construction des objets concernés | Objectif, Hypothèse, Justification |
| Plusieurs Options plausibles | critères de comparaison disponibles | comparaison multidimensionnelle | Option, Compromis, Recommandation éventuelle |
| Plusieurs Options plausibles | choix dépendant d’une valeur ou responsabilité humaine | demande de Décision | Décision, Acteur, Mandat, Justification |
| Information nouvelle | au moins une Dépendance active est touchée | Analyse d’impact | Événement d’évolution, Analyse d’impact |
| Contradiction détectée | même contexte, même objet, incompatibilité réelle | qualification puis arbitrage ou revue | Contradiction, Alerte, Revue ou Décision |
| Preuve ou contexte insuffisant | conclusion forte impossible | recherche, réduction de portée ou arrêt | Incertitude, Besoin d’information, Limite |
| Stratégie construite | cohérence non encore examinée | Revue méthodologique | Revue, Alertes et Recommandations |
| Revue recevable | Décisions humaines structurantes enregistrées | Version de stratégie puis Projection | Décision, Version de stratégie, Projection |
| Invariant protocolaire non satisfait | la demande vise un Protocole d’imagerie | refus explicite | Alerte, Limite, Besoin ou Décision ouverte |

### 7.3 Transitions interdites

- Situation de recherche directement vers Protocole d’imagerie ;
- Recommandation directement vers Décision active sans acteur habilité ;
- Information supposée vers connue sans Contribution ou preuve identifiable ;
- Contradiction vers résolution sans arbitrage explicite ;
- Revue méthodologique vers approbation scientifique automatique ;
- changement amont vers réécriture silencieuse d’une Décision ;
- nouvelle connaissance vers modification rétroactive d’une Version de stratégie ;
- Projection vers création ou modification d’un objet de fond ;
- absence de réponse vers valeur par défaut non qualifiée ;
- arrêt utilisateur vers suppression des Besoins d’information ouverts.

---

## 8. Dépendances et propagation des impacts

### 8.1 Graphe de propagation

La Dépendance est l’unique relation canonique utilisée pour représenter qu’un objet n’est valide, utile ou réalisable qu’en présence d’un autre objet ou d’une condition. Les relations canoniques de PD-003 complètent ce graphe.

Le moteur distingue :

- **impact direct** : l’objet modifié est explicitement nécessaire à un autre objet ;
- **impact en cascade** : une conséquence directe affecte à son tour un objet dépendant ;
- **impact conditionnel** : l’effet n’existe que pour une Option, un groupe, une visite, un site ou un Domaine de validité ;
- **absence d’impact démontrée** : aucun chemin de Dépendance pertinent ne rejoint la Décision ou Projection considérée.

La proximité graphique, l’ordre des écrans ou la présence dans une même section ne constituent jamais une Dépendance.

### 8.2 Procédure de propagation

Pour tout Événement d’évolution :

1. identifier l’objet ou la relation directement modifié ;
2. retrouver les Dépendances sortantes applicables au contexte et à la date ;
3. parcourir les conséquences jusqu’aux Décisions, Recommandations, Analyses, Versions de stratégie et Projections ;
4. distinguer ce qui reste valable, ce qui doit être revu et ce qui ne peut plus soutenir la conclusion antérieure ;
5. identifier les Incertitudes nouvelles et les Options réouvertes ;
6. produire une Analyse d’impact avant toute modification de Décision ;
7. soumettre aux acteurs habilités les arbitrages qui changent la stratégie ;
8. créer une nouvelle Version de stratégie ;
9. rendre obsolètes, sans les supprimer, les Projections affectées ;
10. limiter le recalcul aux branches réellement dépendantes.

### 8.3 Ensembles minimaux d’impact

Le moteur applique au minimum les règles de PD-003 :

- changement de Contexte du projet : Domaine de validité, faisabilité, Biomarqueurs, Paramètres critiques, Contrôles qualité, harmonisation, Analyses et Risques ;
- changement d’Objectif ou d’Hypothèse : Critères de jugement, Variables, Acquisitions, Analyses, Dimensionnement, Justifications et Rapport scientifique ;
- changement de Biomarqueur : Modalités, Acquisitions, Séquences, Paramètres, Conditions de mesure, Contrôles, Analyses, Règles d’interprétation et Compromis ;
- changement d’Acquisition : Variables, Critères, Analyses, Contrôles et interprétations devenus impossibles, fragiles ou redondants ;
- changement de connaissance : stratégies utilisatrices, Justifications, Recommandations et Décisions potentiellement affectées, sans altération rétroactive.

Ces ensembles sont des planchers de revue, pas des listes exhaustives.

---

## 9. Réduction d’incertitude

### 9.1 Incertitude décisionnellement utile

Une Incertitude mérite une action si sa réduction peut :

- modifier la formulation ou le périmètre d’une Question scientifique ;
- changer la priorité ou la définition d’un Objectif ;
- rendre une Hypothèse examinable ou non évaluable ;
- ouvrir, fermer, reclasser ou départager une Option ;
- modifier une Recommandation ou ses conditions d’invalidation ;
- empêcher ou autoriser une Décision humaine ;
- changer une Dépendance, un Risque, une Limite ou une Règle d’interprétation ;
- rendre possible, impossible ou trompeuse une Projection demandée.

Une Incertitude descriptive sans chemin vers l’un de ces effets peut être conservée sans être prioritaire.

### 9.2 Natures d’incertitude sans création de nouveaux objets

Le moteur peut qualifier la cause d’une Incertitude pour choisir son traitement :

- information du projet inconnue ;
- connaissance insuffisamment documentée ;
- applicabilité contextuelle incertaine ;
- définition ou relation ambiguë ;
- variabilité de mesure ;
- Option dépendante d’une préférence humaine ;
- contradiction non arbitrée ;
- événement futur ou faisabilité non vérifiée.

Ces qualificatifs décrivent l’Incertitude ; ils ne créent pas de sous-types métier autonomes.

### 9.3 Traitements possibles

| Cause dominante | Traitement privilégié | Condition d’arrêt |
|---|---|---|
| Information de projet inconnue et accessible | Besoin d’information puis Échange adaptatif | réponse obtenue, non applicable ou explicitement différée |
| Preuve insuffisante | nouvelle recherche ou réduction du niveau de conclusion | aucune preuve applicable accessible |
| Applicabilité contextuelle | préciser Contexte et Domaine de validité | contexte impossible à établir |
| Ambiguïté de définition | reformuler l’objet ou la relation | plusieurs sens restent légitimes et exigent une Décision |
| Variabilité de mesure | Contrôle qualité, Analyse, Limite ou Compromis | incertitude résiduelle acceptée ou usage rendu non défendable |
| Préférence ou responsabilité | comparaison puis Décision humaine | acteur ou Mandat absent |
| Contradiction réelle | qualification, preuve, Revue et arbitrage | conflit critique non résolu |
| Faisabilité future | hypothèse supposée visible, scénario ou attente | donnée indisponible et décision irréversible |

### 9.4 Propagation de l’incertitude

Une conclusion aval ne peut pas recevoir un niveau de confiance plus fort que celui permis par ses prémisses critiques, sauf Justification explicite fondée sur des preuves indépendantes.

Le moteur ne moyenne pas une preuve faible et une preuve forte pour fabriquer une confiance intermédiaire. Il conserve :

- la source de chaque fragilité ;
- les chemins de Dépendance concernés ;
- l’effet sur les Options et conclusions ;
- la possibilité ou non de réduire cette fragilité ;
- la Décision humaine qui accepte éventuellement l’incertitude résiduelle.

---

## 10. Calcul de l’information la plus utile

### 10.1 Définition

L’information la plus utile n’est pas celle qui complète le plus de champs. C’est celle dont les réponses plausibles ont la plus forte capacité à modifier une Décision pertinente, réduire une Incertitude structurante ou empêcher une conclusion invalide, pour une charge et un risque proportionnés.

La valeur recherchée est une **valeur d’information décisionnelle**, pas une quantité abstraite de données.

### 10.2 Construction des candidats

Un candidat ne peut provenir que d’un Besoin d’information existant ou créé à partir :

- d’une Dépendance non satisfaite ;
- d’une Incertitude ;
- d’une Contradiction ;
- d’une Alerte méthodologique ;
- d’une Revue méthodologique ;
- d’une Décision ouverte ;
- d’un Événement d’évolution ou d’une Analyse d’impact.

Chaque candidat doit indiquer :

- l’objet déclencheur ;
- les réponses ou issues plausibles sans en inventer la probabilité ;
- les Décisions et objets susceptibles d’être affectés ;
- l’effet si l’information reste inconnue ;
- la personne, source ou processus capable de la fournir ;
- la charge, la sensibilité et la possibilité de différer.

### 10.3 Porte d’éligibilité

Un Besoin d’information peut conduire à une question seulement si toutes les conditions suivantes sont satisfaites :

1. au moins deux réponses plausibles conduisent à des conséquences différentes, ou l’absence de réponse bloque une conclusion importante ;
2. la conséquence atteint une Décision, une Recommandation, une Incertitude structurante ou la validité d’une Projection ;
3. l’information n’est pas déjà connue, obsolète sans besoin actuel, ou disponible dans un objet existant ;
4. l’utilisateur ou l’acteur sollicité est une source légitime pour cette information ;
5. la question n’exige pas une décision scientifique avant que les Options et leurs Compromis soient présentés ;
6. le coût, la sensibilité et le risque de la question sont proportionnés à son impact ;
7. une réponse « inconnu » ou un report peuvent être traités honnêtement.

Si toutes les réponses possibles laissent la prochaine Décision inchangée, la question est inéligible à cet instant.

### 10.4 Vecteur transparent de valeur

Le moteur compare les candidats selon un vecteur explicite, jamais selon une note globale cachée :

1. **caractère bloquant** — l’information conditionne-t-elle la poursuite honnête, la sécurité méthodologique ou la projection demandée ?
2. **pouvoir de discrimination** — les réponses plausibles ouvrent-elles ou ferment-elles réellement des Options différentes ?
3. **portée d’impact** — combien d’objets critiques et de Décisions sont atteints directement ou en cascade, et lesquels ?
4. **réductibilité** — l’information peut-elle être obtenue ou qualifiée maintenant avec une source légitime ?
5. **irréversibilité** — une décision prise sans cette information serait-elle coûteuse, difficile à corriger ou susceptible de rendre une Projection trompeuse ?
6. **urgence temporelle** — la fenêtre d’obtention ou de décision est-elle limitée par le Plan d’étude, une Visite ou une contrainte réelle ?
7. **charge** — effort cognitif, documentaire, organisationnel ou expérimental requis ;
8. **sensibilité et risque** — exposition inutile d’une information sensible, transfert de responsabilité ou risque d’interprétation ;
9. **valeur pédagogique utile** — la question aide-t-elle à comprendre une conséquence sans devenir un détour encyclopédique ?

Chaque dimension est justifiée qualitativement par les objets et Dépendances concernés. Un niveau qualitatif peut être utilisé pour comparer, mais aucun pourcentage de confiance ou total pondéré ne doit être affiché sans validation spécifique.

### 10.5 Ordre de sélection

La sélection suit un ordre lexicographique :

1. traiter d’abord les risques de domaine, les Contradictions critiques et les conditions qui imposent un arrêt ;
2. parmi les candidats restants, traiter les informations bloquant la prochaine Décision irréversible ou la validité d’une Projection ;
3. privilégier ensuite le candidat qui discrimine le plus clairement les Options actives ;
4. à impact comparable, choisir l’information la plus réductible avec la charge et la sensibilité les plus faibles ;
5. à égalité persistante, préserver l’égalité et utiliser l’ordre logique de Dépendance ;
6. si l’ordre dépend d’une préférence de valeur, demander une Décision humaine plutôt que fabriquer un classement.

Le départage par identifiant stable est autorisé uniquement pour obtenir un ordre de présentation reproductible entre candidats scientifiquement équivalents. Il ne doit jamais être interprété comme une préférence scientifique.

### 10.6 Probabilités et information attendue

Lorsque des probabilités de réponse ou des utilités sont soutenues par des données et un Domaine de validité adaptés, une Analyse peut estimer l’effet attendu de l’information sur les Options et Décisions.

En l’absence de telles données, le moteur ne fabrique aucune probabilité. Il utilise :

- la séparation qualitative des branches ;
- l’analyse du scénario défavorable plausible ;
- la dominance entre candidats ;
- la portée réelle des Dépendances ;
- l’irréversibilité et la charge.

L’emploi de concepts issus de la valeur de l’information ne transforme donc jamais une estimation subjective en mesure exacte.

---

## 11. Stratégie de questionnement

### 11.1 Quand poser une question

Une question est posée lorsque :

- un Besoin d’information éligible possède la priorité la plus élevée ;
- l’utilisateur ou l’acteur sollicité peut raisonnablement fournir l’information ;
- la réponse influencera une étape identifiée du raisonnement ;
- le moteur peut expliquer cette influence avant la réponse ;
- le traitement d’une réponse inconnue, contradictoire ou différée est défini.

### 11.2 Quand ne pas poser une question

Le moteur ne pose pas la question si :

- l’information existe déjà dans une Information de projet encore applicable ;
- elle peut être dérivée de façon justifiée d’objets existants sans demander une nouvelle Contribution ;
- aucune réponse plausible ne change une Décision ou une conclusion ;
- la question appartient à une branche déjà fermée ;
- elle demande un détail d’exécution avant que l’Objectif ou le Biomarqueur soit défini ;
- elle relève d’une Source scientifique, d’une mesure ou d’une expertise que l’utilisateur ne peut pas fournir ;
- elle expose une information sensible sans nécessité proportionnée ;
- elle demande à l’utilisateur de trancher avant que les Options, Justifications et Compromis soient compréhensibles ;
- elle sert uniquement à personnaliser la présentation, sauf si un Profil de projection est effectivement demandé ;
- son seul effet est d’augmenter une complétude abstraite.

### 11.3 Forme de la question

Tout Échange adaptatif doit conserver :

- le Besoin d’information auquel il répond ;
- la raison de la question ;
- les objets et Décisions influencés ;
- une formulation unique et non orientée ;
- des réponses proposées lorsque leur espace est réellement borné ;
- une réponse libre lorsque l’espace ne peut pas être honnêtement fermé ;
- la possibilité de répondre « inconnu », « non applicable » ou de différer ;
- la conséquence annoncée de chaque réponse lorsque celle-ci est prévisible ;
- l’auteur, la date, l’interprétation et l’impact réellement observé.

Une question sensible doit en outre indiquer pourquoi cette information est nécessaire et qui pourra la consulter.

### 11.4 Une question principale à la fois

Le moteur sélectionne une seule question décisionnelle principale. Des Besoins dépendants peuvent être annoncés, mais ne concurrencent pas l’action courante.

Plusieurs informations peuvent être recueillies dans un même Échange uniquement si elles forment une unité indissociable pour la même Décision et si leur séparation augmenterait la charge ou créerait une incohérence. Cette exception doit rester traçable.

### 11.5 Réponse inconnue, différée ou contestée

- **Inconnue :** conserver l’état inconnu, évaluer l’impact et chercher une autre source ou une stratégie compatible avec l’absence.
- **Différée :** maintenir le Besoin d’information ouvert, documenter la condition de reprise et continuer uniquement sur les branches indépendantes.
- **Non applicable :** exiger une Justification contextuelle et fermer seulement les dépendances réellement concernées.
- **Contradictoire :** conserver les Contributions incompatibles et ouvrir une Contradiction ; ne pas choisir la réponse la plus récente par défaut.
- **Contestée :** conserver la Contribution et demander une qualification, une preuve ou une Revue selon la nature du désaccord.

### 11.6 Ne pas reposer silencieusement une question

Un Échange adaptatif déjà répondu n’est pas recréé à l’identique. Si un Événement d’évolution rend la réponse obsolète ou modifie son domaine, le moteur :

1. rappelle la réponse antérieure et son contexte ;
2. explique le changement ;
3. crée un nouveau Besoin d’information relié ;
4. demande confirmation ou nouvelle Contribution ;
5. conserve les deux périodes de validité.

---

## 12. Chemins multiples, Options et alternatives

### 12.1 Une stratégie, plusieurs Options

Plusieurs chemins ne créent pas plusieurs stratégies indépendantes. Ils sont représentés par des Options concurrentes à l’intérieur de la même Stratégie scientifique jusqu’à la Décision humaine ou à l’invalidation explicite d’une branche.

Chaque Option conserve :

- la Question, l’Objectif ou le problème auquel elle répond ;
- les conditions dans lesquelles elle est recevable ;
- les Dépendances nécessaires ;
- les bénéfices, coûts, Risques, Limites et Incertitudes ;
- les preuves et Domaines de validité ;
- les conséquences sur les Acquisitions, Analyses et conclusions ;
- son cycle de vie et la Décision éventuelle qui la retient ou l’écarte.

### 12.2 Dominance et non-dominance

Une Option peut être écartée sans préférence humaine si elle est dominée dans le contexte courant : elle n’apporte aucun bénéfice pertinent supplémentaire, impose au moins une contrainte ou un risque supérieur, et cette comparaison est soutenue par les mêmes critères et un Domaine de validité compatible.

Si les Options échangent des bénéfices différents — précision contre durée, portée contre faisabilité, standardisation contre adaptabilité — elles restent non dominées. Le moteur présente le Compromis et demande une Décision humaine.

Il est interdit de convertir plusieurs dimensions en un « meilleur choix » global sans préférence humaine explicite et traçable.

### 12.3 Branches conditionnelles

Une branche peut rester conditionnelle à une Information de projet, une Contrainte, un Site, un Groupe, une Visite ou un Domaine de validité. Le moteur :

- ne développe que les branches encore plausibles ;
- ne demande pas les informations propres à une branche fermée ;
- conserve la raison de fermeture ;
- rouvre la branche si un Événement d’évolution invalide cette raison ;
- fusionne les éléments communs sans dupliquer les objets.

### 12.4 Égalité persistante

Lorsque plusieurs Options restent scientifiquement défendables après toutes les informations raisonnablement accessibles, l’état correct est :

- comparaison explicite ;
- Incertitude conservée ;
- conditions de préférence décrites ;
- Décision humaine, décision différée ou coexistence assumée ;
- aucune question supplémentaire dont la réponse ne pourrait plus départager les Options.

---

## 13. Contradictions

### 13.1 Test de contradiction réelle

Deux éléments constituent une Contradiction lorsque, pour le même objet, le même sens, le même contexte, la même période de validité et le même niveau de décision, ils ne peuvent pas être vrais ou actifs simultanément.

Ne sont pas automatiquement des Contradictions :

- deux formulations éditoriales du même sens ;
- deux résultats dans des populations ou méthodes différentes ;
- une version ancienne et sa révision explicitement datée ;
- deux Options non encore arbitrées ;
- une Controverse scientifique dont les Domaines de validité diffèrent ;
- une Information de projet et une hypothèse de travail clairement qualifiée comme supposée.

### 13.2 Procédure obligatoire

1. conserver les objets en conflit ;
2. identifier le sens, le contexte, la date, la provenance et la règle violée ;
3. déterminer s’il s’agit d’une Contradiction, d’une différence de contexte, d’une obsolescence ou d’une Controverse scientifique ;
4. mesurer les Décisions et Projections affectées ;
5. créer un Besoin d’information si un fait accessible peut résoudre le conflit ;
6. demander une Revue méthodologique si le conflit porte sur la cohérence ou la preuve ;
7. demander une Décision humaine si plusieurs positions restent admissibles ou si une responsabilité doit être assumée ;
8. conserver l’arbitrage, son Mandat, sa Justification et ses conséquences ;
9. maintenir la Contradiction ouverte si aucune autorité suffisante ne peut trancher.

### 13.3 Effet sur la navigation

Une Contradiction bloque uniquement les branches et conclusions qu’elle affecte. Elle bloque toute projection protocolaire si elle touche une chaîne structurante : Question, Objectif principal, Hypothèse principale, Population, Critère de jugement principal, justification d’une Acquisition indispensable, sécurité, qualité minimale ou autorité décisionnelle.

Une Contradiction non structurante peut être conservée comme Limite ou réserve dans une Projection provisoire, avec son impact exact.

---

## 14. Décisions et validations humaines

### 14.1 Principe

Le moteur sélectionne le moment où une Décision humaine devient nécessaire. Il ne sélectionne jamais son contenu à la place de l’acteur.

Une demande de Décision est recevable seulement si :

- les Options pertinentes ont été présentées ;
- leurs Justifications, Compromis, Risques, Limites et Incertitudes sont visibles ;
- les informations raisonnablement accessibles qui pourraient changer l’arbitrage ont été recherchées ou explicitement différées ;
- le décideur possède un Mandat décisionnel applicable ;
- la portée et les conséquences de la Décision sont définies ;
- les conditions de réouverture sont connues.

### 14.2 Décisions toujours humaines

Sont toujours adoptés, rejetés, différés ou remplacés par un acteur habilité :

- la Question scientifique engageant le projet ;
- la hiérarchie des Objectifs ;
- les Hypothèses structurantes ;
- le Plan d’étude et la Population d’étude ;
- le Critère de jugement principal ;
- l’acceptation d’un Compromis structurant ;
- l’acceptation d’une Incertitude ou d’un Risque résiduel critique ;
- le choix entre Options non dominées ;
- la clôture d’une Contradiction structurante ;
- l’adoption d’une Stratégie scientifique ;
- l’adoption d’un Protocole d’imagerie ;
- le gel d’une Version de stratégie destinée à une Projection engageante.

### 14.3 Revue, avis et décision

Une Contribution, une Recommandation, une Revue méthodologique et une Décision ne sont pas interchangeables.

- Une Contribution apporte un contenu ou un avis.
- Une Recommandation propose une action argumentée.
- Une Revue méthodologique examine un périmètre et produit des constats.
- Une Décision engage la stratégie dans le périmètre du Mandat.

L’absence d’objection, l’absence de réponse ou la fin d’une revue ne créent jamais une Décision implicite.

### 14.4 Escalade humaine obligatoire

Le moteur demande une intervention humaine lorsque :

- le Mandat décisionnel manque ou se contredit ;
- une décision dépend d’une préférence ou valeur que le moteur ne peut établir ;
- une Controverse ou Contradiction structurante ne peut être réduite ;
- le Domaine de validité est incertain pour une décision à fort impact ;
- une Recommandation sensible repose sur des preuves insuffisantes ;
- un Risque méthodologique majeur doit être accepté ;
- le projet sort du périmètre documenté ;
- une question éthique, réglementaire, juridique, clinique ou institutionnelle dépasse la responsabilité du Protocol Designer ;
- l’utilisateur demande de masquer une limite, une incertitude, une alternative ou une provenance nécessaire.

### 14.5 Dérogation humaine

Un acteur habilité peut adopter une Option moins recommandée ou poursuivre sous Incertitude lorsque cette action reste licite et méthodologiquement représentable. La Décision doit alors conserver :

- la Recommandation non suivie ;
- la Justification de la dérogation ;
- les Compromis et Risques acceptés ;
- les Limites de conclusion ;
- les acteurs consultés ;
- la condition de réouverture ;
- les impacts sur la stratégie et les Projections.

Une dérogation humaine ne peut pas transformer une information absente en fait, une preuve insuffisante en preuve établie, une revue en approbation ou une action hors domaine en action autorisée.

---

## 15. Stratégies d’arrêt et refus de produire un protocole

### 15.1 Arrêt par suffisance

Le moteur s’arrête parce que le raisonnement est suffisamment instruit pour l’usage courant lorsque :

- la Décision visée peut être soumise à l’acteur compétent ;
- aucun Besoin d’information éligible ne possède un impact supérieur au coût de son traitement ;
- les Incertitudes résiduelles sont visibles et compatibles avec le niveau de conclusion ;
- les Options encore ouvertes sont soit non dominées, soit volontairement différées ;
- les Contradictions structurantes sont résolues ou explicitement maintenues hors de la portée de la Projection ;
- la prochaine étape relève d’une Décision humaine ou d’une action externe.

Cet arrêt ne signifie ni vérité, ni validation, ni complétude absolue.

### 15.2 Arrêt par impossibilité temporaire

Le moteur suspend la branche lorsque :

- une Information de projet nécessaire n’est pas disponible ;
- une source ou expertise attendue manque ;
- une Décision humaine est différée ;
- une Contrainte doit être vérifiée ;
- un Événement d’évolution est en cours d’Analyse d’impact.

L’arrêt conserve le dernier état cohérent, le Besoin d’information, le responsable attendu, la condition de reprise et les branches indépendantes pouvant continuer.

### 15.3 Arrêt par limite de connaissance ou de domaine

Le moteur arrête la recommandation lorsque :

- les preuves applicables sont insuffisamment documentées ;
- le Domaine de validité ne couvre pas le projet ;
- une Controverse critique interdit une recommandation unique ;
- le risque d’extrapolation dépasse la conclusion demandée ;
- le projet exige une expertise clinique, réglementaire, éthique ou institutionnelle.

La sortie correcte est une Limite expliquée, les Options encore défendables, les données nécessaires et l’acteur humain à solliciter.

### 15.4 Arrêt par absence de valeur supplémentaire

Le moteur ne poursuit pas un interrogatoire lorsque :

- aucune question restante ne modifie une Décision ou une conclusion ;
- les seules inconnues sont descriptives ou concernent des branches fermées ;
- plusieurs Options resteront équivalentes quelle que soit la réponse accessible ;
- la réduction attendue d’une Incertitude est inférieure à la charge, au délai ou au risque de la collecte ;
- une Projection provisoire répond honnêtement à l’usage demandé.

### 15.5 Conditions absolues de refus d’une projection protocolaire

Le moteur refuse de produire ou de présenter un Protocole d’imagerie si au moins une des conditions suivantes est vraie :

1. la Situation de recherche n’a pas conduit à une Intention et une Question scientifique suffisamment explicites ;
2. les Objectifs ou Hypothèses structurants ne sont pas reliés ;
3. la Population, le Plan d’étude ou le temps d’observation nécessaire au Critère principal restent indéterminés ;
4. une Acquisition indispensable ne possède pas de chaîne de Justification vers un Objectif, une Hypothèse, un Biomarqueur, une Variable ou un Critère ;
5. une Recommandation structurante ne possède pas de Domaine de validité, d’alternative ou de preuve reconstructible ;
6. une Information critique inconnue est remplacée par une supposition non déclarée ;
7. une Contradiction structurante ou une Alerte bloquante reste non arbitrée ;
8. une Incertitude rend la conclusion attendue plus forte que les connaissances disponibles ;
9. les Contrôles qualité, Conditions de mesure ou conséquences d’un échec ne sont pas définis pour un usage critique ;
10. les Analyses ou Règles d’interprétation ne permettent pas de relier les Variables aux Hypothèses sans raccourci ;
11. les Risques, Biais ou Limites critiques sont masqués ou non attribués ;
12. aucune Revue méthodologique adaptée n’a examiné la Version de stratégie lorsque la portée l’exige ;
13. les Décisions structurantes n’ont pas d’acteur habilité ou de Mandat décisionnel ;
14. une modification récente n’a pas fait l’objet de l’Analyse d’impact nécessaire ;
15. la Projection demandée prétend à une validation clinique, réglementaire ou institutionnelle que NOXIA ne peut fournir ;
16. le projet est hors du domaine documenté ou demande une recommandation clinique individuelle ;
17. l’utilisateur exige la suppression d’une Incertitude, d’une Contradiction, d’une Option, d’une Limite ou d’une provenance structurante.

### 15.6 Contenu obligatoire du refus

Un refus doit présenter :

- la raison exacte ;
- les objets et invariants concernés ;
- ce qui reste utilisable dans le raisonnement ;
- les conclusions rendues impossibles ou fragiles ;
- les informations, preuves, décisions ou revues nécessaires ;
- l’acteur ou le Mandat attendu ;
- la condition de reprise ;
- les Options de réduction de portée, si elles existent ;
- la date, la Version de stratégie et l’État de connaissance effectif.

Le refus n’efface rien, ne sanctionne pas l’utilisateur et ne fabrique pas un protocole « à titre indicatif ».

---

## 16. Algorithme conceptuel

L’algorithme suivant décrit une logique métier. Il ne constitue ni pseudo-code exécutable, ni choix d’implémentation.

### Étape 1 — Ancrer l’état

Identifier le Dossier de recherche, la Version de stratégie active, l’État de connaissance effectif, la Projection recherchée et les Mandats décisionnels applicables.

### Étape 2 — Vérifier l’entrée et le domaine

Qualifier la Situation de recherche, l’Intention scientifique, le périmètre méthodologique et les limites de responsabilité. Si la demande sort du domaine, préparer l’arrêt ou l’escalade avant toute recommandation.

### Étape 3 — Construire le sous-graphe pertinent

À partir de la Question et de la Projection demandée, sélectionner les objets et Dépendances capables d’influencer l’usage courant. Conserver les liens vers le reste de la stratégie sans charger la décision de détails inactifs.

### Étape 4 — Contrôler les invariants applicables

Examiner les invariants de PD-003 nécessaires à la phase et à la Projection. Une violation crée ou actualise une Incertitude, une Contradiction, une Limite ou une Alerte méthodologique selon sa nature.

### Étape 5 — Identifier les Décisions ouvertes

Pour chaque Décision ouverte, déterminer les Options, Justifications, informations, connaissances, Mandats et Dépendances encore nécessaires.

### Étape 6 — Identifier les actions non interrogatives

Avant de questionner l’utilisateur, vérifier si le progrès exige plutôt :

- la construction d’un objet à partir d’informations disponibles ;
- une comparaison d’Options ;
- une Analyse d’impact ;
- une Revue méthodologique ;
- la consultation d’une Source ou Preuve ;
- une Décision humaine déjà mûre.

### Étape 7 — Construire les Besoins d’information

Créer ou réviser uniquement les Besoins justifiés par une Dépendance, une Incertitude, une Contradiction, une Alerte, une Revue, une Décision ou un Événement d’évolution.

### Étape 8 — Tester l’éligibilité des questions

Éliminer les besoins redondants, déjà satisfaits, sans impact, propres à une branche fermée, adressés au mauvais acteur ou disproportionnés.

### Étape 9 — Comparer la valeur de l’information

Pour chaque candidat restant, documenter le caractère bloquant, la discrimination des Options, la portée d’impact, la réductibilité, l’irréversibilité, l’urgence, la charge, la sensibilité et la valeur pédagogique utile.

### Étape 10 — Choisir une action principale

Appliquer l’ordre lexicographique de la section 10.5 et retenir une seule action principale. Conserver la raison de non-sélection des principales alternatives.

### Étape 11 — Exécuter sans dépasser la responsabilité

- s’il s’agit d’une question, créer un Échange adaptatif ;
- s’il s’agit d’une comparaison, instruire les Options et Compromis ;
- s’il s’agit d’une revue, produire une Revue méthodologique sans modifier les objets examinés ;
- s’il s’agit d’un arbitrage, demander une Décision à l’acteur habilité ;
- s’il s’agit d’un arrêt, produire la Limite, l’Alerte ou le Besoin correspondant.

### Étape 12 — Qualifier le résultat

Transformer la réponse ou le résultat en Contribution, Information de projet, connaissance, Recommandation, Décision ou autre objet canonique approprié. Conserver provenance, état, confiance, date et contexte.

### Étape 13 — Propager l’impact

Si le résultat modifie un objet ou une relation, créer un Événement d’évolution, effectuer l’Analyse d’impact, rouvrir les Décisions affectées et identifier les Projections obsolètes.

### Étape 14 — Réévaluer la stabilité

Reprendre les étapes 3 à 10 jusqu’à l’une des conditions suivantes :

- une Décision humaine est mûre ;
- une Projection provisoire est honnêtement possible ;
- aucun Besoin éligible n’apporte de valeur supplémentaire ;
- une intervention humaine ou externe est nécessaire ;
- une condition d’arrêt ou de refus est satisfaite.

### Étape 15 — Gérer la projection demandée

Pour toute Projection, vérifier sa Version de stratégie, son État de connaissance effectif, son Profil de projection et ses limites. Pour un Protocole d’imagerie, appliquer en plus toutes les conditions de la section 15.5.

### Étape 16 — Figer sans effacer

Lorsque les responsables humains le décident, créer une Version de stratégie immuable et produire la Projection. Toute évolution ultérieure recommence par un Événement d’évolution et une Analyse d’impact.

---

## 17. Traçabilité et reproductibilité complète

### 17.1 Trace de navigation minimale

Chaque action sélectionnée doit permettre de reconstruire :

- la Version de stratégie et l’État de connaissance effectif lus ;
- la Question et la Projection qui définissaient le périmètre ;
- les Décisions ouvertes ;
- les invariants et Règles méthodologiques appliqués ;
- les Besoins d’information candidats ;
- les candidats écartés et leur motif ;
- le vecteur qualitatif de valeur du candidat retenu ;
- l’action sélectionnée et son responsable ;
- les objets lus, produits ou révisés ;
- les impacts prévus et observés ;
- les Incertitudes, Contradictions et Limites restantes ;
- la condition de reprise, de nouvelle revue ou d’arrêt.

Cette trace ne constitue pas un objet supplémentaire. Elle est portée par la combinaison des objets canoniques : le Besoin d’information et l’Échange adaptatif conservent le motif et l’effet d’une question ; la Justification conserve le choix et les principales Options non retenues ; la Règle méthodologique conserve la règle appliquée ; la Contribution et l’Information de projet conservent le résultat et sa provenance ; l’Événement d’évolution et l’Analyse d’impact conservent la propagation ; la Revue méthodologique, l’Alerte méthodologique ou la Limite conservent les arrêts ; la Version de stratégie et l’État de connaissance effectif figent le contexte reconstructible.

### 17.2 Reproductibilité décisionnelle

À objets, versions, règles, contexte et Projection identiques, le moteur doit produire :

- le même ensemble d’actions admissibles ;
- les mêmes exclusions ;
- le même ordre de priorité qualitatif ;
- le même constat d’égalité lorsque le départage relève d’une préférence humaine ;
- les mêmes motifs d’arrêt ou de refus.

Une variation rédactionnelle d’un Échange adaptatif n’est pas une variation de décision si le Besoin, les réponses possibles, la portée et les conséquences restent identiques.

### 17.3 Explicabilité

Le moteur doit pouvoir répondre pour toute action :

1. Pourquoi cette action ?
2. Pourquoi maintenant ?
3. Quelle Décision ou Incertitude influence-t-elle ?
4. Pourquoi pas l’action alternative principale ?
5. Que se passe-t-il si elle est différée ?
6. Qui conserve la responsabilité ?
7. Qu’est-ce qui déclenchera la prochaine réévaluation ?

### 17.4 Aucune règle cachée

Toute règle ayant modifié une priorité, bloqué une Projection, propagé un impact ou déclenché une escalade doit être représentable par une Règle méthodologique avec fondement, Domaine de validité, exceptions, version et période d’effet.

Une préférence technique, un comportement de modèle ou une convention d’interface ne peut pas devenir une Règle méthodologique sans gouvernance explicite.

---

## 18. Relation avec PD-003, PD-004, PD-005 et une future architecture technique

### 18.1 PD-003 — autorité sur les objets

PD-003 définit les objets, relations, états, cycles de vie et invariants. PD-009 ne peut ni les renommer, ni les étendre silencieusement, ni créer une seconde ontologie.

Si une future nécessité décisionnelle ne peut pas être représentée par PD-003, la procédure correcte consiste à proposer d’abord une évolution explicite de PD-003. PD-009 ne doit pas contourner cette absence.

### 18.2 PD-004 — autorité sur l’expérience

PD-009 sélectionne le contenu et le moment de la prochaine action. PD-004 gouverne sa présentation : une question principale, progressive disclosure, charge cognitive, affichage de l’incertitude, accessibilité, récupération et microcopie.

Une règle UX ne peut pas changer la priorité scientifique ; une règle décisionnelle ne peut pas justifier une interface qui masque une limite critique.

### 18.3 PD-005 — fournisseur de capacités, pas autorité de navigation

PD-005 peut décrire des rôles capables de :

- produire une Contribution ;
- proposer ou réviser un objet ;
- rechercher ou qualifier une preuve ;
- comparer des Options ;
- conduire une Revue méthodologique ;
- rédiger une Projection.

Le Decision Engine sélectionne l’action scientifique nécessaire. L’orchestration propre à la Prompt Library peut ensuite choisir le rôle ou la composition de rôles capables de réaliser cette action. Le résultat retourne au Decision Engine sous forme d’objets PD-003 qualifiés.

Aucun rôle de PD-005 ne peut :

- choisir seul la prochaine question ;
- fermer une branche scientifique ;
- déclarer la suffisance du raisonnement ;
- autoriser ou refuser seul un Protocole d’imagerie ;
- transformer sa sortie en Décision humaine ;
- créer un alias métier concurrent de PD-003.

### 18.4 PD-007 et future architecture technique

PD-007 gouverne la première tranche verticale, son sous-ensemble d’objets, ses écrans, ses gates et ses conditions d’admission. Il projette les règles de PD-009 dans le cas Fabry sans devenir l’autorité générale de navigation.

La frontière est la suivante :

- PD-009 décide conceptuellement quelle action scientifique est admissible, prioritaire ou interdite ;
- PD-007 sélectionne quelles parties de cette logique sont nécessaires dans la tranche V1 et comment leur présence sera démontrée ;
- PD-005 décrit les capacités IA susceptibles d’exécuter une action ;
- une future architecture technique définit persistance, moteur de règles, calcul, événements, files de travail, performances et interfaces.

Une prochaine version de PD-007 devra référencer PD-009 parmi ses normes supérieures, appliquer son arbitrage sur la navigation et résoudre les dettes de conformité de la section 0.4 avant l’implémentation correspondante. Tant que cette révision n’existe pas, PD-009 prime sur la navigation et PD-007 reste autoritatif uniquement sur le périmètre de la tranche V1 qui ne la contredit pas.

---

## 19. Cas de référence et critères d’acceptation conceptuels

### 19.1 Question utile

**Situation :** deux populations possibles conduisent à des Critères de jugement et Domaines de validité différents.  
**Attendu :** le moteur crée un Besoin d’information, explique les Décisions affectées et pose la question avant toute sélection de Biomarqueur.

### 19.2 Question inutile

**Situation :** une information descriptive n’affecte aucune Dépendance vers la stratégie ou la Projection courante.  
**Attendu :** le moteur ne la demande pas et conserve, si nécessaire, l’Incertitude sans priorité.

### 19.3 Information déjà connue

**Situation :** la réponse existe avec provenance et période de validité compatibles.  
**Attendu :** le moteur la réutilise, rappelle sa source si nécessaire et ne repose pas la question.

### 19.4 Réponse contradictoire

**Situation :** une nouvelle Contribution contredit une Information de projet active dans le même contexte.  
**Attendu :** aucune information n’est écrasée ; une Contradiction est créée, l’impact est propagé et un arbitrage adapté est demandé.

### 19.5 Deux Options non dominées

**Situation :** une Option maximise la précision et l’autre la faisabilité multicentrique.  
**Attendu :** le moteur expose le Compromis, ne produit pas de gagnant global et demande une Décision humaine si le choix devient nécessaire.

### 19.6 Égalité sans information discriminante

**Situation :** toutes les informations accessibles laisseraient les deux Options équivalentes.  
**Attendu :** arrêt du questionnement, égalité conservée et décision différée ou humaine.

### 19.7 Changement amont

**Situation :** l’Objectif principal change après une première stratégie.  
**Attendu :** Événement d’évolution, Analyse d’impact, réouverture ciblée des Critères, Variables, Acquisitions, Analyses, Dimensionnement et Justifications ; aucune réécriture de la version antérieure.

### 19.8 Preuve corrigée

**Situation :** une Source scientifique utilisée est corrigée ou rétractée.  
**Attendu :** nouvel État de connaissance effectif, Analyse d’impact sur les Énoncés, Justifications, Recommandations et stratégies utilisatrices ; décisions passées conservées dans leur contexte.

### 19.9 Mandat absent

**Situation :** une Option doit être choisie, mais aucun Acteur ne possède le Mandat nécessaire.  
**Attendu :** aucune Décision implicite ; demande de gouvernance humaine et arrêt de la branche engageante.

### 19.10 Refus de protocole

**Situation :** l’utilisateur demande un Protocole d’imagerie alors que l’Objectif principal et le Critère de jugement restent ambigus.  
**Attendu :** refus explicite, objets bloquants nommés, travail conservé et condition de reprise décrite.

### 19.11 Projection provisoire

**Situation :** une synthèse de discussion est demandée malgré plusieurs inconnues non bloquantes.  
**Attendu :** Projection possible, qualifiée d’incomplète, avec Incertitudes, Limites, Décisions ouvertes, Version de stratégie et État de connaissance effectif.

### 19.12 Indépendance du modèle

**Situation :** la capacité chargée de formuler une question est remplacée.  
**Attendu :** le Besoin d’information sélectionné, sa priorité, ses conséquences et les conditions d’arrêt restent identiques.

### 19.13 Reproductibilité

**Situation :** le même état est réévalué avec les mêmes règles.  
**Attendu :** mêmes actions admissibles, mêmes exclusions, même ordre qualitatif et même constat d’égalité éventuel.

### 19.14 Aucun chemin vers un protocole

**Situation :** la demande est uniquement de comprendre ou comparer des phénomènes sans construire de stratégie d’acquisition.  
**Attendu :** le moteur s’arrête sur une Projection adaptée et ne pousse pas vers un Protocole d’imagerie.

---

## 20. Hypothèses d’architecture à valider

Les éléments suivants sont des hypothèses, pas des principes établis ni des capacités livrées :

1. le vecteur qualitatif de valeur de l’information permet à des experts différents de sélectionner la même prochaine action sur une majorité de cas ;
2. l’ordre lexicographique réduit les questions inutiles sans augmenter les omissions critiques ;
3. la séparation entre impact décisionnel et charge produit un parcours plus court et mieux compris qu’un questionnaire fixe ;
4. les ensembles minimaux de propagation issus de PD-003 suffisent pour limiter les recalculs sans manquer d’impact indirect ;
5. le critère d’arrêt par absence de valeur supplémentaire peut être appliqué de façon reproductible sans seuil numérique global ;
6. les utilisateurs comprennent la différence entre Recommandation, Revue méthodologique et Décision ;
7. les acteurs acceptent plus facilement un refus de protocole lorsque les objets bloquants et la condition de reprise sont explicites ;
8. une présentation qualitative des Options non dominées évite mieux la fausse optimalité qu’un score pondéré ;
9. l’emploi exclusif des objets PD-003 couvre tous les besoins de navigation sans nouvel objet métier ;
10. la séparation PD-009/PD-005 reste opérationnelle lorsque plusieurs capacités techniques peuvent produire la même Contribution.

Ces hypothèses devront être éprouvées par des cas versionnés, des arbitrages d’experts et des tests de compréhension. Un résultat de test ne devient pas une règle normative sans décision documentaire explicite.

---

## 21. Gouvernance et règles d’évolution

### 21.1 Ce qui fait évoluer PD-009

PD-009 évolue lorsqu’une décision explicite modifie :

- la responsabilité du Decision Engine ;
- les critères d’éligibilité ou de priorité d’une action ;
- la méthode de réduction d’incertitude ;
- les règles de propagation des impacts ;
- la gestion des Options, Contradictions ou escalades humaines ;
- les conditions d’arrêt ou de refus protocolaire ;
- la relation d’autorité avec PD-003, PD-004, PD-005 ou une future architecture technique ;
- les exigences de traçabilité ou de reproductibilité décisionnelle.

### 21.2 Ce qui ne doit jamais faire évoluer PD-009

PD-009 ne doit pas évoluer pour :

- changer de modèle, de prompt ou de fournisseur ;
- ajouter une API, une base de données, une file ou un composant ;
- reformuler une question sans modifier son Besoin d’information ;
- corriger une sortie ponctuelle d’un rôle ;
- adapter une interface, une microcopie ou une projection conforme ;
- intégrer un nouveau corpus scientifique sans changement de logique ;
- accélérer un parcours en masquant une Incertitude ;
- refléter une implémentation momentanée non conforme ;
- produire un protocole plus rapidement.

### 21.3 Procédure d’évolution

Toute évolution normative doit :

1. identifier la règle actuelle et le problème observé ;
2. citer les objets PD-003 et documents supérieurs concernés ;
3. distinguer principe, cible, état implémenté et hypothèse ;
4. analyser les effets sur PD-004, PD-005, la Product Specification et les projections ;
5. documenter les alternatives et contradictions ;
6. obtenir l’arbitrage humain approprié ;
7. créer une nouvelle version de PD-009 sans réécrire silencieusement l’historique ;
8. mettre à jour le SOURCE-OF-TRUTH-INDEX si l’autorité, le nom, la source maîtresse ou les relations documentaires changent ;
9. réévaluer les cas de référence ;
10. ne déclarer aucune implémentation sans preuve distincte.

### 21.4 Source maîtresse et éditions

Le présent fichier Markdown est l’unique source maîtresse de PD-009. Aucune édition DOCX ou PDF officielle n’existe à la date d’effet.

Toute future édition dérivée devra :

- être enregistrée dans le SOURCE-OF-TRUTH-INDEX ;
- rester sémantiquement identique à la présente source ;
- être régénérée après toute évolution validée ;
- ne jamais recevoir seule une correction de fond.

---

## 22. Résumé normatif

Le Decision Engine est la logique de navigation scientifique du Protocol Designer.

Il :

- lit une Version de stratégie et un État de connaissance effectif ;
- raisonne exclusivement sur les objets et relations de PD-003 ;
- identifie les Décisions ouvertes et leurs Dépendances ;
- transforme les lacunes utiles en Besoins d’information ;
- sélectionne une question uniquement lorsque les réponses peuvent modifier le raisonnement ;
- compare la valeur de l’information sans score opaque ni probabilité inventée ;
- maintient plusieurs Options dans une seule Stratégie scientifique ;
- propage tout changement par Événement d’évolution et Analyse d’impact ;
- demande une Décision humaine dès qu’un choix engage une responsabilité, une préférence ou un risque ;
- s’arrête lorsqu’aucune information supplémentaire n’a de valeur décisionnelle suffisante ;
- refuse un Protocole d’imagerie lorsque les invariants nécessaires ne sont pas satisfaits ;
- conserve une trace complète de ce qui a été considéré, choisi, différé, refusé et modifié.

Il ne :

- crée pas un agent IA ;
- ne contient ni prompt ni API ;
- ne dépend d’aucun modèle ;
- ne produit pas de connaissance scientifique ;
- ne prend pas de Décision à la place du chercheur ;
- ne transforme pas la progression en score ;
- ne résout pas silencieusement une Contradiction ;
- ne confond pas une stratégie suffisamment instruite avec une stratégie approuvée.

La prochaine question n’est donc jamais « la prochaine question du questionnaire ». C’est l’action d’information dont l’effet attendu sur une Décision est le plus important, le plus explicable et le plus proportionné dans l’état courant du raisonnement.
