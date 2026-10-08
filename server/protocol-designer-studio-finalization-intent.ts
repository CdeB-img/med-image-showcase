import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Sql } from "postgres";
import { logicalDigest, stableStringify } from "../src/features/knowledge-engine/canonical.js";
import { createStudioReconciliationRequest, buildStudioReconciliationPlan } from "../src/features/document-projection/studio-reconciliation.js";
import { StudioFinalizationIntentError, assertStudioIntent, assertStudioIntentSave, createStudioFinalizationIntent,
  assessStudioIntent, linkStudioIntentPreparation, resolveStudioIntentAdoption, resumeStudioIntent, transitionStudioIntent,
  type StudioFinalizationIntent, type StudioFinalizationFrozenInput, type StudioFinalizationHumanDecision } from "../src/features/document-projection/studio-finalization-intent.js";
import type { StudioScientificAssessment } from "../src/features/scientific-thinking/studio-contribution.js";
import type { WorkingDraftPreparation } from "../src/features/protocol-designer/functional-reset/project-preparation-contract.js";
import type { ResearchProjectOwnerProjection } from "../src/features/research-project-construction/contribution-owner-boundary.js";
import type { DocumentArchiveStore, DocumentArchiveAccess } from "./protocol-designer-document-archive.js";
import type { DocumentWorkingRevisionStore } from "./protocol-designer-document-working-revision.js";

export type StudioFinalizationIntentStore = Readonly<{
  create(access: DocumentArchiveAccess, frozen: StudioFinalizationFrozenInput): Promise<StudioFinalizationIntent>;
  get(access: DocumentArchiveAccess, intentId: string): Promise<StudioFinalizationIntent>;
  recoverForSave(access: DocumentArchiveAccess, save: Readonly<{ revisionId: string; saveSequence: number; contentDigest: string }>): Promise<StudioFinalizationIntent | null>;
  waitForAssessment(access: DocumentArchiveAccess, intentId: string, expectedSequence: number): Promise<StudioFinalizationIntent>;
  assess(access: DocumentArchiveAccess, intentId: string, expectedSequence: number, assessment: StudioScientificAssessment): Promise<StudioFinalizationIntent>;
  linkPreparation(access: DocumentArchiveAccess, intentId: string, expectedSequence: number, preparation: WorkingDraftPreparation): Promise<StudioFinalizationIntent>;
  resolveAdoption(access: DocumentArchiveAccess, intentId: string, expectedSequence: number, decision: StudioFinalizationHumanDecision): Promise<StudioFinalizationIntent>;
}>;
type Ports = {
  sql: Sql; sha256(text: string): string; maxBodyBytes: number;
  authorize(access: DocumentArchiveAccess): Promise<{ sessionKey: string; projectId: string }>;
  readProject(access: DocumentArchiveAccess): Promise<ResearchProjectOwnerProjection>;
  revisions: DocumentWorkingRevisionStore; body: DocumentArchiveStore["body"];
};
/** Shared DOC pool/capability. All mutations append evidence, never update the
 * frozen input, archived generation, Project, or latest Working Revision. */
export const createStudioFinalizationIntents = (ports: Ports): StudioFinalizationIntentStore => {
  const { sql } = ports;
  let migration: Promise<unknown> | null = null;
  const authorize = async (access: DocumentArchiveAccess) => {
    const scope = await ports.authorize(access);
    await ports.revisions.ensureStorage(access);
    await (migration ??= sql.unsafe(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "migrations", "005_doc_studio_finalization_intent.sql"), "utf8"))
      .catch(error => { migration = null; throw error; }));
    return scope;
  };
  const load = async (db: Sql, scope: { sessionKey: string; projectId: string }, intentId: string) => {
    if (!/^studio-finalization-intent:ke1-[a-f0-9]{16}$/u.test(intentId)) throw new StudioFinalizationIntentError("STUDIO_INTENT_REQUEST_INVALID", 400);
    const row = (await db`select record_text, record_sha256 from noxia_durable.doc_studio_finalization_intent
      where session_key_hash = ${scope.sessionKey} and project_id = ${scope.projectId} and intent_id = ${intentId}
      order by sequence desc limit 1`)[0];
    if (!row) return null;
    const text = String(row.record_text);
    if (ports.sha256(text) !== row.record_sha256) throw new StudioFinalizationIntentError("STUDIO_INTENT_CORRUPT", 503);
    const intent = assertStudioIntent(JSON.parse(text));
    if (intent.finalizationIntentId !== intentId || intent.frozen.sourceProject.projectId !== scope.projectId)
      throw new StudioFinalizationIntentError("STUDIO_INTENT_BINDING_INVALID", 403);
    return intent;
  };
  const historicalSave = async (access: DocumentArchiveAccess, intent: StudioFinalizationIntent) => {
    const frozen = intent.frozen;
    const { revision } = await ports.revisions.getSave(access, { revisionId: frozen.workingRevisionId,
      saveSequence: frozen.workingRevisionSaveSequence, contentDigest: frozen.workingRevisionContentDigest });
    assertStudioIntentSave(intent, revision); return revision;
  };
  const insert = async (db: Sql, scope: { sessionKey: string; projectId: string }, intent: StudioFinalizationIntent) => {
    const text = JSON.stringify(assertStudioIntent(intent));
    if (Buffer.byteLength(text, "utf8") > ports.maxBodyBytes) throw new StudioFinalizationIntentError("STUDIO_INTENT_TOO_LARGE", 413);
    await db`insert into noxia_durable.doc_studio_finalization_intent
      (session_key_hash, project_id, intent_id, sequence, revision_id, save_sequence, intent_digest, record_text, record_sha256)
      values (${scope.sessionKey}, ${scope.projectId}, ${intent.finalizationIntentId}, ${intent.sequence}, ${intent.frozen.workingRevisionId},
        ${intent.frozen.workingRevisionSaveSequence}, ${intent.intentDigest}, ${text}, ${ports.sha256(text)})`;
  };
  const locked = async <T>(scope: { sessionKey: string; projectId: string }, intentId: string, operation: (db: Sql) => Promise<T>) =>
    sql.begin(async tx => {
      await tx`select pg_advisory_xact_lock(hashtext(${ports.sha256(stableStringify(["noxia:doc-studio-intent", scope.sessionKey, scope.projectId, intentId]))}))`;
      return operation(tx as unknown as Sql);
    });
  const required = async (access: DocumentArchiveAccess, intentId: string) => {
    const scope = await authorize(access), intent = await load(sql, scope, intentId);
    if (!intent) throw new StudioFinalizationIntentError("STUDIO_INTENT_NOT_FOUND", 404);
    await historicalSave(access, intent);
    return { scope, intent };
  };
  const currentProject = async (access: DocumentArchiveAccess) => {
    const latest = (await sql`select version_id, project_digest from noxia_durable.public_project_snapshot
      where session_key_hash = ${ports.sha256(access.identity.sessionId)} and project_id = ${access.project.projectId}
      order by (canonical_payload->>'revision')::bigint desc limit 1`)[0];
    return ports.readProject(latest ? { ...access, project: { projectId: access.project.projectId,
      versionId: String(latest.version_id), projectDigest: String(latest.project_digest) } } : access);
  };
  const mutate = async (access: DocumentArchiveAccess, intentId: string, sequence: number,
    resolve: (intent: StudioFinalizationIntent, project: ResearchProjectOwnerProjection) => Promise<StudioFinalizationIntent> | StudioFinalizationIntent) => {
    const { scope, intent } = await required(access, intentId);
    if (!Number.isSafeInteger(sequence) || sequence < 1) throw new StudioFinalizationIntentError("STUDIO_INTENT_REQUEST_INVALID", 400);
    const project = await currentProject(access), resolved = await resolve(intent, project);
    const next = resolved.sequence === intent.sequence && stableStringify(resolved) !== stableStringify(intent)
      ? { ...resolved, sequence: intent.sequence + 1 } : resolved;
    // Shared pool reads happen BEFORE the write lock, avoiding nested connections.
    return locked(scope, intentId, async db => {
      const latest = await load(db, scope, intentId);
      if (!latest || latest.sequence !== sequence || stableStringify(latest) !== stableStringify(intent))
        throw new StudioFinalizationIntentError("STUDIO_INTENT_UPDATE_CONFLICT");
      if (next.sequence !== intent.sequence) await insert(db, scope, next);
      return next;
    });
  };
  return {
    async create(access, frozen) {
      // Initial owner checks and immutable native source verification are the
      // same ones used at the Scientific Thinking boundary.
      const { revision } = await ports.revisions.getSave(access, { revisionId: frozen.workingRevisionId,
        saveSequence: frozen.workingRevisionSaveSequence, contentDigest: frozen.workingRevisionContentDigest });
      const scope = await authorize(access);
      const existing = await load(sql, scope, `studio-finalization-intent:${logicalDigest(frozen)}`);
      if (existing) {
        if (stableStringify(existing.frozen) !== stableStringify(frozen)) throw new StudioFinalizationIntentError("STUDIO_INTENT_CREATE_DIVERGENCE");
        // A lost acknowledgement can replay CREATE after this same intent
        // advanced PRJ. Recover its resolution, not a new freeze against PRJ V3.
        return resumeStudioIntent(existing, await currentProject(access), existing.updatedAt);
      }
      const project = await currentProject(access);
      const source = await ports.body(access, revision.baseGenerationId);
      const projectionSource = source.body.native.family === "DRCI" ? await ports.body(access, source.body.native.value.protocolProjectionId) : undefined;
      const expected = await createStudioReconciliationRequest({ revision, source, projectionSource, currentProject: project,
        scientificState: frozen.scientificSources.request.scientificState });
      if (logicalDigest(expected) !== logicalDigest(frozen.scientificSources.request)) throw new StudioFinalizationIntentError("STUDIO_INTENT_SOURCE_INVALID", 403);
      const created = createStudioFinalizationIntent(frozen, revision, project, new Date().toISOString());
      return locked(scope, created.finalizationIntentId, async db => {
        const previous = await load(db, scope, created.finalizationIntentId);
        if (previous) {
          if (stableStringify(previous.frozen) !== stableStringify(created.frozen)) throw new StudioFinalizationIntentError("STUDIO_INTENT_CREATE_DIVERGENCE");
          return previous;
        }
        await insert(db, scope, created); return created;
      });
    },
    async get(access, intentId) {
      const { intent } = await required(access, intentId);
      // A read exposes stale state without rewriting immutable stored evidence.
      return resumeStudioIntent(intent, await currentProject(access), intent.updatedAt);
    },
    async recoverForSave(access, save) {
      // Recovery must not depend on a lost React/local intent handle. Resolve
      // the exact native save, never the latest save or an arbitrary intent.
      await ports.revisions.getSave(access, save);
      const scope = await authorize(access);
      const rows = await sql`select distinct intent_id from noxia_durable.doc_studio_finalization_intent
        where session_key_hash = ${scope.sessionKey} and project_id = ${scope.projectId}
          and revision_id = ${save.revisionId} and save_sequence = ${save.saveSequence}
          and record_text::jsonb->'frozen'->>'workingRevisionContentDigest' = ${save.contentDigest}
        limit 2`;
      if (rows.length > 1) throw new StudioFinalizationIntentError("STUDIO_INTENT_RECOVERY_AMBIGUOUS");
      if (!rows[0]) return null;
      const { intent } = await required(access, String(rows[0].intent_id));
      return resumeStudioIntent(intent, await currentProject(access), intent.updatedAt);
    },
    waitForAssessment: (access, id, sequence) => mutate(access, id, sequence, (intent, project) => {
      if (intent.state !== "FROZEN" && intent.state !== "WAITING_FOR_SCIENTIFIC_ASSESSMENT") throw new StudioFinalizationIntentError("STUDIO_INTENT_STAGE_INVALID");
      const resumed = resumeStudioIntent(intent, project, new Date().toISOString());
      return resumed.state === "BLOCKED" ? resumed : transitionStudioIntent(intent, "WAITING_FOR_SCIENTIFIC_ASSESSMENT", intent.resolution, new Date().toISOString());
    }),
    assess: (access, id, sequence, assessment) => mutate(access, id, sequence, async (intent, project) => {
      const revision = await historicalSave(access, intent), source = await ports.body(access, revision.baseGenerationId);
      const projectionSource = source.body.native.family === "DRCI" ? await ports.body(access, source.body.native.value.protocolProjectionId) : undefined;
      const request = intent.frozen.scientificSources.request;
      const sameProject = source.ref.project.projectVersion === project.versionId && source.ref.project.projectDigest === project.projectDigest;
      const plan = await buildStudioReconciliationPlan({ request, revision, currentProject: project,
        scientificState: request.scientificState, assessment, ...(sameProject ? { target: source, targetProjection: projectionSource } : {}) });
      return assessStudioIntent(intent, project, assessment, plan, new Date().toISOString());
    }),
    linkPreparation: (access, id, sequence, preparation) => mutate(access, id, sequence, (intent, project) => {
      const resumed = resumeStudioIntent(intent, project, new Date().toISOString());
      return resumed.state === "BLOCKED" ? resumed : linkStudioIntentPreparation(intent, preparation, new Date().toISOString());
    }),
    resolveAdoption: (access, id, sequence, decision) => mutate(access, id, sequence, (intent, project) =>
      resolveStudioIntentAdoption(intent, project, decision, new Date().toISOString())),
  };
};
