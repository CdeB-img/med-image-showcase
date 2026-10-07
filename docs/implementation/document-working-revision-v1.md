# Document Working Revision V1 — implementation contract

DOC-owned working state downstream of the golden generation/archive corridor.
This implementation note is not a new documentary authority.

## Identity and editable boundary

`logicalDocumentRef` derives from the existing `DocumentProjection.seriesId`,
optional `documentDefinition.documentId`, and the selected native document role.
It does not derive from filenames, formats, artifact IDs or generation IDs.
The current producer remains TEMPLATE/DRCI; the revision selector is an open
string identifying an actually present native document, not a new kind registry.

CREATE verifies archived native bytes/SHA-256, native generation/Project binding,
and (for DRCI) the archived source projection and authorized handoff digest.
The source Project identity/version/digest, generation and body SHA-256 never
change. Native TEMPLATE anchors are reused. DRCI paragraphs lack native IDs:
their anchors are stable positions **within this immutable base only**.

V1 permits title, section-heading and paragraph/block-text edits only.
Node identity/order/cardinality, provenance and ordered FACT/CITE bindings are
protected. Tables, missing-elements lists, facts, citations, CRF objects and other
non-editable metadata remain in the referenced immutable native body.
No HTML or Markdown is parsed. A preserved fact/citation binding is not a
certificate of scientific equivalence of modified prose.

Every edit is `UNASSESSED`, `NOT_PROJECT_TRUTH_NOT_GENERATED_DOCUMENT`.
No Project propagation, publication, provider call, new generation or rendering
is available from this primitive.

## Durable operations

Use `createDocumentArchiveClient(sessionId, project).workingRevisions`:

- `create({revisionId, baseGenerationId, baseGenerationBodyDigest, nativeDocumentRef})`
- `get(revisionId)`
- `save({revisionId, expectedSaveSequence, content})`
- `abandon({revisionId, expectedSaveSequence})`

The caller chooses a stable revision ID for idempotent CREATE and subsequent
reload/GET. A different ID is a distinct working copy, not a new generation.
The existing bridge/archive origin and PRJ session/network capability checks
protect all four operations. No separate database, pool, credential or local
body store is introduced.

Migration `004_doc_working_revision.sql` is additive. It creates one DOC table,
with append-only confirmed saves, exact source-generation FK and UPDATE/DELETE
rejection. It runs lazily on revision operations using the archive's shared SQL
connection. It does not modify golden generation/body tables.

SAVE compares the exact expected sequence under a revision-scoped transaction
lock. Stale writers receive `DOC_REVISION_SAVE_CONFLICT` (409), including stale
unchanged writes. Identical current content is a noop, including timestamps.
Read-only base verification precedes the transaction so the existing small pool
cannot deadlock through nested source-reader connections.
Failed writes roll back; confirmed prior rows remain intact.
ABANDON appends `ABANDONED`, keeps provenance/history and forbids later SAVE.
GET still returns abandoned history; callers must not display it as active.

`baseState` reports source verification and whether the base matches the latest
durably known Project snapshot and generation in its native family. Historical
editing remains allowed, with `stale=true`; nothing silently rebases.
This does not infer changes that have not reached the durable Project owner.

## Qualification boundary

Native PRJ/DOC builders with existing scientific fixtures qualify persistence,
integrity, concurrency and genericity (including existing RECRUITMENT).
The SQL boundary double exercises actual owner transactions/rollback, not a
live PostgreSQL installation. Migration application in an environment remains
a later deployment/integration gate; this mission performs no real DB write.
No Studio UI, semantic classifier, publication or adaptive portfolio is added.
