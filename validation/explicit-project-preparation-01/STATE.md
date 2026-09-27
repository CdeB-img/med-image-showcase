# NOXIA_PREVIEW_EXPLICIT_PROJECT_PREPARATION_REWRITE_01
Baseline: d7a903cb8da5f9fea124103ee278f302867d7a0a
Protected Production: 333b8afa5c9c2c1254ffe6fbecc07f9d3656b72f
Branch: codex/explicit-project-preparation
Worktree: noxia-stabilisation-lot2/noxia-dev (reused clean isolated checkout)
Scope: explicit preparation, immutable checkpoint, recoverable review, canonical adoption.
Frozen: scientific producer/validators, Project owner, DOC, provider settings, financial semantics, snapshots, Production.
Provider calls: 0.

## Resume
Milestones 1–3 implemented. Consolidated qualification complete; final Preview delivery remains. No provider call. No push/deployment yet.

## Replaced expectations
- Successful Chat no longer starts Working Draft.
- Natural assent no longer starts preparation or adopts a review.
- Latest USER turn no longer invalidates a bound preparation.
- Recovery retains the same preparation; a result is not permission to adopt.
- Post-cutoff conversation requires actual scope review, not a global acknowledgement.

## Existing mechanisms
continuous-project-build.test.tsx: real bridge/owners with synthetic provider boundary.
durable-working-draft-recovery.test.ts: existing read route, memory guard.
server/protocol-designer-provider-replay.ts: strict recorded exchange replay.
validation/durable-qualification-store-preflight.mjs: fail-closed qualification isolation.

## Gates not yet exercised
Preview deployment verification remains. Exact historical full DOC pack replay depends on the original source handoff/projection, currently absent; do not substitute synthetic authority.

## Retained debts
Scientific dependency cycles remain owner failures.
DOC pack Vn received after adoption Vn+1: publication debt, not changed here.
Cross-network recovery bound to existing client identity; no new auth scope.

## Milestone 2
Session-owned immutable request checkpoint and pure transitions implemented. Technical recovery lookup accepts a bound checkpoint identity suffix; existing server Chat proof/session/client checks remain. Ten pure transition tests and five memory/route recovery tests pass. App typecheck passes. Hook is prepared but not connected to Workspace until milestone 3. No claim of SQL or browser qualification yet.

## Milestone 3
Workspace now emits explicit preparation commands and renders the persisted lifecycle. Removed serial background queue, auto-WD after Chat, latest-user universal expiry, concurrent review invitation effects and natural assent adoption. The existing post-adoption legacy continuation is not active on the target path.
The session checkpoint freezes the actual request, full base Project and previous draft with independent digests. No provider configuration/prompt/validator/Project adoption/DOC implementation changes.
Later conversation retains the result. Base mismatch and existing structured refusal/nonseparable correction block adoption. Otherwise later turns require unchecked native review groups and an explicit scope selection; no generic acknowledgement bypass. A new later turn resets that selection. Receipts bind the actual displayed exchange and never individual future choices.

## Intentional test contract replacements
continuous-project-build UI auto-WD/natural-adoption/last-turn supersession expectations replaced by explicit-project-preparation tests. Scientific owner and explicit DOC tests retained.
pending-natural-confirmation UI auto-consumption assertions removed; all 31 lexical classification cases remain. New tests require receipt persistence without adoption.
conversation-confirmation-receipt: a new assent to a later displayed exchange may create its own receipt even while an older batch runs; the earlier receipt remains immutable. This replaces the prior requirement that every receipt depend on an active batch.
Legacy interrupted records remain readable UNKNOWN with no invented checkpoint and no automatic recovery/dispatch.

## Evidence so far
Shared qualification SQL: exact isolation preflight, completed result read, close/reopen pool, session/client/source rejection, repeated read with identical rows. No TRUNCATE; no Production connection.
Real headless Chrome + separate replay HTTP server + SQL: 4 scenarios (valid, cycle, NO_CHANGE, incomplete), hard reload while pending, result before consumption, repeated reload, one logical review, explicit canonical adoption. Provider boundary only is recorded/replayed synthetic; global external fetch/network denied.
Full server crash/resumption and live performance are NOT qualified.

## Final qualification
278/278 assertions in 19 suites PASS. Exact historical DOC fixtures were missing from the isolated checkout; the runner now mounts existing originals temporarily and removes only its links. No synthetic substitute, no edited DOC test expectation. Typecheck / affected lint / bench lint / build / diff check PASS.
5 real Chromium scenarios with separate HTTP replay server and qualification Postgres PASS: VALID, CYCLE, NO_CHANGE, TRUNCATED, TIMEOUT. 5 Chat + 5 WD + 10 count boundary executions are synthetic recorded/replayed calls, not real provider requests. 22 recovery reads; 0 DOC calls; one logical review only in VALID. Real reload/reentry, SQL pool restart, adoption persisted. Outcome UNKNOWN stays unknown; known incomplete is FAILED even if its financial reserve stays UNKNOWN_AFTER_DISPATCH.
Recovery read additionally preserves precise safe owner codes and distinguishes known provider incomplete from unknown outcome. This changes read projection only, not durable execution/settlement/reservations.
Shared-store read test: repeated reads and rejected bindings leave session/admission/operation rows byte-identical. No TRUNCATE, no Production connection. Synthetic rows retained for evidence.
Frozen-boundaries.json verifies unchanged producers/config/caps/prompts/WD owner/Project and DOC algorithms/financial policies/snapshot implementation.

## Paid DOC evidence limit (not a product regression)
Exact Project ke1-5ccb6c7c1d463ef0 was verified with the existing server parser after a targeted READ ONLY query to soft-hill-09530523. Snapshot stayed in process memory; no temporary scientific copy written. DB writes = 0.
The two already-paid responses are locally available, but their original document handoff/projection and admitted bibliography are absent from the retained fixture. A contract-only replay reached DRCI_CITATION_REFERENCE_INVALID because citation aliases cannot be honestly resolved without those original sources. No source was invented and no DOC code was changed. Therefore full historical pack ke1-620d7d2f747b640b / its 19 questions are NOT REQUALIFIED by this run. Synthetic four-document materialization and existing available historical renderer fixtures pass. This is an evidence limitation, not a claim that the paid pack is invalid.

## Review
No new active orchestration, queue or store. Session-owned checkpoint + pure transitions; hook coordinates effects; Workspace commands and projections only for this path. Receipt source corrected to its actual latest displayed exchange; no future atom-level authority. Legacy session records are read but do not trigger background work.
One technical input snapshot per explicit preparation includes the canonical base/previous draft because deterministic review recovery needs their exact values. This is redundant storage, not a scientific authority; network requests retain the existing verified snapshot resolver. Growth/storage limits remain a future operational consideration.
No universal crash recovery is claimed: only already-durable bridge results can be read; an interrupted execution without result remains UNKNOWN. Client-address binding is unchanged, so a different network can prevent recovery (no new authentication).
Known dependency cycles remain FAILED. Historical DOC Vn publication after Project Vn+1 remains unchanged debt.

## Reproduce (from this checkout)
sh validation/explicit-project-preparation-01/targeted-tests.sh
node_modules/.bin/vite-node --config validation/explicit-project-preparation-01/vite-replay.config.ts validation/explicit-project-preparation-01/sql-recovery.ts
sh validation/explicit-project-preparation-01/browser-qualification.sh
npm run typecheck
node_modules/.bin/vite build
SQL/browser scripts use the existing qualification integration credential in memory with a mandatory identity preflight. They require Vercel read access, Chromium and Playwright; no env export. Provider external fetch is denied in the replay server. Normal scientific inputs/outputs remain synthetic.

## Human follow-up only
Describe a study, receive Chat, click Prepare; send a later clarification while preparation runs; reload; inspect the recovered review and captured scope; confirm only compatible reviewed groups (or prepare again if correction is incompatible). Project changes only at explicit review adoption. Documents remain a separate action.
