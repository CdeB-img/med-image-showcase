import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { createPostgresProtocolDesignerDurableGuard, type DurablePublicRequestContext } from "../../../../server/protocol-designer-durable-guard";
import { AZURE_LOCAL_INPUT_POLICY } from "../../../../server/protocol-designer-local-token-admission";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256 } from "../../../../server/protocol-designer-document-archive";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { behaviorAuthority, behaviorContribution, behaviorItem, behaviorTurn } from "../../protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL } from "../../protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import { authorizeResearchProjectDocumentHandoff, confirmResearchProjectContribution } from "../../research-project-construction";
import { refreshFunctionalResetDocumentPortfolio, markFunctionalResetDocumentFailure } from "../functional-reset-boundary";
import { failedDocumentRetryProjection, hasCurrentArchivedGeneration, publishArchivedGeneration } from "../generation-session";
import { createFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { encodeSessionStorage } from "../../protocol-designer/functional-reset/session-storage-codec";
import { readProjectSessions } from "../../protocol-designer/functional-reset/project-workspace-storage";
import { documentAdministrationFrom, emptyProjectAdministration } from "../../protocol-designer/functional-reset/project-administration";
import { useDocumentGeneration } from "../../protocol-designer/functional-reset/useDocumentGeneration";
import { providerCallRequestObservability } from "../../protocol-designer/provider-call-observability";
import * as bridgeClient from "../../protocol-designer/product-bridge-client";
import * as archiveClient from "../generation-archive-client";
import { documentNativeGeneratedAt } from "../generation-persistence";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";
import { materializeDrciDraftPack, prepareDrciDraftPack, prepareDrciDraftSource, prepareDrciGenerationBatches, validateDrciHandoff } from "../drci-draft-contract";
import { freezeDocumentGeneration } from "../generation-exports";
import { drciDraftPackArtifacts } from "../drci-draft-pack";
import type { ProductBridgeResponse } from "../../protocol-designer/product-bridge";

// CURRENT_STRUCTURAL_INVARIANT: actual producer, reuse reader, native DOC
// validation and transactional archive. Scientific inputs come from the current
// meaningful clinical trial fixture, not an empty Project or pack.
type Row = Record<string, unknown>;
let rows: Row[] = [];
const queries: string[] = [];
vi.mock("postgres", () => ({ default: () => Object.assign(async (parts: TemplateStringsArray) => {
  const query = parts.join("?"); queries.push(query);
  if (query.includes("select a.*, s.client_key_hash")) return [];
  if (query.includes("select o.operation_key")) return rows;
  throw new Error("UNEXPECTED_SQL");
}, { end: async () => {} }) }));
afterEach(() => { cleanup(); localStorage.clear(); rows = []; queries.length = 0; vi.useRealTimers(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const canonical = (value: unknown): string => value && typeof value === "object"
  ? Array.isArray(value) ? `[${value.map(canonical).join(",")}]`
    : `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`
  : JSON.stringify(value);
// SANITIZED_HISTORICAL_REPLAY: lifecycle shape of archived projections
// document-projection:ke1-d058ec851a6e9531 / ke1-c1e3a1bd80241199.
// Only the two causal timestamps are historical. Native identities/content
// are generated from the meaningful current clinical fixture, not private prose.
const at = "2026-10-07T01:02:23.202Z", retryAt = "2026-10-07T10:18:27.898Z";
const endpoint = "https://qualification.services.ai.azure.com/api/projects/offline/openai/v1/responses";
const scopeCompanion = "PROTOCOL_SYNOPSIS+CRF+RECRUITMENT";
const sourceFor = (project: ReturnType<typeof confirmResearchProjectContribution>) => {
  const handoffDecision = authorizeResearchProjectDocumentHandoff({ project, authority: behaviorAuthority, confirmedAt: at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
  return prepareDrciDraftSource({ handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
};
const scopeOutput = (packet: ReturnType<typeof prepareDrciDraftPack>, scope: string) => {
  const kinds = scope.split("+");
  // Native meaning, negations and open issues are retained. Padding is only
  // the existing editorial length envelope, not a scientific assertion.
  const prose = packet.sourceFacts.map(f => f.content).join(" ");
  return { documents: kinds.map(kind => ({ kind, title: `Qualification ${kind}`, sections: [{ title: "Cadre scientifique",
    paragraphs: [prose + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification structurelle sans validation clinique finale. ".repeat(95) : "")], sourceRefs: ["f0"] }],
    missingElements: [] })), crfRows: scope === "PROTOCOL_FULL" ? [] : packet.crf.fields.map((field, i) => ({
      variableRef: `f${packet.sourceFacts.findIndex(f => f.ref === field.canonicalVariableId)}`, variableId: `MEASURE_${i}`, label: field.label,
      domain: "Mesures", visit: "Visite unique", definition: field.label, entryType: "Nombre", unit: field.unit, categories: null,
      dataOrigin: "SITE_RECORDED", source: "Recueil synthétique", required: "Selon Project", condition: null, derivedFrom: [],
      derivation: null, controls: [], analysisImpact: null, specificationStatus: "ADOPTED_PROJECT" })) };
};
const completed = (packet: ReturnType<typeof prepareDrciDraftPack>, scope: string) => JSON.stringify({ id: `response-${scope}`, status: "completed",
  model: "gpt-6.1-sol", output_text: JSON.stringify(scopeOutput(packet, scope)), usage: { input_tokens: 100, output_tokens: 100 } });

const setup = async (sessionId = "protocol-designer-session:partial-doc") => {
  const clientAddress = "192.0.2.20";
  const initial = behaviorTurn("initial", COLCHICINE_INITIAL);
  const v1 = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([initial]), current: null,
    projectId: `${sessionId}:research-project`, authority: behaviorAuthority, confirmedAt: at });
  const turn = { ...behaviorTurn("revision", "L'étude clinique sera monocentrique."), createdAt: at };
  const v2 = confirmResearchProjectContribution({ contribution: behaviorContribution({ contributionId: "revision", turns: [turn], candidateObjects: [
    behaviorItem({ itemId: "site", proposedType: "PROJECT_INFORMATION", content: turn.content, turnId: turn.turnId }),
  ] }), current: v1, projectId: v1.projectId, authority: behaviorAuthority, confirmedAt: at });
  const source = sourceFor(v2), packet = prepareDrciDraftPack(v2, source);
  const context = { sessionId, conversationId: "conversation", turnId: "doc-attempt", clientRequestId: `drci-draft:${v2.projectDigest}:first`, testSessionId: null };
  const body = { apiVersion: "1.0.0", requestKind: "USER_TURN", evaluatePersistentDelta: false, currentProject: v2,
    conversation: { conversationId: "conversation", language: "fr", turns: [turn] }, documentDraftRequest: source, observabilityContext: context };
  let dispatchedBody = body;
  const guard = createPostgresProtocolDesignerDurableGuard("postgres://offline");
  let filtered = true;
  const dispatched: string[] = [], operationRefs: string[] = [];
  const transport = { destination: "azure" as const, responsesEndpoint: endpoint, terraRequestedModel: "gpt-6.1-sol" as const };
  const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const payload = String(init?.body), parsed = JSON.parse(payload);
    const scope = JSON.parse(parsed.input).DOCUMENT_SCOPE.join("+"); dispatched.push(scope);
    const response = scope === "PROTOCOL_FULL" && filtered
      ? JSON.stringify({ status: "incomplete", model: "gpt-6.1-sol", incomplete_details: { reason: "content_filter" }, output_text: "not consumable", usage: { input_tokens: 100, output_tokens: 0 } })
      : completed(packet, scope);
    // The financial settlement boundary is already covered by the durable
    // provider tests. Here its existing durable rows are evidence inputs.
    const operationRef = `operation-${operationRefs.length}`; operationRefs.push(operationRef);
    rows.push({ operation_key: operationRef, scope, state: scope === "PROTOCOL_FULL" && filtered ? "INCOMPLETE_CONTENT_FILTERED" : "CONSUMED",
      provider_http_status: 200, provider_response_body: response, provider_response_digest: hash(response), settled_at: at,
      qualification_failure_code: null, endpoint_digest: hash(endpoint), payload_digest: hash(payload),
      configuration_digest: hash(canonical({ purpose: "DOCUMENT_PROJECTION", reasoningEffort: "medium", retryIndex: 0, inputAdmissionPolicy: AZURE_LOCAL_INPUT_POLICY })),
      session_key_hash: hash(sessionId), client_key_hash: hash(clientAddress), request_digest: hash(canonical(dispatchedBody)) });
    return new Response(response, { status: 200 });
  });
  const snapshots = memoryProjectSnapshotStore(), fixture = archiveSqlFixture();
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql);
  const identity = { sessionId, clientAddress };
  const reg1 = await snapshots.persist(identity, v1, null);
  let access = { identity, project: reg1.ref, proof: reg1.proof };
  const packet1 = prepareDrciDraftPack(v1, sourceFor(v1));
  const values1 = prepareDrciGenerationBatches(packet1).map(batch => batch.expand(scopeOutput(packet1, batch.requestScope)));
  const pack1 = materializeDrciDraftPack({ documents: values1.flatMap(v => v.documents), crfRows: values1.flatMap(v => v.crfRows) }, { project: v1, packet: packet1, generatedAt: at });
  const commit = async (requestId: string, pack: typeof pack1, project = v2) => archive.commit(access, intent(requestId).requestId,
    await freezeDocumentGeneration({ native: { family: "DRCI", value: pack }, artifacts: drciDraftPackArtifacts(pack, project), sha256: docSha256, renderOrigin: "GENERATION_TIME" }));
  const intent = (requestId: string) => ({ family: "DRCI" as const, requestId: `drci-draft:${access.project.projectDigest}:${requestId}`, requestSha256: docSha256(requestId), generatedAt: at, reservedBytes: 4_000_000 });
  await archive.admit(access, intent("g1")); const g1 = await commit("g1", pack1, v1);
  const frozenG1 = JSON.stringify(await archive.body(access, g1.generation.generationId));
  const reg2 = await snapshots.persist(identity, v2, access.proof); access = { identity, project: reg2.ref, proof: reg2.proof };
  const invoke = async (requestBody = body) => {
    dispatchedBody = requestBody;
    const preparation = await guard.prepareRequest({ headers: { "x-forwarded-for": clientAddress }, body: requestBody });
    const result = await executeProtocolDesignerBridge({ body: requestBody, openAiApiKey: "OFFLINE", apiKey: null, chatRuntime: "TERRA",
      openAiTransport: transport, fetchImpl: fetchImpl as typeof fetch, documentScopeExecution: "CONCURRENT", documentGeneratedAt: at,
      readReusableDocumentScope: scope => guard.readReusableDocumentScope!({ context: preparation as DurablePublicRequestContext, body: requestBody, ...scope }) });
    const observation = (result.body as ProductBridgeResponse).observability;
    for (const row of rows) if (!row.response_body) row.response_body = { observability: observation };
    return result;
  };
  const retryBody = { ...body, observabilityContext: { ...context, turnId: "retry", clientRequestId: `drci-draft:${v2.projectDigest}:retry` } };
  return { v1, v2, body, packet, guard, invoke, retryBody, dispatched, rows, archive, access, fixture, snapshots, g1, frozenG1, intent, commit,
    succeed: () => { filtered = false; }, reader: async (payload: string, scope = scopeCompanion, requestBody = retryBody) => {
      const preparation = await guard.prepareRequest({ headers: { "x-forwarded-for": clientAddress }, body: requestBody });
      return guard.readReusableDocumentScope!({ context: preparation as DurablePublicRequestContext, body: requestBody, scope, endpoint, payload });
    } };
};

describe("explicit partial DOC resume (native boundaries, no real provider)", () => {
  it("reloads the failed attempt and retries its immutable original authorization/projection at the actual command and durable lookup boundaries", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(at);
    const base = createFunctionalResetSession(at), run = await setup(base.sessionId);
    base.workspace = { title: "Qualification clinique", revision: 0, administration: emptyProjectAdministration() };
    const administration = documentAdministrationFrom(base.projectId, base.workspace);
    const latest: { current: FunctionalResetSession } = { current: { ...publishArchivedGeneration({ ...base, project: run.v1 }, run.g1.generation),
      project: run.v2, runtimeTurns: run.body.conversation.turns,
      documents: refreshFunctionalResetDocumentPortfolio({ project: run.v2, administration, requestedAt: at }) } };
    const frozenV2 = JSON.stringify(run.v2), requests: typeof run.body[] = [];
    vi.spyOn(archiveClient, "createDocumentArchiveClient").mockReturnValue({
      history: cursor => run.archive.history(run.access, cursor, "DRCI"),
      body: id => run.archive.body(run.access, id), receipt: id => run.archive.receipt(run.access, id),
      async commit(id, body) {
        await run.archive.admit(run.access, { requestId: id, requestSha256: docSha256(JSON.stringify(body)),
          generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: Buffer.byteLength(JSON.stringify(body)) });
        return run.archive.commit(run.access, id, body);
      },
    });
    vi.spyOn(bridgeClient, "requestProtocolDesignerBridge").mockImplementation(async request => {
      const native = JSON.parse(JSON.stringify({ ...request, apiVersion: "1.0.0" })) as typeof run.body;
      requests.push(native);
      const requestId = native.observabilityContext.clientRequestId;
      await run.archive.admit(run.access, { family: "DRCI", requestId, requestSha256: hash(canonical(native)), generatedAt: at, reservedBytes: 4_000_000 });
      const response = await run.invoke(native);
      if (response.status !== 200) {
        await run.archive.reject(run.access, requestId);
        const failure = response.body as { error: { code: string; message: string }; observability?: ProductBridgeResponse["observability"] };
        throw new bridgeClient.ProductBridgeClientError(failure.error.code, failure.error.message, null,
          providerCallRequestObservability(failure.observability?.providerCalls ?? []));
      }
      const result = response.body as ProductBridgeResponse, pack = result.documentDraftPack!;
      const body = await freezeDocumentGeneration({ native: { family: "DRCI", value: pack }, artifacts: drciDraftPackArtifacts(pack, run.v2),
        sha256: docSha256, renderOrigin: "GENERATION_TIME" });
      return { ...result, documentPersistenceReceipt: await run.archive.commit(run.access, requestId, body) };
    });
    const mount = () => renderHook(() => useDocumentGeneration({ latestSessionRef: latest,
      setSession: update => { latest.current = typeof update === "function" ? update(latest.current) : update; },
      administration, projectionMode: "STANDARD", onSessionChange: async () => ({ scientificPersisted: true, navigationPointer: "NOT_APPLICABLE" }),
      setDocumentSaveWarning: vi.fn(), setDeliverableWorkspaceOpen: vi.fn(), setDocumentGenerationVersion: vi.fn(),
      setDocumentGenerationStartedAt: vi.fn(), setDocumentGenerationElapsed: vi.fn(), setDocumentGenerationComplete: vi.fn(),
      setDocumentGenerationPending: vi.fn(), setDocumentGenerationStage: vi.fn(),
    }));
    const first = mount(); await act(() => first.result.current.requestProtocolProjection()); first.unmount();
    expect(requests).toHaveLength(1); expect(run.dispatched).toEqual(["PROTOCOL_FULL", scopeCompanion]);
    expect(latest.current.documents.lastFailure).not.toBeNull();
    const originalId = latest.current.documentArchive!.currentProjectionId!;
    const original = await run.archive.body(run.access, originalId), immutable = JSON.stringify(original);
    expect((await run.archive.history(run.access, undefined, "DRCI")).entries.map(g => g.displayVersion)).toEqual([1]);
    // Actual storage reload refreshes presentation and clears lastFailure;
    // the durable source pointer must still identify the incomplete attempt.
    localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, encodeSessionStorage(latest.current));
    const reopened = readProjectSessions(localStorage);
    expect(reopened.unreadable).toEqual([]); latest.current = reopened.projects[0].session;
    expect(latest.current.documents.lastFailure).toBeNull(); expect(latest.current.documents.projections).toEqual([]);
    vi.setSystemTime(retryAt); run.succeed();
    const retry = mount(); await act(() => retry.result.current.requestProtocolProjection());
    expect(requests).toHaveLength(2);
    expect(requests[1].documentDraftRequest).toEqual(requests[0].documentDraftRequest);
    expect(requests[1].documentDraftRequest.handoffDecision.timestamp).toBe(at);
    expect(latest.current.documentArchive!.currentProjectionId).toBe(originalId);
    const normalized = { ...requests[1], observabilityContext: requests[0].observabilityContext };
    expect(hash(canonical(normalized))).toBe(hash(canonical(requests[0])));
    expect(run.dispatched).toEqual(["PROTOCOL_FULL", scopeCompanion, "PROTOCOL_FULL"]);
    expect(JSON.stringify(await run.archive.body(run.access, originalId))).toBe(immutable);
    expect(latest.current.documentArchive!.currentGeneration!.displayVersion).toBe(2);
    expect(latest.current.documents.lastFailure).toBeNull(); expect(latest.current.documents.projections).toEqual([]);
    expect(JSON.stringify(run.v2)).toBe(frozenV2);
    expect(JSON.stringify(await run.archive.body(run.access, run.g1.generation.generationId))).toBe(run.frozenG1);
    expect((await run.archive.history(run.access, undefined, "DRCI")).entries.map(g => g.displayVersion)).toEqual([2, 1]);
    await act(() => retry.result.current.requestProtocolProjection()); expect(requests).toHaveLength(2);
  });
  it("retains the native failed handoff but never treats historical G1 as a committed current V2 generation", async () => {
    const run = await setup();
    const source = sourceFor(run.v2);
    const documents = refreshFunctionalResetDocumentPortfolio({ project: run.v2, handoffDecision: source.handoffDecision, requestedAt: at, generateProtocol: true });
    const session = { ...createFunctionalResetSession(), project: run.v2,
      documents: markFunctionalResetDocumentFailure(run.v2, documents, new Error("PROVIDER_INCOMPLETE")) };
    expect(failedDocumentRetryProjection(session)).toBe(documents.projections.at(-1));
    expect(failedDocumentRetryProjection({ ...session, project: run.v1 })).toBeNull();
    expect(failedDocumentRetryProjection({ ...session, documents: { ...session.documents, lastFailure: null } })).toBeNull();
    const projection = documents.projections.at(-1)!;
    const archived = { ...session, documents: { ...session.documents, lastFailure: null }, documentArchive: {
      ...session.documentArchive!, projectId: run.v2.projectId, currentProjectionId: projection.projectionId,
    } };
    expect(failedDocumentRetryProjection(archived)).toBe(projection);
    expect(failedDocumentRetryProjection({ ...archived, project: run.v1 })).toBeNull();
    expect(failedDocumentRetryProjection({ ...archived, project: { ...run.v2, projectId: "another-project" } })).toBeNull();
    expect(failedDocumentRetryProjection({ ...archived, project: { ...run.v2, projectDigest: "changed" } })).toBeNull();
    expect(failedDocumentRetryProjection({ ...archived, project: { ...run.v2, versionId: "changed" } })).toBeNull();
    expect(failedDocumentRetryProjection({ ...archived, documentArchive: { ...archived.documentArchive, currentProjectionId: "another-source" } })).toBeNull();
    const administration = documentAdministrationFrom(run.v2.projectId, { title: "Nouveau contexte", revision: 1, administration: emptyProjectAdministration() });
    expect(failedDocumentRetryProjection(archived, administration)).toBeNull();
    // The lifecycle recovers, never repairs/re-authorizes, an old native
    // envelope. Its existing validator must reject an invalid authorization.
    for (const invalid of [{ ...source.handoffDecision, status: "REJECTED" },
      { ...source.handoffDecision, projectVersion: run.v1.versionId }, { ...source.handoffDecision, targets: ["unrelated-attempt"] }]) {
      expect(() => validateDrciHandoff(run.v2, invalid)).toThrow();
    }
    const current = publishArchivedGeneration({ ...session, project: run.v1 }, run.g1.generation);
    expect(hasCurrentArchivedGeneration(current)).toBe(true);
    expect(hasCurrentArchivedGeneration({ ...current, project: run.v2 })).toBe(false);
    expect(hasCurrentArchivedGeneration({ ...current, documentArchive: { ...current.documentArchive!, currentGenerationId: null } })).toBe(false);
  });
  it("keeps filtered protocol terminal; retries protocol only, commits exactly G2 and reloads lazy immutable history", async () => {
    const run = await setup(), frozenV2 = JSON.stringify(run.v2);
    await run.archive.admit(run.access, run.intent("failed"));
    const failed = await run.invoke(); expect(failed.status).toBe(422);
    await run.archive.reject(run.access, run.intent("failed").requestId);
    expect((await run.archive.history(run.access, undefined, "DRCI")).entries.map(g => g.displayVersion)).toEqual([1]);
    expect(run.dispatched).toEqual(["PROTOCOL_FULL", scopeCompanion]);
    const oldFiltered = JSON.stringify(run.rows[0]);
    run.succeed(); await run.archive.admit(run.access, run.intent("retry"));
    const retry = await run.invoke(run.retryBody); expect(retry.status).toBe(200);
    const result = retry.body as ProductBridgeResponse;
    expect(run.dispatched).toEqual(["PROTOCOL_FULL", scopeCompanion, "PROTOCOL_FULL"]);
    expect(result.observability.calls).toBe(1); expect(result.observability.providerCalls).toHaveLength(1);
    expect(result.documentDraftPack!.reusedScopeEvidenceRefs).toEqual([{ scope: scopeCompanion, operationRef: "durable-provider-operation:operation-1" }]);
    const g2 = await run.commit("retry", result.documentDraftPack!);
    expect(g2.generation.displayVersion).toBe(2); expect(g2.generation.predecessorId).toBe(run.g1.generation.generationId);
    expect(JSON.stringify(run.rows[0])).toBe(oldFiltered); expect(JSON.stringify(run.v2)).toBe(frozenV2);
    expect(JSON.stringify(await run.archive.body(run.access, run.g1.generation.generationId))).toBe(run.frozenG1);
    const reloaded = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    const count = run.fixture.queries.length;
    expect((await reloaded.history(run.access, undefined, "DRCI")).entries.map(g => g.displayVersion)).toEqual([2, 1]);
    expect(run.fixture.queries.slice(count).filter(q => /^\s*select/u.test(q)).join(" ")).not.toContain("doc_generation_body");
    expect(run.fixture.bodies()).toHaveLength(2); expect(run.fixture.rows().map(r => r.state)).toEqual(["COMMITTED", "REJECTED", "COMMITTED"]);
    expect(queries.every(q => /^\s*select/u.test(q))).toBe(true);
  });
  it("a second filtered protocol still produces no G2 and no automatic loop or companion dispatch", async () => {
    const run = await setup(); await run.invoke();
    expect((await run.invoke(run.retryBody)).status).toBe(422);
    expect(run.dispatched).toEqual(["PROTOCOL_FULL", scopeCompanion, "PROTOCOL_FULL"]);
    expect((await run.archive.history(run.access, undefined, "DRCI")).entries).toHaveLength(1);
  });
  it.each(["project-id", "project-version", "project-digest", "handoff", "model", "prompt", "scope", "output-schema", "configuration", "payload", "endpoint", "session", "client", "settlement", "terminal-state", "input"])("forbids scope reuse on %s mismatch", async mismatch => {
    const run = await setup(); await run.invoke();
    const row = run.rows.find(r => r.scope === scopeCompanion)!;
    const payload = JSON.parse(JSON.stringify({ model: "gpt-6.1-sol", instructions: prepareDrciGenerationBatches(run.packet)[1].instruction,
      input: prepareDrciGenerationBatches(run.packet)[1].context, reasoning: { effort: "medium" }, max_output_tokens: 16000, store: false, service_tier: "default", text: { format: { type: "json_object" } } }));
    expect(await run.reader(JSON.stringify(payload))).not.toBeNull();
    const modified = structuredClone(run.retryBody);
    if (mismatch === "project-id") modified.currentProject.projectId += "different";
    if (mismatch === "project-version") modified.currentProject.versionId += "different";
    if (mismatch === "project-digest") modified.currentProject.projectDigest += "different";
    if (mismatch === "handoff") modified.documentDraftRequest.handoffDecision.timestamp = "2026-10-07T10:01:00.000Z";
    if (mismatch === "model") payload.model = "gpt-6-sol";
    if (mismatch === "prompt") payload.instructions += "new contract";
    if (mismatch === "output-schema") payload.input = JSON.stringify({ ...JSON.parse(payload.input), DOCUMENT_SPECIFICATION: "DRCI_OPERATIONAL_V3" });
    if (mismatch === "configuration") row.configuration_digest = hash("changed native provider configuration");
    if (mismatch === "payload") payload.input = JSON.stringify({ ...JSON.parse(payload.input), DATA_MANAGEMENT_CRF: {} });
    if (mismatch === "endpoint") row.endpoint_digest = hash("other endpoint");
    if (mismatch === "session") row.session_key_hash = hash("other session");
    if (mismatch === "client") row.client_key_hash = hash("other client");
    if (mismatch === "settlement") row.settled_at = null;
    if (mismatch === "terminal-state") row.state = "UNKNOWN_AFTER_DISPATCH";
    if (mismatch === "input") modified.conversation.turns[0].content += " Une information nouvelle.";
    expect(await run.reader(JSON.stringify(payload), mismatch === "scope" ? "PROTOCOL_FULL" : scopeCompanion, modified)).toBeNull();
  });
  it("verifies raw digest and still rejects a reused invalid native scope instead of repairing or redispatching it", async () => {
    const run = await setup(); await run.invoke(); run.succeed();
    const row = run.rows.find(r => r.scope === scopeCompanion)!;
    row.provider_response_digest = "corrupt";
    expect((await run.invoke(run.retryBody)).status).toBe(422);
    expect(run.dispatched).toHaveLength(2);
    const invalid = JSON.parse(String(row.provider_response_body));
    const output = JSON.parse(invalid.output_text); output.crfRows[0].visit = null;
    invalid.output_text = JSON.stringify(output); row.provider_response_body = JSON.stringify(invalid); row.provider_response_digest = hash(String(row.provider_response_body));
    expect((await run.invoke({ ...run.retryBody, observabilityContext: { ...run.retryBody.observabilityContext, clientRequestId: "another-explicit-retry" } })).status).toBe(422);
    expect(run.dispatched).toHaveLength(2);
    expect(run.dispatched.filter(scope => scope === scopeCompanion)).toHaveLength(1);
    expect((await run.archive.history(run.access, undefined, "DRCI")).entries).toHaveLength(1);
  });
});
