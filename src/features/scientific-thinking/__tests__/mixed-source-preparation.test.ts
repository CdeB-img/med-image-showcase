import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge, handleProtocolDesignerBridge } from "../../../../api/protocol-designer-bridge";
import { createMemoryProtocolDesignerGuardForTests } from "../../../../server/protocol-designer-durable-guard";
import { workingRevisionFixture } from "../../document-projection/__tests__/working-revision-fixture";
import { createStudioReconciliationRequest } from "../../document-projection/studio-reconciliation";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { buildScientificPreparationSourceSet } from "../preparation-source-set";
import { acceptStudioAssessment } from "../studio-runtime";
import { createFunctionalResetSession, loadFunctionalResetSession, type FunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { captureStudioScientificState } from "../../protocol-designer/functional-reset/studio-scientific-context";
import { captureStudioProjectPreparation, captureProjectPreparation, addProjectPreparation, consumeProjectPreparation,
  preparationCheckpointValid } from "../../protocol-designer/functional-reset/project-preparation-lifecycle";
import { controlledStudyProposal, DOMAINS } from "../../protocol-designer/functional-reset/__tests__/study-proposal-fixtures";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest, workingDraftInputDigest } from "../../protocol-designer/functional-reset/continuous-project-build";
import { retainScientificDiscussionResult, settleRetainedDiscussionAdoption } from "../../protocol-designer/functional-reset/contribution-discussion-retention";
import { createProductKnowledgeOwnerLedger } from "../../protocol-designer/product-knowledge-owner-runtime";
import { createProductValidationRunLedger } from "../../protocol-designer/product-validation-run-ledger";
import { createScientificExecutionTraceLedger } from "../../protocol-designer/scientific-execution-trace";
import { confirmResearchProjectContribution } from "../../research-project-construction/contribution-owner-boundary";
import { propagateStudyProposalDecision } from "../../protocol-designer/functional-reset/study-proposal-standard";

const NOW = "2026-10-08T10:00:00.000Z";
const setup = async (studioChange = true, conversationChange = true, meanings = ["Adultes après infarctus"]) => {
  const run = await workingRevisionFixture({ monocentric: true });
  let { revision } = await run.owner.create(run.access2, run.createInput);
  if (studioChange) {
    const content = structuredClone(revision.content);
    content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("monocentrique", "multicentrique");
    revision = (await run.owner.save(run.access2, { revisionId: revision.revisionId, expectedSaveSequence: revision.saveSequence, content })).revision;
  }
  const fresh = createFunctionalResetSession(NOW);
  const userTurn = { turnId: "user-turn:11111111-1111-4111-8111-111111111111", role: "USER" as const,
    content: `Contribution scientifique : ${meanings.join(" ; ")}`, createdAt: NOW };
  const assistantTurn = { turnId: "noxia-turn:22222222-2222-4222-8222-222222222222", role: "NOXIA" as const,
    content: "Cette population est comprise ; le design reste à confirmer.", createdAt: NOW };
  const runtimeTurns = conversationChange ? [userTurn, assistantTurn] : [];
  const retention = conversationChange ? retainScientificDiscussionResult({ conversationId: "mixed-science", runtimeTurns,
    userTurn, assistantTurn, retained: [], result: { reply: assistantTurn.content,
      userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: meanings.map((content, index) => ({ id: `meaning-${index}`, content,
        epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] })) },
      assistantContribution: { coverage: "COMPLETE", nonPersistentReason: "PRESENTATION_ONLY", elements: [] }, dispositions: [], candidateBindings: [] } }) : undefined;
  const session: FunctionalResetSession = { ...fresh, sessionId: run.sessionId, projectId: run.project2.projectId,
    project: run.project2, conversationId: "mixed-science", runtimeTurns, scientificDiscussionRetention: retention,
    knowledgeOwnerLedger: createProductKnowledgeOwnerLedger(run.sessionId), validationRunLedger: createProductValidationRunLedger(run.sessionId),
    scientificExecutionTraceLedger: createScientificExecutionTraceLedger(run.sessionId),
    documentArchive: { ...fresh.documentArchive!, projectId: run.project2.projectId } };
  const source = { ref: run.g2.ref, body: run.g2.body }, projectionSource = await run.archive.body(run.access2, run.g2.projection.projectionId);
  const sourceFor = async (state = session, saved = revision) => {
    const scientificState = captureStudioScientificState(state);
    const request = await createStudioReconciliationRequest({ revision: saved, source, projectionSource, currentProject: state.project!, scientificState });
    const assessment = acceptStudioAssessment(request, state.project!, { requestDigest: request.requestDigest,
      scientificStateDisposition: scientificState.pendingTurnRef || scientificState.pendingPreparationId ? "PENDING_HUMAN_CONFIRMATION" : "NO_NET_CHANGE",
      scientificStateReason: "Controlled native scientific source state", scientificStateAmbiguity: null,
      edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef, classification: "PROJECT_CHANGE",
        reason: "Controlled scientific impact", provenanceRefs: edit.provenanceRefs, projectCoverage: null, ambiguity: null })) }, NOW);
    return { request, assessment };
  };
  return { ...run, revision, session, sourceFor, source: await sourceFor() };
};
const outputFor = (request: ReturnType<typeof captureProjectPreparation>["checkpoint"]) => {
  const domain = { ...DOMAINS[1], question: "Évaluer la colchicine versus placebo après infarctus", population: "Adultes après infarctus",
    design: "Essai multicentrique randomisé colchicine versus placebo", outcome: "Critère de recherche après infarctus", exposure: "Colchicine versus placebo" };
  const proposal = controlledStudyProposal(request!.inputDigest, domain as typeof DOMAINS[1]);
  const target = request!.request.studioPreparationSource!.request.currentProject.objects.find(object => object.content === "étude monocentrique")!;
  proposal.atoms.find(atom => atom.ref === "design")!.userChangeRefs = [target.versionRef];
  const edits = request!.request.studioPreparationSource!.request.delta.filter(edit => edit.change !== "UNCHANGED");
  return { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [],
    explicitStudioDecisions: edits.map(edit => ({ atomRef: "design", editRef: edit.editRef, quote: edit.afterText })),
    retainedDiscussionBindings: request!.request.scientificDiscussionContext?.retainedMeaning?.map(element => ({ elementRef: element.ref,
      sourceTurnRef: element.sourceTurnRef, atomRefs: ["population"] })) ?? [],
    ...(request!.request.scientificPreparationSourceSet ? { sourceSetBindings: request!.request.scientificPreparationSourceSet.sources
      .filter(source => source.status === "PENDING").map(source => ({ sourceRef: source.ref, coverage: "COMPLETE" as const,
        atomRefs: source.origin === "STUDIO" ? ["design"] : "pendingAtomRefs" in source.native ? [...source.native.pendingAtomRefs] : ["population"] })) } : {}),
    inferredAtomRefs: [], rejectedAtomRefs: [] };
};
const execute = async (run: Awaited<ReturnType<typeof setup>>) => {
  const capture = captureStudioProjectPreparation(run.session, run.source, run.revision);
  const preparation = capture.preparation!, checkpoint = preparation.checkpoint!;
  const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_MIXED", model: "fixture-model", status: "completed",
    output: [{ content: [{ type: "output_text", text: JSON.stringify(outputFor(checkpoint)) }] }], usage: { input_tokens: 200, output_tokens: 100, total_tokens: 300 } })));
  const result = await executeProtocolDesignerBridge({ body: checkpoint.request, fetchImpl, openAiApiKey: "OFFLINE", apiKey: null,
    autonomousProjectBuild: true, chatRuntime: "TERRA", now: () => Date.parse(NOW) });
  expect(result.status, JSON.stringify(result.body)).toBe(200);
  const ready = consumeProjectPreparation(addProjectPreparation(run.session, preparation), checkpoint.preparationId,
    result.body as Parameters<typeof consumeProjectPreparation>[2]);
  expect(ready.workingDraftPreparations!.at(-1)!.status, ready.workingDraftPreparations!.at(-1)!.code ?? "").toBe("READY_FOR_REVIEW");
  return { ready, preparation, fetchImpl, result };
};

describe("one governed scientific preparation for conversation + Studio", () => {
  it("A/B: conversation-only checkpoint remains native; Studio-only keeps its qualified producer", async () => {
    const conversation = await setup(false);
    expect(captureProjectPreparation(conversation.session).checkpoint!.request.studioPreparationSource).toBeUndefined();
    const studio = await setup(true, false), completed = await execute(studio);
    expect(completed.fetchImpl).toHaveBeenCalledTimes(1);
    expect(completed.preparation.checkpoint!.request.scientificPreparationSourceSet).toBeUndefined();
  });
  it("C/G: one full mixed runtime operation, distinct provenance, exact reuse including reload", async () => {
    const run = await setup(), before = JSON.stringify(run.session.project), completed = await execute(run);
    const set = completed.preparation.checkpoint!.request.scientificPreparationSourceSet!;
    expect(new Set(set.sources.map(source => source.origin))).toEqual(new Set(["CONVERSATION", "STUDIO"]));
    expect(completed.fetchImpl).toHaveBeenCalledTimes(1);
    const packet = JSON.parse(prepareWorkingDraftRequest(completed.preparation.checkpoint!.request).context);
    expect(packet.RECENT_CONVERSATION).toEqual([]); expect(packet.SCIENTIFIC_SOURCE_SET.sourceSetDigest).toBe(set.sourceSetDigest);
    const review = completed.ready.workingDraft!.readyReview!.contribution;
    expect(review.source.turns).toEqual([]);
    expect(review.source.sourceRefs).toContain(run.session.runtimeTurns[0].turnId);
    expect(review.source.sourceRefs).toContain(run.revision.revisionId);
    expect(review.scientificContent.candidateObjects.find(item => item.content === "Adultes après infarctus")?.epistemicBoundary?.originType)
      .toBe("CONVERSATION_SCIENTIFIC_PREPARATION");
    expect(captureStudioProjectPreparation(completed.ready, run.source, run.revision).action).toBe("REUSE_VALID_PREPARATION");
    const restored = loadFunctionalResetSession({ getItem: () => JSON.stringify(completed.ready) }, undefined, true);
    expect(captureStudioProjectPreparation(restored, run.source, run.revision).action).toBe("REUSE_VALID_PREPARATION");
    expect(JSON.stringify(completed.ready.project)).toBe(before); expect(completed.ready.runtimeTurns).toEqual(run.session.runtimeTurns);
  });
  it("D/M: exact cross-source proof groups one change with both origins; order and lexical similarity grant no equivalence", async () => {
    const run = await setup(), capture = captureStudioProjectPreparation(run.session, run.source, run.revision).preparation!;
    const discussion = capture.checkpoint!.request.scientificDiscussionContext!, element = discussion.retainedMeaning![0];
    const edit = run.source.request.delta.find(item => item.change !== "UNCHANGED")!;
    const { requestId: _id, requestDigest: _digest, ...material } = run.source.request;
    const changed = { ...material, delta: material.delta.map(item => item.editRef === edit.editRef
      ? { ...item, afterText: element.content, afterDigest: logicalDigest(element.content), provenanceRefs: [...item.provenanceRefs, element.ref] } : item) };
    const requestDigest = logicalDigest(changed), request = { ...changed, requestDigest, requestId: `studio-reconciliation:${requestDigest}` };
    const assessment = acceptStudioAssessment(request, run.project2, { ...run.source.assessment.nativePayload, requestDigest,
      edits: run.source.assessment.nativePayload.edits.map(item => ({ ...item, provenanceRefs: [element.ref] })) }, NOW);
    const input = { project: run.project2, studio: { request, assessment }, discussion };
    const set = buildScientificPreparationSourceSet(input);
    expect(set.groups).toHaveLength(1); expect(set.groups[0].proof).toBe("EXACT_NATIVE_BINDING"); expect(set.groups[0].sourceRefs).toHaveLength(2);
    const permuted = { ...discussion, retainedMeaning: [...discussion.retainedMeaning!].reverse(), active: [...discussion.active].reverse(), sources: [...discussion.sources].reverse() };
    expect(buildScientificPreparationSourceSet({ ...input, discussion: permuted })).toEqual(set);
    const rawRequest = { ...capture.checkpoint!.request, studioPreparationSource: input.studio, scientificPreparationSourceSet: set,
      workingDraftScientificSource: { ...capture.checkpoint!.request.workingDraftScientificSource!,
        requestDigest, assessmentRef: assessment.resultId, sourceDigest: logicalDigest([element.content, element.content].join("\n")) } };
    const output = outputFor(capture.checkpoint); output.proposal.contextDigest = workingDraftInputDigest(rawRequest);
    output.explicitStudioDecisions = [{ atomRef: "population", editRef: edit.editRef, quote: element.content }];
    output.sourceSetBindings = output.sourceSetBindings!.map(binding => ({ ...binding, atomRefs: ["population"] }));
    const accepted = acceptWorkingDraftUpdate(output, rawRequest);
    expect(accepted.composition!.nativeSourceBindings!.filter(binding => binding.atomRefs.includes("population"))).toHaveLength(2);
    expect(accepted.composition!.proposal.atoms.filter(atom => atom.ref === "population")).toHaveLength(1);
    expect(() => acceptWorkingDraftUpdate({ ...output, explicitStudioDecisions: [{ ...output.explicitStudioDecisions[0], atomRef: "design" }] }, rawRequest))
      .toThrow("WORKING_DRAFT_MIXED_SOURCE_DUPLICATION_INVALID");
    const unproven = buildScientificPreparationSourceSet({ project: run.project2, studio: run.source, discussion });
    expect(unproven.groups.every(group => group.proof === "SINGLE_NATIVE_SOURCE")).toBe(true);
  });
  it("E: settled conversation meaning is filtered only through native adoption proof; Studio remains pending", async () => {
    const run = await setup(), completed = await execute(run), prepared = completed.ready.workingDraft!.readyReview!;
    const populationChange = prepared.candidate.canonicalChangeSet.objectChanges.find(change => change.candidate?.content === "Adultes après infarctus")!;
    const project = confirmResearchProjectContribution({ contribution: prepared.contribution, current: run.project2, projectId: run.project2.projectId,
      authority: run.session.projectAuthority, confirmedAt: NOW, reviewedProjection: prepared.candidate.humanReviewProjection,
      selectedChangeRefs: [populationChange.changeRef],
      confirmationSourceRefs: ["human:exact-qualified-scope"] });
    const composition = propagateStudyProposalDecision(completed.ready.studyProposal!, project, prepared.candidate, run.project2,
      ["population"], [], run.session.runtimeTurns[0], prepared.contribution);
    const retained = settleRetainedDiscussionAdoption(completed.ready.scientificDiscussionRetention, project, [], composition)!;
    expect(retained.elements.some(element => element.status === "ADOPTED")).toBe(true);
    expect(retained.elements).toHaveLength(run.session.scientificDiscussionRetention!.elements.length);
    const state = { ...run.session, project, scientificDiscussionRetention: retained, studyProposal: composition };
    const source = await run.sourceFor(state), capture = captureStudioProjectPreparation(state, source, run.revision).preparation!;
    expect(capture.checkpoint!.request.scientificPreparationSourceSet!.sources.filter(item => item.status === "PENDING").every(item => item.origin === "STUDIO")).toBe(true);
  });
  it("F/N: Studio COMPLETE native Project coverage is excluded; no pending source set does not run WD", async () => {
    const run = await setup();
    // Current qualified assessment contract, not local lexical matching.
    const current = (await workingRevisionFixture()).project3;
    const session = { ...run.session, project: current }, source = await run.sourceFor(session);
    const target = source.request.currentProject.objects.find(object => object.content === "étude multicentrique" && object.decisionRefs.length)!;
    const payload = { ...source.assessment.nativePayload, edits: source.assessment.nativePayload.edits.map(edit => ({ ...edit,
      projectCoverage: { coverage: "COMPLETE" as const, projectVersionRefs: [target.versionRef] } })) };
    const assessed = { request: source.request, assessment: acceptStudioAssessment(source.request, current, payload, NOW) };
    const capture = captureStudioProjectPreparation(session, assessed, run.revision).preparation!;
    expect(capture.checkpoint!.request.scientificPreparationSourceSet!.sources.filter(item => item.status === "PENDING").every(item => item.origin === "CONVERSATION")).toBe(true);
    const emptySession = { ...session, scientificDiscussionRetention: { ...session.scientificDiscussionRetention!, elements: session.scientificDiscussionRetention!.elements.map(element =>
      ({ ...element, status: "CLOSED" as const, dispositionSourceRef: session.runtimeTurns[0].turnId })) } };
    const emptySource = await run.sourceFor(emptySession);
    const emptyAssessment = acceptStudioAssessment(emptySource.request, current, { ...emptySource.assessment.nativePayload, edits: payload.edits }, NOW);
    expect(captureStudioProjectPreparation(emptySession, { request: emptySource.request, assessment: emptyAssessment }, run.revision)).toMatchObject({ action: "PROJECT_REUSE", preparation: null });
  });
  it("H: conversation-only prior preparation never covers additional Studio science", async () => {
    const run = await setup(), conversation = captureProjectPreparation(run.session);
    const active = addProjectPreparation(run.session, conversation), sourceDuring = await run.sourceFor(active);
    expect(captureStudioProjectPreparation(active, sourceDuring, run.revision).preparation).toBe(conversation);
    const domain = { ...DOMAINS[1],
      question: "Évaluer la colchicine versus placebo après infarctus", population: "Adultes après infarctus",
      design: "Essai monocentrique randomisé colchicine versus placebo", outcome: "Critère de recherche après infarctus", exposure: "Colchicine versus placebo" };
    const proposal = controlledStudyProposal(conversation.checkpoint!.inputDigest, domain as typeof DOMAINS[1]);
    const output = acceptWorkingDraftUpdate({ requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }, conversation.checkpoint!.request);
    const state = consumeProjectPreparation(active, conversation.checkpoint!.preparationId,
      { workingDraftUpdate: output.update, workingStudyProposal: output.composition });
    expect(state.workingDraftPreparations!.at(-1)!.status).toBe("READY_FOR_REVIEW");
    const source = await run.sourceFor(state);
    const mixed = captureStudioProjectPreparation(state, source, run.revision).preparation!;
    expect(mixed.checkpoint!.inputDigest).not.toBe(conversation.checkpoint!.inputDigest);
    expect(mixed.checkpoint!.request.scientificPreparationSourceSet!.sources.map(item => item.origin)).toContain("STUDIO");
    expect(mixed.checkpoint!.preparationId).not.toBe(conversation.checkpoint!.preparationId);
    const completed = await execute({ ...run, session: state, source });
    expect(completed.fetchImpl).toHaveBeenCalledTimes(1);
    expect(captureStudioProjectPreparation(completed.ready, source, run.revision).action).toBe("REUSE_VALID_PREPARATION");
  });
  it("I: incompatible interpretations route existing QRY/human path, retain sources and never mutate Project", async () => {
    const run = await setup(true, true, ["Étude monocentrique"]), capture = captureStudioProjectPreparation(run.session, run.source, run.revision).preparation!;
    const set = capture.checkpoint!.request.scientificPreparationSourceSet!;
    expect(set.sources.some(source => "content" in source.native && source.native.content === "Étude monocentrique")).toBe(true);
    expect(set.sources.some(source => "afterText" in source.native && source.native.afterText.includes("multicentrique"))).toBe(true);
    const update = acceptWorkingDraftUpdate({ requestType: "TARGETED_QUESTION", proposal: null, explicitDecisions: [], explicitStudioDecisions: [],
      sourceSetBindings: [], inferredAtomRefs: [], rejectedAtomRefs: [] }, capture.checkpoint!.request);
    const stopped = consumeProjectPreparation(addProjectPreparation(run.session, capture), capture.checkpoint!.preparationId,
      { workingDraftUpdate: update.update, workingStudyProposal: null });
    expect(stopped.workingDraftPreparations!.at(-1)!.code).toBe("MIXED_SCIENTIFIC_CLARIFICATION_REQUIRED");
    expect(captureStudioProjectPreparation(stopped, run.source, run.revision).action).toBe("EXISTING_QRY_PATH");
    expect(stopped.project).toBe(run.session.project); expect(stopped.scientificDiscussionRetention).toBe(run.session.scientificDiscussionRetention);
  });
  it("J/K/L: late sources remain outside immutable checkpoint; stale saves and changed conversation invalidate reuse", async () => {
    const run = await setup(), completed = await execute(run), checkpoint = completed.preparation.checkpoint!, frozen = JSON.stringify(checkpoint);
    const late = { ...completed.ready, runtimeTurns: [...completed.ready.runtimeTurns, { turnId: "late:user", role: "USER" as const,
      content: "Ajouter une visite de sécurité", createdAt: NOW }] };
    expect(preparationCheckpointValid(late, checkpoint)).toBe(true); expect(JSON.stringify(checkpoint)).toBe(frozen);
    expect(() => captureStudioProjectPreparation(late, run.source, run.revision)).toThrow("STUDIO_SCIENTIFIC_STATE_STALE");
    const content = structuredClone(run.revision.content); content.title += " sauvegarde suivante";
    const nextSave = (await run.owner.save(run.access2, { revisionId: run.revision.revisionId, expectedSaveSequence: run.revision.saveSequence, content })).revision;
    expect(() => captureStudioProjectPreparation(completed.ready, run.source, nextSave)).toThrow("STUDIO_RECONCILIATION_STALE");
    const changed = { ...run.session, runtimeTurns: run.session.runtimeTurns.map(turn => turn.role === "USER" ? { ...turn, content: "Population changée" } : turn) };
    expect(preparationCheckpointValid(changed, checkpoint)).toBe(false);
    expect(late.runtimeTurns.at(-1)!.content).toBe("Ajouter une visite de sécurité");
  });
  it("producer omission or split native duplicate cannot pass the governed source-set boundary", async () => {
    const run = await setup(), preparation = captureStudioProjectPreparation(run.session, run.source, run.revision).preparation!;
    const missing = { ...outputFor(preparation.checkpoint), retainedDiscussionBindings: [] };
    expect(() => acceptWorkingDraftUpdate(missing, preparation.checkpoint!.request)).toThrow("WORKING_DRAFT_MIXED_SOURCE_COVERAGE_INVALID");
    expect(() => acceptWorkingDraftUpdate({ ...outputFor(preparation.checkpoint), explicitStudioDecisions: [] }, preparation.checkpoint!.request))
      .toThrow("WORKING_DRAFT_MIXED_SOURCE_COVERAGE_INVALID");
    for (const coverage of ["PARTIAL", "UNKNOWN"] as const) expect(() => acceptWorkingDraftUpdate({ ...outputFor(preparation.checkpoint),
      sourceSetBindings: outputFor(preparation.checkpoint).sourceSetBindings!.map(binding => ({ ...binding, coverage })) }, preparation.checkpoint!.request))
      .toThrow("WORKING_DRAFT_MIXED_SOURCE_COVERAGE_INVALID");
    expect(() => acceptWorkingDraftUpdate({ ...outputFor(preparation.checkpoint), sourceSetBindings: [] }, preparation.checkpoint!.request))
      .toThrow("WORKING_DRAFT_MIXED_SOURCE_COVERAGE_INVALID");
    expect(() => acceptWorkingDraftUpdate({ ...outputFor(preparation.checkpoint), sourceSetBindings: outputFor(preparation.checkpoint).sourceSetBindings!
      .map(binding => ({ ...binding, sourceRef: "unrelated:source" })) }, preparation.checkpoint!.request))
      .toThrow("WORKING_DRAFT_MIXED_SOURCE_COVERAGE_INVALID");
  });
  it("M: two governed meanings have canonical ordering; added, removed or changed meaning changes preparation identity", async () => {
    const run = await setup(true, true, ["Adultes après infarctus", "IRM cardiaque au suivi"]);
    const checkpoint = captureStudioProjectPreparation(run.session, run.source, run.revision).preparation!.checkpoint!;
    const request = checkpoint.request, discussion = request.scientificDiscussionContext!, set = request.scientificPreparationSourceSet!;
    expect(discussion.retainedMeaning).toHaveLength(2);
    const permuted = { ...discussion, retainedMeaning: [...discussion.retainedMeaning!].reverse(), sourceCoverage: [...discussion.sourceCoverage!].reverse(),
      sources: [...discussion.sources].reverse() };
    const same = buildScientificPreparationSourceSet({ project: run.project2, studio: run.source, discussion: permuted });
    expect(same).toEqual(set);
    expect(workingDraftInputDigest({ ...request, scientificPreparationSourceSet: same })).toBe(checkpoint.inputDigest);
    const removed = buildScientificPreparationSourceSet({ project: run.project2, studio: run.source,
      discussion: { ...discussion, retainedMeaning: [discussion.retainedMeaning![0]] } });
    const changed = buildScientificPreparationSourceSet({ project: run.project2, studio: run.source,
      discussion: { ...discussion, retainedMeaning: discussion.retainedMeaning!.map(element => ({ ...element, content: `${element.content} modifié` })) } });
    expect(removed.sourceSetDigest).not.toBe(set.sourceSetDigest); expect(changed.sourceSetDigest).not.toBe(set.sourceSetDigest);
    expect(workingDraftInputDigest({ ...request, scientificPreparationSourceSet: removed })).not.toBe(checkpoint.inputDigest);
    expect(workingDraftInputDigest({ ...request, scientificPreparationSourceSet: changed })).not.toBe(checkpoint.inputDigest);
  });
  it("public mixed runtime uses existing durable admission: exact replay performs no second WD operation", async () => {
    const run = await setup(), guard = createMemoryProtocolDesignerGuardForTests();
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ id: "OFFLINE_MIXED_GUARD", model: "gpt-6-sol", status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(run.source.assessment.nativePayload) }] }],
      usage: { input_tokens: 200, output_tokens: 100, total_tokens: 300 } })));
    const invoke = async (body: unknown) => {
      let status = 0, response: unknown;
      await handleProtocolDesignerBridge({ method: "POST", headers: { "content-type": "application/json", origin: "https://noxia-imagerie.fr",
        host: "noxia-imagerie.fr", "x-forwarded-for": run.identity.clientAddress, "x-noxia-project-snapshot-proof": run.access2.proof }, body }, {
        setHeader() {}, status(code) { status = code; return this; }, json(value) { response = value; },
      }, { NODE_ENV: "production", OPENAI_PROVIDER: "azure", AZURE_OPENAI_PROJECT_ENDPOINT: "https://fixture.services.ai.azure.com/api/projects/fixture",
        AZURE_OPENAI_API_KEY: "OFFLINE", VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME: "TERRA", VITE_AUTONOMOUS_PROJECT_BUILD: "ON" },
      { fetchImpl, durableGuard: guard, projectSnapshotStore: run.snapshots, documentArchive: run.archive });
      return { status, response };
    };
    const assessed = await invoke({ apiVersion: "1.0.0", operation: "STUDIO_SCIENTIFIC_ASSESSMENT", studioRequest: run.source.request,
      currentProject: run.project2, observabilityContext: { sessionId: run.sessionId, conversationId: "mixed-science", turnId: null,
        clientRequestId: `studio-assessment:${run.source.request.requestDigest}`, testSessionId: null } });
    expect(assessed.status, JSON.stringify(assessed.response)).toBe(200);
    const source = { request: run.source.request, assessment: (assessed.response as { studioAssessment: typeof run.source.assessment }).studioAssessment };
    const preparation = captureStudioProjectPreparation(run.session, source, run.revision).preparation!;
    fetchImpl.mockImplementation(async () => new Response(JSON.stringify({ id: "OFFLINE_MIXED_WD", model: "gpt-6-sol", status: "completed",
      output: [{ content: [{ type: "output_text", text: JSON.stringify(outputFor(preparation.checkpoint)) }] }],
      usage: { input_tokens: 200, output_tokens: 100, total_tokens: 300 } })));
    const result = await invoke(preparation.checkpoint!.request);
    expect(result.status, JSON.stringify(result.response)).toBe(200);
    const replay = await invoke(preparation.checkpoint!.request);
    expect(replay.status).toBe(200); expect(replay.response).toEqual(result.response);
    expect(fetchImpl).toHaveBeenCalledTimes(2); // one assessment + ONE WD, all mocked
  });
});
