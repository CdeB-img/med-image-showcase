import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRecordedProtocolDesignerFetch } from "../../../../../server/protocol-designer-provider-replay";
import { createCanaryCampaignPolicy } from "../../../../../server/protocol-designer-canary-policy";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { acceptWorkingDraftUpdate, resolveWorkingDraftSourceQuote, compactWorkingDraftAdvice, isWorkingDraftReviewOnlyRequest, validatePreparedWorkingReview, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, type WorkingDraftUpdate } from "../continuous-project-build";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import type { FunctionalResetSession } from "../session";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); bridge.mockReset(); localStorage.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const response = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } }));
const sessionFor = (text: string = DOMAINS[1].text) => {
  const session = createFunctionalResetSession();
  session.runtimeTurns = [{ turnId: "u1", role: "USER", content: text, createdAt: session.createdAt },
    { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — architecture proposée, non adoptée.", createdAt: session.createdAt }];
  return session;
};
const requestFor = (s: FunctionalResetSession): ProductBridgeRequest => ({ apiVersion: "1.0.0", conversation: {
  conversationId: s.conversationId, language: "fr", turns: s.runtimeTurns }, currentProject: s.project,
  evaluatePersistentDelta: false, prepareWorkingDraft: true, ...(s.studyProposal ? { studyProposalContext: s.studyProposal } : {}) });
const updateFor = (r: ProductBridgeRequest, domain: typeof DOMAINS[number] | typeof multimodal = DOMAINS[1]): WorkingDraftUpdate => ({ requestType: "STUDY_UPDATE",
  proposal: controlledStudyProposal(prepareWorkingDraftRequest(r).inputDigest, domain as typeof DOMAINS[number]),
  explicitDecisions: [{ atomRef: "design", sourceTurnRef: "u1", quote: domain.text }], inferredAtomRefs: [], rejectedAtomRefs: [] });
const multimodal = { ...DOMAINS[2], id: "MULTIMODAL", text: "Je veux une cohorte longitudinale associant mesures cliniques, questionnaire et données d'imagerie, sans intervention, aux mêmes visites.",
  question: "Étudier les trajectoires cliniques et multimodales", measure: "Mesures cliniques, questionnaire et données d'imagerie", variable: "Mesure clinique de référence" };
const call = async (r: ProductBridgeRequest, provider: typeof fetch, on = true) => executeProtocolDesignerBridge({ body: r,
  apiKey: null, openAiApiKey: "LOCAL_SYNTHETIC", chatRuntime: "TERRA", autonomousProjectBuild: on,
  fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
const send = (text: string) => { fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };

describe("continuous working composition — synthetic mechanics, no scientific approval", () => {
  it("recovers immutable raw provenance across layout whitespace and rejects ambiguity or semantic edits", () => {
    const source = "avec medicament\ncontre placebo";
    expect(resolveWorkingDraftSourceQuote(source, "avec medicament contre placebo")).toEqual({ quote: source, start: 0, end: source.length });
    expect(resolveWorkingDraftSourceQuote("A\r\n\tB", "A B")?.quote).toBe("A\r\n\tB");
    for (const [raw, quote] of [["pas de placebo", "avec placebo"], ["dose 5 mg", "dose 50 mg"], ["dose 5 mg", "dose 5 g"], ["A B puis A\nB", "A B"], ["A B", " \n"]])
      expect(resolveWorkingDraftSourceQuote(raw, quote)).toBeNull();
    const s = sessionFor(source), r = requestFor(s), update = updateFor(r);
    update.explicitDecisions[0]!.quote = "avec medicament contre placebo";
    const before = JSON.stringify(r);
    expect(acceptWorkingDraftUpdate(update, r).update.explicitDecisions[0]!.quote).toBe(source);
    expect(JSON.stringify(r)).toBe(before);
  });
  it("projects open scientific atoms separately from referential ambiguity and preserves QRY outcomes", () => {
    const s = sessionFor(), r = requestFor(s), update = updateFor(r);
    update.proposal!.atoms.find(a => a.area === "MEASUREMENTS")!.status = "OPEN_DECISION";
    const composition = acceptWorkingDraftUpdate(update, r).composition!;
    const next = { ...r, studyProposalContext: composition };
    const packet = JSON.parse(prepareTerraConversation(next, true).context);
    expect(packet.OPEN_DECISIONS).toContainEqual(expect.objectContaining({ source: "WORKING_DRAFT_NOT_ADOPTED", owner: "OBS" }));
    const advice = compactWorkingDraftAdvice(next);
    expect(advice).toEqual(expect.objectContaining({ STATUS: expect.any(String), ALTERNATIVES: expect.any(Array) }));
    expect(packet.WORKING_NEXT_ACTION).toEqual(advice);
  });

  it.each([...DOMAINS.filter(d => d.id !== "FIBROSIS"), multimodal])("prebuilds native review for $id with the same mechanism and persists it", async domain => {
    const s = sessionFor(domain.text), r = requestFor(s), update = updateFor(r, domain);
    const accepted = acceptWorkingDraftUpdate(update, r);
    const draft = prepareContinuousWorkingDraft(s, accepted.composition!, update, prepareWorkingDraftRequest(r).inputDigest);
    expect(draft.readyReview, draft.failure ?? "").not.toBeNull();
    expect(draft.readyReview!.contribution.scientificContent.candidateObjects.every(o => o.epistemicBoundary.epistemicStatus === "OWNER_CANDIDATE")).toBe(true);
    expect(draft.readyReview!.contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
    expect(draft.readyReview!.candidate.projectWriteAuthorized).toBe(false); expect(s.project).toBeNull();
    const next = { ...s, studyProposal: accepted.composition, workingDraft: draft };
    persistFunctionalResetSession(localStorage, next);
    expect(loadFunctionalResetSession(localStorage).workingDraft?.readyReview?.candidate.contributionDigest).toBe(draft.readyReview!.candidate.contributionDigest);
    expect(loadFunctionalResetSession(localStorage).studyProposal?.digest).toBe(accepted.composition!.digest);
    expect(draft.metrics.noxiaPrebuiltElements).toBeGreaterThan(5);
  });
  it("keeps an insufficient request and a targeted question out of study reconstruction", () => {
    for (const requestType of ["INSUFFICIENT", "TARGETED_QUESTION"] as const) {
      const r = requestFor(sessionFor(requestType === "INSUFFICIENT" ? "je veux étudier quelque chose" : "Pourquoi ajuster sur la valeur initiale ?"));
      expect(acceptWorkingDraftUpdate({ requestType, proposal: null, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }, r).composition).toBeNull();
      expect(() => acceptWorkingDraftUpdate({ ...updateFor(requestFor(sessionFor())), requestType }, r)).toThrow("WORKING_DRAFT_OUT_OF_SCOPE");
    }
  });
  it("provides the actual native contract enums without relaxing validation", () => {
    const r = requestFor(sessionFor()), packet = JSON.parse(prepareWorkingDraftRequest(r).context);
    expect(packet.nativeContractValues.ownerAreas.IMAGING).toEqual(["MEASUREMENTS", "ENDPOINTS"]);
    expect(packet.nativeContractValues.ownerAreas.STUDY_DESIGN).toContain("TIMING");
    expect(packet.nativeContractValues.area).toContain("EXPOSURE");
    expect(packet.nativeContractValues.variableRoles).toContain("OUTCOME_VARIABLE");
    expect(packet.nativeContractValues.affectedBranches).toContain("COLLECTION");
    const raw = structuredClone(updateFor(r)) as unknown as { proposal: { atoms: { area: string }[] } };
    raw.proposal.atoms[0].area = "UNSUPPORTED_CUSTOM_AREA";
    expect(() => acceptWorkingDraftUpdate(raw, r)).toThrow();
  });
  it("rejects invented explicit provenance and leaves canonical Project unchanged", () => {
    const s = sessionFor(), r = requestFor(s), update = updateFor(r);
    update.explicitDecisions[0].quote = "un choix jamais exprimé";
    expect(() => acceptWorkingDraftUpdate(update, r)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID"); expect(s.project).toBeNull();
  });
  it("validates prepared review against the composition and rejects stale or modified storage", () => {
    const s = sessionFor(), r = requestFor(s), update = updateFor(r), composition = acceptWorkingDraftUpdate(update, r).composition!;
    const draft = prepareContinuousWorkingDraft(s, composition, update, prepareWorkingDraftRequest(r).inputDigest);
    const current = { ...s, studyProposal: composition, workingDraft: draft };
    expect(validatePreparedWorkingReview(current)).not.toBeNull();
    const damaged = structuredClone(current);
    damaged.workingDraft.readyReview!.contribution.scientificContent.candidateObjects[0].content = "LOCAL_SYNTHETIC unrelated content";
    expect(validatePreparedWorkingReview(damaged)).toBeNull();
    expect(validatePreparedWorkingReview({ ...current, runtimeTurns: [...s.runtimeTurns, { turnId: "new-choice", role: "USER", content: "Ajoutez une autre visite." }] })).toBeNull();
    expect(validatePreparedWorkingReview({ ...current, workingDraft: { ...draft, failure: "preparation failed" } })).toBeNull();
    expect(isWorkingDraftReviewOnlyRequest("je retiens cette architecture, montre-moi ce qui va être enregistré")).toBe(true);
    expect(isWorkingDraftReviewOnlyRequest("je retiens cette architecture mais ajoute une visite à six mois, montre-moi ce qui va être enregistré")).toBe(false);
  });
  it("preserves rejected history as read-only context and blocks reactivation", () => {
    const s = sessionFor(), r = requestFor(s), update = updateFor(r), atom = update.proposal!.atoms[0];
    const rejectedRequest = { ...r, workingDraftHistory: [{ atom, status: "REJECTED" as const }] };
    expect(prepareWorkingDraftRequest(rejectedRequest).context).toContain("rejectedWorkingElements");
    expect(() => acceptWorkingDraftUpdate(updateFor(rejectedRequest), rejectedRequest)).toThrow("WORKING_DRAFT_REJECTED_REACTIVATED");
  });
  it("passes native QRY advice to Terra without transferring response ownership", () => {
    const s = sessionFor(), r = requestFor(s), update = updateFor(r), composition = acceptWorkingDraftUpdate(update, r).composition!;
    const next = { ...r, studyProposalContext: composition };
    const advice = compactWorkingDraftAdvice(next);
    expect(advice?.NEXT_HIGH_VALUE_ACTION).toBeTruthy();
    expect(JSON.parse(prepareTerraConversation(next, true).context).WORKING_NEXT_ACTION).toEqual(advice);
    expect(prepareTerraConversation(next).context).not.toContain("WORKING_NEXT_ACTION");
  });
  it("requires native confirmation, then preserves Project identity and document binding on reopen", () => {
    const s = sessionFor(), r = requestFor(s), update = updateFor(r), composition = acceptWorkingDraftUpdate(update, r).composition!;
    const draft = prepareContinuousWorkingDraft(s, composition, update, prepareWorkingDraftRequest(r).inputDigest), ready = draft.readyReview!;
    const project = confirmResearchProjectContribution({ contribution: ready.contribution, current: null, projectId: s.projectId,
      authority: s.projectAuthority, confirmedAt: s.updatedAt, reviewedProjection: ready.candidate.humanReviewProjection,
      selectedChangeRefs: ready.candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: ["human-review-button"] });
    expect(project.projectId).toBe(s.projectId); expect(project.confirmationDecision.status).toBe("ADOPTED");
    persistFunctionalResetSession(localStorage, { ...s, project }); expect(loadFunctionalResetSession(localStorage).project?.versionId).toBe(project.versionId);
  });
  it("supersedes only changed atoms, preserves branches and prevents open dependencies from entering review", () => {
    const s = sessionFor(), r = requestFor(s), first = updateFor(r), composition = acceptWorkingDraftUpdate(first, r).composition!;
    const initialDraft = prepareContinuousWorkingDraft(s, composition, first, prepareWorkingDraftRequest(r).inputDigest);
    const next = { ...s, studyProposal: composition, workingDraft: initialDraft,
      runtimeTurns: [...s.runtimeTurns, { turnId: "u2", role: "USER" as const, content: "Remplacez le temps de suivi, et la modalité de recueil reste à préciser.", createdAt: s.updatedAt },
        { turnId: "a2", role: "NOXIA" as const, content: "LOCAL_SYNTHETIC — seule cette branche change.", createdAt: s.updatedAt }] };
    const request = requestFor(next), update = updateFor(request);
    update.proposal!.atoms.find(a => a.area === "TIMING")!.content = "Nouveau temps candidat";
    const open = update.proposal!.atoms.find(a => a.area === "MEASUREMENTS")!; open.status = "OPEN_DECISION";
    const child = update.proposal!.atoms.find(a => a.area === "ANALYSIS")!; child.dependsOn = [open.ref];
    const accepted = acceptWorkingDraftUpdate(update, request).composition!;
    const result = prepareContinuousWorkingDraft(next, accepted, update, prepareWorkingDraftRequest(request).inputDigest);
    expect(result.history.some(h => h.atom.area === "TIMING" && h.status === "SUPERSEDED")).toBe(true);
    expect(result.history.some(h => h.atom.area === "POPULATION")).toBe(false);
    expect(result.origins[open.ref]).toBe("OPEN");
    expect(result.readyReview!.contribution.scientificContent.candidateObjects.some(o => o.content === child.content)).toBe(false);
    expect(result.readyReview!.contribution.scientificContent.candidateObjects.some(o => o.content === open.content)).toBe(false);
    expect(result.readiness.CRF.status).toBe("OPEN");
  });
  it("uses only the native Terra transport once for background and fails closed without retry", async () => {
    const r = requestFor(sessionFor()), update = updateFor(r);
    const provider = vi.fn<typeof fetch>().mockResolvedValue(response(JSON.stringify(update)));
    const result = await call(r, provider); expect(result.status).toBe(200); expect(provider).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(provider.mock.calls[0][1]?.body));
    expect(payload.model).toBe("gpt-5.6-terra"); expect(payload.reasoning.effort).toBe("medium"); expect(payload.store).toBe(false);
    expect((result.body as ProductBridgeResponse).assistantReply).toBe("");
    expect((result.body as ProductBridgeResponse).observability.projectWrites).toBe(0);
    const failed = vi.fn<typeof fetch>().mockResolvedValue(response("invalid JSON"));
    expect((await call(r, failed)).status).toBe(422); expect(failed).toHaveBeenCalledTimes(1);
  });
  it("uses the qualified exact-count canary path for the same native Terra operation", async () => {
    const base = await mkdtemp(join(tmpdir(), "noxia-working-draft-")), root = join(base, "canary-LOCAL_SYNTHETIC_CONTINUOUS");
    try {
      const s = sessionFor(), r = requestFor(s), update = updateFor(r);
      const policy = createCanaryCampaignPolicy({ campaignId: "LOCAL_SYNTHETIC_CONTINUOUS", maxSessions: 1,
        measuredSoftStopUsd: 3, absoluteHardBoundUsd: 5, singleAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED",
        allowedProviderModels: ["gpt-5.6-terra"], createdAt: s.createdAt,
        exactInputCounting: { maxInputTokens: 24000, maxGenerationAttempts: 1, maxTokenCountRequests: 1, maxProviderHttpRequests: 2 } });
      const provider = vi.fn<typeof fetch>(async url => String(url).endsWith("/input_tokens")
        ? new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: 100 })) : response(JSON.stringify(update)));
      const context = { sessionId: s.sessionId, conversationId: s.conversationId, turnId: "u1", clientRequestId: "working-draft:u1", testSessionId: null };
      const recorded = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, canaryCampaignId: policy.campaignId,
        campaignPolicy: policy, context, secrets: [] });
      const result = await call({ ...r, observabilityContext: context }, recorded);
      expect(result.status, JSON.stringify(result.body)).toBe(200); expect(provider).toHaveBeenCalledTimes(2);
      expect(String(provider.mock.calls[0][0])).toContain("/input_tokens");
      expect((result.body as ProductBridgeResponse).workingStudyProposal).toBeTruthy();
    } finally { await rm(base, { recursive: true, force: true }); }
  });
  it("gate OFF prevents any background HTTP and preserves the baseline Chat mandate", async () => {
    const r = requestFor(sessionFor()), provider = vi.fn<typeof fetch>();
    expect((await call(r, provider, false)).status).toBe(422); expect(provider).not.toHaveBeenCalled();
    expect(prepareTerraConversation(r).instruction).not.toContain("CONSTRUCTION CONTINUE ACTIVE");
  });
  it("a failed background owner leaves the response and previously prepared draft intact", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const s = sessionFor(), r = requestFor(s), update = updateFor(r), composition = acceptWorkingDraftUpdate(update, r).composition!;
    const previous = prepareContinuousWorkingDraft(s, composition, update, prepareWorkingDraftRequest(r).inputDigest);
    let saved = { ...s, studyProposal: composition, workingDraft: previous };
    bridge.mockImplementation(async req => {
      if (req.prepareWorkingDraft) throw new Error("LOCAL_SYNTHETIC_BACKGROUND_FAILURE");
      return (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response("LOCAL_SYNTHETIC — discussion préservée.")))).body;
    });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next as typeof saved; return true; }} /></HelmetProvider>);
    send("Pourquoi retenir ce modèle ?"); await screen.findByText("LOCAL_SYNTHETIC — discussion préservée.");
    await waitFor(() => expect(saved.workingDraft?.failure).toBe("LOCAL_SYNTHETIC_BACKGROUND_FAILURE"));
    expect(saved.studyProposal.digest).toBe(composition.digest); expect(saved.workingDraft.readyReview).toEqual(previous.readyReview);
    expect(saved.project).toBeNull(); expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("keeps a first preparation failure visible without erasing Chat or creating a Project", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    bridge.mockImplementation(async req => {
      if (req.prepareWorkingDraft) throw new Error("LOCAL_SYNTHETIC_FIRST_FAILURE");
      return (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response("LOCAL_SYNTHETIC — Chat intact.")))).body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={s => { saved = s; return true; }} /></HelmetProvider>);
    send(DOMAINS[1].text); await screen.findByText("LOCAL_SYNTHETIC — Chat intact.");
    await waitFor(() => expect(saved.workingDraftFailure).toBe("LOCAL_SYNTHETIC_FIRST_FAILURE"));
    expect(screen.getByTestId("continuous-working-draft-indicator")).toHaveTextContent("Discussion conservée");
    expect(saved.project).toBeNull(); expect(saved.studyProposal).toBeFalsy(); expect(bridge).toHaveBeenCalledTimes(2);
  });
  it("synchronizes a new choice before opening mixed recording review, without persistent extraction", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response("LOCAL_SYNTHETIC — suivi corrigé.");
      const packet = JSON.parse(payload.input), proposal = controlledStudyProposal(packet.contextDigest, DOMAINS[1]);
      proposal.atoms.find(a => a.area === "TIMING")!.content = "Temps candidat corrigé à six mois";
      return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
    });
    bridge.mockImplementation(async req => {
      expect(req.evaluatePersistentDelta).toBe(false);
      const result = await call({ ...req, apiVersion: "1.0.0" }, provider);
      if (result.status !== 200) throw new Error(JSON.stringify(result.body)); return result.body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={s => { saved = s; return true; }} /></HelmetProvider>);
    send("je retiens cette architecture mais ajoute une visite à six mois, montre-moi ce qui va être enregistré");
    await waitFor(() => expect(saved.pendingContribution).not.toBeNull());
    expect(saved.pendingContribution!.scientificContent.candidateObjects.some(o => o.content === "Temps candidat corrigé à six mois")).toBe(true);
    expect(saved.project).toBeNull(); expect(bridge).toHaveBeenCalledTimes(2);
  });
  it("never reconstructs a failed draft on a pure review request", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const s = { ...sessionFor(), workingDraftFailure: "LOCAL_SYNTHETIC_PREVIOUS_OWNER_FAILURE" };
    let saved: FunctionalResetSession = s;
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={s} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    send("je retiens cette architecture, montre-moi ce qui va être enregistré");
    await screen.findByText("La discussion et le brouillon sont conservés. Les choix ne sont pas encore prêts à confirmer.");
    expect(bridge).not.toHaveBeenCalled(); expect(saved.project).toBeNull();
    expect(saved.pendingContribution).toBeNull(); expect(saved.workingDraftFailure).toBe(s.workingDraftFailure);
  });

  it("delivers native text while background is still pending, opens ready review without another bridge call", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let release!: () => void;
    const waiting = new Promise<void>(resolve => { release = resolve; });
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      if (!payload.instructions.includes("Tu prépares en arrière-plan")) return response("LOCAL_SYNTHETIC — réponse visible avant préparation.");
      await waiting;
      const packet = JSON.parse(payload.input);
      return response(JSON.stringify({ ...updateFor(requestFor(sessionFor())), proposal: controlledStudyProposal(packet.contextDigest, DOMAINS[1]),
        explicitDecisions: [], inferredAtomRefs: [] }));
    });
    bridge.mockImplementation(async r => { const result = await call({ ...r, apiVersion: "1.0.0" }, provider);
      if (result.status !== 200) throw new Error(JSON.stringify(result.body)); return result.body; });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={s => { saved = s; return true; }} /></HelmetProvider>);
    send(DOMAINS[1].text);
    await screen.findByText("LOCAL_SYNTHETIC — réponse visible avant préparation.");
    expect(saved.project).toBeNull(); expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Votre message" })).toBeEnabled();
    release(); await waitFor(() => expect(saved.workingDraft?.readyReview).toBeTruthy());
    await waitFor(() => expect(screen.getByRole("button", { name: "Revoir les choix" })).toBeEnabled());
    expect(bridge).toHaveBeenCalledTimes(2);
    send("je retiens cette architecture, montre-moi ce qui va être enregistré");
    await waitFor(() => expect(saved.pendingContribution).not.toBeNull());
    expect(bridge).toHaveBeenCalledTimes(2); expect(saved.project).toBeNull(); expect(screen.getByTestId("continuous-working-draft-indicator").className).toContain("h-14");
  });
});
