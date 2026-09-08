import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildProjectContextSnapshot, prepareResearchProjectContributionCandidate, type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { createProductOwnerResultLedger, ownerResultNativeDigest, type ProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeStudyDesignForProjectSnapshot } from "@/features/protocol-designer/product-study-design-owner-runtime";
import { retainValidatedContributionCandidate, type RetainedContributionCandidate } from "@/features/protocol-designer/functional-reset/contribution-lifecycle";
import { adoptBehaviorContribution, behaviorContribution, behaviorItem, behaviorRelation, behaviorTurn } from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { executeStudyDesignRuntime, type StudyDesignProposalContribution } from "@/features/study-design";
import { buildCurrentNavigationEvidence, type CurrentNavigationOwnerResultRef } from "../current-navigation-evidence";
import { buildQueryNavigationContext } from "../adapters";
import { selectNextAction } from "../engine";
import { buildFunctionalResetQueryNavigation } from "../functional-reset-progression";

const AT = "2026-09-08T12:00:00.000Z";
const source = behaviorTurn("turn:navigation:1", "Je veux comparer prospectivement la croissance des végétaux, avec deux mesures reliées et un protocole ouvert.");
const contribution = () => behaviorContribution({
  contributionId: "candidate:navigation:1", turns: [source],
  candidateObjects: [
    behaviorItem({ itemId: "question:vegetal", proposedType: "SCIENTIFIC_QUESTION", content: "Comparer prospectivement la croissance des végétaux", turnId: source.turnId }),
    behaviorItem({ itemId: "objective:vegetal", proposedType: "OBJECTIVE", content: "Caractériser la croissance", turnId: source.turnId }),
    behaviorItem({ itemId: "population:vegetal", proposedType: "POPULATION", content: "Végétaux du dispositif expérimental", turnId: source.turnId }),
    behaviorItem({ itemId: "measure:first", proposedType: "MEASURED_VARIABLE", content: "hauteur mesurée", turnId: source.turnId }),
    behaviorItem({ itemId: "measure:second", proposedType: "MEASURED_VARIABLE", content: "surface mesurée", turnId: source.turnId }),
    behaviorItem({ itemId: "design:open", proposedType: "STUDY_DESIGN", content: "Plan non défini", turnId: source.turnId, epistemicState: "UNKNOWN" }),
  ],
  relations: [behaviorRelation({ relationId: "relation:measures", relationType: "ASSOCIATED_WITH", sourceItemId: "measure:first", targetItemId: "measure:second", turnId: source.turnId })],
});

const retainedCandidate = (): RetainedContributionCandidate => {
  const value = contribution();
  const candidate = prepareResearchProjectContributionCandidate(value, null);
  expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
  return retainValidatedContributionCandidate({
    retained: [], contribution: value, candidate,
    validation: { valid: true, acceptedChanges: [], acceptedRelations: [], acceptedTemporalQualifications: [], acceptedExpectedVariableOccasions: [], blocks: [], noOps: [], normalizations: [] },
    validatorRef: "LOCAL_VALIDATED_FIXTURE@1", sourceTurnRef: source.turnId, baseProject: null,
    dependencyBindings: [], traceRunId: "trace:fixture", retainedAt: AT,
  })[0]!;
};

const project = () => adoptBehaviorContribution(contribution(), null, 1);
const currentInput = (currentProject: ResearchProjectOwnerProjection | null = null) => ({
  sourceTurnRef: source.turnId, sourceText: source.content, currentProject,
});
const scopeRefs = (value: ResearchProjectOwnerProjection) => buildProjectContextSnapshot({ project: value }).objects
  .filter((object) => object.type === "SCIENTIFIC_QUESTION").map((object) => object.stableId);

const versionedLocalResult = (base: Readonly<StudyDesignProposalContribution>, revision: number) => {
  const { proposalDigest: _digest, ...material } = structuredClone(base);
  const proposalId = `${base.proposalId}:explicit-local-contribution:${revision}`;
  const updated = { ...material, proposalId, downstreamHandoffs: material.downstreamHandoffs.map((handoff) => ({ ...handoff, sourceProposalRef: proposalId })) };
  return { ...updated, proposalDigest: logicalDigest(updated) };
};
const result = (value: ResearchProjectOwnerProjection, ledger = createProductOwnerResultLedger("session:navigation"), second = 0) => invokeStudyDesignForProjectSnapshot({
  projectSnapshot: buildProjectContextSnapshot({ project: value }), ledger,
  callerRef: `qry-action:fixture:${second}`, purpose: `Comparer les stratégies explicites ${second}`,
  startedAt: `2026-09-08T12:00:0${second}.000Z`, completedAt: `2026-09-08T12:00:0${second}.100Z`,
  ...(second ? { runtime: (input: Parameters<typeof executeStudyDesignRuntime>[0]) => versionedLocalResult(executeStudyDesignRuntime(input), second) } : {}),
});
const selection = (invocation: ReturnType<typeof result>, value: ResearchProjectOwnerProjection): CurrentNavigationOwnerResultRef => ({
  owner: "STUDY_DESIGN", resultId: invocation.result!.resultId, resultVersion: invocation.result!.resultVersion,
  resultDigest: ownerResultNativeDigest(invocation.result!)!, scopeRefs: scopeRefs(value), disposition: "ACTIVE", applicability: "APPLICABLE",
});
const network = vi.fn(() => { throw new Error("NO_PROVIDER_IN_NAVIGATION_QUALIFICATION"); });

describe("PASS3A current navigation evidence — exact sources, no new science", () => {
  it("does not resolve Project needs merely because the actual consumer receives a scoped owner result", () => {
    const value = project();
    const before = buildFunctionalResetQueryNavigation({ project: value, recordedAt: AT });
    const previousProjectNeeds = Object.keys(before.needSections);
    expect(previousProjectNeeds.length).toBeGreaterThan(0);
    const invocation = result(value);
    const evidence = buildCurrentNavigationEvidence({
      ...currentInput(value),
      ownerResultLedger: invocation.ledger,
      activeOwnerResultRefs: [selection(invocation, value)],
      resolvedNeedRefs: before.memory.resolvedNeedRefs,
    });
    expect(evidence.sourceState.projectUnknowns).toEqual([]);
    expect(evidence.sourceState.governedNeeds.length).toBeGreaterThan(0);
    const beforeMaterial = JSON.stringify({ value, before, invocation, evidence });
    const after = buildFunctionalResetQueryNavigation({
      project: value, previous: before, currentNavigationEvidence: evidence,
      recordedAt: "2026-09-08T12:00:01.000Z",
    });
    // The Project did not change. The new result changes active scope, not the
    // truth/status of every previous need outside that result's partial view.
    expect(after.projectVersion).toBe(before.projectVersion);
    expect(after.memory.resolvedNeedRefs).toEqual(before.memory.resolvedNeedRefs);
    const initiallyUnresolved = previousProjectNeeds.filter((ref) => !before.memory.resolvedNeedRefs.includes(ref));
    expect(initiallyUnresolved.length).toBeGreaterThan(0);
    expect(initiallyUnresolved.every((ref) => !after.memory.resolvedNeedRefs.includes(ref))).toBe(true);
    expect(JSON.stringify({ value, before, invocation, evidence })).toBe(beforeMaterial);
  });

  it("still excludes an explicitly resolved native owner need without resolving absent Project needs", () => {
    const value = project();
    const before = buildFunctionalResetQueryNavigation({ project: value, recordedAt: AT });
    const invocation = result(value);
    const rawEvidence = buildCurrentNavigationEvidence({
      ...currentInput(value), ownerResultLedger: invocation.ledger,
      activeOwnerResultRefs: [selection(invocation, value)],
    });
    const nativeNeed = rawEvidence.sourceState.governedNeeds.find((need) => need.sourceObjectKind === "StudyDesignInformationNeed");
    if (!nativeNeed) throw new Error("TEST_NATIVE_OWNER_NEED_REQUIRED");
    // This fixture supplies an explicit resolution ref through the existing
    // consumer contract; no scientific resolution is inferred from omission.
    const evidence = buildCurrentNavigationEvidence({
      ...currentInput(value), ownerResultLedger: invocation.ledger,
      activeOwnerResultRefs: [selection(invocation, value)],
      resolvedNeedRefs: [...before.memory.resolvedNeedRefs, nativeNeed.needId],
    });
    const after = buildFunctionalResetQueryNavigation({
      project: value, previous: before, currentNavigationEvidence: evidence,
      recordedAt: "2026-09-08T12:00:01.000Z",
    });
    expect(evidence.resolvedNeedRefs).toContain(nativeNeed.needId);
    expect(after.selection.needs.some((need) => need.needId === nativeNeed.needId)).toBe(false);
    expect(after.selection.candidates.some((candidate) => candidate.navigationNeedRefs.includes(nativeNeed.needId))).toBe(false);
    expect(after.memory.resolvedNeedRefs).toEqual(before.memory.resolvedNeedRefs);
  });
  beforeEach(() => { network.mockClear(); vi.stubGlobal("fetch", network); });
  afterEach(() => { expect(network).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });

  it("preserves candidate objects, relations, epistemic state and provenance without a fake Project", () => {
    const candidate = retainedCandidate();
    const before = JSON.stringify(candidate);
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(), validatedCandidate: candidate });
    expect(evidence.adoptedProject).toBeNull();
    expect(evidence.candidate?.status).toBe("VALIDATED_NON_ADOPTED_CANDIDATE");
    expect(evidence.candidate?.objectChanges).toEqual(candidate.candidate.canonicalChangeSet.objectChanges);
    expect(evidence.candidate?.relationChanges).toEqual(candidate.candidate.canonicalChangeSet.relationChanges);
    expect(evidence.candidate?.sourceTurnRef).toBe(source.turnId);
    expect(evidence.sourceState.governedNeeds).toEqual([]);
    expect(JSON.stringify(candidate)).toBe(before);
    expect(evidence.projectWriteAuthorized).toBe(false);
  });

  it("does not turn an explicit UNKNOWN alone into a clarification", () => {
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(), validatedCandidate: retainedCandidate() });
    expect(evidence.candidate?.objectChanges.some((change) => change.candidate?.epistemicState === "UNKNOWN")).toBe(true);
    expect(evidence.sourceState.projectUnknowns).toEqual([]);
    expect(evidence.sourceState.governedNeeds).toEqual([]);
  });

  it.each(["STALE", "SUPERSEDED"] as const)("excludes %s candidate without deleting its history", (actuality) => {
    const candidate = { ...retainedCandidate(), actuality };
    const before = JSON.stringify(candidate);
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(), validatedCandidate: candidate });
    expect(evidence.candidate).toBeNull();
    expect(evidence.excludedReferences).toContainEqual({ ref: candidate.candidateRef, reason: "CANDIDATE_NOT_CURRENT_NON_ADOPTED" });
    expect(JSON.stringify(candidate)).toBe(before);
  });

  it("excludes a candidate with changed source or base and preserves exact old bindings", () => {
    const candidate = retainedCandidate();
    expect(buildCurrentNavigationEvidence({ ...currentInput(), sourceText: "Correction explicite", validatedCandidate: candidate }).candidate).toBeNull();
    expect(buildCurrentNavigationEvidence({ ...currentInput(project()), validatedCandidate: candidate }).candidate).toBeNull();
  });

  it("consumes a current governed Study Design information need using the existing owner runtime", () => {
    const value = project();
    const invocation = result(value);
    const sourceBefore = JSON.stringify({ value, invocation });
    expect(invocation.result!.nativePayload!.informationNeeds.length).toBeGreaterThan(0);
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [selection(invocation, value)] });
    expect(evidence.ownerResults).toHaveLength(1);
    expect(evidence.sourceState.governedNeeds.length).toBeGreaterThan(0);
    for (const need of evidence.sourceState.governedNeeds) {
      expect(need.owner).toBe("STUDY_DESIGN");
      expect(need.provenance.sourceRefs).toContain(invocation.result!.resultId);
      expect(need.provenance.evidence.length).toBe(2);
      expect(need.affectedBranchRefs).toEqual(scopeRefs(value));
      expect(need.sourceObjectKind).toBe("StudyDesignInformationNeed");
    }
    expect(evidence.sourceState.projectUnknowns).toEqual([]);
    expect(JSON.stringify({ value, invocation })).toBe(sourceBefore);
    expect(invocation.providerCalls).toBe(0);
  });

  it("changes the navigation digest for a relevant result with an unchanged adopted Project", () => {
    const value = project();
    const first = result(value);
    const second = result(value, first.ledger, 1);
    const before = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: first.ledger, activeOwnerResultRefs: [selection(first, value)] });
    const after = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: second.ledger, activeOwnerResultRefs: [selection(second, value)] });
    expect(before.adoptedProject).toEqual(after.adoptedProject);
    expect(before.contextDigest).not.toBe(after.contextDigest);
  });

  it("reuses the unchanged QRY engine for an explicit governed trade-off, not a invented blocking decision", () => {
    const sourceContribution = contribution();
    const scientificQuestion = sourceContribution.scientificContent.candidateObjects.find((item) => item.proposedType === "SCIENTIFIC_QUESTION")!;
    scientificQuestion.content = "Étudier une trajectoire longitudinale avec données rétrospectives existantes puis suivi prospectif";
    scientificQuestion.epistemicBoundary.sourceText = scientificQuestion.content;
    sourceContribution.source.turns[0].content = scientificQuestion.content;
    sourceContribution.source.originalRequest = scientificQuestion.content;
    const value = adoptBehaviorContribution(sourceContribution, null, 1);
    const invocation = result(value);
    expect(invocation.result?.nativePayload?.tradeOffs.length).toBeGreaterThan(0);
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [selection(invocation, value)] });
    const context = buildQueryNavigationContext({ projectRef: value.projectId, projectVersion: value.versionId, sourceState: evidence.sourceState, currentUsageRef: "PASS3A_LOCAL_OWNER_TRANSPORT" });
    const selected = selectNextAction(context);
    expect(selected.selected?.actionCategory).toBe("COMPARE_OPTIONS");
    expect(selected.selected?.informationValue.blocking).toBe("UNKNOWN");
    const sourceTradeOff = invocation.result!.nativePayload!.tradeOffs[0];
    expect(selected.selected?.affectedDecisionRefs).toContain(sourceTradeOff.tradeOffId);
    expect([...(selected.selected?.knownOptionRefs ?? [])].sort()).toEqual([...sourceTradeOff.optionRefs].sort());
    expect(selected.selected?.projectWriteAuthorized).toBe(false);
  });

  it("does not include unselected ledger entries in QRY context or digest", () => {
    const value = project();
    const first = result(value);
    const second = result(value, first.ledger, 1);
    const selected = [selection(first, value)];
    const before = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: first.ledger, activeOwnerResultRefs: selected });
    const after = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: second.ledger, activeOwnerResultRefs: selected });
    expect(after.contextDigest).toBe(before.contextDigest);
    expect(JSON.stringify(after)).not.toContain(second.entry.entryId);
    expect(JSON.stringify(after)).not.toContain("nativePayload");
    expect(JSON.stringify(after)).not.toContain("ledgerDigest");
  });

  it("recomputes the actual QRY consumer for changed applicable evidence with unchanged Project", () => {
    const value = project();
    const first = result(value);
    const second = result(value, first.ledger, 1);
    const evidence = (invocation: ReturnType<typeof result>) => buildCurrentNavigationEvidence({
      ...currentInput(value), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [selection(invocation, value)],
    });
    const beforeProject = JSON.stringify(value);
    const before = buildFunctionalResetQueryNavigation({ project: value, currentNavigationEvidence: evidence(first), recordedAt: AT });
    const after = buildFunctionalResetQueryNavigation({ project: value, previous: before, currentNavigationEvidence: evidence(second), recordedAt: AT });
    expect(after.sourceStateDigest).not.toBe(before.sourceStateDigest);
    expect(after.currentEvidenceDigest).not.toBe(before.currentEvidenceDigest);
    expect(JSON.stringify(value)).toBe(beforeProject);
    expect(after.projectVersion).toBe(before.projectVersion);
  });

  it("does not recompute the actual QRY consumer when only an unselected result is added", () => {
    const value = project();
    const first = result(value);
    const second = result(value, first.ledger, 1);
    const beforeEvidence = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: first.ledger, activeOwnerResultRefs: [selection(first, value)] });
    const afterEvidence = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: second.ledger, activeOwnerResultRefs: [selection(first, value)] });
    const before = buildFunctionalResetQueryNavigation({ project: value, currentNavigationEvidence: beforeEvidence, recordedAt: AT });
    const after = buildFunctionalResetQueryNavigation({ project: value, previous: before, currentNavigationEvidence: afterEvidence, recordedAt: "2026-09-08T12:00:09.000Z" });
    expect(after).toEqual(before);
  });

  it.each(["STALE", "SUPERSEDED", "REJECTED", "DEFERRED"] as const)("does not recompute for an explicitly %s result", (disposition) => {
    const value = project();
    const invocation = result(value);
    const before = buildCurrentNavigationEvidence(currentInput(value));
    const after = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [{ ...selection(invocation, value), disposition }] });
    expect(after.contextDigest).toBe(before.contextDigest);
    expect(after.ownerResults).toEqual([]);
  });

  it("excludes nonapplicable or non-current scope without changing active digest", () => {
    const value = project();
    const invocation = result(value);
    const before = buildCurrentNavigationEvidence(currentInput(value));
    for (const ref of [{ ...selection(invocation, value), applicability: "NOT_APPLICABLE" as const }, { ...selection(invocation, value), scopeRefs: ["unrelated-object"] }]) {
      const after = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [ref] });
      expect(after.contextDigest).toBe(before.contextDigest);
      expect(after.ownerResults).toEqual([]);
    }
  });

  it("excludes another Project even if the consumer proposes an overlapping object scope", () => {
    const value = project();
    const other = { ...value, projectId: "project:other" };
    const invocation = result(other);
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [selection(invocation, value)] });
    expect(evidence.ownerResults).toEqual([]);
    expect(evidence.excludedReferences.some((item) => item.reason === "OTHER_PROJECT_RESULT")).toBe(true);
  });

  it("excludes changed Project version/digest and checks the source snapshot separately", () => {
    const value = project();
    const invocation = result(value);
    const evolved = { ...value, versionId: `${value.versionId}:next`, projectDigest: `${value.projectDigest}:next` };
    const stale = buildCurrentNavigationEvidence({ ...currentInput(evolved), ownerResultLedger: invocation.ledger, activeOwnerResultRefs: [selection(invocation, value)] });
    expect(stale.ownerResults).toEqual([]);
    expect(stale.excludedReferences.some((item) => item.reason === "PROJECT_VERSION_CHANGED")).toBe(true);
    // A distinct snapshot can arise while callers keep the same coarse Project
    // tuple. A valid owner invocation binds that exact different snapshot.
    const originalSnapshot = buildProjectContextSnapshot({ project: value });
    const { snapshotDigest: _digest, ...material } = originalSnapshot;
    const alternateMaterial = { ...material, activeQryNeed: { id: "need:different-snapshot", purpose: "Qualification de binding", targetRefs: scopeRefs(value) } };
    const alternate = { ...alternateMaterial, snapshotDigest: logicalDigest(alternateMaterial) } as typeof originalSnapshot;
    const alternateInvocation = invokeStudyDesignForProjectSnapshot({ projectSnapshot: alternate, ledger: createProductOwnerResultLedger("session:alternate"), callerRef: "qry:alternate", purpose: "Qualification de binding", startedAt: AT, completedAt: AT });
    const differentSnapshot = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: alternateInvocation.ledger, activeOwnerResultRefs: [selection(alternateInvocation, value)] });
    expect(differentSnapshot.ownerResults).toEqual([]);
    expect(differentSnapshot.excludedReferences.some((item) => item.reason === "SNAPSHOT_DIGEST_CHANGED")).toBe(true);
  });

  it("retains distinct current conflicting owner needs instead of picking the newest one", () => {
    const value = project();
    let ledger: Readonly<ProductOwnerResultLedger> = createProductOwnerResultLedger("session:conflicting");
    const refs: CurrentNavigationOwnerResultRef[] = [];
    // Explicit synthetic contradictory contributions qualify transport only,
    // not their scientific validity. Neither ref supersedes the other.
    for (const [index, text] of ["Conserver la contrainte A pour comparer les branches.", "Écarter la contrainte A pour comparer les branches."].entries()) {
      const invocation = invokeStudyDesignForProjectSnapshot({
        projectSnapshot: buildProjectContextSnapshot({ project: value }), ledger, callerRef: `qry:synthetic:${index}`, purpose: `Synthetic transport ${index}`,
        startedAt: `2026-09-08T12:00:0${index}.000Z`, completedAt: `2026-09-08T12:00:0${index}.100Z`,
        runtime: (nativeInput) => {
          const base = versionedLocalResult(executeStudyDesignRuntime(nativeInput), index);
          const { proposalDigest: _digest, ...material } = structuredClone(base);
          const updated = { ...material, informationNeeds: [{ needId: `synthetic:conflicting:${index}`, question: text, reason: "Contradiction de fixture explicitement conservée sans arbitrage.", targetOwner: "RESEARCH_PROJECT" as const, intendedResolutionPath: "FUTURE_QRY_HANDOFF" as const, sourceRefs: scopeRefs(value), status: "OPEN_NOT_RESOLVED" as const }] };
          return { ...updated, proposalDigest: logicalDigest(updated) };
        },
      });
      ledger = invocation.ledger;
      refs.push(selection(invocation, value));
    }
    const evidence = buildCurrentNavigationEvidence({ ...currentInput(value), ownerResultLedger: ledger, activeOwnerResultRefs: refs });
    expect(evidence.ownerResults).toHaveLength(2);
    expect(evidence.sourceState.governedNeeds.map((need) => need.needId)).toEqual(expect.arrayContaining(["synthetic:conflicting:0", "synthetic:conflicting:1"]));
    expect(evidence.sourceState.governedNeeds.every((need) => need.projectWriteAuthorized === false)).toBe(true);
  });
});
