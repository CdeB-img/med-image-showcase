import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_CONTRACT,
  createPreProjectScientificTraceSegment,
  type PreProjectScientificTracePoint,
  type PreProjectTraceDimensionProbe,
} from "@/features/protocol-designer/scientific-execution-trace";
import { routeProductEntry } from "../product-entry-routing";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import { makeFunctionalResetBridgeResponse } from "./functional-reset-fixtures";

const HUMAN_FIRST_TURN = "Je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";

const VISIBLE_RESPONSE = `Je comprends que vous souhaitez explorer les atteintes myocardiques après circulation extracorporelle en comparant l'élévation de la troponine à des observations en IRM cardiaque.

Pour préciser la structure de votre étude, cherchez-vous à identifier de véritables lésions tissulaires irréversibles en rehaussement tardif, ou à quantifier des modifications globales et diffuses de la matrice extracellulaire via l'ECV ?`;

const FORMULATED_QUESTION = "Pour préciser la structure de votre étude, cherchez-vous à identifier de véritables lésions tissulaires irréversibles en rehaussement tardif, ou à quantifier des modifications globales et diffuses de la matrice extracellulaire via l'ECV ?";

const diagnosticDimensionProbes: readonly PreProjectTraceDimensionProbe[] = [{
  dimensionRef: "circulation_extracorporelle",
  expressions: ["circulation extra corporelle", "circulation extracorporelle"],
}, {
  dimensionRef: "troponine",
  expressions: ["troponine", "élévation de la troponine"],
}, {
  dimensionRef: "atteinte_myocardique",
  expressions: ["atteinte des myocites", "atteinte myocardique", "atteintes myocardiques"],
}, {
  dimensionRef: "lge",
  expressions: ["LGE", "rehaussement tardif"],
}, {
  dimensionRef: "ecv",
  expressions: ["ECV", "matrice extracellulaire"],
}, {
  dimensionRef: "contractilite",
  expressions: ["contractilité", "contractilite"],
}, {
  dimensionRef: "exploratoire_pilote",
  expressions: ["explorer", "exploratoire", "pilote"],
}, {
  dimensionRef: "decision_future_etude_importante",
  expressions: ["étude plus importante", "étude importante", "construire une étude importante"],
}];

const requestForReplay = (): Omit<ProductBridgeRequest, "apiVersion"> => ({
  requestKind: "USER_TURN",
  conversation: {
    conversationId: "scientific-conversation:p1-e2e-06r-replay",
    language: "fr",
    turns: [{
      turnId: "turn:p1-e2e-06r:first",
      role: "USER",
      content: HUMAN_FIRST_TURN,
      createdAt: "2026-08-29T10:00:00.000Z",
    }],
  },
  currentProject: null,
  evaluatePersistentDelta: false,
});

const replay = () => {
  const request = requestForReplay();
  const routing = routeProductEntry({
    raw: HUMAN_FIRST_TURN,
    sourceTurnRef: "turn:p1-e2e-06r:first",
    routedAt: "2026-08-29T10:00:00.000Z",
  });
  const requestBeforeTrace = JSON.stringify(request);
  const trace = createPreProjectScientificTraceSegment({
    captureMode: "DIAGNOSTIC_FULL",
    sessionId: "protocol-designer-session:p1-e2e-06r-replay",
    sourceTurnRef: "turn:p1-e2e-06r:first",
    sourceText: HUMAN_FIRST_TURN,
    routing,
    request,
    providerBoundary: {
      systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context: naturalConversationContext(request),
      assistantReply: VISIBLE_RESPONSE,
      provider: "GOOGLE_GEMINI",
      model: "gemini-3.5-flash-lite",
    },
    diagnosticDimensionProbes,
  });
  return { request, requestBeforeTrace, routing, trace };
};

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
  ProductBridgeClientError: class ProductBridgeClientError extends Error {},
}));

describe("P1-E2E-06R — pre-Project TRACE coverage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("replays the exact human first turn and localizes the passive boundaries without changing provider input", () => {
    const { request, requestBeforeTrace, routing, trace } = replay();
    const routingPoint = trace.points[0] as Extract<PreProjectScientificTracePoint, { sequence: 1 }>;
    const decisionPoint = trace.points[1] as Extract<PreProjectScientificTracePoint, { sequence: 2 }>;
    const whatPoint = trace.points[2] as Extract<PreProjectScientificTracePoint, { sequence: 3 }>;
    const formulationPoint = trace.points[3] as Extract<PreProjectScientificTracePoint, { sequence: 4 }>;
    const dimensions = Object.fromEntries(routingPoint.dimensionObservations.map((item) => [item.dimensionRef, item]));

    expect(trace).toMatchObject({
      contract: PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_CONTRACT,
      appendOnly: true,
      passive: true,
      readOnly: true,
      traceDecides: false,
      traceRepairs: false,
      projectWriteAuthorized: false,
      conversationMutationAuthorized: false,
      providerInputMutationAuthorized: false,
      correlation: {
        traceLedgerContract: "SCIENTIFIC_EXECUTION_TRACE_LEDGER",
        sourceTurnRef: "turn:p1-e2e-06r:first",
      },
    });
    expect(trace.points.map((point) => point.point)).toEqual([
      "POST_ENTRY_ROUTING_INTENT_DIMENSIONS",
      "ASK_VS_PROPOSE_DECISION",
      "WHAT_TO_ASK_SPECIFICATION",
      "QUESTION_FORMULATION_BOUNDARY",
    ]);
    expect(routing.routeIntent).toBe("DESIGN_STUDY");
    expect(dimensions.circulation_extracorporelle).toMatchObject({ explicitlyProvided: true, postEntryRouting: "NOT_PRESENT", providerContext: "PRESENT", assistantReply: "PRESENT", formulatedQuestion: "NOT_PRESENT" });
    expect(dimensions.troponine).toMatchObject({ explicitlyProvided: true, postEntryRouting: "NOT_PRESENT", providerContext: "PRESENT", assistantReply: "PRESENT", formulatedQuestion: "NOT_PRESENT" });
    expect(dimensions.atteinte_myocardique).toMatchObject({ explicitlyProvided: true, postEntryRouting: "NOT_PRESENT", providerContext: "PRESENT", assistantReply: "PRESENT", formulatedQuestion: "NOT_PRESENT" });
    expect(dimensions.lge).toMatchObject({ explicitlyProvided: true, postEntryRouting: "NOT_PRESENT", providerContext: "PRESENT", assistantReply: "PRESENT", formulatedQuestion: "PRESENT" });
    expect(dimensions.ecv).toMatchObject({ explicitlyProvided: true, postEntryRouting: "PRESENT", providerContext: "PRESENT", assistantReply: "PRESENT", formulatedQuestion: "PRESENT" });
    expect(dimensions.contractilite).toMatchObject({ explicitlyProvided: true, postEntryRouting: "NOT_PRESENT", providerContext: "PRESENT", assistantReply: "NOT_PRESENT", formulatedQuestion: "NOT_PRESENT" });
    expect(dimensions.exploratoire_pilote).toMatchObject({ explicitlyProvided: true, postEntryRouting: "NOT_PRESENT", providerContext: "PRESENT", assistantReply: "PRESENT", formulatedQuestion: "NOT_PRESENT" });
    expect(dimensions.decision_future_etude_importante).toMatchObject({ explicitlyProvided: false, postEntryRouting: "NOT_EXPLICITLY_PROVIDED", providerContext: "NOT_EXPLICITLY_PROVIDED", assistantReply: "NOT_EXPLICITLY_PROVIDED", formulatedQuestion: "NOT_EXPLICITLY_PROVIDED" });

    expect(decisionPoint).toMatchObject({
      action: "ASK_QUESTION",
      owner: "GEMINI_CONVERSATION_MODEL",
      justification: null,
      justificationStatus: "NOT_EXPOSED_BY_CURRENT_RUNTIME",
      valueOfInformation: null,
      valueOfInformationStatus: "NOT_AVAILABLE",
      explicitlyProvidedInformation: [HUMAN_FIRST_TURN],
    });
    expect(whatPoint).toMatchObject({
      owner: "GEMINI_CONVERSATION_MODEL",
      informationSought: FORMULATED_QUESTION,
      scientificJustification: null,
      dimensionsRetained: ["lge", "ecv"],
      specificationStatus: "INFERRED_POST_HOC_FROM_LLM_QUESTION",
    });
    expect(whatPoint.dimensionsDiscarded).toEqual(expect.arrayContaining([
      "circulation_extracorporelle",
      "troponine",
      "atteinte_myocardique",
      "contractilite",
      "exploratoire_pilote",
    ]));
    expect(Object.values(whatPoint.discardReasons)).toEqual(expect.arrayContaining([null]));
    expect(formulationPoint).toMatchObject({
      owner: "GEMINI_CONVERSATION_MODEL",
      whatExactTransmittedToLlm: null,
      formulatedQuestion: FORMULATED_QUESTION,
      assistantReply: VISIBLE_RESPONSE,
      provider: "GOOGLE_GEMINI",
      model: "gemini-3.5-flash-lite",
    });
    expect(formulationPoint.contextTransmittedToLlm).toContain(HUMAN_FIRST_TURN);
    expect(formulationPoint.formulatedQuestion).toMatch(/rehaussement tardif, ou .*ECV/u);
    expect(JSON.stringify(request)).toBe(requestBeforeTrace);
  });

  it("distinguishes an explicit QRY-owned WHAT from Gemini-owned formulation", () => {
    const request = requestForReplay();
    request.requestKind = "POST_ADOPTION_QRY_CONTINUATION";
    request.conversation.interactionContext = {
      interactionRef: "qry-presentation:test",
      sourceActionRef: "qry-action:test",
      owner: "QUERY_NAVIGATION",
      purpose: "Clarifier la fenêtre temporelle qui conditionne l'acquisition.",
      expectedResponseKind: "QRY_INFORMATION_RESPONSE",
      targetRefs: ["project:test:acquisition"],
      informationNeedRefs: ["information-need:test:timing"],
      projectRef: "project:test",
      projectVersion: "project:test:v1",
      projectDigest: "project:test:digest",
    };
    const routing = routeProductEntry({
      raw: HUMAN_FIRST_TURN,
      sourceTurnRef: "turn:p1-e2e-06r:first",
      routedAt: "2026-08-29T10:00:00.000Z",
    });
    const reply = "À quelle fenêtre temporelle souhaitez-vous réaliser l'acquisition ?";
    const trace = createPreProjectScientificTraceSegment({
      captureMode: "DIAGNOSTIC_FULL",
      sessionId: "protocol-designer-session:p1-e2e-06r-qry-contract",
      sourceTurnRef: "turn:p1-e2e-06r:first",
      sourceText: HUMAN_FIRST_TURN,
      routing,
      request,
      providerBoundary: {
        systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
        context: naturalConversationContext(request),
        assistantReply: reply,
        provider: "GOOGLE_GEMINI",
        model: "gemini-3.5-flash-lite",
      },
    });
    expect(trace.points[1]).toMatchObject({
      point: "ASK_VS_PROPOSE_DECISION",
      owner: "QUERY_NAVIGATION",
      justification: request.conversation.interactionContext.purpose,
      justificationStatus: "EXPLICIT_QRY_PURPOSE",
    });
    expect(trace.points[2]).toMatchObject({
      point: "WHAT_TO_ASK_SPECIFICATION",
      owner: "QUERY_NAVIGATION",
      scientificJustification: request.conversation.interactionContext.purpose,
      specificationStatus: "EXPLICIT_QRY_SPECIFICATION",
    });
    expect(trace.points[3]).toMatchObject({
      point: "QUESTION_FORMULATION_BOUNDARY",
      owner: "GEMINI_CONVERSATION_MODEL",
      whatExactTransmittedToLlm: request.conversation.interactionContext.purpose,
      formulatedQuestion: reply,
    });
  });

  it("persists the correlated segment while the later QRY repair changes only the visible pre-Project realization", async () => {
    runtime.request.mockImplementation(async ({ conversation }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      null,
      VISIBLE_RESPONSE,
    ));
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: HUMAN_FIRST_TURN } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByText(/premi[èe]re compr[ée]hension structur[ée]e/u)).toBeInTheDocument();
    expect(screen.queryByText(/cherchez-vous à identifier de véritables lésions/u)).toBeNull();
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);
      expect(stored.bridgeTraces).toHaveLength(1);
      expect(stored.bridgeTraces[0].preProjectTrace).toMatchObject({
        contract: PRE_PROJECT_SCIENTIFIC_TRACE_SEGMENT_CONTRACT,
        appendOnly: true,
        passive: true,
        projectWriteAuthorized: false,
        conversationMutationAuthorized: false,
        providerInputMutationAuthorized: false,
      });
      expect(stored.project).toBeNull();
      expect(stored.queryNavigation).toBeNull();
      expect(stored.runtimeTurns[0].content).toBe(HUMAN_FIRST_TURN);
      expect(stored.runtimeTurns[1].content).toMatch(/premi[èe]re compr[ée]hension structur[ée]e/iu);
      expect(stored.bridgeTraces[0].preProjectTrace.points[1]).toMatchObject({
        point: "ASK_VS_PROPOSE_DECISION",
        action: "PROPOSE",
        owner: "QUERY_NAVIGATION",
      });
    });
    expect(runtime.request).toHaveBeenCalledTimes(1);
  });
});
