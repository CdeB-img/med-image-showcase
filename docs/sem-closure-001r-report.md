# SEM-CLOSURE-001R — Gemini Structured Request Contract Repair and Controlled Closure Resume

## Decision

`SEM_CLOSURE_001R_COMPLETE`

Date: 2026-08-14

Repository: `noxia-dev`

Branch: `main`

Starting commit: `89c242096370fbd512538f3e45664576812af1b7`

Nature: implementation, live wiring and closure evidence; non-normative.

SEM Full is removed from the nominal product path and retained as an explicit
rollback and historical non-regression implementation. The nominal mode is
`HYBRID_ACTIVE_WITH_LEGACY_FALLBACK`. This closure is not a PD-011 scientific
qualification and makes no PD-003 V2 conformance claim.

## First divergent stage and root cause

The first divergent stage was the Gemini request/structured-output transport,
before scientific interpretation. Two independently observable drifts existed:

- `MODEL_IDENTITY_DRIFT`: the successful prototype used
  `gemini-3.5-flash-lite`; the blocked closure used `gemini-3.5-flash` from the
  product environment configuration;
- structured-output transport drift: the successful PydanticAI primary used a
  required `final_result` function call, while the blocked product path sent the
  complete schema as native `responseJsonSchema` and expected JSON text.

Gemini's historical HTTP 400 response did not identify a rejected field.
Consequently, no individual JSON Schema keyword is claimed as the unique
provider cause. Restoring both proven prototype identities — frozen model and
required function-call transport — resolved the rejection without changing the
scientific prompt or internal validation contract.

| Field | Prototype value | Blocked product value | Different | Relevance | Disposition |
|---|---|---|---|---|---|
| Provider | Google Gemini | Google Gemini | No | Same provider family | Preserved |
| Model | `gemini-3.5-flash-lite` | `gemini-3.5-flash` | Yes | Frozen runtime identity | Prototype identity restored and enforced |
| Model source | prototype pipeline constant and manifest | product environment/default resolution | Yes | Source of model drift | Silent alternative rejected |
| Endpoint/adapter | Google SDK through PydanticAI | direct REST `v1beta:generateContent` | Yes | Request serialization differs | Direct adapter retained, payload aligned |
| PydanticAI | 2.29.0 | not used in direct REST product transport | Yes | Framework generated the successful output tool | Behavior reproduced generically, without product dependency |
| Structured mode | required output tool/function | native JSON response schema | Yes | First request-contract divergence | Required `final_result` function call |
| Provider schema | PydanticAI output-tool schema | complete internal schema submitted as `responseJsonSchema` | Yes | Provider transport compatibility | Dedicated deterministic transport schema |
| Internal schema | Pydantic validation | strict local Zod validation | Implementation-specific | Scientific contract authority | Product internal schema unchanged |
| Raw response shape | `functionCall.args` | JSON text expected | Yes | Parser boundary | Parser reads only named function arguments |
| MIME/output parameters | tool output, no JSON-text response contract | `responseMimeType` plus `responseJsonSchema` | Yes | Transport mode | Removed from repaired function-call payload |
| Temperature | `null` / absent | absent unless explicitly configured | No material drift | Reproducibility metadata | No value invented |
| Retry | none for prototype primary | product retry policy | Not causal to HTTP 400 | Technical resilience only | Non-retryable 400 preserved |

## Contract repair

The repair separates:

- the complete internal scientific contract, still strict, cross-field checked
  and rejecting unknown properties;
- a deterministic provider transport contract containing only supported schema
  material needed to receive the JSON object.

Every raw provider response is persisted before parsing. A transport-valid but
internal-invalid object is rejected, remains inspectable and cannot produce an
acceptable Contribution. No missing value is invented, no parser completion or
repair LLM exists, and no case-specific transformation was added.

SCR-C01 through SCR-C12 cover model identity, deterministic schema generation,
internal validation preservation, conditional rules, unknown fields, raw-first
persistence, fail-closed disposition, absence of repair LLM/case rules/model
fallback, evidence-mode fallback control and immutability of the prior blocked
campaign.

## Frozen live campaign

Campaign: `SEM-CLOSURE-001R-LIVE-01`

Expected/observed model: `gemini-3.5-flash-lite`

Mode: required `final_result` function call

Concurrency: 1

Rate limit: 5 starts per rolling 60 seconds

Budget: 8 primary operations plus 4 retry slots; hard stop 12

Fallback: `LEGACY_FALLBACK_DISABLED_FOR_EVIDENCE`

The preflight froze the model, prompt, internal schema, transport schema,
adapter, runtime configuration, raw persistence implementation, Audit-D and
the eight visible synthetic conversations before I01. I01 then succeeded with
raw persistence and internal validation; the same frozen configuration was
used for I02–I08.

| Live gate | Result |
|---|---:|
| Provider operations | 8/8 |
| HTTP successes | 8/8 |
| Raw outputs persisted | 8/8 |
| Internal validations succeeded | 8/8 |
| Contributions or explicit scientific dispositions | 8/8 |
| Provider requests consumed | 8 |
| Transient retries | 0 |
| Legacy fallbacks | 0 |
| Raw persistence failures | 0 |
| Structurally invalid outputs accepted | 0 |
| Critical findings ignored | 0 |
| Project writes | 0 |

All eight Contributions are `NEEDS_REVIEW`. Their critical Audit-D findings are
visible, blocking and did not trigger legacy fallback. This demonstrates a
working and safe technical wiring; it deliberately does not assert that the
eight scientific outputs are perfect or independently qualified.

Evidence:

- `experiments/engine-lab/results/sem-closure-001r-live/preflight-freeze-manifest.json`
- `experiments/engine-lab/results/sem-closure-001r-live/post-i01-freeze.json`
- `experiments/engine-lab/results/sem-closure-001r-live/run-manifest.json`
- `experiments/engine-lab/results/sem-closure-001r-live/live-results.json`
- `experiments/engine-lab/results/sem-closure-001r-live/provider-ledger.jsonl`
- `experiments/engine-lab/results/sem-closure-001r-live/raw/`

The historical report `docs/sem-closure-001-report.md` and its eight blocked
raw records remain unchanged as the valid snapshot of the preceding failure.

## Cutover and archive

The seven formerly blocking dependencies are closed or bounded:

| Dependency | Closure disposition |
|---|---|
| API facade | runtime-neutral Scientific Interpretation API |
| Workspace | Contribution-based workspace |
| Knowledge | independent runtime-neutral Knowledge request; no Project adoption |
| Provider/server | hybrid primary nominal; legacy adapter rollback-only |
| Session/history/resume | Contribution, raw, findings and legacy identities preserved |
| Browser client | runtime-neutral endpoint and response |
| Legacy public facade | no nominal consumer; bounded rollback/history compatibility |

`BLOCKING_FOR_CLOSURE = 0`. The retained legacy imports are enumerated rather
than hidden and are limited to rollback, frozen compatibility, historical
prompt evidence and read-only legacy-session conversion.

Final archive state:

| Field | Value |
|---|---|
| `SEM_FULL_NOMINAL_RUNTIME` | `NO` |
| `SEM_WORKSTREAM_ACTIVE_DEVELOPMENT` | `NO` |
| `SEM_LEGACY_ROLLBACK_AVAILABLE` | `YES` |
| `SEM_HISTORICAL_EVIDENCE_PRESERVED` | `YES` |
| `SEM_AUDIT_D_RETAINED` | `YES` |
| `SEM_AUDIT_L` | `SHADOW_ONLY` |
| `ADJUDICATOR` | `ABSENT` |

Archive evidence:

- `architecture/sem-archive-manifest.json`
- `architecture/sem-legacy-rollback-contract.md`
- `architecture/sem-legacy-module-archive.md`
- `architecture/hybrid-runtime-dependency-burndown.json`
- `architecture/hybrid-runtime-product-boundary-map.md`

## Validation

| Validation | Result |
|---|---|
| Provider-contract and closure tests | 70/70 PASS, including SCR-C01–C12 and SC-C01–C30 |
| SEM legacy | 305/305 PASS |
| Scientific Interpretation + Guided Intake/Protocol Designer + Scientific Thinking | 251/251 PASS |
| Engine Lab | 48/48 PASS |
| Knowledge | 87/87 PASS |
| Imaging | 60/60 PASS |
| Research Project | 56/56 PASS |
| System Integration | 34/34 PASS |
| Typecheck | PASS |
| Production build | PASS; non-blocking dependency/chunk warnings only |
| Changed-file lint | PASS |
| `git diff --check` | PASS |
| Global suite | 1,458/1,461 PASS |

The only three global failures are the pre-existing guards that require the
external sibling checkout `editorial-engine` to be clean. That checkout was
already dirty and was neither modified nor cleaned by this mission. Therefore
the global suite is not described as fully green, while every local and
in-scope validation passes.

## Preserved boundaries

- Source-of-Truth Index and normative authorities: unchanged.
- Blind SEM-003C and sealed references: not accessed.
- Scientific prompt, I01–I08 scenarios and visible expectations: unchanged.
- Project writes: 0.
- No scientific fallback and no critical finding ignored.
- No deployment and no push.
- Foreign untracked artefact
  `experiments/semantic-engine-comparison/results/interactive-overnight/zero-provider-final-analysis.md`:
  preserved and excluded from closure commits.

## Closure statement

The bounded provider request-contract failure is repaired and evidenced live.
The hybrid runtime is technically operational under the frozen prototype model
identity, the product cutover is complete, SEM Full is archived from nominal
execution, and explicit rollback remains available. No further functional SEM
change is required by this closure mission.
