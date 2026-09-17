import { detectSensitiveData } from "../src/features/protocol-designer/intake/privacy.js";
import { buildCurrentTurnNavigation } from "../src/features/query-navigation/current-turn-navigation.js";
import { realizeGovernedConversation } from "../src/features/query-navigation/governed-conversation-realization.js";
import { prepareStandardContextualReasoningRequest } from "../src/features/scientific-thinking/contextual-reasoning-input.js";
import { prepareScientificCollaboratorConversation, SCIENTIFIC_COLLABORATOR_INSTRUCTION, type ScientificConversationReceipt } from "../src/features/scientific-thinking/scientific-collaborator-conversation.js";
import { prepareResearchProjectContributionCandidate } from "../src/features/research-project-construction/contribution-owner-boundary.js";
import {
  PRODUCT_BRIDGE_API_VERSION,
  buildPersistentSourceCatalog,
  constrainPersistentRelationsToCanonicalSignatures,
  contributionFromPersistentDelta,
  materializePersistentSourceAnchors,
  parseProductBridgeRequest,
  resolveGeminiConversationModel,
  resolveOpenAIExtractionModel,
  validatePersistentProviderContract,
  validatePersistentProjectDelta,
  type ProductBridgeResponse,
} from "../src/features/protocol-designer/product-bridge.js";
import { ProductBridgeProviderError, executeNaturalConversation } from "./protocol-designer-bridge-provider.js";
import { SINGLE_ATTEMPT_FAIL_CLOSED, type ProviderAttemptPolicy } from "../server/protocol-designer-canary-policy.js";
import {
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
  LanguageProjectionContractError,
  materializeLanguageProjectionArtifact,
  parseLanguageProjectionRequest,
} from "../src/features/protocol-designer/conversation-language-gateway.js";
import {
  executeOpenAILanguageProjection,
  executeOpenAIPersistentDelta,
} from "./protocol-designer-openai-extraction-provider.js";
import {
  providerCallRequestObservability,
  type ProviderCallObservationContext,
  type ProviderCallRecord,
} from "../src/features/protocol-designer/provider-call-observability.js";
import {
  protocolDesignerStandardConversationCallsAllowed,
} from "../src/features/protocol-designer/public-runtime-access.js";
import {
  admitPublicProtocolDesignerRequest,
  createPublicProtocolDesignerBudgetedFetch,
} from "../server/protocol-designer-public-guard.js";

export type ApiRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown; socket?: { remoteAddress?: string } };
export type ApiResponse = { status(code: number): ApiResponse; setHeader(name: string, value: string): void; json(value: unknown): void };

const header = (headers: ApiRequest["headers"], name: string) => {
  const value = Object.entries(headers).find(([key]) => key.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"))?.[1];
  return Array.isArray(value) ? value[0] : value;
};

const validOrigin = (headers: ApiRequest["headers"]) => {
  const origin = header(headers, "origin");
  const host = header(headers, "x-forwarded-host") ?? header(headers, "host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
};

const safeProviderError = (error: ProductBridgeProviderError) => ({
  stage: error.stage,
  httpStatus: error.httpStatus,
  providerStatus: error.providerStatus,
  providerMessage: error.providerMessage,
  responseId: error.responseId,
  provider: error.provider,
  requestId: error.requestId,
});

const LOCAL_SOURCE_CATALOG_INTEGRITY_BLOCK_PREFIXES = [
  "SOURCE_CATALOG_",
  "SOURCE_ANCHOR_DUPLICATE:",
  "SOURCE_ANCHOR_NOT_CURRENT_USER_TURN:",
  "SOURCE_ANCHOR_NOT_USER_EVIDENCE:",
  "SOURCE_ANCHOR_OFFSETS_INVALID:",
  "SOURCE_ANCHOR_EXACT_TEXT_MISMATCH:",
] as const;

const NON_CORRECTIVE_PERSISTENT_BINDING_BLOCK_SUFFIXES = [
  "EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE",
] as const;

/**
 * A provider-shaped candidate may be re-extracted once when deterministic
 * validation rejects that output. Local catalog-integrity failures are not
 * recoverable through another provider call and therefore never trigger it.
 */
export const isRecoverablePersistentValidationFailure = (blocks: readonly string[]) =>
  blocks.length > 0
  && !blocks.some((block) => NON_CORRECTIVE_PERSISTENT_BINDING_BLOCK_SUFFIXES
    .some((suffix) => block.endsWith(`:${suffix}`) || block === suffix))
  && blocks.every((block) => !LOCAL_SOURCE_CATALOG_INTEGRITY_BLOCK_PREFIXES
    .some((prefix) => block.startsWith(prefix)));

const addOptional = (left: number | undefined, right: number | undefined) =>
  left === undefined && right === undefined ? undefined : (left ?? 0) + (right ?? 0);

const addOpenAIUsage = (
  left: ProductBridgeResponse["observability"]["extractionUsage"],
  right: ProductBridgeResponse["observability"]["extractionUsage"],
): ProductBridgeResponse["observability"]["extractionUsage"] => right ? ({
  input_tokens: addOptional(left?.input_tokens, right.input_tokens),
  output_tokens: addOptional(left?.output_tokens, right.output_tokens),
  total_tokens: addOptional(left?.total_tokens, right.total_tokens),
  input_tokens_details: left?.input_tokens_details || right.input_tokens_details ? {
    cached_tokens: addOptional(left?.input_tokens_details?.cached_tokens, right.input_tokens_details?.cached_tokens),
  } : undefined,
  output_tokens_details: left?.output_tokens_details || right.output_tokens_details ? {
    reasoning_tokens: addOptional(left?.output_tokens_details?.reasoning_tokens, right.output_tokens_details?.reasoning_tokens),
  } : undefined,
}) : left;

export const executeProtocolDesignerBridge = async (input: {
  body: unknown;
  apiKey: string | null;
  openAiApiKey?: string | null;
  geminiModel?: string | null;
  openAiExtractionModel?: string | null;
  fetchImpl?: typeof fetch;
  now?: () => number;
  providerAttemptPolicy?: ProviderAttemptPolicy;
  onPersistentProviderArtifact?: (artifact: NonNullable<ProductBridgeResponse["persistentExtraction"]["providerArtifact"]>) => void;
}): Promise<{ status: number; body: ProductBridgeResponse | Record<string, unknown> }> => {
  const providerCalls: ProviderCallRecord[] = [];
  const observeProviderCall = (record: ProviderCallRecord) => providerCalls.push(record);
  const technicalContext = (
    supplied: ProviderCallObservationContext | undefined,
    fallback: Pick<ProviderCallObservationContext, "conversationId" | "turnId">,
  ): ProviderCallObservationContext => supplied ?? {
    sessionId: null,
    conversationId: fallback.conversationId,
    turnId: fallback.turnId,
    clientRequestId: `bridge-request:${crypto.randomUUID()}`,
    testSessionId: null,
  };
  const languageRequest = parseLanguageProjectionRequest(input.body);
  if (languageRequest) {
    if (detectSensitiveData(languageRequest.sourceText).length) {
      return { status: 422, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "LOCAL_SAFETY_BLOCKED", message: "Retirez toute donnée personnelle, patient ou confidentielle." } } };
    }
    if (!input.openAiApiKey?.trim()) {
      return { status: 503, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "OPENAI_API_KEY_MISSING", message: "Cette langue ne peut pas être traitée pour le moment." } } };
    }
    const model = DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL;
    const reasoningEffort = DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT;
    const observationContext = technicalContext(languageRequest.observabilityContext, {
      conversationId: null,
      turnId: null,
    });
    try {
      const projected = await executeOpenAILanguageProjection(
        languageRequest,
        input.openAiApiKey,
        input.fetchImpl,
        model,
        reasoningEffort,
        {
          context: observationContext,
          purpose: "LANGUAGE_PROJECTION",
          reasoningEffort,
          retryIndex: 0,
          retryReason: null,
          onRecord: observeProviderCall,
        },
      );
      const projection = materializeLanguageProjectionArtifact({
        request: languageRequest,
        result: projected.value,
        provider: "OPENAI",
        model,
        providerResponseId: projected.responseId,
        reasoningEffort: projected.reasoningEffort,
        usage: projected.usage,
        contextBoundary: projected.contextBoundary,
        createdAt: new Date(input.now?.() ?? Date.now()).toISOString(),
      });
      return {
        status: 200,
        body: {
          apiVersion: PRODUCT_BRIDGE_API_VERSION,
          operation: "LANGUAGE_PROJECTION",
          projection,
          observability: {
            provider: "OPENAI",
            model,
            reasoningEffort,
            providerResponseId: projected.responseId,
            usage: projected.usage,
            contextBoundary: projected.contextBoundary,
            calls: 1,
            latencyMs: projected.latencyMs,
            ...providerCallRequestObservability(providerCalls),
          },
        },
      };
    } catch (error) {
      if (error instanceof ProductBridgeProviderError) {
        return { status: 503, body: {
          apiVersion: PRODUCT_BRIDGE_API_VERSION,
          error: { code: "LANGUAGE_PROJECTION_PROVIDER_FAILURE", message: "Cette langue ne peut pas être traitée pour le moment.", provider: safeProviderError(error) },
          observability: providerCallRequestObservability(providerCalls),
        } };
      }
      if (error instanceof LanguageProjectionContractError) {
        const subInvariantId = error.diagnostic.subInvariantIds[0] ?? "UNKNOWN";
        return {
          status: 422,
          body: {
            apiVersion: PRODUCT_BRIDGE_API_VERSION,
            error: {
              code: `LANGUAGE_PROJECTION_CONTRACT_FAILED:${subInvariantId}`,
              message: "La projection linguistique n’a pas conservé les invariants requis.",
              diagnostic: error.diagnostic,
            },
            observability: providerCallRequestObservability(providerCalls),
          },
        };
      }
      return { status: 422, body: {
        apiVersion: PRODUCT_BRIDGE_API_VERSION,
        error: { code: "LANGUAGE_PROJECTION_CONTRACT_FAILED", message: "La projection linguistique n’a pas conservé les invariants requis." },
        observability: providerCallRequestObservability(providerCalls),
      } };
    }
  }
  const request = parseProductBridgeRequest(input.body);
  if (!request) return { status: 400, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "INVALID_REQUEST", message: "Contrat du pont produit invalide." } } };
  const latestUser = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER");
  if (!latestUser) return { status: 400, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "USER_TURN_MISSING", message: "Message utilisateur manquant." } } };
  if (detectSensitiveData(latestUser.content).length) return { status: 422, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "LOCAL_SAFETY_BLOCKED", message: "Retirez toute donnée personnelle, patient ou confidentielle." } } };

  const conversationModel = resolveGeminiConversationModel(input.geminiModel);
  const extractionModel = resolveOpenAIExtractionModel(input.openAiExtractionModel);
  const observationContext = technicalContext(request.observabilityContext, {
    conversationId: request.conversation.conversationId,
    turnId: latestUser.turnId,
  });

  const createdAt = new Date(input.now?.() ?? Date.now()).toISOString();
  let persistentExtraction: ProductBridgeResponse["persistentExtraction"] = {
    called: false,
    status: "NOT_REQUESTED",
    failure: null,
    providerArtifact: null,
    wireCandidate: null,
    candidate: null,
    validation: null,
    contribution: null,
  };
  let extractionLatencyMs: number | null = null;
  let extractionUsage: ProductBridgeResponse["observability"]["extractionUsage"] = null;
  let extractionModelReturned: string | null = null;
  let extractionAttempts: 0 | 1 | 2 = 0;
  let recoveryContext: Omit<NonNullable<ProductBridgeResponse["persistentExtraction"]["recovery"]>, "outcome"> | null = null;

  if (request.evaluatePersistentDelta) {
    try {
      if (!input.openAiApiKey?.trim()) {
        throw new ProductBridgeProviderError(
          "PERSISTENT_DELTA", null, "OPENAI_API_KEY_MISSING", "Persistent extraction is unavailable.", null, "OPENAI",
        );
      }
      const executeAndValidateExtraction = async () => {
        extractionAttempts = extractionAttempts === 0 ? 1 : 2;
        const extracted = await executeOpenAIPersistentDelta(
          request,
          input.openAiApiKey!,
          input.fetchImpl,
          extractionModel,
          {
            context: observationContext,
            purpose: "PERSISTENT_DELTA",
            reasoningEffort: null,
            retryIndex: extractionAttempts - 1,
            retryReason: extractionAttempts === 2 ? "RECOVERABLE_PROVIDER_OUTPUT_VALIDATION_FAILURE" : null,
            onRecord: observeProviderCall,
          },
        );
        extractionLatencyMs = (extractionLatencyMs ?? 0) + extracted.latencyMs;
        extractionUsage = addOpenAIUsage(extractionUsage, extracted.usage);
        extractionModelReturned = extracted.modelReturned;
        input.onPersistentProviderArtifact?.(extracted.value.providerArtifact);
        const providerContract = validatePersistentProviderContract(extracted.value.structuredArgs);
        const sourceCatalog = extracted.value.providerArtifact.sourceCatalog ?? buildPersistentSourceCatalog(request.conversation);
        const materialized = materializePersistentSourceAnchors({
          value: extracted.value.structuredArgs,
          catalog: sourceCatalog,
          currentUserTurn: { turnId: latestUser.turnId, content: latestUser.content },
        });
        const constrained = materialized.value
          ? constrainPersistentRelationsToCanonicalSignatures(materialized.value, request.currentProject)
          : { value: null, omissions: [] };
        const checkedWithoutConstraintNotice = constrained.value
          ? validatePersistentProjectDelta(constrained.value, latestUser.content, request.currentProject, request.conversation)
          : {
            wireCandidate: null,
            candidate: null,
            validation: {
              valid: false,
              acceptedChanges: [],
              acceptedRelations: [],
              acceptedTemporalQualifications: [],
              acceptedExpectedVariableOccasions: [],
              blocks: [],
              noOps: [],
              normalizations: [],
            },
          };
        const checked = constrained.omissions.length ? {
          ...checkedWithoutConstraintNotice,
          validation: {
            ...checkedWithoutConstraintNotice.validation,
            noOps: [
              ...checkedWithoutConstraintNotice.validation.noOps,
              ...constrained.omissions.map((omission) => `relation:${omission.relationRef}:OMITTED_NO_COMPATIBLE_CANONICAL_SIGNATURE`),
            ],
          },
        } : checkedWithoutConstraintNotice;
        const validation = providerContract.valid && materialized.valid ? checked.validation : {
          ...checked.validation,
          valid: false,
          blocks: [...materialized.blocks, ...checked.validation.blocks, ...providerContract.blocks],
        };
        const contribution = checked.candidate && validation.valid
          ? contributionFromPersistentDelta({
            candidate: checked.candidate,
            conversation: request.conversation,
            currentProject: request.currentProject,
            providerArtifact: extracted.value.providerArtifact,
            createdAt,
          })
          : null;
        return { extracted, checked, validation, contribution };
      };

      const firstAttempt = await executeAndValidateExtraction();
      let selectedAttempt = firstAttempt;
      if (input.providerAttemptPolicy !== SINGLE_ATTEMPT_FAIL_CLOSED
        && !firstAttempt.validation.valid && isRecoverablePersistentValidationFailure(firstAttempt.validation.blocks)) {
        recoveryContext = {
          attempted: true,
          reason: "RECOVERABLE_PROVIDER_OUTPUT_VALIDATION_FAILURE",
          triggerBlocks: [...firstAttempt.validation.blocks],
          firstProviderArtifact: firstAttempt.extracted.value.providerArtifact,
          firstWireCandidate: firstAttempt.checked.wireCandidate,
          firstCandidate: firstAttempt.checked.candidate,
          firstValidation: firstAttempt.validation,
        };
        selectedAttempt = await executeAndValidateExtraction();
      }

      const { extracted, checked, validation, contribution } = selectedAttempt;
      const selectedStatus = validation.valid
        ? (checked.candidate?.changes.length
          || checked.candidate?.relations.length
          || checked.candidate?.temporalQualifications.length
          || checked.candidate?.expectedVariableOccasions.length) ? "CANDIDATE" : "NO_CHANGE"
        : "BLOCKED";
      persistentExtraction = {
        called: true,
        status: selectedStatus,
        failure: validation.valid ? null : {
          code: "PERSISTENT_VALIDATION_BLOCKED",
          message: "La contribution persistante ne respecte pas le contrat canonique.",
          details: [...validation.blocks],
          provider: null,
        },
        providerArtifact: extracted.value.providerArtifact,
        wireCandidate: checked.wireCandidate,
        candidate: checked.candidate,
        validation,
        contribution,
        recovery: recoveryContext ? { ...recoveryContext, outcome: selectedStatus } : null,
      };
    } catch (error) {
      const provider = error instanceof ProductBridgeProviderError ? safeProviderError(error) : null;
      persistentExtraction = recoveryContext ? {
        called: true,
        status: "BLOCKED",
        failure: {
          code: "PERSISTENT_VALIDATION_BLOCKED",
          message: "La contribution persistante ne respecte pas le contrat canonique et la récupération bornée n'a pas abouti.",
          details: [...recoveryContext.firstValidation.blocks],
          provider: provider?.stage === "PERSISTENT_DELTA" ? { ...provider, stage: "PERSISTENT_DELTA" } : null,
        },
        providerArtifact: recoveryContext.firstProviderArtifact,
        wireCandidate: recoveryContext.firstWireCandidate,
        candidate: recoveryContext.firstCandidate,
        validation: recoveryContext.firstValidation,
        contribution: null,
        recovery: { ...recoveryContext, outcome: "TECHNICAL_FAILURE" },
      } : {
        called: true,
        status: "TECHNICAL_FAILURE",
        failure: {
          code: "PERSISTENT_PROVIDER_FAILURE",
          message: "L'extraction persistante n'a pas abouti.",
          details: [],
          provider: provider?.stage === "PERSISTENT_DELTA" ? { ...provider, stage: "PERSISTENT_DELTA" } : null,
        },
        providerArtifact: null,
        wireCandidate: null,
        candidate: null,
        validation: null,
        contribution: null,
        recovery: null,
      };
    }
  }

  // A downstream conversation failure cannot erase a validated contribution.
  // Extraction eligibility, validation and its existing bounded recovery are
  // unchanged; only the consumer order moves after this transaction receipt.
  let conversation: Awaited<ReturnType<typeof executeNaturalConversation>> | null = null;
  let conversationFailure: ProductBridgeResponse["conversationFailure"] = null;
  const extractionCompletedAt = new Date(input.now?.() ?? Date.now()).toISOString();
  let currentTurnNavigation: ReturnType<typeof buildCurrentTurnNavigation> | undefined;
  let downstreamStage: "NAVIGATION" | "HOW" | "CONFORMANCE" = "NAVIGATION";
  let howCalls = 0;
  let governedRealization: ReturnType<typeof realizeGovernedConversation> | undefined;
  let howRequestedAt: string | null = null;
  let scientificConversation: ScientificConversationReceipt | undefined;
  try {
    const preparedCandidate = persistentExtraction.contribution
      ? prepareResearchProjectContributionCandidate(persistentExtraction.contribution, request.currentProject) : null;
    currentTurnNavigation = buildCurrentTurnNavigation({
      sourceTurnRef: latestUser.turnId,
      sourceText: request.languageBoundary?.turnProjections.find((turn) => turn.turnId === latestUser.turnId)?.frenchWorkingText ?? latestUser.content,
      candidate: preparedCandidate, contribution: persistentExtraction.contribution, validation: persistentExtraction.validation,
      currentProject: request.currentProject, preProjectNavigation: request.preProjectNavigation,
      interaction: request.conversation.interactionContext,
      currentNavigation: request.currentNavigation,
      boundedReferentContext: request.boundedReferentContext,
      boundedInteraction: request.boundedInteraction,
      requestKind: request.requestKind,
    });
    const reviewableInitialCandidate = request.requestKind !== "POST_ADOPTION_QRY_CONTINUATION"
      && request.currentProject === null
      && request.preProjectNavigation !== undefined
      && persistentExtraction.validation?.valid === true
      && persistentExtraction.contribution !== null;
    const canaryExtractionStopped = input.providerAttemptPolicy === SINGLE_ATTEMPT_FAIL_CLOSED
      && persistentExtraction.called && persistentExtraction.validation?.valid !== true;
    const requiresGovernedLifecycle = request.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
      || ["CLARIFY_CANDIDATE_REFERENCE", "USER_CONFIRMS_CURRENT_CANDIDATE", "USER_REFUSES_CURRENT_CANDIDATE"]
        .includes(request.boundedInteraction?.kind ?? "");
    if (!requiresGovernedLifecycle && !canaryExtractionStopped) {
      const owners = reviewableInitialCandidate && persistentExtraction.contribution
        ? prepareStandardContextualReasoningRequest({ contribution: persistentExtraction.contribution,
          turns: request.conversation.turns, sessionId: observationContext.sessionId ?? request.conversation.conversationId }) : null;
      const collaborator = prepareScientificCollaboratorConversation(request, owners?.request);
      scientificConversation = { owner: "SCIENTIFIC_THINKING", responseOwner: "DETERMINISTIC", outcome: "DETERMINISTIC_FALLBACK",
        fallbackReason: "PROVIDER_UNAVAILABLE", contextDigest: collaborator.contextDigest,
        providerInput: { systemInstruction: SCIENTIFIC_COLLABORATOR_INSTRUCTION, context: collaborator.context },
        projectWrites: 0, projectWriteAuthorized: false };
      try {
        if (input.apiKey?.trim()) {
          downstreamStage = "HOW";
          howRequestedAt = new Date(input.now?.() ?? Date.now()).toISOString();
          howCalls = 1;
          conversation = await executeNaturalConversation({ ...request, scientificCollaboratorRequest: collaborator },
            input.apiKey, input.fetchImpl, conversationModel, { context: observationContext,
              purpose: "CONVERSATION_REALIZATION", reasoningEffort: null, retryIndex: 0, retryReason: null, onRecord: observeProviderCall });
          scientificConversation = { ...scientificConversation, responseOwner: "LLM", outcome: "NATIVE_TEXT", fallbackReason: null };
        }
      } catch (error) {
        scientificConversation = { ...scientificConversation, fallbackReason: error instanceof ProductBridgeProviderError
          ? error.providerStatus ?? "PROVIDER_FAILURE" : "TECHNICAL_FAILURE" };
      }
      if (scientificConversation.responseOwner === "DETERMINISTIC") governedRealization = realizeGovernedConversation({
        envelope: currentTurnNavigation.envelope, providerReply: null, localWhatText: currentTurnNavigation.localWhatText });
    } else if (!canaryExtractionStopped && input.apiKey?.trim()) {
      downstreamStage = "HOW";
      howRequestedAt = new Date(input.now?.() ?? Date.now()).toISOString();
      howCalls = 1;
      conversation = await executeNaturalConversation(
        { ...request, governedRealization: currentTurnNavigation.envelope },
        input.apiKey,
        input.fetchImpl,
        conversationModel,
        {
          context: observationContext,
          purpose: "CONVERSATION_REALIZATION",
          reasoningEffort: null,
          retryIndex: 0,
          retryReason: null,
          onRecord: observeProviderCall,
        },
      );
      downstreamStage = "CONFORMANCE";
      governedRealization = realizeGovernedConversation({
        envelope: currentTurnNavigation.envelope, providerReply: conversation.value,
        providerClaim: conversation.governedClaim, requireProviderClaim: true,
        localWhatText: currentTurnNavigation.localWhatText,
      });
    } else {
      governedRealization = realizeGovernedConversation({
        envelope: currentTurnNavigation.envelope,
        providerReply: null,
        localWhatText: currentTurnNavigation.localWhatText,
      });
    }
  } catch (error) {
    const provider = error instanceof ProductBridgeProviderError ? safeProviderError(error) : null;
    conversationFailure = { stage: downstreamStage,
      code: downstreamStage === "HOW" ? "CONVERSATION_PROVIDER_FAILURE" : `${downstreamStage}_CONSUMER_FAILURE`,
      message: "Conversation momentanément indisponible.", provider };
    const validatedContributionSurvives = Boolean(persistentExtraction.validation?.valid && persistentExtraction.contribution);
    const governedPostAdoptionReceiptSurvives = request.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
      && currentTurnNavigation !== undefined;
    if (!validatedContributionSurvives && !governedPostAdoptionReceiptSurvives) {
      return { status: 503, body: {
        apiVersion: PRODUCT_BRIDGE_API_VERSION,
        error: conversationFailure,
        observability: providerCallRequestObservability(providerCalls),
      } };
    }
  }
  if (howCalls > 0 && !scientificConversation && governedRealization && !governedRealization.providerReplyAccepted) conversationFailure = {
    stage: "CONFORMANCE", code: governedRealization.conformance.diagnostics[0] ?? "HOW_CONFORMANCE_REJECTED",
    message: "La formulation de cette étape n’a pas abouti. La proposition validée reste conservée sans adoption.", provider: null,
  };
  const assistantReply = scientificConversation?.responseOwner === "LLM"
    ? conversation!.value : governedRealization?.assistantReply ?? "";
  const assistantTurn = { turnId: `noxia-turn:${crypto.randomUUID()}`, role: "NOXIA" as const, content: assistantReply, createdAt };
  return {
    status: 200,
    body: {
      apiVersion: PRODUCT_BRIDGE_API_VERSION,
      assistantReply,
      assistantTurn,
      ...(scientificConversation ? { scientificConversation } : {}),
      conversationFailure,
      currentTurnNavigation,
      governedRealization,
      stageTimestamps: { extractionCompletedAt, howRequestedAt, howCompletedAt: new Date(input.now?.() ?? Date.now()).toISOString() },
      persistentExtraction,
      observability: {
        provider: "GOOGLE_GEMINI",
        model: conversationModel,
        conversationProvider: "GOOGLE_GEMINI",
        conversationModel,
        extractionProvider: request.evaluatePersistentDelta ? "OPENAI" : null,
        extractionModelRequested: request.evaluatePersistentDelta ? extractionModel : null,
        extractionModelReturned,
        conversationLatencyMs: conversation?.latencyMs ?? 0,
        extractionLatencyMs,
        calls: (extractionAttempts + howCalls) as 0 | 1 | 2 | 3,
        conversationCalls: howCalls as 0 | 1,
        conversationResponseReceived: conversation !== null,
        extractionAttempts,
        projectWrites: 0,
        conversationUsage: conversation?.usage ?? null,
        extractionUsage,
        ...providerCallRequestObservability(providerCalls),
      },
    },
  };
};

export const handleProtocolDesignerBridge = async (
  request: ApiRequest,
  response: ApiResponse,
  environment: Record<string, string | undefined> = process.env,
  dependencies: { fetchImpl?: typeof fetch; now?: () => number; providerAttemptPolicy?: ProviderAttemptPolicy } = {},
) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "METHOD_NOT_ALLOWED", message: "Méthode non autorisée." } });
  if (!(header(request.headers, "content-type") ?? "").toLocaleLowerCase("en-US").startsWith("application/json")) {
    return response.status(415).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "INVALID_CONTENT_TYPE", message: "Un corps JSON est requis." } });
  }
  if (!validOrigin(request.headers)) return response.status(403).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origine non autorisée." } });
  if (!protocolDesignerStandardConversationCallsAllowed(environment)) return response.status(503).json({
    apiVersion: PRODUCT_BRIDGE_API_VERSION,
    error: { code: "STANDARD_CONVERSATION_DISABLED", message: "Protocol Designer est temporairement indisponible en production." },
    observability: providerCallRequestObservability([]),
  });
  let body: unknown = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return response.status(400).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "INVALID_REQUEST", message: "JSON invalide." } }); }
  }
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 300_000) {
    return response.status(413).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "PAYLOAD_TOO_LARGE", message: "Conversation trop volumineuse." } });
  }
  const publicAdmission = admitPublicProtocolDesignerRequest({
    headers: request.headers,
    remoteAddress: request.socket?.remoteAddress,
    body,
    now: dependencies.now?.(),
  });
  if ("status" in publicAdmission) return response.status(publicAdmission.status).json({
    apiVersion: PRODUCT_BRIDGE_API_VERSION,
    error: { code: publicAdmission.code, message: publicAdmission.message },
    observability: providerCallRequestObservability([]),
  });
  const providerFetch = createPublicProtocolDesignerBudgetedFetch(
    publicAdmission.sessionKey,
    dependencies.fetchImpl ?? fetch,
  );
  const result = await executeProtocolDesignerBridge({
    body,
    apiKey: environment.GEMINI_API_KEY?.trim() || null,
    openAiApiKey: environment.OPENAI_API_KEY?.trim() || null,
    geminiModel: environment.GEMINI_MODEL,
    openAiExtractionModel: environment.OPENAI_EXTRACTION_MODEL,
    fetchImpl: providerFetch,
    now: dependencies.now,
    providerAttemptPolicy: dependencies.providerAttemptPolicy,
  });
  response.status(result.status).json(result.body);
};

export default handleProtocolDesignerBridge;
