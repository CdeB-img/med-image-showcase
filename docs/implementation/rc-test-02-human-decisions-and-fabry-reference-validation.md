# NOXIA — RC-TEST-02 Human Decisions and Fabry Reference Validation

> Classification: `LEVEL_3_IMPLEMENTATION_EVIDENCE`
>
> `NORMATIVE_AUTHORITY = NONE`
>
> `HUMAN_DECISION_REQUIRED = YES`
>
> Date: 2026-08-28

## Decision state

```text
RC_TEST_02_HUMAN_REFERENCE_DECISIONS_RECEIVED = YES
REF_01_DECISION = APPROVE_WITH_CORRECTIONS
REF_02_DECISION = APPROVE_HYPOTHETICAL_CASE_WITHOUT_REAL_SITE_CLAIM
REF_03_DECISION = APPROVE_WITH_CORRECTIONS
F18_BOUNDARY_CHANGE_AUTHORIZED = YES
F20_BOUNDARY_CHANGE_AUTHORIZED = YES

LOCAL_FABRY_ECV_EVIDENCE_ASSESSMENT = SUFFICIENT_FOR_BOUNDED_REFERENCE_PROPOSAL
REF_03_FINAL_HUMAN_VALIDATION = APPROVED_AFTER_CORRECTION
RC_TEST_02_FIXTURE_REPAIR = AUTHORIZED_TO_RESUME
```

These decisions authorize only RC-TEST-02 reference and harness work. They do not constitute `SCIENTIFIC_PASS`, `PD011_PASS`, clinical validation, general ECV validation, equipment compatibility, executable protocol approval or Wave 2 authorization.

## Baseline and preservation

```text
BRANCH = protocol-designer-canonical-ingestion
HEAD = 0852fb2f0b49d9132851559ce5591b89664dd35b
ORIGIN_MAIN = f504d8fc658ebdf17757e589f610e8f56c24e335
PRODUCT_CODE_CHANGED = NO
SCIENTIFIC_OWNER_CODE_CHANGED = NO
TEST_OR_FIXTURE_CHANGED = NO
KNOWLEDGE_CORPUS_CHANGED = NO
```

The prior packet remains a separate pre-decision record:

`docs/implementation/rc-test-02-human-reference-validation-packet.md`

## Human decision record — REF-01

```text
REFERENCE_ID = RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY
DECISION = APPROVE_WITH_CORRECTIONS
```

The approved scientific content is corrected as follows:

- remove “fibrose myocardique diffuse candidate”;
- do not promote ECV to a universal or clinically validated `BiomarkerRole`;
- represent ECV only as a bounded MR measurement candidate associated with histologic extracellular space in the exact transplant-histology validation context described by the admitted evidence;
- preserve the small, selected histologic-validation subset and the absence of broad generalizability;
- restrict the approval to a governed test-reference purpose;
- keep equipment, field strength, manufacturer, model, software, exact timing and executable acquisition parameters `UNKNOWN` unless separately sourced;
- permit `FROZEN_BY_HUMAN` only for a conceptual, explicitly non-executable Imaging strategy;
- infer no equipment compatibility, executable protocol, clinical validity or universal ECV validity;
- preserve the synthetic-haematocrit contradiction as a separate negative reference without resolution, removal or downgrade.

Corrected conceptual scope:

```json
{
  "referenceId": "RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY",
  "scientificScope": "TRANSPLANT_HISTOLOGY_VALIDATION_CONTEXT_ONLY",
  "measurementCandidate": "MR_DERIVED_MYOCARDIAL_ECV",
  "measurementRole": "BOUNDED_MEASUREMENT_CANDIDATE",
  "associatedConstruct": "HISTOLOGIC_EXTRACELLULAR_SPACE_IN_THE_DESCRIBED_SELECTED_SUBSET",
  "modalityCandidate": "CARDIAC_MRI",
  "equipment": "UNKNOWN",
  "fieldStrength": "UNKNOWN",
  "manufacturer": "UNKNOWN",
  "model": "UNKNOWN",
  "softwareVersion": "UNKNOWN",
  "exactTiming": "UNKNOWN",
  "executableAcquisitionParameters": "UNKNOWN",
  "equipmentCompatibility": "UNKNOWN",
  "executableProtocolReadiness": "NOT_READY",
  "projectHandoffScope": "FROZEN_CONCEPTUAL_IMAGING_STRATEGY_ONLY",
  "generalization": "FORBIDDEN",
  "clinicalValidationClaim": false,
  "universalBiomarkerClaim": false
}
```

## Human decision record — REF-02

```text
REFERENCE_ID = RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT
DECISION = APPROVE_HYPOTHETICAL_CASE_WITHOUT_REAL_SITE_CLAIM
BASE_REFERENCE = RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY
```

Approved hypothetical context:

```json
{
  "centerMode": "MULTICENTRIC_HETEROGENEOUS",
  "centers": [
    {
      "siteLabel": "Centre A — synthetic governed test entity",
      "realInstitution": false,
      "availability": "KNOWN_AVAILABLE",
      "manufacturer": "SYNTHETIC_TEST_VALUE_IF_STRUCTURALLY_REQUIRED_OTHERWISE_UNSPECIFIED",
      "model": "SYNTHETIC_TEST_VALUE_IF_STRUCTURALLY_REQUIRED_OTHERWISE_UNSPECIFIED",
      "softwareVersion": "SYNTHETIC_TEST_VALUE_IF_STRUCTURALLY_REQUIRED_OTHERWISE_UNSPECIFIED",
      "provenance": "HUMAN_APPROVED_SYNTHETIC_TEST_CONTEXT"
    },
    {
      "siteLabel": "Centre B — synthetic governed test entity",
      "realInstitution": false,
      "availability": "UNKNOWN",
      "manufacturer": "UNKNOWN",
      "model": "UNKNOWN",
      "softwareVersion": "UNKNOWN",
      "provenance": "HUMAN_APPROVED_SYNTHETIC_TEST_CONTEXT"
    }
  ],
  "requiredFutureReviews": [
    "MULTICENTER_HARMONIZATION_REVIEW",
    "EQUIPMENT_COMPATIBILITY_REVIEW"
  ],
  "realSiteFactClaim": false,
  "commercialCompatibilityClaim": false,
  "harmonizationSuccessClaim": false,
  "executableProtocolReadiness": "NOT_READY"
}
```

## Human decision record — F18

```text
F18_BOUNDARY_CHANGE_AUTHORIZED = YES
```

The replacement test may use a governed Project human-decision envelope directly for the DOC projection contract. It must preserve HumanDecision identity and fields and must not acquire unrelated Imaging scientific claims.

## Human decision record — F20

```text
F20_BOUNDARY_CHANGE_AUTHORIZED = YES
```

The replacement test may use Imaging `REQUIRED_BUT_NOT_READY` when that state is scientifically honest. It must preserve the original conversation, Project answer integration and QRY-refresh invariants. It must not require or fabricate a frozen Imaging payload.

## REF-03 local-source mission

```text
REFERENCE_ID = RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV
MISSION = LOCAL_GOVERNED_REFERENCE_ASSESSMENT
WEB_SEARCH = 0
EXTERNAL_SCIENTIFIC_SEARCH = 0
LLM_OR_PROVIDER_CALLS = 0
NEW_LITERATURE_CAMPAIGN = 0
```

### Admitted scientific master

The Source-of-Truth Index identifies:

`output/documents/noxia-protocol-designer-reasoning-book-pd-002-fabry.docx`

as the reference deliverable for Reasoning Book PD-002, version 1.0, with its evidence state stopped on 2026-08-02. The index classifies it as a dated specialized scientific corpus that contains no executable protocol and is not individual clinical guidance.

```text
PD_002_SHA256 = 750ea6dac7daf94fab303166457463862b3810131d5801830b5318c5c9d880e7
```

### Existing structured candidate

The repository also contains:

`scientific-candidates/protocol-designer/fabry-candidate/`

Its manifest records:

```text
PACKAGE_STATUS = CANDIDATE_NOT_ACTIVATED
REVIEW_STATUS = HUMAN_REVIEW_REQUIRED
ACTIVATION_STATUS = NOT_ACTIVATED
PACKAGE_DIGEST = 682ad4f32903ef7f6ea97b24d2a96020eec31dd8fcdfde0acbf96ad8219b4858
RUNTIME_IMPORTS = 0
PUBLIC_PROJECTION = false
```

This package is useful as a traceable structural preparation. It is not used as an activated Knowledge source and is not promoted by this assessment.

## What the admitted local evidence supports

PD-002 supports the following bounded propositions:

1. ECV is a derived estimate of the myocardial extracellular fraction accessible to the tracer. It depends on myocardial and blood T1 measurements, contemporaneous haematocrit and contrast distribution conditions.
2. In Fabry disease, global ECV may be normal in early stages dominated by intracellular storage, while regional ECV may increase in segments with LGE because of scar and/or oedema.
3. ECV provides information about extracellular expansion. It does not distinguish collagen, amyloid, oedema, capillaries or matrix and must not be renamed “percentage of fibrosis”.
4. A global mean can conceal regional elevation. Regional and global ECV must therefore remain distinct.
5. A longitudinal research objective is explicitly admissible: ask whether focal scar or extracellular expansion changed beyond measurement error, using absolute and relative change between defined times, uncertainty and constant conventions.
6. Scanner, field, sequence, reconstruction, software, analysis convention and local reference context affect mapping values. A platform or method change is a major analytical event.
7. No universal clinically important ECV-change threshold is documented. The direction or magnitude of longitudinal change must not be predetermined.
8. Fabry-specific evidence about early diffuse fibrosis and regional longitudinal ECV remains limited. This limitation is part of the reference, not a reason to replace the scientific question with a generic ECV case.

These propositions establish the scientific defensibility of measuring ECV in Fabry as a bounded research measurement. They do not establish that ECV is a universal Fabry biomarker, that a change will occur, that a measured change is clinically important, or that it represents collagen-specific progression.

## Traceable source set

### Internal scientific master locations

- PD-002 §20, “Fraction de volume extracellulaire — ECV”: definition, Fabry interpretation, haematocrit, renal function and limits of diffuse-fibrosis sensitivity;
- PD-002 Objective O3: global, remote and regional ECV with contemporaneous haematocrit and a calibrated chain;
- PD-002 Objective O5: absolute and relative longitudinal change beyond measurement error under constant conventions;
- PD-002 H9: global ECV can underestimate regional involvement; longitudinal regional evidence remains limited;
- PD-002 D6, D9 and D10: define the role of ECV, time zero and interpretable change;
- PD-002 evidence map and unresolved questions: ECV measures extracellular space rather than collagen, and no universal clinically important ECV change is established.

### Bibliographic references already contained in PD-002

- `PD002:REF-R09` — Thompson et al., Fabry cardiac T1 mapping cohort;
- `PD002:REF-R19` — Vijapurapu et al., longitudinal CMR assessment in Fabry disease;
- `PD002:REF-R30` — SCMR/EACVI consensus on T1, T2 and ECV mapping;
- `PD002:REF-R31` — standardized CMR interpretation and post-processing;
- `PD002:REF-R32` — CMR endpoints in clinical research, analytical validation and clinical qualification.

The candidate package explicitly records that precise primary-source passage locators are generally absent from PD-002 and that its evidence links remain `reviewerStatus = PENDING`. This assessment therefore relies on the admitted PD-002 scientific master for the bounded proposal and preserves that locator limitation.

## Proposed REF-03 scientific content

```json
{
  "referenceId": "RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV",
  "referencePurpose": "GOVERNED_TEST_REFERENCE_FOR_F15_ONLY",
  "question": "Chez des adultes dont la maladie de Fabry est étiologiquement confirmée, comment l’ECV myocardique mesurée en IRM cardiaque évolue-t-elle entre un temps initial défini et un ou plusieurs temps de suivi définis, sans présupposer la direction ni l’importance de cette évolution ?",
  "population": {
    "condition": "CONFIRMED_FABRY_DISEASE",
    "ageGroup": "ADULT",
    "sex": "TO_BE_EXPLICITLY_RECORDED",
    "variant": "TO_BE_EXPLICITLY_RECORDED",
    "diseaseStage": "TO_BE_EXPLICITLY_RECORDED",
    "renalFunction": "TO_BE_EXPLICITLY_RECORDED",
    "treatmentStatus": "TO_BE_EXPLICITLY_RECORDED"
  },
  "primaryConstruct": "MYOCARDIAL_EXTRACELLULAR_EXPANSION",
  "measurementCandidate": {
    "name": "MR_DERIVED_MYOCARDIAL_ECV",
    "role": "BOUNDED_RESEARCH_MEASUREMENT_CANDIDATE",
    "modality": "CARDIAC_MRI",
    "collagenSpecific": false,
    "universalBiomarkerRole": false,
    "clinicalValidationClaim": false
  },
  "measurementInputs": {
    "nativeAndPostContrastMyocardialT1": "REQUIRED_BEFORE_EXECUTION",
    "nativeAndPostContrastBloodT1": "REQUIRED_BEFORE_EXECUTION",
    "contemporaneousHaematocrit": "REQUIRED_BEFORE_EXECUTION",
    "syntheticHaematocrit": "NOT_AUTHORIZED_BY_THIS_REFERENCE"
  },
  "regionality": {
    "globalECV": "SEPARATE_ESTIMAND",
    "remoteECV": "SEPARATE_ESTIMAND_IF_USED",
    "regionalECV": "SEPARATE_ESTIMAND_IF_USED",
    "lgeHandling": "MUST_BE_DECLARED_BEFORE_EXECUTION"
  },
  "temporalModel": {
    "baseline": "REQUIRED_AND_TO_BE_DEFINED",
    "followUp": "REQUIRED_AND_TO_BE_DEFINED",
    "directionOfChange": "NOT_PREDETERMINED",
    "magnitudeOfChange": "NOT_PREDETERMINED",
    "universalChangeThreshold": "ABSENT",
    "interpretationBelowRepeatability": "NOT_INTERPRETABLE_AS_PROGRESS_OR_REGRESSION"
  },
  "equipmentAndMethod": {
    "fieldStrength": "UNKNOWN",
    "manufacturer": "UNKNOWN",
    "model": "UNKNOWN",
    "softwareVersion": "UNKNOWN",
    "sequence": "UNKNOWN",
    "reconstruction": "UNKNOWN",
    "analysisMethod": "UNKNOWN",
    "localReference": "UNKNOWN",
    "longitudinalComparability": "REQUIRED_BEFORE_EXECUTION"
  },
  "projectHandoffScope": "FROZEN_CONCEPTUAL_IMAGING_STRATEGY_ONLY",
  "equipmentCompatibility": "UNKNOWN",
  "executableProtocolReadiness": "NOT_READY",
  "adoptionStatus": "APPROVED_AFTER_CORRECTION_FOR_GOVERNED_F15_TEST_REFERENCE_ONLY"
}
```

## Final human validation — REF-03

```text
REF_03_FINAL_DECISION = APPROVE_WITH_CORRECTIONS
REF_03_HUMAN_VALIDATION = APPROVED_AFTER_CORRECTION
RC_TEST_02_FIXTURE_REPAIR = AUTHORIZED_TO_RESUME
```

The approval is strictly bounded to a governed, conceptual and non-executable F15 test reference. Its scientific basis remains the admitted PD-002 Fabry Reasoning Book and its scope remains limited to confirmed Fabry disease, myocardial extracellular expansion, MR-derived myocardial ECV as a bounded research measurement candidate, and a longitudinal question between defined timepoints without a predetermined direction or magnitude.

The final human correction replaces the prior interpretive label with:

```text
interpretationBelowRepeatability = NOT_INTERPRETABLE_AS_PROGRESS_OR_REGRESSION
```

This distinguishes an observed numerical difference from the scientific interpretation of that difference. The approval does not authorize an executable acquisition protocol, equipment compatibility, validated longitudinal comparability, clinical qualification, `SCIENTIFIC_PASS` or `PD011_PASS`.

The future fixture must preserve explicit human-decision provenance, immutable identity/version/digest, all limitations and all `UNKNOWN` fields. It must preserve:

```text
syntheticHaematocrit = NOT_AUTHORIZED_BY_THIS_REFERENCE
```

The existing synthetic-haematocrit contradiction remains a separate negative reference and is neither resolved, removed nor downgraded. The existing Fabry candidate package remains `CANDIDATE_NOT_ACTIVATED` / `HUMAN_REVIEW_REQUIRED`; it is not activated or promoted by this decision.

## Required limitations

- the reference does not call ECV “fibrosis”, “percentage of collagen” or a universal Fabry biomarker;
- ECV can reflect extracellular expansion from more than one tissue component;
- global ECV can conceal regional abnormalities;
- early diffuse Fabry fibrosis and longitudinal regional ECV remain incompletely characterized;
- exact timing, repeatability, acquisition, equipment, analysis and local-reference conditions are unknown;
- no universal minimally important or clinically validated change threshold is available;
- no treatment-effect, prognosis or clinical-decision claim is authorized;
- the strategy is conceptual and non-executable;
- the existing synthetic-haematocrit contradiction remains separate and unresolved.

## Deterministic findings versus human judgment

Deterministically established from local repository evidence:

- PD-002 is the indexed scientific master for this Fabry Reasoning Book;
- PD-002 explicitly covers ECV in Fabry and an individual-progression objective;
- the local structured package remains candidate, unreviewed, inactive and unused at runtime;
- the proposed content can preserve F15's Fabry and longitudinal scope without asserting a known direction of change;
- no equipment compatibility or executable acquisition can be claimed.

Resolved by the final human decision:

- the admitted PD-002 content is sufficient for this exact bounded test-reference purpose;
- ECV is accepted only as the bounded conceptual measurement candidate for F15 under all stated limitations;
- a conceptual `FROZEN_BY_HUMAN` handoff is acceptable while executable conditions remain unknown and `executableProtocolReadiness = NOT_READY`;
- the scientific wording is accepted after the exact repeatability-interpretation correction recorded above.

## Historical human question

Do you approve `RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV` exactly as a governed, conceptual, non-executable test reference for F15, on the basis of the admitted PD-002 local scientific master and subject to every limitation and unknown recorded above?

Allowed decisions:

```text
REF_03_FINAL_DECISION = APPROVE_BOUNDED_FABRY_ECV_CONCEPTUAL_REFERENCE

REF_03_FINAL_DECISION = APPROVE_WITH_CORRECTIONS
REF_03_FINAL_CORRECTIONS = <exact corrections>

REF_03_FINAL_DECISION = REJECT_REFERENCE

REF_03_FINAL_DECISION = DEFER
```

The human answered this question with `APPROVE_WITH_CORRECTIONS`; the corrected decision is recorded above. It authorizes only an immutable RC-TEST-02 reference fixture and conceptual Project handoff with explicit human-decision provenance. It does not activate the Fabry candidate package, create general Knowledge truth, qualify ECV clinically or authorize an executable protocol.

## Authorized bounded implementation

1. encode REF-01 with all human corrections;
2. encode REF-02 as an immutable synthetic multicentre variant of REF-01;
3. encode REF-03 exactly within its approved Fabry/longitudinal scope;
4. preserve the current contradictory ECV/T1 chain as a negative fail-closed reference;
5. apply only the authorized F18 and F20 boundary changes;
6. add deterministic provenance, digest and contradiction-regression checks;
7. run the bounded targeted tests, canonical suite once and typecheck once, as required by RC-TEST-02;
8. report any remaining failure without owner repair or scientific reinterpretation.

## Resumption state

```text
RC_TEST_02_FIXTURE_REPAIR = AUTHORIZED_TO_RESUME
NEW_HUMAN_SCIENTIFIC_DECISIONS_INVENTED = 0
FROZEN_REFERENCE_CREATED = NO
FROZEN_BY_HUMAN_WRITTEN = NO
COMMIT_CREATED = NO
PUSH = NO
DEPLOYMENT = NO
SCIENTIFIC_PASS = NO
PD011_PASS = NO
WAVE_2_AUTHORIZED = NO
```
