import { QRY001_CONTRACT_VERSION, type NavigationSelectionTrace, type NextActionCandidate, type QueryNavigationContext } from "./contracts";

const SEMANTIC_ARRAY_KEYS = new Set([
  "affectedBranchRefs",
  "affectedDecisionRefs",
  "candidateRefs",
  "branchRefs",
  "closedBranchRefs",
  "eligibleCandidateRefs",
  "evidence",
  "findingRefs",
  "gateRefs",
  "knownOptions",
  "decisionRefs",
  "limitations",
  "navigationNeedRefs",
  "nonDominatedCandidateRefs",
  "pd009RuleRefs",
  "resolvedNeedRefs",
  "reviewRequestRefs",
  "runRefs",
  "sourceRefs",
  "sufficiencyEvidenceRefs",
]);

const canonicalize = (value: unknown, key = ""): unknown => {
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return SEMANTIC_ARRAY_KEYS.has(key)
      ? items.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
      : items;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([entryKey, item]) => [entryKey, canonicalize(item, entryKey)]));
  }
  return value;
};

export const canonicalizeQueryNavigation = (value: unknown) => JSON.stringify(canonicalize(value));

export const queryNavigationDigest = (value: unknown) => {
  const input = canonicalizeQueryNavigation(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return `qry1-${first.toString(16).padStart(8, "0")}${second.toString(16).padStart(8, "0")}`;
};

export const canonicalizeNavigationContext = (context: QueryNavigationContext) => canonicalizeQueryNavigation({ ...context, contextDigest: "" });
export const canonicalizeNextActionCandidate = (candidate: NextActionCandidate) => canonicalizeQueryNavigation(candidate);
export const canonicalizeNavigationSelectionTrace = (trace: NavigationSelectionTrace) => canonicalizeQueryNavigation({ ...trace, digest: "" });

export const makeQueryNavigationId = (kind: string, value: unknown) => `${kind}-${queryNavigationDigest({ contractVersion: QRY001_CONTRACT_VERSION, value }).slice(5)}`;
