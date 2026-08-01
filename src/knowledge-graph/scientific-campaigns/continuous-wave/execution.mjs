import { sha256Digest, stableStringify } from "../../migration/stable-json.mjs";
import { createCampaignDefinitionIdentity } from "../../knowledge-catalog/campaign-contracts.mjs";
import { ScientificCampaignAdapterRegistry, executeScientificCampaign } from "../generic-executor.mjs";
import {
  EMPTY_TERRITORIAL_CAMPAIGN_CORPUS,
  P10_ADAPTER_ID,
  P10_CAMPAIGN_ID,
  P10_EXECUTED_AT,
  P10_GIT_SHA,
  P10_SELECTED_DOMAIN_ID,
  P10_SELECTED_NODE_ID,
  P10_VERSION,
} from "./constants.mjs";
import { createAtomicScientificCorpusWriter, createTerritorialScientificCampaignAdapter } from "./adapter.mjs";
import { createPreparedWaveRequalificationRegistry, inventoryPreparedScientificWave, rankPreparedDomainPackages } from "./requalification.mjs";
import { buildReviewedSegmentationCorpus, summarizeReviewedCorpusCorrections } from "./reviewed-corpus.mjs";
import { validateSegmentationSourceVerification } from "./segmentation-source-verification.mjs";
import { createScientificCoverageReport, createScientificProductionSnapshot, createScientificQueueReport, createTerritorialReadinessReport } from "./state.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};

const createImmutableExecutionManifest = ({ baselineCatalog, plan, domainPackage } = {}) => {
  const planned = baselineCatalog.campaigns.find((campaign) => campaign.selectedNodeIds.includes(plan.selectedNodeId));
  if (!planned) throw new Error(`P10_PLANNED_CAMPAIGN_NOT_FOUND:${plan.selectedNodeId}`);
  const material = {
    ...planned,
    campaignId: P10_CAMPAIGN_ID,
    executionAdapterId: P10_ADAPTER_ID,
    territoryNodeIds: freeze([plan.candidates.find((item) => item.selected)?.alignment.domainNodeId]),
    knowledgeNodeIds: planned.selectedNodeIds,
    sourceCandidateIds: freeze(domainPackage.retainedSources.map((item) => item.revisionId).sort()),
    assertionCandidateIds: freeze(domainPackage.assertions.map((item) => item.revisionId).sort()),
    evidenceLinkCandidateIds: freeze(domainPackage.evidenceLinks.map((item) => item.evidenceLinkId).sort()),
    dependencies: planned.dependencySnapshot,
    scientificGoals: freeze(["VALIDATE_SEGMENTATION_METRICS", "PRESERVE_REFERENCE_ANNOTATION_UNCERTAINTY", "DOCUMENT_GENERALIZATION_LIMITS"]),
    readinessRequirements: freeze(["SOURCE_LOCALIZED", "ATOMIC_ASSERTIONS", "VALID_EVIDENCE_LINKS", "INTERNAL_ONLY_PROJECTION"]),
    coverageBefore: planned.coverageSnapshot,
    plannedCoverageAfter: freeze({ sources: domainPackage.retainedSources.length, assertions: domainPackage.assertions.length, evidenceLinks: domainPackage.evidenceLinks.length, syntheses: 1, projections: 1, publicArtifacts: 0 }),
    riskProfile: freeze({ level: "LOW_TO_MODERATE", clinicalRecommendationEngine: false, quantitativeClinicalThresholds: false, humanReviewPending: true }),
    sourceDigest: sha256Digest(domainPackage.retainedSources.map((item) => item.digest)),
    candidateDigest: domainPackage.packageDigest,
    status: "PLANNED",
  };
  return freeze({ ...material, manifestDigest: sha256Digest(material) });
};

const makeOfficialCorpus = ({ reviewedCorpus, manifest, execution }) => {
  const campaignDefinitionIdentity = createCampaignDefinitionIdentity({ manifest, createdAt: manifest.createdAt });
  const campaignResult = freeze({ ...execution.result, campaignId: P10_CAMPAIGN_ID });
  const campaignExecution = freeze({
    ...campaignResult,
    recordType: "TerritorialScientificCampaignExecution",
    revisionId: manifest.campaignRevisionId,
    campaignId: P10_CAMPAIGN_ID,
    domainId: P10_SELECTED_DOMAIN_ID,
    adapterId: P10_ADAPTER_ID,
    executedAt: P10_EXECUTED_AT,
    mutationApplied: execution.mutationApplied,
    preparedRecordCount: execution.preparedRecordCount,
    immutableTraceDigest: execution.immutableTraceDigest,
  });
  return freeze({
    ...reviewedCorpus,
    status: execution.status,
    campaignDefinitionIdentity,
    campaignManifest: manifest,
    campaignExecutionIdentity: execution.executionIdentity,
    campaignExecutionAttempt: execution.attempt,
    campaignResult,
    campaignExecution,
  });
};

export const buildP10ExecutionBundle = async ({
  preparedWave,
  baselineCatalog,
  baselineRegistry,
  territoryModel,
  createCatalog,
  createRegistry,
} = {}) => {
  const initialSnapshot = createScientificProductionSnapshot({
    phase: "P10_INITIAL",
    catalog: baselineCatalog,
    registry: baselineRegistry,
    territoryModel,
    warnings: ["PREPARED_WAVE_NOT_AUTHORITATIVE", "NO_CAMPAIGN_ACTIVE"],
  });
  const inventory = inventoryPreparedScientificWave({ preparedWave });
  if (inventory.duplicateIds.length) throw new Error(`P10_PREPARED_OBJECT_ID_COLLISION:${inventory.duplicateIds.join(",")}`);
  const plan = rankPreparedDomainPackages({ preparedWave, catalog: baselineCatalog, territoryModel });
  if (plan.selectedDomainId !== P10_SELECTED_DOMAIN_ID || plan.selectedNodeId !== P10_SELECTED_NODE_ID) throw new Error(`P10_DETERMINISTIC_SELECTION_UNEXPECTED:${plan.selectedDomainId ?? "NONE"}`);
  const domainPackage = preparedWave.exports.continuousWaveDomainPackages[P10_SELECTED_NODE_ID];
  const sourceVerification = validateSegmentationSourceVerification({ domainPackage });
  if (!sourceVerification.valid) throw new Error(`P10_SELECTED_SOURCE_VERIFICATION_FAILED:${sourceVerification.errors.map((item) => item.code).join(",")}`);
  const manifest = createImmutableExecutionManifest({ baselineCatalog, plan, domainPackage });
  const reviewedCorpus = buildReviewedSegmentationCorpus({ domainPackage, campaignManifest: manifest });
  const corrections = summarizeReviewedCorpusCorrections({ preparedPackage: domainPackage, reviewedCorpus });
  const requalificationRegistry = createPreparedWaveRequalificationRegistry({ inventory, reviewedCorpus });
  if (!requalificationRegistry.complete) throw new Error("P10_REQUALIFICATION_REGISTRY_INCOMPLETE");
  const adapter = createTerritorialScientificCampaignAdapter({ reviewedCorpus });
  const adapterRegistry = new ScientificCampaignAdapterRegistry([adapter]);
  const common = { campaignManifest: manifest, catalog: baselineCatalog, adapterRegistry, executionAdapterId: P10_ADAPTER_ID, now: P10_EXECUTED_AT };
  const simulationA = await executeScientificCampaign({ ...common, mode: "SIMULATION" });
  const simulationB = await executeScientificCampaign({ ...common, mode: "SIMULATION" });
  if (stableStringify(simulationA, 0) !== stableStringify(simulationB, 0)) throw new Error("P10_CAMPAIGN_SIMULATION_NON_DETERMINISTIC");
  const writer = createAtomicScientificCorpusWriter();
  const execution = await executeScientificCampaign({ ...common, mode: "APPLY", writer });
  if (!execution.mutationApplied || writer.applyCount !== 1 || writer.snapshot()?.length !== execution.preparedRecordCount) throw new Error("P10_CAMPAIGN_ATOMIC_WRITE_FAILED");
  const officialCorpus = makeOfficialCorpus({ reviewedCorpus, manifest, execution });
  const finalCatalog = createCatalog({ territorialCampaignCorpus: officialCorpus });
  const finalRegistry = createRegistry({ territorialCampaignCorpus: officialCorpus });
  const postSnapshot = createScientificProductionSnapshot({
    phase: "P10_POST_EXECUTION",
    catalog: finalCatalog,
    registry: finalRegistry,
    territoryModel,
    warnings: officialCorpus.gaps,
  });
  const coverage = createScientificCoverageReport({ catalog: finalCatalog, territoryModel, previousCatalog: baselineCatalog });
  const readiness = createTerritorialReadinessReport({ catalog: finalCatalog, nodeId: P10_SELECTED_NODE_ID });
  const queue = createScientificQueueReport({ catalog: finalCatalog, territoryModel });
  const replayCatalog = createCatalog({ territorialCampaignCorpus: officialCorpus });
  const replayRegistry = createRegistry({ territorialCampaignCorpus: officialCorpus });
  const replaySnapshot = createScientificProductionSnapshot({ phase: "P10_POST_EXECUTION", catalog: replayCatalog, registry: replayRegistry, territoryModel, warnings: officialCorpus.gaps });
  const replay = freeze({
    valid: stableStringify(replayCatalog, 0) === stableStringify(finalCatalog, 0) && replaySnapshot.snapshotDigest === postSnapshot.snapshotDigest,
    catalogDigest: replayCatalog.digest,
    planningDigest: replayCatalog.planningDigest,
    snapshotDigest: replaySnapshot.snapshotDigest,
  });
  if (!replay.valid) throw new Error("P10_CAMPAIGN_REPLAY_DIVERGED");
  const rollbackCatalog = createCatalog({ territorialCampaignCorpus: EMPTY_TERRITORIAL_CAMPAIGN_CORPUS });
  const rollbackRegistry = createRegistry({ territorialCampaignCorpus: EMPTY_TERRITORIAL_CAMPAIGN_CORPUS });
  const rollbackSnapshot = createScientificProductionSnapshot({ phase: "P10_INITIAL", catalog: rollbackCatalog, registry: rollbackRegistry, territoryModel, warnings: ["PREPARED_WAVE_NOT_AUTHORITATIVE", "NO_CAMPAIGN_ACTIVE"] });
  const rollbackDryRun = freeze({
    applied: false,
    valid: stableStringify(rollbackCatalog, 0) === stableStringify(baselineCatalog, 0) && rollbackSnapshot.snapshotDigest === initialSnapshot.snapshotDigest,
    restoredCatalogDigest: rollbackCatalog.digest,
    restoredPlanningDigest: rollbackCatalog.planningDigest,
    restoredSnapshotDigest: rollbackSnapshot.snapshotDigest,
    manifestPreserved: true,
    tracePreserved: true,
  });
  if (!rollbackDryRun.valid) throw new Error("P10_CAMPAIGN_ROLLBACK_DRY_RUN_FAILED");
  const traceMaterial = {
    campaignId: P10_CAMPAIGN_ID,
    campaignRevisionId: manifest.campaignRevisionId,
    initialSnapshotDigest: initialSnapshot.snapshotDigest,
    manifestDigest: manifest.manifestDigest,
    simulationDigest: simulationA.immutableTraceDigest,
    executionDigest: execution.immutableTraceDigest,
    postSnapshotDigest: postSnapshot.snapshotDigest,
    replay,
    rollbackDryRun,
  };
  const trace = freeze({
    recordType: "TerritorialScientificCampaignExecutionTrace",
    ...traceMaterial,
    status: execution.status,
    executedCampaigns: 1,
    mutationRecordCount: execution.preparedRecordCount,
    publicArtifactsCreated: 0,
    traceDigest: sha256Digest(traceMaterial),
  });
  const bundleMaterial = {
    bundleVersion: P10_VERSION,
    status: execution.status,
    gitSha: P10_GIT_SHA,
    preparedPackage: freeze({
      sourcePath: preparedWave.sourcePath,
      sourceDigest: preparedWave.sourceDigest,
      trustStatus: preparedWave.trustStatus,
      inventory: freeze({
        sourcePath: inventory.sourcePath,
        sourceDigest: inventory.sourceDigest,
        trustStatus: inventory.trustStatus,
        counts: inventory.counts,
        duplicateIds: inventory.duplicateIds,
        inventoryDigest: inventory.inventoryDigest,
        objectIndex: freeze(inventory.objects.map(({ preparedObjectId, objectType, domainPackage, category, originalDigest }) => freeze({ preparedObjectId, objectType, domainPackage, category, originalDigest }))),
      }),
    }),
    territory: freeze({ modelId: territoryModel.modelId, version: territoryModel.version, digest: territoryModel.digest, mutated: false }),
    initialSnapshot,
    plan,
    sourceVerification,
    requalificationRegistry,
    corrections,
    manifest,
    simulations: freeze({ first: simulationA, second: simulationB, identical: true }),
    execution: trace,
    officialCorpus,
    postSnapshot,
    coverage,
    readiness,
    replay,
    rollbackDryRun,
    queue,
    continuousWaveDisposition: freeze({ selectedDomain: P10_SELECTED_DOMAIN_ID, filePreserved: true, allObjectsDecided: requalificationRegistry.complete, integrated: requalificationRegistry.decisions.filter((item) => ["INTEGRATED", "CORRECTED_AND_INTEGRATED"].includes(item.migrationStatus)).length, deferred: requalificationRegistry.counts.deferred, rejected: requalificationRegistry.counts.rejected, untreated: 0 }),
    protectedSurfaces: freeze({ publicPagesChanged: 0, routesChanged: 0, seoChanged: 0, sitemapChanged: 0, viewersChanged: 0, pacsChanged: 0, supabaseChanged: 0, authChanged: 0, stripeChanged: 0, editorialEngineChanged: 0 }),
  };
  return freeze({ ...bundleMaterial, digest: sha256Digest(bundleMaterial) });
};
