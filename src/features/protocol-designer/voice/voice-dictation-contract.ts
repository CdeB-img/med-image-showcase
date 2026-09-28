export type VoiceDictationPhase = "IDLE" | "REQUESTING_PERMISSION" | "RECORDING" | "TRANSCRIBING";

export type VoiceDictationErrorCode =
  | "MICROPHONE_PERMISSION_DENIED"
  | "NO_AUDIO_INPUT_DEVICE"
  | "AUDIO_CAPTURE_UNSUPPORTED"
  | "AUDIO_RECORDING_FAILED"
  | "EMPTY_AUDIO"
  | "TRANSCRIPTION_FAILED"
  | "TRANSCRIPTION_TIMEOUT"
  | "REQUEST_ABORTED";

export class VoiceDictationError extends Error {
  constructor(readonly code: VoiceDictationErrorCode, message: string) {
    super(message);
    this.name = "VoiceDictationError";
  }
}

export const voiceDictationErrorMessage = (code: VoiceDictationErrorCode) => {
  switch (code) {
    case "MICROPHONE_PERMISSION_DENIED":
      return "L’accès au microphone a été refusé. Autorisez-le dans le navigateur pour réessayer.";
    case "NO_AUDIO_INPUT_DEVICE":
      return "Aucun microphone utilisable n’a été détecté.";
    case "AUDIO_CAPTURE_UNSUPPORTED":
      return "La dictée vocale n’est pas prise en charge par ce navigateur.";
    case "EMPTY_AUDIO":
      return "Aucun son n’a été enregistré. Vous pouvez réessayer.";
    case "TRANSCRIPTION_TIMEOUT":
      return "La transcription a pris trop de temps. Votre texte existant est conservé.";
    case "REQUEST_ABORTED":
      return "La transcription a été annulée. Votre texte existant est conservé.";
    case "TRANSCRIPTION_FAILED":
      return "La transcription n’a pas abouti. Votre texte existant est conservé.";
    default:
      return "L’enregistrement n’a pas abouti. Votre texte existant est conservé.";
  }
};

export const captureErrorCode = (error: unknown): VoiceDictationErrorCode => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "MICROPHONE_PERMISSION_DENIED";
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "NO_AUDIO_INPUT_DEVICE";
    if (error.name === "NotSupportedError") return "AUDIO_CAPTURE_UNSUPPORTED";
  }
  return "AUDIO_RECORDING_FAILED";
};

export type DictationInsertion = Readonly<{ text: string; caret: number }>;

/** Insert without replacing a selection: voice input must never silently erase typed text. */
export const insertDictationAtCaret = (current: string, transcript: string, caret: number): DictationInsertion => {
  const normalized = transcript.trim();
  if (!normalized) return { text: current, caret: Math.max(0, Math.min(caret, current.length)) };
  if (!current) return { text: normalized, caret: normalized.length };
  const position = Math.max(0, Math.min(caret, current.length));
  const before = current.slice(0, position);
  const after = current.slice(position);
  const leading = before && !/\s$/u.test(before) ? " " : "";
  const trailing = after && !/^\s/u.test(after) ? " " : "";
  const inserted = `${leading}${normalized}${trailing}`;
  return { text: `${before}${inserted}${after}`, caret: position + inserted.length };
};
