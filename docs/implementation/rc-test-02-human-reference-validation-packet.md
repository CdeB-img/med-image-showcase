# NOXIA — RC-TEST-02 Human Imaging Reference Validation Packet

> Classification: `LEVEL_3_IMPLEMENTATION_EVIDENCE`
>
> `NORMATIVE_AUTHORITY = NONE`
>
> `HUMAN_DECISION_REQUIRED = YES`
>
> Date: 2026-08-28

## Decision

```text
DECISION = RC_TEST_02_REQUIRES_HUMAN_REFERENCE_VALIDATION

RC_TEST_02_FAILURES_BEFORE = 11
RC_TEST_02_FAILURES_AFTER = NOT_RUN_HUMAN_GATE_TRIGGERED
RC_TEST_02_TARGETED_FAILURES = NOT_RUN_AFTER_HUMAN_GATE

NEW_HUMAN_SCIENTIFIC_DECISIONS_INVENTED = 0
SCIENTIFIC_OWNER_CODE_CHANGED = NO
TEST_OR_FIXTURE_REPAIR_APPLIED = NO
```

At least one required frozen Imaging reference needs scientific choices that are not already adopted in a traceable reference. In particular, the current tests would require adoption of a scientific question, a biomarker or measurement role, a conceptual acquisition strategy and a Project handoff. Existing helpers simulate those decisions; they do not prove human scientific validation of the reference content.

No frozen replacement, test expectation change or product repair is authorized by this packet.

## Queue precondition

```text
BRANCH = protocol-designer-canonical-ingestion
RC_TEST_01_HEAD = 0852fb2f0b49d9132851559ce5591b89664dd35b
RC_TEST_01_DECISION = RC_TEST_01_EDITORIAL_WORKTREE_DEPENDENCY_REPAIRED
ORIGIN_MAIN = f504d8fc658ebdf17757e589f610e8f56c24e335
WORKTREE_BEFORE_RC_TEST_02 = CLEAN
```

RC-TEST-01 changed nine bounded integration-test/reporting files. It changed no Knowledge, Scientific Thinking, Imaging, Project, RC-TEST-02 fixture, protected historical artifact, `.git/info/exclude`, or Editorial Engine source.

The only canonical run made during RC-TEST-01 measured:

```text
RC_TEST_01_CANONICAL_FAILURE_COUNT_MEASURED = 21
RC_TEST_01_CANONICAL_PASS_COUNT_MEASURED = 3225
RC_TEST_01_CANONICAL_SKIP_COUNT_MEASURED = 12
RC_TEST_01_CANONICAL_TOTAL_COUNT_MEASURED = 3258
```

One of the 21 failures was an RC-TEST-01 fixture-string false positive introduced during that mission and then corrected with a targeted 13/13 validation. Because the mission prohibited a second canonical run, the exact post-final global count was not measured. The root-cause register therefore supports 20 known remaining failures, but `20` is not presented here as a measured canonical result.

## Authorities consulted

The authorities were read in the required order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `NOXIA — Charte fondatrice`;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2`;
4. `Editorial Engine — Architecture Manifesto`.

Specialized authorities consulted:

- PD-003 V2 Research Object Model and Ownership Matrix;
- KE-001;
- RDE-001;
- RDE-002;
- RDE-003;
- PD-009 contradiction and human-decision contract;
- PD-011 reference-validity and expert-reference contract.

Level 3 evidence consulted:

- `docs/implementation/technical-debt-false-green-audit.md`;
- `docs/implementation/canonical-test-failure-root-cause-triage.md`.

No documentary or normative contradiction was found. The authorities consistently require contradiction preservation, explicit human adoption, immutable versions, exact provenance and refusal to translate a technical PASS into scientific validity.

## Failure reproduction

The smallest affected command reproduced the exact registered family:

```text
TEST_FILES = 7
TESTS_TOTAL = 79
TESTS_PASSED = 68
TESTS_FAILED = 11

FAILED_IDS = F04,F05,F06,F09,F10,F11,F12,F15,F18,F19,F20
```

The failures remained distributed as follows:

| Surface | Failed tests |
| --- | ---: |
| DOC | 3 |
| Imaging | 4 |
| Project | 1 |
| System integration | 2 |
| Conversation | 1 |

## Historical fixture architecture

Current chain:

```text
makeFrozenImagingResult()
→ makeImagingInput()
→ Knowledge 1.2.1
→ Scientific Thinking 1.2.2
→ ImagingDesignInput 1.2.1
→ Imaging 1.2.1
→ decideImagingGate() test calls
→ ProjectConstructionHandoff NOT_READY
→ IMG_001B_LIVE_HANDOFF_NOT_FROZEN or stale status assertion
```

Observed identities from deterministic local readback:

| Stage | Owner | Version | Input / output reference | Contradiction | Freeze state |
| --- | --- | --- | --- | --- | --- |
| Knowledge | Knowledge | 1.2.1 runtime | `knowledge-result:ke1-24056ed3bb777537` | synthetic-haematocrit transferability positions remain contextual and unresolved | not a Project freeze |
| Scientific Thinking | Scientific Thinking | 1.2.2 | request `scientific-thinking-request:ke1-0abe7cb47cbc4808` | preserved in the authorized handoff | scientific candidates selected by a test helper, not an external reference validation |
| Imaging input | Imaging input projection | 1.2.1 | `imaging-design-input:ke1-1c6bed3880d124fc` | exact contradiction string retained | not frozen |
| Imaging result | Imaging | 1.2.1 | `imaging-design-result:ke1-5dd4d82305817417` | retained in result and Project handoff | `NOT_READY` |
| Project handoff | Imaging → Project | 1.2 | result ref above | `UNRESOLVED_STRUCTURAL_CONTRADICTION` | `PROJECT_HANDOFF_BLOCKED` |

Exact contradiction transported to Imaging:

```text
noxia:radiology:contradiction:ecv-t1:synthetic-hematocrit-transferability:p4r:
CONTEXTUAL_DIFFERENCE:
The findings should not be collapsed into one universal conclusion. They differ
materially in field strength, local model and validation context.
```

Other limitations remain visible, including declared-but-unverified equipment, no technical compatibility confirmation and no executable acquisition authorization.

## First divergent stage

```text
FIRST_DIVERGENT_STAGE = IMAGING_TEST_INPUT_ASSEMBLY
```

Knowledge and Scientific Thinking correctly preserve the documented positions. `buildImagingDesignInput()` correctly carries the ST contradiction channel into `ImagingDesignInput.contradictions`. Imaging correctly turns a non-empty unresolved contradiction channel into `UNRESOLVED_STRUCTURAL_CONTRADICTION` and refuses the freeze.

The obsolete behavior is the helper's claim that it can always manufacture a frozen historical result by approving all visible gates. The freeze gate is correctly inoperative while the structural blocker remains.

## Negative fail-closed control

Current execution proves:

```text
unresolved Knowledge contradiction
→ ST contradiction preserved
→ ImagingDesignInput contradiction preserved
→ UNRESOLVED_STRUCTURAL_CONTRADICTION
→ ProjectConstructionHandoff NOT_READY
→ not FROZEN_BY_HUMAN
```

No tracked test asserts this exact entire chain with the explicit blocker code. Several tracked tests assert contradiction preservation at Knowledge, ST and VAL boundaries, but none is a complete substitute for this Imaging-freeze negative control.

If a human-approved reference later permits the fixture repair, the repair mission must add a narrow deterministic regression for this exact behavior before consuming the new frozen reference. It must not modify the existing owner logic.

## Test-by-test semantic requirements

| ID | Actual invariant | Frozen Imaging required | Scientific scope | Equipment / multicenter / unknown state | Decision |
| --- | --- | --- | --- | --- | --- |
| F04 | TMP-derived DOC Imaging blocks are present | YES for current Project/DOC contract | compatible Imaging contribution | executable protocol remains not ready | C |
| F05 | incomplete Imaging stays partially generatable without invented protocol | YES | compatible Imaging contribution | exact parameters unknown | C |
| F06 | DOC projects Imaging without fabricating acquisition protocol | YES | compatible Imaging contribution | exact parameters unknown | C |
| F09 | conceptual handoff remains possible while local equipment is unknown | YES | defensible Imaging chain | equipment `UNKNOWN`; no compatibility promotion | C |
| F10 | multicentre partial technical knowledge remains visible | YES | same base chain as F09 | one stipulated known site, one unknown site; harmonization review pending | C |
| F11 | exact parameters are refused while conceptual strategy may be handed off | YES | defensible conceptual strategy | no executable parameters | C |
| F12 | frozen version is preserved, then a material equipment change reopens review | YES | same base chain as F09 | equipment change and version history | C after base reference validation |
| F15 | Project builds a longitudinal Fabry case and retains Imaging graph nodes | YES under current test wording | Fabry + longitudinal ECV + MRI | timing baseline/follow-up; exact equipment unresolved | C; local exact applicability is not established |
| F18 | Project human-decision identity reaches DOC unchanged | NO | no Imaging scientific assertion is intrinsic to the invariant | Imaging can be `NOT_APPLICABLE` in a bounded replacement scenario | D |
| F19 | `UNKNOWN` equipment remains distinct from not applicable/incompatible/ready | YES | defensible Imaging chain | equipment `UNKNOWN`; executable protocol not ready | C |
| F20 | conversation response reaches Project owner and QRY without a second conversation | NO | colchicine/MRI content must remain present, but no frozen Imaging payload is consumed by the assertions | Imaging may honestly remain required-but-not-ready | D |

Legend:

- `C` = `NEW_REFERENCE_REQUIRES_HUMAN_SCIENTIFIC_VALIDATION`;
- `D` = `TEST_DOES_NOT_ACTUALLY_REQUIRE_A_FROZEN_IMAGING_REFERENCE`.

The D classifications are proposed future harness-boundary corrections only. No test was changed in this mission.

## Existing governed reference inventory

### Candidate 1 — current ECV/T1 live helper

```text
REFERENCE_ID = makeFrozenImagingResult
SOURCE_PATH = src/features/research-project-construction/__tests__/fixtures.ts
SOURCE_COMMIT = 52a7548716380d2dd7275b937a852f4f8209692d
OWNER = TEST_HARNESS_CALLING_CURRENT_KNOWLEDGE_ST_IMAGING
OWNER_VERSIONS = Knowledge 1.2.1 / ST 1.2.2 / Imaging 1.2.1
STATUS = NOT_READY
HUMAN_DECISION_PROVENANCE = TEST_HELPER_SIMULATION_ONLY
CONTRADICTION_STATUS = UNRESOLVED_STRUCTURAL_CONTRADICTION
DIGEST = MUTABLE_LIVE_RESULT_NOT_A_FROZEN_REFERENCE
COMPATIBLE_TESTS = negative fail-closed control only
```

Not reusable as a positive frozen reference.

### Candidate 2 — W1 owner-characterization Imaging results

```text
SOURCE_PATH = validation/w1-qual-01/imaging-results.json
SOURCE_COMMIT = 5ceddce6104a87cf128c17ae29629f8677724822
OWNER = IMAGING
OWNER_VERSION = 1.2.1
STATUS = all four native Project handoffs NOT_READY
HUMAN_DECISION_PROVENANCE = none; handoff decision PENDING
CONTRADICTION_STATUS = retained where applicable
LIMITATIONS = bounded W1 characterization; not Project adoption
COMPATIBLE_TESTS = none requiring FROZEN_BY_HUMAN
```

The records are immutable and traceable OwnerResults, but they are not human-frozen Project handoffs.

### Candidate 3 — SYS-001B live helper

```text
REFERENCE_ID = freezeSystemImaging
SOURCE_PATH = src/features/system-integration/__tests__/fixtures.ts
SOURCE_COMMIT = 52a7548716380d2dd7275b937a852f4f8209692d
SCIENTIFIC_SCOPE = CT versus MRI for myocardial fibrosis
OWNER = TEST_HARNESS_CALLING_CURRENT_OWNERS
STATUS = can reach FROZEN_BY_HUMAN in the current runtime
HUMAN_DECISION_PROVENANCE = synthetic test actor and mandate
CONTRADICTION_STATUS = no contradiction in the current narrow runtime projection
DIGEST = no immutable tracked frozen OwnerResult
COMPATIBLE_TESTS = technical precursor only; no positive scientific-reference reuse
```

Current static/deterministic inspection also shows that its Knowledge coverage is `PARTIAL`, with no general CT/MRI comparison and missing biomarker, technique and usage context. Its helper selects one ST question and hypothesis and rejects alternatives automatically under a test identity. That is precisely a scientific decision Codex cannot elevate into a governed reference.

### Candidate 4 — Fabry human-characterized ST evidence

Tracked W1 post-repair evidence contains a human-adjudicated ST case about multiple mechanisms of myocardial wall thickening in Fabry disease. It does not cover longitudinal ECV, does not provide an Imaging OwnerResult and does not adopt an Imaging strategy. Scientific proximity is not semantic compatibility.

```text
STATUS = NOT_REUSABLE_FOR_F15_IMAGING_FREEZE
```

## Human-validation assessment

No category A reference was found. Category B is not available because creating a positive frozen Imaging handoff would require at least one of the following choices:

- adopt a scientific question and objective;
- adopt or reject a candidate biomarker;
- adopt or reject one or more modality branches;
- accept a conceptual acquisition strategy despite bounded evidence;
- decide that remaining unknown equipment/timing information is non-blocking for Project handoff;
- decide whether one scientific reference can legitimately support single-site, multicentre and longitudinal downstream scenarios;
- decide whether the Fabry longitudinal test keeps its scientific scope or is rewritten around locally admitted evidence.

Those choices are not implied by the structural contracts and are not supplied by an already adopted tracked reference.

---

## Reference ID

`RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY`

## Tests that need it

Potential base for F04, F05, F06, F09, F11 and F19. It may also be the immutable baseline used by F12 after a separate change-event variant is defined.

## Scientific purpose of the reference

Provide one narrow, source-bounded, single-modality Imaging strategy whose scientific payload is sufficient to exercise frozen-handoff, unknown-equipment and non-executable-protocol contracts without importing the current synthetic-haematocrit controversy.

## Exact proposed input

```json
{
  "referenceId": "RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY",
  "question": "Dans le sous-ensemble de validation par transplantation cardiaque décrit par la source, une mesure IRM de l'ECV peut-elle être retenue comme stratégie candidate pour approcher l'espace extracellulaire histologique, sans généralisation au-delà de ce contexte ?",
  "population": ["TRANSPLANT_HISTOLOGY_SUBSET"],
  "pathologyOrCondition": ["UNKNOWN"],
  "phenomena": ["espace extracellulaire myocardique", "fibrose myocardique diffuse candidate"],
  "biomarkerCandidates": ["myocardial ECV MR"],
  "modalityCandidates": ["IRM"],
  "equipment": [],
  "equipmentCompatibility": "UNKNOWN",
  "centerMode": "UNKNOWN",
  "timing": ["UNKNOWN_EXPLICITLY_RECORDED"],
  "executableProtocol": "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE",
  "contradictions": [],
  "adoptionStatus": "PENDING_HUMAN_REFERENCE_VALIDATION"
}
```

The input is a proposal, not a fixture. The phrase “fibrose myocardique diffuse candidate” must be corrected or removed by the human if it exceeds the exact source scope.

## Existing governed evidence

- assertion: `noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology`;
- source: `noxia:radiology:source:pubmed:23553570:revision:2`;
- locator: `PubMed > Abstract > Methods` plus the associated Results/Conclusions evidence link in the admitted corpus;
- source scope: whole-heart transplant validation subset;
- explicit limitation in the admitted corpus: histologic validation involved six explanted hearts and cannot support broad generalization;
- RB-004 v1.1 as documentary context, not as an automatic scientific adoption.

## Knowledge assertions used

```text
myocardial ECV MR
— correlated with —
WHOLE_HEART_HISTOLOGIC_EXTRACELLULAR_SPACE_IN_TRANSPLANT_SUBSET
```

No CT/MRI equivalence, causal claim, universal fibrosis validity, clinical threshold or executable acquisition parameter is included.

## Scientific Thinking candidates used

Proposed candidates only:

- question shown above;
- primary objective: assess the bounded association in the exact source context;
- alternative: insufficient evidence for transport outside the transplant validation subset;
- unknown: whether the source scope can legitimately support the downstream test's generic “valid Project handoff” wording.

No candidate is pre-adopted.

## Imaging interpretation

Proposed Imaging interpretation:

- ECV is a candidate derived MR measurement in the exact source context;
- MRI is the sole candidate modality for this reference;
- only a conceptual acquisition family may be represented;
- exact sequence, timing, manufacturer, field strength and software compatibility remain unknown;
- the Project handoff may become frozen only after the human validates the scientific reference and adopts the required Imaging gates.

## Known limitations

- small, selected histology validation subset;
- no universal generalization;
- no clinical decision rule;
- no executable protocol;
- no equipment compatibility claim;
- timing and local implementation remain unknown;
- this reference would test contracts, not Imaging scientific performance.

## Contradictions

No contradiction is proposed in this narrowly bounded reference. This does not resolve, delete or downgrade the existing ECV/T1 synthetic-haematocrit contradiction, which remains a separate negative reference.

## Why the current reference cannot freeze

The current helper imports the whole live ECV/T1 result and its unresolved synthetic-haematocrit transferability position. Imaging therefore correctly records `UNRESOLVED_STRUCTURAL_CONTRADICTION` and blocks its freeze.

## Why the proposed reference appears suitable

It is narrower than the current helper, tied to one admitted atomic assertion and keeps equipment/protocol limitations explicit. It avoids claiming a general CT/MRI comparison or resolving the current contradiction.

## What is deterministic

- identity and current revision of the admitted assertion and source;
- absence of executable acquisition knowledge;
- preservation of unknown equipment and timing;
- required structural fields and owner boundaries;
- the fact that the current contradictory reference must remain `NOT_READY`.

## What requires expert judgment

- whether the assertion is sufficient to define a positive Imaging reference at all;
- whether ECV and MRI may be adopted for this bounded fixture purpose;
- whether the “fibrosis” label is accurate in this exact reference;
- whether unknown equipment and timing are acceptable for a conceptual Project handoff;
- whether the same reference may support F04/F05/F06/F09/F11/F19 without semantic overreach.

## Exact human question

Do you validate `RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY`, strictly within the stated transplant-histology scope and limitations, as a human-adopted test reference from which an immutable Imaging OwnerResult and `FROZEN_BY_HUMAN` handoff may be recorded for the listed contract tests?

## Possible decisions

1. `APPROVE_EXACT_SCOPE` — approve the exact reference and limitations.
2. `APPROVE_WITH_CORRECTIONS` — provide explicit corrections before any fixture is built.
3. `REJECT_REFERENCE` — no positive frozen reference is created.
4. `DEFER` — preserve current red tests and fail-closed behavior.

## Consequence of each decision

- Approval authorizes a later bounded fixture reconstruction, immutable snapshot, explicit human-decision provenance and targeted/canonical validation.
- Approval with corrections requires a new pre-freeze readback of the corrected input, without owner modification.
- Rejection or deferral leaves F04/F05/F06/F09/F11/F12/F19 unresolved and the current negative behavior intact.

## What Codex will do after approval

- encode the exact approved content as a tracked immutable fixture;
- record schema, owner versions, source commit, source/result IDs, decision ID, limitations, supersession and digest;
- add the exact contradiction→`NOT_READY` negative control;
- decouple downstream DOC/Project tests from mutable live owner execution where their scope is downstream-only;
- run targeted tests, canonical suite once, typecheck once and report every remaining root cause.

## What Codex must not infer

- scientific PASS;
- clinical validity;
- universal ECV validity;
- equipment compatibility;
- executable acquisition parameters;
- resolution of the current contradiction;
- permission to change Knowledge, ST, Imaging or Project runtime behavior.

---

## Reference ID

`RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT`

## Tests that need it

F10, and only the multicentre branch of any shared fixture.

## Scientific purpose of the reference

Test that a human-adopted conceptual Imaging strategy can preserve heterogeneous equipment knowledge, partial feasibility and a required future harmonization review without inventing cross-site compatibility.

## Exact proposed input

This reference derives from REF-01 only if REF-01 is approved:

```json
{
  "baseReference": "RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY",
  "centerMode": "MULTICENTRIC_HETEROGENEOUS",
  "centers": [
    {
      "siteLabel": "Centre A — hypothetical governed test site",
      "availability": "KNOWN_AVAILABLE",
      "manufacturer": "HUMAN_TO_SUPPLY_OR_CONFIRM",
      "model": "HUMAN_TO_SUPPLY_OR_CONFIRM",
      "softwareVersion": "HUMAN_TO_SUPPLY_OR_CONFIRM",
      "provenance": "PENDING_HUMAN_REFERENCE_VALIDATION"
    },
    {
      "siteLabel": "Centre B — hypothetical governed test site",
      "availability": "UNKNOWN",
      "manufacturer": "UNKNOWN",
      "model": "UNKNOWN",
      "softwareVersion": "UNKNOWN",
      "provenance": "PENDING_HUMAN_REFERENCE_VALIDATION"
    }
  ],
  "requiredFutureReviews": ["MULTICENTER_HARMONIZATION_REVIEW", "EQUIPMENT_COMPATIBILITY_REVIEW"],
  "executableProtocol": "NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE",
  "adoptionStatus": "PENDING_HUMAN_REFERENCE_VALIDATION"
}
```

## Existing governed evidence

REF-01 supplies the possible scientific base. RDE-003 supplies the deterministic distinction between availability, provenance, preference, requirement and compatibility. It does not supply a real Centre A inventory.

## Knowledge assertions used

Only the assertion approved for REF-01. No new scientific assertion is added by the multicentre variant.

## Scientific Thinking candidates used

No new scientific hypothesis is proposed. The variant adds operational context and preserves future harmonization review.

## Imaging interpretation

The same scientific strategy is considered under two site states. Partial site knowledge may not be promoted into universal compatibility or an executable common protocol.

## Known limitations

- the sites are hypothetical test-case entities, not claims about real institutions;
- Centre A's exact values have not been supplied;
- no harmonization strategy is scientifically or operationally validated;
- multicentre feasibility remains partial.

## Contradictions

None proposed. Equipment heterogeneity and unknowns are not silently recoded as scientific contradictions.

## Why the current reference cannot freeze

It inherits the current ECV/T1 contradiction before equipment state is evaluated.

## Why the proposed reference appears suitable

It isolates the actual F10 invariant: partial multicentre knowledge, explicit unknowns and mandatory future review.

## What is deterministic

- unknown equipment must remain unknown;
- heterogeneous/partial equipment cannot prove compatibility;
- an executable protocol remains unavailable;
- future harmonization review remains required.

## What requires expert judgment

- approval of REF-01;
- whether a human-validated hypothetical Centre A may be stipulated for this reference;
- exact Centre A values and provenance;
- whether partial equipment knowledge is acceptable for a frozen conceptual handoff in this scientific case.

## Exact human question

If REF-01 is approved, do you also validate this explicit two-centre hypothetical context as a separate frozen test reference, and what exact Centre A equipment facts and provenance may be recorded?

## Possible decisions

1. `APPROVE_WITH_EXACT_CENTRE_A_FACTS`;
2. `APPROVE_HYPOTHETICAL_CASE_WITHOUT_REAL_SITE_CLAIM`;
3. `REJECT_MULTICENTER_REFERENCE`;
4. `DEFER`.

## Consequence of each decision

Only the first two decisions allow F10 to receive a positive frozen reference. Rejection or deferral leaves F10 red without weakening fail-closed behavior.

## What Codex will do after approval

Encode this as a separate immutable variant, never as a mutation of REF-01, and preserve the future-review and no-compatibility constraints.

## What Codex must not infer

- real-site availability;
- cross-site compatibility;
- harmonization success;
- an executable common protocol;
- scientific or operational readiness.

---

## Reference ID

`RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV`

## Tests that need it

F15 directly. F04/F05/F06 currently inherit the same Fabry-oriented helper through `makeAuthorizedImagingProject`, but their assertions do not intrinsically require Fabry and could instead use an approved REF-01.

## Scientific purpose of the reference

Preserve F15's explicit rare-disease and longitudinal Project-construction semantics while providing a scientifically compatible frozen Imaging result.

## Exact proposed input

```json
{
  "referenceId": "RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV",
  "question": "Chez les adultes atteints de maladie de Fabry, comment l'ECV évolue-t-il longitudinalement en IRM cardiaque ?",
  "population": ["adultes atteints de maladie de Fabry"],
  "pathologyOrCondition": ["maladie de Fabry"],
  "outcomes": ["évolution longitudinale de l'ECV"],
  "modalityCandidates": ["IRM cardiaque"],
  "timings": ["mesure initiale", "suivi à définir scientifiquement"],
  "knowledgeAssertions": [],
  "contradictions": [],
  "limitations": ["NO_APPLICABLE_FABRY_ECV_ASSERTION_FOUND_IN_CURRENT_RUNTIME_CORPUS"],
  "adoptionStatus": "NOT_FREEZEABLE_WITH_CURRENT_LOCAL_EVIDENCE"
}
```

## Existing governed evidence

The current concept resolver recognizes Fabry disease, and historical/characterization evidence contains Fabry cases. No current runtime Knowledge assertion maps the ECV corpus to Fabry disease for the exact longitudinal question. The tracked human-adjudicated Fabry ST evidence concerns myocardial wall-thickening mechanisms, not longitudinal ECV or an Imaging handoff.

## Knowledge assertions used

None currently admissible for the exact Fabry + longitudinal ECV relation.

## Scientific Thinking candidates used

None may be adopted for this reference until its Knowledge basis is resolved. Historical Fabry ST candidates are not transplanted into this different question.

## Imaging interpretation

No positive Imaging interpretation is proposed. The current exact input is source-insufficient for a scientifically valid frozen handoff.

## Known limitations

- exact applicability to Fabry is not established by the current local runtime corpus;
- longitudinal timing is unspecified;
- no executable protocol knowledge;
- no human-adopted Imaging result exists.

## Contradictions

No Fabry-specific contradiction was identified. Absence of a contradiction is not positive evidence.

## Why the current reference cannot freeze

The historical helper does not actually build a Fabry-specific upstream chain; it builds the generic live ECV/T1 chain and inherits its unrelated unresolved contradiction. Reusing generic ECV evidence would also silently overstate Fabry applicability.

## Why the proposed reference appears suitable

It preserves the exact intended scope only as a candidate specification. It is not currently suitable for positive freeze.

## What is deterministic

- the exact F15 question and timing declarations;
- the concept resolver's Fabry identity;
- the absence of a current applicable Fabry/longitudinal ECV assertion in the inspected runtime corpus;
- the prohibition on substituting generic ECV evidence.

## What requires expert judgment

- whether F15 must retain Fabry/longitudinal scientific coverage;
- whether additional governed evidence must be admitted in a separate mission;
- whether the test may instead be rewritten around an already supported narrow reference while explicitly reducing its scientific scope.

## Exact human question

Should F15 retain its Fabry longitudinal ECV scope and remain blocked until an applicable governed reference exists, or may its scientific case be replaced by a narrower human-approved local-evidence case while preserving only the Project longitudinal/handoff contract?

## Possible decisions

1. `RETAIN_FABRY_SCOPE_AND_DEFER_RC_TEST_02`;
2. `AUTHORIZE_SEPARATE_GOVERNED_FABRY_REFERENCE_MISSION`;
3. `AUTHORIZE_EXPLICIT_TEST_SCOPE_CHANGE_TO_APPROVED_REFERENCE`;
4. `HUMAN_UNCERTAIN`.

## Consequence of each decision

- Retain/defer: F15 and any intentionally Fabry-dependent consumer stay red.
- Separate reference mission: no RC-TEST-02 fixture is created until that mission supplies admitted evidence and human validation.
- Scope change: a later repair must document the old and new test scopes and may not claim retained Fabry coverage.

## What Codex will do after approval

Follow only the selected branch. It will not search externally, modify the corpus or create a new scientific reference under the present mission.

## What Codex must not infer

- that generic ECV knowledge applies to Fabry;
- that a recognized concept is supported knowledge;
- that human characterization of a different Fabry question validates this one;
- that longitudinal timing or measurement strategy is scientifically adequate.

## Tests not needing a frozen Imaging reference

### F18

Proposed future boundary:

```text
OLD_TEST_SCOPE = live ST + live Imaging + Project + DOC
NEW_TEST_SCOPE = governed Project human-decision envelope + DOC projection
WHY_SEMANTICS_ARE_PRESERVED = the assertion compares decision identity and fields; it never inspects Imaging science
```

### F20

Proposed future boundary:

```text
OLD_TEST_SCOPE = convenience frozen Imaging fixture + Project + QRY + conversation
NEW_TEST_SCOPE = Project candidate with Imaging REQUIRED_BUT_NOT_READY + QRY + conversation
WHY_SEMANTICS_ARE_PRESERVED = the assertions concern same-conversation routing, Project answer integration and QRY refresh; no frozen Imaging payload is read
```

These changes are not applied until the human reference decisions above determine the complete repair boundary.

## Human response requested

Please record explicit decisions for:

```text
REF_01_DECISION =
REF_01_CORRECTIONS =

REF_02_DECISION =
REF_02_CENTRE_A_FACTS_AND_PROVENANCE =

REF_03_DECISION =

F18_BOUNDARY_CHANGE_AUTHORIZED = YES / NO
F20_BOUNDARY_CHANGE_AUTHORIZED = YES / NO
```

Silence, absence of objection or approval of this packet as a document does not adopt any reference.

## Cost and prohibited actions preserved

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
EXTERNAL_SCIENTIFIC_SEARCH = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
BROAD_PRODUCT_REPLAY = 0

PRODUCT_CODE_CHANGED = NO
SCIENTIFIC_OWNER_CODE_CHANGED = NO
KNOWLEDGE_CORPUS_CHANGED = NO
TEST_EXPECTATIONS_CHANGED = NO
FROZEN_REFERENCE_CREATED = NO
COMMIT_CREATED = NO
PUSH = NO
DEPLOYMENT = NO
```

## Stop state

```text
RC_TEST_02_REQUIRES_HUMAN_REFERENCE_VALIDATION
```

No canonical suite was run after the human gate. No test repair, owner repair, fixture freeze, commit, push or deployment was performed.
