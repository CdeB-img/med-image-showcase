import { logicalDigest, stableStringify } from "../knowledge-engine/canonical.js";
import type { ScientificInterpretationContributionEnvelope } from "./contracts.js";

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
