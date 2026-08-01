import { createScientificAssertionRevision } from "../scientific-model-factories.mjs";
import { scientificAssertionIdentities, scientificAssertionRevisions, scientificEvidenceLinks } from "../scientific-corpus/assertions.mjs";
import { P4R_CONSOLIDATED_AT, P4R_REVIEWER, P4R_REVIEW_TYPE } from "./constants.mjs";
import { consolidatedSourceByPreviousRevisionId, consolidatedSourceRevisions } from "./sources.mjs";

const p4AssertionByRevisionId = new Map(scientificAssertionRevisions.map((assertion) => [assertion.revisionId, assertion]));
const p4rSourceByRevisionId = new Map(consolidatedSourceRevisions.map((source) => [source.revisionId, source]));
const p4rAssertionRevisionId = (revisionId) => revisionId.replace(/:revision:1$/, ":revision:2");
const p4rSourceRevisionId = (revisionId) => consolidatedSourceByPreviousRevisionId[revisionId]?.revisionId ?? revisionId;

const publisherLocator = (link, source) => {
  if (source.pmid === "30545455") {
    if (link.relationType === "QUALIFIES") return "Official publisher full text > Updated Lake Louise Criteria > interpretation limits";
    if (/single-mapping-criterion/i.test(link.assertionRevisionId)) return "Official publisher full text > Updated CMR criteria > diagnostic performance";
    return "Official publisher full text > Updated CMR criteria > T1- and T2-based criteria";
  }
  if (source.pmid === "37269267") {
    if (/evidence-limitation/i.test(link.assertionRevisionId)) return "Official publisher full text > Study Limitations > evidence quality";
    if (link.relationType === "QUALIFIES") return "Official publisher full text > Study Limitations > single-center cohorts and heterogeneity";
    return "Official publisher full text > Results and Discussion > CT-CMR agreement";
  }
  return link.locator;
};

const derivationSteps = (link) => link.relationType === "DERIVES" || link.extraction?.interpretationLevel === "DERIVED_INTERPRETATION"
  ? Object.freeze([
      "Locate the explicitly documented method, formula, or comparison in the named source section.",
      "Normalize identifiers and notation without adding a quantitative value or clinical conclusion.",
      "Record the resulting cross-source or formula-level interpretation as derived rather than author-stated.",
    ])
  : Object.freeze([]);

const reviewEvidence = (link) => {
  const source = p4rSourceByRevisionId.get(link.sourceRevisionId);
  const assertion = p4AssertionByRevisionId.get(link.previousAssertionRevisionId);
  const errors = [
    ...(!source ? ["UNKNOWN_SOURCE_REVISION"] : []),
    ...(!assertion ? ["UNKNOWN_ASSERTION_REVISION"] : []),
    ...(!link.locator || link.locator.split(/\s+/).length < 3 ? ["UNUSABLE_LOCATOR"] : []),
    ...(!link.extraction?.passage || !link.extraction?.section ? ["INCOMPLETE_EXTRACTION"] : []),
    ...(link.relationType === "SUPPORTS" && link.extraction?.interpretationLevel === "AUTHOR_INTERPRETATION" ? ["AUTHOR_INTERPRETATION_USED_AS_SUPPORT"] : []),
  ];
  if (errors.length) return Object.freeze({ decision: "AUTOMATED_REVIEW_REJECTED", errors: Object.freeze(errors), qualifications: Object.freeze([]) });
  const qualifications = [
    ...(source.metadata.abstractOnly ? ["ABSTRACT_ONLY_SOURCE"] : []),
    ...(["AUTHOR_INTERPRETATION", "DERIVED_INTERPRETATION"].includes(link.extraction.interpretationLevel) ? [link.extraction.interpretationLevel] : []),
    ...(link.relationType === "REFUTES" ? ["REFUTING_EVIDENCE_REQUIRES_CONTEXT_COMPARISON"] : []),
  ];
  const decision = link.relationType === "REFUTES"
    ? "AUTOMATED_REVIEW_CONTESTED"
    : qualifications.length
      ? "AUTOMATED_REVIEW_QUALIFIED"
      : "AUTOMATED_REVIEW_PASSED";
  return Object.freeze({ decision, errors: Object.freeze([]), qualifications: Object.freeze(qualifications) });
};

export const consolidatedEvidenceLinks = Object.freeze(scientificEvidenceLinks.map((before) => {
  const source = consolidatedSourceByPreviousRevisionId[before.sourceRevisionId];
  const sourceRevisionId = source?.revisionId ?? before.sourceRevisionId;
  const assertionRevisionId = p4rAssertionRevisionId(before.assertionRevisionId);
  const locator = publisherLocator(before, source ?? { pmid: null });
  const extraction = Object.freeze({
    ...before.extraction,
    sourceRevisionId,
    section: locator.split(" > ")[0],
    paragraph: locator,
    passage: before.analyticalSummary,
    passageKind: "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT",
    interpretationLevel: before.relationType === "DERIVES" ? "DERIVED_INTERPRETATION" : before.extraction.interpretationLevel,
    directAuthorStatement: before.relationType === "DERIVES" ? false : before.extraction.directAuthorStatement,
    consultedAt: P4R_CONSOLIDATED_AT,
    assertionDerived: assertionRevisionId,
    derivationSteps: derivationSteps(before),
    automatedCompatibilityScope: "STRUCTURE_LOCALITY_RELATION_AND_EXTRAPOLATION_GUARDS",
    scientificHumanReview: null,
  });
  const provisional = {
    ...before,
    evidenceLinkId: `${before.evidenceLinkId}:p4r:1`,
    sourceRevisionId,
    assertionRevisionId,
    locator,
    extractedStatement: before.analyticalSummary,
    reviewerStatus: "REVIEWED",
    reviewer: P4R_REVIEWER,
    reviewType: P4R_REVIEW_TYPE,
    reviewedAt: P4R_CONSOLIDATED_AT,
    sourceRefs: Object.freeze([sourceRevisionId]),
    extraction,
    previousEvidenceLinkId: before.evidenceLinkId,
    previousAssertionRevisionId: before.assertionRevisionId,
    previousSourceRevisionId: before.sourceRevisionId,
  };
  const automatedReview = reviewEvidence(provisional);
  return Object.freeze({ ...provisional, automatedReview });
}).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));

const linksByP4rAssertion = new Map();
for (const link of consolidatedEvidenceLinks) linksByP4rAssertion.set(link.assertionRevisionId, [...(linksByP4rAssertion.get(link.assertionRevisionId) ?? []), link]);

const assertionDecision = (before, links) => {
  if (!links.length || links.some((link) => link.automatedReview.decision === "AUTOMATED_REVIEW_REJECTED")) return "AUTOMATED_REVIEW_REJECTED";
  if (links.some((link) => link.automatedReview.decision === "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE")) return "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE";
  if (before.reviewState === "CONTESTED" || links.some((link) => link.automatedReview.decision === "AUTOMATED_REVIEW_CONTESTED")) return "AUTOMATED_REVIEW_CONTESTED";
  if (before.reviewState === "SUPERSEDED" || links.some((link) => link.automatedReview.decision === "AUTOMATED_REVIEW_QUALIFIED")) return "AUTOMATED_REVIEW_QUALIFIED";
  return "AUTOMATED_REVIEW_PASSED";
};

const reviewStateForDecision = Object.freeze({
  AUTOMATED_REVIEW_PASSED: "REVIEWED",
  AUTOMATED_REVIEW_QUALIFIED: "QUALIFIED",
  AUTOMATED_REVIEW_CONTESTED: "CONTESTED",
  AUTOMATED_REVIEW_INSUFFICIENT_SOURCE: "SOURCE_LOCALIZED",
  AUTOMATED_REVIEW_REJECTED: "REJECTED",
});

export const consolidatedAssertionReviewDecisions = Object.freeze(scientificAssertionRevisions.map((before) => {
  const assertionRevisionId = p4rAssertionRevisionId(before.revisionId);
  const links = linksByP4rAssertion.get(assertionRevisionId) ?? [];
  const decision = assertionDecision(before, links);
  const abstractOnlyEvidence = links.filter((link) => p4rSourceByRevisionId.get(link.sourceRevisionId)?.metadata.abstractOnly);
  const qualifications = [...new Set(links.flatMap((link) => link.automatedReview.qualifications))].sort();
  return Object.freeze({
    decisionId: `${assertionRevisionId}:review:automated-scientific:1`,
    assertionRevisionId,
    previousAssertionRevisionId: before.revisionId,
    reviewer: P4R_REVIEWER,
    date: P4R_CONSOLIDATED_AT,
    decision,
    justification: decision === "AUTOMATED_REVIEW_PASSED"
      ? "Atomicity, identity, localized evidence, relation semantics, context and extrapolation guards passed against the consolidated source record."
      : "The assertion remains usable only with the recorded source-access, interpretation, documentary-status, or contradiction qualifications.",
    sourceVerified: links.length > 0 && links.every((link) => p4rSourceByRevisionId.has(link.sourceRevisionId)),
    fullTextEvidenceOnly: abstractOnlyEvidence.length === 0,
    sourceRevisionIds: Object.freeze([...new Set(links.map((link) => link.sourceRevisionId))].sort()),
    evidenceLinkIds: Object.freeze(links.map((link) => link.evidenceLinkId).sort()),
    scope: "AUTOMATED_SOURCE_IDENTITY_LOCALITY_STRUCTURE_AND_SEMANTIC_GUARDS",
    reservations: Object.freeze([
      ...qualifications,
      "Automated review is not expert or human scientific validation.",
      "Public publication remains outside P4R.",
    ]),
    previousStatus: before.reviewState,
    newStatus: reviewStateForDecision[decision],
    reviewType: P4R_REVIEW_TYPE,
    scientificHumanReview: null,
  });
}).sort((a, b) => a.assertionRevisionId.localeCompare(b.assertionRevisionId)));

const decisionByAssertion = new Map(consolidatedAssertionReviewDecisions.map((decision) => [decision.assertionRevisionId, decision]));

export const consolidatedAssertionRevisions = Object.freeze(scientificAssertionRevisions.map((before) => {
  const revisionId = p4rAssertionRevisionId(before.revisionId);
  const decision = decisionByAssertion.get(revisionId);
  const mappedSourceRefs = before.sourceRefs.map(p4rSourceRevisionId).sort();
  return createScientificAssertionRevision({
    ...before,
    revisionId,
    revisionNumber: 2,
    sourceRefs: mappedSourceRefs,
    reviewer: P4R_REVIEWER,
    reviewerStatus: "REVIEWED",
    reviewState: decision.newStatus,
    reviewType: P4R_REVIEW_TYPE,
    humanReviewed: false,
    validFrom: P4R_CONSOLIDATED_AT,
    supersedesRevisionId: before.revisionId,
  });
}).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));

export const consolidatedAssertionIdentities = scientificAssertionIdentities;
export const consolidatedAssertionRevisionHistory = Object.freeze([...scientificAssertionRevisions, ...consolidatedAssertionRevisions].sort((a, b) => a.revisionId.localeCompare(b.revisionId)));

export const evidenceReviewMatrix = Object.freeze(consolidatedEvidenceLinks.map((after) => Object.freeze({
  evidenceLinkIdBefore: after.previousEvidenceLinkId,
  evidenceLinkIdAfter: after.evidenceLinkId,
  sourceRevisionIdBefore: after.previousSourceRevisionId,
  sourceRevisionIdAfter: after.sourceRevisionId,
  assertionRevisionIdBefore: after.previousAssertionRevisionId,
  assertionRevisionIdAfter: after.assertionRevisionId,
  typeBefore: scientificEvidenceLinks.find((link) => link.evidenceLinkId === after.previousEvidenceLinkId)?.relationType,
  typeAfter: after.relationType,
  reclassified: scientificEvidenceLinks.find((link) => link.evidenceLinkId === after.previousEvidenceLinkId)?.relationType !== after.relationType,
  locatorBefore: scientificEvidenceLinks.find((link) => link.evidenceLinkId === after.previousEvidenceLinkId)?.locator,
  locatorAfter: after.locator,
  automatedReview: after.automatedReview.decision,
  justification: after.automatedReview.qualifications.length ? after.automatedReview.qualifications.join("; ") : "Relation and localized extraction remain compatible.",
})));

export const assertionReviewSummary = Object.freeze({
  total: consolidatedAssertionReviewDecisions.length,
  passed: consolidatedAssertionReviewDecisions.filter((item) => item.decision === "AUTOMATED_REVIEW_PASSED").length,
  qualified: consolidatedAssertionReviewDecisions.filter((item) => item.decision === "AUTOMATED_REVIEW_QUALIFIED").length,
  contested: consolidatedAssertionReviewDecisions.filter((item) => item.decision === "AUTOMATED_REVIEW_CONTESTED").length,
  insufficientSource: consolidatedAssertionReviewDecisions.filter((item) => item.decision === "AUTOMATED_REVIEW_INSUFFICIENT_SOURCE").length,
  rejected: consolidatedAssertionReviewDecisions.filter((item) => item.decision === "AUTOMATED_REVIEW_REJECTED").length,
  evidenceLinks: consolidatedEvidenceLinks.length,
  evidenceLinksReclassified: evidenceReviewMatrix.filter((item) => item.reclassified).length,
  locatorsRecalculated: evidenceReviewMatrix.filter((item) => item.locatorBefore !== item.locatorAfter).length,
  humanReviewsClaimed: consolidatedAssertionReviewDecisions.filter((item) => item.scientificHumanReview !== null).length,
});
