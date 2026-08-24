import { applyApplicability, isApplicable } from "./applicability";
import { resolveAssertions } from "./assertion-resolver";
import { analyzeConflicts, analyzeGaps, determineCoverage } from "./conflict-gap-analyzer";
import { buildCoverageMap } from "./coverage-map";
import { extractScientificObjectTerms, resolveConcepts } from "./concept-resolver";
import { createKnowledgeRequest, parseKnowledgeRequest, type KnowledgeRequestInput } from "./knowledge-request";
import { comparableScientificText } from "./canonical";
import { createKnowledgeResult } from "./knowledge-result";
import { minimizeKnowledgeContext } from "./privacy";
import { KNOWLEDGE_PROVIDER_REGISTRY } from "./provider-registry";
import { createQueryPlan } from "./query-planner";
import { retrieveKnowledge } from "./retrieval";
import { synthesizeKnowledge } from "./synthesizer";
import { buildScientificQuestionSpecificity } from "./specificity";
import { KnowledgeTraceBuilder } from "./trace";
import type { KnowledgeRequest, KnowledgeResult } from "./types";

export type ExecuteKnowledgeInput = Omit<KnowledgeRequestInput, "scientificObjectTerms"> & {
  scientificObjectTerms?: KnowledgeRequestInput["scientificObjectTerms"];
};

const executeValidatedKnowledgeRequest = (
  request: KnowledgeRequest,
  traceInput: unknown,
): KnowledgeResult => {
  const trace = new KnowledgeTraceBuilder();
  trace.add("BUILD_REQUEST", "Entrée validée et séparée du plan exécutable.", traceInput, { requestId: request.requestId, contextId: request.context.contextId });
  const minimized = minimizeKnowledgeContext(request);
  trace.add("MINIMIZE_CONTEXT", "Aucun texte libre ni identifiant transmis aux providers locaux.", request.context, minimized.payload);
  const resolution = resolveConcepts(request);
  trace.add("RESOLVE_GOVERNED_CONCEPT", "Résolution par règles locales gouvernées ; les inconnues restent visibles.", request.scientificObjects, resolution);
  const queryPlan = createQueryPlan(request, resolution);
  trace.add("BUILD_QUERY_PLAN", "Sélection exacte, déterministe et sans fallback implicite.", { request: request.requestId, resolution: resolution.digest }, queryPlan);
  const retrieval = retrieveKnowledge(request, queryPlan);
  trace.add("RETRIEVE_CORPUS", "Tous les providers inclus ont été exécutés ou ont produit un diagnostic distinct.", queryPlan.executionOrder, retrieval.providerExecutions);
  const allAssertions = retrieval.adapterResults.flatMap((item) => item.assertions);
  const allStatements = retrieval.adapterResults.flatMap((item) => item.documentaryStatements);
  const applicable = applyApplicability(request, allAssertions, allStatements);
  trace.add("ASSESS_APPLICABILITY", "Applicabilité calculée sans score compensatoire ni décision LLM.", allAssertions.map((item) => item.revision), applicable.assertions.map((item) => ({ id: item.revision, state: item.applicability })));
  const assertionResolution = resolveAssertions(applicable.assertions);
  trace.add("NORMALIZE_ASSERTION", "Représentations sources conservées ; candidats et effectifs séparés.", applicable.assertions, assertionResolution);
  const applicableStatements = applicable.documentaryStatements.filter((item) => isApplicable(item.applicability));
  const conflicts = [...new Map([
    ...retrieval.adapterResults.flatMap((item) => item.conflicts),
    ...analyzeConflicts(assertionResolution.applicableAssertions),
  ].map((item) => [item.conflictId, item])).values()].sort((left, right) => left.conflictId.localeCompare(right.conflictId));
  const coverageStatus = determineCoverage(queryPlan, retrieval.providerExecutions, assertionResolution.applicableAssertions, applicableStatements.length, assertionResolution.excludedAssertions.length, conflicts);
  const coverageMap = buildCoverageMap({ queryPlan, providerExecutions: retrieval.providerExecutions, applicableAssertions: assertionResolution.applicableAssertions, excludedAssertions: assertionResolution.excludedAssertions, documentaryStatements: applicableStatements, conflicts });
  const specificity = buildScientificQuestionSpecificity(request, queryPlan);
  const gaps = analyzeGaps(request, queryPlan, coverageStatus, conflicts, assertionResolution.applicableAssertions);
  const inheritedLimitations = retrieval.adapterResults.flatMap((item) => item.limitations);
  const synthesis = synthesizeKnowledge(request, assertionResolution.applicableAssertions, applicableStatements, retrieval.adapterResults.flatMap((item) => item.evidenceLinks), conflicts, gaps, inheritedLimitations);
  trace.add("BUILD_STRUCTURED_SYNTHESIS", "Synthèse logique déterministe ; aucune proposition scientifique ajoutée.", { assertions: assertionResolution.digest, gaps, conflicts }, synthesis);
  const builtTrace = trace.build(request.traceId, KNOWLEDGE_PROVIDER_REGISTRY.digest, { transmittedFields: minimized.transmittedFields, redactedFields: minimized.redactedFields, externalCallMade: false });
  return createKnowledgeResult({
    request,
    queryPlan,
    adapterResults: retrieval.adapterResults,
    providerExecutions: retrieval.providerExecutions,
    coverageStatus,
    coverageMap,
    specificity,
    applicableAssertions: assertionResolution.applicableAssertions,
    excludedAssertions: assertionResolution.excludedAssertions,
    candidateAssertions: assertionResolution.candidateAssertions,
    conflicts,
    gaps,
    synthesis,
    trace: builtTrace,
  });
};

/**
 * Native Knowledge corridor. The caller supplies the complete governed
 * KnowledgeRequest and the Knowledge owner validates it before execution.
 */
export const executeKnowledgeRequest = (rawRequest: KnowledgeRequest): KnowledgeResult => {
  const request = parseKnowledgeRequest(rawRequest);
  return executeValidatedKnowledgeRequest(request, request);
};

export const executeKnowledgeEngine = (input: ExecuteKnowledgeInput): KnowledgeResult => {
  const declaredTerms = input.scientificObjectTerms ?? [];
  const extractedTerms = extractScientificObjectTerms(input.originalQuestion);
  const terms = [...declaredTerms, ...extractedTerms].filter((item, index, values) => values.findIndex((candidate) => comparableScientificText(candidate.term) === comparableScientificText(item.term)) === index);
  const request = createKnowledgeRequest({ ...input, scientificObjectTerms: terms });
  return executeValidatedKnowledgeRequest(request, input);
};
