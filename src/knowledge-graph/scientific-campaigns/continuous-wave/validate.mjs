import { stableStringify, sha256Digest } from "../../migration/stable-json.mjs";
import { validateCampaignManifest } from "../../knowledge-catalog/campaign-contracts.mjs";
import { inspectProtectedSurfaces } from "../../scientific-corpus/protected-surfaces.mjs";
import {
  P10_CAMPAIGN_ID,
  P10_PREPARED_FILE_SHA256,
  P10_PUBLICATION_GUARDS,
  P10_SELECTED_DOMAIN_ID,
  P10_SELECTED_NODE_ID,
} from "./constants.mjs";

const ALLOWED_DECISIONS = Object.freeze([
  "ACCEPT_AS_IS",
  "ACCEPT_WITH_CORRECTION",
  "DEFER_SOURCE_INSUFFICIENT",
  "DEFER_CONTEXT_INSUFFICIENT",
  "DEFER_TERRITORY_UNRESOLVED",
  "REJECT_DUPLICATE",
  "REJECT_OUT_OF_SCOPE",
  "REJECT_INVALID_SOURCE",
  "REJECT_NON_ATOMIC_ASSERTION",
  "REJECT_INVALID_EVIDENCE_LINK",
  "REJECT_UNSUPPORTED_CLAIM",
]);
const EVIDENCE_TYPES = Object.freeze(["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS", "DERIVES", "CORRECTS", "RETRACTS", "UNRESOLVED_EVIDENCE_LINK"]);
const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const checkDigest = (record, field = "digest") => {
  const { [field]: supplied, ...material } = record;
  return supplied === sha256Digest(material);
};
const AUDIT_OBJECT_TYPES = new Set(["InternalSourceAuditEntry", "RejectedSourceCandidate", "PreparedPublicationGuards", "PreparedLimits", "PreparedDomainPackage"]);
const snapshotDigestValid = (snapshot) => {
  const { digests, snapshotDigest, ...material } = snapshot;
  return Boolean(digests) && snapshotDigest === sha256Digest(material);
};

export const validateScientificTerritoryAlignment = ({ bundle, territoryModel } = {}) => {
  const errors = [];
  const territoryIds = new Set(territoryModel.nodes.map((node) => node.territoryNodeId));
  for (const decision of bundle.requalificationRegistry.decisions) {
    if (!decision.domainPackage) continue;
    add(errors, !decision.territoryAlignment, "P10_TERRITORY_ALIGNMENT_MISSING", { preparedObjectId: decision.preparedObjectId });
    if (!decision.territoryAlignment) continue;
    add(errors, decision.territoryAlignment.scopeStatus !== "IN_SCOPE", "P10_TERRITORY_SCOPE_NOT_ACCEPTED", { preparedObjectId: decision.preparedObjectId, status: decision.territoryAlignment.scopeStatus });
    for (const field of ["territoryNodeId", "domainNodeId", "defaultSubdomainNodeId", "knowledgeAreaId"]) {
      const value = decision.territoryAlignment[field];
      if (value) add(errors, !territoryIds.has(value), "P10_TERRITORY_NODE_UNKNOWN", { preparedObjectId: decision.preparedObjectId, field, value });
    }
  }
  add(errors, bundle.territory.digest !== territoryModel.digest || bundle.territory.mutated, "P10_TERRITORY_MODEL_MUTATED");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), alignedObjects: bundle.requalificationRegistry.decisions.filter((item) => item.domainPackage).length });
};

export const validatePreparedScientificPackage = ({ bundle } = {}) => {
  const errors = [];
  const inventory = bundle.preparedPackage.inventory;
  const objectIds = inventory.objectIndex.map((item) => item.preparedObjectId);
  const decisions = bundle.requalificationRegistry.decisions;
  add(errors, bundle.preparedPackage.sourceDigest !== P10_PREPARED_FILE_SHA256, "P10_PREPARED_SOURCE_DIGEST_INVALID");
  add(errors, !bundle.preparedPackage.trustStatus.startsWith("UNTRUSTED_PREPARED_PACKAGE"), "P10_PREPARED_PACKAGE_TRUST_COLLAPSED");
  add(errors, "objects" in inventory || inventory.objectIndex.some((item) => "value" in item), "P10_RAW_PREPARED_OBJECT_PROMOTED_TO_OFFICIAL_BUNDLE");
  add(errors, inventory.counts.total !== inventory.objectIndex.length || inventory.counts.total !== decisions.length, "P10_PREPARED_INVENTORY_INCOMPLETE");
  add(errors, inventory.counts.duplicateIds !== 0 || duplicates(objectIds).length > 0, "P10_PREPARED_OBJECT_ID_COLLISION");
  add(errors, !bundle.requalificationRegistry.complete, "P10_REQUALIFICATION_INCOMPLETE");
  add(errors, bundle.requalificationRegistry.digest !== sha256Digest({ preparedSourceDigest: bundle.requalificationRegistry.preparedSourceDigest, decisions, counts: bundle.requalificationRegistry.counts }), "P10_REQUALIFICATION_DIGEST_INVALID");
  for (const decision of decisions) {
    add(errors, !ALLOWED_DECISIONS.includes(decision.decision), "P10_REQUALIFICATION_DECISION_INVALID", { preparedObjectId: decision.preparedObjectId, decision: decision.decision });
    add(errors, !decision.justification || !decision.reviewerType || !decision.migrationStatus, "P10_REQUALIFICATION_TRACE_INCOMPLETE", { preparedObjectId: decision.preparedObjectId });
    if (decision.domainPackage !== P10_SELECTED_DOMAIN_ID && !AUDIT_OBJECT_TYPES.has(decision.objectType)) add(errors, !decision.decision.startsWith("DEFER") && !decision.decision.startsWith("REJECT"), "P10_UNSELECTED_DOMAIN_INTEGRATED", { preparedObjectId: decision.preparedObjectId });
  }
  add(errors, bundle.continuousWaveDisposition.untreated !== 0 || !bundle.continuousWaveDisposition.allObjectsDecided, "P10_PREPARED_OBJECT_UNTREATED");
  add(errors, !bundle.continuousWaveDisposition.filePreserved, "P10_PREPARED_FILE_NOT_PRESERVED");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: inventory.counts, decisions: bundle.requalificationRegistry.counts });
};

export const validateScientificCampaignSources = ({ bundle } = {}) => {
  const errors = [];
  const corpus = bundle.officialCorpus;
  const evidenceBySource = Map.groupBy(corpus.evidenceLinks, (item) => item.sourceRevisionId);
  add(errors, bundle.sourceVerification.sources !== corpus.sources.length || bundle.sourceVerification.locators !== corpus.evidenceLinks.length || !bundle.sourceVerification.valid, "P10_SOURCE_VERIFICATION_SUMMARY_INVALID");
  add(errors, duplicates(corpus.sources.map((item) => item.pmid)).length > 0, "P10_SOURCE_PMID_COLLISION");
  for (const source of corpus.sources) {
    add(errors, !/^\d{7,8}$/.test(source.pmid), "P10_SOURCE_PMID_INVALID", { revisionId: source.revisionId });
    add(errors, source.doi && !/^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(source.doi), "P10_SOURCE_DOI_INVALID", { revisionId: source.revisionId });
    add(errors, !source.title || !source.authors?.length || source.authors.some((author) => /^et al\.?$/i.test(author)), "P10_SOURCE_METADATA_INCOMPLETE", { revisionId: source.revisionId });
    add(errors, !source.officialMetadataUrl || !source.sourceVerificationDigest || !source.metadataAuthority, "P10_SOURCE_OFFICIAL_VERIFICATION_MISSING", { revisionId: source.revisionId });
    add(errors, !evidenceBySource.has(source.revisionId), "P10_SOURCE_WITHOUT_EXPLOITABLE_ASSERTION", { revisionId: source.revisionId });
    add(errors, !["CURRENT", "CORRECTED"].includes(source.documentStatus), "P10_SOURCE_DOCUMENT_STATUS_UNSAFE", { revisionId: source.revisionId, status: source.documentStatus });
    add(errors, source.documentStatus === "CORRECTED" && !source.correctionNoticeUrl, "P10_CORRECTED_SOURCE_NOTICE_MISSING", { revisionId: source.revisionId });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), sources: corpus.sources.length, fullText: corpus.sources.filter((item) => item.fullTextAvailability.startsWith("OFFICIAL_FULL_TEXT")).length });
};

export const validateScientificCampaignCandidates = ({ bundle } = {}) => {
  const errors = [];
  const corpus = bundle.officialCorpus;
  const sourceIds = new Set(corpus.sources.map((item) => item.revisionId));
  const assertionIds = new Set(corpus.assertions.map((item) => item.revisionId));
  const conceptIdList = corpus.concepts.map((item) => item.stableId);
  const assertionIdList = corpus.assertions.map((item) => item.revisionId);
  const evidenceIdList = corpus.evidenceLinks.map((item) => item.evidenceLinkId);
  const conceptIds = new Set(conceptIdList);
  const linksByAssertion = Map.groupBy(corpus.evidenceLinks, (item) => item.assertionRevisionId);
  add(errors, duplicates(conceptIdList).length > 0 || duplicates(assertionIdList).length > 0 || duplicates(evidenceIdList).length > 0, "P10_SCIENTIFIC_IDENTITY_COLLISION");
  for (const concept of corpus.concepts) {
    add(errors, !concept.sourceRefs?.length || concept.sourceRefs.some((sourceId) => !sourceIds.has(sourceId)), "P10_CONCEPT_SOURCE_INVALID", { stableId: concept.stableId });
    add(errors, concept.territoryAlignment?.scopeStatus !== "IN_SCOPE", "P10_CONCEPT_TERRITORY_INVALID", { stableId: concept.stableId });
  }
  for (const assertion of corpus.assertions) {
    const links = linksByAssertion.get(assertion.revisionId) ?? [];
    add(errors, assertion.statement?.atomicConclusionCount !== 1, "P10_ASSERTION_NOT_ATOMIC", { revisionId: assertion.revisionId });
    add(errors, !assertion.sourceRefs?.length || assertion.sourceRefs.some((sourceId) => !sourceIds.has(sourceId)), "P10_ASSERTION_SOURCE_INVALID", { revisionId: assertion.revisionId });
    add(errors, links.length === 0 || links.every((link) => link.relationType === "MENTIONS"), "P10_ASSERTION_WITHOUT_EVIDENCE", { revisionId: assertion.revisionId });
    add(errors, assertion.humanReviewed || assertion.scientificHumanReview !== null, "P10_FALSE_HUMAN_REVIEW", { revisionId: assertion.revisionId });
    add(errors, assertion.scientificMaturity === "CONSENSUS_RECOMMENDATION", "P10_UNSUPPORTED_CONSENSUS_PROMOTION", { revisionId: assertion.revisionId });
    add(errors, assertion.context?.dimensions?.some((dimension) => dimension.dimension === "modality" && dimension.operator === "ANY_OF" && dimension.value?.includes("NOT")), "P10_NOT_APPLICABLE_CONTEXT_SPLIT", { revisionId: assertion.revisionId });
    add(errors, assertion.facets?.manufacturers?.length > 0 || assertion.facets?.software?.length > 0, "P10_UNSOURCED_PLATFORM_CONTEXT", { revisionId: assertion.revisionId });
  }
  for (const link of corpus.evidenceLinks) {
    add(errors, !sourceIds.has(link.sourceRevisionId) || !assertionIds.has(link.assertionRevisionId), "P10_EVIDENCE_ENDPOINT_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !EVIDENCE_TYPES.includes(link.relationType), "P10_EVIDENCE_RELATION_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !link.locator || !link.extraction?.section || !link.extraction?.analyticalSummary, "P10_EVIDENCE_LOCALIZER_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.relationType === "SUPPORTS" && !link.extraction.sourceMeaningDirectlyExpressed, "P10_SUPPORTS_WITHOUT_DIRECTLY_EXPRESSED_MEANING", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction.passageKind !== "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT" || link.extraction.verbatimSourceTextRetained !== false || link.extraction.directAuthorStatement !== false, "P10_EXTRACTION_PROTECTED_TEXT_CONTRACT_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction.interpretationLevel === "DERIVED_INTERPRETATION" && !link.extraction.derivationSteps?.length, "P10_DERIVED_INTERPRETATION_STEPS_MISSING", { evidenceLinkId: link.evidenceLinkId });
    const linkedAssertion = corpus.assertions.find((item) => item.revisionId === link.assertionRevisionId);
    add(errors, linkedAssertion && stableStringify(link.applicability, 0) !== stableStringify(linkedAssertion.context, 0), "P10_EVIDENCE_CONTEXT_INCOMPATIBLE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.scientificHumanReview !== null, "P10_FALSE_EVIDENCE_HUMAN_REVIEW", { evidenceLinkId: link.evidenceLinkId });
  }
  add(errors, corpus.reviewDecisions.length !== corpus.assertions.length, "P10_REVIEW_REGISTER_INCOMPLETE");
  for (const decision of corpus.reviewDecisions) add(errors, decision.scientificHumanReview !== null || decision.automatedScientificReview, "P10_REVIEW_TYPE_DISHONEST", { decisionId: decision.decisionId });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({ concepts: corpus.concepts.length, assertions: corpus.assertions.length, evidenceLinks: corpus.evidenceLinks.length, supports: corpus.evidenceLinks.filter((item) => item.relationType === "SUPPORTS").length, qualifies: corpus.evidenceLinks.filter((item) => item.relationType === "QUALIFIES").length }) });
};

export const validateScientificCampaignManifest = ({ bundle, territoryModel } = {}) => {
  const errors = [...validateCampaignManifest(bundle.manifest).errors];
  const territoryIds = new Set(territoryModel.nodes.map((node) => node.territoryNodeId));
  const { manifestDigest, ...material } = bundle.manifest;
  add(errors, bundle.manifest.campaignId !== P10_CAMPAIGN_ID || !/^SCIENTIFIC-CAMPAIGN-\d{8}-\d{3}$/.test(bundle.manifest.campaignId), "P10_CAMPAIGN_ID_INVALID");
  add(errors, manifestDigest !== sha256Digest(material), "P10_CAMPAIGN_MANIFEST_DIGEST_INVALID");
  add(errors, bundle.manifest.selectedNodeIds.length !== 1 || bundle.manifest.selectedNodeIds[0] !== P10_SELECTED_NODE_ID, "P10_CAMPAIGN_NODE_SET_INVALID");
  add(errors, bundle.manifest.territoryNodeIds.some((id) => !territoryIds.has(id)), "P10_CAMPAIGN_TERRITORY_NODE_INVALID");
  add(errors, bundle.manifest.publicationAuthorized || bundle.manifest.generatedContent || bundle.manifest.generatedAssertions, "P10_CAMPAIGN_SCOPE_INVALID");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), campaignId: bundle.manifest.campaignId });
};

export const validateScientificCampaignExecution = ({ bundle, baselineCatalog } = {}) => {
  const errors = [];
  const corpus = bundle.officialCorpus;
  add(errors, bundle.status !== "COMPLETED_WITH_GAPS" || bundle.execution.executedCampaigns !== 1, "P10_EXECUTION_COUNT_OR_STATUS_INVALID");
  add(errors, bundle.execution.mutationRecordCount !== 69, "P10_ATOMIC_MUTATION_COUNT_INVALID", { count: bundle.execution.mutationRecordCount });
  add(errors, bundle.initialSnapshot.catalog.digest !== baselineCatalog.digest || bundle.initialSnapshot.catalog.planningDigest !== baselineCatalog.planningDigest, "P10_BASELINE_SNAPSHOT_INVALID");
  add(errors, !snapshotDigestValid(bundle.initialSnapshot) || !snapshotDigestValid(bundle.postSnapshot), "P10_SNAPSHOT_DIGEST_INVALID");
  add(errors, bundle.postSnapshot.catalog.version !== "1.2.0" || bundle.postSnapshot.catalog.digest === baselineCatalog.digest, "P10_FINAL_CATALOG_NOT_UPDATED");
  add(errors, corpus.domainId !== P10_SELECTED_DOMAIN_ID || corpus.sources.length !== 5 || corpus.concepts.length !== 8 || corpus.assertions.length !== 12 || corpus.evidenceLinks.length !== 12 || corpus.syntheses.length !== 1 || corpus.projections.length !== 1, "P10_OFFICIAL_CORPUS_INVENTORY_INVALID");
  add(errors, !bundle.simulations.identical || stableStringify(bundle.simulations.first, 0) !== stableStringify(bundle.simulations.second, 0), "P10_SIMULATION_NON_DETERMINISTIC");
  add(errors, bundle.plan.manualDomainSelection || bundle.plan.selectedDomainId !== P10_SELECTED_DOMAIN_ID || bundle.plan.candidates.filter((item) => item.selected).length !== 1, "P10_SELECTION_NOT_DETERMINISTIC");
  add(errors, !checkDigest(bundle), "P10_EXECUTION_BUNDLE_DIGEST_INVALID");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), status: bundle.status, additions: Object.freeze({ sources: corpus.sources.length, concepts: corpus.concepts.length, assertions: corpus.assertions.length, evidenceLinks: corpus.evidenceLinks.length, syntheses: corpus.syntheses.length, projections: corpus.projections.length }) });
};

export const validateScientificCampaignReplay = ({ bundle } = {}) => {
  const errors = [];
  add(errors, !bundle.replay.valid, "P10_REPLAY_DIVERGED");
  add(errors, bundle.replay.catalogDigest !== bundle.postSnapshot.catalog.digest || bundle.replay.planningDigest !== bundle.postSnapshot.catalog.planningDigest || bundle.replay.snapshotDigest !== bundle.postSnapshot.snapshotDigest, "P10_REPLAY_DIGEST_MISMATCH");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), replay: bundle.replay });
};

export const validateScientificCampaignRollback = ({ bundle, baselineCatalog } = {}) => {
  const errors = [];
  add(errors, bundle.rollbackDryRun.applied || !bundle.rollbackDryRun.valid, "P10_ROLLBACK_DRY_RUN_INVALID");
  add(errors, bundle.rollbackDryRun.restoredCatalogDigest !== baselineCatalog.digest || bundle.rollbackDryRun.restoredPlanningDigest !== baselineCatalog.planningDigest, "P10_ROLLBACK_BASELINE_MISMATCH");
  add(errors, !bundle.rollbackDryRun.manifestPreserved || !bundle.rollbackDryRun.tracePreserved, "P10_ROLLBACK_AUDIT_TRAIL_LOST");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), rollback: bundle.rollbackDryRun });
};

export const validateScientificCoverage = ({ bundle } = {}) => {
  const errors = [];
  const changed = bundle.coverage.rows.filter((item) => item.previousState !== item.state);
  add(errors, changed.length !== 1 || changed[0]?.catalogNodeId !== P10_SELECTED_NODE_ID, "P10_COVERAGE_DELTA_SCOPE_INVALID");
  add(errors, changed[0]?.previousState !== "DISCOVERING" || changed[0]?.state !== "EDITORIAL_READY", "P10_SEGMENTATION_COVERAGE_TRANSITION_INVALID");
  add(errors, changed[0]?.publicArtifacts !== 0, "P10_PUBLIC_COVERAGE_ARTIFACT_DETECTED");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), changed });
};

export const validateScientificReadiness = ({ bundle } = {}) => {
  const errors = [];
  const dimensions = bundle.readiness.dimensions;
  for (const field of ["scientificReadiness", "provenanceReadiness", "coverageReadiness", "synthesisReadiness", "projectionReadiness", "editorialReadiness"]) add(errors, !dimensions[field].ready, "P10_READINESS_DIMENSION_BLOCKED", { field });
  add(errors, dimensions.publicReadiness.ready || dimensions.publicReadiness.status !== "BLOCKED", "P10_PUBLIC_READINESS_ENABLED");
  add(errors, !dimensions.publicReadiness.errors.includes("PUBLICATION_OUT_OF_SCOPE"), "P10_PUBLIC_READINESS_BLOCKER_MISSING");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), dimensions });
};

export const validateScientificQueue = ({ bundle } = {}) => {
  const errors = [];
  add(errors, bundle.queue.entries.some((item) => item.knowledgeNodeId === P10_SELECTED_NODE_ID), "P10_EXECUTED_DOMAIN_REQUEUED");
  add(errors, bundle.queue.entries.some((item) => !item.territoryNodeId), "P10_QUEUE_TERRITORY_ALIGNMENT_MISSING");
  add(errors, bundle.queue.entries[0]?.knowledgeNodeId !== "noxia:knowledge-catalog:domain:t2-mapping", "P10_NEXT_DOMAIN_NON_DETERMINISTIC", { actual: bundle.queue.entries[0]?.knowledgeNodeId });
  add(errors, bundle.queue.entries.some((item, index) => item.rank !== index + 1), "P10_QUEUE_RANK_INVALID");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), entries: bundle.queue.entries.length, next: bundle.queue.entries[0] ?? null });
};

export const validateProtectedScientificSurfaces = ({ bundle, root = process.cwd(), inspectGit = true } = {}) => {
  const errors = [];
  for (const [field, value] of Object.entries(bundle.protectedSurfaces)) add(errors, value !== 0, "P10_PROTECTED_SURFACE_MUTATION_RECORDED", { field, value });
  for (const projection of bundle.officialCorpus.projections) for (const [field, expected] of Object.entries(P10_PUBLICATION_GUARDS)) add(errors, projection[field] !== expected, "P10_PROJECTION_PUBLICATION_GUARD_INVALID", { projectionId: projection.projectionId, field });
  const protectedSurfaces = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  add(errors, !protectedSurfaces.protectedSurfacesUnchanged, "P10_PROTECTED_SURFACE_CHANGED", { changes: protectedSurfaces.protectedChanges });
  add(errors, !protectedSurfaces.editorialEngineUnchanged, "P10_EDITORIAL_ENGINE_CHANGED", { changes: protectedSurfaces.editorialEngine?.changed });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), protectedSurfaces });
};

export const validateTerritorialScientificProduction = ({ bundle, baselineCatalog, territoryModel, root = process.cwd(), inspectGit = true } = {}) => {
  const layers = Object.freeze({
    preparedPackage: validatePreparedScientificPackage({ bundle }),
    territory: validateScientificTerritoryAlignment({ bundle, territoryModel }),
    sources: validateScientificCampaignSources({ bundle }),
    candidates: validateScientificCampaignCandidates({ bundle }),
    manifest: validateScientificCampaignManifest({ bundle, territoryModel }),
    execution: validateScientificCampaignExecution({ bundle, baselineCatalog }),
    replay: validateScientificCampaignReplay({ bundle }),
    rollback: validateScientificCampaignRollback({ bundle, baselineCatalog }),
    coverage: validateScientificCoverage({ bundle }),
    readiness: validateScientificReadiness({ bundle }),
    queue: validateScientificQueue({ bundle }),
    protectedSurfaces: validateProtectedScientificSurfaces({ bundle, root, inspectGit }),
  });
  const errors = Object.entries(layers).flatMap(([layer, result]) => result.errors.map((error) => ({ layer, ...error })));
  return Object.freeze({ valid: errors.length === 0, version: "P10_TERRITORY_DRIVEN_CONTINUOUS_SCIENTIFIC_PRODUCTION", errors: Object.freeze(errors), layers, counts: Object.freeze({ preparedObjects: bundle.preparedPackage.inventory.counts.total, requalificationDecisions: bundle.requalificationRegistry.decisions.length, sourcesAdded: bundle.officialCorpus.sources.length, conceptsAdded: bundle.officialCorpus.concepts.length, assertionsAdded: bundle.officialCorpus.assertions.length, evidenceLinksAdded: bundle.officialCorpus.evidenceLinks.length, synthesesAdded: bundle.officialCorpus.syntheses.length, internalProjectionsAdded: bundle.officialCorpus.projections.length, campaignsExecuted: bundle.execution.executedCampaigns, campaignsQueued: bundle.queue.entries.length }) });
};

export const validateScientificCampaignCandidatesForP10 = validateScientificCampaignCandidates;
