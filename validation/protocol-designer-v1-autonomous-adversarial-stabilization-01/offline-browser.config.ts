import { appendFile, mkdir } from "node:fs/promises";
import { mkdtempSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../api/protocol-designer-bridge";
import { createAdversarialProviderTransport, type AdversarialCorpus, type ProviderCallWitness } from "./provider-transport";

const missionRoot = path.resolve("validation/protocol-designer-v1-autonomous-adversarial-stabilization-01");
const frozenCorpus = readFileSync(path.join(missionRoot, "corpus.json"), "utf8");
const freeze = JSON.parse(readFileSync(path.join(missionRoot, "corpus-freeze.json"), "utf8"));
if (createHash("sha256").update(frozenCorpus).digest("hex") !== freeze.corpusSha256) throw new Error("OFFLINE_CORPUS_DIGEST_MISMATCH");
const corpus = JSON.parse(frozenCorpus) as AdversarialCorpus;
const evidenceRoot = path.resolve(process.env.NOXIA_OFFLINE_BROWSER_EVIDENCE_DIR ?? path.join(missionRoot, "browser-evidence"));
const port = Number(process.env.NOXIA_ADVERSARIAL_PORT ?? 5201);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("ADVERSARIAL_OFFLINE_PORT_INVALID");
const witnesses: ProviderCallWitness[] = [];
const replayFetch = createAdversarialProviderTransport(witnesses, { corpus });

/** Based on the existing long-horizon server: the only provider substitution is fetchImpl. */
export const adversarialOfflineBridge: Plugin = {
  name: "noxia-adversarial-offline-provider-transport",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = request.url?.split("?")[0] ?? "";
      if (!url.startsWith("/api/") && !url.startsWith("/__offline_campaign/")) return next();
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      if (url === "/__offline_campaign/status" && request.method === "GET") {
        response.end(JSON.stringify({ provenance: "SYNTHETIC_CONTRACT_FIXTURE", active: replayFetch.getActiveTurn(),
          providerWitnesses: witnesses.length, realProviderCalls: 0, scenarios: corpus.scenarios.map((item) => item.id) }));
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > 500_000) { response.statusCode = 413; response.end("{}"); return; }
        chunks.push(bytes);
      }
      const rawBody = Buffer.concat(chunks).toString("utf8");
      let body: unknown;
      try {
        body = url === "/__offline_campaign/active-turn"
          && request.headers["content-type"]?.startsWith("application/x-www-form-urlencoded")
          ? Object.fromEntries(new URLSearchParams(rawBody)) : JSON.parse(rawBody);
      }
      catch { response.statusCode = 400; response.end(JSON.stringify({ error: "OFFLINE_INVALID_JSON" })); return; }
      if (url === "/__offline_campaign/active-turn" && request.method === "POST") {
        try {
          const selection = body as { scenarioId?: string; turnId?: string };
          if (typeof selection?.scenarioId !== "string" || typeof selection.turnId !== "string") {
            throw new Error("OFFLINE_ACTIVE_TURN_BODY_REQUIRED");
          }
          replayFetch.setActiveTurn(selection.scenarioId, selection.turnId);
          response.end(JSON.stringify({ active: replayFetch.getActiveTurn(), realProviderCalls: 0 }));
        } catch (error) {
          response.statusCode = 422;
          response.end(JSON.stringify({ error: String(error) }));
        }
        return;
      }
      if (url !== "/api/protocol-designer-bridge") {
        response.statusCode = 503;
        response.end(JSON.stringify({ error: { code: "OFFLINE_NO_OTHER_API_OR_PROVIDER" } }));
        return;
      }
      const active = replayFetch.getActiveTurn();
      if (!active) {
        response.statusCode = 422;
        response.end(JSON.stringify({ error: { code: "OFFLINE_ACTIVE_FROZEN_TURN_REQUIRED" } }));
        return;
      }
      const start = witnesses.length;
      let responseBody: unknown;
      let failure: string | null = null;
      const adapter: ApiResponse = {
        status(code) { response.statusCode = code; return adapter; },
        setHeader(name, value) { response.setHeader(name, value); },
        json(value) { responseBody = value; },
      };
      try {
        await handleProtocolDesignerBridge({ method: request.method, headers: request.headers, body: rawBody }, adapter, {
          NODE_ENV: "development", GEMINI_API_KEY: "offline-only", OPENAI_API_KEY: "offline-only",
          GEMINI_MODEL: "gemini-3.5-flash-lite", OPENAI_EXTRACTION_MODEL: "gpt-5.6-terra",
        }, { fetchImpl: replayFetch, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
      } catch (error) {
        failure = String(error);
        response.statusCode = 500;
        responseBody = { error: { code: "OFFLINE_TRANSPORT_FAILED", message: failure } };
      }
      await mkdir(evidenceRoot, { recursive: true, mode: 0o700 });
      await appendFile(path.join(evidenceRoot, "browser-http-exchanges.jsonl"), `${JSON.stringify({
        evidenceLevel: "REAL_BROWSER_SYNTHETIC_ADAPTER_TRANSPORT", at: new Date().toISOString(), active,
        request: body, responseStatus: response.statusCode, response: responseBody, failure,
        providerWitnesses: witnesses.slice(start), realProviderCalls: 0,
      })}\n`, { mode: 0o600 });
      response.end(JSON.stringify(responseBody));
    });
  },
};

export default defineConfig({
  root: path.resolve("."),
  envDir: mkdtempSync(path.join(tmpdir(), "noxia-adversarial-no-env-")),
  plugins: [react(), adversarialOfflineBridge],
  define: { __NOXIA_BUILD_GIT_SHA__: JSON.stringify("offline-adversarial-campaign") },
  resolve: { alias: { "@": path.resolve("src"), "node:crypto": path.resolve("src/features/knowledge-engine/browser-crypto.ts") } },
  server: { host: "127.0.0.1", port, strictPort: true,
    headers: { "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://127.0.0.1:${port}; object-src 'none'; base-uri 'self'; form-action 'self'` },
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.provider-evidence.local/**",
      "**/.long-horizon-browser-evidence.local/**", `${evidenceRoot}/**`] },
  },
});
