# Couverture TRACE V2 pour Studio et les documents

L’extension instrumente les corridors intégrés sur `c0ad017e1ab927f80316714ae21da61a33e8897e`, dans la branche isolée `codex/trace-studio-coverage`. Elle conserve le ledger TRACE existant, les propriétaires scientifiques et documentaires ainsi que leurs validations natives. Cette note d’implémentation n’est pas une autorité documentaire.

## Système conservé

`scientific-execution-trace.ts` reste le propriétaire du ledger append-only `SCIENTIFIC_EXECUTION_TRACE_LEDGER` 0.1.0 et du profil `NOXIA_END_TO_END_PRODUCT_TRACE` 1.5.0. L’Inspector et son diagnostic structurel restent des consommateurs de ce système. Aucun moteur, journal durable, schéma SQL ou canal fournisseur supplémentaire n’est introduit.

L’adaptateur `functional-reset/document-workflow-trace.ts` observe des ports déjà validés. Il transmet exclusivement des références, digests, codes et compteurs au ledger de session actuel. Une erreur de capture ne rejette pas un résultat natif, ne remplace pas une exception native et ne relance pas une opération.

## Matrice de couverture

| Corridor | Avant | Après | Propriétaire et frontière observée |
| --- | --- | --- | --- |
| Portfolio adaptatif | PARTIALLY_COVERED : projection DOC globale, sans résultat du portfolio intégré | COVERED pour la projection visible effectivement calculée ; PARTIALLY_COVERED pour les erreurs internes TMP/REG | DOC, `StudyDeliverableWorkspace` → `projectAdaptivePortfolio` ; références TMP et résolution REG, digest des états documentaires, nombre d’items |
| Édition conversationnelle | NOT_COVERED dans TRACE ; identité native disponible dans le contrat de proposition | COVERED pour requête, résultat, acceptation, rejet et refus d’application | DOC, `createStudioEditRuntime.propose` ; UI, `applyStudioEditProposal` ; instruction et texte exclus |
| Persistance du brouillon | PARTIALLY_COVERED : saves durables natifs, sans raccordement TRACE | COVERED aux ports DOC create/open/get/getSave/save/abandon/active, selon les opérations réellement exécutées | `traceDocumentArchiveClient` enveloppe le client Working Revision validé ; séquence, digest et base immuable |
| Finalisation | PARTIALLY_COVERED : intent durable et TRACE DOC générique, sans transitions Studio/ST natives | COVERED aux frontières du coordinateur et des ports ; attribution interne limitée aux diagnostics natifs disponibles | `createStudioFinalizationRuntime`, assessment ST, préparation, décision/adoption, QRY, DOC et reçu de commit |
| Impact entre documents | NOT_COVERED pour le résultat natif de l’inspection | COVERED pour l’inspection existante, pas pour une certification de cohérence scientifique | DOC, `inspectDocumentImpact` dans Studio/historique ; couverture, compteurs et digest du rapport uniquement |
| Récupération session et versions | PARTIALLY_COVERED : récupération du corridor DOC déjà existante | COVERED aux lectures autorisées DOC, historique, corps, révision et intent ; PARTIALLY_COVERED avant disponibilité d’une identité Project valide | Client archive existant et ouverture Studio ; aucune identité ni preuve d’accès fabriquée |

« COVERED » qualifie la frontière indiquée, pas l’ensemble des fonctions internes d’un propriétaire distant. La couverture entre documents reste `READ_ONLY_DEPENDENCY_IMPACT_NOT_SEMANTIC_CERTIFICATION` ; aucune analyse scientifique par paragraphe n’est ajoutée.

## Stages et corrélation

Les stages existants sont réutilisés : `TMP_PROJECTION`, `DOC_PROJECTION`, `UI_PROJECTION`, `SCIENTIFIC_THINKING_RESULT`, `CLIENT_PREPARATION_START`, `HUMAN_DECISION_RECORDED`, `DURABLE_RECOVERY_COMPLETED` et `ERROR_BOUNDARY`. Les producteurs conversation/préparation/adoption/DOC déjà instrumentés restent en place.

Le run dérive de l’identité native de l’opération et de la session via `createProductTraceRunId`. Studio utilise `startScientificRun` avec le snapshot Project natif et un initiateur produit explicite, jamais un faux `USER_TURN_RECEIVED`.

La finalisation est corrélée par `finalizationIntentId` dans les frontières ST, préparation, adoption et DOC. Les observations de reprise utilisent la révision/save **gelée par l’intent**, même si un save ultérieur existe. La base, le Project gelé, le Project résolu et le reçu documentaire conservent leurs références distinctes. Les lectures séparées utilisent leur propre identité native et peuvent être reliées par les références de génération/révision/intent.

`saveSequence`, `displayVersion`, version Project et séquence d’intent ne sont pas confondus. `recoveryState` reste distinct de `intentStatus` ; une recherche d’intent par révision ou génération ne fabrique pas un ID d’intent avant la réponse native. L’identité de requête assessment 1.2.0 provient de `studioAssessmentOperationIdentity`. L’édition réutilise `studioEditOperationId` et le digest natif de requête/proposition. Un identifiant de requête client n’est pas présenté comme un identifiant d’opération fournisseur physique.

## Première erreur et portée de l’attribution

L’Inspector sélectionne la première observation `FAILED`, avant une éventuelle erreur UI générique ultérieure. Il restitue le stage causal canonique conservé dans les métadonnées, le propriétaire, la fonction et le code natif. Les invariants ou codes publics absents restent `UNKNOWN`.

Le diagnostic natif `STUDIO_ASSESSMENT_FAILURE_V1` permet une attribution `ROOT_CAUSE_PROVEN` à `acceptStudioAssessment` et à son code de contrat. Pour une exception ne fournissant que son code et la frontière appelante, la projection signale `OBSERVED_BOUNDARY_ONLY`, rendue `SYMPTOM_ONLY` dans l’Inspector. Elle ne prétend pas connaître la fonction causale interne du serveur.

La matrice déterministe couvre : assessment invalide, HTTP 413/preparation, divergence de checkpoint, décision humaine manquante, révision périmée, concurrence de save, proposition refusée, échec fournisseur, échec archive et récupération non autorisée. Les objets d’erreur et les nombres d’exécutions restent inchangés. Les signaux de coordination `STUDIO_DOCUMENT_PROVIDER_REQUIRED`, `STUDIO_DOCUMENT_PROVIDER_FAILED` et `STUDIO_INTENT_PREPARATION_IN_PROGRESS` restent des observations bloquées, non des échecs causaux inventés.

Le diagnostic fournisseur borné existant est réutilisé lorsqu’il fournit une clé d’opération durable, HTTP status, response status ou état durable. Aucune lecture supplémentaire du ledger fournisseur ni aucun dispatch n’est déclenché pour compléter TRACE.

## Confidentialité et niveaux

- CORE conserve les résultats et la lignée minimale ; il omet les observations `STARTED` de cet adaptateur.
- DIAGNOSTIC ajoute les frontières commencées et leurs résultats natifs.
- FORENSIC conserve son activation et ses politiques existantes ; l’extension ne l’active pas automatiquement et ne crée pas de nouveau payload forensic.

La projection emploie une liste explicite de scalaires autorisés. Elle exclut instructions utilisateur, before/after text, corps natifs, prose scientifique, transcript, réponses fournisseur brutes, stack traces, cookies, preuves d’accès et credentials. Les références sont bornées et les compteurs doivent être des entiers sûrs positifs ou nuls. Les messages libres d’erreur ne sont pas des codes techniques ; seuls les codes reconnus comme natifs sont conservés.

Les tests injectent des champs privés supplémentaires et vérifient leur absence dans le ledger. Un message privé en majuscules n’est pas assimilé à un code. Les digests d’impact/portfolio ne restituent pas leur contenu source.

## Passivité et coût

Les observations identiques d’une projection pure sont dédupliquées ; les exécutions explicites distinctes ne le sont pas. Le raccordement React ne programme aucune mise à jour pour un stage CORE omis ou une projection identique. Lorsqu’une mise à jour est nécessaire, il utilise l’état effectivement appliqué dans la file React, sans remplacer une transition métier concurrente par une session ancienne.

La première qualification a révélé deux défauts propres à l’instrumentation : coût répété de validation du ledger et boucle d’observation/rendu. Ils ont été corrigés dans TRACE et son raccordement React, sans modifier les délais des tests ni les propriétaires métier.

La mesure isolée avant correction atteignait environ 45 ms par observation à 106–113 événements. Le propriétaire TRACE réutilise maintenant une validation complète uniquement pour l’identité exacte d’un ledger profondément immuable constitué de données ordinaires. Les entrées JSON rechargées, mutables, seulement gelées en surface ou falsifiées repassent les contrôles natifs de forme, confidentialité, chaîne et digests. Un `WeakMap` en mémoire conserve ces preuves de validation, pas un second journal ni un état métier.

La régression vérifie qu’une validation/copie suffit à 50 lectures répétées du même ledger immuable ; elle rejette encore les mutations et faux digests. Les métadonnées de la fixture minimale restent sous 1 000 octets. Ces résultats ne sont pas une garantie universelle de latence ni une nouvelle limite de taille du ledger.

## Qualification

Les tests utilisent les frontières natives et des fixtures/mocks, pas des appels réels.

| Gate | Résultat final |
| --- | --- |
| Tests ciblés TRACE, Studio, ST et DOC | 353/353 PASS, 18 fichiers |
| Corridor deux versions | PASS_OFFLINE, 8/8 scénarios existants |
| Stabilité | 168/168 PASS |
| Baseline canonique | 6 100 PASS, 0 FAIL, 0 erreur de collecte |
| Sentinelles | 309/309 PASS |
| Typecheck | PASS, dont chargement ESM serveur |
| Lint | PASS, 0 erreur et 7 avertissements préexistants |
| Build | PASS |
| Diff check | PASS |

Les 13 skips et le todo préexistants restent inchangés ; aucun timeout, skip, exclusion ou règle de collecte n’est modifié. La découverte canonique utilisant l’index Git, le nouveau fichier TRACE est indexé avant le passage canonique final.

Le flux mixte est également vérifié dans le ledger persistant : assessment → préparation → adoption → DOC → archive garde sa corrélation et se rehydrate. Les contributions conversationnelles USER restent inchangées. Le harnais de préparation consomme la session courante, comme le port runtime, plutôt que son snapshot initial antérieur aux observations.

Deux assertions historiques sont adaptées à l’ajout légitime de preuves TRACE : sélection explicite du run scientifique dans l’Inspector et comparaison stricte de tous les champs non-TRACE lors d’une lecture historique. Les contrôles Project, corps, historique, nombres d’exécutions et appels supplémentaires ne sont pas assouplis.

Journaux, passages intermédiaires et 42 sorties générées sont conservés avec empreintes dans `/private/tmp/noxia-trace-qualification.gmaurG`. La dernière qualification conserve séparément les sorties du premier passage. L’intégration à une release et la validation réelle restent des gates ultérieurs.

## Limites résiduelles

1. Les succès d’édition et d’assessment n’exposent pas toujours leur clé fournisseur physique au client. TRACE conserve les identités natives de requête ; la clé physique n’est incluse que si un diagnostic existant la fournit.
2. Les erreurs serveur génériques sans diagnostic natif détaillé restent attribuables à la première frontière observée, pas nécessairement à leur cause interne.
3. Un échec de récupération local antérieur à toute identité Project vérifiée ne crée pas de run scientifique fictif. Les erreurs internes de projection TMP/REG ne sont pas toutes exposées par les ports actuels.
4. Les observations d’impact représentent uniquement les dépendances déjà natives. Elles ne démontrent pas une cohérence exhaustive de tous les paragraphes.
5. Un run TRACE peut rester un flux d’observation ouvert pour les lectures après reprise ; `intentStatus=CLOSED` est le statut métier autoritatif, pas le statut technique de ce flux.

La validation Chrome réelle reste un gate distinct. Cette mission n’interagit pas avec Chrome, n’intègre pas la branche au candidat navigateur et ne promeut aucun alias Preview.

## Sécurité d’exécution

`PROVIDER_CALLS=0`, `DB_WRITES=0`, `REAL_DOCUMENT_GENERATIONS=0`, `DEPLOYMENT=NO`, `MAIN_CHANGED=NO`, `PRODUCTION_CHANGED=NO`, `MIGRATION_ADDED=NO`.

Les générations produites par les tests sont des fixtures hors ligne. Aucun contenu documentaire réel, décision scientifique, mécanisme d’adoption, modèle fournisseur, schéma de sortie ou body archive n’est modifié par TRACE.
