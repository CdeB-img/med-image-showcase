# Fermeture produit V1 — qualification et limites

`MISSION_STATUS = V1_DEMO_READINESS_PARTIAL`

Le corridor Standard multi-projets est qualifié localement : création, revue scientifique, adoption/refus/correction, document réel, administration, régénération, fermeture et réouverture. La bibliothèque de sources et les révisions documentaires fonctionnent dans un périmètre borné. **La V1 n'est pas déclarée complètement démontrable au sens du mandat enrichi** : une synthèse narrative scientifique complète et le choix comparatif des meilleures preuves ne sont pas établis.

Le déficit résiduel est précis : les révisions assemblent des assertions qualifiées du corpus et les décisions du Project. Elles ne constituent pas encore une rédaction scientifique générale capable de réorganiser un rationnel, traiter un enjeu de santé publique, développer une lacune de littérature propre à la population ou hiérarchiser des études. Aucun chiffre épidémiologique, bénéfice, recommandation, DOI ou source manquante n'a été inventé pour masquer cette limite. Le profil « contexte général » ne qualifie pas l'applicabilité clinique à l'étude particulière.

## Identité et preuves

- `MISSION_ID = PROTOCOL_DESIGNER_V1_PRODUCT_CLOSURE_AND_DEMO_READINESS_01`
- `BASELINE_HEAD = 86739f3d864af68c57fff8045606a19eb0cb0eea`
- `FINAL_HEAD` : enregistré après commit dans `final-state.json`, pour éviter une référence Git autoréférentielle dans ce rapport.
- Branche : `protocol-designer-canonical-ingestion`.
- `CURRENT_CAPABILITY_MAP = FINAL_PRODUCT_CAPABILITY_MAP.md` ; observation initiale conservée dans `CURRENT_PRODUCT_CAPABILITY_MAP.md`.
- Qualification consolidée : `qualification-receipt.json`.
- Preuves navigateur : `browser-evidence/browser-receipts.jsonl`, `browser-invariants-qualified.json` ; vérificateur `verify-browser-evidence.ts`.
- Dernier export réel : `demo-artifacts/protocole-export-07.html`, document C `1.1.3`, Project C v4. Les sept exports sont des téléchargements effectivement déclenchés dans le produit.

## Parcours démontrés

**A — Fibrose myocardique et diabète.** Conversation naturelle gelée avant exécution, propositions, refus, correction des âges, demande d'aide méthodologique, adoption et modification ultérieure. Project v4 ; D1 `1.0.0` historique depuis v3, D2 `1.1.0` depuis v4 avec administration partielle, D3 `1.2.0` depuis v4 et administration complète pour revue. Investigateur et promoteur copiés explicitement depuis le profil. La complétude administrative ne constitue pas une autorisation de soumission.

**B — Hémodynamique et oxygénation cérébrales.** Deux tours neuro S4 historiques réutilisés avec transport offline. Project v2 ; AVC aigu et essai thérapeutique restent négatifs, débit et consommation d'oxygène ne sont pas assimilés. D1 historique conserve l'ancienne projection incorrecte, D2 répare la présentation sans modifier le Project. Aucune donnée administrative de A n'est devenue un rôle de B.

**C — Fibrose, vérification finale.** Parcours neuf de contrôle après réparations des propriétaires ; Project v4, huit versions documentaires de `1.0.0` à `1.1.3`, 17 sources locales. Focalisation sur Miller 2013, ajout/retrait de Roujol 2014, suppression de son assertion sans autre support, maintien de son intérêt utilisateur et de son usage historique. Instruction scientifique depuis le document → revue native → confirmation → régénération conservant l'exclusion. Restauration de `1.1.0` dans `1.1.2`, puis prudence rédactionnelle dans `1.1.3`. Nouvelle fenêtre/onglet : Project, sources et huit versions conservés.

Les invariants vérifient **13 projections historiques distinctes à travers 223 observations**, huit documents sourcés, trois Projects, l'absence de modification de A/B pendant les opérations documentaires de C et une restauration des sections antérieures à contenu identique.

## Résultats obligatoires

| Indicateur | Résultat |
|---|---|
| MULTI_PROJECT | PASS |
| PERSISTENCE | PASS — locale, limitée à ce navigateur |
| PROJECT_REOPEN | PASS |
| CONVERSATION_REHYDRATION | PASS |
| SCIENTIFIC_PROJECT_INTEGRITY | PASS — invariants du parcours qualifié, sans validation scientifique humaine nouvelle |
| PROFILE | PASS — profil local |
| ORGANIZATION_DATA | PASS |
| PROJECT_ACTOR_ROLES | PASS — copie explicite |
| DOCUMENT_GENERATION | PASS |
| DOCUMENT_FAMILY_DEMONSTRATED | PROTOCOL / SHORT_PROTOCOL_DRAFT |
| DOCUMENT_REAL_GENERATION | PASS |
| DRAFT_WITH_PLACEHOLDERS | PASS |
| ADMIN_FORM | PASS |
| ADMIN_COMPLETION | PASS — ADMIN_COMPLETE_FOR_REVIEW |
| DOCUMENT_REGENERATION | PASS |
| CARDIO_E2E | PASS — corridor technique offline |
| NEURO_SMOKE | PASS — corridor technique offline |
| REAL_BROWSER | PASS — exécution réelle avec transport synthétique/replay local |
| FULL_SUITE | 4352 PASS / 0 FAIL / 0 erreur non gérée signalée ; 12 pending, 1 todo |
| TYPESCRIPT | PASS |
| BUILD | PASS |
| LINT_AFFECTED | PASS |
| PROVIDER_CALLS | 0 appel réel |
| DEMO_READY | PARTIAL |
| P1_COMPLETE | NO |
| P1_EXIT_GATE | NOT_SATISFIED |
| WAVE_2_AUTHORIZED | NO |
| NEXT_ACTION | RETURN_FOR_DEMO_REVIEW |

Le build couvre le code produit final ; les deux dernières corrections ultérieures portent exclusivement sur le typage des lecteurs de sauvegarde dans les tests. TypeScript, lint de ces fichiers et la suite complète ont été requalifiés après ces corrections. Détails dans `qualification-receipt.json`.

## Document vivant : gates

| Gate | Résultat | Limite ou preuve |
|---|---|---|
| DYNAMIC_DOCUMENT_REVISION | PARTIAL | Développer/raccourcir, focaliser/ajouter/retirer une source, prudence, comparer/expliquer, diff et restauration ; pas de rédaction libre générale. |
| DOCUMENT_VS_PROJECT_INTENT_DISCRIMINATION | PARTIAL | Frontière scientifique testée et démontrée en Human Review ; reconnaissance de commandes bornée, ambiguïtés explicites. |
| PROJECT_SOURCE_LIBRARY | PASS | Trois catégories visibles, identité bibliographique, provenance, usages par version, conservation locale. |
| USER_SOURCE_RELEVANCE_PRESERVED | PASS | Préférence explicite conservée après retrait, régénération et réouverture. |
| SCIENTIFIC_WEIGHT_SEPARATE_FROM_USER_PREFERENCE | PASS | Préférence sans promotion scientifique ; niveau comparatif non attribué. |
| SOURCE_RESOLUTION | PARTIAL | Identité locale exacte, auteur/année, DOI/PMID ; ambiguïté et absence conservées. Pas de recherche externe. |
| SOURCE_AWARE_REVISION | PARTIAL | Assertions, citations, bibliographie, exclusions et controverses gouvernées ; pas de hiérarchisation comparative générale ni qualification clinique propre à toute étude. |
| CITATION_ASSERTION_CONSISTENCY | PASS | Source effectivement liée à l'assertion ; retrait de l'unique support ; citations décoratives refusées. |
| DOCUMENT_VERSIONING | PASS | Parents, instruction, timestamp, source Project, changements et restauration non destructive. |
| DOCUMENT_DIFF | PASS | Changements du contenu présenté, distincts des seules variations de provenance technique. |
| DOCUMENT_SCIENTIFIC_NARRATIVE | PARTIAL | Synopsis encore fondé sur des rubriques et contexte composé d'assertions ; absence de synthèse substantielle du problème et de la lacune scientifique. |
| DOCUMENT_EVIDENCE_GROUNDED | PARTIAL | Assertions générales sourcées ; leur présence ne démontre pas l'applicabilité clinique à la population de l'étude. |
| DOCUMENT_REFERENCES | PASS | Bibliographie mise à jour depuis les métadonnées réellement disponibles. |
| DOCUMENT_RESEARCHER_USABILITY | PARTIAL | Édition/versionnement accessibles en Standard ; certaines assertions développées restent en anglais et la narration doit être renforcée. |

Les tests navigateur A–G de l'ajout sont réalisés : génération sourcée ; focalisation ; ajout ; retrait sans assertion orpheline ; revue scientifique ; fermeture/réouverture ; diff conversationnel. Ces résultats techniques ne convertissent pas les gates narratifs et scientifiques partiels en PASS.

## Continuum futur

| Indicateur | Résultat |
|---|---|
| FUTURE_CONTINUUM_VISIBLE | PASS |
| REVIEWS_MODULE | VISIBLE_WIP |
| RESULTS_INTERPRETATION_MODULE | VISIBLE_WIP |
| PUBLICATION_MODULE | VISIBLE_WIP |
| NO_FALSE_CAPABILITY_CLAIM | PASS |

Conception → Protocole/documents → Revues → Interprétation des résultats → Publication. Les trois dernières étapes sont grisées, boutons natifs désactivés, marquées « À venir », sans gestionnaire ni workflow fictif. Elles ne changent ni Project canonique, ni owners, ni routing scientifique, ni gates P1.

## Réparations et transparence sur les échecs

- Temporalité : le propriétaire de contribution n'emprunte plus un âge au contexte global pour construire un délai d'IRM ; correction des bornes d'âge à partir du contenu pertinent.
- Projection : polarité négative conservée dans panneau, instantané et document ; empreinte d'instantané pour ne pas présenter comme courante une ancienne projection incorrecte.
- Navigation : réponse locale à une question scientifique correctement formée ; réutilisation du résultat Study Design courant à entrée strictement identique, sans réexécution ni relâchement de l'unicité du ledger.
- Sources : requête documentaire correctement liée à la version du Project ; qualifications absentes du dernier résultat non réutilisées ; controverses explicites non arbitrées par la préférence utilisateur.
- Révisions : source retirée réintroduisible sur instruction explicite ; exclusions conservées après régénération ; autres sections et Project conservés ; validation de révision documentaire distincte de l'audit initial TMP/DOC.
- Affichage : retrait de l'en-tête documentaire fixe qui masquait le formulaire ; diff des contenus lisibles plutôt que de toutes les empreintes de provenance.
- Persistance : dépassement réel de quota à environ 5 millions de caractères pour trois Projects. Les premières versions C `1.0.2`/`1.0.3` étaient affichées mais **non sauvegardées** ; l'alerte existait hors de la zone consultée. Elles n'ont pas été récupérées rétroactivement. Leurs reçus et export sont conservés ; la requalification est repartie du dernier état réellement enregistré, avec nouveaux identifiants et timestamps. Représentation physique sans perte des répétitions : C 2 360 713 → 531 088 caractères lors de ce contrôle, restitution identique vérifiée. Alerte persistante visible et protection de sortie non sauvegardée.

Les états rouges, diagnostics abandonnés et preuves intermédiaires sont conservés. Les 40 échecs d'un full run après compactage venaient des lecteurs de test supposant du JSON brut : 32 lectures dans 18 fichiers ont été migrées vers le lecteur de session existant, sans affaiblir les assertions scientifiques ou UI. Requalification ciblée 115 PASS, puis full run final 4352 PASS.

## Limites et préservation

`KNOWN_SCIENTIFIC_LIMITATIONS` : S5 négatif offline PARTIAL demeure une limite d'entrée, sans réouverture de sa réparation. Contexte documentaire général, classement comparatif non qualifié, synthèse spécifique à la population non établie ; aucun résultat technique ne vaut adoption scientifique ou autorisation réglementaire.

`KNOWN_PRODUCT_LIMITATIONS` : stockage propre au navigateur, quota fini, absence de synchronisation, de compte authentifié et de sécurité SaaS ; commandes documentaires bornées, pas de gestion bibliographique complète ni d'import utilisateur de documents ; absence de préparation complète à la soumission ; rédaction encore partielle. Une suppression des données du navigateur n'est pas une sauvegarde serveur récupérable.

Préservation : 4752 fichiers suivis et 2509 fichiers antérieurs non suivis vérifiés par empreinte ; 645 éléments scellés non ouverts ; aucun fichier antérieur manquant ; les 36 fichiers de preuves privées du baseline précédent sont inchangés. Les seules modifications suivies concernent les fichiers explicitement listés pour cette mission. Aucun push, déploiement, paiement, PACS, SI hospitalier, appel réel supplémentaire ou lancement de Wave 2.

## Reprise et revue

`resume-state.json`, `checkpoint-log.md` et `INTERRUPTION_HANDOFF.md` conservent l'état d'exécution. Les snapshots locaux comprennent le patch suivi et les nouvelles sources, avec empreintes. Ils ne doivent pas être réappliqués au worktree qui contient déjà ces changements.

La prochaine décision est la revue de cette V1 partielle. Pour lever le déficit narratif, il faut qualifier une rédaction réellement fondée sur les contributions scientifiques et les preuves applicables, avec choix et limites de la littérature explicités. Aucun tel chantier, appel réel ou déploiement n'est lancé automatiquement par cette clôture.
