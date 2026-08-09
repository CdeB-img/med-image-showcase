import { logicalDigest, uniqueSorted } from "../canonical";
import type { ExternalSearchPolicy, KnowledgeResult, KnowledgeTraceEvent } from "../types";
import { externalEvidenceCacheIdentity, readExternalEvidenceCache, saveExternalEvidenceCache } from "./cache";
import { PubMedExternalSearchProvider } from "./pubmed-provider";
import { createExternalQueryPlan, decideExternalSearch } from "./query-plan";
import { extractCandidateAssertions, qualifyAndDeduplicateSources } from "./qualification";
import type { ExternalEvidenceSearchResult, ExternalProviderSearchOutput, ExternalSearchProvider } from "./types";

const externalResultDigest = (result: Omit<ExternalEvidenceSearchResult, "digest">) => logicalDigest(result);

const forbiddenExternalResult = (decision: ReturnType<typeof decideExternalSearch>, now: string): ExternalEvidenceSearchResult => {
  const material: Omit<ExternalEvidenceSearchResult, "digest"> = {
    searchId: `external-search:${logicalDigest({ decision: decision.digest, now })}`,
    status: "FORBIDDEN",
    decision,
    queryPlan: null,
    provider: null,
    candidateSources: [],
    excludedSources: [],
    candidateAssertions: [],
    evidence: [],
    providerTrace: [],
    errors: [],
    pagination: [],
    searchExecutedAt: now,
    completedAt: now,
    cache: { state: "BYPASSED", key: null },
    freshness: {
      requirement: decision.freshnessRequirement,
      searchDate: now,
      recommendation: "Aucune recherche n’a été exécutée ; la politique ou l’autorisation l’interdit.",
    },
    mixedSynthesis: {
      internalConclusionIds: [],
      externalCandidateAssertionIds: [],
      externalSourceIds: [],
      divergences: [],
      limitation: "Aucune preuve externe n’a été ajoutée au résultat runtime.",
    },
    humanReviewRequired: true,
    corpusMutation: false,
  };
  return { ...material, digest: externalResultDigest(material) };
};

const exactIdentityDivergences = (internalResult: KnowledgeResult, output: ExternalProviderSearchOutput) => {
  const internalPmids = new Set(internalResult.sources.map((source) => source.pmid).filter(Boolean));
  const internalDois = new Set(internalResult.sources.map((source) => source.doi?.toLocaleLowerCase("en-US")).filter(Boolean));
  return output.sources.flatMap((source) => {
    const sameIdentity = internalPmids.has(source.pmid) || Boolean(source.doi && internalDois.has(source.doi.toLocaleLowerCase("en-US")));
    if (!sameIdentity || source.documentStatus === "CURRENT") return [];
    return [`La source ${source.pmid} présente dans les identités internes est signalée ${source.documentStatus === "RETRACTED" ? "rétractée" : "corrigée"} par les métadonnées PubMed candidates ; aucune conclusion interne n’est modifiée automatiquement.`];
  });
};

const buildExternalResult = (input: {
  internalResult: KnowledgeResult;
  decision: ReturnType<typeof decideExternalSearch>;
  plan: ReturnType<typeof createExternalQueryPlan>;
  provider: ExternalSearchProvider;
  output: ExternalProviderSearchOutput;
  cacheState: ExternalEvidenceSearchResult["cache"];
  searchExecutedAt: string;
  completedAt: string;
}): ExternalEvidenceSearchResult => {
  const qualified = qualifyAndDeduplicateSources(input.output.sources);
  const extracted = extractCandidateAssertions(input.internalResult.request, input.plan, qualified.eligible);
  const newestPublicationDate = qualified.eligible.map((source) => source.publicationDate).filter((value): value is string => Boolean(value)).sort().at(-1);
  const status = input.output.status === "SOURCE_UNAVAILABLE"
    ? "SOURCE_UNAVAILABLE" as const
    : input.output.status === "PARTIAL"
      ? "PARTIAL" as const
      : input.output.status === "NO_MATCH"
        ? "NO_MATCH" as const
        : "COMPLETED" as const;
  const divergences = uniqueSorted(exactIdentityDivergences(input.internalResult, input.output));
  const material: Omit<ExternalEvidenceSearchResult, "digest"> = {
    searchId: `external-search:${logicalDigest({ plan: input.plan.digest, provider: input.provider.definition.providerId, searchExecutedAt: input.searchExecutedAt, response: input.output.responseSnapshots.map((snapshot) => snapshot.bodyDigest) })}`,
    status,
    decision: input.decision,
    queryPlan: input.plan,
    provider: input.provider.definition,
    candidateSources: qualified.eligible,
    excludedSources: qualified.excluded,
    candidateAssertions: extracted.assertions,
    evidence: extracted.evidence,
    providerTrace: input.output.requests,
    errors: input.output.errors,
    pagination: input.output.pagination,
    searchExecutedAt: input.searchExecutedAt,
    completedAt: input.completedAt,
    cache: input.cacheState,
    freshness: {
      requirement: input.plan.freshnessRequirement,
      searchDate: input.searchExecutedAt,
      newestPublicationDate,
      recommendation: input.cacheState.state === "HIT_HISTORICAL"
        ? "Résultat historique réutilisé à date identifiée ; relancer explicitement pour obtenir un nouvel état fournisseur."
        : "La date de recherche est conservée ; la récence ne préjuge ni de la robustesse ni de l’applicabilité.",
    },
    mixedSynthesis: {
      internalConclusionIds: input.internalResult.synthesis.conclusions.map((conclusion) => conclusion.conclusionId),
      externalCandidateAssertionIds: extracted.assertions.map((assertion) => assertion.assertionId),
      externalSourceIds: qualified.eligible.map((source) => source.sourceIdentity),
      divergences,
      limitation: "Les éléments externes restent des sources et assertions candidates runtime ; ils ne sont ni fusionnés aux conclusions internes ni admis dans un corpus NOXIA.",
    },
    humanReviewRequired: true,
    corpusMutation: false,
  };
  return { ...material, digest: externalResultDigest(material) };
};

const attachExternalEvidence = (result: KnowledgeResult, externalEvidence: ExternalEvidenceSearchResult): KnowledgeResult => {
  const operations = [
    ["DECIDE_EXTERNAL_SEARCH", externalEvidence.decision.digest],
    ["BUILD_EXTERNAL_QUERY_PLAN", externalEvidence.queryPlan?.digest ?? "NO_PLAN"],
    ["RETRIEVE_EXTERNAL_CANDIDATE_SOURCES", logicalDigest(externalEvidence.candidateSources.map((source) => source.sourceRevision))],
    ["QUALIFY_EXTERNAL_ELIGIBILITY", logicalDigest(externalEvidence.excludedSources.map((source) => [source.sourceIdentity, source.eligibility]))],
    ["EXTRACT_EXTERNAL_CANDIDATE_ASSERTIONS", logicalDigest(externalEvidence.candidateAssertions.map((assertion) => assertion.revision))],
  ] as const;
  const events: KnowledgeTraceEvent[] = [
    ...result.trace.events,
    ...operations.map(([operation, outputDigest], index) => ({
      sequence: result.trace.events.length + index + 1,
      operation,
      mode: "DETERMINISTIC" as const,
      decision: operation === "RETRIEVE_EXTERNAL_CANDIDATE_SOURCES"
        ? "Provider externe exécuté ou réponse historique rejouée ; aucune promotion scientifique."
        : "Étape externe gouvernée et séparée de la connaissance effective.",
      inputDigest: index === 0 ? result.resultDigest : operations[index - 1][1],
      outputDigest,
    })),
  ];
  const privacy = {
    transmittedFields: uniqueSorted([...result.trace.privacy.transmittedFields, ...(externalEvidence.queryPlan?.minimizedContextFields ?? [])]),
    redactedFields: uniqueSorted([...result.trace.privacy.redactedFields, ...(externalEvidence.queryPlan?.redactedContextFields ?? [])]),
    externalCallMade: externalEvidence.providerTrace.length > 0,
  };
  const traceMaterial = {
    engineVersion: result.trace.engineVersion,
    events,
    registrySnapshotDigest: result.trace.registrySnapshotDigest,
    policyRefs: uniqueSorted([...result.trace.policyRefs, "NCBI_EUTILS_OFFICIAL_CONTRACT_2026-08-09"]),
    privacy,
  };
  const trace = { ...result.trace, ...traceMaterial, digest: logicalDigest(traceMaterial) };
  const request = externalEvidence.decision.authorized
    ? { ...result.request, requestRevision: result.request.requestRevision + 1, externalSearchPolicy: externalEvidence.decision.state }
    : result.request;
  const resultDigest = logicalDigest({ internalResultDigest: result.resultDigest, externalEvidenceDigest: externalEvidence.digest, requestRevision: request.requestRevision, traceDigest: trace.digest });
  return {
    ...result,
    resultId: `knowledge-result:${resultDigest}`,
    resultRevision: result.resultRevision + 1,
    resultDigest,
    request,
    externalEvidence,
    consumerHints: uniqueSorted([...result.consumerHints, ...(externalEvidence.candidateSources.length ? ["SHOW_EXTERNAL_CANDIDATES_SEPARATELY"] : [])]),
    humanReviewRequirements: uniqueSorted([...result.humanReviewRequirements, ...(externalEvidence.candidateSources.length ? ["EXTERNAL_EVIDENCE_CANDIDATE_REVIEW_REQUIRED"] : [])]),
    trace,
  };
};

export const executeExternalEvidenceSearch = async (input: {
  result: KnowledgeResult;
  policy?: ExternalSearchPolicy;
  authorizedBy?: "USER" | "PD_009_POLICY";
  provider?: ExternalSearchProvider;
  storage?: Pick<Storage, "getItem" | "setItem">;
  forceRefresh?: boolean;
  now?: () => string;
  planOptions?: { pageSize?: number; maxPages?: number; maxResults?: number };
}): Promise<KnowledgeResult> => {
  const now = input.now ?? (() => new Date().toISOString());
  const authorizedAt = now();
  const policy = input.policy ?? "EXTERNAL_ALLOWED";
  const decision = decideExternalSearch(input.result, policy, input.authorizedBy ? { authorizedBy: input.authorizedBy, authorizedAt } : undefined);
  if (!decision.authorized) return attachExternalEvidence(input.result, forbiddenExternalResult(decision, authorizedAt));
  const plan = createExternalQueryPlan(input.result, decision, input.planOptions);
  const provider = input.provider ?? new PubMedExternalSearchProvider();
  let output: ExternalProviderSearchOutput;
  let cacheState: ExternalEvidenceSearchResult["cache"];
  let searchExecutedAt = authorizedAt;
  const cacheKey = externalEvidenceCacheIdentity(plan);
  const cached = input.storage && !input.forceRefresh ? readExternalEvidenceCache(input.storage, plan) : null;
  if (cached) {
    output = cached.output;
    searchExecutedAt = cached.createdAt;
    cacheState = { state: "HIT_HISTORICAL", key: cacheKey, originalSearchExecutedAt: cached.createdAt };
  } else {
    output = await provider.search(plan);
    searchExecutedAt = output.requests[0]?.startedAt ?? authorizedAt;
    cacheState = input.storage ? { state: "MISS", key: cacheKey } : { state: "BYPASSED", key: cacheKey };
    if (input.storage) {
      try {
        saveExternalEvidenceCache(input.storage, plan, output, searchExecutedAt);
      } catch {
        cacheState = { state: "BYPASSED", key: null };
      }
    }
  }
  const externalEvidence = buildExternalResult({
    internalResult: input.result,
    decision,
    plan,
    provider,
    output,
    cacheState,
    searchExecutedAt,
    completedAt: now(),
  });
  return attachExternalEvidence(input.result, externalEvidence);
};
