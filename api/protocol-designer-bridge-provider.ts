import { productHybridProviderGate } from "./scientific-interpretation-provider.js";
import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_OBJECT_TYPES,
  PERSISTENT_PROJECT_RELATION_TYPES,
  PERSISTENT_PROJECT_STUDY_ROLES,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PRODUCT_BRIDGE_MODEL,
  buildNaturalConversationPayload,
  buildPersistentSourceCatalog,
  naturalConversationContext,
  relevantProjectContext,
  resolveGeminiConversationModel,
  type PersistentExtractionProviderArtifact,
  type PersistentProjectDeltaCandidate,
  type ProductBridgeRequest,
} from "../src/features/protocol-designer/product-bridge.js";

export { buildNaturalConversationPayload, naturalConversationContext };

const FUNCTION_NAME = "propose_persistent_project_delta";
const geminiEndpoint = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

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
    readonly provider: "GOOGLE_GEMINI" | "OPENAI" = "GOOGLE_GEMINI",
    readonly requestId: string | null = null,
  ) {
    super(`${stage}:${providerStatus ?? "TRANSPORT_FAILURE"}`);
    this.name = "ProductBridgeProviderError";
  }
}

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
    relativeEventLabel: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Required nullable field. It MUST be null whenever reference.status is UNKNOWN. Use a non-null label only for an event that is explicitly source-grounded or reconstructible from the supplied conversation context and resolved through referenceProjectRef; never invent a conventional zero, baseline or study event.",
    },
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
      description: "Use KNOWN only when the event is source-grounded and bound to an exact Project or same-output candidate reference. Otherwise use UNKNOWN while preserving the explicit timepoint or window.",
      anyOf: [{
        type: "object",
        additionalProperties: false,
        properties: {
          status: { type: "string", enum: ["KNOWN"] },
          referenceProjectRef: {
            type: "string",
            description: "Exact stable Project object ID or same-output candidateRef for the source-grounded event that defines the temporal reference.",
          },
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
  const sourceCatalog = buildPersistentSourceCatalog(request.conversation);
  const proposalContext = request.conversation.turns
    .filter((turn) => turn.role === "NOXIA")
    .slice(-4)
    .map((turn) => ({ turnId: turn.turnId, content: turn.content }));
  return {
    systemInstruction: { parts: [{ text: PERSISTENT_DELTA_SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: [
      `DERNIER MESSAGE UTILISATEUR (source de l'assertion ou de l'adoption) :\n${userTurn?.content ?? ""}`,
      `CATALOGUE D'ANCRAGES DU DERNIER MESSAGE UTILISATEUR (sélectionne uniquement un anchorId exact ; FULL_TURN est toujours valide) :\n${JSON.stringify(sourceCatalog, null, 2)}`,
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
                sourceAnchorId: {
                  type: "string",
                  description: "Select one exact anchorId from the supplied current-user source catalog that semantically supports this ADD or authorizes this REPLACE/REMOVE. Use the FULL_TURN anchor when no narrower catalog fragment is sufficient. Never invent an ID and never use Project or assistant context as current-user evidence.",
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
                  description: "Choose the scientific identity explicitly referenced, not a plausible downstream Project consequence. IMAGING_MODALITY is a named imaging modality/method family; it is never a CANONICAL_VARIABLE and is not automatically an ACQUISITION. ACQUISITION is a planned performance/collection event only when execution is established by the source; preserve the separate modality identity when both are established. CANONICAL_VARIABLE is a defined data quantity/category/output, never the modality producing it. DATA_NEED is information the Project needs. ANALYSIS_SPECIFICATION is an autonomous analytical specification with a purpose/question, inputs and a sufficiently established procedure; a mere mention of processing, segmentation, quantification or a method still to be defined is not enough. When explicit methodological context is too incomplete for a MeasurementDefinition or ANALYSIS_SPECIFICATION, use PROJECT_INFORMATION with epistemicState UNKNOWN to preserve the stated context, its link to the concerned quantity in content and the unresolved method without inventing details. MeasurementDefinition is not a type in this Project contract and must not be invented. Keep OBJECTIVE distinct from ENDPOINT/CANONICAL_VARIABLE and INTERVENTION distinct from COMPARATOR.",
                },
                content: { type: "string", description: "Concise semantic content for this object. This may be a canonical label, but it never replaces the selected source-anchor provenance." },
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
              required: ["operation", "sourceAnchorId", "candidateRef", "proposedType", "content", "polarity", "epistemicStatus", "epistemicState", "assertionKind", "evidenceRefs"],
            },
          },
          relations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                relationRef: { type: "string" },
                sourceAnchorId: { type: "string", description: "Select one exact anchorId from the supplied current-user source catalog that semantically supports this relation. FULL_TURN is valid; never invent an ID." },
                relationType: {
                  type: "string",
                  enum: PERSISTENT_PROJECT_RELATION_TYPES,
                  description: "First identify both endpoint object types, then emit only one supported directed signature: COMPARES_WITH/COMPARED_WITH = INTERVENTION_OR_EXPOSURE or GROUP to the same comparison family, or IMAGING_MODALITY/ACQUISITION/ANALYSIS_SPECIFICATION/CANONICAL_VARIABLE to that same measurement-comparison family; MOTIVATES_DATA_NEED = SCIENTIFIC_QUESTION/OBJECTIVE/HYPOTHESIS -> DATA_NEED; COVERS_DATA_NEED = CANONICAL_VARIABLE -> DATA_NEED; OPERATIONALIZES = CANONICAL_VARIABLE/ACQUISITION/ANALYSIS_SPECIFICATION -> DATA_NEED. ANALYSIS_SPECIFICATION -> CANONICAL_VARIABLE is invalid. CONSUMED_BY_ANALYSIS is not supported by this product contract: never replace it with OPERATIONALIZES. Co-occurrence alone establishes no relation. Omit an optional relation when no supported signature faithfully applies; keep the explicit objects.",
                },
                sourceObjectRef: { type: "string", description: "Directed source endpoint. Use an exact Project stableId or candidateRef declared in this output whose scientific object type matches the selected relation source signature. Never use a label, content, section ID or invented ID." },
                targetObjectRef: { type: "string", description: "Directed target endpoint. Use an exact Project stableId or candidateRef declared in this output whose scientific object type matches the selected relation target signature. Omit the optional relation when no compatible target exists; never reverse a signature or invent an ID." },
                polarity: { type: "string", enum: ["AFFIRMED", "NEGATED", "UNKNOWN"] },
                epistemicStatus: { type: "string", enum: ["EXPLICIT_USER_STATED", "CONFIRMED_BY_USER", "SUPPORTED_CANDIDATE", "UNKNOWN", "AMBIGUOUS"] },
                epistemicState: { type: "string", enum: ["KNOWN", "ASSUMED", "UNKNOWN", "WITHHELD"] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["relationRef", "sourceAnchorId", "relationType", "sourceObjectRef", "targetObjectRef", "polarity", "epistemicStatus", "epistemicState", "assertionKind", "evidenceRefs"],
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
                sourceAnchorId: { type: "string", description: "Select one exact anchorId from the supplied current-user source catalog that semantically supports this temporal fact. FULL_TURN is valid; never invent an ID." },
                subjectProjectRef: { type: "string", description: "Exact stable ID of an existing Project object or candidateRef declared in changes of this same output and carrying the temporal role." },
                temporalRole: { type: "string", enum: ["ACQUISITION_TIME", "COLLECTION_TIME", "PROCESSING_TIME", "TRANSFORMATION_TIME", "ANALYSIS_TIME"] },
                anchor: { anyOf: [temporalAnchorJsonSchema, { type: "null" }] },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "qualificationId", "sourceAnchorId", "subjectProjectRef", "temporalRole", "anchor", "assertionKind", "evidenceRefs"],
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
                sourceAnchorId: { type: "string", description: "Select one exact anchorId from the supplied current-user source catalog that semantically supports this expected occasion. FULL_TURN is valid; never invent an ID." },
                variableProjectRef: { type: "string", description: "Exact stable ID of an existing CANONICAL_VARIABLE or candidateRef for a CANONICAL_VARIABLE declared in changes of this same output." },
                anchor: { anyOf: [temporalAnchorJsonSchema, { type: "null" }] },
                studyUnitOrGroupRef: { type: "string", description: "Optional stable Project or candidate-local group reference." },
                applicableContext: { type: "string", description: "Optional bounded applicability context." },
                assertionKind: { type: "string", enum: ["USER_STATED", "USER_ADOPTED_PROPOSAL", "OWNER_SUPPORTED"] },
                proposalSourceText: { type: "string", description: "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL." },
                evidenceRefs: { type: "array", items: { type: "string" } },
              },
              required: ["operation", "occasionId", "sourceAnchorId", "variableProjectRef", "anchor", "assertionKind", "evidenceRefs"],
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
  model: string = PRODUCT_BRIDGE_MODEL,
): Promise<ProductBridgeProviderResult<GeminiBody>> => {
  const started = Date.now();
  let response: Response;
  try {
    response = await productHybridProviderGate.run(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45_000);
      try {
        return await fetchImpl(geminiEndpoint(model), {
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
  model: string = PRODUCT_BRIDGE_MODEL,
): Promise<ProductBridgeProviderResult<string>> => {
  const result = await callGemini(apiKey, "CONVERSATION", buildNaturalConversationPayload(request), fetchImpl, resolveGeminiConversationModel(model));
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
  model: string = PRODUCT_BRIDGE_MODEL,
): Promise<ProductBridgeProviderResult<{
  structuredArgs: unknown;
  providerArtifact: PersistentExtractionProviderArtifact;
}>> => {
  const resolvedModel = resolveGeminiConversationModel(model);
  const result = await callGemini(apiKey, "PERSISTENT_DELTA", buildPersistentDeltaPayload(request), fetchImpl, resolvedModel);
  const call = result.value.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.functionCall)
    .find((candidate) => candidate?.name === FUNCTION_NAME);
  if (!call?.args || typeof call.args !== "object" || Array.isArray(call.args)) {
    throw new ProductBridgeProviderError("PERSISTENT_DELTA", 200, "FUNCTION_CALL_MISSING", "Gemini returned no persistent-delta function arguments.", result.responseId);
  }
  const structuredArgsSerialized = JSON.stringify(call.args);
  const structuredArgsDigest = logicalDigest(structuredArgsSerialized);
  const requestTurnRef = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER")?.turnId ?? "UNKNOWN_USER_TURN";
  const sourceCatalog = buildPersistentSourceCatalog(request.conversation);
  return {
    ...result,
    value: {
      structuredArgs: call.args as PersistentProjectDeltaCandidate,
      providerArtifact: {
        artifactRef: `gemini-structured-args:${structuredArgsDigest}`,
        requestTurnRef,
        provider: "GOOGLE_GEMINI",
        model: resolvedModel,
        functionName: FUNCTION_NAME,
        receivedAt: new Date().toISOString(),
        providerResponseId: result.responseId,
        sourceCatalog,
        sourceCatalogDigest: sourceCatalog.catalogDigest,
        structuredArgsExact: call.args,
        structuredArgsSerialized,
        structuredArgsDigest,
      },
    },
  };
};
