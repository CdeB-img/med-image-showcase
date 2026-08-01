import { performance } from "node:perf_hooks";
import { sha256Digest } from "../migration/stable-json.mjs";
import { buildScientificEnrichmentCampaigns, createCatalogPlanningDigest } from "../knowledge-catalog/campaign-engine.mjs";
import { normalizeCampaignDependency, validateCampaignDependencies } from "../knowledge-catalog/campaign-dependencies.mjs";
import { KNOWLEDGE_CATALOG_GENERATED_AT } from "../knowledge-catalog/constants.mjs";
import { createKnowledgeNode } from "../knowledge-catalog/knowledge-node-registry.mjs";
import { validateKnowledgeCatalogGraph } from "../knowledge-catalog/validators.mjs";

const round = (value, digits = 3) => Number(value.toFixed(digits));
const elapsed = (start) => round(performance.now() - start);

const metricsFor = (index) => {
  if (index % 11 === 0) return { sourceCount: 5, scientificSourceCount: 5, fullTextSourceCount: 5, assertionCount: 12, evidenceLinkCount: 12, localizedEvidenceLinkCount: 12, synthesisCount: 1, projectionCount: 1 };
  if (index % 4 === 0) return { sourceCount: 1, scientificSourceCount: 1, fullTextSourceCount: 1, assertionCount: 2, evidenceLinkCount: 2, localizedEvidenceLinkCount: 2, synthesisCount: 1, projectionCount: 1 };
  if (index % 3 === 0) return { sourceCount: 5, scientificSourceCount: 5, fullTextSourceCount: 5, assertionCount: 0, evidenceLinkCount: 0, localizedEvidenceLinkCount: 0 };
  return {};
};

export const createIndustrialBenchmarkFixture = (size) => {
  const nodes = Array.from({ length: size }, (_, index) => createKnowledgeNode({
    nodeId: `noxia:p9-benchmark:domain:${String(index).padStart(5, "0")}`,
    nodeType: "Domain",
    preferredLabel: `P9 benchmark ${index}`,
    aliases: [],
    description: "Isolated P9 industrial benchmark fixture.",
    parents: [], children: [], related: [], prerequisites: [], dependencies: [], relatedDomains: [], successors: [], replacements: [], supersededBy: [], blockingNodes: [],
    metrics: metricsFor(index),
    roadmapSignals: {
      scientificValue: index % 5 === 0 ? "HIGH" : index % 5 === 1 ? "MEDIUM" : "LOW",
      editorialValue: index % 7 < 2 ? "HIGH" : "MEDIUM",
      sourceAvailability: index % 6 === 0 ? "HIGH" : "MEDIUM",
      priority: (index % 10) + 1,
    },
    planned: true,
    modeled: index % 3 === 0,
    sourceStatus: "SYNTHETIC_BENCHMARK",
    createdAt: new Date(Date.parse(KNOWLEDGE_CATALOG_GENERATED_AT) - (index % 365) * 86_400_000).toISOString(),
    updatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
    lastReview: KNOWLEDGE_CATALOG_GENERATED_AT,
    lifecycle: index % 97 === 0 ? { archived: false, migrations: [], priorityGapsOpen: true } : { archived: false, migrations: [] },
  }));
  const dependencies = [];
  for (let index = 25; index < size; index += 25) {
    dependencies.push(normalizeCampaignDependency({
      dependencyId: `noxia:p9-benchmark:dependency:${index}`,
      type: index % 50 === 0 ? "prerequisite" : "optionalDependency",
      sourceNodeId: nodes[index].nodeId,
      targetNodeId: nodes[index - 1].nodeId,
      rationale: "ISOLATED_BENCHMARK_DEPENDENCY",
    }));
  }
  return Object.freeze({ nodes: Object.freeze(nodes), dependencies: Object.freeze(dependencies) });
};

export const runIndustrialScaleBenchmark = (size) => {
  const heapBefore = process.memoryUsage().heapUsed;
  let started = performance.now();
  const fixture = createIndustrialBenchmarkFixture(size);
  const fixtureCreationMs = elapsed(started);
  const planningDigest = createCatalogPlanningDigest({ nodes: fixture.nodes, dependencies: fixture.dependencies, executions: [] });
  started = performance.now();
  const campaigns = buildScientificEnrichmentCampaigns(fixture.nodes, { dependencies: fixture.dependencies, catalogPlanningDigest: planningDigest });
  const planningMs = elapsed(started);
  started = performance.now();
  const graph = validateKnowledgeCatalogGraph(fixture.nodes);
  const dependencies = validateCampaignDependencies(fixture);
  const validationMs = elapsed(started);
  const reversePlanningDigest = createCatalogPlanningDigest({ nodes: [...fixture.nodes].reverse(), dependencies: fixture.dependencies, executions: [] });
  const reverseCampaigns = buildScientificEnrichmentCampaigns([...fixture.nodes].reverse(), { dependencies: fixture.dependencies, catalogPlanningDigest: reversePlanningDigest });
  const deterministic = planningDigest === reversePlanningDigest && sha256Digest(campaigns) === sha256Digest(reverseCampaigns);
  return Object.freeze({
    nodes: size,
    dependencies: fixture.dependencies.length,
    campaigns: campaigns.length,
    projectedIncomplete: fixture.nodes.filter((node) => node.status === "PROJECTED" && !node.coverage.complete).length,
    blockedCampaignCandidates: fixture.nodes.filter((node) => node.priority.level === "HIGH" && fixture.dependencies.some((dependency) => dependency.sourceNodeId === node.nodeId && dependency.type === "prerequisite")).length,
    recurrentReviewSignals: fixture.nodes.filter((node) => node.lifecycle.priorityGapsOpen).length,
    fixtureCreationMs,
    planningMs,
    validationMs,
    observedHeapDeltaMiB: round(Math.max(0, process.memoryUsage().heapUsed - heapBefore) / 1024 / 1024),
    deterministic,
    graphValid: graph.valid,
    dependenciesValid: dependencies.valid,
    campaignOrderDigest: sha256Digest(campaigns.map((campaign) => campaign.campaignRevisionId)),
  });
};

export const runP9IndustrialBenchmarks = (sizes = [100, 500, 1000, 5000]) => Object.freeze(sizes.map(runIndustrialScaleBenchmark));
