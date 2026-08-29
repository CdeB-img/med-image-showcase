import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  naturalConversationContext,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  LEGACY_END_TO_END_TRACE_PROFILE_VERSION,
  LEGACY_TRACE_CAPTURE_POLICY_ID,
  LEGACY_TRACE_REDACTION_POLICY_ID,
  LEGACY_TRACE_RETENTION_POLICY_ID,
  appendProductTraceStage,
  captureProductBridgeTraceText,
  createPreProjectScientificTraceSegment,
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  listEndToEndTraceEvents,
  recordPreProjectScientificTraceSegment,
  rehydrateScientificExecutionTraceLedger,
  startProductTraceRun,
  type PreProjectTraceDimensionProbe,
  type ScientificExecutionTraceEvent,
  type ScientificExecutionTraceLedger,
  type ScientificProductTraceCommonEnvelope,
  type ScientificTraceCaptureConfiguration,
  type ScientificTraceForensicPayload,
} from "@/features/protocol-designer/scientific-execution-trace";
import { routeProductEntry } from "../product-entry-routing";

const CEC_INPUT = "Je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";
const CEC_RESPONSE = "Je comprends que vous souhaitez explorer les atteintes myocardiques après circulation extracorporelle en comparant l'élévation de la troponine à des observations en IRM cardiaque. Pour préciser la structure de votre étude, cherchez-vous à identifier de véritables lésions tissulaires irréversibles en rehaussement tardif, ou à quantifier des modifications globales et diffuses de la matrice extracellulaire via l'ECV ?";
const SESSION_ID = "protocol-designer-session:p1-trace-02b";
const CONVERSATION_ID = "scientific-conversation:p1-trace-02b";
const OBSERVED_AT = "2026-08-29T12:00:00.000Z";
const PRODUCT_TURN_ID = "turn:p1-trace-02b-product-input";
const CORE_TURN_ID = "turn:p1-trace-02b-core";
const DIAGNOSTIC_TURN_ID = "turn:p1-trace-02b-diagnostic";

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

const request: Omit<ProductBridgeRequest, "apiVersion"> = {
  requestKind: "USER_TURN",
  conversation: {
    conversationId: CONVERSATION_ID,
    language: "fr",
    turns: [{ turnId: PRODUCT_TURN_ID, role: "USER", content: CEC_INPUT, createdAt: OBSERVED_AT }],
  },
  currentProject: null,
  evaluatePersistentDelta: false,
};
const routing = routeProductEntry({ raw: CEC_INPUT, sourceTurnRef: PRODUCT_TURN_ID, routedAt: OBSERVED_AT });
const productResult = Object.freeze({ routing, visibleResponse: CEC_RESPONSE, project: null, qry: null, document: null });

const segmentFor = (input: {
  traceRunId: string;
  sourceTurnRef: string;
  captureConfiguration: ScientificTraceCaptureConfiguration;
}) => createPreProjectScientificTraceSegment({
  sessionId: SESSION_ID,
  sourceTurnRef: input.sourceTurnRef,
  traceRunId: input.traceRunId,
  sourceText: CEC_INPUT,
  routing,
  request,
  providerBoundary: {
    systemInstruction: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
    context: naturalConversationContext(request),
    assistantReply: CEC_RESPONSE,
    provider: "GOOGLE_GEMINI",
    model: "RECORDED_REPLAY_NO_PROVIDER_CALL",
  },
  diagnosticDimensionProbes: DIMENSION_PROBES,
  captureConfiguration: input.captureConfiguration,
});

const runEvents = (ledger: Readonly<ScientificExecutionTraceLedger>, traceRunId: string) => listEndToEndTraceEvents({
  ledger,
  traceRunId,
});

const stableEventSemantics = (event: ScientificProductTraceCommonEnvelope) => ({
  stage: event.stage,
  responsibilityOwner: event.responsibilityOwner,
  decisionOwner: event.decisionOwner,
  executor: event.executor,
  provider: event.provider,
  component: event.component,
  input: event.input,
  output: event.output,
  status: event.status,
  reasonCode: event.reasonCode,
  projectId: event.projectId,
  projectVersion: event.projectVersion,
  documentProjectionId: event.documentProjectionId,
  artifactId: event.artifactId,
});

describe("P1-TRACE-02B — capture levels and progressive escalation", () => {
  it("replays CEC at CORE then DIAGNOSTIC with explicit lineage, additive enrichment and identical product behavior", () => {
    const coreTraceRunId = createProductTraceRunId(SESSION_ID, CORE_TURN_ID);
    const diagnosticTraceRunId = createProductTraceRunId(SESSION_ID, DIAGNOSTIC_TURN_ID);
    const coreConfiguration = createScientificTraceCaptureConfiguration();
    const diagnosticConfiguration = createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_2_DIAGNOSTIC",
      captureReason: "REPLAY_AFTER_INSUFFICIENT_TRACE",
      replayOfTraceRunId: coreTraceRunId,
    });

    const coreStart = performance.now();
    const coreRecorded = recordPreProjectScientificTraceSegment({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId: coreTraceRunId,
      conversationId: CONVERSATION_ID,
      segment: segmentFor({ traceRunId: coreTraceRunId, sourceTurnRef: CORE_TURN_ID, captureConfiguration: coreConfiguration }),
      observedAt: OBSERVED_AT,
    });
    const coreOverheadMs = performance.now() - coreStart;
    const diagnosticStart = performance.now();
    const diagnosticRecorded = recordPreProjectScientificTraceSegment({
      ledger: coreRecorded.ledger,
      traceRunId: diagnosticTraceRunId,
      conversationId: CONVERSATION_ID,
      segment: segmentFor({ traceRunId: diagnosticTraceRunId, sourceTurnRef: DIAGNOSTIC_TURN_ID, captureConfiguration: diagnosticConfiguration }),
      observedAt: OBSERVED_AT,
    });
    const diagnosticOverheadMs = performance.now() - diagnosticStart;

    const coreEvents = runEvents(diagnosticRecorded.ledger, coreTraceRunId);
    const diagnosticEvents = runEvents(diagnosticRecorded.ledger, diagnosticTraceRunId);
    const expectedStages = [
      "USER_TURN_RECEIVED",
      "ROUTE_SELECTED",
      "INTENT_REPRESENTED",
      "INFORMATION_NEED_SELECTED",
      "QUESTION_REALIZATION_REQUESTED",
      "QUESTION_REALIZED",
    ];
    expect(coreEvents.map((event) => event.stage)).toEqual(expectedStages);
    expect(diagnosticEvents.map((event) => event.stage)).toEqual(expectedStages);
    expect(coreEvents.every((event) => event.captureLevel === "LEVEL_1_CORE")).toBe(true);
    expect(coreEvents.every((event) => !event.semanticTransformation && !event.actionDecision && !event.forensicPayload)).toBe(true);
    expect(diagnosticEvents.every((event) => event.captureLevel === "LEVEL_2_DIAGNOSTIC")).toBe(true);
    expect(diagnosticEvents.every((event) => event.replayOfTraceRunId === coreTraceRunId)).toBe(true);
    expect(diagnosticEvents.some((event) => event.semanticTransformation)).toBe(true);
    expect(diagnosticEvents.find((event) => event.stage === "INFORMATION_NEED_SELECTED")?.actionDecision).toMatchObject({
      declarationSource: "LEGACY_ADAPTER",
      askVsPropose: "ASK_QUESTION",
      expectedInformationGain: "UNKNOWN",
    });
    const realizationRequest = diagnosticEvents.find((event) => event.stage === "QUESTION_REALIZATION_REQUESTED");
    expect(realizationRequest?.semanticTransformation?.droppedDimensions.map((item) => item.dimensionId)).toContain("contractilite");
    expect(realizationRequest?.semanticTransformation?.retainedDimensions.map((item) => item.dimensionId)).toEqual(expect.arrayContaining(["lge", "ecv"]));
    expect(realizationRequest?.semanticTransformation?.dropReason).toBe("UNKNOWN");
    expect(realizationRequest?.decisionOwner).toBe("GEMINI_CONVERSATION_MODEL");
    expect(diagnosticEvents.find((event) => event.semanticTransformation?.droppedDimensions
      .some((dimension) => dimension.dimensionId === "contractilite"))?.stage).toBe("INTENT_REPRESENTED");
    expect(diagnosticEvents.every((event) => !event.forensicPayload)).toBe(true);
    expect(diagnosticRecorded.ledger.runBindings.find((binding) => binding.runId === diagnosticTraceRunId)?.captureConfiguration).toEqual(diagnosticConfiguration);
    expect(JSON.stringify(productResult)).toBe(JSON.stringify({ routing, visibleResponse: CEC_RESPONSE, project: null, qry: null, document: null }));
    expect(JSON.stringify(coreEvents)).not.toContain(CEC_INPUT);
    expect(JSON.stringify(diagnosticEvents)).not.toContain(CEC_INPUT);

    const coreBytes = new TextEncoder().encode(JSON.stringify(coreEvents)).byteLength;
    const diagnosticBytes = new TextEncoder().encode(JSON.stringify(diagnosticEvents)).byteLength;
    expect(diagnosticBytes).toBeGreaterThan(coreBytes);
    expect(coreOverheadMs).toBeLessThan(250);
    expect(diagnosticOverheadMs).toBeLessThan(250);
    console.info(`P1_TRACE_02B_CORE_EVENT_COUNT=${coreEvents.length}`);
    console.info(`P1_TRACE_02B_DIAGNOSTIC_EVENT_COUNT=${diagnosticEvents.length}`);
    console.info(`P1_TRACE_02B_CORE_SERIALIZED_BYTES=${coreBytes}`);
    console.info(`P1_TRACE_02B_DIAGNOSTIC_SERIALIZED_BYTES=${diagnosticBytes}`);
    console.info(`P1_TRACE_02B_CORE_OVERHEAD_MS=${coreOverheadMs.toFixed(3)}`);
    console.info(`P1_TRACE_02B_DIAGNOSTIC_OVERHEAD_MS=${diagnosticOverheadMs.toFixed(3)}`);
  });

  it("activates FORENSIC only explicitly on a synthetic technical replay and preserves stage semantics", () => {
    const coreTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02b-synthetic-core");
    const forensicTraceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02b-synthetic-forensic");
    const baseEnvelope = {
      stage: "ROUTE_SELECTED" as const,
      responsibilityOwner: "PRODUCT_ENTRY_ROUTER",
      decisionOwner: "PRODUCT_ENTRY_ROUTER",
      executor: "PRODUCT_ENTRY_ROUTER",
      provider: "NONE",
      componentId: "SYNTHETIC_TECHNICAL_COMPONENT",
      componentVersion: "1.0.0",
      input: [{ ref: "synthetic-input", version: "1.0.0", digest: "synthetic-input-digest" }],
      output: [{ ref: "synthetic-output", version: "1.0.0", digest: "synthetic-output-digest" }],
      reasonCode: "SYNTHETIC_ROUTE_SELECTED",
      completedAt: OBSERVED_AT,
      conversationId: CONVERSATION_ID,
    };
    let ledger = startProductTraceRun({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId: coreTraceRunId,
      turnId: "turn:p1-trace-02b-synthetic-core",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "synthetic-source-digest",
    }).ledger;
    const coreStage = appendProductTraceStage({
      ledger,
      traceRunId: coreTraceRunId,
      timestamp: OBSERVED_AT,
      status: "SELECTED",
      owner: "PRODUCT_ENTRY_ROUTER",
      durationMs: 0,
      envelope: baseEnvelope,
    });
    ledger = coreStage.ledger;
    const forensicConfiguration = createScientificTraceCaptureConfiguration({
      captureLevel: "LEVEL_3_FORENSIC",
      captureReason: "REPLAY_AFTER_INSUFFICIENT_TRACE",
      replayOfTraceRunId: coreTraceRunId,
    });
    ledger = startProductTraceRun({
      ledger,
      traceRunId: forensicTraceRunId,
      turnId: "turn:p1-trace-02b-synthetic-forensic",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "synthetic-source-digest",
      captureConfiguration: forensicConfiguration,
    }).ledger;
    const payload: ScientificTraceForensicPayload = {
      contract: "SCIENTIFIC_TRACE_FORENSIC_PAYLOAD",
      contractVersion: "1.0.0",
      allowlisted: true,
      redactionApplied: false,
      fields: [{
        field: "VALIDATOR_INPUT",
        source: "SYNTHETIC_TECHNICAL_TEST",
        classification: "NON_SENSITIVE",
        value: "synthetic-validator-input:alpha",
      }],
    };
    const forensicStart = performance.now();
    const forensicStage = appendProductTraceStage({
      ledger,
      traceRunId: forensicTraceRunId,
      timestamp: OBSERVED_AT,
      status: "SELECTED",
      owner: "PRODUCT_ENTRY_ROUTER",
      durationMs: 0,
      envelope: { ...baseEnvelope, forensicPayload: payload },
    });
    const forensicOverheadMs = performance.now() - forensicStart;
    expect(forensicStage.event.common?.captureLevel).toBe("LEVEL_3_FORENSIC");
    expect(forensicStage.event.common?.replayOfTraceRunId).toBe(coreTraceRunId);
    expect(forensicStage.event.common?.forensicPayload).toEqual(payload);
    expect(stableEventSemantics(forensicStage.event.common!)).toEqual(stableEventSemantics(coreStage.event.common!));
    expect(forensicOverheadMs).toBeLessThan(250);
    const forensicEvents = runEvents(forensicStage.ledger, forensicTraceRunId);
    console.info(`P1_TRACE_02B_FORENSIC_EVENT_COUNT=${forensicEvents.length}`);
    console.info(`P1_TRACE_02B_FORENSIC_SERIALIZED_BYTES=${new TextEncoder().encode(JSON.stringify(forensicEvents)).byteLength}`);
    console.info(`P1_TRACE_02B_FORENSIC_OVERHEAD_MS=${forensicOverheadMs.toFixed(3)}`);
  });

  it("rejects secrets, API keys, authorization headers and non-allowlisted forensic classifications", () => {
    const traceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02b-security");
    const configuration = createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_3_FORENSIC", captureReason: "OTHER" });
    const started = startProductTraceRun({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId,
      turnId: "turn:p1-trace-02b-security",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "synthetic-source-digest",
      captureConfiguration: configuration,
    });
    const appendUnsafe = (value: string, classification: string = "NON_SENSITIVE") => appendProductTraceStage({
      ledger: started.ledger,
      traceRunId,
      timestamp: OBSERVED_AT,
      status: "SELECTED",
      owner: "PRODUCT_ENTRY_ROUTER",
      envelope: {
        stage: "ROUTE_SELECTED",
        responsibilityOwner: "PRODUCT_ENTRY_ROUTER",
        decisionOwner: "PRODUCT_ENTRY_ROUTER",
        executor: "SYNTHETIC_TECHNICAL_COMPONENT",
        componentId: "SYNTHETIC_TECHNICAL_COMPONENT",
        forensicPayload: {
          contract: "SCIENTIFIC_TRACE_FORENSIC_PAYLOAD",
          contractVersion: "1.0.0",
          allowlisted: true,
          redactionApplied: false,
          fields: [{ field: "VALIDATOR_INPUT", source: "SYNTHETIC_TECHNICAL_TEST", classification, value }],
        } as unknown as ScientificTraceForensicPayload,
      },
    });
    expect(() => appendUnsafe("sk-secretmaterial123456")).toThrow("SCIENTIFIC_TRACE_SECRET_MATERIAL_FORBIDDEN");
    expect(() => appendUnsafe("Authorization: Basic dXNlcjpwYXNz")).toThrow("SCIENTIFIC_TRACE_SECRET_MATERIAL_FORBIDDEN");
    expect(() => appendUnsafe("safe-value", "SENSITIVE")).toThrow("SCIENTIFIC_TRACE_CAPTURE_EXTENSION_INVALID");
    expect(captureProductBridgeTraceText({ value: CEC_INPUT, field: "SOURCE_TEXT" })).toMatch(/^\[MINIMIZED:SOURCE_TEXT:/);
    expect(captureProductBridgeTraceText({
      value: CEC_RESPONSE,
      field: "ASSISTANT_REPLY",
      captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "MANUAL_DIAGNOSTIC" }),
    })).toMatch(/^\[MINIMIZED:ASSISTANT_REPLY:/);
    const redacted = captureProductBridgeTraceText({
      value: "Authorization: Bearer secretvalue123456 sk-secretmaterial123456",
      field: "PROVIDER_CONTEXT",
      captureConfiguration: configuration,
    });
    expect(redacted).toContain("[REDACTED]");
    expect(redacted).not.toContain("secretvalue123456");
    expect(redacted).not.toContain("sk-secretmaterial123456");
  });

  it("keeps profile 1.0 ledgers readable without rewriting them", () => {
    const traceRunId = createProductTraceRunId(SESSION_ID, "turn:p1-trace-02b-legacy");
    const current = startProductTraceRun({
      ledger: createScientificExecutionTraceLedger(SESSION_ID),
      traceRunId,
      turnId: "turn:p1-trace-02b-legacy",
      conversationId: CONVERSATION_ID,
      startedAt: OBSERVED_AT,
      sourceDigest: "legacy-source-digest",
    }).ledger;
    const legacy = structuredClone(current) as ScientificExecutionTraceLedger;
    legacy.traceProfile = {
      ...legacy.traceProfile!,
      profileVersion: LEGACY_END_TO_END_TRACE_PROFILE_VERSION,
      capturePolicyId: LEGACY_TRACE_CAPTURE_POLICY_ID,
      redactionPolicyId: LEGACY_TRACE_REDACTION_POLICY_ID,
      retentionPolicyId: LEGACY_TRACE_RETENTION_POLICY_ID,
    };
    legacy.runBindings.forEach((binding) => {
      const mutable = binding as unknown as {
        captureConfiguration?: ScientificTraceCaptureConfiguration;
        bindingDigest: string;
        [key: string]: unknown;
      };
      delete mutable.captureConfiguration;
      const { bindingDigest: _bindingDigest, ...material } = mutable;
      mutable.bindingDigest = logicalDigest(material);
    });
    legacy.events.forEach((event) => {
      const mutable = event as ScientificExecutionTraceEvent;
      if (mutable.common) {
        const common = mutable.common as ScientificProductTraceCommonEnvelope;
        common.contractVersion = LEGACY_END_TO_END_TRACE_PROFILE_VERSION;
        common.capturePolicyId = LEGACY_TRACE_CAPTURE_POLICY_ID;
        common.redactionPolicyId = LEGACY_TRACE_REDACTION_POLICY_ID;
        common.retentionPolicyId = LEGACY_TRACE_RETENTION_POLICY_ID;
        delete common.captureLevel;
        delete common.captureReason;
        delete common.replayOfTraceRunId;
      }
      const { eventDigest: _eventDigest, ...material } = mutable;
      mutable.eventDigest = logicalDigest(material);
    });
    const { ledgerDigest: _ledgerDigest, ...material } = legacy;
    legacy.ledgerDigest = logicalDigest(material);
    const serializedBefore = JSON.stringify(legacy);
    const rehydrated = rehydrateScientificExecutionTraceLedger(legacy);
    expect(JSON.stringify(rehydrated)).toBe(serializedBefore);
    expect(rehydrated.traceProfile?.profileVersion).toBe(LEGACY_END_TO_END_TRACE_PROFILE_VERSION);
  });
});
