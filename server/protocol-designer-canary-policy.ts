import { createHash } from "node:crypto";
import { stableStringify } from "../src/features/knowledge-engine/canonical.js";
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

export type CanaryCampaignPolicy = Readonly<{
  campaignId: string;
  maxSessions: number;
  measuredSoftStopUsd: number;
  absoluteHardBoundUsd: number;
  singleAttemptPolicy: typeof SINGLE_ATTEMPT_FAIL_CLOSED;
  allowedProviderModels: readonly string[];
  createdAt: string;
  exactInputCounting?: Readonly<{ maxInputTokens: number; maxGenerationAttempts: number; maxTokenCountRequests: number; maxProviderHttpRequests: number }>;
  policyDigest: string;
}>;
export const QUALIFIED_CAMPAIGN_MODELS = Object.freeze(["gpt-5.6-luna", "gpt-5.6-terra", "gemini-3.5-flash-lite"]);
const policyHash = (value: unknown) => createHash("sha256").update(stableStringify(value)).digest("hex");
const campaignIdValid = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value);

/** Explicit local experimental envelope; these ceilings do not change the
 * historical canary or the normal product defaults. Never read browser data. */
export const createCanaryCampaignPolicy = (input: Omit<CanaryCampaignPolicy, "policyDigest">): CanaryCampaignPolicy => {
  if (!object(input) || !keysOnly(input, ["campaignId", "maxSessions", "measuredSoftStopUsd", "absoluteHardBoundUsd", "singleAttemptPolicy", "allowedProviderModels", "createdAt", "exactInputCounting"])
    || !campaignIdValid(input.campaignId) || !integer(input.maxSessions) || input.maxSessions < 1 || input.maxSessions > 5
    || !Number.isFinite(input.measuredSoftStopUsd) || input.measuredSoftStopUsd <= 0 || input.measuredSoftStopUsd > 4
    || !Number.isFinite(input.absoluteHardBoundUsd) || input.absoluteHardBoundUsd <= 0 || input.absoluteHardBoundUsd > 10
    || input.measuredSoftStopUsd > input.absoluteHardBoundUsd || input.singleAttemptPolicy !== SINGLE_ATTEMPT_FAIL_CLOSED
    || typeof input.createdAt !== "string" || !Number.isFinite(Date.parse(input.createdAt))
    || new Date(input.createdAt).toISOString() !== input.createdAt
    || !Array.isArray(input.allowedProviderModels) || !input.allowedProviderModels.length
    || new Set(input.allowedProviderModels).size !== input.allowedProviderModels.length
    || !input.allowedProviderModels.every((model) => QUALIFIED_CAMPAIGN_MODELS.includes(model))) {
    throw new CanaryAdmissionError("CANARY_CAMPAIGN_POLICY_INVALID");
  }
  if (input.exactInputCounting !== undefined) {
    const counting = input.exactInputCounting;
    if (!object(counting) || !keysOnly(counting, ["maxInputTokens", "maxGenerationAttempts", "maxTokenCountRequests", "maxProviderHttpRequests"])
      || !integer(counting.maxInputTokens) || counting.maxInputTokens < 1 || counting.maxInputTokens > 24_000
      || !integer(counting.maxGenerationAttempts) || counting.maxGenerationAttempts < 1 || counting.maxGenerationAttempts > 64
      || !integer(counting.maxTokenCountRequests) || counting.maxTokenCountRequests < 1 || counting.maxTokenCountRequests > 64
      || !integer(counting.maxProviderHttpRequests) || counting.maxProviderHttpRequests < 2 || counting.maxProviderHttpRequests > 128
      || input.absoluteHardBoundUsd > 5 || input.measuredSoftStopUsd > 3
      || input.allowedProviderModels.length !== 1 || input.allowedProviderModels[0] !== "gpt-5.6-terra") {
      throw new CanaryAdmissionError("CANARY_EXACT_COUNT_POLICY_INVALID");
    }
  }
  const material = { ...input, ...(input.exactInputCounting ? { exactInputCounting: Object.freeze({ ...input.exactInputCounting }) } : {}), allowedProviderModels: Object.freeze([...input.allowedProviderModels]) };
  return Object.freeze({ ...material, policyDigest: policyHash(material) });
};

export const validateCanaryCampaignPolicy = (value: unknown): CanaryCampaignPolicy => {
  if (!object(value) || typeof value.policyDigest !== "string") throw new CanaryAdmissionError("CANARY_CAMPAIGN_POLICY_INVALID");
  const { policyDigest, ...material } = value;
  const policy = createCanaryCampaignPolicy(material as Omit<CanaryCampaignPolicy, "policyDigest">);
  if (policyDigest !== policy.policyDigest) throw new CanaryAdmissionError("CANARY_CAMPAIGN_POLICY_DIGEST_MISMATCH");
  return policy;
};

export const campaignBudgetPolicy = (policy?: CanaryCampaignPolicy) => policy ? Object.freeze({
  absoluteHardCampaignBoundUsd: policy.absoluteHardBoundUsd,
  measuredCostSoftStopUsd: policy.measuredSoftStopUsd,
}) : CANARY_BUDGET_POLICY;

export type CanaryCallBound = Readonly<{
  model: string;
  provider: "OPENAI" | "GOOGLE_GEMINI";
  pricingSnapshotDate: string;
  inputTokenUpperBound: number;
  outputTokenUpperBound: number;
  inputBoundBasis: "DOCUMENTED_MODEL_CONTEXT_LIMIT" | "PROVIDER_EXACT_INPUT_COUNT";
  outputBoundBasis: "REQUEST_MAX_OUTPUT_INCLUDES_REASONING" | "DOCUMENTED_MODEL_OUTPUT_LIMIT";
  maximumInputRatePerMillionUsd: number;
  maximumOutputRatePerMillionUsd: number;
  upperBoundUsd: number;
}>;

/** Only the existing text-only, stateless, tool-free product payloads qualify.
 * No payload/model/prompt/effort is rewritten to force admission. Full-context
 * costing can deny a short Terra request: an exact input count is not invented.
 */
export const boundCanaryProviderCall = (endpoint: string, body: string, countedInputTokens?: number): CanaryCallBound | null => {
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
  if (countedInputTokens !== undefined && (!openai || !integer(countedInputTokens) || countedInputTokens < 1 || countedInputTokens > limit.input)) return null;
  const inputTokens = countedInputTokens ?? limit.input;
  const longContext = openai && inputTokens > 272_000;
  const inputRate = Math.max(pricing.inputPerMillionUsd, pricing.cachedInputPerMillionUsd,
    pricing.cacheWritePerMillionUsd ?? pricing.inputPerMillionUsd) * (longContext ? 2 : 1);
  const outputRate = pricing.outputPerMillionUsd * (longContext ? 1.5 : 1);
  return Object.freeze({
    model, provider: openai ? "OPENAI" : "GOOGLE_GEMINI", pricingSnapshotDate: PROVIDER_PRICING_SNAPSHOT_DATE,
    inputTokenUpperBound: inputTokens, outputTokenUpperBound: output,
    inputBoundBasis: countedInputTokens === undefined ? "DOCUMENTED_MODEL_CONTEXT_LIMIT" : "PROVIDER_EXACT_INPUT_COUNT",
    outputBoundBasis: openai ? "REQUEST_MAX_OUTPUT_INCLUDES_REASONING" : "DOCUMENTED_MODEL_OUTPUT_LIMIT",
    maximumInputRatePerMillionUsd: inputRate, maximumOutputRatePerMillionUsd: outputRate,
    upperBoundUsd: ceilUnits((inputTokens * inputRate + output * outputRate) / 1_000_000) / unitsPerUsd,
  });
};

export const canaryBudgetAdmission = (committedCostUsd: number, bound: CanaryCallBound | null, measuredCostUsd: number,
  budget: Readonly<{ absoluteHardCampaignBoundUsd: number; measuredCostSoftStopUsd: number }> = CANARY_BUDGET_POLICY) => {
  if (!Number.isFinite(budget.absoluteHardCampaignBoundUsd) || budget.absoluteHardCampaignBoundUsd <= 0 || budget.absoluteHardCampaignBoundUsd > 10
    || !Number.isFinite(budget.measuredCostSoftStopUsd) || budget.measuredCostSoftStopUsd <= 0 || budget.measuredCostSoftStopUsd > 4
    || budget.measuredCostSoftStopUsd > budget.absoluteHardCampaignBoundUsd) return "DENIED_INVALID_BUDGET_POLICY";
  if (!Number.isFinite(committedCostUsd) || committedCostUsd < 0
    || !Number.isFinite(measuredCostUsd) || measuredCostUsd < 0 || measuredCostUsd > committedCostUsd) return "DENIED_UNKNOWN_CUMULATIVE_COST";
  // Operational stop on reconstructed usage cost, NOT a one-dollar hard cap.
  if (ceilUnits(measuredCostUsd) >= ceilUnits(budget.measuredCostSoftStopUsd)) return "DENIED_SOFT_STOP";
  if (!bound || !Number.isFinite(bound.upperBoundUsd) || bound.upperBoundUsd <= 0) return "DENIED_UNKNOWN_UPPER_BOUND";
  // Costs round upward; an absolute ceiling must never be increased by rounding.
  if (ceilUnits(committedCostUsd) + ceilUnits(bound.upperBoundUsd) > Math.floor(budget.absoluteHardCampaignBoundUsd * unitsPerUsd)) return "DENIED_HARD_BUDGET";
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

export type CanaryExecution = Readonly<{ attemptPolicy: typeof SINGLE_ATTEMPT_FAIL_CLOSED; campaignId: string; campaignPolicy?: CanaryCampaignPolicy }>;
export const resolveCanaryExecution = (environment: Readonly<Record<string, string | undefined>>): CanaryExecution | null => {
  const policy = environment.PROTOCOL_DESIGNER_LIVE_CANARY?.trim();
  const id = environment.PROTOCOL_DESIGNER_CANARY_ID?.trim();
  const configuredCampaign = environment.PROTOCOL_DESIGNER_CAMPAIGN_POLICY?.trim();
  if (environment.PROTOCOL_DESIGNER_CAMPAIGN_POLICY !== undefined && !configuredCampaign) {
    throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK");
  }
  if (!policy && !id && !configuredCampaign) return null;
  if (policy !== SINGLE_ATTEMPT_FAIL_CLOSED || !id || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(id)) {
    throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK");
  }
  if (!configuredCampaign) return Object.freeze({ attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: id });
  let campaignPolicy: CanaryCampaignPolicy;
  try { campaignPolicy = validateCanaryCampaignPolicy(JSON.parse(configuredCampaign)); }
  catch { throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK"); }
  if (campaignPolicy.campaignId !== id) throw new CanaryAdmissionError("CANARY_CONFIGURATION_INVALID_NO_NORMAL_FALLBACK");
  return Object.freeze({ attemptPolicy: SINGLE_ATTEMPT_FAIL_CLOSED, campaignId: id, campaignPolicy });
};
