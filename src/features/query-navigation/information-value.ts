import type { InformationValueVector, NavigationBlockingState, NavigationDependency, NavigationImpact, NavigationNeed, NextActionCandidate, Pd009ActionCategory, QueryNavigationContext } from "./contracts";
import { PD009_ACTION_LABELS } from "./contracts";
import { makeQueryNavigationId } from "./canonical";

const unique = (values: readonly string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const pd009RuleFor = (action: Pd009ActionCategory) => ({
  CLARIFY_BY_ADAPTIVE_EXCHANGE: "PD-009:6.1",
  BUILD_OR_REVISE_OBJECT: "PD-009:6.2",
  COMPARE_OPTIONS: "PD-009:6.3",
  TRIGGER_METHODOLOGICAL_REVIEW: "PD-009:6.4",
  REQUEST_HUMAN_DECISION: "PD-009:6.5",
  PRODUCE_PROVISIONAL_PROJECTION: "PD-009:6.6",
  SUSPEND_OR_STOP: "PD-009:6.7",
  REFUSE_PROTOCOL_PROJECTION: "PD-009:6.8",
}[action]);

const actionForNeed = (need: NavigationNeed): Pd009ActionCategory => {
  if (need.sourceType === "DOCUMENT_GENERABILITY" && need.blocking === "ABSOLUTE_REFUSAL") return "REFUSE_PROTOCOL_PROJECTION";
  if (need.actionability === "USER_ANSWERABLE") return "CLARIFY_BY_ADAPTIVE_EXCHANGE";
  if (need.actionability === "HUMAN_EXPERT_REVIEW") return need.knownOptions.length > 1 ? "COMPARE_OPTIONS" : "REQUEST_HUMAN_DECISION";
  if (need.actionability === "SYSTEM_ACTION") return "TRIGGER_METHODOLOGICAL_REVIEW";
  if (need.actionability === "DEFERRED" || need.actionability === "NOT_ACTIONABLE_NOW") return "SUSPEND_OR_STOP";
  if (need.sourceType === "DOCUMENT_GENERABILITY") return "PRODUCE_PROVISIONAL_PROJECTION";
  return "BUILD_OR_REVISE_OBJECT";
};

const informationValueFor = (need: NavigationNeed): InformationValueVector => ({
  blocking: need.blocking,
  discrimination: need.knownOptions.length > 1 ? "SEPARATES_ACTIVE_OPTIONS" : need.affectedDecisionRefs.length ? "MAY_CHANGE_DECISION" : "UNKNOWN",
  impactScope: need.affectedBranchRefs.length > 1 ? "CROSS_BRANCH" : need.affectedDecisionRefs.length > 1 ? "MULTIPLE_CRITICAL_OBJECTS" : need.affectedBranchRefs.length === 1 ? "SINGLE_BRANCH" : "LOCAL",
  reducibility: need.actionability === "USER_ANSWERABLE" ? "AVAILABLE_NOW" : ["HUMAN_EXPERT_REVIEW", "DOMAIN_OWNER_ACTION", "SYSTEM_ACTION"].includes(need.actionability) ? "AVAILABLE_WITH_OWNER" : need.actionability === "DEFERRED" ? "NOT_ACTIONABLE_NOW" : "UNKNOWN",
  irreversibility: need.blocking === "BLOCKS_IRREVERSIBLE_DECISION" || need.blocking === "ABSOLUTE_REFUSAL" ? "HIGH" : need.affectedDecisionRefs.length ? "MEDIUM" : "UNKNOWN",
  temporalUrgency: "UNKNOWN",
  burden: need.actionability === "USER_ANSWERABLE" ? "LOW" : need.actionability === "HUMAN_EXPERT_REVIEW" ? "MODERATE" : "UNKNOWN",
  sensitivityRisk: "UNKNOWN",
  pedagogicalValue: need.actionability === "USER_ANSWERABLE" ? "USEFUL" : need.actionability === "HUMAN_EXPERT_REVIEW" ? "DECISION_EXPLANATION_REQUIRED" : "UNKNOWN",
});

export const collectNavigationDependencies = (context: QueryNavigationContext, need: NavigationNeed): NavigationDependency[] => context.sourceState.dependencies
  .filter((dependency) => dependency.dependentRef === need.sourceRef || dependency.dependentRef === need.needId)
  .map((dependency) => structuredClone(dependency));

export const evaluateDownstreamImpact = (candidateRef: string, need: NavigationNeed): NavigationImpact => ({
  impactId: makeQueryNavigationId("qry-impact", { candidateRef, kind: "DOWNSTREAM", branches: need.affectedBranchRefs, decisions: need.affectedDecisionRefs }),
  candidateRef,
  branchRefs: [...need.affectedBranchRefs],
  decisionRefs: [...need.affectedDecisionRefs],
  gateRefs: need.sourceType === "VALIDATION_GATE" ? [need.sourceRef] : [],
  consequence: need.blocking === "NON_BLOCKING" ? "LOCAL_NAVIGATION_MAY_ADVANCE" : "AFFECTED_BRANCH_REMAINS_BLOCKED",
  kind: "DOWNSTREAM",
});

export const evaluateDeferImpact = (candidateRef: string, need: NavigationNeed): NavigationImpact => ({
  impactId: makeQueryNavigationId("qry-impact", { candidateRef, kind: "DEFER", branches: need.affectedBranchRefs, decisions: need.affectedDecisionRefs }),
  candidateRef,
  branchRefs: [...need.affectedBranchRefs],
  decisionRefs: [...need.affectedDecisionRefs],
  gateRefs: [],
  consequence: need.blocking === "NON_BLOCKING" ? "OTHER_NON_DEPENDENT_BRANCHES_MAY_ADVANCE" : "AFFECTED_BRANCH_CANNOT_ADVANCE_UNTIL_RESUME_TRIGGER",
  kind: "DEFER",
});

export const evaluateActionEligibility = (need: NavigationNeed, context: QueryNavigationContext): Pick<NextActionCandidate, "eligibility" | "eligibilityReasons"> => {
  if (need.status === "NOT_APPLICABLE") return { eligibility: "NOT_APPLICABLE", eligibilityReasons: ["SOURCE_NOT_APPLICABLE"] };
  if (need.affectedBranchRefs.some((ref) => context.closedBranchRefs.includes(ref))) return { eligibility: "INELIGIBLE", eligibilityReasons: ["AFFECTED_BRANCH_CLOSED"] };
  if (need.actionability === "DEFERRED" || need.status === "DEFERRED") return { eligibility: "DEFERRED", eligibilityReasons: ["WAITING_FOR_EXPLICIT_RESUME_TRIGGER"] };
  if (need.status === "RESOLVED") return { eligibility: "INELIGIBLE", eligibilityReasons: ["NEED_ALREADY_RESOLVED_BY_OWNER"] };
  if (need.actionability === "USER_ANSWERABLE" && !need.affectedDecisionRefs.length && !need.affectedBranchRefs.length) return { eligibility: "INELIGIBLE", eligibilityReasons: ["ABSTRACT_COMPLETENESS_WITHOUT_DECISION_EFFECT"] };
  return { eligibility: "ELIGIBLE", eligibilityReasons: ["OPEN_SOURCED_NEED_WITH_LEGITIMATE_OWNER"] };
};

export const evaluateInformationValue = (need: NavigationNeed): InformationValueVector => informationValueFor(need);

export const buildNextActionCandidates = (context: QueryNavigationContext, needs: readonly NavigationNeed[]): NextActionCandidate[] => needs.map((need): NextActionCandidate => {
  const actionCategory = actionForNeed(need);
  const candidateIdentity = { actionCategory, targetRef: need.sourceRef, needRef: need.needId, decisionRefs: need.affectedDecisionRefs, branchRefs: need.affectedBranchRefs, sourceVersion: need.sourceVersion };
  const candidateId = makeQueryNavigationId("qry-action", candidateIdentity);
  const eligibility = evaluateActionEligibility(need, context);
  return {
    candidateId,
    actionCategory,
    actionLabel: PD009_ACTION_LABELS[actionCategory],
    pd009RuleRefs: [pd009RuleFor(actionCategory)],
    targetRef: need.sourceRef,
    owner: need.owner,
    sourceRefs: [need.sourceRef],
    navigationNeedRefs: [need.needId],
    affectedDecisionRefs: [...need.affectedDecisionRefs],
    affectedBranchRefs: [...need.affectedBranchRefs],
    informationValue: informationValueFor(need),
    eligibility: eligibility.eligibility,
    eligibilityReasons: eligibility.eligibilityReasons,
    dependencies: collectNavigationDependencies(context, need),
    impacts: [evaluateDownstreamImpact(candidateId, need), evaluateDeferImpact(candidateId, need)],
    deferConsequence: need.blocking === "NON_BLOCKING" ? "OTHER_NON_DEPENDENT_BRANCHES_MAY_ADVANCE" : "AFFECTED_BRANCH_REMAINS_BLOCKED",
    explanation: need.informationIntent,
    capabilityRef: need.actionability === "USER_ANSWERABLE" ? "ADAPTIVE_EXCHANGE" : need.actionability === "SYSTEM_ACTION" ? "VALIDATION_RUNTIME" : need.owner,
    provenance: structuredClone(need.provenance),
    projectionOnly: true,
    sourceOfTruth: false,
    projectWriteAuthorized: false,
  };
}).sort((left, right) => left.candidateId.localeCompare(right.candidateId));

type DimensionOrder = Record<string, number>;
const preference: Record<keyof InformationValueVector, DimensionOrder> = {
  blocking: { ABSOLUTE_REFUSAL: 5, BLOCKS_IRREVERSIBLE_DECISION: 4, BLOCKS_CURRENT_BRANCH: 3, NON_BLOCKING: 2, UNKNOWN: 1 },
  discrimination: { SEPARATES_ACTIVE_OPTIONS: 4, MAY_CHANGE_DECISION: 3, NO_DECISION_EFFECT: 2, UNKNOWN: 1 },
  impactScope: { CROSS_BRANCH: 5, MULTIPLE_CRITICAL_OBJECTS: 4, SINGLE_BRANCH: 3, LOCAL: 2, UNKNOWN: 1 },
  reducibility: { AVAILABLE_NOW: 4, AVAILABLE_WITH_OWNER: 3, NOT_ACTIONABLE_NOW: 2, UNKNOWN: 1 },
  irreversibility: { HIGH: 5, MEDIUM: 4, LOW: 3, UNKNOWN: 2, NOT_AVAILABLE: 1 },
  temporalUrgency: { TIME_CRITICAL: 5, TIME_BOUND: 4, NOT_TIME_BOUND: 3, UNKNOWN: 2, NOT_AVAILABLE: 1 },
  burden: { LOW: 5, MODERATE: 4, HIGH: 3, UNKNOWN: 2, NOT_AVAILABLE: 1 },
  sensitivityRisk: { LOW: 5, MODERATE: 4, HIGH: 3, CRITICAL: 2, UNKNOWN: 1, NOT_AVAILABLE: 1 },
  pedagogicalValue: { DECISION_EXPLANATION_REQUIRED: 4, USEFUL: 3, LIMITED: 2, UNKNOWN: 1, NOT_AVAILABLE: 1 },
};

export const INFORMATION_VALUE_LEXICOGRAPHIC_ORDER: Array<keyof InformationValueVector> = [
  "blocking",
  "discrimination",
  "impactScope",
  "reducibility",
  "irreversibility",
  "temporalUrgency",
  "burden",
  "sensitivityRisk",
  "pedagogicalValue",
];

export type CandidateComparison = "LEFT_PREFERRED" | "RIGHT_PREFERRED" | "EQUAL" | "TRADE_OFF";

export const compareInformationValueLexicographically = (left: InformationValueVector, right: InformationValueVector): CandidateComparison => {
  for (const dimension of INFORMATION_VALUE_LEXICOGRAPHIC_ORDER) {
    const leftRank = preference[dimension][left[dimension]] ?? 0;
    const rightRank = preference[dimension][right[dimension]] ?? 0;
    if (leftRank !== rightRank) return leftRank > rightRank ? "LEFT_PREFERRED" : "RIGHT_PREFERRED";
  }
  return "EQUAL";
};

export const compareActionCandidates = (left: NextActionCandidate, right: NextActionCandidate): CandidateComparison => {
  const leftOpenPrerequisites = left.dependencies.filter((item) => item.status !== "SATISFIED").map((item) => item.prerequisiteRef);
  const rightOpenPrerequisites = right.dependencies.filter((item) => item.status !== "SATISFIED").map((item) => item.prerequisiteRef);
  if (leftOpenPrerequisites.includes(right.targetRef)) return "RIGHT_PREFERRED";
  if (rightOpenPrerequisites.includes(left.targetRef)) return "LEFT_PREFERRED";
  const lexical = compareInformationValueLexicographically(left.informationValue, right.informationValue);
  if (lexical !== "EQUAL") return lexical;
  if (left.actionCategory !== right.actionCategory || left.owner !== right.owner) return "TRADE_OFF";
  return "EQUAL";
};

export const computeNonDominatedActionSet = (candidates: readonly NextActionCandidate[]) => {
  const eligible = candidates.filter((candidate) => candidate.eligibility === "ELIGIBLE");
  const dominanceEdges: Array<{ dominantRef: string; dominatedRef: string; reason: string }> = [];
  const dominated = new Set<string>();
  for (let leftIndex = 0; leftIndex < eligible.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < eligible.length; rightIndex += 1) {
      const left = eligible[leftIndex];
      const right = eligible[rightIndex];
      const comparison = compareActionCandidates(left, right);
      if (comparison === "LEFT_PREFERRED") {
        dominated.add(right.candidateId);
        dominanceEdges.push({ dominantRef: left.candidateId, dominatedRef: right.candidateId, reason: "PD009_LEXICOGRAPHIC_ORDER_THEN_DOMINANCE" });
      } else if (comparison === "RIGHT_PREFERRED") {
        dominated.add(left.candidateId);
        dominanceEdges.push({ dominantRef: right.candidateId, dominatedRef: left.candidateId, reason: "PD009_LEXICOGRAPHIC_ORDER_THEN_DOMINANCE" });
      }
    }
  }
  return { nonDominated: eligible.filter((candidate) => !dominated.has(candidate.candidateId)), dominanceEdges };
};

export const isBlocking = (state: NavigationBlockingState) => !["NON_BLOCKING", "UNKNOWN"].includes(state);
