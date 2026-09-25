import { describe, expect, it, vi } from "vitest";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import { durableGuardPublicBudget, durableGuardSessionRequestLimit } from "../../../../server/protocol-designer-durable-guard";
import { canaryBudgetAdmission, type CanaryCallBound } from "../../../../server/protocol-designer-canary-policy";

describe("public durable session-limit configuration", () => {
  it("keeps the Production-compatible default when the environment is unset", () => {
    expect(durableGuardSessionRequestLimit({})).toBe(8);
  });

  it("accepts an environment-scoped Preview limit", () => {
    expect(durableGuardSessionRequestLimit({ NOXIA_PUBLIC_SESSION_REQUEST_LIMIT: "16" })).toBe(16);
  });

  it.each(["0", "-1", "16.5", "not-a-number"])("fails closed for invalid value %s", (value) => {
    expect(() => durableGuardSessionRequestLimit({ NOXIA_PUBLIC_SESSION_REQUEST_LIMIT: value }))
      .toThrow("PUBLIC_SESSION_LIMIT_CONFIGURATION_INVALID");
  });
});

describe("Preview-only public soft stop", () => {
  const preview = { VERCEL_ENV: "preview", NOXIA_PREVIEW_PUBLIC_SOFT_STOP_USD: "3" };
  const bound = { upperBoundUsd: 0.27877 } as CanaryCallBound;
  it("keeps Production and unconfigured Preview at the existing one-dollar stop", () => {
    expect(durableGuardPublicBudget({})).toEqual({ absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 1 });
    expect(durableGuardPublicBudget({ VERCEL_ENV: "production", NOXIA_PREVIEW_PUBLIC_SOFT_STOP_USD: "3" }))
      .toEqual({ absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 1 });
    expect(durableGuardPublicBudget({ VERCEL_ENV: "preview" }).measuredCostSoftStopUsd).toBe(1);
  });
  it("admits the same conserved ledger under Preview policy without releasing reservations", () => {
    const ledger = { measured: 1.065185, committed: 1.49809 };
    expect(canaryBudgetAdmission(ledger.committed, bound, ledger.measured, durableGuardPublicBudget({})))
      .toBe("DENIED_SOFT_STOP");
    const budget = durableGuardPublicBudget(preview);
    expect(budget).toEqual({ absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 3 });
    expect(canaryBudgetAdmission(ledger.committed, bound, ledger.measured, budget)).toBe("ADMITTED");
    expect(ledger).toEqual({ measured: 1.065185, committed: 1.49809 });
  });
  it("rejects an invalid Preview override before dispatch", () => {
    expect(() => durableGuardPublicBudget({ ...preview, NOXIA_PREVIEW_PUBLIC_SOFT_STOP_USD: "6" }))
      .toThrow("PUBLIC_PREVIEW_SOFT_STOP_CONFIGURATION_INVALID");
  });
});

describe("public handler durable-store boundary", () => {
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
