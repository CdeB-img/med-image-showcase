import { detectSensitiveData } from "../src/features/protocol-designer/intake/privacy.js";
import {
  PRODUCT_BRIDGE_API_VERSION,
  buildPersistentSourceCatalog,
  contributionFromPersistentDelta,
  materializePersistentSourceAnchors,
  parseProductBridgeRequest,
  resolveGeminiConversationModel,
  resolveOpenAIExtractionModel,
  validatePersistentProviderContract,
  validatePersistentProjectDelta,
  type ProductBridgeResponse,
} from "../src/features/protocol-designer/product-bridge.js";
import {
  ProductBridgeProviderError,
  executeNaturalConversation,
} from "./protocol-designer-bridge-provider.js";
import { executeOpenAIPersistentDelta } from "./protocol-designer-openai-extraction-provider.js";

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

export const executeProtocolDesignerBridge = async (input: {
  body: unknown;
  apiKey: string | null;
  openAiApiKey?: string | null;
  geminiModel?: string | null;
  openAiExtractionModel?: string | null;
  fetchImpl?: typeof fetch;
  now?: () => number;
  onPersistentProviderArtifact?: (artifact: NonNullable<ProductBridgeResponse["persistentExtraction"]["providerArtifact"]>) => void;
}): Promise<{ status: number; body: ProductBridgeResponse | Record<string, unknown> }> => {
  const request = parseProductBridgeRequest(input.body);
  if (!request) return { status: 400, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "INVALID_REQUEST", message: "Contrat du pont produit invalide." } } };
  const latestUser = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER");
  if (!latestUser) return { status: 400, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "USER_TURN_MISSING", message: "Message utilisateur manquant." } } };
  if (detectSensitiveData(latestUser.content).length) return { status: 422, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "LOCAL_SAFETY_BLOCKED", message: "Retirez toute donnée personnelle, patient ou confidentielle." } } };
  if (!input.apiKey?.trim()) return { status: 503, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "GEMINI_API_KEY_MISSING", message: "Conversation momentanément indisponible." } } };

  let conversation;
  const conversationModel = resolveGeminiConversationModel(input.geminiModel);
  const extractionModel = resolveOpenAIExtractionModel(input.openAiExtractionModel);
  try {
    conversation = await executeNaturalConversation(request, input.apiKey, input.fetchImpl, conversationModel);
  } catch (error) {
    const provider = error instanceof ProductBridgeProviderError ? safeProviderError(error) : null;
    return { status: 503, body: { apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "CONVERSATION_PROVIDER_FAILURE", message: "Conversation momentanément indisponible.", provider } } };
  }

  const createdAt = new Date(input.now?.() ?? Date.now()).toISOString();
  const assistantTurn = { turnId: `noxia-turn:${crypto.randomUUID()}`, role: "NOXIA" as const, content: conversation.value, createdAt };
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
  let providerStarts: 1 | 2 = 1;

  if (request.evaluatePersistentDelta) {
    try {
      if (!input.openAiApiKey?.trim()) {
        throw new ProductBridgeProviderError(
          "PERSISTENT_DELTA", null, "OPENAI_API_KEY_MISSING", "Persistent extraction is unavailable.", null, "OPENAI",
        );
      }
      providerStarts = 2;
      const extracted = await executeOpenAIPersistentDelta(request, input.openAiApiKey, input.fetchImpl, extractionModel);
      extractionLatencyMs = extracted.latencyMs;
      extractionUsage = extracted.usage;
      extractionModelReturned = extracted.modelReturned;
      input.onPersistentProviderArtifact?.(extracted.value.providerArtifact);
      const providerContract = validatePersistentProviderContract(extracted.value.structuredArgs);
      const sourceCatalog = extracted.value.providerArtifact.sourceCatalog ?? buildPersistentSourceCatalog(request.conversation);
      const materialized = materializePersistentSourceAnchors({
        value: extracted.value.structuredArgs,
        catalog: sourceCatalog,
        currentUserTurn: { turnId: latestUser.turnId, content: latestUser.content },
      });
      const checked = materialized.value
        ? validatePersistentProjectDelta(materialized.value, latestUser.content, request.currentProject, request.conversation)
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
      persistentExtraction = {
        called: true,
        status: validation.valid
          ? (checked.candidate?.changes.length
            || checked.candidate?.relations.length
            || checked.candidate?.temporalQualifications.length
            || checked.candidate?.expectedVariableOccasions.length) ? "CANDIDATE" : "NO_CHANGE"
          : "BLOCKED",
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
      };
    } catch (error) {
      const provider = error instanceof ProductBridgeProviderError ? safeProviderError(error) : null;
      persistentExtraction = {
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
      };
    }
  }

  return {
    status: 200,
    body: {
      apiVersion: PRODUCT_BRIDGE_API_VERSION,
      assistantReply: conversation.value,
      assistantTurn,
      persistentExtraction,
      observability: {
        provider: "GOOGLE_GEMINI",
        model: conversationModel,
        conversationProvider: "GOOGLE_GEMINI",
        conversationModel,
        extractionProvider: request.evaluatePersistentDelta ? "OPENAI" : null,
        extractionModelRequested: request.evaluatePersistentDelta ? extractionModel : null,
        extractionModelReturned,
        conversationLatencyMs: conversation.latencyMs,
        extractionLatencyMs,
        calls: providerStarts,
        projectWrites: 0,
        conversationUsage: conversation.usage,
        extractionUsage,
      },
    },
  };
};

export const handleProtocolDesignerBridge = async (request: ApiRequest, response: ApiResponse) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "METHOD_NOT_ALLOWED", message: "Méthode non autorisée." } });
  if (!(header(request.headers, "content-type") ?? "").toLocaleLowerCase("en-US").startsWith("application/json")) {
    return response.status(415).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "INVALID_CONTENT_TYPE", message: "Un corps JSON est requis." } });
  }
  if (!validOrigin(request.headers)) return response.status(403).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "ORIGIN_NOT_ALLOWED", message: "Origine non autorisée." } });
  let body: unknown = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return response.status(400).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "INVALID_REQUEST", message: "JSON invalide." } }); }
  }
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 300_000) {
    return response.status(413).json({ apiVersion: PRODUCT_BRIDGE_API_VERSION, error: { code: "PAYLOAD_TOO_LARGE", message: "Conversation trop volumineuse." } });
  }
  const result = await executeProtocolDesignerBridge({
    body,
    apiKey: process.env.GEMINI_API_KEY?.trim() || null,
    openAiApiKey: process.env.OPENAI_API_KEY?.trim() || null,
    geminiModel: process.env.GEMINI_MODEL,
    openAiExtractionModel: process.env.OPENAI_EXTRACTION_MODEL,
  });
  response.status(result.status).json(result.body);
};

export default handleProtocolDesignerBridge;
