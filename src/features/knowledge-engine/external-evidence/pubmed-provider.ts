import { logicalDigest, normalizeScientificText, uniqueSorted } from "../canonical";
import type {
  ExternalCandidateSource,
  ExternalDocumentStatus,
  ExternalProviderRequestTrace,
  ExternalProviderResponseSnapshot,
  ExternalProviderSearchOutput,
  ExternalQueryPlan,
  ExternalRelatedArticle,
  ExternalSearchErrorCode,
  ExternalSearchProvider,
  ExternalSearchProviderDefinition,
} from "./types";

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export const PUBMED_EXTERNAL_PROVIDER = Object.freeze({
  providerId: "pubmed-ncbi",
  authority: "U.S. National Library of Medicine — PubMed / NCBI E-utilities",
  queryCapabilities: ["DISCOVERY", "METADATA", "ABSTRACT_RETRIEVAL", "IDENTITY_RESOLUTION"],
  supportedFilters: ["Title/Abstract terms", "publication date", "language", "offset pagination", "relevance sort"],
  rateLimitBehavior: {
    unauthenticatedRequestsPerSecond: 3,
    maxRetries: 1,
    retryableStatuses: [429, 502, 503, 504],
  },
  pagination: { strategy: "OFFSET", defaultPageSize: 6, maximumPageSize: 20 },
  resultIdentity: ["PMID", "DOI", "PMCID"],
  revisionIdentity: ["PMID", "DateRevised", "publication status", "correction/retraction links", "DOI"],
  sourceLocatorSupport: ["PUBMED_RECORD", "ABSTRACT_SECTION", "PMC_LINK"],
  abstractAvailability: "WHEN_DEPOSITED",
  fullTextAvailability: "LINK_ONLY_WHEN_PMCID_PRESENT",
  knownLimitations: [
    "PUBMED_IS_A_DISCOVERY_AND_BIBLIOGRAPHIC_PROVIDER_NOT_A_SCIENTIFIC_AUTHORITY",
    "ABSTRACTS_MAY_BE_INCOMPLETE_OR_COPYRIGHTED",
    "PMCID_LINK_IS_NOT_AUTOMATIC_FULL_TEXT_EXTRACTION",
    "SEARCH_RESULTS_CAN_CHANGE_AFTER_THE_RECORDED_EXECUTION",
    "V1_2_SHORTLIST_IS_BOUNDED_AND_DOES_NOT_CLAIM_EXHAUSTIVE_LITERATURE_COVERAGE",
  ],
  availability: "AVAILABLE",
  privacyBoundary: {
    allowedClasses: ["PUBLIC"],
    transmittedFields: ["governed scientific query terms", "publication date filters", "pagination", "sort"],
    forbiddenFields: ["original free text", "patient data", "project identity", "site", "documents", "confidential context", "secrets"],
  },
} satisfies ExternalSearchProviderDefinition);

type FetchLike = typeof fetch;

class ProviderRequestError extends Error {
  constructor(
    readonly code: ExternalSearchErrorCode,
    message: string,
    readonly httpStatus?: number,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ProviderRequestError";
  }
}

const isProviderRequestError = (error: unknown): error is ProviderRequestError => error instanceof ProviderRequestError
  || (Boolean(error) && typeof error === "object" && "code" in error && "message" in error);

const monthNumber = (value: string) => {
  const months: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  return months[value] ?? (/^\d{1,2}$/.test(value) ? value.padStart(2, "0") : "");
};

const dateFromNode = (node: Element | null) => {
  if (!node) return undefined;
  const year = node.querySelector("Year")?.textContent?.trim() ?? "";
  const month = monthNumber(node.querySelector("Month")?.textContent?.trim() ?? "");
  const day = node.querySelector("Day")?.textContent?.trim().padStart(2, "0") ?? "";
  if (year) return [year, month, day].filter(Boolean).join("-");
  return normalizeScientificText(node.querySelector("MedlineDate")?.textContent ?? "") || undefined;
};

const authorNames = (article: Element) => [...article.querySelectorAll("AuthorList > Author")].map((author) => {
  const collective = normalizeScientificText(author.querySelector("CollectiveName")?.textContent ?? "");
  if (collective) return collective;
  return normalizeScientificText([author.querySelector("ForeName")?.textContent, author.querySelector("LastName")?.textContent].filter(Boolean).join(" "));
}).filter(Boolean);

const relatedArticles = (article: Element): ExternalRelatedArticle[] => [...article.querySelectorAll("CommentsCorrections")].map((item) => ({
  relationType: item.getAttribute("RefType") ?? "UNKNOWN",
  pmid: normalizeScientificText(item.querySelector("PMID")?.textContent ?? "") || undefined,
  citation: normalizeScientificText(item.querySelector("RefSource")?.textContent ?? "") || undefined,
}));

const documentStatus = (publicationTypes: string[], related: ExternalRelatedArticle[]): ExternalDocumentStatus => {
  const types = publicationTypes.map((item) => item.toLocaleLowerCase("en-US"));
  const relations = related.map((item) => item.relationType.toLocaleLowerCase("en-US"));
  if (types.includes("retracted publication") || relations.some((item) => item.includes("retraction"))) return "RETRACTED";
  if (types.includes("published erratum") || relations.some((item) => item.includes("erratum") || item.includes("correctedandrepublished"))) return "CORRECTED";
  return "CURRENT";
};

export const parsePubMedSearchResponse = (raw: string) => {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new ProviderRequestError("MALFORMED_RESPONSE", "La réponse ESearch n’est pas un JSON valide."); }
  const result = (parsed as { esearchresult?: unknown })?.esearchresult as { count?: unknown; retstart?: unknown; retmax?: unknown; idlist?: unknown } | undefined;
  if (!result || !Array.isArray(result.idlist) || result.idlist.some((id) => typeof id !== "string")) throw new ProviderRequestError("MALFORMED_RESPONSE", "La réponse ESearch ne contient pas de liste PMID exploitable.");
  const count = Number(result.count);
  const retstart = Number(result.retstart);
  const retmax = Number(result.retmax);
  if (![count, retstart, retmax].every(Number.isFinite)) throw new ProviderRequestError("MALFORMED_RESPONSE", "La pagination ESearch est invalide.");
  return { count, retstart, retmax, ids: result.idlist as string[] };
};

export const parsePubMedFetchXml = (raw: string, retrievedAt: string, branchId: string): ExternalCandidateSource[] => {
  const document = new DOMParser().parseFromString(raw, "application/xml");
  if (document.querySelector("parsererror")) throw new ProviderRequestError("MALFORMED_RESPONSE", "La réponse EFetch n’est pas un XML PubMed valide.");
  return [...document.querySelectorAll("PubmedArticle")].map((record) => {
    const pmid = normalizeScientificText(record.querySelector("MedlineCitation > PMID")?.textContent ?? "");
    const title = normalizeScientificText(record.querySelector("ArticleTitle")?.textContent ?? "");
    if (!pmid || !title) throw new ProviderRequestError("MALFORMED_RESPONSE", "Un enregistrement PubMed ne possède pas de PMID ou de titre.");
    const articleIds = [...record.querySelectorAll("PubmedData > ArticleIdList > ArticleId")];
    const doi = normalizeScientificText(articleIds.find((item) => item.getAttribute("IdType") === "doi")?.textContent ?? "").toLocaleLowerCase("en-US") || undefined;
    const pmcid = normalizeScientificText(articleIds.find((item) => item.getAttribute("IdType") === "pmc")?.textContent ?? "") || undefined;
    const abstractSections = [...record.querySelectorAll("Article > Abstract > AbstractText")].map((section) => ({
      label: normalizeScientificText(section.getAttribute("Label") ?? section.getAttribute("NlmCategory") ?? "UNLABELED").toLocaleUpperCase("en-US"),
      text: normalizeScientificText(section.textContent ?? ""),
    })).filter((section) => section.text);
    const publicationTypes = uniqueSorted([...record.querySelectorAll("PublicationTypeList > PublicationType")].map((item) => normalizeScientificText(item.textContent ?? "")).filter(Boolean));
    const related = relatedArticles(record);
    const status = documentStatus(publicationTypes, related);
    const publicationDate = dateFromNode(record.querySelector("Article > Journal > JournalIssue > PubDate")) ?? dateFromNode(record.querySelector("ArticleDate"));
    const dateRevisedNode = record.querySelector("MedlineCitation > DateRevised");
    const dateRevised = dateRevisedNode ? [dateRevisedNode.querySelector("Year")?.textContent?.trim(), monthNumber(dateRevisedNode.querySelector("Month")?.textContent?.trim() ?? ""), dateRevisedNode.querySelector("Day")?.textContent?.trim().padStart(2, "0")].filter(Boolean).join("-") : undefined;
    const eligibility = status === "RETRACTED" ? "RETRACTED" as const : status === "CORRECTED" ? "CORRECTED" as const : pmcid ? "FULL_TEXT_ACCESSIBLE" as const : abstractSections.length ? "ABSTRACT_ONLY" as const : "METADATA_ONLY" as const;
    const revisionMaterial = { pmid, doi, pmcid, dateRevised, status, related, publicationTypes };
    return {
      sourceIdentity: `pubmed:pmid:${pmid}`,
      sourceRevision: `pubmed-revision:${logicalDigest(revisionMaterial)}`,
      providerId: "pubmed-ncbi",
      status: "SOURCE_CANDIDATE" as const,
      origin: "EXTERNAL_CANDIDATE" as const,
      pmid,
      doi,
      pmcid,
      title,
      authors: authorNames(record),
      journal: normalizeScientificText(record.querySelector("Journal > Title")?.textContent ?? record.querySelector("Journal > ISOAbbreviation")?.textContent ?? "") || undefined,
      publicationYear: publicationDate?.match(/^\d{4}/)?.[0],
      publicationDate,
      dateRevised,
      publicationTypes,
      language: normalizeScientificText(record.querySelector("Article > Language")?.textContent ?? "") || undefined,
      abstractText: abstractSections.map((section) => section.text).join(" ") || undefined,
      abstractSections,
      documentStatus: status,
      eligibility,
      accessLocator: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      fullTextLocator: pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/` : undefined,
      relatedArticles: related,
      branchIds: [branchId],
      exclusionReasons: [],
      metadataRetrievedAt: retrievedAt,
    };
  });
};

export class PubMedExternalSearchProvider implements ExternalSearchProvider {
  readonly definition = PUBMED_EXTERNAL_PROVIDER;
  private requestCount = 0;

  constructor(
    private readonly fetchImpl: FetchLike = fetch,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly delay: (milliseconds: number) => Promise<void> = (milliseconds) => new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds)),
    private readonly timeoutMs = 10_000,
  ) {}

  private async request(
    url: string,
    branchId: string,
    operation: ExternalProviderRequestTrace["operation"],
    requests: ExternalProviderRequestTrace[],
    snapshots: ExternalProviderResponseSnapshot[],
  ) {
    for (let attempt = 1; attempt <= this.definition.rateLimitBehavior.maxRetries + 1; attempt += 1) {
      if (this.requestCount > 0) await this.delay(350);
      this.requestCount += 1;
      const startedAt = this.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, { signal: controller.signal });
        const body = await response.text();
        const completedAt = this.now();
        const responseDigest = logicalDigest(body);
        const trace: ExternalProviderRequestTrace = {
          requestId: `external-provider-request:${logicalDigest({ url, branchId, operation, attempt, startedAt })}`,
          branchId,
          operation,
          url,
          startedAt,
          completedAt,
          httpStatus: response.status,
          attempt,
          responseDigest,
        };
        if (!response.ok) {
          const retryable = this.definition.rateLimitBehavior.retryableStatuses.includes(response.status);
          const code: ExternalSearchErrorCode = response.status === 429 ? "RATE_LIMITED" : response.status >= 500 ? "PROVIDER_UNAVAILABLE" : "NETWORK_ERROR";
          requests.push({ ...trace, errorCode: code });
          if (retryable && attempt <= this.definition.rateLimitBehavior.maxRetries) {
            const retryAfter = Number(response.headers.get("Retry-After"));
            await this.delay(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1_000, 2_000) : 500);
            continue;
          }
          throw new ProviderRequestError(code, `Le provider PubMed a répondu HTTP ${response.status}.`, response.status);
        }
        requests.push(trace);
        snapshots.push({ requestId: trace.requestId, contentType: response.headers.get("Content-Type") ?? "application/octet-stream", body, bodyDigest: responseDigest });
        return body;
      } catch (error) {
        if (isProviderRequestError(error)) throw error;
        const completedAt = this.now();
        const code: ExternalSearchErrorCode = controller.signal.aborted ? "TIMEOUT" : "NETWORK_ERROR";
        requests.push({
          requestId: `external-provider-request:${logicalDigest({ url, branchId, operation, attempt, startedAt })}`,
          branchId,
          operation,
          url,
          startedAt,
          completedAt,
          attempt,
          errorCode: code,
        });
        throw new ProviderRequestError(code, code === "TIMEOUT" ? "Le provider PubMed n’a pas répondu avant le délai borné." : "Le réseau n’a pas permis de joindre PubMed.");
      } finally {
        clearTimeout(timer);
      }
    }
    throw new ProviderRequestError("PROVIDER_UNAVAILABLE", "Le provider PubMed est indisponible.");
  }

  async search(plan: ExternalQueryPlan): Promise<ExternalProviderSearchOutput> {
    const requests: ExternalProviderRequestTrace[] = [];
    const responseSnapshots: ExternalProviderResponseSnapshot[] = [];
    const sources: ExternalCandidateSource[] = [];
    const receivedOrder: string[] = [];
    const errors: ExternalProviderSearchOutput["errors"] = [];
    const pagination: ExternalProviderSearchOutput["pagination"] = [];

    for (const branch of plan.branches) {
      for (let page = 0; page < plan.parameters.maxPages && receivedOrder.length < plan.parameters.maxResults; page += 1) {
        const retstart = page * plan.parameters.pageSize;
        const searchUrl = new URL(`${EUTILS_BASE}/esearch.fcgi`);
        searchUrl.searchParams.set("db", "pubmed");
        searchUrl.searchParams.set("term", branch.query);
        searchUrl.searchParams.set("retmode", "json");
        searchUrl.searchParams.set("sort", plan.parameters.sort);
        searchUrl.searchParams.set("retstart", String(retstart));
        searchUrl.searchParams.set("retmax", String(Math.min(plan.parameters.pageSize, plan.parameters.maxResults - receivedOrder.length)));
        searchUrl.searchParams.set("tool", "noxia_protocol_designer");
        if (plan.filters.publicationDateFrom) {
          searchUrl.searchParams.set("datetype", "pdat");
          searchUrl.searchParams.set("mindate", plan.filters.publicationDateFrom.replace(/-/g, "/"));
        }
        if (plan.filters.publicationDateTo) searchUrl.searchParams.set("maxdate", plan.filters.publicationDateTo.replace(/-/g, "/"));
        try {
          const searchRaw = await this.request(searchUrl.toString(), branch.branchId, "ESEARCH", requests, responseSnapshots);
          const search = parsePubMedSearchResponse(searchRaw);
          const ids = search.ids.slice(0, plan.parameters.maxResults - receivedOrder.length);
          receivedOrder.push(...ids);
          if (!ids.length) {
            pagination.push({ branchId: branch.branchId, page, retstart, returnedIds: [], totalCount: search.count, continuation: "EXHAUSTED" });
            break;
          }
          const fetchUrl = new URL(`${EUTILS_BASE}/efetch.fcgi`);
          fetchUrl.searchParams.set("db", "pubmed");
          fetchUrl.searchParams.set("id", ids.join(","));
          fetchUrl.searchParams.set("retmode", "xml");
          fetchUrl.searchParams.set("tool", "noxia_protocol_designer");
          const fetchRaw = await this.request(fetchUrl.toString(), branch.branchId, "EFETCH", requests, responseSnapshots);
          const parsed = parsePubMedFetchXml(fetchRaw, this.now(), branch.branchId);
          sources.push(...parsed);
          const missingIds = ids.filter((id) => !parsed.some((source) => source.pmid === id));
          if (missingIds.length) {
            errors.push({ code: "PARTIAL_PAGINATION", message: `EFetch n’a pas retourné ${missingIds.length} PMID attendus.`, branchId: branch.branchId });
            pagination.push({ branchId: branch.branchId, page, retstart, returnedIds: ids, totalCount: search.count, continuation: "FAILED" });
            break;
          }
          const hasMore = search.count > retstart + ids.length;
          const canContinue = hasMore && page + 1 < plan.parameters.maxPages && receivedOrder.length < plan.parameters.maxResults;
          pagination.push({ branchId: branch.branchId, page, retstart, returnedIds: ids, totalCount: search.count, continuation: canContinue ? "AVAILABLE_NOT_FETCHED" : hasMore ? "AVAILABLE_NOT_FETCHED" : "EXHAUSTED" });
          if (!canContinue) {
            if (hasMore) errors.push({ code: "PARTIAL_PAGINATION", message: "La shortlist bornée n’épuise pas tous les résultats PubMed ; la continuation est conservée.", branchId: branch.branchId });
            break;
          }
        } catch (error) {
          const providerError = isProviderRequestError(error) ? error : new ProviderRequestError("NETWORK_ERROR", "Erreur réseau non qualifiée.");
          errors.push({ code: providerError.code, message: providerError.message, branchId: branch.branchId });
          pagination.push({ branchId: branch.branchId, page, retstart, returnedIds: [], totalCount: 0, continuation: "FAILED" });
          break;
        }
      }
    }

    const status = errors.length
      ? sources.length ? "PARTIAL" as const : "SOURCE_UNAVAILABLE" as const
      : sources.length ? "SUCCESS" as const : "NO_MATCH" as const;
    return { providerId: this.definition.providerId, status, receivedOrder, sources, requests, responseSnapshots, errors, pagination };
  }
}
