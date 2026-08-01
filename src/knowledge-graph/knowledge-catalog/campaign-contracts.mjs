import { sha256Digest } from "../migration/stable-json.mjs";

export const CAMPAIGN_CONTRACT_VERSION = "2.0.0";
export const CAMPAIGN_SELECTION_RULE_VERSION = "2.0.0";

export const CAMPAIGN_EXECUTION_STATES = Object.freeze([
  "PLANNED",
  "AUTHORIZED",
  "RUNNING",
  "COMPLETED",
  "COMPLETED_WITH_GAPS",
  "FAILED_RETRYABLE",
  "FAILED_FINAL",
  "CANCELLED",
  "SUPERSEDED",
]);

export const TERMINAL_CAMPAIGN_EXECUTION_STATES = Object.freeze([
  "COMPLETED",
  "COMPLETED_WITH_GAPS",
  "FAILED_FINAL",
  "CANCELLED",
  "SUPERSEDED",
]);

const slug = (value) => String(value).split(":").at(-1).replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
const shortDigest = (value) => sha256Digest(value).slice(0, 12);
const freezeArray = (values = []) => Object.freeze([...values]);

export const campaignDefinitionIdForNode = (nodeId) => `noxia:scientific-campaign-definition:${slug(nodeId)}:${shortDigest(nodeId)}`;

export const createCampaignDefinitionIdentity = ({ manifest, createdAt = manifest?.createdAt ?? manifest?.generatedAt }) => Object.freeze({
  recordType: "CampaignDefinitionIdentity",
  campaignDefinitionId: manifest.campaignDefinitionId,
  selectedKnowledgeNodeIdentity: manifest.selectedNodeIds.length === 1 ? manifest.selectedNodeIds[0] : null,
  selectedNodeIds: freezeArray(manifest.selectedNodeIds),
  legacyAliases: Object.freeze([]),
  createdAt,
  status: "ACTIVE",
});

export const createCampaignManifest = ({
  node,
  priorityBreakdown,
  dependencyEvaluation,
  catalogPlanningDigest,
  generatedAt,
  supersedesRevisionId = null,
  executionPolicy = {},
}) => {
  const selectedNodeIds = Object.freeze([node.nodeId]);
  const campaignDefinitionId = campaignDefinitionIdForNode(node.nodeId);
  const prioritySnapshot = Object.freeze({
    level: node.priority.level,
    score: node.priority.score,
    components: node.priority.components,
    scheduling: priorityBreakdown,
  });
  const coverageSnapshot = Object.freeze({
    status: node.status,
    sourceCoverage: node.sourceCoverage,
    assertionCoverage: node.assertionCoverage,
    scientificCoverage: node.scientificCoverage,
    projectionCoverage: node.projectionCoverage,
    readiness: node.readiness,
    projectionExists: node.metrics.projectionCount > 0,
    enrichmentComplete: priorityBreakdown.enrichmentComplete,
    reentryReasons: freezeArray(priorityBreakdown.reentryReasons),
  });
  const dependencySnapshot = Object.freeze({
    satisfied: dependencyEvaluation.satisfied,
    blockers: freezeArray(dependencyEvaluation.blockers),
    evaluations: freezeArray(dependencyEvaluation.evaluations),
  });
  const selectionMaterial = Object.freeze({
    selectionRuleVersion: CAMPAIGN_SELECTION_RULE_VERSION,
    selectedNodeIds,
    prioritySnapshot,
    coverageSnapshot,
    dependencySnapshot,
    catalogPlanningDigest,
  });
  const selectionDigest = sha256Digest(selectionMaterial);
  const definitionRevisionMaterial = Object.freeze({
    campaignDefinitionId,
    selectionDigest,
    stopCriteria: [
      "ALL_SELECTED_KNOWLEDGE_NODES_PROCESSED",
      "SCIENTIFIC_SOURCE_GAPS_RECALCULATED",
      "SCIENTIFIC_ASSERTION_GAPS_RECALCULATED",
      "PROVENANCE_AND_READINESS_RECALCULATED",
      "CATALOG_UPDATED_OR_GAPS_EXPLICITLY_PRESERVED",
    ],
    executionPolicy: {
      mode: "CATALOG_DRIVEN",
      requireGovernanceToken: true,
      allowPublicPublication: false,
      allowDirectRegistryMutation: false,
      maxAttempts: executionPolicy.maxAttempts ?? 3,
      retryPolicy: executionPolicy.retryPolicy ?? "EXPLICIT_REPLAN_AFTER_FAILURE",
      adapterId: executionPolicy.adapterId ?? null,
    },
    expectedOutputs: [
      "SOURCE_REVISIONS_OR_EXPLICIT_SOURCE_GAPS",
      "ATOMIC_ASSERTION_REVISIONS_OR_EXPLICIT_ASSERTION_GAPS",
      "LOCALIZED_EVIDENCE_LINKS",
      "COVERAGE_AND_READINESS_RECALCULATION",
      "IMMUTABLE_EXECUTION_TRACE",
    ],
  });
  const revisionDigest = sha256Digest(definitionRevisionMaterial);
  const campaignRevisionId = `${campaignDefinitionId}:revision:${revisionDigest.slice(0, 16)}`;
  const inputDigest = sha256Digest({ campaignRevisionId, selectionDigest, catalogPlanningDigest });
  return Object.freeze({
    recordType: "CampaignDefinitionRevision",
    campaignId: campaignDefinitionId,
    campaignDefinitionId,
    campaignRevisionId,
    revisionId: campaignRevisionId,
    supersedesRevisionId,
    selectedNodeIds,
    nodeIds: selectedNodeIds,
    selectionDigest,
    inputDigest,
    catalogPlanningDigest,
    prioritySnapshot,
    coverageSnapshot,
    dependencySnapshot,
    stopCriteria: freezeArray(definitionRevisionMaterial.stopCriteria),
    executionPolicy: Object.freeze(definitionRevisionMaterial.executionPolicy),
    expectedOutputs: freezeArray(definitionRevisionMaterial.expectedOutputs),
    selectionRule: Object.freeze({
      version: CAMPAIGN_SELECTION_RULE_VERSION,
      priority: "HIGH",
      gapSemantics: "ANY_ACTIONABLE_SCIENTIFIC_OR_PROVENANCE_GAP",
      projectedNodesMayReenter: true,
      dependenciesRequired: true,
      manualDomainSelection: false,
    }),
    priority: node.priority.level,
    status: "PLANNED",
    createdAt: generatedAt,
    completedAt: null,
    generatedAt,
    generatedContent: false,
    generatedAssertions: false,
    publicationAuthorized: false,
    contractVersion: CAMPAIGN_CONTRACT_VERSION,
  });
};

const requiredManifestFields = Object.freeze([
  "campaignId",
  "campaignDefinitionId",
  "campaignRevisionId",
  "selectedNodeIds",
  "selectionDigest",
  "inputDigest",
  "prioritySnapshot",
  "coverageSnapshot",
  "dependencySnapshot",
  "stopCriteria",
  "executionPolicy",
  "expectedOutputs",
  "status",
  "createdAt",
  "completedAt",
]);

export const validateCampaignManifest = (manifest) => {
  const errors = [];
  if (!manifest || typeof manifest !== "object") return Object.freeze({ valid: false, errors: Object.freeze([{ code: "CAMPAIGN_MANIFEST_REQUIRED" }]) });
  for (const field of requiredManifestFields) if (!(field in manifest)) errors.push({ code: "CAMPAIGN_MANIFEST_FIELD_MISSING", field });
  if (!Array.isArray(manifest.selectedNodeIds) || manifest.selectedNodeIds.length === 0) errors.push({ code: "CAMPAIGN_MANIFEST_NODE_SET_EMPTY" });
  if (new Set(manifest.selectedNodeIds ?? []).size !== (manifest.selectedNodeIds ?? []).length) errors.push({ code: "CAMPAIGN_MANIFEST_NODE_DUPLICATE" });
  if (manifest.campaignId !== manifest.campaignDefinitionId) errors.push({ code: "CAMPAIGN_STABLE_IDENTITY_MISMATCH" });
  if (manifest.revisionId !== manifest.campaignRevisionId) errors.push({ code: "CAMPAIGN_REVISION_IDENTITY_MISMATCH" });
  if (manifest.publicationAuthorized || manifest.executionPolicy?.allowPublicPublication) errors.push({ code: "CAMPAIGN_PUBLICATION_NOT_ALLOWED" });
  if (!CAMPAIGN_EXECUTION_STATES.includes(manifest.status)) errors.push({ code: "CAMPAIGN_STATUS_UNKNOWN", status: manifest.status });
  if (!manifest.createdAt) errors.push({ code: "CAMPAIGN_CREATED_AT_REQUIRED" });
  if (manifest.status === "PLANNED" && manifest.completedAt !== null) errors.push({ code: "CAMPAIGN_PLANNED_WITH_COMPLETION_DATE" });
  const selectionMaterial = {
    selectionRuleVersion: manifest.selectionRule?.version,
    selectedNodeIds: manifest.selectedNodeIds,
    prioritySnapshot: manifest.prioritySnapshot,
    coverageSnapshot: manifest.coverageSnapshot,
    dependencySnapshot: manifest.dependencySnapshot,
    catalogPlanningDigest: manifest.catalogPlanningDigest,
  };
  if (manifest.selectionDigest !== sha256Digest(selectionMaterial)) errors.push({ code: "CAMPAIGN_SELECTION_DIGEST_MISMATCH" });
  if (manifest.inputDigest !== sha256Digest({ campaignRevisionId: manifest.campaignRevisionId, selectionDigest: manifest.selectionDigest, catalogPlanningDigest: manifest.catalogPlanningDigest })) errors.push({ code: "CAMPAIGN_INPUT_DIGEST_MISMATCH" });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
};

export const createCampaignExecutionIdentity = ({ manifest, executionOrdinal = 1, createdAt = manifest.createdAt ?? manifest.generatedAt }) => Object.freeze({
  recordType: "CampaignExecutionIdentity",
  executionId: `noxia:scientific-campaign-execution:${shortDigest({ campaignRevisionId: manifest.campaignRevisionId, inputDigest: manifest.inputDigest })}:${String(executionOrdinal).padStart(4, "0")}`,
  campaignDefinitionId: manifest.campaignDefinitionId,
  campaignRevisionId: manifest.campaignRevisionId,
  inputDigest: manifest.inputDigest,
  status: "PLANNED",
  createdAt,
  completedAt: null,
});

export const createCampaignExecutionAttempt = ({ executionIdentity, attemptNumber = 1, status = "PLANNED", createdAt }) => Object.freeze({
  recordType: "CampaignExecutionAttempt",
  attemptId: `${executionIdentity.executionId}:attempt:${String(attemptNumber).padStart(3, "0")}`,
  executionId: executionIdentity.executionId,
  campaignDefinitionId: executionIdentity.campaignDefinitionId,
  campaignRevisionId: executionIdentity.campaignRevisionId,
  inputDigest: executionIdentity.inputDigest,
  attemptNumber,
  status,
  createdAt,
  completedAt: null,
});

export const createCampaignResult = ({ manifest, executionIdentity, attempt, status, result = {}, completedAt }) => {
  const resultMaterial = Object.freeze({
    campaignDefinitionId: manifest.campaignDefinitionId,
    campaignRevisionId: manifest.campaignRevisionId,
    executionId: executionIdentity.executionId,
    attemptId: attempt.attemptId,
    inputDigest: manifest.inputDigest,
    selectedNodeIds: manifest.selectedNodeIds,
    status,
    createdAt: attempt.createdAt,
    additions: result.additions ?? {},
    gaps: result.gaps ?? [],
    outputDigests: result.outputDigests ?? {},
  });
  return Object.freeze({
    recordType: "CampaignResult",
    ...resultMaterial,
    completedAt,
    resultDigest: sha256Digest(resultMaterial),
    publicationAuthorized: false,
  });
};
