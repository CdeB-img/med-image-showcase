import {
  createFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY, loadFunctionalResetSession, assertDurableDocumentSession,
  type FunctionalResetSession, type SessionPersistenceResult,
} from "./session";
import { emptyLocalProfile, emptyProjectAdministration, type LocalResearcherProfile } from "./project-administration";
import { documentAdministrationFrom } from "./project-administration";
import { refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import { rehydrateProjectSourceLibrary } from "@/features/knowledge-engine/project-source-library";
import { validateDocumentEvidence } from "@/features/document-projection/scientific-document-revision";
import { encodeSessionStorage } from "./session-storage-codec";

export const PROJECT_SESSION_PREFIX = `${FUNCTIONAL_RESET_STORAGE_KEY}::project::`;
export const ACTIVE_PROJECT_STORAGE_KEY = "noxia:protocol-designer:active-project";
export const RESEARCHER_PROFILE_STORAGE_KEY = "noxia:protocol-designer:local-profile:v1";

export type SavedProjectSession = { key: string; raw: string | null; session: FunctionalResetSession };
export const isProjectSessionKey = (key: string) => key === FUNCTIONAL_RESET_STORAGE_KEY || key.startsWith(PROJECT_SESSION_PREFIX);

export const readProjectSessions = (storage: Storage) => {
  const projects: SavedProjectSession[] = [];
  const unreadable: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !isProjectSessionKey(key)) continue;
    try {
      // Decode and bind the base from one read: another context must not make
      // old session content appear to have the expected bytes of a newer save.
      const raw = storage.getItem(key);
      let session = loadFunctionalResetSession({ getItem: () => raw }, key, true);
      if (session.project && session.project.projectId !== session.projectId) throw new Error("PROJECT_IDENTITY_MISMATCH");
      if (session.documents.projections.some((p) => p.source.projectId !== session.projectId)) throw new Error("DOCUMENT_PROJECT_IDENTITY_MISMATCH");
      if (session.sourceLibrary) session.sourceLibrary = rehydrateProjectSourceLibrary(session.sourceLibrary, session.projectId);
      for (const projection of session.documents.projections) if (projection.evidenceContent) validateDocumentEvidence(projection.evidenceContent);
      if (session.workspace && (typeof session.workspace.title !== "string" || !Number.isInteger(session.workspace.revision)
        || !session.workspace.administration || Object.keys(emptyProjectAdministration()).some((k) => typeof session.workspace!.administration[k as keyof ReturnType<typeof emptyProjectAdministration>] !== "string"))) {
        throw new Error("PROJECT_METADATA_UNREADABLE");
      }
      const workspace = session.workspace ?? { title: "Projet sans titre", revision: 0, administration: emptyProjectAdministration() };
      session = { ...session, workspace };
      if (session.project) session.documents = refreshFunctionalResetDocumentPortfolio({
        project: session.project, previous: session.documents, requestedAt: session.updatedAt,
        handoffDecision: session.documents.handoffDecision,
        administration: documentAdministrationFrom(session.projectId, workspace),
      });
      projects.push({ key, raw, session });
    } catch { unreadable.push(key); }
  }
  return { projects, unreadable };
};

export const createProjectSession = (storage: Storage, title: string): SavedProjectSession => {
  const session = createFunctionalResetSession();
  session.workspace = { title: title.trim() || "Projet sans titre", revision: 0, administration: emptyProjectAdministration() };
  // Preserve the existing first-session key. Every subsequent project has its own immutable storage identity.
  const key = storage.getItem(FUNCTIONAL_RESET_STORAGE_KEY) === null
    ? FUNCTIONAL_RESET_STORAGE_KEY : `${PROJECT_SESSION_PREFIX}${session.sessionId}`;
  return { key, raw: null, session };
};

export class ProjectSessionPersistenceError extends Error {
  constructor(public readonly code: "PROJECT_SESSION_LOCK_UNAVAILABLE" | "PROJECT_SESSION_STALE_BASE" | "PROJECT_SESSION_WRITE_UNVERIFIED", message: string) {
    super(message);
    this.name = "ProjectSessionPersistenceError";
  }
}

/** All session writers, including rename/delete, share this origin-scoped lock.
 * No localStorage pseudo-CAS and no unsafe fallback on unsupported browsers.
 * Native Web Locks release automatically when the callback finishes or throws.
 */
const withProjectSessionLock = <T>(key: string, effect: () => T): Promise<T> => {
  const locks = globalThis.navigator?.locks;
  if (!locks?.request) return Promise.reject(new ProjectSessionPersistenceError("PROJECT_SESSION_LOCK_UNAVAILABLE",
    "Enregistrement sécurisé indisponible dans ce navigateur. Utilisez un navigateur compatible avec Web Locks."));
  return locks.request(`noxia:project-session:${key}`, { mode: "exclusive" }, effect);
};
const staleBase = () => new ProjectSessionPersistenceError("PROJECT_SESSION_STALE_BASE",
  "Ce projet a changé dans un autre écran. Rouvrez sa version enregistrée avant de poursuivre.");

export const saveProjectSession = (storage: Storage, saved: SavedProjectSession, session: FunctionalResetSession): Promise<string> =>
  withProjectSessionLock(saved.key, () => {
    if (!isProjectSessionKey(saved.key) || saved.session.sessionId !== session.sessionId || saved.session.projectId !== session.projectId) {
      throw new Error("La sauvegarde ne correspond pas à ce projet.");
    }
    // The exact prior bytes bind the expected Project version/digest and every
    // session field. Encoding, comparison, write and verification stay locked.
    const current = storage.getItem(saved.key);
    assertDurableDocumentSession(session);
    const raw = encodeSessionStorage(session);
    if (current !== saved.raw && current !== raw) throw staleBase();
    if (current !== raw) storage.setItem(saved.key, raw);
    if (storage.getItem(saved.key) !== raw) throw new ProjectSessionPersistenceError("PROJECT_SESSION_WRITE_UNVERIFIED",
      "La sauvegarde du projet n’a pas pu être vérifiée.");
    return raw;
  });

/** A host's pending saves remain ordered. Only its own successful write advances
 * its expected base; an external conflict never rebases, retries or merges.
 * This is transient effect coordination, not another Project store/owner.
 */
export const createProjectSessionWriter = (storage: Storage, initial: SavedProjectSession) => {
  let saved = initial;
  let tail = Promise.resolve();
  return {
    current: () => saved,
    save: (session: FunctionalResetSession): Promise<SessionPersistenceResult> => {
      const pending = tail.then(async (): Promise<SessionPersistenceResult> => {
        try {
          // A delayed local UI effect must not erase a Project already adopted
          // by an earlier queued save. No scientific merge/reconstruction here.
          const currentProject = saved.session.project;
          if (currentProject && (!session.project || session.project.revision < currentProject.revision
            || session.project.revision === currentProject.revision && session.project.projectDigest !== currentProject.projectDigest)) throw staleBase();
          const raw = await saveProjectSession(storage, saved, session);
          saved = { ...saved, raw, session };
        } catch (error) { return { scientificPersisted: false, error }; }
        try {
          storage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
          return { scientificPersisted: true, navigationPointer: "UPDATED" };
        } catch { return { scientificPersisted: true, navigationPointer: "FAILED" }; }
      });
      tail = pending.then(() => undefined);
      return pending;
    },
  };
};

export const renameProjectSession = async (
  storage: Storage,
  saved: SavedProjectSession,
  title: string,
  updatedAt = new Date().toISOString(),
): Promise<SavedProjectSession> => {
  const workspace = saved.session.workspace ?? {
    title: "Projet sans titre",
    revision: 0,
    administration: emptyProjectAdministration(),
  };
  const session: FunctionalResetSession = {
    ...saved.session,
    updatedAt,
    workspace: {
      ...workspace,
      title: title.trim() || "Projet sans titre",
      revision: workspace.revision + 1,
    },
  };
  const raw = await saveProjectSession(storage, saved, session);
  return { ...saved, raw, session };
};

export const deleteProjectSession = async (storage: Storage, saved: SavedProjectSession): Promise<void> => {
  await withProjectSessionLock(saved.key, () => {
    if (!isProjectSessionKey(saved.key) || storage.getItem(saved.key) !== saved.raw
      || saved.session.sessionId.length === 0 || saved.session.projectId.length === 0) throw staleBase();
    storage.removeItem(saved.key);
  });
  if (storage.getItem(ACTIVE_PROJECT_STORAGE_KEY) === saved.key) {
    storage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
  }
};

export const readResearcherProfile = (storage: Storage): LocalResearcherProfile => {
  const raw = storage.getItem(RESEARCHER_PROFILE_STORAGE_KEY);
  if (!raw) return emptyLocalProfile();
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object") throw new Error("Profil local illisible ; il est conservé sans remplacement.");
  const profile = value as LocalResearcherProfile;
  if (!["actorRef", "organizationRef", "name", "email", "organization", "department", "address"].every((k) => typeof profile[k as keyof LocalResearcherProfile] === "string")
    || !Number.isInteger(profile.revision)) throw new Error("Profil local illisible ; il est conservé sans remplacement.");
  return profile;
};
