import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import VoiceDictationControl from "../VoiceDictationControl";
import { insertDictationAtCaret, VoiceDictationError } from "../voice-dictation-contract";
import { requestProtocolDesignerTranscription } from "../transcription-client";

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  state: RecordingState = "inactive";
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  constructor(_stream: MediaStream, options?: MediaRecorderOptions) { this.mimeType = options?.mimeType ?? "audio/webm"; }
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["synthetic audio"], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.(new Event("stop"));
  }
}

const installMicrophone = (getUserMedia: () => Promise<MediaStream>) => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn(getUserMedia) } });
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
};

const streamWithTrack = () => {
  const stop = vi.fn();
  return { stream: { getTracks: () => [{ stop }] } as unknown as MediaStream, stop };
};

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Protocol Designer voice dictation control", () => {
  it("reports unsupported browser capture without attempting transcription", async () => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    vi.stubGlobal("MediaRecorder", undefined);
    const transcribe = vi.fn();
    render(<VoiceDictationControl onTranscript={vi.fn()} transcribe={transcribe} />);
    fireEvent.click(screen.getByRole("button", { name: "Vérifier la disponibilité de la dictée" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("pas prise en charge");
    expect(transcribe).not.toHaveBeenCalled();
  });

  it("records, releases the microphone, transcribes, and never submits a surrounding form", async () => {
    const { stream, stop } = streamWithTrack();
    installMicrophone(async () => stream);
    const onTranscript = vi.fn(), onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const transcribe = vi.fn().mockResolvedValue("Je veux créer une étude sur l’ECV myocardique.");
    render(<form onSubmit={onSubmit}><VoiceDictationControl onTranscript={onTranscript} transcribe={transcribe} />
      <button type="submit">Envoyer</button></form>);

    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    await screen.findByRole("button", { name: "Arrêter la dictée" });
    expect(screen.getByRole("status")).toHaveTextContent("Enregistrement 00:00");
    fireEvent.click(screen.getByRole("button", { name: "Arrêter la dictée" }));

    await waitFor(() => expect(onTranscript).toHaveBeenCalledWith("Je veux créer une étude sur l’ECV myocardique."));
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("cancels recording without transcription and closes all tracks", async () => {
    const { stream, stop } = streamWithTrack();
    installMicrophone(async () => stream);
    const transcribe = vi.fn(), onTranscript = vi.fn();
    render(<VoiceDictationControl onTranscript={onTranscript} transcribe={transcribe} />);
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    await screen.findByRole("button", { name: "Annuler la dictée" });
    fireEvent.click(screen.getByRole("button", { name: "Annuler la dictée" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Démarrer la dictée" })).toBeInTheDocument());
    expect(stop).toHaveBeenCalled();
    expect(transcribe).not.toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
  });

  it("keeps typed text outside the control when permission or transcription fails", async () => {
    installMicrophone(async () => { throw new DOMException("denied", "NotAllowedError"); });
    const first = render(<div><textarea aria-label="Texte" defaultValue="Texte conservé" />
      <VoiceDictationControl onTranscript={vi.fn()} /></div>);
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("refusé");
    expect(screen.getByRole("textbox", { name: "Texte" })).toHaveValue("Texte conservé");
    first.unmount();

    const { stream } = streamWithTrack();
    installMicrophone(async () => stream);
    render(<div><textarea aria-label="Texte" defaultValue="Toujours conservé" />
      <VoiceDictationControl onTranscript={vi.fn()} transcribe={vi.fn().mockRejectedValue(
        new VoiceDictationError("TRANSCRIPTION_FAILED", "synthetic"))} /></div>);
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    fireEvent.click(await screen.findByRole("button", { name: "Arrêter la dictée" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("n’a pas abouti");
    expect(screen.getByRole("textbox", { name: "Texte" })).toHaveValue("Toujours conservé");
  });

  it("aborts an in-flight transcription and releases tracks on unmount", async () => {
    const { stream, stop } = streamWithTrack();
    installMicrophone(async () => stream);
    let observedSignal: AbortSignal | undefined;
    const transcribe = vi.fn((_audio: Blob, options: { signal?: AbortSignal }) => {
      observedSignal = options.signal;
      return new Promise<string>((_resolve, reject) => options.signal?.addEventListener("abort", () =>
        reject(new VoiceDictationError("REQUEST_ABORTED", "aborted")), { once: true }));
    });
    const view = render(<VoiceDictationControl onTranscript={vi.fn()} transcribe={transcribe} />);
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    fireEvent.click(await screen.findByRole("button", { name: "Arrêter la dictée" }));
    await screen.findByRole("button", { name: "Annuler la transcription" });
    fireEvent.click(screen.getByRole("button", { name: "Annuler la transcription" }));
    expect(observedSignal?.aborted).toBe(true);
    view.unmount();
    expect(stop).toHaveBeenCalled();
  });

  it("stops an active recording when unmounted", async () => {
    const { stream, stop } = streamWithTrack();
    installMicrophone(async () => stream);
    const view = render(<VoiceDictationControl onTranscript={vi.fn()} transcribe={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    await screen.findByRole("button", { name: "Arrêter la dictée" });
    view.unmount();
    expect(stop).toHaveBeenCalled();
  });

  it("surfaces a server timeout as a recoverable transcription timeout", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "TRANSCRIPTION_TIMEOUT" },
    }), { status: 504 })));
    await expect(requestProtocolDesignerTranscription(new Blob(["audio"], { type: "audio/webm" })))
      .rejects.toMatchObject({ code: "TRANSCRIPTION_TIMEOUT" });
  });
});

describe("dictation text insertion", () => {
  it("inserts into an empty composer", () => {
    expect(insertDictationAtCaret("", "  Texte dicté.  ", 0)).toEqual({ text: "Texte dicté.", caret: 12 });
  });

  it("preserves existing text and inserts naturally at the caret without replacing a selection", () => {
    expect(insertDictationAtCaret("Avant après", "texte dicté", 5)).toEqual({
      text: "Avant texte dicté après",
      caret: 17,
    });
  });
});
