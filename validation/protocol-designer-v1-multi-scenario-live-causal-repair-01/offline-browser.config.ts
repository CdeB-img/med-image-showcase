import { appendFile, mkdir } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../api/protocol-designer-bridge";
import { type ProviderCallWitness } from "../protocol-designer-v1-autonomous-adversarial-stabilization-01/provider-transport";
import { createRepairOfflineProvider } from "./offline-provider";

const missionRoot = path.resolve("validation/protocol-designer-v1-multi-scenario-live-causal-repair-01");
const evidenceRoot = path.resolve(process.env.NOXIA_OFFLINE_BROWSER_EVIDENCE_DIR ?? path.join(missionRoot, "browser-evidence"));
const port = Number(process.env.NOXIA_ADVERSARIAL_PORT ?? 5201);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("ADVERSARIAL_OFFLINE_PORT_INVALID");
const witnesses: ProviderCallWitness[] = [];
let replayFetch = createRepairOfflineProvider(witnesses);
let active: {scenarioId:string;turnId:string} | null = null;

/** Based on the existing long-horizon server: the only provider substitution is fetchImpl. */
export const adversarialOfflineBridge: Plugin = {
  name: "noxia-adversarial-offline-provider-transport",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = request.url?.split("?")[0] ?? "";
      if (url === "/__offline_campaign/launch") {
        const scenario = new URL(request.url!, `http://127.0.0.1:${port}`).searchParams.get("scenario") ?? "S1";
        if (!["S1","S2","S3","S4","S5"].includes(scenario)) { response.statusCode=400; response.end(); return; }
        active = {scenarioId:scenario,turnId:"1"}; replayFetch=createRepairOfflineProvider(witnesses);
        response.setHeader("content-type","text/html; charset=utf-8");
        response.end(`<html><body><script>localStorage.clear();location.replace('/protocol-designer/demo')</script></body></html>`); return;
      }
      if (!url.startsWith("/api/") && !url.startsWith("/__offline_campaign/")) return next();
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.setHeader("cache-control", "no-store");
      if (url === "/__offline_campaign/status" && request.method === "GET") {
        response.end(JSON.stringify({ provenance: "SYNTHETIC_CONTRACT_FIXTURE", active: active,
          providerWitnesses: witnesses.length, realProviderCalls: 0, scenarios: ["S1","S2","S3","S4","S5"] }));
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of request) {
        const bytes = Buffer.from(chunk);
        size += bytes.length;
        if (size > (url === "/__offline_campaign/receipt" ? 20_000_000 : 500_000)) { response.statusCode = 413; response.end("{}"); return; }
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
          active = {scenarioId: selection.scenarioId, turnId: selection.turnId};
          if (selection.turnId === "1") replayFetch = createRepairOfflineProvider(witnesses);
          response.end(JSON.stringify({ active: active, realProviderCalls: 0 }));
        } catch (error) {
          response.statusCode = 422;
          response.end(JSON.stringify({ error: String(error) }));
        }
        return;
      }
      if (url === "/__offline_campaign/receipt") {
        await mkdir(evidenceRoot,{recursive:true});
        await appendFile(path.join(evidenceRoot,"browser-receipts.jsonl"),JSON.stringify({at:new Date().toISOString(),active,body})+"\n");
        response.end(JSON.stringify({saved:true}));return;
      }
      if (url !== "/api/protocol-designer-bridge") {
        response.statusCode = 503;
        response.end(JSON.stringify({ error: { code: "OFFLINE_NO_OTHER_API_OR_PROVIDER" } }));
        return;
      }

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
  plugins: [react(), adversarialOfflineBridge, {
    name: "offline-evidence-receipts",
    transformIndexHtml() { return [{ tag:"script", injectTo:"body", children: `
      document.addEventListener('click', async (event) => {
        if (!event.target.closest('[data-offline-receipt]')) return;
        const response = await fetch('/__offline_campaign/receipt', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({visible:document.body.innerText,storage:Object.fromEntries(Object.entries(localStorage))})});
        event.target.textContent=response.ok ? 'Preuve enregistrée' : 'Échec de sauvegarde';
      });
      document.addEventListener('DOMContentLoaded',()=>{const b=document.createElement('button');b.textContent='Enregistrer la preuve offline';b.dataset.offlineReceipt='1';b.style='position:fixed;bottom:4px;right:4px;z-index:9999;background:white;color:black;border:1px solid;padding:4px';document.body.append(b)});
    ` }]; }
  }],
  define: { __NOXIA_BUILD_GIT_SHA__: JSON.stringify("offline-adversarial-campaign") },
  resolve: { alias: { "@": path.resolve("src"), "node:crypto": path.resolve("src/features/knowledge-engine/browser-crypto.ts") } },
  server: { host: "127.0.0.1", port, strictPort: true,
    headers: { "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://127.0.0.1:${port}; object-src 'none'; base-uri 'self'; form-action 'self'` },
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.provider-evidence.local/**",
      "**/.long-horizon-browser-evidence.local/**", `${evidenceRoot}/**`] },
  },
});
