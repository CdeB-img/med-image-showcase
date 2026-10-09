import { describe, expect, it, vi } from "vitest";
import { workingRevisionFixture } from "./working-revision-fixture";
import { createStudioEditRequest, requireStudioEditSource, acceptStudioEditProposal, applyStudioEditProposal,
  prepareStudioEditPacket, studioEditOperationId } from "../studio-edit-proposal";
import { resolveSavedStudioEditSource } from "../../../../server/protocol-designer-studio-edit";
import { handleProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";

const setup = async () => {
  const run = await workingRevisionFixture({ monocentric: true });
  const { revision } = await run.owner.create(run.access2, run.createInput);
  const binding = { projectId: run.project2.projectId, projectVersion: run.project2.versionId, projectDigest: run.project2.projectDigest };
  const request = createStudioEditRequest(revision, binding, revision.content.sections[0].blocks[0].nodeId, "Rends ce passage plus clair sans perdre les informations.");
  return { ...run, revision, binding, request };
};
describe("Native Studio writing proposal / no semantic owner transfer", () => {
  it("exact request/proposal replay, accept into same buffer, save and reload without archive/Project mutation", async () => {
    const run = await setup(), generations = run.fixture.bodies(), project = JSON.stringify(run.project2);
    const raw = { requestDigest: run.request.requestDigest, proposedText: "Formulation proposée par la fixture, non évaluée scientifiquement." };
    const proposal = acceptStudioEditProposal(run.request, run.revision, raw);
    expect(acceptStudioEditProposal(run.request, run.revision, raw)).toEqual(proposal);
    expect(proposal.semanticImpact).toBe("UNASSESSED");
    const content = applyStudioEditProposal(proposal, run.revision, run.revision.content, run.binding);
    const saved = await run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: 1, content });
    expect((await run.owner.get(run.access2, saved.revision.revisionId)).revision.content).toEqual(content);
    expect(new Set(run.fixture.revisions().map(item => (item.revision as { revisionId: string }).revisionId)).size).toBe(1);
    expect(run.fixture.bodies()).toEqual(generations); expect(JSON.stringify(run.project2)).toBe(project);
  });
  it.each(["buffer", "save", "project", "anchor"])("rejects stale %s without modifying the existing draft", async kind => {
    const run = await setup(), proposal = acceptStudioEditProposal(run.request, run.revision, { requestDigest: run.request.requestDigest, proposedText: "Proposition" });
    const buffer = structuredClone(run.revision.content), revision = structuredClone(run.revision), binding = { ...run.binding };
    if (kind === "buffer") buffer.title += " correction concurrente";
    if (kind === "save") revision.saveSequence++;
    if (kind === "project") binding.projectDigest = "foreign";
    if (kind === "anchor") proposal.request.binding.nativeAnchor = "foreign";
    expect(() => applyStudioEditProposal(proposal, revision, buffer, binding)).toThrow("STUDIO_EDIT_STALE_TARGET");
    expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("rejects invented citation/fact tokens and protected native target", async () => {
    const run = await setup();
    expect(() => acceptStudioEditProposal(run.request, run.revision, { requestDigest: run.request.requestDigest, proposedText: "[[FACT:invented]]" })).toThrow("DOC_REVISION_BINDING_IN_EDITABLE_TEXT");
    expect(() => acceptStudioEditProposal(run.request, run.revision, { requestDigest: "foreign", proposedText: "Texte" })).toThrow("STUDIO_EDIT_RESPONSE_BINDING_INVALID");
    const content = structuredClone(run.revision.content); content.sections[0].blocks[0].text = "[[CITE:protected]]";
    const { workingRevisionContentDigest } = await import("../working-revision");
    const protectedRevision = { ...run.revision, content, contentDigest: workingRevisionContentDigest(content) };
    expect(() => createStudioEditRequest(protectedRevision, run.binding, run.request.binding.nodeId, "Réécris")).toThrow("STUDIO_EDIT_PROTECTED_TARGET");
  });
  it("native server source requires current save, permits no fake source and preserves two-tab conflict", async () => {
    const run = await setup();
    expect(await resolveSavedStudioEditSource(run.archive, run.access2, run.project2, run.request)).toEqual(run.revision);
    const content = structuredClone(run.revision.content); content.title += " autre onglet";
    await run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: 1, content });
    await expect(resolveSavedStudioEditSource(run.archive, run.access2, run.project2, run.request)).rejects.toThrow("STUDIO_EDIT_STALE_TARGET");
    await expect(run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: 1, content: run.revision.content })).rejects.toThrow("DOC_REVISION_SAVE_CONFLICT");
  });
  it("uses strict Structured Outputs on the existing guarded producer, explicit request idempotence and no provider retry", async () => {
    const run = await setup(), guard = createMemoryProtocolDesignerGuardForTests();
    const packet = prepareStudioEditPacket(run.request, run.revision, run.project2);
    expect(packet.outputSchema).toMatchObject({ type: "object", additionalProperties: false, required: ["requestDigest", "proposedText"] });
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_STUDIO_EDIT", model: "gpt-6-sol", status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify({ requestDigest: run.request.requestDigest, proposedText: "Texte proposé, UNASSESSED." }) }] }],
      usage: { input_tokens: 100, output_tokens: 30, total_tokens: 130 } })));
    const body = { operation: "STUDIO_EDIT_PROPOSAL", apiVersion: "1.0.0", currentProject: null, currentProjectRef: run.access2.project, editRequest: run.request,
      observabilityContext: { sessionId: run.sessionId, conversationId: null, turnId: null, clientRequestId: studioEditOperationId(run.request), testSessionId: null } };
    const invoke = async (value = body, proof = run.access2.proof) => {
      let status = 0, result: unknown;
      await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", origin: "https://noxia-imagerie.fr", host: "noxia-imagerie.fr",
        "x-forwarded-for": run.identity.clientAddress, "x-noxia-project-snapshot-proof": proof }, body: value }, {
        setHeader() {}, status(code) { status = code; return this; }, json(value) { result = value; },
      }, { NODE_ENV: "production", OPENAI_PROVIDER: "azure", AZURE_OPENAI_PROJECT_ENDPOINT: "https://fixture.services.ai.azure.com/api/projects/fixture",
        AZURE_OPENAI_API_KEY: "OFFLINE", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" },
      { fetchImpl, durableGuard: guard, projectSnapshotStore: run.snapshots, documentArchive: run.archive });
      return { status, result };
    };
    expect((await invoke()).status).toBe(200); expect(fetchImpl).toHaveBeenCalledOnce();
    expect((await invoke()).status).toBe(200); expect(fetchImpl).toHaveBeenCalledOnce();
    // The new corridor accepts only the existing durable reference transport,
    // never caller-supplied Project truth under an unchanged identity/digest.
    const { currentProjectRef: _ref, ...inline } = body;
    const forgedProject = structuredClone(run.project2); forgedProject.sections.flatMap(section => section.elements)[0].content = "État non vérifié du client";
    expect((await invoke({ ...inline, currentProject: forgedProject } as never)).status).not.toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const forged = structuredClone(body); forged.editRequest.binding.beforeDigest = "foreign";
    expect((await invoke(forged)).status).toBe(422); expect(fetchImpl).toHaveBeenCalledOnce();
    expect((await invoke(body, "x".repeat(43))).status).not.toBe(200); expect(fetchImpl).toHaveBeenCalledOnce();
    expect(() => requireStudioEditSource(forged.editRequest, run.revision, run.binding)).toThrow();
  });
});
