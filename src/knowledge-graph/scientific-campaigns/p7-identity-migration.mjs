import { sha256Digest } from "../migration/stable-json.mjs";
import { campaignDefinitionIdForNode } from "../knowledge-catalog/campaign-contracts.mjs";
import {
  AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  AUTOMATIC_CAMPAIGN_ID,
  AUTOMATIC_CAMPAIGN_NODE_ID,
  hepaticImagingCampaignExecution,
} from "./hepatic-imaging.mjs";

export const P7_LEGACY_IDENTITY_RESOLUTION_VERSION = "1.0.0";
export const P7_LEGACY_TRACE_DIGEST = "9536482b01c5fd5eca4c64c8495d9a81769c0c45bbe466deb6028deca2531d3c";
export const P7_LEGACY_SELECTION_DIGEST = "c96e0838e0ccbcd7f28bafee9e0c470c9fb637327c9883d5f66d3f167c8867b1";

const campaignDefinitionId = campaignDefinitionIdForNode(AUTOMATIC_CAMPAIGN_NODE_ID);
const revisionMaterial = Object.freeze({
  campaignDefinitionId,
  legacyCampaignId: AUTOMATIC_CAMPAIGN_ID,
  selectedNodeIds: [AUTOMATIC_CAMPAIGN_NODE_ID],
  legacySelectionDigest: P7_LEGACY_SELECTION_DIGEST,
  legacyResultDigest: hepaticImagingCampaignExecution.resultDigest,
});
const campaignRevisionId = `${campaignDefinitionId}:revision:p7-${sha256Digest(revisionMaterial).slice(0, 12)}`;
const inputDigest = sha256Digest({ campaignRevisionId, legacySelectionDigest: P7_LEGACY_SELECTION_DIGEST });

export const p7CampaignIdentityResolution = Object.freeze({
  migrationId: "noxia:scientific-campaign-identity-migration:p7-hepatic-imaging",
  migrationVersion: P7_LEGACY_IDENTITY_RESOLUTION_VERSION,
  legacyCampaignId: AUTOMATIC_CAMPAIGN_ID,
  campaignDefinitionId,
  campaignRevisionId,
  executionId: hepaticImagingCampaignExecution.executionId,
  legacyTraceDigest: P7_LEGACY_TRACE_DIGEST,
  resolution: "LEGACY_ID_RESOLVED_TO_STABLE_DEFINITION_AND_VERSIONED_REVISION",
});

export const p7CampaignDefinitionIdentity = Object.freeze({
  recordType: "CampaignDefinitionIdentity",
  campaignDefinitionId,
  selectedKnowledgeNodeIdentity: AUTOMATIC_CAMPAIGN_NODE_ID,
  legacyAliases: Object.freeze([AUTOMATIC_CAMPAIGN_ID]),
  createdAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  completedAt: null,
  status: "ACTIVE",
});

export const p7CampaignDefinitionRevision = Object.freeze({
  recordType: "CampaignDefinitionRevision",
  campaignDefinitionId,
  campaignRevisionId,
  revisionId: campaignRevisionId,
  selectedNodeIds: Object.freeze([AUTOMATIC_CAMPAIGN_NODE_ID]),
  selectionDigest: P7_LEGACY_SELECTION_DIGEST,
  inputDigest,
  supersedesRevisionId: null,
  status: "HISTORICAL_COMPLETED",
  createdAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  completedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  migratedFromLegacyContract: true,
});

export const p7CampaignExecutionIdentity = Object.freeze({
  recordType: "CampaignExecutionIdentity",
  executionId: hepaticImagingCampaignExecution.executionId,
  campaignDefinitionId,
  campaignRevisionId,
  inputDigest,
  status: "COMPLETED_WITH_GAPS",
  createdAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  completedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  legacyCampaignId: AUTOMATIC_CAMPAIGN_ID,
});

export const p7CampaignExecutionAttempt = Object.freeze({
  recordType: "CampaignExecutionAttempt",
  attemptId: `${hepaticImagingCampaignExecution.executionId}:attempt:001`,
  executionId: hepaticImagingCampaignExecution.executionId,
  campaignDefinitionId,
  campaignRevisionId,
  inputDigest,
  attemptNumber: 1,
  status: "COMPLETED_WITH_GAPS",
  createdAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  completedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  migratedFromLegacyContract: true,
});

export const p7CampaignResult = Object.freeze({
  recordType: "CampaignResult",
  campaignDefinitionId,
  campaignRevisionId,
  executionId: hepaticImagingCampaignExecution.executionId,
  attemptId: p7CampaignExecutionAttempt.attemptId,
  inputDigest,
  selectedNodeIds: Object.freeze([AUTOMATIC_CAMPAIGN_NODE_ID]),
  status: "COMPLETED_WITH_GAPS",
  additions: hepaticImagingCampaignExecution.additions,
  gaps: hepaticImagingCampaignExecution.gaps,
  createdAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  completedAt: AUTOMATIC_CAMPAIGN_EXECUTED_AT,
  resultDigest: hepaticImagingCampaignExecution.resultDigest,
  publicationAuthorized: false,
  migratedFromLegacyContract: true,
});

export const p7IndustrialCampaignExecution = Object.freeze({
  ...hepaticImagingCampaignExecution,
  campaignDefinitionId,
  campaignRevisionId,
  inputDigest,
  attemptId: p7CampaignExecutionAttempt.attemptId,
  legacyCampaignId: AUTOMATIC_CAMPAIGN_ID,
  legacyIdentityResolved: true,
});
