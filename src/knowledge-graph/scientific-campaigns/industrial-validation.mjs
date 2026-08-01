import { stableStringify } from "../migration/stable-json.mjs";
import {
  createAuthoritativeScientificRegistry,
  p9ScientificKnowledgeCatalog,
  scientificKnowledgeCatalog,
} from "../knowledge-catalog/catalog-builder.mjs";
import { EMPTY_TERRITORIAL_CAMPAIGN_CORPUS } from "./continuous-wave/constants.mjs";
import { validateCampaignManifest } from "../knowledge-catalog/campaign-contracts.mjs";
import { validateCampaignDependencies } from "../knowledge-catalog/campaign-dependencies.mjs";
import { authorizeCampaignExecution } from "../knowledge-catalog/governance.mjs";
import { validateCatalogReadinessIntegrity } from "../knowledge-catalog/readiness-integrity.mjs";
import { p7CampaignIdentityResolution } from "./p7-identity-migration.mjs";

export const P9_INDUSTRIAL_VALIDATION_VERSION = "1.0.0";

const clone = (value) => structuredClone(value);
const freezeResult = (errors, details = {}) => Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), ...details });

export const validateCampaignIdentities = ({ catalog = scientificKnowledgeCatalog } = {}) => {
  const errors = [];
  const definitionIds = catalog.campaigns.map((item) => item.campaignDefinitionId);
  const revisionIds = catalog.campaigns.map((item) => item.campaignRevisionId);
  if (new Set(definitionIds).size !== definitionIds.length) errors.push({ code: "CAMPAIGN_DEFINITION_ID_DUPLICATE" });
  if (new Set(revisionIds).size !== revisionIds.length) errors.push({ code: "CAMPAIGN_REVISION_ID_DUPLICATE" });
  for (const campaign of catalog.campaigns) errors.push(...validateCampaignManifest(campaign).errors.map((error) => ({ ...error, campaignRevisionId: campaign.campaignRevisionId })));
  const identities = new Map((catalog.campaignDefinitionIdentities ?? []).map((item) => [item.campaignDefinitionId, item]));
  const revisions = new Map((catalog.campaignDefinitionRevisions ?? []).map((item) => [item.campaignRevisionId, item]));
  const executions = new Map((catalog.campaignExecutionIdentities ?? []).map((item) => [item.executionId, item]));
  const attempts = new Map((catalog.campaignExecutionAttempts ?? []).map((item) => [item.attemptId, item]));
  if (identities.size !== (catalog.campaignDefinitionIdentities ?? []).length) errors.push({ code: "CAMPAIGN_DEFINITION_REGISTRY_DUPLICATE" });
  if (revisions.size !== (catalog.campaignDefinitionRevisions ?? []).length) errors.push({ code: "CAMPAIGN_REVISION_REGISTRY_DUPLICATE" });
  if (executions.size !== (catalog.campaignExecutionIdentities ?? []).length) errors.push({ code: "CAMPAIGN_EXECUTION_REGISTRY_DUPLICATE" });
  if (attempts.size !== (catalog.campaignExecutionAttempts ?? []).length) errors.push({ code: "CAMPAIGN_ATTEMPT_REGISTRY_DUPLICATE" });
  for (const campaign of catalog.campaigns) {
    const identity = identities.get(campaign.campaignDefinitionId);
    const revision = revisions.get(campaign.campaignRevisionId);
    if (!identity) errors.push({ code: "CAMPAIGN_DEFINITION_IDENTITY_MISSING", campaignDefinitionId: campaign.campaignDefinitionId });
    if (!revision) errors.push({ code: "CAMPAIGN_DEFINITION_REVISION_MISSING", campaignRevisionId: campaign.campaignRevisionId });
    if (identity && (!identity.createdAt || identity.status !== "ACTIVE")) errors.push({ code: "CAMPAIGN_DEFINITION_IDENTITY_LIFECYCLE_INVALID", campaignDefinitionId: campaign.campaignDefinitionId });
    if (revision && (revision.inputDigest !== campaign.inputDigest || revision.selectionDigest !== campaign.selectionDigest)) errors.push({ code: "CAMPAIGN_DEFINITION_REVISION_CONTENT_MISMATCH", campaignRevisionId: campaign.campaignRevisionId });
  }
  for (const execution of executions.values()) {
    if (!revisions.has(execution.campaignRevisionId)) errors.push({ code: "CAMPAIGN_EXECUTION_REVISION_MISSING", executionId: execution.executionId });
    if (!execution.createdAt || !execution.status) errors.push({ code: "CAMPAIGN_EXECUTION_LIFECYCLE_INVALID", executionId: execution.executionId });
  }
  for (const attempt of attempts.values()) {
    if (!executions.has(attempt.executionId)) errors.push({ code: "CAMPAIGN_ATTEMPT_EXECUTION_MISSING", attemptId: attempt.attemptId });
    if (!attempt.createdAt || !attempt.status || !attempt.campaignRevisionId) errors.push({ code: "CAMPAIGN_ATTEMPT_LIFECYCLE_INVALID", attemptId: attempt.attemptId });
  }
  for (const result of catalog.campaignResults ?? []) {
    if (!executions.has(result.executionId)) errors.push({ code: "CAMPAIGN_RESULT_EXECUTION_MISSING", resultDigest: result.resultDigest });
    if (!attempts.has(result.attemptId)) errors.push({ code: "CAMPAIGN_RESULT_ATTEMPT_MISSING", resultDigest: result.resultDigest });
    if (!result.completedAt || !result.status || !result.resultDigest) errors.push({ code: "CAMPAIGN_RESULT_LIFECYCLE_INVALID", executionId: result.executionId });
  }
  if (!p7CampaignIdentityResolution.legacyCampaignId || !p7CampaignIdentityResolution.campaignDefinitionId || !p7CampaignIdentityResolution.campaignRevisionId) errors.push({ code: "P7_LEGACY_IDENTITY_NOT_RESOLVED" });
  const migratedExecution = catalog.campaignExecutions?.find((item) => item.legacyCampaignId === p7CampaignIdentityResolution.legacyCampaignId);
  if (!migratedExecution || migratedExecution.campaignDefinitionId !== p7CampaignIdentityResolution.campaignDefinitionId) errors.push({ code: "P7_EXECUTION_IDENTITY_MIGRATION_MISSING" });
  return freezeResult(errors, {
    campaigns: catalog.campaigns.length,
    definitions: identities.size,
    revisions: revisions.size,
    executions: executions.size,
    attempts: attempts.size,
    results: catalog.campaignResults?.length ?? 0,
    p7IdentityResolution: p7CampaignIdentityResolution,
  });
};

export const validateCampaignGovernance = ({ catalog = scientificKnowledgeCatalog } = {}) => {
  const errors = [];
  const manifest = catalog.campaigns[0];
  if (!manifest) errors.push({ code: "NO_PLANNED_CAMPAIGN_FOR_GOVERNANCE_TEST" });
  else {
    const decision = authorizeCampaignExecution({ campaignManifest: manifest, catalog });
    if (!decision.authorized || !decision.governanceToken) errors.push({ code: "PLANNED_CAMPAIGN_NOT_AUTHORIZED", blockers: decision.blockers });
    const outside = clone(manifest);
    outside.selectedNodeIds = ["noxia:unknown:outside-catalog"];
    outside.nodeIds = outside.selectedNodeIds;
    const outsideDecision = authorizeCampaignExecution({ campaignManifest: outside, catalog });
    if (outsideDecision.authorized) errors.push({ code: "OUTSIDE_CATALOG_CAMPAIGN_AUTHORIZED" });
    const stale = clone(manifest);
    stale.catalogPlanningDigest = "stale";
    const staleDecision = authorizeCampaignExecution({ campaignManifest: stale, catalog });
    if (staleDecision.authorized) errors.push({ code: "STALE_CAMPAIGN_AUTHORIZED" });
  }
  return freezeResult(errors, { testedCampaignRevisionId: manifest?.campaignRevisionId ?? null });
};

const mutation = (id, mutateCatalog, expectedCodes) => {
  const catalog = clone(scientificKnowledgeCatalog);
  const registry = clone(createAuthoritativeScientificRegistry());
  mutateCatalog(catalog, registry);
  const validation = validateCatalogReadinessIntegrity({ catalog, registry });
  const codes = [...new Set(validation.errors.map((error) => error.code))].sort();
  return Object.freeze({ id, detected: !validation.valid && expectedCodes.some((code) => codes.includes(code)), expectedCodes: Object.freeze(expectedCodes), codes: Object.freeze(codes) });
};

const evidenceNode = (catalog) => catalog.nodes.find((node) => node.provenance?.evidenceLinkIds?.length && node.provenance?.scientificSourceRevisionIds?.length && node.provenance?.assertionRevisionIds?.length);

export const replayP8CatalogCorruptions = () => Object.freeze([
  mutation("SOURCE_REFERENCE_REMOVED_FROM_CATALOG_NODE", (catalog) => {
    const node = evidenceNode(catalog);
    node.provenance.scientificSourceRevisionIds.shift();
  }, ["NODE_EVIDENCE_SOURCE_NOT_LINKED", "CATALOG_METRIC_REGISTRY_DIVERGENCE"]),
  mutation("ASSERTION_REFERENCE_REMOVED_FROM_CATALOG_NODE", (catalog) => {
    const node = evidenceNode(catalog);
    node.provenance.assertionRevisionIds.shift();
  }, ["NODE_EVIDENCE_ASSERTION_NOT_LINKED", "CATALOG_METRIC_REGISTRY_DIVERGENCE"]),
  mutation("INVALID_EVIDENCE_REFERENCE_IN_CATALOG_NODE", (catalog) => {
    const node = evidenceNode(catalog);
    node.provenance.evidenceLinkIds[0] = "noxia:invalid:evidence-link";
  }, ["NODE_EVIDENCE_LINK_MISSING"]),
  mutation("READY_WITHOUT_SOURCES", (catalog) => {
    const node = evidenceNode(catalog);
    node.status = "READY";
    node.provenance.scientificSourceRevisionIds = [];
    node.metrics.sourceCount = 0;
    node.metrics.scientificSourceCount = 0;
  }, ["READY_WITHOUT_SOURCES", "PROVENANCE_READY_WITHOUT_LOCALIZED_SOURCE", "NODE_EVIDENCE_SOURCE_NOT_LINKED"]),
  mutation("READY_WITHOUT_ASSERTIONS", (catalog) => {
    const node = evidenceNode(catalog);
    node.status = "READY";
    node.provenance.assertionRevisionIds = [];
    node.metrics.assertionCount = 0;
  }, ["READY_WITHOUT_ASSERTIONS", "SCIENTIFIC_READY_WITHOUT_ASSERTION", "NODE_EVIDENCE_ASSERTION_NOT_LINKED"]),
  mutation("READY_WITH_ZERO_COVERAGE", (catalog) => {
    const node = evidenceNode(catalog);
    node.status = "READY";
    node.sourceCoverage.ratio = 0;
    node.assertionCoverage.ratio = 0;
  }, ["READY_WITH_INSUFFICIENT_COVERAGE", "CATALOG_STATUS_REGISTRY_DIVERGENCE"]),
]);

export const validateP8CorruptionReplays = () => {
  const scenarios = replayP8CatalogCorruptions();
  const errors = scenarios.filter((item) => !item.detected).map((item) => ({ code: "P8_CORRUPTION_NOT_DETECTED", scenario: item.id, observed: item.codes }));
  return freezeResult(errors, { scenarios });
};

export const validateP9IndustrialPlatform = ({ catalog = p9ScientificKnowledgeCatalog } = {}) => {
  const identities = validateCampaignIdentities({ catalog });
  const governance = validateCampaignGovernance({ catalog });
  const dependencies = validateCampaignDependencies({ nodes: catalog.nodes, dependencies: catalog.dependencyRegistry ?? [] });
  const readinessIntegrity = validateCatalogReadinessIntegrity({ catalog, registry: createAuthoritativeScientificRegistry({ territorialCampaignCorpus: EMPTY_TERRITORIAL_CAMPAIGN_CORPUS }) });
  const corruptionReplays = validateP8CorruptionReplays();
  const layers = { identities, governance, dependencies, readinessIntegrity, corruptionReplays };
  const errors = Object.entries(layers).flatMap(([layer, validation]) => validation.errors.map((error) => ({ layer, ...error })));
  return freezeResult(errors, { version: P9_INDUSTRIAL_VALIDATION_VERSION, layers, deterministicDigest: stableStringify(layers, 0) });
};
