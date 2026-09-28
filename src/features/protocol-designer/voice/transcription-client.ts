import { VoiceDictationError } from "./voice-dictation-contract";

const TRANSCRIPTION_TIMEOUT_MS = 60_000;
const MAX_AUDIO_BYTES = 3_000_000;

const readBlob = (audio: Blob): Promise<ArrayBuffer> => {
  if (typeof audio.arrayBuffer === "function") return audio.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("AUDIO_READ_FAILED"));
    reader.onload = () => reader.result instanceof ArrayBuffer
      ? resolve(reader.result) : reject(new Error("AUDIO_READ_FAILED"));
    reader.readAsArrayBuffer(audio);
  });
};

const blobToBase64 = async (audio: Blob) => {
  const bytes = new Uint8Array(await readBlob(audio));
  let binary = "";
  const chunkSize = 32_768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

export const requestProtocolDesignerTranscription = async (
  audio: Blob,
  options: Readonly<{ signal?: AbortSignal; language?: string }> = {},
) => {
  if (!audio.size) throw new VoiceDictationError("EMPTY_AUDIO", "Audio recording is empty.");
  if (audio.size > MAX_AUDIO_BYTES) {
    throw new VoiceDictationError("TRANSCRIPTION_FAILED", "Audio recording is too large.");
  }
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abortFromCaller();
  else options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, TRANSCRIPTION_TIMEOUT_MS);
  try {
    const response = await fetch("/api/protocol-designer-bridge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      signal: controller.signal,
      body: JSON.stringify({
        operation: "TRANSCRIBE_VOICE_INPUT",
        audioBase64: await blobToBase64(audio),
        mimeType: audio.type || "audio/webm",
        language: options.language ?? "fr",
      }),
    });
    const value: unknown = await response.json().catch(() => null);
    const providerCode = value && typeof value === "object" && !Array.isArray(value)
      && "error" in value && value.error && typeof value.error === "object"
      && "code" in value.error && typeof value.error.code === "string" ? value.error.code : null;
    if (providerCode === "TRANSCRIPTION_TIMEOUT") {
      throw new VoiceDictationError("TRANSCRIPTION_TIMEOUT", "Transcription timed out.");
    }
    if (!response.ok || !value || typeof value !== "object" || Array.isArray(value)
      || !("text" in value) || typeof value.text !== "string") {
      throw new VoiceDictationError("TRANSCRIPTION_FAILED", "Transcription request failed.");
    }
    const transcript = value.text.trim();
    if (!transcript) throw new VoiceDictationError("TRANSCRIPTION_FAILED", "Transcription is empty.");
    return transcript;
  } catch (error) {
    if (error instanceof VoiceDictationError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new VoiceDictationError(timedOut ? "TRANSCRIPTION_TIMEOUT" : "REQUEST_ABORTED", "Transcription aborted.");
    }
    throw new VoiceDictationError("TRANSCRIPTION_FAILED", "Transcription request failed.");
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
};
