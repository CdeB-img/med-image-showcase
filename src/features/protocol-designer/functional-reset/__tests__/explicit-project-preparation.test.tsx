import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import type { ProductBridgeRequest } from "../../product-bridge";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
const bridge = vi.hoisted(() => vi.fn());
const read = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(),
  requestProtocolDesignerBridge: bridge, readWorkingDraftPreparation: read, ensureServerProjectSnapshot: vi.fn(async () => undefined) }));
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks(); bridge.mockReset(); read.mockReset(); localStorage.clear(); });
const response = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } }));
const send = (text: string) => { fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };
const setup = (outcome: "VALID" | "NO_CHANGE" | "CYCLE" | "TRUNCATED" | "TIMEOUT" = "VALID") => {
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  let saved = createFunctionalResetSession(); let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const provider = vi.fn<typeof fetch>(async (_url, init) => {
    const payload = JSON.parse(String(init?.body));
    if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response("LOCAL_SYNTHETIC — réponse scientifique conservée.");
    await held;
    if (outcome === "TIMEOUT") { const e = new Error("synthetic timeout"); e.name = "AbortError"; throw e; }
    if (outcome === "TRUNCATED") return new Response(JSON.stringify({ status: "incomplete", incomplete_details: {reason:"max_output_tokens"}, output:[], usage:{input_tokens:100,output_tokens:24000,total_tokens:24100} }));
    if (outcome === "NO_CHANGE") return response(JSON.stringify({ requestType: "INSUFFICIENT", proposal:null, explicitDecisions:[],inferredAtomRefs:[],rejectedAtomRefs:[] }));
    const context = JSON.parse(payload.input);
    const proposal = controlledStudyProposal(context.contextDigest, DOMAINS[0]);
    if(outcome === "CYCLE") { proposal.atoms[0].dependsOn=[proposal.atoms[1].ref]; proposal.atoms[1].dependsOn=[proposal.atoms[0].ref]; }
    return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal,
      explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
  });
  bridge.mockImplementation(async (request: ProductBridgeRequest) => {
    const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: null,
      openAiApiKey: "LOCAL_SYNTHETIC", chatRuntime: "TERRA", autonomousProjectBuild: true, fetchImpl: provider,
      providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    if (result.status !== 200) {
      const {ProductBridgeClientError}=await import("../../product-bridge-client");
      const body=result.body as {error?:{code?:string;details?:string[]};observability?:never};
      throw new ProductBridgeClientError(body.error?.code ?? "WD_FAILED", "Échec synthétique", null, body.observability, body.error?.details?.[0] ?? null);
    }
    return result.body;
  });
  const view = render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
    onSessionChange={(next: FunctionalResetSession) => { saved = next; return true; }} /></HelmetProvider>);
  return { view, state: () => saved, provider, release, wdCalls: () => bridge.mock.calls.filter(([request]) => request.prepareWorkingDraft) };
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
  it("adopts the explicit review exactly once, persists it and never calls DOC", async () => {
    const h=setup();await initialChat();fireEvent.click(screen.getByRole("button",{name:"Préparer la mise à jour du projet"}));
    await act(async()=>h.release());await screen.findByTestId("project-finalization-card");
    const button=screen.getByRole("button",{name:"Valider ces choix"});fireEvent.click(button);fireEvent.click(button);
    await waitFor(()=>expect(h.state().project?.revision).toBe(1));
    expect(h.state().workingDraftPreparations?.at(-1)?.decision).toBe("ADOPTED");
    persistFunctionalResetSession(localStorage,h.state());
    expect(loadFunctionalResetSession(localStorage).project?.projectDigest).toBe(h.state().project?.projectDigest);
    expect(bridge.mock.calls.some(([r])=>r.documentDraftRequest)).toBe(false);
  });
  it.each(["NO_CHANGE","CYCLE","TRUNCATED","TIMEOUT"] as const)("persists an honest terminal outcome: %s",async outcome=>{
    const h=setup(outcome);await initialChat();fireEvent.click(screen.getByRole("button",{name:"Préparer la mise à jour du projet"}));
    await act(async()=>h.release());
    await waitFor(()=>expect(h.state().workingDraftPreparations?.at(-1)?.status).not.toBe("PREPARING"));
    expect(h.state().workingDraftPreparations?.at(-1)?.status).toBe(outcome==="NO_CHANGE"?"NO_CHANGE":outcome==="TIMEOUT"?"UNKNOWN/INTERRUPTED":"FAILED");
    expect(screen.queryByTestId("project-finalization-card")).toBeNull();expect(h.state().project).toBeNull();
    persistFunctionalResetSession(localStorage,h.state());expect(loadFunctionalResetSession(localStorage).workingDraftPreparations?.at(-1)?.status).toBe(h.state().workingDraftPreparations?.at(-1)?.status);
    expect(h.wdCalls()).toHaveLength(1);
  });
  it.each(["oui", "ça me convient", "oui je valide. ce sera en France"])("retains receipt, checkpoint and explicit review across early assent: %s",async text=>{
    const h=setup();await initialChat();fireEvent.click(screen.getByRole("button",{name:"Préparer la mise à jour du projet"}));
    await waitFor(()=>expect(h.wdCalls()).toHaveLength(1));const before=JSON.stringify(h.state().workingDraftPreparations?.[0].checkpoint);
    send(text);await waitFor(()=>expect(h.state().runtimeTurns.filter(t=>t.role==="NOXIA")).toHaveLength(2));
    await act(async()=>h.release());await screen.findByTestId("project-finalization-card");
    expect(JSON.stringify(h.state().workingDraftPreparations?.[0].checkpoint)).toBe(before);
    expect(h.state().conversationConfirmationReceipts).toHaveLength(1);expect(h.state().project).toBeNull();
    expect(screen.getByRole("button",{name:"Valider ces choix"})).toBeDisabled();
    persistFunctionalResetSession(localStorage,h.state());expect(loadFunctionalResetSession(localStorage).conversationConfirmationReceipts).toHaveLength(1);
  });
  it.each(["Je précise deux centres", "Je corrige l'âge à 40 ans"])("preserves a later change without silently applying the old scope: %s",async text=>{
    const h=setup();await initialChat();fireEvent.click(screen.getByRole("button",{name:"Préparer la mise à jour du projet"}));
    const checkpoint=JSON.stringify(h.state().workingDraftPreparations?.[0].checkpoint);
    send(text);await waitFor(()=>expect(h.state().runtimeTurns.filter(t=>t.role==="NOXIA")).toHaveLength(2));
    await act(async()=>h.release());await screen.findByTestId("project-finalization-card");
    expect(JSON.stringify(h.state().workingDraftPreparations?.[0].checkpoint)).toBe(checkpoint);
    expect(screen.getByTestId("preparation-newer-conversation")).toHaveTextContent(text);
    expect(screen.getByRole("button",{name:"Valider ces choix"})).toBeDisabled();expect(h.state().project).toBeNull();
  });
  it("keeps a refused checkpoint visible but cannot override the known refusal",async()=>{
    const h=setup();await initialChat();fireEvent.click(screen.getByRole("button",{name:"Préparer la mise à jour du projet"}));
    send("non, je refuse cette proposition");await waitFor(()=>expect(h.state().runtimeTurns.filter(t=>t.role==="NOXIA")).toHaveLength(2));
    await act(async()=>h.release());await screen.findByTestId("project-finalization-card");
    expect(h.state().workingDraftPreparations?.[0].postCutoffBlocker).toContain("REFUSAL_OR_CORRECTION");
    expect(screen.getByRole("button",{name:"Valider ces choix"})).toBeDisabled();expect(h.state().project).toBeNull();
  });
  it("requires actual per-group review after a later question and permits explicit compatible adoption",async()=>{
    const h=setup();await initialChat();fireEvent.click(screen.getByRole("button",{name:"Préparer la mise à jour du projet"}));
    send("Existe-t-il une bibliographie ?");await waitFor(()=>expect(h.state().runtimeTurns.filter(t=>t.role==="NOXIA")).toHaveLength(2));
    await act(async()=>h.release());await screen.findByTestId("project-finalization-card");
    expect(screen.getByRole("button",{name:"Valider ces choix"})).toBeDisabled();
    for(const checkbox of screen.getAllByRole("checkbox"))fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button",{name:"Valider ces choix"}));
    await waitFor(()=>expect(h.state().project?.revision).toBe(1));
    expect(h.wdCalls()).toHaveLength(1);expect(bridge.mock.calls.some(([r])=>r.documentDraftRequest)).toBe(false);
  });

});
