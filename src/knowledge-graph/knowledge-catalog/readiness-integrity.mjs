import { stableStringify } from "../migration/stable-json.mjs";
import { calculateCoverage, calculateReadiness, deriveKnowledgeNodeStatus } from "./coverage-engine.mjs";

export const CATALOG_READINESS_INTEGRITY_VERSION = "1.0.0";

const documentaryOnlyTypes = new Set([
  "Abbreviation", "Definition", "Format", "Publication", "PublicationTopic", "Synonym", "Terminology",
]);
const canonicalSourceId = (value) => String(value).replace(/:revision:\d+$/, "");
const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const duplicates = (values) => unique(values.filter((value, index) => values.indexOf(value) !== index));
const sourceIsAbstractOnly = (source) => Boolean(
  source
  && (source.abstractOnly === true
    || source.metadata?.abstractOnly === true
    || source.fullTextAvailability === "ABSTRACT_ONLY"
    || source.metadata?.fullTextAvailability === "ABSTRACT_ONLY"),
);
const synthesisId = (item) => item.synthesisId ?? item.id;
const projectionId = (item) => item.projectionId ?? item.id;

const registryIndexes = (registry) => {
  const sources = new Map();
  for (const source of registry.sources ?? []) {
    sources.set(source.revisionId, source);
    sources.set(source.stableId, source);
    sources.set(canonicalSourceId(source.revisionId), source);
  }
  return {
    sources,
    assertions: new Map((registry.assertions ?? []).map((item) => [item.revisionId, item])),
    evidence: new Map((registry.evidenceLinks ?? []).map((item) => [item.evidenceLinkId, item])),
    syntheses: new Map((registry.syntheses ?? []).map((item) => [synthesisId(item), item])),
    projections: new Map((registry.projections ?? []).map((item) => [projectionId(item), item])),
  };
};

const validateRegistry = (registry, indexes, errors) => {
  for (const [kind, values, key] of [
    ["SOURCE", registry.sources ?? [], "revisionId"],
    ["ASSERTION", registry.assertions ?? [], "revisionId"],
    ["EVIDENCE", registry.evidenceLinks ?? [], "evidenceLinkId"],
  ]) for (const duplicate of duplicates(values.map((item) => item[key]))) errors.push({ code: `${kind}_REGISTRY_ID_DUPLICATE`, id: duplicate });

  for (const assertion of registry.assertions ?? []) {
    add(errors, !assertion.sourceRefs?.length, "ASSERTION_SOURCE_REQUIRED", { assertionRevisionId: assertion.revisionId });
    for (const sourceRevisionId of assertion.sourceRefs ?? []) add(errors, !indexes.sources.has(sourceRevisionId), "ASSERTION_SOURCE_REVISION_MISSING", { assertionRevisionId: assertion.revisionId, sourceRevisionId });
  }
  for (const link of registry.evidenceLinks ?? []) {
    add(errors, !indexes.sources.has(link.sourceRevisionId), "EVIDENCE_SOURCE_REVISION_MISSING", { evidenceLinkId: link.evidenceLinkId, sourceRevisionId: link.sourceRevisionId });
    add(errors, !indexes.assertions.has(link.assertionRevisionId), "EVIDENCE_ASSERTION_REVISION_MISSING", { evidenceLinkId: link.evidenceLinkId, assertionRevisionId: link.assertionRevisionId });
    add(errors, !String(link.locator ?? "").trim(), "EVIDENCE_LOCATOR_EMPTY", { evidenceLinkId: link.evidenceLinkId });
    const exploitableExtraction = Boolean(
      String(link.extraction?.passage ?? "").trim()
      || String(link.extractedStatement ?? "").trim()
      || String(link.analyticalSummary ?? "").trim(),
    );
    add(errors, link.relationType === "SUPPORTS" && !exploitableExtraction, "SUPPORTS_EXTRACTION_NOT_EXPLOITABLE", { evidenceLinkId: link.evidenceLinkId });
  }
};

const explicitAbstractLimitation = (assertion) => /ABSTRACT[_ -]ONLY/i.test(stableStringify({ limitations: assertion.limitations, scope: assertion.scope, review: assertion.automatedReview }, 0));

const validateNode = (node, indexes, errors) => {
  const provenance = node.provenance ?? {};
  const sourceRevisionIds = unique(provenance.scientificSourceRevisionIds ?? []);
  const assertionRevisionIds = unique(provenance.assertionRevisionIds ?? []);
  const evidenceLinkIds = unique(provenance.evidenceLinkIds ?? []);
  const synthesisIds = unique(provenance.synthesisIds ?? []);
  const projectionIds = unique(provenance.projectionIds ?? []);
  for (const sourceRevisionId of sourceRevisionIds) add(errors, !indexes.sources.has(sourceRevisionId), "NODE_SOURCE_REVISION_MISSING", { nodeId: node.nodeId, sourceRevisionId });
  for (const assertionRevisionId of assertionRevisionIds) add(errors, !indexes.assertions.has(assertionRevisionId), "NODE_ASSERTION_REVISION_MISSING", { nodeId: node.nodeId, assertionRevisionId });
  for (const evidenceLinkId of evidenceLinkIds) add(errors, !indexes.evidence.has(evidenceLinkId), "NODE_EVIDENCE_LINK_MISSING", { nodeId: node.nodeId, evidenceLinkId });
  for (const id of synthesisIds) add(errors, !indexes.syntheses.has(id), "NODE_SYNTHESIS_MISSING", { nodeId: node.nodeId, synthesisId: id });
  for (const id of projectionIds) add(errors, !indexes.projections.has(id), "NODE_PROJECTION_MISSING", { nodeId: node.nodeId, projectionId: id });

  const linkedEvidence = evidenceLinkIds.map((id) => indexes.evidence.get(id)).filter(Boolean);
  const linkedAssertions = assertionRevisionIds.map((id) => indexes.assertions.get(id)).filter(Boolean);
  const linkedScientificSources = unique([
    ...sourceRevisionIds,
    ...linkedEvidence.map((link) => link.sourceRevisionId),
  ]).filter((id) => indexes.sources.has(id));
  const linkedScientificSourceIdentities = unique(linkedScientificSources.map(canonicalSourceId));
  for (const link of linkedEvidence) {
    add(errors, !assertionRevisionIds.includes(link.assertionRevisionId), "NODE_EVIDENCE_ASSERTION_NOT_LINKED", { nodeId: node.nodeId, evidenceLinkId: link.evidenceLinkId, assertionRevisionId: link.assertionRevisionId });
    add(errors, !sourceRevisionIds.includes(link.sourceRevisionId), "NODE_EVIDENCE_SOURCE_NOT_LINKED", { nodeId: node.nodeId, evidenceLinkId: link.evidenceLinkId, sourceRevisionId: link.sourceRevisionId });
  }
  for (const assertion of linkedAssertions) {
    for (const sourceRevisionId of assertion.sourceRefs ?? []) add(errors, !sourceRevisionIds.includes(sourceRevisionId), "NODE_ASSERTION_SOURCE_NOT_LINKED", { nodeId: node.nodeId, assertionRevisionId: assertion.revisionId, sourceRevisionId });
  }

  const expectedSourceCount = documentaryOnlyTypes.has(node.nodeType)
    ? unique(unique(provenance.sourceRevisionIds ?? []).map(canonicalSourceId)).length
    : linkedScientificSourceIdentities.length;
  const expectedMetrics = {
    sourceCount: expectedSourceCount,
    scientificSourceCount: linkedScientificSourceIdentities.length,
    assertionCount: assertionRevisionIds.length,
    evidenceLinkCount: evidenceLinkIds.length,
    localizedEvidenceLinkCount: linkedEvidence.filter((link) => String(link.locator ?? "").trim()).length,
    synthesisCount: synthesisIds.length,
    projectionCount: projectionIds.length,
  };
  for (const [field, expected] of Object.entries(expectedMetrics)) add(errors, node.metrics?.[field] !== expected, "CATALOG_METRIC_REGISTRY_DIVERGENCE", { nodeId: node.nodeId, field, actual: node.metrics?.[field], expected });

  const metricsForRecalculation = { ...node.metrics, ...expectedMetrics };
  const coverage = calculateCoverage({ nodeType: node.nodeType, metrics: metricsForRecalculation });
  const readiness = calculateReadiness({ nodeType: node.nodeType, metrics: metricsForRecalculation, coverage });
  const status = deriveKnowledgeNodeStatus({ sourceStatus: node.sourceStatus, metrics: metricsForRecalculation, readiness, planned: node.planned, modeled: node.modeled });
  add(errors, stableStringify(node.readiness, 0) !== stableStringify(readiness, 0), "CATALOG_READINESS_REGISTRY_DIVERGENCE", { nodeId: node.nodeId });
  add(errors, node.status !== status, "CATALOG_STATUS_REGISTRY_DIVERGENCE", { nodeId: node.nodeId, actual: node.status, expected: status });
  add(errors, node.readiness?.scientificReady?.ready && assertionRevisionIds.length === 0, "SCIENTIFIC_READY_WITHOUT_ASSERTION", { nodeId: node.nodeId });
  add(errors, node.readiness?.provenanceReady?.ready && linkedScientificSources.length === 0 && !documentaryOnlyTypes.has(node.nodeType), "PROVENANCE_READY_WITHOUT_LOCALIZED_SOURCE", { nodeId: node.nodeId });
  add(errors, node.readiness?.synthesisReady?.ready && synthesisIds.length === 0, "SYNTHESIS_READY_WITHOUT_SYNTHESIS", { nodeId: node.nodeId });
  add(errors, node.readiness?.editorialProjectionReady?.ready && projectionIds.length === 0, "EDITORIAL_PROJECTION_READY_WITHOUT_PROJECTION", { nodeId: node.nodeId });
  add(errors, node.status === "PROJECTED" && projectionIds.length === 0, "PROJECTED_WITHOUT_INTERNAL_PROJECTION", { nodeId: node.nodeId });
  add(errors, node.readiness?.publicPublicationReady?.ready && (!node.readiness?.seoReady?.ready || node.metrics?.publicPageCount === 0), "PUBLICATION_READY_WITHOUT_PUBLICATION_CONTRACT", { nodeId: node.nodeId });
  if (node.status === "READY") {
    add(errors, expectedSourceCount === 0, "READY_WITHOUT_SOURCES", { nodeId: node.nodeId });
    add(errors, !documentaryOnlyTypes.has(node.nodeType) && assertionRevisionIds.length === 0, "READY_WITHOUT_ASSERTIONS", { nodeId: node.nodeId });
    add(errors, node.sourceCoverage?.ratio === 0 || (!documentaryOnlyTypes.has(node.nodeType) && node.assertionCoverage?.ratio === 0), "READY_WITH_INSUFFICIENT_COVERAGE", { nodeId: node.nodeId });
  }
  for (const assertion of linkedAssertions) {
    const assertionSources = unique(assertion.sourceRefs ?? []).map((id) => indexes.sources.get(id)).filter(Boolean);
    const readyScope = node.status === "READY" || ["READY", "VERIFIED"].includes(assertion.status);
    if (readyScope && assertionSources.length > 0 && assertionSources.every(sourceIsAbstractOnly) && !explicitAbstractLimitation(assertion)) {
      errors.push({ code: "READY_SCOPE_EXCEEDS_ABSTRACT_ONLY_SOURCE", nodeId: node.nodeId, assertionRevisionId: assertion.revisionId });
    }
  }
};

export const validateCatalogReadinessIntegrity = ({ catalog, registry }) => {
  const errors = [];
  const indexes = registryIndexes(registry);
  validateRegistry(registry, indexes, errors);
  for (const node of catalog.nodes ?? []) validateNode(node, indexes, errors);
  return Object.freeze({
    valid: errors.length === 0,
    version: CATALOG_READINESS_INTEGRITY_VERSION,
    errors: Object.freeze(errors),
    counts: Object.freeze({
      nodes: catalog.nodes?.length ?? 0,
      sources: registry.sources?.length ?? 0,
      assertions: registry.assertions?.length ?? 0,
      evidenceLinks: registry.evidenceLinks?.length ?? 0,
      syntheses: registry.syntheses?.length ?? 0,
      projections: registry.projections?.length ?? 0,
    }),
  });
};
