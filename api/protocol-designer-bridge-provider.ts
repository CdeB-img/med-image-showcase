import { RollingSingleConcurrencyGate } from "./scientific-interpretation-provider.js";
import { parseGovernedRealizationProviderOutput } from "../src/features/query-navigation/governed-conversation-realization.js";
import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import { scientificDiscussionProviderContext } from "../src/features/protocol-designer/functional-reset/contribution-discussion-context.js";
import {
  NATURAL_METHODOLOGIST_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_RELATION_ENDPOINT_CONTRACT,
  PERSISTENT_PROJECT_RELATION_PROVIDER_DESCRIPTION,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PRODUCT_BRIDGE_MODEL,
  buildNaturalConversationPayload,
  buildPersistentExtractionLanguageContract,
  buildPersistentSourceCatalog,
  buildPersistentProviderJsonSchema,
  type PersistentProviderJsonSchema,
  naturalConversationContext,
  relevantProjectContext,
  resolveGeminiConversationModel,
  type PersistentExtractionProviderArtifact,
  type PersistentProjectDeltaCandidate,
  type ProductBridgeRequest,
} from "../src/features/protocol-designer/product-bridge.js";
import {
  buildLanguageProjectionProviderPayload,
  parseLanguageProjectionProviderResult,
  type LanguageProjectionProviderResult,
  type LanguageProjectionRequest,
} from "../src/features/protocol-designer/conversation-language-gateway.js";
import {
  emptyProviderTokenUsage,
  materializeProviderCallRecord,
  providerCallRequestMetadata,
  type ProviderCallAttemptInstrumentation,
  type ProviderObservedRequestInit,
  type ProviderTokenUsage,
} from "../src/features/protocol-designer/provider-call-observability.js";

export { buildNaturalConversationPayload, naturalConversationContext };

const FUNCTION_NAME = "propose_persistent_project_delta";
const geminiEndpoint = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

// Conversation realization is already one-shot and fail-closed. It shares the
// existing single-concurrency primitive, but not the Scientific Interpretation
// rolling-start budget: coupling both traffic classes caused valid long
// conversations to sleep for almost a minute after ten aggregate starts.
export const productBridgeConversationProviderGate = new RollingSingleConcurrencyGate(Number.POSITIVE_INFINITY);

type GeminiUsage = {
  promptTokenCount?: number;
  cachedContentTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

const geminiProviderTokenUsage = (usage?: GeminiUsage | null): ProviderTokenUsage => usage ? ({
  inputTokens: usage.promptTokenCount ?? null,
  cachedInputTokens: usage.cachedContentTokenCount ?? null,
  cacheWriteTokens: null,
  outputTokens: usage.candidatesTokenCount ?? null,
  reasoningTokens: null,
  totalTokens: usage.totalTokenCount ?? null,
}) : emptyProviderTokenUsage();

type GeminiBody = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown; thought?: boolean; functionCall?: { name?: unknown; args?: unknown } }> } }>;
  usageMetadata?: GeminiUsage;
  modelVersion?: string;
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
    readonly stage: "CONVERSATION" | "PERSISTENT_DELTA" | "LANGUAGE_PROJECTION" | "DOCUMENT_PROJECTION",
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

// Human-readable guidance only. Structural constraints are derived from the
// exact anchored parser; this map does not own enums, required fields or bounds.
const persistentProviderDescriptions: Readonly<Record<string, string>> = {
  ".changes": "All atomic persistent object changes explicitly supported by the complete user turn. Do not collapse population criteria, study arms, objectives, modalities, acquisitions or data needs that have distinct identities.",
  ".changes[].operation": "ADD creates a genuinely new scientific identity. REPLACE or REMOVE modifies one existing canonical Project object identified by targetProjectRef.",
  ".changes[].sourceAnchorId": "Select one exact anchorId from the supplied current-user source catalog that semantically supports this ADD or authorizes this REPLACE/REMOVE. Use the FULL_TURN anchor when no narrower catalog fragment is sufficient. Never invent an ID and never use Project or assistant context as current-user evidence.",
  ".changes[].targetProjectRef": "Optional. Exact stableId from the Project Context Snapshot objects inventory for the existing object being REPLACED or REMOVED. Omit for ADD. Never emit a textual null sentinel, label, section ID or invented ID, and never use it only to provide context for a new object.",
  ".changes[].candidateRef": "New local reference for this proposed change; for ADD it must not reuse an existing Project stable ID.",
  ".changes[].semanticIdentity": "Optional scientific identity. Preserve an existing identity for REPLACE; use a new identity for ADD. Omit when not established.",
  ".changes[].proposedType": "Choose the scientific identity explicitly referenced, not a plausible downstream Project consequence. IMAGING_MODALITY is a named imaging modality/method family; it is never a CANONICAL_VARIABLE and is not automatically an ACQUISITION. ACQUISITION is a planned performance/collection event only when execution is established by the source; preserve the separate modality identity when both are established. CANONICAL_VARIABLE is a defined data quantity/category/output, never the modality producing it. DATA_NEED is information the Project needs. ANALYSIS_SPECIFICATION is an autonomous analytical specification with a purpose/question, inputs and a sufficiently established procedure; a mere mention of processing, segmentation, quantification or a method still to be defined is not enough. When explicit methodological context is too incomplete for a MeasurementDefinition or ANALYSIS_SPECIFICATION, use PROJECT_INFORMATION with epistemicState UNKNOWN to preserve the stated context, its link to the concerned quantity in content and the unresolved method without inventing details. MeasurementDefinition is not a type in this Project contract and must not be invented. Keep OBJECTIVE distinct from ENDPOINT/CANONICAL_VARIABLE and INTERVENTION distinct from COMPARATOR.",
  ".changes[].content": "Concise semantic content for this object. This may be a canonical label, but it never replaces the selected source-anchor provenance.",
  ".changes[].studyRole": "Optional source-grounded role, independent from proposedType. Omit when no role is established. Null is allowed only on REPLACE to clear an existing role. Never emit a textual null sentinel and never infer priority from mere mention.",
  ".changes[].epistemicState": "PD-003 epistemic state, independent from linguistic provenance. Use UNKNOWN when explicit content has an unresolved scope or qualifier.",
  ".changes[].proposalSourceText": "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL.",
  ".relations[].sourceAnchorId": "Select one exact anchorId from the supplied current-user source catalog that semantically supports this relation. FULL_TURN is valid; never invent an ID.",
  ".relations[].relationType": PERSISTENT_PROJECT_RELATION_PROVIDER_DESCRIPTION,
  ".relations[].sourceObjectRef": "Directed source endpoint. Use an exact Project stableId or candidateRef declared in this output whose scientific object type matches the selected relation source signature. Never use a label, content, section ID or invented ID.",
  ".relations[].targetObjectRef": "Directed target endpoint. Use an exact Project stableId or candidateRef declared in this output whose scientific object type matches the selected relation target signature. Omit the optional relation when no compatible target exists; never reverse a signature or invent an ID.",
  ".relations[].proposalSourceText": "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL.",
  ".temporalQualifications": "All explicit typed temporal value changes carried by an existing object or by a candidateRef declared in changes of this same output. Never create a TEMPORAL_ANCHOR root object and never drop an explicit time because its reference event is unknown.",
  ".temporalQualifications[].qualificationId": "Optional for ADD: the local materialization owner assigns a deterministic identity when omitted. Required exact existing qualification identity for REPLACE or REMOVE; preserve it.",
  ".temporalQualifications[].sourceAnchorId": "Select one exact anchorId from the supplied current-user source catalog that semantically supports this temporal fact. FULL_TURN is valid; never invent an ID.",
  ".temporalQualifications[].subjectProjectRef": "Exact stable ID of an existing Project object or candidateRef declared in changes of this same output and carrying the temporal role.",
  ".temporalQualifications[].anchor.relativeEventLabel": "Required nullable field. It MUST be null whenever reference.status is UNKNOWN. Use a non-null label for an event explicitly source-grounded or reconstructible from supplied conversation context; use EXPLICIT when its Project reference is not bound and KNOWN when referenceProjectRef binds it. Never invent a conventional zero, baseline or study event.",
  ".temporalQualifications[].anchor.reference": "Use KNOWN when a source-grounded event is bound to an exact Project or same-output candidate reference. Use EXPLICIT when the source unambiguously supplies the event but no Project/candidate reference represents it. Use UNKNOWN only when the event is absent or ambiguous.",
  ".temporalQualifications[].anchor.reference.referenceProjectRef": "Exact stable Project object ID or same-output candidateRef for the source-grounded event that defines the temporal reference.",
  ".temporalQualifications[].proposalSourceText": "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL.",
  ".expectedVariableOccasions": "Expected occasions for one existing CANONICAL_VARIABLE; these are not observed values and do not duplicate the variable. A quantitative endpoint and its measured variable remain distinct objects: PRIMARY_ENDPOINT stays on ENDPOINT, while variableProjectRef must identify the CANONICAL_VARIABLE carrying the measured quantity.",
  ".expectedVariableOccasions[].occasionId": "Stable expected-occasion identity. Preserve it for REPLACE or REMOVE.",
  ".expectedVariableOccasions[].sourceAnchorId": "Select one exact anchorId from the supplied current-user source catalog that semantically supports this expected occasion. FULL_TURN is valid; never invent an ID.",
  ".expectedVariableOccasions[].variableProjectRef": "Exact stable ID of an existing CANONICAL_VARIABLE or candidateRef for a CANONICAL_VARIABLE declared in changes of this same output. Never reference an ENDPOINT, including the paired PRIMARY_ENDPOINT.",
  ".expectedVariableOccasions[].anchor.relativeEventLabel": "Required nullable field. It MUST be null whenever reference.status is UNKNOWN. Use a non-null label for an event explicitly source-grounded or reconstructible from supplied conversation context; use EXPLICIT when its Project reference is not bound and KNOWN when referenceProjectRef binds it. Never invent a conventional zero, baseline or study event.",
  ".expectedVariableOccasions[].anchor.reference": "Use KNOWN when a source-grounded event is bound to an exact Project or same-output candidate reference. Use EXPLICIT when the source unambiguously supplies the event but no Project/candidate reference represents it. Use UNKNOWN only when the event is absent or ambiguous.",
  ".expectedVariableOccasions[].anchor.reference.referenceProjectRef": "Exact stable Project object ID or same-output candidateRef for the source-grounded event that defines the temporal reference.",
  ".expectedVariableOccasions[].studyUnitOrGroupRef": "Optional stable Project or candidate-local group reference.",
  ".expectedVariableOccasions[].applicableContext": "Optional bounded applicability context.",
  ".expectedVariableOccasions[].proposalSourceText": "Optional exact assistant proposal text; emit only for USER_ADOPTED_PROPOSAL.",
  ".temporalQualifications[].anchor.unit": "Required nullable field. Use null for an unquantified RELATIVE_EVENT (for example BEFORE reperfusion) with null offset/bounds/tolerance. Never invent a unit or offset. Quantified times and windows require a non-empty unit; never emit an empty string.",
  ".expectedVariableOccasions[].anchor.unit": "Required nullable field. Use null for an unquantified RELATIVE_EVENT (for example BEFORE reperfusion) with null offset/bounds/tolerance. Never invent a unit or offset. Quantified times and windows require a non-empty unit; never emit an empty string."
};

const describePersistentProviderSchema = (schema: PersistentProviderJsonSchema, path = ""): PersistentProviderJsonSchema => ({
  ...schema,
  ...(persistentProviderDescriptions[path] ? { description: persistentProviderDescriptions[path] } : {}),
  ...(schema.properties ? { properties: Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, describePersistentProviderSchema(value, `${path}.${key}`)])) } : {}),
  ...(schema.items ? { items: describePersistentProviderSchema(schema.items, `${path}[]`) } : {}),
  ...(schema.anyOf ? { anyOf: schema.anyOf.map((branch) => describePersistentProviderSchema(branch, path)) } : {}),
});

export const buildPersistentDeltaPayload = (request: ProductBridgeRequest) => {
  const userTurn = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER");
  const workingProjection = userTurn
    ? request.languageBoundary?.turnProjections.find((projection) => projection.turnId === userTurn.turnId)
    : null;
  const sourceCatalog = buildPersistentSourceCatalog(request.conversation);
  const languageContract = buildPersistentExtractionLanguageContract(request.conversation.language);
  const proposalContext = request.scientificDiscussionContext && !request.nativeConversationRecording ? [] : request.conversation.turns
    .filter((turn) => turn.role === "NOXIA")
    .slice(request.nativeConversationRecording ? 0 : -4)
    .map((turn) => ({ turnId: turn.turnId, content: turn.content }));
  return {
    systemInstruction: { parts: [{ text: `${PERSISTENT_DELTA_SYSTEM_INSTRUCTION}\n\n${languageContract}${request.nativeConversationRecording ? `

OPÉRATION DE PRÉPARATION D'UNE REVUE HUMAINE GROUPÉE : le dernier message peut désigner explicitement les choix des propositions précédentes, tels que corrigés par les messages utilisateur. Cette désignation référentielle n'est pas une simple demande de reformulation ni un oui ambigu : prépare les conséquences de ces choix pour la revue, sans les appliquer. Résous le périmètre à partir du récapitulatif NOXIA le plus récent et des corrections/refus utilisateur. Ne requiers pas que l'utilisateur recopie chaque choix. Pour chaque élément retenu, utilise assertionKind=USER_ADOPTED_PROPOSAL, proposalSourceText=citation exacte de la proposition NOXIA antérieure et sourceAnchorId=ancrage exact de l'assentiment courant. Les préférences non retenues, anciennes propositions remplacées et détails restant ouverts ne deviennent pas des faits adoptés. L'autorisation de préparation ne vaut jamais décision PRJ : toute sortie reste candidate jusqu'à la revue native. Une désignation absente ou ambiguë reste sans conséquence persistante.` : ""}` }] },
    contents: [{ role: "user", parts: [{ text: [
      `DERNIER MESSAGE UTILISATEUR (source de l'assertion ou de l'adoption) :\n${userTurn?.content ?? ""}`,
      workingProjection
        ? `PROJECTION DE TRAVAIL FRANÇAISE (aide linguistique dérivée ; ce texte n'est pas une citation littérale de l'utilisateur et ne remplace jamais les ancrages du message original) :\n${workingProjection.frenchWorkingText}`
        : "AUCUNE PROJECTION LINGUISTIQUE DÉRIVÉE : le message original est déjà le texte de travail.",
      `CATALOGUE D'ANCRAGES DU DERNIER MESSAGE UTILISATEUR (sélectionne uniquement un anchorId exact ; FULL_TURN est toujours valide) :\n${JSON.stringify(sourceCatalog, null, 2)}`,
      `CONTRAT MACHINE DES SIGNATURES RELATIONNELLES DU PROJECT (résous les types des deux références, puis respecte exactement une signature ; sinon omets la relation) :\n${JSON.stringify(PERSISTENT_PROJECT_RELATION_ENDPOINT_CONTRACT, null, 2)}`,
      ...(request.nativeConversationRecording ? [
        `DISCUSSION ORIGINALE DÉSIGNÉE POUR PRÉPARATION (lecture seule ; corrections/refus récents prévalent ; les sources utilisateur courantes restent exclusivement les ancrages du dernier message ; toute proposition NOXIA retenue doit garder assertionKind USER_ADOPTED_PROPOSAL, proposalSourceText exact et assentiment distinct) :\n${JSON.stringify(request.conversation.turns.filter(turn => turn.role === "USER" && turn.turnId !== userTurn?.turnId).map(turn => ({ turnId: turn.turnId, role: turn.role, content: turn.content })))}`,
      ] : []),
      `PROPOSITIONS NOXIA RÉCENTES (lecture seule ; utilisables uniquement si le dernier message les adopte explicitement) :\n${JSON.stringify(proposalContext, null, 2)}`,
      ...(request.scientificDiscussionContext ? [
        `CONTEXTE SCIENTIFIQUE DISCUTÉ — NON ADOPTÉ (projection bornée du lifecycle des contributions ; référents historiques distincts des sources utilisateur courantes) :\n${JSON.stringify(scientificDiscussionProviderContext(request.scientificDiscussionContext))}`,
      ] : []),
      `RESEARCH PROJECT ADOPTÉ (lecture seule) :\n${JSON.stringify(relevantProjectContext(request.currentProject), null, 2)}`,
    ].join("\n\n") }] }],
    tools: [{ functionDeclarations: [{
      name: FUNCTION_NAME,
      description: "Propose every persistent scientific object, relation and temporal qualification grounded in the complete explicit user statement or explicit adoption; preserve multiple independent consequences from one turn and return empty lists only when there is no persistent consequence.",
      parametersJsonSchema: describePersistentProviderSchema(buildPersistentProviderJsonSchema()),
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
  instrumentation?: ProviderCallAttemptInstrumentation,
): Promise<ProductBridgeProviderResult<GeminiBody>> => {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const observe = (record: Parameters<typeof materializeProviderCallRecord>[0]) => {
    if (!instrumentation) return;
    instrumentation.onRecord(materializeProviderCallRecord(record));
  };
  let response: Response | undefined;
  let text: string;
  try {
    text = await productBridgeConversationProviderGate.run(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45_000);
      try {
        const requestInit: ProviderObservedRequestInit = {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(payload),
          signal: controller.signal,
          noxiaProviderObservation: providerCallRequestMetadata(instrumentation),
        };
        response = await fetchImpl(geminiEndpoint(model), requestInit);
        return await response.text();
      } finally {
        clearTimeout(timer);
      }
    });
  } catch (error) {
    const latencyMs = Date.now() - started;
    const failureReason = error instanceof Error && error.name === "AbortError" ? "TIMEOUT"
      : response ? "RESPONSE_BODY_READ_FAILURE" : "NETWORK_FAILURE";
    const requestId = response?.headers.get("x-request-id") ?? null;
    observe({
      provider: "GOOGLE_GEMINI", modelRequested: model, modelReturned: null,
      instrumentation: instrumentation!, usage: emptyProviderTokenUsage(), latencyMs,
      status: "FAILED", failureReason,
      providerRequestId: requestId, providerResponseId: null, startedAt, completedAt: new Date().toISOString(),
    });
    throw new ProductBridgeProviderError(stage, response?.status ?? null, failureReason, "Provider request failed.", null, "GOOGLE_GEMINI", requestId);
  }
  // The gate resolves only after a response and its complete body were read.
  const completedResponse = response!;
  let body: GeminiBody;
  try {
    body = JSON.parse(text) as GeminiBody;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_PROVIDER_JSON");
  } catch {
    const latencyMs = Date.now() - started;
    observe({
      provider: "GOOGLE_GEMINI", modelRequested: model, modelReturned: null,
      instrumentation: instrumentation!, usage: emptyProviderTokenUsage(), latencyMs,
      status: "FAILED", failureReason: "INVALID_PROVIDER_JSON", providerRequestId: null,
      providerResponseId: null, startedAt, completedAt: new Date().toISOString(),
    });
    throw new ProductBridgeProviderError(stage, completedResponse.status, "INVALID_PROVIDER_JSON", "Provider returned invalid JSON.");
  }
  if (!completedResponse.ok) {
    const latencyMs = Date.now() - started;
    const failureReason = body.error?.status ?? `HTTP_${completedResponse.status}`;
    observe({
      provider: "GOOGLE_GEMINI", modelRequested: model, modelReturned: body.modelVersion ?? null,
      instrumentation: instrumentation!, usage: geminiProviderTokenUsage(body.usageMetadata), latencyMs,
      status: "FAILED", failureReason, providerRequestId: null, providerResponseId: body.responseId ?? null,
      startedAt, completedAt: new Date().toISOString(),
    });
    throw new ProductBridgeProviderError(
      stage,
      completedResponse.status,
      failureReason,
      body.error?.message ?? "Gemini request failed.",
      body.responseId ?? null,
    );
  }
  const latencyMs = Date.now() - started;
  observe({
    provider: "GOOGLE_GEMINI", modelRequested: model, modelReturned: body.modelVersion ?? null,
    instrumentation: instrumentation!, usage: geminiProviderTokenUsage(body.usageMetadata), latencyMs,
    status: "SUCCEEDED", failureReason: null, providerRequestId: null, providerResponseId: body.responseId ?? null,
    startedAt, completedAt: new Date().toISOString(),
  });
  return {
    value: body,
    latencyMs,
    httpStatus: completedResponse.status,
    responseId: body.responseId ?? null,
    usage: body.usageMetadata ?? null,
  };
};

export const executeNaturalConversation = async (
  request: ProductBridgeRequest,
  apiKey: string,
  fetchImpl?: typeof fetch,
  model: string = PRODUCT_BRIDGE_MODEL,
  instrumentation?: ProviderCallAttemptInstrumentation,
): Promise<ProductBridgeProviderResult<string> & { governedClaim?: import("../src/features/query-navigation/governed-conversation-realization.js").GovernedRealizationProviderClaim | null }> => {
  const result = await callGemini(
    apiKey, "CONVERSATION", buildNaturalConversationPayload(request), fetchImpl,
    resolveGeminiConversationModel(model), instrumentation,
  );
  const reply = request.scientificCollaboratorRequest
    ? result.value.candidates?.map(candidate => (candidate.content?.parts ?? [])
      .filter(part => part.thought !== true && typeof part.text === "string")
      .map(part => part.text as string).join("").trim()).find(text => text.length > 0)
    : result.value.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
  if (!reply) throw new ProductBridgeProviderError("CONVERSATION", 200, "TEXT_RESPONSE_MISSING", "Gemini returned no visible conversational text.", result.responseId);
  if (request.governedRealization && !request.contextualReasoningRequest && !request.scientificCollaboratorRequest) {
    const parsed = parseGovernedRealizationProviderOutput(reply);
    return { ...result, value: parsed?.assistantReply ?? reply, governedClaim: parsed?.claim ?? null };
  }
  return { ...result, value: reply };
};

export const executeLanguageProjection = async (
  request: LanguageProjectionRequest,
  apiKey: string,
  fetchImpl?: typeof fetch,
  model: string = PRODUCT_BRIDGE_MODEL,
  instrumentation?: ProviderCallAttemptInstrumentation,
): Promise<ProductBridgeProviderResult<LanguageProjectionProviderResult>> => {
  const resolvedModel = resolveGeminiConversationModel(model);
  const result = await callGemini(
    apiKey,
    "LANGUAGE_PROJECTION",
    buildLanguageProjectionProviderPayload(request),
    fetchImpl,
    resolvedModel,
    instrumentation,
  );
  const args = result.value.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.functionCall)
    .find((candidate) => candidate?.name === "return_language_projection")?.args;
  const projection = parseLanguageProjectionProviderResult(args);
  if (!projection) {
    throw new ProductBridgeProviderError(
      "LANGUAGE_PROJECTION",
      200,
      "LANGUAGE_PROJECTION_MISSING",
      "Gemini returned no valid language projection.",
      result.responseId,
    );
  }
  return { ...result, value: projection };
};

export const executePersistentDelta = async (
  request: ProductBridgeRequest,
  apiKey: string,
  fetchImpl?: typeof fetch,
  model: string = PRODUCT_BRIDGE_MODEL,
  instrumentation?: ProviderCallAttemptInstrumentation,
): Promise<ProductBridgeProviderResult<{
  structuredArgs: unknown;
  providerArtifact: PersistentExtractionProviderArtifact;
}>> => {
  const resolvedModel = resolveGeminiConversationModel(model);
  const result = await callGemini(
    apiKey, "PERSISTENT_DELTA", buildPersistentDeltaPayload(request), fetchImpl, resolvedModel, instrumentation,
  );
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
