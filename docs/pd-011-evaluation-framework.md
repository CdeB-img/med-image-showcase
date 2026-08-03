# PD-011 — Evaluation Framework

## Cadre officiel d’évaluation scientifique de NOXIA

**Statut :** REFERENCE_NORMATIVE — OFFICIAL

**Niveau documentaire :** niveau 1 — référence normative spécialisée

**Version :** 1.0

**Date d’effet :** 2 août 2026

**Autorité :** gouvernance de l’évaluation scientifique de NOXIA

**Source maîtresse :** `docs/pd-011-evaluation-framework.md`

**Périmètre :** démonstration, qualification, comparaison et non-régression de la valeur scientifique du Protocol Designer

**Principe directeur :** la valeur de NOXIA se démontre par des décisions mieux fondées, plus traçables, plus lucides et plus reproductibles — jamais par la seule production d’une réponse

---

## 1. Fonction normative

PD-011 définit le contrat officiel selon lequel NOXIA doit être évalué avant toute publication d’une nouvelle version ou toute affirmation de valeur scientifique.

Il gouverne :

- la constitution et le cycle de vie des jeux de cas ;
- la construction des références d’évaluation expertes ;
- les cas experts, contradictoires, impossibles et incomplets ;
- les scénarios multicentriques et Core Lab ;
- les métriques scientifiques et d’utilité ;
- les comparaisons avec les référentiels humains et documentaires ;
- les protocoles de benchmark ;
- les critères de réussite et d’échec ;
- les jeux de validation aveugles ;
- les contrats de non-régression scientifique ;
- la décision de publication d’une version.

PD-011 ne démontre pas que NOXIA satisfait déjà ces exigences. Il définit ce qui devra être démontré, avec quelles preuves et sous quelle gouvernance.

Une version ne peut pas se déclarer « scientifiquement validée » parce qu’elle produit des réponses plausibles, parce que ses utilisateurs l’apprécient, parce qu’elle est rapide ou parce qu’elle réussit quelques exemples connus. Elle doit satisfaire le présent cadre dans le périmètre exact de la revendication annoncée.

---

## 2. Position dans la gouvernance documentaire

### 2.1 Principes établis

Les constitutions de NOXIA imposent les principes non négociables suivants :

1. la science précède la production ;
2. le raisonnement doit être transparent, traçable et contextualisé ;
3. une donnée absente ne peut pas être remplacée silencieusement par une hypothèse ;
4. une incertitude, une controverse ou une impossibilité peut légitimement interrompre le raisonnement ;
5. une recommandation doit exposer sa justification, ses preuves, ses alternatives, ses limites et son domaine de validité ;
6. le chercheur, le radiologue, le méthodologiste ou le Core Lab reste décisionnaire ;
7. une même situation scientifique doit conduire à un raisonnement scientifiquement reproductible ;
8. la valeur de NOXIA réside dans la qualité du raisonnement, pas dans le nombre de sorties produites.

Ces principes constituent les contraintes supérieures de toute métrique et de tout benchmark.

### 2.2 Références normatives coordonnées

PD-011 applique, sans les remplacer :

- la Product Specification, pour la cible produit, les parcours, les états et les critères d’acceptation ;
- PD-003, pour les objets métier, les relations canoniques, les chaînes scientifique et argumentative, le versionnement et la traçabilité ;
- PD-004, pour la compréhension, la visibilité des états incomplets ou contradictoires, l’accessibilité et la qualité des projections ;
- PD-009, pour la sélection de la prochaine action scientifique, la valeur de l’information, les branches, la propagation des impacts, les arrêts et le refus protocolaire ;
- PD-005, pour les responsabilités des rôles, leurs portes de passage, leurs règles d’arrêt et leurs jeux d’évaluation versionnés ;
- PD-007, pour le périmètre, les contrats, les gates et les tests candidats de la première tranche verticale Fabry ;
- la Scientific Assertion Layer et le Scientific Knowledge Graph, pour la distinction entre source, preuve, assertion, contexte, qualification, contradiction et obsolescence.

PD-011 est spécialisé sur l’évaluation. Il peut définir des unités propres au benchmark, mais il ne redéfinit aucun objet métier canonique de PD-003 ni aucune règle de navigation de PD-009.

### 2.3 Corpus scientifique daté

PD-002 — Reasoning Book Fabry et PD-008 — Reasoning Book Myocardite constituent deux exemples datés de raisonnement scientifique complet. Ils peuvent alimenter des cas de référence, des cas paradoxaux, des portes de refus et des erreurs de catégorie dans leur domaine respectif. Leur contenu arrêté au 2 août 2026 ne doit pas être généralisé à d’autres domaines ni réutilisé ultérieurement sans vérification de l’état effectif des preuves. Le PDF de PD-008 est une édition de lecture dérivée ; il n’introduit aucune autorité scientifique distincte de son DOCX maître.

### 2.4 Cibles et état réellement démontré

La Product Specification, PD-009, PD-005 et PD-007 décrivent des capacités ou tranches cibles. Elles ne prouvent ni l’existence d’un moteur décisionnel ou de rôles opérationnels, ni l’implémentation de la tranche Fabry, ni l’existence d’un système d’évaluation, ni la réussite d’un benchmark.

À la date d’effet de PD-011, le dépôt contient des benchmarks de nature industrielle et des territoires documentaires relatifs à l’évaluation de systèmes scientifiques. Aucun de ces éléments ne constitue un jeu officiel d’évaluation du Protocol Designer, un résultat comparatif contre les cinq référentiels définis ici, ni une preuve de conformité à PD-011.

L’état initial officiel est donc : **cadre normatif créé ; performance de NOXIA non démontrée au titre de PD-011**.

### 2.5 Hypothèses à ne pas transformer en normes silencieuses

Les éléments suivants restent des hypothèses tant qu’ils n’ont pas été calibrés et approuvés dans un protocole d’évaluation versionné :

- la taille nécessaire de chaque jeu ;
- le nombre d’exécutions répétées ;
- une marge de non-infériorité ;
- un gain de temps minimal ;
- un seuil continu de qualité ou de stabilité ;
- l’importance relative d’une dimension dans un domaine particulier ;
- la transférabilité d’un résultat d’un domaine, d’un centre ou d’un public vers un autre.

PD-011 impose la méthode de détermination de ces seuils. Il n’invente pas de valeur universelle sans base empirique.

---

## 3. Question centrale et définition de la valeur

### 3.1 Question centrale

La question officielle est :

> Dans un contexte scientifique défini, pour un utilisateur défini et face à une décision définie, NOXIA améliore-t-il de manière objectivement démontrable la qualité, la traçabilité, la lucidité, la reproductibilité ou l’efficience du raisonnement, sans introduire de risque scientifique inacceptable ?

### 3.2 Valeur scientifique

NOXIA apporte une valeur scientifique lorsqu’au moins un bénéfice primaire préspécifié est démontré et que toutes les dimensions critiques restent recevables.

Les bénéfices admissibles sont :

- une meilleure exactitude scientifique ;
- une meilleure détection des hypothèses concurrentes, des inconnues, des contradictions, des risques ou des biais ;
- une justification plus complète et mieux reliée aux preuves ;
- une décision de meilleure qualité ;
- une meilleure reproductibilité ou cohérence ;
- un gain de temps à qualité scientifique non dégradée ;
- une réduction du temps de correction ou d’adjudication ;
- une meilleure compréhension par le destinataire ;
- une meilleure harmonisation multicentrique ou Core Lab sans effacement des contraintes locales.

Un bénéfice dans une dimension ne compense jamais une dégradation critique dans une autre. Il n’existe aucun score global de « valeur NOXIA ».

### 3.3 Objet réel de la comparaison

Le mode d’usage prévu de NOXIA conserve une décision humaine explicite. L’évaluation distingue donc obligatoirement :

1. **la sortie candidate NOXIA**, observée avant correction ou adoption humaine ;
2. **la décision finale assistée par NOXIA**, produite par l’utilisateur responsable ;
3. **la décision du même type d’utilisateur sans NOXIA**, lorsque le plan comparatif le permet ;
4. **les référentiels externes**, définis en section 11.

Une comparaison limitée à la sortie candidate mesure une capacité de proposition. Elle ne suffit pas à démontrer la valeur du produit dans son usage prévu.

### 3.4 Revendication bornée

Toute affirmation de valeur doit nommer :

- la version évaluée ;
- le domaine scientifique ;
- le type de question et de décision ;
- la population de cas ;
- le profil utilisateur ;
- les informations et outils disponibles ;
- le comparateur ;
- la métrique primaire ;
- le jeu de validation ;
- la date d’état des connaissances ;
- l’effet observé, son incertitude et ses limites.

Les formulations générales telles que « NOXIA est meilleur qu’un radiologue » ou « NOXIA remplace un Core Lab » sont interdites.

---

## 4. Unités gouvernées de l’évaluation

Ces unités sont propres au domaine du benchmark. Elles s’appuient sur les objets métier de PD-003 sans les modifier.

### 4.1 Cas d’évaluation

Un cas d’évaluation est une situation scientifique versionnée qui soumet NOXIA et les comparateurs à une intention, un contexte, des informations disponibles, des contraintes et une ou plusieurs décisions observables.

Il ne se réduit pas à une question accompagnée d’une réponse attendue.

### 4.2 Fiche de cas

Toute fiche de cas contient au minimum :

- un identifiant stable et une version ;
- la provenance du cas et ses conditions d’utilisation ;
- le domaine, la population, le contexte et la temporalité ;
- l’intention, la question et la décision évaluée ;
- les informations connues, supposées, manquantes et contradictoires ;
- les contraintes scientifiques, opérationnelles et multicentriques ;
- l’état de connaissance effectif et sa date ;
- les objets métier attendus ou concernés ;
- les invariants scientifiques obligatoires ;
- les éléments indispensables, admissibles et interdits ;
- les hypothèses principales et concurrentes à considérer ;
- les inconnues qui doivent rester inconnues ;
- les situations de refus, d’arrêt ou d’escalade attendues ;
- la référence d’évaluation et ses variantes admissibles ;
- les erreurs critiques possibles ;
- les métriques applicables ;
- le niveau de difficulté et la famille de cas ;
- le jeu auquel le cas appartient ;
- les experts responsables de sa référence, avec leurs conflits déclarés ;
- son historique de révision, d’exposition et de retrait.

### 4.3 Référence d’évaluation

Le terme **référence d’évaluation** est préféré à « vérité terrain » lorsqu’une situation scientifique admet plusieurs raisonnements recevables.

Une référence d’évaluation comprend :

- les faits et relations tenus pour établis dans le cas ;
- les preuves et localisateurs pertinents ;
- les interprétations recevables ;
- les décisions admissibles ;
- les variantes équivalentes ;
- les conclusions interdites ;
- les inconnues irréductibles ;
- les contradictions à conserver ;
- les conditions qui imposent un arrêt ou une escalade ;
- la sévérité de chaque écart possible.

Elle décrit un espace de réponses scientifiquement admissibles. Elle ne force pas une réponse unique lorsque la science n’en fournit pas.

### 4.4 Unité de jugement

L’unité de jugement est le plus petit élément évalué sans perdre son sens scientifique : assertion, qualification de preuve, hypothèse, inconnue, contradiction, recommandation, justification, décision, refus, règle d’harmonisation ou impact de changement.

Les métriques sont calculées sur ces unités et agrégées uniquement par dimension homogène.

### 4.5 Exécution d’évaluation

Une exécution associe de façon reconstructible :

- une version de NOXIA ;
- une version de cas ;
- une version de la référence d’évaluation ;
- un état de connaissance daté ;
- les informations effectivement fournies ;
- le profil et le mandat de l’utilisateur ;
- les décisions humaines intervenues ;
- les sorties successives ;
- les durées et incidents ;
- les résultats de jugement.

### 4.6 Campagne d’évaluation

Une campagne est un protocole préspécifié appliqué à un ensemble versionné de cas, de comparateurs et de métriques. Elle produit un rapport d’évaluation, mais jamais sa propre autorisation de publication.

### 4.7 Contrat de non-régression

Un contrat de non-régression est une exigence scientifique stable liant une situation, un invariant, une sortie attendue ou interdite, une sévérité et une règle de décision. Il reste applicable aux versions futures jusqu’à son retrait explicitement justifié.

### 4.8 Dossier de preuve de version

Le dossier de preuve réunit les éléments permettant à une instance indépendante de reconstruire la campagne, d’en vérifier la recevabilité et de comprendre la décision de publication.

---

## 5. Architecture des jeux de cas

### 5.1 Principes de constitution

Un jeu de cas doit être :

- représentatif du domaine et de l’usage revendiqués ;
- suffisamment divers pour exposer les cas non heureux ;
- stratifié selon les facteurs susceptibles de modifier le raisonnement ;
- indépendant des exemples utilisés pour construire ou ajuster la version ;
- versionné et traçable ;
- protégé contre l’exposition prématurée ;
- accompagné d’une référence d’évaluation experte ;
- dimensionné selon une justification méthodologique préalable ;
- révisable sans réécriture silencieuse de ses résultats historiques.

Une collection de cas faciles ou démonstratifs ne constitue pas un jeu de validation.

### 5.2 Jeux officiels

| Jeu | Fonction | Accès avant évaluation | Effet sur la publication |
|---|---|---|---|
| Jeu de développement | Comprendre les erreurs et améliorer le raisonnement | Ouvert aux équipes de conception | Aucun résultat de publication |
| Jeu de qualification | Vérifier qu’une version est prête à entrer en validation | Contrôlé ; peut être connu des responsables d’évaluation | Autorise ou refuse l’ouverture du jeu aveugle |
| Jeu de validation aveugle | Mesurer les critères officiels sur des cas non exposés | Référence et résultats cachés aux participants évalués | Porte la décision principale |
| Jeu externe multicentrique | Tester la transportabilité entre centres, matériels, pratiques et populations | Conservé par des partenaires indépendants lorsque possible | Conditionne les revendications multicentriques |
| Jeu Core Lab | Évaluer harmonisation, qualification, contrôle, déviation, lecture et adjudication | Gouverné avec une expertise Core Lab indépendante | Conditionne les revendications Core Lab |
| Jeu de défi | Explorer les limites, cas adverses, longues chaînes et hors-distribution | Accès restreint | Délimite le domaine ; ne remplace pas le jeu aveugle |
| Jeu de non-régression | Rejouer les invariants et incidents connus | Stable, versionné, enrichi après incident | Obligatoire pour toute nouvelle version |
| Jeu de surveillance | Recueillir les écarts observés après publication | Alimenté sous gouvernance après usage | Déclenche correction, restriction ou nouvelle validation |

### 5.3 Séparation des jeux

Un même cas logique, une variante trop proche ou une référence directement dérivée ne doit pas apparaître des deux côtés d’une séparation entre développement et validation.

La parenté entre cas est analysée selon :

- la source initiale ;
- le scénario scientifique ;
- les faits discriminants ;
- la chaîne de raisonnement attendue ;
- les formulations et variantes ;
- les documents de référence ;
- les auteurs et centres producteurs.

Une simple reformulation ne crée pas un nouveau cas indépendant.

### 5.4 Contamination et exposition

Chaque cas possède un registre d’exposition. Toute suspicion raisonnable que la version évaluée, ses responsables ou un comparateur ont eu accès à la référence aveugle entraîne :

1. la suspension du résultat concerné ;
2. l’analyse de la contamination ;
3. la mise en quarantaine du cas ;
4. son remplacement par un cas indépendant lorsque nécessaire ;
5. la conservation de l’incident dans le rapport ;
6. la reprise de la campagne si la validité de la décision est affectée.

Une campagne contaminée ne peut pas être déclarée réussie.

### 5.5 Taille et équilibre

La taille d’un jeu n’est jamais choisie pour obtenir un résultat favorable ni par commodité. Elle est justifiée avant l’évaluation selon :

- la métrique primaire ;
- la fréquence attendue des erreurs critiques ;
- la précision souhaitée de l’intervalle d’incertitude ;
- la comparaison prévue ;
- les analyses par famille et sous-groupe ;
- le nombre de répétitions ;
- la dépendance entre observations ;
- les pertes ou cas non évaluables anticipés.

Chaque famille obligatoire doit être suffisamment représentée pour permettre sa propre décision. Une moyenne globale ne peut pas masquer une famille insuffisamment testée.

### 5.6 Origine des cas

Les jeux peuvent inclure :

- des cas réels rétrospectifs, correctement gouvernés ;
- des cas prospectifs ;
- des cas synthétiques construits pour isoler une décision ;
- des cas composites dérivés de plusieurs situations ;
- des cas publiés adaptés avec justification ;
- des cas issus d’incidents ou de quasi-incidents ;
- des cas volontairement adverses.

L’origine est toujours visible. Un cas synthétique ne doit pas être présenté comme preuve directe d’utilité en situation réelle.

### 5.7 Admission des tests PD-007

Les 39 tests normatifs de la tranche verticale Fabry constituent un **catalogue de cas candidats**. Ils alimentent en priorité les jeux de développement, de qualification et de non-régression.

Avant d’entrer dans un jeu de validation PD-011, chaque test doit recevoir :

- une fiche de cas complète ;
- une référence d’évaluation experte indépendante ;
- une qualification de sévérité ;
- des variantes admissibles ;
- une analyse de parenté avec PD-002 et les exemples de développement ;
- un statut d’exposition ;
- une place dans un jeu séparé et versionné ;
- des métriques et une règle de décision préspécifiées.

Le caractère « bloqueur de promotion » déclaré par PD-007 est conservé pour la tranche Fabry. Il ne remplace ni la validation aveugle, ni la comparaison de valeur, ni la décision de publication prévues par PD-011.

---

## 6. Familles obligatoires de cas

### 6.1 Cas de référence

Les cas de référence couvrent les raisonnements représentatifs du domaine revendiqué, depuis la clarification de la question jusqu’à la recommandation ou au refus.

Ils vérifient notamment :

- le passage intention → question → objectifs → hypothèses ;
- la sélection de la prochaine action scientifiquement utile ;
- la distinction entre phénomène, biomarqueur, variable, acquisition et analyse ;
- la construction de la chaîne argumentative ;
- l’explication des compromis ;
- la cohérence entre stratégie, protocole et rapport ;
- la conservation de la décision humaine.

Un jeu composé uniquement de cas de référence est insuffisant.

### 6.2 Cas experts

Un cas expert exige plusieurs compétences ou une chaîne de raisonnement que ne peut résoudre une règle superficielle.

Il peut comporter :

- une physiopathologie complexe ;
- plusieurs estimands possibles ;
- des preuves de qualité ou de maturité différentes ;
- une interaction entre acquisition, analyse et décision ;
- un risque de confusion causale ;
- des conséquences méthodologiques ou multicentriques ;
- plusieurs options scientifiquement recevables.

La réussite ne se mesure pas par l’identité avec le style d’un expert. Elle exige la conservation des éléments critiques, des alternatives recevables et des limites reconnues par la référence d’évaluation.

### 6.3 Cas contradictoires

Un cas contradictoire contient au moins deux informations, observations, sources ou exigences crédibles qui ne peuvent pas être fusionnées sans arbitrage.

La sortie attendue doit :

- identifier la contradiction ;
- localiser ses termes ;
- distinguer opposition réelle, différence de contexte et différence de maturité ;
- évaluer son impact sur les décisions ;
- proposer une résolution, une information complémentaire ou une escalade ;
- conserver la contradiction si elle demeure non résolue.

Toute conclusion certaine obtenue par effacement d’un terme contradictoire est un échec.

### 6.4 Cas impossibles

Un cas impossible comporte une incompatibilité irréductible entre l’objectif, les données, la méthode, la sécurité, la faisabilité ou le niveau de preuve.

La sortie correcte peut être :

- un refus de produire un protocole ;
- une reformulation de l’objectif ;
- une réduction explicite de la portée ;
- une demande de décision humaine ;
- une conclusion d’impossibilité actuelle ;
- une proposition de connaissance ou de donnée nécessaire.

Produire malgré tout une recommandation apparemment complète est un échec majeur ou critique selon son impact.

### 6.5 Cas incomplets

Un cas incomplet omet une information susceptible de modifier une décision.

L’évaluation vérifie que NOXIA :

- reconnaît le manque ;
- n’invente pas la valeur absente ;
- explique l’impact du manque ;
- distingue manque bloquant et manque enrichissant ;
- pose une question dont la réponse peut effectivement modifier le raisonnement ;
- sait poursuivre provisoirement lorsque cela reste légitime ;
- borne la conclusion obtenue.

Le nombre de champs complétés n’est pas une métrique de réussite. La qualité de la gestion de l’incomplétude l’est.

### 6.6 Cas ambigus ou indéterminés

Lorsque plusieurs attributions restent plausibles, l’état **indéterminé** ou **mixte** est attendu. Une certitude forcée constitue une dégradation scientifique, même si elle coïncide fortuitement avec une décision ultérieure.

### 6.7 Cas hors domaine

Ces cas vérifient que NOXIA reconnaît les limites de son domaine effectif, refuse une généralisation illégitime et demande l’expertise nécessaire.

### 6.8 Cas de changement décisif

Une paire de cas ne diffère que par une information qui doit modifier le raisonnement. La recommandation doit changer de manière cohérente et l’impact doit être expliqué.

### 6.9 Cas de perturbation non décisive

Une paire de cas diffère par la formulation, l’ordre de présentation ou une information sans effet scientifique. Les objets, décisions, preuves, inconnues et limites critiques doivent rester équivalents.

### 6.10 Cas de navigation décisionnelle

Ces cas éprouvent directement les hypothèses d’architecture de PD-009 : prochaine action utile, question évitée, Options non dominées, égalité persistante, propagation ciblée, Mandat absent, arrêt par suffisance et refus protocolaire.

La référence d’évaluation précise :

- l’ensemble des actions admissibles ;
- les actions interdites ou prématurées ;
- l’ordre qualitatif attendu ;
- l’acteur ou la source responsable ;
- les Décisions et Incertitudes affectées ;
- les impacts à propager ;
- la condition d’arrêt ou de reprise.

Une formulation différente de la question est admissible si le Besoin d’information, le responsable, les issues plausibles et l’impact restent identiques.

### 6.11 Couverture obligatoire

Toute validation de publication comprend, au minimum, les familles suivantes :

- référence ;
- expert ;
- contradictoire ;
- impossible ;
- incomplet ;
- changement décisif ;
- perturbation non décisive ;
- navigation décisionnelle ;
- hors domaine lorsque le produit possède une frontière de domaine ;
- multicentrique si cette revendication est faite ;
- Core Lab si cette revendication est faite.

L’absence d’une famille applicable rend l’évaluation non concluante et interdit le statut PASS.

---

## 7. Scénarios multicentriques

### 7.1 Finalité

Les scénarios multicentriques évaluent la capacité de NOXIA à préserver la question et la stratégie scientifiques lorsque les centres diffèrent, sans imposer une uniformité artificielle.

### 7.2 Dimensions à faire varier

Les cas multicentriques doivent couvrir, selon le domaine :

- populations et prévalences ;
- constructeurs, plateformes, configurations et versions ;
- pratiques locales et niveaux d’expérience ;
- références locales et intervalles de normalité ;
- disponibilités de modalités ou de séquences ;
- contraintes de contraste, de durée ou de sécurité ;
- qualité des acquisitions ;
- chaînes de lecture et d’analyse ;
- langues et terminologies ;
- calendriers, événements intercurrents et suivi ;
- données manquantes non aléatoires ;
- capacités inégales des sites.

### 7.3 Scénarios minimaux

Une revendication multicentrique exige des cas portant au moins sur :

1. un centre pleinement compatible avec la stratégie ;
2. un centre compatible sous adaptation documentée ;
3. un centre dont une contrainte menace l’estimand principal ;
4. un centre insuffisamment qualifié ;
5. une divergence de référence locale ;
6. une modification de plateforme entre deux temps ;
7. une donnée manquante concentrée dans les cas les plus complexes ;
8. un amendement appliqué à une partie des centres ;
9. une hétérogénéité qui doit être conservée plutôt qu’effacée ;
10. une impossibilité d’harmonisation imposant exclusion, stratification ou escalade.

### 7.4 Critères multicentriques

NOXIA doit :

- conserver un objectif et un estimand communs lorsqu’ils restent défendables ;
- expliciter les adaptations locales ;
- distinguer comparabilité, équivalence et simple coexistence ;
- identifier les centres ou mesures non comparables ;
- propager les impacts d’une contrainte locale ;
- préserver les différences de contexte dans les conclusions ;
- ne pas présenter comme harmonisé ce qui a seulement été uniformisé ;
- refuser une synthèse globale lorsque l’hétérogénéité la rend trompeuse.

---

## 8. Scénarios Core Lab

### 8.1 Finalité

Les scénarios Core Lab évaluent NOXIA comme soutien à une gouvernance scientifique collective, indépendante et reconstructible. Ils ne réduisent pas le Core Lab à une lecture centralisée.

### 8.2 Chaîne Core Lab obligatoire

Les cas doivent couvrir :

- la revue de la stratégie et du protocole ;
- la qualification initiale d’un centre ;
- l’harmonisation des méthodes ;
- le contrôle qualité d’une acquisition ;
- la gestion d’une déviation ;
- la lecture indépendante ;
- l’adjudication d’un désaccord ;
- la détection d’une dérive ;
- la gestion d’un changement de méthode ou de version ;
- l’analyse d’impact sur les données déjà acquises ;
- la production d’un rapport de synthèse ;
- l’escalade vers le comité scientifique.

### 8.3 Scénarios Core Lab minimaux

1. qualification acceptée avec réserves ;
2. qualification refusée pour incompatibilité scientifique ;
3. acquisition techniquement calculable mais non interprétable ;
4. déviation mineure sans effet sur l’estimand ;
5. déviation majeure affectant la comparabilité ;
6. désaccord de lecteurs avec adjudication ;
7. dérive progressive détectée entre centres ;
8. changement de méthode au milieu d’une étude ;
9. donnée manquante non aléatoire ;
10. demande du promoteur incompatible avec l’indépendance de lecture ;
11. résultat nécessitant une catégorie indéterminée ;
12. amendement imposant une réévaluation des décisions antérieures.

### 8.4 Critères Core Lab

NOXIA doit distinguer proposition, constat, décision, adjudication et approbation. Il doit conserver :

- les versions de stratégie et de protocole ;
- les critères de qualification ;
- les observations de qualité ;
- les déviations et leurs impacts ;
- les lectures initiales ;
- les désaccords ;
- l’auteur et la portée de l’adjudication ;
- les décisions humaines ;
- les changements et les données affectées.

Une sortie qui masque la divergence initiale derrière le seul résultat adjudiqué échoue à la traçabilité Core Lab.

---

## 9. Construction de la référence experte

### 9.1 Composition du panel

Une référence experte est établie par au moins trois évaluateurs indépendants dont les compétences couvrent la question. Le panel comprend, selon le cas :

- une expertise radiologique ou d’imagerie du domaine ;
- une expertise méthodologique, quantitative ou biostatistique ;
- une expertise clinique ou physiopathologique pertinente ;
- une expertise Core Lab pour les scénarios concernés ;
- une expertise documentaire et de preuve lorsque la décision repose sur une synthèse de littérature.

Un même expert peut couvrir plusieurs compétences, mais aucune référence critique ne doit dépendre d’une seule personne.

### 9.2 Indépendance

Les experts déclarent :

- leur participation éventuelle à la conception de la version ;
- leur participation à la création du cas ;
- leurs intérêts scientifiques ou institutionnels ;
- leur connaissance préalable de la sortie évaluée ;
- toute relation susceptible d’influencer le jugement.

Un expert en conflit peut contribuer à l’explication du domaine, mais ne doit pas être le seul arbitre d’un écart critique.

### 9.3 Procédure

1. chaque expert analyse le cas indépendamment ;
2. les unités de jugement, erreurs interdites et variantes admissibles sont recueillies ;
3. les divergences sont caractérisées avant discussion ;
4. le panel recherche un accord argumenté ;
5. les désaccords légitimes restent représentés dans l’espace des réponses admissibles ;
6. une adjudication indépendante tranche uniquement ce qui doit l’être pour l’évaluation ;
7. l’accord inter-évaluateurs et les désaccords résiduels sont rapportés ;
8. la référence est gelée avant ouverture du jeu aveugle.

### 9.4 Référence insuffisante

Un cas ne peut pas contribuer au critère principal si :

- les experts ne peuvent pas définir les invariants critiques ;
- l’état des connaissances ne permet pas de distinguer réponse recevable et erreur ;
- la référence a été construite après connaissance de la sortie évaluée ;
- un conflit majeur n’est pas géré ;
- la version des preuves n’est pas reconstructible.

Le cas est alors requalifié en cas exploratoire, contradictoire ou non résolu. Il n’est jamais ajusté pour favoriser une réponse observée.

---

## 10. Métriques officielles

### 10.1 Règles générales

Chaque métrique doit définir :

- son objet ;
- son unité de jugement ;
- son dénominateur ;
- son sens favorable ;
- ses exclusions autorisées ;
- sa méthode d’adjudication ;
- son seuil ou sa règle comparative ;
- son intervalle d’incertitude ;
- ses résultats par famille de cas et sous-groupe pertinent.

Une métrique ne peut pas changer après ouverture du jeu aveugle. Les exclusions postérieures sont interdites sauf règle préspécifiée, et toutes restent rapportées.

### 10.2 Exactitude scientifique

**Définition.** Concordance des assertions, relations, qualifications et conclusions avec la référence d’évaluation dans le contexte exact du cas.

**Mesures officielles.**

- taux d’unités correctes ;
- erreurs par niveau de sévérité ;
- omissions critiques ;
- assertions non soutenues ;
- transferts illégitimes entre contextes ;
- respect des invariants propres au cas.

Une réponse peut être exacte sur ses phrases présentes tout en échouant par omission d’un élément critique.

### 10.3 Traçabilité

**Définition.** Capacité à relier une assertion ou une décision à une preuve qualifiée, son localisateur, son contexte, son sens de relation, sa date effective et la chaîne de justification correspondante.

**Mesures officielles.**

- proportion d’assertions vérifiables complètement tracées ;
- proportion d’assertions critiques complètement tracées ;
- exactitude des relations de preuve : soutien, réfutation, qualification, neutralité ou simple mention ;
- exactitude des localisateurs ;
- couverture de la chaîne preuve → connaissance → justification → recommandation → décision ;
- nombre de références inventées, introuvables ou mal attribuées.

Une liste bibliographique sans relation explicite à l’assertion n’est pas une traçabilité complète.

### 10.4 Qualité des justifications

Chaque justification est jugée sur une échelle ordinale préspécifiée selon :

1. la pertinence pour la décision ;
2. la qualité et la maturité des preuves ;
3. la cohérence avec le contexte ;
4. l’explicitation des mécanismes ou relations ;
5. la présentation des alternatives ;
6. la reconnaissance des limites ;
7. l’explication du compromis ;
8. la proportionnalité entre certitude et preuve.

Une justification longue n’est pas nécessairement meilleure. La longueur ne fait jamais partie du score.

### 10.5 Couverture des hypothèses

**Définition.** Capacité à identifier les hypothèses nécessaires, concurrentes et réfutables sans multiplier artificiellement les possibilités.

**Mesures officielles.**

- rappel des hypothèses requises ;
- couverture des hypothèses concurrentes critiques ;
- présence de prédictions observables et de conditions de réfutation ;
- taux d’hypothèses non soutenues ou hors contexte ;
- hiérarchisation et impact décisionnel.

La couverture est toujours rapportée avec le taux d’hypothèses superflues. Ajouter des hypothèses au hasard ne peut pas améliorer la performance.

### 10.6 Gestion des inconnues

**Définition.** Capacité à reconnaître, préserver, qualifier et traiter une information absente ou non résolue.

**Mesures officielles.**

- rappel des inconnues requises ;
- nombre d’inconnues faussement résolues ;
- exactitude de leur caractère bloquant, conditionnel ou enrichissant ;
- qualité des questions proposées ;
- adéquation du niveau de conclusion résiduel ;
- exactitude des arrêts ou escalades.

Une réponse incomplète mais honnête peut réussir là où une réponse fluide et fabriquée échoue.

### 10.7 Gestion des contradictions

**Définition.** Capacité à détecter, localiser, qualifier et conserver une contradiction jusqu’à sa résolution légitime.

**Mesures officielles.**

- rappel des contradictions attendues ;
- distinction entre opposition, contexte différent et preuve de maturité différente ;
- propagation vers les décisions affectées ;
- nombre de contradictions effacées ou résolues sans fondement ;
- qualité de l’arbitrage ou de l’escalade.

### 10.8 Qualité des décisions

**Définition.** Recevabilité scientifique d’une décision, d’une recommandation, d’un refus ou d’une demande d’information compte tenu du cas.

**Mesures officielles.**

- appartenance à l’ensemble des décisions admissibles ;
- présence des conditions et réserves ;
- adéquation des alternatives ;
- respect du mandat humain ;
- impact estimé des omissions ;
- taux de décisions interdites ;
- taux de corrections nécessaires avant adoption.

L’accord avec la majorité des experts ne suffit pas lorsque l’argumentation majoritaire repose sur une information absente ou sur une erreur de contexte.

### 10.9 Temps gagné

**Définition.** Réduction du temps nécessaire pour atteindre une décision ou un livrable de qualité prédéfinie.

Le temps comprend :

- compréhension du cas ;
- recherche ;
- structuration ;
- revue ;
- correction ;
- adjudication ;
- finalisation.

Sont rapportés séparément : temps actif, temps écoulé, temps expert et temps Core Lab.

Le résultat principal est une différence appariée ou une réduction relative médiane accompagnée de sa distribution et de son intervalle d’incertitude. Un gain de temps n’est recevable que si les portes de qualité scientifique sont satisfaites. Le temps déplacé vers la correction ou l’adjudication n’est pas un gain.

### 10.10 Reproductibilité

**Définition.** Capacité d’un évaluateur indépendant à reconstruire le raisonnement et ses déterminants à partir du dossier d’exécution.

**Mesures officielles.**

- complétude du manifeste de version ;
- disponibilité des entrées et de leur état ;
- identification des preuves effectives ;
- reconstruction des décisions humaines ;
- reconstruction des changements et impacts ;
- proportion d’exécutions entièrement reconstructibles.

### 10.11 Cohérence inter-exécutions

**Définition.** Équivalence scientifique des sorties produites à partir du même cas, du même contexte, du même état de connaissance et de la même version.

L’équivalence porte sur :

- les faits critiques ;
- les hypothèses principales ;
- les inconnues et contradictions ;
- les preuves structurantes ;
- la classe de recommandation ou de refus ;
- les conditions et limites ;
- les décisions affectées.

Elle ne porte pas sur l’identité des phrases. Une variation rédactionnelle est acceptable ; une variation du fond scientifique ne l’est pas.

### 10.12 Stabilité des recommandations

La stabilité comporte deux tests inséparables :

- **invariance pertinente** : une perturbation sans effet scientifique ne doit pas modifier la décision ;
- **sensibilité pertinente** : une information décisive doit modifier la décision et produire une analyse d’impact cohérente.

Un système toujours stable peut être insensible à une information majeure. Un système toujours changeant peut être incohérent. Les deux propriétés sont donc rapportées séparément.

### 10.13 Compréhension et qualité des projections

Conformément à PD-004, l’évaluation mesure la compréhension, pas seulement l’achèvement d’une tâche.

Elle vérifie notamment la capacité du destinataire à :

- reformuler la question et la décision ;
- distinguer connu, supposé, manquant et contradictoire ;
- identifier la preuve et sa limite ;
- comprendre pourquoi une option est recommandée ;
- reconnaître un cas de refus ou d’arrêt ;
- retrouver l’impact d’un changement ;
- prendre une décision sans croire que NOXIA l’a adoptée à sa place.

Chaque projection revendiquée est testée auprès de son public réel : investigateur, radiologue, méthodologiste, promoteur, technologue, statisticien, Core Lab ou relecteur.

### 10.14 Calibration de l’assurance scientifique

Lorsque NOXIA utilise des statuts qualitatifs de confiance, l’évaluation compare la fréquence et la gravité des erreurs dans chaque statut.

Une sortie déclarée établie doit être plus fiable et mieux étayée qu’une sortie déclarée probable ou controversée. Aucun pourcentage de confiance ne peut être évalué ou affiché s’il n’a pas été calibré pour l’usage concerné.

### 10.15 Charge de correction

La charge de correction mesure :

- le nombre d’unités modifiées ;
- leur sévérité ;
- le temps de correction ;
- la nécessité d’une nouvelle recherche ;
- les décisions réouvertes ;
- les impacts en cascade ;
- le besoin d’adjudication.

Elle complète le temps brut et permet de détecter une accélération apparente obtenue au prix d’un transfert de charge vers l’expert.

### 10.16 Qualité de la navigation scientifique

Conformément à PD-009, l’évaluation de la navigation distingue :

- l’exactitude de l’ensemble des actions admissibles ;
- l’exactitude des actions exclues ;
- la pertinence de l’action retenue au regard de la prochaine Décision ;
- le taux de questions sans impact décisionnel ;
- le rappel des Besoins d’information bloquants ;
- la capacité de discrimination entre Options ;
- la proportion d’impacts directs et en cascade correctement propagés ;
- les réouvertures inutiles et les impacts manqués ;
- l’exactitude de l’arrêt par suffisance, impossibilité, limite de domaine ou absence de valeur supplémentaire ;
- l’exactitude du refus protocolaire ;
- la stabilité de la navigation lorsque la capacité contributrice change ;
- le nombre et la charge des actions nécessaires pour atteindre une décision de qualité recevable.

Une séquence plus courte n’est meilleure que si elle ne manque aucune information ou revue critique. Une action correcte mais adressée au mauvais responsable constitue un écart.

### 10.17 Rapport multidimensionnel obligatoire

Les résultats sont publiés par dimension, famille de cas, domaine, public et comparateur. Aucun indice composite unique ne peut remplacer ce tableau de résultats.

---

## 11. Comparateurs officiels

### 11.1 Règle d’équité comparative

Tous les comparateurs reçoivent une mission, un contexte, un temps et un accès aux informations explicitement documentés. Les différences d’accès sont autorisées uniquement lorsqu’elles font partie du scénario réel étudié ; elles sont alors visibles dans la revendication.

L’identité du comparateur, son niveau d’expérience, ses outils, son entraînement au cas, le temps alloué et la date sont enregistrés.

### 11.2 Chercheur junior

**Rôle comparatif.** Mesurer l’aide apportée à une personne capable de conduire un travail scientifique mais ne possédant pas encore l’expertise multidisciplinaire complète.

**Protocole privilégié.** Plan apparié ou croisé comparant :

- chercheur junior sans NOXIA ;
- chercheur junior avec NOXIA ;
- sortie candidate NOXIA avant correction.

**Dimensions prioritaires.** Hypothèses, inconnues, traçabilité, qualité des justifications, temps, charge de correction, compréhension et décisions interdites.

L’apprentissage, l’ordre des cas et l’exposition répétée doivent être contrôlés.

### 11.3 Radiologue expérimenté

**Rôle comparatif.** Mesurer la qualité de raisonnement d’un spécialiste expérimenté sur des décisions relevant effectivement de son domaine.

L’expérience radiologique ne doit pas être présentée comme une expertise universelle en méthodologie, statistiques, génétique, essais multicentriques ou gouvernance Core Lab. Chaque cas décrit les compétences requises et les limites du comparateur.

**Dimensions prioritaires.** Exactitude, pertinence clinique et d’imagerie, diagnostics différentiels, faisabilité, décisions, temps et détection des risques.

### 11.4 Core Lab

**Rôle comparatif.** Comparer NOXIA à un processus collectif réel : revue, qualification, contrôle, lecture, déviation, adjudication et synthèse.

Le comparateur Core Lab n’est pas réduit à la réponse d’un expert isolé. Sont mesurés :

- qualité du livrable final ;
- temps total et temps expert ;
- nombre d’itérations ;
- cohérence entre centres ;
- détection des déviations ;
- traçabilité de l’adjudication ;
- conservation de l’indépendance scientifique.

### 11.5 LLM généraliste

**Rôle comparatif.** Distinguer la valeur du cadre scientifique NOXIA de la seule capacité générale à produire un texte plausible.

Le benchmark documente :

- l’identité et la version du LLM ;
- la date d’accès ;
- les instructions générales fournies ;
- les ressources et outils disponibles ;
- l’accès ou non au même corpus documentaire ;
- les paramètres influençant la variabilité ;
- le nombre d’exécutions indépendantes ;
- les incidents et refus.

Les instructions du comparateur doivent être suffisamment compétentes pour éviter un handicap artificiel, sans reproduire le modèle normatif propriétaire de NOXIA. Elles sont gelées avant le jeu aveugle et revues par une personne indépendante.

### 11.6 Recherche bibliographique classique

**Rôle comparatif.** Mesurer ce qu’apporte NOXIA au-delà d’une démarche documentaire humaine non structurée par le Protocol Designer.

Le protocole précise :

- les sources documentaires accessibles ;
- la stratégie de recherche ;
- les dates de recherche ;
- le temps alloué ;
- les critères de sélection ;
- le mode d’extraction ;
- la qualification des preuves ;
- la synthèse et la décision attendues.

Une recherche bibliographique peut trouver les mêmes articles sans reconstruire la chaîne scientifique ou argumentative. L’évaluation mesure donc séparément découverte, qualification, contextualisation, justification et décision.

### 11.7 Comparaison d’augmentation

La comparaison principale du produit est l’effet de l’usage de NOXIA sur un utilisateur ou un collectif. Elle doit inclure au moins un plan avec et sans assistance pour le public correspondant à la revendication.

La performance de NOXIA seul reste une analyse de composant. Elle ne permet ni de revendiquer un remplacement humain ni d’ignorer les décisions humaines requises.

### 11.8 Portée des conclusions

NOXIA n’a pas à surpasser chaque comparateur dans chaque dimension. En revanche :

- toutes les portes critiques doivent réussir ;
- le bénéfice primaire annoncé doit être démontré contre le comparateur pertinent ;
- aucune non-infériorité ne peut être conclue sans marge préspécifiée et justifiée ;
- aucune supériorité ne peut être conclue sur la seule valeur moyenne sans incertitude ;
- les résultats défavorables et les sous-groupes doivent rester visibles.

---

## 12. Protocole officiel de benchmark

### 12.1 Préenregistrement

Avant toute ouverture du jeu aveugle, le protocole gèle :

- la question et la revendication évaluées ;
- la version de NOXIA ;
- les versions des jeux et références ;
- les comparateurs ;
- les critères d’inclusion et d’exclusion ;
- les familles et sous-groupes ;
- la métrique primaire et les métriques secondaires ;
- les seuils absolus ;
- les marges de comparaison ;
- la taille et le nombre de répétitions ;
- la méthode d’analyse ;
- la gestion des données manquantes et des incidents ;
- les règles d’arrêt ;
- les critères PASS, FAIL et NON CONCLUANT ;
- les analyses exploratoires ;
- les conflits d’intérêts ;
- l’instance décisionnaire.

Toute modification ultérieure est datée, justifiée et classée comme amendement. Une modification postérieure à l’accès aux résultats ne peut pas être présentée comme préspécifiée.

### 12.2 Gel des conditions

La campagne conserve une fiche de version comprenant :

- l’identité de la version évaluée ;
- les rôles, règles de raisonnement et règles de navigation effectifs ;
- l’état de connaissance et sa date ;
- les politiques de preuve, d’incertitude et d’arrêt ;
- le profil d’usage ;
- les conditions d’exécution ;
- les versions des documents normatifs appliqués.

Une modification susceptible d’affecter le fond après le début de la campagne invalide les exécutions concernées ou impose une nouvelle campagne.

### 12.3 Randomisation et ordre

Pour les comparaisons humaines :

- l’ordre des bras et des cas est équilibré ou randomisé ;
- l’effet d’apprentissage est anticipé ;
- les variantes proches ne sont pas présentées au même participant sans période ou séparation adaptée ;
- la fatigue et la durée sont documentées ;
- le niveau initial d’expérience est recueilli.

### 12.4 Aveugle

Lorsque possible :

- les évaluateurs des sorties ignorent leur origine ;
- les références restent cachées aux participants ;
- l’ordre des sorties est masqué ;
- l’analyse principale est exécutée selon le plan gelé avant levée de l’aveugle.

Lorsque l’aveugle est impossible, la raison et le risque de biais sont explicités.

### 12.5 Répétitions

Les systèmes susceptibles de varier sont évalués sur plusieurs exécutions indépendantes. Le nombre est justifié par la précision attendue de la métrique de cohérence et non choisi après observation de la variabilité.

Les meilleures exécutions ne peuvent pas être sélectionnées. Les échecs, délais dépassés, refus et sorties non évaluables sont conservés selon une règle préspécifiée.

### 12.6 Analyse statistique

Le rapport présente :

- effectifs et dénominateurs ;
- estimations ponctuelles ;
- intervalles d’incertitude ;
- différences absolues et relatives pertinentes ;
- résultats appariés lorsque le plan l’autorise ;
- analyses par famille et sous-groupe ;
- accord entre évaluateurs ;
- sensibilité aux cas non évaluables ;
- corrections ou hiérarchies prévues pour les comparaisons multiples ;
- distinction entre analyses confirmatoires et exploratoires.

Une valeur statistiquement significative ne suffit pas à établir une valeur scientifique. L’importance de l’effet, sa précision, sa pertinence et son coût scientifique doivent être interprétés ensemble.

### 12.7 Analyse qualitative des échecs

Chaque erreur majeure ou critique fait l’objet d’une analyse causale :

- objet ou relation affecté ;
- contexte ;
- preuve disponible ;
- décision en aval ;
- capacité de détection humaine ;
- possibilité de propagation ;
- cas analogues ;
- action de maîtrise ;
- contrat de non-régression créé.

Une moyenne favorable n’autorise pas à omettre cette analyse.

### 12.8 Reproductibilité de la campagne

Une instance indépendante doit pouvoir reconstruire :

- la sélection des cas ;
- la version des références ;
- les conditions de chaque bras ;
- l’ordre et l’aveugle ;
- les exclusions ;
- les jugements ;
- les calculs ;
- les amendements ;
- la décision finale.

---

## 13. Taxonomie officielle des écarts

### 13.1 Erreur critique

Une erreur critique peut modifier une décision scientifique ou clinique de manière dangereuse, invalider un objectif ou un estimand, masquer une impossibilité, fabriquer une preuve ou rompre la responsabilité humaine.

Constituent notamment des erreurs critiques :

- une source ou un passage inventé ;
- une preuve attribuée à une assertion qu’elle ne soutient pas ;
- une conclusion certaine malgré une inconnue bloquante ;
- l’effacement d’une contradiction déterminante ;
- le transfert d’une recommandation hors de son contexte de validité ;
- une causalité affirmée à partir d’une simple association ;
- un refus obligatoire non déclenché ;
- une décision clinique adoptée au nom de l’utilisateur ;
- une impossibilité scientifique présentée comme faisable ;
- une altération silencieuse d’une décision humaine ;
- une rupture de traçabilité empêchant de savoir sur quoi repose une décision critique.

### 13.2 Erreur majeure

Une erreur majeure affecte substantiellement la justification, la comparabilité, la faisabilité, la reproductibilité ou une décision, mais reste détectable et corrigeable avant usage sans dommage irréversible.

### 13.3 Erreur modérée

Une erreur modérée réduit la qualité ou la précision du raisonnement sans modifier à elle seule la décision principale.

### 13.4 Erreur mineure

Une erreur mineure concerne une imprécision limitée, une omission non décisionnelle ou une présentation perfectible sans altération du fond.

### 13.5 Défaut de présentation

Un défaut de présentation affecte l’accès, la compréhension ou la projection sans modifier les objets scientifiques. Il reste évalué, car une information correcte mais incompréhensible peut dégrader la décision.

### 13.6 Règle de sévérité

La sévérité dépend de l’impact potentiel, non de la longueur de la correction. Une phrase courte peut contenir une erreur critique ; une réécriture longue peut ne corriger qu’un défaut mineur.

---

## 14. Critères PASS, FAIL et NON CONCLUANT

### 14.1 Principe de portes indépendantes

La décision n’est jamais issue d’un total de points. Une version obtient PASS uniquement si toutes les portes applicables réussissent.

| Porte | Exigence |
|---|---|
| P0 — Recevabilité | Protocole préenregistré, versions identifiables, conflits déclarés, dossier reconstructible |
| P1 — Validité des jeux | Jeux indépendants, familles obligatoires couvertes, référence experte recevable, absence de contamination affectant la décision |
| P2 — Exactitude critique | Aucune erreur scientifique critique sur les cas de validation |
| P3 — Preuves et traçabilité | Toutes les assertions et décisions critiques sont complètement traçables ; aucune référence inventée ou faussement attribuée |
| P4 — Inconnues, contradictions et arrêts | Aucun manque bloquant faussement résolu ; toutes les portes critiques de refus, d’arrêt et d’escalade sont respectées |
| P5 — Responsabilité humaine | Aucune décision réservée à l’humain n’est adoptée silencieusement par NOXIA |
| P6 — Fiabilité | Seuils préspécifiés de reproductibilité, cohérence, invariance et sensibilité atteints |
| P7 — Valeur comparative | Au moins un bénéfice primaire préspécifié est démontré contre le comparateur pertinent, sans dégradation interdite |
| P8 — Non-régression | Aucun contrat critique ne régresse ; toute variation non critique respecte les règles approuvées |
| P9 — Domaine revendiqué | Les résultats couvrent le domaine, les publics et les scénarios revendiqués ; les limites sont publiées |
| P10 — Décision indépendante | Le comité d’évaluation approuve le dossier sans conflit non maîtrisé |

### 14.2 Seuils absolus permanents

Les critères suivants ne nécessitent aucune calibration numérique et s’appliquent à toute version :

- zéro erreur critique dans le jeu de validation ;
- zéro source inventée ;
- zéro attribution de preuve critique fausse ;
- traçabilité complète de toutes les assertions et décisions critiques ;
- réussite de tous les cas critiques de refus, d’arrêt et d’escalade ;
- zéro inconnue bloquante silencieusement transformée en fait ;
- zéro décision humaine critique adoptée silencieusement ;
- zéro régression critique acceptée ;
- absence de contamination susceptible d’affecter la décision.

### 14.3 Seuils continus contextualisés

Les seuils portant sur l’exactitude non critique, la couverture, la qualité des justifications, le temps, la cohérence, la stabilité, la compréhension ou la charge de correction sont :

1. calibrés sur des études pilotes distinctes du jeu aveugle ;
2. justifiés selon le domaine et la décision ;
3. approuvés par le comité avant la campagne ;
4. gelés dans le protocole ;
5. évalués avec leur intervalle d’incertitude ;
6. rapportés par famille et sous-groupe.

Après leur gel, ils sont normatifs pour la campagne concernée. Avant ce gel, ils restent des hypothèses de calibration et ne peuvent pas autoriser une publication.

### 14.4 Démonstration du bénéfice

Un bénéfice primaire est démontré si le plan préspécifié établit l’un des schémas suivants :

- supériorité sur une dimension de qualité, sans dégradation interdite des autres dimensions ;
- non-infériorité scientifiquement justifiée sur la qualité et supériorité sur le temps ou la charge ;
- réduction d’erreurs, d’inconnues masquées ou de contradictions non détectées, avec qualité globale recevable ;
- amélioration de reproductibilité ou d’harmonisation, sans rigidité inappropriée ;
- amélioration de compréhension ou de décision chez le public visé, sans transfert de risque.

La marge de non-infériorité appartient au protocole et doit être scientifiquement justifiée. Elle ne peut pas être choisie après observation des résultats.

### 14.5 PASS

PASS signifie que toutes les portes applicables sont réussies et que la revendication de valeur préspécifiée est démontrée dans son périmètre.

Il n’existe pas de PASS général à NOXIA. Le statut est toujours attaché à une version, un domaine, un usage, un public, un état de connaissance et une campagne.

### 14.6 FAIL

FAIL est prononcé lorsque le protocole est recevable mais qu’au moins une porte applicable échoue.

Une amélioration moyenne, un gain de temps ou une préférence utilisateur ne peut pas renverser un FAIL critique.

### 14.7 NON CONCLUANT

NON CONCLUANT est prononcé lorsque l’évaluation ne permet pas une décision valide, notamment en cas de :

- contamination ;
- référence experte insuffisante ;
- effectif ou précision insuffisants ;
- écart non autorisé au protocole ;
- panne ou incident systémique empêchant la comparaison ;
- famille obligatoire absente ;
- données de jugement incomplètes ;
- aveugle compromis avec risque de biais majeur.

NON CONCLUANT n’est ni PASS ni un FAIL de performance. Il interdit la publication jusqu’à une évaluation recevable.

### 14.8 Absence de réussite conditionnelle

Une version destinée à publication ne reçoit pas de « PASS avec réserves ». Les limites font partie de toute décision PASS, mais une porte non satisfaite impose FAIL ou NON CONCLUANT.

---

## 15. Contrats de non-régression scientifique

### 15.1 Principe

Toute version publiée devient une référence active pour les comportements scientifiques qu’elle a démontrés. Une version suivante doit montrer qu’elle conserve ces comportements ou qu’une évolution normative explicite justifie leur remplacement.

### 15.2 Familles de contrats

| Contrat | Exigence stable |
|---|---|
| Constitutionnel | Science avant production, décision humaine, incertitude visible, refus légitime |
| Sémantique | Les objets et relations conservent leur sens canonique |
| Chaîne scientifique | Question, hypothèses, phénomènes, biomarqueurs, variables, acquisitions et analyses restent reliés correctement |
| Chaîne argumentative | Preuves, connaissances, justifications, recommandations et décisions restent distinctes et reliées |
| Navigation scientifique | Les actions admissibles, leur priorité, leur responsable, les impacts, les arrêts et les refus respectent PD-009 |
| Preuve | Source, localisateur, sens de relation, contexte et date restent reconstructibles |
| Inconnue | Une donnée absente reste absente jusqu’à apport explicite |
| Contradiction | Une contradiction ne disparaît pas sans événement de résolution |
| Refus et arrêt | Les situations impossibles ou insuffisantes continuent d’interrompre la branche concernée |
| Responsabilité humaine | Aucune décision réservée n’est adoptée automatiquement |
| Perturbation | Les variations non décisives préservent le fond |
| Sensibilité | Les changements décisifs produisent l’impact attendu |
| Projection | Deux projections de la même stratégie préservent le même fond scientifique |
| Inter-rôles | Une composition de rôles ne contourne pas une porte imposée à chaque rôle |
| Version scientifique | Une nouvelle connaissance n’altère pas silencieusement l’interprétation historique |
| Multicentrique | Les adaptations locales restent explicites et les comparabilités honnêtes |
| Core Lab | Déviations, lectures et adjudications restent séparées et traçables |

### 15.3 Création après incident

Toute erreur majeure ou critique confirmée produit, lorsque le cas est généralisable :

- un cas de non-régression ;
- un invariant ou une sortie interdite ;
- une sévérité ;
- un périmètre ;
- une justification ;
- une version d’entrée en vigueur.

L’incident d’origine reste lié au contrat sans exposer indûment les données du cas.

### 15.4 Dérogation

Aucune dérogation ne peut autoriser une régression critique.

Une variation non critique peut être admise uniquement si :

- elle est explicitement identifiée ;
- sa cause est comprise ;
- son impact est borné ;
- aucune porte supérieure n’est affectée ;
- le bénéfice attendu est documenté ;
- le comité l’approuve avant publication ;
- sa durée et sa condition de réexamen sont définies.

Elle reste visible dans le dossier de preuve et ne doit pas être présentée comme une absence de régression.

### 15.5 Retrait d’un contrat

Un contrat ne peut être retiré que si :

- le domaine ou l’usage est officiellement abandonné ;
- la science effective invalide l’attente ancienne ;
- une norme supérieure évolue ;
- le cas ne mesure plus l’objet qu’il prétend mesurer.

Le retrait crée une nouvelle version, une justification, une analyse d’impact et conserve l’historique.

---

## 16. Validation de chaque nouvelle version

### 16.1 Principe de proportionnalité

Toute nouvelle version est évaluée avant publication. L’étendue de la campagne dépend du risque scientifique du changement, mais aucune version n’est exemptée de démontrer son identité et son absence d’altération silencieuse.

### 16.2 Classification du changement

| Classe | Nature | Validation minimale |
|---|---|---|
| V0 — équivalence documentaire | Présentation ou formulation sans changement scientifique attendu | Preuve d’équivalence sémantique, projections critiques et manifeste de version |
| V1 — impact limité | Changement circonscrit à un rôle, une projection ou une famille sans décision critique nouvelle | Non-régression complète du périmètre affecté, cas voisins, métriques de compréhension et de cohérence |
| V2 — impact substantiel | Changement de règle de raisonnement, de preuve, d’orchestration, de corpus effectif ou de décision | Qualification complète, validation aveugle des familles concernées, comparaison à la référence active |
| V3 — impact critique | Nouveau domaine, nouvelle décision à risque, nouvelle capacité multicentrique ou Core Lab, modification d’une porte ou d’un invariant | Campagne complète, jeu externe pertinent, revue experte indépendante et nouvelle démonstration de valeur |

En cas de doute, la classe supérieure s’applique.

### 16.3 Séquence obligatoire avant publication

1. **Décrire le changement.** Identifier la raison, les objets, rôles, décisions, domaines, publics et versions affectés.
2. **Analyser l’impact.** Relier le changement aux cas, métriques, contrats et revendications existants.
3. **Classer le risque.** Attribuer V0 à V3 avec justification indépendante.
4. **Geler la version candidate.** Établir son manifeste et l’état de connaissance effectif.
5. **Mettre à jour le plan d’évaluation.** Sélectionner les jeux applicables sans consulter les références aveugles.
6. **Exécuter la qualification.** Refuser l’ouverture aveugle si une porte fondamentale échoue.
7. **Exécuter la validation aveugle.** Inclure répétitions et comparateurs prescrits.
8. **Juger les sorties.** Utiliser des évaluateurs indépendants et les références gelées.
9. **Analyser les résultats.** Appliquer le plan préspécifié, les seuils et les contrats de non-régression.
10. **Examiner les échecs.** Traiter chaque erreur majeure ou critique et créer les contrats nécessaires.
11. **Constituer le dossier de preuve.** Rassembler protocole, résultats, limites, amendements et traces.
12. **Décider.** Le comité prononce PASS, FAIL ou NON CONCLUANT.
13. **Publier ou retenir.** Seul PASS autorise la publication dans le périmètre approuvé.
14. **Surveiller.** Les incidents postérieurs peuvent suspendre ou restreindre le statut.

### 16.4 Dossier de preuve obligatoire

Le dossier contient :

- l’identité et le manifeste de la version ;
- la classification du changement ;
- l’analyse d’impact ;
- le protocole préenregistré et ses amendements ;
- les versions des jeux et références ;
- la composition et l’indépendance du panel ;
- le diagramme des cas inclus, exclus et non évaluables ;
- les résultats complets par dimension, famille, comparateur et sous-groupe ;
- les intervalles d’incertitude ;
- les erreurs et analyses causales ;
- les contrats de non-régression ;
- les dérogations non critiques ;
- les résultats défavorables ;
- la décision signée du comité ;
- le périmètre exact de publication ;
- les limites et revendications autorisées ;
- les conditions de surveillance et de réévaluation.

### 16.5 Suspension

Le statut PASS peut être suspendu si :

- une erreur critique apparaît en usage ou en surveillance ;
- une contamination historique est découverte ;
- une source structurante est retirée ou invalidée ;
- le domaine d’usage s’étend au-delà du périmètre évalué ;
- une dérive réduit la performance sous un seuil critique ;
- une nouvelle preuve modifie substantiellement la référence d’évaluation.

La suspension reste en vigueur jusqu’à analyse, correction, nouvelle validation et décision explicite.

### 16.6 Évolution des connaissances

La mise à jour du corpus effectif ne réécrit pas les anciens résultats. Elle déclenche :

- une nouvelle version de l’état de connaissance ;
- l’identification des cas affectés ;
- la révision des références concernées ;
- l’analyse d’impact sur les recommandations ;
- une campagne proportionnée au risque ;
- la conservation des résultats historiques dans leur contexte daté.

---

## 17. Gouvernance de l’évaluation

### 17.1 Comité d’évaluation scientifique

Le comité est responsable de :

- approuver le protocole et les seuils ;
- contrôler l’indépendance ;
- statuer sur les conflits et contaminations ;
- approuver les références expertes ;
- examiner les erreurs critiques ;
- décider PASS, FAIL ou NON CONCLUANT ;
- définir les revendications autorisées ;
- suspendre un statut devenu non fiable.

### 17.2 Fonctions représentées

Le comité réunit selon le périmètre :

- responsabilité scientifique du domaine ;
- radiologie ou imagerie ;
- méthodologie et biostatistique ;
- gouvernance des preuves ;
- recherche clinique ;
- Core Lab et multicentrique ;
- expérience utilisateur et compréhension ;
- représentation des utilisateurs responsables de la décision.

### 17.3 Séparation des responsabilités

Les personnes qui construisent ou ajustent une version ne doivent pas contrôler seules :

- le choix final des cas aveugles ;
- la référence experte ;
- l’adjudication des erreurs critiques ;
- l’analyse principale ;
- la décision de publication.

Une contribution croisée est possible dans une petite organisation, mais les conflits, contre-revues et limites d’indépendance doivent être explicites.

### 17.4 Propriétaire scientifique d’un cas

Chaque cas possède un propriétaire responsable de sa qualité, de sa référence, de son état de preuve, de son exposition et de son évolution. Il ne peut pas modifier rétroactivement la version utilisée dans une campagne close.

### 17.5 Propriétaire d’une métrique

Chaque métrique possède un responsable chargé de maintenir sa définition, sa méthode de jugement, ses seuils contextualisés et sa comparabilité entre campagnes.

---

## 18. Traçabilité, versionnement et cycle de vie

### 18.1 Cycle d’un cas

1. proposé ;
2. documenté ;
3. revu ;
4. référence experte établie ;
5. qualifié ;
6. gelé ;
7. utilisé ;
8. surveillé ;
9. révisé, retiré ou archivé.

Une révision crée une nouvelle version. Elle ne modifie pas le cas déjà utilisé dans une campagne close.

### 18.2 Cycle d’une campagne

1. mandatée ;
2. préspécifiée ;
3. approuvée ;
4. ouverte ;
5. exécutée ;
6. jugée ;
7. analysée ;
8. décidée ;
9. close ;
10. réouverte uniquement par incident documenté.

### 18.3 Lignage minimal

Tout résultat doit relier :

version NOXIA → campagne → jeu → cas → référence → exécution → unité de jugement → métrique → résultat → décision de publication.

La rupture d’un lien critique interdit de considérer le résultat comme preuve officielle.

### 18.4 Immutabilité des résultats historiques

Un résultat publié reste attaché aux versions et au contexte qui l’ont produit. Une correction crée un addendum ou une nouvelle campagne. Elle ne remplace jamais silencieusement le résultat antérieur.

### 18.5 Projections autorisées

Le même dossier peut être projeté en :

- synthèse de décision de publication ;
- rapport scientifique complet ;
- tableau multidimensionnel des métriques ;
- rapport comparatif par référentiel ;
- registre des erreurs et non-régressions ;
- rapport multicentrique ;
- rapport Core Lab ;
- fiche de limites et domaine validé ;
- rapport de surveillance ;
- dossier d’audit.

Toutes les projections référencent la même campagne et ne modifient ni les résultats ni leur sévérité.

---

## 19. Contradictions et précisions d’autorité

### 19.1 Reproductibilité et identité de formulation

Le Scientific Product Manifesto exige que la même question, dans le même contexte, conduise au même raisonnement. PD-011 précise cette exigence pour l’évaluation :

- les faits, hypothèses, preuves, inconnues, contradictions, recommandations, conditions et décisions critiques doivent être scientifiquement équivalents ;
- les formulations, l’ordre rédactionnel et le niveau de détail peuvent varier si la projection l’autorise.

Il s’agit d’une précision de mesure, pas d’une réduction de l’exigence de reproductibilité.

### 19.2 Vocabulaire métier, navigation et rôles

PD-003 reste l’autorité sur le sens des objets métier. PD-009 gouverne la prochaine action, les branches, les impacts, les arrêts et le refus protocolaire. PD-005 utilise des contrats de rôles pour décrire les capacités susceptibles d’exécuter l’action sélectionnée. Une sortie de rôle n’est réussie que si elle respecte ces deux autorités, même si son libellé interne diffère. R43 peut contribuer à exécuter une évaluation de la Prompt Library ; il ne définit ni les métriques officielles, ni les portes de publication, ni sa propre autorisation de promotion, qui relèvent de PD-011 et du comité indépendant.

### 19.3 Cible et état courant

L’absence actuelle de jeux PD-011 ou de résultats comparatifs n’affaiblit pas la norme. Elle signifie uniquement que la valeur scientifique n’est pas encore démontrée sous ce cadre.

### 19.4 Stabilité et sensibilité

La stabilité des recommandations ne signifie pas l’immobilité. Une sortie qui ne change jamais échoue si une information décisive est ajoutée. Une sortie qui change sur une reformulation non décisive échoue également. Les deux propriétés doivent être satisfaites.

### 19.5 Consensus expert et vérité scientifique

Le consensus d’un panel n’abolit ni l’incertitude ni la controverse. Lorsqu’une pluralité de réponses est scientifiquement légitime, la référence d’évaluation la conserve. Forcer un accord unique pour simplifier la notation serait contraire à la Charte.

### 19.6 Gates et tests de la tranche PD-007

PD-007 et PD-011 emploient tous deux le terme PASS dans des domaines distincts :

- un PASS PD-007 qualifie un gate d’une Version de stratégie dans la tranche verticale Fabry ;
- un PASS PD-011 qualifie la décision indépendante de publication d’une version, dans un périmètre et une campagne déterminés.

Un ensemble de gates PD-007 peut être entièrement réussi sans démontrer un gain de temps, une supériorité, une non-infériorité, une transportabilité ou une valeur comparative. Inversement, aucun bénéfice comparatif PD-011 ne peut compenser l’échec d’un gate scientifique critique PD-007 applicable.

PD-007 reste subordonné à PD-009 pour la navigation. Ses tests ou regroupements de rôles qui reflètent une responsabilité antérieure doivent être normalisés selon PD-009 avant de devenir des références de validation. Cette dette de conformité est explicite ; elle ne peut pas être résolue par une interprétation implicite de PD-011.

---

## 20. Références méthodologiques externes datées

Ces références soutiennent la conception méthodologique de PD-011. Elles ne deviennent pas des constitutions de NOXIA et ne s’appliquent que dans leur domaine propre.

- [SPIRIT-AI, 2020](https://www.nature.com/articles/s41591-020-1037-7) soutient la préspécification transparente des protocoles évaluant une intervention comportant une composante d’intelligence artificielle.
- [CONSORT-AI, 2020](https://www.nature.com/articles/s41591-020-1034-x) soutient la transparence du rapport d’un essai comparatif impliquant une telle intervention.
- [DECIDE-AI, 2022](https://www.nature.com/articles/s41591-022-01772-9) soutient l’évaluation clinique précoce en situation réelle, notamment la performance humaine et les facteurs d’usage.
- [TRIPOD+AI, 2024](https://www.bmj.com/content/385/bmj-2023-078378) s’applique aux études de modèles de prédiction et ne doit pas être étendu à toute décision de NOXIA.
- [CLAIM, mise à jour 2024](https://pubs.rsna.org/doi/10.1148/ryai.240300) soutient la transparence et la reproductibilité des études d’intelligence artificielle en imagerie et motive l’usage du terme « référence d’évaluation » plutôt qu’une vérité unique.
- [STARD-AI, 2025](https://www.nature.com/articles/s41591-025-03953-8) s’applique aux études de précision diagnostique et ne gouverne pas les autres usages scientifiques.
- [CONSORT 2025](https://www.bmj.com/content/389/bmj-2024-081123) soutient, lorsqu’un essai randomisé est approprié, un rapport complet incluant les éléments de science ouverte.

L’état de ces références doit être vérifié avant toute campagne nouvelle. Une mise à jour externe ne modifie pas automatiquement PD-011 ; elle déclenche une revue d’impact.

---

## 21. Règles d’évolution de PD-011

### 21.1 PD-011 évolue lorsque

- la définition officielle de la valeur scientifique change ;
- une famille obligatoire de cas est ajoutée, retirée ou redéfinie ;
- une métrique officielle change de sens, d’unité ou de règle de décision ;
- les comparateurs obligatoires ou leur protocole changent ;
- les critères PASS, FAIL ou NON CONCLUANT changent ;
- une porte critique ou un seuil absolu permanent change ;
- la gouvernance des références expertes change ;
- la validation avant publication change ;
- une contradiction avec une norme supérieure exige un arbitrage explicite ;
- une évolution scientifique ou méthodologique rend le cadre insuffisant.

### 21.2 PD-011 ne doit jamais évoluer pour

- faire réussir une version ayant échoué ;
- ajuster un seuil après observation du jeu aveugle ;
- masquer une contamination ;
- supprimer un cas révélant une erreur réelle ;
- transformer une cible en performance démontrée ;
- aligner la norme sur une limitation momentanée ;
- privilégier un comparateur ou un résultat favorable ;
- convertir une hypothèse non calibrée en exigence universelle ;
- réécrire l’historique d’une campagne.

### 21.3 Procédure d’évolution

Toute évolution exige :

1. une demande motivée ;
2. l’identification des normes et preuves affectées ;
3. une analyse d’impact sur les jeux, campagnes, revendications et versions publiées ;
4. un examen des contradictions ;
5. une nouvelle version de PD-011 ;
6. la conservation de la version antérieure ;
7. la mise à jour du SOURCE-OF-TRUTH-INDEX ;
8. la réévaluation des statuts PASS affectés.

---

## 22. Invariants officiels

1. La valeur de NOXIA est multidimensionnelle.
2. Aucun score global ne compense une erreur critique.
3. La décision humaine reste explicite.
4. Une donnée absente ne devient jamais un fait sans apport traçable.
5. Une contradiction ne disparaît jamais sans résolution documentée.
6. Un refus scientifiquement justifié peut constituer la meilleure réponse.
7. Une référence experte peut contenir plusieurs réponses admissibles.
8. Les cas de développement et de validation restent indépendants.
9. Une reformulation n’est pas un nouveau cas indépendant.
10. Toute contamination affectant la décision interdit PASS.
11. Les erreurs critiques sont évaluées avec une tolérance nulle.
12. Toute assertion critique possède une traçabilité complète.
13. Un gain de temps n’existe que si la qualité reste recevable.
14. La stabilité doit être accompagnée d’une sensibilité aux changements décisifs.
15. La cohérence inter-exécutions porte sur le fond, pas sur l’identité des phrases.
16. Une revendication reste bornée au domaine, au public, au comparateur et à la version évalués.
17. Une validation interne ne prouve pas la transportabilité externe.
18. Une performance sur cas synthétique ne prouve pas seule l’utilité réelle.
19. Une version publiée ne réécrit pas les résultats historiques.
20. Toute erreur majeure ou critique généralisable alimente la non-régression.
21. Une régression critique ne peut recevoir de dérogation.
22. Les seuils continus sont préspécifiés, justifiés et gelés.
23. Les analyses exploratoires ne deviennent pas confirmatoires après observation.
24. Les résultats défavorables restent visibles.
25. Toute nouvelle version est évaluée avant publication.
26. Seul un PASS indépendant autorise la publication dans le périmètre approuvé.

---

## 23. Décision normative finale

NOXIA apporte une valeur scientifique démontrée uniquement lorsqu’une campagne recevable montre, dans un périmètre défini, un bénéfice préspécifié par rapport à un référentiel pertinent, tout en satisfaisant sans compensation les portes d’exactitude critique, de traçabilité, de gestion des inconnues et contradictions, de responsabilité humaine, de fiabilité et de non-régression.

La publication d’une nouvelle version exige donc :

- des jeux de cas versionnés, diversifiés et indépendants ;
- une référence experte pluraliste ;
- des cas experts, contradictoires, impossibles et incomplets ;
- les scénarios multicentriques et Core Lab correspondant aux revendications ;
- des métriques préspécifiées et multidimensionnelles ;
- une comparaison équitable avec les référentiels pertinents ;
- des critères PASS/FAIL opposables ;
- un jeu aveugle ;
- des contrats de non-régression ;
- un dossier de preuve reconstructible ;
- une décision indépendante.

Tant que ces conditions ne sont pas satisfaites, la formulation correcte n’est pas « NOXIA est validé ». Elle est : **la valeur scientifique de cette version reste à démontrer dans le périmètre considéré**.
