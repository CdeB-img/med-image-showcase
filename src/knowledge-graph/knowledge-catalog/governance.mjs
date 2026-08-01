import { scientificKnowledgeCatalog } from "./catalog-builder.mjs";
import { PROJECTION_CAPABILITIES, TERMINAL_STATUSES } from "./constants.mjs";

export const KNOWLEDGE_CATALOG_GOVERNANCE_VERSION = "1.0.0";

const decision = ({ authorized, operation, nodeId, capability = null, blockers = [] }) => Object.freeze({
  authorized,
  operation,
  nodeId,
  capability,
  blockers: Object.freeze(blockers),
  catalogueDigest: scientificKnowledgeCatalog.digest,
  governanceVersion: KNOWLEDGE_CATALOG_GOVERNANCE_VERSION,
  publicPublicationAuthorized: false,
});

export const authorizeScientificEnrichment = ({ nodeId, catalog = scientificKnowledgeCatalog } = {}) => {
  const node = catalog.nodes.find((item) => item.nodeId === nodeId);
  if (!node) return decision({ authorized: false, operation: "SCIENTIFIC_ENRICHMENT", nodeId, blockers: ["NODE_NOT_IN_CATALOG"] });
  if (TERMINAL_STATUSES.includes(node.status)) return decision({ authorized: false, operation: "SCIENTIFIC_ENRICHMENT", nodeId, blockers: ["NODE_TERMINAL"] });
  return decision({ authorized: true, operation: "SCIENTIFIC_ENRICHMENT", nodeId });
};

export const authorizeScientificProjection = ({ nodeId, capability, catalog = scientificKnowledgeCatalog } = {}) => {
  const node = catalog.nodes.find((item) => item.nodeId === nodeId);
  if (!node) return decision({ authorized: false, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, blockers: ["NODE_NOT_IN_CATALOG"] });
  if (!PROJECTION_CAPABILITIES.includes(capability)) return decision({ authorized: false, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, blockers: ["UNKNOWN_PROJECTION_CAPABILITY"] });
  if (!node.projectionCapabilities.available.includes(capability)) {
    const evaluation = node.projectionCapabilities.evaluations.find((item) => item.capability === capability);
    return decision({ authorized: false, operation: "SCIENTIFIC_PROJECTION", nodeId, capability, blockers: evaluation?.blockers ?? ["PROJECTION_NOT_AVAILABLE"] });
  }
  return decision({ authorized: true, operation: "SCIENTIFIC_PROJECTION", nodeId, capability });
};

export const requireCataloguedScientificOperation = (request) => {
  const result = request.operation === "SCIENTIFIC_PROJECTION"
    ? authorizeScientificProjection(request)
    : authorizeScientificEnrichment(request);
  if (!result.authorized) throw new Error(`Scientific operation rejected: ${result.blockers.join(", ")}`);
  return result;
};
