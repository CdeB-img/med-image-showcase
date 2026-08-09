# PRJ-001 — Research Project Construction V1 — Implementation Report

Document level: implementation evidence report  
Version: 1.0  
Date: 2026-08-10  
Repository: `noxia-dev`

## 1. Decision

`RESEARCH_PROJECT_CONSTRUCTION_V1_IMPLEMENTED_WITH_LIMITATIONS`

PRJ-001 is implemented as a deterministic, versioned Research Project construction capability connected to the existing `DESIGN_STUDY` journey. It constructs a structured study candidate from the confirmed scientific Question, ST-001 context, optional IMG-001 contribution, Knowledge results, constraints, unknowns, provenance, and explicit human decisions. It does not generate a final protocol or simulate future specialized engines.

The qualification is limited, rather than unqualified, for four evidenced reasons: the current IMG-001 producer cannot reach its frozen Project Construction handoff from the live application; complete manual keyboard focus behavior could not be proven with the available in-app browser driver; the local browser exercise used the deterministic fallback rather than a live Gemini call; and three global tests remain blocked by a pre-existing dirty external Editorial Engine checkout.

This decision is not a PD-011 PASS, a global scientific validation, an approved protocol, a regulatory validation, or a funding decision.

## 2. Authorities

The mandated governance order was followed before analysis or modification:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. NOXIA Founding Charter;
3. Protocol Designer Scientific Product Manifesto;
4. Protocol Designer Product Specification;
5. PD-003 — Research Object Model;
6. PD-004 — UX Manifesto;
7. Official UX Manual;
8. PD-005 — Prompt Library Architecture;
9. PD-007 — Implementation Readiness;
10. PD-009 — Decision Engine Architecture;
11. PD-011 — Evaluation Framework;
12. PD-012 — Scientific Program Architecture;
13. PD-013 — Scientific Program Registry;
14. RDE-001 — Research Design Engine Architecture;
15. RDE-002 — Research Design Workflow;
16. RDE-003 — Imaging Engine Architecture;
17. KE-001 — Knowledge Engine Architecture;
18. ENG-001, ENG-002, and ENG-003 implementation reports;
19. ST-001 implementation report;
20. IMG-001 implementation report;
21. the external Editorial Engine architecture manifesto, read-only.

The evidence classes were kept separate:

- **Established principles:** Question as root, one canonical Research Project, structured runtime truth, local readiness, human decision gates, provenance, deterministic dependency propagation, and refusal when required evidence is absent.
- **Normative references:** the authorities listed above. They were consumed, not modified.
- **Scientific corpus:** no corpus assertion was created or changed. Existing Knowledge results are accepted only as traced inputs.
- **Target:** the full RDE-001/RDE-002 Research Design / Project Construction capability described by PRJ-001.
- **Actually implemented state:** the bounded V1 runtime, UI, session, tests, and handoffs documented here.
- **Hypotheses:** future Data, Biostatistics, Regulatory, Economics, Safety, Operations, Recruitment, and Document engines remain specialized dependencies; PRJ-001 records their inputs and questions without simulating their conclusions.

One contradiction is preserved explicitly. The Source-of-Truth index snapshot describes the general Research Design, Knowledge, and Imaging engines as not demonstrated, while later Level-3 implementation reports document bounded local implementations. PRJ-001 consumes the bounded implementations and does not silently promote them to general engine validation. The index was not updated because this mission does not admit or modify a normative authority.

## 3. Baseline

- Branch: `main`.
- Baseline HEAD: `7e96ce70a9d6dea837c4dc86174433c0cf0d2d2d`.
- NOXIA worktree: clean before PRJ-001.
- External Editorial Engine HEAD: `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`.
- External Editorial Engine worktree: already dirty before PRJ-001; kept read-only.
- No concurrent change to the PRJ-001 files or contracts was detected during the mission.

## 4. Preconditions

ST-001 concludes `SCIENTIFIC_THINKING_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS` and IMG-001 concludes `IMAGING_STUDY_DESIGNER_V1_IMPLEMENTED_WITH_LIMITATIONS`; both are accepted precondition states under PRJ-001.

The ST-001 handoff is consumable. IMG-001 is consumable at the PRJ contract level only when its handoff is `FROZEN_BY_HUMAN`; however, the currently implemented IMG-001 live producer cannot reach that state because equipment compatibility remains unresolved and blocks its freeze gate. PRJ-001 therefore refuses an imaging-dependent construction until the producer supplies a frozen handoff. Non-imaging projects remain fully supported.

## 5. Architecture implemented

The implementation is a bounded feature under `src/features/research-project-construction`. It contains:

- versioned input and result contracts with runtime validation;
- deterministic project construction and stable digests;
- a runtime Project Graph and Decision/Impact Graph, without a new ontology;
- human decision, major-change, version-freeze, and document-handoff services;
- a versioned session integrated into the single Protocol Designer session;
- an eight-stage progressive-disclosure interface;
- dedicated contract, product-case, graph, decision, versioning, change, and UI tests.

The LLM boundary is explicit: language interpretation may occur upstream, but no LLM selects a design, creates a scientific object without input support, invents a number, resolves a specialized domain, or freezes a version.

## 6. Input

`ResearchProjectConstructionInput` includes `projectId`, `strategyVersion`, the confirmed scientific Question, objectives, hypotheses, mechanisms, scientific context, Knowledge results, optional `ImagingDesignResult`, known Population and temporal information, constraints, existing decisions, uncertainties, contradictions, user-provided information, provenance, trace, and explicit ST/IMG handoff states.

The Protocol Designer adapter builds this input from the existing session. It does not create a second Research Project. Input validation is strict and the imaging handoff status participates in the input digest, so a changed upstream handoff invalidates a stale PRJ session.

## 7. Output

`ResearchProjectDesignResult` implements every required output family: Question, objectives, hypotheses, Population, design candidates and human selection, groups, comparators, Visits, temporal structure, endpoint candidates, Variables, measurement dependencies, analysis and sizing requirements, Imaging contribution, future specialized-engine requirements, feasibility, recruitment, multicenter, biases, confounders, risks, limitations, contradictions, unknowns, alternatives, compromises, decision gates, dependency and impact graphs, local and projection readiness, provenance, trace, version, document handoff, adaptive questions, and refusal.

The structured result is the runtime reference. The displayed narrative is explicitly marked as a projection and cannot own project truth.

## 8. Project Graph

The runtime graph implements the required chain:

`Question → Objective → Hypothesis → Population → StudyDesign → Group → Visit → Measurement → Variable → Endpoint → AnalysisRequirement`

When Imaging applies, it also projects:

`Imaging → Biomarker → Acquisition → Variable`

Every node records why it exists; every edge records its relation. The dependency and impact projections answer both “why does this element exist?” and “what must be reviewed if it changes?”.

## 9. Population

Population construction separates `populationConcept` from `operationalEligibility`. The concept retains pathology/condition, stage, phenotype, clinical context, exposure/intervention, Question-required characteristics, justified exclusions, and relevant subpopulations. Future operational eligibility requirements remain unworded and explicitly assigned to a future specialized definition.

When the Population is insufficient, the output stays partial and asks an adaptive question explaining its decision impact. It does not invent an exhaustive inclusion/exclusion list.

## 10. Study Design

The engine produces only context-supported design families and explains for each candidate: why it addresses the Question, what it can estimate, limitations, biases, constraints, implied decisions, and source signals. Supported V1 families include cross-sectional observational, prospective/retrospective longitudinal cohort, prospective prognostic cohort, methodological validation, comparative observational, and case-control.

No candidate is ranked or selected automatically. `selectedStudyDesignCandidate` remains `null` until a human decision record approves an explicit candidate. A simple Question remains a minimal cross-sectional candidate instead of being inflated into a prospective multicenter study.

## 11. Groups

Groups and comparators are created only with a scientific justification and retain source references and review state. The implementation supports study Population, reference, exposure, comparator, within-subject, and method roles. It does not add a healthy-control group by convention.

## 12. Temporal Structure

The temporal structure is derived from the Question, declared phenomenon, outcome, intervention/exposure, and supported design purpose. It distinguishes baseline, event, follow-up, repeated measurement, scientific windows, and future operational windows. Unknown timings remain unknown; no arbitrary `T0/T1/T2` schedule or duration is produced.

## 13. Visits

Each Visit records its temporal role, timing status, justification, hypotheses served, endpoints contributed to, measurements, and dependencies. Longitudinal, prognostic, and validation cases receive only the Visits needed by their stated scientific purpose. A Visit without a justification is not emitted.

## 14. Endpoints

Endpoint candidates preserve the chain to Question, objective, hypothesis, Variable, Population, timing, and future analysis. Their proposed `PRIMARY`, `SECONDARY`, `EXPLORATORY`, or undecided role remains a human gate. When no defensible observable outcome is available, the project remains partial and requests it instead of inventing an Endpoint.

## 15. Variables

Variables retain definition, source, role, timing, Endpoint and analysis links, quality requirements, provenance, and known/partial/unknown status. Imaging Variables are consumed from IMG-001 only through the supplied structured result. The future Data Dictionary name remains `null`; PRJ-001 does not impose a technical data name.

## 16. Analysis Requirements

The result identifies only analysis purposes implied by the current Question and Endpoint chain: description, comparison, association, prediction, change over time, repeated measures, agreement, validation, time-to-event, center effect, or adjustment. The final statistical model is always `null` and requires Biostatistics review.

## 17. Sizing Requirements

Sizing is an input-requirements handoff. Candidate inputs such as effect size, variance/distribution, event rate, follow-up, intra-subject correlation, center structure, attrition, alpha, and target power are listed only when relevant. Every value, sample size, and power remains `null` until sourced or provided and evaluated by the future specialized engine.

## 18. Recruitment

Recruitment output identifies only the future model inputs: rarity, prevalence/incidence, active caseload, consent, eligibility, center capacity, attrition, and duration when applicable. Center count, recruitment rate, and recruitment duration remain `null`. Rare Population cases expose recruitment as a risk and an adaptive need without inventing a scenario.

## 19. Multicenter

The assessment distinguishes declared mode, scientific necessity, operational necessity, equipment/center variability, generalizability, expertise, and future center-effect analysis. It carries the invariant `MULTICENTER_IS_NOT_AUTOMATICALLY_SUPERIOR`, preserves a monocenter alternative whenever defensible, and never assigns a center count.

## 20. Feasibility

Feasibility is multidimensional and has no global score. The V1 projection separates scientific, measurement, Population, technical, data, statistical, operational, regulatory, economic, and safety domains. Domains without an implemented specialized engine are marked `NOT_EVALUATED_BY_SPECIALIZED_ENGINE` or `SPECIALIZED_ENGINE_REQUIRED`; their results are not simulated.

## 21. Biases

Only biases connected to the active design are emitted. Examples exercised by tests include selection, temporal/attrition, method/measurement, and center effects. Each record explains its contextual path, affected objects, candidate mitigation, and provenance; no generic bias encyclopedia is displayed.

## 22. Confounders

Confounder candidates appear only when a contextual justification exists. In the prognostic case, baseline severity is exposed as a candidate only with an explanation, affected objects, measurement need, explicit Knowledge support state, and mandatory future Biostatistics decision. No standard list is injected.

## 23. Data Requirements

The Data handoff identifies Variables, sources, Visits, repetition, derivation, Imaging data, dependencies, quality, provenance, and missingness needs. Every item is marked `SPECIALIZED_ENGINE_REQUIRED`. No CRF or final Data Dictionary is created.

## 24. Biostatistics Requirements

The Biostatistics handoff contains Question, hypotheses, design candidates, groups, endpoints, Variables, timing, repeated measures, multicenter structure, analysis purposes, known and unknown assumptions, and missing numerical inputs. It contains no selected model, sample-size calculation, or invented assumption.

## 25. Regulatory Questions

PRJ-001 records questions about jurisdiction, observational/interventional nature, product or device, vulnerable Population, data constraints, procedures, and possible authorizations. It never states that CPP, ANSM, or a RIPH category applies; all such questions remain unevaluated by the future governed engine.

## 26. Economics Questions

The output identifies examinations, Visits, Core Lab, readings, storage, centers, staff, monitoring, licences, procedures, analyses, and subcontracting as future cost dependencies. It produces no price or budget. Funding fit is represented only as `FUNDING_STRATEGY_REQUIRES_SPECIALIZED_REVIEW`.

## 27. Risks

Risks preserve source, affected objects, detectability, candidate mitigation, future owner, and provenance. Probability is `null`; impact remains qualitative when evidenced by the current project. No numerical probability or severity is invented.

## 28. Alternatives

When several designs are defensible, the output preserves multiple alternatives and their capabilities, non-capabilities, requirements, risks, timing consequences, Endpoint consequences, data consequences, specialized needs, and uncertainty. It never chooses a “best” option automatically. The monocenter/multicenter trade-off remains visible for rare and multicenter contexts.

## 29. Human Decisions

Explicit gates cover at least Population, Study Design, groups/comparators when structurally relevant, primary Endpoint role, major compromise, alternative strategy, structural limitation, version freeze, and Document handoff. Decisions are recorded with actor, reason, time, targets, and optional mandate. No gate can be approved by the LLM.

## 30. Impact Propagation

All mandated change events are implemented: `PopulationChanged`, `StudyDesignChanged`, `GroupChanged`, `VisitChanged`, `EndpointChanged`, `VariableChanged`, `TimingChanged`, `ImagingStrategyChanged`, `ConstraintChanged`, `KnowledgeUpdated`, and `DecisionReopened`.

A major change is first represented as `PENDING_CONFIRMATION`. Before confirmation, the interface shows what is preserved, requires review, is invalidated, becomes obsolete, is newly required, and which decisions are reopened. Confirm or reject is explicit; no major project change is silent.

## 31. Versioning

A project version contains object references, decision records, Knowledge state, unknowns, contradictions, limitations, dependencies, confirmed changes, time, actor, and optional mandate. Freeze is impossible until the critical human gates and selected design are satisfied. Frozen versions are appended immutably to `versionHistory`; a later candidate never overwrites an earlier version.

## 32. Projection Readiness

Fourteen projection families are assessed locally: Protocol, Synopsis, Funding, Publication, CRF, Data Dictionary, SAP, Budget, Timeline, CPP, ANSM, Core Lab Manual, Monitoring Plan, and Investigator Guide. Availability is one of `NOT_AVAILABLE`, `STRUCTURE_ONLY`, `PARTIALLY_GENERATABLE`, or `READY_FOR_PROJECTION` and means data availability only—not scientific quality, approval, or regulatory readiness. No aggregate readiness percentage exists.

## 33. Document Handoff

The handoff is versioned and contains the complete project structure, decisions, provenance, unknowns, contradictions, limitations, specialized-engine requirements, and candidate-version reference. Its status is independently controlled by version freeze and a human Document handoff decision. It carries the boundary `NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS`; PRJ-001 generates no document.

## 34. UX

The `DESIGN_STUDY` journey now progresses through eight functional stages:

1. Question scientifique;
2. Population;
3. Design;
4. Groupes et temporalité;
5. Critères et mesures;
6. Faisabilité;
7. Risques et alternatives;
8. Stratégie de projet.

The interface starts with the current decision and project state, explains why each adaptive question is asked and what it changes, accepts free text and “I do not know”, and reveals alternatives, dependencies, feasibility, provenance, and history progressively. Internal IDs, JSON, enums, and the full graph are not exposed initially. Context is preserved when returning to Scientific Thinking, Imaging, or Knowledge Explorer. A non-imaging Question enters PRJ directly.

## 35. Browser

The local application was exercised through the real browser at `/protocol-designer/demo`. Browser findings produced three corrections during the mission: explicit “without imaging” language now routes directly to PRJ; the PRJ input digest now includes IMG handoff state; and adaptive Population/outcome answers now update the constructed project rather than remaining display-only.

| Scenario | Observed result |
|---|---|
| 1. Simple cohort | Minimal cross-sectional candidate; Population and design required explicit human decisions. |
| 2. Longitudinal | Longitudinal candidate with justified baseline and follow-up. |
| 3. Prognostic | Baseline-to-future-outcome structure, candidate confounder, no N or power. |
| 4. Methodological validation | Method/within-subject comparison, justified repeat, no artificial prognostic strategy. |
| 5. Multicenter | Center variability and bias exposed; monocenter alternative and null center count preserved. |
| 6. Rare Population | Rarity and recruitment needs visible; no center, rate, or duration invented. |
| 7. Infeasible project | Conflict returned to ST/IMG rather than being artificially completed. |
| 8. Endpoint change | Confirmation dialog and downstream review/invalidated/obsolete impacts displayed. |
| 9. No Imaging | Direct PRJ construction; Imaging marked not applicable. |
| 10. Incomplete project | Partial project with adaptive questions and explicit unknowns. |
| 11. Return to ST | Scientific context preserved. |
| 12. Return to IMG | Live frozen-IMG-to-PRJ transition blocked by the upstream IMG-001 compatibility limitation. |
| 13. Projection passage | All 14 local projection-readiness families displayed; no document generated. |
| 14. Reset | Explicit confirmation and deletion of the current session, then return to Conversation. |

Knowledge Explorer was opened from Scientific Thinking and closed back to the same scientific context. No browser console error was observed during the completed scenarios.

## 36. Responsive/accessibility

The project interface was checked at 320, 390, 768, 1024, 1440, and 1920 px. Project cards, stage navigation, decision blocks, alternatives, impact displays, feasibility, and progressive-disclosure sections remained usable without document-level horizontal overflow. At narrow widths, the existing journey tab strip scrolls horizontally by design; project content itself does not overflow.

All interactive controls inspected exposed accessible labels, and confirmation dialogs exposed a dialog role and accessible name. Automated UI and preserved P-WEB keyboard tests pass. The available in-app browser key driver did not reliably advance focus between native stage buttons, so complete manual proof of focus order, focus-visible styling, and focus return remains unconfirmed and is reported as a limitation rather than silently inferred.

## 37. Tests

Validation results:

| Validation | Result |
|---|---|
| PRJ-001 dedicated suite | PASS — 5 files, 56 tests |
| ST-001, IMG-001, Knowledge, Protocol Designer targeted non-regression | PASS — 29 files, 317 tests |
| Privacy, routes, and SEO targeted tests | PASS — 4 files, 85 tests |
| Typecheck | PASS |
| Lint | PASS |
| Production build | PASS |
| SEO audit | PASS — 40 pages, 0 errors, 0 warnings; generated timestamp change reverted |
| Global suite | 869 PASS / 872; 3 failures isolated to pre-existing external Editorial Engine dirtiness |
| `git diff --check` | PASS after creation of this report |

The three global failures are the existing external-cleanliness guards in `scientific-knowledge-graph-web.test.mjs`, `scientific-multidomain.test.mjs`, and `scientific-corpus.test.mjs`. They inspect `/Users/charles/Documents/Projets/editorial-engine`, which was dirty at baseline and remained read-only. No PRJ-001 test, build, ST, IMG, Knowledge, Protocol Designer, privacy, route, or SEO regression failed.

Build warnings are non-blocking: stale `caniuse-lite` metadata, a `react-helmet-async` pure-annotation warning, and a large `ProtocolDesignerDemo` chunk of approximately 698 kB (approximately 191 kB gzip).

## 38. Limitations

1. **IMG-001 producer handoff:** current live IMG-001 equipment compatibility remains unknown, produces a broken compatibility dependency, and therefore cannot freeze `projectConstructionHandoff`. PRJ-001 correctly refuses the imaging-dependent path. The Fabry consumer-contract test uses a clearly identified frozen-handoff fixture and does not claim that live IMG produces it.
2. **Manual keyboard evidence:** accessible semantics and automated keyboard regressions pass, but the in-app browser driver did not provide complete evidence for focus order, visible focus, or focus return across all controls.
3. **LLM provider evidence:** browser validation exercised the deterministic local fallback; no live Gemini interpretation was required or claimed.
4. **External repository state:** three global guards fail solely because the separate Editorial Engine repository was already dirty. No external file was modified.
5. **Future engines:** Data, Biostatistics, Regulatory, Economics, Safety, Operations, Recruitment calculation, and Document projection remain specialized capabilities. PRJ-001 provides requirements, questions, and handoffs only.
6. **Performance warning:** the demonstrator route remains a large deferred chunk; this does not block functional V1 validation but should be addressed before a performance acceptance claim.

None of these limitations permits silent invention, automatic design selection, a bypassed human gate, an invalid build, or a regression in the implemented PRJ boundary.

## 39. Files

Created:

- `src/features/research-project-construction/types.ts`
- `src/features/research-project-construction/input.ts`
- `src/features/research-project-construction/engine.ts`
- `src/features/research-project-construction/graph.ts`
- `src/features/research-project-construction/change.ts`
- `src/features/research-project-construction/session.ts`
- `src/features/research-project-construction/index.ts`
- `src/features/research-project-construction/ResearchProjectConstructionView.tsx`
- `src/features/research-project-construction/__tests__/fixtures.ts`
- `src/features/research-project-construction/__tests__/contracts-and-graph.test.ts`
- `src/features/research-project-construction/__tests__/decisions-versioning-change.test.ts`
- `src/features/research-project-construction/__tests__/mandatory-cases.test.ts`
- `src/features/research-project-construction/__tests__/separated-contract-areas.test.ts`
- `src/features/research-project-construction/__tests__/ui.test.tsx`
- `docs/prj-001-research-project-construction-v1-implementation-report.md`

Modified:

- `src/features/protocol-designer/intake/types.ts`
- `src/features/protocol-designer/intake/session.ts`
- `src/features/protocol-designer/intake/journey.ts`
- `src/pages/ProtocolDesignerDemo.tsx`
- `package.json`

No normative document, RDE, KE-001, Scientific Program, Reasoning Book, scientific corpus, Knowledge Graph, Source-of-Truth index, or Editorial Engine file was modified.

## 40. Contracts

| Contract | Evidence status |
|---|---|
| PRJ01-C01 — Question remains root | PASS — input, result, graph root, and dependency tests. |
| PRJ01-C02 — Project uses one source of truth | PASS — single versioned Protocol Designer session and projection notice. |
| PRJ01-C03 — Population scientifically justified | PASS — concept, justification, sources, unknowns, and human gate. |
| PRJ01-C04 — Study Design justified | PASS — every candidate carries purpose, limits, biases, constraints, and signals. |
| PRJ01-C05 — No automatic design selection | PASS — selection requires a recorded human approval. |
| PRJ01-C06 — Every group justified | PASS — group schema and product cases. |
| PRJ01-C07 — Every visit justified | PASS — Visit schema, graph, and temporal cases. |
| PRJ01-C08 — Endpoint linked to objective | PASS — explicit objective/hypothesis/question links. |
| PRJ01-C09 — Variable linked to endpoint | PASS — bidirectional result references and graph edges. |
| PRJ01-C10 — Analysis need explicit | PASS — reason, purpose, Endpoint/Variable links, and Biostat handoff. |
| PRJ01-C11 — No invented statistical values | PASS — all final models and numerical assumptions remain absent or null. |
| PRJ01-C12 — No invented sample size | PASS — `sampleSize: null`. |
| PRJ01-C13 — No invented prevalence | PASS — prevalence is a future sourced recruitment input. |
| PRJ01-C14 — No arbitrary center count | PASS — `centerCount: null`. |
| PRJ01-C15 — Recruitment uncertainty explicit | PASS — requirements-only model with null rate/duration. |
| PRJ01-C16 — Multicenter is not automatically superior | PASS — invariant notice and monocenter alternative. |
| PRJ01-C17 — Biases contextual | PASS — emitted through active design paths only. |
| PRJ01-C18 — Confounders contextual | PASS — prognostic path with support state and future decision. |
| PRJ01-C19 — Specialized engines not simulated | PASS — specialized states/questions/handoffs only. |
| PRJ01-C20 — Human decision required | PASS — recorded gates for structural decisions, freeze, and handoff. |
| PRJ01-C21 — Major change propagated | PASS — 11 events, confirmation, and six impact states. |
| PRJ01-C22 — No global readiness score | PASS — domain-local feasibility and projection availability only. |
| PRJ01-C23 — Same inputs → same structured project | PASS — stable digest and determinism tests. |
| PRJ01-C24 — Project without imaging supported | PASS — direct route and `NOT_APPLICABLE` contribution. |
| PRJ01-C25 — Projection does not own project truth | PASS — explicit runtime boundary and single session authority. |
| PRJ01-C26 — Clean Document Engine handoff | PASS — versioned structured handoff, independent human gate, no document generated. |

## 41. Decision of next step

The next admissible step is to resolve and validate IMG-001 equipment compatibility/freeze behavior, then repeat the live frozen-IMG-to-PRJ browser transition and complete an assistive-technology keyboard/focus review. A future DOC-001 mission may consume only a human-authorized, frozen PRJ handoff; it must not treat this implementation decision as scientific or regulatory approval.

`RESEARCH_PROJECT_CONSTRUCTION_V1_IMPLEMENTED_WITH_LIMITATIONS`
