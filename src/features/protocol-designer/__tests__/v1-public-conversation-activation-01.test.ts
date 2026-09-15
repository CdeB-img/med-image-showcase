import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PUBLIC_PROTOCOL_DESIGNER_BUDGET,
  PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT,
  PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT,
  admitPublicProtocolDesignerRequest,
  createPublicProtocolDesignerBudgetedFetch,
  publicProtocolDesignerGuardStateForTests,
  resetPublicProtocolDesignerGuardForTests,
} from "../../../../api/protocol-designer-public-guard";

const body = (sessionId = "public-session:1") => ({
  apiVersion: "1.0.0",
  observabilityContext: {
    sessionId,
    conversationId: "public-conversation:1",
    turnId: "turn:1",
    clientRequestId: "request:1",
    testSessionId: null,
  },
  conversation: { conversationId: "public-conversation:1" },
});
const headers = { "x-forwarded-for": "203.0.113.24" };

describe("public Standard conversation guards", () => {
  beforeEach(resetPublicProtocolDesignerGuardForTests);

  it("enforces the rolling client rate limit before provider transport", () => {
    for (let index = 0; index < PUBLIC_PROTOCOL_DESIGNER_RATE_LIMIT.requests; index += 1) {
      expect(admitPublicProtocolDesignerRequest({ headers, body: body(`session:${index}`), now: 1_000 })).toMatchObject({ admitted: true });
    }
    expect(admitPublicProtocolDesignerRequest({ headers, body: body("session:limited"), now: 1_000 })).toEqual({
      admitted: false, status: 429, code: "PUBLIC_RATE_LIMITED", message: "Limite temporaire atteinte.",
    });
  });

  it("binds a bounded request count to one session", () => {
    for (let index = 0; index < PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT; index += 1) {
      expect(admitPublicProtocolDesignerRequest({ headers, body: body(), now: index * 61_000 })).toMatchObject({ admitted: true });
    }
    expect(admitPublicProtocolDesignerRequest({ headers, body: body(), now: PUBLIC_PROTOCOL_DESIGNER_SESSION_REQUEST_LIMIT * 61_000 }))
      .toMatchObject({ admitted: false, status: 429, code: "PUBLIC_SESSION_LIMITED" });
  });

  it("uses qualified model bounds, settles usage, and denies before exceeding the hard session budget", async () => {
    const admitted = admitPublicProtocolDesignerRequest({ headers, body: body(), now: 1_000 });
    expect(admitted).toMatchObject({ admitted: true });
    if (!("sessionKey" in admitted)) throw new Error("admission failed");
    const provider = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "resp:terra", model: "gpt-5.6-terra", status: "completed",
        usage: { input_tokens: 1_050_000, output_tokens: 8_000, total_tokens: 1_058_000,
          input_tokens_details: { cached_tokens: 1_050_000 } },
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        responseId: "resp:gemini", modelVersion: "gemini-3.5-flash-lite",
        usageMetadata: { promptTokenCount: 500_000, cachedContentTokenCount: 500_000,
          candidatesTokenCount: 60_000, totalTokenCount: 560_000 },
      }), { status: 200 }));
    const guarded = createPublicProtocolDesignerBudgetedFetch(admitted.sessionKey, provider);
    await guarded("https://api.openai.com/v1/responses", {
      method: "POST",
      body: JSON.stringify({ model: "gpt-5.6-terra", instructions: "i", input: "x",
        text: {}, max_output_tokens: 8_000, store: false }),
    });
    expect(JSON.parse(String(provider.mock.calls[0]![1]!.body))).toMatchObject({ service_tier: "default" });
    await guarded("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST",
      body: JSON.stringify({ systemInstruction: { parts: [{ text: "i" }] }, contents: [{ role: "user", parts: [{ text: "x" }] }] }),
    });
    await expect(guarded("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST",
      body: JSON.stringify({ systemInstruction: { parts: [{ text: "i" }] }, contents: [{ role: "user", parts: [{ text: "x" }] }] }),
    })).rejects.toThrow("PUBLIC_PROVIDER_DENIED_HARD_BUDGET");
    expect(provider).toHaveBeenCalledTimes(2);
    expect(PUBLIC_PROTOCOL_DESIGNER_BUDGET).toEqual({ absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 1 });
    expect(publicProtocolDesignerGuardStateForTests("public-session:1")).toMatchObject({ providerGateClosed: true });
  });

  it("fails closed on an unqualified provider payload", async () => {
    const admitted = admitPublicProtocolDesignerRequest({ headers, body: body(), now: 1_000 });
    if (!("sessionKey" in admitted)) throw new Error("admission failed");
    const provider = vi.fn<typeof fetch>();
    await expect(createPublicProtocolDesignerBudgetedFetch(admitted.sessionKey, provider)("https://example.org/provider", {
      method: "POST", body: "{}",
    })).rejects.toThrow("PUBLIC_PROVIDER_DENIED_UNKNOWN_UPPER_BOUND");
    expect(provider).not.toHaveBeenCalled();
  });
});
