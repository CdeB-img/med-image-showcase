import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRecordedProtocolDesignerFetch } from "../../../../../server/protocol-designer-provider-replay";
import { createCanaryCampaignPolicy } from "../../../../../server/protocol-designer-canary-policy";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { acceptWorkingDraftUpdate, resolveWorkingDraftSourceQuote, compactWorkingDraftAdvice, isWorkingDraftReviewOnlyRequest, validatePreparedWorkingReview, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, type WorkingDraftUpdate } from "../continuous-project-build";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { ensureCanonicalProjectState } from "@/features/research-project-construction/canonical-project-backbone";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import type { FunctionalResetSession } from "../session";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { reviewDecisionRefsInDisplayOrder } from "../ContributionReview";
import { contributionDecisionScopeGroups } from "@/features/research-project-construction/contribution-owner-boundary";
import * as documentaryConversation from "../documentary-conversation";
import { ProductBridgeClientError } from "../../product-bridge-client";
import { DRCI_DOCUMENT_KINDS, prepareDrciDraftPack, materializeDrciDraftPack } from "@/features/document-projection/drci-draft-pack";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); bridge.mockReset(); localStorage.clear(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
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
  it.each([
    "Je veux comparer la répétabilité de plusieurs mesures de rugosité sur des plaques. Je retiens ce schéma.",
    "Je veux comparer un traitement au placebo par randomisation en aveugle. Je retiens ce schéma.",
  ])("sends a substantive first turn to Chat even if it contains a recording phrase: %s", async text => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    expect(isWorkingDraftReviewOnlyRequest(text)).toBe(true);
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      return response(payload.instructions.includes("Tu prépares en arrière-plan")
        ? JSON.stringify({ requestType: "INSUFFICIENT", proposal: null, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] })
        : "LOCAL_SYNTHETIC — premier échange scientifique conservé.");
    });
    bridge.mockImplementation(async req => {
      const result = await call({ ...req, apiVersion: "1.0.0" }, provider);
      if (result.status !== 200) throw new Error(JSON.stringify(result.body)); return result.body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    send(text);
    await screen.findByText("LOCAL_SYNTHETIC — premier échange scientifique conservé.");
    await waitFor(() => expect(bridge).toHaveBeenCalledTimes(2));
    expect(bridge.mock.calls[0][0].prepareWorkingDraft).not.toBe(true);
    expect(bridge.mock.calls[0][0].conversation.turns.at(-1).content).toBe(text);
    expect(saved.project).toBeNull();
    expect(screen.queryByText("La discussion et le brouillon sont conservés. Les choix ne sont pas encore prêts à confirmer.")).toBeNull();
  });
  it.each([
    ["novel coarctation", "Les patients gardent leur traitement habituel et on note la prise."],
    ["non-cardiac cohort", DOMAINS[2].text],
    ["paired reproducibility", DOMAINS[4].text],
  ])("pairs each immutable user source with its output-contract identity (%s)", (_label, earlierChoice) => {
    const s = sessionFor(earlierChoice);
    s.runtimeTurns.push({ turnId: "u2", role: "USER", content: "Je garde ce choix et laisse la procédure ouverte." },
      { turnId: "a2", role: "NOXIA", content: "Proposition, sans adoption." });
    const request = requestFor(s), before = JSON.stringify(request);
    const packet = JSON.parse(prepareWorkingDraftRequest(request).context);
    expect(packet.RECENT_CONVERSATION.filter((t: { role: string }) => t.role === "USER")).toEqual([
      { ref: "u1", sourceTurnRef: "u1", role: "USER", content: earlierChoice },
      { ref: "u2", sourceTurnRef: "u2", role: "USER", content: "Je garde ce choix et laisse la procédure ouverte." },
    ]);
    const update = updateFor(request);
    update.explicitDecisions = [{ atomRef: "design", sourceTurnRef: "u2", quote: earlierChoice }];
    // A producer mistake is still rejected. No fuzzy cross-turn reassignment.
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("WORKING_DRAFT_USER_PROVENANCE_INVALID");
    update.explicitDecisions[0].sourceTurnRef = "u1";
    expect(acceptWorkingDraftUpdate(update, request).update.explicitDecisions[0].sourceTurnRef).toBe("u1");
    expect(JSON.stringify(request)).toBe(before);
  });
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
  it("carries detailed eligibility, an incident-pregnancy estimand, and corrected MRI timing through review into Project", () => {
    const initial = sessionFor(), initialRequest = requestFor(initial), initialUpdate = updateFor(initialRequest);
    initialUpdate.proposal!.atoms.find(atom => atom.area === "TIMING")!.content = "IRM initiale = M6";
    const firstComposition = acceptWorkingDraftUpdate(initialUpdate, initialRequest).composition!;
    const firstDraft = prepareContinuousWorkingDraft(initial, firstComposition, initialUpdate, prepareWorkingDraftRequest(initialRequest).inputDigest);
    const correction = "Conserver les critères d’éligibilité détaillés et l’estimand des grossesses incidentes. Correction : IRM index dans les 14 jours ; M6 est le suivi.";
    const next: FunctionalResetSession = { ...initial, studyProposal: firstComposition, workingDraft: firstDraft,
      runtimeTurns: [...initial.runtimeTurns,
        { turnId: "u2", role: "USER", content: correction, createdAt: initial.updatedAt },
        { turnId: "a2", role: "NOXIA", content: "LOCAL_SYNTHETIC — correction comprise.", createdAt: initial.updatedAt }] };
    const request = requestFor(next), update = updateFor(request);
    const eligibility = update.proposal!.atoms.find(atom => atom.area === "ELIGIBILITY")!;
    const estimand = update.proposal!.atoms.find(atom => atom.area === "ANALYSIS")!;
    const timing = update.proposal!.atoms.find(atom => atom.area === "TIMING")!;
    eligibility.content = "Éligibilité détaillée : critères d’inclusion et d’exclusion confirmés";
    estimand.content = "Estimand des grossesses incidentes confirmé";
    timing.content = "IRM index dans les 14 jours ; M6 = suivi";
    update.explicitDecisions = [eligibility, estimand, timing].map(atom => ({ atomRef: atom.ref, sourceTurnRef: "u2", quote: correction }));
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const draft = prepareContinuousWorkingDraft(next, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    const ready = draft.readyReview!;
    const reviewText = ready.contribution.scientificContent.candidateObjects.map(object => object.content).join("\n");
    expect(reviewText).toContain(eligibility.content);
    expect(reviewText).toContain(estimand.content);
    expect(reviewText).toContain(timing.content);
    expect(reviewText).not.toContain("IRM initiale = M6");
    expect(draft.history).toContainEqual(expect.objectContaining({ status: "SUPERSEDED", atom: expect.objectContaining({ content: "IRM initiale = M6" }) }));

    const project = confirmResearchProjectContribution({ contribution: ready.contribution, current: null, projectId: next.projectId,
      authority: next.projectAuthority, confirmedAt: next.updatedAt, reviewedProjection: ready.candidate.humanReviewProjection,
      selectedChangeRefs: ready.candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: ["u2"] });
    const projectText = JSON.stringify(project.canonicalState?.objects.filter(object => object.actuality === "CURRENT") ?? project.sections);
    expect(projectText).toContain(eligibility.content);
    expect(projectText).toContain(estimand.content);
    expect(projectText).toContain(timing.content);
    expect(projectText).not.toContain("IRM initiale = M6");
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
    expect(screen.queryByTestId("continuous-working-draft-indicator")).toBeNull();
    expect(screen.queryByText(/discussion et le brouillon sont conservés/i)).toBeNull();
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
  it("keeps a failed draft non-adopted and reports that a review request produced no confirmable choices", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    bridge.mockImplementation(async req => {
      const provider = vi.fn<typeof fetch>(async (_url, init) => response(JSON.parse(String(init?.body)).instructions.includes("Tu prépares en arrière-plan")
        ? JSON.stringify({ requestType: "INSUFFICIENT", proposal: null, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] })
        : "LOCAL_SYNTHETIC — discussion conservée, revue non prête."));
      const result = await call({ ...req, apiVersion: "1.0.0" }, provider);
      if (result.status !== 200) throw new Error(JSON.stringify(result.body)); return result.body;
    });
    const s = { ...sessionFor(), workingDraftFailure: "LOCAL_SYNTHETIC_PREVIOUS_OWNER_FAILURE" };
    let saved: FunctionalResetSession = s;
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={s} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    send("je retiens cette architecture, montre-moi ce qui va être enregistré");
    expect(screen.queryByText(/discussion et le brouillon sont conservés/i)).toBeNull();
    await screen.findByText("LOCAL_SYNTHETIC — discussion conservée, revue non prête.");
    expect(bridge.mock.calls[0][0].prepareWorkingDraft).not.toBe(true); expect(saved.project).toBeNull();
    expect(saved.pendingContribution).toBeNull();
    await waitFor(() => expect(saved.workingDraftFailure).toBe("WORKING_DRAFT_NO_CONFIRMABLE_UPDATE"));
    expect(saved.workingDraftPreparations?.at(-1)).toMatchObject({ status: "FAILED", code: "WORKING_DRAFT_NO_CONFIRMABLE_UPDATE" });
    expect(screen.getByRole("alert")).toHaveTextContent(/pas de nouveaux choix à valider/iu);
  });

  it("delivers native text while background is pending, then exposes the final review without a preparation click", async () => {
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
    await waitFor(() => expect(screen.getByRole("button", { name: "Valider ces choix" })).toBeEnabled());
    expect(screen.queryByRole("button", { name: "Revoir les choix" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Préparer l’enregistrement" })).toBeNull();
    expect(screen.getByTestId("project-finalization-card")).toHaveTextContent(/décisions? prêtes? à confirmer/i);
    expect(screen.getByTestId("project-finalization-card")).toHaveTextContent(/points? reste(?:nt)? à définir/i);
    expect(bridge).toHaveBeenCalledTimes(2);
    expect(saved.project).toBeNull(); expect(screen.queryByTestId("continuous-working-draft-indicator")).toBeNull();
  });

  it.each(["oui", "ça me convient", "valide tout"])("confirms a prepared checkpoint naturally with %s, without generating documents", async answer => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    bridge.mockImplementation(async req => {
      const result = await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response("LOCAL_SYNTHETIC — confirmation entendue.")));
      if (result.status !== 200) throw new Error(JSON.stringify(result.body)); return result.body;
    });
    const initial = sessionFor(), request = requestFor(initial), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const workingDraft = prepareContinuousWorkingDraft(initial, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    let saved: FunctionalResetSession = { ...initial, studyProposal: composition, workingDraft };
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    expect(screen.getByRole("button", { name: "Valider ces choix" })).toBeEnabled();
    send(answer);
    await waitFor(() => expect(saved.project?.confirmationDecision.status).toBe("ADOPTED"));
    expect(saved.runtimeTurns.filter(turn => turn.role === "USER").at(-1)?.content).toBe(answer);
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
    expect(bridge).toHaveBeenCalledTimes(1);
    expect(bridge.mock.calls[0][0].conversation.turns.at(-1).content).toBe(answer);
    expect(screen.getByRole("textbox", { name: "Votre message" })).toHaveValue("");
  });

  it("adopts the ECV study checkpoint from the human mixed confirmation and carries France into the next discussion", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const confirmation = "oui c'est bien tout ça je valide. ce sera en france";
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      if (!payload.instructions.includes("Tu prépares en arrière-plan"))
        return response("LOCAL_SYNTHETIC — structure scientifique proposée ; le cadre français reste à préciser.");
      const packet = JSON.parse(payload.input), proposal = controlledStudyProposal(packet.contextDigest, DOMAINS[0]);
      if (String(payload.input).includes("M12")) proposal.atoms.find(atom => atom.ref === "timing")!.content = "Une visite supplémentaire à M12";
      if (String(payload.input).includes("ce sera en france")) proposal.atoms.find(atom => atom.ref === "practical")!.content = "Étude conduite en France";
      return response(JSON.stringify({ requestType: "STUDY_UPDATE", proposal,
        explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }));
    });
    bridge.mockImplementation(async request => {
      if (request.documentDraftRequest) {
        const project = request.currentProject!, source = request.documentDraftRequest;
        const packet = prepareDrciDraftPack(project, source);
        const generated = { documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `LOCAL_SYNTHETIC ${kind}`,
          sections: [{ title: "Dossier de travail", paragraphs: [kind === "PROTOCOL_SYNOPSIS"
            ? "Texte synthétique de qualification mécanique sans validation scientifique humaine. ".repeat(65)
            : packet.sourceFacts[0].content], sourceRefs: [packet.sourceFacts[0].ref] }], missingElements: [] })),
          crfRows: source.crf.fields.map((field, index) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${index}`, label: field.label,
            domain: "À préciser", visit: "À préciser", definition: field.label, entryType: "Texte", unit: null, categories: null,
            dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null, derivedFrom: [],
            derivation: null, controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) };
        return { apiVersion: "1.0.0", assistantReply: "Dossier de travail disponible.",
          assistantTurn: { turnId: "doc-answer", role: "NOXIA", content: "Dossier de travail disponible." },
          observability: { providerCalls: [] }, documentDraftPack: materializeDrciDraftPack(generated, { project, packet, generatedAt: saved.updatedAt }) };
      }
      const result = await call({ ...request, apiVersion: "1.0.0" }, provider);
      if (result.status !== 200) throw new Error(JSON.stringify(result.body));
      return result.body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => {
      saved = next; persistFunctionalResetSession(localStorage, next); return true;
    }} /></HelmetProvider>);
    send(DOMAINS[0].text);
    await waitFor(() => expect(saved.workingDraft?.readyReview).toBeTruthy());
    expect(saved.project).toBeNull();
    expect(screen.getByTestId("project-document-action")).toHaveTextContent("Validez d’abord des choix dans le projet.");
    expect(screen.getByRole("button", { name: "Générer les documents" })).toBeDisabled();

    send(confirmation);
    await waitFor(() => expect(saved.project?.confirmationDecision.status).toBe("ADOPTED"));
    expect(saved.project?.revision).toBe(1);
    expect(loadFunctionalResetSession(localStorage).project?.projectDigest).toBe(saved.project?.projectDigest);
    expect(Number(screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ }).getAttribute("aria-valuenow"))).toBeGreaterThan(0);
    expect(screen.getByTestId("project-cockpit-counts")).not.toHaveTextContent("0 élément confirmé");
    expect(screen.getByTestId("project-group-scientific-question")).toHaveTextContent(/ECV|âge/i);
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer les documents" })).toBeEnabled());
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
    await waitFor(() => expect(bridge.mock.calls.some(([request]) => request.currentProject?.revision === 1
      && request.prepareWorkingDraft && request.conversation.turns.some(turn => turn.content === confirmation))).toBe(true));
    await waitFor(() => expect(saved.workingDraft?.readyReview?.contribution.scientificContent.candidateObjects
      .some(object => object.content.includes("en France"))).toBe(true));
    expect(saved.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === confirmation)).toHaveLength(1);
    expect(bridge.mock.calls.some(([request]) => Boolean(request.documentDraftRequest))).toBe(false);

    fireEvent.click(screen.getByTestId("project-document-action").querySelector("button")!);
    await waitFor(() => expect(saved.drciDraftPacks, JSON.stringify(saved.documents.lastFailure)).toHaveLength(1));
    const firstPack = saved.drciDraftPacks![0];
    expect(firstPack.project.projectVersion).toBe(saved.project?.versionId);
    await waitFor(() => expect(screen.getByTestId("document-generation-1")).toHaveTextContent("Documents V1 disponibles"));

    fireEvent.click(screen.getByRole("button", { name: "Conception" }));
    send("Je veux aussi une visite à M12.");
    await waitFor(() => expect(saved.workingDraft?.readyReview?.contribution.scientificContent.candidateObjects
      .some(object => object.content.includes("M12"))).toBe(true));
    expect(saved.project?.revision).toBe(1);
    expect(saved.drciDraftPacks).toEqual([firstPack]);
    send("je valide");
    await waitFor(() => expect(saved.project?.revision).toBe(2));
    const currentObjects = ensureCanonicalProjectState(saved.project!).objects.filter(object => object.actuality === "CURRENT");
    expect(currentObjects.some(object => object.content.includes("en France"))).toBe(true);
    expect(currentObjects.some(object => object.content.includes("M12"))).toBe(true);
    expect(currentObjects.some(object => object.content.includes("Volontaires sains de différents âges"))).toBe(true);
    expect(saved.drciDraftPacks).toEqual([firstPack]);
    expect(bridge.mock.calls.filter(([request]) => Boolean(request.documentDraftRequest))).toHaveLength(1);
    fireEvent.click(screen.getByTestId("project-document-action").querySelector("button")!);
    await waitFor(() => expect(saved.drciDraftPacks).toHaveLength(2));
    expect(saved.drciDraftPacks![0]).toEqual(firstPack);
    expect(saved.drciDraftPacks![1].project.projectVersion).toBe(saved.project?.versionId);
    expect(saved.drciDraftPacks![1].project.projectDigest).toBe(saved.project?.projectDigest);
    await waitFor(() => expect(screen.getByTestId("document-generation-1")).toBeInTheDocument());
    expect(screen.getByTestId("document-generation-2")).toHaveTextContent("Documents V2 disponibles");
  });

  it("binds 'tout sauf le point 3' to the visible checkpoint and keeps the excluded decision out of Project", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    bridge.mockImplementation(async req => {
      const result = await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response("LOCAL_SYNTHETIC — sélection entendue.")));
      if (result.status !== 200) throw new Error(JSON.stringify(result.body)); return result.body;
    });
    const initial = sessionFor(), request = requestFor(initial), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const workingDraft = prepareContinuousWorkingDraft(initial, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    let saved: FunctionalResetSession = { ...initial, studyProposal: composition, workingDraft };
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    const excludedRef = reviewDecisionRefsInDisplayOrder(workingDraft.readyReview!.candidate)[2]!;
    const excludedGroup = contributionDecisionScopeGroups(workingDraft.readyReview!.candidate, null).find(group => group.includes(excludedRef))!;
    expect(excludedGroup.length).toBeGreaterThan(0);
    send("tout sauf le point 3");
    await waitFor(() => expect(saved.project?.confirmationDecision.status).toBe("ADOPTED"));
    expect(saved.project?.confirmationDecision.targets).not.toContain(excludedRef);
    expect(saved.project?.confirmationDecision.targets.some(ref => excludedGroup.includes(ref))).toBe(false);
    expect(saved.studyProposal?.state).toBe("REVIEW_REQUIRED");
    expect(bridge).toHaveBeenCalledTimes(1);
  });

  it("uses one explicit action, preserves adopted Project on transport failure, and retrieves the same request without another adoption", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(), request = requestFor(initial), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const workingDraft = prepareContinuousWorkingDraft(initial, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    let saved: FunctionalResetSession = { ...initial, studyProposal: composition, workingDraft };
    bridge.mockRejectedValue(new TypeError("LOCAL_SYNTHETIC_LOST_RESPONSE"));
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={state => { saved = state; return true; }} /></HelmetProvider>);

    expect(screen.getByRole("button", { name: "Protocole / documents" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    expect(screen.getByTestId("project-document-finalization-workspace")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documents du projet" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Valider ces choix" })).toHaveLength(1);
    for (const technicalStep of ["Préparer l’enregistrement", "Revoir les changements", "Préparer l’adoption", "Enregistrer dans le projet", "Préparer les documents"])
      expect(screen.queryByRole("button", { name: technicalStep })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(saved.project?.confirmationDecision.status).toBe("ADOPTED"));
    expect(bridge).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId("adopted-project-document-generation")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
    await waitFor(() => expect(bridge).toHaveBeenCalledTimes(1));
    await screen.findByTestId("document-generation-recovery");
    const adoptedVersion = saved.project!.versionId;
    expect(saved.documents.lastFailure?.code).toBe("FUNCTIONAL_DOCUMENT_BOUNDARY_ERROR");
    expect(screen.getByText("Documents indisponibles")).toBeInTheDocument();
    expect(screen.getByText("La génération des documents n’a pas abouti. Votre projet et les versions précédentes sont conservés.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Valider ces choix" })).toBeNull();

    const firstRequest = JSON.stringify(bridge.mock.calls[0][0]);
    fireEvent.click(screen.getByRole("button", { name: "Retrouver les documents" }));
    await waitFor(() => expect(bridge).toHaveBeenCalledTimes(2));
    expect(JSON.stringify(bridge.mock.calls[1][0])).toBe(firstRequest);
    expect(saved.project?.versionId).toBe(adoptedVersion);
    expect(saved.project?.confirmationDecision.status).toBe("ADOPTED");
  });

  it.each(["saved", "refused", "throws"])("opens all four validated documents after separate confirmation and generation (local save %s)", async saveDocuments => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial=sessionFor(), request=requestFor(initial), update=updateFor(request);
    const composition=acceptWorkingDraftUpdate(update,request).composition!;
    const workingDraft=prepareContinuousWorkingDraft(initial,composition,update,prepareWorkingDraftRequest(request).inputDigest);
    let saved: FunctionalResetSession={...initial,studyProposal:composition,workingDraft};
    bridge.mockImplementation(async (req: ProductBridgeRequest) => {
      const project=req.currentProject!, source=req.documentDraftRequest!, packet=prepareDrciDraftPack(project,source);
      const generated={documents:DRCI_DOCUMENT_KINDS.map(kind=>({kind,title:`LOCAL_SYNTHETIC ${kind}`,
        sections:[{title:"Dossier de travail",paragraphs:[kind === "PROTOCOL_SYNOPSIS"
          ? "Texte synthétique de qualification mécanique sans aucune validation scientifique humaine. ".repeat(60)
          : packet.sourceFacts[0].content],sourceRefs:[packet.sourceFacts[0].ref]}],missingElements:[]})),
        crfRows:source.crf.fields.map((field,index)=>({variableRef:field.canonicalVariableId,variableId:`FIELD_${index}`,label:field.label,
          domain:"À préciser",visit:"À préciser",definition:field.label,entryType:"Texte",unit:null,categories:null,dataOrigin:"UNSPECIFIED",
          source:"À préciser",required:"À préciser",condition:null,derivedFrom:[],derivation:null,controls:[],analysisImpact:null,specificationStatus:"UNSPECIFIED"}))};
      return {apiVersion:"1.0.0",assistantReply:"Dossier de travail disponible.",assistantTurn:{turnId:"doc-answer",role:"NOXIA",content:"Dossier de travail disponible."},
        observability:{providerCalls:[]},documentDraftPack:materializeDrciDraftPack(generated,{project,packet,generatedAt:initial.updatedAt})};
    });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next=>{
      if (next.drciDraftPacks?.length) {
        if (saveDocuments === "throws") throw new DOMException("LOCAL_SYNTHETIC", "QuotaExceededError");
        if (saveDocuments === "refused") return false;
      }
      saved=next; return true;
    }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    expect(screen.getByTestId("project-document-finalization-workspace")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"Valider ces choix"}));
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    expect(bridge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
    await screen.findByTestId("study-deliverable-workspace");
    expect(bridge).toHaveBeenCalledTimes(1);
    expect(saved.project?.revision).toBe(1);
    expect(screen.getByTestId("document-generation-1")).toHaveTextContent("Documents V1 disponibles · projet version 1");
    if (saveDocuments === "saved") expect(saved.drciDraftPacks?.[0].project).toEqual({ projectId: saved.project?.projectId,
      projectVersion: saved.project?.versionId, projectDigest: saved.project?.projectDigest });
    for (const kind of DRCI_DOCUMENT_KINDS) expect(screen.getAllByText(`LOCAL_SYNTHETIC ${kind}`,{exact:true}).length).toBeGreaterThan(0);
    if (saveDocuments !== "saved") expect(screen.getByRole("alert")).toHaveTextContent("non enregistrés");
    if (saveDocuments === "saved") {
      fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
      await waitFor(() => expect(saved.drciDraftPacks).toHaveLength(2));
      expect(screen.getByTestId("document-generation-1")).toBeInTheDocument();
      expect(screen.getByTestId("document-generation-2")).toHaveTextContent("Documents V2 disponibles");
      const previousEntries = saved.entries.length;
      bridge.mockRejectedValueOnce(new Error("LOCAL_SYNTHETIC_DOC_FAILURE"));
      fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
      await screen.findByTestId("document-generation-recovery");
      expect(saved.drciDraftPacks).toHaveLength(2);
      expect(saved.project?.revision).toBe(1);
      expect(saved.entries).toHaveLength(previousEntries);
      expect(screen.getByTestId("document-generation-1")).toBeInTheDocument();
      expect(screen.getByTestId("document-generation-2")).toBeInTheDocument();
    }
  });

  it("generates the four documents directly from an already adopted Project without adopting it again", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial=sessionFor(), request=requestFor(initial), update=updateFor(request);
    const composition=acceptWorkingDraftUpdate(update,request).composition!;
    const workingDraft=prepareContinuousWorkingDraft(initial,composition,update,prepareWorkingDraftRequest(request).inputDigest);
    const ready=workingDraft.readyReview!;
    const project=confirmResearchProjectContribution({ contribution:ready.contribution,current:null,projectId:initial.projectId,
      authority:initial.projectAuthority,confirmedAt:initial.updatedAt,reviewedProjection:ready.candidate.humanReviewProjection,
      selectedChangeRefs:ready.candidate.humanReviewProjection.coveredChangeRefs,confirmationSourceRefs:["human-review-button"] });
    let saved:FunctionalResetSession={...initial,project,studyProposal:null,workingDraft:null};
    bridge.mockImplementation(async (req:ProductBridgeRequest)=>{
      const source=req.documentDraftRequest!, packet=prepareDrciDraftPack(project,source);
      const generated={documents:DRCI_DOCUMENT_KINDS.map(kind=>({kind,title:`LOCAL_SYNTHETIC ${kind}`,
        sections:[{title:"Dossier de travail",paragraphs:[kind === "PROTOCOL_SYNOPSIS"
          ? "Texte synthétique de qualification mécanique sans aucune validation scientifique humaine. ".repeat(60)
          : packet.sourceFacts[0].content],sourceRefs:[packet.sourceFacts[0].ref]}],missingElements:[]})),
        crfRows:source.crf.fields.map((field,index)=>({variableRef:field.canonicalVariableId,variableId:`FIELD_${index}`,label:field.label,
          domain:"À préciser",visit:"À préciser",definition:field.label,entryType:"Texte",unit:null,categories:null,dataOrigin:"UNSPECIFIED",
          source:"À préciser",required:"À préciser",condition:null,derivedFrom:[],derivation:null,controls:[],analysisImpact:null,specificationStatus:"UNSPECIFIED"}))};
      return {apiVersion:"1.0.0",assistantReply:"Dossier de travail disponible.",assistantTurn:{turnId:"doc-answer",role:"NOXIA",content:"Dossier de travail disponible."},
        observability:{providerCalls:[]},documentDraftPack:materializeDrciDraftPack(generated,{project,packet,generatedAt:initial.updatedAt})};
    });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next=>{saved=next;return true;}} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button",{name:"Protocole / documents"}));
    expect(screen.getByTestId("adopted-project-document-generation")).toHaveTextContent("Choix enregistrés dans le projet · version 1");
    expect(screen.getByRole("button",{name:"Générer les documents"})).toBeEnabled();
    const adoptedVersion=project.versionId;
    fireEvent.click(screen.getByRole("button",{name:"Générer les documents"}));
    await waitFor(()=>expect(bridge).toHaveBeenCalledTimes(1));
    await screen.findByTestId("document-generation-history");
    expect(bridge.mock.calls[0][0].currentProject?.versionId).toBe(adoptedVersion);
    expect(saved.project?.versionId).toBe(adoptedVersion);
    for (const kind of DRCI_DOCUMENT_KINDS) expect(screen.getAllByText(`LOCAL_SYNTHETIC ${kind}`,{exact:true}).length).toBeGreaterThan(0);
  });

  it("keeps Chat usable during an explicit document request and localizes a document failure", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "OFF");
    const initial = sessionFor(), request = requestFor(initial), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const ready = prepareContinuousWorkingDraft(initial, composition, update, prepareWorkingDraftRequest(request).inputDigest).readyReview!;
    const project = confirmResearchProjectContribution({ contribution: ready.contribution, current: null, projectId: initial.projectId,
      authority: initial.projectAuthority, confirmedAt: initial.updatedAt, reviewedProjection: ready.candidate.humanReviewProjection,
      selectedChangeRefs: ready.candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: ["human-review-button"] });
    let saved: FunctionalResetSession = { ...initial, project, studyProposal: null, workingDraft: null };
    let failDocument!: (reason: Error) => void;
    const pendingDocument = new Promise<ProductBridgeResponse>((_resolve, reject) => { failDocument = reject; });
    bridge.mockImplementation(async (req: ProductBridgeRequest) => req.documentDraftRequest ? pendingDocument
      : (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response("LOCAL_SYNTHETIC — Chat pendant DOC.")), false)).body);
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
    await screen.findByTestId("document-generation-progress");
    expect(screen.getByRole("progressbar", { name: "Progression estimée des documents" })).toHaveAttribute("aria-valuenow", "0");
    fireEvent.click(screen.getByRole("button", { name: "Conception" }));
    expect(screen.getByTestId("document-generation-progress")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Votre message" })).toBeEnabled();
    send("Peut-on discuter de l’analyse ?");
    await screen.findByText("LOCAL_SYNTHETIC — Chat pendant DOC.");
    await act(async () => { failDocument(new Error("LOCAL_SYNTHETIC_DOC_FAILURE")); });
    expect(saved.project?.versionId).toBe(project.versionId);
    expect(saved.entries.some(entry => entry.kind === "TEXT" && entry.role === "NOXIA" && entry.content === "LOCAL_SYNTHETIC — Chat pendant DOC.")).toBe(true);
    expect(screen.queryByTestId("document-generation-progress")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    expect(screen.getByTestId("document-generation-recovery")).toHaveTextContent("Votre projet et les versions précédentes sont conservés.");
  });

  it("scrolls only the conversation pane and grows then shrinks the composer", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "OFF");
    bridge.mockImplementation(async (req: ProductBridgeRequest) =>
      (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response("LOCAL_SYNTHETIC — réponse reçue.")), false)).body);
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={createFunctionalResetSession()} /></HelmetProvider>);
    const pane = screen.getByTestId("conversation-scroll-panel");
    const project = screen.getByTestId("project-scroll-panel");
    expect(screen.queryByRole("button", { name: "Retour en haut de la conversation" })).toBeNull();
    const scrollTo = vi.fn(); Object.defineProperty(pane, "scrollTo", { value: scrollTo, configurable: true });
    Object.defineProperty(pane, "scrollTop", { value: 600, writable: true, configurable: true });
    fireEvent.scroll(pane);
    fireEvent.click(screen.getByRole("button", { name: "Retour en haut de la conversation" }));
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(project).not.toBe(pane);

    const textarea = screen.getByRole("textbox", { name: "Votre message" }) as HTMLTextAreaElement;
    Object.defineProperty(textarea, "scrollHeight", { get: () => textarea.value ? 900 : 72, configurable: true });
    expect(textarea.rows).toBe(3);
    fireEvent.change(textarea, { target: { value: "Un long message scientifique. ".repeat(40) } });
    expect(Number.parseFloat(textarea.style.height)).toBeLessThanOrEqual(264);
    expect(textarea.className).toContain("overflow-y-auto");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(bridge).not.toHaveBeenCalled();
    fireEvent.keyDown(textarea, { key: "Enter" });
    await screen.findByText("LOCAL_SYNTHETIC — réponse reçue.");
    await waitFor(() => expect(textarea.value).toBe(""));
    expect(textarea.style.height).toBe("72px");
  });

  it("preserves a Knowledge integrity failure instead of replacing it by empty evidence", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial=sessionFor(), request=requestFor(initial), update=updateFor(request);
    const composition=acceptWorkingDraftUpdate(update,request).composition!;
    const workingDraft=prepareContinuousWorkingDraft(initial,composition,update,prepareWorkingDraftRequest(request).inputDigest);
    let saved: FunctionalResetSession={...initial,studyProposal:composition,workingDraft};
    vi.spyOn(documentaryConversation,"acquireDocumentKnowledge").mockImplementationOnce(()=>{throw new Error("KNOWLEDGE_BINDING_INVALID");});
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next=>{saved=next;return true;}} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button",{name:"Valider ces choix"}));
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    expect(bridge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Protocole / documents"}));
    fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
    await screen.findByTestId("document-generation-recovery");
    expect(saved.project?.confirmationDecision.status).toBe("ADOPTED");
    expect(JSON.stringify(saved.documents.lastFailure)).toContain("KNOWLEDGE_BINDING_INVALID");
    expect(bridge).not.toHaveBeenCalled();
  });

  it("does not offer a paid reroll after a terminal document failure", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial=sessionFor(), request=requestFor(initial), update=updateFor(request);
    const composition=acceptWorkingDraftUpdate(update,request).composition!;
    const workingDraft=prepareContinuousWorkingDraft(initial,composition,update,prepareWorkingDraftRequest(request).inputDigest);
    bridge.mockRejectedValue(new ProductBridgeClientError("PUBLIC_PROVIDER_UNKNOWN_AFTER_DISPATCH","LOCAL_SYNTHETIC"));
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={{...initial,studyProposal:composition,workingDraft}} onSessionChange={()=>true} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button",{name:"Valider ces choix"}));
    fireEvent.click(screen.getByRole("button",{name:"Protocole / documents"}));
    await waitFor(() => expect(screen.getByTestId("adopted-project-document-generation")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
    await screen.findByTestId("document-generation-recovery");
    expect(screen.queryByRole("button",{name:"Retrouver les documents"})).toBeNull();
    expect(bridge).toHaveBeenCalledTimes(1);
  });

  it("starts the next foreground while the previous background is pending and rejects the late stale commit", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let releaseFirstBackground!: () => void;
    const firstBackgroundGate = new Promise<void>(resolve => { releaseFirstBackground = resolve; });
    let backgroundCalls = 0;
    bridge.mockImplementation(async req => {
      if (!req.prepareWorkingDraft) {
        const latest = [...req.conversation.turns].reverse().find(turn => turn.role === "USER")!;
        const provider = vi.fn<typeof fetch>().mockResolvedValue(response(`LOCAL_SYNTHETIC — foreground ${latest.content}`));
        const result = await call({ ...req, apiVersion: "1.0.0" }, provider);
        if (result.status !== 200) throw new Error(JSON.stringify(result.body));
        return result.body;
      }
      backgroundCalls += 1;
      if (backgroundCalls === 1) await firstBackgroundGate;
      const packet = JSON.parse(prepareWorkingDraftRequest(req).context);
      const provider = vi.fn<typeof fetch>().mockResolvedValue(response(JSON.stringify({
        ...updateFor(req),
        proposal: controlledStudyProposal(packet.contextDigest, DOMAINS[1]),
        explicitDecisions: [],
        inferredAtomRefs: [],
      })));
      const result = await call({ ...req, apiVersion: "1.0.0" }, provider);
      if (result.status !== 200) throw new Error(JSON.stringify(result.body));
      return result.body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={state => { saved = state; return true; }} /></HelmetProvider>);
    send(DOMAINS[1].text);
    await screen.findByText(`LOCAL_SYNTHETIC — foreground ${DOMAINS[1].text}`);
    await waitFor(() => expect(backgroundCalls).toBe(1));
    const followUp = "Je conserve ce design et je veux maintenant préciser la visite à six mois.";
    send(followUp);
    await screen.findByText(`LOCAL_SYNTHETIC — foreground ${followUp}`);
    expect(backgroundCalls).toBe(1);
    expect(bridge.mock.calls.filter(([request]) => !request.prepareWorkingDraft)).toHaveLength(2);
    releaseFirstBackground();
    await waitFor(() => expect(backgroundCalls).toBe(2));
    await waitFor(() => expect(saved.workingDraft?.sourceUserTurnRef)
      .toBe([...saved.runtimeTurns].reverse().find(turn => turn.role === "USER")?.turnId));
    expect(saved.workingDraftFailure).toBeNull();
    expect(saved.project).toBeNull();
    expect(bridge).toHaveBeenCalledTimes(4);
  });

  it("qualifies the 10s foreground / 70s background synthetic timeline without blocking the next turn", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let backgroundCalls = 0;
    bridge.mockImplementation(async req => {
      const delay = req.prepareWorkingDraft ? 70_000 : 10_000;
      if (req.prepareWorkingDraft) backgroundCalls += 1;
      await new Promise(resolve => setTimeout(resolve, delay));
      if (!req.prepareWorkingDraft) {
        const latest = [...req.conversation.turns].reverse().find(turn => turn.role === "USER")!;
        return (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>()
          .mockResolvedValue(response(`LOCAL_SYNTHETIC_TIMELINE — ${latest.content}`)))).body;
      }
      const packet = JSON.parse(prepareWorkingDraftRequest(req).context);
      return (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response(JSON.stringify({
        ...updateFor(req), proposal: controlledStudyProposal(packet.contextDigest, DOMAINS[1]),
        explicitDecisions: [], inferredAtomRefs: [],
      }))))).body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={state => { saved = state; return true; }} /></HelmetProvider>);
    send(DOMAINS[1].text);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByText(`LOCAL_SYNTHETIC_TIMELINE — ${DOMAINS[1].text}`)).toBeInTheDocument();
    expect(backgroundCalls).toBe(1);
    const followUp = "Je précise le calendrier sans attendre la préparation précédente.";
    send(followUp);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByText(`LOCAL_SYNTHETIC_TIMELINE — ${followUp}`)).toBeInTheDocument();
    expect(backgroundCalls).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(backgroundCalls).toBe(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(70_000); });
    expect(saved.workingDraft?.sourceUserTurnRef)
      .toBe([...saved.runtimeTurns].reverse().find(turn => turn.role === "USER")?.turnId);
    expect(saved.workingDraftFailure).toBeNull();
  });

  it("keeps the foreground first when a 20s Chat is followed by a 5s background", async () => {
    vi.useFakeTimers();
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let backgroundCalls = 0;
    bridge.mockImplementation(async req => {
      await new Promise(resolve => setTimeout(resolve, req.prepareWorkingDraft ? 5_000 : 20_000));
      if (!req.prepareWorkingDraft) {
        const latest = [...req.conversation.turns].reverse().find(turn => turn.role === "USER")!;
        return (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>()
          .mockResolvedValue(response(`LOCAL_SYNTHETIC_REVERSED_TIMELINE — ${latest.content}`)))).body;
      }
      backgroundCalls += 1;
      const packet = JSON.parse(prepareWorkingDraftRequest(req).context);
      return (await call({ ...req, apiVersion: "1.0.0" }, vi.fn<typeof fetch>().mockResolvedValue(response(JSON.stringify({
        ...updateFor(req), proposal: controlledStudyProposal(packet.contextDigest, DOMAINS[1]),
        explicitDecisions: [], inferredAtomRefs: [],
      }))))).body;
    });
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={state => { saved = state; return true; }} /></HelmetProvider>);
    send(DOMAINS[1].text);
    await act(async () => { await vi.advanceTimersByTimeAsync(19_999); });
    expect(screen.queryByText(`LOCAL_SYNTHETIC_REVERSED_TIMELINE — ${DOMAINS[1].text}`)).not.toBeInTheDocument();
    expect(backgroundCalls).toBe(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(screen.getByText(`LOCAL_SYNTHETIC_REVERSED_TIMELINE — ${DOMAINS[1].text}`)).toBeInTheDocument();
    expect(backgroundCalls).toBe(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(4_999); });
    expect(backgroundCalls).toBe(0);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(backgroundCalls).toBe(1);
    expect(saved.workingDraft?.sourceUserTurnRef)
      .toBe([...saved.runtimeTurns].reverse().find(turn => turn.role === "USER")?.turnId);
  });

  it("does not start a background preparation when the foreground fails", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    bridge.mockRejectedValue(new Error("LOCAL_SYNTHETIC_FOREGROUND_FAILURE"));
    let saved = createFunctionalResetSession();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={state => { saved = state; return true; }} /></HelmetProvider>);
    send(DOMAINS[4].text);
    await screen.findByText("LOCAL_SYNTHETIC_FOREGROUND_FAILURE");
    expect(screen.getByRole("textbox", { name: "Votre message" })).toHaveValue(DOMAINS[4].text);
    expect(bridge).toHaveBeenCalledTimes(1);
    expect(bridge.mock.calls.some(([request]) => request.prepareWorkingDraft)).toBe(false);
    expect(saved.workingDraft).toBeFalsy();
    expect(saved.project).toBeNull();
  });
});
