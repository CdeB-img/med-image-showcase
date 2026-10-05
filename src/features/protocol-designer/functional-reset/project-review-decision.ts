import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { ownerResultNativeDigest } from "@/features/protocol-designer/product-owner-result-ledger";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { retainValidatedContributionCandidate } from "./contribution-lifecycle";
import { type FunctionalResetSession } from "./session";

// Application retention delegates validation and lifecycle to their existing owners.
export const retainOwnerReviewedCandidate = (
  current: FunctionalResetSession,
  contribution: ScientificInterpretationContributionEnvelope,
  candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>,
  userTurn: ScientificInterpretationTurn,
  traceRunId: string | null,
) => retainValidatedContributionCandidate({
  retained: current.retainedContributionCandidates ?? [],
  contribution,
  candidate,
  // This records PRJ's existing canonical/change-set and review-coverage gate;
  // it does not pretend that a provider extraction validated an owner proposal.
  validation: { valid: candidate.status === "CANDIDATE_PENDING_HUMAN_CONFIRMATION", blocks: [] },
  validatorRef: "PRJ001_CANONICAL_CHANGESET_AND_HUMAN_REVIEW_COVERAGE",
  sourceTurnRef: userTurn.turnId,
  baseProject: current.project,
  dependencyBindings: current.knowledgeOwnerLedger.entries
    .filter((entry) => entry.result && contribution.source.sourceRefs.includes(entry.result.resultId))
    .map((entry) => ({ ref: entry.result!.resultId, version: entry.result!.resultVersion,
      digest: ownerResultNativeDigest(entry.result)!, actuality: "CURRENT" as const })),
  traceRunId,
  retainedAt: userTurn.createdAt ?? new Date().toISOString(),
});

