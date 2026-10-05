import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import * as documentOwner from "@/features/document-projection";
import { documentAdministrationFrom, emptyProjectAdministration } from "../project-administration";
import { createFunctionalResetSession, loadFunctionalResetSession } from "../session";
import { persistAdoptedProjectSession, refreshAdoptedProjectConsumers } from "../project-adoption-effects";
import { COLCHICINE_INITIAL, makeFunctionalResetContribution } from "./functional-reset-fixtures";

const upload = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), ensureServerProjectSnapshot: upload }));
const prepared = () => {
  const previous = createFunctionalResetSession();
  const project = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([
    { turnId: "turn:adoption-effects", role: "USER", content: COLCHICINE_INITIAL, createdAt: previous.createdAt },
  ]), current: null, projectId: previous.projectId, authority: previous.projectAuthority, confirmedAt: previous.createdAt });
  const administration = documentAdministrationFrom(previous.projectId, {
    title: "Colchicine après infarctus", revision: 0, administration: emptyProjectAdministration(),
  });
  return { previous, project, administration, recordedAt: previous.updatedAt };
};
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); upload.mockReset(); });

describe("CURRENT_STRUCTURAL_INVARIANT — explicit adoption effect result", () => {
  it("refreshes DOC then QRY through existing owners without mutating the adopted scientific state", () => {
    const input = prepared(), before = JSON.stringify(input.project);
    const result = refreshAdoptedProjectConsumers(input);
    expect(result.queryNavigation).toMatchObject({ projectRef: input.project.projectId,
      projectVersion: input.project.versionId, projectDigest: input.project.projectDigest });
    expect(JSON.stringify(input.project)).toBe(before);
    expect(upload).not.toHaveBeenCalled();
  });

  it("keeps the Project adoption independent of a DOC refresh failure", async () => {
    const input = prepared(), before = JSON.stringify(input.project);
    vi.spyOn(documentOwner, "refreshFunctionalResetDocumentPortfolio").mockImplementationOnce(() => { throw new Error("DOC_REFRESH_TEST_FAILURE"); });
    const consumers = refreshAdoptedProjectConsumers(input);
    const result = (await persistAdoptedProjectSession({ storage: localStorage, session: { ...input.previous, ...consumers, project: input.project },
      previousProject: null, uploadSnapshot: false }));
    expect(result.status).toBe("COMMITTED");
    expect(loadFunctionalResetSession(localStorage, undefined, true).project).toEqual(input.project);
    expect(JSON.stringify(input.project)).toBe(before);
    expect(upload).not.toHaveBeenCalled();
  });

  it("preserves the exact failed scientific verdict and never uploads on failed persistence", async () => {
    const input = prepared(), error = new Error("QUOTA_TEST_FAILURE"), save = vi.fn(() => ({ scientificPersisted: false as const, error }));
    expect((await persistAdoptedProjectSession({ storage: localStorage, session: { ...input.previous, project: input.project },
      previousProject: null, save, uploadSnapshot: true }))).toEqual({ status: "NOT_COMMITTED", error });
    expect(save).toHaveBeenCalledTimes(1);
    expect(upload).not.toHaveBeenCalled();
  });

  it.each(["UPDATED", "FAILED"] as const)("does not redefine a committed Project when pointer is %s and auxiliary upload fails", async navigationPointer => {
    const input = prepared(), order: string[] = [];
    const save = vi.fn(() => { order.push("SCIENTIFIC_PERSISTENCE"); return { scientificPersisted: true as const, navigationPointer }; });
    upload.mockImplementationOnce(async () => { order.push("AUXILIARY_UPLOAD"); throw new Error("SNAPSHOT_TEST_UNAVAILABLE"); });
    const result = (await persistAdoptedProjectSession({ storage: localStorage, session: { ...input.previous, project: input.project },
      previousProject: null, save, uploadSnapshot: true }));
    expect(result.status).toBe("COMMITTED");
    if (result.status !== "COMMITTED") throw new Error("COMMIT_EXPECTED");
    expect(await result.auxiliaryUpload).toBe("FAILED");
    expect(result.session.project).toBe(input.project);
    expect(order).toEqual(["SCIENTIFIC_PERSISTENCE", "AUXILIARY_UPLOAD"]);
    expect(save).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledTimes(1);
  });
  it("also classifies a synchronous auxiliary adapter failure after the scientific commit", async () => {
    const input = prepared();
    upload.mockImplementationOnce(() => { throw new Error("SYNCHRONOUS_AUXILIARY_FAILURE"); });
    const result = (await persistAdoptedProjectSession({ storage: localStorage, session: { ...input.previous, project: input.project },
      previousProject: null, uploadSnapshot: true }));
    expect(result.status).toBe("COMMITTED");
    if (result.status !== "COMMITTED") throw new Error("COMMIT_EXPECTED");
    expect(await result.auxiliaryUpload).toBe("FAILED");
    expect(loadFunctionalResetSession(localStorage, undefined, true).project).toEqual(input.project);
  });
});
