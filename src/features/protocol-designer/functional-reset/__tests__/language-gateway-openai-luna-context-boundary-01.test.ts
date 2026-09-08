import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import {
  OPENAI_RESPONSES_ENDPOINT,
  buildOpenAILanguageProjectionPayload,
  executeOpenAILanguageProjection,
} from "../../../../../api/protocol-designer-openai-extraction-provider";
import {
  CONVERSATION_LANGUAGE_GATEWAY_VERSION,
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
  LANGUAGE_GATEWAY_CONTEXT_SCOPE_ID,
  LANGUAGE_PROJECTION_CONTRACT_VERSION,
  LANGUAGE_PROJECTION_PROMPT_VERSION,
  LANGUAGE_PROJECTION_SCHEMA_IDENTITY,
  LANGUAGE_PROJECTION_SCHEMA_VERSION,
  LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION,
  LANGUAGE_PROJECTION_VALIDATOR_VERSION,
  buildMultilingualUserTurn,
  evaluateLinguisticInvariants,
  languageGatewayContextBoundary,
  languageProjectionIdentityDigest,
  materializeLanguageProjectionArtifact,
  validateLanguageProjectionProviderResult,
  type LanguageProjectionProviderResult,
  type LanguageProjectionRequest,
  type LanguageProjectionResponse,
  type ProviderSemanticInvariantEvidence,
  type SemanticLanguageProjectionInvariant,
} from "@/features/protocol-designer/conversation-language-gateway";
import {
  CURRENT_LANGUAGE_GATEWAY_REFERENCES,
  evaluateLanguageGatewayProjection,
  type LanguageGatewayReference,
} from "@/features/protocol-designer/language-gateway-reference-evaluator";
import {
  createProductTraceRunId,
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  listEndToEndTraceEvents,
  recordConversationLanguageGatewayTrace,
} from "@/features/protocol-designer/scientific-execution-trace";
import { ProductBridgeProviderError } from "../../../../../api/protocol-designer-bridge-provider";

const CREATED_AT = "2026-09-08T12:00:00.000Z";
const INVARIANT_IDS = [
  "NEGATION",
  "UNCERTAINTY",
  "CONDITIONALITY",
  "COMPARISON",
  "TEMPORAL_RELATION",
] as const satisfies readonly SemanticLanguageProjectionInvariant[];

const requestFor = (input: {
  sourceText: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  protectedOpaqueLiterals?: LanguageProjectionRequest["protectedOpaqueLiterals"];
}): LanguageProjectionRequest => {
  const sourceLanguage = input.sourceLanguage ?? "en";
  const targetLanguage = input.targetLanguage ?? "fr";
  const protectedOpaqueLiterals = input.protectedOpaqueLiterals ?? [];
  return {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projectionKind: sourceLanguage === "fr" ? "OUTPUT_FROM_FRENCH" : "INPUT_TO_FRENCH",
    sourceText: input.sourceText,
    sourceLanguageHint: sourceLanguage,
    targetLanguage,
    translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
    projectionIdentityDigest: languageProjectionIdentityDigest({
      projectionKind: sourceLanguage === "fr" ? "OUTPUT_FROM_FRENCH" : "INPUT_TO_FRENCH",
      sourceText: input.sourceText,
      sourceLanguage,
      targetLanguage,
      provider: "OPENAI",
      model: DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
      protectedOpaqueLiterals,
    }),
    protectedOpaqueLiterals,
  };
};

const claimsFor = (sourceText: string, translatedText: string): readonly ProviderSemanticInvariantEvidence[] => {
  const evaluated = evaluateLinguisticInvariants(sourceText, translatedText);
  return INVARIANT_IDS.map((invariantId) => {
    const invariant = evaluated.find((candidate) => candidate.invariant === invariantId)!;
    return {
      invariantId,
      attestationStatus: "ATTESTED",
      sourcePresent: invariant.status !== "NOT_PRESENT",
      preserved: invariant.status === "PRESERVED",
      sourceEvidence: invariant.sourceEvidence,
      targetEvidence: invariant.targetEvidence,
    };
  });
};

const outputFor = (input: {
  sourceText: string;
  translatedText: string;
  translatedTextLanguage?: string;
  claims?: readonly ProviderSemanticInvariantEvidence[];
}): LanguageProjectionProviderResult => ({
  detectedLanguage: input.translatedTextLanguage === "en" ? "fr" : "en",
  supportStatus: "SUPPORTED",
  qualificationStatus: "QUALIFIED",
  translatedText: input.translatedText,
  translatedTextLanguage: input.translatedTextLanguage ?? "fr",
  ambiguityPreserved: true,
  semanticInvariants: input.claims ?? claimsFor(input.sourceText, input.translatedText),
  limitations: [],
});

describe("LANGUAGE_GATEWAY_REFERENCE_CORRECTION_OPENAI_LUNA_MIGRATION_AND_CONTEXT_BOUNDARY_01", () => {
  it("publishes one coherent Language Gateway 1.4.0 contract with the adopted uncertainty boundary", () => {
    expect({
      gateway: CONVERSATION_LANGUAGE_GATEWAY_VERSION,
      contract: LANGUAGE_PROJECTION_CONTRACT_VERSION,
      prompt: LANGUAGE_PROJECTION_PROMPT_VERSION,
      schema: LANGUAGE_PROJECTION_SCHEMA_VERSION,
      validator: LANGUAGE_PROJECTION_VALIDATOR_VERSION,
    }).toEqual({ gateway: "1.4.0", contract: "1.4.0", prompt: "1.4.0", schema: "1.4.0", validator: "1.4.0" });
    expect(LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION).toContain("not yet / pas encore ne constituent pas automatiquement UNCERTAINTY");
    expect(LANGUAGE_PROJECTION_SYSTEM_INSTRUCTION).toContain("NEGATION et TEMPORAL_RELATION, mais pas UNCERTAINTY");
  });

  it.each([
    ["The study design is not yet decided.", "Le plan d’étude n’est pas encore décidé."],
    ["Le plan d’analyse n’est pas encore défini.", "The analysis plan is not yet defined."],
  ])("treats not-yet as negation plus temporal relation without uncertainty: %s", (sourceText, translatedText) => {
    const statuses = Object.fromEntries(evaluateLinguisticInvariants(sourceText, translatedText)
      .filter((candidate) => ["NEGATION", "UNCERTAINTY", "TEMPORAL_RELATION"].includes(candidate.invariant))
      .map((candidate) => [candidate.invariant, candidate.status]));
    expect(statuses).toEqual({ NEGATION: "PRESERVED", UNCERTAINTY: "NOT_PRESENT", TEMPORAL_RELATION: "PRESERVED" });
  });

  it.each([
    ["Imaging may contribute.", "L’imagerie pourrait contribuer."],
    ["Imaging might contribute.", "L’imagerie pourrait contribuer."],
    ["L’imagerie pourrait contribuer.", "Imaging may contribute."],
  ])("preserves explicit epistemic modality: %s", (sourceText, translatedText) => {
    expect(evaluateLinguisticInvariants(sourceText, translatedText)
      .find((candidate) => candidate.invariant === "UNCERTAINTY")?.status).toBe("PRESERVED");
  });

  it("rejects a provider claim that promotes not-yet alone to uncertainty", () => {
    const sourceText = "The study design is not yet decided.";
    const translatedText = "Le plan d’étude n’est pas encore décidé.";
    const claims = claimsFor(sourceText, translatedText).map((claim) => claim.invariantId === "UNCERTAINTY" ? ({
      ...claim,
      sourcePresent: true,
      preserved: true,
      sourceEvidence: ["not yet decided"],
      targetEvidence: ["pas encore décidé"],
    }) : claim);
    const validation = validateLanguageProjectionProviderResult({
      request: requestFor({ sourceText }),
      result: outputFor({ sourceText, translatedText, claims }),
    });
    expect(validation.valid).toBe(false);
    expect(validation.blocks).toContain("SOURCE_CLAIM_NOT_YET_IS_NOT_UNCERTAINTY");
  });

  it("keeps UNKNOWN distinct from ABSENT and LOST", () => {
    const sourceText = "Imaging may contribute.";
    const translatedText = "L’imagerie pourrait contribuer.";
    const base = claimsFor(sourceText, translatedText);
    const unknown = base.map((claim) => claim.invariantId === "UNCERTAINTY" ? ({
      ...claim,
      attestationStatus: "UNKNOWN" as const,
      sourcePresent: false,
      preserved: false,
      sourceEvidence: [],
      targetEvidence: [],
    }) : claim);
    const lost = base.map((claim) => claim.invariantId === "UNCERTAINTY" ? ({
      ...claim,
      preserved: false,
      targetEvidence: [],
    }) : claim);
    expect(validateLanguageProjectionProviderResult({ request: requestFor({ sourceText }), result: outputFor({ sourceText, translatedText, claims: unknown }) }).blocks)
      .toContain("SEMANTIC_INVARIANT_ATTESTATION_UNKNOWN:UNCERTAINTY");
    expect(validateLanguageProjectionProviderResult({ request: requestFor({ sourceText }), result: outputFor({ sourceText, translatedText, claims: lost }) }).blocks)
      .toContain("SEMANTIC_INVARIANT_DECLARED_LOST:UNCERTAINTY");
    expect(evaluateLinguisticInvariants("Imaging contributes.", "L’imagerie contribue.")
      .find((candidate) => candidate.invariant === "UNCERTAINTY")?.status).toBe("NOT_PRESENT");
  });

  it("keeps current human references separate from product schema and contract gates", () => {
    expect(CURRENT_LANGUAGE_GATEWAY_REFERENCES).toEqual(expect.arrayContaining([
      expect.objectContaining({ caseId: "CASE-04", expectations: { NEGATION: "PRESENT", UNCERTAINTY: "ABSENT", TEMPORAL_RELATION: "PRESENT" }, authority: "HUMAN_ADJUDICATED" }),
      expect.objectContaining({ caseId: "CASE-05", expectations: { NEGATION: "PRESENT", UNCERTAINTY: "ABSENT", TEMPORAL_RELATION: "PRESENT" }, authority: "HUMAN_ADJUDICATED" }),
    ]));
    const sourceText = "Imaging is available.";
    const translatedText = "L’imagerie est disponible.";
    const providerOutput = outputFor({ sourceText, translatedText });
    const disagreeingReference: LanguageGatewayReference = {
      referenceId: "synthetic:disagreement",
      caseId: "SYNTHETIC",
      sourceText,
      expectations: { UNCERTAINTY: "PRESENT" },
      authority: "PRECOMMITTED_SYNTHETIC",
      provenance: { decisionKind: "PRECOMMITTED_SYNTHETIC_EXPECTATION", decidedAt: "2026-09-08", source: "TEST_ONLY" },
    };
    expect(evaluateLanguageGatewayProjection({ request: requestFor({ sourceText }), providerOutput, reference: disagreeingReference }))
      .toMatchObject({ productSchemaStatus: "PASS", productContractStatus: "PASS", referenceAgreementStatus: "DISAGREE", referenceAuthority: "PRECOMMITTED_SYNTHETIC", humanVisibleTranslationStatus: "NOT_REVIEWED" });
    expect(evaluateLanguageGatewayProjection({ request: requestFor({ sourceText }), providerOutput }))
      .toMatchObject({ productSchemaStatus: "PASS", productContractStatus: "PASS", referenceAgreementStatus: "NOT_EVALUATED", referenceAuthority: "NONE" });
  });

  it("builds a bounded provider payload independent from irrelevant long histories", () => {
    const request = requestFor({
      sourceText: "Imaging may contribute at SITEALPHA.",
      protectedOpaqueLiterals: [{ literal: "SITEALPHA", kind: "EXPLICIT_CONTEXT", source: "EXPLICIT_CONTEXT" }],
    });
    const polluted = {
      ...request,
      fullTranscript: "TRANSCRIPT_SENTINEL ".repeat(10_000),
      currentProject: { sentinel: "PROJECT_SENTINEL" },
      ownerResults: [{ sentinel: "OWNER_RESULTS_SENTINEL" }],
      documentPortfolio: [{ sentinel: "DOCUMENT_SENTINEL" }],
      knowledgeCorpus: [{ sentinel: "KNOWLEDGE_SENTINEL" }],
    } as LanguageProjectionRequest;
    const canonicalPayload = buildOpenAILanguageProjectionPayload(request);
    const pollutedPayload = buildOpenAILanguageProjectionPayload(polluted);
    expect(pollutedPayload).toEqual(canonicalPayload);
    expect(JSON.stringify(pollutedPayload)).not.toMatch(/TRANSCRIPT_SENTINEL|PROJECT_SENTINEL|OWNER_RESULTS_SENTINEL|DOCUMENT_SENTINEL|KNOWLEDGE_SENTINEL/u);
    expect(pollutedPayload).toMatchObject({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: LANGUAGE_PROJECTION_SCHEMA_IDENTITY } },
      store: false,
    });
    expect(pollutedPayload.input).toContain(request.sourceText);
    expect(pollutedPayload.input).toContain("SITEALPHA");
    const boundary = languageGatewayContextBoundary(request);
    expect(boundary).toMatchObject({
      contextScopeId: LANGUAGE_GATEWAY_CONTEXT_SCOPE_ID,
      fullTranscriptIncluded: false,
      fullProjectIncluded: false,
      ownerResultsIncluded: false,
      documentPortfolioIncluded: false,
      knowledgeCorpusIncluded: false,
      localLinguisticContextRefs: [],
      tokenCountMethod: "PROVIDER_USAGE_IF_AVAILABLE",
    });
    expect(boundary.contextItemRefsOrDigests).toHaveLength(3);
  });

  it("reuses the Responses transport, materializes usage and fails closed without fallback", async () => {
    const sourceText = "Imaging may contribute at SITEALPHA.";
    const translatedText = "L’imagerie pourrait contribuer à SITEALPHA.";
    const request = requestFor({
      sourceText,
      protectedOpaqueLiterals: [{ literal: "SITEALPHA", kind: "EXPLICIT_CONTEXT", source: "EXPLICIT_CONTEXT" }],
    });
    const providerOutput = outputFor({ sourceText, translatedText });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "resp_language_luna_mock",
      model: "gpt-5.6-luna",
      status: "completed",
      output_text: JSON.stringify(providerOutput),
      usage: {
        input_tokens: 321,
        output_tokens: 87,
        input_tokens_details: { cached_tokens: 120 },
        output_tokens_details: { reasoning_tokens: 19 },
      },
    }), { status: 200, headers: { "content-type": "application/json", "x-request-id": "req_language_mock" } })) as unknown as typeof fetch;
    const result = await executeOpenAILanguageProjection(request, "test-openai-key", fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(OPENAI_RESPONSES_ENDPOINT, expect.objectContaining({ method: "POST" }));
    const call = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(JSON.parse(String((call[1] as RequestInit).body))).toMatchObject({
      model: "gpt-5.6-luna",
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "conversation_language_projection_v1_4_0" } },
      store: false,
    });
    expect(result).toMatchObject({
      responseId: "resp_language_luna_mock",
      requestId: "req_language_mock",
      modelRequested: "gpt-5.6-luna",
      modelReturned: "gpt-5.6-luna",
      reasoningEffort: "low",
      usage: { input_tokens: 321, output_tokens: 87, reasoning_tokens: 19, cached_tokens: 120 },
    });

    const failingFetch = vi.fn(async () => new Response(JSON.stringify({ error: { code: "UNAVAILABLE", message: "mock failure" } }), {
      status: 503,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;
    await expect(executeOpenAILanguageProjection(request, "test-openai-key", failingFetch)).rejects.toBeInstanceOf(ProductBridgeProviderError);
    expect(failingFetch).toHaveBeenCalledTimes(1);
  });

  it("routes the product Language Gateway to Luna low only and records provider execution in TRACE", async () => {
    const sourceText = "Imaging may contribute.";
    const translatedText = "L’imagerie pourrait contribuer.";
    const request = requestFor({ sourceText });
    const providerOutput = outputFor({ sourceText, translatedText });
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "resp_language_bridge_mock",
      model: "gpt-5.6-luna",
      status: "completed",
      output_text: JSON.stringify(providerOutput),
      usage: { input_tokens: 200, output_tokens: 70, output_tokens_details: { reasoning_tokens: 12 } },
    }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
    const bridge = await executeProtocolDesignerBridge({
      body: request,
      apiKey: "unused-gemini-key",
      openAiApiKey: "test-openai-key",
      geminiModel: "must-not-be-used",
      fetchImpl,
      now: () => Date.parse(CREATED_AT),
    });
    expect(bridge.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    if (bridge.status !== 200 || !("projection" in bridge.body)) throw new Error("EXPECTED_LANGUAGE_PROJECTION");
    const projection = (bridge.body as LanguageProjectionResponse).projection;
    expect(projection).toMatchObject({
      provider: "OPENAI",
      model: DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
      reasoningEffort: DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
      providerResponseId: "resp_language_bridge_mock",
    });
    const turn = buildMultilingualUserTurn({
      turnId: "turn:luna-trace",
      originalText: sourceText,
      detection: { status: "DETECTED", detectedLanguage: "en", confidence: "HIGH", reasonCode: "ENGLISH_LEXICAL_EVIDENCE" },
      currentConversationLanguage: null,
      projection,
    });
    const sessionId = "session:luna-trace";
    const traceRunId = createProductTraceRunId(sessionId, turn.turnId);
    const ledger = recordConversationLanguageGatewayTrace({
      ledger: createScientificExecutionTraceLedger(sessionId),
      traceRunId,
      conversationId: "conversation:luna-trace",
      turn,
      observedAt: CREATED_AT,
      captureConfiguration: createScientificTraceCaptureConfiguration({
        captureLevel: "LEVEL_2_DIAGNOSTIC",
        captureReason: "MANUAL_DIAGNOSTIC",
      }),
    });
    const providerEvent = listEndToEndTraceEvents({ ledger, traceRunId })
      .find((event) => event.stage === "LANGUAGE_PROVIDER_RESULT_RECEIVED");
    expect(providerEvent).toMatchObject({
      executor: "OPENAI_LANGUAGE_PROJECTION",
      providerExecution: {
        model: "gpt-5.6-luna",
        reasoningEffort: "low",
        providerResponseId: "resp_language_bridge_mock",
        contextScopeId: LANGUAGE_GATEWAY_CONTEXT_SCOPE_ID,
        inputTokenCount: 200,
        outputTokenCount: 70,
        reasoningTokenCount: 12,
      },
    });
  });
});
