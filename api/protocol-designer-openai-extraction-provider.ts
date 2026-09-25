import { prepareSynopsisRevision, materializeSynopsisRevision } from "../src/features/document-projection/synopsis-revision.js";
import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import { prepareDrciGenerationBatches, validateRetainedDrciProtocol, validateRetainedDrciScope, type RetainedDrciProtocol, type DrciProjectBinding } from "../src/features/document-projection/drci-draft-contract.js";
import {
  DEFAULT_OPENAI_EXTRACTION_MODEL,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  buildPersistentSourceCatalog,
  resolveOpenAIExtractionModel,
  type PersistentExtractionProviderArtifact,
  type ProductBridgeRequest,
} from "../src/features/protocol-designer/product-bridge.js";
import {
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
  DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
  LANGUAGE_PROJECTION_SCHEMA_IDENTITY,
  buildLanguageProjectionProviderPayload,
  languageGatewayContextBoundary,
  parseLanguageProjectionProviderResult,
  resolveOpenAILanguageGatewayModel,
  resolveOpenAILanguageGatewayReasoningEffort,
  type LanguageProjectionProviderResult,
  type LanguageProjectionReasoningEffort,
  type LanguageProjectionRequest,
  type LanguageProjectionUsage,
} from "../src/features/protocol-designer/conversation-language-gateway.js";
import { buildPersistentDeltaPayload, ProductBridgeProviderError } from "./protocol-designer-bridge-provider.js";
import { COMPACT_TRANSACTION_INSTRUCTION, compactTransactionSchema, expandCompactTransaction, prepareCompactTransaction } from "../src/features/protocol-designer/transaction-compaction.js";
import {
  emptyProviderTokenUsage,
  materializeProviderCallRecord,
  providerCallRequestMetadata,
  readDurableProviderFailureDiagnostic,
  type ProviderCallAttemptInstrumentation,
  type ProviderObservedRequestInit,
  type ProviderTokenUsage,
} from "../src/features/protocol-designer/provider-call-observability.js";
import {
  OPENAI_RESPONSES_ENDPOINT,
  mapOpenAIModelForDestination,
  openAIProviderHeaders,
  type OpenAIProviderTransport,
} from "../server/protocol-designer-openai-provider-config.js";

export { OPENAI_RESPONSES_ENDPOINT } from "../server/protocol-designer-openai-provider-config.js";
const FUNCTION_NAME = "propose_persistent_project_delta" as const;
const MAX_OUTPUT_TOKENS = 8_000;
const TIMEOUT_MS = 120_000;
export const DOC_PROVIDER_TIMEOUT_MS = 300_000;

export const OPENAI_STRICT_SCHEMA_HARDENING_DEBT = "OPEN" as const;

export type OpenAIUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number };
  output_tokens_details?: { reasoning_tokens?: number };
};

const openAIProviderTokenUsage = (usage?: OpenAIUsage | null): ProviderTokenUsage => usage ? ({
  inputTokens: usage.input_tokens ?? null,
  cachedInputTokens: usage.input_tokens_details?.cached_tokens ?? null,
  cacheWriteTokens: usage.input_tokens_details?.cache_write_tokens ?? null,
  outputTokens: usage.output_tokens ?? null,
  reasoningTokens: usage.output_tokens_details?.reasoning_tokens ?? null,
  totalTokens: usage.total_tokens ?? null,
}) : emptyProviderTokenUsage();

type OpenAIResponseBody = {
  id?: string;
  model?: string;
  status?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: OpenAIUsage;
  incomplete_details?: unknown;
  error?: { code?: string; message?: string; type?: string };
};

export type OpenAIPersistentDeltaResult = {
  value: {
    structuredArgs: unknown;
    providerArtifact: PersistentExtractionProviderArtifact;
  };
  latencyMs: number;
  httpStatus: number;
  responseId: string | null;
  requestId: string | null;
  modelRequested: string;
  modelReturned: string | null;
  usage: OpenAIUsage | null;
};

const responseOutputText = (body: OpenAIResponseBody) => {
  if (typeof body.output_text === "string" && body.output_text.trim()) return body.output_text;
  return (body.output ?? []).flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text!)
    .join("");
};

type OpenAIResponsesResult = Readonly<{
  body: OpenAIResponseBody;
  httpStatus: number;
  latencyMs: number;
  requestId: string | null;
  endpoint: string;
  modelRequested: string;
}>;

const callOpenAIResponses = async (input: {
  stage: "PERSISTENT_DELTA" | "LANGUAGE_PROJECTION" | "CONVERSATION" | "DOCUMENT_PROJECTION";
  apiKey: string;
  payload: unknown;
  fetchImpl: typeof fetch;
  modelRequested: string;
  instrumentation?: ProviderCallAttemptInstrumentation;
  transport?: OpenAIProviderTransport;
  timeoutMs?: number;
}): Promise<OpenAIResponsesResult> => {
  const transport = input.transport;
  const endpoint = transport?.responsesEndpoint ?? OPENAI_RESPONSES_ENDPOINT;
  const modelRequested = mapOpenAIModelForDestination(input.modelRequested, transport?.destination ?? "openai");
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
    ? { ...(input.payload as Record<string, unknown>), model: modelRequested }
    : input.payload;
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const observe = (record: Parameters<typeof materializeProviderCallRecord>[0]) => {
    if (!input.instrumentation) return;
    input.instrumentation.onRecord(materializeProviderCallRecord(record));
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? (input.stage === "DOCUMENT_PROJECTION" ? DOC_PROVIDER_TIMEOUT_MS : TIMEOUT_MS));
  let response: Response | undefined;
  let raw: string;
  try {
    const requestInit: ProviderObservedRequestInit = {
      method: "POST",
      headers: openAIProviderHeaders(input.apiKey, transport),
      body: JSON.stringify(payload),
      signal: controller.signal,
      noxiaProviderObservation: providerCallRequestMetadata(input.instrumentation),
    };
    response = await input.fetchImpl(endpoint, requestInit);
    raw = await response.text();
  } catch (error) {
    const latencyMs = Date.now() - started;
    const durableFailure = readDurableProviderFailureDiagnostic(error);
    // A local admission denial is not a network failure. Retain only known
    // codes, never arbitrary exception text (which could contain credentials).
    const guardCode = error instanceof Error && /^(PUBLIC_SESSION_BUDGET_CLOSED|PUBLIC_CONCURRENT_PROVIDER_CALL_DENIED|PUBLIC_PROVIDER_DENIED_(INVALID_BUDGET_POLICY|UNKNOWN_CUMULATIVE_COST|SOFT_STOP|UNKNOWN_UPPER_BOUND|HARD_BUDGET))$/.test(error.message)
      ? error.message : null;
    const failureReason = error !== null && typeof error === "object" && "name" in error && error.name === "AbortError" ? "TIMEOUT"
      : guardCode ?? (response ? "RESPONSE_BODY_READ_FAILURE" : "NETWORK_FAILURE");
    const requestId = response?.headers.get("x-request-id") ?? null;
    observe({
      provider: "OPENAI", modelRequested, modelReturned: null,
      instrumentation: input.instrumentation!, usage: emptyProviderTokenUsage(), latencyMs,
      status: "FAILED", failureReason,
      durableFailure,
      providerRequestId: requestId, providerResponseId: null, startedAt, completedAt: new Date().toISOString(),
    });
    throw new ProductBridgeProviderError(
      input.stage,
      response?.status ?? null,
      failureReason,
      "Provider request failed.",
      null,
      "OPENAI",
      requestId,
    );
  } finally {
    clearTimeout(timer);
  }
  const requestId = response.headers.get("x-request-id");
  let body: OpenAIResponseBody;
  try {
    body = JSON.parse(raw) as OpenAIResponseBody;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_PROVIDER_JSON");
  } catch {
    const latencyMs = Date.now() - started;
    observe({
      provider: "OPENAI", modelRequested, modelReturned: null,
      instrumentation: input.instrumentation!, usage: emptyProviderTokenUsage(), latencyMs,
      status: "FAILED", failureReason: "INVALID_PROVIDER_JSON", providerRequestId: requestId,
      providerResponseId: null, startedAt, completedAt: new Date().toISOString(),
    });
    throw new ProductBridgeProviderError(
      input.stage, response.status, "INVALID_PROVIDER_JSON", "Provider returned invalid JSON.", null, "OPENAI", requestId,
    );
  }
  if (!response.ok || body.status === "failed" || body.status === "incomplete") {
    const latencyMs = Date.now() - started;
    const incompleteReason = body.incomplete_details && typeof body.incomplete_details === "object" && "reason" in body.incomplete_details
      && ["max_output_tokens", "content_filter"].includes(String(body.incomplete_details.reason)) ? String(body.incomplete_details.reason) : null;
    const failureReason = body.error?.code ?? body.error?.type
      ?? (body.status === "incomplete" && incompleteReason ? `incomplete:${incompleteReason}` : body.status) ?? `HTTP_${response.status}`;
    observe({
      provider: "OPENAI", modelRequested, modelReturned: body.model ?? null,
      instrumentation: input.instrumentation!, usage: openAIProviderTokenUsage(body.usage), latencyMs,
      status: "FAILED", failureReason, providerRequestId: requestId, providerResponseId: body.id ?? null,
      startedAt, completedAt: new Date().toISOString(),
    });
    throw new ProductBridgeProviderError(
      input.stage,
      response.status,
      failureReason,
      body.error?.message ?? "OpenAI request failed.",
      body.id ?? null,
      "OPENAI",
      requestId,
    );
  }
  const latencyMs = Date.now() - started;
  observe({
    provider: "OPENAI", modelRequested, modelReturned: body.model ?? null,
    instrumentation: input.instrumentation!, usage: openAIProviderTokenUsage(body.usage), latencyMs,
    status: "SUCCEEDED", failureReason: null, providerRequestId: requestId, providerResponseId: body.id ?? null,
    startedAt, completedAt: new Date().toISOString(),
  });
  return { body, httpStatus: response.status, latencyMs, requestId, endpoint, modelRequested };
};

type TerraConversationPacket = { instruction: string; context: string; outputSchema?: Record<string, unknown> };
type TerraConversationRequestOptions = Readonly<{ maxOutputTokens?: number; timeoutMs?: number }>;

export const buildOpenAITerraConversationPayload = (packet: TerraConversationPacket, options?: TerraConversationRequestOptions) => ({
  model: "gpt-5.6-terra",
  instructions: packet.instruction,
  input: packet.context,
  reasoning: { effort: "medium" },
  max_output_tokens: options?.maxOutputTokens ?? MAX_OUTPUT_TOKENS,
  store: false,
  service_tier: "default",
  ...(packet.outputSchema ? { text: { format: {
    type: "json_schema", name: "continuous_working_draft", strict: true, schema: packet.outputSchema,
  } } } : {}),
} as const);

export const executeOpenAITerraConversation = async (
  packet: TerraConversationPacket,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  instrumentation?: ProviderCallAttemptInstrumentation,
  transport?: OpenAIProviderTransport,
  options?: TerraConversationRequestOptions,
) => {
  const payload = buildOpenAITerraConversationPayload(packet, options);
  const result = await callOpenAIResponses({ stage: "CONVERSATION", apiKey, payload,
    fetchImpl, modelRequested: payload.model, instrumentation, transport, timeoutMs: options?.timeoutMs });
  const value = responseOutputText(result.body).trim();
  if (!value) throw new ProductBridgeProviderError("CONVERSATION", result.httpStatus,
    "TEXT_RESPONSE_MISSING", "OpenAI returned no conversational text.", result.body.id ?? null, "OPENAI", result.requestId);
  return { value, latencyMs: result.latencyMs, modelRequested: result.modelRequested, modelReturned: result.body.model ?? null,
    usage: result.body.usage ?? null };
};

const usedSynopsisRevisionOriginals = new Set<string>();

/** Document writing uses the same stateless Responses transport and recorder. */
export const executeOpenAIDrciDraft = async (
  packet: { context: string; instruction: string; projectBinding: DrciProjectBinding }, apiKey: string, fetchImpl: typeof fetch = fetch,
  instrumentation?: ProviderCallAttemptInstrumentation,
  retainedProtocol?: RetainedDrciProtocol | null,
  transport?: OpenAIProviderTransport,
) => {
  const batches = prepareDrciGenerationBatches(packet);
  const retained = retainedProtocol ? validateRetainedDrciProtocol(packet, retainedProtocol) : null;
  const remaining = retainedProtocol?.remainingScope ? validateRetainedDrciScope(packet, retainedProtocol.remainingScope, 1) : null;
  if (retainedProtocol?.synopsisRevision) {
    if (!retained || !remaining || !retainedProtocol.readSynopsisRevisionRawRef) throw new Error("DOC_REVISION_RETAINED_SOURCE_REQUIRED");
    const revision = retainedProtocol.synopsisRevision;
    if (logicalDigest(retained.documents[0]) !== revision.frozenProtocolDigest) throw new Error("DOC_REVISION_FROZEN_PROTOCOL_CHANGED");
    const original = remaining.documents.find(d => d.kind === "PROTOCOL_SYNOPSIS");
    if (logicalDigest(original) !== logicalDigest(revision.original)) throw new Error("DOC_REVISION_ORIGINAL_SOURCE_MISMATCH");
    const prepared = prepareSynopsisRevision(packet, revision);
    const identity = `${prepared.originalDigest}:${prepared.planDigest}`;
    if (usedSynopsisRevisionOriginals.has(prepared.originalDigest)) throw new Error("DOC_REVISION_ATTEMPT_ALREADY_USED");
    usedSynopsisRevisionOriginals.add(prepared.originalDigest);
    const result = await callOpenAIResponses({ stage: "DOCUMENT_PROJECTION", apiKey, fetchImpl,
      modelRequested: "gpt-5.6-terra", instrumentation: instrumentation ? { ...instrumentation, context: { ...instrumentation.context,
        clientRequestId: `${instrumentation.context.clientRequestId}:synopsis-revision:${identity}` } } : undefined,
      transport, payload: { model: "gpt-5.6-terra", instructions: prepared.instruction,
        input: "Retourne uniquement le plan de révision au format JSON valide demandé.\n" + prepared.context,
        reasoning: { effort: "medium" }, max_output_tokens: 4000, store: false, service_tier: "default",
        text: { format: { type: "json_object" } } } });
    // Recorded fetch persists the full raw response before this owner decodes it.
    const revised = materializeSynopsisRevision(JSON.parse(responseOutputText(result.body)), prepared, {
      providerStatus: result.body.status ?? "", rawProviderResponseRef: await retainedProtocol.readSynopsisRevisionRawRef(),
      createdAt: new Date().toISOString() });
    return { value: { documents: [...retained.documents, revised.document, ...revision.frozenCompanion.documents],
      crfRows: revision.frozenCompanion.crfRows }, latencyMs: result.latencyMs, modelRequested: result.modelRequested, modelReturned: result.body.model ?? null,
      calls: 1 as const, reusedProtocolEvidenceRef: retainedProtocol.rawOutputRef, synopsisRevision: revised.provenance };
  }
  const documents = [...retained?.documents ?? [], ...remaining?.documents ?? []]; const crfRows = [...remaining?.crfRows ?? []];
  let latencyMs = 0; let modelReturned: string | null = null;
  for (const batch of remaining ? [] : retained ? batches.slice(1) : batches) {
    // Distinct physical DOC scopes, one human handoff/one final pack. Each
    // scope must have its own existing ledger identity, never a retry identity.
    const batchInstrumentation = instrumentation ? { ...instrumentation, context: { ...instrumentation.context,
      clientRequestId: `${instrumentation.context.clientRequestId}:doc-scope:${batch.requestScope}` } } : undefined;
    const result = await callOpenAIResponses({ stage: "DOCUMENT_PROJECTION", apiKey, fetchImpl,
      modelRequested: "gpt-5.6-terra", instrumentation: batchInstrumentation, transport, payload: { model: "gpt-5.6-terra", instructions: batch.instruction,
        input: batch.context, reasoning: { effort: "medium" }, max_output_tokens: 8000, store: false,
        service_tier: "default", text: { format: { type: "json_object" } } } });
    const value = batch.expand(JSON.parse(responseOutputText(result.body)));
    documents.push(...value.documents); crfRows.push(...value.crfRows); latencyMs += result.latencyMs;
    modelReturned = result.body.model ?? null;
  }
  return { value: { documents, crfRows }, latencyMs,
    modelRequested: mapOpenAIModelForDestination("gpt-5.6-terra", transport?.destination ?? "openai"),
    modelReturned, calls: remaining ? 0 as const : retained ? 1 as const : 2 as const,
    reusedProtocolEvidenceRef: retainedProtocol?.rawOutputRef ?? null, synopsisRevision: undefined };
};

export const buildOpenAILanguageProjectionPayload = (
  request: LanguageProjectionRequest,
  model: string = DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
  reasoningEffort: string = DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
) => {
  const contract = buildLanguageProjectionProviderPayload(request);
  const declaration = contract.tools[0]!.functionDeclarations[0]!;
  return {
    model: resolveOpenAILanguageGatewayModel(model),
    reasoning: { effort: resolveOpenAILanguageGatewayReasoningEffort(reasoningEffort) },
    instructions: contract.systemInstruction.parts.map((part) => part.text).join(""),
    input: contract.contents.flatMap((content) => content.parts.map((part) => part.text)).join(""),
    text: {
      format: {
        type: "json_schema",
        name: LANGUAGE_PROJECTION_SCHEMA_IDENTITY,
        schema: declaration.parametersJsonSchema,
        strict: false,
      },
    },
    max_output_tokens: MAX_OUTPUT_TOKENS,
    store: false,
  } as const;
};

const materializeLanguageProjectionUsage = (usage?: OpenAIUsage): LanguageProjectionUsage | null => usage ? ({
  input_tokens: usage.input_tokens ?? null,
  output_tokens: usage.output_tokens ?? null,
  reasoning_tokens: usage.output_tokens_details?.reasoning_tokens ?? null,
  cached_tokens: usage.input_tokens_details?.cached_tokens ?? null,
}) : null;

export type OpenAILanguageProjectionResult = Readonly<{
  value: LanguageProjectionProviderResult;
  latencyMs: number;
  httpStatus: number;
  responseId: string | null;
  requestId: string | null;
  modelRequested: string;
  modelReturned: string | null;
  reasoningEffort: Exclude<LanguageProjectionReasoningEffort, "NONE">;
  usage: LanguageProjectionUsage | null;
  contextBoundary: ReturnType<typeof languageGatewayContextBoundary>;
}>;

export const executeOpenAILanguageProjection = async (
  request: LanguageProjectionRequest,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  model: string = DEFAULT_OPENAI_LANGUAGE_GATEWAY_MODEL,
  reasoningEffort: string = DEFAULT_OPENAI_LANGUAGE_GATEWAY_REASONING_EFFORT,
  instrumentation?: ProviderCallAttemptInstrumentation,
  transport?: OpenAIProviderTransport,
): Promise<OpenAILanguageProjectionResult> => {
  const modelRequested = resolveOpenAILanguageGatewayModel(model);
  const resolvedEffort = resolveOpenAILanguageGatewayReasoningEffort(reasoningEffort);
  const result = await callOpenAIResponses({
    stage: "LANGUAGE_PROJECTION",
    apiKey,
    payload: buildOpenAILanguageProjectionPayload(request, modelRequested, resolvedEffort),
    fetchImpl,
    modelRequested,
    instrumentation,
    transport,
  });
  const serialized = responseOutputText(result.body);
  let rawProjection: unknown;
  try {
    rawProjection = JSON.parse(serialized);
  } catch {
    throw new ProductBridgeProviderError(
      "LANGUAGE_PROJECTION", result.httpStatus, "STRUCTURED_OUTPUT_INVALID_JSON", "OpenAI returned invalid language projection JSON.", result.body.id ?? null, "OPENAI", result.requestId,
    );
  }
  const projection = parseLanguageProjectionProviderResult(rawProjection);
  if (!projection) {
    throw new ProductBridgeProviderError(
      "LANGUAGE_PROJECTION", result.httpStatus, "LANGUAGE_PROJECTION_MISSING", "OpenAI returned no valid language projection.", result.body.id ?? null, "OPENAI", result.requestId,
    );
  }
  return {
    value: projection,
    latencyMs: result.latencyMs,
    httpStatus: result.httpStatus,
    responseId: result.body.id ?? null,
    requestId: result.requestId,
    modelRequested: result.modelRequested,
    modelReturned: result.body.model ?? null,
    reasoningEffort: resolvedEffort,
    usage: materializeLanguageProjectionUsage(result.body.usage),
    contextBoundary: languageGatewayContextBoundary(request),
  };
};

export const buildOpenAIPersistentDeltaPayload = (
  request: ProductBridgeRequest,
  model: string = DEFAULT_OPENAI_EXTRACTION_MODEL,
) => {
  const frozen = buildPersistentDeltaPayload(request);
  const declaration = frozen.tools[0]!.functionDeclarations[0]!;
  return {
    model: resolveOpenAIExtractionModel(model),
    instructions: frozen.systemInstruction.parts.map((part) => part.text).join("") + (request.nativeConversationRecording ? `\n\n${COMPACT_TRANSACTION_INSTRUCTION}` : ""),
    input: request.nativeConversationRecording ? prepareCompactTransaction(request).context : frozen.contents.flatMap((content) => content.parts.map((part) => part.text)).join(""),
    text: {
      format: {
        type: "json_schema",
        name: FUNCTION_NAME,
        schema: request.nativeConversationRecording ? compactTransactionSchema() : declaration.parametersJsonSchema,
        strict: false,
      },
    },
    max_output_tokens: MAX_OUTPUT_TOKENS,
    store: false,
  } as const;
};

export const executeOpenAIPersistentDelta = async (
  request: ProductBridgeRequest,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  model: string = DEFAULT_OPENAI_EXTRACTION_MODEL,
  instrumentation?: ProviderCallAttemptInstrumentation,
  transport?: OpenAIProviderTransport,
): Promise<OpenAIPersistentDeltaResult> => {
  const modelRequested = resolveOpenAIExtractionModel(model);
  const payload = buildOpenAIPersistentDeltaPayload(request, modelRequested);
  const promptDigest = logicalDigest(payload.instructions);
  const schemaDigest = logicalDigest(JSON.stringify(payload.text.format.schema));
  const configurationDigest = logicalDigest({
    provider: "OPENAI",
    endpoint: transport?.responsesEndpoint ?? OPENAI_RESPONSES_ENDPOINT,
    model: mapOpenAIModelForDestination(modelRequested, transport?.destination ?? "openai"),
    mechanism: "RESPONSES_TEXT_FORMAT_JSON_SCHEMA",
    strict: false,
    store: false,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    promptDigest,
    schemaDigest,
  });
  const response = await callOpenAIResponses({
    stage: "PERSISTENT_DELTA", apiKey, payload, fetchImpl, modelRequested, instrumentation, transport,
  });
  const { body, requestId } = response;

  const structuredArgsSerialized = responseOutputText(body);
  if (!structuredArgsSerialized.trim()) {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.httpStatus, "STRUCTURED_OUTPUT_MISSING", "OpenAI returned no structured extraction output.", body.id ?? null, "OPENAI", requestId,
    );
  }
  let structuredArgs: unknown;
  try {
    structuredArgs = JSON.parse(structuredArgsSerialized);
  } catch {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.httpStatus, "STRUCTURED_OUTPUT_INVALID_JSON", "OpenAI returned invalid structured extraction JSON.", body.id ?? null, "OPENAI", requestId,
    );
  }
  if (!structuredArgs || typeof structuredArgs !== "object" || Array.isArray(structuredArgs)) {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.httpStatus, "STRUCTURED_OUTPUT_INVALID", "OpenAI returned an invalid structured extraction value.", body.id ?? null, "OPENAI", requestId,
    );
  }

  const compact = request.nativeConversationRecording ? expandCompactTransaction(structuredArgs, request) : null;
  const structuredArgsDigest = logicalDigest(structuredArgsSerialized);
  const requestTurnRef = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER")?.turnId ?? "UNKNOWN_USER_TURN";
  const sourceCatalog = buildPersistentSourceCatalog(request.conversation);
  const modelReturned = body.model ?? null;
  const providerArtifact: PersistentExtractionProviderArtifact = {
    artifactRef: `openai-structured-args:${structuredArgsDigest}`,
    requestTurnRef,
    executor: "executeOpenAIPersistentDelta",
    provider: "OPENAI",
    model: modelReturned ?? response.modelRequested,
    modelRequested: response.modelRequested,
    modelReturned,
    functionName: FUNCTION_NAME,
    receivedAt: new Date().toISOString(),
    providerResponseId: body.id ?? null,
    providerRequestId: requestId,
    endpoint: response.endpoint,
    sourceProjectId: request.currentProject?.projectId ?? null,
    sourceProjectVersion: request.currentProject?.versionId ?? null,
    sourceProjectDigest: request.currentProject?.projectDigest ?? null,
    promptDigest,
    schemaDigest,
    configurationDigest,
    usage: body.usage ?? null,
    sourceCatalog,
    sourceCatalogDigest: sourceCatalog.catalogDigest,
    structuredArgsExact: structuredArgs,
    structuredArgsSerialized,
    structuredArgsDigest,
    ...(compact ? { compactPreparation: compact.evidence } : {}),
  };
  return {
    value: { structuredArgs: compact?.value ?? structuredArgs, providerArtifact },
    latencyMs: response.latencyMs,
    httpStatus: response.httpStatus,
    responseId: body.id ?? null,
    requestId,
    modelRequested: response.modelRequested,
    modelReturned,
    usage: body.usage ?? null,
  };
};
