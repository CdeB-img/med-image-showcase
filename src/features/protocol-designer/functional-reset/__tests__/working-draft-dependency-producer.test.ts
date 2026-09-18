import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { acceptContextualStudyProposal, type ContextualStudyProposal } from "@/features/scientific-thinking/contextual-study-proposal";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { acceptWorkingDraftUpdate, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, recommendedWorkingScope, validatePreparedWorkingReview, type WorkingDraftUpdate } from "../continuous-project-build";
import { createFunctionalResetSession } from "../session";
import { selectedStudyProposalAtoms } from "../study-proposal-standard";
import type { ProductBridgeRequest } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

// Historical negative control is immutable. Derived responses below are SYNTHETIC,
// not evidence of provider generation or historical T3 admission.
const receipts = JSON.parse(readFileSync(resolve("validation/noxia-drci-release-closure-from-astra-01/BACKGROUND_RECEIPTS.json"), "utf8"));
const historical = JSON.parse(receipts[2].rawReply) as WorkingDraftUpdate;
const validateHistorical = (proposal: ContextualStudyProposal) => acceptContextualStudyProposal(proposal, {
  contextDigest: receipts[2].context.contextDigest,
  sourceTurnRef: receipts[2].context.RECENT_CONVERSATION.at(-2).ref,
  sourceResponseRef: receipts[2].context.RECENT_CONVERSATION.at(-1).ref,
  sourceProject: null, applicableEvidenceRefs: [],
});
const preparation = (domain: typeof DOMAINS[number]) => {
  const session = createFunctionalResetSession();
  session.runtimeTurns = [{ turnId: "u1", role: "USER", content: domain.text, createdAt: session.createdAt },
    { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — architecture de travail, non adoptée.", createdAt: session.createdAt }];
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
    currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true };
  const packet = prepareWorkingDraftRequest(request);
  const proposal = controlledStudyProposal(packet.inputDigest, domain);
  const update: WorkingDraftUpdate = { requestType: "STUDY_UPDATE", proposal, explicitDecisions: [], inferredAtomRefs: [], rejectedAtomRefs: [] };
  return { session, request, packet, proposal, update };
};
const dependency = (p: ReturnType<typeof preparation>, dependent: string, prerequisite: string,
  kind: "HARD_BLOCKING_DEPENDENCY" | "SOFT_REFINEMENT_DEPENDENCY" | "OPTIONAL_DETAIL") => {
  const atom = p.proposal.atoms.find(a => a.ref === dependent)!;
  atom.dependsOn = [prerequisite];
  atom.dependencyQualifications = [{ ref: prerequisite, kind, rationale: "Prérequis orienté, qualification scientifique explicite." }];
};
const admit = (p: ReturnType<typeof preparation>) => acceptWorkingDraftUpdate(p.update, p.request).composition!;

describe("Working Draft dependency producer — native graph invariants", () => {
  it("keeps the exact historical T3 mixed cycle rejected without modifying its payload", () => {
    const before = JSON.stringify(historical);
    expect(() => validateHistorical(historical.proposal!)).toThrow("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
    expect(JSON.stringify(historical)).toBe(before);
  });

  it("admits a SYNTHETIC same-science DAG and preserves the indispensable diagnostic prerequisite", () => {
    const session = createFunctionalResetSession();
    session.runtimeTurns = receipts[2].context.RECENT_CONVERSATION.map(t => ({ turnId: t.ref, role: t.role, content: t.content, createdAt: session.createdAt }));
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
      currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true };
    const packet = prepareWorkingDraftRequest(request);
    const synthetic = structuredClone(historical);
    synthetic.proposal!.contextDigest = packet.inputDigest;
    const measurement = synthetic.proposal!.atoms.find(a => a.ref === "A13")!;
    // This particular edge's historical rationale describes contextual indication,
    // not a prerequisite of the acquisition. Keep that information as explanation.
    const contextual = measurement.dependencyQualifications!.find(q => q.ref === "A7")!;
    measurement.rationale += ` ${contextual.rationale}`;
    measurement.dependsOn = measurement.dependsOn.filter(r => r !== "A7");
    measurement.dependencyQualifications = measurement.dependencyQualifications!.filter(q => q.ref !== "A7");
    expect(synthetic.proposal!.atoms.map(a => [a.ref, a.content])).toEqual(historical.proposal!.atoms.map(a => [a.ref, a.content]));
    expect(synthetic.proposal!.arbitrations).toEqual(historical.proposal!.arbitrations);
    const composition = acceptWorkingDraftUpdate(synthetic, request).composition!;
    const scope = recommendedWorkingScope(composition);
    expect(scope.selectedAtomRefs).toContain("A13");
    // Historical arbitration leaves this population in an unselected alternative;
    // repairing its graph must not also change the scientific recommendation.
    expect(scope.selectedAtomRefs).not.toContain("A7");
    expect(selectedStudyProposalAtoms(composition, scope.selectedOptionRefs, scope.selectedAtomRefs)).toContain("A13");
    expect(composition.proposal.atoms.find(a => a.ref === "A7")!.dependencyQualifications).toContainEqual(expect.objectContaining({ ref: "A13", kind: "HARD_BLOCKING_DEPENDENCY" }));
    expect(() => selectedStudyProposalAtoms(composition, [], ["A7"])).toThrow("STUDY_PROPOSAL_ALTERNATIVE_REQUIRES_OPTION_SELECTION");
    expect(() => selectedStudyProposalAtoms(composition, ["R1O2"], ["A1"])).toThrow("STUDY_PROPOSAL_DEPENDENCY_NOT_SELECTED");
    const draft = prepareContinuousWorkingDraft(session, composition, synthetic, packet.inputDigest);
    expect(draft.failure).toBeNull(); expect(draft.readyReview).not.toBeNull();
    const current = { ...session, studyProposal: composition, workingDraft: draft };
    expect(validatePreparedWorkingReview(current)).not.toBeNull();
    current.runtimeTurns.push({ turnId: "u4", role: "USER", content: "je retiens cette architecture, montre-moi ce qui va être enregistré" });
    expect(validatePreparedWorkingReview(current)).not.toBeNull();
    expect(current.project).toBeNull(); expect(draft.readyReview!.candidate.projectWriteAuthorized).toBe(false);
  });

  it.each([DOMAINS[2], DOMAINS[4]])("preserves $id prerequisites without reciprocal contextual dependencies", domain => {
    const p = preparation(domain);
    const population = p.proposal.atoms.find(a => a.ref === "population")!;
    const measurement = p.proposal.atoms.find(a => a.ref === "measurement")!;
    population.content = domain.id === "OBS_NON_IMAGING" ? "Travailleurs disposant de registres professionnels permettant le suivi" : "Plaques compatibles avec la plage de mesure des dispositifs comparés";
    measurement.rationale += ` Contexte de sélection : ${population.content}.`;
    dependency(p, "population", "measurement", "HARD_BLOCKING_DEPENDENCY");
    const contents = p.proposal.atoms.map(a => a.content);
    const composition = admit(p), scope = recommendedWorkingScope(composition);
    expect(composition.proposal.atoms.map(a => a.content)).toEqual(contents);
    expect(scope.selectedAtomRefs).toEqual(expect.arrayContaining(["population", "measurement"]));
    expect(() => selectedStudyProposalAtoms(composition, [], ["population"])).toThrow("STUDY_PROPOSAL_DEPENDENCY_NOT_SELECTED");
    const draft = prepareContinuousWorkingDraft(p.session, composition, p.update, p.packet.inputDigest);
    expect(draft.readyReview).not.toBeNull(); expect(p.session.project).toBeNull();
  });

  it.each([
    ["HARD_BLOCKING_DEPENDENCY", "HARD_BLOCKING_DEPENDENCY"],
    ["HARD_BLOCKING_DEPENDENCY", "SOFT_REFINEMENT_DEPENDENCY"],
    ["SOFT_REFINEMENT_DEPENDENCY", "OPTIONAL_DETAIL"],
  ] as const)("rejects a real %s / %s cycle", (first, second) => {
    const p = preparation(DOMAINS[4]);
    dependency(p, "measurement", "practical", first); dependency(p, "practical", "measurement", second);
    expect(() => admit(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
  });
  it("rejects a transitive mixed cycle and missing references", () => {
    const p = preparation(DOMAINS[4]);
    dependency(p, "measurement", "practical", "HARD_BLOCKING_DEPENDENCY");
    dependency(p, "practical", "timing", "SOFT_REFINEMENT_DEPENDENCY");
    dependency(p, "timing", "measurement", "OPTIONAL_DETAIL");
    expect(() => admit(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
    dependency(p, "timing", "absent", "HARD_BLOCKING_DEPENDENCY");
    expect(() => admit(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_INVALID");
  });
  it("keeps incompatible alternatives blocked and autonomous OPEN details unadopted", () => {
    const p = preparation(DOMAINS[4]);
    const composition = admit(p);
    expect(() => selectedStudyProposalAtoms(composition, ["continuous-option", "classes-option"])).toThrow("STUDY_PROPOSAL_EXCLUSIVE_SELECTION_INVALID");
    p.proposal.atoms.find(a => a.ref === "practical")!.status = "OPEN_DECISION";
    dependency(p, "measurement", "practical", "SOFT_REFINEMENT_DEPENDENCY");
    const scope = recommendedWorkingScope(admit(p));
    expect(scope.selectedAtomRefs).toContain("measurement"); expect(scope.selectedAtomRefs).not.toContain("practical");
    dependency(p, "measurement", "practical", "HARD_BLOCKING_DEPENDENCY");
    expect(recommendedWorkingScope(admit(p)).selectedAtomRefs).not.toContain("measurement");
  });
  it("changes background instructions only, without scenario rules or mutation of the request", () => {
    const p = preparation(DOMAINS[4]), chat = prepareTerraConversation(p.request), before = JSON.stringify(p.request);
    const packet = prepareWorkingDraftRequest(p.request);
    expect(packet.instruction).toContain("GRAPHE DE PRÉREQUIS");
    expect(packet.instruction).not.toMatch(/A7|A13|myocardite|métrologie|rugosité/u);
    expect(prepareTerraConversation(p.request)).toEqual(chat);
    expect(JSON.stringify(p.request)).toBe(before);
  });
});
