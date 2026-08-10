# DOC-001 — Document Projection Engine V1 Report

## 1. Résultat

**Verdict :** `DOCUMENT_PROJECTION_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`

La V1 implémente un moteur de projection documentaire déclaratif, déterministe et en lecture seule. La première définition active est Protocol. Le Research Project reste inchangé et demeure l’unique vérité structurante.

## 2. État de référence

- Dépôt : `noxia-dev`
- Commit de base observé : `984f562`
- Date de validation : 2026-08-10
- Moteur : `1.0.0`
- Aucun commit, push ou déploiement réalisé
- Aucun fichier DOCX, PDF ou ODT produit
- Aucune autorité, aucun manifeste, Reasoning Book, Scientific Program ou corpus scientifique modifié

Les deux documents de cette mission sont classés comme preuves techniques d’implémentation. Ils ne deviennent pas autoritatifs par leur seule présence. Le SOURCE-OF-TRUTH-INDEX n’est pas modifié, car la mission interdit toute modification des autorités.

## 3. Arbitrages explicites

Le prompt initial comportait simultanément un intertitre « AUCUN CODE » et une demande explicite d’implémentation, de module, de tests et de surface navigateur. L’intertitre a été interprété selon ses interdictions détaillées : aucun code d’autorité, aucune connaissance scientifique, aucun protocole exécutable, aucun moteur spécialisé simulé et aucun export bureautique. Le logiciel DOC-001 demandé a été implémenté.

Un correctif ultérieur a interdit tout protocole codé comme une liste fixe de sections. Le premier brouillon interne comportait une extraction branchée par identifiant de section ; cette approche a été supprimée avant livraison. L’état livré est entièrement déclaratif :

- `ProjectionDefinition` ;
- `SectionDefinition` ;
- `ProjectionPlanner` ;
- `SectionPlanner` ;
- `CompositionEngine` ;
- Editorial Composition Engine ;
- Renderer.

La définition Protocol contient seize sections dans sa configuration courante, mais le moteur n’en connaît ni le nombre ni les identifiants.

## 4. Livrables

### Moteur

Le module `src/features/document-projection/` contient :

- contrats et types déclaratifs ;
- catalogue et définition Protocol ;
- Projection Planner ;
- Section Planner générique ;
- Composition Engine ;
- composition éditoriale déterministe ;
- orchestration de projection ;
- readiness ;
- versionnement ;
- historique immuable ;
- diff structurel ;
- renderer Markdown ;
- renderer HTML ;
- surface React de lecture seule ;
- tests dédiés.

### Démonstrateur

Le Protocol Designer possède un quatrième parcours `DOCUMENT`. Il devient effectif après gel et autorisation du handoff documentaire dans PRJ-001. La session navigateur passe au schéma `9.0` et à une clé de stockage versionnée `v9`.

### Documentation

- `docs/document-projection-engine-architecture.md`
- `docs/doc-001-document-projection-engine-v1-report.md`

## 5. Capacités vérifiées

| Contrat | Résultat | Preuve |
|---|---:|---|
| Research Project gelé et autorisé obligatoire | PASS | refus `SOURCE_PROJECT_NOT_FROZEN`, `DOCUMENT_HANDOFF_NOT_AUTHORIZED`, `SOURCE_PROJECT_REFUSED` |
| Source non mutée | PASS | comparaison canonique avant/après et tests dédiés |
| Première projection Protocol | PASS | `PROTOCOL_PROJECTION_DEFINITION` |
| Projections sœurs refusées sans définition | PASS | catalogue déclaré + `UNSUPPORTED_PROJECTION_TYPE` |
| Nouvelle projection sans modification moteur | PASS | test `TEST_SUMMARY` par seule `ProjectionDefinition` |
| Sections pilotées par configuration | PASS | DSL interprété par `section-planner.ts`, aucune branche par section |
| Applicabilité séparée | PASS | quatre états d’applicabilité transportés |
| Cinq statuts de section distincts | PASS | `GENERATABLE`, `PARTIALLY_GENERATABLE`, `BLOCKED`, `NOT_GENERATABLE`, `NOT_APPLICABLE` |
| Moteur spécialisé absent mais objets présents | PASS | Statistics et Data `PARTIALLY_GENERATABLE` avec exigences visibles |
| Aucune science ni valeur inventée | PASS | exigences et `NO_STATISTICAL_VALUE_INVENTED` conservés, tests négatifs |
| Inconnues/limitations/contradictions visibles | PASS | plans, instances, UI et exports |
| Décisions humaines visibles | PASS | registre de décisions et liens de section |
| Provenance visible | PASS | références par fait, section et projection |
| Rejeu déterministe | PASS | même entrée → même projection |
| Nouvelle version sans mutation de l’ancienne | PASS | version 1.1.0 + historique immuable |
| Diff structurel | PASS | statuts, applicabilité, contenu et sources comparés |
| Markdown et HTML passifs | PASS | exports testés, échappement HTML vérifié |
| Aucun DOCX/PDF/ODT | PASS | formats absents du module |
| Surface DOCUMENT sans édition directe | PASS | test navigateur dédié, aucun textbox |

## 6. Tests

### Suite DOC-001 ciblée

- 3 fichiers de tests
- 22 tests
- 22 PASS

Les cas couvrent : projet minimal, projet Imaging, absence d’Imaging, moteur Biostatistics absent, décision ouverte, inconnue, contradiction, changement de projet, rejeu déterministe, absence d’invention, projection non supportée, source non gelée, engagements éditoriaux, exports, historique, diff, cycle de vie, nouvelle définition déclarative et surface navigateur DOCUMENT.

### Suite NOXIA complète

- 905 tests exécutés
- 902 PASS
- 3 FAIL

Les trois échecs sont le même contrôle externe répété : le dépôt protégé `editorial-engine` est déjà sale. Les fichiers modifiés et non suivis de ce dépôt externe sont hors de la mission DOC-001 ; aucune modification n’y a été effectuée par cette mission. Tous les tests fonctionnels NOXIA et DOC-001 passent.

Cette dépendance externe interdit de déclarer un PASS global sans réserve.

### Contrôles complémentaires

- TypeScript : PASS ;
- build de production : PASS ;
- lint : 0 erreur, 7 avertissements Fast Refresh préexistants ;
- audit SEO : 40 pages, 0 erreur, 0 avertissement ;
- validation du pilote Editorial Engine : 12 entités, 8 projections, 8 routes, aucune projection publiable ;
- intégrité des différences : PASS ;
- contrôle visuel local du démonstrateur et du quatrième parcours : PASS.

Le build conserve trois avertissements non bloquants et non spécifiques à DOC-001 : données `caniuse-lite` anciennes, annotations `PURE` de `react-helmet-async` ignorées par Rollup et chunk principal du démonstrateur supérieur à 500 kB.

## 7. Limites restantes

- Une seule ProjectionDefinition officielle est active par défaut.
- Les moteurs spécialisés absents restent absents ; leurs objets disponibles sont projetés partiellement, sans contenu inventé.
- L’historique de projection du démonstrateur n’a pas de stockage documentaire dédié au-delà de la session montée.
- Les commentaires/corrections ne disposent pas encore d’un objet Contribution dédié dans cette V1.
- Les deux documents techniques ne sont pas admis dans l’index d’autorité pendant cette mission.
- La suite globale reste affectée par l’état sale externe de `editorial-engine`.

## 8. Conclusion de validation

Le moteur satisfait les invariants fonctionnels DOC-001 et le correctif déclaratif. Il ne mute pas le Research Project, n’invente pas de science, conserve les états sensibles, versionne les projections et rend Markdown/HTML passivement.

Le verdict reste **IMPLEMENTED_WITH_LIMITATIONS** en raison des limites V1 assumées et du contrôle global externe non vert.
