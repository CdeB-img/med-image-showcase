// Common WHAT/HOW receipt and existing TRACE recorder, mocked execution only.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import { buildCurrentTurnNavigation } from "@/features/query-navigation/current-turn-navigation";
import {
  GOVERNED_REALIZATION_SYSTEM_INSTRUCTION,
  realizeGovernedConversation,
} from "@/features/query-navigation/governed-conversation-realization";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction/contribution-owner-boundary";
import type { ProductBridgeResponse, PersistentDeltaValidation } from "@/features/protocol-designer/product-bridge";
import {
  createScientificExecutionTraceLedger, createScientificTraceCaptureConfiguration,
  startProductTraceRun, type ScientificTraceCaptureLevel,
} from "@/features/protocol-designer/scientific-execution-trace";
import { diagnoseScientificTraceRun } from "@/features/validation-architecture/trace-structural-validation";
import { recordGovernedConversationTrace, recordRetainedContributionValidation } from "../end-to-end-trace-adapter";
import { retainValidatedContributionCandidate } from "../contribution-lifecycle";
import { richStudyContribution } from "./p1-behavior-01a-contract-fixtures";
import { makeFunctionalResetBridgeResponse } from "./functional-reset-fixtures";

const AT = "2026-09-08T12:00:00.000Z";
const HOW_AT = "2026-09-08T12:00:01.000Z";
const DONE_AT = "2026-09-08T12:00:02.000Z";
const RUN = "trace:pass3a:governed";
const network = vi.fn(() => { throw new Error("PROVIDER_FORBIDDEN_IN_PASS3A_TRACE_TEST"); });
const passedValidation = (): PersistentDeltaValidation => ({ valid: true, acceptedChanges: [], acceptedRelations: [],
  acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [] });

const fixture = (captureLevel: ScientificTraceCaptureLevel = "LEVEL_2_DIAGNOSTIC") => {
  const contribution = richStudyContribution();
  const source = contribution.source.turns.at(-1)!;
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const validation = passedValidation();
  const navigation = buildCurrentTurnNavigation({
    sourceTurnRef: source.turnId, sourceText: source.content, candidate, contribution, validation, currentProject: null,
  });
  const text = `Je propose de structurer cette question : ${navigation.envelope.authorizedContent.map((item) => item.text).join(" ; ")}.`;
  const governed = realizeGovernedConversation({ envelope: navigation.envelope, providerReply: text,
    requireProviderClaim: true, providerClaim: {
      whatRef: navigation.envelope.whatRef, action: navigation.envelope.action, actionWitness: text,
      targetRefs: [...navigation.envelope.targetRefs], informationNeedRefs: [],
      contentClaims: navigation.envelope.authorizedContent.map((item) => ({ ref: item.ref, witness: item.text, status: item.status })),
      relationClaims: [], adoptionClaimed: false, projectWriteClaimed: false,
    },
  });
  const response: ProductBridgeResponse = {
    ...makeFunctionalResetBridgeResponse(contribution.source.turns, contribution, text),
    currentTurnNavigation: navigation, governedRealization: governed, conversationFailure: null,
    stageTimestamps: { extractionCompletedAt: AT, howRequestedAt: HOW_AT, howCompletedAt: DONE_AT },
    observability: { provider: "GOOGLE_GEMINI", model: "RECORDED_MOCK_NO_NETWORK",
      conversationCalls: 1, conversationResponseReceived: true, conversationLatencyMs: 1000,
      extractionLatencyMs: 0, calls: 2, extractionAttempts: 1, projectWrites: 0 },
  };
  const retained = retainValidatedContributionCandidate({ retained: [], contribution, candidate, validation,
    validatorRef: "PASS3A_PURE_FIXTURE_VALIDATOR", sourceTurnRef: source.turnId, baseProject: null,
    dependencyBindings: [], traceRunId: RUN, retainedAt: AT })[0];
  let ledger = startProductTraceRun({
    ledger: createScientificExecutionTraceLedger("session:pass3a:trace"), traceRunId: RUN,
    conversationId: contribution.source.conversationId, turnId: source.turnId, startedAt: AT,
    sourceDigest: logicalDigest(source.content),
    captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel, captureReason: "OTHER" }),
  }).ledger;
  ledger = recordRetainedContributionValidation({ ledger, traceRunId: RUN,
    conversationId: contribution.source.conversationId, retainedCandidate: retained,
    extractedAt: AT, validatedAt: AT });
  return {
    ledger, traceRunId: RUN, conversationId: contribution.source.conversationId,
    sourceDigest: logicalDigest(source.content), observedAt: DONE_AT,
    response, retainedCandidate: retained,
    providerContext: JSON.stringify(navigation.envelope),
    systemInstruction: GOVERNED_REALIZATION_SYSTEM_INSTRUCTION,
  };
};

describe("Pass3A native WHAT/HOW TRACE, independent from textual source repetition", () => {
  beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
  afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

  it("chains validated candidate → governed WHAT → actual HOW without requiring full-source recital", () => {
    const input = fixture();
    expect(input.response.governedRealization?.providerReplyAccepted).toBe(true);
    const originalSource = input.retainedCandidate.contribution.source.turns.at(-1)!.content;
    expect(input.response.assistantReply).not.toContain(originalSource);
    const productBefore = JSON.stringify(input.response);
    const recorded = recordGovernedConversationTrace(input);
    const events = recorded.ledger.events.filter((event) => event.runId === RUN);
    expect(events.map((event) => event.common?.stage)).toEqual([
      "USER_TURN_RECEIVED", "PROJECT_CANDIDATE_EXTRACTED", "PROJECT_CANDIDATE_VALIDATED",
      "INFORMATION_NEED_SELECTED", "QUESTION_REALIZATION_REQUESTED", "QUESTION_REALIZED",
    ]);
    expect(events.at(-1)?.common?.decisionOwner).toBe("QUERY_NAVIGATION");
    expect(events.at(-1)?.common?.executor).toBe("GEMINI_CONVERSATION_MODEL");
    expect(events.at(-1)?.common?.semanticTransformation?.inputDimensions.map((item) => item.dimensionId))
      .toEqual(input.response.currentTurnNavigation!.envelope.requiredContentRefs);
    expect(events.at(-1)?.common?.semanticTransformation?.transformationReason)
      .toBe("PROVIDER_STRUCTURED_CLAIMS_NOT_INDEPENDENT_SEMANTIC_PROOF");
    expect(diagnoseScientificTraceRun({ ledger: recorded.ledger, traceRunId: RUN }).filter((item) =>
      ["UNEXPLAINED_DIMENSION_LOSS", "TRACE_CHAIN_BREAK", "VERSION_OR_DIGEST_DISCONTINUITY"].includes(item.code))).toEqual([]);
    expect(JSON.stringify(input.response)).toBe(productBefore);
  });

  it("deduplicates the same native receipt by exact WHAT/request/response refs and digests", () => {
    const input = fixture();
    const first = recordGovernedConversationTrace(input);
    const second = recordGovernedConversationTrace({ ...input, ledger: first.ledger });
    expect(second.ledger.events).toEqual(first.ledger.events);
  });

  it("retains WHAT and actual request on HOW failure without inventing a realized response", () => {
    const input = fixture();
    input.response.governedRealization = undefined;
    input.response.assistantReply = "";
    input.response.conversationFailure = { stage: "HOW", code: "CONVERSATION_PROVIDER_FAILURE", message: "mock failure", provider: null };
    input.response.observability.conversationResponseReceived = false;
    const recorded = recordGovernedConversationTrace(input);
    expect(recorded.ledger.events.map((event) => event.common?.stage).slice(-2))
      .toEqual(["INFORMATION_NEED_SELECTED", "QUESTION_REALIZATION_REQUESTED"]);
    expect(recorded.ledger.events.some((event) => event.common?.stage === "QUESTION_REALIZED")).toBe(false);
    expect(recorded.realizationOutcome).toMatchObject({ attemptedProvider: "GOOGLE_GEMINI",
      providerResponseReceived: false, providerResponseAccepted: null, effectiveExecutor: "NONE" });
  });

  it("records no WHAT or Gemini execution when navigation failed before any HOW call", () => {
    const input = fixture();
    input.response.currentTurnNavigation = undefined;
    input.response.governedRealization = undefined;
    input.response.conversationFailure = { stage: "NAVIGATION", code: "NAVIGATION_CONSUMER_FAILURE", message: "mock", provider: null };
    input.response.observability.conversationCalls = 0;
    input.response.observability.conversationResponseReceived = false;
    const recorded = recordGovernedConversationTrace(input);
    expect(recorded.ledger.events).toEqual(input.ledger.events);
    expect(recorded.realizationOutcome).toMatchObject({ attemptedProvider: "NONE",
      providerResponseReceived: false, effectiveExecutor: "NONE" });
  });

  it("does not present the locally computed fallback of a rejected partial transaction", () => {
    const input = fixture();
    input.response.governedRealization = realizeGovernedConversation({
      envelope: input.response.currentTurnNavigation!.envelope,
      providerReply: "J’ai adopté une autre étude.", requireProviderClaim: true,
      localWhatText: input.response.currentTurnNavigation!.localWhatText,
    });
    expect(input.response.governedRealization.providerReplyAccepted).toBe(false);
    input.response.conversationFailure = { stage: "CONFORMANCE", code: "HOW_CONFORMANCE_REJECTED", message: "mock", provider: null };
    const recorded = recordGovernedConversationTrace(input);
    expect(recorded.realizationOutcome).toMatchObject({ providerResponseReceived: true,
      providerResponseAccepted: false, effectiveExecutor: "NONE", fallbackReason: "DOWNSTREAM_FAILURE_NO_RESPONSE_PRESENTED" });
    expect(recorded.ledger.events.some((event) => event.common?.stage === "QUESTION_REALIZED")).toBe(false);
  });

  it("keeps CORE compact and keeps the product response equivalent across levels", () => {
    const coreInput = fixture("LEVEL_1_CORE");
    const diagnosticInput = fixture("LEVEL_2_DIAGNOSTIC");
    const core = recordGovernedConversationTrace(coreInput);
    const diagnostic = recordGovernedConversationTrace(diagnosticInput);
    expect(coreInput.response).toEqual(diagnosticInput.response);
    expect(core.ledger.events.map((event) => event.common?.stage))
      .toEqual(diagnostic.ledger.events.map((event) => event.common?.stage));
    expect(core.ledger.events.every((event) => !event.common?.semanticTransformation && !event.common?.actionDecision)).toBe(true);
  });
});
