// Pure common-receipt consumer tests. No network.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCurrentTurnNavigation } from "@/features/query-navigation/current-turn-navigation";
import { realizeGovernedConversation } from "@/features/query-navigation/governed-conversation-realization";
import type { ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import { resolveGovernedPostAdoptionReceipt } from "../session";
import { richStudyContribution, adoptBehaviorContribution } from "./p1-behavior-01a-contract-fixtures";
import { makeFunctionalResetBridgeResponse } from "./functional-reset-fixtures";
import { createScientificExecutionTraceLedger, createScientificTraceCaptureConfiguration, startProductTraceRun } from "@/features/protocol-designer/scientific-execution-trace";
import { recordGovernedConversationTrace, recordPostAdoptionGovernedLocalRealization } from "../end-to-end-trace-adapter";
import { diagnoseScientificTraceRun } from "@/features/validation-architecture/trace-structural-validation";
import { logicalDigest } from "@/features/knowledge-engine";
import { GOVERNED_REALIZATION_SYSTEM_INSTRUCTION } from "@/features/query-navigation/governed-conversation-realization";

const AT = "2026-09-08T13:00:00.000Z";
const LEGACY_QUESTION = "Quel effectif souhaitez-vous recruter ?";
const network = vi.fn(() => { throw new Error("PROVIDER_FORBIDDEN_IN_POST_ADOPTION_RECEIPT_TEST"); });

const fixture = () => {
  const contribution = richStudyContribution();
  const project = adoptBehaviorContribution(contribution, null, 1);
  const source = contribution.source.turns.at(-1)!;
  const navigation = buildCurrentTurnNavigation({ sourceTurnRef: source.turnId, sourceText: source.content,
    candidate: null, contribution: null, validation: null, currentProject: project,
    requestKind: "POST_ADOPTION_QRY_CONTINUATION" });
  // Structured fixture for an already selected RESPOND and its owner-provided
  // local formulation. This test does not qualify selection or invent a rule.
  const localWhatText = navigation.envelope.purpose;
  const response: ProductBridgeResponse = {
    ...makeFunctionalResetBridgeResponse(contribution.source.turns, null, ""),
    currentTurnNavigation: { ...navigation, localWhatText },
    governedRealization: undefined,
    conversationFailure: { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE", message: "mock", provider: null },
    observability: { provider: "GOOGLE_GEMINI", model: "MOCK_NO_NETWORK", conversationCalls: 1,
      conversationResponseReceived: false, conversationLatencyMs: 12, extractionLatencyMs: null,
      extractionAttempts: 0, calls: 1, projectWrites: 0 },
  };
  return { project, response, realizedAt: AT };
};

describe("Pass3A post-adoption common receipt, no legacy WHAT resurrection", () => {
  it("TRACE preserves the failed actual request and separately records only the local realization used", () => {
    const input = fixture();
    const sourceTurnRef = input.response.currentTurnNavigation!.envelope.sourceTurnRef;
    const traceRunId = "pass3a:post-adoption:trace";
    const conversationId = "pass3a:post-adoption:conversation";
    const ledger = startProductTraceRun({ ledger: createScientificExecutionTraceLedger("pass3a:post-adoption"),
      traceRunId, conversationId, turnId: sourceTurnRef, startedAt: AT, sourceDigest: logicalDigest(sourceTurnRef),
      captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "OTHER" }) }).ledger;
    const native = recordGovernedConversationTrace({ ledger, traceRunId, conversationId, sourceDigest: logicalDigest(sourceTurnRef),
      observedAt: AT, response: input.response, providerContext: JSON.stringify(input.response.currentTurnNavigation!.envelope),
      systemInstruction: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION });
    const realized = resolveGovernedPostAdoptionReceipt(input);
    const final = recordPostAdoptionGovernedLocalRealization({ ledger: native.ledger, traceRunId, conversationId,
      turnId: "pass3a:visible", response: input.response, realized, nativeOutcome: native.realizationOutcome });
    expect(final.events.filter((event) => event.common?.stage === "QUESTION_REALIZATION_REQUESTED")).toHaveLength(1);
    expect(final.events.filter((event) => event.common?.stage === "QUESTION_REALIZED")).toHaveLength(1);
    expect(final.events.at(-1)?.common).toMatchObject({ decisionOwner: "QUERY_NAVIGATION",
      executor: "LOCAL_DETERMINISTIC_REALIZATION", provider: "NONE", realizationOutcome: {
        attemptedProvider: "GOOGLE_GEMINI", providerResponseReceived: false, providerResponseAccepted: null,
        fallbackReason: "CONVERSATION_PROVIDER_FAILURE" } });
    expect(final.events.at(-1)?.common?.semanticTransformation?.outputDimensions.every((item) => item.status === "UNKNOWN")).toBe(true);
    expect(diagnoseScientificTraceRun({ ledger: final, traceRunId }).filter((item) =>
      ["TRACE_CHAIN_BREAK", "VERSION_OR_DIGEST_DISCONTINUITY", "UNEXPLAINED_DIMENSION_LOSS"].includes(item.code))).toEqual([]);
    expect(realized.calls).toBe(1);
  });
  beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
  afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

  it("HOW failure uses only the current governed local WHAT and preserves the actual attempted call", () => {
    const input = fixture();
    const before = JSON.stringify(input);
    const result = resolveGovernedPostAdoptionReceipt(input);
    expect(result.content).toBe(input.response.currentTurnNavigation!.localWhatText);
    expect(result.content).not.toBe(LEGACY_QUESTION);
    expect(result.presentationSource).toBe("GOVERNED_LOCAL_REALIZATION");
    expect(result.provider).toBe("GOOGLE_GEMINI");
    expect(result.calls).toBe(1);
    expect(result.localRealization?.value.executor).toBe("LOCAL_DETERMINISTIC_REALIZATION");
    expect(result.nativeReceipt).toBe(input.response);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("rejected ASK prose does not replace a current RESPOND WHAT", () => {
    const input = fixture();
    input.response.observability.conversationResponseReceived = true;
    input.response.conversationFailure = { stage: "CONFORMANCE", code: "HOW_ACTION_CONFORMANCE_REJECTED", message: "mock", provider: null };
    input.response.assistantReply = LEGACY_QUESTION;
    input.response.governedRealization = realizeGovernedConversation({
      envelope: input.response.currentTurnNavigation!.envelope,
      providerReply: LEGACY_QUESTION, requireProviderClaim: true,
      localWhatText: input.response.currentTurnNavigation!.localWhatText,
    });
    const result = resolveGovernedPostAdoptionReceipt(input);
    expect(result.content).toBe(input.response.currentTurnNavigation!.localWhatText);
    expect(result.content).not.toContain(LEGACY_QUESTION);
    expect(result.mediationFailure).toBe("HOW_ACTION_CONFORMANCE_REJECTED");
    expect(result.calls).toBe(1);
  });

  it("missing common receipt is an honest failure, never the legacy standard question", () => {
    const input = fixture();
    input.response.currentTurnNavigation = undefined;
    input.response.assistantReply = LEGACY_QUESTION;
    expect(() => resolveGovernedPostAdoptionReceipt(input)).toThrow("POST_ADOPTION_GOVERNED_RECEIPT_REQUIRED");
  });

  it("an unavailable owner-provided local formulation cannot be filled from legacy state", () => {
    const input = fixture();
    input.response.currentTurnNavigation = { ...input.response.currentTurnNavigation!, localWhatText: null };
    expect(() => resolveGovernedPostAdoptionReceipt(input)).toThrow("POST_ADOPTION_GOVERNED_LOCAL_REALIZATION_NOT_AVAILABLE");
  });

  it("rejects a receipt bound to a different adopted Project version", () => {
    const input = fixture();
    expect(() => resolveGovernedPostAdoptionReceipt({ ...input, project: { ...input.project, versionId: "stale-version" } }))
      .toThrow("POST_ADOPTION_GOVERNED_RECEIPT_PROJECT_MISMATCH");
  });

  it("accepted provider realization remains the native result without local fallback", () => {
    const input = fixture();
    const text = "Les options explicitement présentées restent ouvertes.";
    const envelope = input.response.currentTurnNavigation!.envelope;
    input.response.conversationFailure = null;
    input.response.observability.conversationResponseReceived = true;
    input.response.assistantReply = text;
    input.response.governedRealization = realizeGovernedConversation({ envelope, providerReply: text,
      requireProviderClaim: true, providerClaim: { whatRef: envelope.whatRef, action: envelope.action,
        actionWitness: text, interventionKind: envelope.intervention.kind,
        contentSource: envelope.intervention.contentSource,
        targetRefs: [...envelope.targetRefs], informationNeedRefs: [],
        contentClaims: [], relationClaims: [], adoptionClaimed: false, projectWriteClaimed: false } });
    expect(input.response.governedRealization.providerReplyAccepted).toBe(true);
    const result = resolveGovernedPostAdoptionReceipt(input);
    expect(result.content).toBe(text);
    expect(result.presentationSource).toBe("GEMINI_MEDIATED");
    expect(result.localRealization).toBeNull();
    expect(result.calls).toBe(1);
  });
});
