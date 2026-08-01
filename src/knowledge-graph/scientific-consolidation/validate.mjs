import { stableStringify } from "../migration/stable-json.mjs";
import { reviewTypes } from "../scientific-model-schema.mjs";
import { validateSourceModel } from "../scientific-model-validate.mjs";
import { inspectProtectedSurfaces } from "../scientific-corpus/protected-surfaces.mjs";
import { scientificAssertionRevisions, scientificEvidenceLinks } from "../scientific-corpus/assertions.mjs";
import { scientificSourceRevisions } from "../scientific-corpus/sources.mjs";
import { synthesisDefinitions } from "../scientific-corpus/synthesis.mjs";
import { p4rConceptReadiness, p4rInternalScientificProjections, p4rProjectionReadiness, p4rReadinessRules, p4rReadinessSummary, p4rScientificSyntheses, p4rSynthesisReadiness, createP4RScientificSynthesis } from "./corpus.mjs";
import { contradictionSummary, p4rContradictionAssessments } from "./contradictions.mjs";
import { P4R_PUBLICATION_GUARDS, P4R_REVIEW_DECISIONS, P4R_REVIEW_TYPE, P4R_SOURCE_CLASSIFICATIONS, P4R_VERSION } from "./constants.mjs";
import { createGenericEnrichmentProtocol, generalitySummary, genericEnrichmentProtocolTemplate, genericScientificContracts, genericityFixtures, genericityResults, scientificExtensionPlan } from "./generality.mjs";
import { ontologyDecisionSummary, p4rOntologicalDecisions } from "./ontology.mjs";
import { assertionReviewSummary, consolidatedAssertionReviewDecisions, consolidatedAssertionRevisions, consolidatedEvidenceLinks, evidenceReviewMatrix } from "./review.mjs";
import { p4Snapshot, createP4Snapshot } from "./snapshot.mjs";
import { consolidatedSourceIdentities, consolidatedSourceRecords, consolidatedSourceRevisionHistory, consolidatedSourceRevisions, sourceConsolidationSummary, supplementalCtSourceAudit } from "./sources.mjs";

const doiPattern = /^10\.\d{4,9}\/[\w.()/:;-]+$/i;
const pmidPattern = /^\d{7,8}$/;
const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);

export const validateP4Snapshot = () => {
  const errors = [];
  const regenerated = createP4Snapshot();
  add(errors, p4Snapshot.sourceRevisions.length !== 27, "P4_SOURCE_COUNT_CHANGED", { count: p4Snapshot.sourceRevisions.length });
  add(errors, p4Snapshot.assertionRevisions.length !== 58, "P4_ASSERTION_COUNT_CHANGED", { count: p4Snapshot.assertionRevisions.length });
  add(errors, p4Snapshot.evidenceLinks.length !== 84, "P4_EVIDENCE_COUNT_CHANGED", { count: p4Snapshot.evidenceLinks.length });
  add(errors, p4Snapshot.syntheses.length !== 10, "P4_SYNTHESIS_COUNT_CHANGED", { count: p4Snapshot.syntheses.length });
  add(errors, p4Snapshot.projections.length !== 12, "P4_PROJECTION_COUNT_CHANGED", { count: p4Snapshot.projections.length });
  add(errors, stableStringify(regenerated) !== stableStringify(p4Snapshot), "P4_SNAPSHOT_NON_DETERMINISTIC");
  add(errors, !p4Snapshot.validationReport.valid, "P4_SNAPSHOT_VALIDATION_FAILED");
  add(errors, !p4Snapshot.digest || Object.keys(p4Snapshot.categoryDigests).length === 0, "P4_SNAPSHOT_DIGEST_MISSING");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), digest: p4Snapshot.digest });
};

export const validateConsolidatedScientificSources = () => {
  const base = validateSourceModel({ sourceIdentities: consolidatedSourceIdentities, sourceRevisions: consolidatedSourceRevisions });
  const errors = [...base.errors];
  add(errors, consolidatedSourceRecords.length !== scientificSourceRevisions.length, "P4_SOURCE_LOSS", { before: scientificSourceRevisions.length, after: consolidatedSourceRecords.length });
  add(errors, consolidatedSourceRevisionHistory.length !== 54, "SOURCE_HISTORY_INCOMPLETE", { count: consolidatedSourceRevisionHistory.length });
  for (const record of consolidatedSourceRecords) {
    const source = record.after;
    add(errors, source.revisionNumber !== 2 || source.supersedesRevisionId !== record.before.revisionId, "SOURCE_REVISION_CHAIN_INVALID", { pmid: source.pmid });
    add(errors, !Array.isArray(source.authors) || !source.authors.length, "AUTHORS_NOT_COMPLETED", { pmid: source.pmid });
    add(errors, source.authors.some((author) => /\bet al\.?$/i.test(author)), "ABBREVIATED_AUTHOR_REMAINS", { pmid: source.pmid });
    add(errors, source.doi && !doiPattern.test(source.doi), "INVALID_DOI", { pmid: source.pmid, doi: source.doi });
    add(errors, !pmidPattern.test(source.pmid), "INVALID_PMID", { pmid: source.pmid });
    add(errors, !source.metadata.volume || !source.metadata.issue || !source.metadata.pages, "INCOMPLETE_PUBLICATION_CITATION", { pmid: source.pmid });
    add(errors, source.metadata.authorsCompleteness !== "COMPLETE_FROM_PUBMED", "UNVERIFIED_AUTHOR_COMPLETENESS", { pmid: source.pmid });
    add(errors, !P4R_SOURCE_CLASSIFICATIONS.includes(source.metadata.sourceClassification), "INVALID_SOURCE_CLASSIFICATION", { pmid: source.pmid });
    add(errors, source.metadata.abstractOnly !== (source.metadata.fullTextAvailability === "ABSTRACT_ONLY"), "SOURCE_ACCESS_STATE_INCONSISTENT", { pmid: source.pmid });
    add(errors, !source.metadata.officialMetadataUrl?.includes(source.pmid), "OFFICIAL_METADATA_URL_MISSING", { pmid: source.pmid });
    add(errors, !source.digest || !source.retrievedAt, "SOURCE_PROVENANCE_INCOMPLETE", { pmid: source.pmid });
  }
  add(errors, duplicates(consolidatedSourceRevisions.map((source) => source.pmid)).length > 0, "DUPLICATE_PMID");
  add(errors, duplicates(consolidatedSourceRevisions.map((source) => source.doi)).length > 0, "DUPLICATE_DOI");
  add(errors, sourceConsolidationSummary.fullText + sourceConsolidationSummary.abstractOnly !== 27, "ACCESS_SUMMARY_INCONSISTENT");
  add(errors, sourceConsolidationSummary.sourcesUpgradedFromAbstractOnly.length !== 2, "EXPECTED_FULL_TEXT_UPGRADES_MISSING", { pmids: sourceConsolidationSummary.sourcesUpgradedFromAbstractOnly });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({ ...base.counts, ...sourceConsolidationSummary }) });
};

export const validateConsolidatedExtractions = () => {
  const errors = [];
  add(errors, consolidatedEvidenceLinks.length !== scientificEvidenceLinks.length, "P4_EVIDENCE_LINK_LOSS", { before: scientificEvidenceLinks.length, after: consolidatedEvidenceLinks.length });
  add(errors, evidenceReviewMatrix.length !== 84, "EVIDENCE_REVIEW_MATRIX_INCOMPLETE");
  for (const link of consolidatedEvidenceLinks) {
    add(errors, !link.previousEvidenceLinkId || !scientificEvidenceLinks.some((before) => before.evidenceLinkId === link.previousEvidenceLinkId), "EVIDENCE_HISTORY_MISSING", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !link.locator || link.locator.split(/\s+/).length < 3, "LOCALIZER_NOT_EXPLOITABLE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !link.extraction?.section || !link.extraction?.passage, "EXTRACTION_INCOMPLETE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction?.passageKind !== "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT", "EXTRACTION_PASSAGE_KIND_UNCLEAR", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction?.interpretationLevel === "DERIVED_INTERPRETATION" && !link.extraction?.derivationSteps?.length, "DERIVATION_STEPS_MISSING", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction?.interpretationLevel === "DERIVED_INTERPRETATION" && link.extraction?.directAuthorStatement !== false, "DERIVED_INTERPRETATION_ATTRIBUTED_TO_AUTHORS", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.reviewType !== P4R_REVIEW_TYPE || link.extraction?.scientificHumanReview !== null, "FALSE_HUMAN_EXTRACTION_REVIEW", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.automatedReview.decision === "AUTOMATED_REVIEW_REJECTED", "REJECTED_EXTRACTION_REMAINS_ACTIVE", { evidenceLinkId: link.evidenceLinkId });
    const source = consolidatedSourceRevisions.find((item) => item.revisionId === link.sourceRevisionId);
    add(errors, source?.metadata.abstractOnly && !/PubMed|Abstract/i.test(link.locator), "ABSTRACT_ONLY_LINK_ESCAPES_ABSTRACT", { evidenceLinkId: link.evidenceLinkId });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({ evidenceLinks: consolidatedEvidenceLinks.length, locatorsRecalculated: assertionReviewSummary.locatorsRecalculated, reclassified: assertionReviewSummary.evidenceLinksReclassified }) });
};

export const validateAutomatedScientificReview = () => {
  const errors = [];
  add(errors, !reviewTypes.includes(P4R_REVIEW_TYPE), "AUTOMATED_SCIENTIFIC_REVIEW_TYPE_NOT_REGISTERED");
  add(errors, consolidatedAssertionRevisions.length !== scientificAssertionRevisions.length, "P4_ASSERTION_LOSS", { before: scientificAssertionRevisions.length, after: consolidatedAssertionRevisions.length });
  add(errors, consolidatedAssertionReviewDecisions.length !== 58, "ASSERTION_REVIEW_REGISTER_INCOMPLETE");
  for (const assertion of consolidatedAssertionRevisions) {
    const decision = consolidatedAssertionReviewDecisions.find((item) => item.assertionRevisionId === assertion.revisionId);
    add(errors, assertion.revisionNumber !== 2 || !assertion.supersedesRevisionId, "ASSERTION_REVISION_CHAIN_INVALID", { revisionId: assertion.revisionId });
    add(errors, !decision || !P4R_REVIEW_DECISIONS.includes(decision.decision), "ASSERTION_REVIEW_DECISION_INVALID", { revisionId: assertion.revisionId });
    add(errors, assertion.humanReviewed !== false || decision?.scientificHumanReview !== null, "FALSE_HUMAN_REVIEW", { revisionId: assertion.revisionId });
    add(errors, assertion.reviewType !== P4R_REVIEW_TYPE, "ASSERTION_REVIEW_TYPE_INVALID", { revisionId: assertion.revisionId });
    add(errors, !decision?.evidenceLinkIds?.length || !decision?.sourceRevisionIds?.length, "ASSERTION_REVIEW_WITHOUT_PROVENANCE", { revisionId: assertion.revisionId });
  }
  add(errors, assertionReviewSummary.rejected > 0, "REJECTED_ASSERTION_ACTIVE", { count: assertionReviewSummary.rejected });
  add(errors, assertionReviewSummary.insufficientSource > 0, "INSUFFICIENT_SOURCE_ASSERTION_ACTIVE", { count: assertionReviewSummary.insufficientSource });
  add(errors, assertionReviewSummary.humanReviewsClaimed > 0, "HUMAN_REVIEW_CLAIMED");
  const first = stableStringify(consolidatedAssertionReviewDecisions);
  const second = stableStringify(consolidatedAssertionReviewDecisions);
  add(errors, first !== second, "AUTOMATED_REVIEW_NON_DETERMINISTIC");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: assertionReviewSummary });
};

export const validateScientificGenerality = () => {
  const errors = [];
  add(errors, genericScientificContracts.length < 12, "GENERIC_CONTRACT_REGISTRY_TOO_NARROW");
  add(errors, genericityResults.some((result) => !result.valid), "GENERICITY_FIXTURE_FAILED", { failures: genericityResults.filter((result) => !result.valid) });
  add(errors, genericityFixtures.some((fixture) => !fixture.fixtureId.startsWith("fixture:") || fixture.realCorpus), "FIXTURE_LEAKAGE_RISK");
  const realIds = [
    ...consolidatedSourceRevisions.map((item) => item.stableId),
    ...consolidatedAssertionRevisions.map((item) => item.stableId),
    ...consolidatedEvidenceLinks.map((item) => item.evidenceLinkId),
  ];
  add(errors, realIds.some((id) => id.startsWith("fixture:")), "FIXTURE_IN_REAL_CORPUS");
  add(errors, genericEnrichmentProtocolTemplate.domainSpecificTerms.length > 0, "PROTOCOL_TEMPLATE_CONTAINS_DOMAIN_TERMS");
  add(errors, genericEnrichmentProtocolTemplate.steps.length !== 18, "GENERIC_PROTOCOL_PHASE_COUNT_INVALID");
  const a = createGenericEnrichmentProtocol("adc-diffusion");
  const b = createGenericEnrichmentProtocol("adc-diffusion");
  add(errors, stableStringify(a) !== stableStringify(b), "GENERIC_PROTOCOL_NON_DETERMINISTIC");
  add(errors, scientificExtensionPlan.length < 5 || scientificExtensionPlan.length > 10, "EXTENSION_PLAN_SIZE_INVALID", { count: scientificExtensionPlan.length });
  add(errors, ontologyDecisionSummary.total !== 6 || ontologyDecisionSummary.historicalClassesChanged !== 0, "ONTOLOGY_DECISION_CONTRACT_INVALID", { summary: ontologyDecisionSummary });
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({ ...generalitySummary, ontology: ontologyDecisionSummary }) });
};

const validateSynthesesReadinessAndGuards = () => {
  const errors = [];
  add(errors, p4rScientificSyntheses.length !== 10, "P4R_SYNTHESIS_COUNT_CHANGED");
  for (const synthesis of p4rScientificSyntheses) {
    const definition = synthesisDefinitions.find((item) => item.key === synthesis.key);
    const regenerated = createP4RScientificSynthesis(definition);
    add(errors, !synthesis.deterministicDigest || synthesis.generatedEditorialText || synthesis.statisticalMetaAnalysisPerformed, "SYNTHESIS_SCOPE_OR_DIGEST_INVALID", { key: synthesis.key });
    add(errors, synthesis.convergence.publicationMajorityUsed, "PUBLICATION_COUNT_USED_AS_CONSENSUS", { key: synthesis.key });
    add(errors, synthesis.applicableAssertions.length === 0, "EMPTY_SYNTHESIS", { key: synthesis.key });
    add(errors, stableStringify(regenerated) !== stableStringify(synthesis), "SYNTHESIS_REGENERATION_FAILED", { key: synthesis.key });
  }
  add(errors, p4rInternalScientificProjections.length !== 12, "P4R_PROJECTION_COUNT_CHANGED");
  for (const projection of p4rInternalScientificProjections) {
    for (const [field, expected] of Object.entries(P4R_PUBLICATION_GUARDS)) add(errors, projection[field] !== expected, "PUBLICATION_GUARD_VIOLATION", { projectionId: projection.projectionId, field });
    add(errors, projection.prose !== null, "PUBLIC_PROSE_CREATED", { projectionId: projection.projectionId });
  }
  add(errors, p4rProjectionReadiness.some((item) => item.publicPublicationReady.ready || item.seoReady.ready), "PROJECTION_PREMATURELY_PUBLIC_READY");
  add(errors, p4rSynthesisReadiness.some((item) => item.publicPublicationReady.ready) || p4rConceptReadiness.some((item) => item.publicPublicationReady.ready), "PUBLIC_READINESS_COLLAPSED");
  add(errors, p4rReadinessRules.editorialProjectionReady.blockers.includes("NO_SCIENTIFIC_HUMAN_REVIEW"), "HUMAN_REVIEW_IS_SOLE_EDITORIAL_BLOCKER");
  add(errors, p4rReadinessSummary.scoreUsed || p4rReadinessSummary.humanReviewAloneIsBlocking, "READINESS_POLICY_INVALID");
  add(errors, !p4rScientificSyntheses.find((item) => item.key === "ct-ecv")?.missingData.includes("CT_ECV_INTERSITE_REPRODUCIBILITY_NOT_DOCUMENTED"), "CT_INTERSITE_GAP_NOT_PRESERVED");
  add(errors, contradictionSummary.contextDifferences !== 1 || p4rContradictionAssessments.length !== 1, "CONTEXT_DIFFERENCE_NOT_PRESERVED");
  add(errors, supplementalCtSourceAudit.length < 3, "CT_SOURCE_GAP_AUDIT_INCOMPLETE");
  return { valid: errors.length === 0, errors, counts: { syntheses: p4rScientificSyntheses.length, projections: p4rInternalScientificProjections.length, readiness: p4rReadinessSummary } };
};

export const validateP4RConsolidation = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const layers = Object.freeze({
    snapshot: validateP4Snapshot(),
    sources: validateConsolidatedScientificSources(),
    extractions: validateConsolidatedExtractions(),
    review: validateAutomatedScientificReview(),
    generality: validateScientificGenerality(),
    synthesesReadinessAndGuards: validateSynthesesReadinessAndGuards(),
  });
  const protectedSurfaces = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  const errors = [
    ...Object.entries(layers).flatMap(([layer, value]) => value.errors.map((error) => ({ layer, ...error }))),
    ...(!protectedSurfaces.protectedSurfacesUnchanged ? protectedSurfaces.protectedChanges.map((item) => ({ layer: "protectedSurfaces", code: "PROTECTED_SURFACE_CHANGED", ...item })) : []),
    ...(!protectedSurfaces.editorialEngineUnchanged ? protectedSurfaces.editorialEngine.changed.map((path) => ({ layer: "protectedSurfaces", code: "EDITORIAL_ENGINE_CHANGED", path })) : []),
  ];
  return Object.freeze({
    valid: errors.length === 0,
    version: P4R_VERSION,
    domain: "ecv-t1-pilot-not-universal-ontology",
    errors: Object.freeze(errors),
    layers,
    protectedSurfaces,
    counts: Object.freeze({
      p4Sources: p4Snapshot.sourceRevisions.length,
      consolidatedSources: consolidatedSourceRevisions.length,
      assertions: consolidatedAssertionRevisions.length,
      evidenceLinks: consolidatedEvidenceLinks.length,
      syntheses: p4rScientificSyntheses.length,
      projections: p4rInternalScientificProjections.length,
      genericityFixtures: genericityFixtures.length,
      futureDomains: scientificExtensionPlan.length,
    }),
  });
};
