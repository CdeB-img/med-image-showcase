import { stableStringify } from "../migration/stable-json.mjs";
import { inspectProtectedSurfaces } from "../scientific-corpus/protected-surfaces.mjs";
import { multidomainAssertionRevisions, multidomainAssertionReviewDecisions, multidomainEvidenceLinks } from "./assertions.mjs";
import { createP4RBaselineSnapshot, p4rBaselineSnapshot } from "./baseline.mjs";
import { conceptByKey, multidomainConcepts, multidomainConceptSummary, multidomainOntologicalDecisions } from "./concepts.mjs";
import { multidomainContradictionAssessments } from "./contradictions.mjs";
import { P5_DOMAIN_IDS, P5_EVIDENCE_RELATIONS, P5_PUBLICATION_GUARDS, P5_REVIEW_DECISIONS, P5_REVIEW_TYPE } from "./constants.mjs";
import { confirmedGenericInvariants, genericContractModifications, nextScientificWaves, p5DomainSpecificExtensions, p5GeneralitySummary, residualEcvBiasAudit } from "./generality.mjs";
import { manifestByDomainId, scientificDomainManifests } from "./manifests.mjs";
import { contextualThresholdRecords, metrologyDistinctions, multidomainMeasurementRecords } from "./measurements.mjs";
import { multidomainInternalProjections } from "./projections.mjs";
import { executeMandatoryMultidomainQueries, queryScientificMultidomain } from "./query.mjs";
import { multidomainDomainReadiness, multidomainProjectionReadiness, multidomainReadinessSummary } from "./readiness.mjs";
import { multidomainSourceRevisions, multidomainSourceSummary, rejectedMultidomainSources } from "./sources.mjs";
import { createMultidomainSynthesis, multidomainScientificSyntheses, multidomainSynthesisDefinitions } from "./synthesis.mjs";

const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const sourceIds = new Set(multidomainSourceRevisions.map((item) => item.revisionId));
const assertionIds = new Set(multidomainAssertionRevisions.map((item) => item.revisionId));
const byDomainCount = (items, domainId) => items.filter((item) => item.domainId === domainId).length;

export const validateP4RBaselineForP5 = () => {
  const errors = [];
  const regenerated = createP4RBaselineSnapshot();
  const expected = p4rBaselineSnapshot.expectedCounts;
  add(errors, !p4rBaselineSnapshot.validation.valid, "P4R_BASELINE_VALIDATION_FAILED");
  add(errors, p4rBaselineSnapshot.sourceRevisions.length !== expected.sources, "P4R_SOURCE_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.sourceRevisions.filter((item) => !item.metadata.abstractOnly).length !== expected.fullTextSources, "P4R_FULL_TEXT_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.assertionRevisions.length !== expected.assertions, "P4R_ASSERTION_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.evidenceLinks.length !== expected.evidenceLinks, "P4R_EVIDENCE_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.syntheses.length !== expected.syntheses, "P4R_SYNTHESIS_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.projections.length !== expected.projections, "P4R_PROJECTION_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.genericContracts.length !== expected.genericContracts, "P4R_GENERIC_CONTRACT_COUNT_CHANGED");
  add(errors, p4rBaselineSnapshot.isolatedGenericityFixtures.length !== expected.genericityFixtures, "P4R_FIXTURE_COUNT_CHANGED");
  add(errors, stableStringify(regenerated) !== stableStringify(p4rBaselineSnapshot), "P4R_BASELINE_NON_DETERMINISTIC");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), digest: p4rBaselineSnapshot.digest, counts: expected });
};

export const validateScientificDomains = () => {
  const errors = [];
  add(errors, scientificDomainManifests.length !== 4, "DOMAIN_MANIFEST_COUNT_INVALID");
  add(errors, duplicates(scientificDomainManifests.map((item) => item.domainId)).length > 0, "DUPLICATE_DOMAIN_ID");
  for (const domainId of P5_DOMAIN_IDS) {
    const manifest = manifestByDomainId[domainId];
    add(errors, !manifest, "DOMAIN_MANIFEST_MISSING", { domainId });
    if (!manifest) continue;
    add(errors, manifest.ecvT1Dependency || /hematocrit|molli|sasha|ecv formula/i.test(JSON.stringify(manifest)), "ECV_T1_DEPENDENCY_IN_MANIFEST", { domainId });
    add(errors, manifest.expectedSyntheses.length < 3 || manifest.expectedInternalProjections.length < 2, "DOMAIN_COMPETENCY_CONTRACT_INCOMPLETE", { domainId });
    add(errors, !manifest.coreConcepts.length || !manifest.boundaryConcepts.length || !manifest.exclusions.length, "DOMAIN_BOUNDARY_INCOMPLETE", { domainId });
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({ manifests: scientificDomainManifests.length }) });
};

const validateSources = () => {
  const errors = [];
  add(errors, multidomainSourceSummary.externalExamined < 50 || multidomainSourceSummary.externalExamined > 100, "SOURCE_AUDIT_RANGE_INVALID");
  add(errors, multidomainSourceRevisions.length !== 38 || rejectedMultidomainSources.length !== 14, "SOURCE_SELECTION_COUNTS_CHANGED");
  add(errors, multidomainSourceSummary.fullText !== 29 || multidomainSourceSummary.abstractOnly !== 9, "SOURCE_ACCESS_COUNTS_CHANGED");
  add(errors, duplicates(multidomainSourceRevisions.map((item) => item.pmid)).length > 0, "DUPLICATE_PMID");
  add(errors, duplicates(multidomainSourceRevisions.map((item) => item.doi)).length > 0, "DUPLICATE_DOI");
  for (const source of multidomainSourceRevisions) {
    add(errors, !/^\d{7,8}$/.test(source.pmid), "INVALID_PMID", { pmid: source.pmid });
    add(errors, !/^10\.\d{4,9}\/[\w.()/:;-]+$/i.test(source.doi), "INVALID_DOI", { pmid: source.pmid, doi: source.doi });
    add(errors, !source.authors.length || source.authors.some((author) => /^et al\.?$/i.test(author)), "AUTHOR_LIST_INVALID", { pmid: source.pmid });
    add(errors, source.abstractOnly !== !source.pmcid || source.abstractOnly !== (source.fullTextAvailability === "ABSTRACT_ONLY"), "SOURCE_ACCESS_INCONSISTENT", { pmid: source.pmid });
    add(errors, !source.officialMetadataUrl.includes(source.pmid) || !source.digest, "SOURCE_PROVENANCE_INCOMPLETE", { pmid: source.pmid });
    add(errors, !multidomainEvidenceLinks.some((link) => link.sourceRevisionId === source.revisionId), "RETAINED_SOURCE_WITHOUT_ASSERTION", { pmid: source.pmid });
  }
  return { valid: errors.length === 0, errors, counts: multidomainSourceSummary };
};

const validateConcepts = () => {
  const errors = [];
  add(errors, multidomainConcepts.length !== 60, "CONCEPT_COUNT_CHANGED");
  add(errors, duplicates(multidomainConcepts.map((item) => item.stableId)).length > 0, "DUPLICATE_CONCEPT_ID");
  for (const domainId of P5_DOMAIN_IDS) add(errors, byDomainCount(multidomainConcepts, domainId) !== 15, "DOMAIN_CONCEPT_COUNT_CHANGED", { domainId, count: byDomainCount(multidomainConcepts, domainId) });
  for (const concept of multidomainConcepts) {
    add(errors, !concept.roles.length || !concept.preferredLabel || !concept.description, "CONCEPT_INCOMPLETE", { stableId: concept.stableId });
    add(errors, !concept.sourceRefs.length || concept.sourceRefs.some((id) => !sourceIds.has(id)), "CONCEPT_SOURCE_INVALID", { stableId: concept.stableId });
    add(errors, concept.publicProjection, "CONCEPT_PUBLIC_PROJECTION_ENABLED", { stableId: concept.stableId });
  }
  add(errors, multidomainOntologicalDecisions.some((item) => item.historicalClassChanged), "HISTORICAL_CLASSIFICATION_CHANGED");
  add(errors, conceptByKey.dwi.roles.includes("DerivedMeasurement") || conceptByKey["adc-value"].roles.includes("AcquisitionMethod"), "DWI_ADC_COLLAPSED");
  add(errors, conceptByKey["diffusion-restriction"].roles.includes("DerivedMeasurement"), "ADC_FINDING_COLLAPSED");
  add(errors, conceptByKey.tmax.stableId === conceptByKey.cbf.stableId || conceptByKey.cbf.stableId === conceptByKey.cbv.stableId, "PERFUSION_PARAMETERS_COLLAPSED");
  add(errors, conceptByKey["lge-finding"].stableId === conceptByKey["microvascular-obstruction"].stableId || conceptByKey["microvascular-obstruction"].stableId === conceptByKey["intramyocardial-hemorrhage"].stableId, "CARDIAC_FINDINGS_COLLAPSED");
  add(errors, !conceptByKey.psir.roles.includes("ReconstructionMethod"), "PSIR_CLASSIFICATION_INVALID");
  add(errors, conceptByKey["spectral-ct"].stableId === conceptByKey["photon-counting-ct"].stableId, "SPECTRAL_PCCT_COLLAPSED");
  add(errors, conceptByKey["iodine-map"].stableId.includes("ecv"), "IODINE_MAP_COLLAPSED_WITH_CTECV");
  return { valid: errors.length === 0, errors, counts: multidomainConceptSummary };
};

const validateAssertionsAndEvidence = () => {
  const errors = [];
  add(errors, multidomainAssertionRevisions.length < 80 || multidomainAssertionRevisions.length > 180, "ASSERTION_COUNT_OUTSIDE_TARGET");
  add(errors, duplicates(multidomainAssertionRevisions.map((item) => item.stableId)).length > 0, "DUPLICATE_ASSERTION_ID");
  add(errors, duplicates(multidomainEvidenceLinks.map((item) => item.evidenceLinkId)).length > 0, "DUPLICATE_EVIDENCE_ID");
  add(errors, multidomainAssertionReviewDecisions.length !== multidomainAssertionRevisions.length, "REVIEW_REGISTER_INCOMPLETE");
  for (const domainId of P5_DOMAIN_IDS) add(errors, byDomainCount(multidomainAssertionRevisions, domainId) < 20, "DOMAIN_ASSERTION_CORPUS_TOO_THIN", { domainId });
  for (const assertion of multidomainAssertionRevisions) {
    const links = multidomainEvidenceLinks.filter((item) => item.assertionRevisionId === assertion.revisionId);
    add(errors, assertion.statement.atomicConclusionCount !== 1, "ASSERTION_NOT_ATOMIC", { revisionId: assertion.revisionId });
    add(errors, !assertion.sourceRefs.length || assertion.sourceRefs.some((id) => !sourceIds.has(id)), "ASSERTION_SOURCE_INVALID", { revisionId: assertion.revisionId });
    add(errors, links.length === 0 || links.every((link) => link.relationType === "MENTIONS"), "ASSERTION_WITHOUT_EVIDENCE", { revisionId: assertion.revisionId });
    add(errors, assertion.humanReviewed || assertion.scientificHumanReview !== null || assertion.reviewType !== P5_REVIEW_TYPE, "FALSE_HUMAN_REVIEW", { revisionId: assertion.revisionId });
    add(errors, !P5_REVIEW_DECISIONS.includes(assertion.automatedReviewDecision), "INVALID_REVIEW_DECISION", { revisionId: assertion.revisionId });
  }
  for (const link of multidomainEvidenceLinks) {
    const source = multidomainSourceRevisions.find((item) => item.revisionId === link.sourceRevisionId);
    add(errors, !source || !assertionIds.has(link.assertionRevisionId), "EVIDENCE_ENDPOINT_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !P5_EVIDENCE_RELATIONS.includes(link.relationType), "EVIDENCE_RELATION_INVALID", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !link.locator || !link.extraction?.passage || !link.extraction?.section, "EVIDENCE_LOCALIZATION_INCOMPLETE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, source?.abstractOnly && !/PubMed abstract/i.test(link.locator), "ABSTRACT_ONLY_LOCATOR_ESCAPE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.extraction.interpretationLevel === "DERIVED_INTERPRETATION" && (!link.extraction.derivationSteps.length || link.extraction.directAuthorStatement), "DERIVED_INTERPRETATION_UNCONTROLLED", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.scientificHumanReview !== null, "FALSE_HUMAN_EVIDENCE_REVIEW", { evidenceLinkId: link.evidenceLinkId });
  }
  const mentionAssertions = new Set(multidomainEvidenceLinks.filter((item) => item.relationType === "MENTIONS").map((item) => item.assertionRevisionId));
  add(errors, [...mentionAssertions].some((id) => !multidomainEvidenceLinks.some((item) => item.assertionRevisionId === id && item.relationType !== "MENTIONS")), "MENTION_PROMOTED_AS_ONLY_EVIDENCE");
  return { valid: errors.length === 0, errors, counts: { assertions: multidomainAssertionRevisions.length, evidenceLinks: multidomainEvidenceLinks.length, reviews: multidomainAssertionReviewDecisions.length } };
};

const validateMetrology = () => {
  const errors = [];
  for (const measurement of multidomainMeasurementRecords) {
    add(errors, measurement.unitStatus === "SOURCE_DOCUMENTED" && !measurement.unit, "REQUIRED_UNIT_MISSING", { measurementId: measurement.measurementId });
    add(errors, !measurement.sourceRefs.length || measurement.sourceRefs.some((id) => !sourceIds.has(id)), "MEASUREMENT_SOURCE_INVALID", { measurementId: measurement.measurementId });
    add(errors, measurement.formula && measurement.formulaStatus !== "SOURCE_DOCUMENTED", "UNSOURCED_FORMULA", { measurementId: measurement.measurementId });
  }
  for (const threshold of contextualThresholdRecords) {
    add(errors, threshold.universal || !threshold.context?.algorithm || !threshold.context?.population || !threshold.unit, "THRESHOLD_CONTEXT_INCOMPLETE", { thresholdId: threshold.thresholdId });
    add(errors, threshold.sourceRefs.some((id) => !sourceIds.has(id)), "THRESHOLD_SOURCE_INVALID", { thresholdId: threshold.thresholdId });
  }
  add(errors, metrologyDistinctions.find((item) => item.term === "repeatability")?.distinctFrom.includes("reproducibility") !== true, "REPEATABILITY_REPRODUCIBILITY_COLLAPSED");
  add(errors, metrologyDistinctions.find((item) => item.term === "correlation")?.distinctFrom.includes("agreement") !== true, "CORRELATION_AGREEMENT_COLLAPSED");
  return { valid: errors.length === 0, errors, counts: { measurements: multidomainMeasurementRecords.length, thresholds: contextualThresholdRecords.length, formulas: multidomainMeasurementRecords.filter((item) => item.formula).length } };
};

const validateSynthesisQueryProjectionReadiness = () => {
  const errors = [];
  add(errors, multidomainScientificSyntheses.length !== 12, "SYNTHESIS_COUNT_CHANGED");
  for (const domainId of P5_DOMAIN_IDS) add(errors, byDomainCount(multidomainScientificSyntheses, domainId) < 3, "DOMAIN_SYNTHESIS_COUNT_TOO_LOW", { domainId });
  for (const synthesis of multidomainScientificSyntheses) {
    const definition = multidomainSynthesisDefinitions.find((item) => item.key === synthesis.key);
    add(errors, synthesis.applicableAssertions.length === 0 || synthesis.generatedEditorialText || synthesis.statisticalMetaAnalysisPerformed || synthesis.prose !== null, "SYNTHESIS_SCOPE_INVALID", { key: synthesis.key });
    add(errors, synthesis.convergence.publicationMajorityUsed, "PUBLICATION_COUNT_USED_AS_CONSENSUS", { key: synthesis.key });
    add(errors, stableStringify(createMultidomainSynthesis(definition)) !== stableStringify(synthesis), "SYNTHESIS_NON_DETERMINISTIC", { key: synthesis.key });
  }
  const queries = executeMandatoryMultidomainQueries();
  for (const [key, result] of Object.entries(queries)) {
    add(errors, result.applicableAssertions.length === 0, "MANDATORY_QUERY_EMPTY", { key });
    add(errors, queryScientificMultidomain(result.query).deterministicDigest !== result.deterministicDigest, "QUERY_NON_DETERMINISTIC", { key });
    add(errors, result.approximationUsed || result.statisticalMetaAnalysisPerformed || result.generatedEditorialText, "QUERY_SCOPE_INVALID", { key });
  }
  add(errors, multidomainContradictionAssessments.length < 4 || multidomainContradictionAssessments.some((item) => item.resolutionApplied), "CONTRADICTIONS_NOT_PRESERVED");
  add(errors, multidomainInternalProjections.length !== 8, "PROJECTION_COUNT_CHANGED");
  for (const domainId of P5_DOMAIN_IDS) add(errors, byDomainCount(multidomainInternalProjections, domainId) < 2, "DOMAIN_PROJECTION_COUNT_TOO_LOW", { domainId });
  for (const projection of multidomainInternalProjections) {
    for (const [field, expected] of Object.entries(P5_PUBLICATION_GUARDS)) add(errors, projection[field] !== expected, "PROJECTION_GUARD_VIOLATION", { projectionId: projection.projectionId, field });
    add(errors, projection.prose !== null || !projection.assertions.length || !projection.sources.length, "PROJECTION_CONTENT_INVALID", { projectionId: projection.projectionId });
  }
  add(errors, multidomainDomainReadiness.some((item) => item.publicPublicationReady.ready || item.seoReady.ready), "DOMAIN_PUBLIC_READY_COLLAPSED");
  add(errors, multidomainProjectionReadiness.some((item) => item.publicPublicationReady.ready || item.seoReady.ready), "PROJECTION_PUBLIC_READY_COLLAPSED");
  add(errors, multidomainReadinessSummary.scoreUsed || multidomainReadinessSummary.readinessDimensionsCollapsed, "READINESS_DIMENSIONS_COLLAPSED");
  return { valid: errors.length === 0, errors, counts: { syntheses: multidomainScientificSyntheses.length, queries: Object.keys(queries).length, contradictions: multidomainContradictionAssessments.length, projections: multidomainInternalProjections.length, readiness: multidomainReadinessSummary } };
};

const validateP5Generality = () => {
  const errors = [];
  add(errors, confirmedGenericInvariants.length !== 18, "GENERIC_INVARIANT_COUNT_CHANGED");
  add(errors, confirmedGenericInvariants.some((item) => item.userDomains.length < 5 || !item.generic), "GENERIC_INVARIANT_NOT_MULTIDOMAIN");
  add(errors, genericContractModifications.length !== 0, "UNJUSTIFIED_GENERIC_CONTRACT_CHANGE");
  add(errors, p5DomainSpecificExtensions.some((item) => !P5_DOMAIN_IDS.includes(item.domainId)), "DOMAIN_EXTENSION_NOT_ISOLATED");
  add(errors, Object.entries(residualEcvBiasAudit).some(([key, value]) => key !== "conclusion" && value === true), "RESIDUAL_ECV_T1_BIAS");
  add(errors, nextScientificWaves.length < 5 || nextScientificWaves.length > 10, "NEXT_WAVE_PLAN_SIZE_INVALID");
  return { valid: errors.length === 0, errors, counts: p5GeneralitySummary };
};

export const validateScientificMultidomain = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const layers = Object.freeze({
    baseline: validateP4RBaselineForP5(),
    domains: validateScientificDomains(),
    sources: validateSources(),
    concepts: validateConcepts(),
    assertionsAndEvidence: validateAssertionsAndEvidence(),
    metrology: validateMetrology(),
    synthesisQueryProjectionReadiness: validateSynthesisQueryProjectionReadiness(),
    generality: validateP5Generality(),
  });
  const protectedSurfaces = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  const errors = [
    ...Object.entries(layers).flatMap(([layer, value]) => value.errors.map((error) => ({ layer, ...error }))),
    ...(!protectedSurfaces.protectedSurfacesUnchanged ? protectedSurfaces.protectedChanges.map((item) => ({ layer: "protectedSurfaces", code: "PROTECTED_SURFACE_CHANGED", ...item })) : []),
    ...(!protectedSurfaces.editorialEngineUnchanged ? protectedSurfaces.editorialEngine.changed.map((path) => ({ layer: "protectedSurfaces", code: "EDITORIAL_ENGINE_CHANGED", path })) : []),
  ];
  return Object.freeze({
    valid: errors.length === 0,
    version: "P5_MULTIDOMAIN_WAVE_1",
    errors: Object.freeze(errors),
    layers,
    protectedSurfaces,
    counts: Object.freeze({
      domains: scientificDomainManifests.length,
      sourcesExamined: multidomainSourceSummary.externalExamined,
      sourcesRetained: multidomainSourceRevisions.length,
      sourcesRejected: rejectedMultidomainSources.length,
      concepts: multidomainConcepts.length,
      assertions: multidomainAssertionRevisions.length,
      evidenceLinks: multidomainEvidenceLinks.length,
      measurements: multidomainMeasurementRecords.length,
      syntheses: multidomainScientificSyntheses.length,
      projections: multidomainInternalProjections.length,
      genericInvariants: confirmedGenericInvariants.length,
      domainExtensions: p5DomainSpecificExtensions.length,
    }),
  });
};
