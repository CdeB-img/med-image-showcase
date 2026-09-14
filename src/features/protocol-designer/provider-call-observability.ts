export const PROVIDER_CALL_OBSERVABILITY_CONTRACT = "PROTOCOL_DESIGNER_PROVIDER_CALL_OBSERVABILITY" as const;
export const PROVIDER_CALL_OBSERVABILITY_VERSION = "1.0.0" as const;
export const PROVIDER_PRICING_SNAPSHOT_DATE = "2026-09-14" as const;

export type ProtocolDesignerProvider = "OPENAI" | "GOOGLE_GEMINI";
export type ProviderCallPurpose = "LANGUAGE_PROJECTION" | "PERSISTENT_DELTA" | "CONVERSATION_REALIZATION";

export type ProviderCallObservationContext = Readonly<{
  sessionId: string | null;
  conversationId: string | null;
  turnId: string | null;
  clientRequestId: string;
  testSessionId: string | null;
}>;

export type ProviderTokenUsage = Readonly<{
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
}>;

export type ProviderCallRecord = Readonly<{
  contract: typeof PROVIDER_CALL_OBSERVABILITY_CONTRACT;
  contractVersion: typeof PROVIDER_CALL_OBSERVABILITY_VERSION;
  callId: string;
  provider: ProtocolDesignerProvider;
  modelRequested: string;
  modelReturned: string | null;
  modelVersion: string;
  purpose: ProviderCallPurpose;
  reasoningEffort: string | null;
  context: ProviderCallObservationContext;
  usage: ProviderTokenUsage;
  latencyMs: number;
  retryIndex: number;
  retryReason: string | null;
  status: "SUCCEEDED" | "FAILED";
  failureReason: string | null;
  providerRequestId: string | null;
  providerResponseId: string | null;
  estimatedCostUsd: number | null;
  pricingSnapshotDate: typeof PROVIDER_PRICING_SNAPSHOT_DATE;
  startedAt: string;
  completedAt: string;
}>;

export type ProviderCallAttemptInstrumentation = Readonly<{
  context: ProviderCallObservationContext;
  purpose: ProviderCallPurpose;
  reasoningEffort: string | null;
  retryIndex: number;
  retryReason: string | null;
  onRecord: (record: ProviderCallRecord) => void;
}>;

/** Local transport metadata; never serialized into the external provider payload. */
export type ProviderObservedRequestInit = RequestInit & {
  noxiaProviderObservation?: Omit<ProviderCallAttemptInstrumentation, "onRecord">;
};

export const providerCallRequestMetadata = (
  instrumentation?: ProviderCallAttemptInstrumentation,
): ProviderObservedRequestInit["noxiaProviderObservation"] => instrumentation ? ({
  context: instrumentation.context,
  purpose: instrumentation.purpose,
  reasoningEffort: instrumentation.reasoningEffort,
  retryIndex: instrumentation.retryIndex,
  retryReason: instrumentation.retryReason,
}) : undefined;

type Pricing = Readonly<{
  inputPerMillionUsd: number;
  cachedInputPerMillionUsd: number;
  outputPerMillionUsd: number;
  cacheWritePerMillionUsd?: number;
}>;

// Official standard-tier text-token prices observed on 2026-09-14.
// The dated snapshot makes estimates reproducible; it is not a billing authority.
const PRICING_BY_MODEL: Readonly<Record<string, Pricing>> = Object.freeze({
  "gpt-5.6-luna": Object.freeze({
    inputPerMillionUsd: 0.20,
    cachedInputPerMillionUsd: 0.02,
    cacheWritePerMillionUsd: 0.25,
    outputPerMillionUsd: 1.20,
  }),
  "gpt-5.6-terra": Object.freeze({
    inputPerMillionUsd: 2.00,
    cachedInputPerMillionUsd: 0.20,
    cacheWritePerMillionUsd: 2.50,
    outputPerMillionUsd: 12.00,
  }),
  "gemini-3.5-flash-lite": Object.freeze({
    inputPerMillionUsd: 0.30,
    cachedInputPerMillionUsd: 0.03,
    outputPerMillionUsd: 2.50,
  }),
});

/** Shared dated tariff, including cache writes; not an assertion of invoice cost. */
export const providerModelPricing = (model: string): Pricing | null => PRICING_BY_MODEL[model] ?? null;

const nonNegative = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value)
  ? Math.max(0, value)
  : 0;

export const estimateProviderCallCostUsd = (
  model: string,
  usage: ProviderTokenUsage,
): number | null => {
  const pricing = PRICING_BY_MODEL[model];
  if (!pricing || usage.inputTokens === null || usage.outputTokens === null) return null;
  const cached = Math.min(nonNegative(usage.cachedInputTokens), nonNegative(usage.inputTokens));
  const cacheWrite = Math.min(
    nonNegative(usage.cacheWriteTokens),
    Math.max(0, nonNegative(usage.inputTokens) - cached),
  );
  const uncached = Math.max(0, nonNegative(usage.inputTokens) - cached - cacheWrite);
  const cost = (
    uncached * pricing.inputPerMillionUsd
    + cached * pricing.cachedInputPerMillionUsd
    + cacheWrite * (pricing.cacheWritePerMillionUsd ?? pricing.inputPerMillionUsd)
    + nonNegative(usage.outputTokens) * pricing.outputPerMillionUsd
  ) / 1_000_000;
  return Number(cost.toFixed(10));
};

export const emptyProviderTokenUsage = (): ProviderTokenUsage => ({
  inputTokens: null,
  cachedInputTokens: null,
  cacheWriteTokens: null,
  outputTokens: null,
  reasoningTokens: null,
  totalTokens: null,
});

export const materializeProviderCallRecord = (input: Readonly<{
  provider: ProtocolDesignerProvider;
  modelRequested: string;
  modelReturned: string | null;
  instrumentation: ProviderCallAttemptInstrumentation;
  usage: ProviderTokenUsage;
  latencyMs: number;
  status: ProviderCallRecord["status"];
  failureReason: string | null;
  providerRequestId: string | null;
  providerResponseId: string | null;
  startedAt: string;
  completedAt: string;
}>): ProviderCallRecord => {
  const modelVersion = input.modelReturned ?? input.modelRequested;
  const estimatedCostUsd = estimateProviderCallCostUsd(modelVersion, input.usage)
    ?? estimateProviderCallCostUsd(input.modelRequested, input.usage);
  return Object.freeze({
    contract: PROVIDER_CALL_OBSERVABILITY_CONTRACT,
    contractVersion: PROVIDER_CALL_OBSERVABILITY_VERSION,
    callId: `provider-call:${input.instrumentation.context.clientRequestId}:${input.instrumentation.purpose}:${input.instrumentation.retryIndex}`,
    provider: input.provider,
    modelRequested: input.modelRequested,
    modelReturned: input.modelReturned,
    modelVersion,
    purpose: input.instrumentation.purpose,
    reasoningEffort: input.instrumentation.reasoningEffort,
    context: input.instrumentation.context,
    usage: input.usage,
    latencyMs: input.latencyMs,
    retryIndex: input.instrumentation.retryIndex,
    retryReason: input.instrumentation.retryReason,
    status: input.status,
    failureReason: input.failureReason,
    providerRequestId: input.providerRequestId,
    providerResponseId: input.providerResponseId,
    estimatedCostUsd,
    pricingSnapshotDate: PROVIDER_PRICING_SNAPSHOT_DATE,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
  });
};

export const providerCallWaterfall = (records: readonly ProviderCallRecord[]) => {
  let cumulativeCostUsd = 0;
  let cumulativeUnpricedCallCount = 0;
  return records.map((record) => {
    cumulativeCostUsd += record.estimatedCostUsd ?? 0;
    if (record.estimatedCostUsd === null) cumulativeUnpricedCallCount += 1;
    return Object.freeze({
      turnId: record.context.turnId,
      model: record.modelVersion,
      purpose: record.purpose,
      calls: 1 as const,
      inputTokens: record.usage.inputTokens,
      cachedInputTokens: record.usage.cachedInputTokens,
      outputTokens: record.usage.outputTokens,
      latencyMs: record.latencyMs,
      retryIndex: record.retryIndex,
      retryReason: record.retryReason,
      estimatedCostUsd: record.estimatedCostUsd,
      cumulativeCostUsd: Number(cumulativeCostUsd.toFixed(10)),
      cumulativeCostIncomplete: cumulativeUnpricedCallCount > 0,
      cumulativeUnpricedCallCount,
    });
  });
};

/** Known-cost subtotal; consumers must retain the accompanying completeness status. */
export const providerSessionCostUsd = (records: readonly ProviderCallRecord[]) => Number(records.reduce(
  (total, record) => total + (record.estimatedCostUsd ?? 0),
  0,
).toFixed(10));

export type ProviderSessionCostSummary = Readonly<{
  estimatedCostUsd: number;
  costIncomplete: boolean;
  unpricedCallCount: number;
}>;

export const providerSessionCostSummary = (
  records: readonly ProviderCallRecord[],
): ProviderSessionCostSummary => {
  const unpricedCallCount = records.filter((record) => record.estimatedCostUsd === null).length;
  return {
    estimatedCostUsd: providerSessionCostUsd(records),
    costIncomplete: unpricedCallCount > 0,
    unpricedCallCount,
  };
};

export type ProviderCallRequestObservability = Readonly<{
  providerCalls: readonly ProviderCallRecord[];
  requestEstimatedCostUsd: number;
  requestCostIncomplete: boolean;
  unpricedCallCount: number;
}>;

export const providerCallRequestObservability = (
  records: readonly ProviderCallRecord[],
): ProviderCallRequestObservability => {
  const summary = providerSessionCostSummary(records);
  return {
    providerCalls: records,
    requestEstimatedCostUsd: summary.estimatedCostUsd,
    requestCostIncomplete: summary.costIncomplete,
    unpricedCallCount: summary.unpricedCallCount,
  };
};

export const advanceProviderSessionCostUsd = (
  previousCumulativeCostUsd: number | null | undefined,
  records: readonly ProviderCallRecord[],
) => Number(((previousCumulativeCostUsd ?? 0) + providerSessionCostUsd(records)).toFixed(10));

export const latestRecordedProviderSessionCostUsd = (
  traces: readonly Readonly<{ cumulativeSessionCostUsd?: number }>[],
): number => {
  for (let index = traces.length - 1; index >= 0; index -= 1) {
    const value = traces[index]?.cumulativeSessionCostUsd;
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
};
