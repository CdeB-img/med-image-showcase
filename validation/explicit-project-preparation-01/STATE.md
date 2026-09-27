# NOXIA_PREVIEW_EXPLICIT_PROJECT_PREPARATION_REWRITE_01
Baseline: d7a903cb8da5f9fea124103ee278f302867d7a0a
Protected Production: 333b8afa5c9c2c1254ffe6fbecc07f9d3656b72f
Branch: codex/explicit-project-preparation
Worktree: noxia-stabilisation-lot2/noxia-dev (reused clean isolated checkout)
Scope: explicit preparation, immutable checkpoint, recoverable review, canonical adoption.
Frozen: scientific producer/validators, Project owner, DOC, provider settings, financial semantics, snapshots, Production.
Provider calls: 0.

## Resume
Milestones 1–3 implemented. Final consolidated qualification and one Preview remain. No provider call. No push/deployment yet.

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
Final consolidated checks and Preview. Exact historical full DOC pack replay depends on the original source handoff/projection, currently absent; do not substitute synthetic authority.

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
