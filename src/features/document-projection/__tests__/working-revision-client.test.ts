import { afterEach, describe, expect, it, vi } from "vitest";
import * as bridge from "../../protocol-designer/product-bridge-client";
import { createDocumentArchiveClient } from "../generation-archive-client";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";
import { workingRevisionFixture } from "./working-revision-fixture";
import type { DocumentWorkingRevisionResult } from "../working-revision";
import { handleProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const runtime = async () => {
  const run = await workingRevisionFixture();
  vi.spyOn(bridge, "ensureServerProjectSnapshot").mockResolvedValue({ ref: run.access2.project, proof: run.access2.proof! });
  const mutate = { response: (value: unknown): unknown => value };
  const http = (body: Record<string, unknown>, proof = run.access2.proof) => executeDocumentArchiveOperation({
    body, proof, clientAddress: run.identity.clientAddress, connection: null, environment: {}, snapshots: run.snapshots, archive: run.archive,
  });
  const transport = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    expect(url).toBe("/api/protocol-designer-bridge"); expect(init?.credentials).toBe("same-origin");
    const command = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(String(command.operation)).toMatch(/^DOC_ARCHIVE_REVISION_/u);
    const result = await http(command, (init?.headers as Record<string, string>)["x-noxia-project-snapshot-proof"]);
    return new Response(JSON.stringify(mutate.response(result.body)), { status: result.status });
  });
  vi.stubGlobal("fetch", transport);
  const client = createDocumentArchiveClient(run.sessionId, run.project2).workingRevisions!;
  const command = (operation: string, fields: Record<string, unknown>) => ({ operation, sessionId: run.sessionId, projectRef: run.access2.project, ...fields });
  return { ...run, client, transport, http, mutate, command };
};

describe("bounded DOC revision API/client, existing capability and transport", () => {
  it("lists only latest ACTIVE draft metadata under the existing Project capability, without bodies or writes", async () => {
    const run = await runtime();
    expect(await run.client.active!()).toEqual([]);
    expect(run.fixture.revisions()).toHaveLength(0);
    const initial = await run.client.create(run.createInput), content = structuredClone(initial.revision.content);
    content.title = "Texte privé du brouillon";
    const saved = await run.client.save({ revisionId: initial.revision.revisionId, expectedSaveSequence: 1, content });
    const before = run.fixture.revisions(), archive = run.fixture.bodies();
    expect(await run.client.active!()).toEqual([{ revisionId: saved.revision.revisionId, logicalDocumentRef: saved.revision.logicalDocumentRef,
      baseGenerationId: saved.revision.baseGenerationId, baseGenerationBodyDigest: saved.revision.baseGenerationBodyDigest,
      nativeDocumentRef: "PROTOCOL_FULL", saveSequence: 2, updatedAt: saved.revision.updatedAt }]);
    expect(JSON.stringify(await run.client.active!())).not.toContain(content.title);
    expect(run.fixture.revisions()).toEqual(before); expect(run.fixture.bodies()).toEqual(archive);
    expect((await run.http(run.command("DOC_ARCHIVE_REVISION_ACTIVE", {}), "0".repeat(43))).status).toBe(403);
    expect((await run.http(run.command("DOC_ARCHIVE_REVISION_ACTIVE", { revisionId: "other" }))).status).toBe(400);
    await run.client.abandon({ revisionId: initial.revision.revisionId, expectedSaveSequence: 2 });
    expect(await run.client.active!()).toEqual([]);
  });
  it("rejects active metadata with body leakage, corrupt identity or duplicate revision", async () => {
    const run = await runtime(); await run.client.create(run.createInput);
    run.mutate.response = value => {
      const response = value as { result: Record<string, unknown>[] };
      response.result[0].content = "Private text"; return response;
    };
    await expect(run.client.active!()).rejects.toThrow("DOC_REVISION_RESPONSE_INVALID");
  });
  it("opens/resumes by exact native base and rejects extra fields or substituted source responses", async () => {
    const run = await runtime(), { revisionId: _id, ...input } = run.createInput;
    const first = await run.client.open(input);
    expect(await run.client.open(input)).toEqual(first);
    expect(run.fixture.revisions()).toHaveLength(1);
    expect((await run.http(run.command("DOC_ARCHIVE_REVISION_OPEN", { ...input, revisionId: "untrusted" }))).status).toBe(400);
    run.mutate.response = value => {
      const result = value as { result: DocumentWorkingRevisionResult };
      result.result.revision.baseGenerationId = "another-base";
      return value;
    };
    await expect(run.client.open(input)).rejects.toThrow("DOC_REVISION_RESPONSE_INVALID");
  });
  it("creates, saves, reloads and abandons via native archive operations only", async () => {
    const run = await runtime(), before = run.fixture.rows(), bodyBefore = run.fixture.bodies();
    const initial = await run.client.create(run.createInput), content = structuredClone(initial.revision.content);
    content.title = "Copie éditoriale sauvegardée";
    const saved = await run.client.save({ revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content });
    expect((await run.client.get(run.createInput.revisionId)).revision).toEqual(saved.revision);
    const abandoned = await run.client.abandon({ revisionId: run.createInput.revisionId, expectedSaveSequence: 2 });
    expect(abandoned.revision.status).toBe("ABANDONED");
    expect(run.transport).toHaveBeenCalledTimes(4);
    expect(run.fixture.rows()).toEqual(before); expect(run.fixture.bodies()).toEqual(bodyBefore);
  });
  it("returns an explicit 409 for stale save and preserves the winner", async () => {
    const run = await runtime(), initial = await run.client.create(run.createInput), content = structuredClone(initial.revision.content);
    content.title = "Gagnant";
    await run.client.save({ revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content });
    const response = await run.http(run.command("DOC_ARCHIVE_REVISION_SAVE", { revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content }));
    expect(response).toEqual({ status: 409, body: { error: { code: "DOC_REVISION_SAVE_CONFLICT" } } });
    await expect(run.client.save({ revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content })).rejects.toThrow("DOC_REVISION_SAVE_CONFLICT");
    expect((await run.client.get(run.createInput.revisionId)).revision.content.title).toBe("Gagnant");
  });
  it("rejects untrusted fields, missing save tokens and malformed commands", async () => {
    const run = await runtime();
    for (const fields of [{ ...run.createInput, status: "PUBLISHED" }, { ...run.createInput, content: {} }]) {
      expect((await run.http(run.command("DOC_ARCHIVE_REVISION_CREATE", fields))).status).toBe(400);
    }
    expect((await run.http(run.command("DOC_ARCHIVE_REVISION_SAVE", { revisionId: run.createInput.revisionId, content: {} }))).status).toBe(400);
    expect((await run.http(run.command("DOC_ARCHIVE_REVISION_ABANDON", { revisionId: run.createInput.revisionId, expectedSaveSequence: 0 }))).status).toBe(400);
    expect(run.fixture.revisions()).toHaveLength(0);
  });
  it("does not disclose text or mutate data on invalid capability or unknown revision", async () => {
    const run = await runtime();
    const missing = await run.http(run.command("DOC_ARCHIVE_REVISION_GET", { revisionId: "missing" }));
    expect(missing).toEqual({ status: 404, body: { error: { code: "DOC_REVISION_NOT_FOUND" } } });
    const denied = await run.http(run.command("DOC_ARCHIVE_REVISION_CREATE", run.createInput), "0".repeat(43));
    expect(denied).toEqual({ status: 403, body: { error: { code: "PROJECT_SNAPSHOT_SESSION_MISMATCH" } } });
    expect(run.fixture.revisions()).toHaveLength(0);
  });
  it("returns only a code on persistence failure, with no private source text", async () => {
    const run = await runtime(), initial = await run.client.create(run.createInput), content = structuredClone(initial.revision.content);
    content.title = "Texte privé non sauvegardé";
    run.fixture.failRevisionSave(true);
    const response = await run.http(run.command("DOC_ARCHIVE_REVISION_SAVE", { revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content }));
    expect(response).toEqual({ status: 503, body: { error: { code: "DOC_ARCHIVE_UNAVAILABLE" } } });
    expect(await run.client.get(run.createInput.revisionId)).toEqual(initial);
  });
  it.each(["identity", "digest", "base", "stale"] as const)("rejects corrupt %s in a revision response", async field => {
    const run = await runtime();
    await run.client.create(run.createInput);
    run.mutate.response = value => {
      const result = value as { result: DocumentWorkingRevisionResult };
      if (field === "identity") result.result.revision.revisionId = "another-revision";
      if (field === "digest") result.result.revision.content.title = "corrupted";
      if (field === "base") result.result.revision.baseGenerationBodyDigest = "wrong";
      if (field === "stale") result.result.baseState.stale = true;
      return value;
    };
    await expect(run.client.get(run.createInput.revisionId)).rejects.toThrow("DOC_REVISION_RESPONSE_INVALID");
  });
  it("routes revision commands before provider admission and preserves origin checks", async () => {
    const run = await runtime(), provider = vi.fn<typeof fetch>();
    const invoke = async (origin: string) => {
      let status = 0, value: unknown;
      await handleProtocolDesignerBridge({ method: "POST", body: run.command("DOC_ARCHIVE_REVISION_CREATE", run.createInput),
        headers: { "content-type": "application/json", origin, host: "noxia-imagerie.fr",
          "x-forwarded-for": run.identity.clientAddress, "x-noxia-project-snapshot-proof": run.access2.proof! } }, {
        setHeader() {}, status(code) { status = code; return this; }, json(body) { value = body; },
      }, { NODE_ENV: "production" }, { fetchImpl: provider, projectSnapshotStore: run.snapshots, documentArchive: run.archive });
      return { status, value };
    };
    expect((await invoke("https://untrusted.example")).status).toBe(403);
    const allowed = await invoke("https://noxia-imagerie.fr");
    expect(allowed.status).toBe(200);
    expect((allowed.value as { result: DocumentWorkingRevisionResult }).result.revision.status).toBe("ACTIVE");
    expect(provider).not.toHaveBeenCalled();
    expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("rejects an unconfirmed save response instead of claiming the user's text was saved", async () => {
    const run = await runtime(), original = await run.client.create(run.createInput), content = structuredClone(original.revision.content);
    content.title = "Modification demandée";
    run.mutate.response = () => ({ contract: "DOC_GENERATION_ARCHIVE_V1", result: original });
    await expect(run.client.save({ revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content })).rejects.toThrow("DOC_REVISION_RESPONSE_INVALID");
    run.mutate.response = value => value;
    expect((await run.client.get(run.createInput.revisionId)).revision.content.title).toBe(content.title);
  });
});
