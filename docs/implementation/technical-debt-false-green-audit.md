# NOXIA — Technical Debt & False-Green Audit

> **Evidence class:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`
>
> **Normative authority:** `NONE`
>
> **Audit timestamp:** `2026-08-28T00:20:47Z`
>
> **Mission mode:** bounded technical audit; no repair, commit, push, deployment, provider call or scientific replay

## Decision

```text
DECISION = NOXIA_CRITICAL_FALSE_GREEN_MECHANISM_IDENTIFIED
```

The repository has two demonstrated false-green mechanisms:

1. `npm run build`, and therefore the configured Vercel build, runs the canonical TypeScript gate and Vite build but runs neither the test suite nor lint. During this audit, the build passed while the canonical test suite failed on 25 tests and the canonical lint command failed with 23 errors.
2. The TypeScript gate covers the configured TypeScript graphs but is deliberately non-strict and excludes active `.mjs` implementation modules. The app TypeScript program included zero `.mjs` files while active Knowledge adapters import seven `.mjs` modules directly. A diagnostic `noImplicitAny` probe exposed 479 diagnostics, including 13 `TS7016` undeclared-module diagnostics.

These mechanisms are critical because a repository or deployment can appear healthy while important automated evidence is red or absent. No `P0` is assigned: this audit did not demonstrate that the currently deployed critical runtime is itself invalid. It demonstrated that the current green build is insufficient evidence of repository-wide health.

`TECHNICAL_PASS ≠ TEST_PASS ≠ LINT_PASS ≠ SCIENTIFIC_PASS`

## Git baseline

| Item | Observed state |
| --- | --- |
| Branch | `protocol-designer-canonical-ingestion` |
| Local HEAD | `b07c3e3edcd62f5e7924261e5172fffd87677bb4` |
| `origin/main` | `f504d8fc658ebdf17757e589f610e8f56c24e335` |
| Tracked modifications before audit | `0` |
| Visible `git status --short --untracked-files=all` before audit | empty |
| Local-only commit content | exactly the four previously archived Product Checkpoint 01A/01C/01E/01F reports |
| Push of `b07c3e3` | `NO` |
| Historical protected artifacts | 53 files remain physically preserved and locally hidden by exact rules; not re-audited |
| `.git/info/exclude` | not modified |

The four local reports are documentation-only. The audit neither amended nor normalized their historical findings.

## Audit scope

Authorities were consulted in the required order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. NOXIA — Charte fondatrice;
3. NOXIA Protocol Designer — Scientific Product Manifesto V2;
4. Editorial Engine — Architecture Manifesto.

Focused inspection then covered package/build scripts, TypeScript and ESLint configuration, Vercel configuration, tests, active product entry, owner ledgers, stale guards, persistence, alternate API routes, environment switches, local dependencies, generated caches and recent Level 3 reports. No scientific authority was modified and no implementation report was promoted into a norm.

Executed diagnostics:

- read-only Git inspection;
- focused repository searches;
- canonical test suite, twice only to obtain a machine-readable failure inventory;
- canonical lint and scoped lint attribution;
- canonical production build, including its blocking TypeScript gate;
- a read-only `noImplicitAny` diagnostic probe;
- focused inspection of local dependency and sibling-repository state.

## Known clean invariants

The current infrastructure repair remains real within its stated scope:

- `npm run build`: `PASS`, exit `0`;
- `npm run typecheck`: `PASS`, exit `0` as part of the build;
- app TypeScript graph: `PASS` under `tsconfig.app.json`;
- all tracked `api/**/*.ts`: `PASS` under NodeNext;
- scientific-interpretation server graph: `PASS`;
- Node ESM handler load: `PASS`;
- runtime modules inspected by the ESM checker: `18`;
- runtime aliases: `0`;
- extensionless relative imports: `0`;
- canonical script suppression patterns such as `|| true`, forced success exit, `continue-on-error` and `allow_failure`: not found;
- `vercel.json` uses `npm run build`;
- build short-circuits if the canonical typecheck fails;
- no active `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck` was found in product/runtime code.

Focused test evidence still passes for the repaired current product corridor:

| Test surface | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Product development marker | 5 | 0 | 0 |
| Product Checkpoint 01B routing | 8 | 0 | 0 |
| Product Checkpoint 01D Knowledge path | 13 | 0 | 0 |
| Product Checkpoint 01G governed synthesis | 6 | 0 | 0 |
| W1 REG owner invocation | 35 | 0 | 0 |
| W1 Knowledge → ST handoff | 28 | 0 | 0 |
| W1 TRACE corridors | 13 | 0 | 0 |
| W1 VAL observation | 35 | 0 | 0 |

These focused passes do not neutralize the global failures below.

## False-green mechanisms

### Build/deployment gate composition

`package.json` defines:

```text
build = npm run typecheck && vite build
test = vitest run
lint = eslint .
```

There is no tracked CI workflow adding tests or lint to that build path. Consequently:

```text
BUILD = PASS
TYPECHECK = PASS
TESTS = FAIL
LINT = FAIL
```

can coexist, and did coexist during this audit. A Vercel `Ready` state proves the configured build, not test or lint health.

### Typecheck coverage and strength

`tsconfig.app.json` includes `src`, but uses `strict: false`, `noImplicitAny: false`, `skipLibCheck: true`, and disables several unused/fallthrough checks. `tsconfig.scientific-interpretation-api.json` also uses `strict: false` and `skipLibCheck: true`.

There are 131 non-test, non-manual `.mjs` files under `src`. The app TypeScript program includes `638` files from `src` and `0` `.mjs` files. Seven direct active Knowledge imports cross from TypeScript into untyped `.mjs` modules:

- `knowledge-graph/catalog.mjs`;
- `scientific-consolidation/review.mjs`;
- `scientific-consolidation/sources.mjs`;
- `scientific-consolidation/contradictions.mjs`;
- `scientific-multidomain/assertions.mjs`;
- `scientific-multidomain/sources.mjs`;
- `scientific-multidomain/contradictions.mjs`.

A diagnostic-only run with `noImplicitAny=true` failed with 479 diagnostics. Thirteen were `TS7016`; the active Knowledge imports were among them. This probe does not redefine the canonical gate and is not reported as 479 current canonical TypeScript errors. It proves that `TYPECHECK = PASS` currently means conformity to a deliberately weak, partial static contract.

## Type-safety escapes

| Mechanism | Observed classification | Rationale |
| --- | --- | --- |
| `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` in active runtime | `JUSTIFIED_BOUNDARY / NONE_FOUND` | No active occurrence found. |
| Eight active `as unknown as` bridges | `JUSTIFIED_BOUNDARY` with future review | They sit at dynamic-key, JSON-schema, validated-transport or explicit legacy-compatibility boundaries; no independent false success was demonstrated. |
| `strict: false` and `noImplicitAny: false` | `FALSE_GREEN_RISK` | They allow untyped inputs and undeclared JavaScript modules while the canonical command reports zero errors. |
| `skipLibCheck: true` | `INTENTIONAL_LIMITATION` in isolation | No project-source error hidden specifically by library declaration skipping was demonstrated. |
| Active `.mjs` corpus/Knowledge implementation outside TypeScript | `FALSE_GREEN_RISK` | Product adapters consume it; Vite can bundle it without TypeScript shape verification. |
| Broad `any` in manual scientific campaign files | `HISTORICAL/EXPERIMENTAL_DEBT` | Not on the nominal product route; the canonical lint nevertheless scans some tracked experiment files and fails. |

## Skipped/disabled tests

Canonical Vitest state:

```text
Test files: 20 failed, 166 passed, 2 skipped (188)
Tests:      25 failed, 3247 passed, 12 skipped (3284)
```

No `.only`, `describe.only`, `it.only` or `test.only` was found.

Skipped inventory:

| Group | Count | Classification | Evidence |
| --- | ---: | --- | --- |
| Old Guided Intake Knowledge UI suite | 7 | `HISTORICAL_ONLY` | Entire suite explicitly named `LEGACY`; current `/protocol-designer/demo` uses the functional-reset workspace. |
| Removed V1.1 orientation stepper | 1 | `HISTORICAL_ONLY` | Test name explicitly states that the old stepper was removed from the nominal path. |
| Functional Reset direct Scientific Interpretation evidence | 4 | `ENVIRONMENT_SPECIFIC / ACTIVE_COVERAGE_DEBT` | The suite becomes `describe.skip` when `FUNCTIONAL_RESET_GATE_EVIDENCE` is absent; no canonical command supplies it. |

The eight explicitly historical skips are supported. The four evidence-conditioned checks are not a routine clean-clone gate and can be mistaken for executed coverage if only the total suite command is cited.

## Legacy and fallback paths

### Nominal current product route

`src/App.tsx` routes `/protocol-designer/demo` only to `ProtocolDesignerWorkspace`. The first user message goes through `routeProductEntry`; `UNDERSTAND` calls the deterministic local Knowledge path and performs zero external calls, zero Project writes and zero protocol projections. The old Guided Intake and `ScientificInterpretationWorkspace` are not routed by `App.tsx`.

Classification: `ACTIVE_INTENTIONAL` for the functional-reset product route; `UNREACHABLE_HISTORICAL` for the old UI workspaces.

### Alternate Scientific Interpretation APIs

Two serverless handlers remain executable:

- `/api/scientific-interpretation`;
- deprecated `/api/scientific-semantic`, which adapts old payloads and forwards to the first handler.

The default mode is `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK`. A missing or invalid `SCIENTIFIC_INTERPRETATION_MODE` selects that default. Eligible hybrid failures invoke `LEGACY_SEM_FULL`; the legacy rollback catches provider/critic failures and can return a degraded deterministic semantic model. The HTTP response remains `200`, but it explicitly exposes `technicalStatus = FALLBACK_ACTIVE`, `fallbackUsed = true`, diagnostics and zero Project writes.

Classification: `FALLBACK_RISK / ACTIVE_COMPATIBILITY`. This is not the nominal `/protocol-designer/demo` corridor and is not completely silent, but an old or direct client that ignores response metadata can continue on legacy/degraded content.

### Other compatibility projections

Canonical Project → legacy consumer adapters, DOC/TMP compatibility paths and historical identity mappings remain explicit, typed and diagnostic. No evidence showed them silently taking ownership of Project truth. They remain compatibility debt, not an independently demonstrated false-green mechanism.

## Silent error recovery

Observed fail-closed behavior:

- invalid bridge JSON becomes a typed client/server error;
- conversation-provider failure returns HTTP `503`;
- persistent extraction failure returns a visible `TECHNICAL_FAILURE`, no candidate and no Project write;
- `UNDERSTAND` Knowledge failure returns a bounded unavailable message, no Project and no protocol;
- owner-result and ValidationRun rehydration validate ledger digests, dependencies and write boundaries;
- stale owner readback throws rather than silently upgrading a result.

Observed bounded concerns:

- the alternate Scientific Interpretation API can return HTTP `200` with an explicitly marked legacy/degraded fallback;
- invalid functional-reset storage silently starts a fresh session rather than explaining that local state was rejected;
- the Protocol Designer error boundary's “Réinitialiser” action clears older conversational/interpretation keys but not the current `noxia-protocol-designer-functional-reset-v3` key.

No active nominal `UNDERSTAND` path was found that converts a provider failure into unsupported scientific content.

## Feature flags and environment drift

Only names and non-sensitive effects are reported:

| Variable/switch | Default or absence behavior | Audit finding |
| --- | --- | --- |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Product conversation bridge fails unavailable when the key is absent; the alternate legacy API can degrade through fallback | Key/model names are documented in `.env.local.example`; no secret inspected or reported. |
| `OPENAI_API_KEY`, `OPENAI_EXTRACTION_MODEL` | Project-persistent extraction becomes `TECHNICAL_FAILURE`; conversation remains available | Names are documented; extraction remains non-authoritative and fail-closed. |
| `SCIENTIFIC_INTERPRETATION_MODE` | Missing or typo silently selects `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` | Not documented in `.env.local.example`; can activate legacy fallback semantics. |
| `SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR` | Defaults to `/tmp/noxia-scientific-interpretation` | Not documented in `.env.local.example`; evidence location differs by environment. |
| `FUNCTIONAL_RESET_GATE_EVIDENCE` | Four evidence tests are skipped | Test-only variable; no canonical runner supplies it. |
| `VERCEL_GIT_COMMIT_SHA` | Invalid/missing value becomes an empty injected SHA and the UI displays `DEV · LOCAL` | Visible fallback, not silent; current static marker tests pass. |
| `import.meta.env.DEV` | Enables only local bridge-trace logging | No product-corridor switch demonstrated. |

Production environment values were not displayed and were not modified.

## Clean-clone reproducibility

### Editorial Engine local dependency

`package.json` and `package-lock.json` resolve `@editorial-engine/core` through `file:../../editorial-engine/packages/core`. The installed package is a symlink to that sibling directory. At audit time the sibling Editorial Engine worktree had 42 status entries, and three NOXIA tests failed because they assert that sibling worktree is unchanged/clean.

Consequences:

- a standalone NOXIA clone does not contain the referenced package source;
- local validation can execute code from a dirty sibling worktree rather than a repository-pinned artifact;
- three tests have outcomes determined by out-of-repository state;
- a locally cached or linked install is not proof of a reproducible clean install.

This is the highest clean-clone risk found. No dependency was changed in this mission.

### Competing package-manager state

Both `package-lock.json` and `bun.lockb` are tracked. The latter predates the current local Editorial Engine dependency. No explicit package-manager declaration resolves which lock is authoritative across environments.

### Local-only scripts

Four `sem003c1` commands call `experiments/.venv/bin/python`; the virtual environment is ignored and is not bootstrapped by a canonical repository command. Documentary-pattern commands default to the sibling path `../docs-audit`. These are not the Vercel build path, but their names look runnable from a clean clone while requiring local state.

### Tracked generated cache

Twenty files under `.vite/deps` are tracked. They are generated development-cache artifacts, ignored by ESLint but not by Git. The production build does not require them; retaining them creates stale-cache and review-noise risk.

No inspected active runtime dependency on a protected historical artifact was identified. The protected 53-file set itself was not re-audited, in accordance with the mission boundary.

## Dependency/build warnings

| Warning | Classification | Current evidence and impact |
| --- | --- | --- |
| `@swc/core` install script warning | `REPRODUCIBILITY_RISK` | Package declares a `postinstall`; the known install warning was not reproduced by the already-installed local build. A clean-install gate is needed before deciding whether skipping it is harmless. |
| `esbuild` install script warning | `REPRODUCIBILITY_RISK` | Package declares a `postinstall`; same clean-install uncertainty. Local build succeeded. |
| Browserslist/caniuse-lite 14 months old | `BENIGN_INFORMATIONAL` | Build remains correct; target data is stale and should be refreshed in a bounded dependency-maintenance mission. |
| Two Rollup `/*#__PURE__*/` annotation notices | `BENIGN_INFORMATIONAL` | Originates in `react-helmet-async`; Rollup removes the uninterpretable comments. |
| CSS syntax warning `Expected identifier but found "-"` | `ACTIVE_TECHNICAL_DEBT`, low impact | Tailwind scans a regex token `[-:.TZ]` in functional-reset manual scripts and generates an invalid CSS fragment. The fragment is warned/dropped; no product CSS defect was demonstrated. |
| Chunk-size notices | `PERFORMANCE_DEBT` | `ProtocolDesignerDemo` is 1,041.45 kB minified and the main index chunk is 758.92 kB; route lazy-loading exists, but both exceed the 500 kB notice threshold. |

## TODO/FIXME/HACK findings

No active runtime `TODO`, `FIXME`, `HACK`, `TEMPORARY` or `WORKAROUND` marker with hidden gate impact was found.

One explicit active debt constant exists:

```text
OPENAI_STRICT_SCHEMA_HARDENING_DEBT = OPEN
```

The OpenAI persistent extraction request uses JSON Schema with `strict: false`. The returned value is subsequently parsed, provider-contract checked, source-anchor materialized and deterministically validated; invalid content is blocked and cannot become a Project write. This is active contract-hardening debt, not a demonstrated silent Project mutation.

Other `LEGACY` occurrences are predominantly explicit migration identities, compatibility adapters or frozen scientific-campaign history. They were not bulk-promoted into active debt.

## Persistence and stale-state risks

Positive controls:

- Knowledge snapshots carry schema, registry, provider, corpus, question and context freshness states;
- current owner and ValidationRun ledgers verify digests and dependencies when rehydrated;
- unsupported stale readback fails closed;
- old intake and scientific-interpretation sessions remove invalid data or require explicit compatibility conversion;
- the functional-reset session repairs only one exact historical initial-message string and preserves Project ownership.

Risk found:

- `looksLikeSession` validates the current functional-reset session only shallowly for several nested structures;
- invalid JSON or a failed migration silently starts a fresh session;
- a nested shape that passes the shallow shell check can fail later during rendering/rehydration;
- the error boundary reset clears old keys but omits the current functional-reset key, so the visible recovery action may reload the same incompatible state.

Classification: `STALE_STATE_RISK`, not a demonstrated stale OwnerResult reuse. The normal in-workspace “Recommencer” action does clear the correct current key.

## Reports-vs-code drift

| Sampled claim | Current static finding |
| --- | --- |
| Owners are `PRODUCT_CALLABLE` | Owner entrypoints exist; the roadmap correctly limits them to explicit calls and does not claim complete UI orchestration. |
| Project writes = 0 | Product routing, owner-result ledgers, validation ledgers and sampled owner runtimes retain explicit zero-write guards. |
| Stale protection | Owner ledger dependency/digest checks and readback guards remain present and fail closed. |
| No scientific LLM fallback under current `UNDERSTAND` | Confirmed for `/protocol-designer/demo`: the route calls deterministic local Knowledge with `externalSearchPolicy = EXTERNAL_FORBIDDEN` and zero external calls. This does not apply to the separate Scientific Interpretation API. |
| TypeScript build gate is blocking | Confirmed by package scripts, the gate checker and a passing local production build. |
| Production development marker | Injection and rendering code plus five focused tests remain present. Live Production was not re-inspected in this read-only repository audit. |

One current documentary drift was found: the roadmap still lists `VERCEL_SERVERLESS_TYPECHECK_GATE = OPEN_NON_BLOCKING_DEBT`, while commit `f504d8fc` and the current scripts now include all `api/**/*.ts` in the blocking canonical typecheck. This is `REPORT_STALE_BUT_CODE_FIXED`; it weakens program clarity but does not weaken the implemented gate.

## Known gaps explicitly excluded from debt

The following remain explicit product/program gaps and were not reclassified as hidden technical debt:

- OBS runtime absent;
- autonomous Study Design owner not arbitrated;
- Biostatistics calculation absent;
- DM realized-time absent;
- `PRODUCT_TRACE_INTEGRATION = ABSENT`;
- incomplete QRY scientific quality;
- final UX still open;
- bounded/incomplete Knowledge corpus.

No sampled code or current roadmap claim was found presenting these gaps as completed capabilities.

## Findings register

| ID | CLASS | PRIORITY | PATH_OR_SURFACE | OBSERVED_FACT | WHY_IT_MATTERS | CURRENTLY_ACTIVE | PROOF | LIKELY_OWNER | MINIMAL_FUTURE_ACTION |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FG-001 | `CRITICAL_FALSE_GREEN` | `P1` | `package.json`, `vercel.json` | Build runs typecheck + Vite but not tests or lint; build passed while both were red. | A deployment can be `Ready` without repository test/lint health. | `YES` | build exit 0; tests 25 failures; lint 23 errors | Infra / release engineering | Define one blocking quality gate after the red suites are root-caused. |
| FG-002 | `CRITICAL_FALSE_GREEN` | `P1` | `tsconfig.app.json`, active `.mjs` Knowledge graph | Non-strict TS program includes zero `.mjs`; seven direct active Knowledge imports are implicit-any boundaries. | “0 TypeScript errors” does not cover an important runtime graph. | `YES` | 638 `src` files in TS program, 0 `.mjs`; diagnostic 479 errors/13 TS7016 | Type system / Knowledge platform | Type or check active JS boundaries incrementally; do not weaken the gate. |
| TD-001 | `ACTIVE_TECHNICAL_DEBT` | `P1` | Canonical Vitest suite | 25 failures in 20 files across external-state guards, frozen fixtures, version/hash baselines and owner behavior. | Current global regression evidence is red and cannot support a global green claim. | `YES` | 3247 pass, 25 fail, 12 skip | Respective test/owner maintainers | Triage by root cause and first divergent stage; never bulk-update expectations. |
| REP-001 | `REPRODUCIBILITY_RISK` | `P1` | `@editorial-engine/core` | Production dependency resolves to `../../editorial-engine`; local symlink targets a sibling worktree with 42 status entries. | Clean clones and local runs can use different code or lack it entirely. | `YES` | package/lock link, installed symlink, three environment-coupled test failures | Editorial integration / packaging | Publish, vendor or pin a reproducible immutable package boundary. |
| LEG-001 | `LEGACY_REACHABILITY_RISK` | `P1` | `/api/scientific-interpretation`, `/api/scientific-semantic` | Executable endpoints default to hybrid-with-legacy-fallback and can return degraded legacy content as HTTP 200 with fallback metadata. | Direct/old clients may continue on a legacy scientific path if they ignore metadata. | `YES_ENDPOINT / NO_NOMINAL_UI` | route files, default mode, rollback catch and degraded model | Scientific Interpretation integration | Inventory consumers, then make fallback policy explicit/fail-closed or retire the alias. |
| PERS-001 | `PERSISTENCE_RISK` | `P1` | Protocol Designer current session/error boundary | Current session validation is shallow; error-boundary reset does not clear the current functional-reset key. | Corrupt compatible-looking local state can produce a repeatable recovery loop. | `YES` | current key `...functional-reset-v3`; error boundary calls older reset helper | Product shell / persistence | Deep-validate session and clear the exact current key from recovery. |
| CFG-001 | `CONFIGURATION_DRIFT_RISK` | `P2` | Scientific Interpretation environment | Missing/invalid mode silently selects legacy fallback; mode/evidence variables are absent from the example environment file. | Local and deployed alternate endpoints can differ without an explicit configuration failure. | `YES` | configured-mode default and `.env.local.example` inventory | Infra / Scientific Interpretation | Document variables and reject invalid mode values. |
| TEST-001 | `TEST_COVERAGE_DEBT` | `P2` | `functional-reset-gate.test.ts` | Four evidence tests silently skip without an external path; no canonical script activates them. | A normal test run cannot demonstrate those evidence checks ran. | `YES` | `describeEvidence = evidence ? describe : describe.skip` | Scientific Interpretation tests | Add an explicit evidence-test command/preflight or state it as non-canonical evidence. |
| TD-002 | `ACTIVE_TECHNICAL_DEBT` | `P2` | `eslint .` | Canonical lint fails: 23 errors/35 warnings; 12 errors are tracked experiment code, 11 errors come from ignored local `.venv` assets. Active `src/api/scripts` has 0 errors and 7 warnings. | Lint is both red and environment-dependent, so it is unusable as a reliable gate today. | `YES` | canonical and scoped ESLint runs | Tooling / experiments | Define tracked-source scope; then repair tracked errors without hiding product files. |
| TD-003 | `ACTIVE_TECHNICAL_DEBT` | `P2` | OpenAI persistent extraction | Strict schema hardening is explicitly open and request schema uses `strict: false`. | Provider output can require more blocking/retry handling than a strict contract. | `YES_WHEN_DESIGN_STUDY` | exported debt constant and request payload | Project extraction owner | Harden schema in its own bounded mission; retain deterministic validation. |
| REP-002 | `REPRODUCIBILITY_RISK` | `P2` | package managers, local scripts, `.vite` | Two lockfiles, local `.venv` commands, sibling `docs-audit` default and 20 tracked Vite cache files coexist. | Clean-clone behavior and developer results depend on undeclared local choices/state. | `YES` | tracked lock/cache files and package scripts | Infra / repository hygiene | Choose one package manager; add explicit bootstraps; untrack generated cache in a separate authorized repair. |
| PERF-001 | `PERFORMANCE_DEBT` | `P2` | Vite chunks | Demo chunk 1,041.45 kB and main index chunk 758.92 kB minified. | Initial/route loads can carry avoidable latency and memory cost. | `YES` | current build output | Frontend performance | Profile first, then split only demonstrated heavy boundaries. |
| DOC-001 | `ACTIVE_TECHNICAL_DEBT` | `P2` | Integration roadmap | Roadmap still calls the serverless typecheck gate open/non-blocking although code has fixed it. | Program state can be misread despite a stronger implementation. | `YES` | roadmap row vs `f504d8fc` scripts/report | Program documentation | Correct only the stale technical row with exact evidence. |
| HIST-001 | `SAFE_HISTORICAL` | `P3` | Eight skipped old UI tests and unrouted workspaces | Explicit legacy Guided Intake/stepper tests are skipped; old workspaces are not in `App.tsx`. | Historical code exists but was not shown to capture the nominal product route. | `NO_NOMINAL_ROUTE` | route inventory and skip labels | Product history | Preserve until a deliberate decommission inventory. |
| WARN-001 | `BENIGN_WARNING` | `P3` | Build dependency/CSS notices | Browserslist age, two dependency annotation notices and Tailwind's manual-regex CSS token remain visible. | Noise can obscure new warnings, but no current product failure was proved. | `YES` | current build output and regex source | Frontend tooling | Address in bounded dependency/CSS hygiene; do not suppress globally. |

## Root-cause groups

### RC-1 — Incomplete release gate

```text
Build gate excludes tests/lint
→ build PASS with tests/lint FAIL
→ Vercel can appear healthy
```

Manifestations: `FG-001`, `TD-001`, `TD-002`.

First divergent stage: `QUALITY_GATE_COMPOSITION`.

Likely owner: Infra / release engineering.

### RC-2 — Partial static contract

```text
strict disabled + JavaScript implementation outside TS
→ implicit-any boundaries
→ canonical typecheck PASS cannot prove active Knowledge graph shapes
```

Manifestations: `FG-002`, part of `TD-003`.

First divergent stage: `TYPECHECK_PROGRAM_DEFINITION`.

Likely owner: Type system + Knowledge platform.

### RC-3 — Local state as dependency

```text
relative file package + sibling worktree + dual lockfiles/local tools
→ local success/failure depends on machine state
→ clean clone is not demonstrated
```

Manifestations: `REP-001`, `REP-002`, three canonical test failures, install-script uncertainty.

First divergent stage: `DEPENDENCY_INSTALLATION`.

Likely owner: Infra / Editorial integration.

### RC-4 — Compatibility corridors remain executable

```text
alternate API + permissive default mode
→ hybrid technical failure
→ explicit but HTTP-200 legacy/degraded fallback
```

Manifestations: `LEG-001`, `CFG-001`.

First divergent stage: `SCIENTIFIC_INTERPRETATION_MODE_RESOLUTION`.

Likely owner: Scientific Interpretation integration.

### RC-5 — Browser persistence validation/recovery mismatch

```text
shallow current-session acceptance
→ later render failure possible
→ error recovery clears old keys, not current key
```

Manifestation: `PERS-001`.

First divergent stage: `FUNCTIONAL_RESET_SESSION_REHYDRATION`.

Likely owner: Product shell / persistence.

## Priority P0/P1/P2/P3

| Priority | Count | Meaning in this audit |
| --- | ---: | --- |
| `P0` | 0 | No currently deployed critical component was proved invalid. |
| `P1` | 6 | False-green gates, red canonical evidence, non-reproducible core dependency, reachable legacy API and recovery-loop risk. |
| `P2` | 7 | Environment/test activation, lint scope, schema hardening, repository reproducibility, performance and roadmap drift. |
| `P3` | 2 | Supported historical skips and visible low-impact warnings. |

## Recommended repair order

1. Triage the 25 failing tests by owner and first divergent stage. Separate stale frozen expectations, external-state assertions, known `IMG_001B_LIVE_HANDOFF_NOT_FROZEN` debt and potentially current behavioral regressions. Do not bulk-refresh snapshots or hashes.
2. Make the canonical test suite deterministically green or explicitly split historical/evidence suites with visible named commands and preconditions.
3. Make lint reproducible over tracked first-party scope, then resolve its tracked errors.
4. Introduce one blocking release gate that runs the agreed typecheck, tests, lint and build; point Vercel to it only after steps 1–3 prevent permanent unrelated blockage.
5. Close active JavaScript typing boundaries incrementally, starting with the seven Knowledge imports; preserve build/runtime behavior while adding declarations, `checkJs`, typed adapters or migration to TypeScript.
6. Replace the sibling Editorial Engine file link with a reproducible immutable dependency and choose one package manager/lockfile.
7. Inventory consumers of both Scientific Interpretation endpoints; then decide explicitly whether legacy fallback remains supported, is fail-closed, or is retired.
8. Deepen functional-reset session validation and align error-boundary reset with the current storage key.
9. Address strict OpenAI schema, chunking, build-warning noise, tracked `.vite` cache and the stale roadmap row in separate bounded changes.

## What must NOT be repaired

- Do not change scientific answers, corpus content, ST/Imaging/REG/VAL behavior or owner boundaries to make technical tests green.
- Do not convert OBS, Study Design, Biostatistics, DM, Product TRACE, QRY quality, final UX or corpus coverage gaps into hidden technical fixes.
- Do not mass-enable historical skips without reconstructing their removed UI surface.
- Do not merely update expected versions, prompt digests, hashes or frozen fixtures until the owner of each divergence is established.
- Do not delete compatibility adapters or legacy endpoints before a consumer/reachability inventory.
- Do not suppress warnings globally, add `|| true`, weaken validation, broaden `any`, disable tests or narrow the TypeScript graph.
- Do not add, delete, move, clean or rewrite the 53 protected historical artifacts.
- Do not modify the Editorial Engine sibling worktree from this repository mission.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
BROAD_PRODUCT_REPLAY = 0
NETWORK_CALLS_FOR_AUDIT = 0
```

The canonical test suite was executed twice solely because the first verbose output exceeded transport limits; the second run produced the bounded machine-readable failure inventory. No case, fixture, owner result or scientific evidence was regenerated.

## Git

```text
CODE_CHANGE = NO
CONFIG_CHANGE = NO
REPORT_CREATED = docs/implementation/technical-debt-false-green-audit.md
GIT_ADD = NO
COMMIT = NO
PUSH = NO
DEPLOYMENT = NO
MAIN_MODIFIED = NO
HISTORICAL_ARTIFACTS_MODIFIED = NO
```

Final decision:

```text
NOXIA_CRITICAL_FALSE_GREEN_MECHANISM_IDENTIFIED
```
