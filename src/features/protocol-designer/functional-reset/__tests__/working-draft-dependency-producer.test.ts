import { describe, expect, it } from "vitest";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { acceptWorkingDraftUpdate, prepareContinuousWorkingDraft, prepareWorkingDraftRequest, recommendedWorkingScope, type WorkingDraftUpdate } from "../continuous-project-build";
import { createFunctionalResetSession } from "../session";
import { selectedStudyProposalAtoms } from "../study-proposal-standard";
import type { ProductBridgeRequest } from "../../product-bridge";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import { logicalDigest } from "@/features/knowledge-engine/canonical";

// FIXTURE_PURPOSE: dependency cycles, option-bound explicit decisions, and owner review readiness.
// SOURCE_CLASS: SYNTHETIC_CURRENT_CONTRACT; ORIGINAL_SOURCE_FAMILY: DRCI T3 receipt.
// SANITIZATION: YES; no provider response or historical conversation is copied.
// CURRENT_CONTRACT_PROTECTED: reject cycles and hidden explicit decisions without Project adoption.
const preparation = (domain: typeof DOMAINS[number]) => {
  const session = createFunctionalResetSession();
  session.runtimeTurns = [{ turnId: "u1", role: "USER", content: domain.text, createdAt: session.createdAt },
    { turnId: "a1", role: "NOXIA", content: "LOCAL_SYNTHETIC — architecture de travail, non adoptée.", createdAt: session.createdAt }];
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
    currentProject: null, evaluatePersistentDelta: false, prepareWorkingDraft: true,
    workingDraftScientificSource: { kind: "BOUND_USER_TURN", sourceUserTurnId: "u1", sourceResponseTurnId: "a1",
      sourceDigest: logicalDigest(domain.text) } };
  const packet = prepareWorkingDraftRequest(request);
  const proposal = controlledStudyProposal(packet.inputDigest, domain);
  proposal.atoms.forEach(atom => { atom.dependencyQualifications = atom.dependsOn.map(ref => ({
    ref, kind: "HARD_BLOCKING_DEPENDENCY", rationale: "Prérequis scientifique indispensable." })); });
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
  it("rejects a mixed dependency cycle without mutating the provider proposal", () => {
    const p = preparation(DOMAINS[4]);
    dependency(p, "measurement", "practical", "HARD_BLOCKING_DEPENDENCY");
    dependency(p, "practical", "measurement", "SOFT_REFINEMENT_DEPENDENCY");
    const before = JSON.stringify(p.update);
    expect(() => admit(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
    expect(JSON.stringify(p.update)).toBe(before);
  });

  it("does not let cycle repair silently expose an explicit decision hidden in an unselected option", () => {
    const p = preparation(DOMAINS[4]);
    dependency(p, "measurement", "practical", "HARD_BLOCKING_DEPENDENCY");
    dependency(p, "practical", "measurement", "SOFT_REFINEMENT_DEPENDENCY");
    expect(() => admit(p)).toThrow("STUDY_PROPOSAL_DEPENDENCY_CYCLE");
    const practical = p.proposal.atoms.find(a => a.ref === "practical")!;
    practical.dependsOn = [];
    practical.dependencyQualifications = [];
    p.update.explicitDecisions = [{ atomRef: "age-classes", sourceTurnRef: "u1", quote: DOMAINS[4].text }];
    expect(() => admit(p)).toThrow("WORKING_DRAFT_EXPLICIT_DECISION_HIDDEN_BY_ARBITRATION");
    expect(p.session.project).toBeNull();
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
