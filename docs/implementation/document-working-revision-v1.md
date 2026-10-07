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
- `open({baseGenerationId, baseGenerationBodyDigest, nativeDocumentRef})`
- `get(revisionId)`
- `save({revisionId, expectedSaveSequence, content})`
- `abandon({revisionId, expectedSaveSequence})`

The caller chooses a stable revision ID for idempotent CREATE and subsequent
reload/GET. A different ID is a distinct working copy, not a new generation.
The existing bridge/archive origin and PRJ session/network capability checks
protect all operations. No separate database, pool, credential or local
body store is introduced.

Studio uses OPEN: the owner resolves the latest ACTIVE revision for the exact
logical document and immutable base generation, under a base/document lock.
Concurrent opens create at most one draft. Abandoned histories are excluded;
opening again creates a new draft, never resurrects the abandoned one.
Multiple ACTIVE copies created through explicit legacy CREATE IDs fail closed
with `DOC_REVISION_ACTIVE_CONFLICT` rather than selecting arbitrary content.
OPEN uses the existing table; no migration or new head/pointer store is added.

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
## Document Studio V1

The archive/history exposes an additional native-document selection and
"Ouvrir dans Studio" action. Existing file open/download/ZIP remain unchanged.
Routing uses the actual native document selector and exact generation/body
digest, not files or artifact IDs. The same view supports existing RECRUITMENT
and CRF native documents; no future kind ontology is introduced.

Studio edits native title, section headings and paragraph text. FACT/CITE-bearing
text is read-only in V1, displaying only already-bound native references.
References, open items and collection specifications remain read-only; all
other protected objects remain attached to the immutable source.

Explicit SAVE only: CLEAN/DIRTY/SAVING/SAVE_FAILED/CONFLICT are screen states.
Errors/conflicts keep the local buffer; an explicit confirmed reload replaces it
with the durable save, without merge. Navigation back from Studio requires a
dirty confirmation; browser reload/close uses beforeunload while dirty/saving.
Unsaved hard-reload recovery and unrelated host navigation are not guaranteed.
Reopening after reload resolves the exact saved ACTIVE draft through OPEN,
without localStorage or a session-body copy.

Comparison is textual, at title/section-heading/paragraph granularity: unchanged,
added (previously empty), removed (now empty), modified. No node insertion,
deletion, layout diff or scientific equivalence is claimed.
Abandon requires explicit confirmation; failed abandonment does not leave the
view or erase the buffer. Historical bases show a stale warning and retain their
bindings. All edits remain UNASSESSED.

No AI rewrite, provider call, classifier, propagation, publication, new
generation, adaptive portfolio or editor dependency is added.
Before any Preview hands-on Studio use, apply/verify migration 004 there.
Production migration/deployment is outside this implementation mission.
