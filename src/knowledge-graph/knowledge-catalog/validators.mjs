import { stableStringify } from "../migration/stable-json.mjs";
import { inspectProtectedSurfaces } from "../scientific-corpus/protected-surfaces.mjs";
import { validateScientificMultidomain } from "../scientific-multidomain/validate.mjs";
import { buildScientificEnrichmentCampaigns, isCampaignCandidate } from "./campaign-engine.mjs";
import { createScientificKnowledgeCatalog, scientificKnowledgeCatalog } from "./catalog-builder.mjs";
import { calculateCoverage } from "./coverage-engine.mjs";
import {
  COVERAGE_LEVELS,
  KNOWLEDGE_CATALOG_SCOPE,
  KNOWLEDGE_NODE_DEPENDENCY_FIELDS,
  KNOWLEDGE_NODE_REQUIRED_FIELDS,
  KNOWLEDGE_NODE_STATUSES,
  KNOWLEDGE_NODE_TYPES,
  PRIORITY_LEVELS,
  PROJECTION_CAPABILITIES,
  READY_LIKE_STATUSES,
  TERMINAL_STATUSES,
} from "./constants.mjs";
import { calculateNodePriority, priorityLevelForScore } from "./priority-engine.mjs";
import { calculateProjectionCapabilities } from "./projection-engine.mjs";

const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const directedFields = Object.freeze(["parents", "dependencies", "prerequisites", "successors", "replacements", "supersededBy", "blockingNodes"]);
const endpointFields = Object.freeze(["parents", "children", "related", ...KNOWLEDGE_NODE_DEPENDENCY_FIELDS]);

const childrenForField = (nodes, field) => {
  if (field !== "parents") return new Map(nodes.map((node) => [node.nodeId, node[field] ?? []]));
  const children = new Map(nodes.map((node) => [node.nodeId, []]));
  for (const node of nodes) for (const parentId of node.parents ?? []) children.get(parentId)?.push(node.nodeId);
  return children;
};

export const hasKnowledgeCatalogCycle = (nodes, field = "parents") => {
  const ids = new Set(nodes.map((node) => node.nodeId));
  const outgoing = childrenForField(nodes, field);
  const indegree = new Map(nodes.map((node) => [node.nodeId, 0]));
  for (const targets of outgoing.values()) for (const targetId of targets) if (ids.has(targetId)) indegree.set(targetId, (indegree.get(targetId) ?? 0) + 1);
  const queue = [...indegree.entries()].filter(([, value]) => value === 0).map(([nodeId]) => nodeId).sort();
  let visited = 0;
  while (queue.length) {
    const nodeId = queue.shift();
    visited += 1;
    for (const targetId of outgoing.get(nodeId) ?? []) {
      if (!ids.has(targetId)) continue;
      indegree.set(targetId, indegree.get(targetId) - 1);
      if (indegree.get(targetId) === 0) { queue.push(targetId); queue.sort(); }
    }
  }
  return visited !== nodes.length;
};

export const calculateKnowledgeCatalogMaxDepth = (nodes) => {
  const children = childrenForField(nodes, "parents");
  const indegree = new Map(nodes.map((node) => [node.nodeId, node.parents?.length ?? 0]));
  const depth = new Map(nodes.map((node) => [node.nodeId, 0]));
  const queue = [...indegree.entries()].filter(([, value]) => value === 0).map(([nodeId]) => nodeId).sort();
  let visited = 0;
  while (queue.length) {
    const nodeId = queue.shift();
    visited += 1;
    for (const childId of children.get(nodeId) ?? []) {
      depth.set(childId, Math.max(depth.get(childId) ?? 0, (depth.get(nodeId) ?? 0) + 1));
      indegree.set(childId, indegree.get(childId) - 1);
      if (indegree.get(childId) === 0) { queue.push(childId); queue.sort(); }
    }
  }
  return Object.freeze({ maxDepth: Math.max(0, ...depth.values()), visited, cyclic: visited !== nodes.length });
};

export const validateKnowledgeCatalogGraph = (nodes) => {
  const errors = [];
  const ids = nodes.map((node) => node.nodeId);
  const idSet = new Set(ids);
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  add(errors, duplicates(ids).length > 0, "DUPLICATE_NODE_ID", { duplicates: duplicates(ids) });
  for (const node of nodes) {
    for (const field of endpointFields) {
      const values = node[field] ?? [];
      add(errors, !Array.isArray(values), "RELATION_FIELD_NOT_ARRAY", { nodeId: node.nodeId, field });
      if (!Array.isArray(values)) continue;
      add(errors, duplicates(values).length > 0, "DUPLICATE_RELATION_ENDPOINT", { nodeId: node.nodeId, field });
      add(errors, values.includes(node.nodeId), "SELF_RELATION", { nodeId: node.nodeId, field });
      for (const endpoint of values) add(errors, !idSet.has(endpoint), "MISSING_RELATION_ENDPOINT", { nodeId: node.nodeId, field, endpoint });
    }
    for (const parentId of node.parents ?? []) add(errors, !byId.get(parentId)?.children?.includes(node.nodeId), "PARENT_CHILD_ASYMMETRY", { nodeId: node.nodeId, parentId });
    for (const childId of node.children ?? []) add(errors, !byId.get(childId)?.parents?.includes(node.nodeId), "CHILD_PARENT_ASYMMETRY", { nodeId: node.nodeId, childId });
    for (const relatedId of node.related ?? []) add(errors, !byId.get(relatedId)?.related?.includes(node.nodeId), "RELATED_ASYMMETRY", { nodeId: node.nodeId, relatedId });
  }
  add(errors, hasKnowledgeCatalogCycle(nodes, "parents"), "CATALOG_HIERARCHY_CYCLE");
  add(errors, hasKnowledgeCatalogCycle(nodes, "dependencies"), "CATALOG_DEPENDENCY_CYCLE");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), depth: calculateKnowledgeCatalogMaxDepth(nodes) });
};

const validateNodeContracts = (nodes) => {
  const errors = [];
  for (const node of nodes) {
    for (const field of KNOWLEDGE_NODE_REQUIRED_FIELDS) add(errors, !(field in node), "KNOWLEDGE_NODE_REQUIRED_FIELD_MISSING", { nodeId: node.nodeId, field });
    for (const field of KNOWLEDGE_NODE_DEPENDENCY_FIELDS) add(errors, !Array.isArray(node[field]), "KNOWLEDGE_NODE_DEPENDENCY_FIELD_INVALID", { nodeId: node.nodeId, field });
    add(errors, !KNOWLEDGE_NODE_TYPES.includes(node.nodeType), "KNOWLEDGE_NODE_TYPE_INVALID", { nodeId: node.nodeId, nodeType: node.nodeType });
    add(errors, !KNOWLEDGE_NODE_STATUSES.includes(node.status), "KNOWLEDGE_NODE_STATUS_INVALID", { nodeId: node.nodeId, status: node.status });
    add(errors, !PRIORITY_LEVELS.includes(node.priority?.level), "KNOWLEDGE_NODE_PRIORITY_INVALID", { nodeId: node.nodeId });
    add(errors, node.priority?.manualOverride !== false || node.priority?.level !== priorityLevelForScore(node.priority?.score), "KNOWLEDGE_NODE_PRIORITY_NOT_CALCULATED", { nodeId: node.nodeId });
    const recomputedPriority = calculateNodePriority(node);
    add(errors, stableStringify(recomputedPriority, 0) !== stableStringify(node.priority, 0), "KNOWLEDGE_NODE_PRIORITY_NON_DETERMINISTIC", { nodeId: node.nodeId });
    for (const dimension of [node.coverage, node.scientificCoverage, node.editorialCoverage, node.projectionCoverage, node.sourceCoverage, node.assertionCoverage]) {
      add(errors, !COVERAGE_LEVELS.includes(dimension?.level) || dimension?.ratio < 0 || dimension?.ratio > 1, "KNOWLEDGE_NODE_COVERAGE_INVALID", { nodeId: node.nodeId });
    }
    const recomputedCoverage = calculateCoverage({ nodeType: node.nodeType, metrics: node.metrics });
    for (const field of ["coverage", "scientificCoverage", "editorialCoverage", "projectionCoverage", "sourceCoverage", "assertionCoverage"]) add(errors, stableStringify(recomputedCoverage[field], 0) !== stableStringify(node[field], 0), "KNOWLEDGE_NODE_COVERAGE_NON_DETERMINISTIC", { nodeId: node.nodeId, field });
    const recomputedProjection = calculateProjectionCapabilities(node);
    add(errors, stableStringify(recomputedProjection, 0) !== stableStringify(node.projectionCapabilities, 0), "KNOWLEDGE_NODE_PROJECTION_NON_DETERMINISTIC", { nodeId: node.nodeId });
    add(errors, node.projectionCapabilities.evaluations.length !== PROJECTION_CAPABILITIES.length, "KNOWLEDGE_NODE_PROJECTION_CAPABILITIES_INCOMPLETE", { nodeId: node.nodeId });
    add(errors, node.projectionCapabilities.publicArtifactsCreated !== 0 || !node.projectionCapabilities.virtualOnly, "PUBLIC_PROJECTION_CREATED", { nodeId: node.nodeId });
    add(errors, node.readiness?.publicPublicationReady?.ready || node.readiness?.seoReady?.ready, "PUBLIC_READINESS_COLLAPSED", { nodeId: node.nodeId });
    add(errors, !node.lastReview || !node.nextReview || Number.isNaN(Date.parse(node.lastReview)) || Number.isNaN(Date.parse(node.nextReview)), "KNOWLEDGE_NODE_REVIEW_DATE_INVALID", { nodeId: node.nodeId });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
};

const validateCampaigns = (catalog) => {
  const errors = [];
  const expected = buildScientificEnrichmentCampaigns(catalog.nodes);
  add(errors, stableStringify(expected, 0) !== stableStringify(catalog.campaigns, 0), "CAMPAIGNS_NON_DETERMINISTIC");
  const selected = catalog.campaigns.flatMap((item) => item.nodeIds);
  add(errors, duplicates(selected).length > 0, "NODE_SELECTED_BY_MULTIPLE_CAMPAIGNS");
  const byId = new Map(catalog.nodes.map((node) => [node.nodeId, node]));
  for (const campaign of catalog.campaigns) {
    add(errors, campaign.selectionRule.manualDomainSelection || campaign.publicationAuthorized || campaign.generatedContent || campaign.generatedAssertions, "CAMPAIGN_SCOPE_VIOLATION", { campaignId: campaign.campaignId });
    for (const nodeId of campaign.nodeIds) add(errors, !isCampaignCandidate(byId.get(nodeId)), "CAMPAIGN_NODE_NOT_ELIGIBLE", { campaignId: campaign.campaignId, nodeId });
  }
  for (const node of catalog.nodes.filter(isCampaignCandidate)) add(errors, !selected.includes(node.nodeId), "ELIGIBLE_NODE_MISSING_FROM_CAMPAIGN", { nodeId: node.nodeId });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), campaigns: catalog.campaigns.length, selectedNodes: selected.length });
};

export const validateScientificKnowledgeCatalog = ({ catalog = scientificKnowledgeCatalog, root = process.cwd(), inspectGit = true, verifyDeterminism = true } = {}) => {
  const graph = validateKnowledgeCatalogGraph(catalog.nodes);
  const contracts = validateNodeContracts(catalog.nodes);
  const campaigns = validateCampaigns(catalog);
  const errors = [
    ...graph.errors.map((error) => ({ layer: "graph", ...error })),
    ...contracts.errors.map((error) => ({ layer: "contracts", ...error })),
    ...campaigns.errors.map((error) => ({ layer: "campaigns", ...error })),
  ];
  add(errors, catalog.sourceBaselines.historicalConcepts !== 118 || catalog.sourceBaselines.p4rConcepts !== 42 || catalog.sourceBaselines.p5Concepts !== 60, "SOURCE_BASELINE_COUNT_CHANGED", { layer: "baseline" });
  add(errors, catalog.nodes.length !== 235 || catalog.summary.concepts !== 220 || catalog.summary.domains !== 15, "CATALOG_INVENTORY_COUNT_CHANGED", { layer: "baseline" });
  add(errors, catalog.summary.graphCyclic || graph.depth.maxDepth !== catalog.summary.maxDepth, "CATALOG_GRAPH_SUMMARY_INVALID", { layer: "summary" });
  add(errors, stableStringify(catalog.scope, 0) !== stableStringify(KNOWLEDGE_CATALOG_SCOPE, 0), "CATALOG_SCOPE_CHANGED", { layer: "scope" });
  add(errors, catalog.contracts.knowledgeStoredInCatalog || catalog.contracts.scientificKnowledgeGraphMutated || catalog.contracts.assertionsCreated !== 0, "SCIENTIFIC_KNOWLEDGE_SCOPE_VIOLATION", { layer: "scope" });
  add(errors, catalog.contracts.publicPagesCreated !== 0 || catalog.contracts.seoArtifactsCreated !== 0 || catalog.contracts.routesCreated !== 0 || catalog.contracts.publicationAuthorized, "PUBLIC_SURFACE_SCOPE_VIOLATION", { layer: "scope" });
  add(errors, catalog.nodes.some((node) => node.status === "PUBLISHED" || node.metrics.publicPageCount > 0), "CATALOG_PUBLICATION_DETECTED", { layer: "scope" });
  if (verifyDeterminism) add(errors, stableStringify(createScientificKnowledgeCatalog(), 0) !== stableStringify(catalog, 0), "CATALOG_NON_DETERMINISTIC", { layer: "determinism" });
  const p5 = validateScientificMultidomain({ root, inspectGit });
  add(errors, !p5.valid, "P5_BASELINE_INVALID", { layer: "baseline", p5Errors: p5.errors });
  const protectedSurfaces = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  add(errors, !protectedSurfaces.protectedSurfacesUnchanged, "PROTECTED_SURFACE_CHANGED", { layer: "protectedSurfaces", changes: protectedSurfaces.protectedChanges });
  add(errors, !protectedSurfaces.editorialEngineUnchanged, "EDITORIAL_ENGINE_CHANGED", { layer: "protectedSurfaces", changes: protectedSurfaces.editorialEngine?.changed });
  return Object.freeze({
    valid: errors.length === 0,
    version: "P6_SCIENTIFIC_KNOWLEDGE_CATALOG",
    errors: Object.freeze(errors),
    layers: Object.freeze({ graph, contracts, campaigns, p5Baseline: Object.freeze({ valid: p5.valid, counts: p5.counts }) }),
    protectedSurfaces,
    counts: catalog.summary,
    statusSemantics: Object.freeze({ readyLike: READY_LIKE_STATUSES, terminal: TERMINAL_STATUSES }),
  });
};

export const validateKnowledgeCatalog = validateScientificKnowledgeCatalog;
