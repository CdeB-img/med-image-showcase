import { sha256Digest } from "../migration/stable-json.mjs";
import { createCampaignManifest } from "./campaign-contracts.mjs";
import { evaluateCampaignDependencies } from "./campaign-dependencies.mjs";
import { KNOWLEDGE_CATALOG_GENERATED_AT, READY_LIKE_STATUSES, TERMINAL_STATUSES } from "./constants.mjs";

export const CAMPAIGN_ENGINE_VERSION = "2.0.0";
export const LEGACY_CAMPAIGN_ENGINE_VERSION = "1.0.0";
export const CAMPAIGN_MAX_NODES = 20;

const slug = (value) => String(value).split(":").at(-1).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
const round = (value, digits = 4) => Number(value.toFixed(digits));
const ratioGap = (coverage) => round(Math.max(0, 1 - (coverage?.ratio ?? 0)));

const legacySortNodes = (a, b) => b.priority.score - a.priority.score || a.nodeId.localeCompare(b.nodeId);
const legacyCampaignGroup = (node) => node.nodeType === "Domain"
  ? node.nodeId
  : node.relatedDomains[0] ?? "noxia:knowledge-catalog:domain:cross-domain";

export const isLegacyCampaignCandidate = (node) => (
  node.priority.level === "HIGH"
  && !READY_LIKE_STATUSES.includes(node.status)
  && !TERMINAL_STATUSES.includes(node.status)
  && node.sourceCoverage.ratio < 1
  && node.assertionCoverage.ratio < 1
);

export const buildLegacyScientificEnrichmentCampaigns = (nodes, { maxNodes = CAMPAIGN_MAX_NODES } = {}) => {
  const candidates = nodes.filter(isLegacyCampaignCandidate).sort(legacySortNodes);
  const grouped = Map.groupBy(candidates, legacyCampaignGroup);
  const campaigns = [];
  for (const [groupId, groupNodes] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = [...groupNodes].sort(legacySortNodes);
    for (let offset = 0; offset < ordered.length; offset += maxNodes) {
      const batch = ordered.slice(offset, offset + maxNodes);
      const sequence = Math.floor(offset / maxNodes) + 1;
      campaigns.push(Object.freeze({
        campaignId: `noxia:scientific-campaign:${slug(groupId)}:${String(sequence).padStart(2, "0")}`,
        campaignVersion: "1.0.0",
        groupId,
        nodeIds: Object.freeze(batch.map((node) => node.nodeId)),
        priority: "HIGH",
        status: "PLANNED_INTERNAL",
        selectionRule: Object.freeze({
          priority: "HIGH",
          excludedStatuses: Object.freeze([...READY_LIKE_STATUSES, ...TERMINAL_STATUSES]),
          sourceCoverageBelow: 1,
          assertionCoverageBelow: 1,
          manualDomainSelection: false,
        }),
        justifications: Object.freeze(batch.map((node) => Object.freeze({
          nodeId: node.nodeId,
          priorityScore: node.priority.score,
          status: node.status,
          sourceGap: Math.max(0, node.sourceCoverage.target - node.sourceCoverage.count),
          assertionGap: Math.max(0, node.assertionCoverage.target - node.assertionCoverage.count),
          projectionPotential: node.projectionCapabilities.potential,
        }))),
        generatedContent: false,
        generatedAssertions: false,
        publicationAuthorized: false,
        engineVersion: LEGACY_CAMPAIGN_ENGINE_VERSION,
      }));
    }
  }
  return Object.freeze(campaigns);
};

export const calculateCampaignReentry = (node, { planningAt = KNOWLEDGE_CATALOG_GENERATED_AT } = {}) => {
  const requiresAssertions = (node.targets?.assertions ?? node.assertionCoverage?.target ?? 0) > 0;
  const sourceGap = ratioGap(node.sourceCoverage);
  const assertionGap = requiresAssertions ? ratioGap(node.assertionCoverage) : 0;
  const provenanceGap = !node.readiness?.provenanceReady?.ready;
  const scientificGap = requiresAssertions && !node.readiness?.scientificReady?.ready;
  const projectionExists = (node.metrics?.projectionCount ?? 0) > 0;
  const openPriorityGaps = Boolean(node.lifecycle?.priorityGapsOpen || node.provenance?.priorityGapsOpen);
  const sourceRevisionAvailable = Boolean(node.lifecycle?.newSourceRevisionAvailable || node.provenance?.newSourceRevisionAvailable);
  const projectionCapabilityGap = Boolean(node.lifecycle?.projectionReviewRequired || node.provenance?.projectionReviewRequired);
  const periodicReviewDue = Boolean(node.nextReview && Date.parse(node.nextReview) <= Date.parse(planningAt));
  const reentryReasons = [
    sourceGap > 0 ? "SOURCE_COVERAGE_INCOMPLETE" : null,
    assertionGap > 0 ? "ASSERTION_COVERAGE_INCOMPLETE" : null,
    provenanceGap ? "PROVENANCE_INCOMPLETE" : null,
    scientificGap ? "SCIENTIFIC_READINESS_INCOMPLETE" : null,
    projectionCapabilityGap ? "PROJECTION_CAPABILITY_REVIEW_REQUIRED" : null,
    openPriorityGaps ? "PRIORITY_GAPS_OPEN" : null,
    periodicReviewDue ? "PERIODIC_REVIEW_DUE" : null,
    sourceRevisionAvailable ? "NEW_SOURCE_OR_VERSION_AVAILABLE" : null,
  ].filter(Boolean);
  const enrichmentComplete = sourceGap === 0
    && assertionGap === 0
    && !provenanceGap
    && !scientificGap
    && !projectionCapabilityGap
    && !openPriorityGaps
    && !periodicReviewDue
    && !sourceRevisionAvailable;
  const severity = round(
    sourceGap * 0.30
    + assertionGap * 0.30
    + (provenanceGap ? 0.15 : 0)
    + (scientificGap ? 0.10 : 0)
    + (projectionCapabilityGap ? 0.05 : 0)
    + (openPriorityGaps ? 0.05 : 0)
    + (periodicReviewDue ? 0.025 : 0)
    + (sourceRevisionAvailable ? 0.025 : 0),
  );
  return Object.freeze({
    projectionExists,
    enrichmentComplete,
    reentryReasons: Object.freeze(reentryReasons),
    gapSeverity: severity,
    sourceGap,
    assertionGap,
    provenanceGap,
    scientificGap,
    projectionCapabilityGap,
    openPriorityGaps,
    periodicReviewDue,
    sourceRevisionAvailable,
  });
};

export const calculateCampaignPriorityBreakdown = (node, options = {}) => {
  const reentry = calculateCampaignReentry(node, options);
  return Object.freeze({
    priorityScore: node.priority.score,
    gapSeverity: reentry.gapSeverity,
    scientificValue: node.priority.components.scientificValue,
    editorialValue: node.priority.components.editorialValue,
    documentaryAvailability: node.priority.components.documentaryAvailability,
    dependenciesSatisfied: options.dependencyEvaluation?.satisfied ?? true,
    queueAge: node.createdAt,
    nodeId: node.nodeId,
    ...reentry,
    orderingPolicy: Object.freeze([
      "priorityScore:desc",
      "gapSeverity:desc",
      "scientificValue:desc",
      "editorialValue:desc",
      "documentaryAvailability:desc",
      "dependenciesSatisfied:desc",
      "queueAge:asc",
      "nodeId:asc",
    ]),
  });
};

const compareBreakdown = (a, b) => (
  b.priorityScore - a.priorityScore
  || b.gapSeverity - a.gapSeverity
  || b.scientificValue - a.scientificValue
  || b.editorialValue - a.editorialValue
  || b.documentaryAvailability - a.documentaryAvailability
  || Number(b.dependenciesSatisfied) - Number(a.dependenciesSatisfied)
  || String(a.queueAge).localeCompare(String(b.queueAge))
  || a.nodeId.localeCompare(b.nodeId)
);

export const createCatalogPlanningDigest = ({ nodes, dependencies = [], executions = [] }) => sha256Digest({
  engineVersion: CAMPAIGN_ENGINE_VERSION,
  nodes: nodes.map((node) => ({
    nodeId: node.nodeId,
    status: node.status,
    priority: node.priority,
    sourceCoverage: node.sourceCoverage,
    assertionCoverage: node.assertionCoverage,
    scientificCoverage: node.scientificCoverage,
    projectionCoverage: node.projectionCoverage,
    readiness: node.readiness,
    projectionCount: node.metrics.projectionCount,
    nextReview: node.nextReview,
    lifecycle: node.lifecycle,
  })).sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
  dependencies,
  completedRevisions: executions
    .filter((execution) => ["COMPLETED", "COMPLETED_WITH_GAPS", "COMPLETED_WITH_EXPLICIT_GAPS"].includes(execution.status))
    .map((execution) => execution.campaignRevisionId ?? execution.revisionId ?? execution.campaignId)
    .sort(),
});

export const isCampaignCandidate = (node, {
  nodes = [node],
  dependencies = [],
  planningAt = KNOWLEDGE_CATALOG_GENERATED_AT,
  dependencyEvaluation = evaluateCampaignDependencies({ nodeId: node?.nodeId, nodes, dependencies }),
} = {}) => {
  if (!node || node.priority?.level !== "HIGH" || TERMINAL_STATUSES.includes(node.status)) return false;
  if (!dependencyEvaluation.satisfied || (node.blockingNodes?.length ?? 0) > 0) return false;
  return !calculateCampaignReentry(node, { planningAt }).enrichmentComplete;
};

export const buildScientificEnrichmentCampaigns = (nodes, {
  dependencies = [],
  executions = [],
  planningAt = KNOWLEDGE_CATALOG_GENERATED_AT,
  catalogPlanningDigest = createCatalogPlanningDigest({ nodes, dependencies, executions }),
} = {}) => {
  const completedRevisionIds = new Set(executions
    .filter((execution) => ["COMPLETED", "COMPLETED_WITH_GAPS", "COMPLETED_WITH_EXPLICIT_GAPS"].includes(execution.status))
    .map((execution) => execution.campaignRevisionId ?? execution.revisionId)
    .filter(Boolean));
  const candidates = nodes.map((node) => {
    const dependencyEvaluation = evaluateCampaignDependencies({ nodeId: node.nodeId, nodes, dependencies });
    const priorityBreakdown = calculateCampaignPriorityBreakdown(node, { planningAt, dependencyEvaluation });
    return { node, dependencyEvaluation, priorityBreakdown };
  }).filter(({ node, dependencyEvaluation }) => isCampaignCandidate(node, { nodes, dependencies, planningAt, dependencyEvaluation }))
    .sort((a, b) => compareBreakdown(a.priorityBreakdown, b.priorityBreakdown));
  const campaigns = candidates.map(({ node, dependencyEvaluation, priorityBreakdown }) => createCampaignManifest({
    node,
    priorityBreakdown,
    dependencyEvaluation,
    catalogPlanningDigest,
    generatedAt: planningAt,
  })).filter((campaign) => !completedRevisionIds.has(campaign.campaignRevisionId));
  return Object.freeze(campaigns);
};

export const campaignSummary = (campaigns) => Object.freeze({
  campaigns: campaigns.length,
  selectedNodes: new Set(campaigns.flatMap((item) => item.selectedNodeIds ?? item.nodeIds)).size,
  manualDomainSelections: campaigns.filter((item) => item.selectionRule.manualDomainSelection).length,
  publicationAuthorized: campaigns.some((item) => item.publicationAuthorized),
  projectedNodesReentered: campaigns.filter((item) => item.coverageSnapshot?.projectionExists).length,
});
