# P1-BEHAVIOR-01A — Behavioral Contract Freeze & Executable Regression Baseline

Status: `NON_NORMATIVE_IMPLEMENTATION_REPORT`

Observed at: `2026-08-31`

## A. Scope and baseline

- Repository: `/Users/charles/Documents/Projets/NOXIA/noxia-dev`
- Branch: `protocol-designer-canonical-ingestion`
- Production baseline: `57740f3e56a96f56d56820e28fae643fc21282b8`
- Local Gen-01 baseline: `66952feb31ad9fc7f2ee7c3f58287588e28c9ab0`
- Local Gen-01 is the direct child of the production baseline: `PASS`
- Tracked baseline before the mission: `CLEAN`
- Preserved untracked implementation reports: `9`
- Product source changes: `0`
- Provider calls: `0`
- Product repair: `NO`
- Push/deployment: `NO`

The mission creates only a generic executable behavior contract, its test fixtures, and this non-normative report. It does not claim that failing behaviors have been repaired.

## B. Routed authorities

The following authorities were routed before contract construction:

1. `NOXIA — SOURCE-OF-TRUTH-INDEX`, version 1.45;
2. `Charte fondatrice`;
3. `Scientific Product Manifesto V2`;
4. `PD-003 V2` for Project ownership, versions, unknowns, and Human Decision;
5. `PD-004` for progressive, reversible, human-readable interaction;
6. `PD-009` for next-action selection and the QRY WHAT / formulation HOW boundary;
7. current PRJ contribution intake, Human Decision, QRY, DOC, Functional Reset, and TRACE contracts.

No authority conflict was found. The test contract does not modify or supersede any authority.

The target invariants used by the executable contract are:

- explicit user information is preserved or its transformation is explicit;
- candidate interpretation is not adopted Project truth;
- only an attributable Human Decision creates a Project version;
- QRY owns the next useful scientific/methodological information scope;
- formulation/projection layers do not acquire Project write authority;
- unknown, negative, non-applicable, and withheld states must not be silently collapsed;
- document projections remain bound to an exact Project version and become stale after a Project change.

## C. Historical functional reference

Historical reference is confirmed as code and test evidence, not as current normative authority:

| Reference | Confirmed evidence |
| --- | --- |
| `4e375ac9607e374f0c293fede265eb16c4b6f3e2` | conversational workspace, timeline, handoff router, Project panel, QRY lifecycle |
| `d0d71ebdf3ce58ef55c55ea18db87c3ec168fec9` | recoverable schema boundary and prevention of a blank workspace |
| `f578857ce3e101a6f7e34361a8d6d7f6b1231d3a` | guided scientific intake and its regression scenarios |
| `bcc10816c5c4458fb0ed798bfa0d0f37f34d165e` | Functional Reset Standard flow, candidate review, Project panel, v1/v2 continuity |
| `9be06edca1a7500ab7a43d065e94241e91d67bec` | literal source-anchor provenance at the product bridge boundary |

These references demonstrate earlier functional behavior and lineage. The current executable baseline remains measured at `66952feb31ad9fc7f2ee7c3f58287588e28c9ab0`.

## D. Test-only state mapping

The S0–S6 labels are a test vocabulary only. They do not create a runtime state machine.

| Test state | Existing runtime representation |
| --- | --- |
| `S0_EMPTY` | `FunctionalResetSession.project = null`, `pendingContribution = null`, no pending `REVIEW` entry |
| `S1_WORKING_CANDIDATE` | `pendingContribution` plus `ResearchProjectContributionCandidate.status = CANDIDATE_PENDING_HUMAN_CONFIRMATION` |
| `S2_PENDING_HUMAN_REVIEW` | conversation `REVIEW.status = PENDING`, candidate `humanReviewProjection.status = COMPLETE`, no engaging decision |
| `S3_ADOPTED_PROJECT` | `ResearchProjectOwnerProjection` with immutable `versionId`, `revision`, digest, and `confirmationDecision.status = ADOPTED` |
| `S4_ADOPTED_PLUS_PENDING_DELTA` | adopted `project` retained unchanged plus `pendingContribution` and a pending review candidate whose base version is current |
| `S5_CURRENT_DOCUMENT` | `FunctionalResetDocumentPortfolio` protocol card `freshness = CURRENT`, source version/digest equal to current Project |
| `S6_STALE_DOCUMENT` | retained prior document projection with protocol card `freshness = STALE` after Project version/digest change |

Current implementation couples S1 and S2 closely in the Standard UI, but their distinct ownership semantics remain testable.

## E. Generic behavioral contract

The executable oracle contains exactly B01–B20. Each record explicitly freezes:

`PRECONDITION`, `USER_ACTION`, `MUST_PRESERVE`, `MAY_INTERPRET`, `MUST_NOT_INVENT`, `EXPECTED_QRY_ACTION`, `EXPECTED_VISIBLE_BEHAVIOR`, `EXPECTED_CANDIDATE_EFFECT`, `EXPECTED_PROJECT_EFFECT`, `HUMAN_GATE`, `EXPECTED_TRACE_FACTS`, `EXPECTED_DOCUMENT_EFFECT`, `DETERMINISTIC_ASSERTIONS`, and `HUMAN_ONLY_ASSERTIONS`.

The fixtures use only generic synthetic concepts: population A/B, intervention X, method Y, measurement Z, response Q, and time T1/T2. Historical or human cases are evidence witnesses only and are not encoded as the contract.

## F. Current-behavior measurement

Command:

```text
npm test -- --run src/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract.test.ts
```

Vitest result:

```text
Test files: 1 failed
Tests: 2 failed | 18 passed | 1 todo
```

The 18 passed tests include one inventory/meta-contract test. Transition-only accounting is:

- `CONTRACT_PASS = 17`
- `CONTRACT_FAIL = 2`
- `CONTRACT_NOT_TESTABLE = 1`

| Contract | Current status | Deterministic observation |
| --- | --- | --- |
| B01 rich initial request | PASS | rich explicit dimensions produce a specific governed `PROPOSE`; candidate remains non-writing |
| B02 sparse initial request | PASS | sparse input remains sparse and bounded generic realization is accepted |
| B03 first confirmation | PASS | attributable Human Decision creates Project v1 once |
| B04 add | PASS | `ADD`, no mutation before confirmation, vN+1 after confirmation |
| B05 remove | PASS | explicit `REMOVE`, historical object becomes `SUPERSEDED` |
| B06 re-add | PASS | one active semantic identity after re-addition |
| B07 replace | PASS | stable semantic identity plus prior ref yields `REPLACE`, not competing values |
| B08 multi-change | PASS | three coherent changes remain in one complete review bundle |
| B09 partial answer | PASS | supplied value is candidate; unsupplied value remains `UNKNOWN` and is not invented |
| B10 “don’t know” | PASS | `USER_DOES_NOT_KNOW` defers the action and prevents immediate identical QRY repetition |
| B11 negative-state distinctions | NOT_TESTABLE | no common product corridor represents `NO`, `NOT_APPLICABLE`, `UNKNOWN`, and `REFUSE_TO_ANSWER` end to end |
| B12 next useful question | PASS | owner is `QUERY_NAVIGATION`; wording does not choose scope; Project write remains false |
| B13 prior interpretation correction | PASS | pre-adoption correction leaves only the replacement visible while retaining lineage |
| B14 provider fallback observability | FAIL | realization knows rejection and fallback reason, but final `QUESTION_REALIZED` TRACE loses received/accepted/rejection/fallback facts |
| B15 category fidelity | FAIL | generic `ACQUISITION + SAMPLE_COLLECTION` is classified as `IMAGING` |
| B16 Project living view | PASS | adopted Project remains current while distinct new content is pending review |
| B17 continuity | PASS | Project, pending contribution, QRY state, and documents persist/reload with exact identities |
| B18 document current/stale | PASS | current projection becomes stale and remains bound to the prior Project version |
| B19 cross-view consistency | PASS | review, Project, and document retain explicit contribution/version/digest bindings |
| B20 shared no-silent-write | PASS | candidate, QRY, and document inspection leave Project byte-identical |

## G. Failure clusters

### CLUSTER_1 — provider rejection observability gap

- Contract: `B14`
- Realization boundary observation: `providerReplyAccepted = false`, `executor = LOCAL_DETERMINISTIC_REALIZATION`, `conformanceReason = PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH`
- Final TRACE observation: `QUESTION_REALIZED.executor = LOCAL_RUNTIME`, `provider = NONE`, generic `reasonCode = NON_INTERROGATIVE_ACTION_REALIZED`
- Missing final facts: provider response received, provider response accepted/rejected, rejection reason, fallback reason
- Current technical owner perimeter: pre-Project TRACE segment / provider-boundary-to-TRACE projection
- Repair performed: `NO`

### CLUSTER_2 — generic acquisition category collapse

- Contract: `B15`
- Input: `proposedType = ACQUISITION`, `studyRole = SAMPLE_COLLECTION`, content `collecte de matériau B`
- Observed classification: `IMAGING`
- Expected invariant: sample collection must not become imaging merely because its generic type contains `ACQUISITION`
- Current technical owner perimeter: PRJ contribution intake classification, `sectionForContributionItem`
- Repair performed: `NO`

## H. Explicit non-testable gap

`B11` is not marked pass, skipped by convenience, or reconstructed from unrelated fields.

The current minimal Project corridor exposes canonical epistemic states `KNOWN | ASSUMED | UNKNOWN | WITHHELD`. QRY separately supports lifecycle deferral/decline mechanics. There is no demonstrated common end-to-end runtime representation that preserves all four requested meanings:

- negative answer (`NO`);
- structurally non-applicable (`NOT_APPLICABLE`);
- epistemically unknown (`UNKNOWN`);
- refusal to answer (`REFUSE_TO_ANSWER`).

Therefore `B11 = NOT_TESTABLE`. Creating or changing that representation belongs to a later authorized product mission, not to this contract-freeze mission.

## I. Static qualification

```text
Targeted behavioral baseline: expected red, 2 product-contract failures, 1 todo
Related deterministic regressions (Gen-01, P1-E2E-07, Functional Reset 03A1/03C): 62/62 PASS
ESLint on new test perimeter: PASS
Full TypeScript gate: PASS
Provider calls: 0
```

The expected-red behavioral suite is coherent: its failures are assertion failures against observed product behavior, not compilation, fixture, environment, or test-runner failures.

## J. Git boundary

Mission-created files only:

1. `src/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures.ts`
2. `src/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract.test.ts`
3. `docs/implementation/p1-behavior-01a-behavioral-contract-report.md`

Product source files changed: `0`.

The nine inherited untracked reports remain preserved and outside the mission allowlist. No reset, clean, stash, rebase, merge, mass-add, push, or deployment was performed.

## K. Decision

The contract is generic, executable, correctly red where current behavior diverges, explicit where the product is not testable, and statically qualified. Human approval of this behavioral contract is required before any repair mission.

`P1_BEHAVIOR_01A_CONTRACT_READY_FOR_HUMAN_APPROVAL`

`NEXT_MISSION = P1-BEHAVIOR-01B_AFTER_HUMAN_APPROVAL`
