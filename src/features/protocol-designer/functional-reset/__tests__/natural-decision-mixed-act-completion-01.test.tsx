import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { buildCurrentTurnNavigation } from "../../../query-navigation/current-turn-navigation";
import { realizeGovernedConversation } from "../../../query-navigation/governed-conversation-realization";
import { evaluateLinguisticInvariants, materializeLanguageProjectionArtifact, type LanguageProjectionRequest } from "../../conversation-language-gateway";
import { logicalDigest } from "../../../knowledge-engine/canonical";
import { buildBoundedConversationReferentContext, selectBoundedConversationInteraction } from "../../../query-navigation/current-navigation-evidence";
import { confirmResearchProjectContribution, prepareResearchProjectContributionCandidate, rejectResearchProjectContribution } from "../../../research-project-construction/contribution-owner-boundary";
import type { ResearchProjectOwnerProjection } from "../../../research-project-construction/contribution-owner-boundary";
import { contributionFromPersistentDelta, validatePersistentProjectDelta, parseProductBridgeRequest, type ProductBridgeRequest, type ProductBridgeResponse } from "../../product-bridge";
import { markContributionCandidateNonCurrent, markContributionCandidatePresented, recordContributionCandidateHumanDecision, retainUndecidedContributionScope, retainValidatedContributionCandidate } from "../contribution-lifecycle";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import { behaviorAuthority, behaviorContribution, behaviorItem, behaviorRelation, behaviorTurn } from "./p1-behavior-01a-contract-fixtures";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { routeProductEntry } from "../product-entry-routing";
import type { ProductBridgeTrace } from "../session";

const bridge = vi.hoisted(() => vi.fn());
const language = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async importOriginal => ({ ...await importOriginal<object>(), requestProtocolDesignerBridge: bridge, requestConversationLanguageProjection: language }));
const at = "2026-09-17T12:00:00Z";
const make = (texts = ["IRM J0", "IRM J1"], types = texts.map(() => "OBJECTIVE"), current: ResearchProjectOwnerProjection | null = null, id = "mixed") => {
  const turn = behaviorTurn(`source:${id}`, `Je veux construire une étude : ${texts.join(" ; ")}`);
  const contribution = behaviorContribution({ contributionId: `candidate:${id}`, turns: [turn], candidateObjects: texts.map((content, i) => behaviorItem({
    itemId: `item:${id}:${i}`, content, proposedType: types[i]!, sourceText: content, turnId: turn.turnId, studyRole: types[i] === "ENDPOINT" ? "PRIMARY_ENDPOINT" : null,
  })) });
  const candidate = prepareResearchProjectContributionCandidate(contribution, current);
  const record = markContributionCandidatePresented({ retained: retainValidatedContributionCandidate({ retained: [], contribution, candidate,
    validation: { valid: true, blocks: [] }, validatorRef: "OFFLINE_VALIDATED_NATIVE_REVIEW", sourceTurnRef: turn.turnId,
    baseProject: current, dependencyBindings: [], traceRunId: null, retainedAt: at }), candidateRef: contribution.identity.contributionId, presentedAt: at })[0]!;
  return { turn, contribution, candidate, record, current };
};
const bind = (raw: string, f: ReturnType<typeof make>, extra = [] as ReturnType<typeof behaviorTurn>[]) => selectBoundedConversationInteraction({ sourceText: raw, correctionMode: false,
  referentContext: buildBoundedConversationReferentContext({ retained: [f.record], currentProject: f.current, conversationId: f.contribution.source.conversationId,
    runtimeTurns: [f.turn, ...extra], selectedReviewRef: f.record.candidateRef }) });
const decide = (raw: string, f: ReturnType<typeof make>, extra = [] as ReturnType<typeof behaviorTurn>[]) => {
  const act = bind(raw, f, extra)!;
  const user = behaviorTurn("human:decision", raw);
  const project = act.kind === "USER_CONFIRMS_CURRENT_CANDIDATE" ? confirmResearchProjectContribution({ contribution: f.contribution, current: f.current,
    projectId: f.current?.projectId ?? "project:mixed", authority: behaviorAuthority, confirmedAt: at,
    reviewedProjection: f.candidate.humanReviewProjection, selectedChangeRefs: act.selectedChangeRefs, confirmationSourceRefs: [user.turnId] }) : f.current;
  const decision = act.kind === "USER_CONFIRMS_CURRENT_CANDIDATE" ? project!.confirmationDecision : rejectResearchProjectContribution({ contribution: f.contribution,
    current: f.current, authority: behaviorAuthority, rejectedAt: at, selectedChangeRefs: act.selectedChangeRefs,
    reviewedProjection: f.candidate.humanReviewProjection, rejectionSourceRefs: [user.turnId] });
  const settled = act.kind === "USER_CONFIRMS_CURRENT_CANDIDATE" ? [...(act.selectedChangeRefs ?? f.candidate.humanReviewProjection.coveredChangeRefs),
    ...(act.refusedChangeRefs ?? []), ...(act.correctionChangeRefs ?? [])] : act.selectedChangeRefs ?? f.candidate.humanReviewProjection.coveredChangeRefs;
  const remainder = retainUndecidedContributionScope({ record: f.record, currentBefore: f.current, currentAfter: project,
    settledChangeRefs: settled, decisionSourceRef: user.turnId, retainedAt: at });
  const retained = recordContributionCandidateHumanDecision({ retained: [f.record], candidateRef: f.record.candidateRef, decision });
  return { act, user, project, decision, retained, remainder };
};
const contents = (project: ResearchProjectOwnerProjection | null) => project?.sections.flatMap(section => section.elements.map(item => item.content)) ?? [];
// Qualified local/synthetic extraction output, passed through current N1 and PRJ owners.
const prepare = (request: ProductBridgeRequest, content: string, sourceText: string, id = "new", proposedType = "OBJECTIVE") => {
  const user = request.conversation.turns.filter(turn => turn.role === "USER").at(-1)!;
  const wire = { changes: [{ operation: "ADD", candidateRef: `local:${id}`, proposedType, content, sourceText, epistemicState: "KNOWN", assertionKind: "USER_STATED" }],
    relations: [], temporalQualifications: [], expectedVariableOccasions: [] };
  const checked = validatePersistentProjectDelta(wire, user.content, request.currentProject, request.conversation);
  expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: request.conversation, currentProject: request.currentProject, createdAt: at })!;
  const candidate = prepareResearchProjectContributionCandidate(contribution, request.currentProject);
  expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
  return { checked, contribution, candidate, user };
};
const request = (user: ReturnType<typeof behaviorTurn>, currentProject: ResearchProjectOwnerProjection | null, earlier: ReturnType<typeof behaviorTurn>[] = []): ProductBridgeRequest => ({
  apiVersion: "1.0.0", conversation: { conversationId: "conversation:p1-behavior-01a", language: "fr", turns: [...earlier, user] }, currentProject, evaluatePersistentDelta: true,
});
const response = (r: ProductBridgeRequest, content: string, sourceText: string): ProductBridgeResponse => {
  expect(parseProductBridgeRequest({ ...r, apiVersion: "1.0.0" })).not.toBeNull();
  const p = prepare(r, content, sourceText);
  const currentTurnNavigation = buildCurrentTurnNavigation({ sourceTurnRef: p.user.turnId, sourceText: p.user.content,
    candidate: p.candidate, contribution: p.contribution, validation: p.checked.validation, currentProject: r.currentProject,
    currentNavigation: r.currentNavigation, boundedInteraction: r.boundedInteraction, boundedReferentContext: r.boundedReferentContext });
  const governedRealization = realizeGovernedConversation({ envelope: currentTurnNavigation.envelope, localWhatText: currentTurnNavigation.localWhatText });
  return { apiVersion: "1.0.0", currentTurnNavigation, governedRealization, assistantReply: governedRealization.assistantReply,
    assistantTurn: { turnId: "noxia:local", role: "NOXIA", content: governedRealization.assistantReply },
    persistentExtraction: { called: true, status: "CANDIDATE", contribution: p.contribution, candidate: p.checked.candidate,
      validation: p.checked.validation, wireCandidate: p.checked.wireCandidate, providerArtifact: null },
    observability: { provider: "GOOGLE_GEMINI", model: "LOCAL_SYNTHETIC_QUALIFICATION_NO_PROVIDER", conversationLatencyMs: 0, extractionLatencyMs: 0,
      calls: 0, conversationCalls: 0, projectWrites: 0, providerCalls: [] } };
};
afterEach(() => { cleanup(); vi.unstubAllGlobals(); bridge.mockReset(); language.mockReset(); localStorage.clear(); });

describe("N3 completion — separable native decisions and downstream preparation", () => {
  it("confirms J0/J1, prepares M12 separately, then requires a second human confirmation", () => {
    const f = make();
    const raw = "oui c'est ça, et on ajoute une IRM à M12";
    const first = decide(raw, f);
    expect(first.act).toMatchObject({ kind: "USER_CONFIRMS_CURRENT_CANDIDATE", prepareRemainingTurn: true });
    expect(contents(first.project).sort()).toEqual(["IRM J0", "IRM J1"]);
    const p = prepare(request(first.user, first.project, [f.turn]), "IRM à M12", "IRM à M12");
    expect(p.contribution.source.originalRequest).toBe(raw);
    expect(p.contribution.source.turns.map(turn => turn.turnId)).toEqual([f.turn.turnId, first.user.turnId]);
    expect(p.candidate.projectWriteAuthorized).toBe(false);
    expect(contents(first.project)).not.toContain("IRM à M12");
    const second = confirmResearchProjectContribution({ contribution: p.contribution, current: first.project, projectId: first.project!.projectId,
      authority: behaviorAuthority, confirmedAt: at, reviewedProjection: p.candidate.humanReviewProjection, confirmationSourceRefs: ["human:second"] });
    expect(contents(second).sort()).toEqual(["IRM J0", "IRM J1", "IRM à M12"]);
    expect(second.confirmationDecision.provenance).toContain("human:second");
  });
  it("corrects J3 before adoption, supersedes the old candidate and confirms only M3 next turn", () => {
    const f = make(["IRM J3"]);
    const raw = "oui mais finalement à M3";
    const act = bind(raw, f)!;
    expect(act).toMatchObject({ kind: "ACKNOWLEDGE_USER_DIRECTION", correctionChangeRefs: [f.candidate.humanReviewProjection.coveredChangeRefs[0]] });
    const user = behaviorTurn("human:correction", raw);
    const p = prepare(request(user, null, [f.turn]), "IRM M3", "à M3");
    const closed = markContributionCandidateNonCurrent({ retained: [f.record], candidateRef: f.record.candidateRef, actuality: "SUPERSEDED", reasonRef: user.turnId, recordedAt: at });
    expect(bind("oui", { ...f, record: closed[0]! }, [user])?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    const project = confirmResearchProjectContribution({ contribution: p.contribution, current: null, projectId: "project:corrected", authority: behaviorAuthority,
      confirmedAt: at, reviewedProjection: p.candidate.humanReviewProjection, confirmationSourceRefs: ["human:next"] });
    expect(contents(project)).toEqual(["IRM M3"]);
    expect(project.revision).toBe(1);
    expect(closed[0]!.humanDecision).toBeNull();
  });
  it("adopts population while keeping an unspecified new primary endpoint open", () => {
    const f = make(["Population 18–80 ans", "Volume de lésion"], ["POPULATION", "ENDPOINT"]);
    const d = decide("oui pour la population mais je changerais le critère principal", f);
    expect(d.act.correctionChangeRefs).toHaveLength(1);
    expect(contents(d.project)).toEqual(["Population 18–80 ans"]);
    expect(d.remainder).toBeNull();
    expect(d.project!.sections.find(section => section.sectionId === "MEASUREMENTS")?.state).toBe("TO_CLARIFY");
  });
  it.each([
    ["population oui, calendrier non", ["Population 18–80 ans", "IRM J3"], ["POPULATION", "OBJECTIVE"], "Population 18–80 ans"],
    ["garde l'IRM mais pas le prélèvement", ["IRM cardiaque", "Prélèvement sanguin"], ["OBJECTIVE", "OBJECTIVE"], "IRM cardiaque"],
  ] as const)("partial named scope: %s", (raw, texts, types, adopted) => {
    const f = make([...texts, "Objectif distinct"], [...types, "OBJECTIVE"]);
    const d = decide(raw, f);
    expect(contents(d.project)).toEqual([adopted]);
    expect(d.remainder?.candidate.humanReviewProjection.sections.flatMap(section => section.items.map(item => item.content))).toEqual(["+ Objectif distinct"]);
    expect(d.remainder?.sourceTurnRef).toBe(f.turn.turnId);
    expect(d.remainder?.humanDecision).toBeNull();
  });
  it("uses only real visible numbering for first/second decisions", () => {
    const f = make(["Population 18–80 ans", "IRM J3", "Objectif distinct"], ["POPULATION", "OBJECTIVE", "OBJECTIVE"]);
    expect(bind("le premier oui, le deuxième non", f)?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    const visible = { ...behaviorTurn("visible:numbers", "1. Population 18–80 ans\n2. IRM J3"), role: "NOXIA" as const };
    const d = decide("le premier oui, le deuxième non", f, [visible]);
    expect(contents(d.project)).toEqual(["Population 18–80 ans"]);
    expect(d.remainder).not.toBeNull();
  });
  it("keeps an adopted Project and unmentioned pending science during a scoped refusal", () => {
    const adopted = make(["Population adulte"], ["POPULATION"], null, "adopted");
    const prior = decide("oui", adopted).project!;
    const rejected = make(["Analyse secondaire antérieure"], ["ANALYSIS"], prior, "rejected");
    const closed = decide("non", rejected).retained[0]!;
    const f = make(["Analyse avec seuil", "IRM M12"], ["ANALYSIS", "OBJECTIVE"], prior);
    const before = logicalDigest(prior);
    const d = decide("je retire l'analyse avec seuil, le reste reste comme avant", f);
    expect(logicalDigest(d.project)).toBe(before);
    expect(d.remainder?.candidate.humanReviewProjection.sections.flatMap(section => section.items.map(item => item.content))).toEqual(["+ IRM M12"]);
    expect(closed.humanDecision?.status).toBe("REJECTED");
    expect(bind("oui", { ...rejected, record: closed })?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    const active = markContributionCandidatePresented({ retained: [closed, ...d.retained, d.remainder!], candidateRef: d.remainder!.candidateRef, presentedAt: at });
    const ctx = buildBoundedConversationReferentContext({ retained: active, currentProject: prior, conversationId: f.contribution.source.conversationId,
      runtimeTurns: [adopted.turn, rejected.turn, f.turn, d.user], selectedReviewRef: d.remainder!.candidateRef });
    expect(ctx.candidateRef).toBe(d.remainder!.candidateRef);
  });
  it("adoption plus style feedback does not create a scientific candidate", () => {
    const d = decide("on adopte meme si je trouve que tu propose beaucoup trop de texte a lire", make());
    expect(d.remainder).toBeNull();
    expect(d.act.prepareRemainingTurn).toBeUndefined();
    expect(contents(d.project)).toHaveLength(2);
  });
  it("refusing the new M12 candidate preserves the previously confirmed J0/J1", () => {
    const first = decide("oui c'est ça, et on ajoute une IRM à M12", make());
    const p = prepare(request(first.user, first.project), "IRM à M12", "IRM à M12");
    const before = logicalDigest(first.project);
    const decision = rejectResearchProjectContribution({ contribution: p.contribution, current: first.project,
      authority: behaviorAuthority, rejectedAt: at, rejectionSourceRefs: ["human:no-m12"] });
    expect(decision.status).toBe("REJECTED");
    expect(logicalDigest(first.project)).toBe(before);
    expect(contents(first.project)).not.toContain("IRM à M12");
  });
  it("unmentioned pending scope can be reviewed and adopted at a later turn", () => {
    const f = make(["Population adulte", "Volume de lésion", "IRM M12"], ["POPULATION", "ENDPOINT", "OBJECTIVE"]);
    const first = decide("oui pour la population mais pas pour le critère principal", f);
    const remainder = markContributionCandidatePresented({ retained: [first.remainder!], candidateRef: first.remainder!.candidateRef, presentedAt: at })[0]!;
    const nextUser = behaviorTurn("human:remainder", "oui");
    const ctx = buildBoundedConversationReferentContext({ retained: [...first.retained, remainder], currentProject: first.project,
      conversationId: f.contribution.source.conversationId, runtimeTurns: [f.turn, first.user, nextUser],
      selectedReviewRef: remainder.candidateRef, requestingTurnRef: nextUser.turnId });
    const act = selectBoundedConversationInteraction({ sourceText: nextUser.content, correctionMode: false, referentContext: ctx });
    expect(act?.kind).toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
    const next = confirmResearchProjectContribution({ contribution: remainder.contribution, current: first.project, projectId: first.project!.projectId,
      authority: behaviorAuthority, confirmedAt: at, reviewedProjection: remainder.candidate.humanReviewProjection, confirmationSourceRefs: [nextUser.turnId] });
    expect(contents(next).sort()).toEqual(["IRM M12", "Population adulte"]);
    expect(contents(next)).not.toContain("Volume de lésion");
  });
  it("multiple visible timings do not acquire a guessed replacement target", () => {
    const act = bind("oui mais finalement à M3", make(["IRM J3", "Prélèvement J6"]));
    expect(act?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    expect(act?.clarificationText).toContain("Quel temps");
  });
  it.each(["si oui c'est ça, et on ajoute une IRM à M12", "oui c'est ça, et on ajoute une IRM à M12 ?", "population oui, calendrier non ?"])("nonasserted mixed turn cannot adopt: %s", raw => {
    expect(bind(raw, make())?.kind).not.toBe("USER_CONFIRMS_CURRENT_CANDIDATE");
  });
  it("dependent population/endpoint scopes require targeted clarification", () => {
    const f = make(["Population adulte", "Volume de lésion"], ["POPULATION", "ENDPOINT"]);
    const contribution = behaviorContribution({ contributionId: "candidate:dependent", turns: [f.turn], candidateObjects: f.contribution.scientificContent.candidateObjects,
      relations: [behaviorRelation({ relationId: "dep", relationType: "ASSOCIATED_WITH", sourceItemId: "item:mixed:0", targetItemId: "item:mixed:1", turnId: f.turn.turnId })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    const record = { ...f.record, candidateRef: contribution.identity.contributionId, contribution, candidate, candidateDigest: logicalDigest({ contribution, candidate }) };
    const act = bind("oui pour la population mais pas pour le critère principal", { ...f, contribution, candidate, record });
    expect(act?.kind).toBe("CLARIFY_CANDIDATE_REFERENCE");
    expect(() => confirmResearchProjectContribution({ contribution, current: null, projectId: "p", authority: behaviorAuthority, confirmedAt: at,
      reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: [candidate.canonicalChangeSet.objectChanges[0]!.changeRef] })).toThrow("SEPARABLE");
  });
  it("an acquisition time cannot be partially adopted without its new reference event", () => {
    const user = behaviorTurn("human:time-reference", "IRM à trois jours après la reperfusion");
    const checked = validatePersistentProjectDelta({ changes: [
      { operation: "ADD", candidateRef: "acq", proposedType: "ACQUISITION", content: "IRM", sourceText: "IRM" },
      { operation: "ADD", candidateRef: "event", proposedType: "PROJECT_INFORMATION", content: "Reperfusion", sourceText: "reperfusion" },
    ], relations: [], expectedVariableOccasions: [], temporalQualifications: [{ operation: "ADD", qualificationId: "time:acq", subjectProjectRef: "acq",
      temporalRole: "ACQUISITION_TIME", sourceText: user.content, assertionKind: "USER_STATED", evidenceRefs: [], anchor: {
        kind: "TIMEPOINT", direction: "AFTER", offset: 3, unit: "jour", lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null,
        reference: { status: "KNOWN", referenceProjectRef: "event" },
      } }], }, user.content, null);
    expect(checked.validation.valid).toBe(true);
    const c = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: request(user, null).conversation, currentProject: null })!;
    const candidate = prepareResearchProjectContributionCandidate(c, null);
    const refs = [...candidate.canonicalChangeSet.objectChanges.filter(change => change.candidate?.content === "IRM").map(change => change.changeRef),
      ...candidate.canonicalChangeSet.temporalQualificationChanges.map(change => change.changeRef)];
    expect(() => confirmResearchProjectContribution({ contribution: c, current: null, projectId: "p:time-reference", authority: behaviorAuthority,
      confirmedAt: at, reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: refs })).toThrow("SEPARABLE");
  });
  it("scoped native REPLACE is adopted without unrelated ADD and survives persistence", () => {
    const prior = decide("oui", make(["Population 18–80 ans"], ["POPULATION"], null, "initial")).project!;
    const id = prior.sections.find(section => section.sectionId === "POPULATION")!.elements[0]!.elementId;
    const user = behaviorTurn("human:replace", "Population 35–85 ans ; IRM M12");
    const checked = validatePersistentProjectDelta({ changes: [
      { operation: "REPLACE", targetProjectRef: id, proposedType: "POPULATION", content: "Population 35–85 ans", sourceText: "Population 35–85 ans" },
      { operation: "ADD", proposedType: "OBJECTIVE", content: "IRM M12", sourceText: "IRM M12" },
    ], relations: [], temporalQualifications: [], expectedVariableOccasions: [] }, user.content, prior);
    expect(checked.validation.valid).toBe(true);
    const c = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: request(user, prior).conversation, currentProject: prior })!;
    const candidate = prepareResearchProjectContributionCandidate(c, prior);
    const pop = candidate.humanReviewProjection.sections.flatMap(section => section.items).find(item => item.objectType === "POPULATION")!;
    const next = confirmResearchProjectContribution({ contribution: c, current: prior, projectId: prior.projectId, authority: behaviorAuthority,
      confirmedAt: at, reviewedProjection: candidate.humanReviewProjection, selectedChangeRefs: [pop.changeRef] });
    expect(contents(next)).toEqual(["Population 35–85 ans"]);
    const session = { ...createFunctionalResetSession(), project: next, projectId: next.projectId };
    persistFunctionalResetSession(localStorage, session);
    expect(contents(loadFunctionalResetSession(localStorage, undefined, true)!.project)).toEqual(contents(next));
  });
});

describe("Standard product handler — same USER turn through existing bridge", () => {
  const open = (f: ReturnType<typeof make>, extra: Partial<FunctionalResetSession> = {}) => {
    language.mockImplementation(async (request: LanguageProjectionRequest) => {
      // Existing qualified gateway boundary: local synthetic receipt, no network.
      const invariants = evaluateLinguisticInvariants(request.sourceText, request.sourceText);
      const projection = materializeLanguageProjectionArtifact({ request, provider: "OPENAI", model: "LOCAL_SYNTHETIC_NO_LIVE",
        providerResponseId: "LOCAL_SYNTHETIC_NO_LIVE", createdAt: at, result: {
          detectedLanguage: "fr", supportStatus: "SUPPORTED", qualificationStatus: "QUALIFIED", translatedText: request.sourceText,
          translatedTextLanguage: "fr", ambiguityPreserved: true, limitations: [],
          semanticInvariants: (["NEGATION", "UNCERTAINTY", "CONDITIONALITY", "COMPARISON", "TEMPORAL_RELATION"] as const).map(invariantId => {
            const check = invariants.find(item => item.invariant === invariantId)!;
            return { invariantId, attestationStatus: "ATTESTED", sourcePresent: check.status !== "NOT_PRESENT", preserved: check.status === "PRESERVED",
              sourceEvidence: check.sourceEvidence, targetEvidence: check.targetEvidence };
          }),
        } });
      return { apiVersion: "1.0.0", projection, observability: { providerCalls: [] } };
    });
    let latest: FunctionalResetSession;
    const session = { ...createFunctionalResetSession(), conversationId: f.contribution.source.conversationId, projectAuthority: behaviorAuthority,
      projectId: "project:standard-mixed", conversationLanguageGateway: { ...createFunctionalResetSession().conversationLanguageGateway, conversationLanguage: "fr" as const }, project: f.current, pendingContribution: f.contribution, retainedContributionCandidates: [f.record], runtimeTurns: [f.turn],
      bridgeTraces: [{ entryRouting: routeProductEntry({ raw: f.turn.content, sourceTurnRef: f.turn.turnId, routedAt: at }) } as ProductBridgeTrace],
      entries: [{ entryId: "review:initial", kind: "REVIEW" as const, role: "NOXIA" as const, contribution: f.contribution, candidate: f.candidate, status: "PENDING" as const, createdAt: at }], ...extra };
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={value => { latest = value; }} /></HelmetProvider>);
    return () => latest!;
  };
  const send = (raw: string) => { fireEvent.change(screen.getByRole("textbox"), { target: { value: raw } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };
  it("adopts only J0/J1 and executes existing bridge once for pending M12", async () => {
    const network = vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); }); vi.stubGlobal("fetch", network);
    bridge.mockImplementation(async (r: ProductBridgeRequest) => response(r, "IRM à M12", "IRM à M12"));
    const current = open(make());
    const raw = "oui c'est ça, et on ajoute une IRM à M12";
    send(raw);
    await waitFor(() => expect(current().pendingContribution?.source.originalRequest, JSON.stringify(current().entries.filter(e => e.kind === "ERROR"))).toBe(raw));
    await waitFor(() => expect(current().retainedContributionCandidates?.at(-1)?.downstreamState).toBe("PRESENTED"));
    expect(contents(current().project).sort()).toEqual(["IRM J0", "IRM J1"]);
    expect(current().runtimeTurns.filter(turn => turn.role === "USER" && turn.content === raw)).toHaveLength(1);
    expect(current().entries.filter(entry => entry.kind === "TEXT" && entry.role === "USER" && entry.content === raw)).toHaveLength(1);
    expect(current().conversationLanguageGateway.turns.filter(turn => turn.originalText === raw)).toHaveLength(1);
    expect(bridge).toHaveBeenCalledTimes(1);
    expect((bridge.mock.calls[0]![0] as ProductBridgeRequest).currentProject!.revision).toBe(1);
    expect(current().pendingMixedUserTurnRef).toBeNull();
    expect(network).not.toHaveBeenCalled();
  });
  it("material correction prepares M3, supersedes J3 and leaves Project untouched", async () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("LIVE_FORBIDDEN"); }));
    bridge.mockImplementation(async (r: ProductBridgeRequest) => response(r, "IRM M3", "à M3"));
    const current = open(make(["IRM J3"]));
    send("oui mais finalement à M3");
    await waitFor(() => expect(current().entries.filter(e => e.kind === "ERROR").map(e => e.content)).toEqual([]));
    await waitFor(() => expect(bridge.mock.calls.length, JSON.stringify(current().entries.filter(e => e.kind === "TEXT" || e.kind === "ERROR").map(e => e.content))).toBe(1));
    await waitFor(() => expect(current().pendingContribution?.source.originalRequest).toBe("oui mais finalement à M3"));
    expect(current().project).toBeNull();
    expect(current().retainedContributionCandidates?.[0]?.actuality).toBe("SUPERSEDED");
    expect(current().retainedContributionCandidates?.[0]?.humanDecision).toBeNull();
    expect(current().retainedContributionCandidates?.at(-1)?.candidate.humanReviewProjection.sections.flatMap(section => section.items.map(item => item.content)).join(" | ")).toBe("IRM M3 — formulation d’origine : à M3");
  });
  it("scoped refusal retains and presents the unmentioned sibling without bridge", async () => {
    const current = open(make(["Analyse avec seuil", "IRM M12"], ["ANALYSIS", "OBJECTIVE"]));
    send("je retire l'analyse avec seuil, le reste reste comme avant");
    await waitFor(() => expect(current().retainedContributionCandidates).toHaveLength(2));
    await waitFor(() => expect(current().retainedContributionCandidates?.at(-1)?.downstreamState).toBe("PRESENTED"));
    expect(current().project).toBeNull();
    expect(screen.getAllByText(/En attente/).length).toBeGreaterThan(0);
    expect(bridge).not.toHaveBeenCalled();
    expect(current().pendingContribution?.scientificContent.candidateObjects.map(item => item.content)).toEqual(["IRM M12"]);
  });
  it("reload resumes a saved mixed turn without duplicating its original message or decision", async () => {
    const f = make();
    const first = decide("oui c'est ça, et on ajoute une IRM à M12", f);
    const saved: FunctionalResetSession = { ...createFunctionalResetSession(), conversationId: f.contribution.source.conversationId,
      project: first.project, projectId: first.project!.projectId, projectAuthority: behaviorAuthority,
      conversationLanguageGateway: { ...createFunctionalResetSession().conversationLanguageGateway, conversationLanguage: "fr" },
      runtimeTurns: [f.turn, first.user], retainedContributionCandidates: first.retained, pendingMixedUserTurnRef: first.user.turnId,
      bridgeTraces: [{ entryRouting: routeProductEntry({ raw: f.turn.content, sourceTurnRef: f.turn.turnId, routedAt: at }) } as ProductBridgeTrace],
      entries: [{ entryId: "human:saved", kind: "TEXT", role: "USER", content: first.user.content, createdAt: at }] };
    persistFunctionalResetSession(localStorage, saved);
    const loaded = loadFunctionalResetSession(localStorage, undefined, true)!;
    bridge.mockImplementation(async (r: ProductBridgeRequest) => response(r, "IRM à M12", "IRM à M12"));
    const current = open(f, loaded);
    await waitFor(() => expect(current().pendingContribution?.source.originalRequest).toBe(first.user.content));
    expect(current().project?.revision).toBe(1);
    expect(current().runtimeTurns.filter(turn => turn.turnId === first.user.turnId)).toHaveLength(1);
    expect(bridge).toHaveBeenCalledTimes(1);
    expect(current().pendingMixedUserTurnRef).toBeNull();
  });
});
