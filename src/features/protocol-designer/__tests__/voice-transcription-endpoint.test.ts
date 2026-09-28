import { describe, expect, it, vi } from "vitest";
import {
  handleProtocolDesignerTranscription,
  type TranscriptionApiResponse,
} from "../../../../server/protocol-designer-transcription";
import { handleProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";

const requestBody = {
  operation: "TRANSCRIBE_VOICE_INPUT",
  audioBase64: Buffer.from("synthetic non-sensitive audio").toString("base64"),
  mimeType: "audio/webm;codecs=opus",
  language: "fr-FR",
};

const responseCapture = () => {
  let status = 0, body: unknown;
  const response: TranscriptionApiResponse = {
    setHeader() {},
    status(value) { status = value; return this; },
    json(value) { body = value; },
  };
  return { response, read: () => ({ status, body }) };
};

describe("Protocol Designer transcription endpoint", () => {
  it("forwards ephemeral audio as multipart to the existing server-side OpenAI credential", async () => {
    const provider = vi.fn<typeof fetch>(async (url, init) => {
      expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
      expect(init?.headers).toEqual({ authorization: "Bearer LOCAL_SYNTHETIC" });
      const form = init?.body as FormData;
      expect(form.get("model")).toBe("gpt-4o-transcribe");
      expect(form.get("language")).toBe("fr");
      expect(form.get("response_format")).toBe("json");
      const file = form.get("file") as File;
      expect(file.type).toBe("audio/webm");
      expect(file.size).toBeGreaterThan(0);
      return new Response(JSON.stringify({ text: "IRM cardiaque, ECV et hématocrite." }), { status: 200 });
    });
    const capture = responseCapture();
    await handleProtocolDesignerBridge({ method: "POST", headers: {
      "content-type": "application/json", origin: "https://preview.example", host: "preview.example",
    }, body: requestBody }, capture.response, { OPENAI_API_KEY: "LOCAL_SYNTHETIC" }, { fetchImpl: provider });
    expect(capture.read()).toEqual({ status: 200, body: { text: "IRM cardiaque, ECV et hématocrite." } });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("fails closed before provider dispatch for invalid origin, payload, or missing credential", async () => {
    const provider = vi.fn<typeof fetch>();
    const invalidOrigin = responseCapture();
    await handleProtocolDesignerTranscription({ method: "POST", headers: {
      "content-type": "application/json", origin: "https://attacker.example", host: "preview.example",
    }, body: requestBody }, invalidOrigin.response, { OPENAI_API_KEY: "LOCAL_SYNTHETIC" }, { fetchImpl: provider });
    expect(invalidOrigin.read().status).toBe(403);

    const invalidPayload = responseCapture();
    await handleProtocolDesignerTranscription({ method: "POST", headers: { "content-type": "application/json" },
      body: { ...requestBody, audioBase64: "%%%" } }, invalidPayload.response,
    { OPENAI_API_KEY: "LOCAL_SYNTHETIC" }, { fetchImpl: provider });
    expect(invalidPayload.read().status).toBe(400);

    const missingCredential = responseCapture();
    await handleProtocolDesignerTranscription({ method: "POST", headers: { "content-type": "application/json" },
      body: requestBody }, missingCredential.response, {}, { fetchImpl: provider });
    expect(missingCredential.read().status).toBe(503);
    expect(provider).not.toHaveBeenCalled();
  });

  it("does not expose provider error bodies", async () => {
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { message: "sensitive provider detail" },
    }), { status: 429 }));
    const capture = responseCapture();
    await handleProtocolDesignerTranscription({ method: "POST", headers: { "content-type": "application/json" },
      body: requestBody }, capture.response, { OPENAI_API_KEY: "LOCAL_SYNTHETIC" }, { fetchImpl: provider });
    expect(capture.read()).toEqual({ status: 502, body: { error: { code: "TRANSCRIPTION_FAILED" } } });
    expect(JSON.stringify(capture.read().body)).not.toContain("sensitive provider detail");
  });
});
