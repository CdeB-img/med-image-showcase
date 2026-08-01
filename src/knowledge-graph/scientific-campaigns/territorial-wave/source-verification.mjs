import { sha256Digest } from "../../migration/stable-json.mjs";
import { P11_EXECUTED_AT } from "./constants.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};

const records = [
  ["28992817", "PMC5633041", "2017-10-09", "CORRECTED", ["Reference ranges", "T2 mapping acquisition"], "https://pmc.ncbi.nlm.nih.gov/articles/PMC5804075/", []],
  ["35600490", "PMC9120534", "2022-05-06", "CURRENT", ["Metrology terminology", "T2 mapping technical comparison"], null, []],
  ["32460852", "PMC7254724", "2020-05-28", "CURRENT", ["Abstract, Results"], null, []],
  ["36935515", "PMC10026458", "2023-03-20", "CURRENT", ["Results, short-term reproducibility", "Results, long-term reproducibility"], null, []],
  ["35659266", "PMC9167641", "2022-06-06", "CURRENT", ["T2 mapping methodology", "Technical limitations"], null, []],
  ["26267831", "PMC4666097", "2015-12-01", "CURRENT", ["Truth and Reference Values", "Bias", "Study Design Considerations"], null, []],
  ["24919831", "PMC5574197", "2015-02-01", "CURRENT", ["Introduction", "Study claim and strata", "Statistical design"], null, []],
  ["39377680", "PMC11537247", "2024-10-01", "CURRENT", ["Conditions for the ADC Profile Claims to Be Valid"], null, ["39377677"]],
  ["39656118", "PMC11694077", "2024-12-01", "CURRENT", ["Abstract"], null, ["39656120"]],
  ["34455593", "PMC8882689", "2022-04-01", "CURRENT", ["Introduction", "Evaluating repeatability and reproducibility"], null, []],
  ["37774317", "PMC10860967", "2023-11-20", "CURRENT", ["Abstract, Results"], null, []],
  ["26250565", "PMC4588759", "2015-09-01", "CURRENT", ["Abstract"], null, ["26293326", "26359146"]],
  ["32516388", "PMC7523451", "2020-09-29", "CURRENT", ["Post-Processing Leakage Correction"], null, []],
  ["30519867", "PMC6351513", "2019-03-01", "CURRENT", ["Introduction"], null, ["30685796"]],
  ["32634594", "PMC7592419", "2020-10-15", "CURRENT", ["Introduction", "Cerebral blood flow", "Multitracer timing", "Kinetic-model outputs", "Cerebral blood flow and cerebral blood volume"], null, []],
  ["20700768", "PMC3128261", "2011-08-01", "CURRENT", ["Abstract, Results"], null, []],
  ["32643207", "PMC9973312", "2021-01-01", "CURRENT", ["Results"], null, []],
  ["33243071", "PMC8221765", "2021-07-01", "CURRENT", ["Abstract and Results"], null, []],
  ["22517498", "PMC3404231", "2013-03-01", "CURRENT", ["Framework of the CMRO2 measurement", "Discussion, limitations"], null, []],
];

export const p11SourceVerification = freeze(Object.fromEntries(records.map(([pmid, pmcid, publicationDate, documentStatus, verifiedSections, correctionNoticeUrl, editorialCommentPmids]) => {
  const material = {
    pmid,
    pmcid,
    publicationDate,
    documentStatus,
    metadataUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    fullTextUrl: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`,
    availability: "OFFICIAL_FULL_TEXT",
    metadataAuthority: "NCBI_PUBMED_ESUMMARY_V2",
    fullTextAuthority: "NCBI_PMC",
    verifiedSections,
    correctionNoticeUrl,
    editorialCommentPmids,
    verifiedAt: P11_EXECUTED_AT,
    retracted: false,
  };
  return [pmid, freeze({ ...material, verificationDigest: sha256Digest(material) })];
})));

export const validatePreparedDomainSources = ({ domainPackage } = {}) => {
  const errors = [];
  const evidenceBySource = Map.groupBy(domainPackage.evidenceLinks, (link) => link.sourceRevisionId);
  for (const source of domainPackage.retainedSources) {
    const verified = p11SourceVerification[source.pmid];
    if (!verified) errors.push({ code: "P11_SOURCE_NOT_OFFICIALLY_VERIFIED", revisionId: source.revisionId });
    if (!/^\d{7,8}$/.test(source.pmid ?? "")) errors.push({ code: "P11_SOURCE_PMID_INVALID", revisionId: source.revisionId });
    if (source.doi && !/^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(source.doi)) errors.push({ code: "P11_SOURCE_DOI_INVALID", revisionId: source.revisionId });
    if (!evidenceBySource.has(source.revisionId)) errors.push({ code: "P11_SOURCE_WITHOUT_ASSERTION", revisionId: source.revisionId });
    if (verified?.retracted) errors.push({ code: "P11_RETRACTED_SOURCE_BLOCKED", revisionId: source.revisionId });
  }
  for (const link of domainPackage.evidenceLinks) {
    const source = domainPackage.retainedSources.find((item) => item.revisionId === link.sourceRevisionId);
    const verified = p11SourceVerification[source?.pmid];
    const section = link.extraction?.section ?? "";
    if (!link.locator || !section || !link.extraction?.analyticalSummary) errors.push({ code: "P11_EVIDENCE_LOCALIZER_INCOMPLETE", evidenceLinkId: link.evidenceLinkId });
    if (verified && !verified.verifiedSections.some((candidate) => section.includes(candidate) || candidate.includes(section.split(" — ")[0]))) errors.push({ code: "P11_EVIDENCE_SECTION_NOT_VERIFIED", evidenceLinkId: link.evidenceLinkId, section });
  }
  const material = {
    domainId: domainPackage.domainId,
    sourceRevisionIds: domainPackage.retainedSources.map((item) => item.revisionId).sort(),
    evidenceLinkIds: domainPackage.evidenceLinks.map((item) => item.evidenceLinkId).sort(),
    verificationDigests: domainPackage.retainedSources.map((item) => p11SourceVerification[item.pmid]?.verificationDigest).filter(Boolean).sort(),
  };
  return freeze({ valid: errors.length === 0, errors: freeze(errors), sources: domainPackage.retainedSources.length, locators: domainPackage.evidenceLinks.length, fullText: domainPackage.retainedSources.length, abstractOnly: 0, digest: sha256Digest(material) });
};

