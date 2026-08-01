import { createSourceRevision } from "../scientific-model-factories.mjs";
import { sha256Digest } from "../migration/stable-json.mjs";
import { selectedSourceRecords, scientificSourceIdentities, scientificSourceRevisions } from "../scientific-corpus/sources.mjs";
import { officialBibliographyByPmid } from "./bibliography.mjs";
import { P4R_CONSOLIDATED_AT } from "./constants.mjs";

const consensusPmids = new Set(["24124732", "28992817"]);
const guidelinePmids = new Set(["30545455", "32089132", "32160925"]);
const correctionPmids = new Set(["27902782", "29415744"]);
const officialPublisherFullTextPmids = new Set(["30545455", "37269267"]);

const accessState = (bibliography) => bibliography.pmcid
  ? "PMC_FULL_TEXT"
  : officialPublisherFullTextPmids.has(bibliography.pmid)
    ? "OFFICIAL_PUBLISHER_FULL_TEXT"
    : "ABSTRACT_ONLY";

const classification = (bibliography) => {
  if (correctionPmids.has(bibliography.pmid)) return "CORRECTION_NOTICE";
  if (consensusPmids.has(bibliography.pmid)) return "CONSENSUS_DOCUMENT";
  if (guidelinePmids.has(bibliography.pmid)) return "GUIDELINE_DOCUMENT";
  if (bibliography.pmcid) return "FULL_TEXT_VERIFIED";
  if (officialPublisherFullTextPmids.has(bibliography.pmid)) return "OFFICIAL_FULL_TEXT";
  return "ABSTRACT_ONLY";
};

const locatorFor = (state) => state === "PMC_FULL_TEXT"
  ? "PMC full text verified for P4R"
  : state === "OFFICIAL_PUBLISHER_FULL_TEXT"
    ? "Official publisher full text verified for P4R"
    : "PubMed record and structured abstract only";

const metadataChanges = (before, bibliography, state) => Object.freeze([
  ...(!Array.isArray(before.authors) ? ["AUTHORS_COMPLETED_FROM_PUBMED"] : []),
  ...(!before.metadata?.volume ? ["VOLUME_ADDED"] : []),
  ...(!before.metadata?.issue ? ["ISSUE_ADDED"] : []),
  ...(!before.metadata?.pages ? ["PAGES_OR_ARTICLE_ID_ADDED"] : []),
  ...(before.publicationDate !== bibliography.publicationDate ? ["PUBLICATION_DATE_NORMALIZED"] : []),
  ...(before.title !== bibliography.title ? ["TITLE_NORMALIZED_TO_PUBMED"] : []),
  ...(before.metadata?.fullTextAvailability !== state ? ["ACCESS_STATE_REQUALIFIED"] : []),
]);

export const consolidatedSourceRecords = Object.freeze(selectedSourceRecords.map((selected) => {
  const before = selected.revision;
  const bibliography = officialBibliographyByPmid[before.pmid];
  if (!bibliography) throw new Error(`Missing official P4R bibliography for PMID ${before.pmid}`);
  const state = accessState(bibliography);
  const sourceClassification = classification(bibliography);
  const revisionId = `${before.stableId}:revision:2`;
  const sourceRefs = [...new Set([bibliography.officialMetadataUrl, bibliography.officialFullTextUrl].filter(Boolean))].sort();
  const bibliographicMaterial = {
    ...bibliography,
    sourceClassification,
    accessState: state,
    documentStatus: before.metadata.documentStatus,
  };
  const after = createSourceRevision({
    stableId: before.stableId,
    revisionId,
    revisionNumber: 2,
    sourceType: before.sourceType,
    title: bibliography.title,
    authority: bibliography.journal,
    authors: bibliography.authors,
    publicationDate: bibliography.publicationDate,
    version: "version-of-record-bibliography-verified",
    doi: bibliography.doi,
    pmid: bibliography.pmid,
    url: bibliography.officialFullTextUrl ?? bibliography.officialMetadataUrl,
    locator: locatorFor(state),
    digest: sha256Digest(bibliographicMaterial),
    language: "en",
    status: before.status,
    retrievedAt: P4R_CONSOLIDATED_AT,
    sourceRefs,
    validFrom: P4R_CONSOLIDATED_AT,
    supersedesRevisionId: before.revisionId,
    correctedByRevisionId: before.correctedByRevisionId ? before.correctedByRevisionId.replace(/:revision:1$/, ":revision:2") : null,
    retractedByRevisionId: before.retractedByRevisionId,
    metadata: {
      ...before.metadata,
      journal: bibliography.journal,
      pmcid: bibliography.pmcid,
      volume: bibliography.volume,
      issue: bibliography.issue,
      pages: bibliography.pages,
      publicationTypes: bibliography.publicationTypes,
      officialMetadataUrl: bibliography.officialMetadataUrl,
      officialFullTextUrl: bibliography.officialFullTextUrl,
      metadataAuthority: bibliography.metadataAuthority,
      metadataVerifiedAt: bibliography.metadataVerifiedAt,
      authorsCompleteness: "COMPLETE_FROM_PUBMED",
      digestScope: "VERIFIED_BIBLIOGRAPHIC_METADATA_AND_ACCESS_STATE",
      sourceClassification,
      fullTextAvailability: state,
      fullTextVerified: state !== "ABSTRACT_ONLY",
      abstractOnly: state === "ABSTRACT_ONLY",
      sourceQuality: {
        ...before.metadata.sourceQuality,
        fullTextAvailability: state,
        documentaryStatus: before.metadata.documentStatus,
        limitations: Object.freeze([
          ...before.metadata.sourceQuality.limitations.filter((item) => !/Only the PubMed|PubMed record and abstract/i.test(item)),
          ...(state === "ABSTRACT_ONLY" ? ["P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] : []),
        ]),
      },
    },
  });
  return Object.freeze({
    key: selected.key,
    identity: selected.identity,
    before,
    after,
    bibliography,
    classification: sourceClassification,
    accessState: state,
    metadataChanges: metadataChanges(before, bibliography, state),
    history: Object.freeze([before.revisionId, after.revisionId]),
  });
}).sort((a, b) => a.after.revisionId.localeCompare(b.after.revisionId)));

export const consolidatedSourceIdentities = scientificSourceIdentities;
export const consolidatedSourceRevisions = Object.freeze(consolidatedSourceRecords.map((record) => record.after));
export const consolidatedSourceRevisionHistory = Object.freeze([...scientificSourceRevisions, ...consolidatedSourceRevisions].sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const consolidatedSourceByPreviousRevisionId = Object.freeze(Object.fromEntries(consolidatedSourceRecords.map((record) => [record.before.revisionId, record.after])));
export const consolidatedSourceByPmid = Object.freeze(Object.fromEntries(consolidatedSourceRecords.map((record) => [record.after.pmid, record.after])));

export const supplementalCtSourceAudit = Object.freeze([
  Object.freeze({
    title: "Variation of computed tomography-derived extracellular volume fraction and the impact of protocol parameters: A systematic review and meta-analysis",
    pmid: "38879421",
    doi: "10.1016/j.jcct.2024.06.002",
    url: "https://pubmed.ncbi.nlm.nih.gov/38879421/",
    decision: "EXAMINED_NOT_ADDED",
    reason: "Useful evidence of protocol heterogeneity and need for standardization, but it does not establish CT-ECV intersite reproducibility and overlaps the selected 2023 review set.",
  }),
  Object.freeze({
    title: "Influence of cardiac cycle on myocardial extracellular volume fraction measurements with dual-layer computed tomography",
    pmcid: "PMC11250292",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11250292/",
    decision: "EXAMINED_NOT_ADDED",
    reason: "Reports intra- and interobserver reproducibility in a single-center cardiac-phase study, not intersite reproducibility.",
  }),
  Object.freeze({
    title: "Myocardial extracellular volume measurement using cardiac computed tomography",
    pmcid: "PMC11561108",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11561108/",
    decision: "EXAMINED_NOT_ADDED",
    reason: "Recent technical review confirms protocol and software variability but adds no intersite validation beyond the retained pilot sources.",
  }),
]);

export const sourceConsolidationSummary = Object.freeze({
  preservedP4Sources: consolidatedSourceRecords.length,
  revision2Sources: consolidatedSourceRevisions.length,
  fullText: consolidatedSourceRecords.filter((record) => record.accessState !== "ABSTRACT_ONLY").length,
  abstractOnly: consolidatedSourceRecords.filter((record) => record.accessState === "ABSTRACT_ONLY").length,
  authorsCompleted: consolidatedSourceRecords.filter((record) => record.metadataChanges.includes("AUTHORS_COMPLETED_FROM_PUBMED")).length,
  metadataFieldsCompleted: consolidatedSourceRecords.reduce((total, record) => total + record.metadataChanges.length, 0),
  sourcesUpgradedFromAbstractOnly: consolidatedSourceRecords.filter((record) => record.before.metadata.fullTextAvailability === "ABSTRACT_ONLY" && record.accessState !== "ABSTRACT_ONLY").map((record) => record.after.pmid),
  supplementalCtSourcesExamined: supplementalCtSourceAudit.length,
  ctIntersiteReproducibilityGapPreserved: true,
});

