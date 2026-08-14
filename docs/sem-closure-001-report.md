# SEM-CLOSURE-001 — Controlled Hybrid Cutover

## Decision

`SEM_CLOSURE_BLOCKED_BY_HYBRID_RUNTIME`

Date: 2026-08-14

Repository state at mission start: `main` at `1144f24d`

Report nature: implementation and validation evidence; non-normative.

The SEM workstream is **not closed**. SEM Full is not declared archived and the
hybrid runtime is not admitted as the nominal product runtime. The local
cutover implementation remains uncommitted because the mandatory live wiring
gate failed before any hybrid Contribution could be produced.

## Closure boundary

Closure required all seven active legacy dependencies to be migrated or bounded
as rollback-only and the hybrid path to pass the live I01–I08 gate. The local
worktree contains runtime-neutral implementations for API, provider/server,
workspace, Knowledge handoff, session/history/resume, browser transport and the
legacy facade. These changes passed deterministic validation but cannot be
classified as the active cutover while the live primary runtime rejects every
request.

| Runtime field | Observed disposition |
|---|---|
| Nominal before | `LEGACY_ACTIVE` |
| Proposed nominal after | `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` — not admitted |
| Explicit rollback | `LEGACY_ACTIVE` — preserved |
| Diagnostic mode | `HYBRID_SHADOW` — preserved |
| SEM Full status | active historical runtime; archive deferred |
| Audit-D | deterministic, non-mutating, locally validated |
| Audit-L | `SHADOW_ONLY_NOT_PRODUCT_ACTIVE` |
| Adjudicator | absent; zero call |

## Live gate

Authorized inputs were limited to the eight visible synthetic conversations
I01–I08 at complete T2 state. No Blind content, hidden card, repository corpus,
patient data, personal data, document or secret was transmitted as scenario
content.

| Measure | Result |
|---|---:|
| Complete scenario states | 8/8 |
| Hybrid Contributions produced | 0/8 |
| Active legacy fallbacks | 8/8 |
| `ACCEPTED_FOR_V1_PROJECTION` | 0 |
| `NEEDS_CLARIFICATION` | 2 |
| `NEEDS_REVIEW` | 6 |
| `FAIL_CLOSED` | 0 |
| States with critical findings on fallback Contribution | 6 |
| Reconstructible persisted raw responses | 8/8 |
| Direct Project writes | 0 |

Every primary operation received `HTTP 400 INVALID_ARGUMENT` with the provider
message `Request contains an invalid argument.` before a structured scientific
output was returned. The first divergent stage is therefore provider request /
structured-contract compatibility, not scientific interpretation. The provider
did not expose the rejected field, so a more specific root cause is not proven.

I07 additionally received one transient `HTTP 429 RESOURCE_EXHAUSTED`; the
provider reported a free-tier request limit of 5 for the configured
`gemini-3.5-flash` model. The bounded retry waited 60 seconds and then received
the same non-retryable HTTP 400 as the other operations.

### Provider accounting

| Measure | Result |
|---|---:|
| Provider requests | 9 |
| Primary operations | 8 |
| Transient retries | 1 |
| Hard stop | 12 |
| Requests remaining inside mission budget | 3 |
| Calls per state | 1.125 |
| Total measured latency | 65,094 ms |
| Semantic retries | 0 |
| Audit-L calls | 0 |
| Adjudicator calls | 0 |

Only three authorized requests remain. Revalidating eight corrected primary
operations would exceed the frozen budget, so no request repair or partial
replay was attempted after observing the failure.

Evidence:

- `experiments/engine-lab/results/sem-closure-001-live/run-manifest.json`
- `experiments/engine-lab/results/sem-closure-001-live/live-results.json`
- `experiments/engine-lab/results/sem-closure-001-live/provider-ledger.jsonl`
- `experiments/engine-lab/results/sem-closure-001-live/raw/`

## Deterministic validation

| Validation | Result |
|---|---|
| Hybrid visible replay | 24/24 reconstructible |
| SEM legacy | 305/305 PASS |
| Scientific Interpretation closure suite | 53/53 PASS, including SC-C01–SC-C25 |
| Guided Intake, Scientific Thinking and Protocol Designer | 233/233 PASS |
| Engine Lab validation / Audit-D / hybrid prototype | 48/48 PASS |
| Knowledge | 87/87 PASS |
| Imaging | 60/60 PASS |
| Research Project | 56/56 PASS |
| System integration | 34/34 PASS |
| Typecheck | PASS |
| Build | PASS, warnings only |
| Changed-file lint | PASS |
| Repository-wide lint | pre-existing experimental/vendor failures; no changed-file failure |
| Global suite | 1,440/1,443 PASS |

The three global failures are the existing external checkout guard for the
dirty sibling repository `editorial-engine`. That checkout was neither modified
nor cleaned by this mission. They are not a SEM/Hybrid Runtime regression, but
the global suite is not reported as fully green.

## Preserved boundaries

- `Project` direct writes: 0.
- QRY implemented: NO.
- CDM implemented: NO.
- PD-003 V2 conformance claimed: NO.
- Blind accessed: NO.
- normative documents modified: NO.
- Editorial Engine modified: NO.
- historical SEM prompts, fixtures, tests, reports and campaigns modified: NO.
- foreign untracked artifact
  `experiments/semantic-engine-comparison/results/interactive-overnight/zero-provider-final-analysis.md`:
  preserved and excluded.

## Stop disposition

No SEM archive manifest, rollback closure contract or final dependency burn-down
was issued because doing so would falsely assert a completed cutover. No
functional cutover commit was created. The runner, immutable live evidence and
this blocking report are preserved in a separate local evidence commit; no push
or deployment occurred.

The next permissible action is a separately authorized, pre-observation repair
of the generic Gemini request/structured-output contract, followed by a fresh
complete I01–I08 wiring validation under a new explicit provider budget. A
partial replay with the three remaining calls cannot establish closure.
