import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import type { ProductBridgeRequest } from "../../product-bridge";
import { createFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
const bridge = vi.hoisted(() => vi.fn());
const read = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(),
  requestProtocolDesignerBridge: bridge, readWorkingDraftPreparation: read }));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); bridge.mockReset(); read.mockReset(); localStorage.clear(); });
const response = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } }));
const send = (text: string) => { fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };
const setup = () => {
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  let saved = createFunctionalResetSession(); let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const provider = vi.fn<typeof fetch>(async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response("LOCAL_SYNTHETIC — réponse scientifique conservée.");
    await held;
    const context = JSON.parse(payload.input);
    return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal: controlledStudyProposal(context.contextDigest, DOMAINS[0]),
      explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
  });
  bridge.mockImplementation(async (request: ProductBridgeRequest) => {
    const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: null,
      openAiApiKey: "LOCAL_SYNTHETIC", chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl: provider,
      providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    if (result.status !== 200) throw new Error(JSON.stringify(result.body));
    return result.body;
  });
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
    onSessionChange={(next: FunctionalResetSession) => { saved = next; return true; }} /></HelmetProvider>);
  return { state: () => saved, provider, release, wdCalls: () => bridge.mock.calls.filter(([request]) => request.prepareWorkingDraft) };
};
const initialChat = async () => { send(DOMAINS[0].text); await screen.findByText("LOCAL_SYNTHETIC — réponse scientifique conservée.");
  await waitFor(() => expect(screen.queryByText("NOXIA réfléchit…")).not.toBeInTheDocument()); };

describe("explicit Project preparation — real bridge/owners, synthetic provider only", () => {
  it.each(["oui je valide", "Quelles études existent ?", "Je précise mon projet."])("keeps ordinary conversation without heavy automatic work: %s", async text => {
    const h = setup(); await initialChat(); send(text);
    await waitFor(() => expect(h.state().runtimeTurns.filter(t => t.role === "NOXIA")).toHaveLength(2));
    expect(h.wdCalls()).toHaveLength(0); expect(h.state().project).toBeNull();
    expect(bridge.mock.calls.some(([r]) => r.documentDraftRequest)).toBe(false);
  });
  it("captures one preparation on repeated clicks and preserves it during later conversation", async () => {
    const h = setup(); await initialChat();
    const button = screen.getByRole("button", { name: "Préparer la mise à jour du projet" });
    fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(h.wdCalls()).toHaveLength(1));
    const request = JSON.stringify(h.wdCalls()[0][0]);
    send("Y a-t-il des études comparables ?");
    await waitFor(() => expect(h.state().runtimeTurns.filter(t => t.role === "USER")).toHaveLength(2));
    await act(async () => h.release());
    await screen.findByTestId("project-finalization-card");
    expect(h.wdCalls()).toHaveLength(1); expect(JSON.stringify(h.wdCalls()[0][0])).toBe(request);
    expect(h.state().project).toBeNull();
    expect(screen.getByTestId("preparation-newer-conversation")).toBeInTheDocument();
    expect(bridge.mock.calls.some(([r]) => r.documentDraftRequest)).toBe(false);
  });
  it("never turns assent after a ready review into adoption", async () => {
    const h = setup(); await initialChat(); fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await act(async () => h.release()); await screen.findByTestId("project-finalization-card"); send("je valide");
    await waitFor(() => expect(h.state().runtimeTurns.filter(t => t.role === "USER")).toHaveLength(2));
    expect(h.state().project).toBeNull(); expect(h.wdCalls()).toHaveLength(1);
  });
});
