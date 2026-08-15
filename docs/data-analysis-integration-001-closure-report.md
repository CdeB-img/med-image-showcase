# DATA-ANALYSIS-INTEGRATION-001 — Closure Report

**Decision:** `DAI001_V1_DATA_ANALYSIS_INTEGRATION_CLOSED_READY_FOR_VAL001`  
**Scope:** V1 design-time integration only  
**Closure date:** 2026-08-15  
**Starting commit:** `6644740b`  
**Ending commit before closure commit:** `83749f35`

## 1. Decision and real scope

NOXIA now implements the governed design chain:

`Research Project → Study Data Planning → Data Management Planning → Biostatistics Planning → Templates → Document projections`.

This is `CAPABILITY_INTEGRATED_FOR_V1_DESIGN_TIME`. It is not Data Management runtime, analysis execution, scientific qualification, publication authorization, or `PD-011 PASS`.

## 2. Part commits

| Part | Commit | Result |
|---|---|---|
| Contracts and handoffs | `c345bfc2` | Canonical contribution envelopes and read-only handoffs |
| Data and Data Management | `d3bd969f` | Study Data Plan and DM Plan |
| Biostatistics | `aef67c80` | Analysis specifications, estimands, methods, missingness, multiplicity, sensitivities, dimensioning and logical projections |
| Project, UI and documents | `83749f35` | Human adoption, versioning, stale/freeze guards, Project view, product surface and projection adapters |

No normative source, corpus, `SOURCE-OF-TRUTH-INDEX`, SEM archive, Blind artifact, or sibling `editorial-engine` file was modified by DAI-001.

## 3. Integrated contracts and capabilities

- Study Data: DataNeed, CanonicalVariable references, ExpectedVariableOccasion, planned source/method and readiness.
- Data Management: definitions, collection specification, logical CRF, Data Dictionary, Schedule of Activities and design-time release requirements.
- Biostatistics: AnalysisSpecification, Estimand, AnalysisPopulation, variable roles, method definition, assumptions, diagnostics, missing-data strategy, intercurrent events, multiplicity, sensitivities, dimensioning assumptions and expected-output definitions.
- Contributions: immutable candidate envelope, canonical digest, provenance, explicit targets and no direct Project write.
- Project: one canonical Project identity, versioned adopted state and reconstructible history.

## 4. Research Project and Human Decision

Only `applyDataAnalysisPlanningDecisionToProject` may apply a planning Contribution. It requires an engaging Human Decision with actor, mandate, timestamp, explicit targets, matching Project identity/version/digest and matching Contribution provenance.

- Accepted decision: one atomic write to a new candidate Project version.
- Invalid or stale decision: zero write.
- Partial adoption: only named targets are adopted.
- Rejected and deferred decisions: candidate identity and disposition remain historical.
- Frozen Project: ordinary mutation is refused.
- The previous Project object remains unchanged and reconstructible.

## 5. Identity continuity

The dedicated `CV-001` test preserves the same CanonicalVariable reference through Research Project, Study Data Plan, DataCollectionSpecification, logical CRF, logical Data Dictionary, logical Schedule of Activities, AnalysisSpecification, AnalysisVariableRoleAssignment, logical SAP, template blocks and DocumentProjection. No `_COPY`, CRF-owned identity or statistical identity is created.

## 6. Product surface

The existing Protocol Designer Project flow now exposes a ninth `Données & analyses` step with:

- Data, Data Management and Analyses blocks;
- readiness, unknowns and decisions;
- derived-document statuses;
- Standard and Expert views;
- local drafts with cancel;
- adopt, reject and defer through the Human Decision envelope;
- explicit stale and frozen-state behavior.

The surface exposes no ingestion, query execution, patient correction, freeze/lock/release, statistical execution, imputation, randomization or sample-size calculation action.

## 7. Templates and documents

Projection inputs cover Protocol Data & Analysis, Data Management Plan, CRF Specification, Data Dictionary, Schedule of Activities, SAP and Statistical Methods. Every projection is `projectionOnly=true`, `sourceOfTruth=false` and `documentWriteAuthorized=false`.

`NOT_GENERATABLE` is preserved when the statistical method is unknown, with the reason and missing objects visible. A projection never selects a method, creates an Estimand, or writes back to Project.

## 8. Design-time and realized-time boundary

Counts observed in the implementation and test fixtures:

- provider calls: **0**;
- Blind reads: **0**;
- patient data: **0**;
- clinical data ingestion: **0**;
- statistical calculations: **0**;
- realized-time objects created: **0**;
- normative files modified: **0**.

Terms such as `VariableOccurrence`, `DataQuery`, `DatasetRelease`, `AnalysisExecution` and `AnalysisResult` occur only in negative guards, limitations, or design-time requirement references. The UI timestamp is Human Decision audit metadata and is excluded from planning-content identities.

## 9. Validation

| Suite | Result |
|---|---:|
| Data Analysis Parts 2–6 | 274/274 PASS |
| Research Project | 56/56 PASS |
| System Integration | 34/34 PASS |
| TMP | 18/18 PASS |
| DOC-002 public contracts | 42/42 PASS |
| SEM legacy local, no provider | 305/305 PASS |
| Knowledge | 87/87 PASS |
| Imaging | 60/60 PASS |
| Guided Intake, Scientific Thinking, Protocol Designer, DOC and VAL-000 integration selection | 253/253 PASS |
| Typecheck | PASS |
| Production build | PASS |
| Lint changed files | PASS |
| `git diff --check` | PASS |

The specialized BIOSTATISTICS-001 documentary validator validates an exact admission inventory. After the mandatory Level 3 closure report was added, it reports only that `docs/` contains 161 files while its frozen snapshot and index references contain 160. The mission explicitly requires this report and forbids updating the `SOURCE-OF-TRUTH-INDEX`; this validator is therefore recorded as an admission-snapshot mismatch, not used as a product gate. The older DM-001 documentary validator additionally remains pinned to index v1.44 and counts 132/133/110, while the current official index is v1.45 with 140/141/118, and also observes the new 161-file total. These are validator-scope/history limitations, not DAI product-contract failures; neither validator nor any authority was altered.

## 10. Global suite

Global result: **1732 PASSED, 3 FAILED, 0 SKIPPED** across 1735 tests.

The three failures are the same external cleanliness guards observed at baseline:

- P3M-Web `leaves editorial-engine clean`;
- P4 `leaves editorial-engine unchanged`;
- P5 `leaves editorial-engine unchanged`.

Classification: `PRE_EXISTING_EXTERNAL_CLEANLINESS_FAILURE`. The sibling checkout was already dirty and was not modified by DAI-001. No DAI test or in-repository consumer regressed.

## 11. Non-regression matrix

| Contract | Preserved | Proof/Test | Limitation |
|---|---|---|---|
| Project single source of truth | Yes | DAI5-PRJ-C01, C17, C19 | Planning view is a Project projection |
| Human Decision required | Yes | DAI5-PRJ-C02–C06; DAI-CLOSE-C05 | No automatic adoption |
| Atomicity, stale and freeze | Yes | DAI5-PRJ-C07, C10, C15 | New candidate version required |
| CanonicalVariable identity | Yes | DAI5-ID-C01; DAI-CLOSE-C10 | Labels may vary, identity may not |
| Expected versus realized | Yes | DAI-CLOSE-C20 | Realized layer absent in V1 |
| Planned versus realized source/method | Yes | Part 3 tests; DAI-CLOSE-C20 | Real source/method deferred |
| Missingness separation | Yes | Part 4 tests; DAI-CLOSE-C12 | Imputation not executed |
| Endpoint versus Estimand | Yes | Part 4 tests | Estimand may remain absent |
| AnalysisPopulation versus Project Population | Yes | Part 4 tests | No population mutation |
| OBS, CDM, DM and Biostatistics ownership | Yes | DAI-CLOSE-C11–C14 | Specialized authorities unchanged |
| TMP/DOC projection-only | Yes | DAI5-DOC-C01–C16; DAI-CLOSE-C15 | Documents are not truth |
| Unknowns and `NOT_GENERATABLE` | Yes | DAI-CLOSE-C16, C28 | Incomplete SAP remains incomplete |
| No provider, patient data or calculations | Yes | DAI-CLOSE-C19, C21, C22 | Entirely local campaign |
| No SEM reopening | Yes | SEM 305/305; DAI-CLOSE-C23 | Audit-L remains shadow-only |

## 12. Limitations and next mission

The implementation remains design-time, contains no execution engine, and intentionally leaves methods, assumptions, release-time facts and realized data open when not supported by the Project. It does not implement QRY, VAL-001 or UX-001.

**Next mission:** `VAL-001`, to observe and validate the integrated chain without changing its ownership model.
