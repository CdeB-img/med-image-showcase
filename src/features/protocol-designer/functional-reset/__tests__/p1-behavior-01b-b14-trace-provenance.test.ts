import { describe, expect, it } from "vitest";
import {
  buildPreProjectNavigationDecision,
  realizePreProjectNavigationDecision,
} from "@/features/query-navigation";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  buildPreProjectTraceRealizationOutcome,
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  recordPreProjectScientificTraceSegment,
  type ScientificTraceCaptureLevel,
} from "@/features/protocol-designer/scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture";
import { routeProductEntry } from "../product-entry-routing";

const AT = "2026-08-31T16:00:00.000Z";
const RAW = "Je veux créer une étude comparant la population A et la population B avec la méthode Y.";
const SESSION_ID = "session:p1-behavior-01b:b14";
const CONVERSATION_ID = "conversation:p1-behavior-01b:b14";

const traceCase = (input: {
  id: string;
  captureLevel: ScientificTraceCaptureLevel;
  providerReply?: string | null;
  attemptedProvider?: string;
}) => {
  const sourceTurnRef = `turn:p1-behavior-01b:${input.id}`;
  const routing = routeProductEntry({ raw: RAW, sourceTurnRef, routedAt: AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const structuredUnderstanding = {
    source: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION" as const,
    visibleToUser: true as const,
    representedDimensionRefs: routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
    projectWriteAuthorized: false as const,
  };
  const realization = realizePreProjectNavigationDecision({
    decision,
    providerReply: input.providerReply,
    provider: input.attemptedProvider ?? "GOOGLE_GEMINI",
    model: "RECORDED_FIXTURE",
    structuredUnderstanding,
  });
  const request: Omit<ProductBridgeRequest, "apiVersion"> = {
    requestKind: "USER_TURN",
    conversation: {
      conversationId: CONVERSATION_ID,
      language: "fr",
      turns: [{ turnId: sourceTurnRef, role: "USER", content: RAW, createdAt: AT }],
    },
    currentProject: null,
    evaluatePersistentDelta: routing.projectConstructionEligible,
    preProjectNavigation: decision,
  };
  const traceRunId = createProductTraceRunId(SESSION_ID, sourceTurnRef);
  const outcome = buildPreProjectTraceRealizationOutcome({
    attemptedProvider: input.attemptedProvider ?? "GOOGLE_GEMINI",
    providerReply: input.providerReply,
    realization,
  });
  const segment = createPreProjectScientificTraceSegment({
    sessionId: SESSION_ID,
    sourceTurnRef,
    traceRunId,
    sourceText: RAW,
    routing,
    request,
    providerBoundary: {
      systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context: naturalConversationContext(request),
      assistantReply: realization.assistantReply,
      provider: realization.provider,
      model: realization.model,
      formulationOwner: realization.executor === "LOCAL_DETERMINISTIC_REALIZATION"
        ? "LOCAL_RUNTIME"
        : "GEMINI_CONVERSATION_MODEL",
      visibleStructuredUnderstandingDimensionRefs: structuredUnderstanding.representedDimensionRefs,
      realizationOutcome: outcome,
    },
    captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: input.captureLevel }),
  });
  const ledger = recordPreProjectScientificTraceSegment({
    ledger: createScientificExecutionTraceLedger(SESSION_ID),
    traceRunId,
    conversationId: CONVERSATION_ID,
    segment,
    observedAt: AT,
  }).ledger;
  const projection = buildTraceInspectorRunProjection({ ledger, traceRunId });
  const realized = projection.events.find((event) => event.stage === "QUESTION_REALIZED")!;
  return { realization, outcome, segment, realized };
};

describe("P1-BEHAVIOR-01B — B14 provider realization provenance", () => {
  it("B14-A preserves an accepted provider response and records no fallback", () => {
    const testCase = traceCase({
      id: "accepted",
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      providerReply: "Je propose de structurer cette comparaison entre les deux populations en conservant la méthode Y.",
    });

    expect(testCase.realization).toMatchObject({
      executor: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
      providerReplyAccepted: true,
    });
    expect(testCase.realized).toMatchObject({
      executor: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
      attemptedProvider: "GOOGLE_GEMINI",
      providerResponseReceived: true,
      providerResponseAccepted: true,
      providerRejectionReason: "NOT_APPLICABLE",
      fallbackReason: "NOT_APPLICABLE",
    });
  });

  it("B14-B preserves a rejected response, its bounded reason, and local fallback", () => {
    const testCase = traceCase({
      id: "rejected",
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      providerReply: "D’accord.",
    });

    expect(testCase.realization).toMatchObject({
      executor: "LOCAL_DETERMINISTIC_REALIZATION",
      provider: "NONE",
      providerReplyAccepted: false,
      conformanceReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
    });
    expect(testCase.realized).toMatchObject({
      executor: "LOCAL_RUNTIME",
      provider: "NONE",
      attemptedProvider: "GOOGLE_GEMINI",
      providerResponseReceived: true,
      providerResponseAccepted: false,
      providerRejectionReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
      fallbackReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
    });
  });

  it("B14-C distinguishes provider unavailability from semantic rejection", () => {
    const testCase = traceCase({
      id: "unavailable",
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      providerReply: null,
    });

    expect(testCase.outcome).toMatchObject({
      attemptedProvider: "GOOGLE_GEMINI",
      providerResponseReceived: false,
      providerResponseAccepted: null,
      providerRejectionReason: "NOT_APPLICABLE",
      effectiveExecutor: "LOCAL_DETERMINISTIC_REALIZATION",
      fallbackReason: "LOCAL_QUALIFICATION_NO_PROVIDER_REPLY",
    });
    expect(testCase.realized).toMatchObject({
      providerResponseReceived: false,
      providerResponseAccepted: null,
      providerRejectionReason: "NOT_APPLICABLE",
      fallbackReason: "LOCAL_QUALIFICATION_NO_PROVIDER_REPLY",
    });
  });

  it("B14-D keeps detailed realization facts out of CORE and reconstructible in DIAGNOSTIC/FORENSIC", () => {
    const core = traceCase({ id: "core", captureLevel: "LEVEL_1_CORE", providerReply: "D’accord." });
    const diagnostic = traceCase({ id: "diagnostic", captureLevel: "LEVEL_2_DIAGNOSTIC", providerReply: "D’accord." });
    const forensic = traceCase({ id: "forensic", captureLevel: "LEVEL_3_FORENSIC", providerReply: "D’accord." });

    expect(core.segment.points.find((point) => point.point === "QUESTION_FORMULATION_BOUNDARY")).not.toHaveProperty("realizationOutcome");
    expect(core.realized).toMatchObject({
      realizationOutcome: null,
      providerResponseReceived: null,
      providerResponseAccepted: null,
    });
    for (const richer of [diagnostic, forensic]) {
      expect(richer.realized.realizationOutcome).toMatchObject({
        providerResponseReceived: true,
        providerResponseAccepted: false,
        providerRejectionReason: "PROVIDER_PROPOSAL_REJECTED_ACTION_MISMATCH",
      });
    }
  });
});
