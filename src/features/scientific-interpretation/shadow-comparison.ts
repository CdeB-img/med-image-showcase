import { comparableScientificText, logicalDigest } from "../knowledge-engine/canonical.js";
import type { ScientificInterpretationContributionEnvelope } from "./contracts.js";

export type ScientificInterpretationShadowComparison = {
  comparisonId: string;
  activeContributionId: string;
  shadowContributionId: string;
  projectWrites: 0;
  exactJsonCompared: false;
  preservedSourceTerms: string[];
  missingSourceTerms: string[];
  activeOnlyConcepts: string[];
  shadowOnlyConcepts: string[];
  technicalErrors: string[];
};

const concepts = (contribution: ScientificInterpretationContributionEnvelope) => [
  ...contribution.scientificContent.explicitStatements,
  ...contribution.scientificContent.candidateObjects,
].map((item) => comparableScientificText(item.content)).filter(Boolean);

export const compareScientificInterpretationContributions = (
  active: ScientificInterpretationContributionEnvelope,
  shadow: ScientificInterpretationContributionEnvelope,
): ScientificInterpretationShadowComparison => {
  const activeConcepts = new Set(concepts(active));
  const shadowConcepts = new Set(concepts(shadow));
  const sourceTerms = active.source.turns.filter((turn) => turn.role === "USER").flatMap((turn) => comparableScientificText(turn.content).split(/[^\p{L}\p{N}]+/u)).filter((term) => term.length > 3);
  const shadowMaterial = concepts(shadow).join(" ");
  const preservedSourceTerms = [...new Set(sourceTerms.filter((term) => shadowMaterial.includes(term)))];
  const missingSourceTerms = [...new Set(sourceTerms.filter((term) => !shadowMaterial.includes(term)))];
  return {
    comparisonId: `shadow:${logicalDigest({ active: active.identity.contributionDigest, shadow: shadow.identity.contributionDigest })}`,
    activeContributionId: active.identity.contributionId,
    shadowContributionId: shadow.identity.contributionId,
    projectWrites: 0,
    exactJsonCompared: false,
    preservedSourceTerms,
    missingSourceTerms,
    activeOnlyConcepts: [...activeConcepts].filter((item) => !shadowConcepts.has(item)),
    shadowOnlyConcepts: [...shadowConcepts].filter((item) => !activeConcepts.has(item)),
    technicalErrors: shadow.runtimeEvidence.validationErrors.map((item) => `${item.failureClass}:${item.message}`),
  };
};
