import { Mic, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestProtocolDesignerTranscription } from "./transcription-client";
import {
  captureErrorCode,
  VoiceDictationError,
  voiceDictationErrorMessage,
  type VoiceDictationErrorCode,
  type VoiceDictationPhase,
} from "./voice-dictation-contract";

type VoiceDictationControlProps = Readonly<{
  disabled?: boolean;
  language?: string;
  onTranscript: (transcript: string) => void;
  transcribe?: typeof requestProtocolDesignerTranscription;
}>;

const preferredMimeType = () => {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported?.(candidate)) ?? "";
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export default function VoiceDictationControl({
  disabled = false,
  language = "fr-FR",
  onTranscript,
  transcribe = requestProtocolDesignerTranscription,
}: VoiceDictationControlProps) {
  const supported = typeof navigator !== "undefined"
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== "undefined";
  const [phase, setPhase] = useState<VoiceDictationPhase>("IDLE");
  const [errorCode, setErrorCode] = useState<VoiceDictationErrorCode | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const mountedRef = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRecordingRef = useRef(false);
  const transcriptionControllerRef = useRef<AbortController | null>(null);

  const releaseMicrophone = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const showError = useCallback((code: VoiceDictationErrorCode) => {
    if (!mountedRef.current) return;
    setErrorCode(code);
    setPhase("IDLE");
  }, []);

  const transcribeRecording = useCallback(async (recorder: MediaRecorder) => {
    releaseMicrophone();
    recorderRef.current = null;
    if (discardRecordingRef.current || !mountedRef.current) {
      chunksRef.current = [];
      discardRecordingRef.current = false;
      return;
    }
    const audio = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    chunksRef.current = [];
    if (!audio.size) { showError("EMPTY_AUDIO"); return; }
    const controller = new AbortController();
    transcriptionControllerRef.current = controller;
    setPhase("TRANSCRIBING");
    try {
      const transcript = await transcribe(audio, { signal: controller.signal, language: language.split("-")[0] || "fr" });
      if (!mountedRef.current || controller.signal.aborted) return;
      onTranscript(transcript);
      setErrorCode(null);
      setPhase("IDLE");
    } catch (error) {
      const code = error instanceof VoiceDictationError ? error.code : "TRANSCRIPTION_FAILED";
      if (code === "REQUEST_ABORTED" && controller.signal.aborted) {
        if (mountedRef.current) setPhase("IDLE");
      } else showError(code);
    } finally {
      if (transcriptionControllerRef.current === controller) transcriptionControllerRef.current = null;
    }
  }, [language, onTranscript, releaseMicrophone, showError, transcribe]);

  const startRecording = useCallback(async () => {
    if (!supported || disabled || phase !== "IDLE") return;
    setErrorCode(null);
    setPhase("REQUESTING_PERMISSION");
    setDurationSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      const mimeType = preferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRecordingRef.current = false;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => {
        discardRecordingRef.current = true;
        if (recorder.state !== "inactive") recorder.stop();
        releaseMicrophone();
        showError("AUDIO_RECORDING_FAILED");
      };
      recorder.onstop = () => { void transcribeRecording(recorder); };
      recorder.start();
      setPhase("RECORDING");
    } catch (error) {
      releaseMicrophone();
      showError(captureErrorCode(error));
    }
  }, [disabled, phase, releaseMicrophone, showError, supported, transcribeRecording]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    discardRecordingRef.current = false;
    recorder.stop();
    releaseMicrophone();
  }, [releaseMicrophone]);

  const cancel = useCallback(() => {
    setErrorCode(null);
    if (phase === "TRANSCRIBING") {
      transcriptionControllerRef.current?.abort();
      transcriptionControllerRef.current = null;
      setPhase("IDLE");
      return;
    }
    discardRecordingRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else chunksRef.current = [];
    releaseMicrophone();
    setPhase("IDLE");
  }, [phase, releaseMicrophone]);

  useEffect(() => {
    if (phase !== "RECORDING") return;
    const timer = window.setInterval(() => setDurationSeconds((value) => value + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardRecordingRef.current = true;
      transcriptionControllerRef.current?.abort();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      releaseMicrophone();
      chunksRef.current = [];
    };
  }, [releaseMicrophone]);

  if (!supported) return <div className="flex shrink-0 items-center gap-1">
    <button type="button" onClick={() => setErrorCode("AUDIO_CAPTURE_UNSUPPORTED")}
      aria-label="Vérifier la disponibilité de la dictée" title="Vérifier la disponibilité de la dictée"
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border text-muted-foreground">
      <Mic className="h-5 w-5" aria-hidden="true" />
    </button>
    {errorCode && <p role="alert" className="max-w-64 px-2 text-xs text-destructive">{voiceDictationErrorMessage(errorCode)}</p>}
  </div>;

  return <div className="flex shrink-0 items-center gap-1" data-voice-dictation-state={phase}>
    {phase === "IDLE" && <button type="button" disabled={disabled} onClick={() => void startRecording()}
      aria-label="Démarrer la dictée" title="Dicter un message"
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
      <Mic className="h-5 w-5" aria-hidden="true" />
    </button>}
    {phase === "REQUESTING_PERMISSION" && <p role="status" className="px-2 text-xs text-muted-foreground">Accès au microphone…</p>}
    {phase === "RECORDING" && <>
      <p role="status" aria-live="polite" className="px-1 text-xs font-medium text-red-700">
        Enregistrement {formatDuration(durationSeconds)}
      </p>
      <button type="button" onClick={stopRecording} aria-label="Arrêter la dictée" title="Arrêter et transcrire"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-300 text-red-700">
        <Square className="h-4 w-4 fill-current" aria-hidden="true" />
      </button>
      <button type="button" onClick={cancel} aria-label="Annuler la dictée" title="Annuler la dictée"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border text-muted-foreground">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </>}
    {phase === "TRANSCRIBING" && <>
      <p role="status" aria-live="polite" className="px-2 text-xs text-muted-foreground">Transcription en cours…</p>
      <button type="button" onClick={cancel} aria-label="Annuler la transcription" title="Annuler la transcription"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border text-muted-foreground">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </>}
    {errorCode && <p role="alert" className="max-w-64 px-2 text-xs text-destructive">{voiceDictationErrorMessage(errorCode)}</p>}
  </div>;
}
