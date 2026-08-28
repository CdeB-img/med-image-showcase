# NOXIA — PRODUCT-CHECKPOINT-01K UNDERSTAND Runtime Defect Repair

> **Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`
> **Normative authority:** `NONE`
> **Mission type:** bounded product runtime repair
> **Date:** 2026-08-28

## Decision

`PRODUCT_01K_PARTIALLY_REPAIRED_WITH_HUMAN_GATES`

The seven current product runtime defects identified by PRODUCT-CHECKPOINT-01J
have been repaired at their observed owners by generic mechanisms. The two
corpus limitations and the three human scientific decisions remain open. In
particular, the two existing T1 senses are not expanded automatically: the
clarification remains fail-closed until the candidate inventory is adjudicated
by a human.

This is a technical product decision. It is not a scientific assessment of the
answers produced by Knowledge.

```text
01J_FINDINGS_RECONCILED = YES
UNASSIGNED_01J_FINDINGS = 0

RUNTIME_DEFECTS_IDENTIFIED = 7
RUNTIME_DEFECTS_ELIGIBLE = 7
RUNTIME_DEFECTS_REPAIRED = 7
RUNTIME_DEFECTS_BLOCKED_BY_HUMAN_GATE = 0

CORPUS_LIMITATIONS_IDENTIFIED = 2
CORPUS_LIMITATIONS_PRESERVED = 2

EXPECTED_BEHAVIORS_IDENTIFIED = 4
EXPECTED_BEHAVIORS_PRESERVED = 4

HUMAN_DECISIONS_IDENTIFIED = 3
NEW_HUMAN_SCIENTIFIC_DECISIONS_INVENTED = 0

CASE_A_FIRST_DIVERGENCE_REPAIRED = YES
CASE_B_FIRST_DIVERGENCE_REPAIRED = YES
CASE_C_AMBIGUITY_FIRST_DIVERGENCE_REPAIRED = NO — HUMAN_DECISION_REQUIRED
CASE_C_PARASITE_SENTENCE_FIRST_DIVERGENCE_REPAIRED = YES

QRY_CHANGED = NO
SCIENTIFIC_CORPUS_CHANGED = NO
SCIENTIFIC_OWNER_DECISION_INVENTED = 0

CANONICAL_FAILED_TESTS = 0
NEW_UNEXPECTED_FAILURES = 0
```

## Git baseline

| Check | Observed value |
|---|---|
| Branch | `protocol-designer-canonical-ingestion` |
| Initial HEAD | `e886fa1c554b978351b209becf25e5073be172dd` |
| `origin/main` | `f504d8fc658ebdf17757e589f610e8f56c24e335` |
| Initial tracked/untracked status | clean |
| Archived 01J report | tracked at initial HEAD |
| Code or corpus change after 01J archival | none before this mission |
| Protected historical artifacts | preserved |
| `.git/info/exclude` | unchanged |

Authorities were consulted in the required order: the current Source-of-Truth
Index, the NOXIA Founding Charter, the Scientific Product Manifesto V2 and the
Editorial Engine Architecture Manifesto. The specialized review used PD-003 V2
and its ownership/relationship contracts, KE-001, PD-004, PD-009, RDE-001 and
RDE-002. No admitted authority was modified and no normative incompatibility
was found.

## 01J finding reconciliation

The complete causal register contains ten findings: seven runtime defects, two
corpus limits and one human-gated ambiguity-inventory question. The four
expected behaviours are tracked separately because they are not defects.

| Finding ID / root cause | Case | Observed symptom | Primary class | First divergent stage | Owner | Runtime defect | Corpus limit | Human decision |
|---|---|---|---|---|---|---:|---:|---:|
| `RC-AB-SYNTHESIS-GLOBAL-FIRST` | shared A/B | a globally first assertion dominated the requested dimensions | synthesis defect | `SYNTHESIS_PRIORITIZATION` | Knowledge synthesis | YES | NO | NO for the generic structural repair |
| `RC-A-STEMI-RESOLUTION` | A | governed STEMI identity remained unresolved | runtime defect | `TERM_RESOLUTION` | Knowledge concept resolution | YES | NO | NO |
| `RC-A-STENTING-COVERAGE` | A | exact stenting applicability absent | corpus coverage limitation | `CORPUS_COVERAGE` | Knowledge corpus governance | NO | YES | YES |
| `RC-B-INTAKE-PLURAL-COMPARISON` | B | plural `différences` not detected by intake | query/intake defect | `PRODUCT_INTAKE_RELATION_DETECTION` | Product router | YES | NO | NO |
| `RC-B-REQUEST-PLURAL-COMPARISON` | B | Knowledge request emitted `EXPLAIN` | query-planning precursor | `KNOWLEDGE_REQUEST_BUILDING` | Knowledge request/query planning | YES | NO | NO |
| `RC-B-CT-MODALITY-NORMALIZATION` | B | seven governed CT assertions were rejected | runtime defect | `APPLICABILITY` | Knowledge applicability | YES | NO | NO |
| `RC-B-RESULT-PROJECTION-SCOPE` | B | excluded-only sources and unrelated limits reached the presentation | projection relevance defect | `ASSERTION_SELECTION` | Knowledge result and UNDERSTAND composition | YES | NO | NO |
| `RC-B-GENERAL-COMPARISON-COVERAGE` | B | no general MRI/CT comparison is admitted | corpus coverage limitation | `CORPUS_COVERAGE` | Knowledge corpus governance | NO | YES | YES |
| `RC-C-T1-CANDIDATE-INVENTORY` | C | existing two-sense inventory may be narrower than the governed local inventory | unknown requiring review | `AMBIGUITY_CANDIDATE_GENERATION` | Knowledge concept resolution plus human governance | NO pending adjudication | NO | YES |
| `RC-C-UNTYPED-BRANCH-COMPARISON` | C | ambiguity branches created a direct-comparison gap | projection relevance defect | `GAP_SELECTION` | Knowledge gap selection | YES | NO | NO |

Expected behaviours preserved:

1. A, B and C route to `UNDERSTAND` with zero Project writes and zero protocol
   projections.
2. B preserves `NO_STUDY` and `NO_PROTOCOL` and creates no Project path.
3. C stops provider execution and asks for clarification without choosing a T1
   sense.
4. “Que souhaitez-vous comprendre ou comparer ?” remains an intent-aware input
   placeholder and is not attributed to QRY.

## Repair eligibility

All seven runtime defects were eligible: each had an identified owner, required
no corpus addition and required no scientific choice. The bounded repair does
not change the scientific content of any assertion.

`RC-C-T1-CANDIDATE-INVENTORY` was not eligible. Although the prompt asks to
repair candidate filtering where possible, the prior admitted 01J evidence
explicitly classifies the correct candidate subset as a human
scientific/contractual decision. The higher fail-closed condition therefore
governs: the current candidates remain unchanged and traceable.

## Runtime defects repaired

### `RC-AB-SYNTHESIS-GLOBAL-FIRST`

```text
FINDING_ID = RC-AB-SYNTHESIS-GLOBAL-FIRST
ROOT_CAUSE_ID = RC-AB-SYNTHESIS-GLOBAL-FIRST
OWNER = KNOWLEDGE_SYNTHESIS
FIRST_DIVERGENT_STAGE = SYNTHESIS_PRIORITIZATION
REPAIR_APPLIED = YES
REPAIR_MECHANISM = generic structural relevance ordering plus existing typed comparative relations
FILES_CHANGED = synthesizer.ts; relation-semantics.ts; adapter-utils.ts
REGRESSION_TESTS = exact A; exact B; CBF/perfusion sibling
STRUCTURAL_READBACK_RESULT = A exposes a REPRESENTS relation tied to reperfusion; B exposes the admitted MR/CT method-distinction relation
HUMAN_DECISION_REQUIRED = NO for this structural ordering
REMAINING_LIMITATION = no scientific ranking, best-answer claim or completeness claim is introduced
```

### `RC-A-STEMI-RESOLUTION`

```text
FINDING_ID = RC-A-STEMI-RESOLUTION
ROOT_CAUSE_ID = RC-A-STEMI-RESOLUTION
OWNER = KNOWLEDGE_CONCEPT_RESOLUTION
FIRST_DIVERGENT_STAGE = TERM_RESOLUTION
REPAIR_APPLIED = YES
REPAIR_MECHANISM = generic exact/alias resolution from governed Knowledge Graph entities with raw-term and provider identity preservation
FILES_CHANGED = concept-resolver.ts; query-planner.ts
REGRESSION_TESTS = exact A; acute-ischaemic-stroke sibling; STEMIOLOGY anti-overreach
STRUCTURAL_READBACK_RESULT = STEMI resolves to noxia:radiology:disease:stemi and remains bound to originalTerms=[STEMI]
HUMAN_DECISION_REQUIRED = NO
REMAINING_LIMITATION = exact post-stenting scientific applicability remains undocumented
```

### `RC-B-INTAKE-PLURAL-COMPARISON`

```text
FINDING_ID = RC-B-INTAKE-PLURAL-COMPARISON
ROOT_CAUSE_ID = RC-B-INTAKE-PLURAL-COMPARISON
OWNER = PRODUCT_ROUTER
FIRST_DIVERGENT_STAGE = PRODUCT_INTAKE_RELATION_DETECTION
REPAIR_APPLIED = YES
REPAIR_MECHANISM = one shared language-level comparison-expression detector supporting admitted singular/plural forms
FILES_CHANGED = scientific-request-language.ts; journey.ts
REGRESSION_TESTS = exact B; OEF PET/IRM plural sibling; T2 single-context anti-overreach
STRUCTURAL_READBACK_RESULT = requested relation is comparison; route remains UNDERSTAND
HUMAN_DECISION_REQUIRED = NO
REMAINING_LIMITATION = linguistic detection does not assert a scientific relationship
```

### `RC-B-REQUEST-PLURAL-COMPARISON`

```text
FINDING_ID = RC-B-REQUEST-PLURAL-COMPARISON
ROOT_CAUSE_ID = RC-B-REQUEST-PLURAL-COMPARISON
OWNER = KNOWLEDGE_REQUEST_QUERY_PLANNING
FIRST_DIVERGENT_STAGE = KNOWLEDGE_REQUEST_BUILDING
REPAIR_APPLIED = YES
REPAIR_MECHANISM = reuse the same comparison-expression contract in Knowledge request classification
FILES_CHANGED = knowledge-request.ts; scientific-request-language.ts
REGRESSION_TESTS = exact B; OEF PET/IRM plural sibling; T2 single-context anti-overreach
STRUCTURAL_READBACK_RESULT = requestType=COMPARE and knowledgePurpose=COMPARE with MRI and CT branches
HUMAN_DECISION_REQUIRED = NO
REMAINING_LIMITATION = general scientific comparability remains bounded by corpus coverage
```

### `RC-B-CT-MODALITY-NORMALIZATION`

```text
FINDING_ID = RC-B-CT-MODALITY-NORMALIZATION
ROOT_CAUSE_ID = RC-B-CT-MODALITY-NORMALIZATION
OWNER = KNOWLEDGE_APPLICABILITY
FIRST_DIVERGENT_STAGE = APPLICABILITY
REPAIR_APPLIED = YES
REPAIR_MECHANISM = canonical modality identity comparison for existing CT/MR/MRI/IRM and PET/TEP identities
FILES_CHANGED = modality.ts; applicability.ts; coverage-map.ts; conflict-gap-analyzer.ts; understand-projection.ts
REGRESSION_TESTS = exact B plus existing Knowledge mandatory/reasoning/product-checkpoint suites
STRUCTURAL_READBACK_RESULT = CT branch is retained; exact regression observes at least seven applicable governed CT assertions
HUMAN_DECISION_REQUIRED = NO
REMAINING_LIMITATION = modality compatibility does not imply evidence symmetry or general comparability
```

### `RC-B-RESULT-PROJECTION-SCOPE`

```text
FINDING_ID = RC-B-RESULT-PROJECTION-SCOPE
ROOT_CAUSE_ID = RC-B-RESULT-PROJECTION-SCOPE
OWNER = KNOWLEDGE_RESULT_AND_UNDERSTAND_COMPOSITION
FIRST_DIVERGENT_STAGE = ASSERTION_SELECTION
REPAIR_APPLIED = YES
REPAIR_MECHANISM = evidence/source/provenance scoped to retained applicable items and answer limitations scoped to displayed support
FILES_CHANGED = engine.ts; knowledge-result.ts; understand-projection.ts; product-entry-routing.ts
REGRESSION_TESTS = exact B and PRODUCT-CHECKPOINT-01G/01I regressions
STRUCTURAL_READBACK_RESULT = evidence refs all point to retained applicable items; sources all contribute to retained evidence/statements; unrelated excluded-only limits are absent from presentation
HUMAN_DECISION_REQUIRED = NO
REMAINING_LIMITATION = provider executions and TRACE remain separately inspectable; projection remains derived, not truth
```

### `RC-C-UNTYPED-BRANCH-COMPARISON`

```text
FINDING_ID = RC-C-UNTYPED-BRANCH-COMPARISON
ROOT_CAUSE_ID = RC-C-UNTYPED-BRANCH-COMPARISON
OWNER = KNOWLEDGE_GAP_SELECTION
FIRST_DIVERGENT_STAGE = GAP_SELECTION
REPAIR_APPLIED = YES
REPAIR_MECHANISM = comparison coverage and comparison gaps are created only for a typed COMPARE request, not merely because a plan has multiple branches
FILES_CHANGED = conflict-gap-analyzer.ts; coverage-map.ts
REGRESSION_TESTS = exact C; exact B positive comparison-gap retention; T2 single-context negative
STRUCTURAL_READBACK_RESULT = C keeps AMBIGUOUS_KNOWN_CONCEPT and has no DIRECT_COMPARISON gap or comparison:direct coverage item
HUMAN_DECISION_REQUIRED = NO
REMAINING_LIMITATION = T1 candidate-set adequacy remains human-gated
```

## Runtime defects not repairable in this tranche

No finding classified by 01J as a current runtime defect remains unrepaired.
The unresolved C candidate-inventory question is not reclassified as a runtime
defect: it remains `UNKNOWN_REQUIRES_REVIEW` and `HUMAN_DECISION_REQUIRED`.

## Case A — term resolution

The resolver no longer relies only on its fixed local rule array. It can read
already governed active Knowledge Graph identities, match labels/aliases/slugs
with token boundaries, preserve the raw matching term and publish explicit
provider mappings. Static modality mappings were retained to prevent duplicate
resolution paths.

The exact readback preserves the original question verbatim. The normalized
concept layer contains no-reflow, reperfusion, stenting, STEMI and cardiac MRI.
STEMI is now `noxia:radiology:disease:stemi`; no `SAME_AS` relation is invented
between no-reflow and MVO. The existing contextual
`CONTEXT_DEPENDENT_RELATION` remains explicit.

## Case B — intake relation detection

Product intake and Knowledge request building now share one neutral linguistic
comparison detector. It recognizes the plural `différences` as a requested
relation, while the existing exclusion parser independently preserves
`NO_STUDY` and `NO_PROTOCOL`. The request is therefore `COMPARE`, yet the product
route remains `UNDERSTAND` and Project construction remains ineligible.

The query plan preserves MRI and CT as two canonical modality branches. No
ECV-specific comparator, forced assertion or downstream Study Design suppression
was added.

## Case C — ambiguity candidates

The current candidates remain exactly:

- `method:t1-mapping`, with provider references to P4R and RB-004;
- `measurement:native-t1`, with provider references to P4R and RB-004.

The decision remains `CLARIFICATION_REQUIRED`; no provider is selected, no T1
sense is adopted, and “Je ne sais pas” remains available. The broader candidate
inventory question is one of the three preserved human decisions.

## Case C — gap relevance

Multiple branches no longer imply comparison by themselves. Only an explicit
`COMPARE` request can create direct-comparison coverage/gaps. Therefore Case C
retains its ambiguity gap but no longer receives the unrelated MRI/CT comparison
sentence. Case B demonstrates the positive counterpart: its comparison gap
remains visible because its operation really is comparison and the corpus
retains `NO_GENERAL_MRI_CT_COMPARISON`.

## Shared root cause

```text
SHARED_ROOT_CAUSE_ID = RC-AB-SYNTHESIS-GLOBAL-FIRST
CASES_AFFECTED = A, B
OWNER = KNOWLEDGE_SYNTHESIS
FIRST_DIVERGENT_STAGE = SYNTHESIS_PRIORITIZATION
MECHANISM = global assertion-ID order ignored requested concepts, context, modalities and typed relations
REPAIR_ELIGIBLE = YES
```

The repair ranks only structural overlap with request terms, resolved governed
concept bindings, known context and canonical modalities. It does not rank
scientific quality. For `COMPARE`, it uses typed cross-branch relations already
present in admitted assertions. This single owner-level change improves A and B
without duplicated UI compensation.

## QRY non-defect preserved

No QRY file, type, ranking, decision or runtime was changed. The input-area
phrase remains a UI placeholder. `QRY_RESTATEMENT_DEFECT_CONFIRMED = NO` and
`INPUT_PLACEHOLDER_MISREAD_AS_QRY = YES` remain the accepted forensic findings.

## Corpus limitations preserved

| Limitation ID | Case | Requested dimension | Current local coverage | What runtime improved | What runtime cannot supply |
|---|---|---|---|---|---|
| `RC-A-STENTING-COVERAGE` | A | exact reperfusion/stenting context for no-reflow/MVO in STEMI CMR | governed MVO/reperfusion material exists, but selected assertions explicitly do not document stenting | governed identity/term propagation and structurally relevant selection | a new assertion establishing exact stenting applicability |
| `RC-B-GENERAL-COMPARISON-COVERAGE` | B | general MRI-versus-CT ECV comparison | bounded method-distinction and asymmetric, heterogeneous evidence; provider declares `NO_GENERAL_MRI_CT_COMPARISON` | retain both branches and the bounded typed relation | symmetric evidence, universal comparability or a general scientific conclusion |

No source, assertion, EvidenceLink, corpus admission or alias truth was added.

## Human decisions preserved

| Decision gate ID | Case | Why human required | Runtime may do now | Runtime must not decide |
|---|---|---|---|---|
| `HUMAN-A-STENTING-COVERAGE` | A | admitting evidence for exact post-stenting applicability changes scientific coverage | preserve limitation, unresolved coverage and existing evidence | invent or admit a stenting assertion |
| `HUMAN-B-GENERAL-COMPARISON-COVERAGE` | B | extending bounded MR/CT evidence to a general comparison is a scientific corpus decision | expose branches, bounded relation, gaps and limitations | claim universal or symmetric comparability |
| `RC-C-T1-CANDIDATE-INVENTORY` | C | choosing the scientifically appropriate subset from a broader local typed inventory requires scientific/contractual adjudication | preserve current candidates, provenance and clarification | add, remove, rank or adopt a T1 sense |

## Files changed

Product/Knowledge runtime:

- `src/lib/scientific-request-language.ts`
- `src/features/protocol-designer/intake/journey.ts`
- `src/features/protocol-designer/functional-reset/product-entry-routing.ts`
- `src/features/knowledge-engine/adapters/adapter-utils.ts`
- `src/features/knowledge-engine/applicability.ts`
- `src/features/knowledge-engine/concept-resolver.ts`
- `src/features/knowledge-engine/conflict-gap-analyzer.ts`
- `src/features/knowledge-engine/coverage-map.ts`
- `src/features/knowledge-engine/engine.ts`
- `src/features/knowledge-engine/knowledge-request.ts`
- `src/features/knowledge-engine/knowledge-result.ts`
- `src/features/knowledge-engine/modality.ts`
- `src/features/knowledge-engine/query-planner.ts`
- `src/features/knowledge-engine/relation-semantics.ts`
- `src/features/knowledge-engine/synthesizer.ts`
- `src/features/knowledge-engine/understand-projection.ts`

Regression evidence:

- `src/features/knowledge-engine/__tests__/product-checkpoint-01k-understand-runtime-repair.test.ts`
- this Level 3 report.

No corpus, authority, QRY, Project model, Editorial Engine, deployment, release
gate, persistence or protected-artifact file changed.

## Mechanism-level regression proofs

| Proof family | Exact case | Generic sibling | Negative / boundary proof |
|---|---|---|---|
| term provenance and governed resolution | A / STEMI | governed acute ischaemic stroke label | `STEMIOLOGY` does not match STEMI |
| relation detection and branch preservation | B / plural `différences` | OEF `similitudes` between PET and MRI | single-modality T2 explanation creates no comparison |
| explicit negation and no implicit Study Design | B | existing 01B/01D routing regressions | zero Project writes and protocol projections |
| ambiguity without invention | C | existing Knowledge ambiguity regressions | providers stay excluded until clarification |
| gap relevance | B retains relevant comparison gap | existing comparison coverage regressions | C and single-modality T2 exclude comparison artifacts |
| structural synthesis relevance | A and B | CBF/perfusion sibling | no scientific score, adoption or new assertion |

## Deterministic A/B/C readback

### A

```text
RAW_USER_TERMS = no-reflow; reperfusion; stenting; STEMI; IRM cardiaque
RESOLVED_CONCEPTS = phenomenon:no-reflow; context:reperfusion; intervention:stenting; noxia:radiology:disease:stemi; modality:mri; governed cardiac context identities
PRESERVED_RAW_TERMS = exact originalQuestion plus originalTerms=[no-reflow], [reperfusion], [stent], [STEMI], [irm cardiaque]
QUERY_RELATIONS = CONTEXT_DEPENDENT_RELATION(no-reflow, microvascular-obstruction); no SAME_AS
QUERY_CONSTRAINTS = exact post-stenting applicability remains explicitly not documented
SELECTED_BRANCHES = branch:exact
SELECTED_GAPS = none generated; corpus limitation remains in result limitations
VISIBLE_SYNTHESIS_DIMENSIONS = MVO/no-reflow representation; tissue-level reperfusion; CMR appearance
PROJECT_WRITES = 0
PROTOCOL_PROJECTIONS = 0
EXTERNAL_CALLS = 0
```

The readback does not claim a complete scientific answer: STEMI and stenting are
structurally retained, but no new scientific relation about them is invented.

### B

```text
REQUESTED_ACTION = UNDERSTAND
COMPARISON_RELATION = PRESENT; requestType=COMPARE; knowledgePurpose=COMPARE
BRANCH_A = MRI
BRANCH_B = CT
EXPLICIT_NEGATIONS = NO_STUDY; NO_PROTOCOL
STUDY_DESIGN_ACTION_CREATED = NO
PROTOCOL_ACTION_CREATED = NO
MRI_EVIDENCE_BRANCH = PRESENT; conflicting positions remain explicit
CT_EVIDENCE_BRANCH = PRESENT; 25 applicable items reported by the projection from 2 contributing corpora
COMPARATIVE_SYNTHESIS_STRUCTURE = IS_METHOD_DISTINCT_FROM(myocardial-ecv-mr, myocardial-ecv-ct)
COVERAGE_STATUS = PARTIAL
DIRECT_COMPARISON_GAP = PRESENT
NO_GENERAL_MRI_CT_COMPARISON = PRESERVED
PROJECT_WRITES = 0
PROTOCOL_PROJECTIONS = 0
EXTERNAL_CALLS = 0
```

The branch counts are structural. They do not establish symmetry, scientific
quality or general comparability.

### C

```text
AMBIGUITY_DECISION = CLARIFICATION_REQUIRED
CANDIDATE_SENSES = method:t1-mapping; measurement:native-t1
CANDIDATE_PROVENANCE = P4R and RB-004 provider concept references on each candidate
CLARIFICATION_TEXT = “Quand vous dites t1, parlez-vous de T1 mapping ou de T1 natif ?”
SELECTED_GAPS = AMBIGUOUS_KNOWN_CONCEPT
PARASITE_COMPARISON_SENTENCE_PRESENT = NO
PROVIDER_EXECUTIONS_INCLUDED = 0
PROJECT_WRITES = 0
PROTOCOL_PROJECTIONS = 0
EXTERNAL_CALLS = 0
```

```text
CASE_A_LOCAL_READBACK = PASS_STRUCTURAL
CASE_B_LOCAL_READBACK = PASS_STRUCTURAL_WITH_PRESERVED_CORPUS_LIMITATION
CASE_C_LOCAL_READBACK = PARTIAL_HUMAN_GATE_PRESERVED; PARASITE_GAP_REPAIRED
```

## Targeted validation

One final focused command covered the new 01K file and six relevant existing
Knowledge/Product checkpoint suites:

```text
TARGETED_TEST_FILES = 7
TARGETED_TESTS_PASSED = 59
TARGETED_TESTS_FAILED = 0
TARGETED_PROCESS_EXIT = 0

01K_NEW_TESTS_PASSED = 8
01K_NEW_TESTS_FAILED = 0
```

The targeted suite includes PRODUCT-CHECKPOINT-01B, 01D, 01G and 01I plus
Knowledge mandatory/reasoning regressions. `git diff --check` passed and the
targeted secret scan found no secret signature.

## Canonical typecheck

The canonical command was executed exactly once after targeted validation.

```text
COMMAND = npm run typecheck
TYPECHECK = PASS
PROCESS_EXIT = 0
TYPESCRIPT_ERRORS = 0
APP_MODULE_RESOLUTION = BUNDLER
VERCEL_API_MODULE_RESOLUTION = NODENEXT
RUNTIME_ALIAS_COUNT = 0
EXTENSIONLESS_RELATIVE_IMPORT_COUNT = 0
NODE_ESM_HANDLER_LOAD = PASS
```

## Canonical tests

The canonical command was executed exactly once after the typecheck.

```text
COMMAND = npm test -- --reporter=json --outputFile=/tmp/noxia-product-01k-vitest.json
CANONICAL_TEST_FILES = 460
CANONICAL_PASSED_TESTS = 3252
CANONICAL_FAILED_TESTS = 0
CANONICAL_SKIPPED_TESTS = 12
CANONICAL_TOTAL_TESTS = 3264
PROCESS_EXIT = 0
JSON_SUCCESS = true
NEW_UNEXPECTED_FAILURES = 0
```

The skip inventory remains exactly 12. The canonical discovery contract reads
tracked test files from Git. Because the new 01K test was intentionally not
staged before the final commit gate, it did not alter this canonical count; it
was explicitly included in the focused invocation and passed 8/8. No second
canonical run was performed to conceal this distinction.

## Remaining product findings

```text
RUNTIME_DEFECTS_REMAINING = 0
CORPUS_COVERAGE_LIMITATIONS_REMAINING = 2
HUMAN_SCIENTIFIC_DECISIONS_REMAINING = 3
```

The product still cannot claim exact post-stenting coverage, general MRI/CT ECV
comparability or a human-approved complete T1 ambiguity inventory. These limits
are intentionally visible. Hands-on product behaviour and scientific quality
were not adjudicated in this mission.

## Fourteen technical debts preserved

None of the post-canonical-green debts was silently closed, removed or
reclassified:

| Debt | Status after 01K |
|---|---|
| `FG-001` | `UNCHANGED_OPEN_DEBT` |
| `FG-002` | `UNCHANGED_OPEN_DEBT` |
| `REP-001` | `UNCHANGED_OPEN_DEBT` |
| `LEG-CFG-001` | `UNCHANGED_OPEN_DEBT` |
| `PERS-001` | `UNCHANGED_OPEN_DEBT` |
| `TEST-001` | `UNCHANGED_OPEN_DEBT` |
| `TD-002` | `UNCHANGED_OPEN_DEBT` |
| `TD-003` | `UNCHANGED_OPEN_DEBT` |
| `REP-002` | `UNCHANGED_OPEN_DEBT` |
| `PERF-001` | `UNCHANGED_OPEN_DEBT` |
| `DOC-001` | `UNCHANGED_OPEN_DEBT` |
| `WARN-001` | `UNCHANGED_OPEN_DEBT` |
| `STRICT-NODE-001` | `UNCHANGED_OPEN_DEBT` |
| `HYG-001` | `UNCHANGED_OPEN_DEBT` |

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
EXTERNAL_SEARCH = 0
BROWSER = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
FULL_CANONICAL_TEST_RUNS = 1
```

## Git

One bounded local commit is authorized only after the exact source, regression
test and this report are staged explicitly and the staged diff passes. No push,
merge or deployment is authorized by this report.

```text
PRODUCT_RUNTIME_CHANGED = YES
SCIENTIFIC_RUNTIME_CHANGED = YES — KNOWLEDGE OWNER ONLY
SCIENTIFIC_CORPUS_CHANGED = NO

PUSH = NO
DEPLOYMENT = NO
SCIENTIFIC_PASS = NO
PD011_PASS = NO
WAVE_2_AUTHORIZED = NO
```
