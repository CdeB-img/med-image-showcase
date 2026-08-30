import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import {
  buildPreProjectNavigationDecision,
  realizePreProjectNavigationDecision,
  type PreProjectVisibleStructuredUnderstanding,
} from "@/features/query-navigation";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  recordPreProjectScientificTraceSegment,
} from "@/features/protocol-designer/scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import { routeProductEntry } from "../product-entry-routing";
import {
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const OBSERVED_AT = "2026-08-30T12:00:00.000Z";
const CEC_INPUT = "je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";
const NATURAL_CEC_RESPONSE = "Votre projet vise à explorer, après circulation extracorporelle, le lien entre l’élévation de la troponine et une atteinte myocardique en IRM. Une première structure peut réunir le rehaussement tardif, l’ECV et la contractilité, puis être précisée avec vous.";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const cecContribution = (turns: ScientificInterpretationTurn[]): ScientificInterpretationContributionEnvelope => {
  const base = makeFunctionalResetContribution(turns);
  const sourceTurnRef = turns.at(-1)!.turnId;
  const template = base.scientificContent.candidateObjects[0]!;
  const item = (itemId: string, proposedType: string, content: string, sourceText: string): ScientificContributionItem => ({
    ...template,
    itemId,
    semanticIdentity: itemId,
    proposedType,
    content,
    studyRole: null,
    evidenceRefs: [],
    previousItemIds: [],
    epistemicBoundary: {
      ...template.epistemicBoundary,
      ownership: "USER",
      epistemicStatus: "EXPLICIT_USER_STATED",
      adoptionStatus: "CANDIDATE",
      activeState: true,
      sourceTurnIds: [sourceTurnRef],
      sourceText,
    },
  });
  return {
    ...base,
    identity: {
      ...base.identity,
      contributionId: "contribution:p1-ux-restore-01:cec",
      contributionDigest: "contribution:p1-ux-restore-01:cec:digest",
    },
    scientificContent: {
      ...base.scientificContent,
      normalizedUnderstanding: "Construire une étude exploratoire de l’atteinte myocardique après circulation extracorporelle, en reliant troponine et mesures IRM.",
      candidateObjects: [
        item("design:cec-exploratory", "STUDY_DESIGN", "Étude exploratoire", "créer une étude"),
        item("goal:cec", "GOAL", "Explorer l’atteinte myocardique après circulation extracorporelle", "circulation extra corporelle"),
        item("biomarker:troponin", "BIOMARKER", "Élévation de la troponine", "troponine augmente"),
        item("condition:myocardial-injury", "CONDITION", "Atteinte myocardique", "atteinte des myocites"),
        item("modality:cmr", "MODALITY", "IRM cardiaque", "l'irm"),
        item("endpoint:lge", "ENDPOINT", "Lésions visibles en rehaussement tardif", "rehaussement tardif"),
        item("endpoint:ecv", "ENDPOINT", "Modification de l’ECV", "l'ECV"),
        item("endpoint:contractility", "ENDPOINT", "Modification de la contractilité", "contractilité"),
      ],
      explicitStatements: [],
      candidateRelations: [],
      inferredContext: [],
      contextualCandidates: [],
      temporalElements: [],
      correctionsAndSupersessions: [],
    },
  };
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);

const governedCase = (raw: string, caseId: string) => {
  const sourceTurnRef = `turn:p1-ux-restore-01:${caseId}`;
  const routing = routeProductEntry({ raw, sourceTurnRef, routedAt: OBSERVED_AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const structuredUnderstanding: PreProjectVisibleStructuredUnderstanding = {
    source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
    visibleToUser: true,
    representedDimensionRefs: routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
    projectWriteAuthorized: false,
  };
  return { sourceTurnRef, routing, decision, structuredUnderstanding };
};

describe("P1-UX-RESTORE-01 — governed first-turn restoration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async ({ conversation }: ProductBridgeRequest) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      cecContribution(conversation.turns),
      NATURAL_CEC_RESPONSE,
    ));
  });
  afterEach(cleanup);

  it.each([
    "je veux créer une étude sur X",
    "je souhaite concevoir une étude pour comparer A et B",
    "je voudrais construire une étude exploratoire",
    "nous voulons monter une étude multicentrique",
    "construisons une étude pilote",
  ])("routes explicit natural study construction to DESIGN_STUDY: %s", (raw) => {
    expect(routeProductEntry({ raw, sourceTurnRef: `turn:${raw}`, routedAt: OBSERVED_AT })).toMatchObject({
      routeIntent: "DESIGN_STUDY",
      projectConstructionEligible: true,
      projectWriteAuthorized: false,
    });
  });

  it.each([
    ["je voudrais comprendre cette étude", "UNDERSTAND"],
    ["que signifie cette étude ?", "UNDERSTAND"],
    ["je veux formaliser cette hypothèse", "FORMALIZE_IDEA"],
    ["je voudrais discuter d'une étude publiée", "UNDERSTAND"],
  ])("does not overroute a mere study mention: %s", (raw, expected) => {
    expect(routeProductEntry({ raw, sourceTurnRef: `turn:${raw}`, routedAt: OBSERVED_AT }).routeIntent).toBe(expected);
  });

  it("accepts paraphrased HOW through existing structured identities and keeps non-conformant outputs rejected", () => {
    const testCase = governedCase("Je veux créer une étude sur alpha + beta + gamma.", "conformance");
    const naturalReply = "Je vous propose d’organiser ensemble les trois axes déjà décrits afin de préparer une première structure d’étude.";
    const accepted = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: naturalReply,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_FIXTURE",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });
    const unauthorizedQuestion = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "Souhaitez-vous choisir un premier axe ?",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });
    const alteredWhat = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "Je propose de retenir uniquement le premier axe et d’écarter les autres.",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });
    const omitted = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: naturalReply,
      structuredUnderstanding: {
        ...testCase.structuredUnderstanding,
        representedDimensionRefs: testCase.structuredUnderstanding.representedDimensionRefs.slice(0, -1),
      },
    });
    const actionMismatch = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: "Même contenu visible.",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });

    expect(testCase.decision).toMatchObject({ owner: "QUERY_NAVIGATION", action: "PROPOSE" });
    expect(accepted).toMatchObject({
      providerReplyAccepted: true,
      executor: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
      assistantReply: naturalReply,
      conformanceReason: "PROVIDER_REALIZATION_CONFORMS_TO_QRY_ACTION_AND_STRUCTURED_WHAT",
    });
    expect(testCase.decision.explicitDimensions.every((dimension) => !naturalReply.includes(dimension.sourceText))).toBe(true);
    expect(unauthorizedQuestion).toMatchObject({
      providerReplyAccepted: false,
      executor: "LOCAL_DETERMINISTIC_REALIZATION",
      conformanceReason: "PROVIDER_PROPOSAL_REJECTED_UNAUTHORIZED_QUESTION",
    });
    expect(alteredWhat.conformanceReason).toBe("PROVIDER_PROPOSAL_REJECTED_QRY_WHAT_SHIFT");
    expect(omitted).toMatchObject({
      providerReplyAccepted: false,
      conformanceReason: "PROVIDER_PROPOSAL_REJECTED_MATERIAL_DIMENSION_OMISSION",
    });
    expect(omitted.missingDimensionRefs).toHaveLength(1);
    expect(actionMismatch.conformanceReason).toBe("PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH");
  });

  it("shows the natural CEC response and a governed working understanding in Standard without adopting a Project", async () => {
    renderDemo();
    expect(screen.getByRole("button", { name: "Standard" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("trace-inspector")).toBeNull();

    submit(CEC_INPUT);
    await waitFor(() => expect(runtime.request).toHaveBeenCalledTimes(1));
    expect(runtime.request.mock.calls[0]![0]).toMatchObject({
      evaluatePersistentDelta: true,
      currentProject: null,
      preProjectNavigation: { owner: "QUERY_NAVIGATION", action: "PROPOSE", projectWriteAuthorized: false },
    });
    expect(await screen.findByText(NATURAL_CEC_RESPONSE)).toBeInTheDocument();

    const understanding = await screen.findByTestId("understanding-review-card");
    expect(within(understanding).getByText("Voici ce que j’ai compris")).toBeInTheDocument();
    expect(within(understanding).getByText("Étude exploratoire")).toBeInTheDocument();
    expect(within(understanding).getByText("Explorer l’atteinte myocardique après circulation extracorporelle")).toBeInTheDocument();
    expect(within(understanding).getByText("Élévation de la troponine")).toBeInTheDocument();
    expect(within(understanding).getByText("IRM cardiaque")).toBeInTheDocument();
    expect(within(understanding).getByText("Lésions visibles en rehaussement tardif")).toBeInTheDocument();
    expect(within(understanding).getByText("Modification de l’ECV")).toBeInTheDocument();
    expect(within(understanding).getByText("Modification de la contractilité")).toBeInTheDocument();
    expect(understanding).not.toHaveTextContent("Contribution candidate");
    expect(understanding).not.toHaveTextContent(CEC_INPUT);
    expect(screen.getByTestId("functional-contribution-review")).toBeInTheDocument();

    const session = stored();
    expect(session.project).toBeNull();
    expect(session.pendingContribution).not.toBeNull();
    expect(session.bridgeTraces.at(-1)).toMatchObject({
      projectWriteCount: 0,
      entryRouting: { routeIntent: "DESIGN_STUDY", projectConstructionEligible: true, projectWriteAuthorized: false },
    });
    expect(session.bridgeTraces.at(-1).preProjectTrace.points[3]).toMatchObject({
      owner: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
    });
    expect(session.bridgeTraces.at(-1).preProjectTrace.points[0].dimensionObservations.every(
      (dimension: { visibleOutput: string }) => dimension.visibleOutput === "PRESENT",
    )).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Expert" }));
    expect(screen.getByTestId("trace-inspector")).toBeInTheDocument();
  });

  it("records the repaired CEC responsibility chain at DIAGNOSTIC without FORENSIC or provider calls", () => {
    const testCase = governedCase(CEC_INPUT, "cec-diagnostic");
    const realization = realizePreProjectNavigationDecision({
      decision: testCase.decision,
      providerReply: NATURAL_CEC_RESPONSE,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_FIXTURE",
      structuredUnderstanding: testCase.structuredUnderstanding,
    });
    const request: Omit<ProductBridgeRequest, "apiVersion"> = {
      requestKind: "USER_TURN",
      conversation: {
        conversationId: "conversation:p1-ux-restore-01",
        language: "fr",
        turns: [{ turnId: testCase.sourceTurnRef, role: "USER", content: CEC_INPUT, createdAt: OBSERVED_AT }],
      },
      currentProject: null,
      evaluatePersistentDelta: true,
      preProjectNavigation: testCase.decision,
    };
    const traceRunId = createProductTraceRunId("session:p1-ux-restore-01", testCase.sourceTurnRef);
    const segment = createPreProjectScientificTraceSegment({
      sessionId: "session:p1-ux-restore-01",
      sourceTurnRef: testCase.sourceTurnRef,
      traceRunId,
      sourceText: CEC_INPUT,
      routing: testCase.routing,
      request,
      providerBoundary: {
        systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
        context: naturalConversationContext(request),
        assistantReply: realization.assistantReply,
        provider: realization.provider,
        model: realization.model,
        formulationOwner: "GEMINI_CONVERSATION_MODEL",
        visibleStructuredUnderstandingDimensionRefs: testCase.structuredUnderstanding.representedDimensionRefs,
      },
      captureConfiguration: createScientificTraceCaptureConfiguration({
        captureLevel: "LEVEL_2_DIAGNOSTIC",
        captureReason: "MANUAL_DIAGNOSTIC",
      }),
    });
    const recorded = recordPreProjectScientificTraceSegment({
      ledger: createScientificExecutionTraceLedger("session:p1-ux-restore-01"),
      traceRunId,
      conversationId: "conversation:p1-ux-restore-01",
      segment,
      observedAt: OBSERVED_AT,
    });
    const projection = buildTraceInspectorRunProjection({ ledger: recorded.ledger, traceRunId });

    expect(segment.points[0]).toMatchObject({ point: "POST_ENTRY_ROUTING_INTENT_DIMENSIONS", routeIntent: "DESIGN_STUDY" });
    expect(segment.points[1]).toMatchObject({ point: "ASK_VS_PROPOSE_DECISION", action: "PROPOSE", owner: "QUERY_NAVIGATION" });
    expect(segment.points[3]).toMatchObject({
      point: "QUESTION_FORMULATION_BOUNDARY",
      owner: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
    });
    expect(projection.events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
      "INFORMATION_NEED_SELECTED",
      "QUESTION_REALIZATION_REQUESTED",
      "QUESTION_REALIZED",
    ]);
    expect(projection.ownerFacts).toEqual({
      askVsProposeOwner: "QUERY_NAVIGATION",
      whatToAskOwner: "QUERY_NAVIGATION",
      questionFormulationOwner: "GEMINI_CONVERSATION_MODEL",
      qryWhatLlmHowContract: "RESPECTED",
    });
    expect(projection.firstUnexplainedDivergenceStage).toBeNull();
    expect(projection.captureLevel).toBe("LEVEL_2_DIAGNOSTIC");
  });
});
