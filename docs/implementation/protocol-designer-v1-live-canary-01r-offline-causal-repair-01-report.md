# Canary 01R — reproduction causale et réparation hors ligne

Mission : `PROTOCOL_DESIGNER_V1_LIVE_CANARY_01R_OFFLINE_CAUSAL_REPAIR_01`.

## Autorité, état d’entrée et portée

Mandat utilisateur du 14 septembre 2026 : reproduire le défaut live T05 avant toute correction produit, réparer ses propriétaires existants, qualifier hors ligne puis committer. L’autorisation complémentaire de poursuivre ne lève aucune interdiction : aucun provider réel, nouveau canary, push ou déploiement.

Branche vérifiée : `protocol-designer-canonical-ingestion`. HEAD d’entrée : `755c8c68c38520d8fee283a88f7c39fe7752f99c`. Index et fichiers suivis initialement propres. Les 518 fichiers non suivis préexistants et 34 fichiers de preuve live ont été inventoriés par chemin et SHA-256 dans `validation/protocol-designer-v1-live-canary-01r-offline-causal-repair-01/baseline.json`. La roadmap reste une source de pilotage non normative ; cette mission ne clôt pas P1 et n’autorise pas Wave 2.

## Reproduction rouge avant correction

Le test `recorded-prefix.test.tsx` monte le véritable composant Standard `ProtocolDesignerDemo` dans jsdom. Il traverse le client, le handler HTTP, les validateurs, les adapters providers et `createProtocolDesignerReplayFetch`. Les seuls substituts sont le transport HTTP local, les cinq réponses provider historiques au transport qualifié, et les horodatages/identifiants nécessaires pour retrouver exactement les requêtes enregistrées. Il n’injecte ni Project, ni sélection QRY, ni résultat Scientific Thinking. Les confirmations humaines du préfixe sont reproduites par les contrôles du composant.

Les cinq requêtes sont reconnues par le replay strict, sans réécriture. Le Project est reconstruit jusqu’à la version 3, digest de projection `ke1-59d16d6d3efdb189`. Après « fais moi des propositions », il reste strictement égal à son état précédent. QRY porte `QRY_SELECTED_EXISTING_OWNER_FOR_EXPLICIT_PROPOSAL_REQUEST`, Scientific Thinking répond sans provider et la source reste `ST_STANDARD_PROJECTION`. Le registre contient trois résultats avant et après T05 ; l’ancienne question est répétée à l’identique.

`red-reproduction.json` constate cette reproduction. Le test de l’ancien comportement passe ; l’oracle exigeant une contribution nouvelle échoue ensuite, avant modification produit, dans `pre-repair-oracle-test.json`. Ce rouge n’est pas une réponse synthétique fabriquée pour le test.

## Attribution causale

Chaîne observée : acte explicite de proposition → sélection QRY du besoin existant → owner Scientific Thinking → purpose de formulation de question inchangé → même entrée native et même Project → résultat jugé frais et compatible → projection contextuelle de la question précédente.

`WHY_WAS_EXISTING_ST_RESULT_CONSIDERED_REUSABLE` : le cache comparait déjà l’entrée native complète, les dépendances et la fraîcheur exacte du Project. L’entrée était réellement identique parce que le sens distinct de la demande n’y arrivait pas. Le résultat `scientific-thinking-output:ke1-8842b554969999e0`, requête `scientific-thinking-project-request:ke1-6bd39ff4207ea8c0`, gardait le purpose « Formuler ou préciser la question scientifique à partir de l’objectif adopté. »

`WHAT_SEMANTIC_DIMENSION_WAS_MISSING_OR_MISCLASSIFIED` : l’opération de proposition d’alternatives, distincte de la formulation de question. Le motif diagnostique QRY reconnaissait l’acte mais ne modifiait pas la portée native. Certaines variantes interrogatives étaient en outre absorbées par la résolution locale `DISCUSS` avant d’atteindre QRY.

`REAL_OWNER_OF_DEFECT` : contrat de portée entre l’adapter QRY Standard et le dispatch du propriétaire Scientific Thinking ; construction/projection propriétaire des propositions associée. Aucun défaut provider démontré.

`FIRST_CAUSAL_BOUNDARY` : traduction de `ASSISTED_PROPOSAL` en purpose/opération native Scientific Thinking. La projection de question rendait le défaut visible ; un simple changement de renderer ou désactivation du cache n’aurait pas réparé cette frontière.

QUESTION, HYPOTHESIS et SCIENTIFIC_MODEL restent des types de candidats existants. PROPOSAL est une demande conversationnelle, DISCUSS un acte de discussion, EXPLAIN_REFERENCED_CONTENT l’explication existante : aucune nouvelle ontologie n’a été créée. L’opération existante `GENERATE_ALTERNATIVE_HYPOTHESIS` porte désormais la distinction. Le corridor concerné ne reçoit pas de KnowledgeResult : dépendances documentaires absentes, support non démontré et limites conservées.

## Correction

- QRY conserve la demande explicite dans `requestedAction`, sans la transmettre implicitement aux reconstructions ordinaires.
- Le dispatch, le runtime propriétaire et le builder natif transmettent `requestedOperation` et un purpose distinct. Ces valeurs participent à l’identité native ; l’égalité complète et les contrôles de fraîcheur restent requis. Une demande équivalente peut réutiliser le même résultat ; un changement Project invalide ses dépendants.
- Pour une comparaison structurée unique avec critère disponible, Scientific Thinking formule une hypothèse de différence non directionnelle et une hypothèse concurrente d’absence de différence discernable. Il conserve les inconnues et l’absence d’appui documentaire. L’absence de différence détectée ne vaut pas équivalence ; aucun effet clinique ni fait utilisateur n’est inventé.
- Le propriétaire Standard présente ces candidats avec leur condition de confrontation, leurs limites et les inconnues Project en texte lisible. L’historique des candidats exposés évite leur répétition. Sans autre proposition justifiée, la réponse explique cette limite et ne prétend pas épuiser les possibilités scientifiques. Hors comparaison suffisamment structurée, le moteur ne recycle pas une hypothèse déjà confirmée en nouvelle proposition.
- La grammaire conversationnelle existante reconnaît les variantes impératives/interrogatives de cette classe d’actes. Elle préserve les questions factuelles et distingue négation de la demande et contrainte négative sur une proposition. Aucun mot IDM ni liste des phrases de test ne pilote le routage.
- Une réponse d’épuisement conserve l’ancrage des dernières propositions sélectionnables, lié au même Project, indépendamment du nouveau résultat détenu pour le purpose/cache. Toute sélection reste une contribution soumise à confirmation humaine.

Les sorties et requêtes ordinaires du préfixe restent inchangées. Aucun modèle, prompt provider, reasoning effort, retry, politique budgétaire ou mécanisme d’appel provider n’a été modifié.

## Revue contradictoire après vert

Une seconde revue avec Astra ULTRA a été menée après le premier rejeu réparé et les trois soaks verts. Les constats actionnables ont donné lieu à corrections et tests : infinitif « suggérer » manquant ; question sur les options déjà adoptées mal classée ; références d’objectifs vers une hypothèse filtrée ; hypothèse Project reproposée dans le fallback non comparatif ; contraintes négatives prises pour des refus ; perte de sélection d’une proposition antérieure après un nouveau résultat vide. Les reçus de qualification finaux portent sur l’état corrigé.

## Dettes indépendantes conservées

1. **Compteur 7 → 1, MINOR**, owner probable : projection cockpit `ResearchProjectPanel`. Le compteur dérive du nombre de besoins associés aux candidats QRY éligibles. Le filtrage `ASSISTED_PROPOSAL` restreint cet ensemble sans résoudre les objets/inconnues Project. Déclencheur commun avec T05, mais pas cause de la répétition scientifique. Aucun correctif du compteur dans cette mission.
2. **Trace RUNNING / 3 événements / 0 ms, MINOR**, owner probable : cycle de trace du dispatch Scientific Thinking. Le dispatch ajoute la projection UI puis retourne sans événement terminal ; le statut dérivé reste RUNNING. Les horodatages locaux identiques expliquent 0 ms. Défaut d’observabilité indépendant du résultat/reuse. Aucun correctif de cette dette dans cette mission.

## Qualification et preuves

Les processus de test, TypeScript, lint et build sont exécutés avec la garde réseau existante `validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-guard.cjs`. Elle interdit fetch/TCP/TLS externes, retire les clés provider du processus et interdit la lecture des fichiers d’environnement privés. Le handler du replay reçoit exclusivement des valeurs factices.

Le rejeu historique exact utilise 5/5 réponses et traverse T01–T05, puis une demande équivalente vérifie le reuse et l’épuisement explicite. Les soaks A/B/C utilisent les corpus déterministes existants de quinze tours chacun, avec un oracle de proposition renforcé. Ils ne prolongent pas fictivement l’expérience live historique après T05. Les propriétés supplémentaires couvrent apprentissage et agronomie, décisions humaines réelles du propriétaire Project, invalidation, UNKNOWN, non-adoption, discussion, refus et sélection.

Résultats définitifs et digests : `validation/protocol-designer-v1-live-canary-01r-offline-causal-repair-01/qualification-results.json`. Attribution compacte : `causal-receipt.json`. Les sorties détaillées et sessions reconstruites restent des artefacts locaux de validation ; les réponses provider originales restent dans le répertoire privé historique inchangé.

Qualification finale : **4 033 PASS, 0 FAIL, 0 erreur non gérée**, sur 270 fichiers ; 12 tests en attente et 1 TODO restent non exécutés. Les 27 tests de propriétés, les 7 tests du harness Standard incluant les trois soaks, et les 62 tests ciblant record/replay, coûts/frontières publiques, configuration locale et cycle bridge passent. Le rejeu historique exact et sa sélection après épuisement passent séparément. TypeScript complet, lint affecté et build : PASS. Le build conserve son avertissement de taille de bundles. Les 518 fichiers non suivis préexistants et 34 fichiers de preuve live correspondent à leurs empreintes d’entrée.

Reproduction locale du vert, à la racine du dépôt :

```sh
NODE_OPTIONS="--require $PWD/validation/protocol-designer-v1-pass3a-governed-navigation-and-conversation-backbone-01/offline-guard.cjs" node node_modules/vitest/vitest.mjs run --config validation/protocol-designer-v1-live-canary-01r-offline-causal-repair-01/vitest.config.ts validation/protocol-designer-v1-live-canary-01r-offline-causal-repair-01/recorded-prefix.test.tsx
```

Le replay requiert les cinq enregistrements privés préservés. La preuve rouge archivée précède le correctif ; le commutateur rouge échoue intentionnellement sur le produit réparé. jsdom vérifie le composant Standard et ses propriétaires réels, mais ne constitue ni une nouvelle exécution navigateur live ni une validation humaine/scientifique du contenu proposé.

## État de sortie autorisé

`NEW_PROVIDER_CALLS = 0`, `OPENAI_CALLS = 0`, `GEMINI_CALLS = 0`.

`LIVE_PROVIDER = FAIL_FROM_CANARY_01R_HISTORICAL` ; `LIVE_PROVIDER_RETEST_AFTER_REPAIR = NOT_RUN` ; `HUMAN_LIVE = NOT_RUN`.

`P1_COMPLETE = NO` ; `P1_EXIT_GATE = NOT_SATISFIED` ; `WAVE_2_AUTHORIZED = NO`.

`NEXT_ACTION = NEW_EXPLICITLY_AUTHORIZED_LIVE_CANARY_AFTER_OFFLINE_REPAIR`.

Le commit inclut uniquement la liste explicite des fichiers produit, tests, rapport et reçus compacts de cette mission. Aucun push ni déploiement. Le HEAD final et l’intégrité des fichiers préexistants sont consignés après commit dans le reçu local `final-state.json`.
