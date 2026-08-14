# HYBRID-RUNTIME-INTEGRATION-001 — Closure Report

## Decision

`HYBRID_RUNTIME_PRODUCT_BOUNDARY_READY_WITH_LEGACY_LIMITATIONS`

The product boundary, zero-provider shadow replay and V1 compatibility
projection are ready. Seven functional legacy dependencies still block SEM Full
closure, and historical prototype evidence retains three critical primary-output
violations. No scientific qualification or controlled cutover is claimed.

## Product facade and Contribution

`src/features/scientific-interpretation/` now provides:

- `ScientificInterpretationRuntime`;
- `SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE` 1.0.0;
- legacy, hybrid and fixture-replay adapters;
- atomic raw persistence before parsing;
- deterministic non-mutating Audit-D;
- runtime modes `LEGACY_ACTIVE`, `HYBRID_SHADOW` and the inactive
  `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK`;
- a V1 compatibility projection and a semantic shadow comparison.

The Contribution is explicitly `RUNTIME_CONTRIBUTION_NOT_PD003_ROOT`. It is not
a Research Project, ScientificModel, ObservableProperty, decision,
CanonicalVariable or VariableOccurrence. `projectWriteAuthorized` is always
`false`.

The existing `HumanDecisionEnvelope` identity is reused as the decision
reference. No second decision mechanism and no engaging decision were created.

## Shadow replay

| Check | Result |
|---|---:|
| Saved primary states | 24/24 |
| Structurally evaluable Contributions | 24/24 |
| Raw references + digests reconstructible | 24/24 |
| Provider calls | 0 |
| Project writes | 0 |
| Blind reads | 0 |
| Legacy active during shadow | YES |

Comparison uses visible scientific content and trace obligations, never exact
JSON identity. The adapter adds no critical V1 projection loss. Historical
prototype evidence remains unchanged: three primary-output critical violations
(two self-relations and one local-practice reconstruction issue) remain visible.

## V1 compatibility

`ProtocolDesignerDemo` no longer imports `ScientificSemanticModel` or the two
legacy downstream adapters. It routes an accepted legacy model through:

```text
legacy model -> Contribution -> transitional V1 projection
```

Parity tests prove the legacy interpretation, field reviews, detected relations
and missing information remain identical. The V1 trace additionally preserves
relations, polarities, corrections, unknowns, ambiguities,
rejected/superseded identities, runtime identity and raw-output identity.

V1 cannot natively represent the complete typed relation, lifecycle and
availability contracts. Those limitations are recorded individually as
`LEGACY_PROJECTION_LOSS`; none is hidden and none claims PD-003 V2 conformance.

## SEM dependency burn-down

| Metric | Before | After |
|---|---:|---:|
| SEM-DIRECT dependency classes unbounded | 14 | 12 |
| direct `ScientificSemanticModel` imports by product consumers outside legacy | 1 | 0 |
| legacy import files outside the legacy module | 3 | 3 |

Seven functional dependencies block closure: live API, workspace, embedded
Knowledge verification, provider/server orchestration, session/history, browser
transport and the live legacy public facade. Five other legacy areas remain for
historical preservation or later archival. The detailed, definition-scoped
inventory is in `architecture/hybrid-runtime-dependency-burndown.json`.

## Audit disposition

- Audit-D: product implementation, systematic, deterministic, non-mutating.
- Audit-L: interface only, `SHADOW_ONLY_NOT_PRODUCT_ACTIVE`.
- LLM adjudicator: not integrated and not called.
- unresolved findings: Human Decision, future QRY, specialist owner or
  fail-closed; never automatic correction.

## Validation

| Validation | Result |
|---|---:|
| HRI facade/adapters/replay | 20/20 PASS |
| SEM legacy | 305/305 PASS |
| Engine Lab validation | 12/12 PASS |
| SEM-AUDIT | 18/18 PASS |
| hybrid prototype frozen-artifact validation | 24 candidate + 24 consolidated, VALID |
| Guided Intake + Scientific Thinking | 181/181 PASS |
| Imaging | 60/60 PASS |
| Research Project | 56/56 PASS |
| system integration | 34/34 PASS |
| typecheck | PASS |
| build | PASS |
| `git diff --check` | PASS |
| global repository suite | 1408/1411 PASS; 3 external-cleanliness guards FAIL |

The three global failures all inspect the separate `editorial-engine` checkout
and find its pre-existing modified/untracked files. They are not functional HRI,
SEM, Guided Intake, ST, Imaging, Project or system-integration failures. This
mission did not modify or clean that external checkout. The targeted gates,
typecheck, build and local diff check pass.

## Boundaries preserved

- provider calls: 0;
- Blind: not read;
- QRY implemented: no;
- CDM implemented: no;
- normative documents modified: no;
- SOURCE-OF-TRUTH-INDEX modified: no;
- Research Project written: no;
- experimental scenarios/results modified: no;
- push/deploy: none.

## Limits and next mission

This mission does not activate hybrid output, qualify runtime competence or
close SEM Full. It only creates the reversible product boundary and evidence
needed for the next roadmap step:

`SEM-CLOSURE-001`

The retained order remains: SEM closure → CDM-001 → Data Management →
Biostatistics → VAL-001 → QRY-001 → UX-001 → V1 complete.
