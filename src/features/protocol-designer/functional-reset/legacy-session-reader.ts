import { decodeSessionStorage } from "./session-storage-codec";
import { restoreResearchProjectOwnerProjection } from "@/features/research-project-construction/project-owner-restore";
import type { ResearchProjectOwnerProjection } from "@/features/research-project-construction";

export const LEGACY_V3_STORAGE_KEY = "noxia-protocol-designer-functional-reset-v3";
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
export type LegacyConversationSnapshot = Readonly<{
  key: string; sessionId: string; projectId: string; title: string;
  sourceContractVersion: string; projectVerified: boolean;
  entries: ReadonlyArray<Readonly<{ id: string; role: string; content: string }>>;
}>;

/** Historical display only. Never constructs a current session, adopts a
 * proposal, loads DOC bodies into v4, writes storage or invokes a runtime. */
export const readLegacyProjectSessions = (storage: Pick<Storage, "length" | "key" | "getItem">) => {
  const legacy: LegacyConversationSnapshot[] = [], unreadableLegacy: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key || !(key === LEGACY_V3_STORAGE_KEY || key.startsWith(`${LEGACY_V3_STORAGE_KEY}::project::`))) continue;
    try {
      const raw = storage.getItem(key);
      if (!raw) throw new Error("LEGACY_SESSION_MISSING");
      const value = decodeSessionStorage(raw);
      if (!isRecord(value) || value.contract !== "FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION"
        || value.contractVersion !== "2.0.0" || value.contentEpoch !== undefined
        || typeof value.sessionId !== "string" || typeof value.projectId !== "string"
        || value.projectId !== `${value.sessionId}:research-project` || !Array.isArray(value.entries)) {
        throw new Error("LEGACY_SESSION_UNSUPPORTED");
      }
      const entries = value.entries.map((entry, entryIndex) => {
        if (!isRecord(entry) || typeof entry.role !== "string" || typeof entry.kind !== "string") throw new Error("LEGACY_ENTRY_INVALID");
        // No candidate/review serialization is promoted to conversational or
        // adopted truth. Only explicitly stored textual entries are displayed.
        if (entry.kind !== "TEXT") return null;
        if (typeof entry.content !== "string" || !["USER", "NOXIA"].includes(entry.role)) throw new Error("LEGACY_ENTRY_INVALID");
        return { id: typeof entry.id === "string" ? entry.id : `legacy-entry:${entryIndex}`, role: entry.role, content: entry.content };
      }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      let projectVerified = false;
      if (value.project !== null && value.project !== undefined) {
        // Delegate provenance verification to PRJ. Retain the historical
        // bytes, not the owner's normalized projection, in browser storage.
        if (!isRecord(value.project) || value.project.contract !== "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION") throw new Error("LEGACY_PROJECT_CONTRACT_INVALID");
        const project = restoreResearchProjectOwnerProjection(value.project as unknown as ResearchProjectOwnerProjection);
        if (project.projectId !== value.projectId) throw new Error("LEGACY_PROJECT_IDENTITY_MISMATCH");
        projectVerified = true;
      }
      legacy.push({ key, sessionId: value.sessionId, projectId: value.projectId,
        sourceContractVersion: value.contractVersion, projectVerified, entries,
        title: isRecord(value.workspace) && typeof value.workspace.title === "string" ? value.workspace.title : "Projet historique" });
    } catch { unreadableLegacy.push(key); }
  }
  return { legacy, unreadableLegacy };
};
