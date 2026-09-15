import {
  createFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY, loadFunctionalResetSession,
  type FunctionalResetSession,
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
      let session = loadFunctionalResetSession(storage, key, true);
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
      projects.push({ key, raw: storage.getItem(key), session });
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

export const saveProjectSession = (storage: Storage, saved: SavedProjectSession, session: FunctionalResetSession): string => {
  if (!isProjectSessionKey(saved.key) || saved.session.sessionId !== session.sessionId || saved.session.projectId !== session.projectId) {
    throw new Error("La sauvegarde ne correspond pas à ce projet.");
  }
  if (storage.getItem(saved.key) !== saved.raw) throw new Error("Ce projet a changé dans un autre écran. Rouvrez sa version enregistrée avant de poursuivre.");
  const raw = encodeSessionStorage(session);
  // One atomic Storage write preserves the entire session; no secondary scientific database or lossy reconstruction.
  storage.setItem(saved.key, raw);
  return raw;
};

export const renameProjectSession = (
  storage: Storage,
  saved: SavedProjectSession,
  title: string,
  updatedAt = new Date().toISOString(),
): SavedProjectSession => {
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
  const raw = saveProjectSession(storage, saved, session);
  return { ...saved, raw, session };
};

export const deleteProjectSession = (storage: Storage, saved: SavedProjectSession): void => {
  if (!isProjectSessionKey(saved.key)
    || storage.getItem(saved.key) !== saved.raw
    || saved.session.sessionId.length === 0
    || saved.session.projectId.length === 0) {
    throw new Error("Ce projet a changé dans un autre écran. Rouvrez sa version enregistrée avant de le supprimer.");
  }
  storage.removeItem(saved.key);
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
