# SEM Legacy Module — Logical Archive

| Field | Value |
|---|---|
| Status | `LOGICALLY_ARCHIVED — SOURCE_PRESERVED` |
| Date | 2026-08-14 |
| Module | `src/features/scientific-semantic-reconstruction/` |
| Nominal product runtime | `NO` |
| Explicit rollback available | `YES` |
| Historical evidence preserved | `YES` |

SEM Full is retained as a frozen implementation for explicit rollback,
historical replay and non-regression. It is no longer the nominal product
runtime and is not an active development workstream.

The archive is logical: source files and evidence stay at their existing paths
to preserve imports, digests, fixtures, reports and historical campaign
reproducibility. Nothing is deleted, moved or retroactively rewritten.

Nominal product execution crosses the runtime-neutral Scientific
Interpretation Contribution boundary. The legacy module may be reached only by
the explicit rollback adapter, historical/non-regression tests or the read-only
legacy-session compatibility bridge.

Audit-D remains part of the hybrid product path. Audit-L remains shadow-only.
No adjudicator is present. No Contribution is a Project decision, and this
archive records no PD-003 V2 or PD-011 qualification claim.

The governing implementation identities and evidence paths are recorded in
`architecture/sem-archive-manifest.json`.
