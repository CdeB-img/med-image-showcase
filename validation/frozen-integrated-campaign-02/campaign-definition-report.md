# FROZEN-INTEGRATED-CAMPAIGN-02 — Language-bound definition report

## Decision

`FROZEN_INTEGRATED_CAMPAIGN_02_LANGUAGE_BOUND_DEFINED`

This directory defines a new frozen campaign on runtime baseline `992fc4ce8e2636de62418c5ef43108c8f0c36fd6`. It does not execute A–D and contains no product or provider result.

## Historical boundary

FIC01 v1 remains unchanged historical evidence with status `CAMPAIGN_TECHNICALLY_INVALID_FOR_PRODUCT_SCIENTIFIC_QUALIFICATION`. Its complete 37-file tree, including `execution-01`, is bound by digest `f273736ebefecaa1d1a68b30252c0be842e41d8cd95ca04dbac6e70a40d7cd99`.

FIC02 does not rewrite FIC01. Every FIC02 scenario and scientific acceptance envelope references the exact corresponding FIC01 artifact and freezes its SHA-256. The cross-campaign validator dereferences those links, verifies exact artifact identity, checks original English text equality, preserves primary/optional membership and verifies that every shared first-divergence class retains its FIC01 meaning. Scientific semantic drift is therefore zero by construction and validation, not by narrative assertion.

## Language contract

The source and conversation language is English. French is the internal working, Product Entry Router and canonical internal response language. The visible response language is English. Both input and output projections are required for A–D.

The original English text is immutable evidence. The French working projection and localized English response are derived artifacts with separate provenance and digests. Neither derived prose creates Project truth. The gateway is a boundary capability, not a scientific owner.

Language Gateway `1.0.0` is qualified only through deterministic adapters. Live provider capability remains `NOT_VERIFIED`; this is an explicit pre-execution limitation, not a definition failure.

## Scientific versus linguistic acceptance

The scientific envelopes remain exactly those of FIC01 v1. A separate linguistic envelope checks preservation of numbers, units, identifiers, negation, uncertainty, conditionality, temporal relations, scientific entities and UNKNOWN/WITHHELD semantics. It prohibits added science, silent ambiguity resolution, decision mutation, Project writes, owner changes through embellishment and candidate-to-adopted promotion. Literal output equality is not required.

Human scientific adjudication remains empty and separate. Deterministic language checks do not authorize provider self-certification.

## TRACE and causal attribution

TRACE profile `1.2.0` is frozen. Future Level-2 execution must capture the language boundary before Product Entry Router and retain early routing outcomes. `LANGUAGE_GATEWAY`, `PRODUCT_ENTRY_ROUTER`, `QRY` and downstream causal classes remain distinct. Provider technical failures are separately classified and never automatically become scientific failures.

## Provider and budget boundary

Repository provider intent freezes Gemini `gemini-3.5-flash-lite` for conversation/language projection and OpenAI `gpt-5.6-terra` for persistent extraction. Effective deployment overrides are `UNKNOWN` and must be bound once before A, then preserved through D.

FIC01 scientific/product budgets are unchanged. The separate language budget is mechanically bounded to one input plus one output call per user turn, with no gateway retry and no hidden retry. Accounting separates language Gemini, scientific Gemini, OpenAI, retries and failures.

## Frozen runtime surface

Twenty component selections freeze Reference Corpus, Reference Knowledge Index, Knowledge, Scientific Thinking, Study Design, OBS, Imaging, Biostatistics, CDM, Data Management, REG, Project, QRY, DOC-002, TMP-001, VAL, Standard, Language Gateway, TRACE and provider configuration intent.

No runtime, engine, owner, gateway, TRACE, QRY, Reference Corpus, DOC-002, TMP-001 or REG file is modified by this definition.

## Validation and limitations

`campaign-definition-validator.mjs` checks completeness, frozen identities, language and provider contracts, budgets, human empty fields, component and definition digests, secret absence, FIC01 immutability, Git scope and absence of embedded execution results.

`cross-campaign-equivalence-validator.mjs` checks exact scientific inheritance and taxonomy preservation. It does not claim that live translation or the integrated product corridor works; those capabilities remain for `FROZEN_INTEGRATED_CAMPAIGN_02_EXECUTION`.

## Next action

`FROZEN_INTEGRATED_CAMPAIGN_02_EXECUTION`

Execution requires a separate authorization and must bind the effective provider configuration before Scenario A. No live call was made during definition.
