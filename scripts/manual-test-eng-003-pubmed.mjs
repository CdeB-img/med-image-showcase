import { createHash } from "node:crypto";

const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const CASES = [
  {
    id: "FOURIER_MRI",
    query: '"Fourier transform"[Title/Abstract] AND "magnetic resonance imaging"[Title/Abstract]',
  },
  {
    id: "NO_REFLOW_STENTING",
    query: '"no-reflow phenomenon"[Title/Abstract] AND ("percutaneous coronary intervention"[Title/Abstract] OR "stenting"[Title/Abstract])',
  },
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const digest = (value) => createHash("sha256").update(value).digest("hex");
let requestCount = 0;

const request = async (url) => {
  if (requestCount > 0) await wait(400);
  requestCount += 1;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = await response.text();
    if (response.ok) return { status: response.status, body, bodyDigest: digest(body), attempt };
    if (![429, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(`HTTP ${response.status} for ${new URL(url).pathname}`);
    await wait(500);
  }
  throw new Error("Unreachable provider state");
};

const extractIdentity = (xml) => ({
  pmids: [...xml.matchAll(/<PMID(?:\s[^>]*)?>(\d+)<\/PMID>/g)].map((match) => match[1]).filter((value, index, values) => values.indexOf(value) === index),
  dois: [...xml.matchAll(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/g)].map((match) => match[1]),
  pmcids: [...xml.matchAll(/<ArticleId IdType="pmc">([^<]+)<\/ArticleId>/g)].map((match) => match[1]),
});
const requestTrace = (operation, response) => ({ operation, status: response.status, bodyDigest: response.bodyDigest, attempt: response.attempt });

const runCase = async ({ id, query }) => {
  const searchUrl = new URL(`${BASE_URL}/esearch.fcgi`);
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("term", query);
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("sort", "relevance");
  searchUrl.searchParams.set("retmax", "2");
  searchUrl.searchParams.set("tool", "noxia_protocol_designer_manual_eng_003");
  const searchedAt = new Date().toISOString();
  const searchResponse = await request(searchUrl.toString());
  const search = JSON.parse(searchResponse.body).esearchresult;
  const ids = Array.isArray(search?.idlist) ? search.idlist : [];
  if (!ids.length) return { id, query, searchedAt, count: Number(search?.count ?? 0), ids: [], state: "NO_MATCH", requests: [requestTrace("ESEARCH", searchResponse)] };

  const fetchUrl = new URL(`${BASE_URL}/efetch.fcgi`);
  fetchUrl.searchParams.set("db", "pubmed");
  fetchUrl.searchParams.set("id", ids.join(","));
  fetchUrl.searchParams.set("retmode", "xml");
  fetchUrl.searchParams.set("tool", "noxia_protocol_designer_manual_eng_003");
  const fetchResponse = await request(fetchUrl.toString());
  return {
    id,
    query,
    searchedAt,
    count: Number(search.count),
    ids,
    state: "SOURCE_CANDIDATES_RETRIEVED",
    identity: extractIdentity(fetchResponse.body),
    requests: [
      requestTrace("ESEARCH", searchResponse),
      requestTrace("EFETCH", fetchResponse),
    ],
  };
};

const results = [];
for (const testCase of CASES) results.push(await runCase(testCase));
console.log(JSON.stringify({
  purpose: "ENG-003_MANUAL_NETWORK_INTEGRATION_ONLY",
  provider: "PubMed / NCBI E-utilities",
  officialCorpusMutation: false,
  scientificPromotion: false,
  results,
}, null, 2));
