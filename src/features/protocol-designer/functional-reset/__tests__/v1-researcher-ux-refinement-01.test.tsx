import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesigner from "@/pages/ProtocolDesigner";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  ACTIVE_PROJECT_STORAGE_KEY, createProjectSession, deleteProjectSession, readProjectSessions,
  renameProjectSession, saveProjectSession, type SavedProjectSession,
} from "../project-workspace-storage";

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const save = (title: string): SavedProjectSession => {
  const project = createProjectSession(localStorage, title);
  project.raw = saveProjectSession(localStorage, project, project.session);
  return project;
};

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("PROTOCOL_DESIGNER_V1_RESEARCHER_UX_REFINEMENT_01", () => {
  it("PROJECT_RENAME_PERSISTS without changing technical identity or project content", () => {
    const original = save("Myocardite");
    const renamed = renameProjectSession(localStorage, original, "Myocardite post-CEC", "2026-09-15T10:00:00.000Z");
    const reopened = readProjectSessions(localStorage).projects[0]!;
    expect(reopened.session.workspace?.title).toBe("Myocardite post-CEC");
    expect(reopened.session.sessionId).toBe(original.session.sessionId);
    expect(reopened.session.projectId).toBe(original.session.projectId);
    expect(reopened.session.entries).toEqual(original.session.entries);
    expect(renamed.raw).toBe(localStorage.getItem(original.key));
  });

  it("PROJECT_DELETE_ISOLATION removes one complete session and does not reuse its Project ID", () => {
    const first = save("Myocardite");
    const second = save("Neurologie");
    deleteProjectSession(localStorage, first);
    const remaining = readProjectSessions(localStorage).projects;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.session.projectId).toBe(second.session.projectId);
    const replacement = createProjectSession(localStorage, "Nouveau projet");
    expect(replacement.session.projectId).not.toBe(first.session.projectId);
    expect(localStorage.getItem(second.key)).toBe(second.raw);
  });

  it("PROJECT_DELETE_CONFIRMATION supports cancel and explicit destructive confirmation", () => {
    save("Myocardite");
    save("Neurologie");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
    renderDemo();
    fireEvent.click(screen.getByLabelText("Actions pour Myocardite"));
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer le projet" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Supprimer « Myocardite » ?" });
    expect(dialog).toHaveTextContent("conversation");
    expect(dialog).toHaveTextContent("documents et versions");
    fireEvent.click(within(dialog).getByRole("button", { name: "Annuler" }));
    expect(readProjectSessions(localStorage).projects).toHaveLength(2);
    fireEvent.click(screen.getByLabelText("Actions pour Myocardite"));
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer le projet" })[0]!);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Supprimer" }));
    expect(screen.queryByRole("heading", { name: "Myocardite" })).not.toBeInTheDocument();
    expect(readProjectSessions(localStorage).projects.map((project) => project.session.workspace?.title)).toEqual(["Neurologie"]);
  });

  it("PROJECT_RENAME_PERSISTS through both the project list and current-project header", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
    const mounted = renderDemo();
    fireEvent.click(screen.getByLabelText("Actions pour Myocardite"));
    fireEvent.click(screen.getByRole("button", { name: "Renommer" }));
    fireEvent.change(screen.getByLabelText("Nom du projet"), { target: { value: "Myocardite post-CEC" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    const card = screen.getByRole("heading", { name: "Myocardite post-CEC" }).closest("article")!;
    fireEvent.click(within(card).getByRole("button", { name: "Ouvrir" }));
    fireEvent.click(screen.getByRole("button", { name: "Renommer Myocardite post-CEC" }));
    fireEvent.change(screen.getByLabelText("Nom du projet"), { target: { value: "Myocardite CEC" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(screen.getByRole("heading", { level: 1, name: "Myocardite CEC" })).toBeInTheDocument();
    expect(readProjectSessions(localStorage).projects[0]!.session.projectId).toBe(saved.session.projectId);
    mounted.unmount();
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, "LIST");
    renderDemo();
    expect(screen.getByRole("heading", { name: "Myocardite CEC" })).toBeInTheDocument();
  });

  it("PROJECT_HEADER_SHOWS_CURRENT_PROJECT / TOP_NAVIGATION_AVAILABLE", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    expect(screen.getByRole("heading", { level: 1, name: "Myocardite" })).toBeInTheDocument();
    expect(screen.getByText("Conception de l’étude")).toBeInTheDocument();
    const nav = screen.getByTestId("project-top-navigation");
    expect(within(nav).getByRole("button", { name: "← Mes projets" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Profil / organisation" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Renommer Myocardite" })).toBeInTheDocument();
    expect(nav).toHaveClass("sticky");
  });

  it("STANDARD_NO_INTERNAL_JARGON / TECHNICAL_DIAGNOSTIC_NOT_PRIMARY_NAV", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    const workspace = screen.getByTestId("functional-reset-workspace");
    expect(workspace).toHaveAttribute("data-product-mode", "STANDARD");
    expect(workspace).not.toHaveTextContent(/Research Project|Session ID|Conversation ID|Project ID|digest|\bQRY\b|\bTRACE\b/);
    expect(screen.queryByRole("button", { name: "Expert" })).not.toBeInTheDocument();
    const menu = screen.getByLabelText("Plus d’options").closest("details") as HTMLDetailsElement;
    expect(menu.open).toBe(false);
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Diagnostic technique" }));
    expect(screen.getByRole("heading", { level: 1, name: "Diagnostic technique" })).toBeInTheDocument();
  });

  it("PROJECT_PROGRESS_COLLAPSIBLE / CHAT_COMPOSER_REMAINS_STICKY", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    const details = screen.getByTestId("project-progress-details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(within(details).getByText("Voir le détail de l’étude")).toBeInTheDocument();
    expect(screen.getByTestId("project-cockpit-counts")).toHaveTextContent("0 élément confirmé · 0 point à préciser");
    expect(screen.getByTestId("conversation-composer")).toHaveClass("sticky", "bottom-0");
  });

  it("grows and shrinks the composer, then scrolls internally above its viewport-bound maximum", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    vi.stubGlobal("innerHeight", 800);
    renderDemo();
    const composer = screen.getByLabelText("Votre message") as HTMLTextAreaElement;
    let contentHeight = 55;
    Object.defineProperty(composer, "scrollHeight", { configurable: true, get: () => contentHeight });
    expect(composer.rows).toBe(3);
    expect(composer).toHaveClass("resize-none", "md:resize-y", "min-w-0");
    fireEvent.change(composer, { target: { value: "Première proposition" } });
    const restingHeight = Number.parseFloat(composer.style.height);
    expect(restingHeight).toBeGreaterThanOrEqual(60);
    contentHeight = 190;
    fireEvent.change(composer, { target: { value: "Une proposition détaillée sur plusieurs lignes" } });
    expect(Number.parseFloat(composer.style.height)).toBe(190);
    expect(composer.style.overflowY).toBe("hidden");
    contentHeight = 80;
    fireEvent.change(composer, { target: { value: "Texte raccourci" } });
    expect(Number.parseFloat(composer.style.height)).toBe(80);
    contentHeight = 900;
    fireEvent.change(composer, { target: { value: "Paragraphe long et détaillé" } });
    expect(Number.parseFloat(composer.style.height)).toBe(Number.parseFloat(composer.style.maxHeight));
    expect(Number.parseFloat(composer.style.maxHeight)).toBeLessThanOrEqual(800 * 0.38);
    expect(composer.style.overflowY).toBe("auto");
    vi.stubGlobal("innerHeight", 480);
    fireEvent(window, new Event("resize"));
    expect(Number.parseFloat(composer.style.maxHeight)).toBeLessThanOrEqual(480 * 0.38);
    expect(Number.parseFloat(composer.style.height)).toBeLessThanOrEqual(Number.parseFloat(composer.style.maxHeight));
  });

  it("keeps an explicit desktop resize while writing and resumes auto sizing after clearing", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    const composer = screen.getByLabelText("Votre message") as HTMLTextAreaElement;
    let contentHeight = 100;
    Object.defineProperty(composer, "scrollHeight", { configurable: true, get: () => contentHeight });
    fireEvent.change(composer, { target: { value: "Texte initial" } });
    expect(Number.parseFloat(composer.style.height)).toBe(100);
    vi.spyOn(composer, "getBoundingClientRect").mockReturnValue({ height: 220 } as DOMRect);
    fireEvent.pointerUp(composer);
    contentHeight = 120;
    fireEvent.change(composer, { target: { value: "Texte prolongé" } });
    expect(Number.parseFloat(composer.style.height)).toBe(220);
    contentHeight = 300;
    fireEvent.change(composer, { target: { value: "Texte encore plus long" } });
    expect(Number.parseFloat(composer.style.height)).toBe(220);
    expect(composer.style.overflowY).toBe("auto");
    contentHeight = 50;
    fireEvent.change(composer, { target: { value: "" } });
    expect(Number.parseFloat(composer.style.height)).toBeGreaterThanOrEqual(60);
    expect(Number.parseFloat(composer.style.height)).toBeLessThan(220);
  });

  it("keeps Enter to send and Shift+Enter for a newline without changing focus or content", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    const composer = screen.getByLabelText("Votre message") as HTMLTextAreaElement;
    const submit = vi.spyOn(composer.form!, "requestSubmit").mockImplementation(() => undefined);
    fireEvent.change(composer, { target: { value: "Question longue" } });
    composer.focus();
    expect(fireEvent.keyDown(composer, { key: "Enter", shiftKey: true })).toBe(true);
    expect(submit).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(composer, { key: "Enter", shiftKey: false })).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(composer);
    expect(composer.value).toBe("Question longue");
  });

  it("shows the page-scroll return only below the threshold and honors reduced motion", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    vi.stubGlobal("scrollY", 0);
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    renderDemo();
    expect(screen.queryByRole("button", { name: "Revenir en haut" })).not.toBeInTheDocument();
    vi.stubGlobal("scrollY", 600);
    fireEvent.scroll(window);
    const button = screen.getByRole("button", { name: "Revenir en haut" });
    expect(screen.getByTestId("project-top-navigation")).toContainElement(button);
    expect(button).toHaveClass("h-11", "w-11");
    button.focus();
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });
    vi.stubGlobal("scrollY", 0);
    fireEvent.scroll(window);
    expect(screen.queryByRole("button", { name: "Revenir en haut" })).not.toBeInTheDocument();
  });

  it("FUTURE_STEPS_VISIBLE_DISABLED", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    const continuum = screen.getByRole("navigation", { name: "Parcours longitudinal du projet" });
    for (const name of ["Revues À venir", "Interprétation des résultats À venir", "Publication À venir"]) {
      expect(within(continuum).getByRole("button", { name })).toBeDisabled();
    }
    expect(continuum).not.toHaveTextContent("suite envisagée");
  });

  it("PROFILE_TOP_NAVIGATION returns to projects and to the current project", () => {
    const saved = save("Myocardite");
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, saved.key);
    renderDemo();
    fireEvent.click(screen.getByRole("button", { name: "Profil / organisation" }));
    const nav = screen.getByTestId("project-top-navigation");
    expect(within(nav).getByRole("button", { name: "← Mes projets" })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Myocardite" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Profil réutilisable" })).toBeInTheDocument();
  });

  it("LANDING_REWORK presents the concise value proposition and WIP continuum", () => {
    render(<HelmetProvider><MemoryRouter><ProtocolDesigner /></MemoryRouter></HelmetProvider>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("De votre question de recherche à un protocole scientifique sourcé");
    expect(screen.getAllByRole("link", { name: /Commencer un projet/ }).length).toBeGreaterThan(0);
    expect(document.body).not.toHaveTextContent(/NOXIA vous aide|NOXIA vous accompagne|NOXIA vous permet/);
    for (const name of ["Revues", "Interprétation des résultats", "Publication"]) {
      expect(screen.getByText(name).closest("li")).toHaveTextContent("À venir");
    }
  });
});
