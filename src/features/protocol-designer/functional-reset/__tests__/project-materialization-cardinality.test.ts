import { describe, expect, it } from "vitest";
import { calculateStudyProposalScenarios, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { assertResearchProjectSourceMaterialization, confirmResearchProjectContribution, prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { createFunctionalResetSession } from "../session";
import { buildStudyProposalSelectionContribution, propagateStudyProposalDecision, studyProposalAtomItemRef } from "../study-proposal-standard";
import { controlledStudyProposal } from "./study-proposal-fixtures";

const prepare = () => {
  const session = createFunctionalResetSession();
  const proposal = controlledStudyProposal("cardinality");
  const age = { ...proposal.atoms.find(atom => atom.ref === "eligibility")!, ref: "eligibility_age", semanticKey: "eligibility.age_18_79",
    content: "Âge : 18–79 ans", dependsOn: [] };
  proposal.atoms.push(age);
  const digest = logicalDigest({ proposal, sourceProject: null, sourceTurnRef: "human-source", sourceResponseRef: "noxia-proposal" });
  const composition: StudyProposalComposition = {
    proposalRef: `scientific-study-proposal:${digest}`, digest, sourceTurnRef: "human-source", sourceResponseRef: "noxia-proposal",
    sourceProject: null, originalSourceProject: null, revision: 1, proposal,
    adoptedAtomRefs: [], unavailableOptionRefs: [], state: "CURRENT", dimensioning: calculateStudyProposalScenarios(proposal),
    ownerReceipts: [...new Set(proposal.atoms.map(atom => atom.owner))].map(owner => ({ owner,
      atomRefs: proposal.atoms.filter(atom => atom.owner === owner).map(atom => atom.ref),
      status: "CANDIDATES_NOT_ADOPTED" as const, projectWrites: 0 as const })),
  };
  const selectionTurn = { turnId: "human-review-decision", role: "USER" as const,
    content: "Je confirme cette borne d’âge.", createdAt: session.createdAt };
  const contribution = buildStudyProposalSelectionContribution({ composition, selectedOptionRefs: [],
    selectedAtomRefs: ["eligibility_age", "design"], project: null, projectId: session.projectId,
    conversationId: session.conversationId,
    proposalTurn: { turnId: "noxia-proposal", role: "NOXIA", content: proposal.reply },
    selectionTurn, createdAt: session.createdAt });
  const candidate = prepareResearchProjectContributionCandidate(contribution, null);
  const project = confirmResearchProjectContribution({ contribution, current: null, projectId: session.projectId,
    authority: session.projectAuthority, confirmedAt: session.createdAt,
    reviewedProjection: candidate.humanReviewProjection,
    selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs });
  const ageRef = studyProposalAtomItemRef(composition, "eligibility_age");
  const materialized = assertResearchProjectSourceMaterialization({ candidate, project, sourceItemRefs: [ageRef] });
  return { session, composition, candidate, project, ageRef, materialized, selectionTurn };
};

describe("Project-owned source materialization cardinality", () => {
  it("accepts every owner-declared object for 1→N and an unchanged 1→1 decision", () => {
    const { composition, candidate, project, ageRef, materialized, selectionTurn } = prepare();
    expect(materialized).toHaveLength(2);
    expect(materialized.map(object => object.objectId).sort()).toEqual([
      `${project.projectId}:study-strategy:eligibility.age_18_79:max`,
      `${project.projectId}:study-strategy:eligibility.age_18_79:min`,
    ]);
    expect(materialized.every(object => object.sourceItemRefs.includes(ageRef))).toBe(true);
    expect(project.canonicalState!.objects.some(object => object.objectId === `${project.projectId}:study-strategy:eligibility.age_18_79`)).toBe(false);
    const adopted = propagateStudyProposalDecision(composition, project, candidate, null,
      ["eligibility_age", "design"], [], selectionTurn);
    expect(adopted.adoptedAtomRefs).toEqual(["eligibility_age", "design"]);
    expect(adopted.adoptionSourceRefs?.eligibility_age).toContain(ageRef);
    expect(assertResearchProjectSourceMaterialization({ candidate, project,
      sourceItemRefs: [studyProposalAtomItemRef(composition, "design")] })).toHaveLength(1);
  });

  it("fails closed for a missing member, lost provenance, wrong type, missing review coverage or ambiguous mapping", () => {
    const { candidate, project, ageRef, materialized } = prepare();
    const verify = (nextCandidate = candidate, nextProject = project) => assertResearchProjectSourceMaterialization({
      candidate: nextCandidate, project: nextProject, sourceItemRefs: [ageRef],
    });
    const withoutMax = { ...project, canonicalState: { ...project.canonicalState!,
      objects: project.canonicalState!.objects.filter(object => object.objectId !== materialized[1]!.objectId) } };
    expect(() => verify(candidate, withoutMax)).toThrow("STUDY_PROPOSAL_MATERIALIZATION_INCOMPLETE");
    const wrongSource = { ...project, canonicalState: { ...project.canonicalState!,
      objects: project.canonicalState!.objects.map(object => object.objectId === materialized[0]!.objectId
        ? { ...object, sourceItemRefs: ["other-source"] } : object) } };
    expect(() => verify(candidate, wrongSource)).toThrow("STUDY_PROPOSAL_MATERIALIZATION_INCOMPLETE");
    const wrongType = { ...project, canonicalState: { ...project.canonicalState!,
      objects: project.canonicalState!.objects.map(object => object.objectId === materialized[0]!.objectId
        ? { ...object, objectType: "CONSTRAINT" as const } : object) } };
    expect(() => verify(candidate, wrongType)).toThrow("STUDY_PROPOSAL_MATERIALIZATION_INCOMPLETE");
    const uncovered = { ...candidate, humanReviewProjection: { ...candidate.humanReviewProjection,
      coveredChangeRefs: candidate.humanReviewProjection.coveredChangeRefs.filter(ref => ref !== candidate.canonicalChangeSet.objectChanges.find(change => change.objectId === materialized[0]!.objectId)?.changeRef) } };
    expect(() => verify(uncovered)).toThrow("STUDY_PROPOSAL_MATERIALIZATION_INCOMPLETE");
    const ambiguous = { ...candidate, canonicalChangeSet: { ...candidate.canonicalChangeSet,
      objectChanges: [...candidate.canonicalChangeSet.objectChanges, candidate.canonicalChangeSet.objectChanges.find(change => change.objectId === materialized[0]!.objectId)!] } };
    expect(() => verify(ambiguous)).toThrow("STUDY_PROPOSAL_MATERIALIZATION_UNPROVEN");
  });

  it("does not treat an unselected source as adopted", () => {
    const { composition, candidate, project, selectionTurn } = prepare();
    expect(() => propagateStudyProposalDecision(composition, project, candidate, null,
      ["eligibility_age", "design", "population"], [], selectionTurn)).toThrow("STUDY_PROPOSAL_MATERIALIZATION_BINDING_INVALID");
  });

  it("preserves every previously adopted member across a later Project revision", () => {
    const { session, composition, candidate, project, ageRef, selectionTurn } = prepare();
    const adopted = propagateStudyProposalDecision(composition, project, candidate, null,
      ["eligibility_age", "design"], [], selectionTurn);
    const secondTurn = { ...selectionTurn, turnId: "second-human-review-decision", content: "Je confirme la population." };
    const contribution = buildStudyProposalSelectionContribution({ composition: adopted, selectedOptionRefs: [],
      selectedAtomRefs: ["population"], project, projectId: session.projectId,
      conversationId: session.conversationId,
      proposalTurn: { turnId: "noxia-proposal", role: "NOXIA", content: composition.proposal.reply },
      selectionTurn: secondTurn, createdAt: session.createdAt });
    const secondCandidate = prepareResearchProjectContributionCandidate(contribution, project);
    const nextProject = confirmResearchProjectContribution({ contribution, current: project,
      projectId: session.projectId, authority: session.projectAuthority, confirmedAt: session.createdAt,
      reviewedProjection: secondCandidate.humanReviewProjection,
      selectedChangeRefs: secondCandidate.humanReviewProjection.coveredChangeRefs });
    const next = propagateStudyProposalDecision(adopted, nextProject, secondCandidate, project,
      ["population"], [], secondTurn);
    expect(next.adoptedAtomRefs).toEqual(["eligibility_age", "design", "population"]);
    expect(nextProject.versionId).toBe(`${session.projectId}:version:2`);
    expect(nextProject.canonicalState!.objects.filter(object => object.actuality === "CURRENT"
      && object.sourceItemRefs.includes(ageRef))).toHaveLength(2);
  });
});
