import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductBridgeClientError, requestProtocolDesignerBridge } from "../../product-bridge-client";

afterEach(() => vi.unstubAllGlobals());

const request = { conversation: { conversationId: "synthetic-conversation", language: "fr" as const,
  turns: [{ turnId: "u1", role: "USER" as const, content: "Évaluer l'activité sportive", createdAt: "2026-09-29T00:00:00Z" }] },
  currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true };

describe("bounded Working Draft collision diagnostic transport", () => {
  it("retains only validated identifiers and the internal code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: {
      code: "WORKING_DRAFT_PREPARATION_FAILED", message: "Échec de préparation",
      details: ["WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION"],
      workingDraftDiagnostic: { contract: "WORKING_DRAFT_ARBITRATION_COLLISION_DIAGNOSTIC",
        explicitDecisionId: "o2", arbitrationId: "arb-sport", atomBindingStatus: "UNSELECTED_OPTION" },
    } }), { status: 422 })));
    await expect(requestProtocolDesignerBridge(request)).rejects.toMatchObject({
      code: "WORKING_DRAFT_PREPARATION_FAILED", preparationFailureCode: "WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION",
      preparationFailureDiagnostic: { explicitDecisionId: "o2", arbitrationId: "arb-sport", atomBindingStatus: "UNSELECTED_OPTION" },
    } satisfies Partial<ProductBridgeClientError>);
  });

  it("rejects an unbounded or text-bearing identifier", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: {
      code: "WORKING_DRAFT_PREPARATION_FAILED", details: ["WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION"],
      workingDraftDiagnostic: { contract: "WORKING_DRAFT_ARBITRATION_COLLISION_DIAGNOSTIC",
        explicitDecisionId: "Texte scientifique\nconfidentiel", arbitrationId: "arb-sport", atomBindingStatus: "UNSELECTED_OPTION" },
    } }), { status: 422 })));
    try { await requestProtocolDesignerBridge(request); }
    catch (error) {
      expect(error).toBeInstanceOf(ProductBridgeClientError);
      expect((error as ProductBridgeClientError).preparationFailureDiagnostic).toBeNull();
      return;
    }
    throw new Error("EXPECTED_BRIDGE_FAILURE");
  });
});
