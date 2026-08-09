import { logicalDigest, uniqueSorted } from "./canonical";
import type { GovernedDocumentaryStatement, KnowledgeGap, KnowledgeRequest, RuntimeAssertion, RuntimeConflict, RuntimeEvidenceLink, RuntimeKnowledgeSynthesis } from "./types";

export const synthesizeKnowledge = (
  request: KnowledgeRequest,
  assertions: RuntimeAssertion[],
  statements: GovernedDocumentaryStatement[],
  evidence: RuntimeEvidenceLink[],
  conflicts: RuntimeConflict[],
  gaps: KnowledgeGap[],
  inheritedLimitations: string[],
): RuntimeKnowledgeSynthesis => {
  const sourceIdsFor = (assertionId: string) => uniqueSorted(evidence.filter((item) => item.assertionId === assertionId).map((item) => item.sourceId));
  const conclusions = [
    ...assertions.map((assertion) => ({ conclusionId: `conclusion:${logicalDigest(assertion.revision)}`, assertionId: assertion.revision, text: assertion.text, status: assertion.status, applicability: assertion.applicability, sourceIds: sourceIdsFor(assertion.revision) })),
    ...statements.map((statement) => ({ conclusionId: `conclusion:${logicalDigest(statement.statementId)}`, assertionId: statement.statementId, text: statement.text, status: statement.status, applicability: statement.applicability, sourceIds: [statement.sourceId] })),
  ].sort((left, right) => left.conclusionId.localeCompare(right.conclusionId));
  const methodologicalImplications = uniqueSorted([
    ...(request.requestType === "COMPARE" ? ["Conserver chaque objet comparé dans une branche distincte, y compris une branche non couverte."] : []),
    ...(request.requestedClaimType === "BEST_OPTION" ? ["Une sélection requiert d’abord la pathologie, le phénomène, la population, l’objectif et l’usage scientifique."] : []),
    ...(gaps.some((item) => item.code === "MISSING_CRITICAL_CONTEXT") ? ["Une clarification est nécessaire avant toute conclusion plus forte."] : []),
    ...(gaps.some((item) => item.code === "PRIVACY_BLOCKED") ? ["Le cas individuel doit être séparé d’une question scientifique générale avant toute explication méthodologique."] : []),
  ]);
  const material = {
    question: request.normalizedQuestion,
    domain: request.context.dimensions.find((item) => item.name === "domain")?.values ?? [],
    conclusions,
    convergences: conclusions.length > 1 && !conflicts.length ? ["Plusieurs éléments compatibles sont conservés sans vote par nombre de sources."] : [],
    divergences: conflicts.map((item) => item.explanation),
    controversies: conflicts,
    limitations: uniqueSorted([...inheritedLimitations, ...assertions.flatMap((item) => item.limitations)]),
    gaps,
    methodologicalImplications,
    sourceIds: uniqueSorted(conclusions.flatMap((item) => item.sourceIds)),
  };
  const digest = logicalDigest(material);
  return { synthesisId: `runtime-knowledge-synthesis:${digest}`, digest, ...material };
};

