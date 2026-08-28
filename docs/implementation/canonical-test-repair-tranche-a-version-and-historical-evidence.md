# NOXIA — Canonical Test Repair Tranche A

## Historical Evidence & Owner Version Baseline Reconciliation

**Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`

**NORMATIVE_AUTHORITY:** `NONE`
**Date:** 2026-08-28

## Decision

```text
CANONICAL_TEST_REPAIR_TRANCHE_A_COMPLETE
```

The three failures assigned to `RC-TEST-05` and `RC-TEST-09` were repaired in the test harness without changing a scientific owner runtime or rewriting Campaign D evidence.

```text
TRANCHE_A_TARGETED_FAILURES = 0
RC_TEST_05_FAILURES_REMAINING = 0
RC_TEST_09_FAILURES_REMAINING = 0
NEW_UNEXPECTED_CANONICAL_FAILURES = 0
SCIENTIFIC_PASS = NOT_CLAIMED
```

## Baseline

```text
branch = protocol-designer-canonical-ingestion
HEAD_INITIAL = 9698ac4a6a14a5bf4493c0d42bed4c9d8e14bafe
origin/main = f504d8fc658ebdf17757e589f610e8f56c24e335
tracked_status_initial = CLEAN
```

The current branch was twelve commits ahead of `origin/protocol-designer-canonical-ingestion` at preflight. That remote branch position was not a baseline condition of this mission and was not changed.

Closure evidence was present for:

```text
RC-TEST-07 = CLOSED
RC-TEST-01 = CLOSED
RC-TEST-02 = CLOSED
RC-TEST-02P = CLOSED
```

Authorities were consulted in the required order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, official version 1.45;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx`, version 1.0;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-v2.0.docx`, version 2.0;
4. `/Users/charles/Documents/Projets/editorial-engine/docs/architecture-manifesto.md`, version 1.0.

The specialized contracts actually required were `docs/pd-003-v2-research-object-model.md`, `docs/pd-003-v2-ownership-matrix.md`, `docs/ke-001-knowledge-engine-architecture.md`, `docs/rde-001-research-design-engine-architecture.md` and `docs/rde-002-research-design-workflow.md`.

The authorities agree on the applicable rules: versions used by results remain immutable; a correction creates a new version rather than rewriting history; replay uses the versions that produced the historical result; and technical evidence never creates scientific truth. No documentary or normative contradiction was identified.

## Failure intent classification

| Test ID | Test purpose | Historical or current | Object owner | Expected before repair | Actual readback | Why the expectation exists | Change commit | Change intent | Expectation still valid |
|---|---|---|---|---|---|---|---|---|---|
| F16 | Prove that native Project → Knowledge invocation exposes an explicit owner/runtime contract while preserving Project identity and zero writes | `ACTIVE_CURRENT` / current contract assertion | Knowledge | `1.2.0` | `1.2.1` | Explicit baseline pinned when the native owner test was created in `7c9f012e7897389140ca97dc0ae357c6653849d8` | `320d54bbab3c87833ea69583097860c28d010403` | Governed `UNDERSTAND` synthesis introduced a compatible Knowledge contract revision | `NO` for the old literal; `YES` for the exact-current-version invariant |
| F17 | Prove that the cross-engine integration surface exposes independently pinned current owner versions | `ACTIVE_CURRENT` / current contract assertion | Scientific Thinking | `1.1.0` | `1.2.2` | Explicit integration baseline predating the later ST repairs | `6803ba7d5c73c1df8771dbd8e9748d6334adf436` | Bounded repair of human-adjudicated ST reasoning defects and corresponding contract revision | `NO` for the old literal; `YES` for the exact-current-version invariant |
| F25 | Preserve the frozen Campaign D/H1T ST identity and its original runtime digests | `HISTORICAL_EVIDENCE` | Scientific Thinking | ST `1.2.1`, engine `sha256-e87aa94e3e7f0542991f2d3bc748a9ba41f33fb0ff32511ea25f820feb9564dc` | Current ST is `1.2.2`, engine `sha256-edb070f46c7c986ee6980cb955e3d5fc535413782b4e5bcd198f3ca0be59b427` | Campaign D was frozen at `1a77e5d5001b2108f43a52a82bebecff350c4296` before the ST 1.2.2 repair | `6803ba7d5c73c1df8771dbd8e9748d6334adf436` | Produce a new current ST version without retroactively changing Campaign D | `PARTIAL`: historical identity remains valid; comparison with mutable current paths was invalid |

The first divergent stage for all three failures was the test harness. No current owner result, scientific content or Project write was implicated.

## RC-TEST-09 historical evidence

Campaign D remains frozen as:

```text
campaignId = W1-QUAL-01H-ST-2026-08-26-D
freezeDigest = ke1-f8f6b4620ab40c36
gitHead = 1a77e5d5001b2108f43a52a82bebecff350c4296
ST_VERSION = 1.2.1
engine_sha256 = sha256-e87aa94e3e7f0542991f2d3bc748a9ba41f33fb0ff32511ea25f820feb9564dc
types_sha256 = sha256-79f7ac776d92d4be9586385a94113d9d02a6dd500d1f8194eb523f6eaf9a00f6
product_runtime_sha256 = sha256-bef0aa5ede4daafa9eae9b5cab158e7c36bfa899bfd4d460a4ac7773f5fa0fe7
```

The immutable Git blobs at the recorded Campaign D commit were read back independently during diagnosis and matched all three stored SHA-256 values. The test now validates the tracked historical freeze and the tracked immutable-evidence registry directly. It no longer hashes current ST runtime paths as if they were frozen 1.2.1 bytes.

The current ST runtime remains separately identifiable as:

```text
ST_VERSION = 1.2.2
current_engine_sha256 = sha256-edb070f46c7c986ee6980cb955e3d5fc535413782b4e5bcd198f3ca0be59b427
current_types_sha256 = sha256-2da6b2b476a8766f9560f840c110bffefd3975b3a152f276fd1390887d3fb89c
current_product_runtime_sha256 = sha256-bef0aa5ede4daafa9eae9b5cab158e7c36bfa899bfd4d460a4ac7773f5fa0fe7
```

The unchanged product-runtime digest across these two identities does not collapse them: the ST engine and types differ, and every historical output remains attached to ST 1.2.1.

```text
RC_TEST_09_HISTORICAL_EVIDENCE_BOUNDARY_MISSING = NO
HISTORICAL_EVIDENCE_REWRITTEN = NO
CURRENT_RUNTIME_USED_AS_HISTORICAL_BYTES = NO
```

## RC-TEST-05 current version baselines

F16 now uses the explicit, tracked and test-owned constant:

```text
CURRENT_KNOWLEDGE_OWNER_VERSION_BASELINE = 1.2.1
```

It independently checks both the observed owner runtime version and the emitted native request contract version. The expected value does not come from the runtime object being tested.

F17 now uses the explicit, tracked and test-owned baseline:

```text
CURRENT_OWNER_VERSION_BASELINE =
  Scientific Thinking 1.2.2
  Imaging 1.2.1
  Research Project Construction 1.1.0
  Document Projection 1.2.0
```

The observed values still come from the four owner exports, while the expected values remain independent literals. A future intentional owner version change therefore requires an explicit review and baseline update; it cannot pass tautologically.

## Changes

Exactly three test files were changed:

- `src/features/research-project-construction/__tests__/project-spine-03-native-owner-invocation.test.ts`;
- `src/features/system-integration/__tests__/contracts.test.ts`;
- `src/features/protocol-designer/functional-reset/__tests__/w1-qual-01h1t-contract-readback.test.ts`.

One Level 3 implementation report was added:

- `docs/implementation/canonical-test-repair-tranche-a-version-and-historical-evidence.md`.

```text
OWNER_RUNTIME_FILES_CHANGED = 0
SCIENTIFIC_CORPUS_FILES_CHANGED = 0
HISTORICAL_CAMPAIGN_D_FILES_CHANGED = 0
PROJECT_RUNTIME_FILES_CHANGED = 0
IMAGING_FILES_CHANGED = 0
QRY_FILES_CHANGED = 0
```

## Historical/current separation

The repaired semantics are visibly distinct:

```text
HISTORICAL_CAMPAIGN_D_ST_IDENTITY
  -> ST 1.2.1
  -> frozen commit and frozen digests
  -> read-only historical evidence

CURRENT_OWNER_VERSION_BASELINE
  -> Knowledge 1.2.1 / ST 1.2.2
  -> active integration contract
  -> explicit update required on future intentional version change
```

No historical digest was replaced with a current digest. No current test was forced back to a historical owner version. Technical readback remains distinct from scientific adjudication.

## Targeted validation

The first validation command ran only the three affected files:

```text
command = npm test -- \
  src/features/research-project-construction/__tests__/project-spine-03-native-owner-invocation.test.ts \
  src/features/system-integration/__tests__/contracts.test.ts \
  src/features/protocol-designer/functional-reset/__tests__/w1-qual-01h1t-contract-readback.test.ts

test_files = 3 passed / 3 total
tests = 12 passed / 12 total
TRANCHE_A_TARGETED_FAILURES = 0
```

The smallest additional version/historical regression set covered the current Project → ST/Imaging owner chain and the frozen H1T deterministic checker contract:

```text
test_files = 2 passed / 2 total
tests = 14 passed / 14 total
REGRESSION_FAILURES = 0
```

Canonical TypeScript validation was run once because TypeScript test files changed:

```text
command = npm run typecheck
exit = 0
CANONICAL_TYPECHECK = PASS
APP_MODULE_RESOLUTION = BUNDLER
VERCEL_API_MODULE_RESOLUTION = NODENEXT
RUNTIME_ALIAS_COUNT = 0
EXTENSIONLESS_RELATIVE_IMPORT_COUNT = 0
NODE_ESM_HANDLER_LOAD = PASS
```

The three changed TypeScript tests also passed targeted ESLint. `git diff --check` passed, and the targeted scan of the three tests plus this report found zero secret-shaped values.

```text
TARGETED_ESLINT_ERRORS = 0
TARGETED_ESLINT_WARNINGS = 0
GIT_DIFF_CHECK = PASS
TARGETED_SECRET_SCAN_MATCHES = 0
```

## Canonical validation

The canonical Vitest suite was run exactly once after targeted success:

```text
command = npm test -- --reporter=json --outputFile=/private/tmp/noxia-canonical-tranche-a.json
process_exit_observed = 0
json_success = false

test_files = 5 failed / 180 passed / 2 skipped / 187 total
tests = 6 failed / 3246 passed / 12 skipped / 3264 total

CANONICAL_FULL_TEST_RUNS = 1
RC_TEST_05_FAILURES_REMAINING = 0
RC_TEST_09_FAILURES_REMAINING = 0
NEW_UNEXPECTED_CANONICAL_FAILURES = 0
```

The JSON report is explicitly red and governs the interpretation of this run. The observed zero process exit despite `json_success = false` is recorded as a diagnostic inconsistency and is not used to claim a green suite. Release-gate composition is outside this mission and was not modified.

## Remaining root causes

All six residual failures reproduce the already classified non-Tranche-A groups:

| Root cause | Failures | Current affected assertions | Classification |
|---|---:|---|---|
| `RC-TEST-03` | 3 | ENG-002 applicability, ENG-003 external-search decision, IMG mandatory case 3 | stale Knowledge/applicability or external-search expectations |
| `RC-TEST-04` | 1 | IMG mandatory case 1 | negative matcher conflates governed dependency references with a created sequence |
| `RC-TEST-06` | 1 | Functional Reset 03B case 10 | stale presentation placeholder expectation |
| `RC-TEST-08` | 1 | W1 Imaging handoff case 17 | stale ST alternative subtype expectation |

```text
KNOWN_REMAINING_ROOT_CAUSES = RC-TEST-03, RC-TEST-04, RC-TEST-06, RC-TEST-08
CANONICAL_SUITE_GREEN = NO
```

No residual failure belongs to `RC-TEST-01`, `RC-TEST-02`, `RC-TEST-02P`, `RC-TEST-05`, `RC-TEST-07` or `RC-TEST-09`.

## Separate debts

The following debts remain open and unchanged:

```text
REP-001 = OPEN
STRICT_NODE_GRAPH_NULLABILITY_MISMATCH = OPEN
OPENAI_STRICT_SCHEMA_HARDENING_DEBT = OPEN
```

No lint cleanup, strict TypeScript migration or release-gate composition change was started.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
EXTERNAL_SCIENTIFIC_SEARCH = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
BROAD_PRODUCT_REPLAY = 0
CANONICAL_FULL_TEST_RUNS = 1
```

## Git

```text
HEAD_INITIAL = 9698ac4a6a14a5bf4493c0d42bed4c9d8e14bafe
commit_message = fix(test): reconcile owner versions and historical evidence
push = NO
deployment = NO
main_modified = NO
```

The exact local commit SHA is reported in the final mission output after the bounded commit is created.
