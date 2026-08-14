import { logicalDigest, stableStringify } from "@/features/knowledge-engine/canonical";
import type { ScientificInterpretationContributionEnvelope } from "./contracts";

export const canonicalizeScientificContribution = (
  contribution: Omit<ScientificInterpretationContributionEnvelope, "identity"> & {
    identity: Omit<ScientificInterpretationContributionEnvelope["identity"], "contributionDigest">;
  },
): ScientificInterpretationContributionEnvelope => ({
  ...contribution,
  identity: {
    ...contribution.identity,
    contributionDigest: logicalDigest(contribution),
  },
});

export const scientificContributionStableJson = (contribution: ScientificInterpretationContributionEnvelope) => stableStringify(contribution);
