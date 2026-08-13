import { SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT } from "../../../api/prompts/scientific-semantic-reconstruction-prompt.js";
import { SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT } from "../../../api/prompts/scientific-semantic-atomic-composition-prompt.js";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import {
  makeAtomicCompositionAuditContext,
  parseSemanticAtomicCompositionAudit,
  parseSemanticAtomicCompositionTransport,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
} from "./atomic-composition";
import { parseSemanticCriticResult, parseSemanticReconstructionCandidate, SEMANTIC_CRITIC_JSON_SCHEMA, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA } from "./schema";
import type {
  ScientificSemanticProvider,
  SemanticProviderAttempt,
  SemanticProviderFailureCategory,
  SemanticProviderMetadata,
  ExplicitCoverageReport,
  RelationCoverageReport,
  SemanticIntegrityReport,
  SemanticTaxonomyReport,
  SemanticReconstructionCandidate,
  SemanticReconstructionRequest,
} from "./types";

type GoogleProviderError = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    details?: Array<Record<string, unknown>>;
  };
};

type ClassifiedFailure = {
  category: SemanticProviderFailureCategory;
  httpStatus: number | null;
  providerStatus: string | null;
  providerCode: string | null;
  providerError: string;
  retryable: boolean;
  retryAfterMs: number | null;
};

export type SemanticProviderDiagnostic = {
  rawProviderOutput: string | null;
  validationIssues: Array<{ path: string; code: string; message: string }>;
  structuredOutputClassification?: "PARSER_FAILURE" | "MODEL_STRUCTURE_NON_COMPLIANCE" | "MODEL_ENUM_NON_COMPLIANCE" | "INTERNAL_INVARIANT_FAILURE";
  transportValid?: boolean;
  internalValid?: boolean;
};

export class SemanticProviderError extends Error {
  readonly reason: SemanticProviderFailureCategory;

  constructor(
    public readonly category: SemanticProviderFailureCategory,
    public readonly attempts: SemanticProviderAttempt[] = [],
    public readonly details: Omit<ClassifiedFailure, "category"> | null = null,
    public readonly diagnostic: SemanticProviderDiagnostic | null = null,
  ) {
    super(`SEMANTIC_PROVIDER_${category}`);
    this.name = "SemanticProviderError";
    this.reason = category;
  }
}

const responseText = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const candidates = (value as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") || null;
};

const providerContext = (request: SemanticReconstructionRequest) => ({
  schemaVersion: request.schemaVersion,
  language: request.language,
  messages: request.messages,
  previousModel: request.previousModel ? {
    semanticModelId: request.previousModel.semanticModelId,
    revision: request.previousModel.revision,
    status: request.previousModel.status,
    normalizedMeaning: request.previousModel.normalizedMeaning,
    elements: request.previousModel.elements,
    relations: request.previousModel.relations,
    ambiguities: request.previousModel.ambiguities,
    unknowns: request.previousModel.unknowns,
  } : null,
});

const boundedText = (value: unknown, fallback: string) => {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  return (text || fallback).slice(0, 800);
};

const retryAfterMs = (response: Response) => {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
};

const googleError = (body: unknown) => (body && typeof body === "object" ? body as GoogleProviderError : null)?.error;

const hasRetryInfo = (body: unknown) => Boolean(googleError(body)?.details?.some((detail) =>
  String(detail["@type"] ?? "").includes("RetryInfo") || "retryDelay" in detail));

const retryInfoDelayMs = (body: unknown): number | null => {
  const detail = googleError(body)?.details?.find((item) =>
    String(item["@type"] ?? "").includes("RetryInfo") || "retryDelay" in item);
  const raw = detail?.retryDelay;
  if (typeof raw !== "string") return null;
  const seconds = Number(raw.replace(/s$/, ""));
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1_000) : null;
};

const hasZeroQuota = (body: unknown) => Boolean(googleError(body)?.details?.some((detail) =>
  JSON.stringify(detail).includes('"quotaValue":"0"') || JSON.stringify(detail).includes('"quotaValue":0')));

const classifyHttpFailure = (response: Response, body: unknown): ClassifiedFailure => {
  const error = googleError(body);
  const message = boundedText(error?.message, `Provider HTTP ${response.status}`);
  const searchable = `${error?.status ?? ""} ${message}`.toLocaleLowerCase("en-US");
  const status = response.status;
  const retryDelay = retryAfterMs(response) ?? retryInfoDelayMs(body);
  let category: SemanticProviderFailureCategory;
  let retryable = false;

  if (status === 401 || status === 403 || /unauthenticated|permission_denied|api key.*(invalid|expired|missing)/.test(searchable)) {
    category = "AUTHENTICATION";
  } else if ((status === 404 && /model/.test(searchable)) || /model.*(not found|does not exist|not supported|unsupported)/.test(searchable)) {
    category = "INVALID_MODEL";
  } else if (status === 429) {
    const quotaSignal = hasZeroQuota(body) || /insufficient quota|daily (?:quota|limit)|quota (?:is )?(?:exhausted|depleted)/.test(searchable);
    const transientSignal = !quotaSignal && (retryDelay !== null || hasRetryInfo(body) || /rate|per minute|requests per minute|retry in|too many requests/.test(searchable));
    category = transientSignal ? "RATE_LIMIT" : "QUOTA";
    retryable = transientSignal;
  } else if (status === 413 || (/prompt|input|request/.test(searchable) && /too (large|long)|token limit|context length/.test(searchable))) {
    category = "PROMPT_TOO_LARGE";
  } else if (status === 400 && /response.*schema|responsejsonschema|json schema|schema.*(invalid|unsupported|reject)/.test(searchable)) {
    category = "SCHEMA_REJECTION";
  } else if (status >= 500) {
    category = "SERVER_ERROR";
    retryable = true;
  } else if (status >= 400 && status < 500) {
    category = "CLIENT_ERROR";
  } else {
    category = "UNKNOWN_PROVIDER_FAILURE";
  }

  return {
    category,
    httpStatus: status,
    providerStatus: error?.status ?? null,
    providerCode: error?.code === undefined ? null : String(error.code),
    providerError: message,
    retryable,
    retryAfterMs: retryDelay,
  };
};

const safetyFailure = (body: unknown): ClassifiedFailure | null => {
  if (!body || typeof body !== "object") return null;
  const value = body as {
    promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
    candidates?: Array<{ finishReason?: string }>;
  };
  const reason = value.promptFeedback?.blockReason ?? value.candidates?.[0]?.finishReason ?? "";
  if (!/SAFETY|BLOCKLIST|PROHIBITED|RECITATION/.test(reason)) return null;
  return {
    category: "SAFETY_REFUSAL",
    httpStatus: 200,
    providerStatus: reason,
    providerCode: null,
    providerError: boundedText(value.promptFeedback?.blockReasonMessage, "Provider safety refusal."),
    retryable: false,
    retryAfterMs: null,
  };
};

const invalidOutputFailure = (message: string): ClassifiedFailure => ({
  category: "INVALID_STRUCTURED_OUTPUT",
  httpStatus: 200,
  providerStatus: null,
  providerCode: null,
  providerError: message,
  retryable: false,
  retryAfterMs: null,
});

const schemaDiagnostic = (
  caught: unknown,
  rawProviderOutput: string,
  stage?: "TRANSPORT" | "INTERNAL",
): SemanticProviderDiagnostic => {
  if (!caught || typeof caught !== "object" || !("issues" in caught) || !Array.isArray(caught.issues)) {
    return { rawProviderOutput, validationIssues: [], ...(stage ? {
      structuredOutputClassification: stage === "TRANSPORT" ? "MODEL_STRUCTURE_NON_COMPLIANCE" as const : "INTERNAL_INVARIANT_FAILURE" as const,
      transportValid: stage === "INTERNAL",
      internalValid: false,
    } : {}) };
  }
  const validationIssues = caught.issues.slice(0, 50).map((issue) => {
    if (!issue || typeof issue !== "object") return { path: "root", code: "unknown", message: "Unknown validation issue." };
    const material = issue as { path?: Array<string | number>; code?: string; message?: string };
    return {
      path: material.path?.join(".") || "root",
      code: material.code ?? "unknown",
      message: boundedText(material.message, "Validation issue."),
    };
  });
  const enumFailure = validationIssues.some((issue) => issue.code === "invalid_value" || issue.code === "invalid_enum_value");
  return { rawProviderOutput, validationIssues, ...(stage ? {
    structuredOutputClassification: stage === "TRANSPORT"
      ? (enumFailure ? "MODEL_ENUM_NON_COMPLIANCE" as const : "MODEL_STRUCTURE_NON_COMPLIANCE" as const)
      : "INTERNAL_INVARIANT_FAILURE" as const,
    transportValid: stage === "INTERNAL",
    internalValid: false,
  } : {}) };
};

const diagnosticSummary = (fallback: string, diagnostic: SemanticProviderDiagnostic) => diagnostic.validationIssues.length
  ? `${fallback} Issues: ${diagnostic.validationIssues.slice(0, 12).map((issue) => `${issue.path}:${issue.code}`).join(", ")}.`
  : fallback;

const attemptRecord = (
  attempt: number,
  startedAtMs: number,
  finishedAtMs: number,
  failure: ClassifiedFailure | null,
): SemanticProviderAttempt => ({
  attempt,
  requestStarted: new Date(startedAtMs).toISOString(),
  requestFinished: new Date(finishedAtMs).toISOString(),
  latencyMs: Math.max(0, finishedAtMs - startedAtMs),
  outcome: failure ? "FAILED" : "SUCCESS",
  category: failure?.category ?? null,
  httpStatus: failure?.httpStatus ?? 200,
  providerStatus: failure?.providerStatus ?? null,
  providerCode: failure?.providerCode ?? null,
  providerError: failure?.providerError ?? null,
  retryable: failure?.retryable ?? false,
});

const networkFailure = (caught: unknown): ClassifiedFailure => {
  const aborted = (typeof DOMException !== "undefined" && caught instanceof DOMException && caught.name === "AbortError")
    || (caught instanceof Error && caught.name === "AbortError");
  return {
    category: aborted ? "TIMEOUT" : "NETWORK",
    httpStatus: null,
    providerStatus: null,
    providerCode: null,
    providerError: aborted ? "Provider request timed out." : "Provider network request failed.",
    retryable: true,
    retryAfterMs: null,
  };
};

const structuredFailureAttempts = (
  attempts: SemanticProviderAttempt[],
  failure: ClassifiedFailure,
): SemanticProviderAttempt[] => {
  if (attempts.length === 0) return attempts;
  return attempts.map((attempt, index) => index === attempts.length - 1 ? {
    ...attempt,
    outcome: "FAILED" as const,
    category: failure.category,
    providerError: failure.providerError,
    retryable: false,
  } : attempt);
};

export class GeminiScientificSemanticProvider implements ScientificSemanticProvider {
  readonly metadata: SemanticProviderMetadata;

  constructor(private readonly options: {
    apiKey: string;
    model: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    temperature?: number;
    maxAttempts?: number;
    retryBaseMs?: number;
    maxRetryDelayMs?: number;
    retryJitterRatio?: number;
    sleepImpl?: (milliseconds: number) => Promise<void>;
    nowMs?: () => number;
    randomImpl?: () => number;
    beforeAttempt?: () => Promise<void>;
  }) {
    this.metadata = { provider: "GOOGLE_GEMINI", model: options.model, temperature: options.temperature ?? null };
  }

  private nowMs() { return this.options.nowMs?.() ?? Date.now(); }

  private async wait(milliseconds: number) {
    if (milliseconds <= 0) return;
    if (this.options.sleepImpl) await this.options.sleepImpl(milliseconds);
    else await new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  }

  private retryDelay(attempt: number, providerDelay: number | null) {
    const exponential = (this.options.retryBaseMs ?? 1_500) * (2 ** Math.max(0, attempt - 1));
    const jitterRatio = Math.max(0, Math.min(this.options.retryJitterRatio ?? 0.2, 1));
    const jittered = exponential * (1 + (this.options.randomImpl?.() ?? Math.random()) * jitterRatio);
    return Math.min(this.options.maxRetryDelayMs ?? 30_000, Math.max(providerDelay ?? 0, jittered));
  }

  private async generate(systemPrompt: string, payload: unknown, schema: unknown) {
    if (!this.options.apiKey.trim()) throw new SemanticProviderError("AUTHENTICATION");
    if (!this.options.model.trim()) throw new SemanticProviderError("INVALID_MODEL");
    const attempts: SemanticProviderAttempt[] = [];
    const maxAttempts = Math.max(1, Math.min(this.options.maxAttempts ?? 3, 4));

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await this.options.beforeAttempt?.();
      const startedAtMs = this.nowMs();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30_000);
      let response: Response;

      try {
        response = await (this.options.fetchImpl ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.options.model)}:generateContent`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": this.options.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: schema,
              ...(this.metadata.temperature === null ? {} : { temperature: this.metadata.temperature }),
            },
          }),
          signal: controller.signal,
        });
      } catch (caught) {
        clearTimeout(timeout);
        const failure = networkFailure(caught);
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        if (attempt < maxAttempts) {
          await this.wait(this.retryDelay(attempt, null));
          continue;
        }
        throw new SemanticProviderError(failure.category, attempts, failure);
      }

      clearTimeout(timeout);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const failure = classifyHttpFailure(response, body);
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        if (failure.retryable && attempt < maxAttempts) {
          await this.wait(this.retryDelay(attempt, failure.retryAfterMs));
          continue;
        }
        throw new SemanticProviderError(failure.category, attempts, failure);
      }

      const refused = safetyFailure(body);
      if (refused) {
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), refused));
        throw new SemanticProviderError(refused.category, attempts, refused);
      }
      const text = responseText(body);
      if (!text) {
        const failure = invalidOutputFailure("Provider response did not contain structured text.");
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        throw new SemanticProviderError(failure.category, attempts, failure, {
          rawProviderOutput: null, validationIssues: [], structuredOutputClassification: "PARSER_FAILURE", transportValid: false, internalValid: false,
        });
      }
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        const failure = invalidOutputFailure("Provider response was not valid JSON.");
        attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), failure));
        throw new SemanticProviderError(failure.category, attempts, failure, {
          rawProviderOutput: text,
          validationIssues: [{ path: "root", code: "invalid_json", message: "Provider response was not valid JSON." }],
          structuredOutputClassification: "PARSER_FAILURE", transportValid: false, internalValid: false,
        });
      }
      attempts.push(attemptRecord(attempt, startedAtMs, this.nowMs(), null));
      return { callId: `gemini-call:${logicalDigest(body)}`, json, rawProviderOutput: text, attempts };
    }

    throw new SemanticProviderError("UNKNOWN_PROVIDER_FAILURE", attempts);
  }

  async reconstruct(request: SemanticReconstructionRequest) {
    const context = providerContext(request);
    const result = await this.generate(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT, context, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA);
    try {
      return { callId: result.callId, candidate: parseSemanticReconstructionCandidate(result.json), attempts: result.attempts };
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput);
      const correction = diagnosticSummary("The previous structured reconstruction was invalid. Return the same scientific meaning while satisfying every schema and exact source-grounding constraint; never fill or remove scientific content silently.", diagnostic);
      const retried = await this.generate(SCIENTIFIC_SEMANTIC_RECONSTRUCTION_PROMPT, { ...context, structuredValidationCorrection: correction }, SEMANTIC_RECONSTRUCTION_JSON_SCHEMA);
      try {
        return { callId: retried.callId, candidate: parseSemanticReconstructionCandidate(retried.json), attempts: [...(result.attempts ?? []), ...(retried.attempts ?? [])] };
      } catch (retryCaught) {
        const retryDiagnostic = schemaDiagnostic(retryCaught, retried.rawProviderOutput);
        const failure = invalidOutputFailure(diagnosticSummary("Structured reconstruction did not satisfy the SEM contract after one bounded correction attempt.", retryDiagnostic));
        throw new SemanticProviderError(failure.category, structuredFailureAttempts([...(result.attempts ?? []), ...(retried.attempts ?? [])], failure), failure, retryDiagnostic);
      }
    }
  }

  async critique(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    coverage: { explicit: ExplicitCoverageReport; relations: RelationCoverageReport; taxonomy: SemanticTaxonomyReport; integrity?: SemanticIntegrityReport; cycle: 1 | 2 },
  ) {
    const criticPayload = {
      ...providerContext(request),
      criticCycle: coverage.cycle,
      semanticInventory: candidate.semanticInventory,
      typedCandidate: candidate,
      explicitCoverageReport: coverage.explicit,
      relationCoverageReport: coverage.relations,
      taxonomyReport: coverage.taxonomy,
      integrityReport: coverage.integrity ?? { status: "COMPLETE", findings: [] },
      ambiguities: candidate.ambiguities,
      inferredCandidates: candidate.elements.filter((item) => item.epistemicStatus !== "EXPLICIT_USER_STATED"),
    };
    const result = await this.generate(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, criticPayload, SEMANTIC_CRITIC_JSON_SCHEMA);
    try {
      return { callId: result.callId, critic: parseSemanticCriticResult(result.json), attempts: result.attempts };
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput);
      const correction = diagnosticSummary("The previous structured critic output was invalid. Return exactly the 15 distinct required checklist entries once each and satisfy the response schema.", diagnostic);
      const retried = await this.generate(SCIENTIFIC_SEMANTIC_CRITIC_PROMPT, { ...criticPayload, structuredValidationCorrection: correction }, SEMANTIC_CRITIC_JSON_SCHEMA);
      try {
        return { callId: retried.callId, critic: parseSemanticCriticResult(retried.json), attempts: [...(result.attempts ?? []), ...(retried.attempts ?? [])] };
      } catch (retryCaught) {
        const retryDiagnostic = schemaDiagnostic(retryCaught, retried.rawProviderOutput);
        const failure = invalidOutputFailure(diagnosticSummary("Structured critic output did not satisfy the SEM contract after one bounded correction attempt.", retryDiagnostic));
        throw new SemanticProviderError(failure.category, structuredFailureAttempts([...(result.attempts ?? []), ...(retried.attempts ?? [])], failure), failure, retryDiagnostic);
      }
    }
  }

  async auditAtomicComposition(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    cycle: 1 | 2,
  ) {
    const context = makeAtomicCompositionAuditContext(request, candidate, cycle);
    const result = await this.generate(
      SCIENTIFIC_SEMANTIC_ATOMIC_COMPOSITION_AUDIT_PROMPT,
      context,
      SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
    );
    try {
      parseSemanticAtomicCompositionTransport(result.json);
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput, "TRANSPORT");
      const failure = invalidOutputFailure(diagnosticSummary("Structured audit did not satisfy the provider transport contract.", diagnostic));
      throw new SemanticProviderError(failure.category, structuredFailureAttempts(result.attempts, failure), failure, diagnostic);
    }
    try {
      return { callId: result.callId, audit: parseSemanticAtomicCompositionAudit(result.json), attempts: result.attempts };
    } catch (caught) {
      const diagnostic = schemaDiagnostic(caught, result.rawProviderOutput, "INTERNAL");
      const failure = invalidOutputFailure(diagnosticSummary("Structured audit satisfied transport but violated an internal semantic invariant.", diagnostic));
      throw new SemanticProviderError(failure.category, structuredFailureAttempts(result.attempts, failure), failure, diagnostic);
    }
  }
}
