import { ProductBridgeClientError, requestConversationLanguageProjection } from "@/features/protocol-designer/product-bridge-client";
import { type ProductBridgeLanguageBoundary } from "@/features/protocol-designer/product-bridge";
import { appendLanguageTurnToGatewayState, appendLocalizedResponseToGatewayState, buildLocalizedConversationResponse, buildMultilingualUserTurn, DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL, detectConversationLanguage, extractProtectedOpaqueLiterals, findReusableLanguageProjection, languageProjectionIdentityDigest, LANGUAGE_PROJECTION_CONTRACT_VERSION, type ConversationLanguageGatewayState, type LanguageProjectionContractFailureDiagnostic, type LanguageProjectionArtifact, type LanguageProjectionRequest, type LocalizedConversationResponse, type MultilingualUserTurn } from "@/features/protocol-designer/conversation-language-gateway";
import type { ProviderCallRecord, ProviderCallRequestObservability } from "@/features/protocol-designer/provider-call-observability";
import { createTurnId, type FunctionalResetSession } from "./functional-reset/session";

// Application effects only: pure linguistic contracts remain in the gateway.
export const productBridgeClientErrorCode = (error: unknown) => error && typeof error === "object"
  && "code" in error && typeof error.code === "string"
  ? error.code
  : null;

export type LanguageProjectionRequestFailure = Error & Readonly<{
  code: string;
  languageProjectionRequest: LanguageProjectionRequest;
  languageProjectionDiagnostic: LanguageProjectionContractFailureDiagnostic | null;
  observability: ProviderCallRequestObservability | null;
}>;

export const providerRecordsFromError = (error: unknown): readonly ProviderCallRecord[] =>
  error instanceof ProductBridgeClientError ? error.observability?.providerCalls ?? []
    : error && typeof error === "object" && "observability" in error
      ? (error.observability as ProviderCallRequestObservability | null)?.providerCalls ?? [] : [];

export const languageProjectionRequestFromError = (error: unknown) => error && typeof error === "object"
  && "languageProjectionRequest" in error
  && error.languageProjectionRequest
  && typeof error.languageProjectionRequest === "object"
  ? error.languageProjectionRequest as LanguageProjectionRequest
  : null;

export const languageProjectionDiagnosticFromError = (error: unknown) => error && typeof error === "object"
  && "languageProjectionDiagnostic" in error
  && error.languageProjectionDiagnostic
  && typeof error.languageProjectionDiagnostic === "object"
  ? error.languageProjectionDiagnostic as LanguageProjectionContractFailureDiagnostic
  : null;

export const languageBoundaryFor = (
  state: Readonly<ConversationLanguageGatewayState>,
): ProductBridgeLanguageBoundary => ({
  contract: "PRODUCT_BRIDGE_LANGUAGE_BOUNDARY",
  contractVersion: "1.0.0",
  workingLanguage: "fr",
  turnProjections: state.turns.flatMap((turn) => turn.frenchWorkingText && turn.frenchWorkingTextDigest
    ? [{
      turnId: turn.turnId,
      originalTextDigest: turn.originalTextDigest,
      frenchWorkingText: turn.frenchWorkingText,
      frenchWorkingTextDigest: turn.frenchWorkingTextDigest,
      sourceLanguage: turn.sourceLanguage ?? "unknown",
      translationProjectionRef: turn.provenance.projectionRef,
      originalIsImmutableEvidence: true as const,
      workingProjectionIsUserLiteral: false as const,
    }]
    : []),
});

export const requestOrReuseLanguageProjection = async (input: {
  state: Readonly<ConversationLanguageGatewayState>;
  projectionKind: LanguageProjectionRequest["projectionKind"];
  sourceText: string;
  sourceLanguage: string | "UNKNOWN";
  targetLanguage: string;
  observabilityContext: NonNullable<LanguageProjectionRequest["observabilityContext"]>;
  onProviderCallRecords?: (records: readonly ProviderCallRecord[]) => void;
}): Promise<{
  projection: LanguageProjectionArtifact;
  providerCalls: 0 | 1;
  providerCallRecords: readonly ProviderCallRecord[];
}> => {
  const protectedOpaqueLiterals = extractProtectedOpaqueLiterals(input.sourceText);
  const projectionIdentityDigest = languageProjectionIdentityDigest({
    projectionKind: input.projectionKind,
    sourceText: input.sourceText,
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    provider: "OPENAI",
    model: DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
    protectedOpaqueLiterals,
  });
  const cached = findReusableLanguageProjection({ state: input.state, projectionIdentityDigest });
  if (cached) return { projection: cached, providerCalls: 0, providerCallRecords: [] };
  const request: LanguageProjectionRequest = {
    apiVersion: "1.0.0",
    operation: "LANGUAGE_PROJECTION",
    projectionKind: input.projectionKind,
    sourceText: input.sourceText,
    sourceLanguageHint: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    translationContractVersion: LANGUAGE_PROJECTION_CONTRACT_VERSION,
    projectionIdentityDigest,
    protectedOpaqueLiterals,
    observabilityContext: input.observabilityContext,
  };
  let response: Awaited<ReturnType<typeof requestConversationLanguageProjection>>;
  try {
    response = await requestConversationLanguageProjection(request);
    input.onProviderCallRecords?.(response.observability.providerCalls ?? []);
  } catch (error) {
    input.onProviderCallRecords?.(providerRecordsFromError(error));
    const failure = new Error(
      error instanceof Error ? error.message : "Cette langue ne peut pas être traitée pour le moment.",
    ) as LanguageProjectionRequestFailure;
    Object.assign(failure, {
      name: "LanguageProjectionRequestFailure",
      code: productBridgeClientErrorCode(error) ?? "LANGUAGE_PROJECTION_UNAVAILABLE",
      observability: error instanceof ProductBridgeClientError ? error.observability : null,
      languageProjectionRequest: request,
      languageProjectionDiagnostic: error && typeof error === "object" && "diagnostic" in error
        ? error.diagnostic as LanguageProjectionContractFailureDiagnostic | null
        : null,
    });
    throw failure;
  }
  return {
    projection: response.projection,
    providerCalls: 1,
    providerCallRecords: response.observability.providerCalls ?? [],
  };
};

export const prepareMultilingualUserTurn = async (input: {
  session: Readonly<FunctionalResetSession>;
  turnId: string;
  originalText: string;
  onProviderCallRecords?: (records: readonly ProviderCallRecord[]) => void;
}): Promise<{
  turn: MultilingualUserTurn;
  state: ConversationLanguageGatewayState;
  providerCalls: 0 | 1;
  providerCallRecords: readonly ProviderCallRecord[];
}> => {
  let detection = detectConversationLanguage(input.originalText);
  if (detection.status === "INSUFFICIENT_EVIDENCE" && input.session.conversationLanguageGateway.conversationLanguage) {
    detection = {
      status: "DETECTED",
      detectedLanguage: input.session.conversationLanguageGateway.conversationLanguage,
      confidence: "LOW",
      reasonCode: "SESSION_LANGUAGE_INHERITED_FOR_SHORT_TURN",
    };
  }
  const sourceLanguage = detection.detectedLanguage ?? "UNKNOWN";
  const translationRequired = sourceLanguage !== "fr" && detection.status !== "INSUFFICIENT_EVIDENCE";
  const requested = translationRequired
    ? await requestOrReuseLanguageProjection({
      state: input.session.conversationLanguageGateway,
      projectionKind: "INPUT_TO_FRENCH",
      sourceText: input.originalText,
      sourceLanguage,
      targetLanguage: "fr",
      onProviderCallRecords: input.onProviderCallRecords,
      observabilityContext: {
        sessionId: input.session.sessionId,
        conversationId: input.session.conversationId,
        turnId: input.turnId,
        clientRequestId: `language-projection:${input.turnId}:INPUT_TO_FRENCH`,
        testSessionId: null,
      },
    })
    : null;
  const turn = buildMultilingualUserTurn({
    turnId: input.turnId,
    originalText: input.originalText,
    detection,
    currentConversationLanguage: input.session.conversationLanguageGateway.conversationLanguage,
    projection: requested?.projection ?? null,
    project: input.session.project,
  });
  return {
    turn,
    state: appendLanguageTurnToGatewayState({
      state: input.session.conversationLanguageGateway,
      turn,
      projection: requested?.projection,
    }),
    providerCalls: requested?.providerCalls ?? 0,
    providerCallRecords: requested?.providerCallRecords ?? [],
  };
};

export const localizeCanonicalFrenchResponse = async (input: {
  state: Readonly<ConversationLanguageGatewayState>;
  sourceTurnRef: string;
  responseId: string;
  canonicalFrenchResponse: string;
  sessionId: string;
  conversationId: string;
  onProviderCallRecords?: (records: readonly ProviderCallRecord[]) => void;
}): Promise<{
  response: LocalizedConversationResponse;
  state: ConversationLanguageGatewayState;
  providerCalls: 0 | 1;
  providerCallRecords: readonly ProviderCallRecord[];
}> => {
  const targetLanguage = input.state.conversationLanguage ?? "fr";
  const requested = targetLanguage === "fr"
    ? null
    : await requestOrReuseLanguageProjection({
      state: input.state,
      projectionKind: "OUTPUT_FROM_FRENCH",
      sourceText: input.canonicalFrenchResponse,
      sourceLanguage: "fr",
      targetLanguage,
      onProviderCallRecords: input.onProviderCallRecords,
      observabilityContext: {
        sessionId: input.sessionId,
        conversationId: input.conversationId,
        turnId: input.sourceTurnRef,
        clientRequestId: `language-projection:${input.responseId}:OUTPUT_FROM_FRENCH`,
        testSessionId: null,
      },
    });
  const response = buildLocalizedConversationResponse({
    responseId: input.responseId,
    sourceTurnRef: input.sourceTurnRef,
    canonicalFrenchResponse: input.canonicalFrenchResponse,
    targetLanguage,
    projection: requested?.projection ?? null,
  });
  return {
    response,
    state: appendLocalizedResponseToGatewayState({ state: input.state, response, projection: requested?.projection }),
    providerCalls: requested?.providerCalls ?? 0,
    providerCallRecords: requested?.providerCallRecords ?? [],
  };
};

export type PreparedGatewayUserInput = Readonly<{
  originalText: string;
  workingText: string;
  turnId: string;
  createdAt: string;
  multilingualTurn: MultilingualUserTurn;
  gatewayState: ConversationLanguageGatewayState;
  onProviderCallRecords: (records: readonly ProviderCallRecord[]) => void;
}>;

export const normalizePreparedUserInput = (input: string | PreparedGatewayUserInput) => typeof input === "string"
  ? {
    originalText: input,
    workingText: input,
    turnId: createTurnId(),
    createdAt: new Date().toISOString(),
    multilingualTurn: null,
    gatewayState: null,
    onProviderCallRecords: undefined,
  }
  : input;
