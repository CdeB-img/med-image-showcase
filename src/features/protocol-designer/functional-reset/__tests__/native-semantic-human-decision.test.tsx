import { useRef, useState } from "react";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildConversationHumanIntentContext, type ConversationHumanIntent, type ConversationHumanIntentContext } from "@/features/scientific-thinking/conversation-human-intent";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { bindSemanticHumanDecision } from "@/features/query-navigation/semantic-human-decision";
import { DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION } from "../../scientific-execution-trace";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import { markContributionCandidatePresented, retainValidatedContributionCandidate } from "../contribution-lifecycle";
import { prepareTerraConversationRequest } from "../conversation-request";
import { stageProjectConfirmation, stageProjectRejection, type NaturalContributionDecisionContext } from "../project-review-decision";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { explicitTestSave } from "./legacy-persistence-test-adapter";
import { retainSemanticCandidateCorrection, validateCurrentSemanticConversationDecision } from "../semantic-conversation-decision";
import { useConversationTurn } from "../useConversationTurn";
import { behaviorAuthority, behaviorContribution, behaviorItem, behaviorTurn, richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import { terraResultFixture } from "./terra-result-fixture";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge,
  ensureServerProjectSnapshot: vi.fn().mockResolvedValue(undefined) }));
const at = "2026-10-09T12:00:00.000Z";
const fixture = (id = "semantic") => {
  const source = behaviorTurn(`source:${id}`, "Population adulte ; IRM M12 ; objectif distinct");
  const contribution = behaviorContribution({ contributionId: `candidate:${id}`, turns: [source], candidateObjects:
    ["Population adulte", "IRM M12", "Objectif distinct"].map((content, i) => behaviorItem({ itemId: `item:${id}:${i}`,
      content, proposedType: i === 0 ? "POPULATION" : "OBJECTIVE", sourceText: content, turnId: source.turnId })) });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const record = markContributionCandidatePresented({ retained: retainValidatedContributionCandidate({ retained: [], contribution, candidate,
    validation: { valid: true, blocks: [] }, validatorRef: "OFFLINE_NATIVE_REVIEW", sourceTurnRef: source.turnId,
    baseProject: null, dependencyBindings: [], traceRunId: null, retainedAt: at }), candidateRef: contribution.identity.contributionId, presentedAt: at })[0]!;
  const session: FunctionalResetSession = { ...createFunctionalResetSession(at), conversationId: contribution.source.conversationId,
    projectAuthority: behaviorAuthority, pendingContribution: contribution, currentContribution: contribution,
    retainedContributionCandidates: [record], runtimeTurns: [source], entries: [{ entryId: `review:${id}`, kind: "REVIEW",
      role: "NOXIA", contribution, candidate, status: "PENDING", createdAt: at }] };
  const items = candidate.humanReviewProjection.sections.flatMap(section => section.items);
  const refs = ["Population adulte", "IRM M12", "Objectif distinct"].map(text => items.find(item => item.content.endsWith(text))!.changeRef);
  return { session, contribution, candidate, record, source, refs };
};
const frozen = (f: ReturnType<typeof fixture>, text = "Cette architecture est bien celle que je choisis.") => {
  const user = behaviorTurn("semantic:user", text);
  const request: ProductBridgeRequest = { ...prepareTerraConversationRequest(f.session, [...f.session.runtimeTurns, user], user, true, false), apiVersion: "1.0.0" };
  const context = buildConversationHumanIntentContext(request)!;
  const session = { ...f.session, runtimeTurns: [...f.session.runtimeTurns, user] };
  return { user, request, context, session };
};
const intent = (context: ConversationHumanIntentContext, patch: Partial<ConversationHumanIntent> = {}): ConversationHumanIntent => ({
  contractVersion: "1.0.0", inputDigest: context.inputDigest, acts: ["CONTINUE_OR_EXPLAIN"],
  referentRef: context.presentation?.ref ?? null, acceptedChangeRefs: [], rejectedChangeRefs: [], correctedChangeRefs: [],
  unresolved: false, clarification: null, documentAction: null, ...patch,
});
const rebind = (context: ConversationHumanIntentContext, patch: Partial<ConversationHumanIntentContext>) => {
  const { inputDigest: _ignored, ...binding } = context;
  const updated = { ...binding, ...patch };
  return { ...updated, inputDigest: logicalDigest(updated) } as ConversationHumanIntentContext;
};
const call = (request: ProductBridgeRequest, result: unknown, provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
  id: "LOCAL_SYNTHETIC_ONLY", model: "gpt-5.6-terra", status: "completed", output: [{ type: "message", content: [{
    type: "output_text", text: JSON.stringify(result) }] }], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
})))) => ({ provider, run: () => executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "LOCAL_SYNTHETIC_ONLY",
  chatRuntime: "TERRA", fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" }) });
const nativeDecision = (r: ReturnType<typeof frozen>, interpretation: ConversationHumanIntent): NaturalContributionDecisionContext => {
  const bound = bindSemanticHumanDecision(r.context, interpretation);
  return { userTurn: r.user, originalText: r.user.content, gatewayState: r.session.conversationLanguageGateway,
    stylePreference: null, traceLedger: r.session.scientificExecutionTraceLedger, semanticDecision: { context: r.context, interpretation },
    selectedChangeRefs: bound.interaction?.selectedChangeRefs,
    ...(bound.action === "CONFIRM" ? { refusedChangeRefs: bound.interaction?.refusedChangeRefs, correctionChangeRefs: bound.interaction?.correctionChangeRefs } : {}) };
};
afterEach(() => { cleanup(); bridge.mockReset(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); localStorage.clear(); });

describe("native semantic act — ST interpretation, QRY binding, PRJ authority", () => {
  it("supplies actual native presentation, Project/source identity and the strict required nullable output through the existing ST packet", async () => {
    const f = fixture(), r = frozen(f);
    expect(r.context.resolution).toBe("UNIQUE_CURRENT");
    expect(r.context.presentation).toMatchObject({ kind: "NATIVE_CANDIDATE", presented: true, ref: f.record.candidateRef });
    expect(r.context.presentation?.kind === "NATIVE_CANDIDATE" && r.context.presentation.items.map(item => item.changeRef).sort()).toEqual([...f.refs].sort());
    const wire = { ...terraResultFixture("LOCAL_SYNTHETIC — lecture non autoritaire."), humanIntent: intent(r.context) };
    const c = call(r.request, wire), result = await c.run(); expect(result.status).toBe(200);
    expect((result.body as ProductBridgeResponse).observability.projectWrites).toBe(0);
    expect((result.body as ProductBridgeResponse).scientificConversation?.retainedScientificResult?.humanIntent).toEqual(wire.humanIntent);
    expect(c.provider).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(c.provider.mock.calls[0][1]!.body));
    expect(JSON.parse(payload.input).HUMAN_DECISION_CONTEXT).toEqual(r.context);
    expect(payload.text.format.schema.required).toContain("humanIntent");
    expect(payload.text.format.schema.additionalProperties).toBe(false);
    expect(payload.instructions).toContain("L'interprétation n'adopte rien");
    expect(f.session.project).toBeNull();
  });
  it.each([
    "Cette architecture est celle que j'arrête pour le projet.", "Vous pouvez retenir les éléments qui viennent de m'être soumis.",
    "Le périmètre exposé correspond à ma décision définitive.", "C'est entendu pour chacun de ces choix.",
  ])("uses a semantic witness for an unseen whole acceptance, not a language rule: %s", text => {
    const f = fixture(), r = frozen(f, text), interpretation = intent(r.context, { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs] });
    const next = stageProjectConfirmation({ administration: undefined, session: r.session, readCurrentSession: () => r.session, now: at,
      contribution: f.contribution, contributionId: f.record.candidateRef, naturalDecision: nativeDecision(r, interpretation) }).nextSession;
    expect(next.project?.revision).toBe(1); expect(next.project?.confirmationDecision.provenance).toContain(r.user.turnId);
    expect(next.runtimeTurns.filter(turn => turn.turnId === r.user.turnId)).toHaveLength(1);
    expect(next.project?.confirmationDecision.targets).toEqual(expect.arrayContaining(f.refs));
    expect(f.session.project).toBeNull(); // producer never writes the original input
  });
  it("partially accepts one scope, refuses another, and leaves the third undecided without completing the selection", () => {
    const f = fixture(), r = frozen(f, "Gardez les adultes, écartez M12 ; l'objectif reste à discuter.");
    const interpretation = intent(r.context, { acts: ["PARTIAL_ACCEPT", "REJECT"], acceptedChangeRefs: [f.refs[0]], rejectedChangeRefs: [f.refs[1]] });
    const next = stageProjectConfirmation({ administration: undefined, session: r.session, readCurrentSession: () => r.session, now: at,
      contribution: f.contribution, contributionId: f.record.candidateRef, naturalDecision: nativeDecision(r, interpretation) }).nextSession;
    expect(next.project?.sections.flatMap(section => section.elements.map(item => item.content))).toEqual(["Population adulte"]);
    expect(next.pendingContribution).not.toBeNull();
    expect(next.retainedContributionCandidates?.at(-1)?.candidate.humanReviewProjection.coveredChangeRefs).toHaveLength(1);
    expect(next.entries.find(entry => entry.kind === "REVIEW")?.kind).toBe("REVIEW");
  });
  it("refuses a scoped item, retains the other scopes, never writes PRJ or duplicates the delivered USER", () => {
    const f = fixture(), r = frozen(f, "Je ne retiens pas ce calendrier.");
    const interpretation = intent(r.context, { acts: ["REJECT"], rejectedChangeRefs: [f.refs[1]] });
    const next = stageProjectRejection(r.session, f.contribution, f.record.candidateRef, at, nativeDecision(r, interpretation))(r.session);
    expect(next.project).toBeNull(); expect(next.pendingContribution).not.toBeNull();
    expect(next.runtimeTurns.filter(turn => turn.turnId === r.user.turnId)).toHaveLength(1);
    expect(next.retainedContributionCandidates?.at(-1)?.candidate.humanReviewProjection.coveredChangeRefs).toHaveLength(2);
  });
  it("accepts only the exact separable scope beside a correction, never the replacement or a new scientific fact", () => {
    const f = fixture(), r = frozen(f, "La population me convient ; remplacez M12 par M3 et expliquez l'analyse.");
    const interpretation = intent(r.context, { acts: ["PARTIAL_ACCEPT", "CORRECTION", "CONTINUE_OR_EXPLAIN"], acceptedChangeRefs: [f.refs[0]], correctedChangeRefs: [f.refs[1]] });
    const next = stageProjectConfirmation({ administration: undefined, session: r.session, readCurrentSession: () => r.session, now: at,
      contribution: f.contribution, contributionId: f.record.candidateRef, naturalDecision: nativeDecision(r, interpretation) }).nextSession;
    expect(next.project?.sections.flatMap(section => section.elements.map(item => item.content))).toEqual(["Population adulte"]);
    expect(next.pendingMixedUserTurnRef).toBeNull(); // no extra extraction call; meaning stays in the same ST retention
  });
  it.each([
    ["Vas-y, explique pourquoi.", ["CONTINUE_OR_EXPLAIN"]], ["Non, je ne valide rien.", ["REJECT", "AMBIGUOUS"]],
    ["Sous réserve que le recrutement soit faisable.", ["CONDITIONAL"]], ["D'accord pour celui-là.", ["AMBIGUOUS"]],
    ["Ajoutons une mesure à trois mois.", ["ADDITIONAL_INFORMATION"]], ["Finalement à M3, pas M12.", ["CORRECTION"]],
  ] as const)("semantic negative witness cannot adopt: %s", (text, acts) => {
    const f = fixture(), r = frozen(f, text), before = logicalDigest(r.session);
    const result = intent(r.context, { acts: [...acts], correctedChangeRefs: acts.includes("CORRECTION" as never) ? [f.refs[1]] : [],
      unresolved: acts.some(a => a === "AMBIGUOUS" || a === "CONDITIONAL") });
    expect(bindSemanticHumanDecision(r.context, result).action).not.toBe("CONFIRM"); expect(logicalDigest(r.session)).toBe(before);
  });
  it.each(["AMBIGUOUS", "CONDITIONAL"] as const)("preserves %s even if a producer also returns ACCEPT", act => {
    const r = frozen(fixture()), result = intent(r.context, { acts: ["ACCEPT", act], acceptedChangeRefs: r.context.presentation?.kind === "NATIVE_CANDIDATE" ? r.context.presentation.items.map(i => i.changeRef) : [] });
    expect(bindSemanticHumanDecision(r.context, result).action).toBe("CLARIFY");
  });
  it.each(["AMBIGUOUS", "STALE_OR_SUPERSEDED", "NONE"] as const)("does not invent a target for %s", resolution => {
    const r = frozen(fixture()), context = rebind(r.context, { resolution });
    expect(bindSemanticHumanDecision(context, intent(context, { acts: ["ACCEPT"], acceptedChangeRefs: [...fixture().refs] })).action).toBe("CLARIFY");
  });
  it("does not use a raw assistant reply as PRJ authorization", () => {
    const f = fixture(), session = { ...f.session, pendingContribution: null, retainedContributionCandidates: [],
      runtimeTurns: [f.source, { turnId: "actual:reply", role: "NOXIA" as const, content: "Proposons une mesure." }] };
    const r = frozen({ ...f, session }, "Retenez cela.");
    expect(r.context.presentation?.kind).toBe("CONVERSATION_RESPONSE");
    expect(bindSemanticHumanDecision(r.context, intent(r.context, { acts: ["ACCEPT"] })).action).toBe("NONE");
  });
  it.each([
    ["foreign canonical reference", () => ({ acceptedChangeRefs: ["foreign:atom:ref"] })],
    ["overlapping partition", (r: ReturnType<typeof frozen>) => ({ rejectedChangeRefs: [r.context.presentation!.kind === "NATIVE_CANDIDATE" ? r.context.presentation.items[0].changeRef : ""] })],
    ["missing accepted reference", () => ({ acceptedChangeRefs: [] })],
    ["wrong referent", () => ({ referentRef: "candidate:other" })], ["wrong input", () => ({ inputDigest: "ke1:foreign" })],
    ["document action without act", () => ({ documentAction: "CREATE_PROTOCOL" as const })],
    ["duplicate act", () => ({ acts: ["ACCEPT", "ACCEPT"] as ConversationHumanIntent["acts"] })],
  ])("fails closed on %s", (_name, patch) => {
    const f = fixture(), r = frozen(f), result = intent(r.context, { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs], ...patch(r) });
    expect(() => bindSemanticHumanDecision(r.context, result)).toThrow(/^SEMANTIC_HUMAN_DECISION_/);
  });
  it("rejects split native dependency groups rather than broadening partial acceptance", () => {
    const f = fixture(), r = frozen(f), presentation = r.context.presentation;
    if (presentation?.kind !== "NATIVE_CANDIDATE") throw new Error("FIXTURE");
    const context = rebind(r.context, { presentation: { ...presentation, scopeGroups: [[...f.refs]] } });
    expect(() => bindSemanticHumanDecision(context, intent(context, { acts: ["PARTIAL_ACCEPT"], acceptedChangeRefs: [f.refs[0]] }))).toThrow("SCOPE_INVALID");
  });
  it("rejects an unpresented candidate and a forged input context", () => {
    const f = fixture(), r = frozen(f), presentation = r.context.presentation;
    if (presentation?.kind !== "NATIVE_CANDIDATE") throw new Error("FIXTURE");
    const context = rebind(r.context, { presentation: { ...presentation, presented: false } });
    expect(bindSemanticHumanDecision(context, intent(context, { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs] })).action).toBe("CLARIFY");
    expect(() => bindSemanticHumanDecision({ ...r.context, userMessageDigest: "forged" }, intent(r.context))).toThrow("CONTEXT_INVALID");
  });
  it.each(["USER", "PROJECT", "PRESENTATION", "CANDIDATE"] as const)("rejects a current %s binding changed after dispatch", kind => {
    const f = fixture(), r = frozen(f), decision = { context: r.context, interpretation: intent(r.context, { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs] }) };
    let session = r.session;
    if (kind === "USER") session = { ...session, runtimeTurns: [...session.runtimeTurns, behaviorTurn("later:user", "Attendez.")] };
    if (kind === "PROJECT") session = { ...session, project: confirmResearchProjectContribution({ contribution: richStudyContribution(), current: null,
      projectId: session.projectId, authority: behaviorAuthority, confirmedAt: at }) };
    if (kind === "PRESENTATION") session = { ...session, retainedContributionCandidates: [{ ...f.record, presentedAt: "2026-10-09T13:00:00Z" }] };
    if (kind === "CANDIDATE") session = { ...session, retainedContributionCandidates: [{ ...f.record, actuality: "SUPERSEDED" }] };
    expect(() => validateCurrentSemanticConversationDecision(session, r.user, decision)).toThrow(/^SEMANTIC_HUMAN_DECISION_/);
    expect(session.project?.confirmationDecision.provenance ?? []).not.toContain(r.user.turnId);
  });
  it("PRJ refuses consumer widening of a valid semantic partition", () => {
    const f = fixture(), r = frozen(f), interpretation = intent(r.context, { acts: ["PARTIAL_ACCEPT"], acceptedChangeRefs: [f.refs[0]] });
    expect(() => stageProjectConfirmation({ administration: undefined, session: r.session, readCurrentSession: () => r.session, now: at, contribution: f.contribution,
      contributionId: f.record.candidateRef, naturalDecision: { ...nativeDecision(r, interpretation), selectedChangeRefs: f.refs } })).toThrow("AUTHORITY_INVALID");
  });
  it("preserves human mandate validation after successful semantic binding", () => {
    const f = fixture(), r = frozen(f), result = intent(r.context, { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs] });
    const invalid = { ...r.session, projectAuthority: { ...behaviorAuthority, actorRef: "" } };
    expect(() => stageProjectConfirmation({ administration: undefined, session: invalid, readCurrentSession: () => invalid, now: at, contribution: f.contribution,
      contributionId: f.record.candidateRef, naturalDecision: nativeDecision(r, result) })).toThrow("AUTHORITY_INVALID");
  });
  it("retains additional scientific meaning and acceptance in one existing mocked ST execution without adopting the new information", async () => {
    const f = fixture(), r = frozen(f, "Population retenue ; ajoutons une IRM à M3.");
    const wire = { ...terraResultFixture("LOCAL_SYNTHETIC — M3 reste une contribution nouvelle."), humanIntent: intent(r.context, {
      acts: ["PARTIAL_ACCEPT", "ADDITIONAL_INFORMATION"], acceptedChangeRefs: [f.refs[0]] }), userContribution: {
      coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "new:M3", content: "IRM à M3", epistemicState: "USER_STATED",
        polarity: "AFFIRMED", conditions: [], linkedIds: [] }] } };
    const c = call(r.request, wire), body = (await c.run()).body as ProductBridgeResponse;
    expect(body.scientificConversation?.retainedScientificResult?.userContribution.elements[0].content).toBe("IRM à M3");
    expect(body.persistentExtraction.called).toBe(false); expect(body.observability.projectWrites).toBe(0); expect(c.provider).toHaveBeenCalledTimes(1);
  });
  it.each(["malformed", "wrong scope", "provider failure"])("does not turn %s into a native confirmation", async type => {
    const f = fixture(), r = frozen(f), wire = { ...terraResultFixture("LOCAL_SYNTHETIC"), humanIntent: type === "malformed" ? { acts: ["ACCEPT"] }
      : intent(r.context, { acts: ["ACCEPT"], acceptedChangeRefs: ["foreign:change"] }) };
    const provider = type === "provider failure" ? vi.fn<typeof fetch>().mockRejectedValue(new Error("OFFLINE_FAILURE")) : undefined;
    const c = call(r.request, wire, provider), body = (await c.run()).body as ProductBridgeResponse;
    expect(body.conversationFailure).toBeTruthy(); expect(body.scientificConversation?.retainedScientificResult?.humanIntent).toBeUndefined();
    expect(body.observability.projectWrites).toBe(0); expect(c.provider).toHaveBeenCalledTimes(1); expect(f.session.project).toBeNull();
  });
  it("historical absent humanIntent is readable but never falls back to a lexical decision in the native path", () => {
    const r = frozen(fixture(), "oui"); expect(bindSemanticHumanDecision(r.context, undefined).action).toBe("NONE");
    const packet = JSON.parse(prepareTerraConversation(r.request).context); expect(packet.HUMAN_DECISION_CONTEXT.inputDigest).toBe(r.context.inputDigest);
  });
  it("two actual retained proposals remain ambiguous even when one is selected, without a recency guess", () => {
    const f = fixture(), other = fixture("second"), r = frozen({ ...f, session: { ...f.session,
      runtimeTurns: [...f.session.runtimeTurns, other.source], retainedContributionCandidates: [f.record, other.record] } });
    expect(r.context.resolution).toBe("AMBIGUOUS");
    expect(bindSemanticHumanDecision(r.context, intent(r.context, { acts: ["ACCEPT"] })).action).toBe("CLARIFY");
  });
  it("measures only the new native context overhead, without a new operation or packet-limit change", () => {
    const r = frozen(fixture()), baseRequest = { ...r.request, boundedReferentContext: undefined };
    const base = new TextEncoder().encode(prepareTerraConversation(baseRequest).context).length;
    const bytes = new TextEncoder().encode(prepareTerraConversation(r.request).context).length;
    expect(bytes).toBeLessThan(80_000); expect(bytes).toBeGreaterThan(base);
    console.info(JSON.stringify({ fixture: "THREE_NATIVE_REVIEW_ITEMS", basePacketBytes: base, packetBytes: bytes, addedBytes: bytes - base }));
  });
  it("exact correction supersedes only its scope; a later acceptance cannot revive the old candidate", () => {
    const f = fixture(), r = frozen(f, "Remplaçons M12 par M3."), decision = { context: r.context,
      interpretation: intent(r.context, { acts: ["CORRECTION"], correctedChangeRefs: [f.refs[1]] }) };
    const corrected = retainSemanticCandidateCorrection(r.session, r.user, decision, at);
    expect(corrected.project).toBeNull(); expect(corrected.retainedContributionCandidates?.[0].actuality).toBe("SUPERSEDED");
    expect(corrected.retainedContributionCandidates?.[0].humanDecision).toBeNull();
    expect(corrected.retainedContributionCandidates?.at(-1)?.candidate.humanReviewProjection.coveredChangeRefs).toHaveLength(2);
    expect(() => validateCurrentSemanticConversationDecision(corrected, r.user, decision)).toThrow("CONTEXT_STALE");
  });
});

describe("actual TERRA conversation coordinator, synthetic provider boundary only", () => {
  const open = (initial: FunctionalResetSession) => {
    const confirms = vi.fn(), refusals = vi.fn(), documents = vi.fn();
    const hook = renderHook(() => {
      const [session, setSession] = useState(initial), latest = useRef(session); latest.current = session;
      const confirm = async (id: string, decision?: NaturalContributionDecisionContext) => {
        confirms(id, decision); const current = latest.current;
        const next = stageProjectConfirmation({ administration: undefined, session: current, readCurrentSession: () => latest.current, contribution: current.pendingContribution!,
          contributionId: id, now: at, naturalDecision: decision }).nextSession; latest.current = next; setSession(next); return next;
      };
      const reject = (id: string, decision?: NaturalContributionDecisionContext) => {
        refusals(id, decision); const current = latest.current; setSession(stageProjectRejection(current, current.pendingContribution!, id, at, decision));
      };
      const commands = useConversationTurn({ session, latestSessionRef: latest, setSession, busy: false, setBusy: vi.fn(), setBusyMessage: vi.fn(),
        setDraft: vi.fn(), correctionMode: false, setCorrectionMode: vi.fn(), autonomousProjectBuild: true,
        traceCaptureConfiguration: DEFAULT_SCIENTIFIC_TRACE_CAPTURE_CONFIGURATION, setPostAdoptionContinuationJob: vi.fn(),
        confirmContribution: confirm, rejectContribution: reject, dispatchProductDocumentAction: documents,
        handleDocumentInstruction: vi.fn(), persistenceFailureMessage: () => null });
      return { session, commands };
    });
    return { hook, confirms, refusals, documents };
  };
  const mock = (patch: (context: ConversationHumanIntentContext) => Partial<ConversationHumanIntent> | null) => {
    bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      const context = buildConversationHumanIntentContext(request)!, selection = patch(context);
      return (await call({ ...request, apiVersion: "1.0.0" }, { ...terraResultFixture("LOCAL_SYNTHETIC — réponse scientifique"),
        ...(selection ? { humanIntent: intent(context, selection) } : {}) }).run()).body;
    });
  };
  it.each(["full", "partial", "refusal", "explanation", "absent"])("executes %s after the same ST response, never before it", async kind => {
    const f = fixture(); mock(() => kind === "absent" ? null : kind === "full" ? { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs] }
      : kind === "partial" ? { acts: ["PARTIAL_ACCEPT", "REJECT"], acceptedChangeRefs: [f.refs[0]], rejectedChangeRefs: [f.refs[1]] }
      : kind === "refusal" ? { acts: ["REJECT"], rejectedChangeRefs: [...f.refs] } : { acts: ["CONTINUE_OR_EXPLAIN"] });
    const h = open(f.session); const text = kind === "explanation" || kind === "absent" ? "oui" : "Mon intention est interprétée par le témoin natif, pas par ces mots.";
    await act(async () => { await h.hook.result.current.commands.submitTerraText(text); });
    const current = h.hook.result.current.session;
    expect(bridge).toHaveBeenCalledTimes(1); expect(current.entries.filter(entry => entry.kind === "ERROR")).toEqual([]);
    expect(current.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === text)).toHaveLength(1);
    if (kind === "full" || kind === "partial") {
      expect(h.confirms).toHaveBeenCalledTimes(1); expect(current.project?.revision).toBe(1);
      expect(current.project?.canonicalState?.objects).toHaveLength(kind === "full" ? 3 : 1);
    } else { expect(h.confirms).not.toHaveBeenCalled(); expect(current.project).toBeNull(); }
    expect(h.refusals).toHaveBeenCalledTimes(kind === "refusal" ? 1 : 0); expect(h.documents).not.toHaveBeenCalled();
  });
  it("a document request routes the existing Product Entry action, not scientific confirmation", async () => {
    const f = fixture(); mock(() => ({ acts: ["DOCUMENT_REQUEST"], documentAction: "CREATE_PROTOCOL" })); const h = open(f.session);
    await act(async () => { await h.hook.result.current.commands.submitTerraText("Préparez le protocole sans valider les choix."); });
    expect(h.documents).toHaveBeenCalledTimes(1); expect(h.confirms).not.toHaveBeenCalled(); expect(h.hook.result.current.session.project).toBeNull();
  });
  it("failure of the existing call has no lexical early adoption and no fallback/retry operation", async () => {
    bridge.mockRejectedValue(new Error("OFFLINE_PROVIDER_FAILURE")); const f = fixture(), h = open(f.session);
    await act(async () => { await h.hook.result.current.commands.submitTerraText("oui"); });
    expect(h.confirms).not.toHaveBeenCalled(); expect(h.refusals).not.toHaveBeenCalled(); expect(h.hook.result.current.session.project).toBeNull();
    expect(bridge).toHaveBeenCalledTimes(1); expect(h.hook.result.current.session.entries.at(-1)?.kind).toBe("ERROR");
  });
  it.each(["accept", "refuse"])("real workspace %s persists and reloads the exact native decision after one ST call", async action => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    const forbidden = vi.fn(() => { throw new Error("REAL_NETWORK_FORBIDDEN"); }); vi.stubGlobal("fetch", forbidden);
    const f = fixture(); let saved = f.session;
    mock(() => action === "accept" ? { acts: ["ACCEPT"], acceptedChangeRefs: [...f.refs] } : { acts: ["REJECT"], rejectedChangeRefs: [...f.refs] });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={f.session} onSessionChange={explicitTestSave(value => {
      saved = value; return persistFunctionalResetSession(localStorage, value);
    })} /></HelmetProvider>);
    const text = "Cette décision est volontairement exprimée hors de toute grammaire locale.";
    fireEvent.change(screen.getByRole("textbox"), { target: { value: text } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await waitFor(() => expect(saved.retainedContributionCandidates?.[0].humanDecision?.status,
      JSON.stringify(saved.entries.filter(entry => entry.kind === "ERROR"))).toBe(action === "accept" ? "ADOPTED" : "REJECTED"));
    const reload = loadFunctionalResetSession(localStorage)!;
    expect(reload.project?.revision ?? null).toBe(action === "accept" ? 1 : null);
    expect(reload.retainedContributionCandidates?.[0].humanDecision?.status).toBe(action === "accept" ? "ADOPTED" : "REJECTED");
    expect(reload.runtimeTurns.filter(turn => turn.role === "USER" && turn.content === text)).toHaveLength(1);
    expect(bridge).toHaveBeenCalledTimes(1); expect(forbidden).not.toHaveBeenCalled();
    expect(saved.workingDraftPreparations?.length ?? 0).toBe(0);
  });
});
