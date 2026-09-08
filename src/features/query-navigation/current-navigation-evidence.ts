import { logicalDigest } from "../knowledge-engine/canonical.js";
import {
  buildProjectContextSnapshot,
  type ProjectContextSnapshot,
} from "../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import {
  ownerResultNativeDigest,
  rehydrateProductOwnerResultLedger,
  type ProductOwnerResultLedger,
  type ProductOwnerResultLedgerEntry,
} from "../protocol-designer/product-owner-result-ledger.js";
import type { RetainedContributionCandidate } from "../protocol-designer/functional-reset/contribution-lifecycle.js";
import type { StudyDesignProposalContribution } from "../study-design/contracts.js";
import type { NavigationNeed, QueryNavigationSourceState } from "./contracts.js";
import { makeQueryNavigationId, queryNavigationDigest } from "./canonical.js";
import type {
  BoundedConversationInteraction,
  BoundedConversationReferentContext,
} from "./current-turn-navigation.js";
import type { GovernedRealizationContent, GovernedVisibleObligation } from "./governed-conversation-realization.js";

/** Explicit consumer scope, not a recency rule and not a new result store. */
export type CurrentNavigationOwnerResultRef = Readonly<{
  owner: ProductOwnerResultLedgerEntry["request"]["owner"];
  resultId: string;
  resultVersion: string;
  resultDigest: string;
  scopeRefs: readonly string[];
  disposition: "ACTIVE" | "REJECTED" | "DEFERRED" | "STALE" | "SUPERSEDED";
  applicability: "APPLICABLE" | "NOT_APPLICABLE" | "UNKNOWN";
}>;

type ProjectBinding = Readonly<{
  projectId: string;
  versionId: string;
  projectDigest: string;
  snapshotDigest: string;
}>;

export type CurrentNavigationEvidence = Readonly<{
  owner: "QUERY_NAVIGATION";
  currentTurn: Readonly<{ ref: string; sourceDigest: string }>;
  candidate: null | Readonly<{
    ref: string;
    digest: string;
    contributionDigest: string;
    sourceTurnRef: string;
    baseProject: RetainedContributionCandidate["baseProject"];
    status: "VALIDATED_NON_ADOPTED_CANDIDATE";
    objectChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["objectChanges"];
    relationChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["relationChanges"];
    temporalQualificationChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["temporalQualificationChanges"];
    expectedVariableOccasionChanges: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["expectedVariableOccasionChanges"];
    conflicts: RetainedContributionCandidate["candidate"]["canonicalChangeSet"]["conflicts"];
    dependencyBindings: RetainedContributionCandidate["dependencyBindings"];
    validatorRef: string;
    projectWriteAuthorized: false;
  }>;
  adoptedProject: ProjectBinding | null;
  ownerResults: readonly Readonly<{
    owner: string;
    ref: string;
    version: string;
    digest: string;
    snapshotDigest: string;
    scopeRefs: readonly string[];
    sourceRefs: readonly string[];
    dependencyRefs: readonly string[];
    limitations: readonly string[];
    options: StudyDesignProposalContribution["options"];
    tradeOffs: StudyDesignProposalContribution["tradeOffs"];
    epistemicStatus: StudyDesignProposalContribution["epistemicStatus"];
    humanDecisionRequired: true;
  }>[];
  sourceState: QueryNavigationSourceState & { governedNeeds: NavigationNeed[] };
  alreadyProvidedInformationRefs: readonly string[];
  closedBranchRefs: readonly string[];
  resolvedNeedRefs: readonly string[];
  // Diagnostic-only exclusions do not participate in the active context digest.
  excludedReferences: readonly Readonly<{ ref: string; reason: string }>[];
  contextDigest: string;
  projectionOnly: true;
  sourceOfTruth: false;
  projectWriteAuthorized: false;
}>;

const unique = (values: readonly string[]) => [...new Set(values.filter(Boolean))].sort();
const same = (left: unknown, right: unknown) => logicalDigest(left) === logicalDigest(right);
const currentQuestionTargetText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed.endsWith("?") || [...trimmed.matchAll(/\?/gu)].length !== 1) return trimmed;
  const mark = trimmed.lastIndexOf("?");
  const preceding = trimmed.slice(0, mark);
  const boundary = Math.max(preceding.lastIndexOf("."), preceding.lastIndexOf("!"), preceding.lastIndexOf("\n"));
  return trimmed.slice(boundary + 1).trim();
};
const emptyState = (): CurrentNavigationEvidence["sourceState"] => ({
  projectUnknowns: [], projectAmbiguities: [], projectContradictions: [], dataNeeds: [],
  planningDecisionRequirements: [], validationFindings: [], validationHumanReviews: [],
  validationSemanticReviews: [], validationGates: [], readiness: [], documentGenerability: [],
  knowledgeGaps: [], dependencies: [], governedNeeds: [],
});

const candidateReferentContent = (record: Readonly<RetainedContributionCandidate>): GovernedRealizationContent[] => {
  const changes = record.candidate.canonicalChangeSet.objectChanges.filter((change) => change.candidate && change.operation !== "REMOVE");
  const objectives = changes.filter((change) => ["OBJECTIVE", "SCIENTIFIC_QUESTION"].includes(change.candidate!.objectType));
  const comparisonRefs = new Set(record.candidate.canonicalChangeSet.relationChanges
    .filter((relation) => relation.candidate?.relationType === "COMPARES_WITH")
    .flatMap((relation) => relation.candidate ? [relation.candidate.sourceObjectRef, relation.candidate.targetObjectRef] : []));
  const comparisons = changes.filter((change) => comparisonRefs.has(change.objectId));
  return (objectives.length ? objectives : comparisons.length ? comparisons : changes).map((change) => ({
    ref: change.objectId,
    text: change.candidate!.content,
    status: change.candidate!.epistemicState,
  }));
};

/** Pure lifecycle projection: no transcript, no recency-only merge, no scientific interpretation. */
export const buildBoundedConversationReferentContext = (input: {
  retained: readonly RetainedContributionCandidate[];
  currentProject: Readonly<ResearchProjectOwnerProjection> | null;
  conversationId: string;
  runtimeTurns: readonly Readonly<{ turnId: string; role: "USER" | "NOXIA"; content: string }>[];
}): BoundedConversationReferentContext => {
  const expectedBase = input.currentProject ? {
    projectId: input.currentProject.projectId,
    versionId: input.currentProject.versionId,
    projectDigest: input.currentProject.projectDigest,
  } : null;
  const eligible = input.retained.filter((record) => {
    const source = input.runtimeTurns.find((turn) => turn.role === "USER" && turn.turnId === record.sourceTurnRef);
    return record.actuality === "CURRENT" && !record.humanDecision
      && record.validation.valid && !record.validation.blocks.length
      && record.contribution.source.conversationId === input.conversationId
      && source && logicalDigest(source.content) === record.sourceDigest
      && same(record.baseProject, expectedBase)
      && same(record.candidateDigest, logicalDigest({ contribution: record.contribution, candidate: record.candidate }));
  });
  if (eligible.length > 1) return Object.freeze({
    resolution: "AMBIGUOUS", candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
    reason: "MULTIPLE_CURRENT_NON_ADOPTED_CANDIDATES", projectWriteAuthorized: false,
  });
  const record = eligible[0];
  if (record) return Object.freeze({
    resolution: "UNIQUE_CURRENT", candidateRef: record.candidateRef, sourceTurnRef: record.sourceTurnRef,
    sourceDigest: record.sourceDigest, content: Object.freeze(candidateReferentContent(record)),
    reason: "EXACT_CURRENT_RETAINED_CANDIDATE_BINDING", projectWriteAuthorized: false,
  });
  const nonCurrentExists = input.retained.some((record) => record.actuality !== "CURRENT" || Boolean(record.humanDecision));
  return Object.freeze({
    resolution: nonCurrentExists ? "STALE_OR_SUPERSEDED" : "NONE",
    candidateRef: null, sourceTurnRef: null, sourceDigest: null, content: [],
    reason: nonCurrentExists ? "ONLY_NON_CURRENT_OR_DECIDED_CANDIDATES_AVAILABLE" : "NO_RETAINED_CANDIDATE",
    projectWriteAuthorized: false,
  });
};

/** Closed interaction-language grammar, not a scientific/domain synonym dictionary. */
export const selectBoundedConversationInteraction = (input: {
  sourceText: string;
  correctionMode: boolean;
  referentContext: Readonly<BoundedConversationReferentContext>;
}): BoundedConversationInteraction | undefined => {
  if (input.correctionMode) return Object.freeze({
    kind: "ACKNOWLEDGE_USER_DIRECTION", evidenceRefs: Object.freeze([input.referentContext.candidateRef].filter((ref): ref is string => Boolean(ref))),
  });
  const normalized = input.sourceText.normalize("NFKC").replace(/[\u2018\u2019\u02bc\uff07]/gu, "'")
    .toLocaleLowerCase("fr-FR").replace(/\s+/gu, " ").trim();
  const asksToExplain = /^(?:explique|expliquez|expliquer)\b/u.test(normalized);
  const hasDeicticReference = /\b(?:ce|cet|cette|ces|celui|celle|ceux|celles)\b/u.test(normalized);
  if (asksToExplain && hasDeicticReference) return Object.freeze({
    kind: "EXPLAIN_REFERENCED_CONTENT",
    evidenceRefs: Object.freeze([input.referentContext.candidateRef, input.referentContext.sourceTurnRef].filter((ref): ref is string => Boolean(ref))),
  });
  return undefined;
};

const snapshotReasons = (entry: Readonly<ProductOwnerResultLedgerEntry>, snapshot: Readonly<ProjectContextSnapshot>) => {
  const result = entry.result;
  if (!result) return ["OWNER_RESULT_MISSING"];
  return [
    ...(result.sourceProjectRef === snapshot.sourceProjectRef && entry.request.sourceProject.sourceProjectRef === snapshot.sourceProjectRef ? [] : ["OTHER_PROJECT_RESULT"]),
    ...(result.sourceProjectVersion === snapshot.sourceProjectVersion && entry.request.sourceProject.sourceProjectVersion === snapshot.sourceProjectVersion ? [] : ["PROJECT_VERSION_CHANGED"]),
    ...(result.sourceProjectDigest === snapshot.sourceProjectDigest && entry.request.sourceProject.sourceProjectDigest === snapshot.sourceProjectDigest ? [] : ["PROJECT_DIGEST_CHANGED"]),
    ...(result.sourceSnapshotDigest === snapshot.snapshotDigest && entry.request.sourceProject.snapshotDigest === snapshot.snapshotDigest ? [] : ["SNAPSHOT_DIGEST_CHANGED"]),
  ];
};

const dependencyReasons = (
  entry: Readonly<ProductOwnerResultLedgerEntry>,
  ledger: Readonly<ProductOwnerResultLedger>,
  snapshot: Readonly<ProjectContextSnapshot>,
  excludedResultRefs: ReadonlySet<string>,
  visited = new Set<string>(),
): string[] => {
  if (visited.has(entry.entryId)) return ["OWNER_DEPENDENCY_CYCLE"];
  const nextVisited = new Set([...visited, entry.entryId]);
  return entry.dependencies.flatMap((dependency) => {
    const retained = ledger.entries.find((candidate) => candidate.result?.owner === dependency.owner
      && candidate.result.resultId === dependency.resultId
      && candidate.result.resultVersion === dependency.resultVersion
      && ownerResultNativeDigest(candidate.result) === dependency.nativeResultDigest);
    if (!retained || excludedResultRefs.has(dependency.resultId)) return ["OWNER_DEPENDENCY_NOT_CURRENT"];
    return [...snapshotReasons(retained, snapshot), ...dependencyReasons(retained, ledger, snapshot, excludedResultRefs, nextVisited)];
  });
};

/**
 * Pure projection from exact current bindings. It records no candidate, does not
 * invoke an owner, and cannot reinterpret the candidate as an adopted Project.
 * The bounded owner adapter currently consumes the already governed RDE output.
 */
export const buildCurrentNavigationEvidence = (input: {
  sourceTurnRef: string;
  sourceText: string;
  currentProject: Readonly<ResearchProjectOwnerProjection> | null;
  validatedCandidate?: Readonly<RetainedContributionCandidate> | null;
  ownerResultLedger?: Readonly<ProductOwnerResultLedger> | null;
  activeOwnerResultRefs?: readonly CurrentNavigationOwnerResultRef[];
  closedBranchRefs?: readonly string[];
  resolvedNeedRefs?: readonly string[];
  invalidatedSourceTurnRefs?: readonly string[];
}): CurrentNavigationEvidence => {
  const sourceState = emptyState();
  const snapshot = input.currentProject ? buildProjectContextSnapshot({ project: input.currentProject }) : null;
  const adoptedProject: ProjectBinding | null = snapshot ? {
    projectId: snapshot.sourceProjectRef, versionId: snapshot.sourceProjectVersion,
    projectDigest: snapshot.sourceProjectDigest, snapshotDigest: snapshot.snapshotDigest,
  } : null;
  const closedBranchRefs = unique(input.closedBranchRefs ?? []);
  const resolvedNeedRefs = unique(input.resolvedNeedRefs ?? []);
  const excludedReferences: { ref: string; reason: string }[] = [];
  let candidate: CurrentNavigationEvidence["candidate"] = null;
  const record = input.validatedCandidate;
  if (record) {
    const baseProject = adoptedProject ? {
      projectId: adoptedProject.projectId, versionId: adoptedProject.versionId, projectDigest: adoptedProject.projectDigest,
    } : null;
    const reasons = [
      ...(record.actuality === "CURRENT" && !record.humanDecision ? [] : ["CANDIDATE_NOT_CURRENT_NON_ADOPTED"]),
      ...(record.validation.valid && !record.validation.blocks.length && record.validatorRef ? [] : ["VALIDATED_CANDIDATE_REQUIRED"]),
      ...(record.candidate.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION" ? [] : ["CANDIDATE_NOT_NAVIGABLE"]),
      ...(record.sourceTurnRef === input.sourceTurnRef && record.sourceDigest === logicalDigest(input.sourceText) ? [] : ["CANDIDATE_SOURCE_TURN_MISMATCH"]),
      ...((input.invalidatedSourceTurnRefs ?? []).includes(record.sourceTurnRef) ? ["CANDIDATE_SOURCE_INVALIDATED"] : []),
      ...(same(record.baseProject, baseProject) ? [] : ["CANDIDATE_BASE_PROJECT_CHANGED"]),
      ...(same(record.candidateDigest, logicalDigest({ contribution: record.contribution, candidate: record.candidate })) ? [] : ["CANDIDATE_DIGEST_CHANGED"]),
      ...(record.dependencyBindings.every((dependency) => dependency.actuality === "CURRENT") ? [] : ["CANDIDATE_DEPENDENCY_NOT_CURRENT"]),
    ];
    if (reasons.length) reasons.forEach((reason) => excludedReferences.push({ ref: record.candidateRef, reason }));
    else {
      const changes = record.candidate.canonicalChangeSet;
      candidate = structuredClone({
        ref: record.candidateRef, digest: record.candidateDigest,
        contributionDigest: record.contribution.identity.contributionDigest,
        sourceTurnRef: record.sourceTurnRef, baseProject: record.baseProject,
        status: "VALIDATED_NON_ADOPTED_CANDIDATE" as const,
        objectChanges: changes.objectChanges, relationChanges: changes.relationChanges,
        temporalQualificationChanges: changes.temporalQualificationChanges,
        expectedVariableOccasionChanges: changes.expectedVariableOccasionChanges,
        conflicts: changes.conflicts, dependencyBindings: record.dependencyBindings,
        validatorRef: record.validatorRef, projectWriteAuthorized: false as const,
      });
    }
  }

  const ownerResults: CurrentNavigationEvidence["ownerResults"][number][] = [];
  const ledger = input.ownerResultLedger ? rehydrateProductOwnerResultLedger(input.ownerResultLedger) : null;
  const excludedResultRefs = new Set((input.activeOwnerResultRefs ?? [])
    .filter((ref) => ref.disposition !== "ACTIVE" || ref.applicability !== "APPLICABLE").map((ref) => ref.resultId));
  const currentProjectRefs = new Set(snapshot ? [
    ...snapshot.objects.flatMap((object) => [object.stableId, object.versionRef]),
    ...snapshot.relations.flatMap((relation) => [relation.stableId, relation.versionRef]),
  ] : []);
  for (const selected of [...(input.activeOwnerResultRefs ?? [])].sort((a, b) => a.resultId.localeCompare(b.resultId) || a.resultVersion.localeCompare(b.resultVersion))) {
    const reject = (reason: string) => excludedReferences.push({ ref: selected.resultId, reason });
    if (selected.disposition !== "ACTIVE") { reject(`OWNER_RESULT_${selected.disposition}`); continue; }
    if (selected.applicability !== "APPLICABLE") { reject("OWNER_RESULT_NOT_APPLICABLE_OR_UNKNOWN"); continue; }
    if (!snapshot) { reject("PROJECT_BOUND_OWNER_RESULT_REQUIRES_ADOPTED_PROJECT"); continue; }
    if (!selected.scopeRefs.some((ref) => currentProjectRefs.has(ref))) { reject("OWNER_RESULT_NO_CURRENT_SCOPE_REF"); continue; }
    const entry = ledger?.entries.find((item) => item.result?.owner === selected.owner
      && item.result.resultId === selected.resultId && item.result.resultVersion === selected.resultVersion
      && ownerResultNativeDigest(item.result) === selected.resultDigest);
    if (!entry?.result || !ledger) { reject("OWNER_RESULT_EXACT_BINDING_NOT_FOUND"); continue; }
    const reasons = [...snapshotReasons(entry, snapshot), ...dependencyReasons(entry, ledger, snapshot, excludedResultRefs)];
    if (reasons.length) { reasons.forEach(reject); continue; }
    if (!["COMPLETED", "COMPLETED_WITH_LIMITATIONS"].includes(entry.result.status)) { reject("OWNER_RESULT_NOT_COMPLETED"); continue; }
    if (entry.result.owner !== "STUDY_DESIGN") { reject("OWNER_RESULT_OUTSIDE_BOUNDED_ADAPTER"); continue; }
    const payload = entry.result.nativePayload as StudyDesignProposalContribution | null;
    if (!payload || payload.contract !== "STUDY_DESIGN_PROPOSAL_CONTRIBUTION"
      || payload.owner !== "STUDY_DESIGN" || payload.validation.status !== "PASS"
      || payload.projectWriteAuthorized !== false || payload.candidateIsAdopted !== false
      || payload.sourceProject.snapshotDigest !== snapshot.snapshotDigest) { reject("OWNER_NATIVE_CONTRACT_NOT_APPLICABLE"); continue; }
    const needs = payload.informationNeeds.filter((need) => need.status === "OPEN_NOT_RESOLVED"
      && need.intendedResolutionPath === "FUTURE_QRY_HANDOFF" && need.sourceRefs.length && need.reason.trim() && need.question.trim());
    // No abstract UNKNOWN-only question. A sourced owner has explicitly supplied
    // both the information need and why it changes the current design reasoning.
    const activeNeeds = needs.filter((need) => !resolvedNeedRefs.includes(need.needId)
      && !selected.scopeRefs.some((ref) => closedBranchRefs.includes(ref)));
    if (!activeNeeds.length && !payload.options.length && !payload.tradeOffs.length) { reject("OWNER_RESULT_NO_ACTIVE_NAVIGATION_CONTENT"); continue; }
    ownerResults.push(structuredClone({
      owner: entry.result.owner, ref: entry.result.resultId, version: entry.result.resultVersion,
      digest: selected.resultDigest, snapshotDigest: entry.result.sourceSnapshotDigest,
      scopeRefs: unique(selected.scopeRefs), sourceRefs: unique([...entry.result.evidenceRefs, ...entry.result.provenance, ...payload.provenanceRefs]),
      dependencyRefs: unique(entry.dependencies.map((dependency) => `${dependency.owner}:${dependency.resultId}@${dependency.resultVersion}:${dependency.nativeResultDigest}`)),
      limitations: unique([...entry.result.limitations, ...payload.limitations]),
      options: payload.options, tradeOffs: payload.tradeOffs,
      epistemicStatus: payload.epistemicStatus, humanDecisionRequired: true as const,
    }));
    for (const need of activeNeeds) sourceState.governedNeeds.push({
      needId: need.needId, sourceRef: entry.result.resultId,
      sourceType: "DOMAIN_READINESS", sourceVersion: `${entry.result.resultVersion}:${selected.resultDigest}`,
      sourceObjectKind: "StudyDesignInformationNeed", owner: entry.result.owner,
      informationIntent: need.question, affectedDecisionRefs: [], affectedBranchRefs: unique(selected.scopeRefs),
      blocking: "UNKNOWN", actionability: "USER_ANSWERABLE", status: "OPEN",
      availableFromOwner: need.targetOwner, knownOptions: [],
      provenance: { sourceRefs: unique([entry.result.resultId, need.needId, ...need.sourceRefs]), owner: entry.result.owner,
        evidence: [need.question, need.reason], limitations: unique([...entry.result.limitations, ...payload.limitations]) },
      limitations: ["CURRENT_OWNER_INFORMATION_NEED_NOT_ADOPTED_PROJECT_UNKNOWN", "OWNER_REASON_IS_A_GOVERNED_CLAIM_NOT_INDEPENDENT_SCIENTIFIC_PROOF"],
      projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false,
    });
    for (const tradeOff of payload.tradeOffs.filter((item) => item.decisionRequired && item.optionRefs.length > 1)) {
      const options = payload.options.filter((option) => tradeOff.optionRefs.includes(option.optionId));
      if (options.length !== tradeOff.optionRefs.length || closedBranchRefs.some((ref) => selected.scopeRefs.includes(ref))
        || resolvedNeedRefs.includes(tradeOff.tradeOffId)) continue;
      sourceState.governedNeeds.push({
        needId: tradeOff.tradeOffId, sourceRef: entry.result.resultId,
        sourceType: "DOMAIN_READINESS", sourceVersion: `${entry.result.resultVersion}:${selected.resultDigest}`,
        sourceObjectKind: "StudyDesignTradeOff", owner: "STUDY_DESIGN",
        informationIntent: options.map((option) => option.label).join(" / "),
        affectedDecisionRefs: [tradeOff.tradeOffId], affectedBranchRefs: unique(selected.scopeRefs),
        blocking: "UNKNOWN", actionability: "HUMAN_EXPERT_REVIEW", status: "OPEN",
        availableFromOwner: "STUDY_DESIGN", knownOptions: [...tradeOff.optionRefs],
        provenance: { sourceRefs: unique([entry.result.resultId, tradeOff.tradeOffId, ...tradeOff.optionRefs, ...options.flatMap((option) => option.provenanceRefs)]),
          owner: "STUDY_DESIGN", evidence: [...tradeOff.gains, ...tradeOff.losses], limitations: [...payload.limitations] },
        limitations: ["OWNER_TRADEOFF_DECISION_REQUIRED_NOT_AUTOMATICALLY_ADOPTED"],
        projectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false,
      });
    }
  }
  sourceState.governedNeeds.sort((left, right) => left.sourceRef.localeCompare(right.sourceRef) || left.needId.localeCompare(right.needId));
  const alreadyProvidedInformationRefs = unique([
    ...(candidate?.objectChanges.flatMap((change) => change.candidate && change.candidate.epistemicState !== "UNKNOWN"
      ? [change.changeRef, ...change.candidate.sourceItemRefs] : []) ?? []),
    ...(snapshot?.objects.filter((object) => object.epistemicState === "KNOWN").map((object) => object.stableId) ?? []),
  ]);
  const material = { owner: "QUERY_NAVIGATION" as const,
    currentTurn: { ref: input.sourceTurnRef, sourceDigest: logicalDigest(input.sourceText) },
    candidate, adoptedProject, ownerResults, sourceState, alreadyProvidedInformationRefs, closedBranchRefs, resolvedNeedRefs,
    projectionOnly: true as const, sourceOfTruth: false as const, projectWriteAuthorized: false as const };
  return { ...material, excludedReferences, contextDigest: queryNavigationDigest(material) };
};

export const currentNavigationEvidenceRef = (evidence: CurrentNavigationEvidence) => makeQueryNavigationId("current-navigation-evidence", { digest: evidence.contextDigest });

const currentStudyDesignDecisionSupport = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<import("./functional-reset-progression").FunctionalResetQueryNavigation>;
  ownerResultLedger?: Readonly<ProductOwnerResultLedger> | null;
}): Readonly<{
  authorizedContent: readonly GovernedRealizationContent[];
  requiredContentRefs: readonly string[];
  requiredVisibleObligations: readonly GovernedVisibleObligation[];
}> | null => {
  const selected = input.navigation.selection.selected;
  if (selected?.actionCategory !== "COMPARE_OPTIONS" || !input.ownerResultLedger) return null;
  const sourceRefs = input.navigation.selection.needs
    .filter((need) => selected.navigationNeedRefs.includes(need.needId))
    .map((need) => need.sourceRef);
  if (new Set(sourceRefs).size !== 1) return null;
  const sourceRef = sourceRefs[0];
  const ledger = rehydrateProductOwnerResultLedger(input.ownerResultLedger);
  const entry = ledger.entries.find((item) => item.result?.owner === "STUDY_DESIGN"
    && item.result.resultId === sourceRef);
  const result = entry?.result;
  const payload = result?.nativePayload as StudyDesignProposalContribution | null | undefined;
  if (!result || !payload || payload.contract !== "STUDY_DESIGN_PROPOSAL_CONTRIBUTION"
    || payload.validation.status !== "PASS" || payload.projectWriteAuthorized !== false
    || payload.candidateIsAdopted !== false || payload.sourceProject.projectId !== input.project.projectId
    || payload.sourceProject.projectVersion !== input.project.versionId
    || payload.sourceProject.projectDigest !== input.project.projectDigest
    || result.sourceProjectRef !== input.project.projectId || result.sourceProjectVersion !== input.project.versionId
    || result.sourceProjectDigest !== input.project.projectDigest
    || !selected.sourceRefs.includes(result.resultId) || !ownerResultNativeDigest(result)) return null;
  const options = payload.options.filter((option) => selected.knownOptionRefs.includes(option.optionId));
  if (options.length !== selected.knownOptionRefs.length || options.length < 2) return null;
  const optionContent = options.map((option): GovernedRealizationContent => ({
    ref: option.optionId,
    text: [
      `Option : ${option.label}.`, option.conciseDescription,
      `Justification : ${option.rationale.statement}.`,
      option.advantages.length ? `Avantages : ${option.advantages.join(" ; ")}.` : "",
      option.limitations.length ? `Limites : ${option.limitations.join(" ; ")}.` : "",
      option.prerequisites.length ? `Prérequis : ${option.prerequisites.join(" ; ")}.` : "",
      option.consequences.length ? `Conséquences : ${option.consequences.join(" ; ")}.` : "",
    ].filter(Boolean).join(" "),
    status: option.epistemicStatus,
  }));
  const tradeOff = payload.tradeOffs.find((item) => item.decisionRequired
    && item.optionRefs.length === options.length && item.optionRefs.every((ref) => selected.knownOptionRefs.includes(ref)));
  const tradeOffContent: GovernedRealizationContent[] = tradeOff ? [{
    ref: tradeOff.tradeOffId,
    text: "Le choix met en balance les avantages et les limites propres à chaque option.",
    status: payload.epistemicStatus,
  }] : [];
  // The first owner limitation is the primary interpretation boundary. Later
  // control summaries remain available in the OwnerResult but are not recited.
  const primaryLimitation: GovernedRealizationContent[] = payload.limitations[0] ? [{
    ref: `${payload.proposalId}:limitation:1`, text: payload.limitations[0], status: payload.epistemicStatus,
  }] : [];
  const authorizedContent = [...optionContent, ...tradeOffContent, ...primaryLimitation];
  const obligations: GovernedVisibleObligation[] = options.flatMap((option) => [
    { obligationId: `${option.optionId}:identity`, sourceRef: option.optionId, role: "OPTION_IDENTITY", exactText: option.label },
    { obligationId: `${option.optionId}:discriminant`, sourceRef: option.optionId, role: "OPTION_DISCRIMINANT", exactText: option.conciseDescription || option.rationale.statement },
    ...(option.limitations[0] ? [{ obligationId: `${option.optionId}:material-limit`, sourceRef: option.optionId,
      role: "MATERIAL_LIMIT" as const, exactText: option.limitations[0] }] : []),
  ]);
  if (payload.limitations[0]) obligations.push({
    obligationId: `${payload.proposalId}:global-material-limit`, sourceRef: `${payload.proposalId}:limitation:1`,
    role: "MATERIAL_LIMIT", exactText: payload.limitations[0],
  });
  if (tradeOffContent[0]) obligations.push({
    obligationId: `${tradeOffContent[0].ref}:decision-tradeoff`, sourceRef: tradeOffContent[0].ref,
    role: "DECISION_TRADEOFF", exactText: tradeOffContent[0].text,
  });
  obligations.push({
    obligationId: `${payload.proposalId}:human-decision-boundary`, sourceRef: result.resultId,
    role: "HUMAN_DECISION_BOUNDARY", exactText: "Aucune option n’est adoptée ; la décision vous revient.",
  });
  return Object.freeze({
    authorizedContent: Object.freeze(authorizedContent),
    requiredContentRefs: Object.freeze(options.map((item) => item.optionId)),
    requiredVisibleObligations: Object.freeze(obligations),
  });
};

/** Bounded HOW transport of an action already selected by QRY. */
export const currentGovernedNavigationInput = (input: {
  project: Readonly<ResearchProjectOwnerProjection>;
  navigation: Readonly<import("./functional-reset-progression").FunctionalResetQueryNavigation> | null;
  ownerResultLedger?: Readonly<ProductOwnerResultLedger> | null;
}): import("./current-turn-navigation").CurrentGovernedNavigationInput | undefined => {
  const navigation = input.navigation;
  const selected = navigation?.selection.selected;
  const action = navigation?.currentAction;
  if (!navigation || !selected || !action || navigation.projectRef !== input.project.projectId
    || navigation.projectVersion !== input.project.versionId || navigation.projectDigest !== input.project.projectDigest
    || action.actionCandidateRef !== selected.candidateId) return undefined;
  const snapshot = buildProjectContextSnapshot({ project: input.project });
  const scope = new Set([selected.targetRef, ...selected.sourceRefs, ...selected.affectedBranchRefs, ...selected.knownOptionRefs]);
  const decisionSupport = currentStudyDesignDecisionSupport({
    project: input.project, navigation, ownerResultLedger: input.ownerResultLedger,
  });
  const authorizedContent = decisionSupport?.authorizedContent ?? [
    { ref: selected.targetRef,
      text: currentQuestionTargetText(navigation.standardQuestion?.text ?? selected.explanation), status: null },
    ...snapshot.objects.filter((object) => scope.has(object.stableId) || scope.has(object.versionRef))
      .map((object) => ({ ref: object.stableId, text: object.content, status: object.epistemicState })),
  ];
  return {
    projectId: input.project.projectId, projectVersion: input.project.versionId, projectDigest: input.project.projectDigest,
    selectedActionRef: action.selectedActionId, sourceStateDigest: navigation.sourceStateDigest,
    selected: structuredClone(selected), authorizedContent,
    ...(decisionSupport ? {
      requiredContentRefs: decisionSupport.requiredContentRefs,
      requiredVisibleObligations: decisionSupport.requiredVisibleObligations,
    } : {}),
    informationNeedScopes: navigation.selection.needs
      .filter((need) => selected.navigationNeedRefs.includes(need.needId))
      .map((need) => ({ needRef: need.needId, sourceRef: need.sourceRef,
        affectedBranchRefs: [...need.affectedBranchRefs] })),
    alreadyProvidedInformationRefs: snapshot.objects.filter((object) => object.epistemicState === "KNOWN")
      .flatMap((object) => [object.stableId, object.versionRef]),
  };
};
