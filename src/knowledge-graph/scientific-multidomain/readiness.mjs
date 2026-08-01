import { multidomainAssertionRevisions, multidomainEvidenceLinks } from "./assertions.mjs";
import { P5_DOMAIN_IDS } from "./constants.mjs";
import { multidomainInternalProjections } from "./projections.mjs";
import { multidomainSourceRevisions } from "./sources.mjs";
import { multidomainScientificSyntheses } from "./synthesis.mjs";

export const multidomainReadinessRules = Object.freeze({
  catalogReady: { requires: ["DOMAIN_MANIFEST", "SOURCED_CONCEPTS", "STABLE_IDENTITIES"], blockers: ["EMPTY_DOMAIN"] },
  scientificReady: { requires: ["ATOMIC_ASSERTIONS", "AUTOMATED_REVIEW", "CONTEXT", "LIMITATIONS_VISIBLE"], blockers: ["UNSOURCED_ASSERTION", "REJECTED_ACTIVE_ASSERTION"] },
  provenanceReady: { requires: ["SOURCE_REVISION", "LOCALIZER", "EXTRACTION", "EVIDENCE_LINK"], blockers: ["MISSING_LOCALIZER", "MISSING_SOURCE"] },
  synthesisReady: { requires: ["THREE_INTERNAL_SYNTHESES", "CONTRADICTIONS_PRESERVED", "MISSING_DATA_VISIBLE"], blockers: ["NONDETERMINISTIC_SYNTHESIS"] },
  editorialProjectionReady: { requires: ["INTERNAL_PROJECTION", "SCIENTIFIC_READY", "PROVENANCE_READY"], blockers: ["SCIENTIFIC_BLOCKER", "PROVENANCE_BLOCKER"] },
  seoReady: { requires: ["SEPARATE_EDITORIAL_PASS"], blockers: ["P5_INTERNAL_ONLY", "NO_SEO_ARTIFACT"] },
  publicPublicationReady: { requires: ["SEPARATE_PUBLICATION_DECISION", "PUBLIC_EDITORIAL_REVIEW"], blockers: ["PUBLICATION_OUT_OF_SCOPE", "NO_PUBLIC_PROSE", "NO_ROUTE", "NO_CANONICAL"] },
});

const state = (ready, justification, blockers = [], warnings = []) => Object.freeze({ ready, justification, blockers: Object.freeze(blockers), warnings: Object.freeze(warnings) });

export const multidomainDomainReadiness = Object.freeze(P5_DOMAIN_IDS.map((domainId) => {
  const assertions = multidomainAssertionRevisions.filter((item) => item.domainId === domainId);
  const links = multidomainEvidenceLinks.filter((item) => item.domainId === domainId);
  const sources = multidomainSourceRevisions.filter((item) => item.domainId === domainId);
  const syntheses = multidomainScientificSyntheses.filter((item) => item.domainId === domainId);
  const projections = multidomainInternalProjections.filter((item) => item.domainId === domainId);
  const abstractOnly = sources.filter((item) => item.abstractOnly).length;
  const scientificReady = assertions.length > 0 && assertions.every((item) => !["AUTOMATED_REVIEW_REJECTED", "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE"].includes(item.automatedReviewDecision));
  const provenanceReady = links.length >= assertions.length && links.every((item) => item.locator && item.extraction?.passage);
  const synthesisReady = syntheses.length >= 3 && syntheses.every((item) => item.deterministicDigest && !item.generatedEditorialText);
  return Object.freeze({
    subjectId: domainId,
    subjectType: "SCIENTIFIC_DOMAIN",
    catalogReady: state(assertions.length > 0, `${assertions.length} atomic assertions and ${sources.length} retained sources are catalogued.`),
    scientificReady: state(scientificReady, scientificReady ? "Automated scientific review passed or explicitly qualified every active assertion." : "An active scientific assertion has a blocking review decision."),
    provenanceReady: state(provenanceReady, provenanceReady ? "Every assertion has localized evidence and an extraction." : "At least one assertion lacks localized evidence.", [], abstractOnly ? [`${abstractOnly} abstract-only sources remain explicitly limited.`] : []),
    synthesisReady: state(synthesisReady, `${syntheses.length} deterministic internal syntheses are available.`),
    editorialProjectionReady: state(scientificReady && provenanceReady && synthesisReady && projections.length >= 2, `${projections.length} guarded internal projections are structurally exploitable.`, [], ["Future editorial projection still requires a separate pass."]),
    seoReady: state(false, "P5 creates no SEO artifact.", multidomainReadinessRules.seoReady.blockers),
    publicPublicationReady: state(false, "Publication is explicitly outside P5 and no public prose or route exists.", multidomainReadinessRules.publicPublicationReady.blockers),
  });
}));

export const multidomainProjectionReadiness = Object.freeze(multidomainInternalProjections.map((projection) => {
  const domain = multidomainDomainReadiness.find((item) => item.subjectId === projection.domainId);
  return Object.freeze({
    subjectId: projection.projectionId,
    subjectType: "INTERNAL_PROJECTION",
    catalogReady: domain.catalogReady,
    scientificReady: domain.scientificReady,
    provenanceReady: domain.provenanceReady,
    synthesisReady: domain.synthesisReady,
    editorialProjectionReady: domain.editorialProjectionReady,
    seoReady: state(false, "The projection is internal and has no SEO metadata.", ["P5_INTERNAL_ONLY"]),
    publicPublicationReady: state(false, "The projection is unrouted, non-indexable and outside the sitemap.", ["PUBLICATION_OUT_OF_SCOPE", "NO_ROUTE", "NO_CANONICAL"]),
  });
}));

export const multidomainReadinessSummary = Object.freeze({
  domains: Object.freeze(Object.fromEntries(Object.keys(multidomainReadinessRules).map((dimension) => [dimension, multidomainDomainReadiness.filter((item) => item[dimension].ready).length]))),
  projections: Object.freeze(Object.fromEntries(Object.keys(multidomainReadinessRules).map((dimension) => [dimension, multidomainProjectionReadiness.filter((item) => item[dimension].ready).length]))),
  scoreUsed: false,
  readinessDimensionsCollapsed: false,
  publicPublicationReady: false,
});

