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
