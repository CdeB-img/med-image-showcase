import { logicalDigest, uniqueSorted } from "../canonical";
import { assertExternalTransmissionAllowed } from "../privacy";
import type { ExternalSearchPolicy, KnowledgeResult } from "../types";
import type { ExternalQueryBranch, ExternalQueryPlan, ExternalSearchDecision } from "./types";

const PUBMED_QUERY_TERMS: Record<string, string[]> = {
  "modality:mri": ["magnetic resonance imaging"],
  "modality:ct": ["computed tomography"],
  "modality:pet": ["positron emission tomography"],
  "phenomenon:myocardial-fibrosis": ["myocardial fibrosis"],
  "pathology:fabry-disease": ["Fabry disease"],
  "phenomenon:no-reflow": ["no-reflow phenomenon"],
  "phenomenon:microvascular-obstruction": ["microvascular obstruction"],
  "biomarker:ecv": ["extracellular volume", "ECV"],
  "method:t1-mapping": ["T1 mapping"],
  "measurement:native-t1": ["native T1"],
  "method:synthetic-hematocrit": ["synthetic hematocrit"],
  "biomarker:t2": ["T2 mapping"],
  "biomarker:oef": ["oxygen extraction fraction"],
  "biomarker:cmro2": ["cerebral metabolic rate of oxygen"],
  "biomarker:cerebral-perfusion": ["cerebral perfusion"],
  "technology:spectral-ct": ["spectral computed tomography"],
  "technology:dual-energy-ct": ["dual-energy computed tomography"],
  "technology:photon-counting-ct": ["photon-counting computed tomography"],
  "method:fourier-transform": ["Fourier transform"],
  "intervention:stenting": ["stenting", "percutaneous coronary intervention"],
  "context:reperfusion": ["reperfusion"],
};

const toPubMedGroup = (terms: string[]) => {
  const serialized = uniqueSorted(terms).map((term) => `"${term.replace(/"/g, "")}"[Title/Abstract]`);
  return serialized.length > 1 ? `(${serialized.join(" OR ")})` : serialized[0] ?? "";
};

export const serializeExternalQuery = (conceptIds: string[]) => uniqueSorted(conceptIds)
  .map((conceptId) => PUBMED_QUERY_TERMS[conceptId])
  .filter((terms): terms is string[] => Boolean(terms?.length))
  .map(toPubMedGroup)
  .filter(Boolean)
  .join(" AND ");

export const decideExternalSearch = (
  result: KnowledgeResult,
  requestedPolicy: ExternalSearchPolicy = result.request.externalSearchPolicy,
  authorization?: { authorizedBy: "USER" | "PD_009_POLICY"; authorizedAt: string },
): ExternalSearchDecision => {
  const triggeringGapIds = result.gaps
    .filter((gap) => gap.code === "EXTERNAL_RESEARCH_REQUIRED" || gap.code === "NO_ASSERTION_MATCH" || gap.code === "NO_REGISTERED_PROVIDER")
    .map((gap) => gap.gapId)
    .sort();
  const reasons: string[] = [];
  let state = requestedPolicy;
  let authorized = false;
  let requiresUserAction = false;

  if (!assertExternalTransmissionAllowed(result.request.sensitivityClassification) || result.queryPlan.domainGate === "PATIENT_LEVEL_BLOCKED") {
    state = "EXTERNAL_FORBIDDEN";
    reasons.push("La confidentialité ou le Domain Gate interdit toute transmission externe.");
  } else if (requestedPolicy === "EXTERNAL_FORBIDDEN") {
    reasons.push("La politique de la demande interdit explicitement la recherche externe.");
  } else if (requestedPolicy === "INTERNAL_ONLY") {
    reasons.push("La demande reste en mode interne par défaut ; aucune autorisation externe n’a été enregistrée.");
  } else if (requestedPolicy === "EXTERNAL_ALLOWED") {
    if (!result.coverageMap.externalResearchRequired && result.coverageStatus === "SUPPORTED") {
      state = "INTERNAL_ONLY";
      reasons.push("La couverture interne est suffisante pour l’usage demandé et aucun besoin de fraîcheur externe n’est justifié.");
    } else if (!authorization) {
      requiresUserAction = true;
      reasons.push("Un gap interne justifie une proposition de recherche, mais l’action explicite n’a pas encore été donnée.");
    } else {
      authorized = true;
      reasons.push("Un gap interne est visible et l’action externe a été explicitement autorisée.");
    }
  } else if (requestedPolicy === "EXTERNAL_REQUIRED") {
    if (authorization?.authorizedBy === "PD_009_POLICY") {
      authorized = true;
      reasons.push("La fraîcheur ou l’incomplétude interne rend la recherche externe obligatoire selon l’action PD-009 enregistrée.");
    } else {
      requiresUserAction = true;
      reasons.push("La demande exige une recherche actuelle, mais aucune action PD-009 autorisante n’est enregistrée.");
    }
  }

  const material = {
    requestId: result.request.requestId,
    requestRevision: result.request.requestRevision,
    requestedPolicy,
    state,
    authorized,
    requiresUserAction,
    triggeringGapIds,
    reasons,
    expectedUse: result.request.expectedUse,
    freshnessRequirement: result.request.freshnessRequirement,
    privacyClass: result.request.sensitivityClassification,
    authorization,
  };
  const digest = logicalDigest(material);
  return {
    decisionId: `external-search-decision:${digest}`,
    state,
    authorized,
    requiresUserAction,
    triggeringGapIds,
    reasons,
    expectedUse: result.request.expectedUse,
    freshnessRequirement: result.request.freshnessRequirement,
    privacyClass: result.request.sensitivityClassification,
    authorizedBy: authorization?.authorizedBy,
    authorizedAt: authorization?.authorizedAt,
    digest,
  };
};

const dateFiltersFrom = (freshnessRequirement: string, authorizedAt?: string) => {
  const match = freshnessRequirement.match(/^FROM_(\d{4}-\d{2}-\d{2})$/);
  const authorizationDate = authorizedAt?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  return match ? { publicationDateFrom: match[1], ...(authorizationDate ? { publicationDateTo: authorizationDate } : {}) } : {};
};

export const createExternalQueryPlan = (
  result: KnowledgeResult,
  decision: ExternalSearchDecision,
  options: { pageSize?: number; maxPages?: number; maxResults?: number } = {},
): ExternalQueryPlan => {
  if (!decision.authorized || !["EXTERNAL_ALLOWED", "EXTERNAL_REQUIRED"].includes(decision.state)) throw new Error("EXTERNAL_SEARCH_NOT_AUTHORIZED");
  const branches: ExternalQueryBranch[] = result.queryPlan.branches.map((branch) => {
    const query = serializeExternalQuery(branch.conceptIds);
    return {
      branchId: branch.branchId,
      label: branch.label,
      conceptIds: uniqueSorted(branch.conceptIds),
      exactTerms: uniqueSorted(branch.conceptIds.flatMap((conceptId) => PUBMED_QUERY_TERMS[conceptId] ?? [])),
      query,
      modality: branch.modality,
    };
  }).filter((branch) => branch.query);
  if (!branches.length) throw new Error("EXTERNAL_QUERY_HAS_NO_GOVERNED_TERMS");
  const pageSize = Math.min(Math.max(options.pageSize ?? 6, 1), 20);
  const maxPages = Math.min(Math.max(options.maxPages ?? 1, 1), 2);
  const maxResults = Math.min(Math.max(options.maxResults ?? 12, 1), 20);
  const material = {
    requestRef: result.request.requestId,
    requestRevision: result.request.requestRevision + 1,
    internalResultRef: result.resultId,
    providerId: "pubmed-ncbi",
    decisionRef: decision.decisionId,
    resolvedConceptIds: result.resolvedConcepts.map((concept) => concept.conceptId).sort(),
    unresolvedConcepts: result.unresolvedConcepts,
    relations: result.request.relations,
    branches,
    exclusions: result.request.exclusions,
    filters: dateFiltersFrom(result.request.freshnessRequirement, decision.authorizedAt),
    parameters: { database: "pubmed" as const, sort: "relevance" as const, pageSize, maxPages, maxResults },
    evidenceIntent: "DISCOVERY_CANDIDATES_ONLY" as const,
    freshnessRequirement: result.request.freshnessRequirement,
    contextDigest: result.request.context.digest,
    minimizedContextFields: ["resolvedConceptIds", "relations", "publicationDateFilter"],
    redactedContextFields: ["originalQuestion", "unresolvedFreeText", "researchProjectId", "strategyVersion", "patientIdentifiers", "site", "equipmentFreeText", "projectDocuments"],
    generatedBy: "DETERMINISTIC_QUERY_PLANNER_V1_2" as const,
  };
  const digest = logicalDigest(material);
  return { queryPlanId: `external-query-plan:${digest}`, revision: 1, digest, ...material };
};

export const governedPubMedQueryTerms = () => ({ ...PUBMED_QUERY_TERMS });
