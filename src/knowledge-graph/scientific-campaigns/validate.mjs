import { stableStringify } from "../migration/stable-json.mjs";
import { inspectProtectedSurfaces } from "../scientific-corpus/protected-surfaces.mjs";
import { buildScientificEnrichmentCampaigns } from "../knowledge-catalog/campaign-engine.mjs";
import { scientificKnowledgeCatalog, p6ScientificKnowledgeCatalog } from "../knowledge-catalog/catalog-builder.mjs";
import { KNOWLEDGE_NODE_TYPES } from "../knowledge-catalog/constants.mjs";
import { automaticCampaignExecutionTrace, createAutomaticCampaignExecutionTrace, selectFirstUnexecutedScientificCampaign } from "./execution.mjs";
import {
  AUTOMATIC_CAMPAIGN_ID,
  AUTOMATIC_CAMPAIGN_NODE_ID,
  CAMPAIGN_PUBLICATION_GUARDS,
  hepaticImagingAssertionRevisions,
  hepaticImagingApplicabilityContexts,
  hepaticImagingCampaignExecution,
  hepaticImagingConcepts,
  hepaticImagingContextDifferences,
  hepaticImagingEvidenceLinks,
  hepaticImagingInternalProjections,
  hepaticImagingReviewDecisions,
  hepaticImagingScientificSyntheses,
  hepaticImagingSourceRevisions,
  rejectedHepaticImagingSources,
} from "./hepatic-imaging.mjs";

const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);

export const validateAutomaticScientificCampaign = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const errors = [];
  const selected = selectFirstUnexecutedScientificCampaign();
  const beforeNode = p6ScientificKnowledgeCatalog.nodes.find((node) => node.nodeId === AUTOMATIC_CAMPAIGN_NODE_ID);
  const afterNode = scientificKnowledgeCatalog.nodes.find((node) => node.nodeId === AUTOMATIC_CAMPAIGN_NODE_ID);
  const sourceIds = new Set(hepaticImagingSourceRevisions.map((item) => item.revisionId));
  const assertionIds = new Set(hepaticImagingAssertionRevisions.map((item) => item.revisionId));
  const beforeIds = new Set(p6ScientificKnowledgeCatalog.nodes.map((node) => node.nodeId));
  const afterIds = new Set(scientificKnowledgeCatalog.nodes.map((node) => node.nodeId));

  add(errors, p6ScientificKnowledgeCatalog.digest !== "503cd942c65888a4dd684f4cae8445940869152f7ce9fbdecab37f2e13e38bb5", "P6_BASELINE_DIGEST_CHANGED");
  add(errors, !selected || selected.campaignId !== AUTOMATIC_CAMPAIGN_ID, "FIRST_CAMPAIGN_SELECTION_INVALID", { selectedCampaignId: selected?.campaignId });
  add(errors, selected?.selectionRule.manualDomainSelection !== false, "MANUAL_DOMAIN_SELECTION_DETECTED");
  add(errors, stableStringify(buildScientificEnrichmentCampaigns(p6ScientificKnowledgeCatalog.nodes), 0) !== stableStringify(p6ScientificKnowledgeCatalog.campaigns, 0), "PRE_CAMPAIGN_PLANNING_NON_DETERMINISTIC");
  add(errors, selected?.nodeIds.length !== 1 || selected?.nodeIds[0] !== AUTOMATIC_CAMPAIGN_NODE_ID, "SELECTED_NODE_SET_CHANGED");
  add(errors, beforeNode?.blockingNodes.length !== 0 || beforeNode?.dependencies.length !== 0, "SELECTED_NODE_HAS_UNRESOLVED_DEPENDENCY");

  add(errors, hepaticImagingSourceRevisions.length !== 5 || rejectedHepaticImagingSources.length !== 3, "SOURCE_SELECTION_COUNT_INVALID");
  add(errors, duplicates(hepaticImagingSourceRevisions.map((item) => item.pmid)).length > 0, "DUPLICATE_CAMPAIGN_PMID");
  add(errors, duplicates(hepaticImagingSourceRevisions.map((item) => item.doi)).length > 0, "DUPLICATE_CAMPAIGN_DOI");
  for (const source of hepaticImagingSourceRevisions) {
    add(errors, !/^\d{7,8}$/.test(source.pmid), "INVALID_CAMPAIGN_PMID", { pmid: source.pmid });
    add(errors, !/^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(source.doi), "INVALID_CAMPAIGN_DOI", { pmid: source.pmid, doi: source.doi });
    add(errors, !source.pmcid || source.abstractOnly || source.fullTextAvailability !== "OFFICIAL_FULL_TEXT", "CAMPAIGN_SOURCE_NOT_OFFICIAL_FULL_TEXT", { pmid: source.pmid });
    add(errors, !source.authors.length || source.authors.some((author) => /^et al\.?$/i.test(author)), "CAMPAIGN_AUTHOR_LIST_INVALID", { pmid: source.pmid });
    add(errors, !hepaticImagingEvidenceLinks.some((link) => link.sourceRevisionId === source.revisionId), "CAMPAIGN_SOURCE_WITHOUT_ASSERTION", { pmid: source.pmid });
  }

  add(errors, hepaticImagingConcepts.length !== 15, "CAMPAIGN_CONCEPT_COUNT_INVALID");
  add(errors, duplicates(hepaticImagingConcepts.map((item) => item.stableId)).length > 0, "DUPLICATE_CAMPAIGN_CONCEPT_ID");
  for (const concept of hepaticImagingConcepts) {
    add(errors, !KNOWLEDGE_NODE_TYPES.includes(concept.ontologicalClass), "CAMPAIGN_CONCEPT_CLASS_INVALID", { stableId: concept.stableId, ontologicalClass: concept.ontologicalClass });
    add(errors, !concept.sourceRefs.length || concept.sourceRefs.some((sourceId) => !sourceIds.has(sourceId)), "CAMPAIGN_CONCEPT_SOURCE_INVALID", { stableId: concept.stableId });
    add(errors, concept.publicProjection, "CAMPAIGN_CONCEPT_PUBLIC");
  }

  add(errors, hepaticImagingAssertionRevisions.length !== 22 || hepaticImagingEvidenceLinks.length !== 22, "CAMPAIGN_ASSERTION_EVIDENCE_COUNT_INVALID");
  add(errors, hepaticImagingApplicabilityContexts.length !== hepaticImagingAssertionRevisions.length || duplicates(hepaticImagingApplicabilityContexts.map((item) => item.contextId)).length > 0, "CAMPAIGN_CONTEXT_REGISTER_INVALID");
  add(errors, hepaticImagingReviewDecisions.length !== hepaticImagingAssertionRevisions.length, "CAMPAIGN_REVIEW_REGISTER_INCOMPLETE");
  add(errors, duplicates(hepaticImagingAssertionRevisions.map((item) => item.revisionId)).length > 0, "DUPLICATE_CAMPAIGN_ASSERTION_ID");
  add(errors, duplicates(hepaticImagingEvidenceLinks.map((item) => item.evidenceLinkId)).length > 0, "DUPLICATE_CAMPAIGN_EVIDENCE_ID");
  for (const assertion of hepaticImagingAssertionRevisions) {
    const links = hepaticImagingEvidenceLinks.filter((link) => link.assertionRevisionId === assertion.revisionId);
    add(errors, assertion.statement.atomicConclusionCount !== 1, "CAMPAIGN_ASSERTION_NOT_ATOMIC", { revisionId: assertion.revisionId });
    add(errors, !assertion.sourceRefs.length || assertion.sourceRefs.some((sourceId) => !sourceIds.has(sourceId)), "CAMPAIGN_ASSERTION_SOURCE_INVALID", { revisionId: assertion.revisionId });
    add(errors, links.length === 0 || links.every((link) => link.relationType === "MENTIONS"), "CAMPAIGN_ASSERTION_WITHOUT_EVIDENCE", { revisionId: assertion.revisionId });
    add(errors, assertion.humanReviewed || assertion.scientificHumanReview !== null, "FALSE_CAMPAIGN_HUMAN_REVIEW", { revisionId: assertion.revisionId });
    add(errors, assertion.facets.manufacturers.length > 0 || assertion.facets.software.length > 0, "UNSOURCED_PLATFORM_CONTEXT_INFERRED", { revisionId: assertion.revisionId });
  }
  for (const link of hepaticImagingEvidenceLinks) {
    add(errors, !sourceIds.has(link.sourceRevisionId) || !assertionIds.has(link.assertionRevisionId), "CAMPAIGN_EVIDENCE_ENDPOINT_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !["SUPPORTS", "QUALIFIES"].includes(link.relationType), "CAMPAIGN_EVIDENCE_RELATION_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !/^PMC\d+ — .+/.test(link.locator) || !link.extraction?.section || !link.extraction?.passage, "CAMPAIGN_EVIDENCE_LOCATOR_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction.passageKind !== "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT", "CAMPAIGN_EXTRACTION_KIND_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.scientificHumanReview !== null, "FALSE_CAMPAIGN_EVIDENCE_HUMAN_REVIEW", { evidenceLinkId: link.evidenceLinkId });
  }

  add(errors, hepaticImagingContextDifferences.length !== 2 || hepaticImagingContextDifferences.some((item) => item.resolutionApplied), "CAMPAIGN_CONTEXT_DIFFERENCES_NOT_PRESERVED");
  add(errors, hepaticImagingContextDifferences.some((item) => !["CONTEXT_DIFFERENCE", "DEFINITION_DIFFERENCE"].includes(item.classification)), "CAMPAIGN_FALSE_CONTRADICTION");
  add(errors, hepaticImagingScientificSyntheses.length !== 5 || hepaticImagingScientificSyntheses.some((item) => item.generatedEditorialText || item.statisticalMetaAnalysisPerformed || item.prose !== null), "CAMPAIGN_SYNTHESIS_SCOPE_INVALID");
  add(errors, hepaticImagingInternalProjections.length !== 4, "CAMPAIGN_INTERNAL_PROJECTION_COUNT_INVALID");
  for (const projection of hepaticImagingInternalProjections) {
    for (const [field, expected] of Object.entries(CAMPAIGN_PUBLICATION_GUARDS)) add(errors, projection[field] !== expected, "CAMPAIGN_PROJECTION_GUARD_VIOLATION", { projectionId: projection.projectionId, field });
  }

  add(errors, [...beforeIds].some((nodeId) => !afterIds.has(nodeId)), "PREVIOUS_KNOWLEDGE_NODE_LOST");
  add(errors, scientificKnowledgeCatalog.sourceBaselines.historicalConcepts !== 118 || scientificKnowledgeCatalog.sourceBaselines.p4rConcepts !== 42 || scientificKnowledgeCatalog.sourceBaselines.p5Concepts !== 60, "P4R_P5_BASELINE_CHANGED");
  add(errors, scientificKnowledgeCatalog.campaignExecutions.length !== 1 || scientificKnowledgeCatalog.campaignExecutions[0].campaignId !== AUTOMATIC_CAMPAIGN_ID, "CAMPAIGN_EXECUTION_REGISTRY_INVALID");
  add(errors, scientificKnowledgeCatalog.campaigns.some((campaign) => campaign.campaignId === AUTOMATIC_CAMPAIGN_ID), "EXECUTED_CAMPAIGN_REPLANNED");
  add(errors, scientificKnowledgeCatalog.campaigns.length !== 9, "NEXT_CAMPAIGN_COUNT_INVALID");
  add(errors, afterNode?.sourceCoverage.ratio !== 1 || afterNode?.assertionCoverage.ratio !== 1 || !afterNode?.coverage.complete, "CAMPAIGN_COVERAGE_TARGET_NOT_REACHED");
  add(errors, afterNode?.status !== "PROJECTED" || !afterNode?.readiness.scientificReady.ready || !afterNode?.readiness.provenanceReady.ready || !afterNode?.readiness.synthesisReady.ready || !afterNode?.readiness.editorialProjectionReady.ready, "CAMPAIGN_READINESS_INVALID");
  add(errors, afterNode?.readiness.publicPublicationReady.ready || afterNode?.readiness.seoReady.ready || afterNode?.metrics.publicPageCount !== 0, "CAMPAIGN_PUBLIC_READINESS_ENABLED");
  add(errors, hepaticImagingCampaignExecution.nextCampaignStarted || hepaticImagingCampaignExecution.publicationAuthorized || hepaticImagingCampaignExecution.manualDomainSelection, "CAMPAIGN_EXECUTION_SCOPE_VIOLATION");
  add(errors, stableStringify(createAutomaticCampaignExecutionTrace(), 0) !== stableStringify(automaticCampaignExecutionTrace, 0), "CAMPAIGN_TRACE_NON_DETERMINISTIC");
  add(errors, automaticCampaignExecutionTrace.selection.selectionDigest !== automaticCampaignExecutionTrace.digests.selection || automaticCampaignExecutionTrace.after.nextCampaignStarted, "CAMPAIGN_TRACE_INVALID");

  const protectedSurfaces = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  add(errors, !protectedSurfaces.protectedSurfacesUnchanged, "PROTECTED_SURFACE_CHANGED", { changes: protectedSurfaces.protectedChanges });
  add(errors, !protectedSurfaces.editorialEngineUnchanged, "EDITORIAL_ENGINE_CHANGED", { changes: protectedSurfaces.editorialEngine?.changed });

  return Object.freeze({
    valid: errors.length === 0,
    version: "P7_FIRST_AUTOMATIC_SCIENTIFIC_CAMPAIGN",
    errors: Object.freeze(errors),
    protectedSurfaces,
    selection: selected,
    beforeNode,
    afterNode,
    trace: automaticCampaignExecutionTrace,
    counts: Object.freeze({
      sourcesExamined: hepaticImagingSourceRevisions.length + rejectedHepaticImagingSources.length,
      sourcesRetained: hepaticImagingSourceRevisions.length,
      sourcesRejected: rejectedHepaticImagingSources.length,
      concepts: hepaticImagingConcepts.length,
      assertions: hepaticImagingAssertionRevisions.length,
      contexts: hepaticImagingApplicabilityContexts.length,
      evidenceLinks: hepaticImagingEvidenceLinks.length,
      supports: hepaticImagingEvidenceLinks.filter((link) => link.relationType === "SUPPORTS").length,
      qualifies: hepaticImagingEvidenceLinks.filter((link) => link.relationType === "QUALIFIES").length,
      contextualDifferences: hepaticImagingContextDifferences.length,
      syntheses: hepaticImagingScientificSyntheses.length,
      internalProjections: hepaticImagingInternalProjections.length,
      remainingCampaigns: scientificKnowledgeCatalog.campaigns.length,
    }),
  });
};
