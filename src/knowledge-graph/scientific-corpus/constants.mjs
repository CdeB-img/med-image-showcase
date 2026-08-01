export const SCIENTIFIC_CORPUS_VERSION = "1.0.0-ecv-t1-pilot";
export const SCIENTIFIC_CORPUS_DOMAIN = "ecv-t1";
export const SCIENTIFIC_CORPUS_RETRIEVED_AT = "2026-07-31T00:00:00.000Z";
export const SCIENTIFIC_CORPUS_REVIEWER = "noxia-scientific-corpus-builder";
export const SCIENTIFIC_CORPUS_REVIEW_TYPE = "automatedStructuralReview";

export const PUBLICATION_GUARDS = Object.freeze({
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

export const reviewStateOrder = Object.freeze([
  "DRAFT",
  "EXTRACTED",
  "SOURCE_LOCALIZED",
  "REVIEWED",
  "VERIFIED",
  "QUALIFIED",
  "CONTESTED",
  "SUPERSEDED",
  "RETRACTED",
  "REJECTED",
]);

export const synthesisStates = Object.freeze([
  "CONVERGENCE",
  "PARTIAL_CONVERGENCE",
  "CONTEXT_DEPENDENT_CONVERGENCE",
  "CONTRADICTION",
  "INSUFFICIENT_EVIDENCE",
  "OPEN_QUESTION",
  "CURRENT_CONSENSUS",
  "HISTORICAL_POSITION",
  "SUPERSEDED_POSITION",
]);

