import { afterEach, describe, expect, it, vi } from "vitest";
import recorded from "../../protocol-designer/functional-reset/__tests__/fixtures/recorded-preview-finalization.json";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession, FUNCTIONAL_RESET_STORAGE_KEY } from "../../protocol-designer/functional-reset/session";
import { encodeSessionStorage } from "../../protocol-designer/functional-reset/session-storage-codec";
import { prepareContinuousWorkingDraft, prepareWorkingDraftRequest, type WorkingDraftUpdate } from "../../protocol-designer/functional-reset/continuous-project-build";
import type { StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal";
import { confirmResearchProjectContribution, authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { acquireDocumentKnowledge } from "../../protocol-designer/functional-reset/documentary-conversation";
import { prepareTerraConversationRequest } from "../../protocol-designer/functional-reset/conversation-request";
import { prepareTerraConversation } from "../../scientific-thinking/scientific-collaborator-conversation";
import { refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { buildStudyDeliverablePortfolio, buildCanonicalCrfPackage, buildStudyFilesZipBytes } from "../study-deliverable-portfolio";
import { materializeDrciDraftPack, drciDraftPackArtifacts } from "../drci-draft-pack";
import { prepareDrciDraftPack, DRCI_DOCUMENT_KINDS } from "../drci-draft-contract";
import { freezeDocumentGeneration } from "../generation-exports";
import { documentNativeGeneratedAt, type DocumentGenerationBody } from "../generation-persistence";
import { publishArchivedTemplate, hydrateDocumentCommandSession } from "../generation-session";
import { createPostgresDocumentArchive, docSha256, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { archiveSqlFixture } from "./archive-sql-fixture";
import { offlineArchiveClient, resetOfflineArchiveClients } from "./offline-archive-client";

const at = (i: number) => new Date(Date.UTC(2026, 9, 5, 10, 0, i)).toISOString();
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
/** CURRENT_SEMANTIC_INVARIANT for source fidelity; CURRENT_STRUCTURAL_INVARIANT
 * for growth/persistence. Reuse the versioned, meaningful scientific replay;
 * no empty proposal or fabricated successful owner state substitutes for it. */
const source = () => {
  const s = createFunctionalResetSession(at(0)), composition = recorded.composition as StudyProposalComposition;
  s.runtimeTurns = [{ turnId: composition.sourceTurnRef, role: "USER", content: recorded.user, createdAt: at(0) },
    { turnId: composition.sourceResponseRef, role: "NOXIA", content: recorded.assistant, createdAt: at(0) }];
  const prepared = prepareContinuousWorkingDraft(s, composition, recorded.update as WorkingDraftUpdate, composition.proposal.contextDigest);
  expect(prepared.failure).toBeNull();
  const review = prepared.readyReview!;
  const project = confirmResearchProjectContribution({ contribution: review.contribution, current: null, projectId: s.projectId,
    authority: s.projectAuthority, confirmedAt: at(0), reviewedProjection: review.candidate.humanReviewProjection,
    selectedChangeRefs: review.candidate.humanReviewProjection.coveredChangeRefs, confirmationSourceRefs: [composition.sourceTurnRef] });
  const evidence = acquireDocumentKnowledge({ ...s, project }, at(0));
  const decision = authorizeResearchProjectDocumentHandoff({ project, authority: s.projectAuthority, confirmedAt: at(0) });
  return { session: { ...s, ...evidence, project }, project, decision, evidence };
};
const contexts = (session: ReturnType<typeof source>["session"]) => {
  const req = { apiVersion: "1.0.0" as const, ...prepareTerraConversationRequest(session, session.runtimeTurns, session.runtimeTurns[0], true, false) };
  return JSON.stringify({ conversation: prepareTerraConversation(req).context,
    workingDraft: prepareWorkingDraftRequest({ ...req, prepareWorkingDraft: true }).context });
};
afterEach(() => { localStorage.clear(); resetOfflineArchiveClients(); vi.unstubAllGlobals(); });
describe("clean DOC cutover and native archive growth — no provider/network", () => {
  it("starts clean, reloads technical projection references and preserves their immutable bodies outside user history", async () => {
    const network = vi.fn(async () => { throw new Error("NETWORK_FORBIDDEN"); }); vi.stubGlobal("fetch", network);
    const old = { ...createFunctionalResetSession(), contentEpoch: undefined, runtimeTurns: [{ role: "USER", content: "OLD_CONTENT_MUST_NOT_REAPPEAR" }] };
    const oldKey = "noxia-protocol-designer-functional-reset-v3"; localStorage.setItem(oldKey, JSON.stringify(old));
    const empty = loadFunctionalResetSession(localStorage);
    expect(empty.runtimeTurns).toEqual([]); expect(empty.project).toBeNull(); expect(empty.documents.projections).toEqual([]); expect(empty.drciDraftPacks).toEqual([]);
    const { session: base, project, decision, evidence } = source();
    const client = offlineArchiveClient(base.sessionId, project);
    const create = async (current: typeof base, index: number) => {
      const loaded = await hydrateDocumentCommandSession(current, client);
      const documents = refreshFunctionalResetDocumentPortfolio({ project, previous: loaded.documents, handoffDecision: decision,
        requestedAt: at(index), generateProtocol: true, knowledgeLibrary: evidence.sourceLibrary });
      const projection = documents.projections.at(-1)!;
      const body = await freezeDocumentGeneration({ native: { family: "TEMPLATE", value: projection },
        artifacts: buildStudyDeliverablePortfolio({ project, protocolProjection: projection, generatedAt: projection.requestedAt }).artifacts,
        sha256: docSha256, renderOrigin: "GENERATION_TIME" });
      const receipt = await client.commit(`new-generation-${index}`, body);
      return { session: publishArchivedTemplate({ ...current, documents }, projection, receipt) as typeof base, body, receipt };
    };
    const g1 = await create(base, 1); persistFunctionalResetSession(localStorage, g1.session);
    const firstBytes = JSON.stringify(g1.body), reopened = loadFunctionalResetSession(localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true) as typeof base;
    expect(reopened.project).toEqual(project); expect(reopened.documents.projections).toEqual([]); expect(reopened.drciDraftPacks).toEqual([]);
    // CURRENT_STRUCTURAL_INVARIANT: durable technical bodies, not user G1/G2.
    expect((await client.history()).entries).toEqual([]);
    const g2 = await create(reopened, 2); persistFunctionalResetSession(localStorage, g2.session);
    const reopenedAgain = loadFunctionalResetSession(localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true);
    expect((await client.history()).entries).toEqual([]);
    expect(JSON.stringify((await client.body(g1.receipt.generation.generationId)).body)).toBe(firstBytes);
    expect((await client.body(reopenedAgain.documentArchive!.currentProjectionId!)).body).toEqual(g2.body);
    expect(JSON.stringify(reopenedAgain)).not.toContain(g1.body.files[0].content);
    expect(localStorage.getItem(oldKey)).toBe(JSON.stringify(old)); // No deployed purge hidden in load.
    expect(network).not.toHaveBeenCalled();
  });
  it("archives 50 large native snapshots and 500 mixed generations without session/context growth", async () => {
    const network = vi.fn(async () => { throw new Error("NETWORK_FORBIDDEN"); }); vi.stubGlobal("fetch", network);
    const { session: base, project, decision, evidence } = source(), canonicalBefore = JSON.stringify(project), contextBefore = contexts(base);
    const snapshots = memoryProjectSnapshotStore(), fixture = archiveSqlFixture(), identity = { sessionId: base.sessionId, clientAddress: "192.0.2.50" };
    const registration = await snapshots.persist(identity, project, null), access = { identity, project: registration.ref, proof: registration.proof };
    const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql);
    let session = base, previous = base.documents, first: { id: string; hash: string; text: string } | undefined;
    const measurements: { generations: number; sessionBytes: number; encodedBytes: number; docBytes: number; bodyBytes: number }[] = [];
    const commit = async (index: number, body: DocumentGenerationBody) => {
      const text = JSON.stringify(body), requestId = `scale-${index}`;
      await archive.admit(access, { requestId, requestSha256: docSha256(text), generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: Buffer.byteLength(text) });
      return archive.commit(access, requestId, body);
    };
    for (let i = 1; i <= 50; i++) {
      const documents = refreshFunctionalResetDocumentPortfolio({ project, previous, handoffDecision: decision, requestedAt: at(i), generateProtocol: true, knowledgeLibrary: evidence.sourceLibrary });
      expect(documents.lastFailure).toBeNull(); const projection = documents.projections.at(-1)!;
      const body = await freezeDocumentGeneration({ native: { family: "TEMPLATE", value: projection },
        artifacts: buildStudyDeliverablePortfolio({ project, protocolProjection: projection, generatedAt: at(i) }).artifacts,
        sha256: docSha256, renderOrigin: "GENERATION_TIME" });
      // Measured native corpus, not artificial padding to meet a size target.
      expect(bytes(body)).toBeGreaterThan(700_000);
      const receipt = await commit(i, body);
      if (i === 1) first = { id: receipt.generation.generationId, hash: receipt.generation.bodySha256, text: JSON.stringify(body) };
      previous = { ...documents, projections: [projection] }; // Only current native command input in RAM.
      session = publishArchivedTemplate({ ...session, documents }, projection, receipt) as typeof base;
      if ([1, 10, 50].includes(i)) measurements.push({ generations: i, sessionBytes: bytes(session), encodedBytes: Buffer.byteLength(encodeSessionStorage(session)),
        docBytes: bytes({ documents: session.documents, packs: session.drciDraftPacks, archive: session.documentArchive }), bodyBytes: bytes(body) });
    }
    const projection = previous.projections.at(-1)!;
    const packet = prepareDrciDraftPack(project, { handoffDecision: decision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
    const value = { documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `Qualification d’archivage ${kind}`,
      sections: [{ title: "Source scientifique adoptée", paragraphs: [packet.sourceFacts[0].content + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification structurelle, sans nouvelle validation scientifique. ".repeat(100) : "")], sourceRefs: [packet.sourceFacts[0].ref] }], missingElements: [] })),
      crfRows: packet.crf.fields.map((field, i) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${i}`, label: field.label, domain: "À préciser", visit: "À préciser", definition: field.label,
        entryType: "Texte", unit: field.unit, categories: null, dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null, derivedFrom: [], derivation: null, controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) };
    for (let i = 51; i <= 500; i++) {
      const pack = materializeDrciDraftPack(value, { project, packet, generatedAt: at(i) });
      const body = await freezeDocumentGeneration({ native: { family: "DRCI", value: pack }, artifacts: drciDraftPackArtifacts(pack, project), sha256: docSha256, renderOrigin: "GENERATION_TIME" });
      const receipt = await commit(i, body);
      session = { ...session, documentArchive: { ...session.documentArchive!, currentGenerationId: receipt.generation.generationId,
        currentGeneration: { generationId: receipt.generation.generationId, project: receipt.generation.project, displayVersion: receipt.generation.displayVersion, generatedAt: receipt.generation.generatedAt } } };
    }
    expect(fixture.rows().filter(row => row.state === "COMMITTED")).toHaveLength(500);
    expect(JSON.stringify(project)).toBe(canonicalBefore); expect(contexts(session)).toBe(contextBefore);
    expect(session.documents.projections).toEqual([]); expect(session.drciDraftPacks).toEqual([]);
    console.info(JSON.stringify({ qualification: "DOC_SESSION_BYTE_ATTRIBUTION", fields: Object.fromEntries(Object.entries(session.documents).map(([key, value]) => [key, bytes(value)])), pointer: bytes(session.documentArchive) }));
    expect(bytes(session) - bytes(base)).toBeLessThan(4096);
    expect(Math.max(...measurements.map(row => row.sessionBytes)) - Math.min(...measurements.map(row => row.sessionBytes))).toBeLessThan(64);
    persistFunctionalResetSession(localStorage, session);
    expect(loadFunctionalResetSession(localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project).toEqual(project);
    const before = fixture.queries.length; const refs = []; let cursor: number | undefined;
    do { const page = await archive.history(access, cursor); expect(page.entries.length).toBeLessThanOrEqual(25); refs.push(...page.entries); cursor = page.nextBeforeOrdinal ?? undefined; } while (cursor);
    expect(refs).toHaveLength(500); expect(new Set(refs.map(ref => ref.generationId)).size).toBe(500);
    expect(fixture.queries.slice(before).join(" ")).not.toContain("doc_generation_body");
    for (const id of [first!.id, refs[0].generationId, refs[249].generationId, refs[400].generationId, refs[498].generationId]) {
      const selected = await archive.body(access, id); expect(docSha256(JSON.stringify(selected.body))).toBe(selected.ref.bodySha256);
      const zip = new TextDecoder().decode(buildStudyFilesZipBytes(selected.body.files, selected.ref.generatedAt));
      for (const file of selected.body.files) { expect(zip).toContain(file.fileName); expect(zip).toContain(file.content); }
    }
    expect(JSON.stringify((await archive.body(access, first!.id)).body)).toBe(first!.text);
    expect((await archive.body(access, first!.id)).ref.bodySha256).toBe(first!.hash);
    const finalBody = (await archive.body(access, refs[0].generationId)).body;
    expect(await commit(500, finalBody)).toEqual(await archive.receipt(access, "scale-500"));
    expect(fixture.rows()).toHaveLength(500); expect(network).not.toHaveBeenCalled();
    console.info(JSON.stringify({ qualification: "DOC_ARCHIVE_SCALE", measurements, mixed: 500, sessionFinalBytes: bytes(session), docOverheadBytes: bytes(session) - bytes(base), historicalBodyBytesInSession: 0 }));
  }, 120_000);
});
