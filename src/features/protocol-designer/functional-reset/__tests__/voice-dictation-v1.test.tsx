import { explicitTestSave } from "./legacy-persistence-test-adapter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { createFunctionalResetSession } from "../session";

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["synthetic audio"], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.(new Event("stop"));
  }
}

beforeEach(() => {
  localStorage.clear();
  const track = { stop: vi.fn() };
  Object.defineProperty(navigator, "mediaDevices", { configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] } as unknown as MediaStream)) } });
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Protocol Designer voice dictation V1 integration", () => {
  it("injects text at the caret without auto-send or scientific side effects", async () => {
    const initial = createFunctionalResetSession();
    let current = initial;
    const fetchMock = vi.fn<typeof fetch>(async (url) => {
      expect(url).toBe("/api/protocol-designer-bridge");
      return new Response(JSON.stringify({ text: "dictée ECV" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={initial}
      onSessionChange={explicitTestSave((next) => { current = next; })} /></HelmetProvider>);

    const composer = screen.getByRole("textbox", { name: "Votre message" }) as HTMLTextAreaElement;
    fireEvent.change(composer, { target: { value: "Avant après" } });
    composer.setSelectionRange(5, 5);
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    fireEvent.click(await screen.findByRole("button", { name: "Arrêter la dictée" }));

    await waitFor(() => expect(composer).toHaveValue("Avant dictée ECV après"));
    expect(screen.getByRole("button", { name: "Envoyer" })).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(current.runtimeTurns).toEqual(initial.runtimeTurns);
    expect(current.entries).toEqual(initial.entries);
    expect(current.project).toBeNull();
    expect(current.pendingContribution).toBeNull();
    expect(current.documents).toEqual(initial.documents);
  });

  it("keeps the composer usable on a narrow layout and exposes explicit accessible controls", async () => {
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={createFunctionalResetSession()}
      onSessionChange={explicitTestSave(() => undefined)} /></HelmetProvider>);
    const composer = screen.getByRole("textbox", { name: "Votre message" });
    expect(composer).toHaveClass("basis-full", "sm:basis-0");
    expect(screen.getByRole("button", { name: "Démarrer la dictée" })).toHaveClass("h-11", "w-11");
    expect(screen.getByRole("button", { name: "Envoyer" })).toHaveClass("h-11", "w-11");
  });

  it("preserves keyboard edits made while transcription is in flight", async () => {
    let resolveProvider!: (response: Response) => void;
    const providerResult = new Promise<Response>((resolve) => { resolveProvider = resolve; });
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(() => providerResult));
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={createFunctionalResetSession()}
      onSessionChange={explicitTestSave(() => undefined)} /></HelmetProvider>);
    const composer = screen.getByRole("textbox", { name: "Votre message" }) as HTMLTextAreaElement;
    fireEvent.change(composer, { target: { value: "Avant après" } });
    fireEvent.click(screen.getByRole("button", { name: "Démarrer la dictée" }));
    fireEvent.click(await screen.findByRole("button", { name: "Arrêter la dictée" }));
    await screen.findByRole("button", { name: "Annuler la transcription" });
    fireEvent.change(composer, { target: { value: "Avant après ajouté" } });
    composer.setSelectionRange(composer.value.length, composer.value.length);
    resolveProvider(new Response(JSON.stringify({ text: "dictée ECV" }), { status: 200 }));
    await waitFor(() => expect(composer).toHaveValue("Avant après ajouté dictée ECV"));
  });
});
