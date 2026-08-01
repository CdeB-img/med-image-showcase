import p10Bundle from "../continuous-wave/execution-bundle.json" with { type: "json" };
import { sha256Digest, stableStringify } from "../../migration/stable-json.mjs";
import { createCampaignDefinitionIdentity } from "../../knowledge-catalog/campaign-contracts.mjs";
import { createAuthoritativeScientificRegistry, createScientificKnowledgeCatalog, p9ScientificKnowledgeCatalog } from "../../knowledge-catalog/catalog-builder.mjs";
import { createScientificTerritoryModel } from "../../scientific-territory/model.mjs";
import { ScientificCampaignAdapterRegistry, executeScientificCampaign } from "../generic-executor.mjs";
import { createAtomicScientificCorpusWriter, createTerritorialScientificCampaignAdapter } from "../continuous-wave/adapter.mjs";
import { loadPreparedScientificWave } from "../continuous-wave/prepared-loader.mjs";
import { inventoryPreparedScientificWave } from "../continuous-wave/requalification.mjs";
import { createScientificCoverageReport, createScientificProductionSnapshot, createScientificQueueReport, createTerritorialReadinessReport } from "../continuous-wave/state.mjs";
import { territoryAlignmentFor } from "../continuous-wave/territory-alignment.mjs";
import { buildReviewedTerritorialDomainCorpus, summarizeDomainCorrections } from "./reviewed-domain.mjs";
import { createP11RequalificationRegistry } from "./requalification.mjs";
import { validatePreparedDomainSources } from "./source-verification.mjs";
import { P11_ADAPTER_ID, P11_CAMPAIGN_IDS, P11_EXECUTED_AT, P11_GIT_SHA, P11_MAX_CAMPAIGNS, P11_MIN_CAMPAIGNS, P11_SCIENTIFIC_GOALS, P11_VERSION } from "./constants.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const idOf = (item) => item.stableId ?? item.revisionId ?? item.evidenceLinkId ?? item.decisionId ?? item.contradictionId ?? item.synthesisId ?? item.projectionId;
const mergeUnique = (left = [], right = []) => {
  const values = new Map([...left, ...right].map((item) => [idOf(item), item]));
  return freeze([...values.values()].sort((a, b) => String(idOf(a)).localeCompare(String(idOf(b)))));
};
const asList = (corpus, plural, singular) => corpus?.[plural] ?? (corpus?.[singular] ? [corpus[singular]] : []);

const normalizeP10Corpus = () => {
  const corpus = p10Bundle.officialCorpus;
  return freeze({
    ...corpus,
    domainIds: freeze([corpus.domainId]),
    campaignIds: freeze([corpus.campaignId]),
    campaignDefinitionIdentities: freeze([corpus.campaignDefinitionIdentity]),
    campaignManifests: freeze([corpus.campaignManifest]),
    campaignExecutionIdentities: freeze([corpus.campaignExecutionIdentity]),
    campaignExecutionAttempts: freeze([corpus.campaignExecutionAttempt]),
    campaignResults: freeze([corpus.campaignResult]),
    campaignExecutions: freeze([corpus.campaignExecution]),
  });
};

const appendCampaignCorpus = (aggregate, campaignCorpus) => {
  const material = {
    status: "COMPLETED_WITH_EXPLICIT_GAPS",
    domainId: campaignCorpus.domainId,
    domainIds: freeze(unique([...aggregate.domainIds, campaignCorpus.domainId])),
    campaignId: campaignCorpus.campaignId,
    campaignIds: freeze([...aggregate.campaignIds, campaignCorpus.campaignId]),
    sourceIdentities: mergeUnique(aggregate.sourceIdentities, campaignCorpus.sourceIdentities),
    sources: mergeUnique(aggregate.sources, campaignCorpus.sources),
    concepts: mergeUnique(aggregate.concepts, campaignCorpus.concepts),
    assertionIdentities: mergeUnique(aggregate.assertionIdentities, campaignCorpus.assertionIdentities),
    assertions: mergeUnique(aggregate.assertions, campaignCorpus.assertions),
    evidenceLinks: mergeUnique(aggregate.evidenceLinks, campaignCorpus.evidenceLinks),
    contextDifferences: mergeUnique(aggregate.contextDifferences, campaignCorpus.contextDifferences),
    reviewDecisions: mergeUnique(aggregate.reviewDecisions, campaignCorpus.reviewDecisions),
    syntheses: mergeUnique(aggregate.syntheses, campaignCorpus.syntheses),
    projections: mergeUnique(aggregate.projections, campaignCorpus.projections),
    gaps: freeze(unique([...aggregate.gaps, ...campaignCorpus.gaps])),
    campaignDefinitionIdentity: campaignCorpus.campaignDefinitionIdentity,
    campaignManifest: campaignCorpus.campaignManifest,
    campaignExecutionIdentity: campaignCorpus.campaignExecutionIdentity,
    campaignExecutionAttempt: campaignCorpus.campaignExecutionAttempt,
    campaignResult: campaignCorpus.campaignResult,
    campaignExecution: campaignCorpus.campaignExecution,
    campaignDefinitionIdentities: freeze([...asList(aggregate, "campaignDefinitionIdentities", "campaignDefinitionIdentity"), campaignCorpus.campaignDefinitionIdentity]),
    campaignManifests: freeze([...asList(aggregate, "campaignManifests", "campaignManifest"), campaignCorpus.campaignManifest]),
    campaignExecutionIdentities: freeze([...asList(aggregate, "campaignExecutionIdentities", "campaignExecutionIdentity"), campaignCorpus.campaignExecutionIdentity]),
    campaignExecutionAttempts: freeze([...asList(aggregate, "campaignExecutionAttempts", "campaignExecutionAttempt"), campaignCorpus.campaignExecutionAttempt]),
    campaignResults: freeze([...asList(aggregate, "campaignResults", "campaignResult"), campaignCorpus.campaignResult]),
    campaignExecutions: freeze([...asList(aggregate, "campaignExecutions", "campaignExecution"), campaignCorpus.campaignExecution]),
  };
  return freeze({ ...material, corpusDigest: sha256Digest(material) });
};

const createImmutableManifest = ({ planned, domainPackage, campaignId, sourceVerification } = {}) => {
  const material = {
    ...planned,
    campaignId,
    executionAdapterId: P11_ADAPTER_ID,
    territoryNodeIds: freeze([territoryAlignmentFor({ domainId: domainPackage.domainId }).domainNodeId]),
    knowledgeNodeIds: planned.selectedNodeIds,
    sourceCandidateIds: freeze(domainPackage.retainedSources.map((item) => item.revisionId).sort()),
    assertionCandidateIds: freeze(domainPackage.assertions.map((item) => item.revisionId).sort()),
    evidenceLinkCandidateIds: freeze(domainPackage.evidenceLinks.map((item) => item.evidenceLinkId).sort()),
    dependencies: planned.dependencySnapshot,
    scientificGoals: P11_SCIENTIFIC_GOALS[domainPackage.domainId],
    readinessRequirements: freeze(["SOURCE_LOCALIZED", "ATOMIC_ASSERTIONS", "VALID_EVIDENCE_LINKS", "INTERNAL_ONLY_PROJECTION"]),
    coverageBefore: planned.coverageSnapshot,
    plannedCoverageAfter: freeze({ sources: domainPackage.retainedSources.length, assertions: domainPackage.assertions.length, evidenceLinks: domainPackage.evidenceLinks.length, syntheses: 1, projections: 1, publicArtifacts: 0 }),
    riskProfile: freeze({ level: "MODERATE", clinicalRecommendationEngine: false, quantitativeClinicalThresholds: false, humanReviewPending: true }),
    sourceDigest: sourceVerification.digest,
    candidateDigest: domainPackage.packageDigest,
    status: "PLANNED",
  };
  return freeze({ ...material, manifestDigest: sha256Digest(material) });
};

const makeCampaignCorpus = ({ reviewedCorpus, manifest, execution }) => {
  const campaignDefinitionIdentity = createCampaignDefinitionIdentity({ manifest, createdAt: manifest.createdAt });
  const campaignResult = freeze({ ...execution.result, campaignId: manifest.campaignId });
  const campaignExecution = freeze({
    ...campaignResult,
    recordType: "TerritorialScientificCampaignExecution",
    revisionId: manifest.campaignRevisionId,
    campaignId: manifest.campaignId,
    domainId: reviewedCorpus.domainId,
    adapterId: P11_ADAPTER_ID,
    executedAt: P11_EXECUTED_AT,
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

const campaignRecord = ({ index, domainPackage, manifest, sourceVerification, reviewedCorpus, corrections, simulations, execution, beforeSnapshot, postSnapshot, coverage, readiness, queue, replay, rollbackDryRun }) => {
  const traceMaterial = {
    campaignId: manifest.campaignId,
    campaignRevisionId: manifest.campaignRevisionId,
    sequence: index,
    domainId: domainPackage.domainId,
    beforeSnapshotDigest: beforeSnapshot.snapshotDigest,
    manifestDigest: manifest.manifestDigest,
    simulationDigest: simulations.first.immutableTraceDigest,
    executionDigest: execution.immutableTraceDigest,
    postSnapshotDigest: postSnapshot.snapshotDigest,
    replay,
    rollbackDryRun,
  };
  return freeze({
    sequence: index,
    domainId: domainPackage.domainId,
    nodeId: domainPackage.nodeId,
    sourceVerification,
    corrections,
    reviewedCorpus,
    manifest,
    simulations,
    execution: freeze({ ...traceMaterial, status: execution.status, mutationRecordCount: execution.preparedRecordCount, traceDigest: sha256Digest(traceMaterial) }),
    beforeSnapshot,
    postSnapshot,
    coverage,
    readiness,
    queue,
    replay,
    rollbackDryRun,
  });
};

export const buildP11ExecutionBundle = async ({ root = process.cwd() } = {}) => {
  const preparedWave = await loadPreparedScientificWave({ root });
  const inventory = inventoryPreparedScientificWave({ preparedWave });
  if (inventory.duplicateIds.length) throw new Error(`P11_PREPARED_OBJECT_ID_COLLISION:${inventory.duplicateIds.join(",")}`);
  const baselineAggregate = normalizeP10Corpus();
  const baselineCatalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: baselineAggregate });
  const baselineRegistry = createAuthoritativeScientificRegistry({ territorialCampaignCorpus: baselineAggregate });
  const territoryModel = createScientificTerritoryModel({ catalog: p9ScientificKnowledgeCatalog });
  if (territoryModel.digest !== p10Bundle.territory.digest) throw new Error("P11_TERRITORY_BASELINE_DIGEST_CHANGED");
  const initialSnapshot = createScientificProductionSnapshot({ phase: "P11_INITIAL", catalog: baselineCatalog, registry: baselineRegistry, territoryModel, warnings: ["PREPARED_WAVE_NOT_AUTHORITATIVE", "NO_P11_CAMPAIGN_ACTIVE"], gitSha: P11_GIT_SHA });
  const packages = Object.values(preparedWave.exports.continuousWaveDomainPackages).filter((item) => item.domainId !== "segmentation");
  const sourceAudits = freeze(packages.map((domainPackage) => freeze({ domainId: domainPackage.domainId, nodeId: domainPackage.nodeId, ...validatePreparedDomainSources({ domainPackage }) })));
  const eligiblePackages = new Map(packages.filter((item) => sourceAudits.find((audit) => audit.domainId === item.domainId)?.valid).map((item) => [item.nodeId, item]));
  let currentAggregate = baselineAggregate;
  let currentCatalog = baselineCatalog;
  let currentRegistry = baselineRegistry;
  let currentSnapshot = initialSnapshot;
  const campaignRecords = [];
  const reviewedCorpora = [];
  const selectionHistory = [];
  while (campaignRecords.length < P11_MAX_CAMPAIGNS) {
    const plannedIndex = currentCatalog.campaigns.findIndex((campaign) => eligiblePackages.has(campaign.selectedNodeIds[0]));
    if (plannedIndex < 0) break;
    const planned = currentCatalog.campaigns[plannedIndex];
    const domainPackage = eligiblePackages.get(planned.selectedNodeIds[0]);
    const campaignId = P11_CAMPAIGN_IDS[domainPackage.domainId];
    if (!campaignId) throw new Error(`P11_CAMPAIGN_ID_UNDEFINED:${domainPackage.domainId}`);
    const sourceVerification = sourceAudits.find((audit) => audit.domainId === domainPackage.domainId);
    selectionHistory.push(freeze({
      iteration: campaignRecords.length + 1,
      queueDigest: createScientificQueueReport({ catalog: currentCatalog, territoryModel }).digest,
      selectedQueueRank: plannedIndex + 1,
      selectedNodeId: domainPackage.nodeId,
      selectedDomainId: domainPackage.domainId,
      manualSelection: false,
      reason: plannedIndex === 0 ? "FIRST_OFFICIAL_QUEUE_ENTRY_WITH_VALIDATED_PACKAGE" : "FIRST_EXECUTABLE_OFFICIAL_QUEUE_ENTRY_WITH_VALIDATED_PACKAGE",
    }));
    const manifest = createImmutableManifest({ planned, domainPackage, campaignId, sourceVerification });
    const reviewedCorpus = buildReviewedTerritorialDomainCorpus({ domainPackage, campaignManifest: manifest, existingRegistry: currentRegistry });
    const corrections = summarizeDomainCorrections({ preparedPackage: domainPackage, reviewedCorpus });
    const adapter = createTerritorialScientificCampaignAdapter({ reviewedCorpus, adapterId: P11_ADAPTER_ID });
    const adapterRegistry = new ScientificCampaignAdapterRegistry([adapter]);
    const common = { campaignManifest: manifest, catalog: currentCatalog, adapterRegistry, executionAdapterId: P11_ADAPTER_ID, now: P11_EXECUTED_AT };
    const simulationA = await executeScientificCampaign({ ...common, mode: "SIMULATION" });
    const simulationB = await executeScientificCampaign({ ...common, mode: "SIMULATION" });
    if (stableStringify(simulationA, 0) !== stableStringify(simulationB, 0)) throw new Error(`P11_CAMPAIGN_SIMULATION_NON_DETERMINISTIC:${campaignId}`);
    const writer = createAtomicScientificCorpusWriter();
    const execution = await executeScientificCampaign({ ...common, mode: "APPLY", writer });
    if (!execution.mutationApplied || writer.applyCount !== 1 || writer.snapshot()?.length !== execution.preparedRecordCount) throw new Error(`P11_CAMPAIGN_ATOMIC_WRITE_FAILED:${campaignId}`);
    const officialCampaignCorpus = makeCampaignCorpus({ reviewedCorpus, manifest, execution });
    const previousAggregate = currentAggregate;
    const previousCatalog = currentCatalog;
    const previousRegistry = currentRegistry;
    const beforeSnapshot = currentSnapshot;
    currentAggregate = appendCampaignCorpus(currentAggregate, officialCampaignCorpus);
    currentCatalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: currentAggregate });
    currentRegistry = createAuthoritativeScientificRegistry({ territorialCampaignCorpus: currentAggregate });
    currentSnapshot = createScientificProductionSnapshot({ phase: `P11_POST_CAMPAIGN_${String(campaignRecords.length + 2).padStart(3, "0")}`, catalog: currentCatalog, registry: currentRegistry, territoryModel, warnings: currentAggregate.gaps, gitSha: P11_GIT_SHA });
    const coverage = createScientificCoverageReport({ catalog: currentCatalog, territoryModel, previousCatalog });
    const readiness = createTerritorialReadinessReport({ catalog: currentCatalog, nodeId: domainPackage.nodeId });
    const queue = createScientificQueueReport({ catalog: currentCatalog, territoryModel });
    const replayCatalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: currentAggregate });
    const replayRegistry = createAuthoritativeScientificRegistry({ territorialCampaignCorpus: currentAggregate });
    const replaySnapshot = createScientificProductionSnapshot({ phase: currentSnapshot.phase, catalog: replayCatalog, registry: replayRegistry, territoryModel, warnings: currentAggregate.gaps, gitSha: P11_GIT_SHA });
    const replay = freeze({ valid: stableStringify(replayCatalog, 0) === stableStringify(currentCatalog, 0) && stableStringify(replayRegistry, 0) === stableStringify(currentRegistry, 0) && replaySnapshot.snapshotDigest === currentSnapshot.snapshotDigest, catalogDigest: replayCatalog.digest, planningDigest: replayCatalog.planningDigest, snapshotDigest: replaySnapshot.snapshotDigest });
    if (!replay.valid) throw new Error(`P11_CAMPAIGN_REPLAY_DIVERGED:${campaignId}`);
    const rollbackCatalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: previousAggregate });
    const rollbackRegistry = createAuthoritativeScientificRegistry({ territorialCampaignCorpus: previousAggregate });
    const rollbackSnapshot = createScientificProductionSnapshot({ phase: beforeSnapshot.phase, catalog: rollbackCatalog, registry: rollbackRegistry, territoryModel, warnings: beforeSnapshot.warnings, gitSha: P11_GIT_SHA });
    const rollbackDryRun = freeze({ applied: false, valid: stableStringify(rollbackCatalog, 0) === stableStringify(previousCatalog, 0) && stableStringify(rollbackRegistry, 0) === stableStringify(previousRegistry, 0) && rollbackSnapshot.snapshotDigest === beforeSnapshot.snapshotDigest, restoredCatalogDigest: rollbackCatalog.digest, restoredPlanningDigest: rollbackCatalog.planningDigest, restoredSnapshotDigest: rollbackSnapshot.snapshotDigest, manifestPreserved: true, tracePreserved: true });
    if (!rollbackDryRun.valid) throw new Error(`P11_CAMPAIGN_ROLLBACK_DRY_RUN_FAILED:${campaignId}`);
    reviewedCorpora.push(reviewedCorpus);
    campaignRecords.push(campaignRecord({ index: campaignRecords.length + 1, domainPackage, manifest, sourceVerification, reviewedCorpus, corrections, simulations: freeze({ first: simulationA, second: simulationB, identical: true }), execution, beforeSnapshot, postSnapshot: currentSnapshot, coverage, readiness, queue, replay, rollbackDryRun }));
    eligiblePackages.delete(domainPackage.nodeId);
  }
  if (campaignRecords.length < P11_MIN_CAMPAIGNS) throw new Error(`P11_MINIMUM_CLEAN_CAMPAIGNS_NOT_REACHED:${campaignRecords.length}`);
  const requalificationRegistry = createP11RequalificationRegistry({ inventory, p10Registry: p10Bundle.requalificationRegistry, reviewedCorpora });
  const finalQueue = createScientificQueueReport({ catalog: currentCatalog, territoryModel });
  const nextQueueEntry = finalQueue.entries[0] ?? null;
  const termination = freeze({
    reason: campaignRecords.length === P11_MAX_CAMPAIGNS ? "MAXIMUM_CAMPAIGN_LIMIT_REACHED" : "NEXT_QUEUE_DOMAIN_HAS_NO_VALIDATED_PREPARED_CANDIDATES",
    nextQueueEntry,
    nextExecutablePreparedPackage: finalQueue.entries.find((entry) => eligiblePackages.has(entry.knowledgeNodeId)) ?? null,
    sourceResearchRequiredBeforeResume: !finalQueue.entries.some((entry) => eligiblePackages.has(entry.knowledgeNodeId)),
  });
  const disposition = freeze({
    filePreserved: true,
    allObjectsDecided: requalificationRegistry.complete,
    integrated: requalificationRegistry.counts.integrated,
    deferred: requalificationRegistry.counts.deferred,
    rejected: requalificationRegistry.counts.rejected,
    untreated: 0,
    processedDomains: freeze(reviewedCorpora.map((corpus) => corpus.domainId)),
    remainingPreparedDomains: freeze([...eligiblePackages.values()].map((item) => item.domainId).sort()),
  });
  const totals = freeze({
    campaignsExecuted: campaignRecords.length,
    sourcesAdded: reviewedCorpora.reduce((sum, corpus) => sum + corpus.sources.length, 0),
    sourcesReused: reviewedCorpora.reduce((sum, corpus) => sum + corpus.reusedSourceIds.length, 0),
    conceptsAdded: reviewedCorpora.reduce((sum, corpus) => sum + corpus.concepts.length, 0),
    assertionsAdded: reviewedCorpora.reduce((sum, corpus) => sum + corpus.assertions.length, 0),
    evidenceLinksAdded: reviewedCorpora.reduce((sum, corpus) => sum + corpus.evidenceLinks.length, 0),
    synthesesAdded: reviewedCorpora.reduce((sum, corpus) => sum + corpus.syntheses.length, 0),
    projectionsAdded: reviewedCorpora.reduce((sum, corpus) => sum + corpus.projections.length, 0),
  });
  const material = {
    bundleVersion: P11_VERSION,
    status: "COMPLETED_WITH_EXPLICIT_GAPS",
    gitSha: P11_GIT_SHA,
    preparedPackage: freeze({ sourcePath: preparedWave.sourcePath, sourceDigest: preparedWave.sourceDigest, trustStatus: preparedWave.trustStatus, inventory: freeze({ counts: inventory.counts, duplicateIds: inventory.duplicateIds, inventoryDigest: inventory.inventoryDigest, objectIndex: freeze(inventory.objects.map(({ preparedObjectId, objectType, domainPackage, category, originalDigest }) => freeze({ preparedObjectId, objectType, domainPackage, category, originalDigest }))) }) }),
    territory: freeze({ modelId: territoryModel.modelId, version: territoryModel.version, digest: territoryModel.digest, mutated: false }),
    initialSnapshot,
    sourceAudits,
    selectionHistory: freeze(selectionHistory),
    campaigns: freeze(campaignRecords),
    requalificationRegistry,
    officialCorpus: currentAggregate,
    postSnapshot: currentSnapshot,
    finalCatalog: freeze({ catalogId: currentCatalog.catalogId, version: currentCatalog.version, digest: currentCatalog.digest, planningDigest: currentCatalog.planningDigest, summary: currentCatalog.summary }),
    finalQueue,
    termination,
    continuousWaveDisposition: disposition,
    totals,
    protectedSurfaces: freeze({ publicPagesChanged: 0, routesChanged: 0, seoChanged: 0, sitemapChanged: 0, viewersChanged: 0, pacsChanged: 0, supabaseChanged: 0, authChanged: 0, stripeChanged: 0, editorialEngineChanged: 0 }),
  };
  return freeze({ ...material, digest: sha256Digest(material) });
};
