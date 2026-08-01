import { sha256Digest } from "../../migration/stable-json.mjs";
import { P10_COVERAGE_STATES, P10_GIT_SHA } from "./constants.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};
const id = (item) => item.nodeId ?? item.revisionId ?? item.evidenceLinkId ?? item.synthesisId ?? item.projectionId ?? item.stableId ?? item.campaignRevisionId ?? item.campaignId;
const digest = (item) => item.digest ?? item.deterministicDigest ?? item.resultDigest ?? sha256Digest(item);

export const coverageStateForNode = (node) => {
  if (node.readiness?.publicPublicationReady?.ready) return "PUBLIC_READY";
  if (node.readiness?.editorialProjectionReady?.ready) return "EDITORIAL_READY";
  if ((node.metrics?.projectionCount ?? 0) > 0) return "PROJECTED";
  if ((node.metrics?.synthesisCount ?? 0) > 0) return "SYNTHESIZED";
  if ((node.metrics?.evidenceLinkCount ?? 0) > 0 && node.metrics.localizedEvidenceLinkCount === node.metrics.evidenceLinkCount) return "EVIDENCED";
  if ((node.metrics?.assertionCount ?? 0) > 0) return "ASSERTED";
  if ((node.metrics?.sourceCount ?? 0) > 0) return "SOURCED";
  if (["DISCOVERING", "SOURCING"].includes(node.status)) return "DISCOVERING";
  return "UNCOVERED";
};

export const createScientificProductionSnapshot = ({ phase, catalog, registry, territoryModel, warnings = [] } = {}) => {
  const inventory = (items) => freeze(items.map((item) => freeze({ id: id(item), digest: digest(item) })).sort((a, b) => String(a.id).localeCompare(String(b.id))));
  const material = {
    phase,
    gitSha: P10_GIT_SHA,
    catalog: { catalogId: catalog.catalogId, version: catalog.version, digest: catalog.digest, planningDigest: catalog.planningDigest },
    territory: { modelId: territoryModel.modelId, version: territoryModel.version, digest: territoryModel.digest },
    knowledgeNodes: inventory(catalog.nodes),
    sources: inventory(registry.sources),
    assertions: inventory(registry.assertions),
    evidenceLinks: inventory(registry.evidenceLinks),
    syntheses: inventory(registry.syntheses),
    projections: inventory(registry.projections),
    campaigns: inventory(catalog.campaigns),
    coverage: freeze(catalog.nodes.map((node) => freeze({ nodeId: node.nodeId, state: coverageStateForNode(node), sourceCoverage: node.sourceCoverage, assertionCoverage: node.assertionCoverage, scientificCoverage: node.scientificCoverage, projectionCoverage: node.projectionCoverage })).sort((a, b) => a.nodeId.localeCompare(b.nodeId))),
    readiness: freeze(catalog.nodes.map((node) => freeze({ nodeId: node.nodeId, readiness: node.readiness })).sort((a, b) => a.nodeId.localeCompare(b.nodeId))),
    priorityQueue: freeze(catalog.campaigns.map((campaign, index) => freeze({ rank: index + 1, campaignRevisionId: campaign.campaignRevisionId, nodeIds: campaign.selectedNodeIds, priority: campaign.prioritySnapshot, status: campaign.status }))),
    warnings: freeze([...warnings]),
  };
  return freeze({ ...material, digests: freeze({ catalog: catalog.digest, planning: catalog.planningDigest, territory: territoryModel.digest, registry: sha256Digest({ sources: material.sources, assertions: material.assertions, evidenceLinks: material.evidenceLinks, syntheses: material.syntheses, projections: material.projections }) }), snapshotDigest: sha256Digest(material) });
};

export const createScientificCoverageReport = ({ catalog, territoryModel, previousCatalog = null } = {}) => {
  const catalogById = new Map(catalog.nodes.map((node) => [node.nodeId, node]));
  const previousById = new Map((previousCatalog?.nodes ?? []).map((node) => [node.nodeId, node]));
  const rows = territoryModel.nodes.flatMap((territoryNode) => territoryNode.catalogNodeIds.flatMap((catalogNodeId) => {
    const node = catalogById.get(catalogNodeId);
    if (!node) return [];
    const previous = previousById.get(catalogNodeId);
    return [freeze({
      territoryNodeId: territoryNode.territoryNodeId,
      catalogNodeId,
      state: coverageStateForNode(node),
      previousState: previous ? coverageStateForNode(previous) : null,
      sources: node.metrics.sourceCount,
      assertions: node.metrics.assertionCount,
      evidenceLinks: node.metrics.evidenceLinkCount,
      syntheses: node.metrics.synthesisCount,
      projections: node.metrics.projectionCount,
      publicArtifacts: node.metrics.publicPageCount,
    })];
  })).sort((a, b) => a.territoryNodeId.localeCompare(b.territoryNodeId));
  const byState = Object.fromEntries(P10_COVERAGE_STATES.map((state) => [state, rows.filter((row) => row.state === state).length]));
  const material = { catalogDigest: catalog.digest, territoryDigest: territoryModel.digest, rows, byState };
  return freeze({ ...material, digest: sha256Digest(material) });
};

const readinessDimension = (status, rules, errors = [], warnings = [], gaps = []) => freeze({ status, ready: status === "READY", rules: freeze(rules), errors: freeze(errors), warnings: freeze(warnings), gaps: freeze(gaps), justification: status === "READY" ? `All ${rules.length} explicit rules pass.` : `Blocked by ${errors.join(", ") || gaps.join(", ") || "explicit readiness conditions"}.` });

export const createTerritorialReadinessReport = ({ catalog, nodeId } = {}) => {
  const node = catalog.nodes.find((item) => item.nodeId === nodeId);
  if (!node) throw new Error(`SCIENTIFIC_READINESS_NODE_MISSING:${nodeId}`);
  const localized = node.metrics.evidenceLinkCount > 0 && node.metrics.localizedEvidenceLinkCount === node.metrics.evidenceLinkCount;
  const dimensions = freeze({
    scientificReadiness: readinessDimension(node.metrics.assertionCount > 0 ? "READY" : "BLOCKED", ["AT_LEAST_ONE_ATOMIC_ASSERTION", "NO_AUTOMATIC_HUMAN_REVIEW_CLAIM"], node.metrics.assertionCount > 0 ? [] : ["NO_ASSERTION"], ["SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"]),
    provenanceReadiness: readinessDimension(node.metrics.sourceCount > 0 && localized ? "READY" : "BLOCKED", ["SOURCE_PRESENT", "ALL_EVIDENCE_LOCALIZED"], [node.metrics.sourceCount === 0 ? "NO_SOURCE" : null, !localized ? "UNLOCALIZED_EVIDENCE" : null].filter(Boolean)),
    coverageReadiness: readinessDimension(node.sourceCoverage.ratio === 1 && node.assertionCoverage.ratio === 1 ? "READY" : "BLOCKED", ["SOURCE_TARGET_MET", "ASSERTION_TARGET_MET"], node.sourceCoverage.ratio === 1 && node.assertionCoverage.ratio === 1 ? [] : ["COVERAGE_TARGET_INCOMPLETE"]),
    synthesisReadiness: readinessDimension(node.metrics.synthesisCount > 0 ? "READY" : "BLOCKED", ["DETERMINISTIC_SYNTHESIS_PRESENT"], node.metrics.synthesisCount > 0 ? [] : ["NO_SYNTHESIS"]),
    projectionReadiness: readinessDimension(node.metrics.projectionCount > 0 ? "READY" : "BLOCKED", ["INTERNAL_ONLY_PROJECTION_PRESENT"], node.metrics.projectionCount > 0 ? [] : ["NO_INTERNAL_PROJECTION"]),
    editorialReadiness: readinessDimension(node.readiness.editorialProjectionReady.ready ? "READY" : "BLOCKED", ["SCIENTIFIC_PROJECTION_EXPLOITABLE", "LIMITS_AND_GAPS_VISIBLE"], node.readiness.editorialProjectionReady.ready ? [] : node.readiness.editorialProjectionReady.blockers, ["SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"]),
    publicReadiness: readinessDimension("BLOCKED", ["SEPARATE_PUBLICATION_APPROVAL", "SEO_AND_ROUTE_CONTRACTS", "SCIENTIFIC_REVIEW_POLICY"], ["PUBLICATION_OUT_OF_SCOPE", "NO_PUBLIC_CONTENT", "NO_ROUTE", "NO_CANONICAL"]),
  });
  return freeze({ nodeId, coverageState: coverageStateForNode(node), dimensions, opaqueAggregateScore: null, digest: sha256Digest({ nodeId, dimensions }) });
};

export const createScientificQueueReport = ({ catalog, territoryModel } = {}) => {
  const territoryNodes = territoryModel?.nodes ?? [];
  const catalogById = new Map(catalog.nodes.map((node) => [node.nodeId, node]));
  const territoryForCatalogNode = (catalogNodeId) => {
    const catalogNode = catalogById.get(catalogNodeId);
    const candidateIds = [catalogNodeId, ...(catalogNode?.relatedDomains ?? []), ...(catalogNode?.parents ?? [])];
    return territoryNodes.find((node) => node.level === "DOMAIN" && candidateIds.some((id) => node.catalogNodeIds.includes(id)))?.territoryNodeId ?? null;
  };
  const entries = catalog.campaigns.map((campaign, index) => {
    const knowledgeNodeId = campaign.selectedNodeIds[0];
    const node = catalog.nodes.find((item) => item.nodeId === knowledgeNodeId);
    return freeze({
      rank: index + 1,
      territoryNodeId: territoryForCatalogNode(knowledgeNodeId),
      knowledgeNodeId,
      priority: campaign.prioritySnapshot,
      coverage: campaign.coverageSnapshot,
      readiness: campaign.coverageSnapshot.readiness,
      sourcesAvailable: node?.metrics?.sourceCount ?? 0,
      assertionsAvailable: node?.metrics?.assertionCount ?? 0,
      dependencies: campaign.dependencySnapshot,
      risk: campaign.riskSnapshot,
      campaignDefinitionId: campaign.campaignDefinitionId,
      state: campaign.status,
      nextTreatment: index === 0 ? "NEXT_ATOMIC_CAMPAIGN_CANDIDATE" : "QUEUED",
    });
  });
  return freeze({
  catalogDigest: catalog.digest,
  planningDigest: catalog.planningDigest,
  entries: freeze(entries),
  digest: sha256Digest(catalog.campaigns.map((campaign) => campaign.campaignRevisionId)),
  });
};
