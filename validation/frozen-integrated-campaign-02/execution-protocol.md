# FROZEN-INTEGRATED-CAMPAIGN-02 — Execution protocol

## Status and boundary

This file freezes the future execution procedure for `FROZEN-INTEGRATED-CAMPAIGN-02@2.0.0`. It is not an execution record. No scenario, provider, product or live-system call is performed by this definition.

The executor must bind runtime commit `992fc4ce8e2636de62418c5ef43108c8f0c36fd6`, Language Gateway `1.0.0`, TRACE profile `1.2.0`, the frozen component digests in `campaign-manifest.json`, and one effective provider/model configuration before Scenario A. The same configuration must remain unchanged through A–D.

## Scenario resolution

Run the four primary scenarios in this exact order: A, B, C, D. Scenario E is optional and excluded from the primary gate.

Each `scenario-*.json` is a language-bound wrapper around an exact FIC01 v1 scientific artifact. Before use, resolve `scientificDefinition.ref`, verify its SHA-256, and use that referenced artifact as the complete scientific fixture. Do not translate the English fixture manually, add facts, remove unknowns or modify unresolved decisions. Resolve the scientific acceptance envelope in the same manner.

## Per-turn language corridor

For every user turn:

1. Preserve `ORIGINAL_USER_TEXT_EN` and its digest as immutable user evidence.
2. Detect the source language and record `LANGUAGE_DETECTED`.
3. Create at most one input projection through the frozen language gateway; record `LANGUAGE_PROJECTION_CREATED`, its provider evidence, source digest, derived digest and the fact that the French text is not a user literal.
4. Route only the French working projection; record `PRODUCT_ENTRY_ROUTE_SELECTED`, including early `UNDERSTAND` outcomes and construction eligibility.
5. Continue through QRY, Knowledge, governed owners, Project and document projection when reached.
6. Preserve `CANONICAL_INTERNAL_RESPONSE_FR` and its digest.
7. Create at most one output localization; record `OUTPUT_LANGUAGE_PROJECTION`, its provenance and digest.
8. Present `LOCALIZED_VISIBLE_RESPONSE_EN` without treating it as a second Project truth.

Where the runtime event name is `ROUTE_SELECTED` or `RESPONSE_LOCALIZED`, the execution packet must map it explicitly to the campaign concepts `PRODUCT_ENTRY_ROUTE_SELECTED` and `OUTPUT_LANGUAGE_PROJECTION`; it must not fabricate an event absent from TRACE.

## Required TRACE sequence

TRACE capture level is `LEVEL_2_DIAGNOSTIC`. The expected chronological corridor is:

`USER_TURN_RECEIVED → LANGUAGE_DETECTED → LANGUAGE_PROJECTION_CREATED → PRODUCT_ENTRY_ROUTE_SELECTED → QRY → Knowledge → governed owners → Project → DOC/response realization → OUTPUT_LANGUAGE_PROJECTION`.

Record facts only. TRACE does not decide, repair or adjudicate science. VAL may emit only existing supported deterministic structural diagnostics. Qualitative scientific judgment remains human.

## First divergence

Determine the earliest evidenced divergence against the original English fixture, the referenced FIC01 scientific definition, the referenced scientific acceptance envelope and the separate linguistic envelope.

- If the input projection changes meaning and routing consequently fails, classify the first divergence as `LANGUAGE_GATEWAY`.
- If the projection passes and entry routing first fails, classify `PRODUCT_ENTRY_ROUTER`.
- If gateway and router pass and next-action selection first fails, classify `QRY`.
- Continue chronologically through Knowledge, owners, handoff, Project, REG, TMP/DOC, HOW/UX and validation.
- Use `PROVIDER_TECHNICAL` for the first technical provider outage/schema/transport boundary without converting it automatically into a scientific judgment.
- Use `UNKNOWN` when evidence is insufficient.

Preserve `NEED_HAS_NO_LEGITIMATE_OWNER`. Translation is a boundary capability and cannot supply a missing scientific owner.

## Provider accounting and failure isolation

Report separately for every scenario and for the aggregate campaign:

- `LANGUAGE_GATEWAY_GEMINI_CALLS`
- `SCIENTIFIC_GEMINI_CALLS`
- `OPENAI_CALLS`
- `PROVIDER_RETRIES`
- `PROVIDER_FAILURES`

Distinguish `LANGUAGE_PROVIDER_TIMEOUT`, `LANGUAGE_PROVIDER_FAILURE`, `LANGUAGE_PROVIDER_SCHEMA_FAILURE` and `LANGUAGE_TRANSLATION_CONTRACT_FAILURE` from product-entry routing, scientific and orchestration failures.

## Frozen budgets

Scientific/product budgets are unchanged from FIC01: at most 8 Standard turns, 12 QRY actions, 4 Knowledge actions, 12 owner invocations, 24 provider calls and 8 provider retries per scenario.

The separate language budget is at most 2 calls per user turn: one input projection plus one output projection. The gateway has zero retries and no hidden retry.

## No-repair baseline

During A–D: no runtime repair, prompt edit, corpus edit, acceptance-envelope edit, provider/model switch, manual French fixture substitution or scientific budget expansion. Preserve outputs and traces even after a blocking first divergence; downstream scientific qualification becomes `NOT_ASSESSABLE_AFTER_UPSTREAM_DIVERGENCE` where applicable.

## Human adjudication

Populate `human-adjudication-template.json` only after evidence capture. Deterministic language checks do not allow Gemini or any other provider to self-certify scientific fidelity. Do not require literal prose equality.

## Out of scope

UI language selection, multilingual exported documents, English secondary export, document-language pipelines, product repairs, deployment and promotion are outside this campaign definition.
