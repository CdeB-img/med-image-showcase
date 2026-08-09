import type {
  ApplicabilityState,
  ExternalSearchPolicy,
  KnowledgeContentOrigin,
  PrivacyClass,
  RuntimeEvidenceLink,
} from "../types";

export type ExternalProviderAvailability = "AVAILABLE" | "DEGRADED" | "UNAVAILABLE";

export type ExternalSearchProviderDefinition = {
  providerId: string;
  authority: string;
  queryCapabilities: Array<"DISCOVERY" | "METADATA" | "ABSTRACT_RETRIEVAL" | "IDENTITY_RESOLUTION">;
  supportedFilters: string[];
  rateLimitBehavior: {
    unauthenticatedRequestsPerSecond: number;
    maxRetries: number;
    retryableStatuses: number[];
  };
  pagination: {
    strategy: "OFFSET";
    defaultPageSize: number;
    maximumPageSize: number;
  };
  resultIdentity: Array<"PMID" | "DOI" | "PMCID">;
  revisionIdentity: string[];
  sourceLocatorSupport: Array<"PUBMED_RECORD" | "ABSTRACT_SECTION" | "PMC_LINK">;
  abstractAvailability: "WHEN_DEPOSITED";
  fullTextAvailability: "LINK_ONLY_WHEN_PMCID_PRESENT";
  knownLimitations: string[];
  availability: ExternalProviderAvailability;
  privacyBoundary: {
    allowedClasses: PrivacyClass[];
    transmittedFields: string[];
    forbiddenFields: string[];
  };
};

export type ExternalSearchDecision = {
  decisionId: string;
  state: ExternalSearchPolicy;
  authorized: boolean;
  requiresUserAction: boolean;
  triggeringGapIds: string[];
  reasons: string[];
  expectedUse: string;
  freshnessRequirement: string;
  privacyClass: PrivacyClass;
  authorizedBy?: "USER" | "PD_009_POLICY";
  authorizedAt?: string;
  digest: string;
};

export type ExternalQueryBranch = {
  branchId: string;
  label: string;
  conceptIds: string[];
  exactTerms: string[];
  query: string;
  modality?: string;
};

export type ExternalQueryPlan = {
  queryPlanId: string;
  revision: number;
  digest: string;
  requestRef: string;
  requestRevision: number;
  internalResultRef: string;
  providerId: string;
  decisionRef: string;
  resolvedConceptIds: string[];
  unresolvedConcepts: string[];
  relations: string[];
  branches: ExternalQueryBranch[];
  exclusions: string[];
  filters: {
    publicationDateFrom?: string;
    publicationDateTo?: string;
    language?: string;
  };
  parameters: {
    database: "pubmed";
    sort: "relevance";
    pageSize: number;
    maxPages: number;
    maxResults: number;
  };
  evidenceIntent: "DISCOVERY_CANDIDATES_ONLY";
  freshnessRequirement: string;
  contextDigest: string;
  minimizedContextFields: string[];
  redactedContextFields: string[];
  generatedBy: "DETERMINISTIC_QUERY_PLANNER_V1_2";
};

export type ExternalDocumentStatus = "CURRENT" | "CORRECTED" | "RETRACTED";
export type ExternalEligibility =
  | "FULL_TEXT_ACCESSIBLE"
  | "ABSTRACT_ONLY"
  | "METADATA_ONLY"
  | "CORRECTED"
  | "RETRACTED"
  | "DUPLICATE"
  | "UNSUPPORTED_DOCUMENT_TYPE"
  | "INACCESSIBLE";

export type ExternalRelatedArticle = {
  relationType: string;
  pmid?: string;
  citation?: string;
};

export type ExternalCandidateSource = {
  sourceIdentity: string;
  sourceRevision: string;
  providerId: string;
  status: "SOURCE_CANDIDATE";
  origin: Extract<KnowledgeContentOrigin, "EXTERNAL_CANDIDATE">;
  pmid: string;
  doi?: string;
  pmcid?: string;
  title: string;
  authors: string[];
  journal?: string;
  publicationYear?: string;
  publicationDate?: string;
  dateRevised?: string;
  publicationTypes: string[];
  language?: string;
  abstractText?: string;
  abstractSections: Array<{ label: string; text: string }>;
  documentStatus: ExternalDocumentStatus;
  eligibility: ExternalEligibility;
  accessLocator: string;
  fullTextLocator?: string;
  relatedArticles: ExternalRelatedArticle[];
  branchIds: string[];
  duplicateOf?: string;
  exclusionReasons: string[];
  metadataRetrievedAt: string;
};

export type ExternalCandidateAssertion = {
  assertionId: string;
  revision: string;
  status: "ASSERTION_CANDIDATE";
  origin: Extract<KnowledgeContentOrigin, "EXTERNAL_CANDIDATE">;
  sourceIdentity: string;
  sourceRevision: string;
  claim: string;
  supportExact: string;
  supportRepresentation: "EXACT_ABSTRACT_EXCERPT";
  supportWasTruncated: boolean;
  locator: string;
  context: {
    branchIds: string[];
    extractedPopulation: string | "NOT_EXTRACTED";
    extractedMethod: string | "NOT_EXTRACTED";
    studyType: string[];
  };
  limitations: string[];
  extractionMethod: "DETERMINISTIC_STRUCTURED_CONCLUSION_EXCERPT_V1";
  extractionModel: null;
  technicalConfidence: "HIGH" | "MEDIUM";
  scientificEvidenceLevel: "NOT_ASSIGNED";
  applicability: ApplicabilityState;
  applicabilityReasons: string[];
};

export type ExternalEvidenceLink = {
  evidenceId: string;
  assertionId: string;
  sourceIdentity: string;
  relation: RuntimeEvidenceLink["relation"];
  locator: string;
  limitations: string[];
  status: "CANDIDATE_EVIDENCE";
};

export type ExternalSearchErrorCode =
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "MALFORMED_RESPONSE"
  | "PARTIAL_PAGINATION"
  | "NETWORK_ERROR";

export type ExternalProviderRequestTrace = {
  requestId: string;
  branchId: string;
  operation: "ESEARCH" | "EFETCH";
  url: string;
  startedAt: string;
  completedAt: string;
  httpStatus?: number;
  attempt: number;
  responseDigest?: string;
  errorCode?: ExternalSearchErrorCode;
};

export type ExternalProviderResponseSnapshot = {
  requestId: string;
  contentType: string;
  body: string;
  bodyDigest: string;
};

export type ExternalProviderSearchOutput = {
  providerId: string;
  status: "SUCCESS" | "NO_MATCH" | "PARTIAL" | "SOURCE_UNAVAILABLE";
  receivedOrder: string[];
  sources: ExternalCandidateSource[];
  requests: ExternalProviderRequestTrace[];
  responseSnapshots: ExternalProviderResponseSnapshot[];
  errors: Array<{ code: ExternalSearchErrorCode; message: string; branchId: string }>;
  pagination: Array<{
    branchId: string;
    page: number;
    retstart: number;
    returnedIds: string[];
    totalCount: number;
    continuation: "EXHAUSTED" | "AVAILABLE_NOT_FETCHED" | "FAILED";
  }>;
};

export type ExternalEvidenceSearchResult = {
  searchId: string;
  status: "COMPLETED" | "NO_MATCH" | "PARTIAL" | "SOURCE_UNAVAILABLE" | "FORBIDDEN";
  decision: ExternalSearchDecision;
  queryPlan: ExternalQueryPlan | null;
  provider: ExternalSearchProviderDefinition | null;
  candidateSources: ExternalCandidateSource[];
  excludedSources: ExternalCandidateSource[];
  candidateAssertions: ExternalCandidateAssertion[];
  evidence: ExternalEvidenceLink[];
  providerTrace: ExternalProviderRequestTrace[];
  errors: ExternalProviderSearchOutput["errors"];
  pagination: ExternalProviderSearchOutput["pagination"];
  searchExecutedAt: string;
  completedAt: string;
  cache: {
    state: "MISS" | "HIT_HISTORICAL" | "BYPASSED";
    key: string | null;
    originalSearchExecutedAt?: string;
  };
  freshness: {
    requirement: string;
    searchDate: string;
    newestPublicationDate?: string;
    recommendation: string;
  };
  mixedSynthesis: {
    internalConclusionIds: string[];
    externalCandidateAssertionIds: string[];
    externalSourceIds: string[];
    divergences: string[];
    limitation: string;
  };
  humanReviewRequired: true;
  corpusMutation: false;
  digest: string;
};

export interface ExternalSearchProvider {
  readonly definition: ExternalSearchProviderDefinition;
  search(plan: ExternalQueryPlan): Promise<ExternalProviderSearchOutput>;
}
