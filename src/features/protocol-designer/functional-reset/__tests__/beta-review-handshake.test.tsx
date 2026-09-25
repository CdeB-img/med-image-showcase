import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import { acceptWorkingDraftUpdate, prepareContinuousWorkingDraft, prepareWorkingDraftRequest } from "../continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("beta review handshake", () => {
  it("persists the latest four-turn review and its bot invitation after a shared explicit option premise", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const session = createFunctionalResetSession();
    const userTurns = [DOMAINS[0].text,
      "Ce sera en France, avec des adultes répartis par décennies et sans diabète, HTA ou tabagisme actif.",
      "Il faudra une ordonnance et un passage au laboratoire pour tous les volontaires.",
      "oui je retiens l'ensemble de tes suggestions"];
    session.runtimeTurns = userTurns.flatMap((content, index) => [
      { turnId: `u${index + 1}`, role: "USER" as const, content, createdAt: session.createdAt },
      { turnId: `a${index + 1}`, role: "NOXIA" as const, content: `LOCAL_SYNTHETIC — proposition ${index + 1}.`, createdAt: session.createdAt },
    ]);
    const request = { apiVersion: "1.0.0" as const,
      conversation: { conversationId: session.conversationId, language: "fr" as const, turns: session.runtimeTurns },
      currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true };
    const packet = prepareWorkingDraftRequest(request);
    const proposal = controlledStudyProposal(packet.inputDigest, DOMAINS[0]);
    for (const option of proposal.arbitrations[0].options) option.atomRefs.push("endpoint");
    const update = { requestType: "STUDY_UPDATE" as const, proposal,
      explicitDecisions: [{ atomRef: "endpoint", sourceTurnRef: "u4", quote: userTurns[3] }],
      inferredAtomRefs: [], rejectedAtomRefs: [] };
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const workingDraft = prepareContinuousWorkingDraft(session, composition, update, packet.inputDigest);
    expect(workingDraft.failure).toBeNull();
    expect(workingDraft.sourceUserTurnRef).toBe("u4");
    let saved: FunctionalResetSession = { ...session, studyProposal: composition, workingDraft };
    const mount = () => render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    const view = mount();
    await waitFor(() => expect(saved.entries.filter(entry => entry.kind === "TEXT" && entry.reviewInvitation)).toHaveLength(1));
    expect(saved.project).toBeNull();
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
    view.unmount();
    persistFunctionalResetSession(localStorage, saved);
    saved = loadFunctionalResetSession(localStorage);
    mount();
    expect(screen.getAllByTestId("project-review-invitation")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
  });
  it("diagnoses the canonical click on a larger review", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const session = createFunctionalResetSession();
    session.runtimeTurns = [
      { turnId: "u1", role: "USER", content: DOMAINS[0].text, createdAt: session.createdAt },
      { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — proposition de travail.", createdAt: session.createdAt },
    ];
    const request = { apiVersion: "1.0.0" as const, conversation: { conversationId: session.conversationId, language: "fr" as const, turns: session.runtimeTurns }, currentProject: null,
      evaluatePersistentDelta: false, prepareWorkingDraft: true };
    const proposal = controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest, DOMAINS[0]);
    proposal.atoms.find(atom => atom.ref === "eligibility")!.content = "Vérifier avant l’examen l’absence de contre-indication à l’IRM selon les règles de sécurité applicables; la procédure exacte reste à définir.";
    for (const atom of proposal.atoms.slice(-15)) atom.status = "OPEN_DECISION";
    // Reproduce the observed review size while retaining the same canonical
    // eligibility projection that caused the real button failure.
    for (const ref of ["sex", "height", "weight", "bmi", "bp", "history", "renal"]) {
      const index = proposal.atoms.findIndex(atom => atom.ref === ref);
      proposal.atoms.splice(index, 1);
    }
    const update = { requestType: "STUDY_UPDATE" as const, proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] };
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const workingDraft = prepareContinuousWorkingDraft(session, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    expect(workingDraft.readyReview).toBeTruthy();
    let saved: FunctionalResetSession = { ...session, studyProposal: composition, workingDraft };
    const view = render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    expect(screen.getByTestId("project-finalization-card")).toHaveTextContent("24 décisions prêtes à confirmer");
    expect(screen.getByTestId("project-finalization-card")).toHaveTextContent("15 points restent à définir");
    await waitFor(() => expect(saved.entries.filter(entry => entry.kind === "TEXT" && entry.reviewInvitation)).toHaveLength(1));
    expect(saved.project).toBeNull();
    const invitation = saved.entries.find(entry => entry.kind === "TEXT" && entry.reviewInvitation);
    expect(invitation?.kind).toBe("TEXT");
    if (invitation?.kind === "TEXT") expect(invitation.reviewInvitation?.candidateRef)
      .toBe(workingDraft.readyReview?.contribution.identity.contributionId);
    const button = screen.getByRole("button", { name: "Valider ces choix" });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    expect(saved.project?.projectId).toBe(session.projectId);
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
    expect(Number(screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ }).getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByTestId("project-document-action").querySelector("button")).toBeEnabled());
    view.unmount();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    expect(screen.getAllByTestId("project-review-invitation")).toHaveLength(1);
    expect(saved.project?.revision).toBe(1);
  });
});
