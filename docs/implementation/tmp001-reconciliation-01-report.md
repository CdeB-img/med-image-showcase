# TMP001_RECONCILIATION_01 — Implementation report

## 1. Mission boundary

- Repository: `/Users/charles/Documents/Projets/NOXIA/noxia-dev`
- Branch: `protocol-designer-canonical-ingestion`
- Baseline HEAD: `df9ae7a6c05fc2a89091bcc118d427f4c3b8b831`
- Verified remote integration/main baseline: `b6aed0e2d3002d45cfce04c321f93e9faf917c01`
- Baseline tracked/staged changes: `0 / 0`
- Preserved historical untracked implementation reports: `9`
- Provider calls, push, deployment, live replay: `0 / NO / NO / NO`

The SOURCE-OF-TRUTH-INDEX and the current Project, TMP/DOC, QRY, Human Decision, REG, Documentary Pattern and Editorial boundaries were used as authorities. Historical implementation reports were treated only as implementation evidence.

## 2. Directly verified starting point

`StudyTemplateCompositionInput.researchProject` required the legacy nominal type `ResearchProjectDesignResult`. The Standard document corridor supplied that legacy result directly to TMP-001. The 13 generated TMP assets were stale against the current DOC-002 1.1.0 catalogue and the current runtime source.

Decision: adapt and reuse TMP-001. No second template engine, Project store, documentary-pattern registry, regulatory resolver, validation engine, or scientific owner was created.

## 3. Reconciliation architecture

The nominal boundary is now:

```text
Canonical Project
  -> ProjectContextSnapshot (existing read-only Project consumer projection)
  -> TMP001_PROJECT_INPUT 1.0.0 (bounded read-only adapter)
  -> TMP-001 composition
  -> existing DOC-001B projection
```

`TMP001_PROJECT_INPUT` transports the exact Project identity/version/digest/revision and source snapshot digest, plus the bounded objects, relations, temporal qualifications, expected variable occasions, issues, imaging applicability, human decisions, specialized responsibilities and provenance required by TMP.

The native adapter is `studyTemplateProjectInputFromProjectSnapshot`. The explicit compatibility adapter `studyTemplateProjectInputFromLegacyResearchProject` remains available only for historical callers/tests. The Standard nominal path does not use it.

Only current, adopted, non-`UNKNOWN`, non-`WITHHELD` Project objects establish direct applicability. `UNKNOWN`, `WITHHELD`, `CANDIDATE`, `REJECTED` and `SUPERSEDED` remain observable without silently becoming affirmative support. TMP mutates neither Project nor decisions.

## 4. Ownership boundaries

- Project remains the unique source of truth.
- TMP consumes Project structure read-only and composes logical template structure.
- DOC-002 remains the documentary-pattern owner. TMP references its governed catalogue and does not copy or reinterpret its evidence.
- REG-001 remains the regulatory-resolution owner. TMP consumes the existing `RegulatoryResolutionResult` only.
- Human Decision remains the adoption owner. TMP references envelopes and never adopts a choice.
- QRY, VAL, TRACE, UX and Editorial Engine were not modified.
- DOC-001B remains a downstream projection; only its Standard input wiring and test fixture compatibility changed.

## 5. DOC-002 1.1.0 consumption

Directly verified current catalogue:

- catalogue: `DKC-53324D5E2771`
- version: `1.1.0`
- digest: `doc2-605fc70376c81cff`
- facts/patterns/relations: `132 / 132 / 333`
- sources: `71`
- provenance coverage: `100%`

TMP uses this catalogue through the existing contract. The detail-boundary pattern is consumed as reference-only support where mapped. The omission pattern remains uninterpreted: omission is not converted into intentional deferral. Documentary authority was not promoted.

## 6. Template families and platform structural case

The 13 stable family identities are preserved:

`CLINICAL_STUDY`, `INTERVENTIONAL`, `OBSERVATIONAL`, `REGISTRY`, `SNDS`, `RIPH`, `PHRC`, `RHU`, `ANR`, `FRANCE_2030`, `DEVICE`, `DRUG`, `IMAGING`.

Classification:

- currently compatible without Project-specific selector adaptation: `11`
- compatible after the Project V2 adapter: `2` — `OBSERVATIONAL`, `IMAGING`
- legacy-only: `0`
- outdated-asset-only: `0`
- unknown: `0`

Synthetic platform-trial compatibility is `PARTIAL`: the engine can represent master sections, conditional arm/domain blocks and shared dependencies without a second Project or methodology hardcoding. No platform-trial-specific template family or scientific methodology was introduced.

## 7. Required cases

- A — native Project V2 input: PASS.
- B — explicit legacy replay adapter, same TMP core, non-nominal path: PASS.
- C — unknown study design remains unresolved/conditional, not false `NOT_APPLICABLE`: PASS.
- D — DOC-002 detail boundary remains reference-only and downstream-specialized: PASS.
- E — uninterpreted omission is not transformed into intentional deferral: PASS.
- F — conditional REG requirement preserves uncertainty: PASS.
- G — incompatible Project version/digest makes the former instance stale: PASS.
- H — DOC-002 1.1.0 catalogue loads without family regression: PASS.
- I — all 13 generated assets regenerated and current: PASS.
- J — Standard Project -> TMP -> DOC corridor remains reachable: PASS.

B01-B10 and B12-B20 pass. B11 remains the pre-existing `TODO_NOT_TESTABLE` witness.

## 8. Generated assets

TMP engine/schema moved from `1.0.0` to `1.1.0`; the template moved to version `1.1.0`, revision 2, with explicit supersession of the prior behavior digest.

The generator now constructs a deterministic native Project V2 fixture and emits all 13 assets. Two consecutive generations produced identical SHA-256 values. `build:study-templates:check` reports `STUDY_TEMPLATE_ARTIFACTS_CURRENT:13`.

- outdated assets before: `13`
- outdated assets after: `0`
- stable template-family identity regressions: `0`

## 9. Qualification

Final targeted qualification after the corrective delta:

- TMP suites: `3 files / 28 PASS`
- Project consumer adapter + Document Projection: `9 files / 85 PASS`
- B01-B20 + Standard route: `2 files / 24 PASS / 1 TODO`
- exact post-canonical corrective witness: `2 files / 36 PASS` (subset of Document Projection above)
- TypeScript: PASS
- affected lint: PASS
- production build: PASS
- Git diff check: PASS

The unique canonical suite was run once, as required:

- `3553 PASS`
- `12 SKIP`
- `1 TODO`
- `3 FAIL`

Failure classification:

1. `p-web-02-contract.test.tsx`: historical unchanged failure outside TMP scope.
2. `projection-engine.test.ts`: candidate regression in one explanatory `futureReason` string.
3. `doc-001b-study-template-integration.test.ts`: same candidate regression.

The two candidate failures had one common cause: the word “future” was absent from the specialized-dependency explanatory label. The production behavior and ownership semantics were unchanged. The label was corrected once; both exact failing tests then passed (36/36), followed by the full affected targeted perimeter, TypeScript, lint, build and diff checks. The canonical suite was intentionally not run a second time, preserving the mission's one-run constraint. Residual uncertainty is limited to the absence of a second whole-repository run after this text-only correction.

Final candidate regression count supported by the exact corrective witnesses: `0`.

## 10. Deferred debts and residual work

Untouched:

- global RC01 validator frozen on an older DOC-002 digest;
- owner-coverage validator expecting 10 linked sets while the current registry contains 12;
- REG001 -> current Reference Corpus regulatory-input reconciliation;
- residual current Knowledge handoffs to scientific/data owners;
- OBS mechanic/reference residual;
- external regulatory gaps.

These require a separate, targeted current-state gap requalification before any integrated campaign.
