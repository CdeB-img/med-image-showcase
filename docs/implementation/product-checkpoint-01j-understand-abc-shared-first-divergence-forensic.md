# NOXIA — PRODUCT-CHECKPOINT-01J

## UNDERSTAND A/B/C — Shared First-Divergence Forensic

| Field | Value |
|---|---|
| Mission | `PRODUCT-CHECKPOINT-01J` |
| Classification | `LEVEL_3_IMPLEMENTATION_EVIDENCE` |
| Normative authority | `NONE` |
| Method | Read-only static inspection plus one focused deterministic local readback |
| External scientific judgment | Not performed |
| Runtime repair | None |
| Corpus change | None |
| Product mutation | None |

## Decision

`PRODUCT_01J_MULTIPLE_FIRST_DIVERGENCES_IDENTIFIED`

The four required first-divergence questions do not converge on one common
first stage:

- Case A first loses the governed `STEMI` meaning in concept resolution;
- Case B first loses the requested comparison relation in product-intake
  relationship detection, then independently classifies the same plural
  wording as `EXPLAIN` when the Knowledge request is built;
- Case C ambiguity candidate quality is bounded by a hardcoded two-sense list
  despite a broader governed local T1 inventory;
- Case C's parasite comparison sentence is first created by gap selection,
  which interprets any multi-branch plan as a requested comparison.

One downstream runtime defect is shared by A and B: the non-comparison
synthesis path globally sorts conclusions and promotes one first assertion
without ranking it against the requested dimensions. This shared downstream
mechanism does not erase the different first divergences.

No scientific answer is declared correct or incorrect by this report.

```text
CASE_A_FIRST_DIVERGENT_STAGE = TERM_RESOLUTION
CASE_B_FIRST_DIVERGENT_STAGE = OTHER — PRODUCT_INTAKE_RELATION_DETECTION
CASE_C_AMBIGUITY_FIRST_DIVERGENT_STAGE = AMBIGUITY_CANDIDATE_GENERATION
CASE_C_PARASITE_SENTENCE_FIRST_DIVERGENT_STAGE = GAP_SELECTION

SHARED_ROOT_CAUSE_COUNT = 1
DISTINCT_ROOT_CAUSE_COUNT = 9

CURRENT_PRODUCT_RUNTIME_DEFECTS = 7
CORPUS_COVERAGE_LIMITATIONS = 2
EXPECTED_BEHAVIORS = 4

QRY_RESTATEMENT_DEFECT_CONFIRMED = NO
INPUT_PLACEHOLDER_MISREAD_AS_QRY = YES

HUMAN_SCIENTIFIC_DECISIONS_REQUIRED = 3
```

## Git baseline

| Check | Observed |
|---|---|
| Branch | `protocol-designer-canonical-ingestion` |
| HEAD | `253dfa8e3ee3cc5e53bd2e15b7e5aae0e20cfa35` |
| `origin/main` | `f504d8fc658ebdf17757e589f610e8f56c24e335` |
| Initial `git status --short` | empty |
| Production marker supplied by the human | `DEV · f504d8f` |
| Canonical tests last measured, supplied baseline | `3252 passed / 0 failed / 12 skipped / 3264 total` |

The diff from `f504d8fc658ebdf17757e589f610e8f56c24e335` to HEAD contains
41 paths and `+6572/-103` lines. They are Level 3 reports, tests, governed test
fixtures, canonical-test discovery/configuration, scientific reporting tools,
and the repository-local protected-surface inspection helper. Static inspection
found no change to the product entry runtime, Knowledge runtime, scientific
owner runtime, or scientific corpus contents used by A/B/C. In particular,
`protected-surfaces.mjs` changes how a test/reporting boundary is inspected; it
does not change scientific retrieval, applicability, synthesis, or product UI.

```text
PRODUCT_RUNTIME_DIFF_f504_TO_HEAD = 0
SCIENTIFIC_RUNTIME_DIFF_f504_TO_HEAD = 0
SCIENTIFIC_CORPUS_DIFF_f504_TO_HEAD = 0
```

Authorities were read in the mandatory order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, official version 1.45;
2. NOXIA — Charte fondatrice, editorial PDF edition;
3. NOXIA Protocol Designer — Scientific Product Manifesto V2, PDF edition;
4. Editorial Engine — Architecture Manifesto, version 1.0.

Specialized authorities actually used were KE-001, PD-009, PD-004, the PD-003
V2 Ownership Matrix, and the applicable RDE/Protocol Designer boundaries.
Their applicable rules agree: Knowledge owns concept resolution, applicability,
assertions, gaps, limitations and Knowledge synthesis; navigation/QRY owns a
next action; a projection does not acquire scientific ownership; no owner or UI
projection may silently promote knowledge or mutate Project truth. No
documentary or normative contradiction requiring arbitration was found.

## Production hands-on evidence

The following evidence is retained as direct human-observed Production evidence,
not rewritten as a reference answer.

### Case A

- Input: “Je voudrais comprendre le rôle du no-reflow après reperfusion et
  stenting dans le STEMI en IRM cardiaque.”
- Status: `Réponse étayée`.
- Main answer: “Les connaissances internes documentent que Observed prognostic
  association of MVO does not by itself establish causality.”
- Visible counts: 5 supported items, 3 sources, 10 limitations, 0
  contradictions/debates, 1 gap, 2 provenance entries.
- Input-area text: “Que souhaitez-vous comprendre ou comparer ?”

### Case B

- Input: “Je voudrais comprendre les différences entre la mesure de l’ECV en
  IRM et en CT. Je ne souhaite pas concevoir une étude ni un protocole.”
- Status: `Réponse partielle`.
- Main answer is MRI-dominant: CMR blood-pool ROI placement, method dependence,
  the four MRI T1 inputs, and one contextual debate.
- Visible counts: 6 supported items, 20 sources, 19 limitations, 1
  contradiction/debate, 2 gaps, 3 provenance entries.
- The explicit refusal is preserved and no Study Design/protocol branch is
  displayed.
- Input-area text: “Que souhaitez-vous comprendre ou comparer ?”

### Case C

- Input: “Je voudrais comprendre le rôle du T1 en IRM.”
- Status: `Clarification requise`.
- Leading sentence: “Aucune comparaison générale directe des branches demandées
  n’est documentée ; les résultats restent séparés par modalité.”
- Clarification: “Quand vous dites t1, parlez-vous de T1 mapping ou de T1
  natif ?”
- Choices: `T1 mapping`, `T1 natif`, `Je ne sais pas`.
- Visible counts: 0 sources, 0 limitations, 0 contradictions/debates, 3 gaps,
  0 provenance entries.
- Input-area text: “Que souhaitez-vous comprendre ou comparer ?”

The focused local readback reproduced the observed main sentences and visible
counts, then exposed the deterministic routing, Knowledge states and zero-write
boundaries without any external call. The Production evidence remains the
product observation; the readback is implementation evidence explaining it.

## Nominal UNDERSTAND corridor

The actual current corridor is below. QRY is not part of this first-turn
UNDERSTAND execution.

| STAGE_ID | FUNCTION | FILE | OWNER | INPUT_TYPE | OUTPUT_TYPE | CAN_MUTATE_PROJECT | USED_BY_A | USED_BY_B | USED_BY_C |
|---|---|---|---|---|---|---|---|---|---|
| U01 | `submit` | `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx:221` | Protocol Designer product | browser form text | conversation turn + dispatch | NO for UNDERSTAND | YES | YES | YES |
| U02 | `routeProductEntry` | `src/features/protocol-designer/functional-reset/product-entry-routing.ts:185` | Product router | raw turn + previous session context | `ProductEntryRoutingDecision` | NO | YES | YES | YES |
| U03 | `buildScientificSessionContext` / `detectedRelationships` | `src/features/protocol-designer/intake/journey.ts` | Product intake/router | validated raw intent | `ScientificSessionContext` | NO | YES | YES | YES |
| U04 | `executeProductUnderstandInteraction` | `src/features/protocol-designer/functional-reset/product-entry-routing.ts:331` | UNDERSTAND product boundary | raw turn + routing decision | `ProductUnderstandInteraction` | NO | YES | YES | YES |
| U05 | `executeKnowledgeEngineForPresentation` | `src/features/knowledge-engine/presentation.ts:43` | Knowledge presentation boundary | request candidates | strict execution or bounded diagnostic | NO | YES | YES | YES |
| U06 | `createKnowledgeRequest` / `classifyPurpose` | `src/features/knowledge-engine/knowledge-request.ts:54` | Knowledge request building | normalized question, objects, relations, exclusions | `KnowledgeRequest` | NO | YES | YES | YES |
| U07 | `resolveConcepts` | `src/features/knowledge-engine/concept-resolver.ts:73` | Knowledge concept resolution | `KnowledgeRequest` | `ConceptResolution` | NO | YES | YES | YES |
| U08 | `createQueryPlan` / `buildBranches` | `src/features/knowledge-engine/query-planner.ts:17` | Knowledge query planning | request + resolution | `QueryPlan` | NO | YES | YES | YES |
| U09 | `retrieveKnowledge` | `src/features/knowledge-engine/retrieval.ts:10` | Knowledge retrieval | request + plan | local adapter results | NO | YES | YES | stopped by clarification |
| U10 | `applyApplicability` | `src/features/knowledge-engine/applicability.ts:44` | Knowledge applicability | retrieved assertions + context | applicable/excluded assertions | NO | YES | YES | no assertions |
| U11 | `resolveAssertions` | `src/features/knowledge-engine/assertion-resolver.ts:13` | Knowledge assertion selection | applicability-qualified assertions | applicable/candidate/excluded sets | NO | YES | YES | empty |
| U12 | `determineCoverage` / `buildCoverageMap` | `src/features/knowledge-engine/conflict-gap-analyzer.ts:25`, `coverage-map.ts:20` | Knowledge coverage | plan + owner results | coverage status/map | NO | YES | YES | YES |
| U13 | `analyzeGaps` / `analyzeConflicts` | `src/features/knowledge-engine/conflict-gap-analyzer.ts:58` | Knowledge gaps/conflicts | coverage + selected assertions | typed gaps/conflicts | NO | YES | YES | YES |
| U14 | `synthesizeKnowledge` | `src/features/knowledge-engine/synthesizer.ts:79` | Knowledge synthesis | assertions, statements, evidence, gaps, conflicts | `RuntimeKnowledgeSynthesis` | NO | YES | YES | YES |
| U15 | `createKnowledgeResult` | `src/features/knowledge-engine/knowledge-result.ts:6` | Knowledge result | full owner execution material | immutable `KnowledgeResult` | NO | YES | YES | YES |
| U16 | `projectUnderstandResult` / `buildAnswerStatements` / `clarificationFor` | `src/features/knowledge-engine/understand-projection.ts:195` | UNDERSTAND projection | `KnowledgeResult` | `UnderstandProjection` | NO | YES | YES | YES |
| U17 | `knowledgePresentation` / `readableKnowledgeReply` | `src/features/protocol-designer/functional-reset/product-entry-routing.ts` | Product composition | Knowledge result + projection | product presentation + assistant text | NO | YES | YES | YES |
| U18 | `ProductUnderstandResponse` rendering | `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx` | Protocol Designer UX | product presentation | visible cards/text | NO | YES | YES | YES |
| U19 | `productEntryPromptForIntent` | `src/features/protocol-designer/functional-reset/session.ts:53` | Protocol Designer UX | active route intent | input placeholder string | NO | YES | YES | YES |

The only QRY code reachable in this workspace is post-adoption navigation. On
an UNDERSTAND turn, any already-pending `queryNavigation` is preserved
byte-for-byte and is neither invoked nor mutated. For these initial cases there
is no QRY input, QRY output, selected action, or canonical next action.

### Mandatory summary table

These statuses are stage-local. They are not a scientific PASS/FAIL and do not
supersede the detailed causal traces.

| CASE | RAW INTENT PRESERVED | ROUTING | QUERY PLAN | COVERAGE | APPLICABILITY | ASSERTION SELECTION | SYNTHESIS | CLARIFICATION | QRY | PROJECTION | FIRST DIVERGENT STAGE | OWNER |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | PASS | PASS | PARTIAL | PARTIAL | PARTIAL | PARTIAL | FAIL | NOT_APPLICABLE | NOT_APPLICABLE | PARTIAL | `TERM_RESOLUTION` | `KNOWLEDGE_CONCEPT_RESOLUTION` |
| B | PASS | PARTIAL | FAIL | PARTIAL | FAIL | FAIL | FAIL | NOT_APPLICABLE | NOT_APPLICABLE | FAIL | `OTHER — PRODUCT_INTAKE_RELATION_DETECTION` | `PRODUCT_ROUTER` |
| C | PASS | PASS | PARTIAL | PARTIAL | NOT_APPLICABLE | NOT_APPLICABLE | PASS | PARTIAL | NOT_APPLICABLE | FAIL | `AMBIGUITY_CANDIDATE_GENERATION` (C1); `GAP_SELECTION` (C2) | `KNOWLEDGE_CONCEPT_RESOLUTION`; `KNOWLEDGE_GAP_SELECTION` |

## Case A trace

| TRACE ELEMENT | VALUE | SOURCE_FUNCTION | OWNER | PROVENANCE | DETERMINISTIC | FIRST_POINT_WHERE_EXPECTED_SEMANTICS_ARE_LOST |
|---|---|---|---|---|---|---|
| RAW_USER_INTENT | Exact supplied sentence; asks role after reperfusion/stenting in STEMI and CMR | `submit` | Product | human Production evidence | YES | NO |
| ROUTED_INTENT | `UNDERSTAND`; `IN_SCOPE`; no Project eligibility | `routeProductEntry` | Product router | raw turn | YES | NO |
| NORMALIZED_TERMS | `no-reflow`, `stent`, `STEMI`, `IRM cardiaque`, plus extracted `reperfusion` | `preservedScientificTerms`, `extractScientificObjectTerms` | Product + Knowledge | raw turn | YES | NO |
| RESOLVED_CONCEPTS | MRI; no-reflow; stenting; reperfusion; document-bound MVO; `STEMI` unresolved | `resolveConcepts` | Knowledge concept resolution | local rules | YES | **YES — STEMI** |
| QUERY_PLAN | one exact branch containing MRI/no-reflow/MVO/stenting/reperfusion; no STEMI concept | `createQueryPlan` | Knowledge query planning | concept resolution | YES | NO, reflects upstream loss |
| REQUESTED_BRANCHES | `branch:exact` | `buildBranches` | Knowledge query planning | request type `EXPLAIN` | YES | NO |
| APPLICABILITY_DIMENSIONS | hard: cardiac imaging, no-reflow; soft: stenting/post-reperfusion | `createKnowledgeContextPackage` | Knowledge context | raw question | YES | NO |
| SELECTED_ASSERTIONS | 5 MVO assertions, all `APPLICABLE_WITH_LIMITATIONS` | `applyApplicability`, `resolveAssertions` | Knowledge | P5 local corpus | YES | NO |
| REJECTED_ASSERTIONS | 0 | same | Knowledge | local adapters | YES | NO |
| SELECTED_SOURCES | 3: PMID 23021401, 25212800, 29712696 | P5 adapter/result | Knowledge corpus | local source registry | YES | NO |
| SELECTED_LIMITATIONS | 10 result-level limits, including association-not-causality and undocumented STENTING context | applicability/result | Knowledge | assertions + provider limits | YES | NO |
| SELECTED_CONTRADICTIONS | 0 | conflict analysis | Knowledge | selected assertions | YES | NO |
| SELECTED_GAPS | runtime gaps 0; presentation adds unresolved concept `STEMI` | result/presentation | Knowledge + product projection | resolution | YES | NO |
| SYNTHESIS_INPUT | all 5 selected MVO conclusions | `synthesizeKnowledge` | Knowledge synthesis | selected assertions | YES | NO |
| SYNTHESIS_SELECTION / PRIORITIZATION | one direct conclusion: `association-not-causality`; remaining four not used in main answer | `synthesizeKnowledge` | Knowledge synthesis | globally sorted assertion IDs | YES | **YES — distinct downstream loss** |
| AMBIGUITY_CANDIDATES | none | `resolveConcepts` | Knowledge | local rules | YES | NO |
| CLARIFICATION_DECISION | none | `clarificationFor` | UNDERSTAND projection | result gaps | YES | NO |
| NEXT_ACTION / QRY INPUT | not invoked | workspace UNDERSTAND branch | QRY | none | YES | NO |
| NEXT_ACTION / QRY OUTPUT | not invoked | workspace UNDERSTAND branch | QRY | none | YES | NO |
| COMPOSED_RESPONSE | direct conclusion + exact question summary + bounded conclusion | `readableKnowledgeReply` | Product composition | projection | YES | NO |
| VISIBLE_RESPONSE | same association-not-causality sentence | `ProductUnderstandResponse` | UX projection | composed response | YES | NO |
| UI_INPUT_PLACEHOLDER_OR_FOLLOWUP | intent-aware static placeholder | `productEntryPromptForIntent` | UX | active route `UNDERSTAND` | YES | NO |

### Term and constraint preservation

| Requested term/dimension | Preserved by router | Resolved | In query plan | In selected assertions | In synthesis input | Visible in main answer |
|---|---:|---:|---:|---:|---:|---:|
| no-reflow / MVO | YES | YES, as two related concepts | YES | YES | YES | YES, as MVO |
| reperfusion | YES | YES | YES | YES, one assertion explicitly describes impaired tissue-level reperfusion | YES | NO |
| stenting | YES | YES | YES | NO; only an applicability limitation says STENTING is undocumented | NO | NO |
| STEMI | YES | NO, unresolved | NO | NO exact STEMI binding | NO exact STEMI binding | NO |
| CMR role | YES | YES, MRI | YES | YES, including LGE appearance | YES | NO |

The local governed material is not empty. It contains the five selected MVO
assertions, including tissue-level reperfusion despite restored epicardial flow,
LGE appearance, remodeling association, causality limitation and distinction
from intramyocardial hemorrhage. It also contains a governed STEMI entity and a
selected source explicitly about acute ST-elevation myocardial infarction.
The active resolver nevertheless has no STEMI rule. Exact post-stenting
applicability is not documented in the selected assertions and remains an
honest corpus limitation.

## Case A first divergence

```text
CASE_A_FIRST_DIVERGENT_STAGE = TERM_RESOLUTION
OWNER = KNOWLEDGE_CONCEPT_RESOLUTION
PRIMARY_CLASSIFICATION = CURRENT_PRODUCT_RUNTIME_DEFECT
```

`resolveConcepts` emits `unresolvedConcepts=["STEMI"]` although the admitted
local graph contains `noxia:radiology:disease:stemi` and the local corpus also
contains myocardial-infarction concepts and STEMI sources. This is earlier than
synthesis.

A second, independent downstream defect explains the visible sentence. For an
`EXPLAIN` request, `synthesizeKnowledge` sorts conclusions by assertion ID,
selects the first exact assertion, or falls back to the first conclusion when
none is exact, and keeps one direct conclusion. All five A assertions are
qualified by limitations and their P5 `atomicContent` does not expose the
three-field semantic relation used by contextual selection. The alphabetically
first `association-not-causality` assertion therefore becomes the sole main
answer while the more directly role/reperfusion/CMR-related selected assertions
remain in the synthesis input and detail cards.

```text
CASE_A_DOWNSTREAM_DIVERGENT_STAGE = SYNTHESIS_PRIORITIZATION
OWNER = KNOWLEDGE_SYNTHESIS
PRIMARY_CLASSIFICATION = SYNTHESIS_DEFECT
```

The answer is structurally incomplete; this report does not declare it
scientifically wrong.

## Case B trace

| TRACE ELEMENT | VALUE | SOURCE_FUNCTION | OWNER | PROVENANCE | DETERMINISTIC | FIRST_POINT_WHERE_EXPECTED_SEMANTICS_ARE_LOST |
|---|---|---|---|---|---|---|
| RAW_USER_INTENT | exact MRI-vs-CT ECV difference request plus explicit no-study/no-protocol | `submit` | Product | human Production evidence | YES | NO |
| ROUTED_INTENT | `UNDERSTAND`, `IN_SCOPE`; `NO_STUDY`, `NO_PROTOCOL`; Project ineligible | `routeProductEntry` | Product router | raw turn | YES | NO |
| NORMALIZED_TERMS | `ECV`, `IRM`, `CT`; exclusions preserved | product intake + request builder | Product/Knowledge | raw turn | YES | NO |
| DETECTED RELATION | empty; plural `différences` is not matched by the singular-bounded regex | `detectedRelationships` | Product router | local regex | YES | **YES** |
| RESOLVED_CONCEPTS | MRI, CT, ECV all exact | `resolveConcepts` | Knowledge concept resolution | local rules | YES | NO |
| KNOWLEDGE REQUEST | `requestType=EXPLAIN`, `knowledgePurpose=UNDERSTAND`, not `COMPARE` | `classifyPurpose` | Knowledge request building | raw question | YES | **YES — independent second loss** |
| QUERY_PLAN | one `branch:exact` containing ECV+MRI+CT | `createQueryPlan` | Knowledge query planning | misclassified request | YES | NO, reflects upstream classification |
| REQUESTED_BRANCHES | no explicit MRI branch, CT branch, or comparison branch | `buildBranches` | Knowledge query planning | `EXPLAIN` | YES | NO, reflects upstream classification |
| APPLICABILITY_DIMENSIONS | biomarker ECV hard; modality values `[CT,MRI]` soft | context package | Knowledge context | raw question | YES | NO |
| SELECTED_ASSERTIONS | 28 applicable: 27 MRI-only + 1 cross-modality; 0 CT branch assertions | applicability/assertion resolution | Knowledge | P4R local corpus | YES | **YES — CT exclusion** |
| REJECTED_ASSERTIONS | 7 CT assertions, all rejected `OUT_OF_VALIDITY_DOMAIN` against requested `(CT, MRI)` | `evaluateAssertionApplicability` | Knowledge applicability | P4R local corpus | YES | NO, manifestation of applicability defect |
| SELECTED_SOURCES | MRI-only 15 unique; CT branch 0; cross-modality 2 unique (one overlaps MRI) | evidence links | Knowledge | local source registry | YES | NO |
| SELECTED_LIMITATIONS | 19 aggregated result limitations | result assembly | Knowledge | provider + assertion + applicability | YES | NO |
| SELECTED_CONTRADICTIONS | one synthetic-haematocrit contextual difference | conflict analysis | Knowledge | P4R | YES | NO |
| SELECTED_GAPS | conflict unresolved; future external research required | `analyzeGaps` | Knowledge gaps | coverage/conflict | YES | NO |
| SYNTHESIS_INPUT | 28 assertions + 18 documentary statements; includes one MR/CT method-distinction assertion but no applicable CT assertion | `synthesizeKnowledge` | Knowledge synthesis | selected owner material | YES | NO |
| SYNTHESIS SELECTION | `EXPLAIN` global selection promotes first exact assertion (CMR blood-pool ROI); cross-modality relation remains supporting, not direct | `synthesizeKnowledge` | Knowledge synthesis | misclassified request + global ordering | YES | YES, downstream shared mechanism |
| AMBIGUITY_CANDIDATES | none | resolver | Knowledge | local rules | YES | NO |
| CLARIFICATION_DECISION | none | projection | UNDERSTAND | result gaps | YES | NO |
| NEXT_ACTION / QRY INPUT | not invoked; exclusions remain in Knowledge request and exact question summary | workspace UNDERSTAND branch | QRY | none | YES | NO |
| NEXT_ACTION / QRY OUTPUT | not invoked; no Study Design action generated then suppressed | workspace UNDERSTAND branch | QRY | none | YES | NO |
| COMPOSED_RESPONSE | MRI ROI + MRI method/T1 dependencies + synthetic-Hct debate | projection/composition | Knowledge/Product | synthesis | YES | NO |
| VISIBLE_RESPONSE | MRI-dominant partial answer, exact refusal retained | UX projection | UX | composition | YES | NO |
| UI_INPUT_PLACEHOLDER_OR_FOLLOWUP | intent-aware static placeholder | `productEntryPromptForIntent` | UX | active route `UNDERSTAND` | YES | NO |

### Branch counts

The following counts are non-overlapping and refer only to applicable structured
assertions, not to documentary statements:

```text
MRI_ASSERTIONS = 27
CT_ASSERTIONS = 0
CROSS_MODALITY_ASSERTIONS = 1
GENERAL_ECV_ASSERTIONS = 0

MRI_SELECTED_SOURCE_REFS = 15
CT_SELECTED_SOURCE_REFS = 0
CROSS_MODALITY_SELECTED_SOURCE_REFS = 2
GENERAL_SELECTED_SOURCE_REFS = 0
```

The P4R corpus does contain seven CT ECV assertions: CT/histology in severe
aortic stenosis, delayed phase, small feasibility correlation with CMR,
single-energy formula, evidence-quality limitation, meta-analytic agreement
with CMR, and a spectral method. They are retrieved and then all excluded by
applicability. The reason is mechanical: the request stores modalities as
`CT` and `MRI`; P4R assertions store fully qualified modality IDs. The
applicability comparator has an MRI/IRM compatibility special case, but no
corresponding CT canonicalization, so `noxia:radiology:modality:ct` is declared
incompatible with `(CT, MRI)`.

The 20 visible sources are not 20 sources supporting the main answer. Result
assembly aggregates all adapter sources and evidence before removing sources
that support only excluded assertions, and product presentation exposes that
aggregate. Fifteen unique sources support MRI-only applicable assertions, two
support the cross-modality assertion (one overlaps MRI), one RB source supports
documentary statements, and three displayed sources support only CT assertions
that the same result has excluded. This explains the large source count without
CT content in the main answer.

The runtime has a partial comparison contract for correctly typed `COMPARE`
requests: separate modality branches, branch coverage, a direct comparison
coverage item, cross-branch relation detection and a comparison projection.
It does not provide a fully typed universal similarities/differences template.
For this input that contract is never activated; the runtime performs global
`EXPLAIN` assertion selection.

## Case B first divergence

```text
CASE_B_FIRST_DIVERGENT_STAGE = OTHER — PRODUCT_INTAKE_RELATION_DETECTION
OWNER = PRODUCT_ROUTER
PRIMARY_CLASSIFICATION = CURRENT_PRODUCT_RUNTIME_DEFECT
```

The first trace artifact that loses comparison semantics is
`detectedRelationships=[]`. Its regex recognizes singular `différence` at a
word boundary but not plural `différences`. The next independently implemented
classifier in `createKnowledgeRequest` has the same singular-bounded behavior
and emits `EXPLAIN`, which makes `createQueryPlan` build one exact branch.

The first required B stage whose artifact violates the expected two-branch
contract is therefore:

```text
CASE_B_FIRST_REQUIRED_STAGE_DIVERGENCE = QUERY_PLANNING
```

Two further independent product defects then amplify the asymmetry:

1. `KNOWLEDGE_APPLICABILITY` excludes all seven governed CT assertions due to
   missing CT modality normalization;
2. `KNOWLEDGE_RESULT` / `UNDERSTAND_COMPOSITION` exposes sources and limitations
   aggregated from the included providers rather than only material supporting
   applicable/displayed items.

The explicit refusal is not lost. No Project/Study Design action is generated
and later hidden: Project construction is never eligible, persistent extraction
is never called, Project writes are 0, protocol projections are 0, and QRY is
not invoked.

## Case C trace

| TRACE ELEMENT | VALUE | SOURCE_FUNCTION | OWNER | PROVENANCE | DETERMINISTIC | FIRST_POINT_WHERE_EXPECTED_SEMANTICS_ARE_LOST |
|---|---|---|---|---|---|---|
| RAW_USER_INTENT | exact general T1-in-MRI understanding request | `submit` | Product | human Production evidence | YES | NO |
| ROUTED_INTENT | `UNDERSTAND`, `IN_SCOPE`, no Project eligibility | `routeProductEntry` | Product router | raw turn | YES | NO |
| NORMALIZED_TERMS | MRI from intake; `t1` extracted by Knowledge | intake + resolver boundary | Product/Knowledge | raw turn | YES | NO |
| RESOLVED_CONCEPTS | MRI exact + `ambiguous:t1` | `resolveConcepts` | Knowledge concept resolution | local hardcoded rules | YES | NO |
| QUERY_PLAN | `CLARIFICATION_REQUIRED`; two sense branches; no provider execution | `createQueryPlan` | Knowledge query planning | ambiguity object | YES | NO |
| REQUESTED_BRANCHES | `branch:sense:method:t1-mapping`, `branch:sense:measurement:native-t1` | `buildBranches` | Knowledge query planning | hardcoded candidate list | YES | NO |
| APPLICABILITY_DIMENSIONS | MRI present, but no assertions retrieved because Domain Gate stops execution | context/domain gate | Knowledge | request | YES | NO |
| SELECTED_ASSERTIONS | 0 | retrieval/applicability | Knowledge | gate | YES | NO |
| REJECTED_ASSERTIONS | 0 | applicability | Knowledge | gate | YES | NO |
| SELECTED_SOURCES | 0 | result | Knowledge | gate | YES | NO |
| SELECTED_LIMITATIONS | 0 | result | Knowledge | gate | YES | NO |
| SELECTED_CONTRADICTIONS | 0 | result | Knowledge | gate | YES | NO |
| SELECTED_GAPS | ambiguity marker; `MISSING_CRITICAL_CONTEXT`; parasite `DIRECT_COMPARISON` | `analyzeGaps` + presentation | Knowledge | plan/coverage | YES | **YES for parasite gap** |
| SYNTHESIS_INPUT | no conclusions; two gaps | `synthesizeKnowledge` | Knowledge synthesis | selected gaps | YES | NO |
| SYNTHESIS_SELECTION | state `CLARIFICATION_REQUIRED` | `synthesizeKnowledge` | Knowledge synthesis | Domain Gate | YES | NO |
| AMBIGUITY_CANDIDATES | exactly `T1 mapping`, `T1 natif` | `resolveConcepts` | Knowledge concept resolution | hardcoded `candidateSenseIds` | YES | **YES for candidate completeness** |
| CLARIFICATION_DECISION | ask user to choose either candidate or “Je ne sais pas” | `clarificationFor` | UNDERSTAND projection | ambiguity object | YES | NO; fail-closed behavior is expected |
| NEXT_ACTION / QRY INPUT | not invoked | workspace UNDERSTAND branch | QRY | none | YES | NO |
| NEXT_ACTION / QRY OUTPUT | not invoked | workspace UNDERSTAND branch | QRY | none | YES | NO |
| COMPOSED_RESPONSE | parasite gap sentence precedes valid clarification | `buildAnswerStatements`, `readableKnowledgeReply` | Knowledge/Product | gaps + clarification | YES | NO, reflects upstream gap |
| VISIBLE_RESPONSE | same sentence and clarification | UI | UX | composition | YES | NO |
| UI_INPUT_PLACEHOLDER_OR_FOLLOWUP | intent-aware static placeholder | `productEntryPromptForIntent` | UX | active route `UNDERSTAND` | YES | NO |

## Case C ambiguity candidate analysis

The ambiguity is decided by the `ambiguous:t1` rule in
`concept-resolver.ts`. The rule matches an unqualified `T1` and directly embeds:

```text
candidateSenseIds = [
  "method:t1-mapping",
  "measurement:native-t1"
]
```

There is no broader candidate inventory calculated before filtering. Candidate
generation does not query the concept catalog, terminology aliases, Knowledge
nodes, local query results, modality context, or user intent. It resolves only
the two hardcoded IDs from the same local rule array.

`T1 natif` is represented as `measurement:native-t1`, object type
`OBSERVATION`, bound to the provider concept
`noxia:radiology:observation:native-myocardial-t1`. It is not represented as a
T1-weighted acquisition and is not silently normalized to the T1 mapping
method.

The admitted local material exposes additional typed T1-related objects that
are not consulted by this generator, including:

- the historical `Sequence` identity `t1-mapping`;
- the separate `MeasurementMethod` myocardial T1 mapping;
- native and post-contrast myocardial T1 observations;
- native and post-contrast blood T1 observations;
- MOLLI, ShMOLLI and SASHA acquisition methods;
- inversion-recovery and saturation-recovery T1-mapping sequence families;
- T1/longitudinal-relaxation measurement definitions and the separate T1
  biomarker identity.

KE-001 explicitly requires parameter, measurement, method, map, representation
and acquisition to remain distinct. Static inspection therefore proves that
the current candidate generator is narrower than the governed local inventory.
It does not prove which subset is scientifically appropriate for this exact
user clarification. That selection requires a human scientific/contractual
decision before any future generator change.

```text
CASE_C_AMBIGUITY_FIRST_DIVERGENT_STAGE = AMBIGUITY_CANDIDATE_GENERATION
PRIMARY_CLASSIFICATION = UNKNOWN_REQUIRES_REVIEW
HUMAN_SCIENTIFIC_DECISION_REQUIRED = YES
```

The choice to stop and ask a clarification is itself correct fail-closed
behavior. Only the completeness and structuring of the proposed sense inventory
remain non-adjudicated.

## Case C parasite comparison sentence

Exact origin:

| Element | Trace |
|---|---|
| Function creating the gap | `analyzeGaps` in `src/features/knowledge-engine/conflict-gap-analyzer.ts:58` |
| Trigger | `queryPlan.branches.length > 1` and coverage other than `NO_PROVIDER`, without checking request type or ambiguity-branch purpose |
| Gap ID | `knowledge-gap:ke1-c8f28d7d5c789391` |
| Gap code/scope | `NO_ASSERTION_MATCH` / `DIRECT_COMPARISON` |
| Exact template | “Aucune comparaison générale directe des branches demandées n’est documentée ; les résultats restent séparés par modalité.” |
| Assertion source | none |
| Projection rule | `buildAnswerStatements` selects `DIRECT_COMPARISON` before any other `NO_ASSERTION_MATCH` gap |
| Composition | `projectUnderstandResult` joins the selected answer statement; `readableKnowledgeReply` places it before the clarification |
| UI behavior | faithfully displays composed text; UI is not the origin |

`buildCoverageMap` has the same broad multi-branch assumption and creates a
`comparison:direct` coverage item for the two ambiguity branches. The visible
sentence itself is first introduced by `analyzeGaps`. The request is `EXPLAIN`,
contains one modality, and the two branches are alternative senses, not user-
requested comparison branches. The gap is structurally unrelated to the
requested operation.

```text
CASE_C_PARASITE_SENTENCE_FIRST_DIVERGENT_STAGE = GAP_SELECTION
OWNER = KNOWLEDGE_GAP_SELECTION
PRIMARY_CLASSIFICATION = PROJECTION_RELEVANCE_DEFECT
```

The UI and QRY do not create this sentence.

## Input placeholder versus QRY next-action

```text
TEXT_SOURCE_FILE = src/features/protocol-designer/functional-reset/session.ts
TEXT_SOURCE_FUNCTION_OR_COMPONENT = productEntryPromptForIntent, consumed by ProtocolDesignerWorkspace textarea
STATIC_OR_DYNAMIC = STATIC_TEXT_SELECTED_DYNAMICALLY_BY_ROUTE_INTENT
INTENT_AWARE = YES
QRY_GENERATED = NO
QRY_OWNER_INVOLVED = NO
DISPLAYED_AS_PLACEHOLDER = YES
DISPLAYED_AS_ASSISTANT_MESSAGE = NO
CANONICAL_NEXT_ACTION = NO
```

The exact literal is returned when `routeIntent === "UNDERSTAND"` and assigned
to the `<textarea placeholder=...>` property. It is not a conversation entry.
No QRY result asks A, B or C to restate known intent. Therefore:

```text
QRY_RESTATEMENT_DEFECT_CONFIRMED = NO
INPUT_PLACEHOLDER_MISREAD_AS_QRY = YES
```

## Gap and limitation projection

The tables below classify structural relation to the requested branch. `MAIN`
means used in the leading composed answer, not merely available in an expandable
detail card.

### Case A

| GAP/LIMIT ID | TEXT / MEANING | ORIGIN OWNER / BRANCH | APPLICABILITY | WHY SELECTED / VISIBLE | DIRECTLY RELEVANT | MAIN |
|---|---|---|---|---|---|---|
| `UNRESOLVED:STEMI` | `STEMI` | concept resolution / exact | unresolved | projected from `unresolvedConcepts` | YES | NO |
| `ASSOCIATION_NOT_CAUSALITY` | observed MVO association is not causality | P5 assertion / exact | with limits | attached to selected direct assertion | YES | YES |
| `AUTOMATED_REVIEW_IS_NOT_HUMAN_SCIENTIFIC_REVIEW` | automated corpus review boundary | P5/P4R provider / exact | inherited | provider limitation aggregated into result | PARTIAL | NO |
| `Correspondance scientifique…` | usable match with qualifications | applicability / exact | with limits | generated for qualified assertions | PARTIAL | NO |
| `DOCUMENTARY_SECTIONS_WITHOUT_CONTROLLED_TEXT_REMAIN_UNSTRUCTURED` | unstructured documentary sections | provider / exact | inherited | selected provider limitation | PARTIAL | NO |
| `FOUR_DECLARED_DOMAINS_ONLY` | P5 corpus bounded to four domains | P5 / exact | inherited | selected provider limitation | PARTIAL | NO |
| `STENTING_NOT_DOCUMENTED` | intervention STENTING absent from assertion context | applicability / exact | with limits | generated for all five assertions | YES | NO |
| `NARRATIVE_CORPUS` | RB is narrative | RB-004 / exact | inherited | provider selected although no exact controlled block returned | PARTIAL | NO |
| `NO_PATIENT_LEVEL_INTERPRETATION` | patient-level interpretation forbidden | provider / exact | inherited | provider-level limit | NO | NO |
| `NOT_ATOMIC_ASSERTIONS` | RB passages are not atomic assertions | RB-004 / exact | inherited | provider-level limit | PARTIAL | NO |
| `UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED` | no heuristic conversion | RB-004 / exact | inherited | provider-level limit | PARTIAL | NO |

The patient-level limit is structurally unrelated to this general question but
appears because provider limitations are projected wholesale. This is
presentation relevance debt, not a scientific conclusion.

### Case B gaps

| GAP_ID | GAP_TEXT | ORIGIN OWNER / BRANCH | APPLICABILITY | WHY SELECTED / VISIBLE | DIRECTLY RELEVANT | MAIN |
|---|---|---|---|---|---|---|
| `knowledge-gap:ke1-36fe7d81f0f85cdd` | synthetic-haematocrit contextual findings must not be collapsed | Knowledge conflict analysis / single exact branch | selected MRI context | conflict is present in globally retrieved ECV material | PARTIAL | YES, as debate |
| `knowledge-gap:ke1-f34facebdddcc497` | internal knowledge cannot close the question; future external research would be required | Knowledge gap analysis / single exact branch | `PARTIAL` | generic rule for partial coverage | YES | NO, only bounded conclusion/detail |

The synthetic-haematocrit debate is related to MRI ECV method dependence but is
not a direct MRI-vs-CT comparison. It is broad, not structurally unrelated.

### Case B limitations

| LIMIT ID | ORIGIN / BRANCH | DIRECTLY RELEVANT | MAIN |
|---|---|---:|---:|
| `AUTOMATED_REVIEW_IS_NOT_HUMAN_SCIENTIFIC_REVIEW` | P4R provider / exact | PARTIAL | NO |
| `CLINICAL_MISCLASSIFICATION` | synthetic-haematocrit assertion / MRI material | PARTIAL | NO |
| `Correspondance scientifique…` | applicability / exact | PARTIAL | NO |
| `DOCUMENTARY_SECTIONS_WITHOUT_CONTROLLED_TEXT_REMAIN_UNSTRUCTURED` | RB provider / exact | PARTIAL | NO |
| `ECV_T1_DOMAIN_ONLY` | P4R corpus / exact | YES | NO |
| `NARRATIVE_CORPUS` | RB-004 / exact | PARTIAL | NO |
| `NO_GENERAL_MRI_CT_COMPARISON` | P4R corpus / requested comparison | YES | NO |
| `NO_GENERAL_TECHNICAL_ANSWER` | Knowledge graph / exact | PARTIAL | NO |
| `NOT_ATOMIC_ASSERTIONS` | RB-004 / exact | PARTIAL | NO |
| `cardiac-motion` | MRI assertion / exact | PARTIAL | NO |
| `method-dependence` | MRI assertion / exact | YES | YES |
| `post-contrast-delay` | MRI assertion / exact | PARTIAL | NO |
| `POST_CONTRAST_T1_CONFOUNDING` | MRI assertion / exact | PARTIAL | NO |
| `RELATION_EVIDENCE_MAY_BE_UNKNOWN` | Knowledge graph / exact | PARTIAL | NO |
| `SCIENTIFIC_ASSERTION_REGISTRY_EMPTY` | empty generic assertion provider / exact | NO | NO |
| `SINGLE_CRITERION_SPECIFICITY` | myocarditis MRI assertion / exact | NO | NO |
| `SITE_SPECIFIC_VALUES` | MRI mapping assertion / exact | PARTIAL | NO |
| `SMALL_SAMPLE` | limited CT/MR feasibility evidence | YES | NO |
| `UNSTRUCTURED_SECTIONS_DECLARED_NOT_CONVERTED` | RB-004 / exact | PARTIAL | NO |

`SCIENTIFIC_ASSERTION_REGISTRY_EMPTY` and `SINGLE_CRITERION_SPECIFICITY` are not
related to the requested branches. Their visibility is a
`PROJECTION_RELEVANCE_DEFECT`. Other broad limitations remain useful provenance
boundaries but should not be mistaken for main-answer support.

### Case C

| GAP_ID | GAP_TEXT | ORIGIN OWNER / BRANCH | APPLICABILITY | WHY SELECTED / VISIBLE | DIRECTLY RELEVANT | MAIN |
|---|---|---|---|---|---|---|
| `AMBIGUITY:ambiguous:t1` | T1 has a sense to clarify | concept resolution / ambiguity branches | clarification required | projected from `ambiguities` | YES | NO |
| `knowledge-gap:ke1-c0d6085b2c0cde5f` | multiple governed T1 senses require selection | gap analysis / ambiguity branches | clarification required | correct ambiguity gap | YES | NO, clarification uses it |
| `knowledge-gap:ke1-c8f28d7d5c789391` | no direct comparison of requested branches; results separated by modality | gap analysis / ambiguity branches | not applicable to requested operation | selected solely because branch count is 2 | NO | YES |

Case C has no selected limitations. The last row is the clearest
`PROJECTION_RELEVANCE_DEFECT` in the three observations.

## Synthesis input versus visible output

### Case A

**What synthesis received:** five applicable-with-limitations MVO assertions,
including reperfusion pathophysiology, LGE appearance, remodeling association,
causality boundary and IMH distinction.

**What the user saw in the main answer:** one causality-boundary assertion.

| Metric | Count |
|---|---:|
| `REQUESTED_DIMENSION_COUNT` | 5 |
| `REQUESTED_DIMENSIONS_WITH_SELECTED_EVIDENCE` | 3 |
| `REQUESTED_DIMENSIONS_WITH_SYNTHESIS_CONTENT` | 3 |
| `REQUESTED_DIMENSIONS_VISIBLE_TO_USER` | 1 |

The three structurally evidenced dimensions are no-reflow/MVO, reperfusion and
CMR characterization. Stenting remains only a limitation; STEMI lacks an exact
concept/assertion binding. These are deterministic structural counts, not a
scientific score.

### Case B

**What synthesis received:** 28 applicable assertions and 18 documentary
statements; among structured assertions, 27 are MRI-only and one explicitly
distinguishes MR ECV from CT ECV. Seven CT assertions were already removed by
applicability.

**What the user saw in the main answer:** MRI ROI placement, two MRI method/input
conditions and one MRI synthetic-haematocrit debate; neither the CT branch nor
the selected cross-modality distinction is displayed.

| Metric | Count |
|---|---:|
| `REQUESTED_DIMENSION_COUNT` | 4 |
| `REQUESTED_DIMENSIONS_WITH_SELECTED_EVIDENCE` | 3 |
| `REQUESTED_DIMENSIONS_WITH_SYNTHESIS_CONTENT` | 3 |
| `REQUESTED_DIMENSIONS_VISIBLE_TO_USER` | 2 |

The three structurally selected dimensions are ECV, MRI method and a bounded
cross-modality distinction. There is no applicable CT branch content. The two
visible dimensions are ECV and MRI. Again, this is not a scientific score.

## Shared root causes

| ROOT_CAUSE_ID | CASES_AFFECTED | FIRST_DIVERGENT_STAGE | OWNER | MECHANISM | DIRECT_EVIDENCE | CURRENT RUNTIME DEFECT | CORPUS GAP | EXPECTED FAIL-CLOSED | REPAIR OWNER | SCOPE | HUMAN SCIENTIFIC DECISION |
|---|---|---|---|---|---|---:|---:|---:|---|---|---:|
| `RC-AB-SYNTHESIS-GLOBAL-FIRST` | A, B | `SYNTHESIS_PRIORITIZATION` | `KNOWLEDGE_SYNTHESIS` | non-COMPARE path globally sorts assertions, promotes one first conclusion, and does not rank against requested dimensions; contextual selection requires semantic relations absent from P5 A items | A direct ID is association-not-causality despite 5 inputs; B direct ID is blood-ROI despite a selected MR/CT distinction | YES | NO | NO | Knowledge synthesis | MEDIUM | NO for generic ranking contract; YES before any scientific ranking policy |

This is the only demonstrated cross-case causal mechanism. It is downstream of
the distinct first divergences and must not be used to justify a case-specific
scientific ranker.

## Distinct root causes

| ROOT_CAUSE_ID | CASES_AFFECTED | FIRST_DIVERGENT_STAGE | OWNER | MECHANISM | DIRECT_EVIDENCE | CURRENT RUNTIME DEFECT | CORPUS GAP | EXPECTED FAIL-CLOSED | REPAIR OWNER | SCOPE | HUMAN SCIENTIFIC DECISION |
|---|---|---|---|---|---|---:|---:|---:|---|---|---:|
| `RC-A-STEMI-RESOLUTION` | A | `TERM_RESOLUTION` | `KNOWLEDGE_CONCEPT_RESOLUTION` | active resolver has no STEMI rule although local governed identities exist | `unresolvedConcepts=["STEMI"]`; no STEMI in plan | YES | NO | NO | Knowledge concept resolution | SMALL | NO for binding an already governed identity |
| `RC-A-STENTING-COVERAGE` | A | `CORPUS_COVERAGE` | `KNOWLEDGE_CORPUS` | selected MVO assertions do not document exact stenting intervention context | all five assertions carry STENTING-not-documented limitation | NO | YES | NO | Knowledge corpus governance | LARGE | YES |
| `RC-B-INTAKE-PLURAL-COMPARISON` | B | `OTHER — PRODUCT_INTAKE_RELATION_DETECTION` | `PRODUCT_ROUTER` | singular word-boundary regex misses `différences` | `detectedRelationships=[]` | YES | NO | NO | Product router | MICRO | NO |
| `RC-B-REQUEST-PLURAL-COMPARISON` | B | `QUERY_PLANNING` precursor: request building | `KNOWLEDGE_QUERY_PLANNING` | independent singular word-boundary classifier emits `EXPLAIN` | request type `EXPLAIN`; one exact branch | YES | NO | NO | Knowledge request/query planning | MICRO | NO |
| `RC-B-CT-MODALITY-NORMALIZATION` | B | `APPLICABILITY` | `KNOWLEDGE_APPLICABILITY` | qualified CT ID is not normalized to requested `CT`; MRI has a special alias path | 7/7 CT assertions rejected as incompatible with `(CT, MRI)` | YES | NO | NO | Knowledge applicability | SMALL | NO |
| `RC-B-RESULT-PROJECTION-SCOPE` | B | `ASSERTION_SELECTION` / result assembly | `KNOWLEDGE_RESULT` then `UNDERSTAND_COMPOSITION` | sources/evidence/limitations are aggregated from adapter results, including excluded-only material | 20 sources shown; 3 support only excluded CT assertions; irrelevant limitations visible | YES | NO | NO | Knowledge result + UNDERSTAND projection | SMALL | NO |
| `RC-B-GENERAL-COMPARISON-COVERAGE` | B | `CORPUS_COVERAGE` | `KNOWLEDGE_CORPUS` | corpus declares bounded CT/MR evidence and `NO_GENERAL_MRI_CT_COMPARISON`, not universal comparability | provider limitation and heterogeneous/limited CT evidence | NO | YES | NO | Knowledge corpus governance | LARGE | YES |
| `RC-C-T1-CANDIDATE-INVENTORY` | C | `AMBIGUITY_CANDIDATE_GENERATION` | `KNOWLEDGE_CONCEPT_RESOLUTION` | fixed two IDs, broader governed T1 inventory never consulted | hardcoded `candidateSenseIds`; additional local typed objects | NO pending adjudication | NO | clarification itself YES | Knowledge concept resolution + human governance | MEDIUM | YES |
| `RC-C-UNTYPED-BRANCH-COMPARISON` | C | `GAP_SELECTION` | `KNOWLEDGE_GAP_SELECTION` | any multi-branch plan is treated as comparison, including ambiguity senses | exact gap ID/template and `comparison:direct` artifact | YES | NO | NO | Knowledge coverage/gap selection | SMALL | NO |

## Owner attribution

| Finding | Real owner | Not the owner | Reason |
|---|---|---|---|
| A unresolved STEMI | Knowledge concept resolution | UI, QRY, corpus authoring | the governed identity exists locally; active resolution never binds it |
| A main-answer dominance | Knowledge synthesis | UI, Editorial Engine | UI faithfully displays the selected direct conclusion |
| A exact stenting absence | Knowledge corpus governance | synthesis | no selected assertion documents the intervention dimension |
| B comparison lost | Product intake plus independently Knowledge request/query planning | QRY | QRY is never invoked; two local classifiers miss plural wording |
| B CT assertions rejected | Knowledge applicability | corpus | seven governed CT assertions are retrieved before rejection |
| B inflated source/limit projection | Knowledge result + UNDERSTAND projection | corpus | aggregation happens after retrieval and ignores applicability scope |
| C candidate inventory | Knowledge concept resolution plus human scientific governance | UI | candidates are hardcoded before UI projection |
| C parasite sentence | Knowledge gap selection | UI, QRY | exact sentence is gap text produced before composition |
| input-area phrase | Protocol Designer UX | QRY | literal textarea placeholder selected by route intent |

Editorial Engine is not in the A/B/C execution corridor and owns none of these
findings.

## Corpus coverage versus runtime defects

### Current product runtime defects — 7

1. A STEMI resolution omission;
2. A/B dimension-insensitive global synthesis prioritization;
3. B intake plural-comparison relation omission;
4. B Knowledge request plural-comparison misclassification;
5. B CT modality applicability normalization failure;
6. B result/presentation inclusion of excluded-only sources and unrelated
   limitations;
7. C ambiguity branches misclassified as direct comparison for gap selection.

### Corpus coverage limitations — 2

1. A exact post-stenting applicability is not documented by selected governed
   MVO assertions;
2. B has bounded MR/CT comparison material, but the corpus explicitly does not
   claim a general MRI/CT comparison and contains heterogeneous limited CT
   evidence.

These corpus limits do not explain the governed STEMI identity being unresolved
or seven CT assertions being rejected; those are runtime defects.

### Expected behaviors — 4

1. A/B/C route to UNDERSTAND with zero Project writes and zero protocol
   projections;
2. B preserves `NO_STUDY` and `NO_PROTOCOL` and never generates a Project path;
3. C stops providers and requests clarification instead of choosing a T1 sense;
4. the post-response input placeholder is intent-aware UX text, not QRY.

## Repair boundaries

Future-only repair types, in causal order:

| Order | Root cause | Future repair type | Boundary |
|---:|---|---|---|
| 1 | B plural comparison detection, both classifiers | `FIX_QUERY_PLANNING` | generic inflection/intent handling; no ECV/MRI/CT special case |
| 2 | B CT modality identity | `FIX_APPLICABILITY` | canonical modality comparison; no assertion or corpus rewrite |
| 3 | C ambiguity branches treated as comparison | `FIX_GAP_RELEVANCE_PROJECTION` | distinguish branch purpose or gate direct-comparison logic by request operation |
| 4 | A STEMI binding | `FIX_CONCEPT_RESOLUTION` | bind an admitted identity generically; do not invent a scientific assertion |
| 5 | A/B synthesis selection | `FIX_COMPARATIVE_SYNTHESIS` plus generic relation-aware UNDERSTAND prioritization | preserve all owner evidence; no topic-specific rank or scientific conclusion |
| 6 | B result/source scope | `FIX_UNDERSTAND_COMPOSITION` | display support/provenance scoped to applicable/displayed items while retaining full immutable result internally |
| 7 | C candidate inventory | `HUMAN_SCIENTIFIC_DECISION_REQUIRED`, then possibly `FIX_AMBIGUITY_CANDIDATE_GENERATION` | decide appropriate governed senses before implementation |
| 8 | A/B corpus limits | `ADD_GOVERNED_CORPUS_COVERAGE` only after separate authority and human source admission | no automatic source addition or claim expansion |

No repair is authorized by this ordering.

## What must not be patched by case

- Do not add an A-only hardcoded answer, STEMI prose, no-reflow rank, or stenting
  assertion.
- Do not force B to show CT by bypassing applicability or by accepting an
  assertion without its validity context.
- Do not special-case the string `différences` only in one of the two
  independent classifiers and leave divergent intent contracts.
- Do not add a C-only suppression in React; the parasite is created upstream.
- Do not expand T1 senses from lexical intuition; use admitted typed identities
  and a human-governed candidate policy.
- Do not invoke QRY, Editorial Engine, a provider, or an LLM to compensate for
  deterministic local defects.
- Do not turn corpus limitation into scientific absence or technical PASS into
  scientific correctness.

## Recommended repair sequence

The first bounded technical tranche should reconcile generic comparison intent
through product intake and Knowledge request building, then fix canonical CT
modality applicability. These are prerequisite to observing the actual B
comparison corridor. Next, fix the generic branch-purpose/gap relevance defect
that creates C's parasite sentence. A separate resolver repair can bind already
governed STEMI identity. Only then should a generic dimension/relation-aware
synthesis and scoped presentation be characterized against A/B/C and additional
non-case-specific fixtures.

T1 candidate expansion and any new corpus coverage must wait for the three
explicit human scientific decisions identified above. No repair, new test,
provider call, benchmark, deployment, or Wave 2 action is performed here.

## Product defect classification

| Finding | Primary type |
|---|---|
| A unresolved STEMI | `CURRENT_PRODUCT_RUNTIME_DEFECT` |
| A exact stenting evidence absent | `CORPUS_COVERAGE_LIMITATION` |
| A/B global direct-answer selection | `SYNTHESIS_DEFECT` |
| B comparison relationship/request classification | `QUERY_PLANNING_DEFECT` |
| B CT assertions rejected | `CURRENT_PRODUCT_RUNTIME_DEFECT` |
| B broad source/limitation display | `PROJECTION_RELEVANCE_DEFECT` |
| B no universal comparison coverage | `CORPUS_COVERAGE_LIMITATION` |
| C asks for clarification | `EXPECTED_CLARIFICATION_BEHAVIOR` |
| C two-sense candidate adequacy | `UNKNOWN_REQUIRES_REVIEW` |
| C comparison sentence | `PROJECTION_RELEVANCE_DEFECT` |
| UNDERSTAND placeholder | `UX_PRESENTATION_DEBT` only if wording is later judged undesirable; not QRY debt |
| zero Project/protocol generation | `EXPECTED_FAIL_CLOSED_BEHAVIOR` |

## Root-cause reconciliation

The ten causal product findings are the ten root-cause rows above: one shared
row and nine case-distinct rows. Expected behaviors are not counted as defects.

```text
OBSERVED_PRODUCT_FINDINGS = 10
PRODUCT_FINDINGS_ASSIGNED = 10
UNASSIGNED_FINDINGS = 0
```

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
EXTERNAL_SEARCH = 0
BROWSER = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
FULL_CANONICAL_TEST_RUNS = 0
```

Operations used were static repository/Git inspection and one focused local
deterministic A/B/C readback. The readback used `EXTERNAL_FORBIDDEN`; every
interaction reported `externalCalls=0`, `projectWrites=0`, and
`protocolProjections=0`.

## Git

Only this Level 3 report was created. It is intentionally untracked.

```text
GIT_ADD = NO
COMMIT = NO
PUSH = NO
DEPLOYMENT = NO
WAVE_2 = NO
EXPECTED_FINAL_STATUS = ?? docs/implementation/product-checkpoint-01j-understand-abc-shared-first-divergence-forensic.md
```

No runtime, corpus, test, configuration, authority, or historical artifact was
modified.
