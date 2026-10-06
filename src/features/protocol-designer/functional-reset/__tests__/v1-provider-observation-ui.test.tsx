import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderDiagnosticWorkspace as render } from "./diagnostic-workspace-test-render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { ProductBridgeClientError } from "../../product-bridge-client";
import type { ProductBridgeRequest } from "../../product-bridge";
import { emptyProviderTokenUsage, materializeProviderCallRecord, providerCallRequestObservability } from "../../provider-call-observability";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import { COLCHICINE_03A_INITIAL, makeFunctionalResetBridgeResponse, makeFunctionalResetContribution, makeNativeConversationBridgeResponse } from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ bridge: vi.fn(), language: vi.fn() }));
vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>(),
  requestProtocolDesignerBridge: runtime.bridge,
  requestConversationLanguageProjection: runtime.language,
}));
const stored = () => JSON.parse(localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;
const submit = async (text: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};
const call = (id: string, purpose: "LANGUAGE_PROJECTION" | "CONVERSATION_REALIZATION" | "PERSISTENT_DELTA") => materializeProviderCallRecord({
  provider: "OPENAI", modelRequested: "gpt-5.6-luna", modelReturned: "gpt-5.6-luna",
  instrumentation: { context: { sessionId: null, conversationId: null, turnId: id, clientRequestId: id, testSessionId: "offline-ui" },
    purpose, reasoningEffort: "low", retryIndex: 0, retryReason: null, onRecord: () => {} },
  usage: { ...emptyProviderTokenUsage(), inputTokens: 100, outputTokens: 100 }, latencyMs: 20,
  status: "SUCCEEDED", failureReason: null, providerRequestId: id, providerResponseId: id,
  startedAt: "2026-09-14T12:00:00.000Z", completedAt: "2026-09-14T12:00:00.020Z",
});
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

describe("Provider observations survive Standard handler exits", () => {
  beforeEach(() => {
    localStorage.clear();
    runtime.bridge.mockReset();
    runtime.language.mockReset();
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("NO_NETWORK_ALLOWED"); }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it.each(["LANGUAGE_PROJECTION", "PERSISTENT_DELTA"] as const)("preserves a paid %s response rejected before the normal trace append", async (purpose) => {
    const observed = call(`failed:${purpose}`, purpose);
    const error = new ProductBridgeClientError("LANGUAGE_PROJECTION_CONTRACT_FAILED", "Rejected recorded response", null,
      providerCallRequestObservability([observed]));
    if (purpose === "LANGUAGE_PROJECTION") runtime.language.mockRejectedValue(error);
    else runtime.bridge.mockRejectedValue(error);
    renderDemo();
    await submit(purpose === "LANGUAGE_PROJECTION"
      ? "I want to create a scientific study to compare two treatment strategies."
      : "Je veux créer une étude pour comparer deux stratégies thérapeutiques.");
    await waitFor(() => expect(stored().bridgeTraces.flatMap((trace) => trace.providerCallRecords ?? [])).toEqual([observed]));
    expect(stored().project).toBeNull();
    expect(stored().bridgeTraces.at(-1)).toMatchObject({ cumulativeSessionCostUsd: observed.estimatedCostUsd, cumulativeSessionCostIncomplete: false });
    if (purpose === "LANGUAGE_PROJECTION") expect(runtime.bridge).not.toHaveBeenCalled();
  });

  it("adds an explicit post-adoption conversation receipt once, without automatic continuation", async () => {
    const extraction = call("first-extraction", "PERSISTENT_DELTA");
    const how = call("after-confirmation", "CONVERSATION_REALIZATION");
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      if (request.currentProject) {
        const response = makeNativeConversationBridgeResponse(request);
        return { ...response, observability: { ...response.observability, calls: 1, providerCalls: [how] } };
      }
      const contribution = makeFunctionalResetContribution(request.conversation.turns);
      const response = makeFunctionalResetBridgeResponse(request.conversation.turns, contribution);
      return { ...response, observability: { ...response.observability, calls: 1, providerCalls: [extraction] } };
    });
    renderDemo();
    await submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
    await waitFor(()=>expect(stored().project?.revision).toBe(1));
    expect(runtime.bridge).toHaveBeenCalledTimes(1);
    expect(stored().bridgeTraces.flatMap(trace=>trace.providerCallRecords ?? [])).toEqual([extraction]);
    await submit("Explique la suite sans modifier le projet.");
    await waitFor(() => expect(stored().bridgeTraces.flatMap((trace) => trace.providerCallRecords ?? [])).toContainEqual(how));
    expect(runtime.bridge).toHaveBeenCalledTimes(2);
    expect(stored().bridgeTraces.at(-1)?.providerCallRecords).toEqual([how]);
    expect(stored().bridgeTraces.at(-1)).toMatchObject({
      cumulativeSessionCostUsd: Number((extraction.estimatedCostUsd! + how.estimatedCostUsd!).toFixed(10)),
      cumulativeSessionCostIncomplete: false,
    });
  });
});
