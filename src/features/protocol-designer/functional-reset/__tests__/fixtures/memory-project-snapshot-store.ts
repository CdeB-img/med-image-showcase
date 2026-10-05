import { createHash } from "node:crypto";
import { stableStringify } from "@/features/knowledge-engine/canonical";
import {
  parseVerifiedProjectSnapshot, ProjectSnapshotError,
  type ProtocolDesignerProjectSnapshotStore, type VerifiedProjectSnapshot,
} from "../../../../../../server/protocol-designer-project-snapshot";

/** SYNTHETIC_CURRENT_CONTRACT: immutable, session-bound snapshots without DB I/O.
 * Uses the native canonical validator; no legacy campaign payload is embedded. */
export const memoryProjectSnapshotStore = (): ProtocolDesignerProjectSnapshotStore => {
  const roots = new Map<string, { clientAddress: string; proof: string }>();
  const versions = new Map<string, VerifiedProjectSnapshot>();
  return {
    async persist(identity, payload, proof) {
      const project = parseVerifiedProjectSnapshot(payload, identity.sessionId);
      const rootKey = `${identity.sessionId}\u0000${project.projectId}`;
      const root = roots.get(rootKey);
      if (root && (root.clientAddress !== identity.clientAddress || root.proof !== proof))
        throw new ProjectSnapshotError("PROJECT_SNAPSHOT_SESSION_MISMATCH", 403);
      if (!root && proof) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_NOT_FOUND", 404);
      const issued = root ?? { clientAddress: identity.clientAddress,
        proof: createHash("sha256").update(rootKey).digest("base64url") };
      const key = `${rootKey}\u0000${project.versionId}`;
      const existing = versions.get(key);
      if (existing && stableStringify(existing) !== stableStringify(project))
        throw new ProjectSnapshotError("PROJECT_SNAPSHOT_VERSION_CONFLICT", 409);
      roots.set(rootKey, issued);
      versions.set(key, structuredClone(project));
      return { ref: { projectId: project.projectId, versionId: project.versionId,
        projectDigest: project.projectDigest }, proof: issued.proof };
    },
    async resolve(identity, ref, proof) {
      const rootKey = `${identity.sessionId}\u0000${ref.projectId}`;
      const root = roots.get(rootKey);
      if (!root) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_NOT_FOUND", 404);
      if (root.clientAddress !== identity.clientAddress || root.proof !== proof)
        throw new ProjectSnapshotError("PROJECT_SNAPSHOT_SESSION_MISMATCH", 403);
      const project = versions.get(`${rootKey}\u0000${ref.versionId}`);
      if (!project) throw new ProjectSnapshotError("PROJECT_SNAPSHOT_VERSION_MISMATCH", 409);
      if (project.projectDigest !== ref.projectDigest)
        throw new ProjectSnapshotError("PROJECT_SNAPSHOT_DIGEST_MISMATCH", 409);
      return structuredClone(parseVerifiedProjectSnapshot(project, identity.sessionId));
    },
    close: async () => {},
  };
};
