# HYBRID-RUNTIME-PROTOTYPE-01 — Short report

Decision: `PYDANTIC_PLUS_SEM_AUDIT_RUNTIME_CANDIDATE`

The isolated prototype executed PydanticAI direct interpretation, the existing non-mutating SEM-AUDIT-D, conditional SEM-AUDIT-L and conditional typed adjudication on 24 visible I01–I08 conversation states. All ablations reuse one primary output per state.

## Outcome

- P0 evaluable: 24/24; P3 evaluable: 13/24;
- P0 candidate-level critical/visible violations: 3;
- P3: 13/24 evaluable, 0 critical violation on those states, 11 technical fail-closed states;
- Audit-L calls: 23; adjudicator calls: 11;
- provider calls: 58; retries: 0; calls/state: 2.42;
- technical failures: 11, all at the adjudicator request contract (`HTTP 400 INVALID_ARGUMENT`); raw evidence: 58/58;
- unresolved states: 9.

The primary interpreter produced 24/24 valid states. SEM-AUDIT-L produced 23/23 valid outputs and 13 findings. The adjudicator generated 0/11 scientific outputs, so the full P3 comparison is not scientifically interpretable and does not prove that the primary interpreter is insufficient.

Detailed evidence is in `experiments/engine-lab/results/hybrid-runtime-prototype-01/FINAL-PROTOTYPE-REPORT.md`, `POST-RUN-TECHNICAL-DIAGNOSTIC.md`, `HUMAN-REVIEW-INDEX.md`, `metrics.json` and `replacement-evidence.json`.

No QRY, Blind, Knowledge retrieval, normative mutation, product replacement or Research Project write occurred.
