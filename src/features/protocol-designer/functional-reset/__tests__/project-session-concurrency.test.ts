import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { createProjectSession, createProjectSessionWriter, deleteProjectSession, readProjectSessions, renameProjectSession,
  saveProjectSession, ACTIVE_PROJECT_STORAGE_KEY } from "../project-workspace-storage";
import { encodeSessionStorage } from "../session-storage-codec";
import { behaviorContribution, behaviorItem, behaviorTurn, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import { installTestProjectSessionLocks } from "./project-session-lock-fixture";

beforeEach(() => { localStorage.clear(); installTestProjectSessionLocks(); });
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const prepared = async () => {
  const saved = createProjectSession(localStorage, "CURRENT_STRUCTURAL_INVARIANT — native PRJ persistence");
  const contribution = richStudyContribution();
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: saved.session.projectId,
    authority: saved.session.projectAuthority, confirmedAt: saved.session.createdAt });
  saved.session = { ...saved.session, project };
  saved.raw = await saveProjectSession(localStorage, saved, saved.session);
  const candidates = ["A", "B", "C"].map(label => {
    const turn = behaviorTurn(`turn:f1-${label}`, `Ajouter la mesure complémentaire ${label}`);
    const update = behaviorContribution({ contributionId: `contribution:f1-${label}`, turns: [turn],
      candidateObjects: [behaviorItem({ itemId: `measurement:f1-${label}`, proposedType: "MEASUREMENT",
        content: `Mesure complémentaire ${label}`, turnId: turn.turnId })] });
    const nextProject = confirmResearchProjectContribution({ contribution: update, current: project, projectId: saved.session.projectId,
      authority: saved.session.projectAuthority, confirmedAt: "2026-10-05T09:00:00.000Z" });
    return { ...saved.session, project: nextProject, workspace: { ...saved.session.workspace!, title: label, revision: 1 },
      updatedAt: "2026-10-05T09:00:00.000Z" };
  });
  return { saved, candidates, v1: JSON.stringify(project) };
};

describe("CURRENT_STRUCTURAL_INVARIANT — cross-context compare/validate/write", () => {
  it.each([[0, 1], [1, 0], [0, 1, 2]])("serializes divergent contexts in scheduling order %j without lost updates", async (...order) => {
    const { saved, candidates, v1 } = await prepared();
    const locks = installTestProjectSessionLocks();
    const result = await Promise.allSettled(order.map(index => saveProjectSession(localStorage, { ...saved }, candidates[index])));
    expect(result.filter(value => value.status === "fulfilled")).toHaveLength(1);
    for (const rejected of result.slice(1)) expect(rejected).toMatchObject({ status: "rejected", reason: { code: "PROJECT_SESSION_STALE_BASE" } });
    const reopened = readProjectSessions(localStorage).projects[0];
    expect(reopened.session.project).toEqual(candidates[order[0]].project);
    expect(reopened.session.workspace?.title).toBe(candidates[order[0]].workspace.title);
    expect(reopened.session.project?.revision).toBe(2);
    expect(JSON.stringify(saved.session.project)).toBe(v1);
    expect(locks.request.mock.calls.map(call => [call[0], call[1].mode])).toEqual(order.map(() => [`noxia:project-session:${saved.key}`, "exclusive"]));
    // A losing context observes the winner on reload, without implicit adoption.
    expect(readProjectSessions(localStorage).projects[0].raw).toBe(localStorage.getItem(saved.key));
  });
  it("keeps an exact duplicate idempotent with one write and no duplicate Project version", async () => {
    const { saved, candidates } = await prepared();
    const write = vi.spyOn(Storage.prototype, "setItem");
    const [a, b] = await Promise.all([saveProjectSession(localStorage, { ...saved }, candidates[0]), saveProjectSession(localStorage, { ...saved }, candidates[0])]);
    expect(a).toBe(b);
    expect(write).toHaveBeenCalledTimes(1);
    expect(readProjectSessions(localStorage).projects[0].session.project?.revision).toBe(2);
  });
  it("fails closed without the primitive or when acquisition fails; no read/write fallback", async () => {
    const { saved, candidates } = await prepared();
    vi.stubGlobal("navigator", new Proxy(navigator, { get: (target, key) => key === "locks" ? undefined : Reflect.get(target, key, target) }));
    const write = vi.spyOn(Storage.prototype, "setItem");
    await expect(saveProjectSession(localStorage, saved, candidates[0])).rejects.toMatchObject({ code: "PROJECT_SESSION_LOCK_UNAVAILABLE" });
    const locks = installTestProjectSessionLocks();
    locks.request.mockRejectedValueOnce(new DOMException("LOCK_DENIED", "SecurityError"));
    await expect(saveProjectSession(localStorage, saved, candidates[0])).rejects.toThrow("LOCK_DENIED");
    expect(write).not.toHaveBeenCalled();
    expect(localStorage.getItem(saved.key)).toBe(saved.raw);
  });
  it("releases the critical section on storage failure, allowing a later explicit save", async () => {
    const { saved, candidates } = await prepared();
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("QUOTA_FAILURE"); });
    await expect(saveProjectSession(localStorage, saved, candidates[0])).rejects.toThrow("QUOTA_FAILURE");
    expect(await saveProjectSession(localStorage, saved, candidates[1])).toBe(encodeSessionStorage(candidates[1]));
  });
  it("covers rename and delete with the same critical section as adoption", async () => {
    const { saved, candidates } = await prepared();
    const locks = installTestProjectSessionLocks();
    const result = await Promise.allSettled([saveProjectSession(localStorage, saved, candidates[0]),
      renameProjectSession(localStorage, saved, "STALE_RENAME"), deleteProjectSession(localStorage, saved)]);
    expect(result.map(value => value.status)).toEqual(["fulfilled", "rejected", "rejected"]);
    expect(locks.request.mock.calls.every(call => call[0] === `noxia:project-session:${saved.key}`)).toBe(true);
    expect(readProjectSessions(localStorage).projects[0].session.project?.revision).toBe(2);
  });
  it("orders one host's saves and keeps navigation-pointer failure auxiliary", async () => {
    const { saved, candidates } = await prepared();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, raw) {
      if (key === ACTIVE_PROJECT_STORAGE_KEY) throw new Error("POINTER_ONLY_FAILURE");
      original.call(this, key, raw);
    });
    const writer = createProjectSessionWriter(localStorage, saved);
    const result = await Promise.all([writer.save(candidates[0]), writer.save({ ...candidates[0], updatedAt: "2026-10-05T10:00:00.000Z" })]);
    expect(result).toEqual([{ scientificPersisted: true, navigationPointer: "FAILED" }, { scientificPersisted: true, navigationPointer: "FAILED" }]);
    expect(writer.current().session.project).toBe(candidates[0].project);
    expect(writer.current().raw).toBe(localStorage.getItem(saved.key));
    expect((await writer.save(saved.session))).toMatchObject({ scientificPersisted: false, error: { code: "PROJECT_SESSION_STALE_BASE" } });
    expect(readProjectSessions(localStorage).projects[0].session.project?.revision).toBe(2);
  });
  it("never rebases a losing host or retries its failed candidate automatically", async () => {
    const { saved, candidates } = await prepared();
    const a = createProjectSessionWriter(localStorage, { ...saved }), b = createProjectSessionWriter(localStorage, { ...saved });
    expect(await a.save(candidates[0])).toMatchObject({ scientificPersisted: true });
    const locks = installTestProjectSessionLocks();
    expect(await b.save(candidates[1])).toMatchObject({ scientificPersisted: false, error: { code: "PROJECT_SESSION_STALE_BASE" } });
    expect(locks.request).toHaveBeenCalledTimes(1);
    expect(b.current().raw).toBe(saved.raw);
    expect(readProjectSessions(localStorage).projects[0].session.workspace?.title).toBe("A");
  });
  it("binds decoded content to the exact single-read base even during a competing write", async () => {
    const { saved, candidates } = await prepared();
    const get = Storage.prototype.getItem;
    let reads = 0;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function(key) {
      if (key === saved.key && ++reads === 1) {
        const old = get.call(this, key);
        this.setItem(key, encodeSessionStorage(candidates[0]));
        return old;
      }
      return get.call(this, key);
    });
    const reopened = readProjectSessions(localStorage).projects[0];
    expect(reads).toBe(1);
    expect(reopened.raw).toBe(saved.raw);
    expect(reopened.session.project?.revision).toBe(1);
    await expect(saveProjectSession(localStorage, reopened, candidates[1])).rejects.toMatchObject({ code: "PROJECT_SESSION_STALE_BASE" });
  });
});
