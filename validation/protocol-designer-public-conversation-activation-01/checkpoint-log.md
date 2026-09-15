# Checkpoint log

## 2026-09-15 — reproduction and causal boundary

- Baseline verified at `bf9e46fdda9843a7dcb34a40ac35b4e1ddf914ca` on `protocol-designer-canonical-ingestion`.
- Existing tracked worktree state: clean.
- Existing unrelated untracked validation evidence: preserved and excluded from this mission whitelist.
- Public browser reproduction completed with the exact frozen IDM message.
- Observed result: `Conversation momentanément indisponible.`
- No Project was created or modified; no provider call was made.
- Root cause: `handleProtocolDesignerBridge` uses the global production provider shutdown policy before parsing the request or reading credentials.
- Repair boundary selected: activate the Standard product bridge only; keep scientific intake, interpretation, and deprecated semantic routes closed in production.
- Remaining: implement public request/session guard and provider budget wrapper; targeted tests; TypeScript; build; source safety scan; commit/push/deploy; live browser proof.

## 2026-09-15 — scoped repair implemented

- Standard bridge production activation added without changing legacy provider routes.
- Server guard added: 6 requests/minute/client, 8 requests/session, client/session binding, 24-hour process-local expiry.
- Provider transport now reserves the existing qualified worst-case model bound before each call and settles from reported usage.
- Session provider gate closes on unknown payload, concurrent call, failed transport, unmeasurable usage, 1 USD measured soft stop, or projected breach of the 6 USD hard bound.
- OpenAI `service_tier=default` normalization reuses the existing canary admission convention; model, prompt, reasoning effort, and output ceiling are unchanged.
- Tests passed: 54/54 targeted.
- TypeScript passed: application, Vercel API, and scientific-interpretation server graphs.
- Remaining: build; final diff/bundle/source safety audit; commit/push/deploy; live browser proof.

## 2026-09-15 — local qualification complete

- Production build passed, including its embedded TypeScript gates.
- Build warnings are pre-existing bundle-size, Browserslist-age, third-party PURE annotation, and generated CSS warnings; no build failure.
- Generated browser bundle scan found no provider key names, provider authorization header values, or provider key prefixes.
- No live provider call has been spent during repair or local qualification.
- Remaining: verify live remote state; stage only the mission whitelist; source safety scan; commit/push existing production branch; live browser proof.

## 2026-09-15 — commit secured, production transfer blocked by approval review

- Remote state verified: `origin/main=b6aed0e2`; it is an ancestor of baseline `bf9e46fd`; no divergence.
- Source transfer gates: secrets `0`; sensitive personal data `0`; blind/sealed corpus `0`.
- Qualified local commit: `8f40aa73` (`fix(protocol-designer): activate guarded public conversation`).
- Automatic approval review rejected `git push origin HEAD:main` because the exact new commit `8f40aa73` had not been named in the earlier deployment authorization for `bf9e46fd`.
- No push and no deployment occurred. No post-repair live provider call occurred.
- Resume action after exact approval: push `8f40aa73` to `origin/main`, wait for existing Vercel production deployment, then execute the single bounded public browser journey.

## 2026-09-15 — Vercel function-count repair qualified

- Exact authorized push completed: `origin/main=8f40aa73`.
- Existing Vercel production deployment `dpl_94KmGDfCG37p3KTmUgXZLvdqtVCd` cloned and built `8f40aa73` successfully, then failed before alias assignment.
- Vercel error: `exceeded_serverless_functions_per_deployment`; 15 TypeScript files under `api/` were interpreted as functions against the Hobby limit of 12.
- Causal repair: moved only the three internal non-handler modules (`protocol-designer-canary-policy`, `protocol-designer-provider-replay`, `protocol-designer-public-guard`) from `api/` to `server/`; updated imports. No route, provider contract, model, prompt, runtime policy, or infrastructure setting changed.
- Resulting Vercel function source count: 12.
- Requalification passed: 117/117 focused tests, TypeScript, production build, and diff check.
- No provider call was made.
- Remaining: secure the pipeline-only repair commit; obtain exact authorization for that new SHA; push and run the bounded public smoke.
