# IMG-001 — NOXIA Imaging Study Designer V1

Date d’arrêt : 9 août 2026

Nature : rapport d’implémentation et de validation, non normatif

Niveau documentaire : `NIVEAU_3`

Périmètre : `DESIGN_STUDY`, raccord ST-001/Knowledge et handoff borné vers Project Construction

Autorité scientifique revendiquée : aucune

PASS PD-011 revendiqué : aucun

Commit, push, déploiement : aucun

## 1. Décision

La première version fonctionnelle de l’Imaging Research Strategy Engine est implémentée dans le démonstrateur Protocol Designer. Elle consomme une Question, des Objectifs et des Hypothèses confirmés, puis construit une projection déterministe et traçable de la chaîne `Phénomène → Biomarqueur → Modalité → Acquisition → QA → Analyse d’image → Variable → Endpoint Contribution`.

La décision est assortie de limites non bloquantes : la validation navigateur a utilisé le repli linguistique local parce que le provider distant était indisponible ; les six largeurs responsive imposées n’ont pas pu être émulées par l’outil navigateur et restent donc `NOT_TESTED` en preuve visuelle ; la compatibilité matérielle exacte reste inconnue sans connaissance exécutable ; LEVEL 3 reste volontairement bloqué ; PRJ-001 n’est pas implémenté ; la suite globale conserve trois échecs causés exclusivement par l’état sale préexistant du dépôt Editorial Engine externe.

Aucun critère bloquant IMG-001 n’a été observé dans l’implémentation ou les tests ciblés. Cette décision ne vaut ni validation scientifique, ni validation clinique, ni protocole, ni publication, ni autorisation réglementaire, ni PASS PD-011.

## 2. Autorités consultées

La mission a été qualifiée comme une implémentation produit de niveau 3 des architectures déjà admises RDE-001, RDE-002 et RDE-003. Elle ne crée ni architecture normative, ni ontologie, ni corpus, ni moteur parallèle.

Ordre de consultation respecté : SOURCE-OF-TRUTH-INDEX intégral ; Charte fondatrice ; Scientific Product Manifesto ; Product Specification ; PD-003 ; PD-004 ; Manuel UX officiel ; PD-005 ; PD-007 ; PD-009 ; PD-011 ; PD-012 ; PD-013 ; Scientific Territory Model ; Scientific Knowledge Catalog ; Scientific Assertion Layer ; Scientific Knowledge Graph ; RDE-001 ; RDE-002 ; RDE-003 ; KE-001 ; rapports ENG-001, ENG-002 et ENG-003 ; rapport ST-001 ; RB-003 ; RB-004 ; RB-005 ; corpus structurés internes applicables. Le manifeste de l’Editorial Engine a été consulté uniquement en lecture pour contrôler la frontière documentaire.

Séparation appliquée :

- principes établis : Charte fondatrice et Scientific Product Manifesto ;
- objets métier canoniques et références normatives : Product Specification, PD-003/004/005/007/009/011/012/013, RDE-001/002/003 et KE-001 ;
- connaissances scientifiques : providers, assertions, relations, documents et gaps exposés par le Knowledge Engine ;
- contributions Imaging : projections runtime, candidats, comparaisons, contraintes, QA, Variables et Endpoint Contributions ;
- décisions humaines : revues, portes, changement majeur et gel du handoff ;
- état implémenté : modules runtime V1, session persistée, interface `DESIGN_STUDY`, tests et rapport présents dans ce diff ;
- cible future : connaissance exécutable LEVEL 3, Project Construction, Biostatistics, Safety, Economics et extension des providers ;
- limites et hypothèses : toute compatibilité, unité, temporalité, reproductibilité ou applicabilité non prouvée reste `UNKNOWN`, `PARTIALLY_SUPPORTED` ou bloquée.

Aucune contradiction n’a été résolue silencieusement. L’index de routage, antérieur à IMG-001, ne démontre pas ce moteur ; le présent rapport documente l’état local implémenté sans réécrire l’index. RB-003/004/005 sont des sources documentaires et non des connaissances exécutables. Une admission documentaire n’est ni un PASS scientifique, ni une activation produit. La modalité décrite par l’utilisateur reste un contexte ou une préférence tant que la chaîne Phénomène/Biomarqueur ne la justifie pas.

Contrôle d’intégrité final : les empreintes du SOURCE-OF-TRUTH-INDEX, de PD-003/004/005/007/009/011/012/013, de RDE-001/002/003, de KE-001, du Scientific Territory Model, du Scientific Knowledge Catalog, du Scientific Assertion Layer, du Scientific Knowledge Graph et des DOCX maîtres RB-003/004/005 sont identiques à la baseline. L’index demeure à `19dd00e4cb0c1c96438f86d259fa93e4477abe80bf08a26b86075a376f65d337`.

## 3. Baseline Git

- dépôt : `/Users/charles/Documents/Projets/NOXIA/noxia-dev` ;
- branche initiale et finale : `main` ;
- HEAD initial et final : `2e6341f66d9f63b38d536d78a6cdc30cd7408334` ;
- `origin/main` au contrôle initial et final : même révision ;
- état initial : propre, aucun fichier modifié ou non suivi ;
- tâche concurrente sur les surfaces IMG-001/ST-001/Knowledge : aucune détectée ;
- baseline ciblée : typecheck réussi, ST 30/30, Knowledge 87/87, Protocol Designer 148/148 ;
- dépôt externe `/Users/charles/Documents/Projets/editorial-engine` : HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, déjà sale avant IMG-001, conservé en lecture seule ;
- aucun nettoyage, commit, push ou déploiement.

## 4. Préconditions ST-001

Le rapport ST-001 conclut `SCIENTIFIC_THINKING_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`. Ses limitations déclarées ne remettent pas en cause la Question confirmée, les Objectifs, les Hypothèses, les mécanismes candidats, les décisions humaines, le handoff autorisé, la conservation du contexte ou le déterminisme structuré.

IMG-001 consomme uniquement un handoff ST marqué `AUTHORIZED`, ou une projection directe explicitement validée lorsqu’un contexte `DESIGN_STUDY` préexiste. En l’absence de chaîne amont défendable, le résultat est `RETURN_TO_SCIENTIFIC_THINKING`. Aucune Question, aucun Objectif et aucune Hypothèse ne sont reformulés silencieusement.

## 5. Architecture réellement implémentée

La chaîne locale est :

`ValidatedScientificIntent + ST handoff + KnowledgeResult + contraintes déclarées → ImagingDesignInput → moteur déterministe → ImagingDesignResult + Decision Graph runtime → session humaine → handoff PRJ borné`.

Les responsabilités sont séparées :

- `input.ts` projette les objets amont sans les posséder ;
- `engine.ts` construit candidats, comparaisons, contraintes, QA et contributions ;
- `graph.ts` construit la projection décisionnelle et détecte les chaînes cassées ;
- `change.ts` classe et propage les impacts RDE ;
- `session.ts` porte réponses, revues, décisions, changements et historique ;
- `ImagingStudyDesignerView.tsx` expose huit étapes avec divulgation progressive ;
- les schémas et contrats versionnés sont centralisés dans `types.ts`.

Aucune nouvelle ontologie, connaissance scientifique, taxonomie persistante ou architecture RDE n’est créée.

## 6. Input

`ImagingDesignInput` version 1.0 accepte au minimum l’identité de projection, la version de stratégie, la Question confirmée, les Objectifs, les Hypothèses, les mécanismes, l’objet central, pathologie/condition, population, contexte temporel, contraintes, équipements déclarés, KnowledgeResult projeté, décisions, incertitudes, contradictions, provenance et trace.

Les objets ST/PD-003 sont référencés par identifiants et valeurs projetées ; aucune mutation canonique n’est exposée. L’origine du handoff, son état d’autorisation et sa frontière sont explicites. Les équipements proviennent uniquement des champs validés ou déclarés.

## 7. Output

`ImagingDesignResult` est un objet structuré validé par schéma. Il contient Question, Objectifs, Hypothèses, phénomènes, biomarqueurs et comparaisons, modalités et comparaisons, acquisitions, équipements, timing, harmonisation, QA, analyse d’image, Variables, Endpoint Contributions, non-évaluabilité, Core Lab, alternatives, compromis, dépendances, gaps, contradictions, limites, risques, décisions, actions suivantes, provenance, trace, graphe et handoff PRJ.

Le texte utilisateur n’est jamais l’unique résultat. Un digest logique stable identifie l’entrée et le résultat. La projection annonce explicitement qu’elle ne possède pas la science canonique.

## 8. Decision Graph

Le graphe runtime représente `QUESTION`, `OBJECTIVE`, `HYPOTHESIS`, `PHENOMENON`, `BIOMARKER`, `MODALITY`, `ACQUISITION`, `MEASUREMENT_CONDITION`, `QUALITY_CONTROL`, `IMAGE_ANALYSIS`, `VARIABLE` et `ENDPOINT_CONTRIBUTION`, avec relations dérivées des objets effectivement produits.

Onze classes de rupture sont contrôlées : phénomène sans amont ; biomarqueur sans phénomène ; modalité sans biomarqueur ; acquisition sans besoin ; QA critique absente ; analyse sans Variable ; Variable sans source ; contribution alimentée par Variable non évaluée ; dépendance constructeur inconnue ; timing critique injustifié ; stratégie multicentrique non harmonisable ; acquisition sans conséquence de retrait. Une rupture est visible et ne force jamais une branche aval.

Le navigateur a affiché un graphe de 15 nœuds et 21 relations pour le cas ECV/T1, ainsi qu’une dépendance équipement inconnue.

## 9. Phenomena

Les phénomènes sont dérivés des Objectifs, Hypothèses, mécanismes et concepts gouvernés avant tout biomarqueur. Ils conservent priorité, observabilité, contexte, support Knowledge, limites, facteurs de confusion et inconnues.

La fibrose myocardique est affichée comme phénomène indirectement observable. Le no-reflow reste spécifique au contexte reperfusion/stenting ; sans biomarqueur exact défendable, aucune modalité n’est forcée. Les revues humaines `RETAINED`, `REJECTED` et `PENDING` restent distinctes.

## 10. Biomarkers

Un biomarqueur n’est créé que si un construit ou une assertion gouvernée le soutient et le relie au phénomène. Le résultat conserve phénomène, Objectifs, type de mesure, domaine de validité, dépendances, sensibilités, limites, confounders, preuves, applicabilité et gaps.

ECV et T1 natif sont conservés dans le cas cardiaque couvert. `T1 mapping` imposé comme méthode reste une préférence et n’est pas promu automatiquement comme biomarqueur. Aucun label MOLLI/SASHA ou autre séquence n’est créé par le moteur.

## 11. Biomarker Comparator

Lorsque plusieurs candidats sont défendables, le comparateur construit une matrice sans classement automatique. Chaque dimension vaut uniquement `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNKNOWN`, `NOT_APPLICABLE` ou `CONFLICTING`.

La preuve navigateur a montré ECV et T1 natif comme candidats comparés, avec la mention d’absence de classement. Une dimension absente du corpus n’est jamais complétée par connaissance générale du LLM.

## 12. Modalities

Une modalité n’apparaît qu’après un besoin de biomarqueur. Les identifiants gouvernés sont présentés par des libellés lisibles sans duplication technique. IRM et CT peuvent rester deux branches lorsque la Question les compare. Une modalité disponible mais dépourvue de biomarqueur défendable n’est pas sélectionnée.

Le correctif issu de la validation navigateur supprime la double présentation `IRM` / identifiant interne et dispose d’un test de non-régression.

## 13. Modality Comparator

Les modalités sont comparées relativement au même phénomène et au même biomarqueur. Seules les dimensions soutenues ou inconnues sont émises. Aucun coût, niveau de sécurité, irradiation, accessibilité ou optimum n’est inventé.

Le cas automatisé IRM versus CT conserve les deux branches et le statut `NO_AUTOMATIC_RANKING`. Une branche insuffisamment documentée reste visible ; elle ne retombe pas silencieusement sur RB-004.

## 14. Acquisition Strategy

Chaque stratégie conserve rôle, nécessité, conséquences si retirée, dépendances, conditions, QA et justification :

- LEVEL 1 : `CONCEPTUAL_STRATEGY` ;
- LEVEL 2 : `METHODOLOGICAL_ACQUISITION_PLAN` ;
- LEVEL 3 : `NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE`.

Le navigateur montre explicitement le blocage LEVEL 3. Aucun TR, TE, TI, flip angle, dose, débit, volume, résolution, kernel, kVp, mAs, nombre exact de phases ou paramètre constructeur n’est produit.

## 15. Equipment

L’évaluation utilise exclusivement les équipements déclarés et conserve disponibilité, modalité, constructeur, modèle, champ, logiciel, options, période et provenance lorsqu’ils existent. Un champ absent reste inconnu.

Sans preuve exécutable exacte, la compatibilité vaut `UNKNOWN_COMPATIBILITY` et `assumptionForbidden` reste vrai. Un équipement `KNOWN_UNAVAILABLE` ou de modalité incompatible produit `INCOMPATIBLE`, des gaps et une alternative non faisable ; aucune technique absente n’est simulée.

## 16. Multicenter

Les modes runtime distinguent `MONOCENTRIC`, `MULTICENTRIC_HOMOGENEOUS`, `MULTICENTRIC_HETEROGENEOUS`, hétérogénéité multicentrique inconnue et `UNKNOWN`, sans concurrencer le modèle canonique.

La réponse utilisateur « Multicentrique » produit désormais `MULTICENTRIC_HETEROGENEITY_UNKNOWN` : le moteur ne déduit pas une homogénéité ou une hétérogénéité non déclarée. Le cas automatisé 1,5 T/3 T avec constructeurs différents produit `MULTICENTRIC_HETEROGENEOUS` et ouvre la porte humaine multicentrique.

## 17. Harmonization

La stratégie candidate distingue noyau commun, variantes acceptables, variantes à qualifier, incompatibilités, inconnues, étude de pont, stratification analytique future et QA supplémentaire.

En navigateur, la déclaration multicentrique a affiché comme noyau commun la définition de mesure, la nomenclature, la traçabilité des versions et les règles de complétude/validité. Champ, constructeur, modèle, logiciel et reconstruction restent à qualifier par site. Aucune homogénéisation artificielle n’est revendiquée.

## 18. Timing

Le timing conserve les catégories biologique, méthodologique, opérationnelle, imposée ou inconnue lorsque justifiées. Une temporalité amont déclarée est conservée comme `IMPOSED_TIMING` avec support inconnu jusqu’à qualification.

La réponse « Évolution » crée seulement `METHODOLOGICAL_TIMING` avec la valeur « Évolution déclarée ; moments exacts à justifier ». Aucune date ni visite n’est inventée. Sans temporalité, `UNKNOWN_TIMING` et la chaîne cassée associée restent visibles.

## 19. QA

La QA est construite avant l’acquisition et avant l’analyse. La V1 émet des contrôles d’acquisition, de complétude et de mesure avec objet, timing, méthode, concept d’acceptation, acteur à désigner, conséquence d’échec et provenance.

Le navigateur montre les conséquences explicites : acquisition non autorisée ou déviation ; état manquant/incomplet ; invalidité technique ou analyse avec limitations. Aucun seuil numérique n’est inventé.

## 20. Non-evaluability

La non-évaluabilité reste une projection runtime, pas un objet métier canonique autonome. Elle relie cause, étape, prévisibilité, récupérabilité, répétition, Variables, Contributions, QA, action et décision humaine.

Les états `MISSING`, `NOT_ACQUIRED`, `INCOMPLETE`, `TECHNICALLY_INVALID`, `QA_REJECTED`, `ANALYZABLE_WITH_LIMITATIONS` et `BIOLOGICALLY_NEGATIVE` sont distincts. Le navigateur affiche explicitement qu’une cause d’absence doit être documentée sans assimilation à une valeur normale, tandis qu’un résultat biologiquement négatif suppose un observable acquis et techniquement évaluable.

## 21. Image Analysis Strategy

La stratégie décrit les besoins de lecture ou mesure, la traçabilité des dérivations, les répétitions et discordances, ainsi que les outputs attendus. Elle porte la frontière `NO_IMAGE_PROCESSING_NO_STATISTICAL_ANALYSIS`.

IMG-001 n’exécute ni segmentation, ni recalage, ni reconstruction, ni analyse d’image. Il ne choisit aucun test statistique, modèle ou SAP.

## 22. Variables

Chaque Variable candidate référence Question, Objectifs, Hypothèses, phénomène, biomarqueur, acquisition, QA, analyse, timing, règle de non-évaluabilité, provenance et limites. L’unité reste « non gouvernée » lorsqu’elle n’est pas prouvée.

Les tests détectent les Variables orphelines. Dans le cas cardiaque, ECV et T1 natif produisent des Variables candidates reliées à trois règles QA et portent explicitement l’analyse statistique encore requise.

## 23. Endpoint Contributions

IMG-001 émet des Contributions d’imagerie vers les Critères sans créer ni modifier directement un Endpoint canonique. Le rôle reste `UNDECIDED_CANDIDATE`, avec temps, méthode, QA, non-évaluabilité, dépendances, limites, décision humaine et analyse statistique aval.

La décision principal/secondaire/exploratoire reste portée par Research Design, Biostatistics et l’humain.

## 24. Core Lab

Le Core Lab est une évaluation humaine obligatoire, jamais une recommandation automatique. Les options conservées sont `NO_CORE_LAB`, `LOCAL_READING_WITH_STANDARDIZATION`, `CENTRAL_QA`, `CENTRAL_READING` et `HYBRID`.

Le navigateur a montré toutes les options avec `NO_AUTOMATIC_OPTIMUM`. Les facteurs et inconnues restent liés au nombre/hétérogénéité des centres, à l’harmonisation, à la lecture, à la reproductibilité, au volume et aux contraintes non encore fournies.

## 25. Alternatives

Le générateur conserve des branches défendables, notamment par modalité, compatibilité ou non-faisabilité. Chaque alternative expose ce qu’elle préserve, modifie, perd, ses risques, inconnues et décisions à rouvrir.

La stratégie cardiaque a conservé la branche IRM sans la déclarer optimale. Le cas IRM/CT automatisé conserve au moins deux alternatives. Une incompatibilité matérielle ajoute une branche `NON-FEASIBLE` plutôt que de simuler la technique.

## 26. Knowledge integration

Le consumer `IMAGING_STUDY_DESIGNER` a été ajouté au contrat Knowledge existant. L’adapter utilise le `KnowledgeResult` déjà produit ; aucune recherche scientifique parallèle n’est exécutée.

La sémantique reste `EXACT_FIRST_NO_IMPLICIT_FALLBACK`. Concepts, assertions, relations, documents, provenance, gaps et frontières sont projetés. Une couverture générale ne devient pas preuve exacte, un document candidat externe ne devient pas règle Imaging et RB-004 n’est jamais un fallback implicite.

## 27. ST integration

Le contexte utilisateur et le handoff ST sont intégrés dans la session Protocol Designer version 6.0. Le stockage local versionné archive le résultat Imaging lorsqu’un changement amont l’invalide.

Le parcours navigateur a démontré : entrée directe dans `DESIGN_STUDY` sans ST → `RETURN_TO_SCIENTIFIC_THINKING` ; retour vers ST avec contexte conservé ; Question, Hypothèses et Objectif adoptés humainement ; handoff autorisé ; retour ultérieur à ST disponible. IMG-001 ne réécrit ni la Question ni l’amont.

## 28. Impacts

Les événements RDE-002 requis sont supportés par la couche de changement : biomarqueur, modalité, acquisition, équipement, champ, logiciel, timing, QA, Core Lab, analyse d’image et Endpoint Imaging.

Un changement majeur produit d’abord `PENDING_CONFIRMATION` puis des impacts `REVIEW_REQUIRED` vers acquisition, QA, analyse, Variables et Endpoint Contributions. Le rejet passe ces impacts à `PRESERVED`. Les états `INVALIDATED`, `OBSOLETE`, `NEWLY_REQUIRED` et `UNAFFECTED_DEMONSTRATED` restent disponibles dans le contrat sans créer de taxonomie persistante concurrente.

## 29. Human decisions

Les revues et portes humaines couvrent phénomène, biomarqueur structurant, modalités non dominées, acquisition, variabilité multicentrique, Core Lab et gel du handoff. Une raison non vide et un DecisionRecord sont requis pour approuver ou refuser une porte.

Le navigateur a affiché la prochaine décision, le nombre de portes en attente et la mention que NOXIA prépare sans décider. La modification du biomarqueur a montré toutes les surfaces affectées avant les boutons de confirmation ou préservation.

## 30. Project Construction handoff

Le handoff PRJ contient les sections scientifiques et Imaging requises : Question, Objectifs, Hypothèses, phénomènes, biomarqueurs, modalités, acquisitions, timing, matériel, harmonisation, QA, analyse, Variables, Contributions, Core Lab, non-évaluabilité, risques, limites, gaps, alternatives, décisions, provenance et version.

Il exclut explicitement dimensionnement statistique, budget complet, CRF final, plan réglementaire, plan opérationnel complet et protocole final. Le navigateur affiche `NOT_READY` et désactive « Passer à Project Construction » tant que les chaînes et portes ne sont pas résolues. PRJ-001 reste futur.

## 31. UX

Le parcours principal modifié est `DESIGN_STUDY`. `UNDERSTAND` et `FORMALIZE_IDEA` restent fonctionnels. La Question confirmée et l’objet central sont visibles avant toute option technique.

Huit étapes structurent la progression : Phénomènes, Biomarqueurs, Modalités, Acquisitions, Faisabilité technique, QA, Analyse, Stratégie Imaging. Cette progression n’est pas présentée comme une machine d’état scientifique. Les questions adaptatives expliquent leur impact, acceptent réponses suggérées et « je ne sais pas », et ne demandent que les dimensions susceptibles de modifier la stratégie.

La divulgation progressive masque initialement identifiants, providers, traces et graphe. Le niveau 3 expose ensuite chaînes cassées, provenance, sémantique, taille du graphe et historique. Knowledge Explorer s’ouvre comme service transversal et revient à l’étape 8/8 avec le contexte intact.

## 32. Browser validation

Validation réelle effectuée sur `http://127.0.0.1:5174/protocol-designer/demo`, fenêtre 1280 × 720, sans erreur JavaScript console. Le provider linguistique distant était indisponible ; le repli local visible a été utilisé. Les avertissements console étaient limités aux deux future flags React Router et aux messages de développement Vite/Analytics.

| Scénario | Preuve navigateur | Résultat |
|---|---|---|
| 1. Stratégie simple | parcours complet fibrose myocardique/ECV | PASS |
| 2. Plusieurs biomarqueurs | ECV et T1 natif, comparaison sans classement | PASS |
| 3. Comparaison multimodale | pas de parcours navigateur complet IRM/CT ; cas automatisé dédié | `NOT_TESTED` navigateur, PASS automatisé |
| 4. Équipement inconnu | équipement non déclaré, quatre gaps, compatibilité inconnue | PASS |
| 5. Équipement incompatible | aucune saisie UI permettant de déclarer `KNOWN_UNAVAILABLE` ; cas automatisé dédié | `NOT_TESTED` navigateur, PASS automatisé |
| 6. Multicentrique | réponse « Multicentrique », hétérogénéité inconnue et harmonisation | PASS |
| 7. Alternative strategy | branche IRM et aucun optimum | PASS |
| 8. Core Lab | cinq options, aucun optimum automatique | PASS |
| 9. QA | trois surfaces et conséquences d’échec | PASS |
| 10. Knowledge gap | provenance exact-first, gap matériel et chaîne cassée visibles | PASS partiel |
| 11. Modification majeure | impacts acquisition/QA/analyse/Variables avant confirmation | PASS |
| 12. Retour ST-001 | retour et conservation du contexte | PASS |
| 13. Passage PRJ-001 futur | handoff `NOT_READY`, bouton désactivé, exclusions visibles | PASS |
| 14. Patient-level refusé | T2 individuel : aucune interprétation, aucun design, DESIGN désactivé | PASS |
| 15. Reset | dialogue de confirmation puis nouvelle session | PASS |

Contrôles transversaux observés : compréhension immédiate, progression 1/8 à 8/8, réponses rapides, « je ne sais pas », décisions, comparateurs, limites, preuves, blocage LEVEL 3 et retour Knowledge Explorer. La saisie libre a été utilisée pour la Question initiale. Le reset et la reprise de session après rechargement à chaud ont été vérifiés.

La validation navigateur a entraîné deux corrections réelles : déduplication du libellé modalité IRM ; propagation des réponses multicentrique et évolution dans l’harmonisation, le timing et les portes humaines. Les deux corrections sont couvertes par tests.

## 33. Responsive/accessibility

L’outil navigateur disponible n’expose pas de redimensionnement de viewport. Les largeurs 320, 390, 768, 1024, 1440 et 1920 px restent donc `NOT_TESTED` en preuve visuelle, conformément à l’interdiction de simuler une validation. À 1280 px, `scrollWidth` égale `innerWidth` (1280), sans débordement horizontal observé.

Les contrats UI existants vérifient les grilles responsive et les tests de rendu IMG couvrent les étapes, cartes et contrôles ; ils ne remplacent pas une preuve navigateur aux six largeurs. Cette lacune est non bloquante pour le moteur, mais doit être fermée avant une qualification d’interface publique sans réserve.

Accessibilité vérifiée par structure et interaction : navigation par boutons natifs, labels, régions, dialogues, disclosures, états `pressed`, actions essentielles accessibles sans geste pointeur propriétaire, focus clavier natif visible (`outline: auto`) sur le bouton de reset. L’activation clavier intégrale et le retour de focus après tous les dialogues ne sont pas démontrés de bout en bout dans cette passe et restent partiellement `NOT_TESTED`. Les tests P-WEB de non-régression clavier/accessibilité restent verts.

## 34. Tests

Validations finales :

- IMG-001 : 52/52, 8 fichiers ;
- ST-001 : 30/30 ;
- Knowledge : 87/87 ;
- Protocol Designer : 148/148 ;
- ensemble ciblé ST + Knowledge + Protocol : 265/265 ;
- privacy/routes/serveur P-WEB : 28/28 inclus dans les 148 ;
- typecheck : PASS ;
- lint : PASS avec 0 erreur et 7 avertissements historiques `react-refresh/only-export-components` hors surfaces IMG ;
- build production : PASS, 1 887 modules ;
- audit SEO : 40 pages, 0 erreur, 0 avertissement ; son rapport horodaté a été restauré à l’identique pour ne pas créer de diff hors périmètre ;
- `git diff --check` : PASS ;
- suite globale : 813/816, 45 fichiers de tests réussis sur 48.

Les trois échecs globaux sont exclusivement : P3M-Web « editorial-engine clean », P4 « editorial-engine unchanged » et P5 « editorial-engine unchanged ». Ils reproduisent l’état sale externe déjà relevé à la baseline. Aucun test IMG, ST, Knowledge ou Protocol Designer n’échoue.

Les 52 tests IMG couvrent contrats Input/Output, mapping des phénomènes, biomarqueurs, comparateurs, modalités, acquisitions, équipement, harmonisation, timing, QA, non-évaluabilité, analyse d’image, Variables, Contributions, Core Lab, alternatives, graphe, impacts, Knowledge/ST/PRJ handoffs, décisions humaines, changement majeur, refus, trace, déterminisme, UI et les dix cas obligatoires.

## 35. Performance

Le KnowledgeResult est construit avec des entrées stables et une date de création stable afin d’éviter les recalculs dus au rendu. Le moteur Imaging est déterministe et ne dépend d’aucun provider LLM. Les rebuilds de session surviennent seulement après réponse, revue, décision ou changement.

Le build signale un chunk `ProtocolDesignerDemo` de 606,85 kB minifié, au-dessus du seuil d’avertissement de 500 kB. La base Browserslist est âgée de 14 mois et Rollup retire deux annotations PURE mal placées d’une dépendance. Aucun de ces avertissements ne bloque le build, mais le découpage du démonstrateur reste une amélioration pertinente.

## 36. Limitations

- provider linguistique distant indisponible pendant la validation navigateur ; repli local utilisé ;
- largeurs 320/390/768/1024/1440/1920 `NOT_TESTED` visuellement ;
- comparaison multimodale et équipement incompatible validés automatiquement, pas par parcours navigateur complet ;
- équipement exact, version, options et compatibilité restent inconnus sans preuve exécutable ;
- timing exact non généré ; seules finalité et catégorie méthodologiques sont représentées ;
- couverture scientifique limitée aux objets réellement servis par Knowledge ;
- reproductibilité, unités, seuils et applicabilité restent inconnus lorsque non gouvernés ;
- LEVEL 3 volontairement bloqué ;
- Project Construction et Biostatistics futurs ;
- identité applicative du décideur humain non implémentée ; persistance locale seulement ;
- focus/activation clavier non rejoués intégralement sur chaque surface ;
- chunk démonstrateur supérieur à 500 kB ;
- trois échecs globaux dus au dépôt Editorial Engine externe sale avant mission.

Ces limites n’autorisent ni extrapolation scientifique, ni protocole clinique, ni recommandation patient.

## 37. Files modified

Créés :

- `src/features/imaging-study-designer/types.ts` ;
- `src/features/imaging-study-designer/input.ts` ;
- `src/features/imaging-study-designer/engine.ts` ;
- `src/features/imaging-study-designer/graph.ts` ;
- `src/features/imaging-study-designer/change.ts` ;
- `src/features/imaging-study-designer/session.ts` ;
- `src/features/imaging-study-designer/ImagingStudyDesignerView.tsx` ;
- `src/features/imaging-study-designer/index.ts` ;
- huit fichiers de tests et leur fixture sous `src/features/imaging-study-designer/__tests__/` ;
- `docs/img-001-imaging-study-designer-v1-implementation-report.md`.

Modifiés :

- `package.json` : commande `test:img` ;
- `src/features/knowledge-engine/types.ts` et `knowledge-request.ts` : consumer Imaging ;
- `src/features/protocol-designer/intake/types.ts` et `session.ts` : session version 6.0 et persistance Imaging ;
- `src/pages/ProtocolDesignerDemo.tsx` : raccord `DESIGN_STUDY` ;
- `src/features/protocol-designer/__tests__/p-web-06-v1.test.tsx` : attentes alignées sur les huit étapes Imaging.

Aucune autorité, Reasoning Book, Scientific Program, corpus, Knowledge Graph, route publique, configuration SEO, Editorial Engine, commit, push ou déploiement n’est inclus.

## 38. Contracts

| Contract | Préservé ? | Test-preuve | Limite |
|---|---|---|---|
| IMG01-C01 — Question before modality | Oui | `scientific-chain`, graphe et navigateur retour ST | Question amont dépend de ST |
| IMG01-C02 — Phenomenon before biomarker | Oui | `scientific-chain` et CAS 1 | couverture phénomènes bornée aux entrées/Knowledge |
| IMG01-C03 — Biomarker contextuality | Oui | `scientific-chain`, CAS 1 et 5 | applicabilité souvent partielle/inconnue |
| IMG01-C04 — No modality by availability alone | Oui | CAS 10 et `scientific-chain` | modalités connues architecturalement ≠ couvertes scientifiquement |
| IMG01-C05 — Specific scientific object preserved | Oui | CAS 1 et 3, navigateur fibrose/ECV | extraction linguistique locale bornée |
| IMG01-C06 — Alternative strategies preserved | Oui | `analysis-and-handoff`, CAS 2/6 | compromis limités aux dimensions gouvernées |
| IMG01-C07 — Equipment reality explicit | Oui | `technical-strategy`, CAS 4/6 | saisie détaillée UI future |
| IMG01-C08 — No compatibility assumption | Oui | `technical-strategy`, navigateur équipement inconnu | correspondance exacte impossible sans preuve exécutable |
| IMG01-C09 — Timing justified | Oui | `technical-strategy`, `graph-and-change` | dates et moments exacts non produits |
| IMG01-C10 — QA by design | Oui | `technical-strategy`, navigateur étape 6 | seuils numériques volontairement absents |
| IMG01-C11 — Multicenter variability explicit | Oui | CAS 4, `graph-and-change`, navigateur | hétérogénéité reste inconnue si non déclarée |
| IMG01-C12 — Non-evaluability explicit | Oui | `technical-strategy`, navigateur disclosure | projection runtime, non objet canonique |
| IMG01-C13 — Missing ≠ normal | Oui | `technical-strategy`, navigateur sept états | aucune imputation statistique |
| IMG01-C14 — Image analysis ≠ statistical analysis | Oui | `analysis-and-handoff`, navigateur étape 7 | Biostatistics futur |
| IMG01-C15 — Human decision required | Oui | `analysis-and-handoff`, session et navigateur | identité humaine applicative future |
| IMG01-C16 — No executable protocol without executable knowledge | Oui | `contracts`, CAS 1/6/7, navigateur LEVEL 3 | LEVEL 3 toujours bloqué en V1 |
| IMG01-C17 — No closest-corpus fallback | Oui | CAS 2, intégration Knowledge, navigateur provenance | source externe candidate non promue |
| IMG01-C18 — No patient-level interpretation | Oui | CAS 8 et navigateur T2 individuel | explication générale seulement |
| IMG01-C19 — Cross-engine impacts explicit | Oui | `graph-and-change`, UI et session persistée | moteurs aval futurs |
| IMG01-C20 — Projection does not own science | Oui | `contracts` et `projectionNotice` | l’index n’est pas mis à jour par IMG-001 |
| IMG01-C21 — Biomarker change propagates | Oui | CAS 9, `graph-and-change`, navigateur | confirmation n’applique pas une nouvelle science |
| IMG01-C22 — Same context → same structured strategy | Oui | `integration` déterminisme et digests | narration future peut varier |
| IMG01-C23 — LLM provider independence | Oui | `integration` et moteur sans appel provider | interprétation libre amont peut varier avant validation humaine |
| IMG01-C24 — Clean handoff to Project Construction | Oui | `analysis-and-handoff`, navigateur étape 8 | PRJ-001 futur, handoff non gelé par défaut |

## 39. Decision of next step

La prochaine étape admise est une passe dédiée de validation responsive réelle aux six largeurs, d’accessibilité clavier intégrale et de rejeu navigateur avec provider linguistique disponible, puis une évaluation PD-011 séparée. L’implémentation de PRJ-001 ne doit consommer que des handoffs Imaging explicitement gelés. Aucun document normatif ou scientifique ne doit être modifié à partir de ce rapport seul.

`IMAGING_STUDY_DESIGNER_V1_IMPLEMENTED_WITH_LIMITATIONS`
