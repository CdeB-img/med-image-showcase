import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createProtocolDesignerReplayFetch,
  createRecordedProtocolDesignerFetch,
  readProtocolDesignerReplayRefs,
} from "../../../../api/protocol-designer-provider-replay";
import type { ProviderObservedRequestInit } from "../provider-call-observability";
import { FileScientificInterpretationEvidenceStore } from "../../../../api/scientific-interpretation-evidence-store";

const endpoint = "https://api.openai.com/v1/responses";
const request = { method: "POST", body: JSON.stringify({ model: "gpt-5.6-terra", input: "Texte scientifique exact", reasoning: { effort: "low" } }),
  headers: { Authorization: "Bearer test-private-credential" } };

describe("durable provider adapter record/replay, mocks only", () => {
  afterEach(() => vi.restoreAllMocks());
  it("persists the actual payload, response, usage and context then replays without a provider", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-replay-"));
    const response = '{ "id": "resp-1", "model": "returned-version", "usage": {"input_tokens":17}, "output_text":"réponse" }';
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(response, { status: 200, headers: { "x-request-id": "req-1", "set-cookie": "private" } }));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, context: { sessionId: "s1", turnId: "t1" } });
    const observedRequest: ProviderObservedRequestInit = { ...request, noxiaProviderObservation: {
      context: { sessionId: "s1", conversationId: "c1", turnId: "t1", clientRequestId: "req1", testSessionId: "test1" },
      purpose: "PERSISTENT_DELTA", reasoningEffort: "low", retryIndex: 1, retryReason: "DETERMINISTIC_VALIDATION_REJECTED",
    } };
    expect(await (await record(endpoint, observedRequest)).text()).toBe(response);
    const refs = await readProtocolDesignerReplayRefs(root);
    const file = JSON.parse(await readFile(join(root, "raw", (await readdir(join(root, "raw")))
      .find((name) => name.endsWith(`-${refs[0]!.split(":")[1]}.json`))!), "utf8"));
    expect(file.payload.request.body).toBe(request.body);
    expect(file.payload).toMatchObject({ modelRequested: "gpt-5.6-terra", reasoningEffort: "low", context: { sessionId: "s1", turnId: "t1" }, attemptIndex: 0 });
    expect(file.payload.callMetadata).toEqual(observedRequest.noxiaProviderObservation);
    expect(file.payload.latencyMs).toBeGreaterThanOrEqual(0);
    expect(file.payload.response.body).toBe(response);
    expect(file.payload.response.headers).toEqual({ "content-type": "text/plain;charset=UTF-8", "x-request-id": "req-1" });
    expect(JSON.stringify(file)).not.toContain("test-private-credential");
    expect(JSON.stringify(file)).not.toContain("set-cookie");
    const replay = createProtocolDesignerReplayFetch({ root, refs });
    await expect(replay(endpoint, { ...request, body: request.body.replace("exact", "different") })).rejects.toThrow("REQUEST_MISMATCH");
    expect(await (await replay(endpoint, request)).text()).toBe(response);
    await expect(replay(endpoint, request)).rejects.toThrow("EXHAUSTED_NO_LIVE_FALLBACK");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("records HTTP failure and transport failure with no retry; redacts secrets", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-failure-"));
    const provider = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { api_key: "private", message: "test-private-credential" }, usage: { input_tokens: 8 } }), { status: 503 }))
      .mockRejectedValueOnce(new Error("secret transport detail"));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, secrets: ["test-private-credential"] });
    expect((await record(endpoint, request)).status).toBe(503);
    await expect(record(endpoint, request)).rejects.toThrow("secret transport detail");
    const refs = await readProtocolDesignerReplayRefs(root);
    const replay = createProtocolDesignerReplayFetch({ root, refs });
    const result = await replay(endpoint, request);
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("test-private-credential");
    await expect(replay(endpoint, request)).rejects.toThrow("NETWORK_FAILURE");
    expect(provider).toHaveBeenCalledTimes(2);
  });

  it("rejects tampered evidence and unsupported endpoints without a provider", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-integrity-"));
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider });
    await expect(record("https://example.org", request)).rejects.toThrow("ENDPOINT_NOT_ALLOWED");
    await record(endpoint, request);
    const refs = await readProtocolDesignerReplayRefs(root);
    const path = join(root, "raw", (await readdir(join(root, "raw"))).find((name) => name.endsWith(`-${refs[0]!.split(":")[1]}.json`))!);
    const stored = JSON.parse(await readFile(path, "utf8"));
    stored.payload.response.body = "corrupted";
    await writeFile(path, JSON.stringify(stored));
    await expect(createProtocolDesignerReplayFetch({ root, refs })(endpoint, request)).rejects.toThrow("INTEGRITY_FAILURE");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("consumes a fixture only once even for concurrent identical requests", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-concurrent-"));
    await createRecordedProtocolDesignerFetch({ root, fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response("{}")) })(endpoint, request);
    const replay = createProtocolDesignerReplayFetch({ root, refs: await readProtocolDesignerReplayRefs(root) });
    const results = await Promise.allSettled([replay(endpoint, request), replay(endpoint, request)]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
  });

  it("blocks before a paid request when recording preflight is unavailable", async () => {
    const folder = await mkdtemp(join(tmpdir(), "noxia-provider-no-store-"));
    const root = join(folder, "not-a-directory");
    await writeFile(root, "synthetic");
    const provider = vi.fn<typeof fetch>();
    await expect(createRecordedProtocolDesignerFetch({ root, fetchImpl: provider })(endpoint, request)).rejects.toThrow();
    expect(provider).not.toHaveBeenCalled();
  });

  it("does not lose received usage or trigger another call on completion IO failure", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-post-io-"));
    const original = FileScientificInterpretationEvidenceStore.prototype.persistAtomically;
    vi.spyOn(FileScientificInterpretationEvidenceStore.prototype, "persistAtomically")
      .mockImplementationOnce(function (input) { return original.call(this, input); })
      .mockRejectedValueOnce(new Error("synthetic disk full"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"usage":{"input_tokens":500}}'));
    const onPersistenceError = vi.fn();
    const response = await createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, onPersistenceError })(endpoint, request);
    expect(await response.json()).toEqual({ usage: { input_tokens: 500 } });
    expect(provider).toHaveBeenCalledTimes(1);
    expect(onPersistenceError).toHaveBeenCalledWith("PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED");
    expect(await readProtocolDesignerReplayRefs(root)).toEqual([]);
    expect(await readFile(join(root, "protocol-designer-exchanges.jsonl"), "utf8")).toContain("REQUEST_PREPARED");
  });

  it("replays start order when concurrent responses complete out of order", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-order-"));
    let finishFirst!: (value: Response) => void;
    let notifyFirst!: () => void;
    const startedFirst = new Promise<void>((resolve) => { notifyFirst = resolve; });
    const provider = vi.fn<typeof fetch>()
      .mockImplementationOnce(() => { notifyFirst(); return new Promise<Response>((resolve) => { finishFirst = resolve; }); })
      .mockResolvedValueOnce(new Response('"second"'));
    const record = createRecordedProtocolDesignerFetch({ root, fetchImpl: provider });
    const first = record(endpoint, request);
    await startedFirst;
    const secondRequest = { ...request, body: request.body.replace("exact", "second") };
    await record(endpoint, secondRequest);
    finishFirst(new Response('"first"'));
    await first;
    const replay = createProtocolDesignerReplayFetch({ root, refs: await readProtocolDesignerReplayRefs(root) });
    expect(await (await replay(endpoint, request)).text()).toBe('"first"');
    expect(await (await replay(endpoint, secondRequest)).text()).toBe('"second"');
  });

  it("keeps the adapter response usable when only its evidence copy fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "noxia-provider-copy-"));
    const response = new Response('{"usage":{"input_tokens":321}}');
    vi.spyOn(response, "clone").mockImplementation(() => { throw new Error("synthetic capture failure"); });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const provider = vi.fn<typeof fetch>().mockResolvedValue(response);
    const onPersistenceError = vi.fn();
    const result = await createRecordedProtocolDesignerFetch({ root, fetchImpl: provider, onPersistenceError })(endpoint, request);
    expect(await result.json()).toEqual({ usage: { input_tokens: 321 } });
    expect(onPersistenceError).toHaveBeenCalledWith("PROVIDER_EVIDENCE_COMPLETION_NOT_PERSISTED");
    expect(provider).toHaveBeenCalledTimes(1);
    expect(await readProtocolDesignerReplayRefs(root)).toEqual([]);
  });
});
