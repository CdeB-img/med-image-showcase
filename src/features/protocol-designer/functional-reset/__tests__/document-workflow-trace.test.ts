import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { workingRevisionFixture } from "../../../document-projection/__tests__/working-revision-fixture";
import { createFunctionalResetSession, type FunctionalResetSession } from "../session";
import { createScientificExecutionTraceLedger, createScientificTraceCaptureConfiguration, createProductTraceRunId,
  rehydrateScientificExecutionTraceLedger, listEndToEndTraceEvents } from "../../scientific-execution-trace";
import { buildTraceInspectorRunProjection } from "../../../validation-architecture/trace-structural-validation";
import { emitDocumentWorkflowTrace, observeDocumentWorkflow, recordDocumentWorkflowTrace, traceDocumentArchiveClient,
  type DocumentWorkflowTraceObservation, type DocumentWorkflowTraceSink } from "../document-workflow-trace";
import type { DocumentArchiveClient } from "../../../document-projection/generation-archive-client";
import { createStudioEditRuntime } from "../../studio-edit-client";
import * as bridge from "../../product-bridge-client";
import { createStudioEditRequest, studioEditOperationId } from "../../../document-projection/studio-edit-proposal";

const time = "2026-10-09T10:00:00.000Z";
const observation: DocumentWorkflowTraceObservation = { operationRef: "studio-finalization-intent:ke1-1234567890abcdef",
  component: "StudioFinalization.assess", owner: "SCIENTIFIC_THINKING", stage: "SCIENTIFIC_THINKING_RESULT", status: "COMPLETED" };
const diagnostic = createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "MANUAL_DIAGNOSTIC" });
let session: FunctionalResetSession;
beforeEach(async () => {
  const run = await workingRevisionFixture();
  session = { ...createFunctionalResetSession(time), sessionId: run.sessionId, projectId: run.project2.projectId,
    project: run.project2, scientificExecutionTraceLedger: createScientificExecutionTraceLedger(run.sessionId) };
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const sink: DocumentWorkflowTraceSink = value => { session = recordDocumentWorkflowTrace(session, value, diagnostic, time); };
const projection = () => buildTraceInspectorRunProjection({ ledger: session.scientificExecutionTraceLedger,
  traceRunId: createProductTraceRunId(session.sessionId, observation.operationRef) });

describe("existing TRACE V2: passive native DOC/Studio observation", () => {
  it("correlates one native intent across owners, retains separate Project/display/save axes and rehydrates after reload", () => {
    sink({ ...observation, identity: { finalizationIntentId: observation.operationRef, workingRevisionId: "document-working-revision:fixture",
      saveSequence: 4, contentDigest: "ke1-1234567890abcdef", logicalDocumentRef: "document:protocol", assessmentRef: "studio-assessment:fixture" } });
    sink({ ...observation, owner: "DOC", component: "StudioFinalization.finalizeDocuments", stage: "DOC_PROJECTION",
      identity: { finalizationIntentId: observation.operationRef, intentSequence: 8, intentStatus: "CLOSED", generationId: "document-generation:fixture",
        displayVersion: 3, generationProjectVersion: session.project!.versionId, generationProjectDigest: session.project!.projectDigest } });
    const before = projection();
    session = { ...session, scientificExecutionTraceLedger: rehydrateScientificExecutionTraceLedger(JSON.parse(JSON.stringify(session.scientificExecutionTraceLedger))) };
    expect(projection()).toEqual(before);
    expect(before.events.at(-1)!.technicalMetadata).toMatchObject({ displayVersion: 3, intentSequence: 8 });
    expect(before.projectVersion).toBe(session.project!.versionId);
    expect(before.events.map(event => event.responsibilityOwner)).toEqual(expect.arrayContaining(["DOC", "SCIENTIFIC_THINKING"]));
    expect(session.scientificExecutionTraceLedger.events.some(event => event.eventType === "USER_TURN_RECEIVED")).toBe(false);
  });
  it("does not fabricate a scientific binding when Project is absent", () => {
    const missing = { ...session, project: null };
    expect(recordDocumentWorkflowTrace(missing, observation)).toBe(missing);
  });
  it("retains the first native causal diagnostic, not a later generic UI error", () => {
    sink({ ...observation, status: "FAILED", error: { code: "STUDIO_ASSESSMENT_FAILED", studioAssessmentFailureDiagnostic: {
      contract: "STUDIO_ASSESSMENT_FAILURE_V1", owner: "SCIENTIFIC_THINKING", function: "acceptStudioAssessment", code: "STUDIO_ASSESSMENT_COVERAGE_INVALID" } } });
    sink({ ...observation, owner: "UI", component: "DocumentStudio.finalize", status: "FAILED", error: new Error("La création a échoué.") });
    expect(projection().firstFailure).toMatchObject({ stage: "SCIENTIFIC_THINKING_RESULT", owner: "SCIENTIFIC_THINKING",
      function: "acceptStudioAssessment", internalCode: "STUDIO_ASSESSMENT_COVERAGE_INVALID", attribution: "ROOT_CAUSE_PROVEN" });
  });
  it.each([
    ["PAYLOAD_TOO_LARGE", "StudioFinalization.prepare", "SCIENTIFIC_THINKING", "CLIENT_PREPARATION_START"],
    ["STUDIO_INTENT_PREPARATION_DIVERGENCE", "restoreStudioIntentPreparation", "SCIENTIFIC_THINKING", "CLIENT_PREPARATION_START"],
    ["STUDIO_INTENT_HUMAN_DECISION_NOT_READY", "prepareStudioIntentHumanDecision", "RESEARCH_PROJECT", "HUMAN_DECISION_RECORDED"],
    ["DOC_REVISION_SOURCE_DIGEST_MISMATCH", "DocumentWorkingRevision.get", "DOC", "DURABLE_RECOVERY_COMPLETED"],
    ["DOC_REVISION_CONFLICT", "DocumentWorkingRevision.save", "DOC", "DOC_PROJECTION"],
    ["STUDIO_EDIT_RESPONSE_BINDING_INVALID", "acceptStudioEditProposal", "DOC", "DOC_PROJECTION"],
    ["PROVIDER_OPERATION_FAILED", "requestProtocolDesignerBridge.STUDIO_DOC", "DOC", "DOC_PROJECTION"],
    ["DOC_ARCHIVE_WRITE_FAILED", "StudioFinalization.finalizeDocuments", "DOC", "DOC_PROJECTION"],
    ["PROJECT_SNAPSHOT_ACCESS_DENIED", "DocumentArchive.history", "DOC", "DURABLE_RECOVERY_COMPLETED"],
  ] as const)("preserves native %s and observed boundary without inventing a deeper root cause", async (code, component, owner, stage) => {
    const error = Object.assign(new Error("Texte scientifique privé à ne pas capturer"), { code });
    const execute = vi.fn(async () => { throw error; });
    await expect(observeDocumentWorkflow(sink, { ...observation, component, owner, stage }, execute)).rejects.toBe(error);
    expect(execute).toHaveBeenCalledOnce();
    expect(projection().firstFailure).toMatchObject({ stage, owner, function: component, internalCode: code, attribution: "SYMPTOM_ONLY" });
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain(error.message);
  });
  it("captures CORE outcomes only; DIAGNOSTIC transitions; never activates FORENSIC by default", () => {
    const baseline = session;
    const started = { ...observation, status: "STARTED" as const };
    expect(recordDocumentWorkflowTrace(baseline, started)).toBe(baseline);
    const core = recordDocumentWorkflowTrace(baseline, observation);
    const verbose = recordDocumentWorkflowTrace(core, started, diagnostic);
    expect(verbose.scientificExecutionTraceLedger.events.length).toBe(core.scientificExecutionTraceLedger.events.length + 1);
    expect(listEndToEndTraceEvents({ ledger: core.scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(core.sessionId, observation.operationRef) }).every(event => event.forensicPayload == null)).toBe(true);
  });
  it("deduplicates only repeated read-only projection snapshots, not separate explicit executions", () => {
    const pure = { ...observation, deduplicate: true };
    sink(pure); const before = session;
    sink(pure); expect(session).toBe(before);
    sink(observation); expect(session.scientificExecutionTraceLedger.events.length).toBe(before.scientificExecutionTraceLedger.events.length + 1);
  });
  it("does not leak bodies, instruction, patient values, provider payload, transcript or credentials", () => {
    sink({ ...observation, identity: { contentDigest: "ke1-1234567890abcdef", workingRevisionId: "document-working-revision:fixture",
      instruction: "PRIVATE_INSTRUCTION", native_body_text: "PRIVATE_BODY", proof: "SECRET_PROOF", patient: "PRIVATE_PATIENT" } as never,
      error: { message: "PRIVATE_MESSAGE", stack: "PRIVATE_STACK", providerResponse: "PRIVATE_RESPONSE" } });
    const ledger = JSON.stringify(session.scientificExecutionTraceLedger);
    for (const secret of ["PRIVATE_INSTRUCTION", "PRIVATE_BODY", "SECRET_PROOF", "PRIVATE_PATIENT", "PRIVATE_MESSAGE", "PRIVATE_STACK", "PRIVATE_RESPONSE"])
      expect(ledger).not.toContain(secret);
  });
  it("has bounded per-event projection and leaves all scientific/documentary state unchanged", () => {
    const before = session;
    sink(observation);
    const { scientificExecutionTraceLedger: _before, ...oldBusiness } = before;
    const { scientificExecutionTraceLedger: _after, ...newBusiness } = session;
    expect(newBusiness).toEqual(oldBusiness);
    expect(new TextEncoder().encode(JSON.stringify(session.scientificExecutionTraceLedger.events.at(-1)!.technicalMetadata)).byteLength).toBeLessThan(1000);
  });
  it("does not mistake an uppercase private error message for a native technical code", () => {
    sink({ ...observation, status: "FAILED", error: new Error("PATIENT_HIV_POSITIVE") });
    expect(projection().firstFailure?.internalCode).toBe("UNKNOWN");
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain("PATIENT_HIV_POSITIVE");
  });
  it("reuses bounded provider failure evidence including a physical operation key when present", () => {
    const key = "a".repeat(64);
    sink({ ...observation, status: "FAILED", error: { code: "PUBLIC_OPERATION_FAILED", providerFailureDiagnostic: {
      contract: "DURABLE_PROVIDER_TERMINAL_FAILURE", operationKey: key, phase: "HEADERS_RECEIVED",
      dispatchAttempted: true, providerHttpStatus: 500, providerResponseStatus: "failed", structuredErrorCode: "PROVIDER_HTTP_FAILED",
      lastConfirmedDurableState: "PROVIDER_HTTP_FAILED", rawResponse: "PRIVATE_PROVIDER_RESPONSE" } } });
    expect(projection().firstFailure?.internalCode).toBe("PROVIDER_HTTP_FAILED");
    expect(projection().events.at(-1)!.technicalMetadata).toMatchObject({ providerOperationId: key, providerHttpStatus: 500, dispatchAttempted: true });
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain("PRIVATE_PROVIDER_RESPONSE");
  });
  it("input projection failure cannot execute a native client operation twice", async () => {
    const failure = new Error("DOC_REVISION_INVALID"), execute = vi.fn(async () => { throw failure; });
    const client = traceDocumentArchiveClient({ workingRevisions: { save: execute } } as unknown as DocumentArchiveClient, session.projectId, sink);
    const input = Object.defineProperty({}, "revisionId", { get() { throw new Error("PROJECTION_FAILURE"); } });
    await expect(client.workingRevisions!.save(input as never)).rejects.toBe(failure);
    expect(execute).toHaveBeenCalledOnce();
  });
  it("distinguishes revision-based intent lookup from native intent and archive request identities", async () => {
    const capture = vi.fn<DocumentWorkflowTraceSink>();
    const revisionId = "document-working-revision:lookup", intentId = "studio-finalization-intent:lookup", requestId = "document-request:lookup";
    const native = { finalizationIntents: { recoverActive: vi.fn(async () => ({ finalizationIntentId: intentId })),
      recoverForBase: vi.fn(async () => null) },
      recover: vi.fn(async () => ({ state: "IN_PROGRESS" })) } as unknown as DocumentArchiveClient;
    const client = traceDocumentArchiveClient(native, session.projectId, capture);
    await client.finalizationIntents!.recoverActive(revisionId);
    const started = capture.mock.calls[0][0], completed = capture.mock.calls[1][0];
    expect(started.operationRef).toBe(revisionId);
    expect(started.identity?.workingRevisionId).toBe(revisionId);
    expect(started.identity?.finalizationIntentId).toBeUndefined();
    expect(completed.operationRef).toBe(intentId);
    expect(completed.identity?.finalizationIntentId).toBe(intentId);
    await client.finalizationIntents!.recoverForBase("document-generation:lookup", "PROTOCOL");
    expect(capture.mock.calls[2][0].identity?.generationId).toBe("document-generation:lookup");
    expect(capture.mock.calls[2][0].identity?.finalizationIntentId).toBeUndefined();
    await client.recover({ requestId } as never);
    expect(capture.mock.calls.at(-1)![0].operationRef).toBe(requestId);
    expect(capture.mock.calls.at(-1)![0].identity?.recoveryState).toBe("IN_PROGRESS");
    expect(capture.mock.calls.at(-1)![0].identity?.intentStatus).toBeUndefined();
    expect(native.recover).toHaveBeenCalledOnce();
  });
  it("trace sink failure, metadata projection failure and absence are observationally equivalent", async () => {
    const value = { content: "NATIVE_UNCHANGED" }, failure = () => { throw new Error("TRACE_UNAVAILABLE"); };
    const execute = vi.fn(async () => value);
    expect(await observeDocumentWorkflow(undefined, observation, execute)).toBe(value);
    expect(await observeDocumentWorkflow(failure, observation, execute)).toBe(value);
    expect(await observeDocumentWorkflow(sink, observation, execute, failure)).toBe(value);
    expect(execute).toHaveBeenCalledTimes(3);
    expect(() => emitDocumentWorkflowTrace(failure, observation)).not.toThrow();
  });
  it("a malformed failure diagnostic cannot replace the exact native error", async () => {
    const native = Object.defineProperty(new Error("PRIVATE_NATIVE_ERROR"), "observability", { get() { throw new Error("TRACE_ACCESSOR_FAILURE"); } });
    const execute = vi.fn(async () => { throw native; });
    await expect(observeDocumentWorkflow(sink, observation, execute)).rejects.toBe(native);
    expect(execute).toHaveBeenCalledOnce();
    expect(projection().firstFailure?.internalCode).toBe("UNKNOWN");
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain("PRIVATE_NATIVE_ERROR");
  });
  it("normal provider-required coordination is not misreported as the first failure", async () => {
    const error = new Error("STUDIO_DOCUMENT_PROVIDER_REQUIRED");
    await expect(observeDocumentWorkflow(sink, observation, async () => { throw error; })).rejects.toBe(error);
    expect(projection().firstFailure).toBeNull();
    expect(projection().events.at(-1)!.status).toBe("BLOCKED");
  });
  it("wrapped validated native revision client preserves create/save/reload/concurrency and immutable archive", async () => {
    const run = await workingRevisionFixture(), source = JSON.stringify(run.fixture.bodies()), project = JSON.stringify(run.project2);
    const native = { workingRevisions: {
      create: vi.fn(input => run.owner.create(run.access2, input)), get: vi.fn(id => run.owner.get(run.access2, id)),
      save: vi.fn(input => run.owner.save(run.access2, input)),
    } } as unknown as DocumentArchiveClient;
    expect(traceDocumentArchiveClient(native, run.project2.projectId, undefined)).toBe(native);
    const client = traceDocumentArchiveClient(native, run.project2.projectId, sink).workingRevisions!;
    const created = await client.create(run.createInput), content = structuredClone(created.revision.content);
    content.title = "Private documentary edit";
    const saved = await client.save({ revisionId: created.revision.revisionId, expectedSaveSequence: 1, content });
    expect((await client.get(saved.revision.revisionId)).revision).toEqual(saved.revision);
    await expect(client.save({ revisionId: created.revision.revisionId, expectedSaveSequence: 1, content })).rejects.toThrow();
    expect(native.workingRevisions!.save).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(run.fixture.bodies())).toBe(source); expect(JSON.stringify(run.project2)).toBe(project);
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain(content.title);
    expect(session.scientificExecutionTraceLedger.events.some(event => event.technicalMetadata.saveSequence === 2)).toBe(true);
  });
  it("actual conversational edit boundary dispatches once, proposal remains UNASSESSED, trace-off and trace-on return exact same proposal", async () => {
    const run = await workingRevisionFixture();
    const revision = (await run.owner.create(run.access2, run.createInput)).revision;
    const nodeId = revision.content.sections[0].blocks[0].nodeId, instruction = "PRIVATE_USER_INSTRUCTION";
    vi.spyOn(bridge, "ensureServerProjectSnapshot").mockResolvedValue({ ref: run.access2.project, proof: run.access2.proof! });
    const request = createStudioEditRequest(revision, { projectId: run.project2.projectId, projectVersion: run.project2.versionId, projectDigest: run.project2.projectDigest }, nodeId, instruction);
    const transport = vi.fn(async () => new Response(JSON.stringify({ apiVersion: "1.0.0", editProposal: { requestDigest: request.requestDigest, proposedText: "PRIVATE_PROPOSED_TEXT" } })));
    vi.stubGlobal("fetch", transport);
    const source = () => ({ sessionId: run.sessionId, project: run.project2 });
    const off = await createStudioEditRuntime(source).propose(revision, nodeId, instruction);
    const on = await createStudioEditRuntime(source, sink).propose(revision, nodeId, instruction);
    expect(on).toEqual(off); expect(on.semanticImpact).toBe("UNASSESSED"); expect(transport).toHaveBeenCalledTimes(2);
    expect(session.scientificExecutionTraceLedger.runBindings.some(binding => binding.runId === createProductTraceRunId(run.sessionId, studioEditOperationId(request)))).toBe(true);
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain(instruction);
    expect(JSON.stringify(session.scientificExecutionTraceLedger)).not.toContain(on.proposedText);
  });
  it("Studio edit transport preserves exact native first failure and sanitized durable evidence, never redispatches or captures private diagnostics", async () => {
    const run = await workingRevisionFixture(), revision = (await run.owner.create(run.access2, run.createInput)).revision;
    vi.spyOn(bridge, "ensureServerProjectSnapshot").mockResolvedValue({ ref: run.access2.project, proof: run.access2.proof! });
    const transport = vi.fn(async () => new Response(JSON.stringify({ apiVersion: "1.0.0", error: {
      code: "STUDIO_EDIT_SOURCE_INVALID", diagnostic: { contract: "STUDIO_EDIT_FAILURE_V1", owner: "DOC",
        function: "resolveSavedStudioEditSource", code: "DOC_REVISION_SOURCE_DIGEST_MISMATCH", privateBody: "PRIVATE_BODY" } },
      observability: { providerCalls: [{ durableFailure: { contract: "DURABLE_PROVIDER_TERMINAL_FAILURE", operationKey: "a".repeat(64),
        structuredErrorCode: "PROVIDER_HTTP_FAILED", dispatchAttempted: true, providerHttpStatus: 500,
        providerResponseStatus: "failed", lastConfirmedDurableState: "PROVIDER_HTTP_FAILED", rawResponse: "PRIVATE_PROVIDER_BODY" },
        privateBody: "PRIVATE_CALL_BODY" }] } }), { status: 422 }));
    vi.stubGlobal("fetch", transport);
    const request = createStudioEditRequest(revision, { projectId: run.project2.projectId, projectVersion: run.project2.versionId,
      projectDigest: run.project2.projectDigest }, revision.content.sections[0].blocks[0].nodeId, "PRIVATE_INSTRUCTION");
    const before = run.fixture.revisions(), archive = run.fixture.bodies();
    const error = await createStudioEditRuntime(() => ({ sessionId: run.sessionId, project: run.project2 }), sink)
      .propose(revision, request.binding.nodeId, request.instruction).catch(error => error);
    expect(transport).toHaveBeenCalledOnce();
    expect(error.code).toBe("STUDIO_EDIT_SOURCE_INVALID");
    const trace = buildTraceInspectorRunProjection({ ledger: session.scientificExecutionTraceLedger,
      traceRunId: createProductTraceRunId(run.sessionId, studioEditOperationId(request)) });
    expect(trace.firstFailure).toMatchObject({ owner: "DOC", function: "resolveSavedStudioEditSource",
      internalCode: "DOC_REVISION_SOURCE_DIGEST_MISMATCH", attribution: "ROOT_CAUSE_PROVEN" });
    expect(trace.events.at(-1)!.technicalMetadata.providerOperationId).toBe("a".repeat(64));
    for (const secret of ["PRIVATE_BODY", "PRIVATE_PROVIDER_BODY", "PRIVATE_CALL_BODY", "PRIVATE_INSTRUCTION"])
      expect(JSON.stringify({ error, trace })).not.toContain(secret);
    expect(run.fixture.revisions()).toEqual(before); expect(run.fixture.bodies()).toEqual(archive);
  });
  it("unknown Studio edit provider failure stays an observed boundary, while durable native failure code is retained", () => {
    sink({ ...observation, status: "FAILED", error: { code: "STUDIO_EDIT_FAILED", studioEditFailureDiagnostic: {
      contract: "STUDIO_EDIT_FAILURE_V1", owner: "DOC", function: "executeOpenAITerraConversation", code: "STUDIO_EDIT_FAILED" },
      providerFailureDiagnostic: { contract: "DURABLE_PROVIDER_TERMINAL_FAILURE", structuredErrorCode: "PROVIDER_HTTP_FAILED" } } });
    expect(projection().firstFailure).toMatchObject({ owner: "DOC", function: "executeOpenAITerraConversation",
      internalCode: "PROVIDER_HTTP_FAILED", attribution: "SYMPTOM_ONLY" });
  });
});
