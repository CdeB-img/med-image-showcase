import { propagateProjectImpact } from "../../research-project-construction/change.js";
import type { ProjectChangeEvent } from "../../research-project-construction/types.js";
import type { StudyProposalAtom } from "../../scientific-thinking/contextual-study-proposal.js";
import { logicalDigest } from "../../knowledge-engine/canonical.js";
import { canonicalizeScientificContribution } from "../../scientific-interpretation/canonical.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "../../scientific-interpretation/contracts.js";
import { ensureCanonicalProjectState } from "../../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectOwnerProjection } from "../../research-project-construction/contribution-owner-boundary.js";
import { calculateStudyProposalScenarios, contextualStudyProposalSchema, hardStudyProposalDependencies, studyProposalOptionDecisionRefs, type ProposalProjectBinding, type StudyProposalComposition } from "../../scientific-thinking/contextual-study-proposal.js";
import { buildCurrentTurnNavigation, selectStudyProposalArbitrations } from "../../query-navigation/current-turn-navigation.js";

export const studyProposalBinding = (project: ResearchProjectOwnerProjection | null): ProposalProjectBinding => project
  ? { projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest } : null;
export const studyProposalAtomItemRef = (composition: StudyProposalComposition, atomRef: string) => `${composition.proposalRef}:atom:${atomRef}`;
export const studyProposalRevisionDigest = (composition: StudyProposalComposition) => logicalDigest({
  proposal: composition.proposal, sourceProject: composition.sourceProject, adoptedAtomRefs: composition.adoptedAtomRefs,
  unavailableOptionRefs: composition.unavailableOptionRefs, revision: composition.revision, dispositions: composition.dispositions ?? [],
  ...(composition.adoptionSourceRefs ? { adoptionSourceRefs: composition.adoptionSourceRefs } : {}),
  ...(composition.recomputation ? { recomputation: composition.recomputation } : {}),
});
export const activeStudyProposalDimensioning = (composition: StudyProposalComposition): StudyProposalComposition["dimensioning"] => {
  if (composition.state !== "CURRENT") return [];
  const excluded = new Set(composition.proposal.arbitrations.flatMap(a => a.options.filter(o => composition.unavailableOptionRefs.includes(o.ref)).flatMap(o => o.atomRefs)));
  composition.dispositions?.filter(d => d.status === "REJECTED").flatMap(d => d.atomRefs).filter(r => !composition.adoptedAtomRefs.includes(r)).forEach(r => excluded.add(r));
  let changed = true;
  while (changed) { changed = false; for (const a of composition.proposal.atoms) if (!excluded.has(a.ref) && hardStudyProposalDependencies(a).some(r => excluded.has(r))) { excluded.add(a.ref); changed = true; } }
  const candidates = composition.proposal.dimensioningScenarios.filter(s => ![...s.branchAtomRefs, s.analysisAtomRef ?? ""].some(r => excluded.has(r)));
  const preferred = new Set([...composition.adoptedAtomRefs, ...composition.proposal.arbitrations.filter(a => !a.options.some(o => o.atomRefs.some(r => composition.adoptedAtomRefs.includes(r))))
    .flatMap(a => a.options.filter(o => a.recommendedRefs.includes(o.ref)).flatMap(o => o.atomRefs))]);
  const main = candidates.find(s => s.branchAtomRefs.every(r => preferred.has(r)));
  return calculateStudyProposalScenarios({ ...composition.proposal, dimensioningScenarios: candidates }).map(s => ({ ...s, role: s.ref === main?.ref ? "PRIMARY" : "ALTERNATIVE" }));
};
const inventoryType = (a: StudyProposalAtom) => a.owner === "IMAGING" ? "IMAGING"
  : a.area === "ANALYSIS" || a.area === "CONFOUNDERS" ? "ANALYSIS_REQUIREMENT"
  : a.area === "DIMENSIONING" ? "SIZING" : a.area === "POPULATION" || a.area === "ELIGIBILITY" ? "POPULATION"
  : a.area === "RECRUITMENT" || a.area === "PRACTICAL" ? "FEASIBILITY" : a.area === "DESIGN" ? "STUDY_DESIGN"
  : a.area === "TIMING" ? "VISIT" : a.area === "ENDPOINTS" ? "ENDPOINT"
  : a.area === "DESCRIPTION" ? a.targetType === "CANONICAL_VARIABLE" ? "VARIABLE" : "DATA" : a.area === "MEASUREMENTS" ? "VARIABLE" : a.targetType;
const eventFor = (type: string | null): ProjectChangeEvent => type === "POPULATION" || type === "ELIGIBILITY_CRITERION" ? "PopulationChanged"
  : type === "STUDY_DESIGN" || type === "ANALYSIS_SPECIFICATION" || type === "PROJECT_INFORMATION" ? "StudyDesignChanged"
  : type === "GROUP" ? "GroupChanged" : type === "ENDPOINT" ? "EndpointChanged" : type === "CANONICAL_VARIABLE" ? "VariableChanged"
  : type === "VISIT" ? "VisitChanged" : type === "ACQUISITION" || type === "IMAGING_MODALITY" ? "ImagingStrategyChanged" : "ConstraintChanged";
/** Native Project impacts + declared dependencies; no scientific inference. */
export const planStudyProposalRecomputation = (composition: StudyProposalComposition, contribution: ScientificInterpretationContributionEnvelope) => {
  const items = contribution.scientificContent.candidateObjects;
  const impacts = items.flatMap(item => propagateProjectImpact({ eventType: eventFor(item.proposedType), description: item.content,
    sourceIds: [item.itemId], targetIds: composition.proposal.atoms.filter(a => (item.previousItemIds ?? []).some(r =>
      r === studyProposalAtomItemRef(composition, a.ref) || r.endsWith(`:study-strategy:${a.semanticKey}`))).map(a => a.ref) },
    composition.proposal.atoms.map(a => ({ targetId: a.ref, targetType: inventoryType(a) }))).impacts);
  const affected = new Set(impacts.filter(i => i.state !== "UNAFFECTED_DEMONSTRATED").map(i => i.targetId));
  let added = true; while (added) { added = false; for (const a of composition.proposal.atoms) if (!affected.has(a.ref) && a.dependsOn.some(r => affected.has(r))) { affected.add(a.ref); added = true; } }
  return { affectedAtomRefs: [...affected], affectedOwners: [...new Set(composition.proposal.atoms.filter(a => affected.has(a.ref)).map(a => a.owner))],
    changes: items.map(i => ({ itemId: i.itemId, targetType: i.proposedType, content: i.content, previousItemIds: i.previousItemIds })), impacts };
};
export const assertScopedStudyProposalRecomputation = (previous: StudyProposalComposition, proposal: StudyProposalComposition["proposal"],
  contribution: ScientificInterpretationContributionEnvelope) => {
  const plan = planStudyProposalRecomputation(previous, contribution);
  for (const atom of previous.proposal.atoms.filter(a => !plan.affectedAtomRefs.includes(a.ref))) {
    if (logicalDigest(atom) !== logicalDigest(proposal.atoms.find(a => a.ref === atom.ref))) throw new Error("STUDY_PROPOSAL_UNRELATED_BRANCH_CHANGED");
  }
  for (const a of proposal.atoms) {
    if (logicalDigest(a) !== logicalDigest(previous.proposal.atoms.find(old => old.ref === a.ref)) && (a.userChangeRefs ?? []).some(r => !plan.changes.some(c => c.itemId === r && c.targetType === a.targetType && c.content === a.content))) throw new Error("STUDY_PROPOSAL_FREEFORM_BINDING_INVALID");
    if (!previous.proposal.atoms.some(old => old.ref === a.ref) && !(a.userChangeRefs?.length || a.dependsOn.some(r => plan.affectedAtomRefs.includes(r)))) throw new Error("STUDY_PROPOSAL_UNRELATED_BRANCH_ADDED");
  }
  for (const c of plan.changes) if (!proposal.atoms.some(a => a.userChangeRefs?.includes(c.itemId) && a.targetType === c.targetType && a.content === c.content)) throw new Error("STUDY_PROPOSAL_FREEFORM_CHANGE_OMITTED");
  for (const arbitration of previous.proposal.arbitrations) if (!arbitration.options.some(o => o.atomRefs.some(r => plan.affectedAtomRefs.includes(r)))
    && logicalDigest(arbitration) !== logicalDigest(proposal.arbitrations.find(a => a.ref === arbitration.ref))) throw new Error("STUDY_PROPOSAL_UNRELATED_ARBITRATION_CHANGED");
  for (const scenario of previous.proposal.dimensioningScenarios) if (![...scenario.branchAtomRefs, scenario.analysisAtomRef ?? ""].some(r => plan.affectedAtomRefs.includes(r))
    && logicalDigest(scenario) !== logicalDigest(proposal.dimensioningScenarios.find(s => s.ref === scenario.ref))) throw new Error("STUDY_PROPOSAL_UNRELATED_DIMENSIONING_CHANGED");
  return plan;
};
export const completeStudyProposalRecomputation = (previous: StudyProposalComposition, composition: StudyProposalComposition,
  contribution: ScientificInterpretationContributionEnvelope): StudyProposalComposition => {
  const plan = assertScopedStudyProposalRecomputation(previous, composition.proposal, contribution);
  const changedAtomRefs = composition.proposal.atoms.filter(a => a.userChangeRefs?.some(r => plan.changes.some(c => c.itemId === r))).map(a => a.ref);
  const adoptionSourceRefs: Record<string, readonly string[]> = {};
  for (const ref of previous.adoptedAtomRefs) {
    const old = previous.proposal.atoms.find(a => a.ref === ref), next = composition.proposal.atoms.find(a => a.ref === ref);
    if (old && next && old.content === next.content && old.targetType === next.targetType) adoptionSourceRefs[ref] = previous.adoptionSourceRefs?.[ref] ?? [studyProposalAtomItemRef(previous, ref)];
  }
  const next: StudyProposalComposition = { ...composition, revision: 2, adoptedAtomRefs: Object.keys(adoptionSourceRefs), adoptionSourceRefs,
    unavailableOptionRefs: previous.unavailableOptionRefs.filter(r => composition.proposal.arbitrations.some(a => a.options.some(o => o.ref === r))),
    dispositions: previous.dispositions, recomputation: { contributionRef: contribution.identity.contributionId, changedAtomRefs,
      affectedAtomRefs: [...new Set([...plan.affectedAtomRefs, ...changedAtomRefs])], evaluatedOwners: plan.affectedOwners, previousProposalRef: previous.proposalRef } };
  return { ...next, digest: studyProposalRevisionDigest(next), dimensioning: activeStudyProposalDimensioning(next) };
};
export const requireStudyProposalReview = (composition: StudyProposalComposition, project: ResearchProjectOwnerProjection | null): StudyProposalComposition => {
  const next = { ...composition, sourceProject: studyProposalBinding(project), revision: composition.revision + 1, state: "REVIEW_REQUIRED" as const, dimensioning: [] };
  return { ...next, digest: studyProposalRevisionDigest(next) };
};
export const assertStudyProposalCurrent = (composition: StudyProposalComposition, project: ResearchProjectOwnerProjection | null) => {
  contextualStudyProposalSchema.parse(composition.proposal);
  const originalDigest = logicalDigest({ proposal: composition.proposal, sourceProject: composition.originalSourceProject,
    sourceTurnRef: composition.sourceTurnRef, sourceResponseRef: composition.sourceResponseRef });
  const expectedDigest = composition.revision === 1 ? originalDigest : studyProposalRevisionDigest(composition);
  if (composition.proposalRef !== `scientific-study-proposal:${originalDigest}` || composition.digest !== expectedDigest) throw new Error("STUDY_PROPOSAL_CONTENT_DRIFT");
  if (composition.revision === 1 && (composition.adoptedAtomRefs.length || composition.unavailableOptionRefs.length || composition.dispositions?.length)) throw new Error("STUDY_PROPOSAL_CONTENT_DRIFT");
  if (composition.state !== "CURRENT" || logicalDigest(composition.sourceProject) !== logicalDigest(studyProposalBinding(project))) throw new Error("STUDY_PROPOSAL_STALE_PROJECT");
};
export const rehydrateStudyProposal = (value: unknown, project: ResearchProjectOwnerProjection | null): StudyProposalComposition | null => {
  if (value === null || value === undefined) return null;
  try {
    const composition = structuredClone(value) as StudyProposalComposition;
    if (!Number.isSafeInteger(composition.revision) || composition.revision < 1 || !Array.isArray(composition.adoptedAtomRefs)
      || !Array.isArray(composition.unavailableOptionRefs) || !Array.isArray(composition.ownerReceipts)) return null;
    try { assertStudyProposalCurrent(composition, project); }
    catch (error) {
      if (!(error instanceof Error) || error.message !== "STUDY_PROPOSAL_STALE_PROJECT") return null;
      return composition.state === "REVIEW_REQUIRED" && logicalDigest(composition.sourceProject) === logicalDigest(studyProposalBinding(project))
        ? { ...composition, dimensioning: [] } : { ...composition, state: "STALE", dimensioning: [] };
    }
    return { ...composition, dimensioning: activeStudyProposalDimensioning(composition) };
  } catch { return null; }
};
export const selectedStudyProposalAtoms = (composition: StudyProposalComposition, selectedOptionRefs: readonly string[], selectedAtomRefs: readonly string[] = []) => {
  if (!selectedOptionRefs.length && !selectedAtomRefs.length) throw new Error("STUDY_PROPOSAL_EMPTY_SELECTION");
  const options = composition.proposal.arbitrations.flatMap(a => a.options);
  if (new Set(selectedOptionRefs).size !== selectedOptionRefs.length || new Set(selectedAtomRefs).size !== selectedAtomRefs.length
    || selectedOptionRefs.some(r => !options.some(o => o.ref === r) || composition.unavailableOptionRefs.includes(r))
    || selectedAtomRefs.some(r => !composition.proposal.atoms.some(a => a.ref === r))) throw new Error("STUDY_PROPOSAL_SELECTION_INVALID");
  const optionAtomRefs = new Set(options.flatMap(o => o.atomRefs));
  if (selectedAtomRefs.some(r => optionAtomRefs.has(r))) throw new Error("STUDY_PROPOSAL_ALTERNATIVE_REQUIRES_OPTION_SELECTION");
  for (const arbitration of composition.proposal.arbitrations) {
    if (arbitration.selection === "ONE" && arbitration.options.filter(o => selectedOptionRefs.includes(o.ref)).length > 1) throw new Error("STUDY_PROPOSAL_EXCLUSIVE_SELECTION_INVALID");
  }
  const atomRefs = [...new Set([...selectedAtomRefs, ...options.filter(o => selectedOptionRefs.includes(o.ref)).flatMap(o => studyProposalOptionDecisionRefs(composition.proposal, o))])];
  if (atomRefs.some(r => composition.adoptedAtomRefs.includes(r))) throw new Error("STUDY_PROPOSAL_ALREADY_ADOPTED");
  if (atomRefs.some(r => composition.proposal.atoms.find(a => a.ref === r)?.status === "OPEN_DECISION")) throw new Error("STUDY_PROPOSAL_UNKNOWN_CANNOT_BE_ADOPTED");
  // Dependency requirements are visible. They are not silently added to scope.
  for (const atom of composition.proposal.atoms.filter(a => atomRefs.includes(a.ref))) {
    if (hardStudyProposalDependencies(atom).some(r => !atomRefs.includes(r) && !composition.adoptedAtomRefs.includes(r))) throw new Error("STUDY_PROPOSAL_DEPENDENCY_NOT_SELECTED");
  }
  if (composition.ownerReceipts.length && composition.proposal.atoms.some(atom => atomRefs.includes(atom.ref)
    && atom.dependencyQualifications && !composition.ownerReceipts.some(receipt => receipt.owner === atom.owner && receipt.atomRefs.includes(atom.ref)))) {
    throw new Error("STUDY_PROPOSAL_OWNER_QUALIFICATION_REQUIRED");
  }
  return atomRefs;
};

/** Same contribution adapter pattern as StudyDesign/ScientificThinking options.
 * The click is the human decision; no N1 rerun, provider or second confirmation. */
export const buildStudyProposalSelectionContribution = (input: {
  composition: StudyProposalComposition; selectedOptionRefs: readonly string[]; selectedAtomRefs?: readonly string[];
  project: ResearchProjectOwnerProjection | null; projectId: string; conversationId: string;
  proposalTurn: ScientificInterpretationTurn; selectionTurn: ScientificInterpretationTurn; createdAt: string;
  disposition?: "ACCEPT" | "REJECTED" | "DEFERRED";
  /** Preparation is not user assent; only the later native review authorizes adoption. */
  preparingReview?: boolean;
}): ScientificInterpretationContributionEnvelope => {
  assertStudyProposalCurrent(input.composition, input.project);
  if (input.proposalTurn.role !== "NOXIA" || input.proposalTurn.turnId !== input.composition.sourceResponseRef
    || input.selectionTurn.role !== "USER") throw new Error("STUDY_PROPOSAL_VISIBLE_TURN_BINDING_INVALID");
  const atomRefs = selectedStudyProposalAtoms(input.composition, input.selectedOptionRefs, input.selectedAtomRefs);
  const objects = input.project ? ensureCanonicalProjectState(input.project).objects : [];
  const items = input.composition.proposal.atoms.filter(a => atomRefs.includes(a.ref)).map(atom => {
    const semanticIdentity = `${input.projectId}:study-strategy:${atom.semanticKey}`;
    const previous = objects.find(o => o.actuality === "CURRENT" && o.objectId === semanticIdentity);
    return { itemId: studyProposalAtomItemRef(input.composition, atom.ref), semanticIdentity,
      proposedType: atom.targetType, content: atom.content, polarity: "AFFIRMED", studyRole: atom.area,
      confidence: null, previousItemIds: previous ? [previous.objectId, ...previous.sourceItemRefs] : [],
      evidenceRefs: [input.composition.proposalRef, input.composition.digest, atom.ref, ...atom.evidenceRefs],
      epistemicBoundary: { ownership: atom.owner, epistemicState: "ASSUMED" as const, epistemicStatus: !input.preparingReview && (!input.disposition || input.disposition === "ACCEPT") ? "CONFIRMED_BY_USER" : "OWNER_CANDIDATE",
        adoptionStatus: "CANDIDATE_PENDING_HUMAN_CONFIRMATION", originType: "ASSISTANT_OWNER_RESULT", originStatus: atom.status,
        activeState: true, sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId], sourceText: input.selectionTurn.content } };
  });
  // Native PRJ relation closure groups indispensable choices for partial review.
  // Refinements stay in the working composition, never as adopted unknowns.
  const relations = input.composition.proposal.atoms.filter(a => atomRefs.includes(a.ref) && a.dependencyQualifications)
    .flatMap(atom => hardStudyProposalDependencies(atom).map(dependency => ({
      relationId: `${studyProposalAtomItemRef(input.composition, atom.ref)}:requires:${dependency}`,
      relationType: "Nécessite", sourceItemId: studyProposalAtomItemRef(input.composition, atom.ref),
      targetItemId: input.composition.adoptedAtomRefs.includes(dependency)
        ? `${input.projectId}:study-strategy:${input.composition.proposal.atoms.find(a => a.ref === dependency)!.semanticKey}`
        : studyProposalAtomItemRef(input.composition, dependency),
      polarity: "AFFIRMED", confidence: null,
      evidenceRefs: [input.composition.proposalRef, input.composition.digest],
      epistemicBoundary: items.find(item => item.itemId === studyProposalAtomItemRef(input.composition, atom.ref))!.epistemicBoundary,
    })));
  const openDetails = input.preparingReview ? input.composition.proposal.atoms.filter(a => a.status === "OPEN_DECISION").map(atom => ({
    itemId: studyProposalAtomItemRef(input.composition, atom.ref), semanticIdentity: null,
    proposedType: "UNCERTAINTY", content: atom.content, polarity: null, studyRole: atom.area, confidence: null,
    evidenceRefs: [input.composition.proposalRef, atom.ref],
    epistemicBoundary: { ownership: atom.owner, epistemicState: "UNKNOWN" as const, epistemicStatus: "OWNER_CANDIDATE",
      adoptionStatus: "NOT_ADOPTED", originType: "ASSISTANT_OWNER_RESULT", originStatus: "OPEN_DECISION",
      activeState: true, sourceTurnIds: [input.proposalTurn.turnId, input.selectionTurn.turnId], sourceText: input.selectionTurn.content },
  })) : [];
  return canonicalizeScientificContribution({ contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE", contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
    identity: { contributionId: `study-proposal-selection:${logicalDigest({ digest: input.composition.digest, atomRefs, userTurn: input.selectionTurn.turnId })}`,
      previousContributionId: input.project?.contributionRef ?? null, contractVersion: "1.0.0", runtimeId: "STANDARD_CONTEXTUAL_PROPOSAL_SELECTION_ADAPTER", runtimeVersion: "1.0.0", createdAt: input.createdAt },
    source: { conversationId: input.conversationId, originalRequest: input.selectionTurn.content, turns: [input.proposalTurn, input.selectionTurn],
      sourceRefs: [input.composition.proposalRef, input.composition.digest, ...atomRefs, ...input.selectedOptionRefs,
        ...input.composition.dispositions?.map(d => d.decisionRef) ?? [], input.proposalTurn.turnId, input.selectionTurn.turnId], rawOutputRef: input.composition.proposalRef, rawOutputDigest: input.composition.digest },
    runtimeEvidence: { provider: null, model: null, promptDigest: null, schemaDigest: logicalDigest("SCIENTIFIC_THINKING_STUDY_PROPOSAL_1"),
      configurationDigest: logicalDigest("STANDARD_CONTEXTUAL_PROPOSAL_SELECTION_ADAPTER_1"), technicalStatus: "VISIBLE_CHOICES_SELECTED_FOR_HUMAN_DECISION", parseStatus: "NOT_REQUIRED", validationErrors: [] },
    scientificContent: { normalizedUnderstanding: input.composition.proposal.understanding.join(" · "), routeProposal: null, explicitStatements: [], candidateObjects: items,
      candidateRelations: relations, inferredContext: [], contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [],
      missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: openDetails, temporalQualifications: [], expectedVariableOccasions: [] },
    epistemicBoundary: { candidateIsAdopted: false, knowledgeSupportIsProjectDecision: false, projectOwnershipTransferred: false, humanDecisionEnvelopeRef: null },
    mapping: items.map(item => ({ sourceItemId: item.itemId, proposedTargetDomain: "RESEARCH_PROJECT", proposedTargetTypes: [item.proposedType],
      mappingStatus: "DOMAIN_REVIEW_REQUIRED", qualificationOwnerRequired: "RESEARCH_PROJECT", mappingLimitations: ["EXACT_VISIBLE_SELECTION_ONLY", "NO_IMPLICIT_DOWNSTREAM_ADOPTION"] })),
    audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
    decisionBoundary: { decisionRequired: true, decisionEnvelopeRef: null, permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER", "REOPEN", "PARTIAL_SELECTION", "ROUTE_TO_SPECIALIST"], projectWriteAuthorized: false } });
};

export const propagateStudyProposalDecision = (composition: StudyProposalComposition, project: ResearchProjectOwnerProjection, adoptedRefs: readonly string[], selectedOptionRefs: readonly string[], sourceTurn?: ScientificInterpretationTurn) => {
  const objects = ensureCanonicalProjectState(project).objects.filter(o => o.actuality === "CURRENT");
  const adoptionSourceRefs = { ...composition.adoptionSourceRefs };
  for (const ref of adoptedRefs) {
    const atom = composition.proposal.atoms.find(a => a.ref === ref);
    const sourceRefs = [studyProposalAtomItemRef(composition, ref), ...atom?.userChangeRefs ?? []];
    const semanticIdentity = `${project.projectId}:study-strategy:${atom?.semanticKey}`;
    const object = objects.find(o => o.content === atom?.content && sourceRefs.some(r => o.sourceItemRefs.includes(r)))
      ?? objects.find(o => o.objectId === semanticIdentity && o.content === atom?.content);
    if (!object) throw new Error("STUDY_PROPOSAL_ADOPTION_NOT_IN_CANONICAL_PROJECT");
    adoptionSourceRefs[ref] = object.sourceItemRefs;
  }
  const adoptedAtomRefs = [...new Set([...composition.adoptedAtomRefs, ...adoptedRefs])].filter(ref => {
    const atom = composition.proposal.atoms.find(a => a.ref === ref);
    return objects.some(o => o.content === atom?.content && (adoptionSourceRefs[ref] ?? [studyProposalAtomItemRef(composition, ref)]).some(r => o.sourceItemRefs.includes(r)));
  });
  const unavailableOptionRefs = [...new Set([...composition.unavailableOptionRefs.filter(r => !selectedOptionRefs.includes(r)), ...composition.proposal.arbitrations
    .filter(a => a.selection === "ONE" && a.options.some(o => selectedOptionRefs.includes(o.ref)))
    .flatMap(a => a.options.filter(o => !selectedOptionRefs.includes(o.ref)).map(o => o.ref))])];
  const sourceProject = studyProposalBinding(project);
  const next = { ...composition, sourceProject, adoptedAtomRefs, adoptionSourceRefs, unavailableOptionRefs, revision: composition.revision + 1,
    digest: "",
    state: "CURRENT" as const };
  next.digest = studyProposalRevisionDigest(next);
  next.dimensioning = activeStudyProposalDimensioning(next);
  return { ...next, qrySelection: selectStudyProposalArbitrations({ composition: next, navigation: buildCurrentTurnNavigation({
    sourceTurnRef: sourceTurn?.turnId ?? composition.sourceTurnRef, sourceText: sourceTurn?.content ?? "", currentProject: project,
    contribution: null, candidate: null, validation: null,
  }) }) };
};

export const projectStudyProposalDisposition = (composition: StudyProposalComposition, decision: import("../../protocol-designer/human-decision.js").HumanDecisionEnvelope,
  atomRefs: readonly string[], optionRefs: readonly string[]): StudyProposalComposition => {
  if (decision.status !== "REJECTED" && decision.status !== "DEFERRED") throw new Error("STUDY_PROPOSAL_DISPOSITION_REQUIRED");
  const dispositions = [...composition.dispositions ?? [], { decisionRef: decision.decisionId, status: decision.status, atomRefs: [...atomRefs], optionRefs: [...optionRefs] }];
  const revision = composition.revision + 1;
  const next = { ...composition, revision, dispositions, digest: "" };
  next.digest = studyProposalRevisionDigest(next);
  return { ...next, dimensioning: activeStudyProposalDimensioning(next) };
};

/** Both native review and bundle adoption terminate in the same propagator. */
export const propagateFreeformStudyProposalDecision = (composition: StudyProposalComposition, project: ResearchProjectOwnerProjection,
  contribution: ScientificInterpretationContributionEnvelope, sourceTurn?: ScientificInterpretationTurn): StudyProposalComposition => {
  if (composition.recomputation?.contributionRef !== contribution.identity.contributionId) return requireStudyProposalReview(composition, project);
  const objects = ensureCanonicalProjectState(project).objects.filter(o => o.actuality === "CURRENT");
  const adoptedRefs = composition.recomputation.changedAtomRefs.filter(ref => {
    const atom = composition.proposal.atoms.find(a => a.ref === ref);
    return objects.some(o => o.content === atom?.content && atom.userChangeRefs?.some(r => o.sourceItemRefs.includes(r)));
  });
  if (!adoptedRefs.length || adoptedRefs.length !== composition.recomputation.changedAtomRefs.length) return requireStudyProposalReview(composition, project);
  const selectedOptions = composition.proposal.arbitrations.flatMap(a => a.options.filter(o => o.atomRefs.some(r => adoptedRefs.includes(r))).map(o => o.ref));
  return propagateStudyProposalDecision(composition, project, adoptedRefs, selectedOptions, sourceTurn ?? [...contribution.source.turns].reverse().find(t => t.role === "USER"));
};
