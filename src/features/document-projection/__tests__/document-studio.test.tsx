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
import * as feedback from "@/hooks/use-toast";
import { studioFinalizationQuestion } from "../../query-navigation/studio-finalization-navigation";
import { transitionStudioIntent } from "../studio-finalization-intent";
import { createStudioEditRequest, acceptStudioEditProposal } from "../studio-edit-proposal";
import type { StudioEditRuntime } from "../../protocol-designer/studio-edit-client";

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
  const open = (finalization?: StudioFinalizationRuntime, onConversation?: () => void, editing?: StudioEditRuntime) => render(<DocumentStudio client={client} target={target} finalization={finalization} editing={editing} onClose={close} onConversation={onConversation} />);
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
  it("conversational proposal preview/cancel/apply/save/reload uses one draft and makes no implicit version or Project", async () => {
    const run = await runtime(), archived = run.fixture.bodies();
    const binding = { projectId: run.project2.projectId, projectVersion: run.project2.versionId, projectDigest: run.project2.projectDigest };
    const propose = vi.fn<StudioEditRuntime["propose"]>(async (revision, node, instruction) => {
      const request = createStudioEditRequest(revision, binding, node, instruction);
      return acceptStudioEditProposal(request, revision, { requestDigest: request.requestDigest, proposedText: "Correction proposée par la fixture, non évaluée scientifiquement." });
    });
    const editing = { projectBinding: () => binding, propose };
    const view = run.open(undefined, undefined, editing); await run.ready(); expect(propose).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Demande de modification" }), { target: { value: "Rends ce paragraphe plus clair" } });
    fireEvent.click(screen.getByRole("button", { name: "Proposer une modification" }));
    await screen.findByRole("region", { name: "Proposition de modification" });
    const original = (await run.ready()).getAttribute("value") ?? run.revision().content.sections[0].blocks[0].text;
    expect(await run.ready()).toHaveValue(original);
    fireEvent.click(screen.getByRole("button", { name: "Annuler la proposition" })); expect(await run.ready()).toHaveValue(original);
    fireEvent.click(screen.getByRole("button", { name: "Proposer une modification" })); await screen.findByRole("region", { name: "Proposition de modification" });
    fireEvent.click(screen.getByRole("button", { name: "Appliquer au brouillon" }));
    expect(await run.ready()).toHaveValue("Correction proposée par la fixture, non évaluée scientifiquement.");
    expect(run.fixture.revisions()).toHaveLength(1); await save(); const id = run.revision().revisionId;
    view.unmount(); run.open(undefined, undefined, editing); expect(await run.ready()).toHaveValue("Correction proposée par la fixture, non évaluée scientifiquement.");
    expect(run.revision().revisionId).toBe(id); expect(run.fixture.bodies()).toEqual(archived); expect(propose).toHaveBeenCalledTimes(2);
  });
  it("local concurrent edit invalidates a displayed proposal; dirty state cannot request a paid rewrite", async () => {
    const run = await runtime(), binding = { projectId: run.project2.projectId, projectVersion: run.project2.versionId, projectDigest: run.project2.projectDigest };
    const editing: StudioEditRuntime = { projectBinding: () => binding, propose: vi.fn(async (revision, node, instruction) => {
      const request = createStudioEditRequest(revision, binding, node, instruction);
      return acceptStudioEditProposal(request, revision, { requestDigest: request.requestDigest, proposedText: "Proposition" });
    }) };
    run.open(undefined, undefined, editing); await run.ready();
    fireEvent.change(screen.getByRole("textbox", { name: "Demande de modification" }), { target: { value: "Clarifie" } });
    fireEvent.click(screen.getByRole("button", { name: "Proposer une modification" })); await screen.findByRole("region", { name: "Proposition de modification" });
    fireEvent.change(await run.ready(), { target: { value: "Correction concurrente conservée" } });
    expect(screen.getByRole("button", { name: "Proposer une modification" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Appliquer au brouillon" })); await screen.findByRole("alert");
    expect(await run.ready()).toHaveValue("Correction concurrente conservée");
  });
  it("READ is read-only and creates no draft/intent; explicit Edit opens one native revision", async () => {
    const run = await runtime(), execute = vi.fn<StudioFinalizationRuntime["run"]>(async () => null);
    render(<DocumentStudio client={run.client} target={{ ...run.target, initialMode: "READ" }} finalization={{ run: execute }} onClose={run.close} />);
    await screen.findByText("Version archivée · lecture seule");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(run.fixture.revisions()).toHaveLength(0); expect(execute).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Créer la version suivante" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" })); await run.ready();
    expect(run.fixture.revisions()).toHaveLength(1);
    await waitFor(() => expect(execute).toHaveBeenCalledOnce());
    expect(execute.mock.calls[0][2]).toBe(true); // read-only intent recovery, never finalization
  });
  it("READ resumes an existing saved draft without writing or launching finalization", async () => {
    const run = await runtime(), initial = await run.owner.create(run.access2, run.createInput);
    const content = structuredClone(initial.revision.content); content.sections[0].blocks[0].text = "Texte humain déjà enregistré";
    const saved = await run.owner.save(run.access2, { revisionId: initial.revision.revisionId, expectedSaveSequence: 1, content });
    const before = run.fixture.revisions();
    render(<DocumentStudio client={run.client} target={{ ...run.target, initialMode: "READ", activeRevisionId: saved.revision.revisionId }} onClose={run.close} />);
    await screen.findByText(content.sections[0].blocks[0].text);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument(); expect(run.fixture.revisions()).toEqual(before);
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });
  it("COMPARE edits/saves the single native buffer, updates diff and survives mode switches/reload; base remains immutable", async () => {
    const run = await runtime(), view = run.open(), archived = run.fixture.bodies(), execute = vi.fn();
    await run.ready(); const id = run.revision().revisionId, original = run.revision().content.sections[0].blocks[0].text;
    fireEvent.click(screen.getByRole("button", { name: "Comparer" }));
    for (const base of screen.getAllByTestId("studio-compare-base")) expect(within(base).queryByRole("textbox")).not.toBeInTheDocument();
    const field = compareScope().getByRole("textbox", { name: "Section 1 · paragraphe 1" });
    const calls = run.transport.mock.calls.length;
    fireEvent.change(field, { target: { value: "Correction éditoriale de qualification" } });
    expect(compareScope().getByText(original)).toBeInTheDocument();
    expect(compareScope().getByText("Section 1 · paragraphe 1 · Modifié")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lire" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Correction éditoriale de qualification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    expect(await run.ready()).toHaveValue("Correction éditoriale de qualification");
    fireEvent.click(screen.getByRole("button", { name: "Comparer" }));
    expect(run.transport).toHaveBeenCalledTimes(calls); expect(run.revision().revisionId).toBe(id);
    expect(run.fixture.revisions()).toHaveLength(1); expect(execute).not.toHaveBeenCalled();
    await save(); expect(run.revision().content.sections[0].blocks[0].text).toBe("Correction éditoriale de qualification");
    expect(run.fixture.bodies()).toEqual(archived);
    view.unmount(); run.open(); expect(await run.ready()).toHaveValue("Correction éditoriale de qualification");
    expect(run.revision().revisionId).toBe(id); expect(run.fixture.revisions()).toHaveLength(2);
  });
  it("navigation cannot discard a dirty buffer outside the native leave confirmation", async () => {
    const run = await runtime(), lock = vi.fn();
    render(<DocumentStudio client={run.client} target={run.target} onClose={run.close} onNavigationLock={lock} />);
    fireEvent.change(await run.ready(), { target: { value: "Travail local conservé" } });
    await waitFor(() => expect(lock).toHaveBeenLastCalledWith(true));
    await save(); await waitFor(() => expect(lock).toHaveBeenLastCalledWith(false));
  });
  it("N: plain Error code is preserved next to the initiating action; private/error prose is not rendered", async () => {
    const run = await runtime();
    const execute = vi.fn<StudioFinalizationRuntime["run"]>(async (_revision, _progress, opening) => {
      if (opening) return null;
      throw new Error("STUDIO_INTENT_PREPARATION_DIVERGENCE");
    });
    run.open({ run: execute }); await run.ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    const status = screen.getByTestId("studio-finalization-status");
    await waitFor(() => expect(status).toHaveAttribute("data-state", "FAILED"));
    expect(within(screen.getByTestId("studio-action-area")).getByText("STUDIO_INTENT_PREPARATION_DIVERGENCE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reprendre la création" })).toBeEnabled();
  });
  it("N: unbounded plain Error message is never copied into the UI", async () => {
    const run = await runtime();
    run.open({ run: async (_r, _p, opening) => { if (opening) return null; throw new Error("Private scientific text: not a bounded code"); } });
    await run.ready(); await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    await screen.findByRole("alert");
    expect(screen.queryByText(/Private scientific text/u)).not.toBeInTheDocument();
    expect(screen.queryByText("Détail technique")).not.toBeInTheDocument();
  });
  it("proven native blocking state is FAILED with its bounded reason, not falsely READY_TO_RESUME", async () => {
    const run = await runtime(), source = await run.client.body(run.g2.ref.generationId);
    const { revision } = await run.client.workingRevisions!.open({ baseGenerationId: run.g2.ref.generationId,
      baseGenerationBodyDigest: run.g2.ref.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" });
    const at = "2026-10-08T18:00:00.000Z", session = { ...createFunctionalResetSession(at),
      sessionId: run.sessionId, projectId: run.project2.projectId, project: run.project2 };
    const frozen = await freezeStudioFinalizationWork({ session, revision, source,
      projectionSource: await run.client.body(run.g2.projection.projectionId) });
    const initial = await run.archive.finalizationIntents!.create(run.access2, frozen);
    const blocked = transitionStudioIntent(initial, "BLOCKED", { ...initial.resolution, reason: "STUDIO_INTENT_PROJECT_STALE" }, at);
    const execute = vi.fn<StudioFinalizationRuntime["run"]>(async () => blocked);
    run.open({ run: execute }); await run.ready();
    await waitFor(() => expect(screen.getByTestId("studio-finalization-status")).toHaveAttribute("data-state", "FAILED"));
    expect(within(screen.getByTestId("studio-action-area")).getByText("STUDIO_INTENT_PROJECT_STALE")).toBeInTheDocument();
    expect(execute).toHaveBeenCalledOnce(); expect(execute.mock.calls[0][2]).toBe(true);
  });
  it("O: true progress remains in the persistent sticky action area at the bottom of the long document", async () => {
    const run = await runtime(); let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    run.open({ run: async (_revision, progress, opening) => { if (opening) return null;
      progress("SCIENCE"); await gate; return null; } });
    await run.ready(); await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    const action = screen.getByTestId("studio-action-area");
    expect(action).toHaveClass("sticky", "bottom-0");
    expect(within(action).getByText(/Création de version en cours · Mise à jour scientifique/u)).toBeInTheDocument();
    expect(screen.getByTestId("studio-finalization-status")).toHaveAttribute("data-state", "RUNNING");
    expect(within(action).queryByText(/%/u)).not.toBeInTheDocument();
    release(); await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
  });
  it("P/L: waiting state exposes the exact native question and direct conversation path on reopen without executing work", async () => {
    const run = await runtime(); let { revision } = await run.client.workingRevisions!.open({
      baseGenerationId: run.g2.ref.generationId, baseGenerationBodyDigest: run.g2.ref.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" });
    revision = (await run.client.workingRevisions!.save({ revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence,
      content: { ...revision.content, title: "Changement à clarifier" } })).revision;
    const session = { ...createFunctionalResetSession("2026-10-08T18:00:00.000Z"), sessionId: run.sessionId,
      projectId: run.project2.projectId, project: run.project2 };
    const source = await run.client.body(run.g2.ref.generationId);
    const frozen = await freezeStudioFinalizationWork({ session, revision, source,
      projectionSource: await run.client.body(run.g2.projection.projectionId) });
    const owner = run.archive.finalizationIntents!, started = await owner.create(run.access2, frozen), request = frozen.scientificSources.request;
    const intent = await owner.assess(run.access2, started.finalizationIntentId, started.sequence,
      acceptStudioAssessment(request, run.project2, { requestDigest: request.requestDigest, scientificStateDisposition: "NO_NET_CHANGE",
        scientificStateReason: "Controlled ambiguity", scientificStateAmbiguity: null,
        edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef,
          classification: "AMBIGUOUS", reason: "Material interpretations require the existing scientific owner", provenanceRefs: [edit.editRef], projectCoverage: null,
          ambiguity: { question: "La biopsie remplace-t-elle l’IRM ou est-elle ajoutée pour un sous-groupe ?",
            materialProjectRefs: [request.currentProject.objects[0].versionRef], alternatives: [
              { interpretation: "Remplacement", consequence: "Tous les sujets" }, { interpretation: "Ajout", consequence: "Un sous-groupe" }] } })) }, session.updatedAt));
    const execute = vi.fn<StudioFinalizationRuntime["run"]>(async () => intent), navigate = vi.fn();
    run.open({ run: execute, clarification: value => studioFinalizationQuestion(value, session) }, navigate);
    await run.ready(); await waitFor(() => expect(screen.getByTestId("studio-finalization-status")).toHaveAttribute("data-state", "WAITING_FOR_CLARIFICATION"));
    const action = screen.getByTestId("studio-action-area");
    expect(within(action).getByText("La biopsie remplace-t-elle l’IRM ou est-elle ajoutée pour un sous-groupe ?")).toBeInTheDocument();
    fireEvent.click(within(action).getByRole("button", { name: "Répondre dans la conversation" }));
    expect(navigate).toHaveBeenCalledOnce(); expect(execute).toHaveBeenCalledOnce(); expect(execute.mock.calls[0][2]).toBe(true);
    expect(run.revision().status).toBe("ACTIVE"); expect(run.fixture.rows()).toHaveLength(4);
  });
  it("P/V: reload observes lost archive acknowledgement; explicit resume resolves same intent and historical save", async () => {
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
      expect(saved).toEqual(revision);
      if (resumeOnly) return owner.get(run.access2, intent.finalizationIntentId);
      return owner.finalizeDocuments(run.access2, intent.finalizationIntentId);
    });
    run.open({ run: execute });
    fireEvent.click(await screen.findByRole("button", { name: "Reprendre la création" }));
    await screen.findByText("✓ Version 3 créée");
    expect(execute).toHaveBeenCalledTimes(2); expect(execute.mock.calls[0][2]).toBe(true);
    expect(execute.mock.calls[1][2]).toBeUndefined();
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
    fireEvent.click(within(item).getByRole("button", { name: "Afficher les documents" }));
    fireEvent.click(await within(item).findByRole("button", { name: /Modifier dans Studio Version 2 · .*PROTOCOL_FULL/u }));
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
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
    expect(run.fixture.revisions()).toHaveLength(1); // no autosave
    await save();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    expect(screen.getByText("✓ Enregistré").closest("footer")).not.toBeNull();
    expect(run.revision().content.sections[0].blocks[0].text).toBe(text);
    expect(run.revision().provenance.semanticImpact).toBe("UNASSESSED");
    expect(run.revision().saveSequence).toBe(2);
    expect(run.project2).toEqual(project); expect(run.fixture.rows()).toEqual(rows); expect(run.fixture.bodies()).toEqual(bodies);
  });
  it("D: CLEAN disables save and reverting edits restores CLEAN without any durable save", async () => {
    const run = await runtime(); run.open(); await run.ready();
    const field = await run.ready(), original = run.revision().content.sections[0].blocks[0].text;
    const calls = run.transport.mock.calls.length;
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(run.transport).toHaveBeenCalledTimes(calls);
    fireEvent.change(field, { target: { value: original + " — modification" } });
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
    fireEvent.change(field, { target: { value: original } });
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
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
    expect(screen.queryByText("✓ Enregistré")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled();
  });
  it("finalization failure uses destructive viewport toast, keeps exact saved draft/retry and hides internal details", async () => {
    const run = await runtime(), toast = vi.spyOn(feedback, "toast").mockImplementation(() => ({ id: "offline", dismiss: vi.fn(), update: vi.fn() }));
    const error = new bridge.ProductBridgeClientError("STUDIO_SCIENTIFIC_ASSESSMENT_FAILED", "Private provider prose must not be shown", null, null, null, null, null,
      { contract: "STUDIO_ASSESSMENT_FAILURE_V1", owner: "SCIENTIFIC_THINKING", function: "acceptStudioAssessment", code: "STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID" });
    const execute = vi.fn<StudioFinalizationRuntime["run"]>(async (_revision, _stage, resumeOnly) => { if (resumeOnly) return null; throw error; });
    const view = run.open({ run: execute }); const field = await run.ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Créer la version suivante" })).toBeEnabled());
    fireEvent.change(field, { target: { value: "Texte humain conservé après échec" } }); await save();
    const saved = structuredClone(run.revision()), archived = structuredClone(run.fixture.rows());
    fireEvent.click(screen.getByRole("button", { name: "Créer la version suivante" }));
    await screen.findByRole("alert");
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive", title: "La création de la version n’a pas abouti.", description: expect.stringContaining("conservés") }));
    expect(screen.getByRole("alert")).toHaveClass("text-destructive");
    expect(screen.queryByText(/STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID|Private provider prose/u)).not.toBeInTheDocument();
    expect(field).toHaveValue(saved.content.sections[0].blocks[0].text);
    expect(run.revision()).toEqual(saved); expect(run.fixture.rows()).toEqual(archived);
    expect(screen.getByRole("button", { name: "Reprendre la création" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Reprendre la création" }));
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(3));
    view.unmount(); run.open({ run: execute }); expect(await run.ready()).toHaveValue(saved.content.sections[0].blocks[0].text);
    expect(run.revision()).toEqual(saved);
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
    fireEvent.click(screen.getByRole("button", { name: "Comparer" }));
    expect(compareScope().getByText(original)).toBeInTheDocument();
    expect(compareScope().getByRole("textbox", { name: "Section 1 · paragraphe 1" })).toHaveValue("Texte modifié dans le brouillon");
    expect(compareScope().getByText("Section 1 · paragraphe 1 · Modifié")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Section 1 · paragraphe 1" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Comparer" }));
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
