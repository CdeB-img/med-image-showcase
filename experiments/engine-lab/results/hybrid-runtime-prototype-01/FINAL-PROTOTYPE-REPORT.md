# HYBRID-RUNTIME-PROTOTYPE-01 — Final Prototype Report

Decision: `PYDANTIC_PLUS_SEM_AUDIT_RUNTIME_CANDIDATE`

## Architecture executed

PydanticAI direct primary → existing non-mutating SEM-AUDIT-D → conditional SEM Single prompted second reader → conditional typed Pydantic adjudicator → consolidated candidate state. The four ablations reuse the same primary output. No state was written to a Research Project.

## Results

- primary states: 24;
- P0/P1/P2/P3 records: 24 each;
- P0 evaluable states: 24/24;
- P3 evaluable states: 13/24;
- P0 critical visible/guard violations: 3;
- P3 full-set critical count: NOT INTERPRETABLE because 11 states failed before adjudicator generation;
- P3 evaluable subset: 13/24 states, 0 critical violation and 36/36 applicable visible expectations retained;
- SEM-AUDIT-L: 23 calls, trigger rate 95.8%;
- adjudicator: 11 calls, trigger rate 45.8%;
- provider requests: 58/80, including 0 retries;
- raw persistence: 58/58 completed operations;
- mean provider calls/state: 2.42;
- unresolved-finding states: 9; technical fail-closed states: 11.

## Interpretation

The experiment measures marginal safeguards on a visible corpus; it is not a qualification campaign. The Pydantic primary produced 24/24 valid structured states. SEM-AUDIT-L produced 23/23 valid second-reader outputs and 13 findings: 7 confirmations and 6 new findings. It therefore demonstrated measurable non-mutating detection value.

The typed adjudicator produced no scientific output: all 11 requests were rejected deterministically with HTTP 400 `INVALID_ARGUMENT`. Those states correctly failed closed, but they cannot be counted as scientific P3 violations and do not demonstrate insufficiency of the primary interpreter. No retry or configuration change was permitted after observation. Failure class: `ADJUDICATOR_PROVIDER_REQUEST_CONTRACT_FAILURE`.

## Boundaries

- QRY implemented: NO;
- product runtime replaced: NO;
- blind data accessed: NO;
- normative documents modified: NO;
- Knowledge or documentary corpus loaded: NO;
- Research Project written: NO.

## Limits

The visible expectation checks are campaign-specific review aids. They do not enter runtime code and do not constitute a hidden Gold. Product adoption still requires a separate architectural decision and subsequent non-regression/qualification work.

The valid result is a Pydantic plus SEM-AUDIT runtime candidate, not a product replacement and not a QRY-ready full hybrid pipeline. The value of conditional adjudication remains unmeasured in this frozen configuration.
