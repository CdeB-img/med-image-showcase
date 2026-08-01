import { sha256Digest } from "../../migration/stable-json.mjs";

const source = (value) => Object.freeze({
  ...value,
  metadataAuthority: "NCBI_PUBMED_ESUMMARY_V2",
  fullTextAuthority: "NCBI_PMC_OR_PUBMED",
  documentStatus: "CURRENT",
  correctionOrRetractionDetected: false,
  verifiedAt: "2026-08-01T00:00:00.000Z",
  verificationDigest: sha256Digest(value),
});

export const segmentationSourceVerification = Object.freeze({
  "38347141": source({
    pmid: "38347141",
    pmcid: "PMC11182665",
    doi: "10.1038/s41592-023-02151-z",
    title: "Metrics reloaded: recommendations for image analysis validation.",
    publicationDate: "2024-02-12",
    availability: "OFFICIAL_FULL_TEXT",
    metadataUrl: "https://pubmed.ncbi.nlm.nih.gov/38347141/",
    fullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11182665/",
    locators: Object.freeze({
      "problem-fingerprint-guides-metrics": Object.freeze({ section: "INTRO", offset: 5984, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
      "multiple-complementary-metrics": Object.freeze({ section: "INTRO", offset: 11954, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
      "dice-limited-small-structures": Object.freeze({ section: "INTRO", offset: 28133, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
      "hierarchical-aggregation-required": Object.freeze({ section: "INTRO", offset: 28788, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
    }),
  }),
  "26263899": source({
    pmid: "26263899",
    pmcid: "PMC4533825",
    doi: "10.1186/s12880-015-0068-x",
    title: "Metrics for evaluating 3D medical image segmentation: analysis, selection, and tool.",
    publicationDate: "2015-08-12",
    availability: "OFFICIAL_FULL_TEXT",
    metadataUrl: "https://pubmed.ncbi.nlm.nih.gov/26263899/",
    fullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4533825/",
    locators: Object.freeze({
      "zero-overlap-distance-information": Object.freeze({ section: "RESULTS", offset: 65969, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
      "metric-selection-follows-segmentation-properties": Object.freeze({ section: "RESULTS", offset: 86390, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
    }),
  }),
  "15250643": source({
    pmid: "15250643",
    pmcid: "PMC1283110",
    doi: "10.1109/TMI.2004.828354",
    title: "Simultaneous truth and performance level estimation (STAPLE): an algorithm for the validation of image segmentation.",
    publicationDate: "2004-07-01",
    availability: "OFFICIAL_FULL_TEXT_WITH_PUBMED_ABSTRACT_LOCATOR",
    metadataUrl: "https://pubmed.ncbi.nlm.nih.gov/15250643/",
    fullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1283110/",
    locators: Object.freeze({
      "staple-probabilistic-reference": Object.freeze({ section: "ABSTRACT", offset: null, pubmedLines: "238-244", status: "MATCHED_OFFICIAL_PUBMED_ABSTRACT" }),
      "staple-input-performance": Object.freeze({ section: "ABSTRACT", offset: null, pubmedLines: "238-244", status: "MATCHED_OFFICIAL_PUBMED_ABSTRACT" }),
    }),
  }),
  "35840566": source({
    pmid: "35840566",
    pmcid: "PMC9287542",
    doi: "10.1038/s41467-022-30695-9",
    title: "The Medical Segmentation Decathlon.",
    publicationDate: "2022-07-15",
    availability: "OFFICIAL_FULL_TEXT",
    metadataUrl: "https://pubmed.ncbi.nlm.nih.gov/35840566/",
    fullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9287542/",
    locators: Object.freeze({
      "single-task-performance-not-generalization": Object.freeze({ section: "INTRO", offset: 3115, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
      "benchmark-heterogeneity-and-rater-limit": Object.freeze({ section: "DISCUSS", offset: 21744, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
    }),
  }),
  "37008654": source({
    pmid: "37008654",
    pmcid: "PMC10062409",
    doi: "10.1109/access.2023.3249759",
    title: "Assessing Inter-Annotator Agreement for Medical Image Segmentation.",
    publicationDate: "2023-02-27",
    availability: "OFFICIAL_FULL_TEXT",
    metadataUrl: "https://pubmed.ncbi.nlm.nih.gov/37008654/",
    fullTextUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10062409/",
    locators: Object.freeze({
      "agreement-assessment-needed": Object.freeze({ section: "INTRO", offset: 3744, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
      "consensus-plus-metrics-characterizes-variability": Object.freeze({ section: "INTRO", offset: 8986, status: "MATCHED_OFFICIAL_BIOC_FULL_TEXT" }),
    }),
  }),
});

export const validateSegmentationSourceVerification = ({ domainPackage } = {}) => {
  const errors = [];
  const verifiedPmids = Object.keys(segmentationSourceVerification).sort();
  const packagePmids = domainPackage.retainedSources.map((item) => item.pmid).sort();
  if (JSON.stringify(verifiedPmids) !== JSON.stringify(packagePmids)) errors.push({ code: "SEGMENTATION_VERIFIED_SOURCE_SET_MISMATCH", verifiedPmids, packagePmids });
  for (const sourceRevision of domainPackage.retainedSources) {
    const verified = segmentationSourceVerification[sourceRevision.pmid];
    if (!verified) continue;
    for (const field of ["pmcid", "doi", "title"]) if (sourceRevision[field] !== verified[field]) errors.push({ code: "SEGMENTATION_SOURCE_METADATA_MISMATCH", pmid: sourceRevision.pmid, field, prepared: sourceRevision[field], verified: verified[field] });
  }
  for (const assertion of domainPackage.assertions) {
    const sourceRevision = domainPackage.retainedSources.find((item) => item.revisionId === assertion.sourceRefs[0]);
    const locator = segmentationSourceVerification[sourceRevision?.pmid]?.locators?.[assertion.key];
    if (!locator) errors.push({ code: "SEGMENTATION_ASSERTION_LOCATOR_NOT_VERIFIED", assertionRevisionId: assertion.revisionId });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), sources: verifiedPmids.length, locators: Object.values(segmentationSourceVerification).reduce((sum, item) => sum + Object.keys(item.locators).length, 0) });
};
