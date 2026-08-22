import { logicalDigest } from "../src/features/knowledge-engine/canonical.js";
import {
  EXPECTED_HYBRID_MODEL_IDENTITY,
  HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME,
  HYBRID_PRIMARY_PROMPT_DIGEST,
  HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA,
  HYBRID_PRIMARY_RUNTIME_ID,
  HYBRID_PRIMARY_RUNTIME_VERSION,
  HYBRID_PRIMARY_SCHEMA_DIGEST,
  HYBRID_PRIMARY_SYSTEM_PROMPT,
  HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST,
} from "../src/features/scientific-interpretation/hybrid-primary.js";
import { ScientificInterpretationTechnicalError, type ScientificInterpretationContributionEnvelope, type ScientificInterpretationConversation } from "../src/features/scientific-interpretation/contracts.js";
import type { HybridNativeExecution } from "../src/features/scientific-interpretation/hybrid-adapter.js";
import { buildScientificInterpretationTerminologyContext } from "../src/features/scientific-interpretation/terminology-grounding.js";
import {
  SEMANTIC_CRITIC_OUTPUT_FUNCTION_NAME,
  SEMANTIC_CRITIC_PROVIDER_SCHEMA,
  SEMANTIC_CRITIC_SYSTEM_PROMPT,
  semanticCriticScopeForContribution,
  type SemanticCriticCandidateSnapshot,
  type SemanticCriticGroundingContext,
  type SemanticCriticNativeExecution,
} from "../src/features/scientific-interpretation/semantic-critic.js";

export const HYBRID_PROVIDER_MAX_STARTS_PER_ROLLING_60_SECONDS = 10;
export const HYBRID_PROVIDER_CONCURRENCY = 1;

type ProviderAttempt = NonNullable<HybridNativeExecution["providerAttempts"]>[number];

export class RollingSingleConcurrencyGate {
  private starts: number[] = [];
  private tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly maxStarts = HYBRID_PROVIDER_MAX_STARTS_PER_ROLLING_60_SECONDS,
    private readonly now = () => Date.now(),
    private readonly sleep = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)),
  ) {}

  async run<T>(operation: () => Promise<T>): Promise<T> {
    let release = () => {};
    const previous = this.tail;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      while (true) {
        const current = this.now();
        this.starts = this.starts.filter((start) => current - start < 60_000);
        if (this.starts.length < this.maxStarts) break;
        await this.sleep(Math.max(1, 60_001 - (current - this.starts[0])));
      }
      this.starts.push(this.now());
      return await operation();
    } finally {
      release();
    }
  }
}

export const productHybridProviderGate = new RollingSingleConcurrencyGate();
const policyGates = new Map<number, RollingSingleConcurrencyGate>([[HYBRID_PROVIDER_MAX_STARTS_PER_ROLLING_60_SECONDS, productHybridProviderGate]]);

const configuredProviderStartsPerMinute = () => {
  const value = Number(process.env.NOXIA_PROVIDER_MAX_STARTS_PER_MINUTE ?? HYBRID_PROVIDER_MAX_STARTS_PER_ROLLING_60_SECONDS);
  return Number.isInteger(value) && value > 0
    ? value
    : HYBRID_PROVIDER_MAX_STARTS_PER_ROLLING_60_SECONDS;
};

export const providerGateForCurrentPolicy = () => {
  const maximum = configuredProviderStartsPerMinute();
  const existing = policyGates.get(maximum);
  if (existing) return existing;
  const gate = new RollingSingleConcurrencyGate(maximum);
  policyGates.set(maximum, gate);
  return gate;
};

const retryableStatus = (status: number) => [429, 502, 503, 504].includes(status);
const operationId = (conversation: ScientificInterpretationConversation, previousState?: ScientificInterpretationContributionEnvelope | null) =>
  `hybrid-operation:${logicalDigest({ conversationId: conversation.conversationId, turns: conversation.turns, previous: previousState?.identity.contributionDigest ?? null, createdAt: new Date().toISOString(), nonce: Math.random() })}`;

const retryAfterMilliseconds = (response: Response) => {
  const value = response.headers.get("retry-after");
  if (!value) return 60_000;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.max(1_000, seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(1_000, date - Date.now()) : 60_000;
};

const previousForProvider = (previous?: ScientificInterpretationContributionEnvelope | null) => previous ? {
  contributionId: previous.identity.contributionId,
  contributionDigest: previous.identity.contributionDigest,
  scientificContent: previous.scientificContent,
  unresolvedFindings: previous.audit.unresolvedFindings,
} : null;

export const buildGeminiHybridProviderPayload = (
  conversation: ScientificInterpretationConversation,
  previousState?: ScientificInterpretationContributionEnvelope | null,
  temperature?: number | null,
) => ({
  systemInstruction: { parts: [{ text: HYBRID_PRIMARY_SYSTEM_PROMPT }] },
  contents: [{ role: "user", parts: [{ text: JSON.stringify({
    conversation,
    terminologyContext: buildScientificInterpretationTerminologyContext(conversation, previousState),
    previousContribution: previousForProvider(previousState),
  }) }] }],
  tools: [{ functionDeclarations: [{
    name: HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME,
    description: "Return the complete typed scientific interpretation.",
    parametersJsonSchema: HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA,
  }] }],
  toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME] } },
  ...(temperature === undefined || temperature === null ? {} : { generationConfig: { temperature } }),
});

export class GeminiHybridScientificInterpretationProvider {
  readonly runtimeId = HYBRID_PRIMARY_RUNTIME_ID;
  readonly runtimeVersion = HYBRID_PRIMARY_RUNTIME_VERSION;
  readonly configurationDigest: string;

  constructor(private readonly options: {
    apiKey: string;
    model: string;
    temperature?: number | null;
    maxAttempts?: number;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    gate?: RollingSingleConcurrencyGate;
    sleepImpl?: (milliseconds: number) => Promise<void>;
    now?: () => number;
    maximumStartsPerRolling60Seconds?: number;
  }) {
    if (options.model !== EXPECTED_HYBRID_MODEL_IDENTITY) {
      throw new ScientificInterpretationTechnicalError(
        "HYBRID_RUNTIME_UNAVAILABLE",
        `MODEL_IDENTITY_DRIFT: expected ${EXPECTED_HYBRID_MODEL_IDENTITY}, received ${options.model}`,
        null,
        null,
      );
    }
    this.configurationDigest = logicalDigest({
      runtimeId: this.runtimeId,
      runtimeVersion: this.runtimeVersion,
      provider: "GOOGLE_GEMINI",
      model: options.model,
      temperature: options.temperature ?? null,
      maxAttempts: Math.max(1, Math.min(options.maxAttempts ?? 2, 2)),
      concurrency: HYBRID_PROVIDER_CONCURRENCY,
      startsPerRolling60Seconds: options.maximumStartsPerRolling60Seconds ?? configuredProviderStartsPerMinute(),
      promptDigest: HYBRID_PRIMARY_PROMPT_DIGEST,
      internalSchemaDigest: HYBRID_PRIMARY_SCHEMA_DIGEST,
      transportSchemaDigest: HYBRID_PRIMARY_TRANSPORT_SCHEMA_DIGEST,
      structuredOutputMode: "REQUIRED_FUNCTION_CALL",
    });
  }

  async execute(conversation: ScientificInterpretationConversation, previousState?: ScientificInterpretationContributionEnvelope | null): Promise<HybridNativeExecution> {
    if (!this.options.apiKey.trim() || !this.options.model.trim()) {
      throw new ScientificInterpretationTechnicalError("HYBRID_RUNTIME_UNAVAILABLE", "HYBRID_PROVIDER_CONFIGURATION_MISSING", null, null);
    }
    const id = operationId(conversation, previousState);
    const attempts: ProviderAttempt[] = [];
    const rawAttempts: Array<{ attempt: number; httpStatus: number | null; providerBodyText: string | null; error: string | null }> = [];
    const maxAttempts = Math.max(1, Math.min(this.options.maxAttempts ?? 2, 2));
    const gate = this.options.gate ?? providerGateForCurrentPolicy();
    const sleep = this.options.sleepImpl ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const started = this.options.now?.() ?? Date.now();
      const startedAt = new Date(started).toISOString();
      let waitDurationMs = 0;
      try {
        const response = await gate.run(async () => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 45_000);
          try {
            return await (this.options.fetchImpl ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.options.model)}:generateContent`, {
              method: "POST",
              headers: { "content-type": "application/json", "x-goog-api-key": this.options.apiKey },
              body: JSON.stringify(buildGeminiHybridProviderPayload(conversation, previousState, this.options.temperature)),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timer);
          }
        });
        const providerBodyText = await response.text();
        rawAttempts.push({ attempt, httpStatus: response.status, providerBodyText, error: null });
        const retryable = retryableStatus(response.status);
        const completedAt = new Date(this.options.now?.() ?? Date.now()).toISOString();
        if (!response.ok) {
          if (retryable && attempt < maxAttempts) {
            waitDurationMs = retryAfterMilliseconds(response);
            attempts.push({ attempt, startedAt, completedAt, httpStatus: response.status, providerStatus: `HTTP_${response.status}`, outcome: "FAILED", retryable: true, waitDurationMs });
            await sleep(waitDurationMs);
            continue;
          }
          attempts.push({ attempt, startedAt, completedAt, httpStatus: response.status, providerStatus: `HTTP_${response.status}`, outcome: "FAILED", retryable, waitDurationMs: 0 });
          return {
            operationId: id,
            provider: "GOOGLE_GEMINI",
            model: this.options.model,
            promptDigest: HYBRID_PRIMARY_PROMPT_DIGEST,
            schemaDigest: HYBRID_PRIMARY_SCHEMA_DIGEST,
            configurationDigest: this.configurationDigest,
            runtimeId: this.runtimeId,
            runtimeVersion: this.runtimeVersion,
            rawOutput: { operationId: id, rawAttempts, providerAttempts: attempts },
            providerAttempts: attempts,
            technicalFailure: { failureClass: "PROVIDER_FAILURE", message: `HYBRID_PROVIDER_HTTP_${response.status}` },
          };
        }
        attempts.push({ attempt, startedAt, completedAt, httpStatus: response.status, providerStatus: "AVAILABLE", outcome: "SUCCESS", retryable: false, waitDurationMs: 0 });
        return {
          operationId: id,
          provider: "GOOGLE_GEMINI",
          model: this.options.model,
          promptDigest: HYBRID_PRIMARY_PROMPT_DIGEST,
          schemaDigest: HYBRID_PRIMARY_SCHEMA_DIGEST,
          configurationDigest: this.configurationDigest,
          runtimeId: this.runtimeId,
          runtimeVersion: this.runtimeVersion,
          rawOutput: { operationId: id, rawAttempts, providerAttempts: attempts },
          providerAttempts: attempts,
          technicalFailure: null,
        };
      } catch (caught) {
        const completedAt = new Date(this.options.now?.() ?? Date.now()).toISOString();
        const timeout = caught instanceof Error && caught.name === "AbortError";
        rawAttempts.push({ attempt, httpStatus: null, providerBodyText: null, error: timeout ? "TIMEOUT" : "NETWORK_FAILURE" });
        if (attempt < maxAttempts) {
          waitDurationMs = 60_000;
          attempts.push({ attempt, startedAt, completedAt, httpStatus: null, providerStatus: timeout ? "TIMEOUT" : "NETWORK_FAILURE", outcome: "FAILED", retryable: true, waitDurationMs });
          await sleep(waitDurationMs);
          continue;
        }
        attempts.push({ attempt, startedAt, completedAt, httpStatus: null, providerStatus: timeout ? "TIMEOUT" : "NETWORK_FAILURE", outcome: "FAILED", retryable: true, waitDurationMs: 0 });
        return {
          operationId: id,
          provider: "GOOGLE_GEMINI",
          model: this.options.model,
          promptDigest: HYBRID_PRIMARY_PROMPT_DIGEST,
          schemaDigest: HYBRID_PRIMARY_SCHEMA_DIGEST,
          configurationDigest: this.configurationDigest,
          runtimeId: this.runtimeId,
          runtimeVersion: this.runtimeVersion,
          rawOutput: { operationId: id, rawAttempts, providerAttempts: attempts },
          providerAttempts: attempts,
          technicalFailure: { failureClass: "TRANSPORT_FAILURE", message: timeout ? "HYBRID_PROVIDER_TIMEOUT" : "HYBRID_PROVIDER_NETWORK_FAILURE" },
        };
      }
    }
    throw new ScientificInterpretationTechnicalError("PROVIDER_FAILURE", "HYBRID_PROVIDER_ATTEMPTS_EXHAUSTED", null, id);
  }
}

export const buildGeminiSemanticCriticProviderPayload = (input: {
  contribution: ScientificInterpretationContributionEnvelope;
  groundingContext: SemanticCriticGroundingContext;
  candidate: SemanticCriticCandidateSnapshot;
}) => ({
  systemInstruction: { parts: [{ text: SEMANTIC_CRITIC_SYSTEM_PROMPT }] },
  contents: [{ role: "user", parts: [{ text: JSON.stringify({
    rawUserMessage: input.groundingContext.rawUserMessage,
    conversationalContext: input.groundingContext.relevantConversationTurns,
    queryContext: input.groundingContext.interactionContext,
    currentProjectContext: input.groundingContext.projectContext,
    terminologyContext: input.groundingContext.terminologyContext,
    intermediateSemanticUnderstanding: semanticCriticScopeForContribution(input.contribution),
    compiledCandidate: input.candidate,
  }) }] }],
  tools: [{ functionDeclarations: [{
    name: SEMANTIC_CRITIC_OUTPUT_FUNCTION_NAME,
    description: "Return the bounded semantic fidelity verdict.",
    parametersJsonSchema: SEMANTIC_CRITIC_PROVIDER_SCHEMA,
  }] }],
  toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [SEMANTIC_CRITIC_OUTPUT_FUNCTION_NAME] } },
  generationConfig: { temperature: 0 },
});

export class GeminiSemanticCriticProvider {
  constructor(private readonly options: {
    apiKey: string;
    model: string;
    maxAttempts?: number;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    gate?: RollingSingleConcurrencyGate;
    sleepImpl?: (milliseconds: number) => Promise<void>;
  }) {
    if (options.model !== EXPECTED_HYBRID_MODEL_IDENTITY) {
      throw new ScientificInterpretationTechnicalError(
        "HYBRID_RUNTIME_UNAVAILABLE",
        `MODEL_IDENTITY_DRIFT: expected ${EXPECTED_HYBRID_MODEL_IDENTITY}, received ${options.model}`,
      );
    }
  }

  async execute(input: {
    contribution: ScientificInterpretationContributionEnvelope;
    groundingContext: SemanticCriticGroundingContext;
    candidate: SemanticCriticCandidateSnapshot;
  }): Promise<SemanticCriticNativeExecution> {
    const id = `semantic-critic-operation:${logicalDigest({
      contribution: input.contribution.identity.contributionDigest,
      grounding: logicalDigest(input.groundingContext),
      candidate: input.candidate.candidateDigest,
      createdAt: new Date().toISOString(),
      nonce: Math.random(),
    })}`;
    const maxAttempts = Math.max(1, Math.min(this.options.maxAttempts ?? 2, 2));
    const gate = this.options.gate ?? providerGateForCurrentPolicy();
    const sleep = this.options.sleepImpl ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
    const rawAttempts: Array<{ attempt: number; httpStatus: number | null; providerBodyText: string | null; error: string | null }> = [];
    const attempts: SemanticCriticNativeExecution["attempts"] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await gate.run(async () => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 45_000);
          try {
            return await (this.options.fetchImpl ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.options.model)}:generateContent`, {
              method: "POST",
              headers: { "content-type": "application/json", "x-goog-api-key": this.options.apiKey },
              body: JSON.stringify(buildGeminiSemanticCriticProviderPayload(input)),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timer);
          }
        });
        const providerBodyText = await response.text();
        rawAttempts.push({ attempt, httpStatus: response.status, providerBodyText, error: null });
        const retryable = retryableStatus(response.status);
        if (!response.ok) {
          if (retryable && attempt < maxAttempts) {
            const waitDurationMs = retryAfterMilliseconds(response);
            attempts.push({ attempt, httpStatus: response.status, outcome: "FAILED", retryable: true, waitDurationMs });
            await sleep(waitDurationMs);
            continue;
          }
          attempts.push({ attempt, httpStatus: response.status, outcome: "FAILED", retryable, waitDurationMs: 0 });
          return { operationId: id, provider: "GOOGLE_GEMINI", model: this.options.model, rawOutput: { operationId: id, rawAttempts }, attempts, technicalFailure: `SEMANTIC_CRITIC_PROVIDER_HTTP_${response.status}` };
        }
        attempts.push({ attempt, httpStatus: response.status, outcome: "SUCCESS", retryable: false, waitDurationMs: 0 });
        return { operationId: id, provider: "GOOGLE_GEMINI", model: this.options.model, rawOutput: { operationId: id, rawAttempts }, attempts, technicalFailure: null };
      } catch (caught) {
        const timeout = caught instanceof Error && caught.name === "AbortError";
        rawAttempts.push({ attempt, httpStatus: null, providerBodyText: null, error: timeout ? "TIMEOUT" : "NETWORK_FAILURE" });
        if (attempt < maxAttempts) {
          const waitDurationMs = 60_000;
          attempts.push({ attempt, httpStatus: null, outcome: "FAILED", retryable: true, waitDurationMs });
          await sleep(waitDurationMs);
          continue;
        }
        attempts.push({ attempt, httpStatus: null, outcome: "FAILED", retryable: true, waitDurationMs: 0 });
        return { operationId: id, provider: "GOOGLE_GEMINI", model: this.options.model, rawOutput: { operationId: id, rawAttempts }, attempts, technicalFailure: timeout ? "SEMANTIC_CRITIC_PROVIDER_TIMEOUT" : "SEMANTIC_CRITIC_PROVIDER_NETWORK_FAILURE" };
      }
    }
    return { operationId: id, provider: "GOOGLE_GEMINI", model: this.options.model, rawOutput: { operationId: id, rawAttempts }, attempts, technicalFailure: "SEMANTIC_CRITIC_PROVIDER_ATTEMPTS_EXHAUSTED" };
  }
}
