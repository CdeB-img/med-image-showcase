# FROZEN-INTEGRATED-CAMPAIGN-02-BOUNDED-REPAIR — rapport d’implémentation

Date : 2026-09-07

Branche : `protocol-designer-canonical-ingestion`

HEAD avant mission : `ea4f7c4ee184f0b82ba09cc07f9fafb8cc859da1`

Baseline runtime gelée FIC02 : `992fc4ce8e2636de62418c5ef43108c8f0c36fd6`

## 1. Périmètre et preuves préservées

La mission a modifié uniquement la frontière de projection linguistique, son diagnostic déterministe, la propagation de configuration TRACE dans Standard, les événements TRACE nécessaires et leurs tests. Aucun router, QRY, owner scientifique, Project, TMP, DOC, définition de campagne ou enveloppe d’acceptation n’a été modifié.

- `validation/frozen-integrated-campaign-01/` : 37 fichiers préexistants, aucun fichier écrit pendant la mission.
- `validation/frozen-integrated-campaign-02/` : définitions suivies inchangées.
- `validation/frozen-integrated-campaign-02/execution-01/` : 23 artefacts non suivis préservés, aucun fichier écrit pendant la mission.
- 9 rapports historiques non suivis préservés hors commit.

Les contrôles post-validation ne montrent aucun chemin de campagne dans le diff et aucun fichier de ces périmètres n’a une date de modification postérieure au début de la mission.

## 2. Localisation causale FIC02-RC-01

Chaîne observée :

`executeLanguageProjection` → résultat structuré Gemini → `executeProtocolDesignerBridge` → `materializeLanguageProjectionArtifact` → `validateLanguageProjectionProviderResult` → `evaluateLinguisticInvariants` → rejet.

L’artefact `execution-01` ne conservait ni le résultat fournisseur ni le sous-invariant exact. Un unique witness Gemini explicitement autorisé, sans retry, a retourné HTTP 200 avec `gemini-3.5-flash-lite` et l’identifiant de réponse `jIKeauvZBqq4vdIPpYOdwAM`. La projection conservait nombres, négation et temporalité, mais utilisait la forme française conventionnelle `IRM` pour le terme source `MRI`.

Le validateur classait tout token ASCII en majuscules comme identifiant littéral. Il exigeait donc l’égalité du multiensemble `MRI`/`IRM`, produisait `IDENTIFIERS = UNKNOWN`, puis ajoutait le bloc `LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS`.

La source d’attente gelée impose simultanément :

- `DETERMINISTIC_CONTRACT_CHECKS_WITHOUT_LITERAL_TEXT_EQUALITY` ;
- préservation des identifiants ;
- préservation des entités scientifiques ;
- `literalTextEqualityRequired = false` ;
- `semanticInvariantPreservationRequired = true`.

La cause primaire est donc `D = INVALID_OR_INTERNALLY_INCONSISTENT_LANGUAGE_CONTRACT`, plus précisément l’implémentation déterministe du contrat : elle confondait acronymes scientifiques traduisibles et identifiants opaques exigeant une identité littérale.

## 3. Réparation de la frontière linguistique

La réparation reste bornée : le validateur accepte l’équivalence linguistique conventionnelle démontrée `MRI` ↔ `IRM`, de façon bijective dans le multiensemble. Les substitutions d’acronymes inconnus et d’identifiants opaques restent rejetées. Le prompt et le schéma fournisseur précisent la même frontière : forme conventionnelle de langue cible seulement pour la même entité ; copie littérale sinon.

Le résultat fournisseur reçoit un digest distinct du digest du texte traduit. En cas de rejet, `LanguageProjectionContractError` porte un diagnostic structuré contenant :

- les identifiants exacts des sous-invariants rejetés ;
- provider, modèle et identifiant de réponse ;
- digest du résultat fournisseur ;
- aucun texte fournisseur, prompt, secret ou credential.

L’API expose désormais un code stable `LANGUAGE_PROJECTION_CONTRACT_FAILED:<SUB_INVARIANT_ID>` et le client le propage jusqu’à TRACE.

`VALIDATION_RELAXED = NO` : l’égalité littérale reste exigée pour les identifiants non reconnus ; les nombres, unités, négations, incertitudes, conditions, comparaisons, temporalités et statuts restent fail-closed.

## 4. TRACE Level 2 Standard

La taxonomie supportait déjà les niveaux de capture, mais `ProtocolDesignerWorkspace` démarrait les runs Language Gateway et pre-Project sans configuration explicite. Le niveau demandé n’avait donc aucune liaison Standard et retombait sur `LEVEL_1_CORE`.

La page Standard accepte maintenant une demande explicite et bornée par `?traceCaptureLevel=LEVEL_2_DIAGNOSTIC`, construit la configuration existante, puis la propage au Workspace, au run Language Gateway et au segment pre-Project. Sans ce paramètre, le comportement reste `LEVEL_1_CORE`.

TRACE est étendu dans le système unique existant, avec un bump minimal du profil `1.2.0` vers `1.3.0` et lecture rétrocompatible de `1.0.0`, `1.1.0` et `1.2.0`.

Corridor de succès Level 2 :

`USER_TURN_RECEIVED` → `LANGUAGE_DETECTED` → `LANGUAGE_PROVIDER_RESULT_RECEIVED` → `LANGUAGE_PROJECTION_MATERIALIZATION_STARTED` → `LANGUAGE_PROJECTION_MATERIALIZED` → `PRODUCT_ENTRY_ROUTE_SELECTED`.

Corridor de rejet Level 2 :

`USER_TURN_RECEIVED` → `LANGUAGE_DETECTED` → `LANGUAGE_PROVIDER_RESULT_RECEIVED` → `LANGUAGE_PROJECTION_MATERIALIZATION_STARTED` → `LANGUAGE_PROJECTION_CONTRACT_REJECTED`.

Les événements enregistrent provider/modèle, digest et sous-invariant, sans texte intégral. Level 3 conserve ce corridor additif ; Core conserve les événements historiques compacts.

## 5. Qualification

- Fixture exacte du witness pré-réparation : `LANGUAGE_PROJECTION_CONTRACT_FAILED:LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS` (`MRI` vs `IRM`).
- Même forme fournisseur après réparation : PASS ; `IDENTIFIERS = PRESERVED`.
- Substitutions inconnues `ABC` → `XYZ` et `ABC-ID` → `ABC-ZZ` : rejetées.
- Provenance obligatoire absente : rejetée.
- Statut fournisseur malformé : rejeté.
- Nombres/unités corrompus : rejetés.
- Incertitude supprimée : rejetée.
- Négation supprimée : rejetée.
- Ambiguïté non attestée : rejetée.
- FR, EN, JA, ZH, MIXED, AMBIGUITY, PROVIDER_FAILURE et DEDUPLICATION : PASS.
- Input français : zéro appel de projection.
- Standard/Expert : état partagé inchangé ; TRACE Level 2 explicite effectif.
- Tests ciblés uniques : 12 fichiers, 81 PASS, 1 TODO (`B11`).
- B01–B20 : 23 PASS, 1 TODO (`B11 = TODO_NOT_TESTABLE`).
- TypeScript : PASS.
- Lint du périmètre affecté : PASS, 0 warning.
- Build Production : PASS.
- `git diff --check` : PASS.
- Suite complète canonique : 234 fichiers PASS, 2 fichiers ignorés, 1 fichier FAIL ; 3 599 tests PASS, 12 SKIP, 1 TODO, 1 FAIL.
- Échec unique : `src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx`, historique et inchangé.
- Nouvelles régressions : 0.

## 6. Résultat formel

```text
MISSION_STATUS = QUALIFIED_READY_FOR_FIC02_REPLAY

HEAD_BEFORE = ea4f7c4ee184f0b82ba09cc07f9fafb8cc859da1
HEAD_AFTER = COMMIT_CONTAINING_THIS_REPORT; EXACT_SHA_IN_FINAL_HANDOFF
COMMIT_OR_COMMITS = ONE_BOUNDED_LOCAL_COMMIT
REPAIR_BASELINE_RUNTIME_SHA = 992fc4ce8e2636de62418c5ef43108c8f0c36fd6
REPAIR_CANDIDATE_RUNTIME_SHA = COMMIT_CONTAINING_THIS_REPORT; EXACT_SHA_IN_FINAL_HANDOFF

ROOT_CAUSE = FIC02-RC-01-LANGUAGE-PROJECTION-CONFORMANCE-REJECTION
EXACT_REJECTING_FUNCTION = materializeLanguageProjectionArtifact via validateLanguageProjectionProviderResult/evaluateLinguisticInvariants
EXACT_REJECTING_PREDICATE = any linguistic invariant with status UNKNOWN adds LINGUISTIC_INVARIANT_UNVERIFIED:<ID>; any block makes validation invalid and materialization throws
EXACT_REJECTED_SUB_INVARIANT = LINGUISTIC_INVARIANT_UNVERIFIED:IDENTIFIERS
EXPECTED_VALUE = PRESERVED
OBSERVED_VALUE = UNKNOWN; sourceEvidence=[MRI]; targetEvidence=[IRM]
PRIMARY_CAUSAL_SUBTYPE = D_INVALID_OR_INTERNALLY_INCONSISTENT_LANGUAGE_CONTRACT

REPAIR_OWNER = CONVERSATION_LANGUAGE_GATEWAY_DETERMINISTIC_CONFORMANCE
REPAIR_DESCRIPTION = BOUNDED_MRI_IRM_LANGUAGE_ACRONYM_EQUIVALENCE; UNKNOWN_ACRONYMS_AND_OPAQUE_IDENTIFIERS_REMAIN_LITERAL_AND_FAIL_CLOSED; STRUCTURED_SUB_INVARIANT_DIAGNOSTIC
VALIDATION_RELAXED = NO
INVALID_PROJECTIONS_STILL_REJECTED = PASS

TRACE_LEVEL2_BINDING_ROOT_OWNER = FUNCTIONAL_RESET_STANDARD_CONFIGURATION_BINDING
TRACE_VERSION_BEFORE = 1.2.0
TRACE_VERSION_AFTER = 1.3.0
TRACE_CAPTURE_LEVEL_REQUESTED = LEVEL_2_DIAGNOSTIC
TRACE_CAPTURE_LEVEL_EFFECTIVE = LEVEL_2_DIAGNOSTIC
TRACE_LEVEL2_STANDARD_BINDING = PASS
EXACT_REJECTED_SUB_INVARIANT_OBSERVABLE = PASS

DETERMINISTIC_PRE_REPAIR_REPRODUCTION = FAIL_AS_EXPECTED
DETERMINISTIC_POST_REPAIR_RESULT = PASS
LIVE_WITNESS = EXECUTED_ONCE_NO_RETRY_FOR_CAUSAL_LOCALIZATION; POST_REPAIR_REUSED_DETERMINISTICALLY
LANGUAGE_GATEWAY_LIVE_WITNESS_CALLS = 1

FR = PASS
EN = PASS
JA = PASS
ZH = PASS
MIXED = PASS
AMBIGUITY = PASS
PROVIDER_FAILURE = PASS
DEDUPLICATION = PASS

PRODUCT_ENTRY_ROUTER_SEMANTICS_CHANGED = NO
QRY_SEMANTICS_CHANGED = NO
PROJECT_SEMANTICS_CHANGED = NO
SCIENTIFIC_OWNER_FILES_CHANGED = 0

FIC01_FILES_CHANGED = 0
FIC02_DEFINITION_FILES_CHANGED = 0
FIC02_EXECUTION_01_FILES_CHANGED = 0

TARGETED_TESTS = 12_FILES; 81_PASS; 1_TODO_B11
B01_B20_STATUS = 23_PASS; 1_TODO_NOT_TESTABLE_B11
TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
GIT_DIFF_CHECK = PASS

FULL_SUITE_PASS = 3599
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 1
HISTORICAL_FAILURES = src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx
NEW_REGRESSIONS = 0

TRACKED_WORKTREE_CHANGES = 0_AFTER_COMMIT
STAGED_FILES = 0_AFTER_COMMIT
PRESERVED_UNTRACKED_REPORTS = 9
PRESERVED_FIC02_EXECUTION_ARTIFACTS = 23

PUSH = NO
DEPLOYMENT = NO
PRODUCTION_LIVE_TEST = NO
NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

Le SHA du commit contenant ce rapport ne peut pas être inscrit dans son propre contenu sans récursion. `REPAIR_CANDIDATE_RUNTIME_SHA` est donc le commit local contenant ce fichier et est rapporté après création dans le handoff final.
