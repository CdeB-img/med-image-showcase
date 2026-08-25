# W1-TRACE-01 — Scientific Execution Trace

| Field | Value |
|---|---|
| Classification | `LEVEL_3_IMPLEMENTATION_EVIDENCE` |
| Normative status | `NON_NORMATIVE` |
| Date | 2026-08-25 |
| Branch | `protocol-designer-canonical-ingestion` |
| Initial HEAD | `c6e47d7072144d27ccead68ed5924a20ce6747e6` |
| Initial commit | `chore(protocol-designer): record wave 1 convergence checkpoint` |
| Checkpoint commit / final HEAD | self-reference: the immutable commit containing this report; resolved in the final Git handoff |
| Global decision | `W1_TRACE_01_SCIENTIFIC_EXECUTION_TRACE_READY` |

This report records bounded implementation evidence. It does not create a PD-003 business object, scientific owner, orchestrator, repair path, Project truth, scientific validation, regulatory approval, PD-011 qualification, private-reasoning store or Wave 2 authorization.

## 1. Baseline and fail-closed preflight

| Check | Expected | Observed | Verdict |
|---|---|---|---|
| Branch | `protocol-designer-canonical-ingestion` | `protocol-designer-canonical-ingestion` | `PASS` |
| HEAD | `c6e47d7072144d27ccead68ed5924a20ce6747e6` | same | `PASS` |
| Origin branch | `c6e47d7072144d27ccead68ed5924a20ce6747e6` | same | `PASS` |
| Main / origin main | `9be06edca1a7500ab7a43d065e94241e91d67bec` | same | `PASS` |
| Historical untracked artifacts | preserve | preserved; never cleaned, moved, stashed or mass-added | `PASS` |

The roadmap authorized `W1-TRACE-01_SCIENTIFIC_EXECUTION_TRACE`, retained `CURRENT_WAVE = WAVE_1_SCIENTIFIC_LOOP`, recorded architectural convergence `YES`, observability `NO`, both characterization gates `NO`, Wave 1 complete `NO`, and Wave 2 unauthorized.

## 2. Authorities and evidence consulted

Mandatory authorities were read in order before substantive work:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx`;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-v2.0.docx`;
4. `../../editorial-engine/docs/architecture-manifesto.md`;
5. `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`.

Applicable specialized authorities: PD-003 V2 Research Object Model, Ownership Matrix and Relationship Catalog; PD-005; PD-009; PD-011; RDE-001/002/003; KE-001; REG-001; VAL-000/001. The W0/W1 implementation reports and W1-CLOSURE-01 report/manifest were used only as Level 3 evidence. No admitted normative contradiction was identified.

`DOCUMENTARY_OR_NORMATIVE_ARBITRATION_REQUIRED = NO`

## 3. Architecture and boundaries

`ScientificRun` and `ScientificExecutionTraceEvent` are technical, derived observability artifacts. They are not Project truth and are not added to PD-003. `ScientificRunTraceRecorder` is an optional handle passed to existing product entrypoints; it never selects, schedules or invokes an owner.

The dedicated `SCIENTIFIC_EXECUTION_TRACE_LEDGER@0.1.0` remains separate from:

- the canonical Project ledger;
- the shared OwnerResult ledger;
- the ValidationRun ledger.

It stores only immutable run bindings, immutable events and their digests. It references observed artifacts; it does not embed or replace their authoritative payloads. Session persistence was extended from `1.6.0` to `1.7.0`; migration from `1.6.0` preserves both existing ledgers and creates an empty separate TRACE ledger.

All trace contracts explicitly retain:

```text
appendOnly = true
derived = true
projectWriteAuthorized = false
ownerResultWriteAuthorized = false
validationRunWriteAuthorized = false
repairAuthorized = false
scientificDecisionAuthorized = false
privateReasoningStored = false
```

## 4. ScientificRun, events, ledger and digests

| Contract | Retained technical evidence |
|---|---|
| `ScientificRunBinding@0.1.0` | run ID, exact Project ID/version/digest/snapshot ref, bounded initiator context, start/create timestamps and binding digest |
| `ScientificRun@0.1.0` | start/end, technical status, exact Project binding, event count, first/last event IDs and logical digest |
| `ScientificExecutionTraceEvent@0.1.0` | run/event IDs, continuous sequence, type/time, owner/engine/version, exact Project binding, request/artifact/dependency refs, sources/evidence, hashed gap/unknown/limit/contradiction refs, stale observation, duration, bounded error/diagnostic codes and previous-event link |
| Trace ledger | append, event lookup, run lookup, ordered listing, rehydration, digest verification, exact Project query, OwnerResult query and ValidationRun query |

The generic event set is limited to run, owner invocation, handoff, persistence, stale rejection and validation lifecycle events. No engine-specific or fixture-specific event type was introduced.

`eventDigest` protects the stored event, including identity, sequence, timestamps and duration. `logicalDigest` excludes event/run identity, sequence, timestamps, duration and previous-event identity so two runs with the same observable technical behavior can be compared. The finalized run digest covers its exact Project binding, terminal status and ordered logical event digests. Rehydration fails closed on shape, sequence, binding, chain or digest tampering.

## 5. Instrumentation

| Stage | Instrumented | Request ref | Result ref | Dependencies | Duration | Errors | Stale |
|---|---|---|---|---|---|---|---|
| Project context / run binding | yes | n/a | snapshot ref | exact Project tuple | timestamps | binding rejection | n/a |
| Project → Knowledge | yes | digest/version | OwnerResult + ledger entry | snapshot | yes | bounded | Project mismatch/current guard |
| Knowledge → Scientific Thinking | yes | digest/version | OwnerResult + ledger entry | exact Knowledge result | yes | bounded | handoff and readback |
| Scientific Thinking → Imaging | yes | digest/version | OwnerResult + ledger entry | exact Knowledge + ST results | yes | bounded | handoff and readback |
| Scientific loop → VAL | yes | validation input refs | separate ValidationRun + ledger entry | exact K/ST/Imaging chain | yes | bounded | adapter/validation rejection |
| Project → REG | yes, only on explicit call | digest/version | OwnerResult + ledger entry | snapshot + caller request | yes | bounded | Project mismatch/current guard |
| OwnerResult persistence | yes | entry refs | entry digest | retained owner dependencies | included in invocation | persistence code | guard unchanged |
| ValidationRun persistence | yes | validation refs | entry digest | retained chain | included in validation | persistence code | guard unchanged |

Tracing is optional. With identical inputs, TRACE ON and TRACE OFF produced byte-equivalent Knowledge, Scientific Thinking and Imaging OwnerResults, the same native result digests, and the same ValidationRun semantic payload/digest.

## 6. Chronological reconstruction

The nominal deterministic corridor fixture produced one finalized 22-event run:

```text
RUN scientific-run:nominal-traced
01 RUN_STARTED / PROJECT_CONTEXT
02-06 Project → KNOWLEDGE: handoff start/accept, invocation start/complete, result persisted
07-11 KNOWLEDGE → SCIENTIFIC_THINKING: handoff start/accept, invocation start/complete, result persisted
12-16 SCIENTIFIC_THINKING → IMAGING: handoff start/accept, invocation start/complete, result persisted
17-21 scientific loop → VAL: handoff start/accept, validation start/complete, ValidationRun persisted
22 RUN_COMPLETED
```

Every event retains the same canonical Project ID/version/digest and exact snapshot ref. OwnerResults and the distinct ValidationRun are addressable from the trace. No chain-of-thought or reconstructed scientific narrative is stored.

## 7. Stale and error observability

Fail-closed guards remain owner-owned. TRACE observes their outcome and records expected/received Project and dependency refs; it never converts, recalculates or accepts a stale result.

Deterministic evidence covers Knowledge→ST stale dependency, ST→Imaging stale dependency, Project ID/version/digest mismatch, owner runtime failure without fabricated output, and append/finalization/persistence integrity. Errors retain bounded category/code and diagnostic stage, not raw exception text or stack traces.

## 8. First observable divergent stage

`locateFirstObservableDivergence` returns the first recorded rejection/failure/stale event and explicitly sets `inferenceBeyondObservedStage = false`. The comparator identifies the first unequal observable event without inferring an unobserved upstream cause.

All minimum taxonomy stages have deterministic fixtures:

```text
PROJECT_CONTEXT
OWNER_REQUEST_BUILDING
KNOWLEDGE_ENGINE
KNOWLEDGE_TO_ST_HANDOFF
SCIENTIFIC_THINKING_ENGINE
ST_TO_IMAGING_HANDOFF
IMAGING_ENGINE
VAL_INPUT_ADAPTER
VAL_ENGINE
REG_REQUEST_BUILDING
REG_ENGINE
OWNER_RESULT_PERSISTENCE
STALE_VALIDATION
UNKNOWN_STAGE
```

`FIRST_DIVERGENT_STAGE_DIAGNOSTIC_READINESS = YES`

This is technical attribution readiness, not proof that all scientific defects are observable or correctly diagnosed.

## 9. Replay readiness and comparator

| Replay mode | Before W1-TRACE | After W1-TRACE | Execution | Missing components |
|---|---|---|---|---|
| Full Project→K→ST→Imaging→VAL | `NOT_AVAILABLE` | `REPLAY_PLANNABLE` | plan-only | cross-owner executor and artifact loader |
| Knowledge only | `PARTIALLY_AVAILABLE` | `REPLAY_PLANNABLE` | native call exists; TRACE plan-only | dedicated replay command and execution comparator harness |
| Frozen KnowledgeResult → ST | `PARTIALLY_AVAILABLE` | `REPLAY_PLANNABLE` | plan-only | execution coordinator/artifact loader |
| Frozen STResult → Imaging | `PARTIALLY_AVAILABLE` | `REPLAY_PLANNABLE` | plan-only | execution coordinator/artifact loader |
| Frozen chain → VAL | `AVAILABLE_NOW` | `AVAILABLE_NOW_TRACE_CORRELATED` | existing VAL replayable input | full-run executor |
| Frozen Project snapshot/request → REG | `PARTIALLY_AVAILABLE` | `REPLAY_PLANNABLE` | plan-only | dedicated replay executor |
| Replay from event N | `NOT_AVAILABLE` | `REPLAY_PLANNABLE` | plan-only | replay executor and state/artifact loader |

`REPLAY_FROM_EVENT_N = PLANNABLE`

`buildReplayPlan` returns reusable/recomputed event IDs and required request/OwnerResult/ValidationRun refs with `executionAuthorized = false`. It does not execute an owner. `compareScientificRuns` compares only logical event structure, request/result/dependency digests and statuses; `scientificJudgmentPerformed = false`.

## 10. REG and VAL boundaries

REG instrumentation is conditional. A run without REG events is valid and TRACE makes no `REG_NOT_REQUIRED` inference. An explicit REG-only corridor is observable. TRACE does not modify REG-000, claim corpus completeness, give legal advice or invent approval.

VAL remains observer-only. Its result and separate ledger entry are referenced, never copied into or replaced by TRACE. TRACE does not repair a finding, modify an OwnerResult, choose science or promote `STRUCTURAL_FIDELITY_PASS` to `SCIENTIFIC_PASS` or PD-011 qualification.

## 11. Privacy and minimization

Requests, results, dependencies, sources and evidence are retained as bounded IDs/versions/digests and counts. Gap, unknown, limitation and contradiction strings are converted to bounded digest refs. Technical metadata is allowlisted. Recursive extraction is depth- and count-bounded.

The ledger rejects recognizable credential material, raw prompt/transcript/private-reasoning/patient fields, multiline or unbounded text, and private chain-of-thought fields. It stores no raw exception message or stack. These deterministic guards are minimization controls, not a complete privacy certification.

## 12. Tests and non-regression

| Gate | Exact result |
|---|---|
| W1-TRACE unit + corridor | 2 files, 65 passed, 0 failed |
| W0/W1/SPINE/VAL architecture including TRACE | 13 files, 359 passed, 0 failed |
| Native Knowledge/ST/REG/VAL suites | 20 files: 19 passed, 1 skipped; 498 passed, 7 skipped, 0 failed |
| TypeScript application typecheck | `PASS` |
| Targeted ESLint | `PASS`, 0 findings |
| Production build and ESM runtime checks | `PASS` |
| `git diff --check` | `PASS` |
| New-file credential scan | `PASS`; no credential/private key literal retained |

No Gemini, Terra/OpenAI, other LLM, PubMed, External Evidence, browser, network or external regulatory research was invoked.

Historical suites are not globally green and are not represented as such:

- IMG: 8/9 files passed; 56 passed, 4 failed — exact pre-existing IMG-001B freeze-state debt;
- PRJ: 7/8 files passed; 72 passed, 1 failed — exact downstream IMG-001B fixture debt;
- SYS: 8/11 files passed; 31 passed, 3 failed — exact historical ST version, DOC decision-propagation and Imaging freeze expectations.

`PREEXISTING_HISTORICAL_FIXTURE_DEBT` remains open and unchanged: 8 known failures. TRACE did not mask or repair it.

## 13. Acceptance, limitations and decisions

```text
PROJECT_WRITES_FROM_TRACE = 0
OWNER_RESULT_MUTATIONS_FROM_TRACE = 0
VALIDATION_RESULT_MUTATIONS_FROM_TRACE = 0
SCIENTIFIC_OUTPUT_DIFFERENCE_TRACE_ON_OFF = 0
LLM_CALLS = 0
```

The following expected gaps remain explicit: OBS runtime, autonomous Study Design runtime, Biostatistics calculation, realized-time DM, owner orchestration, full QRY value-of-information, automatic External Evidence and Decision Bundle UI. No gap was filled by TRACE.

```text
W1_ARCHITECTURAL_CONVERGENCE_READY = YES
W1_OBSERVABILITY_READY = YES
W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO
W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO
WAVE_1_COMPLETE = NO
WAVE_2_AUTHORIZED = NO
```

Architectural convergence and passive technical reconstruction are demonstrated. Individual scientific performance/failure-mode characterization and controlled loop characterization are not. No scientific performance, corpus completeness, regulatory completeness, clinical validity, production readiness or PD-011 qualification is claimed.

## 14. Files and roadmap transition

Created:

- `src/features/protocol-designer/scientific-execution-trace.ts`;
- `src/features/protocol-designer/functional-reset/__tests__/w1-trace-01-scientific-execution-trace.test.ts`;
- `src/features/protocol-designer/functional-reset/__tests__/w1-trace-01-product-corridors.test.ts`;
- this report;
- `validation/w1-trace-01/trace-implementation-manifest.json`.

Modified:

- five existing owner/VAL product entrypoints to accept an optional passive recorder;
- `functional-reset/session.ts` and the affected session-version expectation;
- `docs/implementation/NOXIA-ENGINE-INTEGRATION-ROADMAP.md`.

The roadmap keeps Wave 1 active, closes only `SCIENTIFIC_EXECUTION_TRACE_GAP`, records observability and first-divergent-stage readiness `YES`, preserves both characterization blockers, keeps Wave 1 complete `NO` and authorizes next:

`NEXT_AUTHORIZED_MISSION = W1-QUAL-01_INDIVIDUAL_OWNER_CHARACTERIZATION`

Wave 2 remains unauthorized.
