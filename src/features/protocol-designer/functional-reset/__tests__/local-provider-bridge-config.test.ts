import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { describe, expect, it, vi } from "vitest";

vi.mock("vite", () => ({
  defineConfig: (configuration: unknown) => configuration,
  loadEnv: () => ({}),
}));
vi.mock("@vitejs/plugin-react-swc", () => ({ default: () => ({ name: "react-test-double" }) }));

const loadLocalBridgeConfiguration = () => import("../../../../../vite.config");

describe("P1-UX-RESTORE-01H-R — local provider bridge parity", () => {
  it("passes the existing Gemini and OpenAI server-side configuration to the governed bridge", async () => {
    const {
      executeLocalProductBridgeRequest,
      resolveLocalProductBridgeConfiguration,
    } = await loadLocalBridgeConfiguration();
    const configuration = resolveLocalProductBridgeConfiguration({
      GEMINI_API_KEY: "dummy-gemini-process-key",
      OPENAI_API_KEY: "dummy-openai-process-key",
      GEMINI_MODEL: "dummy-gemini-process-model",
      OPENAI_EXTRACTION_MODEL: "dummy-openai-process-model",
    }, {
      GEMINI_API_KEY: "dummy-gemini-file-key",
      OPENAI_API_KEY: "dummy-openai-file-key",
    });
    const executor = vi.fn(async () => ({ status: 200, body: { ok: true } }));

    await executeLocalProductBridgeRequest({ request: "dummy" }, configuration, executor);

    expect(configuration).toEqual({
      apiKey: "dummy-gemini-process-key",
      openAiApiKey: "dummy-openai-process-key",
      geminiModel: "dummy-gemini-process-model",
      openAiExtractionModel: "dummy-openai-process-model",
    });
    expect(executor).toHaveBeenCalledOnce();
    expect(executor).toHaveBeenCalledWith({
      body: { request: "dummy" },
      apiKey: "dummy-gemini-process-key",
      openAiApiKey: "dummy-openai-process-key",
      geminiModel: "dummy-gemini-process-model",
      openAiExtractionModel: "dummy-openai-process-model",
    });
  });

  it("keeps missing provider configuration explicit and fail-closed", async () => {
    const { resolveLocalProductBridgeConfiguration } = await loadLocalBridgeConfiguration();
    expect(resolveLocalProductBridgeConfiguration({}, {})).toEqual({
      apiKey: null,
      openAiApiKey: null,
      geminiModel: null,
      openAiExtractionModel: null,
    });
  });

  it("keeps provider secrets outside client-facing environment contracts", () => {
    const configSource = readFileSync("vite.config.ts", "utf8");
    const workspaceSource = readFileSync(
      "src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx",
      "utf8",
    );

    expect(configSource).not.toMatch(/VITE_(?:OPENAI|GEMINI)_API_KEY/u);
    expect(workspaceSource).not.toMatch(/(?:OPENAI|GEMINI)_API_KEY|VITE_(?:OPENAI|GEMINI)/u);
  });

  it("denies HTTP access to the local private evidence store, including custom roots", async () => {
    const { default: configuration } = await loadLocalBridgeConfiguration();
    if (typeof configuration !== "function") throw new Error("Expected Vite config function");
    const config = await configuration({ command: "serve", mode: "test" });
    expect(config.server?.fs?.deny).toContain("**/.provider-evidence.local/**");
    expect(config.server?.fs?.deny).toContain(`${process.cwd()}/.provider-evidence.local/**`);
    expect(config.server?.fs?.deny).toEqual(expect.arrayContaining([".env", ".env.*", "*.{crt,pem}"]));
  });

  it("denies the offline browser evidence store at its default and custom roots", async () => {
    try {
      vi.stubEnv("NOXIA_OFFLINE_BROWSER_EVIDENCE_DIR", "");
      vi.resetModules();
      const defaults = (await import("../../../../../scripts/v1-long-horizon-offline-browser.config")).default;
      if (!defaults || typeof defaults !== "object") throw new Error("Expected offline config object");
      expect(defaults.envDir).toMatch(/noxia-offline-no-env-/u);
      expect(defaults.server?.fs?.deny).toEqual(expect.arrayContaining([
        ".env", ".env.*", "*.{crt,pem}", "**/.provider-evidence.local/**",
        "**/.long-horizon-browser-evidence.local/**", `${process.cwd()}/.long-horizon-browser-evidence.local/**`,
      ]));
      vi.stubEnv("NOXIA_OFFLINE_BROWSER_EVIDENCE_DIR", "/private/tmp/noxia-custom-offline-evidence");
      vi.resetModules();
      const custom = (await import("../../../../../scripts/v1-long-horizon-offline-browser.config")).default;
      if (!custom || typeof custom !== "object") throw new Error("Expected offline config object");
      expect(custom.server?.fs?.deny).toContain("/private/tmp/noxia-custom-offline-evidence/**");
      expect(custom.server?.fs?.deny).toContain("**/.long-horizon-browser-evidence.local/**");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("preserves the handler's invalid-JSON 400 response while recording a bounded raw request", async () => {
    const evidenceRoot = mkdtempSync(path.join(tmpdir(), "noxia-invalid-offline-request-"));
    try {
      vi.stubEnv("NOXIA_OFFLINE_BROWSER_EVIDENCE_DIR", evidenceRoot);
      vi.resetModules();
      const { offlineBridge } = await import("../../../../../scripts/v1-long-horizon-offline-browser.config");
      if (typeof offlineBridge.configureServer !== "function") throw new Error("Expected offline server hook");
      const use = vi.fn();
      await offlineBridge.configureServer({ middlewares: { use } } as unknown as ViteDevServer);
      const handler = use.mock.calls[0][1] as (request: IncomingMessage, response: ServerResponse) => Promise<void>;
      const request = {
        method: "POST", url: "/protocol-designer-bridge", headers: { "content-type": "application/json" },
        async *[Symbol.asyncIterator]() { yield Buffer.from("{invalid"); },
      } as unknown as IncomingMessage;
      const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
      await handler(request, response as unknown as ServerResponse);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.end.mock.calls[0][0])).toMatchObject({ error: { code: "INVALID_REQUEST" } });
      const capture = JSON.parse(readFileSync(path.join(evidenceRoot, "browser-http-exchanges.jsonl"), "utf8"));
      expect(capture).toMatchObject({
        request: null, requestParseStatus: "INVALID_JSON", requestRawBody: "{invalid",
        responseStatus: 400, providerWitnesses: [], realProviderCalls: 0,
      });
    } finally {
      vi.unstubAllEnvs();
      rmSync(evidenceRoot, { recursive: true });
    }
  });
});
