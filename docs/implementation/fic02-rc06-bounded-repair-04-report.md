# FIC02-RC06-BOUNDED-REPAIR-04 — Rapport de réparation et qualification

Date : 2026-09-07

Repository : `/Users/charles/Documents/Projets/NOXIA/noxia-dev`

Branche : `protocol-designer-canonical-ingestion`

## Décision

```ini
MISSION_STATUS = QUALIFIED_FIC02_REPLAY_05_CANDIDATE_READY
HEAD_BEFORE = 0af71dd20c156468d7fbc270ce955e3ed0bbc2a2
HEAD_AFTER_PRODUCT_REPAIR = 55bf290bb7301fb9cf229ee7a96f71c2b3d9706f
HEAD_AFTER = GIT_COMMIT_CONTAINING_THIS_REPORT
COMMITS = 55bf290bb7301fb9cf229ee7a96f71c2b3d9706f fix(language): clarify semantic evidence claims and preserve rejected witnesses
NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY_05

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

`HEAD_AFTER` ne peut pas contenir son propre SHA sans récursion. Le SHA exact du commit documentaire est rapporté par l’état Git final de la mission.

## Baseline, autorité et frontière

- Le préflight a confirmé le repository, la branche, `HEAD=0af71dd20c156468d7fbc270ce955e3ed0bbc2a2`, zéro modification suivie et zéro fichier indexé.
- Le `SOURCE-OF-TRUTH-INDEX` a routé vers le Scientific Product Manifesto V2, PD-004, PD-005 et PD-009. Aucune autorité n’impose la sentinelle lexicale comme vérité sémantique ni le schéma booléen antérieur comme norme.
- L’audit Astra a été traité comme audit technique non normatif et requalifié contre le code courant.
- Aucun fichier normatif, owner scientifique, Router, QRY, Project, RC04, RC05, RC07, RC08, scénario FIC02, Acceptance Envelope, fact packet ou artefact d’exécution 01–04 n’a été modifié.

## Confirmation causale directe

Le code antérieur demandait cinq attestations au même appel provider, puis `providerSemanticInvariants` comparait `sourcePresent=false` au statut de la sentinelle lexicale. Tout statut autre que `NOT_PRESENT` produisait `SEMANTIC_INVARIANT_SOURCE_CONFLICT`, avant matérialisation. Le diagnostic transmis au bridge puis à TRACE ne conservait que les identités, le premier code de rejet et le digest global du résultat provider ; le claim, les preuves et l’observation de surface étaient perdus.

```ini
RC06_DIRECT_CAUSAL_CONFIRMATION = CONFIRM
RC06_FINAL_CAUSAL_CLASSIFICATION = LANGUAGE_EVIDENCE_CONTRACT_MODEL_AND_REJECTED_WITNESS_GAP
RC06_ACTUAL_OWNER = CONVERSATION_LANGUAGE_GATEWAY / LANGUAGE_PROJECTION_PROVIDER_CONTRACT + providerSemanticInvariants + LANGUAGE_PROJECTION_MATERIALIZER

CURRENT_CONTRACT_VIABILITY = YES_WITH_BOUNDED_CHANGE
IMPLEMENTED_MODEL = A_BOUNDED_EVIDENCE_CONTRACT_CLARIFICATION
```

Execution-04 démontre donc un désaccord entre un claim provider et une observation lexicale de surface. Il ne démontre ni perte sémantique réelle, ni faute exclusivement Gemini, ni vérité sémantique de la regex.

## Modèle de preuve implémenté

Le contrat Language Gateway passe en `1.3.0` et conserve un seul appel provider. Pour chaque invariant :

- `attestationStatus=ATTESTED` rend `sourcePresent` et `preserved` explicitement descriptifs de claims provider ;
- `attestationStatus=UNKNOWN` exprime l’impossibilité d’attester, échoue fail-closed et reste distinct de `ABSENT` et `LOST` ;
- les cinq catégories sont explicitement non exclusives ;
- les preuves restent bornées, verbatim, sans saut de ligne, et le prompt/schema demande le segment le plus court suffisamment contextualisé montrant autant que possible opérateur, proposition et portée locale ;
- le déterministe vérifie la structure, la cardinalité, l’unicité, les bornes et l’ancrage verbatim. Il ne prétend pas mesurer automatiquement la suffisance sémantique du contexte ;
- la sentinelle lexicale reste une `SURFACE_MARKER_OBSERVATION` ; elle n’est pas une preuve sémantique indépendante ;
- `provider.sourcePresent=false` avec marker observé devient `SOURCE_CLAIM_SURFACE_OBSERVATION_CONFLICT` et reste rejeté.

```ini
PROVIDER_CLAIM_SEPARATED_FROM_PROOF = PASS
CATEGORIES_NON_EXCLUSIVE = PASS
CONTEXTUALIZED_EVIDENCE_REQUIRED = PASS_CONTRACT_LEVEL; DETERMINISTIC_SEMANTIC_SUFFICIENCY_CLAIM = NO

LEXICAL_SENTINEL_IS_SEMANTIC_TRUTH = NO
LEXICAL_SENTINEL_ROLE = SURFACE_MARKER_OBSERVATION
UNRESOLVED_PROVIDER_SENTINEL_CONFLICT = FAIL_CLOSED

ABSENT_VS_UNKNOWN_DISTINCT = PASS
LOSS_VS_UNKNOWN_DISTINCT = PASS

SECOND_LLM_JUDGE_ADDED = NO
ADDITIONAL_PROVIDER_CALL_ADDED = NO
TERM_SPECIFIC_TRANSLATION_DICTIONARY = 0
NEW_OWNER_CREATED = 0
NEW_ENGINE_CREATED = 0
NEW_TRACE_SYSTEM_CREATED = 0
NORMATIVE_FILES_CHANGED = 0
SCIENTIFIC_OWNER_FILES_CHANGED = 0
```

## Witness de rejet et TRACE v2

Le diagnostic `LANGUAGE_PROJECTION_CONTRACT_FAILURE_DIAGNOSTIC@1.1.0` transporte désormais les claims et spans bornés. Le bridge existant transportait déjà le diagnostic de façon opaque ; aucune modification de son ownership ou de sa sélection provider n’était nécessaire. Le test de bridge démontre le transport du nouveau diagnostic jusqu’au client.

TRACE `1.4.0` ajoute le witness à l’événement `LANGUAGE_PROJECTION_CONTRACT_REJECTED` uniquement à partir de `LEVEL_2_DIAGNOSTIC`. CORE reste sans payload diagnostique. L’Inspector expose les témoins dans la vue diagnostic, sans nouveau diagnostic scientifique ni mutation produit.

```ini
TRACE_REJECTED_WITNESS_CAPTURE = PASS
WITNESS_FIELDS_CAPTURED = [
  SOURCE_TEXT_DIGEST,
  SOURCE_INVARIANT_CLAIM,
  SOURCE_EVIDENCE,
  SOURCE_MARKER_OBSERVATIONS,
  TRANSLATED_TEXT_DIGEST,
  TARGET_EVIDENCE,
  PROVIDER_PRESERVATION_CLAIM,
  PROVIDER_SUPPORT_STATUS,
  DETERMINISTIC_CONTRACT_VERDICT,
  VALIDATOR_VERSION,
  PROMPT_VERSION,
  SCHEMA_VERSION,
  PROVIDER,
  MODEL,
  PROVIDER_RESPONSE_ID
]
TRACE_LEVEL_1_REJECTED_WITNESS = NOT_CAPTURED
TRACE_LEVEL_2_REJECTED_WITNESS = CAPTURED_BOUNDED
FULL_SOURCE_OR_TRANSLATED_TEXT_PERSISTED_IN_DIAGNOSTIC = NO
TRACE_MUTATES_PRODUCT = NO
TRACE_DECIDES = NO
TRACE_REPAIRS = NO
TRACE_JUDGES_SCIENCE = NO
```

## Tests contractuels A–Q

Les nouveaux mocks expriment directement les claims provider ; ils ne sont pas dérivés de `evaluateLinguisticInvariants`.

```ini
A_NEGATION_PRESENT_PRESERVED = PASS
B_NEGATION_DECLARED_LOST_REJECTED = PASS
C_NEGATION_UNCERTAINTY_OVERLAP = PASS
D_ABSENT_WITHOUT_SURFACE_MARKER = PASS
E_ABSENT_WITH_SURFACE_MARKER_CONFLICT_FAIL_CLOSED = PASS
F_PROVIDER_UNKNOWN_DISTINCT_FAIL_CLOSED = PASS
G_SOURCE_EVIDENCE_OUTSIDE_SOURCE_REJECTED = PASS
H_TARGET_EVIDENCE_OUTSIDE_TARGET_REJECTED = PASS
I_CONTEXTUALIZED_EVIDENCE_CONTRACT_REQUIRED_WITHOUT_FALSE_DETERMINISTIC_CLAIM = PASS
J_DUPLICATE_INVARIANT_REJECTED = PASS
K_MISSING_INVARIANT_REJECTED = PASS
L_EVIDENCE_WITH_ABSENT_SOURCE_REJECTED = PASS
M_COMPARISON_PRESENT_PRESERVED = PASS
N_CONDITIONALITY_PRESENT_PRESERVED = PASS
O_TEMPORAL_RELATION_PRESENT_PRESERVED = PASS
P_UNCERTAINTY_PRESENT_PRESERVED = PASS
Q_PROTECTED_LITERALS_NUMBERS_STRUCTURED_QUANTITIES = PASS
```

## Qualification

```ini
LANGUAGE_TARGETED_TESTS = PASS (3 files / 62 tests)
TRACE_TARGETED_TESTS = PASS (RC06 witness + TRACE 02A/02B/02C included in affected qualification)
BRIDGE_TARGETED_TESTS = PASS (RC06 bridge + local/minimal bridge included in affected qualification)
STANDARD_MULTILINGUAL_REGRESSIONS = PASS (5/5)

RC07_REGRESSION = PASS
FAILED_LOCALIZATION_CANNOT_REPORT_SUCCEEDED = PASS
VISIBLE_LANGUAGE_REQUIREMENT_SATISFIED_BEFORE_SUCCESS = PASS
CANONICAL_FRENCH_RESPONSE_PRESERVED = PASS
NO_PROJECT_MUTATION_FROM_LOCALIZATION = PASS

RC04_REGRESSION = PASS
PROSE_FALSE_UNIT_POSITIVE = 0
3_T_TO_1_5_T_REJECTED = PASS
40_MS_TO_40_S_REJECTED = PASS
5_MG_TO_5_G_REJECTED = PASS

AFFECTED_PROTOCOL_DESIGNER_TESTS = PASS (80 files / 932 pass / 1 todo)
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

L’échec historique attend l’ancien heading `Protocol Designer`, alors que la surface courante expose `Construisons votre projet scientifique`. Le fichier est inchangé et hors causalité RC06. Les avertissements de build concernent Browserslist, une annotation Rollup, une règle CSS préexistante et la taille des chunks ; ils ne bloquent pas le build.

## Git et préservation

```ini
PRODUCT_COMMIT = 55bf290bb7301fb9cf229ee7a96f71c2b3d9706f
PRODUCT_COMMIT_DIFFSTAT = 7 files changed, 590 insertions(+), 30 deletions(-)

PROVIDER_CALLS = 0
FIC02_REPLAY = NO
PUSH = NO
DEPLOYMENT = NO

PRESERVED_UNTRACKED_REPORTS = 9
PRESERVED_FIC01_FILES = 20
PRESERVED_FIC02_EXECUTION_01_FILES = 23
PRESERVED_FIC02_EXECUTION_02_FILES = 24
PRESERVED_FIC02_EXECUTION_03_FILES = 32
PRESERVED_FIC02_EXECUTION_04_FILES = 53
```

Après le commit de ce rapport, les valeurs finales attendues sont :

```ini
TRACKED_WORKTREE_CHANGES = 0
STAGED_FILES = 0
```

## Gate de sortie

```ini
MISSION_STATUS = QUALIFIED_FIC02_REPLAY_05_CANDIDATE_READY
LIVE_PROVIDER_BEHAVIOR_DEMONSTRATED = NO
FIC02_REPLAY = NO
NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_02_REPLAY_05

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```

Replay-05 n’est ni lancé ni préjugé par cette qualification locale.
