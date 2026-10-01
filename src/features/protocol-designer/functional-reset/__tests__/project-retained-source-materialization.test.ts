import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { assertResearchProjectSourceMaterialization, confirmResearchProjectContribution, prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { calculateStudyProposalScenarios, contextualStudyProposalSchema, type StudyProposalComposition } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildStudyProposalSelectionContribution, propagateStudyProposalDecision, studyProposalAtomItemRef, studyProposalBinding } from "../study-proposal-standard";
import { createFunctionalResetSession, loadFunctionalResetSession, persistFunctionalResetSession } from "../session";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

// Exact IDs/type/area/owner metadata of the 31 unchanged bindings in the durable
// failed run. Content is LOCAL_SYNTHETIC: no private response is stored/rebuilt.
const bindings = [
  ["q_age_ecv", "QUESTION", "SCIENTIFIC_THINKING", "SCIENTIFIC_QUESTION"],
  ["obj_age", "OBJECTIVES", "SCIENTIFIC_THINKING", "OBJECTIVE"],
  ["design_cross", "DESIGN", "STUDY_DESIGN", "STUDY_DESIGN"],
  ["pop_healthy", "POPULATION", "STUDY_DESIGN", "POPULATION"],
  ["adult_rule", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION"],
  ["france", "PRACTICAL", "STUDY_DESIGN", "CONSTRAINT"],
  ["unpaid", "RECRUITMENT", "STUDY_DESIGN", "CONSTRAINT"],
  ["mri", "MEASUREMENTS", "IMAGING", "IMAGING_MODALITY"],
  ["visit_mri", "TIMING", "STUDY_DESIGN", "VISIT"],
  ["exclude_fib", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION"],
  ["exclude_dm", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION"],
  ["exclude_htn", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION"],
  ["exclude_smoke", "ELIGIBILITY", "STUDY_DESIGN", "ELIGIBILITY_CRITERION"],
  ["sport_goal", "OBJECTIVES", "SCIENTIFIC_THINKING", "OBJECTIVE"],
  ["var_age", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["var_decade", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["var_fib", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["var_smoking", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["var_sport", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["var_t1_my_pre", "MEASUREMENTS", "IMAGING", "CANONICAL_VARIABLE"],
  ["var_t1_my_post", "MEASUREMENTS", "IMAGING", "CANONICAL_VARIABLE"],
  ["var_t1_blood_pre", "MEASUREMENTS", "IMAGING", "CANONICAL_VARIABLE"],
  ["var_t1_blood_post", "MEASUREMENTS", "IMAGING", "CANONICAL_VARIABLE"],
  ["var_ecv", "MEASUREMENTS", "IMAGING", "CANONICAL_VARIABLE"],
  ["primary_endpoint", "ENDPOINTS", "IMAGING", "ENDPOINT"],
  ["ecv_interpretation", "QUESTION", "SCIENTIFIC_THINKING", "SCIENTIFIC_MODEL"],
  ["contrast_requirement", "MEASUREMENTS", "IMAGING", "ACQUISITION"],
  ["var_safety", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["var_injection", "MEASUREMENTS", "OBS", "CANONICAL_VARIABLE"],
  ["analysis_reg", "ANALYSIS", "BIOSTATISTICS", "ANALYSIS_SPECIFICATION"],
  ["bias_age", "BIASES", "STUDY_DESIGN", "UNCERTAINTY"],
] as const;

const prepare = (previous: ResearchProjectOwnerProjection | null = null, extra = 0, age = false) => {
  const session = createFunctionalResetSession();
  if (previous) session.projectId = previous.projectId;
  const proposal = controlledStudyProposal("LOCAL_SYNTHETIC", DOMAINS[1]), template = proposal.atoms[0];
  proposal.atoms = bindings.map(([ref, area, owner, targetType]) => ({ ...template, ref, semanticKey: ref,
    area, owner, targetType, content: `LOCAL_SYNTHETIC ${ref}` }));
  if (age) proposal.atoms.push({ ...template, ref: "age_bounds", semanticKey: "age_bounds", area: "ELIGIBILITY",
    owner: "STUDY_DESIGN", targetType: "ELIGIBILITY_CRITERION", content: "Âge : 18–79 ans" });
  for (let index = 0; index < extra; index++) proposal.atoms.push({ ...template, ref: `addition_${index}`,
    semanticKey: `addition_${index}`, area: "PRACTICAL", owner: "STUDY_DESIGN", targetType: "CONSTRAINT",
    content: `LOCAL_SYNTHETIC addition_${index}` });
  proposal.arbitrations = [{ ...proposal.arbitrations[0], ref: "synthetic_arbitration",
    options: [{ ...proposal.arbitrations[0].options[0], ref: "synthetic_option", atomRefs: ["analysis_reg"] }],
    recommendedRefs: ["synthetic_option"] }];
  contextualStudyProposalSchema.parse(proposal);
  const sourceProject = previous ? studyProposalBinding(previous) : null;
  const digest = logicalDigest({ proposal, sourceProject, sourceTurnRef: "human-source", sourceResponseRef: "synthetic-response" });
  const composition: StudyProposalComposition = { proposalRef: `scientific-study-proposal:${digest}`, digest,
    sourceProject, originalSourceProject: sourceProject, sourceTurnRef: "human-source", sourceResponseRef: "synthetic-response",
    revision: 1, proposal, state: "CURRENT", adoptedAtomRefs: [], unavailableOptionRefs: [],
    dimensioning: calculateStudyProposalScenarios(proposal), ownerReceipts: [] };
  const turn = { turnId: "human-confirmation", role: "USER" as const, content: "LOCAL_SYNTHETIC", createdAt: session.createdAt };
  const refs = proposal.atoms.map(atom => atom.ref), options = ["synthetic_option"];
  const contribution = buildStudyProposalSelectionContribution({ composition, selectedAtomRefs: refs.filter(ref => ref !== "analysis_reg"),
    selectedOptionRefs: options, project: previous, projectId: session.projectId, conversationId: session.conversationId,
    proposalTurn: { turnId: "synthetic-response", role: "NOXIA", content: "LOCAL_SYNTHETIC" }, selectionTurn: turn, createdAt: session.createdAt });
  const candidate = prepareResearchProjectContributionCandidate(contribution, previous);
  const project = confirmResearchProjectContribution({ contribution, current: previous, projectId: session.projectId,
    authority: session.projectAuthority, confirmedAt: session.createdAt, reviewedProjection: candidate.humanReviewProjection,
    selectedChangeRefs: candidate.humanReviewProjection.coveredChangeRefs });
  const propagate = () => propagateStudyProposalDecision(composition, project, candidate, previous, refs, options, turn, contribution);
  return { session, composition, contribution, candidate, project, propagate };
};

describe("retained full-snapshot source materialization — existing-run binding family", () => {
  it("materializes all 31 unchanged sources without inventing current source aliases or mutating v1", () => {
    const first = prepare(), before = JSON.stringify(first.project), second = prepare(first.project, 1);
    const propagated = second.propagate();
    expect(bindings).toHaveLength(31);
    for (const [ref] of bindings) {
      const source = studyProposalAtomItemRef(second.composition, ref);
      expect(second.candidate.canonicalChangeSet.objectChanges.some(change => change.candidate?.sourceItemRefs.includes(source))).toBe(false);
      const objects = assertResearchProjectSourceMaterialization({ candidate: second.candidate, project: second.project,
        previousProject: first.project, contribution: second.contribution, sourceItemRefs: [source] });
      expect(objects).toHaveLength(1);
      expect(objects[0]).toEqual(first.project.canonicalState!.objects.find(object => object.objectId === objects[0].objectId));
      expect(objects[0].sourceContributionRef).toBe(first.contribution.identity.contributionId);
      expect(objects[0].sourceItemRefs).not.toContain(source);
      expect(propagated.adoptionSourceRefs?.[ref]).toEqual(objects[0].sourceItemRefs);
    }
    expect(JSON.stringify(first.project)).toBe(before);
    expect(second.project.previousVersionId).toBe(first.project.versionId);
    expect(second.project.revision).toBe(2);
    expect(propagated.sourceProject).toEqual(studyProposalBinding(second.project));
    expect(propagated.qrySelection?.context).toMatchObject({ projectRef: second.project.projectId,
      projectVersion: second.project.versionId });
    // Native durable browser persistence is exercised offline, not a DB write.
    persistFunctionalResetSession(localStorage, { ...second.session, project: second.project, studyProposal: propagated });
    const reloaded = loadFunctionalResetSession(localStorage, undefined, true);
    expect(reloaded.project).toEqual(second.project);
    expect(reloaded.studyProposal?.sourceProject?.versionId).toBe(second.project.versionId);
    localStorage.clear();
  });

  it("retains both native 1→N age members and their original version/decision provenance across v2 and v3", () => {
    const first = prepare(null, 0, true), second = prepare(first.project, 1, true), third = prepare(second.project, 2, true);
    second.propagate(); third.propagate();
    for (const next of [second, third]) {
      const objects = assertResearchProjectSourceMaterialization({ candidate: next.candidate, project: next.project,
        previousProject: next === second ? first.project : second.project, contribution: next.contribution,
        sourceItemRefs: [studyProposalAtomItemRef(next.composition, "age_bounds")] });
      const original = first.project.canonicalState!.objects.filter(object => object.sourceItemRefs
        .includes(studyProposalAtomItemRef(first.composition, "age_bounds")));
      expect(original).toHaveLength(2);
      expect(objects.map(object => object.objectId)).toEqual(expect.arrayContaining([
        `${first.project.projectId}:study-strategy:age_bounds:min`, `${first.project.projectId}:study-strategy:age_bounds:max`,
      ]));
      expect(original.every(old => objects.some(object => logicalDigest(old) === logicalDigest(object)))).toBe(true);
      // Any additional native materialization must be an actual covered delta,
      // never an alias invented by the retained-source validator.
      for (const object of objects.filter(object => !original.some(old => old.objectId === object.objectId))) {
        const change = next.candidate.canonicalChangeSet.objectChanges.find(change => change.objectId === object.objectId)!;
        expect(change).toBeDefined();
        expect(next.candidate.humanReviewProjection.coveredChangeRefs).toContain(change.changeRef);
      }
    }
  });

  it("still rejects the exact empty-source binding and foreign/stale sources or contributions", () => {
    const first = prepare(), second = prepare(first.project, 1);
    const input = { candidate: second.candidate, project: second.project, previousProject: first.project,
      contribution: second.contribution, sourceItemRefs: [studyProposalAtomItemRef(second.composition, "q_age_ecv")] };
    expect(() => assertResearchProjectSourceMaterialization({ ...input, sourceItemRefs: [] })).toThrow("STUDY_PROPOSAL_MATERIALIZATION_BINDING_INVALID");
    expect(() => assertResearchProjectSourceMaterialization({ ...input, sourceItemRefs: ["foreign-source"] })).toThrow("STUDY_PROPOSAL_MATERIALIZATION_UNPROVEN");
    expect(() => assertResearchProjectSourceMaterialization({ ...input, contribution: first.contribution })).toThrow();
    expect(() => assertResearchProjectSourceMaterialization({ ...input, previousProject: null })).toThrow();
    expect(() => propagateStudyProposalDecision({ ...second.composition, sourceProject: { ...studyProposalBinding(first.project)!, versionId: "stale-version" } },
      second.project, second.candidate, first.project, ["q_age_ecv"], [], undefined, second.contribution))
      .toThrow("STUDY_PROPOSAL_PREVIOUS_PROJECT_BINDING_INVALID");
  });

  it("rejects missing/changed retained members, lost provenance and ambiguous source identities", () => {
    const first = prepare(), second = prepare(first.project, 1);
    const input = { candidate: second.candidate, project: second.project, previousProject: first.project,
      contribution: second.contribution, sourceItemRefs: [studyProposalAtomItemRef(second.composition, "q_age_ecv")] };
    const id = `${first.project.projectId}:study-strategy:q_age_ecv`;
    for (const field of ["content", "sourceItemRefs", "decisionRefs", "objectVersionId"] as const) {
      const project = structuredClone(second.project), object = project.canonicalState!.objects.find(object => object.objectId === id)!;
      if (field === "sourceItemRefs" || field === "decisionRefs") object[field] = ["foreign"];
      else object[field] = "foreign";
      expect(() => assertResearchProjectSourceMaterialization({ ...input, project })).toThrow("STUDY_PROPOSAL_MATERIALIZATION_INCOMPLETE");
    }
    const project = structuredClone(second.project);
    project.canonicalState!.objects = project.canonicalState!.objects.filter(object => object.objectId !== id);
    expect(() => assertResearchProjectSourceMaterialization({ ...input, project })).toThrow("STUDY_PROPOSAL_MATERIALIZATION_INCOMPLETE");
    // An unprojected native source must resolve to exactly one prior identity.
    const rawRef = studyProposalAtomItemRef(second.composition, "bias_age"), previousProject = structuredClone(first.project);
    const old = previousProject.canonicalState!.objects.find(object => object.objectId.endsWith(":bias_age"))!;
    previousProject.canonicalState!.objects.push({ ...old, objectId: "ambiguous", sourceItemRefs: [...old.sourceItemRefs, rawRef] });
    expect(() => assertResearchProjectSourceMaterialization({ ...input, previousProject, sourceItemRefs: [rawRef] })).toThrow();
  });
});
