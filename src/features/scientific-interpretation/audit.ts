import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationFinding } from "./contracts";

const finding = (code: string, message: string, sourceRefs: string[], severity: ScientificInterpretationFinding["severity"] = "CRITICAL"): ScientificInterpretationFinding => ({
  findingId: `audit-d:${logicalDigest({ code, message, sourceRefs })}`,
  code,
  severity,
  message,
  sourceRefs,
  status: "OPEN",
});

export const auditScientificInterpretationContribution = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationFinding[] => {
  const findings: ScientificInterpretationFinding[] = [];
  if (contribution.decisionBoundary.projectWriteAuthorized !== false) findings.push(finding("PROJECT_WRITE_AUTHORIZED", "Une Contribution ne peut pas autoriser une écriture Project.", [contribution.identity.contributionId]));
  const items = [
    ...contribution.scientificContent.explicitStatements,
    ...contribution.scientificContent.candidateObjects,
    ...contribution.scientificContent.inferredContext,
    ...contribution.scientificContent.contextualCandidates,
    ...contribution.scientificContent.negationsAndConstraints,
    ...contribution.scientificContent.temporalElements,
  ];
  const itemIds = new Set(items.map((item) => item.itemId));
  contribution.scientificContent.candidateRelations.forEach((relation) => {
    if (!itemIds.has(relation.sourceItemId) || !itemIds.has(relation.targetItemId)) findings.push(finding("RELATION_ENDPOINT_MISSING", "La relation référence un élément absent de la Contribution.", [relation.relationId]));
    if (relation.sourceItemId === relation.targetItemId) findings.push(finding("SELF_RELATION", "La relation relie un élément à lui-même.", [relation.relationId]));
  });
  items.forEach((item) => {
    if (item.epistemicBoundary.adoptionStatus === "PROJECT_ADOPTED") findings.push(finding("CANDIDATE_PROMOTED_TO_PROJECT", "Un candidat runtime ne peut pas devenir une décision Project.", [item.itemId]));
    if (item.polarity === "NEGATED" && !contribution.scientificContent.negationsAndConstraints.some((entry) => entry.itemId === item.itemId)) {
      findings.push(finding("NEGATION_NOT_EXPLICITLY_REPRESENTED", "Un élément négatif doit rester reconstructible dans les contraintes.", [item.itemId]));
    }
  });
  return findings;
};

export const applyDeterministicAudit = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationContributionEnvelope => {
  const before = contribution.identity.contributionDigest;
  const deterministicFindings = auditScientificInterpretationContribution(contribution);
  return {
    ...contribution,
    identity: { ...contribution.identity, contributionDigest: before },
    audit: {
      ...contribution.audit,
      deterministicFindings,
      unresolvedFindings: [...deterministicFindings, ...contribution.audit.semanticAuditFindings.filter((item) => item.status === "OPEN")],
    },
  };
};
