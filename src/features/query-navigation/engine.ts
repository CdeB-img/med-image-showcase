import { makeQueryNavigationId, queryNavigationDigest } from "./canonical";
import { buildNextActionCandidates, collectNavigationDependencies, computeNonDominatedActionSet } from "./information-value";
import { collectNavigationNeeds } from "./adapters";
import type { NavigationSelection, NavigationSelectionTrace, NextActionCandidate, QueryNavigationContext } from "./contracts";

const unique = (values: readonly string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const classifyOutcome = (context: QueryNavigationContext, candidates: readonly NextActionCandidate[], nonDominated: readonly NextActionCandidate[]): NavigationSelectionTrace["outcome"] => {
  if (nonDominated.some((candidate) => candidate.actionCategory === "REFUSE_PROTOCOL_PROJECTION")) return "REFUSED";
  if (nonDominated.length === 1) return "UNIQUE_ACTION_SELECTED";
  if (nonDominated.length > 1 && nonDominated.every((candidate) => candidate.actionCategory === "COMPARE_OPTIONS" || candidate.actionCategory === "REQUEST_HUMAN_DECISION")) return "HUMAN_CHOICE_REQUIRED";
  if (nonDominated.length > 1) return "MULTIPLE_NON_DOMINATED_ACTIONS";
  if (candidates.some((candidate) => candidate.eligibility === "DEFERRED")) return "DEFERRED";
  if (candidates.some((candidate) => candidate.informationValue.blocking !== "NON_BLOCKING" && candidate.informationValue.blocking !== "UNKNOWN")) return "BLOCKED";
  if (context.sufficiencyEvidenceRefs.length) return "SUFFICIENT_FOR_CURRENT_STEP";
  return "NO_ACTIONABLE_CANDIDATE";
};

export const selectNextAction = (context: QueryNavigationContext, candidates?: readonly NextActionCandidate[]): NavigationSelection => {
  const needs = collectNavigationNeeds(context);
  const allCandidates = candidates ? candidates.map((item) => structuredClone(item)) : buildNextActionCandidates(context, needs);
  const { nonDominated, dominanceEdges } = computeNonDominatedActionSet(allCandidates);
  const outcome = classifyOutcome(context, allCandidates, nonDominated);
  const selected = outcome === "UNIQUE_ACTION_SELECTED" || outcome === "REFUSED" ? nonDominated[0] ?? null : null;
  const traceIdentity = { contextRef: context.contextId, sourceStateDigest: context.sourceStateDigest, candidates: allCandidates.map((item) => item.candidateId), outcome };
  const trace: NavigationSelectionTrace = {
    traceId: makeQueryNavigationId("qry-trace", traceIdentity),
    contextRef: context.contextId,
    sourceStateDigest: context.sourceStateDigest,
    policyVersion: "PD-009-1.0",
    candidateRefs: unique(allCandidates.map((candidate) => candidate.candidateId)),
    eligibleCandidateRefs: unique(allCandidates.filter((candidate) => candidate.eligibility === "ELIGIBLE").map((candidate) => candidate.candidateId)),
    comparisonOrder: ["blocking", "discrimination", "impactScope", "reducibility", "irreversibility", "temporalUrgency", "burden", "sensitivityRisk", "pedagogicalValue", "dominance"],
    dominanceEdges,
    nonDominatedCandidateRefs: unique(nonDominated.map((candidate) => candidate.candidateId)),
    selectedCandidateRef: selected?.candidateId ?? null,
    outcome,
    explanations: outcome === "HUMAN_CHOICE_REQUIRED" ? ["PD009_NON_DOMINATED_TRADE_OFF_REQUIRES_HUMAN_DECISION"] : outcome === "NO_ACTIONABLE_CANDIDATE" ? ["NO_USEFUL_ACTION_IS_NOT_PROJECT_COMPLETE"] : ["PD009_QUALITATIVE_VECTOR_AND_DOMINANCE_APPLIED"],
    arbitraryScoreUsed: false,
    arbitraryTieBreakUsed: false,
    projectWriteAuthorized: false,
    digest: "",
  };
  trace.digest = queryNavigationDigest({ ...trace, digest: "" });
  return { context: structuredClone(context), needs, candidates: allCandidates, selected, nonDominated, trace };
};

export const replayNavigationSelection = (selection: NavigationSelection) => {
  const replay = selectNextAction(selection.context, selection.candidates);
  return {
    selection: replay,
    identical: replay.trace.digest === selection.trace.digest,
    comparedDigest: selection.trace.digest,
    replayDigest: replay.trace.digest,
  };
};

export const explainNavigationSelection = (selection: NavigationSelection) => ({
  action: selection.selected?.actionLabel ?? null,
  target: selection.selected?.targetRef ?? null,
  whyNow: selection.selected?.explanation ?? selection.trace.explanations.join(" "),
  comparisonOrder: [...selection.trace.comparisonOrder],
  alternatives: selection.nonDominated.map((candidate) => ({ candidateRef: candidate.candidateId, action: candidate.actionLabel, owner: candidate.owner })),
  dependencies: selection.selected ? collectNavigationDependencies(selection.context, selection.needs.find((need) => need.needId === selection.selected?.navigationNeedRefs[0])!) : [],
  opaqueScore: null,
});
