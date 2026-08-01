import { KNOWLEDGE_CATALOG_GENERATED_AT } from "./constants.mjs";

const clamp = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const round = (value, digits = 4) => Number(value.toFixed(digits));
const ratio = (count, target) => target === 0 ? 1 : clamp(count / target);

const documentaryOnlyTypes = new Set([
  "Abbreviation", "Definition", "Format", "Publication", "PublicationTopic", "Synonym", "Terminology",
]);
const aggregateTypes = new Set(["Domain", "ResearchArea"]);

export const coverageLevelFromRatio = (value) => {
  if (value >= 1) return "COMPLETE";
  if (value >= 0.75) return "HIGH";
  if (value >= 0.4) return "PARTIAL";
  if (value > 0) return "LOW";
  return "NONE";
};

export const coverageTargetsForType = (nodeType) => {
  if (aggregateTypes.has(nodeType)) return Object.freeze({ sources: 5, assertions: 12, evidencePerAssertion: 1, syntheses: 1, projections: 1 });
  if (documentaryOnlyTypes.has(nodeType)) return Object.freeze({ sources: 1, assertions: 0, evidencePerAssertion: 0, syntheses: 0, projections: 0 });
  return Object.freeze({ sources: 2, assertions: 2, evidencePerAssertion: 1, syntheses: 1, projections: 1 });
};

const dimension = (count, target, details = {}) => {
  const computedRatio = ratio(count, target);
  return Object.freeze({
    level: coverageLevelFromRatio(computedRatio),
    ratio: round(computedRatio),
    count,
    target,
    ...details,
  });
};

export const calculateCoverage = ({ nodeType, metrics }) => {
  const targets = coverageTargetsForType(nodeType);
  const sourceCoverage = dimension(metrics.sourceCount, targets.sources, {
    scientificSourceCount: metrics.scientificSourceCount,
    fullTextSourceCount: metrics.fullTextSourceCount,
    abstractOnlySourceCount: metrics.abstractOnlySourceCount,
  });
  const assertionCoverage = dimension(metrics.assertionCount, targets.assertions, {
    evidenceLinkCount: metrics.evidenceLinkCount,
    localizedEvidenceLinkCount: metrics.localizedEvidenceLinkCount,
  });
  const evidenceTarget = targets.assertions === 0 ? 0 : Math.max(metrics.assertionCount, targets.assertions) * targets.evidencePerAssertion;
  const evidenceRatio = ratio(metrics.localizedEvidenceLinkCount, evidenceTarget);
  const scientificRatio = round((sourceCoverage.ratio + assertionCoverage.ratio + evidenceRatio) / 3);
  const scientificCoverage = Object.freeze({
    level: coverageLevelFromRatio(scientificRatio),
    ratio: scientificRatio,
    sourceRatio: sourceCoverage.ratio,
    assertionRatio: assertionCoverage.ratio,
    localizedEvidenceRatio: round(evidenceRatio),
    contradictionsPreserved: metrics.contradictionCount,
    openQuestionsPreserved: metrics.openQuestionCount,
  });
  const synthesisRatio = ratio(metrics.synthesisCount, targets.syntheses);
  const internalProjectionRatio = ratio(metrics.projectionCount, targets.projections);
  const editorialRatio = round((synthesisRatio + internalProjectionRatio) / 2);
  const editorialCoverage = Object.freeze({
    level: coverageLevelFromRatio(editorialRatio),
    ratio: editorialRatio,
    synthesisCount: metrics.synthesisCount,
    internalProjectionCount: metrics.projectionCount,
    publicPageCount: metrics.publicPageCount,
  });
  const projectionRatio = metrics.potentialProjectionCount === 0
    ? 0
    : ratio(metrics.projectionCount, metrics.potentialProjectionCount);
  const projectionCoverage = Object.freeze({
    level: coverageLevelFromRatio(projectionRatio),
    ratio: round(projectionRatio),
    actual: metrics.projectionCount,
    potential: metrics.potentialProjectionCount,
    estimatedPages: metrics.potentialPageCount,
  });
  const overallRatio = round((scientificCoverage.ratio + editorialCoverage.ratio + projectionCoverage.ratio) / 3);
  const coverage = Object.freeze({
    level: coverageLevelFromRatio(overallRatio),
    ratio: overallRatio,
    complete: sourceCoverage.ratio === 1 && assertionCoverage.ratio === 1,
    calculation: "MEAN_OF_SCIENTIFIC_EDITORIAL_AND_PROJECTION_DIMENSIONS",
  });
  return Object.freeze({ coverage, scientificCoverage, editorialCoverage, projectionCoverage, sourceCoverage, assertionCoverage, targets });
};

const readinessState = (ready, justification, blockers = [], warnings = []) => Object.freeze({
  ready,
  justification,
  blockers: Object.freeze([...blockers]),
  warnings: Object.freeze([...warnings]),
});

export const calculateReadiness = ({ nodeType, metrics, coverage }) => {
  const documentaryOnly = documentaryOnlyTypes.has(nodeType);
  const catalogReady = readinessState(true, "The KnowledgeNode contract, identity and graph endpoints are complete.");
  const provenanceReady = readinessState(
    metrics.sourceCount > 0 && (documentaryOnly || metrics.assertionCount === 0 || metrics.localizedEvidenceLinkCount >= metrics.assertionCount),
    metrics.sourceCount > 0 ? "Sources are explicitly referenced and scientific assertions retain localized evidence." : "No source is currently attached.",
    metrics.sourceCount > 0 ? [] : ["NO_SOURCE"],
    metrics.abstractOnlySourceCount > 0 ? [`${metrics.abstractOnlySourceCount} abstract-only source(s) remain explicit.`] : [],
  );
  const scientificReady = readinessState(
    !documentaryOnly && metrics.assertionCount > 0 && metrics.localizedEvidenceLinkCount >= metrics.assertionCount,
    !documentaryOnly && metrics.assertionCount > 0 ? "Atomic assertions are connected to localized EvidenceLinks." : "No scientific assertion corpus is available for this node.",
    !documentaryOnly && metrics.assertionCount > 0 ? [] : [documentaryOnly ? "DOCUMENTARY_NODE_NO_ASSERTION_REQUIRED" : "NO_SCIENTIFIC_ASSERTION"],
  );
  const synthesisReady = readinessState(
    metrics.synthesisCount > 0,
    metrics.synthesisCount > 0 ? "At least one deterministic structured synthesis includes this node." : "No deterministic synthesis includes this node.",
    metrics.synthesisCount > 0 ? [] : ["NO_SYNTHESIS"],
  );
  const editorialProjectionReady = readinessState(
    metrics.projectionCount > 0,
    metrics.projectionCount > 0 ? "At least one guarded internal projection includes this node." : "Only virtual projection capabilities are available.",
    metrics.projectionCount > 0 ? [] : ["NO_INTERNAL_PROJECTION"],
  );
  const seoReady = readinessState(false, "The catalogue creates no SEO artifact.", ["NO_SEO_ARTIFACT"]);
  const publicPublicationReady = readinessState(false, "P6 is an internal planning layer and creates no public content or route.", ["PUBLICATION_OUT_OF_SCOPE", "NO_PUBLIC_CONTENT", "NO_ROUTE", "NO_CANONICAL"]);
  return Object.freeze({ catalogReady, scientificReady, provenanceReady, synthesisReady, editorialProjectionReady, seoReady, publicPublicationReady, coverageComplete: coverage.coverage.complete });
};

export const deriveKnowledgeNodeStatus = ({ sourceStatus, metrics, readiness, planned = false, modeled = false }) => {
  if (/obsolete/i.test(sourceStatus ?? "")) return "OBSOLETE";
  if (/deprecated|retracted/i.test(sourceStatus ?? "")) return "DEPRECATED";
  if (metrics.publicPageCount > 0) return "PUBLISHED";
  if (metrics.projectionCount > 0) return "PROJECTED";
  if (readiness.scientificReady.ready && readiness.provenanceReady.ready) return "READY";
  if (metrics.assertionCount > 0 && metrics.localizedEvidenceLinkCount > 0) return "UNDER_REVIEW";
  if (metrics.assertionCount > 0) return "ASSERTIONS";
  if (modeled && metrics.sourceCount > 0) return "MODELING";
  if (metrics.sourceCount > 0) return "SOURCING";
  if (planned) return "DISCOVERING";
  return "NOT_STARTED";
};

export const calculateNextReview = (lastReview, status) => {
  const date = new Date(lastReview || KNOWLEDGE_CATALOG_GENERATED_AT);
  const days = status === "PROJECTED" || status === "READY" || status === "PUBLISHED" ? 365
    : status === "DEPRECATED" || status === "OBSOLETE" ? 730
      : status === "NOT_STARTED" || status === "DISCOVERING" ? 180
        : 90;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};
