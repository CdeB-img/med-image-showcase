# W0-PROJECT-01 — Canonical Project Consumer Adapter

## Classification

- Level: `LEVEL_3 — IMPLEMENTATION CONVERGENCE — NON_NORMATIVE`
- Decision: `W0_PROJECT_01_CANONICAL_PROJECT_CONSUMER_ADAPTER_READY`
- Branch: `protocol-designer-canonical-ingestion`
- Historical mission baseline: `b3ad0cb6cb0349e8b82be41e60bf9c43efb9a00f`
- Provider calls: `0`
- Product behavior changed: `NO`
- Project contract count increased: `NO`

No authority, scientific model, owner, QRY rule, provider path, UI, persistence path, specialized-owner behavior, or document rule was changed.

## Authorities read

The implementation was checked, in the required order, against the SOURCE-OF-TRUTH-INDEX V1.45, the official Founding Charter V1.0, Scientific Product Manifesto V2.0, Editorial Engine Architecture Manifesto, PD-003 V2 and its Ownership/Relationship/Legacy/Engine companions, RDE-001/RDE-002, SPINE-01 through SPINE-04 implementation proofs, ENGINE-PORTFOLIO-01 as summarized in the roadmap, and the current code/tests.

The resulting boundary preserves: one adopted Project owner, candidate/adopted separation, typed handoffs, explicit unknowns and contradictions, immutable projections, and Human Decision as the only engaging Project mutation boundary.

## PROJECT_REPRESENTATION_MATRIX

| Representation | Exact file/type | Real owner | Writers | Readers | Identity/version/digest | Provenance, unknowns, time, relations, decisions, history | Write capability | Classification |
|---|---|---|---|---|---|---|---|---|
| Canonical Project aggregate | `src/features/research-project-construction/canonical-project-backbone.ts` — `CanonicalResearchProjectState` | `RESEARCH_PROJECT` | PRJ confirmation/apply boundary only | PRJ projection and canonical snapshot builders | `projectId`, `currentVersionId`, `revision`, version-record `stateDigest` | Full object/relation/time versions, provenance, epistemic state, decision ledger, conflicts, supersession, version history | Yes, only through PRJ + Human Decision | Sole adopted Project truth |
| Current PRJ owner projection | `src/features/research-project-construction/contribution-owner-boundary.ts` — `ResearchProjectOwnerProjection` | `RESEARCH_PROJECT` | PRJ confirmation boundary | Product Project/QRY/DOC boundaries and snapshot builder | `projectId`, `versionId`, `projectDigest`, `revision` | Carries canonical state, sections, contribution refs, confirmation decision and retained owner responsibilities | No consumer write; created by owner | Existing PRJ-owned runtime projection, not a PD-003 root |
| SPINE owner snapshot | `src/features/research-project-construction/canonical-project-backbone.ts` — `ProjectContextSnapshot` v0.3.0 | Source owner remains `RESEARCH_PROJECT` | Deterministic snapshot builder only | Knowledge, REG, Scientific Thinking, Imaging handoffs; W0 adapter | Exact source Project ID/version/digest plus snapshot digest | Current and superseded refs, full provenance, relations, temporal qualifications, unknown references, issues, Human Decisions, decision/version ledgers, owner dependencies | Deep-frozen, detached, `readOnly: true` | Unique inter-owner read snapshot, reused and extended in place |
| Historical design-time shape | `src/features/research-project-construction/types.ts` — `ResearchProjectDesignResult` | No canonical owner; consumer projection only | Historical PRJ engine; existing functional document compatibility projector; W0 adapter projection | CDM/DM/Biostatistics planning, TMP/DOC, older QRY/VAL/SYS readers | Legacy Project ID/version/result digest | Less expressive; W0 sidecar retains stable identities, relations, snapshot provenance and explicit loss accounting | Consumer shape only; Project adoption remains separate | `LEGACY_CONSUMER_PROJECTION`, not Project truth |
| W0 adapter envelope | `src/features/project-consumer-adapter/canonical-project-consumer-adapter.ts` — `LegacyConsumerProjectionResult` | No scientific owner; Level-3 adapter | Deterministic read-only adapter | Selected legacy consumer entrypoints/proofs | Exact source snapshot tuple and digest | Identity/relation sidecars, loss accounting, bounded diagnostics | Deep-frozen, `sourceOfTruth: false`, `projectWriteAuthorized: false` | Technical wrapper explicitly declared not to be a Project contract |
| Legacy PRJ construction input | `src/features/research-project-construction/types.ts` — `ResearchProjectConstructionInput` | Historical PRJ engine input | Legacy callers/fixtures | Historical PRJ engine | Input project/version refs | Input evidence and known/unknown fields | Can only produce legacy candidates | Builder input, not adopted Project truth |
| Data-analysis Project substate | `src/features/data-analysis-planning/project-integration.ts` — `ProjectDataAnalysisState` | `RESEARCH_PROJECT` after its separate decision boundary | Data-analysis adoption boundary | Planning views/doc projections | Source Project ID/version and contribution refs | Planning decisions/audit only | Bounded Project substate update after Human Decision | Project substate, not a competing Project root |
| UI/document views | adaptive workspace, planning view and DOC projection types | Respective projection owners | Projection builders | UI/document consumers | Source refs/digests | Read-only subsets | No canonical write | Consumer projections only |

No third concurrent Project representation was found or created. `ProjectDataAnalysisState` is a bounded Project substate; UI and document structures are projections; `ResearchProjectDesignResult` remains a legacy consumer shape.

## Canonical snapshot consolidation

The existing `ProjectContextSnapshot` contract was reused and additively advanced from v0.2.0 to v0.3.0. It now carries the information required for honest inter-engine projection:

- exact Project ID, version, revision and digest;
- exact source Contribution ID/digest;
- current canonical object identities, versions, semantic types, roles and epistemic states;
- relations with stable identity, polarity and endpoints;
- temporal qualifications and ExpectedVariableOccasions with their typed reference status;
- superseded object/relation/time references and version history;
- full bounded provenance and decision references;
- open unknowns, ambiguities when explicitly role-qualified, limitations when explicitly role-qualified, contradictions/conflicts;
- Human Decisions, canonical decision ledger and specialized-owner responsibilities.

The returned snapshot is detached from the owner aggregate before recursive freezing. No mutable reference is shared with Project state.

## Legacy adapter and loss accounting

The adapter input is only `ProjectContextSnapshot`. It validates the snapshot digest, exact expected Project version/digest, stable identities, relation endpoints, provenance/decision lineage, and unsupported legacy temporal mappings. It then produces a deep-frozen `ResearchProjectDesignResult` projection plus identity/relation sidecars.

| Canonical information | Legacy handling | Classification | Blocking rule |
|---|---|---|---|
| Objects, stable identities, explicit roles | Typed legacy collections + `candidateVersion.objectRefs` + identity sidecar | `LOSSLESSLY_DERIVABLE` | Missing/duplicate identity blocks |
| Relations | `impactGraph.edges`, dependencies and relation sidecar | `LOSSLESSLY_DERIVABLE` | Missing endpoint blocks |
| `DATA_NEED` | Legacy `dataManagementRequirements` reference + object refs | `LOSSLESSLY_DERIVABLE` | No scientific completion |
| Typed time and ExpectedVariableOccasion | Visits/temporal structure/variable timing refs | `LOSSLESSLY_DERIVABLE` | Unknown reference remains unknown; unmapped legacy temporal root blocks |
| Unknowns, ambiguities, limitations, contradictions | Dedicated legacy registries | `LOSSLESSLY_DERIVABLE` | No fallback value |
| Full canonical history | Remains in source snapshot; current projection carries prior/current distinction | `NOT_REQUIRED_BY_CONSUMER` | Never merges stable identities |
| Absent specialized owner payload | Not projected | `UNSAFE_TO_PROJECT` | No owner result is invented |

Bounded diagnostics are exactly:

- `CANONICAL_PROJECT_SNAPSHOT_INVALID`
- `LEGACY_PROJECTION_UNREPRESENTABLE`
- `LEGACY_PROJECTION_REQUIRED_IDENTITY_MISSING`
- `LEGACY_PROJECTION_TEMPORAL_SEMANTICS_GAP`
- `LEGACY_PROJECTION_PROVENANCE_GAP`
- `LEGACY_PROJECTION_VERSION_MISMATCH`

## Common snapshot proof

One version-3 representative canonical Project contains a question, objective, population, eligibility criterion, intervention, comparator, imaging modality, acquisition, endpoint, CanonicalVariable, DataNeed, relations, a known acquisition time, an ExpectedVariableOccasion with an `UNKNOWN` reference, Human Decisions, source provenance, an explicit uncertainty, owner limitations, and a superseded objective version.

The exact same tuple is observed in every branch:

```text
projectId      = project:w0-project-01
projectVersion = project:w0-project-01:version:3
projectDigest  = source canonical owner digest
snapshotDigest = one deterministic ProjectContextSnapshot digest
```

| Consumer | Proof |
|---|---|
| Knowledge | Existing SPINE handoff reads the same snapshot digest |
| REG | Existing SPINE handoff reads the same snapshot digest |
| Scientific Thinking | Existing SPINE handoff reads the same snapshot digest |
| Imaging | Existing SPINE handoff reads the same snapshot digest |
| CDM planning | `DataAnalysisPlanningContext` consumes the W0 legacy projection and emits a contribution with the same source Project digest |
| Data Management planning | Input wraps the same CDM context and source tuple |
| Biostatistics planning | Input wraps the same CDM context and source tuple |
| TMP | `StudyTemplateInstance.inputRefs` preserves the exact Project ID/version/digest |
| DOC | Existing historical reader remains readable; product behavior was deliberately not rewired |

## Validation evidence

- W0P01-01 through W0P01-25: `25/25 PASS`.
- PRJ + SPINE-01 through SPINE-04 + minimal product bridge: `116/116 PASS`.
- DAI/CDM/DM/Biostatistics + TMP + DOC targeted suites: `337/337 PASS`.
- TypeScript application typecheck: `PASS`.
- TMP-specific typecheck: `PASS`.
- Node ESM/Vite template artifact check: command completed successfully and reported the same nine historical `OUTDATED_STUDY_TEMPLATE_ARTIFACT` notices at the untouched baseline; no W0 regression.
- Targeted lint: `PASS`.
- Provider/external evidence calls: `0`.

Final diff/secret checks and Git evidence are recorded in the mission handoff.

## Explicit non-promotions

- CDM, Data Management and Biostatistics remain design-time planning runtimes.
- TMP remains a read-only downstream consumer.
- No engine becomes `PRODUCT_CALLABLE` because of this fixture corridor.
- The existing DOC product path is unchanged.
- No owner output, scientific value, baseline, J0, endpoint role or Human Decision is invented by the adapter.
