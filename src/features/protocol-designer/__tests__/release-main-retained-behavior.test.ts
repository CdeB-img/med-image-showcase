import { describe, expect, it } from "vitest";
import { workingDraftPrecountFailureDiagnostic, durableGuardPublicBudget, durableGuardSessionRequestLimit } from "../../../../server/protocol-designer-durable-guard";

describe("bounded retention of main-only technical behavior", () => {
  it("retains the explicit 512 / three-dollar Production configuration without changing defaults or hard bound", () => {
    expect(durableGuardSessionRequestLimit({ NOXIA_PUBLIC_SESSION_REQUEST_LIMIT: "512" })).toBe(512);
    expect(durableGuardPublicBudget({ VERCEL_ENV: "production", NOXIA_PUBLIC_SOFT_STOP_USD: "3" })).toEqual({ absoluteHardCampaignBoundUsd: 6, measuredCostSoftStopUsd: 3 });
    expect(durableGuardSessionRequestLimit({})).toBe(8);
    expect(durableGuardPublicBudget({}).measuredCostSoftStopUsd).toBe(1);
  });
  it("preserves the precount diagnostic without leaking scientific enums or provider error text", () => {
    const secret = "PRIVATE_SCIENTIFIC_TEXT_NOT_FOR_LOGS";
    const result = workingDraftPrecountFailureDiagnostic({ generationProvider: "OPENAI", countStatus: 400,
      countBody: JSON.stringify({ error: { type: "invalid_request_error", code: "invalid_value", param: "text.format.schema", message: secret } }),
      countRequestBody: JSON.stringify({ model: "gpt-6.1-sol", input: secret, text: { format: { name: "continuous_working_draft", schema: { enum: [secret] } } } }),
      sessionKey: "synthetic-hash", admissionKey: "synthetic-hash" });
    expect(result).toMatchObject({ providerErrorCode: "invalid_value", providerErrorMessage: null, schemaIdentifier: "continuous_working_draft" });
    expect(result.requestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.schemaDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(result)).not.toContain(secret);
  });
  it("drops attacker-controlled error identifiers rather than echoing them", () => {
    const result = workingDraftPrecountFailureDiagnostic({ generationProvider: "OPENAI", countStatus: 400,
      countBody: JSON.stringify({ error: { type: "PRIVATE", code: "PRIVATE", param: "PRIVATE" } }), countRequestBody: "{}", sessionKey: "hash", admissionKey: "hash" });
    expect(result).toMatchObject({ providerErrorType: null, providerErrorCode: null, providerErrorParam: null });
  });
});
