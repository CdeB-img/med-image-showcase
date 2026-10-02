export const PROVIDER_CALL_OBSERVABILITY_CONTRACT = "PROTOCOL_DESIGNER_PROVIDER_CALL_OBSERVABILITY" as const;
export const PROVIDER_CALL_OBSERVABILITY_VERSION = "1.0.0" as const;
export const PROVIDER_PRICING_SNAPSHOT_DATE = "2026-09-14" as const;
export const OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS = 272_000;

export type ProtocolDesignerProvider = "OPENAI" | "GOOGLE_GEMINI";
export type ProviderCallPurpose = "LANGUAGE_PROJECTION" | "PERSISTENT_DELTA" | "CONVERSATION_REALIZATION" | "SCIENTIFIC_THINKING_PROPOSAL" | "DOCUMENT_PROJECTION";
export type DurableProviderFailurePhase = "PRECOUNT" | "RESERVATION" | "PRE_DISPATCH" | "DISPATCHED"
  | "HEADERS_RECEIVED" | "BODY_READ" | "SETTLEMENT" | "PROVIDER_RESULT_VALIDATION" | "UNKNOWN";
export type DurableProviderFailureDiagnostic = Readonly<{
  contract: "DURABLE_PROVIDER_TERMINAL_FAILURE";
  clientRequestId: string | null;
  operationKey: string | null;
  sessionId: string | null;
  turnId: string | null;
  providerCallId: string | null;
  generationProvider: "OPENAI" | "AZURE_OPENAI" | "UNKNOWN";
  phase: DurableProviderFailurePhase;
  precountStarted: boolean;
  precountCompleted: boolean;
  reservationConfirmed: boolean;
  dispatchAttempted: boolean;
  headersReceived: boolean;
  bodyRead: boolean;
  inputCountHttpStatus: number | null;
  providerHttpStatus: number | null;
  providerResponseStatus: "completed" | "incomplete" | "failed" | "UNKNOWN";
  incompleteReason: "max_output_tokens" | "content_filter" | null;
  structuredErrorCode: string | null;
  safeExceptionClass: "AbortError" | "TypeError" | "Error" | "DurablePublicGuardError"
    | "CanaryAdmissionError" | "OtherError" | null;
  abortSignalAborted: boolean | null;
  lastConfirmedDurableState: string;
}>;

/** Rebuild from an allowlist; never trust arbitrary exception fields or raw messages. */
export const readDurableProviderFailureDiagnostic = (value: unknown): DurableProviderFailureDiagnostic | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = "durableFailure" in value ? value.durableFailure
    : "providerFailureDiagnostic" in value ? value.providerFailureDiagnostic : value;
  if (!candidate || typeof candidate !== "object" || !("contract" in candidate)
    || candidate.contract !== "DURABLE_PROVIDER_TERMINAL_FAILURE") return null;
  const item = candidate as Partial<DurableProviderFailureDiagnostic>;
  const safeId = (id: unknown, max: number) => typeof id === "string" && id.length <= max
    && /^[A-Za-z0-9:_-]+$/u.test(id) ? id : null;
  const safeCode = typeof item.structuredErrorCode === "string" && item.structuredErrorCode.length <= 128
    && (/^(PUBLIC|CANARY|PROVIDER)_[A-Z0-9_]+$/u.test(item.structuredErrorCode)
      || item.structuredErrorCode === "QUALIFICATION_INVALID" || item.structuredErrorCode === "INPUT_TOKEN_DIVERGENCE")
    ? item.structuredErrorCode : null;
  const phase = ["PRECOUNT", "RESERVATION", "PRE_DISPATCH", "DISPATCHED", "HEADERS_RECEIVED", "BODY_READ", "SETTLEMENT", "PROVIDER_RESULT_VALIDATION", "UNKNOWN"]
    .includes(String(item.phase)) ? item.phase! : "UNKNOWN";
  const state = ["COUNT_PENDING", "COUNT_DISPATCHED", "COUNT_COMPLETED", "COUNT_FAILED", "COUNT_UNKNOWN_AFTER_DISPATCH",
    "RESERVED", "DISPATCHED", "COMPLETED_RECEIVED", "VALIDATED", "CONSUMED", "UNKNOWN_AFTER_DISPATCH",
    "INPUT_TOKEN_DIVERGENCE", "QUALIFICATION_INVALID", "INCOMPLETE_CONTENT_FILTERED",
    "INCOMPLETE_MAX_OUTPUT_TOKENS", "INCOMPLETE_OTHER", "INCOMPLETE_UNSETTLED",
    "PROVIDER_HTTP_FAILED", "PROVIDER_RESULT_FAILED", "PROVIDER_USAGE_UNSETTLED", "UNKNOWN"].includes(String(item.lastConfirmedDurableState))
    ? item.lastConfirmedDurableState! : "UNKNOWN";
  const httpStatus = (status: unknown) => Number.isSafeInteger(status) && (status as number) >= 100
    && (status as number) <= 599 ? status as number : null;
  return Object.freeze({
    contract: "DURABLE_PROVIDER_TERMINAL_FAILURE",
    clientRequestId: safeId(item.clientRequestId, 320),
    operationKey: typeof item.operationKey === "string" && /^[a-f0-9]{64}$/u.test(item.operationKey) ? item.operationKey : null,
    sessionId: safeId(item.sessionId, 240),
    turnId: safeId(item.turnId, 320),
    providerCallId: safeId(item.providerCallId, 512),
    generationProvider: item.generationProvider === "OPENAI" || item.generationProvider === "AZURE_OPENAI"
      ? item.generationProvider : "UNKNOWN",
    phase,
    precountStarted: item.precountStarted === true,
    precountCompleted: item.precountCompleted === true,
    reservationConfirmed: item.reservationConfirmed === true,
    dispatchAttempted: item.dispatchAttempted === true,
    headersReceived: item.headersReceived === true,
    bodyRead: item.bodyRead === true,
    inputCountHttpStatus: httpStatus(item.inputCountHttpStatus),
    providerHttpStatus: httpStatus(item.providerHttpStatus),
    providerResponseStatus: item.providerResponseStatus === "completed" || item.providerResponseStatus === "incomplete"
      || item.providerResponseStatus === "failed" ? item.providerResponseStatus : "UNKNOWN",
    incompleteReason: item.incompleteReason === "max_output_tokens" || item.incompleteReason === "content_filter"
      ? item.incompleteReason : null,
    structuredErrorCode: safeCode,
    safeExceptionClass: ["AbortError", "TypeError", "Error", "DurablePublicGuardError", "CanaryAdmissionError", "OtherError"]
      .includes(String(item.safeExceptionClass)) ? item.safeExceptionClass! : null,
    abortSignalAborted: typeof item.abortSignalAborted === "boolean" ? item.abortSignalAborted : null,
    lastConfirmedDurableState: state,
  });
};

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
  pricingSnapshotDate: string;
  startedAt: string;
  completedAt: string;
  durableFailure?: DurableProviderFailureDiagnostic;
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
  snapshotDate: string;
  inputPerMillionUsd: number;
  cachedInputPerMillionUsd: number;
  outputPerMillionUsd: number;
  cacheWritePerMillionUsd?: number;
}>;

// Official standard-tier text-token prices. Per-model dates keep historical
// receipts reproducible when one model changes without redating the others.
const PRICING_BY_MODEL: Readonly<Record<string, Pricing>> = Object.freeze({
  "gpt-6-sol": Object.freeze({
    snapshotDate: "2026-09-28",
    inputPerMillionUsd: 2.00,
    cachedInputPerMillionUsd: 0.20,
    cacheWritePerMillionUsd: 2.50,
    outputPerMillionUsd: 10.00,
  }),
  "gpt-5.6-sol": Object.freeze({
    snapshotDate: "2026-09-14",
    inputPerMillionUsd: 4.00,
    cachedInputPerMillionUsd: 0.40,
    cacheWritePerMillionUsd: 5.00,
    outputPerMillionUsd: 20.00,
  }),
  "gpt-5.6-luna": Object.freeze({
    snapshotDate: "2026-09-14",
    inputPerMillionUsd: 0.20,
    cachedInputPerMillionUsd: 0.02,
    cacheWritePerMillionUsd: 0.25,
    outputPerMillionUsd: 1.20,
  }),
  "gpt-5.6-terra": Object.freeze({
    snapshotDate: "2026-09-14",
    inputPerMillionUsd: 2.00,
    cachedInputPerMillionUsd: 0.20,
    cacheWritePerMillionUsd: 2.50,
    outputPerMillionUsd: 12.00,
  }),
  "gemini-3.5-flash-lite": Object.freeze({
    snapshotDate: "2026-09-14",
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
  const longContext = model === "gpt-6-sol"
    && nonNegative(usage.inputTokens) > OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS;
  const inputMultiplier = longContext ? 2 : 1;
  const outputMultiplier = longContext ? 1.5 : 1;
  const cost = (
    uncached * pricing.inputPerMillionUsd * inputMultiplier
    + cached * pricing.cachedInputPerMillionUsd * inputMultiplier
    + cacheWrite * (pricing.cacheWritePerMillionUsd ?? pricing.inputPerMillionUsd) * inputMultiplier
    + nonNegative(usage.outputTokens) * pricing.outputPerMillionUsd * outputMultiplier
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
  durableFailure?: DurableProviderFailureDiagnostic | null;
}>): ProviderCallRecord => {
  const modelVersion = input.modelReturned ?? input.modelRequested;
  const pricingSnapshotDate = providerModelPricing(modelVersion)?.snapshotDate
    ?? providerModelPricing(input.modelRequested)?.snapshotDate
    ?? PROVIDER_PRICING_SNAPSHOT_DATE;
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
    pricingSnapshotDate,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    ...(input.durableFailure ? { durableFailure: readDurableProviderFailureDiagnostic(input.durableFailure) ?? undefined } : {}),
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

/** Numeric-only packet attribution, carried by the existing bridge observability.
 * Sizes are UTF-8 JSON bytes, never provider tokens or scientific content. */
export const CONVERSATION_CONTEXT_PACKET_NUMERIC_FIELDS = Object.freeze([
  "limitBytes", "packetTotalBytes", "systemContextBytes", "currentUserMessageBytes",
  "conversationHistoryBytes", "projectContextBytes", "qryContextBytes", "specializedOwnerContextBytes",
  "otherContextBytes", "conversationTurnCount", "userTurnCount", "assistantTurnCount",
  "projectObjectCount", "projectRelationCount", "projectOpenPointCount", "qryNeedCount",
  "oldestIncludedTurnIndex", "newestIncludedTurnIndex", "includedTurnCount",
  "userHistoryBytes", "assistantHistoryBytes", "largestSingleTurnBytes",
  "projectObjectsBytes", "projectRelationsBytes", "projectTemporalQualificationsBytes",
  "projectOpenPointsBytes", "projectOtherBytes", "workingStudyProposalBytes",
  "workingNextActionBytes", "discussionContextBytes", "openDecisionsBytes",
] as const);
export type ConversationContextPacketPreflight = Readonly<
  Record<typeof CONVERSATION_CONTEXT_PACKET_NUMERIC_FIELDS[number], number> & {
    status: "SUCCEEDED" | "FAILED";
    largestSingleTurnRole: "USER" | "NOXIA" | null;
  }
>;

/** Allowlisted read boundary: arbitrary response fields cannot enter TRACE. */
export const readConversationContextPacketPreflight = (value: unknown): ConversationContextPacketPreflight | null => {
  try {
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    if (item.status !== "SUCCEEDED" && item.status !== "FAILED") return null;
    if (item.largestSingleTurnRole !== null && item.largestSingleTurnRole !== "USER" && item.largestSingleTurnRole !== "NOXIA") return null;
    const numbers = {} as Record<typeof CONVERSATION_CONTEXT_PACKET_NUMERIC_FIELDS[number], number>;
    for (const key of CONVERSATION_CONTEXT_PACKET_NUMERIC_FIELDS) {
      const number = item[key];
      const minimum = key === "oldestIncludedTurnIndex" || key === "newestIncludedTurnIndex" ? -1 : 0;
      if (typeof number !== "number" || !Number.isSafeInteger(number) || number < minimum) return null;
      numbers[key] = number;
    }
    if (numbers.limitBytes !== 80_000 || (numbers.packetTotalBytes > numbers.limitBytes) !== (item.status === "FAILED")) return null;
    return Object.freeze({ ...numbers, status: item.status,
      largestSingleTurnRole: item.largestSingleTurnRole === "USER" ? "USER" : item.largestSingleTurnRole === "NOXIA" ? "NOXIA" : null });
  } catch {
    // Diagnostic failure cannot become an admission or product failure.
    return null;
  }
};

export type ProviderCallRequestObservability = Readonly<{
  providerCalls: readonly ProviderCallRecord[];
  requestEstimatedCostUsd: number;
  requestCostIncomplete: boolean;
  unpricedCallCount: number;
  conversationContextPacketPreflight?: ConversationContextPacketPreflight;
}>;

export const providerCallRequestObservability = (
  records: readonly ProviderCallRecord[],
  contextPacketPreflight?: ConversationContextPacketPreflight | null,
): ProviderCallRequestObservability => {
  const summary = providerSessionCostSummary(records);
  const preflight = readConversationContextPacketPreflight(contextPacketPreflight);
  return {
    providerCalls: records,
    requestEstimatedCostUsd: summary.estimatedCostUsd,
    requestCostIncomplete: summary.costIncomplete,
    unpricedCallCount: summary.unpricedCallCount,
    ...(preflight ? { conversationContextPacketPreflight: preflight } : {}),
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
