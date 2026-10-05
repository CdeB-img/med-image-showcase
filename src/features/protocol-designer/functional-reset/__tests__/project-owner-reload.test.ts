import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmResearchProjectContribution, researchProjectOwnerDigest } from "@/features/research-project-construction";
import * as proposalConsumer from "../study-proposal-standard";
import { parseVerifiedProjectSnapshot } from "../../../../../server/protocol-designer-project-snapshot";
import { COLCHICINE_INITIAL, makeFunctionalResetContribution } from "./functional-reset-fixtures";
import { createFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import { readProjectSessions } from "../project-workspace-storage";

const adopted = () => {
  const session = createFunctionalResetSession();
  const project = confirmResearchProjectContribution({
    contribution: makeFunctionalResetContribution([{ turnId: "turn:reload", role: "USER", content: COLCHICINE_INITIAL, createdAt: session.updatedAt }]),
    current: null, projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.updatedAt,
  });
  return { ...session, project };
};
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("CURRENT_STRUCTURAL_INVARIANT — owner integrity at the first reload boundary", () => {
  it("restores the current native adoption identically to the server snapshot verification", () => {
    const session = adopted();
    persistFunctionalResetSession(localStorage, session);
    const restored = loadFunctionalResetSession(localStorage, undefined, true);
    expect(restored.project).toEqual(session.project);
    expect(parseVerifiedProjectSnapshot(restored.project, session.sessionId)).toEqual(session.project);
    expect(readProjectSessions(localStorage).unreadable).toEqual([]);
  });

  it.each(["digest", "sections", "canonical"])("rejects corrupted %s before downstream rehydration without replacing stored evidence", field => {
    const session = adopted();
    if (field === "digest") session.project.projectDigest = "ke1-corrupted";
    if (field === "sections") session.project.sections[0].label += " tampered";
    if (field === "canonical") session.project.canonicalState!.revision += 1;
    persistFunctionalResetSession(localStorage, session);
    const before = localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY);
    const consumer = vi.spyOn(proposalConsumer, "rehydrateStudyProposal");
    expect(() => loadFunctionalResetSession(localStorage, undefined, true)).toThrow("PROJECT_OWNER_DIGEST_MISMATCH");
    expect(consumer).not.toHaveBeenCalled();
    expect(readProjectSessions(localStorage)).toEqual({ projects: [], unreadable: [FUNCTIONAL_RESET_STORAGE_KEY] });
    expect(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(before);
  });

  it("does not treat a current projection with its canonical state removed as legacy", () => {
    const session = adopted();
    session.project.canonicalState = undefined;
    session.project.projectDigest = researchProjectOwnerDigest(session.project);
    persistFunctionalResetSession(localStorage, session);
    expect(() => loadFunctionalResetSession(localStorage, undefined, true)).toThrow("PROJECT_OWNER_CANONICAL_STATE_MISSING");
  });

  it("LEGACY_COMPATIBILITY — verifies the original representation before existing owner migration and rebinds the digest", () => {
    const session = adopted();
    session.project.canonicalState = undefined;
    session.project.canonicalBackboneStatus = undefined;
    session.project.projectDigest = researchProjectOwnerDigest(session.project);
    persistFunctionalResetSession(localStorage, session);
    const original = localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY);
    const project = loadFunctionalResetSession(localStorage, undefined, true).project!;
    expect(project.versionId).toBe(session.project.versionId);
    expect(project.confirmationDecision).toEqual(session.project.confirmationDecision);
    expect(project.sections).toEqual(session.project.sections);
    expect(project.projectDigest).toBe(researchProjectOwnerDigest(project));
    expect(parseVerifiedProjectSnapshot(project, session.sessionId)).toEqual(project);
    expect(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(original);
  });
});
