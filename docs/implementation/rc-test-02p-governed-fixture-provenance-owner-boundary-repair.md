# RC-TEST-02P — Governed Fixture Provenance Owner-Boundary Repair

**Classification:** `LEVEL_3_IMPLEMENTATION_EVIDENCE`

**Normative authority:** `NONE`

**Mission type:** bounded test-harness provenance repair

**Date:** 2026-08-28

## Decision

`RC_TEST_02_FIXTURE_PROVENANCE_REPAIRED`

RC-TEST-02 remains scientifically and functionally closed. This repair changes only governed test-reference identity/provenance metadata, helper naming and deterministic regression coverage. It does not modify the approved scientific content or any owner runtime.

## Baseline

```text
branch = protocol-designer-canonical-ingestion
HEAD_initial = 27a468dbcc7560e0c56ad9881381a1229250b18c
parent = 0852fb2f0b49d9132851559ce5591b89664dd35b
origin/main = f504d8fc658ebdf17757e589f610e8f56c24e335
tracked_status_initial = clean
```

The protected historical artifacts and `.git/info/exclude` were not changed.

## Authorities consulted

Read in the required order:

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`;
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx`;
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-v2.0.docx`;
4. `/Users/charles/Documents/Projets/editorial-engine/docs/architecture-manifesto.md`.

Specialized contracts consulted only for ownership and provenance:

- `docs/pd-003-v2-research-object-model.md`;
- `docs/pd-003-v2-ownership-matrix.md`;
- `docs/rde-003-imaging-engine-architecture.md`.

No documentary or normative contradiction was found. The authorities require producer provenance, semantic ownership, runtime execution evidence, human decision provenance and derived projections to remain distinct.

## Confirmed cause

The former metadata recorded `sourceOwner = IMAGING`, `sourceOwnerVersion = 1.2.1`, a runtime-looking `imaging-design-result:*` identifier and a nested `engineVersion = 1.2.1`, but did not expose dedicated machine fields for fixture production or runtime non-execution.

The Imaging result schema requires only a non-empty string for `resultId`; it does not require the `imaging-design-result:*` prefix. The nested contract-shaped payload does require its `engineVersion` field. The bounded resolution is therefore:

- use a clearly reference-specific result identity;
- retain the nested `engineVersion` only as the contract version required by the payload;
- classify that version in wrapper metadata as `contractOwnerVersion`;
- record explicit runtime non-execution and a null runtime result identity.

## Machine-readable provenance

All three references now expose:

```text
fixtureKind = HUMAN_APPROVED_GOVERNED_TEST_REFERENCE
fixtureProducer = TEST_HARNESS
contractOwner = IMAGING
contractOwnerVersion = 1.2.1
sourceResultIdKind = CONTRACT_SHAPED_REFERENCE_RESULT_ID
runtimeOwnerExecuted = false
runtimeOwnerResultId = null
createdFrom = HUMAN_APPROVED_GOVERNED_REFERENCE_SPECIFICATION
sourceCommit = 0852fb2f0b49d9132851559ce5591b89664dd35b
```

The existing HumanDecision identity is exposed as `humanReferenceDecisionId`. No new decision identity was created.

## Reference identity and digest readback

The baseline values were read directly from the `27a468d` Git object. Current values were read from the repaired module. Result digests are identical before and after; only reference identity/provenance metadata and its deterministic digest changed.

| Reference | Result digest before/after | Metadata digest before | Metadata digest after | Current result identity |
|---|---|---|---|---|
| REF-01 | `ke1-839135591d6bd0e5` | `ke1-ff3ad5e4252a0518` | `ke1-90d0740909260ea5` | `governed-imaging-reference-result:RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY:v1.0.0` |
| REF-02 | `ke1-570216cdc8989091` | `ke1-3fc9eb9871885094` | `ke1-76c28ccf9ea3a9cb` | `governed-imaging-reference-result:RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT:v1.0.0` |
| REF-03 | `ke1-4e766b0981178fed` | `ke1-ea4d5492e892a666` | `ke1-2d945663c370ed9f` | `governed-imaging-reference-result:RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV:v1.0.0` |

Human decision identities remain exactly:

- `human-decision:rc-test-02:RC-TEST-02-IMG-REF-01_NARROW_MR_ECV_HISTOLOGY:2026-08-28`;
- `human-decision:rc-test-02:RC-TEST-02-IMG-REF-02_MULTICENTER_PARTIAL_EQUIPMENT:2026-08-28`;
- `human-decision:rc-test-02:RC-TEST-02-IMG-REF-03_FABRY_LONGITUDINAL_ECV:2026-08-28`.

## Helper boundary

The misleading helper `makeFrozenImagingResult()` was renamed to `readGovernedImagingReferenceResult()`. The helper reads a deep-frozen clone from the static governed reference registry. It does not call the Imaging runtime and does not claim that the runtime produced the payload.

No product API, runtime API or scientific concept was renamed.

## Scientific freeze

The Git diff and exact result-digest comparison demonstrate that the following remain unchanged:

- REF-01 narrow MR ECV/histology scientific scope;
- REF-02 synthetic multicentre scope;
- REF-03 Fabry longitudinal ECV scope;
- HumanDecision identities and provenance;
- limitations and `UNKNOWN` fields;
- `SYNTHETIC_HAEMATOCRIT_NOT_AUTHORIZED_BY_THIS_REFERENCE`;
- the negative synthetic-haematocrit contradiction behavior;
- F18 and F20 boundaries;
- Imaging fail-closed behavior.

The complete fixture JSON is intentionally not byte-identical because provenance metadata and the reference-specific result identity changed. The scientific payload is demonstrably semantically identical and its three result digests are unchanged.

## Negative contradiction control

The live chain remains:

```text
Knowledge → ST → Imaging
→ synthetic-haematocrit contradiction
→ UNRESOLVED_STRUCTURAL_CONTRADICTION
→ NOT_READY
```

The focused Imaging test continues to verify this behavior. No positive governed reference resolves, removes or downgrades the negative contradiction.

## Files changed

- `src/features/imaging-study-designer/__tests__/governed-reference-fixtures.ts`;
- `src/features/imaging-study-designer/__tests__/img-001b-project-handoff.test.ts`;
- `src/features/research-project-construction/__tests__/fixtures.ts`;
- `src/features/research-project-construction/__tests__/mandatory-cases.test.ts`;
- `src/features/document-projection/__tests__/fixtures.ts`;
- `src/features/system-integration/__tests__/unknowns.test.ts`;
- this Level 3 report.

No runtime, corpus, authority, provider, network, benchmark or scientific campaign file changed.

## Validation

Focused provenance/fixture test:

```text
test files = 1 passed / 1 total
tests = 10 passed / 10 total
```

Seven affected RC-TEST-02 files:

```text
test files = 7 passed / 7 total
tests = 81 passed / 81 total
```

Canonical TypeScript gate, run once:

```text
npm run typecheck
exit = 0
TypeScript errors = 0
```

The full canonical suite was not run. Its nine previously classified failures remain outside this mission and are not recharacterized here.

## Final qualification

```text
FIXTURE_PRODUCER_EXPLICIT = YES
CONTRACT_OWNER_EXPLICIT = YES
RUNTIME_OWNER_EXECUTED_EXPLICIT = YES
RUNTIME_OWNER_RESULT_ID_EXPLICIT = YES
HUMAN_REFERENCE_DECISION_EXPLICIT = YES
RUNTIME_EXECUTION_CANNOT_BE_INFERRED_FROM_REFERENCE_METADATA = YES
SCIENTIFIC_PAYLOAD_CHANGED = NO
OWNER_RUNTIME_CHANGED = NO
CONTRADICTION_CONTROL_PRESERVED = YES

SCIENTIFIC_PASS = NO
PD011_PASS = NO
WAVE_2_AUTHORIZED = NO
PUSH = NO
DEPLOYMENT = NO
```

`RC_TEST_02_FIXTURE_PROVENANCE_REPAIRED`
