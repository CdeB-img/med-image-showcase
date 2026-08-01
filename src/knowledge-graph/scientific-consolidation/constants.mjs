export const P4R_VERSION = "1.1.0-ecv-t1-consolidated";
export const P4R_DOMAIN = "ecv-t1";
export const P4R_CONSOLIDATED_AT = "2026-08-01T00:00:00.000Z";
export const P4R_REVIEWER = "noxia-scientific-review-engine";
export const P4R_REVIEW_TYPE = "automatedScientificReview";

export const P4R_REVIEW_DECISIONS = Object.freeze([
  "AUTOMATED_REVIEW_PASSED",
  "AUTOMATED_REVIEW_QUALIFIED",
  "AUTOMATED_REVIEW_CONTESTED",
  "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE",
  "AUTOMATED_REVIEW_REJECTED",
]);

export const P4R_SOURCE_CLASSIFICATIONS = Object.freeze([
  "FULL_TEXT_VERIFIED",
  "OFFICIAL_FULL_TEXT",
  "ABSTRACT_ONLY",
  "METADATA_ONLY",
  "CORRECTION_NOTICE",
  "CONSENSUS_DOCUMENT",
  "GUIDELINE_DOCUMENT",
  "INSUFFICIENT_FOR_ASSERTION",
  "UNRESOLVED",
]);

export const P4R_PUBLICATION_GUARDS = Object.freeze({
  internalOnly: true,
  route: null,
  canonical: null,
  indexable: false,
  inSitemap: false,
  rendered: false,
  publicNavigation: false,
  publicContentGenerated: false,
  statisticalMetaAnalysisPerformed: false,
  clinicalRecommendationEngine: false,
});

