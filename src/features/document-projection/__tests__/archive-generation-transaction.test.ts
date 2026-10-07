import { afterEach, describe, expect, it, vi } from "vitest";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import * as provider from "../../../../api/protocol-designer-openai-extraction-provider";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256 } from "../../../../server/protocol-designer-document-archive";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { confirmResearchProjectContribution, authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";
import { prepareDrciDraftSource, prepareDrciDraftPack, DRCI_DOCUMENT_KINDS } from "../drci-draft-contract";
import type { ProductBridgeResponse } from "../../protocol-designer/product-bridge";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { useRef, useState } from "react";
import { useDocumentGeneration } from "../../protocol-designer/functional-reset/useDocumentGeneration";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, type FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import * as bridgeClient from "../../protocol-designer/product-bridge-client";
import * as archiveClient from "../generation-archive-client";
import { documentNativeGeneratedAt, type DocumentRecoveryResult } from "../generation-persistence";
import { materializeDrciDraftPack, drciDraftPackArtifacts } from "../drci-draft-pack";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { COLCHICINE_MODIFICATION } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); vi.unstubAllEnvs(); });
let clientOrdinal = 0;
const runtime = async (limits = {}, withV2 = false) => {
  const clientIndex = ++clientOrdinal;
  const at = "2026-10-05T10:00:00.000Z", initial = createFunctionalResetSession(at);
  const sessionId = initial.sessionId, authority = initial.projectAuthority;
  const turn = { turnId: "source", role: "USER" as const, content: COLCHICINE_INITIAL, createdAt: at };
  const v1 = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([turn]), current: null,
    projectId: `${sessionId}:research-project`, authority, confirmedAt: at });
  const second = { ...turn, turnId: "source-v2", content: COLCHICINE_MODIFICATION };
  const project = withV2 ? confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([turn, second]), current: v1,
    projectId: v1.projectId, authority, confirmedAt: at }) : v1;
  const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority, confirmedAt: at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
  const source = prepareDrciDraftSource({ handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
  const packet = prepareDrciDraftPack(project, source);
  const valueFor = (packet: ReturnType<typeof prepareDrciDraftPack>, source: ReturnType<typeof prepareDrciDraftSource>) => ({ documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `Qualification ${kind}`,
    sections: [{ title: "Cadre de recherche", paragraphs: [packet.sourceFacts[0].content + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification déterministe sans validation scientifique. ".repeat(120) : "")], sourceRefs: [packet.sourceFacts[0].ref] }], missingElements: [] })),
    crfRows: source.crf.fields.map((field, i) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${i}`, label: field.label, domain: "À préciser", visit: "À préciser", definition: field.label,
      entryType: "Texte", unit: null, categories: null, dataOrigin: "UNSPECIFIED" as const, source: "À préciser", required: "À préciser", condition: null, derivedFrom: [], derivation: null, controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" as const })) });
  const value = valueFor(packet, source);
  const executed = vi.spyOn(provider, "executeOpenAIDrciDraft").mockResolvedValue({ value, calls: 1, latencyMs: 0, modelRequested: "gpt-6-sol", modelReturned: "gpt-6-sol", reusedProtocolEvidenceRef: null } as Awaited<ReturnType<typeof provider.executeOpenAIDrciDraft>>);
  const snapshots = memoryProjectSnapshotStore(), sql = archiveSqlFixture();
  // Independent deterministic tester sessions must not share the server's
  // native IP rate-limit bucket; the rate limiter itself remains enabled.
  const identity = { sessionId, clientAddress: `192.0.2.${clientIndex}` }, registration = await snapshots.persist(identity, project, null);
  const access = { identity, project: registration.ref, proof: registration.proof };
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, { ...documentArchiveCapacity({}), ...limits }, sql.sql);
  const guard = createMemoryProtocolDesignerGuardForTests();
  const requestId = `drci-draft:${project.projectDigest}:doc-intent-1`;
  const body = { apiVersion: "1.0.0", requestKind: "USER_TURN", conversation: { conversationId: "conversation", language: "fr", turns: [turn] }, currentProject: project,
    evaluatePersistentDelta: false, documentDraftRequest: source, observabilityContext: { sessionId, conversationId: "conversation", turnId: turn.turnId, clientRequestId: requestId, testSessionId: null } };
  let now = Date.parse(at);
  const invoke = async (options: { ledgerFailure?: boolean; lostResponse?: boolean; payload?: unknown; noProviderConfig?: boolean; clientAddress?: string; proof?: string } = {}) => {
    let status = 0, returned: unknown;
    const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(result) {
      if (options.lostResponse) throw new TypeError("OFFLINE_LOST_HTTP_RESPONSE"); returned = result;
    } };
    await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", host: "noxia.test", origin: "https://noxia.test", "x-forwarded-for": options.clientAddress ?? identity.clientAddress,
      "x-noxia-project-snapshot-proof": options.proof ?? registration.proof }, body: options.payload ?? body }, response,
    options.noProviderConfig ? {} : { VERCEL_ENV: "preview", OPENAI_API_KEY: "OFFLINE_SYNTHETIC", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA" },
    { projectSnapshotStore: snapshots, documentArchive: archive, durableGuard: options.ledgerFailure ? { ...guard, completeRequest: async () => { throw new Error("OFFLINE_LEDGER_FAILURE"); } } : guard,
      now: () => now, fetchImpl: vi.fn(async () => { throw new Error("NETWORK_FORBIDDEN"); }) });
    return { status, body: returned as ProductBridgeResponse & { error?: { code: string } } };
  };
  return { invoke, archive, access, sql, executed, project, v1, projection, source, snapshots, guard, requestId, body, at, authority, initial, valueFor,
    advance: () => { now += 60_000; } };
};

// CURRENT_STRUCTURAL_INVARIANT: real native handler/admission/archive/hook +
// real session serialization. Only physical provider execution and SQL transport
// are deterministic doubles; source science and DOC validation are unchanged.
const reloadRuntime = async () => {
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
  const run = await runtime({}, true);
  const decision = authorizeResearchProjectDocumentHandoff({ project: run.v1, authority: run.authority, confirmedAt: run.at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project: run.v1, handoffDecision: decision, requestedAt: run.at, generateProtocol: true }).projections.at(-1)!;
  const source = prepareDrciDraftSource({ handoffDecision: decision, protocolProjection: projection, crf: buildCanonicalCrfPackage(run.v1) });
  const packet = prepareDrciDraftPack(run.v1, source);
  const pack = materializeDrciDraftPack(run.valueFor(packet, source), { project: run.v1, packet, generatedAt: run.at });
  const { freezeDocumentGeneration } = await import("../generation-exports");
  const g1Body = await freezeDocumentGeneration({ native: { family: "DRCI", value: pack }, artifacts: drciDraftPackArtifacts(pack, run.v1), sha256: docSha256, renderOrigin: "GENERATION_TIME" });
  const g1Request = `drci-draft:${run.v1.projectDigest}:g1`;
  const v1Registration = await run.snapshots.persist(run.access.identity, run.v1, run.access.proof);
  const v1Access = { ...run.access, project: v1Registration.ref, proof: v1Registration.proof };
  await run.archive.admit(v1Access, { family: "DRCI", requestId: g1Request, requestSha256: docSha256(g1Request), generatedAt: run.at, reservedBytes: 4_000_000 });
  const g1 = await run.archive.commit(v1Access, g1Request, g1Body);
  const initial: FunctionalResetSession = { ...run.initial, project: run.project, runtimeTurns: run.body.conversation.turns,
    documentArchive: { ...run.initial.documentArchive!, currentGenerationId: g1.generation.generationId,
      currentGeneration: g1.generation } };
  let latest = initial;
  const client: archiveClient.DocumentArchiveClient = {
    history: cursor => run.archive.history(run.access, cursor, "DRCI"),
    body: id => run.archive.body(run.access, id), receipt: id => run.archive.receipt(run.access, id),
    async commit(id, body) {
      await run.archive.admit(run.access, { requestId: id, requestSha256: docSha256(JSON.stringify(body)), generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: Buffer.byteLength(JSON.stringify(body)) });
      return run.archive.commit(run.access, id, body);
    },
    async recover(identity) {
      const response = await run.invoke({ noProviderConfig: true, payload: { operation: "DOC_ARCHIVE_RECOVER",
        sessionId: initial.sessionId, projectRef: run.access.project, requestId: identity.requestId,
        projectionId: identity.projectionId, handoffDigest: identity.handoffDigest } });
      if (response.status !== 200) throw new archiveClient.DocumentArchiveClientError(response.body.error!.code);
      return (response.body as unknown as { result: DocumentRecoveryResult }).result;
    },
  };
  const recover = vi.spyOn(client, "recover");
  vi.spyOn(archiveClient, "createDocumentArchiveClient").mockReturnValue(client);
  const requests: unknown[] = [];
  const dispatch = vi.spyOn(bridgeClient, "requestProtocolDesignerBridge").mockImplementation(async request => {
    // This assertion is at the actual dispatch boundary, not an after-save mock.
    const persisted = loadFunctionalResetSession(localStorage, undefined, true);
    expect(persisted.documentArchive!.pendingRequestId).toBe(request.observabilityContext!.clientRequestId);
    expect(persisted.documents.projections).toEqual([]);
    requests.push(request);
    run.sql.failMetadataCommit(true);
    const result = await run.invoke({ payload: { ...request, apiVersion: "1.0.0" } });
    if (result.status !== 200) throw new bridgeClient.ProductBridgeClientError(result.body.error!.code, "OFFLINE_ARCHIVE_WRITE_FAILURE");
    return result.body;
  });
  const stage = vi.fn(), pending = vi.fn();
  const mount = (source = latest) => renderHook(() => {
    const [session, setSession] = useState(source), ref = useRef(session);
    ref.current = session; latest = session;
    return useDocumentGeneration({ latestSessionRef: ref, setSession, projectionMode: "STANDARD", administration: undefined,
      setDocumentSaveWarning: vi.fn(), setDeliverableWorkspaceOpen: vi.fn(), setDocumentGenerationVersion: vi.fn(),
      setDocumentGenerationStartedAt: vi.fn(), setDocumentGenerationElapsed: vi.fn(), setDocumentGenerationComplete: vi.fn(),
      setDocumentGenerationPending: pending, setDocumentGenerationStage: stage });
  });
  return { ...run, client, recover, dispatch, requests, mount, stage, pending, g1, g1Body,
    latest: () => latest, reload: () => loadFunctionalResetSession(localStorage, undefined, true) };
};

describe("same DOC admission survives archive failure + browser reload", () => {
  it("persists R1 before dispatch, then recovers exactly one G2 without a provider call or second reservation", async () => {
    const run = await reloadRuntime(), beforeProject = JSON.stringify(run.project);
    const first = run.mount(); await act(() => first.result.current.requestProtocolProjection());
    const identity = run.latest().documentArchive!.pendingRecovery!;
    expect(identity).toBeDefined(); expect(run.executed).toHaveBeenCalledOnce();
    expect(run.latest().documents.lastFailure).not.toBeNull();
    expect((await run.client.history()).entries.map(g => g.displayVersion)).toEqual([1]);
    const rows = run.sql.rows().length;
    const admission = vi.spyOn(run.archive, "admit");
    const source = JSON.stringify(await run.client.body(identity.projectionId));
    first.unmount(); run.advance(); run.sql.failMetadataCommit(false);
    const reopened = run.reload(); expect(reopened.documentArchive!.pendingRecovery).toEqual(identity);
    const second = run.mount(reopened);
    await waitFor(() => expect(run.latest().documentArchive!.currentGeneration?.displayVersion).toBe(2));
    expect(run.recover).toHaveBeenCalledWith(identity);
    expect(run.dispatch).toHaveBeenCalledOnce(); expect(run.executed).toHaveBeenCalledOnce();
    expect(run.sql.rows()).toHaveLength(rows);
    expect(admission).not.toHaveBeenCalled();
    expect((await run.client.history()).entries.map(g => g.displayVersion)).toEqual([2, 1]);
    expect(run.latest().documentArchive!.pendingRequestId).toBeNull(); expect(run.latest().documents.lastFailure).toBeNull();
    expect(run.latest().documentArchive!.currentGeneration?.project.projectDigest).toBe(run.project.projectDigest);
    expect(JSON.stringify(await run.client.body(identity.projectionId))).toBe(source);
    expect((await run.client.body(run.g1.generation.generationId)).body).toEqual(run.g1Body);
    expect(JSON.stringify(run.project)).toBe(beforeProject);
    expect(run.stage).toHaveBeenCalledWith("VERIFYING_ARCHIVE");
    second.unmount(); const final = run.mount(run.reload());
    await act(() => final.result.current.requestProtocolProjection());
    expect(run.dispatch).toHaveBeenCalledOnce(); expect(run.latest().documentArchive!.currentGeneration?.displayVersion).toBe(2);
  });

  it("observes genuinely in-flight work after reload without a second execution", async () => {
    const run = await reloadRuntime(); let release!: () => void, started!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; }), dispatched = new Promise<void>(resolve => { started = resolve; });
    const execute = run.executed.getMockImplementation()!;
    run.executed.mockImplementation(async (...args) => { started(); await pending; return execute(...args); });
    const first = run.mount(); let work!: Promise<void>;
    await act(async () => { work = first.result.current.requestProtocolProjection(); await dispatched; });
    first.unmount(); const rows = run.sql.rows().length;
    const second = run.mount(run.reload());
    await waitFor(() => expect(run.recover).toHaveBeenCalledOnce());
    expect(await run.recover.mock.results[0].value).toEqual({ state: "IN_PROGRESS" });
    expect(run.dispatch).toHaveBeenCalledOnce(); expect(run.executed).toHaveBeenCalledOnce(); expect(run.sql.rows()).toHaveLength(rows);
    second.unmount(); await act(async () => { release(); await work; });
  });

  it("does not report success for a terminal provider failure recovered after reload", async () => {
    const run = await reloadRuntime(); run.executed.mockRejectedValueOnce(new Error("OFFLINE_TERMINAL_PROVIDER_FAILURE"));
    const first = run.mount(); await act(() => first.result.current.requestProtocolProjection()); first.unmount();
    // Reproduce a lost terminal response: the pre-dispatch durable linkage remains.
    const request = run.requests[0] as Parameters<typeof bridgeClient.requestProtocolDesignerBridge>[0];
    const old = run.reload(), projectionId = old.documentArchive!.currentProjectionId!;
    const pending = { ...old, documentArchive: { ...old.documentArchive!, pendingRequestId: request.observabilityContext!.clientRequestId,
      pendingRecovery: { requestId: request.observabilityContext!.clientRequestId, project: { projectId: run.project.projectId,
        projectVersion: run.project.versionId, projectDigest: run.project.projectDigest }, projectionId,
        handoffDigest: logicalDigest(request.documentDraftRequest!.handoffDecision) } } };
    persistFunctionalResetSession(localStorage, pending);
    run.mount(run.reload());
    await waitFor(() => expect(run.latest().documents.lastFailure).not.toBeNull());
    await waitFor(() => expect(run.latest().documentArchive!.pendingRequestId).toBeNull());
    expect(run.latest().documentArchive!.currentGeneration?.displayVersion).toBe(1);
    expect(run.dispatch).toHaveBeenCalledOnce(); expect(run.executed).toHaveBeenCalledOnce();
    expect((await run.client.history()).entries).toHaveLength(1);
  });

  it("fails closed for stale Project identity and preserves the original reserved attempt", async () => {
    const run = await reloadRuntime(), first = run.mount(); await act(() => first.result.current.requestProtocolProjection()); first.unmount();
    const reopened = run.reload(), identity = reopened.documentArchive!.pendingRecovery!;
    const stale = { ...reopened, project: run.v1 };
    run.mount(stale);
    await waitFor(() => expect(run.latest().documents.lastFailure?.message).toContain("DOC_ARCHIVE_RECOVERY_BINDING_INVALID"));
    expect(run.latest().documentArchive!.pendingRecovery).toEqual(identity);
    expect(run.recover).not.toHaveBeenCalled(); expect(run.dispatch).toHaveBeenCalledOnce();
    expect(run.sql.rows().filter(row => row.state === "RESERVED")).toHaveLength(1);
  });
  it("reconciles a post-commit reload even when the old pending pointer remains on disk", async () => {
    const run = await reloadRuntime(), first = run.mount(); await act(() => first.result.current.requestProtocolProjection()); first.unmount();
    const pending = run.reload(), identity = pending.documentArchive!.pendingRecovery!;
    run.sql.failMetadataCommit(false);
    expect(await run.client.recover(identity)).toMatchObject({ state: "COMMITTED" });
    const count = run.sql.rows().length;
    run.mount(pending);
    await waitFor(() => expect(run.latest().documentArchive!.currentGeneration?.displayVersion).toBe(2));
    expect(run.latest().documentArchive!.pendingRequestId).toBeNull(); expect(run.sql.rows()).toHaveLength(count);
    expect(run.executed).toHaveBeenCalledOnce(); expect((await run.client.history()).entries).toHaveLength(2);
  });
  it("rejects foreign, altered handoff, stale version and absent request identities at the native HTTP boundary", async () => {
    const run = await reloadRuntime(), first = run.mount(); await act(() => first.result.current.requestProtocolProjection()); first.unmount();
    const identity = run.reload().documentArchive!.pendingRecovery!;
    const payload = { operation: "DOC_ARCHIVE_RECOVER", sessionId: run.access.identity.sessionId, projectRef: run.access.project,
      requestId: identity.requestId, projectionId: identity.projectionId, handoffDigest: identity.handoffDigest };
    const unchanged = JSON.stringify(run.sql.rows());
    for (const invalid of [
      { ...payload, sessionId: "protocol-designer-session:foreign" },
      { ...payload, handoffDigest: "ke1-0000000000000000" },
      { ...payload, projectRef: { ...payload.projectRef, versionId: run.v1.versionId, projectDigest: run.v1.projectDigest } },
      { ...payload, requestId: `drci-draft:${run.project.projectDigest}:absent` },
    ]) expect((await run.invoke({ payload: invalid, noProviderConfig: true })).status).toBeGreaterThanOrEqual(400);
    expect((await run.invoke({ payload, clientAddress: "192.0.2.254", noProviderConfig: true })).status).toBe(403);
    expect((await run.invoke({ payload, proof: "A".repeat(43), noProviderConfig: true })).status).toBe(403);
    expect(JSON.stringify(run.sql.rows())).toBe(unchanged); expect(run.executed).toHaveBeenCalledOnce();
  });
});

describe("DOC generation publication / recovery transaction — no real provider", () => {
  it("rejects a full archive write envelope before provider admission or dispatch", async () => {
    const run = await runtime({ maxConcurrentDocWrites: 1 });
    await run.archive.admit(run.access, { requestId: "existing-protected-write", requestSha256: docSha256("existing"), generatedAt: "2026-10-05T10:00:00.000Z", reservedBytes: 4_000_000 });
    const result = await run.invoke(); expect(result.status).toBe(429);
    expect(result.body.error?.code).toBe("DOC_ARCHIVE_WRITE_CAPACITY_EXCEEDED");
    expect(run.executed).not.toHaveBeenCalled(); expect(run.sql.rows()).toHaveLength(1);
  });
  it("archives before publication and recovers the same receipt without redispatch", async () => {
    const run = await runtime(), original = JSON.stringify(run.project);
    const first = await run.invoke(); expect(first.status).toBe(200);
    expect(first.body.documentPersistenceReceipt?.generation.persistenceState).toBe("COMMITTED");
    run.advance(); const second = await run.invoke();
    expect(second.body.documentPersistenceReceipt).toEqual(first.body.documentPersistenceReceipt);
    expect(run.executed).toHaveBeenCalledTimes(1); expect(run.sql.bodies()).toHaveLength(1);
    expect(JSON.stringify(run.project)).toBe(original);
  });
  it("reuses the committed generation for another command on the same digest before provider admission", async () => {
    const run = await runtime();
    const first = await run.invoke(); expect(first.status).toBe(200);
    const requestId = `drci-draft:${run.project.projectDigest}:another-click`;
    const second = await run.invoke({ payload: { ...run.body,
      observabilityContext: { ...run.body.observabilityContext, clientRequestId: requestId } } });
    expect(second.status).toBe(200);
    expect(second.body.documentPersistenceReceipt?.requestId).toBe(requestId);
    expect(second.body.documentPersistenceReceipt?.generation).toEqual(first.body.documentPersistenceReceipt?.generation);
    expect(second.body.observability.calls).toBe(0);
    expect(run.executed).toHaveBeenCalledOnce(); expect(run.sql.rows()).toHaveLength(1); expect(run.sql.bodies()).toHaveLength(1);
    expect(run.executed.mock.calls[0][6]).toBeUndefined(); // Existing serial memory guard, not the native Postgres ledger.
  });
  it("serializes concurrent server commands for one digest before dispatch, then reuses the single committed generation", async () => {
    const run = await runtime();
    const execute = run.executed.getMockImplementation()!;
    let release!: () => void;
    let dispatched!: () => void;
    const started = new Promise<void>(resolve => { dispatched = resolve; });
    const pending = new Promise<void>(resolve => { release = resolve; });
    run.executed.mockImplementation(async (...args) => { dispatched(); await pending; return execute(...args); });
    const first = run.invoke();
    await started;
    const otherCommand = (index: number) => ({ ...run.body,
      observabilityContext: { ...run.body.observabilityContext, clientRequestId: `drci-draft:${run.project.projectDigest}:concurrent-${index}` } });
    try {
      const concurrent = await Promise.all(Array.from({ length: 10 }, (_, index) => run.invoke({ payload: otherCommand(index) })));
      expect(concurrent.map(result => result.status)).toEqual(Array(10).fill(409));
      expect(concurrent.every(result => result.body.error?.code === "DOC_ARCHIVE_GENERATION_IN_PROGRESS")).toBe(true);
      expect(run.executed).toHaveBeenCalledOnce();
      expect(run.sql.rows()).toHaveLength(1); expect(run.sql.bodies()).toHaveLength(0);
    } finally { release(); }
    const committed = await first;
    expect(committed.status).toBe(200);
    const recovered = await run.invoke({ payload: otherCommand(11) });
    expect(recovered.status).toBe(200);
    expect(recovered.body.documentPersistenceReceipt?.generation).toEqual(committed.body.documentPersistenceReceipt?.generation);
    expect(recovered.body.documentPersistenceReceipt?.generation.displayVersion).toBe(1);
    expect(run.executed).toHaveBeenCalledOnce();
    expect(run.sql.rows()).toHaveLength(1); expect(run.sql.bodies()).toHaveLength(1);
    // SQL double serializes transactions only; the actual server/archive owner
    // performs admission and Project-scoped locking. No disabled UI is involved.
    expect(new Set(run.sql.projectLockArguments).size).toBe(1);
  });
  it("permits an explicit retry after a known failed generation without incrementing the successful Gn label", async () => {
    const run = await runtime();
    run.executed.mockRejectedValueOnce(new Error("OFFLINE_KNOWN_DOC_FAILURE"));
    expect((await run.invoke()).status).toBe(422);
    expect(run.sql.rows()[0].state).toBe("REJECTED"); expect(run.sql.bodies()).toHaveLength(0);
    const retried = await run.invoke({ payload: { ...run.body,
      observabilityContext: { ...run.body.observabilityContext, clientRequestId: `drci-draft:${run.project.projectDigest}:explicit-retry` } } });
    expect(retried.status).toBe(200); expect(retried.body.documentPersistenceReceipt?.generation.displayVersion).toBe(1);
    expect(run.executed).toHaveBeenCalledTimes(2); expect(run.sql.bodies()).toHaveLength(1);
  });
  it("retains a usable provider result after DOC save failure and commits it on explicit recovery only", async () => {
    const run = await runtime(); run.sql.failMetadataCommit(true);
    const failed = await run.invoke(); expect(failed.status).toBe(503); expect(failed.body.error?.code).toBe("DOC_ARCHIVE_PERSISTENCE_FAILED");
    expect(await run.archive.receipt(run.access, run.requestId)).toBeNull(); expect(run.executed).toHaveBeenCalledTimes(1);
    run.advance(); run.sql.failMetadataCommit(false);
    const recovered = await run.invoke(); expect(recovered.status).toBe(200);
    expect(recovered.body.documentDraftPack?.generatedAt).toBe("2026-10-05T10:00:00.000Z");
    expect(run.executed).toHaveBeenCalledTimes(1);
  });
  it("preserves DOC retrieval after provider-ledger finalization failure", async () => {
    const run = await runtime(), failed = await run.invoke({ ledgerFailure: true });
    expect(failed.body.error?.code).toBe("DOC_ARCHIVE_LEDGER_FINALIZATION_FAILED");
    const receipt = await run.archive.receipt(run.access, run.requestId);
    expect(receipt?.generation.persistenceState).toBe("COMMITTED");
    expect((await run.archive.body(run.access, receipt!.generation.generationId)).body.native.family).toBe("DRCI");
    expect((await run.invoke()).status).toBe(200); expect(run.executed).toHaveBeenCalledTimes(1);
  });
  it("recovers committed DOC after a lost HTTP response", async () => {
    const run = await runtime(); await expect(run.invoke({ lostResponse: true })).rejects.toThrow("OFFLINE_LOST_HTTP_RESPONSE");
    const recovered = await run.invoke();
    expect(recovered.status, JSON.stringify(recovered.body.error)).toBe(200); expect(run.executed).toHaveBeenCalledTimes(1);
  });
  it("serves authorized history without provider configuration or provider admission", async () => {
    const run = await runtime(); const first = await run.invoke(); expect(first.status, JSON.stringify(first.body.error)).toBe(200);
    const result = await run.invoke({ noProviderConfig: true, payload: { operation: "DOC_ARCHIVE_HISTORY", sessionId: run.access.identity.sessionId, projectRef: run.access.project, beforeOrdinal: null } });
    expect(result.status).toBe(200); expect(run.executed).toHaveBeenCalledTimes(1);
  });
});
