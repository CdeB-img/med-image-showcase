import { describe, expect, it, vi } from "vitest";
import { executeOpenAITerraConversation } from "../../../../../api/protocol-designer-openai-extraction-provider";
import { materializeProviderCallRecord, providerCallRequestObservability,
  readDurableProviderFailureDiagnostic } from "../../provider-call-observability";
import { createProductTraceRunId, createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration, listScientificRunEvents } from "../../scientific-execution-trace";
import { recordProductErrorBoundary } from "../end-to-end-trace-adapter";

const diagnostic = readDurableProviderFailureDiagnostic({
  contract: "DURABLE_PROVIDER_TERMINAL_FAILURE",
  clientRequestId: "synthetic-request", operationKey: "a".repeat(64),
  sessionId: "synthetic-session", turnId: "synthetic-turn", providerCallId: "synthetic-provider-call",
  generationProvider: "AZURE_OPENAI", phase: "BODY_READ",
  precountStarted: true, precountCompleted: true, reservationConfirmed: true,
  dispatchAttempted: true, headersReceived: true, bodyRead: false,
  inputCountHttpStatus: 200, providerHttpStatus: 200, providerResponseStatus: "UNKNOWN",
  incompleteReason: null, structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
  safeExceptionClass: "TypeError", abortSignalAborted: false,
  lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH",
  rawMessage: "SECRET_PROVIDER_BODY_SHOULD_NOT_LEAK",
});

describe("durable provider terminal failure through existing TRACE-02", () => {
  it("keeps the original product failure while carrying the durable cause through Working Draft observability", async () => {
    const records: ReturnType<typeof materializeProviderCallRecord>[] = [];
    const thrown = Object.assign(new Error("Untrusted raw message"), { providerFailureDiagnostic: diagnostic });
    const fetchImpl = vi.fn<typeof fetch>(async () => { throw thrown; });
    await expect(executeOpenAITerraConversation({ instruction: "synthetic", context: "synthetic" },
      "synthetic-only", fetchImpl, {
        context: { sessionId: "synthetic-session", conversationId: "synthetic-conversation",
          turnId: "synthetic-turn", clientRequestId: "synthetic-request", testSessionId: null },
        purpose: "CONVERSATION_REALIZATION", reasoningEffort: "medium", retryIndex: 0,
        retryReason: null, onRecord: record => records.push(record),
      })).rejects.toMatchObject({ providerStatus: "NETWORK_FAILURE" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ status: "FAILED", failureReason: "NETWORK_FAILURE",
      durableFailure: { phase: "BODY_READ", structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
        headersReceived: true, providerHttpStatus: 200, lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH" } });
    expect(JSON.parse(JSON.stringify(providerCallRequestObservability(records))).providerCalls[0].durableFailure)
      .toMatchObject({ phase: "BODY_READ", structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" });
    expect(JSON.stringify(records)).not.toContain("Untrusted raw message");
  });

  it("sanitizes the diagnostic and keeps its structured code in ProviderCallRecord", () => {
    expect(diagnostic).not.toBeNull();
    expect(JSON.stringify(diagnostic)).not.toContain("SECRET_PROVIDER_BODY_SHOULD_NOT_LEAK");
    expect(readDurableProviderFailureDiagnostic({ ...diagnostic, structuredErrorCode: "QUALIFICATION_INVALID" })
      ?.structuredErrorCode).toBe("QUALIFICATION_INVALID");
    expect(readDurableProviderFailureDiagnostic({ ...diagnostic, structuredErrorCode: "Authorization: Bearer secret" })
      ?.structuredErrorCode).toBeNull();
    const record = materializeProviderCallRecord({
      provider: "OPENAI", modelRequested: "gpt-5.6-sol", modelReturned: null,
      instrumentation: { context: { sessionId: "synthetic-session", conversationId: "synthetic-conversation",
        turnId: "synthetic-turn", clientRequestId: "synthetic-request", testSessionId: null },
      purpose: "CONVERSATION_REALIZATION", reasoningEffort: "medium", retryIndex: 0, retryReason: null, onRecord: () => {} },
      usage: { inputTokens: null, cachedInputTokens: null, cacheWriteTokens: null,
        outputTokens: null, reasoningTokens: null, totalTokens: null },
      latencyMs: 2, status: "FAILED", failureReason: "NETWORK_FAILURE",
      providerRequestId: null, providerResponseId: null,
      startedAt: "2026-09-25T12:00:00.000Z", completedAt: "2026-09-25T12:00:01.000Z",
      durableFailure: diagnostic,
    });
    expect(record.failureReason).toBe("NETWORK_FAILURE"); // public behavior remains unchanged
    expect(record.durableFailure).toMatchObject({ phase: "BODY_READ",
      structuredErrorCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH",
      headersReceived: true, providerHttpStatus: 200 });
  });

  it.each(["LEVEL_1_CORE", "LEVEL_2_DIAGNOSTIC", "LEVEL_3_FORENSIC"] as const)(
    "records one safe ERROR_BOUNDARY at %s", (captureLevel) => {
      const sessionId = "synthetic-session";
      const turnId = `synthetic-turn-${captureLevel}`;
      const traceRunId = createProductTraceRunId(sessionId, turnId);
      const ledger = recordProductErrorBoundary({
        ledger: createScientificExecutionTraceLedger(sessionId), traceRunId, turnId,
        conversationId: "synthetic-conversation", startedAt: "2026-09-25T12:00:00.000Z",
        failedAt: "2026-09-25T12:00:01.000Z", owner: "CONVERSATION_MODEL",
        responsibilityOwner: "DURABLE_PROVIDER_GUARD", executor: "POSTGRES_DURABLE_PROVIDER_GUARD",
        componentId: "WORKING_DRAFT_PROVIDER_OPERATION", componentVersion: "1.0.0",
        provider: "AZURE_OPENAI", code: diagnostic!.structuredErrorCode!, category: "OWNER_RUNTIME",
        durableFailure: diagnostic,
        captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel }),
      });
      const events = listScientificRunEvents({ ledger, runId: traceRunId }).filter(event => event.eventType === "ERROR_BOUNDARY");
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ eventType: "ERROR_BOUNDARY", status: "FAILED",
        common: { reasonCode: "PUBLIC_PROVIDER_RESULT_UNKNOWN_AFTER_DISPATCH" } });
      expect(events[0].technicalMetadata).toMatchObject({ boundedStatus: "BODY_READ" });
      expect(JSON.stringify(events)).not.toContain("SECRET_PROVIDER_BODY_SHOULD_NOT_LEAK");
      if (captureLevel === "LEVEL_1_CORE") {
        expect(events[0].technicalMetadata).not.toHaveProperty("lastConfirmedDurableState");
        expect(events[0].common?.forensicPayload).toBeUndefined();
      } else {
        expect(events[0].technicalMetadata).toMatchObject({ lastConfirmedDurableState: "UNKNOWN_AFTER_DISPATCH",
          dispatchAttempted: true, headersReceived: true, bodyRead: false });
        if (captureLevel === "LEVEL_3_FORENSIC") {
          expect(JSON.stringify(events[0].common?.forensicPayload)).toContain("TypeError");
          expect(JSON.stringify(events[0].common?.forensicPayload)).toContain("abortSignalAborted");
        } else expect(events[0].common?.forensicPayload).toBeUndefined();
      }
    },
  );
});
