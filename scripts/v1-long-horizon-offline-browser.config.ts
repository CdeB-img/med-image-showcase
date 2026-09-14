import { appendFile, mkdir } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { handleProtocolDesignerBridge, type ApiResponse } from "../api/protocol-designer-bridge";
import { createLongHorizonProviderReplay, type ProviderCallWitness } from "../src/features/protocol-designer/functional-reset/__tests__/fixtures/long-horizon-provider-replay";

// Explicit offline-only server: no env-file/credential loading, no live fetch,
// no runtime replacement above the actual provider adapter transport.
const witnesses: ProviderCallWitness[] = [];
const replayFetch = createLongHorizonProviderReplay(witnesses);
const evidenceRoot = path.resolve(process.env.NOXIA_OFFLINE_BROWSER_EVIDENCE_DIR
  || ".long-horizon-browser-evidence.local");
export const offlineBridge: Plugin = {
  name: "noxia-offline-browser-provider-replay",
  configureServer(server) {
    server.middlewares.use("/api/", async (request, response) => {
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      if (request.url !== "/protocol-designer-bridge") {
        response.statusCode = 503;
        response.end(JSON.stringify({ error: { code: "OFFLINE_REPLAY_NO_OTHER_PROVIDER" } }));
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > 300_000) { response.statusCode = 413; response.end("{}"); return; }
        chunks.push(bytes);
      }
      const body = Buffer.concat(chunks).toString("utf8");
      let evidenceRequest: unknown = null;
      let requestParseStatus: "VALID_JSON" | "INVALID_JSON" = "VALID_JSON";
      try { evidenceRequest = JSON.parse(body) as unknown; }
      catch { requestParseStatus = "INVALID_JSON"; }
      const start = witnesses.length;
      let responseBody: unknown;
      const adapter: ApiResponse = {
        status(code) { response.statusCode = code; return adapter; },
        setHeader(name, value) { response.setHeader(name, value); },
        json(value) { responseBody = value; },
      };
      try {
        await handleProtocolDesignerBridge({ method: request.method, headers: request.headers, body }, adapter, {
          NODE_ENV: "development", GEMINI_API_KEY: "offline-only", OPENAI_API_KEY: "offline-only",
          GEMINI_MODEL: "gemini-3.5-flash-lite", OPENAI_EXTRACTION_MODEL: "gpt-5.6-terra",
        }, { fetchImpl: replayFetch });
        await mkdir(evidenceRoot, { recursive: true, mode: 0o700 });
        await appendFile(path.join(evidenceRoot, "browser-http-exchanges.jsonl"), `${JSON.stringify({
          evidenceLevel: "REAL_BROWSER_SYNTHETIC_ADAPTER_REPLAY", at: new Date().toISOString(),
          request: evidenceRequest, requestParseStatus,
          ...(requestParseStatus === "INVALID_JSON" ? { requestRawBody: body } : {}),
          responseStatus: response.statusCode, response: responseBody,
          providerWitnesses: witnesses.slice(start), realProviderCalls: 0,
        })}\n`, { mode: 0o600 });
        response.end(JSON.stringify(responseBody));
      } catch (error) {
        response.statusCode = 500;
        response.end(JSON.stringify({ error: { code: "OFFLINE_REPLAY_FAILED", message: String(error) } }));
      }
    });
  },
};

export default defineConfig({
  root: path.resolve("."), envDir: mkdtempSync(path.join(tmpdir(), "noxia-offline-no-env-")),
  plugins: [react(), offlineBridge],
  define: { __NOXIA_BUILD_GIT_SHA__: JSON.stringify("offline-review") },
  resolve: { alias: { "@": path.resolve("src"), "node:crypto": path.resolve("src/features/knowledge-engine/browser-crypto.ts") } },
  server: { host: "127.0.0.1", port: 5199, strictPort: true,
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.provider-evidence.local/**",
      "**/.long-horizon-browser-evidence.local/**", `${evidenceRoot}/**`] },
  },
});
