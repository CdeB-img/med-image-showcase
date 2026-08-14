# SEM-CLOSURE-001R — Product Boundary Map

| Field | Observed value |
|---|---|
| Status | `CLOSURE IMPLEMENTATION MAP — NON_NORMATIVE` |
| Observation date | 2026-08-14 |
| Default mode | `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` |
| Project writes | `0` |
| Normative documents changed | `NO` |

This map describes an implementation boundary. It does not add a PD-003 root,
does not qualify a scientific runtime and does not authorize a Research Project
mutation.

## 1. Product boundary

```text
ScientificInterpretationRuntime
        |
        v
SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE
        |
        +--> deterministic non-mutating Audit-D findings
        |
        +--> HumanDecisionEnvelope reference / specialist routing
        |       (no automatic adoption, PROJECT_WRITES = 0)
        |
        v
LEGACY_V1_TRANSITIONAL_PROJECTION_NOT_PD003_V2
        |
        +--> ValidatedScientificIntent
        +--> ScientificSessionContext
        +--> explicit LEGACY_PROJECTION_LOSS trace
```

The Contribution is runtime output. PD-003 objects and the Research Project
remain owned by their canonical domains. A runtime type is only a proposed type;
it is never converted to an adopted V2 object by lexical equality.

## 2. Runtime modes

| Mode | Active contribution | Shadow contribution | Fallback | Product/UI effect |
|---|---|---|---|---|
| `LEGACY_ACTIVE` | legacy SEM | none | none | identical legacy path |
| `HYBRID_SHADOW` | legacy SEM | hybrid/replay | none | diagnostics only |
| `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` | hybrid | none | only explicit technical failure | nominal product mode |

A scientific disagreement is not a technical failure and cannot trigger a
silent fallback. Shadow execution exposes no Project adoption action.

## 3. Implemented components

| Responsibility | Product location | Boundary |
|---|---|---|
| contribution contract | `src/features/scientific-interpretation/contracts.ts` | runtime-neutral, implementation-level |
| canonical identity | `src/features/scientific-interpretation/canonical.ts` | stable contribution digest |
| raw evidence | `src/features/scientific-interpretation/raw-persistence.ts` | persistence before parsing |
| runtime facade | `src/features/scientific-interpretation/runtime.ts` | mode and technical-only fallback |
| legacy adapter | `src/features/scientific-interpretation/legacy-adapter.ts` | preserves legacy model identity/digest |
| hybrid adapter | `src/features/scientific-interpretation/hybrid-adapter.ts` | isolated native execution/parser mapping |
| fixture replay | `src/features/scientific-interpretation/replay-adapter.ts` | zero-provider deterministic replay |
| Audit-D | `src/features/scientific-interpretation/audit.ts` | findings only, no mutation/autofix |
| V1 compatibility | `src/features/scientific-interpretation/v1-compatibility.ts` | explicit transitional projection and losses |
| shadow comparison | `src/features/scientific-interpretation/shadow-comparison.ts` | semantic content comparison, never exact JSON |

Product code imports no contract or executable module from `experiments/`.
Tests alone load the frozen visible artifacts and inject them into the generic
replay adapter.

## 4. Raw evidence and errors

```text
native response
  -> persistAtomically
  -> raw reference + digest
  -> parse
  -> structural validation
  -> contribution mapping
  -> deterministic Audit-D
```

The error taxonomy separates provider, transport, raw persistence, parsing,
schema, mapping, audit, scientific-understanding and non-evaluable outcomes.
A parsing or schema error cannot erase a successfully persisted raw record.

## 5. Human decision boundary

The implementation references the existing `HumanDecisionEnvelope` identity.
It creates no competing decision mechanism. A Contribution may be reviewed,
rejected, deferred, reopened, partially selected or routed to a specialist, but
this integration performs no engagement and no Project write. Actor and mandate
remain backend governance requirements at the engaging decision boundary.

## 6. V1 compatibility

The transitional projection preserves the original request, normalized intent,
route, concepts, population, interventions/comparators, outcomes/endpoints,
modalities/methods, relations, polarities, temporal items, corrections,
unknowns, ambiguities, provenance and both runtime/raw identities.

V1 cannot express the complete typed relation, lifecycle and availability
contracts. Every such limitation is recorded as `LEGACY_PROJECTION_LOSS` in
`ScientificSessionContext.interpretationTrace`; rejected and superseded items
remain reconstructible there. All projection-loss records created by this
adapter are non-critical because their source content and evidence remain in the
trace. This is not a PD-003 V2 conformance claim.

## 7. Shadow replay

The HRI test suite reads only the 24 visible primary outputs under
`experiments/engine-lab/results/hybrid-runtime-prototype-01/`:

- 8 scenarios × 3 states = 24 contributions;
- 24/24 structurally evaluable;
- 24/24 raw references and raw digests reconstructible;
- 0 provider call;
- 0 Project write;
- 0 Blind access;
- legacy remains the active contribution.

The integration introduces no critical V1 projection loss. Historical prototype
evidence still reports three primary-runtime critical violations (two
self-relations and one local-practice reconstruction issue). Those findings are
preserved as experimental limitations and are not repaired by this integration.

## 8. Audit boundary

- Audit-D runs systematically and returns findings without mutating the
  Contribution.
- `auditSemantically(contribution, sourceContext) -> findings[]` exists only as
  an interface with status `SHADOW_ONLY_NOT_PRODUCT_ACTIVE`.
- Audit-L is not called by the product facade.
- the LLM adjudicator is absent from product code and receives no call.

## 9. Closed nominal boundary

The compatibility facade removes the direct model/adapters dependency from
`ProtocolDesignerDemo` and generalizes Scientific Thinking source identity.
The API/provider, workspace, client, session/history and Knowledge handoff now
consume the runtime-neutral Contribution boundary. No nominal product consumer
calls SEM Full.

The legacy module remains intentionally present for three bounded purposes:

- explicit `LEGACY_ACTIVE` rollback;
- deterministic historical/non-regression evidence;
- read-only conversion of an existing legacy session.

The live campaign `SEM-CLOSURE-001R-LIVE-01` established 8/8 provider
responses, 8/8 raw records, 8/8 internal validations, zero fallback and zero
Project write. All eight Contributions required review because Audit-D findings
remained visible; none was projected as acceptable in spite of a critical
finding. This is runtime closure evidence, not independent scientific
qualification.

The remaining legacy references are enumerated in
`architecture/hybrid-runtime-dependency-burndown.json`. They are rollback or
historical surfaces, not nominal SEM Full consumers.
