import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, act } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { handleProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { admitPublicProtocolDesignerRequest, resetPublicProtocolDesignerGuardForTests, publicProtocolDesignerGuardStateForTests } from "../../../../../server/protocol-designer-public-guard";
import { createMemoryProtocolDesignerGuardForTests, type PublicProtocolDesignerDurableGuard } from "../../../../../server/protocol-designer-durable-guard";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import ProjectWorkspace from "../ProjectWorkspace";
import { readProjectSessions } from "../project-workspace-storage";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import type { ProductBridgeRequest } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

// Only the remote provider is synthetic. UI, client, HTTP admission, financial
// guard, native parsing, owner validation and browser persistence are real.
const response = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } }));
const send = (text: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};
const wirePublicHandler = (provider: typeof fetch, durableGuard: PublicProtocolDesignerDurableGuard = createMemoryProtocolDesignerGuardForTests()) => {
  const requests: ProductBridgeRequest[] = [];
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (url, init) => {
    expect(url).toBe("/api/protocol-designer-bridge");
    const body = JSON.parse(String(init?.body)); requests.push(body);
    let status = 0, output: unknown;
    await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", origin: "https://noxia-imagerie.fr", host: "noxia-imagerie.fr" }, body }, {
      setHeader() {}, status(value) { status = value; return this; }, json(value) { output = value; },
    }, { NODE_ENV: "production", OPENAI_API_KEY: "LOCAL_SYNTHETIC", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" },
    { fetchImpl: provider, durableGuard });
    return new Response(JSON.stringify(output), { status, headers: { "content-type": "application/json" } });
  }));
  return requests;
};
const concurrentUiTestGuard = (): PublicProtocolDesignerDurableGuard => {
  let operation = 0;
  return {
    async prepareRequest() {
      operation += 1;
      const ref = `ui-concurrent-operation-${operation}`;
      return { admitted: true, admissionKey: ref, sessionKey: "ui-session", clientKey: "ui-client",
        clientRequestIdHash: ref, requestDigest: ref };
    },
    createBudgetedFetch(_context, fetchImpl = fetch) { return fetchImpl; },
    async completeRequest() {},
    async close() {},
  };
};
const mount = (initial = createFunctionalResetSession()) => {
  let saved = initial;
  const view = render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={initial} onSessionChange={next => {
    saved = next; return persistFunctionalResetSession(localStorage, next);
  }} /></HelmetProvider>);
  return { view, current: () => saved };
};
beforeEach(() => {
  resetPublicProtocolDesignerGuardForTests(); localStorage.clear();
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("independent Standard workspace through public admission", () => {
  it("exposes session exhaustion without a provider call or a duplicated pending turn", async () => {
    const initial = createFunctionalResetSession();
    for (let i = 0; i < 8; i++) expect(admitPublicProtocolDesignerRequest({ headers: {}, now: Date.now() - (8 - i) * 61_000,
      body: { observabilityContext: { sessionId: initial.sessionId } } }).admitted).toBe(true);
    const provider = vi.fn<typeof fetch>(); wirePublicHandler(provider); const workspace = mount(initial);
    send("Poursuivons le projet.");
    await waitFor(() => expect(workspace.current().entries.some(e => e.kind === "ERROR" && e.failureCode === "PUBLIC_SESSION_LIMITED")).toBe(true));
    expect(provider).not.toHaveBeenCalled(); expect(workspace.current().project).toBeNull();
    expect(loadFunctionalResetSession(localStorage).runtimeTurns).toHaveLength(1);
  });
  it.each([
    ["TIMEOUT", () => Promise.reject(new DOMException("synthetic", "AbortError"))],
    ["NETWORK_FAILURE", () => Promise.reject(new Error("synthetic network failure"))],
    ["INVALID_PROVIDER_JSON", () => Promise.resolve(new Response("not JSON"))],
    ["incomplete:max_output_tokens", () => Promise.resolve(new Response(JSON.stringify({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" } })))],
    ["rate_limit_exceeded", () => Promise.resolve(new Response(JSON.stringify({ error: { code: "rate_limit_exceeded" } }), { status: 429 }))],
    ["PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED", () => Promise.reject(new Error("PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED"))],
    ["PUBLIC_PROVIDER_DENIED_HARD_BUDGET", () => Promise.reject(new Error("PUBLIC_PROVIDER_DENIED_HARD_BUDGET"))],
  ] as const)("preserves %s internally, keeps the user turn and never starts background", async (code, result) => {
    const provider = vi.fn<typeof fetch>(result), requests = wirePublicHandler(provider), workspace = mount();
    send("Je souhaite comparer deux mesures sans supposer leur équivalence.");
    await screen.findByText(/La réponse conversationnelle n’a pas abouti/);
    await waitFor(() => expect(workspace.current().bridgeTraces.some(t => t.conversationFailure?.code === code)).toBe(true));
    expect(provider).toHaveBeenCalledTimes(1); expect(requests).toHaveLength(1);
    expect(workspace.current().runtimeTurns).toHaveLength(1);
    expect(workspace.current().project).toBeNull(); expect(workspace.current().workingDraft).toBeFalsy();
    expect(loadFunctionalResetSession(localStorage).runtimeTurns).toEqual(workspace.current().runtimeTurns);
  });

  it.each([
    "IRM de flux 4D après coarctation : association entre perte énergétique et pression à l'effort.",
    DOMAINS[2].text,
    DOMAINS[4].text,
  ])("retains Chat and disables obsolete review when later background fails (%#)", async (initialText) => {
    let preparations = 0;
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response("Discussion contrôlée intacte.");
      if (++preparations > 1) return response("invalid JSON");
      return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal: controlledStudyProposal(JSON.parse(payload.input).contextDigest, DOMAINS[1]),
        explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
    });
    const requests = wirePublicHandler(provider), workspace = mount();
    send(initialText); await waitFor(() => expect(workspace.current().workingDraft?.readyReview).toBeTruthy());
    const previous = workspace.current().studyProposal?.digest;
    send("Et si je garde seulement ce critère ?");
    await waitFor(() => expect(workspace.current().workingDraftFailure).toBeTruthy());
    expect(workspace.current().studyProposal?.digest).toBe(previous);
    expect(workspace.current().entries.filter(e => e.kind === "TEXT" && e.role === "NOXIA" && e.content === "Discussion contrôlée intacte.")).toHaveLength(2);
    expect(workspace.current().project).toBeNull(); expect(requests).toHaveLength(4);
    expect(loadFunctionalResetSession(localStorage).workingDraftFailure).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revoir les choix" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Préparer l’enregistrement" })).toBeDisabled();
    expect(workspace.current().pendingContribution).toBeNull();
  });

  it("reports browser storage failure after background and retries saving without a provider call", async () => {
    wirePublicHandler(vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response("Brouillon proposé, non adopté.");
      return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal: controlledStudyProposal(JSON.parse(payload.input).contextDigest, DOMAINS[1]),
        explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
    }));
    const original = Storage.prototype.setItem;
    let refuse = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
      if (refuse && String(value).includes('"readyReview":{')) throw new DOMException("synthetic full storage", "QuotaExceededError");
      return original.call(this, key, value);
    });
    render(<HelmetProvider><ProjectWorkspace /></HelmetProvider>);
    send(DOMAINS[1].text);
    await screen.findByText(/Enregistrement local impossible/);
    expect(readProjectSessions(localStorage).projects[0].session.workingDraft?.readyReview).toBeFalsy();
    const before = vi.mocked(fetch).mock.calls.length;
    refuse = false;
    fireEvent.click(screen.getByRole("button", { name: "Réessayer la sauvegarde" }));
    await waitFor(() => expect(readProjectSessions(localStorage).projects[0].session.workingDraft?.readyReview).toBeTruthy());
    expect(fetch).toHaveBeenCalledTimes(before);
    expect(readProjectSessions(localStorage).projects[0].session.project).toBeNull();
  });
  it.each([
    [DOMAINS[1].text, "Je retiens ce groupe, sans changer le critère."],
    ["je veux faire une étude évaluant l'effet de méthodes de reperfusion post IDM avec mise en place immédiate ou différée d'un stent afin d'évaluer l'efficacité sur la viabilité myocardique. avec donc deux groupes en double aveugle, une IRM a J3-6 évaluant la cinétique segmentaire, le strain, le T1/T2, le précoce et tardif le critere de jugement principale étant la taille des lésions microvasculaire a 3min post injection",
      "c'est ca mais a la place de taille j'utiliserais peut être % de la masse vg que représentent les lésions microvasculaires afin de pouvoir comparer les sujets entre eux.\n\nalors on va prendre une population de primo infarctus (en gardant a l'esprit qu'il peut y avoir eu des infarctus silencieux). La tranche d'age va etre 35/85, les citeres c'est le tout venant. Bien sur en exclusion on met les contre indication à l'irm cardiaque (produit de contraste ou peacemaker par exemple), et les personnes qui ont deja eu des problemes coronariens. On exclu également toutes les populations sensibles et si tu vois autre chose on peut discuter"],
  ])("keeps foreground responsive while native preparation is queued, preserving exact input and reload (%#)", async (firstMessage, nextMessage) => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    let backgroundCount = 0, chatCount = 0;
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response(`Réponse contrôlée ${++chatCount}.`);
      if (++backgroundCount === 1) await pending;
      const packet = JSON.parse(payload.input);
      return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal: controlledStudyProposal(packet.contextDigest, DOMAINS[1]),
        explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
    });
    const requests = wirePublicHandler(provider, concurrentUiTestGuard()), workspace = mount();
    send(firstMessage); await screen.findByText("Réponse contrôlée 1.");
    await waitFor(() => expect(provider).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("textbox", { name: "Votre message" })).not.toBeDisabled();
    send(nextMessage);
    await screen.findByText("Réponse contrôlée 2.");
    expect(requests).toHaveLength(3);
    await act(async () => { release(); });
    await waitFor(() => expect(workspace.current().workingDraft?.sourceUserTurnRef).toBe(requests[2]?.conversation.turns.at(-1)?.turnId));
    expect(requests[2].studyProposalContext).toBeUndefined();
    expect(requests[2].conversation.turns.filter(t => t.role === "USER").map(t => t.content)).toEqual([firstMessage, nextMessage]);
    expect(workspace.current().runtimeTurns.filter(t => t.role === "USER")).toHaveLength(2);
    expect(workspace.current().project).toBeNull();
    expect(workspace.current().workingDraftFailure).toBeNull();
    const reopened = loadFunctionalResetSession(localStorage);
    expect(reopened.workingDraft?.readyReview).not.toBeNull();
    expect(reopened.runtimeTurns).toEqual(workspace.current().runtimeTurns);
    workspace.view.unmount(); mount(reopened);
    send("je retiens cette architecture, montre-moi ce qui va être enregistré");
    await waitFor(() => expect(loadFunctionalResetSession(localStorage).pendingContribution).not.toBeNull());
    expect(requests).toHaveLength(4);
    expect(loadFunctionalResetSession(localStorage).project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
    await waitFor(() => expect(loadFunctionalResetSession(localStorage).project?.confirmationDecision.status).toBe("ADOPTED"));
    expect(loadFunctionalResetSession(localStorage).project?.projectId).toBe(reopened.projectId);
    expect(requests).toHaveLength(4);
  });

  it("keeps a failed foreground out of scientific context and retries the same logical user turn after reload", async () => {
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" },
      model: "gpt-5.6-terra", usage: { input_tokens: 100, output_tokens: 40 } })));
    const requests = wirePublicHandler(provider), workspace = mount();
    send("Comparer deux méthodes de mesure.");
    await screen.findByText(/La réponse conversationnelle n’a pas abouti/);
    expect(requests).toHaveLength(1); expect(workspace.current().workingDraft).toBeFalsy();
    const failedId = workspace.current().runtimeTurns[0].turnId;
    const reopened: FunctionalResetSession = loadFunctionalResetSession(localStorage);
    workspace.view.unmount(); const retryWorkspace = mount(reopened);
    send("Comparer deux méthodes de mesure.");
    await waitFor(() => expect(requests).toHaveLength(2));
    await waitFor(() => expect(retryWorkspace.current().entries.filter(e => e.kind === "ERROR")).toHaveLength(2));
    expect(retryWorkspace.current().runtimeTurns).toHaveLength(1);
    expect(retryWorkspace.current().runtimeTurns[0].turnId).toBe(failedId);
    expect(retryWorkspace.current().entries.filter(e => e.role === "USER")).toHaveLength(1);
    expect(requests[1].conversation.turns).toHaveLength(1);
    expect(retryWorkspace.current().project).toBeNull();
    // Unknown usage on the incomplete answer closes the financial gate. The
    // user's explicit retry remains the same logical turn and spends nothing.
    expect(provider).toHaveBeenCalledTimes(1);
    expect(publicProtocolDesignerGuardStateForTests(reopened.sessionId)?.providerGateClosed).toBe(true);
  });
});
