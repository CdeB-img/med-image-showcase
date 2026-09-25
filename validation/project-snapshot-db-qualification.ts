import { stableStringify } from "../src/features/knowledge-engine/canonical";
import { confirmResearchProjectContribution } from "../src/features/research-project-construction/contribution-owner-boundary";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../src/features/protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { createPostgresProjectSnapshotStore, ProjectSnapshotError } from "../server/protocol-designer-project-snapshot";
import { preflightDestructiveQualificationStore } from "./durable-qualification-store-preflight.mjs";

// Synthetic-only writes. The exact human Project is verified separately without uploading its content.
const preflight = await preflightDestructiveQualificationStore();
const sessionId = `protocol-designer-session:${globalThis.crypto.randomUUID()}`;
const projectId = `${sessionId}:research-project`;
const identity = { sessionId, clientAddress: "synthetic-qualification-client" };
const authority = { actorRef: "synthetic-qualification-researcher", mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const, verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const };
const firstTurn = { turnId: `synthetic-turn:${globalThis.crypto.randomUUID()}`, role: "USER" as const,
  content: COLCHICINE_INITIAL, createdAt: "2026-09-25T10:00:00.000Z" };
const v1 = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([firstTurn]), current: null,
  projectId, authority, confirmedAt: firstTurn.createdAt });
const store = createPostgresProjectSnapshotStore(preflight.environment.NOXIA_DURABLE_DATABASE_DATABASE_URL);
let proof: string;
let duplicate = false;
let isolated = false;
let wrongClient = false;
let badDigest = false;
let conflict = false;
let v2;
try {
  const first = await store.persist(identity, v1, null);
  proof = first.proof;
  const same = await store.persist(identity, v1, proof);
  duplicate = same.proof === proof && same.ref.projectDigest === v1.projectDigest;
  const resolvedV1 = await store.resolve(identity, first.ref, proof);
  if (stableStringify(resolvedV1) !== stableStringify(v1)) throw new Error("SNAPSHOT_V1_LOSS");
  try { await store.resolve({ ...identity, sessionId: `protocol-designer-session:${globalThis.crypto.randomUUID()}` }, first.ref, proof); }
  catch (error) { isolated = error instanceof ProjectSnapshotError && error.code === "PROJECT_SNAPSHOT_SESSION_MISMATCH"; }
  try { await store.resolve({ ...identity, clientAddress: "synthetic-other-client" }, first.ref, proof); }
  catch (error) { wrongClient = error instanceof ProjectSnapshotError && error.code === "PROJECT_SNAPSHOT_SESSION_MISMATCH"; }
  try { await store.resolve(identity, { ...first.ref, projectDigest: "ke1-wrong" }, proof); }
  catch (error) { badDigest = error instanceof ProjectSnapshotError && error.code === "PROJECT_SNAPSHOT_DIGEST_MISMATCH"; }
  try { await store.persist(identity, { ...v1, adoptedAt: "2026-09-25T11:00:00.000Z" }, proof); }
  catch (error) { conflict = error instanceof ProjectSnapshotError && error.code === "PROJECT_SNAPSHOT_VERSION_CONFLICT"; }
  const nextTurn = { turnId: `synthetic-turn:${globalThis.crypto.randomUUID()}`, role: "USER" as const,
    content: "Je souhaite ajouter une visite IRM entre J3 et J5 et limiter l’âge à 75 ans.", createdAt: "2026-09-25T10:01:00.000Z" };
  v2 = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([firstTurn, nextTurn]),
    current: v1, projectId, authority, confirmedAt: nextTurn.createdAt });
  await store.persist(identity, v2, proof);
  const staleV1 = await store.resolve(identity, first.ref, proof);
  if (staleV1.versionId !== v1.versionId || staleV1.projectDigest !== v1.projectDigest) throw new Error("STALE_REF_NOT_EXACT");
} finally { await store.close(); }
const restarted = createPostgresProjectSnapshotStore(preflight.environment.NOXIA_DURABLE_DATABASE_DATABASE_URL);
let restart = false;
try {
  const resolved = await restarted.resolve(identity, { projectId, versionId: v2!.versionId,
    projectDigest: v2!.projectDigest }, proof!);
  restart = stableStringify(resolved) === stableStringify(v2);
} finally { await restarted.close(); }
const result = { qualificationProjectId: preflight.environment.NOXIA_DURABLE_DATABASE_NEON_PROJECT_ID,
  productionDifferent: preflight.identities.qualification.host !== preflight.identities.production.host,
  v1Digest: v1.projectDigest, v2Digest: v2!.projectDigest, idempotent: duplicate,
  sessionIsolation: isolated, clientBinding: wrongClient, digestMismatchBlocked: badDigest,
  versionConflictBlocked: conflict, restartDurability: restart, providerCalls: 0 };
console.log(JSON.stringify(result));
if (!result.productionDifferent || !duplicate || !isolated || !wrongClient || !badDigest || !conflict || !restart) {
  throw new Error("PROJECT_SNAPSHOT_QUALIFICATION_FAILED");
}
