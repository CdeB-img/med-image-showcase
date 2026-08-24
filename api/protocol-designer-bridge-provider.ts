import { productHybridProviderGate } from "./scientific-interpretation-provider.js";
import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_OBJECT_TYPES,
  PERSISTENT_PROJECT_RELATION_TYPES,
  PERSISTENT_PROJECT_STUDY_ROLES,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PRODUCT_BRIDGE_MODEL,
  relevantProjectContext,
  type PersistentExtractionProviderArtifact,
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
    request.requestKind === "POST_ADOPTION_QRY_CONTINUATION"
      ? "Tâche actuelle : le Project vient d'être adopté. Formule uniquement la continuation naturelle courte du besoin QRY fourni ; ne récapitule pas le Project et ne choisis pas un autre besoin."
      : "Tâche actuelle : répondre naturellement au dernier message du chercheur.",
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
      description: "Propose every persistent scientific object, relation and temporal qualification grounded in the complete explicit user statement or explicit adoption; preserve multiple independent consequences from one turn and return empty lists only when there is no persistent consequence.",
      parametersJsonSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          changes: {
            type: "array",
            description: "All atomic persistent object changes explicitly supported by the complete user turn. Do not collapse population criteria, study arms, objectives, modalities, acquisitions or data needs that have distinct identities.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                operation: {
                  type: "string",
                  enum: ["ADD", "REMOVE", "REPLACE"],
                  description: "ADD creates a genuinely new scientific identity. REPLACE or REMOVE modifies one existing canonical Project object identified by targetProjectRef.",
                },
                sourceText: {
                  type: "string",
                  description: "Exact fragment of the latest user message that states this ADD or authorizes this REPLACE/REMOVE. Never copy previous Project content unless the latest user message literally repeats it.",
                },
                targetProjectRef: {
                  type: "string",
                  description: "Optional. Exact stableId from the Project Context Snapshot objects inventory for the existing object being REPLACED or REMOVED. Omit for ADD. Never emit a textual null sentinel, label, section ID or invented ID, and never use it only to provide context for a new object.",
                },
                candidateRef: { type: "string", description: "New local reference for this proposed change; for ADD it must not reuse an existing Project stable ID." },
                semanticIdentity: { type: "string", description: "Optional scientific identity. Preserve an existing identity for REPLACE; use a new identity for ADD. Omit when not established." },
                proposedType: {
                  type: "string",
                  enum: PERSISTENT_PROJECT_OBJECT_TYPES,
                  description: "Use one existing Project backbone type. Keep OBJECTIVE distinct from ENDPOINT/CANONICAL_VARIABLE; keep INTERVENTION distinct from COMPARATOR; use IMAGING_MODALITY, ACQUISITION and DATA_NEED without inventing a MeasurementDefinition.",
                },
                content: { type: "string" },
                polarity: { type: "string", enum: ["AFFIRMED", "NEGATED", "UNKNOWN"] },
                studyRole: {
                  type: ["string", "null"],
                  enum: [...PERSISTENT_PROJECT_STUDY_ROLES, null],
                  description: "Optional source-grounded role, independent from proposedType. Omit when no role is established. Null is allowed only on REPLACE to clear an existing role. Never emit a textual null sentinel and never infer priority from mere mention.",
                },
                epistemicStatus: { type: "string", enum: ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"] },
                epistemicState: {
                  type: "string",
                  enum: ["KNOWN", "ASSUMED", "UNKNOWN", "WITHHELD"],
                  description: "PD-003 epistemic state, independent from linguistic provenance. Use UNKNOWN when explicit content has an unresolved scope or qualifier.",
                },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "sourceText", "candidateRef", "proposedType", "content", "polarity", "epistemicStatus", "epistemicState", "assertionKind", "evidenceRefs"],
            },
          },
          relations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                relationRef: { type: "string" },
                sourceText: { type: "string", description: "Exact fragment of the latest user message that states this relation." },
                relationType: {
                  type: "string",
                  enum: PERSISTENT_PROJECT_RELATION_TYPES,
                  description: "Use only a relation admitted by the current Project compiler. Do not invent a more convenient relation type.",
                },
                sourceObjectRef: { type: "string", description: "Existing canonical Project stable ID or candidateRef declared in this same output: use the exact stableId from the Project Context Snapshot objects inventory or a candidateRef declared in changes. Never use a label, content, section ID or invented ID." },
                targetObjectRef: { type: "string", description: "Existing canonical Project stable ID or candidateRef declared in this same output: use the exact stableId from the Project Context Snapshot objects inventory or a candidateRef declared in changes. Omit the optional relation when no compatible endpoint exists; never invent an ID." },
                polarity: { type: "string", enum: ["AFFIRMED", "NEGATED", "UNKNOWN"] },
                epistemicStatus: { type: "string", enum: ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"] },
                epistemicState: { type: "string", enum: ["KNOWN", "ASSUMED", "UNKNOWN", "WITHHELD"] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["relationRef", "sourceText", "relationType", "sourceObjectRef", "targetObjectRef", "polarity", "epistemicStatus", "epistemicState", "assertionKind", "evidenceRefs"],
            },
          },
          temporalQualifications: {
            type: "array",
            description: "All explicit typed temporal value changes carried by an existing object or by a candidateRef declared in changes of this same output. Never create a TEMPORAL_ANCHOR root object and never drop an explicit time because its reference event is unknown.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                operation: { type: "string", enum: ["ADD", "REMOVE", "REPLACE"] },
                qualificationId: { type: "string", description: "Stable qualification identity. Preserve it for REPLACE or REMOVE." },
                sourceText: { type: "string" },
                subjectProjectRef: { type: "string", description: "Exact stable ID of an existing Project object or candidateRef declared in changes of this same output and carrying the temporal role." },
                temporalRole: { type: "string", enum: ["ACQUISITION_TIME", "COLLECTION_TIME", "PROCESSING_TIME", "TRANSFORMATION_TIME", "ANALYSIS_TIME"] },
                anchor: { anyOf: [temporalAnchorJsonSchema, { type: "null" }] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "qualificationId", "sourceText", "subjectProjectRef", "temporalRole", "anchor", "assertionKind", "evidenceRefs"],
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
                variableProjectRef: { type: "string", description: "Exact stable ID of an existing CANONICAL_VARIABLE or candidateRef for a CANONICAL_VARIABLE declared in changes of this same output." },
                anchor: { anyOf: [temporalAnchorJsonSchema, { type: "null" }] },
                studyUnitOrGroupRef: { type: "string", description: "Optional stable Project or candidate-local group reference." },
                applicableContext: { type: "string", description: "Optional bounded applicability context." },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "occasionId", "sourceText", "variableProjectRef", "anchor", "assertionKind", "evidenceRefs"],
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
): Promise<ProductBridgeProviderResult<{
  structuredArgs: unknown;
  providerArtifact: PersistentExtractionProviderArtifact;
}>> => {
  const result = await callGemini(apiKey, "PERSISTENT_DELTA", buildPersistentDeltaPayload(request), fetchImpl);
  const call = result.value.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.functionCall)
    .find((candidate) => candidate?.name === FUNCTION_NAME);
  if (!call?.args || typeof call.args !== "object" || Array.isArray(call.args)) {
    throw new ProductBridgeProviderError("PERSISTENT_DELTA", 200, "FUNCTION_CALL_MISSING", "Gemini returned no persistent-delta function arguments.", result.responseId);
  }
  const structuredArgsSerialized = JSON.stringify(call.args);
  const structuredArgsDigest = logicalDigest(structuredArgsSerialized);
  const requestTurnRef = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER")?.turnId ?? "UNKNOWN_USER_TURN";
  return {
    ...result,
    value: {
      structuredArgs: call.args as PersistentProjectDeltaCandidate,
      providerArtifact: {
        artifactRef: `gemini-structured-args:${structuredArgsDigest}`,
        requestTurnRef,
        provider: "GOOGLE_GEMINI",
        model: PRODUCT_BRIDGE_MODEL,
        functionName: FUNCTION_NAME,
        receivedAt: new Date().toISOString(),
        providerResponseId: result.responseId,
        structuredArgsExact: call.args,
        structuredArgsSerialized,
        structuredArgsDigest,
      },
    },
  };
};
