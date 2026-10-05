export const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";

// Historical qualification identities retained for the legacy gate/evidence.
// Current Azure generation uses local admission, never OpenAI network precount.
const AZURE_INPUT_COUNT_QUALIFICATIONS: Readonly<Record<string, string>> = Object.freeze({
  "gpt-5.6-sol": "OPENAI_COUNT_AZURE_GENERATION_GPT_5_6_SOL_2026_09_22",
  "gpt-5.6-terra": "OPENAI_COUNT_AZURE_GENERATION_GPT_5_6_TERRA_2026_09_22",
});

export const azureInputCountQualification = (generationModel: string) =>
  AZURE_INPUT_COUNT_QUALIFICATIONS[generationModel] ?? null;

export type OpenAIProviderDestination = "openai" | "azure";

export type OpenAIProviderTransport = Readonly<{
  destination: OpenAIProviderDestination;
  responsesEndpoint: string;
  terraRequestedModel?: "gpt-6.1-sol";
}>;

export type OpenAIProviderRuntimeConfiguration = Readonly<{
  apiKey: string | null;
  transport?: OpenAIProviderTransport;
}>;

const AZURE_RESPONSES_PATH_SUFFIX = "/openai/v1/responses";
const AZURE_PROJECT_PATH = /^\/api\/projects\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

const normalizedAzureProjectEndpoint = (raw: string) => {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("AZURE_OPENAI_PROJECT_ENDPOINT_INVALID"); }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash
    || !url.hostname.endsWith(".services.ai.azure.com") || !AZURE_PROJECT_PATH.test(url.pathname.replace(/\/$/u, ""))) {
    throw new Error("AZURE_OPENAI_PROJECT_ENDPOINT_INVALID");
  }
  return `${url.origin}${url.pathname.replace(/\/$/u, "")}`;
};

export const azureOpenAIResponsesEndpoint = (projectEndpoint: string) => (
  `${normalizedAzureProjectEndpoint(projectEndpoint)}${AZURE_RESPONSES_PATH_SUFFIX}`
);

export const openAIProviderDestinationFromEndpoint = (endpoint: string): OpenAIProviderDestination | null => {
  if (endpoint === OPENAI_RESPONSES_ENDPOINT || endpoint === `${OPENAI_RESPONSES_ENDPOINT}/input_tokens`) return "openai";
  let url: URL;
  try { url = new URL(endpoint); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash
    || !url.hostname.endsWith(".services.ai.azure.com")) return null;
  const path = url.pathname.endsWith("/input_tokens") ? url.pathname.slice(0, -"/input_tokens".length) : url.pathname;
  const projectPath = path.endsWith(AZURE_RESPONSES_PATH_SUFFIX)
    ? path.slice(0, -AZURE_RESPONSES_PATH_SUFFIX.length) : "";
  return AZURE_PROJECT_PATH.test(projectPath) ? "azure" : null;
};

export const isOpenAIResponsesEndpoint = (endpoint: string) => (
  openAIProviderDestinationFromEndpoint(endpoint) !== null && !endpoint.endsWith("/input_tokens")
);

export const isOpenAIInputCountEndpoint = (endpoint: string) => (
  endpoint === `${OPENAI_RESPONSES_ENDPOINT}/input_tokens`
);

export const supportsOpenAIExactInputCount = (responsesEndpoint: string) => (
  responsesEndpoint === OPENAI_RESPONSES_ENDPOINT
);

export const openAIInputCountEndpoint = (responsesEndpoint: string) => {
  if (!supportsOpenAIExactInputCount(responsesEndpoint)) throw new Error("OPENAI_INPUT_COUNT_ENDPOINT_UNAVAILABLE");
  return `${OPENAI_RESPONSES_ENDPOINT}/input_tokens`;
};

export const mapOpenAIModelForDestination = (model: string, destination: OpenAIProviderDestination) => {
  if (destination === "openai") return model;
  return providerModelDeclaration(model)?.azureDeployment ?? model;
};

export const mapOpenAIModelForEndpoint = (model: string, endpoint: string) => {
  const destination = openAIProviderDestinationFromEndpoint(endpoint);
  return destination ? mapOpenAIModelForDestination(model, destination) : model;
};

export const openAIProviderHeaders = (apiKey: string, transport?: OpenAIProviderTransport): Record<string, string> => (
  transport?.destination === "azure"
    ? { "content-type": "application/json", "api-key": apiKey }
    : { "content-type": "application/json", authorization: `Bearer ${apiKey}` }
);

export const resolveOpenAIProviderRuntimeConfiguration = (
  environment: Readonly<Record<string, string | undefined>>,
): OpenAIProviderRuntimeConfiguration => {
  const selected = environment.OPENAI_PROVIDER?.trim().toLowerCase() || "openai";
  const candidateModel = environment.NOXIA_PREVIEW_TERRA_MODEL;
  if (candidateModel !== undefined && (environment.VERCEL_ENV !== "preview"
    || selected !== "azure" || candidateModel !== "gpt-6.1-sol")) {
    throw new Error("PREVIEW_TERRA_MODEL_CONFIGURATION_INVALID");
  }
  if (selected === "openai") return { apiKey: environment.OPENAI_API_KEY?.trim() || null };
  if (selected !== "azure") throw new Error("OPENAI_PROVIDER_INVALID");
  const projectEndpoint = environment.AZURE_OPENAI_PROJECT_ENDPOINT?.trim();
  if (!projectEndpoint) throw new Error("AZURE_OPENAI_PROJECT_ENDPOINT_MISSING");
  return {
    apiKey: environment.AZURE_OPENAI_API_KEY?.trim() || null,
    transport: Object.freeze({ destination: "azure", responsesEndpoint: azureOpenAIResponsesEndpoint(projectEndpoint),
      ...(candidateModel ? { terraRequestedModel: candidateModel as "gpt-6.1-sol" } : {}) }),
  };
};
import { providerModelDeclaration } from "../src/features/protocol-designer/provider-model-contract.js";
