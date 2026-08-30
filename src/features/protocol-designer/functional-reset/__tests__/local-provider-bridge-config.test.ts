import { readFileSync } from "node:fs";
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
});
