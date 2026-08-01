import { sha256Digest } from "../migration/stable-json.mjs";
import {
  SCIENTIFIC_TERRITORY_GENERATED_AT,
  SCIENTIFIC_TERRITORY_MODEL_ID,
  SCIENTIFIC_TERRITORY_MODEL_VERSION,
  TERRITORY_CONTRACTS,
  TERRITORY_COVERAGE_STATES,
  TERRITORY_LEVELS,
  TERRITORY_PROJECTION_POLICY,
  TERRITORY_PROJECTION_TYPES,
} from "./constants.mjs";
import { territoryBoundaryPolicy, territoryBoundaryRules } from "./territory-boundaries.mjs";
import { territoryRoadmap } from "./territory-roadmap.mjs";
import { taxonomyNodeId, territoryBlueprint, territoryConceptFamilies, territoryCrossMemberships, transverseDimensions } from "./territory-taxonomy.mjs";

const freeze = (value) => Object.freeze(value);
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const slugify = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const clone = (value) => structuredClone(value);

const inheritedTarget = (priority) => priority === "FUTURE" ? "FUTURE" : priority === "SECONDARY" ? "SELECTIVE" : "CORE";
const defaultEstimate = (level) => ({
  TERRITORY: { knowledgeNodes: [0, 0], pages: [1, 2] },
  DOMAIN: { knowledgeNodes: [2, 8], pages: [1, 4] },
  SUBDOMAIN: { knowledgeNodes: [3, 12], pages: [1, 5] },
  KNOWLEDGE_AREA: { knowledgeNodes: [2, 8], pages: [0, 3] },
}[level]);

const createNode = ({ nodeId, level, label, parentIds = [], territoryId, priority, targetCoverage, projectionTypes, catalogNodeIds = [], catalogMappingScope = "PARTIAL" }) => freeze({
  territoryNodeId: nodeId,
  level,
  label,
  description: `Périmètre structurel Noxia : ${label}.`,
  territoryId,
  parentIds: freeze(unique(parentIds)),
  childIds: freeze([]),
  priority,
  targetCoverage,
  projectionTypes: freeze(unique(projectionTypes)),
  catalogNodeIds: freeze(unique(catalogNodeIds)),
  catalogMappingScope,
  currentCoverage: "NOT_COVERED",
  planningEstimate: freeze(defaultEstimate(level)),
  storesScientificKnowledge: false,
});

export const buildTerritoryTaxonomyNodes = () => {
  const nodes = [];
  for (const territory of territoryBlueprint) {
    const territoryId = territory.id;
    const priority = territory.priority ?? "PRIMARY";
    const targetCoverage = territory.targetCoverage ?? inheritedTarget(priority);
    const projections = territory.projectionTypes ?? [];
    const territoryIdFull = taxonomyNodeId(territoryId);
    nodes.push(createNode({ nodeId: territoryIdFull, level: "TERRITORY", label: territory.label, territoryId, priority, targetCoverage, projectionTypes: projections }));
    for (const domain of territory.domains) {
      const domainPriority = domain.priority ?? priority;
      const domainTarget = domain.targetCoverage ?? inheritedTarget(domainPriority);
      const domainId = taxonomyNodeId(territoryId, "domain", domain.id);
      nodes.push(createNode({ nodeId: domainId, level: "DOMAIN", label: domain.label, parentIds: [territoryIdFull], territoryId, priority: domainPriority, targetCoverage: domainTarget, projectionTypes: domain.projectionTypes ?? projections, catalogNodeIds: domain.catalogNodeIds, catalogMappingScope: domain.catalogMappingScope }));
      for (const subdomain of domain.subdomains) {
        const subPriority = subdomain.priority ?? domainPriority;
        const subTarget = subdomain.targetCoverage ?? inheritedTarget(subPriority);
        const subdomainId = taxonomyNodeId(territoryId, "domain", domain.id, "subdomain", subdomain.id);
        nodes.push(createNode({ nodeId: subdomainId, level: "SUBDOMAIN", label: subdomain.label, parentIds: [domainId], territoryId, priority: subPriority, targetCoverage: subTarget, projectionTypes: subdomain.projectionTypes ?? domain.projectionTypes ?? projections, catalogNodeIds: subdomain.catalogNodeIds, catalogMappingScope: subdomain.catalogMappingScope }));
        for (const area of subdomain.knowledgeAreas) {
          const label = typeof area === "string" ? area : area.label;
          const id = typeof area === "string" ? slugify(area) : area.id;
          nodes.push(createNode({ nodeId: taxonomyNodeId(territoryId, "domain", domain.id, "subdomain", subdomain.id, "knowledge-area", id), level: "KNOWLEDGE_AREA", label, parentIds: [subdomainId], territoryId, priority: subPriority, targetCoverage: subTarget, projectionTypes: subdomain.projectionTypes ?? domain.projectionTypes ?? projections, catalogNodeIds: typeof area === "string" ? [] : area.catalogNodeIds, catalogMappingScope: typeof area === "string" ? "PARTIAL" : area.catalogMappingScope }));
        }
      }
    }
  }
  const byId = new Map(nodes.map((node) => [node.territoryNodeId, { ...node }]));
  for (const node of byId.values()) for (const parentId of node.parentIds) byId.get(parentId).childIds = unique([...byId.get(parentId).childIds, node.territoryNodeId]);
  return freeze([...byId.values()].map((node) => freeze({ ...node, childIds: freeze(node.childIds) })).sort((a, b) => a.territoryNodeId.localeCompare(b.territoryNodeId)));
};

const catalogCoverageState = (territoryNode, catalogNodes) => {
  const matches = territoryNode.catalogNodeIds.map((nodeId) => catalogNodes.get(nodeId)).filter(Boolean);
  if (!matches.length) return "NOT_COVERED";
  if (matches.some((node) => ["NOT_STARTED", "DISCOVERING", "SOURCING"].includes(node.status) || node.coverage?.level === "NONE")) return matches.some((node) => node.coverage?.level !== "NONE") ? "PARTIALLY_COVERED" : "PLANNED";
  if (territoryNode.catalogMappingScope === "EXACT" && matches.every((node) => ["HIGH", "COMPLETE"].includes(node.coverage?.level))) return "COVERED";
  return "PARTIALLY_COVERED";
};

const rollupCoverage = (nodes, catalogNodes) => {
  const byId = new Map(nodes.map((node) => [node.territoryNodeId, { ...node }]));
  const levelRank = new Map(TERRITORY_LEVELS.map((level) => [level.id, level.rank]));
  for (const node of byId.values()) node.currentCoverage = catalogCoverageState(node, catalogNodes);
  for (const node of [...byId.values()].sort((a, b) => levelRank.get(b.level) - levelRank.get(a.level))) {
    const children = node.childIds.map((childId) => byId.get(childId));
    if (!children.length || node.currentCoverage === "COVERED") continue;
    const states = children.map((child) => child.currentCoverage);
    if (states.length && states.every((state) => state === "COVERED")) node.currentCoverage = "COVERED";
    else if (states.some((state) => ["COVERED", "PARTIALLY_COVERED"].includes(state))) node.currentCoverage = "PARTIALLY_COVERED";
    else if (node.currentCoverage === "NOT_COVERED" && states.some((state) => state === "PLANNED")) node.currentCoverage = "PLANNED";
  }
  return freeze([...byId.values()].map((node) => freeze(node)).sort((a, b) => a.territoryNodeId.localeCompare(b.territoryNodeId)));
};

const sumRanges = (nodes, field) => nodes.reduce((sum, node) => [sum[0] + node.planningEstimate[field][0], sum[1] + node.planningEstimate[field][1]], [0, 0]);
const midpoint = ([minimum, maximum]) => Math.round((minimum + maximum) / 2);

export const compareTerritoryToCatalog = ({ nodes, catalog }) => {
  const catalogById = new Map(catalog.nodes.map((node) => [node.nodeId, node]));
  const assessedNodes = rollupCoverage(nodes, catalogById);
  const knownTerritoryMappings = assessedNodes.flatMap((node) => node.catalogNodeIds.map((catalogNodeId) => ({ catalogNodeId, territoryNodeId: node.territoryNodeId })));
  const mappedDomainIds = new Set(knownTerritoryMappings.map((item) => item.catalogNodeId));
  const knownNodeTypes = new Set(territoryConceptFamilies.flatMap((family) => family.knowledgeNodeTypes));
  const unmappedDomains = catalog.nodes.filter((node) => node.nodeType === "Domain" && !mappedDomainIds.has(node.nodeId)).map((node) => node.nodeId).sort();
  const orphanConcepts = catalog.nodes.filter((node) => node.nodeType !== "Domain" && !knownNodeTypes.has(node.nodeType)).map((node) => node.nodeId).sort();
  const unknownCatalogReferences = knownTerritoryMappings.filter((mapping) => !catalogById.has(mapping.catalogNodeId));
  const mappingCounts = new Map();
  for (const mapping of knownTerritoryMappings) mappingCounts.set(mapping.catalogNodeId, (mappingCounts.get(mapping.catalogNodeId) ?? 0) + 1);
  const multiMappedCatalogNodes = [...mappingCounts.entries()].filter(([, count]) => count > 1).map(([catalogNodeId, count]) => ({ catalogNodeId, territoryMemberships: count })).sort((a, b) => a.catalogNodeId.localeCompare(b.catalogNodeId));
  const roleDifferences = ["quality-control", "radiomics", "registration", "segmentation"].map((slug) => ({
    catalogNodeId: `noxia:knowledge-catalog:domain:${slug}`,
    observation: "Catalog Domain is retained; the Territory Model also treats this subject as a transverse method or quality dimension.",
    automaticCorrection: false,
  }));
  const coverage = Object.fromEntries(TERRITORY_COVERAGE_STATES.map((state) => [state, assessedNodes.filter((node) => node.currentCoverage === state).length]));
  const targetEligible = assessedNodes.filter((node) => node.targetCoverage !== "OUT_OF_SCOPE");
  const currentEquivalent = assessedNodes.reduce((sum, node) => sum + (node.currentCoverage === "COVERED" ? 1 : node.currentCoverage === "PARTIALLY_COVERED" ? 0.5 : 0), 0);
  return freeze({
    catalogSnapshot: freeze({ catalogId: catalog.catalogId, version: catalog.version, generatedAt: catalog.generatedAt, digest: catalog.digest, planningDigest: catalog.planningDigest, knowledgeNodes: catalog.nodes.length }),
    nodes: assessedNodes,
    summary: freeze({
      coverage: freeze(coverage),
      currentCoverageEquivalent: Number((currentEquivalent / assessedNodes.length).toFixed(4)),
      targetCoverageEquivalent: Number((targetEligible.length / assessedNodes.length).toFixed(4)),
      mappedCatalogDomains: catalog.nodes.filter((node) => node.nodeType === "Domain").length - unmappedDomains.length,
      structurallyRepresentedCatalogConcepts: catalog.nodes.filter((node) => node.nodeType !== "Domain").length - orphanConcepts.length,
      unmappedCatalogDomains: unmappedDomains.length,
      orphanCatalogConcepts: orphanConcepts.length,
      unknownCatalogReferences: unknownCatalogReferences.length,
    }),
    unmappedCatalogDomainIds: freeze(unmappedDomains),
    orphanCatalogConceptNodeIds: freeze(orphanConcepts),
    unknownCatalogReferences: freeze(unknownCatalogReferences),
    multiMappedCatalogNodes: freeze(multiMappedCatalogNodes),
    roleDifferences: freeze(roleDifferences),
    branchesWithoutCatalogDomain: freeze(assessedNodes.filter((node) => node.level === "DOMAIN" && node.catalogNodeIds.length === 0).map((node) => node.territoryNodeId)),
    automaticCorrectionsApplied: 0,
  });
};

export const createScientificTerritoryModel = ({ catalog }) => {
  const rawNodes = buildTerritoryTaxonomyNodes();
  const comparison = compareTerritoryToCatalog({ nodes: rawNodes, catalog });
  const { nodes, ...catalogComparison } = comparison;
  const knowledgeNodeRange = sumRanges(nodes, "knowledgeNodes");
  const pageRange = sumRanges(nodes, "pages");
  const material = {
    modelId: SCIENTIFIC_TERRITORY_MODEL_ID,
    version: SCIENTIFIC_TERRITORY_MODEL_VERSION,
    generatedAt: SCIENTIFIC_TERRITORY_GENERATED_AT,
    responsibility: "DESCRIBE_WHAT_NOXIA_INTENDS_TO_COVER",
    hierarchy: { explicitThrough: "KNOWLEDGE_AREA", openEnumerationLevels: ["SCIENTIFIC_CONCEPT", "SPECIALIZED_CONCEPT", "ATOMIC_CONCEPT"] },
    levels: TERRITORY_LEVELS,
    coverageStates: TERRITORY_COVERAGE_STATES,
    conceptFamilies: territoryConceptFamilies,
    nodes,
    crossMemberships: territoryCrossMemberships,
    transverseDimensions,
    boundaries: { policy: territoryBoundaryPolicy, rules: territoryBoundaryRules },
    projections: { types: TERRITORY_PROJECTION_TYPES, policy: TERRITORY_PROJECTION_POLICY },
    roadmap: territoryRoadmap,
    catalogComparison,
    estimates: {
      method: "Transparent range sum by explicit territory level; no search-volume or scientific-result inference.",
      expectedKnowledgeNodes: { minimum: knowledgeNodeRange[0], midpoint: midpoint(knowledgeNodeRange), maximum: knowledgeNodeRange[1] },
      potentialScientificPages: { minimum: pageRange[0], midpoint: midpoint(pageRange), maximum: pageRange[1] },
    },
    contracts: TERRITORY_CONTRACTS,
  };
  return freeze({ ...material, digest: sha256Digest(material) });
};

export const cloneScientificTerritoryModel = (model) => clone(model);
