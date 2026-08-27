# NOXIA — Infrastructure TypeScript/Vercel typecheck recurrence repair

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Normative authority: `NONE`

Scientific qualification: `NOT_PERFORMED`

## Decision

`NOXIA_TYPESCRIPT_REPAIR_READY_BUT_DEPLOYMENT_BLOCKED`

The local repair is complete and the blocking invariant is demonstrated. Publication and the clean Vercel acceptance check remain deliberately pending because the user superseded the earlier publication authorization and explicitly prohibited push and deployment until a final authorization is given.

`NOXIA_TYPESCRIPT_GATE_CLEAN = LOCALLY_DEMONSTRATED`

`SCIENTIFIC_SEMANTICS_CHANGED = NO`

## Git baseline

- branch: `protocol-designer-canonical-ingestion`;
- initial HEAD: `6705b5df5b4ea8c6f384d02fa0cde7438f95d563`;
- parent and `origin/main`: `153e87093f3216d71bdd3ba18499e7ec0443628e`;
- `origin/protocol-designer-canonical-ingestion`: `312b4b9c45de57ed3a6339dcc703f79955fbc36c`;
- local `main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`;
- tracked worktree before the repair: clean;
- 57 historical untracked files were present before the mission and were preserved without clean, reset, stash, move, deletion or mass-add;
- the existing local development-marker commit `6705b5d` was not modified, reverted, pushed or deployed.

The required authorities were read in order: current Source-of-Truth Index, NOXIA Charte fondatrice, Scientific Product Manifesto V2, and Editorial Engine Architecture Manifesto. No normative contradiction was found. This mission changed no authority.

## Historical previous-fix search

`PREVIOUS_TYPECHECK_FIXES_FOUND = YES`

Relevant bounded history:

- `26f646ffc3f818384e2c2d2e87dffa7f506d57ce` added Node ESM `.js` specifiers to the intake graph;
- `c4857de0d70013374bbaaed9a1eefb7822ef296e` completed the Vercel intake entrypoint repair;
- `9ca000cc851b5109538ae2f52beea71c8d50a8b7` repaired the Scientific Interpretation Node ESM graph and added a server-specific pre-build check;
- `fe18e98be73e447af5149771121165ed7ec2f763` later corrected documentary evidence to acknowledge two still-existing `TS2698` errors.

The exact historical incident described as having been resolved by a single local command was not recoverable from the admitted Git history or implementation reports and is not invented here.

The recurrent pattern was partial correction by runtime sub-graph without one repository-wide blocking gate.

## Current Vercel failure reproduction

Read-only inspection of the current Production deployment established:

- Vercel deployment ID: `dpl_fvaPmEnYrRKxe3LA7kN2wrJPRCxc`;
- source: `main@153e87093f3216d71bdd3ba18499e7ec0443628e`;
- state: `Ready`, `Current`, `Production`;
- created: 2026-08-27 20:08:43 Europe/Paris;
- build-log UI: 157 error lines in 13 error groups;
- observed families: `TS2835`, `TS2307`, then project-source `unknown`/property/type cascades;
- build log nevertheless ended with `Build Completed`, `Deployment completed`, and cache upload.

The relevant serverless diagnostic was reproduced locally with TypeScript 5.8.3 under `module = NodeNext` and `moduleResolution = NodeNext` across all tracked `api/**/*.ts` entrypoints. Initial exit code: `2`.

No Vercel setting, deployment, domain or environment variable was changed.

## Build/typecheck commands and exit codes

Before repair:

| Command | Contract actually checked | Exit |
| --- | --- | ---: |
| `npm run typecheck` | `tsconfig.app.json`, browser/application graph | 2 |
| `npm run typecheck:scientific-interpretation-api` | four API roots in Bundler mode | 0 |
| `npm run typecheck:scientific-interpretation-server` | bounded strict NodeNext Scientific Interpretation graph | 0 |
| `node scripts/check-scientific-interpretation-server.mjs` | static imports plus Node ESM handler load | 0 |
| `npm run build` | server-specific checks, then Vite; omitted application typecheck | 0 |

The pre-repair contradiction was therefore direct and reproducible: canonical application typecheck exit `2`, Production-equivalent local build exit `0`.

After repair:

| Command | Contract | Exit |
| --- | --- | ---: |
| `npm ci --dry-run --ignore-scripts --offline` | lockfile reproducibility | 0 |
| `npm run typecheck` | gate drift + complete app + complete Vercel API + strict Node graph + ESM load | 0 |
| `npm run build` | same canonical typecheck, then Vite Production build | 0 |

## Error family classification

| Family | Compilation target | Cause | Disposition |
| --- | --- | --- | --- |
| `TS2698` in W1 checker test | application/tests via Bundler | fixture erased to `never`, then spread | minimal typed projection repaired |
| `TS2835` | source shared with Node/Vercel serverless | Node ESM graph still contained extensionless relative specifiers | only Node-reachable imports made ESM-explicit |
| `TS2307` | source shared with Node/Vercel serverless | bundler-only `@/` aliases crossed the Node boundary | only Node-reachable aliases replaced by explicit relative ESM paths |
| `unknown`/property cascades | SEM serverless dependency graph | upstream schema/types were unresolved | disappeared after upstream resolution; no downstream cast or semantic patch |

Browser/Vite source remains compiled with `moduleResolution = Bundler`. Vercel API and Node server source are compiled with `moduleResolution = NodeNext`. Tests remain in the complete application graph. Historical untracked artifacts were not promoted into any compilation contract or commit.

## First divergent technical cause

`FIRST_DIVERGENT_TECHNICAL_CAUSE = FRAGMENTED_TYPESCRIPT_GATE_WITH_BUNDLER_ONLY_API_CHECK`

Observed dependency chain:

```text
build script omits canonical application typecheck
+ API check uses Bundler mode on only four roots
→ Vercel later compiles the complete serverless graph under NodeNext
→ remaining extensionless imports and bundler aliases fail resolution
→ SEM canonical/schema types become unknown
→ large downstream property/type cascade
→ Vercel reports diagnostics but still publishes Ready
```

This is configuration and module-boundary drift, not a collection of independent scientific typing defects.

## Module-resolution architecture

- `tsconfig.app.json`: browser, shared application and tests; `ESNext` + `Bundler`; complete `src` include; `@/*` mapped to `./src/*` consistently with Vite.
- `tsconfig.scientific-interpretation-api.json`: complete `api/**/*.ts` serverless surface; `NodeNext` + `NodeNext`; no bundler alias; explicit `.js` source specifiers resolve to `.ts` during checking and to emitted `.js` at runtime.
- `tsconfig.scientific-interpretation-server.json`: stricter bounded Scientific Interpretation Node graph retained.
- `tsconfig.node.json`: Vite configuration tooling remains in Bundler mode.

No source directory was excluded to create a false PASS.

## Alias resolution

The browser contract retains `@/*`. The serverless Node contract no longer depends on that alias in its reachable graph. This removes the environment-specific assumption that Vite or a path-aware bundler will rewrite an import that must also be intelligible to NodeNext/Vercel diagnostics.

## Missing/case-sensitive file audit

All paths named by the Production `TS2307` diagnostics exist with the exact observed case and are tracked:

- `src/features/scientific-thinking/types.ts`;
- `src/features/imaging-study-designer/types.ts`;
- `src/features/research-project-construction/types.ts`;
- `src/features/knowledge-engine/canonical.ts`;
- `src/features/scientific-semantic-reconstruction/canonical.ts`;
- `src/features/scientific-semantic-reconstruction/types.ts`.

Classification for all six: `FILE_EXISTS_TRACKED`. There is no required untracked source, missing file, or case mismatch.

## Cascading unknown analysis

The `unknown` diagnostics in `coverage.ts`, `provider.ts`, `canonical.ts`, `relation-ownership.ts`, `atomic-composition.ts`, and `schema.ts` were downstream effects of unresolved schema/type imports. After correcting only those imports, the complete NodeNext serverless command returned exit `0`; no `unknown` site was cast, weakened, ignored or individually patched.

## Repair

1. Replaced bundler aliases and extensionless relative specifiers only in the files reachable from the Node/Vercel API graph.
2. Expanded the Vercel API TypeScript target from four roots in Bundler mode to every `api/**/*.ts` file in NodeNext mode.
3. Replaced the W1 checker fixture's `as never` erasure with a narrow structural input contract containing exactly the limitation fields consumed by the checker.
4. Added a configuration-drift guard for scripts, target modes, full graph inclusion, alias alignment and non-blocking suppression patterns.
5. Routed development start, development build and Production build through the same canonical `npm run typecheck` entrypoint.

No `any`, `@ts-ignore`, `@ts-nocheck`, broad cast, source exclusion, `skipLibCheck` expansion, strictness weakening, stderr suppression, `|| true`, or forced successful exit was introduced.

## Why the repair does not change scientific semantics

- import targets are byte-identical modules; only Node-compatible specifiers changed;
- no scientific constant, schema, assertion, prompt, corpus, owner rule, decision rule, response wording or runtime branch changed;
- the checker change narrows its accepted structural projection to the fields it already read and performs no scientific adjudication;
- Knowledge, SEM meaning, QRY, Project, Scientific Thinking, Imaging, Document, conversation UX and TRACE behavior remain unchanged;
- the development version marker is preserved unchanged in its pre-existing commit.

## Recurrence prevention

`scripts/check-typescript-gate.mjs` fails closed if:

- `dev`, `build:dev` or `build` stops invoking the canonical typecheck first;
- the canonical typecheck stops covering app, Vercel API or strict Node checks;
- the app source include or alias contract drifts;
- the Vercel API target stops covering `api/**/*.ts` under NodeNext;
- a bundler alias is introduced into the NodeNext API config;
- a known non-blocking suppression pattern appears in a canonical script.

Because `api/**/*.ts` is an include pattern, a new Vercel API file enters the gate automatically.

## Canonical blocking gate

The sole entrypoint is:

```text
npm run typecheck
├── configuration-drift guard
├── complete application typecheck
├── complete Vercel API NodeNext typecheck
└── strict Scientific Interpretation NodeNext + ESM runtime load
```

It is the first command in `dev`, `build:dev`, and `build`.

A temporary, uncommitted negative probe assigned a number to a string. `npm run build` exited `2` during `typecheck:app`; Vite did not start. The probe was then deleted. This demonstrates:

```text
TYPECHECK_FAILURE
→ NON_ZERO_EXIT
→ BUILD_BLOCKED_BEFORE_VITE
→ DEPLOYMENT_CANNOT_BE_DECLARED_SUCCESSFUL_BY_THE_REPOSITORY_BUILD
```

## Clean local validation

- lockfile dry-run: PASS, exit `0`;
- canonical typecheck: PASS, exit `0`, 0 TypeScript errors;
- `TS2307`: 0;
- `TS2835`: 0;
- project-source `unknown` cascade: 0;
- strict NodeNext typecheck: PASS;
- Node ESM handler load: PASS, 18 runtime modules, 0 aliases, 0 extensionless imports;
- Production build: PASS, exit `0`, 1,990 modules transformed;
- targeted tests: 7/7 files, 66/66 tests PASS;
- targeted ESLint: PASS, exit `0`;
- `git diff --check`: PASS;
- targeted secret scan: PASS, 0 finding.

Existing non-TypeScript build warnings remain visible: stale Browserslist data, two Rollup pure-annotation notices, one pre-existing CSS syntax warning, and large-chunk notices. None masks a TypeScript failure.

## Clean Vercel validation

`PENDING_EXPLICIT_PUSH_AND_DEPLOYMENT_AUTHORIZATION`

No repaired SHA was pushed or deployed. Therefore this report does not claim clean Vercel acceptance yet. The current deployed SHA remains `153e870`, with the historical error-bearing log described above.

## Git

The repair is prepared as one technical commit above the preserved local commit `6705b5d`. The intended future publication topology is a normal fast-forward from `origin/main@153e870` through the marker commit and this technical repair commit. No rebase, squash, force-push, merge commit or history rewrite is needed or authorized in this mission.

`PUSH = NO`

`DEPLOYMENT = NO`

## Cost

`EXTERNAL_LLM_API_CALLS = 0`

`SCIENTIFIC_PROVIDER_CALLS = 0`

`NETWORK_SCIENTIFIC_SEARCH = 0`

`NEW_BENCHMARK = 0`

`NEW_SCIENTIFIC_CAMPAIGN = 0`

Only local static inspection, deterministic checks, targeted tests, a local build, lockfile dry-run, Git history, and read-only Vercel log inspection were used.

## Remaining limitations

- clean Vercel logs and deployed runtime acceptance cannot be demonstrated until the user authorizes the two-commit fast-forward and Production deployment;
- existing non-TypeScript build warnings are independent debts and were not expanded into this bounded repair;
- this technical invariant is not a scientific PASS, PD-011 qualification, product validation or Wave 2 authorization.
