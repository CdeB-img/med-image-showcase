export const P10_VERSION = "1.0.0";
export const P10_EXECUTED_AT = "2026-08-01T00:00:00.000Z";
export const P10_CAMPAIGN_ID = "SCIENTIFIC-CAMPAIGN-20260801-001";
export const P10_SELECTED_DOMAIN_ID = "segmentation";
export const P10_SELECTED_NODE_ID = "noxia:knowledge-catalog:domain:segmentation";
export const P10_ADAPTER_ID = "noxia:scientific-campaign-adapter:territorial-reviewed-package:v1";
export const P10_REVIEWER = "noxia-scientific-review-engine";
export const P10_PREPARED_FILE = "src/knowledge-graph/scientific-campaigns/continuous-wave/data.mjs";
export const P10_PREPARED_FILE_SHA256 = "4290cef0ee6cabc1d0c1b4dc2fc74a386db2c75051ccd70448c782582f7d58cb";
export const P10_GIT_SHA = "1fe8196515bab2db556993a8e3fd84459d276b79";

export const P10_PUBLICATION_GUARDS = Object.freeze({
  visibility: "INTERNAL_ONLY",
  targetPath: null,
  route: null,
  canonical: null,
  robots: null,
  indexable: false,
  inSitemap: false,
  rendered: false,
  publicNavigation: false,
  publicPublication: false,
});

export const P10_COVERAGE_STATES = Object.freeze([
  "UNCOVERED",
  "DISCOVERING",
  "SOURCED",
  "ASSERTED",
  "EVIDENCED",
  "SYNTHESIZED",
  "PROJECTED",
  "EDITORIAL_READY",
  "PUBLIC_READY",
]);

export const EMPTY_TERRITORIAL_CAMPAIGN_CORPUS = Object.freeze({
  status: "NOT_EXECUTED",
  campaignId: null,
  domainId: null,
  sourceIdentities: Object.freeze([]),
  sources: Object.freeze([]),
  concepts: Object.freeze([]),
  assertionIdentities: Object.freeze([]),
  assertions: Object.freeze([]),
  evidenceLinks: Object.freeze([]),
  contextDifferences: Object.freeze([]),
  reviewDecisions: Object.freeze([]),
  syntheses: Object.freeze([]),
  projections: Object.freeze([]),
  campaignDefinitionIdentity: null,
  campaignManifest: null,
  campaignExecutionIdentity: null,
  campaignExecutionAttempt: null,
  campaignResult: null,
  campaignExecution: null,
});
