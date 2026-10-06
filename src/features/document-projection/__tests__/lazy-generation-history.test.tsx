import { fireEvent, render, screen, waitFor, within, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentArchiveHistory from "../../protocol-designer/functional-reset/DocumentArchiveHistory";
import { portableDrciFixture } from "./portable-drci-fixture";
import { freezeDocumentGeneration } from "../generation-exports";
import { drciDraftPackArtifacts } from "../drci-draft-pack";
import { docSha256 } from "../../../../server/protocol-designer-document-archive";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { documentFileManifest, documentNativeIdentity, DOC_ARCHIVE_CONTRACT, type DocumentGenerationRef } from "../generation-persistence";
import type { DocumentArchiveClient } from "../generation-archive-client";
import { downloadStudyDeliverableFile, downloadFrozenStudyFiles } from "../study-deliverable-portfolio";

vi.mock("../study-deliverable-portfolio", async original => ({ ...await original<object>(), downloadStudyDeliverableFile: vi.fn(), downloadFrozenStudyFiles: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
// CURRENT_STRUCTURAL_INVARIANT: lazy retrieval/lifecycle over the existing
// scientifically meaningful ECV pack; no new scientific assertion/approval.
const setup = async () => {
  const { ancestor, project } = portableDrciFixture();
  const entries: DocumentGenerationRef[] = [];
  const bodies = new Map<string, Awaited<ReturnType<typeof freezeDocumentGeneration>>>();
  for (let ordinal = 1; ordinal <= 30; ordinal++) {
    const { packDigest: _old, ...base } = ancestor;
    const material = { ...base, generatedAt: new Date(Date.UTC(2026, 9, 5, 10, 0, ordinal)).toISOString() };
    const pack = { ...material, packDigest: logicalDigest(material) };
    const native = { family: "DRCI" as const, value: pack };
    const body = await freezeDocumentGeneration({ native, artifacts: drciDraftPackArtifacts(pack, project), sha256: docSha256, renderOrigin: "GENERATION_TIME" });
    const generationId = documentNativeIdentity(native);
    bodies.set(generationId, body);
    entries.unshift({ contract: DOC_ARCHIVE_CONTRACT, generationId, family: "DRCI", project: pack.project, ordinal, displayVersion: ordinal + 100,
      generatedAt: pack.generatedAt, predecessorId: null, bodySha256: docSha256(JSON.stringify(body)), bodyBytes: Buffer.byteLength(JSON.stringify(body)),
      files: body.files.map(documentFileManifest), persistenceState: "COMMITTED" });
  }
  const client: DocumentArchiveClient = { history: vi.fn(async cursor => ({ entries: entries.filter(ref => ref.ordinal < (cursor ?? 31)).slice(0, 25), nextBeforeOrdinal: cursor ? null : 6 })),
    body: vi.fn(async id => ({ ref: entries.find(ref => ref.generationId === id)!, body: bodies.get(id)! })),
    commit: vi.fn(), receipt: vi.fn() };
  return { client, entries, bodies };
};
describe("DOC metadata-only history and one selected immutable body", () => {
  it("loads 25 metadata entries, then only G7; download reuses the one verified RAM body", async () => {
    const { client, entries, bodies } = await setup(); const onOpen = vi.fn();
    render(<DocumentArchiveHistory client={client} onOpen={onOpen} />);
    expect(screen.getByRole("status")).toHaveTextContent("chargement");
    await waitFor(() => expect(screen.getAllByTestId(/archived-generation-/)).toHaveLength(25));
    expect(client.body).not.toHaveBeenCalled();
    const ref = entries.find(ref => ref.ordinal === 7)!;
    const row = within(screen.getByTestId("archived-generation-7"));
    expect(row.getByText(/G107 — basée sur le projet V1/)).toBeTruthy();
    const manifest = ref.files[0];
    fireEvent.click(row.getByRole("button", { name: `Ouvrir ${manifest.fileName}` }));
    await waitFor(() => expect(onOpen).toHaveBeenCalledOnce());
    expect(client.body).toHaveBeenCalledExactlyOnceWith(ref.generationId);
    expect(onOpen.mock.calls[0][0]).toEqual(bodies.get(ref.generationId)!.files[0]);
    fireEvent.click(row.getByRole("button", { name: `Télécharger G107 ${manifest.fileName}` }));
    await waitFor(() => expect(downloadStudyDeliverableFile).toHaveBeenCalledOnce());
    expect(downloadStudyDeliverableFile).toHaveBeenCalledWith(bodies.get(ref.generationId)!.files[0]);
    fireEvent.click(row.getByRole("button", { name: "Exporter la génération (.zip)" }));
    await waitFor(() => expect(downloadFrozenStudyFiles).toHaveBeenCalledExactlyOnceWith(bodies.get(ref.generationId)!.files, ref.generatedAt, 107));
    expect(client.body).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Versions précédentes" }));
    await waitFor(() => expect(screen.getAllByTestId(/archived-generation-/)).toHaveLength(30));
    expect(client.history).toHaveBeenLastCalledWith(6);
  });
  it("does not publish a delayed selected body after unmount", async () => {
    const { client } = await setup(); const onOpen = vi.fn(); let release!: () => void;
    const original = client.body;
    vi.mocked(client.body).mockImplementation(async id => { await new Promise<void>(resolve => { release = resolve; }); return original(id); });
    const rendered = render(<DocumentArchiveHistory client={client} onOpen={onOpen} />);
    await waitFor(() => expect(screen.getByTestId("archived-generation-7")).toBeTruthy());
    fireEvent.click(within(screen.getByTestId("archived-generation-7")).getAllByRole("button")[0]);
    rendered.unmount(); release();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onOpen).not.toHaveBeenCalled();
  });
  it("never represents failed/unloaded metadata as an empty archive", async () => {
    const { client } = await setup(); vi.mocked(client.history).mockRejectedValue(new Error("OFFLINE_UNAVAILABLE"));
    render(<DocumentArchiveHistory client={client} onOpen={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("non chargé"));
    expect(screen.queryByText("Aucune génération documentaire archivée.")).toBeNull();
    expect(client.body).not.toHaveBeenCalled();
  });
});
