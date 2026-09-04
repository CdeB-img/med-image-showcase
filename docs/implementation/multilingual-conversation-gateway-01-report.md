# MULTILINGUAL-CONVERSATION-GATEWAY-01 — implementation and qualification report

## 1. Baseline and scope

- Repository: `/Users/charles/Documents/Projets/NOXIA/noxia-dev`
- Branch: `protocol-designer-canonical-ingestion`
- HEAD before work: `063c00ff38606370432f9619b639cf03ce906a4b`
- Remote integration observed before work: `b6aed0e2d3002d45cfce04c321f93e9faf917c01`
- Remote main observed before work: `b6aed0e2d3002d45cfce04c321f93e9faf917c01`
- Tracked worktree changes before work: `0`
- Staged files before work: `0`
- Preserved historical untracked implementation reports: `9`
- Provider calls, live product tests, push and deployment: `0 / 0 / NO / NO`

The pre-existing untracked `validation/frozen-integrated-campaign-01/execution-01/` evidence was kept outside the candidate. The complete frozen campaign tree retained its initial aggregate digest:

`f273736ebefecaa1d1a68b30252c0be842e41d8cd95ca04dbac6e70a40d7cd99`

## 2. Normative routing and reuse-first decision

`0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` routed the review to the current UX, QRY, prompt-role and product contracts. The applicable sources inspected were:

- `docs/pd-004-ux-manifesto.md`;
- `docs/pd-005-prompt-library-architecture.md`;
- `docs/pd-009-decision-engine-architecture.md`;
- `output/documents/noxia-protocol-designer-product-specification-v1.0.docx`;
- current Product Bridge, Product Entry Router, session and TRACE contracts.

No authority states that Standard input is French-only. The existing lower conversation contract was limited to `fr | en`, while Standard supplied `fr` to the bridge. The bounded solution keeps that internal contract French and adds one conversation-boundary projection. No scientific owner, Project authority, QRY selection rule or document projection was changed.

Reuse decision:

- provider: existing Product Bridge Gemini provider;
- model: existing resolved Gemini conversation model, default `gemini-3.5-flash-lite`;
- transport/API: existing `/api/protocol-designer-bridge`;
- TRACE: existing ledger, identity model, taxonomy and Inspector;
- scientific processing: unchanged and canonically French.

## 3. Implemented boundary

Gateway contract/version: `PROTOCOL_DESIGNER_CONVERSATION_LANGUAGE_GATEWAY@1.0.0`.

Input flow:

`original user text -> conservative language detection -> identity path for French OR structured Gemini linguistic projection -> French working text -> Product Entry Router`

Output flow:

`canonical French product response -> identity path for French OR structured Gemini linguistic projection -> localized visible response`

The persisted boundary records:

- immutable original text and digest;
- source, detected and conversation languages;
- confidence and non-adopted switch candidate;
- French working projection and digest;
- provider/model/contract/projection identity;
- qualification and support status;
- ambiguity and deterministic invariant observations;
- Project identity only as lineage when already bound;
- explicit `projectWriteAuthorized=false` and `scientificDecisionAuthorized=false`.

Projection identity binds kind, source digest, source/target languages, provider, model and translation contract. An unchanged identity reuses the existing artifact. A weak turn inherits the established session language without switching it; strong contradictory language evidence creates a non-adopted candidate.

## 4. Fidelity and failure policy

The provider contract is linguistic only and explicitly prohibits interpretation, completion, clarification, Project write and certainty increase. Deterministic conformance checks cover numbers, units, identifiers/acronyms, negation, uncertainty, conditionality, comparison, temporal relations and decision-status markers. Provider support is represented as `SUPPORTED | UNSUPPORTED | UNKNOWN`; product qualification is represented separately as `QUALIFIED | PROVIDER_SUPPORTED_UNQUALIFIED | UNKNOWN`.

`UNSUPPORTED`, `UNKNOWN`, missing ambiguity attestation and an unverified invariant fail closed. The current Product Bridge provider policy performs one request and no retry. On required input-projection failure the original text is retained and the Router is not called. Output-projection failure is attributed to the canonical French response digest rather than to the original user text.

No claim of universal Gemini language support is made. FR, EN, JA and ZH are qualified by deterministic fixtures and adapter-level simulated provider responses only; no live provider qualification occurred.

## 5. Product and TRACE integration

Standard routes non-French input exclusively from the correlated French working projection. The Product Bridge natural-conversation context and persistent-extraction aid use that projection, while source anchors and immutable evidence remain bound to the original user turn.

TRACE profile evolved compatibly from `1.1.0` to `1.2.0`; legacy `1.0.0` and previous `1.1.0` remain readable. The existing taxonomy adds factual stages:

- `LANGUAGE_DETECTED`;
- `LANGUAGE_PROJECTION_CREATED`;
- `LANGUAGE_PROJECTION_NOT_REQUIRED`;
- `LANGUAGE_PROJECTION_FAILED`;
- `RESPONSE_LOCALIZED`.

The owner is `LANGUAGE_GATEWAY`, with decision owner `NONE`. A routed turn now begins at `USER_TURN_RECEIVED`, records the language boundary, then records `ROUTE_SELECTED` and `INTENT_REPRESENTED`. The Router input reference/digest points to the French working projection when translation was required. Early `UNDERSTAND` therefore leaves a complete pre-QRY trace. Existing pre-Project tracing reuses the same run and avoids duplicate route/intent events.

Standard and Expert consume the same persisted session. Standard exposes localized prose; Expert can inspect the original/working language lineage and routing events without creating a parallel Project.

## 6. Deterministic qualification

Focused gateway/UI qualification: `14 PASS`.

Covered cases:

- FR identity path and zero translation calls;
- exact frozen English intent retained as original evidence, routed through French and rendered in English;
- Japanese numbers, `MRI`, `1.5 T / 3 T`, uncertainty, conditionality and `UNKNOWN`;
- Chinese comparison, negation, uncertainty and acronyms;
- mixed French/English terminology without session switch;
- ambiguity preservation and failure without provider attestation;
- unsupported/unknown language result and invariant loss fail closed;
- stable-session switch candidate;
- projection deduplication;
- one-attempt Gemini adapter success and failure;
- input and output projection failure provenance;
- early `UNDERSTAND` TRACE;
- Standard/Expert state identity.

Shared Functional Reset perimeter: `868 PASS / 1 TODO / 0 FAIL`.

B01–B20 contract: `23 PASS / 1 TODO`; B01–B10 and B12–B20 pass, B11 remains `TODO_NOT_TESTABLE` by its frozen contract.

Qualification gates:

- TypeScript: `PASS`;
- affected lint: `PASS`;
- production build: `PASS`;
- `git diff --check`: `PASS`;
- final canonical suite: `3578 PASS / 12 SKIP / 1 TODO / 1 FAIL` across 235 test files;
- sole failure: historical unchanged `src/features/protocol-designer/__tests__/p-web-02-contract.test.tsx`, expected heading `Protocol Designer` versus current product heading;
- new regressions: `0`.

The production build retained pre-existing non-blocking warnings for outdated Browserslist data, two third-party PURE annotations, one generated CSS syntax warning and large chunks. None is introduced as a functional failure by this mission.

## 7. Success-gate result and limitations

- `MULTILINGUAL_CONVERSATION_GATEWAY = PASS`
- `FRENCH_INTERNAL_WORKING_LANGUAGE = PASS`
- `ORIGINAL_USER_TEXT_PRESERVED = PASS`
- `NON_FRENCH_INPUT_ROUTED_FROM_FRENCH_WORKING_PROJECTION = PASS`
- `FRENCH_INPUT_TRANSLATION_CALL = 0`
- `OUTPUT_LOCALIZED_TO_CONVERSATION_LANGUAGE = PASS`
- `TRANSLATION_PROJECT_WRITE = NO`
- `TRANSLATION_SCIENTIFIC_DECISION = NO`
- `AMBIGUITY_PRESERVATION = PASS`
- `LINGUISTIC_INVARIANT_PRESERVATION = PASS`
- `TRANSLATION_DEDUPLICATION = PASS`
- `PROVIDER_FAILURE_FAIL_CLOSED = PASS`
- `TRACE_STARTS_AT_USER_TURN = PASS`
- `UNDERSTAND_EARLY_RETURN_TRACE = PASS`
- `PRODUCT_ENTRY_ROUTER_INSIDE_TRACE = PASS`
- `STANDARD_EXPERT_STATE_IDENTITY = PASS`
- `FROZEN_CAMPAIGN_V1_FILES_CHANGED = 0`
- `NEW_REGRESSIONS = 0`

Limits retained:

- no live provider behavior was qualified;
- no claim of exhaustive multilingual scientific fidelity is made;
- UI internationalization and document-language projection remain out of scope;
- no scientific owner or routing behavior was repaired;
- frozen campaign v1 remains historically invalid for scientific qualification and unchanged.

## 8. Git boundary and next action

Candidate allowlist contains only the language contract/provider adapter, Product Bridge and Standard integration, compatible TRACE/session evolution, bounded tests and this report. Scientific owner files, DOC-002, TMP-001, REG and Reference Corpus files changed: `0`.

The candidate is committed by the commit containing this report; its SHA is intentionally not embedded in its own content. No push or deployment is authorized.

`NEXT_ACTION = FROZEN_INTEGRATED_CAMPAIGN_DEFINITION_02_LANGUAGE_BOUND`
