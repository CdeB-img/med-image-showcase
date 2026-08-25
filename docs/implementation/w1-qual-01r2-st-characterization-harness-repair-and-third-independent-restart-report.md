# W1-QUAL-01R2 — ST Characterization Harness Repair & Third Independent Restart

**Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`

**Normative status:** non-normative; this report records implementation and characterization-process evidence only.

**Date:** 26 August 2026

**Branch:** `protocol-designer-canonical-ingestion`

## 1. Decision

`W1_QUAL_01R2_BLOCKED_BY_CHARACTERIZATION_HARNESS`

Phase A repaired the bounded pre-owner null-state defect exposed by W1-QUAL-01R1. Harness `2.1.0` passed 18/18 synthetic tests and was frozen at digest `ke1-6fd7eafe0ff78052`. It correctly represents an expected stale, Project-identity or dependency rejection without fabricating a request, ST invocation or `OwnerResult`, and without inferring evidence promotion or owner repair.

Phase B authored and froze 13 new Campaign C cases under `W1-QUAL-01R2-ST-2026-08-26-C`. They were executed exactly once after freeze. The expected stale case correctly failed closed before ST and reproduced identically. Twelve cases invoked ST and produced an `OwnerResult`.

The frozen evaluator then produced two critical `PROJECT_QUESTION_DRIFT` verdicts that do not survive terminal-aware review. It requires the first output candidate question to exactly reproduce the Project question for every produced `OwnerResult`, including:

- a legitimate `CLARIFICATION_REQUIRED` / `NON_TESTABLE` result whose output is a clarification question; and
- a legitimate `REFUSED` / `OUT_OF_DOMAIN` result whose strict contract requires zero candidates.

In both cases, the exact Project question remains bound in the typed request and canonical source snapshot. Requiring an output candidate in the refusal case directly conflicts with the pre-authored `STRICT_NO_CANDIDATE_EXPECTED` obligation. The first divergence is therefore `CHARACTERIZATION_HARNESS`, not Scientific Thinking.

Campaign C is invalid exposed evidence. Its raw artifacts are retained unchanged for diagnosis, but no Scientific Thinking characterization status is produced:

```text
CAMPAIGN_STATUS = BLOCKED_BY_CHARACTERIZATION_HARNESS
HARNESS_STATUS = NOT_READY
REFERENCE_STATUS = VALID
OWNER_CHARACTERIZATION_STATUS = NOT_ADJUDICATED
```

## 2. Baseline

| Control | Observed |
|---|---|
| Branch | `protocol-designer-canonical-ingestion` |
| Initial HEAD | `d85f790a0a70de9eadffc8f20ce4196e3c9a61ec` |
| Initial remote | `origin/protocol-designer-canonical-ingestion = d85f790a0a70de9eadffc8f20ce4196e3c9a61ec` |
| Main | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Origin main | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Tracked baseline | Clean |
| Historical untracked artifacts | Preserved and excluded from staging |
| Roadmap preflight | W1 active; R2 authorized; architectural convergence `YES`; observability `YES`; individual characterization `NO`; controlled-loop characterization `NO`; Wave 1 incomplete; Wave 2 unauthorized |

No baseline drift or normative contradiction was found.

## 3. Authorities

The mandatory authorities were consulted in order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. NOXIA Founding Charter, official V1.0;
3. NOXIA Protocol Designer — Scientific Product Manifesto V2.0;
4. Editorial Engine — Architecture Manifesto;
5. `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`.

Specialized authorities consulted as necessary: PD-003 V2 Research Object Model, Ownership Matrix and Relationship Catalog; PD-005; PD-009; PD-011; RDE-001; RDE-002; KE-001. W1-QUAL-01, W1-QUAL-01R, W1-QUAL-01R1 and W1-TRACE-01 reports were used only as Level 3 evidence.

The controlling interpretation is unchanged: candidate does not equal adopted; Project remains the only owner of adopted Project truth; Knowledge and ST retain distinct ownership; a pre-owner technical rejection is not an owner failure; clarification and refusal are legitimate ST terminal outcomes; a technical test is not scientific qualification.

## 4. Campaign A and Campaign B

```text
CAMPAIGN_A = INVALID
CAMPAIGN_B = INVALID_BEFORE_ST_INVOCATION
```

Campaign A remains exposed harness-development evidence. Campaign B remains exposed after the R1 null-state diagnosis despite its zero ST invocations. Neither campaign, any repair probe, nor any harness meta-fixture was reused as Campaign C independent evidence. Their artifacts were not modified.

## 5. Harness R2 repair

The repaired terminal model distinguishes:

```text
OWNER_RESULT_PRODUCED
EXPECTED_PRE_OWNER_REJECTION
UNEXPECTED_PRE_OWNER_FAILURE
OWNER_EXECUTION_FAILURE
NON_ADJUDICABLE_TECHNICAL_FAILURE
```

It also separates `CampaignStatus`, `HarnessStatus`, `ReferenceStatus` and `OwnerCharacterizationStatus`.

For `PRE_OWNER_REJECTION_EXPECTED`, the frozen contract requires zero owner invocation, zero `OwnerResult`, null request/result refs, no owner failure class, no owner repair, no evidence promotion, and no fabricated owner TRACE event. The Knowledge gate labels an intentional stale input `INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST`; this is admissible only for the declared fail-closed purpose.

```text
HARNESS_VERSION = 2.1.0
HARNESS_DIGEST = ke1-6fd7eafe0ff78052
EVALUATOR_DIGEST = ke1-b7b98a43e1f4e167
TAXONOMY_DIGEST = ke1-f82ac5f785a4eb93
EXECUTION_OUTCOME_CONTRACT_DIGEST = ke1-9227d52b6ddf6337
TRACE_CONTRACT_DIGEST = ke1-7c43ecb5bdc2fb01
HARNESS_STATUS_AT_FREEZE = READY
FINAL_HARNESS_STATUS = NOT_READY
```

The final status does not rewrite the historical freeze; it records a separate defect discovered only after Campaign C observation. No harness file was modified after freeze.

## 6. Harness tests and machine validator

Harness R2 passed 18/18 tests before freeze. Coverage includes valid execution, stale rejection, Project ID mismatch, Project digest mismatch, dependency mismatch, absence of `OwnerResult` as a correct terminal, no false evidence promotion, no false owner repair, no fake ST TRACE execution, unexpected request-building failure, real owner-runtime failure, clean owner result, TRACE branching, side-effect safety and independent status planes.

The machine validator rejects all three prohibited states:

| Invalid state | Result |
|---|---|
| Expected pre-owner rejection plus `ownerResultRequired = true` | Rejected |
| Absent `OwnerResult` plus automatic evidence promotion | Rejected |
| Zero ST invocations plus first divergent stage `ST_ENGINE` | Rejected |

```text
EXPECTED_PRE_OWNER_REJECTION_WITHOUT_OWNER_RESULT = SUPPORTED
STALE_PRE_OWNER_TEST = PASS
PROJECT_ID_MISMATCH_PRE_OWNER_TEST = PASS
PROJECT_DIGEST_MISMATCH_PRE_OWNER_TEST = PASS
DEPENDENCY_MISMATCH_PRE_OWNER_TEST = PASS
```

## 7. Campaign C freeze and independence

```text
CAMPAIGN_C_ID = W1-QUAL-01R2-ST-2026-08-26-C
CAMPAIGN_FREEZE_DIGEST = ke1-8f713545558c1c29
CASES = 13
DOMAINS = 13
A_CASES_REUSED = NO
B_CASES_REUSED = NO
REPAIR_PROBES_REUSED = NO
HARNESS_META_FIXTURES_REUSED = NO
```

Parentage was frozen before execution:

| Parentage | Count |
|---|---:|
| `NOVEL` | 8 |
| `RELATED_BUT_DISTINCT` | 5 |
| `TOO_CLOSE` | 0 |
| Exact or near duplicate | 0 |

The Knowledge input gate admitted 12 current inputs as `USABLE` and one historical input as `INTENTIONALLY_INVALID_FOR_FAIL_CLOSED_TEST`. All 13 were valid for their pre-authored purpose. Inputs, envelopes, parentage, gates and three replay roles were frozen before the unique qualifying pass.

## 8. Unique execution and terminal outcomes

Campaign C was executed once with no reroll, runtime repair, post-freeze harness repair or provider call.

| Terminal outcome | Count |
|---|---:|
| `OWNER_RESULT_TERMINATIONS` | 12 |
| `EXPECTED_PRE_OWNER_REJECTIONS` | 1 |
| `EXPECTED_PRE_OWNER_REJECTIONS_CORRECT` | 1 |
| `UNEXPECTED_PRE_OWNER_FAILURES` | 0 |
| `OWNER_EXECUTION_FAILURES` | 0 |
| `NON_ADJUDICABLE_TECHNICAL_FAILURES` | 0 |

The stale case produced `STALE_KNOWLEDGE_RESULT` at `STALE_VALIDATION`, zero ST invocation, zero `OwnerResult`, zero side effect and a complete five-event rejection trace. Its preselected replay reproduced the same terminal behavior.

## 9. Raw technical observations

The following counts are retained from the frozen raw results. Because Campaign C is invalid, they are diagnostic observations and not an admissible ST characterization numerator.

| Measure | Raw observation |
|---|---:|
| Candidate-required opportunities covered | 8/8 |
| Negative/conditional cases correct | 5/5 |
| TRACE-complete cases | 13/13 |
| Owner invocations expected / observed | 12/12 |
| Pre-owner rejections expected / observed | 1/1 |
| Stable preselected replays | 3/3 |
| Unsupported hypotheses | 0 |
| Evidence promotions | 0 |
| Knowledge-gap losses | 0 |
| Contradiction losses | 0 |
| Raw Project-question-drift flags | 2 |
| Lineage breaks | 0 |
| Ownership leaks | 0 |
| Project writes | 0 |
| Stale-protection failures | 0 |

`PROJECT_QUESTION_DRIFT = 2` above is the raw frozen evaluator output. The governed post-campaign adjudication attributes both flags to the harness and does not silently alter the raw artifacts.

## 10. First divergent stage

| Case | Expected terminal | Raw evaluator verdict | Causal finding |
|---|---|---|---|
| `ST01R2-C-INSUFFICIENT-RELATION-01` | `CLARIFICATION_REQUIRED` / `NON_TESTABLE`; clarification question allowed; no hypothesis/objective | Project question drift at `ST_PROJECT_QUESTION_RECONSTRUCTION` | False positive: exact Project question is preserved in request/source binding; output is explicitly a non-testable clarification, not an adopted replacement question |
| `ST01R2-C-OUT-OF-OWNER-ACCOUNTING-01` | `REFUSED` / `OUT_OF_DOMAIN`; strict zero candidate | Project question drift at `ST_PROJECT_QUESTION_RECONSTRUCTION` | False positive: exact Project question is preserved in request/source binding; requiring an output question contradicts the strict refusal contract |

```text
FIRST_DIVERGENT_STAGE = CHARACTERIZATION_HARNESS
ST_DEFECT_ESTABLISHED = NO
ST_OWNER_REPAIR_AUTHORIZED = NO
```

The R2 evaluator has no terminal-aware distinction between question fidelity for candidate-producing results, request/source fidelity for clarification results, and zero-candidate fidelity for refusals. This is a measurement-device defect.

## 11. Campaign C disposition

Per the frozen protocol, a newly discovered post-freeze harness defect invalidates the campaign immediately:

```text
CAMPAIGN_C = INVALID_EXPOSED_EVIDENCE
CAMPAIGN_C_RERUN = NO
POST_FREEZE_HARNESS_REPAIR = NO
POST_FREEZE_ST_REPAIR = NO
SCIENTIFIC_THINKING_CHARACTERIZATION = NOT_ADJUDICATED
```

The raw execution files are preserved. A separate `post-campaign-harness-failure-adjudication.json` records their governed status without rewriting history.

## 12. ST runtime immutability

```text
ST_VERSION = 1.2.1
ST_RUNTIME_MODIFIED = NO
```

| Runtime file | Git blob | SHA-256 |
|---|---|---|
| `src/features/scientific-thinking/engine.ts` | `61ebf3c40e48d113834a831c5535e736bbccdf75` | `e87aa94e3e7f0542991f2d3bc748a9ba41f33fb0ff32511ea25f820feb9564dc` |
| `src/features/scientific-thinking/types.ts` | `79289e630f2f1cc2c1b7a32300139186d7b6989b` | `79f7ac776d92d4be9586385a94113d9d02a6dd500d1f8194eb523f6eaf9a00f6` |
| `src/features/protocol-designer/product-scientific-thinking-owner-runtime.ts` | `4a17f6163dcac6854647245745ea4ac88ed39cd1` | `bef0aa5ede4daafa9eae9b5cab158e7c36bfa899bfd4d460a4ac7773f5fa0fe7` |

These values match the pre-mission baseline. Knowledge, Imaging, REG, VAL, Project, TRACE core, QRY, DOC/TMP and Editorial Engine were also not modified.

## 13. Providers and authority boundaries

```text
GEMINI_CALLS = 0
TERRA_OPENAI_CALLS = 0
OTHER_LLM_CALLS = 0
PUBMED_CALLS = 0
EXTERNAL_NETWORK_CALLS = 0
PROJECT_WRITES = 0
PRIVATE_CHAIN_OF_THOUGHT_RECORDED = NO
```

No scientific PASS, PD-011 qualification, corpus completeness, Project adoption or Human Decision is claimed.

## 14. Verification

Targeted post-campaign non-regression passed 16 files / 207 tests. This covers Harness R2, ST, W1-ST repair probes, Knowledge → ST, TRACE, stale/owner handoffs and W1-QUAL readbacks.

Historical suites reproduced the recorded debt exactly:

| Suite | Passed | Failed | Total | Classification |
|---|---:|---:|---:|---|
| IMG | 56 | 4 | 60 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| PRJ | 72 | 1 | 73 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| SYS | 31 | 3 | 34 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| Total | 159 | 8 | 167 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |

The failures are unchanged: four IMG-001B freeze expectations, one downstream PRJ `IMG_001B_LIVE_HANDOFF_NOT_FROZEN`, and three SYS historical expectations. No global green suite is claimed.

Additional gates passed: app, API and server typechecks; targeted lint; direct TypeScript ESM module load; Node ESM handler load; production build with pre-existing warnings; 23 R2 machine JSON parses; secret scan; and `git diff --check`.

## 15. Wave and program decision

```text
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
```

Individual ST characterization remains the first unresolved Wave 1 dependency. W1-LOOP-QUAL-01 is not authorized.

```text
CURRENT_WAVE = WAVE_1_SCIENTIFIC_LOOP
NEXT_AUTHORIZED_MISSION = W1-QUAL-01R3_ST_CHARACTERIZATION_HARNESS_REPAIR
```

R3 must make Project-question fidelity terminal-aware, add synthetic controls for candidate, clarification and refusal outcomes, refreeze before observation, and use another independent campaign identity. Campaigns A, B and C may be used only as exposed harness-development evidence.

## 16. Roadmap synchronization

```text
ROADMAP_UPDATED = YES
CURRENT_WAVE = WAVE_1_SCIENTIFIC_LOOP
ENGINE_STATE_CHANGES = NONE
CONNECTION_STATE_CHANGES = NONE
DEBTS_OPENED = TERMINAL_AWARE_PROJECT_QUESTION_FIDELITY_HARNESS_DEFECT
DEBTS_CLOSED = R1_STALE_NULL_STATE_HARNESS_DEFECT
NEXT_AUTHORIZED_MISSION = W1-QUAL-01R3_ST_CHARACTERIZATION_HARNESS_REPAIR
```

No merge, push or deployment is part of this report. The mission stops after atomic local commits pending explicit SHA confirmation for any push.
