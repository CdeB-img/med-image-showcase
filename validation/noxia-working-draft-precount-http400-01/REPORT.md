# Working Draft pre-count HTTP 400 — bounded diagnostic

The Production durable journal contains seven `COUNT_FAILED` operations on 2026-09-23, all with `PUBLIC_PROVIDER_INPUT_COUNT_HTTP_400`, zero reservation, and no provider generation. Their response digests match, but the response body and exact request payloads were not retained. The historical cause is therefore **UNKNOWN**. The Vercel historical log query supplied no further evidence (logs API HTTP 400). A current qualified Working Draft payload has previously passed pre-counting; that does not explain the older failures.

The path is `prepareWorkingDraftRequest` → `buildOpenAITerraConversationPayload` → `openAIInputCountRequest` → OpenAI `/responses/input_tokens` → durable count state → atomic reservation → Azure generation. The Working Draft role resolves to Azure `gpt-5.6-sol`; the pre-count provider remains OpenAI. The transport, model mapping, financial cap, and schema are unchanged.

Only a future Working Draft non-2xx pre-count now emits `WORKING_DRAFT_PRECOUNT_HTTP_FAILURE` into the existing runtime logs. It records technical error identifiers from fixed allowlists, request/response/schema digests, field types, sizes, opaque journal identifiers, and runtime commit. A raw provider message is withheld because it may echo scientific input or dynamic schema values. No prompt, scientific text, full schema, credential, or authorization header is logged.

Qualification: 15/15 targeted shared-store tests on the preflight-verified, isolated Neon qualification database `lingering-haze-73971206`; cleanup leaves zero sessions, admissions, operations, and rate buckets. A synthetic Azure-path HTTP 400 dispatched only one OpenAI count, no Azure generation, reserved zero, and consumed zero admissions. TypeScript, affected lint, build, and `git diff --check` passed. No live provider call or Production database write was performed in this mission.

The next real occurrence must be analyzed from the new technical diagnostic before a product correction is justified. No speculative schema or pre-count change was made.
