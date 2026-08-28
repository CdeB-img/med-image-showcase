import { logicalDigest, uniqueSorted } from "./canonical";
import type { AdapterResult, CoverageMap, CoverageStatus, GovernedDocumentaryStatement, KnowledgeGap, KnowledgeRequest, KnowledgeResult, KnowledgeTrace, ProviderExecution, QueryPlan, RuntimeAssertion, RuntimeConflict, RuntimeKnowledgeSynthesis, ScientificQuestionSpecificity } from "./types";

const dedupeBy = <T>(values: T[], key: (value: T) => string) => [...new Map(values.map((value) => [key(value), value])).values()].sort((left, right) => key(left).localeCompare(key(right)));

export const createKnowledgeResult = (input: {
  request: KnowledgeRequest;
  queryPlan: QueryPlan;
  adapterResults: AdapterResult[];
  providerExecutions: ProviderExecution[];
  coverageStatus: CoverageStatus;
  coverageMap: CoverageMap;
  specificity: ScientificQuestionSpecificity;
  applicableAssertions: RuntimeAssertion[];
  excludedAssertions: RuntimeAssertion[];
  documentaryStatements: GovernedDocumentaryStatement[];
  candidateAssertions: RuntimeAssertion[];
  conflicts: RuntimeConflict[];
  gaps: KnowledgeGap[];
  synthesis: RuntimeKnowledgeSynthesis;
  trace: KnowledgeTrace;
}): KnowledgeResult => {
  const statements = dedupeBy(input.documentaryStatements, (item) => item.statementId);
  const applicableItemIds = new Set([
    ...input.applicableAssertions.map((item) => item.revision),
    ...statements.map((item) => item.statementId),
  ]);
  const contributingProviderIds = new Set([
    ...input.applicableAssertions.map((item) => item.providerId),
    ...statements.map((item) => item.providerId),
  ]);
  const evidence = dedupeBy(input.adapterResults.flatMap((item) => item.evidenceLinks)
    .filter((item) => applicableItemIds.has(item.assertionId)), (item) => item.evidenceId);
  const sourceIds = new Set([
    ...evidence.map((item) => item.sourceId),
    ...statements.map((item) => item.sourceId),
  ]);
  const sources = dedupeBy(input.adapterResults.flatMap((item) => item.sources)
    .filter((item) => sourceIds.has(item.sourceId)), (item) => item.sourceId);
  const limitations = uniqueSorted(input.synthesis.limitations);
  const provenance = input.adapterResults.filter((item) => contributingProviderIds.has(item.providerId))
    .map((item) => ({ providerId: item.providerId, version: item.providerVersion, representationDigest: item.sourceRepresentationDigest }))
    .sort((left, right) => left.providerId.localeCompare(right.providerId));
  const logicalMaterial = {
    requestRef: input.request.requestId,
    queryPlanRef: input.queryPlan.queryPlanId,
    registrySnapshotRef: input.queryPlan.registrySnapshotRef,
    providerVersions: Object.fromEntries(input.providerExecutions.filter((item) => item.included).map((item) => [item.providerId, item.providerVersion]).sort(([left], [right]) => left.localeCompare(right))),
    coverageStatus: input.coverageStatus,
    coverageMapDigest: input.coverageMap.digest,
    specificityDigest: input.specificity.digest,
    contextStatus: input.request.context.status,
    resolvedConceptIds: input.queryPlan.resolvedConcepts.map((item) => item.conceptId),
    unresolvedConcepts: input.queryPlan.unresolvedConcepts,
    ambiguities: input.queryPlan.ambiguities,
    applicableAssertionIds: input.applicableAssertions.map((item) => item.revision),
    excludedAssertionIds: input.excludedAssertions.map((item) => item.revision),
    candidateAssertionIds: input.candidateAssertions.map((item) => item.revision),
    documentaryStatementIds: statements.map((item) => item.statementId),
    sourceIds: sources.map((item) => item.sourceId),
    evidenceIds: evidence.map((item) => item.evidenceId),
    synthesisDigest: input.synthesis.digest,
    conflictIds: input.conflicts.map((item) => item.conflictId),
    gapIds: input.gaps.map((item) => item.gapId),
    limitations,
    provenance,
    traceDigest: input.trace.digest,
  };
  const resultDigest = logicalDigest(logicalMaterial);
  const runtimeStatus = input.applicableAssertions.length || statements.length ? "RUNTIME_DERIVED" : "UNAVAILABLE_OR_UNKNOWN";
  return {
    resultId: `knowledge-result:${resultDigest}`,
    resultRevision: 1,
    resultDigest,
    request: input.request,
    queryPlan: input.queryPlan,
    registrySnapshotRef: input.queryPlan.registrySnapshotRef,
    providerVersions: logicalMaterial.providerVersions,
    runtimeStatus,
    coverageStatus: input.coverageStatus,
    coverageMap: input.coverageMap,
    contextStatus: input.request.context.status,
    specificity: input.specificity,
    resolvedConcepts: input.queryPlan.resolvedConcepts,
    unresolvedConcepts: input.queryPlan.unresolvedConcepts,
    ambiguities: input.queryPlan.ambiguities,
    applicableAssertions: input.applicableAssertions,
    excludedAssertions: input.excludedAssertions,
    documentaryStatements: statements,
    candidateAssertions: input.candidateAssertions,
    sources,
    evidence,
    applicability: Object.fromEntries([...input.applicableAssertions, ...input.excludedAssertions].map((item) => [item.revision, item.applicability])),
    synthesis: input.synthesis,
    controversies: input.conflicts,
    gaps: input.gaps,
    limitations,
    provenance,
    freshness: { requirement: input.request.freshnessRequirement, corpusStateDate: "2026-08-03" },
    consumerHints: uniqueSorted([
      ...(input.gaps.some((item) => item.code === "PRIVACY_BLOCKED") ? ["REFORMULATE_AS_GENERAL_METHODOLOGICAL_QUESTION"] : []),
      ...(input.gaps.some((item) => item.code === "MISSING_CRITICAL_CONTEXT") ? ["REQUEST_CONTEXT_CLARIFICATION"] : []),
      ...(input.coverageStatus === "PARTIAL" ? ["SHOW_EACH_COMPARISON_BRANCH"] : []),
      "DO_NOT_ADD_UNSUPPORTED_NARRATIVE",
    ]),
    humanReviewRequirements: uniqueSorted([
      ...(input.candidateAssertions.length ? ["ASSERTION_CANDIDATE_REVIEW_REQUIRED"] : []),
      ...(input.conflicts.length ? ["CONFLICT_REVIEW_REQUIRED"] : []),
      ...(input.request.requestedClaimType === "BEST_OPTION" ? ["HUMAN_SELECTION_REQUIRED"] : []),
    ]),
    providerExecutions: input.providerExecutions,
    trace: input.trace,
    externalEvidence: null,
  };
};
