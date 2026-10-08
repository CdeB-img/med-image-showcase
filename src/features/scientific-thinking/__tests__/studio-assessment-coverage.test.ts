import { describe, expect, it, vi } from "vitest";
import { workingRevisionFixture } from "../../document-projection/__tests__/working-revision-fixture";
import { logicalDigest, stableStringify } from "../../knowledge-engine/canonical";
import { createFunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { freezeStudioFinalizationWork } from "../../protocol-designer/functional-reset/studio-finalization-lifecycle";
import { recordSpecializedOwnerResult } from "../../research-project-construction/specialized-owner-handoff";
import { studioAssessmentPayloadSchema, type StudioAssessmentPayload, type StudioReconciliationRequest } from "../../document-projection/studio-reconciliation-contract";
import { prepareStudioScientificHandoff, requireStudioScientificAssessment } from "../studio-contribution";
import { acceptStudioAssessment, prepareStudioAssessmentRequest, studioAssessmentCoverageRefs,
  studioAssessmentOperationIdentity, studioAssessmentResultRequestId, readStudioAssessmentFailureDiagnostic } from "../studio-runtime";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";
import { requestStudioScientificAssessment } from "../../protocol-designer/studio-scientific-client";
import * as bridge from "../../protocol-designer/product-bridge-client";
import { buildOpenAITerraConversationPayload } from "../../../../api/protocol-designer-openai-extraction-provider";

const NOW = "2026-10-08T12:00:00.000Z";
const setup = async () => {
  const run = await workingRevisionFixture({ monocentric: true });
  let { revision } = await run.owner.create(run.access2, run.createInput);
  const content = structuredClone(revision.content);
  content.title += " — modification humaine";
  content.sections[0].blocks[0].text += " — précision humaine";
  revision = (await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence, content })).revision;
  const session = { ...createFunctionalResetSession(NOW), sessionId: run.sessionId, projectId: run.project2.projectId, project: run.project2 };
  const frozen = await freezeStudioFinalizationWork({ session, revision, source: { ref: run.g2.ref, body: run.g2.body },
    projectionSource: await run.archive.body(run.access2, run.g2.projection.projectionId) });
  return { ...run, revision, frozen, request: frozen.scientificSources.request };
};
const payload = (request: StudioReconciliationRequest, refs: string[] | null): StudioAssessmentPayload => ({
  requestDigest: request.requestDigest, scientificStateDisposition: "NO_NET_CHANGE",
  scientificStateReason: "Sanitized shape replay; no private scientific text", scientificStateAmbiguity: null,
  edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({
    editRef: edit.editRef, classification: "PROJECT_CHANGE", reason: "Sanitized owner assertion",
    provenanceRefs: [edit.editRef], projectCoverage: refs === null ? null : { coverage: "PARTIAL", projectVersionRefs: refs }, ambiguity: null,
  })),
});
const receipt = (request: StudioReconciliationRequest, raw: StudioAssessmentPayload) => recordSpecializedOwnerResult({
  request: prepareStudioScientificHandoff(request), resultId: `studio-assessment:${logicalDigest(raw)}`, resultVersion: "1.0.0",
  completedAt: NOW, status: "COMPLETED", resultKind: "INFORMATIONAL_ONLY", nativePayloadType: "StudioScientificAssessment",
  nativePayloadVersion: "1.0.0", nativePayload: raw, provenance: ["STUDIO", request.requestId], humanDecisionRequired: true,
});
/** REAL_FAILURE_SHAPE_SANITIZED: two PROJECT_CHANGE/PARTIAL edits, NO_NET_CHANGE,
 * 23 native object versions and a global Project version wrongly used as
 * object coverage. Controlled native fixture content replaces private prose.
 * This is a structural replay, not a copy of the user's archived snapshot. */
const realFailureShape = (source: StudioReconciliationRequest) => {
  const snapshot = structuredClone(source.currentProject);
  // Controlled native objects preserve the recovered snapshot cardinality,
  // not the private real object contents/identities.
  for (let index = studioAssessmentCoverageRefs(source).length; index < 23; index++) {
    const stableId = `scientific-object:sanitized-${index}`;
    snapshot.objects.push({ ...snapshot.objects[0], stableId, versionRef: `${stableId}:version:1`, content: `Objet scientifique synthétique ${index}` });
  }
  const allowed = new Set([...snapshot.objects, ...snapshot.relations, ...snapshot.temporalQualifications,
    ...snapshot.expectedVariableOccasions].map(object => object.versionRef).sort().slice(0, 23));
  expect(allowed.size).toBe(23);
  const { snapshotDigest: _oldSnapshot, ...snapshotMaterial } = { ...snapshot,
    objects: snapshot.objects.filter(object => allowed.has(object.versionRef)),
    relations: snapshot.relations.filter(object => allowed.has(object.versionRef)),
    temporalQualifications: snapshot.temporalQualifications.filter(object => allowed.has(object.versionRef)),
    expectedVariableOccasions: snapshot.expectedVariableOccasions.filter(object => allowed.has(object.versionRef)),
  };
  const { requestId: _oldId, requestDigest: _oldDigest, ...material } = source;
  const next = { ...material, currentProject: { ...snapshotMaterial, snapshotDigest: logicalDigest(snapshotMaterial) } }, requestDigest = logicalDigest(next);
  return { ...next, requestId: `studio-reconciliation:${requestDigest}`, requestDigest };
};

describe("Studio assessment producer / native coverage / real failure shape", () => {
  it("real global Project version is schema-valid but rejected by unchanged native owner; valid 23-ref snapshot coverage passes", async () => {
    const run = await setup(), request = realFailureShape(run.request), refs = studioAssessmentCoverageRefs(request);
    expect(refs).toHaveLength(23); expect(refs).not.toContain(request.currentProject.sourceProjectVersion);
    const invalid = payload(request, [request.currentProject.sourceProjectVersion]), historic = receipt(request, invalid);
    expect(invalid.edits).toHaveLength(2); expect(studioAssessmentPayloadSchema.safeParse(invalid).success).toBe(true);
    const preserved = stableStringify(historic);
    expect(() => requireStudioScientificAssessment(request, historic)).toThrow("STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID");
    const corrected = receipt(request, payload(request, [refs[0], refs[1]]));
    expect(requireStudioScientificAssessment(request, corrected).payload.edits).toHaveLength(2);
    expect(stableStringify(historic)).toBe(preserved);
    expect(() => requireStudioScientificAssessment(request, historic)).toThrow("STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID");
  });
  it.each(["unknown", "foreign", "duplicate", "global"])("%s coverage retains native rejection; no downstream rewriting", async kind => {
    const run = await setup(), known = studioAssessmentCoverageRefs(run.request)[0];
    const refs = kind === "unknown" ? ["object-version:unknown"] : kind === "foreign" ? ["another-snapshot:object:version:1"]
      : kind === "duplicate" ? [known, known] : [run.request.currentProject.sourceProjectVersion];
    const raw = payload(run.request, refs), before = structuredClone(raw);
    expect(() => acceptStudioAssessment(run.request, run.project2, raw, NOW)).toThrow("STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID");
    expect(raw).toEqual(before);
  });
  it("non-null empty coverage is forbidden, null means no asserted coverage, COMPLETE still requires adopted known objects", async () => {
    const run = await setup();
    expect(studioAssessmentPayloadSchema.safeParse(payload(run.request, [])).success).toBe(false);
    expect(() => acceptStudioAssessment(run.request, run.project2, payload(run.request, []), NOW)).toThrow();
    expect(() => acceptStudioAssessment(run.request, run.project2, payload(run.request, null), NOW)).not.toThrow();
    const object = run.request.currentProject.objects.find(item => item.epistemicState === "KNOWN" && item.decisionRefs.length)!;
    const complete = payload(run.request, [object.versionRef]);
    complete.edits.forEach(edit => { edit.projectCoverage!.coverage = "COMPLETE"; });
    expect(() => acceptStudioAssessment(run.request, run.project2, complete, NOW)).not.toThrow();
  });
  it("producer exposes exactly the deterministic four native source sets; enum never advertises global version or generation", async () => {
    const run = await setup(), packet = prepareStudioAssessmentRequest(run.request, run.project2);
    const context = JSON.parse(packet.context), contract = context.assessmentContract;
    const expected = [...new Set([...run.request.currentProject.objects, ...run.request.currentProject.relations,
      ...run.request.currentProject.temporalQualifications, ...run.request.currentProject.expectedVariableOccasions].map(item => item.versionRef))].sort();
    expect(contract.allowedProjectCoverageRefs).toEqual(expected);
    expect(contract.version).toBe("1.1.0");
    expect(context.sourceProject.sourceProjectVersion).toBe(run.project2.versionId);
    const schema = JSON.parse(JSON.stringify(packet.outputSchema));
    expect(schema.properties.edits.items.properties.projectCoverage.anyOf[0].properties.projectVersionRefs.items.enum).toEqual(expected);
    expect(buildOpenAITerraConversationPayload(packet).text!.format.schema).toEqual(packet.outputSchema);
    expect(expected).not.toContain(run.project2.versionId); expect(expected).not.toContain(run.g2.ref.generationId);
    expect(packet.instruction).toContain("NEVER a scientific object coverage reference");
    expect(prepareStudioAssessmentRequest(run.request, run.project2)).toEqual(packet);
    expect(studioAssessmentOperationIdentity(run.request)).toBe(studioAssessmentOperationIdentity(structuredClone(run.request)));
  });
  it("coverage-set change versions operation identity deterministically; empty native set allows only null coverage", async () => {
    const run = await setup(), request = structuredClone(run.request);
    const identity = studioAssessmentOperationIdentity(request);
    const object = request.currentProject.objects[0]; object.versionRef += ":next";
    expect(studioAssessmentOperationIdentity(request)).not.toBe(identity);
    expect(studioAssessmentOperationIdentity(request)).toBe(studioAssessmentOperationIdentity(structuredClone(request)));
    const empty = { ...run.request, currentProject: { ...run.request.currentProject, objects: [], relations: [], temporalQualifications: [], expectedVariableOccasions: [] } };
    expect(studioAssessmentCoverageRefs(empty)).toEqual([]);
    expect(studioAssessmentOperationIdentity(empty)).not.toBe(identity);
  });
  it("bounded diagnostic identifies native failure without retaining response prose or identifiers", async () => {
    const run = await setup(), raw = payload(run.request, [run.project2.versionId]);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE", model: "fixture-model", status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(raw) }] }], usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } })));
    const result = await executeProtocolDesignerBridge({ body: { operation: "STUDIO_SCIENTIFIC_ASSESSMENT", apiVersion: "1.0.0",
      studioRequest: run.request, currentProject: run.project2, observabilityContext: { sessionId: run.sessionId, turnId: null, conversationId: null,
        clientRequestId: studioAssessmentOperationIdentity(run.request), testSessionId: null } },
      openAiApiKey: "OFFLINE", apiKey: null, fetchImpl, chatRuntime: "TERRA", autonomousProjectBuild: true });
    expect(result.status).toBe(422);
    const diagnostic = (result.body as { error: { diagnostic: unknown } }).error.diagnostic;
    expect(diagnostic).toEqual({ contract: "STUDIO_ASSESSMENT_FAILURE_V1", owner: "SCIENTIFIC_THINKING", function: "acceptStudioAssessment", code: "STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID" });
    expect(readStudioAssessmentFailureDiagnostic({ ...diagnostic as object, privateText: raw.edits[0].reason })).toEqual(diagnostic);
    expect(readStudioAssessmentFailureDiagnostic({ ...diagnostic as object, code: "Bearer secret" })).toBeNull();
  });
  it("client keeps bounded diagnostic separately from public feedback and uses canonical operation identity", async () => {
    const run = await setup();
    const snapshot = vi.spyOn(bridge, "ensureServerProjectSnapshot").mockResolvedValue({ ref: run.access2.project, proof: run.access2.proof! });
    const diagnostic = { contract: "STUDIO_ASSESSMENT_FAILURE_V1", owner: "SCIENTIFIC_THINKING", function: "acceptStudioAssessment", code: "STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID" };
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ apiVersion: "1.0.0", error: {
      code: "STUDIO_SCIENTIFIC_ASSESSMENT_FAILED", diagnostic: { ...diagnostic, privateText: "Do not retain" } } }), { status: 422 }));
    vi.stubGlobal("fetch", fetchImpl);
    try {
      await expect(requestStudioScientificAssessment(run.sessionId, run.project2, run.request, "studio-finalization-intent:existing"))
        .rejects.toMatchObject({ code: "STUDIO_SCIENTIFIC_ASSESSMENT_FAILED", studioAssessmentFailureDiagnostic: diagnostic });
      expect(JSON.parse(String(fetchImpl.mock.calls[0][1]!.body)).observabilityContext.clientRequestId).toBe(studioAssessmentOperationIdentity(run.request));
    } finally { snapshot.mockRestore(); vi.unstubAllGlobals(); }
  });
  it("same durable waiting intent retries corrected producer through real guard/HTTP owners, preserves old failed admission and creates no second intent", async () => {
    const run = await setup(), owner = run.archive.finalizationIntents!, guard = createMemoryProtocolDesignerGuardForTests();
    const initial = await owner.create(run.access2, run.frozen), waiting = await owner.waitForAssessment(run.access2, initial.finalizationIntentId, initial.sequence);
    const before = stableStringify(waiting.frozen), archiveBefore = structuredClone(run.fixture.rows()), headers = { "content-type": "application/json", origin: "https://noxia-imagerie.fr", host: "noxia-imagerie.fr",
      "x-forwarded-for": run.identity.clientAddress, "x-noxia-project-snapshot-proof": run.access2.proof! };
    const body = (clientRequestId: string) => ({ operation: "STUDIO_SCIENTIFIC_ASSESSMENT", apiVersion: "1.0.0", studioRequest: run.request,
      currentProject: run.project2, finalizationIntentId: waiting.finalizationIntentId,
      observabilityContext: { sessionId: run.sessionId, conversationId: null, turnId: null, clientRequestId, testSessionId: null } });
    const oldId = `studio-assessment:${run.request.requestDigest}`, oldBody = body(oldId);
    const oldAdmission = await guard.prepareRequest({ body: oldBody, headers });
    if (!("admitted" in oldAdmission) || !oldAdmission.admitted) throw new Error("OFFLINE_OLD_ADMISSION_NOT_ADMITTED");
    const oldFailure = { apiVersion: "1.0.0", error: { code: "STUDIO_SCIENTIFIC_ASSESSMENT_FAILED" } };
    await guard.completeRequest(oldAdmission, 422, oldFailure);
    const invalid = receipt(run.request, payload(run.request, [run.project2.versionId])), preserved = stableStringify(invalid);
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_CORRECTED", model: "gpt-6-sol", status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(payload(run.request, [studioAssessmentCoverageRefs(run.request)[0]])) }] }],
      usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } })));
    const clientRequestId = studioAssessmentOperationIdentity(run.request);
    expect(clientRequestId).not.toBe(oldId);
    let status = 0, response: unknown;
    await handleProtocolDesignerBridge({ method: "POST", headers, body: body(clientRequestId) }, {
      setHeader() {}, status(code) { status = code; return this; }, json(value) { response = value; },
    }, { NODE_ENV: "production", OPENAI_PROVIDER: "azure", AZURE_OPENAI_PROJECT_ENDPOINT: "https://fixture.services.ai.azure.com/api/projects/fixture",
      AZURE_OPENAI_API_KEY: "OFFLINE", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" },
    { fetchImpl, durableGuard: guard, projectSnapshotStore: run.snapshots, documentArchive: run.archive });
    expect(status, JSON.stringify(response)).toBe(200); expect(fetchImpl).toHaveBeenCalledTimes(1);
    const assessment = (response as { studioAssessment: ReturnType<typeof acceptStudioAssessment> }).studioAssessment;
    expect(studioAssessmentResultRequestId(run.request, assessment)).toBe(clientRequestId);
    const assessed = await executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_STUDIO_INTENT_ASSESS", sessionId: run.sessionId,
      projectRef: run.access2.project, intentId: waiting.finalizationIntentId, expectedSequence: waiting.sequence, assessment },
      proof: run.access2.proof, clientAddress: run.identity.clientAddress, connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots, guard });
    expect(assessed.status, JSON.stringify(assessed.body)).toBe(200);
    const resumed = await owner.get(run.access2, waiting.finalizationIntentId);
    expect(resumed.state).toBe("SCIENTIFIC_PREPARATION_REQUIRED"); expect(stableStringify(resumed.frozen)).toBe(before);
    expect(new Set(run.fixture.intents().map(row => JSON.parse(String(row.record_text)).finalizationIntentId))).toEqual(new Set([waiting.finalizationIntentId]));
    expect(await guard.prepareRequest({ body: oldBody, headers })).toEqual({ recovered: true, status: 422, body: oldFailure });
    expect(stableStringify(invalid)).toBe(preserved);
    expect(() => requireStudioScientificAssessment(run.request, invalid)).toThrow("STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID");
    const legacy = structuredClone(assessment); legacy.provenance = legacy.provenance.filter(ref => ref !== clientRequestId);
    expect(studioAssessmentResultRequestId(run.request, legacy)).toBe(oldId);
    const forged = structuredClone(assessment); forged.provenance = [...forged.provenance.filter(ref => ref !== clientRequestId), "studio-assessment:ke1-0000000000000000:ke1-0000000000000000"];
    expect(() => studioAssessmentResultRequestId(run.request, forged)).toThrow("STUDIO_ASSESSMENT_BINDING_INVALID");
    expect(run.fixture.rows()).toEqual(archiveBefore);
  });
});
