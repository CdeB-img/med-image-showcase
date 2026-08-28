import { comparableScientificText, logicalDigest, uniqueSorted } from "./canonical";
import { modalitiesAreCompatible } from "./modality";
import { structuredSemanticRelation } from "./relation-semantics";
import type {
  CoverageStatus,
  GovernedDocumentaryStatement,
  KnowledgeGap,
  KnowledgeRequest,
  QueryPlan,
  RuntimeAssertion,
  RuntimeConflict,
  RuntimeEvidenceLink,
  RuntimeKnowledgeConclusion,
  RuntimeKnowledgeResponseState,
  RuntimeKnowledgeSynthesis,
} from "./types";

type SynthesisContext = {
  coverageStatus: CoverageStatus;
  queryPlan: QueryPlan;
};

const modalityTokens = (modality: string | undefined) => {
  if (modality === "MRI") return ["mr", "mri", "irm"];
  if (modality === "CT") return ["ct", "computed-tomography", "computed tomography"];
  if (modality === "PET") return ["pet", "tep"];
  return modality ? [modality.toLocaleLowerCase("fr-FR")] : [];
};

const STOP_WORDS = new Set([
  "avec", "dans", "pour", "apres", "avant", "entre", "comme", "cette", "leurs", "quelle", "quelles", "role",
  "the", "and", "with", "from", "that", "this", "after", "before", "into", "within", "using", "used",
]);

const semanticTokens = (value: string) => comparableScientificText(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/[^a-z0-9]+/u)
  .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

const structuralRelevance = (
  request: KnowledgeRequest,
  context: SynthesisContext | undefined,
  conclusion: RuntimeKnowledgeConclusion,
  assertion: RuntimeAssertion | undefined,
) => {
  const requestedMaterial = [
    request.originalQuestion,
    ...request.relations,
    ...(context?.queryPlan.resolvedConcepts.map((concept) => concept.preferredLabel) ?? []),
    ...request.context.dimensions.filter((dimension) => dimension.state === "KNOWN").flatMap((dimension) => dimension.values),
  ].join(" ");
  const conclusionMaterial = [
    conclusion.text,
    conclusion.semanticRelation?.subject,
    conclusion.semanticRelation?.predicate,
    conclusion.semanticRelation?.object,
  ].filter(Boolean).join(" ");
  const requestedTokens = new Set(semanticTokens(requestedMaterial));
  const lexicalOverlap = new Set(semanticTokens(conclusionMaterial).filter((token) => requestedTokens.has(token))).size;
  const conceptSupport = context?.queryPlan.resolvedConcepts.filter((concept) => assertion && (
    assertion.conceptIds.includes(concept.conceptId)
    || (concept.providerConcepts[assertion.providerId] ?? []).some((providerConcept) => assertion.conceptIds.includes(providerConcept))
  )).length ?? 0;
  const requestedModalities = request.context.dimensions.find((dimension) => dimension.name === "modality")?.values ?? [];
  const modalitySupport = assertion?.modality && requestedModalities.some((modality) => modalitiesAreCompatible(assertion.modality!, modality)) ? 1 : 0;
  return conceptSupport * 100 + modalitySupport * 20 + lexicalOverlap;
};

const containsToken = (value: string, token: string) => new RegExp(`(?:^|[^a-z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`, "iu").test(value);

const isCrossBranchComparison = (
  conclusion: RuntimeKnowledgeConclusion,
  context: SynthesisContext | undefined,
) => {
  if (!context || context.queryPlan.branches.length < 2 || !conclusion.semanticRelation) return false;
  if (!/(?:COMPARE|VERSUS|AGREEMENT|CORRELAT|DISTINCT|EQUIVAL|DIFFER)/iu.test(conclusion.semanticRelation.predicate)) return false;
  const relationMaterial = `${conclusion.semanticRelation.subject} ${conclusion.semanticRelation.object}`.toLocaleLowerCase("fr-FR");
  return context.queryPlan.branches.every((branch) => {
    const tokens = modalityTokens(branch.modality);
    return tokens.length === 0 || tokens.some((token) => containsToken(relationMaterial, token));
  });
};

const isContextualLimit = (
  conclusion: RuntimeKnowledgeConclusion,
  conflicts: RuntimeConflict[],
  statementType?: GovernedDocumentaryStatement["statementType"],
) => conclusion.applicability !== "APPLICABLE_EXACT"
  || conclusion.limitations.length > 0
  || conflicts.some((conflict) => conflict.positionIds.includes(conclusion.assertionId))
  || ["LIMITATION", "CONTROVERSY", "OPEN_QUESTION"].includes(statementType ?? "")
  || /(?:REQUIRE|DEPEND|LIMIT|INFLUENCE|CONDITION|WINDOW)/iu.test(conclusion.semanticRelation?.predicate ?? "");

const responseState = (
  coverageStatus: CoverageStatus | undefined,
  conclusionCount: number,
  directCount: number,
  conflictCount: number,
  queryPlan?: QueryPlan,
): RuntimeKnowledgeResponseState => {
  if (queryPlan?.domainGate === "CLARIFICATION_REQUIRED") return "CLARIFICATION_REQUIRED";
  if (coverageStatus === "SOURCE_UNAVAILABLE") return "SOURCE_UNAVAILABLE";
  if (coverageStatus === "COVERAGE_UNKNOWN") return "COVERAGE_UNKNOWN";
  if (coverageStatus === "CONFLICTING" || conflictCount > 0 && coverageStatus !== "PARTIAL") return "CONTRADICTORY_ANSWER";
  if (["NO_PROVIDER", "PROVIDER_NOT_APPLICABLE", "NO_MATCH"].includes(coverageStatus ?? "") || conclusionCount === 0) return "NO_APPLICABLE_KNOWLEDGE";
  if (coverageStatus === "PARTIAL" || directCount === 0) return "PARTIAL_ANSWER";
  return "DIRECT_ANSWER";
};

export const synthesizeKnowledge = (
  request: KnowledgeRequest,
  assertions: RuntimeAssertion[],
  statements: GovernedDocumentaryStatement[],
  evidence: RuntimeEvidenceLink[],
  conflicts: RuntimeConflict[],
  gaps: KnowledgeGap[],
  inheritedLimitations: string[],
  context?: SynthesisContext,
): RuntimeKnowledgeSynthesis => {
  const sourceIdsFor = (assertionId: string) => uniqueSorted(evidence.filter((item) => item.assertionId === assertionId).map((item) => item.sourceId));
  const statementTypeById = new Map(statements.map((statement) => [statement.statementId, statement.statementType]));
  const baseConclusions: RuntimeKnowledgeConclusion[] = [
    ...assertions.map((assertion): RuntimeKnowledgeConclusion => ({
      conclusionId: `conclusion:${logicalDigest(assertion.revision)}`,
      assertionId: assertion.revision,
      itemKind: "ASSERTION",
      text: assertion.text,
      status: assertion.status,
      applicability: assertion.applicability,
      conceptIds: uniqueSorted(assertion.conceptIds),
      sourceIds: sourceIdsFor(assertion.revision),
      locator: assertion.locator,
      limitations: uniqueSorted(assertion.limitations),
      role: "SUPPORTING_CONTEXT",
      semanticRelation: structuredSemanticRelation(assertion.atomicContent),
    })),
    ...statements.map((statement): RuntimeKnowledgeConclusion => ({
      conclusionId: `conclusion:${logicalDigest(statement.statementId)}`,
      assertionId: statement.statementId,
      itemKind: "DOCUMENTARY_STATEMENT",
      text: statement.text,
      status: statement.status,
      applicability: statement.applicability,
      conceptIds: uniqueSorted(statement.conceptIds),
      sourceIds: [statement.sourceId],
      locator: statement.locator,
      limitations: [],
      role: "SUPPORTING_CONTEXT",
      semanticRelation: null,
    })),
  ].sort((left, right) => left.assertionId.localeCompare(right.assertionId));

  const assertionById = new Map(assertions.map((assertion) => [assertion.revision, assertion]));
  const directCandidates = request.requestType === "COMPARE"
    ? baseConclusions.filter((conclusion) => isCrossBranchComparison(conclusion, context))
    : baseConclusions.filter((conclusion) => conclusion.itemKind === "ASSERTION")
      .sort((left, right) => structuralRelevance(request, context, right, assertionById.get(right.assertionId))
        - structuralRelevance(request, context, left, assertionById.get(left.assertionId))
        || left.assertionId.localeCompare(right.assertionId))
      .slice(0, 2);
  if (directCandidates.length === 0 && request.requestType !== "COMPARE" && baseConclusions.length > 0) directCandidates.push(baseConclusions[0]);
  const directIds = new Set(directCandidates.map((conclusion) => conclusion.conclusionId));
  const contextualLimitIds = new Set(baseConclusions.filter((conclusion) => !directIds.has(conclusion.conclusionId)
    && isContextualLimit(conclusion, conflicts, statementTypeById.get(conclusion.assertionId))).map((conclusion) => conclusion.conclusionId));
  const conclusions = baseConclusions.map((conclusion): RuntimeKnowledgeConclusion => ({
    ...conclusion,
    role: directIds.has(conclusion.conclusionId)
      ? "DIRECT_RESPONSE"
      : contextualLimitIds.has(conclusion.conclusionId)
        ? "CONTEXTUAL_LIMIT"
        : "SUPPORTING_CONTEXT",
  }));
  const responseProfile = {
    state: responseState(context?.coverageStatus, conclusions.length, directIds.size, conflicts.length, context?.queryPlan),
    directConclusionIds: conclusions.filter((item) => item.role === "DIRECT_RESPONSE").map((item) => item.conclusionId),
    supportingConclusionIds: conclusions.filter((item) => item.role === "SUPPORTING_CONTEXT").map((item) => item.conclusionId),
    contextualLimitConclusionIds: conclusions.filter((item) => item.role === "CONTEXTUAL_LIMIT").map((item) => item.conclusionId),
    contradictionIds: conflicts.map((item) => item.conflictId),
    blockingGapIds: gaps.map((item) => item.gapId),
  };
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
    responseProfile,
    convergences: conclusions.length > 1 && !conflicts.length ? ["Plusieurs éléments compatibles sont conservés sans vote par nombre de sources."] : [],
    divergences: conflicts.map((item) => item.explanation),
    controversies: conflicts,
    limitations: uniqueSorted([
      ...inheritedLimitations,
      ...assertions.flatMap((item) => item.limitations),
      ...assertions.filter((item) => item.applicability === "APPLICABLE_WITH_LIMITATIONS" || item.applicability === "PARTIALLY_APPLICABLE").flatMap((item) => item.applicabilityReasons),
    ]),
    gaps,
    methodologicalImplications,
    sourceIds: uniqueSorted(conclusions.flatMap((item) => item.sourceIds)),
  };
  const digest = logicalDigest(material);
  return { synthesisId: `runtime-knowledge-synthesis:${digest}`, digest, ...material };
};
