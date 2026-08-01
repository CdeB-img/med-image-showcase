import { extractionTypes, reviewTypes } from "../scientific-model-schema.mjs";
import { stableStringify } from "../migration/stable-json.mjs";
import { validateContextDimension, validateQuantitativeRecord, validateScientificAssertionRevisions, validateSourceModel, validateVersionedRecords } from "../scientific-model-validate.mjs";
import { assertionReviewDecisions, scientificAssertionIdentities, scientificAssertionRevisions, scientificEvidenceLinks } from "./assertions.mjs";
import { scientificCorpusConceptDesignations, scientificCorpusConceptIdentities, scientificCorpusEntityRevisions, ontologicalRequalificationDecisions } from "./concepts.mjs";
import { scientificApplicabilityContexts } from "./contexts.mjs";
import { PUBLICATION_GUARDS, SCIENTIFIC_CORPUS_REVIEW_TYPE } from "./constants.mjs";
import { derivedMeasurements, quantitativeModelRecords } from "./measurements.mjs";
import { inspectProtectedSurfaces } from "./protected-surfaces.mjs";
import { internalScientificProjections, projectionReadiness } from "./projections.mjs";
import { competencyQueries, queryScientificCorpus } from "./query.mjs";
import { conceptReadiness, readinessRules, readinessSummary, synthesisReadiness } from "./readiness.mjs";
import { scientificSourceIdentities, scientificSourceRevisions, selectedSourceRecords } from "./sources.mjs";
import { createScientificSynthesis, scientificSyntheses, synthesisDefinitions } from "./synthesis.mjs";

const doiPattern = /^10\.\d{4,9}\/[\w.()/:;-]+$/i;
const pmidPattern = /^\d{7,8}$/;
const add = (errors, condition, code, details = {}) => { if (condition) errors.push({ code, ...details }); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);

export const validateP4EvidenceCandidate = (link, { sourceRevisions = scientificSourceRevisions } = {}) => {
  const errors = [];
  const source = sourceRevisions.find((item) => item.revisionId === link?.sourceRevisionId);
  add(errors, !source, "UNKNOWN_SOURCE_REVISION");
  add(errors, !link?.locator || link.locator.split(" ").length < 3, "EVIDENCE_LOCATOR_NOT_EXPLOITABLE");
  add(errors, !link?.extraction?.passage || !link?.extraction?.section, "INCOMPLETE_EXTRACTION");
  add(errors, link?.relationType === "SUPPORTS" && link?.extraction?.interpretationLevel === "AUTHOR_INTERPRETATION", "AUTHOR_DISCUSSION_USED_AS_SUPPORT");
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
};

export const validateP4AssertionCandidate = (assertion, links = [], { sourceRevisions = scientificSourceRevisions } = {}) => {
  const errors = [];
  add(errors, !assertion?.sourceRefs?.length, "REAL_ASSERTION_WITHOUT_SOURCE");
  add(errors, links.length === 0, "REAL_ASSERTION_WITHOUT_EVIDENCE_LINK");
  for (const link of links) errors.push(...validateP4EvidenceCandidate(link, { sourceRevisions }).errors);
  add(errors, assertion?.reviewState === "VERIFIED" && assertion?.humanReviewed !== true, "AUTOMATIC_VERIFIED_ASSERTION_FORBIDDEN");
  if (assertion?.assertionType === "RecommendationAssertion") {
    const recommendationEvidence = links.some((link) => ["GUIDELINE", "CONSENSUS"].includes(link.evidenceSourceType) && link.extraction?.interpretationLevel === "RECOMMENDATION_TEXT");
    add(errors, !recommendationEvidence, "EXPLORATORY_RESULT_PROMOTED_TO_RECOMMENDATION");
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
};

const validateSources = () => {
  const base = validateSourceModel({ sourceIdentities: scientificSourceIdentities, sourceRevisions: scientificSourceRevisions });
  const errors = [...base.errors];
  add(errors, scientificSourceRevisions.length < 20 || scientificSourceRevisions.length > 40, "SOURCE_COUNT_OUTSIDE_PILOT_TARGET", { count: scientificSourceRevisions.length });
  for (const source of scientificSourceRevisions) {
    add(errors, source.doi !== null && !doiPattern.test(source.doi), "INVALID_DOI", { revisionId: source.revisionId, doi: source.doi });
    add(errors, source.pmid !== null && !pmidPattern.test(source.pmid), "INVALID_PMID", { revisionId: source.revisionId, pmid: source.pmid });
    add(errors, !source.retrievedAt, "MISSING_RETRIEVAL_DATE", { revisionId: source.revisionId });
    add(errors, !source.digest, "MISSING_SOURCE_DIGEST", { revisionId: source.revisionId });
    add(errors, !source.metadata?.sourceQuality, "MISSING_MULTIDIMENSIONAL_SOURCE_QUALITY", { revisionId: source.revisionId });
    add(errors, Object.hasOwn(source.metadata?.sourceQuality ?? {}, "globalScore"), "OPAQUE_GLOBAL_SOURCE_SCORE_FORBIDDEN", { revisionId: source.revisionId });
  }
  add(errors, duplicates(scientificSourceRevisions.map((item) => item.doi).filter(Boolean)).length > 0, "DUPLICATE_DOI");
  add(errors, duplicates(scientificSourceRevisions.map((item) => item.pmid).filter(Boolean)).length > 0, "DUPLICATE_PMID");
  const used = new Set(scientificEvidenceLinks.map((link) => link.sourceRevisionId));
  for (const record of selectedSourceRecords) add(errors, !used.has(record.revision.revisionId), "RETAINED_SOURCE_WITHOUT_EXPLOITABLE_ASSERTION", { sourceKey: record.key });
  return { valid: errors.length === 0, errors, counts: base.counts };
};

const validateConcepts = () => {
  const base = validateVersionedRecords({ identities: scientificCorpusConceptIdentities, revisions: scientificCorpusEntityRevisions });
  const errors = [...base.errors];
  const sourceIds = new Set(scientificSourceRevisions.map((source) => source.revisionId));
  for (const identity of scientificCorpusConceptIdentities) add(errors, !identity.sourceRefs.length || identity.sourceRefs.some((id) => !sourceIds.has(id)), "CONCEPT_WITHOUT_SELECTED_SOURCE", { conceptId: identity.stableId });
  for (const designation of scientificCorpusConceptDesignations) {
    add(errors, !sourceIds.has(designation.sourceRef), "UNSOURCED_DESIGNATION", { designationId: designation.designationId });
    add(errors, !scientificCorpusConceptIdentities.some((identity) => identity.stableId === designation.entityId), "ORPHAN_DESIGNATION", { designationId: designation.designationId });
  }
  for (const decision of ontologicalRequalificationDecisions) add(errors, decision.decision !== "DEFERRED" || decision.appliedClass !== decision.historicalClass, "HISTORICAL_CLASSIFICATION_CHANGED_IN_P4", { conceptId: decision.conceptId });
  return { valid: errors.length === 0, errors, counts: { ...base.counts, designations: scientificCorpusConceptDesignations.length, deferredRequalifications: ontologicalRequalificationDecisions.length } };
};

const validateContextsAndQuantitative = () => {
  const errors = [];
  for (const context of scientificApplicabilityContexts) for (const dimension of context.dimensions) errors.push(...validateContextDimension(dimension).errors.map((item) => ({ ...item, contextId: context.contextId })));
  for (const record of quantitativeModelRecords) errors.push(...validateQuantitativeRecord(record, { unitRequired: true }).errors);
  for (const record of quantitativeModelRecords) {
    add(errors, record.referenceRange !== null, "UNSOURCED_REFERENCE_RANGE_FORBIDDEN", { recordId: record.stableId });
    add(errors, record.threshold !== null, "UNSOURCED_THRESHOLD_FORBIDDEN", { recordId: record.stableId });
    add(errors, !record.sourceRefs?.length, "QUANTITATIVE_RECORD_WITHOUT_SOURCE", { recordId: record.stableId });
  }
  const mrEcv = derivedMeasurements.find((item) => item.stableId.endsWith("myocardial-ecv-mr"));
  const ctEcv = derivedMeasurements.find((item) => item.stableId.endsWith("myocardial-ecv-ct-single-energy"));
  add(errors, !mrEcv?.formula?.includes("T1_myo_post") || !mrEcv?.formula?.includes("Hct"), "CMR_ECV_FORMULA_INCOMPLETE");
  add(errors, !ctEcv?.formula?.includes("HU_myo_delayed") || !ctEcv?.formula?.includes("Hct"), "CT_ECV_FORMULA_INCOMPLETE");
  add(errors, mrEcv?.formula === ctEcv?.formula, "MR_CT_ECV_FORMULA_COLLISION");
  add(errors, mrEcv?.method === ctEcv?.method, "MR_CT_ECV_METHOD_COLLISION");
  return { valid: errors.length === 0, errors, counts: { contexts: scientificApplicabilityContexts.length, quantitativeRecords: quantitativeModelRecords.length, derivedMeasurements: derivedMeasurements.length } };
};

const validateAssertionsAndEvidence = () => {
  const base = validateScientificAssertionRevisions({ assertionIdentities: scientificAssertionIdentities, assertionRevisions: scientificAssertionRevisions, evidenceLinks: scientificEvidenceLinks, sourceRevisions: scientificSourceRevisions });
  const errors = [...base.errors];
  const linksByAssertion = new Map();
  for (const link of scientificEvidenceLinks) linksByAssertion.set(link.assertionRevisionId, [...(linksByAssertion.get(link.assertionRevisionId) ?? []), link]);
  add(errors, scientificAssertionRevisions.length < 40 || scientificAssertionRevisions.length > 100, "ASSERTION_COUNT_OUTSIDE_PILOT_TARGET", { count: scientificAssertionRevisions.length });
  for (const assertion of scientificAssertionRevisions) {
    const links = linksByAssertion.get(assertion.revisionId) ?? [];
    add(errors, links.length === 0 || !assertion.sourceRefs.length, "REAL_ASSERTION_WITHOUT_SOURCE", { revisionId: assertion.revisionId });
    add(errors, assertion.reviewState === "VERIFIED", "AUTOMATIC_VERIFIED_ASSERTION_FORBIDDEN", { revisionId: assertion.revisionId });
    add(errors, assertion.humanReviewed !== false, "FALSE_HUMAN_REVIEW", { revisionId: assertion.revisionId });
    add(errors, assertion.reviewType !== SCIENTIFIC_CORPUS_REVIEW_TYPE, "INVALID_AUTOMATED_REVIEW_TYPE", { revisionId: assertion.revisionId });
    if (assertion.assertionType === "RecommendationAssertion") {
      const recommendationEvidence = links.filter((link) => link.extraction?.interpretationLevel === "RECOMMENDATION_TEXT" && ["GUIDELINE", "CONSENSUS"].includes(link.evidenceSourceType));
      add(errors, recommendationEvidence.length === 0, "EXPLORATORY_RESULT_PROMOTED_TO_RECOMMENDATION", { revisionId: assertion.revisionId });
    }
  }
  for (const link of scientificEvidenceLinks) {
    add(errors, !link.locator || link.locator.split(" ").length < 3, "EVIDENCE_LOCATOR_NOT_EXPLOITABLE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !link.extraction?.passage || !link.extraction?.section, "INCOMPLETE_EXTRACTION", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !extractionTypes.includes(link.extraction?.interpretationLevel), "INVALID_EXTRACTION_TYPE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, !reviewTypes.includes(link.reviewType), "INVALID_REVIEW_TYPE", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.reviewType === "scientificHumanReview", "FALSE_HUMAN_EVIDENCE_REVIEW", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.relationType === "SUPPORTS" && link.extraction?.interpretationLevel === "AUTHOR_INTERPRETATION", "AUTHOR_DISCUSSION_USED_AS_SUPPORT", { evidenceLinkId: link.evidenceLinkId });
    add(errors, link.relationType === "SUPPORTS" && /only mention|mentions only/i.test(link.analyticalSummary ?? ""), "MENTION_USED_AS_SUPPORT", { evidenceLinkId: link.evidenceLinkId });
  }
  add(errors, !scientificEvidenceLinks.some((link) => link.relationType === "MENTIONS"), "MENTIONS_RELATION_NOT_REPRESENTED");
  add(errors, !scientificEvidenceLinks.some((link) => link.relationType === "REFUTES"), "REFUTES_RELATION_NOT_REPRESENTED");
  add(errors, !scientificEvidenceLinks.some((link) => link.relationType === "QUALIFIES"), "QUALIFIES_RELATION_NOT_REPRESENTED");
  add(errors, !base.contradictions.length, "CONTRADICTION_NOT_PRESERVED");
  for (const decision of assertionReviewDecisions) {
    add(errors, decision.reviewType !== "automatedStructuralReview" || decision.scientificHumanReview !== null, "FALSE_REVIEW_DECISION", { decisionId: decision.decisionId });
  }
  return { valid: errors.length === 0, errors, warnings: base.warnings, contradictions: base.contradictions, counts: base.counts };
};

const validateQueriesAndSyntheses = () => {
  const errors = [];
  const queryResults = Object.fromEntries(Object.entries(competencyQueries).map(([key, query]) => [key, queryScientificCorpus(query)]));
  for (const [key, query] of Object.entries(competencyQueries)) {
    const first = queryScientificCorpus(query);
    const second = queryScientificCorpus(query);
    add(errors, stableStringify(first) !== stableStringify(second), "NON_DETERMINISTIC_QUERY", { key });
    add(errors, first.statisticalMetaAnalysisPerformed || first.generatedEditorialText || first.approximationUsed, "QUERY_SCOPE_VIOLATION", { key });
  }
  add(errors, queryResults.ecvGeneral.dataPresent.assertionCount === 0, "EMPTY_ECV_QUERY");
  add(errors, queryResults.ecvMr.dataPresent.assertionCount === 0, "EMPTY_MR_ECV_QUERY");
  add(errors, queryResults.ecvCt.dataPresent.assertionCount === 0, "EMPTY_CT_ECV_QUERY");
  add(errors, queryResults.ecvMyocarditis.dataPresent.assertionCount === 0, "EMPTY_MYOCARDITIS_QUERY");
  add(errors, queryResults.ecvInfarction.dataPresent.assertionCount === 0, "EMPTY_INFARCTION_QUERY");
  add(errors, !queryResults.ctReproducibility.dataAbsent.includes("NO_APPLICABLE_ASSERTION"), "MISSING_DATA_NOT_EXPLICIT");
  add(errors, queryResults.contradictions.contradictions.length === 0, "QUERY_CONTRADICTION_NOT_RETURNED");
  for (const [index, synthesis] of scientificSyntheses.entries()) {
    const regenerated = createScientificSynthesis(synthesisDefinitions.find((definition) => definition.key === synthesis.key));
    add(errors, stableStringify(synthesis) !== stableStringify(regenerated), "NON_DETERMINISTIC_SYNTHESIS", { key: synthesis.key, index });
    add(errors, synthesis.statisticalMetaAnalysisPerformed || synthesis.generatedEditorialText, "SYNTHESIS_SCOPE_VIOLATION", { key: synthesis.key });
    add(errors, synthesis.convergence.publicationMajorityUsed, "PUBLICATION_MAJORITY_USED_AS_CONSENSUS", { key: synthesis.key });
    add(errors, synthesis.applicableAssertions.length === 0, "EMPTY_REQUIRED_SYNTHESIS", { key: synthesis.key });
  }
  return { valid: errors.length === 0, errors, queryResults, counts: { queries: Object.keys(competencyQueries).length, syntheses: scientificSyntheses.length } };
};

const validateProjectionsAndReadiness = () => {
  const errors = [];
  for (const projection of internalScientificProjections) {
    for (const [field, expected] of Object.entries(PUBLICATION_GUARDS)) add(errors, projection[field] !== expected, "INTERNAL_PROJECTION_PUBLIC_GUARD_VIOLATION", { projectionId: projection.projectionId, field });
    add(errors, projection.prose !== null, "PUBLIC_PROSE_CREATED", { projectionId: projection.projectionId });
  }
  add(errors, projectionReadiness.some((item) => item.editorialProjectionReady.ready || item.seoReady.ready || item.publicPublicationReady.ready), "PROJECTION_PREMATURELY_PUBLIC_READY");
  add(errors, conceptReadiness.some((item) => item.publicPublicationReady.ready) || synthesisReadiness.some((item) => item.publicPublicationReady.ready), "READINESS_COLLAPSED_TO_PUBLIC_READY");
  add(errors, readinessSummary.scoreUsed, "OPAQUE_READINESS_SCORE_FORBIDDEN");
  add(errors, Object.keys(readinessRules).length !== 7, "INCOMPLETE_READINESS_DIMENSIONS");
  return { valid: errors.length === 0, errors, counts: { projections: internalScientificProjections.length, conceptReadiness: conceptReadiness.length, synthesisReadiness: synthesisReadiness.length } };
};

export const validateScientificCorpus = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const layers = {
    sources: validateSources(),
    concepts: validateConcepts(),
    quantitative: validateContextsAndQuantitative(),
    assertions: validateAssertionsAndEvidence(),
    queryAndSynthesis: validateQueriesAndSyntheses(),
    projectionAndReadiness: validateProjectionsAndReadiness(),
  };
  const protectedSurfaces = inspectGit ? inspectProtectedSurfaces({ root }) : { protectedSurfacesUnchanged: true, editorialEngineUnchanged: true, protectedChanges: [], editorialEngine: { changed: [] } };
  const errors = [
    ...Object.entries(layers).flatMap(([layer, value]) => value.errors.map((error) => ({ layer, ...error }))),
    ...(!protectedSurfaces.protectedSurfacesUnchanged ? protectedSurfaces.protectedChanges.map((item) => ({ layer: "protectedSurfaces", code: "PROTECTED_SURFACE_CHANGED", ...item })) : []),
    ...(!protectedSurfaces.editorialEngineUnchanged ? protectedSurfaces.editorialEngine.changed.map((path) => ({ layer: "protectedSurfaces", code: "EDITORIAL_ENGINE_CHANGED", path })) : []),
  ];
  return Object.freeze({
    valid: errors.length === 0,
    corpusVersion: "1.0.0-ecv-t1-pilot",
    perimeter: "NOXIA_PUBLIC_WEBSITE_DOCUMENTARY_SCIENTIFIC_GRAPH_INTERNAL_DATA_ONLY",
    errors: Object.freeze(errors),
    layers: Object.freeze(layers),
    protectedSurfaces,
    guards: PUBLICATION_GUARDS,
    counts: Object.freeze({
      sources: scientificSourceRevisions.length,
      concepts: scientificCorpusConceptIdentities.length,
      assertions: scientificAssertionRevisions.length,
      evidenceLinks: scientificEvidenceLinks.length,
      contexts: scientificApplicabilityContexts.length,
      quantitativeRecords: quantitativeModelRecords.length,
      syntheses: scientificSyntheses.length,
      projections: internalScientificProjections.length,
    }),
  });
};
