import { describe, expect, it } from "vitest";
import {
  authorizeResearchProjectDocumentHandoff,
  ensureCanonicalProjectState,
  mergeInitialResearchProjectContributions,
  prepareResearchProjectContributionCandidate,
  sectionForContributionItem,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  createEmptyFunctionalResetDocumentPortfolio,
  refreshFunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import {
  buildFunctionalResetQueryNavigation,
  buildPreProjectNavigationDecision,
  deferFunctionalResetQueryNavigation,
  realizePreProjectNavigationDecision,
  recordFunctionalResetQueryResponse,
} from "@/features/query-navigation";
import {
  buildPreProjectTraceRealizationOutcome,
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  recordPreProjectScientificTraceSegment,
} from "@/features/protocol-designer/scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import { routeProductEntry } from "../product-entry-routing";
import {
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";
import {
  P1_BEHAVIORAL_CONTRACTS,
  adoptBehaviorContribution,
  behaviorAuthority,
  behaviorContribution,
  behaviorItem,
  behaviorTurn,
  richStudyContribution,
  type BehavioralContractId,
} from "./p1-behavior-01a-contract-fixtures";

const AT = "2026-08-31T14:00:00.000Z";

const contractFor = (id: BehavioralContractId) => {
  const contract = P1_BEHAVIORAL_CONTRACTS.find((candidate) => candidate.id === id);
  expect(contract, `missing contract ${id}`).toBeDefined();
  expect(contract).toMatchObject({
    precondition: expect.any(String),
    userAction: expect.any(String),
    mustPreserve: expect.any(Array),
    mayInterpret: expect.any(Array),
    mustNotInvent: expect.any(Array),
    expectedQryAction: expect.any(String),
    expectedVisibleBehavior: expect.any(Array),
    expectedCandidateEffect: expect.any(String),
    expectedProjectEffect: expect.any(String),
    humanGate: expect.any(String),
    expectedTraceFacts: expect.any(Array),
    expectedDocumentEffect: expect.any(String),
    deterministicAssertions: expect.any(Array),
    humanOnlyAssertions: expect.any(Array),
  });
  return contract!;
};

const routed = (raw: string, id: string) => {
  const sourceTurnRef = `turn:p1-behavior-01a:${id}`;
  const routing = routeProductEntry({ raw, sourceTurnRef, routedAt: AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const realization = realizePreProjectNavigationDecision({
    decision,
    structuredUnderstanding: {
      source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
      visibleToUser: true,
      representedDimensionRefs: routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
      projectWriteAuthorized: false,
    },
  });
  return { sourceTurnRef, routing, decision, realization };
};

const revisedContribution = (input: {
  id: string;
  current: ReturnType<typeof richStudyContribution>;
  turnText: string;
  candidateObjects: ReturnType<typeof richStudyContribution>["scientificContent"]["candidateObjects"];
  unknowns?: ReturnType<typeof richStudyContribution>["scientificContent"]["unknowns"];
  negations?: ReturnType<typeof richStudyContribution>["scientificContent"]["negationsAndConstraints"];
  corrections?: ReturnType<typeof richStudyContribution>["scientificContent"]["correctionsAndSupersessions"];
}) => {
  const turn = behaviorTurn(`turn:p1-behavior-01a:${input.id}`, input.turnText);
  return behaviorContribution({
    contributionId: `contribution:p1-behavior-01a:${input.id}`,
    previousContributionId: input.current.identity.contributionId,
    turns: [...input.current.source.turns, turn],
    candidateObjects: input.candidateObjects,
    temporalElements: input.current.scientificContent.temporalElements,
    relations: input.current.scientificContent.candidateRelations,
    unknowns: input.unknowns,
    negations: input.negations,
    corrections: input.corrections,
  });
};

const currentContents = (project: ResearchProjectOwnerProjection) => project.sections
  .flatMap((section) => section.elements.map((element) => element.content));

describe("P1-BEHAVIOR-01A — executable behavioral contract", () => {
  it("freezes exactly the generic B01–B20 transition inventory", () => {
    expect(P1_BEHAVIORAL_CONTRACTS.map((contract) => contract.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
    );
    P1_BEHAVIORAL_CONTRACTS.forEach((contract) => contractFor(contract.id));
  });

  it("B01 — preserves a rich initial request in a specific governed proposal without Project write", () => {
    contractFor("B01");
    const raw = "Je veux créer une étude comparant la population A et la population B, avec l’intervention X, la méthode Y, la mesure Z et le temps T1.";
    const testCase = routed(raw, "B01");
    const candidate = prepareResearchProjectContributionCandidate(richStudyContribution(), null);
    expect(testCase.routing).toMatchObject({ routeIntent: "DESIGN_STUDY", projectConstructionEligible: true });
    expect(testCase.decision).toMatchObject({ owner: "QUERY_NAVIGATION", action: "PROPOSE", providerCalls: 0 });
    expect(testCase.realization.assistantReply).toMatch(/population A/iu);
    expect(testCase.realization.assistantReply).toMatch(/population B/iu);
    expect(testCase.realization.assistantReply).toMatch(/intervention X/iu);
    expect(testCase.realization.assistantReply).toMatch(/m[ée]thode Y/iu);
    expect(testCase.realization.assistantReply).toMatch(/mesure Z/iu);
    expect(candidate).toMatchObject({ status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION", projectWriteAuthorized: false });
  });

  it("B02 — keeps a genuinely sparse request sparse and permits the bounded generic response", () => {
    contractFor("B02");
    const testCase = routed("Je veux créer une étude.", "B02");
    expect(testCase.routing.explicitScientificDimensions).toHaveLength(1);
    expect(testCase.decision).toMatchObject({ owner: "QUERY_NAVIGATION", providerCalls: 0 });
    expect(testCase.realization.assistantReply).toBe("J’ai bien pris en compte les éléments scientifiques de votre demande. Je vous propose de les organiser dans une première compréhension structurée, que vous pourrez préciser avant toute confirmation.");
  });

  it("B03 — creates Project v1 only through an attributable human adoption", () => {
    contractFor("B03");
    const contribution = richStudyContribution();
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.projectWriteAuthorized).toBe(false);
    const project = adoptBehaviorContribution(contribution, null, 3);
    expect(project).toMatchObject({ revision: 1, previousVersionId: null, llmProjectWrites: 0 });
    expect(project.confirmationDecision).toMatchObject({ status: "ADOPTED", mandate: "PROJECT_OWNER" });
  });

  it("B04 — stages ADD and preserves the adopted Project byte-for-byte until confirmation", () => {
    contractFor("B04");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const before = JSON.stringify(project);
    const added = behaviorItem({ itemId: "outcome:q", semanticIdentity: "outcome:q", proposedType: "OUTCOME", content: "réponse Q", turnId: "turn:p1-behavior-01a:B04" });
    const contribution = revisedContribution({ id: "B04", current: initial, turnText: "J’ajoute la réponse Q.", candidateObjects: [...initial.scientificContent.candidateObjects, added] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.changes).toContainEqual(expect.objectContaining({ operation: "ADD", proposedElement: expect.objectContaining({ content: "réponse Q" }) }));
    expect(JSON.stringify(project)).toBe(before);
    expect(adoptBehaviorContribution(contribution, project, 4).revision).toBe(2);
  });

  it("B05 — stages an explicit REMOVE, retains history, and mutates only after confirmation", () => {
    contractFor("B05");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const turnId = "turn:p1-behavior-01a:B05";
    const inactive = initial.scientificContent.candidateObjects.map((item) => item.itemId === "measurement:z"
      ? behaviorItem({ itemId: item.itemId, semanticIdentity: item.semanticIdentity ?? item.itemId, proposedType: item.proposedType ?? "MEASUREMENT", content: item.content, turnId, activeState: false })
      : item);
    const removal = behaviorItem({ itemId: "correction:remove:z", semanticIdentity: "measurement:z:removal", proposedType: "CONSTRAINT", content: "retirer mesure Z", turnId, activeState: false, polarity: "NEGATED", previousItemIds: ["measurement:z"] });
    const contribution = revisedContribution({ id: "B05", current: initial, turnText: "Je retire la mesure Z.", candidateObjects: inactive, negations: [removal], corrections: [removal] });
    const before = JSON.stringify(project);
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.changes).toContainEqual(expect.objectContaining({ operation: "REMOVE", previousElement: expect.objectContaining({ content: "mesure Z" }) }));
    expect(JSON.stringify(project)).toBe(before);
    const changed = adoptBehaviorContribution(contribution, project, 5);
    expect(currentContents(changed)).not.toContain("mesure Z");
    expect(ensureCanonicalProjectState(changed).objects.some((item) => item.content === "mesure Z" && item.actuality === "SUPERSEDED")).toBe(true);
  });

  it("B06 — re-adds one current semantic identity after an explicit removal", () => {
    contractFor("B06");
    const initial = richStudyContribution();
    const projectV1 = adoptBehaviorContribution(initial, null, 3);
    const removalTurnId = "turn:p1-behavior-01a:B06-remove";
    const removedObjects = initial.scientificContent.candidateObjects.map((item) => item.itemId === "measurement:z"
      ? behaviorItem({ itemId: item.itemId, semanticIdentity: item.semanticIdentity ?? item.itemId, proposedType: item.proposedType ?? "MEASUREMENT", content: item.content, turnId: removalTurnId, activeState: false })
      : item);
    const removalMarker = behaviorItem({ itemId: "correction:remove:z:B06", semanticIdentity: "measurement:z:removal", proposedType: "CONSTRAINT", content: "retirer mesure Z", turnId: removalTurnId, activeState: false, polarity: "NEGATED", previousItemIds: ["measurement:z"] });
    const removal = revisedContribution({ id: "B06-remove", current: initial, turnText: "Je retire la mesure Z.", candidateObjects: removedObjects, negations: [removalMarker], corrections: [removalMarker] });
    const projectV2 = adoptBehaviorContribution(removal, projectV1, 5);
    const readdedItem = behaviorItem({ itemId: "measurement:z:readded", semanticIdentity: "measurement:z", proposedType: "MEASUREMENT", content: "mesure Z", turnId: "turn:p1-behavior-01a:B06", previousItemIds: ["measurement:z"] });
    const readded = revisedContribution({ id: "B06", current: removal, turnText: "Je réintroduis la mesure Z.", candidateObjects: [...initial.scientificContent.candidateObjects.filter((item) => item.itemId !== "measurement:z"), readdedItem] });
    const candidate = prepareResearchProjectContributionCandidate(readded, projectV2);
    expect(candidate.changeSet.changes).toContainEqual(expect.objectContaining({ operation: "ADD", proposedElement: expect.objectContaining({ content: "mesure Z" }) }));
    const projectV3 = adoptBehaviorContribution(readded, projectV2, 6);
    expect(currentContents(projectV3).filter((content) => content === "mesure Z")).toHaveLength(1);
  });

  it("B07 — represents a correction as REPLACE with one current value", () => {
    contractFor("B07");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const turnId = "turn:p1-behavior-01a:B07";
    const replacement = behaviorItem({ itemId: "measurement:z2", semanticIdentity: "measurement:z", proposedType: "MEASUREMENT", content: "mesure Z2", turnId, previousItemIds: ["measurement:z"] });
    const objects = initial.scientificContent.candidateObjects
      .map((item) => item.itemId === "measurement:z" ? { ...item, epistemicBoundary: { ...item.epistemicBoundary, activeState: false } } : item)
      .concat(replacement);
    const correction = behaviorItem({ itemId: "correction:z2", semanticIdentity: "measurement:z:replacement", proposedType: "MEASUREMENT", content: "remplacer mesure Z par mesure Z2", turnId, previousItemIds: ["measurement:z"] });
    const contribution = revisedContribution({ id: "B07", current: initial, turnText: "Correction : utilisez mesure Z2 plutôt que mesure Z.", candidateObjects: objects, corrections: [correction] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.changes).toContainEqual(expect.objectContaining({ operation: "REPLACE", previousElement: expect.objectContaining({ content: "mesure Z" }), proposedElement: expect.objectContaining({ content: "mesure Z2" }) }));
    const changed = adoptBehaviorContribution(contribution, project, 7);
    expect(currentContents(changed)).toContain("mesure Z2");
    expect(currentContents(changed)).not.toContain("mesure Z");
  });

  it("B08 — preserves every coherent change in one review bundle", () => {
    contractFor("B08");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const turnId = "turn:p1-behavior-01a:B08";
    const additions = [
      behaviorItem({ itemId: "outcome:q", proposedType: "OUTCOME", content: "réponse Q", turnId }),
      behaviorItem({ itemId: "measure:r", proposedType: "MEASUREMENT", content: "mesure R", turnId }),
      behaviorItem({ itemId: "time:t2", proposedType: "TIMEPOINT", content: "temps T2", turnId }),
    ];
    const contribution = revisedContribution({ id: "B08", current: initial, turnText: "Ajoutez réponse Q, mesure R et temps T2.", candidateObjects: [...initial.scientificContent.candidateObjects, ...additions.slice(0, 2)] });
    contribution.scientificContent.temporalElements.push(additions[2]);
    const before = JSON.stringify(project);
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE")).toHaveLength(3);
    expect(candidate.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("B09 — records a partial answer while keeping the unsupplied value UNKNOWN", () => {
    contractFor("B09");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const turnId = "turn:p1-behavior-01a:B09";
    const supplied = behaviorItem({ itemId: "population:criterion:a", proposedType: "ELIGIBILITY_CRITERION", content: "critère A", turnId });
    const unknown = behaviorItem({ itemId: "population:criterion:b", proposedType: "ELIGIBILITY_CRITERION", content: "critère B à définir", turnId, epistemicState: "UNKNOWN", epistemicStatus: "UNKNOWN_MISSING_INFORMATION" });
    const contribution = revisedContribution({ id: "B09", current: initial, turnText: "Je retiens le critère A, je ne sais pas encore pour B.", candidateObjects: [...initial.scientificContent.candidateObjects, supplied], unknowns: [unknown] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.proposedSections.flatMap((section) => section.elements.map((element) => element.content))).toContain("critère A");
    expect(candidate.proposedSections.flatMap((section) => section.elements.map((element) => element.content))).not.toContain("critère B à définir");
    expect(contribution.scientificContent.unknowns).toContainEqual(expect.objectContaining({ content: "critère B à définir", epistemicBoundary: expect.objectContaining({ epistemicState: "UNKNOWN" }) }));
  });

  it("B10 — routes ‘je ne sais pas’ as a deferral and avoids immediately repeating the same QRY action", () => {
    contractFor("B10");
    const project = adoptBehaviorContribution(richStudyContribution(), null, 3);
    const first = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(first.currentAction).not.toBeNull();
    const answered = recordFunctionalResetQueryResponse({ navigation: first, rawResponse: "Je ne sais pas.", actorRef: "researcher", actorRole: "PROJECT_OWNER", receivedAt: AT, responseId: "response:B10" });
    const deferred = deferFunctionalResetQueryNavigation({ navigation: answered, reason: "USER_DOES_NOT_KNOW", recordedAt: AT });
    const next = buildFunctionalResetQueryNavigation({ project, previous: deferred, recordedAt: AT, forceRebuild: true });
    expect(deferred.memory.events).toContainEqual(expect.objectContaining({ eventType: "ACTION_DEFERRED", reason: "USER_DOES_NOT_KNOW" }));
    expect(next.currentAction?.selectedActionId ?? null).not.toBe(first.currentAction?.selectedActionId ?? null);
    expect(project.revision).toBe(1);
  });

  it.todo("B11 — NO / NOT_APPLICABLE / UNKNOWN / REFUSE_TO_ANSWER require a common end-to-end product representation before this contract can execute");

  it("B12 — selects the next useful QRY action without granting a Project write", () => {
    contractFor("B12");
    const project = adoptBehaviorContribution(richStudyContribution(), null, 3);
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(navigation).toMatchObject({ owner: "QUERY_NAVIGATION", projectWriteAuthorized: false, projectionOnly: true });
    expect(navigation.standardQuestion?.choosesScientificScope ?? false).toBe(false);
    expect(navigation.currentAction?.reason).toBeTruthy();
  });

  it("B13 — correction before first adoption supersedes the earlier interpretation instead of accumulating both", () => {
    contractFor("B13");
    const firstTurn = behaviorTurn("turn:p1-behavior-01a:B13:first", "La mesure cible est la valeur A.");
    const firstItem = behaviorItem({ itemId: "measurement:target:a", semanticIdentity: "measurement:target", proposedType: "MEASUREMENT", content: "valeur A", turnId: firstTurn.turnId });
    const first = behaviorContribution({ contributionId: "contribution:p1-behavior-01a:B13:first", turns: [firstTurn], candidateObjects: [firstItem] });
    const correctionTurn = behaviorTurn("turn:p1-behavior-01a:B13:correction", "Correction : ce n’est pas la valeur A, mais la valeur B.");
    const replacement = behaviorItem({ itemId: "measurement:target:b", semanticIdentity: "measurement:target", proposedType: "MEASUREMENT", content: "valeur B", turnId: correctionTurn.turnId, previousItemIds: [firstItem.itemId] });
    const correction = behaviorItem({ itemId: "correction:target:b", semanticIdentity: "measurement:target:correction", proposedType: "MEASUREMENT", content: "remplacer valeur A par valeur B", turnId: correctionTurn.turnId, previousItemIds: [firstItem.itemId] });
    const latest = behaviorContribution({ contributionId: "contribution:p1-behavior-01a:B13:correction", previousContributionId: first.identity.contributionId, turns: [correctionTurn], candidateObjects: [replacement], corrections: [correction] });
    const merged = mergeInitialResearchProjectContributions(first, latest);
    const candidate = prepareResearchProjectContributionCandidate(merged, null);
    const visible = candidate.proposedSections.flatMap((section) => section.elements.map((element) => element.content));
    expect(visible).toContain("valeur B");
    expect(visible).not.toContain("valeur A");
    expect(merged.identity.previousContributionId).toBe(first.identity.contributionId);
  });

  it("B14 — provider rejection and local fallback remain explicit in final TRACE facts", () => {
    contractFor("B14");
    const raw = "Je veux créer une étude comparant la population A et la population B avec la méthode Y.";
    const testCase = routed(raw, "B14");
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "D’accord.",
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_FIXTURE",
    });
    expect(realization).toMatchObject({ providerReplyAccepted: false, executor: "LOCAL_DETERMINISTIC_REALIZATION", conformanceReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH" });
    const traceRunId = createProductTraceRunId("session:p1-behavior-01a", testCase.sourceTurnRef);
    const request: Omit<ProductBridgeRequest, "apiVersion"> = {
      requestKind: "USER_TURN",
      conversation: { conversationId: "conversation:p1-behavior-01a", language: "fr", turns: [{ turnId: testCase.sourceTurnRef, role: "USER", content: raw, createdAt: AT }] },
      currentProject: null,
      evaluatePersistentDelta: testCase.routing.projectConstructionEligible,
      preProjectNavigation: testCase.decision,
    };
    const segment = createPreProjectScientificTraceSegment({
      sessionId: "session:p1-behavior-01a",
      sourceTurnRef: testCase.sourceTurnRef,
      traceRunId,
      sourceText: raw,
      routing: testCase.routing,
      request,
      providerBoundary: {
        systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
        context: naturalConversationContext(request),
        assistantReply: realization.assistantReply,
        provider: realization.provider,
        model: realization.model,
        formulationOwner: "LOCAL_RUNTIME",
        realizationOutcome: buildPreProjectTraceRealizationOutcome({
          attemptedProvider: "GOOGLE_GEMINI",
          providerReply: "D’accord.",
          realization,
        }),
      },
      captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC" }),
    });
    const ledger = recordPreProjectScientificTraceSegment({
      ledger: createScientificExecutionTraceLedger("session:p1-behavior-01a"),
      traceRunId,
      conversationId: "conversation:p1-behavior-01a",
      segment,
      observedAt: AT,
    }).ledger;
    const finalEvent = buildTraceInspectorRunProjection({ ledger, traceRunId }).events.find((event) => event.stage === "QUESTION_REALIZED") as unknown as Record<string, unknown>;
    expect(finalEvent).toMatchObject({
      providerResponseReceived: true,
      providerResponseAccepted: false,
      providerRejectionReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
      fallbackReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
    });
  });

  it("B15 — preserves scientific category fidelity instead of classifying sample collection as imaging", () => {
    contractFor("B15");
    const turn = behaviorTurn("turn:p1-behavior-01a:B15", "Je prévois une collecte de matériau B.");
    const collection = behaviorItem({ itemId: "sample:collection:b", proposedType: "ACQUISITION", studyRole: "SAMPLE_COLLECTION", content: "collecte de matériau B", turnId: turn.turnId });
    const contribution = behaviorContribution({ contributionId: "contribution:p1-behavior-01a:B15", turns: [turn], candidateObjects: [collection] });
    expect(sectionForContributionItem(collection, contribution)).not.toBe("IMAGING");
  });

  it("B16 — keeps the adopted Project as living view while a distinct change remains pending review", () => {
    contractFor("B16");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const addition = behaviorItem({ itemId: "outcome:q", proposedType: "OUTCOME", content: "réponse Q", turnId: "turn:p1-behavior-01a:B16" });
    const contribution = revisedContribution({ id: "B16", current: initial, turnText: "Ajoutez la réponse Q.", candidateObjects: [...initial.scientificContent.candidateObjects, addition] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(project.revision).toBe(1);
    expect(currentContents(project)).not.toContain("réponse Q");
    expect(candidate.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join(" ")).toMatch(/r[ée]ponse Q/iu);
    expect(candidate.projectWriteAuthorized).toBe(false);
  });

  it("B17 — persists and reloads the exact Project, pending candidate, QRY and document continuity", () => {
    contractFor("B17");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const candidate = richStudyContribution();
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const session = { ...createFunctionalResetSession(AT), project, pendingContribution: candidate, currentContribution: candidate, queryNavigation: navigation };
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key), clear: () => values.clear(), key: (index: number) => [...values.keys()][index] ?? null, get length() { return values.size; } } as Storage;
    persistFunctionalResetSession(storage, session);
    const reloaded = loadFunctionalResetSession(storage);
    expect(reloaded.project).toMatchObject({ versionId: project.versionId, projectDigest: project.projectDigest });
    expect(reloaded.pendingContribution?.identity.contributionId).toBe(candidate.identity.contributionId);
    expect(reloaded.queryNavigation?.sourceStateDigest).toBe(navigation.sourceStateDigest);
    expect(reloaded.documents).toEqual(session.documents);
  });

  it("B18 — marks an existing protocol projection STALE after an adopted Project version change", () => {
    contractFor("B18");
    const initial = richStudyContribution();
    const projectV1 = adoptBehaviorContribution(initial, null, 3);
    const handoff = authorizeResearchProjectDocumentHandoff({ project: projectV1, authority: behaviorAuthority, confirmedAt: AT });
    const current = refreshFunctionalResetDocumentPortfolio({ project: projectV1, previous: createEmptyFunctionalResetDocumentPortfolio(), handoffDecision: handoff, requestedAt: AT, generateProtocol: true });
    expect(current.cards.find((card) => card.kind === "PROTOCOL")?.freshness).toBe("CURRENT");
    const addition = behaviorItem({ itemId: "outcome:q", proposedType: "OUTCOME", content: "réponse Q", turnId: "turn:p1-behavior-01a:B18" });
    const contribution = revisedContribution({ id: "B18", current: initial, turnText: "Ajoutez la réponse Q.", candidateObjects: [...initial.scientificContent.candidateObjects, addition] });
    const projectV2 = adoptBehaviorContribution(contribution, projectV1, 18);
    const stale = refreshFunctionalResetDocumentPortfolio({ project: projectV2, previous: current, requestedAt: AT });
    expect(stale.cards.find((card) => card.kind === "PROTOCOL")).toMatchObject({ freshness: "STALE", sourceProjectVersion: projectV1.versionId });
    expect(stale.projections.at(-1)?.source.projectVersion).toBe(projectV1.versionId);
  });

  it("B19 — keeps review, adopted Project, and current document bound to their explicit source versions", () => {
    contractFor("B19");
    const initial = richStudyContribution();
    const candidate = prepareResearchProjectContributionCandidate(initial, null);
    const project = adoptBehaviorContribution(initial, null, 3);
    const handoff = authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: AT });
    const portfolio = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision: handoff, requestedAt: AT, generateProtocol: true });
    expect(candidate.contributionRef).toBe(initial.identity.contributionId);
    expect(project.contributionRef).toBe(initial.identity.contributionId);
    expect(portfolio.projections.at(-1)?.source).toMatchObject({ projectVersion: project.versionId, projectDigest: project.projectDigest });
    expect(candidate.projectWriteAuthorized).toBe(false);
  });

  it("B20 — shared invariant: no candidate, QRY projection, or document inspection silently writes Project", () => {
    contractFor("B20");
    const initial = richStudyContribution();
    const project = adoptBehaviorContribution(initial, null, 3);
    const before = JSON.stringify(project);
    const additions = ["alpha", "beta", "gamma"].map((content, index) => behaviorItem({ itemId: `measure:${content}`, proposedType: "MEASUREMENT", content, turnId: `turn:p1-behavior-01a:B20:${index}` }));
    const variants = additions.map((addition, index) => revisedContribution({ id: `B20-${index}`, current: initial, turnText: `Ajoutez ${addition.content}.`, candidateObjects: [...initial.scientificContent.candidateObjects, addition] }));
    const candidates = variants.map((contribution) => prepareResearchProjectContributionCandidate(contribution, project));
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    const documents = refreshFunctionalResetDocumentPortfolio({ project, previous: createEmptyFunctionalResetDocumentPortfolio(), requestedAt: AT });
    expect(candidates.every((candidate) => candidate.projectWriteAuthorized === false)).toBe(true);
    expect(navigation.projectWriteAuthorized).toBe(false);
    expect(documents.owner).toBe("DOC-001");
    expect(JSON.stringify(project)).toBe(before);
  });
});
