import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { entityRevisions } from "../migration/migrated-knowledge.mjs";
import { stableStringify } from "../migration/stable-json.mjs";
import { scientificCorpusEntityRevisions } from "../scientific-corpus/concepts.mjs";
import { multidomainConcepts } from "../scientific-multidomain/concepts.mjs";
import { buildScientificEnrichmentCampaigns, isCampaignCandidate } from "./campaign-engine.mjs";
import { createScientificKnowledgeCatalog, scientificKnowledgeCatalog } from "./catalog-builder.mjs";
import { KNOWLEDGE_CATALOG_GENERATED_AT, KNOWLEDGE_NODE_DEPENDENCY_FIELDS, KNOWLEDGE_NODE_REQUIRED_FIELDS, PROJECTION_CAPABILITIES } from "./constants.mjs";
import { authorizeScientificEnrichment, authorizeScientificProjection, requireCataloguedScientificOperation } from "./governance.mjs";
import { createKnowledgeNode, exportKnowledgeNodeRegistry, importKnowledgeNodeRegistry, KnowledgeNodeRegistry } from "./knowledge-node-registry.mjs";
import { calculateNodePriority } from "./priority-engine.mjs";
import { calculateProjectionCapabilities } from "./projection-engine.mjs";
import { calculateKnowledgeCatalogMaxDepth, hasKnowledgeCatalogCycle, validateKnowledgeCatalogGraph, validateScientificKnowledgeCatalog } from "./validators.mjs";

const syntheticNode = (key, overrides = {}) => createKnowledgeNode({
  nodeId: `noxia:test:${key}`,
  nodeType: "Domain",
  preferredLabel: key,
  aliases: [],
  description: `Synthetic ${key}`,
  parents: [],
  children: [],
  related: [],
  prerequisites: [],
  dependencies: [],
  relatedDomains: [],
  successors: [],
  replacements: [],
  supersededBy: [],
  blockingNodes: [],
  metrics: {},
  createdAt: KNOWLEDGE_CATALOG_GENERATED_AT,
  updatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
  lastReview: KNOWLEDGE_CATALOG_GENERATED_AT,
  ...overrides,
});

describe("P6 Scientific Knowledge Catalog", () => {
  it("preserves the complete repository-observed concept inventory without adding scientific knowledge", () => {
    expect(entityRevisions).toHaveLength(118);
    expect(scientificCorpusEntityRevisions).toHaveLength(42);
    expect(multidomainConcepts).toHaveLength(60);
    expect(scientificKnowledgeCatalog.summary).toMatchObject({ knowledgeNodes: 235, concepts: 220, domains: 15, assertions: 155, evidenceLinks: 192, syntheses: 22, internalProjections: 20 });
    expect(scientificKnowledgeCatalog.contracts).toMatchObject({ knowledgeStoredInCatalog: false, scientificKnowledgeGraphMutated: false, assertionsCreated: 0, publicPagesCreated: 0, routesCreated: 0, publicationAuthorized: false });
  });

  it("builds every required KnowledgeNode field and explicit dependency collection", () => {
    for (const node of scientificKnowledgeCatalog.nodes) {
      for (const field of KNOWLEDGE_NODE_REQUIRED_FIELDS) expect(node).toHaveProperty(field);
      for (const field of KNOWLEDGE_NODE_DEPENDENCY_FIELDS) expect(Array.isArray(node[field])).toBe(true);
      expect(node.projectionCapabilities.evaluations).toHaveLength(PROJECTION_CAPABILITIES.length);
      expect(node.projectionCapabilities.virtualOnly).toBe(true);
      expect(node.projectionCapabilities.publicArtifactsCreated).toBe(0);
    }
  });

  it("retains a DAG with multiple parents and no artificial single hierarchy", () => {
    const mr = scientificKnowledgeCatalog.nodes.find((node) => node.nodeId === "noxia:radiology:modality:irm");
    const ct = scientificKnowledgeCatalog.nodes.find((node) => node.nodeId === "noxia:radiology:modality:ct");
    expect(mr.parents.length).toBeGreaterThanOrEqual(4);
    expect(ct.parents.length).toBeGreaterThanOrEqual(3);
    expect(hasKnowledgeCatalogCycle(scientificKnowledgeCatalog.nodes, "parents")).toBe(false);
    expect(validateKnowledgeCatalogGraph(scientificKnowledgeCatalog.nodes).valid).toBe(true);
  });

  it("calculates coverage, priorities and virtual projections deterministically", () => {
    for (const node of scientificKnowledgeCatalog.nodes) {
      expect(calculateNodePriority(node)).toEqual(node.priority);
      expect(calculateProjectionCapabilities(node)).toEqual(node.projectionCapabilities);
      expect(node.priority.manualOverride).toBe(false);
      expect(node.readiness.publicPublicationReady.ready).toBe(false);
      expect(node.readiness.seoReady.ready).toBe(false);
    }
    expect(createScientificKnowledgeCatalog()).toEqual(scientificKnowledgeCatalog);
  });

  it("plans every campaign from the catalogue criteria without manual domain selection", () => {
    const campaigns = buildScientificEnrichmentCampaigns(scientificKnowledgeCatalog.nodes);
    expect(campaigns).toEqual(scientificKnowledgeCatalog.campaigns);
    expect(campaigns).toHaveLength(10);
    const selected = campaigns.flatMap((campaign) => campaign.nodeIds);
    expect(new Set(selected).size).toBe(10);
    for (const campaign of campaigns) {
      expect(campaign.selectionRule.manualDomainSelection).toBe(false);
      expect(campaign.publicationAuthorized).toBe(false);
      for (const nodeId of campaign.nodeIds) expect(isCampaignCandidate(scientificKnowledgeCatalog.nodes.find((node) => node.nodeId === nodeId))).toBe(true);
    }
  });

  it("rejects every future scientific operation that is not derived from the catalogue", () => {
    expect(authorizeScientificEnrichment({ nodeId: "noxia:unknown:domain" })).toMatchObject({ authorized: false, blockers: ["NODE_NOT_IN_CATALOG"] });
    const plannedDomainId = "noxia:knowledge-catalog:domain:t2-mapping";
    expect(authorizeScientificEnrichment({ nodeId: plannedDomainId })).toMatchObject({ authorized: true, publicPublicationAuthorized: false });
    expect(authorizeScientificProjection({ nodeId: plannedDomainId, capability: "StateOfKnowledge" })).toMatchObject({ authorized: false, blockers: ["NO_SOURCE", "NO_SYNTHESIS"] });
    const projectedDomainId = "noxia:knowledge-catalog:domain:diffusion-adc";
    expect(authorizeScientificProjection({ nodeId: projectedDomainId, capability: "StateOfKnowledge" })).toMatchObject({ authorized: true, publicPublicationAuthorized: false });
    expect(() => requireCataloguedScientificOperation({ operation: "SCIENTIFIC_ENRICHMENT", nodeId: "noxia:unknown:domain" })).toThrow("NODE_NOT_IN_CATALOG");
  });

  it("keeps the generated JSON synchronized with the deterministic builder", () => {
    const generated = JSON.parse(readFileSync(resolve(process.cwd(), "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json"), "utf8"));
    expect(generated).toEqual(scientificKnowledgeCatalog);
  });

  it("round-trips import and export without losing graph state", () => {
    const registry = new KnowledgeNodeRegistry(scientificKnowledgeCatalog.nodes.slice(0, 20));
    const restored = importKnowledgeNodeRegistry(exportKnowledgeNodeRegistry(registry));
    expect(restored.export()).toEqual(registry.export());
  });

  it("supports rename, deprecation, archive and versioned migration", () => {
    const oldNode = syntheticNode("old");
    const replacement = syntheticNode("replacement");
    const registry = new KnowledgeNodeRegistry([oldNode, replacement]);
    const renamed = registry.rename({ nodeId: oldNode.nodeId, preferredLabel: "Renamed" });
    expect(renamed.aliases).toContain("old");
    expect(renamed.version).toBe("1.0.1");
    expect(registry.deprecate({ nodeId: oldNode.nodeId, replacementId: replacement.nodeId }).status).toBe("DEPRECATED");
    expect(registry.archive({ nodeId: replacement.nodeId }).lifecycle.archived).toBe(true);
    expect(registry.migrate({ toVersion: "2.0.0", transform: (node) => ({ ...node, lifecycle: { ...node.lifecycle, migrated: true } }) })).toMatchObject({ fromVersion: "1.0.0", toVersion: "2.0.0" });
    expect(registry.list().every((node) => node.lifecycle.migrated)).toBe(true);
  });

  it("supports merge while preserving deprecated source identities", () => {
    const left = syntheticNode("left");
    const right = syntheticNode("right");
    const registry = new KnowledgeNodeRegistry([left, right]);
    const target = registry.merge({ sourceNodeIds: [left.nodeId, right.nodeId], targetNode: { ...syntheticNode("merged"), aliases: ["combined"] } });
    expect(target.lifecycle.mergedFrom).toEqual([left.nodeId, right.nodeId]);
    expect(registry.get(left.nodeId)).toMatchObject({ status: "DEPRECATED", replacements: [target.nodeId] });
    expect(registry.get(right.nodeId)).toMatchObject({ status: "DEPRECATED", replacements: [target.nodeId] });
    expect(validateKnowledgeCatalogGraph(registry.list()).valid).toBe(true);
  });

  it("supports split without deleting the original identity", () => {
    const source = syntheticNode("source");
    const registry = new KnowledgeNodeRegistry([source]);
    const split = registry.split({ sourceNodeId: source.nodeId, newNodes: [syntheticNode("part-a"), syntheticNode("part-b")] });
    expect(split).toHaveLength(2);
    expect(registry.get(source.nodeId)).toMatchObject({ status: "DEPRECATED", replacements: ["noxia:test:part-a", "noxia:test:part-b"] });
    expect(validateKnowledgeCatalogGraph(registry.list()).valid).toBe(true);
  });

  it("handles several thousand nodes and significant depth iteratively", () => {
    const size = 2048;
    const nodes = Array.from({ length: size }, (_, index) => syntheticNode(`deep:${index}`, {
      parents: index === 0 ? [] : [`noxia:test:deep:${index - 1}`],
      children: index === size - 1 ? [] : [`noxia:test:deep:${index + 1}`],
    }));
    expect(nodes[0]).toHaveProperty("projectionCapabilities");
    expect(validateKnowledgeCatalogGraph(nodes).valid).toBe(true);
    expect(calculateKnowledgeCatalogMaxDepth(nodes)).toMatchObject({ maxDepth: size - 1, cyclic: false, visited: size });
  });

  it("detects hierarchy and dependency cycles", () => {
    const hierarchyCycle = [
      { nodeId: "a", parents: ["b"], children: ["b"], related: [], prerequisites: [], dependencies: [], relatedDomains: [], successors: [], replacements: [], supersededBy: [], blockingNodes: [] },
      { nodeId: "b", parents: ["a"], children: ["a"], related: [], prerequisites: [], dependencies: [], relatedDomains: [], successors: [], replacements: [], supersededBy: [], blockingNodes: [] },
    ];
    expect(hasKnowledgeCatalogCycle(hierarchyCycle, "parents")).toBe(true);
    expect(validateKnowledgeCatalogGraph(hierarchyCycle).valid).toBe(false);
    const dependencyCycle = hierarchyCycle.map((node, index) => ({ ...node, parents: [], children: [], dependencies: [hierarchyCycle[1 - index].nodeId] }));
    expect(hasKnowledgeCatalogCycle(dependencyCycle, "dependencies")).toBe(true);
  });

  it("passes the complete P6 validator without inspecting Git", () => {
    const validation = validateScientificKnowledgeCatalog({ inspectGit: false });
    expect(validation.valid, stableStringify(validation.errors)).toBe(true);
    expect(validation.errors).toEqual([]);
  });
});
