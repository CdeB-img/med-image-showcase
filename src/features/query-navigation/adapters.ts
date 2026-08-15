import { makeQueryNavigationId, queryNavigationDigest } from "./canonical";
import type {
  NavigationActionability,
  NavigationBlockingState,
  NavigationNeed,
  NavigationSourceType,
  QueryNavigationContext,
  QueryNavigationSourceState,
} from "./contracts";

const unique = (values: readonly string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

export type QueryNavigationContextInput = {
  projectRef: string;
  projectVersion: string;
  sourceState: QueryNavigationSourceState;
  closedBranchRefs?: string[];
  resolvedNeedRefs?: string[];
  currentUsageRef: string;
  sufficiencyEvidenceRefs?: string[];
  limitations?: string[];
};

export const buildQueryNavigationContext = (input: QueryNavigationContextInput): QueryNavigationContext => {
  const sourceStateDigest = queryNavigationDigest(input.sourceState);
  const identity = {
    projectRef: input.projectRef,
    projectVersion: input.projectVersion,
    sourceStateDigest,
    currentUsageRef: input.currentUsageRef,
  };
  const context: QueryNavigationContext = {
    contractVersion: "1.0.0",
    contextId: makeQueryNavigationId("qry-context", identity),
    contextDigest: "",
    projectRef: input.projectRef,
    projectVersion: input.projectVersion,
    sourceStateDigest,
    sourceState: structuredClone(input.sourceState),
    closedBranchRefs: unique(input.closedBranchRefs ?? []),
    resolvedNeedRefs: unique(input.resolvedNeedRefs ?? []),
    currentUsageRef: input.currentUsageRef,
    sufficiencyEvidenceRefs: unique(input.sufficiencyEvidenceRefs ?? []),
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
    reconstructible: true,
    limitations: unique(input.limitations ?? []),
  };
  context.contextDigest = queryNavigationDigest({ ...context, contextDigest: "" });
  return context;
};

type NeedInput = {
  sourceRef: string;
  sourceType: NavigationSourceType;
  sourceVersion: string;
  sourceObjectKind: string;
  owner: string;
  intent: string;
  decisionRefs: string[];
  branchRefs: string[];
  blocking: NavigationBlockingState;
  actionability: NavigationActionability;
  knownOptions?: string[];
  availableFromOwner?: string | null;
  limitations?: string[];
};

const toNeed = (input: NeedInput): NavigationNeed => ({
  needId: makeQueryNavigationId("qry-need", {
    sourceRef: input.sourceRef,
    sourceType: input.sourceType,
    sourceVersion: input.sourceVersion,
    decisionRefs: unique(input.decisionRefs),
    branchRefs: unique(input.branchRefs),
  }),
  sourceRef: input.sourceRef,
  sourceType: input.sourceType,
  sourceVersion: input.sourceVersion,
  sourceObjectKind: input.sourceObjectKind,
  owner: input.owner,
  informationIntent: input.intent,
  affectedDecisionRefs: unique(input.decisionRefs),
  affectedBranchRefs: unique(input.branchRefs),
  blocking: input.blocking,
  actionability: input.actionability,
  status: input.actionability === "DEFERRED" ? "DEFERRED" : "OPEN",
  availableFromOwner: input.availableFromOwner ?? null,
  knownOptions: unique(input.knownOptions ?? []),
  provenance: { sourceRefs: [input.sourceRef], owner: input.owner, evidence: [input.intent], limitations: unique(input.limitations ?? []) },
  limitations: unique(input.limitations ?? []),
  projectionOnly: true,
  sourceOfTruth: false,
  projectWriteAuthorized: false,
});

const planningBlocking = (value: string): NavigationBlockingState => value.startsWith("BLOCKING_FOR_") ? "BLOCKS_CURRENT_BRANCH" : "NON_BLOCKING";

export const collectNavigationNeeds = (context: QueryNavigationContext): NavigationNeed[] => {
  const state = context.sourceState;
  const needs: NavigationNeed[] = [];
  const add = (input: NeedInput) => needs.push(toNeed(input));

  state.projectUnknowns.forEach((item) => add({ ...item, sourceRef: item.ref, sourceType: "PROJECT_UNKNOWN", sourceVersion: item.version, sourceObjectKind: "ProjectUnknown", intent: item.intent, blocking: "BLOCKS_CURRENT_BRANCH", actionability: "USER_ANSWERABLE" }));
  state.projectAmbiguities.forEach((item) => add({ ...item, sourceRef: item.ref, sourceType: "PROJECT_AMBIGUITY", sourceVersion: item.version, sourceObjectKind: "ProjectAmbiguity", intent: item.intent, blocking: "BLOCKS_CURRENT_BRANCH", actionability: "USER_ANSWERABLE" }));
  state.projectContradictions.forEach((item) => add({ ...item, sourceRef: item.ref, sourceType: "PROJECT_CONTRADICTION", sourceVersion: item.version, sourceObjectKind: "ProjectContradiction", intent: item.intent, blocking: "BLOCKS_IRREVERSIBLE_DECISION", actionability: "HUMAN_EXPERT_REVIEW" }));
  state.dataNeeds.filter((item) => item.openInformationIntent).forEach((item) => add({ sourceRef: item.dataNeedId, sourceType: "DATA_NEED_STATE", sourceVersion: item.version, sourceObjectKind: "DataNeed", owner: item.owner, intent: item.openInformationIntent!, decisionRefs: item.decisionRefs, branchRefs: item.branchRefs, blocking: "NON_BLOCKING", actionability: "DOMAIN_OWNER_ACTION", limitations: ["DATA_NEED_IDENTITY_AND_OWNERSHIP_PRESERVED"] }));
  state.planningDecisionRequirements.forEach((item) => add({ sourceRef: item.ref, sourceType: `${item.domain}_DECISION_REQUIREMENT` as NavigationSourceType, sourceVersion: item.version, sourceObjectKind: "PlanningDecisionRequirement", owner: item.owner, intent: item.intent, decisionRefs: item.decisionRefs, branchRefs: item.branchRefs, blocking: planningBlocking(item.blockingLevel), actionability: item.knownOptions.length > 1 ? "HUMAN_EXPERT_REVIEW" : "DOMAIN_OWNER_ACTION", knownOptions: item.knownOptions }));
  state.validationFindings.forEach((item) => add({ sourceRef: item.ref, sourceType: "VALIDATION_FINDING", sourceVersion: item.version, sourceObjectKind: "ValidationProductFinding", owner: item.owner, intent: item.reason, decisionRefs: item.decisionRefs, branchRefs: item.branchRefs, blocking: item.blocking ? "BLOCKS_CURRENT_BRANCH" : "NON_BLOCKING", actionability: "DOMAIN_OWNER_ACTION" }));
  state.validationHumanReviews.forEach((item) => add({ sourceRef: item.ref, sourceType: "VALIDATION_HUMAN_REVIEW_REQUEST", sourceVersion: item.version, sourceObjectKind: "ValidationHumanReviewRequest", owner: item.owner, intent: item.reason, decisionRefs: item.decisionRefs, branchRefs: item.branchRefs, blocking: item.blocking ? "BLOCKS_CURRENT_BRANCH" : "NON_BLOCKING", actionability: "HUMAN_EXPERT_REVIEW" }));
  state.validationSemanticReviews.forEach((item) => add({ sourceRef: item.ref, sourceType: "VALIDATION_SEMANTIC_REVIEW_REQUEST", sourceVersion: item.version, sourceObjectKind: "SemanticValidationReviewRequest", owner: item.owner, intent: item.reason, decisionRefs: item.decisionRefs, branchRefs: item.branchRefs, blocking: item.blocking ? "BLOCKS_CURRENT_BRANCH" : "NON_BLOCKING", actionability: "DEFERRED", limitations: ["SEMANTIC_REVIEW_PROVIDER_DISABLED_NOT_RESOLVED_BY_QRY"] }));
  state.validationGates.filter((item) => item.status !== "ALLOWED" && item.status !== "ALLOWED_WITH_LIMITATIONS").forEach((item) => add({ sourceRef: item.gateId, sourceType: "VALIDATION_GATE", sourceVersion: "runtime", sourceObjectKind: "ValidationProductGateEvaluation", owner: item.owner, intent: item.reason, decisionRefs: [], branchRefs: item.affectedBranchRefs, blocking: item.status === "BLOCKED" ? "BLOCKS_CURRENT_BRANCH" : "NON_BLOCKING", actionability: item.status === "NOT_EVALUABLE" ? "SYSTEM_ACTION" : item.status === "REVIEW_REQUIRED" ? "HUMAN_EXPERT_REVIEW" : "DOMAIN_OWNER_ACTION", limitations: item.status === "NOT_EVALUABLE" ? ["SYSTEM_VALIDATION_PREREQUISITE_NOT_A_SCIENTIFIC_QUESTION"] : [] }));
  state.readiness.filter((item) => item.status !== "READY" && item.status !== "NOT_APPLICABLE").forEach((item) => add({ sourceRef: item.sourceRef, sourceType: "DOMAIN_READINESS", sourceVersion: item.sourceVersion, sourceObjectKind: "DomainReadiness", owner: item.owner, intent: item.reason, decisionRefs: item.decisionRefs, branchRefs: item.affectedBranchRefs, blocking: item.status === "BLOCKER" ? "BLOCKS_CURRENT_BRANCH" : "NON_BLOCKING", actionability: item.status === "DEFERRED_TO_REALIZED_TIME" ? "DEFERRED" : item.status === "DECISION_REQUIRED" ? "HUMAN_EXPERT_REVIEW" : "DOMAIN_OWNER_ACTION" }));
  state.documentGenerability.filter((item) => !["GENERATABLE", "PARTIALLY_GENERATABLE", "NOT_APPLICABLE"].includes(item.status)).forEach((item) => add({ sourceRef: item.projectionRef, sourceType: "DOCUMENT_GENERABILITY", sourceVersion: item.sourceVersion, sourceObjectKind: "DocumentProjection", owner: item.owner, intent: item.reason, decisionRefs: [], branchRefs: item.affectedBranchRefs, blocking: item.status === "BLOCKED" ? "ABSOLUTE_REFUSAL" : "BLOCKS_CURRENT_BRANCH", actionability: item.status === "FUTURE" ? "DEFERRED" : "SYSTEM_ACTION", limitations: item.resumeCondition ? [`RESUME:${item.resumeCondition}`] : [] }));
  state.knowledgeGaps.forEach((item) => add({ sourceRef: item.ref, sourceType: "KNOWLEDGE_GAP", sourceVersion: item.version, sourceObjectKind: item.evidenceGap ? "EvidenceGap" : "KnowledgeGap", owner: item.owner, intent: item.intent, decisionRefs: item.decisionRefs, branchRefs: item.branchRefs, blocking: "NON_BLOCKING", actionability: "EXTERNAL_EVIDENCE_ACTION" }));

  return needs
    .filter((need) => !context.resolvedNeedRefs.includes(need.needId) && !need.affectedBranchRefs.some((ref) => context.closedBranchRefs.includes(ref)))
    .sort((left, right) => left.needId.localeCompare(right.needId));
};

export const assertDataNeedInformationNeedSeparation = (need: NavigationNeed) =>
  need.sourceType !== "DATA_NEED_STATE" || (need.needId !== need.sourceRef && need.sourceObjectKind === "DataNeed" && need.provenance.sourceRefs.includes(need.sourceRef));
