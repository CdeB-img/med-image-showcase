# HYBRID-RUNTIME-PROTOTYPE-01 — Post-run technical diagnostic

This diagnostic corrects the interpretation of the frozen report generator; it does not change or rerun the experiment.

## Classification

Decision: `PYDANTIC_PLUS_SEM_AUDIT_RUNTIME_CANDIDATE`

The first automatic report classified 11 fail-closed P3 states as scientific critical violations and therefore attributed the failure to the primary interpreter. That inference is invalid.

- Pydantic primary: 24/24 structured outputs valid.
- SEM-AUDIT-L: 23/23 scientific outputs valid; 13 findings, including 7 confirmations and 6 new findings.
- Typed adjudicator: 0/11 scientific outputs generated.
- Each adjudicator request was rejected before generation with HTTP 400 `INVALID_ARGUMENT`.
- No adjudicator retry was permitted because the error was deterministic and non-transient.
- Raw provider response or provider error evidence was preserved for 58/58 operations.

Failure class: `ADJUDICATOR_PROVIDER_REQUEST_CONTRACT_FAILURE`.

This is neither a `SCIENTIFIC_UNDERSTANDING_FAILURE` nor evidence that the primary Pydantic interpreter must be replaced. It prevents the full P3 pipeline from being evaluated on 11/24 states.

## Valid comparisons

- P0, P1 and P2: 24/24 evaluable and based on the same primary output.
- P0 candidate-level critical/visible violations: 3.
- SEM-AUDIT-D findings: 4.
- SEM-AUDIT-L findings: 13.
- P3: 13/24 evaluable; 36/36 applicable visible expectations retained and no critical violation on those 13 states.
- P3 full-set scientific comparison: invalid because 11 states are technical fail-closed states.

The value of SEM-AUDIT-L is measurable as additional, non-mutating detection. The value of adjudication is not measurable in this frozen configuration.

## Freeze discipline

No provider call was replayed. No prompt, schema, trigger, baseline, scenario or threshold was changed after observation. No additional campaign was started. The original generated metrics remain present, with `postRunClassification` identifying which aggregate fields are non-interpretable.
