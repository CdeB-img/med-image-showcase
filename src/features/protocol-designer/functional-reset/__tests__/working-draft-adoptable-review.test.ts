import { describe, expect, it } from "vitest";
import { acceptWorkingDraftUpdate, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, recommendedWorkingScope, refreshWorkingDraftReview, validatePreparedWorkingReview, workingDraftReviewCoverage, type WorkingDraftUpdate } from "../continuous-project-build";
import { selectedStudyProposalAtoms, rehydrateStudyProposal } from "../study-proposal-standard";
import { contributionDecisionScopeGroups, confirmResearchProjectContribution } from "@/features/research-project-construction";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import type { ProductBridgeRequest } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import { logicalDigest } from "@/features/knowledge-engine/canonical";

const preparation = (domain: typeof DOMAINS[number] = DOMAINS[1]) => {
  const session = createFunctionalResetSession();
  session.runtimeTurns = [{ turnId: "u1", role: "USER", content: domain.text, createdAt: session.createdAt },
    { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — architecture de travail, non adoptée.", createdAt: session.createdAt }];
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
    currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true };
  const packet = prepareWorkingDraftRequest(request);
  const proposal = controlledStudyProposal(packet.inputDigest, domain);
  proposal.atoms.forEach(a => { a.dependencyQualifications = a.dependsOn.map(ref => ({ ref, kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Prérequis scientifique indispensable." })); });
  const update: WorkingDraftUpdate = { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] };
  return { session, request, packet, proposal, update };
};
const qualify = (p: ReturnType<typeof preparation>, parent: string, child: string, kind: "HARD_BLOCKING_DEPENDENCY" | "SOFT_REFINEMENT_DEPENDENCY" | "OPTIONAL_DETAIL") => {
  const atom = p.proposal.atoms.find(a => a.ref === parent)!;
  atom.dependsOn = [child]; atom.dependencyQualifications = [{ ref: child, kind, rationale: "Qualification explicite du propriétaire de composition." }];
};
const accepted = (p: ReturnType<typeof preparation>) => acceptWorkingDraftUpdate(p.update, p.request).composition!;

describe("adoptable parent decisions with unadopted open refinements — native owners", () => {
  it("keeps an explicit premise common to two unresolved options in the persisted review", () => {
    const p = preparation();
    const endpoint = p.proposal.atoms.find(a => a.ref === "endpoint")!;
    p.update.explicitDecisions = [{ atomRef: endpoint.ref, sourceTurnRef: "u1", quote: p.session.runtimeTurns[0].content }];
    const open = { ...structuredClone(p.proposal.atoms.find(a => a.ref === "timing")!),
      ref: "blood-window-open", semanticKey: "blood.window.open", status: "OPEN_DECISION" as const,
      content: "Le nombre et la fenêtre des prélèvements restent à préciser.", dependsOn: [], dependencyQualifications: [] };
    p.proposal.atoms.push(open);
    const original = p.proposal.arbitrations[0];
    p.proposal.arbitrations.push({ ...structuredClone(original), ref: "blood-calendar", label: "Calendrier du prélèvement",
      affectedBranches: ["COLLECTION"], recommendedRefs: ["single-draw"],
      options: original.options.map((option, index) => ({ ...option, ref: index ? "two-draws" : "single-draw",
        label: index ? "Deux prélèvements" : "Un prélèvement", atomRefs: [endpoint.ref, open.ref] })) });
    const composition = accepted(p);
    const calendar = composition.proposal.arbitrations.find(a => a.ref === "blood-calendar")!;
    expect(calendar.options.map(option => option.atomRefs)).toEqual([[open.ref], [open.ref]]);
    const coverage = workingDraftReviewCoverage(composition);
    expect(coverage.stable).toContain(endpoint.ref);
    expect(coverage.open).toContain(open.ref);
    expect(recommendedWorkingScope(composition).selectedOptionRefs).not.toContain("single-draw");
    const draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest);
    expect(draft.failure).toBeNull();
    expect(draft.readyReview?.contribution.scientificContent.candidateObjects.some(item => item.content === endpoint.content)).toBe(true);
    const current = { ...p.session, studyProposal: composition, workingDraft: draft };
    persistFunctionalResetSession(localStorage, current);
    const reloaded = loadFunctionalResetSession(localStorage);
    const ready = validatePreparedWorkingReview(reloaded);
    expect(ready).not.toBeNull();
    const adopted = confirmResearchProjectContribution({ contribution: ready!.contribution, current: null,
      projectId: p.session.projectId, authority: p.session.projectAuthority, confirmedAt: p.session.updatedAt,
      reviewedProjection: ready!.candidate.humanReviewProjection,
      selectedChangeRefs: ready!.candidate.humanReviewProjection.coveredChangeRefs });
    expect(adopted.revision).toBe(1);
    expect(adopted.canonicalState.objects.some(object => object.content === endpoint.content)).toBe(true);
    expect(adopted.canonicalState.objects.some(object => object.content === open.content)).toBe(false);
  });
  it.each([DOMAINS[1], DOMAINS[2], DOMAINS[4]])("rejects an explicit $id endpoint hidden inside an unresolved alternative", domain => {
    const p = preparation(domain);
    p.update.explicitDecisions = [{ atomRef: "endpoint", sourceTurnRef: "u1", quote: domain.text }];
    p.proposal.arbitrations[0].options[1].atomRefs.push("endpoint");
    expect(() => accepted(p)).toThrow("WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION");
    expect(p.session.project).toBeNull();
  });
  it("does not lift a shared explicit atom that still depends on an exclusive option", () => {
    const p = preparation();
    p.update.explicitDecisions = [{ atomRef: "endpoint", sourceTurnRef: "u1", quote: p.session.runtimeTurns[0].content }];
    qualify(p, "endpoint", "age-continuous", "HARD_BLOCKING_DEPENDENCY");
    p.proposal.arbitrations[0].recommendedRefs = [];
    for (const option of p.proposal.arbitrations[0].options) option.atomRefs.push("endpoint");
    expect(() => accepted(p)).toThrow("WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION");
  });
  it("keeps the guard closed when lifting common decisions would empty an option", () => {
    const p = preparation();
    p.update.explicitDecisions = ["question", "endpoint"].map(atomRef => ({
      atomRef, sourceTurnRef: "u1", quote: p.session.runtimeTurns[0].content }));
    p.proposal.arbitrations[0].recommendedRefs = [];
    for (const option of p.proposal.arbitrations[0].options) option.atomRefs = ["question", "endpoint"];
    expect(() => accepted(p)).toThrow("WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION");
  });
  it("rejects hidden explicit decisions even when wrongly grouped prerequisites cause a dependency cascade", () => {
    const p = preparation();
    p.update.explicitDecisions = [{ atomRef: "endpoint", sourceTurnRef: "u1", quote: p.session.runtimeTurns[0].content }];
    qualify(p, "endpoint", "measurement", "HARD_BLOCKING_DEPENDENCY");
    p.proposal.arbitrations[0].options[1].atomRefs.push("measurement", "endpoint");
    expect(() => accepted(p)).toThrow("WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION");
  });
  it("retains the explicit stable core while genuine alternatives stay unresolved and unadopted", () => {
    const p = preparation();
    p.update.explicitDecisions = [{ atomRef: "endpoint", sourceTurnRef: "u1", quote: p.session.runtimeTurns[0].content }];
    p.proposal.arbitrations[0].recommendedRefs = [];
    qualify(p, "age-continuous", "endpoint", "HARD_BLOCKING_DEPENDENCY");
    qualify(p, "age-classes", "endpoint", "HARD_BLOCKING_DEPENDENCY");
    const composition = accepted(p), coverage = workingDraftReviewCoverage(composition);
    expect(coverage.stable).toContain("endpoint");
    expect(coverage.stable).not.toContain("age-continuous");
    expect(coverage.stable).not.toContain("age-classes");
    const draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest);
    expect(draft.failure).toBeNull();
    expect(draft.readyReview?.contribution.scientificContent.candidateObjects.some(a => a.content === p.proposal.atoms.find(a => a.ref === "endpoint")!.content)).toBe(true);
    expect(p.session.project).toBeNull();
  });
  it("preserves a genuine hard blocker and a user-declared unknown instead of forcing them into review", () => {
    const p = preparation();
    p.proposal.atoms.find(a => a.ref === "timing")!.status = "OPEN_DECISION";
    p.proposal.arbitrations[0].options[1].atomRefs.push("bounds");
    p.update.explicitDecisions = ["endpoint", "bounds"].map(atomRef => ({ atomRef, sourceTurnRef: "u1", quote: p.session.runtimeTurns[0].content }));
    qualify(p, "endpoint", "timing", "HARD_BLOCKING_DEPENDENCY");
    const coverage = workingDraftReviewCoverage(accepted(p));
    expect(coverage.excluded.find(a => a.ref === "endpoint")?.reason).toBe("HARD_DEPENDENCY_NOT_SATISFIED");
    expect(coverage.open).toContain("bounds");
    expect(coverage.stable).not.toContain("bounds");
  });
  it.each([
    ["RCT", 1, "measurement", "timing", "Examen de suivi à trois mois", "Paramètres d'acquisition à préciser"],
    ["LONGITUDINAL", 2, "timing", "practical", "Trois temps de mesure : initial, six mois et un an", "Fenêtres de tolérance à préciser"],
    ["MULTIMODAL", 3, "measurement", "practical", "Prélèvement sanguin à la visite finale", "Panel biologique exact à préciser"],
    ["METHOD_COMPARISON", 4, "analysis", "practical", "Accord principal par Bland–Altman", "Marge acceptable à discuter avant interprétation"],
   ] as const)("keeps autonomous $0 parent adoptable while the refinement remains open", (_domain, index, parentRef, childRef, parent, child) => {
    const p = preparation(DOMAINS[index]);
    Object.assign(p.proposal.atoms.find(a => a.ref === parentRef)!, { content: parent, ...(_domain === "MULTIMODAL" ? {owner: "OBS" as const} : {}) });
    Object.assign(p.proposal.atoms.find(a => a.ref === childRef)!, { status: "OPEN_DECISION", content: child });
    qualify(p, parentRef, childRef, "SOFT_REFINEMENT_DEPENDENCY");
    const composition = accepted(p), scope = recommendedWorkingScope(composition);
    expect(selectedStudyProposalAtoms(composition, scope.selectedOptionRefs, scope.selectedAtomRefs)).toContain(parentRef);
    expect(scope.selectedAtomRefs).not.toContain(childRef);
    const draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest), ready = draft.readyReview!;
    expect(draft.failure).toBeNull();
    expect(ready.contribution.scientificContent.clarificationNeeds.some(i => i.content === child && i.epistemicBoundary.epistemicState === "UNKNOWN")).toBe(true);
    const coverage = workingDraftReviewCoverage(composition);
    expect(ready.contribution.scientificContent.candidateObjects).toHaveLength(coverage.stable.length);
    expect(ready.candidate.canonicalChangeSet.objectChanges.some(c => c.candidate?.content === child)).toBe(false);
    expect(ready.candidate.projectWriteAuthorized).toBe(false); expect(p.session.project).toBeNull();
    const current = { ...p.session, studyProposal: composition, workingDraft: draft };
    persistFunctionalResetSession(localStorage, current);
    const reloaded = loadFunctionalResetSession(localStorage);
    expect(validatePreparedWorkingReview(reloaded)).not.toBeNull();
    expect(reloaded.studyProposal?.proposal.atoms.find(a => a.ref === parentRef)?.dependencyQualifications).toEqual(p.proposal.atoms.find(a => a.ref === parentRef)?.dependencyQualifications);
  });
  it.each(["HARD_BLOCKING_DEPENDENCY", "LEGACY_UNQUALIFIED"])("preserves $0 closure through an unresolved indispensable prerequisite", kind => {
    const p = preparation(); p.proposal.atoms.find(a => a.ref === "timing")!.status = "OPEN_DECISION";
    qualify(p, "measurement", "timing", "HARD_BLOCKING_DEPENDENCY"); qualify(p, "endpoint", "measurement", "HARD_BLOCKING_DEPENDENCY");
    if (kind === "LEGACY_UNQUALIFIED") p.proposal.atoms.forEach(a => { delete a.dependencyQualifications; });
    const composition = accepted(p), coverage = workingDraftReviewCoverage(composition);
    expect(coverage.stable).not.toContain("measurement"); expect(coverage.stable).not.toContain("endpoint");
    expect(coverage.excluded.find(a => a.ref === "measurement")?.reason).toBe("HARD_DEPENDENCY_NOT_SATISFIED");
    expect(() => selectedStudyProposalAtoms(composition, [], ["measurement"])).toThrow("STUDY_PROPOSAL_DEPENDENCY_NOT_SELECTED");
    expect(() => selectedStudyProposalAtoms(composition, [], ["timing"])).toThrow("STUDY_PROPOSAL_UNKNOWN_CANNOT_BE_ADOPTED");
    expect(rehydrateStudyProposal(composition, null)).not.toBeNull();
  });
  it("keeps optional details without forcing their selection", () => {
    const p = preparation(); p.proposal.atoms.find(a => a.ref === "timing")!.status = "OPEN_DECISION";
    qualify(p, "measurement", "timing", "OPTIONAL_DETAIL");
    expect(recommendedWorkingScope(accepted(p)).selectedAtomRefs).toContain("measurement");
  });
  it.each(["missing", "duplicate", "foreign"])("rejects $0 qualifications rather than silently weakening links", type => {
    const p = preparation(); qualify(p, "measurement", "timing", "SOFT_REFINEMENT_DEPENDENCY");
    const atom = p.proposal.atoms.find(a => a.ref === "measurement")!;
    if (type === "missing") atom.dependencyQualifications = [];
    if (type === "duplicate") atom.dependencyQualifications!.push({ ...atom.dependencyQualifications![0] });
    if (type === "foreign") atom.dependencyQualifications![0].ref = "design";
    expect(() => accepted(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_QUALIFICATION_INVALID");
  });
  it("preserves cycle and mutually exclusive option rejection", () => {
    const p = preparation(); qualify(p, "measurement", "timing", "SOFT_REFINEMENT_DEPENDENCY"); qualify(p, "timing", "measurement", "SOFT_REFINEMENT_DEPENDENCY");
    expect(() => accepted(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
    const composition = accepted(preparation());
    expect(() => selectedStudyProposalAtoms(composition, ["continuous-option", "classes-option"])).toThrow("STUDY_PROPOSAL_EXCLUSIVE_SELECTION_INVALID");
  });
  it("closes option removal before retaining parents that require that option", () => {
    const p = preparation(); p.proposal.atoms.find(a => a.ref === "timing")!.status = "OPEN_DECISION";
    p.proposal.arbitrations[0].options[0].atomRefs.push("timing"); qualify(p, "endpoint", "age-continuous", "HARD_BLOCKING_DEPENDENCY");
    const composition = accepted(p), scope = recommendedWorkingScope(composition);
    expect(scope.selectedOptionRefs).not.toContain("continuous-option"); expect(scope.selectedAtomRefs).not.toContain("endpoint");
    expect(() => selectedStudyProposalAtoms(composition, scope.selectedOptionRefs, scope.selectedAtomRefs)).not.toThrow();
  });
  it("uses native relation groups to prevent an incoherent partial human decision and permit independent deselection", () => {
    const p = preparation(); qualify(p, "endpoint", "measurement", "HARD_BLOCKING_DEPENDENCY");
    const composition = accepted(p), draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest), ready = draft.readyReview!;
    const groups = contributionDecisionScopeGroups(ready.candidate);
    const changeFor = (text: string) => ready.candidate.canonicalChangeSet.objectChanges.find(c => c.candidate?.content === text)!.changeRef;
    const measurement = changeFor(p.proposal.atoms.find(a => a.ref === "measurement")!.content);
    const endpoint = changeFor(p.proposal.atoms.find(a => a.ref === "endpoint")!.content);
    expect(groups.some(g => g.includes(measurement) && g.includes(endpoint))).toBe(true);
    const confirm = (refs: readonly string[]) => confirmResearchProjectContribution({ contribution: ready.contribution, current: null,
      projectId: p.session.projectId, authority: p.session.projectAuthority, confirmedAt: p.session.updatedAt,
      reviewedProjection: ready.candidate.humanReviewProjection, selectedChangeRefs: refs });
    expect(() => confirm(ready.candidate.humanReviewProjection.coveredChangeRefs.filter(r => r !== measurement))).toThrow("PRJ_PARTIAL_DECISION_SCOPE_REQUIRES_SEPARABLE_REVIEWED_CHANGES");
    const descriptor = changeFor(p.proposal.atoms.find(a => a.ref === "descriptor")!.content);
    const independent = groups.find(g => g.includes(descriptor))!;
    expect(independent).not.toContain(measurement);
    expect(() => confirm(ready.candidate.humanReviewProjection.coveredChangeRefs.filter(r => !independent.includes(r)))).not.toThrow();
    expect(p.session.project).toBeNull();
  });
  it("passes actual purpose/enums/owner coupling and dependency kinds to the existing Terra preparation", () => {
    const p = preparation(), values = JSON.parse(p.packet.context).nativeContractValues;
    expect(values.dependencyKinds).toEqual(["HARD_BLOCKING_DEPENDENCY", "SOFT_REFINEMENT_DEPENDENCY", "OPTIONAL_DETAIL"]);
    expect(values.ownerAreas.STUDY_DESIGN).toContain("TIMING"); expect(values.variableRoles).toContain("OUTCOME_VARIABLE");
    expect(p.packet.instruction).toContain("previousStudyProposal"); expect(p.packet.instruction).toContain("dependencyQualifications");
  });
  it("qualifies only the native candidate scope and defers an open specialized branch with no available handoff", () => {
    const p = preparation();
    const branch = p.proposal.atoms.find(a => a.ref === "age-classes")!;
    Object.assign(branch, { owner: "IMAGING", area: "MEASUREMENTS", status: "OPEN_DECISION", content: "Modalité spécialisée non déterminée, à discuter" });
    const composition = accepted(p);
    expect(composition.proposal.atoms.find(a => a.ref === branch.ref)?.status).toBe("OPEN_DECISION");
    expect(composition.ownerReceipts.some(r => r.owner === "IMAGING")).toBe(false);
    expect(prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest).readyReview).not.toBeNull();
    expect(() => selectedStudyProposalAtoms(composition, ["classes-option"])).toThrow("STUDY_PROPOSAL_UNKNOWN_CANNOT_BE_ADOPTED");
  });
  it("requires owner qualification before selecting a previously unqualified alternative", () => {
    const composition = accepted(preparation());
    expect(() => selectedStudyProposalAtoms(composition, ["classes-option"])).toThrow("STUDY_PROPOSAL_OWNER_QUALIFICATION_REQUIRED");
  });
  it("selects the stable part of a qualified option and keeps its downstream implementation detail open", () => {
    const p = preparation(); p.proposal.atoms.find(a => a.ref === "allocation")!.status = "OPEN_DECISION";
    qualify(p, "allocation", "age-continuous", "HARD_BLOCKING_DEPENDENCY");
    p.proposal.arbitrations[0].options[0].atomRefs.push("allocation");
    const composition = accepted(p), scope = recommendedWorkingScope(composition);
    expect(scope.selectedOptionRefs).toContain("continuous-option");
    const selected = selectedStudyProposalAtoms(composition, scope.selectedOptionRefs, scope.selectedAtomRefs);
    expect(selected).toContain("age-continuous"); expect(selected).not.toContain("allocation");
    expect(composition.proposal.arbitrations[0].options[0].atomRefs).toContain("allocation");
    expect(composition.proposal.atoms.find(a => a.ref === "allocation")!.dependsOn).toEqual(["age-continuous"]);
    const draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest);
    expect(draft.readyReview?.contribution.scientificContent.clarificationNeeds.some(i => i.content === p.proposal.atoms.find(a => a.ref === "allocation")!.content)).toBe(true);
  });
  it("refreshes only an obsolete native selection projection without replacing scientific content, history or counters", () => {
    const p = preparation(), composition = accepted(p), draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest);
    const current = { ...p.session, studyProposal: composition, workingDraft: draft };
    expect(refreshWorkingDraftReview(current)).toBeNull();
    const legacy = { ...current, workingDraft: { ...draft, reviewScopeDigest: undefined } };
    expect(validatePreparedWorkingReview(legacy)).toBeNull();
    const refreshed = refreshWorkingDraftReview(legacy)!;
    expect(refreshed.studyProposal.proposal).toEqual(composition.proposal); expect(refreshed.studyProposal.digest).toBe(composition.digest);
    expect(refreshed.workingDraft.metrics).toEqual(draft.metrics); expect(refreshed.workingDraft.history).toEqual(draft.history);
    expect(validatePreparedWorkingReview({ ...current, ...refreshed })).not.toBeNull(); expect(p.session.project).toBeNull();
    const reviewRequest = { ...legacy, runtimeTurns: [...legacy.runtimeTurns, { turnId: "pure-review", role: "USER" as const,
      content: "je retiens cette architecture, montre-moi ce qui va être enregistré" }] };
    expect(refreshWorkingDraftReview(reviewRequest)?.studyProposal.digest).toBe(composition.digest);
    const tampered = structuredClone(current); tampered.workingDraft.readyReview!.contribution.scientificContent.candidateObjects[0].content = "UNTRUSTED";
    expect(validatePreparedWorkingReview(tampered)).toBeNull(); expect(refreshWorkingDraftReview(tampered)).toBeNull();
  });
  it("does not authorize support references supplied by a cached candidate itself", () => {
    const p = preparation(), composition = accepted(p), draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest);
    const proposal = structuredClone(composition.proposal);
    proposal.atoms[0].evidenceRefs = ["UNAUTHORIZED_CANDIDATE_REFERENCE"];
    proposal.atoms[0].status = "EVIDENCE_SUPPORTED_PROPOSAL";
    const digest = logicalDigest({ proposal, sourceProject: composition.originalSourceProject,
      sourceTurnRef: composition.sourceTurnRef, sourceResponseRef: composition.sourceResponseRef });
    const poisoned = { ...composition, proposal, digest, proposalRef: `scientific-study-proposal:${digest}` };
    const cached = { ...p.session, studyProposal: poisoned, workingDraft: { ...draft, compositionDigest: poisoned.digest, reviewScopeDigest: undefined } };
    expect(() => refreshWorkingDraftReview(cached)).toThrow("STUDY_PROPOSAL_EVIDENCE_INVALID");
    expect(p.session.project).toBeNull();
  });

});
