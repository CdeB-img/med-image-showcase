import { scientificAssertionRevisions, scientificEvidenceLinks } from "./assertions.mjs";
import { scientificCorpusConceptIdentities, scientificCorpusEntityRevisions } from "./concepts.mjs";
import { scientificSyntheses } from "./synthesis.mjs";

export const readinessRules = Object.freeze({
  catalogReady: Object.freeze({ requiredFields: ["stableId", "entityType", "preferredLabel", "description", "sourceRefs"], minimumProvenance: "AT_LEAST_ONE_SOURCE_REVISION", blockingConditions: ["MISSING_STABLE_ID", "MISSING_LABEL", "MISSING_SOURCE"], warningConditions: ["UNRESOLVED_FIELDS"] }),
  scientificReady: Object.freeze({ requiredFields: ["atomicAssertion", "evidenceLink", "sourceLocator", "applicabilityContext"], minimumProvenance: "SOURCE_LOCALIZED_AUTOMATED_STRUCTURAL_REVIEW", blockingConditions: ["NO_ASSERTION", "NO_EVIDENCE", "MISSING_LOCATOR", "UNSOURCED_ASSERTION"], warningConditions: ["NO_SCIENTIFIC_HUMAN_REVIEW", "CONTESTED_ASSERTION"] }),
  provenanceReady: Object.freeze({ requiredFields: ["sourceIdentity", "sourceRevision", "locator", "retrievedAt", "digest"], minimumProvenance: "VERSIONED_SOURCE_AND_LOCALIZED_EVIDENCE", blockingConditions: ["NO_SOURCE_REVISION", "MISSING_LOCATOR", "MISSING_RETRIEVAL_DATE"], warningConditions: ["ABSTRACT_ONLY", "BIBLIOGRAPHIC_DIGEST_ONLY"] }),
  synthesisReady: Object.freeze({ requiredFields: ["deterministicQuery", "applicableAssertions", "sources", "limitations", "missingData"], minimumProvenance: "ALL_INCLUDED_ASSERTIONS_HAVE_EVIDENCE", blockingConditions: ["EMPTY_SYNTHESIS", "NON_DETERMINISTIC", "UNLINKED_ASSERTION"], warningConditions: ["OPEN_QUESTIONS", "CONTRADICTIONS", "NO_SCIENTIFIC_HUMAN_REVIEW"] }),
  editorialProjectionReady: Object.freeze({ requiredFields: ["scientificReady", "synthesisReady", "scientificHumanReview"], minimumProvenance: "HUMAN_SCIENTIFIC_REVIEW_FOR_MAJOR_ASSERTIONS", blockingConditions: ["NO_SCIENTIFIC_HUMAN_REVIEW", "MAJOR_OPEN_QUESTION"], warningConditions: ["CONTEXT_LIMITED"] }),
  seoReady: Object.freeze({ requiredFields: ["approvedEditorialProjection", "metadataReview", "publicRouteDecision"], minimumProvenance: "EDITORIAL_AND_SCIENTIFIC_APPROVAL", blockingConditions: ["P4_PUBLIC_SURFACE_FORBIDDEN", "NO_EDITORIAL_APPROVAL"], warningConditions: [] }),
  publicPublicationReady: Object.freeze({ requiredFields: ["scientificHumanReview", "editorialApproval", "seoApproval", "noMajorUnresolvedEvidence"], minimumProvenance: "HUMAN_REVIEWED_AND_PUBLICATION_APPROVED", blockingConditions: ["P4_PUBLICATION_FORBIDDEN", "NO_SCIENTIFIC_HUMAN_REVIEW", "NO_EDITORIAL_APPROVAL"], warningConditions: ["LIMITED_COVERAGE"] }),
});

const assessment = (ready, blockingErrors, warnings, justification) => Object.freeze({ ready, blockingErrors: Object.freeze(blockingErrors), warnings: Object.freeze(warnings), justification, rules: null });
const evidenceByAssertion = new Map();
for (const link of scientificEvidenceLinks) evidenceByAssertion.set(link.assertionRevisionId, [...(evidenceByAssertion.get(link.assertionRevisionId) ?? []), link]);

const forConcept = (identity, revision) => {
  const assertions = scientificAssertionRevisions.filter((assertion) => assertion.subjectEntityId === identity.stableId || assertion.objectEntityId === identity.stableId || (assertion.facets?.concepts ?? []).includes(identity.stableId));
  const links = assertions.flatMap((assertion) => evidenceByAssertion.get(assertion.revisionId) ?? []);
  const syntheses = scientificSyntheses.filter((synthesis) => synthesis.concepts.includes(identity.stableId));
  const catalogBlockers = [
    ...(!identity.stableId ? ["MISSING_STABLE_ID"] : []),
    ...(!revision.payload?.preferredLabel ? ["MISSING_LABEL"] : []),
    ...(!revision.sourceRefs?.length ? ["MISSING_SOURCE"] : []),
  ];
  const scientificBlockers = [
    ...(!assertions.length ? ["NO_ASSERTION"] : []),
    ...(!links.length ? ["NO_EVIDENCE"] : []),
    ...(links.some((link) => !link.locator) ? ["MISSING_LOCATOR"] : []),
  ];
  const provenanceBlockers = [
    ...(!revision.sourceRefs?.length ? ["NO_SOURCE_REVISION"] : []),
    ...(links.some((link) => !link.locator) ? ["MISSING_LOCATOR"] : []),
  ];
  const synthesisBlockers = !syntheses.length ? ["EMPTY_SYNTHESIS"] : [];
  return Object.freeze({
    subjectId: identity.stableId,
    subjectType: "CONCEPT",
    catalogReady: assessment(catalogBlockers.length === 0, catalogBlockers, revision.unresolvedFields?.length ? ["UNRESOLVED_FIELDS"] : [], catalogBlockers.length ? "Catalog requirements are incomplete." : "Stable identity, sourced label and factual description are present."),
    scientificReady: assessment(scientificBlockers.length === 0, scientificBlockers, ["NO_SCIENTIFIC_HUMAN_REVIEW", ...(assertions.some((item) => item.reviewState === "CONTESTED") ? ["CONTESTED_ASSERTION"] : [])], scientificBlockers.length ? "No complete source-localized assertion set is available for this concept." : "At least one atomic source-localized assertion and evidence link is available for internal scientific use."),
    provenanceReady: assessment(provenanceBlockers.length === 0, provenanceBlockers, links.some((link) => link.sourceRevisionId && link.extraction?.page === null) ? ["PAGE_NOT_AVAILABLE_FOR_ALL_EXTRACTIONS"] : [], provenanceBlockers.length ? "Versioned localized provenance is incomplete." : "Concept and linked assertions retain versioned source references and evidence locators."),
    synthesisReady: assessment(synthesisBlockers.length === 0 && scientificBlockers.length === 0, [...synthesisBlockers, ...scientificBlockers], syntheses.flatMap((item) => item.openQuestions).length ? ["OPEN_QUESTIONS"] : [], synthesisBlockers.length ? "No deterministic pilot synthesis currently includes this concept." : "The concept participates in at least one deterministic structured synthesis."),
    editorialProjectionReady: assessment(false, ["NO_SCIENTIFIC_HUMAN_REVIEW"], ["INTERNAL_STRUCTURE_ONLY"], "P4 performed automated structural review only; editorial projection approval is deliberately withheld."),
    seoReady: assessment(false, ["P4_PUBLIC_SURFACE_FORBIDDEN", "NO_EDITORIAL_APPROVAL"], [], "SEO work is outside the P4 perimeter."),
    publicPublicationReady: assessment(false, ["P4_PUBLICATION_FORBIDDEN", "NO_SCIENTIFIC_HUMAN_REVIEW", "NO_EDITORIAL_APPROVAL"], [], "Public publication is explicitly blocked in P4."),
    counts: Object.freeze({ assertions: assertions.length, evidenceLinks: links.length, syntheses: syntheses.length }),
  });
};

export const conceptReadiness = Object.freeze(scientificCorpusConceptIdentities.map((identity) => forConcept(identity, scientificCorpusEntityRevisions.find((revision) => revision.stableId === identity.stableId))).sort((a, b) => a.subjectId.localeCompare(b.subjectId)));

export const synthesisReadiness = Object.freeze(scientificSyntheses.map((synthesis) => {
  const evidenceAssertionIds = new Set(synthesis.evidenceLinks.map((link) => link.assertionRevisionId));
  const blockers = [
    ...(!synthesis.applicableAssertions.length ? ["EMPTY_SYNTHESIS"] : []),
    ...(synthesis.applicableAssertions.some((assertion) => !evidenceAssertionIds.has(assertion.revisionId)) ? ["UNLINKED_ASSERTION"] : []),
    ...(!synthesis.deterministicDigest ? ["NON_DETERMINISTIC"] : []),
  ];
  return Object.freeze({
    subjectId: synthesis.synthesisId,
    subjectType: "SYNTHESIS",
    catalogReady: assessment(true, [], [], "The synthesis has a stable deterministic identity and definition."),
    scientificReady: assessment(blockers.length === 0, blockers, ["NO_SCIENTIFIC_HUMAN_REVIEW"], blockers.length ? "The internal scientific synthesis has blocking data defects." : "Every included assertion has localized evidence; this is an internal scientific structure, not public prose."),
    provenanceReady: assessment(blockers.length === 0, blockers, synthesis.sourcesConsidered.some((source) => source.metadata.fullTextAvailability === "ABSTRACT_ONLY") ? ["ABSTRACT_ONLY_SOURCE_PRESENT"] : [], "Included assertions and evidence retain source revisions and locators."),
    synthesisReady: assessment(blockers.length === 0, blockers, [...(synthesis.openQuestions.length ? ["OPEN_QUESTIONS"] : []), ...(synthesis.contradictions.length ? ["CONTRADICTIONS"] : [])], blockers.length ? "Synthesis requirements are incomplete." : "The query and output are deterministic and retain limitations, contradictions and missing data."),
    editorialProjectionReady: assessment(false, ["NO_SCIENTIFIC_HUMAN_REVIEW"], ["STRUCTURE_NOT_PUBLIC_PROSE"], "The synthesis has not received human scientific or editorial review."),
    seoReady: assessment(false, ["P4_PUBLIC_SURFACE_FORBIDDEN", "NO_EDITORIAL_APPROVAL"], [], "SEO projection is prohibited in this pass."),
    publicPublicationReady: assessment(false, ["P4_PUBLICATION_FORBIDDEN", "NO_SCIENTIFIC_HUMAN_REVIEW", "NO_EDITORIAL_APPROVAL"], [], "The synthesis is an internal fixture and cannot be published."),
    counts: Object.freeze({ assertions: synthesis.applicableAssertions.length, evidenceLinks: synthesis.evidenceLinks.length, sources: synthesis.sourcesConsidered.length }),
  });
}).sort((a, b) => a.subjectId.localeCompare(b.subjectId)));

export const evaluateProjectionReadiness = (projection) => {
  const synthesis = scientificSyntheses.find((item) => item.key === projection.synthesisKey);
  const blockers = [
    ...(!synthesis ? ["MISSING_SYNTHESIS"] : []),
    ...(projection.internalOnly !== true ? ["NOT_INTERNAL_ONLY"] : []),
    ...(projection.route !== null || projection.canonical !== null || projection.indexable || projection.inSitemap || projection.rendered || projection.publicNavigation ? ["PUBLIC_SURFACE_EXPOSURE"] : []),
  ];
  return Object.freeze({
    subjectId: projection.projectionId,
    subjectType: "INTERNAL_PROJECTION",
    catalogReady: assessment(Boolean(synthesis), synthesis ? [] : ["MISSING_SYNTHESIS"], [], "Projection identity and backing synthesis are checked."),
    scientificReady: assessment(Boolean(synthesis) && synthesis.applicableAssertions.length > 0, !synthesis ? ["MISSING_SYNTHESIS"] : synthesis.applicableAssertions.length ? [] : ["EMPTY_SYNTHESIS"], ["NO_SCIENTIFIC_HUMAN_REVIEW"], "Scientific readiness here means an evidence-linked internal structure only."),
    provenanceReady: assessment(Boolean(synthesis) && synthesis.evidenceLinks.length > 0, !synthesis || !synthesis.evidenceLinks.length ? ["NO_EVIDENCE"] : [], [], "Projection data is derived only from the backing synthesis and evidence links."),
    synthesisReady: assessment(Boolean(synthesis) && blockers.length === 0, blockers, synthesis?.openQuestions?.length ? ["OPEN_QUESTIONS"] : [], blockers.length ? "Projection guard or backing synthesis is invalid." : "The internal structured projection is deterministic and isolated from public surfaces."),
    editorialProjectionReady: assessment(false, ["NO_SCIENTIFIC_HUMAN_REVIEW", "NO_EDITORIAL_APPROVAL"], ["INTERNAL_FIXTURE_ONLY"], "Structure exists, but editorial readiness is intentionally false."),
    seoReady: assessment(false, ["P4_PUBLIC_SURFACE_FORBIDDEN"], [], "No SEO projection is permitted."),
    publicPublicationReady: assessment(false, ["P4_PUBLICATION_FORBIDDEN", "NO_SCIENTIFIC_HUMAN_REVIEW", "NO_EDITORIAL_APPROVAL"], [], "Public publication is blocked."),
  });
};

export const readinessSummary = Object.freeze({
  concepts: Object.freeze(Object.fromEntries(Object.keys(readinessRules).map((key) => [key, conceptReadiness.filter((item) => item[key].ready).length]))),
  syntheses: Object.freeze(Object.fromEntries(Object.keys(readinessRules).map((key) => [key, synthesisReadiness.filter((item) => item[key].ready).length]))),
  publicPublicationReady: false,
  scoreUsed: false,
});
