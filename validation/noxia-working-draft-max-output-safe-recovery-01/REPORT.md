# Working Draft output ceiling and safe financial recovery

## Causal result

The beta incident was an Azure HTTP 200 `incomplete/max_output_tokens` Working Draft response with complete usage. The product correctly rejected the partial scientific result, but the durable guard incorrectly treated its known financial outcome as `UNKNOWN_AFTER_DISPATCH` and closed the session. The existing `COMPLETED_RECEIVED`/`CONSUMED` operation states support billed but functionally rejected output; no new state or migration is needed.

The durable guard now settles only a structurally identified Working Draft response with exactly `status=incomplete`, `reason=max_output_tokens`, a matching model and usable usage inside the reserved bound. The provider response and 422 product result remain in the journal. Other incomplete reasons, missing usage, failed transport and response loss retain their existing fail-closed behavior. Campaign settlement remains unchanged. The client displays a specific nontechnical Working Draft message while retaining the visible Chat and never adopting partial output.

The current Working Draft full-state producer used the shared 8,000-token conversation ceiling. Only its packet now requests 16,000; ordinary Chat remains at 8,000. No model, reasoning effort, provider, financial cap or retry policy changed.

## Provider qualification

The fixture is a synthetic three-turn myocarditis Working Draft with a prior 20-atom composition, prepared by the native Working Draft owner. Exact OpenAI pre-count and the existing isolated qualification-store reservation preceded each Azure generation. Model was `gpt-5.6-sol`, reasoning medium, store=false. No Production database or configuration was touched.

| Ceiling | Input pre-count / Azure usage | Output / reasoning | Status | Owner validation | Reserve USD | Measured USD | Final committed USD |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
| 12,000 | 12,040 / 12,040 | 12,000 / 3,847 | incomplete/max_output_tokens | Not attempted on partial output | 0.3002 | 0.300197 | 0.3002 |
| 16,000 | 12,040 / 12,040 | 8,029 / 768 | completed | PASS | 0.3802 | 0.1654068 | 0.22078 |

Both paid operations reached `CONSUMED` with zero input-token delta. A subsequent read-only query confirmed `provider_gate_closed=false` for both qualification sessions. The 16,000-token case released the unused financial reserve. Two preliminary OpenAI pre-count attempts failed with HTTP 400 before reservation or Azure dispatch because the synthetic USER quote contained a newline in a strict schema enum. The actual provider error identified the exact schema path. The producer now canonicalizes ASCII layout only in quote enum literals; owner validation restores the exact immutable USER quote. That generic fix was necessary to qualify the realistic fixture and has a source-binding regression test. Total provider HTTP requests in this mission: four OpenAI counts and two Azure generations; no generation retry or reroll.

## Verification and limits

- Shared-store qualification tests: 17/17 on the isolated Neon qualification database, with the existing fail-closed identity preflight before any TRUNCATE. New tests cover known-cost incomplete settlement, reserve release, same-admission replay, subsequent admission and true response loss. The test run preceded the live qualification so its cleanup did not erase paid qualification operations.
- Offline targeted tests: 115/115, including canary settlement, source-binding, native Working Draft, visible Chat and UI behavior.
- TypeScript, affected lint, build and `git diff --check`: PASS.
- The 16,000-token output ceiling is qualified for this representative fixture, not a universal guarantee of completion for every future long conversation. A future incomplete response remains a visible, financially settled Working Draft failure when usage is complete.
- Scientific quality remains subject to human evaluation; this gate validates native completion and owner acceptance, not scientific approval.

Qualification artifacts: `qualification-12000.json`, `qualification-16000.json`, `shared-store-tests-qualification.json` and `shared-store-cleanup-qualification.json` in this directory. No credentials or provider response text are included.
