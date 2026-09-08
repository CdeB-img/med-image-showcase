import type { ResearchProjectContributionCandidate, ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import type { ProductBridgePreProjectNavigation, PersistentDeltaValidation } from "../protocol-designer/product-bridge.js";
import type { ScientificInterpretationConversation, ScientificInterpretationContributionEnvelope } from "../scientific-interpretation/contracts.js";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import { buildQueryNavigationContext } from "./adapters.js";
import { makeQueryNavigationId } from "./canonical.js";
import type { NextActionCandidate, QueryNavigationSourceState } from "./contracts.js";
import { PD009_ACTION_LABELS } from "./contracts.js";
import { selectNextAction } from "./engine.js";
import { buildGovernedConversationEnvelope } from "./governed-conversation-realization.js";
import type { GovernedRealizationContent } from "./governed-conversation-realization.js";

export type CurrentGovernedNavigationInput = Readonly<{
  projectId: string; projectVersion: string; projectDigest: string;
  selectedActionRef: string; sourceStateDigest: string;
  selected: NextActionCandidate;
  authorizedContent: readonly GovernedRealizationContent[];
  alreadyProvidedInformationRefs: readonly string[];
  informationNeedScopes?: readonly CurrentInformationNeedScope[];
}>;

export type CurrentInformationNeedScope = Readonly<{
  needRef: string;
  sourceRef: string;
  affectedBranchRefs: readonly string[];
}>;

export const currentCandidateSelectedScopeEvidence = (input: {
  candidate: Readonly<ResearchProjectContributionCandidate> | null;
  selected: Readonly<NextActionCandidate>;
  informationNeedScopes: readonly CurrentInformationNeedScope[];
}) => {
  // Same structural sufficiency boundaries already used by
  // functional-reset-progression.facetsForProject. The lexical facets are NOT
  // approximated here. Presence does not mean adopted truth or resolved need.
  const facetForSection = {
    DESIGN: "project-facet:DESIGN:DESIGN_FRAME",
    INTERVENTION: "project-facet:INTERVENTION:INTERVENTION",
    COMPARATOR: "project-facet:COMPARATOR:COMPARATOR",
    MEASUREMENTS: "project-facet:MEASUREMENTS:MEASUREMENT_SET",
    TEMPORALITY: "project-facet:TEMPORALITY:MEASUREMENT_TIMING",
  } as const;
  const observed = new Map<string, string[]>();
  for (const change of input.candidate?.canonicalChangeSet.objectChanges ?? []) {
    const item = change.candidate;
    if (!item || change.operation === "REMOVE" || item.epistemicState !== "KNOWN"
      || item.projection.sourcePolarity === "NEGATED") continue;
    const facet = item.objectType === "SCIENTIFIC_QUESTION"
      ? "project-facet:QUESTION:QUESTION_FORMULATION"
      : facetForSection[item.sectionId as keyof typeof facetForSection];
    if (facet) observed.set(facet, [...(observed.get(facet) ?? []), change.changeRef]);
  }
  const bindings = input.informationNeedScopes.filter((scope) =>
    input.selected.navigationNeedRefs.includes(scope.needRef)
    && input.selected.sourceRefs.includes(scope.sourceRef)
    && scope.affectedBranchRefs.length > 0
    && scope.affectedBranchRefs.every((ref) => input.selected.affectedBranchRefs.includes(ref)));
  const affected = bindings.flatMap((scope) => {
    const branches = scope.affectedBranchRefs.filter((ref) => observed.has(ref));
    return branches.length ? [{
      needRef: scope.needRef, sourceRef: scope.sourceRef, affectedBranchRefs: branches,
      candidateChangeRefs: [...new Set(branches.flatMap((ref) => observed.get(ref) ?? []))],
      reason: "CURRENT_CANDIDATE_AFFECTS_SELECTED_SCOPE_REQUIRES_REVIEW" as const,
      needResolution: "NOT_DECLARED" as const,
    }] : [];
  });
  const supported = new Set<string>([...Object.values(facetForSection), "project-facet:QUESTION:QUESTION_FORMULATION"]);
  return {
    affected,
    unknownScopeRefs: [...new Set(input.selected.affectedBranchRefs
      .filter((ref) => !supported.has(ref) || !bindings.some((scope) => scope.affectedBranchRefs.includes(ref))))],
    projectWriteAuthorized: false as const,
    needResolutionDeclared: false as const,
  };
};

const emptyState = (): QueryNavigationSourceState => ({
  projectUnknowns: [], projectAmbiguities: [], projectContradictions: [], dataNeeds: [],
  planningDecisionRequirements: [], validationFindings: [], validationHumanReviews: [],
  validationSemanticReviews: [], validationGates: [], readiness: [], documentGenerability: [],
  knowledgeGaps: [], dependencies: [],
});

/** QRY consumer adapter. A validated changeset is evidence, never an adopted snapshot.
 * Typed objectives and explicit comparisons determine the reversible structuring
 * scope. No empty section, domain vocabulary or UNKNOWN creates an ASK here. */
export const buildCurrentTurnNavigation = (input: {
  sourceTurnRef: string;
  sourceText: string;
  candidate: Readonly<ResearchProjectContributionCandidate> | null;
  contribution?: Readonly<ScientificInterpretationContributionEnvelope> | null;
  validation: Readonly<PersistentDeltaValidation> | null;
  currentProject: Readonly<ResearchProjectOwnerProjection> | null;
  preProjectNavigation?: ProductBridgePreProjectNavigation;
  interaction?: ScientificInterpretationConversation["interactionContext"];
  currentNavigation?: CurrentGovernedNavigationInput;
  requestKind?: "USER_TURN" | "POST_ADOPTION_QRY_CONTINUATION";
}) => {
  const candidate = input.validation?.valid && !input.validation.blocks.length
    && input.candidate?.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION"
    && input.contribution?.identity.contributionId === input.candidate.contributionRef
    && input.contribution.identity.contributionDigest === input.candidate.contributionDigest
    && input.contribution.source.turns.some((turn) => turn.role === "USER" && turn.turnId === input.sourceTurnRef)
    && input.contribution.source.sourceRefs.includes(input.sourceTurnRef)
    && input.candidate.canonicalChangeSet.baseProjectVersion === (input.currentProject?.versionId ?? null)
    ? input.candidate : null;
  const changes = candidate?.canonicalChangeSet.objectChanges ?? [];
  const relations = candidate?.canonicalChangeSet.relationChanges.filter((item) => item.candidate?.relationType === "COMPARES_WITH") ?? [];
  const objectives = changes.filter((item) => item.candidate?.objectType === "OBJECTIVE" || item.candidate?.objectType === "SCIENTIFIC_QUESTION");
  const comparisonRefs = new Set(relations.flatMap((item) => item.candidate
    ? [item.candidate.sourceObjectRef, item.candidate.targetObjectRef] : []));
  const comparedObjects = changes.filter((item) => comparisonRefs.has(item.objectId));
  const targets = objectives.length ? objectives : comparedObjects.length ? comparedObjects : changes;
  const content: GovernedRealizationContent[] = targets.flatMap((item) => item.candidate ? [{
    ref: item.objectId, text: item.candidate.content, status: item.candidate.epistemicState,
  }] : []);
  if (candidate && !objectives.length && !comparedObjects.length) {
    const representedChanges = new Set(targets.filter((change) => change.candidate).map((change) => change.changeRef));
    for (const item of candidate.humanReviewProjection.sections.flatMap((section) => section.items)) {
      if (!representedChanges.has(item.changeRef)) content.push({ ref: item.changeRef, text: item.content, status: null });
    }
  }
  const targetRefs = content.length ? content.map((item) => item.ref)
    : candidate ? changes.map((item) => item.objectId) : [input.sourceTurnRef];
  const projectBinding = input.currentProject ? {
    projectId: input.currentProject.projectId, projectVersion: input.currentProject.versionId,
    projectDigest: input.currentProject.projectDigest,
  } : null;
  const supplied = input.currentNavigation;
  const governed = supplied && input.currentProject
    && supplied.projectId === input.currentProject.projectId
    && supplied.projectVersion === input.currentProject.versionId
    && supplied.projectDigest === input.currentProject.projectDigest
    && supplied.selectedActionRef === input.interaction?.sourceActionRef
    && input.interaction.projectRef === input.currentProject.projectId
    && input.interaction.projectVersion === input.currentProject.versionId
    && input.interaction.projectDigest === input.currentProject.projectDigest
    && supplied.selected.projectWriteAuthorized === false && supplied.selected.sourceOfTruth === false
    && supplied.selected.eligibility === "ELIGIBLE" ? supplied : null;
  const currentActionToConsider = candidate || input.requestKind === "POST_ADOPTION_QRY_CONTINUATION" ? governed : null;
  const contextDigest = logicalDigest({ sourceTurnRef: input.sourceTurnRef, sourceText: input.sourceText,
    candidate: candidate?.canonicalChangeSet ?? null, projectBinding, interaction: input.interaction ?? null,
    preProjectNavigation: input.preProjectNavigation ?? null, governed });
  const legacyGovernedAsk = !input.currentProject && input.preProjectNavigation?.action === "ASK_QUESTION"
    && input.preProjectNavigation.expectedInformationGain.startsWith("MAY_CHANGE_DECISION:")
    && Boolean(input.preProjectNavigation.selectedInformationNeedRef);
  const isAsk = !candidate && Boolean(legacyGovernedAsk);
  const selectedInformationNeedRef = isAsk
    ? governed?.selected.navigationNeedRefs[0] ?? input.preProjectNavigation?.selectedInformationNeedRef ?? null : null;
  const purpose = candidate
    ? objectives.length
      ? `Proposer une structuration réversible des questions et objectifs explicitement représentés : ${content.map((item) => item.text).join(" ; ")}. Conserver leurs identités, sans présumer qu’ils désignent des objectifs distincts, ni résoudre les inconnues ou adopter la proposition.`
      : relations.length
        ? `Structurer la comparaison explicitement représentée entre ${content.map((item) => item.text).join(" et ")}, sans sélectionner un bras, un critère ou un plan non fourni.`
        : `Préparer la revue humaine des ${candidate.humanReviewProjection.expectedChangeRefs.length} changements explicitement représentés : ${content.map((item) => item.text).join(" ; ")}. Préserver leurs opérations et valeurs, sans compléter les informations absentes.`
    : input.preProjectNavigation?.selectedInformationNeed
      ?? "Répondre à la demande courante sans créer de proposition scientifique ni de décision Project.";
  const alreadyProvidedInformationRefs = [...new Set([
    ...(governed?.alreadyProvidedInformationRefs ?? []),
    ...changes.flatMap((item) => item.candidate?.epistemicState === "KNOWN" ? [item.objectId, ...item.candidate.sourceItemRefs] : []),
  ])];
  const context = buildQueryNavigationContext({
    projectRef: input.currentProject?.projectId ?? `pre-project:${input.sourceTurnRef}`,
    projectVersion: input.currentProject?.versionId ?? "PRE_PROJECT_NOT_ADOPTED",
    sourceState: emptyState(), currentUsageRef: `CURRENT_TURN:${contextDigest}`,
    sufficiencyEvidenceRefs: candidate ? [candidate.contributionRef] : [],
    limitations: ["VALIDATED_CANDIDATE_IS_NOT_ADOPTED_TRUTH", "NO_SCIENTIFIC_COMPLETION_BY_CONSUMER"],
  });
  const actionCategory = isAsk ? "CLARIFY_BY_ADAPTIVE_EXCHANGE" : "BUILD_OR_REVISE_OBJECT";
  const whatRef = makeQueryNavigationId("current-turn-what", { contextDigest, targetRefs, actionCategory });
  const proposal: NextActionCandidate = {
    candidateId: whatRef, actionCategory, actionLabel: PD009_ACTION_LABELS[actionCategory],
    pd009RuleRefs: [isAsk ? "PD-009:6.1" : "PD-009:6.2"],
    targetRef: candidate?.contributionRef ?? input.sourceTurnRef,
    owner: "QUERY_NAVIGATION", sourceRefs: [input.sourceTurnRef, ...(candidate ? [candidate.contributionRef] : [])],
    navigationNeedRefs: selectedInformationNeedRef ? [selectedInformationNeedRef] : [], knownOptionRefs: [],
    affectedDecisionRefs: [], affectedBranchRefs: targetRefs,
    informationValue: { blocking: "NON_BLOCKING", discrimination: "UNKNOWN", impactScope: "LOCAL",
      reducibility: "AVAILABLE_NOW", irreversibility: "LOW", temporalUrgency: "UNKNOWN", burden: "LOW",
      sensitivityRisk: "UNKNOWN", pedagogicalValue: "USEFUL" },
    eligibility: "ELIGIBLE", eligibilityReasons: [candidate ? "VALIDATED_EXPLICIT_CANDIDATE_REVERSIBLE_STRUCTURING" : "EXISTING_GOVERNED_INTERACTION"],
    dependencies: [], impacts: [{ impactId: `${whatRef}:structuring-impact`, candidateRef: whatRef,
      branchRefs: targetRefs, decisionRefs: [], gateRefs: [], kind: "DOWNSTREAM", consequence: purpose }],
    deferConsequence: "NO_PROJECT_WRITE_WITHOUT_HUMAN_DECISION", explanation: purpose,
    capabilityRef: "QUERY_NAVIGATION", provenance: { owner: "QUERY_NAVIGATION",
      sourceRefs: [input.sourceTurnRef, ...(candidate ? [candidate.contributionRef] : [])],
      evidence: [purpose], limitations: [...context.limitations] },
    projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false,
  };
  const native = currentActionToConsider?.selected ?? null;
  const currentCandidateScopeEvidence = native ? currentCandidateSelectedScopeEvidence({
    candidate, selected: native, informationNeedScopes: currentActionToConsider?.informationNeedScopes ?? [],
  }) : { affected: [], unknownScopeRefs: [], projectWriteAuthorized: false as const, needResolutionDeclared: false as const };
  const excludedNativeReasons: string[] = [];
  if (native?.actionCategory === "CLARIFY_BY_ADAPTIVE_EXCHANGE") {
    if (currentCandidateScopeEvidence.affected.length) excludedNativeReasons.push("CURRENT_CANDIDATE_AFFECTS_SELECTED_SCOPE_REQUIRES_REVIEW");
    if ([native.targetRef, ...native.navigationNeedRefs].some((ref) => alreadyProvidedInformationRefs.includes(ref))) excludedNativeReasons.push("INFORMATION_ALREADY_EXPLICITLY_PROVIDED");
    if (!native.navigationNeedRefs.length) excludedNativeReasons.push("NO_GOVERNED_INFORMATION_NEED_REFERENCE");
    if (!["MAY_CHANGE_DECISION", "SEPARATES_ACTIVE_OPTIONS"].includes(native.informationValue.discrimination)) excludedNativeReasons.push("NO_DEMONSTRATED_MATERIAL_INFORMATION_VALUE");
    if (!(native.affectedBranchRefs.length || native.affectedDecisionRefs.length)) excludedNativeReasons.push("NO_REPRESENTED_DECISION_OR_BRANCH_IMPACT");
    if (!native.impacts.some((impact) => impact.candidateRef === native.candidateId && impact.consequence.trim()
      && (impact.branchRefs.some((ref) => native.affectedBranchRefs.includes(ref))
        || impact.decisionRefs.some((ref) => native.affectedDecisionRefs.includes(ref))))) excludedNativeReasons.push("MATERIAL_IMPACT_NOT_IN_CAPTURED_ACTION");
  }
  const nativeAlternative = native && excludedNativeReasons.length ? {
    ...native, eligibility: "INELIGIBLE" as const,
    eligibilityReasons: [...native.eligibilityReasons, ...excludedNativeReasons],
  } : native;
  // Compare actual alternatives in the existing engine. Sufficiency for a
  // reversible candidate does not delete a current high-value owner action.
  const alternatives = nativeAlternative ? candidate || excludedNativeReasons.length
    ? [proposal, nativeAlternative] : [nativeAlternative] : [proposal];
  const selection = selectNextAction(context, alternatives);
  const selectedNative = Boolean(native && selection.selected?.candidateId === native.candidateId);
  const unresolved = !selection.selected;
  const realizedActionCategory = unresolved ? null : selection.selected!.actionCategory;
  const realizedAsk = !unresolved && (selectedNative ? native!.actionCategory === "CLARIFY_BY_ADAPTIVE_EXCHANGE" : isAsk);
  const realizedPurpose = unresolved
    ? "Plusieurs actions restent non dominées. Conserver les alternatives et leur provenance sans arbitrer ni adopter à la place de l’utilisateur."
    : selectedNative ? native!.explanation : purpose;
  const realizedTargets = selectedNative ? [native!.targetRef, ...native!.knownOptionRefs] : targetRefs;
  const realizedContent = selectedNative ? [...currentActionToConsider!.authorizedContent] : unresolved ? [] : content;
  const envelope = buildGovernedConversationEnvelope({
    whatRef: makeQueryNavigationId("realized-what", { whatRef, selectionRef: selection.trace.traceId }),
    action: realizedAsk ? "ASK_QUESTION" : !unresolved && (selectedNative ? realizedActionCategory === "COMPARE_OPTIONS" : Boolean(candidate)) ? "PROPOSE" : "RESPOND",
    actionCategory: realizedActionCategory, purpose: realizedPurpose, sourceTurnRef: input.sourceTurnRef, projectBinding,
    candidateRef: candidate?.contributionRef ?? null, targetRefs: [...new Set(realizedTargets)],
    authorizedContent: candidate || selectedNative ? realizedContent : [
      { ref: input.sourceTurnRef, text: input.sourceText, status: null },
      ...(governed?.authorizedContent ?? []),
    ],
    requiredContentRefs: realizedContent.map((item) => item.ref),
    requiredRelations: selectedNative || unresolved || objectives.length ? [] : relations.flatMap((item) => item.candidate ? [{
      ref: item.candidate.relationId, sourceRef: item.candidate.sourceObjectRef,
      relationType: item.candidate.relationType, targetRef: item.candidate.targetObjectRef,
    }] : []),
    selectedInformationNeedRef: realizedAsk ? selectedNative ? native!.navigationNeedRefs[0] : selectedInformationNeedRef : null, alreadyProvidedInformationRefs,
    scientificLimitations: [...context.limitations],
  });
  return { contextDigest, selection, envelope,
    currentCandidateScopeEvidence,
    enoughForReversibleCandidate: Boolean(candidate),
    highValueNextActionAvailable: Boolean(native && !excludedNativeReasons.length && ["MAY_CHANGE_DECISION", "SEPARATES_ACTIVE_OPTIONS"].includes(native.informationValue.discrimination)),
    excludedNativeReasons,
    localWhatText: unresolved ? realizedPurpose : selectedNative ? native!.explanation : candidate
    ? `${objectives.length ? "Je propose de structurer les questions et objectifs représentés" : relations.length ? "Je propose de structurer cette comparaison" : "Je propose de préparer la revue de ces changements"}${content.length ? ` : ${content.map((item) => item.text).join(" ; ")}` : ". Les changements repérés sont conservés pour revue"}. Cette proposition reste à confirmer ; aucune information manquante n’est complétée.`
    : null, candidateRef: candidate?.contributionRef ?? null, candidateAdopted: false as const };
};
