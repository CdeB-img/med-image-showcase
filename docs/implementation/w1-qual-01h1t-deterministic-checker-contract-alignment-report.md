# W1-QUAL-01H1T — Deterministic Checker Contract Alignment & Human Packet Release

## 1. Decision

**Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE` — non normative, non scientific, non qualifying.

`W1_QUAL_01H1T_HUMAN_REVIEW_PACKET_RELEASED_FOR_MANUAL_ADJUDICATION`

The bounded post-hoc technical readback reconciles all 25 historical H1 failures with three demonstrated checker-to-contract mismatches. It produces no scientific verdict and does not rewrite the historical H1 decision.

## 2. Baseline

| Control | Observed |
|---|---|
| Branch | `protocol-designer-canonical-ingestion` |
| Initial HEAD | `d866e492194e38ed262722b91456bc1a80fb9cf7` |
| Initial origin branch | `d866e492194e38ed262722b91456bc1a80fb9cf7` |
| `main` / `origin/main` | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Tracked worktree | Clean before H1T |
| Historical untracked artifacts | 53 preserved |
| Baseline drift | None |

## 3. Historical H1 decision preserved

`W1_QUAL_01H1_REVIEW_PACKET_NOT_READY = PRESERVED`

Campaign `W1-QUAL-01H-ST-2026-08-26-D`, freeze `ke1-f8f6b4620ab40c36`, ST `1.2.1`, 12 primary runs, zero rerolls, zero repairs and zero human adjudications remain the historical record. The frozen checker remains version `1.0.0`, digest `sha256-ad9b7790428f40e45230ed1d1774bfa02a623f5a82e9d3f14df8249c0a269a5c`, with 228 controls: 178 PASS, 25 FAIL and 25 NOT_APPLICABLE.

## 4. Campaign D immutability

All historical H1 files and the existing human-review packet have no tracked diff from baseline. The H1T digest manifest records every historical Campaign D file, the packet, and the three frozen ST runtime files. Runtime hashes equal the campaign freeze. No case, envelope, frozen input, KnowledgeResult, ST request/output, digest, TRACE record, replay, parentage artifact, freeze or review question was changed.

| Counter | H1T value |
|---|---:|
| ST invocations | 0 |
| ST reruns | 0 |
| LLM/provider/network calls | 0 / 0 / 0 |
| Human adjudications | 0 |

## 5. Authorities and contracts inspected

The authority order was respected: Source-of-Truth Index; NOXIA Founding Charter; Scientific Product Manifesto V2; Editorial Engine Architecture Manifesto; Engine Integration Roadmap. Only the necessary specialized boundaries were then consulted: PD-003 V2 ownership/non-promotion, RDE-001/RDE-002 owner handoffs, and KE-001 Knowledge conflict ownership.

Current implementation contracts used as direct runtime evidence:

- `scientific-reasoning-owner-chain.ts:167-179` for Project question, validated reformulation and `originalExpression`;
- `scientific-execution-trace.ts:26-39,408-422,1112-1124` for the TRACE event taxonomy and persistence append;
- `knowledge-engine/types.ts:315-320` for typed conflict fields;
- `scientific-thinking/input.ts:117-131` for the Knowledge-to-ST conflict projection.

No documentary or normative contradiction was found. Code and frozen records are used only as evidence of current behavior, never as scientific authority.

## 6. Defect A — `originalExpression`

The current product builder sets `validatedReformulation` from the Project scientific question and sets `originalExpression` to `validatedReformulation + " " + purpose`. The historical checker instead required both fields to equal the question alone. H1T preserves the question check on `validatedReformulation` and compares `originalExpression` to the exact current product projection. Partial or altered expressions still fail.

**Finding:** `HISTORICAL_CHECKER_DEFECT_CONFIRMED`; product output unchanged.

## 7. Defect B — TRACE persistence event

The current TRACE schema and persistence append use `RESULT_PERSISTED`. `OWNER_RESULT_PERSISTED` is not a current event type. H1T requires the exact ordered nominal sequence containing `RESULT_PERSISTED`, or the exact fail-closed stale sequence. Removing persistence still fails.

**Finding:** `HISTORICAL_CHECKER_DEFECT_CONFIRMED`; TRACE core/schema unchanged; no duplicate event added.

## 8. Defect C — contradiction representation

Knowledge conflicts carry `conflictId`, `state` and `explanation`. The current Knowledge-to-ST adapter projects them as `conflictId:state:explanation`. The historical checker searched for explanation-only strings. H1T serializes the frozen structured Knowledge fields exactly and requires the complete projection in the frozen ST output. It does not parse on colons, discard identity/state, resolve a contradiction or judge its scientific content.

**Finding:** `HISTORICAL_CHECKER_DEFECT_CONFIRMED`; Knowledge and ST outputs unchanged.

## 9. Checker repair

A separate H1T checker was created under `validation/w1-qual-01h1t/`. The frozen H1 checker was not edited. Its scope is limited to exact technical projection and comparison; its exported boundary states `scientificJudgmentPerformed=false`, no content transformation, no contradiction resolution and no candidate promotion.

## 10. Generic technical tests

Ten synthetic tests were executed before Campaign D readback. They cover exact question-plus-purpose acceptance, partial expression rejection, canonical persistence acceptance, missing persistence rejection, exact typed contradiction acceptance, wrong conflict ID/state/explanation rejection, colon preservation and the zero-scientific-judgment boundary. Result: `10 PASS / 0 FAIL`. These fixtures are technical tests, not scientific evidence.

Seven additional read-only contract/evidence tests verify current source representations, historical checker/freeze identity, frozen ST hashes, 12 pending H1–H8 adjudications and the historical 228/178/25/25 record. Combined targeted result: `17 PASS / 0 FAIL`.

## 11. New checker identity and digest

| Field | Value |
|---|---|
| H1T checker version | `1.1.0` |
| H1T checker digest | `sha256-ea0e4a3c83d6217bd55b73aa356c0c685edd6f0e5575d15f9ed50bb0019938f2` |
| Historical checker identity | Preserved exactly |
| Historical freeze identity | Preserved exactly |

## 12. Post-hoc readback

`POST_HOC_TECHNICAL_READBACK` examined the same 12 immutable Campaign D records. No owner ran.

| Controls | PASS | FAIL | NOT_APPLICABLE |
|---:|---:|---:|---:|
| 228 | 203 | 0 | 25 |

NOT_APPLICABLE remains a legitimate outcome. No arbitrary threshold or 228/228 requirement was introduced. All unaffected historical PASS/NOT_APPLICABLE outcomes were retained; only the three documented contract comparisons were re-read from immutable evidence.

## 13. Old FAIL to new result mapping

The machine mapping contains the corrected interpretation, reason and governing reference for every entry. All 25 transition from historical FAIL to H1T PASS:

| Old failure ID | Class | New result | Governing reference |
|---|---|---|---|
| `ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-RVPA-EXERCISE-MECHANISM-01:CONTRADICTION_PRESERVATION` | `KNOWLEDGE_CONFLICT_PROJECTION_MISMATCH` | `PASS` | `knowledge-engine/types.ts:315-320`; `scientific-thinking/input.ts:117-131` |
| `ST01H1-D-RVPA-EXERCISE-MECHANISM-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-RVPA-EXERCISE-MECHANISM-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:CONTRADICTION_PRESERVATION` | `KNOWLEDGE_CONFLICT_PROJECTION_MISMATCH` | `PASS` | `knowledge-engine/types.ts:315-320`; `scientific-thinking/input.ts:117-131` |
| `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:CONTRADICTION_PRESERVATION` | `KNOWLEDGE_CONFLICT_PROJECTION_MISMATCH` | `PASS` | `knowledge-engine/types.ts:315-320`; `scientific-thinking/input.ts:117-131` |
| `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-PANCREAS-IODINE-NARROW-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-PANCREAS-IODINE-NARROW-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |
| `ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:PROJECT_QUESTION_SOURCE_BINDING` | `ORIGINAL_EXPRESSION_CONTRACT_MISMATCH` | `PASS` | `scientific-reasoning-owner-chain.ts:167-179` |
| `ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:TRACE_COMPLETENESS` | `TRACE_EVENT_TAXONOMY_MISMATCH` | `PASS` | `scientific-execution-trace.ts:26-39,408-422,1112-1124` |

## 14. Remaining failures

`REMAINING_DETERMINISTIC_FAILURES = 0`

`NEW_CHECKER_ONLY_DEFECT = NO`

No product or owner repair is authorized or performed. This result concerns technical packet readability only.

## 15. ST immutability

ST remains version `1.2.1`. The engine, types and product runtime hashes match the values in Campaign D freeze both before and after H1T. `ST_RUNTIME_MODIFIED = NO`; `CAMPAIGN_D_OUTPUTS_MODIFIED = NO`.

## 16. Human adjudication state

There are 12 review cases. H1–H8 and reviewer rationales remain `PENDING` for every case. `HUMAN_ADJUDICATION_COMPLETED = 0`; `HUMAN_ADJUDICATION_PENDING = 12`. No scientific relevance, omission, invention, epistemic quality, alternatives, usefulness or final verdict was inferred.

## 17. Packet release decision

`H1_HUMAN_REVIEW_PACKET_TECHNICAL_RELEASE = READY`

The existing byte-identical packet `docs/implementation/w1-qual-01h1-st-human-review-packet.md` is technically releasable for Charles's manual scientific adjudication. This is not a scientific PASS, an H2 authorization, a characterization verdict or a PD-011 qualification.

## 18. Program state

```text
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
NEXT_AUTHORIZED_MISSION = NONE_PENDING_MANUAL_ST_CASE_ADJUDICATION
```

Automated ST characterization remains stopped by the human program decision. No H2 mission is inferred; the next action belongs to the human reviewer.

## 19. Git

H1T changes are limited to the versioned technical checker, checker-specific tests and generator, new H1T Level 3 evidence/report, and the evidence-based roadmap transition. No product runtime, scientific artifact, `main`, merge or deployment is involved. Local atomic commits are created after final gates; push requires explicit SHA authorization.

## Validation gates

| Gate | Result |
|---|---|
| Generic checker tests before readback | `10/10 PASS` |
| Current-contract / immutable-evidence readback tests | `7/7 PASS` |
| Typecheck | `PASS` |
| Targeted lint | `PASS` |
| Node ESM handler gate | `PASS` — 18 static runtime modules, zero aliases, zero extensionless relative imports |
| Production build | `PASS` — warnings retained; no external call |
| H1T JSON validation | `PASS` — 8 files |
| New-file secret scan | `PASS` — zero findings |
| `git diff --check` | `PASS` |

No broad benchmark, global exploratory suite, Campaign E, ST invocation or provider call was run. Existing build warnings (Browserslist age, Rollup annotations, CSS syntax and large chunks) were not altered and are outside H1T.
