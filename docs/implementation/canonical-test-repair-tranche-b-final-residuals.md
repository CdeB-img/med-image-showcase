# NOXIA — Canonical Test Repair Tranche B

## Decision

```text
DECISION = CANONICAL_TEST_REPAIR_TRANCHE_B_COMPLETE
CLASSIFICATION = LEVEL_3_IMPLEMENTATION_EVIDENCE
NORMATIVE_AUTHORITY = NONE
```

The six residual canonical failures were closed by reconciling stale or over-broad test expectations with the already-established contracts and current tracked behavior. No scientific owner runtime, scientific corpus, authority, product behavior, QRY behavior, Project runtime, or Editorial Engine code was changed.

The canonical gate is trustworthy in the measured state: Vitest/npm returned a non-zero process exit for a focused failing test before repair, and the final canonical run returned process exit `0`, JSON `success = true`, and zero failed tests.

```text
RC_TEST_03_REMAINING = 0
RC_TEST_04_REMAINING = 0
RC_TEST_06_REMAINING = 0
RC_TEST_08_REMAINING = 0
NEW_UNEXPECTED_FAILURES = 0
FAILURE_PROCESS_EXIT_NONZERO_PROVEN = YES
FINAL_PROCESS_EXIT = 0
FINAL_JSON_SUCCESS = true
FINAL_FAILED_TESTS = 0
SCIENTIFIC_OWNER_CODE_CHANGED = NO
SCIENTIFIC_CORPUS_CHANGED = NO
```

## Baseline

```text
branch = protocol-designer-canonical-ingestion
HEAD_INITIAL = 3d83602beb0411063050ebd20deb0891d59aa86e
origin/main = f504d8fc658ebdf17757e589f610e8f56c24e335
tracked_status_initial = CLEAN
last_measured_canonical = 3246 passed / 6 failed / 12 skipped
```

Authorities were consulted in the required order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx`;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-v2.0.docx`;
4. `../documents/Autorites/courant/3. Editorial Engine — Architecture Manifesto.md`.

The bounded specialized consultation then covered KE-001 applicability and external-search semantics, RDE-003 Imaging semantics, the Scientific Thinking 1.2.2 alternative contract and repair evidence, and the current intent-aware Protocol Designer presentation. Tests and earlier Level 3 reports were used only as implementation evidence.

No documentary or normative contradiction was identified.

## Exit-code integrity

Before any repair, one existing RC-TEST-03 failure was executed in isolation:

```text
COMMAND = npm test -- src/features/knowledge-engine/__tests__/eng-002-product-cases.test.ts --reporter=json --outputFile=/private/tmp/noxia-tranche-b-rc-test-03-precheck.json
SHELL_EXIT_CODE = 1
JSON_SUCCESS = false
JSON_FAILURE_COUNT = 1
JSON_PASSED_TESTS = 13
```

The invariant `failing test -> process exit != 0` is therefore demonstrated through the normal npm/Vitest chain. `CANONICAL_TEST_EXIT_FALSE_GREEN` was not reproduced and is not confirmed.

The previous Tranche A observation — process exit `0` while its JSON contained failures — is classified as a prior command-capture/reporting anomaly. Its exact external capture cause cannot be reconstructed from repository state alone. No persistent npm script or Vitest runner defect was observed: the unchanged runner returned `1` for the focused failure and later returned `0` only when the full canonical JSON was successful. No runner/configuration repair or artificial JSON exit wrapper was added.

```text
FAILURE_PROCESS_EXIT_NONZERO_PROVEN = YES
CANONICAL_TEST_EXIT_FALSE_GREEN = NOT_CONFIRMED
RUNNER_OR_CONFIG_CHANGED = NO
```

## RC-TEST-03

### F07 — Knowledge SOFT applicability

| Field | Result |
| --- | --- |
| Old expectation | The selected provider must exclude at least one assertion and the aggregate coverage must be `PARTIAL`. |
| Current behavior | The provider remains selected; zero assertions are excluded; applicable assertions include `APPLICABLE_WITH_LIMITATIONS`; limitations remain visible; aggregate coverage is `SUPPORTED`. |
| Authority/contract basis | KE-001 §3.3 and §9: a non-critical `SOFT` difference may remain applicable with explicit limitations; `SOFT` is not an automatic hard exclusion. |
| Why valid | The result preserves the applicability qualification without treating the missing/non-critical dimension as an incompatibility. The aggregate coverage reports internal availability; assertion-level applicability carries the limitation. |
| New assertion intent | Prove provider retention, zero automatic exclusion, applicable limited assertions, visible limitations, non-empty coverage, and absence of `INCOMPATIBLE_CONTEXT`. |

Two intermediate focused runs exposed residual over-specific F07 expectations (`PARTIAL`, then an assumed `SUPPORTED_COVERAGE` branch status). Both were removed before the final targeted gate. No runtime or scientific input changed during those iterations.

### F08 — governed external-search decision

| Field | Result |
| --- | --- |
| Old expectation | `EXTERNAL_ALLOWED` necessarily creates a provider plan whose first query contains no-reflow and stenting. |
| Current behavior | Admitted internal Knowledge returns `SUPPORTED`; the decision is `INTERNAL_ONLY`; the external query plan is `null`; provider calls and plans remain zero. |
| Authority/contract basis | KE-001 §21: `INTERNAL_ONLY` is the default when governed internal corpora are sufficient or no external authorization is required. |
| Why valid | External discovery is not mandatory merely because it is permitted. The specific no-reflow and stenting concepts remain resolved internally, while no provider/network action is performed. |
| New assertion intent | Prove concept preservation, `INTERNAL_ONLY`, no plan, zero provider calls, and `externalCallMade = false`. |

### F14 — no-reflow Imaging candidate

| Field | Result |
| --- | --- |
| Old expectation | Zero modality candidates. |
| Current behavior | One pending MRI modality candidate is preserved with zero biomarker links and zero acquisition strategies; status remains `RETURN_TO_SCIENTIFIC_THINKING`. |
| Authority/contract basis | RDE-003 §§42–43 and §60: Imaging may preserve a modality branch while the defensible biomarker/acquisition chain remains absent; a candidate modality is not an executable acquisition strategy. |
| Why valid | The branch is not adopted, no biomarker is invented, no acquisition is generated, and the reasoning returns upstream. |
| New assertion intent | Prove the bounded pending MRI candidate, zero biomarker links, zero acquisitions, and upstream return. |

```text
RC_TEST_03_REMAINING = 0
EXTERNAL_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
```

## RC-TEST-04

### F13 — Imaging negative matcher

| Field | Result |
| --- | --- |
| Old expectation | A serialized acquisition object must contain no textual occurrence of `MOLLI`, `SASHA`, or similar sequence wording. |
| Current behavior | Governed MOLLI/SASHA references remain in Level 2 dependency metadata; every Level 3 acquisition state is `NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE`. |
| Authority/contract basis | RDE-003 §26.2: conceptual/methodological dependencies are distinct from executable parameterization; the current state cannot generate Level 3 executable protocols. |
| Why valid | A source/dependency reference is not an executed or generated sequence. Removing it would destroy provenance while failing to test the actual forbidden surface. |
| New assertion intent | Prove that governed dependency references survive and that all Level 3 executable acquisition states remain non-generatable. |

```text
RC_TEST_04_REMAINING = 0
EXECUTABLE_IMAGING_ACQUISITION_GENERATED = NO
```

## RC-TEST-08

### F24 — Scientific Thinking alternatives

| Field | Result |
| --- | --- |
| Old expectation | ST and Imaging must contain the legacy fallback subtype `NULL_OR_COMPETING`. |
| Current behavior | ST 1.2.2 materializes explicit Knowledge-supported branches as multiple `ALTERNATIVE` hypotheses; Imaging preserves their identities and text. |
| Authority/contract basis | Manifesto V2 chapters 12, 27 and 30 require legitimate plurality, fidelity across handoffs and no automatic winner. The current ST 1.2.2 contract reserves the generic fallback for cases without named branches. |
| Why valid | Explicit alternatives are stronger evidence of preserved plurality than a generic fallback, provided their identity/content survive and remain pending. |
| New assertion intent | Prove at least two alternatives, distinct IDs and texts, exact ST-to-Imaging preservation, and `PENDING` review state on both sides. |

```text
RC_TEST_08_REMAINING = 0
ALTERNATIVES_AUTOMATICALLY_ADOPTED = NO
```

## RC-TEST-06

### F21 — intent-aware DESIGN_STUDY placeholder

| Field | Result |
| --- | --- |
| Old expectation | `Ajouter ou modifier un élément du projet…` |
| Current behavior | `Décrivez le projet de recherche que vous souhaitez construire.` |
| Authority/contract basis | The current `productEntryPromptForIntent` presentation binds this wording to `DESIGN_STUDY`; PD-004 keeps the interaction focused and avoids competing primary actions. |
| Why valid | The test context is an established DESIGN_STUDY project surface. The existing one-textbox and no-Continue assertions remain unchanged. |
| New assertion intent | Update only the stale presentation string while retaining the structural UX invariants. |

```text
RC_TEST_06_REMAINING = 0
QRY_CHANGED = NO
PRODUCT_BEHAVIOR_CHANGED = NO
```

## Files changed

Exactly five test files and this Level 3 report belong to the tranche:

- `src/features/knowledge-engine/__tests__/eng-002-product-cases.test.ts`;
- `src/features/knowledge-engine/__tests__/eng-003-external-search.test.ts`;
- `src/features/imaging-study-designer/__tests__/mandatory-cases.test.ts`;
- `src/features/protocol-designer/functional-reset/__tests__/w1-imaging-01-product-scientific-thinking-handoff.test.ts`;
- `src/features/protocol-designer/functional-reset/__tests__/functional-reset-03b.test.tsx`;
- `docs/implementation/canonical-test-repair-tranche-b-final-residuals.md`.

```text
SCIENTIFIC_OWNER_CODE_CHANGED = NO
SCIENTIFIC_CORPUS_CHANGED = NO
AUTHORITIES_CHANGED = NO
EDITORIAL_ENGINE_CHANGED = NO
GOVERNED_IMAGING_REFERENCES_CHANGED = NO
```

## Targeted validation

Final six-test gate:

```text
selected tests = 6 passed / 0 failed
process exit = 0
JSON success = true
TRANCHE_B_TARGETED_FAILURES = 0
```

The five directly affected test files were then run as the smallest relevant regression set:

```text
test files = 5
test suites reported = 15 passed / 0 failed
tests = 99 passed / 0 failed / 0 skipped
process exit = 0
JSON success = true
```

Canonical TypeScript gate, executed once because TypeScript test files changed:

```text
npm run typecheck = PASS
TypeScript errors = 0
APP_MODULE_RESOLUTION = BUNDLER
VERCEL_API_MODULE_RESOLUTION = NODENEXT
NODE_ESM_HANDLER_LOAD = PASS
```

No external provider, network, benchmark, scientific replay, or broad exploratory suite was used.

## Canonical validation

The canonical suite was executed exactly once after the targeted gates:

```text
COMMAND = npm test -- --reporter=json --outputFile=/private/tmp/noxia-tranche-b-canonical.json
PROCESS_EXIT = 0
JSON_SUCCESS = true
TEST_SUITES = 460 passed / 0 failed
PASSED_TESTS = 3252
FAILED_TESTS = 0
SKIPPED_TESTS = 12
TOTAL_TESTS = 3264
```

All three independent success conditions are met: zero JSON failures, JSON success true, and process exit zero.

## Skipped tests preserved

```text
SKIPPED_TESTS_BEFORE = 12
SKIPPED_TESTS_AFTER = 12
SKIP_OR_TODO_MARKERS_REMOVED_BY_THIS_TRANCHE = 0
```

The existing skips remain a separate inventory. This tranche did not remove, rewrite, or replace them and did not fabricate evidence variables to activate them.

## Remaining root causes

```text
RC_TEST_03_REMAINING = 0
RC_TEST_04_REMAINING = 0
RC_TEST_06_REMAINING = 0
RC_TEST_08_REMAINING = 0
NEW_UNEXPECTED_FAILURES = 0
KNOWN_CANONICAL_FAILURES_REMAINING = 0
```

The previously closed RC-TEST-01, RC-TEST-02, RC-TEST-02P, RC-TEST-05, RC-TEST-07 and RC-TEST-09 remain closed in the measured canonical run.

## Separate debts

The following debts remain explicitly open and were not modified:

```text
REP-001 = OPEN
STRICT_NODE_GRAPH_NULLABILITY_MISMATCH = OPEN
OPENAI_STRICT_SCHEMA_HARDENING_DEBT = OPEN
HISTORICAL_SKIPPED_TEST_INVENTORY = 12
```

Canonical green status does not resolve those separate debts and does not constitute scientific qualification.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
EXTERNAL_SEARCH_CALLS = 0
NETWORK_CALLS = 0
SCIENTIFIC_CAMPAIGNS = 0
SCIENTIFIC_REPLAYS = 0
FULL_CANONICAL_TEST_RUNS = 1
```

## Git

```text
COMMIT_MESSAGE = fix(test): reconcile final canonical expectations
COMMITS_CREATED = 1 BOUNDED LOCAL COMMIT; SHA REPORTED AFTER CREATION
PUSH = NO
DEPLOYMENT = NO
MAIN_MODIFIED = NO
MERGE = NO
```

The commit is restricted to the five test files and this report. Historical untracked artifacts remain untouched and locally excluded according to the existing repository state.

```text
CANONICAL_TEST_REPAIR_TRANCHE_B_COMPLETE
```
