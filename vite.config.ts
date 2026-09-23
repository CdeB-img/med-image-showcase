import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge } from "./api/protocol-designer-bridge";
import { createRecordedProtocolDesignerFetch } from "./server/protocol-designer-provider-replay";
import { resolveCanaryExecution } from "./server/protocol-designer-canary-policy";
import { readRetainedDrciProtocolEvidence } from "./server/protocol-designer-document-evidence";
import {
  resolveOpenAIProviderRuntimeConfiguration,
  type OpenAIProviderTransport,
} from "./server/protocol-designer-openai-provider-config";

export type LocalProductBridgeConfiguration = Readonly<{
  apiKey: string | null;
  openAiApiKey: string | null;
  openAiCountApiKey?: string;
  openAiTransport?: OpenAIProviderTransport;
  geminiModel: string | null;
  openAiExtractionModel: string | null;
  chatRuntime?: "TERRA" | null;
  autonomousProjectBuild?: boolean;
}>;

const configuredValue = (
  name: "GEMINI_API_KEY" | "OPENAI_API_KEY" | "GEMINI_MODEL" | "OPENAI_EXTRACTION_MODEL",
  processEnvironment: Readonly<Record<string, string | undefined>>,
  fileEnvironment: Readonly<Record<string, string | undefined>>,
) => processEnvironment[name]?.trim() || fileEnvironment[name]?.trim() || null;

export const resolveLocalProductBridgeConfiguration = (
  processEnvironment: Readonly<Record<string, string | undefined>>,
  fileEnvironment: Readonly<Record<string, string | undefined>>,
): LocalProductBridgeConfiguration => {
  const processValues = Object.fromEntries(Object.entries(processEnvironment).filter(([, value]) => value !== undefined));
  const openAiProvider = resolveOpenAIProviderRuntimeConfiguration({ ...fileEnvironment, ...processValues });
  return {
    apiKey: configuredValue("GEMINI_API_KEY", processEnvironment, fileEnvironment),
    openAiApiKey: openAiProvider.apiKey,
    ...(openAiProvider.countApiKey ? { openAiCountApiKey: openAiProvider.countApiKey } : {}),
    ...(openAiProvider.transport ? { openAiTransport: openAiProvider.transport } : {}),
    geminiModel: configuredValue("GEMINI_MODEL", processEnvironment, fileEnvironment),
    openAiExtractionModel: configuredValue("OPENAI_EXTRACTION_MODEL", processEnvironment, fileEnvironment),
    ...((processEnvironment.VITE_AUTONOMOUS_PROJECT_BUILD ?? fileEnvironment.VITE_AUTONOMOUS_PROJECT_BUILD) === "ON"
      ? { autonomousProjectBuild: true } : {}),
    ...( (processEnvironment.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME ?? fileEnvironment.VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME) === "TERRA"
      ? { chatRuntime: "TERRA" as const } : {}),
  };
};

export const executeLocalProductBridgeRequest = (
  body: unknown,
  configuration: LocalProductBridgeConfiguration,
  executor: typeof executeProtocolDesignerBridge = executeProtocolDesignerBridge,
) => executor({ body, ...configuration });

export const localProductBridge = (
  configuration: LocalProductBridgeConfiguration,
  evidenceRoot: string,
  canaryConfiguration: ReturnType<typeof resolveCanaryExecution> = null,
  fetchImpl: typeof fetch = fetch,
  publicRuntime = false,
): Plugin => ({
  name: "noxia-local-product-bridge",
  configureServer(server) {
    if (publicRuntime && canaryConfiguration) throw new Error("PUBLIC_RUNTIME_AND_CANARY_PROFILE_CONFLICT");
    const canary = canaryConfiguration ? resolveCanaryExecution({
      PROTOCOL_DESIGNER_LIVE_CANARY: canaryConfiguration.attemptPolicy,
      PROTOCOL_DESIGNER_CANARY_ID: canaryConfiguration.campaignId,
      ...(canaryConfiguration.campaignPolicy ? { PROTOCOL_DESIGNER_CAMPAIGN_POLICY: JSON.stringify(canaryConfiguration.campaignPolicy) } : {}),
    }) : null;
    server.middlewares.use(canary ? "/api/" : "/api/protocol-designer-bridge", async (request, response, next) => {
      if (canary && request.url !== "/protocol-designer-bridge") {
        response.statusCode = 503;
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ error: { code: "CANARY_OTHER_API_ROUTE_FORBIDDEN" } }));
        return;
      }
      if (request.method !== "POST") return next();
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.byteLength;
        if (size > 300_000) {
          response.statusCode = 413;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: { code: "PAYLOAD_TOO_LARGE", message: "Conversation trop volumineuse." } }));
          return;
        }
        chunks.push(buffer);
      }
      let body: unknown = null;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { /* parsed as invalid below */ }
      // Local live calls become durable, private replay evidence. No request
      // headers/credentials are persisted and this store is not bundled for UI.
      let canaryDenial: string | null = null;
      const recordedFetch = createRecordedProtocolDesignerFetch({
        root: canary ? path.join(evidenceRoot, `canary-${canary.campaignId}`) : evidenceRoot,
        fetchImpl,
        ...(canary ? { canaryCampaignId: canary.campaignId, onCanaryDenied: (code: string) => { canaryDenial = code; } } : {}),
        ...(canary?.campaignPolicy ? { campaignPolicy: canary.campaignPolicy,
          projectId: body && typeof body === "object" && "currentProject" in body
            && body.currentProject && typeof body.currentProject === "object" && "projectId" in body.currentProject
            && typeof body.currentProject.projectId === "string" ? body.currentProject.projectId : null,
        } : {}),
        secrets: [configuration.apiKey ?? "", configuration.openAiApiKey ?? "", configuration.openAiCountApiKey ?? ""],
        context: body && typeof body === "object" && "observabilityContext" in body
          ? body.observabilityContext : null,
      });
      // Local qualification can exercise the actual Production handler and its
      // unchanged caps. This is the same client endpoint and native transport.
      if (publicRuntime) {
        await handleProtocolDesignerBridge({ method: request.method, headers: request.headers, body, socket: request.socket }, {
          setHeader(name, value) { response.setHeader(name, value); },
          status(status) { response.statusCode = status; return this; },
          json(value) { response.end(JSON.stringify(value)); },
        }, { NODE_ENV: "production", GEMINI_API_KEY: configuration.apiKey ?? undefined,
          OPENAI_PROVIDER: configuration.openAiTransport?.destination,
          OPENAI_API_KEY: configuration.openAiTransport ? configuration.openAiCountApiKey : configuration.openAiApiKey ?? undefined,
          AZURE_OPENAI_API_KEY: configuration.openAiTransport?.destination === "azure" ? configuration.openAiApiKey ?? undefined : undefined,
          AZURE_OPENAI_PROJECT_ENDPOINT: configuration.openAiTransport?.destination === "azure"
            ? configuration.openAiTransport.responsesEndpoint.slice(0, -"/openai/v1/responses".length) : undefined,
          GEMINI_MODEL: configuration.geminiModel ?? undefined,
          OPENAI_EXTRACTION_MODEL: configuration.openAiExtractionModel ?? undefined,
          VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: configuration.chatRuntime ?? undefined,
          VITE_AUTONOMOUS_PROJECT_BUILD: configuration.autonomousProjectBuild ? "ON" : undefined,
          NOXIA_DURABLE_DATABASE_DATABASE_URL: process.env.NOXIA_DURABLE_DATABASE_DATABASE_URL,
        }, { fetchImpl: recordedFetch, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
        return;
      }
      const result = await executeLocalProductBridgeRequest(body, configuration,
        (input) => executeProtocolDesignerBridge({ ...input, fetchImpl: recordedFetch,
          ...(canary ? { providerAttemptPolicy: canary.attemptPolicy } : {}),
          ...(canary?.campaignPolicy && configuration.chatRuntime === "TERRA" ? {
            readRetainedDocumentProtocol: (packet, context) => readRetainedDrciProtocolEvidence({
              root: path.join(evidenceRoot, `canary-${canary.campaignId}`), policy: canary.campaignPolicy!,
              sessionId: context.sessionId, packet,
            }),
          } : {}),
        }));
      response.statusCode = canaryDenial ? 503 : result.status;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      response.end(JSON.stringify(canaryDenial ? {
        ...result.body, error: { code: canaryDenial, message: "Canary arrêté avant tout nouvel appel provider : condition de sécurité non satisfaite." },
      } : result.body));
    });
  },
});

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const providerConfiguration = resolveLocalProductBridgeConfiguration(process.env, environment);
  // Opt-in is server-side only. Invalid/partial configuration cannot select the
  // normal runtime silently; no browser field may weaken the campaign policy.
  const canary = resolveCanaryExecution(process.env);
  const evidenceRoot = path.resolve(process.env.PROTOCOL_DESIGNER_EVIDENCE_DIR || ".provider-evidence.local");
  const deploymentGitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || environment.VERCEL_GIT_COMMIT_SHA?.trim() || "";
  const buildGitSha = /^[0-9a-f]{7,40}$/i.test(deploymentGitSha) ? deploymentGitSha.slice(0, 7).toLowerCase() : "";
  return {
    base: "/",
    plugins: [react(), localProductBridge(providerConfiguration, evidenceRoot, canary, fetch,
      process.env.PROTOCOL_DESIGNER_LOCAL_PUBLIC_RUNTIME === "ON")],
    server: { fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.provider-evidence.local/**", `${evidenceRoot}/**`] } },
    define: {
      __NOXIA_BUILD_GIT_SHA__: JSON.stringify(buildGitSha),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "node:crypto": path.resolve(__dirname, "./src/features/knowledge-engine/browser-crypto.ts"),
      },
    },
  };
});
