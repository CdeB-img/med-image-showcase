import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import type { ProductBridgeRequest } from "../../product-bridge";
import { ACTIVE_PROJECT_STORAGE_KEY, readProjectSessions } from "../project-workspace-storage";
import { readNaturalCandidateDecision } from "../natural-conversation-policy";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import ProjectWorkspace from "../ProjectWorkspace";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
beforeEach(() => { vi.spyOn(console, "debug").mockImplementation(() => {}); });
afterEach(() => { cleanup(); bridge.mockReset(); localStorage.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

const response = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } }));
const send = (text: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};
const savedProject = () => readProjectSessions(localStorage).projects[0]?.session;
const setUp = (backgroundFailure = false) => {
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
  vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  let release!: () => void;
  let started!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const backgroundStarted = new Promise<void>(resolve => { started = resolve; });
  const provider = vi.fn<typeof fetch>(async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    if (!payload.instructions.includes("Tu prépares en arrière-plan"))
      return response("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    started();
    await held;
    if (backgroundFailure) throw new Error("LOCAL_SYNTHETIC_BACKGROUND_FAILURE");
    const packet = JSON.parse(payload.input);
    const proposal = controlledStudyProposal(packet.contextDigest, DOMAINS[0]);
    proposal.atoms.find(atom => atom.ref === "eligibility")!.content = "Vérifier avant l’examen l’absence de contre-indication à l’IRM selon les règles de sécurité applicables; la procédure exacte reste à définir.";
    for (const atom of proposal.atoms.slice(-15)) atom.status = "OPEN_DECISION";
    for (const ref of ["sex", "height", "weight", "bmi", "bp", "history", "renal"]) {
      proposal.atoms.splice(proposal.atoms.findIndex(atom => atom.ref === ref), 1);
    }
    if (String(payload.input).includes("ce sera en France"))
      proposal.atoms.find(atom => atom.ref === "practical")!.content = "Étude conduite en France";
    return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal,
      explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
  });
  bridge.mockImplementation(async (request: ProductBridgeRequest) => {
    if (request.documentDraftRequest) throw new Error("DOC_MUST_NOT_BE_CALLED");
    const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: null,
      openAiApiKey: "LOCAL_SYNTHETIC", chatRuntime: "TERRA", autonomousProjectBuild: true,
      fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    if (result.status !== 200) throw new Error(JSON.stringify(result.body));
    return result.body;
  });
  const view = render(<HelmetProvider><ProjectWorkspace /></HelmetProvider>);
  return { view, provider, backgroundStarted, release };
};

const simpleAcquiescence = [
  "oui", "oui je valide", "je valide", "valide", "on valide", "ça me va", "ça me convient",
  "d'accord", "ok", "ok on garde ça", "on garde ça", "c'est bon", "c'est parfait", "je retiens ça", "ça marche",
];
const pendingConfirmVariants = ["oui je valide", "oui", "ça me convient", "d'accord"];

describe("natural confirmation while the real workspace Working Draft is pending", () => {
  it.each(pendingConfirmVariants)("keeps early assent visible and waits for a current review: %s", async confirmation => {
    expect(readNaturalCandidateDecision(confirmation)).toMatchObject({ act: "CONFIRM", qualified: false });
    const { view, backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    expect(savedProject()?.workingDraft?.readyReview).toBeFalsy();
    send(confirmation);
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(2));
    expect(savedProject()?.project).toBeNull();
    expect(screen.getByText("Structuration du projet en cours…")).toBeInTheDocument();
    expect(savedProject()?.entries.filter(entry => entry.kind === "TEXT" && entry.role === "USER" && entry.content === confirmation)).toHaveLength(1);
    const receipt = savedProject()?.conversationConfirmationReceipts?.[0];
    expect(receipt).toMatchObject({ sessionId: savedProject()?.sessionId, classification: "CONFIRM",
      userTurnId: [...savedProject()?.runtimeTurns ?? []].reverse().find(turn => turn.role === "USER")?.turnId,
      targetAssistantTurnId: savedProject()?.runtimeTurns.find(turn => turn.role === "NOXIA")?.turnId,
      baseProjectId: savedProject()?.projectId, baseProjectVersion: null, baseProjectDigest: null });
    expect(screen.getByTestId("conversation-confirmation-receipt")).toHaveTextContent("Accord enregistré");
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => !request.prepareWorkingDraft
      && request.conversation.turns.at(-1)?.content === confirmation)).toBe(true));
    await act(async () => { release(); });
    await waitFor(() => expect(screen.getAllByTestId("project-review-invitation")).toHaveLength(1));
    expect(savedProject()?.project).toBeNull();
    expect(savedProject()?.conversationConfirmationReceipts?.[0]).toEqual(receipt);
    expect(screen.queryByText(/Votre confirmation n’a pas été appliquée/)).not.toBeInTheDocument();
    expect(savedProject()?.entries.filter(entry => entry.kind === "TEXT" && entry.role === "USER" && entry.content === confirmation)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(savedProject()?.project?.confirmationDecision.status).toBe("ADOPTED"));
    const adopted = savedProject()!;
    expect(adopted.project?.revision).toBe(1);
    expect(adopted.conversationConfirmationReceipts?.[0]).toEqual(receipt);
    expect(screen.queryByTestId("conversation-confirmation-receipt")).not.toBeInTheDocument();
    expect(Number(screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ }).getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
    const version = adopted.project?.versionId;
    view.unmount();
    render(<HelmetProvider><ProjectWorkspace /></HelmetProvider>);
    await waitFor(() => expect(savedProject()?.project?.versionId).toBe(version));
    expect(savedProject()?.project?.confirmationDecision.status).toBe("ADOPTED");
    expect(screen.getByTestId("project-cockpit-counts")).not.toHaveTextContent("0 élément confirmé");
    expect(Number(screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ }).getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  });

  it("does not treat a later document request as assent to a pending review", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(2));
    const receipt = savedProject()?.conversationConfirmationReceipts?.[0];
    expect(receipt?.targetAssistantTurnId).toBeTruthy();
    send("genere les documents");
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(3));
    expect(savedProject()?.project).toBeNull();
    expect(savedProject()?.conversationConfirmationReceipts?.[0]).toEqual(receipt);
    expect(savedProject()?.conversationConfirmationReceipts?.[0]?.targetAssistantTurnId).toBe(receipt?.targetAssistantTurnId);
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });

  it("does not adopt on repeated assent before review", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(2));
    send("oui je valide");
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === "oui je valide")).toHaveLength(2));
    expect(savedProject()?.project).toBeNull();
  });

  it("binds a natural assent to the invited current review only after Chat has seen it", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await backgroundStarted;
    await act(async () => { release(); });
    await screen.findByTestId("project-review-invitation");
    const invitation = savedProject()?.entries.find(entry => entry.kind === "TEXT" && entry.reviewInvitation);
    expect(invitation?.kind).toBe("TEXT");
    if (invitation?.kind === "TEXT") expect(invitation.reviewInvitation?.sessionId).toBe(savedProject()?.sessionId);
    send("ça me convient");
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => !request.prepareWorkingDraft
      && request.conversation.turns.at(-1)?.content === "ça me convient")).toBe(true));
    await waitFor(() => expect(savedProject()?.project?.revision).toBe(1));
    expect(savedProject()?.entries.filter(entry => entry.kind === "TEXT" && entry.role === "USER" && entry.content === "ça me convient")).toHaveLength(1);
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });

  it("rehydrates one exact review invitation before the user confirms", async () => {
    const { view, backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await backgroundStarted;
    await act(async () => { release(); });
    await screen.findByTestId("project-review-invitation");
    const binding = savedProject()?.entries.find(entry => entry.kind === "TEXT" && entry.reviewInvitation);
    expect(binding?.kind).toBe("TEXT");
    view.unmount();
    render(<HelmetProvider><ProjectWorkspace /></HelmetProvider>);
    expect(screen.getAllByTestId("project-review-invitation")).toHaveLength(1);
    expect(savedProject()?.entries.filter(entry => entry.kind === "TEXT" && entry.reviewInvitation)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(savedProject()?.project?.revision).toBe(1));
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });

  it("does not adopt when the invited user refuses", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await backgroundStarted;
    await act(async () => { release(); });
    await screen.findByTestId("project-review-invitation");
    send("non, je préfère revoir le critère principal");
    await waitFor(() => expect(savedProject()?.runtimeTurns.some(turn => turn.role === "USER"
      && turn.content === "non, je préfère revoir le critère principal")).toBe(true));
    expect(savedProject()?.project).toBeNull();
  });

  it("keeps Project empty without a global confirmation error after failed background preparation", async () => {
    const { backgroundStarted, release } = setUp(true);
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    await waitFor(() => expect(savedProject()?.conversationConfirmationReceipts).toHaveLength(1));
    const receipt = savedProject()?.conversationConfirmationReceipts?.[0];
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.workingDraftFailure).toBeTruthy());
    expect(savedProject()?.conversationConfirmationReceipts?.[0]).toEqual(receipt);
    expect(screen.queryByText(/Votre confirmation n’a pas été appliquée/)).not.toBeInTheDocument();
    expect(savedProject()?.project).toBeNull();
  });

  it("cannot adopt into a different session if the workspace changes during preparation", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: "← Mes projets" }));
    await act(async () => { release(); });
    expect(localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe("LIST");
    expect(savedProject()?.project).toBeNull();
  });

  it.each(["finalement je refuse et je veux modifier le critère principal", "non, je refuse cette proposition"])(
    "keeps the later refusal visible without a silent adoption: %s", async change => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(2));
    send(change);
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.runtimeTurns.some(turn => turn.role === "USER" && turn.content === change)).toBe(true));
    expect(savedProject()?.project).toBeNull();
  });

  it.each(simpleAcquiescence)("classifies unambiguous natural acquiescence: %s", text => {
    expect(readNaturalCandidateDecision(text)).toMatchObject({ act: "CONFIRM", qualified: false });
  });

  it.each(["OUI !", "ÇA ME CONVIENT.", "D’ACCORD", "OK, on garde ça !", "C'EST PARFAIT…"])(
    "preserves case, accent and punctuation equivalence: %s", text => {
      expect(readNaturalCandidateDecision(text)).toMatchObject({ act: "CONFIRM", qualified: false });
    });

  it.each(["non", "non ça ne me convient pas", "je préfère autre chose", "ne valide pas", "attends",
    "valide pas", "oui mais non", "oui ?", "ok si on change le critère"])(
    "never infers confirmation from refusal, condition or question: %s", text => {
      expect(readNaturalCandidateDecision(text)?.act).not.toBe("CONFIRM");
    });

  it("preserves a scientific continuation without premature adoption", async () => {
    const { backgroundStarted, release } = setUp();
    const mixed = "oui je valide. ce sera en France";
    expect(readNaturalCandidateDecision(mixed)).toMatchObject({ act: "CONFIRM", qualified: true, separableContinuation: true });
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send(mixed);
    expect(savedProject()?.project).toBeNull();
    await waitFor(() => expect(savedProject()?.conversationConfirmationReceipts).toHaveLength(1));
    expect(savedProject()?.conversationConfirmationReceipts?.[0]).toMatchObject({ classification: "CONFIRM",
      qualified: true, separableContinuation: true });
    await act(async () => { release(); });
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => request.conversation.turns.at(-1)?.content === mixed
      && !request.prepareWorkingDraft)).toBe(true));
    expect(savedProject()?.project).toBeNull();
    expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === mixed)).toHaveLength(1);
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });

  it.each(["oui je valide. je refuse finalement", "oui je valide. je préfère deux centres"])(
    "does not mark a later correction as a separable addition: %s", text => {
      expect(readNaturalCandidateDecision(text)).toMatchObject({ act: "CONFIRM", qualified: true, separableContinuation: false });
    });

  it("does not silently adopt a qualified confirmation with an incompatible change", async () => {
    const { backgroundStarted, release } = setUp();
    const mixed = "ça me convient mais je préfère finalement deux centres";
    expect(readNaturalCandidateDecision(mixed)).toMatchObject({ act: "CONFIRM", qualified: true, separableContinuation: false });
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send(mixed);
    await waitFor(() => expect(savedProject()?.runtimeTurns.some(turn => turn.role === "USER" && turn.content === mixed)).toBe(true));
    expect(savedProject()?.conversationConfirmationReceipts).toHaveLength(0);
    expect(screen.queryByTestId("conversation-confirmation-receipt")).not.toBeInTheDocument();
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => request.conversation.turns.at(-1)?.content === mixed)).toBe(true));
    await act(async () => { release(); });
    expect(savedProject()?.project).toBeNull();
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });
});
