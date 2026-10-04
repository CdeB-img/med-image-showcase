import { afterEach, describe, expect, it, vi } from "vitest";
import { createFunctionalResetSession, saveFunctionalResetWorkspaceSession } from "../session";
import { createProjectSession, saveProjectSession } from "../project-workspace-storage";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
describe("one scientific persistence verdict for every Workspace caller", () => {
  it("returns an exact failure before scientific commit and preserves previous bytes", () => {
    const saved = createProjectSession(localStorage, "LOCAL_SYNTHETIC");
    saved.raw = saveProjectSession(localStorage, saved, saved.session);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("LOCAL_SYNTHETIC", "QuotaExceededError"); });
    const result = saveFunctionalResetWorkspaceSession(localStorage, saved.session, session => {
      saveProjectSession(localStorage, saved, session);
      return { scientificPersisted: true, navigationPointer: "UPDATED" };
    });
    expect(result.scientificPersisted).toBe(false);
    expect(localStorage.getItem(saved.key)).toBe(saved.raw);
  });
  it.each(["UPDATED", "FAILED"] as const)("does not conflate committed science with pointer %s", navigationPointer => {
    const result = { scientificPersisted: true as const, navigationPointer };
    expect(saveFunctionalResetWorkspaceSession(localStorage, createFunctionalResetSession(), () => result)).toBe(result);
  });
  it("commits a standalone session and normalizes the existing host seam once", () => {
    const session = createFunctionalResetSession();
    expect(saveFunctionalResetWorkspaceSession(localStorage, session).scientificPersisted).toBe(true);
    expect(saveFunctionalResetWorkspaceSession(localStorage, session, () => false).scientificPersisted).toBe(false);
    expect(saveFunctionalResetWorkspaceSession(localStorage, session, () => { throw new Error("LOCAL_SYNTHETIC"); }).scientificPersisted).toBe(false);
  });
});
