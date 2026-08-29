import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  END_TO_END_TRACE_PROFILE,
  END_TO_END_TRACE_PROFILE_VERSION,
  SCIENTIFIC_TRACE_EVENT_CROSSWALK,
  TRACE_CAPTURE_POLICY_ID,
  TRACE_REDACTION_POLICY_ID,
  TRACE_RETENTION_POLICY_ID,
  commonEnvelopeForScientificTraceEvent,
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  listEndToEndTraceEvents,
  recordPreProjectScientificTraceSegment,
  rehydrateScientificExecutionTraceLedger,
  startScientificRun,
  type ScientificExecutionTraceLedger,
  type ScientificProductTraceStage,
} from "@/features/protocol-designer/scientific-execution-trace";
import type { ProjectContextSnapshot } from "@/features/research-project-construction";
import { routeProductEntry } from "../product-entry-routing";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  COLCHICINE_INITIAL,
  makeFunctionalResetBridgeResponseForRequest,
} from "./functional-reset-fixtures";

const HUMAN_FIRST_TURN = "Je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";
const VISIBLE_RESPONSE = `Je comprends que vous souhaitez explorer les atteintes myocardiques après circulation extracorporelle en comparant l'élévation de la troponine à des observations en IRM cardiaque.

Pour préciser la structure de votre étude, cherchez-vous à identifier de véritables lésions tissulaires irréversibles en rehaussement tardif, ou à quantifier des modifications globales et diffuses de la matrice extracellulaire via l'ECV ?`;
const CEC_AT = "2026-08-29T10:00:00.000Z";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const cecReplay = () => {
  const sessionId = "protocol-designer-session:p1-trace-02a-cec";
  const conversationId = "scientific-conversation:p1-trace-02a-cec";
  const turnId = "turn:p1-trace-02a-cec";
  const traceRunId = createProductTraceRunId(sessionId, turnId);
  const request: Omit<ProductBridgeRequest, "apiVersion"> = {
    requestKind: "USER_TURN",
    conversation: {
      conversationId,
      language: "fr",
      turns: [{ turnId, role: "USER", content: HUMAN_FIRST_TURN, createdAt: CEC_AT }],
    },
    currentProject: null,
    evaluatePersistentDelta: false,
  };
  const routing = routeProductEntry({ raw: HUMAN_FIRST_TURN, sourceTurnRef: turnId, routedAt: CEC_AT });
  const segment = createPreProjectScientificTraceSegment({
    sessionId,
    sourceTurnRef: turnId,
    traceRunId,
    sourceText: HUMAN_FIRST_TURN,
    routing,
    request,
    providerBoundary: {
      systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context: naturalConversationContext(request),
      assistantReply: VISIBLE_RESPONSE,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_REPLAY_NO_CALL",
    },
  });
  const recorded = recordPreProjectScientificTraceSegment({
    ledger: createScientificExecutionTraceLedger(sessionId),
    traceRunId,
    conversationId,
    segment,
    observedAt: CEC_AT,
  });
  return { request, routing, segment, traceRunId, ...recorded };
};

const legacySnapshot = Object.freeze({
  contract: "PROJECT_CONTEXT_SNAPSHOT",
  contractVersion: "0.3.0",
  owner: "RESEARCH_PROJECT",
  sourceProjectRef: "project:legacy",
  sourceProjectVersion: "project:legacy:v1",
  sourceProjectDigest: "project:legacy:digest",
  snapshotDigest: "snapshot:legacy:digest",
  readOnly: true,
}) as unknown as Readonly<ProjectContextSnapshot>;

const removeCurrentProfile = (ledger: Readonly<ScientificExecutionTraceLedger>) => {
  const legacy = structuredClone(ledger) as ScientificExecutionTraceLedger;
  delete legacy.traceProfile;
  legacy.runBindings.forEach((binding) => {
    const mutable = binding as { traceIdentity?: unknown; bindingDigest: string };
    delete mutable.traceIdentity;
    const { bindingDigest: _bindingDigest, ...material } = mutable;
    mutable.bindingDigest = logicalDigest(material);
  });
  legacy.events.forEach((event) => {
    const mutable = event as { common?: unknown; eventDigest: string };
    delete mutable.common;
    const { eventDigest: _eventDigest, ...material } = mutable;
    mutable.eventDigest = logicalDigest(material);
  });
  const { ledgerDigest: _ledgerDigest, ...material } = legacy;
  legacy.ledgerDigest = logicalDigest(material);
  return legacy;
};

describe("P1-TRACE-02A — one end-to-end trace contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:p1-trace-02a") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("replays the exact CEC first turn with six correlated pre-Project events and zero provider call", () => {
    const requestBefore = JSON.stringify(cecReplay().request);
    const replay = cecReplay();
    const events = listEndToEndTraceEvents({ ledger: replay.ledger, traceRunId: replay.traceRunId });

    expect(runtime.request).not.toHaveBeenCalled();
    expect(JSON.stringify(replay.request)).toBe(requestBefore);
    expect(events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
      "INFORMATION_NEED_SELECTED",
      "QUESTION_REALIZATION_REQUESTED",
      "QUESTION_REALIZED",
    ] satisfies ScientificProductTraceStage[]);
    expect(new Set(events.map((event) => event.traceRunId))).toEqual(new Set([replay.traceRunId]));
    expect(new Set(events.map((event) => event.turnId))).toEqual(new Set(["turn:p1-trace-02a-cec"]));
    expect(new Set(events.map((event) => event.projectId))).toEqual(new Set(["NONE"]));
    expect(events[3]).toMatchObject({
      responsibilityOwner: "GEMINI_CONVERSATION_MODEL",
      decisionOwner: "GEMINI_CONVERSATION_MODEL",
      executor: "GEMINI_CONVERSATION_MODEL",
    });
    expect(events[5]).toMatchObject({
      provider: "GOOGLE_GEMINI",
      redactionPolicyId: TRACE_REDACTION_POLICY_ID,
      retentionPolicyId: TRACE_RETENTION_POLICY_ID,
      capturePolicyId: TRACE_CAPTURE_POLICY_ID,
      traceMutatesProduct: false,
      traceDecides: false,
      traceRepairs: false,
      traceJudgesScience: false,
    });
    const serializedLedger = JSON.stringify(replay.ledger);
    expect(serializedLedger).not.toContain(HUMAN_FIRST_TURN);
    expect(serializedLedger).not.toContain(VISIBLE_RESPONSE);
    expect(replay.ledger.traceProfile).toMatchObject({
      profile: END_TO_END_TRACE_PROFILE,
      profileVersion: END_TO_END_TRACE_PROFILE_VERSION,
      oneTraceSystem: true,
      oneEventTaxonomy: true,
      oneTraceIdentityModel: true,
    });
  });

  it("keeps legacy 0.1.0 ledgers readable through the canonical crosswalk without rewriting their semantics", () => {
    const started = startScientificRun({
      ledger: createScientificExecutionTraceLedger("session:legacy"),
      runId: "scientific-run:legacy",
      projectSnapshot: legacySnapshot,
      initiatorContext: { kind: "TEST_HARNESS", initiatorRef: "P1-TRACE-02A-LEGACY" },
      startedAt: CEC_AT,
    });
    const legacy = removeCurrentProfile(started.ledger);
    const rehydrated = rehydrateScientificExecutionTraceLedger(legacy);
    const common = commonEnvelopeForScientificTraceEvent({ ledger: rehydrated, event: rehydrated.events[0] });

    expect(rehydrated.contractVersion).toBe("0.1.0");
    expect(rehydrated.events[0].common).toBeUndefined();
    expect(common).toMatchObject({
      traceRunId: "scientific-run:legacy",
      stage: "TRACE_RUN_STARTED",
      projectId: "project:legacy",
      projectVersion: "project:legacy:v1",
    });
    expect(SCIENTIFIC_TRACE_EVENT_CROSSWALK).toContainEqual({
      existingEventType: "RUN_STARTED",
      targetStage: "TRACE_RUN_STARTED",
      compatibility: "READ_ALIAS",
    });
  });

  it("keeps trace-on and trace-off CEC product inputs and outputs byte-identical within a bounded footprint", () => {
    const withoutTrace = cecReplay();
    const productBefore = JSON.stringify({ request: withoutTrace.request, routing: withoutTrace.routing, response: VISIBLE_RESPONSE });
    const startedAt = performance.now();
    const withTrace = cecReplay();
    const elapsedMs = performance.now() - startedAt;
    const productAfter = JSON.stringify({ request: withTrace.request, routing: withTrace.routing, response: VISIBLE_RESPONSE });
    const serializedBytes = new TextEncoder().encode(JSON.stringify(withTrace.ledger)).byteLength;

    expect(productAfter).toBe(productBefore);
    expect(withTrace.events).toHaveLength(6);
    expect(serializedBytes).toBeLessThan(64_000);
    expect(elapsedMs).toBeLessThan(250);
    console.info(`P1_TRACE_02A_CEC_EVENT_COUNT=${withTrace.events.length}`);
    console.info(`P1_TRACE_02A_CEC_SERIALIZED_BYTES=${serializedBytes}`);
    console.info(`P1_TRACE_02A_CEC_TRACE_OVERHEAD_MS=${elapsedMs.toFixed(3)}`);
  });

  it("preserves one traceRunId from product entry through Project, QRY, TMP, DOC, UI and artifact", async () => {
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: COLCHICINE_INITIAL } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByRole("heading", { name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude." });
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    const projectPanel = screen.getByTestId("functional-research-project");
    expect(await within(projectPanel).findByText("Construction en cours")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Créer l’aperçu" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Créer l’aperçu" }));
    await screen.findByTestId("functional-protocol-preview");
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as {
        scientificExecutionTraceLedger: ScientificExecutionTraceLedger;
      };
      const stages = stored.scientificExecutionTraceLedger.events.map((event) => event.common?.stage);
      expect(stages).toContain("UI_PROJECTION");
      expect(stages).not.toContain("ARTIFACT_GENERATED");
    });
    fireEvent.click(screen.getByRole("button", { name: "Télécharger le protocole (.html)" }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as {
        bridgeTraces: Array<{ traceRunId?: string; preProjectTrace?: { captureMode: string; points: unknown[] } }>;
        project: { projectId: string; versionId: string };
        documents: { projections: Array<{ projectionId: string }> };
        scientificExecutionTraceLedger: ScientificExecutionTraceLedger;
      };
      const traceRunId = stored.bridgeTraces[0]?.traceRunId;
      expect(traceRunId).toBeTruthy();
      expect(stored.bridgeTraces[0]?.preProjectTrace?.captureMode).toBe("MINIMIZED");
      expect(JSON.stringify(stored.bridgeTraces[0]?.preProjectTrace)).not.toContain(NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION);
      const events = stored.scientificExecutionTraceLedger.events
        .filter((event) => event.common?.traceRunId === traceRunId)
        .map((event) => event.common!);
      const stages = events.map((event) => event.stage);
      expect(stages).toEqual(expect.arrayContaining([
        "USER_TURN_RECEIVED",
        "ROUTE_SELECTED",
        "INTENT_REPRESENTED",
        "INFORMATION_NEED_SELECTED",
        "QUESTION_REALIZATION_REQUESTED",
        "QUESTION_REALIZED",
        "PROJECT_CANDIDATE_EXTRACTED",
        "PROJECT_CANDIDATE_VALIDATED",
        "HUMAN_REVIEW_PRESENTED",
        "HUMAN_DECISION_RECORDED",
        "PROJECT_VERSION_CREATED",
        "QRY_ACTION_SELECTED",
        "TMP_PROJECTION",
        "DOC_PROJECTION",
        "UI_PROJECTION",
        "ARTIFACT_GENERATED",
      ] satisfies ScientificProductTraceStage[]));
      expect(new Set(events.map((event) => event.traceRunId))).toEqual(new Set([traceRunId]));
      expect(events.find((event) => event.stage === "USER_TURN_RECEIVED")?.projectId).toBe("NONE");
      expect(events.find((event) => event.stage === "PROJECT_VERSION_CREATED")).toMatchObject({
        projectId: stored.project.projectId,
        projectVersion: stored.project.versionId,
        responsibilityOwner: "RESEARCH_PROJECT",
      });
      const artifact = events.find((event) => event.stage === "ARTIFACT_GENERATED");
      expect(artifact).toMatchObject({
        documentProjectionId: stored.documents.projections[0].projectionId,
        traceMutatesProduct: false,
      });
      expect(artifact?.artifactId).toMatch(new RegExp(`^artifact:${stored.documents.projections[0].projectionId}:HTML:`));
      expect(JSON.stringify(stored.scientificExecutionTraceLedger)).not.toContain(COLCHICINE_INITIAL);
    });
    const measured = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as {
      bridgeTraces: Array<{ traceRunId?: string }>;
      scientificExecutionTraceLedger: ScientificExecutionTraceLedger;
    };
    const measuredTraceRunId = measured.bridgeTraces[0]?.traceRunId;
    const measuredEvents = measured.scientificExecutionTraceLedger.events.filter((event) => event.common?.traceRunId === measuredTraceRunId);
    console.info(`P1_TRACE_02A_VERTICAL_EVENT_COUNT=${measuredEvents.length}`);
    console.info(`P1_TRACE_02A_VERTICAL_LEDGER_BYTES=${new TextEncoder().encode(JSON.stringify(measured.scientificExecutionTraceLedger)).byteLength}`);
  });
});
