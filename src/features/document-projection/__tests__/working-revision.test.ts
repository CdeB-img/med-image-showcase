import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createPostgresDocumentArchive, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { editableArchivedDocument, validateWorkingRevisionContent } from "../working-revision";
import { workingRevisionFixture } from "./working-revision-fixture";

describe("DOC-owned working revisions / immutable native bases", () => {
  it("A: creates from native protocol_full G2 without rendering or changing generations", async () => {
    const run = await workingRevisionFixture(), rows = run.fixture.rows(), bodies = run.fixture.bodies();
    const result = await run.owner.create(run.access2, run.createInput);
    expect(result.revision.content.title).toBe(run.g2.body.native.family === "DRCI" ? run.g2.body.native.value.documents.find(d => d.kind === "PROTOCOL_FULL")!.title : "");
    expect(result.revision.project).toEqual(run.g2.ref.project);
    expect(result.revision.baseGenerationBodyDigest).toBe(run.g2.ref.bodySha256);
    expect(result.revision.identitySource.seriesId).toBe(run.g2.projection.seriesId);
    expect(result.revision.provenance.semanticImpact).toBe("UNASSESSED");
    expect(result.baseState).toEqual({ sourceVerified: true, projectCurrent: true, generationCurrent: true, stale: false });
    expect(run.fixture.rows()).toEqual(rows); expect(run.fixture.bodies()).toEqual(bodies);
    expect(await run.owner.create(run.access2, run.createInput)).toEqual(result);
    expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("B/C/D: saves only text, unchanged save is a noop, and a new owner reloads the last confirmed save", async () => {
    const run = await workingRevisionFixture(), project = structuredClone(run.project2), rows = run.fixture.rows(), bodies = run.fixture.bodies();
    const { revision } = await run.owner.create(run.access2, run.createInput), content = structuredClone(revision.content);
    content.title = "Titre éditorial modifié";
    content.sections[0].title = "Cadre du projet";
    content.sections[0].blocks[0].text += " Texte documentaire humain non évalué scientifiquement.";
    const saved = await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 1, content });
    expect(saved.revision.saveSequence).toBe(2); expect(saved.revision.content).toEqual(content);
    expect(await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 2, content })).toEqual(saved);
    expect(run.fixture.revisions()).toHaveLength(2);
    const reloaded = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    expect(await reloaded.workingRevisions!.get(run.access2, revision.revisionId)).toEqual(saved);
    expect(run.project2).toEqual(project); expect(run.fixture.rows()).toEqual(rows); expect(run.fixture.bodies()).toEqual(bodies);
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([2, 1]);
  });
  it("E: failed persistence retains the previous confirmed state", async () => {
    const run = await workingRevisionFixture(), initial = await run.owner.create(run.access2, run.createInput);
    const content = structuredClone(initial.revision.content); content.title = "Ne doit pas être sauvegardé";
    run.fixture.failRevisionSave(true);
    await expect(run.owner.save(run.access2, { revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content })).rejects.toThrow("OFFLINE_REVISION_WRITE_FAILURE");
    expect(await run.owner.get(run.access2, run.createInput.revisionId)).toEqual(initial);
    expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("F: stale two-tab saves (even identical content) conflict instead of silently overwriting", async () => {
    const run = await workingRevisionFixture(), { revision } = await run.owner.create(run.access2, run.createInput);
    const a = structuredClone(revision.content), b = structuredClone(revision.content); a.title = "Tab A"; b.title = "Tab B";
    const results = await Promise.allSettled([run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 1, content: a }),
      run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 1, content: b })]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect((results.find(result => result.status === "rejected") as PromiseRejectedResult).reason.code).toBe("DOC_REVISION_SAVE_CONFLICT");
    const current = await run.owner.get(run.access2, revision.revisionId);
    expect(current.revision.saveSequence).toBe(2);
    await expect(run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 1, content: current.revision.content })).rejects.toMatchObject({ code: "DOC_REVISION_SAVE_CONFLICT" });
    expect(run.fixture.revisions()).toHaveLength(2);
  });
  it("G: abandons logically, preserves audit/body, and forbids later editing", async () => {
    const run = await workingRevisionFixture(), bodies = run.fixture.bodies();
    await run.owner.create(run.access2, run.createInput);
    const abandoned = await run.owner.abandon(run.access2, { revisionId: run.createInput.revisionId, expectedSaveSequence: 1 });
    expect(abandoned.revision.status).toBe("ABANDONED"); expect(abandoned.revision.saveSequence).toBe(2);
    expect(run.fixture.revisions().map(row => row.status)).toEqual(["ACTIVE", "ABANDONED"]);
    expect(await run.owner.get(run.access2, run.createInput.revisionId)).toEqual(abandoned);
    expect(await run.owner.abandon(run.access2, { revisionId: run.createInput.revisionId, expectedSaveSequence: 2 })).toEqual(abandoned);
    await expect(run.owner.save(run.access2, { revisionId: run.createInput.revisionId, expectedSaveSequence: 2, content: abandoned.revision.content })).rejects.toMatchObject({ code: "DOC_REVISION_ABANDONED" });
    await expect(run.owner.create(run.access2, run.createInput)).rejects.toMatchObject({ code: "DOC_REVISION_ABANDONED" });
    expect(run.fixture.bodies()).toEqual(bodies);
  });
  it("H: detects a later durably known Project even before generation, then a later generation; never rebases", async () => {
    const run = await workingRevisionFixture(), initial = await run.owner.create(run.access2, run.createInput);
    const access3 = await run.register(run.project3, run.access2.proof);
    const beforeNewGeneration = await run.owner.get(run.access2, run.createInput.revisionId);
    expect(beforeNewGeneration.baseState).toEqual({ sourceVerified: true, projectCurrent: false, generationCurrent: true, stale: true });
    await run.generation(run.project3, access3);
    const historical = await run.owner.get(access3, run.createInput.revisionId);
    expect(historical.baseState).toEqual({ sourceVerified: true, projectCurrent: false, generationCurrent: false, stale: true });
    expect(historical.revision).toEqual(initial.revision);
    const content = structuredClone(historical.revision.content); content.title += " — copie historique";
    const saved = await run.owner.save(access3, { revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content });
    expect(saved.revision.project).toEqual(initial.revision.project);
    expect(saved.revision.baseGenerationId).toBe(run.g2.ref.generationId);
    expect(saved.baseState.stale).toBe(true);
  });
  it("I: rejects unknown generations, wrong body digests, logical selectors and access capabilities", async () => {
    const run = await workingRevisionFixture();
    await expect(run.owner.create(run.access2, { ...run.createInput, baseGenerationId: "missing" })).rejects.toMatchObject({ code: "DOC_ARCHIVE_GENERATION_NOT_FOUND" });
    await expect(run.owner.create(run.access2, { ...run.createInput, baseGenerationBodyDigest: "0".repeat(64) })).rejects.toMatchObject({ code: "DOC_REVISION_SOURCE_DIGEST_MISMATCH" });
    await expect(run.owner.create(run.access2, { ...run.createInput, nativeDocumentRef: "protocol_full.html" })).rejects.toMatchObject({ code: "DOC_REVISION_DOCUMENT_NOT_FOUND" });
    await expect(run.owner.create({ ...run.access2, proof: null }, run.createInput)).rejects.toMatchObject({ code: "PROJECT_SNAPSHOT_SESSION_MISMATCH" });
    expect(run.fixture.revisions()).toHaveLength(0);
  });
  it("J: reuses the existing RECRUITMENT native fixture, without filename/protocol hardcoding", async () => {
    const run = await workingRevisionFixture();
    const protocol = await run.owner.create(run.access2, run.createInput);
    const other = await run.owner.create(run.access2, { ...run.createInput, revisionId: "document-working-revision:recruitment", nativeDocumentRef: "RECRUITMENT" });
    expect(other.revision.logicalDocumentRef).not.toBe(protocol.revision.logicalDocumentRef);
    expect(other.revision.identitySource.seriesId).toBe(protocol.revision.identitySource.seriesId);
    expect(other.revision.identitySource.nativeDocumentRef).toBe("RECRUITMENT");
    expect(other.revision.content.sections[0].blocks[0].text).toContain("colchicine");
  });
  it("keeps logical identity across generations and protects native nodes, references and non-textual objects", async () => {
    const run = await workingRevisionFixture();
    const old = await run.owner.create(run.access2, { ...run.createInput, revisionId: "document-working-revision:old", baseGenerationId: run.g1.ref.generationId, baseGenerationBodyDigest: run.g1.ref.bodySha256 });
    const current = await run.owner.create(run.access2, run.createInput);
    expect(old.revision.logicalDocumentRef).toBe(current.revision.logicalDocumentRef);
    const tampered = structuredClone(current.revision.content); tampered.sections[0].blocks[0].provenanceRefs = [];
    await expect(run.owner.save(run.access2, { revisionId: current.revision.revisionId, expectedSaveSequence: 1, content: tampered })).rejects.toMatchObject({ code: "DOC_REVISION_PROTECTED_STRUCTURE_CHANGED" });
    const injection = structuredClone(current.revision.content); injection.sections[0].blocks[0].text += " [[FACT:invented]]";
    await expect(run.owner.save(run.access2, { revisionId: current.revision.revisionId, expectedSaveSequence: 1, content: injection })).rejects.toMatchObject({ code: "DOC_REVISION_BINDING_IN_EDITABLE_TEXT" });
    expect((await run.archive.body(run.access2, run.g2.ref.generationId)).body).toEqual(run.g2.body);
  });
  it("adapts existing TEMPLATE nodes without synthesizing IDs or round-tripping rendered content", async () => {
    const run = await workingRevisionFixture();
    const source = await run.archive.body(run.access2, run.g2.projection.projectionId);
    const selector = run.g2.projection.documentDefinition?.documentId ?? run.g2.projection.projectionType;
    const result = await run.owner.create(run.access2, { ...run.createInput, revisionId: "document-working-revision:template",
      baseGenerationId: source.ref.generationId, baseGenerationBodyDigest: source.ref.bodySha256, nativeDocumentRef: selector });
    expect(result.revision.content.sections.map(section => section.nodeId)).toEqual(run.g2.projection.sections.map(section => section.sectionId));
    expect(result.revision.identitySource.documentDefinitionId).toBe(run.g2.projection.documentDefinition?.documentId ?? null);
  });
  it("rejects mismatched source and handoff bindings and protects ordered native FACT/CITE tokens", async () => {
    const run = await workingRevisionFixture(), source = { ref: run.g2.ref, body: run.g2.body };
    const bad = structuredClone(source); bad.ref = { ...bad.ref, project: { ...bad.ref.project, projectDigest: "wrong" } };
    expect(() => editableArchivedDocument(bad, "PROTOCOL_FULL", { ref: run.g2.ref, body: run.g2.projectionBody })).toThrow("DOC_REVISION_SOURCE_BINDING_INVALID");
    const wrongProjection = { ref: run.g1.ref, body: run.g1.projectionBody };
    expect(() => editableArchivedDocument(source, "PROTOCOL_FULL", wrongProjection)).toThrow("DOC_REVISION_LOGICAL_SOURCE_INVALID");
    const content = (await run.owner.create(run.access2, run.createInput)).revision.content;
    // Exclusively structural token preservation; native science is unchanged.
    const tokens = structuredClone(content); tokens.sections[0].blocks[0].text += " [[FACT:f1]][[CITE:s1]]";
    const edit = structuredClone(tokens); edit.sections[0].blocks[0].text = "Texte éditorial [[FACT:f1]][[CITE:s1]]";
    expect(validateWorkingRevisionContent(edit, tokens)).toEqual(edit);
    edit.sections[0].blocks[0].text = "Texte éditorial [[CITE:s1]][[FACT:f1]]";
    expect(() => validateWorkingRevisionContent(edit, tokens)).toThrow("DOC_REVISION_BINDING_IN_EDITABLE_TEXT");
  });
  it("adds an append-only table with exact source FK, no mutation of golden tables", () => {
    const sql = readFileSync("server/migrations/004_doc_working_revision.sql", "utf8");
    expect(sql).toContain("references noxia_durable.doc_generation (session_key_hash, project_id, generation_id)");
    expect(sql).toContain("before update or delete");
    expect(sql).not.toMatch(/(?:alter|update|delete from) noxia_durable\.(?:doc_generation|doc_generation_body|public_project_snapshot)/u);
  });
  it("revalidates archived source bytes on retrieval and save; corrupted bindings fail closed", async () => {
    const run = await workingRevisionFixture(), initial = await run.owner.create(run.access2, run.createInput);
    run.fixture.corruptBody(run.g2.ref.generationId);
    await expect(run.owner.get(run.access2, run.createInput.revisionId)).rejects.toMatchObject({ code: "DOC_ARCHIVE_BODY_CORRUPT" });
    await expect(run.owner.save(run.access2, { revisionId: run.createInput.revisionId, expectedSaveSequence: 1, content: initial.revision.content })).rejects.toMatchObject({ code: "DOC_ARCHIVE_BODY_CORRUPT" });
    expect(run.fixture.revisions()).toHaveLength(1);
  });
  it("bounds content and rejects changed/removed nodes without creating a new confirmed save", async () => {
    const run = await workingRevisionFixture(), { revision } = await run.owner.create(run.access2, run.createInput);
    const content = structuredClone(revision.content); content.sections = [];
    await expect(run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 1, content })).rejects.toMatchObject({ code: "DOC_REVISION_PROTECTED_STRUCTURE_CHANGED" });
    content.sections = structuredClone(revision.content.sections); content.title = "x".repeat(1_000_001);
    await expect(run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: 1, content })).rejects.toMatchObject({ code: "DOC_REVISION_PROTECTED_STRUCTURE_CHANGED" });
    expect(run.fixture.revisions()).toHaveLength(1);
  });
});
