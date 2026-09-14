import { providerModelPricing, PROVIDER_PRICING_SNAPSHOT_DATE } from "../src/features/protocol-designer/provider-call-observability.js";

export const SINGLE_ATTEMPT_FAIL_CLOSED = "SINGLE_ATTEMPT_FAIL_CLOSED" as const;
export type ProviderAttemptPolicy = typeof SINGLE_ATTEMPT_FAIL_CLOSED;
export const ABSOLUTE_HARD_CAMPAIGN_BOUND_USD = 6;
export const MEASURED_COST_SOFT_STOP_USD = 1;
export const CANARY_BUDGET_POLICY = Object.freeze({
  absoluteHardCampaignBoundUsd: ABSOLUTE_HARD_CAMPAIGN_BOUND_USD,
  measuredCostSoftStopUsd: MEASURED_COST_SOFT_STOP_USD,
});

// Published model ceilings, checked 2026-09-14. Deliberately NOT a byte/token
// heuristic: schemas and provider formatting are not fully countable locally.
// https://developers.openai.com/api/docs/models/gpt-5.6-luna
// https://developers.openai.com/api/docs/models/gpt-5.6-terra
// https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
const limits: Readonly<Record<string, { input: number; output: number }>> = {
  "gpt-5.6-luna": { input: 1_050_000, output: 128_000 },
  "gpt-5.6-terra": { input: 1_050_000, output: 128_000 },
  "gemini-3.5-flash-lite": { input: 1_048_576, output: 65_536 },
};
const unitsPerUsd = 1_000_000_000;
const ceilUnits = (usd: number) => Math.ceil(usd * unitsPerUsd);
export const addCanaryCosts = (a: number, b: number) => (ceilUnits(a) + ceilUnits(b)) / unitsPerUsd;
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const object = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const keysOnly = (v: Record<string, unknown>, keys: readonly string[]) => Object.keys(v).every((key) => keys.includes(key));

export class CanaryAdmissionError extends Error {
  constructor(readonly code: string) { super(code); this.name = "CanaryAdmissionError"; }
}

export type CanaryCallBound = Readonly<{
  model: string;
  provider: "OPENAI" | "GOOGLE_GEMINI";
  pricingSnapshotDate: string;
  inputTokenUpperBound: number;
  outputTokenUpperBound: number;
  inputBoundBasis: "DOCUMENTED_MODEL_CONTEXT_LIMIT";
  outputBoundBasis: "REQUEST_MAX_OUTPUT_INCLUDES_REASONING" | "DOCUMENTED_MODEL_OUTPUT_LIMIT";
  maximumInputRatePerMillionUsd: number;
  maximumOutputRatePerMillionUsd: number;
  upperBoundUsd: number;
}>;

/** Only the existing text-only, stateless, tool-free product payloads qualify.
 * No payload/model/prompt/effort is rewritten to force admission. Full-context
 * costing can deny a short Terra request: an exact input count is not invented.
 */
export const boundCanaryProviderCall = (endpoint: string, body: string): CanaryCallBound | null => {
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return null; }
  if (!object(payload)) return null;
  const openai = endpoint === "https://api.openai.com/v1/responses";
  const geminiMatch = /^https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/(gemini-3\.5-flash-lite):generateContent$/.exec(endpoint);
  if (!openai && !geminiMatch) return null;
  const model = openai ? payload.model : geminiMatch![1];
  if (typeof model !== "string" || (openai && !["gpt-5.6-luna", "gpt-5.6-terra"].includes(model))) return null;
  const pricing = providerModelPricing(model);
  const limit = limits[model];
  if (!pricing || !limit) return null;
  let output: number;
  if (openai) {
    if (!keysOnly(payload, ["model", "instructions", "input", "text", "reasoning", "max_output_tokens", "store", "service_tier"])
      || typeof payload.instructions !== "string" || typeof payload.input !== "string" || payload.store !== false
      || payload.service_tier !== "default"
      || !integer(payload.max_output_tokens) || payload.max_output_tokens === 0 || payload.max_output_tokens > limit.output) return null;
    output = payload.max_output_tokens;
  } else {
    if (!keysOnly(payload, ["systemInstruction", "contents", "generationConfig"])
      || !object(payload.systemInstruction) || !Array.isArray(payload.contents)) return null;
    const messages = [payload.systemInstruction, ...payload.contents];
    if (!messages.every((m) => object(m) && keysOnly(m, ["role", "parts"]) && Array.isArray(m.parts)
      && m.parts.every((p) => object(p) && keysOnly(p, ["text"]) && typeof p.text === "string"))) return null;
    // No external tools, explicit cache, media, n-candidates, priority or live API.
    const config = payload.generationConfig;
    if (config !== undefined && (!object(config) || !keysOnly(config, ["responseMimeType", "responseJsonSchema", "maxOutputTokens"]))) return null;
    const requested = object(config) ? config.maxOutputTokens : undefined;
    if (requested !== undefined && (!integer(requested) || requested === 0 || requested > limit.output)) return null;
    // Keep the full documented output ceiling even if a request asks for less;
    // do not assume a smaller visible-output cap also bounds hidden thinking.
    output = limit.output;
  }
  // OpenAI long-context premiums apply to the FULL request above 272K input.
  // Worst input class is a cache write, never a discounted cache hit.
  const inputRate = Math.max(pricing.inputPerMillionUsd, pricing.cachedInputPerMillionUsd,
    pricing.cacheWritePerMillionUsd ?? pricing.inputPerMillionUsd) * (openai ? 2 : 1);
  const outputRate = pricing.outputPerMillionUsd * (openai ? 1.5 : 1);
  return Object.freeze({
    model, provider: openai ? "OPENAI" : "GOOGLE_GEMINI", pricingSnapshotDate: PROVIDER_PRICING_SNAPSHOT_DATE,
    inputTokenUpperBound: limit.input, outputTokenUpperBound: output,
    inputBoundBasis: "DOCUMENTED_MODEL_CONTEXT_LIMIT",
    outputBoundBasis: openai ? "REQUEST_MAX_OUTPUT_INCLUDES_REASONING" : "DOCUMENTED_MODEL_OUTPUT_LIMIT",
    maximumInputRatePerMillionUsd: inputRate, maximumOutputRatePerMillionUsd: outputRate,
    upperBoundUsd: ceilUnits((limit.input * inputRate + output * outputRate) / 1_000_000) / unitsPerUsd,
  });
};

export const canaryBudgetAdmission = (committedCostUsd: number, bound: CanaryCallBound | null, measuredCostUsd: number) => {
  if (!Number.isFinite(committedCostUsd) || committedCostUsd < 0
    || !Number.isFinite(measuredCostUsd) || measuredCostUsd < 0 || measuredCostUsd > committedCostUsd) return "DENIED_UNKNOWN_CUMULATIVE_COST";
  // Operational stop on reconstructed usage cost, NOT a one-dollar hard cap.
  if (ceilUnits(measuredCostUsd) >= ceilUnits(MEASURED_COST_SOFT_STOP_USD)) return "DENIED_SOFT_STOP";
  if (!bound || !Number.isFinite(bound.upperBoundUsd) || bound.upperBoundUsd <= 0) return "DENIED_UNKNOWN_UPPER_BOUND";
  if (ceilUnits(committedCostUsd) + ceilUnits(bound.upperBoundUsd) > ceilUnits(ABSOLUTE_HARD_CAMPAIGN_BOUND_USD)) return "DENIED_HARD_BUDGET";
  return "ADMITTED";
};

/** Actual reported token quantities release the unused reservation. Cache
 * detail may be absent: retain the worst input-class charge as a separate
 * committed bound, while preserving the measured standard-price subtotal.
 * Missing usage never becomes a zero-dollar successful settlement.
 */
export const settleCanaryProviderCall = (bound: CanaryCallBound, responseBody: string) => {
  let response: unknown;
  try { response = JSON.parse(responseBody); } catch { return null; }
  if (!object(response)) return null;
  const openai = bound.provider === "OPENAI";
  const returnedModel = openai ? response.model : response.modelVersion;
  if (returnedModel !== undefined && (typeof returnedModel !== "string"
    || (returnedModel !== bound.model && !returnedModel.startsWith(`${bound.model}-`)))) return null;
  if (openai && response.status !== undefined && response.status !== "completed") return null;
  const usage = openai ? response.usage : response.usageMetadata;
  if (!object(usage)) return null;
  const input = openai ? usage.input_tokens : usage.promptTokenCount;
  const visibleOutput = openai ? usage.output_tokens : usage.candidatesTokenCount;
  const thoughts = openai ? 0 : usage.thoughtsTokenCount ?? 0;
  if (!integer(input) || !integer(visibleOutput) || !integer(thoughts)) return null;
  // For Gemini, absent thoughts are not proof of zero billable reasoning.
  // Prefer a complete total; otherwise require an explicit thoughts count.
  if (!openai && usage.totalTokenCount === undefined && usage.thoughtsTokenCount === undefined) return null;
  if (!openai && usage.totalTokenCount !== undefined && (!integer(usage.totalTokenCount)
    || usage.totalTokenCount < input + visibleOutput + thoughts)) return null;
  const output = !openai && integer(usage.totalTokenCount) ? usage.totalTokenCount - input : visibleOutput + thoughts;
  if (input > bound.inputTokenUpperBound || output > bound.outputTokenUpperBound) return null;
  const pricing = providerModelPricing(bound.model)!;
  const detail = object(usage.input_tokens_details) ? usage.input_tokens_details : {};
  const cached = openai ? detail.cached_tokens ?? 0 : usage.cachedContentTokenCount ?? 0;
  const written = openai ? detail.cache_write_tokens ?? 0 : 0;
  if (!integer(cached) || !integer(written) || cached + written > input) return null;
  const inputMultiplier = openai && input > 272_000 ? 2 : 1;
  const outputRate = pricing.outputPerMillionUsd * (openai && input > 272_000 ? 1.5 : 1);
  const measuredCostUsd = ((input - cached - written) * pricing.inputPerMillionUsd * inputMultiplier
    + cached * pricing.cachedInputPerMillionUsd * inputMultiplier
    + written * (pricing.cacheWritePerMillionUsd ?? pricing.inputPerMillionUsd) * inputMultiplier
    + output * outputRate) / 1_000_000;
  const committedCostUpperBoundUsd = ceilUnits((input * Math.max(pricing.inputPerMillionUsd,
    pricing.cacheWritePerMillionUsd ?? pricing.inputPerMillionUsd) * inputMultiplier + output * outputRate) / 1_000_000) / unitsPerUsd;
  return { inputTokens: input, billableOutputTokens: output, measuredCostUsd, committedCostUpperBoundUsd };
};

export const resolveCanaryExecution = (environment: Readonly<Record<string, string | undefined>>) => {
  const policy = environment.PROTOCOL_DESIGNER_LIVE_CANARY?.trim();
  const id = environment.PROTOCOL_DESIGNER_CANARY_ID?.trim();
  if (!policy && !id) return null;
  if (policy !== SINGLE_ATTEMPT_FAIL_CLOSED || !id || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id)) {
    throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK");
  }
  return { attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: id };
};
