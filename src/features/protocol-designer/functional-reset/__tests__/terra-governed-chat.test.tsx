import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { publicProtocolDesignerGuardStateForTests, resetPublicProtocolDesignerGuardForTests } from "../../../../../server/protocol-designer-public-guard";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../../server/protocol-designer-durable-guard";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { buildPersistentSourceCatalog, contributionFromPersistentDelta, validatePersistentProjectDelta, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { buildOpenAIPersistentDeltaPayload } from "../../../../../api/protocol-designer-openai-extraction-provider";
import { prepareCompactTransaction } from "../../transaction-compaction";
import { contributionDecisionScopeGroups, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { bridgeRequest, wire } from "../../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures";
import { adoptBehaviorContribution, behaviorAuthority, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import { refreshFunctionalResetDocumentPortfolio } from "@/features/document-projection/functional-reset-boundary";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { vi.restoreAllMocks(); cleanup(); bridge.mockReset(); localStorage.clear(); vi.unstubAllEnvs(); resetPublicProtocolDesignerGuardForTests(); });
const native = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 } }));
const call = async (r: ProductBridgeRequest, provider: typeof fetch) => executeProtocolDesignerBridge({ body: r, apiKey: null,
  openAiApiKey: "LOCAL_SYNTHETIC", chatRuntime: "TERRA", fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
const send = (text: string) => { fireEvent.change(screen.getByRole("textbox"), { target: { value: text } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };

describe("Terra native conversation: mechanics only, no competence claim", () => {
  it("sends the concise mandate for the first ECV question and preserves a substantive synthetic response without a cutoff", async () => {
    const text = "Je voudrais étudier le lien entre âge et fibrose myocardique diffuse chez des volontaires sans cardiopathie connue, avec l'ECV en IRM. Proposez une étude concrète et les arbitrages majeurs, sans transformer vos propositions en décisions déjà prises.";
    const reply = "Je proposerais une étude transversale prospective : une IRM par volontaire, pour étudier l’association entre âge et ECV global du ventricule gauche. Ces choix restent à discuter, sans adoption implicite.\n\nL’arbitrage principal concerne la population : exclure les facteurs cardiovasculaires isole mieux le vieillissement, mais rend le recrutement moins représentatif et plus difficile chez les sujets âgés. Les conserver demande un ajustement et une interprétation différente.\n\nPour limiter la variabilité, privilégions une plateforme IRM et un protocole T1 pré/post-contraste standardisés, avec hématocrite le même jour et recherche de lésions focales par rehaussement tardif. L’ECV ne constitue pas à lui seul une preuve spécifique de fibrose.\n\nAnalyser l’âge en continu évite de faire dépendre le résultat de tranches arbitraires. L’effectif devra être justifié séparément ; aucun calcul n’est disponible ici.";
    const provider = vi.fn<typeof fetch>().mockResolvedValue(native(reply));
    const r = { ...bridgeRequest(text), evaluatePersistentDelta: false };
    const result = (await call(r, provider)).body as ProductBridgeResponse;
    const mandate = JSON.parse(String(provider.mock.calls[0][1]?.body)).instructions;
    for (const fragment of ["DEFAULT_RESPONSE_MODE=CONCISE", "50–120", "100–200", "180–350", "erreur scientifique importante", "ne sont pas un cutoff", "Ne termine pas automatiquement par une question"]) expect(mandate).toContain(fragment);
    expect(reply.split(/\s+/u).length).toBeGreaterThanOrEqual(100);
    expect(reply.split(/\s+/u).length).toBeLessThanOrEqual(200);
    expect(result.assistantReply).toBe(reply);
    expect(result.observability.projectWrites).toBe(0); expect(r.currentProject).toBeNull();
  });
  it("keeps native DOC provider context identical for 10, 50 and 100 turns, including oversized chat memory", async () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    const project = adoptBehaviorContribution(richStudyContribution(), null, 1);
    const before = JSON.stringify(project), contextByLength: string[][] = [];
    for (const length of [10, 50, 100]) {
      const inputs: string[] = [], requests: ProductBridgeRequest[] = [];
      const provider = vi.fn<typeof fetch>(async (_url, init) => {
        const payload = JSON.parse(String(init?.body)), context = JSON.parse(payload.input); inputs.push(payload.input);
        expect(payload.input).not.toContain("TRANSCRIPT_SENTINEL");
        expect(context.RECENT_CONVERSATION).toBeUndefined();
        return native(JSON.stringify({ documents: context.DOCUMENT_SCOPE.map((kind: string) => ({ kind, title: `LOCAL_SYNTHETIC ${kind}`,
          sections: [{ title: "Test de mécanique DOC", paragraphs: [kind === "PROTOCOL_SYNOPSIS"
            ? "Texte synthétique de qualification ".repeat(150).trim() : "LOCAL_SYNTHETIC — aucune qualification scientifique."], sourceRefs: [] }], missingElements: ["[À compléter : institution]"] })),
          crfRows: context.INCLUDE_CRF_ROWS ? context.DATA_MANAGEMENT_CRF.fields.map((field: { canonicalVariableId: string; label: string; unit: string | null }, index: number) => ({ variableRef: field.canonicalVariableId,
            variableId: `V_${index}`, label: field.label, visit: "Visite à définir", condition: null, derivedFrom: [], analysisImpact: null,
            domain: "À définir", definition: field.label, entryType: "Texte", unit: field.unit, categories: null,
            dataOrigin: "UNSPECIFIED", source: "À définir", required: "À définir", derivation: null, controls: [], specificationStatus: "UNSPECIFIED" })) : [] }));
      });
      bridge.mockImplementation(async (r: ProductBridgeRequest) => {
        requests.push(r); let status = 0, output: unknown;
        await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json",
          origin: "https://noxia-imagerie.fr", host: "noxia-imagerie.fr" }, body: { ...r, apiVersion: "1.0.0" } }, {
          setHeader() {}, status(value) { status = value; return this; }, json(value) { output = value; },
        }, { NODE_ENV: "production", OPENAI_API_KEY: "LOCAL_SYNTHETIC", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA" },
        { fetchImpl: provider, durableGuard: createMemoryProtocolDesignerGuardForTests() });
        expect(status).toBe(200); return output;
      });
      const session = createFunctionalResetSession(); session.project = project; session.projectId = project.projectId; session.projectAuthority = behaviorAuthority;
      session.documents = refreshFunctionalResetDocumentPortfolio({ project, requestedAt: "2026-09-17T00:00:00Z" });
      session.runtimeTurns = Array.from({ length }, (_, i) => ({ turnId: `history-${i}`, role: i % 2 ? "NOXIA" as const : "USER" as const,
        content: `TRANSCRIPT_SENTINEL_${i} ${"x".repeat(3000)}` }));
      render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={() => true} /></HelmetProvider>);
      fireEvent.click(screen.getByRole("button", { name: "Créer l’aperçu" }));
      await screen.findByRole("heading", { name: "Portefeuille documentaire" });
      expect(requests).toHaveLength(1); expect(requests[0].conversation.turns).toHaveLength(1);
      expect(requests[0].evaluatePersistentDelta).toBe(false); expect(requests[0].currentProject).toEqual(project);
      expect(provider).toHaveBeenCalledTimes(2); expect(JSON.stringify(project)).toBe(before);
      expect(publicProtocolDesignerGuardStateForTests(session.sessionId)).toMatchObject({ requestCount: 1, providerCallInFlight: false, providerGateClosed: false });
      contextByLength.push(inputs); cleanup(); bridge.mockReset();
    }
    expect(contextByLength[1]).toEqual(contextByLength[0]); expect(contextByLength[2]).toEqual(contextByLength[0]);
  });
  it("shows exact free text before any Project, without extraction, carrier, Gemini or QRY fallback", async () => {
    const r = { ...bridgeRequest("Discussion méthodologique libre"), evaluatePersistentDelta: false };
    const provider = vi.fn<typeof fetch>().mockResolvedValue(native("LOCAL_SYNTHETIC — proposition libre sans carrier."));
    const result = await call(r, provider); const body = result.body as ProductBridgeResponse;
    expect(body.assistantReply).toBe("LOCAL_SYNTHETIC — proposition libre sans carrier.");
    expect(body.persistentExtraction.called).toBe(false); expect(body.observability.projectWrites).toBe(0);
    expect(provider).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(provider.mock.calls[0]![1]!.body as string);
    expect(payload).toMatchObject({ model: "gpt-5.6-terra", reasoning: { effort: "medium" }, store: false, service_tier: "default", max_output_tokens: 8000 });
    expect(payload.text).toBeUndefined();
  });
  it("keeps the native response when transaction preparation fails; no implicit write", async () => {
    const provider = vi.fn<typeof fetch>().mockResolvedValueOnce(native("LOCAL_SYNTHETIC — texte natif conservé."))
      .mockResolvedValueOnce(new Response('{"error":{"code":"unavailable"}}', { status: 503 }));
    const body = (await call(bridgeRequest("Enregistrez ces choix"), provider)).body as ProductBridgeResponse;
    expect(body.assistantReply).toBe("LOCAL_SYNTHETIC — texte natif conservé.");
    expect(body.persistentExtraction.status).toBe("TECHNICAL_FAILURE"); expect(body.observability.projectWrites).toBe(0);
    expect(provider).toHaveBeenCalledTimes(2);
  });
  it("does not produce replacement science when Terra fails", async () => {
    const provider = vi.fn<typeof fetch>().mockRejectedValue(new Error("LOCAL_SYNTHETIC outage"));
    const body = (await call(bridgeRequest("Enregistrez ces choix"), provider)).body as ProductBridgeResponse;
    expect(body.conversationFailure).toBeTruthy(); expect(body.persistentExtraction.called).toBe(false);
    expect(body.assistantReply).toContain("n’a pas abouti"); expect(provider).toHaveBeenCalledTimes(1);
  });
  it("retains all 15 turns, refusal and correction literally, with current-only Project projection", () => {
    const r = bridgeRequest("turn 1"); r.conversation.turns = Array.from({ length: 30 }, (_, i) => ({
      turnId: `t${i}`, role: i % 2 ? "NOXIA" : "USER", content: i === 10 ? "Je refuse cette option" : i === 24 ? "Finalement HTA incluse" : `Original ${i}` }));
    const packet = JSON.parse(prepareTerraConversation(r).context);
    expect(packet.RECENT_CONVERSATION).toHaveLength(30);
    expect(packet.RECENT_CONVERSATION[10].content).toBe("Je refuse cette option"); expect(packet.RECENT_CONVERSATION[24].content).toBe("Finalement HTA incluse");
    expect(packet.coverage.transcript).toBe("COMPLETE");
  });
  it("preserves assistant proposal and user assent as distinct provenance in native review", () => {
    const raw = "Je retiens cette proposition pour en préparer l’enregistrement";
    const proposal = "Étude transversale chez des adultes";
    const r = bridgeRequest(raw); r.conversation.turns.unshift({ turnId: "assistant-proposal", role: "NOXIA", content: proposal });
    const delta = wire(raw, [["STUDY_DESIGN", proposal]]);
    Object.assign(delta.changes[0], { assertionKind: "USER_ADOPTED_PROPOSAL", proposalSourceText: proposal });
    const checked = validatePersistentProjectDelta(delta, raw, null, r.conversation); expect(checked.validation.valid).toBe(true);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: r.conversation, currentProject: null })!;
    expect(contribution.scientificContent.candidateObjects[0].epistemicBoundary).toMatchObject({ ownership: "NOXIA", originType: "ASSISTANT_PROPOSAL", adoptionStatus: "CANDIDATE", sourceText: raw });
    expect(contribution.scientificContent.candidateObjects[0].epistemicBoundary.sourceTurnIds).toContain("assistant-proposal");
    const payload = buildOpenAIPersistentDeltaPayload({ ...r, nativeConversationRecording: true });
    expect(payload.input).toContain(proposal);
    expect(payload.instructions).toContain("OPÉRATION DE PRÉPARATION D'UNE REVUE HUMAINE GROUPÉE");
    expect(payload.instructions).toContain("toute sortie reste candidate jusqu'à la revue native");
    expect(buildOpenAIPersistentDeltaPayload(r).instructions).not.toContain("OPÉRATION DE PRÉPARATION D'UNE REVUE HUMAINE GROUPÉE");
    expect(buildPersistentSourceCatalog(r.conversation).anchors.every(item => item.sourceKind === "USER_TURN")).toBe(true);
  });
  it("native Standard persists text and prepares a single review only on explicit request", async () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    const requests: ProductBridgeRequest[] = [];
    bridge.mockImplementation(async (r: ProductBridgeRequest) => { requests.push(r);
      const provider = vi.fn<typeof fetch>().mockResolvedValueOnce(native("LOCAL_SYNTHETIC — discussion persistée."))
        .mockResolvedValueOnce(native(JSON.stringify({ transaction: prepareCompactTransaction(r).header.candidateId, changes: [], relations: [], temporalQualifications: [], expectedVariableOccasions: [] })));
      return (await call({ ...r, apiVersion: "1.0.0" }, provider)).body;
    });
    const session = createFunctionalResetSession();
    const saved = vi.fn(s => { persistFunctionalResetSession(localStorage, s); return true; });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={saved} /></HelmetProvider>);
    send("Une question hors chemin"); await screen.findByText("LOCAL_SYNTHETIC — discussion persistée.");
    expect(requests[0].evaluatePersistentDelta).toBe(false); expect(loadFunctionalResetSession(localStorage).project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Préparer l’enregistrement" }));
    await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].evaluatePersistentDelta).toBe(true);
    await screen.findByText("Aucun nouveau changement à enregistrer. Le projet adopté est conservé.");
    expect(screen.getByTestId("conversation-composer")).toHaveClass("sticky");
  });
  it("saves before the adoption receipt; a refused save leaves the Project unchanged", async () => {
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    const raw = "Population adulte, design transversal"; const r = bridgeRequest(raw);
    const checked = validatePersistentProjectDelta(wire(raw, [["POPULATION", "Population adulte"], ["STUDY_DESIGN", "Design transversal"]]), raw, null, r.conversation);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: r.conversation, currentProject: null })!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(contributionDecisionScopeGroups(candidate)).toHaveLength(2);
    const { retainValidatedContributionCandidate } = await import("../contribution-lifecycle");
    const session = createFunctionalResetSession(); session.pendingContribution = contribution;
    session.retainedContributionCandidates = retainValidatedContributionCandidate({ retained: [], contribution, candidate,
      validation: checked.validation, validatorRef: "LOCAL_SYNTHETIC", sourceTurnRef: r.conversation.turns[0].turnId,
      baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: "2026-09-17T00:00:00Z" });
    session.entries.push({ entryId: "review", kind: "REVIEW", role: "NOXIA", contribution, candidate, status: "PENDING", createdAt: "2026-09-17T00:00:00Z" });
    let accepted = false; const persist = vi.fn((next) => { if (next.project && !accepted) return false; persistFunctionalResetSession(localStorage, next); return true; });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={persist} /></HelmetProvider>);
    await waitFor(() => expect(loadFunctionalResetSession(localStorage).retainedContributionCandidates?.[0].presentedAt).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Voir les détails" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
    await waitFor(() => expect(screen.getByText(/n’a pas pu mettre à jour cette partie du projet/)).toBeInTheDocument());
    expect(loadFunctionalResetSession(localStorage).project).toBeNull();
    accepted = true;
    fireEvent.click(screen.getByRole("button", { name: "Voir les détails" }));
    fireEvent.click(screen.getByText("Choisir les éléments à enregistrer"));
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer la sélection" }));
    await waitFor(() => expect(loadFunctionalResetSession(localStorage).project).toBeTruthy());
    const adopted = loadFunctionalResetSession(localStorage).project!;
    expect(adopted.confirmationDecision.targets.filter(ref => candidate.humanReviewProjection.coveredChangeRefs.includes(ref))).toHaveLength(1);
    expect(loadFunctionalResetSession(localStorage).pendingContribution).toBeTruthy();
    expect(adopted.projectId).toBe(session.projectId); expect(adopted.confirmationDecision.status).toBe("ADOPTED");
    expect(bridge).not.toHaveBeenCalled();
  });
});
