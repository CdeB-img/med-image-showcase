import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  appendProductTraceStage,
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  recordPreProjectScientificTraceSegment,
  startProductTraceRun,
  type PreProjectTraceDimensionProbe,
  type ScientificExecutionTraceLedger,
  type ScientificTraceForensicPayload,
} from "@/features/protocol-designer/scientific-execution-trace";
import {
  buildTraceInspectorRunProjection,
  compareTraceInspectorRuns,
  listTraceRunLineage,
  TRACE_STRUCTURAL_DIAGNOSTIC_OWNER,
} from "@/features/validation-architecture/trace-structural-validation";
import TraceInspector from "../TraceInspector";
import { routeProductEntry } from "../product-entry-routing";
import { createFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import {
  COLCHICINE_03A_INITIAL,
  makeFunctionalResetBridgeResponseForRequest,
} from "./functional-reset-fixtures";

const CEC_INPUT = "Je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";
const CEC_RESPONSE = "Je comprends que vous souhaitez explorer les atteintes myocardiques après circulation extracorporelle en comparant l'élévation de la troponine à des observations en IRM cardiaque. Pour préciser la structure de votre étude, cherchez-vous à identifier de véritables lésions tissulaires irréversibles en rehaussement tardif, ou à quantifier des modifications globales et diffuses de la matrice extracellulaire via l'ECV ?";
const OBSERVED_AT = "2026-08-29T18:00:00.000Z";
const SESSION_ID = "protocol-designer-session:p1-trace-02c";
const CONVERSATION_ID = "scientific-conversation:p1-trace-02c";

const DIMENSION_PROBES: readonly PreProjectTraceDimensionProbe[] = [
  { dimensionRef: "circulation-extracorporelle", expressions: ["circulation extra corporelle", "circulation extracorporelle"] },
  { dimensionRef: "troponine", expressions: ["troponine"] },
  { dimensionRef: "atteinte-myocardique", expressions: ["atteinte des myocites", "atteinte myocardique"] },
  { dimensionRef: "lge", expressions: ["rehaussement tardif", "LGE"] },
  { dimensionRef: "ecv", expressions: ["ECV"] },
  { dimensionRef: "contractilite", expressions: ["contractilité", "contractilite"] },
  { dimensionRef: "exploratoire-pilote", expressions: ["explorer ce domaine", "exploratoire", "pilote"] },
  { dimensionRef: "decision-etude-plus-importante", expressions: ["étude plus importante", "etude plus importante"] },
];

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const cecRequest: Omit<ProductBridgeRequest, "apiVersion"> = {
  requestKind: "USER_TURN",
  conversation: {
    conversationId: CONVERSATION_ID,
    language: "fr",
    turns: [{ turnId: "turn:p1-trace-02c-cec", role: "USER", content: CEC_INPUT, createdAt: OBSERVED_AT }],
  },
  currentProject: null,
  evaluatePersistentDelta: false,
};

const cecRouting = routeProductEntry({ raw: CEC_INPUT, sourceTurnRef: "turn:p1-trace-02c-cec", routedAt: OBSERVED_AT });
const cecProductState = Object.freeze({
  routing: cecRouting,
  visibleResponse: CEC_RESPONSE,
  project: null,
  qry: null,
  document: null,
});

const recordCecRun = (input: {
  ledger: Readonly<ScientificExecutionTraceLedger>;
  traceRunId: string;
  captureLevel: "LEVEL_1_CORE" | "LEVEL_2_DIAGNOSTIC";
  replayOfTraceRunId?: string;
}) => {
  const configuration = createScientificTraceCaptureConfiguration(input.captureLevel === "LEVEL_1_CORE" ? undefined : {
    captureLevel: input.captureLevel,
    captureReason: "REPLAY_AFTER_INSUFFICIENT_TRACE",
    replayOfTraceRunId: input.replayOfTraceRunId,
  });
  const segment = createPreProjectScientificTraceSegment({
    sessionId: SESSION_ID,
    sourceTurnRef: "turn:p1-trace-02c-cec",
    traceRunId: input.traceRunId,
    sourceText: CEC_INPUT,
    routing: cecRouting,
    request: cecRequest,
    providerBoundary: {
      systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
      context: naturalConversationContext(cecRequest),
      assistantReply: CEC_RESPONSE,
      provider: "GOOGLE_GEMINI",
      model: "RECORDED_REPLAY_NO_PROVIDER_CALL",
    },
    diagnosticDimensionProbes: DIMENSION_PROBES,
    captureConfiguration: configuration,
  });
  return recordPreProjectScientificTraceSegment({
    ledger: input.ledger,
    traceRunId: input.traceRunId,
    conversationId: CONVERSATION_ID,
    segment,
    observedAt: OBSERVED_AT,
  });
};

const storedSession = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;

describe("P1-TRACE-02C — Trace Inspector and TRACE v2 qualification", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:p1-trace-02c") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("uses CORE to locate the corridor, DIAGNOSTIC to localize the first unexplained CEC divergence, and never calls a provider", () => {
    const productBefore = JSON.stringify(cecProductState);
    const coreTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-core");
    const diagnosticTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-diagnostic");
    const coreStart = performance.now();
    const core = recordCecRun({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId: coreTraceRunId,
      captureLevel: "LEVEL_1_CORE",
    });
    const coreInspectorLoad = performance.now() - coreStart;
    const diagnosticRecorded = recordCecRun({
      ledger: core.ledger,
      traceRunId: diagnosticTraceRunId,
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      replayOfTraceRunId: coreTraceRunId,
    });
    const diagnosticStart = performance.now();
    const coreProjection = buildTraceInspectorRunProjection({ ledger: diagnosticRecorded.ledger, traceRunId: coreTraceRunId });
    const diagnosticProjection = buildTraceInspectorRunProjection({ ledger: diagnosticRecorded.ledger, traceRunId: diagnosticTraceRunId });
    const diagnosticInspectorLoad = performance.now() - diagnosticStart;

    expect(runtime.request).not.toHaveBeenCalled();
    expect(JSON.stringify(cecProductState)).toBe(productBefore);
    expect(coreProjection.captureLevel).toBe("LEVEL_1_CORE");
    expect(coreProjection.events.map((event) => event.stage)).toEqual([
      "USER_TURN_RECEIVED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
      "INFORMATION_NEED_SELECTED",
      "QUESTION_REALIZATION_REQUESTED",
      "QUESTION_REALIZED",
    ]);
    expect(coreProjection.events.every((event) => !event.semanticTransformation && !event.actionDecision)).toBe(true);
    expect(coreProjection.firstUnexplainedDivergenceStage).toBeNull();

    expect(diagnosticProjection.captureLevel).toBe("LEVEL_2_DIAGNOSTIC");
    expect(diagnosticProjection.replayOfTraceRunId).toBe(coreTraceRunId);
    expect(diagnosticProjection.firstUnexplainedDivergenceStage).toBe("INTENT_REPRESENTED");
    expect(diagnosticProjection.ownerFacts).toEqual({
      askVsProposeOwner: "GEMINI_CONVERSATION_MODEL",
      whatToAskOwner: "GEMINI_CONVERSATION_MODEL",
      questionFormulationOwner: "GEMINI_CONVERSATION_MODEL",
      qryWhatLlmHowContract: "VIOLATED",
    });
    const firstDivergence = diagnosticProjection.events.find((event) => event.stage === "INTENT_REPRESENTED")!;
    expect(firstDivergence.semanticTransformation?.inputDimensions.map((dimension) => dimension.dimensionId)).toContain("contractilite");
    expect(firstDivergence.semanticTransformation?.droppedDimensions.map((dimension) => dimension.dimensionId)).toContain("contractilite");
    expect(diagnosticProjection.diagnostics.map((finding) => finding.code)).toEqual(expect.arrayContaining([
      "UNEXPLAINED_DIMENSION_LOSS",
      "MISSING_TRANSFORMATION_REASON",
      "DECISION_OWNER_EXECUTOR_COLLAPSE",
      "DECISION_OWNERSHIP_MISMATCH",
    ]));
    expect(diagnosticProjection.diagnostics.some((finding) => finding.code === "ALREADY_PROVIDED_INFORMATION_REASKED")).toBe(false);
    expect(diagnosticProjection.diagnostics.every((finding) => !finding.scientificJudgmentPerformed && !finding.automaticCorrectionAllowed)).toBe(true);
    expect(TRACE_STRUCTURAL_DIAGNOSTIC_OWNER).toBe("VAL");
    expect(listTraceRunLineage(diagnosticRecorded.ledger)).toEqual(expect.arrayContaining([
      expect.objectContaining({ traceRunId: coreTraceRunId, captureLevel: "LEVEL_1_CORE" }),
      expect.objectContaining({ traceRunId: diagnosticTraceRunId, captureLevel: "LEVEL_2_DIAGNOSTIC", replayOfTraceRunId: coreTraceRunId }),
    ]));
    const comparison = compareTraceInspectorRuns({
      ledger: diagnosticRecorded.ledger,
      leftTraceRunId: coreTraceRunId,
      rightTraceRunId: diagnosticTraceRunId,
    });
    expect(comparison.differences.some((difference) => difference.fields.includes("TRANSFORMATIONS"))).toBe(true);
    expect(comparison.scientificDivergenceClaimed).toBe(false);
    expect(coreProjection.inspectorCallsProvider).toBe(false);
    expect(diagnosticProjection.inspectorMutatesProduct).toBe(false);
    expect(coreInspectorLoad).toBeLessThan(250);
    expect(diagnosticInspectorLoad).toBeLessThan(250);
    expect(new TextEncoder().encode(JSON.stringify(coreProjection)).byteLength).toBeLessThan(128_000);
    expect(new TextEncoder().encode(JSON.stringify(diagnosticProjection)).byteLength).toBeLessThan(256_000);
    console.info(`P1_TRACE_02C_CORE_INSPECTOR_LOAD_MS=${coreInspectorLoad.toFixed(3)}`);
    console.info(`P1_TRACE_02C_DIAGNOSTIC_INSPECTOR_LOAD_MS=${diagnosticInspectorLoad.toFixed(3)}`);
    console.info(`P1_TRACE_02C_CORE_EVENT_COUNT=${coreProjection.eventCount}`);
    console.info(`P1_TRACE_02C_DIAGNOSTIC_EVENT_COUNT=${diagnosticProjection.eventCount}`);
    console.info(`P1_TRACE_02C_CORE_SERIALIZED_SIZE=${new TextEncoder().encode(JSON.stringify(coreProjection)).byteLength}`);
    console.info(`P1_TRACE_02C_DIAGNOSTIC_SERIALIZED_SIZE=${new TextEncoder().encode(JSON.stringify(diagnosticProjection)).byteLength}`);
  });

  it("keeps the Inspector explicit in Expert, separates capture from view, and never mutates session state", () => {
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
    const baseSession = storedSessionFallback();
    const coreTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-ui-core");
    const diagnosticTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-ui-diagnostic");
    const core = recordCecRun({ ledger: baseSession.scientificExecutionTraceLedger, traceRunId: coreTraceRunId, captureLevel: "LEVEL_1_CORE" });
    const diagnostic = recordCecRun({ ledger: core.ledger, traceRunId: diagnosticTraceRunId, captureLevel: "LEVEL_2_DIAGNOSTIC", replayOfTraceRunId: coreTraceRunId });
    const session: FunctionalResetSession = {
      ...baseSession,
      scientificExecutionTraceLedger: diagnostic.ledger,
    };
    window.localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(session));
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

    expect(screen.queryByTestId("trace-inspector")).toBeNull();
    const before = window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY);
    const providerCallsBefore = runtime.request.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Expert" }));
    const inspector = screen.getByTestId("trace-inspector");
    expect(inspector).toHaveTextContent("CAPTURE_LEVEL=LEVEL_2_DIAGNOSTIC · VIEW_LEVEL=SUMMARY");
    expect(within(inspector).getByTestId("trace-inspector-summary-view")).toBeInTheDocument();
    fireEvent.change(within(inspector).getByLabelText("Comparer avec"), { target: { value: coreTraceRunId } });
    expect(within(inspector).getByTestId("trace-inspector-comparison")).toHaveTextContent("TRANSFORMATIONS");
    fireEvent.click(within(inspector).getByTestId("trace-event-USER_TURN_RECEIVED").querySelector("summary")!);
    expect(within(inspector).getByTestId("trace-event-USER_TURN_RECEIVED")).toHaveTextContent("DECISION OWNER");
    fireEvent.click(within(inspector).getByRole("button", { name: "DIAGNOSTIC_DETAILS" }));
    expect(inspector).toHaveTextContent("CAPTURE_LEVEL=LEVEL_2_DIAGNOSTIC · VIEW_LEVEL=DIAGNOSTIC_DETAILS");
    expect(within(inspector).getByTestId("trace-inspector-diagnostic-view")).toHaveTextContent("FIRST_UNEXPLAINED_DIVERGENCE_STAGE");
    fireEvent.click(within(inspector).getByRole("button", { name: "FORENSIC_DETAILS" }));
    expect(inspector).toHaveTextContent("NOT_CAPTURED");
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(before);
    expect(runtime.request).toHaveBeenCalledTimes(providerCallsBefore);
    fireEvent.click(screen.getByRole("button", { name: "Standard" }));
    expect(screen.queryByTestId("trace-inspector")).toBeNull();
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(before);
  });

  it("reveals allowlisted FORENSIC payloads only after an explicit action and keeps forbidden material absent", () => {
    const coreTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-forensic-core");
    const forensicTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-forensic");
    let ledger = startProductTraceRun({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId: coreTraceRunId,
      turnId: "turn:p1-trace-02c-forensic-core",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "synthetic-source-digest",
    }).ledger;
    const forensicConfiguration = createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_3_FORENSIC",
      captureReason: "REPLAY_AFTER_INSUFFICIENT_TRACE",
      replayOfTraceRunId: coreTraceRunId,
    });
    ledger = startProductTraceRun({
      ledger,
      traceRunId: forensicTraceRunId,
      turnId: "turn:p1-trace-02c-forensic",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "synthetic-source-digest",
      captureConfiguration: forensicConfiguration,
    }).ledger;
    const payload: ScientificTraceForensicPayload = {
      contract: "SCIENTIFIC_TRACE_FORENSIC_PAYLOAD",
      contractVersion: "1.0.0",
      allowlisted: true,
      redactionApplied: true,
      fields: [{ field: "VALIDATOR_INPUT", source: "SYNTHETIC_REDACTED_TEST", classification: "REDACTED", value: "[REDACTED]" }],
    };
    const startedAt = performance.now();
    ledger = appendProductTraceStage({
      ledger,
      traceRunId: forensicTraceRunId,
      timestamp: OBSERVED_AT,
      status: "OBSERVED",
      owner: "VAL",
      envelope: {
        stage: "VAL_REQUEST",
        responsibilityOwner: "VAL",
        decisionOwner: "NOT_APPLICABLE",
        executor: "VAL-TRACE-STRUCTURAL-001",
        provider: "NONE",
        componentId: "VAL-TRACE-STRUCTURAL-001",
        componentVersion: "1.0.0",
        forensicPayload: payload,
      },
    }).ledger;
    const projection = buildTraceInspectorRunProjection({ ledger, traceRunId: forensicTraceRunId });
    const forensicLoad = performance.now() - startedAt;
    expect(projection.events.at(-1)?.forensic).toEqual(expect.arrayContaining([expect.objectContaining({ classification: "REDACTED", value: "[REDACTED]" })]));
    expect(JSON.stringify(projection)).not.toMatch(/API_KEY|AUTH_HEADER|UNREDACTED_CREDENTIAL|Authorization:/);
    const ledgerBefore = JSON.stringify(ledger);
    render(<TraceInspector ledger={ledger} />);
    expect(screen.getByTestId("trace-inspector")).toHaveTextContent("CAPTURE_LEVEL=LEVEL_3_FORENSIC · VIEW_LEVEL=SUMMARY");
    fireEvent.click(screen.getByRole("button", { name: "FORENSIC_DETAILS" }));
    expect(screen.queryByText("[REDACTED]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Afficher les données forensic autorisées" }));
    expect(screen.getByTestId("trace-inspector-forensic-view")).toHaveTextContent("[REDACTED]");
    expect(JSON.stringify(ledger)).toBe(ledgerBefore);
    expect(runtime.request).not.toHaveBeenCalled();
    expect(() => appendProductTraceStage({
      ledger,
      traceRunId: forensicTraceRunId,
      timestamp: OBSERVED_AT,
      status: "OBSERVED",
      owner: "VAL",
      envelope: {
        stage: "VAL_RESULT",
        responsibilityOwner: "VAL",
        decisionOwner: "NOT_APPLICABLE",
        executor: "VAL-TRACE-STRUCTURAL-001",
        componentId: "VAL-TRACE-STRUCTURAL-001",
        forensicPayload: {
          contract: "SCIENTIFIC_TRACE_FORENSIC_PAYLOAD",
          contractVersion: "1.0.0",
          allowlisted: true,
          redactionApplied: false,
          fields: [{ field: "VALIDATOR_OUTPUT", source: "NEGATIVE_SECURITY_TEST", classification: "NON_SENSITIVE", value: "Authorization: Bearer forbidden-secret" }],
        },
      },
    })).toThrow("SCIENTIFIC_TRACE_SECRET_MATERIAL_FORBIDDEN");
    expect(forensicLoad).toBeLessThan(250);
    console.info(`P1_TRACE_02C_FORENSIC_INSPECTOR_LOAD_MS=${forensicLoad.toFixed(3)}`);
    console.info(`P1_TRACE_02C_FORENSIC_EVENT_COUNT=${projection.eventCount}`);
    console.info(`P1_TRACE_02C_FORENSIC_SERIALIZED_SIZE=${new TextEncoder().encode(JSON.stringify(projection)).byteLength}`);
  });

  it("qualifies one deterministic run through explicit HTML export and a visible stale transition", async () => {
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: COLCHICINE_03A_INITIAL } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByRole("heading", { name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude." });
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    const projectPanel = screen.getByTestId("functional-research-project");
    await waitFor(() => expect(within(projectPanel).getByRole("button", { name: "Créer l’aperçu" })).toBeEnabled());
    fireEvent.click(within(projectPanel).getByRole("button", { name: "Créer l’aperçu" }));
    const preview = await screen.findByTestId("functional-protocol-preview");
    expect(storedSession().scientificExecutionTraceLedger.events.map((event) => event.common?.stage)).not.toContain("ARTIFACT_GENERATED");
    fireEvent.click(within(preview).getByRole("button", { name: "Télécharger le protocole (.html)" }));
    await waitFor(() => expect(storedSession().scientificExecutionTraceLedger.events.map((event) => event.common?.stage)).toContain("ARTIFACT_GENERATED"));

    const stored = storedSession();
    const traceRunId = stored.bridgeTraces[0]?.traceRunId;
    const project = stored.project!;
    const projection = stored.documents.projections[0]!;
    expect(traceRunId).toBeTruthy();
    const revisedVersion = `${project.versionId}:p1-trace-02c-revision`;
    const revisedDigest = `${project.projectDigest}:p1-trace-02c-revision`;
    let qualifiedLedger = appendProductTraceStage({
      ledger: stored.scientificExecutionTraceLedger,
      traceRunId: traceRunId!,
      timestamp: "2026-08-29T18:01:00.000Z",
      status: "REVISED",
      owner: "RESEARCH_PROJECT",
      envelope: {
        stage: "PROJECT_VERSION_REVISED",
        responsibilityOwner: "RESEARCH_PROJECT",
        decisionOwner: "HUMAN",
        executor: "P1_TRACE_02C_DETERMINISTIC_REPLAY",
        provider: "NONE",
        componentId: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
        componentVersion: project.contractVersion,
        input: [{ ref: project.projectId, version: project.versionId, digest: project.projectDigest }],
        output: [{ ref: project.projectId, version: revisedVersion, digest: revisedDigest }],
        reasonCode: "DETERMINISTIC_REPLAY_PROJECT_REVISION",
        project: { projectId: project.projectId, projectVersion: revisedVersion, projectDigest: revisedDigest, snapshotRef: revisedDigest },
        documentProjectionId: projection.projectionId,
      },
    }).ledger;
    qualifiedLedger = appendProductTraceStage({
      ledger: qualifiedLedger,
      traceRunId: traceRunId!,
      timestamp: "2026-08-29T18:01:00.001Z",
      status: "STALE",
      owner: "DOC",
      envelope: {
        stage: "STALE_MARKED",
        responsibilityOwner: "DOC-001",
        decisionOwner: "NOT_APPLICABLE",
        executor: "FUNCTIONAL_RESET_DOCUMENT_BOUNDARY",
        provider: "NONE",
        componentId: "DOC-001",
        componentVersion: projection.contractVersion,
        input: [{ ref: projection.projectionId, version: projection.projectionVersion, digest: projection.projectionDigest }],
        output: [{ ref: project.projectId, version: revisedVersion, digest: revisedDigest }],
        reasonCode: "SOURCE_PROJECT_VERSION_CHANGED",
        project: { projectId: project.projectId, projectVersion: revisedVersion, projectDigest: revisedDigest, snapshotRef: revisedDigest },
        documentProjectionId: projection.projectionId,
      },
    }).ledger;

    const inspected = buildTraceInspectorRunProjection({ ledger: qualifiedLedger, traceRunId: traceRunId! });
    const stages = inspected.events.map((event) => event.stage);
    expect(new Set(qualifiedLedger.events.filter((event) => event.runId === traceRunId).map((event) => event.runId))).toEqual(new Set([traceRunId]));
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
      "PROJECT_VERSION_REVISED",
      "STALE_MARKED",
    ]));
    expect(stages.indexOf("ARTIFACT_GENERATED")).toBeGreaterThan(stages.indexOf("UI_PROJECTION"));
    expect(stages.indexOf("STALE_MARKED")).toBeGreaterThan(stages.indexOf("ARTIFACT_GENERATED"));
    expect(inspected.events.find((event) => event.stage === "ARTIFACT_GENERATED")?.inputRefs[0]).toMatchObject({ ref: projection.projectionId });
    expect(inspected.events.find((event) => event.stage === "STALE_MARKED")?.status).toBe("STALE");
    expect(inspected.events).toHaveLength(21);
    expect(inspected.diagnostics.some((finding) => finding.code === "TRACE_CHAIN_BREAK")).toBe(false);
    expect(JSON.stringify(stored.project)).toBe(JSON.stringify(project));

    const sessionBeforeInspector = JSON.stringify(stored);
    cleanup();
    render(<TraceInspector ledger={qualifiedLedger} />);
    expect(screen.getByTestId("trace-inspector-summary-view")).toHaveTextContent("STALE_MARKED");
    fireEvent.click(screen.getByTestId("trace-event-STALE_MARKED").querySelector("summary")!);
    expect(screen.getByTestId("trace-event-STALE_MARKED")).toHaveTextContent("SOURCE_PROJECT_VERSION_CHANGED");
    expect(JSON.stringify(stored)).toBe(sessionBeforeInspector);
    expect(buildTraceInspectorRunProjection({ ledger: qualifiedLedger, traceRunId: traceRunId! })).toEqual(inspected);
  });

  it("executes the complete bounded structural-rule set as deterministic VAL diagnostics", () => {
    const traceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02c-structural-rules");
    let ledger = startProductTraceRun({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId,
      turnId: "turn:p1-trace-02c-structural-rules",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "structural-rule-source-digest",
      captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "OTHER" }),
    }).ledger;
    ledger = appendProductTraceStage({
      ledger,
      traceRunId,
      timestamp: OBSERVED_AT,
      status: "SELECTED",
      owner: "PRODUCT_ENTRY_ROUTER",
      envelope: {
        stage: "ROUTE_SELECTED",
        responsibilityOwner: "PRODUCT_ENTRY_ROUTER",
        decisionOwner: "PRODUCT_ENTRY_ROUTER",
        executor: "PRODUCT_ENTRY_ROUTER",
        componentId: "SYNTHETIC_STRUCTURAL_RULE_TEST",
        output: [{ ref: "shared-ref", version: "1", digest: "digest-v1" }],
      },
    }).ledger;
    ledger = appendProductTraceStage({
      ledger,
      traceRunId,
      timestamp: OBSERVED_AT,
      status: "ASK_QUESTION",
      owner: "CONVERSATION_MODEL",
      envelope: {
        stage: "INFORMATION_NEED_SELECTED",
        responsibilityOwner: "GEMINI_CONVERSATION_MODEL",
        decisionOwner: "UNKNOWN",
        executor: "GEMINI_CONVERSATION_MODEL",
        componentId: "SYNTHETIC_STRUCTURAL_RULE_TEST",
        upstreamEventId: "missing-upstream-event",
        input: [{ ref: "shared-ref", version: "2", digest: "digest-v2" }],
        semanticTransformation: {
          contract: "SCIENTIFIC_TRACE_SEMANTIC_TRANSFORMATION",
          contractVersion: "1.0.0",
          transformationSource: "COMPONENT_DECLARATION",
          inputDimensions: [{ dimensionId: "known-dimension", source: "SYNTHETIC", status: "PRESENT", reasonCode: "EXPLICIT" }],
          outputDimensions: [{ dimensionId: "known-dimension", source: "SYNTHETIC", status: "NOT_PRESENT", reasonCode: "UNKNOWN" }],
          retainedDimensions: [],
          transformedDimensions: [],
          droppedDimensions: [{ dimensionId: "known-dimension", source: "SYNTHETIC", status: "NOT_PRESENT", reasonCode: "UNKNOWN" }],
          transformationReason: "UNKNOWN",
          dropReason: "UNKNOWN",
        },
        actionDecision: {
          contract: "SCIENTIFIC_TRACE_ACTION_DECISION",
          contractVersion: "1.0.0",
          declarationSource: "COMPONENT_DECLARATION",
          askVsPropose: "ASK_QUESTION",
          selectedInformationNeed: "known-dimension",
          whySelected: "SYNTHETIC_RULE_COVERAGE",
          expectedInformationGain: "UNKNOWN",
          alreadyProvidedInformationRefs: ["known-dimension"],
          candidateAlternatives: [],
          rejectedAlternatives: [],
          rejectionReasons: [],
        },
      },
    }).ledger;
    const inspected = buildTraceInspectorRunProjection({ ledger, traceRunId });
    expect(inspected.diagnostics.map((finding) => finding.code)).toEqual(expect.arrayContaining([
      "TRACE_CHAIN_BREAK",
      "VERSION_OR_DIGEST_DISCONTINUITY",
      "MISSING_DECISION_OWNER",
      "UNEXPLAINED_DIMENSION_LOSS",
      "MISSING_TRANSFORMATION_REASON",
      "ALREADY_PROVIDED_INFORMATION_REASKED",
      "DECISION_OWNERSHIP_MISMATCH",
    ]));
    expect(inspected.diagnostics.every((finding) => finding.diagnosticId.startsWith("VAL-TRACE-D-")
      && finding.ruleId.startsWith("VAL-TRACE-R")
      && finding.evidenceEventIds.length > 0)).toBe(true);
  });
});

function storedSessionFallback(): FunctionalResetSession {
  return createFunctionalResetSession(OBSERVED_AT);
}
