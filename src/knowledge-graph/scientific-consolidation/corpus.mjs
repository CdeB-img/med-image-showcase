import { sha256Digest } from "../migration/stable-json.mjs";
import { scientificCorpusConceptIdentities, scientificCorpusEntityRevisions } from "../scientific-corpus/concepts.mjs";
import { internalScientificProjections as p4InternalScientificProjections } from "../scientific-corpus/projections.mjs";
import { queryScientificCorpus } from "../scientific-corpus/query.mjs";
import { synthesisDefinitions } from "../scientific-corpus/synthesis.mjs";
import { P4R_PUBLICATION_GUARDS } from "./constants.mjs";
import { p4rContradictionAssessments } from "./contradictions.mjs";
import { consolidatedAssertionReviewDecisions, consolidatedAssertionRevisions, consolidatedEvidenceLinks } from "./review.mjs";
import { consolidatedSourceByPreviousRevisionId, consolidatedSourceRevisions } from "./sources.mjs";

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const p4rAssertionByStableId = new Map(consolidatedAssertionRevisions.map((assertion) => [assertion.stableId, assertion]));
const p4rEvidenceByPreviousId = new Map(consolidatedEvidenceLinks.map((link) => [link.previousEvidenceLinkId, link]));
const p4rReviewByAssertionId = new Map(consolidatedAssertionReviewDecisions.map((decision) => [decision.assertionRevisionId, decision]));
const p4rSourceByRevisionId = new Map(consolidatedSourceRevisions.map((source) => [source.revisionId, source]));
const primaryEvidenceTypes = new Set(["PROSPECTIVE_STUDY", "MULTICENTER_STUDY", "OBSERVATIONAL_STUDY", "RANDOMIZED_TRIAL"]);

const mapAssertion = (assertion) => p4rAssertionByStableId.get(assertion.stableId);
const mapSource = (source) => consolidatedSourceByPreviousRevisionId[source.revisionId];

export const queryConsolidatedScientificCorpus = (input = {}) => {
  const p4 = queryScientificCorpus(input);
  const applicableAssertions = p4.applicableAssertions.map(mapAssertion).filter(Boolean).sort((a, b) => a.revisionId.localeCompare(b.revisionId));
  const outOfContextAssertions = p4.outOfContextAssertions.map(mapAssertion).filter(Boolean).sort((a, b) => a.revisionId.localeCompare(b.revisionId));
  const applicableIds = new Set(applicableAssertions.map((assertion) => assertion.revisionId));
  const evidenceLinks = consolidatedEvidenceLinks.filter((link) => applicableIds.has(link.assertionRevisionId)).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId));
  const sources = unique(evidenceLinks.map((link) => link.sourceRevisionId)).map((id) => p4rSourceByRevisionId.get(id)).filter(Boolean);
  const reviewDecisions = applicableAssertions.map((assertion) => p4rReviewByAssertionId.get(assertion.revisionId)).filter(Boolean);
  const contradictionAssessments = p4rContradictionAssessments.filter((assessment) => assessment.assertionRevisionIds.some((id) => applicableIds.has(id)));
  const missingData = unique([
    ...p4.dataAbsent,
    ...(input.requireFullText && sources.some((source) => source.metadata.abstractOnly) ? ["ABSTRACT_ONLY_SOURCE_PRESENT"] : []),
  ]);
  const material = {
    p4QueryDigest: p4.deterministicDigest,
    assertionRevisionIds: applicableAssertions.map((item) => item.revisionId),
    evidenceLinkIds: evidenceLinks.map((item) => item.evidenceLinkId),
    sourceRevisionIds: sources.map((item) => item.revisionId),
    reviewDecisionIds: reviewDecisions.map((item) => item.decisionId),
    contradictionIds: contradictionAssessments.map((item) => item.contradictionId),
    missingData,
  };
  return Object.freeze({
    queryId: `noxia:radiology:scientific-query:ecv-t1:p4r:${sha256Digest(material)}`,
    query: p4.query,
    dataPresent: Object.freeze({
      assertionCount: applicableAssertions.length,
      evidenceLinkCount: evidenceLinks.length,
      sourceCount: sources.length,
      fullTextSourceCount: sources.filter((source) => !source.metadata.abstractOnly).length,
      abstractOnlySourceCount: sources.filter((source) => source.metadata.abstractOnly).length,
      contextCount: unique(applicableAssertions.map((assertion) => assertion.context?.contextId)).length,
    }),
    dataAbsent: Object.freeze(missingData),
    applicableAssertions: Object.freeze(applicableAssertions),
    outOfContextAssertions: Object.freeze(outOfContextAssertions),
    evidenceLinks: Object.freeze(evidenceLinks),
    primarySources: Object.freeze(sources.filter((source) => primaryEvidenceTypes.has(source.metadata.evidenceSourceType)).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    secondarySources: Object.freeze(sources.filter((source) => !primaryEvidenceTypes.has(source.metadata.evidenceSourceType)).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    fullTextSources: Object.freeze(sources.filter((source) => !source.metadata.abstractOnly).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    abstractOnlySources: Object.freeze(sources.filter((source) => source.metadata.abstractOnly).sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    reviewDecisions: Object.freeze(reviewDecisions),
    contradictionAssessments: Object.freeze(contradictionAssessments),
    unresolvedElements: Object.freeze(unique([...missingData, ...contradictionAssessments.map((item) => `${item.finalClassification}:${item.contradictionId}`)])),
    deterministicDigest: sha256Digest(material),
    statisticalMetaAnalysisPerformed: false,
    approximationUsed: false,
    generatedEditorialText: false,
  });
};

const detectConsensus = (result) => {
  const sources = [...result.primarySources, ...result.secondarySources];
  const official = sources.filter((source) => ["CONSENSUS", "GUIDELINE"].includes(source.metadata.evidenceSourceType));
  const current = official.filter((source) => ["CURRENT", "CORRECTED"].includes(source.metadata.documentStatus));
  const officialRefutations = result.evidenceLinks.filter((link) => link.relationType === "REFUTES" && current.some((source) => source.revisionId === link.sourceRevisionId));
  const detected = current.length > 0 && officialRefutations.length === 0;
  return Object.freeze({
    detected,
    state: detected ? "CURRENT_CONSENSUS" : "NO_EXPLICIT_CURRENT_CONSENSUS",
    ruleId: "P4R_CURRENT_CONSENSUS_V1",
    rule: Object.freeze({
      requiresCurrentOfficialConsensusOrGuideline: true,
      requiresKnownVersionAndDate: true,
      forbidsEquivalentOfficialRefutationInSameContext: true,
      preservesLimitations: true,
      rawPublicationCountIgnored: true,
      scope: "CONSOLIDATED_ECV_T1_CORPUS_AS_OF_2026_08_01",
    }),
    sourceRevisionIds: Object.freeze(current.map((source) => source.revisionId).sort()),
    excludedSupersededSourceRevisionIds: Object.freeze(official.filter((source) => source.metadata.documentStatus === "SUPERSEDED").map((source) => source.revisionId).sort()),
    officialRefutingEvidenceLinkIds: Object.freeze(officialRefutations.map((link) => link.evidenceLinkId).sort()),
  });
};

const convergenceState = (result, consensus) => {
  if (!result.applicableAssertions.length) return "INSUFFICIENT_EVIDENCE";
  if (result.contradictionAssessments.some((item) => item.finalClassification === "TRUE_CONTRADICTION")) return "CONTRADICTION";
  if (result.contradictionAssessments.length) return "CONTEXT_DEPENDENT_CONVERGENCE";
  if (consensus.detected) return "CURRENT_CONSENSUS";
  const modalities = unique(result.applicableAssertions.flatMap((assertion) => assertion.facets?.modalities ?? []));
  if (modalities.length > 1) return "CONTEXT_DEPENDENT_CONVERGENCE";
  if (result.dataPresent.sourceCount > 1) return "PARTIAL_CONVERGENCE";
  return "INSUFFICIENT_EVIDENCE";
};

export const createP4RScientificSynthesis = (definition) => {
  const result = queryConsolidatedScientificCorpus(definition.query);
  const consensus = detectConsensus(result);
  const requiredDimensionGaps = definition.requiredDimensions.filter((dimension) => !result.applicableAssertions.some((assertion) => assertion.context?.dimensions?.some((item) => item.dimension === dimension))).map((dimension) => `MISSING_CONTEXT:${dimension}`);
  const explicitPilotGaps = [
    ...(definition.key === "ct-ecv" || definition.key === "ecv-mr-versus-ct" ? ["CT_ECV_INTERSITE_REPRODUCIBILITY_NOT_DOCUMENTED"] : []),
  ];
  const limitations = unique([
    ...result.applicableAssertions.flatMap((assertion) => assertion.facets?.limitations ?? []),
    ...result.evidenceLinks.flatMap((link) => link.limitations ?? []),
    ...(result.abstractOnlySources.length ? ["ABSTRACT_ONLY_EVIDENCE_REMAINS_VISIBLE"] : []),
  ]);
  const questions = unique([...result.dataAbsent, ...requiredDimensionGaps, ...explicitPilotGaps]);
  const material = {
    key: definition.key,
    queryDigest: result.deterministicDigest,
    assertionRevisionIds: result.applicableAssertions.map((item) => item.revisionId),
    evidenceLinkIds: result.evidenceLinks.map((item) => item.evidenceLinkId),
    consensus,
    questions,
  };
  const reviewCounts = Object.fromEntries(["AUTOMATED_REVIEW_PASSED", "AUTOMATED_REVIEW_QUALIFIED", "AUTOMATED_REVIEW_CONTESTED", "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE", "AUTOMATED_REVIEW_REJECTED"].map((decision) => [decision, result.reviewDecisions.filter((item) => item.decision === decision).length]));
  return Object.freeze({
    synthesisId: `noxia:radiology:scientific-synthesis:ecv-t1:p4r:${definition.key}:${sha256Digest(material)}`,
    key: definition.key,
    label: definition.label,
    synthesisType: "STRUCTURED_LITERATURE_SYNTHESIS_NOT_META_ANALYSIS",
    query: result.query,
    concepts: Object.freeze(unique(result.applicableAssertions.flatMap((assertion) => assertion.facets?.concepts ?? []))),
    applicableAssertions: result.applicableAssertions,
    favorableAssertions: Object.freeze(result.applicableAssertions.filter((assertion) => assertion.polarity === "POSITIVE")),
    unfavorableAssertions: Object.freeze(result.applicableAssertions.filter((assertion) => assertion.polarity === "NEGATIVE")),
    qualifiedAssertions: Object.freeze(result.applicableAssertions.filter((assertion) => ["QUALIFIED", "CONTESTED"].includes(assertion.reviewState) || assertion.polarity === "QUALIFIED")),
    contestedAssertions: Object.freeze(result.applicableAssertions.filter((assertion) => assertion.reviewState === "CONTESTED")),
    sourcesConsidered: Object.freeze([...result.primarySources, ...result.secondarySources].sort((a, b) => a.revisionId.localeCompare(b.revisionId))),
    fullTextSources: result.fullTextSources,
    abstractOnlySources: result.abstractOnlySources,
    evidenceLinks: result.evidenceLinks,
    reviewCounts: Object.freeze(reviewCounts),
    contexts: Object.freeze(result.applicableAssertions.map((assertion) => assertion.context).filter(Boolean)),
    limitations: Object.freeze(limitations),
    contradictions: result.contradictionAssessments,
    convergence: Object.freeze({ state: convergenceState(result, consensus), ruleId: "P4R_CONTEXT_FIRST_CONVERGENCE_V1", publicationMajorityUsed: false }),
    consensus,
    openQuestions: Object.freeze(questions),
    history: Object.freeze({
      sourcePublicationYears: Object.freeze(unique([...result.primarySources, ...result.secondarySources].map((source) => source.publicationDate?.slice(0, 4)))),
      documentaryStatuses: Object.freeze(unique([...result.primarySources, ...result.secondarySources].map((source) => source.metadata.documentStatus))),
    }),
    confidence: reviewCounts.AUTOMATED_REVIEW_REJECTED || reviewCounts.AUTOMATED_REVIEW_INSUFFICIENT_SOURCE
      ? "INSUFFICIENT"
      : reviewCounts.AUTOMATED_REVIEW_CONTESTED
        ? "CONTEXT_DEPENDENT"
        : result.dataPresent.sourceCount >= 2
          ? "MODERATE"
          : result.dataPresent.sourceCount === 1
            ? "LOW"
            : "UNKNOWN",
    missingData: Object.freeze(questions),
    automatedScientificReview: true,
    scientificHumanReview: null,
    deterministicDigest: sha256Digest(material),
    generatedEditorialText: false,
    statisticalMetaAnalysisPerformed: false,
    publicPublicationReady: false,
  });
};

export const p4rScientificSyntheses = Object.freeze(synthesisDefinitions.map(createP4RScientificSynthesis).sort((a, b) => a.key.localeCompare(b.key)));
export const p4rSynthesisByKey = Object.freeze(Object.fromEntries(p4rScientificSyntheses.map((synthesis) => [synthesis.key, synthesis])));

const mapP4Projection = (before) => {
  const synthesis = p4rSynthesisByKey[before.synthesisKey];
  const assertions = before.assertions.map((revisionId) => consolidatedAssertionRevisions.find((item) => item.supersedesRevisionId === revisionId)?.revisionId).filter(Boolean).sort();
  const evidence = before.evidence.map((evidenceLinkId) => p4rEvidenceByPreviousId.get(evidenceLinkId)?.evidenceLinkId).filter(Boolean).sort();
  const sourceRevisionIds = before.sourceRevisionIds.map((revisionId) => mapSource({ revisionId })?.revisionId).filter(Boolean).sort();
  const material = { key: before.key, synthesisDigest: synthesis.deterministicDigest, assertions, evidence, sourceRevisionIds, guards: P4R_PUBLICATION_GUARDS };
  return Object.freeze({
    ...before,
    projectionId: `noxia:radiology:internal-projection:ecv-t1:p4r:${before.key}:${sha256Digest(material)}`,
    projectionType: "P4R_INTERNAL_SCIENTIFIC_PROJECTION",
    deterministicDigest: sha256Digest(material),
    assertions: Object.freeze(assertions),
    evidence: Object.freeze(evidence),
    sourceRevisionIds: Object.freeze(sourceRevisionIds),
    contradictions: synthesis.contradictions,
    convergence: synthesis.convergence,
    consensus: synthesis.consensus,
    openQuestions: synthesis.openQuestions,
    confidence: synthesis.confidence,
    gaps: Object.freeze(unique([...synthesis.missingData, ...(synthesis.abstractOnlySources.length ? ["ABSTRACT_ONLY_EVIDENCE_VISIBLE"] : []), "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"])),
    automatedScientificReview: true,
    scientificHumanReview: null,
    structureOnly: true,
    prose: null,
    ...P4R_PUBLICATION_GUARDS,
  });
};

export const p4rInternalScientificProjections = Object.freeze(p4InternalScientificProjections.map(mapP4Projection).sort((a, b) => a.key.localeCompare(b.key)));

export const p4rReadinessRules = Object.freeze({
  catalogReady: Object.freeze({ requiredFields: ["stableId", "type", "sourceRefs"], blockers: ["MISSING_IDENTITY", "MISSING_SOURCE"] }),
  scientificReady: Object.freeze({ requiredFields: ["atomicAssertion", "localizedEvidence", "automatedScientificReview"], blockers: ["NO_ASSERTION", "NO_EVIDENCE", "AUTOMATED_REVIEW_REJECTED", "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE"] }),
  provenanceReady: Object.freeze({ requiredFields: ["sourceRevision", "locator", "retrievedAt", "digest"], blockers: ["NO_SOURCE_REVISION", "MISSING_LOCATOR"], warnings: ["ABSTRACT_ONLY"] }),
  synthesisReady: Object.freeze({ requiredFields: ["deterministicQuery", "evidenceLinkedAssertions", "visibleGaps"], blockers: ["EMPTY_SYNTHESIS", "NON_DETERMINISTIC", "UNLINKED_ASSERTION"] }),
  editorialProjectionReady: Object.freeze({ requiredFields: ["scientificReady", "provenanceReady", "synthesisReady", "visibleLimitations"], blockers: ["SCIENTIFIC_BLOCKER", "PROVENANCE_BLOCKER", "SYNTHESIS_BLOCKER"], warnings: ["NO_SCIENTIFIC_HUMAN_REVIEW", "CONTEXT_LIMITED"] }),
  seoReady: Object.freeze({ requiredFields: ["editorialApproval", "metadataReview", "publicRouteDecision"], blockers: ["P4R_SEO_OUT_OF_SCOPE", "NO_EDITORIAL_APPROVAL"] }),
  publicPublicationReady: Object.freeze({ requiredFields: ["separatePublicationDecision", "editorialApproval", "seoApproval"], blockers: ["P4R_PUBLICATION_FORBIDDEN", "NO_PUBLICATION_DECISION", "NO_EDITORIAL_APPROVAL"], warnings: ["NO_SCIENTIFIC_HUMAN_REVIEW"] }),
});

const assessment = (ready, blockingErrors, warnings, justification) => Object.freeze({ ready, blockingErrors: Object.freeze(blockingErrors), warnings: Object.freeze(warnings), justification });
const p4rEvidenceByAssertion = new Map();
for (const link of consolidatedEvidenceLinks) p4rEvidenceByAssertion.set(link.assertionRevisionId, [...(p4rEvidenceByAssertion.get(link.assertionRevisionId) ?? []), link]);

const readinessForConcept = (identity) => {
  const revision = scientificCorpusEntityRevisions.find((item) => item.stableId === identity.stableId);
  const assertions = consolidatedAssertionRevisions.filter((assertion) => assertion.subjectEntityId === identity.stableId || assertion.objectEntityId === identity.stableId || (assertion.facets?.concepts ?? []).includes(identity.stableId));
  const links = assertions.flatMap((assertion) => p4rEvidenceByAssertion.get(assertion.revisionId) ?? []);
  const reviews = assertions.map((assertion) => p4rReviewByAssertionId.get(assertion.revisionId)).filter(Boolean);
  const syntheses = p4rScientificSyntheses.filter((synthesis) => synthesis.concepts.includes(identity.stableId));
  const catalogBlockers = [...(!identity.stableId ? ["MISSING_IDENTITY"] : []), ...(!revision?.sourceRefs?.length ? ["MISSING_SOURCE"] : [])];
  const scientificBlockers = [...(!assertions.length ? ["NO_ASSERTION"] : []), ...(!links.length ? ["NO_EVIDENCE"] : []), ...(reviews.some((review) => review.decision === "AUTOMATED_REVIEW_REJECTED") ? ["AUTOMATED_REVIEW_REJECTED"] : []), ...(reviews.some((review) => review.decision === "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE") ? ["AUTOMATED_REVIEW_INSUFFICIENT_SOURCE"] : [])];
  const provenanceBlockers = [...(!revision?.sourceRefs?.length ? ["NO_SOURCE_REVISION"] : []), ...(links.some((link) => !link.locator) ? ["MISSING_LOCATOR"] : [])];
  const synthesisBlockers = !syntheses.length ? ["EMPTY_SYNTHESIS"] : [];
  const editorialBlockers = [...scientificBlockers.map(() => "SCIENTIFIC_BLOCKER"), ...provenanceBlockers.map(() => "PROVENANCE_BLOCKER"), ...synthesisBlockers.map(() => "SYNTHESIS_BLOCKER")];
  return Object.freeze({
    subjectId: identity.stableId,
    subjectType: "CONCEPT",
    catalogReady: assessment(!catalogBlockers.length, catalogBlockers, revision?.unresolvedFields?.length ? ["UNRESOLVED_FIELDS"] : [], "Stable identity and source-backed concept revision assessed."),
    scientificReady: assessment(!scientificBlockers.length, scientificBlockers, reviews.some((review) => review.decision === "AUTOMATED_REVIEW_CONTESTED") ? ["CONTESTED_ASSERTION"] : [], "Scientific readiness uses localized evidence and automated P4R review; it does not claim expert validation."),
    provenanceReady: assessment(!provenanceBlockers.length, provenanceBlockers, links.some((link) => p4rSourceByRevisionId.get(link.sourceRevisionId)?.metadata.abstractOnly) ? ["ABSTRACT_ONLY"] : [], "Versioned source and localized evidence checked."),
    synthesisReady: assessment(!scientificBlockers.length && !synthesisBlockers.length, [...scientificBlockers, ...synthesisBlockers], syntheses.flatMap((item) => item.openQuestions).length ? ["OPEN_QUESTIONS"] : [], "At least one deterministic synthesis must include the concept."),
    editorialProjectionReady: assessment(!editorialBlockers.length, unique(editorialBlockers), ["NO_SCIENTIFIC_HUMAN_REVIEW", ...(reviews.some((review) => review.decision !== "AUTOMATED_REVIEW_PASSED") ? ["CONTEXT_LIMITED"] : [])], "Eligibility means a future internal editorial structure may be built; it is not public approval."),
    seoReady: assessment(false, ["P4R_SEO_OUT_OF_SCOPE", "NO_EDITORIAL_APPROVAL"], [], "P4R does not perform SEO work."),
    publicPublicationReady: assessment(false, ["P4R_PUBLICATION_FORBIDDEN", "NO_PUBLICATION_DECISION", "NO_EDITORIAL_APPROVAL"], ["NO_SCIENTIFIC_HUMAN_REVIEW"], "Publication remains a separate future decision."),
  });
};

export const p4rConceptReadiness = Object.freeze(scientificCorpusConceptIdentities.map(readinessForConcept).sort((a, b) => a.subjectId.localeCompare(b.subjectId)));

const readinessForSynthesis = (synthesis) => {
  const reviewBlockers = [
    ...(synthesis.reviewCounts.AUTOMATED_REVIEW_REJECTED ? ["AUTOMATED_REVIEW_REJECTED"] : []),
    ...(synthesis.reviewCounts.AUTOMATED_REVIEW_INSUFFICIENT_SOURCE ? ["AUTOMATED_REVIEW_INSUFFICIENT_SOURCE"] : []),
  ];
  const blockers = [...(!synthesis.applicableAssertions.length ? ["EMPTY_SYNTHESIS"] : []), ...(!synthesis.deterministicDigest ? ["NON_DETERMINISTIC"] : []), ...reviewBlockers];
  return Object.freeze({
    subjectId: synthesis.synthesisId,
    subjectType: "SYNTHESIS",
    catalogReady: assessment(true, [], [], "Stable synthesis definition and digest are present."),
    scientificReady: assessment(!blockers.length, blockers, synthesis.reviewCounts.AUTOMATED_REVIEW_CONTESTED ? ["CONTESTED_ASSERTION"] : [], "Every included assertion has a consolidated automated review."),
    provenanceReady: assessment(!blockers.length, blockers, synthesis.abstractOnlySources.length ? ["ABSTRACT_ONLY"] : [], "All evidence retains a versioned source and locator."),
    synthesisReady: assessment(!blockers.length, blockers, [...(synthesis.openQuestions.length ? ["OPEN_QUESTIONS"] : []), ...(synthesis.contradictions.length ? ["CONTEXT_DIFFERENCES"] : [])], "The structured synthesis is deterministic and keeps gaps visible."),
    editorialProjectionReady: assessment(!blockers.length, blockers, ["NO_SCIENTIFIC_HUMAN_REVIEW", ...(synthesis.abstractOnlySources.length ? ["ABSTRACT_ONLY"] : [])], "A future internal editorial projection is structurally eligible; no public prose is approved."),
    seoReady: assessment(false, ["P4R_SEO_OUT_OF_SCOPE", "NO_EDITORIAL_APPROVAL"], [], "No SEO decision in P4R."),
    publicPublicationReady: assessment(false, ["P4R_PUBLICATION_FORBIDDEN", "NO_PUBLICATION_DECISION", "NO_EDITORIAL_APPROVAL"], ["NO_SCIENTIFIC_HUMAN_REVIEW"], "No public publication in P4R."),
  });
};

export const p4rSynthesisReadiness = Object.freeze(p4rScientificSyntheses.map(readinessForSynthesis).sort((a, b) => a.subjectId.localeCompare(b.subjectId)));

const readinessForProjection = (projection) => {
  const synthesis = p4rSynthesisByKey[projection.synthesisKey];
  const synthesisReadiness = p4rSynthesisReadiness.find((item) => item.subjectId === synthesis?.synthesisId);
  const exposure = projection.route !== null || projection.canonical !== null || projection.indexable || projection.inSitemap || projection.rendered || projection.publicNavigation;
  const blockers = [...(!synthesis ? ["MISSING_SYNTHESIS"] : []), ...(exposure ? ["PUBLIC_SURFACE_EXPOSURE"] : []), ...(projection.internalOnly !== true ? ["NOT_INTERNAL_ONLY"] : [])];
  const eligible = !blockers.length && synthesisReadiness?.scientificReady.ready && synthesisReadiness?.synthesisReady.ready;
  return Object.freeze({
    subjectId: projection.projectionId,
    subjectType: "INTERNAL_PROJECTION",
    catalogReady: assessment(Boolean(synthesis), synthesis ? [] : ["MISSING_SYNTHESIS"], [], "Backing synthesis identity checked."),
    scientificReady: assessment(Boolean(synthesisReadiness?.scientificReady.ready), synthesisReadiness?.scientificReady.blockingErrors ?? ["MISSING_SYNTHESIS"], ["NO_SCIENTIFIC_HUMAN_REVIEW"], "Scientific readiness is inherited from consolidated evidence."),
    provenanceReady: assessment(Boolean(synthesisReadiness?.provenanceReady.ready), synthesisReadiness?.provenanceReady.blockingErrors ?? ["MISSING_SYNTHESIS"], synthesisReadiness?.provenanceReady.warnings ?? [], "Projection references only consolidated graph objects."),
    synthesisReady: assessment(!blockers.length && Boolean(synthesisReadiness?.synthesisReady.ready), [...blockers, ...(synthesisReadiness?.synthesisReady.blockingErrors ?? [])], synthesis?.openQuestions.length ? ["OPEN_QUESTIONS"] : [], "Projection remains deterministic and internal."),
    editorialProjectionReady: assessment(Boolean(eligible), eligible ? [] : ["BACKING_SYNTHESIS_NOT_READY"], ["NO_SCIENTIFIC_HUMAN_REVIEW", "INTERNAL_STRUCTURE_ONLY"], "Eligible for a future editorial pilot structure, not for publication."),
    seoReady: assessment(false, ["P4R_SEO_OUT_OF_SCOPE", "NO_EDITORIAL_APPROVAL"], [], "No SEO projection in P4R."),
    publicPublicationReady: assessment(false, ["P4R_PUBLICATION_FORBIDDEN", "NO_PUBLICATION_DECISION", "NO_EDITORIAL_APPROVAL"], ["NO_SCIENTIFIC_HUMAN_REVIEW"], "Projection is unrouted, non-indexable and non-public."),
  });
};

export const p4rProjectionReadiness = Object.freeze(p4rInternalScientificProjections.map(readinessForProjection).sort((a, b) => a.subjectId.localeCompare(b.subjectId)));

const summarize = (records) => Object.freeze(Object.fromEntries(Object.keys(p4rReadinessRules).map((key) => [key, records.filter((item) => item[key].ready).length])));

export const p4rReadinessSummary = Object.freeze({
  concepts: summarize(p4rConceptReadiness),
  syntheses: summarize(p4rSynthesisReadiness),
  projections: summarize(p4rProjectionReadiness),
  publicPublicationReady: false,
  humanReviewAloneIsBlocking: false,
  scoreUsed: false,
});

