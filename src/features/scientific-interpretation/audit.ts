import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { ScientificInterpretationContributionEnvelope, ScientificInterpretationFinding } from "./contracts.js";

const finding = (code: string, message: string, sourceRefs: string[], severity: ScientificInterpretationFinding["severity"] = "CRITICAL"): ScientificInterpretationFinding => ({
  findingId: `audit-d:${logicalDigest({ code, message, sourceRefs })}`,
  code,
  severity,
  message,
  sourceRefs,
  status: "OPEN",
});

export const auditScientificInterpretationContribution = (
  contribution: ScientificInterpretationContributionEnvelope,
  previousContribution?: ScientificInterpretationContributionEnvelope | null,
): ScientificInterpretationFinding[] => {
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
  const sourceByTurn = new Map(contribution.source.turns.map((turn) => [turn.turnId, turn.content]));
  const negatedTurns = contribution.source.turns.filter((turn) => /\b(?:sans|ne\s+[^.!?]{0,80}\s+pas|n['’][^.!?]{0,80}\s+pas|non[- ]?causal|aucun|no\s+causal|not\s+causal|without\s+caus|do\s+not|does\s+not)/i.test(turn.content));
  const hasExplicitNegation = negatedTurns.length > 0;
  contribution.scientificContent.candidateRelations.forEach((relation) => {
    if (!itemIds.has(relation.sourceItemId) || !itemIds.has(relation.targetItemId)) findings.push(finding("RELATION_ENDPOINT_MISSING", "La relation référence un élément absent de la Contribution.", [relation.relationId]));
    if (relation.sourceItemId === relation.targetItemId) findings.push(finding("SELF_RELATION", "La relation relie un élément à lui-même.", [relation.relationId]));
    if (hasExplicitNegation && /CAUSE|CAUSAL|PREDICT/i.test(relation.relationType) && relation.polarity !== "NEGATED") {
      findings.push(finding("CAUSALITY_ADDED_AGAINST_EXPLICIT_NEGATION", "Une causalité ou prédiction ne peut pas être ajoutée contre une négation explicite.", [relation.relationId]));
    }
    if (relation.epistemicBoundary.epistemicStatus === "REJECTED_BY_USER" && relation.epistemicBoundary.activeState !== false) {
      findings.push(finding("REJECTED_RELATION_REMAINS_ACTIVE", "Une relation rejetée ne peut pas rester active.", [relation.relationId]));
    }
  });
  if (previousContribution) {
    const currentRelations = contribution.scientificContent.candidateRelations.filter((item) => item.epistemicBoundary.activeState !== false);
    const correctionTurnIds = new Set(contribution.scientificContent.correctionsAndSupersessions.flatMap((item) => item.epistemicBoundary.sourceTurnIds));
    previousContribution.scientificContent.candidateRelations
      .filter((item) => item.epistemicBoundary.activeState !== false)
      .forEach((previous) => {
        const reversed = currentRelations.find((current) => current.sourceItemId === previous.targetItemId
          && current.targetItemId === previous.sourceItemId
          && current.relationType === previous.relationType);
        const sourcedCorrection = reversed?.epistemicBoundary.sourceTurnIds.some((turnId) => correctionTurnIds.has(turnId));
        if (reversed && !sourcedCorrection) {
          findings.push(finding("RELATION_DIRECTION_INVERTED", "La direction d’une relation établie ne peut être inversée sans correction sourcée.", [previous.relationId, reversed.relationId]));
        }
      });
  }
  items.forEach((item) => {
    if (item.epistemicBoundary.adoptionStatus === "PROJECT_ADOPTED") findings.push(finding("CANDIDATE_PROMOTED_TO_PROJECT", "Un candidat runtime ne peut pas devenir une décision Project.", [item.itemId]));
    if (item.polarity === "NEGATED" && !contribution.scientificContent.negationsAndConstraints.some((entry) => entry.itemId === item.itemId)) {
      findings.push(finding("NEGATION_NOT_EXPLICITLY_REPRESENTED", "Un élément négatif doit rester reconstructible dans les contraintes.", [item.itemId]));
    }
    if ((item.epistemicBoundary.epistemicStatus === "REJECTED_BY_USER" || /REJECTED|SUPERSEDED/i.test(item.epistemicBoundary.originStatus ?? ""))
      && item.epistemicBoundary.activeState !== false) {
      findings.push(finding("REJECTED_OR_SUPERSEDED_STATE_ACTIVE", "Un état rejeté ou remplacé ne peut pas rester actif.", [item.itemId]));
    }
    if (/LOCAL_PRACTICE|INSTITUTIONAL_PROCESS/i.test(`${item.epistemicBoundary.ownership ?? ""} ${item.epistemicBoundary.originType ?? ""} ${item.epistemicBoundary.originStatus ?? ""}`)
      && /(?:PROJECT_)?ADOPTED/i.test(item.epistemicBoundary.adoptionStatus ?? "")) {
      findings.push(finding("LOCAL_PRACTICE_PROMOTED_TO_PROJECT", "Une pratique locale ne peut pas être promue en décision Project.", [item.itemId]));
    }
    if (/PRIMARY|PRINCIPAL/i.test(item.studyRole ?? "") && /ENDPOINT/i.test(item.proposedType ?? "")
      && /(?:PROJECT_)?ADOPTED/i.test(item.epistemicBoundary.adoptionStatus ?? "")) {
      findings.push(finding("PRIMARY_CANDIDATE_PROMOTED_TO_ADOPTED_ENDPOINT", "Un candidat principal ne peut pas devenir un endpoint adopté sans décision humaine.", [item.itemId]));
    }
    if (/(?:PROJECT_)?ADOPTED/i.test(item.epistemicBoundary.adoptionStatus ?? "")
      && !item.epistemicBoundary.sourceText && item.epistemicBoundary.sourceTurnIds.length === 0 && !item.epistemicBoundary.decisionId) {
      findings.push(finding("UNSUPPORTED_DECISION_INVENTION", "Une décision adoptée sans support source ni décision humaine est interdite.", [item.itemId]));
    }
    if (item.epistemicBoundary.epistemicStatus === "EXPLICIT_USER_STATED" && item.epistemicBoundary.sourceText) {
      const grounded = item.epistemicBoundary.sourceTurnIds.some((turnId) => sourceByTurn.get(turnId)?.includes(item.epistemicBoundary.sourceText ?? ""));
      if (!grounded) findings.push(finding("EXPLICIT_SOURCE_NOT_GROUNDED", "Une déclaration explicite doit rester rattachée à un extrait exact de la conversation.", [item.itemId]));
    }
  });
  negatedTurns.forEach((turn) => {
    const represented = [...items, ...contribution.scientificContent.negationsAndConstraints].some((item) =>
      item.epistemicBoundary.sourceTurnIds.includes(turn.turnId) && (item.polarity === "NEGATED" || contribution.scientificContent.negationsAndConstraints.some((entry) => entry.itemId === item.itemId)))
      || contribution.scientificContent.candidateRelations.some((relation) => relation.epistemicBoundary.sourceTurnIds.includes(turn.turnId) && relation.polarity === "NEGATED");
    if (!represented) findings.push(finding("CRITICAL_NEGATION_LOST", "Une négation explicite ne reste pas reconstructible dans la Contribution.", [turn.turnId]));
  });
  return findings;
};

export const applyDeterministicAudit = (
  contribution: ScientificInterpretationContributionEnvelope,
  previousContribution?: ScientificInterpretationContributionEnvelope | null,
): ScientificInterpretationContributionEnvelope => {
  const before = contribution.identity.contributionDigest;
  const deterministicFindings = auditScientificInterpretationContribution(contribution, previousContribution);
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
