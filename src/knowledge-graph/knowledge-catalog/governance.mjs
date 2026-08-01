import { sha256Digest } from "../migration/stable-json.mjs";
import { scientificKnowledgeCatalog } from "./catalog-builder.mjs";
import { validateCampaignManifest } from "./campaign-contracts.mjs";
import { PROJECTION_CAPABILITIES, TERMINAL_STATUSES } from "./constants.mjs";

export const KNOWLEDGE_CATALOG_GOVERNANCE_VERSION = "2.0.0";

const supportedOperations = new Set([
  "SCIENTIFIC_CAMPAIGN_EXECUTION",
  "SCIENTIFIC_ENRICHMENT",
  "SCIENTIFIC_PROJECTION",
]);

const decision = ({ authorized, operation, catalog, nodeId = null, capability = null, blockers = [], manifest = null }) => {
  const material = {
    authorized,
    operation,
    catalogDigest: catalog?.digest ?? null,
    catalogPlanningDigest: catalog?.planningDigest ?? null,
    selectedNodeIds: manifest?.selectedNodeIds ?? (nodeId ? [nodeId] : []),
    campaignRevisionId: manifest?.campaignRevisionId ?? null,
    selectionDigest: manifest?.selectionDigest ?? null,
    blockers,
    governanceVersion: KNOWLEDGE_CATALOG_GOVERNANCE_VERSION,
  };
  return Object.freeze({
    authorized,
    operation,
    nodeId,
    capability,
    blockers: Object.freeze([...blockers]),
    catalogueDigest: catalog?.digest ?? null,
    catalogPlanningDigest: catalog?.planningDigest ?? null,
    campaignDefinitionId: manifest?.campaignDefinitionId ?? null,
    campaignRevisionId: manifest?.campaignRevisionId ?? null,
    selectionDigest: manifest?.selectionDigest ?? null,
    governanceToken: authorized ? `noxia:campaign-governance:${sha256Digest(material)}` : null,
    governanceVersion: KNOWLEDGE_CATALOG_GOVERNANCE_VERSION,
    publicPublicationAuthorized: false,
  });
};

const completedStates = new Set(["COMPLETED", "COMPLETED_WITH_GAPS", "COMPLETED_WITH_EXPLICIT_GAPS"]);

export const authorizeCampaignExecution = ({ campaignManifest, catalog = scientificKnowledgeCatalog } = {}) => {
  const blockers = [];
  const validation = validateCampaignManifest(campaignManifest);
  blockers.push(...validation.errors.map((error) => error.code));
  if (!catalog || !Array.isArray(catalog.nodes) || !Array.isArray(catalog.campaigns)) blockers.push("CATALOG_INVALID");
  if (blockers.length) return decision({ authorized: false, operation: "SCIENTIFIC_CAMPAIGN_EXECUTION", catalog, blockers, manifest: campaignManifest });
  if (campaignManifest.catalogPlanningDigest !== catalog.planningDigest) blockers.push("CAMPAIGN_CATALOG_DIGEST_MISMATCH");
  const planned = catalog.campaigns.find((campaign) => campaign.campaignRevisionId === campaignManifest.campaignRevisionId);
  if (!planned) blockers.push("CAMPAIGN_REVISION_NOT_PLANNED");
  else if (planned.selectionDigest !== campaignManifest.selectionDigest) blockers.push("CAMPAIGN_SELECTION_NOT_CURRENT");
  if (campaignManifest.status !== "PLANNED") blockers.push("CAMPAIGN_NOT_EXECUTABLE");
  if (!campaignManifest.dependencySnapshot?.satisfied || campaignManifest.dependencySnapshot?.blockers?.length) blockers.push("CAMPAIGN_DEPENDENCIES_UNSATISFIED");
  const byId = new Map(catalog.nodes.map((node) => [node.nodeId, node]));
  for (const nodeId of campaignManifest.selectedNodeIds) {
    const node = byId.get(nodeId);
    if (!node) blockers.push(`NODE_NOT_IN_CATALOG:${nodeId}`);
    else {
      if (TERMINAL_STATUSES.includes(node.status)) blockers.push(`NODE_TERMINAL:${nodeId}`);
      if (node.priority?.level !== "HIGH") blockers.push(`NODE_PRIORITY_NOT_ELIGIBLE:${nodeId}`);
      if (node.blockingNodes?.length) blockers.push(`NODE_BLOCKED:${nodeId}`);
    }
  }
  const alreadyCompleted = (catalog.campaignExecutions ?? []).some((execution) => (
    execution.campaignRevisionId === campaignManifest.campaignRevisionId
    && execution.inputDigest === campaignManifest.inputDigest
    && completedStates.has(execution.status)
  ));
  if (alreadyCompleted) blockers.push("CAMPAIGN_REVISION_ALREADY_COMPLETED");
  return decision({ authorized: blockers.length === 0, operation: "SCIENTIFIC_CAMPAIGN_EXECUTION", catalog, blockers, manifest: campaignManifest });
};

export const authorizeScientificEnrichment = ({ nodeId, campaignManifest, catalog = scientificKnowledgeCatalog } = {}) => {
  if (!campaignManifest) return decision({ authorized: false, operation: "SCIENTIFIC_ENRICHMENT", nodeId, catalog, blockers: ["CAMPAIGN_MANIFEST_REQUIRED"] });
  if (!campaignManifest.selectedNodeIds?.includes(nodeId)) return decision({ authorized: false, operation: "SCIENTIFIC_ENRICHMENT", nodeId, catalog, blockers: ["NODE_OUTSIDE_CAMPAIGN"], manifest: campaignManifest });
  const campaignDecision = authorizeCampaignExecution({ campaignManifest, catalog });
  return decision({ authorized: campaignDecision.authorized, operation: "SCIENTIFIC_ENRICHMENT", nodeId, catalog, blockers: campaignDecision.blockers, manifest: campaignManifest });
};

export const authorizeScientificProjection = ({ nodeId, capability, catalog = scientificKnowledgeCatalog } = {}) => {
  const node = catalog.nodes.find((item) => item.nodeId === nodeId);
  if (!node) return decision({ authorized: false, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, catalog, blockers: ["NODE_NOT_IN_CATALOG"] });
  if (!PROJECTION_CAPABILITIES.includes(capability)) return decision({ authorized: false, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, catalog, blockers: ["UNKNOWN_PROJECTION_CAPABILITY"] });
  if (!node.projectionCapabilities.available.includes(capability)) {
    const evaluation = node.projectionCapabilities.evaluations.find((item) => item.capability === capability);
    return decision({ authorized: false, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, catalog, blockers: evaluation?.blockers ?? ["PROJECTION_NOT_AVAILABLE"] });
  }
  return decision({ authorized: true, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, catalog });
};

export const validateGovernanceToken = ({ decision: governanceDecision, campaignManifest, catalog = scientificKnowledgeCatalog }) => {
  if (!governanceDecision?.authorized || !governanceDecision.governanceToken) return false;
  const expected = authorizeCampaignExecution({ campaignManifest, catalog });
  return expected.authorized
    && expected.governanceToken === governanceDecision.governanceToken
    && governanceDecision.selectionDigest === campaignManifest.selectionDigest
    && governanceDecision.catalogPlanningDigest === catalog.planningDigest;
};

export const requireCataloguedScientificOperation = (request = {}) => {
  if (!supportedOperations.has(request.operation)) throw new Error("Scientific operation rejected: UNKNOWN_SCIENTIFIC_OPERATION");
  const result = request.operation === "SCIENTIFIC_PROJECTION"
    ? authorizeScientificProjection(request)
    : request.operation === "SCIENTIFIC_CAMPAIGN_EXECUTION"
      ? authorizeCampaignExecution(request)
      : authorizeScientificEnrichment(request);
  if (!result.authorized) throw new Error(`Scientific operation rejected: ${result.blockers.join(", ")}`);
  return result;
};
