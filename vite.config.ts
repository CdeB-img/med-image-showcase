import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { executeProtocolDesignerBridge } from "./api/protocol-designer-bridge";

export type LocalProductBridgeConfiguration = Readonly<{
  apiKey: string | null;
  openAiApiKey: string | null;
  geminiModel: string | null;
  openAiExtractionModel: string | null;
}>;

const configuredValue = (
  name: "GEMINI_API_KEY" | "OPENAI_API_KEY" | "GEMINI_MODEL" | "OPENAI_EXTRACTION_MODEL",
  processEnvironment: Readonly<Record<string, string | undefined>>,
  fileEnvironment: Readonly<Record<string, string | undefined>>,
) => processEnvironment[name]?.trim() || fileEnvironment[name]?.trim() || null;

export const resolveLocalProductBridgeConfiguration = (
  processEnvironment: Readonly<Record<string, string | undefined>>,
  fileEnvironment: Readonly<Record<string, string | undefined>>,
): LocalProductBridgeConfiguration => ({
  apiKey: configuredValue("GEMINI_API_KEY", processEnvironment, fileEnvironment),
  openAiApiKey: configuredValue("OPENAI_API_KEY", processEnvironment, fileEnvironment),
  geminiModel: configuredValue("GEMINI_MODEL", processEnvironment, fileEnvironment),
  openAiExtractionModel: configuredValue("OPENAI_EXTRACTION_MODEL", processEnvironment, fileEnvironment),
});

export const executeLocalProductBridgeRequest = (
  body: unknown,
  configuration: LocalProductBridgeConfiguration,
  executor: typeof executeProtocolDesignerBridge = executeProtocolDesignerBridge,
) => executor({ body, ...configuration });

const localProductBridge = (configuration: LocalProductBridgeConfiguration): Plugin => ({
  name: "noxia-local-product-bridge",
  configureServer(server) {
    server.middlewares.use("/api/protocol-designer-bridge", async (request, response, next) => {
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
      const result = await executeLocalProductBridgeRequest(body, configuration);
      response.statusCode = result.status;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      response.end(JSON.stringify(result.body));
    });
  },
});

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const providerConfiguration = resolveLocalProductBridgeConfiguration(process.env, environment);
  const deploymentGitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || environment.VERCEL_GIT_COMMIT_SHA?.trim() || "";
  const buildGitSha = /^[0-9a-f]{7,40}$/i.test(deploymentGitSha) ? deploymentGitSha.slice(0, 7).toLowerCase() : "";
  return {
    base: "/",
    plugins: [react(), localProductBridge(providerConfiguration)],
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
