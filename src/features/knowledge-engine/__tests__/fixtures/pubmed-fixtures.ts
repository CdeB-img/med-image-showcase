import { logicalDigest } from "../../canonical";
import { PUBMED_EXTERNAL_PROVIDER } from "../../external-evidence/pubmed-provider";
import type {
  ExternalCandidateSource,
  ExternalProviderSearchOutput,
  ExternalQueryPlan,
  ExternalSearchProvider,
} from "../../external-evidence/types";

const escapeXml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const pubmedSearchFixture = (ids: string[], count = ids.length, retstart = 0, retmax = Math.max(ids.length, 1)) => JSON.stringify({
  header: { type: "esearch", version: "0.3" },
  esearchresult: { count: String(count), retmax: String(retmax), retstart: String(retstart), idlist: ids },
});

export type PubMedArticleFixtureInput = {
  pmid: string;
  title: string;
  doi?: string;
  pmcid?: string;
  year?: string;
  dateRevised?: string;
  abstractSections?: Array<{ label: string; text: string }>;
  publicationTypes?: string[];
  related?: Array<{ type: string; pmid?: string; citation?: string }>;
  authors?: Array<{ foreName: string; lastName: string }>;
  journal?: string;
};

export const pubmedArticleFixture = (input: PubMedArticleFixtureInput) => {
  const revised = input.dateRevised?.split("-") ?? ["2026", "08", "09"];
  return `<PubmedArticle>
    <MedlineCitation Status="MEDLINE">
      <PMID Version="1">${escapeXml(input.pmid)}</PMID>
      <DateRevised><Year>${revised[0]}</Year><Month>${revised[1]}</Month><Day>${revised[2]}</Day></DateRevised>
      <Article>
        <Journal><JournalIssue><PubDate><Year>${escapeXml(input.year ?? "2026")}</Year></PubDate></JournalIssue><Title>${escapeXml(input.journal ?? "Journal of Governed Fixtures")}</Title></Journal>
        <ArticleTitle>${escapeXml(input.title)}</ArticleTitle>
        <Abstract>${(input.abstractSections ?? []).map((section) => `<AbstractText Label="${escapeXml(section.label)}" NlmCategory="${escapeXml(section.label)}">${escapeXml(section.text)}</AbstractText>`).join("")}</Abstract>
        <AuthorList>${(input.authors ?? [{ foreName: "Ada", lastName: "Lovelace" }]).map((author) => `<Author><LastName>${escapeXml(author.lastName)}</LastName><ForeName>${escapeXml(author.foreName)}</ForeName></Author>`).join("")}</AuthorList>
        <Language>eng</Language>
        <PublicationTypeList>${(input.publicationTypes ?? ["Journal Article"]).map((type) => `<PublicationType>${escapeXml(type)}</PublicationType>`).join("")}</PublicationTypeList>
      </Article>
      ${(input.related ?? []).map((related) => `<CommentsCorrections RefType="${escapeXml(related.type)}">${related.citation ? `<RefSource>${escapeXml(related.citation)}</RefSource>` : ""}${related.pmid ? `<PMID>${escapeXml(related.pmid)}</PMID>` : ""}</CommentsCorrections>`).join("")}
    </MedlineCitation>
    <PubmedData><ArticleIdList><ArticleId IdType="pubmed">${escapeXml(input.pmid)}</ArticleId>${input.doi ? `<ArticleId IdType="doi">${escapeXml(input.doi)}</ArticleId>` : ""}${input.pmcid ? `<ArticleId IdType="pmc">${escapeXml(input.pmcid)}</ArticleId>` : ""}</ArticleIdList></PubmedData>
  </PubmedArticle>`;
};

export const pubmedFetchFixture = (articles: PubMedArticleFixtureInput[]) => `<?xml version="1.0" encoding="UTF-8"?><PubmedArticleSet>${articles.map(pubmedArticleFixture).join("")}</PubmedArticleSet>`;

export const SOURCE_FIXTURES: PubMedArticleFixtureInput[] = [
  {
    pmid: "41000001",
    doi: "10.1000/noxia.1",
    title: "Magnetic resonance imaging and myocardial fibrosis",
    abstractSections: [
      { label: "BACKGROUND", text: "Myocardial fibrosis is studied with magnetic resonance imaging." },
      { label: "CONCLUSIONS", text: "Quantitative magnetic resonance measurements were associated with the prespecified fibrosis reference in this research cohort." },
    ],
  },
  {
    pmid: "41000002",
    doi: "10.1000/noxia.2",
    pmcid: "PMC41000002",
    title: "Computed tomography markers of myocardial fibrosis",
    abstractSections: [
      { label: "METHODS", text: "A research cohort underwent computed tomography." },
      { label: "CONCLUSION", text: "The computed tomography marker remained a candidate measure and requires independent validation." },
    ],
  },
  {
    pmid: "41000003",
    doi: "10.1000/noxia.3",
    title: "Correction to a T1 mapping study",
    publicationTypes: ["Published Erratum"],
    related: [{ type: "ErratumFor", pmid: "41000013", citation: "Original T1 mapping study" }],
    abstractSections: [{ label: "CONCLUSIONS", text: "This correction updates the original record." }],
  },
  {
    pmid: "41000004",
    doi: "10.1000/noxia.4",
    title: "Retracted no-reflow publication",
    publicationTypes: ["Retracted Publication"],
    related: [{ type: "RetractionIn", pmid: "41000014", citation: "Retraction notice" }],
    abstractSections: [{ label: "CONCLUSIONS", text: "This text must never support a current positive conclusion." }],
  },
  {
    pmid: "41000005",
    doi: "10.1000/noxia.5",
    title: "Recent Fourier transform methods in magnetic resonance imaging",
    year: "2026",
    dateRevised: "2026-08-08",
    abstractSections: [{ label: "CONCLUSIONS", text: "The Fourier reconstruction method was evaluated in a magnetic resonance imaging experiment." }],
  },
  {
    pmid: "41000006",
    doi: "10.1000/noxia.6",
    title: "Metadata-only positron emission tomography comparison protocol",
    abstractSections: [],
  },
];

export const parsedSource = (overrides: Partial<ExternalCandidateSource> & Pick<ExternalCandidateSource, "pmid" | "title">): ExternalCandidateSource => ({
  sourceIdentity: `pubmed:pmid:${overrides.pmid}`,
  sourceRevision: `pubmed-revision:${logicalDigest(overrides)}`,
  providerId: "pubmed-ncbi",
  status: "SOURCE_CANDIDATE",
  origin: "EXTERNAL_CANDIDATE",
  authors: ["Ada Lovelace"],
  publicationTypes: ["Journal Article"],
  abstractSections: [],
  documentStatus: "CURRENT",
  eligibility: "ABSTRACT_ONLY",
  accessLocator: `https://pubmed.ncbi.nlm.nih.gov/${overrides.pmid}/`,
  relatedArticles: [],
  branchIds: ["branch:exact"],
  exclusionReasons: [],
  metadataRetrievedAt: "2026-08-09T12:00:00.000Z",
  ...overrides,
});

export const providerOutputFixture = (sources: ExternalCandidateSource[], status: ExternalProviderSearchOutput["status"] = "SUCCESS"): ExternalProviderSearchOutput => ({
  providerId: "pubmed-ncbi",
  status,
  receivedOrder: sources.map((source) => source.pmid),
  sources,
  requests: [{
    requestId: "fixture-request-1",
    branchId: sources[0]?.branchIds[0] ?? "branch:exact",
    operation: "ESEARCH",
    url: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?fixture=1",
    startedAt: "2026-08-09T12:00:00.000Z",
    completedAt: "2026-08-09T12:00:00.100Z",
    httpStatus: status === "SOURCE_UNAVAILABLE" ? 503 : 200,
    attempt: 1,
    responseDigest: "fixture-response-digest",
  }],
  responseSnapshots: [{ requestId: "fixture-request-1", contentType: "application/json", body: "{\"fixture\":true}", bodyDigest: "fixture-response-digest" }],
  errors: status === "SOURCE_UNAVAILABLE" ? [{ code: "PROVIDER_UNAVAILABLE", message: "Fixture provider unavailable.", branchId: "branch:exact" }] : [],
  pagination: [{ branchId: sources[0]?.branchIds[0] ?? "branch:exact", page: 0, retstart: 0, returnedIds: sources.map((source) => source.pmid), totalCount: sources.length, continuation: "EXHAUSTED" }],
});

export class FixtureExternalProvider implements ExternalSearchProvider {
  readonly definition = PUBMED_EXTERNAL_PROVIDER;
  calls = 0;
  plans: ExternalQueryPlan[] = [];

  constructor(private readonly output: ExternalProviderSearchOutput) {}

  async search(plan: ExternalQueryPlan) {
    this.calls += 1;
    this.plans.push(plan);
    return this.output;
  }
}
