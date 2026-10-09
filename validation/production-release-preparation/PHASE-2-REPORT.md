# Préparation de release — phase 2

État vérifié le 9 octobre 2026. Le contrôle de schéma sans DDL implicite est corrigé et qualifié. Les arbitrages financiers et de provenance sont résolus. La reconnaissance sémantique des décisions reste un manque de contrat/runtime, non une extension lexicale à poursuivre. La qualification scientifique réelle, le schéma Preview et le rollback fonctionnel v4 restent des gates ouverts : cette branche n'est pas encore un candidat de release autorisable.

## Décisions et sources

- Option scientifique **A** : qualifier le corridor Studio scientifique complet avant Production. Les tests simulés ne remplacent pas cette preuve.
- Finances : défauts **8 admissions / 1 USD soft-stop / 6 USD hard-stop** conservés; configuration Production explicite **512 / 3 / 6** prise en charge, sans écriture de configuration.
- Adoption : périmètre réellement présenté, références canoniques exactes, identité/version/fraîcheur et autorité humaine. Aucun fallback par suffixe.
- La rectification utilisateur remplace l'élargissement lexical : les expressions sont des exemples de test. Les ajouts lexicaux non committés ont été retirés exactement. Aucun nouveau dictionnaire, moteur ou appel fournisseur n'est implémenté.
- Reprise des conversations Production v3 non requise; aucune donnée legacy supprimée. Continuité Preview et récupération des nouvelles données v4 toujours requises.

Le rapport historique `REPORT.md` était déjà vide avec une suppression non committée à l'ouverture de la mission. Il n'a pas été restauré, édité ni inclus dans les commits. Ce nouveau rapport actualise les décisions sans réécrire cette occurrence historique ni `release-scope-clarification.md`.

## Source et intégration main

```text
STARTING_COMMIT = 1e53896ef119ccb293419b2ea3260073630039ee
BRANCH = codex/production-release-preparation
RUNTIME_FIX_COMMIT = b4b7890d6d039499d2de5822124701624cb971d7
PG18_NORMALIZATION_COMMIT = b7c92931c2fab807070aee670f2890e8790cda63
FINAL_ISOLATED_COMMIT = HEAD contenant ce rapport; SHA résolu dans le compte rendu final
REMOTE_MAIN_OBSERVED = 91a8ee880cfd1dd128b6f45f9b72ee8408816dad
LOCAL_MAIN_OBSERVED = 9be06edca1a7500ab7a43d065e94241e91d67bec
GOLDEN_TAG_TARGET = c722279f4ed6b2fae1b5d453c02d3bf43eecbde6
MAIN_ONLY_COMMITS_REVIEWED = 8
HUMAN_MAIN_DECISIONS_PENDING = 0
MAIN_CONFLICTS_RESOLVED = POLICY_AND_SCOPE_RESOLVED_SEMANTIC_RUNTIME_TARGET_OPEN
```

L'inventaire conserve ses dispositions historiques et ajoute `phase2Disposition`/`phase2Decision`; il ne transforme pas une supersession de décision produit en équivalence de code.

| Commit main | Traitement retenu |
| --- | --- |
| `81b8fd8e` | Défauts candidats et configuration explicite conservés; diagnostic sûr déjà porté. |
| `bedeef1a` | Ancienne UI Review supersédée par Generate Version et WD interne/lazy; fraîcheur/checkpoints/règlement après adoption conservés. Les anciens messages ne sont pas déclarés identiques. |
| `9e14e598` | Port diagnostic `d04be391` conservé sur le guard courant, avec confidentialité. |
| `5f3b108b` | Layout viewport approuvé conservé; aucun retour au scroll de page desktop ni affirmation d'identité des algorithmes d'auto-fit. |
| `b1803c43` | Accounting terminal incomplete et quotes exactes conservés. Capacité WD actuelle 64 000, distincte de l'ancien 16 000; pas de changement financier. |
| `964786a5` | Scope et provenance exacts conservés; fallback `:atom:ref` exclu. |
| `3f643c4b` | Port lexical rejeté après rectification; contrat de décision sémantique lié manquant, adaptation du propriétaire existant proposée. |
| `91a8ee88` | Indicateur WD visible supersédé par décision Standard interne/invisible/lazy. Aucun WD incrémental nouvellement établi. |

Aucun merge, push ou déplacement de main/tag/alias stable.

## M2 — Persistance sans installation implicite

Les propriétaires PostgreSQL PRJ snapshot, DOC archive/réservations, Working Revision et Finalization Intent vérifient leurs tables par une lecture structurée de `pg_catalog`. Installation explicite, vérification et opérations applicatives sont séparées. Les installateurs natifs et migrations 001–005 sont conservés; aucun nouveau moteur de migration.

La vérification couvre colonnes/types/nullabilité, clés/contraintes validées et enforceables, triggers d'immutabilité et index. Une incompatibilité retourne un code natif borné `*_SCHEMA_MISSING`, `*_SCHEMA_INCOMPATIBLE` ou `*_SCHEMA_VERIFICATION_FAILED`; elle ne répare jamais le schéma. La première vérification est partagée par instance froide; un échec n'est pas mis en cache définitivement.

PostgreSQL 18 représente aussi les contraintes de table NOT NULL dans `pg_constraint`, contrairement à 17. La normalisation ne les compte pas deux fois : `attnotnull` reste vérifié et une contrainte native non validée/non enforceable reste refusée. Les empreintes des schémas conformes sont inchangées. Sources : [catalogue PostgreSQL 18](https://www.postgresql.org/docs/18/catalog-pg-constraint.html), [catalogue PostgreSQL 17](https://www.postgresql.org/docs/17/catalog-pg-constraint.html).

### Preuves locales natives

- **11/11 contrôles PostgreSQL réel local** : runtime sans CREATE/ownership de tables, CREATE/ALTER refusés, migrations explicites, Project V1/V2 et archive G1/G2, saves/intents natifs, workers froids, relecture historique, no-op, CAS et mauvais bindings, table absente, contrainte retirée/trigger désactivé, archive et catalogue inchangés.
- **19/19 contrôles de répétition des migrations** : 001–005, ordre/idempotence, base non vide/histoire, immutabilité, bindings JSON natifs, append-only/CAS, rollback SQL transactionnel, refus de données historiques incompatibles sans réécriture, compatibilité du guard historique.
- Rollback SQL transactionnel **ne prouve pas** un rollback fonctionnel d'application conservant/récupérant les nouvelles données v4.

### Catalogue Preview — lecture seule

Cible Preview et séparation Production vérifiées à partir de la configuration de déploiement, avec endpoint Preview réduit à l'empreinte `11f5efa36bd11789`. PostgreSQL observé : `18.6 (c021049)`. Aucune donnée scientifique, preuve d'accès ou body natif n'a été lu pour ce contrôle.

| Table | État avec le candidat |
| --- | --- |
| `public_project_snapshot` | MATCH |
| `doc_generation` | MATCH |
| `doc_generation_body` | MATCH |
| `doc_working_revision` | INCOMPATIBLE : `doc_working_revision_native_binding_required` absente |
| `doc_studio_finalization_intent` | INCOMPATIBLE : `doc_studio_intent_native_binding_required` absente |

Les tables 004/005 existent déjà. Leurs contraintes de binding durcies du candidat `582fdee5` ne sont pas installées dans le catalogue observé. Ce n'est pas une absence intégrale des migrations. Le nouveau runtime échouera volontairement fermé pour Studio tant que l'installation explicite autorisée n'aura pas été vérifiée. Aucun déploiement de ce candidat ni DDL distant n'a été exécuté.

## Décisions naturelles — audit et manque précis

Le [rapport dédié](natural-decision-semantic-audit.md) trace les propriétaires, schémas et chemins réels.

```text
CURRENT_DECISION_RECOGNITION_OWNER = PROTOCOL_DESIGNER_UI + QUERY_NAVIGATION
CURRENT_RECOGNITION_MECHANISM = LEXICAL_DETERMINISTIC_WITH_CONTEXT_BINDING
LEXICAL_DICTIONARY_DEPENDENCY = YES_EXISTING
RECENT_LEXICAL_ADDITIONS_RETAINED = NO
LLM_SEMANTIC_INTERPRETATION_AVAILABLE = PARTIAL_SCIENTIFIC_MEANING_NOT_BOUND_DECISION
CHANGES_REQUIRED = EXISTING_ST_SAME_CALL_RESULT_AND_EXACT_PRESENTATION_CONTEXT_PLUS_QRY_PRJ_VALIDATION
VALIDATION_GUARDS_PRESERVED = YES
TEST_RESULTS = 12/12 SEMANTIC_BOUNDARY_CHARACTERIZATION_PASS_OFFLINE
REMAINING_GAP = NATIVE_BOUND_DECISION_INTERPRETATION_AND_GOVERNED_RUNTIME_CONSUMPTION
```

Scientific Thinking produit déjà réponse et sens scientifique structuré dans l'appel conversationnel. Il ne produit pas encore un acte décisionnel lié au référent/périmètre réellement présenté; TERRA ne reçoit pas non plus le `boundedReferentContext` exact. `candidateBindings`, dispositions et réalisation QRY ne sont pas des reçus d'autorisation.

Adaptation proposée, **non implémentée** : étendre le même résultat ST et son entrée avec le contexte borné existant, puis lier/valider l'acte via QRY/PRJ avant toute adoption. Refus, corrections et informations nouvelles restent séparés; acte ambigu/conditionnel ou scope incertain interdit l'adoption. Aucun moteur parallèle, seconde opération de classification, fallback suffixe ni write PRJ LLM.

Dans TERRA, cette cible réutilise l'appel déjà exécuté. Une confirmation aujourd'hui court-circuitée à zéro appel dans l'autre variante nécessiterait son passage explicite à l'appel conversationnel ordinaire et à l'admission financière; ce coût ne peut pas être présenté comme gratuit. Aucun appel réel n'a eu lieu.

Les 12 nouveaux tests utilisent des réponses simulées et huit formulations inédites, négations/corrections/actes mixtes. Ils caractérisent la frontière non adoptante et l'absence du champ décisionnel lié. Ils ne démontrent pas la compétence sémantique du LLM, ni une fonctionnalité de décision naturelle désormais réalisée.

## M3/M4 — Studio scientifique : preuve disponible

| Cas | État vérifié |
| --- | --- |
| Editorial DOCUMENT_ONLY | PASS_OFFLINE_ONLY : PRJ inchangé, WD non déclenché par la seule révision |
| PROJECT_CHANGE | PASS_OFFLINE_ONLY : contribution Studio native, Scientific Thinking, préparation/source-set, adoption PRJ gouvernée |
| AMBIGUOUS | PASS_OFFLINE_ONLY : blocage/clarification, pas de décision fabriquée |
| Refus humain | PASS_OFFLINE_ONLY : pas d'adoption |
| Save/Project obsolète | PASS_OFFLINE_ONLY : rejet exact et fermé |
| Nouvelle version documentaire | PASS_OFFLINE_ONLY : Project exact, archive antérieure immuable, ordinal après commit seulement |
| Concurrence | PASS_OFFLINE_ONLY : CAS et identité/source-set exacts, pas d'écrasement silencieux |
| Échec/reload | PASS_OFFLINE_ONLY : draft/intent et preuve provider conservés, récupération gouvernée |

Les régressions existantes de Scientific Thinking, refs coverage natives, producer 1.2.0, QRY/PRJ/adoption, mixed-source, intent/revision, archive, TRACE passive, continuité et finances passent dans la suite canonique. Pas de changement scientifique, d'assemblage pack ni d'identité/finalisation apporté par M2.

**Limite de la gate humaine réelle** : pour un delta exact déjà authored et non ambigu, le runtime peut dériver le reçu de confirmation du clic explicite Create Next et continuer l'adoption via le port PRJ. Il ne présente pas systématiquement une seconde revue après l'assessment. Pour M5, l'autorisation doit donc porter sur le changement synthétique exact, et le plan doit organiser l'inspection du delta avant adoption. Un clic Codex ne sera pas rapporté comme une adjudication scientifique humaine indépendante. Les ambiguïtés et choix supplémentaires restent non autorisés.

## M5 — Plan réel non exécuté

```text
REAL_SCIENTIFIC_CORRIDOR = NOT_QUALIFIED
REAL_PROVIDER_OPERATIONS = 0
REAL_DOCUMENT_GENERATIONS = 0
MEASURED_PROVIDER_COST = 0_THIS_MISSION
```

Préférence : session synthétique dédiée issue des fixtures gouvernées existantes, sans patients ni nouvelle génération payante pour recréer G1/G2. Scénario envisagé : un seul changement explicite monocentrique → multicentrique, sauvegardé et lié à un intent exact; inspection scientifique, adoption autorisée, pack suivant, reload et TRACE.

Le plan n'est pas encore autorisable sous sa forme exacte : origine isolée non allouée, session synthétique non créée, modèle/déploiement effectif et payloads figés non vérifiés, schéma Preview Studio incompatible. Prévision conditionnelle, non budget accordé : un assessment, au plus un WD combiné, DOC protocol + companion si nécessaire, soit au plus quatre opérations et une génération complète, aucun retry automatique. Les réutilisations exactes peuvent réduire ce nombre. Aucun plafond monétaire exact n'est inventé avant vérification des inputs/modèles/admissions; les guards soft/hard-stop ne seront pas modifiés pour faire passer le test.

## Qualification finale et historique

| Contrôle | Résultat final |
| --- | --- |
| Audit sémantique + régressions de liaison/reçus/schéma ciblées | 111/111 PASS, dont 12 nouveaux tests de caractérisation |
| Vérification schéma déterministe | 18/18 PASS dans la suite finale |
| PostgreSQL local runtime | 11/11 PASS natif |
| PostgreSQL local migrations | 19/19 PASS natif |
| Suite canonique | **6 148 PASS / 0 FAIL**, 0 collection errors |
| Stabilité | **168/168 PASS** |
| Sentinels | **309/309 PASS** |
| Golden two-version | **8/8 PASS_OFFLINE** |
| Typecheck | PASS |
| Lint | PASS, 0 erreurs / 7 avertissements préexistants |
| Build | PASS; avertissements de taille des bundles inchangés |
| Diff-check | PASS |

Les 13 skips et 1 todo préexistants restent inchangés. Aucun test, délai, exclusion ou validateur natif affaibli.

Un passage intermédiaire avec les ajouts lexicaux ensuite rejetés a produit **6 171 PASS / 1 FAIL**, sur `product-lifecycle-stability`, V1→V4/reload. Sa cause n'a pas été isolée : il n'est pas étiqueté comme défaut de ressources prouvé. Ce passage n'est pas la qualification finale. La suite finale après retrait exact et la stabilité séparée passent sans changement de délai. Les premiers échecs de harness/fixtures et leurs corrections sont conservés.

28 journaux, y compris les échecs, et les 42 sorties de tests sont conservés dans `/private/tmp/noxia-release-phase2.0Wr2cJ`, avec manifest SHA-256. Chaque sortie a été copiée et vérifiée avant retrait de son chemin généré dans le worktree; aucune donnée utilisateur n'a été déplacée. Les journaux originaux sont également conservés. Le nouveau test était indexé avant la découverte canonique `git ls-files`; il n'a pas été omis du passage final.

## Gates restantes / décisions requises

1. **Reconnaissance sémantique native** : adaptation ST/QRY/PRJ proposée, non réalisée. Selon moi, retenir le même appel ST avec binding exact est préférable à un dictionnaire ou classifieur parallèle : il conserve les propriétaires et évite un deuxième appel TERRA. En l'absence d'autorisation d'extension, ne pas revendiquer cette capacité produit.
2. **Schéma/Preview isolée** : autoriser séparément la vérification des données et l'installation explicite des seuls bindings manquants 004/005 sur Preview, puis le candidat isolé. Les installateurs doivent refuser les anciennes lignes invalides sans les réécrire. Sans accord, aucun DDL distant/déploiement du candidat; alias stable inchangé.
3. **Qualification scientifique réelle Option A** : après résolution des prerequisites, présenter pour accord une origine/session synthétique exacte, le delta et l'autorité humaine, le modèle, le nombre maximal d'opérations/générations et la borne de coût native vérifiée. Sans accord, aucun appel payant et aucun PASS_REAL.
4. **Rollback fonctionnel v4** : qualification encore requise d'une version de repli capable de conserver et retrouver les nouvelles données. La reprise legacy v3 est explicitement hors release; rollback SQL local et conservation de rows seuls ne ferment pas cette gate.
5. **Préparation Production** : modèle/transcription/configuration effectifs, migration readiness et stratégie sauvegarde/restauration doivent être vérifiés dans le paquet de release. Aucun accès en écriture, migration ou déploiement Production autorisé ici.

Pas d'arbitrage financier/provenance/grammaire restant : la décision produit est connue; son implémentation sémantique et les autorisations opérationnelles restent distinctes.

```text
ENGINEERING_FIXED = RUNTIME_DDL_SEPARATION_AND_PG17_18_COMPATIBILITY
SCIENTIFIC_WORKFLOW_QUALIFIED = OFFLINE_ONLY
HUMAN_DECISION_PENDING = EXACT_SYNTHETIC_TEST_AND_OPERATION_AUTHORIZATION
PRODUCTION_GATE_PENDING = YES
RUNTIME_DDL_REMOVED = YES_DOC_PRJ_NORMAL_RUNTIME
RUNTIME_LEAST_PRIVILEGE_TEST = PASS_11_LOCAL_NATIVE_CHECKS
MIGRATION_REHEARSAL = PASS_19_LOCAL_NATIVE_CHECKS
SCIENTIFIC_ASSESSMENT = PASS_OFFLINE_ONLY
SCIENTIFIC_CHANGE_DETECTED = PASS_OFFLINE_ONLY
HUMAN_DECISION_GATE = EXACT_NATIVE_RECEIPT_GUARDED_OFFLINE_NOT_SECOND_REVIEW_UI
PROJECT_V2_ADOPTION = PASS_OFFLINE_ONLY
DOCUMENT_NEXT_VERSION = PASS_OFFLINE_ONLY
ARCHIVE_IMMUTABILITY = PASS_OFFLINE_AND_LOCAL_NATIVE
WORKING_REVISION_PRESERVATION = PASS_OFFLINE_AND_LOCAL_NATIVE
TRACE_CORRELATION = PASS_OFFLINE_ONLY
PREVIEW_SESSION_PRESERVED = UNTOUCHED_NOT_REAL_RETESTED_THIS_MISSION
TARGETED_TESTS = 111/111_PLUS_11_NATIVE_RUNTIME_PLUS_19_NATIVE_MIGRATION
FULL_TESTS = 6148_PASS_0_FAIL_0_COLLECTION_ERRORS
STABILITY = 168/168_PASS
SENTINELS = 309/309_PASS
GOLDEN_CORRIDOR = 8/8_PASS_OFFLINE
TYPECHECK = PASS
LINT = PASS
BUILD = PASS
DIFF_CHECK = PASS
WORKTREE_CLEAN = NO_PREEXISTING_REPORT_DELETION_PRESERVED
RELEASE_CANDIDATE_READY = NO
MAIN_INTEGRATION_READY = NO
PRODUCTION_AUTHORIZATION_READY = NO
HUMAN_DECISIONS_REQUIRED = OWNER_EXTENSION_AND_EXPLICIT_PREVIEW_AND_EXACT_PAID_TEST_AUTHORIZATION
REMAINING_BLOCKERS = SEMANTIC_DECISION_RUNTIME_PREVIEW_BINDING_CONSTRAINTS_REAL_SCIENTIFIC_PROOF_FUNCTIONAL_V4_ROLLBACK_PRODUCTION_CONFIGURATION
NEXT_EXACT_ACTION = BOUNDED_ST_QRY_PRJ_CONTRACT_EXTENSION_DECISION_AND_AUTHORIZED_PREVIEW_SCHEMA_PLAN
PROVIDER_CALLS = 0
REMOTE_DB_WRITES = 0
DEPLOYMENT = NO
MAIN_CHANGED = NO
PRODUCTION_CHANGED = NO
PRODUCTION_MIGRATIONS_EXECUTED = NO
```
