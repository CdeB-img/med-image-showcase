# NOXIA — RC-TEST-02 Governed Imaging Fixture Reconstruction and Re-freeze

> Classification: `LEVEL_3_IMPLEMENTATION_EVIDENCE`
>
> `NORMATIVE_AUTHORITY = NONE`
>
> Date: 2026-08-28

## Decision

```text
RC_TEST_02_GOVERNED_IMAGING_FIXTURES_REPAIRED

RC_TEST_02_FAILURES_BEFORE = 11
RC_TEST_02_FAILURES_AFTER = 0
RC_TEST_02_TARGETED_FAILURES = 0
UNRESOLVED_CONTRADICTION_STILL_BLOCKS_FREEZE = YES
NEW_HUMAN_SCIENTIFIC_DECISIONS_INVENTED = 0
SCIENTIFIC_OWNER_CODE_CHANGED = NO
FIXTURE_PROVENANCE_COMPLETE_OR_EXPLICITLY_UNKNOWN = YES
NEW_UNEXPECTED_CANONICAL_FAILURES = 0
CANONICAL_TYPECHECK = PASS

SCIENTIFIC_PASS = NO
PD011_PASS = NO
WAVE_2_AUTHORIZED = NO
```

The repair replaces a mutable live scientific assembly used as if it were a historical frozen reference. Downstream tests now consume immutable, human-approved and scope-bounded test references. The actual Knowledge → Scientific Thinking → Imaging contradiction path remains a live, deterministic negative control and still fails closed.

## Queue precondition

RC-TEST-01 ended with the required decision:

```text
RC_TEST_01_EDITORIAL_WORKTREE_DEPENDENCY_REPAIRED
RC_TEST_01_HEAD = 0852fb2f0b49d9132851559ce5591b89664dd35b
```

The commit modified nine bounded test/reporting files only. It did not modify Knowledge, Scientific Thinking, Imaging, Project, the former RC-TEST-02 fixture, the scientific corpus, the protected historical artifacts, `.git/info/exclude`, or Editorial Engine source.

The last full canonical measurement associated with the initial RC-TEST-01 repair was:

```text
RC_TEST_01_CANONICAL_FAILURE_COUNT = 21
RC_TEST_01_CANONICAL_PASS_COUNT = 3225
RC_TEST_01_CANONICAL_SKIP_COUNT = 12
RC_TEST_01_CANONICAL_TOTAL_COUNT = 3258
```

A subsequent bounded RC-TEST-01 false-positive correction and RC-TEST-07 discovery repair changed the canonical harness/discovery state without a new full-suite measurement at that intermediate point. The present report therefore does not claim a simple arithmetic before/after comparison across different discovery graphs; it reports the current post-repair suite independently.

## Git baseline

```text
branch = protocol-designer-canonical-ingestion
HEAD_before_repair = 0852fb2f0b49d9132851559ce5591b89664dd35b
origin/main = f504d8fc658ebdf17757e589f610e8f56c24e335
tracked_diff_before_repair = clean
```

Two Level 3 pre-repair documents were present untracked and were preserved: the human reference validation packet and the human-decision/Fabry validation addendum. The protected historical artifacts and `.git/info/exclude` were not changed.

## RC-TEST-02 failure reproduction

Before the human gate, the smallest focused command over the seven affected files reproduced exactly the reported RC-TEST-02 group:

```text
test_files = 7 failed / 0 passed / 7 total
tests = 11 failed / 68 passed / 79 total
RC_TEST_02_FAILURES_BEFORE = 11
```

Failures: F04, F05, F06, F09, F10, F11, F12, F15, F18, F19 and F20.

The exact exception for the indirect consumers was:

```text
IMG_001B_LIVE_HANDOFF_NOT_FROZEN
```

## Historical fixture architecture

The former helper named `makeFrozenImagingResult()` was not frozen. Every read rebuilt a mutable current-owner chain:

```text
makeFrozenImagingResult()
→ makeImagingInput()
→ current Knowledge runtime
→ current Scientific Thinking runtime
→ current Imaging runtime
→ automatic answers and test-authored gate approvals
→ expected FROZEN_BY_HUMAN
```

This made downstream Project, DOC, System and conversation tests depend on current upstream scientific output even when their intended invariant was only a downstream handoff/projection contract.

## First divergent stage

```text
FIRST_DIVERGENT_STAGE = IMAGING_TEST_INPUT_ASSEMBLY
OWNER_OF_DEFECT = TEST_HARNESS
SCIENTIFIC_OWNER_DEFECT = NO
```

Knowledge correctly preserved the admitted contextual difference about synthetic-haematocrit transferability. Scientific Thinking correctly preserved it in its contradiction channel. `buildImagingDesignInput()` correctly transmitted it. Imaging correctly added `UNRESOLVED_STRUCTURAL_CONTRADICTION` to the freeze blockers and returned `NOT_READY`.

## Contradiction provenance

Exact contradiction retained by the live negative reference:

```text
noxia:radiology:contradiction:ecv-t1:synthetic-hematocrit-transferability:p4r:CONTEXTUAL_DIFFERENCE:The findings should not be collapsed into one universal conclusion. They differ materially in field strength, local model and validation context.
```

The contradiction is not resolved, filtered, downgraded or copied into any positive reference. The positive references explicitly state that the negative contradiction remains separate.

## Why current Imaging behavior is correct

An unresolved structural contradiction cannot become compatible with `FROZEN_BY_HUMAN` through a test helper. Imaging's current fail-closed rule is therefore preserved. The defect was the historical helper's false ownership boundary: a mutable live multi-owner execution was presented as a frozen Imaging result for downstream consumers.

No change was made to Knowledge, Scientific Thinking, Imaging, Project, DOC, QRY, conversation runtime, scientific corpus or any authority.

## Test-by-test semantic requirements

| Failure | Actual invariant | Frozen Imaging required | Correct reference/boundary | Semantic scope preserved |
|---|---|---:|---|---|
| F04 | TMP/DOC structures Imaging blocks | yes | REF-01 | bounded MR-ECV/histology contribution only |
| F05 | DOC keeps incomplete Imaging non-executable | yes | REF-01 | unknown equipment and no executable protocol |
| F06 | DOC projects Imaging without inventing acquisition | yes | REF-01 | conceptual acquisition only |
| F09 | Project accepts conceptual handoff with unknown equipment | live Imaging test | governed REF-01 input | unknown stays unknown |
| F10 | multicentre partial equipment remains partial | live Imaging test | governed REF-02 input | synthetic Centre A, unknown Centre B, review required |
| F11 | exact acquisition parameters are refused | live Imaging test | governed REF-01 input | no TR/TE or manufacturer parameters invented |
| F12 | frozen version survives until an explicit change is confirmed | live Imaging test | governed REF-01 input | change/requalification semantics unchanged |
| F15 | Fabry longitudinal Project path | yes | REF-03 | confirmed Fabry, bounded MR-ECV, no predetermined change |
| F18 | Project HumanDecision identity reaches DOC | no | direct governed Project → DOC boundary | no unrelated Imaging claim |
| F19 | UNKNOWN equipment survives Project/DOC projection | yes | REF-01 | UNKNOWN ≠ incompatible ≠ ready |
| F20 | conversation answer refreshes Project and QRY | no | Imaging `REQUIRED_BUT_NOT_READY` | no fabricated frozen payload |

## Existing governed reference inventory

No reusable tracked frozen Imaging OwnerResult with a compatible scientific scope existed before RC-TEST-02. The human validation packet therefore stopped the repair before any positive fixture was created.

Human decisions subsequently received:

```text
REF_01_DECISION = APPROVE_WITH_CORRECTIONS
REF_02_DECISION = APPROVE_HYPOTHETICAL_CASE_WITHOUT_REAL_SITE_CLAIM
REF_03_HUMAN_VALIDATION = APPROVED_AFTER_CORRECTION
F18_BOUNDARY_CHANGE_AUTHORIZED = YES
F20_BOUNDARY_CHANGE_AUTHORIZED = YES
RC_TEST_02_FIXTURE_REPAIR = AUTHORIZED_TO_RESUME
```

## Reference selection

### REF-01

`RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY`

- exact transplant-histology validation context only;
- MR-derived myocardial ECV is a bounded measurement candidate associated with histologic extracellular space;
- “fibrose myocardique diffuse candidate” removed;
- no universal or clinically validated `BiomarkerRole`;
- small selected subset of six explanted hearts remains a limitation;
- equipment, field strength, manufacturer, model, software, exact timing and executable acquisition remain unknown;
- handoff is conceptual and non-executable.

### REF-02

`RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT`

- immutable variant of REF-01, not a mutation;
- Centre A is an explicitly synthetic governed test entity with known availability;
- any structurally required manufacturer/model/software strings are `SYNTHETIC_TEST_VALUE`;
- Centre B remains unknown;
- `MULTICENTER_HARMONIZATION_REVIEW` and `EQUIPMENT_COMPATIBILITY_REVIEW` remain required;
- no real-site, commercial-compatibility or harmonization-success claim.

### REF-03

`RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV`

- admitted scientific basis: PD-002 Fabry Reasoning Book v1.0;
- confirmed Fabry disease and myocardial extracellular expansion only;
- MR-derived myocardial ECV remains a bounded research measurement candidate;
- defined baseline/follow-up question without predetermined direction or magnitude;
- ECV is not collagen percentage and not a universal Fabry `BiomarkerRole`;
- global and regional ECV remain distinct;
- early diffuse Fabry fibrosis and longitudinal regional ECV remain incompletely characterized;
- no universal clinically important change threshold, treatment-effect, prognostic or clinical-decision claim;
- exact equipment, sequence, reconstruction, analysis, timing and local-reference conditions remain unknown;
- `interpretationBelowRepeatability = NOT_INTERPRETABLE_AS_PROGRESS_OR_REGRESSION`;
- `syntheticHaematocrit = NOT_AUTHORIZED_BY_THIS_REFERENCE`;
- `executableProtocolReadiness = NOT_READY` at the scientific reference level and `EXECUTABLE_PROTOCOL_NOT_READY` in the Imaging contract projection.

The existing Fabry candidate package remains `CANDIDATE_NOT_ACTIVATED`, `HUMAN_REVIEW_REQUIRED`, with zero runtime imports. It was not activated or promoted.

## Human-validation assessment

All positive references required and received explicit human scientific validation. Codex introduced no new scientific adoption. The decision identity is stored in a `HumanDecisionEnvelope`, and each result retains the human-decision record in its Project handoff.

The human approval is limited to RC-TEST-02 governed reference/harness work. It does not constitute scientific performance evidence, clinical validation, general ECV validation, equipment compatibility, executable protocol approval, PD-011 qualification or Wave 2 authorization.

## Fixture ownership boundary

Downstream consumers now use:

```text
tracked governed semantic specification
→ deterministic contract-shaped immutable ImagingDesignResult
→ downstream Project/DOC/System test
```

They no longer invoke Knowledge, Scientific Thinking or Imaging at fixture read time.

Imaging owner tests use a separately named and explicit live boundary:

```text
tracked governed ImagingDesignInput
→ current deterministic Imaging owner
→ explicit UNKNOWN answers and human gate records
→ handoff assertions
```

The live negative control retains the original current Knowledge → Scientific Thinking → Imaging path. Frozen and live semantics are therefore separated rather than blurred.

## Fixture provenance

All three references record:

```text
FIXTURE_SCHEMA_VERSION = 1.0.0
SOURCE_OWNER = IMAGING
SOURCE_OWNER_VERSION = 1.2.1
SOURCE_COMMIT = 0852fb2f0b49d9132851559ce5591b89664dd35b
PROJECT_VERSION = RC-TEST-02-PROJECT-REFERENCE@1.0.0
ST_VERSION = UNKNOWN_NOT_RUNTIME_BOUND
IMAGING_VERSION = 1.2.1
HUMAN_DECISION_PROVENANCE = HUMAN_APPROVED_RC_TEST_02_REFERENCE_DECISION_2026_08_28
CONTRADICTION_STATUS = NONE_IN_POSITIVE_REFERENCE_NEGATIVE_REFERENCE_PRESERVED_SEPARATELY
CREATED_FROM = HUMAN_APPROVED_GOVERNED_REFERENCE_SPECIFICATION
SUPERSEDES = IMG_001B_LIVE_HANDOFF_FIXTURE_FOR_DOWNSTREAM_CONSUMERS
```

Each reference additionally stores its own `FIXTURE_ID`, scientific scope, source result ID, knowledge version, human decision ID, limitations and deterministic digest in `RC_TEST_02_GOVERNED_REFERENCE_REGISTRY`. Unknown provenance is recorded as `UNKNOWN_NOT_RUNTIME_BOUND`; no unavailable ST version is invented.

| Fixture | Digest | Source result ID |
|---|---|---|
| REF-01 | `ke1-ff3ad5e4252a0518` | `imaging-design-result:RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY:v1.0.0` |
| REF-02 | `ke1-3fc9eb9871885094` | `imaging-design-result:RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT:v1.0.0` |
| REF-03 | `ke1-ea4d5492e892a666` | `imaging-design-result:RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV:v1.0.0` |

Repeated readback proved:

- equal semantic content;
- distinct returned object identity;
- deep immutability;
- stable metadata digest;
- stable result identity;
- stable owner version;
- stable HumanDecision identity;
- conceptual frozen handoff with executable protocol still not ready.

## Negative fail-closed control

The focused Imaging suite now includes an explicitly named `LIVE` test. It invokes the current local Knowledge and Scientific Thinking chain, confirms the exact synthetic-haematocrit contradiction in `ImagingDesignInput`, approves all other deterministic gates, and verifies:

```text
contradiction preserved = YES
projectConstructionHandoff.status = NOT_READY
blockedBy contains UNRESOLVED_STRUCTURAL_CONTRADICTION
humanDecision.status = PENDING
```

The positive-reference tests also verify:

- a legitimate frozen reference is consumable downstream;
- unknown equipment remains unknown and no equipment is invented;
- executable acquisition parameters remain absent;
- downstream Project/DOC use does not mutate the upstream frozen reference;
- repeated readback has stable identity and digest.

## Files changed

Test/reference boundary only:

- `src/features/imaging-study-designer/__tests__/governed-reference-fixtures.ts` — immutable REF-01/02/03 registry, inputs, OwnerResult-shaped fixtures and digest verification;
- `src/features/imaging-study-designer/__tests__/img-001b-project-handoff.test.ts` — governed live inputs, synthetic multicentre context, negative contradiction control and stable readback;
- `src/features/research-project-construction/__tests__/fixtures.ts` — downstream static reference read instead of live multi-owner regeneration;
- `src/features/research-project-construction/__tests__/mandatory-cases.test.ts` — F15 bound explicitly to REF-03;
- `src/features/document-projection/__tests__/fixtures.ts` — DOC Imaging scenario bound to REF-01's exact scope;
- `src/features/system-integration/__tests__/human-decisions.test.ts` — F18 direct Project → DOC contract;
- `src/features/system-integration/__tests__/unknowns.test.ts` — F19 REF-01 and no-mutation proof;
- `src/features/protocol-designer/conversation/__tests__/conv-ux-v2-part1.test.tsx` — F20 honest Imaging `REQUIRED_BUT_NOT_READY` boundary;
- `docs/implementation/rc-test-02-human-reference-validation-packet.md` — preserved historical pre-decision packet;
- `docs/implementation/rc-test-02-human-decisions-and-fabry-reference-validation.md` — human decisions and final REF-03 correction;
- this report.

No runtime or corpus file changed.

## Targeted validation

Final affected-suite command covered the seven RC-TEST-02 files:

```text
test_files = 7 passed / 7 total
tests = 81 passed / 81 total
RC_TEST_02_TARGETED_FAILURES = 0
```

Targeted lint over the eight changed TypeScript/test files:

```text
exit = 0
errors = 0
warnings = 0
```

The canonical TypeScript gate was run exactly once:

```text
command = npm run typecheck
exit = 0
CANONICAL_TYPECHECK = PASS
APP_MODULE_RESOLUTION = BUNDLER
VERCEL_API_MODULE_RESOLUTION = NODENEXT
RUNTIME_ALIAS_COUNT = 0
EXTENSIONLESS_RELATIVE_IMPORT_COUNT = 0
NODE_ESM_HANDLER_LOAD = PASS
```

## Canonical validation

The canonical Vitest suite was run exactly once after targeted success:

```text
command = npm test -- --reporter=json --outputFile=/private/tmp/noxia-rc-test-02-canonical.json
exit = 1

test files = 8 failed / 177 passed / 2 skipped / 187 total
tests = 9 failed / 3243 passed / 12 skipped / 3264 total

RC_TEST_02_FAILURES_REMAINING = 0
NEW_UNEXPECTED_FAILURES = 0
```

The global suite is not fully green. All nine remaining failures exactly match the registered non-RC-TEST-02 groups.

## Remaining root causes

| Root cause | Current failures | Existing scope |
|---|---:|---|
| RC-TEST-03 | 3 | Knowledge applicability/external-search stale expectations |
| RC-TEST-04 | 1 | Imaging matcher conflates dependency references with created sequence |
| RC-TEST-05 | 2 | stale owner version expectations |
| RC-TEST-06 | 1 | stale presentation placeholder expectation |
| RC-TEST-08 | 1 | stale ST alternative subtype expectation |
| RC-TEST-09 | 1 | historical ST runtime hash readback |

```text
KNOWN_REMAINING_ROOT_CAUSES = RC-TEST-03, RC-TEST-04, RC-TEST-05, RC-TEST-06, RC-TEST-08, RC-TEST-09
NEW_UNEXPECTED_CANONICAL_FAILURES = 0
```

RC-TEST-01, RC-TEST-02 and RC-TEST-07 are not represented among the remaining failures.

## Separate debts preserved

- `STRICT_NODE_GRAPH_NULLABILITY_MISMATCH` remains a separate non-canonical diagnostic debt and was not changed.
- The synthetic-haematocrit contradiction remains unresolved and covered.
- Exact equipment, acquisition, timing and local-reference information remain unknown.
- The Fabry candidate package remains inactive and human-review-required.
- The canonical suite remains red on nine classified historical/test-contract failures; no global green claim is made.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
EXTERNAL_SCIENTIFIC_SEARCH = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
BROAD_PRODUCT_REPLAY = 0
CANONICAL_FULL_TEST_RUNS = 1
```

PD-002 and other admitted repository-local material were read locally. No external source was queried.

## Git

```text
COMMIT_POLICY = ONE_BOUNDED_LOCAL_COMMIT
PUSH = NO
DEPLOYMENT = NO
MERGE = NO
```

The final local commit and clean status are recorded after commit in the mission output. The 53 protected historical artifacts remain physically preserved and excluded locally; `.git/info/exclude` is unchanged.

## Limitations

This repair proves reference immutability, provenance, handoff compatibility, fail-closed contradiction preservation and bounded downstream test reproducibility. It does not prove scientific performance of Knowledge, Scientific Thinking or Imaging, does not validate ECV clinically, does not qualify any executable protocol, and does not authorize Wave 2.
