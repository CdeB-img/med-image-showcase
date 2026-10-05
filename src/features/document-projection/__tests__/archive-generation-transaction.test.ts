import { afterEach, describe, expect, it, vi } from "vitest";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import * as provider from "../../../../api/protocol-designer-openai-extraction-provider";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { createPostgresDocumentArchive, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { confirmResearchProjectContribution, authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";
import { prepareDrciDraftSource, prepareDrciDraftPack, DRCI_DOCUMENT_KINDS } from "../drci-draft-contract";
import type { ProductBridgeResponse } from "../../protocol-designer/product-bridge";
import { archiveSqlFixture } from "./archive-sql-fixture";

afterEach(() => vi.restoreAllMocks());
const runtime = async () => {
  const sessionId = "protocol-designer-session:doc-transaction", at = "2026-10-05T10:00:00.000Z";
  const authority = { actorRef: "synthetic", mandateRef: "PROJECT_OWNER" as const, authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const, verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const };
  const turn = { turnId: "source", role: "USER" as const, content: COLCHICINE_INITIAL, createdAt: at };
  const project = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([turn]), current: null,
    projectId: `${sessionId}:research-project`, authority, confirmedAt: at });
  const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority, confirmedAt: at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
  const source = prepareDrciDraftSource({ handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
  const packet = prepareDrciDraftPack(project, source);
  const value = { documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `Qualification ${kind}`,
    sections: [{ title: "Cadre de recherche", paragraphs: [packet.sourceFacts[0].content + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification déterministe sans validation scientifique. ".repeat(120) : "")], sourceRefs: [packet.sourceFacts[0].ref] }], missingElements: [] })),
    crfRows: source.crf.fields.map((field, i) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${i}`, label: field.label, domain: "À préciser", visit: "À préciser", definition: field.label,
      entryType: "Texte", unit: null, categories: null, dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null, derivedFrom: [], derivation: null, controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) };
  const executed = vi.spyOn(provider, "executeOpenAIDrciDraft").mockResolvedValue({ value, calls: 1, latencyMs: 0, modelRequested: "gpt-6-sol", modelReturned: "gpt-6-sol", reusedProtocolEvidenceRef: null } as Awaited<ReturnType<typeof provider.executeOpenAIDrciDraft>>);
  const snapshots = memoryProjectSnapshotStore(), sql = archiveSqlFixture();
  const identity = { sessionId, clientAddress: "192.0.2.1" }, registration = await snapshots.persist(identity, project, null);
  const access = { identity, project: registration.ref, proof: registration.proof };
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), sql.sql);
  const guard = createMemoryProtocolDesignerGuardForTests();
  const body = { apiVersion: "1.0.0", requestKind: "USER_TURN", conversation: { conversationId: "conversation", language: "fr", turns: [turn] }, currentProject: project,
    evaluatePersistentDelta: false, documentDraftRequest: source, observabilityContext: { sessionId, conversationId: "conversation", turnId: turn.turnId, clientRequestId: "doc-intent-1", testSessionId: null } };
  let now = Date.parse(at);
  const invoke = async (options: { ledgerFailure?: boolean; lostResponse?: boolean; payload?: unknown; noProviderConfig?: boolean } = {}) => {
    let status = 0, returned: unknown;
    const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(result) {
      if (options.lostResponse) throw new TypeError("OFFLINE_LOST_HTTP_RESPONSE"); returned = result;
    } };
    await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", host: "noxia.test", origin: "https://noxia.test", "x-forwarded-for": identity.clientAddress,
      "x-noxia-project-snapshot-proof": registration.proof }, body: options.payload ?? body }, response,
    options.noProviderConfig ? {} : { VERCEL_ENV: "preview", OPENAI_API_KEY: "OFFLINE_SYNTHETIC", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA" },
    { projectSnapshotStore: snapshots, documentArchive: archive, durableGuard: options.ledgerFailure ? { ...guard, completeRequest: async () => { throw new Error("OFFLINE_LEDGER_FAILURE"); } } : guard,
      now: () => now, fetchImpl: vi.fn(async () => { throw new Error("NETWORK_FORBIDDEN"); }) });
    return { status, body: returned as ProductBridgeResponse & { error?: { code: string } } };
  };
  return { invoke, archive, access, sql, executed, project, advance: () => { now += 60_000; } };
};

describe("DOC generation publication / recovery transaction — no real provider", () => {
  it("archives before publication and recovers the same receipt without redispatch", async () => {
    const run = await runtime(), original = JSON.stringify(run.project);
    const first = await run.invoke(); expect(first.status).toBe(200);
    expect(first.body.documentPersistenceReceipt?.generation.persistenceState).toBe("COMMITTED");
    run.advance(); const second = await run.invoke();
    expect(second.body.documentPersistenceReceipt).toEqual(first.body.documentPersistenceReceipt);
    expect(run.executed).toHaveBeenCalledTimes(1); expect(run.sql.bodies()).toHaveLength(1);
    expect(JSON.stringify(run.project)).toBe(original);
  });
  it("retains a usable provider result after DOC save failure and commits it on explicit recovery only", async () => {
    const run = await runtime(); run.sql.failMetadataCommit(true);
    const failed = await run.invoke(); expect(failed.status).toBe(503); expect(failed.body.error?.code).toBe("DOC_ARCHIVE_PERSISTENCE_FAILED");
    expect(await run.archive.receipt(run.access, "doc-intent-1")).toBeNull(); expect(run.executed).toHaveBeenCalledTimes(1);
    run.advance(); run.sql.failMetadataCommit(false);
    const recovered = await run.invoke(); expect(recovered.status).toBe(200);
    expect(recovered.body.documentDraftPack?.generatedAt).toBe("2026-10-05T10:00:00.000Z");
    expect(run.executed).toHaveBeenCalledTimes(1);
  });
  it("preserves DOC retrieval after provider-ledger finalization failure", async () => {
    const run = await runtime(), failed = await run.invoke({ ledgerFailure: true });
    expect(failed.body.error?.code).toBe("DOC_ARCHIVE_LEDGER_FINALIZATION_FAILED");
    const receipt = await run.archive.receipt(run.access, "doc-intent-1");
    expect(receipt?.generation.persistenceState).toBe("COMMITTED");
    expect((await run.archive.body(run.access, receipt!.generation.generationId)).body.native.family).toBe("DRCI");
    expect((await run.invoke()).status).toBe(200); expect(run.executed).toHaveBeenCalledTimes(1);
  });
  it("recovers committed DOC after a lost HTTP response", async () => {
    const run = await runtime(); await expect(run.invoke({ lostResponse: true })).rejects.toThrow("OFFLINE_LOST_HTTP_RESPONSE");
    expect((await run.invoke()).status).toBe(200); expect(run.executed).toHaveBeenCalledTimes(1);
  });
  it("serves authorized history without provider configuration or provider admission", async () => {
    const run = await runtime(); await run.invoke();
    const result = await run.invoke({ noProviderConfig: true, payload: { operation: "DOC_ARCHIVE_HISTORY", sessionId: run.access.identity.sessionId, projectRef: run.access.project, beforeOrdinal: null } });
    expect(result.status).toBe(200); expect(run.executed).toHaveBeenCalledTimes(1);
  });
});
