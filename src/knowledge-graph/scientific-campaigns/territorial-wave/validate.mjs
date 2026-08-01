import { sha256Digest, stableStringify } from "../../migration/stable-json.mjs";
import { validateCampaignManifest } from "../../knowledge-catalog/campaign-contracts.mjs";
import { createAuthoritativeScientificRegistry, createScientificKnowledgeCatalog } from "../../knowledge-catalog/catalog-builder.mjs";
import { inspectProtectedSurfaces } from "../../scientific-corpus/protected-surfaces.mjs";
import { P10_PREPARED_FILE_SHA256 } from "../continuous-wave/constants.mjs";
import { P11_CAMPAIGN_IDS, P11_MAX_CAMPAIGNS, P11_MIN_CAMPAIGNS, P11_PUBLICATION_GUARDS } from "./constants.mjs";

const freeze = (value) => Object.freeze(value);
const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const checkDigest = (record, field = "digest") => {
  const { [field]: supplied, ...material } = record;
  return supplied === sha256Digest(material);
};
const snapshotDigestValid = (snapshot) => {
  const { digests, snapshotDigest, ...material } = snapshot;
  return Boolean(digests) && snapshotDigest === sha256Digest(material);
};
const terminalCampaignStatuses = new Set(["COMPLETED", "COMPLETED_WITH_GAPS", "COMPLETED_WITH_EXPLICIT_GAPS"]);

export const validateP11PreparedWave = ({ bundle } = {}) => {
  const errors = [];
  add(errors, bundle.preparedPackage.sourceDigest !== P10_PREPARED_FILE_SHA256, "P11_PREPARED_SOURCE_DIGEST_CHANGED");
  add(errors, !bundle.preparedPackage.trustStatus.startsWith("UNTRUSTED_PREPARED_PACKAGE"), "P11_PREPARED_TRUST_COLLAPSED");
  add(errors, bundle.preparedPackage.inventory.counts.total !== bundle.preparedPackage.inventory.objectIndex.length, "P11_PREPARED_INVENTORY_INCOMPLETE");
  add(errors, bundle.preparedPackage.inventory.duplicateIds.length > 0, "P11_PREPARED_ID_COLLISION");
  add(errors, !bundle.continuousWaveDisposition.filePreserved, "P11_PREPARED_FILE_NOT_PRESERVED");
  add(errors, !bundle.continuousWaveDisposition.allObjectsDecided || bundle.continuousWaveDisposition.untreated !== 0, "P11_PREPARED_OBJECT_UNTREATED");
  add(errors, bundle.requalificationRegistry.decisions.length !== bundle.preparedPackage.inventory.counts.total || !bundle.requalificationRegistry.complete, "P11_REQUALIFICATION_INCOMPLETE");
  add(errors, bundle.requalificationRegistry.digest !== sha256Digest({ preparedSourceDigest: bundle.requalificationRegistry.preparedSourceDigest, decisions: bundle.requalificationRegistry.decisions, counts: bundle.requalificationRegistry.counts }), "P11_REQUALIFICATION_DIGEST_INVALID");
  add(errors, bundle.requalificationRegistry.counts.deferred !== 0, "P11_VALIDATED_PREPARED_DOMAIN_LEFT_DEFERRED");
  return freeze({ valid: errors.length === 0, errors: freeze(errors), counts: bundle.requalificationRegistry.counts });
};

export const validateP11Territory = ({ bundle, p10Bundle } = {}) => {
  const errors = [];
  add(errors, bundle.territory.mutated || bundle.territory.digest !== p10Bundle.territory.digest, "P11_TERRITORY_MODEL_CHANGED");
  for (const decision of bundle.requalificationRegistry.decisions.filter((item) => item.domainPackage)) {
    add(errors, !decision.territoryAlignment, "P11_TERRITORY_ALIGNMENT_MISSING", { preparedObjectId: decision.preparedObjectId });
    add(errors, decision.territoryAlignment?.scopeStatus !== "IN_SCOPE", "P11_TERRITORY_ALIGNMENT_NOT_IN_SCOPE", { preparedObjectId: decision.preparedObjectId });
  }
  return freeze({ valid: errors.length === 0, errors: freeze(errors), digest: bundle.territory.digest });
};

export const validateP11SourceAudits = ({ bundle } = {}) => {
  const errors = [];
  add(errors, bundle.sourceAudits.length !== 4, "P11_SOURCE_AUDIT_DOMAIN_COUNT_INVALID");
  for (const audit of bundle.sourceAudits) add(errors, !audit.valid || audit.sources !== 5 || audit.locators !== 12 || audit.abstractOnly !== 0, "P11_SOURCE_AUDIT_FAILED", { domainId: audit.domainId, sourceErrors: audit.errors });
  const sources = bundle.officialCorpus.sources.filter((source) => source.domainId !== "segmentation");
  add(errors, sources.length !== bundle.totals.sourcesAdded, "P11_SOURCE_ADDITION_COUNT_INVALID");
  add(errors, duplicates(sources.map((source) => source.revisionId)).length > 0, "P11_SOURCE_REVISION_COLLISION");
  for (const source of sources) {
    add(errors, !/^\d{7,8}$/.test(source.pmid ?? ""), "P11_SOURCE_PMID_INVALID", { revisionId: source.revisionId });
    add(errors, source.doi && !/^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(source.doi), "P11_SOURCE_DOI_INVALID", { revisionId: source.revisionId });
    add(errors, !source.title || !Array.isArray(source.authors) || !source.authors.length || source.authors.some((author) => /^et al\.?$/i.test(author)), "P11_SOURCE_METADATA_INCOMPLETE", { revisionId: source.revisionId });
    add(errors, !source.officialMetadataUrl || !source.officialFullTextUrl || !source.sourceVerificationDigest, "P11_SOURCE_OFFICIAL_VERIFICATION_MISSING", { revisionId: source.revisionId });
    add(errors, source.documentStatus === "RETRACTED", "P11_RETRACTED_SOURCE_INTEGRATED", { revisionId: source.revisionId });
  }
  return freeze({ valid: errors.length === 0, errors: freeze(errors), sourcesAdded: sources.length, sourcesReused: bundle.totals.sourcesReused, fullText: bundle.sourceAudits.reduce((sum, audit) => sum + audit.fullText, 0) });
};

export const validateP11SequentialSelection = ({ bundle } = {}) => {
  const errors = [];
  const domains = bundle.campaigns.map((campaign) => campaign.domainId);
  add(errors, bundle.campaigns.length < P11_MIN_CAMPAIGNS || bundle.campaigns.length > P11_MAX_CAMPAIGNS, "P11_CAMPAIGN_COUNT_OUTSIDE_LIMIT", { count: bundle.campaigns.length });
  add(errors, stableStringify(domains, 0) !== stableStringify(["t2-mapping", "quality-control", "neuro-oncology", "oef-cmro2"], 0), "P11_CAMPAIGN_ORDER_NON_DETERMINISTIC", { domains });
  add(errors, bundle.selectionHistory.length !== bundle.campaigns.length || bundle.selectionHistory.some((selection) => selection.manualSelection || selection.selectedQueueRank !== 1), "P11_MANUAL_OR_NONFIRST_QUEUE_SELECTION");
  add(errors, duplicates(bundle.campaigns.map((campaign) => campaign.manifest.campaignId)).length > 0, "P11_CAMPAIGN_ID_COLLISION");
  for (const campaign of bundle.campaigns) {
    add(errors, P11_CAMPAIGN_IDS[campaign.domainId] !== campaign.manifest.campaignId, "P11_CAMPAIGN_ID_SEQUENCE_INVALID", { domainId: campaign.domainId });
    add(errors, campaign.manifest.selectedNodeIds[0] !== campaign.nodeId, "P11_CAMPAIGN_NODE_INVALID", { domainId: campaign.domainId });
    add(errors, validateCampaignManifest(campaign.manifest).errors.length > 0, "P11_CAMPAIGN_MANIFEST_INVALID", { domainId: campaign.domainId });
    const { manifestDigest, ...material } = campaign.manifest;
    add(errors, manifestDigest !== sha256Digest(material), "P11_CAMPAIGN_MANIFEST_DIGEST_INVALID", { domainId: campaign.domainId });
  }
  return freeze({ valid: errors.length === 0, errors: freeze(errors), domains: freeze(domains) });
};

export const validateP11Candidates = ({ bundle } = {}) => {
  const errors = [];
  const registry = createAuthoritativeScientificRegistry({ territorialCampaignCorpus: bundle.officialCorpus });
  const sourceIds = new Set(registry.sources.map((source) => source.revisionId));
  const assertionIds = new Set(registry.assertions.map((assertion) => assertion.revisionId));
  const linksByAssertion = Map.groupBy(bundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.evidenceLinks), (link) => link.assertionRevisionId);
  const p11Assertions = bundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.assertions);
  const p11Links = bundle.campaigns.flatMap((campaign) => campaign.reviewedCorpus.evidenceLinks);
  add(errors, duplicates(p11Assertions.map((assertion) => assertion.revisionId)).length > 0 || duplicates(p11Links.map((link) => link.evidenceLinkId)).length > 0, "P11_SCIENTIFIC_IDENTITY_COLLISION");
  for (const assertion of p11Assertions) {
    const links = linksByAssertion.get(assertion.revisionId) ?? [];
    add(errors, assertion.statement?.atomicConclusionCount !== 1, "P11_ASSERTION_NOT_ATOMIC", { revisionId: assertion.revisionId });
    add(errors, !assertion.sourceRefs?.length || assertion.sourceRefs.some((sourceId) => !sourceIds.has(sourceId)), "P11_ASSERTION_SOURCE_INVALID", { revisionId: assertion.revisionId });
    add(errors, links.length === 0 || links.every((link) => link.relationType === "MENTIONS"), "P11_ASSERTION_WITHOUT_EVIDENCE", { revisionId: assertion.revisionId });
    add(errors, assertion.humanReviewed || assertion.scientificHumanReview !== null, "P11_FALSE_HUMAN_REVIEW", { revisionId: assertion.revisionId });
    add(errors, assertion.objectEntityId === null && assertion.literalValue !== null && assertion.assertionType === "EntityObjectAssertion", "P11_LITERAL_ASSERTION_MISTYPED", { revisionId: assertion.revisionId });
    add(errors, assertion.facets?.manufacturers?.length > 0 || assertion.facets?.software?.length > 0, "P11_UNSOURCED_PLATFORM_CONTEXT", { revisionId: assertion.revisionId });
  }
  for (const link of p11Links) {
    add(errors, !sourceIds.has(link.sourceRevisionId) || !assertionIds.has(link.assertionRevisionId), "P11_EVIDENCE_ENDPOINT_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !link.locator || !link.extraction?.section || !link.extraction?.analyticalSummary, "P11_EVIDENCE_LOCALIZER_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.relationType === "SUPPORTS" && !link.extraction.sourceMeaningDirectlyExpressed, "P11_SUPPORTS_WITHOUT_DIRECT_MEANING", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction.verbatimSourceTextRetained !== false || link.extraction.directAuthorStatement !== false, "P11_PROTECTED_TEXT_CONTRACT_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.scientificHumanReview !== null, "P11_FALSE_EVIDENCE_HUMAN_REVIEW", { evidenceLinkId: link.evidenceLinkId });
  }
  return freeze({ valid: errors.length === 0, errors: freeze(errors), assertions: p11Assertions.length, evidenceLinks: p11Links.length });
};

export const validateP11Execution = ({ bundle } = {}) => {
  const errors = [];
  add(errors, !checkDigest(bundle), "P11_EXECUTION_BUNDLE_DIGEST_INVALID");
  add(errors, !snapshotDigestValid(bundle.initialSnapshot) || !snapshotDigestValid(bundle.postSnapshot), "P11_SNAPSHOT_DIGEST_INVALID");
  for (let index = 0; index < bundle.campaigns.length; index += 1) {
    const campaign = bundle.campaigns[index];
    const expectedBefore = index === 0 ? bundle.initialSnapshot : bundle.campaigns[index - 1].postSnapshot;
    add(errors, campaign.beforeSnapshot.snapshotDigest !== expectedBefore.snapshotDigest, "P11_CAMPAIGN_BASELINE_CHAIN_BROKEN", { domainId: campaign.domainId });
    add(errors, !campaign.simulations.identical || stableStringify(campaign.simulations.first, 0) !== stableStringify(campaign.simulations.second, 0), "P11_SIMULATION_NON_DETERMINISTIC", { domainId: campaign.domainId });
    add(errors, !terminalCampaignStatuses.has(campaign.execution.status) || campaign.execution.mutationRecordCount <= 0, "P11_EXECUTION_NOT_COMPLETED", { domainId: campaign.domainId });
    add(errors, !campaign.replay.valid || campaign.replay.catalogDigest !== campaign.postSnapshot.catalog.digest || campaign.replay.snapshotDigest !== campaign.postSnapshot.snapshotDigest, "P11_REPLAY_DIVERGED", { domainId: campaign.domainId });
    add(errors, campaign.rollbackDryRun.applied || !campaign.rollbackDryRun.valid || !campaign.rollbackDryRun.manifestPreserved || !campaign.rollbackDryRun.tracePreserved, "P11_ROLLBACK_DRY_RUN_INVALID", { domainId: campaign.domainId });
    add(errors, campaign.rollbackDryRun.restoredSnapshotDigest !== campaign.beforeSnapshot.snapshotDigest, "P11_ROLLBACK_BASELINE_MISMATCH", { domainId: campaign.domainId });
  }
  add(errors, bundle.finalCatalog.version !== "1.3.0" || bundle.finalCatalog.digest !== bundle.postSnapshot.catalog.digest, "P11_FINAL_CATALOG_INVALID");
  const replayCatalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: bundle.officialCorpus });
  add(errors, replayCatalog.digest !== bundle.finalCatalog.digest || replayCatalog.planningDigest !== bundle.finalCatalog.planningDigest, "P11_FINAL_CATALOG_REPLAY_DIVERGED");
  return freeze({ valid: errors.length === 0, errors: freeze(errors), campaigns: bundle.campaigns.length, finalCatalog: bundle.finalCatalog });
};

export const validateP11CoverageAndReadiness = ({ bundle } = {}) => {
  const errors = [];
  for (const campaign of bundle.campaigns) {
    const domainTransitions = campaign.coverage.rows.filter((row) => row.catalogNodeId === campaign.nodeId && row.previousState !== row.state);
    add(errors, domainTransitions.length === 0 || domainTransitions.some((row) => row.previousState !== "DISCOVERING" || row.state !== "EDITORIAL_READY" || row.publicArtifacts !== 0), "P11_COVERAGE_TRANSITION_INVALID", { domainId: campaign.domainId });
    for (const field of ["scientificReadiness", "provenanceReadiness", "coverageReadiness", "synthesisReadiness", "projectionReadiness", "editorialReadiness"]) add(errors, !campaign.readiness.dimensions[field].ready, "P11_READINESS_BLOCKED", { domainId: campaign.domainId, field });
    add(errors, campaign.readiness.dimensions.publicReadiness.ready || !campaign.readiness.dimensions.publicReadiness.errors.includes("PUBLICATION_OUT_OF_SCOPE"), "P11_PUBLIC_READINESS_ENABLED", { domainId: campaign.domainId });
    for (const projection of campaign.reviewedCorpus.projections) for (const [field, expected] of Object.entries(P11_PUBLICATION_GUARDS)) add(errors, projection[field] !== expected, "P11_PROJECTION_PUBLICATION_GUARD_INVALID", { projectionId: projection.projectionId, field });
  }
  add(errors, bundle.finalQueue.entries.some((entry, index) => entry.rank !== index + 1), "P11_FINAL_QUEUE_RANK_INVALID");
  add(errors, bundle.finalQueue.entries.some((entry) => bundle.campaigns.some((campaign) => campaign.nodeId === entry.knowledgeNodeId)), "P11_EXECUTED_DOMAIN_REQUEUED");
  add(errors, bundle.termination.nextQueueEntry?.knowledgeNodeId !== "noxia:knowledge-catalog:domain:radiomics", "P11_NEXT_DOMAIN_UNEXPECTED");
  add(errors, !bundle.termination.sourceResearchRequiredBeforeResume || bundle.termination.nextExecutablePreparedPackage !== null, "P11_STOP_CONDITION_INVALID");
  return freeze({ valid: errors.length === 0, errors: freeze(errors), queueEntries: bundle.finalQueue.entries.length, next: bundle.termination.nextQueueEntry });
};

export const validateP11ProtectedSurfaces = ({ bundle, root = process.cwd(), inspectGit = true } = {}) => {
  const errors = [];
  for (const [field, value] of Object.entries(bundle.protectedSurfaces)) add(errors, value !== 0, "P11_PROTECTED_SURFACE_MUTATION_RECORDED", { field, value });
  const inspection = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  add(errors, !inspection.protectedSurfacesUnchanged, "P11_PROTECTED_SURFACE_CHANGED", { changes: inspection.protectedChanges });
  add(errors, !inspection.editorialEngineUnchanged, "P11_EDITORIAL_ENGINE_CHANGED", { changes: inspection.editorialEngine?.changed });
  return freeze({ valid: errors.length === 0, errors: freeze(errors), inspection });
};

export const validateP11ContinuousTerritorialProduction = ({ bundle, p10Bundle, root = process.cwd(), inspectGit = true } = {}) => {
  const layers = freeze({
    preparedWave: validateP11PreparedWave({ bundle }),
    territory: validateP11Territory({ bundle, p10Bundle }),
    sources: validateP11SourceAudits({ bundle }),
    selection: validateP11SequentialSelection({ bundle }),
    candidates: validateP11Candidates({ bundle }),
    execution: validateP11Execution({ bundle }),
    coverageAndReadiness: validateP11CoverageAndReadiness({ bundle }),
    protectedSurfaces: validateP11ProtectedSurfaces({ bundle, root, inspectGit }),
  });
  const errors = Object.entries(layers).flatMap(([layer, result]) => result.errors.map((error) => ({ layer, ...error })));
  return freeze({ valid: errors.length === 0, version: "P11_CONTINUOUS_TERRITORY_DRIVEN_SCIENTIFIC_PRODUCTION", errors: freeze(errors), layers, counts: bundle.totals });
};
