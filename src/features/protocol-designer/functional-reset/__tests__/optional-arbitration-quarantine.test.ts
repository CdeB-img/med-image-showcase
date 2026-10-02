import { describe, expect, it } from "vitest";
import { acceptWorkingDraftUpdate, prepareContinuousWorkingDraft, prepareWorkingDraftRequest,
  quarantineStructurallyInvalidOptionalArbitrations, type WorkingDraftUpdate } from "../continuous-project-build";
import { assertStudyProposalOptionBindings, type ContextualStudyProposal, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { createFunctionalResetSession } from "../session";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";
import type { ProductBridgeRequest } from "../../product-bridge";
import { realStudyUpdateClosure } from "./fixtures/study-update-closure-real-run";
import { logicalDigest } from "@/features/knowledge-engine/canonical";

const setup = () => {
  const session = createFunctionalResetSession();
  session.runtimeTurns = [{ turnId: "u1", role: "USER", content: DOMAINS[1].text, createdAt: session.createdAt },
    { turnId: "n1", role: "NOXIA", content: "LOCAL_SYNTHETIC — proposition non adoptée.", createdAt: session.createdAt }];
  const request: ProductBridgeRequest = { apiVersion: "1.0.0", currentProject: null,
    conversation: { conversationId: session.conversationId, language: "fr", turns: session.runtimeTurns },
    evaluatePersistentDelta: false, prepareWorkingDraft: true, workingDraftScientificSource: {
      kind: "BOUND_USER_TURN", sourceUserTurnId: "u1", sourceResponseTurnId: "n1", sourceDigest: logicalDigest(DOMAINS[1].text) } };
  const update: WorkingDraftUpdate = { requestType: "STUDY_UPDATE",
    proposal: controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest, DOMAINS[1]),
    explicitDecisions: [{ atomRef: "design", sourceTurnRef: "u1", quote: DOMAINS[1].text }], inferredAtomRefs: [], rejectedAtomRefs: [] };
  return { session, request, update, proposal: update.proposal! };
};
const addBroken = (proposal: ContextualStudyProposal, ref = "synthetic-optional", bound = "bounds") => {
  const arbitration = { ...structuredClone(proposal.arbitrations[0]), ref, recommendedRefs: [],
    options: [{ ...proposal.arbitrations[0].options[0], ref: `${ref}:broken`, atomRefs: [`${ref}:missing`] },
      { ...proposal.arbitrations[0].options[0], ref: `${ref}:valid`, atomRefs: [bound] }] };
  proposal.arbitrations.push(arbitration);
  return arbitration;
};
const normalize = (proposal: ContextualStudyProposal, previous: StudyProposalComposition | null = null, explicit: readonly string[] = []) =>
  quarantineStructurallyInvalidOptionalArbitrations(proposal, previous, explicit);

describe("safe whole-arbitration quarantine — no provider, no scientific adoption", () => {
  it("quarantines an entirely unbound optional arbitration and retains identifier-only provenance", () => {
    const { proposal } = setup(), optional = addBroken(proposal);
    optional.options[1].atomRefs = ["second-missing"];
    expect(normalize(proposal)).toEqual([{ arbitrationId: optional.ref, invalidOptionCount: 2,
      missingRefCount: 2, reason: "STRUCTURALLY_INVALID_OPTION_BINDING" }]);
    expect(() => assertStudyProposalOptionBindings(proposal)).not.toThrow();
  });
  it("quarantines the whole mixed arbitration, preserving atoms, other choices and explicit decisions through Review", () => {
    const { session, request, update, proposal } = setup();
    const baseline = acceptWorkingDraftUpdate(update, request);
    const optional = addBroken(proposal);
    const atomsBefore = JSON.stringify(baseline.update.proposal!.atoms), othersBefore = JSON.stringify(baseline.update.proposal!.arbitrations);
    const explicitBefore = JSON.stringify(baseline.update.explicitDecisions), rawBefore = JSON.stringify(update);
    const accepted = acceptWorkingDraftUpdate(update, request);
    expect(accepted.composition!.proposal.arbitrations.some(a => a.ref === optional.ref)).toBe(false);
    expect(accepted.composition!.proposal.arbitrations.flatMap(a => a.options).some(o => o.ref === optional.options[1].ref)).toBe(false);
    expect(JSON.stringify(accepted.update.proposal!.atoms)).toBe(atomsBefore);
    expect(JSON.stringify(accepted.update.proposal!.arbitrations)).toBe(othersBefore);
    expect(JSON.stringify(accepted.update.explicitDecisions)).toBe(explicitBefore);
    expect(JSON.stringify(update)).toBe(rawBefore);
    expect(accepted.composition!.quarantinedArbitrations).toEqual([{ arbitrationId: optional.ref, invalidOptionCount: 1,
      missingRefCount: 1, reason: "STRUCTURALLY_INVALID_OPTION_BINDING" }]);
    const ready = prepareContinuousWorkingDraft(session, accepted.composition!, accepted.update, prepareWorkingDraftRequest(request).inputDigest);
    expect(ready.readyReview).not.toBeNull();
    expect(session.project).toBeNull();
    expect(JSON.stringify(accepted.composition!.quarantinedArbitrations)).not.toContain(optional.label);
  });
  it("rejects a dangling recommended option with the unchanged binding invariant", () => {
    const { request, update, proposal } = setup(), optional = addBroken(proposal);
    optional.recommendedRefs = [optional.options[0].ref];
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  });
  it("rejects an arbitration whose option was human-bound in the previous composition", () => {
    const { request, update, proposal } = setup(), optional = addBroken(proposal);
    const prior = setup(), previous = acceptWorkingDraftUpdate(prior.update, prior.request).composition!;
    const humanBound: StudyProposalComposition = { ...previous, adoptedAtomRefs: ["bounds"],
      proposal: { ...previous.proposal, arbitrations: [...previous.proposal.arbitrations, optional] } };
    expect(() => acceptWorkingDraftUpdate(update, { ...request, studyProposalContext: humanBound }))
      .toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  });
  it.each([false, true])("protects explicit decisions and their dependency closure (dependent=%s)", dependent => {
    const { request, update, proposal } = setup(), optional = addBroken(proposal);
    if (dependent) proposal.atoms.find(a => a.ref === "design")!.dependsOn = ["bounds"];
    else optional.options[1].atomRefs = ["design"];
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  });
  it("leaves valid arbitrations byte-identical", () => {
    const { proposal } = setup(), before = JSON.stringify(proposal);
    expect(normalize(proposal)).toEqual([]);
    expect(JSON.stringify(proposal)).toBe(before);
  });
  it("quarantines multiple independent broken arbitrations without reducing either choice set", () => {
    const { proposal } = setup();
    for (const ref of ["open-one", "open-two"]) proposal.atoms.push({ ...proposal.atoms.find(a => a.ref === "bounds")!, ref, semanticKey: ref });
    addBroken(proposal, "optional-one", "open-one"); addBroken(proposal, "optional-two", "open-two");
    const records = normalize(proposal), refs = proposal.arbitrations.map(a => a.ref);
    expect(records.map(r => r.arbitrationId)).toEqual(["optional-one", "optional-two"]);
    expect(refs).not.toContain("optional-one"); expect(refs).not.toContain("optional-two");
    expect(() => assertStudyProposalOptionBindings(proposal)).not.toThrow();
  });
  it("does not repair other dangling bindings", () => {
    const { request, update, proposal } = setup(); addBroken(proposal);
    proposal.arbitrations[0].options[0].atomRefs = ["other-invalid"];
    proposal.arbitrations[0].recommendedRefs = [proposal.arbitrations[0].options[0].ref];
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  });
  it("still applies full native atom-dependency validation to the remaining proposal", () => {
    const { request, update, proposal } = setup(); addBroken(proposal);
    proposal.atoms.find(a => a.ref === "practical")!.dependsOn = ["unrelated-missing-dependency"];
    expect(() => acceptWorkingDraftUpdate(update, request)).toThrow("STUDY_PROPOSAL_DEPENDENCY_INVALID");
  });
  it("does not quarantine a branch shared with another arbitration", () => {
    const { proposal } = setup(), optional = addBroken(proposal);
    proposal.arbitrations[0].options[0].atomRefs.push("bounds");
    expect(normalize(proposal)).toEqual([]);
    expect(() => assertStudyProposalOptionBindings(proposal)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
    expect(proposal.arbitrations).toContain(optional);
  });
  it("does not silently promote an unselected non-open alternative", () => {
    const { proposal } = setup(); addBroken(proposal, "optional", "practical");
    expect(normalize(proposal)).toEqual([]);
    expect(() => assertStudyProposalOptionBindings(proposal)).toThrow("STUDY_PROPOSAL_OPTION_BINDING_INVALID");
  });
  it("protects explicit Project-change provenance even without an explicit-decision envelope", () => {
    const { proposal } = setup(); addBroken(proposal);
    proposal.atoms.find(a => a.ref === "bounds")!.userChangeRefs = ["explicit-change"];
    expect(normalize(proposal)).toEqual([]);
  });
  it("does not use quarantine to remove the last required arbitration or duplicate identities", () => {
    const { proposal } = setup(), optional = addBroken(proposal);
    proposal.arbitrations = [optional];
    expect(normalize(proposal)).toEqual([]);
    const other = structuredClone(optional); other.ref = "second";
    proposal.arbitrations.push(other);
    expect(normalize(proposal)).toEqual([]);
  });
  it("keeps the historical recommended opt_linear / analysis_reg failure rejected", () => {
    const { proposal } = setup(), atom = proposal.atoms[0], arbitration = proposal.arbitrations[0];
    proposal.atoms = realStudyUpdateClosure.atomRefs.map(ref => ({ ...atom, ref }));
    proposal.arbitrations = realStudyUpdateClosure.arbitrations.map(a => ({ ...arbitration, ...a,
      options: a.options.map(o => ({ ...arbitration.options[0], ...o })) }));
    normalize(proposal);
    try { assertStudyProposalOptionBindings(proposal); throw new Error("EXPECTED_BINDING_REJECTION"); }
    catch (error) { expect(error).toMatchObject({ arbitrationId: "arb_primary_analysis", optionId: "opt_linear",
      missingAtomRef: "analysis_reg", recommended: true, message: "STUDY_PROPOSAL_OPTION_BINDING_INVALID" }); }
  });
  it("reproduces the exact real arb2 binding metadata without retaining scientific free text", () => {
    const { proposal } = setup(), atom = proposal.atoms[0], arbitration = proposal.arbitrations[0];
    // Only the historical IDs/status/bindings are real; all prose is synthetic.
    const explicit = ["q1", "o1", "p1", "pr1", "pr2", "g1", "x1", "e1", "e2", "e3", "e4", "m1", "ep1", "cv16"];
    proposal.atoms = [...explicit, "an1", "an2", "an3"].map(ref => ({ ...atom, ref, semanticKey: ref,
      status: ref.startsWith("an") ? "OPEN_DECISION" : "NOXIA_PROPOSAL", dependsOn: ref === "an3" ? ["an1", "cv16"] : [] }));
    proposal.arbitrations = [{ ...arbitration, ref: "arb1", recommendedRefs: [], options: [
      { ...arbitration.options[0], ref: "opt1", atomRefs: ["an1"] }, { ...arbitration.options[0], ref: "opt2", atomRefs: ["an2"] }] },
    { ...arbitration, ref: "arb2", recommendedRefs: [], options: [
      { ...arbitration.options[0], ref: "opt3", atomRefs: ["sp1"] }, { ...arbitration.options[0], ref: "opt4", atomRefs: ["an3"] }] }];
    proposal.dimensioningScenarios = [];
    expect(normalize(proposal, null, explicit)).toEqual([{ arbitrationId: "arb2", invalidOptionCount: 1,
      missingRefCount: 1, reason: "STRUCTURALLY_INVALID_OPTION_BINDING" }]);
    expect(proposal.arbitrations.map(a => a.ref)).toEqual(["arb1"]);
    expect(proposal.atoms.map(a => a.ref)).toEqual([...explicit, "an1", "an2", "an3"]);
    expect(() => assertStudyProposalOptionBindings(proposal)).not.toThrow();
  });
});
