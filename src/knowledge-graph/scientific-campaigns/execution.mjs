import { sha256Digest } from "../migration/stable-json.mjs";
import { scientificKnowledgeCatalog, p6ScientificKnowledgeCatalog } from "../knowledge-catalog/catalog-builder.mjs";
import {
  AUTOMATIC_CAMPAIGN_ID,
  AUTOMATIC_CAMPAIGN_NODE_ID,
  hepaticImagingAssertionRevisions,
  hepaticImagingApplicabilityContexts,
  hepaticImagingCampaignExecution,
  hepaticImagingCampaignGaps,
  hepaticImagingConcepts,
  hepaticImagingContextDifferences,
  hepaticImagingEvidenceLinks,
  hepaticImagingInternalProjections,
  hepaticImagingScientificSyntheses,
  hepaticImagingSourceRevisions,
  rejectedHepaticImagingSources,
} from "./hepatic-imaging.mjs";

const snapshotNode = (node) => Object.freeze({
  nodeId: node.nodeId,
  priority: node.priority,
  status: node.status,
  coverage: node.coverage,
  sourceCoverage: node.sourceCoverage,
  assertionCoverage: node.assertionCoverage,
  scientificCoverage: node.scientificCoverage,
  projectionCoverage: node.projectionCoverage,
  readiness: node.readiness,
  projectionCapabilities: node.projectionCapabilities,
  metrics: node.metrics,
  blockingNodes: node.blockingNodes,
});

export const selectFirstUnexecutedScientificCampaign = ({ beforeCatalog = p6ScientificKnowledgeCatalog } = {}) => {
  const executed = new Set(beforeCatalog.campaignExecutions?.map((item) => item.campaignId) ?? []);
  return beforeCatalog.campaigns.find((campaign) => !executed.has(campaign.campaignId)) ?? null;
};

export const createAutomaticCampaignExecutionTrace = ({
  beforeCatalog = p6ScientificKnowledgeCatalog,
  afterCatalog = scientificKnowledgeCatalog,
} = {}) => {
  const selection = selectFirstUnexecutedScientificCampaign({ beforeCatalog });
  if (!selection) throw new Error("NO_UNEXECUTED_SCIENTIFIC_CAMPAIGN");
  if (selection.campaignId !== AUTOMATIC_CAMPAIGN_ID) throw new Error(`AUTOMATIC_CAMPAIGN_SELECTION_MISMATCH:${selection.campaignId}`);
  const beforeNode = beforeCatalog.nodes.find((node) => node.nodeId === AUTOMATIC_CAMPAIGN_NODE_ID);
  const afterNode = afterCatalog.nodes.find((node) => node.nodeId === AUTOMATIC_CAMPAIGN_NODE_ID);
  if (!beforeNode || !afterNode) throw new Error("AUTOMATIC_CAMPAIGN_NODE_MISSING");

  const selectionDigest = sha256Digest(selection);
  const transitionMaterial = {
    beforeCatalogDigest: beforeCatalog.digest,
    selectionDigest,
    campaignResultDigest: hepaticImagingCampaignExecution.resultDigest,
    afterCatalogDigest: afterCatalog.digest,
    beforeNode: snapshotNode(beforeNode),
    afterNode: snapshotNode(afterNode),
  };
  const traceWithoutDigest = Object.freeze({
    traceId: "noxia:scientific-campaign-trace:hepatic-imaging:01",
    traceVersion: "1.0.0",
    immutable: true,
    before: Object.freeze({
      catalogId: beforeCatalog.catalogId,
      catalogVersion: beforeCatalog.version,
      catalogDigest: beforeCatalog.digest,
      availableCampaigns: beforeCatalog.campaigns.length,
      node: snapshotNode(beforeNode),
    }),
    selection: Object.freeze({
      ...selection,
      selectedBy: "FIRST_UNEXECUTED_CAMPAIGN_IN_OFFICIAL_DETERMINISTIC_ORDER",
      selectionDigest,
      dependencies: Object.freeze([...beforeNode.dependencies]),
      blockingNodes: Object.freeze([...beforeNode.blockingNodes]),
      coverageObjectives: Object.freeze({
        sources: beforeNode.sourceCoverage.target,
        assertions: beforeNode.assertionCoverage.target,
        localizedEvidencePerAssertion: beforeNode.targets.evidencePerAssertion,
        syntheses: beforeNode.targets.syntheses,
        internalProjections: beforeNode.targets.projections,
      }),
      stopCriteria: Object.freeze([
        "ALL_SELECTED_KNOWLEDGE_NODES_PROCESSED",
        "SOURCE_COVERAGE_TARGET_REACHED",
        "ASSERTION_COVERAGE_TARGET_REACHED",
        "LOCALIZED_EVIDENCE_TARGET_REACHED",
        "SYNTHESIS_TARGET_REACHED",
        "INTERNAL_PROJECTION_TARGET_REACHED",
      ]),
    }),
    execution: Object.freeze({
      ...hepaticImagingCampaignExecution,
      sourcesExamined: hepaticImagingSourceRevisions.length + rejectedHepaticImagingSources.length,
      sourcesRetained: Object.freeze(hepaticImagingSourceRevisions.map((item) => item.revisionId)),
      sourcesRejected: Object.freeze(rejectedHepaticImagingSources.map((item) => `PMID:${item.pmid}`)),
      conceptsAdded: Object.freeze(hepaticImagingConcepts.map((item) => item.revisionId)),
      assertionsAdded: Object.freeze(hepaticImagingAssertionRevisions.map((item) => item.revisionId)),
      contextsAdded: Object.freeze(hepaticImagingApplicabilityContexts.map((item) => item.contextId)),
      evidenceLinksAdded: Object.freeze(hepaticImagingEvidenceLinks.map((item) => item.evidenceLinkId)),
      contextualDifferencesPreserved: Object.freeze(hepaticImagingContextDifferences.map((item) => item.contradictionId)),
      synthesesUpdated: Object.freeze(hepaticImagingScientificSyntheses.map((item) => item.synthesisId)),
      internalProjectionsUpdated: Object.freeze(hepaticImagingInternalProjections.map((item) => item.projectionId)),
      decisions: Object.freeze([
        "OFFICIAL_FULL_TEXT_ONLY_RETAINED",
        "AUTHOR_POSITION_NOT_PROMOTED_TO_CONSENSUS",
        "CONTEXT_DIFFERENCES_NOT_RESOLVED_AS_CONTRADICTIONS",
        "NO_MANUFACTURER_OR_SOFTWARE_EFFECT_INFERRED",
        "NO_PUBLIC_PROJECTION_CREATED",
      ]),
      gaps: hepaticImagingCampaignGaps,
    }),
    after: Object.freeze({
      catalogId: afterCatalog.catalogId,
      catalogVersion: afterCatalog.version,
      catalogDigest: afterCatalog.digest,
      remainingCampaigns: afterCatalog.campaigns.length,
      node: snapshotNode(afterNode),
      stopReason: afterNode.coverage.complete
        ? "CAMPAIGN_COVERAGE_CRITERIA_REACHED_WITH_EXPLICIT_NON_BLOCKING_GAPS"
        : "DOCUMENTARY_GAP_RECORDED",
      nextCampaignStarted: false,
    }),
    digests: Object.freeze({
      beforeCatalog: beforeCatalog.digest,
      selection: selectionDigest,
      campaignResult: hepaticImagingCampaignExecution.resultDigest,
      afterCatalog: afterCatalog.digest,
      transition: sha256Digest(transitionMaterial),
    }),
  });
  return Object.freeze({ ...traceWithoutDigest, traceDigest: sha256Digest(traceWithoutDigest) });
};

export const automaticCampaignExecutionTrace = createAutomaticCampaignExecutionTrace();
