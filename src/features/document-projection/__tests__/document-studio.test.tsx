import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import DocumentStudio from "../DocumentStudio";
import StudyDeliverableWorkspace from "../../protocol-designer/functional-reset/StudyDeliverableWorkspace";
import { createDocumentArchiveClient } from "../generation-archive-client";
import { buildStudyDeliverablePortfolio } from "../study-deliverable-portfolio";
import { workingRevisionFixture } from "./working-revision-fixture";
import * as bridge from "../../protocol-designer/product-bridge-client";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";
import type { DocumentWorkingRevisionResult } from "../working-revision";
import { hasProtectedTextBinding, studioBoundText } from "../studio-document";
import type { StudioFinalizationRuntime } from "../../protocol-designer/functional-reset/studio-finalization-runtime";
import { createFunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { freezeStudioFinalizationWork } from "../../protocol-designer/functional-reset/studio-finalization-lifecycle";
import { acceptStudioAssessment } from "../../scientific-thinking/studio-runtime";
import { prepareDrciDraftSource } from "../drci-draft-contract";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
/** SYNTHETIC_CURRENT_CONTRACT: actual PRJ/DOC owners and scientific native
 * fixture. Only PostgreSQL/HTTP are offline doubles; never a provider request. */
const runtime = async () => {
  const run = await workingRevisionFixture();
  vi.spyOn(bridge, "ensureServerProjectSnapshot").mockResolvedValue({ ref: run.access2.project, proof: run.access2.proof! });
  const transport = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const command = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(String(command.operation)).toMatch(/^DOC_ARCHIVE_/u);
    const result = await executeDocumentArchiveOperation({ body: command,
      proof: (init?.headers as Record<string, string>)["x-noxia-project-snapshot-proof"], clientAddress: run.identity.clientAddress,
      connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots });
    return new Response(JSON.stringify(result.body), { status: result.status });
  });
  vi.stubGlobal("fetch", transport);
  const client = createDocumentArchiveClient(run.sessionId, run.project2);
  const target = { generation: run.g2.ref, nativeDocumentRef: "PROTOCOL_FULL" };
  const close = vi.fn();
  const open = (finalization?: StudioFinalizationRuntime) => render(<DocumentStudio client={client} target={target} finalization={finalization} onClose={close} />);
  const ready = () => screen.findByRole("textbox", { name: "Section 1 · paragraphe 1" });
  const revision = () => run.fixture.revisions().at(-1)!.revision as DocumentWorkingRevisionResult["revision"];
  return { ...run, client, target, transport, close, open, ready, revision };
};
const save = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  await waitFor(() => expect(screen.getByTestId("studio-save-status")).toHaveTextContent(/^Enregistré$/u));
};
const compareScope = () => within(screen.getByRole("region", { name: "Comparaison du brouillon avec sa base" }));

describe("Document Studio V1 / native archive vertical slice", () => {
  it("P/V: reload after archive commit and lost intent acknowledgement resolves consumed historical save, not a new draft", async () => {
    const run = await runtime(), source = await run.client.body(run.g2.ref.generationId);
    let { revision } = await run.client.workingRevisions!.open({ baseGenerationId: run.g2.ref.generationId,
      baseGenerationBodyDigest: run.g2.ref.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" });
    revision = (await run.client.workingRevisions!.save({ revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence,
      content: { ...revision.content, title: revision.content.title + " — rédaction confirmée" } })).revision;
    const session = { ...createFunctionalResetSession("2026-10-08T18:00:00.000Z"), sessionId: run.sessionId,
      projectId: run.project2.projectId, project: run.project2 };
    const frozen = await freezeStudioFinalizationWork({ session, revision, source,
      projectionSource: await run.client.body(run.g2.projection.projectionId) });
    const owner = run.archive.finalizationIntents!; let intent = await owner.create(run.access2, frozen);
    const request = frozen.scientificSources.request;
    intent = await owner.assess(run.access2, intent.finalizationIntentId, intent.sequence, acceptStudioAssessment(request, run.project2, {
      requestDigest: request.requestDigest, scientificStateDisposition: "NO_NET_CHANGE", scientificStateReason: "Controlled fixture",
      scientificStateAmbiguity: null, edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({
        editRef: edit.editRef, classification: "DOCUMENT_ONLY", reason: "Controlled fixture", provenanceRefs: [edit.editRef],
        projectCoverage: null, ambiguity: null })) }, session.updatedAt));
    intent = await owner.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence, prepareDrciDraftSource({
      handoffDecision: run.g2.projection.humanDecisions.find(decision => decision.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION")!,
      protocolProjection: run.g2.projection, crf: buildCanonicalCrfPackage(run.project2) }));
    run.fixture.failIntentSave(true);
    await expect(owner.finalizeDocuments(run.access2, intent.finalizationIntentId)).rejects.toThrow();
    expect(run.revision().status).toBe("ABANDONED"); run.fixture.failIntentSave(false);
    const saveCount = run.fixture.revisions().length;
    const execute = vi.fn<StudioFinalizationRuntime["run"]>(async (saved, _stage, resumeOnly) => {
      expect(resumeOnly).toBe(true); expect(saved).toEqual(revision);
      return owner.finalizeDocuments(run.access2, intent.finalizationIntentId);
    });
    run.open({ run: execute }); await screen.findByText("✓ Version 3 créée");
    expect(execute).toHaveBeenCalledOnce();
    expect(run.fixture.revisions()).toHaveLength(saveCount);
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([3, 2, 1]);
  });
  it("next version D/M/R: UI dirty save → real native archive V3 → positive commit feedback, no G4 on repeated click", async () => {
    const run = await runtime();
    const now = "2026-10-08T18:00:00.000Z", fresh = createFunctionalResetSession(now);
    const session = { ...fresh, sessionId: run.sessionId, projectId: run.project2.projectId, project: run.project2 };
    const execute: StudioFinalizationRuntime["run"] = async (revision, stage, resumeOnly) => {
      if (resumeOnly) return null;
      stage("ASSESSMENT");
      const frozen = await freezeStudioFinalizationWork({ session, revision, source: { ref: run.g2.ref, body: run.g2.body },
        projectionSource: await run.archive.body(run.access2, run.g2.projection.projectionId) });
      const owner = run.archive.finalizationIntents!; let intent = await owner.create(run.access2, frozen);
      const request = frozen.scientificSources.request;
      const result = acceptStudioAssessment(request, run.project2, { requestDigest: request.requestDigest, scientificStateDisposition: "NO_NET_CHANGE",
        scientificStateReason: "Controlled fixture, not clinical qualification", scientificStateAmbiguity: null,
        edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef, classification: "DOCUMENT_ONLY",
          reason: "Controlled editorial fixture", provenanceRefs: [edit.editRef], projectCoverage: null, ambiguity: null })) }, now);
      intent = await owner.assess(run.access2, intent.finalizationIntentId, intent.sequence, result); stage("DOCUMENTS");
      intent = await owner.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence, prepareDrciDraftSource({
        handoffDecision: run.g2.projection.humanDecisions.find(decision => decision.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION")!,
        protocolProjection: run.g2.projection, crf: buildCanonicalCrfPackage(run.project2) }));
      stage("ARCHIVE"); return owner.finalizeDocuments(run.access2, intent.finalizationIntentId);
    };
    run.open({ run: execute }); await run.ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "Titre du document" }), { target: { value: "Nouvelle rédaction native" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    await screen.findByText("✓ Version 3 créée");
    expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeDisabled();
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([3, 2, 1]);
    expect(run.revision().status).toBe("ABANDONED"); expect(run.revision().provenance.lastAction).toBe("FINALIZE");
  });
  it("next version A: dirty buffer saves durably before finalization, exact save is passed", async () => {
    const run = await runtime();
    const execute = vi.fn(async (revision: DocumentWorkingRevisionResult["revision"], _stage: unknown, resume?: boolean) => {
      if (!resume) { expect(run.revision()).toEqual(revision); expect(revision.content.title).toBe("Titre édité et confirmé"); }
      return null;
    });
    run.open({ run: execute }); await run.ready();
    fireEvent.change(screen.getByRole("textbox", { name: "Titre du document" }), { target: { value: "Titre édité et confirmé" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    await waitFor(() => expect(execute.mock.calls.some(call => call[2] !== true)).toBe(true));
    expect(run.revision().saveSequence).toBe(2);
    expect(screen.getByText("✓ Enregistré")).toBeInTheDocument();
    expect(run.fixture.rows().filter(row => row.state === "COMMITTED" && (row.metadata as { family: string }).family === "DRCI")).toHaveLength(2);
  });
  it("next version B: save failure stops finalization and retains exact local work", async () => {
    const run = await runtime(), execute = vi.fn(async () => null);
    run.open({ run: execute }); const field = await run.ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
    execute.mockClear();
    fireEvent.change(field, { target: { value: "Texte encore local à préserver" } }); run.fixture.failRevisionSave(true);
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    await waitFor(() => expect(screen.getByTestId("studio-save-status")).toHaveTextContent("Échec de l’enregistrement"));
    expect(field).toHaveValue("Texte encore local à préserver"); expect(execute).not.toHaveBeenCalled();
    expect(run.fixture.intents()).toHaveLength(0);
  });
  it("next version B: concurrent save conflict stops before freezing stale content", async () => {
    const run = await runtime(), execute = vi.fn(async () => null);
    run.open({ run: execute }); const field = await run.ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled()); execute.mockClear();
    const other = structuredClone(run.revision().content); other.title = "Autre onglet";
    await run.owner.save(run.access2, { revisionId: run.revision().revisionId, expectedSaveSequence: run.revision().saveSequence, content: other });
    fireEvent.change(field, { target: { value: "Texte de cet onglet" } });
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    await waitFor(() => expect(screen.getByTestId("studio-save-status")).toHaveTextContent("Conflit de sauvegarde"));
    expect(execute).not.toHaveBeenCalled(); expect(field).toHaveValue("Texte de cet onglet"); expect(run.revision().content.title).toBe("Autre onglet");
  });
  it("next version V: remount asks native runtime to resume only, never creates an intent on open", async () => {
    const run = await runtime(), execute = vi.fn<StudioFinalizationRuntime["run"]>(async () => null), view = run.open({ run: execute }); await run.ready();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    expect(execute.mock.calls[0][2]).toBe(true);
    view.unmount(); run.open({ run: execute }); await run.ready();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(execute.mock.calls[1][2]).toBe(true); expect(run.fixture.intents()).toHaveLength(0);
  });
  it("A: opens G2 through the existing lazy archive entry and creates a native draft, not a generation", async () => {
    const run = await runtime(), bodies = run.fixture.bodies(), rows = run.fixture.rows();
    const portfolio = buildStudyDeliverablePortfolio({ project: run.project2, protocolProjection: run.g2.projection, generatedAt: run.project2.adoptedAt });
    render(<StudyDeliverableWorkspace portfolio={portfolio} archiveClient={run.client} archiveOnly currentGenerationId={run.g2.ref.generationId} onClose={run.close} />);
    const item = await screen.findByTestId(`archived-generation-${run.g2.ref.ordinal}`);
    expect(run.fixture.revisions()).toHaveLength(0);
    expect(run.transport.mock.calls.some(([, init]) => JSON.parse(String(init?.body)).operation === "DOC_ARCHIVE_BODY")).toBe(false);
    fireEvent.click(within(item).getByRole("button", { name: "Choisir un document pour Studio" }));
    fireEvent.click(await within(item).findByRole("button", { name: /Ouvrir dans Studio Version 2 · .*PROTOCOL_FULL/u }));
    await run.ready();
    expect(screen.getByText("Basé sur la Version 2")).toBeInTheDocument();
    expect(run.revision().baseGenerationId).toBe(run.g2.ref.generationId);
    expect(run.revision().content.sections[0].blocks[0].text).toContain("colchicine");
    expect(run.fixture.rows()).toEqual(rows); expect(run.fixture.bodies()).toEqual(bodies);
    expect(screen.queryByRole("button", { name: /Publier|Appliquer au projet|Générer/u })).not.toBeInTheDocument();
  });
  it("B: resumes the exact existing ACTIVE draft without creating a duplicate", async () => {
    const run = await runtime(), initial = await run.owner.create(run.access2, run.createInput);
    run.open(); await run.ready();
    expect(run.revision().revisionId).toBe(initial.revision.revisionId);
    expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("C: edits native prose, explicitly saves and stays UNASSESSED without changing Project/archive", async () => {
    const run = await runtime(), project = structuredClone(run.project2), rows = run.fixture.rows(), bodies = run.fixture.bodies();
    run.open();
    const field = await run.ready(), text = "L’étude devient multicentrique. Modification humaine non évaluée.";
    fireEvent.change(field, { target: { value: text } });
    expect(screen.getByTestId("studio-save-status")).toHaveTextContent("Modifications non enregistrées");
    expect(run.fixture.revisions()).toHaveLength(1); // no autosave
    await save();
    expect(run.revision().content.sections[0].blocks[0].text).toBe(text);
    expect(run.revision().provenance.semanticImpact).toBe("UNASSESSED");
    expect(run.revision().saveSequence).toBe(2);
    expect(run.project2).toEqual(project); expect(run.fixture.rows()).toEqual(rows); expect(run.fixture.bodies()).toEqual(bodies);
  });
  it("D: unchanged explicit save remains CLEAN and produces no durable save version", async () => {
    const run = await runtime(); run.open(); await run.ready();
    await save();
    expect(run.revision().saveSequence).toBe(1); expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("E: hard-reload equivalent remount resumes the exact last confirmed saved state", async () => {
    const run = await runtime(), view = run.open();
    const field = await run.ready();
    fireEvent.change(field, { target: { value: "Dernier texte sauvegardé : comparaison colchicine/placebo après infarctus." } });
    await save(); const before = run.revision();
    view.unmount(); run.open();
    expect(await run.ready()).toHaveValue(before.content.sections[0].blocks[0].text);
    expect(run.revision()).toEqual(before); expect(run.fixture.revisions()).toHaveLength(2);
  });
  it("F: failed save retains local buffer, never claims it saved and preserves prior durable state", async () => {
    const run = await runtime(); run.open(); const field = await run.ready(), before = run.revision();
    fireEvent.change(field, { target: { value: "Texte local non confirmé" } });
    run.fixture.failRevisionSave(true);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await screen.findByText("La sauvegarde n’a pas pu être confirmée. Vos modifications locales sont conservées.");
    expect(field).toHaveValue("Texte local non confirmé");
    expect(screen.getByTestId("studio-save-status")).toHaveTextContent("Échec de l’enregistrement");
    expect(run.revision()).toEqual(before);
  });
  it("G: stale save shows conflict, preserves local buffer and does not overwrite the other tab", async () => {
    const run = await runtime(); run.open(); const field = await run.ready(), initial = run.revision();
    const other = structuredClone(initial.content); other.sections[0].blocks[0].text = "Texte confirmé par l’autre onglet";
    await run.owner.save(run.access2, { revisionId: initial.revisionId, expectedSaveSequence: 1, content: other });
    fireEvent.change(field, { target: { value: "Texte local concurrent" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(screen.getByTestId("studio-save-status")).toHaveTextContent("Conflit de sauvegarde"));
    expect(field).toHaveValue("Texte local concurrent");
    expect(run.revision().content).toEqual(other);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Recharger la version enregistrée" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le rechargement" }));
    await waitFor(() => expect(field).toHaveValue(other.sections[0].blocks[0].text));
    expect(screen.getByTestId("studio-save-status")).toHaveTextContent(/^Enregistré$/u);
  });
  it("H: compares native immutable base and current text by blocks, including modification/removal", async () => {
    const run = await runtime(); run.open(); const field = await run.ready(), original = run.revision().content.sections[0].blocks[0].text;
    fireEvent.change(field, { target: { value: "Texte modifié dans le brouillon" } });
    fireEvent.click(screen.getByRole("button", { name: "Comparer à la base" }));
    expect(compareScope().getByText(original)).toBeInTheDocument();
    expect(compareScope().getByText("Texte modifié dans le brouillon")).toBeInTheDocument();
    expect(compareScope().getByText("Section 1 · paragraphe 1 · Modifié")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revenir à l’édition" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Section 1 · paragraphe 1" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Comparer à la base" }));
    expect(compareScope().getByText("Section 1 · paragraphe 1 · Retiré")).toBeInTheDocument();
    expect((await run.archive.body(run.access2, run.g2.ref.generationId)).body).toEqual(run.g2.body);
  });
  it("I: deliberate abandonment returns to history, retains audit, and reopening creates a new ACTIVE draft", async () => {
    const run = await runtime(), view = run.open(); await run.ready();
    const before = run.fixture.bodies(), id = run.revision().revisionId;
    fireEvent.click(screen.getByRole("button", { name: "Abandonner le brouillon" }));
    expect(run.close).not.toHaveBeenCalled(); expect(run.revision().status).toBe("ACTIVE");
    fireEvent.click(screen.getByRole("button", { name: "Confirmer l’abandon" }));
    await waitFor(() => expect(run.close).toHaveBeenCalledTimes(1));
    expect(run.revision().status).toBe("ABANDONED");
    view.unmount(); run.open(); await run.ready();
    expect(run.revision().status).toBe("ACTIVE"); expect(run.revision().revisionId).not.toBe(id);
    expect(run.fixture.revisions().map(row => row.status)).toEqual(["ACTIVE", "ABANDONED", "ACTIVE"]);
    expect(run.fixture.bodies()).toEqual(before);
  });
  it("J: later Project/G3 marks the draft stale without silently rebasing it", async () => {
    const run = await runtime(), initial = await run.owner.open(run.access2, run.createInput);
    const access3 = await run.register(run.project3, run.access2.proof); await run.generation(run.project3, access3);
    run.open(); await run.ready();
    expect(screen.getByText(/Ce brouillon est basé sur une génération ou un état du projet antérieur/u)).toBeInTheDocument();
    expect(run.revision()).toEqual(initial.revision);
    expect(run.revision().baseGenerationId).toBe(run.g2.ref.generationId);
  });
  it("K: historical G1 and current G2 open independently against the same logical document", async () => {
    const run = await runtime(), view = run.open(); await run.ready();
    const current = run.revision(); view.unmount();
    render(<DocumentStudio client={run.client} target={{ generation: run.g1.ref, nativeDocumentRef: "PROTOCOL_FULL" }} onClose={run.close} />);
    await run.ready(); const old = run.revision();
    expect(old.revisionId).not.toBe(current.revisionId);
    expect(old.logicalDocumentRef).toBe(current.logicalDocumentRef);
    expect(old.baseGenerationId).toBe(run.g1.ref.generationId);
    expect(current.baseGenerationId).toBe(run.g2.ref.generationId);
    expect(screen.getByText("Basé sur la Version 1")).toBeInTheDocument();
  });
  it("L: the existing RECRUITMENT native document uses the same Studio routing, without filenames", async () => {
    const run = await runtime();
    render(<DocumentStudio client={run.client} target={{ ...run.target, nativeDocumentRef: "RECRUITMENT" }} onClose={run.close} />);
    await run.ready();
    expect(run.revision().identitySource.nativeDocumentRef).toBe("RECRUITMENT");
    expect(screen.getByRole("textbox", { name: "Titre du document" })).toHaveValue("Document de qualification RECRUITMENT");
    expect(run.revision().content.sections[0].blocks[0].text).toContain("colchicine");
    expect(run.g2.ref.files).toEqual([]); // no filename/artifact is even available
  });
  it("warns before unsaved unload and requires confirmation before leaving; clean saves remove the warning", async () => {
    const run = await runtime(); run.open(); const field = await run.ready();
    fireEvent.change(field, { target: { value: "Modification locale" } });
    const event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); expect(event.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Retour aux documents" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument(); expect(run.close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    await save();
    const clean = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(clean); expect(clean.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Retour aux documents" })); expect(run.close).toHaveBeenCalledTimes(1);
  });
  it("protects native FACT/CITE-bearing text rather than stripping or freely editing its bindings", () => {
    expect(hasProtectedTextBinding("Résultat [[FACT:ref]] [[CITE:source]]")).toBe(true);
    expect(hasProtectedTextBinding("Texte simple")).toBe(false);
  });
  it("keeps newly typed markers editable so invalid binding edits can be corrected after native rejection", async () => {
    const run = await runtime(); run.open(); const field = await run.ready();
    fireEvent.change(field, { target: { value: "Comparaison colchicine/placebo [[FACT:invented]]" } });
    expect(screen.getByRole("textbox", { name: "Section 1 · paragraphe 1" })).toHaveValue("Comparaison colchicine/placebo [[FACT:invented]]");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(screen.getByTestId("studio-save-status")).toHaveTextContent("Échec de l’enregistrement"));
    expect(run.fixture.revisions()).toHaveLength(1);
    fireEvent.change(screen.getByRole("textbox", { name: "Section 1 · paragraphe 1" }), { target: { value: "Comparaison colchicine/placebo après infarctus." } });
    await save();
    expect(run.revision().content.sections[0].blocks[0].text).toBe("Comparaison colchicine/placebo après infarctus.");
  });
  it("fails closed on an unverifiable source without creating a draft", async () => {
    const run = await runtime(); run.fixture.corruptBody(run.g2.ref.generationId); run.open();
    await screen.findByText(/Le document ou son brouillon n’a pas pu être vérifié/u);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument(); expect(run.fixture.revisions()).toHaveLength(0);
  });
  it("single-flights saves and does not apply a delayed save after unmount", async () => {
    const run = await runtime(); const view = run.open(); const field = await run.ready();
    const actual = run.client.workingRevisions!.save;
    let resolve!: (result: DocumentWorkingRevisionResult) => void;
    const pending = new Promise<DocumentWorkingRevisionResult>(done => { resolve = done; });
    const spy = vi.spyOn(run.client.workingRevisions!, "save").mockImplementation(() => pending);
    fireEvent.change(field, { target: { value: "Texte en cours de sauvegarde" } });
    const button = screen.getByRole("button", { name: "Enregistrer" });
    fireEvent.click(button); fireEvent.click(button); expect(spy).toHaveBeenCalledTimes(1); expect(field).toBeDisabled();
    view.unmount();
    const initial = run.revision();
    resolve(await actual({ revisionId: initial.revisionId, expectedSaveSequence: initial.saveSequence,
      content: { ...initial.content, sections: initial.content.sections.map(section => ({ ...section, blocks: section.blocks.map(block => ({ ...block, text: "Texte en cours de sauvegarde" })) })) } }));
    await waitFor(() => expect(run.revision().saveSequence).toBe(2));
    expect(run.close).not.toHaveBeenCalled();
  });
  it("shows native collection structures and open items read-only on the existing CRF adapter", async () => {
    const run = await runtime();
    render(<DocumentStudio client={run.client} target={{ ...run.target, nativeDocumentRef: "CRF" }} onClose={run.close} />);
    await run.ready();
    expect(screen.getByText("Spécifications de collecte · lecture seule")).toBeInTheDocument();
    expect(screen.getByText("Éléments ouverts et réserves · lecture seule")).toBeInTheDocument();
    expect(screen.getByText("Effectif et procédures détaillées de sécurité ouverts")).toBeInTheDocument();
  });
  it("displays protected references using existing native facts only", async () => {
    const run = await runtime();
    const native = run.g2.body.native;
    if (native.family !== "DRCI") throw new Error("EXPECTED_DRCI");
    const fact = native.value.sourceFacts[0];
    expect(studioBoundText(`[[FACT:${fact.ref}]] [[FACT:missing]]`, run.g2.body)).toBe(`${fact.content} [[FACT:missing]]`);
  });
});
