export const CAMPAIGN_DEPENDENCY_CONTRACT_VERSION = "1.0.0";

export const CAMPAIGN_DEPENDENCY_TYPES = Object.freeze([
  "prerequisite",
  "blocks",
  "requiresCoverageFrom",
  "requiresConcept",
  "requiresMethod",
  "complementary",
  "supersedes",
  "optionalDependency",
]);

const blockingTypes = new Set([
  "prerequisite",
  "blocks",
  "requiresCoverageFrom",
  "requiresConcept",
  "requiresMethod",
]);

const terminalStatuses = new Set(["DEPRECATED", "OBSOLETE"]);
const methodTypes = new Set([
  "AcquisitionMethod",
  "MeasurementMethod",
  "QualityMethod",
  "ReconstructionMethod",
  "SoftwareMethod",
]);

const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

export const normalizeCampaignDependency = (input) => {
  const dependency = {
    dependencyId: input.dependencyId,
    type: input.type,
    sourceNodeId: input.sourceNodeId,
    targetNodeId: input.targetNodeId,
    minimumCoverage: input.minimumCoverage ?? 1,
    requiredConceptId: input.requiredConceptId ?? null,
    requiredMethodId: input.requiredMethodId ?? null,
    rationale: input.rationale ?? null,
    optional: input.type === "optionalDependency" || Boolean(input.optional),
    status: input.status ?? "ACTIVE",
  };
  return Object.freeze(dependency);
};

const dependencyEdges = (dependencies) => dependencies
  .filter((item) => item.status === "ACTIVE" && blockingTypes.has(item.type))
  .map((item) => item.type === "blocks"
    ? [item.sourceNodeId, item.targetNodeId]
    : [item.targetNodeId, item.sourceNodeId]);

export const detectCampaignDependencyCycles = (nodes, dependencies = []) => {
  const nodeIds = new Set(nodes.map((node) => node.nodeId));
  const outgoing = new Map([...nodeIds].map((nodeId) => [nodeId, []]));
  const indegree = new Map([...nodeIds].map((nodeId) => [nodeId, 0]));
  for (const [fromId, toId] of dependencyEdges(dependencies)) {
    if (!nodeIds.has(fromId) || !nodeIds.has(toId)) continue;
    outgoing.get(fromId).push(toId);
    indegree.set(toId, indegree.get(toId) + 1);
  }
  const queue = [...indegree.entries()].filter(([, count]) => count === 0).map(([nodeId]) => nodeId).sort();
  let cursor = 0;
  let visited = 0;
  while (cursor < queue.length) {
    const nodeId = queue[cursor];
    cursor += 1;
    visited += 1;
    for (const targetId of outgoing.get(nodeId).sort()) {
      indegree.set(targetId, indegree.get(targetId) - 1);
      if (indegree.get(targetId) === 0) queue.push(targetId);
    }
  }
  return Object.freeze({
    cyclic: visited !== nodes.length,
    cycleNodeIds: Object.freeze([...indegree.entries()].filter(([, count]) => count > 0).map(([nodeId]) => nodeId).sort()),
    visited,
  });
};

const dependencyAppliesToNode = (dependency, nodeId) => dependency.type === "blocks"
  ? dependency.targetNodeId === nodeId
  : dependency.sourceNodeId === nodeId;

const targetForNode = (dependency) => dependency.type === "blocks"
  ? dependency.sourceNodeId
  : dependency.targetNodeId;

const isEnrichmentComplete = (node) => Boolean(
  node
  && node.sourceCoverage?.ratio >= 1
  && node.assertionCoverage?.ratio >= 1
  && node.readiness?.provenanceReady?.ready
  && node.readiness?.scientificReady?.ready,
);

const evaluateOne = (dependency, nodeById) => {
  const targetId = targetForNode(dependency);
  const target = nodeById.get(targetId);
  if (dependency.optional || dependency.type === "complementary") {
    return { satisfied: true, blocking: false, reason: target ? "OPTIONAL_DEPENDENCY_OBSERVED" : "OPTIONAL_DEPENDENCY_ABSENT" };
  }
  if (dependency.type === "supersedes") {
    return { satisfied: true, blocking: false, reason: "LIFECYCLE_RELATION_NON_BLOCKING" };
  }
  if (!target) return { satisfied: false, blocking: true, reason: "DEPENDENCY_TARGET_MISSING" };
  if (terminalStatuses.has(target.status)) return { satisfied: false, blocking: true, reason: "DEPENDENCY_TARGET_TERMINAL" };
  if (dependency.type === "requiresConcept") {
    const conceptId = dependency.requiredConceptId ?? targetId;
    const concept = nodeById.get(conceptId);
    return concept && !terminalStatuses.has(concept.status)
      ? { satisfied: true, blocking: false, reason: "REQUIRED_CONCEPT_AVAILABLE" }
      : { satisfied: false, blocking: true, reason: "REQUIRED_CONCEPT_UNAVAILABLE" };
  }
  if (dependency.type === "requiresMethod") {
    const methodId = dependency.requiredMethodId ?? targetId;
    const method = nodeById.get(methodId);
    return method && methodTypes.has(method.nodeType) && !terminalStatuses.has(method.status)
      ? { satisfied: true, blocking: false, reason: "REQUIRED_METHOD_AVAILABLE" }
      : { satisfied: false, blocking: true, reason: "REQUIRED_METHOD_UNAVAILABLE" };
  }
  if (dependency.type === "requiresCoverageFrom") {
    return target.scientificCoverage?.ratio >= dependency.minimumCoverage
      ? { satisfied: true, blocking: false, reason: "REQUIRED_COVERAGE_REACHED" }
      : { satisfied: false, blocking: true, reason: "REQUIRED_COVERAGE_NOT_REACHED" };
  }
  return isEnrichmentComplete(target)
    ? { satisfied: true, blocking: false, reason: dependency.type === "blocks" ? "BLOCKER_RESOLVED" : "PREREQUISITE_COMPLETE" }
    : { satisfied: false, blocking: true, reason: dependency.type === "blocks" ? "BLOCKER_ACTIVE" : "PREREQUISITE_INCOMPLETE" };
};

export const evaluateCampaignDependencies = ({ nodeId, nodes, dependencies = [] }) => {
  const nodeById = new Map(nodes.map((node) => [node.nodeId, node]));
  const evaluations = dependencies
    .filter((dependency) => dependency.status === "ACTIVE" && dependencyAppliesToNode(dependency, nodeId))
    .map((dependency) => Object.freeze({ dependencyId: dependency.dependencyId, type: dependency.type, targetNodeId: targetForNode(dependency), ...evaluateOne(dependency, nodeById) }))
    .sort((a, b) => a.dependencyId.localeCompare(b.dependencyId));
  const blockers = evaluations.filter((item) => item.blocking && !item.satisfied);
  return Object.freeze({
    nodeId,
    satisfied: blockers.length === 0,
    blockers: Object.freeze(blockers),
    evaluations: Object.freeze(evaluations),
  });
};

export const validateCampaignDependencies = ({ nodes, dependencies = [] }) => {
  const errors = [];
  const nodeIds = new Set(nodes.map((node) => node.nodeId));
  const dependencyIds = dependencies.map((item) => item.dependencyId);
  for (const dependency of dependencies) {
    if (!dependency.dependencyId) errors.push({ code: "CAMPAIGN_DEPENDENCY_ID_MISSING" });
    if (!CAMPAIGN_DEPENDENCY_TYPES.includes(dependency.type)) errors.push({ code: "CAMPAIGN_DEPENDENCY_TYPE_UNKNOWN", dependencyId: dependency.dependencyId, type: dependency.type });
    if (!nodeIds.has(dependency.sourceNodeId)) errors.push({ code: "CAMPAIGN_DEPENDENCY_SOURCE_MISSING", dependencyId: dependency.dependencyId, nodeId: dependency.sourceNodeId });
    if (!nodeIds.has(dependency.targetNodeId) && !dependency.optional) errors.push({ code: "CAMPAIGN_DEPENDENCY_TARGET_MISSING", dependencyId: dependency.dependencyId, nodeId: dependency.targetNodeId });
    if (dependency.sourceNodeId === dependency.targetNodeId) errors.push({ code: "CAMPAIGN_DEPENDENCY_SELF_REFERENCE", dependencyId: dependency.dependencyId });
  }
  for (const duplicate of unique(dependencyIds.filter((id, index) => dependencyIds.indexOf(id) !== index))) errors.push({ code: "CAMPAIGN_DEPENDENCY_ID_DUPLICATE", dependencyId: duplicate });
  const cycle = detectCampaignDependencyCycles(nodes, dependencies);
  if (cycle.cyclic) errors.push({ code: "CAMPAIGN_DEPENDENCY_CYCLE", nodeIds: cycle.cycleNodeIds });
  const deadCampaigns = unique(nodes.filter((node) => {
    const evaluation = evaluateCampaignDependencies({ nodeId: node.nodeId, nodes, dependencies });
    return evaluation.blockers.some((item) => ["DEPENDENCY_TARGET_MISSING", "DEPENDENCY_TARGET_TERMINAL", "REQUIRED_CONCEPT_UNAVAILABLE", "REQUIRED_METHOD_UNAVAILABLE"].includes(item.reason));
  }).map((node) => node.nodeId));
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), cycle, deadCampaigns: Object.freeze(deadCampaigns) });
};
