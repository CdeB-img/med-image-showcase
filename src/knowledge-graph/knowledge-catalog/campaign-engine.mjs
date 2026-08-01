import { READY_LIKE_STATUSES, TERMINAL_STATUSES } from "./constants.mjs";

export const CAMPAIGN_ENGINE_VERSION = "1.0.0";
export const CAMPAIGN_MAX_NODES = 20;

const slug = (value) => String(value).split(":").at(-1).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
const sortNodes = (a, b) => b.priority.score - a.priority.score || a.nodeId.localeCompare(b.nodeId);

export const isCampaignCandidate = (node) => (
  node.priority.level === "HIGH"
  && !READY_LIKE_STATUSES.includes(node.status)
  && !TERMINAL_STATUSES.includes(node.status)
  && node.sourceCoverage.ratio < 1
  && node.assertionCoverage.ratio < 1
);

const campaignGroup = (node) => node.nodeType === "Domain"
  ? node.nodeId
  : node.relatedDomains[0] ?? "noxia:knowledge-catalog:domain:cross-domain";

export const buildScientificEnrichmentCampaigns = (nodes, { maxNodes = CAMPAIGN_MAX_NODES } = {}) => {
  const candidates = nodes.filter(isCampaignCandidate).sort(sortNodes);
  const grouped = Map.groupBy(candidates, campaignGroup);
  const campaigns = [];
  for (const [groupId, groupNodes] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = [...groupNodes].sort(sortNodes);
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
        engineVersion: CAMPAIGN_ENGINE_VERSION,
      }));
    }
  }
  return Object.freeze(campaigns);
};

export const campaignSummary = (campaigns) => Object.freeze({
  campaigns: campaigns.length,
  selectedNodes: new Set(campaigns.flatMap((item) => item.nodeIds)).size,
  manualDomainSelections: campaigns.filter((item) => item.selectionRule.manualDomainSelection).length,
  publicationAuthorized: campaigns.some((item) => item.publicationAuthorized),
});
