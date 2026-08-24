import { productHybridProviderGate } from "./scientific-interpretation-provider.js";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PRODUCT_BRIDGE_MODEL,
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

const temporalAnchorJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: { type: "string", enum: ["TIMEPOINT", "RELATIVE_EVENT", "WINDOW", "INTERVAL"] },
    direction: { type: "string", enum: ["BEFORE", "AT", "AFTER", "UNKNOWN"] },
    unit: { type: "string" },
    offset: { anyOf: [{ type: "number" }, { type: "null" }] },
    lowerBound: { anyOf: [{ type: "number" }, { type: "null" }] },
    upperBound: { anyOf: [{ type: "number" }, { type: "null" }] },
    relativeEventLabel: { anyOf: [{ type: "string" }, { type: "null" }] },
    tolerance: {
      anyOf: [{
        type: "object",
        additionalProperties: false,
        properties: {
          lower: { anyOf: [{ type: "number" }, { type: "null" }] },
          upper: { anyOf: [{ type: "number" }, { type: "null" }] },
          unit: { type: "string" },
        },
        required: ["lower", "upper", "unit"],
      }, { type: "null" }],
    },
    reference: {
      anyOf: [{
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["KNOWN"] },
          referenceProjectRef: { type: "string" },
        },
        required: ["status", "referenceProjectRef"],
      }, {
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["UNKNOWN"] },
          unresolvedReason: { type: "string", enum: ["REFERENCE_EVENT_NOT_SUPPLIED", "REFERENCE_EVENT_AMBIGUOUS"] },
        },
        required: ["status", "unresolvedReason"],
      }],
    },
  },
  required: ["kind", "direction", "unit", "offset", "lowerBound", "upperBound", "relativeEventLabel", "tolerance", "reference"],
} as const;

export const buildPersistentDeltaPayload = (request: ProductBridgeRequest) => {
  const userTurn = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER");
  const proposalContext = request.conversation.turns
    .filter((turn) => turn.role === "NOXIA")
    .slice(-4)
    .map((turn) => ({ turnId: turn.turnId, content: turn.content }));
  return {
    systemInstruction: { parts: [{ text: PERSISTENT_DELTA_SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: [
      `DERNIER MESSAGE UTILISATEUR (source de l'assertion ou de l'adoption) :\n${userTurn?.content ?? ""}`,
      `PROPOSITIONS NOXIA RÉCENTES (lecture seule ; utilisables uniquement si le dernier message les adopte explicitement) :\n${JSON.stringify(proposalContext, null, 2)}`,
      `RESEARCH PROJECT ADOPTÉ (lecture seule) :\n${JSON.stringify(relevantProjectContext(request.currentProject), null, 2)}`,
    ].join("\n\n") }] }],
    tools: [{ functionDeclarations: [{
      name: FUNCTION_NAME,
      description: "Propose only persistent scientific objects and relations grounded in an explicit user statement or explicit adoption; return empty lists when there is no persistent consequence.",
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
                operation: {
                  type: "string",
                  enum: ["ADD", "REMOVE", "REPLACE"],
                  description: "ADD creates a genuinely new scientific identity. REPLACE or REMOVE modifies one existing canonical Project object identified by targetProjectRef.",
                },
                sourceText: { type: "string" },
                targetProjectRef: {
                  anyOf: [{ type: "string" }, { type: "null" }],
                  description: "Exact stable ID of the existing object being REPLACED or REMOVED. MUST be null for ADD. Never use it only to provide context for a new object.",
                },
                candidateRef: { type: "string", description: "New local reference for this proposed change; for ADD it must not reuse an existing Project stable ID." },
                semanticIdentity: { anyOf: [{ type: "string" }, { type: "null" }], description: "Scientific identity of the proposed object. Preserve an existing identity for REPLACE; use a new identity for ADD." },
                proposedType: { type: "string" },
                content: { type: "string" },
                polarity: { type: "string", enum: ["AFFIRMED", "NEGATED", "UNKNOWN"] },
                studyRole: {
                  anyOf: [{ type: "string" }, { type: "null" }],
                  description: "Scientific role explicitly stated by the user. For a role replacement, null explicitly clears the old role before PRIMARY_ENDPOINT is assigned to the distinct new or existing object.",
                },
                epistemicStatus: { type: "string", enum: ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { anyOf: [{ type: "string" }, { type: "null" }] },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "sourceText", "targetProjectRef", "candidateRef", "semanticIdentity", "proposedType", "content", "polarity", "studyRole", "epistemicStatus", "assertionKind", "proposalSourceText", "evidenceRefs"],
            },
          },
          relations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                relationRef: { type: "string" },
                sourceText: { type: "string" },
                relationType: { type: "string" },
                sourceObjectRef: { type: "string", description: "Existing canonical Project stable ID or candidateRef declared in this same output." },
                targetObjectRef: { type: "string", description: "Existing canonical Project stable ID or candidateRef declared in this same output." },
                polarity: { type: "string", enum: ["AFFIRMED", "NEGATED", "UNKNOWN"] },
                epistemicStatus: { type: "string", enum: ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { anyOf: [{ type: "string" }, { type: "null" }] },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["relationRef", "sourceText", "relationType", "sourceObjectRef", "targetObjectRef", "polarity", "epistemicStatus", "assertionKind", "proposalSourceText", "evidenceRefs"],
            },
          },
          temporalQualifications: {
            type: "array",
            description: "Typed temporal value changes carried by an existing Project object. Never create a TEMPORAL_ANCHOR root object.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                operation: { type: "string", enum: ["ADD", "REMOVE", "REPLACE"] },
                qualificationId: { type: "string", description: "Stable qualification identity. Preserve it for REPLACE or REMOVE." },
                sourceText: { type: "string" },
                subjectProjectRef: { type: "string", description: "Exact stable ID of the existing Project object carrying the temporal role." },
                temporalRole: { type: "string", enum: ["ACQUISITION_TIME", "COLLECTION_TIME", "PROCESSING_TIME", "TRANSFORMATION_TIME", "ANALYSIS_TIME"] },
                anchor: { anyOf: [temporalAnchorJsonSchema, { type: "null" }] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { anyOf: [{ type: "string" }, { type: "null" }] },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "qualificationId", "sourceText", "subjectProjectRef", "temporalRole", "anchor", "assertionKind", "proposalSourceText", "evidenceRefs"],
            },
          },
          expectedVariableOccasions: {
            type: "array",
            description: "Expected occasions for one existing CANONICAL_VARIABLE; these are not observed values and do not duplicate the variable.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                operation: { type: "string", enum: ["ADD", "REMOVE", "REPLACE"] },
                occasionId: { type: "string", description: "Stable expected-occasion identity. Preserve it for REPLACE or REMOVE." },
                sourceText: { type: "string" },
                variableProjectRef: { type: "string", description: "Exact stable ID of an existing CANONICAL_VARIABLE." },
                anchor: { anyOf: [temporalAnchorJsonSchema, { type: "null" }] },
                studyUnitOrGroupRef: { anyOf: [{ type: "string" }, { type: "null" }] },
                applicableContext: { anyOf: [{ type: "string" }, { type: "null" }] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { anyOf: [{ type: "string" }, { type: "null" }] },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "occasionId", "sourceText", "variableProjectRef", "anchor", "studyUnitOrGroupRef", "applicableContext", "assertionKind", "proposalSourceText", "evidenceRefs"],
            },
          },
        },
        required: ["changes", "relations", "temporalQualifications", "expectedVariableOccasions"],
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
