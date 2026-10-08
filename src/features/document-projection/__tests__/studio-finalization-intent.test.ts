import { describe, expect, it, vi } from "vitest";
import { workingRevisionFixture } from "./working-revision-fixture";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { acceptStudioAssessment } from "../../scientific-thinking/studio-runtime";
import type { StudioAssessmentPayload } from "../studio-reconciliation-contract";
import { createFunctionalResetSession, type FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { freezeStudioFinalizationWork, captureStudioIntentPreparation, prepareStudioIntentHumanDecision,
  stageStudioIntentAdoption, restoreStudioIntentPreparation } from "../../protocol-designer/functional-reset/studio-finalization-lifecycle";
import { addProjectPreparation, consumeProjectPreparation } from "../../protocol-designer/functional-reset/project-preparation-lifecycle";
import { retainScientificDiscussionResult } from "../../protocol-designer/functional-reset/contribution-discussion-retention";
import { controlledStudyProposal, DOMAINS } from "../../protocol-designer/functional-reset/__tests__/study-proposal-fixtures";
import { executeProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { executeDocumentArchiveOperation } from "../../../../server/protocol-designer-document-archive-http";
import { verifySavedStudioScientificSource } from "../../../../server/protocol-designer-studio-scientific";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { createPostgresDocumentArchive, documentArchiveCapacity } from "../../../../server/protocol-designer-document-archive";
import { createProductKnowledgeOwnerLedger } from "../../protocol-designer/product-knowledge-owner-runtime";
import { createProductValidationRunLedger } from "../../protocol-designer/product-validation-run-ledger";
import { createScientificExecutionTraceLedger } from "../../protocol-designer/scientific-execution-trace";
import { assertStudioIntentHumanDecision } from "../studio-finalization-intent";
import { documentAdministrationFrom, emptyProjectAdministration } from "../../protocol-designer/functional-reset/project-administration";
import { buildCanonicalCrfPackage } from "../study-deliverable-portfolio";
import { prepareDrciDraftSource, materializeDrciDraftPack, prepareDrciDraftPack } from "../drci-draft-pack";
import { createStudioFinalizationRuntime, retainStudioAdoptionConcurrentWork } from "../../protocol-designer/functional-reset/studio-finalization-runtime";
import type { DocumentArchiveClient } from "../generation-archive-client";
import { studioDocumentRequestId, studioProviderRequestId, composeStudioFinalizationPack } from "../studio-finalization-document";
import { documentNativeGeneratedAt } from "../generation-persistence";
import { handleProtocolDesignerBridge, type ApiResponse } from "../../../../api/protocol-designer-bridge";
import * as documentProvider from "../../../../api/protocol-designer-openai-extraction-provider";

const NOW = "2026-10-08T12:00:00.000Z";
const setup = async (kind: "editorial" | "science" | "none" | "already-adopted" = "editorial", mixed = false, editorialWithScience = false) => {
  const run = await workingRevisionFixture({ monocentric: kind !== "already-adopted" });
  let { revision } = await run.owner.create(run.access2, run.createInput);
  if (kind !== "none") {
    const content = structuredClone(revision.content);
    if (kind === "science") content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("monocentrique", "multicentrique");
    else if (kind === "already-adopted") content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("étude multicentrique", "Étude conduite dans plusieurs centres");
    else content.title += " — rédaction humaine";
    if (editorialWithScience) content.title += " — rédaction humaine conservée";
    revision = (await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence, content })).revision;
  }
  const fresh = createFunctionalResetSession(NOW);
  const user = { turnId: "user-turn:11111111-1111-4111-8111-111111111111", role: "USER" as const, content: "Adultes après infarctus", createdAt: NOW };
  const reply = { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA" as const, content: "Population comprise.", createdAt: NOW };
  const runtimeTurns = mixed ? [user, reply] : [];
  const scientificDiscussionRetention = mixed ? retainScientificDiscussionResult({ conversationId: "frozen-studio", userTurn: user,
    assistantTurn: reply, runtimeTurns, retained: [], result: { reply: reply.content,
      userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "population", content: user.content,
        epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] }] },
      assistantContribution: { coverage: "COMPLETE", nonPersistentReason: "PRESENTATION_ONLY", elements: [] }, dispositions: [], candidateBindings: [] } }) : undefined;
  const session: FunctionalResetSession = { ...fresh, sessionId: run.sessionId, projectId: run.project2.projectId,
    conversationId: "frozen-studio", project: run.project2, runtimeTurns, scientificDiscussionRetention,
    knowledgeOwnerLedger: createProductKnowledgeOwnerLedger(run.sessionId), validationRunLedger: createProductValidationRunLedger(run.sessionId),
    scientificExecutionTraceLedger: createScientificExecutionTraceLedger(run.sessionId),
    documentArchive: { ...fresh.documentArchive!, projectId: run.project2.projectId } };
  const source = { ref: run.g2.ref, body: run.g2.body }, projectionSource = await run.archive.body(run.access2, run.g2.projection.projectionId);
  const frozen = await freezeStudioFinalizationWork({ session, revision, source, projectionSource });
  const intents = run.archive.finalizationIntents!;
  const intent = await intents.create(run.access2, frozen);
  const administration = documentAdministrationFrom(run.project2.projectId, { title: "Qualification native Studio", revision: 0,
    administration: emptyProjectAdministration() });
  return { ...run, session, revision, frozen, intents, intent, source, projectionSource, administration };
};
const assessment = (run: Awaited<ReturnType<typeof setup>>, classification: StudioAssessmentPayload["edits"][number]["classification"] = "DOCUMENT_ONLY") => {
  const request = run.frozen.scientificSources.request;
  return acceptStudioAssessment(request, run.project2, { requestDigest: request.requestDigest,
    scientificStateDisposition: request.scientificState.pendingTurnRef ? "PENDING_HUMAN_CONFIRMATION" : "NO_NET_CHANGE",
    scientificStateReason: "Controlled native assessment; not clinical qualification", scientificStateAmbiguity: null,
    edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef,
      classification: classification === "PROJECT_CHANGE" && edit.field === "TITLE" && edit.afterText.endsWith("rédaction humaine conservée") ? "DOCUMENT_ONLY" : classification,
      reason: "Exact controlled Scientific Thinking assessment", provenanceRefs: [edit.editRef], projectCoverage: null,
      ambiguity: classification === "AMBIGUOUS" ? { question: "Remplacement ou ajout d’un centre pour un sous-groupe ?",
        materialProjectRefs: [request.currentProject.objects[0].versionRef], alternatives: [
          { interpretation: "Remplacement", consequence: "Tous les participants sont concernés" },
          { interpretation: "Ajout", consequence: "Un sous-groupe seulement est concerné" }] } : null })) }, NOW);
};
const assessed = async (run: Awaited<ReturnType<typeof setup>>, classification: Parameters<typeof assessment>[1] = "DOCUMENT_ONLY") =>
  run.intents.assess(run.access2, run.intent.finalizationIntentId, run.intent.sequence, assessment(run, classification));
const prepare = async (run: Awaited<ReturnType<typeof setup>>, existing?: Awaited<ReturnType<typeof assessed>>,
  provided?: Parameters<typeof addProjectPreparation>[1]) => {
  let intent = existing ?? await assessed(run, "PROJECT_CHANGE");
  const capture = provided ? { preparation: provided } : captureStudioIntentPreparation(intent, run.session, run.revision, NOW);
  const preparation = capture.preparation!, cp = preparation.checkpoint!;
  if (!intent.resolution.preparation) intent = await run.intents.linkPreparation(run.access2, intent.finalizationIntentId, intent.sequence, preparation);
  const domain = { ...DOMAINS[1], question: "Évaluer la colchicine versus placebo après infarctus", population: "Adultes après infarctus",
    design: "étude multicentrique", outcome: "Critère de recherche après infarctus", exposure: "Colchicine versus placebo" };
  const proposal = controlledStudyProposal(cp.inputDigest, domain as typeof DOMAINS[1]);
  const target = cp.request.studioPreparationSource!.request.currentProject.objects.find(object => object.content === "étude monocentrique")!;
  proposal.atoms.find(atom => atom.ref === "design")!.userChangeRefs = [target.versionRef];
  const output = { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [],
    explicitStudioDecisions: run.frozen.scientificSources.request.delta.filter(edit => cp.request.studioPreparationSource!.assessment.nativePayload.edits
      .some(assessment => assessment.editRef === edit.editRef && assessment.classification === "PROJECT_CHANGE"))
      .map(edit => ({ atomRef: "design", editRef: edit.editRef, quote: edit.afterText })),
    retainedDiscussionBindings: cp.request.scientificDiscussionContext?.retainedMeaning?.map(element => ({ elementRef: element.ref,
      sourceTurnRef: element.sourceTurnRef, atomRefs: ["population"] })) ?? [],
    sourceSetBindings: cp.request.scientificPreparationSourceSet!.sources.filter(source => source.status === "PENDING")
      .map(source => ({ sourceRef: source.ref, coverage: "COMPLETE", atomRefs: source.origin === "STUDIO" ? ["design"] : ["population"] })) };
  const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_FROZEN_STUDIO", model: "fixture-model",
    status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(output) }] }],
    usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 } })));
  const result = await executeProtocolDesignerBridge({ body: cp.request, openAiApiKey: "OFFLINE", apiKey: null,
    fetchImpl, autonomousProjectBuild: true, chatRuntime: "TERRA", now: () => Date.parse(NOW) });
  expect(result.status, JSON.stringify(result.body)).toBe(200);
  const session = consumeProjectPreparation(addProjectPreparation(run.session, preparation), cp.preparationId,
    result.body as Parameters<typeof consumeProjectPreparation>[2]);
  const ready = session.workingDraftPreparations!.at(-1)!;
  expect(ready.status, ready.code ?? "").toBe("READY_FOR_REVIEW");
  if (!provided) intent = await run.intents.linkPreparation(run.access2, intent.finalizationIntentId, intent.sequence, ready);
  return { intent, session, cp, fetchImpl, response: result.body };
};
const adopt = async (run: Awaited<ReturnType<typeof setup>>) => {
  const prepared = await prepare(run);
  const decision = prepareStudioIntentHumanDecision(prepared.intent, prepared.session);
  const staged = stageStudioIntentAdoption({ intent: prepared.intent, decision, session: prepared.session,
    readCurrentSession: () => prepared.session, now: NOW, administration: run.administration });
  const access = await run.register(staged.project, run.access2.proof);
  const intent = await run.intents.resolveAdoption(access, prepared.intent.finalizationIntentId, prepared.intent.sequence, decision);
  return { ...prepared, decision, staged, access, intent };
};
const documentSource = (run: Awaited<ReturnType<typeof setup>>) => prepareDrciDraftSource({
  handoffDecision: run.g2.projection.humanDecisions.find(d => d.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION")!,
  protocolProjection: run.g2.projection, crf: buildCanonicalCrfPackage(run.project2) });
const readyDocuments = async (run: Awaited<ReturnType<typeof setup>>) => {
  const intent = await assessed(run);
  return run.intents.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence, documentSource(run));
};
const finalizationHarness = async (kind: Parameters<typeof setup>[0] = "editorial", mixed = false, editorialWithScience = false) => {
  const run = await setup(kind, mixed, editorialWithScience);
  let session = run.session, access = run.access2;
  const client = (): DocumentArchiveClient => ({
    body: id => run.archive.body(access, id), history: before => run.archive.history(access, before, "DRCI"),
    receipt: id => run.archive.receipt(access, id), recover: vi.fn(),
    commit: async (id, body) => {
      await run.archive.admit(access, { requestId: id, requestSha256: (await import("../../../../server/protocol-designer-document-archive")).docSha256(JSON.stringify(body)),
        generatedAt: documentNativeGeneratedAt(body.native), reservedBytes: 1_000_000 });
      return run.archive.commit(access, id, body);
    },
    workingRevisions: {
      open: input => run.owner.open(access, input), create: input => run.owner.create(access, input),
      get: id => run.owner.get(access, id), getSave: input => run.owner.getSave(access, input),
      save: input => run.owner.save(access, input), abandon: input => run.owner.abandon(access, input),
    },
    finalizationIntents: {
      create: frozen => run.intents.create(access, frozen), get: id => run.intents.get(access, id),
      recoverActive: id => run.intents.recoverActive(access, id), recoverForSave: save => run.intents.recoverForSave(access, save),
      recoverForBase: (base, document) => run.intents.recoverForBase(access, base, document),
      waitForAssessment: (id, seq) => run.intents.waitForAssessment(access, id, seq),
      assess: (id, seq, result) => run.intents.assess(access, id, seq, result),
      linkPreparation: (id, seq, prep) => run.intents.linkPreparation(access, id, seq, prep),
      recordHumanDecision: (id, seq, decision) => run.intents.recordHumanDecision(access, id, seq, decision),
      resolveAdoption: (id, seq, decision) => run.intents.resolveAdoption(access, id, seq, decision),
      prepareDocuments: (id, seq, source) => run.intents.prepareDocuments(access, id, seq, source),
      finalizeDocuments: id => run.intents.finalizeDocuments(access, id),
      retryDocuments: async (id, seq) => run.intents.retryDocuments(access, id, seq, studioProviderRequestId(await run.intents.get(access, id))),
    },
  });
  const preparePort = vi.fn(async (captured: Parameters<typeof addProjectPreparation>[1]) => {
    const intent = await run.intents.get(access, run.intent.finalizationIntentId);
    const result = await prepare(run, intent, captured); session = result.session;
  });
  const adopted = vi.fn(async (intent: Awaited<ReturnType<typeof assessed>>) => {
    const staged = stageStudioIntentAdoption({ intent, decision: intent.resolution.humanDecision!, session,
      readCurrentSession: () => session, now: NOW, administration: run.administration });
    access = await run.register(staged.project, access.proof); session = staged.nextSession;
  });
  const generate = vi.fn(async (request: import("../../protocol-designer/product-bridge").ProductBridgeRequest) => {
    const intent = await run.intents.get(access, request.documentFinalizationIntentId!);
    const native = run.nativeGeneration(session.project!, intent.createdAt).pack;
    const pack = materializeDrciDraftPack({ documents: native.documents, crfRows: native.crfRows }, {
      project: session.project!, packet: prepareDrciDraftPack(session.project!, request.documentDraftRequest!), generatedAt: intent.createdAt });
    await run.intents.finalizeDocuments(access, intent.finalizationIntentId, pack);
    return { documentDraftPack: pack, observability: { calls: 0 } } as Awaited<ReturnType<typeof import("../../protocol-designer/product-bridge-client").requestProtocolDesignerBridge>>;
  });
  const clarify = vi.fn(), committed = vi.fn(async () => undefined);
  const runtime = createStudioFinalizationRuntime({ session: () => session, publish: next => { session = next; },
    client, prepare: preparePort, adopt: adopted, clarify, committed, generate,
    assess: vi.fn(async () => assessment(run, kind === "science" ? "PROJECT_CHANGE" : "DOCUMENT_ONLY")) });
  return { ...run, client, runtime, preparePort, adopted, generate, clarify, committed, session: () => session,
    setSession: (next: FunctionalResetSession) => { session = next; } };
};

describe("DOC durable frozen intent / native ST and human adoption / no generation", () => {
  it("A/C: durable FROZEN and identical input idempotent, including concurrent creates", async () => {
    const run = await setup();
    expect(run.intent.state).toBe("FROZEN"); expect(run.fixture.intents()).toHaveLength(1);
    const copies = await Promise.all([run.intents.create(run.access2, run.frozen), run.intents.create(run.access2, run.frozen)]);
    expect(copies).toEqual([run.intent, run.intent]); expect(run.fixture.intents()).toHaveLength(1);
  });
  it("B/D: later save retained; exact historical source accepted only with the frozen intent", async () => {
    const run = await setup(), content = structuredClone(run.revision.content); content.title += " — modification tardive";
    const later = (await run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: run.revision.saveSequence, content })).revision;
    const saved = await run.owner.getSave(run.access2, { revisionId: run.revision.revisionId, saveSequence: run.revision.saveSequence, contentDigest: run.revision.contentDigest });
    expect(saved.revision).toEqual(run.revision); expect((await run.owner.get(run.access2, later.revisionId)).revision).toEqual(later);
    await expect(verifySavedStudioScientificSource(run.archive, run.access2, run.project2, run.frozen.scientificSources.request)).rejects.toThrow("STUDIO_RECONCILIATION_STALE");
    await expect(verifySavedStudioScientificSource(run.archive, run.access2, run.project2, run.frozen.scientificSources.request, run.intent.finalizationIntentId)).resolves.toBeUndefined();
    const frozen = await freezeStudioFinalizationWork({ ...run, revision: later });
    expect((await run.intents.create(run.access2, frozen)).finalizationIntentId).not.toBe(run.intent.finalizationIntentId);
    expect((await run.intents.get(run.access2, run.intent.finalizationIntentId)).frozen).toEqual(run.frozen);
  });
  it("E: editorial native assessment reaches READY, without WD/PRJ/generation mutation", async () => {
    const run = await setup(), before = JSON.stringify(run.fixture.rows()), intent = await assessed(run);
    expect(intent.state).toBe("READY_FOR_DOCUMENT_FINALIZATION"); expect(intent.resolution.preparation).toBeNull();
    expect(intent.resolution.resolvedProject?.projectDigest).toBe(run.project2.projectDigest);
    expect(JSON.stringify(run.fixture.rows())).toBe(before); expect(run.session.project).toEqual(run.project2);
  });
  it("exact no-op is deterministic and remains distinct from a completed document version", async () => {
    const run = await setup("none"), intent = await assessed(run);
    expect(intent.state).toBe("READY_FOR_DOCUMENT_FINALIZATION"); expect(intent.resolution.reconciliationPlan?.state).toBe("NO_CHANGE");
    expect(intent.resolution.sourceSet?.groups).toEqual([]); expect(run.fixture.rows().filter(row => row.state === "COMMITTED")).toHaveLength(4);
  });
  it("F: owner-certified already adopted science reaches READY with zero WD", async () => {
    const run = await setup("already-adopted"), { frozen, intent } = run, request = frozen.scientificSources.request;
    const object = request.currentProject.objects.find(o => o.content === "étude multicentrique")!;
    const result = acceptStudioAssessment(request, run.project2, { ...assessment(run, "PROJECT_CHANGE").nativePayload,
      requestDigest: request.requestDigest, edits: request.delta.filter(e => e.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef,
        classification: "PROJECT_CHANGE", reason: "Controlled full adopted coverage", provenanceRefs: [edit.editRef],
        projectCoverage: { coverage: "COMPLETE", projectVersionRefs: [object.versionRef] }, ambiguity: null })) }, NOW);
    const ready = await run.intents.assess(run.access2, intent.finalizationIntentId, intent.sequence, result);
    expect(ready.state).toBe("READY_FOR_DOCUMENT_FINALIZATION"); expect(ready.resolution.preparation).toBeNull();
  });
  it("G/H/I/O: native scientific preparation + human adoption advance PRJ while the same intent resumes READY across reload", async () => {
    const run = await setup("science"), before = JSON.stringify(run.fixture.rows()), result = await adopt(run);
    expect(result.fetchImpl).toHaveBeenCalledTimes(1); // mock boundary only
    expect(result.staged.project.revision).toBe(3); expect(result.staged.project.previousVersionId).toBe(run.project2.versionId);
    expect(result.intent.finalizationIntentId).toBe(run.intent.finalizationIntentId);
    expect(result.intent.state).toBe("READY_FOR_DOCUMENT_FINALIZATION"); expect(result.intent.frozen).toEqual(run.frozen);
    expect(result.intent.resolution.resolvedProject?.projectDigest).toBe(result.staged.project.projectDigest);
    expect(result.staged.nextSession.runtimeTurns.some(t => t.role === "USER")).toBe(false);
    expect(result.staged.project.confirmationDecision.provenance).toContain(result.decision.decisionRef);
    expect(await run.intents.get(result.access, result.intent.finalizationIntentId)).toEqual(result.intent);
    expect(await run.intents.create(result.access, run.frozen)).toEqual(result.intent);
    expect(await run.intents.resolveAdoption(result.access, result.intent.finalizationIntentId, result.intent.sequence, result.decision)).toEqual(result.intent);
    expect(JSON.stringify(run.fixture.rows())).toBe(before); expect((await run.owner.get(result.access, run.revision.revisionId)).revision).toEqual(run.revision);
  });
  it("J: unrelated Project advancement blocks and never silently rebinds", async () => {
    const run = await setup(), intent = await assessed(run), access3 = await run.register(run.project3, run.access2.proof);
    const recovered = await run.intents.get(access3, intent.finalizationIntentId);
    expect(recovered.state).toBe("BLOCKED"); expect(recovered.resolution.reason).toBe("STUDIO_INTENT_PROJECT_STALE");
    expect(recovered.resolution.resolvedProject?.projectDigest).toBe(run.project2.projectDigest);
  });
  it("K/N: material ambiguity recovers waiting for the existing QRY, with no adoption", async () => {
    const run = await setup("science"), intent = await assessed(run, "AMBIGUOUS");
    expect(intent.state).toBe("WAITING_FOR_HUMAN_DECISION"); expect(intent.resolution.reason).toBe("EXISTING_QRY_PATH");
    expect(await run.intents.get(run.access2, intent.finalizationIntentId)).toEqual(intent);
    expect(() => prepareStudioIntentHumanDecision(intent, run.session)).toThrow(); expect(run.session.project).toEqual(run.project2);
  });
  it("L: frozen mixed sources remain distinct, one combined checkpoint and exact reuse", async () => {
    const run = await setup("science", true), result = await prepare(run);
    expect(result.fetchImpl).toHaveBeenCalledTimes(1);
    expect(new Set(result.intent.resolution.sourceSet!.sources.map(s => s.origin))).toEqual(new Set(["CONVERSATION", "STUDIO"]));
    expect(captureStudioIntentPreparation(result.intent, result.session, run.revision, NOW).action).toBe("REUSE_VALID_PREPARATION");
    expect((await run.intents.get(run.access2, result.intent.finalizationIntentId)).resolution.preparation).toEqual(result.intent.resolution.preparation);
  });
  it("M: realistic later contribution excluded from frozen preparation and retained in current session", async () => {
    const run = await setup("science", true), intent = await assessed(run, "PROJECT_CHANGE");
    const late = { turnId: "user-turn:late-real", role: "USER" as const, content: "Ajouter une visite de sécurité", createdAt: NOW };
    const current = { ...run.session, runtimeTurns: [...run.session.runtimeTurns, late] };
    const capture = captureStudioIntentPreparation(intent, current, run.revision, NOW);
    expect(capture.preparation!.checkpoint!.request.conversation.turns).toEqual(run.session.runtimeTurns);
    expect(JSON.stringify(capture.preparation!.checkpoint!.request.scientificPreparationSourceSet)).not.toContain(late.turnId);
    expect(current.runtimeTurns.at(-1)).toEqual(late); expect(intent.frozen).toEqual(run.frozen);
  });
  it("P: corrupt historical save or mismatched digest fails closed without substituting latest", async () => {
    const run = await setup();
    await expect(run.owner.getSave(run.access2, { revisionId: run.revision.revisionId, saveSequence: run.revision.saveSequence, contentDigest: "ke1-incorrect" }))
      .rejects.toThrow("DOC_REVISION_SAVE_BINDING_INVALID");
    run.fixture.corruptRevision(run.revision.revisionId, run.revision.saveSequence);
    await expect(run.intents.get(run.access2, run.intent.finalizationIntentId)).rejects.toThrow();
  });
  it("Q: forged native confirmation for another save/intent/actor cannot adopt", async () => {
    const run = await setup("science"), result = await prepare(run), decision = prepareStudioIntentHumanDecision(result.intent, result.session);
    for (const changed of [{ ...decision, saveSequence: decision.saveSequence + 1 }, { ...decision, finalizationIntentId: "another-intent" }])
      expect(() => assertStudioIntentHumanDecision(result.intent, changed)).toThrow("STUDIO_INTENT_HUMAN_DECISION_INVALID");
    expect(() => stageStudioIntentAdoption({ intent: result.intent, decision: { ...decision, actorRef: "another-human" },
      session: result.session, readCurrentSession: () => result.session, now: NOW, administration: run.administration })).toThrow();
    expect(result.session.project).toEqual(run.project2);
  });
  it("failed adoption-receipt save preserves Project and intent; exact receipt can be recorded after reload", async () => {
    const run = await setup("science"), prepared = await prepare(run), decision = prepareStudioIntentHumanDecision(prepared.intent, prepared.session);
    const staged = stageStudioIntentAdoption({ intent: prepared.intent, decision, session: prepared.session, readCurrentSession: () => prepared.session,
      now: NOW, administration: run.administration });
    const access3 = await run.register(staged.project, run.access2.proof);
    run.fixture.failIntentSave(true);
    await expect(run.intents.resolveAdoption(access3, prepared.intent.finalizationIntentId, prepared.intent.sequence, decision)).rejects.toThrow("OFFLINE_INTENT_WRITE_FAILURE");
    expect((await run.intents.get(access3, prepared.intent.finalizationIntentId)).state).toBe("BLOCKED");
    expect(JSON.parse(String(run.fixture.intents().at(-1)!.record_text)).state).toBe("WAITING_FOR_HUMAN_DECISION");
    run.fixture.failIntentSave(false);
    expect((await run.intents.resolveAdoption(access3, prepared.intent.finalizationIntentId, prepared.intent.sequence, decision)).state).toBe("READY_FOR_DOCUMENT_FINALIZATION");
  });
  it("existing HTTP capability exposes exact historical read and denies unproven assessment/ready claims", async () => {
    const run = await setup();
    const call = (body: Record<string, unknown>, proof = run.access2.proof) => executeDocumentArchiveOperation({
      body: { ...body, sessionId: run.sessionId, projectRef: run.access2.project }, proof, clientAddress: run.identity.clientAddress,
      connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots });
    expect((await call({ operation: "DOC_ARCHIVE_STUDIO_INTENT_GET", intentId: run.intent.finalizationIntentId }, "wrong-proof")).status).toBe(403);
    expect((await call({ operation: "DOC_ARCHIVE_REVISION_GET_SAVE", revisionId: run.revision.revisionId,
      saveSequence: run.revision.saveSequence, contentDigest: run.revision.contentDigest })).status).toBe(200);
    expect((await call({ operation: "DOC_ARCHIVE_STUDIO_INTENT_ASSESS", intentId: run.intent.finalizationIntentId,
      expectedSequence: run.intent.sequence, assessment: assessment(run) })).status).toBe(422);
    expect((await call({ operation: "DOC_ARCHIVE_STUDIO_INTENT_GET", intentId: run.intent.finalizationIntentId, state: "READY_FOR_DOCUMENT_FINALIZATION" })).status).toBe(400);
  });
  it("optimistic intent update conflict never overwrites an acknowledged stage", async () => {
    const run = await setup(), waiting = await run.intents.waitForAssessment(run.access2, run.intent.finalizationIntentId, run.intent.sequence);
    expect(waiting.state).toBe("WAITING_FOR_SCIENTIFIC_ASSESSMENT");
    await expect(run.intents.waitForAssessment(run.access2, run.intent.finalizationIntentId, run.intent.sequence)).rejects.toThrow("STUDIO_INTENT_UPDATE_CONFLICT");
    expect(await run.intents.get(run.access2, run.intent.finalizationIntentId)).toEqual(waiting);
  });
  it("runtime HTTP accepts exact retained native evidence and rejects forged WD origins", async () => {
    const run = await setup("science"), prepared = await prepare(run);
    const readNativeStudioResult = vi.fn(async (input: { clientRequestId: string }) => ({ state: "COMPLETED" as const,
      response: input.clientRequestId === prepared.cp.preparationId ? prepared.response
        : { studioAssessment: prepared.intent.resolution.assessment } }));
    const guard = { ...createMemoryProtocolDesignerGuardForTests(), readNativeStudioResult };
    const call = (body: Record<string, unknown>) => executeDocumentArchiveOperation({
      body: { ...body, sessionId: run.sessionId, projectRef: run.access2.project }, proof: run.access2.proof,
      clientAddress: run.identity.clientAddress, connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots, guard });
    const preparation = prepared.intent.resolution.preparation!;
    const command = { operation: "DOC_ARCHIVE_STUDIO_INTENT_PREPARATION", intentId: prepared.intent.finalizationIntentId,
      expectedSequence: prepared.intent.sequence, preparation };
    expect((await call(command)).status).toBe(200);
    expect(readNativeStudioResult.mock.calls.at(-1)![0].clientRequestId).toBe(prepared.cp.preparationId);
    const forged = structuredClone(preparation); forged.result!.workingDraft.origins.design = "INFERRED";
    const rejected = await call({ ...command, preparation: forged });
    expect(rejected.status).toBe(422);
    expect(rejected.body).toEqual({ error: { code: "STUDIO_INTENT_PREPARATION_DURABLE_PROOF_REQUIRED" } });
    expect(await run.intents.get(run.access2, prepared.intent.finalizationIntentId)).toEqual(prepared.intent);

    const editorial = await setup(), native = assessment(editorial);
    const accepted = await executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_STUDIO_INTENT_ASSESS",
      sessionId: editorial.sessionId, projectRef: editorial.access2.project, intentId: editorial.intent.finalizationIntentId,
      expectedSequence: editorial.intent.sequence, assessment: native }, proof: editorial.access2.proof,
      clientAddress: editorial.identity.clientAddress, connection: null, environment: {}, archive: editorial.archive,
      snapshots: editorial.snapshots, guard: { ...createMemoryProtocolDesignerGuardForTests(),
        readNativeStudioResult: async () => ({ state: "COMPLETED", response: { studioAssessment: native } }) } });
    expect(accepted.status).toBe(200);
    expect((await editorial.intents.get(editorial.access2, editorial.intent.finalizationIntentId)).state).toBe("READY_FOR_DOCUMENT_FINALIZATION");
  });
  it("restart recovers the original intent from its exact save even after a later save and Project adoption", async () => {
    const run = await setup("science"), adopted = await adopt(run), content = structuredClone(run.revision.content);
    content.title += " — travail ultérieur";
    const later = (await run.owner.save(adopted.access, { revisionId: run.revision.revisionId,
      expectedSaveSequence: run.revision.saveSequence, content })).revision;
    const restarted = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    const save = { revisionId: run.revision.revisionId, saveSequence: run.revision.saveSequence, contentDigest: run.revision.contentDigest };
    expect(await restarted.finalizationIntents!.recoverForSave(adopted.access, save)).toEqual(adopted.intent);
    expect(await restarted.finalizationIntents!.recoverForSave(adopted.access, { revisionId: later.revisionId,
      saveSequence: later.saveSequence, contentDigest: later.contentDigest })).toBeNull();
    expect((await restarted.workingRevisions!.get(adopted.access, later.revisionId)).revision).toEqual(later);
    const nextFrozen = await freezeStudioFinalizationWork({ ...run, session: adopted.staged.nextSession });
    const next = await restarted.finalizationIntents!.create(adopted.access, nextFrozen);
    expect(next.finalizationIntentId).not.toBe(adopted.intent.finalizationIntentId);
    // Same historical save can legitimately start a different intent after
    // governed science changes. Recovery must not choose an arbitrary latest.
    await expect(restarted.finalizationIntents!.recoverForSave(adopted.access, save)).rejects.toThrow("STUDIO_INTENT_RECOVERY_AMBIGUOUS");
  });
  it("server-held native checkpoint restores after browser state loss without a new WD", async () => {
    const run = await setup("science", true), prepared = await prepare(run);
    const recovered = await run.intents.get(run.access2, prepared.intent.finalizationIntentId);
    const restored = restoreStudioIntentPreparation(recovered, { ...prepared.session, workingDraftPreparations: [] });
    expect(restored.workingDraftPreparations).toEqual([recovered.resolution.preparation]);
    expect(captureStudioIntentPreparation(recovered, restored, run.revision, NOW).action).toBe("REUSE_VALID_PREPARATION");
    expect(prepared.fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("Create next version / native runtime → complete pack → exact archive", () => {
  it("G/H/N: real HTTP DOC boundary resolves exact Studio intent and commits once, without fabricated conversation", async () => {
    const run = await finalizationHarness("science", true), guard = createMemoryProtocolDesignerGuardForTests();
    const executed = vi.spyOn(documentProvider, "executeOpenAIDrciDraft");
    run.generate.mockImplementation(async request => {
      const project = run.session().project!, native = run.nativeGeneration(project);
      executed.mockResolvedValue({ value: { documents: native.pack.documents, crfRows: native.pack.crfRows }, calls: 1,
        latencyMs: 0, modelRequested: "gpt-6-sol", modelReturned: "gpt-6-sol", reusedProtocolEvidenceRef: null } as Awaited<ReturnType<typeof documentProvider.executeOpenAIDrciDraft>>);
      const invoke = async (payload: typeof request) => {
        let status = 0, body: unknown;
        const response: ApiResponse = { setHeader() {}, status(code) { status = code; return this; }, json(value) { body = value; } };
        await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", host: "noxia.test",
          origin: "https://noxia.test", "x-forwarded-for": run.identity.clientAddress, "x-noxia-project-snapshot-proof": run.access2.proof }, body: payload }, response,
        { VERCEL_ENV: "preview", OPENAI_API_KEY: "OFFLINE_SYNTHETIC", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA" }, {
          projectSnapshotStore: run.snapshots, documentArchive: run.archive, durableGuard: guard, now: () => Date.parse(NOW),
          fetchImpl: vi.fn(async () => { throw new Error("NETWORK_FORBIDDEN"); }) });
        return { status, body: body as import("../../protocol-designer/product-bridge").ProductBridgeResponse };
      };
      expect(request.conversation.turns).toEqual([]);
      const wrong = await invoke({ ...request, documentDraftRequest: { ...request.documentDraftRequest!, handoffDecision: {
        ...request.documentDraftRequest!.handoffDecision, timestamp: "2026-10-08T23:00:00.000Z" } } });
      expect(wrong.status).toBe(403); expect(executed).not.toHaveBeenCalled();
      const first = await invoke(request); expect(first.status, JSON.stringify(first.body)).toBe(200);
      const second = await invoke(request); expect(second.status).toBe(200);
      expect(second.body.documentPersistenceReceipt).toEqual(first.body.documentPersistenceReceipt);
      expect(executed).toHaveBeenCalledOnce(); return first.body;
    });
    const completed = await run.runtime.run(run.revision, () => undefined);
    expect(completed!.state).toBe("CLOSED"); expect(completed!.resolution.documentReceipt!.generation.displayVersion).toBe(3);
    expect(run.preparePort).toHaveBeenCalledOnce(); expect(run.adopted).toHaveBeenCalledOnce();
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([3, 2, 1]);
  });
  it("U: adoption acknowledgement preserves late governed meaning and native control-event coverage", async () => {
    const run = await setup("science", true), prepared = await prepare(run);
    const decision = prepareStudioIntentHumanDecision(prepared.intent, prepared.session);
    const staged = stageStudioIntentAdoption({ intent: prepared.intent, decision, session: prepared.session,
      readCurrentSession: () => prepared.session, now: NOW, administration: run.administration });
    const late = { turnId: "user-turn:late-confirmation", role: "USER" as const, content: "Ajouter une visite de sécurité", createdAt: NOW };
    const reply = { turnId: "noxia-turn:late-confirmation", role: "NOXIA" as const, content: "Visite à préparer ultérieurement", createdAt: NOW };
    const runtimeTurns = [...prepared.session.runtimeTurns, late, reply];
    const retention = retainScientificDiscussionResult({ state: prepared.session.scientificDiscussionRetention,
      conversationId: prepared.session.conversationId, userTurn: late, assistantTurn: reply, runtimeTurns,
      retained: [], result: { reply: reply.content, userContribution: { coverage: "COMPLETE", nonPersistentReason: null,
        elements: [{ id: "late-safety", content: late.content, epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] }] },
        assistantContribution: { coverage: "COMPLETE", nonPersistentReason: "PRESENTATION_ONLY", elements: [] }, dispositions: [], candidateBindings: [] } });
    const latest = { ...prepared.session, runtimeTurns, scientificDiscussionRetention: retention, pendingMixedUserTurnRef: late.turnId };
    const merged = retainStudioAdoptionConcurrentWork(staged.nextSession, prepared.session, latest);
    expect(merged.project).toEqual(staged.project); expect(merged.pendingMixedUserTurnRef).toBe(late.turnId);
    expect(merged.runtimeTurns.filter(turn => turn.role === "USER")).toEqual(runtimeTurns.filter(turn => turn.role === "USER"));
    expect(merged.scientificDiscussionRetention!.elements.find(element => element.content === late.content)?.status).toBe("PROPOSED_NOT_ADOPTED");
    for (const source of staged.nextSession.scientificDiscussionRetention!.sourceCoverage)
      expect(merged.scientificDiscussionRetention!.sourceCoverage).toContainEqual(source);
    expect(JSON.stringify(prepared.intent.frozen.scientificSources)).not.toContain(late.turnId);
  });
  it("G/Q: explicit terminal DOC retry retains intent/source; UNKNOWN or active evidence never authorizes retry", async () => {
    const run = await finalizationHarness("science"); run.generate.mockRejectedValueOnce(new Error("OFFLINE_DOC_FAILED"));
    await expect(run.runtime.run(run.revision, () => undefined)).rejects.toThrow("OFFLINE_DOC_FAILED");
    const project = run.session().project!, access = { ...run.access2, project: {
      projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest } };
    const intent = await run.intents.get(access, run.intent.finalizationIntentId), originalSource = logicalDigest(intent.resolution.documentSource);
    const read = vi.fn<NonNullable<ReturnType<typeof createMemoryProtocolDesignerGuardForTests>["readDocumentGenerationResult"]>>();
    const guard = { ...createMemoryProtocolDesignerGuardForTests(), readDocumentGenerationResult: read };
    const retry = () => executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_STUDIO_INTENT_RETRY_DOCUMENTS",
      intentId: intent.finalizationIntentId, expectedSequence: intent.sequence, sessionId: run.sessionId, projectRef: access.project },
      proof: access.proof, clientAddress: run.identity.clientAddress, connection: null, environment: {},
      archive: run.archive, snapshots: run.snapshots, guard });
    for (const state of ["UNKNOWN", "IN_PROGRESS"] as const) {
      read.mockResolvedValue({ state }); expect((await retry()).status).toBe(409);
      expect((await run.intents.get(access, intent.finalizationIntentId)).resolution.documentAttempt).toBeUndefined();
    }
    read.mockResolvedValue({ state: "FAILED", errorCode: "DOC_SCOPE_FAILED" });
    const response = await retry(); expect(response.status).toBe(200);
    const resumed = (response.body as { result: typeof intent }).result;
    expect(resumed.finalizationIntentId).toBe(intent.finalizationIntentId);
    expect(logicalDigest(resumed.frozen)).toBe(logicalDigest(intent.frozen));
    expect(logicalDigest(resumed.resolution.documentSource)).toBe(originalSource);
    expect(studioDocumentRequestId(resumed)).toBe(studioDocumentRequestId(intent));
    expect(studioProviderRequestId(resumed)).not.toBe(studioProviderRequestId(intent));
    expect(read).toHaveBeenLastCalledWith(expect.objectContaining({ clientRequestId: studioProviderRequestId(intent) }));
    // New foreground click resumes the same durable operation, not another WD/adoption.
    const completed = await run.runtime.run(run.revision, () => undefined);
    expect(completed!.resolution.documentReceipt!.generation.displayVersion).toBe(3);
    expect(run.preparePort).toHaveBeenCalledOnce(); expect(run.adopted).toHaveBeenCalledOnce();
    expect(run.generate).toHaveBeenCalledTimes(2);
    expect((await run.archive.history(access, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([3, 2, 1]);
  });
  it("L: changed native context underneath an editorial edit fails closed, retains exact draft", async () => {
    const run = await setup(), revision = (await run.owner.save(run.access2, { revisionId: run.revision.revisionId,
      expectedSaveSequence: run.revision.saveSequence, content: { ...run.revision.content,
        sections: run.revision.content.sections.map(section => ({ ...section, blocks: section.blocks.map(block => ({ ...block, text: block.text + " Rédaction humaine." })) })) } })).revision;
    const frozen = await freezeStudioFinalizationWork({ ...run, revision });
    let intent = await run.intents.create(run.access2, frozen);
    const result = acceptStudioAssessment(frozen.scientificSources.request, run.project2, { requestDigest: frozen.scientificSources.request.requestDigest,
      scientificStateDisposition: "NO_NET_CHANGE", scientificStateReason: "Controlled fixture", scientificStateAmbiguity: null,
      edits: frozen.scientificSources.request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef,
        classification: "DOCUMENT_ONLY", reason: "Controlled editorial fixture", provenanceRefs: [edit.editRef], projectCoverage: null, ambiguity: null })) }, NOW);
    intent = await run.intents.assess(run.access2, intent.finalizationIntentId, intent.sequence, result);
    if (run.g2.body.native.family !== "DRCI") throw new Error("Expected native pack");
    const native = run.g2.body.native.value, documents = structuredClone(native.documents);
    documents.find(document => document.kind === "PROTOCOL_FULL")!.sections[0].title += " Contexte scientifiquement recomposé";
    const source = documentSource(run), target = materializeDrciDraftPack({ documents, crfRows: native.crfRows }, {
      project: run.project2, packet: prepareDrciDraftPack(run.project2, source), generatedAt: intent.createdAt });
    expect(() => composeStudioFinalizationPack({ intent, project: run.project2, target, source, ancestorPacks: [] }))
      .toThrow("STUDIO_DOCUMENT_EDITORIAL_COLLISION");
    expect((await run.owner.get(run.access2, revision.revisionId)).revision).toEqual(revision);
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([2, 1]);
  });
  it("M: unrelated old same-Project generation receipt cannot satisfy finalization", async () => {
    const run = await setup(), intent = await readyDocuments(run);
    // The exact receipt owner, never a Project-only current lookup.
    const outcome = await executeDocumentArchiveOperation({ body: { operation: "DOC_ARCHIVE_STUDIO_INTENT_FINALIZE",
      sessionId: run.sessionId, projectRef: run.access2.project, intentId: intent.finalizationIntentId }, proof: run.access2.proof,
      clientAddress: run.identity.clientAddress, connection: null, environment: {}, archive: run.archive, snapshots: run.snapshots });
    expect(outcome.status).toBe(200);
    const finished = (outcome.body as { result: Awaited<ReturnType<typeof assessed>> }).result;
    expect(finished.resolution.documentReceipt!.generation.displayVersion).toBe(3);
    expect(finished.resolution.documentReceipt!.generation.generationId).not.toBe(run.g2.ref.generationId);
  });
  it("F: a qualified exact checkpoint is consumed at runtime with zero new WD", async () => {
    const run = await finalizationHarness("science"), prepared = await prepare({ ...run, session: run.session() });
    run.setSession(prepared.session);
    const finished = await run.runtime.run(run.revision, () => undefined);
    expect(finished!.state).toBe("CLOSED"); expect(run.preparePort).not.toHaveBeenCalled();
    expect(run.adopted).toHaveBeenCalledTimes(1);
  });
  it("K: mixed scientific change and compatible editorial title both survive", async () => {
    const run = await finalizationHarness("science", true, true);
    const finished = await run.runtime.run(run.revision, () => undefined);
    const saved = await run.archive.body(run.access2, finished!.resolution.documentReceipt!.generation.generationId);
    if (saved.body.native.family !== "DRCI") throw new Error("Expected native pack");
    const protocol = saved.body.native.value.documents.find(doc => doc.kind === "PROTOCOL_FULL")!;
    expect(protocol.title).toBe(run.revision.content.title);
    expect(protocol.sections.flatMap(section => section.paragraphs).join(" ")).toContain("multicentrique");
    expect(run.preparePort).toHaveBeenCalledTimes(1);
  });
  it("P: client publication exception cannot replace proven V3 with false failure", async () => {
    const run = await finalizationHarness(); run.committed.mockRejectedValueOnce(new Error("OFFLINE_CLIENT_AFTER_COMMIT"));
    const finished = await run.runtime.run(run.revision, () => undefined);
    expect(finished!.resolution.documentReceipt!.generation.displayVersion).toBe(3);
    expect(run.committed).toHaveBeenCalledTimes(2);
  });
  it("D/K/M/R/S: editorial V2 → V3, PRJ unchanged, zero WD/provider, immutable V2 and new draft base", async () => {
    const run = await finalizationHarness(), old = JSON.stringify(run.g2.body), stages: string[] = [];
    const finished = await run.runtime.run(run.revision, stage => stages.push(stage));
    const receipt = finished!.resolution.documentReceipt!;
    expect(finished!.state).toBe("CLOSED"); expect(receipt.generation.displayVersion).toBe(3);
    expect(receipt.generation.project).toEqual(run.g2.ref.project);
    expect(receipt.generation.generationId).not.toBe(run.g2.ref.generationId);
    expect(run.preparePort).not.toHaveBeenCalled(); expect(run.generate).not.toHaveBeenCalled(); expect(run.adopted).not.toHaveBeenCalled();
    expect(stages).not.toContain("SCIENCE");
    const saved = await run.archive.body(run.access2, receipt.generation.generationId);
    expect(saved.body.native.family).toBe("DRCI");
    if (saved.body.native.family === "DRCI" && run.g2.body.native.family === "DRCI") {
      expect(saved.body.native.value.documents.find(d => d.kind === "PROTOCOL_FULL")!.title).toBe(run.revision.content.title);
      expect(saved.body.native.value.documents.filter(d => d.kind !== "PROTOCOL_FULL")).toEqual(run.g2.body.native.value.documents.filter(d => d.kind !== "PROTOCOL_FULL"));
      expect(saved.body.native.value.crfRows).toEqual(run.g2.body.native.value.crfRows);
    }
    expect(JSON.stringify((await run.archive.body(run.access2, run.g2.ref.generationId)).body)).toBe(old);
    expect((await run.owner.get(run.access2, run.revision.revisionId)).revision.status).toBe("ABANDONED");
    const newDraft = await run.owner.open(run.access2, { baseGenerationId: receipt.generation.generationId,
      baseGenerationBodyDigest: receipt.generation.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" });
    expect(newDraft.revision.baseGenerationId).toBe(receipt.generation.generationId);
    expect(newDraft.revision.revisionId).not.toBe(run.revision.revisionId);
  });
  it("C: no-op closes with no generation, no WD and no provider", async () => {
    const run = await finalizationHarness("none"), before = run.fixture.rows();
    const finished = await run.runtime.run(run.revision, () => undefined);
    expect(finished!.resolution.documentNoChange).toBe(true); expect(finished!.resolution.documentReceipt).toBeUndefined();
    expect(run.fixture.rows()).toEqual(before); expect(run.preparePort).not.toHaveBeenCalled(); expect(run.generate).not.toHaveBeenCalled();
  });
  it("D/S: successive editorial versions retain native ancestry on the same Project with zero WD", async () => {
    const run = await finalizationHarness(), first = await run.runtime.run(run.revision, () => undefined);
    const v3 = await run.archive.body(run.access2, first!.resolution.documentReceipt!.generation.generationId);
    const frozenV3 = JSON.stringify(v3.body);
    let { revision } = await run.owner.open(run.access2, { baseGenerationId: v3.ref.generationId,
      baseGenerationBodyDigest: v3.ref.bodySha256, nativeDocumentRef: "PROTOCOL_FULL" });
    revision = (await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence,
      content: { ...revision.content, title: revision.content.title + " — seconde révision éditoriale" } })).revision;
    const frozen = await freezeStudioFinalizationWork({ session: run.session(), revision, source: v3,
      projectionSource: await run.archive.body(run.access2, run.g2.projection.projectionId) });
    let intent = await run.intents.create(run.access2, frozen);
    intent = await run.intents.assess(run.access2, intent.finalizationIntentId, intent.sequence, assessment({ ...run, session: run.session(), frozen }));
    intent = await run.intents.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence, documentSource({ ...run, session: run.session() }));
    intent = await run.intents.finalizeDocuments(run.access2, intent.finalizationIntentId);
    expect(intent.resolution.documentReceipt!.generation.displayVersion).toBe(4);
    expect(intent.resolution.documentReceipt!.generation.project).toEqual(run.g2.ref.project);
    expect(JSON.stringify((await run.archive.body(run.access2, v3.ref.generationId)).body)).toBe(frozenV3);
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([4, 3, 2, 1]);
    expect(run.preparePort).not.toHaveBeenCalled(); expect(run.generate).not.toHaveBeenCalled();
  });
  it("N/V: exact retry and process reload resolve one V3, never old same-Project V2", async () => {
    const run = await finalizationHarness(), first = await run.runtime.run(run.revision, () => undefined);
    const restarted = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    const recovered = await restarted.finalizationIntents!.finalizeDocuments(run.access2, first!.finalizationIntentId);
    expect(recovered).toEqual(first);
    expect((await restarted.history(run.access2, undefined, "DRCI")).entries.map(ref => ref.displayVersion)).toEqual([3, 2, 1]);
    expect(recovered.resolution.documentReceipt!.requestId).toBe(studioDocumentRequestId(first!));
    expect(run.fixture.rows().filter(row => row.state === "COMMITTED" && (row.metadata as { family: string }).family === "DRCI")).toHaveLength(3);
  });
  it("O: archive failure preserves V2 and draft, same intent retry produces one V3", async () => {
    const run = await setup(), intent = await readyDocuments(run); run.fixture.failMetadataCommit(true);
    await expect(run.intents.finalizeDocuments(run.access2, intent.finalizationIntentId)).rejects.toThrow();
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries[0]).toEqual(run.g2.ref);
    expect((await run.owner.get(run.access2, run.revision.revisionId)).revision.status).toBe("ACTIVE");
    run.fixture.failMetadataCommit(false);
    const finished = await run.intents.finalizeDocuments(run.access2, intent.finalizationIntentId);
    expect(finished.resolution.documentReceipt!.generation.displayVersion).toBe(3);
  });
  it("P: post-commit intent-ack failure recovers exact V3 after a new process", async () => {
    const run = await setup(), intent = await readyDocuments(run); run.fixture.failIntentSave(true);
    await expect(run.intents.finalizeDocuments(run.access2, intent.finalizationIntentId)).rejects.toThrow();
    const receipt = await run.archive.receipt(run.access2, studioDocumentRequestId(intent));
    expect(receipt!.generation.displayVersion).toBe(3);
    run.fixture.failIntentSave(false);
    const restarted = createPostgresDocumentArchive("postgres://offline", run.snapshots, documentArchiveCapacity({}), run.fixture.sql);
    const recovered = await restarted.finalizationIntents!.finalizeDocuments(run.access2, intent.finalizationIntentId);
    expect(recovered.state).toBe("CLOSED"); expect(recovered.resolution.documentReceipt).toEqual(receipt);
  });
  it("T/U/V: late Studio save and conversation excluded, retained; reload recovers original intent", async () => {
    const run = await setup("editorial", false), intent = await readyDocuments(run), content = structuredClone(run.revision.content);
    content.title += " — suite tardive";
    const later = (await run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: run.revision.saveSequence, content })).revision;
    const recovered = await run.intents.recoverActive(run.access2, later.revisionId);
    expect(recovered!.frozen.workingRevisionSaveSequence).toBe(run.revision.saveSequence);
    const finished = await run.intents.finalizeDocuments(run.access2, intent.finalizationIntentId);
    const body = (await run.archive.body(run.access2, finished.resolution.documentReceipt!.generation.generationId)).body;
    expect(JSON.stringify(body.native)).not.toContain("suite tardive");
    expect((await run.owner.get(run.access2, later.revisionId)).revision).toEqual(later);
    expect(later.status).toBe("ACTIVE");
  });
  it("G/H: native scientific/mixed runtime invokes one preparation and resumes same intent after adoption", async () => {
    for (const mixed of [false, true]) {
      const run = await finalizationHarness("science", mixed);
      const finished = await run.runtime.run(run.revision, () => undefined);
      expect(finished!.state).toBe("CLOSED"); expect(finished!.finalizationIntentId).toBe(run.intent.finalizationIntentId);
      expect(run.preparePort).toHaveBeenCalledTimes(1); expect(run.adopted).toHaveBeenCalledTimes(1); expect(run.generate).toHaveBeenCalledTimes(1);
      expect(run.session().project!.revision).toBe(3);
      expect(finished!.resolution.documentReceipt!.generation.project.projectDigest).toBe(run.session().project!.projectDigest);
      expect(finished!.resolution.documentReceipt!.generation.displayVersion).toBe(3);
      expect(run.session().runtimeTurns.filter(turn => turn.role === "USER")).toHaveLength(mixed ? 1 : 0);
    }
  });
  it("E: owner-proven already adopted science finalizes without WD", async () => {
    const run = await setup("already-adopted"), request = run.frozen.scientificSources.request;
    const object = request.currentProject.objects.find(o => o.content === "étude multicentrique")!;
    const result = acceptStudioAssessment(request, run.project2, { ...assessment(run, "PROJECT_CHANGE").nativePayload,
      edits: request.delta.filter(e => e.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef,
        classification: "PROJECT_CHANGE", reason: "Complete adopted meaning", provenanceRefs: [edit.editRef],
        projectCoverage: { coverage: "COMPLETE", projectVersionRefs: [object.versionRef] }, ambiguity: null })) }, NOW);
    let intent = await run.intents.assess(run.access2, run.intent.finalizationIntentId, run.intent.sequence, result);
    intent = await run.intents.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence, documentSource(run));
    const finished = await run.intents.finalizeDocuments(run.access2, intent.finalizationIntentId);
    expect(finished.resolution.preparation).toBeNull(); expect(finished.resolution.documentReceipt!.generation.project).toEqual(run.g2.ref.project);
  });
  it("Q: PRJ adoption survives DOC failure; same intent recoverable, documents stale", async () => {
    const run = await finalizationHarness("science"); run.fixture.failMetadataCommit(true);
    await expect(run.runtime.run(run.revision, () => undefined)).rejects.toThrow();
    expect(run.session().project!.revision).toBe(3);
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries[0].project.projectDigest).not.toBe(run.session().project!.projectDigest);
    const intent = await run.intents.get(run.access2, run.intent.finalizationIntentId);
    expect(intent.resolution.resolvedProject!.projectDigest).toBe(run.session().project!.projectDigest);
    expect(intent.state).not.toBe("CLOSED"); expect((await run.owner.get(run.access2, run.revision.revisionId)).revision.status).toBe("ACTIVE");
  });
  it("J: material ambiguity remains non-adopting and creates no version", async () => {
    const run = await setup("science"), intent = await assessed(run, "AMBIGUOUS");
    await expect(run.intents.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence, documentSource(run))).rejects.toThrow();
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(r => r.displayVersion)).toEqual([2, 1]);
    expect((await run.owner.get(run.access2, run.revision.revisionId)).revision.status).toBe("ACTIVE");
  });
  it("wrong resolved Project or projection is refused before any documentary dispatch", async () => {
    const run = await setup(), intent = await assessed(run), source = documentSource(run);
    await expect(run.intents.prepareDocuments(run.access2, intent.finalizationIntentId, intent.sequence,
      { ...source, handoffDecision: { ...source.handoffDecision, timestamp: "2026-10-08T20:00:00.000Z" } })).rejects.toThrow("STUDIO_DOCUMENT_SOURCE_INVALID");
    expect((await run.archive.history(run.access2, undefined, "DRCI")).entries.map(r => r.displayVersion)).toEqual([2, 1]);
  });
});
