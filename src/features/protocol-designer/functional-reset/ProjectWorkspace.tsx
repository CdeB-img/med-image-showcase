import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ScientificTraceCaptureConfiguration } from "../scientific-execution-trace";
import { refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import ProtocolDesignerWorkspace from "./ProtocolDesignerWorkspace";
import ProjectAdministrationForm, { ResearcherProfileForm } from "./ProjectAdministrationForm";
import { documentAdministrationFrom, emptyLocalProfile, emptyProjectAdministration, type LocalProjectMetadata } from "./project-administration";
import {
  ACTIVE_PROJECT_STORAGE_KEY, createProjectSession, deleteProjectSession, readProjectSessions, readResearcherProfile,
  RESEARCHER_PROFILE_STORAGE_KEY, renameProjectSession, saveProjectSession, type SavedProjectSession,
} from "./project-workspace-storage";
import type { FunctionalResetSession } from "./session";

const buttonClass = "min-h-11 rounded-xl border bg-background px-4 text-sm font-medium";
const projectTitle = (saved: SavedProjectSession) => saved.session.workspace?.title ?? "Projet sans titre";

const initial = () => {
  const storage = window.localStorage;
  const found = readProjectSessions(storage);
  const activeKey = storage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
  const active = found.projects.find((project) => project.key === activeKey)
    ?? (activeKey === "LIST" ? null : found.projects[0])
    ?? (found.unreadable.length || activeKey === "LIST" ? null : createProjectSession(storage, "Projet sans titre"));
  let profile;
  let profileError = "";
  try { profile = readResearcherProfile(storage); }
  catch (error) { profile = emptyLocalProfile(); profileError = String(error); }
  return { ...found, active, profile, profileError };
};

function TopNavigation({ currentTitle, onProjects, onProject, onProfile }: {
  currentTitle?: string;
  onProjects: () => void;
  onProject?: () => void;
  onProfile: () => void;
}) {
  return <header className="sticky top-0 z-40 -mx-4 mb-6 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8" data-testid="project-top-navigation">
    <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
      <button type="button" onClick={onProjects} className={buttonClass}>← Mes projets</button>
      {currentTitle && onProject && <button type="button" onClick={onProject} className="min-h-11 min-w-0 max-w-full truncate rounded-xl px-3 text-left text-sm font-semibold text-foreground hover:bg-muted">{currentTitle}</button>}
      <button type="button" onClick={onProfile} className={`${buttonClass} ml-auto`}>Profil / organisation</button>
    </div>
  </header>;
}

function ModalFrame({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
      <h2 id="project-modal-title" className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  </div>;
}

/** Workspace navigation and local persistence. The Standard component remains the scientific conversation owner. */
export default function ProjectWorkspace({ traceCaptureConfiguration }: { traceCaptureConfiguration?: ScientificTraceCaptureConfiguration }) {
  const [boot] = useState(initial);
  const [active, setActive] = useState<SavedProjectSession | null>(boot.active);
  const savedRef = useRef<SavedProjectSession | null>(boot.active);
  const latestRef = useRef<FunctionalResetSession | null>(boot.active?.session ?? null);
  const [view, setView] = useState<"PROJECT" | "LIST" | "ADMIN" | "PROFILE">(boot.active ? "PROJECT" : "LIST");
  const [profile, setProfile] = useState(boot.profile);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [generation, setGeneration] = useState(0);
  const [list, setList] = useState(() => ({ projects: boot.projects, unreadable: boot.unreadable }));
  const [renameTarget, setRenameTarget] = useState<SavedProjectSession | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SavedProjectSession | null>(null);

  useEffect(() => {
    if (!error) return;
    const preventUnsavedExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventUnsavedExit);
    return () => window.removeEventListener("beforeunload", preventUnsavedExit);
  }, [error]);

  const refreshList = () => {
    const next = readProjectSessions(window.localStorage);
    setList(next);
    return next;
  };

  const persist = useCallback((session: FunctionalResetSession) => {
    const saved = savedRef.current;
    if (!saved || saved.session.sessionId !== session.sessionId) return;
    latestRef.current = session;
    try {
      const raw = saveProjectSession(window.localStorage, saved, session);
      const next = { ...saved, raw, session };
      savedRef.current = next;
      setActive(next);
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
      setError("");
    } catch (failure) {
      setError(`Enregistrement local impossible. Gardez cet écran ouvert : ${failure instanceof Error ? failure.message : String(failure)}`);
    }
  }, []);

  const open = (saved: SavedProjectSession) => {
    if (error) return;
    savedRef.current = saved;
    latestRef.current = saved.session;
    setActive(saved);
    setGeneration((value) => value + 1);
    setView("PROJECT");
  };
  const leave = () => {
    if (error) return;
    try {
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
      refreshList();
      setView("LIST");
    } catch (failure) { setError(String(failure)); }
  };
  const newProject = () => {
    if (error) return;
    const saved = createProjectSession(window.localStorage, title);
    open(saved);
    setTitle("");
  };
  const saveMetadata = (metadata: LocalProjectMetadata) => {
    const current = latestRef.current;
    const saved = savedRef.current;
    if (!current || !saved || error) return;
    const session: FunctionalResetSession = { ...current, workspace: metadata, updatedAt: new Date().toISOString() };
    if (session.project) session.documents = refreshFunctionalResetDocumentPortfolio({
      project: session.project, previous: session.documents, requestedAt: session.updatedAt,
      handoffDecision: session.documents.handoffDecision,
      administration: documentAdministrationFrom(session.projectId, metadata),
    });
    try {
      const raw = saveProjectSession(window.localStorage, saved, session);
      open({ ...saved, raw, session });
    } catch (failure) { setError(String(failure)); }
  };

  const beginRename = (saved: SavedProjectSession) => {
    const currentSaved = savedRef.current?.key === saved.key && latestRef.current
      ? { ...savedRef.current, session: latestRef.current }
      : saved;
    setRenameTarget(currentSaved);
    setRenameTitle(projectTitle(currentSaved));
  };
  const confirmRename = () => {
    if (!renameTarget || error) return;
    try {
      const renamed = renameProjectSession(window.localStorage, renameTarget, renameTitle);
      if (savedRef.current?.key === renamed.key) {
        savedRef.current = renamed;
        latestRef.current = renamed.session;
        setActive(renamed);
        setGeneration((value) => value + 1);
      }
      refreshList();
      setRenameTarget(null);
    } catch (failure) { setError(String(failure)); }
  };
  const confirmDelete = () => {
    if (!deleteTarget || error) return;
    try {
      deleteProjectSession(window.localStorage, deleteTarget);
      if (savedRef.current?.key === deleteTarget.key) {
        savedRef.current = null;
        latestRef.current = null;
        setActive(null);
      }
      refreshList();
      setDeleteTarget(null);
      setView("LIST");
    } catch (failure) { setError(String(failure)); }
  };

  const openCurrent = () => { if (savedRef.current) open(savedRef.current); };
  const current = latestRef.current;
  const metadata = current?.workspace ?? { title: "Projet sans titre", revision: 0, administration: emptyProjectAdministration() };
  const currentTitle = current?.workspace?.title;

  return <>
    {error && <div role="alert" className="sticky top-16 z-50 m-4 rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-950">
      <p>{error}</p><button type="button" className={`${buttonClass} mt-2`} onClick={() => { if (latestRef.current) persist(latestRef.current); }}>Réessayer la sauvegarde</button>
    </div>}

    {view === "PROJECT" && active ? <ProtocolDesignerWorkspace key={`${active.key}:${generation}`} initialSession={active.session}
      traceCaptureConfiguration={traceCaptureConfiguration} onSessionChange={persist}
      onLeaveWorkspace={leave} onEditAdministration={() => { if (!error) setView("ADMIN"); }} onNewProject={newProject}
      onOpenProfile={() => { if (!error) setView("PROFILE"); }} onRenameProject={() => { if (savedRef.current) beginRename(savedRef.current); }} />
      : <main className="min-h-screen bg-muted/30 px-4 pb-8 text-foreground sm:px-8">
        <TopNavigation currentTitle={currentTitle} onProjects={leave} onProject={current ? openCurrent : undefined} onProfile={() => setView("PROFILE")} />
        {view === "ADMIN" && current ? <ProjectAdministrationForm metadata={metadata} profile={profile} projectId={current.projectId} onSave={saveMetadata} onCancel={openCurrent} />
          : view === "PROFILE" ? <ResearcherProfileForm profile={profile} onCancel={leave} onSave={(next) => {
            if (boot.profileError) { setError(boot.profileError); return; }
            try {
              window.localStorage.setItem(RESEARCHER_PROFILE_STORAGE_KEY, JSON.stringify(next));
              window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
              setProfile(next);
              refreshList();
              setView("LIST");
            }
            catch (failure) { setError(String(failure)); }
          }} /> : <div className="mx-auto max-w-5xl space-y-6">
            <header><p className="text-xs font-semibold tracking-[.2em] text-primary">NOXIA · PROTOCOL DESIGNER</p><h1 className="mt-2 text-3xl font-bold">Mes projets</h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Projets enregistrés dans ce navigateur.</p>
            </header>
            {list.unreadable.length > 0 && <p role="alert" className="rounded-xl border border-amber-400 p-4 text-sm">{list.unreadable.length} sauvegarde(s) illisible(s) sont conservées sans remplacement. Leur contenu nécessite une récupération avant réouverture.</p>}
            {boot.profileError && <p role="alert">{boot.profileError}</p>}
            <form onSubmit={(event) => { event.preventDefault(); newProject(); }} className="rounded-2xl border bg-background p-5">
              <label htmlFor="new-project-title" className="font-medium">Nouveau projet</label>
              <div className="mt-3 flex flex-wrap gap-3"><input id="new-project-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={300} placeholder="Par exemple : myocardite et suivi" className="min-h-11 min-w-0 flex-1 rounded-lg border bg-background px-3" />
                <button type="submit" disabled={Boolean(error)} className={`${buttonClass} bg-primary text-primary-foreground`}>Créer un projet</button></div>
            </form>
            <section className="grid gap-4 sm:grid-cols-2" aria-label="Projets enregistrés">{list.projects.map((saved) => {
              const name = projectTitle(saved);
              const documentCount = saved.session.documents.projections.length;
              return <article key={saved.key} className="relative rounded-2xl border bg-background p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h2 className="truncate text-lg font-semibold">{name}</h2><p className="mt-2 text-sm text-muted-foreground">{saved.session.project ? "Conception confirmée" : "Conception en cours"}</p></div>
                  <details className="relative">
                    <summary aria-label={`Actions pour ${name}`} className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border text-xl leading-none marker:hidden">⋯</summary>
                    <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border bg-background p-1 shadow-xl">
                      <button type="button" onClick={() => beginRename(saved)} className="min-h-10 w-full rounded-lg px-3 text-left text-sm hover:bg-muted">Renommer</button>
                      <button type="button" onClick={() => setDeleteTarget(saved)} className="min-h-10 w-full rounded-lg px-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10">Supprimer le projet</button>
                    </div>
                  </details>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Modifié le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(saved.session.updatedAt))} · {documentCount ? `${documentCount} version${documentCount > 1 ? "s" : ""} documentaire${documentCount > 1 ? "s" : ""}` : "Aucun document"}</p>
                <button type="button" disabled={Boolean(error)} onClick={() => open(saved)} className={`${buttonClass} mt-4`}>Ouvrir</button>
              </article>;
            })}</section>
          </div>}
      </main>}

    {renameTarget && <ModalFrame title={`Renommer « ${projectTitle(renameTarget)} »`} onClose={() => setRenameTarget(null)}>
      <form onSubmit={(event) => { event.preventDefault(); confirmRename(); }}>
        <label htmlFor="rename-project-title" className="mt-4 block text-sm font-medium">Nom du projet</label>
        <input id="rename-project-title" autoFocus maxLength={300} value={renameTitle} onChange={(event) => setRenameTitle(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3" />
        <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setRenameTarget(null)} className={buttonClass}>Annuler</button><button type="submit" className={`${buttonClass} bg-primary text-primary-foreground`}>Enregistrer</button></div>
      </form>
    </ModalFrame>}

    {deleteTarget && <ModalFrame title={`Supprimer « ${projectTitle(deleteTarget)} » ?`} onClose={() => setDeleteTarget(null)}>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Le projet, sa conversation, ses documents et versions, ainsi que ses données locales associées seront supprimés de ce navigateur. Cette action est irréversible.</p>
      <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setDeleteTarget(null)} className={buttonClass}>Annuler</button><button type="button" onClick={confirmDelete} className={`${buttonClass} border-destructive bg-destructive text-destructive-foreground`}>Supprimer</button></div>
    </ModalFrame>}
  </>;
}
