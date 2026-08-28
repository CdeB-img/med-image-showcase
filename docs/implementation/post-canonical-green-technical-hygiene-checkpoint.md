# NOXIA — Post-Canonical-Green Technical Hygiene Checkpoint

> **Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`
>
> **Normative authority:** `NONE`
>
> **Date:** 2026-08-28
>
> **Mission mode:** bounded read-only delta audit; no repair, product change, scientific execution, provider, network, browser, commit, push or deployment

## Decision

```text
DECISION = POST_CANONICAL_GREEN_TECHNICAL_HYGIENE_CLASSIFIED

NEXT_PRODUCTION_A_B_C_REPLAY_READINESS =
READY_FOR_HUMAN_REPLAY_WITH_NON_BLOCKING_TECHNICAL_DEBTS

CANONICAL_TESTS_LAST_MEASURED =
3252 PASSED / 0 FAILED / 12 SKIPPED / 3264 TOTAL
PROCESS_EXIT = 0
JSON_SUCCESS = true

PRODUCTION_REPLAY_BLOCKERS = 0
RELEASE_GATE_BLOCKERS = 3
ACTIVE_SKIPPED_COVERAGE_DEBTS = 4
HISTORICAL_OR_INTENTIONAL_SKIPS = 8
OPEN_TECHNICAL_DEBTS = 14
HUMAN_DECISIONS_REQUIRED = 3
```

This decision is technical and bounded. It does not constitute `SCIENTIFIC_PASS`, PD-011 qualification, deployment authorization, Wave 2 authorization or evidence that the current scientific corpus is complete.

The next manual Production A/B/C replay is not blocked by the local canonical-test repair delta: the nine local commits after Production change documentation, tests, fixtures, test/report tooling and Vitest discovery only. They change zero product-runtime files, zero scientific-runtime files and zero scientific-corpus files. Replay confidence nevertheless requires a fresh functional-reset session; the normal in-product reset clears the current key, while the separate error-boundary recovery mismatch remains an open debt.

## Git baseline

```text
BRANCH = protocol-designer-canonical-ingestion
HEAD = 442ed14a92d5c93a7f59770c7275dcab5850d89a
ORIGIN_MAIN = f504d8fc658ebdf17757e589f610e8f56c24e335
ORIGIN_PROTOCOL_DESIGNER_BRANCH = 312b4b9c45de57ed3a6339dcc703f79955fbc36c
GIT_STATUS_INITIAL = CLEAN
COMMITS_AHEAD_OF_ORIGIN_MAIN = 9
COMMITS_AHEAD_OF_ORIGIN_PROTOCOL_DESIGNER_BRANCH = 14
```

Authorities were consulted in the required order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, official version 1.45;
2. `NOXIA — Charte fondatrice`, version 1.0, current controlled PDF;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2.0`, current controlled PDF;
4. `Editorial Engine — Architecture Manifesto`, version 1.0.

The Level 3 reports named in the mission were then read as implementation evidence only. No normative contradiction was identified. No specialized authority was needed to decide the purely technical reachability, gate-composition and repository-hygiene questions beyond the ownership and projection boundaries already stated by the four authorities.

Protected local state:

```text
.git/info/exclude SHA-256 = dd6dc883aead48d57c54852babd79010e9476dae8f3a1654a4dabf40201f5da3
.git/info/exclude CHANGED SINCE TRIAGE = NO
EXACT EXCLUDE RULES = 54
PHYSICALLY PRESENT = 54
MISSING = 0
TRACKED AMONG PRESENT = 0
```

The historical reports repeatedly call this set “53 artifacts”, but the protected file has 54 exact rules and all 54 targets are physically present. Because the file hash exactly matches the protected hash recorded by the pre-repair triage, this is a pre-existing cardinality/documentation discrepancy, not a mutation by this mission. The historically declared 53 are therefore preserved; one additional exact excluded target is also present. The set was neither enumerated nor modified.

## Canonical green evidence inherited

The final canonical evidence was produced at this exact `HEAD` by Tranche B and was not rerun:

```text
COMMAND = npm test -- --reporter=json --outputFile=/private/tmp/noxia-tranche-b-canonical.json
TEST_SUITES = 460 PASSED / 0 FAILED
PASSED_TESTS = 3252
FAILED_TESTS = 0
SKIPPED_TESTS = 12
TOTAL_TESTS = 3264
PROCESS_EXIT = 0
JSON_SUCCESS = true
```

The JSON result remains locally readable and reports the same values. This is current technical regression evidence, not scientific validation.

## Twelve skipped tests

All 12 skipped tests in the final canonical JSON are tracked by Git. There are eight static legacy skips and four missing-evidence conditional skips.

| SKIP_ID | TEST_FILE | TEST_NAME | TRACKED_BY_GIT | SKIP_MECHANISM | SKIP_CONDITION | SURFACE | CURRENT_REACHABILITY | ORIGINAL_PURPOSE | CURRENT_CONTRACT_STILL_EXISTS | EVIDENCE_REQUIRED_TO_ENABLE | PROVIDER_OR_NETWORK_REQUIRED | HUMAN_EVIDENCE_REQUIRED | RISK_IF_LEFT_SKIPPED | DISPOSITION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SKIP-01 | `src/features/adaptive-research-workspace/__tests__/v1-1-standard-conversational-workspace.test.tsx` | `LEGACY V11-UX-C16 — ancien stepper d’orientation retiré du chemin nominal` | YES | `STATIC_TEST_SKIP` | unconditional `it.skip` | removed V1.1 orientation stepper | `DECOMMISSIONED` | prove the former three-way orientation stepper existed | NO | separate human decommission/archival decision; no runtime evidence can restore a removed UI | NO | NO | LOW; it supplies no current coverage, but its label is explicit | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-02 | `src/features/knowledge-engine/__tests__/understand-ui.test.tsx` | `renders a covered specialized question from KnowledgeResult sources` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Guided Intake → Knowledge UI handoff | `UNREACHABLE_HISTORICAL` | render a sourced covered Knowledge answer | PARTIAL | reconstruct the removed Guided Intake route or replace only after an explicit current-surface coverage decision | NO | NO | LOW for the nominal route; current Knowledge coverage is exercised elsewhere | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-03 | same file | `does not let empty intake fields erase an explicit MRI modality` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Guided Intake → Knowledge UI handoff | `UNREACHABLE_HISTORICAL` | preserve explicit MRI context | PARTIAL | same old-route reconstruction or deliberate replacement on the current route | NO | NO | LOW; the old handoff is absent and current routing tests preserve terms | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-04 | same file | `shows partial MRI/CT coverage without dropping either branch` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Guided Intake → Knowledge UI handoff | `UNREACHABLE_HISTORICAL` | display bounded two-branch partial coverage | PARTIAL | same old-route reconstruction or deliberate current-product equivalent | NO | NO | LOW; exact UI is obsolete, underlying behavior has current tests | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-05 | same file | `shows an honest stop for an uncovered Fourier question without a scenario` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Guided Intake → Knowledge UI handoff | `UNREACHABLE_HISTORICAL` | display an honest no-corpus stop | PARTIAL | same old-route reconstruction or explicit current-product equivalent | NO | NO | LOW; exact UI is obsolete | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-06 | same file | `refuses an individual T2 interpretation` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Guided Intake safety UI | `UNREACHABLE_HISTORICAL` | refuse individual clinical-value interpretation | PARTIAL | same old-route reconstruction or explicit current-surface safety coverage | NO | NO | LOW for this historical test; it must not be cited as current safety evidence | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-07 | same file | `keeps a documented contextual divergence visible` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Guided Intake controversy UI | `UNREACHABLE_HISTORICAL` | retain the synthetic-haematocrit controversy in presentation | PARTIAL | same old-route reconstruction or deliberate current-surface equivalent | NO | NO | LOW; current contradiction preservation has other active evidence | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-08 | same file | `persists the KnowledgeResult locally with a visible history and depth controls` | YES | `STATIC_SUITE_SKIP` | parent `describe.skip` | old Knowledge snapshot UI/key | `UNREACHABLE_HISTORICAL` | prove the former local Knowledge history and depth controls | PARTIAL | reconstruct the old storage/UI contract or decide a current-ledger replacement | NO | NO | LOW; exact storage/UI is superseded, but it is not current persistence coverage | `HISTORICAL_INTENTIONAL_SKIP` |
| SKIP-09 | `src/features/scientific-interpretation/__tests__/functional-reset-gate.test.ts` | `FRG-C01 preserves the colchicine study roles and its two-turn correction without downstream projection` | YES | `MISSING_EVIDENCE_SKIP` | `FUNCTIONAL_RESET_GATE_EVIDENCE` absent → `describe.skip` | direct Scientific Interpretation provider evidence | `ACTIVE_COMPATIBILITY` | preserve roles, corrections, timing/age, no automatic adoption/write | YES | frozen `GateEvidence` JSON containing runtime identity plus scenario1 initial/correction/timing-and-age envelopes | YES | NO | MEDIUM for claims about the alternate direct Scientific Interpretation corridor; not required for current Production A/B/C UNDERSTAND replay | `ACTIVE_EVIDENCE_GATED_COVERAGE_DEBT` |
| SKIP-10 | same file | `FRG-C02 distinguishes a true cardiac CT versus MRI modality comparison` | YES | `MISSING_EVIDENCE_SKIP` | same | direct Scientific Interpretation provider evidence | `ACTIVE_COMPATIBILITY` | preserve a true CT-versus-MRI relation | YES | same frozen evidence file with `scenario2Comparison` | YES | NO | MEDIUM for that compatibility corridor; not a nominal A/B/C blocker | `ACTIVE_EVIDENCE_GATED_COVERAGE_DEBT` |
| SKIP-11 | same file | `FRG-C03 preserves intervention, longitudinal imaging, variable timing and unresolved visual stability` | YES | `MISSING_EVIDENCE_SKIP` | same | direct Scientific Interpretation provider evidence | `ACTIVE_COMPATIBILITY` | preserve intervention, timepoints, timing uncertainty, grouping and unresolved definition | YES | same frozen evidence file with `scenario3Longitudinal` | YES | NO | MEDIUM for that compatibility corridor; not a nominal A/B/C blocker | `ACTIVE_EVIDENCE_GATED_COVERAGE_DEBT` |
| SKIP-12 | same file | `FRG-C04 represents a different demographic eligibility restriction without changing its direction` | YES | `MISSING_EVIDENCE_SKIP` | same | direct Scientific Interpretation provider evidence | `ACTIVE_COMPATIBILITY` | preserve a lower-bound demographic restriction without inversion | YES | same frozen evidence file with `controls.demographicEligibility` | YES | NO | MEDIUM for that compatibility corridor; not a nominal A/B/C blocker | `ACTIVE_EVIDENCE_GATED_COVERAGE_DEBT` |

Consistency:

```text
SKIPPED_TESTS_TOTAL = 12
STATIC_LEGACY_SKIPS = 8
ACTIVE_EVIDENCE_GATED_SKIPS = 4
TRACKED_SKIPS = 12
UNTRACKED_SKIPS_IN_CANONICAL_RESULT = 0
```

## Functional Reset evidence-gated skips

The conditional suite expects one JSON object with:

- runtime: `runtimeId`, `runtimeVersion`, model `gemini-3.5-flash-lite`, `logicalInterpretations = 5`, `maximumProviderStarts = 6`;
- scenarios: `scenario1Initial`, `scenario1Correction`, `scenario1TimingAndAge`, `scenario2Comparison`, `scenario3Longitudinal`;
- control: `demographicEligibility`;
- every scenario/control as a `ScientificInterpretationContributionEnvelope` with runtime evidence, source turns/refs, structured content, audit and decision boundary.

Current producer qualification:

```text
EVIDENCE_VARIABLE = FUNCTIONAL_RESET_GATE_EVIDENCE
TRACKED_EVIDENCE_FILE = NONE
TRACKED_PRODUCER_COMMAND = NONE
CURRENT_PRODUCER_EXISTS = NO_TRACKED_PRODUCER_IDENTIFIED
ABSENCE_FROM_CANONICAL_RUN = INTENTIONAL_BY_CONDITIONAL_DESIGN
EVIDENCE_READBACK_DETERMINISTIC = YES
EVIDENCE_GENERATION_DETERMINISTIC = NO
PROVIDER_REQUIRED_TO_REGENERATE_ORIGINALLY_EXPECTED_EVIDENCE = YES
NETWORK_REQUIRED = YES
SCIENTIFIC_REPLAY_REQUIRED = YES
HUMAN_SCIENTIFIC_EVIDENCE_REQUIRED = NO
HUMAN_PROGRAM_AUTHORIZATION_REQUIRED_BEFORE_PROVIDER_RUN = YES
PROTECTS_NOMINAL_CURRENT_PRODUCT_UI = NO
PROTECTS_ACTIVE_COMPATIBILITY_CONTRACT = YES
REQUIRED_BEFORE_NEXT_PRODUCTION_A_B_C_REPLAY = NO
```

The assertions are deterministic once a frozen input file exists. The missing producer and provider-bound generation mean the four tests cannot be promoted into the canonical gate by merely setting an environment variable. No evidence was fabricated or generated.

## Previous false-green audit disposition

| FINDING_ID | PREVIOUS_STATUS | CURRENT_STATUS | CURRENT_EVIDENCE | FILES_OR_CONFIG | LAST_RELEVANT_CHANGE | REVERIFIED_NOW | WHY | IMPACT | NEXT_ACTION_CLASS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FG-001 | P1 critical false-green | `OPEN_CONFIRMED` | build passes while lint exits 1; scripts omit tests/lint | `package.json`, `vercel.json` | `f504d8fc` strengthened TypeScript only | YES | Vercel still runs `npm run build = typecheck && vite build` | a deployment can be Ready with failing tests or lint | `FIX_BEFORE_RELEASE_GATE_COMPOSITION` |
| FG-002 | P1 critical false-green | `OPEN_UNCHANGED_BY_GIT` | `strict=false`, `noImplicitAny=false`, 131 active non-test/non-manual `.mjs`, 0 in app TS program, seven active Knowledge imports | `tsconfig.app.json`, Knowledge adapters | no relevant config change after `f504d8fc` | YES | app TS still excludes the active `.mjs` implementation graph | typecheck PASS remains partial evidence | `SHOULD_FIX_SOON` |
| TD-001 | P1, 25 canonical failures | `CLOSED` | exact-head canonical result: 3252/0/12 | Tranche repairs and canonical JSON | `442ed14a` | YES | all 25 failures were assigned and the nine root causes closed without unknown residual | no known canonical failure remains | `HISTORICAL_OR_INTENTIONAL` |
| REP-001 | P1 reproducibility risk | `OPEN_CONFIRMED` | dependency and lock still resolve a sibling; installed package is a symlink; sibling has 42 status entries | `package.json`, `package-lock.json`, `node_modules/@editorial-engine/core` | dependency introduced `dd3b5c11`; RC-TEST-01 changed test semantics only | YES | a standalone clone lacks `../../editorial-engine/packages/core` | clean install/execution is machine-state dependent | `FIX_BEFORE_RELEASE_GATE_COMPOSITION` |
| LEG-001 | P1 legacy reachability | `OPEN_CONFIRMED` | both endpoints exist; default hybrid mode can fall back to `LEGACY_SEM_FULL`; degraded result can be HTTP 200 with explicit metadata | `api/scientific-interpretation.ts`, `api/scientific-semantic.ts`, rollback/runtime | `4f975db0` | YES | compatibility corridor remains executable though absent from nominal UI | direct/old clients can consume degraded legacy output if metadata is ignored | `HUMAN_DECISION_REQUIRED` |
| PERS-001 | P1 persistence risk | `OPEN_UNCHANGED_BY_GIT` | shallow session shell, silent fresh-session fallback, error boundary omits current v3 key; normal reset clears it | `functional-reset/session.ts`, `ProtocolDesignerErrorBoundary.tsx`, conversation reset | current key `deb79d53`; relevant product route last changed `312b4b9c` | YES | recovery can reload the same nested-invalid state | can corrupt/repeat a browser recovery loop, not owner ledgers that fail rehydration | `SHOULD_FIX_SOON` |
| CFG-001 | P2 configuration drift | `OPEN_UNCHANGED_BY_GIT` | mode/evidence-dir absent from example; invalid mode selects hybrid fallback | API config and `.env.local.example` | `4f975db0` | YES | deployment behavior can differ without explicit invalid-config failure | affects alternate API semantics and evidence location | `HUMAN_DECISION_REQUIRED` |
| TEST-001 | P2 skipped evidence coverage | `OPEN_CONFIRMED` | exactly four conditional skips; no tracked evidence or producer command | `functional-reset-gate.test.ts` | `6b8cad62` | YES | normal canonical command cannot prove those checks ran | limits claims about direct provider-based Scientific Interpretation evidence | `HUMAN_DECISION_REQUIRED` |
| TD-002 | P2 lint debt | `OPEN_CONFIRMED` | fresh `eslint .`: 23 errors, 35 warnings | ESLint config, tracked experiments, ignored `.venv`, UI components | config last changed `bf0160e9`; no repair after audit | YES | tracked experiment errors and ignored local assets keep the global command red/environment-dependent | lint cannot yet be a reliable blocking release gate | `FIX_BEFORE_RELEASE_GATE_COMPOSITION` |
| TD-003 | P2 OpenAI schema debt | `OPEN_CONFIRMED` | exported debt remains `OPEN`; request uses JSON Schema `strict:false`; deterministic post-validation remains | OpenAI extraction provider/tests | `cae56c51` | YES | transport contract is permissive even though writes fail closed | extra retry/blocking risk on DESIGN_STUDY extraction, no silent Project adoption shown | `SHOULD_FIX_SOON` |
| REP-002 | P2 repository hygiene | `OPEN_CONFIRMED` | two lockfiles, four `.venv` scripts, two `../docs-audit` commands, 20 tracked `.vite/deps` files | locks, package scripts, generated cache | no relevant repair after `f504d8fc` | YES | machine-local assumptions remain | clean-clone and developer reproducibility remain ambiguous/noisy | `SHOULD_FIX_SOON` |
| PERF-001 | P2 performance debt | `OPEN_CONFIRMED` | current demo chunk 1,041.45 kB; main index 758.92 kB minified | Vite output/product bundle | no relevant runtime delta after Production | YES | both exceed Vite's 500 kB notice threshold | possible load latency/memory cost, not correctness | `NON_BLOCKING_KNOWN_DEBT` |
| DOC-001 | P2 roadmap drift | `OPEN_CONFIRMED` | roadmap still says serverless typecheck gate is open/non-blocking | integration roadmap vs `package.json`/gate | roadmap `cf159179`; gate `f504d8fc` | YES | code now includes all `api/**/*.ts` in blocking canonical typecheck | program state can be misread | `SHOULD_FIX_SOON` |
| HIST-001 | P3 safe historical skips | `HISTORICAL_ONLY` | eight exact static legacy skips; current App routes only functional-reset workspace | two legacy suites, `App.tsx`, `ProtocolDesignerDemo.tsx` | tests predate current route; no reactivation | YES | exact old surfaces are removed/unrouted | no nominal-route gap, provided they are not cited as current evidence | `HISTORICAL_OR_INTENTIONAL` |
| WARN-001 | P3 visible warnings | `OPEN_CONFIRMED` | current build reproduces Browserslist age, two Rollup annotation notices, CSS syntax warning and large chunks; install-script warnings were not re-run | dependencies, Tailwind scan inputs, Vite | no relevant repair after audit | YES for build; NO for clean install | warning noise remains; install warning status is not refreshed because install was forbidden | can obscure new warnings; no blocking runtime failure demonstrated | `NON_BLOCKING_KNOWN_DEBT` |
| STRICT_NODE_GRAPH_NULLABILITY_MISMATCH | separate non-canonical debt | `OPEN_CONFIRMED` | exactly three `TS2322/TS2345` errors in the same two files | `tsconfig.node.json`, product bridge, contribution boundary | source lines predate `f504d8fc`; no local repair | YES | strict transitive Node graph rejects optional/null shapes accepted by canonical non-strict graphs | weakens type confidence on Project contribution boundaries; not used by A/B/C UNDERSTAND | `SHOULD_FIX_SOON` |
| CANONICAL_TEST_EXIT_FALSE_GREEN | Tranche A anomaly | `NOT_REPRODUCED` | Tranche B proved focused failure → exit 1 and final green → exit 0/JSON true; runner/config unchanged | npm/Vitest runner and Tranche B evidence | `442ed14a` recorded final proof | NO intentional failure in this mission | no persistent runner defect is demonstrated | no current blocker; retain historical anomaly | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-01 | 3 external-worktree failures | `CLOSED` | canonical green; guard now checks repository-local ownership boundary and never sibling cleanliness | protected-surface helper/tests | `0852fb2f` | YES | mutable sibling status no longer affects canonical tests | test reproducibility root cause closed; REP-001 packaging stays open | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-02 | 11 stale fixture failures | `CLOSED` | governed human-approved references; live contradiction still fails closed; canonical green | governed Imaging fixtures/downstream tests | `27a468db` | YES | mutable live assembly no longer masquerades as frozen reference | fixture cause closed without scientific PASS | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-02P | ambiguous fixture producer provenance | `CLOSED` | explicit `fixtureProducer=TEST_HARNESS`, `runtimeOwnerExecuted=false`, null runtime result ID | governed Imaging references/tests | `9698ac4a` | YES | contract owner and producer provenance are machine-distinct | no runtime execution can be inferred from reference metadata | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-03 | 3 stale Knowledge expectations | `CLOSED` | canonical green; current SOFT applicability/external-search behavior asserted | ENG/IMG tests | `442ed14a` | YES | expectations now preserve limited applicability and legitimate `INTERNAL_ONLY` | no external provider forced | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-04 | over-broad Imaging negative matcher | `CLOSED` | governed dependency refs separated from executable Level 3 generation | Imaging mandatory test | `442ed14a` | YES | test now protects the actual non-generation contract | provenance no longer mistaken for execution | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-05 | stale owner versions | `CLOSED` | explicit current Knowledge/ST/IMG/PRJ/DOC test-owned baselines | Project/System tests | `3d83602b` | YES | current version contract is independent and deliberate | version drift remains detectable | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-06 | stale UX placeholder | `CLOSED` | exact intent-aware DESIGN_STUDY string plus preserved one-input/no-Continue invariants | Functional Reset 03B test | `442ed14a` | YES | only stale presentation expectation changed | no product or QRY behavior changed | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-07 | untracked tests in canonical discovery | `CLOSED` | canonical discovery uses Git-tracked tests; explicit historical path remains invocable | canonical-test-files helper/tests, Vitest config | `c5238346` | YES | local ignored files no longer alter the canonical graph | canonical count is repository-reproducible with respect to tracked tests | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-08 | stale ST alternative subtype | `CLOSED` | multiple explicit `ALTERNATIVE` identities/content preserved into Imaging | W1 handoff test | `442ed14a` | YES | test no longer forces legacy fallback subtype | plurality remains protected without promotion | `HISTORICAL_OR_INTENTIONAL` |
| RC-TEST-09 | historical ST readback against current bytes | `CLOSED` | Campaign D 1.2.1 evidence read from frozen commit/registry; current ST 1.2.2 separate | H1T readback test | `3d83602b` | YES | historical evidence is no longer compared to mutable runtime paths | no historical hash rewrite | `HISTORICAL_OR_INTENTIONAL` |

```text
PRIOR_P1_FINDINGS_ACCOUNTED = ALL
PRIOR_P2_FINDINGS_ACCOUNTED = ALL
RC_TEST_01_THROUGH_09_ACCOUNTED = ALL
```

## Fresh lint state

```text
LINT_COMMAND = npm run lint
LINT_EXIT = 1
LINT_ERRORS = 23
LINT_WARNINGS = 35
CANONICAL_LINT_RUNS = 1
```

| Group | Errors | Warnings | Current interpretation |
| --- | ---: | ---: | --- |
| `ACTIVE_PRODUCT_SRC` | 0 | 7 | seven React Fast Refresh warnings in shared UI components |
| `API` | 0 | 0 | no reported lint issue |
| `TESTS` | 0 | 0 | no reported lint issue |
| `SCRIPTS` | 0 | 0 | no reported lint issue |
| `TRACKED_EXPERIMENT` | 12 | 0 | `no-explicit-any` in three tracked experimental runner files |
| `IGNORED_LOCAL_ENVIRONMENT` | 11 | 28 | generated JS inside ignored `experiments/.venv`; machine-dependent and not first-party tracked source |
| `GENERATED_OR_CACHE` | 0 | 0 | `.vite` is explicitly ignored by ESLint even though 20 files are tracked by Git |
| `OTHER` | 0 | 0 | none |
| **Total** | **23** | **35** | global lint remains red and non-reproducible across local environments |

Tracked first-party experiments and the ignored virtual environment must not be collapsed into one count. The current active product/api/test/script surface has zero lint errors; this does not make `eslint .` green.

## Fresh build state

```text
BUILD_COMMAND = npm run build
BUILD_EXIT = 0
BUILD_PASS = YES
CANONICAL_BUILD_RUNS = 1

TYPECHECK_STAGE = PASS
  configuration gate = PASS
  app graph = PASS
  Vercel api/**/*.ts NodeNext graph = PASS
  Scientific Interpretation strict server graph = PASS
  static runtime modules = 18
  runtime aliases = 0
  extensionless relative imports = 0
  Node ESM handler load = PASS

VITE_BUILD_STAGE = PASS
MODULES_TRANSFORMED = 1990
VITE_BUILD_DURATION = 2.94s
```

Fresh build warnings:

- `caniuse-lite` data 14 months old;
- two `react-helmet-async` PURE-annotation notices removed by Rollup;
- one generated CSS syntax warning: `Expected identifier but found "-"` around `-: .TZ;`;
- chunks above 500 kB.

Current chunk summary:

| Chunk | Minified | Gzip |
| --- | ---: | ---: |
| `ProtocolDesignerDemo-8CDFSR2x.js` | 1,041.45 kB | 201.31 kB |
| `index-DqL6eLc3.js` | 758.92 kB | 220.52 kB |
| CSS index | 93.11 kB | 15.64 kB |

`BUILD_PASS` proves only the configured TypeScript and Vite build stages. It does not prove tests, lint, scientific quality or clean-clone reproducibility.

## TypeScript contract state

```text
APP_TS_STRICT = false
APP_TS_NO_IMPLICIT_ANY = false
APP_TS_SKIP_LIB_CHECK = true
TRACKED_SRC_TS_TSX_COUNT = 606
TRACKED_SRC_MJS_COUNT = 145
TRACKED_ACTIVE_SRC_MJS_COUNT = 131
APP_TS_PROGRAM_MJS_COUNT = 0
ACTIVE_KNOWLEDGE_IMPORTS_CROSSING_UNTYPED_MJS_BOUNDARY = 7
TRACKED_API_TS_COUNT = 12
```

The seven active boundaries remain:

- `knowledge-graph/catalog.mjs`;
- `scientific-consolidation/review.mjs`;
- `scientific-consolidation/sources.mjs`;
- `scientific-consolidation/contradictions.mjs`;
- `scientific-multidomain/assertions.mjs`;
- `scientific-multidomain/sources.mjs`;
- `scientific-multidomain/contradictions.mjs`.

No relevant TypeScript configuration changed after the prior audit. The earlier 479-diagnostic experimental probe was not rerun. Its broad count is not a current canonical error count; the bounded current fact is that the app gate remains non-strict and excludes `.mjs`.

## Strict Node nullability debt

```text
STRICT_NODE_COMMAND = ./node_modules/.bin/tsc -p tsconfig.node.json --noEmit
STRICT_NODE_EXIT = 2
STRICT_NODE_ERROR_COUNT = 3
STRICT_NODE_ERROR_CODES = TS2322, TS2345, TS2345
STRICT_NODE_FILES =
  src/features/protocol-designer/product-bridge.ts
  src/features/research-project-construction/contribution-owner-boundary.ts
STRICT_NODE_DIAGNOSTIC_RUNS = 1
```

The three divergences are unchanged in nature:

1. `product-bridge.ts:1240`: `studyUnitOrGroupRef` may be `undefined`, while the target contract permits only `string | null`;
2. `contribution-owner-boundary.ts:1151`: prior canonical object provenance permits `sourceText: null`, while `reviewObjectLabel` expects `string`;
3. `contribution-owner-boundary.ts:1152`: the candidate variant has the same `sourceText` mismatch.

The blamed source lines predate RC-TEST-07 and the entire local nine-commit repair delta. This is the same previously qualified non-canonical strict-graph debt, not a new Tranche B regression. It touches Project contribution/review boundaries and should be repaired separately, but it does not execute in the current A/B/C `UNDERSTAND` product corridor.

## Release-gate composition

Exact commands:

```text
npm run typecheck =
  npm run check:typescript-gate &&
  npm run typecheck:app &&
  npm run typecheck:vercel-api &&
  npm run check:scientific-interpretation-server

npm test = vitest run
npm run lint = eslint .
npm run build = npm run typecheck && vite build

VERCEL_BUILD_COMMAND = npm run build
VERCEL_OUTPUT_DIRECTORY = dist
VERCEL_FRAMEWORK = null
```

No tracked CI workflow adds tests or lint.

```text
TESTS_BLOCK_DEPLOYMENT = NO
LINT_BLOCKS_DEPLOYMENT = NO
TYPECHECK_BLOCKS_DEPLOYMENT = YES
VITE_BUILD_BLOCKS_DEPLOYMENT = YES
```

A future deployment can still become Vercel `Ready` when canonical tests fail or lint fails. Canonical tests are now green, so adding them is technically feasible. Gate composition should still wait until the lint scope is reproducible/green and REP-001 no longer makes a clean install depend on a sibling checkout.

## Editorial Engine dependency reproducibility

```text
DEPENDENCY_DECLARATION = @editorial-engine/core -> file:../../editorial-engine/packages/core
LOCKFILE_REPRESENTATION = link:true; resolved ../../editorial-engine/packages/core; package version 0.1.0
CURRENT_INSTALLED_RESOLUTION = symlink ../../../../editorial-engine/packages/core
CURRENT_SIBLING_HEAD = 335fbbea8d138901f0cdf4f5e2d3b96144880e8b
CURRENT_SIBLING_STATUS_ENTRIES = 42
STANDALONE_CLONE_HAS_REQUIRED_SOURCE = NO
SIBLING_WORKTREE_REQUIRED_FOR_INSTALL_OR_EXECUTION = YES
EXTERNAL_WORKTREE_STATE_AFFECTS_CANONICAL_TESTS = NO
CLEAN_CLONE_REPRODUCIBILITY_RISK = OPEN_CONFIRMED_P1
```

RC-TEST-01 correctly removed sibling cleanliness from canonical test semantics. It did not package or pin the dependency. Current installed execution still resolves live sibling bytes; a standalone NOXIA clone does not contain the referenced source.

## OpenAI strict-schema debt

```text
OPENAI_STRICT_SCHEMA_HARDENING_DEBT = OPEN
REQUEST_STRICT_MODE = false
DETERMINISTIC_DOWNSTREAM_VALIDATION = YES
INVALID_PROJECT_WRITE_BLOCKED = YES
NOMINAL_PRODUCT_CORRIDOR_DEPENDS_ON_THIS_PROVIDER = PARTIAL
CURRENT_DEBT_STATUS = OPEN_CONFIRMED
```

The provider is relevant to persistent candidate extraction after a `DESIGN_STUDY` path. Current `UNDERSTAND` A/B/C routing does not depend on it. Provider-contract parsing, source-anchor materialization and deterministic validation still block invalid Project writes; permissive schema mode remains contract-hardening debt rather than proof of a silent write.

## Alternate API / legacy fallback

```text
ENDPOINT_CURRENTLY_REACHABLE = YES
  /api/scientific-interpretation
  /api/scientific-semantic (deprecated adapter)
NOMINAL_PRODUCT_UI_USES_ENDPOINT = NO
DEFAULT_MODE = HYBRID_ACTIVE_WITH_LEGACY_FALLBACK
INVALID_OR_MISSING_MODE_BEHAVIOR = SELECT_DEFAULT_HYBRID_WITH_LEGACY_FALLBACK
LEGACY_FALLBACK_REACHABLE = YES_ON_ELIGIBLE_TECHNICAL_FAILURE
FALLBACK_METADATA_EXPLICIT = YES
HTTP_SUCCESS_POSSIBLE_ON_DEGRADED_FALLBACK = YES
CLASSIFICATION = NON_BLOCKING_COMPATIBILITY_DEBT
```

The response exposes `technicalStatus=FALLBACK_ACTIVE`, `fallbackUsed=true`, fallback diagnostics and zero Project writes. This prevents a fully silent fallback but cannot protect a direct/legacy client that ignores the metadata. Retention, fail-closed default or retirement requires a human program decision after consumer inventory.

## Persistence and recovery

Current state:

- `FUNCTIONAL_RESET_STORAGE_KEY = noxia-protocol-designer-functional-reset-v3`;
- current contract `1.7.0` validation checks the outer shell, arrays, owner contract labels and ledger session IDs, but does not deeply validate every nested entry/project/document/trace shape before acceptance;
- legacy contracts `1.2.0`–`1.6.0` migrate toward 1.7.0 and are then shell-checked;
- invalid JSON, invalid migration or any caught rehydration error returns a fresh session without a user-visible rejection diagnostic;
- normal in-workspace `Recommencer` calls `clearFunctionalResetSession` and removes the current v3 key;
- the top-level `ProtocolDesignerErrorBoundary` calls `clearProtocolDesignerConversationalWorkspace`, which clears older intake/conversation/scientific-interpretation keys but not the current functional-reset v3 key.

```text
PERSISTENCE_DEBT = OPEN_CONFIRMED
CURRENT_KEY_CLEARED_BY_NORMAL_RESET = YES
CURRENT_KEY_CLEARED_BY_ERROR_BOUNDARY_RESET = NO
INVALID_STATE_FAILS_TO_FRESH_SESSION = YES_SILENTLY
STALE_OWNER_RESULT_AUTOMATICALLY_UPGRADED = NO_EVIDENCE
```

For the next manual A/B/C replay, use a fresh functional-reset session through the normal product reset. The code debt can be deferred for that bounded replay under this precondition; it should not be deferred indefinitely.

## Configuration drift

| Variable | DOCUMENTED | DEFAULT | INVALID_VALUE_BEHAVIOR | FAIL_CLOSED_OR_FALLBACK | CURRENT_RISK |
| --- | --- | --- | --- | --- | --- |
| `SCIENTIFIC_INTERPRETATION_MODE` | NO in `.env.local.example` | `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` | any unrecognized value selects the same default | FALLBACK | legacy fallback can activate without explicit valid configuration |
| `SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR` | NO | `/tmp/noxia-scientific-interpretation` | any non-empty string becomes a path; absence uses default | neither semantic fail-closed nor promotion; storage path choice | evidence location differs by environment and can be ephemeral |
| `FUNCTIONAL_RESET_GATE_EVIDENCE` | NO | absent → four tests skipped | non-existent/unreadable non-empty path fails module read; absence skips | SKIP_ON_ABSENCE | a normal run omits active compatibility evidence without a named producer |
| `VERCEL_GIT_COMMIT_SHA` | NO in local example; implicit Vercel platform input | empty | malformed value becomes empty build SHA | explicit visible fallback `DEV · LOCAL` | local/non-Vercel build lacks forensic commit identity; no secret risk |

No environment value was read, set or changed.

## Repository reproducibility hygiene

| Sub-finding | Current state | Disposition |
| --- | --- | --- |
| npm lock | `package-lock.json` tracked | current Vercel/npm path uses it |
| Bun lock | `bun.lockb` also tracked | dual-authority ambiguity remains |
| generated Vite cache | 20 files under `.vite/deps` tracked; ESLint ignores `.vite` | stale-cache/review-noise debt remains |
| ignored Python environment | `experiments/.venv` untracked/ignored | four package scripts require its local Python directly |
| documentary sibling | two commands default to `../docs-audit` | standalone assumptions remain |
| Editorial sibling | package source outside repository | REP-001 remains the blocking reproducibility item |

No install, update, package publication, cache removal, lock choice or sibling change occurred.

## Local delta from Production

Local commits after `origin/main`:

```text
b07c3e3e docs(protocol-designer): preserve product checkpoint forensic reports
933646da docs(infra): preserve technical debt false-green audit
34bd86b8 docs(test): preserve canonical failure root-cause triage
c5238346 fix(test): make canonical discovery repository-reproducible
0852fb2f fix(test): decouple editorial guard from sibling worktree state
27a468db fix(test): rebuild governed imaging reference fixtures
9698ac4a fix(test): clarify governed imaging fixture provenance
3d83602b fix(test): reconcile owner versions and historical evidence
442ed14a fix(test): reconcile final canonical expectations
```

Diff:

```text
40 files changed, 5928 insertions, 103 deletions
```

| Category | Files | Additions | Deletions |
| --- | ---: | ---: | ---: |
| `DOCUMENTATION_ONLY` | 12 | 4691 | 0 |
| `TEST_ONLY / TEST_HARNESS` | 22 | 1176 | 89 |
| `TEST_REPORT_TOOLING` | 5 | 59 | 13 |
| `BUILD_OR_TEST_CONFIG` | 1 | 2 | 1 |
| `PRODUCT_RUNTIME` | 0 | 0 | 0 |
| `SCIENTIFIC_RUNTIME` | 0 | 0 | 0 |
| `SCIENTIFIC_CORPUS` | 0 | 0 | 0 |
| `OTHER` | 0 | 0 | 0 |

```text
LOCAL_COMMITS_SINCE_PRODUCTION = 9
PRODUCT_RUNTIME_FILES_CHANGED_SINCE_PRODUCTION = 0
SCIENTIFIC_RUNTIME_FILES_CHANGED_SINCE_PRODUCTION = 0
TEST_OR_HARNESS_FILES_CHANGED_SINCE_PRODUCTION = 28
DOCUMENTATION_FILES_CHANGED_SINCE_PRODUCTION = 12
```

The 28 test/harness count includes 22 tests/fixtures, five test/report tools and one Vitest configuration file. File categories do not by themselves authorize a push or deployment.

## Current debt register

One row represents one causal debt. `LEG-001` and `CFG-001` are combined here because their common cause is the permissive alternate-API compatibility policy; they remain separately accounted for in the prior-finding table.

| DEBT_ID | TITLE | PREVIOUS_STATUS | CURRENT_STATUS | CURRENT_EVIDENCE | PRIMARY_ACTION_CLASS | RISK | AFFECTED_SURFACE | MINIMUM_FUTURE_REPAIR | ESTIMATED_SCOPE | BLOCKS_NEXT_PRODUCTION_REPLAY | BLOCKS_RELEASE_GATE_HARDENING | HUMAN_DECISION_REQUIRED |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FG-001 | incomplete release gate composition | P1 open | `OPEN_CONFIRMED` | tests/lint absent from build/Vercel | `FIX_BEFORE_RELEASE_GATE_COMPOSITION` | false-green deployment | release engineering | one explicit blocking gate after lint/reproducibility prerequisites | SMALL | NO | YES | NO |
| FG-002 | partial/non-strict TypeScript contract | P1 open | `OPEN_CONFIRMED` | 131 active `.mjs`; seven Knowledge imports; 0 app-program `.mjs` | `SHOULD_FIX_SOON` | untyped runtime drift | Knowledge/type system | incrementally type/check the seven active boundaries without weakening gates | MEDIUM | NO | NO | NO |
| REP-001 | mutable sibling Editorial package | P1 open | `OPEN_CONFIRMED` | file link + live symlink + absent standalone source | `FIX_BEFORE_RELEASE_GATE_COMPOSITION` | non-reproducible install/execution | dependency packaging | pin/vendor/publish an immutable package boundary | MEDIUM | NO | YES | NO |
| LEG-CFG-001 | permissive alternate API/fallback configuration | P1/P2 open | `OPEN_CONFIRMED` | executable alias, permissive default, undocumented mode | `HUMAN_DECISION_REQUIRED` | degraded legacy result accepted by metadata-ignorant client | alternate Scientific Interpretation API | inventory consumers, then decide explicit support/fail-closed/retirement and document config | MEDIUM | NO | NO | YES |
| PERS-001 | shallow session validation and mismatched recovery reset | P1 open | `OPEN_CONFIRMED` | v3 key omitted by error-boundary reset | `SHOULD_FIX_SOON` | repeatable browser recovery loop | Protocol Designer persistence | deep validation plus exact-key error recovery | SMALL | NO, with fresh-session preflight | NO | NO |
| TEST-001 | four provider-evidence-gated skips without producer | P2 open | `OPEN_CONFIRMED` | conditional suite, no tracked evidence/producer | `HUMAN_DECISION_REQUIRED` | missing evidence for active compatibility corridor | Scientific Interpretation tests | decide support; if retained, define frozen evidence producer/preflight and named command | MEDIUM | NO | NO | YES |
| TD-002 | global lint is red and environment-dependent | P2 open | `OPEN_CONFIRMED` | 23 errors/35 warnings split tracked vs ignored environment | `FIX_BEFORE_RELEASE_GATE_COMPOSITION` | unusable/noisy lint gate | tooling/experiments | define tracked first-party scope, exclude local env explicitly, fix tracked errors | SMALL | NO | YES | NO |
| TD-003 | OpenAI strict-schema hardening | P2 open | `OPEN_CONFIRMED` | request `strict:false`; deterministic write guard present | `SHOULD_FIX_SOON` | provider-contract retries/blocks | DESIGN_STUDY persistent extraction | harden schema while preserving optional semantics and validators | MEDIUM | NO | NO | NO |
| REP-002 | dual locks/local scripts/tracked cache | P2 open | `OPEN_CONFIRMED` | two locks, local `.venv`, sibling docs path, 20 tracked cache files | `SHOULD_FIX_SOON` | developer/clean-clone drift | repository hygiene | bounded package-manager/bootstrap/cache policy | SMALL | NO | NO | NO |
| PERF-001 | oversized frontend chunks | P2 open | `OPEN_CONFIRMED` | 1,041.45 kB demo, 758.92 kB main | `NON_BLOCKING_KNOWN_DEBT` | load performance | frontend delivery | profile first, then split demonstrated heavy boundaries | MEDIUM | NO | NO | NO |
| DOC-001 | roadmap typecheck statement stale | P2 open | `OPEN_CONFIRMED` | roadmap contradicts blocking API gate | `SHOULD_FIX_SOON` | program-state misunderstanding | implementation roadmap | update one technical row with `f504d8fc` evidence | MICRO | NO | NO | NO |
| WARN-001 | persistent build-warning group | P3 open | `OPEN_CONFIRMED` | Browserslist/Rollup/CSS/chunk warnings | `NON_BLOCKING_KNOWN_DEBT` | warning desensitization | build/tooling | bounded dependency/CSS cleanup; no global suppression | SMALL | NO | NO | NO |
| STRICT-NODE-001 | strict Node nullability mismatch | separate open | `OPEN_CONFIRMED` | three errors, two Project boundary files | `SHOULD_FIX_SOON` | weak Project-boundary type confidence | Node/Vite transitive graph | normalize optional/null contracts with targeted tests | SMALL | NO | NO | NO |
| HYG-001 | protected artifact cardinality mismatch | newly explicit | `OPEN_CONFIRMED` | protected hash unchanged; 54 exact present vs historical label 53 | `HUMAN_DECISION_REQUIRED` | inaccurate hygiene accounting | local protected artifact registry | separate read-only inventory/arbitration of the count; no deletion | MICRO | NO | NO | YES |

Open causal debt count: 14. `HIST-001` is not counted as active technical debt because its eight skips are explicitly historical/intentional and their exact surfaces are unreachable or removed.

Explicit deferral boundary for every open causal debt:

| DEBT_ID | WHY_IT_MATTERS | WHAT_IT_CAN_CORRUPT | WHAT_IT_CANNOT_CORRUPT | CAN_BE_DEFERRED_WITHOUT_REDUCING_NEXT_REPLAY_CONFIDENCE |
| --- | --- | --- | --- | --- |
| FG-001 | the configured deploy gate omits canonical tests and lint | the trustworthiness of a future Ready/deploy signal | the already measured canonical result or A/B/C content in the current unchanged Production runtime | YES, for manual replay only; NO before release-gate hardening |
| FG-002 | active JavaScript modules remain outside the app TypeScript graph | static confidence at the seven Knowledge boundaries and other active `.mjs` paths | the exact canonical/build results already measured, or Project truth by itself | YES |
| REP-001 | installation and installed bytes depend on a mutable sibling checkout | standalone build/test reproducibility and dependency-byte attribution | canonical test semantics after RC-TEST-01, or the already deployed Production bytes | YES, for replay on existing Production; NO before release-gate hardening |
| LEG-CFG-001 | alternate clients can receive an explicitly degraded legacy fallback under a permissive default | interpretation results for direct/legacy endpoint consumers and configuration attribution | nominal current A/B/C UI output, which does not call these endpoints | YES, subject to no alternate-endpoint use |
| PERS-001 | shallow validation and the wrong recovery reset key can repeat a bad browser state | session recovery and attribution of repeated UI failures | immutable persisted ledgers that fail rehydration, or a replay started through the correct fresh-session reset | YES, only with the fresh-session precondition |
| TEST-001 | four active compatibility assertions have no reproducible evidence producer | claims of coverage for the provider-based Scientific Interpretation corridor | nominal deterministic A/B/C UNDERSTAND behavior and the eight historical skip classifications | YES |
| TD-002 | the global lint command is red and depends partly on an ignored local environment | release-gate reproducibility and the signal-to-noise ratio of lint findings | current build/typecheck result or nominal A/B/C scientific content | YES, for replay only; NO before release-gate hardening |
| TD-003 | permissive provider schema mode weakens transport-contract enforcement | reliability/retry behavior of DESIGN_STUDY candidate extraction | deterministic downstream write guards, or UNDERSTAND A/B/C which does not invoke this provider | YES |
| REP-002 | dual locks, local paths and tracked cache create machine-dependent setup assumptions | clean-clone developer reproducibility and review clarity | the current exact-head canonical result or current Production A/B/C content | YES |
| PERF-001 | oversized chunks may raise load time and memory cost | performance and possibly manual-test ergonomics on constrained clients | scientific ownership, Project truth or result semantics | YES |
| DOC-001 | the roadmap misstates the current serverless typecheck gate | human understanding of program/gate state | the executable gate, build result or runtime behavior | YES |
| WARN-001 | persistent warnings can hide a future novel warning | build-log signal quality and performance diagnosis | the current successful build or scientific content by themselves | YES |
| STRICT-NODE-001 | a stricter transitive graph rejects three Project-boundary nullability shapes | static confidence in the affected contribution/review paths | nominal A/B/C UNDERSTAND, which does not execute those paths | YES |
| HYG-001 | the protected artifact count is internally inconsistent with historical prose | audit accounting and future hygiene decisions | repository runtime, tests, build, scientific content or the physical preservation already proved | YES |

## Blocking before next Production replay

```text
PRODUCTION_REPLAY_BLOCKERS = 0
```

No current open debt demonstrates corruption of the nominal Production A/B/C `UNDERSTAND` corridor when the replay starts from a fresh functional-reset session:

- current Production already contains the product runtime at `f504d8fc`;
- the nine local commits change no product/scientific runtime or corpus;
- A/B/C route through current deterministic Knowledge and do not use the alternate Scientific Interpretation endpoints, OpenAI persistent extraction or the strict-node Project contribution branch;
- the canonical suite is green at the current local evidence head;
- the normal product reset clears the correct v3 session key.

This does not authorize a deployment. No deployment is needed merely to apply the local test/documentation delta to the already-deployed product runtime.

## Fix before release-gate composition

Three causal items block safe hardening of the release gate:

1. `FG-001`: tests and lint are absent from build/Vercel composition;
2. `TD-002`: canonical lint is red and its result depends on ignored local environment files;
3. `REP-001`: a clean clone cannot resolve the Editorial Engine dependency autonomously.

Canonical tests themselves no longer block gate composition. The correct bounded order is lint-scope repair, Editorial package reproducibility, then one explicit quality-gate composition change.

## Should fix soon

- `FG-002`: incrementally type active `.mjs` Knowledge boundaries;
- `PERS-001`: deep-validate the current session and clear the v3 key in error recovery;
- `TD-003`: harden the OpenAI extraction schema without weakening deterministic guards;
- `REP-002`: choose reproducible package/bootstrap/cache conventions;
- `DOC-001`: correct the stale roadmap row;
- `STRICT-NODE-001`: repair the three nullability mismatches with targeted contract tests.

Each can be deferred for the next bounded A/B/C replay under the stated corridor/session preconditions. None may be described as closed.

## Non-blocking known debt

- `PERF-001`: large chunks;
- `WARN-001`: dependency metadata, Rollup annotation and generated CSS warning noise.

These can affect performance or signal quality. They do not currently alter scientific content, ownership, Project truth or the technical observability of the next manual A/B/C response.

## Historical or intentional items

- eight exact legacy skips remain explicit and are not current coverage;
- the Tranche A process-exit anomaly remains historical and was not reproduced by Tranche B;
- RC-TEST-01 through RC-TEST-09 and RC-TEST-02P are closed at the test-harness/root-cause level;
- governed fixture references remain test-harness products, not Imaging runtime outputs;
- the synthetic-haematocrit contradiction remains a separate live fail-closed negative control;
- canonical technical green remains distinct from scientific PASS.

## Recommended bounded sequence

This is a recommendation packet, not automatic authorization:

1. perform the human Production A/B/C replay on a fresh functional-reset session;
2. make a human decision on alternate API/fallback support;
3. make a human decision on the four provider-evidence-gated tests and their producer;
4. reconcile the protected artifact count in a separate read-only hygiene mission;
5. repair tracked-first-party lint scope/errors;
6. make Editorial Engine consumption reproducible from a standalone clone;
7. compose one blocking release gate using agreed typecheck, canonical tests, reproducible lint and build;
8. repair strict Node nullability, persistence, `.mjs` typing, schema hardening and repository hygiene in separate bounded missions;
9. profile performance before chunk changes.

No item in this sequence authorizes Wave 2 or a scientific campaign.

## Explicitly deferred work

No work was started on:

- lint repair;
- strict nullability repair;
- `.mjs` typing/migration;
- Editorial Engine packaging;
- release-gate modification;
- persistence changes;
- alternate API retirement;
- environment-default changes;
- OpenAI schema changes;
- skip removal/evidence generation;
- product UX or scientific runtime;
- A/B/C replay;
- deployment, push or Wave 2.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
EXTERNAL_SCIENTIFIC_SEARCH = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
PRODUCT_REPLAY = 0
BROWSER = 0
CANONICAL_FULL_TEST_RUNS = 0
CANONICAL_LINT_RUNS = 1
CANONICAL_BUILD_RUNS = 1
STRICT_NODE_DIAGNOSTIC_RUNS = 1
```

## Git

The only worktree change created by this mission is this untracked report.

```text
PRODUCT_RUNTIME_CHANGED_BY_MISSION = NO
TESTS_CHANGED_BY_MISSION = NO
CONFIG_CHANGED_BY_MISSION = NO
AUTHORITIES_CHANGED_BY_MISSION = NO
HISTORICAL_ARTIFACTS_CHANGED_BY_MISSION = NO
.git/info/exclude CHANGED_BY_MISSION = NO
GIT_ADD = NO
COMMIT = NO
PUSH = NO
MERGE = NO
DEPLOYMENT = NO
WAVE_2_AUTHORIZED = NO

EXPECTED_FINAL_STATUS =
?? docs/implementation/post-canonical-green-technical-hygiene-checkpoint.md
```

Consistency gates:

```text
PRIOR_P1_FINDINGS_ACCOUNTED = ALL
PRIOR_P2_FINDINGS_ACCOUNTED = ALL
SKIPPED_TESTS_ACCOUNTED = ALL
OPEN_DEBTS_CLASSIFIED = ALL
UNEXPLAINED_CURRENT_DEBTS = 0
PRODUCT_RUNTIME_CHANGED_BY_MISSION = NO
TESTS_CHANGED_BY_MISSION = NO
CONFIG_CHANGED_BY_MISSION = NO
```

```text
POST_CANONICAL_GREEN_TECHNICAL_HYGIENE_CLASSIFIED
```
