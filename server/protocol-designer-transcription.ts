import { resolveOpenAIProviderRuntimeConfiguration } from "./protocol-designer-openai-provider-config.js";

export type TranscriptionApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
export type TranscriptionApiResponse = {
  status(code: number): TranscriptionApiResponse;
  setHeader(name: string, value: string): void;
  json(value: unknown): void;
};

const OPENAI_TRANSCRIPTIONS_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_TRANSCRIPTION_MODEL = "gpt-4o-transcribe";
const MAX_AUDIO_BYTES = 3_000_000;
const PROVIDER_TIMEOUT_MS = 60_000;
export const PROTOCOL_DESIGNER_TRANSCRIPTION_OPERATION = "TRANSCRIBE_VOICE_INPUT" as const;
const ALLOWED_MIME_TYPES = new Set([
  "audio/webm", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/mpga", "audio/m4a",
  "audio/ogg", "audio/wav", "audio/x-wav", "audio/flac", "audio/aac",
]);
const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/mp3": "mp3",
  "audio/mpga": "mpga", "audio/m4a": "m4a", "audio/ogg": "ogg", "audio/wav": "wav",
  "audio/x-wav": "wav", "audio/flac": "flac", "audio/aac": "aac",
};

const header = (headers: TranscriptionApiRequest["headers"], name: string) => {
  const value = Object.entries(headers).find(([key]) => key.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"))?.[1];
  return Array.isArray(value) ? value[0] : value;
};

const validOrigin = (headers: TranscriptionApiRequest["headers"]) => {
  const origin = header(headers, "origin");
  const host = header(headers, "x-forwarded-host") ?? header(headers, "host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
};

const normalizedMimeType = (value: unknown) => typeof value === "string"
  ? value.split(";", 1)[0].trim().toLocaleLowerCase("en-US") : "";

const requestObject = (body: unknown) => {
  let parsed = body;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { return null; }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as Record<string, unknown>;
};

export const isProtocolDesignerTranscriptionRequest = (body: unknown) => (
  requestObject(body)?.operation === PROTOCOL_DESIGNER_TRANSCRIPTION_OPERATION
);

const parseRequestBody = (body: unknown) => {
  const value = requestObject(body);
  if (!value || Object.keys(value).sort().join(",") !== "audioBase64,language,mimeType,operation"
    || value.operation !== PROTOCOL_DESIGNER_TRANSCRIPTION_OPERATION
    || typeof value.audioBase64 !== "string" || typeof value.language !== "string") return null;
  const mimeType = normalizedMimeType(value.mimeType);
  if (!ALLOWED_MIME_TYPES.has(mimeType) || !/^[a-z]{2}(?:-[A-Z]{2})?$/u.test(value.language)) return null;
  if (value.audioBase64.length > Math.ceil(MAX_AUDIO_BYTES * 4 / 3) + 4
    || !/^[A-Za-z0-9+/]*={0,2}$/u.test(value.audioBase64)) return null;
  const audio = Buffer.from(value.audioBase64, "base64");
  if (!audio.length || audio.length > MAX_AUDIO_BYTES) return null;
  return { audio, mimeType, language: value.language.slice(0, 2).toLocaleLowerCase("en-US") };
};

export const executeProtocolDesignerTranscription = async (input: Readonly<{
  audio: Uint8Array;
  mimeType: string;
  language: string;
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}>) => {
  const form = new FormData();
  const extension = EXTENSION_BY_MIME[input.mimeType] ?? "webm";
  form.append("file", new Blob([input.audio], { type: input.mimeType }), `dictation.${extension}`);
  form.append("model", input.model?.trim() || DEFAULT_TRANSCRIPTION_MODEL);
  form.append("language", input.language);
  form.append("response_format", "json");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await (input.fetchImpl ?? fetch)(OPENAI_TRANSCRIPTIONS_ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${input.apiKey}` },
      body: form,
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object" || Array.isArray(body)
      || !("text" in body) || typeof body.text !== "string" || !body.text.trim()) {
      throw new Error("TRANSCRIPTION_PROVIDER_FAILED");
    }
    return body.text;
  } finally {
    clearTimeout(timer);
  }
};

export const handleProtocolDesignerTranscription = async (
  request: TranscriptionApiRequest,
  response: TranscriptionApiResponse,
  environment: Record<string, string | undefined> = process.env,
  dependencies: Readonly<{ fetchImpl?: typeof fetch }> = {},
) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  if (request.method !== "POST") return response.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
  if (!(header(request.headers, "content-type") ?? "").toLocaleLowerCase("en-US").startsWith("application/json")) {
    return response.status(415).json({ error: { code: "INVALID_CONTENT_TYPE" } });
  }
  if (!validOrigin(request.headers)) return response.status(403).json({ error: { code: "ORIGIN_NOT_ALLOWED" } });
  const parsed = parseRequestBody(request.body);
  if (!parsed) return response.status(400).json({ error: { code: "INVALID_AUDIO_REQUEST" } });
  try { resolveOpenAIProviderRuntimeConfiguration(environment); }
  catch { return response.status(503).json({ error: { code: "TRANSCRIPTION_CONFIGURATION_INVALID" } }); }
  // STT is an independent, still-active OpenAI consumer. Azure generation no
  // longer needs this credential; audio transport and browser isolation remain unchanged.
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) return response.status(503).json({ error: { code: "TRANSCRIPTION_UNAVAILABLE" } });
  try {
    const text = await executeProtocolDesignerTranscription({ ...parsed, apiKey,
      model: environment.OPENAI_TRANSCRIPTION_MODEL, fetchImpl: dependencies.fetchImpl });
    return response.status(200).json({ text });
  } catch (error) {
    const code = error instanceof DOMException && error.name === "AbortError"
      ? "TRANSCRIPTION_TIMEOUT" : "TRANSCRIPTION_FAILED";
    return response.status(code === "TRANSCRIPTION_TIMEOUT" ? 504 : 502).json({ error: { code } });
  }
};

export default handleProtocolDesignerTranscription;
