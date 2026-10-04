import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import type { ProductBridgeRequest, ProductBridgeResponse } from "../../product-bridge";
import type { ConversationContextPacketPreflight } from "../../provider-call-observability";
import * as traceOwner from "../../scientific-execution-trace";
import * as traceAdapter from "../end-to-end-trace-adapter";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { declaredNonScientificRetentionFixture } from "./terra-result-fixture";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
const network = vi.fn(() => { throw new Error("NO_PROVIDER_IN_CONTEXT_PACKET_TRACE_TEST"); });
const AT = "2026-10-02T12:00:00.000Z";
const requestFor = (oversize = false): ProductBridgeRequest => ({ apiVersion: "1.0.0",
  conversation: { conversationId: "synthetic-context-trace", language: "fr",
    turns: [{ turnId: "synthetic-user", role: "USER", content: "LOCAL_SYNTHETIC_SCIENTIFIC_SENTINEL".repeat(oversize ? 3_000 : 1) }] },
  currentProject: null, evaluatePersistentDelta: false });
const receiptFor = (oversize = false) => {
  let receipt: ConversationContextPacketPreflight | undefined;
  try { prepareTerraConversation(requestFor(oversize), false, measurement => { receipt = measurement; }); }
  catch (error) { expect((error as Error).message).toBe("CONVERSATION_MEMORY_LIMIT"); }
  expect(receipt).toBeTruthy();
  return receipt!;
};
const traceInput = (oversize = false, level: traceOwner.ScientificTraceCaptureLevel = "LEVEL_2_DIAGNOSTIC") => ({
  ledger: traceOwner.createScientificExecutionTraceLedger("synthetic-session"), traceRunId: "synthetic-context-run",
  turnId: "synthetic-user", conversationId: "synthetic-context-trace", observedAt: AT,
  sourceDigest: logicalDigest("LOCAL_SYNTHETIC_SCIENTIFIC_SENTINEL"), measurement: receiptFor(oversize),
  captureConfiguration: traceOwner.createScientificTraceCaptureConfiguration({ captureLevel: level, captureReason: "OTHER" }),
});
beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
afterEach(() => { expect(network).not.toHaveBeenCalled(); cleanup(); bridge.mockReset(); localStorage.clear();
  vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("passive context packet projection through existing TRACE", () => {
  it.each(["LEVEL_1_CORE", "LEVEL_2_DIAGNOSTIC", "LEVEL_3_FORENSIC"] as const)("retains PASS and FAIL numeric evidence at %s", level => {
    for (const oversize of [false, true]) {
      const input = traceInput(oversize, level);
      const recorded = traceAdapter.recordConversationContextPacketPreflight(input);
      const event = recorded.events.find(event => event.common?.stage === "CONTEXT_PACKET_PREFLIGHT")!;
      expect(event).toBeTruthy();
      expect(event.status).toBe(oversize ? "FAILED" : "SUCCEEDED");
      expect(event.common).toMatchObject({ responsibilityOwner: "SCIENTIFIC_THINKING", provider: "NONE",
        executor: "PREPARE_TERRA_CONVERSATION", decisionOwner: "NOT_APPLICABLE" });
      expect(event.technicalMetadata).toMatchObject(input.measurement.status === "FAILED"
        ? { limitBytes: 80_000, packetTotalBytes: input.measurement.packetTotalBytes, internalErrorCode: "CONVERSATION_MEMORY_LIMIT" }
        : { limitBytes: 80_000, packetTotalBytes: input.measurement.packetTotalBytes });
      expect(JSON.stringify(recorded)).not.toContain("SCIENTIFIC_SENTINEL");
      const rehydrated = traceOwner.rehydrateScientificExecutionTraceLedger(JSON.parse(JSON.stringify(recorded)));
      expect(rehydrated.events).toEqual(recorded.events);
      expect(traceAdapter.recordConversationContextPacketPreflight({ ...input, ledger: recorded })).toBe(recorded);
      expect(input.ledger.events).toHaveLength(0);
    }
  });

  it("does not record arbitrary scientific fields, secrets, payloads or raw provider instructions", () => {
    const input = traceInput();
    const recorded = traceAdapter.recordConversationContextPacketPreflight({ ...input, measurement: { ...input.measurement,
      project: "PRIVATE_PROJECT_TEXT", instructions: "PRIVATE_INSTRUCTIONS", authorization: "Bearer FAKE_SECRET" } });
    expect(recorded.events.some(event => event.common?.stage === "CONTEXT_PACKET_PREFLIGHT")).toBe(true);
    for (const fragment of ["PRIVATE_PROJECT_TEXT", "PRIVATE_INSTRUCTIONS", "Bearer", "FAKE_SECRET"]) expect(JSON.stringify(recorded)).not.toContain(fragment);
  });

  it("does nothing when the diagnostic is missing or malformed", () => {
    const input = traceInput();
    for (const measurement of [undefined, null, {}, { ...input.measurement, userHistoryBytes: -1 }]) {
      expect(traceAdapter.recordConversationContextPacketPreflight({ ...input, measurement })).toBe(input.ledger);
    }
  });

  it("returns the original ledger if TRACE append fails; no product error or alternate ledger", () => {
    const input = traceInput();
    const append = vi.spyOn(traceOwner, "appendProductTraceStage").mockImplementation(() => { throw new Error("SYNTHETIC_TRACE_FAILURE"); });
    expect(traceAdapter.recordConversationContextPacketPreflight(input)).toBe(input.ledger);
    expect(append).toHaveBeenCalled();
  });

  it("saves pre-provider rejection evidence through the existing workspace/session persistence", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    const session = createFunctionalResetSession();
    session.runtimeTurns = Array.from({ length: 24 }, (_, i) => ({ turnId: `synthetic-old-${i}`, role: "NOXIA" as const,
      content: "LOCAL_SYNTHETIC_OLD_CONTENT".repeat(400), createdAt: AT }));
    session.scientificDiscussionRetention = declaredNonScientificRetentionFixture({ conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns });
    const historyBefore = JSON.stringify(session.runtimeTurns);
    const documentsBefore = JSON.stringify(session.documents);
    const projectBefore = session.project;
    bridge.mockImplementation(async (request: Omit<ProductBridgeRequest, "apiVersion">) => {
      const result = await executeProtocolDesignerBridge({ body: { ...request, apiVersion: "1.0.0" }, apiKey: null,
        openAiApiKey: "LOCAL_SYNTHETIC_KEY", chatRuntime: "TERRA", fetchImpl: network, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
      return result.body as ProductBridgeResponse;
    });
    const save = vi.fn((next: FunctionalResetSession) => { persistFunctionalResetSession(localStorage, next); return true; });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={save} /></HelmetProvider>);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "LOCAL_SYNTHETIC_NEW_TURN" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByText("Cette conversation dépasse la mémoire disponible. Son historique et le projet sont conservés.");
    await waitFor(() => expect(loadFunctionalResetSession(localStorage).scientificExecutionTraceLedger.events
      .some(event => event.common?.stage === "CONTEXT_PACKET_PREFLIGHT")).toBe(true));
    const saved = loadFunctionalResetSession(localStorage);
    const event = saved.scientificExecutionTraceLedger.events.find(event => event.common?.stage === "CONTEXT_PACKET_PREFLIGHT")!;
    expect(event.status).toBe("FAILED");
    expect(JSON.stringify(saved.runtimeTurns.slice(0, -1))).toBe(historyBefore);
    expect(saved.runtimeTurns.at(-1)?.content).toBe("LOCAL_SYNTHETIC_NEW_TURN");
    expect(saved.project).toEqual(projectBefore);
    expect(JSON.stringify(saved.documents)).toBe(documentsBefore);
    expect(saved.bridgeTraces.flatMap(trace => trace.providerCallRecords ?? [])).toHaveLength(0);
    expect(bridge).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(event)).not.toContain("LOCAL_SYNTHETIC_OLD_CONTENT");
  });

  it("an instrumentation exception in the workspace cannot suppress the received conversational response", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.spyOn(traceAdapter, "recordConversationContextPacketPreflight").mockImplementation(() => { throw new Error("SYNTHETIC_TRACE_FAILURE"); });
    const session = createFunctionalResetSession();
    const reply = "LOCAL_SYNTHETIC — réponse native conservée.";
    bridge.mockResolvedValue({ apiVersion: "1.0.0", assistantReply: reply,
      assistantTurn: { turnId: "synthetic-reply", role: "NOXIA", content: reply, createdAt: AT }, conversationFailure: null,
      persistentExtraction: { called: false, status: "NOT_REQUESTED", failure: null, providerArtifact: null, wireCandidate: null,
        candidate: null, validation: null, contribution: null },
      observability: { provider: "OPENAI", model: "LOCAL_SYNTHETIC", calls: 0, conversationCalls: 0, projectWrites: 0,
        extractionAttempts: 0, conversationLatencyMs: 0, extractionLatencyMs: null,
        conversationContextPacketPreflight: receiptFor() },
    } satisfies ProductBridgeResponse);
    const save = vi.fn((next: FunctionalResetSession) => { persistFunctionalResetSession(localStorage, next); return true; });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={session} onSessionChange={save} /></HelmetProvider>);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "LOCAL_SYNTHETIC_NEW_TURN" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByText(reply);
    await waitFor(() => expect(loadFunctionalResetSession(localStorage).runtimeTurns.at(-1)?.content).toBe(reply));
    expect(loadFunctionalResetSession(localStorage).project).toBeNull();
    expect(bridge).toHaveBeenCalledTimes(1);
  });
});
