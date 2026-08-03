import { SCIENTIFIC_INTAKE_SYSTEM_PROMPT } from "../../../../api/prompts/scientific-intake-system-prompt";
import { detectSensitiveData } from "./privacy";
import { normalizeInterpretation } from "./normalizer";
import { MAX_REQUEST_BYTES, parseScientificIntakeProviderOutput, parseScientificIntakeRequest, SCIENTIFIC_INTAKE_JSON_SCHEMA } from "./schema";
import type { IntakeApiError, ScientificIntakeInterpretation, ScientificIntakeRequest } from "./types";

export type IntakeHttpRequest = { method?: string; headers: Record<string, string | string[] | undefined>; body: unknown; ip?: string };
export type IntakeHttpResponse = { status: number; headers: Record<string, string>; body: ScientificIntakeInterpretation | IntakeApiError };
export type IntakeServerDependencies = { apiKey?: string; model?: string; fetchImpl?: typeof fetch; now?: () => number; timeoutMs?: number };

const buckets = new Map<string, { start: number; count: number }>();
const MAX_PER_MINUTE = 10;

const error = (status: number, code: IntakeApiError["error"]["code"], message: string, retryable = false): IntakeHttpResponse => ({
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  body: { error: { code, message, retryable } },
});

const header = (headers: IntakeHttpRequest["headers"], name: string) => {
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return Array.isArray(found) ? found[0] : found;
};

const validOrigin = (headers: IntakeHttpRequest["headers"]) => {
  const origin = header(headers, "origin");
  const host = header(headers, "x-forwarded-host") ?? header(headers, "host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
};

const providerText = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const candidates = (value as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") || null;
};

export const resetIntakeRateLimitForTests = () => buckets.clear();

export const processScientificIntakeHttp = async (request: IntakeHttpRequest, deps: IntakeServerDependencies = {}): Promise<IntakeHttpResponse> => {
  const baseHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
  if (request.method !== "POST") return error(405, "METHOD_NOT_ALLOWED", "Méthode non autorisée.");
  if (!(header(request.headers, "content-type") ?? "").toLowerCase().startsWith("application/json")) return error(415, "INVALID_CONTENT_TYPE", "Un corps JSON est requis.");
  if (!validOrigin(request.headers)) return error(403, "ORIGIN_NOT_ALLOWED", "Origine non autorisée.");

  let byteLength = Number(header(request.headers, "content-length") ?? 0);
  if (!Number.isFinite(byteLength) || byteLength < 0) byteLength = 0;
  if (!byteLength) {
    try { byteLength = new TextEncoder().encode(typeof request.body === "string" ? request.body : JSON.stringify(request.body)).byteLength; }
    catch { return error(400, "INVALID_REQUEST", "Requête invalide."); }
  }
  if (byteLength > MAX_REQUEST_BYTES) return error(413, "PAYLOAD_TOO_LARGE", "Question trop volumineuse.");

  let body: unknown = request.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return error(400, "INVALID_REQUEST", "JSON invalide."); }
  }
  const parsedRequest = parseScientificIntakeRequest(body);
  if (!parsedRequest.success) return error(400, "INVALID_REQUEST", "Question ou contrat d’intake invalide.");
  if (detectSensitiveData(parsedRequest.data.question).length) return error(422, "LOCAL_SAFETY_BLOCKED", "Retirez toute donnée personnelle, patient ou confidentielle.");

  const now = deps.now?.() ?? Date.now();
  const clientId = request.ip ?? header(request.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const current = buckets.get(clientId);
  if (!current || now - current.start >= 60_000) buckets.set(clientId, { start: now, count: 1 });
  else if (current.count >= MAX_PER_MINUTE) return error(429, "RATE_LIMITED", "Limite temporaire atteinte.", true);
  else current.count += 1;

  const apiKey = deps.apiKey?.trim();
  const model = deps.model?.trim();
  if (!apiKey || !model) return error(503, "API_UNAVAILABLE", "Interprétation linguistique indisponible.", true);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), deps.timeoutMs ?? 8_000);
  try {
    const response = await (deps.fetchImpl ?? fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SCIENTIFIC_INTAKE_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(parsedRequest.data) }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseJsonSchema: SCIENTIFIC_INTAKE_JSON_SCHEMA },
      }),
      signal: controller.signal,
    });
    if (response.status === 429) return error(429, "QUOTA_EXCEEDED", "Quota linguistique temporairement indisponible.", true);
    if (response.status === 404) return error(503, "MODEL_UNAVAILABLE", "Modèle linguistique indisponible.", true);
    if (!response.ok) return error(502, "PROVIDER_ERROR", "Le service linguistique n’a pas répondu correctement.", true);
    const raw = await response.json().catch(() => null);
    const text = providerText(raw);
    if (!text) return error(502, "INVALID_PROVIDER_RESPONSE", "Réponse linguistique invalide.");
    let json: unknown;
    try { json = JSON.parse(text); } catch { return error(502, "INVALID_PROVIDER_RESPONSE", "Réponse linguistique invalide."); }
    const parsed = parseScientificIntakeProviderOutput(json, parsedRequest.data as ScientificIntakeRequest);
    if (!parsed.success) return error(502, "INVALID_PROVIDER_RESPONSE", "Réponse linguistique invalide.");
    try {
      return { status: 200, headers: baseHeaders, body: normalizeInterpretation(parsed.data as ScientificIntakeInterpretation, parsedRequest.data as ScientificIntakeRequest) };
    } catch {
      return error(502, "INVALID_PROVIDER_RESPONSE", "Réponse linguistique non fondée dans la question.");
    }
  } catch (caught) {
    return caught instanceof DOMException && caught.name === "AbortError"
      ? error(504, "TIMEOUT", "Le service linguistique a dépassé le délai autorisé.", true)
      : error(502, "PROVIDER_ERROR", "Le service linguistique est momentanément indisponible.", true);
  } finally { clearTimeout(timeout); }
};
