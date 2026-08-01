import { sha256Digest } from "../migration/stable-json.mjs";
import { createCampaignManifest } from "../knowledge-catalog/campaign-contracts.mjs";
import { evaluateCampaignDependencies } from "../knowledge-catalog/campaign-dependencies.mjs";
import { calculateCampaignPriorityBreakdown, createCatalogPlanningDigest } from "../knowledge-catalog/campaign-engine.mjs";
import { KNOWLEDGE_CATALOG_GENERATED_AT } from "../knowledge-catalog/constants.mjs";
import { createKnowledgeNode } from "../knowledge-catalog/knowledge-node-registry.mjs";
import { p6ScientificKnowledgeCatalog } from "../knowledge-catalog/catalog-builder.mjs";
import {
  AUTOMATIC_CAMPAIGN_NODE_ID,
  hepaticImagingCampaignExecution,
} from "./hepatic-imaging.mjs";

export const INDUSTRIAL_FIXTURE_SCOPE = "P9_ISOLATED_SYNTHETIC_CAMPAIGN_FIXTURE_NEVER_REAL_CORPUS";

const fixtureDefinitions = Object.freeze([
  Object.freeze({ key: "adc", label: "Synthetic ADC campaign", nodeType: "Domain", quantitativeModel: true }),
  Object.freeze({ key: "spectral-ct", label: "Synthetic spectral CT campaign", nodeType: "Domain", quantitativeModel: true }),
  Object.freeze({ key: "documentary-standard", label: "Synthetic non-quantitative campaign", nodeType: "Domain", quantitativeModel: false }),
]);

const createFixtureNode = (definition) => createKnowledgeNode({
  nodeId: `noxia:p9-fixture:domain:${definition.key}`,
  nodeType: definition.nodeType,
  preferredLabel: definition.label,
  aliases: [],
  description: `${definition.label}. Isolated P9 fixture only.`,
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
  roadmapSignals: { scientificValue: "HIGH", editorialValue: "HIGH", sourceAvailability: "HIGH", priority: 1 },
  provenance: { sourceLayers: [INDUSTRIAL_FIXTURE_SCOPE], sourceIdentityIds: [], catalogRevisionIds: [], sourceRevisionIds: [] },
  planned: true,
  modeled: false,
  sourceStatus: "SYNTHETIC_FIXTURE",
  createdAt: KNOWLEDGE_CATALOG_GENERATED_AT,
  updatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
  lastReview: KNOWLEDGE_CATALOG_GENERATED_AT,
});

export const createSyntheticCampaignFixture = (definition) => {
  const node = createFixtureNode(definition);
  const nodes = Object.freeze([node]);
  const dependencies = Object.freeze([]);
  const executions = Object.freeze([]);
  const planningDigest = createCatalogPlanningDigest({ nodes, dependencies, executions });
  const dependencyEvaluation = evaluateCampaignDependencies({ nodeId: node.nodeId, nodes, dependencies });
  const priorityBreakdown = calculateCampaignPriorityBreakdown(node, { dependencyEvaluation, planningAt: KNOWLEDGE_CATALOG_GENERATED_AT });
  const adapterId = `noxia:p9-fixture-adapter:${definition.key}`;
  const manifest = createCampaignManifest({
    node,
    priorityBreakdown,
    dependencyEvaluation,
    catalogPlanningDigest: planningDigest,
    generatedAt: KNOWLEDGE_CATALOG_GENERATED_AT,
    executionPolicy: { adapterId },
  });
  const baseCatalog = {
    catalogId: `noxia:p9-fixture-catalog:${definition.key}`,
    planningDigest,
    dependencyRegistry: dependencies,
    campaignExecutions: executions,
    campaigns: Object.freeze([manifest]),
    nodes,
    fixtureOnly: true,
    scope: INDUSTRIAL_FIXTURE_SCOPE,
  };
  const catalog = Object.freeze({ ...baseCatalog, digest: sha256Digest(baseCatalog) });
  const adapter = Object.freeze({
    adapterId,
    async prepare({ campaignManifest }) {
      return Object.freeze({
        records: Object.freeze([Object.freeze({
          recordType: "SyntheticCampaignOutput",
          campaignRevisionId: campaignManifest.campaignRevisionId,
          selectedNodeIds: campaignManifest.selectedNodeIds,
          fixtureOnly: true,
          quantitativeModelCreated: definition.quantitativeModel,
        })]),
        additions: Object.freeze({ syntheticFixtureRecords: 1, quantitativeModels: definition.quantitativeModel ? 1 : 0 }),
        gaps: Object.freeze([]),
        outputDigests: Object.freeze({ fixture: sha256Digest({ definition, campaignRevisionId: campaignManifest.campaignRevisionId }) }),
      });
    },
  });
  return Object.freeze({ definition, node, manifest, catalog, adapter });
};

export const p9SyntheticCampaignFixtures = Object.freeze(fixtureDefinitions.map(createSyntheticCampaignFixture));

export const createHepaticP7GenericReplayFixture = () => {
  const node = p6ScientificKnowledgeCatalog.nodes.find((item) => item.nodeId === AUTOMATIC_CAMPAIGN_NODE_ID);
  const nodes = Object.freeze([node]);
  const dependencies = Object.freeze([]);
  const executions = Object.freeze([]);
  const planningDigest = createCatalogPlanningDigest({ nodes, dependencies, executions });
  const dependencyEvaluation = evaluateCampaignDependencies({ nodeId: node.nodeId, nodes, dependencies });
  const priorityBreakdown = calculateCampaignPriorityBreakdown(node, { dependencyEvaluation, planningAt: KNOWLEDGE_CATALOG_GENERATED_AT });
  const adapterId = "noxia:p9-fixture-adapter:p7-replay";
  const manifest = createCampaignManifest({ node, priorityBreakdown, dependencyEvaluation, catalogPlanningDigest: planningDigest, generatedAt: KNOWLEDGE_CATALOG_GENERATED_AT, executionPolicy: { adapterId } });
  const baseCatalog = { catalogId: "noxia:p9-fixture-catalog:p7-replay", planningDigest, dependencyRegistry: dependencies, campaignExecutions: executions, campaigns: Object.freeze([manifest]), nodes, fixtureOnly: true, scope: INDUSTRIAL_FIXTURE_SCOPE };
  const catalog = Object.freeze({ ...baseCatalog, digest: sha256Digest(baseCatalog) });
  const adapter = Object.freeze({
    adapterId,
    async prepare() {
      return Object.freeze({
        records: Object.freeze([]),
        additions: hepaticImagingCampaignExecution.additions,
        gaps: hepaticImagingCampaignExecution.gaps,
        outputDigests: Object.freeze({ legacyP7Result: hepaticImagingCampaignExecution.resultDigest }),
      });
    },
  });
  return Object.freeze({ node, manifest, catalog, adapter });
};
