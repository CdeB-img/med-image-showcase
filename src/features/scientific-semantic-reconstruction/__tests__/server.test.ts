import { beforeEach, describe, expect, it } from "vitest";
import { processScientificSemanticHttp, resetSemanticRateLimitForTests } from "../server";
import { FakeSemanticProvider, makeSemanticRequest } from "./fixtures";

const httpRequest = () => ({ method: "POST", headers: { "content-type": "application/json", host: "localhost" }, body: makeSemanticRequest(), ip: "127.0.0.44" });

describe("SEM-001 server and provider abstraction", () => {
  beforeEach(() => resetSemanticRateLimitForTests());

  it("runs reconstruction then independent critic", async () => {
    const provider = new FakeSemanticProvider();
    const response = await processScientificSemanticHttp(httpRequest(), { provider });
    expect(response.status).toBe(200);
    expect(provider.calls).toEqual(["RECONSTRUCT", "CRITIC"]);
    expect(response.body).toMatchObject({ mode: "LIVE_LLM", providerStatus: "AVAILABLE" });
  });

  it("returns explicit degraded mode when no provider is configured", async () => {
    const response = await processScientificSemanticHttp(httpRequest(), { provider: null });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ mode: "DEGRADED", providerStatus: "UNAVAILABLE", model: { status: "SEMANTIC_RECONSTRUCTION_DEGRADED" } });
  });

  it("does not simulate understanding after provider failure", async () => {
    const response = await processScientificSemanticHttp(httpRequest(), { provider: new FakeSemanticProvider(undefined, undefined, "CRITIC") });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ mode: "DEGRADED", providerStatus: "FAILED_CALL", model: { elements: [] } });
  });

  it("blocks sensitive content before any provider call", async () => {
    const provider = new FakeSemanticProvider();
    const request = httpRequest();
    request.body = makeSemanticRequest([{ messageId: "user-1", role: "USER", content: "Patient Jean Dupont né le 12/05/1970, comparer CT et IRM.", createdAt: "2026-08-11T10:00:00.000Z" }]);
    const response = await processScientificSemanticHttp(request, { provider });
    expect(response.status).toBe(422);
    expect(provider.calls).toEqual([]);
  });
});
