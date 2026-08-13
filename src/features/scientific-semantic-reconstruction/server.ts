import { detectSensitiveData } from "@/features/protocol-designer/intake/privacy";
import { canonicalizeSemanticReconstruction, createDegradedSemanticModel } from "./canonical";
import { MAX_SEMANTIC_REQUEST_BYTES, parseSemanticReconstructionRequest } from "./schema";
import { runSemanticCriticCycles } from "./coverage";
import type { ScientificSemanticProvider, SemanticApiError, SemanticReconstructionResponse } from "./types";

export type SemanticHttpRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body: unknown; ip?: string };
export type SemanticHttpResponse = { status: number; headers: Record<string, string>; body: SemanticReconstructionResponse | SemanticApiError };
export type SemanticServerDependencies = { provider?: ScientificSemanticProvider | null; now?: () => number };

const buckets = new Map<string, { start: number; count: number }>();
const MAX_PER_MINUTE = 12;
const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const failure = (status: number, code: SemanticApiError["error"]["code"], message: string, retryable = false): SemanticHttpResponse => ({ status, headers, body: { error: { code, message, retryable } } });
const header = (input: SemanticHttpRequest["headers"], name: string) => {
  const value = Object.entries(input).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(value) ? value[0] : value;
};
const validOrigin = (input: SemanticHttpRequest["headers"]) => {
  const origin = header(input, "origin");
  const host = header(input, "x-forwarded-host") ?? header(input, "host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
};

export const resetSemanticRateLimitForTests = () => buckets.clear();

export const processScientificSemanticHttp = async (request: SemanticHttpRequest, dependencies: SemanticServerDependencies = {}): Promise<SemanticHttpResponse> => {
  if (request.method !== "POST") return failure(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.");
  if (!(header(request.headers, "content-type") ?? "").toLowerCase().startsWith("application/json")) return failure(415, "INVALID_CONTENT_TYPE", "Un corps JSON est requis.");
  if (!validOrigin(request.headers)) return failure(403, "ORIGIN_NOT_ALLOWED", "Origine non autorisée.");
  let body: unknown = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return failure(400, "INVALID_REQUEST", "JSON invalide."); }
  }
  const bytes = new TextEncoder().encode(JSON.stringify(body)).byteLength;
  if (bytes > MAX_SEMANTIC_REQUEST_BYTES) return failure(413, "PAYLOAD_TOO_LARGE", "Conversation trop volumineuse.");
  const parsed = parseSemanticReconstructionRequest(body);
  if (!parsed.success) return failure(400, "INVALID_REQUEST", "Contrat de reconstruction sémantique invalide.");
  const userMessages = parsed.data.messages.filter((item) => item.role === "USER");
  if (userMessages.some((item) => detectSensitiveData(item.content).length)) return failure(422, "LOCAL_SAFETY_BLOCKED", "Retirez toute donnée personnelle, patient ou confidentielle.");

  const nowMs = dependencies.now?.() ?? Date.now();
  const clientId = request.ip ?? header(request.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const bucket = buckets.get(clientId);
  if (!bucket || nowMs - bucket.start >= 60_000) buckets.set(clientId, { start: nowMs, count: 1 });
  else if (bucket.count >= MAX_PER_MINUTE) return failure(429, "RATE_LIMITED", "Limite temporaire atteinte.", true);
  else bucket.count += 1;

  if (!dependencies.provider) return { status: 200, headers, body: { mode: "DEGRADED", providerStatus: "UNAVAILABLE", model: createDegradedSemanticModel(parsed.data) } };
  try {
    const reconstruction = await dependencies.provider.reconstruct(parsed.data);
    const critique = await runSemanticCriticCycles(dependencies.provider, parsed.data, reconstruction.candidate);
    const finalCritic = critique.critics.at(-1);
    const finalCriticCallId = critique.callIds.at(-1);
    if (!finalCritic || !finalCriticCallId) throw new Error("SEMANTIC_CRITIC_RESULT_MISSING");
    const model = canonicalizeSemanticReconstruction({
      request: parsed.data,
      candidate: critique.candidate,
      critic: finalCritic,
      metadata: dependencies.provider.metadata,
      reconstructionCallId: reconstruction.callId,
      criticCallId: finalCriticCallId,
      criticCallIds: critique.callIds,
      critics: critique.critics,
      reconstructionAttempts: reconstruction.attempts,
      criticAttempts: critique.attempts,
    });
    return { status: 200, headers, body: { mode: "LIVE_LLM", providerStatus: "AVAILABLE", model } };
  } catch (caught) {
    const failedValidation = caught instanceof Error && caught.message.includes("CANONICALIZATION");
    return { status: 200, headers, body: { mode: "DEGRADED", providerStatus: failedValidation ? "FAILED_VALIDATION" : "FAILED_CALL", model: createDegradedSemanticModel(parsed.data) } };
  }
};
