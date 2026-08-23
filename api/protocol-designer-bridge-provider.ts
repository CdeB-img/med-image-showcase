import { productHybridProviderGate } from "./scientific-interpretation-provider.js";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PRODUCT_BRIDGE_MODEL,
  PROJECT_SECTION_IDS,
  relevantProjectContext,
  type PersistentProjectDeltaCandidate,
  type ProductBridgeRequest,
} from "../src/features/protocol-designer/product-bridge.js";

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(PRODUCT_BRIDGE_MODEL)}:generateContent`;
const FUNCTION_NAME = "propose_persistent_project_delta";

type GeminiUsage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

type GeminiBody = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown; functionCall?: { name?: unknown; args?: unknown } }> } }>;
  usageMetadata?: GeminiUsage;
  responseId?: string;
  error?: { code?: number; status?: string; message?: string; details?: unknown };
};

export type ProductBridgeProviderResult<T> = {
  value: T;
  latencyMs: number;
  httpStatus: number;
  responseId: string | null;
  usage: GeminiUsage | null;
};

export class ProductBridgeProviderError extends Error {
  constructor(
    readonly stage: "CONVERSATION" | "PERSISTENT_DELTA",
    readonly httpStatus: number | null,
    readonly providerStatus: string | null,
    readonly providerMessage: string,
    readonly responseId: string | null = null,
  ) {
    super(`${stage}:${providerStatus ?? "TRANSPORT_FAILURE"}`);
    this.name = "ProductBridgeProviderError";
  }
}

const recentTurns = (request: ProductBridgeRequest) => request.conversation.turns.slice(-10);

export const naturalConversationContext = (request: ProductBridgeRequest) => {
  const interaction = request.conversation.interactionContext;
  const project = relevantProjectContext(request.currentProject);
  const lines = [
    "Contexte de travail utile :",
    project
      ? `Research Project adopté (lecture seule), version ${project.revision} :\n${project.sections.map((section) => {
        const items = section.elements.map((element) => `- [${element.stableId}] ${element.content}`).join("\n");
        return `${section.label} :${items ? `\n${items}` : " aucune information adoptée"}`;
      }).join("\n")}`
      : "Aucun Research Project n'est encore adopté.",
    interaction
      ? `Besoin QRY actif : ${interaction.purpose}\nRéférences du besoin : ${interaction.informationNeedRefs.join(", ") || "aucune"}`
      : "Aucun besoin QRY actif.",
    "Conversation récente :",
    ...recentTurns(request).map((turn) => `${turn.role === "USER" ? "Chercheur" : "NOXIA"} : ${turn.content}`),
  ];
  return lines.join("\n\n");
};

export const buildNaturalConversationPayload = (request: ProductBridgeRequest) => ({
  systemInstruction: { parts: [{ text: NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION }] },
  contents: [{ role: "user", parts: [{ text: naturalConversationContext(request) }] }],
});

export const buildPersistentDeltaPayload = (request: ProductBridgeRequest) => {
  const userTurn = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER");
  return {
    systemInstruction: { parts: [{ text: PERSISTENT_DELTA_SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: [
      `DERNIER MESSAGE UTILISATEUR (source exclusive) :\n${userTurn?.content ?? ""}`,
      `RESEARCH PROJECT ADOPTÉ (lecture seule) :\n${JSON.stringify(relevantProjectContext(request.currentProject), null, 2)}`,
    ].join("\n\n") }] }],
    tools: [{ functionDeclarations: [{
      name: FUNCTION_NAME,
      description: "Propose only explicit user-grounded persistent Research Project changes; return an empty list when there is no such change.",
      parametersJsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          changes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                operation: { type: "string", enum: ["ADD", "REMOVE", "REPLACE"] },
                sourceText: { type: "string" },
                targetSectionId: { type: "string", enum: PROJECT_SECTION_IDS },
                targetProjectRef: { anyOf: [{ type: "string" }, { type: "null" }] },
                content: { type: "string" },
              },
              required: ["operation", "sourceText", "targetSectionId", "targetProjectRef", "content"],
            },
          },
        },
        required: ["changes"],
      },
    }] }],
    toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [FUNCTION_NAME] } },
  };
};

const callGemini = async (
  apiKey: string,
  stage: ProductBridgeProviderError["stage"],
  payload: unknown,
  fetchImpl: typeof fetch = fetch,
): Promise<ProductBridgeProviderResult<GeminiBody>> => {
  const started = Date.now();
  let response: Response;
  try {
    response = await productHybridProviderGate.run(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45_000);
      try {
        return await fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    });
  } catch (error) {
    throw new ProductBridgeProviderError(stage, null, error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "NETWORK_FAILURE", "Provider request failed.");
  }
  const text = await response.text();
  let body: GeminiBody;
  try {
    body = JSON.parse(text) as GeminiBody;
  } catch {
    throw new ProductBridgeProviderError(stage, response.status, "INVALID_PROVIDER_JSON", "Provider returned invalid JSON.");
  }
  if (!response.ok) throw new ProductBridgeProviderError(
    stage,
    response.status,
    body.error?.status ?? `HTTP_${response.status}`,
    body.error?.message ?? "Gemini request failed.",
    body.responseId ?? null,
  );
  return {
    value: body,
    latencyMs: Date.now() - started,
    httpStatus: response.status,
    responseId: body.responseId ?? null,
    usage: body.usageMetadata ?? null,
  };
};

export const executeNaturalConversation = async (
  request: ProductBridgeRequest,
  apiKey: string,
  fetchImpl?: typeof fetch,
): Promise<ProductBridgeProviderResult<string>> => {
  const result = await callGemini(apiKey, "CONVERSATION", buildNaturalConversationPayload(request), fetchImpl);
  const reply = result.value.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
  if (!reply) throw new ProductBridgeProviderError("CONVERSATION", 200, "TEXT_RESPONSE_MISSING", "Gemini returned no visible conversational text.", result.responseId);
  return { ...result, value: reply };
};

export const executePersistentDelta = async (
  request: ProductBridgeRequest,
  apiKey: string,
  fetchImpl?: typeof fetch,
): Promise<ProductBridgeProviderResult<unknown>> => {
  const result = await callGemini(apiKey, "PERSISTENT_DELTA", buildPersistentDeltaPayload(request), fetchImpl);
  const call = result.value.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.functionCall)
    .find((candidate) => candidate?.name === FUNCTION_NAME);
  if (!call?.args || typeof call.args !== "object" || Array.isArray(call.args)) {
    throw new ProductBridgeProviderError("PERSISTENT_DELTA", 200, "FUNCTION_CALL_MISSING", "Gemini returned no persistent-delta function arguments.", result.responseId);
  }
  return { ...result, value: call.args as PersistentProjectDeltaCandidate };
};
