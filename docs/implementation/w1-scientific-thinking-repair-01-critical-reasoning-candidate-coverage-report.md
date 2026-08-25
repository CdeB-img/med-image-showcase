# W1-SCIENTIFIC-THINKING-REPAIR-01 — Critical Reasoning Candidate Coverage

## 1. Decision

| Field | Value |
|---|---|
| Classification | `LEVEL_3_IMPLEMENTATION_EVIDENCE` — non normative |
| Decision | `W1_ST_REPAIR_01_CRITICAL_REASONING_CANDIDATE_COVERAGE_REPAIRED` |
| Initial architectural finding | The bounded defect was real and located in Scientific Thinking. |
| Repair status | Generic, deterministic and owner-bounded repair demonstrated. |
| Scientific Thinking recharacterized | `NO` |
| Wave 1 complete | `NO` |

The repair restores candidate coverage for supported typed reasoning opportunities. It does not require a candidate for every request, does not qualify Scientific Thinking scientifically, and does not change Project truth.

## 2. Baseline

- Branch: `protocol-designer-canonical-ingestion`.
- Initial `HEAD` and remote: `3ef6c93d324586143b4f3759b47acbe1c02b202a`.
- `main` and `origin/main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`.
- Tracked state: clean before the mission; historical untracked artifacts present and preserved.
- Roadmap preflight: Wave 1 active and `W1-SCIENTIFIC-THINKING-REPAIR-01_CRITICAL_REASONING_CANDIDATE_COVERAGE` authorized.
- W1-QUAL-01 campaign G was hashed before work and remained byte-for-byte unchanged after the repair checks.
- Provider, external-evidence and network calls: `0`.

## 3. Authorities

The mandatory authorities were read in order: Source-of-Truth Index; Founding Charter; Scientific Product Manifesto V2; Editorial Engine Architecture Manifesto; integration roadmap. The applicable specialized set was then consulted: PD-003 V2 Research Object Model, Ownership Matrix, Relationship Catalog and Engine Impact Matrix; PD-005; PD-009; PD-011; RDE-001; RDE-002; KE-001. ST-001 and W1-CLOSURE-01, W1-TRACE-01 and W1-QUAL-01 were used only as Level 3 evidence.

No admitted normative contradiction was found. The governing boundary is unchanged: Scientific Thinking may propose candidate questions, objectives, hypotheses, alternatives and models, but cannot own Knowledge evidence, strengthen its support, adopt Project truth or write Project.

## 4. Historical defect

The original frozen W1-QUAL-01 campaign `W1-QUAL-01-2026-08-25-G` was replayed without modification.

| Case | Pack digest | Pre-repair result digest | Status | Candidate counts Q/H/O/A |
|---|---|---|---|---|
| `ST-CARDIAC-01` | `ke1-39f844d97d6aa0dd` | `ke1-36984137b66353c3` | `CLARIFICATION_REQUIRED` | `1/0/0/0` |
| `ST-NEURO-01` | `ke1-790b7a8373957cf7` | `ke1-9afb20584525fafc` | `CLARIFICATION_REQUIRED` | `1/0/0/0` |

Both pack digests were valid. Their exact Project tuples, frozen Knowledge dependencies, result packaging and seven-event passive traces were preserved. The historical first divergent stage remained `SCIENTIFIC_THINKING_ENGINE`.

## 5. Forensics

For both cases, request acceptance, canonical Project binding, context normalization, exact Project-question reconstruction, Knowledge evidence selection, epistemic guards, output canonicalization and OwnerResult packaging were correct. Each input contained a current explicit scientific question, typed reasoning context, population/context scope, and a same-Project frozen Knowledge result with applicable evidence and a contradiction. Project writes were zero.

No candidate was subsequently filtered: construction had never been reached. The defect was not in Project, Knowledge, the Knowledge-to-ST handoff, TRACE or persistence.

## 6. Internal first divergent stage

`ST_INTERNAL_FIRST_DIVERGENT_STAGE = ST_CANDIDATE_ELIGIBILITY`

`completeExistingQuestion` treated a narrow lexical relation detector as the decisive completeness gate even when the current typed Project question and its exact Knowledge dependency already satisfied the structural reasoning contract. When Imaging-related objects were also present, the downstream branch reclassified the input as a premature method preference. The primary question became `NEEDS_CLARIFICATION`, so hypothesis, objective and alternative construction were never reached.

## 7. Generic defect class

The repair contract is `REASONING_CANDIDATE_COVERAGE`:

> An explicit current Project scientific question with sufficient typed structure, population/context scope and a bound Knowledge OwnerResult carrying applicable support and evidence must remain eligible for an ST candidate contribution unless a refusal or critical epistemic blocker applies.

Legitimate empty or limited results remain valid for missing/insufficient structure, unsupported or unavailable evidence, critical gaps/unknowns, out-of-owner requests and non-testable requests. Question, objective and hypothesis are not made universally co-dependent.

## 8. Independent pre-repair reproduction

Eight fresh synthetic probes were authored before the runtime patch and excluded the historical cardiac and neuro domains. Pre-repair execution produced `3/8` passes and `5/8` expected failures. Comparative, predictive/association, competing-explanation, Knowledge-contradiction and legacy-trigger-independent supported inputs all reproduced the silent candidate omission.

`GENERIC_PRE_REPAIR_REPRODUCTION = YES`

The insufficient-evidence, Project-unknown and out-of-owner probes already passed before repair, establishing the negative guard baseline.

## 9. Repair

Only the ST eligibility owner component was changed:

- `src/features/scientific-thinking/engine.ts` adds a structural supported-question predicate using current typed Project and Knowledge contracts, then accepts either the existing lexical path or this structural path;
- `src/features/scientific-thinking/types.ts` advances the ST engine contract from `1.2.0` to `1.2.1`, avoiding semantic drift under one version;
- the generic A–H probe suite and the SPINE version expectation cover the change.

The predicate requires exact Project binding, an explicit scientific question, typed reasoning terms, population/context scope, an exact Knowledge dependency, applicable Knowledge support, and assertion/evidence/source lineage. It refuses blockers and does not add an empty-result fallback. It contains no case ID, historical wording, cardiac, neuro, infarct or perfusion special case.

## 10. Fresh probes

| Probe | Purpose | Before | After | Epistemic safety |
|---|---|---|---|---|
| A | Comparative supported question | `FAIL`, H/O/A `0/0/0` | `PASS`, `2/1/1` | candidates remain pending and partial |
| B | Predictive/association question | `FAIL`, `0/0/0` | `PASS`, `2/1/1` | association not promoted to truth |
| C | Multiple plausible explanations | `FAIL`, `0/0/0` | `PASS`, `2/1/1` | contradiction and alternatives preserved |
| D | Insufficient evidence | `PASS`, `0/0/0` | `PASS`, `0/0/0` | no forced candidate |
| E | Structuring Project unknown | `PASS`, `0/0/0` | `PASS`, `0/0/0` | unknown preserved; no invention |
| F | Knowledge contradiction | `FAIL`, `0/0/0` | `PASS`, `2/1/1` | no silent winner |
| G | Out-of-owner request | `PASS`, `0/0/0` | `PASS`, `0/0/0` | explicit refusal; no pseudo-candidate |
| H | Independence from legacy trigger | `FAIL`, `0/0/0` | `PASS`, `2/1/1` | current typed contracts are sufficient |

Post-repair: `9/9` tests passed, including deterministic replay of A, B, C and H with stable logical result digests and candidate structures.

## 11. Epistemic safety

```text
UNSUPPORTED_HYPOTHESIS = 0
EVIDENCE_PROMOTION = 0
KNOWLEDGE_GAP_LOSS = 0
CONTRADICTION_LOSS = 0
PROJECT_ADOPTION_LEAK = 0
PROJECT_WRITES = 0
```

Knowledge `SUPPORTED` produces at most `PARTIAL` candidate support; `PARTIAL` remains `PARTIAL`; conflicting support remains conflicting or an explicitly unsupported alternative. Every generated scientific contribution retains `PENDING` human-review semantics. No Knowledge ownership transfer, Project adoption, provider fallback or private chain-of-thought storage was introduced.

## 12. Historical replay

Historical cases are non-regression evidence only.

| Case | Before | After | Role |
|---|---|---|---|
| `ST-CARDIAC-01` | `CLARIFICATION_REQUIRED`, H/O/A `0/0/0`, `ke1-36984137b66353c3` | `CANDIDATES_PROPOSED`, `2/1/1`, `ke1-373c66e237aed386` | `POST_REPAIR_NON_REGRESSION` |
| `ST-NEURO-01` | `CLARIFICATION_REQUIRED`, H/O/A `0/0/0`, `ke1-9afb20584525fafc` | `CANDIDATES_PROPOSED`, `2/1/1`, `ke1-91ab67672b39b9fb` | `POST_REPAIR_NON_REGRESSION` |
| `ST-SPECTRAL-01` | `CANDIDATES_PROPOSED`, `2/2/1` | same status/counts; exact Project question now retained | `PREEXISTING_PASS_NON_REGRESSION` |
| `ST-UNSUPPORTED-01` | `CLARIFICATION_REQUIRED`, `0/0/0` | identical logical digest and gap behavior | `PREEXISTING_PASS_NON_REGRESSION` |

The repaired cardiac and neuro outputs retain the exact Project question, exact Knowledge lineage, pending candidate state and zero Project write.

## 13. Non-regression

| Suite | Files | Passed | Failed | Classification |
|---|---:|---:|---:|---|
| Fresh probes | 1 | 9 | 0 | `PASS` |
| ST unit + Knowledge→ST + TRACE | 10 | 135 | 0 | `PASS` |
| W0 + W1 owners + SPINE + TRACE | 12 | 297 | 0 | `PASS` |
| W1-QUAL harness readback | 1 | 3 | 0 | `PASS` |
| Historical Imaging suite | 9 | 56 | 4 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| Historical Project suite | 8 | 72 | 1 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |
| Historical system-integration suite | 11 | 31 | 3 | `PREEXISTING_HISTORICAL_FIXTURE_DEBT` |

Typecheck, ESM forensic replay, targeted lint, build, JSON parsing, secret scan and `git diff --check` are final mission gates. The eight known historical failures remain openly classified `IMG = 4`, `PRJ = 1`, `SYS = 3`; no full-suite-green claim is made.

## 14. Limitations

This evidence demonstrates a bounded technical correction and its epistemic guards. It does not demonstrate universal scientific performance, corpus completeness, the scientific validity of generated hypotheses, Scientific Model qualification, controlled-loop characterization, PD-011 qualification, production readiness, orchestration, OBS, Study Design, Biostatistics calculation or Wave 2 readiness.

The development probes are exposed to this repair and cannot become independent qualification evidence. The historical cases are also exposed and remain non-regression only.

## 15. Recharacterization requirement

`W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO`

Scientific Thinking remains `OWNER_REPAIR_REQUIRED` in the immutable historical W1-QUAL-01 report because that decision was correct for campaign G. A new, precommitted and independently frozen ST campaign must test candidate coverage and epistemic safety on unseen cases. No recharacterization is performed here.

## 16. Roadmap transition

```text
CURRENT_WAVE = WAVE_1_SCIENTIFIC_LOOP
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
NEXT_AUTHORIZED_MISSION = W1-QUAL-01R_ST_INDEPENDENT_RECHARACTERIZATION
WAVE_2_AUTHORIZED = NO
```

## 17. Git

The intended atomic history is one ST runtime/test repair commit followed by one evidence/report/roadmap checkpoint commit. Only `protocol-designer-canonical-ingestion` may be pushed. `main` remains untouched; merge and deployment are outside scope. Historical untracked artifacts remain unadded and preserved.
