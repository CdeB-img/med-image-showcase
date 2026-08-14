# SEM-003D-COMP — Common Blind Comparative Qualification Campaign

## 1. Decision

**Decision:** `SEM003D_COMP_CAMPAIGN_COMPLETE_QUALIFICATION_INCONCLUSIVE`

The campaign is operationally complete: 90/90 unique Case × Baseline runs reached a terminal state, their outputs were frozen before reference opening, and Evaluator 1.3.0 recorded 90/90 evaluations without evaluator execution error.

The comparative qualification is nevertheless inconclusive. Five baselines produced no structurally valid output. DSPy produced 10/15 structurally valid outputs, but the frozen evaluator bridge classified all 59 required mappings as `OMITTED` because it joined only exact semantic keys. The native DSPy meanings visibly contain at least the first required scientific content in each of those 10 cases. The resulting automated `SEMANTIC_FAILURE` dispositions therefore do not constitute a defensible comparison of scientific understanding.

The central question cannot be answered positively or negatively from this campaign:

- measurable added value of SEM: **not demonstrated**;
- scientific superiority of a simpler architecture: **not demonstrated**;
- global ranking: **not justified**;
- PD-011 final-reference eligibility: **NO**.

No threshold was invented. No isolated PASS was converted into qualification.

## 2. Campaign identity

| Field | Frozen value |
|---|---|
| Campaign | `SEM003D-COMP-COMMON-BLIND-01` |
| Blind Set | `SEM003C-BLIND-QUALIFICATION-SET-01` 1.0.0 |
| Cases | 15 |
| Baselines | 6 |
| Scheduled runs | 90 |
| Provider / model | `GOOGLE_GEMINI` / `gemini-3.5-flash-lite` |
| Temperature | `null` |
| Schedule | Case-major, baseline order rotated by case ordinal |
| Evaluator | 1.3.0 |
| Evaluator configuration digest | `0d0f48cf1859d3747fd17eeaf75d51a59e6a5d5a48a096beab67cbe32d94665b` |
| Precommit schedule digest | `18590ed037805cc0903f391322e86f301aeaa86559d30c0ab89a550a342bfb9e` |
| Generation output digest | `e4a59b48999a7a586bf170ffa837b1f39d5a04e7f385825ec97e41b8bf414f26` |
| Evaluation collection digest | `401bd5d130214ea2d109f7f59754a38989431c9e29af79485133ab9e9595aa72` |
| First generation start | 2026-08-14T00:15:52.223859Z |
| Generation freeze | 2026-08-14T00:24:47.899870Z |
| Reference opening | 2026-08-14T00:25:21.292752Z |

Blind separation was preserved:

- Phase A used only the 15 Blind Input files;
- 90 terminal records were persisted before reference opening;
- the generation collection was frozen by digest;
- sealed references were opened only in Phase B;
- no baseline was replayed after reference opening;
- no tuning, retry, best-run selection, repair, or silent deletion occurred.

## 3. 90-run execution

| Baseline | Runs | Structurally valid | Framework failures | Provider failures recorded | Machine disposition | Active latency total | Median | Reconciled provider attempts |
|---|---:|---:|---:|---:|---|---:|---:|---:|
| SEM current | 15 | 0 | 15 | 0 | 15 `NOT_EVALUABLE` | 4.189 s | 0.275 s | 0 |
| Instructor + Pydantic | 15 | 0 | 15 | 0 | 15 `NOT_EVALUABLE` | 3.345 s | 0.170 s | 15 |
| PydanticAI | 15 | 0 | 0 | 15 | 15 `PROVIDER_EXECUTION_FAILURE` | 9.074 s | 0.526 s | 15 |
| DSPy | 15 | 10 | 5 | 0 | 10 `SEMANTIC_FAILURE`, 5 `NOT_EVALUABLE` | 71.034 s | 4.730 s | 15 |
| LangExtract | 15 | 0 | 15 | 0 | 15 `NOT_EVALUABLE` | 0.193 s | 0.001 s | 0 |
| Outlines | 15 | 0 | 15 | 0 | 15 `NOT_EVALUABLE` | 2.732 s | 0.164 s | 15 |
| **Total** | **90** | **10** | **65** | **15** | **65 NE, 15 provider failure, 10 semantic failure** | **90.567 s** | — | **60** |

The sequential generation wall time was 535.180 seconds, including the precommitted pacing interval.

### Technical failure signatures

| Baseline | Observed first technical cause | Scope |
|---|---|---:|
| SEM current | Invocation returned no JSON output | 15/15 |
| Instructor + Pydantic | HTTP 400: provider schema rejected `additional_properties` | 15/15 |
| PydanticAI | HTTP 400 `INVALID_ARGUMENT` | 15/15 |
| DSPy | 10 native projections; 5 HTTP 400 `INVALID_ARGUMENT` | 15/15 accounted |
| LangExtract | `InferenceConfigError`: output schema used LangExtract internal field names | 15/15 |
| Outlines | HTTP 400: provider schema rejected `additional_properties` | 15/15 |

These are frozen campaign outcomes. They were measured, not repaired.

### Provider-call reconciliation

The frozen run counter reports 25 calls because it recorded zero whenever a framework raised before returning control. The preserved exceptions prove one provider attempt in each Instructor, PydanticAI, DSPy, and Outlines run. Their configurations allowed one attempt and the campaign performed no retry. The evidence-reconciled count is therefore:

- 60 provider attempts;
- 10 successful generation responses;
- 50 provider/API failures;
- 0 attempts for SEM current, whose invocation returned no JSON before an attempt was evidenced;
- 0 attempts for LangExtract, whose deterministic configuration error occurred first.

Token counts and monetary cost were not exposed by the frozen runners. They remain `NOT_AVAILABLE`; no estimate is substituted.

## 4. Global comparison

The run-level machine results do not support a cognitive ranking.

1. Structural validity was achieved only by DSPy, on 10/15 cases.
2. SEM and four alternative baselines supplied no candidate representation on any case.
3. DSPy's native outputs are scientifically rich enough to expose a bridge defect: the scientific content and the reference use different semantic keys.
4. Evaluator 1.3.0 executed correctly on its received candidates, but the candidate construction reduced semantic equivalence to exact-key identity before evaluation.
5. The 10 DSPy `SEMANTIC_FAILURE` dispositions are valid records of the frozen pipeline, but not valid proof that the native meanings lack the required science.

This campaign demonstrates technical readiness differences. It does not demonstrate that SEM understands science better, nor that DSPy is scientifically superior.

## 5. P01–P18

Legend for the table: `S/V/A/NE/NT` = `SATISFIED / VIOLATED / ADJUDICATION_REQUIRED / NOT_EVALUABLE / NOT_TESTED` across the 15 cases.

All five non-DSPy baselines have zero `SATISFIED`, zero `VIOLATED`, and every applicable property `NOT_EVALUABLE`. Their `NOT_TESTED` count is the same applicability complement shown in the DSPy column.

| Property | Family | DSPy machine counts S/V/A/NE/NT | Interpretation |
|---|---|---|---|
| P01 | Absolute | 0/10/0/5/0 | Exact-key omission dominates |
| P02 | Absolute | 0/9/1/5/0 | Exact-key omission; one adjudication |
| P03 | Absolute | 0/7/0/4/4 | Automated result only |
| P04 | Absolute | 0/9/0/5/1 | Automated result only |
| P05 | Absolute | 0/2/0/1/12 | Automated result only |
| P06 | Absolute | 1/5/0/3/6 | One automated satisfaction |
| P07 | Absolute | 0/3/7/5/0 | Seven adjudications required |
| P08 | Absolute | 4/0/0/0/11 | Four automated satisfactions |
| P09 | Absolute | 0/10/0/5/0 | Exact-key omission dominates |
| P10 | Absolute | 9/0/1/5/0 | Nine automated satisfactions |
| P11 | Absolute | 3/2/5/5/0 | Mixed; adjudication required |
| P12 | Absolute | 0/4/6/5/0 | Mixed; adjudication required |
| P13 | Statistical | 0/9/0/6/0 | Automated result only |
| P14 | Statistical | 0/7/0/4/4 | Automated result only |
| P15 | Statistical | 0/0/0/15/0 | Not evaluable |
| P16 | Statistical | 0/0/0/15/0 | Not evaluable |
| P17 | Statistical | 0/0/0/15/0 | Not evaluable |
| P18 | Statistical | 0/2/0/2/11 | Automated result only |

The machine aggregate reports 61 P01–P12 violations for DSPy and zero for the other baselines. Zero does not mean PASS for the other baselines; it means no evaluable output. The 61 DSPy violations must not be interpreted as scientifically adjudicated violations because 59/59 required obligation mappings were forced to `OMITTED` by exact-key mismatch.

The complete run-level matrix is stored in `experiments/semantic-engine-comparison/results/sem-003d-comp/p01-p18-matrix.json`.

## 6. C01–C18 capability matrix

Legend: `PASS/PARTIAL/FAIL/NE/NT` across the 15 cases. “Other five” groups SEM, Instructor, PydanticAI, LangExtract, and Outlines because their capability profiles are identical: all applicable cells are `NOT_EVALUABLE`.

| Capability | DSPy PASS/PARTIAL/FAIL/NE/NT | Each of the other five PASS/PARTIAL/FAIL/NE/NT |
|---|---|---|
| C01 Explicit fidelity | 0/0/10/5/0 | 0/0/0/15/0 |
| C02 Multi-turn context | 0/0/10/5/0 | 0/0/0/15/0 |
| C03 Correction/change of mind | 0/0/2/1/12 | 0/0/0/3/12 |
| C04 Negation | 0/0/7/4/4 | 0/0/0/11/4 |
| C05 Non-causality | 1/0/5/3/6 | 0/0/0/9/6 |
| C06 Necessary implicit information | 0/2/8/5/0 | 0/0/0/15/0 |
| C07 Ellipsis/coreference | 0/0/10/5/0 | 0/0/0/15/0 |
| C08 Ambiguity | 0/0/10/5/0 | 0/0/0/15/0 |
| C09 Missing information | 0/0/10/5/0 | 0/0/0/15/0 |
| C10 Clarification | 0/0/0/15/0 | 0/0/0/15/0 |
| C11 Temporal reasoning | 0/0/9/5/1 | 0/0/0/14/1 |
| C12 Relation semantics | 0/0/10/5/0 | 0/0/0/15/0 |
| C13 Conceptual plan separation | 0/0/7/4/4 | 0/0/0/11/4 |
| C14 Ownership | 0/3/5/7/0 | 0/0/0/15/0 |
| C15 Epistemic status | 0/0/10/5/0 | 0/0/0/15/0 |
| C16 Contextual enrichment | 0/6/4/5/0 | 0/0/0/15/0 |
| C17 Structural robustness | 0/0/0/15/0 | 0/0/0/15/0 |
| C18 Global scientific state reconstruction | 0/0/10/5/0 | 0/0/0/15/0 |

These are mechanical derivations from P01–P18, not independent human capability judgments. The complete 90 × 18 matrix is stored in `experiments/semantic-engine-comparison/results/sem-003d-comp/c01-c18-capability-matrix.json`.

## 7. Case-level divergences

Abbreviations: `NE` = not evaluable; `PF` = provider execution failure; `SF*` = automated semantic failure affected by the exact-key limitation.

| Case / scientific requirement | SEM | Instructor | PydanticAI | DSPy | LangExtract | Outlines | Discriminating factor |
|---|---|---|---|---|---|---|---|
| Amyloid ECV purpose gap | NE | NE | PF | NE | NE | NE | No architecture produced an evaluable candidate |
| Breast BPE ambiguous change | NE | NE | PF | SF* | NE | NE | DSPy native meaning preserves BPE, hormonal context, two comparison axes, and the open primary choice; exact keys differ |
| Corneal nerve method vs measure | NE | NE | PF | SF* | NE | NE | DSPy distinguishes confocal microscopy, density measurement, and regeneration phenomenon; exact keys differ |
| Epilepsy discordant-region ellipsis | NE | NE | PF | SF* | NE | NE | DSPy resolves concordant/discordant regions and preserves candidate status; exact keys differ |
| Focused ultrasound BBB and MRI | NE | NE | PF | NE | NE | NE | No architecture produced an evaluable candidate |
| HFpEF exercise state | NE | NE | PF | NE | NE | NE | No architecture produced an evaluable candidate |
| LAA closure seal assessment | NE | NE | PF | SF* | NE | NE | DSPy captures CT timing, primary leak, conditional TEE, exploratory thrombus; exact keys differ |
| Microbiome antibiotic candidates | NE | NE | PF | SF* | NE | NE | DSPy preserves before/after, unreliable diet, candidate status, and non-causality; exact keys differ |
| Orthodontic CBCT outcome correction | NE | NE | PF | SF* | NE | NE | DSPy preserves the historical primary and corrected current endpoint; exact keys differ |
| Postpartum myocardial work non-causal | NE | NE | PF | SF* | NE | NE | DSPy captures timing, non-causality, open comparator, and missing treatment context; exact keys differ |
| Prosthetic-valve infection context | NE | NE | PF | SF* | NE | NE | DSPy captures suspected infection, FDG signal, negative cultures, non-proof, and timing gap; exact keys differ |
| Rare-disease control change | NE | NE | PF | NE | NE | NE | No architecture produced an evaluable candidate |
| Transplant rejection timing | NE | NE | PF | SF* | NE | NE | DSPy separates MRI T2 measurement, biopsy grade, timing, and rejection claim; exact keys differ |
| Vaccine single-cell multidimensional | NE | NE | PF | SF* | NE | NE | DSPy separates proportions, states, antibody timing, non-causality, and batch-effect candidate; exact keys differ |
| Wearable sleep phenomenon vs observable | NE | NE | PF | NE | NE | NE | No architecture produced an evaluable candidate |

For all 10 `SF*` rows, the first evaluator cause is `REQUIRED_OBLIGATION_OMITTED` at Level 1. Documentary inspection of the frozen native output shows the referenced first obligation in the normalized meaning. This demonstrates an evaluation-binding divergence. It does not establish that every obligation is satisfied, and it is not a substitute for governed human equivalence adjudication.

The requested divergence types cannot be compared across architectures because only DSPy produced native semantic content. The following conclusions are therefore required:

- extraction without scientific logic: not comparatively testable;
- loss of negation, correction, ellipsis, non-causality, ambiguity, or ownership: not comparatively testable;
- simpler architecture outperforming SEM: not demonstrated;
- SEM capability absent from a simpler architecture: not demonstrated;
- no measurable SEM improvement in this campaign: **confirmed at the execution/evidence level**, because SEM produced 0 evaluable outputs; this is not a claim of cognitive inferiority.

## 8. Complexity, calls, latency, and tokens

| Baseline | Frozen orchestration profile | Provider attempts | Successful native output | Median active latency | Tokens/cost |
|---|---|---:|---:|---:|---|
| SEM current | Reconstruction + critic + deterministic canonicalization | 0 evidenced | 0/15 | 0.275 s | N/A |
| Instructor + Pydantic | Strict typed projection | 15 | 0/15 | 0.170 s | N/A |
| PydanticAI | Typed agent, no tools | 15 | 0/15 | 0.526 s | N/A |
| DSPy | `dspy.Predict`, no optimizer or demonstrations | 15 | 10/15 | 4.730 s | N/A |
| LangExtract | One extraction pass, one worker | 0 | 0/15 | 0.001 s | N/A |
| Outlines | Gemini adapter + structured generator | 15 | 0/15 | 0.164 s | N/A |

The data do not support a complexity/value optimum. DSPy is the only approach that reached native semantic output, and those outputs contain substantial scientific structure. SEM's more complex orchestration produced no observable candidate, so no added value can be attributed to that complexity in this campaign.

## 9. Architecture profiles

### SEM current

No semantic profile is measurable. All 15 invocations ended with “SEM returned no JSON output.” The campaign records zero evidenced provider calls and 15 non-evaluable candidates. No scientific capability can be inferred from this absence.

### Instructor + Pydantic

No semantic profile is measurable. All provider requests were rejected because the generated response schema contained unsupported `additional_properties` fields. This is a provider/schema integration result, not evidence about scientific understanding.

### PydanticAI

No semantic profile is measurable. All 15 runs returned provider HTTP 400 `INVALID_ARGUMENT`. This is an execution result, not a scientific failure.

### DSPy

DSPy is the sole baseline with native scientific representations: 10/15. Its normalized meanings often preserve explicit content, multi-turn corrections, distinctions between method and measurement, non-causality, timing gaps, ambiguity, and candidate status. Five runs failed with provider HTTP 400.

The automated capability profile cannot be accepted at face value because exact-key joining marked 59/59 requirements omitted. Post-run human adjudication is required to distinguish true omissions from equivalent representations.

### LangExtract

No provider call occurred. All runs failed the frozen LangExtract schema check before generation. No scientific profile is measurable.

### Outlines

No semantic profile is measurable. All provider requests were rejected because the response schema contained unsupported `additional_properties` fields.

## 10. What SEM actually adds

Nothing measurable in this campaign. SEM returned no native candidate on 15/15 Blind inputs. The campaign therefore provides no evidence that reconstruction, critic, canonicalization, or ownership machinery improves scientific understanding relative to the alternatives.

This conclusion is deliberately narrow: it concerns the frozen comparative configuration and these 15 runs. It does not negate historical local SEM tests and does not establish universal inferiority.

## 11. What SEM does not add

The campaign does not demonstrate any SEM advantage for:

- explicit fidelity;
- multi-turn context;
- correction/change of mind;
- negation or non-causality;
- implicit information or coreference;
- ambiguity, missing information, or clarification;
- temporal and relation reasoning;
- conceptual-plan separation;
- ownership or epistemic status;
- contextual enrichment;
- structural robustness;
- global scientific-state reconstruction.

No absence of evidence is converted into evidence of absence.

## 12. Limitations

1. Only 10/90 runs produced structurally valid semantic outputs.
2. Five of six baselines produced none; technical readiness was not comparable.
3. Exact-key binding prevented semantic-equivalence evaluation for DSPy.
4. No real human post-run reference adjudication was performed.
5. Tokens and costs were unavailable.
6. The frozen call counter undercounted provider attempts; preserved errors permit a transparent reconciliation to 60.
7. One run per Case × Baseline measures this configuration snapshot, not generative reliability across repeated runs.
8. Fifteen cases do not establish universal superiority or statistical significance.
9. The Blind references are now exposed in this campaign environment. A repaired system cannot reuse this set as fresh independent evidence.
10. The existing machine matrices remain immutable campaign evidence, including their evaluator-binding limitation.

## 13. Next decision

The campaign should be archived as complete but inconclusive. It must not be reinterpreted as SEM qualification, DSPy qualification, or comparative PASS.

Before any future independent campaign:

1. repair and qualify each baseline's provider/schema execution on visible Development fixtures;
2. qualify the semantic-equivalence bridge independently, without exact-key identity as the only preservation test;
3. add a pre-Blind live compatibility gate that proves one non-Blind structured output per baseline;
4. decide whether independent experts will adjudicate the 10 frozen DSPy outputs post-run; such adjudication can clarify these outputs but cannot recover the missing 80;
5. construct and seal a new independent Blind package under organizational separation;
6. freeze all repaired identities before that new package is executed.

No repair, rerun, tuning, threshold change, baseline mutation, evaluator mutation, Gold mutation, or Acceptance Envelope mutation was performed during SEM-003D-COMP.

## 14. Technical validation

| Validation | Result | Evidence |
|---|---|---|
| Campaign integrity | PASS | 90 terminal pairs, 90 matrix rows, generation digest unchanged |
| Six-baseline freeze | PASS | `SEM003C1_FREEZE_CHECK_PASS files=11 baselines=6` |
| Evaluator/binding freeze | PASS | Evaluator 1.3.0, digest `0d0f48cf…` |
| Typecheck | PASS | `tsc -p tsconfig.app.json --noEmit` |
| Production build | PASS | Vite build completed |
| JSON integrity / secret scan | PASS | All campaign JSON parsed; no Gemini API-key pattern found |
| Git whitespace check | PASS | `git diff --check` |
| Historical Blind validator | **FAIL 27/30** | C16, C17, and dependent C30 still require Evaluator 1.1.0 / the B4R digest |

The Blind validator failure is a real residual governance contradiction. The applicable C1R2 freeze independently verifies Evaluator 1.3.0 and its repaired binding, while the older Blind validator still encodes 1.1.0. It was not modified after Blind observation. The failure does not indicate mutation of a Blind Case or sealed reference; Git confirms those paths are unchanged. It does prevent claiming a globally green validation state and reinforces the inconclusive decision.

## Machine evidence

- `experiments/semantic-engine-comparison/results/sem-003d-comp/generation-freeze-manifest.json`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/evaluation-manifest.json`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/comparative-summary.json`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/p01-p18-matrix.json`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/c01-c18-capability-matrix.json`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/post-campaign-diagnostic.json`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/runs/`
- `experiments/semantic-engine-comparison/results/sem-003d-comp/evaluations/`
