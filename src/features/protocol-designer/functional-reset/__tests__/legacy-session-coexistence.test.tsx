import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { createFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY, loadFunctionalResetSession } from "../session";
import { readProjectSessions, ACTIVE_PROJECT_STORAGE_KEY, isProjectSessionKey } from "../project-workspace-storage";
import { LEGACY_V3_STORAGE_KEY } from "../legacy-session-reader";
import { richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import ProjectWorkspace from "../ProjectWorkspace";

vi.mock("../ProtocolDesignerWorkspace", () => ({ default: () => <div>Current runtime opened</div> }));
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
const legacy = () => {
  const session = createFunctionalResetSession();
  const project = confirmResearchProjectContribution({ contribution: richStudyContribution(), current: null,
    projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.createdAt });
  const value: Record<string, unknown> = { ...session, project,
    entries: [{ id: "legacy:1", kind: "TEXT", role: "USER", content: "Contenu historique exact : âge 20–89 ans." }],
    workspace: { title: "Ancien projet" }, documents: { ...session.documents, projections: [{ historical: "not a v4 archive" }] } };
  delete value.contentEpoch;
  delete value.documentArchive;
  return { raw: JSON.stringify(value), session, project };
};

describe("v3 historical read / v4 coexistence — no promotion or provider", () => {
  it("discovers and rereads v3 without modifying bytes or creating a v4 Project", () => {
    const { raw, project } = legacy(); localStorage.setItem(LEGACY_V3_STORAGE_KEY, raw);
    const writes = vi.spyOn(Storage.prototype, "setItem");
    for (let i = 0; i < 2; i++) {
      const found = readProjectSessions(localStorage, true);
      expect(found.projects).toEqual([]);
      expect(found.legacy).toMatchObject([{ projectId: project.projectId, projectVerified: true,
        entries: [{ content: "Contenu historique exact : âge 20–89 ans." }] }]);
      expect(found.unreadableLegacy).toEqual([]);
    }
    expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEGACY_V3_STORAGE_KEY)).toBe(raw);
    expect(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBeNull();
    expect(() => loadFunctionalResetSession(localStorage, LEGACY_V3_STORAGE_KEY, true)).toThrow("SESSION_UNREADABLE");
  });
  it("reopens the legacy conversation in an inert read-only surface, including after reload", () => {
    const { raw } = legacy(); localStorage.setItem(LEGACY_V3_STORAGE_KEY, raw);
    const fetch = vi.spyOn(globalThis, "fetch"); const writes = vi.spyOn(Storage.prototype, "setItem");
    const mounted = render(<ProjectWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Consulter la conversation historique" }));
    expect(screen.getByText("Contenu historique exact : âge 20–89 ans.")).toBeInTheDocument();
    expect(screen.queryByText("Current runtime opened")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enregistrer" })).not.toBeInTheDocument();
    mounted.unmount(); render(<ProjectWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Consulter la conversation historique" }));
    expect(screen.getByText("Contenu historique exact : âge 20–89 ans.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled(); expect(writes).not.toHaveBeenCalled();
    expect(localStorage.getItem(LEGACY_V3_STORAGE_KEY)).toBe(raw);
  });
  it("keeps v4 readable independently and never deduplicates/moves a legacy identity", () => {
    const { raw, session } = legacy(); localStorage.setItem(`${LEGACY_V3_STORAGE_KEY}::project::${session.sessionId}`, raw);
    const current = createFunctionalResetSession(); localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(current));
    const found = readProjectSessions(localStorage, true);
    expect(found.projects).toHaveLength(1); expect(found.legacy).toHaveLength(1);
    expect(found.projects[0].session.sessionId).toBe(current.sessionId);
    expect(found.legacy[0].sessionId).toBe(session.sessionId);
    expect(isProjectSessionKey(LEGACY_V3_STORAGE_KEY)).toBe(false);
  });
  it("honors the old active pointer without opening a different current Project or writing a new pointer", () => {
    const { raw } = legacy(); localStorage.setItem(LEGACY_V3_STORAGE_KEY, raw);
    localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(createFunctionalResetSession()));
    localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, LEGACY_V3_STORAGE_KEY);
    const writes = vi.spyOn(Storage.prototype, "setItem"); render(<ProjectWorkspace />);
    expect(screen.getByText("Contenu historique exact : âge 20–89 ans.")).toBeInTheDocument();
    expect(screen.queryByText("Current runtime opened")).not.toBeInTheDocument();
    expect(writes).not.toHaveBeenCalled();
  });
  it.each(["wrong epoch", "foreign project", "tampered project", "unsupported contract"])("fails closed on %s without erasing the original", reason => {
    const { raw } = legacy(); const value = JSON.parse(raw);
    if (reason === "wrong epoch") value.contentEpoch = "DOC_ARCHIVE_CLEAN_V1";
    if (reason === "foreign project") value.projectId = "foreign";
    if (reason === "tampered project") value.project.projectDigest = "ke1-forged";
    if (reason === "unsupported contract") value.contractVersion = "1.2.0";
    const stored = JSON.stringify(value); localStorage.setItem(LEGACY_V3_STORAGE_KEY, stored);
    const found = readProjectSessions(localStorage, true);
    expect(found.legacy).toEqual([]); expect(found.unreadableLegacy).toEqual([LEGACY_V3_STORAGE_KEY]);
    expect(localStorage.getItem(LEGACY_V3_STORAGE_KEY)).toBe(stored);
  });
});
