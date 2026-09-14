import { describe, expect, it } from "vitest";
import { appendFunctionalResetProviderCallRecords, createFunctionalResetSession } from "../session";
import { emptyProviderTokenUsage, materializeProviderCallRecord } from "../../provider-call-observability";

const record = (turnId: string, priced = true) => materializeProviderCallRecord({
  provider: "OPENAI", modelRequested: "gpt-5.6-luna", modelReturned: "gpt-5.6-luna",
  instrumentation: {
    context: { sessionId: "session:test", conversationId: "conversation:test", turnId, clientRequestId: turnId, testSessionId: "session:test" },
    purpose: "LANGUAGE_PROJECTION", reasoningEffort: "low", retryIndex: 0, retryReason: null, onRecord: () => {},
  },
  usage: priced ? { ...emptyProviderTokenUsage(), inputTokens: 100, outputTokens: 100 } : emptyProviderTokenUsage(),
  latencyMs: 10, status: priced ? "SUCCEEDED" : "FAILED", failureReason: priced ? null : "INVALID_PROVIDER_JSON",
  providerRequestId: null, providerResponseId: null,
  startedAt: "2026-09-14T12:00:00.000Z", completedAt: "2026-09-14T12:00:00.010Z",
});

describe("Provider observation → existing persisted session trace", () => {
  it("keeps early local/error observations and deduplicates an error observed by two boundaries", () => {
    const initial = createFunctionalResetSession();
    const paid = record("turn:local");
    const unknown = record("turn:failed", false);
    const local = appendFunctionalResetProviderCallRecords(initial, { turnId: "turn:local", records: [paid] });
    const failed = appendFunctionalResetProviderCallRecords(local, { turnId: "turn:failed", records: [unknown, unknown] });
    expect(failed.bridgeTraces.flatMap((trace) => trace.providerCallRecords ?? [])).toEqual([paid, unknown]);
    expect(failed.bridgeTraces.at(-1)).toMatchObject({
      cumulativeSessionCostUsd: paid.estimatedCostUsd, cumulativeSessionCostIncomplete: true, cumulativeSessionUnpricedCallCount: 1,
    });
    expect(appendFunctionalResetProviderCallRecords(failed, { turnId: "turn:failed", records: [unknown] })).toBe(failed);
    expect(failed.project).toBe(initial.project);
    expect(failed.runtimeTurns).toBe(initial.runtimeTurns);
  });

  it("attaches complete observations to an existing trace without calling them missing legacy usage", () => {
    const paid = record("turn:existing");
    const populated = appendFunctionalResetProviderCallRecords(createFunctionalResetSession(), { turnId: "turn:existing", records: [paid] });
    const trace = { ...populated.bridgeTraces[0]!, providerCallRecords: [], cumulativeSessionCostUsd: undefined,
      cumulativeSessionCostIncomplete: undefined, cumulativeSessionUnpricedCallCount: undefined };
    const restored = appendFunctionalResetProviderCallRecords({ ...populated, bridgeTraces: [trace] }, { turnId: trace.turnId, records: [paid] });
    expect(restored.bridgeTraces).toHaveLength(1);
    expect(restored.bridgeTraces[0]).toMatchObject({ cumulativeSessionCostIncomplete: false, cumulativeSessionUnpricedCallCount: 0 });
  });

  it("retains cumulative incomplete cost after trace truncation and session roundtrip", () => {
    let session = appendFunctionalResetProviderCallRecords(createFunctionalResetSession(), { turnId: "turn:unknown", records: [record("turn:unknown", false)] });
    for (let index = 0; index < 25; index += 1) {
      const turnId = `turn:${index}`;
      session = appendFunctionalResetProviderCallRecords(JSON.parse(JSON.stringify(session)), { turnId, records: [record(turnId)] });
    }
    expect(session.bridgeTraces).toHaveLength(20);
    expect(session.bridgeTraces.at(-1)).toMatchObject({
      cumulativeSessionCostUsd: Number((25 * record("price").estimatedCostUsd!).toFixed(10)),
      cumulativeSessionCostIncomplete: true, cumulativeSessionUnpricedCallCount: 1,
    });
  });

  it("preserves UNKNOWN for inherited calls lacking token observations", () => {
    const observed = appendFunctionalResetProviderCallRecords(createFunctionalResetSession(), { turnId: "legacy", records: [record("legacy")] });
    const legacy = { ...observed.bridgeTraces[0]!, calls: 2, providerCallRecords: undefined,
      cumulativeSessionCostIncomplete: undefined, cumulativeSessionUnpricedCallCount: undefined };
    const next = appendFunctionalResetProviderCallRecords({ ...observed, bridgeTraces: [legacy] }, { turnId: "next", records: [record("next")] });
    expect(next.bridgeTraces.at(-1)).toMatchObject({ cumulativeSessionCostIncomplete: true, cumulativeSessionUnpricedCallCount: 2 });
  });

  it("keeps the cumulative receipt through more than twenty local turns without provider calls", () => {
    const paid = record("paid");
    let session = appendFunctionalResetProviderCallRecords(createFunctionalResetSession(), { turnId: "paid", records: [paid] });
    const localTrace = { ...session.bridgeTraces[0]!, calls: 0, providerCallRecords: [], provider: "NONE",
      cumulativeSessionCostUsd: undefined, cumulativeSessionCostIncomplete: undefined, cumulativeSessionUnpricedCallCount: undefined };
    for (let index = 0; index < 25; index += 1) {
      const turnId = `local:${index}`;
      session = appendFunctionalResetProviderCallRecords({ ...session,
        bridgeTraces: [...session.bridgeTraces, { ...localTrace, turnId }].slice(-20),
      }, { turnId, records: [] });
    }
    expect(session.bridgeTraces.flatMap((trace) => trace.providerCallRecords ?? [])).toEqual([]);
    expect(session.bridgeTraces.at(-1)).toMatchObject({ cumulativeSessionCostUsd: paid.estimatedCostUsd,
      cumulativeSessionCostIncomplete: false, cumulativeSessionUnpricedCallCount: 0 });
  });
});
