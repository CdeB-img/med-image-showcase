# W1-QUAL-01R1 — ST Characterization Harness Correction & Independent Restart

**Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`

**Normative status:** non-normative; this report records implementation and characterization-process evidence only.

**Date:** 25 August 2026

**Branch:** `protocol-designer-canonical-ingestion`

## 1. Decision

`W1_QUAL_01R1_BLOCKED_BY_CHARACTERIZATION_HARNESS`

Phase A corrected the six known Campaign A defects, passed 11/11 synthetic harness tests, and froze harness `2.0.0` at digest `ke1-1634f9e75685558b`. Phase B then authored and froze 13 new cases, 13 Acceptance Envelopes and 13 frozen input packs under Campaign ID `W1-QUAL-01R1-ST-2026-08-25-B`; all Knowledge gates passed and the parentage audit admitted 11 `NOVEL` plus 2 `RELATED_BUT_DISTINCT` cases.

Before the first ST invocation, a static fail-closed preflight reproduced a new defect in the frozen evaluator: a valid `STALE_KNOWLEDGE_RESULT` rejection with `invocation = null` is falsely interpreted as evidence promotion and `OWNER_REPAIR_REQUIRED`. The first divergence is therefore `CHARACTERIZATION_HARNESS`, not ST. Campaign B was invalidated with zero qualifying passes, zero ST runtime invocations, zero replays, zero rerolls and zero repairs.

No Scientific Thinking characterization status is produced:

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
| Initial HEAD | `efc11c98b3310dc77c90e7357a83f96dc9d82820` |
| Initial remote | `origin/protocol-designer-canonical-ingestion = efc11c98b3310dc77c90e7357a83f96dc9d82820` |
| Main | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Origin main | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Tracked baseline | Clean |
| Historical untracked artifacts | 53, preserved |
| Roadmap preflight | W1 active; R1 authorized; individual characterization `NO`; controlled-loop characterization `NO`; Wave 1 incomplete; Wave 2 unauthorized |

No baseline drift or normative contradiction was found.

## 3. Authorities

The mandatory authorities were consulted in order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. NOXIA Founding Charter, official V1.0;
3. NOXIA Protocol Designer — Scientific Product Manifesto V2.0;
4. Editorial Engine — Architecture Manifesto;
5. `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`.

Specialized authorities consulted as necessary: PD-003 V2 Research Object Model, Ownership Matrix, Relationship Catalog and Engine Impact Matrix; PD-005; PD-009; PD-011; RDE-001; RDE-002; KE-001. ST-001 and the W1 implementation reports were used only at their actual Level 3 evidence status. Campaign A and all prior W1 reports were not treated as norms.

The controlling interpretation is unchanged: Knowledge, Scientific Thinking and Research Project are distinct owners; candidate does not equal adopted; an absent explicit Project question does not compel zero candidates; a technical harness defect is neither a scientific conflict nor an owner defect.

## 4. Campaign A disposition

```text
CAMPAIGN_A = INVALID_FOR_INDEPENDENT_CHARACTERIZATION
CAMPAIGN_A_RUNTIME_ST_DEFECT_ESTABLISHED = NO
```

Campaign A remains `EXPOSED_HARNESS_DEVELOPMENT_EVIDENCE`. Its 12 cases, frozen inputs, envelopes, results, adjudications, traces and report were preserved byte-for-byte. They were used only to develop the new measurement device; none entered the independent numerator.

## 5. Harness defects

Phase A confirmed the six previously established defects:

| ID | Defect | Correct technical class |
|---|---|---|
| R1-HARNESS-01 | Incomplete failure taxonomy | `CHARACTERIZATION_HARNESS_DEFECT` |
| R1-HARNESS-02 | Non-conformant Knowledge usability gate | `CHARACTERIZATION_HARNESS_DEFECT` |
| R1-HARNESS-03 | Incomplete qualifying TRACE | `TRACE_INCOMPLETE` |
| R1-HARNESS-04 | C3 without mechanistic obligation | `REFERENCE_ENVELOPE_DEFECT` |
| R1-HARNESS-05 | C7 unjustified zero-candidate expectation | `REFERENCE_ENVELOPE_DEFECT` |
| R1-HARNESS-06 | Harness failure mapped to human arbitration | `CHARACTERIZATION_HARNESS_DEFECT` |

No owner defect was inferred from these six findings.

## 6. Status-model correction

The revised model separates `CAMPAIGN_STATUS`, `HARNESS_STATUS`, `REFERENCE_STATUS` and `OWNER_CHARACTERIZATION_STATUS`. Technical-gate precedence is:

```text
HARNESS → REFERENCE → FROZEN INPUT → TRACE → TRUE SCIENTIFIC CONFLICT → OWNER
```

`HUMAN_ARBITRATION_REQUIRED` is reachable only after all technical gates pass and a real unresolved scientific conflict exists. `OWNER_REPAIR_REQUIRED` is reachable only after a valid reference, valid frozen input and complete TRACE establish a reproducible owner violation.

## 7. Knowledge gate correction

The gate now returns `USABLE`, `NOT_USABLE` or `NON_ADJUDICABLE` and exposes the exact field:

```text
KNOWLEDGE_INPUT_USABLE_FOR_ST_CHARACTERIZATION = YES / NO
```

It verifies identity, version, digest, provenance, applicability, conditionally required source/evidence refs, preservation of gaps/limitations/contradictions, absence of a pre-encoded ST decision, frozen-input integrity and purpose coherence. It does not decide whether ST should generate a hypothesis. Preserved gaps and contradictions are admissible.

All 13 Campaign B frozen Knowledge inputs were `USABLE`. The stale test retained a valid historical Knowledge binding plus an explicit controlled successor-Project mismatch recipe; the gate did not relabel historical validity as current Project compatibility.

## 8. Negative-expectation correction

The revised Acceptance Envelope distinguishes:

- `STRICT_NO_CANDIDATE_EXPECTED`;
- `CONDITIONAL_CANDIDATE_ALLOWED`;
- `CLARIFICATION_OR_GAP_EXPECTED`;
- `CANDIDATE_REQUIRED`.

Strict zero is reserved for a contractual stop such as out-of-owner or pre-runtime stale rejection. Conditional candidates must remain pending, explicitly conditioned, unknown-preserving and non-adopted. C7 development readback is satisfied under `CONDITIONAL_CANDIDATE_ALLOWED`; this does not rehabilitate Campaign A.

## 9. Mechanistic obligation

`REASONING_CANDIDATE_MECHANISTIC_OR_EXPLANATORY` accepts either a linked mechanism candidate or a candidate Scientific Model with an explicit explanatory relation. It imposes no exact wording, mechanism, count or representation type.

Campaign A C3 became deterministically adjudicable under the revised rule and would yield a development-only violation because its exposed output contains hypotheses but no mechanism or candidate Scientific Model. That observation is excluded from independent ST evidence.

## 10. TRACE completeness

The revised gate requires case ID; Project tuple; Knowledge ref/digest; ST request ref/digest; ST version; ST result ref/digest; status; candidate structure/counts; gaps; limitations; contradictions; divergent stage on failure; duration; and replay refs. An absent request/result after a legitimate pre-runtime rejection must be represented explicitly, not fabricated as an OwnerResult.

`TRACE_QUALIFICATION_COMPLETE = NO` makes a case `NON_ADJUDICABLE`. Campaign B produced no owner run, so qualifying TRACE counts are 0/0.

## 11. Harness tests

The revised harness passed 11/11 tests before freeze:

1. harness defect blocks campaign;
2. reference defect makes the case non-adjudicable;
3. human arbitration is reserved for true scientific conflict;
4. owner repair requires a valid owner violation;
5. incomplete TRACE prevents an owner verdict;
6. invalid frozen input prevents an owner verdict;
7. conditional candidate is permitted safely;
8. strict no-candidate is enforced;
9. mechanistic obligation is representation-generic;
10. gaps/contradictions do not fail the Knowledge gate;
11. the machine validator fails closed on missing taxonomy.

The mandatory ten behaviors were covered. The later stale/null-state defect demonstrates that this test set was still incomplete.

## 12. Harness freeze

```text
HARNESS_VERSION = 2.0.0
HARNESS_DIGEST = ke1-1634f9e75685558b
PHASE_A_FREEZE_STATUS = READY_AT_FREEZE
FINAL_HARNESS_STATUS = NOT_READY
```

The freeze includes digests for evaluator, taxonomy, Knowledge gate, TRACE completeness, Acceptance Envelope schema, adjudication rules, negative semantics, mechanistic obligation, runner and validator. No harness file was modified after the freeze. The final `NOT_READY` status records the subsequently discovered defect; it does not rewrite the historical freeze.

## 13. Campaign B independence

```text
CAMPAIGN_B_ID = W1-QUAL-01R1-ST-2026-08-25-B
CAMPAIGN_A_CASES_REUSED_AS_INDEPENDENT_EVIDENCE = NO
REPAIR_PROBES_REUSED_AS_INDEPENDENT_EVIDENCE = NO
```

Thirteen new cases were authored across 13 context labels covering spectral CT, photon-counting metrology, cardiac MRI, neuro ASL/CTP/DCE, general imaging-biomarker methodology, clarification, conditional Project unknown, administrative out-of-owner and stale protection. Campaign B freeze digest is `ke1-f0e48d02e41ece46`.

Campaign B is now exposed to harness forensics and is not authorized for reuse as a future independent numerator.

## 14. Parentage

| Status | Count |
|---|---:|
| `NOVEL` | 11 |
| `RELATED_BUT_DISTINCT` | 2 |
| `TOO_CLOSE` | 0 |
| `EXACT_OR_NEAR_DUPLICATE` | 0 |

The two related-but-distinct controls were the no-finality safety case and the conditional-outcome Project-unknown case. Their scientific objects and obligations differ from exposed cases, and neither was intended to supply the candidate-coverage numerator. Parentage was complete before any planned execution.

## 15. Frozen inputs

Thirteen `ProjectContextSnapshot + Frozen KnowledgeResult` packs were authored, versioned, Project-bound, provenance-preserving and digest-verified. No Knowledge recalculation, LLM, External Evidence, PubMed or regulatory network call occurred. All Knowledge gates passed before freeze.

## 16. Acceptance Envelopes

Thirteen envelopes were authored before observation and frozen. They encode required obligations, forbidden behavior, allowed alternatives, expected gaps/limitations/contradictions, negative mode, criticality, references and first divergent stages. No envelope was modified after freeze.

## 17. Independent results

No independent owner result exists.

| Campaign state | Count |
|---|---:|
| Cases authored/frozen | 13 |
| ST runtime invocations | 0 |
| Qualifying passes | 0 |
| Cases adjudicated | 0 |
| Replays performed | 0 |
| Rerolls | 0 |
| Runtime repairs | 0 |
| Post-freeze harness repairs | 0 |

Candidate coverage and negative/conditional correctness are `NOT_MEASURED`, not zero-performance observations.

## 18. Epistemic safety

The frozen evaluator defect is specific and deterministic:

```text
input state = invocation=null + STALE_KNOWLEDGE_RESULT + complete rejection trace
incorrect frozen evaluator result = EVIDENCE_PROMOTION / OWNER_REPAIR_REQUIRED
correct disposition = CHARACTERIZATION_HARNESS_DEFECT / NOT_ADJUDICATED
```

Two null-state errors combine: `undefined !== null` incorrectly marks promotion, and the absence of `projectWriteAuthorized === false` is treated as a write-boundary failure although no OwnerResult exists. No actual ST evidence promotion or Project write was observed because ST was never invoked.

## 19. Determinism

Three replay roles were selected before observation: positive mechanistic, conditional/no-candidate, and contradiction/alternatives. Replays performed: 0. Stable replays: 0. Status: `NOT_PERFORMED_CAMPAIGN_BLOCKED_BEFORE_OWNER_INVOCATION`.

## 20. Failure registry

One new blocking failure is registered:

| Failure | Class | First divergent stage | Owner |
|---|---|---|---|
| `W1-QUAL-01R1-B-HARNESS-STALE-NULL-STATE-01` | `CHARACTERIZATION_HARNESS_DEFECT` | `CHARACTERIZATION_HARNESS` | R1 characterization harness |

Reference defects: 0. Frozen-input defects: 0. TRACE defects observed in an owner run: 0. ST owner defects: 0. Human-arbitration cases: 0.

## 21. ST characterization

```text
ST_VERSION = 1.2.1
ST_RUNTIME_MODIFIED = NO
SCIENTIFIC_THINKING_CHARACTERIZATION = NOT_ADJUDICATED
```

No change was made to Scientific Thinking or any other owner runtime. No owner repair is authorized. A correct technical stop must not be recast as a scientific or owner failure.

## 22. Wave decision

```text
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
```

W1-LOOP-QUAL-01 is not authorized. Individual ST characterization remains the first unresolved Wave 1 dependency.

## 23. Roadmap

```text
CURRENT_WAVE = WAVE_1_SCIENTIFIC_LOOP
NEXT_AUTHORIZED_MISSION = W1-QUAL-01R2_ST_CHARACTERIZATION_HARNESS_REPAIR
```

R2 must correct the bounded stale/null-state evaluator semantics, add a synthetic regression for a legitimate pre-runtime rejection without request/result, refreeze, and create another independent campaign. Campaign A and Campaign B may be used only as exposed harness-development evidence.

## 24. Git and verification

Targeted non-regression: 13 files / 181 tests passed, plus 4 owner-corridor files / 130 tests passed; total targeted green evidence: 17 files / 311 tests.

Historical suites reproduced the known debt exactly:

| Suite | Passed | Failed | Total | Classification |
|---|---:|---:|---:|---|
| IMG | 56 | 4 | 60 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| PRJ | 72 | 1 | 73 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| SYS | 31 | 3 | 34 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| Total | 159 | 8 | 167 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |

The eight failures match the recorded baseline: four IMG freeze expectations, one PRJ `IMG_001B_LIVE_HANDOFF_NOT_FROZEN`, and three SYS fixture expectations. They were not repaired.

Additional gates: typecheck pass; targeted lint pass; API/server typechecks pass; Node ESM handler load pass; production build pass with existing warnings; 23 new machine JSON files parsed; `git diff --check` pass. Secret scan and final Campaign A/runtime immutability checks are recorded at commit preflight.

No merge, deployment, provider call, external network call, Project mutation, ST runtime change, other owner-runtime change, Campaign A modification, reroll or repair occurred.
