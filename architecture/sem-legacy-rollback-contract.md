# SEM Legacy Rollback Contract

| Field | Value |
|---|---|
| Status | `IMPLEMENTATION CONTRACT — NON_NORMATIVE` |
| Version | `1.0.0` |
| Date | 2026-08-14 |
| Nominal runtime | `HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` |
| Explicit rollback | `LEGACY_ACTIVE` |
| Diagnostic mode | `HYBRID_SHADOW` |

This contract bounds the retained SEM Full implementation after its removal
from the nominal product path. It does not change PD-003, OBS-001, VAL-000 or a
PD-011 qualification decision.

## Nominal mode

`HYBRID_ACTIVE_WITH_LEGACY_FALLBACK` executes the hybrid structured
interpreter. A fallback may occur only for the technical classes explicitly
listed by the runtime contract. A scientific disagreement, Audit-D finding,
low confidence or review requirement cannot invoke SEM Full.

## Explicit rollback

`LEGACY_ACTIVE` is an operator-selected rollback mode. It invokes SEM Full
directly and preserves the legacy model identity and digest. Activation must be
visible in the runtime response and session trace; it cannot be inferred from a
scientific result.

## Diagnostic mode

`HYBRID_SHADOW` keeps the legacy contribution active and records the hybrid
contribution for diagnostics. The shadow contribution has no UI, Project or
publication effect.

## Allowed automatic fallback

The nominal mode may fall back once for an explicitly classified provider,
transport, parsing, structured-output or hybrid-runtime availability failure.
The initial failure evidence, operation identity and raw reference when
available remain attached to the response.

Raw persistence failure is fail-closed and never falls back: without the raw
record, the attempted interpretation is not auditable.

## Forbidden fallback

Fallback is forbidden for:

- Audit-D findings, including critical findings;
- scientific divergence or incompleteness;
- low confidence, ambiguity or missing information;
- a Contribution disposition of `NEEDS_REVIEW`;
- Project, ownership or adoption decisions;
- attempts to obtain a better scientific answer.

No hybrid → legacy → hybrid loop and no silent model substitution is allowed.

## Preservation

The legacy module, prompts, schemas, tests, fixtures, campaign artefacts and
historical reports remain in place. They are rollback and non-regression
assets, not an active feature-development surface. Existing legacy sessions may
be converted through the read-only compatibility bridge without rewriting the
legacy identity.

## Reopening condition

Any future change to the archived SEM scientific behavior, prompts, schema,
canonicalizer, coverage, critic, evaluator or provider semantics requires a
new, explicitly governed mission. Runtime-neutral compatibility maintenance
must not be used to resume SEM feature development implicitly.
