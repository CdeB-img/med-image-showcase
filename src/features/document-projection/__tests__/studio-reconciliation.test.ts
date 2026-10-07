import { describe, expect, it, vi } from "vitest";
import { logicalDigest } from "../../knowledge-engine/canonical";
import { recordSpecializedOwnerResult } from "../../research-project-construction/specialized-owner-handoff";
import { prepareStudioScientificHandoff, type StudioScientificAssessment } from "../../scientific-thinking/studio-contribution";
import { assessSavedStudioRevision, buildStudioReconciliationPlan, createStudioReconciliationRequest,
  deriveStudioNativeDelta, assertStudioReconciliationCurrent, readSavedStudioReconciliationRequest, replayStudioEditorialPlan } from "../studio-reconciliation";
import { createStudioFinalizationIdentity, matchesStudioFinalizationReceipt, readStudioFinalizationReceipt } from "../studio-finalization-identity";
import { STUDIO_RECONCILIATION_CONTRACT, type StudioAssessmentPayload, type StudioReconciliationRequest,
  type StudioScientificState } from "../studio-reconciliation-contract";
import { DOC_ARCHIVE_CONTRACT, type DocumentPersistenceReceipt } from "../generation-persistence";
import { workingRevisionFixture } from "./working-revision-fixture";
import { captureStudioScientificState } from "../../protocol-designer/functional-reset/studio-scientific-context";
import { createFunctionalResetSession } from "../../protocol-designer/functional-reset/session";
import { captureProjectPreparation, addProjectPreparation, consumeProjectPreparation } from "../../protocol-designer/functional-reset/project-preparation-lifecycle";
import { acceptWorkingDraftUpdate, workingDraftInputDigest } from "../../protocol-designer/functional-reset/continuous-project-build";
import { controlledStudyProposal, DOMAINS } from "../../protocol-designer/functional-reset/__tests__/study-proposal-fixtures";

// CURRENT_SEMANTIC_INVARIANT. Meaningful native PRJ/DOC fixture, with explicitly
// controlled ST owner reports. These qualify orchestration/bindings, not an
// automatic semantic classifier, provider quality or clinical acceptability.
const state = (pendingTurnRef: string | null = null): StudioScientificState => ({
  stateDigest: logicalDigest({ nativeSource: "controlled-scientific-owner-state", pendingTurnRef }), pendingTurnRef, preparations: [],
  pendingPreparationId: null,
});
const setup = async (monocentric = false) => {
  const run = await workingRevisionFixture({ monocentric });
  const initial = await run.owner.create(run.access2, run.createInput);
  return { ...run, revision: initial.revision, currentProject: run.project2, scientificState: state(),
    source: { ref: run.g2.ref, body: run.g2.body }, projectionSource: { ref: await run.archive.history(run.access2).then(p =>
      p.entries.find(ref => ref.generationId === run.g2.projection.projectionId)!), body: run.g2.projectionBody } };
};
const save = async (run: Awaited<ReturnType<typeof setup>>, edit: (content: typeof run.revision.content) => void) => {
  const content = structuredClone(run.revision.content); edit(content);
  const result = await run.owner.save(run.access2, { revisionId: run.revision.revisionId,
    expectedSaveSequence: run.revision.saveSequence, content });
  return { ...run, revision: result.revision };
};
const report = (request: StudioReconciliationRequest, select?: (edit: StudioReconciliationRequest["delta"][number]) =>
  Partial<StudioAssessmentPayload["edits"][number]>, disposition: StudioAssessmentPayload["scientificStateDisposition"] = "NO_NET_CHANGE") => {
  const payload: StudioAssessmentPayload = { requestDigest: request.requestDigest, scientificStateDisposition: disposition,
    scientificStateReason: "Controlled native owner assessment of the exact governed scientific state",
    scientificStateAmbiguity: null,
    edits: request.delta.filter(edit => edit.change !== "UNCHANGED").map(edit => ({ editRef: edit.editRef,
      classification: "DOCUMENT_ONLY", reason: "Wording only under the frozen scientific state",
      provenanceRefs: [edit.editRef], projectCoverage: null, ambiguity: null, ...select?.(edit) })) };
  return recordSpecializedOwnerResult({ request: prepareStudioScientificHandoff(request),
    resultId: `studio-assessment:${logicalDigest(payload)}`, resultVersion: "1.0.0", completedAt: "2026-10-07T12:00:00.000Z",
    status: "COMPLETED", resultKind: "INFORMATIONAL_ONLY", nativePayloadType: "StudioScientificAssessment",
    nativePayloadVersion: "1.0.0", nativePayload: payload });
};
const planFor = async (run: Awaited<ReturnType<typeof setup>>, assessment?: StudioScientificAssessment) => {
  const request = await createStudioReconciliationRequest(run);
  const plan = await buildStudioReconciliationPlan({ ...run, request, assessment: assessment ?? report(request),
    target: run.source, targetProjection: run.projectionSource });
  return { request, plan };
};
const intentFor = (run: Awaited<ReturnType<typeof setup>>, request: StudioReconciliationRequest,
  plan: Awaited<ReturnType<typeof buildStudioReconciliationPlan>>) => createStudioFinalizationIdentity({
    ...run, request, plan, documentContractDigest: logicalDigest({ contract: "DRCI_DRAFT_PACK_V1", editorialVersion: "CONCISE_V2" }) });

describe("bounded native Studio reconciliation / no scientific or documentary execution", () => {
  it("A: preserves editorial wording deterministically with zero WD/adoption/generation and unchanged archive", async () => {
    const original = await setup(), beforeProject = JSON.stringify(original.project2), beforeArchive = JSON.stringify(await original.archive.history(original.access2));
    const run = await save(original, content => { content.title = "Protocole de recherche — colchicine après infarctus"; });
    const { request, plan } = await planFor(run);
    expect(plan.state).toBe("READY"); expect(plan.edits[0].action).toBe("REPLAY_EDITORIAL");
    expect(plan.edits[0].source.afterText).toBe(run.revision.content.title);
    expect(plan.scientificPreparation.action).toBe("NONE"); expect(plan.scientificContribution).toBeNull();
    expect(JSON.stringify(run.project2)).toBe(beforeProject);
    expect(JSON.stringify(await run.archive.history(run.access2))).toBe(beforeArchive);
    expect(intentFor(run, request, plan)?.requestId).toMatch(/^studio-finalization:/);
    const replay = replayStudioEditorialPlan(plan, original.revision.content);
    expect(replay).toEqual(run.revision.content); expect(original.revision.content.title).not.toBe(replay.title);
  });
  it("B: monocentric → multicentric produces a non-adopting ST contribution, never a direct Project write", async () => {
    const original = await setup(true), projectBefore = JSON.stringify(original.project2);
    const run = await save(original, content => { content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("monocentrique", "multicentrique"); });
    const request = await createStudioReconciliationRequest(run);
    expect(request.delta.find(edit => edit.change !== "UNCHANGED")?.beforeText).toContain("monocentrique");
    const plan = await buildStudioReconciliationPlan({ ...run, request,
      assessment: report(request, () => ({ classification: "PROJECT_CHANGE", reason: "Study setting materially changes" })) });
    expect(plan.state).toBe("SCIENTIFIC_PREPARATION_REQUIRED");
    expect(plan.scientificContribution?.edits).toHaveLength(1);
    expect(plan.scientificContribution?.origin).toBe("STUDIO"); expect(plan.scientificContribution?.projectWriteAuthorized).toBe(false);
    expect(JSON.stringify(run.project2)).toBe(projectBefore);
    const handoff = prepareStudioScientificHandoff(request);
    expect(handoff.owner).toBe("SCIENTIFIC_THINKING"); expect(handoff.nativeInput).not.toHaveProperty("conversation");
    expect(() => intentFor(run, request, plan)).toThrow("STUDIO_FINALIZATION_NOT_READY");
  });
  it("C: owner-certified coverage by the adopted current Project skips WD without deriving meaning from refs", async () => {
    const original = await setup();
    const edited = await save(original, content => { content.sections[0].blocks[0].text = content.sections[0].blocks[0].text.replace("étude multicentrique", "Étude conduite dans plusieurs centres"); });
    const run = { ...edited, currentProject: original.project3 };
    const request = await createStudioReconciliationRequest(run);
    const design = request.currentProject.objects.find(o => o.content === "étude multicentrique")!;
    expect(request.delta.some(edit => edit.change === "MODIFIED")).toBe(true);
    expect(design.decisionRefs.length).toBeGreaterThan(0);
    const plan = await buildStudioReconciliationPlan({ ...run, request, assessment: report(request, () => ({
      classification: "PROJECT_CHANGE", reason: "The multicentric design represented by this edit is already adopted by the current Project",
      projectCoverage: { coverage: "COMPLETE", projectVersionRefs: [design.versionRef] },
    })) });
    expect(plan.scientificPreparation.action).toBe("NONE"); expect(plan.scientificContribution).toBeNull();
    expect(plan.edits[0].projectCoverage).toBe("COMPLETE"); expect(plan.state).toBe("READY");
    const partial = report(request, () => ({ classification: "PROJECT_CHANGE", projectCoverage: { coverage: "PARTIAL", projectVersionRefs: [design.versionRef] } }));
    expect((await buildStudioReconciliationPlan({ ...run, request, assessment: partial })).scientificPreparation.action).toBe("EXISTING_SCIENTIFIC_PREPARATION_PATH");
  });
  it("D: pending conversation science and Studio editorial work stay separate", async () => {
    const edited = await save(await setup(), content => { content.title = "Protocole reformulé"; });
    const run = { ...edited, scientificState: state("native-scientific-turn-pending") };
    const request = await createStudioReconciliationRequest(run);
    const plan = await buildStudioReconciliationPlan({ ...run, request, assessment: report(request, undefined, "PENDING_HUMAN_CONFIRMATION"),
      target: run.source, targetProjection: run.projectionSource });
    expect(plan.edits[0].action).toBe("REPLAY_EDITORIAL"); expect(plan.edits[0].source.afterText).toBe("Protocole reformulé");
    expect(plan.scientificContribution).toBeNull(); expect(plan.scientificPreparation.action).toBe("EXISTING_SCIENTIFIC_PREPARATION_PATH");
  });
  it("E: scientifically changed target context forbids blind paragraph replay and retains the draft", async () => {
    const edited = await save(await setup(), content => { content.sections[0].blocks[0].text += " Reformulation éditoriale humaine."; });
    const run = { ...edited, currentProject: edited.project3 };
    const access3 = await run.register(run.project3, run.access2.proof);
    const g3 = await run.generation(run.project3, access3);
    const projectionRef = (await run.archive.history(access3)).entries.find(ref => ref.generationId === g3.projection.projectionId)!;
    const request = await createStudioReconciliationRequest(run);
    const plan = await buildStudioReconciliationPlan({ ...run, request, assessment: report(request),
      target: { ref: g3.ref, body: g3.body }, targetProjection: { ref: projectionRef, body: g3.projectionBody } });
    expect(plan.state).toBe("REQUIRES_RECONCILIATION"); expect(plan.edits[0].action).toBe("REQUIRES_RECONCILIATION");
    expect(plan.edits[0].source.afterText).toContain("Reformulation éditoriale humaine.");
    expect(replayStudioEditorialPlan(plan, edited.revision.content)).toEqual(edited.revision.content);
    expect((await run.owner.get(access3, run.revision.revisionId)).revision.status).toBe("ACTIVE");
  });
  it("F: only material incompatible alternatives yield arbitration; ordinary open items do not", async () => {
    const run = await save(await setup(), content => { content.title = "IRM ou biopsie ?"; });
    const request = await createStudioReconciliationRequest(run), sourceRef = request.currentProject.objects[0].stableId;
    const assessment = report(request, () => ({ classification: "AMBIGUOUS", projectCoverage: null,
      ambiguity: { question: "La biopsie remplace-t-elle l’IRM ou s’y ajoute-t-elle ?", materialProjectRefs: [sourceRef],
        alternatives: [{ interpretation: "Remplacement", consequence: "La mesure par IRM serait retirée" },
          { interpretation: "Ajout", consequence: "Une procédure supplémentaire serait prévue" }] } }));
    const plan = await buildStudioReconciliationPlan({ ...run, request, assessment });
    expect(plan.state).toBe("NEEDS_HUMAN_ARBITRATION"); expect(plan.scientificPreparation.action).toBe("NONE");
    expect((await run.owner.get(run.access2, run.revision.revisionId)).revision).toEqual(run.revision);
    const invalid = structuredClone(assessment); invalid.nativePayload!.edits[0].ambiguity!.alternatives = invalid.nativePayload!.edits[0].ambiguity!.alternatives.slice(0, 1);
    await expect(buildStudioReconciliationPlan({ ...run, request, assessment: invalid })).rejects.toThrow("STUDIO_ASSESSMENT_BINDING_INVALID");
    expect(run.g2.body.native.family === "DRCI" && run.g2.body.native.value.documents[0].missingElements.length).toBeGreaterThan(0);
    expect((await planFor(run)).plan.state).toBe("READY");
  });
  it("G: identical saved inputs and native assessment give identical immutable request/plan/finalization identities", async () => {
    const run = await save(await setup(), content => { content.title = "Protocole édité"; });
    const a = await planFor(run), b = await planFor(run);
    expect(a).toEqual(b); expect(Object.isFrozen(a.request.delta[0])).toBe(true);
    expect(intentFor(run, a.request, a.plan)).toEqual(intentFor(run, b.request, b.plan));
    expect(await createStudioReconciliationRequest(JSON.parse(JSON.stringify(run)))).toEqual(a.request);
  });
  it("H: another save, abandon, Project change or native state change invalidates the old reconciliation", async () => {
    const run = await save(await setup(), content => { content.title = "Premier texte"; });
    const { request, plan } = await planFor(run);
    const next = await save(run, content => { content.title = "Texte arrivé après le checkpoint"; });
    expect(() => intentFor(next, request, plan)).toThrow("STUDIO_RECONCILIATION_STALE");
    expect(() => assertStudioReconciliationCurrent(request, run.revision, run.project3, run.scientificState)).toThrow("STUDIO_RECONCILIATION_STALE");
    expect(() => assertStudioReconciliationCurrent(request, run.revision, run.project2, state("later-scientific-turn"))).toThrow("STUDIO_RECONCILIATION_STALE");
    const abandoned = await run.owner.abandon(run.access2, { revisionId: next.revision.revisionId, expectedSaveSequence: next.revision.saveSequence });
    expect(() => assertStudioReconciliationCurrent(request, abandoned.revision, run.project2, run.scientificState)).toThrow("STUDIO_RECONCILIATION_STALE");
  });
  it("I: existing G2 on the same Project cannot satisfy a future G3 finalization, even with a relabelled receipt", async () => {
    const run = await save(await setup(), content => { content.title = "Protocole pour la version suivante"; });
    const { request, plan } = await planFor(run), identity = intentFor(run, request, plan)!;
    const old: DocumentPersistenceReceipt = { contract: DOC_ARCHIVE_CONTRACT, requestId: "generation-2", generation: run.g2.ref };
    const expected = { generationId: "future-native-generation", bodySha256: "a".repeat(64) };
    expect(matchesStudioFinalizationReceipt(identity, old, expected)).toBe(false);
    expect(matchesStudioFinalizationReceipt(identity, { ...old, requestId: identity.requestId },
      { generationId: run.g2.ref.generationId, bodySha256: run.g2.ref.bodySha256 })).toBe(false);
    const receipt = vi.fn(async () => ({ ...old, requestId: identity.requestId }));
    await expect(readStudioFinalizationReceipt({ receipt }, identity, expected)).rejects.toThrow("STUDIO_FINALIZATION_RECEIPT_MISMATCH");
    expect(receipt).toHaveBeenCalledExactlyOnceWith(identity.requestId);
    const valid = { ...old, requestId: identity.requestId, generation: { ...run.g2.ref, generationId: expected.generationId,
      bodySha256: expected.bodySha256, predecessorId: run.g2.ref.generationId, displayVersion: 3 } };
    expect(matchesStudioFinalizationReceipt(identity, valid, expected)).toBe(true);
    expect(await readStudioFinalizationReceipt({ receipt: async () => null }, identity, expected)).toBeNull();
    // Structural receipt fixture only: no real G3 has been assembled or committed.
    expect((await run.archive.history(run.access2)).entries.filter(e => e.family === "DRCI")).toHaveLength(2);
  });
  it("J: unchanged draft does not invoke scientific processing, WD or create any version intent", async () => {
    const run = await setup(), request = await createStudioReconciliationRequest(run);
    const assess = vi.fn();
    const plan = await assessSavedStudioRevision({ ...run, request, scientificThinking: { owner: "SCIENTIFIC_THINKING", assess } });
    expect(assess).not.toHaveBeenCalled(); expect(plan.state).toBe("NO_CHANGE"); expect(plan.edits).toEqual([]);
    expect(plan.scientificPreparation.action).toBe("NONE"); expect(intentFor(run, request, plan)).toBeNull();
  });
  it("captures through read-only existing archive/revision ports, never a transcript or rendered file", async () => {
    const run = await save(await setup(), content => { content.title = "Texte utilisateur"; });
    const body = vi.fn((id: string) => run.archive.body(run.access2, id)), get = vi.fn((id: string) => run.owner.get(run.access2, id));
    const client = { body, workingRevisions: { get } } as unknown as Parameters<typeof readSavedStudioReconciliationRequest>[0]["client"];
    const request = await readSavedStudioReconciliationRequest({ ...run, client, revisionId: run.revision.revisionId, expectedSaveSequence: run.revision.saveSequence });
    expect(request.contract).toBe(STUDIO_RECONCILIATION_CONTRACT); expect(get).toHaveBeenCalledOnce(); expect(body).toHaveBeenCalledTimes(2);
    await expect(readSavedStudioReconciliationRequest({ ...run, client, revisionId: run.revision.revisionId, expectedSaveSequence: 1 })).rejects.toThrow("STUDIO_RECONCILIATION_STALE");
  });
  it("supports all textual dispositions without allowing protected node or token loss", async () => {
    const run = await setup(), base = run.revision.content;
    const next = structuredClone(base); next.title = ""; next.sections[0].title = "Nouveau titre";
    const delta = deriveStudioNativeDelta(base, next);
    expect(delta.map(d => d.change)).toEqual(["REMOVED", "MODIFIED", "UNCHANGED"]);
    const blank = structuredClone(base); blank.title = "";
    expect(deriveStudioNativeDelta(blank, base)[0].change).toBe("ADDED");
    const tokens = structuredClone(base); tokens.sections[0].blocks[0].text += " [[FACT:protected]][[CITE:protected]]";
    const lost = structuredClone(tokens); lost.sections[0].blocks[0].text = "Réécriture sans références";
    expect(() => deriveStudioNativeDelta(tokens, lost)).toThrow("DOC_REVISION_BINDING_IN_EDITABLE_TEXT");
    next.sections[0].blocks = [];
    expect(() => deriveStudioNativeDelta(base, next)).toThrow("DOC_REVISION_PROTECTED_STRUCTURE_CHANGED");
  });
  it("rejects corrupt native bodies, incomplete/foreign owner receipts and forged input digests", async () => {
    const run = await save(await setup(), content => { content.title = "Titre éditorial"; });
    const corrupt = { ...run.source, body: { ...run.source.body, rendererVersion: "corrupt" } };
    await expect(createStudioReconciliationRequest({ ...run, source: corrupt })).rejects.toThrow("STUDIO_NATIVE_SOURCE_INVALID");
    const request = await createStudioReconciliationRequest(run), valid = report(request);
    await expect(buildStudioReconciliationPlan({ ...run, request })).rejects.toThrow("STUDIO_SCIENTIFIC_ASSESSMENT_REQUIRED");
    for (const bad of [ { ...valid, owner: "DOCUMENT_ENGINE" as const }, { ...valid, sourceProjectDigest: "stale" },
      { ...valid, nativePayload: { ...valid.nativePayload!, edits: [] } } ])
      await expect(buildStudioReconciliationPlan({ ...run, request, assessment: bad })).rejects.toThrow(/STUDIO_ASSESSMENT_/);
    expect(() => assertStudioReconciliationCurrent({ ...request, requestDigest: "forged" }, run.revision, run.currentProject, run.scientificState)).toThrow("STUDIO_RECONCILIATION_STALE");
  });
  it("routes evaluation only through the injected existing ST owner and fails without modifying the saved state", async () => {
    const run = await save(await setup(), content => { content.title = "Titre à évaluer"; });
    const request = await createStudioReconciliationRequest(run), assess = vi.fn(async () => report(request));
    expect((await assessSavedStudioRevision({ ...run, request, target: run.source, targetProjection: run.projectionSource,
      scientificThinking: { owner: "SCIENTIFIC_THINKING", assess } })).state).toBe("READY");
    expect(assess).toHaveBeenCalledExactlyOnceWith(prepareStudioScientificHandoff(request));
    await expect(assessSavedStudioRevision({ ...run, request, scientificThinking: { owner: "SCIENTIFIC_THINKING",
      assess: async () => { throw new Error("SCIENTIFIC_OWNER_UNAVAILABLE"); } } })).rejects.toThrow("SCIENTIFIC_OWNER_UNAVAILABLE");
    expect((await run.owner.get(run.access2, run.revision.revisionId)).revision).toEqual(run.revision);
  });
  it("reuses the native validated pending Review, not an inferred cutoff or a changed conversation checkpoint", async () => {
    const run = await setup();
    const session = { ...createFunctionalResetSession(), sessionId: run.sessionId, projectId: run.project2.projectId,
      project: run.project2, runtimeTurns: [
      { turnId: "user-irm-qc", role: "USER" as const, content: "Ajouter une relecture indépendante de la qualité des IRM de l'essai colchicine/placebo.", createdAt: "2026-10-07T10:00:00Z" },
      { turnId: "noxia-turn:11111111-1111-4111-8111-111111111111", role: "NOXIA" as const,
        content: "Contrôle qualité IRM proposé sans adoption, inconnues préservées.", createdAt: "2026-10-07T10:00:01Z" },
    ] };
    const preparation = captureProjectPreparation(session), request = preparation.checkpoint!.request;
    const proposal = controlledStudyProposal(workingDraftInputDigest(request), DOMAINS[1]);
    const snapshot = (await createStudioReconciliationRequest(run)).currentProject;
    for (const atom of proposal.atoms) {
      const current = snapshot.objects.find(object => object.type === atom.targetType);
      if (current) atom.content = current.content;
    }
    proposal.atoms.find(atom => atom.ref === "practical")!.content = "Relecture indépendante de la qualité des IRM";
    const accepted = acceptWorkingDraftUpdate({ requestType: "STUDY_UPDATE", proposal,
      explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] }, request);
    const ready = consumeProjectPreparation(addProjectPreparation(session, preparation), preparation.checkpoint!.preparationId,
      { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition });
    const scientificState = captureStudioScientificState(ready);
    expect(scientificState.pendingTurnRef).toBeNull(); expect(scientificState.pendingPreparationId).toBe(preparation.checkpoint!.preparationId);
    expect(scientificState.preparations[0]).toMatchObject({ valid: true, status: "READY_FOR_REVIEW", decision: "PENDING" });
    const inputs = { ...run, scientificState }, reconciliation = await createStudioReconciliationRequest(inputs);
    const plan = await buildStudioReconciliationPlan({ ...inputs, request: reconciliation, assessment: report(reconciliation, undefined, "PENDING_HUMAN_CONFIRMATION") });
    expect(plan.scientificPreparation.action).toBe("REUSE_VALID_PREPARATION");
    const later = { ...ready, runtimeTurns: [...ready.runtimeTurns, { turnId: "later-ecv", role: "USER" as const,
      content: "Ajouter une relecture indépendante des cartes ECV.", createdAt: "2026-10-07T10:00:02Z" }] };
    expect(captureStudioScientificState(later).pendingTurnRef).toBe("later-ecv");
    const changed = { ...inputs, scientificState: captureStudioScientificState(later) }, newRequest = await createStudioReconciliationRequest(changed);
    expect((await buildStudioReconciliationPlan({ ...changed, request: newRequest,
      assessment: report(newRequest, undefined, "PENDING_HUMAN_CONFIRMATION") })).scientificPreparation.action).toBe("EXISTING_SCIENTIFIC_PREPARATION_PATH");
    const corrupt = { ...ready, workingDraftPreparations: ready.workingDraftPreparations!.map(item => ({ ...item,
      checkpoint: { ...item.checkpoint!, requestDigest: "corrupt" } })) };
    expect(captureStudioScientificState(corrupt).pendingPreparationId).toBeNull();
    expect(captureStudioScientificState(corrupt).preparations[0].valid).toBe(false);
  });
  it("rejects unbound provenance, duplicate/non-material ambiguity and false COMPLETE coverage", async () => {
    const run = await save(await setup(), content => { content.title = "Texte modifié"; }), request = await createStudioReconciliationRequest(run);
    for (const bad of [ report(request, () => ({ provenanceRefs: ["invented-source"] })),
      report(request, () => ({ classification: "PROJECT_CHANGE", projectCoverage: { coverage: "COMPLETE", projectVersionRefs: ["missing-native-version"] } })),
      report(request, () => ({ classification: "AMBIGUOUS", ambiguity: { question: "Question ordinaire sans alternative réelle",
        alternatives: [{ interpretation: "Identique", consequence: "Identique" }, { interpretation: "Identique", consequence: "Identique" }],
        materialProjectRefs: [request.currentProject.objects[0].stableId] } })) ])
      await expect(buildStudioReconciliationPlan({ ...run, request, assessment: bad })).rejects.toThrow(/STUDIO_ASSESSMENT_/);
    await expect(buildStudioReconciliationPlan({ ...run, request, assessment: report(request, undefined, "AMBIGUOUS") })).rejects.toThrow("STUDIO_ASSESSMENT_AMBIGUITY_INVALID");
    const changedTarget = structuredClone(run.revision.content); changedTarget.sections[0].blocks[0].text += " Nouveau contexte scientifique.";
    const plan = (await planFor(run)).plan;
    // Title replay is allowed on an unchanged title context; paragraph replay
    // below must fail closed when its native scientific section changed.
    const paragraph = await save(run, content => { content.sections[0].blocks[0].text += " Reformulation humaine."; });
    const paragraphPlan = (await planFor(paragraph)).plan;
    expect(() => replayStudioEditorialPlan(paragraphPlan, changedTarget)).toThrow("STUDIO_EDITORIAL_REPLAY_COLLISION");
    const identity = intentFor(run, request, plan)!;
    const changedContract = createStudioFinalizationIdentity({ ...run, request, plan, documentContractDigest: logicalDigest("different-contract") });
    expect(changedContract!.requestId).not.toBe(identity.requestId);
  });
});
