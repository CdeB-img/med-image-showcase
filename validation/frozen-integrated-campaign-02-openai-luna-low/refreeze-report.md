# FIC02 OpenAI Luna low — provider-bound refreeze report

## 1. Decision

`FIC02_OPENAI_LUNA_LOW_FROZEN_READY_FOR_REPLAY`

This directory is a new, provider-bound freeze for a future explicitly authorized FIC02 A–D replay. It contains no provider result and no replay result. The historical `validation/frozen-integrated-campaign-02/` tree remains the terminal record for its own provider-bound configuration.

## 2. Authority and evidence boundary

`0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` was used as the authority router. The applicable authority chain was limited to the Scientific Product Manifesto V2, Product Specification, PD-004 and PD-009. These authorities preserve scientific intent, uncertainty, human decision ownership and next-action ownership; they do not select a provider.

The OpenAI/Luna/low selection is a product decision embodied by product commit `9675ebac2dbc77ee268e2d83a7351b9d49c82e29` and documented at authoring HEAD `8e5d12e46c7d090ed1b03c10047c914b5b17076d`. The validation campaign is evidence, not authority. No normative file was modified.

No contradiction was found between the unchanged A–D fixtures and the current authorities. The scientific scenarios and their scientific Acceptance Envelopes therefore remain exact references to the historical FIC02/FIC01 artifacts.

## 3. Historical inventory and freeze delta

| Dimension | Historical value | Current required value | Change reason | Semantic change |
|---|---|---|---|---|
| Campaign identity | `FROZEN-INTEGRATED-CAMPAIGN-02@2.0.0` | `FROZEN-INTEGRATED-CAMPAIGN-02-OPENAI-LUNA-LOW@3.0.0` | Distinct provider-bound supersession | NO — same A–D scientific campaign |
| Baseline HEAD | `992fc4ce8e2636de62418c5ef43108c8f0c36fd6` | `8e5d12e46c7d090ed1b03c10047c914b5b17076d` | Bind the migrated product and its report | NO to fixtures; YES to runtime binding |
| Scenarios | A, B, C, D primary; E optional | A, B, C, D primary only | Mission scope excludes optional E | NO for primary gate |
| Scenario digests | Historical FIC02 wrappers and FIC01 sources | Exact same wrapper, source and UTF-8 text digests | Identity preservation | NO |
| Scientific Acceptance Envelopes | Exact referenced FIC01 A–D | Exact same referenced FIC01 A–D | No scientific contract change authorized | NO |
| Language Gateway | `MULTILINGUAL_CONVERSATION_GATEWAY@1.0.0` | `PROTOCOL_DESIGNER_CONVERSATION_LANGUAGE_GATEWAY@1.4.0` | Current product migration | YES — linguistic contract only |
| Language provider | Gemini bridge / `gemini-3.5-flash-lite` | OpenAI Responses / `gpt-5.6-luna` / `low` | Explicit product decision | YES — execution configuration only |
| Structured output | Historical Gemini function-call contract | `conversation_language_projection_v1_4_0`, JSON Schema, `strict=false` | Current product adapter | YES — provider boundary only |
| Reference evaluator | Historical composite language interpretation | Separate schema, product contract, reference agreement and human-visible statuses | Correct product/reference ownership | YES — evaluation semantics only |
| QRY | `QRY001@1.0.0_PD-009-1.0` | Same contract, current baseline source bound by Git | No QRY change authorized | NO |
| Project | Canonical Project with human-review/write gates | `CANONICAL_RESEARCH_PROJECT_STATE@0.2.0`, current baseline bound by Git | Reproducible current runtime | NO to expected gate |
| Scientific owners | Frozen owner stack | Current owner stack bound by exact Git tree | Product evolved since historical baseline | NO change introduced by this freeze |
| Natural conversation | Gemini `gemini-3.5-flash-lite` | Same | Language Gateway migration does not migrate the conversation executor | NO |
| Persistent extraction | OpenAI `gpt-5.6-terra`, at most one deterministic recovery | Same | No extraction change authorized | NO |
| TRACE | profile `1.2.0`, Level 2 | profile `1.5.0`, Level 2 | Current provider/context observability | YES — passive observability only |
| Provider call budget | 24 scientific/product calls per scenario plus language budget | Explicit aggregate: 64 language + 32 conversation + 64 extraction maximum | Recalculated from current three-call-boundary runtime | NO reroll authority added |
| Retry policy | Language 0; conversation 0; extraction bounded recovery | Same runtime recovery; operator retries 0 | Preserve current fail-closed runtime | NO |
| Human Review gate | Required | Required | Authority invariant | NO |
| Blocking criteria | Per-gate, first-divergence, fail-closed | Same, now split into gates A–H | Avoid ambiguous global PASS/FAIL | NO scientific change |
| Artifact capture | Digests and execution packets; rejected full text could be unavailable | Exact source, translated, raw structured, visible and canonical text when produced | Enable real human review | YES — campaign evidence only |
| Historical artifact manifest | Historical `definitionDigests` (21 entries) | Preserved and separately verified | Historical integrity | NO |
| New digest manifest | None | All new freeze files except self are SHA-256 bound | Reproducible supersession | NO |

## 4. Scenario and envelope integrity

The four historical wrapper digests, four underlying FIC01 scientific fixture digests, four exact user-text digests and four scientific Acceptance Envelope digests were recomputed from bytes. All match the historical manifests.

The A–D texts are standalone initial requests. They do not use a pronoun, ellipsis or correction whose referent exists only in a prior turn. Therefore `FIC02_SCENARIOS_REQUIRE_LOCAL_ANAPHORIC_CONTEXT = NO`; the known local linguistic context-selection gap does not block this freeze.

No scenario text, scientific objective, unknown, unresolved decision or scientific Acceptance Envelope was changed.

## 5. Language and reference contract

Language Gateway 1.4.0 treats `UNCERTAINTY` as explicit epistemic modality or explicit reservation about certainty/possibility. `not yet / pas encore` alone maps to negation present, temporal relation present and uncertainty absent. This affects the linguistic validator; it does not modify the scientific fixtures or promote a temporal phrase into Project state.

Product schema conformity, product contract conformity, reference agreement and human-visible translation judgment are independent axes. The historical composite `8/8` gate is prohibited. No exhaustive Gold was added for A–D.

Historical Luna CASE-04 remains prior information only: the 1.3.0 output claimed uncertainty present and would be rejected by 1.4.0. Current Luna 1.4.0 behavior is `UNKNOWN`; the historical output is not predictive of the next runtime.

## 6. Provider, context and call budget

The Language Gateway is bound to OpenAI Responses, `gpt-5.6-luna`, `reasoning.effort=low`, schema `conversation_language_projection_v1_4_0`, no automatic provider fallback, no automatic effort escalation and no retry. The future executor must capture requested and returned identities and stop on mismatch.

The bounded context is `LANGUAGE_GATEWAY_CURRENT_SOURCE_TEXT_V1`: current source text, source/target languages, protected literals, required structured invariant contract and only explicitly referenced local linguistic context. Full transcript, Project, OwnerResult ledger, Knowledge corpus, documents and full TRACE are excluded.

Budget derivation across four scenarios and at most eight turns each:

- Language Gateway: 2 calls per completed turn, minimum 8 and maximum 64.
- Scientific conversation: 1 call per routed turn, minimum 4 and maximum 32.
- Persistent extraction: 1 normal attempt for each initial construction-eligible scenario; at most 2 attempts per eligible turn because the canonical runtime permits one automatic recovery after a recoverable deterministic validation failure. Minimum 4 and maximum 64.
- Overall provider-call ceiling: `64 + 32 + 64 = 160`.
- Operator retries: 0. The ceiling is not permission to reroll.

## 7. TRACE, gates and capture

TRACE is frozen at `NOXIA_END_TO_END_PRODUCT_TRACE@1.5.0`, `LEVEL_2_DIAGNOSTIC`, ledger/event/pre-Project versions `0.1.0`. It records provider/model/effort/response ID/context refs/token counts when available, rejected witnesses, first divergence and causal owner. It remains passive and does not decide, repair, mutate Product or judge science.

The future replay reports eight separate gates: visible corridor; Language Gateway product contract; Router/QRY reachability; scientific-owner handoffs; Project extraction/validation; Human Review boundary; TRACE/provenance; reference agreement when a reference exists. Downstream gates after a blocking upstream divergence become `NOT_ASSESSABLE_AFTER_UPSTREAM_DIVERGENCE`.

Campaign execution artifacts—not TRACE CORE—must retain the exact source and translated texts, raw structured provider output, visible response, and canonical scientific response when produced. A missing text requires `NOT_CAPTURED_WITH_REASON`; a digest alone is insufficient for human translation review.

## 8. Deterministic qualification and Git boundary

Qualification is limited to JSON parsing, SHA-256 verification, Git commit/tree existence, runtime constant identity, A–D exact identity, Acceptance Envelope identity, provider/schema/effort identity, absence of fallback/escalation, gate completeness, budget arithmetic, capture policy, supersession and historical-tree preservation.

No provider was called. No scenario was executed. No product, normative, historical FIC02 or prior execution artifact was changed. The commit allowlist contains only this new freeze root.

## 9. Exact mission record

```ini
MISSION_STATUS = FIC02_OPENAI_LUNA_LOW_FROZEN_READY_FOR_REPLAY

HEAD_BEFORE = 8e5d12e46c7d090ed1b03c10047c914b5b17076d
HEAD_AFTER_FREEZE = RESOLVED_BY_FREEZE_COMMIT
HEAD_FINAL = RESOLVED_BY_FREEZE_COMMIT
FREEZE_COMMIT = RESOLVED_BY_FREEZE_COMMIT

PREVIOUS_FIC02_FREEZE_ID = FROZEN-INTEGRATED-CAMPAIGN-02
PREVIOUS_FIC02_FREEZE_VERSION = 2.0.0
PREVIOUS_FIC02_FREEZE_STATUS = HISTORICAL_TERMINAL_FOR_ITS_PROVIDER_BOUND_CONFIGURATION

NEW_FIC02_FREEZE_ID = FROZEN-INTEGRATED-CAMPAIGN-02-OPENAI-LUNA-LOW
NEW_FIC02_FREEZE_VERSION = 3.0.0

SUPERSESSION_RELATION = SUPERSEDES_FOR_FUTURE_FIC02_PROVIDER_BOUND_REPLAY_ONLY
SUPERSESSION_REASON = LANGUAGE_GATEWAY_1_4_0 + PROVIDER_MIGRATION_GEMINI_TO_OPENAI + MODEL_GPT_5_6_LUNA_LOW + REFERENCE_GATE_CORRECTION + CONTEXT_BOUNDARY_OBSERVABILITY

NEW_FREEZE_IDENTITY_DISTINCT_FROM_HISTORICAL = PASS

BASELINE_HEAD = 8e5d12e46c7d090ed1b03c10047c914b5b17076d
PRODUCT_COMMIT = 9675ebac2dbc77ee268e2d83a7351b9d49c82e29
LANGUAGE_GATEWAY_VERSION = 1.4.0

TARGET_PROVIDER = OPENAI
TARGET_MODEL = gpt-5.6-luna
TARGET_REASONING_EFFORT = low

MODEL_SELECTION_STATUS = PROVISIONAL_OPERATIONAL_BASELINE_PENDING_REPLAY
AUTOMATIC_PROVIDER_FALLBACK = NO
AUTOMATIC_REASONING_EFFORT_ESCALATION = NO
FUTURE_ESCALATION_POLICY = LUNA_LOW_THEN_MEDIUM_THEN_HIGH_THEN_TERRA_IF_CAUSALLY_JUSTIFIED

SCENARIO_A_IDENTITY = PASS
SCENARIO_B_IDENTITY = PASS
SCENARIO_C_IDENTITY = PASS
SCENARIO_D_IDENTITY = PASS
SCENARIO_TEXTS_CHANGED = 0
SCIENTIFIC_EXPECTATIONS_CHANGED = 0

LANGUAGE_ACCEPTANCE_CHANGES = UNCERTAINTY_BOUNDARY_CLARIFIED; NOT_YET_TEMPORAL_RELATION_PRESERVED_WITHOUT_AUTOMATIC_UNCERTAINTY; PRODUCT_AND_REFERENCE_GATES_SEPARATED
REFERENCE_GATE_SEPARATION = PASS

FIC02_SCENARIOS_REQUIRE_LOCAL_ANAPHORIC_CONTEXT = NO
LANGUAGE_GATEWAY_CONTEXT_SCOPE_ID = LANGUAGE_GATEWAY_CURRENT_SOURCE_TEXT_V1
FULL_TEXT_CAPTURE_POLICY = PASS

TRACE_VERSION = 1.5.0
TRACE_LEVEL2_EXPECTATION = LEVEL_2_DIAGNOSTIC

EXPECTED_LANGUAGE_GATEWAY_CALLS_MIN = 8
EXPECTED_LANGUAGE_GATEWAY_CALLS_MAX = 64
EXPECTED_SCIENTIFIC_PROVIDER_CALLS_MIN = 4
EXPECTED_SCIENTIFIC_PROVIDER_CALLS_MAX = 32
EXPECTED_EXTRACTION_CALLS_MIN = 4
EXPECTED_EXTRACTION_CALLS_MAX = 64
OVERALL_PROVIDER_CALL_BUDGET = 160
OPERATOR_RETRIES = 0

HISTORICAL_LUNA_CASE_04_STATUS = OLD_PROMPT_1_3_0_UNCERTAINTY_CLAIM_PRESENT__CURRENT_1_4_0_CONTRACT_WOULD_REJECT__CURRENT_LUNA_1_4_0_BEHAVIOR_UNKNOWN
OLD_1_3_0_OUTPUT_NOT_PREDICTIVE_OF_1_4_0_RUNTIME = YES

HISTORICAL_FIC02_FILES_CHANGED = 0
PRODUCT_FILES_CHANGED = 0
NORMATIVE_FILES_CHANGED = 0

PROVIDER_CALLS = 0
OPENAI_CALLS = 0
GEMINI_CALLS = 0
REPLAY_EXECUTED = NO

DIGEST_MANIFEST_STATUS = PASS_AFTER_DETERMINISTIC_VALIDATION

PUSH = NO
DEPLOYMENT = NO

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO

NEXT_ACTION = FIC02_OPENAI_LUNA_LOW_REPLAY_01
```
