import { afterEach, describe, expect, it, vi } from "vitest";
import { createFunctionalResetSession, saveFunctionalResetWorkspaceSession, type SessionSave } from "../session";
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
  it("commits a standalone session without a host and preserves thrown failures", () => {
    const session = createFunctionalResetSession();
    expect(saveFunctionalResetWorkspaceSession(localStorage, session).scientificPersisted).toBe(true);
    expect(saveFunctionalResetWorkspaceSession(localStorage, session, () => { throw new Error("LOCAL_SYNTHETIC"); }).scientificPersisted).toBe(false);
  });
  it.each([true, false, undefined, {}, { scientificPersisted: true, navigationPointer: "INVALID" }])("rejects an unsupported host return instead of assuming persistence: %s", value => {
    const result = saveFunctionalResetWorkspaceSession(localStorage, createFunctionalResetSession(), (() => value) as SessionSave);
    expect(result).toMatchObject({ scientificPersisted: false });
    if (result.scientificPersisted === false) expect(result.error).toEqual(new Error("SESSION_PERSISTENCE_RESULT_INVALID"));
  });
});
