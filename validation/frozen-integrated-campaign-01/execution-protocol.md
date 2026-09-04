# Frozen Integrated Campaign 01 — Execution Protocol

- Status: `FROZEN_DEFINITION_ONLY`
- Runtime baseline: `adea948aef0402d8f4bbf66324b0d59643e95bfd`
- Product surface: `STANDARD`
- Diagnostic surface: `EXPERT_TRACE`
- TRACE capture level: `LEVEL_2_DIAGNOSTIC`

This protocol governs a later execution mission. It does not authorize execution, provider calls, repair, push or deployment.

## 1. Admission gate

Before any scenario:

1. Check out the exact runtime baseline plus the committed campaign-definition artifacts, without runtime changes.
2. Run `node validation/frozen-integrated-campaign-01/validate.mjs`.
3. Refuse execution if any frozen component digest, scenario/envelope digest, primary/optional partition, provider identity or TRACE level differs.
4. Resolve and record the actual provider configuration once. The manifest's source-derived identity is `PARTIAL`; unresolved deployment model overrides must be bound before the first scenario.
5. Use the same bound provider/model/routing configuration for all four primary scenarios. A technical impossibility to preserve this identity blocks comparability.
6. Start from an empty product session for each scenario while retaining one campaign-level evidence package.

The optional scenario E is never counted in the mandatory primary gate.

## 2. Deterministic user

The harness must not use an LLM to simulate the user.

- If a question maps to `knownFacts`, return the exact frozen statement.
- If it maps to `unresolvedDecisions`, return `not decided yet`.
- If it requests information not supplied, return `unknown / not available`.
- If it cannot be mapped deterministically, record `UNMAPPED_PRODUCT_QUESTION` and request human review; do not fabricate.
- Preserve `knownAbsences`, `withheldInformation` and `outOfScopeInformation` as distinct states.

Responses are evidence-bearing fixture events and must reference the fact or decision identifier used.

## 3. Scenario procedure

Run A, B, C and D independently on the same runtime/provider baseline. A failure in one does not stop the other primary scenarios.

For each scenario:

1. Submit the exact `initialUserIntent` through Standard.
2. Capture the complete responsibility chain in TRACE Level 2 Diagnostic.
3. Answer only through the deterministic fact packet.
4. Let QRY choose each next legitimate action. Do not impose a universal owner order or automatic fan-out.
5. Record owner contributions, evidence/provenance, Project candidates, human decisions, Project versions/digests, stale/superseded states and document projections.
6. Pause rather than fabricate at an unresolved human-decision checkpoint.
7. Stop the scenario at the first of:
   - a blocking first divergence;
   - the planned terminal target;
   - an unresolved human-decision checkpoint;
   - the frozen orchestration budget being exceeded.
8. Preserve TRACE and downstream outputs after a blocking divergence, but classify downstream scientific assessment as `NOT_ASSESSABLE_AFTER_UPSTREAM_DIVERGENCE`.

No repair is permitted between primary scenarios during the baseline pass.

## 4. Counters and fixed ceilings

Per scenario:

- Standard conversation exchanges: maximum 8.
- QRY actions: maximum 12.
- Knowledge actions: maximum 4.
- domain-owner invocations: maximum 12.
- external provider request starts: maximum 24.
- provider retries: maximum 8, and only where the existing runtime contract explicitly permits them.

Record separately:

- `PROVIDER_CALL_COUNT`
- `PROVIDER_RETRY_COUNT`
- `PROVIDER_FAILURE_COUNT`
- `KNOWLEDGE_ACTION_COUNT`
- `REFERENCE_LOOKUP_COUNT`
- `EXTERNAL_PROVIDER_CALL_COUNT`
- `OWNER_INVOCATION_COUNT`

A deterministic local Reference Corpus lookup is not an external provider call. A same-state duplicate provider request is forbidden unless it is the explicit bounded technical retry already defined by runtime.

## 5. Assessment

Use only these states:

- `PASS`
- `BLOCKING_FAIL`
- `NON_BLOCKING_FINDING`
- `HUMAN_REVIEW_REQUIRED`
- `NOT_APPLICABLE`
- `NOT_ASSESSABLE_AFTER_UPSTREAM_DIVERGENCE`

Assess observable behavior against the corresponding envelope and common invariants. Do not require exact wording, an exact question count, a fixed internal action identifier, a universal owner sequence or a predetermined statistical/imaging method.

TRACE records facts. Existing deterministic VAL may diagnose only contractually supported structural conditions. Human review adjudicates scientific defensibility, important omissions, assumptions, alternatives, tradeoffs, question usefulness and professional credibility.

Record the earliest evidenced divergence with `first-divergence-taxonomy.json`. Do not infer the causal owner from the final visible answer.

## 6. Evidence package

For every scenario preserve:

- frozen scenario and envelope identities;
- bound runtime and provider identities;
- exact transcript;
- deterministic-user mappings;
- Project state/version/digest evolution;
- owner decisions, alternatives, handoffs and evidence limitations;
- Knowledge source identities and lookup counts;
- current Project and Protocol/TMP/DOC projections;
- TRACE events and first-divergence record;
- VAL diagnostics;
- all counters and stop reason;
- an unpopulated then human-completed adjudication record.

Execution artifacts must be written outside the frozen definition set and must never alter these files in place.

## 7. Repair and final pass

After the complete four-scenario baseline, group blocking findings by causal owner, divergence class and shared root cause. A separate authorized mission may perform bounded repairs and targeted replays. Acceptance definitions remain immutable.

Once a final candidate exists, run all four primary scenarios once more against these exact frozen definitions and the same configuration rules. Optional E remains a separate stress result.
