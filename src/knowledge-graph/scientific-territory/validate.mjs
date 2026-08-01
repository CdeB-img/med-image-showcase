import { sha256Digest, stableStringify } from "../migration/stable-json.mjs";
import { KNOWLEDGE_NODE_TYPES } from "../knowledge-catalog/constants.mjs";
import {
  TERRITORY_CONTRACTS,
  TERRITORY_COVERAGE_STATES,
  TERRITORY_LEVELS,
  TERRITORY_PRIORITIES,
  TERRITORY_PROJECTION_TYPES,
  TERRITORY_TARGETS,
} from "./constants.mjs";
import { createScientificTerritoryModel } from "./model.mjs";

const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);

const hasCycle = (nodes) => {
  const parents = new Map(nodes.map((node) => [node.territoryNodeId, node.parentIds]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (nodeId) => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const parentId of parents.get(nodeId) ?? []) if (visit(parentId)) return true;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };
  return nodes.some((node) => visit(node.territoryNodeId));
};

export const validateScientificTerritoryModel = ({ model, catalog, fileModel = null } = {}) => {
  const errors = [];
  const ids = model.nodes.map((node) => node.territoryNodeId);
  const byId = new Map(model.nodes.map((node) => [node.territoryNodeId, node]));
  const levelRank = new Map(TERRITORY_LEVELS.map((level) => [level.id, level.rank]));
  const territoryIds = new Set(model.nodes.filter((node) => node.level === "TERRITORY").map((node) => node.territoryId));
  add(errors, duplicates(ids).length > 0, "TERRITORY_NODE_ID_COLLISION", { ids: duplicates(ids) });
  add(errors, hasCycle(model.nodes), "TERRITORY_HIERARCHY_CYCLE");
  for (const node of model.nodes) {
    add(errors, !levelRank.has(node.level), "TERRITORY_LEVEL_INVALID", { nodeId: node.territoryNodeId, level: node.level });
    add(errors, !TERRITORY_PRIORITIES.includes(node.priority), "TERRITORY_PRIORITY_INVALID", { nodeId: node.territoryNodeId });
    add(errors, !TERRITORY_TARGETS.includes(node.targetCoverage), "TERRITORY_TARGET_INVALID", { nodeId: node.territoryNodeId });
    add(errors, !TERRITORY_COVERAGE_STATES.includes(node.currentCoverage), "TERRITORY_COVERAGE_INVALID", { nodeId: node.territoryNodeId });
    add(errors, !node.label || !node.description || node.storesScientificKnowledge, "TERRITORY_NODE_CONTRACT_INVALID", { nodeId: node.territoryNodeId });
    add(errors, node.projectionTypes.some((projection) => !TERRITORY_PROJECTION_TYPES.includes(projection)), "TERRITORY_PROJECTION_TYPE_INVALID", { nodeId: node.territoryNodeId });
    for (const parentId of node.parentIds) {
      const parent = byId.get(parentId);
      add(errors, !parent, "TERRITORY_PARENT_MISSING", { nodeId: node.territoryNodeId, parentId });
      if (parent) {
        add(errors, levelRank.get(parent.level) + 1 !== levelRank.get(node.level), "TERRITORY_LEVEL_JUMP", { nodeId: node.territoryNodeId, parentId });
        add(errors, !parent.childIds.includes(node.territoryNodeId), "TERRITORY_PARENT_CHILD_NOT_RECIPROCAL", { nodeId: node.territoryNodeId, parentId });
      }
    }
    for (const childId of node.childIds) add(errors, !byId.has(childId) || !byId.get(childId).parentIds.includes(node.territoryNodeId), "TERRITORY_CHILD_PARENT_NOT_RECIPROCAL", { nodeId: node.territoryNodeId, childId });
  }
  for (const membership of model.crossMemberships) {
    add(errors, !byId.has(membership.sourceId), "TERRITORY_CROSS_MEMBERSHIP_SOURCE_MISSING", { sourceId: membership.sourceId });
    for (const targetId of membership.targetIds) add(errors, !byId.has(targetId), "TERRITORY_CROSS_MEMBERSHIP_TARGET_MISSING", { sourceId: membership.sourceId, targetId });
  }
  for (const dimension of model.transverseDimensions) for (const territoryId of dimension.appliesToTerritoryIds) add(errors, !territoryIds.has(territoryId), "TERRITORY_DIMENSION_TARGET_MISSING", { dimensionId: dimension.dimensionId, territoryId });
  const waveIds = new Set(model.roadmap.waves.map((wave) => wave.waveId));
  for (const wave of model.roadmap.waves) {
    for (const territoryId of wave.territoryIds) add(errors, !territoryIds.has(territoryId), "TERRITORY_ROADMAP_TARGET_MISSING", { waveId: wave.waveId, territoryId });
    for (const dependencyId of wave.dependsOnWaveIds) add(errors, !waveIds.has(dependencyId), "TERRITORY_ROADMAP_DEPENDENCY_MISSING", { waveId: wave.waveId, dependencyId });
  }
  const catalogIds = new Set(catalog.nodes.map((node) => node.nodeId));
  const mappedKnowledgeNodeTypes = model.conceptFamilies.flatMap((family) => family.knowledgeNodeTypes);
  add(errors, duplicates(mappedKnowledgeNodeTypes).length > 0, "TERRITORY_CONCEPT_TYPE_DUPLICATED", { types: duplicates(mappedKnowledgeNodeTypes) });
  add(errors, KNOWLEDGE_NODE_TYPES.filter((nodeType) => nodeType !== "Domain" && !mappedKnowledgeNodeTypes.includes(nodeType)).length > 0, "TERRITORY_CONCEPT_TYPE_MISSING", { types: KNOWLEDGE_NODE_TYPES.filter((nodeType) => nodeType !== "Domain" && !mappedKnowledgeNodeTypes.includes(nodeType)) });
  for (const node of model.nodes) for (const catalogNodeId of node.catalogNodeIds) add(errors, !catalogIds.has(catalogNodeId), "TERRITORY_CATALOG_REFERENCE_MISSING", { nodeId: node.territoryNodeId, catalogNodeId });
  add(errors, model.catalogComparison.summary.unmappedCatalogDomains !== 0, "CATALOG_DOMAIN_OUTSIDE_TERRITORY", { nodeIds: model.catalogComparison.unmappedCatalogDomainIds });
  add(errors, model.catalogComparison.summary.orphanCatalogConcepts !== 0, "CATALOG_CONCEPT_TYPE_OUTSIDE_TERRITORY", { nodeIds: model.catalogComparison.orphanCatalogConceptNodeIds });
  add(errors, model.catalogComparison.summary.unknownCatalogReferences !== 0, "TERRITORY_UNKNOWN_CATALOG_REFERENCE");
  add(errors, model.catalogComparison.automaticCorrectionsApplied !== 0, "TERRITORY_AUTOMATIC_CATALOG_CORRECTION");
  add(errors, stableStringify(model.contracts, 0) !== stableStringify(TERRITORY_CONTRACTS, 0), "TERRITORY_CONTRACTS_CHANGED");
  add(errors, model.contracts.scientificAssertionsCreated !== 0 || model.contracts.evidenceLinksCreated !== 0 || model.contracts.campaignsExecuted !== 0, "SCIENTIFIC_KNOWLEDGE_CREATED_BY_TERRITORY");
  add(errors, model.contracts.publicPagesCreated !== 0 || model.contracts.routesCreated !== 0 || model.contracts.seoArtifactsCreated !== 0 || model.contracts.publicationAuthorized, "PUBLIC_SURFACE_CREATED_BY_TERRITORY");
  add(errors, model.catalogComparison.catalogSnapshot.digest !== catalog.digest || model.catalogComparison.catalogSnapshot.planningDigest !== catalog.planningDigest, "CATALOG_SNAPSHOT_DRIFT");
  const { digest, ...material } = model;
  add(errors, digest !== sha256Digest(material), "TERRITORY_DIGEST_MISMATCH");
  const rebuilt = createScientificTerritoryModel({ catalog });
  add(errors, stableStringify(rebuilt, 0) !== stableStringify(model, 0), "TERRITORY_MODEL_NON_DETERMINISTIC");
  if (fileModel) add(errors, stableStringify(fileModel, 0) !== stableStringify(model, 0), "TERRITORY_MODEL_FILE_OUT_OF_SYNC");
  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    counts: Object.freeze({
      territories: model.nodes.filter((node) => node.level === "TERRITORY").length,
      domains: model.nodes.filter((node) => node.level === "DOMAIN").length,
      subdomains: model.nodes.filter((node) => node.level === "SUBDOMAIN").length,
      knowledgeAreas: model.nodes.filter((node) => node.level === "KNOWLEDGE_AREA").length,
      explicitNodes: model.nodes.length,
      transverseDimensions: model.transverseDimensions.length,
      boundaries: model.boundaries.rules.length,
      roadmapWaves: model.roadmap.waves.length,
    }),
  });
};
