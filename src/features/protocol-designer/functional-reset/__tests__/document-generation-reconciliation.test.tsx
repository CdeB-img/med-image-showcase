import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderDiagnosticWorkspace as render } from "./diagnostic-workspace-test-render";
import { HelmetProvider } from "react-helmet-async";
import { confirmResearchProjectContribution, authorizeResearchProjectDocumentHandoff } from "@/features/research-project-construction";
import { refreshFunctionalResetDocumentPortfolio, buildCanonicalCrfPackage } from "@/features/document-projection";
import { prepareDrciDraftSource, prepareDrciDraftPack, materializeDrciDraftPack, DRCI_DOCUMENT_KINDS } from "@/features/document-projection/drci-draft-pack";
import { publishArchivedGeneration, readCurrentArchivedGeneration } from "@/features/document-projection/generation-session";
import { offlineArchiveClient, offlineArchiveRuntime, offlineDocReceipt, resetOfflineArchiveClients } from "@/features/document-projection/__tests__/offline-archive-client";
import type { ProductBridgeRequest } from "../../product-bridge";
import { ProductBridgeClientError } from "../../product-bridge-client";
import { createFunctionalResetSession, type FunctionalResetSession } from "../session";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { makeFunctionalResetContribution, COLCHICINE_INITIAL, COLCHICINE_MODIFICATION } from "./functional-reset-fixtures";

const bridge = vi.hoisted(() => vi.fn());
const archiveFactory = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
vi.mock("@/features/document-projection/generation-archive-client", async original => ({ ...await original<object>(), createDocumentArchiveClient: archiveFactory }));
afterEach(() => { cleanup(); bridge.mockReset(); archiveFactory.mockReset(); resetOfflineArchiveClients(); localStorage.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

// CURRENT_STRUCTURAL_INVARIANT: client publication / archive reconciliation,
// not clinical quality. Native scientific fixtures and validators remain real;
// only the network/SQL transport is offline. No hardcoded archive success.
const packFor = (project: NonNullable<FunctionalResetSession["project"]>, authority: FunctionalResetSession["projectAuthority"], at: string,
  supplied?: NonNullable<ProductBridgeRequest["documentDraftRequest"]>) => {
  const decision = authorizeResearchProjectDocumentHandoff({ project, authority, confirmedAt: at });
  const projection = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision: decision, requestedAt: at, generateProtocol: true }).projections.at(-1)!;
  const source = supplied ?? prepareDrciDraftSource({ handoffDecision: decision, protocolProjection: projection, crf: buildCanonicalCrfPackage(project) });
  const packet = prepareDrciDraftPack(project, source);
  return materializeDrciDraftPack({ documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `Qualification ${kind}`,
    sections: [{ title: "Source adoptée", paragraphs: [packet.sourceFacts[0].content
      + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification déterministe de la persistance documentaire, sans validation clinique ni réglementaire. ".repeat(60) : "")],
      sourceRefs: [packet.sourceFacts[0].ref] }], missingElements: ["Paramètres détaillés à préciser"] })),
    crfRows: source.crf.fields.map((field, index) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${index}`,
      label: field.label, domain: "À préciser", visit: "À préciser", definition: field.label, entryType: "Texte", unit: field.unit,
      categories: null, dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null,
      derivedFrom: [], derivation: null, controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) },
  { project, packet, generatedAt: source.handoffDecision.timestamp! });
};
const setup = async () => {
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA");
  vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  archiveFactory.mockImplementation(offlineArchiveClient);
  const initial = createFunctionalResetSession(), at = initial.updatedAt;
  const first = { turnId: "u1", role: "USER" as const, content: COLCHICINE_INITIAL, createdAt: at };
  const second = { turnId: "u2", role: "USER" as const, content: COLCHICINE_MODIFICATION, createdAt: at };
  const project1 = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([first]), current: null,
    projectId: initial.projectId, authority: initial.projectAuthority, confirmedAt: at });
  const project2 = confirmResearchProjectContribution({ contribution: makeFunctionalResetContribution([first, second]), current: project1,
    projectId: initial.projectId, authority: initial.projectAuthority, confirmedAt: at });
  const g1 = await offlineDocReceipt(initial.sessionId, project1, `drci-draft:${project1.projectDigest}:g1`, packFor(project1, initial.projectAuthority, at));
  const session: FunctionalResetSession = { ...publishArchivedGeneration({ ...initial, project: project1 }, g1.generation),
    project: project2, runtimeTurns: [first, second] };
  const client = offlineArchiveClient(session.sessionId, project2);
  const frozenG1 = JSON.stringify((await client.body(g1.generation.generationId)).body);
  return { session, project1, project2, g1, client, frozenG1 };
};

describe("durable DOC commit is authoritative over client generation state", () => {
  it.each(["NORMAL", "POST_COMMIT_EXCEPTION", "POST_COMMIT_LEDGER_FAILURE", "POST_COMMIT_BAD_RECEIPT"] as const)(
    "publishes durable G2 after %s, without guessed G1 or a second dispatch", async failure => {
      const run = await setup(); let saved = run.session;
      let release!: () => void;
      const pending = new Promise<void>(resolve => { release = resolve; });
      bridge.mockImplementation(async (request: ProductBridgeRequest) => {
        await pending;
        const pack = packFor(run.project2, run.session.projectAuthority, run.session.updatedAt, request.documentDraftRequest!);
        const receipt = await offlineDocReceipt(run.session.sessionId, run.project2, request.observabilityContext!.clientRequestId, pack);
        if (failure === "POST_COMMIT_EXCEPTION") throw new Error("OFFLINE_CLIENT_POST_COMMIT_EXCEPTION");
        if (failure === "POST_COMMIT_LEDGER_FAILURE") throw new ProductBridgeClientError("DOC_ARCHIVE_LEDGER_FINALIZATION_FAILED", "OFFLINE", null);
        return { documentDraftPack: pack, documentPersistenceReceipt: failure === "POST_COMMIT_BAD_RECEIPT"
          ? { ...receipt, requestId: "OFFLINE_UNCORRELATED_RESPONSE" } : receipt, observability: { providerCalls: [] } };
      });
      render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => {
        saved = next; return { scientificPersisted: true, navigationPointer: "NOT_APPLICABLE" };
      }} /></HelmetProvider>);
      fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
      await within(screen.getByTestId("durable-document-history")).findByText("G1 — basée sur le projet V1");
      const observed: string[] = [];
      const observer = new MutationObserver(() => {
        const progress = screen.queryByTestId("document-generation-progress"); if (progress) observed.push(progress.textContent!);
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
      try {
        fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
        await waitFor(() => expect(bridge).toHaveBeenCalledOnce());
        expect(screen.getByTestId("document-generation-progress")).toHaveTextContent("Génération des documents en cours");
        expect(screen.getByTestId("document-generation-progress")).not.toHaveTextContent(/Génération G\d/);
        await act(async () => { release(); });
        await within(screen.getByTestId("durable-document-history")).findByText("G2 — basée sur le projet V2");
        expect(screen.getByTestId("document-generation-progress")).toHaveTextContent("Génération G2 disponible");
        expect(screen.getByTestId("adopted-project-document-generation")).toHaveTextContent("Documents à jour.");
        expect(screen.queryByTestId("document-generation-recovery")).toBeNull();
        expect(saved.documents.lastFailure).toBeNull();
        const archived = await readCurrentArchivedGeneration(saved, run.client);
        expect(saved.documentArchive?.currentGenerationId).toBe(archived!.generationId);
        expect(saved.documentArchive?.currentGeneration?.displayVersion).toBe(archived!.displayVersion);
        expect(saved.project).toEqual(run.project2);
        expect(saved.drciDraftPacks).toEqual([]);
        expect(observed.every(text => !/Génération G1 (?:en cours|disponible)/.test(text))).toBe(true);
        expect(bridge).toHaveBeenCalledOnce();
        expect((await run.client.history()).entries.map(ref => ref.displayVersion)).toEqual([2, 1]);
        expect(JSON.stringify((await run.client.body(run.g1.generation.generationId)).body)).toBe(run.frozenG1);
      } finally { observer.disconnect(); }
    });

  it("recovers an already committed G2 from a stale G1 pointer without any generation dispatch", async () => {
    const run = await setup(); let saved = run.session;
    const g2 = await offlineDocReceipt(saved.sessionId, run.project2, `drci-draft:${run.project2.projectDigest}:other-tab`,
      packFor(run.project2, saved.projectAuthority, saved.updatedAt));
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => {
      saved = next; return { scientificPersisted: true, navigationPointer: "NOT_APPLICABLE" };
    }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
    await waitFor(() => expect(screen.getByTestId("adopted-project-document-generation")).toHaveTextContent("Documents à jour."));
    expect(saved.documentArchive?.currentGenerationId).toBe(g2.generation.generationId);
    expect(screen.queryByTestId("document-generation-recovery")).toBeNull();
    expect(bridge).not.toHaveBeenCalled();
    expect((await run.client.history()).entries.map(ref => ref.displayVersion)).toEqual([2, 1]);
  });

  it("does not convert a proven commit into failure when metadata refresh and local pointer saving fail", async () => {
    const run = await setup(); let saved = run.session, committed = false;
    archiveFactory.mockImplementation((sessionId, project) => {
      const client = offlineArchiveClient(sessionId, project);
      return { ...client, history: async (cursor?: number) => {
        if (committed) throw new TypeError("OFFLINE_HISTORY_TEMPORARILY_UNAVAILABLE");
        return client.history(cursor);
      } };
    });
    bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      const pack = packFor(run.project2, run.session.projectAuthority, run.session.updatedAt, request.documentDraftRequest!);
      const receipt = await offlineDocReceipt(run.session.sessionId, run.project2, request.observabilityContext!.clientRequestId, pack);
      committed = true;
      return { documentDraftPack: pack, documentPersistenceReceipt: receipt, observability: { providerCalls: [] } };
    });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => {
      saved = next;
      if (next.documentArchive?.currentGeneration?.displayVersion === 2) throw new Error("OFFLINE_LOCAL_POINTER_FAILURE");
      return { scientificPersisted: true, navigationPointer: "NOT_APPLICABLE" };
    }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
    await waitFor(() => expect(screen.getByTestId("adopted-project-document-generation")).toHaveTextContent("Documents à jour."));
    expect(screen.getByTestId("document-generation-progress")).toHaveTextContent("Génération G2 disponible");
    expect(screen.queryByTestId("document-generation-recovery")).toBeNull();
    expect(saved.documents.lastFailure).toBeNull();
    expect(saved.documentArchive?.currentGeneration?.displayVersion).toBe(2);
    expect((await run.client.history()).entries).toHaveLength(2);
    expect(bridge).toHaveBeenCalledOnce();
  });

  it("preserves G1 and permits an explicit retry only when no G2 committed", async () => {
    const run = await setup(); let saved = run.session;
    bridge.mockRejectedValueOnce(new Error("OFFLINE_KNOWN_GENERATION_FAILURE"));
    bridge.mockImplementation(async (request: ProductBridgeRequest) => {
      const pack = packFor(run.project2, run.session.projectAuthority, run.session.updatedAt, request.documentDraftRequest!);
      return { documentDraftPack: pack, observability: { providerCalls: [] },
        documentPersistenceReceipt: await offlineDocReceipt(run.session.sessionId, run.project2, request.observabilityContext!.clientRequestId, pack) };
    });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={next => {
      saved = next; return { scientificPersisted: true, navigationPointer: "NOT_APPLICABLE" };
    }} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
    await screen.findByTestId("document-generation-recovery");
    expect(saved.documentArchive?.currentGenerationId).toBe(run.g1.generation.generationId);
    expect(await readCurrentArchivedGeneration(saved, run.client)).toBeNull();
    const button = screen.getByRole("button", { name: "Générer les documents" });
    expect(button).toBeEnabled();
    for (let index = 0; index < 10; index++) fireEvent.click(button);
    await within(screen.getByTestId("durable-document-history")).findByText("G2 — basée sur le projet V2");
    expect(bridge).toHaveBeenCalledTimes(2);
    expect(saved.documents.lastFailure).toBeNull();
    expect(button).toBeDisabled();
    const { fixture } = await offlineArchiveRuntime(saved.sessionId, run.project2);
    expect(fixture.bodies().filter(body => String(body.native_body_text).includes('"family":"DRCI"'))).toHaveLength(2);
  });
});
