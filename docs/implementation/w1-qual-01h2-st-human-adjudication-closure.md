# W1-QUAL-01H2 — ST Human Adjudication Closure

`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE`

## Decision

`W1_QUAL_01H2_HUMAN_ADJUDICATION_RECORDED_ST_REPAIR_REQUIRED`

The supplied human adjudication is recorded without automatic scientific interpretation. Five of the eleven cases containing an ST output are human-adjudicated `CRITICAL_ST_DEFECT`; Scientific Thinking therefore requires a future bounded owner repair.

## Baseline

| Control | Value |
|---|---|
| Branch | `protocol-designer-canonical-ingestion` |
| Initial HEAD / origin branch | `7d502c0a1b1ccb7ab4b8b213f80b650d34bdde21` |
| `main` / `origin/main` | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Campaign | `W1-QUAL-01H-ST-2026-08-26-D` |
| Freeze | `ke1-f8f6b4620ab40c36` |
| ST | `1.2.1` |
| Historical untracked artifacts | 53 preserved |

## Human decision provenance

Reviewer: `Charles`. Review authority: `HUMAN_PROJECT_DECISION`. Historical H1 remains `W1_QUAL_01H1_REVIEW_PACKET_NOT_READY`; the later H1T technical decision remains `W1_QUAL_01H1T_HUMAN_REVIEW_PACKET_RELEASED_FOR_MANUAL_ADJUDICATION`. H2 records the supplied decisions and does not reinterpret, improve, challenge or independently adjudicate them.

## Case dispositions

| Case | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 / technical disposition |
|---|---|---|---|---|---|---|---|---|
| `ST01H1-D-MPR-CMR-PET-COMPARATIVE-01` | YES | NO | NO | YES | N/A | YES | PARTIAL | `ACCEPTABLE_WITH_LIMITATIONS` |
| `ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01` | YES | YES | NO | YES | N/A | YES | PARTIAL | `ACCEPTABLE_WITH_LIMITATIONS` |
| `ST01H1-D-RVPA-EXERCISE-MECHANISM-01` | PARTIAL | YES | NO | YES | NO | YES | NO | `CRITICAL_ST_DEFECT` |
| `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01` | YES | YES | NO | YES | NO | YES | NO | `CRITICAL_ST_DEFECT` |
| `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01` | YES | YES | NO | PARTIAL | NO | YES | NO | `CRITICAL_ST_DEFECT` |
| `ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01` | YES | NO | NO | YES | N/A | YES | PARTIAL | `ACCEPTABLE_WITH_LIMITATIONS` |
| `ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01` | PARTIAL | YES | NO | YES | N/A | YES | NO | `CRITICAL_ST_DEFECT` |
| `ST01H1-D-PANCREAS-IODINE-NARROW-01` | YES | NO | NO | YES | N/A | YES | PARTIAL | `ACCEPTABLE_WITH_LIMITATIONS` |
| `ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01` | NO | YES | NO | YES | N/A | NO | NO | `CRITICAL_ST_DEFECT` |
| `ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01` | PARTIAL | YES | NO | YES | N/A | YES | PARTIAL | `ACCEPTABLE_WITH_LIMITATIONS` |
| `ST01H1-D-CT-BMD-STALE-01` | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `EXPECTED_PRE_OWNER_REJECTION_CONFIRMED` |
| `ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01` | YES | YES | NO | YES | N/A | YES | PARTIAL | `ACCEPTABLE_WITH_LIMITATIONS` |

Exact counts: `HUMAN_REVIEW_CASES = 12`; `SCIENTIFIC_ST_CASES = 11`; `HUMAN_ADJUDICATION_COMPLETED = 12`; `HUMAN_ADJUDICATION_PENDING = 0`; `CRITICAL_ST_DEFECT = 5`; `ACCEPTABLE_WITH_LIMITATIONS = 6`; `TECHNICAL_CONTROL_NOT_SCIENTIFICALLY_ADJUDICATED = 1`.

## Critical defect classes

| ID | Class | Case |
|---|---|---|
| `ST-HUMAN-DEFECT-01` | `MECHANISTIC_REASONING_NOT_MATERIALIZED` | 3 |
| `ST-HUMAN-DEFECT-02` | `NAMED_ALTERNATIVES_FLATTENED_TO_GENERIC_COMPETING_BRANCH` | 4 |
| `ST-HUMAN-DEFECT-03` | `KNOWLEDGE_CONTRADICTION_NOT_MATERIALIZED_AS_COMPETING_HYPOTHESES` | 5 |
| `ST-HUMAN-DEFECT-04` | `STRUCTURING_PROJECT_UNKNOWN_NOT_GOVERNING_REASONING_BRANCH` | 7 |
| `ST-HUMAN-DEFECT-05` | `OUT_OF_OWNERSHIP_QUESTION_NOT_REFUSED_OR_ESCALATED` | 9 |

`ST-HUMAN-LIMITATION-01 = GENERIC_CANDIDATE_REFORMULATION_LOW_REASONING_VALUE` is a transversal non-critical limitation observed across several acceptable-with-limitations cases. It is not promoted to `CRITICAL_ST_DEFECT`.

## Characterization result

`SCIENTIFIC_THINKING_CHARACTERIZATION = OWNER_REPAIR_REQUIRED_WITHIN_BOUNDED_HUMAN_REVIEW_SCOPE`

No `SCIENTIFIC_PASS`, `PD011_PASS`, `ST_QUALIFIED` or `ST_CHARACTERIZED_SUCCESSFULLY` is claimed. The stale case is a technical fail-closed control and is excluded from scientific success/failure counts.

## Wave state

```text
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
```

Controlled-loop qualification is not authorized before the bounded ST owner repair.

## Next authorized mission

`NEXT_AUTHORIZED_MISSION = W1-ST-REPAIR-02_BOUNDED_HUMAN_ADJUDICATED_REASONING_REPAIR`

H2 does not perform that repair. The future mission must address the five generic human-adjudicated defect classes, not the five fixtures. Campaign D cases are exposed human-review evidence and may later be used only as non-regression evidence, never as fresh independent proof.

## Cost-control evidence

All provider, LLM and network calls are `0`. All ST, Knowledge, Imaging, REG and VAL runs/reruns are `0`. New campaigns, cases and replays are `0`. Validation is limited to static frozen-evidence readback, JSON parsing and bounded consistency checks, unchanged-evidence/hash checks, targeted secret scanning and `git diff --check`.

## Git

One local atomic checkpoint commit records the machine adjudication, this report and the evidence-based roadmap transition. Its exact SHA is reported at handoff. No push, merge, deployment or modification of `main` is performed in H2 without separate authorization.
