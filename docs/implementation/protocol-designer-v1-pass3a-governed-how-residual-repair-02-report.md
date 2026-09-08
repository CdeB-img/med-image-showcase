# PROTOCOL_DESIGNER_V1_PASS3A_GOVERNED_HOW_RESIDUAL_REPAIR_02 — rapport d’implémentation

## Décision

```ini
MISSION_STATUS = QUALIFIED_GOVERNED_HOW_RESIDUAL_REPAIR_READY_FOR_4_CASE_GEMINI_REPLAY

HEAD_BEFORE = 3b1c69988fe094d6a672080f12ab789662c73c3d
HEAD_AFTER_PRODUCT_CHANGE = 85dc2684b5fbf8e05b4ae09355fd8b4824d250fc
HEAD_FINAL = REPORT_COMMIT

PRODUCT_COMMIT = 85dc2684b5fbf8e05b4ae09355fd8b4824d250fc
REPORT_COMMIT = THIS_COMMIT

GOVERNED_CONVERSATION_VERSION_BEFORE = 1.1.0
GOVERNED_CONVERSATION_VERSION_AFTER = 1.2.0

QRY_CORE_CHANGED = NO
QRY_WHAT_SELECTION_CHANGED = NO
```

La réparation porte sur le consumer existant `GOVERNED_CONVERSATION_REALIZATION` et sur la projection existante Study Design → conversation visible. Elle ne déplace aucun ownership scientifique et ne modifie ni le moteur QRY, ni ses règles de sélection ou de valeur d’information.

## Réparation causale

```ini
CC06_ASK_INTERROGATIVE_CONTRACT_STATUS = PASS
CC07_EXPLANATION_REALIZATION_STATUS = PASS
CC08_USER_SOURCE_ATTRIBUTION_STATUS = PASS
CC09_OWNER_DECISION_SUPPORT_STATUS = PASS
INTERNAL_TERMINOLOGY_GUARD_STATUS = PASS
DECISION_SUPPORT_FALLBACK_STATUS = PASS_PROPORTIONATE_GOVERNED_FACETS_ONLY
```

- `ASK_INFORMATION` exige désormais exactement une question principale terminale ; l’action et la cible doivent être attestées dans cette phrase interrogative.
- `EXPLAIN_REFERENCED_CONTENT` exige une articulation visible, distincte et non superposée aux witnesses des référents. Une réénumération ou la rationalisation historique non gouvernée « finalités méthodologiques et opérationnelles » est rejetée.
- l’attribution `USER_SUPPLIED` est contrôlée par une grammaire de preuve bornée et un witness exact ; elle n’impose plus une phrase unique.
- le support décisionnel Study Design projette les options, un discriminant et une limite matérielle par option, le compromis gouverné, la limite globale primaire et la frontière de décision humaine. Les objets de contrôle redondants ne sont plus récités.
- le fallback local reprend exclusivement ces facettes, sans identifiant, statut interne, décision scientifique ou adoption.
- un target ASK post-adoption contenant préambule et question est réduit, dans la projection existante, à sa phrase interrogative exacte. Le WHAT QRY reste inchangé.

Le contrôle de vocabulaire interdit les labels internes dans le support décisionnel Standard (`owner`, `QRY`, `Project` technique, références, validator, TRACE et identifiants internes). Le mot français ordinaire « projet » n’est pas interdit.

## Requalification locale des six sorties historiques

Les artefacts historiques sources n’ont pas été modifiés. La matrice dérivée se trouve dans `validation/protocol-designer-v1-pass3a-governed-how-residual-repair-02/historical-output-requalification.json`.

```ini
CASE_05_T1_REQUALIFICATION = PASS_OR_UNCHANGED_PASS
CASE_05_T2_REQUALIFICATION = REJECT_EXPLANATION_NOT_REALIZED
CASE_06_T1_REQUALIFICATION = REJECT_ASK_INTERROGATIVE_SURFACE_MISSING
CASE_09_T1_REQUALIFICATION = REJECT_INTERNAL_PRODUCT_TERMINOLOGY_AND_MISSING_REQUIRED_TRADEOFF; GOVERNED_FALLBACK_STRUCTURALLY_PASS
CASE_11_T2_REQUALIFICATION = PASS_SOURCE_ATTRIBUTION_IF_NO_OTHER_DEFECT
CASE_11_T3_REQUALIFICATION = PASS_OR_UNCHANGED_PASS

CONTRACT_FALSE_REJECTION_COUNT_BEFORE = 0
CONTRACT_FALSE_REJECTION_COUNT_AFTER = 0
PRODUCT_LEVEL_FALSE_REJECTION_COUNT_BEFORE = 1
PRODUCT_LEVEL_FALSE_REJECTION_COUNT_AFTER = 0
UNSAFE_ACCEPTANCE_COUNT_BEFORE = 2
UNSAFE_ACCEPTANCE_COUNT_AFTER = 0
VISIBLE_LOW_VALUE_FALLBACK_COUNT_BEFORE = 1
VISIBLE_LOW_VALUE_FALLBACK_COUNT_AFTER = 0
```

Ces résultats qualifient la conformité structurelle locale et l’action visible selon les règles déterministes. Ils ne qualifient ni la correction scientifique, ni la naturalité, ni la valeur humaine du produit.

## Limites architecturales conservées

```ini
FUZZY_MATCHING_ADDED = NO
SECOND_LLM_JUDGE_ADDED = NO
NEW_OWNER_CREATED = 0
NEW_ENGINE_CREATED = 0
NEW_TRACE_SYSTEM_CREATED = 0

PROJECT_WRITES_BEFORE_HUMAN = 0
AUTOMATIC_ADOPTION = 0

SCIENTIFIC_OWNER_FILES_CHANGED = 0
LANGUAGE_GATEWAY_FILES_CHANGED = 0
PROJECT_WRITER_FILES_CHANGED = 0
NORMATIVE_FILES_CHANGED = 0
```

Les résultats natifs Study Design, le lifecycle des candidates, le Project writer, le Language Gateway, TRACE et les providers sont inchangés.

## Qualification locale

Qualification finale après stabilisation :

```ini
TARGETED_TESTS = PASS; QUERY_NAVIGATION 13_FILES/414_PASS; FUNCTIONAL_RESET 88_FILES/1011_PASS/1_TODO
TYPESCRIPT = PASS_APPLICATION_AND_VERCEL_API_AND_SCIENTIFIC_INTERPRETATION_SERVER
AFFECTED_LINT = PASS_13_FILES
PRODUCTION_BUILD = PASS
GIT_DIFF_CHECK = PASS

POST_STABILIZATION_RELATED_IMPORT_GRAPH = 89_FILES_PASS/1_FILE_FAIL/1_FILE_SKIP; 1142_PASS/1_FAIL/7_SKIP/1_TODO
HISTORICAL_FAILURES = p-web-02-contract.test.tsx_ONLY_IN_POST_STABILIZATION_AFFECTED_GRAPH
NEW_REGRESSIONS = 0_IN_POST_STABILIZATION_AFFECTED_GRAPH
```

La suite complète a été exécutée une seule fois avant la réconciliation finale des assertions historiques devenues obsolètes :

```ini
FULL_SUITE_PASS = 3852
FULL_SUITE_SKIP = 12
FULL_SUITE_TODO = 1
FULL_SUITE_FAIL = 16_BEFORE_FINAL_FIXTURE_RECONCILIATION
FULL_SUITE_FILES = 248_PASS/5_FAIL/2_SKIP
FULL_SUITE_FINAL_STATE_RERUN = NO_BY_SINGLE_RUN_CONSTRAINT
```

Quatorze échecs ont été attribués aux anciennes fixtures déclaratives et ont été éliminés par les suites ciblées finales. `p-web-02-contract.test.tsx` demeure l’échec historique séparé. Un échec global supplémentaire, tronqué dans la sortie initiale, n’a pas été reproduit dans le graphe d’import affecté après stabilisation ; son statut global final reste donc `UNKNOWN_NOT_REPRODUCED`, et non artificiellement `PASS`. Cette limite ne modifie pas la qualification du périmètre causal, mais interdit de déclarer la suite complète finale verte.

Le build conserve uniquement les warnings préexistants signalés pendant la mission : Browserslist, annotation `react-helmet`, CSS `-: .TZ` et taille de chunks.

## Git, réseau et préservation

```ini
PROVIDER_CALLS = 0
GEMINI_CALLS = 0
OPENAI_CALLS = 0

PREEXISTING_UNTRACKED_FILES = 435
PREEXISTING_UNTRACKED_CONTENT_CHANGED = 0

TRACKED_WORKTREE_CHANGES = 0_AFTER_REPORT_COMMIT
STAGED_FILES = 0_AFTER_REPORT_COMMIT

COMMIT = YES_TWO_LOCAL_COMMITS
PUSH = NO
DEPLOYMENT = NO

LIVE_PROVIDER_EFFECTIVENESS = NOT_TESTED
```

Les sept artefacts de validation de cette mission restent volontairement non suivis. Les 435 fichiers non suivis préexistants ont été contrôlés par SHA-256 et sont tous inchangés.

## Suite autorisable séparément

```ini
NEXT_TARGETED_REPLAY_CASES = CASE_05_T2, CASE_06_T1, CASE_09_T1, CASE_11_T2
EXPECTED_NEXT_GEMINI_CALLS = 4
EXPECTED_NEXT_OPENAI_CALLS = 0

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO

NEXT_ACTION = TARGETED_GEMINI_DEV_REPLAY_02_PENDING_EXPLICIT_AUTHORIZATION
```

Aucun replay, appel provider, push, déploiement ou travail Pass3B n’a été exécuté.
