# FIC02-BOUNDED-REPAIR-03 — Rapport de réparation et qualification

Date : 2026-09-07

Repository : `/Users/charles/Documents/Projets/NOXIA/noxia-dev`

Branche : `protocol-designer-canonical-ingestion`

## Décision

```ini
MISSION_STATUS = QUALIFIED_FIC02_REPLAY_04_CANDIDATE_READY
HEAD_BEFORE = 21298aca050a14bb58ce7187955c100464b4d803
HEAD_AFTER_PRODUCT_REPAIR = f0a419cf7eb9bc0632d103e681e2fba34a5cda61
HEAD_AFTER = GIT_COMMIT_CONTAINING_THIS_REPORT
NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY_04

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

`HEAD_AFTER` ne peut pas contenir son propre SHA sans récursion. Le SHA exact du commit documentaire est donc rapporté par l'état Git final de la mission.

## Baseline et limites d'autorisation

- La branche et le HEAD initiaux correspondaient exactement au préflight.
- Aucun fichier normatif, owner scientifique, scénario/Acceptance Envelope FIC01/FIC02 ou artefact d'exécution FIC02 `execution-01/02/03` n'a été modifié.
- Les conclusions historiques ont été requalifiées contre le code courant avant toute réparation.
- Aucun replay FIC02, appel provider, push ou déploiement n'a été exécuté.

## Forensic du retry execution-03

```ini
RETRY_FORENSIC_CLASSIFICATION = FROZEN_RUNTIME_ALLOWED_RETRY
RETRY_COMPONENT = executeProtocolDesignerBridge.executeAndValidateExtraction
RETRY_SCENARIO = D
RETRY_STAGE = AFTER_OPENAI_RESPONSE_AND_DETERMINISTIC_PROJECT_VALIDATION_REJECTION
RETRY_TRANSPORT_CLASS = NOT_A_TRANSPORT_RETRY
RETRY_NEW_PROVIDER_GENERATION = YES
RETRY_ALLOWED_BY_FROZEN_RUNTIME_POLICY = YES
RETRY_IMPACT_ON_EXECUTION_03_EVIDENCE = FIRST_ATTEMPT_REMAINS_PROBATIVE; SECOND_GENERATION_REPEATED_THE_SAME_INVALID_POPULATION_TO_POPULATION_RELATION; CAUSAL_LOCALIZATION_STRENGTHENED; SCIENTIFIC_OBSERVATION_UNCHANGED
```

Le second appel OpenAI a été déclenché par `isRecoverablePersistentValidationFailure` après rejet déterministe de la première sortie. Il constitue matériellement une nouvelle génération post-rejet, bien que la politique gelée le classe comme retry autorisé. L'exécution-03 n'est pas invalidée : la première sortie suffit à démontrer le défaut et la seconde reproduit la même relation invalide ; le Project reste inchangé.

## Matrice causale avant modification

| Causal item | Reported owner | Directly observed owner/function | Input correct | Output incorrect | Root cause | Generic repair | Normative/new owner |
|---|---|---|---|---|---|---|---|
| RC05 Router A/C | Product Entry Router | `deriveRoutingIntent`, `routeProductEntry` | Oui : finalité et dimensions non décidées présentes | Oui : `UNDERSTAND`, construction non atteignable | Détection de finalité ouverte dépendante de l'ordre lexical et écrasement de l'intention secondaire constructive | Oui, dans le Router existant | Non / non |
| RC06 A/B | Language Gateway | prompt/schema + `providerSemanticInvariants` | A : invariant absent ; B : attestation provider non verbatim | A : absence assimilée à perte ; B : sortie rejetée correctement mais contrat insuffisamment explicite | Sémantique `preserved` surchargée pour l'absence + schéma de preuve ambigu ; la provenance verbatim reste nécessaire | Oui, dans le contrat existant | Non / non |
| RC07 C | Language Gateway | `validateLanguageProjectionProviderResult`, `materializeLanguageProjectionArtifact`, `buildLocalizedConversationResponse` | Réponse canonique française et cible anglaise connues | Oui : texte français accepté `SUCCEEDED` | Aucun état obligatoire ne décrivait la langue réellement produite | Oui, attestation de langue de sortie + frontière d'état fail-closed | Non / non |
| RC08 D | Product Bridge adapter | extraction → materialisation → `validatePersistentProjectDelta` | Deux objets `POPULATION` légitimes | Relation optionnelle `COMPARES_WITH` incompatible bloquait tout le candidat | L'adaptateur transmettait une relation incompatible malgré le catalogue existant ; le validator Project était correct | Oui, contrainte générique issue du catalogue avant validation Project | Non / non |

Classifications : RC05 `CONFIRM`, RC06 `REQUALIFY`, RC07 `CONFIRM`, RC08 `CONFIRM`.

## RC05 — finalité constructive

```ini
RC05_FINAL_CAUSAL_CLASSIFICATION = CONFIRM
RC05_ACTUAL_OWNER = PRODUCT_ENTRY_ROUTER / deriveRoutingIntent
RC05_GENERIC_REPAIR = DEDUPLICATED_ROUTING_CORPUS + ORDER_INDEPENDENT_EXPLICIT_OPEN_DECISION_WITH_STRUCTURAL_STUDY_EVIDENCE + SECONDARY_CONSTRUCTION_INTENT_PRESERVATION
RC05_TARGETED_TESTS = PASS
```

La réparation ne repose ni sur un nom de design, ni sur un score, ni sur la complexité apparente. Elle exige une finalité structurée : construction explicite, validation méthodologique explicitement constructive, ou décision ouverte associée à plusieurs dimensions structurelles déjà représentées. Une demande explicative/comparative pure reste non constructive ; `UNDERSTAND` peut rester l'intention primaire avec `DESIGN_STUDY` en intention secondaire.

Témoins génériques : comprendre seul, comparer seul, construire, comprendre + construire, comparer + construire, validation constructive avec décisions ouvertes, follow-up lexicalement pauvre après construction, changement explicite vers non-construction.

## RC06 — attestation sémantique structurée

```ini
RC06_FINAL_CAUSAL_CLASSIFICATION = REQUALIFY
RC06_ACTUAL_OWNER = CONVERSATION_LANGUAGE_GATEWAY / provider schema + providerSemanticInvariants
RC06_GENERIC_REPAIR = ABSENT_INVARIANT_IS_NOT_APPLICABLE; PRESENT_INVARIANT_REQUIRES_PRESERVED_TRUE_AND_VERBATIM_SOURCE_TARGET_EVIDENCE; COMPLETE_UNIQUE_FIVE_INVARIANT_SET_REQUIRED
RC06_TARGETED_TESTS = PASS
```

Le booléen n'est plus une auto-certification opaque : chaque invariant présent exige une preuve source/cible bornée et verbatim. Une perte déclarée, une attestation manquante, une duplication, une preuve hors texte ou une preuve attachée à un invariant absent est rejetée. Le déterministe ne prétend pas prouver l'équivalence sémantique générale ; la same-call attestation reste une preuve structurée contrôlable, pas un oracle indépendant.

## RC07 — état de localisation

```ini
RC07_FINAL_CAUSAL_CLASSIFICATION = CONFIRM
RC07_ACTUAL_OWNER = CONVERSATION_LANGUAGE_GATEWAY / validateLanguageProjectionProviderResult + materializeLanguageProjectionArtifact + buildLocalizedConversationResponse
RC07_GENERIC_REPAIR = REQUIRED_TRANSLATED_TEXT_LANGUAGE_ATTESTATION + TARGET_LANGUAGE_MATCH_BEFORE_SUCCEEDED + EXACT_UNCHANGED_CROSS_LANGUAGE_PROJECTION_REJECTION + LOCALIZATION_BOUNDARY_RECHECK
RC07_TARGETED_TESTS = PASS
```

Le contrat `1.2.0` exige désormais la langue effectivement utilisée dans `translatedText`. Un mismatch avec la cible empêche `SUCCEEDED`; une projection strictement inchangée entre deux langues demandées différentes est également refusée. La frontière de rendu revérifie la cohérence entre langue de conversation, cible et artefact. La réponse canonique française reste intacte et la localisation ne mute ni Project ni décision scientifique.

Limite conservée : l'attestation de langue est produite dans le même appel et n'est pas un juge sémantique indépendant. En l'absence d'appel provider autorisé, la mission qualifie le contrat local et son fail-closed ; l'effectivité provider est réservée au replay FIC02 versionné suivant.

## RC08 — relations persistantes

```ini
RC08_FINAL_CAUSAL_CLASSIFICATION = CONFIRM
RC08_ACTUAL_OWNER = PRODUCT_BRIDGE_ADAPTER / constrainPersistentRelationsToCanonicalSignatures
RC08_GENERIC_REPAIR = RESOLVE_ENDPOINT_TYPES_FROM_EXISTING_CANONICAL_CATALOG; OMIT_ONLY_RESOLVED_INCOMPATIBLE_OPTIONAL_RELATION; PRESERVE_OBJECTS; NEVER_SUBSTITUTE
RC08_TARGETED_TESTS = PASS
```

Le helper réutilise `PERSISTENT_PROJECT_RELATION_ENDPOINT_SIGNATURES` et le même mapping de types canoniques que le validator. Il n'omet une relation que si son type appartient au vocabulaire, que ses deux extrémités sont résolues et que la signature est incompatible. Les types non autorisés et références inconnues restent transmis au validator, qui continue à les rejeter fail-closed. L'artefact provider exact reste disponible ; le candidat Project reçoit les objets sans relation inventée.

## Qualification

```ini
ROUTER_TARGETED_TESTS = PASS (32 assertions/tests across 3 suites; 8 mission-specific witnesses)
LANGUAGE_TARGETED_TESTS = PASS (43 tests / 2 suites)
PERSISTENT_EXTRACTION_TARGETED_TESTS = PASS (16 tests / 3 suites; 3 mission-specific witnesses)
TRACE_TARGETED_TESTS = PASS (TRACE v2 suites included in 108-test transversal qualification)
AFFECTED_STANDARD_REGRESSION_TESTS = PASS (Standard projection and multilingual UI included)
TARGETED_TRANSVERSAL_TESTS = 13 files / 108 PASS

PURE_COMPARATIVE_STAYS_NON_CONSTRUCTION = PASS
EXPLICIT_CONSTRUCTION_REACHABLE = PASS
SECONDARY_CONSTRUCTION_INTENT_PRESERVED = PASS
LEGITIMATE_UNDERSTAND_PRESERVED = PASS
LEGITIMATE_UNDERSTAND_ROUTE_PRESERVED = PASS

SEMANTIC_ATTESTATION_WITH_EVIDENCE = PASS
DECLARED_SEMANTIC_LOSS_REJECTED = PASS
MISSING_REQUIRED_ATTESTATION_REJECTED = PASS
VISIBLE_LANGUAGE_REQUIREMENT_SATISFIED_BEFORE_SUCCESS = PASS_STRUCTURAL_CONTRACT
FAILED_LOCALIZATION_CANNOT_REPORT_SUCCEEDED = PASS
CANONICAL_FRENCH_RESPONSE_PRESERVED = PASS
CONVERSATION_LANGUAGE_DISTINCT_FROM_CANONICAL_LANGUAGE = PASS
NO_PROJECT_MUTATION_FROM_LOCALIZATION = PASS

PROVIDER_RELATION_OUTPUT_BOUNDED_BY_CANONICAL_SIGNATURES = PASS
INVALID_ENDPOINT_SIGNATURE_CANNOT_REACH_PROJECT_WRITE = PASS
NO_VALID_RELATION_MEANS_RELATION_OMITTED = PASS
OBJECTS_PRESERVED_WHEN_RELATION_OMITTED = PASS
PROJECT_VALIDATOR_REMAINS_FAIL_CLOSED = PASS
NO_NEAREST_RELATION_SUBSTITUTION = PASS

RC04_UNITS_REGRESSION = PASS; PROSE_FALSE_UNIT_POSITIVE=0; 3_T_TO_1_5_T_REJECTED; 40_MS_TO_40_S_REJECTED; 5_MG_TO_5_G_REJECTED

TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS_WITH_INHERITED_NON_BLOCKING_WARNINGS
GIT_DIFF_CHECK = PASS

FULL_SUITE_PASS = 3642
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 1
HISTORICAL_FAILURES = src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx
NEW_REGRESSIONS = 0
```

Le fichier historique en échec n'est pas modifié entre `HEAD_BEFORE` et le candidat. Les avertissements de build concernent Browserslist, une annotation Rollup, une règle CSS préexistante et la taille des chunks ; ils n'ont pas bloqué le build.

## Commits produit

```ini
COMMITS =
a21d0daf6f897cd97ea3871ed2e6eefbe748ef6d fix(protocol-designer): preserve constructive scientific finality in entry routing
8b94c548b357839a4ed4cf6cd0f1861e2e6faa8d fix(language): harden semantic attestation and localization state contracts
f0a419cf7eb9bc0632d103e681e2fba34a5cda61 fix(project): constrain persistent relations to canonical signatures
```

Delta produit avant rapport : 8 fichiers, 590 insertions, 27 suppressions.

## Gouvernance et préservation

```ini
NEW_OWNER_CREATED = 0
NEW_ENGINE_CREATED = 0
NEW_TRACE_SYSTEM_CREATED = 0
TERM_SPECIFIC_TRANSLATION_DICTIONARY = 0
SCIENTIFIC_OWNER_FILES_CHANGED = 0
NORMATIVE_FILES_CHANGED = 0

PROVIDER_CALLS = 0
PUSH = NO
DEPLOYMENT = NO
FIC02_REPLAY = NO

PRESERVED_UNTRACKED_REPORTS = 9
PRESERVED_FIC01_FILES = 37
PRESERVED_FIC02_EXECUTION_01_FILES = 23
PRESERVED_FIC02_EXECUTION_02_FILES = 24
PRESERVED_FIC02_EXECUTION_03_FILES = 32
```

Après le commit de ce rapport, les valeurs finales attendues sont :

```ini
TRACKED_WORKTREE_CHANGES = 0
STAGED_FILES = 0
```

## Gate provider

```ini
LIVE_PROVIDER_EVIDENCE_REQUIRED = NO_FOR_LOCAL_CANDIDATE_QUALIFICATION
LIVE_PROVIDER_BEHAVIOR_DEMONSTRATED = NO
LIVE_PROVIDER_EFFECTIVENESS_GATE = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY_04
```

La qualification locale démontre les contrats, frontières et comportements déterministes du candidat. Elle ne transforme pas les mocks en preuve d'un comportement Gemini/OpenAI live et ne préjuge pas le résultat de Replay-04.
