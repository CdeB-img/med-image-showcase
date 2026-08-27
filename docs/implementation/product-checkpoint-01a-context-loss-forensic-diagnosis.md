# PRODUCT CHECKPOINT 01A — Real User Context-Loss Forensic Diagnosis

**Nature:** `LEVEL_3_IMPLEMENTATION_EVIDENCE` — non normative

**Mission:** read-only diagnostic first; no product repair

**Date:** 2026-08-26

## Decision

`PRODUCT_CONTEXT_LOSS_ROOT_CAUSE_IDENTIFIED`

The first divergence is the same for Cases A and B:

`FIRST_DIVERGENT_STAGE = DOMAIN_GATE_NOT_EXECUTED_DUE_TO_HARD_CODED_PROJECT_CONSTRUCTION_SURFACE`

The deployed `/protocol-designer/demo` page mounts `ProtocolDesignerWorkspace`, whose initial contract and copy assume that the user is constructing a Research Project. On the first turn, it does not invoke Domain Gate, a structured intent interpreter, `ScientificIntent`, the existing `UNDERSTAND` router, or Knowledge. It sends the message directly to the product bridge and enables persistent Project-delta extraction. The first scientific routing decision is therefore not wrong inside the existing router: it is absent from the executed path.

This root cause is followed by three bounded propagation defects:

1. the persistent extractor can turn an explanatory question into Project candidates because every ordinary first turn is submitted to it;
2. the deterministic validator proves literal source anchoring and structural validity, but does not prove semantic entailment between `sourceText` and the generated candidate `content`;
3. the human review and Project UI can conceal the semantic delta: objectives whose generated content differs from their source are reviewed using the source text, while the Project question UI ignores canonical question objects and computes a project-shaped fallback.

The exact provider artifact from the hands-on session was not exported. This prevents byte-for-byte reconstruction of the two provider outputs, but does not prevent localization of the first executed divergence or exclusion of QRY, Knowledge, Scientific Thinking, Imaging, VAL, REG and DOC as its source.

No normative contradiction was found. The authorities require the opposite behavior: `UNDERSTAND` may stop after Knowledge and remain without a durable Project; Project creation requires a project finality confirmed by the user; explicit negations and specialized relations must survive routing.

## Verified deployed baseline

| Item | Verified state |
|---|---|
| Repository | `/Users/charles/Documents/Projets/NOXIA/noxia-dev` |
| Working branch | `protocol-designer-canonical-ingestion` |
| Local `HEAD` | `cf159179087ca2dfa67efd4020afa1c29871f9a1` |
| `origin/protocol-designer-canonical-ingestion` | `cf159179087ca2dfa67efd4020afa1c29871f9a1` |
| `main` | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| `origin/main` | `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Tracked changes before report | `0` |
| Historical untracked artifacts before report | `53`, preserved |
| Observed domain | `noxia-imagerie.fr` |
| Vercel deployment serving the domain | `dpl_BL9xCpkcX9NvsLhR6cj2veGVLcKR` |
| Vercel deployment URL | `med-image-showcase-m8zolsb2v-cdeb-imgs-projects.vercel.app` |
| Vercel target/state | `production` / `READY` |
| Git ref/SHA reported by Vercel | `main` / `9be06edca1a7500ab7a43d065e94241e91d67bec` |
| Current branch deployment | distinct Preview; it is not the deployment behind `noxia-imagerie.fr` |

The baseline mismatch is real but not blocking: the exact deployed commit exists locally and is auditable. Moreover, the nine critical files that implement the active UI, product bridge, Project builder and document projection have identical Git object IDs at `9be06edc` and `cf159179`. The current branch did not repair or change this product path. The Wave 1 branch adds owner runtimes and ledgers, but not product dispatch from the active conversation into those owners.

Critical unchanged files:

- `src/pages/ProtocolDesignerDemo.tsx`;
- `src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx`;
- `src/features/protocol-designer/product-bridge.ts`;
- `api/protocol-designer-bridge.ts`;
- `api/protocol-designer-bridge-provider.ts`;
- `src/features/research-project-construction/contribution-owner-boundary.ts`;
- `src/features/protocol-designer/functional-reset/ResearchProjectPanel.tsx`;
- `src/features/document-projection/functional-reset-boundary.ts`;
- `src/features/document-projection/standard-protocol-presentation.ts`.

Authorities consulted in the required hierarchy:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `NOXIA — Charte fondatrice`;
3. `NOXIA Protocol Designer — Scientific Product Manifesto V2`;
4. external `Editorial Engine — Architecture Manifesto`;
5. PD-003 V2 Research Object Model, Ownership Matrix and Relationship Catalog;
6. SEM-002;
7. PD-009;
8. RDE-001 and RDE-002;
9. KE-001;
10. Level 3 P-WEB-06/P-WEB-06C and Wave 1 implementation evidence, used only as historical/implementation evidence.

## Case A

Exact user message:

> Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.

### Reconstructed executed chain

| Stage | Executed state | Context/intent state | Owner or component |
|---|---|---|---|
| User message | Executed | All explicit terms, the distinction and `UNDERSTAND` are present | User |
| Domain Gate | **Not executed** | No domain/availability/intent gate object is produced | Product surface integration |
| Intent interpretation | **Not executed** | No `ScientificIntent`; no primary/secondary intent; no structured preservation of `UNDERSTAND` | Product surface integration |
| Semantic/context interpretation | Gemini produces an unstructured conversational answer; its exact historical output was not exported | No governed semantic envelope is retained by the active workspace | Gemini conversation mediation |
| Routing | **Not executed** | No call to `deriveRoutingIntent` or `resolveRouteIntentContribution` | Product surface integration |
| QRY | **Not executed before Project adoption** | No action selected from an `UNDERSTAND` state | QRY is downstream-only here |
| Compiler | Executed on the initial turn because `evaluatePersistentDelta = true` | A Project delta may be proposed even though the message asks for understanding | Terra/OpenAI persistent extraction plus deterministic validator |
| Project proposal | Executed if the extractor returns a valid non-empty candidate; observed in Case A | Observed transformation toward diagnostic-validation/study construction and partial loss of specific context | Persistent compiler, then PRJ candidate adapter |
| Project adoption | Executed only after the UI confirmation action | This is an explicit Human Decision in code, not a silent LLM write | Human/PRJ |
| Project snapshot | Built from the adopted canonical Project state | Already downstream of the degraded Project candidate | PRJ |
| Document projection | Available only after a separate document handoff action | Reads the adopted Project; does not recover the original intent | DOC |
| UI | Displays project-shaped state | Presents a Research Project and potentially a protocol instead of an understanding surface | Product UI |

`FIRST_DIVERGENT_STAGE_CASE_A = DOMAIN_GATE_NOT_EXECUTED_DUE_TO_HARD_CODED_PROJECT_CONSTRUCTION_SURFACE`

The existing deterministic router was exercised locally, without providers, with the exact Case A text. It returned:

`routeIntent = UNDERSTAND`

`confidence = HIGH`

Therefore, the observed `DESIGN_STUDY` behavior is not attributable to the router's decision logic. The router is outside the active path.

## Case B

Exact user message:

> Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d’étude ni de protocole.

### Reconstructed executed chain

| Stage | Executed state | Context/intent state | Owner or component |
|---|---|---|---|
| User message | Executed | ECV, MRI, CT, comparability, diffuse fibrosis, `UNDERSTAND`, `NO STUDY`, `NO PROTOCOL` are explicit | User |
| Domain Gate | **Not executed** | No guard protects the explicit non-project request | Product surface integration |
| Intent interpretation | **Not executed** | No structured `UNDERSTAND`; no routable negative constraint | Product surface integration |
| Semantic/context interpretation | Gemini conversational response executed, but its historical output is unavailable; no structured intent is retained | The persistent contribution created later explicitly sets `normalizedUnderstanding = null`, `routeProposal = null` and `negationsAndConstraints = []` | Gemini conversation then persistent contribution compiler |
| Routing | **Not executed** | Neither `UNDERSTAND` nor the explicit refusal is presented to a router | Product surface integration |
| QRY | **Not executed before Project adoption** | QRY is built only after the Project confirmation function returns | QRY downstream only |
| Compiler | Executed | Persistent extraction was allowed on a pure explanatory question; the observed candidate introduced two objectives | Terra/OpenAI persistent extraction plus validator |
| Project proposal | Executed | Project-shaped proposal; exact provider artifact unavailable | Persistent compiler and PRJ candidate adapter |
| Project adoption | Executed only after explicit confirmation | The Project visibly existed, which implies the confirmation path completed; no direct LLM write exists | Human/PRJ |
| Project snapshot | Executed after adoption | Carries the adopted candidate, not the discarded intent | PRJ |
| Document projection | Executed only after separate human document handoff | Produced a read-only `Protocole de travail` from the already adopted Project | DOC |
| UI | Executed | Shows generic question, generated objectives and protocol affordance | Product UI |

`FIRST_DIVERGENT_STAGE_CASE_B = DOMAIN_GATE_NOT_EXECUTED_DUE_TO_HARD_CODED_PROJECT_CONSTRUCTION_SURFACE`

The existing deterministic router was exercised locally, without providers, with the exact Case B text. It returned:

`routeIntent = UNDERSTAND`

`confidence = MEDIUM`

The product did not use this result.

## Context preservation matrix

Legend:

- `PRESERVED`: exact meaning remains explicit;
- `LOST`: the required element is absent from the observed representation;
- `TRANSFORMED_WITH_JUSTIFICATION`: a different representation is explicitly justified and faithful;
- `TRANSFORMED_WITHOUT_JUSTIFICATION`: the visible representation changes meaning, granularity or certainty without an admitted rule/source;
- `NOT_APPLICABLE`: the stage was not executed, or no stage-specific artifact exists from the historical session. It never means preservation was proven.

### Case B

| Element | User input | Interpreter | Router | QRY | Project proposal visible | Canonical Project | Document projection |
|---|---|---|---|---|---|---|---|
| ECV | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST in the observed Question/Objectives | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection content not captured |
| MRI | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRANSFORMED_WITHOUT_JUSTIFICATION to “chaque modalité” | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection content not captured |
| CT | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRANSFORMED_WITHOUT_JUSTIFICATION to “chaque modalité” | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection content not captured |
| Diffuse myocardial fibrosis | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST in the observed Question/Objectives | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection content not captured |
| Compare/comparability | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRANSFORMED_WITHOUT_JUSTIFICATION to literature-threshold concordance | The generated objective is proven adopted by its Project visibility; exact other objects are unavailable | Propagated only if present in Project; no recovery rule exists |
| UNDERSTAND | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST | LOST as routing intent; Project does not own it | LOST |
| NO STUDY | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST | LOST as a project-creation guard | LOST |
| NO PROTOCOL | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST | LOST as a document-generation guard | LOST; a `Protocole de travail` was created after a separate UI action |

The unavailable canonical snapshot prevents a claim that every scientific object was absent from hidden Project sections. The matrix therefore distinguishes the proven visible loss/transformation from unobserved internals. The loss of intent and explicit prohibitions is nevertheless deterministic: the active contribution contract carries neither routing intent nor negation constraints.

### Case A — bounded matrix

| Element | User input | Interpreter | Router | QRY | Project proposal visible | Canonical Project | Document projection |
|---|---|---|---|---|---|---|---|
| UNDERSTAND | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST | LOST as routing intent | LOST |
| no-reflow ↔ obstruction microvasculaire distinction | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRANSFORMED_WITHOUT_JUSTIFICATION by the observed diagnostic-validation reframing | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection not captured |
| angioplasty + stent + STEMI context | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST in the observed reframing | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection not captured |
| Cardiac MRI as the requested observation context | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRANSFORMED_WITHOUT_JUSTIFICATION from explanatory context to study/validation framing | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection not captured |
| Explicit relations | PRESERVED | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | LOST/PARTIALLY TRANSFORMED without a traceable rule | NOT_APPLICABLE — exact snapshot not exported | NOT_APPLICABLE — projection not captured |

## Intent preservation

The diagnosis distinguishes an incorrect router from a bypassed router:

| Check | Finding |
|---|---|
| Implicit default inside the legacy router | **Not demonstrated.** Exact A and B both resolve to `UNDERSTAND`. |
| Hard-coded product default | **Demonstrated.** The active page is a Project-construction workspace and opens with “Décrivez-moi le projet de recherche que vous souhaitez construire.” |
| Systematic priority of Project construction over `UNDERSTAND` | **Demonstrated at surface dispatch.** All ordinary initial turns are eligible for persistent Project extraction. |
| Loss of explicit negation | **Demonstrated at the structured boundary.** The persistent contribution sets `negationsAndConstraints` to an empty array and has no route field. |
| Every scientific question deterministically creates a Project | **Not claimed.** The extractor can return `NO_CHANGE`; however, every ordinary initial message is submitted to Project extraction, which is the unsafe precondition. |
| Fixture fallback | **Not involved.** No active-path fixture matcher is imported or called by `ProtocolDesignerWorkspace`. |
| Knowledge branch reachable from the active first-turn path | **No.** No Knowledge invocation occurs before or instead of Project extraction. |
| Mapping between linguistic interpretation and router | **Absent in the executed path**, rather than merely incomplete. |

The active UI also frames the first pending contribution as a “première structure d’étude” and offers “Cela correspond à mon projet”. This amplifies the dispatch error but occurs after the first divergence.

## First divergent stage

For both cases:

```text
User message
  ↓
DOMAIN GATE EXPECTED
  ╳ not called
INTENT / UNDERSTAND ROUTING EXPECTED
  ╳ not called
hard-coded project-construction workspace
  ↓
Gemini conversation + Terra persistent Project extraction
  ↓
PRJ proposal → human confirmation → canonical Project
  ↓
QRY → DOC → UI
```

`FIRST_DIVERGENT_STAGE = DOMAIN_GATE_NOT_EXECUTED_DUE_TO_HARD_CODED_PROJECT_CONSTRUCTION_SURFACE`

Secondary divergent stages:

| Case | Stage | Finding |
|---|---|---|
| A | `PERSISTENT_PROJECT_DELTA_COMPILER` | Explanatory content was converted into a study/diagnostic-validation candidate. |
| B | `PERSISTENT_PROJECT_DELTA_COMPILER` | Explicit non-project intent was discarded and unsupported objectives were emitted. |
| B | `PERSISTENT_DELTA_DETERMINISTIC_VALIDATION` | Literal source containment was sufficient; semantic entailment of generated `content` was not checked. |
| A/B | `PRJ_HUMAN_REVIEW_PROJECTION` | For an OBJECTIVE whose content differs from its source, the review displays the source text instead of the generated candidate content. |
| A/B | `PROJECT_UI_QUESTION_PRESENTATION` | The UI derives a project summary without reading canonical Question objects and may display “Projet de recherche à préciser.” |

## Invented content provenance

Target phrase:

> Examiner la concordance des seuils rapportés dans la littérature actuelle.

Classification:

`INVENTED_CONTENT_CLASSIFICATION = UNSUPPORTED_GENERATION`

Attribution:

`MOST_PROBABLE_ORIGIN = OPENAI_TERRA_PERSISTENT_DELTA_PROVIDER_OUTPUT`

Evidence by elimination and data flow:

1. the phrase is absent from the deployed commit and current repository code, fixtures, templates, QRY rules and document projections;
2. it is absent from the user message;
3. no governed Knowledge/owner call occurs on this path;
4. the current-turn Gemini conversational answer is not appended to the conversation passed to the same-turn persistent extractor;
5. the persistent extractor is the only component allowed to emit free `content` for an initial Project candidate;
6. `validatePersistentProjectDelta` checks that `sourceText` is an exact substring of the user turn, but it does not check that generated `content` is semantically entailed by that source;
7. the PRJ compiler then preserves the candidate content into Project objects; QRY is created later and is read-only; DOC projects the adopted Project.

The exact raw provider artifact is unavailable, so the precise request/response identifier and byte digest cannot be reported. The causal source class remains localized with high confidence. The phrase is not:

- `SUPPORTED_BY_USER`;
- `SUPPORTED_BY_GOVERNED_SCIENCE`;
- `DERIVED_WITH_EXPLICIT_RULE`.

The second objective, “Examiner les limites techniques et physiologiques de chaque modalité.”, follows the same unsupported path unless an absent provider artifact demonstrates an explicit user-adopted prior proposal. No such prior proposal exists in an initial turn.

## Owner attribution

| Transformation | Actual owner/component | Attribution |
|---|---|---|
| Selecting Project-construction before Domain Gate | Product surface integration | Root cause owner |
| Natural conversational reply | Gemini mediation | Unstructured reply only; historical exact reply unavailable |
| Producing Project candidate content | Terra/OpenAI persistent extraction | Owner of unsupported candidate generation |
| Structural/literal admission | Product deterministic validator | Propagation enabler; no semantic entailment gate |
| Candidate review | PRJ human-review projection + Product UI | Propagation enabler; can hide generated OBJECTIVE content behind its source text |
| Project write | Human Decision through PRJ | Explicit, not silent; decision was made on a degraded/partially obscured proposal |
| Project snapshot | PRJ | Faithful downstream materialization of the adopted state; not the first defect |
| Navigation after adoption | QRY | Downstream; no Project write; not the source of the objectives |
| Protocol projection | DOC | Read-only downstream projection; not the source of the objectives |
| Knowledge/ST/Imaging/VAL/REG | Not invoked | Must not be blamed |

## Downstream propagation

The observed sequence is causally reconstructible:

1. the page preselects a Research Project surface before reading intent;
2. the user message is sent with `evaluatePersistentDelta = true`;
3. Terra emits a typed Project delta candidate;
4. the deterministic boundary admits structurally valid candidates whose `sourceText` is literal, even when `content` adds unsupported meaning;
5. the contribution converter sets no structured understanding, route or negative constraints;
6. PRJ prepares a candidate and the UI presents a study-shaped review;
7. a human confirmation is required and creates Project version 1;
8. only then does the product build QRY navigation;
9. the Project panel computes its visible “Question” from condition/intervention/comparator/measurement and otherwise returns “Projet de recherche à préciser.”; it filters the actual Question section to show only objectives, so a canonical scientific-question object can remain hidden;
10. a separate human action authorizes DOC to produce a `Protocole de travail` from that Project.

No automatic Project write or automatic document handoff was found. The failure is nevertheless product-critical because the earlier UI and review path led an `UNDERSTAND` request into an inappropriate Project decision.

## Product TRACE coverage

`PRODUCT_TRACE_INTEGRATION = ABSENT`

The deployed `main@9be06edc` session stores a bounded local `bridgeTraces` array containing raw turn, assistant reply, persistent provider artifact, wire/candidate values, deterministic validation, Project change sets, review projection, human decision and Project versions. That is useful local diagnostic state, not the Wave 1 cross-owner Scientific Execution Trace.

The current branch initializes Knowledge, ValidationRun and Scientific Execution Trace ledgers in the session, but the unchanged active `ProtocolDesignerWorkspace` does not invoke owner runtimes or append Scientific Execution Trace events for this conversation path. Initialization of an empty ledger is not integration.

Consequences:

- no event identifies Domain Gate or routing because neither is executed;
- no event binds this product turn to a Knowledge/ST/Imaging/VAL run because none occurs;
- the first divergent stage cannot be recovered from Wave 1 TRACE events;
- the missing exported browser session prevents replay of the exact provider artifacts;
- `W1_OBSERVABILITY_READY = YES` does not prove observability of this product surface.

The browser control capability was not used to inspect local storage: its operating contract forbids inspection of browser storage/session stores. No workaround was attempted.

## Root cause

`ROOT_CAUSE = PRODUCT_SURFACE_DISPATCH_BYPASSES_DOMAIN_GATE_INTENT_ROUTING_AND_UNDERSTAND_OWNER_PATH`

The active product is not the three-path Protocol Designer described by the older V1 evidence. It is a functional-reset Project workspace whose first message, placeholder, bridge request and confirmation UI all assume project construction. Existing `UNDERSTAND`, semantic interpretation and Knowledge components remain in the repository, but they are disconnected from this active surface.

Case B exposes the highest-risk consequence: the explicit prohibition against an étude/protocole is neither preserved as a routing constraint nor allowed to stop Project extraction. Once the extractor emits a candidate, structural source anchoring can admit unsupported normalized content; review may present the literal source rather than that generated content; and the Project UI later displays the generated objectives plus a protocol affordance.

This is an integration/root-routing defect with secondary compiler-validation and projection defects. It is not a scientific-quality defect in Knowledge, Scientific Thinking, Imaging, REG or VAL.

## What is NOT defective

- The deployed SHA is known; the diagnosis is not blocked by an unknown deployment.
- The current branch and deployed main contain byte-identical active-path files; the finding is not caused by Wave 1 branch drift.
- The existing deterministic router is not the first defect: exact Cases A and B both route to `UNDERSTAND` when invoked.
- No fixture fallback caused these observations on the active path.
- QRY is not the first defect and cannot have invented the initial objectives; it is created after Project adoption and remains read-only.
- DOC is not the first defect; it projects an already adopted Project after an explicit handoff decision.
- PRJ does not perform a silent LLM Project write; adoption requires the user action “Cela correspond à mon projet”.
- The canonical Project snapshot mechanism is not shown to corrupt an otherwise correct input; its input was already degraded.
- Knowledge, Scientific Thinking, Imaging, VAL and REG were not invoked and cannot be assigned this failure.
- No conclusion is made about the scientific quality or completeness of any owner.
- The Editorial Engine is not involved.

## Repair surface

No repair is implemented or authorized by this mission. The bounded repair surface, in causal order, is:

1. **Product dispatch:** invoke the admitted Domain Gate and structured intent routing before any persistent Project extraction.
2. **Intent gate:** preserve `UNDERSTAND`, explicit non-project intent and `NO STUDY`/`NO PROTOCOL`; route explanatory requests to the existing Knowledge/understanding surface without creating a Project.
3. **Persistent extraction gate:** allow Project-delta extraction only after an explicit project-creation/update finality; fail closed for explanatory questions and explicit non-project requests.
4. **Semantic admission:** validate that generated candidate `content` is supported by its exact source anchor or governed owner evidence; literal containment of `sourceText` alone is insufficient.
5. **Human review fidelity:** show the exact candidate content that would be adopted, alongside its literal source; never substitute the source for a materially different OBJECTIVE.
6. **Project question presentation:** prefer the current canonical Scientific Question object; do not hide it behind a project-summary fallback.
7. **Product observability:** connect the existing passive TRACE concept to this path only if separately authorized, covering dispatch, intent, compiler, review and Project adoption without becoming an orchestrator.
8. **Non-regression:** add the exact A/B inputs as bounded product routing/context tests, with zero provider calls.

The first authorized repair should remain product integration work on the existing contracts. It does not require Wave 2, a new scientific engine, a new corpus or a normative change.

## Limitations

- The exact browser-local hands-on session and its `bridgeTraces` were not exported.
- The exact Gemini conversation reply, Terra structured arguments, provider response IDs, usage and digests for A/B are unavailable.
- The Case A visible transformation was supplied as an observed summary rather than a complete Project/session export.
- The Case B protocol body was not captured; only its creation and the visible Project question/objectives are established.
- Therefore, this report does not claim that every explicit scientific term was absent from every hidden canonical Project object or document section.
- It does establish that the routing intent and explicit project/protocol prohibitions were not represented in the executed structured path, and that the first divergence precedes all scientific owners.
- No real provider reproduction was attempted because it would spend quota, create non-identical evidence and violate the bounded diagnostic cost rule.

## Cost

| Item | Count |
|---|---:|
| External LLM/provider calls | `0` |
| Gemini calls | `0` |
| OpenAI/Terra calls | `0` |
| Other LLM calls | `0` |
| Scientific campaigns | `0` |
| Benchmarks | `0` |
| Broad reruns | `0` |
| Targeted deterministic tests | `24/24 PASS` across 3 files |
| Exact local router diagnostics | `2` cases, both `UNDERSTAND` |
| Product repairs | `0` |
| Deployments | `0` |
| Merges | `0` |
| Pushes | `0` |

Targeted tests executed:

- `src/features/protocol-designer/__tests__/p-web-06-v1.test.ts`: `6/6 PASS`;
- `src/features/protocol-designer/functional-reset/__tests__/minimal-product-bridge.test.ts`: `11/11 PASS`;
- `src/features/system-integration/__tests__/end-to-end.test.ts`: `7/7 PASS`.

These tests prove only deterministic contract behavior. They are not a scientific PASS and do not reproduce the historical provider outputs.
