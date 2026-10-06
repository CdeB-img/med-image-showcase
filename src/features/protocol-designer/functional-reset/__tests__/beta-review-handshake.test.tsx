import { explicitTestSave } from "./legacy-persistence-test-adapter";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, recordConversationConfirmationReceipt, type FunctionalResetSession } from "../session";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest } from "../continuous-project-build";
import {captureProjectPreparation,addProjectPreparation,consumeProjectPreparation} from "../project-preparation-lifecycle";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";

afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("beta review handshake", () => {
  it("persists the frozen four-turn review after a shared explicit option premise", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let session = createFunctionalResetSession();
    const userTurns = [DOMAINS[0].text,
      "Ce sera en France, avec des adultes répartis par décennies et sans diabète, HTA ou tabagisme actif.",
      "Dans cette étude ECV chez les volontaires sains, il faudra une ordonnance et un passage au laboratoire pour tous les volontaires.",
      "oui je retiens l'ensemble de tes suggestions"];
    session.runtimeTurns = userTurns.flatMap((content, index) => [
      { turnId: `u${index + 1}`, role: "USER" as const, content, createdAt: session.createdAt },
      { turnId: `noxia-turn:00000000-0000-4000-8000-00000000000${index+1}`, role: "NOXIA" as const, content: `LOCAL_SYNTHETIC — proposition ${index + 1}.`, createdAt: session.createdAt },
    ]);
    const allTurns=session.runtimeTurns;
    session=recordConversationConfirmationReceipt({...session,runtimeTurns:allTurns.slice(0,-2)},allTurns.at(-2)!,
      {act:"CONFIRM",qualified:false,separableContinuation:false});
    session.runtimeTurns=allTurns;
    const preparation=captureProjectPreparation(session);
    const request=preparation.checkpoint!.request;
    const packet = prepareWorkingDraftRequest(request);
    const proposal = controlledStudyProposal(packet.inputDigest, DOMAINS[0]);
    for (const option of proposal.arbitrations[0].options) option.atomRefs.push("endpoint");
    const update = { requestType: "STUDY_UPDATE" as const, proposal,
      explicitDecisions: [{ atomRef: "endpoint", sourceTurnRef: "u4", quote: userTurns[3] }],
      inferredAtomRefs: [], rejectedAtomRefs: [] };
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    let saved=consumeProjectPreparation(addProjectPreparation(session,preparation),preparation.checkpoint!.preparationId,
      {workingDraftUpdate:update,workingStudyProposal:composition});
    const workingDraft=saved.workingDraft!;
    expect(workingDraft.failure).toBeNull();
    expect(workingDraft.sourceUserTurnRef).toBe("u4");
    const mount = () => render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={explicitTestSave(next => { saved = next; return true; })} /></HelmetProvider>);
    const view = mount();
    expect(screen.getByTestId("project-finalization-card")).toBeVisible();
    expect(saved.entries.filter(entry=>entry.kind==="TEXT" && entry.reviewInvitation)).toHaveLength(1);
    expect(saved.workingDraftPreparations?.[0].status).toBe("READY_FOR_REVIEW");
    expect(saved.project).toBeNull();
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
    view.unmount();
    persistFunctionalResetSession(localStorage, saved);
    saved = loadFunctionalResetSession(localStorage,undefined,true);
    mount();
    expect(screen.getAllByTestId("project-finalization-card")).toHaveLength(1);
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
      { turnId: "noxia-turn:00000000-0000-4000-8000-000000000001", role: "NOXIA", content: "LOCAL_SYNTHETIC — proposition de travail.", createdAt: session.createdAt },
    ];
    const preparation=captureProjectPreparation(session);
    const request=preparation.checkpoint!.request;
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
    let saved:FunctionalResetSession=consumeProjectPreparation(addProjectPreparation(session,preparation),preparation.checkpoint!.preparationId,
      {workingDraftUpdate:update,workingStudyProposal:composition});
    const workingDraft=saved.workingDraft!;
    expect(workingDraft.readyReview).toBeTruthy();
    const view = render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={explicitTestSave(next => { saved = next; return true; })} /></HelmetProvider>);
    // CURRENT_STRUCTURAL_INVARIANT: diagnostic counts belong to Expert, not Standard.
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Diagnostic technique" }));
    expect(screen.getByTestId("project-finalization-card")).toHaveTextContent("24 décisions prêtes à confirmer");
    expect(screen.getByTestId("project-finalization-card")).toHaveTextContent("15 points restent à définir");
    expect(saved.workingDraftPreparations?.[0].status).toBe("READY_FOR_REVIEW");
    expect(saved.project).toBeNull();
    const invitation=saved.entries.find(entry=>entry.kind==="TEXT" && entry.reviewInvitation);
    expect(invitation?.kind==="TEXT" ? invitation.reviewInvitation?.candidateRef : null)
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
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={explicitTestSave(next => { saved = next; return true; })} /></HelmetProvider>);
    expect(screen.getAllByTestId("project-review-invitation")).toHaveLength(1);
    expect(saved.project?.revision).toBe(1);
  });
});
