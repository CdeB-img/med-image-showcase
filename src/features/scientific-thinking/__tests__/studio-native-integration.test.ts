import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { verifySavedStudioScientificSource } from "../../../../server/protocol-designer-studio-scientific";
import { confirmResearchProjectContribution } from "../../research-project-construction/contribution-owner-boundary";
import { workingRevisionFixture } from "../../document-projection/__tests__/working-revision-fixture";
import { createStudioReconciliationRequest, assertStudioReconciliationCurrent } from "../../document-projection/studio-reconciliation";
import type { StudioAssessmentPayload } from "../../document-projection/studio-reconciliation-contract";
import { prepareStudioScientificHandoff, requireStudioScientificAssessment } from "../studio-contribution";
import { acceptStudioAssessment, studioScientificRoute, prepareStudioAssessmentRequest, studioAssessmentOperationIdentity } from "../studio-runtime";
import { createFunctionalResetSession, loadFunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { captureStudioProjectPreparation, addProjectPreparation, consumeProjectPreparation,
  preparationCheckpointValid } from "../../protocol-designer/functional-reset/project-preparation-lifecycle";
import { prepareWorkingDraftRequest, validatePreparedWorkingReview } from "../../protocol-designer/functional-reset/continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "../../protocol-designer/functional-reset/__tests__/study-proposal-fixtures";
import { createProductKnowledgeOwnerLedger } from "../../protocol-designer/product-knowledge-owner-runtime";
import { createProductValidationRunLedger } from "../../protocol-designer/product-validation-run-ledger";
import { createScientificExecutionTraceLedger } from "../../protocol-designer/scientific-execution-trace";
import { captureStudioScientificState } from "../../protocol-designer/functional-reset/studio-scientific-context";

// Controlled native owner output qualifies contracts/lifecycle, not a free-text
// classifier, clinical acceptability or real provider competence. No live I/O.
const NOW = "2026-10-07T12:00:00.000Z";
const setup = async (change = "scientific", pending = false) => {
  const run = await workingRevisionFixture({ monocentric: true });
  let { revision } = await run.owner.create(run.access2, run.createInput);
  if (change !== "none") {
    const content = structuredClone(revision.content);
    if (change === "scientific" || change === "mixed") content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("monocentrique", "multicentrique");
    else if (change === "private") content.title += " contact patient@example.test";
    else content.title += " — formulation éditoriale";
    if (change === "mixed") content.title += " — rédaction améliorée";
    revision = (await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence, content })).revision;
  }
  const source = { ref: run.g2.ref, body: run.g2.body };
  const projectionSource = await run.archive.body(run.access2, run.g2.projection.projectionId);
  const fresh = createFunctionalResetSession(NOW);
  const session = { ...fresh, sessionId: run.sessionId, projectId: run.project2.projectId,
    knowledgeOwnerLedger: createProductKnowledgeOwnerLedger(run.sessionId),
    validationRunLedger: createProductValidationRunLedger(run.sessionId),
    scientificExecutionTraceLedger: createScientificExecutionTraceLedger(run.sessionId),
    documentArchive: { ...fresh.documentArchive!, projectId: run.project2.projectId },
    project: run.project2, conversationId: "native-studio-qualification", runtimeTurns: pending
      ? [{ turnId: "turn:real-pending", role: "USER" as const, content: "Ajouter un suivi de sécurité", createdAt: NOW }] : [] };
  const scientificState = captureStudioScientificState(session);
  const request = await createStudioReconciliationRequest({ revision, source, projectionSource, currentProject: run.project2, scientificState });
  return { ...run, revision, request, scientificState, session };
};
const payloadFor = (run: Awaited<ReturnType<typeof setup>>, classification: StudioAssessmentPayload["edits"][number]["classification"] = "PROJECT_CHANGE") => ({
  requestDigest: run.request.requestDigest, scientificStateDisposition: run.scientificState.pendingTurnRef ? "PENDING_HUMAN_CONFIRMATION" : "NO_NET_CHANGE",
  scientificStateReason: "Exact controlled governed state assessment", scientificStateAmbiguity: null,
  edits: run.request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef, classification,
    reason: "Controlled Scientific Thinking result", provenanceRefs: [edit.editRef], projectCoverage: null,
    ambiguity: classification === "AMBIGUOUS" ? { question: "Remplacer le site unique ou ajouter un centre pour un sous-groupe ?",
      materialProjectRefs: [run.request.currentProject.objects[0].versionRef], alternatives: [
        { interpretation: "Toute la population", consequence: "Plusieurs centres pour tous les participants" },
        { interpretation: "Sous-groupe", consequence: "Un centre supplémentaire pour une partie des participants" }] } : null })) }) satisfies StudioAssessmentPayload;
const assessmentFor = (run: Awaited<ReturnType<typeof setup>>, payload = payloadFor(run)) =>
  acceptStudioAssessment(run.request, run.project2, payload, NOW);
const nativeBody = (run: Awaited<ReturnType<typeof setup>>) => ({ apiVersion: "1.0.0", operation: "STUDIO_SCIENTIFIC_ASSESSMENT",
  studioRequest: run.request, currentProject: run.project2,
  observabilityContext: { sessionId: run.sessionId, conversationId: null, turnId: null,
    clientRequestId: studioAssessmentOperationIdentity(run.request), testSessionId: null } });
const provider = (value: unknown, model = "fixture-model") => vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_NATIVE_STUDIO",
  model, status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(value) }] }],
  usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } })));
const runtime = (body: unknown, fetchImpl: typeof fetch) => executeProtocolDesignerBridge({ body,
  openAiApiKey: "OFFLINE", apiKey: null, fetchImpl, chatRuntime: "TERRA", autonomousProjectBuild: true, now: () => Date.parse(NOW) });

describe("native Studio → Scientific Thinking → existing governed preparation", () => {
  it("A: exact no-op never dispatches ST or Working Draft", async () => {
    const run = await setup("none"), fetchImpl = provider({});
    const result = await runtime(nativeBody(run), fetchImpl);
    expect(result.status).toBe(200); expect(fetchImpl).not.toHaveBeenCalled();
    const assessment = (result.body as { studioAssessment: ReturnType<typeof assessmentFor> }).studioAssessment;
    expect(captureStudioProjectPreparation(run.session, { request: run.request, assessment }, run.revision).action).toBe("PROJECT_REUSE");
  });
  it("B/C: real runtime producer admits editorial/scientific fixtures without Project mutation or fake turns", async () => {
    for (const classification of ["DOCUMENT_ONLY", "PROJECT_CHANGE"] as const) {
      const run = await setup(classification === "DOCUMENT_ONLY" ? "editorial" : "scientific"), before = JSON.stringify(run.project2);
      const fetchImpl = provider(payloadFor(run, classification)), result = await runtime(nativeBody(run), fetchImpl);
      expect(result.status).toBe(200); expect(fetchImpl).toHaveBeenCalledTimes(1);
      const assessment = (result.body as { studioAssessment: ReturnType<typeof assessmentFor> }).studioAssessment;
      const routed = captureStudioProjectPreparation(run.session, { request: run.request, assessment }, run.revision);
      expect(routed.action).toBe(classification === "DOCUMENT_ONLY" ? "PROJECT_REUSE" : "WORKING_DRAFT_REQUIRED");
      expect(JSON.stringify(run.project2)).toBe(before); expect(run.session.runtimeTurns).toEqual([]);
      const handoff = prepareStudioScientificHandoff(run.request);
      expect(handoff.contract).toBe("PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF");
      expect(handoff.nativeInput).toMatchObject({ origin: "STUDIO", workingRevisionId: run.revision.revisionId,
        saveSequence: run.revision.saveSequence, contentDigest: run.revision.contentDigest });
      expect(handoff.nativeInput).not.toHaveProperty("conversation");
      expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)).text.format.strict).toBe(true);
    }
  });
  it("D: ambiguity routes existing QRY and never prepares/adopts", async () => {
    const run = await setup(), source = { request: run.request, assessment: assessmentFor(run, payloadFor(run, "AMBIGUOUS")) };
    expect(studioScientificRoute(source, run.project2)).toMatchObject({ action: "EXISTING_QRY_PATH", workingDraftRequired: false });
    expect(captureStudioProjectPreparation(run.session, source, run.revision).preparation).toBeNull();
  });
  it("native source retains the existing privacy gate without logging user prose", async () => {
    const run = await setup("private"), fetchImpl = provider(payloadFor(run));
    const result = await runtime(nativeBody(run), fetchImpl);
    expect(result).toMatchObject({ status: 422, body: { error: { code: "LOCAL_SAFETY_BLOCKED" } } });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(JSON.stringify(result.body)).not.toContain("patient@example.test");
    const source = { request: run.request, assessment: assessmentFor(run) };
    const capture = captureStudioProjectPreparation(run.session, source, run.revision);
    const preparation = await runtime(capture.preparation!.checkpoint!.request, fetchImpl);
    expect(preparation).toMatchObject({ status: 422, body: { error: { code: "LOCAL_SAFETY_BLOCKED" } } });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("E/F/G: deterministic identity, stale save/content/Project fail closed", async () => {
    const run = await setup(), a = assessmentFor(run), b = assessmentFor(run);
    expect(a).toEqual(b);
    expect(acceptStudioAssessment(run.request, run.project2, payloadFor(run), "2026-10-08T12:00:00.000Z").resultId).toBe(a.resultId);
    for (const key of ["workingRevisionSaveSequence", "workingRevisionContentDigest"] as const) {
      const changed = { ...run.request, [key]: key === "workingRevisionSaveSequence" ? 99 : "different" };
      expect(() => acceptStudioAssessment(changed, run.project2, payloadFor(run), NOW)).toThrow();
    }
    expect(() => acceptStudioAssessment(run.request, run.project3, payloadFor(run), NOW)).toThrow();
    const content = structuredClone(run.revision.content); content.title += " later";
    const later = (await run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: run.revision.saveSequence, content })).revision;
    expect(() => assertStudioReconciliationCurrent(run.request, later, run.project2, run.scientificState)).toThrow("STUDIO_RECONCILIATION_STALE");
    expect(() => captureStudioProjectPreparation(run.session, { request: run.request, assessment: a }, later)).toThrow("STUDIO_RECONCILIATION_STALE");
    await expect(verifySavedStudioScientificSource(run.archive, run.access2, run.project2, run.request)).rejects.toThrow("STUDIO_RECONCILIATION_STALE");
    const changedRequest = await createStudioReconciliationRequest({ revision: later, source: { ref: run.g2.ref, body: run.g2.body },
      projectionSource: await run.archive.body(run.access2, run.g2.projection.projectionId), currentProject: run.project2, scientificState: run.scientificState });
    expect(() => requireStudioScientificAssessment(changedRequest, a)).toThrow("STUDIO_ASSESSMENT_BINDING_INVALID");
    const advanced = { ...run.session, runtimeTurns: [{ turnId: "turn:arrived-after-assessment", role: "USER" as const,
      content: "Ajouter une visite de sécurité après le traitement", createdAt: NOW }] };
    expect(() => captureStudioProjectPreparation(advanced, { request: run.request, assessment: a }, run.revision))
      .toThrow("STUDIO_SCIENTIFIC_STATE_STALE");
  });
  it("H/K/L: native source executes existing Working Draft, native review and exact checkpoint reuse", async () => {
    const run = await setup(), before = JSON.stringify(run.project2), source = { request: run.request, assessment: assessmentFor(run) };
    const routed = captureStudioProjectPreparation(run.session, source, run.revision), preparation = routed.preparation!;
    expect(routed.action).toBe("WORKING_DRAFT_REQUIRED");
    expect(preparationCheckpointValid(run.session, preparation.checkpoint!)).toBe(true);
    const packet = prepareWorkingDraftRequest(preparation.checkpoint!.request);
    expect(JSON.parse(packet.context).RECENT_CONVERSATION).toEqual([]);
    expect(JSON.parse(packet.context).NATIVE_STUDIO_SOURCE.origin).toBe("STUDIO");
    const domain = { ...DOMAINS[1], question: "Évaluer la colchicine versus placebo après infarctus", population: "Adultes après infarctus",
      design: "Essai multicentrique randomisé colchicine versus placebo", outcome: "Critère de recherche après infarctus", exposure: "Colchicine versus placebo" };
    const proposal = controlledStudyProposal(preparation.checkpoint!.inputDigest, domain as typeof DOMAINS[1]);
    const designTarget = source.request.currentProject.objects.find(object => object.content === "étude monocentrique")!;
    proposal.atoms.find(atom => atom.ref === "design")!.userChangeRefs = [designTarget.versionRef];
    const fetchImpl = provider({ requestType: "STUDY_UPDATE", proposal, explicitDecisions: [],
      explicitStudioDecisions: [{ atomRef: "design", editRef: source.request.delta.find(e => e.change !== "UNCHANGED")!.editRef,
        quote: source.request.delta.find(e => e.change !== "UNCHANGED")!.afterText }], inferredAtomRefs: [], rejectedAtomRefs: [] });
    const result = await runtime(preparation.checkpoint!.request, fetchImpl);
    expect(result.status, JSON.stringify(result.body)).toBe(200);
    expect(result.body).not.toHaveProperty("assistantTurn"); expect(fetchImpl).toHaveBeenCalledTimes(1);
    const response = result.body as Parameters<typeof consumeProjectPreparation>[2];
    const ready = consumeProjectPreparation(addProjectPreparation(run.session, preparation), preparation.checkpoint!.preparationId, response);
    const state = ready.workingDraftPreparations!.at(-1)!;
    expect(state.status, state.code ?? JSON.stringify(state.result?.workingDraft.failure)).toBe("READY_FOR_REVIEW");
    expect(state.result!.workingDraft.explicitStudioDecisions).toHaveLength(1);
    expect(state.result!.workingDraft.readyReview!.contribution.source.turns).toEqual([]);
    expect(state.result!.workingDraft.readyReview!.contribution.source.sourceRefs).toContain(run.revision.revisionId);
    expect(state.result!.workingDraft.readyReview!.contribution.decisionBoundary.projectWriteAuthorized).toBe(false);
    const prepared = state.result!.workingDraft.readyReview!;
    const replacement = prepared.candidate.canonicalChangeSet.objectChanges.find(change => change.candidate?.content === domain.design)!;
    expect(replacement.operation).toBe("REPLACE"); expect(replacement.objectId).toBe(designTarget.stableId);
    expect(validatePreparedWorkingReview({ ...ready, studyProposal: state.result!.composition, workingDraft: state.result!.workingDraft })).not.toBeNull();
    expect(captureStudioProjectPreparation(ready, source, run.revision).action).toBe("REUSE_VALID_PREPARATION");
    const restored = loadFunctionalResetSession({ getItem: () => JSON.stringify(ready) }, undefined, true);
    expect(captureStudioProjectPreparation(restored, source, run.revision).action).toBe("REUSE_VALID_PREPARATION");
    const corrupt = { ...ready, workingDraftPreparations: ready.workingDraftPreparations!.map(p => p.result
      ? { ...p, result: { ...p.result, composition: { ...p.result.composition, digest: "ke1-invalid" } } } : p) };
    expect(() => captureStudioProjectPreparation(corrupt, source, run.revision)).toThrow("STUDIO_PREPARATION_RESULT_INVALID");
    const later = { ...ready, runtimeTurns: [{ turnId: "turn:after-native-checkpoint", role: "USER" as const,
      content: "Ajouter un suivi clinique après traitement", createdAt: NOW }] };
    expect(() => captureStudioProjectPreparation(later, source, run.revision)).toThrow("STUDIO_SCIENTIFIC_STATE_STALE");
    expect(ready.entries).toEqual(run.session.entries);
    expect(JSON.stringify(run.project2)).toBe(before); expect(ready.runtimeTurns).toEqual([]);
    // A separate explicit native human decision, not an assessment/finalization
    // click, authorizes only this exact presented change through PRJ.
    const adopted = confirmResearchProjectContribution({ contribution: prepared.contribution, current: run.project2,
      projectId: run.project2.projectId, authority: run.session.projectAuthority, confirmedAt: NOW,
      reviewedProjection: prepared.candidate.humanReviewProjection, selectedChangeRefs: [replacement.changeRef],
      confirmationSourceRefs: ["human-decision:exact-studio-review"] });
    expect(adopted.canonicalState!.objects.find(object => object.objectId === designTarget.stableId && object.actuality === "CURRENT")?.content).toBe(domain.design);
    expect(run.g2.ref.project.projectDigest).toBe(run.project2.projectDigest);
  });
  it("I: a pending reference without governed scientific content fails closed, never fabricates a transcript", async () => {
    const run = await setup("scientific", true), source = { request: run.request, assessment: assessmentFor(run) };
    const conversation = [{ turnId: "turn:real-pending", role: "USER" as const, content: "Ajouter un suivi de sécurité", createdAt: NOW }];
    expect(() => captureStudioProjectPreparation({ ...run.session, runtimeTurns: conversation }, source, run.revision))
      .toThrow("SCIENTIFIC_PREPARATION_SOURCE_UNAVAILABLE");
    expect(source.request.origin).toBe("STUDIO"); expect(conversation[0].role).toBe("USER");
    const invalid = payloadFor(run); invalid.scientificStateDisposition = "NO_NET_CHANGE";
    expect(() => assessmentFor(run, invalid)).toThrow("STUDIO_PENDING_SCIENCE_NOT_ASSESSED");
    const noRefs = await setup("editorial"), pending = payloadFor(noRefs, "DOCUMENT_ONLY");
    pending.scientificStateDisposition = "PENDING_HUMAN_CONFIRMATION";
    expect(captureStudioProjectPreparation(noRefs.session, { request: noRefs.request,
      assessment: assessmentFor(noRefs, pending) }, noRefs.revision).action).toBe("EXISTING_QRY_PATH");
  });
  it("mixed editorial/scientific edits keep only uncovered scientific edits in WD input and output bindings", async () => {
    const run = await setup("mixed"), payload = payloadFor(run);
    const editorial = run.request.delta.find(edit => edit.field === "TITLE")!;
    payload.edits.find(edit => edit.editRef === editorial.editRef)!.classification = "DOCUMENT_ONLY";
    const source = { request: run.request, assessment: assessmentFor(run, payload) };
    const preparation = captureStudioProjectPreparation(run.session, source, run.revision).preparation!;
    const packet = prepareWorkingDraftRequest(preparation.checkpoint!.request);
    expect(JSON.parse(packet.context).NATIVE_STUDIO_SOURCE.edits).toHaveLength(1);
    expect(JSON.stringify(packet.outputSchema)).not.toContain(editorial.editRef);
    expect(JSON.stringify(packet.outputSchema)).not.toContain(editorial.afterText);
    expect(source.request.delta.find(edit => edit.editRef === editorial.editRef)?.afterText).toBe(editorial.afterText);
  });
  it("J: complete native owner coverage of adopted science reuses Project with zero WD", async () => {
    const original = await setup(), adopted = await workingRevisionFixture();
    const session = { ...original.session, project: adopted.project3 }, scientificState = captureStudioScientificState(session);
    const request = await createStudioReconciliationRequest({ revision: original.revision,
      source: { ref: original.g2.ref, body: original.g2.body }, projectionSource: await original.archive.body(original.access2, original.g2.projection.projectionId),
      currentProject: adopted.project3, scientificState });
    const run = { ...original, request, project2: adopted.project3, session, scientificState }, payload = payloadFor(run);
    const design = request.currentProject.objects.find(o => o.content === "étude multicentrique" && o.decisionRefs.length && o.epistemicState === "KNOWN")!;
    expect(design).toBeDefined();
    payload.edits[0].projectCoverage = { coverage: "COMPLETE", projectVersionRefs: [design.versionRef] };
    const source = { request: run.request, assessment: assessmentFor(run, payload) };
    expect(source.assessment.humanDecisionRequired).toBe(false);
    expect(captureStudioProjectPreparation(run.session, source, run.revision)).toMatchObject({ action: "PROJECT_REUSE", preparation: null });
  });
  it("native provider schema and invalid assessment branches remain fail closed", async () => {
    const run = await setup(), schema = prepareStudioAssessmentRequest(run.request, run.project2).outputSchema;
    expect(schema.additionalProperties).toBe(false);
    const payload = payloadFor(run); payload.edits[0].provenanceRefs = ["unrelated-source"];
    expect(() => assessmentFor(run, payload)).toThrow("STUDIO_ASSESSMENT_PROVENANCE_INVALID");
    const missing = payloadFor(run); missing.edits = [];
    expect(() => assessmentFor(run, missing)).toThrow("STUDIO_ASSESSMENT_COVERAGE_INVALID");
  });
  it("public native route requires saved source/proof and retained ST assessment, never accepts a forged report", async () => {
    const run = await setup(), guard = createMemoryProtocolDesignerGuardForTests(), fetchImpl = provider(payloadFor(run), "gpt-6-sol");
    const invoke = async (body: unknown) => {
      let status = 0, output: unknown;
      await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", origin: "https://noxia-imagerie.fr",
        host: "noxia-imagerie.fr", "x-forwarded-for": run.identity.clientAddress, "x-noxia-project-snapshot-proof": run.access2.proof }, body }, {
        setHeader() {}, status(code) { status = code; return this; }, json(value) { output = value; },
      }, { NODE_ENV: "production", OPENAI_PROVIDER: "azure", AZURE_OPENAI_PROJECT_ENDPOINT: "https://fixture.services.ai.azure.com/api/projects/fixture",
        AZURE_OPENAI_API_KEY: "OFFLINE", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" },
      { fetchImpl, durableGuard: guard, projectSnapshotStore: run.snapshots, documentArchive: run.archive });
      return { status, body: output };
    };
    const source = { request: run.request, assessment: assessmentFor(run) };
    const preparation = captureStudioProjectPreparation(run.session, source, run.revision).preparation!;
    const denied = await invoke(preparation.checkpoint!.request);
    expect(denied.status).toBe(422); expect(fetchImpl).not.toHaveBeenCalled();
    const result = await invoke(nativeBody(run)); expect(result.status, JSON.stringify(result.body)).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const replay = await invoke(nativeBody(run)); expect(replay.status).toBe(200); expect(fetchImpl).toHaveBeenCalledTimes(1);
    const forged = structuredClone(source); forged.assessment.completedAt = "2026-10-08T12:00:00.000Z";
    const rejected = await invoke(captureStudioProjectPreparation(run.session, forged, run.revision).preparation!.checkpoint!.request);
    expect(rejected.status).toBe(422); expect(fetchImpl).toHaveBeenCalledTimes(1);
    const durableSource = { request: run.request,
      assessment: (result.body as { studioAssessment: ReturnType<typeof assessmentFor> }).studioAssessment };
    fetchImpl.mockImplementationOnce(provider({ requestType: "INSUFFICIENT", proposal: null,
      explicitDecisions: [], explicitStudioDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }, "gpt-6-sol"));
    const admitted = await invoke(captureStudioProjectPreparation(run.session, durableSource, run.revision).preparation!.checkpoint!.request);
    expect(admitted.status, JSON.stringify(admitted.body)).toBe(200);
    expect(admitted.body).not.toHaveProperty("assistantTurn"); expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
