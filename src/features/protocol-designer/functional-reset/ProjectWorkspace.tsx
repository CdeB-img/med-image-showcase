import { useCallback, useEffect, useRef, useState } from "react";
import type { ScientificTraceCaptureConfiguration } from "../scientific-execution-trace";
import { refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import ProtocolDesignerWorkspace from "./ProtocolDesignerWorkspace";
import ProjectAdministrationForm, { ResearcherProfileForm } from "./ProjectAdministrationForm";
import { documentAdministrationFrom, emptyLocalProfile, emptyProjectAdministration, type LocalProjectMetadata } from "./project-administration";
import {
  ACTIVE_PROJECT_STORAGE_KEY, createProjectSession, readProjectSessions, readResearcherProfile,
  RESEARCHER_PROFILE_STORAGE_KEY, saveProjectSession, type SavedProjectSession,
} from "./project-workspace-storage";
import type { FunctionalResetSession } from "./session";

const buttonClass = "min-h-11 rounded-xl border bg-background px-4 text-sm font-medium";
const initial = () => {
  const storage = window.localStorage;
  const found = readProjectSessions(storage);
  const activeKey = storage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
  const active = found.projects.find((p) => p.key === activeKey)
    ?? (activeKey === "LIST" ? null : found.projects[0])
    ?? (found.unreadable.length || activeKey === "LIST" ? null : createProjectSession(storage, "Projet sans titre"));
  let profile;
  let profileError = "";
  try { profile = readResearcherProfile(storage); }
  catch (error) { profile = emptyLocalProfile(); profileError = String(error); }
  return { ...found, active, profile, profileError };
};

/** Workspace navigation/persistence only. The existing Standard component owns the scientific conversation. */
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

  useEffect(() => {
    if (!error) return;
    const preventUnsavedExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventUnsavedExit);
    return () => window.removeEventListener("beforeunload", preventUnsavedExit);
  }, [error]);

  const persist = useCallback((session: FunctionalResetSession) => {
    const saved = savedRef.current;
    if (!saved || saved.session.sessionId !== session.sessionId) return;
    latestRef.current = session;
    try {
      const raw = saveProjectSession(window.localStorage, saved, session);
      savedRef.current = { ...saved, raw, session };
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
      setError("");
    } catch (failure) { setError(`Enregistrement local impossible. Gardez cet écran ouvert : ${failure instanceof Error ? failure.message : String(failure)}`); }
  }, []);

  const open = (saved: SavedProjectSession) => {
    if (error) return;
    savedRef.current = saved;
    latestRef.current = saved.session;
    setActive(saved);
    setGeneration((n) => n + 1);
    setView("PROJECT");
  };
  const leave = () => {
    if (error) return;
    try {
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
      setList(readProjectSessions(window.localStorage));
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
  const current = latestRef.current;
  const metadata = current?.workspace ?? { title: "Projet sans titre", revision: 0, administration: emptyProjectAdministration() };
  return <>
    {error && <div role="alert" className="sticky top-16 z-50 m-4 rounded-xl border border-red-400 bg-red-50 p-4 text-sm text-red-950">
      <p>{error}</p><button type="button" className={`${buttonClass} mt-2`} onClick={() => { if (latestRef.current) persist(latestRef.current); }}>Réessayer la sauvegarde</button>
    </div>}
    {view === "PROJECT" && active ? <ProtocolDesignerWorkspace key={`${active.key}:${generation}`} initialSession={active.session}
      traceCaptureConfiguration={traceCaptureConfiguration} onSessionChange={persist}
      onLeaveWorkspace={leave} onEditAdministration={() => { if (!error) setView("ADMIN"); }} onNewProject={newProject} />
      : <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-8">
        {view === "ADMIN" && current ? <ProjectAdministrationForm metadata={metadata} profile={profile} projectId={current.projectId} onSave={saveMetadata}
          onCancel={() => { if (savedRef.current) open(savedRef.current); }} />
          : view === "PROFILE" ? <ResearcherProfileForm profile={profile} onCancel={() => setView("LIST")} onSave={(next) => {
            if (boot.profileError) { setError(boot.profileError); return; }
            try { window.localStorage.setItem(RESEARCHER_PROFILE_STORAGE_KEY, JSON.stringify(next)); setProfile(next); setView("LIST"); }
            catch (failure) { setError(String(failure)); }
          }} /> : <div className="mx-auto max-w-5xl space-y-6">
            <header><p className="text-xs font-semibold tracking-[.2em] text-primary">NOXIA · PROTOCOL DESIGNER</p><h1 className="mt-2 text-3xl font-bold">Mes projets de recherche</h1>
              <p className="mt-3 max-w-3xl text-sm text-muted-foreground">Vos projets et conversations sont enregistrés dans ce navigateur. Vous pouvez les fermer et les reprendre ici. Cette démonstration locale ne synchronise pas les appareils et ne dispose pas d’un compte authentifié.</p>
              <button type="button" onClick={() => setView("PROFILE")} className={`${buttonClass} mt-4`}>Mon profil et mon organisation</button>
            </header>
            {list.unreadable.length > 0 && <p role="alert" className="rounded-xl border border-amber-400 p-4 text-sm">{list.unreadable.length} sauvegarde(s) illisible(s) sont conservées sans remplacement. Leur contenu nécessite une récupération avant réouverture.</p>}
            {boot.profileError && <p role="alert">{boot.profileError}</p>}
            <form onSubmit={(e) => { e.preventDefault(); newProject(); }} className="rounded-2xl border bg-background p-5">
              <label htmlFor="new-project-title" className="font-medium">Nouveau projet — titre temporaire</label>
              <div className="mt-3 flex flex-wrap gap-3"><input id="new-project-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder="Par exemple : myocardite et suivi" className="min-h-11 min-w-0 flex-1 rounded-lg border bg-background px-3" />
                <button type="submit" disabled={Boolean(error)} className={`${buttonClass} bg-primary text-primary-foreground`}>Créer un projet</button></div>
              <p className="mt-2 text-xs text-muted-foreground">Vous pourrez préciser le titre et les informations administratives plus tard. La science sera soumise à votre confirmation.</p>
            </form>
            <section className="grid gap-4 sm:grid-cols-2" aria-label="Projets enregistrés">{list.projects.map((saved) => <article key={saved.key} className="rounded-2xl border bg-background p-5">
              <h2 className="text-lg font-semibold">{saved.session.workspace?.title ?? "Projet sans titre"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{saved.session.project ? `Projet confirmé · version ${saved.session.project.revision}` : "Conversation préparatoire · aucune science adoptée"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{saved.session.runtimeTurns.filter((t) => t.role === "USER").length} messages · {saved.session.documents.projections.length} versions documentaires</p>
              <button type="button" disabled={Boolean(error)} onClick={() => open(saved)} className={`${buttonClass} mt-4`}>Ouvrir {saved.session.workspace?.title ?? "le projet"}</button>
            </article>)}</section>
          </div>}
      </main>}
  </>;
}
