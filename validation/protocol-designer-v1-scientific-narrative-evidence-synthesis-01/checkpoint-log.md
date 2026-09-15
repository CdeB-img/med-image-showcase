# Checkpoint log

## CP0 — Reuse map

- Baseline et branche vérifiées : `5c7e176a964bb4f0b3a6e8211d22d7d0ad6deb87`, `protocol-designer-canonical-ingestion`.
- Worktree suivi propre ; les nombreux fichiers de preuve antérieurs non suivis sont préservés.
- Lecture bornée à KE-001, DOC/TMP, Knowledge runtime/adapters, bibliothèque de sources Project, composition/révision DOC et frontières Project.
- Déficit causal : la projection assemble les premières assertions admissibles, perd les qualifications corpus utiles à la priorité, n'intègre pas assez le contexte Project et masque les contradictions en les excluant.
- Cible minimale : conserver les qualifications existantes, appliquer l'ordre lexicographique KE sans score arbitraire, composer un arc narratif déterministe, exposer limites/divergences/lacune, renforcer focus/raccourcissement/explication de source.
- Aucun corpus blind/sealed ouvert. Aucun provider appelé. Aucune modification produit avant la cartographie.

## CP1 — Narrative composition

- Ajout de `DOC_SCIENTIFIC_NARRATIVE_V1` dans le propriétaire DOC existant, sans nouveau moteur scientifique.
- Composition déterministe de la progression problème et importance Project → connaissance/méthodes sourcées → limites/discordances → lacune → justification → question/objectifs.
- Corps chercheur séparé des identifiants d’assertions, EvidenceLinks, digests et diagnostics conservés dans la structure technique.

## CP2 — Evidence applicability

- Le contexte du document est maintenant dérivé du Research Project canonique au lieu d’une requête Knowledge vide de contexte.
- Les qualifications déjà présentes dans P4R/P5 (maturité, qualité, types, populations, pathologies, techniques, mesures) sont conservées par les adapters.
- Les écarts entre axes de la source et axes du Project sont explicités comme preuve indirecte ; aucune pseudo-note quantitative n’a été ajoutée.

## CP3 — Source prioritization

- Ordre lexicographique KE-001 appliqué à l’applicabilité, relation EvidenceLink, qualité, maturité et localisateur.
- La pertinence utilisateur reste hors du comparateur scientifique ; une source demandée peut être contextuellement mise en avant sans devenir la preuve principale.
- Les contradictions qualifiées sont projetées comme positions divergentes visibles et sans arbitrage DOC.

## CP4 — Conversational revisions and targeted qualification

- Développement, focalisation source, raccourcissement sémantique et explication du choix de source qualifiés.
- Correction causale d’un raccord P4R/P5 : normalisation des identités de facettes avant tri, puis restauration de `p4r-ecv-t1 = SUCCESS` avec 28 assertions locales sur le cas ECV.
- Qualification ciblée : 5 fichiers, 62 tests PASS, 0 FAIL ; TypeScript `--noEmit` PASS.
- Les tests démontrent version documentaire nouvelle, section bornée, citations/références exactes, Project byte-stable et smoke neuro.
- Aucun appel provider live. `PROVIDER_CALLS = 0`. `FULL_SUITE_RUNS = 0`.

## CP5 — Real-browser cardio

- Parcours cardio principal qualifié dans le navigateur réel : Project v2, Protocol 1.0.0 puis révisions documentaires 1.1.0 à 1.1.3.
- Développement, focalisation sur Miller, raccourcissement et explication comparative Schulz-Menger/Miller visibles ; la préférence utilisateur reste séparée de la priorité scientifique.
- Fermeture puis réouverture : Project v2, Protocol 1.1.3, historique des cinq versions et bibliothèque de sources restaurés.
- Un essai local avec une paraphrase non gelée a échoué fermé avant tout appel externe et sans écriture Project ; le scénario exact gelé a ensuite été utilisé.
- `PROVIDER_CALLS = 0`. `FULL_SUITE_RUNS = 0`.

## CP6 — Orthogonal smoke, defect isolated

- Le Project neuro v2 a été construit depuis les deux énoncés exacts, puis un Protocol 1.1.0 a révélé un défaut matériel avant qualification : question vide et absence de preuve dans la narration.
- Causes établies : le Project possède un `OBJECTIVE` canonique mais aucune `SCIENTIFIC_QUESTION`, tandis que l’adaptateur historique conserve volontairement `objectives: []`; le compositeur DOC ne lisait pas le nœud canonique de repli. Les expressions naturelles « débit cérébral » et « consommation d’oxygène » n’étaient pas reconnues par les règles de concepts.
- Réparation bornée en cours : repli DOC sur le nœud `OBJECTIVE` uniquement en l’absence de question, sans modifier le contrat historique, et ajout d’alias français aux deux concepts Knowledge existants.
- Le premier document neuro reste une preuve de défaut de développement et ne sera pas présenté comme qualification.

## CP6 — Orthogonal smoke, repair qualified

- La réparation bornée lit désormais le nœud canonique `OBJECTIVE` uniquement lorsque le Project ne porte aucune `SCIENTIFIC_QUESTION`; elle ne modifie pas le contrat historique qui conserve les tableaux legacy vides.
- Les variantes françaises naturelles et accentuées de « débit cérébral » et « consommation d’oxygène » rejoignent les concepts Knowledge existants, sans science ni fixture neuro ajoutée.
- Qualification ciblée après réparation : 5 fichiers, 63 tests PASS, 0 FAIL ; TypeScript `--noEmit` PASS.
- Nouveau parcours navigateur offline sur une instance propre : Project neuro v2, Protocol 1.1.0, objectif formulé sans guillemets vides, connaissances CBF sourcées, limite d’applicabilité et lacune explicites, bibliographie Copen/Chung visible.
- Le Project cardio a été rouvert après HMR : Project v2 et Protocol 1.1.3 inchangés, narration, bibliographie et historique des cinq versions conservés.
- Reçus : `SCENARIO_A_CARDIO_FINAL_SOURCE_PRIORITY`, `SCENARIO_A_CARDIO_REOPEN_PERSISTENCE`, `SCENARIO_B_NEURO_OBJECTIVE_FRAMING`.
- `PROVIDER_CALLS = 0`. `FULL_SUITE_RUNS = 0`.

## CP7 — Final qualification, pre-suite

- Les deux scénarios et le navigateur réel sont verts. Le transport navigateur est le provider synthétique local qualifié ; aucune API externe n'a été appelée.
- Le premier build a identifié une incompatibilité TypeScript locale entre un tuple en lecture seule et les helpers d'applicabilité ; la signature des helpers a été corrigée sans modifier le comportement.
- Lint borné aux neuf fichiers de la mission PASS ; TypeScript multi-configurations, contrôle du runtime serveur et build Vite PASS ; `git diff --check` PASS.
- Le lint global reste rouge sur 75 erreurs et 36 warnings antérieurs ou provenant de fichiers d'expérimentation/preuves non suivis hors périmètre. Aucun défaut ne concerne les fichiers de cette mission.
- Prochaine action : unique full suite finale, sans élargissement de périmètre.

## CP7 — Final qualification, complete

- Unique full suite finale exécutée une seule fois : 278 fichiers de test, 4 352 tests PASS, 0 FAIL, 12 pending et 1 todo ; rapport Vitest `success = true`.
- Résultat identique au nombre de tests passés rapporté à la baseline d'entrée.
- `PROVIDER_CALLS = 0`. `FULL_SUITE_RUNS = 1`.
- Tous les stop conditions de la mission sont établis ; seule la revue finale du diff et le commit local CP8 restent à effectuer.

## CP8 — Local commit candidate

- Diff final revu sur les neuf fichiers produit/test et la racine de preuve propre à la mission ; `git diff --check` PASS.
- Recherche ciblée de secrets dans les preuves navigateur : aucune clé OpenAI, valeur d'API key ou valeur Bearer détectée.
- Whitelist de commit bornée à la mission ; aucun ancien artefact non suivi n'est ajouté.
- L'état déclaré `COMPLETE` est destiné à être scellé par le commit Git qui contient ce checkpoint.
- `NEXT_ACTION = RETURN_FOR_DEMO_REVIEW`.
