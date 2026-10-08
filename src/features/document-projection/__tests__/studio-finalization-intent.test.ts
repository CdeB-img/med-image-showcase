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

const NOW = "2026-10-08T12:00:00.000Z";
const setup = async (kind: "editorial" | "science" | "none" | "already-adopted" = "editorial", mixed = false) => {
  const run = await workingRevisionFixture({ monocentric: kind !== "already-adopted" });
  let { revision } = await run.owner.create(run.access2, run.createInput);
  if (kind !== "none") {
    const content = structuredClone(revision.content);
    if (kind === "science") content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("monocentrique", "multicentrique");
    else if (kind === "already-adopted") content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("étude multicentrique", "Étude conduite dans plusieurs centres");
    else content.title += " — rédaction humaine";
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
    edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef, classification,
      reason: "Exact controlled Scientific Thinking assessment", provenanceRefs: [edit.editRef], projectCoverage: null,
      ambiguity: classification === "AMBIGUOUS" ? { question: "Remplacement ou ajout d’un centre pour un sous-groupe ?",
        materialProjectRefs: [request.currentProject.objects[0].versionRef], alternatives: [
          { interpretation: "Remplacement", consequence: "Tous les participants sont concernés" },
          { interpretation: "Ajout", consequence: "Un sous-groupe seulement est concerné" }] } : null })) }, NOW);
};
const assessed = async (run: Awaited<ReturnType<typeof setup>>, classification: Parameters<typeof assessment>[1] = "DOCUMENT_ONLY") =>
  run.intents.assess(run.access2, run.intent.finalizationIntentId, run.intent.sequence, assessment(run, classification));
const prepare = async (run: Awaited<ReturnType<typeof setup>>) => {
  let intent = await assessed(run, "PROJECT_CHANGE");
  const capture = captureStudioIntentPreparation(intent, run.session, run.revision, NOW);
  const preparation = capture.preparation!, cp = preparation.checkpoint!;
  intent = await run.intents.linkPreparation(run.access2, intent.finalizationIntentId, intent.sequence, preparation);
  const domain = { ...DOMAINS[1], question: "Évaluer la colchicine versus placebo après infarctus", population: "Adultes après infarctus",
    design: "étude multicentrique", outcome: "Critère de recherche après infarctus", exposure: "Colchicine versus placebo" };
  const proposal = controlledStudyProposal(cp.inputDigest, domain as typeof DOMAINS[1]);
  const target = cp.request.studioPreparationSource!.request.currentProject.objects.find(object => object.content === "étude monocentrique")!;
  proposal.atoms.find(atom => atom.ref === "design")!.userChangeRefs = [target.versionRef];
  const output = { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [],
    explicitStudioDecisions: run.frozen.scientificSources.request.delta.filter(edit => edit.change !== "UNCHANGED")
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
  intent = await run.intents.linkPreparation(run.access2, intent.finalizationIntentId, intent.sequence, ready);
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
