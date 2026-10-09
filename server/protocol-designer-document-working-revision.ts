import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { JSONValue, Sql } from "postgres";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { DOCUMENT_WORKING_REVISION_CONTRACT, DocumentWorkingRevisionError, assertWorkingRevision, editableArchivedDocument,
  validateWorkingRevisionContent, workingRevisionContentDigest, type AbandonWorkingRevision, type CreateWorkingRevision,
  type ActiveWorkingRevision, type DocumentWorkingRevision, type DocumentWorkingRevisionResult, type OpenWorkingRevision, type SaveWorkingRevision } from "../src/features/document-projection/working-revision.js";
import type { DocumentArchiveAccess, DocumentArchiveStore } from "./protocol-designer-document-archive.js";
import { createRuntimeSchemaVerification } from "./protocol-designer-schema-compatibility.js";

export type DocumentWorkingRevisionStore = Readonly<{
  /** Server-only DOC compatibility check; never installs or repairs storage. */
  ensureStorage(access: DocumentArchiveAccess): Promise<void>;
  active(access: DocumentArchiveAccess): Promise<readonly ActiveWorkingRevision[]>;
  open(access: DocumentArchiveAccess, input: OpenWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  create(access: DocumentArchiveAccess, input: CreateWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  get(access: DocumentArchiveAccess, revisionId: string): Promise<DocumentWorkingRevisionResult>;
  getSave(access: DocumentArchiveAccess, input: { revisionId: string; saveSequence: number; contentDigest: string }): Promise<DocumentWorkingRevisionResult>;
  save(access: DocumentArchiveAccess, input: SaveWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  abandon(access: DocumentArchiveAccess, input: AbandonWorkingRevision): Promise<DocumentWorkingRevisionResult>;
  /** DOC-internal, after proven commit. Later saves are never consumed. */
  finalizeSave(access: DocumentArchiveAccess, input: AbandonWorkingRevision, finalizationRef: string): Promise<DocumentWorkingRevisionResult>;
}>;
type Ports = {
  sql: Sql; sha256(text: string): string; maxBodyBytes: number;
  authorize(access: DocumentArchiveAccess): Promise<{ sessionKey: string; projectId: string }>;
  readSource: DocumentArchiveStore["body"];
};
const validRef = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 600 && !value.includes("\u0000");
const request = (revisionId: unknown, expected?: unknown) => {
  if (!validRef(revisionId) || expected !== undefined && (!Number.isSafeInteger(expected) || Number(expected) < 1))
    throw new DocumentWorkingRevisionError("DOC_REVISION_REQUEST_INVALID", 400);
};
/** Uses the archive's connection, capability and native body reader. No second
 * storage subsystem, generation writer or scientific propagation port exists. */
export const migrateDocumentWorkingRevisions = async (sql: Sql) => {
  await sql.unsafe(readFileSync(join(dirname(fileURLToPath(import.meta.url)),
    "migrations", "004_doc_working_revision.sql"), "utf8"));
};

export const createDocumentWorkingRevisions = (ports: Ports): DocumentWorkingRevisionStore => {
  const { sql } = ports;
  const ready = createRuntimeSchemaVerification(sql, ["doc_working_revision"],
    "DOC_REVISION", code => new DocumentWorkingRevisionError(code, 503));
  const authorize = async (access: DocumentArchiveAccess) => {
    const scope = await ports.authorize(access);
    await ready();
    return scope;
  };
  const sourceFor = async (access: DocumentArchiveAccess, input: Pick<CreateWorkingRevision, "baseGenerationId" | "baseGenerationBodyDigest" | "nativeDocumentRef">) => {
    if (!validRef(input.baseGenerationId) || !validRef(input.nativeDocumentRef) || !/^[a-f0-9]{64}$/u.test(input.baseGenerationBodyDigest))
      throw new DocumentWorkingRevisionError("DOC_REVISION_REQUEST_INVALID", 400);
    const source = await ports.readSource(access, input.baseGenerationId);
    if (source.ref.bodySha256 !== input.baseGenerationBodyDigest)
      throw new DocumentWorkingRevisionError("DOC_REVISION_SOURCE_DIGEST_MISMATCH", 403);
    const projection = source.body.native.family === "DRCI"
      ? await ports.readSource(access, source.body.native.value.protocolProjectionId) : undefined;
    const document = editableArchivedDocument(source, input.nativeDocumentRef, projection);
    return { source, document };
  };
  const load = async (db: Sql, sessionKey: string, projectId: string, revisionId: string) => {
    const row = (await db`select revision from noxia_durable.doc_working_revision
      where session_key_hash = ${sessionKey} and project_id = ${projectId} and revision_id = ${revisionId}
      order by save_sequence desc limit 1`)[0];
    return row ? assertWorkingRevision(row.revision) : null;
  };
  const verify = async (access: DocumentArchiveAccess, revision: DocumentWorkingRevision) => {
    const base = await sourceFor(access, { ...revision, nativeDocumentRef: revision.identitySource.nativeDocumentRef });
    if (revision.project.projectId !== access.project.projectId || revision.provenance.sessionRef !== access.identity.sessionId
      || revision.logicalDocumentRef !== base.document.logicalDocumentRef
      || stableStringify(revision.project) !== stableStringify(base.document.project)
      || stableStringify(revision.identitySource) !== stableStringify(base.document.identitySource))
      throw new DocumentWorkingRevisionError("DOC_REVISION_SOURCE_BINDING_INVALID", 403);
    validateWorkingRevisionContent(revision.content, base.document.content);
    return base;
  };
  const resultFor = async (access: DocumentArchiveAccess, revision: DocumentWorkingRevision): Promise<DocumentWorkingRevisionResult> => {
    const { source } = await verify(access, revision);
    const sessionKey = ports.sha256(access.identity.sessionId);
    // Current means latest durably known state, not a browser's guessed version.
    // Historical source access remains permitted under the same PRJ capability.
    const latestProject = (await sql`select version_id, project_digest from noxia_durable.public_project_snapshot
      where session_key_hash = ${sessionKey} and project_id = ${access.project.projectId}
      order by (canonical_payload->>'revision')::bigint desc limit 1`)[0];
    const latestGeneration = (await sql`select generation_id from noxia_durable.doc_generation
      where session_key_hash = ${sessionKey} and project_id = ${access.project.projectId} and state = 'COMMITTED'
      and metadata->>'family' = ${source.ref.family} order by ordinal desc limit 1`)[0];
    const projectCurrent = revision.project.projectVersion === (latestProject?.version_id ?? access.project.versionId)
      && revision.project.projectDigest === (latestProject?.project_digest ?? access.project.projectDigest);
    const generationCurrent = latestGeneration?.generation_id === revision.baseGenerationId;
    return { revision, baseState: { sourceVerified: true, projectCurrent, generationCurrent, stale: !projectCurrent || !generationCurrent } };
  };
  const insert = async (db: Sql, sessionKey: string, revision: DocumentWorkingRevision) => {
    assertWorkingRevision(revision);
    if (Buffer.byteLength(JSON.stringify(revision), "utf8") > ports.maxBodyBytes)
      throw new DocumentWorkingRevisionError("DOC_REVISION_CONTENT_TOO_LARGE", 413);
    await db`insert into noxia_durable.doc_working_revision
      (session_key_hash, project_id, revision_id, save_sequence, base_generation_id, base_body_sha256, logical_document_ref, status, revision)
      values (${sessionKey}, ${revision.project.projectId}, ${revision.revisionId}, ${revision.saveSequence}, ${revision.baseGenerationId},
        ${revision.baseGenerationBodyDigest}, ${revision.logicalDocumentRef}, ${revision.status}, ${sql.json(revision as unknown as JSONValue)})`;
  };
  const locked = async <T>(access: DocumentArchiveAccess, revisionId: string, callback: (db: Sql, sessionKey: string) => Promise<T>) => {
    const { sessionKey, projectId } = await authorize(access);
    return sql.begin(async tx => {
      await tx`select pg_advisory_xact_lock(hashtext(${ports.sha256(stableStringify(["noxia:doc-working-revision", sessionKey, projectId, revisionId]))}))`;
      return callback(tx as unknown as Sql, sessionKey);
    });
  };
  const modify = async (access: DocumentArchiveAccess, input: AbandonWorkingRevision | SaveWorkingRevision, abandon: boolean, finalizationRef?: string) => {
    request(input.revisionId, input.expectedSaveSequence);
    // Verify the immutable base outside the write transaction: the archive's
    // existing reader uses the shared pool, never a nested connection under lock.
    const scope = await authorize(access);
    const observed = await load(sql, scope.sessionKey, scope.projectId, input.revisionId);
    if (!observed) throw new DocumentWorkingRevisionError("DOC_REVISION_NOT_FOUND", 404);
    const observedResult = await resultFor(access, observed);
    const revision = await locked(access, input.revisionId, async (db, sessionKey) => {
      const current = await load(db, sessionKey, access.project.projectId, input.revisionId);
      if (!current) throw new DocumentWorkingRevisionError("DOC_REVISION_NOT_FOUND", 404);
      if (current.saveSequence !== input.expectedSaveSequence) {
        if (finalizationRef) return current;
        throw new DocumentWorkingRevisionError("DOC_REVISION_SAVE_CONFLICT", 409);
      }
      if (stableStringify(current) !== stableStringify(observed)) throw new DocumentWorkingRevisionError("DOC_REVISION_SAVE_CONFLICT", 409);
      if (current.status === "ABANDONED") {
        if (abandon) return current;
        throw new DocumentWorkingRevisionError("DOC_REVISION_ABANDONED", 409);
      }
      const content = abandon ? current.content : validateWorkingRevisionContent((input as SaveWorkingRevision).content, current.content);
      const contentDigest = workingRevisionContentDigest(content);
      if (!abandon && contentDigest === current.contentDigest && stableStringify(content) === stableStringify(current.content)) return current;
      const next: DocumentWorkingRevision = { ...current, content, contentDigest, saveSequence: current.saveSequence + 1,
        status: abandon ? "ABANDONED" : "ACTIVE", updatedAt: new Date().toISOString(),
        provenance: { ...current.provenance, lastAction: finalizationRef ? "FINALIZE" : abandon ? "USER_ABANDON" : "USER_TEXT_EDIT",
          ...(finalizationRef ? { finalizationRef } : {}) } };
      await insert(db, sessionKey, next);
      return next;
    });
    return { ...observedResult, revision };
  };
  return {
    ensureStorage: async access => { await authorize(access); },
    async active(access) {
      const { sessionKey, projectId } = await authorize(access);
      // Latest save per revision first: an abandoned draft must never reappear.
      const rows = await sql`select revision from (
        select distinct on (revision_id) revision_id, save_sequence, status, revision
        from noxia_durable.doc_working_revision
        where session_key_hash = ${sessionKey} and project_id = ${projectId}
        order by revision_id, save_sequence desc
      ) active_drafts where status = 'ACTIVE' order by revision->>'updatedAt' desc limit 100`;
      return rows.map(row => {
        const revision = assertWorkingRevision(row.revision);
        return { revisionId: revision.revisionId, logicalDocumentRef: revision.logicalDocumentRef,
          baseGenerationId: revision.baseGenerationId, baseGenerationBodyDigest: revision.baseGenerationBodyDigest,
          nativeDocumentRef: revision.identitySource.nativeDocumentRef, saveSequence: revision.saveSequence, updatedAt: revision.updatedAt };
      });
    },
    async open(access, input) {
      // Exact native base + logical document, never a filename, browser cache or
      // G(n+1) guess. Serialize opens so concurrent tabs resume one ACTIVE draft.
      const { document } = await sourceFor(access, input);
      const revision = await locked(access, `base:${input.baseGenerationId}:${document.logicalDocumentRef}`, async (db, sessionKey) => {
        const active = await db`select revision from (
          select distinct on (revision_id) revision_id, save_sequence, status, revision
          from noxia_durable.doc_working_revision
          where session_key_hash = ${sessionKey} and project_id = ${access.project.projectId}
          and base_generation_id = ${input.baseGenerationId} and logical_document_ref = ${document.logicalDocumentRef}
          order by revision_id, save_sequence desc
        ) latest where status = 'ACTIVE' limit 2`;
        if (active.length > 1) throw new DocumentWorkingRevisionError("DOC_REVISION_ACTIVE_CONFLICT", 409);
        if (active[0]) return assertWorkingRevision(active[0].revision);
        const now = new Date().toISOString();
        const created: DocumentWorkingRevision = { contract: DOCUMENT_WORKING_REVISION_CONTRACT,
          revisionId: `document-working-revision:${randomUUID()}`, ...document,
          baseGenerationId: input.baseGenerationId, baseGenerationBodyDigest: input.baseGenerationBodyDigest,
          contentDigest: workingRevisionContentDigest(document.content), saveSequence: 1, status: "ACTIVE", createdAt: now, updatedAt: now,
          provenance: { origin: "ARCHIVED_NATIVE_DOCUMENT", sessionRef: access.identity.sessionId, lastAction: "CREATE", semanticImpact: "UNASSESSED" },
          boundary: "NOT_PROJECT_TRUTH_NOT_GENERATED_DOCUMENT" };
        await insert(db, sessionKey, created);
        return created;
      });
      return resultFor(access, revision);
    },
    async create(access, input) {
      request(input.revisionId);
      const { document } = await sourceFor(access, input);
      const now = new Date().toISOString();
      const value: DocumentWorkingRevision = { contract: DOCUMENT_WORKING_REVISION_CONTRACT, revisionId: input.revisionId,
        ...document, baseGenerationId: input.baseGenerationId, baseGenerationBodyDigest: input.baseGenerationBodyDigest,
        contentDigest: workingRevisionContentDigest(document.content), saveSequence: 1, status: "ACTIVE", createdAt: now, updatedAt: now,
        provenance: { origin: "ARCHIVED_NATIVE_DOCUMENT", sessionRef: access.identity.sessionId, lastAction: "CREATE", semanticImpact: "UNASSESSED" },
        boundary: "NOT_PROJECT_TRUTH_NOT_GENERATED_DOCUMENT" };
      const observedResult = await resultFor(access, value);
      const revision = await locked(access, input.revisionId, async (db, sessionKey) => {
        const current = await load(db, sessionKey, access.project.projectId, input.revisionId);
        if (current) {
          if (current.baseGenerationId !== input.baseGenerationId || current.baseGenerationBodyDigest !== input.baseGenerationBodyDigest
            || current.logicalDocumentRef !== document.logicalDocumentRef
            || stableStringify(current.project) !== stableStringify(document.project)
            || stableStringify(current.identitySource) !== stableStringify(document.identitySource)
            || current.provenance.sessionRef !== access.identity.sessionId) throw new DocumentWorkingRevisionError("DOC_REVISION_CREATE_DIVERGENCE", 409);
          validateWorkingRevisionContent(current.content, document.content);
          if (current.status === "ABANDONED") throw new DocumentWorkingRevisionError("DOC_REVISION_ABANDONED", 409);
          return current;
        }
        await insert(db, sessionKey, value);
        return value;
      });
      return { ...observedResult, revision };
    },
    async get(access, revisionId) {
      request(revisionId);
      const { sessionKey, projectId } = await authorize(access);
      const current = await load(sql, sessionKey, projectId, revisionId);
      if (!current) throw new DocumentWorkingRevisionError("DOC_REVISION_NOT_FOUND", 404);
      return resultFor(access, current);
    },
    async getSave(access, input) {
      request(input.revisionId, input.saveSequence);
      const { sessionKey, projectId } = await authorize(access);
      const row = (await sql`select revision from noxia_durable.doc_working_revision
        where session_key_hash = ${sessionKey} and project_id = ${projectId} and revision_id = ${input.revisionId}
        and save_sequence = ${input.saveSequence}`)[0];
      if (!row) throw new DocumentWorkingRevisionError("DOC_REVISION_SAVE_NOT_FOUND", 404);
      const revision = assertWorkingRevision(row.revision);
      if (revision.revisionId !== input.revisionId || revision.saveSequence !== input.saveSequence
        || revision.contentDigest !== input.contentDigest)
        throw new DocumentWorkingRevisionError("DOC_REVISION_SAVE_BINDING_INVALID", 403);
      return resultFor(access, revision);
    },
    save: (access, input) => modify(access, input, false),
    abandon: (access, input) => modify(access, input, true),
    finalizeSave: (access, input, finalizationRef) => {
      if (!/^studio-finalization-intent:ke1-[a-f0-9]{16}$/u.test(finalizationRef)) throw new DocumentWorkingRevisionError("DOC_REVISION_REQUEST_INVALID", 400);
      return modify(access, input, true, finalizationRef);
    },
  };
};
