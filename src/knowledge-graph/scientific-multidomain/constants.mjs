export const P5_VERSION = "1.0.0-multidomain-wave-1";
export const P5_RETRIEVED_AT = "2026-08-01T00:00:00.000Z";
export const P5_REVIEWER = "noxia-scientific-review-engine";
export const P5_REVIEW_TYPE = "automatedScientificReview";

export const P5_DOMAIN_IDS = Object.freeze([
  "diffusion-adc",
  "cerebral-perfusion",
  "myocardial-tissue-characterization",
  "spectral-ct",
]);

export const P5_EVIDENCE_RELATIONS = Object.freeze([
  "SUPPORTS",
  "REFUTES",
  "QUALIFIES",
  "MENTIONS",
  "DERIVES",
  "CORRECTS",
  "RETRACTS",
  "UNRESOLVED_EVIDENCE_LINK",
]);

export const P5_REVIEW_DECISIONS = Object.freeze([
  "AUTOMATED_REVIEW_PASSED",
  "AUTOMATED_REVIEW_QUALIFIED",
  "AUTOMATED_REVIEW_CONTESTED",
  "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE",
  "AUTOMATED_REVIEW_REJECTED",
]);

export const P5_PUBLICATION_GUARDS = Object.freeze({
  route: null,
  canonical: null,
  indexable: false,
  inSitemap: false,
  rendered: false,
  publicNavigation: false,
  publicPublication: false,
  internalOnly: true,
});

export const P5_UNKNOWN = "UNKNOWN";
export const P5_NOT_APPLICABLE = "NOT_APPLICABLE";

