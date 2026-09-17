import { applyApplicability, isApplicable } from "./applicability.js";
import { resolveAssertions } from "./assertion-resolver.js";
import { analyzeConflicts, analyzeGaps, determineCoverage } from "./conflict-gap-analyzer.js";
import { buildCoverageMap } from "./coverage-map.js";
import { extractScientificObjectTerms, resolveConcepts } from "./concept-resolver.js";
import { createKnowledgeRequest, parseKnowledgeRequest, type KnowledgeRequestInput } from "./knowledge-request.js";
import { comparableScientificText } from "./canonical.js";
import { createKnowledgeResult } from "./knowledge-result.js";
import { minimizeKnowledgeContext } from "./privacy.js";
import { KNOWLEDGE_PROVIDER_REGISTRY } from "./provider-registry.js";
import { createQueryPlan } from "./query-planner.js";
import { retrieveKnowledge } from "./retrieval.js";
import { synthesizeKnowledge } from "./synthesizer.js";
import { buildScientificQuestionSpecificity } from "./specificity.js";
import { KnowledgeTraceBuilder } from "./trace.js";
import type { KnowledgeRequest, KnowledgeResult } from "./types.js";

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
  const referenceSourceSnapshots = retrieval.adapterResults.flatMap((item) => item.referenceSourceSnapshots ?? []);
  const referenceEvidenceCandidates = retrieval.adapterResults.flatMap((item) => item.referenceEvidenceCandidates ?? []);
  if (request.referenceNeed) {
    trace.add("RESOLVE_REFERENCE_SOURCE", "Résolution exclusive par identités RC01 gouvernées ; aucun chemin ni URL fourni par le caller n’est dereferencé.", request.referenceNeed, referenceSourceSnapshots.map((snapshot) => ({ sourceId: snapshot.sourceId, state: snapshot.contentAvailability, digest: snapshot.snapshotDigest })));
    trace.add("RESOLVE_REFERENCE_SECTION", "Sélection lexicale bornée dans l’index local digesté ; aucun contenu metadata-only n’est extrapolé.", referenceSourceSnapshots.map((snapshot) => snapshot.snapshotId), referenceEvidenceCandidates.map((candidate) => ({ candidateId: candidate.candidateId, anchorId: candidate.anchor.anchorId })));
  }
  const applicable = applyApplicability(request, allAssertions, allStatements);
  trace.add("ASSESS_APPLICABILITY", "Applicabilité calculée sans score compensatoire ni décision LLM.", allAssertions.map((item) => item.revision), applicable.assertions.map((item) => ({ id: item.revision, state: item.applicability })));
  const assertionResolution = resolveAssertions(applicable.assertions);
  trace.add("NORMALIZE_ASSERTION", "Représentations sources conservées ; candidats et effectifs séparés.", applicable.assertions, assertionResolution);
  const applicableStatements = applicable.documentaryStatements.filter((item) => isApplicable(item.applicability));
  const conflicts = [...new Map([
    ...retrieval.adapterResults.flatMap((item) => item.conflicts),
    ...analyzeConflicts(assertionResolution.applicableAssertions),
  ].map((item) => [item.conflictId, item])).values()].sort((left, right) => left.conflictId.localeCompare(right.conflictId));
  const contributingProviderIds = new Set([
    ...assertionResolution.applicableAssertions.map((item) => item.providerId),
    ...applicableStatements.map((item) => item.providerId),
    ...referenceEvidenceCandidates.map((item) => item.providerId),
    ...(referenceSourceSnapshots.length ? ["reference-corpus-01"] : []),
  ]);
  const inheritedLimitations = retrieval.adapterResults.filter((item) => contributingProviderIds.has(item.providerId)).flatMap((item) => item.limitations);
  const coverageStatus = determineCoverage(queryPlan, retrieval.providerExecutions, assertionResolution.applicableAssertions, applicableStatements.length, assertionResolution.excludedAssertions.length, conflicts, inheritedLimitations, referenceEvidenceCandidates.length);
  const coverageMap = buildCoverageMap({ request, queryPlan, providerExecutions: retrieval.providerExecutions, applicableAssertions: assertionResolution.applicableAssertions, excludedAssertions: assertionResolution.excludedAssertions, documentaryStatements: applicableStatements, referenceEvidenceCandidates, conflicts, inheritedLimitations });
  const specificity = buildScientificQuestionSpecificity(request, queryPlan);
  const gaps = analyzeGaps(request, queryPlan, coverageStatus, conflicts, assertionResolution.applicableAssertions, inheritedLimitations, referenceEvidenceCandidates, referenceSourceSnapshots);
  const synthesis = synthesizeKnowledge(
    request,
    assertionResolution.applicableAssertions,
    applicableStatements,
    retrieval.adapterResults.flatMap((item) => item.evidenceLinks),
    conflicts,
    gaps,
    inheritedLimitations,
    { coverageStatus, queryPlan },
  );
  trace.add("BUILD_STRUCTURED_SYNTHESIS", "Synthèse logique déterministe ; aucune proposition scientifique ajoutée.", { assertions: assertionResolution.digest, gaps, conflicts }, synthesis);
  if (request.referenceNeed) trace.add("EMIT_REFERENCE_RESULT", "Les références externes restent des candidats ancrés, sans assertion effective ni autorisation d’écriture Project.", referenceEvidenceCandidates.map((candidate) => candidate.candidateId), { candidateCount: referenceEvidenceCandidates.length, projectWriteAuthorized: false });
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
    documentaryStatements: applicableStatements,
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
