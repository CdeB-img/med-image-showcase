import { readFileSync, writeFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import { classifyNaturalConversationActs, classifyScientificStatementPurpose } from "../natural-conversation-policy";
import { routeProductEntry } from "../product-entry-routing";
import { buildPersistentSourceCatalog, contributionFromPersistentDelta, validatePersistentProjectDelta, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { dispatchScientificThinkingFromQuery } from "../scientific-thinking-standard";
import { prepareScientificCollaboratorConversation, guardScientificCollaboratorLiteratureReply } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { hasLongitudinalDesignEvidence, detectStudyDesignSignals } from "@/features/study-design/design-reasoning";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { bridgeRequest, wire } from "../../../../../validation/protocol-designer-v1-contextual-scientific-reasoning-runtime-01/offline-fixtures";

const root = "validation/protocol-designer-v1-single-conversational-owner-recovery-01/";
const frozen = JSON.parse(readFileSync(root + "frozen-human-inputs.json", "utf8")) as { inputs: string[] };
const [T1, T2, T3, T4] = frozen.inputs;
const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); bridge.mockReset(); localStorage.clear(); });
const nativeResponse = (text: string) => new Response(JSON.stringify({ modelVersion: "gemini-3.5-flash-lite", responseId: "LOCAL_SYNTHETIC_ONLY",
  candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 } }));
const request = (text: string): ProductBridgeRequest => ({ ...bridgeRequest(text), evaluatePersistentDelta: false });
const call = async (r: ProductBridgeRequest, text: string) => {
  const fetchImpl = vi.fn(async () => nativeResponse(text));
  const result = await executeProtocolDesignerBridge({ body: r, apiKey: "LOCAL_SYNTHETIC", fetchImpl });
  expect(result.status).toBe(200);
  return { body: result.body as ProductBridgeResponse, fetchImpl };
};

// Semantic outputs below are explicit synthetic witnesses, not LLM competence
// or a human naturalness oracle. Real N1, PRJ, Bridge and Standard handlers run.
const deltaFor = (r: ProductBridgeRequest) => {
  const latest = r.conversation.turns.filter(t => t.role === "USER").at(-1)!;
  const text = latest.content;
  if (text === T1) return wire(text, [
    ["OBJECTIVE", "Évaluer la fibrose en fonction de l’âge"], ["POPULATION", "Volontaires sains de différentes tranches d’âge"],
    ["ACQUISITION", "IRM cardiaque chez chaque volontaire"], ["CANONICAL_VARIABLE", "ECV pour chaque volontaire"],
    ["PROJECT_INFORMATION", "Participation sans rémunération"],
  ]);
  if (text === T3) {
    const delta = wire(text, [
      ["ACQUISITION", "Prélèvement d’un tube sur le cathéter de perfusion"], ["CANONICAL_VARIABLE", "Hématocrite"],
      ["PROJECT_INFORMATION", "Justification méthodologique : hématocrite correspondant aux conditions de mesure"],
    ]);
    delta.changes = delta.changes.map((c, i) => ({ ...c, candidateRef: `update:${i}` }));
    delta.changes[0] = { ...delta.changes[0], studyRole: "SAMPLE_COLLECTION", targetSectionId: "BIOSPECIMENS" } as typeof delta.changes[0];
    const anchor = { kind: "RELATIVE_EVENT", direction: "BEFORE", unit: null, offset: null, lowerBound: null, upperBound: null,
      relativeEventLabel: "perfusion", tolerance: null, reference: { status: "EXPLICIT", bindingStatus: "PROJECT_REF_UNRESOLVED" } };
    return { ...delta, temporalQualifications: [{ operation: "ADD", sourceText: text, subjectProjectRef: "update:0", temporalRole: "ACQUISITION_TIME", anchor, assertionKind: "USER_STATED", evidenceRefs: [] }] };
  }
  return { changes: [], relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
};
const attachTransport = (requests: ProductBridgeRequest[], replies: string[]) => {
  let index = 0;
  bridge.mockImplementation(async (r: ProductBridgeRequest) => {
    requests.push(r);
    const reply = replies[index++] ?? "LOCAL_SYNTHETIC — discussion courante.";
    const fetchImpl = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url) === "https://api.openai.com/v1/responses") {
        const catalog = buildPersistentSourceCatalog(r.conversation);
        const sourceAnchorId = catalog.anchors.find(a => a.fragmentKind === "FULL_TURN")!.anchorId;
        const delta = deltaFor(r);
        const anchored = {
          ...delta,
          changes: delta.changes.map(c => { const { sourceText: _source, ...rest } = c; return { ...rest, sourceAnchorId }; }),
          temporalQualifications: delta.temporalQualifications.map(c => { const { sourceText: _source, ...rest } = c; return { ...rest, sourceAnchorId }; }),
        };
        return new Response(JSON.stringify({ id: "LOCAL_SYNTHETIC_N1", model: "gpt-5.6-terra", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(anchored) }] }] }));
      }
      const payload = JSON.parse(String(init!.body));
      expect(payload.generationConfig.responseMimeType).toBe("text/plain");
      return nativeResponse(reply);
    });
    const result = await executeProtocolDesignerBridge({ body: { ...r, apiVersion: "1.0.0" }, apiKey: "LOCAL_SYNTHETIC", openAiApiKey: "LOCAL_SYNTHETIC",
      fetchImpl, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
    expect(result.status).toBe(200);
    const body = result.body as ProductBridgeResponse;
    if (!body.scientificConversation) writeFileSync(root + `debug-bridge-${index}.json`, JSON.stringify(body, null, 2));
    expect(body.scientificConversation).toMatchObject({ owner: "SCIENTIFIC_THINKING", responseOwner: "LLM", projectWrites: 0, projectWriteAuthorized: false });
    return body;
  });
};
const send = (text: string) => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

describe("Single conversational owner — bounded semantic contrasts", () => {
  it.each([T2, "ta question ne veut rien dire", "ton hypothèse est incompréhensible", "tu es à côté de la plaque", "arrête de me redemander ça"])("feedback is a user act without invented science: %s", raw => {
    const acts = classifyNaturalConversationActs(raw);
    expect(acts).toContain("USER_FEEDBACK_ON_ASSISTANT_OUTPUT");
    expect(acts).not.toContain("NEW_INFORMATION");
    expect(routeProductEntry({ raw, sourceTurnRef: "feedback", routedAt: "2026-09-17T12:00:00Z", currentProjectAvailable: true }).projectConstructionEligible).toBe(false);
  });
  it("preserves procedure assertions in a mixed feedback/literature turn", () => {
    expect(classifyNaturalConversationActs(T3)).toEqual(expect.arrayContaining(["USER_FEEDBACK_ON_ASSISTANT_OUTPUT", "EXTERNAL_EVIDENCE_REQUEST"]));
    expect(routeProductEntry({ raw: T3, sourceTurnRef: "mixed", routedAt: "2026-09-17T12:00:00Z", currentProjectAvailable: true }).projectConstructionEligible).toBe(true);
  });
  it.each([
    ["je fais X pour limiter Y", "PROCEDURE_RATIONALE"], ["mon hypothèse est que X réduit Y", "HYPOTHESIS_OR_QUESTION"],
    ["je veux tester si X réduit Y", "HYPOTHESIS_OR_QUESTION"], ["X est réalisé juste avant Y pour standardiser la mesure", "PROCEDURE_RATIONALE"],
  ])("procedure/test contrast: %s", (text, purpose) => {
    expect(classifyScientificStatementPurpose(text)).toBe(purpose);
    const hypothesis = wire(text, [["HYPOTHESIS", text]]);
    const checked = validatePersistentProjectDelta(hypothesis, text, null, request(text).conversation);
    expect(checked.validation.valid).toBe(purpose !== "PROCEDURE_RATIONALE");
    if (purpose === "PROCEDURE_RATIONALE") expect(checked.validation.blocks).toContain("change:0:PROCEDURE_RATIONALE_NOT_RESEARCH_HYPOTHESIS");
    expect(validatePersistentProjectDelta(wire(text, [["PROJECT_INFORMATION", text]]), text, null, request(text).conversation).validation.valid).toBe(true);
  });
  it("blocks the historical method-accuracy pseudo-hypothesis without rewriting it", () => {
    const source = "De cette facon on aura la vrai hématocrite.";
    const delta = { ...wire(T3, [["HYPOTHESIS", "Le prélèvement permet d’obtenir le vrai hématocrite"]]), changes: wire(T3, [["HYPOTHESIS", "Le prélèvement permet d’obtenir le vrai hématocrite"]]).changes.map(c => ({ ...c, sourceText: source })) };
    const before = JSON.stringify(delta);
    expect(validatePersistentProjectDelta(delta, T3, null, request(T3).conversation).validation.blocks).toContain("change:0:PROCEDURE_RATIONALE_NOT_RESEARCH_HYPOTHESIS");
    expect(JSON.stringify(delta)).toBe(before);
  });
  it.each([T1, T4, "Étudier l’évolution d’un marqueur selon l’âge avec une mesure par sujet", "Étude sans suivi longitudinal", "Comparer la répétabilité des mesures"])("longitudinal requires actual evidence: %s", text => {
    expect(hasLongitudinalDesignEvidence(text)).toBe(false);
    expect(detectStudyDesignSignals(text).longitudinal).toBe(false);
  });
  it.each(["Étude longitudinale prospective", "Les mêmes sujets seront suivis pendant cinq ans", "Mesures répétées dans le temps", "Les mêmes animaux seront évalués lors de plusieurs visites"])("retains explicit longitudinal evidence: %s", text => {
    expect(hasLongitudinalDesignEvidence(text)).toBe(true);
  });
  it("the design interpretation is reversible context, never an adopted fact", () => {
    const r = request(T1);
    expect(JSON.parse(prepareScientificCollaboratorConversation(r).context).currentDesignInterpretation).toEqual({ value: "CROSS_SECTIONAL", status: "CONVERSATIONAL_ASSUMPTION", reversible: true });
    r.conversation.turns.push({ turnId: "long", role: "USER", content: "Les mêmes sujets seront suivis pendant cinq ans" });
    expect(JSON.parse(prepareScientificCollaboratorConversation(r).context).currentDesignInterpretation.value).toBe("LONGITUDINAL");
    r.conversation.turns.push({ turnId: "cross", role: "USER", content: "Finalement une étude transversale, une mesure par sujet" });
    expect(JSON.parse(prepareScientificCollaboratorConversation(r).context).currentDesignInterpretation.value).toBe("CROSS_SECTIONAL");
    expect(r.currentProject).toBeNull();
  });
  it.each([
    "Un découpage par décennies peut être une option raisonnable à discuter.",
    "Les tranches utilisées dans les études doivent être vérifiées avec leurs sources.",
    "Je ne peux pas vérifier ici quelles tranches les études ont choisi.",
  ])("general reasoning or explicit uncertainty stays native: %s", async text => {
    expect((await call(request(T3), text)).body.assistantReply).toBe(text);
  });
  it("rejects unverified literature attribution in the real Bridge, once, without Project writes", async () => {
    const r = request(T3);
    const before = JSON.stringify(r);
    const result = await call(r, "Les études de référence adoptent généralement 20–30 ans, 30–40 ans et 40–50 ans.");
    expect(result.body.assistantReply).not.toContain("20–30");
    expect(result.body.assistantReply).toContain("vérifier");
    expect(result.body.scientificConversation).toMatchObject({ responseOwner: "DETERMINISTIC", fallbackReason: "UNSOURCED_LITERATURE_CLAIM" });
    expect(result.fetchImpl).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(r)).toBe(before);
  });
  it("an unrelated retrieved source cannot license anonymous literature assertions", () => {
    const prepared = prepareScientificCollaboratorConversation(request(T3));
    const packet = JSON.parse(prepared.context);
    packet.knowledge.sources = [{ sourceId: "some-source", title: "General measurement principles" }];
    const scoped = { ...prepared, context: JSON.stringify(packet) };
    expect(guardScientificCollaboratorLiteratureReply(scoped, "Les études utilisent les tranches 20–30 et 30–40 ans.").accepted).toBe(false);
    expect(guardScientificCollaboratorLiteratureReply(scoped, "L’article General measurement principles rapporte une limite méthodologique.").accepted).toBe(true);
  });
});

it.each(["UI_CONFIRM", "NATURAL_CONFIRM"])("actual Standard frozen fibrosis trajectory / %s", async mode => {
  const liveForbidden = vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); });
  vi.stubGlobal("fetch", liveForbidden);
  const initial = createFunctionalResetSession();
  initial.conversationLanguageGateway = { ...initial.conversationLanguageGateway, conversationLanguage: "fr" };
  let latest = initial;
  const requests: ProductBridgeRequest[] = [];
  const replies = ["LOCAL_SYNTHETIC T1 — discussion initiale.", "LOCAL_SYNTHETIC T2 — réparation de l’interprétation.", "LOCAL_SYNTHETIC T3 — procédure et demande de sources à vérifier.", "LOCAL_SYNTHETIC T4 — clarification en discussion."];
  attachTransport(requests, replies);
  const mount = () => render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={latest} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  let ui = mount();
  const settle = async (count: number) => {
    await waitFor(() => expect(requests).toHaveLength(count));
    await waitFor(() => expect(latest.runtimeTurns.at(-1)?.content).toBe(replies[count - 1]));
    await waitFor(() => expect(screen.getByRole("textbox")).not.toBeDisabled());
  };
  send(T1); await settle(1);
  expect(latest.project).toBeNull(); expect(latest.pendingContribution).not.toBeNull();
  const confirm = async (revision: number) => {
    if (mode === "UI_CONFIRM") fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    else send("oui c'est ça");
    await waitFor(() => expect(latest.project?.revision).toBe(revision));
    await waitFor(() => expect(screen.getByRole("textbox")).not.toBeDisabled());
  };
  await confirm(1);
  const version1 = latest.project!.versionId;
  expect(requests).toHaveLength(1); expect(latest.runtimeTurns.at(-1)!.content).toMatch(/Projet créé/);
  expect(latest.scientificThinkingInteraction).toBeNull();
  send(T2); await settle(2);
  expect(requests[1].evaluatePersistentDelta).toBe(false);
  expect(JSON.parse(prepareScientificCollaboratorConversation(requests[1]).context).currentMessage.acts).toContain("USER_FEEDBACK_ON_ASSISTANT_OUTPUT");
  expect(latest.project!.versionId).toBe(version1); expect(latest.pendingContribution).toBeNull();
  send(T3); await settle(3);
  expect(latest.project!.versionId).toBe(version1); expect(latest.pendingContribution).not.toBeNull();
  expect(latest.pendingContribution!.scientificContent.candidateObjects.some(o => o.proposedType === "HYPOTHESIS")).toBe(false);
  expect(latest.pendingContribution!.scientificContent.temporalQualifications).toHaveLength(1);
  await confirm(2);
  const version2 = latest.project!.versionId;
  expect(requests).toHaveLength(3); expect(latest.runtimeTurns.at(-1)!.content).toMatch(/Projet mis à jour/);
  expect(latest.project!.llmProjectWrites).toBe(0); expect(latest.project!.confirmationDecision.actor).toBeTruthy();
  expect(latest.project!.sections.flatMap(s => s.elements).some(o => o.sourceProposedType === "HYPOTHESIS")).toBe(false);
  // Reopen actual persistence before the final correction/critique.
  persistFunctionalResetSession(localStorage, latest);
  const restored = loadFunctionalResetSession(localStorage);
  expect(restored.project).toEqual(latest.project);
  ui.unmount(); latest = restored; ui = mount();
  send(T4); await settle(4);
  expect(latest.project!.versionId).toBe(version2);
  expect(latest.runtimeTurns.filter(t => t.role === "USER" && frozen.inputs.includes(t.content)).map(t => t.content)).toEqual(frozen.inputs);
  expect(latest.bridgeTraces.filter(t => t.requestKind === "POST_ADOPTION_QRY_CONTINUATION")).toHaveLength(0);
  expect(latest.entries.flatMap(e => e.kind === "TEXT" && e.role === "NOXIA" ? [e.content] : []).join("\n")).not.toMatch(/Question 1|Hypothèse 1|Hypothèse 2|Une relation concernant/);
  expect(liveForbidden).not.toHaveBeenCalled();
  writeFileSync(root + `offline-trajectory-${mode}.json`, JSON.stringify({ provenance: "ACTUAL_STANDARD_BRIDGE_PRJ_LOCAL_SYNTHETIC_NOT_NATURALNESS", mode,
    inputs: frozen.inputs, visibleEntries: latest.entries.filter(e => e.kind === "TEXT").map(e => ({ role: e.role, content: e.content })),
    requests: requests.map(r => ({ requestKind: r.requestKind, projectVersion: r.currentProject?.versionId ?? null,
      evaluatePersistentDelta: r.evaluatePersistentDelta, packet: JSON.parse(prepareScientificCollaboratorConversation(r).context) })),
    finalProject: latest.project, providerCalls: 0, automaticContinuations: 0 }, null, 2) + "\n");
  ui.unmount();
}, 30000);

it("refusal, unadopted correction and next discussion preserve the nominal owner and canonical version", async () => {
  const liveForbidden = vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); }); vi.stubGlobal("fetch", liveForbidden);
  const initial = createFunctionalResetSession(); initial.conversationLanguageGateway = { ...initial.conversationLanguageGateway, conversationLanguage: "fr" };
  let latest = initial; const requests: ProductBridgeRequest[] = [];
  attachTransport(requests, ["LOCAL_SYNTHETIC initial.", "LOCAL_SYNTHETIC correction candidate.", "LOCAL_SYNTHETIC discussion après refus."]);
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={initial} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  send(T1); await waitFor(() => expect(latest.pendingContribution).not.toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
  await waitFor(() => expect(latest.project).not.toBeNull());
  await waitFor(() => expect(screen.getByRole("textbox")).not.toBeDisabled());
  const before = JSON.stringify(latest.project);
  send(T3); await waitFor(() => expect(latest.pendingContribution).not.toBeNull());
  expect(JSON.stringify(latest.project)).toBe(before);
  fireEvent.click(screen.getByRole("button", { name: "Refuser cette proposition" }));
  await waitFor(() => expect(latest.pendingContribution).toBeNull()); expect(JSON.stringify(latest.project)).toBe(before);
  expect(latest.retainedContributionCandidates.at(-1)?.humanDecision?.status).toBe("REJECTED");
  send("discutons des limites sans modifier le projet"); await waitFor(() => expect(requests).toHaveLength(3));
  await waitFor(() => expect(latest.runtimeTurns.at(-1)?.content).toBe("LOCAL_SYNTHETIC discussion après refus."));
  expect(JSON.stringify(latest.project)).toBe(before); expect(liveForbidden).not.toHaveBeenCalled();
});

it.each([T2, "Pourquoi ces hypothèses ?", "arrête de me redemander la population, tu la connais déjà ?", "Quels choix de mesure as-tu retenu dans les études comparables ?"])("a reopened legacy owner result cannot capture current scientific discussion: %s", async raw => {
  const liveForbidden = vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); }); vi.stubGlobal("fetch", liveForbidden);
  let latest = createFunctionalResetSession();
  latest.conversationLanguageGateway = { ...latest.conversationLanguageGateway, conversationLanguage: "fr" };
  const source = { turnId: "legacy:user", role: "USER" as const, content: T1, createdAt: "2026-09-17T12:00:00Z" };
  const conversation = { conversationId: latest.conversationId, language: "fr" as const, turns: [source] };
  const checked = validatePersistentProjectDelta(wire(T1, [["OBJECTIVE", "Évaluer la fibrose en fonction de l’âge"], ["POPULATION", "Volontaires sains"]]), T1, null, conversation);
  expect(checked.validation.valid).toBe(true);
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: null })!;
  const review = prepareResearchProjectContributionCandidate(contribution, null);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: latest.projectId,
    authority: latest.projectAuthority, confirmedAt: source.createdAt, reviewedProjection: review.humanReviewProjection });
  const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: source.createdAt });
  const owner = dispatchScientificThinkingFromQuery({ project, navigation, ownerResultLedger: latest.knowledgeOwnerLedger,
    traceLedger: latest.scientificExecutionTraceLedger, sessionId: latest.sessionId, conversationId: latest.conversationId,
    presentationTurnRef: "legacy:assistant", startedAt: source.createdAt, completedAt: source.createdAt });
  const assistant = { turnId: "legacy:assistant", role: "NOXIA" as const, content: owner.presentation.plainText, createdAt: source.createdAt };
  latest = { ...latest, project, queryNavigation: navigation, knowledgeOwnerLedger: owner.ownerResultLedger,
    scientificExecutionTraceLedger: owner.traceLedger, scientificThinkingInteraction: owner.interaction, runtimeTurns: [source, assistant],
    entries: [{ entryId: "legacy:visible", kind: "TEXT", role: "NOXIA", content: assistant.content, createdAt: source.createdAt }] };
  persistFunctionalResetSession(localStorage, latest); latest = loadFunctionalResetSession(localStorage);
  const canonicalBefore = JSON.stringify(latest.project), ownerBefore = JSON.stringify(latest.knowledgeOwnerLedger);
  const requests: ProductBridgeRequest[] = []; attachTransport(requests, ["LOCAL_SYNTHETIC — réponse courante du Collaborator."]);
  render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={latest} onSessionChange={s => { latest = s; }} /></HelmetProvider>);
  send(raw);
  await waitFor(() => expect(requests).toHaveLength(1));
  await waitFor(() => expect(latest.runtimeTurns.at(-1)?.content).toBe("LOCAL_SYNTHETIC — réponse courante du Collaborator."));
  expect(JSON.stringify(latest.project)).toBe(canonicalBefore);
  expect(JSON.stringify(latest.knowledgeOwnerLedger)).toBe(ownerBefore);
  expect(latest.pendingContribution).toBeNull(); expect(liveForbidden).not.toHaveBeenCalled();
});
