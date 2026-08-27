import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { executeProtocolDesignerBridge } from "./api/protocol-designer-bridge";

const localProductBridge = (apiKey: string | null): Plugin => ({
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
      const result = await executeProtocolDesignerBridge({ body, apiKey });
      response.statusCode = result.status;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      response.end(JSON.stringify(result.body));
    });
  },
});

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const apiKey = process.env.GEMINI_API_KEY?.trim() || environment.GEMINI_API_KEY?.trim() || null;
  const deploymentGitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || environment.VERCEL_GIT_COMMIT_SHA?.trim() || "";
  const buildGitSha = /^[0-9a-f]{7,40}$/i.test(deploymentGitSha) ? deploymentGitSha.slice(0, 7).toLowerCase() : "";
  return {
    base: "/",
    plugins: [react(), localProductBridge(apiKey)],
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
