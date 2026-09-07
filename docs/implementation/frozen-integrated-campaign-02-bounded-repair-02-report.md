# FROZEN-INTEGRATED-CAMPAIGN-02-BOUNDED-REPAIR-02 — Rapport de qualification

## A. Périmètre et baseline

```makefile
MISSION_STATUS = QUALIFIED_REPLAY_CANDIDATE_READY
HEAD_BEFORE = e6749ac1bccfb31d688b1b16d573c4ab4c551415
HEAD_AFTER = COMMIT_CONTAINING_THIS_REPORT
COMMITS = 0e4c2e217d8eb0dfb83938adfd86938699315412 + COMMIT_CONTAINING_THIS_REPORT

SOURCE_EXECUTION = FIC02-EXECUTION-02-20260907
BRANCH = protocol-designer-canonical-ingestion
PROVIDER_CALLS = 0
PUSH = NO
DEPLOYMENT = NO
FIC02_REPLAY = NO
```

La mission a conservé sans modification les définitions gelées, les Acceptance Envelopes et les exécutions historiques. Aucun scénario A–D n'a été rejoué. Les projections françaises exactes de A/C et la sortie provider exacte de B/D n'étant pas présentes dans la preuve Level 2 historique, elles n'ont pas été reconstruites.

Les autorités courantes ont été routées avant modification : `SOURCE-OF-TRUTH-INDEX`, contrat d'orchestration RDE/intentions, PD-009, Product Specification, UX applicable, Scientific Product Manifesto V2 et contrats courants de langue/conversation. Aucun contrat normatif n'a été modifié.

## B. RC02 — Product Entry Router

```makefile
RC02_REPORTED_CLASS = FIC02-RC-02-PRODUCT-ENTRY-REQUIRED-CONSTRUCTION-CORRIDOR-UNREACHABLE
RC02_FINAL_CAUSAL_CLASSIFICATION = SECONDARY_CONSTRUCTION_INTENT_OR_REACHABILITY_LOSS
RC02_ACTUAL_OWNER = PRODUCT_ENTRY_ROUTER
RC02_EXACT_FUNCTION_OR_RULE = deriveRoutingIntent + routeProductEntry + ProtocolDesignerWorkspace UNDERSTAND shortcut
RC02_TRANSLATION_FIDELITY_ROLE = HISTORICAL_A_C_EXACT_FRENCH_PROJECTION_NOT_CAPTURED; NO_HISTORICAL_FIDELITY_CLAIM
ROUTER_INPUT_SEMANTIC_FIDELITY_ESTABLISHED_FOR_REPAIR = NOT_REQUIRED
```

Le défaut démontré par le code était structurel : le modèle ne pouvait représenter qu'une intention de route principale, `projectConstructionEligible` dépendait de `routeIntent === DESIGN_STUDY`, et le raccourci local `UNDERSTAND` empêchait donc l'accès au corridor de construction. Un `UNDERSTAND` principal légitime ne pouvait pas coexister avec une finalité secondaire de construction.

La réparation :

- représente `secondaryRouteIntents` et `constructionIntentPresent` ;
- fonde l'éligibilité sur une finalité structurée démontrée, et non sur le score de route, la complexité ou la simple présence de noms de designs ;
- conserve les intentions de construction primaires ou secondaires pendant un follow-up peu informatif ;
- préserve `UNDERSTAND` comme intention principale lorsque légitime ;
- ne prend le raccourci local `UNDERSTAND` que si aucune construction n'est éligible ;
- expose cette séparation dans TRACE v2 sans créer de second système de trace.

```makefile
RC02_REPAIR = PRESERVE_PRIMARY_AND_SECONDARY_INTENTS; DERIVE_CONSTRUCTION_ELIGIBILITY_FROM_STRUCTURED_FINALITY; KEEP_MIXED_INTENT_CONSTRUCTION_REACHABLE
PURE_COMPARATIVE_STAYS_NON_CONSTRUCTION = PASS
EXPLICIT_CONSTRUCTION_REACHABLE = PASS
SECONDARY_CONSTRUCTION_INTENT_PRESERVED = PASS
LEGITIMATE_UNDERSTAND_PRESERVED = PASS
LEGITIMATE_UNDERSTAND_ROUTE_PRESERVED = PASS
REQUIRED_CONSTRUCTION_CORRIDOR_REACHABLE = PASS
```

## C. RC03 — invariants sémantiques de projection

```makefile
RC03_REPORTED_CLASS = FIC02-RC-03-LANGUAGE-GATEWAY-INPUT-UNCERTAINTY-CONFORMANCE
RC03_FINAL_CAUSAL_CLASSIFICATION = PROVIDER_STRUCTURED_EVIDENCE_CONTRACT_INSUFFICIENT_AND_DETERMINISTIC_REGEX_OVERCLAIM
RC03_EXACT_FUNCTION_OR_RULE = semanticMarkerInvariant + validateConversationLanguageProjection
RC03_SOURCE_EVIDENCE = HISTORICAL_SOURCE_MARKER("may")
RC03_TARGET_EVIDENCE = NOT_CAPTURED_AT_LEVEL_2_DIAGNOSTIC
RC03_PROVIDER_SEMANTIC_LOSS = UNKNOWN
RC03_VALIDATOR_FALSE_NEGATIVE = UNKNOWN_FOR_EXECUTION_02; GENERIC_FALSE_NEGATIVE_CLASS_DEMONSTRATED
```

Une liste fermée de marqueurs lexicaux ne peut pas prouver la conservation générale de la portée sémantique d'une incertitude. L'absence de la sortie provider historique interdit d'attribuer le défaut B à Gemini ou de conclure sur cette traduction précise.

La réparation ajoute au résultat structuré du même appel provider une attestation bornée pour les cinq invariants (`NEGATION`, `UNCERTAINTY`, `CONDITIONALITY`, `COMPARISON`, `TEMPORAL_RELATION`) :

- `invariantId` ;
- `sourcePresent` ;
- `preserved` ;
- `sourceEvidence` ;
- `targetEvidence`.

Le runtime contrôle déterministiquement le schéma, la cardinalité exacte, les doublons, la présence des preuves requises, leur provenance verbatim dans la source/cible et les incohérences structurelles objectivement vérifiables. `preserved = false`, une attestation obligatoire absente ou une preuve obligatoire absente provoquent un rejet fail-closed. Les regex locales restent classées `STRUCTURALLY_CHECKABLE`, jamais `SEMANTICALLY_PROVEN`. Aucun dictionnaire croissant de synonymes et aucun second appel LLM n'ont été ajoutés.

```makefile
RC03_REPAIR = SAME_CALL_STRUCTURED_SEMANTIC_ATTESTATION_WITH_BOUNDED_SOURCE_AND_TARGET_EVIDENCE
SEMANTIC_ATTESTATION_WITH_EVIDENCE = PASS
DECLARED_SEMANTIC_LOSS_REJECTED = PASS
MISSING_REQUIRED_ATTESTATION_REJECTED = PASS
UNCERTAINTY_FALSE_POSITIVE_OR_REAL_LOSS_RESOLVED = YES
TRUE_UNCERTAINTY_LOSS_STILL_REJECTED = PASS
```

## D. RC04 — unités et quantités

```makefile
RC04_REPORTED_CLASS = FIC02-RC-04-LANGUAGE-GATEWAY-OUTPUT-UNITS-CONFORMANCE
RC04_FINAL_CAUSAL_CLASSIFICATION = DETERMINISTIC_UNIT_LEXICAL_FALSE_POSITIVE
RC04_EXACT_FUNCTION_OR_RULE = previous exact("UNITS", isolated-unit-word-boundary-regex) + exactMultisetPreserved
RC04_SOURCE_EVIDENCE = DETERMINISTIC_WITNESSES "d’étude" AND "d’analyse" EACH PRODUCED FALSE UNIT TOKEN "d"
RC04_TARGET_EVIDENCE = HISTORICAL_D_TARGET_NOT_CAPTURED_AT_LEVEL_2_DIAGNOSTIC
RC04_PROVIDER_SEMANTIC_LOSS = UNKNOWN
RC04_VALIDATOR_FALSE_POSITIVE = YES
```

L'ancien prédicat considérait des lettres isolées (`d`, `s`, `m`, `h`, `g`, `L`, `T`) comme des unités scientifiques indépendamment d'une quantité. La réparation extrait exclusivement des quantités structurées `nombre + unité`. Elle élimine les faux positifs de prose tout en rejetant les corruptions réelles de nombres et d'unités (`3 T → 1.5 T`, `40 ms → 40 s`, `5 mg → 5 g`).

```makefile
RC04_REPAIR = MEASURED_QUANTITY_EXTRACTION_NUMBER_PLUS_UNIT
PROSE_FALSE_UNIT_POSITIVE = 0
TRUE_QUANTITY_CORRUPTION_REJECTED = PASS
UNITS_FALSE_POSITIVE_OR_REAL_LOSS_RESOLVED = YES
```

## E. Responsabilités et cause commune

```makefile
RC03_RC04_SHARED_DEEP_CAUSE = NO
SHARED_LANGUAGE_ROOT_CAUSE_ID = NOT_APPLICABLE
TERM_SPECIFIC_TRANSLATION_DICTIONARY = 0

PROTECTED_OPAQUE_LITERAL_CONTRACT = DETERMINISTIC_EXACT_PRESERVATION_FAIL_CLOSED
UNCERTAINTY_VALIDATION_RESPONSIBILITY = PROVIDER_SAME_CALL_ATTESTATION + DETERMINISTIC_SCHEMA_PROVENANCE_AND_STRUCTURAL_CHECKS
UNIT_VALIDATION_RESPONSIBILITY = DETERMINISTIC_STRUCTURED_QUANTITY_IDENTITY
LLM_SEMANTIC_TRANSLATION_RESPONSIBILITY = LINGUISTIC_REALIZATION_AND_SEMANTIC_PRESERVATION_ATTESTATION
DETERMINISTIC_VALIDATION_RESPONSIBILITY = SCHEMA_CARDINALITY_PROVENANCE_EVIDENCE_PRESENCE_PROTECTED_LITERALS_NUMBERS_AND_STRUCTURED_QUANTITIES
```

RC03 et RC04 partagent une leçon de frontière de preuve, mais pas le même mécanisme causal : RC03 concernait une attestation sémantique insuffisante et une surinterprétation de marqueurs ; RC04 était un faux positif lexical précis dans l'extraction d'unités.

## F. TRACE v2 et appels externes

```makefile
TRACE_LEVEL2_EFFECTIVE = PASS
TRACE_DIAGNOSTIC_CHANGES = EXISTING_ROUTE_SELECTED_AND_INTENT_REPRESENTED_EVENTS_NOW_INCLUDE_SECONDARY_INTENTS_CONSTRUCTION_FINALITY_AND_ELIGIBILITY_IN_BOUNDED_DIGESTS

LANGUAGE_FORENSIC_LIVE_CALLS = 0
LIVE_CALL_ATTEMPT_BLOCKED_BEFORE_PROVIDER = YES
PROVIDER_RESPONSE_RECEIVED = NO
SCIENTIFIC_PROVIDER_CALLS = 0
OPENAI_CALLS = 0
PROVIDER_RETRIES = 0
```

Le blocage local/réseau du témoin B s'est produit avant tout provider et n'est pas classé comme défaillance provider. La fermeture causale a été obtenue par preuves de code et témoins déterministes ; aucun contournement du sandbox n'a été effectué.

## G. Qualification

```makefile
ROUTER_TARGETED_TESTS = 10 PASS
LANGUAGE_TARGETED_TESTS = 33 PASS
B01_B20_STATUS = B01-B10 PASS; B11 TODO_NOT_TESTABLE; B12-B20 PASS
TRACE_TARGETED_TESTS = 26 PASS
AFFECTED_STANDARD_REGRESSION_TESTS = 83 PASS

TYPESCRIPT = PASS
AFFECTED_LINT = PASS
PRODUCTION_BUILD = PASS
GIT_DIFF_CHECK = PASS

FULL_SUITE_PASS = 3611
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 1
HISTORICAL_FAILURES = src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx
NEW_REGRESSIONS = 0

PROTECTED_LITERAL_CORRUPTION_STILL_REJECTED = PASS
SCIENTIFIC_OWNER_FILES_CHANGED = 0
```

Une première tentative de suite complète pendant le développement a exposé 16 régressions sur la continuité multi-tour de l'éligibilité après une intention `DESIGN_STUDY`. Elles ont été corrigées au niveau propriétaire, puis les neuf fichiers affectés ont repassé 83/83 tests. La suite canonique exécutée sur le candidat final ne conserve que l'échec historique `p-web-02-contract.test.tsx`.

## H. Frontière Git et préservation

```makefile
FIC01_FILES_CHANGED = 0
FIC02_DEFINITION_FILES_CHANGED = 0
FIC02_EXECUTION_01_FILES_CHANGED = 0
FIC02_EXECUTION_02_FILES_CHANGED = 0

TRACKED_WORKTREE_CHANGES = 0 (required after bounded commits)
STAGED_FILES = 0 (required after bounded commits)
PRESERVED_UNTRACKED_REPORTS = 9
PRESERVED_FIC01_EXECUTION_FILES = 20
PRESERVED_FIC02_EXECUTION_01_FILES = 23
PRESERVED_FIC02_EXECUTION_02_FILES = 24

PUSH = NO
DEPLOYMENT = NO
FIC02_REPLAY = NO
```

Les deux commits bornés séparent la frontière Language Gateway de la frontière Product Entry Router/TRACE. Aucun nettoyage, reset, stash, push ou déploiement n'a été réalisé.

## I. Décision

```makefile
MISSION_STATUS = QUALIFIED_REPLAY_CANDIDATE_READY

NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY_03

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

L'exécution suivante devra créer `validation/frozen-integrated-campaign-02/execution-03/` avec les mêmes scénarios A–D anglais, les mêmes définitions, Acceptance Envelopes et fact packets, sans réparation entre A–D et avec TRACE Level 2 effectif.
