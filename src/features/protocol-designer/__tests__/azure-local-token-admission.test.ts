import { describe, expect, it } from "vitest";
import { boundPublicProviderCall, AZURE_LOCAL_INPUT_POLICY } from "../../../../server/protocol-designer-local-token-admission";
import { boundCanaryProviderCall, canaryBudgetAdmission, settleCanaryProviderCall, settleKnownIncompleteProviderUsage } from "../../../../server/protocol-designer-canary-policy";
import { buildOpenAITerraConversationPayload } from "../../../../api/protocol-designer-openai-extraction-provider";
import { prepareWorkingDraftRequest } from "../functional-reset/continuous-project-build";
import { logicalDigest } from "../../knowledge-engine/canonical";
import type { ProductBridgeRequest } from "../product-bridge";

const endpoint = "https://synthetic.services.ai.azure.com/api/projects/qualification/openai/v1/responses";
const payload = (input = "Texte synthétique sans donnée personnelle.") => ({ model: "gpt-6-sol",
  instructions: "Instructions synthétiques.", input, store: false, service_tier: "default", max_output_tokens: 24_000 });
const bound = (input?: string) => boundPublicProviderCall(endpoint, JSON.stringify(payload(input)))!;

describe("Azure local admission without a second provider", () => {
  it("is deterministic, includes Unicode and special-token-looking strings as ordinary text", () => {
    const text = "Été — 心臓 🫀 <|endoftext|>";
    expect(bound(text)).toEqual(bound(text));
    expect(bound(text)).toMatchObject({ inputAdmissionPolicy: AZURE_LOCAL_INPUT_POLICY,
      inputBoundBasis: "LOCAL_CONSERVATIVE_ESTIMATE", contextTokenLimit: 1_050_000,
      outputTokenUpperBound: 24_000 });
    expect(bound(text).inputTokenUpperBound).toBeLessThanOrEqual(922_000);
    expect(bound(text).localEstimatedInputTokens).toBeGreaterThan(0);
    expect(bound(text).inputTokenUpperBound).toBeGreaterThan(bound(text).localEstimatedInputTokens!);
    expect(bound(text).inputTokenUpperBound).toBe(2 * Buffer.byteLength(JSON.stringify(payload(text))) + 8192);
  });

  it("includes the entire schema and enum, never only the visible user input", () => {
    const plain = payload();
    const rich = { ...plain, text: { format: { type: "json_schema", strict: true,
      schema: { type: "string", enum: ["synthetic quote ".repeat(1000)] } } } };
    expect(boundPublicProviderCall(endpoint, JSON.stringify(rich))!.inputTokenUpperBound)
      .toBeGreaterThan(boundPublicProviderCall(endpoint, JSON.stringify(plain))!.inputTokenUpperBound);
  });

  it.each(["unknown", "gpt-5.6-luna"])("denies an unqualified Azure model %s", model => {
    expect(boundPublicProviderCall(endpoint, JSON.stringify({ ...payload(), model }))).toBeNull();
  });

  it("retains the historical Sol identity for receipts and one-line binding rollback", () => {
    expect(boundPublicProviderCall(endpoint, JSON.stringify({ ...payload(), model: "gpt-5.6-sol" })))
      .toMatchObject({ model: "gpt-5.6-sol" });
  });

  it("denies excessive context, unknown shapes, references, tools and media before dispatch", () => {
    expect(boundPublicProviderCall(endpoint, JSON.stringify(payload("x".repeat(530_000))))).toBeNull();
    for (const change of [{ tools: [] }, { previous_response_id: "synthetic" }, { input: [{ type: "input_image" }] },
      { model: null }, { max_output_tokens: 128_001 }]) {
      expect(boundPublicProviderCall(endpoint, JSON.stringify({ ...payload(), ...change }))).toBeNull();
    }
    expect(boundPublicProviderCall(endpoint, "malformed")).toBeNull();
  });

  it("retains soft stop, hard budget and unknown-ledger denials", () => {
    const reservation = bound();
    expect(canaryBudgetAdmission(0, reservation, 0)).toBe("ADMITTED");
    expect(canaryBudgetAdmission(1, reservation, 1)).toBe("DENIED_SOFT_STOP");
    expect(canaryBudgetAdmission(6, reservation, 0)).toBe("DENIED_HARD_BUDGET");
    expect(canaryBudgetAdmission(NaN, reservation, 0)).toBe("DENIED_UNKNOWN_CUMULATIVE_COST");
    expect(canaryBudgetAdmission(0, null, 0)).toBe("DENIED_UNKNOWN_UPPER_BOUND");
  });

  it("reconciles actual Azure usage, not the estimate; invalid usage never releases reservation", () => {
    const reservation = bound();
    const response = { model: reservation.model, status: "completed", usage: {
      input_tokens: 1000, output_tokens: 100, input_tokens_details: { cached_tokens: 0 } } };
    expect(settleCanaryProviderCall(reservation, JSON.stringify(response))).toMatchObject({
      inputTokens: 1000, billableOutputTokens: 100, measuredCostUsd: 0.003, committedCostUpperBoundUsd: 0.0035 });
    for (const change of [{ usage: null }, { status: "incomplete", incomplete_details: { reason: "content_filter" } },
      { model: "unknown" }, { usage: { input_tokens: reservation.inputTokenUpperBound + 1, output_tokens: 1 } },
      { usage: { input_tokens: 1, output_tokens: 24_001 } }]) {
      expect(settleCanaryProviderCall(reservation, JSON.stringify({ ...response, ...change }))).toBeNull();
    }
  });

  it("accounts for known incomplete usage without approving an incomplete result", () => {
    const reservation = bound();
    const incomplete = { model: reservation.model, status: "incomplete", incomplete_details: { reason: "content_filter" },
      usage: { input_tokens: 6340, output_tokens: 10238, input_tokens_details: { cached_tokens: 0 } } };
    expect(settleCanaryProviderCall(reservation, JSON.stringify(incomplete))).toBeNull();
    expect(settleKnownIncompleteProviderUsage(reservation, JSON.stringify(incomplete))).toMatchObject({
      inputTokens: 6340, billableOutputTokens: 10238,
    });
    expect(settleKnownIncompleteProviderUsage(reservation, JSON.stringify({ ...incomplete, usage: null }))).toBeNull();
    expect(settleKnownIncompleteProviderUsage(reservation, JSON.stringify({ ...incomplete, status: "completed" }))).toBeNull();
    expect(settleKnownIncompleteProviderUsage(reservation, JSON.stringify({ ...incomplete, model: "unknown" }))).toBeNull();
  });

  it("settles a GPT-6 long-context usage with the governed premium", () => {
    const reservation = boundCanaryProviderCall(endpoint, JSON.stringify(payload()), 273_000)!;
    expect(settleCanaryProviderCall(reservation, JSON.stringify({ model: "gpt-6-sol", status: "completed",
      usage: { input_tokens: 273_000, output_tokens: 100, input_tokens_details: { cached_tokens: 0 } } })))
      .toMatchObject({ measuredCostUsd: 1.0935, committedCostUpperBoundUsd: 1.3665 });
  });

  it.each(["short", "rich"])("admits unchanged real Conversation/Working Draft builders for synthetic %s input", (size) => {
    // Committed fixture is deliberately synthetic; exact human text stays out of new source/logs.
    const input = size === "short" ? "Étude observationnelle synthétique chez des adultes." :
      "Étude observationnelle synthétique chez des adultes. " + "Critère synthétique distinct à préciser. ".repeat(24);
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", currentProject: null, evaluatePersistentDelta: false,
      prepareWorkingDraft: true, workingDraftScientificSource: { kind: "BOUND_USER_TURN", sourceUserTurnId: "u1",
        sourceResponseTurnId: "a1", sourceDigest: logicalDigest(input) },
      conversation: { conversationId: "LOCAL_SYNTHETIC", language: "fr", turns: [
        { turnId: "u1", role: "USER", content: input }, { turnId: "a1", role: "NOXIA", content: "Proposition synthétique non adoptée." },
      ] } };
    const before = JSON.stringify(request);
    const packet = prepareWorkingDraftRequest(request);
    for (const workingDraft of [false, true]) {
      const body = { ...buildOpenAITerraConversationPayload(workingDraft ? packet : { instruction: packet.instruction, context: packet.context }),
        model: "gpt-6-sol", max_output_tokens: workingDraft ? 24_000 : 8000 };
      const reservation = boundPublicProviderCall(endpoint, JSON.stringify(body));
      expect(reservation).not.toBeNull();
      expect(canaryBudgetAdmission(0, reservation, 0)).toBe("ADMITTED");
      expect(JSON.stringify(request)).toBe(before);
    }
  });
});
