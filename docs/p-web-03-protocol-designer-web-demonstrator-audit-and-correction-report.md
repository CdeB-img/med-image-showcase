# P-WEB-03 — Audit indépendant, correction ciblée et stabilisation prépublication du démonstrateur Protocol Designer Web

**Statut documentaire :** RAPPORT_OFFICIEL

**Niveau documentaire :** NIVEAU_3

**Version :** 1.0

**Date d’arrêt :** 3 août 2026

**Source maîtresse :** `docs/p-web-03-protocol-designer-web-demonstrator-audit-and-correction-report.md`

**Référence Git initiale :** `main` — `8b28c04d0e583708f21b2edba9755e77c5a85cb0`

**Autorité scientifique revendiquée :** aucune

**PASS PD-011 revendiqué :** aucun

---

## 1. Décision unique

**`NOT_READY_FOR_P_WEB_04`**

Le démonstrateur corrigé est fonctionnel sur les parcours observés, fidèle aux trois corpus autorisés, utilisable aux six largeurs de référence et protégé par 48 tests ciblés réussis. Il n’est toutefois pas autorisé à passer à P-WEB-04 : le parcours clavier manuel complet et le rendu PDF d’impression n’ont pas été exécutés et archivés. Ces deux preuves sont requises par les critères de sortie P-WEB-03 ; elles restent `NOT_TESTED` et ne sont pas transformées en conformité présumée.

La suite globale atteint 539/542 après rebaselining étroit des gardes historiques. Les trois échecs restants sont `BLOCKED_EXTERNAL` et dépendent uniquement de l’état non propre préexistant du dépôt `editorial-engine`. Ils sont isolés de l’implémentation Protocol Designer et ne sont ni neutralisés ni déclarés réussis.

## 2. Documents consultés

La chaîne imposée a été lue dans l’ordre de gouvernance :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.20 au début de mission ;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx` ;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-edition-editoriale.docx` ;
4. `output/documents/noxia-protocol-designer-product-specification-v1.0.docx` ;
5. `docs/pd-003-research-object-model.md` ;
6. `docs/pd-004-ux-manifesto.md` ;
7. `output/documents/noxia-protocol-designer-manuel-ux-officiel.docx` ;
8. `docs/pd-005-prompt-library-architecture.md` ;
9. `docs/pd-007-protocol-designer-implementation-readiness.md` ;
10. `docs/pd-009-decision-engine-architecture.md` ;
11. `docs/pd-011-evaluation-framework.md` ;
12. `docs/pd-012-scientific-program-architecture.md` ;
13. `docs/pd-013-scientific-program-registry.md`, état 1.7 ;
14. `docs/scientific-territory-model.md` ;
15. `docs/p6-scientific-knowledge-catalog.md` et son rapport ;
16. `docs/scientific-assertion-layer.md` et son rapport ;
17. `docs/scientific-knowledge-graph-web.md` ;
18. les DOCX maîtres RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 ;
19. `docs/p17-scientific-programs-reasoning-books-consolidation-report.md` ;
20. `docs/p-web-01-protocol-designer-web-demonstrator-architecture.md`, version 1.1 ;
21. `docs/p-web-02-protocol-designer-web-demonstrator-validation-plan.md` ;
22. `docs/p-web-02-protocol-designer-web-demonstrator-implementation-report.md` ;
23. en lecture seule dans le dépôt externe : `docs/architecture-manifesto.md`, `docs/capability-reference.md` et `docs/source-traceability-matrix.md`.

Les plans de vérité ont été séparés ainsi : Charte et Manifesto pour les principes établis ; Product Specification, PD-003, PD-004, PD-009, PD-011, PD-012 et PD-013 pour les références normatives ; RB-003, RB-004 et RB-005 pour les corpus scientifiques ; P-WEB-01 pour l’architecture de préparation ; code, fixtures, tests, build et navigateur pour l’implémentation réellement observée ; P-WEB-02 pour les assertions historiques ; plan QA pour la procédure et ses résultats ; hypothèses seulement lorsqu’aucune preuve exécutable n’était disponible.

## 3. Préconditions

| Précondition | Preuve | État |
|---|---|---|
| P-WEB-01 reconnaît exactement RB-003, RB-004 et RB-005 | P-WEB-01 v1.1, index v1.20 | `PASS` |
| La contradiction RB-005 est résolue | RB-005 officiel v1.0, PD-013 état 1.7, P-WEB-01 v1.1 | `PASS` |
| Le plan QA nomme l’autorité actuelle | plan P-WEB-02-QA réconcilié | `PASS` |
| Aucune tâche concurrente sur le périmètre | arbre propre, absence de verrou et inspection des processus avant modification | `PASS` |
| Dépôt NOXIA stable avant correction | `main`, HEAD exact, aucun fichier modifié ou non suivi | `PASS` |
| Dépôt externe traité en lecture seule | statut relevé, aucune écriture P-WEB-03 | `PASS` |

Aucune contradiction documentaire active n’empêchait l’audit. Le texte historique de P17 décrivant RB-005 avant son admission est une différence temporelle, non une contradiction actuelle. Le décalage entre cible normative et démonstrateur intermédiaire est une différence de périmètre déclarée.

## 4. État Git initial

| Élément | Observation initiale | État |
|---|---|---|
| Branche NOXIA | `main` | `PASS` |
| HEAD NOXIA | `8b28c04d0e583708f21b2edba9755e77c5a85cb0` | `PASS` |
| Sujet du HEAD | `feat(protocol-designer): implement and reconcile P-WEB-02 demonstrator` | `PASS` |
| Fichiers suivis modifiés | aucun | `PASS` |
| Fichiers non suivis | aucun | `PASS` |
| Verrous Git | aucun | `PASS` |
| Branche Editorial Engine | `main` | `PASS` |
| HEAD Editorial Engine | `335fbbea8d138901f0cdf4f5e2d3b96144880e8b` | `PASS` |
| Statut Editorial Engine | modifications et fichiers non suivis préexistants | `BLOCKED_EXTERNAL` |

## 5. Inventaire P-WEB-02

L’inventaire du lot poussé comprend les routes `/protocol-designer` et `/protocol-designer/demo`, les pages correspondantes, les types, les fixtures, la vue secondaire des fondations, les tests P-WEB-02, ainsi que les adaptations déjà enregistrées de `src/App.tsx`, du Header, des styles, de la frontière P0, des tests SEO, de l’audit SEO et du sitemap.

| Élément | État déclaré par P-WEB-02 | État initial observé | Concordant ? | Preuve | Action nécessaire |
|---|---|---|---|---|---|
| Routes publique et démo | présentes | présentes et navigables | `PASS` | routes, navigateur | audit détaillé |
| Trois scénarios | présents | présents, mais identités visibles inexactes ou incomplètes | `FAIL` | fixtures et fondations | corriger les identités |
| Entrée par intention | déclarée | scénario et fondations exposés trop tôt | `FAIL` | premier écran navigateur | séparer intention et rattachement |
| Sept étapes | présentes | présentes | `PASS_WITH_WARNING` | navigation d’étapes | revoir impacts et impasses |
| Décision humaine | déclarée explicite | simple confirmation, branches et justification insuffisantes | `FAIL` | étape de revue | compléter le contrat |
| Rapport imprimable | déclaré | rapport accessible mais stale après édition amont ; Header du rapport masqué à l’impression | `FAIL` | navigateur et CSS | invalider et corriger le print |
| Responsive | déclaré réussi | popover Fondations débordant sur mobile | `FAIL` | mesure et capture 390 px | corriger le panneau |
| Tests ciblés | 37/37 | 37/37 | `PASS` | Vitest initial | étendre les gardes |
| Suite globale | 521/531, dont sept gardes diff | 528/531 sur la référence propre, trois échecs externes | `PASS_WITH_WARNING` | suite initiale | erratum factuel |

## 6. Concordance entre rapport P-WEB-02 et code

Le rapport P-WEB-02 décrivait correctement les routes, l’absence de backend/LLM, le caractère déterministe, le noindex de la démo, la frontière Fabry et la présence de trois scénarios. Il surévaluait cependant l’entrée intention-first, la décision humaine, l’invalidation d’état, l’impression, le responsive mobile et la qualité de certaines identités scientifiques.

Un erratum factuel version 1.1 a été ajouté sans réécriture rétrospective : P-WEB-01 actuel est v1.1 à trois scénarios ; le baseline initial propre est 528/531 ; les sept anciens échecs liés au diff ne se reproduisaient pas sur ce baseline ; les listes de fichiers restent historiques ; les conclusions P-WEB-02 sont supersédées pour la prépublication par le plan exécuté et le présent rapport.

## 7. Résultats du plan indépendant

Le plan P-WEB-02-QA est désormais version 1.1 et chaque contrôle possède un état autorisé. Le sous-ensemble produit local observé est `PASS_WITH_WARNING`. Le résultat global du plan est `NOT_TESTED`, car deux preuves indispensables ne sont pas archivées : parcours clavier manuel complet et rendu PDF d’impression.

| Domaine | Résultat | Preuve principale |
|---|---|---|
| Produit, parcours et état local | `PASS_WITH_WARNING` | navigateur réel et tests PWEB02/PWEB03 |
| Trois projections scientifiques | `PASS_WITH_WARNING` | fixtures corrigées, corpus propriétaires, localisateurs |
| Responsive six largeurs | `PASS_WITH_WARNING` | 320, 390, 768, 1024, 1440, 1920 px |
| Accessibilité structurelle | `PASS_WITH_WARNING` | DOM accessible, labels, contrôles natifs, focus visible |
| Parcours clavier manuel complet | `NOT_TESTED` | absence de journal de focus complet |
| Lecteur d’écran | `NOT_TESTED` | aucune combinaison exécutée |
| Impression PDF | `NOT_TESTED` | CSS contrôlé, PDF non archivé |
| SEO | `PASS` | 40 pages, 0 erreur, 0 avertissement |
| Tests locaux pertinents | `PASS` | 48/48 ciblés, typecheck, lint sans erreur, build |
| Suite globale | `BLOCKED_EXTERNAL` | 539/542 ; trois gardes Editorial Engine |

## 8. Audit produit

| Point de vue | Constat final | État |
|---|---|---|
| Médecin ou chercheur | valeur, limites, preuve et décision humaine compréhensibles ; aucune donnée patient | `PASS_WITH_WARNING` |
| Expert en imagerie | versions, Program Owners, localisateurs, incertitudes et non-interchangeabilité visibles | `PASS_WITH_WARNING` |
| Responsable de Core Lab | calibration, reproductibilité, inconnues critiques et portée humaine explicites | `PASS_WITH_WARNING` |
| Partenaire industriel | frontière déterministe, locale, sans intégration dynamique ni claim produit | `PASS` |
| Recruteur | valeur et profondeur visibles en moins d’une minute ; test utilisateur non exécuté | `NOT_TESTED` |

La page publique répond désormais à « ce que fait la démonstration », « ce qu’elle ne valide pas » et « comment se déroule le parcours ». La première action utile reste l’ouverture du démonstrateur. Le vocabulaire documentaire profond est relégué à la traçabilité.

## 9. Audit UX

L’entrée fonctionnelle commence désormais par une intention et une formulation libre. Le rattachement à un scénario intervient seulement à l’étape suivante. « Autre objectif » permet un refus honnête hors périmètre. Les sept étapes conservent navigation arrière, état local et blocages visibles.

Les modifications amont invalident les étapes dépendantes, archivent une décision antérieure et affichent un résumé « Modifié / Préservé / À réexaminer ». Les données critiques manquantes n’aboutissent plus à une impasse : elles autorisent un rapport provisoire tout en interdisant une décision aboutie. La revue propose retenir, adapter, différer ou refuser avec justification, réserves, auteur et portée.

La restitution du focus après toutes les ouvertures et le parcours intégral au clavier restent à prouver manuellement ; ils ne sont pas présumés conformes.

## 10. Audit visuel

Les corrections ont conservé l’identité visuelle NOXIA : même Header, typographies, couleurs, boutons, densité et Footer. Aucun effet décoratif ou tableau technique concurrent n’a été ajouté.

La hiérarchie mobile de la page publique est claire à 390 px. Le rapport provisoire reste lisible à 320 px. Le panneau des fondations est désormais borné par `inset`, hauteur maximale et défilement interne ; il ne dépasse plus le viewport. La progression horizontale reste volontairement défilable sur petit écran sans créer de débordement du document.

Le thème sombre courant a été inspecté. Le thème clair complet, le rendu en niveaux de gris et la planche exhaustive de toutes les combinaisons restent non exécutés.

## 11. Audit scientifique de projection

Les fixtures sont des projections déterministes, pas une nouvelle couche de connaissance. Elles portent maintenant pour chaque scénario : identité du Program, version du Program, titre officiel du Reasoning Book, version du RB, date de connaissance `2026-08-03`, statut `DEMO_FIXTURE_NOT_DYNAMIC`, localisateurs et relation de preuve `QUALIFIES` ou `BOUNDS`.

Les limites et controverses restent visibles. Aucune formule, valeur normale, recommandation, paramètre d’acquisition, conclusion patient ou hiérarchie universelle entre options n’a été ajoutée. Le besoin hors périmètre produit une condition de refus au lieu de substituer un corpus. La contradiction conserve deux positions sourcées ; aucune synthèse silencieuse ne les résout.

## 12. Audit des trois scénarios

| Scénario | Identité contrôlée | Projection et limites | État |
|---|---|---|---|
| Spectral Imaging | `NXP-000001` v1.1 ; RB-003 « Reasoning Book 03 — Spectral Imaging » v1.0 | mesure reconstruite, calibration, matérialité des sorties, transférabilité non présumée | `PASS_WITH_WARNING` |
| Cardiac MRI & Quantitative Cardiac Imaging | `NXP-000002` v1.2 ; RB-004 du même titre v1.1 | biomarqueur, chaîne de mesure, qualité et défendabilité, sans conclusion clinique | `PASS_WITH_WARNING` |
| Neuro Perfusion & Metabolism | `NXP-000003` v1.1 ; RB-005 « Reasoning Book 05 — Neuro Perfusion & Metabolism Foundations » v1.0 | hémodynamique, oxygénation, métabolisme et hypothèses propres aux modalités | `PASS_WITH_WARNING` |

Les trois structures sont alignées : compréhension, hypothèses, informations manquantes, options, revue, rapport, preuve et limite. Leur profondeur diffère uniquement selon les corpus. Aucune insuffisance du RB n’a été complétée par invention.

## 13. Audit responsive

| Largeur | Page publique | Démonstrateur/rapport | Débordement documentaire | État |
|---:|---|---|---|---|
| 320 px | CTA visible, H1 unique | rapport et fondations utilisables | absent | `PASS_WITH_WARNING` |
| 390 px | Header/menu/hero utilisables | parcours et panneau bornés | absent | `PASS_WITH_WARNING` |
| 768 px | tablette lisible | contenu essentiel présent | absent | `PASS_WITH_WARNING` |
| 1024 px | navigation et contenu cohérents | progression complète | absent | `PASS` |
| 1440 px | largeur de lecture maîtrisée | rapport lisible | absent | `PASS` |
| 1920 px | contenu centré | aucune dilution critique | absent | `PASS` |

Le menu mobile s’ouvre, expose « Protocol Designer » et se ferme par un contrôle nommé. Le contrôle à 200 % n’a pas révélé de suppression de fonction dans l’inspection disponible. Le zoom 400 %, l’orientation paysage mobile et la taille dynamique du texte restent `NOT_TESTED`.

## 14. Audit accessibilité

Les landmarks, titres, groupes, labels, noms accessibles, boutons natifs, états `pressed`/`disabled`, alertes, région d’impact et lien d’évitement ont été contrôlés. Le focus visible présente un anneau contrasté. Les cibles essentielles sont utilisables au pointeur sur mobile.

L’environnement de contrôle n’a pas permis de produire un journal fiable du déplacement Tab : les événements de tabulation injectés ne déplaçaient pas le focus navigateur. Cette limite d’outil ne prouve ni réussite ni échec du produit. Conformément au prompt, le parcours clavier complet reste `NOT_TESTED`. Aucun lecteur d’écran n’a été exécuté ; l’absence de certification WCAG 2.2 AA est explicite.

## 15. Audit microcopie

La microcopie conserve « démonstrateur », « scénario préparé », « fixture déterministe », « non évalué sous PD-011 », « décision humaine », « information manquante », « contradiction », « limite », « provenance » et « revue humaine nécessaire ».

Les formulations ambiguës ont été remplacées par des états précis : « rapport provisoire », « aucune décision humaine enregistrée », « non évaluable », « aucun corpus propriétaire substitué » et « aucune option classée automatiquement ». La revue n’utilise aucun claim de protocole validé, validation scientifique, choix optimal, recommandation clinique, décision automatique ou résultat garanti.

## 16. Audit du rapport

Le rapport nominal contient intention, reformulation, contexte, hypothèses, informations manquantes, stratégie soumise à revue, alternatives non classées, décision humaine, réserves, preuves, limites, risques, controverse, provenance, statut de fixture, date de connaissance et RB source/version.

Le rapport provisoire conserve les bloqueurs critiques sans inventer de décision. Le rapport hors périmètre conserve l’intention et la condition de refus sans substituer une source. Une modification amont désactive l’accès à l’ancien rapport et affiche les impacts ; une décision antérieure est conservée seulement dans l’historique.

Le sélecteur d’impression ne masque plus le Header interne du rapport : seul `.site-header` est retiré. La pagination CSS évite les coupures de blocs et les titres orphelins. Le PDF système n’a pas été produit ; la qualité page par page reste `NOT_TESTED`.

## 17. Audit SEO

La page `/protocol-designer` reste indexable, possède un H1 unique, title, description, canonical, Open Graph, Twitter Card, breadcrumbs et maillage. Elle reste présente au sitemap. La page `/protocol-designer/demo` conserve `noindex, follow`, son canonical et son absence du sitemap. Aucune page par scénario n’a été créée.

Le fallback sans JavaScript décrit désormais la valeur, les limites et le lien public au lieu d’une simple navigation. L’audit local final couvre 40 pages avec 0 erreur et 0 avertissement. Le rapport SEO généré n’est pas utilisé comme autorité scientifique.

## 18. Audit performances

Le build transforme 1 804 modules. Le chunk du démonstrateur est d’environ 59,54 kB avant gzip et reste chargé par route. Aucune nouvelle dépendance n’a été ajoutée. Aucun appel réseau, backend, LLM, Knowledge Graph dynamique ou Editorial Engine n’est consommé par le démonstrateur. Les transitions entre étapes sont immédiates dans le contrôle local et aucun layout shift manifeste n’a été observé.

Les avertissements de build concernent une base `caniuse-lite` ancienne et des annotations `react-helmet-async`; ils ne bloquent pas la construction. Aucune norme de performance non autorisée n’est inventée.

## 19. Audit de l’état local

L’état est limité à `sessionStorage`, versionné par schéma et nettoyé lors d’une incompatibilité. Les données acceptées sont filtrées ; une décision confirmée forgée ne devient pas une décision valide. Le changement d’intention, de scénario, d’hypothèse, d’information ou de stratégie invalide les dépendances appropriées. La réinitialisation exige confirmation et restaure un état vide.

Aucune donnée sensible ou personnelle n’est demandée ; la formulation rappelle de ne pas saisir de donnée patient. Aucun scénario ne contamine le suivant. Les états obsolètes et les changements de version de fixture produisent une récupération explicite plutôt qu’une reprise silencieuse.

## 20. Audit des tests historiques

Les sept gardes qui ont échoué après les corrections et la régénération SEO P-WEB-03 protégeaient l’absence de modification des surfaces publiques ou du snapshot SEO pendant des missions Knowledge Graph historiques. Leur baseline de phase était dépassée par l’autorisation explicite P-WEB-01/P-WEB-02/P-WEB-03. Ils ont été rebaselinés par une liste fermée de quatre chemins seulement : `docs/seo-authority-local-report.md`, `index.html`, `src/pages/ProtocolDesigner.tsx` et `src/pages/ProtocolDesignerDemo.tsx`. Les chemins P12 autorisés restent inchangés. Une nouvelle assertion vérifie l’absence d’import Knowledge Graph dans les pages Protocol Designer.

| Test | Contrat protégé | Classification | Préservé ? | Rebaseliné ? | Test-preuve | Remarque |
|---|---|---|---|---|---|---|
| `knowledge-graph.test.mjs` — découplage produit | le graphe ne modifie ni ne pilote les routes/pages non autorisées | garde de phase + invariant permanent | `PASS` | `PASS` | liste fermée + absence d’import Knowledge Graph | les pages P-WEB-03 seules sont admises |
| P3M-Web 77 | pages/composants inchangés hors mission autorisée | garde de phase terminée | `PASS` | `PASS` | filtre exact partagé | aucune autorisation générique de `src/pages` |
| P3M-Web 78 | routes/SEO/sitemap/robots inchangés hors mission autorisée | garde de phase terminée | `PASS` | `PASS` | seul `index.html` ajouté à la liste P-WEB-03 | sitemap et robots restent protégés |
| P4 corpus 67 | aucune mutation de page publique par P4 | garde devenue incompatible avec P-WEB-03 | `PASS` | `PASS` | filtre exact partagé | invariant corpus conservé |
| P4 corpus 68 | aucune mutation de route par P4 | invariant permanent | `PASS` | `PASS` | aucun nouveau chemin de route P-WEB-03 ajouté | `src/App.tsx` reste l’autorisation P12 historique |
| P4 corpus 69 | aucun snapshot SEO modifié par P4 | garde de phase terminée | `PASS` | `PASS` | seul le rapport SEO régénéré est admis | robots, sitemap et générateur restent protégés |
| P5 multidomaine pages | aucune mutation publique par P5 | garde devenue incompatible avec P-WEB-03 | `PASS` | `PASS` | filtre exact partagé | aucune surface scientifique libérée |
| P5 multidomaine routes | aucune mutation de route par P5 | invariant permanent | `PASS` | `PASS` | aucun nouveau chemin de route P-WEB-03 ajouté | inchangé fonctionnellement |
| P5 multidomaine SEO | aucune mutation SEO par P5 | garde de phase terminée | `PASS` | `PASS` | seul le rapport SEO régénéré est admis | aucun contrat SEO assoupli |
| P0 Fabry 13 contrats | aucune activation/import/publication du candidat Fabry | invariant permanent | `PASS` | `NOT_APPLICABLE` | 13/13 | aucune tolérance ajoutée |
| PWEB02-01 à PWEB02-18 | contrats du démonstrateur | invariant permanent réconcilié | `PASS` | `PASS` | 19/19 | séquence intention puis scénario précisée |
| SEO pages | indexabilité publique/noindex démo | invariant permanent | `PASS` | `NOT_APPLICABLE` | 5/5 + audit 40 pages | aucune page dynamique créée |
| Trois gardes Editorial Engine | dépôt externe propre | dépendance externe | `BLOCKED_EXTERNAL` | `NOT_APPLICABLE` | 253/256 sur les quatre fichiers historiques affectés | gardes conservées sans neutralisation |

## 21. État Editorial Engine

Le dépôt externe est sur `main`, HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, avec des modifications suivies et non suivies préexistantes. Les trois tests NOXIA concernés vérifient que ce dépôt est propre. P-WEB-03 n’a modifié, importé, exécuté comme dépendance ni consommé aucun fichier de ce moteur.

Les trois contrôles restent `BLOCKED_EXTERNAL`. Leur échec n’est pas attribué au démonstrateur, mais il interdit de déclarer la suite globale intégralement verte.

## 22. Défauts détectés

| ID | Surface | Description | Sévérité | Source d’exigence | Preuve | Correction | Test de non-régression | État final |
|---|---|---|---|---|---|---|---|---|
| D-01 | Entrée | Programs/RBs et scénario exposés avant l’intention | BLOQUANTE | PD-004 ; P-WEB-01 ; critère de blocage | écran initial navigateur | écran intention-only puis rattachement | PWEB03-01 ; navigateur | `PASS` |
| D-02 | Intention | absence d’« Autre objectif » | MAJEURE | P-WEB-01 ; plan QA | DOM initial | sixième branche hors rattachement automatique | PWEB03-01/02 | `PASS` |
| D-03 | Fondations | titres officiels, date et statut de fixture incomplets ou erronés | BLOQUANTE | PD-013 ; RB-003/4/5 | fixtures initiales | identités exactes, date, statut | PWEB03-08 | `PASS` |
| D-04 | Contradiction | booléen sans deux positions sourcées | BLOQUANTE | PD-004 ; PD-009 | étape Compréhension | deux positions et localisateurs | PWEB03-03 | `PASS` |
| D-05 | Décision | confirmation unique sans branches, justification ni réserves | BLOQUANTE | PD-003 ; PD-009 ; P-WEB-01 | étape Revue | retenir/adapter/différer/refuser + attribution | PWEB03-05 | `PASS` |
| D-06 | Non-évaluabilité | inconnue critique créant une impasse sans rapport | BLOQUANTE | PD-004 ; P-WEB-01 | parcours bloqué | rapport provisoire sans décision | PWEB03-04 | `PASS` |
| D-07 | État local | ancien rapport encore accessible après modification amont | BLOQUANTE | PD-004 ; PD-009 | reproduction navigateur | invalidation dépendante et historique | PWEB03-06 | `PASS` |
| D-08 | Impact | aucune synthèse de ce qui change ou reste valide | BLOQUANTE | PD-004 | modification amont | région Modifié/Préservé/À réexaminer | PWEB03-06 ; navigateur | `PASS` |
| D-09 | Impression | règle générique `header` masquant le Header du rapport | BLOQUANTE | P-WEB-01 | CSS print | ciblage `.site-header` | PWEB03-09 | `PASS_WITH_WARNING` |
| D-10 | Mobile | panneau Fondations débordant du viewport | BLOQUANTE | P-WEB-01 responsive | capture/mesure 390 px | panneau fixed borné et défilable | PWEB03-09 ; 320/390 px | `PASS` |
| D-11 | Page publique | limites et sept étapes insuffisamment visibles | MAJEURE | Product Specification ; P-WEB-01 | revue visuelle | sections dédiées | PWEB03-10 | `PASS` |
| D-12 | SEO | Open Graph route et fallback sans JS incomplets | MAJEURE | P-WEB-01 SEO | head et `index.html` | OG/Twitter et fallback utile | PWEB03-10/11 ; audit SEO | `PASS` |
| D-13 | Session | confiance excessive dans l’état local restauré | MAJEURE | PD-009 ; sécurité de démonstration | inspection du restore | schéma v2 et sanitation | PWEB03-07 | `PASS` |
| D-14 | Tests | absence de gardes sur les défauts P-WEB-03 | MAJEURE | stratégie QA | suite initiale | 11 tests PWEB03 | 11/11 | `PASS` |
| D-15 | Rapport P-WEB-02 | baseline globale et état P-WEB-01 devenus factuellement obsolètes | MAJEURE | gouvernance documentaire | rapport vs HEAD propre | erratum v1.1 | revue documentaire | `PASS` |
| D-16 | Tests historiques | sept gardes de phase rejetaient les chemins P-WEB-03 et le snapshot SEO autorisés | MAJEURE | audit des tests historiques | suite globale 534/542 puis 537/542 | rebaseline exacte, invariant renforcé | suite affectée 253/256 puis suite globale 539/542 | `PASS` |
| D-17 | Accessibilité | parcours clavier manuel complet non archivé | BLOQUANTE | critère de sortie 9 | absence de journal fiable | aucune correction déclarée sans preuve | contrôle requis avant P-WEB-04 | `NOT_TESTED` |
| D-18 | Impression | PDF système non produit et inspecté | BLOQUANTE | audit rapport ; critère de sortie 11 | absence de PDF | CSS corrigé seulement | contrôle requis avant P-WEB-04 | `NOT_TESTED` |

## 23. Corrections appliquées

Les corrections ont été bornées aux pages et composants Protocol Designer, fixtures de projection, état local, styles, Header, SEO, tests, plan QA, erratum P-WEB-02 et présent rapport. Elles couvrent : entrée intention-first ; refus hors périmètre ; identités officielles ; contradiction à deux positions ; décision humaine complète ; rapports provisoires ; invalidation amont ; historique de décision ; panneau mobile ; impression ciblée ; limites de la page publique ; métadonnées sociales ; fallback sans JavaScript ; sanitation de session ; 11 gardes P-WEB-03 ; rebaselining exact de sept gardes historiques.

Aucune correction n’a modifié une source scientifique, un Program, PD-003 à PD-013, le Territory Model, le Catalog, le Knowledge Graph, le paquet Fabry ou l’Editorial Engine.

## 24. Défauts non corrigés

| Limite | Motif | État | Condition de clôture |
|---|---|---|---|
| Parcours clavier manuel complet | outil de tabulation non probant ; aucun journal fiable | `NOT_TESTED` | exécution humaine sans souris sur le parcours complet |
| Lecteur d’écran | aucune combinaison disponible/exécutée | `NOT_TESTED` | transcript sur au moins une combinaison, idéalement deux |
| PDF d’impression | dialogue système non exécuté | `NOT_TESTED` | PDF réel et inspection page par page |
| Zoom 400 % et texte dynamique | campagne non exécutée | `NOT_TESTED` | contrôles dédiés documentés |
| Test utilisateur recruteur/clinicien | hors campagne technique | `NOT_TESTED` | session non guidée et verbatim |
| Trois gardes Editorial Engine | dépôt externe préalablement non propre | `BLOCKED_EXTERNAL` | remise à un état propre par son propriétaire puis rejeu |

## 25. Fichiers créés et modifiés

Fichiers créés :

- `docs/p-web-03-protocol-designer-web-demonstrator-audit-and-correction-report.md` ;
- `src/features/protocol-designer/__tests__/p-web-03-regression.test.tsx`.

Fichiers modifiés dans le périmètre produit/documentaire autorisé :

- `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` — admission du présent rapport et état courant du démonstrateur ;
- `docs/p-web-02-protocol-designer-web-demonstrator-implementation-report.md` ;
- `docs/p-web-02-protocol-designer-web-demonstrator-validation-plan.md` ;
- `docs/seo-authority-local-report.md` — régénéré par l’audit requis, résultat inchangé ;
- `index.html` ;
- `src/components/Header.tsx` ;
- `src/features/protocol-designer/DisclosureStack.tsx` ;
- `src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx` ;
- `src/features/protocol-designer/fixtures.ts` ;
- `src/features/protocol-designer/types.ts` ;
- `src/index.css` ;
- `src/pages/ProtocolDesigner.tsx` ;
- `src/pages/ProtocolDesignerDemo.tsx`.

Fichiers de tests historiques rebaselinés :

- `src/test/p12-protected-surfaces.mjs` ;
- `src/knowledge-graph/knowledge-graph.test.mjs` ;
- `src/knowledge-graph/scientific-knowledge-graph-web.test.mjs` ;
- `src/knowledge-graph/scientific-corpus/scientific-corpus.test.mjs` ;
- `src/knowledge-graph/scientific-multidomain/scientific-multidomain.test.mjs`.

Le `SOURCE-OF-TRUTH-INDEX` est modifié uniquement pour admettre le présent rapport et corriger son état d’implémentation devenu faux. Le rapport SEO local a été régénéré par l’audit requis ; son résultat reste 40 pages, 0 erreur et 0 avertissement.

## 26. Validations finales

| Validation | Résultat | Preuve |
|---|---|---|
| Tests Protocol Designer, P0 et SEO ciblés | `PASS` | 48/48 |
| Tests PWEB03 nouveaux | `PASS` | 11/11 |
| Tests historiques affectés | `BLOCKED_EXTERNAL` | 253/256 ; trois externes seulement |
| Typecheck | `PASS` | aucune erreur |
| Lint | `PASS_WITH_WARNING` | 0 erreur, 7 avertissements Fast Refresh préexistants |
| Build production | `PASS_WITH_WARNING` | 1 804 modules ; avertissements dépendances non bloquants |
| Audit SEO | `PASS` | 40 pages, 0 erreur, 0 avertissement |
| Suite globale | `BLOCKED_EXTERNAL` | 539/542 ; trois échecs Editorial Engine |
| `git diff --check` | `PASS` | aucune erreur |
| Page publique et menu mobile | `PASS` | navigateur 390 px et six largeurs |
| Trois scénarios | `PASS` | navigateur + fixtures + tests |
| Parcours nominal avec décision | `PASS` | décision Retenir, justification, réserve et auteur dans le rapport |
| Blocage critique et rapport provisoire | `PASS` | navigateur + PWEB03-04 |
| Besoin hors périmètre | `PASS` | navigateur + PWEB03-02 |
| Modification amont | `PASS` | rapport invalidé et impact visible |
| Parcours clavier complet | `NOT_TESTED` | preuve manuelle absente |
| PDF d’impression | `NOT_TESTED` | preuve système absente |

## 27. Limites

Ce rapport ne constitue ni audit WCAG externe certifiant, ni test utilisateur clinique, ni validation scientifique, ni PASS PD-011. Les fixtures ne sont pas des objets dynamiques du Knowledge Graph. Les décisions enregistrées sont locales et démonstratives. Le bouton d’impression ne produit aucun export réglementaire. Les contrôles visuels ne couvrent pas la matrice exhaustive de toutes les vues, états, scénarios, thèmes et niveaux de zoom.

Le résultat est borné à la référence Git initiale et aux modifications non committées listées. Aucun commit, push, déploiement ou publication n’a été effectué.

## 28. Risques résiduels

| Risque | Impact | Maîtrise actuelle | État |
|---|---|---|---|
| Ordre de focus ou piège clavier non détecté | bloque l’usage sans souris | contrôles natifs et focus visible, mais preuve incomplète | `NOT_TESTED` |
| Coupure ou omission dans un PDF réel | rapport incomplet à l’impression | CSS ciblé et structure contrôlée | `NOT_TESTED` |
| Restitution lecteur d’écran ambiguë | compréhension dégradée | structure accessible inspectée | `NOT_TESTED` |
| Régression externe masquée | faux signal de suite verte | trois gardes conservées | `BLOCKED_EXTERNAL` |
| Confusion démonstrateur/produit complet | surpromesse | limites permanentes et statut de fixture | `PASS_WITH_WARNING` |
| Projection interprétée comme validation scientifique | mésusage | mentions PD-011 et non-protocole répétées | `PASS_WITH_WARNING` |

## 29. Décision d’autoriser ou non P-WEB-04

P-WEB-04 **n’est pas autorisée**. Les critères 1 à 8 et 10, 12 à 17 sont satisfaits ou correctement isolés. Le critère 9, parcours clavier, et le volet imprimable du critère 11 ne possèdent pas la preuve manuelle obligatoire.

La réouverture du gate nécessite au minimum :

1. exécuter et archiver le parcours complet sans souris, y compris menu mobile, fondations, contradiction, rapport provisoire, décision et retour de focus ;
2. produire un PDF réel depuis le rapport nominal et un rapport provisoire, puis inspecter pagination, Headers, avertissements, tableaux et absence de contrôles inutiles ;
3. rejouer les 48 tests ciblés, typecheck, lint, build, audit SEO, suite globale et `git diff --check` sur le même état ;
4. conserver les trois éventuels échecs Editorial Engine comme `BLOCKED_EXTERNAL` tant que le dépôt n’est pas remis à un état propre.

## 30. Tableau final des contrats

| Contract | Préservé ? | Test-preuve | Remarque |
|---|---|---|---|
| PWEB02-01 — Entrée par l’intention | `PASS` | PWEB02-01 ; PWEB03-01 ; navigateur | aucun Program/RB au premier écran |
| PWEB02-02 — Trois scénarios officiels | `PASS` | PWEB02-02 ; PWEB03-08 | RB-003, RB-004, RB-005 exactement |
| PWEB02-03 — Démonstrateur déterministe | `PASS` | PWEB02-03 ; inspection réseau/source | aucun appel distant |
| PWEB02-04 — Décision humaine | `PASS` | PWEB02-04 ; PWEB03-05 | quatre branches, auteur, portée, justification |
| PWEB02-05 — Blocages visibles | `PASS` | PWEB02-05 ; PWEB03-04 | bloqueurs critiques et rapport provisoire |
| PWEB02-06 — Progressive disclosure | `PASS_WITH_WARNING` | PWEB02-06 ; navigateur | focus retour complet à prouver |
| PWEB02-07 — Programs secondaires | `PASS` | PWEB02-07 ; PWEB03-01 | fondations en vue secondaire |
| PWEB02-08 — Aucun claim PD-011 | `PASS` | PWEB02-08 ; recherche de copie | avertissement présent dans les rapports |
| PWEB02-09 — Aucun protocole clinique | `PASS` | PWEB02-09 | aucune acquisition ou recommandation |
| PWEB02-10 — Provenance | `PASS` | PWEB02-10/16 ; PWEB03-08 | identités, versions, date, localisateurs |
| PWEB02-11 — Responsive essentiel | `PASS_WITH_WARNING` | PWEB02-11 ; six viewports | zoom 400 % non testé |
| PWEB02-12 — Accessibilité | `NOT_TESTED` | PWEB02-12 structurel ; plan §§17, 23–24 | parcours clavier/lecteur d’écran incomplets |
| PWEB02-13 — SEO séparé | `PASS` | PWEB02-13 ; PWEB03-10/11 ; audit SEO | public indexable, démo noindex |
| PWEB02-14 — Réinitialisation | `PASS` | PWEB02-14 ; navigateur | confirmation et état propre |
| PWEB02-15 — Non-régression du site | `BLOCKED_EXTERNAL` | 539/542 | trois gardes Editorial Engine |
| PWEB02-16 — Frontières scientifiques | `PASS` | PWEB02-16 ; PWEB03-02/03/08 | projection seulement, refus hors corpus |
| PWEB02-17 — Frontière Editorial Engine | `BLOCKED_EXTERNAL` | statuts Git séparés | aucun import/écriture, dépôt externe sale |
| PWEB02-18 — P0 et Fabry préservés | `PASS` | 13/13 P0 | candidat non importé, non routé, non activé |
| P-WEB-01 AC-01 — entrée intention-first | `PASS` | PWEB03-01 | corrigé |
| P-WEB-01 AC-02 — trois scénarios | `PASS` | PWEB03-08 | versions exactes |
| P-WEB-01 AC-03 — sept étapes | `PASS` | PWEB02-05 ; navigateur | progression bornée |
| P-WEB-01 AC-05 — limites visibles | `PASS` | PWEB03-04/05 | conservées dans la revue et le rapport |
| P-WEB-01 AC-08 — décision humaine | `PASS` | PWEB03-05 | aucune option optimale automatique |
| P-WEB-01 AC-11 — contradiction | `PASS` | PWEB03-03 | deux positions sourcées |
| P-WEB-01 AC-13 — non-évaluabilité | `PASS` | PWEB03-02/04 | deux rapports provisoires honnêtes |
| P-WEB-01 AC-15 — modification amont | `PASS` | PWEB03-06 | invalidation et résumé d’impact |
| P-WEB-01 AC-20 — reprise | `PASS_WITH_WARNING` | schéma v2 et sanitation | reprise multi-version étendue non testée |
| P-WEB-01 AC-22 — mobile | `PASS_WITH_WARNING` | six viewports ; PWEB03-09 | orientation paysage/400 % non testés |
| P-WEB-01 AC-23 — clavier | `NOT_TESTED` | plan §23 | bloque la sortie P-WEB-04 |
| P-WEB-01 AC-24 — focus | `NOT_TESTED` | focus visible seulement | restitution complète à archiver |
| P-WEB-01 AC-25 — impression | `NOT_TESTED` | CSS + PWEB03-09 | PDF réel absent |
| P-WEB-01 AC-26 — noindex démo | `PASS` | PWEB03-11 | canonical séparé |
| P-WEB-01 AC-28 — page publique | `PASS` | PWEB03-10/11 ; navigateur | valeur et limites explicites |
| P-WEB-01 AC-31 — absence de réseau/LLM | `PASS` | inspection source et réseau | local déterministe |
| P-WEB-01 AC-33 — aucun PASS scientifique | `PASS` | recherche de copie | PD-011 reste seul compétent |
| P-WEB-01 AC-35 — non-régression | `BLOCKED_EXTERNAL` | suite globale | échecs externes isolés |
| P-WEB-01 AC-37 — rapport reconstructible | `PASS_WITH_WARNING` | PWEB03-05/06 | impression réelle à prouver |
| P-WEB-01 AC-38 — frontières documentaires | `PASS` | diff et index | aucun niveau 0, 1 ou 2 modifié |

**Décision finale unique : `NOT_READY_FOR_P_WEB_04`.**
