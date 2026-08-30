import { describe, expect, it } from "vitest";
import { buildPreProjectNavigationDecision } from "@/features/query-navigation";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type PersistentExtractionProviderArtifact,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
} from "@/features/protocol-designer/scientific-execution-trace";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { buildTraceInspectorRunProjection } from "@/features/validation-architecture";
import {
  productTraceExtractionExecution,
  recordInitialProductTrace,
} from "../end-to-end-trace-adapter";
import { routeProductEntry } from "../product-entry-routing";
import { makeFunctionalResetContribution } from "./functional-reset-fixtures";

const OBSERVED_AT = "2026-08-30T20:00:00.000Z";
const USER_TEXT = "Je veux créer une étude comparant la méthode alpha et la méthode bêta pour observer la réponse gamma.";

const extractionArtifact = (): PersistentExtractionProviderArtifact => ({
  artifactRef: "provider-artifact:extraction-b",
  requestTurnRef: "turn:p1-ux-restore-01fid:trace",
  executor: "EXTRACTION_EXECUTOR_B",
  provider: "OPENAI",
  model: "extraction-model-b",
  modelRequested: "extraction-model-requested-b",
  modelReturned: "extraction-model-returned-b",
  functionName: "propose_persistent_project_delta",
  receivedAt: OBSERVED_AT,
  providerResponseId: "provider-response-b",
  structuredArgsExact: { changes: [] },
  structuredArgsSerialized: "{\"changes\":[]}",
  structuredArgsDigest: "digest:structured-args-b",
});

const recordedRun = () => {
  const turn = { turnId: "turn:p1-ux-restore-01fid:trace", role: "USER" as const, content: USER_TEXT, createdAt: OBSERVED_AT };
  const routing = routeProductEntry({ raw: USER_TEXT, sourceTurnRef: turn.turnId, routedAt: OBSERVED_AT });
  const decision = buildPreProjectNavigationDecision({ routing });
  const request: Omit<ProductBridgeRequest, "apiVersion"> = {
    requestKind: "USER_TURN",
    conversation: { conversationId: "conversation:p1-ux-restore-01fid:trace", language: "fr", turns: [turn] },
    currentProject: null,
    evaluatePersistentDelta: true,
    preProjectNavigation: decision,
  };
  const traceRunId = createProductTraceRunId("session:p1-ux-restore-01fid:trace", turn.turnId);
  const segment = createPreProjectScientificTraceSegment({
    sessionId: "session:p1-ux-restore-01fid:trace",
    sourceTurnRef: turn.turnId,
    traceRunId,
    sourceText: USER_TEXT,
    routing,
    request,
    providerBoundary: {
      systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context: naturalConversationContext(request),
      assistantReply: "Je propose de structurer la comparaison des deux méthodes autour de la réponse décrite.",
      provider: "GOOGLE_GEMINI",
      model: "realization-model-a",
      formulationOwner: "GEMINI_CONVERSATION_MODEL",
      visibleStructuredUnderstandingDimensionRefs: routing.explicitScientificDimensions.map((dimension) => dimension.dimensionRef),
    },
    captureConfiguration: createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "MANUAL_DIAGNOSTIC",
    }),
  });
  const contribution = makeFunctionalResetContribution([turn]);
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const artifact = extractionArtifact();
  const extractionExecution = productTraceExtractionExecution({
    contribution,
    providerArtifact: artifact,
    observedProvider: "GOOGLE_GEMINI",
    observedModelRequested: "wrong-conversation-model",
    observedModelReturned: null,
  });
  const ledger = recordInitialProductTrace({
    ledger: createScientificExecutionTraceLedger("session:p1-ux-restore-01fid:trace"),
    traceRunId,
    conversationId: request.conversation.conversationId,
    segment,
    observedAt: OBSERVED_AT,
    contribution,
    candidate,
    reviewCandidate: candidate,
    extractionStatus: "CANDIDATE",
    extractionLatencyMs: 12,
    extractionExecution,
  });
  return {
    artifact,
    extractionExecution,
    projection: buildTraceInspectorRunProjection({ ledger, traceRunId }),
  };
};

describe("P1-UX-RESTORE-01FID — stage-specific TRACE provenance", () => {
  it("Trace A/B — preserves distinct providers and executors for realization and extraction", () => {
    const run = recordedRun();
    const realized = run.projection.events.find((event) => event.stage === "QUESTION_REALIZED");
    const extracted = run.projection.events.find((event) => event.stage === "PROJECT_CANDIDATE_EXTRACTED");

    expect(realized).toMatchObject({ executor: "GEMINI_CONVERSATION_MODEL", provider: "GOOGLE_GEMINI" });
    expect(extracted).toMatchObject({ executor: "EXTRACTION_EXECUTOR_B", provider: "OPENAI" });
    expect(extracted?.provider).not.toBe(realized?.provider);
    expect(extracted?.executor).not.toBe(realized?.executor);
  });

  it("Trace C — sources extraction component/model metadata from the provider artifact without changing ownership", () => {
    const run = recordedRun();
    const extracted = run.projection.events.find((event) => event.stage === "PROJECT_CANDIDATE_EXTRACTED");

    expect(run.extractionExecution).toEqual({
      executor: run.artifact.executor,
      provider: run.artifact.provider,
      componentId: run.artifact.functionName,
      componentVersion: run.artifact.modelReturned,
    });
    expect(extracted).toMatchObject({
      responsibilityOwner: "SCIENTIFIC_INTERPRETATION",
      decisionOwner: "NONE",
      executor: "EXTRACTION_EXECUTOR_B",
      provider: "OPENAI",
      component: {
        componentId: "propose_persistent_project_delta",
        componentVersion: "extraction-model-returned-b",
      },
    });
  });

  it("Trace D — keeps the qualified Gemini realization attribution unchanged", () => {
    const run = recordedRun();
    const realized = run.projection.events.find((event) => event.stage === "QUESTION_REALIZED");

    expect(realized).toMatchObject({
      responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION",
      executor: "GEMINI_CONVERSATION_MODEL",
      provider: "GOOGLE_GEMINI",
      component: { componentVersion: "realization-model-a" },
    });
  });
});
