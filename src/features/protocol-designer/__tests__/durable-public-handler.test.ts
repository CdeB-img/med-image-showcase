import { describe, expect, it, vi } from "vitest";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import { DurablePublicGuardError, durableGuardSessionRequestLimit, type PublicProtocolDesignerDurableGuard } from "../../../../server/protocol-designer-durable-guard";

describe("public durable session-limit configuration", () => {
  it("uses the long-session safety limit when the environment is unset", () => {
    expect(durableGuardSessionRequestLimit({})).toBe(512);
  });

  it("accepts an explicit long-session limit", () => {
    expect(durableGuardSessionRequestLimit({ NOXIA_PUBLIC_SESSION_REQUEST_LIMIT: "512" })).toBe(512);
  });

  it.each(["0", "-1", "16.5", "not-a-number"])("fails closed for invalid value %s", (value) => {
    expect(() => durableGuardSessionRequestLimit({ NOXIA_PUBLIC_SESSION_REQUEST_LIMIT: value }))
      .toThrow("PUBLIC_SESSION_LIMIT_CONFIGURATION_INVALID");
  });
});

describe("public handler durable-store boundary", () => {
  it("reports a session-limit refusal as a limit rather than a service outage", async () => {
    let status = 0;
    let body: unknown;
    const response: ApiResponse = {
      setHeader() {},
      status(value) { status = value; return this; },
      json(value) { body = value; },
    };
    const provider = vi.fn<typeof fetch>();
    const durableGuard: PublicProtocolDesignerDurableGuard = {
      prepareRequest: async () => { throw new DurablePublicGuardError("PUBLIC_SESSION_LIMITED", 429); },
      createBudgetedFetch: () => provider,
      completeRequest: async () => {},
      close: async () => {},
    };
    await handleProtocolDesignerBridge({
      method: "POST",
      headers: { "content-type": "application/json", host: "noxia-imagerie.fr", origin: "https://noxia-imagerie.fr" },
      body: { observabilityContext: { sessionId: "SYNTHETIC_SESSION", clientRequestId: "request-1" } },
    }, response, { NODE_ENV: "production", OPENAI_API_KEY: "LOCAL_SYNTHETIC_NOT_DISPATCHED" },
    { fetchImpl: provider, durableGuard });
    expect(status).toBe(429);
    expect(body).toMatchObject({ error: { code: "PUBLIC_SESSION_LIMITED", message: "Limite de session atteinte." } });
    expect(provider).not.toHaveBeenCalled();
  });

  it("fails closed before provider dispatch when no durable store is configured", async () => {
    let status = 0;
    let body: unknown;
    const response: ApiResponse = {
      setHeader() {},
      status(value) { status = value; return this; },
      json(value) { body = value; },
    };
    const provider = vi.fn<typeof fetch>();
    await handleProtocolDesignerBridge({
      method: "POST",
      headers: { "content-type": "application/json", host: "noxia-imagerie.fr", origin: "https://noxia-imagerie.fr" },
      body: {
        apiVersion: "1.0.0",
        observabilityContext: {
          sessionId: "SYNTHETIC_DURABLE_BOUNDARY",
          conversationId: "SYNTHETIC_DURABLE_BOUNDARY",
          turnId: "turn-1",
          clientRequestId: "request-1",
          testSessionId: "LOCAL_SYNTHETIC",
        },
      },
    }, response, {
      NODE_ENV: "production",
      OPENAI_API_KEY: "LOCAL_SYNTHETIC_NOT_DISPATCHED",
      VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA",
      VITE_AUTONOMOUS_PROJECT_BUILD: "ON",
    }, { fetchImpl: provider });
    expect(status).toBe(503);
    expect(body).toMatchObject({ error: { code: "PUBLIC_DURABLE_STORE_UNAVAILABLE" } });
    expect(provider).not.toHaveBeenCalled();
  });
});
