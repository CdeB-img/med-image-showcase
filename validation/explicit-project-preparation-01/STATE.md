# NOXIA_PREVIEW_EXPLICIT_PROJECT_PREPARATION_REWRITE_01
Baseline: d7a903cb8da5f9fea124103ee278f302867d7a0a
Protected Production: 333b8afa5c9c2c1254ffe6fbecc07f9d3656b72f
Branch: codex/explicit-project-preparation
Worktree: noxia-stabilisation-lot2/noxia-dev (reused clean isolated checkout)
Scope: explicit preparation, immutable checkpoint, recoverable review, canonical adoption.
Frozen: scientific producer/validators, Project owner, DOC, provider settings, financial semantics, snapshots, Production.
Provider calls: 0.

## Resume
Milestone 1: contract tests being established. No product edits yet.

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
Real browser hard reload, shared SQL recovery, exact paid DOC replay, final consolidated checks and Preview.

## Retained debts
Scientific dependency cycles remain owner failures.
DOC pack Vn received after adoption Vn+1: publication debt, not changed here.
Cross-network recovery bound to existing client identity; no new auth scope.
