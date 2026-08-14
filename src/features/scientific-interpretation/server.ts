import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { DEFAULT_SCIENTIFIC_INTERPRETATION_MODE, ScientificInterpretationTechnicalError, type ScientificInterpretationMode } from "./contracts";
import { executeScientificInterpretation, type ScientificInterpretationExecution } from "./runtime";
import { SCIENTIFIC_INTERPRETATION_API_VERSION, parseScientificInterpretationApiRequest, type ScientificInterpretationApiFailure, type ScientificInterpretationApiResponse } from "./transport";
import { projectScientificContributionToV1IfAllowed } from "./v1-compatibility";

export type ScientificInterpretationHttpRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body: unknown; ip?: string };
export type ScientificInterpretationHttpResponse = { status: number; headers: Record<string, string>; body: ScientificInterpretationApiResponse | ScientificInterpretationApiFailure };

const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const buckets = new Map<string, { start: number; count: number }>();
const MAX_PER_MINUTE = 10;
const MAX_REQUEST_BYTES = 300_000;

const header = (input: ScientificInterpretationHttpRequest["headers"], name: string) => {
  const value = Object.entries(input).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
};
const validOrigin = (input: ScientificInterpretationHttpRequest["headers"]) => {
  const origin = header(input, "origin");
  const host = header(input, "x-forwarded-host") ?? header(input, "host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
};

const failure = (
  status: number,
  code: ScientificInterpretationApiFailure["error"]["code"],
  message: string,
  mode: ScientificInterpretationMode,
  retryable = false,
  rawOutputRef: string | null = null,
  operationId: string | null = null,
): ScientificInterpretationHttpResponse => ({
  status,
  headers,
  body: {
    apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION,
    technicalStatus: "FAIL_CLOSED",
    runtimeMode: mode,
    contributionId: null,
    fallbackUsed: false,
    auditStatus: "NOT_COMPLETED",
    reviewRequired: true,
    projectionDisposition: "FAIL_CLOSED",
    projectWrites: 0,
    error: { code, message, retryable, rawOutputRef, operationId },
  },
});

export const resetScientificInterpretationRateLimitForTests = () => buckets.clear();

export const processScientificInterpretationHttp = async (
  request: ScientificInterpretationHttpRequest,
  dependencies: {
    execute: (input: ReturnType<typeof parseScientificInterpretationApiRequest> & {}) => Promise<ScientificInterpretationExecution>;
    mode?: ScientificInterpretationMode;
    now?: () => number;
  },
): Promise<ScientificInterpretationHttpResponse> => {
  const mode = dependencies.mode ?? DEFAULT_SCIENTIFIC_INTERPRETATION_MODE;
  if (request.method !== "POST") return failure(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.", mode);
  if (!(header(request.headers, "content-type") ?? "").toLowerCase().startsWith("application/json")) return failure(415, "INVALID_CONTENT_TYPE", "Un corps JSON est requis.", mode);
  if (!validOrigin(request.headers)) return failure(403, "ORIGIN_NOT_ALLOWED", "Origine non autorisée.", mode);
  let body: unknown = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return failure(400, "INVALID_REQUEST", "JSON invalide.", mode); }
  }
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_REQUEST_BYTES) return failure(413, "PAYLOAD_TOO_LARGE", "Conversation trop volumineuse.", mode);
  const parsed = parseScientificInterpretationApiRequest(body);
  if (!parsed) return failure(400, "INVALID_REQUEST", "Contrat Scientific Interpretation invalide.", mode);
  const userTurns = parsed.conversation.turns.filter((turn) => turn.role === "USER");
  if (userTurns.some((turn) => detectSensitiveData(turn.content).length)) return failure(422, "LOCAL_SAFETY_BLOCKED", "Retirez toute donnée personnelle, patient ou confidentielle.", mode);

  const now = dependencies.now?.() ?? Date.now();
  const clientId = request.ip ?? header(request.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const bucket = buckets.get(clientId);
  if (!bucket || now - bucket.start >= 60_000) buckets.set(clientId, { start: now, count: 1 });
  else if (bucket.count >= MAX_PER_MINUTE) return failure(429, "RATE_LIMITED", "Limite temporaire atteinte.", mode, true);
  else bucket.count += 1;

  try {
    const execution = await dependencies.execute(parsed);
    const projection = projectScientificContributionToV1IfAllowed(execution.activeContribution);
    const critical = execution.activeContribution.audit.unresolvedFindings.some((item) => item.status === "OPEN" && item.severity === "CRITICAL");
    return {
      status: 200,
      headers,
      body: {
        apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION,
        technicalStatus: execution.fallbackUsed ? "FALLBACK_ACTIVE" : "AVAILABLE",
        runtimeMode: execution.mode,
        contributionId: execution.activeContribution.identity.contributionId,
        fallbackUsed: execution.fallbackUsed,
        fallback: execution.fallback,
        auditStatus: critical ? "CRITICAL_FINDINGS" : "COMPLETE",
        reviewRequired: projection.disposition !== "ACCEPTED_FOR_V1_PROJECTION",
        projectionDisposition: projection.disposition,
        contribution: execution.activeContribution,
        v1Projection: projection.projection,
        projectWrites: 0,
        semanticAuditLExecuted: false,
        adjudicatorExecuted: false,
        diagnostics: execution.diagnostics,
      },
    };
  } catch (caught) {
    if (caught instanceof ScientificInterpretationTechnicalError) {
      return failure(503, caught.failureClass, caught.message, mode, ["PROVIDER_FAILURE", "TRANSPORT_FAILURE", "HYBRID_RUNTIME_UNAVAILABLE"].includes(caught.failureClass), caught.rawOutputRef, caught.operationId);
    }
    return failure(503, "HYBRID_RUNTIME_UNAVAILABLE", caught instanceof Error ? caught.message : "HYBRID_RUNTIME_UNAVAILABLE", mode);
  }
};
