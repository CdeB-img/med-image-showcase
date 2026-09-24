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
const pendingConfirmVariants = ["oui je valide", "oui", "valide", "ça me convient", "d'accord", "ok on garde ça", "c'est parfait", "je retiens ça"];

describe("natural confirmation while the real workspace Working Draft is pending", () => {
  it.each(pendingConfirmVariants)("adopts the source-bound pending proposal once for %s, persists and reloads", async confirmation => {
    expect(readNaturalCandidateDecision(confirmation)).toMatchObject({ act: "CONFIRM", qualified: false });
    const { view, backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    expect(savedProject()?.workingDraft?.readyReview).toBeFalsy();
    send(confirmation);
    await waitFor(() => expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(2));
    expect(savedProject()?.project).toBeNull();
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.project?.confirmationDecision.status).toBe("ADOPTED"));
    const adopted = savedProject()!;
    expect(adopted.project?.versionId).toBeTruthy();
    expect(adopted.project?.canonicalBackboneStatus).toBe("PRJ_OWNED_CANONICAL_PROJECT_BACKBONE_ACTIVE");
    expect(adopted.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === confirmation)).toHaveLength(1);
    expect(adopted.entries.filter(entry => entry.kind === "TEXT" && entry.role === "USER" && entry.content === confirmation)).toHaveLength(1);
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

  it("does not bind a pending assent to the later document request", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    send("genere les documents");
    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByText(/Votre confirmation n’a pas été appliquée/)).toBeInTheDocument());
    expect(savedProject()?.project).toBeNull();
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });

  it("does not adopt twice when the same whole-scope assent is repeated while pending", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    send("oui je valide");
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.project?.confirmationDecision.status).toBe("ADOPTED"));
    expect(savedProject()?.project?.revision).toBe(1);
    expect(savedProject()?.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === "oui je valide")).toHaveLength(1);
  });

  it("keeps Project empty and reports a failed background preparation", async () => {
    const { backgroundStarted, release } = setUp(true);
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByText(/Votre confirmation n’a pas été appliquée/)).toBeInTheDocument());
    expect(savedProject()?.project).toBeNull();
  });

  it("cannot adopt into a different session if the workspace changes during preparation", async () => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    fireEvent.click(screen.getByRole("button", { name: "← Mes projets" }));
    await act(async () => { release(); });
    expect(localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe("LIST");
    expect(savedProject()?.project).toBeNull();
  });

  it.each(["finalement je refuse et je veux modifier le critère principal", "non, je refuse cette proposition"])(
    "invalidates the pending confirmation when the user changes course: %s", async change => {
    const { backgroundStarted, release } = setUp();
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send("oui je valide");
    send(change);
    await act(async () => { release(); });
    await waitFor(() => expect(screen.getByText(/Votre confirmation n’a pas été appliquée/)).toBeInTheDocument());
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

  it("confirms only the prior proposal and retains a clearly separate scientific continuation", async () => {
    const { backgroundStarted, release } = setUp();
    const mixed = "oui je valide. ce sera en France";
    expect(readNaturalCandidateDecision(mixed)).toMatchObject({ act: "CONFIRM", qualified: true, separableContinuation: true });
    send(DOMAINS[0].text);
    await screen.findByText("LOCAL_SYNTHETIC — étude ECV et âge proposée, sans adoption.");
    await backgroundStarted;
    send(mixed);
    expect(savedProject()?.project).toBeNull();
    await act(async () => { release(); });
    await waitFor(() => expect(savedProject()?.project?.confirmationDecision.status).toBe("ADOPTED"));
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => request.currentProject?.revision === 1
      && request.conversation.turns.at(-1)?.content === mixed && !request.prepareWorkingDraft)).toBe(true));
    await waitFor(() => expect(savedProject()?.workingDraft?.readyReview?.contribution.scientificContent.candidateObjects
      .some(object => object.content.includes("en France"))).toBe(true));
    expect(savedProject()?.project?.revision).toBe(1);
    expect(JSON.stringify(savedProject()?.project)).not.toContain("France");
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
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => request.conversation.turns.at(-1)?.content === mixed)).toBe(true));
    await act(async () => { release(); });
    expect(savedProject()?.project).toBeNull();
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(0);
  });
});
