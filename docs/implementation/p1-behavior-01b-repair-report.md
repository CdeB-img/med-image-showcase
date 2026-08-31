# NOXIA — P1-BEHAVIOR-01B
## B14 repair and B15 product-section model gap report

Date: 2026-08-31

Mission: `P1-BEHAVIOR-01B`

Baseline branch: `protocol-designer-canonical-ingestion`

Baseline HEAD: `ca3082176e99eb856e33150034777fa0eee99b8a`

## A. Scope and frozen contract

The human-approved B01–B20 contract remains a non-normative executable oracle. Its expected behavioral results were not changed. The only edit to `p1-behavior-01a-contract.test.ts` supplies the new structured TRACE fact envelope to the already frozen B14 assertion. The fixture inventory is byte-unchanged.

Authorized repair scope:

- B14 provider-rejection/fallback observability: implemented and qualified;
- B15 generic acquisition category fidelity: localized, not repaired because no compatible existing Project section exists;
- B11: unchanged and still `NOT_TESTABLE`.

No provider call, live replay, Project model change, new owner, new TRACE system, push, or deployment was performed.

## B. B14 causal localization

`PreProjectRealizationResult` already exposes the relevant structured facts:

- `providerReplyAccepted`;
- `conformanceReason`;
- effective `executor`;
- effective `provider` and `model`;
- the caller also retains the attempted provider and raw provider reply.

The first lossy boundary was the projection in `ProtocolDesignerWorkspace` from `PreProjectRealizationResult` to `providerBoundary` in `createPreProjectScientificTraceSegment`. The final `QUESTION_REALIZED` event therefore retained only the local effective executor/provider and a generic stage reason.

Real owner: the existing pre-Project adapter of Scientific Execution Trace, with product wiring at the realization boundary. QRY and the provider are not owners of this loss.

## C. B14 bounded repair

The existing TRACE v2 event envelope now accepts a diagnostic realization-outcome fact object. It records, without scientific judgment:

- attempted provider;
- whether a provider response was received;
- whether that response was accepted;
- the bounded rejection/conformance reason when rejected;
- the effective realization executor;
- the bounded fallback reason when local realization was used.

The facts are emitted only at `LEVEL_2_DIAGNOSTIC` and `LEVEL_3_FORENSIC`; `LEVEL_1_CORE` remains compact. The final `QUESTION_REALIZED` event, Trace Inspector projection, run comparison, and diagnostic view consume the same envelope. Effective provider/executor semantics remain unchanged: a rejected Gemini response followed by local realization is still represented as locally realized, while the attempted/rejected provider remains reconstructible.

Generic tests cover:

- accepted provider response;
- received but rejected response with reason and local fallback;
- no provider response, distinct from semantic rejection;
- CORE versus DIAGNOSTIC/FORENSIC capture boundaries.

No case-specific runtime logic was added.

## D. B15 authority and owner check

Applicable PD-003 V2 facts:

- Biospecimen is a canonical `OBJECT` with a material lifecycle distinct from measurements and data;
- `Biospecimen != Variable`;
- sample collection is not a `VariableOccurrence` and does not imply a selected analysis.

Observed current implementation:

- source contribution type: `ACQUISITION`;
- governed study role: `SAMPLE_COLLECTION`;
- current contribution projection: `sectionForContributionItem` classifies every `ACQUISITION` as `IMAGING` before considering a more specific material-collection meaning;
- canonical backing: `canonicalProjectObjectType` produces the currently available `ACQUISITION` type and `sectionForCanonicalType` maps it to `IMAGING`;
- the implemented canonical object-type subset does not include `BIOSPECIMEN`.

The real classification owner is the Research Project contribution/canonical projection boundary, not React.

Current available Project sections:

`QUESTION`, `POPULATION`, `DESIGN`, `INTERVENTION`, `COMPARATOR`, `IMAGING`, `MEASUREMENTS`, `TEMPORALITY`, `ANALYSIS`.

No section is semantically compatible with material/sample collection:

- `IMAGING` is the demonstrated category collapse;
- `MEASUREMENTS` would violate the explicit Biospecimen/Variable separation;
- `ANALYSIS` would falsely imply an analysis;
- `DESIGN` would flatten a governed material object and its collection semantics;
- returning no section would silently discard the explicit contribution.

Therefore B15 requires an explicit Product section/model decision. Adding `BIOSPECIMEN` or another material-collection projection category is outside this mission's `NEW_PROJECT_MODEL = NO` boundary. No arbitrary remapping and no one-off `ACQUISITION + SAMPLE_COLLECTION` exception was introduced.

## E. Qualification

### Targeted behavioral contract

- B14 generic suite: `4/4 PASS`;
- frozen B01–B20 execution: B14 now passes, B15 remains the sole failure, B11 remains todo/not testable;
- resulting contract accounting: `18 PASS / 1 FAIL / 1 NOT_TESTABLE`.

### TRACE, Inspector, pre-Project, Gen-01

- 6 test files passed;
- 38 tests passed;
- TRACE CORE, DIAGNOSTIC, FORENSIC, Inspector, ownership and product-equivalence regressions passed.

### PRJ and Unit-1 regressions

- 6 test files passed;
- 22 tests passed.

### Static and production checks

- TypeScript: `PASS`;
- affected-source lint: `PASS`;
- production build: `PASS`;
- build emitted only inherited/non-blocking browsers-data, third-party PURE annotation, CSS syntax and chunk-size warnings.

### Complete canonical suite — single run

- test files: `201 PASS / 2 FAIL / 2 SKIP`;
- tests: `3358 PASS / 2 FAIL / 12 SKIP / 1 TODO`;
- unchanged historical failure: `p-web-02-contract.test.tsx`;
- authorized-contract residual failure: B15;
- new regressions attributable to B14: `0`.

## F. Git boundary

The B14 implementation, generic test, technical frozen-test support, and this report form one isolated local commit. Its SHA is reported externally because a Git commit cannot contain its own final object identifier.

No B15 commit exists. The nine inherited untracked implementation reports remain unchanged and outside the commit.

No push or deployment was performed.

## G. Decision

`P1_BEHAVIOR_01B_B15_REQUIRES_PRODUCT_SECTION_MODEL_DECISION`

The frozen contract has not converged: B14 is repaired, B15 is structurally blocked by the current Product section model, and B11 remains explicitly not testable.

Required next decision before the B11-versus-5x3 choice:

1. define or authorize the governed Project representation/projection for Biospecimen or material/sample collection;
2. then complete B15 generically at the existing PRJ boundary;
3. only after B15 convergence, decide `B11_MODEL_GAP_VS_5x3_CAMPAIGN`.

Always:

```text
UNIT_1 = CLOSED_WITH_BOUNDED_EVIDENCE
GENERALIZATION_GLOBALLY_PROVEN = NO

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```
