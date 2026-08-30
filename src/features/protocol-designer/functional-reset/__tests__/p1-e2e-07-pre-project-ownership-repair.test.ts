import { describe, expect, it } from "vitest";
import {
  buildPreProjectNavigationDecision,
  realizePreProjectNavigationDecision,
} from "@/features/query-navigation";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PRODUCT_BRIDGE_API_VERSION,
  naturalConversationContext,
  parseProductBridgeRequest,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  recordPreProjectScientificTraceSegment,
  type PreProjectTraceDimensionProbe,
} from "@/features/protocol-designer/scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture";
import { routeProductEntry } from "../product-entry-routing";

const OBSERVED_AT = "2026-08-30T00:00:00.000Z";
const SESSION_ID = "protocol-designer-session:p1-e2e-07";
const CONVERSATION_ID = "scientific-conversation:p1-e2e-07";
const CEC_INPUT = "Je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";
const HISTORICAL_CEC_RESPONSE = "Je comprends que vous souhaitez explorer les atteintes myocardiques après circulation extracorporelle en comparant l'élévation de la troponine à des observations en IRM cardiaque. Pour préciser la structure de votre étude, cherchez-vous à identifier de véritables lésions tissulaires irréversibles en rehaussement tardif, ou à quantifier des modifications globales et diffuses de la matrice extracellulaire via l'ECV ?";

const CEC_PROBES: readonly PreProjectTraceDimensionProbe[] = [
  { dimensionRef: "cec", expressions: ["circulation extra corporelle", "circulation extracorporelle"] },
  { dimensionRef: "troponin", expressions: ["troponine"] },
  { dimensionRef: "myocardial-injury", expressions: ["atteinte des myocites", "atteinte myocardique"] },
  { dimensionRef: "lge", expressions: ["rehaussement tardif", "LGE"] },
  { dimensionRef: "ecv", expressions: ["ECV"] },
  { dimensionRef: "contractility", expressions: ["contractilité", "contractilite"] },
];

const buildCase = (raw: string, caseId: string) => {
  const sourceTurnRef = `turn:p1-e2e-07:${caseId}`;
  const routing = routeProductEntry({ raw, sourceTurnRef, routedAt: OBSERVED_AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const request: Omit<ProductBridgeRequest, "apiVersion"> = {
    requestKind: "USER_TURN",
    conversation: {
      conversationId: CONVERSATION_ID,
      language: "fr",
      turns: [{ turnId: sourceTurnRef, role: "USER", content: raw, createdAt: OBSERVED_AT }],
    },
    currentProject: null,
    evaluatePersistentDelta: routing.projectConstructionEligible,
    preProjectNavigation: decision,
  };
  return { sourceTurnRef, routing, decision, request };
};

const recordCec = (input: {
  captureLevel: "LEVEL_1_CORE" | "LEVEL_2_DIAGNOSTIC";
  ledger: ReturnType<typeof createScientificExecutionTraceLedger>;
  traceRunId: string;
  replayOfTraceRunId?: string;
}) => {
  const testCase = buildCase(CEC_INPUT, input.captureLevel);
  const representedDimensionRefs = testCase.routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef);
  const realization = realizePreProjectNavigationDecision({
    decision: testCase.decision,
    providerReply: HISTORICAL_CEC_RESPONSE,
    provider: "RECORDED_NO_CALL",
    model: "RECORDED_NO_CALL",
    structuredUnderstanding: {
      source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
      visibleToUser: true,
      representedDimensionRefs,
      projectWriteAuthorized: false,
    },
  });
  const context = naturalConversationContext(testCase.request);
  const segment = createPreProjectScientificTraceSegment({
    sessionId: SESSION_ID,
    sourceTurnRef: testCase.sourceTurnRef,
    traceRunId: input.traceRunId,
    sourceText: CEC_INPUT,
    routing: testCase.routing,
    request: testCase.request,
    providerBoundary: {
      systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context,
      assistantReply: realization.assistantReply,
      provider: realization.provider,
      model: realization.model,
      formulationOwner: realization.executor === "LOCAL_DETERMINISTIC_REALIZATION" ? "LOCAL_RUNTIME" : "GEMINI_CONVERSATION_MODEL",
      visibleStructuredUnderstandingDimensionRefs: CEC_PROBES.map((probe) => probe.dimensionRef),
    },
    diagnosticDimensionProbes: CEC_PROBES,
    captureConfiguration: createScientificTraceCaptureConfiguration(input.captureLevel === "LEVEL_1_CORE" ? undefined : {
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "REPLAY_AFTER_INSUFFICIENT_TRACE",
      replayOfTraceRunId: input.replayOfTraceRunId,
    }),
  });
  const recorded = recordPreProjectScientificTraceSegment({
    ledger: input.ledger,
    traceRunId: input.traceRunId,
    conversationId: CONVERSATION_ID,
    segment,
    observedAt: OBSERVED_AT,
  });
  return { ...recorded, testCase, realization, context };
};

describe("P1-E2E-07 — pre-Project intent and next-action ownership repair", () => {
  it("preserves every explicit CEC dimension and restores the QRY WHAT / realization HOW boundary", () => {
    const empty = createScientificExecutionTraceLedger(SESSION_ID);
    const coreTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-e2e-07:cec-core");
    const diagnosticTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-e2e-07:cec-diagnostic");
    const core = recordCec({ captureLevel: "LEVEL_1_CORE", ledger: empty, traceRunId: coreTraceRunId });
    const diagnostic = recordCec({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      ledger: core.ledger,
      traceRunId: diagnosticTraceRunId,
      replayOfTraceRunId: coreTraceRunId,
    });
    const coreProjection = buildTraceInspectorRunProjection({ ledger: diagnostic.ledger, traceRunId: coreTraceRunId });
    const projection = buildTraceInspectorRunProjection({ ledger: diagnostic.ledger, traceRunId: diagnosticTraceRunId });

    expect(coreProjection.events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
      "INFORMATION_NEED_SELECTED",
      "QUESTION_REALIZATION_REQUESTED",
      "QUESTION_REALIZED",
    ]);
    expect(coreProjection.events.find((event) => event.stage === "INFORMATION_NEED_SELECTED")).toMatchObject({
      responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION",
      executor: "QUERY_NAVIGATION",
      provider: "NONE",
      status: "PROPOSE",
    });
    expect(diagnostic.testCase.decision).toMatchObject({
      owner: "QUERY_NAVIGATION",
      action: "PROPOSE",
      selectedInformationNeed: null,
      valueOfInformationGate: "NOT_APPLICABLE",
      providerCalls: 0,
    });
    expect(diagnostic.realization.providerReplyAccepted).toBe(false);
    expect(diagnostic.realization.assistantReply).not.toContain("?");
    expect(diagnostic.realization.assistantReply).toMatch(/premi[èe]re compr[ée]hension structur[ée]e/iu);
    expect(diagnostic.realization.assistantReply).not.toMatch(/Je conserve conjointement|intention scientifique r[ée]versible/iu);

    const represented = projection.events.find((event) => event.stage === "INTENT_REPRESENTED")!;
    expect(represented.semanticTransformation?.retainedDimensions.map((dimension) => dimension.dimensionId)).toEqual([
      "cec",
      "troponin",
      "myocardial-injury",
      "lge",
      "ecv",
      "contractility",
    ]);
    expect(represented.semanticTransformation?.droppedDimensions).toEqual([]);
    expect(projection.diagnostics.some((finding) => finding.code === "UNEXPLAINED_DIMENSION_LOSS")).toBe(false);
    expect(projection.diagnostics.some((finding) => finding.code === "ALREADY_PROVIDED_INFORMATION_REASKED")).toBe(false);
    expect(projection.ownerFacts).toEqual({
      askVsProposeOwner: "QUERY_NAVIGATION",
      whatToAskOwner: "QUERY_NAVIGATION",
      questionFormulationOwner: "LOCAL_RUNTIME",
      qryWhatLlmHowContract: "RESPECTED",
    });
    expect(projection.firstUnexplainedDivergenceStage).toBeNull();
    expect(diagnostic.context).toContain("Tâche actuelle gouvernée par QUERY_NAVIGATION : PROPOSE");
    expect(diagnostic.context).toContain("Informations déjà fournies");
    expect(diagnostic.testCase.request.evaluatePersistentDelta).toBe(diagnostic.testCase.routing.projectConstructionEligible);
    expect(parseProductBridgeRequest({
      ...diagnostic.testCase.request,
      apiVersion: PRODUCT_BRIDGE_API_VERSION,
    })).not.toBeNull();
    expect(parseProductBridgeRequest({
      ...diagnostic.testCase.request,
      apiVersion: PRODUCT_BRIDGE_API_VERSION,
      preProjectNavigation: { ...diagnostic.testCase.decision, owner: "GEMINI_CONVERSATION_MODEL" },
    })).toBeNull();
  });

  it.each([
    ["CASE_A", "Je veux étudier alpha + beta.", ["alpha", "beta"]],
    ["CASE_B", "Population adulte, intervention exercice supervisé, comparateur soins usuels.", ["Population adulte", "intervention exercice supervisé", "comparateur soins usuels"]],
    ["CASE_C", "Je veux analyser alpha + beta + gamma.", ["alpha", "beta", "gamma"]],
  ])("%s retains all supplied dimensions and does not overquestion", (caseId, raw, expectedDimensions) => {
    const testCase = buildCase(raw, caseId);
    const realization = realizePreProjectNavigationDecision({ decision: testCase.decision });
    const represented = testCase.routing.explicitScientificDimensions.map((dimension) => dimension.sourceText).join(" ");
    expect(testCase.decision.action).toBe("PROPOSE");
    expect(testCase.decision.owner).toBe("QUERY_NAVIGATION");
    expect(testCase.decision.selectedInformationNeed).toBeNull();
    expect(realization.assistantReply).not.toContain("?");
    expectedDimensions.forEach((dimension) => expect(represented).toContain(dimension));
    expect(testCase.decision.alreadyProvidedInformationRefs).toEqual(
      testCase.routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
    );
    expect(realization.assistantReply).not.toMatch(/Je conserve conjointement|intention scientifique r[ée]versible/iu);
  });

  it("CASE_D still asks one bounded clarification when an explicit ambiguity has material information value", () => {
    const raw = "Je veux étudier l'effet d'un traitement, mais je ne sais pas encore si la population doit être adulte ou pédiatrique.";
    const testCase = buildCase(raw, "CASE_D");
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "Préférez-vous mesurer un biomarqueur ou réaliser une IRM ?",
      provider: "RECORDED_NO_CALL",
      model: "RECORDED_NO_CALL",
    });
    const conformingRealization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "Souhaitez-vous retenir une population adulte ou pédiatrique ?",
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_NO_CALL",
    });

    expect(testCase.decision.action).toBe("ASK_QUESTION");
    expect(testCase.decision.owner).toBe("QUERY_NAVIGATION");
    expect(testCase.decision.valueOfInformationGate).toBe("PASS");
    expect(testCase.decision.expectedInformationGain).toContain("MAY_CHANGE_DECISION");
    expect(testCase.decision.selectedInformationNeed).toMatch(/population.*adulte.*p[ée]diatrique/iu);
    expect(testCase.decision.alreadyProvidedInformationRefs).not.toContain(testCase.decision.selectedInformationNeedRef);
    expect(realization.providerReplyAccepted).toBe(false);
    expect((realization.assistantReply.match(/\?/gu) ?? [])).toHaveLength(1);
    expect(realization.assistantReply).toMatch(/population.*adulte.*p[ée]diatrique/iu);
    expect(realization.assistantReply).not.toMatch(/biomarqueur|IRM/iu);
    expect(conformingRealization).toMatchObject({
      providerReplyAccepted: true,
      executor: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
    });
  });

  it("keeps product values byte-identical with TRACE construction on or off", () => {
    const testCase = buildCase("Je veux analyser alpha + beta + gamma.", "TRACE_EQUIVALENCE");
    const realization = realizePreProjectNavigationDecision({ decision: testCase.decision });
    const productBefore = JSON.stringify({ routing: testCase.routing, decision: testCase.decision, realization });
    const traceRunId = createProductTraceRunId(SESSION_ID, testCase.sourceTurnRef);
    const segment = createPreProjectScientificTraceSegment({
      sessionId: SESSION_ID,
      sourceTurnRef: testCase.sourceTurnRef,
      traceRunId,
      sourceText: "Je veux analyser alpha + beta + gamma.",
      routing: testCase.routing,
      request: testCase.request,
      providerBoundary: {
        systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
        context: naturalConversationContext(testCase.request),
        assistantReply: realization.assistantReply,
        provider: realization.provider,
        model: realization.model,
        formulationOwner: "LOCAL_RUNTIME",
      },
      captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC" }),
    });
    recordPreProjectScientificTraceSegment({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId,
      conversationId: CONVERSATION_ID,
      segment,
      observedAt: OBSERVED_AT,
    });
    expect(JSON.stringify({ routing: testCase.routing, decision: testCase.decision, realization })).toBe(productBefore);
  });
});
