import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { FileScientificInterpretationEvidenceStore } from "../../../../api/scientific-interpretation-evidence-store";
import { handleScientificInterpretation } from "../../../../api/scientific-interpretation";
import { GeminiHybridScientificInterpretationProvider, RollingSingleConcurrencyGate } from "../../../../api/scientific-interpretation-provider";
import {
  HybridScientificInterpretationRuntimeAdapter,
  EXPECTED_HYBRID_MODEL_IDENTITY,
  HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME,
  HYBRID_PRIMARY_RUNTIME_ID,
  HYBRID_PRIMARY_RUNTIME_VERSION,
  SCIENTIFIC_INTERPRETATION_API_VERSION,
  ScientificInterpretationTechnicalError,
  parseHybridPrimaryProviderOutput,
  processScientificInterpretationHttp,
  resetScientificInterpretationRateLimitForTests,
  type ScientificInterpretationConversation,
} from "..";

const conversation: ScientificInterpretationConversation = {
  conversationId: "product-runtime-test",
  language: "fr",
  turns: [{ turnId: "T0", role: "USER", content: "Comparer deux méthodes sans conclure à une causalité." }],
};

const primary = {
  normalizedUnderstanding: "Comparaison non causale de deux méthodes.",
  scientificGoalCandidates: [], studyIntentCandidates: [], objects: [], relations: [], explicitStatements: [], inferredContext: [],
  contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [],
  correctionsAndSupersessions: [], ownershipAndEpistemicStates: [], openDecisions: [], clarificationNeeds: [],
};

const providerResponse = (status: number, value: unknown) => new Response(
  JSON.stringify(status === 200 ? { candidates: [{ content: { parts: [{ functionCall: { name: HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME, args: value } }] } }] } : { error: { status: `HTTP_${status}` } }),
  { status, headers: { "content-type": "application/json", ...(status === 429 ? { "retry-after": "0" } : {}) } },
);

describe("Scientific Interpretation product provider and HTTP boundary", () => {
  it("exports the runtime-neutral product API handler", () => expect(typeof handleScientificInterpretation).toBe("function"));

  it("persists the untouched provider envelope before scientific parsing", async () => {
    let sentRequest: RequestInit | undefined;
    const fetchImpl: typeof fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      sentRequest = init;
      return providerResponse(200, primary);
    });
    const provider = new GeminiHybridScientificInterpretationProvider({ apiKey: "test-key", model: EXPECTED_HYBRID_MODEL_IDENTITY, fetchImpl, gate: new RollingSingleConcurrencyGate(), maxAttempts: 1 });
    const store = new (class extends FileScientificInterpretationEvidenceStore {
      order: string[] = [];
      override async persistAtomically(input: Parameters<FileScientificInterpretationEvidenceStore["persistAtomically"]>[0]) { this.order.push("persist"); return super.persistAtomically(input); }
    })(await mkdtemp(join(tmpdir(), "noxia-runtime-test-")));
    const adapter = new HybridScientificInterpretationRuntimeAdapter(HYBRID_PRIMARY_RUNTIME_ID, HYBRID_PRIMARY_RUNTIME_VERSION, async (...args) => provider.execute(...args), store, (raw, execution, sourceConversation, previous) => {
      store.order.push("parse");
      return parseHybridPrimaryProviderOutput(raw, execution, sourceConversation, previous);
    });
    const value = await adapter.interpret(conversation);
    expect(store.order).toEqual(["persist", "parse"]);
    expect(value.source.rawOutputRef).toMatch(/^scientific-interpretation-raw:/);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const body = JSON.parse(String(sentRequest?.body));
    expect(body).not.toHaveProperty("generationConfig");
    expect(body).not.toHaveProperty("responseJsonSchema");
    expect(body.tools[0].functionDeclarations[0].name).toBe(HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME);
  });

  it("retries only a transient transport status and preserves both attempts", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(providerResponse(503, {}))
      .mockResolvedValueOnce(providerResponse(200, primary));
    const provider = new GeminiHybridScientificInterpretationProvider({ apiKey: "test-key", model: EXPECTED_HYBRID_MODEL_IDENTITY, fetchImpl, gate: new RollingSingleConcurrencyGate(), maxAttempts: 2, sleepImpl: async () => {} });
    const result = await provider.execute(conversation);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.providerAttempts).toHaveLength(2);
    expect((result.rawOutput as { rawAttempts: unknown[] }).rawAttempts).toHaveLength(2);
  });

  it("does not retry a deterministic 400 provider failure", async () => {
    const fetchImpl = vi.fn(async () => providerResponse(400, {}));
    const provider = new GeminiHybridScientificInterpretationProvider({ apiKey: "test-key", model: EXPECTED_HYBRID_MODEL_IDENTITY, fetchImpl, gate: new RollingSingleConcurrencyGate(), maxAttempts: 2 });
    const result = await provider.execute(conversation);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(result.technicalFailure).toMatchObject({ failureClass: "PROVIDER_FAILURE" });
  });

  it("reconstructs a file-backed raw record from its logical reference", async () => {
    const store = new FileScientificInterpretationEvidenceStore(await mkdtemp(join(tmpdir(), "noxia-evidence-test-")));
    const record = await store.persistAtomically({ operationId: "operation", payload: { evidence: "raw" }, persistedAt: "2026-08-14T20:00:00.000Z" });
    expect(await store.read(record.rawOutputRef)).toEqual(record);
  });

  it("returns NEEDS_REVIEW without a projection on a critical finding", async () => {
    resetScientificInterpretationRateLimitForTests();
    const adapter = new HybridScientificInterpretationRuntimeAdapter(HYBRID_PRIMARY_RUNTIME_ID, HYBRID_PRIMARY_RUNTIME_VERSION, async () => ({
      operationId: "critical", provider: "TEST", model: EXPECTED_HYBRID_MODEL_IDENTITY, promptDigest: "p", schemaDigest: "s", configurationDigest: "c", runtimeId: HYBRID_PRIMARY_RUNTIME_ID, runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
      rawOutput: { rawAttempts: [{ providerBodyText: JSON.stringify({ candidates: [{ content: { parts: [{ functionCall: { name: HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME, args: { ...primary, objects: [{ elementId: "x", content: "méthode", semanticIdentity: "method:x", semanticType: "METHOD", studyRole: "METHOD", sourceTurnIds: ["T0"], sourceText: "méthodes", polarity: "AFFIRMED", temporalContext: null, ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, previousElementIds: [], evidenceRefs: [], confidence: 1, adoptionStatus: null, originStatus: null, originType: null, availabilityScope: null, availabilityClaim: null, decisionId: null }], relations: [{ relationId: "self", sourceElementId: "x", targetElementId: "x", relationType: "RELATED_TO", sourceTurnIds: [], sourceText: null, polarity: "AFFIRMED", temporalContext: null, ownership: "RUNTIME", epistemicStatus: "INFERRED_CANDIDATE", activeState: true, previousRelationIds: [], evidenceRefs: [], confidence: 0.5 }] } } }] } }] }) }] },
    }), new (await import("../raw-persistence")).InMemoryScientificInterpretationRawStore(), parseHybridPrimaryProviderOutput);
    const result = await processScientificInterpretationHttp({ method: "POST", headers: { "content-type": "application/json" }, body: { apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION, conversation, previousContribution: null }, ip: "critical" }, {
      execute: async (parsed) => {
        const contribution = await adapter.interpret(parsed.conversation);
        return { mode: "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK", activeContribution: contribution, shadowContribution: null, comparison: null, fallbackUsed: false, fallback: null, projectWrites: 0, uiStateMutatedByShadow: false, diagnostics: [] };
      },
    });
    expect(result.body).toMatchObject({ projectionDisposition: "NEEDS_REVIEW", v1Projection: null, projectWrites: 0 });
  });

  it("returns RAW_PERSISTENCE_FAILURE as fail closed", async () => {
    resetScientificInterpretationRateLimitForTests();
    const result = await processScientificInterpretationHttp({ method: "POST", headers: { "content-type": "application/json" }, body: { apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION, conversation, previousContribution: null }, ip: "raw" }, {
      execute: async () => { throw new ScientificInterpretationTechnicalError("RAW_PERSISTENCE_FAILURE", "disk unavailable", null, "raw-op"); },
    });
    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ technicalStatus: "FAIL_CLOSED", fallbackUsed: false, projectionDisposition: "FAIL_CLOSED", error: { code: "RAW_PERSISTENCE_FAILURE", operationId: "raw-op" } });
  });
});
