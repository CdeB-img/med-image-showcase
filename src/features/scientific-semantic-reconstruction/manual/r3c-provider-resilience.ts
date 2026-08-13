import { SemanticProviderError } from "../provider";
import type {
  ExplicitCoverageReport,
  RelationCoverageReport,
  ScientificSemanticProvider,
  SemanticCriticResult,
  SemanticProviderAttempt,
  SemanticReconstructionCandidate,
  SemanticReconstructionRequest,
  SemanticTaxonomyReport,
} from "../types";

export const R3C_MAX_ATTEMPTS_PER_LLM_OPERATION = 5;
export const R3C_TRANSIENT_WAIT_MS = 60_000;

export type R3cProviderAttemptTrace = {
  caseId: string;
  stage: "CRITIC";
  cycle: 1 | 2;
  attempt: number;
  startedAt: string;
  finishedAt: string;
  providerStatus: string | null;
  httpStatus: number | null;
  providerErrorCode: string | null;
  category: string | null;
  waitDuration: number;
  finalDisposition: "SUCCESS" | "STRUCTURED_REGENERATION" | "RETRY_SCHEDULED" | "PROVIDER_CAPACITY_FAILURE" | "NON_RETRYABLE_FAILURE";
};

type CriticCoverage = {
  explicit: ExplicitCoverageReport;
  relations: RelationCoverageReport;
  taxonomy: SemanticTaxonomyReport;
  cycle: 1 | 2;
};

const isTransientRetryable = (caught: SemanticProviderError) => {
  if (["RATE_LIMIT", "TIMEOUT", "NETWORK"].includes(caught.category)) return true;
  if (caught.category !== "SERVER_ERROR") return false;
  const status = caught.details?.httpStatus;
  return status === null || status === undefined || [500, 502, 503, 504].includes(status);
};

const waitFor = (caught: SemanticProviderError) => {
  if (caught.category === "RATE_LIMIT" && caught.details?.retryAfterMs !== null && caught.details?.retryAfterMs !== undefined) {
    return Math.max(R3C_TRANSIENT_WAIT_MS, caught.details.retryAfterMs);
  }
  return R3C_TRANSIENT_WAIT_MS;
};

const terminalAttempt = (caught: SemanticProviderError): SemanticProviderAttempt => caught.attempts.at(-1) ?? {
  attempt: 1,
  requestStarted: new Date().toISOString(),
  requestFinished: new Date().toISOString(),
  latencyMs: 0,
  outcome: "FAILED",
  category: caught.category,
  httpStatus: caught.details?.httpStatus ?? null,
  providerStatus: caught.details?.providerStatus ?? null,
  providerCode: caught.details?.providerCode ?? null,
  providerError: caught.details?.providerError ?? caught.message,
  retryable: false,
};

export class R3cResilientSemanticProvider implements ScientificSemanticProvider {
  readonly metadata;

  constructor(
    private readonly delegate: ScientificSemanticProvider,
    private readonly options: {
      sleep?: (milliseconds: number) => Promise<void>;
      onAttempt?: (trace: R3cProviderAttemptTrace) => void;
    } = {},
  ) {
    this.metadata = delegate.metadata;
  }

  reconstruct(_request: SemanticReconstructionRequest): never {
    throw new Error("SEM001R3C_RECONSTRUCTION_FORBIDDEN");
  }

  async critique(
    request: SemanticReconstructionRequest,
    candidate: SemanticReconstructionCandidate,
    coverage: CriticCoverage,
  ): Promise<{ callId: string; critic: SemanticCriticResult; attempts?: SemanticProviderAttempt[] }> {
    const caseId = request.sessionId.split(":").at(-1) ?? "UNKNOWN_CASE";
    const attempts: SemanticProviderAttempt[] = [];
    let providerRequestAttempt = 0;

    for (let operationAttempt = 1; operationAttempt <= R3C_MAX_ATTEMPTS_PER_LLM_OPERATION; operationAttempt += 1) {
      try {
        const result = await this.delegate.critique(request, candidate, coverage);
        const delegateAttempts = result.attempts ?? [];
        attempts.push(...delegateAttempts);
        (delegateAttempts.length ? delegateAttempts : [null]).forEach((item, index, all) => {
          providerRequestAttempt += 1;
          const structuredRegeneration = index < all.length - 1;
          this.options.onAttempt?.({
            caseId,
            stage: "CRITIC",
            cycle: coverage.cycle,
            attempt: providerRequestAttempt,
            startedAt: item?.requestStarted ?? new Date().toISOString(),
            finishedAt: item?.requestFinished ?? new Date().toISOString(),
            providerStatus: item?.providerStatus ?? null,
            httpStatus: item?.httpStatus ?? 200,
            providerErrorCode: item?.providerCode ?? null,
            category: structuredRegeneration ? "INVALID_STRUCTURED_OUTPUT" : item?.category ?? null,
            waitDuration: 0,
            finalDisposition: structuredRegeneration ? "STRUCTURED_REGENERATION" : "SUCCESS",
          });
        });
        return { ...result, attempts };
      } catch (caught) {
        if (!(caught instanceof SemanticProviderError)) throw caught;
        const current = terminalAttempt(caught);
        attempts.push(...caught.attempts);
        const retryable = isTransientRetryable(caught);
        const shouldRetry = retryable && operationAttempt < R3C_MAX_ATTEMPTS_PER_LLM_OPERATION;
        const waitDuration = shouldRetry ? waitFor(caught) : 0;
        const failedAttempts = caught.attempts.length ? caught.attempts : [current];
        failedAttempts.forEach((item, index) => {
          providerRequestAttempt += 1;
          const structuredRegeneration = index < failedAttempts.length - 1;
          this.options.onAttempt?.({
            caseId,
            stage: "CRITIC",
            cycle: coverage.cycle,
            attempt: providerRequestAttempt,
            startedAt: item.requestStarted,
            finishedAt: item.requestFinished,
            providerStatus: item.providerStatus,
            httpStatus: item.httpStatus,
            providerErrorCode: item.providerCode,
            category: structuredRegeneration ? "INVALID_STRUCTURED_OUTPUT" : caught.category,
            waitDuration: structuredRegeneration ? 0 : waitDuration,
            finalDisposition: structuredRegeneration
              ? "STRUCTURED_REGENERATION"
              : shouldRetry
                ? "RETRY_SCHEDULED"
                : retryable
                  ? "PROVIDER_CAPACITY_FAILURE"
                  : "NON_RETRYABLE_FAILURE",
          });
        });
        if (!shouldRetry) {
          throw new SemanticProviderError(caught.category, attempts, caught.details, caught.diagnostic);
        }
        if (this.options.sleep) await this.options.sleep(waitDuration);
        else await new Promise<void>((resolve) => setTimeout(resolve, waitDuration));
      }
    }

    throw new Error("SEM001R3C_RETRY_BOUND_UNREACHABLE");
  }
}
