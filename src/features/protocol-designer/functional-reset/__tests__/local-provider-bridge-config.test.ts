import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { describe, expect, it, vi } from "vitest";
import { languageProjectionIdentityDigest } from "../../conversation-language-gateway";
import { SINGLE_ATTEMPT_FAIL_CLOSED, createCanaryCampaignPolicy, QUALIFIED_CAMPAIGN_MODELS } from "../../../../../server/protocol-designer-canary-policy";

vi.mock("vite", () => ({
  defineConfig: (configuration: unknown) => configuration,
  loadEnv: () => ({}),
}));
vi.mock("@vitejs/plugin-react-swc", () => ({ default: () => ({ name: "react-test-double" }) }));

const loadLocalBridgeConfiguration = () => import("../../../../../vite.config");

describe("P1-UX-RESTORE-01H-R — local provider bridge parity", () => {
  it("MULTI_SESSION_14: browser body cannot replace the immutable server campaign policy", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "noxia-campaign-browser-policy-"));
    try {
      const { localProductBridge } = await loadLocalBridgeConfiguration();
      const campaignPolicy = createCanaryCampaignPolicy({ campaignId: "server-owned", maxSessions: 5, measuredSoftStopUsd: 3,
        absoluteHardBoundUsd: 10, singleAttemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, allowedProviderModels: QUALIFIED_CAMPAIGN_MODELS,
        createdAt: "2026-09-15T00:00:00.000Z" });
      const sourceText = "A study remains pending.";
      const body = { apiVersion: "1.0.0", operation: "LANGUAGE_PROJECTION", projectionKind: "INPUT_TO_FRENCH",
        sourceText, sourceLanguageHint: "en", targetLanguage: "fr", translationContractVersion: "1.4.0",
        projectionIdentityDigest: languageProjectionIdentityDigest({ projectionKind: "INPUT_TO_FRENCH", sourceText,
          sourceLanguage: "en", targetLanguage: "fr", provider: "OPENAI", model: "gpt-5.6-luna", protectedOpaqueLiterals: [] }),
        observabilityContext: { sessionId: "s1", conversationId: "c1", turnId: "t1", clientRequestId: "r1", testSessionId: "offline" },
        campaignPolicy: { ...campaignPolicy, maxSessions: 100, absoluteHardBoundUsd: 100 }, campaignId: "client-owned" };
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ model: "gpt-5.6-luna", status: "completed", output_text: "{}",
        usage: { input_tokens: 1000, output_tokens: 100 } })));
      const plugin = localProductBridge({ apiKey: "synthetic", openAiApiKey: "synthetic", geminiModel: "gemini-3.5-flash-lite",
        openAiExtractionModel: "gpt-5.6-terra" }, root, { attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: campaignPolicy.campaignId, campaignPolicy }, fetchMock);
      const use = vi.fn();
      if (typeof plugin.configureServer !== "function") throw new Error("Expected middleware hook");
      await plugin.configureServer({ middlewares: { use } } as unknown as ViteDevServer);
      const request = { method: "POST", url: "/protocol-designer-bridge", async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)); } };
      const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
      await use.mock.calls[0][1](request, response, vi.fn());
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(readFileSync(path.join(root, "canary-server-owned", "campaign-policy.json"), "utf8"))).toEqual(campaignPolicy);
      const journal = readFileSync(path.join(root, "canary-server-owned", "protocol-designer-exchanges.jsonl"), "utf8");
      expect(journal).toContain("COMPLETED");
    } finally { rmSync(root, { recursive: true }); }
  });
  it("dry-run: the real local middleware applies recording/budget/policy and cannot fall through to another API", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "noxia-canary-local-dry-run-"));
    try {
      const { localProductBridge } = await loadLocalBridgeConfiguration();
      const sourceText = "A study remains pending.";
      const body = {
        apiVersion: "1.0.0", operation: "LANGUAGE_PROJECTION", projectionKind: "INPUT_TO_FRENCH",
        sourceText, sourceLanguageHint: "en", targetLanguage: "fr", translationContractVersion: "1.4.0",
        projectionIdentityDigest: languageProjectionIdentityDigest({ projectionKind: "INPUT_TO_FRENCH",
          sourceText, sourceLanguage: "en", targetLanguage: "fr", provider: "OPENAI", model: "gpt-5.6-luna", protectedOpaqueLiterals: [] }),
        observabilityContext: { sessionId: "s1", conversationId: "c1", turnId: "t1", clientRequestId: "r1", testSessionId: "dry-run" },
      };
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({
        id: "synthetic-local-response", model: "gpt-5.6-luna", status: "completed", output_text: "{}",
        usage: { input_tokens: 1_000, output_tokens: 100 },
      })));
      const plugin = localProductBridge({ apiKey: "synthetic", openAiApiKey: "synthetic",
        geminiModel: "gemini-3.5-flash-lite", openAiExtractionModel: "gpt-5.6-terra" }, root,
      { attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: "dry-run" }, fetchMock);
      const use = vi.fn();
      if (typeof plugin.configureServer !== "function") throw new Error("Expected middleware hook");
      await plugin.configureServer({ middlewares: { use } } as unknown as ViteDevServer);
      expect(use.mock.calls[0][0]).toBe("/api/");
      const middleware = use.mock.calls[0][1];
      const invoke = async (url: string, payload: unknown) => {
        const request = { method: "POST", url, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(payload)); } };
        const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
        const next = vi.fn();
        await middleware(request, response, next);
        expect(next).not.toHaveBeenCalled();
        return { status: response.statusCode, body: JSON.parse(response.end.mock.calls[0][0]) };
      };
      const result = await invoke("/protocol-designer-bridge", body);
      // This synthetic invalid translation is retained, not regenerated. The
      // existing language parser still rejects it after the guarded call.
      expect(result.status).toBe(503);
      expect(result.body.error.code).toBe("LANGUAGE_PROJECTION_PROVIDER_FAILURE");
      expect(result.body.observability.providerCalls).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const journal = readFileSync(path.join(root, "canary-dry-run", "protocol-designer-exchanges.jsonl"), "utf8");
      expect(journal).toContain("REQUEST_PREPARED");
      expect(journal).toContain("COMPLETED");
      expect((await invoke("/protocol-designer-bridge", body)).body.error.code).toBe("CANARY_LOGICAL_CALL_ALREADY_CONSUMED");
      expect((await invoke("/scientific-intake", body)).body.error.code).toBe("CANARY_OTHER_API_ROUTE_FORBIDDEN");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally { rmSync(root, { recursive: true }); }
  });
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

  it("selects the Azure destination from server configuration only", async () => {
    const { resolveLocalProductBridgeConfiguration } = await loadLocalBridgeConfiguration();
    expect(resolveLocalProductBridgeConfiguration({
      OPENAI_PROVIDER: "azure",
      AZURE_OPENAI_PROJECT_ENDPOINT: "https://noxia-01.services.ai.azure.com/api/projects/noxia-prod",
      AZURE_OPENAI_API_KEY: "dummy-azure-process-key",
      OPENAI_API_KEY: "dummy-openai-count-key",
    }, {})).toMatchObject({
      openAiApiKey: "dummy-azure-process-key",
      openAiCountApiKey: "dummy-openai-count-key",
      openAiTransport: {
        destination: "azure",
        responsesEndpoint: "https://noxia-01.services.ai.azure.com/api/projects/noxia-prod/openai/v1/responses",
      },
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
