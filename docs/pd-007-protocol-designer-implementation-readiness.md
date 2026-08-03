# PD-007 — Protocol Designer

# Implementation Readiness and Vertical Slice Definition

**Statut documentaire :** REFERENCE_NORMATIVE

**Niveau :** NIVEAU_1

**Version :** 1.0

**Date de référence :** 2 août 2026

**Source maîtresse :** `docs/pd-007-protocol-designer-implementation-readiness.md`

**Éditions dérivées :** aucune

**Cas vertical de référence :** « Je souhaite étudier la fibrose myocardique dans la maladie de Fabry. »

**État d’implémentation au moment de l’audit :** NOT_IMPLEMENTED

**Révision Git observée :** `bdf670d`

---

## 0. Autorité, portée et règles d’évolution

### 0.1 Rôle du document

PD-007 transforme les constitutions, la cible produit, le modèle métier, la référence UX, l’architecture de rôles et le corpus Fabry en une première unité de produit implémentable. Il fixe le plus petit parcours qui puisse démontrer la proposition scientifique de NOXIA sans la réduire à une conversation libre, à une suite d’écrans statiques ou à une réponse prédéterminée.

PD-007 gouverne exclusivement :

- le périmètre fonctionnel de la première tranche verticale du Protocol Designer ;
- le sous-ensemble V1 des objets de PD-003 ;
- les écrans et projections V1 dérivés de la Product Specification et de PD-004 ;
- les capacités de rôles de PD-005 requises et leur regroupement minimal ;
- les dépendances scientifiques, contrats, gates et tests d’admission de cette tranche ;
- la séquence recommandée des futures passes d’implémentation.

PD-007 ne remplace ni la Product Specification complète, ni PD-003, ni PD-004, ni PD-009, ni PD-005, ni PD-011, ni le Reasoning Book Fabry. Il ne crée aucune vérité scientifique, ne définit pas la logique générale de navigation, ne définit pas le protocole officiel d’évaluation et ne prouve aucune capacité implémentée.

### 0.2 Normes de lecture

Les mots **DOIT**, **NE DOIT PAS**, **DEVRAIT**, **PEUT** et **DIFFÉRÉ** ont une portée normative dans ce document.

Les statuts d’audit sont ceux imposés par la mission : `ESTABLISHED_PRINCIPLE`, `NORMATIVE_TARGET`, `SCIENTIFIC_CORPUS`, `IMPLEMENTED`, `PARTIALLY_IMPLEMENTED`, `NOT_IMPLEMENTED`, `CONTRADICTED` et `UNRESOLVED`.

`DEFERRED_FROM_V1` ou `DEFERRED_FROM_VERTICAL_SLICE` signifie qu’un élément reste dans la cible officielle mais n’appartient pas à la première tranche. Il ne signifie jamais supprimé, rejeté ou inutile.

### 0.3 Documents supérieurs et spécialisation

PD-007 reste subordonné, dans cet ordre, à :

1. la Charte fondatrice de NOXIA ;
2. le Scientific Product Manifesto du Protocol Designer ;
3. la Product Specification V1.0 pour la cible produit générale ;
4. PD-003 pour le sens des objets métier ;
5. PD-004 pour les règles d’expérience ;
6. PD-009 pour la navigation décisionnelle, les branches, les arrêts, les impacts et le refus protocolaire ;
7. PD-005 pour les responsabilités des rôles appelés à exécuter une action sélectionnée ;
8. PD-011 pour l’évaluation scientifique, la non-régression et toute décision officielle de publication ;
9. les corpus scientifiques datés pour les affirmations scientifiques.

Dans son domaine spécialisé, PD-007 sélectionne et ordonne ces contrats pour une première implémentation. Il ne peut pas redéfinir le sens d’un objet, affaiblir une règle UX, fusionner deux responsabilités scientifiques incompatibles ou promouvoir une narration scientifique en règle exécutable sans structuration et revue humaine.

### 0.4 Quand PD-007 évolue

PD-007 DOIT recevoir une nouvelle version lorsqu’une décision explicite modifie :

- le cas vertical ou sa condition de réussite ;
- le sous-ensemble V1 d’objets métier ;
- le nombre, la responsabilité ou l’enchaînement des écrans V1 ;
- les capacités de rôles obligatoires, leurs frontières ou leur regroupement ;
- un contrat, un gate, un statut de gate ou une condition d’arrêt ;
- le paquet scientifique minimal attendu du système de connaissances ;
- la stratégie de validation ou le périmètre explicitement reporté ;
- l’arbitrage documentaire qui conditionne la tranche.

Toute évolution scientifique du cas Fabry commence dans le Reasoning Book ou dans le corpus scientifique compétent. PD-007 n’évolue ensuite que si l’analyse d’impact change une exigence de la tranche.

### 0.5 Quand PD-007 ne doit jamais évoluer

PD-007 NE DOIT PAS être modifié pour :

- refléter une contrainte momentanée de sprint ;
- faire passer une fonctionnalité absente pour livrée ;
- choisir un langage, un stockage, un fournisseur ou un modèle d’intelligence artificielle ;
- ajuster le texte d’un prompt sans changement de contrat ;
- intégrer une valeur scientifique non sourcée ou un seuil local ;
- contourner un gate, une revue humaine ou un arrêt scientifique ;
- aligner la norme sur un écran incomplet ;
- modifier l’Editorial Engine, le PACS, un viewer, une route publique ou un mécanisme de publication.

---

## 1. Sources consultées et qualification

| Source réelle | Format | Niveau / nature | Usage dans PD-007 |
|---|---|---|---|
| `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` | Markdown | Gouvernance documentaire | Hiérarchie, ordre de lecture, spécialisation, admission et arbitrage. |
| `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx` | DOCX source maîtresse | Niveau 0 | Science avant technologie, traçabilité, contexte, humilité, responsabilité humaine. |
| `output/documents/noxia-protocol-designer-scientific-product-manifesto-edition-editoriale.docx` | DOCX source maîtresse | Niveau 0 spécialisé | Chaîne de raisonnement, stratégie avant protocole, adaptation, droit à l’arrêt, projections. |
| `output/documents/noxia-protocol-designer-product-specification-v1.0.docx` | DOCX source maîtresse | Niveau 1, cible produit | 65 écrans cibles, huit parcours, états, transitions, responsive et critères d’acceptation. |
| `docs/pd-003-research-object-model.md` | Markdown | Niveau 1, métier | 68 objets canoniques, relations, états, versions, projections et invariants. |
| `docs/pd-004-ux-manifesto.md` | Markdown source maîtresse | Niveau 1, UX | Parcours canonique, budgets de choix, progressive disclosure, incertitude, accessibilité et projections. |
| `docs/pd-009-decision-engine-architecture.md` | Markdown source maîtresse | Niveau 1, décision | Autorité sur la prochaine action, les besoins, branches, impacts, arrêts, refus protocolaire et règles méthodologiques. |
| `docs/pd-005-prompt-library-architecture.md` | Markdown | Niveau 1, cible de rôles | 43 rôles, contrats, portes, boucles, arrêts, revue et gouvernance. |
| `docs/pd-011-evaluation-framework.md` | Markdown source maîtresse | Niveau 1, évaluation | Jeux de cas, références expertes, métriques, non-régression et décision indépendante PASS/FAIL/NON CONCLUANT. |
| `output/documents/noxia-protocol-designer-reasoning-book-pd-002-fabry.docx` | DOCX source maîtresse | Niveau 2, corpus daté | Construits Fabry, objectifs O1–O11, hypothèses, décisions D0–D16, porte de non-protocole, preuves et limites. |
| `docs/scientific-assertion-layer.md` | Markdown | Niveau 1 scientifique | Contrats assertion–source–preuve–contexte et frontière de migration. |
| `docs/scientific-knowledge-graph-web.md` | Markdown | Niveau 1 scientifique | Identités, révisions, liens de preuve, synthèses structurées et readiness séparée. |
| `docs/p4-scientific-corpus.md` | Markdown | Niveau 2 | Corpus ECV/T1, provenance, métrologie, contradictions et limites. |
| `docs/p4r-scientific-consolidation.md` | Markdown | Niveau 2 | Révision, revue automatisée, généricité et protocole d’enrichissement. |
| `docs/p5-scientific-multidomain.md` | Markdown | Niveau 2 | Corpus LGE et caractérisation myocardique générique ; frontières de domaine. |
| `src/App.tsx`, `src/features/scientific-explorer/`, `src/knowledge-graph/`, `package.json` et tests actuels | Code et tests | Preuve du présent | Vérification de l’état réellement implémenté, sans création de doctrine. |

Les éditions PDF, rapports datés et fichiers temporaires n’ont été utilisés que pour contrôle ou orientation. Aucun fichier sous `tmp/` n’est une source de vérité.

### 1.1 État courant constaté

- L’application actuelle est une SPA publique comportant des pages éditoriales, des cas de démonstration et un explorateur scientifique. Elle ne possède aucune route ni aucun composant Protocol Designer.
- Aucun objet de projet PD-003, Decision Engine PD-009, rôle exécutable PD-005, prompt de production, parcours Fabry, évaluation PD-011, gate PD-007 ou rapport Protocol Designer n’est implémenté.
- Le Knowledge Graph possède des contrats génériques et des corpus structurés ECV/T1 et caractérisation myocardique. Il ne contient aucune assertion structurée propre à Fabry, à `GLA` ou au lyso-Gb3.
- Le Reasoning Book Fabry est riche, sourcé et daté, mais narratif. Il ne constitue pas un paquet de règles, d’assertions ou de décisions exécutable.
- `npm run typecheck` réussit sur la révision observée.
- La suite actuelle exécute 499 tests : 496 réussissent et trois échouent uniquement parce que trois contrôles historiques exigent que le dépôt externe `editorial-engine` soit propre, alors que ce dépôt contient des travaux non validés par ces contrôles. Aucun échec ne porte sur une implémentation Protocol Designer, puisqu’elle est absente.
- Les validateurs P4 et P5 confirment leurs couches scientifiques internes mais retournent eux aussi `EDITORIAL_ENGINE_CHANGED`. Cette dépendance externe ne doit ni être corrigée par PD-007, ni être requalifiée en défaut du modèle Fabry.

Conclusion d’état : les fondations documentaires convergent ; la tranche verticale reste entièrement à implémenter.

---

## 2. Audit de convergence

### 2.1 Matrice

| ID | Exigence | Source autoritative | Statut | Compatibilité | Écart éventuel |
|---|---|---|---|---|---|
| C01 | Entrer par une question ou une intention scientifique | Charte ; Scientific Product Manifesto ; Product Specification S03/S11/S12 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C02 | Reformuler avant de proposer | Scientific Product Manifesto ; Product Specification S11 ; PD-005 R02–R04 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C03 | Définir le construit avant la modalité ou la séquence | Scientific Product Manifesto ; Reasoning Book, parties I, VII et IX | ESTABLISHED_PRINCIPLE | CONVERGENT | Aucun. |
| C04 | Distinguer phénomène, phénotype, biomarqueur, modalité, acquisition et séquence | PD-003 ; Reasoning Book, matrice construit–observable | NORMATIVE_TARGET | CONVERGENT | Les acquisitions et séquences détaillées sont reportées, pas fusionnées. |
| C05 | Rendre population, objectif et hypothèses explicites | Product Specification S13–S15 ; PD-003 ; PD-005 R05/R14 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C06 | Conserver les informations manquantes | Charte ; PD-003 ; PD-004 UX-26 à UX-30 ; PD-005 R04 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C07 | Montrer incertitudes, limites, risques et biais | Scientific Product Manifesto ; PD-003 ; PD-004 ; PD-005 R27/R33 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C08 | Comparer des alternatives réelles | Product Specification S25/S39 ; PD-003 ; PD-005 R36 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C09 | Justifier toute recommandation | Charte ; PD-003 ; PD-005 R35 ; Product Specification S40/S41 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C10 | Laisser la décision scientifique à l’humain | Charte ; Scientific Product Manifesto ; PD-003 ; PD-005 | ESTABLISHED_PRINCIPLE | CONVERGENT | Aucun. |
| C11 | Autoriser l’arrêt ou le refus de protocole | Scientific Product Manifesto ; PD-004 ; PD-005 R31 ; Reasoning Book D16 et partie X | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C12 | Produire un rapport structuré, y compris en cas d’arrêt | Scientific Product Manifesto ; Product Specification S48–S53 ; PD-005 R37/R38 | NORMATIVE_TARGET | CONVERGENT | Le rapport V1 est méthodologique, pas un protocole exécutable. |
| C13 | Versionner la stratégie et les décisions | PD-003 ; Product Specification S47 ; PD-005 R40 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C14 | Propager un changement par analyse d’impact | PD-003 ; Product Specification S47 ; PD-005 R40 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C15 | Maintenir une stratégie unique et plusieurs projections | PD-003 ; PD-004 UX-03/UX-51 ; PD-005 R39 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C16 | Adapter débutant, standard, expert, méthodologiste et Core Lab sans changer la science | Product Specification S04 ; PD-004, partie X ; PD-005 R39 | NORMATIVE_TARGET | CONVERGENT | Quatre modes d’accompagnement et une projection de rôle méthodologiste ; voir §2.3. |
| C17 | Séparer construction, contrôle, rédaction et gouvernance des rôles | PD-005, familles A–H | NORMATIVE_TARGET | CONVERGENT | Aucun rôle conceptuel n’impose un appel de modèle distinct. |
| C18 | Consommer assertions, preuves, sources, contextes et synthèses structurées | Scientific Assertion Layer ; P3M-Web | PARTIALLY_IMPLEMENTED | COMPATIBLE_WITH_ADAPTATION | Les contrats existent ; un adaptateur de projet et un paquet Fabry manquent. |
| C19 | Disposer d’un raisonnement Fabry exploitable | Reasoning Book PD-002 | SCIENTIFIC_CORPUS | COMPATIBLE_WITH_ADAPTATION | Le contenu est narratif et doit être structuré puis revu humainement. |
| C20 | Réutiliser les connaissances ECV/T1/LGE disponibles | P4, P4R et P5 ; registres actuels | IMPLEMENTED | COMPATIBLE_WITH_ADAPTATION | Le corpus est générique ou porte sur d’autres populations ; aucune transposition silencieuse à Fabry. |
| C21 | Exécuter aujourd’hui le parcours Protocol Designer | Code, routes et tests actuels | NOT_IMPLEMENTED | GAP | Aucun parcours, objet, rôle ou gate V1 n’existe. |
| C22 | Utiliser une grammaire unique des états d’information | PD-003 §4.2 ; PD-004, partie V ; Product Specification S18 ; PD-009 §0.4 | NORMATIVE_TARGET | RESOLVED_BY_AUTHORITY | PD-009 arbitre : `déclaré` est une provenance, `manquant` projette `inconnu`, `non applicable` et `obsolète` restent canoniques ; voir §2.2. |
| C23 | Présenter les six intentions cibles tout en limitant à cinq les choix visibles | Product Specification S03 ; PD-004 UX-09 | NORMATIVE_TARGET | COMPATIBLE_WITH_ADAPTATION | Les six intentions existent ; elles doivent être regroupées et ne jamais être six choix simultanés. La V1 n’active que « J’ai une question ». |
| C24 | Interpréter sans ambiguïté les identifiants `Rxx` | PD-005 ; Reasoning Book PD-002 | UNRESOLVED | NAMESPACE_CONTROLLED | Collision de notation : `PD005:Rxx` désigne un rôle ; `PD002:REF-Rxx` une référence bibliographique. |
| C25 | Distinguer confiance de preuve et statut de conclusion | Reasoning Book, niveaux A–D ; PD-003 §4.3 ; PD-004 UX-27 | NORMATIVE_TARGET | COMPATIBLE_WITH_ADAPTATION | Deux dimensions séparées ; aucune conversion automatique entre elles. |
| C26 | Intégrer les contraintes et informations locales | Charte ; Product Specification S17/S30 ; PD-003 ; Reasoning Book | NORMATIVE_TARGET | CONVERGENT | Les données locales restent saisies ou confirmées par l’humain. |
| C27 | Effectuer une revue scientifique et méthodologique avant rapport partageable | Product Specification S42–S46 ; PD-005 R27–R33 | NORMATIVE_TARGET | CONVERGENT | Aucun. |
| C28 | Séparer la sélection de la prochaine action de l’exécution des rôles | PD-009 ; PD-005 v1.1 | NORMATIVE_TARGET | CONVERGENT | PD-009 gouverne la navigation ; R01 coordonne l’exécution et R04 conduit uniquement un Échange déjà sélectionné. |
| C29 | Distinguer admission de tranche et validation scientifique officielle | PD-011, notamment §§5.7, 14 et 19.6 | NORMATIVE_TARGET | CONVERGENT | Les 39 tests PD-007 sont des cas candidats ; seul un protocole PD-011 peut produire un PASS de publication. |

### 2.2 ARBITRAGE DOCUMENTAIRE APPLIQUÉ — états d’information

Les documents antérieurs employaient des vocabulaires différents :

- PD-003 §4.2 définit `connu`, `supposé`, `inconnu`, `non applicable`, `contradictoire`, `obsolète` ;
- PD-004 déclare comme grammaire UX officielle `connue`, `supposée`, `manquante`, `contradictoire` ;
- la Product Specification S18 affiche `Connu`, `Déclaré`, `Supposé`, `Manquant`, `Contradictoire`, puis utilise aussi `Non applicable` et `obsolète`.

L’écart portait sur la sémantique, pas seulement sur la typographie. PD-009 §0.4, autorité spécialisée sur la navigation et les états qu’elle consomme, a rendu l’arbitrage explicite.

**Politique normative de la V1 :**

- l’état persistant reste celui de PD-003 ;
- l’interface projette `inconnu` sous le libellé `manquante` ;
- `déclaré par l’utilisateur` reste une provenance, combinée avec un état canonique ;
- `non applicable` et `obsolète` restent visibles comme états secondaires lorsqu’ils existent ;
- aucun stockage ni test ne doit créer un septième état implicite.

Cette politique est close pour la tranche : elle applique PD-009 sans créer un état supplémentaire et sans réécrire les sources antérieures. Toute évolution future de cette grammaire relève des autorités compétentes et du SOURCE-OF-TRUTH-INDEX ; elle n’est pas un prérequis restant de PD-007.

### 2.3 Divergences compatibles, explicitement traitées

1. **Six intentions et cinq choix visibles.** La Product Specification définit six familles de parcours. PD-004 gouverne leur présentation : au plus cinq choix mutuellement exclusifs simultanés, les autres par regroupement ou expansion. La V1 ne propose qu’un parcours actif et signale les autres comme différés.
2. **Quatre modes et cinq projections.** `Débutant`, `Standard`, `Expert` et `Core Lab` sont les quatre modes d’accompagnement de S04. `Méthodologiste` est une projection liée au rôle et à la tâche ; elle n’est pas une cinquième note de compétence. Toutes lisent la même stratégie.
3. **Identifiants Rxx.** Toute implémentation, fixture et trace DOIT préfixer les identifiants : `PD005:R01` pour un rôle, `PD002:REF-R01` pour une référence du Reasoning Book.
4. **Deux dimensions de confiance.** Le niveau A–D du Reasoning Book qualifie la confiance scientifique d’une assertion. Les cinq statuts de PD-003/PD-004 qualifient une conclusion projetée. Ils restent stockés, affichés et testés séparément.

### 2.4 Comptage de convergence

- 21 exigences strictement convergentes : C01–C17 et C26–C29 ;
- 5 exigences compatibles après adaptation explicite : C18–C20, C23 et C25 ;
- 1 divergence résolue par autorité explicite : C22 ;
- 1 ambiguïté de namespace contrôlée : C24 ;
- 1 écart d’implémentation : C21 ;
- 0 contradiction non résolue.

---

## 3. Le plus petit produit qui démontre réellement NOXIA

Le plus petit produit démontrable est un **atelier de raisonnement scientifique versionné, limité au cas Fabry, alimenté par un paquet de connaissances revu, et capable de produire soit un rapport méthodologique traçable, soit un arrêt scientifique explicite**.

Il DOIT :

- accepter une intention libre et non une réponse préencodée ;
- construire une mémoire de projet distincte du dialogue ;
- faire sélectionner la prochaine action par la logique PD-009, indépendamment du rôle qui l’exécute ;
- demander une seule information décisionnelle à la fois, uniquement si elle peut modifier une décision, et expliquer son impact ;
- faire choisir un construit primaire avant toute option méthodologique ;
- proposer au moins deux options lorsqu’elles sont scientifiquement défendables, ou expliquer pourquoi une seule l’est ;
- relier toute recommandation à une justification, des preuves, un contexte, des limites et des alternatives ;
- enregistrer l’acceptation, la modification ou le rejet humain avec l’Acteur et le Mandat applicables ;
- exécuter les gates sans contournement ;
- produire un rapport ou un rapport d’arrêt ;
- montrer la trace assertion → preuve → source et décision → justification ;
- créer un Événement d’évolution, une nouvelle version et une analyse d’impact après modification de la population.

Il NE DOIT PAS :

- afficher une réponse Fabry prédéterminée indépendamment des réponses ;
- transformer le Reasoning Book en prompt monolithique ;
- diagnostiquer Fabry, reclasser un VUS ou conseiller un traitement ;
- générer un protocole d’acquisition exécutable ;
- appeler T2 « inflammation », ECV « collagène » ou LGE négatif « absence de fibrose » ;
- publier, indexer ou transmettre automatiquement le rapport ;
- dépendre du PACS, de données patient, d’une analyse d’image ou d’un moteur statistique.

Le premier résultat commercialement et scientifiquement utile est un **rapport de cadrage méthodologique versionné** contenant question, population, construit, objectif, hypothèses, modèle scientifique, options, recommandation, décision humaine attribuée, preuves, incertitudes, limites, résultats des gates dérivés et prochaine action sélectionnée par PD-009. S’il manque une condition, le même document devient un **rapport d’arrêt scientifique** avec cause, portée, éléments conservés et condition de reprise.

---

## 4. Sous-ensemble métier V1

### 4.1 Règle de sélection

La V1 retient 52 des 68 objets de PD-003. Ce nombre ne signifie pas 52 écrans ni 52 tables techniques. Il reflète la chaîne minimale exigée par la mission : cadrer, raisonner, comparer, décider, prouver, naviguer, revoir, projeter et versionner sans fusion sémantique.

Les 16 autres objets restent `DEFERRED_FROM_V1`.

### 4.2 Matrice exhaustive PD-003

| Objet PD-003 | Retenu en V1 ? | Justification | Usage dans le parcours |
|---|---|---|---|
| Dossier de recherche | OUI | Conteneur stable du projet | Création, reprise, propriété des versions et rapports. |
| Acteur du projet | OUI | Toute décision adoptée exige une identité humaine canonique | Responsable scientifique et reviewer identifiés dès J01. |
| Mandat décisionnel | OUI | Une identité seule ne prouve pas l’habilitation à décider | Mandat minimal borné à la famille de décisions de la tranche. |
| Situation de recherche | OUI | Porte la maturité et le jalon courant | Idée → cadrage → stratégie → revue → rapport/arrêt. |
| Intention scientifique | OUI | Conserve la phrase initiale sans la confondre avec la question | Entrée Fabry et comparaison avec la reformulation. |
| Contexte du projet | OUI | Conditionne toutes les recommandations | Finalité, environnement, contraintes et usage attendu. |
| Stratégie scientifique | OUI | Source canonique unique | Agrège la chaîne scientifique validée de la version. |
| Version de stratégie | OUI | Reproductibilité et impact | Snapshot avant et après modification. |
| Contribution | OUI | Toute réponse ou proposition humaine doit conserver sa provenance avant qualification | Entrées, corrections, réponses et avis alimentent Information, Décision ou Revue sans s’y confondre. |
| Question scientifique | OUI | Point d’entrée scientifique stabilisé | Reformulation et gate G01. |
| Objectif scientifique | OUI | Précède toute modalité | Choix O1–O11 ou formulation contrôlée. |
| Hypothèse | OUI | Rend le raisonnement falsifiable | Hypothèses principale, concurrentes et conditions de réfutation. |
| Pathologie ou condition clinique | OUI | Porte Fabry confirmé, suspecté ou variant incertain sans confusion | Domaine, critères d’inclusion et sécurité VUS. |
| Structure anatomique | DEFERRED_FROM_V1 | Le ventricule gauche reste un attribut borné du cas | Devient objet lors de la généralisation anatomique. |
| Population d’étude | OUI | Conditionne preuve et stratégie | Statut diagnostique, sexe biologique rapporté, stade, traitement, fonction rénale. |
| Phénotype | OUI | Sépare maladie, stade et expression | Préhypertrophique, hypertrophique, cicatriciel ou mixte. |
| Phénomène biologique | OUI | Évite l’erreur biomarqueur = mécanisme | Stockage, expansion extracellulaire, lésion active, cicatrice et conséquence. |
| Plan d’étude | DEFERRED_FROM_V1 | La tranche cadre une stratégie, pas un dessin complet | Type d’étude conservé comme contexte minimal. |
| Groupe d’étude | DEFERRED_FROM_V1 | Pas de bras ni comparateur complet en MVP | Requis avant protocole ou pilote réel. |
| Visite ou temps d’observation | DEFERRED_FROM_V1 | Pas de calendrier exécutable | Temporalité minimale portée par contexte et objectif. |
| Intervention ou exposition | DEFERRED_FROM_V1 | Pas d’évaluation thérapeutique dans le cas nominal | Nécessaire pour objectif de réponse thérapeutique. |
| Biomarqueur | OUI | Observable scientifique distinct du phénomène | LGE, ECV, T1, T2, ciné, strain et marqueurs circulants. |
| Variable d’étude | OUI | Porte l’estimand et l’unité sans inventer un endpoint | Présence/topographie/étendue LGE ou autre variable choisie. |
| Critère de jugement | DEFERRED_FROM_V1 | La V1 ne finalise pas le protocole ni l’analyse statistique | Une extension sera obligatoire avant protocole autorisé. |
| Modalité d’imagerie | OUI | Compare IRM, absence de contraste et alternatives sans confondre l’observable | Examen des modalités et faisabilité. |
| Acquisition | DEFERRED_FROM_V1 | Le Reasoning Book interdit une liste de séquences prématurée | Devient nécessaire dans la conception protocolaire. |
| Séquence ou technique d’acquisition | DEFERRED_FROM_V1 | Même frontière | N’est jamais déduite directement de la phrase initiale. |
| Paramètre critique | DEFERRED_FROM_V1 | Aucun paramétrage scanner dans la tranche | Extension protocole/QC. |
| Condition de mesure | OUI | Certaines conditions changent la validité | Contraste, hématocrite, référence locale, qualité, rythme et fonction rénale. |
| Protocole d’imagerie | DEFERRED_FROM_V1 | La sortie est une stratégie ou un refus, pas un protocole | G11 refuse toute demande protocolaire dans la tranche ; une future version normative devra admettre cet objet. |
| Site et environnement technique | DEFERRED_FROM_V1 | Catalogue d’équipement complet hors tranche | Capacités locales saisies comme informations/contraintes. |
| Contrainte | OUI | Conditionne options et arrêt | Contraste, temps, disponibilité, expertise et matériel déclaré. |
| Règle d’harmonisation | DEFERRED_FROM_V1 | Multicentrique avancé hors tranche | Réservée au vertical robuste. |
| Contrôle qualité | DEFERRED_FROM_V1 | Aucun examen n’est exécuté | Exigences de qualité restent des limites/conditions, pas un plan QC. |
| Procédure de lecture | DEFERRED_FROM_V1 | Aucune lecture d’image opérationnelle | Méthode future, préspécifiée avant protocole. |
| Analyse | DEFERRED_FROM_V1 | Aucune statistique ou image exécutée | Plan analytique complet ultérieur. |
| Dimensionnement | DEFERRED_FROM_V1 | Aucun calcul de puissance sans hypothèses numériques | Arrêt si demandé prématurément. |
| Règle d’interprétation | OUI | Protège le langage scientifique | Conditions des termes « compatible », « indéterminé », « progression », etc. |
| Information de projet | OUI | Mémoire structurée distincte du dialogue | Valeur, état, provenance, date et impact. |
| Besoin d’information | OUI | Rend l’inconnu actionnable | Question, raison, décision affectée et condition de reprise. |
| Échange adaptatif | OUI | Explique pourquoi une question est posée | Trace question–réponse sans devenir la source canonique. |
| Option | OUI | Matérialise les alternatives | Stratégies comparables et conséquences. |
| Recommandation | OUI | Porte une proposition contextualisée et contestable | Recommandation argumentée avant décision humaine. |
| Décision | OUI | Conserve l’arbitrage humain | Accepter, modifier, rejeter ou différer. |
| Justification | OUI | Relie décision, raison, preuve, contexte et limite | Rapport et traçabilité. |
| Compromis | OUI | Rend gains et pertes explicites | Comparaison de contraste, biomarqueurs et faisabilité. |
| Dépendance | OUI | Rend le recalcul ciblé possible | Graphe d’impact entre objets. |
| Incertitude | OUI | Empêche une précision factice | Incertitude scientifique, contextuelle ou de mesure. |
| Risque | OUI | Permet revue et mitigation | Risques scientifiques, techniques et interprétatifs. |
| Biais | OUI | Ne doit pas être fusionné avec un simple risque | Sélection, mesure, confusion et transportabilité. |
| Limite | OUI | Borne les conclusions | Limites de preuve, méthode et domaine. |
| Contradiction | OUI | Conserve les informations ou preuves incompatibles | Revue, arbitrage ou arrêt. |
| Alerte méthodologique | OUI | Porte une interdiction ou une escalade visible | VUS, T2, ECV, LGE négatif, seuil importé. |
| Revue méthodologique | OUI | Conditionne le rapport partageable | Findings, sévérité, propriétaire et résolution. |
| Analyse d’impact | OUI | Prouve la propagation du changement | Population modifiée → objets invalidés → nouvelle revue. |
| Événement d’évolution | OUI | Toute modification structurante doit posséder un déclencheur canonique | Déclenche l’Analyse d’impact et la nouvelle Version en J20. |
| Énoncé de connaissance | OUI | Unité factuelle ou normative traçable | Définitions et assertions du paquet Fabry. |
| Relation scientifique | OUI | Représente le modèle physiopathologique | Phénomène → observable, qualification et contexte. |
| Domaine de validité | OUI | Empêche la transposition abusive | Population, modalité, méthode, temporalité et contexte technique. |
| Source scientifique | OUI | Identité versionnée du document | Bibliographie et localisateurs. |
| Preuve scientifique | OUI | Porte soutien, réfutation ou qualification | Traçabilité assertion–source. |
| Synthèse de preuves | OUI | Regroupe sans fabriquer de consensus | État structuré, forces, faiblesses et données manquantes. |
| Controverse scientifique | OUI | Distingue désaccord scientifique et erreur | Options défendables et escalade. |
| État de connaissance effectif | OUI | Toute décision ou projection engageante doit rester reconstructible dans le corpus daté réellement lu | Fige version, digest, date d’effet et domaines applicables du paquet C-KNOW. |
| Règle méthodologique | OUI | Toute priorité, interdiction, propagation ou escalade doit citer une règle gouvernée | Porte les fondements des évaluations dérivées G01–G11 et leurs domaines. |
| Profil de projection | OUI | Sépare destinataire et vérité | Débutant, standard, expert, méthodologiste, Core Lab. |
| Projection | OUI | Adapte forme et profondeur sans modifier le fond | Écran et rapport selon le profil. |
| Rapport scientifique | OUI | Livrable minimal et snapshot du raisonnement | Rapport méthodologique ou rapport d’arrêt. |

### 4.3 Enveloppe et règles communes aux objets retenus

Tout objet retenu possède au minimum : identifiant conceptuel stable, identifiant de version, type canonique PD-003, état, auteur ou producteur, date, provenance, liens vers ses dépendances, version de stratégie propriétaire et motif de dernière modification.

Codes de provenance :

- **U** : déclaré ou décidé par un utilisateur identifié ;
- **K** : issu du paquet scientifique Fabry, avec assertion, preuve, source et version ;
- **D** : calcul déterministe à partir d’objets identifiés ;
- **A** : proposition d’une capacité automatisée, jamais adoptée par défaut.

Règles de modification :

- **M1 — révision :** tout changement de sens, portée ou relation structurante crée une nouvelle révision et déclenche l’analyse d’impact ;
- **M2 — humain :** adoption, rejet, dérogation et acceptation d’un risque appartiennent à l’humain ;
- **M3 — corpus :** un objet K est en lecture seule dans le projet ; son évolution vient d’une nouvelle version gouvernée du paquet scientifique ;
- **M4 — dérivé :** un objet D est régénéré depuis ses dépendances et ne se corrige pas manuellement ;
- **M5 — trace :** une reformulation éditoriale peut modifier une projection, jamais l’identité ou le fond de l’objet.

### 4.4 Catalogue opérationnel des objets retenus

#### 4.4.1 Projet et gouvernance

| Objet canonique | Responsabilité et données minimales | Relations nécessaires | États V1 | Provenance et modification | Projection visible et preuve de présence |
|---|---|---|---|---|---|
| Dossier de recherche | Porte l’identité du projet : titre, confidentialité, cas d’usage et stratégie active. | possède Acteurs, Mandats, Contributions, Intention, Contexte, Stratégie, Versions et Rapports. | proposé, confirmé, révisé, archivé. | U ; M1/M2. | En-tête persistant et V1-01. Requis par la création de projet S02. |
| Acteur du projet | Porte l’identité, le rôle déclaré, l’affiliation éventuelle et les coordonnées de trace d’une personne intervenant dans la tranche. | appartient au Dossier ; possède des Mandats ; produit Contributions, Décisions et Revues. | déclaré, vérifié, inactif, remplacé. | U ; M1/M2. | Responsable, décisionnaire et reviewer visibles sur V1-01, V1-06 et V1-07. Requis par PD-003 et PD-009. |
| Mandat décisionnel | Définit l’acteur habilité, la famille de décisions, la portée, la période d’effet et les limites. | habilite un Acteur sur une Décision ou une Revue dans un Dossier. | proposé, actif, expiré, révoqué, contradictoire. | U ; M1/M2. | Résumé de responsabilité sur V1-01/V1-06 ; absence ou conflit bloque G08. |
| Situation de recherche | Situe le projet dans son cycle : phase, jalon, prochain gate, motif de blocage. | qualifie Dossier et Version de stratégie. | idée, cadrage, stratégie, revue, rapport, arrêté. | D confirmé par U ; M1/M4. | Fil d’étapes et statut. Requis par PD-003 et les transitions S02–S48. |
| Intention scientifique | Conserve mot pour mot la demande, la langue, la date et le canal. | appartient au Dossier ; est reformulée en Question. | proposée, confirmée, révisée. | U ; M1/M5. | Carte « Votre demande » sur V1-02 et rapport. Protège l’écart entre phrase et question. |
| Contexte du projet | Regroupe finalité, usage scientifique, cadre local, temporalité disponible et restrictions déclarées. | contextualise Question, Population, Option, Recommandation et Domaine de validité. | supposé, connu, contradictoire, obsolète. | U/A ; M1/M2. | Mémoire de projet et panneaux « Ce que cela change ». Exigé par la Charte. |
| Stratégie scientifique | Référence canonique de la question jusqu’aux décisions et limites ; statut de readiness et liens aux objets approuvés. | agrège Question, Objectif, Hypothèses, Population, modèle scientifique, Options et Décisions. | exploratoire, proposée, en revue, retenue, bloquée, remplacée. | D/A, retenue par U ; M1/M2/M4. | Carte de stratégie, rapport et toutes projections. Invariant d’unicité PD-003/PD-004. |
| Version de stratégie | Snapshot immuable : numéro, parent, horodatage, motif, auteur, digest des objets et évaluations dérivées. | versionne Stratégie ; précède/succède ; possède Rapport, État de connaissance effectif et Analyse d’impact. | brouillon, figée, remplacée, archivée. | D + U ; M1/M2/M4. | Sélecteur de version V1-09. Requis pour reproductibilité et propagation. |
| Contribution | Conserve contenu, auteur, date, canal, contexte, portée et statut de qualification avant transformation. | produite par Acteur ; peut instruire Information, Question, Recommandation, Décision ou Revue sans s’y substituer. | reçue, qualifiée, contestée, intégrée, rejetée, remplacée. | U/A ; M1/M2. | Trace de chaque réponse ou correction sur V1-02 à V1-07. Requis par PD-009 pour toute information nouvelle. |

#### 4.4.2 Cadrage scientifique

| Objet canonique | Responsabilité et données minimales | Relations nécessaires | États V1 | Provenance et modification | Projection visible et preuve de présence |
|---|---|---|---|---|---|
| Question scientifique | Porte population, construit, finalité, horizon et décision visée dans une formulation contrôlée. | dérive de l’Intention ; cadre Objectif et Hypothèses. | proposée, clarifiée, confirmée, à revoir. | A puis U ; M1/M2. | Question principale V1-02. Gate G01 et Product Specification S12. |
| Objectif scientifique | Décrit l’objectif primaire, les objectifs secondaires et la conclusion interdite. | répond à Question ; motive Variable, Options et Rapport. | candidat, principal, secondaire, rejeté, différé. | K/A puis U ; M1/M2. | Choix O1–O11 dans V1-03. Le Reasoning Book impose objectif avant modalité. |
| Hypothèse | Énonce proposition réfutable, direction éventuelle, hypothèses concurrentes et critère de réfutation. | soutient Objectif ; relie Phénomènes, Variables et Preuves. | candidate, retenue, concurrente, rejetée, non testable. | K/A/U ; M1/M2/M3. | Bloc hypothèses V1-03/V1-04. Requis par la chaîne manifeste. |
| Pathologie ou condition clinique | Qualifie Fabry : confirmé, suspecté, dépistage familial ou VUS ; critères et exclusions. | définit Domaine de validité et Population ; relie Sources. | proposé, confirmé pour le projet, incertain, exclu. | U et K ; M1/M2/M3. | Badge de domaine et alerte VUS. Requis par D1 et la porte de non-protocole. |
| Population d’étude | Décrit unité d’analyse, statut diagnostique, sexe biologique rapporté, âge/plage, stade, traitement, fonction rénale et exclusions. | appartient à Question ; conditionne Domaine, Preuves, Options et Gates. | brouillon, suffisamment définie, contradictoire, à revoir. | U/A ; M1/M2. | Résumé et formulaire guidé V1-03. Gate G03. |
| Phénotype | Décrit expression et stade observés ou visés sans les confondre avec la maladie. | relie Population, Phénomènes, Biomarqueurs et hypothèses concurrentes. | attendu, observé dans le corpus, indéterminé, concurrent. | K/A/U ; M1/M3. | Carte « profils à distinguer » V1-04. Requis par S15/S21 et le cas Fabry. |
| Phénomène biologique | Décrit stockage, expansion extracellulaire, activité lésionnelle, cicatrice ou retentissement, avec compartiment et échelle. | explique Phénotype ; est observé indirectement par Biomarqueur ; soutient Hypothèse. | candidat, primaire, secondaire, concurrent, insuffisamment documenté. | K, sélection U ; M1/M2/M3. | Graphe explicable V1-04. Protège la distinction mécanisme–signal. |

#### 4.4.3 Mesure et faisabilité

| Objet canonique | Responsabilité et données minimales | Relations nécessaires | États V1 | Provenance et modification | Projection visible et preuve de présence |
|---|---|---|---|---|---|
| Biomarqueur | Décrit observable, construit approché, rôle, limites, temporalité et non-conclusions. | observe Phénomène ; est produit par Modalité sous Conditions ; alimente Variable. | candidat, retenu primaire, secondaire, contextuel, rejeté. | K/A puis U ; M1/M2/M3. | Comparateur LGE/ECV/T1/T2/ciné/strain V1-04. |
| Variable d’étude | Définit l’estimand minimal : nom, unité ou catégorie, région, résumé, temps et données manquantes. | opérationnalise Objectif via Biomarqueur ; est bornée par Règle d’interprétation. | candidate, principale, secondaire, exploratoire, non définie. | A/U ; M1/M2. | Fiche « ce qui sera estimé » V1-03/V1-05. Gate G04. |
| Modalité d’imagerie | Décrit la famille de modalité et son rôle, sans ordre de séquences ni paramètre. | fournit Biomarqueurs ; est comparée dans Option ; dépend des Contraintes. | candidate, disponible, indisponible, retenue, rejetée. | K + U local ; M1/M2/M3. | Comparaison de modalités V1-05. S24 sans basculer vers S26. |
| Condition de mesure | Décrit condition nécessaire : contraste, hématocrite, référence locale, qualité, rythme, fonction rénale ou stabilité de méthode. | qualifie Biomarqueur, Variable, Preuve et Option. | connue, supposée, inconnue, contradictoire, non applicable, obsolète. | U/K ; M1/M2/M3. | Badge conditionnel, détail et blocage V1-04/V1-05. |
| Contrainte | Décrit type, valeur/absence, criticité, portée, source locale et possibilité d’atténuation. | limite Option ; déclenche Besoin, Compromis, Risque ou Arrêt. | proposée, confirmée, à vérifier, incompatible, levée. | U/A ; M1/M2. | Panneau contraintes V1-05. Gate G06. |
| Règle d’interprétation | Définit formulation autorisée, formulation interdite, préconditions et conséquence en cas d’échec. | borne Variable, Recommandation et Rapport ; référence Preuves. | active, en revue, non applicable, remplacée. | K ; M3. | Explication contextuelle et contrôle de rapport. Partie XIII du Reasoning Book. |

#### 4.4.4 Raisonnement adaptatif, décision et vigilance

| Objet canonique | Responsabilité et données minimales | Relations nécessaires | États V1 | Provenance et modification | Projection visible et preuve de présence |
|---|---|---|---|---|---|
| Information de projet | Porte valeur, état canonique, provenance, répondant, date, confiance déclarée et impact. | répond à Besoin ; qualifie tout objet de projet. | connu, supposé, inconnu, non applicable, contradictoire, obsolète. | U/A ; M1/M2. | Mémoire structurée latérale et rapport. |
| Besoin d’information | Porte question, raison, décision affectée, criticité, responsable et condition de reprise. | vise Information ; bloque ou qualifie un Gate. | ouvert, demandé, répondu, différé, impossible, clos. | D/A, résolu par U ; M1/M2/M4. | « Pourquoi cette question ? » et liste des inconnues. |
| Échange adaptatif | Conserve invite, options, réponse, refus/« je ne sais pas », raison et objets affectés. | instruit Besoin ; met à jour Information sans la remplacer. | proposé, répondu, ignoré, repris. | A/U ; M1/M5. | Zone de dialogue ; jamais mémoire canonique. Exigence de distinction dialogue/mémoire. |
| Option | Décrit scénario, conditions, bénéfices, pertes, conclusions possibles/impossibles, preuves et risques. | répond à Objectif ; combine Modalité/Biomarqueurs ; comparée par Compromis. | candidate, admissible, inadmissible, retenue, rejetée, différée. | A/K ; décision U ; M1/M2/M3. | Cartes comparatives V1-05. |
| Recommandation | Porte option proposée, contexte, raison, alternatives, preuve, limites, inconnues et validité. | recommande Option ; attend Décision ; possède Justification. | exploratoire, proposée, à revoir, acceptée, rejetée, remplacée. | A/D ; M1/M2/M4. | Bloc argumenté V1-06. Aucune adoption implicite. |
| Décision | Porte question tranchée, choix, acteur humain, date, commentaire, alternatives et effet. | adopte/rejette/modifie Recommandation ; versionne Stratégie. | ouverte, instruite, adoptée, rejetée, différée, rouverte, remplacée. | U uniquement pour l’issue ; M1/M2. | Commandes Accepter/Modifier/Rejeter V1-06 et trace. |
| Justification | Assemble raison, preuve, contexte, alternative, limite et conséquence. | justifie Recommandation ou Décision ; cite Preuves et Sources. | brouillon, complète, incomplète, contestée, remplacée. | D/A, approuvée U ; M1/M2/M4. | Panneau « Pourquoi » et rapport. |
| Compromis | Décrit dimensions comparées, gains, pertes, élément non compensable et décision requise. | compare Options ; nourrit Recommandation et Décision. | identifié, évalué, accepté, refusé, non résolu. | A/D puis U ; M1/M2/M4. | Tableau différentiel V1-05/V1-06. |
| Dépendance | Porte source, cible, type, criticité et règle d’invalidation. | relie tous objets structurants ; alimente Analyse d’impact. | active, conditionnelle, rompue, remplacée. | D ; M4. | Graphe de traçabilité V1-09. |
| Incertitude | Décrit objet, nature, amplitude qualitative, source, effet, réductibilité et responsable. | qualifie Preuve, Option, Recommandation, Gate et Rapport. | détectée, qualifiée, acceptée, à réduire, résolue, persistante. | K/A/U ; M1/M2/M3. | Badge et registre visible sur tous écrans critiques. |
| Risque | Décrit événement, probabilité qualitative, impact, détectabilité, mitigation et risque résiduel. | dérive de Contraintes/Options ; examiné par Revue. | détecté, qualifié, atténué, accepté, bloquant, clos. | A/K, acceptation U ; M1/M2/M3. | Registre V1-07 et rapport. |
| Biais | Décrit sélection, mesure, confusion, attrition ou transportabilité, mécanisme et réduction. | affecte Population, Variable, Preuve, Option et conclusion. | identifié, évalué, réduit, résiduel, bloquant. | K/A, revue U ; M1/M2/M3. | Bloc de revue V1-07. Distinct du risque par PD-003. |
| Limite | Décrit portée, cause, conclusion interdite et visibilité obligatoire. | borne Preuve, Recommandation, Décision et Rapport. | active, reconnue, partiellement réduite, remplacée ; jamais supprimée silencieusement. | K/A/U ; M1/M2/M3. | Alerte persistante et section rapport. |
| Contradiction | Conserve énoncés incompatibles, contextes, sources, sévérité et arbitrage attendu. | relie Informations ou Preuves ; déclenche Controverse/Revue/Gate. | détectée, qualifiée, contextualisée, arbitrée, non résolue. | D/A ; arbitrage U ; M1/M2/M4. | Comparateur de désaccord V1-07. |
| Alerte méthodologique | Porte code, règle violée, sévérité, objets affectés, action et possibilité de reprise. | dérive d’une Règle d’interprétation ou d’un Gate. | active, reconnue, escaladée, résolue ; critique non masquable. | D/K ; M2/M3/M4. | Bandeau blocant V1-03 à V1-08. |
| Revue méthodologique | Porte périmètre, findings, sévérité, reviewer humain, réponses et issue. | examine Stratégie, Risques, Biais, Contradictions et Preuves. | planifiée, en cours, corrections requises, acceptée avec réserves, refusée. | D/A + U ; M1/M2. | Écran V1-07 et signature du rapport. |
| Analyse d’impact | Compare deux versions : objets modifiés, dépendants invalidés, gates à rejouer et décisions à reconfirmer. | relie Versions, Dépendances, Décisions et Projections. | calculée, revue, acceptée, à compléter. | D puis U ; M2/M4. | Diff V1-09. Démonstration obligatoire par changement de population. |
| Événement d’évolution | Porte déclencheur, auteur ou source, date, objet modifié, ancienne/nouvelle valeur et motif. | déclenche Analyse d’impact ; relie Contribution, Information, Version, Décisions rouvertes et Projections obsolètes. | détecté, qualifié, propagé, revu, clos. | U/K/D ; M1/M2/M3/M4. | Ligne de temps et origine du diff V1-09. Toute propagation commence par cet objet. |

#### 4.4.5 Connaissance et preuve

| Objet canonique | Responsabilité et données minimales | Relations nécessaires | États V1 | Provenance et modification | Projection visible et preuve de présence |
|---|---|---|---|---|---|
| Énoncé de connaissance | Porte une conclusion atomique, sa polarité, sa maturité et son contexte. | sujet/objet reliés par Relation ; soutenu/qualifié/réfuté par Preuve. | actif dans le paquet, contesté, insuffisant, remplacé. | K ; M3. | Carte d’assertion V1-04/V1-09. Contrat du Knowledge Graph. |
| Relation scientifique | Porte sujet, prédicat, objet, contexte, direction et limites. | relie Pathologie, Phénomène, Phénotype et Biomarqueur. | proposée dans le paquet, revue, contestée, remplacée. | K ; M3. | Graphe physiopathologique explicable. |
| Domaine de validité | Décrit population, pathologie, modalité, méthode, plateforme, temporalité et exclusions. | qualifie Énoncé, Preuve, Option, Recommandation. | applicable, partiellement applicable, hors contexte, inconnu. | K + comparaison D au projet ; M3/M4. | Badge « applicable à votre contexte ? ». |
| Source scientifique | Porte identité, version, date, type, statut, identifiants et localisateur disponible. | fournit Preuves ; appartient au paquet versionné. | actuelle, corrigée, remplacée, rétractée, inaccessible. | K ; M3. | Fiche source et bibliographie V1-09/V1-08. |
| Preuve scientifique | Porte source, énoncé, stance, localisateur, extraction, qualité, limites et revue humaine. | soutient/réfute/qualifie Énoncé ; alimente Synthèse. | non évaluée, revue, qualifiée, contestée, insuffisante. | K ; M3. | Trace assertion–preuve–source. Aucun `MENTIONS` converti en soutien. |
| Synthèse de preuves | Porte assertions applicables, favorables, défavorables, limites, données manquantes et confiance, sans prose libre. | agrège Preuves dans un Domaine ; nourrit Option/Recommandation. | calculée, revue, contestée, obsolète. | D à partir de K ; M3/M4. | Résumé structuré V1-04/V1-07. |
| Controverse scientifique | Porte positions, contextes, preuves, inconnues et conditions d’arbitrage. | dérive de Synthèse/Contradiction ; nourrit Incertitude et Revue. | ouverte, contextualisée, arbitrage humain requis, résolue par nouvelle preuve, persistante. | K/D ; décision U limitée au projet ; M2/M3/M4. | Bloc « désaccord conservé » V1-07. |
| État de connaissance effectif | Fige version et digest du paquet scientifique, date d’effet, domaines applicables et exclusions réellement lus. | qualifie Version, Recommandation, Décision, Rapport et Projection ; référence C-KNOW. | candidat, actif, remplacé, invalide, historique. | K/D, activation U ; M2/M3/M4. | Badge daté et manifeste de preuve sur V1-04/V1-08/V1-09. Requis pour reconstruire une décision. |
| Règle méthodologique | Porte fondement, domaine, version, période d’effet, exceptions et conséquence d’échec d’une règle de navigation ou de contrôle. | gouverne les évaluations dérivées, Alertes, Revues, Besoins, impacts et refus. | candidate, active, non applicable, remplacée, suspendue. | K/D, gouvernance U ; M2/M3/M4. | Explication « règle appliquée » sur V1-07/V1-09. Les gates ne sont pas des objets métier. |

#### 4.4.6 Projection et rapport

| Objet canonique | Responsabilité et données minimales | Relations nécessaires | États V1 | Provenance et modification | Projection visible et preuve de présence |
|---|---|---|---|---|---|
| Profil de projection | Porte destinataire, rôle, niveau d’accompagnement, profondeur et format. | paramètre Projection ; ne modifie pas Stratégie. | actif, modifié, remplacé. | U ; M1/M5. | Sélecteur Débutant/Standard/Expert/Core Lab et rôle Méthodologiste. |
| Projection | Porte version source, profil, sélection, ordre, vocabulaire et digest de fidélité. | projette Stratégie/Version/Rapport ; cite mêmes Décisions et Preuves. | demandée, produite, relue, remplacée. | D ; M4/M5. | Tous les écrans et variantes de rapport. |
| Rapport scientifique | Porte type, version de stratégie, sections, gates, décisions, preuves, limites, inconnues et signatures. | restitue Version ; possède Projection ; peut être rapport méthodologique ou d’arrêt. | brouillon, revu, partageable, bloqué, remplacé. | D puis revue U ; M2/M4/M5. | Écran V1-08 et livrable minimal. |

### 4.5 Invariants V1

1. Il existe une seule Stratégie scientifique canonique par Version de stratégie.
2. Une Projection ne peut créer, supprimer ou modifier une Décision, une Preuve, une Limite ou un Gate.
3. Une Recommandation sans Option, Justification, Preuve applicable, alternative examinée et incertitude visible est invalide.
4. Une Décision structurante sans acteur humain est invalide.
5. Une information `supposée`, `inconnue` ou `contradictoire` ne peut être projetée comme `connue`.
6. Une mention bibliographique n’est pas une Preuve favorable.
7. Une Preuve hors Domaine de validité ne peut soutenir seule une recommandation.
8. Une modification de Population, Objectif, construit primaire, Variable ou contrainte critique crée une nouvelle Version et rejoue l’Analyse d’impact.
9. Une Limite critique, une Contradiction active ou un Arrêt reste visible dans toutes les projections.
10. Le Rapport scientifique est dérivé des objets approuvés ; il ne comble aucune lacune par rédaction.

---

## 5. Parcours vertical Fabry

### 5.1 Règles du parcours

Le parcours nominal contient 20 étapes scientifiques sur neuf écrans. Une étape n’est pas nécessairement une page : plusieurs étapes successives peuvent utiliser la même zone de travail, mais une seule question décisionnelle principale est visible à la fois.

Le dialogue est une trace d’interaction. La mémoire structurée du projet est la source canonique. Une réponse ne devient un fait de projet qu’après qualification de son état et de sa provenance.

Abréviations de projection :

- **D** débutant : définition au moment utile, exemple, raison de la question, « Je ne sais pas » ;
- **S** standard : choix, conséquence, justification et prochaine action ;
- **E** expert : vue dense, preuves, limites, valeurs et comparaison ;
- **M** méthodologiste : hypothèses, estimand, biais, cohérence et analyse différentielle ;
- **CL** Core Lab : conditions de mesure, reproductibilité, écarts locaux et traçabilité transversale.

### 5.2 Intention, question et décision affectée

| Étape | Objectif scientifique et question principale | Informations affichées et déjà connues | Données demandées et raison | Décision affectée |
|---|---|---|---|---|
| J01 — Créer le projet | Créer un espace responsable. « Comment souhaitez-vous nommer ce projet et qui en porte la décision scientifique ? » | Cas d’usage, confidentialité, absence de stratégie. | Titre, acteur responsable, portée et durée du mandat minimal, niveau d’accompagnement ; nécessaires à l’attribution des décisions. | Existence du Dossier, Acteur, Mandat et profil initial. |
| J02 — Saisir l’intention | Conserver le besoin réel. « Que souhaitez-vous étudier ? » | Projet et cas vertical activé. | Phrase libre, finalité générale ; nécessaire pour ne pas partir d’un biomarqueur. | Intention à reformuler. |
| J03 — Reformuler | Séparer intention et question. « Cette reformulation décrit-elle correctement votre problème ? » | Phrase initiale, ambiguïtés détectées, termes définis. | Accord, correction ou refus ; détermine si le cadrage peut commencer. | Question de travail et besoins de clarification. |
| J04 — Identifier les objectifs | Montrer que « fibrose » recouvre plusieurs buts. « Cherchez-vous d’abord à détecter, quantifier, suivre, expliquer ou qualifier un marqueur ? » | Bibliothèque O1–O11 applicable, conclusions interdites. | Famille d’objectif ; elle change construit, estimand et preuve nécessaire. | Liste d’objectifs candidats. |
| J05 — Choisir l’objectif | Stabiliser un objectif primaire falsifiable. « Quel résultat doit pouvoir changer votre décision scientifique ? » | Objectifs candidats, alternatives, effets du choix. | Objectif primaire, secondaires, décision aval ; nécessaire au gate G02. | Objectif retenu et Variable candidate. |
| J06 — Clarifier la population | Définir le domaine causal. « Chez qui la question doit-elle être étudiée ? » | Dimensions Fabry pertinentes et limites des données. | Confirmation/suspicion/VUS, sexe biologique rapporté, stade, traitement, fonction rénale, comorbidités ; chacune modifie applicabilité et sécurité. | Population et Domaine de validité. |
| J07 — Choisir le construit primaire | Éviter de fusionner cicatrice, expansion, activité et conséquence. « Quel dommage tissulaire est primaire ? » | Quatre construits et observables proches. | Cicatrice focale, expansion diffuse, activité profibrosante ou conséquence ; nécessaire avant modalité. | Phénomène primaire, Variable et hypothèses. |
| J08 — Qualifier les informations manquantes | Rendre l’incomplétude honnête. « Quelle information manque encore pour choisir sans extrapoler ? » | Mémoire connue/supposée/inconnue/contradictoire et impact. | Contraste possible, référence T1 locale, hématocrite, matériel, temporalité, preuve diagnostique ; nécessaires aux gates G03–G06. | Besoins d’information, suppositions autorisées ou blocages. |
| J09 — Présenter le modèle scientifique | Construire le mécanisme avant le signal. « Ce modèle physiopathologique correspond-il au construit et à la population retenus ? » | Stockage → phénotype → activité/expansion/cicatrice, relations, preuves, limites. | Validation du périmètre, relations contestées, phénomènes secondaires ; évite un raccourci causal. | Modèle scientifique du projet. |
| J10 — Sélectionner les biomarqueurs | Attribuer un rôle non substitutif à chaque observable. « Quel biomarqueur approche le mieux le construit primaire ? » | LGE, ECV, T1, T2, ciné, strain ; ce qu’ils soutiennent et n’établissent pas. | Primaire/secondaire/contextuel/rejeté et justification ; nécessaire à la Variable. | Biomarqueurs et règles d’interprétation. |
| J11 — Examiner les modalités | Vérifier la capacité générale sans concevoir un protocole. « Quelle modalité peut produire les observables retenus ? » | Modalités admissibles, rôle du contraste, alternatives sans contraste. | Disponibilité générale et acceptabilité ; modifie les options. | Modalités candidates. |
| J12 — Intégrer les contraintes locales | Tester la faisabilité réelle. « Quelles contraintes locales changent ce choix ? » | Conditions requises, informations locales déjà déclarées, conséquences. | Contraste, champ, référence locale, expertise, temps, fonction rénale et hématocrite ; nécessaires à G06. | Contraintes confirmées, inconnues ou incompatibilités. |
| J13 — Formuler les options | Construire des scénarios comparables. « Quelles stratégies restent scientifiquement défendables ici ? » | Au plus trois options mises en avant, conditions, gains, pertes, conclusions impossibles. | Correction ou option locale supplémentaire ; garantit une alternative réelle. | Options admissibles et compromis. |
| J14 — Recommander | Proposer sans décider. « Quelle option est préférable dans ce contexte, et pourquoi ? » | Proposition principale, alternatives, preuve, limites, risques, inconnues. | Demande de précision ou contestation ; nécessaire avant décision. | Recommandation proposée ou impossibilité de recommander. |
| J15 — Décision humaine | Enregistrer l’arbitrage. « Acceptez-vous, modifiez-vous, rejetez-vous ou différez-vous cette recommandation ? » | Conséquences de chaque action, mandat applicable et écarts aux preuves. | Choix, justification humaine, réserve éventuelle ; acteur et mandat valides sont obligatoires. | Décision attribuée et nouvelle version candidate. |
| J16 — Revue scientifique et méthodologique | Challenger la chaîne complète. « La question, les preuves, la méthode et les conclusions possibles restent-elles cohérentes ? » | Findings, risques, biais, contradictions, sources et objets orphelins. | Réponse aux findings, expert requis, réserve acceptée ; nécessaire à G09. | Revue acceptée, corrections ou escalade. |
| J17 — Porte de non-protocole | Refuser une progression injustifiée. « Les préconditions permettent-elles de transmettre ce cadrage à une future mission protocolaire ? » | D0–D16, évaluations dérivées, objets protocolaires reportés, conditions manquantes et formulations interdites. | Aucune donnée nouvelle si le dossier est complet ; sinon besoin ciblé et raison. | `PROTOCOL_NOT_AUTHORIZED` dans la tranche, avec motifs, portée et condition de reprise. |
| J18 — Produire le rapport | Restituer sans inventer. « Quel état du raisonnement peut être partagé ? » | Sections, décision, gates, preuves, limites, inconnues, revue. | Profil de lecture et commentaire humain final ; adapte la forme seulement. | Rapport méthodologique ou rapport d’arrêt. |
| J19 — Visualiser la traçabilité | Prouver chaque affirmation. « D’où vient cette recommandation et quelle décision l’a adoptée ? » | Graphe assertion–preuve–source et décision–justification–version. | Filtre ou objet à inspecter ; aucun nouveau fait. | Revue de traçabilité, anomalie éventuelle. |
| J20 — Propager un changement | Démontrer la révisabilité. « Que change la modification de la population ? » | Ancienne/nouvelle valeur, dépendances, objets invalidés, projections obsolètes. | Confirmation du changement et décisions à reconfirmer ; évite un recalcul opaque. | Nouvelle Version, Analyse d’impact, retour ciblé et nouvelle revue. |

### 5.3 Objets, validations, erreurs et passages

| Étape | Objets lus | Objets créés ou modifiés | Validation, erreurs, inconnues et contradiction possible | Passage / arrêt | Écran et projection dominante |
|---|---|---|---|---|---|
| J01 | Profil par défaut | Dossier, Acteur, Mandat, Situation, Profil de projection | Titre, acteur ou portée de mandat absents = erreur de saisie ; pas une insuffisance scientifique. | Passe si identité et habilitation minimales ; blocage sinon. | V1-01 ; D/S. |
| J02 | Dossier, Acteur | Intention, Contribution, Échange | Phrase vide = erreur ; demande clinique individuelle ou hors domaine = alerte et arrêt de branche. | Passe si intention scientifique ; arrêt domaine sinon. | V1-02 ; D/S. |
| J03 | Intention, Contexte, Contribution | Question, Besoins, Informations, Contribution | Ambiguïté conservée ; désaccord utilisateur ≠ erreur. | Passe après accord ; reste en clarification ou arrêt sur refus. | V1-02 ; D/S/E. |
| J04 | Question, paquet Fabry | Objectifs candidats, Échange | Aucun objectif applicable = insuffisance scientifique ; objectifs incompatibles restent séparés. | Passe avec au moins un candidat ; arrêt motivé sinon. | V1-03 ; D/S/M. |
| J05 | Objectifs, Contexte | Objectif principal, Variable candidate, Décision | Objectif non falsifiable ou sans décision aval = REVIEW_REQUIRED. | G02 PASS ou retour J04. | V1-03 ; S/E/M. |
| J06 | Question, Objectif, connaissances Fabry | Population, Pathologie, Domaine, Informations/Besoins | VUS traité comme maladie confirmée = arrêt immédiat ; population trop large = blocage ; contradiction de statut = arbitrage. | G03 PASS/REVIEW_REQUIRED/BLOCKED. | V1-03 ; D/S/M. |
| J07 | Objectif, Population, modèle Fabry | Phénomènes, Hypothèses, Variable | Fusion focal/diffus ou activité=fibrose = erreur scientifique bloquante. | G04 PASS si construit unique primaire. | V1-03/V1-04 ; D/S/E/M. |
| J08 | Informations, Conditions, Contraintes | Besoins, Incertitudes, Alertes | Inconnue critique visible ; supposition doit avoir origine ; contradictions non écrasées. | Continue si réductible ou acceptable ; bloque gate affecté sinon. | V1-03 ; D/S/CL. |
| J09 | Énoncés, Relations, Preuves, Domaine | Modèle de projet, Hypothèses, Limites | Source hors contexte ou relation sans preuve = exclue/qualifiée ; absence de paquet applicable = arrêt. | Passe après revue du modèle ; arrêt si socle insuffisant. | V1-04 ; D/E/M. |
| J10 | Phénomènes, Synthèse, Controverse | Biomarqueurs, Règles d’interprétation, Justifications | T2=inflammation, ECV=collagène, T1 normal=exclusion ou LGE négatif=absence absolue déclenchent alerte. | Passe avec rôle borné de chaque biomarqueur. | V1-04 ; D/S/E/M. |
| J11 | Biomarqueurs, Conditions | Modalités, Options préliminaires | Modalité indisponible ne devient pas résultat normal ; sans contraste, l’objectif LGE doit être requalifié. | Continue vers contraintes ou retour J07/J10. | V1-05 ; S/E/CL. |
| J12 | Modalités, Contexte | Contraintes, Informations, Besoins, Risques | Matériel inconnu = information manquante ; incompatibilité critique visible. | G06 PASS/REVIEW_REQUIRED/BLOCKED. | V1-05 ; S/E/CL. |
| J13 | Objectif, Biomarqueurs, Contraintes, Preuves | Options, Compromis, Risques, Biais | Option sans domaine/preuve ou score composite opaque = inadmissible. | G07 PASS avec alternatives examinées ; arrêt si aucune option. | V1-05 ; S/E/M/CL. |
| J14 | Options, Synthèse, Compromis | Recommandation, Justification, Limites | Preuve contradictoire = recommandation contestée ou impossible ; aucune certitude fabriquée. | Continue si proposition honnête ; rapport d’arrêt sinon. | V1-06 ; D/S/E/M. |
| J15 | Recommandation, Preuves, Risques, Acteur, Mandat | Contribution, Décision, Justification humaine, Version candidate | Mandat absent/inapplicable = blocage ; choix incompatible enregistré comme contradiction ; aucune substitution automatique. | G08 PASS après décision attribuée ; REVIEW_REQUIRED si réserve majeure. | V1-06 ; S/E/M/CL. |
| J16 | Stratégie entière | Revue, findings, Alertes, Contradictions | Rupture de chaîne, source manquante, biais critique, rôle hors périmètre ; correction ciblée. | G09 PASS ou retour ; BLOCKED si non résolu. | V1-07 ; E/M/CL, résumé D/S. |
| J17 | Évaluations dérivées, Règles, Reasoning Book D0–D16 | Revue, Alerte, Limite, Besoin, Décision de refus et Projection d’arrêt | Toute condition non satisfaite reste nommée ; aucun objet `Gate` ou `Stop` n’est créé ; aucun bypass. | G11 BLOCKED ou N/A dans cette tranche ; jamais protocole généré. | V1-07/V1-08 ; tous profils. |
| J18 | Version, Revue, Gates, Décisions, Preuves | Rapport, Projection | Section sans objet source = erreur de génération ; chargement partiel ≠ succès. | G10 PASS pour rapport partageable ; sinon brouillon/arrêt. | V1-08 ; D/S/E/M/CL. |
| J19 | Rapport, Dépendances | Anomalie de trace éventuelle | Identifiant cassé, source inaccessible ou `MENTIONS` comme soutien = blocage de partage. | Retour à l’objet fautif ou validation de trace. | V1-09 ; E/M/CL, résumé D/S. |
| J20 | Deux Versions, Dépendances, Décisions, État de connaissance | Événement d’évolution, Analyse d’impact, nouvelle Version, Besoins, projections obsolètes | Modification tardive sans événement ni propagation = échec ; conflit de versions = blocage technique distinct. | Rejouer sous-ensemble affecté puis J16–J19. | V1-09 ; S/E/M/CL. |

---

## 6. Écrans minimaux

### 6.1 Matrice des neuf écrans V1

| Écran V1 | Fonction | Objets manipulés | État d’entrée | État de sortie |
|---|---|---|---|---|
| V1-01 — Créer le projet | Identité, responsabilité et projection initiale | Dossier, Acteur, Mandat, Situation, Profil de projection | Aucun projet | Projet `idée` et mandat minimal créés |
| V1-02 — Intention et question | Saisie, reformulation et clarification | Intention, Contribution, Question, Échange, Information, Besoin | Projet créé | Question de travail acceptée |
| V1-03 — Cadrage scientifique | Objectif, population, construit et inconnues | Objectif, Population, Pathologie, Hypothèse, Phénomène, Variable, Informations | Question acceptée | Gates G01–G04 évaluables |
| V1-04 — Modèle et biomarqueurs | Modèle physiopathologique, preuves et rôles des observables | Phénomène, Phénotype, Biomarqueur, Énoncé, Relation, Preuve, Synthèse, Limite | Cadrage suffisant | Modèle et biomarqueurs bornés |
| V1-05 — Options et contraintes | Faisabilité, alternatives et compromis | Modalité, Condition, Contrainte, Option, Compromis, Risque, Biais | Modèle recevable | Options admissibles comparées |
| V1-06 — Recommandation et décision | Proposition argumentée et arbitrage humain | Recommandation, Justification, Décision, Preuve, Limite | Options examinées | Décision humaine enregistrée |
| V1-07 — Revue et gates | Cohérence globale, risques, controverses et non-protocole | Revue, Contradiction, Controverse, Alerte, Règle méthodologique, Stratégie ; gates dérivés | Décision enregistrée | Revue acceptée, corrections ou arrêt |
| V1-08 — Rapport ou arrêt | Restitution structurée et fidèle | Rapport, Projection, Version, Revue, Alerte, Limite, Besoin, Décision, Sources | Revue terminée | Rapport partageable, brouillon ou arrêt |
| V1-09 — Traçabilité et impact | Preuves, versions et propagation | Dépendance, Preuve, Source, État de connaissance, Événement, Version, Analyse d’impact | Un objet ou une version sélectionnée | Trace vérifiée ou nouvelle boucle ciblée |

### 6.2 Shell commun

Tous les écrans utilisent le même shell : étape courante et statut, question principale, zone de travail, mémoire structurée du projet, panneau contextuel « pourquoi / preuve / conséquence », une action principale et des actions secondaires de poids inférieur.

Les états `vide`, `chargement`, `erreur de saisie`, `défaillance technique`, `donnée partielle`, `blocage scientifique`, `succès partiel` et `succès` sont distincts. Le focus, l’annonce vocale et la reprise reviennent à la question ou à l’erreur concernée. Une limite critique et un arrêt restent hors accordéon.

### 6.3 V1-01 — Créer le projet

- **Objectif :** créer le Dossier sans demander de biomarqueur, modalité ou protocole.
- **Composants :** titre de travail, Acteur responsable, Mandat décisionnel minimal borné à la tranche, confidentialité, mode d’accompagnement, résumé de ce qui sera produit.
- **Action principale :** `Créer le projet de question scientifique`. Actions secondaires : annuler, modifier le mode, lire les responsabilités.
- **Informations et détail progressif :** le résultat et les limites sont visibles ; les règles de confidentialité et projections restent en détail.
- **États :** vide = champs vierges ; chargement = création nommée ; erreur = champ proche et valeur conservée ; blocage = acteur ou mandat absent/inapplicable ; succès = identifiant, mandat et prochaine question annoncés.
- **Accessibilité et appareils :** labels persistants, description des effets, ordre titre→responsable→mode→action. Desktop en deux colonnes, tablette en une colonne large, mobile en pile sans barre d’action masquant les erreurs.
- **Projections :** D explique « responsable scientifique » et la portée du mandat ; E condense ; CL affiche directement acteur, mandat et période d’effet. La science ne change pas.
- **Justification :** Product Specification S02/S04 ; PD-003 Acteur/Mandat/Décision ; PD-004 UX-07/08/51 ; PD-009 responsabilité humaine.

```text
+----------------------------------------------------------+
| NOXIA | Nouveau projet                  Mode : Standard  |
|----------------------------------------------------------|
| Comment souhaitez-vous nommer ce projet ?                |
| [ Fibrose myocardique dans Fabry______________________ ] |
| Responsable scientifique                                |
| [ Sélectionner / saisir ______________________________ ] |
| Mandat : [ Décisions scientifiques de cette tranche v ] |
| Confidentialité [ Projet de travail v ]                  |
| Pourquoi ces informations ?                              |
|                                      [Créer le projet]   |
+----------------------------------------------------------+
```

### 6.4 V1-02 — Intention et question

- **Objectif :** conserver la phrase initiale et obtenir une question de travail acceptée.
- **Composants :** zone de saisie, carte « texte initial », reformulation, termes ambigus, raison de la question et mémoire latérale.
- **Action principale :** `Retenir cette question`. Secondaires : modifier, proposer une autre reformulation, je ne sais pas, arrêter.
- **Informations et détail progressif :** une seule reformulation principale ; alternatives et définitions sur demande ; phrase initiale toujours visible.
- **États :** vide = exemple non prérempli ; chargement = analyse de l’intention ; erreur = sortie non conforme sans perte ; blocage = hors domaine/demande clinique individuelle ; succès = Question versionnée.
- **Accessibilité et appareils :** comparaison annoncée « texte initial / reformulation », changements en texte. Desktop mémoire à droite, tablette panneau sous la question, mobile cartes successives avec retour au même focus.
- **Projections :** D définit construit et objectif ; E montre directement les ambiguïtés ; CL ajoute l’impact sur la reproductibilité.
- **Justification :** S03/S11/S12 ; PD-004 parcours canonique ; PD-005 R02–R04.

```text
+----------------------------------------------------------+
| Étape 1/6 | Comprendre votre question                    |
|----------------------------------------------------------|
| Que souhaitez-vous étudier ?                             |
| [ Je souhaite étudier la fibrose myocardique..._______ ] |
|----------------------------------------------------------|
| Reformulation proposée                                   |
| « Chez quelle population Fabry, quel construit... ? »    |
| [?] Pourquoi NOXIA reformule cette phrase                |
| [Modifier] [Je ne sais pas]       [Retenir cette question]|
+----------------------------------------------------------+
```

### 6.5 V1-03 — Cadrage scientifique

- **Objectif :** stabiliser objectif, population, construit primaire et informations critiques.
- **Composants :** question unique par sous-étape, choix O1–O11 regroupés, fiche population, cartes de construits, mémoire connue/supposée/manquante/contradictoire.
- **Action principale :** change selon la sous-étape (`Retenir cet objectif`, `Retenir cette population`, `Retenir ce construit`). Secondaires : comparer, ajouter une formulation, je ne sais pas, revenir.
- **Informations et détail progressif :** trois options principales au plus ; autres objectifs sous expansion ; la conséquence et la conclusion interdite accompagnent chaque choix.
- **États :** vide = aucun choix ; chargement = applicabilité ; erreur = réponse invalide ; blocage = VUS comme confirmé, population indéfinie ou construit fusionné ; succès = gates G01–G04 affichés.
- **Accessibilité et appareils :** cartes comme boutons radio, statut écrit, erreurs groupées et proches. Desktop comparaison latérale, tablette deux cartes, mobile une carte par ligne sans carrousel obligatoire.
- **Projections :** D exemples concrets ; E matrice complète ; M met en avant estimand/hypothèses ; CL rend visibles les conditions locales sans demander de séquence.
- **Justification :** S13–S19 ; PD-003 ; PD-004 UX-09/10/26 ; Reasoning Book D0–D2.

```text
+----------------------------------------------------------+
| Cadrage 2/4 | Quel dommage tissulaire est primaire ?     |
|----------------------------------------------------------|
| ( ) Cicatrice focale de remplacement                     |
|     Observable proche : LGE | N'exclut pas le diffus     |
| ( ) Expansion extracellulaire diffuse                    |
|     Observable proche : ECV | ≠ collagène spécifique    |
| ( ) Activité lésionnelle profibrosante                   |
| [+ 1 autre construit]                                    |
| Manque critique : statut du contraste                    |
| [?] Ce choix détermine l'estimand       [Retenir ce choix]|
+----------------------------------------------------------+
```

### 6.6 V1-04 — Modèle et biomarqueurs

- **Objectif :** expliquer le modèle pertinent et attribuer un rôle borné aux biomarqueurs.
- **Composants :** graphe phénomène–observable, cartes LGE/ECV/T1/T2/ciné/strain, preuves localisées, limites, controverses et badge d’applicabilité.
- **Action principale :** `Retenir cette hiérarchie de biomarqueurs`. Secondaires : ouvrir les preuves, contester une relation, changer le construit.
- **Informations et détail progressif :** modèle et non-conclusions visibles ; source, extraction et contexte dans un panneau non modal.
- **États :** vide = paquet non chargé ; chargement = source nommée ; erreur = paquet/contrat invalide ; blocage = absence de preuve applicable ; succès = chaque biomarqueur possède rôle et justification.
- **Accessibilité et appareils :** le graphe possède une vue textuelle équivalente et un ordre de lecture. Desktop graphe + inspecteur, tablette bascule, mobile liste hiérarchique ; aucune information dépend de la couleur.
- **Projections :** D langage guidé ; E preuves et contexte ; M hypothèses concurrentes ; CL conditions de mesure et transportabilité.
- **Justification :** S20–S23/S41 ; PD-004 preuves ; Reasoning Book parties I–V.

```text
+----------------------------------------------------------+
| Modèle scientifique | construit : cicatrice focale      |
|----------------------------------------------------------|
| Stockage --qualifie--> T1 natif bas                      |
| Lésion active --------> T2 / troponine (pas inflammation)|
| Cicatrice focale -----> LGE (pas collagène absolu)       |
| Expansion -----------> ECV (espace extracellulaire)      |
| [Voir 7 preuves] [Vue textuelle]                         |
|                         [Retenir cette hiérarchie]        |
+----------------------------------------------------------+
```

### 6.7 V1-05 — Options et contraintes

- **Objectif :** construire des options réalistes à partir du contexte local.
- **Composants :** contraintes, conditions inconnues, comparateur de deux ou trois scénarios, compromis, risques et conclusions impossibles.
- **Action principale :** `Transmettre ces options à la décision`. Secondaires : compléter une contrainte, simuler un retrait, conserver un désaccord.
- **Informations et détail progressif :** raison du classement visible ; dimensions secondaires dépliables ; aucun score global opaque.
- **États :** vide = contraintes non déclarées ; chargement = recalcul des options ; erreur = dépendance cassée ; blocage = matériel/contraste critique inconnu ou aucune option ; succès = alternatives examinées et G06/G07 évalués.
- **Accessibilité et appareils :** comparaison linéarisable, en-têtes répétés, conséquences annoncées. Desktop colonnes, tablette cartes alignées, mobile une option puis commande `Comparer à…` sans perte d’attribut.
- **Projections :** D conséquences essentielles ; E détail des preuves ; M biais/estimand ; CL conditions locales/reproductibilité.
- **Justification :** S17/S24/S25/S37–S39 ; PD-004 UX-09–11 ; PD-005 R13/R16/R27/R36.

```text
+----------------------------------------------------------+
| Options | Contrainte inconnue : référence T1 locale      |
|----------------------------------------------------------|
| OPTION A — LGE primaire       OPTION B — sans contraste  |
| + cicatrice focale            + faisable sans gadolinium |
| - contraste requis            - cicatrice non évaluée    |
| Preuve : contextualisée       Objectif : à requalifier   |
| [Compléter la contrainte] [Comparer les conséquences]    |
|                      [Transmettre ces options]            |
+----------------------------------------------------------+
```

### 6.8 V1-06 — Recommandation et décision

- **Objectif :** présenter une proposition contestable et enregistrer l’arbitrage humain.
- **Composants :** recommandation, chaîne de justification, alternatives, preuves, limites, décisionnaire et commentaire.
- **Action principale :** `Enregistrer ma décision` après choix explicite. Secondaires : modifier l’option, rejeter, différer, demander une expertise.
- **Informations et détail progressif :** preuve et principale limite visibles ; trace complète sur demande ; aucune case précochée.
- **États :** vide = recommandation impossible ; chargement = contrôle de trace ; erreur = justification incomplète ; blocage = décideur absent ou option inadmissible ; succès = Décision et Version candidate.
- **Accessibilité et appareils :** choix annoncé avec conséquences, confirmation non ambiguë, retour au titre après enregistrement. Desktop justification à côté, mobile décision après résumé intégral.
- **Projections :** D reformulation pédagogique ; E accès direct aux sources ; M cohérence objectif–estimand ; CL impact sur conditions et revue. Même option proposée dans toutes.
- **Justification :** S39–S41 ; PD-003 Décision/Justification ; PD-005 R35/R36.

```text
+----------------------------------------------------------+
| Recommandation proposée                                  |
| Option A, car [contexte] et [objectif]                    |
| Preuves : 4 soutiennent | 1 qualifie | limite principale |
| Alternative : Option B — conclusion impossible : LGE     |
|----------------------------------------------------------|
| Votre décision : ( ) Accepter ( ) Modifier ( ) Rejeter   |
| Justification [_______________________________________]   |
|                              [Enregistrer ma décision]    |
+----------------------------------------------------------+
```

### 6.9 V1-07 — Revue et gates

- **Objectif :** contrôler la chaîne globale et appliquer la porte de non-protocole.
- **Composants :** onze gates, findings, registre risques/biais, contradictions, réserves, propriétaire humain et liens de correction.
- **Action principale :** `Clore la revue` seulement si aucun BLOCKED non résolu. Secondaires : corriger, assigner, demander expertise, produire un arrêt.
- **Informations et détail progressif :** bloqueurs et arrêts toujours ouverts ; détails des PASS repliables ; aucun score global.
- **États :** vide = revue non lancée ; chargement = gate nommé ; erreur = contrôle incomplet ; blocage = finding critique ; succès = issue signée et prochaine action.
- **Accessibilité et appareils :** tableau avec statut textuel et résumé, liens d’erreur vers l’objet. Desktop registre + inspecteur, tablette sections, mobile liste priorisée sans masquer le bloqueur.
- **Projections :** D explique la prochaine action ; E vue dense ; M biais/cohérence ; CL conditions/reproductibilité. Les statuts restent identiques.
- **Justification :** S42–S46 ; PD-004 blocages ; PD-005 R27–R33 ; Reasoning Book partie X.

```text
+----------------------------------------------------------+
| Revue | 7 PASS | 2 REVIEW_REQUIRED | 2 BLOCKED           |
|----------------------------------------------------------|
| [BLOCKED] Construit primaire : ECV appelée collagène     |
|            -> Corriger la règle d'interprétation         |
| [BLOCKED] Matériel local : non renseigné                 |
|            -> Demander l'information                     |
| [REVIEW]  Preuve contradictoire -> expertise humaine     |
| [Produire un rapport d'arrêt]              [Clore revue] |
+----------------------------------------------------------+
```

### 6.10 V1-08 — Rapport ou arrêt

- **Objectif :** produire une restitution structurée fidèle à la version et à la revue.
- **Composants :** sommaire, sections, badges de statut, décisions, gates, preuves, limites, inconnues, signature et profil.
- **Action principale :** `Marquer ce rapport comme relu` ; aucun envoi/publication. Secondaires : changer de projection, retourner à l’objet source, comparer la version.
- **Informations et détail progressif :** résumé puis profondeur ; arrêt et conditions de reprise au début d’un rapport d’arrêt.
- **États :** vide = aucune version revue ; chargement = section nommée ; erreur = source d’objet absente ; blocage = trace invalide ; succès = rapport relu ou brouillon explicitement marqué.
- **Accessibilité et appareils :** structure de titres, liens explicites, tableaux refluables, impression non autoritative. Desktop sommaire fixe, tablette sommaire repliable, mobile lecture linéaire.
- **Projections :** D explique les termes ; E condense et expose preuves ; M détaille hypothèses/biais ; CL détaille conditions et réserves. Identifiants et décisions identiques.
- **Justification :** S48/S49/S52 ; PD-004 rapport/projections ; PD-005 R37–R39.

```text
+----------------------------------------------------------+
| Rapport méthodologique v1 | Standard | Revue : réserves  |
|----------------------------------------------------------|
| 1 Question et population                                 |
| 2 Construit, hypothèses et modèle                        |
| 3 Options, recommandation, décision humaine              |
| 4 Preuves, limites, inconnues et gates                   |
| [Voir la source de cette phrase] [Changer de projection] |
|                         [Marquer comme relu]              |
+----------------------------------------------------------+
```

### 6.11 V1-09 — Traçabilité et impact

- **Objectif :** inspecter les preuves et démontrer qu’un changement se propage sans reconstruire silencieusement le projet.
- **Composants :** graphe textuel/visuel, sélecteur de versions, diff, objets invalidés, gates à rejouer et décisions à reconfirmer.
- **Action principale :** `Créer la nouvelle version et rejouer les contrôles`. Secondaires : ouvrir source, revenir à l’objet, annuler le changement.
- **Informations et détail progressif :** résumé d’impact visible avant confirmation ; graphe complet à la demande.
- **États :** vide = une seule version ; chargement = dépendance nommée ; erreur = lien cassé ; blocage = conflit de version ou source inaccessible ; succès = snapshot et plan de recalcul.
- **Accessibilité et appareils :** toute arête a une liste textuelle ; ajouts/retraits décrits sans couleur seule. Desktop diff côte à côte, tablette bascule avant/après, mobile blocs « avant / après / impact ».
- **Projections :** D montre conséquences et prochaines questions ; E graphe complet ; M impacts sur estimand/biais ; CL impacts sur conditions et reproductibilité.
- **Justification :** S47 ; PD-003 Dépendance/Analyse d’impact ; PD-005 R40.

```text
+----------------------------------------------------------+
| Versions : v1 -> v2 | Changement : population            |
|----------------------------------------------------------|
| MODIFIÉ    Statut Fabry : confirmé -> suspicion          |
| INVALIDÉ   Domaine de validité de 6 preuves              |
| À REVOIR   Objectif, biomarqueurs, recommandation        |
| OBSOLÈTE   Rapport v1 (reste consultable)                |
| [Annuler]      [Créer v2 et rejouer les contrôles]       |
+----------------------------------------------------------+
```

### 6.12 Premier écran à montrer

Le premier écran utilisateur est **V1-01 — Créer le projet**. Il montre une promesse bornée — transformer une question en raisonnement méthodologique traçable ou expliquer pourquoi il faut s’arrêter — puis demande uniquement le nom de travail et le responsable scientifique. Il ne montre ni dashboard vide, ni graphe, ni biomarqueur, ni modalité. La phrase Fabry est saisie immédiatement après sur V1-02.

---

## 7. Capacités de rôles V1

### 7.1 Principe

Un rôle de PD-005 est une responsabilité contractuelle, pas la promesse d’un appel séparé à un modèle. La V1 retient 28 responsabilités sur 43 et les regroupe en cinq unités effectives. Ces unités peuvent combiner règles déterministes, lecture d’un paquet scientifique, interaction humaine et, ultérieurement, une capacité automatisée conforme au contrat.

Les rôles de construction et les contrôleurs ne doivent pas partager une sortie auto-validée. Une unité ne peut pas approuver sa propre dérogation.

Le **Decision Engine de PD-009 est un noyau de navigation distinct de ces cinq unités**. Il sélectionne la prochaine action, la prochaine question, la branche, l’arrêt et les impacts à propager. Il n’est ni un sixième rôle IA, ni une responsabilité de R01 ou R04. Les unités exécutent ou contrôlent l’action sélectionnée ; elles ne possèdent pas l’ordre de navigation.

### 7.2 Matrice complète des rôles PD-005

| Rôle cible PD-005 | Besoin V1 | Regroupement possible | Reporté ? |
|---|---|---|---|
| R01 — Orchestrateur d’exécution des rôles | Obligatoire : coordination d’exécution du rôle sélectionné par le Decision Engine | U1, coordination d’exécution | NON |
| R02 — Interpréteur d’intention | Obligatoire | U1 | NON |
| R03 — Reformulateur de question scientifique | Obligatoire | U1 | NON |
| R04 — Gestionnaire des informations manquantes et questions adaptatives | Obligatoire : formulation et conduite de l’Échange sélectionné par le Decision Engine | U1 | NON |
| R05 — Architecte des objectifs et hypothèses | Obligatoire | U1 | NON |
| R06 — Stratège de recherche bibliographique | Obligatoire pour préparer/réviser le paquet Fabry, pas dans le dialogue nominal | U2 hors ligne | NON |
| R07 — Extracteur de preuves | Obligatoire pour le paquet gouverné, aucune extraction libre à l’exécution | U2 hors ligne | NON |
| R08 — Évaluateur de qualité des preuves | Obligatoire pour le paquet gouverné | U2 hors ligne | NON |
| R09 — Synthétiseur de preuves et controverses | Obligatoire pour le paquet et sa synthèse déterministe | U2 hors ligne | NON |
| R10 — Analyste physiopathologique | Obligatoire | U2 | NON |
| R11 — Analyste des phénotypes, diagnostics différentiels et facteurs de confusion | Obligatoire | U2 | NON |
| R12 — Stratège des biomarqueurs | Obligatoire | U2 | NON |
| R13 — Comparateur de modalités | Obligatoire, limité à la stratégie | U2 | NON |
| R14 — Architecte de la population et de l’éligibilité | Obligatoire | U1 | NON |
| R15 — Analyste de reproduction et d’adaptation d’une étude | Hors parcours « question scientifique » | — | OUI |
| R16 — Analyste de faisabilité et contraintes | Obligatoire | U3 | NON |
| R17 — Architecte des critères de jugement | Partiel : estimand et variable seulement, sans endpoint protocolaire complet | U3 | NON |
| R18 — Constructeur de protocole d’acquisition | Protocole interdit dans la tranche | — | OUI |
| R19 — Architecte d’harmonisation multicentrique | Multicentrique avancé reporté | — | OUI |
| R20 — Architecte du calendrier et des visites | Calendrier exécutable reporté | — | OUI |
| R21 — Architecte du contrôle qualité et de la reproductibilité | Exigences signalées, plan QC complet reporté | — | OUI |
| R22 — Architecte de l’analyse d’imagerie et de la lecture | Aucune lecture ou analyse d’image | — | OUI |
| R23 — Architecte du plan statistique | Pas de plan statistique complet | — | OUI |
| R24 — Estimateur de puissance et de taille d’échantillon | Pas d’hypothèses numériques ni calcul | — | OUI |
| R25 — Architecte des données et de leur intégrité | Gouvernance de données avancée reportée | — | OUI |
| R26 — Interprète méthodologique des résultats | Aucun résultat d’étude disponible | — | OUI |
| R27 — Analyste des biais, risques et compromis | Obligatoire | U4 | NON |
| R28 — Contrôleur de traçabilité des sources | Obligatoire et indépendant | U4, contrôle transversal | NON |
| R29 — Contrôleur de conformité du rôle et de la sortie | Obligatoire après chaque sortie structurante | U4, contrôle transversal | NON |
| R30 — Contrôleur de cohérence scientifique globale | Obligatoire | U4 | NON |
| R31 — Contrôleur de domaine, sécurité et escalade humaine | Obligatoire | U4 | NON |
| R32 — Reviewer Simulator | Valeur élevée mais non indispensable à la preuve minimale | — | OUI |
| R33 — Analyste des incertitudes et controverses | Obligatoire ; propose un traitement, jamais un choix scientifique | U4 | NON |
| R34 — Contrôleur de préparation éthique, réglementaire et de gouvernance des données | Requis avant pilote réel impliquant participants/données, pas pour la démonstration sans données | — | OUI |
| R35 — Constructeur de justification | Obligatoire | U5 | NON |
| R36 — Analyste de compromis et d’alternatives | Obligatoire | U3 | NON |
| R37 — Architecte du rapport scientifique | Obligatoire | U5 | NON |
| R38 — Rédacteur scientifique | Obligatoire mais limité aux objets approuvés | U5 | NON |
| R39 — Adaptateur de projection et de niveau d’accompagnement | Obligatoire | U5 | NON |
| R40 — Analyste d’impact des changements | Obligatoire | U5 | NON |
| R41 — Curateur des retours d’expérience | Gouvernance après usage reportée | — | OUI |
| R42 — Assistant de gouvernance des connaissances | Mise à jour continue du corpus reportée | — | OUI |
| R43 — Évaluateur de la Prompt Library | Obligatoire avant promotion d’un pilote réel, mais hors exécution du MVP | — | OUI |

### 7.3 Les cinq unités effectives

| Unité | Rôles sources | Mission, entrées et sorties structurées | Dépendances et autorisations | Interdictions, validation et arrêt | Fallback, preuve et humain |
|---|---|---|---|---|---|
| U1 — Cadrage adaptatif | PD005:R01–R05, R14 | Entrées : action sélectionnée par PD-009, projet, intention, Contributions, paquet de domaines. Sorties : propositions de question, objectif, hypothèses, population, Besoin ou Échange demandé. | Lit/écrit les objets de cadrage autorisés ; exécute l’action sélectionnée ; dépend du contrat d’entrée et des vocabulaires PD-003. | N’invente ni population ni fait ; ne choisit ni prochaine action, ni priorité, ni modalité ; schémas contrôlés par R29 ; signale hors domaine, demande clinique individuelle ou ambiguïté irréductible au Decision Engine. | Si sortie invalide : conserver l’entrée, utiliser une reformulation déterministe ou saisir humainement. Toute adoption de question/objectif/population est humaine. |
| U2 — Construction scientifique bornée | PD005:R06–R13 | Hors ligne R06–R09 : paquet Fabry versionné. À l’exécution R10–R13 : modèle, phénotypes, biomarqueurs, modalités, preuves et limites applicables. | Lecture seule du paquet scientifique ; écrit uniquement le modèle de projet et des propositions ; dépend de C-KNOW et du Domaine de validité. | Pas de recherche web libre en parcours, pas de source inventée, pas de `MENTIONS` promu, pas de diagnostic, pas de seuil universel ; R28/R30 contrôlent ; arrêt si aucune preuve applicable. | Si paquet indisponible/incompatible : afficher les éléments conservés et produire C-STOP. La structuration et l’activation du paquet exigent revue scientifique humaine. |
| U3 — Options et faisabilité | PD005:R16, R17 limité, R36 | Entrées : objectif, estimand, biomarqueurs, contraintes, preuves. Sorties : options, compromis, conditions, conclusions impossibles et recommandabilité. | Peut comparer et classer avec raison ; dépend des informations locales et de gates G02–G06. | Ne conçoit ni acquisition ni statistique ; ne fabrique pas d’alternative ; ne masque pas une inconnue ; validation de cohérence puis contrôle U4. | Si contrainte inconnue : Besoin d’information. Si aucune option : rapport d’arrêt. L’humain peut proposer une option, soumise aux mêmes contrôles. |
| U4 — Assurance scientifique indépendante | PD005:R27–R31, R33 | Entrées : état complet, sorties des autres unités, preuves, risques et Règles méthodologiques. Sorties : conformité, findings, contradictions, escalades et traitement des incertitudes qui alimentent les évaluations dérivées. | Lit tout ; écrit vigilance/revue, jamais une décision scientifique ni l’ordre de navigation. R29 contrôle forme/périmètre, R28 sources, R30 chaîne, R31 domaine. | Ne valide pas sa propre exception, ne tranche pas une controverse, ne remplace pas l’expert ; signale trace absente, incohérence critique, usage hors domaine ou risque majeur au Decision Engine. | Fallback : revue humaine obligatoire et statut REVIEW_REQUIRED/BLOCKED dérivé. Une réserve n’est clôturée que par action attribuée. |
| U5 — Justification, rapport, projection et impact | PD005:R35, R37–R40 | Entrées : version approuvée, décisions, preuves, revue, profil, ancienne/nouvelle version. Sorties : justification, rapport, projection fidèle et analyse d’impact. | Peut ordonner, reformuler et sélectionner ; dépend de R28/R30/R31 et de la décision humaine. | N’ajoute aucun fait, ne change aucune décision selon le profil, ne garde pas un rapport obsolète comme courant ; arrêt si objet source absent ou gate G10 bloqué. | Fallback : rapport structuré sans prose libre ou rapport d’arrêt. Relecture humaine avant statut partageable ; changement de population reconfirmé humainement. |

### 7.4 Conditions communes de sortie

Chaque sortie structurante contient : rôle(s) source(s), version de contrat, identifiants d’entrée, identifiants créés/modifiés, faits proposés, inconnues, preuves, limites, confiance, statut, motif d’arrêt éventuel et journal de validation. Une sortie de forme invalide n’est pas persistée. Une sortie scientifique valide en forme mais sans preuve applicable reste `REVIEW_REQUIRED` ou `BLOCKED`.

PD-007 ne choisit ni fournisseur, ni modèle, ni paramètres et ne rédige aucun prompt définitif.

---

## 8. Dépendances scientifiques

### 8.1 Matrice de disponibilité

| Besoin | Source actuelle | Disponible ? | Adaptation requise | Risque |
|---|---|---|---|---|
| Définitions Fabry, GLA, variants et différences de trajectoire | Reasoning Book, parties II et XIII | Narratif | Structurer des énoncés atomiques, domaines et preuves sous revue humaine | Diagnostic ou généralisation individuelle abusive. |
| Quatre construits de « fibrose » | Reasoning Book, partie I et table construit–observable | Narratif précis | Encoder concepts, relations, non-conclusions et localisateurs | Fusion cicatrice/expansion/activité/conséquence. |
| Modèle physiopathologique | Reasoning Book, parties II–III | Narratif | Sélectionner uniquement les relations nécessaires et conserver leurs niveaux/limites | Graphe causal présenté comme certitude. |
| Cinétique et rôle des biomarqueurs | Reasoning Book, parties IV–V | Narratif | Structurer rôle, temporalité, conditions, confusions et conclusion interdite | Biomarqueur traité comme construit ou diagnostic. |
| Objectifs O1–O11 | Reasoning Book, partie VII | Narratif directement lisible | Fiches candidates versionnées ; activation humaine ; la V1 peut limiter les objectifs activés | Bibliothèque transformée en prescription universelle. |
| Hypothèses H1–H12 | Reasoning Book, partie VIII | Narratif | Assertions réfutables, concurrentes, domaines et preuves | Hypothèse promue en fait. |
| Décisions D0–D16 et porte de non-protocole | Reasoning Book, parties IX–X | Narratif normatif dans son corpus | Encoder gates candidats, les relire, les relier aux contrats PD-007 | Extraction automatique erronée ou blocage hors contexte. |
| Carte d’évidence et niveaux A–D | Reasoning Book, partie XI et bibliographie | Narratif/sourcé | Résoudre chaque `PD002:REF-Rxx`, créer Source/Preuve/localisateur et documenter revue | Citation mentionnée interprétée comme soutien ; confiance convertie en conclusion. |
| Questions non résolues | Reasoning Book, partie XII | Narratif | Conserver comme inconnues/controverses, jamais les compléter automatiquement | Faux consensus. |
| Formulations autorisées/interdites | Reasoning Book, partie XIII | Narratif | Encoder après revue comme règles d’interprétation versionnées | Règle appliquée hors domaine ou sans nuance. |
| Assertions et preuves génériques ECV/T1 | P4/P4R et registres actuels | Oui, structuré | Filtrer contexte et population ; ne réutiliser que les assertions effectivement applicables | Transposition d’autres maladies ou plateformes à Fabry. |
| Assertions génériques LGE | P5, domaine `myocardial-tissue-characterization` | Oui, structuré | Relier au paquet Fabry comme preuve générique qualifiée, jamais comme preuve Fabry suffisante | Motif ou méthode LGE généralisé sans validation dédiée. |
| Synthèses, limites et contradictions | Moteurs scientifiques actuels | Partiellement | Adapter la sortie au contrat C-KNOW et ajouter les éléments Fabry revus | Synthèse automatique confondue avec revue humaine. |
| Capacités matérielles locales | Aucune source documentaire exhaustive | Non | Saisie/confirmation utilisateur ; vocabulaire minimal de condition et contrainte | Option irréalisable ou fausse précision. |
| Données propres au projet | Utilisateur | À saisir | Qualifier état, provenance, date et impact ; aucune donnée patient dans la tranche | Supposition cachée, donnée sensible ou information obsolète. |
| Objets calculés pendant le projet | Dépendances PD-003 et contrats PD-007 | À implémenter | Dérivation déterministe, version et digest | Recalcul opaque ou incohérence entre projections. |

### 8.2 Paquet scientifique Fabry minimal

Avant tout parcours non factice, un paquet `FABRY-MYOCARDIAL-FIBROSIS` DOIT contenir au minimum :

- identifiant et version du Reasoning Book source ;
- concepts et relations nécessaires aux quatre construits ;
- objectifs activés pour la V1 ;
- hypothèses et décisions candidates pertinentes ;
- assertions atomiques, stances de preuve, sources et localisateurs ;
- domaines de validité, niveaux A–D, limites, controverses et questions ouvertes ;
- formulations autorisées/interdites ;
- trace de structuration et décision de revue scientifique humaine ;
- digest et date d’effet ;
- aucune instruction d’acquisition, dose, paramètre ou seuil universel inventé.

La V1 peut exploiter directement le Reasoning Book pour lecture humaine, glossaire et vérification des formulations. Elle ne peut exploiter ses tableaux, objectifs, décisions ou références comme logique qu’après leur structuration et leur revue.

### 8.3 Ce qui doit rester narratif

Restent narratifs dans la V1 : explications pédagogiques longues, histoire scientifique, nuances mécanistiques non nécessaires à un gate, discussion des fragilités de littérature et questions de recherche ouvertes. Ils peuvent être cités par section mais ne pilotent pas une décision.

### 8.4 Ce qui ne devient jamais automatiquement une règle

Ne doivent jamais être transformés automatiquement en règle : fréquence observée dans une cohorte, association pronostique, seuil propre à une étude, motif « typique », interprétation d’auteur, niveau A–D, absence de résultat, texte de recommandation, hypothèse mécanistique, étude de cas, ou simple présence d’une référence. Une règle nécessite une structuration explicite, un domaine, des preuves, des limites, une décision de gouvernance et une revue humaine.

---

## 9. Contrats du vertical slice

### 9.1 Principes de contrat

Tout contrat possède un identifiant, une version, des champs obligatoires, des invariants, un statut de validation et une erreur structurée. `null`, `UNKNOWN`, `NOT_APPLICABLE` et `CONTRADICTORY` ne sont jamais interchangeables. Une erreur technique ne devient pas une insuffisance scientifique, et réciproquement.

Les contrats `C-STOP` et les gates `G01`–`G11` sont des **contrats et évaluations dérivées de tranche**, pas des objets métier supplémentaires. Leur trace persiste exclusivement au moyen des objets PD-003 retenus, notamment Règle méthodologique, Revue méthodologique, Alerte méthodologique, Limite, Besoin d’information, Décision, Rapport et Projection.

### 9.2 Les douze contrats

| ID | Contrat | Champs minimaux | Invariants et sortie en échec |
|---|---|---|---|
| C-IN | Contrat d’entrée | texte initial, langue, finalité déclarée, responsable humain, domaine demandé, consentement au cas de démonstration | Texte conservé sans correction silencieuse ; demande clinique individuelle/hors domaine → C-STOP. |
| C-PROJECT | Contrat de projet | Dossier, Acteurs, Mandats, Contributions, Situation, contexte, stratégie active, version, État de connaissance effectif, Règles actives, profil, états d’information, provenance | Une seule stratégie active par version ; acteur et mandat minimal requis ; conflit de version → blocage technique. |
| C-DECISION | Contrat de décision | question, options, recommandation éventuelle, choix humain, Acteur, Mandat applicable, date, justification, réserves, version | Aucune issue adoptée sans humain habilité ; option inadmissible reste visible et déclenche contradiction/revue. |
| C-EVIDENCE | Contrat de preuve | assertion, source révisée, stance, localisateur, extraction, domaine, qualité, limites, revue | `MENTIONS` ≠ soutien ; source/locator absents → preuve invalide ; hors contexte → qualifiée/exclue. |
| C-RECOMMENDATION | Contrat de recommandation | objectif, option proposée, contexte, justification, alternatives, preuves, incertitudes, limites, risques, validité | Pas de recommandation sans alternative examinée ni preuve applicable ; échec → REVIEW_REQUIRED ou C-STOP. |
| C-MISSING | Contrat d’information manquante | question, état canonique, raison, décision/gate affecté, criticité, responsable, condition de reprise, supposition autorisée ou non | Aucune réponse forcée ; inconnue critique visible dans rapport ; impossible à obtenir → arrêt ou restriction. |
| C-STOP | Contrat d’arrêt | code, cause, portée, règle et évaluation dérivée, objets conservés, conclusions interdites, prochaine information/expertise, condition de reprise, acteur | Produit Besoin, Limite, Alerte, Revue, Décision et/ou Rapport selon le cas ; ne crée aucun objet `Stop`, ne supprime rien et n’offre aucun contournement. |
| C-REPORT | Contrat de rapport | type, version source, état de connaissance, question, population, construit, objectif, hypothèses, options, décision, preuves, limites, résultats dérivés des gates, revue, profil | Chaque phrase structurante pointe vers un objet ; rapport obsolète reste consultable mais non courant. |
| C-VERSION | Contrat de version | identifiant, parent, Événement d’évolution, motif, auteur, date, digest, objets, État de connaissance, Règles, résultats dérivés, décisions reconfirmées, analyse d’impact | Snapshot immuable ; changement structurant sans événement, analyse et nouvelle version → invalide. |
| C-EXPLANATION | Contrat d’explication | objet expliqué, raison, preuve, contexte, alternative, limite, conséquence, niveau de langage | N’ajoute aucun fait ; même identifiant scientifique dans toutes projections ; trou → explication incomplète. |
| C-PROJECTION | Contrat de projection | version source, état de connaissance, profil, rôle, sélection, ordre, vocabulaire, identifiants conservés, résultats dérivés, digest de fidélité | Aucune décision, preuve, limite ou issue de gate applicable modifiée ou cachée ; divergence → projection invalide. |
| C-KNOW | Contrat du paquet scientifique | domaine, version, concepts, assertions, relations, preuves, sources, localisateurs, limites, controverses, revue humaine, digest, date d’effet | Pas d’activation sans revue humaine, trace et État de connaissance effectif ; Reasoning Book narratif seul → paquet non prêt. |

### 9.3 Codes d’arrêt V1 minimaux

`OUT_OF_DOMAIN`, `INDIVIDUAL_CLINICAL_REQUEST`, `QUESTION_NOT_CLARIFIABLE`, `POPULATION_NOT_DEFINED`, `VUS_TREATED_AS_CONFIRMED`, `PRIMARY_CONSTRUCT_NOT_DEFINED`, `NO_APPLICABLE_EVIDENCE`, `CRITICAL_LOCAL_CONSTRAINT_UNKNOWN`, `NO_DEFENSIBLE_OPTION`, `HUMAN_REVIEW_REQUIRED`, `GLOBAL_INCOHERENCE`, `TRACEABILITY_FAILURE` et `PROTOCOL_NOT_AUTHORIZED`.

---

## 10. Gates

### 10.1 Sémantique commune

Un gate est une évaluation déterministe et versionnée d’objets PD-003 au regard d’une ou plusieurs Règles méthodologiques. Il n’est jamais persisté comme objet métier autonome.

- `PASS` : les critères du gate sont démontrés pour la version courante ;
- `REVIEW_REQUIRED` : une réserve explicite requiert une décision ou expertise humaine avant le jalon concerné ;
- `BLOCKED` : la progression visée est interdite ; C-STOP impose la création des objets canoniques appropriés, dont un Besoin, une Alerte, une Limite, une Revue, une Décision ou un Rapport ;
- `NOT_APPLICABLE` : le gate ne s’applique pas, avec justification et périmètre.

Un statut appartient à une Version de stratégie. Il ne se copie pas vers la version suivante sans réévaluation.

### 10.2 Matrice des onze gates

| Gate | Question et preuve attendue | PASS | REVIEW_REQUIRED | BLOCKED / NOT_APPLICABLE | Propriétaire humain |
|---|---|---|---|---|---|
| G01 — Question suffisamment claire | Question, finalité, décision visée, ambiguïtés restantes | Formulation non ambiguë pour le jalon | Ambiguïté bornée sans effet immédiat | Non clarifiable = BLOCKED | Responsable scientifique |
| G02 — Objectif identifié | Objectif primaire falsifiable et conclusion interdite | Un objectif principal retenu | Plusieurs objectifs hiérarchisés à confirmer | Aucun objectif ou modalité déguisée en objectif = BLOCKED | Responsable scientifique |
| G03 — Population définie | Population et statut Fabry, exclusions, dimensions pertinentes | Domaine minimal complet | Sous-groupe ou statut à confirmer | VUS comme confirmé, population indéfinie = BLOCKED | Responsable scientifique / expert Fabry si requis |
| G04 — Construit primaire défini | Compartiment, échelle, Variable et phénomènes secondaires | Un construit primaire, autres séparés | Double construit avec estimands séparés à revoir | Fusion ou construit absent = BLOCKED | Responsable scientifique |
| G05 — Preuves suffisantes ou incertitude acceptable | C-KNOW, preuves applicables, limites, controverses | Socle applicable et limites acceptables pour une option | Preuve faible/contradictoire requiert expertise | Aucune preuve applicable ou extrapolation interdite = BLOCKED | Reviewer scientifique humain |
| G06 — Contraintes connues | Conditions critiques et informations locales | Toutes connues ou non applicables | Inconnue non critique avec plan | Contrainte critique inconnue/incompatible = BLOCKED | Responsable local |
| G07 — Alternatives examinées | Au moins deux options pertinentes ou justification qu’une seule existe | Comparaison et compromis complets | Alternative plausible à instruire | Score opaque, fausse alternative ou aucune option = BLOCKED | Responsable scientifique |
| G08 — Décision humaine enregistrée | C-DECISION signé et justification | Adoption/rejet/modification/différé attribué | Réserve majeure ou désaccord d’équipe | Aucune décision humaine = BLOCKED | Décisionnaire déclaré |
| G09 — Cohérence globale vérifiée | R28–R31, revue, risques, biais et traces | Aucun finding bloquant | Findings non bloquants attribués | Rupture de chaîne, source manquante ou risque majeur = BLOCKED | Reviewer indépendant |
| G10 — Rapport autorisé | C-REPORT complet, version et trace valides | Rapport méthodologique ou d’arrêt relu | Brouillon partageable seulement dans un périmètre nommé | Trace invalide = BLOCKED ; aucun rapport demandé = N/A | Responsable scientifique |
| G11 — Protocole autorisé ou refusé | PD-009 §15, D0–D16 et conditions de la partie X du Reasoning Book | Hors périmètre V1 : aucune branche ne peut produire PASS tant que les objets protocolaires reportés ne sont pas admis | Une expertise peut préciser les conditions de reprise, sans autoriser le protocole dans la tranche | Demande de protocole = `PROTOCOL_NOT_AUTHORIZED` et BLOCKED ; aucune projection protocolaire demandée = N/A | Responsable scientifique habilité + expertise requise |

G11 ne produit jamais un protocole ni un statut d’éligibilité positif dans cette tranche. Il constate un refus borné si une projection protocolaire est demandée, ou `NOT_APPLICABLE` si elle ne l’est pas. Une future phase ne pourra rendre cette évaluation positive qu’après admission de ses objets, contrats, règles, revues et tests dans une nouvelle version normative.

### 10.3 Portée de PASS

Un `PASS` PD-007 qualifie uniquement un gate de la Version de stratégie dans cette tranche. Il ne démontre ni gain de temps, ni supériorité, ni non-infériorité, ni transportabilité, ni valeur scientifique du produit. Seule une campagne recevable gouvernée par PD-011 peut produire un `PASS` officiel de publication dans un périmètre défini.

---

## 11. Tests de preuve à définir avant le code

La stratégie comporte 39 tests normatifs répartis dans les 14 catégories imposées. Ils constituent le catalogue de cas candidats de PD-007 pour le développement, la qualification et la non-régression de la tranche. Les jeux scientifiques attendus doivent être revus et versionnés ; une phrase attendue n’est pas un golden master si elle n’est pas reliée aux objets et contrats qu’elle protège.

Même réussis à 39/39, ces tests ne constituent ni un jeu aveugle, ni une référence experte indépendante, ni une comparaison de valeur, ni un `PASS` PD-011. Toute admission à un jeu officiel suit PD-011 §5.7 ; toute publication suit ses portes indépendantes de la section 14.

| ID | Scénario | Entrée | Résultat attendu | Contrat protégé |
|---|---|---|---|---|
| MET-01 | Chaîne métier complète | Intention Fabry + contexte nominal | Acteur, Mandat, Contribution, intention, question, objectif, population, construit, hypothèses, état de connaissance, règles, preuves, options, décision, revue et rapport possèdent des identités distinctes et liées | C-PROJECT, invariants PD-003 |
| MET-02 | Une stratégie, plusieurs projections | Même version demandée en D/S/E/M/CL | Mêmes identifiants de décisions, preuves, limites et gates ; seules sélection, ordre et vocabulaire changent | C-PROJECTION |
| MET-03 | Recommandation sans décision humaine habilitée | Recommandation valide sans Acteur, sans Mandat applicable ou sans choix | G08 BLOCKED ; aucune option adoptée, rapport marqué sans décision | C-DECISION, G08 |
| TRN-01 | Parcours nominal | Entrées complètes et cohérentes | J01→J20, chaque prochaine action sélectionnée par PD-009, rapport produit, aucune étape scientifique sautée | C-PROJECT, gates |
| TRN-02 | Saut direct intention→protocole | Phrase initiale puis demande de protocole | Refus `PROTOCOL_NOT_AUTHORIZED`, retour à G01/G02/G04 | C-STOP, G11 |
| CON-01 | Preuves opposées | SUPPORTS et REFUTES applicables à la même assertion | Contradiction/controverse conservée, G05 REVIEW_REQUIRED, aucune moyenne de positions | C-EVIDENCE, G05 |
| CON-02 | États d’information incompatibles | Deux valeurs connues incompatibles, dont une déclarée utilisateur | État canonique `contradictoire`, provenance conservée, aucune valeur écrasée | C-PROJECT, politique §2.2 |
| MIS-01 | Contrainte matérielle inconnue | Champ/plateforme/référence locale non renseignés | C-MISSING créé, G06 REVIEW_REQUIRED ou BLOCKED selon option ; jamais une valeur par défaut | C-MISSING, G06 |
| MIS-02 | Population incomplète | Statut Fabry et stade absents | Questions adaptatives avec raison ; G03 BLOCKED tant que domaine non borné | C-MISSING, G03 |
| REF-01 | Protocole sans objectif ni estimand | Demande d’ordre de séquences | Arrêt, objectifs candidats proposés, aucun protocole ni paramètre | C-STOP, G02/G04/G11 |
| REF-02 | VUS traité comme maladie confirmée | Population « Fabry confirmée » fondée uniquement sur un VUS | Arrêt `VUS_TREATED_AS_CONFIRMED`, correction de population requise | C-STOP, G03 |
| REF-03 | Cicatrice focale demandée sans contraste | Objectif LGE primaire + contraste indisponible | Même estimand refusé ; proposition de requalification vers phénotypage non contrasté | C-RECOMMENDATION, G04/G06/G11 |
| REF-04 | Seuil universel importé | Seuil T1 ou étendue LGE provenant d’une autre plateforme/cohorte | Option inadmissible ou qualifiée ; domaine local demandé ; aucune règle universelle | C-EVIDENCE, C-STOP |
| TRA-01 | Trace de recommandation | Une recommandation nominale | Navigation complète recommandation→option→justification→assertion→preuve→source/localisateur | C-EVIDENCE, C-EXPLANATION |
| TRA-02 | Source mentionnée seulement | EvidenceLink `MENTIONS` | La source n’apparaît pas dans les preuves favorables ; rapport signale l’absence de soutien | C-EVIDENCE, G10 |
| REP-01 | Reproductibilité déterministe | Même projet, même État de connaissance, mêmes Règles et contrats, deux exécutions | Objets D, actions sélectionnées, résultats de gates et digest identiques hors métadonnées temporelles autorisées | C-PROJECT, C-KNOW |
| REP-02 | Snapshot immuable | Rapport v1 puis modification v2 | v1 inchangée et consultable ; un Événement d’évolution précède v2, qui possède parent, motif, nouveau digest et états rejoués | C-VERSION |
| IMP-01 | Modification tardive de population | Confirmé→suspicion ou ajout de VUS après décision | Événement créé ; Domaine, preuves, hypothèses, options, recommandation, gates et rapport invalidés selon dépendances ; décision à reconfirmer | C-VERSION, Analyse d’impact |
| IMP-02 | Source corrigée/rétractée | Nouvelle version du paquet scientifique | Nouvel État de connaissance et Événement ; preuves et synthèses affectées, rapport courant obsolète, ancienne version conservée | C-KNOW, C-VERSION |
| PROJ-01 | Changement de niveau | Passage Débutant→Expert sur une décision | Densité et outils changent ; décision, recommandation, preuve, limite et gate identiques | C-PROJECTION |
| PROJ-02 | Méthodologiste et Core Lab | Même stratégie projetée pour M puis CL | M met en avant hypothèses/estimand/biais ; CL conditions/reproductibilité ; aucun protocole parallèle | C-PROJECTION |
| A11Y-01 | Parcours clavier et focus | J01→J18 sans pointeur | Toutes actions atteignables ; focus logique ; erreur/blocage annoncé et reprise au bon endroit | C-PROJECTION, PD-004 |
| A11Y-02 | Statut sans couleur | Couleurs désactivées / contraste forcé | États, gates, preuves et alertes restent identifiables en texte et structure | C-PROJECTION, PD-004 |
| A11Y-03 | Mobile 320 px et zoom | 320 px, zoom 200 %, bloqueur actif | Aucune décision/preuve/limite perdue ; pas de défilement horizontal obligatoire ; bloqueur visible | C-PROJECTION, PD-004 |
| SCI-01 | T2 assimilé à inflammation | « T2 élevé = inflammation prouvée » | Alerte ; reformulation eau/lésion active compatible ; histologie/contexte requis | C-EXPLANATION, Règle d’interprétation |
| SCI-02 | ECV assimilée au collagène | « ECV 30 % = 30 % collagène » | Alerte ; ECV décrite comme fraction extracellulaire, mécanismes concurrents visibles | C-EXPLANATION, Règle d’interprétation |
| SCI-03 | T1 normal exclut Fabry | T1 dans l’intervalle local | Pseudonormalisation/mosaïcisme possibles ; aucune exclusion, domaine et contexte affichés | C-EVIDENCE, C-EXPLANATION |
| SCI-04 | LGE négatif exclut toute fibrose | LGE absent | Sortie « aucune cicatrice focale détectable dans ces conditions » ; diffus/microscopique non exclu | C-EXPLANATION |
| SCI-05 | Association transformée en causalité | Cohorte pronostique ou seuil de 15 % | Association conservée ; aucune indication thérapeutique ni causalité | C-EVIDENCE, C-RECOMMENDATION |
| SCI-06 | Valeur locale non transportable | T1/ECV d’un autre champ, méthode ou logiciel | Hors contexte ou REVIEW_REQUIRED ; référence locale demandée | C-EVIDENCE, G05/G06 |
| FAB-01 | Parcours nominal O1 | Fabry confirmé, objectif détection cicatrice focale, contraste possible, contexte complet | LGE proposé avec attribution et limites ; T1/T2 contextuels ; décision humaine habilitée ; rapport traçable ; G11 N/A faute de demande protocolaire | Tous contrats, G01–G10 ; G11 N/A |
| FAB-02 | Intention ambiguë | Phrase seule « étudier la fibrose » | Présentation de construits/objectifs, aucune modalité proposée avant choix | C-IN, G01/G02/G04 |
| FAB-03 | Femme sans hypertrophie | Population féminine, LVH absente | Population conservée ; LGE/T1 examinés sans exclusion automatique ; limites du corpus visibles | C-KNOW, G03/G05 |
| FAB-04 | Fonction rénale/contraste inconnu | Objectif cicatrice focale, statut rénal absent | Besoin critique ; option avec contraste non recommandable ; alternative requalifiée explicitement | C-MISSING, G06 |
| FAB-05 | Preuve Fabry insuffisante | Paquet sans localisateur ou sans revue humaine | C-KNOW invalide, G05 BLOCKED, rapport d’arrêt ; aucun fallback narratif présenté comme preuve | C-KNOW, C-STOP |
| ROLE-01 | Sortie de rôle hors schéma | Champ obligatoire absent ou identifiant inventé | R29 rejette, aucune persistance, journal et fallback humain/déterministe | Contrats de rôle, C-PROJECT |
| ROLE-02 | Dépassement de rôle | R38 ajoute un fait, R33 choisit à la place du chercheur, ou R01/R04 sélectionne la prochaine action | Sortie rejetée, incident de conformité, décision et ordre de navigation inchangés | C-REPORT, C-DECISION, PD-009 |
| HUM-01 | Choix humain incompatible avec les données | Adoption d’une option classée inadmissible | Choix non effacé ; contradiction et risque critique créés ; G09/G10 bloqués jusqu’à revue | C-DECISION, G09/G10 |
| HUM-02 | Accepter, modifier, rejeter et différer | Quatre branches sur même recommandation | Chaque branche produit une Décision attribuée à un Acteur sous Mandat applicable, une version/trace cohérente et aucune adoption implicite | C-DECISION, C-VERSION |

### 11.1 Critère de non-régression scientifique

Les tests SCI-01 à SCI-06 et FAB-02 à FAB-05 sont des bloqueurs de promotion. Une amélioration de fluidité, de taux de complétion ou de style ne peut jamais justifier leur assouplissement.

---

## 12. DEFERRED_FROM_VERTICAL_SLICE

| Élément reporté | Raison | Dépendance avant entrée | Risque d’introduction prématurée | Condition d’entrée future |
|---|---|---|---|---|
| Authentification | La preuve scientifique peut être démontrée avec un responsable local de fixture | Modèle d’identité et sécurité | Mélanger responsabilité scientifique et compte technique | Besoin de persistance multi-utilisateur approuvé |
| Facturation | Sans rapport avec la validité du raisonnement | Modèle commercial et droits | Orienter le MVP vers l’achat plutôt que la science | Offre pilote et règles de service décidées |
| Collaboration institutionnelle avancée | Invitations, délégations, mandats multiples et conflits de rôle dépassent le cas solo | Matrice multi-acteurs, délégation, révocation et audit institutionnel | Fausse attribution ou validation collective | Vertical robuste et gouvernance institutionnelle |
| Exports réglementaires | Le rapport V1 n’est ni soumission ni document réglementaire | Référentiels, R34, validation juridique/humaine | Donner une apparence de conformité absente | Périmètre réglementaire et templates approuvés |
| PACS | Aucun examen n’est lu ou piloté | Architecture PACS séparée | Rupture de frontière clinique et sécurité | Mission dédiée, clean-room et contrats approuvés |
| DICOM | Aucun objet patient/examen requis | Dictionnaire et gouvernance DICOM | Transformer une stratégie en workflow clinique | Cas d’usage technique explicitement autorisé |
| Données patient | Le cas porte sur une population d’étude conceptuelle | Gouvernance, éthique, protection des données | Exposition de données sensibles et confusion clinique | R34, consentement, sécurité et pilote approuvés |
| Analyse d’images | La tranche ne consomme aucun pixel | Acquisition, lecture, QC, algorithmes validés | Résultat artificiel ou non validé | Vertical séparé avec données et validation |
| Statistiques exécutées | Aucun dataset ni résultat | Plan d’analyse et données réelles | Chiffres inventés ou interprétation hors contexte | R23/R25/R26 et jeux de validation |
| Calcul de puissance automatisé | Variances/effets ne doivent pas être inventés | Critère, hypothèses numériques, R24 | Taille d’échantillon faussement précise | Hypothèses sourcées et contrôle statisticien |
| Écriture complète de financement | Le rapport de cadrage n’est pas un dossier de financement | Gouvernance, coûts, institution, appels réels | Texte persuasif comblant des lacunes | Parcours et contrats dédiés |
| Manuscrit complet | Aucun résultat réel | R26, données, analyse, auteur humain | Fabrication de résultats ou d’interprétations | Étude réalisée et gouvernance d’auteur |
| Multicentrique avancé | La V1 ne décrit qu’une contrainte locale minimale | Sites, équipements, harmonisation, QC | Généralisation intersite non démontrée | Option B, R19/R21 et paquet Core Lab |
| Catalogue complet d’équipements | Les informations critiques peuvent être demandées | Gouvernance de constructeur/version/capacité | Capacité supposée ou inventaire obsolète | Sources documentaires et responsables locaux |
| API publique | Aucun contrat externe stable n’est admis | Versionnement, sécurité, quotas, support | Figer prématurément un modèle incomplet | Vertical stabilisé et consommateurs identifiés |
| VPC ou on-premise | Déploiement sans incidence sur la preuve V1 | Architecture sécurité/exploitation | Complexité et promesse institutionnelle non tenue | Exigence contractuelle d’un pilote |
| Moteur de publication publique | Le rapport reste privé et non indexable | Gouvernance éditoriale, SEO, revue, consentement | Publication de science non revue | Mission séparée et décision explicite |
| Autres Reasoning Books | Fabry est le seul domaine de preuve | Corpus structurés et revus par domaine | Ontologie universelle prématurée | Cas suivant sélectionné et paquet C-KNOW validé |
| Toutes les projections finales | Cinq projections de travail suffisent | Recherche utilisateur et exigences métiers | Interfaces parallèles divergentes | Validation de la stratégie unique sur V1 |
| Protocole d’imagerie exécutable | Le Reasoning Book et la mission l’interdisent | Plan d’étude, critère, acquisition, séquence, paramètres, QC, lecture, analyse et règles d’autorisation | Protocole direct depuis une phrase et risque scientifique | Nouvelle mission normative, nouveaux objets admis et validation applicable ; aucun G11 PASS dans cette V1 |
| Recherche bibliographique libre à l’exécution | La V1 utilise un paquet gelé et revu | R06–R09, accès, citations, revue en temps utile | Source inventée, obsolète ou hors contexte | Pipeline gouverné, évalué et observé |
| Apprentissage automatique des projets | Les retours ne sont pas des vérités générales | Consentement, anonymisation, R41/R42 | Contamination du corpus et dérive silencieuse | Gouvernance scientifique et données autorisées |
| Diagnostic ou recommandation thérapeutique | Hors mission du Protocol Designer | Autorité clinique, validation réglementaire et responsabilité | Préjudice clinique et dépassement de domaine | Ne fait pas partie de cette trajectoire sans décision constitutionnelle explicite |

La liste comporte 23 éléments reportés. Leur absence est une condition de maîtrise du périmètre, pas une dette cachée.

---

## 13. Découpage des futures passes d’implémentation

### 13.1 Règles de découpage

Chaque passe future doit lire le SOURCE-OF-TRUTH-INDEX et PD-007, déclarer ses fichiers autorisés, préserver les surfaces publiques, conserver un logiciel exécutable, ajouter ses tests avant promotion et permettre un retour à la révision précédente sans migration destructive.

Les chemins ci-dessous sont probables, pas des fichiers créés par cette mission.

### 13.2 Séquence commune

| Passe | Objectif | Dépendances | Fichiers probables | Contracts | Validation |
|---|---|---|---|---|---|
| P0 — Baseline et frontière | Fixer feature flag privé, fixture Fabry, périmètre Git, état des tests et interdictions | Index, PD-007, état courant | `src/features/protocol-designer/README.md`, fixtures et tests de frontière | C-IN, périmètre protégé | Baseline reproductible ; aucune route publique/sitemap/Editorial Engine modifié ; échecs externes préexistants qualifiés. |
| P1 — Noyau métier V1 | Représenter les 52 objets, enveloppes, dépendances et validateurs sans UI | PD-003, §4 | `src/features/protocol-designer/domain/`, `contracts/`, tests métier | C-PROJECT, C-DECISION, C-VERSION | MET, TRN, CON, REP ; états invalides rejetés. |
| P2 — Paquet Fabry gouverné | Structurer le sous-ensemble du Reasoning Book, sources et localisateurs sous revue humaine | Reasoning Book, P3M/P4/P5, C-KNOW | `src/features/protocol-designer/knowledge/fabry/`, manifeste, fixtures, revue | C-KNOW, C-EVIDENCE | FAB-05, SCI-01–06, validation scientifique humaine enregistrée, digest stable. |
| P3 — Decision Engine, état et gates | Implémenter la navigation PD-009, les Événements, transitions, C-MISSING/C-STOP et G01–G11 comme évaluations déterministes | P1/P2, PD-009 | `decision-engine/`, `state/`, `gates/`, tests de scénarios | Tous gates, C-MISSING, C-STOP | TRN, MIS, REF, CON ; aucun bypass ; R01/R04 ne sélectionnent aucune action. |
| P4 — Exécution des rôles par contrats | Implémenter interfaces U1–U5 et contrôles de sortie, sans choisir de fournisseur ni posséder la navigation | P1–P3, PD-005 | `orchestration/`, `capabilities/`, adaptateurs et fixtures | Contrats de rôle, C-EXPLANATION | ROLE-01/02, logs déterministes, fallback humain, aucune persistance d’une sortie invalide. |
| P5 — Première démonstration visible | Construire shell, V1-01 à V1-03, mémoire projet et navigation | P1/P3/P4, PD-004 | `ui/`, `screens/Project`, `Intent`, `Framing`, tests d’interaction | C-IN, C-PROJECT, C-MISSING | J01–J08 visibles ; clavier/mobile ; aucune question concurrente. |
| P6 — Science, biomarqueurs et options | Construire V1-04/V1-05, inspecteur de preuve et comparateur | P2/P4/P5 | écrans `ScientificModel`, `Options`, projections | C-EVIDENCE, C-RECOMMENDATION | SCI, FAB-01–04, TRA-01/02 ; pas de score opaque. |
| P7 — Décision, revue et rapport | Construire V1-06 à V1-08, décision humaine, revue et deux types de rapport | P3/P4/P6 | écrans `Decision`, `Review`, `Report`, générateur structuré | C-DECISION, C-REPORT, C-STOP, C-PROJECTION | HUM, G08–G11, rapport sans phrase orpheline. |
| P8 — Version, trace et impact | Construire V1-09, snapshots et propagation du changement | P1/P7 | `versioning/`, `impact/`, écran `Traceability` | C-VERSION, C-EVIDENCE | IMP-01/02, REP-02, PROJ ; v1 immuable. |
| P9 — Admission interne de la tranche | Exécuter les 39 tests, accessibilité, cas humain et non-régression de tranche | P0–P8 | tests d’acceptation et rapport de qualification versionné | Tous | 39/39, suite courante selon protocole borné, typecheck/build, WCAG 2.2 AA ciblé, revue scientifique et produit humaines ; aucun PASS PD-011 revendiqué. |

### 13.3 Option A — MVP minimal démontrable

L’option A exécute P0 à P9 avec : paquet Fabry gelé et revu, règles déterministes, un Acteur sous Mandat borné, saisie locale, cinq projections de travail et aucun appel externe obligatoire. Elle vise une démonstration interne ou un test utilisateur encadré, pas un pilote institutionnel et pas une affirmation de valeur validée.

### 13.4 Option B — Vertical slice robuste pour un premier pilote réel

L’option B reprend P0 à P9 puis ajoute :

| Passe | Objectif | Dépendances | Fichiers probables | Contracts | Validation |
|---|---|---|---|---|---|
| P10 — Protocole PD-011 et qualification | Préenregistrer la revendication, geler version/état de connaissance, constituer jeux séparés, références expertes, comparateurs, métriques, seuils et observabilité | MVP qualifié, PD-011, PD-005 R43 | `evaluation/`, `observability/`, registres de versions et dossier de protocole | Contrats PD-007 et unités d’évaluation PD-011 | Jeux de développement/qualification/aveugle séparés, panel indépendant, contamination contrôlée, critères PASS/FAIL/NON CONCLUANT gelés. |
| P11 — Campagne, décision indépendante et gouvernance du pilote | Exécuter la campagne applicable, produire le dossier de preuve, décider la publication, puis ajouter responsabilités institutionnelles, R34 si participants/données, support et procédure d’incident | P10, décisions sécurité/éthique | campagne versionnée, workflow de revue, runbook et rapport d’admission | C-DECISION, C-REPORT, C-STOP, portes PD-011 | Résultats multidimensionnels, non-régression, décision indépendante ; seul PASS dans le périmètre autorise le pilote publié, borné et révocable. |

### 13.5 Comparaison

| Critère | A — MVP minimal démontrable | B — Vertical robuste pilote réel |
|---|---|---|
| Charge | La plus faible compatible avec les 20 étapes et 39 tests | Plus élevée : évaluation, observabilité et gouvernance humaines supplémentaires |
| Dette | Dette assumée sur orchestration de production, institutionnel et maintien continu du corpus | Dette plus faible sur exploitation ; exclusions PACS/DICOM/analyse restent intactes |
| Risque scientifique | Acceptable uniquement sous paquet gelé, revue humaine et usage encadré | Plus faible grâce aux évaluations, à la revue indépendante et aux procédures d’incident |
| Risque UX | Modéré : un seul cas et peu d’utilisateurs | Plus faible après tests répétés par profils, mais gouvernance plus complexe |
| Temps | Chemin le plus court vers une preuve visible ; aucune estimation calendaire sans équipe/capacité | Plus long ; dépend de validations externes et humaines |
| Valeur démontrable | Preuve d’intégration et de comportement de tranche uniquement ; aucune valeur scientifique officielle | Valeur bornée uniquement si la campagne PD-011 applicable obtient PASS ; aucune généralisation hors périmètre |
| Réutilisabilité | Noyau, gates, contrats et shell réutilisables | Ajoute des actifs de production et de gouvernance réutilisables |

### 13.6 Recommandation

La trajectoire recommandée est **A puis B sans rupture** : implémenter P0–P9 comme jalon démontrable et refuser de qualifier ce jalon de « pilote réel » ou de « scientifiquement validé » tant que P10–P11 ne sont pas admis. Cette trajectoire produit une preuve visible tôt tout en construisant les mêmes objets, contrats et gates que le pilote robuste. Il n’y a ni prototype jetable, ni grand refactoring préalable.

---

## 14. Réponses aux quinze questions de décision

| # | Question | Décision PD-007 |
|---|---|---|
| 1 | Quel est le plus petit produit qui démontre réellement NOXIA ? | Un atelier Fabry versionné allant d’une intention libre à une stratégie/recommandation décidée humainement, revue, traçable et restituée en rapport ou arrêt ; §3. |
| 2 | Quels objets de PD-003 sont indispensables ? | Les 52 objets `OUI` de §4 ; les 16 autres restent `DEFERRED_FROM_V1`. |
| 3 | Quels écrans de la Product Specification sont indispensables ? | Neuf écrans V1 composent S02–S04, S11–S25, S39–S49, S52 et S47 sans reproduire 65 écrans ; §6. |
| 4 | Quels rôles de PD-005 sont indispensables ? | 28 responsabilités, dont R06–R09 en préparation hors ligne, regroupées en U1–U5 ; §7. |
| 5 | Quelles parties du Reasoning Book sont directement exploitables ? | Lecture humaine, glossaire, définitions, formulations, objectifs et décisions comme candidats de structuration ; aucune logique exécutable directe sans C-KNOW et revue. |
| 6 | Quelles parties doivent être structurées ? | Construits, relations, objectifs activés, hypothèses, D0–D16, assertions, preuves, sources/localisateurs, domaines, limites, controverses et règles d’interprétation ; §8. |
| 7 | Quelle information reste sous contrôle humain ? | Statut de la population, objectif, construit, suppositions, contraintes locales, acceptation du risque, décision scientifique, traitement d’une controverse, revue et autorisation de partage. |
| 8 | Quelle décision déclenche un arrêt ? | Tout `BLOCKED` non résolu sur G01–G09, toute défaillance de trace, tout usage hors domaine et tout refus immédiat du Reasoning Book ; G11 formalise `PROTOCOL_NOT_AUTHORIZED`. |
| 9 | Quel rapport minimal a une valeur commerciale ou scientifique ? | Le rapport de cadrage méthodologique versionné de §3, ou son rapport d’arrêt avec condition de reprise. |
| 10 | Le Decision Engine nécessite-t-il un document autonome ? | **ALREADY_COVERED.** PD-009 est l’autorité autonome sur la navigation ; PD-007 la consomme et PD-005 fournit les capacités contributrices. |
| 11 | Une Interaction Grammar nécessite-t-elle un document autonome ? | **ALREADY_COVERED.** PD-004 gouverne l’interaction et PD-009 §0.4 arbitre la grammaire d’états consommée par la navigation ; aucun nouveau document n’est requis pour la tranche. |
| 12 | Une Projection Engine nécessite-t-elle un document autonome ? | **ALREADY_COVERED.** PD-003, PD-004, PD-005:R39 et C-PROJECTION suffisent ; l’engine futur est un détail d’implémentation. |
| 13 | Une ontologie supplémentaire est-elle nécessaire ? | **ALREADY_COVERED.** PD-003 et les contrats du Knowledge Graph couvrent le besoin. Une nouvelle ontologie ferait doublon ; une lacune réelle doit étendre la source compétente. |
| 14 | Quel premier écran montrer ? | V1-01 « Créer le projet », puis V1-02 pour la phrase Fabry ; §6.12. |
| 15 | Quel résultat déclare la tranche réussie ? | Le critère cumulatif interne de §15 : parcours non prédéterminé, navigation PD-009, rapport/arrêt, trace, mandat humain, impact, projections fidèles et 39 tests admis. Ce résultat n’est pas un PASS PD-011. |

### 14.1 Documents supplémentaires

Aucun document normatif supplémentaire n’est requis avant l’implémentation. PD-009 couvre déjà le Decision Engine et PD-011 couvre déjà l’évaluation. Le paquet Fabry structuré sera un artefact scientifique gouverné par C-KNOW et par le Reasoning Book source ; il ne deviendra pas une seconde doctrine. Les questions 10 à 13 sont couvertes sans création d’une autorité concurrente.

---

## 15. Critère de réussite de la tranche verticale

La tranche est réussie uniquement si toutes les conditions suivantes sont réunies :

1. l’entrée libre n’est pas remplacée par un identifiant de scénario ou une réponse prédéterminée ;
2. J01 à J20 sont démontrables avec une seule question principale à la fois ;
3. les 52 objets retenus ont une identité, une provenance, une version et des relations valides ;
4. le Decision Engine PD-009 sélectionne la navigation indépendamment des cinq unités, qui respectent leurs permissions et leurs interdictions ;
5. C-KNOW est structuré, localisé, versionné, revu scientifiquement par un humain et lié à un État de connaissance effectif ;
6. les onze gates restent des évaluations dérivées de Règles méthodologiques et produisent uniquement PASS, REVIEW_REQUIRED, BLOCKED ou NOT_APPLICABLE, sans bypass ni objet `Gate`/`Stop` ;
7. une recommandation est modifiée par au moins une réponse utilisateur, prouvant qu’elle n’est pas statique ;
8. un Acteur sous Mandat applicable accepte, modifie, rejette ou diffère explicitement la proposition ;
9. le système produit un rapport méthodologique dans le cas recevable et un rapport d’arrêt dans un cas bloqué ;
10. chaque affirmation structurante du rapport est traçable à un objet, une preuve et une source ;
11. les cinq projections conservent les mêmes décisions, preuves, limites et gates ;
12. une modification tardive de la population crée un Événement d’évolution, une nouvelle version, invalide les objets dépendants et rejoue la revue ;
13. les dix cas scientifiques négatifs imposés ne produisent jamais l’interprétation interdite ;
14. les 39 tests PD-007 réussissent, ainsi que les validations courantes applicables selon un protocole qui distingue les dépendances externes ;
15. une revue produit, scientifique et accessibilité humaine autorise explicitement le jalon interne correspondant, sans revendiquer une validation PD-011.

Un beau rapport issu d’une fixture fixe, une conversation sans mémoire structurée, ou une suite de tests qui ignore les scénarios d’arrêt ne satisfait pas ce critère.

---

## 16. Décision d’implementation readiness

**Décision : READY_FOR_IMPLEMENTATION — NOT_EVALUATED_UNDER_PD011 — NOT_READY_FOR_REAL_PILOT.**

Les références convergent suffisamment pour commencer une implémentation bornée. Elles ne prouvent aucune livraison actuelle. Le premier pilote réel reste conditionné par :

- l’implémentation P0–P9 ;
- le paquet Fabry C-KNOW revu humainement ;
- la réussite des 39 tests ;
- l’application vérifiée de PD-009, notamment séparation de la navigation, Mandats, Règles, événements et impacts ;
- P10–P11, une campagne PD-011 recevable et la décision indépendante correspondant à la revendication ;
- un protocole d’audit qui qualifie correctement l’état externe de l’Editorial Engine sans le modifier depuis NOXIA.

La tranche verticale ne nécessite aucune modification de l’Editorial Engine, du PACS, des viewers, des routes publiques, du sitemap, de robots, de la publication ou du déploiement.

---

## 17. Résumé normatif

- 29 exigences auditées : 21 convergentes, cinq compatibles après adaptation, une divergence résolue par autorité, une ambiguïté de namespace contrôlée, un écart d’implémentation et aucune contradiction non résolue.
- 52 objets PD-003 retenus ; 16 reportés de la V1.
- 20 étapes de parcours sur neuf écrans V1.
- 28 responsabilités PD-005 retenues dans cinq unités ; 15 reportées.
- 12 contrats et 11 gates définis.
- 39 tests normatifs dans 14 catégories.
- 23 éléments explicitement reportés du vertical slice.
- PD-009 constitue l’autorité autonome du Decision Engine ; aucun document supplémentaire de Decision Engine n’est requis.
- Aucun document autonome de Projection Engine, d’Interaction Grammar ou d’ontologie supplémentaire n’est requis pour la tranche.
- Les 39 tests sont des cas candidats PD-011 ; la valeur scientifique reste non démontrée au titre de PD-011.
- Source maîtresse unique : le présent Markdown ; aucune édition dérivée.
- Aucun code fonctionnel, commit, push, déploiement ou changement de l’Editorial Engine n’appartient à cette mission.
