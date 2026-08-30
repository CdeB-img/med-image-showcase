import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import {
  DEFAULT_OPENAI_EXTRACTION_MODEL,
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  buildPersistentSourceCatalog,
  resolveOpenAIExtractionModel,
  type PersistentExtractionProviderArtifact,
  type ProductBridgeRequest,
} from "../src/features/protocol-designer/product-bridge.js";
import { buildPersistentDeltaPayload, ProductBridgeProviderError } from "./protocol-designer-bridge-provider.js";

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const FUNCTION_NAME = "propose_persistent_project_delta" as const;
const MAX_OUTPUT_TOKENS = 8_000;
const TIMEOUT_MS = 120_000;

export const OPENAI_STRICT_SCHEMA_HARDENING_DEBT = "OPEN" as const;

type OpenAIUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
  output_tokens_details?: { reasoning_tokens?: number };
};

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

export const buildOpenAIPersistentDeltaPayload = (
  request: ProductBridgeRequest,
  model: string = DEFAULT_OPENAI_EXTRACTION_MODEL,
) => {
  const frozen = buildPersistentDeltaPayload(request);
  const declaration = frozen.tools[0]!.functionDeclarations[0]!;
  return {
    model: resolveOpenAIExtractionModel(model),
    instructions: frozen.systemInstruction.parts.map((part) => part.text).join(""),
    input: frozen.contents.flatMap((content) => content.parts.map((part) => part.text)).join(""),
    text: {
      format: {
        type: "json_schema",
        name: FUNCTION_NAME,
        schema: declaration.parametersJsonSchema,
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
): Promise<OpenAIPersistentDeltaResult> => {
  const modelRequested = resolveOpenAIExtractionModel(model);
  const payload = buildOpenAIPersistentDeltaPayload(request, modelRequested);
  const promptDigest = logicalDigest(payload.instructions);
  const schemaDigest = logicalDigest(JSON.stringify(payload.text.format.schema));
  const configurationDigest = logicalDigest({
    provider: "OPENAI",
    endpoint: OPENAI_RESPONSES_ENDPOINT,
    model: modelRequested,
    mechanism: "RESPONSES_TEXT_FORMAT_JSON_SCHEMA",
    strict: false,
    store: false,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    promptDigest,
    schemaDigest,
  });
  const started = Date.now();
  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    response = await fetchImpl(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA",
      null,
      error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_FAILURE",
      "Provider request failed.",
      null,
      "OPENAI",
    );
  } finally {
    clearTimeout(timer);
  }

  const requestId = response.headers.get("x-request-id");
  const raw = await response.text();
  let body: OpenAIResponseBody;
  try {
    body = JSON.parse(raw) as OpenAIResponseBody;
  } catch {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.status, "INVALID_PROVIDER_JSON", "Provider returned invalid JSON.", null, "OPENAI", requestId,
    );
  }
  if (!response.ok || body.status === "failed" || body.status === "incomplete") {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA",
      response.status,
      body.error?.code ?? body.error?.type ?? body.status ?? `HTTP_${response.status}`,
      body.error?.message ?? "OpenAI extraction request failed.",
      body.id ?? null,
      "OPENAI",
      requestId,
    );
  }

  const structuredArgsSerialized = responseOutputText(body);
  if (!structuredArgsSerialized.trim()) {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.status, "STRUCTURED_OUTPUT_MISSING", "OpenAI returned no structured extraction output.", body.id ?? null, "OPENAI", requestId,
    );
  }
  let structuredArgs: unknown;
  try {
    structuredArgs = JSON.parse(structuredArgsSerialized);
  } catch {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.status, "STRUCTURED_OUTPUT_INVALID_JSON", "OpenAI returned invalid structured extraction JSON.", body.id ?? null, "OPENAI", requestId,
    );
  }
  if (!structuredArgs || typeof structuredArgs !== "object" || Array.isArray(structuredArgs)) {
    throw new ProductBridgeProviderError(
      "PERSISTENT_DELTA", response.status, "STRUCTURED_OUTPUT_INVALID", "OpenAI returned an invalid structured extraction value.", body.id ?? null, "OPENAI", requestId,
    );
  }

  const structuredArgsDigest = logicalDigest(structuredArgsSerialized);
  const requestTurnRef = [...request.conversation.turns].reverse().find((turn) => turn.role === "USER")?.turnId ?? "UNKNOWN_USER_TURN";
  const sourceCatalog = buildPersistentSourceCatalog(request.conversation);
  const modelReturned = body.model ?? null;
  const providerArtifact: PersistentExtractionProviderArtifact = {
    artifactRef: `openai-structured-args:${structuredArgsDigest}`,
    requestTurnRef,
    executor: "executeOpenAIPersistentDelta",
    provider: "OPENAI",
    model: modelReturned ?? modelRequested,
    modelRequested,
    modelReturned,
    functionName: FUNCTION_NAME,
    receivedAt: new Date().toISOString(),
    providerResponseId: body.id ?? null,
    providerRequestId: requestId,
    endpoint: OPENAI_RESPONSES_ENDPOINT,
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
  };
  return {
    value: { structuredArgs, providerArtifact },
    latencyMs: Date.now() - started,
    httpStatus: response.status,
    responseId: body.id ?? null,
    requestId,
    modelRequested,
    modelReturned,
    usage: body.usage ?? null,
  };
};
