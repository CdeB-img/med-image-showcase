import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { humanDecisionEnvelopeSchema } from "../src/features/protocol-designer/human-decision.js";
import { researchProjectOwnerDigest, type ResearchProjectOwnerProjection } from "../src/features/research-project-construction/contribution-owner-boundary.js";

/** Separate, non-provider upload. Ten times the observed 259 kB Project fits below this bound. */
export const PROJECT_SNAPSHOT_MAX_BYTES = 4_000_000;
export type ProjectSnapshotRef = Readonly<{ projectId: string; versionId: string; projectDigest: string }>;
export type ProjectSnapshotIdentity = Readonly<{ sessionId: string; clientAddress: string }>;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown, max = 320): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const sameHash = (left: string, right: string) => {
  if (!/^[a-f0-9]{64}$/u.test(left) || !/^[a-f0-9]{64}$/u.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
};

export class ProjectSnapshotError extends Error {
  constructor(readonly code: string, readonly status: 400 | 403 | 404 | 409 | 413 | 503 = 409) {
    super(code);
  }
}

export const parseProjectSnapshotRef = (value: unknown): ProjectSnapshotRef => {
  if (!record(value) || Object.keys(value).sort().join(",") !== "projectDigest,projectId,versionId"
    || !nonempty(value.projectId, 320) || !nonempty(value.versionId, 360)
    || !nonempty(value.projectDigest, 80)) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_REF_INVALID", 400);
  return { projectId: value.projectId, versionId: value.versionId, projectDigest: value.projectDigest };
};

/** Verify the PRJ owner's exact digest input, not a browser assertion or a derived Chat projection. */
export const parseVerifiedProjectSnapshot = (value: unknown, sessionId: string): ResearchProjectOwnerProjection => {
  if (!record(value) || !nonempty(sessionId, 240)
    || value.contract !== "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION"
    || value.owner !== "RESEARCH_PROJECT" || value.llmProjectWrites !== 0
    || !nonempty(value.projectId, 320) || value.projectId !== `${sessionId}:research-project`
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1
    || value.versionId !== `${value.projectId}:version:${value.revision}`
    || value.previousVersionId !== (value.revision === 1 ? null : `${value.projectId}:version:${Number(value.revision) - 1}`)
    || !nonempty(value.projectDigest, 80) || !nonempty(value.contributionDigest, 80)
    || !record(value.appliedChangeSet) || !Array.isArray(value.sections)
    || !record(value.canonicalState) || value.canonicalState.projectId !== value.projectId
    || value.canonicalState.currentVersionId !== value.versionId
    || value.canonicalState.revision !== value.revision
    || !Array.isArray(value.canonicalState.objects) || !Array.isArray(value.canonicalState.relations)
    || !Array.isArray(value.canonicalState.versionHistory)
    || !record(value.confirmationDecision)
    || !humanDecisionEnvelopeSchema.safeParse(value.confirmationDecision).success
    || value.confirmationDecision.status !== "ADOPTED"
    || value.confirmationDecision.projectVersion !== value.versionId) {
    throw new ProjectSnapshotError("PROJECT_SNAPSHOT_CANONICAL_INVALID", 400);
  }
  const project = value as ResearchProjectOwnerProjection;
  if (researchProjectOwnerDigest(project) !== project.projectDigest) {
    throw new ProjectSnapshotError("PROJECT_SNAPSHOT_DIGEST_MISMATCH", 409);
  }
  return project;
};

export const migrateProtocolDesignerProjectSnapshots = async (sql: Sql) => {
  await sql`create schema if not exists noxia_durable`;
  await sql`
    create table if not exists noxia_durable.public_project_snapshot (
      session_key_hash text not null,
      client_key_hash text not null,
      project_id text not null,
      version_id text not null,
      project_digest text not null,
      payload_sha256 text not null,
      canonical_payload jsonb not null,
      access_proof_hash text not null,
      created_at timestamptz not null default now(),
      primary key (session_key_hash, project_id, version_id)
    )
  `;
};

export const createPostgresProjectSnapshotStore = (connectionString: string) => {
  const sql = postgres(connectionString, { max: 2, idle_timeout: 20, connect_timeout: 15, prepare: false });
  let schemaReady: Promise<void> | null = null;
  const ready = () => {
    schemaReady ??= migrateProtocolDesignerProjectSnapshots(sql).catch((error) => {
      schemaReady = null;
      throw error;
    });
    return schemaReady;
  };
  const keys = (identity: ProjectSnapshotIdentity) => {
    if (!nonempty(identity.sessionId, 240) || !nonempty(identity.clientAddress, 240)) {
      throw new ProjectSnapshotError("PROJECT_SNAPSHOT_SESSION_REQUIRED", 400);
    }
    return { sessionKey: sha256(identity.sessionId), clientKey: sha256(identity.clientAddress) };
  };
  const assertBound = (identity: ProjectSnapshotIdentity, ref: ProjectSnapshotRef) => {
    if (ref.projectId !== `${identity.sessionId}:research-project`) {
      throw new ProjectSnapshotError("PROJECT_SNAPSHOT_SESSION_MISMATCH", 403);
    }
    if (!/^.+:version:[1-9]\d*$/u.test(ref.versionId) || !ref.versionId.startsWith(`${ref.projectId}:version:`)) {
      throw new ProjectSnapshotError("PROJECT_SNAPSHOT_VERSION_MISMATCH", 409);
    }
  };
  const assertAccess = (row: Record<string, unknown>, clientKey: string, proof: string | null) => {
    if (row.client_key_hash !== clientKey || !proof || !sameHash(String(row.access_proof_hash), sha256(proof))) {
      throw new ProjectSnapshotError("PROJECT_SNAPSHOT_SESSION_MISMATCH", 403);
    }
  };
  return {
    async persist(identity: ProjectSnapshotIdentity, payload: unknown, proof: string | null): Promise<{ ref: ProjectSnapshotRef; proof: string }> {
      const serialized = JSON.stringify(payload);
      if (!serialized || Buffer.byteLength(serialized) > PROJECT_SNAPSHOT_MAX_BYTES) {
        throw new ProjectSnapshotError("PROJECT_SNAPSHOT_TOO_LARGE", 413);
      }
      const project = parseVerifiedProjectSnapshot(payload, identity.sessionId);
      const ref = { projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest };
      assertBound(identity, ref);
      const { sessionKey, clientKey } = keys(identity);
      const payloadHash = sha256(stableStringify(project));
      await ready();
      const issuedProof = proof ?? randomBytes(32).toString("base64url");
      const accessHash = sha256(issuedProof);
      return sql.begin(async (tx) => {
        // Serialize creation of a session/Project capability without changing any existing snapshot.
        await tx`select pg_advisory_xact_lock(hashtext(${sha256(`${sessionKey}\u0000${ref.projectId}`)}))`;
        const roots = await tx`
          select client_key_hash, access_proof_hash from noxia_durable.public_project_snapshot
          where session_key_hash = ${sessionKey} and project_id = ${ref.projectId} limit 1
        `;
        if (roots[0]) assertAccess(roots[0], clientKey, proof);
        else if (proof) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_NOT_FOUND", 404);
        const existing = await tx`
          select project_digest, payload_sha256 from noxia_durable.public_project_snapshot
          where session_key_hash = ${sessionKey} and project_id = ${ref.projectId} and version_id = ${ref.versionId}
        `;
        if (existing[0]) {
          if (existing[0].project_digest !== ref.projectDigest || existing[0].payload_sha256 !== payloadHash) {
            throw new ProjectSnapshotError("PROJECT_SNAPSHOT_VERSION_CONFLICT", 409);
          }
        } else {
          await tx`
            insert into noxia_durable.public_project_snapshot
              (session_key_hash, client_key_hash, project_id, version_id, project_digest,
                payload_sha256, canonical_payload, access_proof_hash)
            values (${sessionKey}, ${clientKey}, ${ref.projectId}, ${ref.versionId}, ${ref.projectDigest},
              ${payloadHash}, ${sql.json(project)}, ${accessHash})
          `;
        }
        return { ref, proof: issuedProof };
      });
    },
    async resolve(identity: ProjectSnapshotIdentity, ref: ProjectSnapshotRef, proof: string | null): Promise<ResearchProjectOwnerProjection> {
      assertBound(identity, ref);
      const { sessionKey, clientKey } = keys(identity);
      await ready();
      const rows = await sql`
        select client_key_hash, access_proof_hash, project_digest, payload_sha256, canonical_payload
        from noxia_durable.public_project_snapshot
        where session_key_hash = ${sessionKey} and project_id = ${ref.projectId} and version_id = ${ref.versionId}
      `;
      if (!rows[0]) {
        const root = await sql`
          select 1 from noxia_durable.public_project_snapshot
          where session_key_hash = ${sessionKey} and project_id = ${ref.projectId} limit 1
        `;
        throw new ProjectSnapshotError(root[0] ? "PROJECT_SNAPSHOT_VERSION_MISMATCH" : "PROJECT_SNAPSHOT_NOT_FOUND", root[0] ? 409 : 404);
      }
      const row = rows[0];
      assertAccess(row, clientKey, proof);
      if (row.project_digest !== ref.projectDigest) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_DIGEST_MISMATCH", 409);
      const project = parseVerifiedProjectSnapshot(row.canonical_payload, identity.sessionId);
      if (sha256(stableStringify(project)) !== row.payload_sha256 || project.projectDigest !== row.project_digest) {
        throw new ProjectSnapshotError("PROJECT_SNAPSHOT_STORE_CORRUPT", 503);
      }
      return project;
    },
    close: () => sql.end({ timeout: 5 }),
  };
};

export type ProtocolDesignerProjectSnapshotStore = ReturnType<typeof createPostgresProjectSnapshotStore>;
const shared = new Map<string, ProtocolDesignerProjectSnapshotStore>();
export const sharedPostgresProjectSnapshotStore = (connectionString: string) => {
  const key = sha256(connectionString);
  const current = shared.get(key);
  if (current) return current;
  const created = createPostgresProjectSnapshotStore(connectionString);
  shared.set(key, created);
  return created;
};
