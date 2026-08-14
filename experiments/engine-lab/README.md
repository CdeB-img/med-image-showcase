# NOXIA Engine Lab

Status: `EXPERIMENTAL_SANDBOX`

The Engine Lab compares replaceable runtimes without creating a second Scientific Core. It has no normative authority, no write access to the production Research Project or official Knowledge, and no automatic promotion right. Its results are evidence for a later human decision only.

## Vocabulary

- `SCIENTIFIC_CORE`: the single logical NOXIA scientific-reasoning system.
- `CAPABILITY_MODULE`: a bounded responsibility within or adjacent to the Scientific Core.
- `RUNTIME`: a replaceable implementation used to execute a capability.
- `SOURCE_OF_TRUTH_OWNER`: the domain that owns adopted state.
- `PROJECTION`: a derived representation of existing state.
- `ENGINE_LAB`: this non-authoritative experimental zone.

## Modes

| Mode | Permitted | Required |
|---|---|---|
| `DISCOVERY` | visible scenarios, declared prompt/adapter changes and tuning | experimental lab boundary and complete trace |
| `FROZEN_COMPARISON` | comparison of frozen candidates | frozen input/configuration, native output, no tuning after observation |
| `PRODUCT_CANDIDATE` | NOXIA contract adaptation and critical guards | explicit promotion decision, non-regression evidence, no product write |

## Five invariants

1. Persist the exact input.
2. Persist native raw output before parsing, validation or rejection.
3. Classify wiring/provider/contract failure separately from cognitive failure.
4. Make configuration reconstructible through immutable identifiers and digests.
5. Never promote an experimental result into the product silently.

## Comparison tracks

- `NATIVE_CAPABILITY_TRACK`: preserve and review what the runtime naturally produces.
- `COMMON_TASK_TRACK`: compare semantic task performance using the same input and, when applicable, the same base model.
- `NOXIA_COMPATIBILITY_TRACK`: measure the adaptation, guards, provenance, ownership and maintenance required by NOXIA.

NOXIA compatibility is not a substitute for scientific understanding. A valid native output is never overwritten by its normalization.

## Layout

- `registry/`: evidence-backed capability, runtime, task, documentary-asset and transition inventories.
- `contracts/`: machine contracts for reconstructible experiments and non-mutating findings.
- `tasks/semantic-audit/`: the first implemented task, SEM-AUDIT-D.
- `validation/`: deterministic registry and lab-contract checks.
- `results/`: intentionally empty until an explicitly authorized experiment writes a governed result.

Existing runners under `experiments/semantic-engine-comparison/` remain the reusable execution infrastructure. This foundation does not duplicate or run them.
