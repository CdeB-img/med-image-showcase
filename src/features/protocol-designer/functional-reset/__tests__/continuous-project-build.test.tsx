import { captureProjectPreparation, addProjectPreparation, consumeProjectPreparation, preparationCheckpointValid, projectPreparationReview } from "../project-preparation-lifecycle";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRecordedProtocolDesignerFetch } from "../../../../../server/protocol-designer-provider-replay";
import { createCanaryCampaignPolicy } from "../../../../../server/protocol-designer-canary-policy";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge, type ApiResponse } from "../../../../../api/protocol-designer-bridge";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../../server/protocol-designer-durable-guard";
import { acceptWorkingDraftUpdate, resolveWorkingDraftSourceQuote, compactWorkingDraftAdvice, isWorkingDraftReviewOnlyRequest, validatePreparedWorkingReview, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, recommendedWorkingScope, type WorkingDraftUpdate } from "../continuous-project-build";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import { ensureCanonicalProjectState } from "@/features/research-project-construction/canonical-project-backbone";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession,
  projectHumanDecisionForBridgeTrace,
  recordConversationConfirmationReceipt, recordWorkingDraftPreparation, workingDraftRecoveryIdentity } from "../session";
import type { FunctionalResetSession } from "../session";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import * as traceAdapter from "../end-to-end-trace-adapter";
import { reviewDecisionRefsInDisplayOrder } from "../ContributionReview";
import { contributionDecisionScopeGroups } from "@/features/research-project-construction/contribution-owner-boundary";
import * as documentaryConversation from "../documentary-conversation";
import { ProductBridgeClientError } from "../../product-bridge-client";
import { DRCI_DOCUMENT_KINDS, prepareDrciDraftPack, materializeDrciDraftPack } from "@/features/document-projection/drci-draft-pack";
import { preflightWorkingDraftKnowledgeSource, prepareStandardContextualReasoningRequest } from "@/features/scientific-thinking/contextual-reasoning-input";
import { buildStudyProposalSelectionContribution, propagateStudyProposalDecision, selectedStudyProposalAtoms } from "../study-proposal-standard";
import { logicalDigest, normalizeScientificText } from "@/features/knowledge-engine/canonical";
import { readNaturalCandidateDecision } from "../natural-conversation-policy";
import { createProductTraceRunId } from "../../scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "../../../validation-architecture/trace-structural-validation";
import { PROVIDER_CALL_OBSERVABILITY_CONTRACT, PROVIDER_CALL_OBSERVABILITY_VERSION,
  PROVIDER_PRICING_SNAPSHOT_DATE, providerCallRequestObservability, type ProviderCallRecord } from "../../provider-call-observability";

const bridge = vi.hoisted(() => vi.fn());
const recoveryRead = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(),
  requestProtocolDesignerBridge: bridge, readWorkingDraftPreparation: recoveryRead }));
afterEach(() => { cleanup(); bridge.mockReset(); recoveryRead.mockReset(); localStorage.clear(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const response = (text: string) => new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC", model: "gpt-5.6-terra", status: "completed",
  output: [{ content: [{ type: "output_text", text }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } }));
const sessionFor = (text: string = DOMAINS[1].text) => {
  const session = createFunctionalResetSession();
  session.runtimeTurns = [{ turnId: "u1", role: "USER", content: text, createdAt: session.createdAt },
    { turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", role: "NOXIA", content: "LOCAL_SYNTHETIC — architecture proposée, non adoptée.", createdAt: session.createdAt }];
  return session;
};
const requestFor = (s: FunctionalResetSession): ProductBridgeRequest => { const latest = [...s.runtimeTurns].reverse().find(t => t.role === "USER")!;
  const response = workingDraftRecoveryIdentity(s, latest.turnId);
  return ({ apiVersion: "1.0.0", conversation: {
  conversationId: s.conversationId, language: "fr", turns: s.runtimeTurns }, currentProject: s.project,
  evaluatePersistentDelta: false, prepareWorkingDraft: true,
  ...(!readNaturalCandidateDecision(latest.content) && response ? { workingDraftScientificSource: {
    kind: "BOUND_USER_TURN" as const, sourceUserTurnId: latest.turnId, sourceResponseTurnId: response.sourceResponseRef,
    sourceDigest: logicalDigest(latest.content) } } : {}),
  ...(s.studyProposal ? { studyProposalContext: s.studyProposal } : {}) }); };
const updateFor = (r: ProductBridgeRequest, domain: typeof DOMAINS[number] | typeof multimodal = DOMAINS[1]): WorkingDraftUpdate => ({ requestType: "STUDY_UPDATE",
  proposal: controlledStudyProposal(prepareWorkingDraftRequest(r).inputDigest, domain as typeof DOMAINS[number]),
  explicitDecisions: [{ atomRef: "design", sourceTurnRef: "u1", quote: domain.text }], inferredAtomRefs: [], rejectedAtomRefs: [] });
const multimodal = { ...DOMAINS[2], id: "MULTIMODAL", text: "Je veux une cohorte longitudinale associant mesures cliniques, questionnaire et données d'imagerie, sans intervention, aux mêmes visites.",
  question: "Étudier les trajectoires cliniques et multimodales", measure: "Mesures cliniques, questionnaire et données d'imagerie", variable: "Mesure clinique de référence" };
const call = async (r: ProductBridgeRequest, provider: typeof fetch, on = true) => executeProtocolDesignerBridge({ body: r,
  apiKey: null, openAiApiKey: "LOCAL_SYNTHETIC", chatRuntime: "TERRA", autonomousProjectBuild: on,
  fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
const checkpointSession = (initial: FunctionalResetSession, update: WorkingDraftUpdate) => {
  const preparation = captureProjectPreparation(initial);
  const accepted = acceptWorkingDraftUpdate(update, preparation.checkpoint!.request);
  return consumeProjectPreparation(addProjectPreparation(initial, preparation), preparation.checkpoint!.preparationId,
    { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
};
const send = (text: string) => { fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };

describe("continuous working composition — synthetic mechanics, no scientific approval", () => {
  const confirmedTurn = (content: string, sourceText: string = DOMAINS[1].text) => {
    const initial = sessionFor(sourceText);
    const user = { turnId: "u2", role: "USER" as const, content, createdAt: initial.createdAt };
    const receipt = recordConversationConfirmationReceipt(initial, user, readNaturalCandidateDecision(content));
    return { ...receipt, runtimeTurns: [...initial.runtimeTurns, user,
      { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA" as const,
        content: "LOCAL_SYNTHETIC — suite de la discussion.", createdAt: initial.createdAt }] };
  };
  it.each(["ok", "oui je valide", "oui je valide. ce sera en France", "ça me convient; excluons aussi les fumeurs"])(
    "binds Knowledge to the presented scientific source, not the confirming turn: %s", content => {
      const session = confirmedTurn(content), preparation = captureProjectPreparation(session), request = preparation.checkpoint!.request;
      expect(preparation.sourceTurnRef).toBe("u2");
      expect(preparation.checkpoint!.conversationCutoffTurnId).toBe("noxia-turn:22222222-2222-4222-8222-222222222222");
      expect(preparation.checkpoint!.preparationTrigger).toBe("EXPLICIT_PROJECT_PREPARATION_ACTION");
      expect(request.workingDraftScientificSource).toMatchObject({ kind: "BOUND_USER_TURN", sourceUserTurnId: "u1" });
      expect(preflightWorkingDraftKnowledgeSource(request).content).toBe(session.runtimeTurns[0]!.content);
      expect(JSON.parse(prepareWorkingDraftRequest(request).context).RECENT_CONVERSATION.at(-2).content).toBe(content);
      expect(preparationCheckpointValid(session, preparation.checkpoint!)).toBe(true);
      persistFunctionalResetSession(localStorage, addProjectPreparation(session, preparation));
      expect(loadFunctionalResetSession(localStorage).workingDraftPreparations?.[0]?.checkpoint?.scientificSourceIdentity)
        .toEqual(request.workingDraftScientificSource);
      const later = { ...session, runtimeTurns: [...session.runtimeTurns,
        { turnId: "u3", role: "USER" as const, content: "Nouvelle question indépendante.", createdAt: session.createdAt }] };
      expect(preparationCheckpointValid(later, preparation.checkpoint!)).toBe(true);
      expect(preparation.checkpoint!.scientificSourceIdentity).toEqual(request.workingDraftScientificSource);
    });
  it("fails closed when the source turn, response or digest no longer belongs to this checkpoint", () => {
    const request = captureProjectPreparation(confirmedTurn("ok")).checkpoint!.request;
    const source = request.workingDraftScientificSource!;
    expect(source.kind).toBe("BOUND_USER_TURN");
    if (source.kind !== "BOUND_USER_TURN") return;
    for (const replacement of [
      { ...source, sourceUserTurnId: "turn:other-session" },
      { ...source, sourceResponseTurnId: "noxia-turn:other-session" },
      { ...source, sourceDigest: "ke1-forged" },
    ]) expect(() => preflightWorkingDraftKnowledgeSource({ ...request,
      workingDraftScientificSource: replacement })).toThrow("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
  });
  it("retains an inseparable mixed correction without claiming an unproven scientific source", () => {
    const session = confirmedTurn("ça me convient, et excluons aussi les fumeurs");
    const request = captureProjectPreparation(session).checkpoint!.request;
    expect(request.conversation.turns.at(-2)?.content).toBe("ça me convient, et excluons aussi les fumeurs");
    expect(request.workingDraftScientificSource).toBeUndefined();
    expect(() => preflightWorkingDraftKnowledgeSource(request)).toThrow("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    expect(session.project).toBeNull();
  });
  it("replays the P2-shaped last 'ok' through the real Working Draft owner with the earlier Knowledge source", () => {
    const session = confirmedTurn("ok"), request = captureProjectPreparation(session).checkpoint!.request;
    const update = updateFor(request);
    const accepted = acceptWorkingDraftUpdate(update, request);
    expect(accepted.composition).not.toBeNull();
    expect(preflightWorkingDraftKnowledgeSource(request).content).toBe(session.runtimeTurns[0]!.content);
    expect(request.conversation.turns.at(-2)?.content).toBe("ok");
    expect(accepted.composition!.sourceTurnRef).toBe("u2");
  });
  it.each(["ok", "oui", "ça me convient"])("uses the checkpoint scientific source across Knowledge and Scientific Thinking after %s", assent => {
    const initial = sessionFor();
    const initialRequest = requestFor(initial);
    const composition = acceptWorkingDraftUpdate(updateFor(initialRequest), initialRequest).composition!;
    const session = confirmedTurn(assent);
    const request = captureProjectPreparation(session).checkpoint!.request;
    const knowledgeSource = preflightWorkingDraftKnowledgeSource(request);
    const contribution = buildStudyProposalSelectionContribution({ composition, ...recommendedWorkingScope(composition),
      project: null, projectId: session.projectId, conversationId: session.conversationId,
      proposalTurn: session.runtimeTurns[1]!, selectionTurn: session.runtimeTurns[2]!, createdAt: session.createdAt,
      preparingReview: true });
    const prepared = prepareStandardContextualReasoningRequest({ contribution, turns: request.conversation.turns,
      sessionId: session.conversationId, workingDraftKnowledgeSource: knowledgeSource });
    expect(prepared).not.toBeNull();
    expect(knowledgeSource.content).toBe(initial.runtimeTurns[0]!.content);
    expect(prepared!.scientificInput.originalExpression).toBe(knowledgeSource.content);
    if (prepared!.request.imaging) expect(prepared!.request.imaging.input.originalExpression).toBe(knowledgeSource.content);
  });
  it("keeps the same source in the Imaging handoff for a confirmed cardiac MRI study", () => {
    const initial = sessionFor(DOMAINS[0].text);
    const initialRequest = requestFor(initial);
    const composition = acceptWorkingDraftUpdate(updateFor(initialRequest, DOMAINS[0]), initialRequest).composition!;
    const session = confirmedTurn("ok", DOMAINS[0].text);
    const request = captureProjectPreparation(session).checkpoint!.request;
    const knowledgeSource = preflightWorkingDraftKnowledgeSource(request);
    const contribution = buildStudyProposalSelectionContribution({ composition, ...recommendedWorkingScope(composition),
      project: null, projectId: session.projectId, conversationId: session.conversationId,
      proposalTurn: session.runtimeTurns[1]!, selectionTurn: session.runtimeTurns[2]!, createdAt: session.createdAt,
      preparingReview: true });
    const prepared = prepareStandardContextualReasoningRequest({ contribution, turns: request.conversation.turns,
      sessionId: session.conversationId, workingDraftKnowledgeSource: knowledgeSource });
    expect(prepared?.scientificInput.originalExpression).toBe(normalizeScientificText(knowledgeSource.content));
    expect(prepared?.request.imaging?.input.originalExpression).toBe(normalizeScientificText(knowledgeSource.content));
  });
  it("keeps the human-shaped decade instruction as source when the trigger is 'ok'", () => {
    const sourceText = "ajoutes juste la tranche d'age par dizaine";
    const session = confirmedTurn("ok", sourceText);
    const preparation = captureProjectPreparation(session);
    const request = preparation.checkpoint!.request;
    const knowledgeSource = preflightWorkingDraftKnowledgeSource(request);
    const update = updateFor(request, DOMAINS[0]);
    update.explicitDecisions = [];
    expect(knowledgeSource.content).toBe(sourceText);
    const accepted = acceptWorkingDraftUpdate(update, request);
    expect(accepted.composition?.sourceTurnRef).toBe("u2");
    const next = consumeProjectPreparation(addProjectPreparation(session, preparation),
      preparation.checkpoint!.preparationId,
      { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
    expect(next.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW");
    expect(next.project).toBeNull();
  });
  it("does not substitute an ambiguous compound correction with the previous source", () => {
    const request = captureProjectPreparation(confirmedTurn("ok, mais finalement excluons aussi les anciens fumeurs")).checkpoint!.request;
    expect(request.workingDraftScientificSource).toBeUndefined();
    expect(() => preflightWorkingDraftKnowledgeSource(request)).toThrow("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
  });
  it("keeps the same Scientific Thinking source after reload and later conversation", () => {
    const session = confirmedTurn("ok"), preparation = captureProjectPreparation(session);
    persistFunctionalResetSession(localStorage, addProjectPreparation(session, preparation));
    const restored = loadFunctionalResetSession(localStorage);
    const checkpoint = restored.workingDraftPreparations?.[0]?.checkpoint;
    expect(checkpoint).toBeDefined();
    const later = { ...restored, runtimeTurns: [...restored.runtimeTurns,
      { turnId: "u3", role: "USER" as const, content: "Une correction ultérieure à examiner séparément.", createdAt: restored.createdAt }] };
    expect(preparationCheckpointValid(later, checkpoint!)).toBe(true);
    const request = checkpoint!.request, source = preflightWorkingDraftKnowledgeSource(request);
    const initial = sessionFor(), initialRequest = requestFor(initial);
    const composition = acceptWorkingDraftUpdate(updateFor(initialRequest), initialRequest).composition!;
    const contribution = buildStudyProposalSelectionContribution({ composition, ...recommendedWorkingScope(composition),
      project: null, projectId: restored.projectId, conversationId: restored.conversationId,
      proposalTurn: request.conversation.turns[1]!, selectionTurn: request.conversation.turns[2]!, createdAt: restored.createdAt,
      preparingReview: true });
    const prepared = prepareStandardContextualReasoningRequest({ contribution, turns: request.conversation.turns,
      sessionId: restored.conversationId, workingDraftKnowledgeSource: source });
    expect(source.content).toBe(session.runtimeTurns[0]!.content);
    expect(prepared?.scientificInput.originalExpression).toBe(source.content);
    expect(checkpoint!.scientificSourceIdentity).toEqual(preparation.checkpoint!.scientificSourceIdentity);
  });
  it("reuses a current explicitly bound scientific proposal when an old session has no confirmation receipt", () => {
    const initial = sessionFor(), first = requestFor(initial);
    const proposal = acceptWorkingDraftUpdate(updateFor(first), first).composition!;
    const session = { ...initial, studyProposal: proposal, runtimeTurns: [...initial.runtimeTurns,
      { turnId: "u2", role: "USER" as const, content: "ok", createdAt: initial.createdAt },
      { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA" as const,
        content: "LOCAL_SYNTHETIC — réponse de suite.", createdAt: initial.createdAt }] };
    const request = captureProjectPreparation(session).checkpoint!.request;
    expect(request.workingDraftScientificSource).toMatchObject({ kind: "BOUND_USER_TURN", sourceUserTurnId: "u1" });
    expect(preflightWorkingDraftKnowledgeSource(request).content).toBe(initial.runtimeTurns[0]!.content);
  });
  it("uses the adopted canonical Project question when a later assent has no bound receipt", () => {
    const initial = sessionFor(), request = requestFor(initial), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const draft = prepareContinuousWorkingDraft(initial, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    const ready = draft.readyReview!;
    const project = confirmResearchProjectContribution({ contribution: ready.contribution, current: null,
      projectId: initial.projectId, authority: initial.projectAuthority, confirmedAt: initial.updatedAt,
      reviewedProjection: ready.candidate.humanReviewProjection,
      selectedChangeRefs: ready.candidate.humanReviewProjection.coveredChangeRefs,
      confirmationSourceRefs: ["human-review-button"] });
    const questions = ensureCanonicalProjectState(project).objects.filter(o =>
      o.actuality === "CURRENT" && o.objectType === "SCIENTIFIC_QUESTION");
    expect(questions).toHaveLength(1);
    const session = { ...initial, project, runtimeTurns: [...initial.runtimeTurns,
      { turnId: "u2", role: "USER" as const, content: "ok", createdAt: initial.createdAt },
      { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA" as const,
        content: "LOCAL_SYNTHETIC — réponse conservée.", createdAt: initial.createdAt }] };
    const captured = captureProjectPreparation(session), source = captured.checkpoint!.scientificSourceIdentity;
    expect(source).toMatchObject({ kind: "CURRENT_PROJECT_QUESTION", projectId: project.projectId,
      versionId: project.versionId, projectDigest: project.projectDigest });
    expect(preflightWorkingDraftKnowledgeSource(captured.checkpoint!.request).content).toBe(questions[0]!.content);
    expect(() => preflightWorkingDraftKnowledgeSource({ ...captured.checkpoint!.request,
      currentProject: { ...project, projectDigest: "ke1-wrong" } })).toThrow("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
  });
  it("normalizes only a uniquely owned area before the native owner and Human Review", () => {
    const s = sessionFor(), r = requestFor(s), raw = updateFor(r);
    const timing = raw.proposal!.atoms.find(atom => atom.area === "TIMING")!;
    const original = structuredClone(timing);
    timing.owner = "IMAGING";
    const unchangedRaw = JSON.stringify(raw);
    const trace = vi.spyOn(console, "info").mockImplementation(() => {});
    const accepted = acceptWorkingDraftUpdate(raw, r);
    expect(JSON.stringify(raw)).toBe(unchangedRaw);
    expect(accepted.update.proposal!.atoms.find(atom => atom.ref === timing.ref))
      .toEqual({ ...original, owner: "STUDY_DESIGN" });
    expect(trace).toHaveBeenCalledWith("WORKING_DRAFT_OWNER_AREA_NORMALIZED", expect.objectContaining({
      changes: [{ ref: timing.ref, area: "TIMING", fromOwner: "IMAGING", toOwner: "STUDY_DESIGN" }],
    }));
    const next = consumeProjectPreparation(addProjectPreparation(s, captureProjectPreparation(s)),
      captureProjectPreparation(s).checkpoint!.preparationId,
      { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
    expect(next.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW");
    expect(next.workingDraftPreparations?.[0]?.result?.composition.proposal.atoms.find(atom => atom.ref === timing.ref)?.content)
      .toBe(original.content);
    expect(next.project).toBeNull();
  });

  it("leaves correct owners unchanged and refuses ambiguous or unknown areas", () => {
    const r = requestFor(sessionFor()), correct = updateFor(r);
    const trace = vi.spyOn(console, "info").mockImplementation(() => {});
    expect(acceptWorkingDraftUpdate(correct, r).update.proposal).toEqual(correct.proposal);
    expect(trace).not.toHaveBeenCalled();
    const ambiguous = structuredClone(correct);
    ambiguous.proposal!.atoms.find(atom => atom.area === "MEASUREMENTS")!.owner = "STUDY_DESIGN";
    expect(() => acceptWorkingDraftUpdate(ambiguous, r)).toThrow("STUDY_PROPOSAL_OWNER_SCOPE_INVALID");
    expect(ambiguous.proposal!.atoms.find(atom => atom.area === "MEASUREMENTS")!.owner).toBe("STUDY_DESIGN");
    const unknown = structuredClone(correct) as unknown as { proposal: { atoms: { area: string }[] } };
    unknown.proposal.atoms[0].area = "UNREGISTERED_AREA";
    expect(() => acceptWorkingDraftUpdate(unknown, r)).toThrow();
    expect(trace).not.toHaveBeenCalled();
  });

  it("rejects the paid P2-shaped 'ok' checkpoint before durable admission or provider dispatch", async () => {
    const s = sessionFor("ok"), preparation = captureProjectPreparation(s), request = preparation.checkpoint!.request;
    expect(preparation.sourceTurnRef).toBe("u1");
    expect(preparation.checkpoint!.cutoffTurnId).toBe("noxia-turn:11111111-1111-4111-8111-111111111111");
    expect(() => preflightWorkingDraftKnowledgeSource(request))
      .toThrow("WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID");
    const provider = vi.fn<typeof fetch>();
    const guard = createMemoryProtocolDesignerGuardForTests();
    const admit = vi.fn(guard.prepareRequest);
    let status = 0; let body: unknown;
    const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(value) { body = value; } };
    try {
      await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json",
        origin: "https://noxia-imagerie.fr", host: "noxia-imagerie.fr" }, body: request }, response,
      { VERCEL_ENV: "preview", OPENAI_API_KEY: "LOCAL_SYNTHETIC", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA",
        VITE_AUTONOMOUS_PROJECT_BUILD: "ON" }, { durableGuard: { ...guard, prepareRequest: admit }, fetchImpl: provider });
      expect(status).toBe(422);
      expect(body).toMatchObject({ error: { code: "WORKING_DRAFT_PREPARATION_FAILED",
        details: ["WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID"] } });
      expect(admit).not.toHaveBeenCalled();
      expect(provider).not.toHaveBeenCalled();
      expect((await call(request, provider)).status).toBe(422);
      expect(provider).not.toHaveBeenCalled();
    } finally { await guard.close(); }
  });

  it("accepts a valid bound Knowledge source and dispatches the synthetic Working Draft once", async () => {
    const r = requestFor(sessionFor()), provider = vi.fn<typeof fetch>().mockResolvedValue(response(JSON.stringify(updateFor(r))));
    expect(preflightWorkingDraftKnowledgeSource(r).source).toMatchObject({ sourceUserTurnId: "u1" });
    expect((await call(r, provider)).status).toBe(200);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("persists the explicit no-dispatch failure across reload for a short bound source", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let saved = sessionFor("ok");
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; persistFunctionalResetSession(localStorage, next); return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]).toMatchObject({
      status: "FAILED", code: "WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID",
    }));
    expect(bridge).not.toHaveBeenCalled();
    expect(saved.project).toBeNull();
    expect(screen.getByText(/Aucune génération payante n’a été lancée/)).toBeTruthy();
    expect(loadFunctionalResetSession(localStorage).workingDraftPreparations?.[0]).toMatchObject({
      status: "FAILED", code: "WORKING_DRAFT_KNOWLEDGE_SOURCE_INVALID",
    });
  });
  it.each(["FAILED", "UNKNOWN"])("restores %s after reload without a second Working Draft dispatch", async state => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const source = sessionFor();
    const preparing = addProjectPreparation(source, captureProjectPreparation(source));
    persistFunctionalResetSession(localStorage, preparing);
    let saved = loadFunctionalResetSession(localStorage);
    recoveryRead.mockResolvedValue(state === "FAILED"
      ? { state, errorCode: "WORKING_DRAFT_PROVIDER_FAILED" } : { state });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status)
      .toBe(state === "FAILED" ? "FAILED" : "UNKNOWN/INTERRUPTED"));
    expect(bridge).not.toHaveBeenCalled();
    expect(saved.project).toBeNull();
    expect(saved.drciDraftPacks ?? []).toHaveLength(0);
  });

  it("recovers a rich completed STUDY_UPDATE when the foreground HTTP response is lost", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(DOMAINS[0].text), request = requestFor(initial), update = updateFor(request, DOMAINS[0]);
    const template = update.proposal!.atoms.find(atom => atom.ref === "practical")!;
    while (update.proposal!.atoms.length < 52) {
      const index = update.proposal!.atoms.length;
      update.proposal!.atoms.push({ ...template, ref: `rich-${index}`, semanticKey: `rich-${index}`,
        content: `Détail opérationnel synthétique ${index}`, dependsOn: [], dependencyQualifications: [] });
    }
    const optionRefs = new Set(update.proposal!.arbitrations.flatMap(a => a.options.flatMap(o => o.atomRefs)));
    update.explicitDecisions = update.proposal!.atoms.filter(atom => !optionRefs.has(atom.ref)).slice(0, 23).map(atom => ({
      atomRef: atom.ref, sourceTurnRef: "u1", quote: DOMAINS[0].text,
    }));
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    expect(composition.proposal.atoms).toHaveLength(52);
    expect(update.explicitDecisions).toHaveLength(23);
    bridge.mockRejectedValueOnce(new TypeError("LOCAL_SYNTHETIC_FOREGROUND_RESPONSE_LOST"));
    recoveryRead.mockResolvedValueOnce({ state: "IN_PROGRESS" }).mockResolvedValue({ state: "COMPLETED",
      result: { workingDraftUpdate: update, workingStudyProposal: composition } });
    let saved = initial;
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW"), { timeout: 5000 });
    expect(bridge).toHaveBeenCalledTimes(1);
    expect(recoveryRead).toHaveBeenCalled();
    expect(projectPreparationReview(saved)?.applicable).toBe(true);
    expect(saved.project).toBeNull();
    const trace = buildTraceInspectorRunProjection({ ledger: saved.scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(saved.sessionId, "u1") });
    expect(trace.events.map(event => event.stage)).toContain("DURABLE_RECOVERY_STARTED");
    expect(trace.events.map(event => event.stage)).toContain("DURABLE_RECOVERY_COMPLETED");
    expect(trace.events.map(event => event.stage)).toContain("READY_FOR_REVIEW");
    expect(trace.events.map(event => event.stage)).not.toContain("BRIDGE_RESPONSE_RECEIVED");
    expect(trace.firstFailure).toBeNull();
  });

  it("adopts a large human review without copying its canonical decision reason into TRACE", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(DOMAINS[0].text);
    const traceRunId = createProductTraceRunId(initial.sessionId, "u1");
    initial.bridgeTraces.push({ turnId: "u1", traceRunId, requestKind: "USER_TURN", raw: "[MINIMIZED:SOURCE_TEXT]",
      assistantReply: "[MINIMIZED:ASSISTANT_REPLY]", persistentExtractionCalled: false,
      persistentExtractionStatus: "NOT_REQUESTED", providerArtifact: null, wireCandidate: null,
      persistentCandidate: null, deterministicValidation: null, projectChangeSetCandidate: null,
      canonicalProjectChangeSetCandidate: null, humanReviewProjection: null, humanDecision: null,
      projectVersionBefore: null, projectVersionAfter: null, qryNeedBefore: null, qryNeedAfter: null,
      provider: "NONE", model: "NONE", conversationLatencyMs: 0, extractionLatencyMs: null, calls: 0 });
    const checkpoint = captureProjectPreparation(initial).checkpoint!;
    const update = updateFor(checkpoint.request, DOMAINS[0]);
    const template = update.proposal!.atoms.find(atom => atom.ref === "practical")!;
    while (update.proposal!.atoms.length < 52) {
      const index = update.proposal!.atoms.length;
      update.proposal!.atoms.push({ ...template, ref: `review-${index}`, semanticKey: `review-${index}`,
        content: `Détail opérationnel synthétique ${index}`, dependsOn: [], dependencyQualifications: [] });
    }
    const optionRefs = new Set(update.proposal!.arbitrations.flatMap(arbitration => arbitration.options.flatMap(option => option.atomRefs)));
    update.explicitDecisions = update.proposal!.atoms.filter(atom => !optionRefs.has(atom.ref)).map(atom => ({
      atomRef: atom.ref, sourceTurnRef: "u1", quote: DOMAINS[0].text,
    }));
    const accepted = acceptWorkingDraftUpdate(update, checkpoint.request);
    bridge.mockResolvedValueOnce({ observability: { providerCalls: [] },
      workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
    let saved = initial;
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW"));
    const review = projectPreparationReview(saved)!.prepared!.candidate;
    const coveredRefs = review.humanReviewProjection.coveredChangeRefs;
    expect(reviewDecisionRefsInDisplayOrder(review).length).toBeGreaterThanOrEqual(35);
    saved.bridgeTraces[0]!.projectChangeSetCandidate = review.changeSet;
    const canonicalReason = `Décision partielle : changements confirmés ${coveredRefs.join(", ")} ; changements refusés .`;
    expect(canonicalReason.length).toBeGreaterThan(1024);
    expect(saved.bridgeTraces.map(trace => ({ turnId: trace.turnId, traceRunId: trace.traceRunId }))).toContainEqual({
      turnId: accepted.composition!.sourceTurnRef, traceRunId: createProductTraceRunId(saved.sessionId, "u1"),
    });
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    expect(saved.project?.confirmationDecision.reason).toBe(canonicalReason);
    expect(saved.project?.versionId).toBeTruthy();
    expect(projectHumanDecisionForBridgeTrace(saved.project!.confirmationDecision)).toEqual({
      decisionId: saved.project!.confirmationDecision.decisionId, version: saved.project!.confirmationDecision.version,
      status: "ADOPTED", reasonDigest: logicalDigest(canonicalReason), reasonLength: canonicalReason.length,
      reasonStatus: "DIGEST_ONLY",
    });
    expect(saved.bridgeTraces[0]?.humanDecision).toMatchObject({ decisionId: saved.project!.confirmationDecision.decisionId,
      reasonDigest: logicalDigest(canonicalReason), reasonLength: canonicalReason.length, reasonStatus: "DIGEST_ONLY" });
    expect(JSON.stringify(saved.bridgeTraces)).not.toContain(canonicalReason);
    const events = saved.scientificExecutionTraceLedger.events.filter(event => event.runId === traceRunId);
    expect(events.map(event => event.common?.stage)).toContain("READY_FOR_REVIEW");
    expect(events.map(event => event.common?.stage)).toContain("PROJECT_VERSION_CREATED");
    const decisionEvent = events.find(event => event.common?.stage === "HUMAN_DECISION_RECORDED")!;
    expect(decisionEvent.common?.reasonCode).toBe("HUMAN_DECISION_REASON_PROJECTED");
    expect(decisionEvent.common?.output[0]?.ref).toBe(saved.project?.confirmationDecision.decisionId);
    expect(decisionEvent.technicalMetadata).toMatchObject({ decisionReasonDigest: logicalDigest(canonicalReason),
      decisionReasonLength: canonicalReason.length, boundedStatus: "DIGEST_ONLY" });
    expect(JSON.stringify(saved.scientificExecutionTraceLedger)).not.toContain(canonicalReason);
    expect(buildTraceInspectorRunProjection({ ledger: saved.scientificExecutionTraceLedger, traceRunId }).firstFailure).toBeNull();
  });

  it("does not convert a TRACE projection error into failed Project confirmation", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(), update = updateFor(requestFor(initial));
    let saved = checkpointSession(initial, update);
    vi.spyOn(traceAdapter, "recordProjectAdoptionTrace").mockImplementationOnce(() => {
      throw new Error("SCIENTIFIC_TRACE_UNBOUNDED_TEXT_FORBIDDEN");
    });
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    expect(saved.project?.confirmationDecision.status).toBe("ADOPTED");
    expect(saved.workingDraftPreparations?.[0]?.decision).toBe("ADOPTED");
    expect(warning).toHaveBeenCalledWith("PROJECT_ADOPTION_TRACE_PROJECTION_FAILED", "SCIENTIFIC_TRACE_UNBOUNDED_TEXT_FORBIDDEN");
  });

  it("links one GPT-6 receipt to the preparation trace without duplicating its accounting", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(), checkpoint = captureProjectPreparation(initial).checkpoint!;
    const accepted = acceptWorkingDraftUpdate(updateFor(checkpoint.request), checkpoint.request);
    const record: ProviderCallRecord = {
      contract: PROVIDER_CALL_OBSERVABILITY_CONTRACT, contractVersion: PROVIDER_CALL_OBSERVABILITY_VERSION,
      callId: "provider-call:gpt6-integrated-synthetic", provider: "OPENAI",
      modelRequested: "gpt-6-sol", modelReturned: "gpt-6-sol", modelVersion: "gpt-6-sol",
      purpose: "CONVERSATION_REALIZATION", reasoningEffort: "medium",
      context: { sessionId: initial.sessionId, conversationId: initial.conversationId, turnId: "u1",
        clientRequestId: checkpoint.preparationId, testSessionId: null },
      usage: { inputTokens: 1_000, cachedInputTokens: 0, cacheWriteTokens: 0,
        outputTokens: 100, reasoningTokens: 20, totalTokens: 1_100 },
      latencyMs: 1, retryIndex: 0, retryReason: null, status: "SUCCEEDED", failureReason: null,
      providerRequestId: "synthetic-request", providerResponseId: "synthetic-response",
      estimatedCostUsd: 0.003, pricingSnapshotDate: "2026-09-28",
      startedAt: initial.createdAt, completedAt: initial.createdAt,
    };
    bridge.mockResolvedValueOnce({ observability: { providerCalls: [record] },
      workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
    let saved = initial;
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW"));
    const providerRecords = saved.bridgeTraces.flatMap(item => item.providerCallRecords ?? []);
    expect(providerRecords).toEqual([record]);
    expect(saved.bridgeTraces.at(-1)?.cumulativeSessionCostUsd).toBe(0.003);
    const trace = buildTraceInspectorRunProjection({ ledger: saved.scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(saved.sessionId, "u1") });
    const linked = trace.events.filter(event => event.stage === "PROVIDER_RESPONSE_RECEIVED");
    expect(linked).toHaveLength(1);
    expect(linked[0]?.technicalMetadata.providerCallId).toBe(record.callId);
    expect(trace.events.map(event => event.stage)).toContain("READY_FOR_REVIEW");
    expect(trace.firstFailure).toBeNull();
  });

  it("attributes a budget admission rejection before any provider operation", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    bridge.mockRejectedValueOnce(new ProductBridgeClientError("PUBLIC_SESSION_BUDGET_CLOSED", "LOCAL_SYNTHETIC", null, null,
      "PUBLIC_SESSION_BUDGET_CLOSED"));
    let saved = sessionFor();
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("FAILED"));
    const trace = buildTraceInspectorRunProjection({ ledger: saved.scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(saved.sessionId, "u1") });
    expect(trace.firstFailure).toMatchObject({ stage: "ADMISSION_REJECTED", owner: "DURABLE_PROVIDER_BUDGET",
      internalCode: "PUBLIC_SESSION_BUDGET_CLOSED", attribution: "ROOT_CAUSE_PROVEN" });
    expect(saved.project).toBeNull();
  });

  it("attributes a provider HTTP 400 to the provider boundary, without copying its payload", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(), checkpoint = captureProjectPreparation(initial).checkpoint!;
    const diagnostic = { contract: "DURABLE_PROVIDER_TERMINAL_FAILURE" as const, clientRequestId: checkpoint.preparationId,
      operationKey: "a".repeat(64), sessionId: initial.sessionId, turnId: "u1", providerCallId: "provider-call:synthetic",
      generationProvider: "AZURE_OPENAI" as const, phase: "HEADERS_RECEIVED" as const, precountStarted: true,
      precountCompleted: true, reservationConfirmed: true, dispatchAttempted: true, headersReceived: true, bodyRead: true,
      inputCountHttpStatus: null, providerHttpStatus: 400, providerResponseStatus: "failed" as const,
      incompleteReason: null, structuredErrorCode: "PROVIDER_HTTP_ERROR", safeExceptionClass: null,
      abortSignalAborted: false, lastConfirmedDurableState: "COMPLETED_RECEIVED" };
    const record: ProviderCallRecord = { contract: PROVIDER_CALL_OBSERVABILITY_CONTRACT,
      contractVersion: PROVIDER_CALL_OBSERVABILITY_VERSION, callId: "provider-call:synthetic", provider: "OPENAI",
      modelRequested: "LOCAL_SYNTHETIC", modelReturned: null, modelVersion: "LOCAL_SYNTHETIC",
      purpose: "SCIENTIFIC_THINKING_PROPOSAL", reasoningEffort: "medium",
      context: { sessionId: initial.sessionId, conversationId: initial.conversationId, turnId: "u1",
        clientRequestId: checkpoint.preparationId, testSessionId: null },
      usage: { inputTokens: null, cachedInputTokens: null, cacheWriteTokens: null, outputTokens: null,
        reasoningTokens: null, totalTokens: null }, latencyMs: 1, retryIndex: 0, retryReason: null,
      status: "FAILED", failureReason: "PROVIDER_HTTP_ERROR", providerRequestId: null, providerResponseId: null,
      estimatedCostUsd: null, pricingSnapshotDate: PROVIDER_PRICING_SNAPSHOT_DATE,
      startedAt: initial.createdAt, completedAt: initial.createdAt, durableFailure: diagnostic };
    bridge.mockRejectedValueOnce(new ProductBridgeClientError("PROVIDER_HTTP_ERROR", "LOCAL_SYNTHETIC", null,
      providerCallRequestObservability([record]), "PROVIDER_HTTP_ERROR"));
    let saved = initial;
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Préparer la mise à jour du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("FAILED"));
    const trace = buildTraceInspectorRunProjection({ ledger: saved.scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(saved.sessionId, "u1") });
    expect(trace.firstFailure).toMatchObject({ stage: "PROVIDER_RESPONSE_RECEIVED", owner: "PROVIDER_BOUNDARY",
      attribution: "ROOT_CAUSE_PROVEN" });
    expect(trace.events.find(event => event.stage === "PROVIDER_RESPONSE_RECEIVED")?.technicalMetadata).toMatchObject({
      providerHttpStatus: 400, providerCallId: "provider-call:synthetic" });
    expect(JSON.stringify(trace)).not.toContain("LOCAL_SYNTHETIC_FOREGROUND_RESPONSE_LOST");
  });

  it("marks a recovered provider result FAILED when the scientific owner rejects it", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const source = sessionFor(), request = requestFor(source), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const preparing = addProjectPreparation(source, captureProjectPreparation(source));
    persistFunctionalResetSession(localStorage, preparing);
    let saved = loadFunctionalResetSession(localStorage);
    recoveryRead.mockResolvedValue({ state: "COMPLETED", result: {
      workingDraftUpdate: update, workingStudyProposal: { ...composition, state: "REVIEW_REQUIRED" },
    } });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("FAILED"));
    expect(saved.workingDraftPreparations?.[0]?.code).toBe("STUDY_PROPOSAL_STALE_PROJECT");
    expect(screen.queryByTestId("project-review-invitation")).toBeNull();
    expect(saved.project).toBeNull();
    expect(bridge).not.toHaveBeenCalled();
  });

  it("keeps a recovered result after a new turn and requires per-group review", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const source = sessionFor(), request = requestFor(source), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const preparing = addProjectPreparation(source, captureProjectPreparation(source));
    persistFunctionalResetSession(localStorage, { ...preparing, runtimeTurns: [...preparing.runtimeTurns,
      { turnId: "later-turn", role: "USER", content: "Nouvelle étude indépendante.", createdAt: source.createdAt }] });
    let saved = loadFunctionalResetSession(localStorage);
    recoveryRead.mockResolvedValue({ state: "COMPLETED",
      result: { workingDraftUpdate: update, workingStudyProposal: composition } });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved}
      onSessionChange={next => { saved = next; return true; }} /></HelmetProvider>);
    await waitFor(() => expect(saved.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW"));
    expect(screen.getByRole("button",{name:"Valider ces choix"})).toBeDisabled();
    expect(saved.project).toBeNull();
    expect(bridge).not.toHaveBeenCalled();
  });

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
    await waitFor(() => expect(bridge).toHaveBeenCalledTimes(1));
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
  it.each(["\n", "\r\n", "\t", " \r\n\t\n  "])("uses layout-safe strict-schema quotes and restores their immutable source (%j)", separator => {
    const source = DOMAINS[1].text.split(" ").join(separator);
    const request = requestFor(sessionFor(source)), before = JSON.stringify(request);
    const prepared = prepareWorkingDraftRequest(request);
    const decisions = prepared.outputSchema.properties!.explicitDecisions as {
      items: { properties: { quote: { enum: string[] } } };
    };
    const quotes = decisions.items.properties.quote.enum;
    expect(quotes).toContain(DOMAINS[1].text);
    expect(quotes.every(quote => !/[\r\n\t]/u.test(quote))).toBe(true);
    for (const quote of quotes) expect(resolveWorkingDraftSourceQuote(source, quote)).not.toBeNull();
    expect(JSON.parse(prepared.context).RECENT_CONVERSATION[0].content).toBe(source);
    const update = updateFor(request);
    update.explicitDecisions[0]!.quote = DOMAINS[1].text;
    expect(acceptWorkingDraftUpdate(update, request).update.explicitDecisions[0]!.quote).toBe(source);
    expect(JSON.stringify(request)).toBe(before);
  });
  it("keeps single-line strict-schema quotes unchanged", () => {
    const prepared = prepareWorkingDraftRequest(requestFor(sessionFor()));
    const decisions = prepared.outputSchema.properties!.explicitDecisions as {
      items: { properties: { quote: { enum: string[] } } };
    };
    expect(decisions.items.properties.quote.enum).toContain(DOMAINS[1].text);
  });
  it("takes multiline strict-schema output to native review without adopting Project", async () => {
    const source = DOMAINS[1].text.replace(/ /gu, "\r\n\t");
    const initial = sessionFor(source), captured = captureProjectPreparation(initial);
    const request = captured.checkpoint!.request;
    const provider = vi.fn<typeof fetch>(async (_url, init) => {
      const payload = JSON.parse(String(init?.body));
      const quotes: string[] = payload.text.format.schema.properties.explicitDecisions.items.properties.quote.enum;
      // Model the exact Azure 400 found in Preview, not only JSON validity.
      if (quotes.some(quote => /[\r\n\t]/u.test(quote))) return new Response(JSON.stringify({
        error: { type: "invalid_request_error", code: "invalid_json_schema", param: "text.format.schema" },
      }), { status: 400 });
      expect(quotes).toContain(DOMAINS[1].text);
      return response(JSON.stringify(updateFor(request)));
    });
    const result = await call(request, provider);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const next = consumeProjectPreparation(addProjectPreparation(initial, captured),
      captured.checkpoint!.preparationId, result.body as ProductBridgeResponse);
    expect(next.workingDraftPreparations?.[0]?.status).toBe("READY_FOR_REVIEW");
    expect(next.project).toBeNull();
    expect(next.runtimeTurns[0]!.content).toBe(source);
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
  it("keeps a second fibrosis Working Draft reviewable when a new unselected allocation arbitration has only orphan atom refs", () => {
    const firstText = "je veux créer un projet sur la fibrose normale. évaluer l'évolution de la fibrose en fonction de l'age en prenant plusieurs patients sains de différentes tranche d'age et en leur faisant passer une irm cardiaque et en évaluant l'ECV pour chacun d'eux. C'est donc une étude sur volontaire sains sans rémunération";
    const first = sessionFor(firstText);
    const firstRequest = requestFor(first), firstUpdate = updateFor(firstRequest, DOMAINS[0]);
    firstUpdate.explicitDecisions = [{ atomRef: "design", sourceTurnRef: "u1", quote: firstText }];
    for (const ref of ["eligibility-metabolic", "eligibility-smoking", "sport"])
      firstUpdate.proposal!.atoms.find(atom => atom.ref === ref)!.status = "OPEN_DECISION";
    const firstReady = checkpointSession(first, firstUpdate);
    expect(firstReady.workingDraftPreparations?.at(-1)?.status).toBe("READY_FOR_REVIEW");
    expect(firstReady.project).toBeNull();
    const firstTraceRunId = createProductTraceRunId(first.sessionId, "u1");
    expect(buildTraceInspectorRunProjection({ ledger: firstReady.scientificExecutionTraceLedger,
      traceRunId: firstTraceRunId }).events.map(event => event.stage)).toContain("READY_FOR_REVIEW");
    const firstReview = projectPreparationReview(firstReady)!.prepared!;
    const projectV1 = confirmResearchProjectContribution({ contribution: firstReview.contribution,
      current: null, projectId: first.projectId, authority: first.projectAuthority, confirmedAt: first.updatedAt,
      reviewedProjection: firstReview.candidate.humanReviewProjection,
      selectedChangeRefs: firstReview.candidate.humanReviewProjection.coveredChangeRefs,
      confirmationSourceRefs: ["human-review-button:1"] });
    expect(projectV1.revision).toBe(1);
    const noQryAction = { currentAction: null } as NonNullable<FunctionalResetSession["queryNavigation"]>;
    const firstLedger = traceAdapter.recordProjectAdoptionTrace({ ledger: firstReady.scientificExecutionTraceLedger,
      traceRunId: firstTraceRunId, conversationId: first.conversationId, recordedAt: first.updatedAt,
      contribution: firstReview.contribution, project: projectV1, previousProjectExisted: false,
      queryNavigation: noQryAction, documents: firstReady.documents });
    const firstTraceStages = buildTraceInspectorRunProjection({ ledger: firstLedger,
      traceRunId: firstTraceRunId }).events.map(event => event.stage);
    expect(firstTraceStages).toContain("HUMAN_DECISION_RECORDED");
    expect(firstTraceStages).toContain("PROJECT_VERSION_CREATED");

    const secondText = "le protocole sera conduit en france sur des sujets sains, pas de mineurs, tranche d'ages par dizaine. il faut exclure les pathologies fibrotique diabete hta ... ainsi que les fumeurs, évaluer l'aspect sportif";
    const firstComposition = firstReady.studyProposal!;
    const firstScope = recommendedWorkingScope(firstComposition);
    const adoptedProposal = propagateStudyProposalDecision(firstComposition, projectV1, firstReview.candidate, null,
      selectedStudyProposalAtoms(firstComposition, firstScope.selectedOptionRefs, firstScope.selectedAtomRefs),
      firstScope.selectedOptionRefs, first.runtimeTurns[0]);
    const second: FunctionalResetSession = { ...firstReady, project: projectV1, studyProposal: adoptedProposal,
      scientificExecutionTraceLedger: firstLedger,
      runtimeTurns: [...firstReady.runtimeTurns,
        { turnId: "u2", role: "USER", content: secondText, createdAt: firstReady.updatedAt },
        { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA", content: "LOCAL_SYNTHETIC — changements candidats, non adoptés.", createdAt: firstReady.updatedAt }] };
    const secondRequest = requestFor(second), secondUpdate = updateFor(secondRequest, DOMAINS[0]);
    const proposal = secondUpdate.proposal!;
    proposal.atoms.find(atom => atom.ref === "population")!.content = "Volontaires sains adultes en France";
    Object.assign(proposal.atoms.find(atom => atom.ref === "age-classes")!, {
      area: "RECRUITMENT", content: "Tranches d'âge par décennie pour le recrutement",
    });
    proposal.atoms.find(atom => atom.ref === "eligibility-metabolic")!.content = "Exclure les maladies fibrosantes, le diabète et l'hypertension";
    proposal.atoms.find(atom => atom.ref === "eligibility-smoking")!.content = "Exclure les fumeurs ; le statut des anciens fumeurs reste à définir";
    proposal.atoms.find(atom => atom.ref === "sport")!.content = "Évaluer l'activité sportive ; instrument et période à définir";
    proposal.atoms.push({ ...proposal.atoms.find(atom => atom.ref === "bounds")!, ref: "open-age-allocation",
      semanticKey: "open-age-allocation", content: "Déterminer si les effectifs par décennie seront équilibrés ou seulement couverts" });
    proposal.atoms.push({ ...structuredClone(proposal.atoms.find(atom => atom.ref === "design")!),
      ref: "centre-setting", semanticKey: "centre-setting", content: "Conduire cette étude dans un seul centre.",
      status: "STRONG_CONTEXTUAL_INFERENCE", userChangeRefs: [], dependsOn: [], dependencyQualifications: [] });
    proposal.atoms.push({ ...structuredClone(proposal.atoms.find(atom => atom.ref === "ecv")!),
      ref: "ecv-per-slice", semanticKey: "ecv-per-slice", content: "Mesurer aussi l'ECV séparément par coupe.",
      userChangeRefs: [], dependsOn: ["hematocrit"], dependencyQualifications: [{ ref: "hematocrit",
        kind: "HARD_BLOCKING_DEPENDENCY", rationale: "L'ECV par coupe nécessite l'hématocrite." }] });
    const openTemplate = proposal.atoms.find(atom => atom.ref === "bounds")!;
    while (proposal.atoms.length < 60) {
      const ref = `rich-open-${proposal.atoms.length}`;
      proposal.atoms.push({ ...openTemplate, ref, semanticKey: ref,
        content: `Précision opérationnelle ${ref} non décidée` });
    }
    expect(proposal.atoms).toHaveLength(60);
    proposal.arbitrations.find(arbitration => arbitration.ref === "age-strategy")!.options =
      proposal.arbitrations.find(arbitration => arbitration.ref === "age-strategy")!.options.filter(option => option.ref !== "classes-option");
    proposal.arbitrations = proposal.arbitrations.filter(arbitration => arbitration.ref !== "allocation-choice");
    proposal.arbitrations.push({ ref: "arb-allocation", label: "Allocation par décennie", rationale: "Choix non exprimé",
      selection: "ONE", material: false, reversible: true, affectedBranches: ["RECRUITMENT"],
      options: [
        { ref: "opt-quotas", label: "Quotas proches entre décennies", benefits: "Couverture", limits: "Recrutement", consequences: "Quotas", atomRefs: ["alloc-quotas"] },
        { ref: "opt-coverage", label: "Couverture sans quotas équilibrés", benefits: "Souplesse", limits: "Déséquilibre", consequences: "Couverture", atomRefs: ["alloc-coverage"] },
      ], recommendedRefs: [] });
    secondUpdate.explicitDecisions = ["population", "age-classes", "eligibility-metabolic", "eligibility-smoking", "sport"]
      .map(atomRef => ({ atomRef, sourceTurnRef: "u2", quote: secondText }));
    const accepted = acceptWorkingDraftUpdate(secondUpdate, secondRequest);
    expect(accepted.composition!.proposal.arbitrations.some(arbitration => arbitration.ref === "arb-allocation")).toBe(false);
    expect(accepted.composition!.proposal.atoms.find(atom => atom.ref === "open-age-allocation")?.status).toBe("OPEN_DECISION");
    const secondPreparation = captureProjectPreparation(second);
    const secondReady = consumeProjectPreparation(addProjectPreparation(second, secondPreparation),
      secondPreparation.checkpoint!.preparationId,
      { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
    expect(secondReady.workingDraftPreparations?.at(-1)?.status,
      secondReady.workingDraftPreparations?.at(-1)?.code ?? "NO_CODE").toBe("READY_FOR_REVIEW");
    expect(secondReady.project?.versionId).toBe(projectV1.versionId);
    const secondTraceRunId = createProductTraceRunId(second.sessionId, "u2");
    const secondReadyTrace = buildTraceInspectorRunProjection({ ledger: secondReady.scientificExecutionTraceLedger,
      traceRunId: secondTraceRunId });
    expect(secondReadyTrace.events.map(event => event.stage)).toContain("WORKING_DRAFT_VALIDATION");
    expect(secondReadyTrace.events.map(event => event.stage)).toContain("READY_FOR_REVIEW");
    expect(secondReadyTrace.firstFailure).toBeNull();
    const secondReview = projectPreparationReview(secondReady)!.prepared!;
    expect(secondReview.candidate.canonicalChangeSet.conflicts).toEqual([]);
    expect(secondReview.candidate.canonicalChangeSet.objectChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: "ADD", candidate: expect.objectContaining({ content: "Conduire cette étude dans un seul centre." }) }),
      expect.objectContaining({ operation: "ADD", candidate: expect.objectContaining({ content: "Mesurer aussi l'ECV séparément par coupe." }) }),
      expect.objectContaining({ operation: "REPLACE", candidate: expect.objectContaining({ content: "Volontaires sains adultes en France" }) }),
    ]));
    const v1Frozen = JSON.stringify(projectV1);
    const projectV2 = confirmResearchProjectContribution({ contribution: secondReview.contribution,
      current: projectV1, projectId: first.projectId, authority: first.projectAuthority, confirmedAt: second.updatedAt,
      reviewedProjection: secondReview.candidate.humanReviewProjection,
      selectedChangeRefs: secondReview.candidate.humanReviewProjection.coveredChangeRefs,
      confirmationSourceRefs: ["human-review-button:2"] });
    expect(projectV2.revision).toBe(2);
    expect(projectV2.versionId).not.toBe(projectV1.versionId);
    expect(projectV1.revision).toBe(1);
    expect(JSON.stringify(projectV1)).toBe(v1Frozen);
    expect(projectV2.canonicalState?.objects.some(object => object.actuality === "CURRENT"
      && object.content === "Conduire cette étude dans un seul centre.")).toBe(true);
    expect(projectV2.canonicalState?.relations.some(relation => relation.actuality === "CURRENT"
      && relation.sourceObjectRef.endsWith(":ecv-per-slice")
      && relation.targetObjectRef.endsWith(":hematocrit"))).toBe(true);
    expect(JSON.stringify(projectV2)).toContain("Exclure les maladies fibrosantes");
    const secondLedger = traceAdapter.recordProjectAdoptionTrace({ ledger: secondReady.scientificExecutionTraceLedger,
      traceRunId: secondTraceRunId, conversationId: second.conversationId, recordedAt: second.updatedAt,
      contribution: secondReview.contribution, project: projectV2, previousProjectExisted: true,
      queryNavigation: noQryAction, documents: secondReady.documents });
    const secondTraceStages = buildTraceInspectorRunProjection({ ledger: secondLedger,
      traceRunId: secondTraceRunId }).events.map(event => event.stage);
    expect(secondTraceStages).toContain("HUMAN_DECISION_RECORDED");
    expect(secondTraceStages).toContain("PROJECT_VERSION_REVISED");
  });
  it("still rejects a recommended, partially bound, or inherited orphan arbitration", () => {
    const first = sessionFor(DOMAINS[0].text), request = requestFor(first);
    const addOrphan = (update: WorkingDraftUpdate) => {
      update.proposal!.arbitrations.push({ ref: "arb-allocation", label: "Allocation", rationale: "Choix",
        selection: "ONE", material: false, reversible: true, affectedBranches: ["RECRUITMENT"],
        options: [{ ref: "opt-quotas", label: "Quotas", benefits: "Couverture", limits: "Effort",
          consequences: "Quotas", atomRefs: ["alloc-quotas"] }], recommendedRefs: [] });
      return update;
    };
    const recommended = addOrphan(updateFor(request, DOMAINS[0]));
    recommended.proposal!.arbitrations.at(-1)!.recommendedRefs = ["opt-quotas"];
    expect(() => acceptWorkingDraftUpdate(recommended, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
    const partial = addOrphan(updateFor(request, DOMAINS[0]));
    partial.proposal!.arbitrations.at(-1)!.options[0]!.atomRefs.push("allocation");
    expect(() => acceptWorkingDraftUpdate(partial, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
    const inherited = addOrphan(updateFor(request, DOMAINS[0]));
    const previous = acceptWorkingDraftUpdate(updateFor(request, DOMAINS[0]), request).composition!;
    previous.proposal.arbitrations.push({ ...inherited.proposal!.arbitrations.at(-1)! });
    expect(() => acceptWorkingDraftUpdate(inherited, { ...request, studyProposalContext: previous }))
      .toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
    const stale = addOrphan(updateFor(request, DOMAINS[0]));
    stale.proposal!.arbitrations = stale.proposal!.arbitrations.filter(arbitration => arbitration.ref !== "allocation-choice");
    stale.proposal!.atoms = stale.proposal!.atoms.filter(atom => atom.ref !== "allocation");
    stale.proposal!.arbitrations.at(-1)!.options[0]!.atomRefs = ["allocation"];
    const priorValid = acceptWorkingDraftUpdate(updateFor(request, DOMAINS[0]), request).composition!;
    expect(() => acceptWorkingDraftUpdate(stale, { ...request, studyProposalContext: priorValid }))
      .toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
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
  it("uses one explicit action, preserves adopted Project on transport failure, and retrieves the same request without another adoption", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    const initial = sessionFor(), request = requestFor(initial), update = updateFor(request);
    const composition = acceptWorkingDraftUpdate(update, request).composition!;
    const workingDraft = prepareContinuousWorkingDraft(initial, composition, update, prepareWorkingDraftRequest(request).inputDigest);
    let saved: FunctionalResetSession = checkpointSession(initial, update);
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
    let saved: FunctionalResetSession=checkpointSession(initial,update);
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
    let saved: FunctionalResetSession=checkpointSession(initial,update);
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
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={checkpointSession(initial,update)} onSessionChange={()=>true} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button",{name:"Valider ces choix"}));
    fireEvent.click(screen.getByRole("button",{name:"Protocole / documents"}));
    await waitFor(() => expect(screen.getByTestId("adopted-project-document-generation")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("adopted-project-document-generation").querySelector("button")!);
    await screen.findByTestId("document-generation-recovery");
    expect(screen.queryByRole("button",{name:"Retrouver les documents"})).toBeNull();
    expect(bridge).toHaveBeenCalledTimes(1);
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
