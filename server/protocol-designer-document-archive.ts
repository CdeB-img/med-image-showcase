import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres, { type Sql } from "postgres";
import { logicalDigest, stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { DOC_ARCHIVE_CONTRACT, DOC_HISTORY_PAGE_SIZE, documentFileManifest, documentNativeGeneratedAt, documentNativeIdentity,
  documentNativePredecessor, documentNativeProject, type DocumentGenerationBody, type DocumentGenerationRef,
  type DocumentHistoryPage, type DocumentPersistenceReceipt } from "../src/features/document-projection/generation-persistence.js";
import type { ProjectSnapshotIdentity, ProjectSnapshotRef, ProtocolDesignerProjectSnapshotStore } from "./protocol-designer-project-snapshot.js";

export const docSha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
/** Project-scoped transaction identity: request IDs belong to idempotence,
 * not locking. Canonical tuple + existing SHA-256 keeps PostgreSQL TEXT safe. */
export const documentArchiveProjectLockIdentity = (sessionKey: string, projectId: string) =>
  docSha256(stableStringify(["noxia:doc-archive-project", sessionKey, projectId]));
export class DocumentArchiveError extends Error {
  constructor(readonly code: string, readonly status: 400 | 403 | 404 | 409 | 413 | 429 | 503 = 409) { super(code); }
}
export type DocumentArchiveCapacity = Readonly<{
  maxGenerationsPerProject: number; maxTotalDocBytesPerProject: number;
  maxBodyBytesPerGeneration: number; maxConcurrentDocWrites: number;
}>;
/** Conservative technical defaults, overridable in each environment; no scientific/business quota. */
export const documentArchiveCapacity = (env: Record<string, string | undefined>): DocumentArchiveCapacity => {
  const read = (name: string, fallback: number) => {
    if (env[name] === undefined) return fallback;
    const value = Number(env[name]);
    if (!Number.isSafeInteger(value) || value < 1) throw new DocumentArchiveError("DOC_ARCHIVE_CAPACITY_CONFIG_INVALID", 503);
    return value;
  };
  return {
    maxGenerationsPerProject: read("NOXIA_DOC_MAX_GENERATIONS_PER_PROJECT", 1000),
    maxTotalDocBytesPerProject: read("NOXIA_DOC_MAX_TOTAL_BYTES_PER_PROJECT", 4 * 1024 ** 3),
    maxBodyBytesPerGeneration: read("NOXIA_DOC_MAX_BODY_BYTES_PER_GENERATION", 4_000_000),
    maxConcurrentDocWrites: read("NOXIA_DOC_MAX_CONCURRENT_WRITES", 2),
  };
};
export type DocumentArchiveAccess = Readonly<{ identity: ProjectSnapshotIdentity; project: ProjectSnapshotRef; proof: string | null }>;
export type DocumentArchiveIntent = Readonly<{ requestId: string; requestSha256: string; generatedAt: string; reservedBytes: number }>;
export type AdmittedDocumentIntent = DocumentArchiveIntent & Readonly<{ receipt: DocumentPersistenceReceipt | null }>;
export type DocumentArchiveStore = Readonly<{
  admit(access: DocumentArchiveAccess, intent: DocumentArchiveIntent): Promise<AdmittedDocumentIntent>;
  commit(access: DocumentArchiveAccess, requestId: string, body: DocumentGenerationBody): Promise<DocumentPersistenceReceipt>;
  receipt(access: DocumentArchiveAccess, requestId: string): Promise<DocumentPersistenceReceipt | null>;
  history(access: DocumentArchiveAccess, beforeOrdinal?: number): Promise<DocumentHistoryPage>;
  body(access: DocumentArchiveAccess, generationId: string): Promise<{ ref: DocumentGenerationRef; body: DocumentGenerationBody }>;
  reject(access: DocumentArchiveAccess, requestId: string): Promise<void>;
}>;
const string = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
export const assertDocumentArchiveBody = (body: DocumentGenerationBody, projectId: string) => {
  if (!body || body.contract !== DOC_ARCHIVE_CONTRACT || !body.native
    || !["DRCI", "TEMPLATE"].includes(body.native.family) || !body.native.value
    || !Array.isArray(body.files) || !string(body.rendererVersion, 120)
    || !(body.buildCommit === null || /^[a-f0-9]{40}$/u.test(body.buildCommit))) throw new DocumentArchiveError("DOC_ARCHIVE_BODY_INVALID", 400);
  const native = body.native;
  const binding = documentNativeProject(native);
  if (!binding || binding.projectId !== projectId || !string(binding.projectVersion, 360)
    || !binding.projectVersion.startsWith(`${projectId}:version:`) || !string(binding.projectDigest, 80)) {
    throw new DocumentArchiveError("DOC_ARCHIVE_PROJECT_BINDING_INVALID", 403);
  }
  if (native.family === "DRCI") {
    const { packDigest, ...material } = native.value;
    if (native.value.contract !== "DRCI_DRAFT_PACK_V1" || native.value.projectWriteAuthorized !== false
      || !Array.isArray(native.value.documents) || packDigest !== logicalDigest(material)) {
      throw new DocumentArchiveError("DOC_ARCHIVE_NATIVE_DIGEST_INVALID", 409);
    }
  } else if (!Array.isArray(native.value.sections) || !string(native.value.seriesId, 320)
    || native.value.projectionId !== `document-projection:${native.value.projectionDigest}`
    || native.value.boundary !== "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL") {
    throw new DocumentArchiveError("DOC_ARCHIVE_NATIVE_IDENTITY_INVALID", 409);
  }
  if (!string(documentNativeIdentity(native), 600) || !Number.isFinite(Date.parse(documentNativeGeneratedAt(native)))) {
    throw new DocumentArchiveError("DOC_ARCHIVE_NATIVE_IDENTITY_INVALID", 400);
  }
  const keys = new Set<string>();
  for (const file of body.files) {
    const key = `${file.artifactId}\u0000${file.fileName}`;
    if (!string(file.artifactId, 600) || !string(file.fileName, 240) || /[/\\]/u.test(file.fileName) || file.fileName.includes("\u0000")
      || !["HTML", "MARKDOWN", "CSV", "JSON"].includes(file.format) || !string(file.mimeType, 120)
      || file.renderOrigin !== "GENERATION_TIME" || typeof file.content !== "string"
      || file.byteLength !== Buffer.byteLength(file.content, "utf8") || file.sha256 !== docSha256(file.content)
      || keys.has(key)) throw new DocumentArchiveError("DOC_ARCHIVE_ARTIFACT_INVALID", 409);
    keys.add(key);
  }
};
export const migrateDocumentArchive = async (sql: Sql) => {
  await sql.unsafe(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "migrations", "002_doc_generation_archive.sql"), "utf8"));
  await sql.unsafe(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "migrations", "003_doc_archive_terminal_reservations.sql"), "utf8"));
};

export const createPostgresDocumentArchive = (connection: string, snapshots: Pick<ProtocolDesignerProjectSnapshotStore, "resolve">,
  capacity: DocumentArchiveCapacity, suppliedSql?: Sql): DocumentArchiveStore => {
  const sql = suppliedSql ?? postgres(connection, { max: 2, idle_timeout: 20, connect_timeout: 15, prepare: false });
  let schemaReady: Promise<void> | null = null;
  const ready = () => schemaReady ??= migrateDocumentArchive(sql).catch(error => { schemaReady = null; throw error; });
  const authorize = async (access: DocumentArchiveAccess) => {
    // Reuse PRJ's exact capability, version/digest, session and network checks.
    // DOC does not infer any authority from provider/economic evidence.
    await snapshots.resolve(access.identity, access.project, access.proof);
    await ready();
    return { sessionKey: docSha256(access.identity.sessionId), projectId: access.project.projectId };
  };
  const receiptFor = (row: Record<string, unknown>): DocumentPersistenceReceipt | null => row.state === "COMMITTED"
    ? { contract: DOC_ARCHIVE_CONTRACT, requestId: String(row.request_id), generation: row.metadata as DocumentGenerationRef } : null;
  return {
    async admit(access, intent) {
      if (!string(intent.requestId, 600) || !/^[a-f0-9]{64}$/u.test(intent.requestSha256)
        || !Number.isFinite(Date.parse(intent.generatedAt)) || !Number.isSafeInteger(intent.reservedBytes) || intent.reservedBytes < 1) {
        throw new DocumentArchiveError("DOC_ARCHIVE_INTENT_INVALID", 400);
      }
      const { sessionKey, projectId } = await authorize(access);
      return sql.begin(async tx => {
        await tx`select pg_advisory_xact_lock(hashtext('noxia:doc-archive-write-capacity'))`;
        await tx`select pg_advisory_xact_lock(hashtext(${documentArchiveProjectLockIdentity(sessionKey, projectId)}))`;
        const rows = await tx`select * from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId} and request_id = ${intent.requestId}`;
        if (rows[0]) {
          const row = rows[0];
          if (row.state === "REJECTED") throw new DocumentArchiveError("DOC_ARCHIVE_INTENT_TERMINAL");
          if (row.request_sha256 !== intent.requestSha256 || Number(row.reserved_bytes) !== intent.reservedBytes) {
            throw new DocumentArchiveError("DOC_ARCHIVE_REQUEST_DIVERGENCE");
          }
          return { ...intent, generatedAt: String(row.generated_at), receipt: receiptFor(row) };
        }
        const stats = (await tx`select count(*) filter (where state != 'REJECTED')::int as generations, coalesce(sum(case when state = 'COMMITTED' then body_bytes when state = 'RESERVED' then reserved_bytes else 0 end), 0)::text as bytes,
          count(*) filter (where state = 'RESERVED')::int as writes, coalesce(max(ordinal), 0)::text as last_ordinal
          from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId}`)[0];
        if (Number(stats.generations) >= capacity.maxGenerationsPerProject || intent.reservedBytes > capacity.maxBodyBytesPerGeneration
          || Number(stats.bytes) + intent.reservedBytes > capacity.maxTotalDocBytesPerProject) throw new DocumentArchiveError("DOC_ARCHIVE_CAPACITY_EXCEEDED", 413);
        const globalWrites = (await tx`select count(*)::int as active_writes from noxia_durable.doc_generation where state = 'RESERVED'`)[0];
        if (Number(globalWrites.active_writes) >= capacity.maxConcurrentDocWrites) throw new DocumentArchiveError("DOC_ARCHIVE_WRITE_CAPACITY_EXCEEDED", 429);
        await tx`insert into noxia_durable.doc_generation (session_key_hash, project_id, request_id, request_sha256, generated_at, reserved_bytes, state, ordinal)
          values (${sessionKey}, ${projectId}, ${intent.requestId}, ${intent.requestSha256}, ${intent.generatedAt}, ${intent.reservedBytes}, 'RESERVED', ${Number(stats.last_ordinal) + 1})`;
        return { ...intent, receipt: null };
      });
    },
    async commit(access, requestId, body) {
      const { sessionKey, projectId } = await authorize(access);
      assertDocumentArchiveBody(body, projectId);
      const bodyText = JSON.stringify(body), hash = docSha256(bodyText), bytes = Buffer.byteLength(bodyText, "utf8");
      const generationId = documentNativeIdentity(body.native);
      return sql.begin(async tx => {
        await tx`select pg_advisory_xact_lock(hashtext(${documentArchiveProjectLockIdentity(sessionKey, projectId)}))`;
        const row = (await tx`select * from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId} and request_id = ${requestId}`)[0];
        if (!row) throw new DocumentArchiveError("DOC_ARCHIVE_INTENT_NOT_FOUND", 404);
        if (row.state === "REJECTED") throw new DocumentArchiveError("DOC_ARCHIVE_INTENT_TERMINAL");
        const existing = receiptFor(row);
        if (existing) {
          if (existing.generation.bodySha256 !== hash || existing.generation.generationId !== generationId) throw new DocumentArchiveError("DOC_ARCHIVE_CONTENT_DIVERGENCE");
          return existing;
        }
        if (documentNativeGeneratedAt(body.native) !== row.generated_at) throw new DocumentArchiveError("DOC_ARCHIVE_GENERATION_TIME_DIVERGENCE");
        if (bytes > Number(row.reserved_bytes) || bytes > capacity.maxBodyBytesPerGeneration) throw new DocumentArchiveError("DOC_ARCHIVE_BODY_TOO_LARGE", 413);
        const collision = (await tx`select body_sha256 from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId}
          and generation_id = ${generationId} and state = 'COMMITTED'`)[0];
        if (collision) throw new DocumentArchiveError(collision.body_sha256 === hash ? "DOC_ARCHIVE_GENERATION_ALREADY_COMMITTED" : "DOC_ARCHIVE_CONTENT_DIVERGENCE");
        const prior = (await tx`select generation_id from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId}
          and state = 'COMMITTED' order by ordinal desc limit 1`)[0];
        const labels = (await tx`select coalesce(max((metadata->>'displayVersion')::int), 0)::int as last_label from noxia_durable.doc_generation
          where session_key_hash = ${sessionKey} and project_id = ${projectId} and state = 'COMMITTED' and metadata->>'family' = ${body.native.family}`)[0];
        const ref: DocumentGenerationRef = { contract: DOC_ARCHIVE_CONTRACT, generationId, family: body.native.family,
          project: documentNativeProject(body.native), ordinal: Number(row.ordinal), displayVersion: Number(labels.last_label) + 1,
          generatedAt: String(row.generated_at), predecessorId: documentNativePredecessor(body.native) ?? (prior ? String(prior.generation_id) : null),
          bodySha256: hash, bodyBytes: bytes, files: body.files.map(documentFileManifest), persistenceState: "COMMITTED" };
        await tx`insert into noxia_durable.doc_generation_body (session_key_hash, project_id, request_id, native_body_text, body_sha256)
          values (${sessionKey}, ${projectId}, ${requestId}, ${bodyText}, ${hash})`;
        await tx`update noxia_durable.doc_generation set state = 'COMMITTED', generation_id = ${generationId}, body_sha256 = ${hash}, body_bytes = ${bytes}, metadata = ${sql.json(ref as unknown as postgres.JSONValue)}
          where session_key_hash = ${sessionKey} and project_id = ${projectId} and request_id = ${requestId}`;
        return { contract: DOC_ARCHIVE_CONTRACT, requestId, generation: ref };
      });
    },
    async receipt(access, requestId) {
      const { sessionKey, projectId } = await authorize(access);
      const row = (await sql`select request_id, state, metadata from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId} and request_id = ${requestId}`)[0];
      return row ? receiptFor(row) : null;
    },
    async history(access, beforeOrdinal) {
      const { sessionKey, projectId } = await authorize(access);
      if (beforeOrdinal !== undefined && (!Number.isSafeInteger(beforeOrdinal) || beforeOrdinal < 1)) throw new DocumentArchiveError("DOC_ARCHIVE_CURSOR_INVALID", 400);
      const rows = await sql`select metadata from noxia_durable.doc_generation where session_key_hash = ${sessionKey} and project_id = ${projectId}
        and state = 'COMMITTED' and ordinal < ${beforeOrdinal ?? Number.MAX_SAFE_INTEGER} order by ordinal desc limit ${DOC_HISTORY_PAGE_SIZE + 1}`;
      const entries = rows.slice(0, DOC_HISTORY_PAGE_SIZE).map(row => row.metadata as DocumentGenerationRef);
      return { entries, nextBeforeOrdinal: rows.length > DOC_HISTORY_PAGE_SIZE ? entries.at(-1)!.ordinal : null };
    },
    async body(access, generationId) {
      const { sessionKey, projectId } = await authorize(access);
      const row = (await sql`select g.metadata, b.native_body_text, b.body_sha256 from noxia_durable.doc_generation g
        join noxia_durable.doc_generation_body b using (session_key_hash, project_id, request_id)
        where g.session_key_hash = ${sessionKey} and g.project_id = ${projectId} and g.generation_id = ${generationId} and g.state = 'COMMITTED'`)[0];
      if (!row) throw new DocumentArchiveError("DOC_ARCHIVE_GENERATION_NOT_FOUND", 404);
      const ref = row.metadata as DocumentGenerationRef;
      const text = String(row.native_body_text);
      if (docSha256(text) !== ref.bodySha256 || row.body_sha256 !== ref.bodySha256 || Buffer.byteLength(text, "utf8") !== ref.bodyBytes) {
        throw new DocumentArchiveError("DOC_ARCHIVE_BODY_CORRUPT", 503);
      }
      const body = JSON.parse(text) as DocumentGenerationBody;
      assertDocumentArchiveBody(body, projectId);
      return { ref, body };
    },
    async reject(access, requestId) {
      const { sessionKey, projectId } = await authorize(access);
      await sql.begin(async tx => {
        await tx`select pg_advisory_xact_lock(hashtext(${documentArchiveProjectLockIdentity(sessionKey, projectId)}))`;
        await tx`update noxia_durable.doc_generation set state = 'REJECTED'
          where session_key_hash = ${sessionKey} and project_id = ${projectId} and request_id = ${requestId} and state = 'RESERVED'`;
      });
    },
  };
};
