import Ajv from "ajv";
import { z } from "zod/v4";
import { describe, expect, it, vi } from "vitest";
import { workingRevisionFixture } from "../../document-projection/__tests__/working-revision-fixture";
import { archiveSqlFixture } from "../../document-projection/__tests__/archive-sql-fixture";
import { memoryProjectSnapshotStore } from "../../protocol-designer/functional-reset/__tests__/fixtures/memory-project-snapshot-store";
import { createPostgresDocumentArchive, documentArchiveCapacity, docSha256 } from "../../../../server/protocol-designer-document-archive";
import { DOC_ARCHIVE_CONTRACT, documentNativeGeneratedAt, type DocumentGenerationBody } from "../../document-projection/generation-persistence";
import { prepareDrciDraftPack, materializeDrciDraftPack } from "../../document-projection/drci-draft-pack";
import { buildCanonicalCrfPackage } from "../../document-projection/study-deliverable-portfolio";
import { createFunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { freezeStudioFinalizationWork } from "../../protocol-designer/functional-reset/studio-finalization-lifecycle";
import { createStudioFinalizationRuntime } from "../../protocol-designer/functional-reset/studio-finalization-runtime";
import type { DocumentArchiveClient } from "../../document-projection/generation-archive-client";
import { studioAssessmentPayloadSchema, type StudioAssessmentPayload } from "../../document-projection/studio-reconciliation-contract";
import { logicalDigest, stableStringify } from "../../knowledge-engine/canonical";
import { acceptStudioAssessment, prepareStudioAssessmentRequest, studioAssessmentOperationIdentity, studioScientificRoute } from "../studio-runtime";
import { buildOpenAITerraConversationPayload } from "../../../../api/protocol-designer-openai-extraction-provider";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";

const NOW = "2026-10-09T00:00:00.000Z";
/** REAL_FAILURE_SHAPE_SANITIZED: V1, 61 native text nodes, save 2,
 * 60 unchanged nodes and the exact reported prefix replacement. All remaining
 * prose/identities come from governed synthetic fixtures, not private bodies.
 * No archived generation is patched: this pack is built before its first commit. */
const setup = async () => {
  const seed = await workingRevisionFixture({ monocentric: true }), project = seed.project1;
  const snapshots = memoryProjectSnapshotStore(), fixture = archiveSqlFixture();
  const registration = await snapshots.persist(seed.identity, project, null);
  fixture.recordSnapshot(docSha256(seed.sessionId), project);
  const access = { identity: seed.identity, project: registration.ref, proof: registration.proof };
  const archive = createPostgresDocumentArchive("postgres://offline", snapshots, documentArchiveCapacity({}), fixture.sql);
  const native = seed.nativeGeneration(project), protocol = native.pack.documents.find(d => d.kind === "PROTOCOL_FULL")!;
  const before = `Ce protocole de travail concerne ${protocol.sections[0].paragraphs[0]}`;
  const sections = Array.from({ length: 20 }, (_, index) => ({ ...protocol.sections[0], title: `Section native ${index + 1}`,
    paragraphs: [index === 0 ? before : `Texte documentaire synthétique ${index + 1}.`, `Paragraphe conservé ${index + 1}.`] }));
  const pack = materializeDrciDraftPack({ documents: native.pack.documents.map(d => d.kind === "PROTOCOL_FULL" ? { ...d, sections } : d),
    crfRows: native.pack.crfRows }, { project, generatedAt: native.pack.generatedAt,
    packet: prepareDrciDraftPack(project, { handoffDecision: native.projection.humanDecisions.find(decision => decision.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION")!,
      protocolProjection: native.projection, crf: buildCanonicalCrfPackage(project) }) });
  const body: DocumentGenerationBody = { contract: DOC_ARCHIVE_CONTRACT, native: { family: "DRCI", value: pack },
    files: [], rendererVersion: "1.0.0", buildCommit: null };
  const commit = async (id: string, value: DocumentGenerationBody) => {
    await archive.admit(access, { requestId: id, requestSha256: docSha256(JSON.stringify(value)),
      generatedAt: documentNativeGeneratedAt(value.native), reservedBytes: 1_000_000 });
    return (await archive.commit(access, id, value)).generation;
  };
  await commit("projection-v1", native.projectionBody);
  const ref = await commit("generation-v1", body), owner = archive.workingRevisions!, intents = archive.finalizationIntents!;
  let { revision } = await owner.create(access, { revisionId: "document-working-revision:coverage-real-shape",
    baseGenerationId: ref.generationId, baseGenerationBodyDigest: ref.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" });
  const content = structuredClone(revision.content);
  content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("Ce protocole de travail concerne", "Ce protocole est une version de travail et il concerne");
  revision = (await owner.save(access, { revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence, content })).revision;
  const session = { ...createFunctionalResetSession(NOW), sessionId: seed.sessionId, projectId: project.projectId, project };
  const frozen = await freezeStudioFinalizationWork({ session, revision, source: { ref, body },
    projectionSource: await archive.body(access, native.projection.projectionId) });
  return { project, archive, owner, intents, access, revision, session, frozen, request: frozen.scientificSources.request, ref, body, fixture };
};
type Run = Awaited<ReturnType<typeof setup>>;
const ambiguityFor = (run: Run) => ({ question: "Remplacement ou ajout pour un sous-groupe ?", materialProjectRefs: [run.request.currentProject.objects[0].versionRef],
  alternatives: [{ interpretation: "Remplacement", consequence: "Tous les participants sont concernés" },
    { interpretation: "Ajout", consequence: "Un sous-groupe est concerné" }] });
const payloadFor = (run: Run, classification: StudioAssessmentPayload["edits"][number]["classification"] = "DOCUMENT_ONLY",
  coverage: StudioAssessmentPayload["edits"][number]["projectCoverage"] = null): StudioAssessmentPayload => ({
  requestDigest: run.request.requestDigest, scientificStateDisposition: "NO_NET_CHANGE", scientificStateReason: "État gouverné exact sans contribution scientifique nouvelle",
  scientificStateAmbiguity: null, edits: run.request.delta.filter(d => d.change !== "UNCHANGED").map(edit => ({
    editRef: edit.editRef, classification, reason: "Évaluation native contrôlée, sans certification clinique",
    provenanceRefs: [edit.editRef], projectCoverage: coverage, ambiguity: classification === "AMBIGUOUS" ? ambiguityFor(run) : null })) });
const validateWire = (run: Run, raw: unknown) => new Ajv({ allErrors: true }).compile(prepareStudioAssessmentRequest(run.request, run.project).outputSchema)(raw);
const coverageFor = (run: Run, coverage: "COMPLETE" | "PARTIAL" | "UNKNOWN") => ({ coverage,
  projectVersionRefs: [run.request.currentProject.objects.find(o => o.epistemicState === "KNOWN" && o.decisionRefs.length)!.versionRef] });

describe("producer 1.2 / native classification-coverage invariant / matrix A–H", () => {
  it.each([
    ["DOCUMENT_ONLY", null, true], ["DOCUMENT_ONLY", "PARTIAL", false], ["DOCUMENT_ONLY", "COMPLETE", false], ["DOCUMENT_ONLY", "UNKNOWN", false],
    ["AMBIGUOUS", null, true], ["AMBIGUOUS", "PARTIAL", false], ["AMBIGUOUS", "COMPLETE", false], ["AMBIGUOUS", "UNKNOWN", false],
    ["PROJECT_CHANGE", null, true], ["PROJECT_CHANGE", "PARTIAL", true], ["PROJECT_CHANGE", "COMPLETE", true], ["PROJECT_CHANGE", "UNKNOWN", true],
  ] as const)("%s / %s → producer and unchanged native agree: %s", async (classification, coverage, valid) => {
    const run = await setup(), raw = payloadFor(run, classification, coverage === null ? null : coverageFor(run, coverage)), before = stableStringify(raw);
    expect(validateWire(run, raw)).toBe(valid);
    if (valid) expect(() => acceptStudioAssessment(run.request, run.project, raw, NOW)).not.toThrow();
    else expect(() => acceptStudioAssessment(run.request, run.project, raw, NOW)).toThrow();
    expect(stableStringify(raw)).toBe(before); // No output rewriting, even on rejection.
  });
  it.each(["foreign", "global"])("PROJECT_CHANGE / %s object coverage rejected by producer AND native", async kind => {
    const run = await setup(), raw = payloadFor(run, "PROJECT_CHANGE", { coverage: "PARTIAL",
      projectVersionRefs: [kind === "global" ? run.project.versionId : "foreign-object:version:1"] });
    expect(validateWire(run, raw)).toBe(false);
    expect(() => acceptStudioAssessment(run.request, run.project, raw, NOW)).toThrow("STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID");
  });
  it("edit ambiguity is also discriminated; all provider objects are strict and required, root stays an object", async () => {
    const run = await setup(), packet = prepareStudioAssessmentRequest(run.request, run.project);
    expect(buildOpenAITerraConversationPayload(packet).text!.format).toMatchObject({ type: "json_schema", strict: true, schema: packet.outputSchema });
    const checkSubset = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const schema = node as Record<string, unknown>;
      for (const key of ["if", "then", "else", "allOf", "not", "oneOf", "dependentSchemas", "dependentRequired"]) expect(schema).not.toHaveProperty(key);
      if (schema.type === "object") {
        expect(schema.additionalProperties).toBe(false);
        expect(schema.required).toEqual(Object.keys(schema.properties as object));
      }
      Object.values(schema).forEach(value => Array.isArray(value) ? value.forEach(checkSubset) : checkSubset(value));
    };
    expect(packet.outputSchema).toMatchObject({ type: "object" }); expect(packet.outputSchema).not.toHaveProperty("anyOf");
    checkSubset(packet.outputSchema);
    for (const classification of ["DOCUMENT_ONLY", "PROJECT_CHANGE", "AMBIGUOUS"] as const) {
      const raw = payloadFor(run, classification);
      raw.edits[0].ambiguity = classification === "AMBIGUOUS" ? null : ambiguityFor(run);
      expect(validateWire(run, raw)).toBe(false);
      expect(() => acceptStudioAssessment(run.request, run.project, raw, NOW)).toThrow("STUDIO_ASSESSMENT_AMBIGUITY_INVALID");
    }
    expect(packet.instruction).toContain("Only PROJECT_CHANGE may have non-null projectCoverage");
    expect(packet.instruction).toContain("otherwise it must be null");
  });
  it("remaining semantic/cross-root constraints are native checks, NOT a schema guarantee", async () => {
    const run = await setup();
    const invalidGlobalAmbiguity = payloadFor(run); invalidGlobalAmbiguity.scientificStateAmbiguity = ambiguityFor(run);
    const duplicateCoverage = payloadFor(run, "PROJECT_CHANGE", coverageFor(run, "PARTIAL"));
    duplicateCoverage.edits[0].projectCoverage!.projectVersionRefs.push(duplicateCoverage.edits[0].projectCoverage!.projectVersionRefs[0]);
    const foreignProvenance = payloadFor(run); foreignProvenance.edits[0].provenanceRefs = ["foreign-origin"];
    for (const [raw, code] of [[invalidGlobalAmbiguity, "STUDIO_ASSESSMENT_AMBIGUITY_INVALID"],
      [duplicateCoverage, "STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID"], [foreignProvenance, "STUDIO_ASSESSMENT_PROVENANCE_INVALID"]] as const) {
      expect(validateWire(run, raw)).toBe(true);
      expect(() => acceptStudioAssessment(run.request, run.project, raw, NOW)).toThrow(code);
    }
  });
  it("J: scientific and material-ambiguity fixtures still route to existing owners, never Project reuse", async () => {
    const run = await setup(), before = stableStringify(run.project);
    const scientific = acceptStudioAssessment(run.request, run.project, payloadFor(run, "PROJECT_CHANGE"), NOW);
    expect(studioScientificRoute({ request: run.request, assessment: scientific }, run.project)).toMatchObject({ action: "EXISTING_SCIENTIFIC_PREPARATION_PATH", workingDraftRequired: true });
    const ambiguous = acceptStudioAssessment(run.request, run.project, payloadFor(run, "AMBIGUOUS"), NOW);
    expect(studioScientificRoute({ request: run.request, assessment: ambiguous }, run.project)).toMatchObject({ action: "EXISTING_QRY_PATH", workingDraftRequired: false });
    expect(stableStringify(run.project)).toBe(before);
  });
});

describe("real editorial shape / old 422 preserved / same intent → native DOC + archive", () => {
  it("I/K/L/M: explicit retry accepts corrected mock, retains V1/save/intent, no WD/adoption/QRY/DOC provider", async () => {
    const run = await setup();
    expect(run.project.revision).toBe(1); expect(run.revision.saveSequence).toBe(2);
    expect(run.request.delta).toHaveLength(61); expect(run.request.delta.filter(d => d.change === "UNCHANGED")).toHaveLength(60);
    const [edit] = run.request.delta.filter(d => d.change !== "UNCHANGED");
    expect(edit.nativeAnchor).toBe("documents/PROTOCOL_FULL/sections/0/paragraphs/0");
    expect(edit.afterText).toBe(edit.beforeText.replace("Ce protocole de travail concerne", "Ce protocole est une version de travail et il concerne"));
    const invalid = payloadFor(run, "DOCUMENT_ONLY", coverageFor(run, "PARTIAL")), valid = payloadFor(run);
    const oldEvidence = stableStringify(invalid), frozen = stableStringify(run.frozen), oldBody = stableStringify(run.body), project = stableStringify(run.project);
    // Historical 1.1 contract had this independent nullable field. It allowed
    // the real shape; the native owner rejected it before any downstream work.
    const nativeEdit = studioAssessmentPayloadSchema.shape.edits.element;
    const refs = JSON.parse(prepareStudioAssessmentRequest(run.request, run.project).context).assessmentContract.allowedProjectCoverageRefs as [string, ...string[]];
    const oldProducer = studioAssessmentPayloadSchema.extend({ edits: z.array(nativeEdit.extend({ projectCoverage:
      nativeEdit.shape.projectCoverage.unwrap().extend({ projectVersionRefs: z.array(z.enum(refs)).min(1) }).nullable() })) });
    expect(new Ajv().compile(z.toJSONSchema(oldProducer, { target: "draft-7", io: "input" }))(invalid)).toBe(true);
    expect(studioAssessmentPayloadSchema.safeParse(invalid).success).toBe(true); expect(validateWire(run, invalid)).toBe(false);
    const intent = await run.intents.create(run.access, run.frozen);
    let fail = true;
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_STUDIO", model: "fixture-model", status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(fail ? invalid : valid) }] }],
      usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } })));
    const observed: Awaited<ReturnType<typeof executeProtocolDesignerBridge>>[] = [];
    const assess = vi.fn(async () => {
      const outcome = await executeProtocolDesignerBridge({ body: { operation: "STUDIO_SCIENTIFIC_ASSESSMENT", apiVersion: "1.0.0",
        studioRequest: run.request, currentProject: run.project, finalizationIntentId: intent.finalizationIntentId,
        observabilityContext: { sessionId: run.session.sessionId, conversationId: null, turnId: null,
          clientRequestId: studioAssessmentOperationIdentity(run.request), testSessionId: null } },
        openAiApiKey: "OFFLINE", apiKey: null, fetchImpl, chatRuntime: "TERRA", autonomousProjectBuild: true });
      observed.push(outcome);
      if (outcome.status !== 200) throw new Error("OFFLINE_REJECTED_ASSESSMENT");
      return (outcome.body as { studioAssessment: ReturnType<typeof acceptStudioAssessment> }).studioAssessment;
    });
    const client: DocumentArchiveClient = {
      body: id => run.archive.body(run.access, id), history: before => run.archive.history(run.access, before, "DRCI"),
      receipt: id => run.archive.receipt(run.access, id), recover: vi.fn(), commit: vi.fn(),
      workingRevisions: { open: input => run.owner.open(run.access, input), create: input => run.owner.create(run.access, input),
        get: id => run.owner.get(run.access, id), getSave: input => run.owner.getSave(run.access, input),
        save: input => run.owner.save(run.access, input), abandon: input => run.owner.abandon(run.access, input) },
      finalizationIntents: {
        create: input => run.intents.create(run.access, input), get: id => run.intents.get(run.access, id),
        recoverActive: id => run.intents.recoverActive(run.access, id), recoverForSave: save => run.intents.recoverForSave(run.access, save),
        recoverForBase: (base, doc) => run.intents.recoverForBase(run.access, base, doc),
        waitForAssessment: (id, seq) => run.intents.waitForAssessment(run.access, id, seq),
        assess: (id, seq, result) => run.intents.assess(run.access, id, seq, result), readPreparation: vi.fn(),
        linkPreparation: vi.fn(), recordHumanDecision: vi.fn(), resolveAdoption: vi.fn(), retryDocuments: vi.fn(),
        prepareDocuments: (id, seq, source) => run.intents.prepareDocuments(run.access, id, seq, source),
        finalizeDocuments: id => run.intents.finalizeDocuments(run.access, id),
      },
    };
    const prepare = vi.fn(), adopt = vi.fn(), clarify = vi.fn(), generate = vi.fn(), committed = vi.fn();
    const runtime = createStudioFinalizationRuntime({ session: () => run.session, publish: vi.fn(), client: () => client,
      prepare, adopt, clarify, generate, committed, assess });
    await expect(runtime.run(run.revision, vi.fn())).rejects.toThrow("OFFLINE_REJECTED_ASSESSMENT");
    expect(observed[0]).toMatchObject({ status: 422, body: { error: { code: "STUDIO_SCIENTIFIC_ASSESSMENT_FAILED",
      diagnostic: { code: "STUDIO_ASSESSMENT_COVERAGE_INVALID" } } } });
    const waiting = await run.intents.get(run.access, intent.finalizationIntentId);
    expect(waiting.state).toBe("WAITING_FOR_SCIENTIFIC_ASSESSMENT"); expect(waiting.resolution.assessment).toBeNull();
    expect(await runtime.run(run.revision, vi.fn(), true)).toEqual(waiting); expect(fetchImpl).toHaveBeenCalledOnce();
    fail = false; // Only the next explicit action retries; reopening did not.
    const stages: string[] = [], completed = await runtime.run(run.revision, stage => stages.push(stage));
    expect(observed[1].status).toBe(200); expect(completed!.state).toBe("CLOSED");
    expect(completed!.finalizationIntentId).toBe(intent.finalizationIntentId); expect(stableStringify(completed!.frozen)).toBe(frozen);
    expect(completed!.resolution.documentReceipt!.generation.displayVersion).toBe(2);
    expect(completed!.resolution.resolvedProject).toEqual(intent.frozen.sourceProject);
    expect(stages).not.toContain("SCIENCE");
    for (const port of [prepare, adopt, clarify, generate]) expect(port).not.toHaveBeenCalled();
    expect((await run.archive.history(run.access, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([2, 1]);
    expect(stableStringify((await run.archive.body(run.access, run.ref.generationId)).body)).toBe(oldBody);
    expect(stableStringify(run.project)).toBe(project); expect(stableStringify(invalid)).toBe(oldEvidence);
    const exactSave = await run.owner.getSave(run.access, { revisionId: run.revision.revisionId, saveSequence: 2, contentDigest: run.revision.contentDigest });
    expect(exactSave.revision.content).toEqual(run.revision.content);
    const saved = await run.archive.body(run.access, completed!.resolution.documentReceipt!.generation.generationId);
    expect(saved.body.native.family).toBe("DRCI");
    if (saved.body.native.family === "DRCI") expect(saved.body.native.value.documents.find(d => d.kind === "PROTOCOL_FULL")!.sections[0].paragraphs[0]).toBe(edit.afterText);
    const count = run.fixture.rows().length;
    expect((await runtime.run(run.revision, vi.fn()))!.finalizationIntentId).toBe(intent.finalizationIntentId);
    expect(run.fixture.rows()).toHaveLength(count); expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(logicalDigest(completed!.frozen)).toBe(logicalDigest(run.frozen));
  });
});
