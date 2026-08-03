# P-WEB-02-QA — Plan indépendant de validation du démonstrateur Protocol Designer Web

**Statut documentaire :** PLAN_DE_VALIDATION — EXECUTE_SOUS_P_WEB_03
**Niveau documentaire :** NIVEAU_3 — plan et résultats de contrôle
**Version :** 1.1
**Date d’exécution :** 3 août 2026
**Source maîtresse :** `docs/p-web-02-protocol-designer-web-demonstrator-validation-plan.md`
**Objet évalué :** implémentation P-WEB-02 au commit de référence `8b28c04d0e583708f21b2edba9755e77c5a85cb0`, puis corrections bornées P-WEB-03 du même espace de travail
**Résultat actuel global :** `NOT_TESTED`
**Autorité scientifique revendiquée :** aucune
**PASS PD-011 revendiqué :** aucun

> Ce document a été préparé indépendamment de l’implémentation puis exécuté sous P-WEB-03. Il ne constitue ni une validation scientifique, ni une architecture UX concurrente, ni une modification de P-WEB-01. Les mentions `PASS` et `PASS_WITH_WARNING` qualifient seulement un contrôle produit de niveau 3 ; elles ne peuvent jamais être interprétées comme un PASS scientifique PD-011.

---

## 1. Nature et limites de la mission

### 1.1 Nature exacte

La mission a commencé comme une **préparation d’évaluation de niveau 3**, conduite indépendamment de P-WEB-02. P-WEB-03 a ensuite appliqué ce plan à une référence Git stabilisée, observé le produit dans un navigateur réel, exécuté les contrôles automatiques et corrigé les défauts autorisés avant une seconde adjudication.

Elle prépare la vérification future d’un démonstrateur :

- fidèle à P-WEB-01 ;
- conforme aux règles UX applicables ;
- présentable à un recruteur et utilisable par un médecin ou un chercheur ;
- responsive et accessible, avec une cible WCAG 2.2 AA à démontrer sans revendication globale prématurée ;
- scientifiquement honnête, déterministe et traçable ;
- dépourvu de protocole clinique, de recommandation et de revendication de validation scientifique ;
- sans exposition de chemins locaux, d’objets internes inutiles ou d’une architecture technique présentée comme proposition de valeur.

### 1.2 Limites absolues

La préparation initiale était en lecture seule. L’exécution P-WEB-03 a modifié uniquement les surfaces Protocol Designer autorisées, leurs fixtures, styles, tests, ce plan et les livrables de niveau 3. Aucun document de niveau 0, 1 ou 2, Scientific Program, Reasoning Book ou dépôt `editorial-engine` n’a été modifié. Aucun PASS PD-011, commit, push ou déploiement n’a été produit.

Le SOURCE-OF-TRUTH-INDEX est mis à jour uniquement pour admettre le rapport final P-WEB-03 comme preuve officielle de niveau 3. Le présent plan exécuté reste hors corpus gouverné ; cette non-admission ne modifie pas rétroactivement ses résultats.

### 1.3 Plans de vérité maintenus séparés

| Plan | Contenu applicable | Conséquence pour la recette |
|---|---|---|
| Principes établis | Science avant technologie, intention avant solution, responsabilité humaine, traçabilité, limites visibles, droit à l’arrêt | Invariants bloquants ; non révisés ici |
| Références normatives | Product Specification, PD-003, PD-004, PD-009, PD-011, PD-012, PD-013 | Contrats spécialisés ; aucune fusion d’autorité |
| Corpus scientifiques | RB-003 v1.0, RB-004 v1.1, RB-005 v1.0 | Sources datées à projeter fidèlement ; aucune nouvelle revue scientifique |
| Cible | Architecture P-WEB-01 v1.1 et mission P-WEB-02 lorsqu’elle est disponible | Exigences attendues, pas preuve d’implémentation |
| État réellement observé | Fichiers du dépôt et produit exécutable au moment de la campagne future | Seul niveau autorisant un résultat de contrôle |
| Hypothèses | Comportements attendus, méthodes de contrôle, seuils opérationnels de recette | À tester ; jamais promus en norme NOXIA |

### 1.4 Vocabulaire de résultat autorisé

| État | Usage strict |
|---|---|
| `NOT_TESTED` | L’implémentation n’est pas déclarée terminée, la preuve manque ou le contrôle ne peut pas encore être exécuté. |
| `PASS` | La preuve observée satisfait le contrat local de recette ; ce mot ne vaut jamais PASS PD-011. |
| `PASS_WITH_WARNING` | Le contrat essentiel est satisfait, avec un écart non bloquant, borné, attribué et documenté. |
| `FAIL` | Une preuve observée contredit l’exigence. |
| `BLOCKED_EXTERNAL` | Une dépendance extérieure au périmètre empêche le contrôle malgré des préconditions internes remplies. |
| `NOT_APPLICABLE` | L’exigence est explicitement hors périmètre, avec justification et autorité source. |

Aucun autre état ne doit apparaître dans les colonnes de résultat. Une intention, un prompt, une maquette ou un commentaire de code ne suffit jamais à produire `PASS`.

---

## 2. Documents consultés

Lecture intégrale effectuée dans l’ordre imposé :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` ;
2. Charte fondatrice, DOCX maître ;
3. Scientific Product Manifesto, DOCX maître ;
4. Product Specification, DOCX maître ;
5. `docs/pd-003-research-object-model.md` ;
6. `docs/pd-004-ux-manifesto.md` ;
7. Manuel UX officiel, DOCX maître ;
8. `docs/pd-009-decision-engine-architecture.md` ;
9. `docs/pd-011-evaluation-framework.md` ;
10. `docs/pd-012-scientific-program-architecture.md` ;
11. `docs/pd-013-scientific-program-registry.md`, contrat v1.0, état courant 1.7 ;
12. RB-003 — Spectral Imaging, DOCX maître v1.0 ;
13. RB-004 — Cardiac MRI & Quantitative Cardiac Imaging, DOCX maître v1.1 ;
14. RB-005 — Neuro Perfusion & Metabolism Foundations, DOCX maître v1.0 ;
15. `docs/p17-scientific-programs-reasoning-books-consolidation-report.md` ;
16. `docs/p-web-01-protocol-designer-web-demonstrator-architecture.md`, version 1.1 ;
17. recherche du prompt ou fichier de mission P-WEB-02 dans le dépôt : aucun fichier distinct trouvé au point d’arrêt ;
18. prompt P-WEB-02-QA remis par le mandant ;
19. état de travail courant du dépôt, consulté en lecture seule pour déterminer la testabilité.

Les documents autonomes PD-014, PD-015 et PD-016 n’ont pas été recherchés.

---

## 3. Hiérarchie d’autorité appliquée

| Domaine | Autorité maîtresse | Autorités d’application | Règle de résolution |
|---|---|---|---|
| Principes | Charte fondatrice, Scientific Product Manifesto | Product Specification | Un contrat inférieur ne peut réduire honnêteté, responsabilité ou traçabilité. |
| Modèle conceptuel | PD-003 | P-WEB-01 §17 | Une projection de démonstration ne crée pas d’objet métier concurrent. |
| UX | PD-004 | Manuel UX officiel, puis P-WEB-01 | PD-004 prévaut dans le domaine UX ; le Manuel en est l’édition officielle ; P-WEB-01 instancie les règles. |
| Navigation scientifique | PD-009 | P-WEB-01 §§7–8 et 20 | L’interface projette les états et arrêts ; elle ne décide pas scientifiquement. |
| Évaluation scientifique | PD-011 | Mentions de non-évaluation de P-WEB-01 | Aucun résultat de cette recette n’autorise un PASS scientifique ou une publication. |
| Programs et actifs | PD-012 puis PD-013 état courant | SOURCE-OF-TRUTH-INDEX | L’admission documentaire établit identité et ownership, jamais activation produit. |
| Contenu scientifique | DOCX maître du Reasoning Book concerné | PDF dérivé, Evidence Map, références | La fixture reste bornée au corpus et à sa version ; aucun contenu n’est complété par inférence. |
| Architecture du démonstrateur | P-WEB-01 | Mission P-WEB-02, si elle est admise | L’implémentation doit être vérifiée contre P-WEB-01 ; le prompt seul ne modifie pas l’architecture officielle. |

### 3.1 Contradictions et écarts conservés

| ID | Documents exacts | Qualification | Traitement dans ce plan |
|---|---|---|---|
| C-QA-01 | P-WEB-01 v1.0 limitait le démonstrateur à RB-003/RB-004 ; le mandat QA exigeait trois scénarios dont RB-005 | Écart temporel résolu par l’« Instruction corrective — P-WEB-01 v1.1 — Extension du démonstrateur à RB-005 » et par P-WEB-01 v1.1 | Le plan a contrôlé exactement RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0. Les résultats sont consignés par ligne ; aucun résultat produit ne vaut PASS PD-011. |
| C-QA-02 | PD-004 §« quatre profondeurs » et P-WEB-01 E08/§13 : Niveau 1 « Compréhension » ; prompt QA : Niveau 1 « Raisonnement » | Divergence de libellé résoluble par l’autorité UX spécialisée | Le libellé contrôlé est « Niveau 1 — Compréhension ». « Raisonnement » peut décrire le contenu mais ne devient pas un niveau officiel. |
| C-QA-03 | P-WEB-01 parle de sept phases canoniques, mais son parcours détaillé ajoute Découverte et Décision humaine ; le prompt QA énumère sept étapes sans Découverte ni Décision humaine | Différence entre parcours global, carte interactive et vue transversale ; décompte ambigu dans P-WEB-01 | La carte contrôlée comporte les sept étapes explicitement imposées par le prompt. Découverte reste hors carte sur la page publique ; Décision humaine reste une vue/obligation transversale et ne peut disparaître. Toute huitième étape visible doit être documentée avant adjudication. |
| C-QA-04 | P17 décrit RB-005 comme candidat non créé ; PD-013 état 1.7 et l’index 1.19 l’admettent ensuite comme officiel | État historique exact, pas contradiction active | P17 reste une preuve datée. L’état courant vient de PD-013 1.7 et de l’index 1.19 ; aucune réécriture de P17. |
| C-QA-05 | Product Specification : six familles d’entrée ; PD-004 : cinq entrées visibles ; P-WEB-01 E01 | Contradiction déjà arbitrée dans le domaine UX par P-WEB-01 | Cinq cartes visibles et une voie « Autre objectif » ; les six familles restent accessibles sans affichage simultané. |

---

## 4. Référence évaluée et exécution P-WEB-03

### 4.1 Constat borné

Au point d’entrée P-WEB-03 du 3 août 2026 :

- le dépôt NOXIA était propre sur `main`, HEAD `8b28c04d0e583708f21b2edba9755e77c5a85cb0` ;
- P-WEB-01 v1.1, le plan présent et le rapport d’implémentation P-WEB-02 étaient conciliés sur trois scénarios ;
- le dépôt externe `editorial-engine` était déjà non propre et a été conservé strictement en lecture seule ;
- l’audit initial a relevé des défauts bloquants d’intention-first, d’identité scientifique, de décision humaine, de non-évaluabilité, d’invalidation amont et d’impression ;
- les corrections P-WEB-03 ont été appliquées avant la seconde campagne ;
- les contrôles non exécutés manuellement restent `NOT_TESTED`, les surfaces absentes par conception sont `NOT_APPLICABLE`, et les trois gardes dépendant de l’état externe sont `BLOCKED_EXTERNAL` sans être converties en succès local.

### 4.2 Préconditions vérifiées

La version évaluée est identifiée ; l’application est lançable ; les fixtures sont locales et figées ; les routes et trois scénarios sont présents ; les dépendances et tests sont exécutables ; aucun travail concurrent n’a modifié le périmètre ; aucun verrou Git n’était présent. Les préconditions absolues étaient donc satisfaites avant correction.

### 4.3 Procédure exécutée

1. Référence Git, gouvernance et absence de concurrence vérifiées.
2. Typecheck, tests ciblés, suite globale, lint, build, audit SEO et diff contrôlés.
3. Page publique et démonstrateur parcourus dans le navigateur aux largeurs 320, 390, 768, 1024, 1440 et 1920 px.
4. Parcours nominal, blocage critique, absence de décision, contradiction, hors-périmètre et modification amont contrôlés.
5. Défauts classés avant correction puis rejoués après correction avec garde-fous automatisés.
6. Zoom 400 %, lecteur d’écran, thème clair et rendu PDF d’impression restent explicitement `NOT_TESTED` ou `NOT_APPLICABLE` selon la ligne concernée.

---

## 5. Matrice de conformité P-WEB-01

### 5.1 Les 17 vues

| ID | Exigence P-WEB-01 | Criticité | Surface concernée | Méthode de validation | Preuve attendue | État |
|---|---|---|---|---|---|---|
| VIEW-01 | Page publique : valeur, limites, publics, aperçu, scénarios et CTA unique | MAJEURE | `/protocol-designer` | Inspection visuelle, contenu, clavier, sans JavaScript | Captures 6 largeurs, transcript clavier, copie rendue | `PASS_WITH_WARNING` |
| VIEW-02 | Intention : cinq familles visibles, « Autre objectif », formulation libre, aucune entrée technique | BLOQUANTE | Démo — Intention | Parcours neuf et inspection des libellés | Vidéo/captures et inventaire des choix | `PASS` |
| VIEW-03 | Compréhension et contexte : reformulation prudente, provenance déclarée, manque critique | BLOQUANTE | Démo — Compréhension | Scénario complet et incomplet | Captures, état projet avant/après | `PASS` |
| VIEW-04 | Informations : états épistémiques, blocage, question unique et réponse honnête | BLOQUANTE | Démo — Informations | Déclencher connu, supposé, manquant, contradictoire | Captures et trace des conséquences | `PASS_WITH_WARNING` |
| VIEW-05 | Hypothèses : principale, concurrente, réfutabilité, conséquence et limite | BLOQUANTE | Démo — Hypothèses | Contrôler trois scénarios/variantes admis | Captures et provenance des hypothèses | `PASS_WITH_WARNING` |
| VIEW-06 | Stratégie candidate : proposition non décisionnelle, options, ordre justifié, limites | BLOQUANTE | Démo — Stratégie | Inspection et recherche des claims interdits | Captures, copie, liens vers preuves | `PASS` |
| VIEW-07 | Comparaison : contexte commun, critères, bénéfices, limites, renoncements, désaccord conservé | MAJEURE | Démo — Comparaison | Matrice desktop et vue linéaire mobile | Captures appariées et séquence clavier | `PASS_WITH_WARNING` |
| VIEW-08 | Preuves et provenance : chaîne proposition–justification–preuve, stance, version, localisateur | BLOQUANTE | Inspecteur de preuve | Ouvrir depuis chaque type d’objet, vérifier retour | Captures, focus avant/après, localisateurs | `PASS_WITH_WARNING` |
| VIEW-09 | Limites, controverses et risques : limite critique non masquable, registre transversal | BLOQUANTE | Revue/inspecteur | Déclencher une limite critique et une controverse | Capture niveau 0 et détail | `PASS` |
| VIEW-10 | Contradiction : deux positions, contextes, préservé, actions, humain requis | BLOQUANTE | État scientifique | Scénario contradictoire | Captures, lecture écran, action de reprise | `PASS` |
| VIEW-11 | Données insuffisantes/non évaluables : aucune conclusion, préservé et rapport provisoire | BLOQUANTE | État scientifique | Scénario non évaluable | Captures et absence de conclusion négative | `PASS` |
| VIEW-12 | Revue critique : satisfait/à revoir/bloqué/non évalué, sans validation | BLOQUANTE | Revue critique | Parcours avec réserve et arrêt | Capture, copie et prochaine action | `PASS` |
| VIEW-13 | Décision humaine : retenir/adapter/différer/refuser, auteur, portée, justification, impacts | BLOQUANTE | Décision | Enregistrer chaque branche admissible | Trace avant/après et rapport lié | `PASS` |
| VIEW-14 | Rapport consolidé reconstructible, sans correction autonome ni export officiel trompeur | BLOQUANTE | Rapport | Remonter chaque section à sa source | Rapport imprimé, liens et provenance | `PASS` |
| VIEW-15 | Fondations scientifiques secondaires, lecture seule et retour au point d’origine | MAJEURE | Fondations | Ouvrir depuis une décision, vérifier hiérarchie | Capture, focus retour, absence d’administration | `PASS_WITH_WARNING` |
| VIEW-16 | Reprise/récupération : dernier état cohérent, version, décision ouverte, cause distincte | MAJEURE | Transversal | Interrompre puis reprendre | Vidéo, état préservé et message | `PASS_WITH_WARNING` |
| VIEW-17 | Chargement, vide et succès partiel : messages honnêtes, action et préservé | MAJEURE | Transversal | Déclencher chaque variante prévue | Captures, annonces et actions | `PASS_WITH_WARNING` |

### 5.2 Les 21 composants

| ID | Exigence P-WEB-01 | Criticité | Surface concernée | Méthode de validation | Preuve attendue | État |
|---|---|---|---|---|---|---|
| CMP-01 | `IntentEntry` recueille l’intention avant toute technique | BLOQUANTE | Intention | Inspection fonctionnelle et sémantique | DOM accessible, capture, parcours | `PASS` |
| CMP-02 | `ProjectContextSummary` reste accessible, stable et sans score | BLOQUANTE | Coquille | Parcours/scroll/6 largeurs | Captures persistantes | `PASS_WITH_WARNING` |
| CMP-03 | `ReasoningProgressMap` représente sept étapes et leurs états, sans pourcentage | BLOQUANTE | Navigation | Ouvrir, revenir, réouvrir | Vidéo et libellés d’état | `PASS` |
| CMP-04 | `KnowledgeStatePanel` conserve état, provenance et contradictions | BLOQUANTE | Informations | Variantes épistémiques | Captures et relations | `PASS` |
| CMP-05 | `MissingInformationPanel` pose une question utile, accepte « Je ne sais pas » | BLOQUANTE | Informations | Réponse, différé, non obtenable | Trace des trois branches | `PASS` |
| CMP-06 | `HypothesisCard` rend l’hypothèse réfutable et contextualisée | BLOQUANTE | Hypothèses | Inspection des attributs et alternatives | Capture et provenance | `PASS` |
| CMP-07 | `StrategyOptionCard` montre effet, renoncement, limite et justification | BLOQUANTE | Stratégie | Comparaison de trois options max mises en avant | Captures et libellés | `PASS` |
| CMP-08 | `ComparisonView` conserve les relations sur desktop, mobile et zoom | MAJEURE | Comparaison | Matrice/vue linéaire, clavier, 400 % | Captures appariées | `PASS_WITH_WARNING` |
| CMP-09 | `EvidenceDrawer` ouvre la preuve sans perte de contexte et restaure le focus | BLOQUANTE | Preuves | Clavier/lecteur d’écran/ouverture-fermeture | Focus log et capture | `PASS_WITH_WARNING` |
| CMP-10 | `LimitationCard` garde toute limite critique ouverte au niveau 0 | BLOQUANTE | Limites | Scénario critique | Capture avant toute interaction | `PASS` |
| CMP-11 | `ContradictionPanel` conserve deux positions sans vote automatique | BLOQUANTE | Contradiction | Scénario contradictoire | Texte, sources, actions | `PASS` |
| CMP-12 | `HumanDecisionPanel` attribue la décision à un humain | BLOQUANTE | Décision | Branches retenir/adapter/différer/refuser | Trace datée et rapport | `PASS` |
| CMP-13 | `ImpactSummary` montre ajouté/retiré/modifié/inchangé avant confirmation | BLOQUANTE | Retour amont | Modifier une entrée structurante | Différentiel avant/après | `PASS` |
| CMP-14 | `ScientificReport` projette sans créer ni corriger le fond | BLOQUANTE | Rapport | Audit de traçabilité par échantillon exhaustif des sections | Liens source et version | `PASS` |
| CMP-15 | `ProvenanceInspector` montre identité, version, date, contexte, localisateur | BLOQUANTE | Traçabilité | Ouvrir tous types de provenance | Captures et correspondance corpus | `PASS_WITH_WARNING` |
| CMP-16 | `ScientificFoundationBrowser` reste secondaire et en lecture seule | MAJEURE | Fondations | Navigation depuis objet puis retour | Vidéo et absence d’actions d’administration | `PASS` |
| CMP-17 | `RecoveryPanel` distingue panne technique et insuffisance scientifique | MAJEURE | Récupération | Simuler échec récupérable | Message, préservé, reprise | `PASS_WITH_WARNING` |
| CMP-18 | `EmptyState` explique absence, raison et prochaine action sans conclure | MAJEURE | États transversaux | Ouvrir vide initial/filtré/non applicable | Captures | `PASS` |
| CMP-19 | `LoadingState` nomme l’opération, reste maîtrisable, sans théâtre IA | MAJEURE | États transversaux | Observer chargement initial/progressif | Capture/vidéo et annonce | `NOT_APPLICABLE` |
| CMP-20 | `PartialSuccessState` sépare disponible, indisponible et à revoir | MAJEURE | États transversaux | Déclencher succès partiel | Capture et impacts | `NOT_APPLICABLE` |
| CMP-21 | `NonEvaluableState` explique l’arrêt et les actions sans score zéro | BLOQUANTE | États transversaux | Scénario non évaluable | Capture, annonce, rapport provisoire | `PASS` |

### 5.3 Les 12 familles d’états

| ID | Exigence P-WEB-01 | Criticité | Surface concernée | Méthode de validation | Preuve attendue | État |
|---|---|---|---|---|---|---|
| STATE-01 | Saisie invalide distincte d’une insuffisance scientifique | MAJEURE | Formulaires | Produire format invalide puis ambiguïté scientifique | Deux messages distincts | `PASS_WITH_WARNING` |
| STATE-02 | Information manquante avec impact, « Je ne sais pas » et reprise | BLOQUANTE | Informations | Retirer une donnée structurante | Capture et action | `PASS` |
| STATE-03 | Contradiction avec deux positions conservées | BLOQUANTE | Revue | Charger variante contradictoire | Provenances et branche affectée | `PASS` |
| STATE-04 | Insuffisance scientifique bornant la conclusion | BLOQUANTE | Stratégie/revue | Charger preuve insuffisante | Copie et rapport provisoire | `PASS` |
| STATE-05 | Conflit de version avec comparaison et aucune perte locale | MAJEURE | Session/provenance | Introduire versions divergentes | Écran de comparaison | `PASS` |
| STATE-06 | Conflit de droits sans Mandat inventé | MAJEURE | Décision | Activer variante non habilitée | Message, brouillon préservé | `NOT_APPLICABLE` |
| STATE-07 | Défaillance technique distincte d’un résultat scientifique | BLOQUANTE | Chargement/reprise | Indisponibilité contrôlée | Cause technique et préservé | `PASS` |
| STATE-08 | Chargement nommé, annoncé et non bloquant sans raison | MAJEURE | Toutes projections | Observer ouverture lente | Vidéo et annonce `status` | `NOT_APPLICABLE` |
| STATE-09 | Succès partiel avec objets chargés et décisions à revoir | MAJEURE | Preuves/rapport | Rendre une preuve indisponible | Liste chargé/manquant/impact | `NOT_APPLICABLE` |
| STATE-10 | Échec récupérable avec dernier état cohérent | MAJEURE | Session | Interrompre une action | Reprise démontrée | `PASS` |
| STATE-11 | Non évaluable sans conclusion négative | BLOQUANTE | Revue/rapport | Retirer conditions de conclusion | Capture et absence de faux négatif | `PASS` |
| STATE-12 | Arrêt pour revue humaine, rôle et cause nommés | BLOQUANTE | Revue/décision | Déclencher condition d’arrêt | Capture et action d’escalade | `PASS` |

### 5.4 Parcours, interactions et navigation

| ID | Exigence P-WEB-01 | Criticité | Surface concernée | Méthode de validation | Preuve attendue | État |
|---|---|---|---|---|---|---|
| NAV-01 | La page publique conduit explicitement à l’espace interactif | MAJEURE | Site/Header/public | Navigation souris, clavier, URL directe | Trace des trois accès | `PASS` |
| NAV-02 | L’intention est la première action scientifique | BLOQUANTE | Démo | Nouvelle session | Première vue et premier focus | `PASS` |
| NAV-03 | La carte présente les sept étapes canoniques, non un tunnel | BLOQUANTE | Navigation | Parcours initial puis réouverture | Vidéo complète | `PASS` |
| NAV-04 | Les dépendances peuvent borner un saut sans masquer sa cause | MAJEURE | Progression | Tenter une étape non disponible | Message et action utile | `PASS` |
| NAV-05 | Retour, fil d’Ariane et fermeture ne suppriment aucune saisie | BLOQUANTE | Transversal | Saisie puis retours multiples | État avant/après | `PASS` |
| NAV-06 | Un changement amont expose le différentiel aval avant confirmation | BLOQUANTE | Itération | Modifier contexte/hypothèse | Impact ajouté/retiré/modifié/inchangé | `PASS` |
| NAV-07 | Le résumé stable reste accessible depuis toute vue de travail | BLOQUANTE | Coquille | Parcourir toutes les vues/largeurs | Série de captures | `PASS_WITH_WARNING` |
| NAV-08 | Les preuves et fondations s’ouvrent sans perdre le point d’origine | MAJEURE | Inspecteurs | Ouverture/fermeture clavier et tactile | Focus et position restaurés | `PASS_WITH_WARNING` |
| NAV-09 | Rapport, fondations et reprise restent des accès secondaires | MAJEURE | Coquille | Inspection hiérarchie et ordre de focus | Captures et DOM | `PASS` |
| NAV-10 | L’arrêt honnête permet compléter, suspendre ou rapporter sans conclure | BLOQUANTE | États critiques | Scénario bloqué | Trois actions ou justification bornée | `PASS` |
| NAV-11 | Sans JavaScript, la page publique reste utile et aucun résultat n’est simulé | BLOQUANTE | Page publique | Désactiver JavaScript | Capture et contenu rendu | `PASS` |
| NAV-12 | La reprise montre dernier point, changements, décisions ouvertes et prochaine action | MAJEURE | Session | Quitter/revenir et changer version de fixture | Vidéo et état préservé | `PASS_WITH_WARNING` |

### 5.5 Critères d’acceptation AC-01 à AC-38

| ID | Exigence P-WEB-01 | Criticité | Surface concernée | Méthode de validation | Preuve attendue | État |
|---|---|---|---|---|---|---|
| AC-01 | Première action = intention, sans technique ni fondation comme entrée | BLOQUANTE | Intention | Session neuve | Capture/vidéo | `PASS` |
| AC-02 | Cinq entrées visibles maximum + « Autre objectif » | MAJEURE | Intention | Comptage et trouvabilité | Capture | `PASS` |
| AC-03 | Sept phases visibles, nommées, réouvrables | BLOQUANTE | Navigation | Parcours complet | Vidéo | `PASS` |
| AC-04 | Une question et une action principale par zone | MAJEURE | Toutes vues | Inspection exhaustive | Inventaire annoté | `PASS` |
| AC-05 | Résumé stable accessible à toutes largeurs | BLOQUANTE | Coquille | 6 largeurs + zoom | Captures | `PASS_WITH_WARNING` |
| AC-06 | Aucun faux pourcentage d’avancement ou confiance | BLOQUANTE | Toute interface | Recherche visuelle/textuelle | Inventaire nul | `PASS` |
| AC-07 | Information bloquante visible au niveau 0 avec traitement direct | BLOQUANTE | États critiques | Scénario bloqué | Capture initiale | `PASS` |
| AC-08 | Retour amont conserve données et montre différentiel aval | BLOQUANTE | Itération | Modifier entrée | Trace avant/après | `PASS` |
| AC-09 | Stratégie : contexte, justification, alternative, limites | BLOQUANTE | Stratégie | Audit des scénarios | Captures | `PASS` |
| AC-10 | Comparaison sans score global, égalité/désaccord conservé | BLOQUANTE | Comparaison | Variantes d’égalité/désaccord | Captures | `PASS` |
| AC-11 | Décision structurante humaine, attribuée et datée | BLOQUANTE | Décision | Enregistrement | Trace | `PASS` |
| AC-12 | Rapport relié aux décisions/provenances, sans correction autonome | BLOQUANTE | Rapport | Audit de liens | Rapport annoté | `PASS` |
| AC-13 | Exactement trois scénarios P-WEB-01 actifs : RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 | BLOQUANTE | Registre de scénarios | Inventaire visible/interne | Preuve versions | `PASS` |
| AC-14 | RB-005 affiche `NXP-000003` v1.1, sa provenance et ses limites sans extrapolation | BLOQUANTE | Registre et scénario RB-005 | Inspection de la fixture et des surfaces | Captures et localisateurs | `PASS` |
| AC-15 | Tout contenu scientifique porte corpus, version, date, localisateur | BLOQUANTE | Scénarios/preuves | Audit exhaustif de fixture | Registre de provenance | `PASS` |
| AC-16 | Aucune stance de citation inférée | BLOQUANTE | Preuves | Comparer fixture et corpus | Tableau de concordance | `PASS` |
| AC-17 | Fixture jamais présentée comme connaissance ou calcul dynamique | BLOQUANTE | Copie/états | Recherche de claims | Captures/inventaire | `PASS` |
| AC-18 | Programs et Reasoning Books restent secondaires | MAJEURE | Navigation/fondations | Parcours initial et menus | Capture hiérarchie | `PASS` |
| AC-19 | Aucune mutation d’assertion, source, relation, Program ou corpus | BLOQUANTE | Frontières | Inspection comportement/réseau/tests existants | Logs et diff borné | `PASS` |
| AC-20 | Aucun protocole, paramètre constructeur, recommandation ou PASS PD-011 | BLOQUANTE | Toute sortie | Recherche textuelle et parcours | Inventaire nul | `PASS` |
| AC-21 | Douze familles d’états avec exemple testable | MAJEURE | États | Exécuter STATE-01–12 | Dossier de preuves | `PASS_WITH_WARNING` |
| AC-22 | Contradiction distincte de la saisie et deux positions conservées | BLOQUANTE | États | Comparer STATE-01/03 | Captures | `PASS` |
| AC-23 | Non-évaluabilité : cause, préservé, actions, humain | BLOQUANTE | États | STATE-11 | Capture et annonce | `PASS` |
| AC-24 | Trois scénarios officiels P-WEB-01 réalisables à 320 px | BLOQUANTE | Mobile | Parcours complets | Vidéos 320 px | `PASS_WITH_WARNING` |
| AC-25 | Zoom 400 % sans perte ; matrices avec vue linéaire | BLOQUANTE | Responsive | Zoom navigateur | Captures | `NOT_TESTED` |
| AC-26 | Toutes actions utilisables au clavier, focus visible/restauré | BLOQUANTE | Accessibilité | Parcours clavier | Journal de focus | `NOT_TESTED` |
| AC-27 | Statuts/alertes/sélections sans couleur seule | BLOQUANTE | Accessibilité | Niveaux de gris + lecteur d’écran | Captures/transcript | `PASS` |
| AC-28 | Changements dynamiques essentiels annoncés | BLOQUANTE | Accessibilité | Lecteur d’écran | Transcript | `NOT_TESTED` |
| AC-29 | Cibles principales au moins 44 × 44 CSS px | MAJEURE | Tactile | Mesure sur 6 largeurs | Relevé | `PASS` |
| AC-30 | Recette automatique et manuelle combinée | MAJEURE | Dossier QA | Examiner preuves de campagne | Logs + fiches manuelles | `NOT_TESTED` |
| AC-31 | Statuts SEO distincts pour public et interactif | BLOQUANTE | SEO | Inspecter HTML/réponses/sitemap | Captures/exports | `PASS` |
| AC-32 | Interactif hors sitemap et sans publication scientifique | BLOQUANTE | SEO | Sitemap, robots, contenu | Preuves SEO | `PASS` |
| AC-33 | Sans JavaScript, page publique utile sans faux résultat | BLOQUANTE | Dégradation | Désactiver JS | Capture | `PASS` |
| AC-34 | Donnée scientifique indisponible désactive le scénario sans fallback inventé | BLOQUANTE | Scénarios | Rendre paquet indisponible | Capture/log | `NOT_APPLICABLE` |
| AC-35 | Non-régression des routes, pages, SEO et tests existants | BLOQUANTE | Site | Suite existante + parcours de référence | Logs et captures | `BLOCKED_EXTERNAL` |
| AC-36 | Bandeau cohérent et au plus sept entrées principales | MAJEURE | Header | Comptage 6 largeurs/clavier | Captures | `PASS` |
| AC-37 | Démonstrateur identifiable comme intermédiaire et non évalué | BLOQUANTE | Public/démo/rapport | Inspection des trois surfaces | Captures | `PASS` |
| AC-38 | Valeur, limite principale et responsabilité humaine compréhensibles sans code | MAJEURE | Présentation | Test recruteur §27 | Notes et reformulation | `NOT_TESTED` |

---
## 6. Matrice de conformité PD-004

PD-004 est l’autorité UX maîtresse. Le Manuel UX officiel porte les mêmes 70 identifiants et intitulés ; P-WEB-01 en définit la projection attendue. La criticité `CONTEXTUELLE` signifie que l’applicabilité doit être confirmée sur la tranche fonctionnelle réellement livrée, non que la règle peut être ignorée.

### 6.1 Budgets officiels de choix

| Règle UX | Source exacte | Exigence observable | Méthode de contrôle | Largeur ou contexte | Niveau de criticité | Preuve attendue | État actuel |
|---|---|---|---|---|---|---|---|
| BUD-01 — Points d’entrée initiaux | PD-004 §Budget officiel ; Manuel UX même section ; P-WEB-01 §§2, 5 | 5 visibles maximum ; surplus via « Autre objectif » | Comptage et test de trouvabilité | Intention, toutes largeurs | MAJEURE | Capture et parcours | `PASS` |
| BUD-02 — Options exclusives | Mêmes sources | 5 visibles maximum, sans suppression de connaissance | Charger le cas le plus riche | Décisions | MAJEURE | Capture et accès au surplus | `PASS` |
| BUD-03 — Propositions mises en avant | Mêmes sources | 3 maximum ; autres alternatives conditionnelles | Comptage par scénario | Stratégie | MAJEURE | Captures | `PASS` |
| BUD-04 — Réponses rapides | Mêmes sources | 4 + « Autre / Je ne sais pas » | Inspecter chaque question | Informations | MAJEURE | Inventaire | `PASS` |
| BUD-05 — Action principale | Mêmes sources | 1 action dominante par zone | Inspection visuelle/DOM | Toutes vues | MAJEURE | Captures annotées | `PASS` |
| BUD-06 — Navigation principale | Mêmes sources | 7 sections maximum | Comptage desktop/mobile | Header/navigation | MAJEURE | Captures | `PASS` |
| BUD-07 — Alertes urgentes | Mêmes sources | 3 simultanées maximum ; file complète accessible | Déclencher plusieurs alertes | Revue/états | MAJEURE | Capture et registre | `PASS` |

### 6.2 Règles UX-01 à UX-70

| Règle UX | Source exacte | Exigence observable | Méthode de contrôle | Largeur ou contexte | Niveau de criticité | Preuve attendue | État actuel |
|---|---|---|---|---|---|---|---|
| UX-01 — Commencer par l’intention, jamais par la technique | PD-004 UX-01 ; Manuel UX UX-01 ; P-WEB-01 D01, AC-01 | Première action = intention ; aucune modalité/Program/RB en entrée | Session neuve, ordre visuel et focus | Toutes largeurs | BLOQUANTE | Vidéo et capture initiale | `PASS_WITH_WARNING` |
| UX-02 — Comprendre avant de proposer | UX-02 ; P-WEB-01 §§7, 11.7 | Aucune stratégie avant reformulation et contexte suffisants | Tenter d’accéder trop tôt | Parcours initial | BLOQUANTE | État bloqué expliqué | `PASS_WITH_WARNING` |
| UX-03 — Construire une stratégie unique | UX-03 ; P-WEB-01 D05/D16, AC-08 | Toutes projections partagent la même version | Modifier une entrée et comparer les vues | Tous niveaux | BLOQUANTE | Identifiants/version concordants | `PASS_WITH_WARNING` |
| UX-04 — Maintenir l’utilisateur comme décisionnaire | UX-04 ; P-WEB-01 D08, VIEW-13 | Auteur, date, portée ; aucune validation automatique | Enregistrer une décision | Décision/rapport | BLOQUANTE | Trace attribuée | `PASS_WITH_WARNING` |
| UX-05 — Rendre chaque proposition reconstructible | UX-05 ; P-WEB-01 AC-09/12 | Quoi, pourquoi, contexte, alternative, limites accessibles | Audit de chaque option | Stratégie/rapport | BLOQUANTE | Fiche de concordance | `PASS_WITH_WARNING` |
| UX-06 — Ne jamais mettre l’IA au centre | UX-06 ; P-WEB-01 D11, §16 | Valeur portée par raisonnement, preuves et limites ; aucun théâtre IA | Inspection capture principale et copie | Public/démo | BLOQUANTE | Captures et inventaire nul | `PASS_WITH_WARNING` |
| UX-07 — Une seule question principale à la fois | UX-07 ; P-WEB-01 AC-04 | Titre interrogatif unique dans la zone active | Inspection exhaustive | Toutes vues | MAJEURE | Captures annotées | `PASS_WITH_WARNING` |
| UX-08 — Une action principale par zone | UX-08 ; P-WEB-01 AC-04 | Un CTA dominant, secondaires hiérarchisés et explicites | Inspection visuelle | Toutes vues | MAJEURE | Captures | `PASS_WITH_WARNING` |
| UX-09 — Limiter les options visibles, jamais la connaissance | UX-09 ; P-WEB-01 §§2, 11.7 | ≤5 exclusives, ≤3 mises en avant, surplus accessible et compté | Cas maximal | Intention/stratégie | MAJEURE | Capture et parcours surplus | `PASS_WITH_WARNING` |
| UX-10 — Donner à chaque choix une conséquence lisible | UX-10 ; P-WEB-01 §11.7/8 | Libellé autonome, effet, bénéfice et renoncement | Audit de cartes | Décision/comparaison | MAJEURE | Captures | `PASS_WITH_WARNING` |
| UX-11 — Ordonner sans fabriquer de certitude | UX-11 ; P-WEB-01 AC-10 | Raison et contexte du classement ; préférences humaines visibles | Modifier un critère | Comparaison | BLOQUANTE | Avant/après et désaccord conservé | `PASS_WITH_WARNING` |
| UX-12 — Préserver un résumé stable | UX-12 ; P-WEB-01 AC-05 | Question, population, objectif, stade, blocages toujours accessibles | Parcourir vues et largeurs | 320–1920 px | BLOQUANTE | Série de captures | `PASS_WITH_WARNING` |
| UX-13 — Séparer décision, justification et détail | UX-13 ; P-WEB-01 §§10.6–10.8 | Ordre : choix, effet, incertitude, raison, preuve | Inspection et lecture clavier | Cartes/inspecteurs | MAJEURE | Capture + ordre DOM | `PASS_WITH_WARNING` |
| UX-14 — Ne jamais coder un sens par la couleur seule | UX-14 ; P-WEB-01 AC-27 | Texte/structure/icône accompagnent toute couleur | Niveaux de gris et lecteur d’écran | Clair/sombre | BLOQUANTE | Captures/transcript | `PASS_WITH_WARNING` |
| UX-15 — Révéler selon l’utilité | UX-15 ; P-WEB-01 §13 | Chaque bloc visible sert la tâche actuelle | Revue écran par écran | Tous niveaux | MAJEURE | Inventaire justifié | `PASS_WITH_WARNING` |
| UX-16 — Respecter les quatre profondeurs | UX-16 ; P-WEB-01 §13 | Identités et sens stables entre 0–3 | Comparer les quatre profondeurs | Toutes projections | BLOQUANTE | Tableau d’identité | `PASS_WITH_WARNING` |
| UX-17 — Ne jamais replier une information bloquante | UX-17 ; P-WEB-01 AC-07 | Contradiction/limite critique/manque/arrêt visibles niveau 0 | Charger états critiques sans interaction | Toutes largeurs | BLOQUANTE | Capture initiale | `PASS_WITH_WARNING` |
| UX-18 — Approfondir et revenir | UX-18 ; P-WEB-01 §§11.9, 13 | Niveau suivant en un geste ; contexte, focus et position restaurés | Clavier/tactile ouverture-fermeture | Preuves/détails | MAJEURE | Journal de focus | `PASS_WITH_WARNING` |
| UX-19 — Parcours canonique comme carte, pas prison | UX-19 ; P-WEB-01 AC-03 | Sept étapes visibles ; réouverture sans copie | Parcours initial puis retour | Navigation | BLOQUANTE | Vidéo | `PASS_WITH_WARNING` |
| UX-20 — Afficher l’état, pas un faux pourcentage | UX-20 ; P-WEB-01 §8.3 | États textuels officiels et cause de « à revoir » | Modifier une entrée | Navigation | BLOQUANTE | Captures avant/après | `PASS_WITH_WARNING` |
| UX-21 — Le retour ne doit jamais effacer | UX-21 ; P-WEB-01 AC-08 | Saisie conservée ou non-enregistrement annoncé | Retours/fermetures/rechargement | Parcours/session | BLOQUANTE | État avant/après | `PASS_WITH_WARNING` |
| UX-22 — Propager avec un différentiel | UX-22 ; P-WEB-01 §11.13, AC-08 | Ajouté/retiré/modifié/inchangé avec cause ; aucune réécriture humaine | Changement amont | Impact | BLOQUANTE | Différentiel | `PASS_WITH_WARNING` |
| UX-23 — Transcript non principal | UX-23 ; P-WEB-01 D02 | Décisions, hypothèses, preuves et limites retrouvables en vues structurées | Reprise par évaluateur neuf | Démo/rapport | MAJEURE | Test de compréhension | `NOT_APPLICABLE` |
| UX-24 — Rendre la reprise explicite | UX-24 ; P-WEB-01 §10.16 | Dernier point, changements, décisions et prochaine action | Quitter/revenir | Session | MAJEURE | Vidéo | `PASS_WITH_WARNING` |
| UX-25 — Réserver les modales | UX-25 ; P-WEB-01 D04 | Modales seulement pour interruption nécessaire ; focus complet | Inventaire des modales et clavier | Toutes vues | BLOQUANTE | Inventaire + transcript | `PASS_WITH_WARNING` |
| UX-26 — Qualifier toute information structurante | UX-26 ; P-WEB-01 §11.4 | Connu, supposé, manquant ou contradictoire ; origine des suppositions | Audit états/rapport | Informations | BLOQUANTE | Correspondance vue–rapport | `PASS_WITH_WARNING` |
| UX-27 — Cinq statuts de conclusion | UX-27 ; P-WEB-01 §2 | Établie, probable, contextuelle, controversée, insuffisamment documentée ; définitions stables | Recherche des statuts/synonymes | Toute conclusion | BLOQUANTE | Inventaire textuel | `PASS_WITH_WARNING` |
| UX-28 — Aucun pourcentage de confiance non calibré | UX-28 ; P-WEB-01 AC-06 | Aucun score numérique non défini/validé | Recherche visuelle et textuelle | Toute interface | BLOQUANTE | Inventaire nul | `PASS_WITH_WARNING` |
| UX-29 — Incertitude actionnable | UX-29 ; P-WEB-01 §§11.4/10 | Cause, impact, réduction possible, responsable | Audit de chaque incertitude | Informations/revue | BLOQUANTE | Fiches de contrôle | `PASS_WITH_WARNING` |
| UX-30 — Toujours offrir « Je ne sais pas » | UX-30 ; P-WEB-01 §11.5 | Réponse honnête non punitive, conséquence et reprise | Questions éligibles | Mobile/desktop | MAJEURE | Captures et trace | `PASS_WITH_WARNING` |
| UX-31 — Savoir s’arrêter | UX-31 ; P-WEB-01 §7.3, AC-23 | Arrêt si domaine/preuve/contexte insuffisant ; rapport borné | Scénario non évaluable | Revue/rapport | BLOQUANTE | Arrêt démontré | `PASS_WITH_WARNING` |
| UX-32 — Attacher la preuve à la proposition | UX-32 ; P-WEB-01 §10.8 | Preuve ouverte depuis l’objet, pas via catalogue isolé | Ouvrir chaque type d’objet | Stratégie/revue | BLOQUANTE | Chemins de navigation | `PASS_WITH_WARNING` |
| UX-33 — Chaîne d’argumentation avant citation | UX-33 ; P-WEB-01 §11.9 | Proposition → justification → preuve visible | Audit EvidenceDrawer | Niveau 1→3 | BLOQUANTE | Capture chaîne | `PASS_WITH_WARNING` |
| UX-34 — Volume ≠ force de preuve | UX-34 ; P-WEB-01 AC-16 | Nature, contexte et limites avant nombre de références | Comparer objets avec volumes différents | Preuves | BLOQUANTE | Capture et copie | `PASS_WITH_WARNING` |
| UX-35 — Visualiser les désaccords sans faux vainqueur | UX-35 ; P-WEB-01 §11.11 | Soutient/réfute/qualifie/mentionne et deux positions conservées | Scénario contradictoire | Preuves/revue | BLOQUANTE | Captures | `PASS_WITH_WARNING` |
| UX-36 — Conserver provenance, version et fraîcheur | UX-36 ; P-WEB-01 §11.15 | Source, version, date, localisateur, contexte visibles | Audit exhaustif de fixtures | Niveau 3 | BLOQUANTE | Registre de provenance | `PASS_WITH_WARNING` |
| UX-37 — Limite au plus près de l’objet | UX-37 ; P-WEB-01 §11.10 | Limite visible avec l’élément borné | Inspection cartes/rapport | Toutes vues | BLOQUANTE | Captures | `PASS_WITH_WARNING` |
| UX-38 — Registre transversal des limites | UX-38 ; P-WEB-01 §10.9 | Vue consolidée sans retirer les limites locales | Comparer local/transversal | Revue/rapport | MAJEURE | Correspondance exhaustive | `PASS_WITH_WARNING` |
| UX-39 — Conséquence, mitigation et résidu | UX-39 ; P-WEB-01 §11.10 | Trois dimensions visibles ; responsable nommé | Audit de limites | Revue | BLOQUANTE | Fiches | `PASS_WITH_WARNING` |
| UX-40 — Impossible de masquer une limite critique | UX-40 ; P-WEB-01 AC-07 | Aucune action de fermeture définitive ; niveau 0 persistant | Tenter de masquer/accepter | Toutes largeurs | BLOQUANTE | Vidéo | `PASS_WITH_WARNING` |
| UX-41 — Nommer la nature du problème | UX-41 ; P-WEB-01 §12 | Saisie, manque, contradiction, science et technique distingués | Déclencher familles d’état | États | BLOQUANTE | Tableau de messages | `PASS_WITH_WARNING` |
| UX-42 — Anatomie de message constante | UX-42 ; P-WEB-01 §12 | Fait, importance, préservé, action, humain | Audit STATE-01–12 | États | MAJEURE | Grille complétée | `PASS_WITH_WARNING` |
| UX-43 — Préserver et récupérer | UX-43 ; P-WEB-01 §11.17 | Dernier état cohérent et options de reprise | Échec contrôlé | Session | BLOQUANTE | Trace avant/après | `PASS_WITH_WARNING` |
| UX-44 — Corriger pédagogiquement | UX-44 ; P-WEB-01 §16 | Cause et exemple précis, ton non punitif | Saisies invalides | Formulaires | MAJEURE | Captures | `PASS_WITH_WARNING` |
| UX-45 — Encadrer les actions destructives | UX-45 ; P-WEB-01 §§11.12/25 | Objet et conséquence explicites, sortie sûre, confirmation distincte | Inventaire/essai des actions | Décision/session | BLOQUANTE | Vidéo clavier | `PASS_WITH_WARNING` |
| UX-46 — Capacités essentielles sur tous écrans | UX-46 ; P-WEB-01 AC-24 | Aucune décision, limite, preuve ou reprise absente dès 320 px | Parcours 320/390/768 | Responsive | BLOQUANTE | Vidéos | `PASS_WITH_WARNING` |
| UX-47 — Éviter le défilement horizontal | UX-47 ; P-WEB-01 §14 | Reflow courant ; matrices avec vue linéaire et repère | 320 px et zoom 400 % | Responsive | BLOQUANTE | Captures | `PASS_WITH_WARNING` |
| UX-48 — Viser WCAG 2.2 AA | UX-48 ; P-WEB-01 §15 | Clavier, focus, sémantique, alternatives, contrastes, annonces | Protocole §17, sans claim global | Tous contextes | BLOQUANTE | Dossier a11y | `NOT_TESTED` |
| UX-49 — Dimensionner pour la précision | UX-49 ; P-WEB-01 AC-29 | Cibles principales ≥44×44 CSS px ; alternative au geste | Mesure et parcours tactile | 320/390/768 | MAJEURE | Relevé | `PASS_WITH_WARNING` |
| UX-50 — Attente compréhensible et maîtrisable | UX-50 ; P-WEB-01 §§10.17/11.19 | Retour immédiat, objet nommé, annulation/sortie si durable | Actions et chargements | Réseau lent/local | MAJEURE | Vidéo et annonces | `PASS_WITH_WARNING` |
| UX-51 — Adapter la projection, jamais la vérité | UX-51 ; P-WEB-01 D05 | Densité change, identités/limites/statuts non | Comparer profondeurs/projections | Tous niveaux | BLOQUANTE | Diff d’identité | `PASS_WITH_WARNING` |
| UX-52 — Débutant apprend en agissant | UX-52 ; P-WEB-01 §2 | Pourquoi, définitions utiles, exemples, « Je ne sais pas », sans simplification fausse | Test utilisateur débutant si projection présente | Projection débutant | MAJEURE | Reformulation et notes | `PASS_WITH_WARNING` |
| UX-53 — Expert révise vite | UX-53 ; P-WEB-01 §2 | Densité, comparaison et accès direct, sans dépendance exclusive aux raccourcis | Test expert si projection présente | Projection expert | CONTEXTUELLE | Chronologie et observations | `PASS_WITH_WARNING` |
| UX-54 — Changer de niveau à tout moment | UX-54 ; P-WEB-01 §13 | Changement réversible sans perte ni décision scientifique | Basculer à chaque étape | Projections | MAJEURE | État avant/après | `PASS_WITH_WARNING` |
| UX-55 — Core Lab autour de la stratégie commune | UX-55 ; P-WEB-01 §§2, 5 | Projection secondaire part de question/critères, pas des centres | Ouvrir projection si présente | Core Lab secondaire | CONTEXTUELLE | Capture et liens aux objectifs | `NOT_APPLICABLE` |
| UX-56 — Qualité avant acquisition | UX-56 ; P-WEB-01 D10/§2 | Critères/contrôles/rejets/reprises visibles avant exécution conceptuelle | Examiner projection si présente | Core Lab secondaire | CONTEXTUELLE | Fiche de qualité | `NOT_APPLICABLE` |
| UX-57 — Matrice multicentrique explicite | UX-57 ; P-WEB-01 §§2, 11.8 | Cible, tolérance, local, compatibilité, conséquence, mitigation, responsable | Inspecter exemple Core Lab | Comparaison | CONTEXTUELLE | Matrice + vue linéaire | `NOT_APPLICABLE` |
| UX-58 — Déviations de premier rang | UX-58 ; P-WEB-01 §2 | Origine, observé, cause, impact, décision, auteur, date, statut | Déclencher exemple si prévu | Core Lab secondaire | CONTEXTUELLE | Trace de déviation | `NOT_APPLICABLE` |
| UX-59 — Prioriser par action | UX-59 ; P-WEB-01 §2 | Bloquant/action/surveiller/informatif ; ≤3 urgences | Cas riche si projection présente | Core Lab secondaire | CONTEXTUELLE | Capture et file | `NOT_APPLICABLE` |
| UX-60 — Proposition, revue, approbation humaines distinctes | UX-60 ; P-WEB-01 AC-11 | Statuts, portée, auteur, date, version, réserves séparés | Audit décision/rapport | Toute décision | BLOQUANTE | Trace des responsabilités | `PASS_WITH_WARNING` |
| UX-61 — Paquet de reproductibilité versionné | UX-61 ; P-WEB-01 §§3.2, 10.14 | Aucun export officiel trompeur ; si projection, éléments non résolus visibles | Vérifier périmètre et toute fonction d’impression | Rapport/Core Lab | CONTEXTUELLE | Décision d’applicabilité et sortie | `NOT_APPLICABLE` |
| UX-62 — Écrire comme un méthodologiste | UX-62 ; P-WEB-01 §16 | Ton précis, calme, respectueux ; jargon défini | Revue microcopie exhaustive | Toutes surfaces | BLOQUANTE | Inventaire de formulations | `PASS_WITH_WARNING` |
| UX-63 — Libellés d’action autonomes | UX-63 ; P-WEB-01 §16 | Boutons nomment leur résultat ; pas « OK/Suite » isolé | Inventaire et lecteur d’écran | Toutes vues | MAJEURE | Liste des noms accessibles | `PASS_WITH_WARNING` |
| UX-64 — Bon composant pour la relation | UX-64 ; P-WEB-01 §§10–11 | Étapes/séquence, tableaux/comparaison, accordéons/profondeur, cartes/objets | Revue sémantique | Toutes vues | MAJEURE | Justification par composant | `PASS_WITH_WARNING` |
| UX-65 — Tester compréhension, pas seulement complétion | UX-65 ; P-WEB-01 AC-38 | Reformuler question, raison, incertitude, limite et prochaine action | Entretiens structurés | Médecin/chercheur/recruteur | BLOQUANTE | Verbatims codés | `NOT_TESTED` |
| UX-66 — Tester chaque projection avec son public | UX-66 ; P-WEB-01 §5 | Standard + profils pertinents ; aucun profil ne valide seul un autre | Planifier sessions par rôle | Évaluation utilisateur | MAJEURE | Profils, tâches, incompréhensions | `NOT_TESTED` |
| UX-67 — États non heureux avant recette | UX-67 ; P-WEB-01 §12, AC-21 | Les 12 familles ont un cas exécutable, pas seulement scénario heureux | Exécuter STATE-01–12 | Toutes fonctions | BLOQUANTE | Dossier complet | `PASS_WITH_WARNING` |
| UX-68 — Documenter toute exception | UX-68 ; P-WEB-01 §21 | Règle, besoin, alternatives, risque, propriétaire, périmètre, revue, expiration | Examiner registre des écarts | Toute dérogation | BLOQUANTE | Fiche d’exception | `PASS_WITH_WARNING` |
| UX-69 — Source de vérité UX unique | UX-69 ; P-WEB-01 §2 | Composants/recette reliés à PD-004 ; aucune règle divergente | Traçabilité exigences–preuves | Dossier QA | MAJEURE | Matrice de couverture | `PASS_WITH_WARNING` |
| UX-70 — Invariants prioritaires | UX-70 ; P-WEB-01 §0.5 | Arbitrage : sécurité/honnêteté, compréhension, trace/réversibilité, accessibilité, efficacité, visuel, nouveauté | Rejouer chaque écart contesté | Décision finale | BLOQUANTE | Justification d’arbitrage | `PASS_WITH_WARNING` |

---

## 7. Validation de la page publique

| ID | Contrôle | Méthode | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| PUB-01 | Header donne accès à « Protocol Designer » sans dépasser 7 entrées | Desktop/mobile, souris/clavier, lien direct | Captures et ordre de focus | BLOQUANTE | `PASS_WITH_WARNING` |
| PUB-02 | Proposition de valeur comprise sans exposer l’architecture interne | Lecture 60 s puis reformulation | Verbatim utilisateur | MAJEURE | `NOT_TESTED` |
| PUB-03 | Page nomme ce que la démo montre et ne valide pas | Revue de contenu | Capture des deux blocs | BLOQUANTE | `PASS` |
| PUB-04 | Aperçu exact des sept étapes | Comparer libellés à §10 | Capture et correspondance | MAJEURE | `PASS` |
| PUB-05 | Scénarios affichés avec domaine, source/version et statut exact | Comparer à registre autorisé | Capture + table de concordance | BLOQUANTE | `PASS` |
| PUB-06 | CTA principal unique conduit à la démo | Parcours souris/clavier/tactile | Vidéo courte | MAJEURE | `PASS_WITH_WARNING` |
| PUB-07 | Limites, décision humaine et non-évaluation PD-011 visibles avant entrée | Inspection niveau 0 | Capture sans interaction | BLOQUANTE | `PASS` |
| PUB-08 | Sans JavaScript, titre, valeur, limites, parcours et contact restent utiles ; aucun résultat | Désactiver JavaScript/recharger | Capture et HTML rendu | BLOQUANTE | `PASS_WITH_WARNING` |
| PUB-09 | Cohérence visuelle avec le site et aucun jargon interne inexpliqué | Revue comparative accueil/pages | Captures côte à côte | MAJEURE | `PASS_WITH_WARNING` |
| PUB-10 | Thèmes, reflow et footer restent fonctionnels | 6 largeurs, clair/sombre, 400 % | Planche de captures | MAJEURE | `PASS_WITH_WARNING` |

---

## 8. Validation du démonstrateur

| ID | Contrôle | Méthode | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| DEMO-01 | L’espace interactif est explicitement un démonstrateur local/intermédiaire | Inspection public, entrée, rapport | Captures concordantes | BLOQUANTE | `PASS` |
| DEMO-02 | Une session neuve commence par l’intention | Ouvrir URL directe et via CTA | Vidéo | BLOQUANTE | `PASS` |
| DEMO-03 | La fixture est déterministe : mêmes entrées → mêmes sorties, hors données d’affichage non scientifiques | Répéter chaque parcours dans deux sessions propres | Captures/empreintes fonctionnelles comparées | BLOQUANTE | `PASS` |
| DEMO-04 | Aucun appel réseau ou LLM n’est requis pour produire la science de la fixture | Mode hors ligne et journal réseau | Log sans dépendance interdite | BLOQUANTE | `PASS` |
| DEMO-05 | Les fondations restent secondaires | Observer premier écran, navigation et ordre de focus | Captures et arbre de navigation | MAJEURE | `PASS` |
| DEMO-06 | La coexistence question, preuve, limite, impact et décision reste lisible | Parcours de cas riche | Captures desktop/mobile | MAJEURE | `PASS_WITH_WARNING` |
| DEMO-07 | Aucun chemin local, nom de fichier interne inutile, trace technique ou détail secret n’est exposé | Parcours, erreurs, rapport, copie | Inventaire nul | BLOQUANTE | `PASS` |
| DEMO-08 | La reprise n’invente ni persistance ni Mandat institutionnel | Quitter/revenir, examiner libellés | État et microcopie | BLOQUANTE | `PASS` |
| DEMO-09 | Une panne technique ne devient pas insuffisance scientifique, et inversement | Déclencher les deux cas | Messages comparés | BLOQUANTE | `PASS_WITH_WARNING` |
| DEMO-10 | Le rapport reste une projection de démonstration, non un protocole | Parcours complet + impression | Rapport et pied de page | BLOQUANTE | `PASS` |

---

## 9. Validation des trois scénarios

La campagne ne réalise pas une nouvelle revue scientifique des Reasoning Books. Elle vérifie la fidélité de leur projection. Pour chaque assertion affichée, la preuve attendue est un pointeur vers le corpus maître, sa version et un localisateur vérifiable.

### 9.1 Spectral Imaging — RB-003 v1.0

| ID | Contrôle de projection | Méthode | Preuve attendue | État |
|---|---|---|---|---|
| SC-RB003-01 | Source RB-003 v1.0, Program Owner `NXP-000001`, date et fixture visibles | Inspection public/démo/fondations/rapport | Captures concordantes | `PASS` |
| SC-RB003-02 | Intention part d’un phénomène ou besoin, jamais d’une architecture d’acquisition | Session neuve | Capture première question | `PASS` |
| SC-RB003-03 | Mesure, dérivation, reconstruction et hypothèse ne sont pas confondues | Comparer libellés à RB-003 | Table de concordance | `PASS_WITH_WARNING` |
| SC-RB003-04 | Limites de calibration, bruit, résolution, dose et transférabilité restent visibles | Ouvrir stratégie/revue | Captures et localisateurs | `PASS_WITH_WARNING` |
| SC-RB003-05 | Une information structurante manquante produit un besoin et une conséquence | Variante manquante | Capture et action | `PASS` |
| SC-RB003-06 | Hypothèses principales/concurrentes sont réfutables et bornées | Variante hypothèses | Captures et provenance | `PASS` |
| SC-RB003-07 | Plusieurs options sont comparées sans « meilleure » universelle | Comparaison | Matrice/vue linéaire | `PASS` |
| SC-RB003-08 | K-edge, multi-contraste et imagerie moléculaire future restent expérimentaux/contextuels | Recherche des formulations | Inventaire et localisateurs | `PASS_WITH_WARNING` |
| SC-RB003-09 | Iode statique n’est pas présenté comme perfusion ; élément K-edge n’est pas molécule/cible | Cas dédiés ou inspection de copie | Captures/inventaire nul de confusions | `PASS_WITH_WARNING` |
| SC-RB003-10 | Décision explicitement humaine avec réserves | Enregistrer décision | Trace datée | `PASS` |
| SC-RB003-11 | Rapport reconstruit le raisonnement et les conditions de refus | Audit de rapport | Liens source | `PASS` |
| SC-RB003-12 | Aucun protocole clinique, réglage constructeur, recommandation ou contenu inventé | Recherche exhaustive de copie | Inventaire nul | `PASS` |
| SC-RB003-13 | Statuts « scénario préparé/fixture déterministe/non évalué PD-011 » visibles | Inspection trois surfaces | Captures | `PASS` |

### 9.2 Cardiac MRI — RB-004 v1.1

| ID | Contrôle de projection | Méthode | Preuve attendue | État |
|---|---|---|---|---|
| SC-RB004-01 | Source RB-004 v1.1, Owner `NXP-000002` v1.2, date et fixture visibles | Inspection public/démo/fondations/rapport | Captures concordantes | `PASS` |
| SC-RB004-02 | Intention part d’une propriété/mesure, pas d’une séquence | Session neuve | Capture première question | `PASS` |
| SC-RB004-03 | Chaîne propriété→signal→reconstruction→observable→estimateur→QC→incertitude→usage conservée | Audit de projection | Concordance et localisateurs | `PASS_WITH_WARNING` |
| SC-RB004-04 | Mouvement, rythme, reconstruction, méthode et version restent des dépendances | Parcours/revue | Captures | `PASS_WITH_WARNING` |
| SC-RB004-05 | Non-évaluabilité technique distincte d’une mesure négative | Variante non évaluable | Messages comparés | `PASS` |
| SC-RB004-06 | Hypothèses sont réfutables et ne transforment pas image en biomarqueur validé | Audit hypothèses | Captures/localisateurs | `PASS` |
| SC-RB004-07 | Options montrent métrologie, QC, accord et renoncement sans seuil universel | Comparaison | Matrice/vue linéaire | `PASS` |
| SC-RB004-08 | LGE, ECV, strain, mapping et dérivés ne reçoivent pas de signification pathologique automatique | Recherche ciblée de formulations | Inventaire nul de claims interdits | `PASS_WITH_WARNING` |
| SC-RB004-09 | Répétabilité, reproductibilité, exactitude et accord restent distincts | Inspection des états et rapport | Captures | `PASS_WITH_WARNING` |
| SC-RB004-10 | Décision humaine avec portée et réserves | Enregistrement | Trace datée | `PASS` |
| SC-RB004-11 | Rapport conserve versions, limites, refus et non-évaluables | Audit du rapport | Liens source | `PASS` |
| SC-RB004-12 | Aucun protocole patient, paramètre exécutable, diagnostic ou recommandation | Recherche exhaustive | Inventaire nul | `PASS` |
| SC-RB004-13 | Statuts « scénario préparé/fixture déterministe/non évalué PD-011 » visibles | Inspection trois surfaces | Captures | `PASS` |

### 9.3 Neuro Perfusion & Metabolism — RB-005 v1.0

Ce contrôle applique la décision corrective enregistrée dans P-WEB-01 v1.1 : RB-005 est le troisième scénario officiel. Sa présence, son identité et ses frontières ont été contrôlées ; les points de projection scientifique non exhaustifs restent `PASS_WITH_WARNING` et ne valent aucune nouvelle revue du corpus.

| ID | Contrôle de projection | Méthode | Preuve attendue | État |
|---|---|---|---|---|
| SC-RB005-01 | Source RB-005 v1.0, Owner `NXP-000003` v1.1, date et fixture visibles | Inspection public/démo/fondations/rapport | Captures concordantes | `PASS` |
| SC-RB005-02 | Intention part d’un construit hémodynamique/métabolique, pas d’une modalité | Session neuve | Capture première question | `PASS` |
| SC-RB005-03 | CBF, CBV, MTT, TTP, Tmax, delay et ATT ne sont pas confondus | Audit de projection | Concordance avec RB-005 | `PASS_WITH_WARNING` |
| SC-RB005-04 | Perfusion, oxygénation, métabolisme et BBB restent séparés | Parcours/revue | Captures/localisateurs | `PASS_WITH_WARNING` |
| SC-RB005-05 | AIF, modèle, calibration, transit, physiologie systémique et version peuvent devenir informations manquantes | Variantes manquantes | Captures et conséquences | `PASS` |
| SC-RB005-06 | Hypothèses sont réfutables et bornées à la modalité/chaîne | Audit hypothèses | Captures/localisateurs | `PASS` |
| SC-RB005-07 | CTP, DSC, DCE, ASL et PET sont comparés sans gold standard universel ni score global | Comparaison | Matrice/vue linéaire | `PASS` |
| SC-RB005-08 | Core/pénombre restent des estimations contractuelles et dynamiques ; aucun tissu « irréversible » sur seuil seul | Recherche ciblée | Inventaire nul de claims interdits | `PASS_WITH_WARNING` |
| SC-RB005-09 | Une carte négative n’efface ni limite de détection ni non-évaluabilité | Variante dédiée | Captures | `PASS_WITH_WARNING` |
| SC-RB005-10 | Décision humaine avec portée et réserves | Enregistrement | Trace datée | `PASS` |
| SC-RB005-11 | Rapport conserve modèle, unités, qualité, incertitude, refus et provenance | Audit du rapport | Liens source | `PASS` |
| SC-RB005-12 | Aucun protocole, dose/injection, recommandation, seuil universel ou contenu inventé | Recherche exhaustive | Inventaire nul | `PASS` |
| SC-RB005-13 | Statuts « scénario préparé/fixture déterministe/non évalué PD-011 » visibles | Inspection trois surfaces | Captures | `PASS` |

---

## 10. Validation du parcours en sept étapes

La carte officielle contrôlée comporte : **Intention, Compréhension, Hypothèses, Informations manquantes, Stratégie, Revue critique, Rapport**. La Découverte appartient à la page publique. La Décision humaine est une obligation transversale explicite entre revue, choix et rapport ; elle ne peut être omise au motif qu’elle n’est pas comptée comme huitième étape.

| Étape | Entrée minimale | Contrôle principal | Retour/impact attendu | Preuve | État |
|---|---|---|---|---|---|
| 1. Intention | Formulation utilisateur | Première action sans modalité/Program ; 5 + autre | Modifiable sans perte | Vidéo | `PASS` |
| 2. Compréhension | Intention, contexte minimal | Reformulation prudente, déclaré distinct de connu | Retour à intention et impact annoncé | Avant/après | `PASS` |
| 3. Hypothèses | Question/contextes | Principale/concurrente, réfutabilité, conséquences | Révision sans suppression des alternatives | Captures | `PASS` |
| 4. Informations manquantes | Besoins liés aux décisions | États explicites, question utile, « Je ne sais pas » | Réponse produit différentiel | Captures/trace | `PASS` |
| 5. Stratégie | Contexte suffisant, hypothèses, corpus | Options justifiées, limites, aucun optimum automatique | Comparaison et retour amont | Matrice/vidéo | `PASS` |
| 6. Revue critique | Stratégie, preuves, limites | Satisfait/à revoir/bloqué/non évalué ; décision humaine | Arrêt, adaptation ou décision sous réserve | Capture/trace | `PASS` |
| 7. Rapport | Version et décisions de session | Reconstructible, provenance, limites, non-évaluables | Retour à la décision source | Rapport annoté | `PASS` |

Contrôles transversaux : progression toujours visible ; résumé stable ; retour non destructif ; aucun tunnel irréversible ; différentiel avant tout changement structurant ; décision, justification et détail séparés ; aucune étape déclarée complète par pourcentage.

---

## 11. Validation de la progressive disclosure

Le libellé officiel du niveau 1 est **Compréhension**. La divergence « Raisonnement » du prompt est enregistrée en C-QA-02 et ne modifie pas PD-004.

| Niveau | Contenu attendu | Ouverture | Contrôles | Preuve | État |
|---|---|---|---|---|---|
| 0 — Orientation | Question, état, blocage, décision/action immédiate | Toujours ouvert | Identités stables ; aucun blocage critique masqué | Captures initiales de toutes vues | `PASS` |
| 1 — Compréhension | Justification courte, hypothèse, conséquence, compromis, alternative | Ouvert standard/débutant | Sens identique au niveau 0 ; passage en un geste | Captures et test de compréhension | `PASS` |
| 2 — Exécution | Paramètres conceptuels, contrôles, dépendances, conditions | Selon tâche/projection | Aucun paramètre constructeur exécutable ; retour sans perte | Capture et focus | `PASS` |
| 3 — Traçabilité | Sources, localisateurs, provenance, versions, historique | Fermé mais accessible en un geste | Preuve/limite accessible ; retour au point et focus restaurés | Transcript clavier/lecteur d’écran | `PASS` |

Pour chaque objet testé aux quatre niveaux, remplir une fiche d’identité : ID objet, texte pivot, statut scientifique, limite critique, version, provenance et décision liée. Toute divergence de sens est `FAIL` ; une différence de densité ou d’ordre d’ouverture est permise si elle est conforme à PD-004.

---

## 12. Validation des états scientifiques

`Déclaré` qualifie la provenance d’une information ; il ne devient pas un état épistémique concurrent de PD-003. `Manquant` est la projection UX d’un inconnu requis. `Non évaluable` est une conclusion sur les conditions d’analyse, non un résultat négatif.

| État contrôlé | Libellé/sens attendu | Conséquence/action attendue | Provenance attendue | Criticité | État actuel |
|---|---|---|---|---|---|
| Connu | Information étayée dans le contexte | Utilisable sous limites ; modifier/ouvrir source | Source et version | MAJEURE | `PASS_WITH_WARNING` |
| Déclaré | Fourni par l’utilisateur ou la fixture, sans promotion épistémique | Corriger/confirmer ; effet visible | Auteur/fixture | MAJEURE | `PASS` |
| Supposé | Hypothèse d’information explicite et modifiable | Confirmer, tester ou accepter sous réserve | Origine de la supposition | BLOQUANTE | `PASS_WITH_WARNING` |
| Manquant | Inconnu requis pour une décision | « Je ne sais pas », compléter, différer, assigner | Besoin et décision affectée | BLOQUANTE | `PASS` |
| Contradictoire | Deux informations incompatibles dans le même contexte | Qualifier, conserver, escalader | Deux provenances | BLOQUANTE | `PASS` |
| Non applicable | Élément hors contexte avec justification | Continuer sans le convertir en absent | Règle d’applicabilité | MAJEURE | `NOT_APPLICABLE` |
| Non évaluable | Conditions insuffisantes pour conclure | Compléter, suspendre, revue, rapport provisoire | Causes et données disponibles | BLOQUANTE | `PASS` |
| Information bloquante | Manque/contradiction conditionnant la validité | Visible niveau 0, action directe | Décision/branche affectée | BLOQUANTE | `PASS` |
| Revue humaine requise | Progression honnête impossible sans rôle nommé | Demander revue ou suspendre | Rôle, cause, portée | BLOQUANTE | `PASS` |

Chaque fiche d’état vérifie en plus : information non portée par couleur seule ; formulation non punitive ; distinction avec erreur de saisie et panne technique ; texte « ce qui s’est produit / importance / préservé / action / humain » ; comportement clavier, mobile, lecteur d’écran et rapport.

---

## 13. Validation de la décision humaine

| ID | Contrôle | Méthode | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| HUM-01 | La proposition NOXIA est distincte du choix humain | Inspection option/décision/rapport | Libellés comparés | BLOQUANTE | `PASS` |
| HUM-02 | Retenir, adapter, différer et refuser sont disponibles ou toute restriction est justifiée | Parcourir les branches | Captures/traces | MAJEURE | `PASS` |
| HUM-03 | Auteur local, date, portée, justification et réserves sont conservés | Enregistrer | Objet affiché/rapport | BLOQUANTE | `PASS` |
| HUM-04 | Aucun Mandat institutionnel ni approbateur fictif n’est inventé | Revue de contenu | Inventaire nul | BLOQUANTE | `PASS` |
| HUM-05 | Les impacts sont visibles avant confirmation | Modifier le choix/contexte | Différentiel | BLOQUANTE | `PASS` |
| HUM-06 | Remplacer une décision conserve l’ancienne, l’alternative et la cause | Faire une révision | Historique avant/après | BLOQUANTE | `PASS` |
| HUM-07 | Une décision sous réserve ne transforme pas une limite critique en détail masqué | Accepter sous réserve | Limite niveau 0 persistante | BLOQUANTE | `PASS` |
| HUM-08 | La décision est accessible et imprimée sans statut « validé » | Clavier/lecteur d’écran/impression | Transcript et PDF/impression | BLOQUANTE | `PASS_WITH_WARNING` |

---

## 14. Validation de la provenance

| ID | Contrôle | Méthode | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| PROV-01 | Chaque assertion projetée possède corpus, version, date, localisateur | Audit exhaustif des fixtures | Registre de concordance | BLOQUANTE | `PASS` |
| PROV-02 | Program Owner exact et statut documentaire non confondu avec activation | Comparer à PD-013 1.7 | Captures et table | BLOQUANTE | `PASS` |
| PROV-03 | `SOUTIENT`, `RÉFUTE`, `QUALIFIE`, `MENTIONNE` seulement si relation explicitement préparée | Comparer fixture/corpus | Concordance de chaque stance | BLOQUANTE | `PASS` |
| PROV-04 | Une source citée n’est pas automatiquement une preuve de l’assertion affichée | Échantillonner toutes les stances | Justification/localisateur | BLOQUANTE | `PASS` |
| PROV-05 | Version historique, obsolète, partielle ou indisponible reste qualifiée | Variantes de provenance | Captures | MAJEURE | `NOT_APPLICABLE` |
| PROV-06 | L’ouverture et le retour préservent contexte, focus et position | Clavier/tactile/lecteur d’écran | Journal de focus | MAJEURE | `PASS_WITH_WARNING` |
| PROV-07 | Fondations et provenance sont en lecture seule | Inspection des actions | Inventaire nul de mutation | BLOQUANTE | `PASS` |
| PROV-08 | Aucun chemin local n’apparaît dans l’interface, les erreurs ou l’impression | Recherche UI/rapport | Inventaire nul | BLOQUANTE | `PASS` |

---

## 15. Validation de la microcopie

### 15.1 Termes obligatoires selon le contexte

`démonstrateur`, `scénario préparé` ou `scénario préconfiguré`, `fixture déterministe`, `non évalué sous PD-011`, `décision humaine`, `information manquante`, `limite`, `provenance`, `revue humaine nécessaire`, `rapport de démonstration`.

### 15.2 Formulations autorisées

- « NOXIA propose d’examiner cette option parce que… »
- « Hypothèse de travail à tester : … »
- « Les sources reliées soutiennent cette relation dans le contexte… »
- « Cette information manque pour comparer les options. »
- « Deux éléments restent incompatibles dans ce contexte. »
- « La progression s’arrête ici tant que… »
- « Les données disponibles ne permettent pas de conclure. »
- « Vous retenez cette option sous les réserves suivantes. »
- « Cette revue révèle des points à traiter ; elle ne valide pas le projet. »
- « Rapport de démonstration, non évalué sous PD-011. »

### 15.3 Formulations interdites sans autorité et preuve correspondantes

`protocole validé`, `recommandation clinique`, `choix optimal`, `décision optimale`, `validation scientifique`, `intelligence artificielle experte`, `résultat garanti`, `décision automatique`, `option validée par NOXIA`, `solution garantie`, `résultat prouvé`, ainsi que `PASS` employé comme validation PD-011.

### 15.4 Méthode

La recherche textuelle et la relecture en contexte ont été exécutées sur la page publique, la démo, les états, les métadonnées et le rapport. Aucun claim scientifique interdit n’a été conservé. Les tests de compréhension par un public externe restent séparés en §27. État : `PASS_WITH_WARNING`.

---

## 16. Validation responsive

### 16.1 Largeurs de référence

| Largeur | Organisation attendue | Contrôle de navigation/inspecteur | Preuve attendue | État |
|---:|---|---|---|---|
| 320 px | Une colonne ; résumé, preuves et inspecteur en panneaux ; aucune capacité amputée | Sélecteur séquentiel, action persistante sans superposition | Vidéo des scénarios admis + captures de chaque surface | `PASS_WITH_WARNING` |
| 390 px | Même contrat mobile avec largeur supplémentaire utilisée sans étirer les textes | Menu, cartes, états et rapport au tactile/clavier | Planche de captures | `PASS_WITH_WARNING` |
| 768 px | Colonne large ou deux zones temporaires | Carte compacte, inspecteur escamotable | Vidéo et captures | `PASS_WITH_WARNING` |
| 1024 px | Tablette large ; matrice seulement si le conteneur le permet | Barre d’action dans le flux, aucun panneau superposé | Captures portrait/paysage si disponible | `PASS_WITH_WARNING` |
| 1440 px | Rail de phases, zone de travail, inspecteur contextuel | Matrice et preuve latérale | Vidéo et captures | `PASS_WITH_WARNING` |
| 1920 px | Largeur de lecture plafonnée ; espace utile pour comparaison, jamais texte étiré | Navigation stable, contenu essentiel non repoussé en périphérie | Captures pleine page | `PASS_WITH_WARNING` |

### 16.2 Fiche répétée à chacune des six largeurs

Exécuter exactement les 15 contrôles suivants à chaque largeur, soit **90 contrôles de surface** : Header ; menu ; page publique ; sélection d’intention ; progression ; cartes de décision ; preuves ; limites ; états bloquants ; comparaison des stratégies ; inspecteur ; fondations ; rapport ; Footer ; impression.

Pour chaque surface, consigner : visibilité, ordre de lecture, action principale, absence de chevauchement, absence de troncature porteuse de sens, focus, tactile, défilement et équivalence de contenu.

### 16.3 Huit critères transversaux obligatoires

1. aucune fonction essentielle supprimée sur mobile ;
2. aucune preuve ou limite critique inaccessible ;
3. aucune décision réservée au desktop ;
4. aucun défilement horizontal pour le contenu courant ;
5. largeur de lecture maîtrisée ;
6. actions persistantes sans superposition ni masquage du focus ;
7. inspecteur adapté au contexte et retour au point d’origine ;
8. zoom 400 % sans perte de sens, d’information ou d’action, avec vue linéaire des matrices.

Les six largeurs ont été contrôlées sur la page publique et les états représentatifs de la démo ; aucun débordement documentaire global n’a subsisté après correction du panneau Fondations. Le zoom 400 % et la répétition exhaustive des 90 surfaces restent `NOT_TESTED`. État global de cette section : `PASS_WITH_WARNING`.

---

## 17. Validation accessibilité

La cible est **WCAG 2.2 niveau AA**. La campagne peut établir des résultats par critère et par parcours ; elle ne doit déclarer une conformité complète qu’après audit exhaustif, périmètre publié, outils et limites documentés. Ce plan ne fait aucune revendication actuelle.

| ID | Contrôle | Méthode manuelle/assistée | Preuve attendue | État |
|---|---|---|---|---|
| A11Y-01 | Landmarks uniques et correctement nommés | Inspecteur d’accessibilité + lecteur d’écran | Arbre accessible | `PASS_WITH_WARNING` |
| A11Y-02 | `h1` unique et titres hiérarchiques | Inspection DOM + navigation par titres | Liste des titres | `PASS_WITH_WARNING` |
| A11Y-03 | Ordre de lecture logique et identique au sens visuel | CSS désactivée/lecteur d’écran | Transcript | `NOT_TESTED` |
| A11Y-04 | Navigation clavier complète | Protocole §23 | Journal étape par étape | `NOT_TESTED` |
| A11Y-05 | Focus visible et non masqué | Parcours clavier à 100/200/400 % | Captures | `NOT_TESTED` |
| A11Y-06 | Aucun piège clavier | Tab/Shift+Tab/Escape dans tous composants | Journal | `NOT_TESTED` |
| A11Y-07 | Focus restauré après fermeture/retour | Drawers, accordéons, erreurs, navigation | Avant/après | `NOT_TESTED` |
| A11Y-08 | Noms accessibles autonomes | Inspecteur + lecteur d’écran | Inventaire des contrôles | `PASS_WITH_WARNING` |
| A11Y-09 | Labels reliés aux champs et groupes | Inspection et navigation formulaires | Arbre accessible | `PASS_WITH_WARNING` |
| A11Y-10 | Descriptions, erreurs et aides correctement associées | Saisies invalides/manquantes | Transcript | `NOT_TESTED` |
| A11Y-11 | `aria-live`/status/alert pertinents, non bavards | Déclencher chargement, impact, blocage | Transcript temporel | `PASS_WITH_WARNING` |
| A11Y-12 | Modales conformes et limitées aux interruptions | Clavier/lecteur d’écran | Journal de focus | `PASS_WITH_WARNING` |
| A11Y-13 | Drawers/inspecteurs nommés, fermables, contexte préservé | Clavier/lecteur d’écran/mobile | Transcript et capture | `NOT_APPLICABLE` |
| A11Y-14 | Accordéons exposent état, relation et contenu | Clavier + arbre accessible | Captures/DOM | `PASS_WITH_WARNING` |
| A11Y-15 | Tableaux avec caption/en-têtes et vue linéaire équivalente | Lecteur d’écran + mobile | Transcript apparié | `NOT_APPLICABLE` |
| A11Y-16 | Contrastes texte, focus, états et composants suffisants | Outil de mesure + revue visuelle | Relevé clair/sombre | `NOT_TESTED` |
| A11Y-17 | Cibles principales ≥44 × 44 CSS px et espacées | Mesure responsive/tactile | Relevé | `PASS_WITH_WARNING` |
| A11Y-18 | Réduction des mouvements respectée | Activer préférence système | Vidéo/capture | `NOT_TESTED` |
| A11Y-19 | Zoom 200/400 % et reflow 320 px | Zoom navigateur | Captures et parcours | `NOT_TESTED` |
| A11Y-20 | Thème clair lisible et cohérent | Parcours complet | Captures | `NOT_APPLICABLE` |
| A11Y-21 | Thème sombre lisible et cohérent | Parcours complet | Captures | `PASS_WITH_WARNING` |
| A11Y-22 | Aucun sens porté uniquement par la couleur | Niveaux de gris/lecteur d’écran | Captures/transcript | `NOT_TESTED` |

Les contrôles assistés ne remplacent jamais clavier, lecteur d’écran, zoom, contraste et tactile manuels.

---

## 18. Validation SEO

La préparation initiale ne modifiait ni métadonnées, ni sitemap, ni robots. P-WEB-03 a corrigé les métadonnées sociales de la page publique et le fallback sans JavaScript, sans modifier le contrat d’indexabilité public/noindex de la démo.

### 18.1 Page publique

| ID | Contrôle | Preuve attendue | Criticité | État |
|---|---|---|---|---|
| SEO-PUB-01 | Indexabilité cohérente avec la décision de surface | HTML/réponse/robots | MAJEURE | `PASS` |
| SEO-PUB-02 | `title` unique, descriptif et non trompeur | Extraction head | MAJEURE | `PASS` |
| SEO-PUB-03 | Meta description exacte, sans claim scientifique | Extraction head | MAJEURE | `PASS` |
| SEO-PUB-04 | Canonical public absolu et cohérent | Extraction head | BLOQUANTE | `PASS` |
| SEO-PUB-05 | Open Graph cohérent avec titre, description et URL | Extraction head/preview | MINEURE | `PASS` |
| SEO-PUB-06 | Présence dans le sitemap si surface admise indexable | Sitemap analysé | MAJEURE | `PASS` |
| SEO-PUB-07 | Maillage depuis Header/site et liens de retour | Graphe de navigation borné | BLOQUANTE | `PASS` |
| SEO-PUB-08 | Absence de cannibalisation avec accueil, expertise ou connaissances | Comparaison titles/H1/intention | MAJEURE | `PASS` |

### 18.2 Démonstrateur interactif

| ID | Contrôle | Preuve attendue | Criticité | État |
|---|---|---|---|---|
| SEO-DEMO-01 | `noindex,follow` ou contrat équivalent explicitement justifié | Head/réponse | BLOQUANTE | `PASS` |
| SEO-DEMO-02 | Canonical cohérent, sans créer une page indexable concurrente | Head | BLOQUANTE | `PASS` |
| SEO-DEMO-03 | Absence du sitemap | Sitemap | BLOQUANTE | `PASS` |
| SEO-DEMO-04 | Aucune page programmatique indexable par scénario | Inventaire routes/URLs générées | BLOQUANTE | `PASS` |

---

## 19. Validation des performances perçues

Aucun seuil chiffré absent des autorités n’est transformé en norme NOXIA. Si la campagne ajoute une valeur opérationnelle, elle doit être étiquetée **seuil de test local**, accompagnée du matériel, navigateur, réseau, méthode et motif.

| ID | Contrôle | Méthode | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| PERF-01 | Aucun saut majeur qui déplace question, action ou décision | Observation/relecture vidéo | Film de chargement | MAJEURE | `PASS` |
| PERF-02 | Chargement initial nommé et compréhensible | Démarrage froid | Vidéo + annonce | MAJEURE | `NOT_APPLICABLE` |
| PERF-03 | Retour visuel immédiat après action | Filmer clic/clavier | Vidéo | MAJEURE | `PASS` |
| PERF-04 | Aucune animation bloquante ou théâtre IA | Mouvement normal/réduit | Vidéo | BLOQUANTE | `PASS` |
| PERF-05 | Navigation fluide entre étapes sans perte d’état | Parcours complet | Vidéo | MAJEURE | `PASS` |
| PERF-06 | Aucune dépendance réseau requise pour les fixtures | Mode hors ligne/journal réseau | Log | BLOQUANTE | `PASS` |
| PERF-07 | Impression du rapport reste raisonnable et stable | Aperçu/impression PDF | Fichier de preuve | MAJEURE | `NOT_TESTED` |
| PERF-08 | Ressources ajoutées inventoriées et justifiées | Comparer artefacts de build | Relevé de taille, qualifié localement | MAJEURE | `PASS` |
| PERF-09 | Aucune dépendance externe inutile | Inventaire runtime/réseau | Liste justifiée | MAJEURE | `PASS` |

---

## 20. Validation des frontières scientifiques

| ID | Frontière | Test | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| SCI-01 | Intention avant modalité/Program/RB | Nouvelle session | Capture initiale | BLOQUANTE | `PASS` |
| SCI-02 | Une fixture n’est pas un moteur ni une connaissance nouvelle | Revue de toutes mentions | Inventaire | BLOQUANTE | `PASS` |
| SCI-03 | Aucun contenu hors localisateur de corpus | Audit fixture–Reasoning Book | Concordance exhaustive | BLOQUANTE | `PASS_WITH_WARNING` |
| SCI-04 | Aucun protocole clinique ou d’acquisition | Recherche copie/rapport | Inventaire nul | BLOQUANTE | `PASS` |
| SCI-05 | Aucun paramètre constructeur exécutable | Recherche ciblée | Inventaire nul | BLOQUANTE | `PASS` |
| SCI-06 | Aucune recommandation clinique ou thérapeutique | Recherche ciblée | Inventaire nul | BLOQUANTE | `PASS` |
| SCI-07 | Aucun claim d’optimalité, garantie ou décision automatique | Revue microcopie | Inventaire nul | BLOQUANTE | `PASS` |
| SCI-08 | Aucun PASS/validation/publication PD-011 | Public/démo/rapport/metadata | Inventaire nul | BLOQUANTE | `PASS` |
| SCI-09 | `OFFICIAL` documentaire n’est pas présenté comme activation produit | Revue statuts | Captures | BLOQUANTE | `PASS` |
| SCI-10 | Information, hypothèse, conclusion et décision restent distinctes | Parcours riche | Table de projection | BLOQUANTE | `PASS` |
| SCI-11 | Inconnue, contradiction et non-évaluabilité restent visibles | Variantes critiques | Captures | BLOQUANTE | `PASS` |
| SCI-12 | La décision humaine reste nécessaire et attribuée | Parcours décision | Trace | BLOQUANTE | `PASS` |
| SCI-13 | Programs/RBs/fondations restent secondaires et en lecture seule | Navigation | Vidéo | MAJEURE | `PASS` |
| SCI-14 | Aucune mutation de corpus, registre, assertions ou sources | Tests existants, observation réseau et diff du périmètre | Logs/diff | BLOQUANTE | `PASS` |

---

## 21. Validation de la non-régression du site

| ID | Contrôle | Méthode | Preuve attendue | Criticité | État |
|---|---|---|---|---|---|
| REG-01 | Routes publiques existantes restent accessibles | Suite existante + échantillon manuel | Logs/captures | BLOQUANTE | `PASS_WITH_WARNING` |
| REG-02 | Header desktop/mobile et ordre des liens restent cohérents | Parcours 6 largeurs | Captures | BLOQUANTE | `PASS_WITH_WARNING` |
| REG-03 | Footer et navigation institutionnelle restent intacts | Parcours | Captures | MAJEURE | `PASS_WITH_WARNING` |
| REG-04 | SEO existant, canonical, robots et sitemap ne régressent pas | Audits existants | Logs | BLOQUANTE | `PASS` |
| REG-05 | Pages existantes conservent thèmes et contrastes | Comparaison visuelle | Captures | MAJEURE | `PASS_WITH_WARNING` |
| REG-06 | Aucune erreur console ou navigation induite sur les parcours de référence | Journal navigateur | Log | MAJEURE | `PASS_WITH_WARNING` |
| REG-07 | Dégradation sans JavaScript du site reste correcte | Désactiver JS | Captures | MAJEURE | `PASS_WITH_WARNING` |
| REG-08 | Aucun appel de publication ou mutation externe introduit | Réseau/tests de frontière | Logs | BLOQUANTE | `PASS` |
| REG-09 | Ressources partagées ne dégradent pas la performance perçue | Comparaison avant/après sur même environnement | Relevé local | MAJEURE | `PASS_WITH_WARNING` |
| REG-10 | Tests existants passent sans être affaiblis ou supprimés | Exécuter suite et examiner diff | Logs + diff | BLOQUANTE | `BLOCKED_EXTERNAL` |

Le dépôt externe `editorial-engine` reste hors périmètre. Un échec dû exclusivement à son état externe peut être `BLOCKED_EXTERNAL`, mais ne doit pas être masqué ni converti en succès.

---

## 22. Protocole de contrôle visuel

1. Stabiliser contenu, thème, langue, largeur, hauteur et niveau de zoom.
2. Produire pour chacune des six largeurs une capture pleine page de la surface publique.
3. Produire, pour chaque scénario admis, une capture de chacune des 17 vues et des 12 états.
4. Capturer thèmes clair et sombre pour public, intention, stratégie, état bloqué, preuve et rapport.
5. Capturer les matrices en vue large et leur équivalent linéaire mobile.
6. Capturer tout blocage avant interaction pour prouver sa visibilité niveau 0.
7. Capturer focus clavier, erreurs, états désactivés et actions persistantes.
8. Contrôler chevauchements, coupures, troncatures, sauts, lignes orphelines, largeur de lecture et hiérarchie.
9. Comparer l’usage de couleur en rendu normal et niveaux de gris.
10. Vérifier que les captures ne révèlent aucun chemin local, détail privé ou donnée non autorisée.
11. Nommer chaque preuve avec ID contrôle, largeur, thème, scénario, état et version évaluée.
12. Ne pas corriger pendant la capture ; consigner l’écart pour une mission séparée.

Une simple planche esthétique ne suffit pas : chaque capture doit être reliée à un contrôle et à une version. La campagne navigateur a couvert les six largeurs et les états représentatifs ; la planche exhaustive de 17 vues × 12 états × 3 scénarios n’a pas été produite. État : `PASS_WITH_WARNING`.

---

## 23. Protocole de contrôle clavier

Exécuter sans souris ni tactile :

1. ouvrir le site et atteindre « Protocol Designer » depuis le Header ;
2. parcourir la page publique, les limites et le CTA ;
3. entrer dans la démo et confirmer que le focus arrive au début logique ;
4. choisir une intention, utiliser « Autre objectif », revenir et conserver la saisie ;
5. accepter/modifier la compréhension ;
6. créer/ouvrir hypothèses principale et concurrente ;
7. répondre, choisir « Je ne sais pas » et reprendre une information manquante ;
8. parcourir les étapes et tenter un saut borné ;
9. comparer les stratégies, critères et désaccords ;
10. ouvrir/fermer preuve, provenance, limite et fondations en vérifiant le retour du focus ;
11. traiter contradiction, non-évaluabilité, succès partiel et reprise ;
12. modifier une entrée amont, examiner le différentiel puis annuler et confirmer successivement ;
13. retenir, adapter, différer et refuser une option dans des sessions séparées ;
14. ouvrir le rapport, suivre ses liens sources et revenir ;
15. atteindre l’impression et quitter sans perte.

À chaque étape : ordre logique ; focus visible/non masqué ; nom accessible ; activation Entrée/Espace adaptée ; Escape uniquement lorsqu’attendu ; absence de piège ; aucun raccourci exclusif ; annonces d’état ; parité fonctionnelle. Les contrats DOM, noms accessibles, tailles et contrôles natifs ont été inspectés, mais le parcours intégral sans souris n’a pas été archivé. État : `NOT_TESTED`.

---

## 24. Protocole de contrôle lecteurs d’écran

Exécuter au minimum avec un lecteur d’écran disponible sur l’environnement principal, puis avec une seconde combinaison navigateur/lecteur lorsque la plateforme est disponible. Une plateforme indisponible est documentée `BLOCKED_EXTERNAL`, jamais présumée conforme.

Contrôler :

1. titre de page, langue et landmarks ;
2. navigation par titres, régions, liens, boutons, champs et tableaux ;
3. nom, rôle, état, valeur et description de chaque contrôle ;
4. étape courante et états des sept étapes ;
5. sélection, criticité et statut sans dépendance à la couleur ;
6. erreurs, blocages, chargements, succès partiels et impacts dans le bon ordre temporel ;
7. modales, drawers et accordéons, avec fermeture et restauration du focus ;
8. matrices et vue linéaire donnant la même relation entre option, critère et limite ;
9. provenance, localisateurs et retour à l’objet d’origine ;
10. rapport et impression dans un ordre de lecture cohérent.

Archiver un transcript par parcours, avec combinaison testée, version, scénario, largeur, thème et écarts. Aucun lecteur d’écran n’a été exécuté dans cette campagne. État : `NOT_TESTED`.

---

## 25. Protocole d’impression du rapport

| ID | Contrôle | Preuve attendue | Criticité | État |
|---|---|---|---|---|
| PRINT-01 | Seul le rapport utile est imprimé ; navigation/contrôles inutiles sont retirés | Aperçu et PDF d’impression | MAJEURE | `NOT_TESTED` |
| PRINT-02 | Titre, scénario, version, date et statut de démonstration visibles | Première page | BLOQUANTE | `PASS_WITH_WARNING` |
| PRINT-03 | Mention « non évalué sous PD-011 » et « ne constitue pas un protocole validé » | Première/dernière page | BLOQUANTE | `PASS_WITH_WARNING` |
| PRINT-04 | Décisions humaines, auteur local, réserves et alternatives conservés | Pages décision | BLOQUANTE | `PASS_WITH_WARNING` |
| PRINT-05 | Limites critiques, contradictions et non-évaluables jamais omis | Comparaison écran/impression | BLOQUANTE | `PASS_WITH_WARNING` |
| PRINT-06 | Provenance et localisateurs lisibles sans URL locale | Pages sources | BLOQUANTE | `PASS_WITH_WARNING` |
| PRINT-07 | Tableaux non coupés de façon ambiguë ; répétition/alternative des en-têtes | Pages tableaux | MAJEURE | `NOT_TESTED` |
| PRINT-08 | Titres non orphelins, blocs non superposés, marges maîtrisées | Inspection page par page | MAJEURE | `NOT_TESTED` |
| PRINT-09 | Clair/sombre ne produit pas de fond illisible ou gaspillage d’encre | Aperçus depuis deux thèmes | MAJEURE | `NOT_TESTED` |
| PRINT-10 | Liens restent compréhensibles hors interaction | Inspection texte imprimé | MAJEURE | `NOT_TESTED` |
| PRINT-11 | Aucun bouton « export officiel » ou claim réglementaire | Revue de copie | BLOQUANTE | `PASS` |
| PRINT-12 | Impression raisonnable sans dépendance réseau | Mode hors ligne | MAJEURE | `NOT_TESTED` |

---

## 26. Critères de blocage

Avant toute présentation publique ou à un recruteur, chacun des écarts suivants impose `FAIL` au gate concerné dès qu’il est observé :

1. première entrée par modalité ou Program ;
2. absence de décision humaine ;
3. stratégie présentée comme automatiquement optimale ;
4. contenu scientifique inventé ;
5. absence de provenance ;
6. recommandation clinique ;
7. protocole d’acquisition ou paramètre exécutable ;
8. revendication de validation ou PASS PD-011 ;
9. blocage ou limite critique masqué ;
10. scénario requis et autorisé inutilisable à 320 px ;
11. parcours principal inutilisable au clavier ;
12. page publique inaccessible depuis le Header ;
13. démonstrateur indexé contrairement au contrat ;
14. exposition d’un chemin local ;
15. import ou promotion du paquet Fabry candidat P0 ;
16. appel réseau ou LLM non autorisé ;
17. régression majeure du site existant.

La décision corrective résout l’écart documentaire C-QA-01 mais ne transforme aucun contrôle produit en succès. L’absence future d’un scénario requis et autorisé sera évaluée seulement sur une implémentation terminée et stabilisée.

---

## 27. Critères de présentation à un recruteur

Cette grille est une appréciation produit de niveau 3, distincte de toute évaluation scientifique et de PD-011. Prévoir une session non guidée puis un entretien court.

| ID | Critère | Méthode | Preuve attendue | Seuil de décision qualitatif | État |
|---|---|---|---|---|---|
| REC-01 | Proposition de valeur comprise en moins d’une minute | Reformulation libre | Verbatim | Intention, valeur et limite correctement restituées | `NOT_TESTED` |
| REC-02 | Cohérence avec le positionnement NOXIA | Comparer page/Manifesto | Notes | Science avant technologie et humain identifiés | `NOT_TESTED` |
| REC-03 | Qualité visuelle | Revue 390/1440 px | Grille et captures | Hiérarchie calme, cohérente, sans défaut bloquant | `NOT_TESTED` |
| REC-04 | Crédibilité scientifique | Questionner source/limite | Verbatim | Le participant trouve provenance et réserve | `NOT_TESTED` |
| REC-05 | Jargon interne non expliqué absent | Parcours sans formation | Liste des incompréhensions | Aucun terme bloquant non défini | `NOT_TESTED` |
| REC-06 | Démonstration accessible sans formation | Tâche autonome | Observation | Intention→rapport réalisable ou arrêt compris | `NOT_TESTED` |
| REC-07 | Profondeur visible sans surcharge initiale | Demander preuve puis retour | Observation | Niveau 3 trouvé en un geste et retour réussi | `NOT_TESTED` |
| REC-08 | Produit intermédiaire distinct de la cible | Question directe | Verbatim | Aucune confusion avec produit complet/validé | `NOT_TESTED` |
| REC-09 | Trois domaines scientifiques présents | Inspection | Capture | RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 | `NOT_TESTED` |
| REC-10 | Rapport final convaincant mais honnête | Lecture du rapport | Notes | Décision, limites, provenance et non-évaluation comprises | `NOT_TESTED` |
| REC-11 | Mobile et desktop fonctionnels | Tâche 390/1440 px | Vidéos | Même capacité essentielle | `NOT_TESTED` |
| REC-12 | Absence de faux effet IA | Question « qu’a fait l’IA ? » | Verbatim/captures | Aucun théâtre, automatisme ou garantie perçu | `NOT_TESTED` |

Un résultat satisfaisant sur cette grille n’autorise ni claim scientifique, ni publication, ni PASS PD-011.

---

## 28. Tableau final de décision

### 28.1 Règles d’adjudication appliquées

- `PASS` global de recette de niveau 3 : tous les contrôles bloquants applicables sont `PASS`, aucun contrôle n’est `FAIL` ou `BLOCKED_EXTERNAL`, et les preuves sont complètes.
- `PASS_WITH_WARNING` global : mêmes conditions, mais un ou plusieurs écarts non bloquants sont bornés, attribués, assortis d’une revue et d’une date d’expiration.
- `FAIL` global : au moins un critère bloquant applicable est observé en échec.
- `BLOCKED_EXTERNAL` global : une dépendance extérieure empêche une adjudication indispensable malgré une cible documentaire stabilisée.
- `NOT_TESTED` global : les preuves indispensables n’ont pas été exécutées.

Le sous-ensemble produit local observé est **`PASS_WITH_WARNING`**. Le gate prépublication global reste toutefois **`NOT_TESTED`**, car le parcours clavier manuel complet et le rendu PDF d’impression n’ont pas été archivés. Les trois gardes de suite globale liées exclusivement à l’état non propre du dépôt externe restent `BLOCKED_EXTERNAL` et ne sont pas converties en succès.

### 28.2 Synthèse quantitative du plan

Les comptes indiquent les contrôles explicitement définis dans chaque domaine. Certains contrôles se recouvrent volontairement entre contrat, surface et modalité de preuve ; ils ne doivent pas être additionnés pour produire un score de qualité.

| Domaine | Nombre de contrôles | Contrôles bloquants | Méthode | Preuve attendue | État actuel |
|---|---:|---:|---|---|---|
| P-WEB-01 — vues, composants, états, navigation, AC | 100 | 70 | Fonctionnel, visuel, clavier, traçabilité | Matrices §§5.1–5.5 complétées | `PASS_WITH_WARNING` |
| PD-004 — budgets + UX-01–70 | 77 | 42 | Audit normatif et parcours | Matrice §6 complétée | `PASS_WITH_WARNING` |
| Page publique | 10 | 4 | Visuel, contenu, navigation, sans JS | Captures/transcripts | `PASS_WITH_WARNING` |
| Démonstrateur | 10 | 7 | Parcours, déterminisme, hors ligne | Vidéos/logs | `PASS_WITH_WARNING` |
| Trois scénarios | 39 | 39 de frontière scientifique | Concordance corpus–projection | Registres et localisateurs | `PASS_WITH_WARNING` |
| Parcours en sept étapes | 7 | 7 | Parcours complet et retours | Vidéo/états | `PASS_WITH_WARNING` |
| Progressive disclosure | 4 | 2 | Comparaison des niveaux | Identités/focus | `PASS_WITH_WARNING` |
| États scientifiques | 9 | 6 | Variantes et messages | Captures/provenance | `PASS_WITH_WARNING` |
| Décision humaine | 8 | 7 | Branches de décision | Traces/rapport | `PASS_WITH_WARNING` |
| Provenance | 8 | 6 | Audit exhaustif des pointeurs | Registre de concordance | `PASS_WITH_WARNING` |
| Microcopie | 4 familles | Toute formulation scientifique interdite | Recherche + relecture | Inventaire contextualisé | `PASS_WITH_WARNING` |
| Responsive | 98 | 5 critères transversaux + surfaces critiques | 6 largeurs × 15 surfaces + 8 critères | Planches/vidéos | `PASS_WITH_WARNING` |
| Accessibilité | 22 | Parcours, focus, sens, annonces | Assisté + manuel | Dossier WCAG borné | `NOT_TESTED` |
| SEO | 12 | 6 | Head, robots, sitemap, routes | Extractions/logs | `PASS_WITH_WARNING` |
| Performance perçue | 9 | 2 | Observation, hors ligne, ressources | Vidéos/logs | `PASS_WITH_WARNING` |
| Frontières scientifiques | 14 | 13 | Contenu, provenance, mutations | Inventaire/logs | `PASS_WITH_WARNING` |
| Non-régression site | 10 | 6 | Tests existants + manuel | Logs/captures | `BLOCKED_EXTERNAL` |
| Contrôle visuel | 12 étapes | Blocages et pertes de sens | Captures versionnées | Dossier visuel | `PASS_WITH_WARNING` |
| Clavier | 15 étapes | Parcours complet | Manuel | Journal de focus | `NOT_TESTED` |
| Lecteurs d’écran | 10 axes | Parcours et états critiques | Deux combinaisons si disponibles | Transcripts | `NOT_TESTED` |
| Impression | 12 | 6 | Aperçu/PDF hors ligne | Rapport inspecté | `PASS_WITH_WARNING` |
| Critères de blocage | 17 | 17 | Gate avant présentation | Registre d’écarts | `PASS_WITH_WARNING` |
| Présentation recruteur | 12 | 0 au sens PD-011 ; critères produit seulement | Session utilisateur | Verbatims/captures | `NOT_TESTED` |

### 28.3 Tableau des contrats

| Contract | Source | Criticité | Test prévu | Résultat actuel | Remarque |
|---|---|---|---|---|---|
| Principes fondateurs | Charte ; Manifesto | BLOQUANTE | Frontières SCI-01–14 et test recruteur | `PASS` | Aucune révision de principe |
| Cible produit | Product Specification | MAJEURE | Valeur, navigation, responsive, distinction cible/intermédiaire | `PASS_WITH_WARNING` | La cible 65 écrans n’est pas le périmètre livré |
| Modèle conceptuel | PD-003 | BLOQUANTE | Identités/projections/décision humaine/provenance | `PASS` | Aucun objet concurrent admis |
| UX | PD-004 + Manuel UX | BLOQUANTE | 77 lignes de §6 | `PASS_WITH_WARNING` | WCAG 2.2 AA reste une cible à prouver |
| Architecture du démonstrateur | P-WEB-01 v1.1 | BLOQUANTE | 100 lignes de §5 | `PASS_WITH_WARNING` | Autorité officielle d’architecture à trois scénarios |
| Navigation scientifique | PD-009 | BLOQUANTE | Étapes, arrêts, impacts, reprise | `PASS` | Aucune décision scientifique par l’UI |
| Évaluation scientifique | PD-011 | BLOQUANTE | Recherche de claims et marquages permanents | `PASS` | Aucun PASS scientifique possible ici |
| Programs/ownership | PD-012 ; PD-013 état 1.7 | BLOQUANTE | Versions, Owners, lecture seule | `PASS` | `OFFICIAL` ≠ activation |
| Spectral Imaging | RB-003 v1.0 | BLOQUANTE | SC-RB003-01–13 | `PASS_WITH_WARNING` | Projection seulement |
| Cardiac MRI | RB-004 v1.1 | BLOQUANTE | SC-RB004-01–13 | `PASS_WITH_WARNING` | Projection seulement |
| Neuro Perfusion | RB-005 v1.0 | BLOQUANTE | SC-RB005-01–13 | `PASS_WITH_WARNING` | Troisième scénario autorisé par P-WEB-01 v1.1 |
| Historique de consolidation | P17 | MAJEURE | Vérifier lecture historique sans réécriture | `PASS` | État antérieur de RB-005 exact à sa date |
| Surface publique | P-WEB-01 §§8, 19, 22 | BLOQUANTE | PUB-01–10, SEO, sans JS | `PASS_WITH_WARNING` | Indexation distincte de l’interactif |
| Surface interactive | P-WEB-01 §§7–18 | BLOQUANTE | DEMO, parcours, états, a11y | `PASS_WITH_WARNING` | Déterministe et noindex ; audit a11y manuel incomplet |
| Rapport imprimé | P-WEB-01 §10.14 | BLOQUANTE | PRINT-01–12 | `PASS_WITH_WARNING` | Contenu et CSS vérifiés ; rendu PDF non archivé |
| Non-régression | Site courant et tests existants | BLOQUANTE | REG-01–10 | `BLOCKED_EXTERNAL` | Trois gardes dépendent du dépôt externe déjà non propre |
| Admission de ce plan | SOURCE-OF-TRUTH-INDEX v1.21 | CONTEXTUELLE | Décision avec le rapport final | `NOT_APPLICABLE` | Seul le rapport P-WEB-03 est admis ; ce plan reste hors corpus gouverné |

---

## Décision de préparation

Le plan a été exécuté sur une référence P-WEB-02 stabilisée puis rejoué après corrections P-WEB-03. Il n’accorde aucun PASS scientifique, conserve C-QA-01 comme différence temporelle résolue par P-WEB-01 v1.1 et maintient séparés résultats locaux, contrôles non testés et dépendances externes.

**Résultat global du plan : `NOT_TESTED`.**

Le sous-ensemble produit local observé reste `PASS_WITH_WARNING` ; il ne suffit pas à autoriser P-WEB-04 tant que les preuves manuelles bloquantes ne sont pas exécutées.
