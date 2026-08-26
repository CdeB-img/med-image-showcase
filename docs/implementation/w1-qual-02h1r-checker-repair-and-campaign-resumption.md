# W1-QUAL-02H1R — Checker repair and Campaign E resumption

Nature: `LEVEL_3_IMPLEMENTATION_EVIDENCE`

Normative status: `NON_NORMATIVE`

Campaign: `W1-QUAL-02H-ST-2026-08-26-E`

Historical freeze digest: `ke1-d1c4ff40aa84e28c`

## Decision

`W1_QUAL_02H1R_STOPPED_AFTER_SECOND_CHECKER_DEFECT`

The bounded limitation-contract diagnosis was correct and the generic repair was proven. The resumed campaign then exposed a second checker-only defect on the first historically unexecuted case. The hard anti-loop rule therefore stopped the mission. No second checker repair, case rerun, additional case execution, ST change, provider call, network call, scientific verdict, or human packet release occurred.

## Baseline

- Branch: `protocol-designer-canonical-ingestion`
- Initial `HEAD`: `6dd180db2c5594a92fc0c715b5dc5aa870dd3fa7`
- Initial `origin/protocol-designer-canonical-ingestion`: `6dd180db2c5594a92fc0c715b5dc5aa870dd3fa7`
- `main` and `origin/main`: `9be06edca1a7500ab7a43d065e94241e91d67bec`
- Historical untracked artifacts: 53, preserved

The foundational authorities were read in the required order: Source-of-Truth Index, Founding Charter, Protocol Designer Scientific Product Manifesto V2, then Editorial Engine Architecture Manifesto. The current ST contracts and the W1-ST-REPAIR-02, W1-QUAL-02H1, Campaign E, and roadmap evidence were then inspected. No documentary or technical-contract ambiguity was found for the limitation representation.

## Historical Campaign E preserved

- Campaign ID: `W1-QUAL-02H-ST-2026-08-26-E`
- Original freeze digest: `ke1-d1c4ff40aa84e28c`
- Historical decision: `W1_QUAL_02H1_HUMAN_REVIEW_PACKET_NOT_READY`
- Historical execution started: 1
- Historical persisted results: 0
- Historical remaining unexecuted: 7

The eight cases, Project inputs, Knowledge inputs, HumanReviewEnvelopes, parentage records, old checker identity, and ST runtime hashes remain unchanged.

## Checker contract audit

`ScientificThinkingOutput@1.2.2` has no top-level `output.limitations` field. The governed representations are:

1. forwarded Knowledge limitations at `ScientificThinkingOutput.handoff.limitations`;
2. candidate-scoped limitations at `ScientificThinkingOutput.hypotheses[*].limitations`;
3. persisted owner limitations at `SpecializedOwnerResult.limitations`, derived from the handoff limitations plus the non-adoption boundary.

Therefore:

```text
HISTORICAL_CHECKER_EXPECTATION = output.limitations
CHECKER_DEFECT_CONFIRMED = YES
REPAIR_DIRECTION = CHECKER_TO_CURRENT_CONTRACT
ST_RUNTIME_MODIFIED = NO
```

The successor checker is `1.2.0`, SHA-256 `ec257020b87341065a4dd623e8976fdc24948d925acd7f7a8c347f4021e1cbaa`. Four generic tests proved that it reads the current limitation projections, detects missing or changed required limitations, and performs no scientific judgment. Targeted lint passed.

## First-case recovery

The original NVC case output was not persisted in the immutable Campaign E files, and the historical transient harness or an equivalent exact artifact was not found in the repository, `/tmp`, or `/private/tmp`. The historical evidence contains `stOutput = null` and `resultDigest = null`.

```text
FIRST_CASE_RESULT_RECOVERY = NOT_RECOVERABLE
FIRST_CASE_HUMAN_ADJUDICATION = TECHNICALLY_NON_ADJUDICABLE
FIRST_CASE_ST_RERUNS = 0
```

No output was fabricated and no replacement case was created.

## Resumption and second checker defect

Only the first of the seven historically unexecuted cases was invoked:

| Case | ST invocations | OwnerResult | Digest | TRACE | Project writes |
| --- | ---: | --- | --- | --- | ---: |
| `ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01` | 1 | persisted and current on deterministic readback | `ke1-e8b1eb3cc7f26720` | 7/7 canonical events | 0 |

The checker produced 18 PASS, 1 FAIL, and 1 NOT_APPLICABLE. The sole FAIL was `SOURCE_EVIDENCE_REFS`; its aggregate `LINEAGE_INTEGRITY` therefore also reported FAIL.

Static comparison of the captured typed objects attributes this to the checker: the raw Knowledge result contains duplicate occurrences of two evidence identifiers, whereas the governed ST input/dependency projection canonicalizes reference identity to a unique list. The ST dependency retains all five unique evidence identifiers. No missing unique evidence reference or ST defect was established.

```text
NEW_CHECKER_ONLY_DEFECT = YES
UNRELIABLE_DETERMINISTIC_CHECKS = SOURCE_EVIDENCE_REFS, LINEAGE_INTEGRITY
SECOND_CHECKER_REPAIR_PERFORMED = NO
```

The six later frozen cases were not invoked. The K-edge case was not rerun. This is the final automatic checker repair attempt for Campaign E.

## Boundaries and counts

```text
ST_RUNTIME_MODIFIED = NO
FIRST_CASE_ST_RERUNS = 0
NEW_ST_INVOCATIONS = 1
REROLLS = 0
POST_OBSERVATION_REPAIRS = 0
EXTERNAL_LLM_API_CALLS = 0
NETWORK_CALLS = 0
HUMAN_SCIENTIFIC_ADJUDICATION_REQUIRED = YES
SCIENTIFIC_PASS = NO
```

No HumanReviewEnvelope or H1–H8 value was changed. The exact K-edge output remains preserved as technical evidence, but no successor human-review packet is released because the continuation did not clear the technical gate.

## Program state

```text
SCIENTIFIC_THINKING_CHARACTERIZATION = PENDING_HUMAN_ADJUDICATION_POST_REPAIR
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
NEXT_AUTHORIZED_MISSION = NONE_PENDING_HUMAN_PROGRAM_DECISION_AFTER_SECOND_CHECKER_DEFECT
```

This report does not establish scientific relevance, quality, utility, characterization, qualification, or Wave 1 closure.
