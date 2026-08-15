import { PD009_ACTION_CATEGORIES, PD009_ACTION_LABELS, type NavigationNeed, type NavigationSelection, type NextActionCandidate, type QueryNavigationContext, type QueryNavigationValidationIssue, type QueryNavigationValidationResult } from "./contracts";
import { assertDataNeedInformationNeedSeparation } from "./adapters";
import { queryNavigationDigest } from "./canonical";

const validateCommon = (projection: { projectionOnly: boolean; sourceOfTruth: boolean; projectWriteAuthorized: boolean }, path: string): QueryNavigationValidationIssue[] => {
  const issues: QueryNavigationValidationIssue[] = [];
  if (projection.projectionOnly !== true) issues.push({ code: "QRY_PROJECTION_REQUIRED", message: "QRY artefacts are derived projections.", path, blocking: true });
  if (projection.sourceOfTruth !== false) issues.push({ code: "QRY_SOURCE_OF_TRUTH_FORBIDDEN", message: "QRY never owns Project truth.", path, blocking: true });
  if (projection.projectWriteAuthorized !== false) issues.push({ code: "QRY_PROJECT_WRITE_FORBIDDEN", message: "QRY cannot write the Project.", path, blocking: true });
  return issues;
};

export const validateQueryNavigationContext = (context: QueryNavigationContext): QueryNavigationValidationResult => {
  const issues = validateCommon(context, "context");
  if (context.contextDigest !== queryNavigationDigest({ ...context, contextDigest: "" })) issues.push({ code: "QRY_CONTEXT_DIGEST_MISMATCH", message: "Context digest is not reconstructible.", path: "context.contextDigest", blocking: true });
  return { valid: !issues.some((issue) => issue.blocking), issues };
};

export const validateNavigationNeed = (need: NavigationNeed): QueryNavigationValidationResult => {
  const issues = validateCommon(need, "need");
  if (!need.sourceRef || !need.sourceVersion || !need.owner) issues.push({ code: "QRY_NEED_SOURCE_REQUIRED", message: "Need source, version and owner are required.", path: "need.sourceRef", blocking: true });
  if (!assertDataNeedInformationNeedSeparation(need)) issues.push({ code: "QRY_DATA_NEED_CONFLATION", message: "DataNeed and PD-009 information need must remain distinct.", path: "need.needId", blocking: true });
  return { valid: !issues.some((issue) => issue.blocking), issues };
};

export const validateNextActionCandidate = (candidate: NextActionCandidate): QueryNavigationValidationResult => {
  const issues = validateCommon(candidate, "candidate");
  if (!PD009_ACTION_CATEGORIES.includes(candidate.actionCategory)) issues.push({ code: "QRY_PD009_ACTION_REQUIRED", message: "Exactly one PD-009 action category is required.", path: "candidate.actionCategory", blocking: true });
  if (candidate.actionLabel !== PD009_ACTION_LABELS[candidate.actionCategory]) issues.push({ code: "QRY_PD009_LABEL_MISMATCH", message: "Technical action code must map to the normative PD-009 category.", path: "candidate.actionLabel", blocking: true });
  if (Object.keys(candidate.informationValue).length !== 9) issues.push({ code: "QRY_INFORMATION_VECTOR_DIMENSIONS", message: "The qualitative vector must contain nine dimensions.", path: "candidate.informationValue", blocking: true });
  return { valid: !issues.some((issue) => issue.blocking), issues };
};

export const validateNavigationSelection = (selection: NavigationSelection): QueryNavigationValidationResult => {
  const issues = [
    ...validateQueryNavigationContext(selection.context).issues,
    ...selection.needs.flatMap((need) => validateNavigationNeed(need).issues),
    ...selection.candidates.flatMap((candidate) => validateNextActionCandidate(candidate).issues),
  ];
  if (selection.trace.arbitraryScoreUsed || selection.trace.arbitraryTieBreakUsed) issues.push({ code: "QRY_ARBITRARY_RANKING_FORBIDDEN", message: "Scores and arbitrary tie-breaks are forbidden.", path: "selection.trace", blocking: true });
  if (selection.trace.digest !== queryNavigationDigest({ ...selection.trace, digest: "" })) issues.push({ code: "QRY_TRACE_DIGEST_MISMATCH", message: "Trace digest is not reconstructible.", path: "selection.trace.digest", blocking: true });
  if (selection.selected && !selection.trace.nonDominatedCandidateRefs.includes(selection.selected.candidateId)) issues.push({ code: "QRY_SELECTED_DOMINATED", message: "A dominated candidate cannot be selected.", path: "selection.selected", blocking: true });
  return { valid: !issues.some((issue) => issue.blocking), issues };
};
