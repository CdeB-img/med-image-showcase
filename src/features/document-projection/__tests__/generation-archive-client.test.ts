import { afterEach, describe, expect, it, vi } from "vitest";
import * as bridge from "../../protocol-designer/product-bridge-client";
import { createDocumentArchiveClient } from "../generation-archive-client";
import { freezeDocumentGeneration } from "../generation-exports";
import { buildStudyDeliverablePortfolio } from "../study-deliverable-portfolio";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { confirmResearchProjectContribution, authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { createPostgresDocumentArchive, docSha256, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
/** CURRENT_STRUCTURAL_INVARIANT: real DOC/snapshot owners and native source;
 * only the HTTP transport and JSONB property ordering are simulated. */
const runtime = async () => {
  const sessionId = "protocol-designer-session:archive-client", at = "2026-10-05T10:00:00.000Z";
  const authority = { actorRef: "synthetic", mandateRef: "PROJECT_OWNER" as const, authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const, verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const };
  const project = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([{ turnId: "source", role: "USER", content: COLCHICINE_INITIAL, createdAt: at }]),
    current: null, projectId: `${sessionId}:research-project`, authority, confirmedAt: at });
  const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority, confirmedAt: at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
  const body = await freezeDocumentGeneration({ native: { family: "TEMPLATE", value: projection },
    artifacts: buildStudyDeliverablePortfolio({ project, protocolProjection: projection, generatedAt: at }).artifacts,
    sha256: docSha256, renderOrigin: "GENERATION_TIME" });
  const snapshots = memoryProjectSnapshotStore(), fixture = archiveSqlFixture();
  const identity = { sessionId, clientAddress: "192.0.2.1" }, registration = await snapshots.persist(identity, project, null);
  vi.spyOn(bridge, "ensureServerProjectSnapshot").mockResolvedValue(registration);
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql);
  const mutate = { result: (value: unknown): unknown => value };
  const transport = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    expect(url).toBe("/api/protocol-designer-bridge"); expect(init?.credentials).toBe("same-origin");
    const result = await executeDocumentArchiveOperation({ body: JSON.parse(String(init?.body)), proof: registration.proof,
      clientAddress: identity.clientAddress, connection: null, environment: {}, snapshots, archive });
    return new Response(JSON.stringify(mutate.result(result.body)), { status: result.status });
  });
  vi.stubGlobal("fetch", transport);
  return { client: createDocumentArchiveClient(sessionId, project), body, fixture, mutate };
};

describe("DOC client verifies immutable bodies and transport receipts", () => {
  it("accepts reordered JSONB metadata while preserving the exact native TEXT body and exports", async () => {
    const run = await runtime(), receipt = await run.client.commit("new-template", run.body);
    run.mutate.result = value => {
      const result = value as { result: { ref?: Record<string, unknown> } };
      if (result.result?.ref) {
        const ref = result.result.ref;
        ref.project = Object.fromEntries(Object.entries(ref.project as object).reverse());
        ref.files = (ref.files as object[]).map(file => Object.fromEntries(Object.entries(file).reverse()));
        result.result.ref = Object.fromEntries(Object.entries(ref).reverse());
      }
      return value;
    };
    const selected = await run.client.body(receipt.generation.generationId);
    expect(JSON.stringify(selected.body)).toBe(JSON.stringify(run.body));
    expect((await run.client.history()).entries).toHaveLength(1);
    expect(await run.client.receipt("new-template")).toEqual(receipt);
  });
  it("rejects corrupted native bytes instead of displaying an unverified result", async () => {
    const run = await runtime(), receipt = await run.client.commit("new-template", run.body);
    run.mutate.result = value => {
      const response = value as { result: { body: { rendererVersion: string } } };
      response.result.body.rendererVersion = "CORRUPTED"; return value;
    };
    await expect(run.client.body(receipt.generation.generationId)).rejects.toThrow("DOC_ARCHIVE_BODY_CORRUPT");
  });
  it("rejects a receipt for another request before publishing it", async () => {
    const run = await runtime();
    run.mutate.result = value => { const response = value as { result: { requestId: string } }; response.result.requestId = "another-request"; return value; };
    await expect(run.client.commit("new-template", run.body)).rejects.toThrow("DOC_ARCHIVE_RECEIPT_INVALID");
    expect(run.fixture.bodies()).toHaveLength(1); // Durable commit survived; no false publication.
  });
  it("rejects scientific text injected into metadata-only history", async () => {
    const run = await runtime(); await run.client.commit("new-template", run.body);
    run.mutate.result = value => {
      const response = value as { result: { entries: { files: { content?: string }[] }[] } };
      response.result.entries[0].files[0].content = "BODY_MUST_NOT_BE_METADATA"; return value;
    };
    await expect(run.client.history()).rejects.toThrow("DOC_ARCHIVE_METADATA_INVALID");
  });
  it("does not convert archive unavailability into an empty history", async () => {
    const run = await runtime();
    run.mutate.result = () => ({ error: { code: "DOC_ARCHIVE_UNAVAILABLE" } });
    await expect(run.client.history()).rejects.toThrow("DOC_ARCHIVE_UNAVAILABLE");
  });
});
