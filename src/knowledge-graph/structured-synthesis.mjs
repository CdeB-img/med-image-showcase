import { sha256Digest } from "./migration/stable-json.mjs";

const sortedBy = (values, key) => [...values].sort((left, right) => String(left[key]).localeCompare(String(right[key])));
const uniqueSorted = (values) => [...new Set(values.filter((value) => value !== null && value !== undefined))].sort((left, right) => String(left).localeCompare(String(right)));

const matchesQuery = (assertion, query) => {
  if (query.subjectEntityIds?.length > 0 && !query.subjectEntityIds.includes(assertion.subjectEntityId)) return false;
  if (query.predicates?.length > 0 && !query.predicates.includes(assertion.predicate)) return false;
  if (query.assertionTypes?.length > 0 && !query.assertionTypes.includes(assertion.assertionType)) return false;
  return true;
};

export const createStructuredLiteratureSynthesis = ({
  query = {},
  assertionRevisions = [],
  evidenceLinks = [],
  sourceRevisions = [],
  consensusRule = null,
} = {}) => {
  const applicableAssertions = sortedBy(assertionRevisions.filter((assertion) => matchesQuery(assertion, query)), "revisionId");
  const applicableIds = new Set(applicableAssertions.map((assertion) => assertion.revisionId));
  const applicableEvidence = sortedBy(evidenceLinks.filter((link) => applicableIds.has(link.assertionRevisionId)), "evidenceLinkId");
  const evidenceByAssertion = new Map();
  for (const link of applicableEvidence) {
    const links = evidenceByAssertion.get(link.assertionRevisionId) ?? [];
    links.push(link);
    evidenceByAssertion.set(link.assertionRevisionId, links);
  }
  const favorableAssertions = applicableAssertions.filter((assertion) => assertion.polarity === "POSITIVE" || (evidenceByAssertion.get(assertion.revisionId) ?? []).some((link) => link.relationType === "SUPPORTS"));
  const unfavorableAssertions = applicableAssertions.filter((assertion) => assertion.polarity === "NEGATIVE" || (evidenceByAssertion.get(assertion.revisionId) ?? []).some((link) => link.relationType === "REFUTES"));
  const qualifications = applicableEvidence.filter((link) => link.relationType === "QUALIFIES");
  const contradictions = applicableAssertions.flatMap((assertion) => {
    const links = evidenceByAssertion.get(assertion.revisionId) ?? [];
    const supports = links.filter((link) => link.relationType === "SUPPORTS").map((link) => link.evidenceLinkId).sort();
    const refutes = links.filter((link) => link.relationType === "REFUTES").map((link) => link.evidenceLinkId).sort();
    return supports.length > 0 && refutes.length > 0 ? [{ assertionRevisionId: assertion.revisionId, supports, refutes }] : [];
  });
  const sourceIds = uniqueSorted(applicableEvidence.map((link) => link.sourceRevisionId));
  const sourceByRevisionId = new Map(sourceRevisions.map((source) => [source.revisionId, source]));
  const sources = sourceIds.map((sourceId) => sourceByRevisionId.get(sourceId)).filter(Boolean);
  const unsupportedAssertions = applicableAssertions.filter((assertion) => (evidenceByAssertion.get(assertion.revisionId) ?? []).length === 0).map((assertion) => assertion.revisionId);
  const explicitConsensusSources = consensusRule ? sources.filter((source) => consensusRule(source, applicableEvidence, applicableAssertions)) : [];
  const limitations = uniqueSorted([
    ...applicableAssertions.flatMap((assertion) => assertion.limitations ?? []),
    ...applicableEvidence.flatMap((link) => link.limitations ?? []),
  ]);
  const missingData = uniqueSorted([
    ...(applicableAssertions.length === 0 ? ["NO_APPLICABLE_ASSERTION"] : []),
    ...(applicableEvidence.length === 0 ? ["NO_REVIEWED_EVIDENCE_LINK"] : []),
    ...(unsupportedAssertions.length > 0 ? unsupportedAssertions.map((revisionId) => `NO_EVIDENCE_FOR:${revisionId}`) : []),
    ...(query.requiredContextDimensions ?? []).filter((dimension) => !applicableAssertions.some((assertion) => assertion.context?.dimensions?.some((item) => item.dimension === dimension))).map((dimension) => `MISSING_CONTEXT:${dimension}`),
  ]);
  const openQuestions = uniqueSorted([
    ...(contradictions.length > 0 ? ["UNRESOLVED_CONTRADICTION"] : []),
    ...(unsupportedAssertions.length > 0 ? ["UNSUPPORTED_ASSERTIONS_REQUIRE_REVIEW"] : []),
    ...(applicableAssertions.length === 0 ? ["SOURCED_ASSERTIONS_REQUIRED"] : []),
  ]);
  const confidenceValues = uniqueSorted(applicableAssertions.map((assertion) => assertion.confidence));
  const overallConfidence = applicableAssertions.length === 0 ? "UNKNOWN" : contradictions.length > 0 ? "CONTESTED" : confidenceValues.length === 1 ? confidenceValues[0] : "HETEROGENEOUS";
  const deterministicMaterial = {
    query,
    assertionRevisionIds: applicableAssertions.map((assertion) => assertion.revisionId),
    evidenceLinkIds: applicableEvidence.map((link) => link.evidenceLinkId),
    sourceRevisionIds: sourceIds,
  };
  return Object.freeze({
    synthesisId: `noxia:radiology:synthesis:web:${sha256Digest(deterministicMaterial)}`,
    synthesisType: "STRUCTURED_LITERATURE_SYNTHESIS",
    intendedSurfaces: Object.freeze(["EDITORIAL_PAGE", "LITERATURE_SYNTHESIS", "TECHNICAL_FACT_SHEET", "COMPARISON", "GLOSSARY", "NAVIGATION", "SEO", "KNOWLEDGE_STATE"]),
    query: Object.freeze({ ...query }),
    applicableAssertions: Object.freeze(applicableAssertions),
    favorableAssertions: Object.freeze(sortedBy(favorableAssertions, "revisionId")),
    unfavorableAssertions: Object.freeze(sortedBy(unfavorableAssertions, "revisionId")),
    qualifications: Object.freeze(qualifications),
    sources: Object.freeze(sortedBy(sources, "revisionId")),
    evidence: Object.freeze(applicableEvidence),
    evidenceDimensions: Object.freeze(applicableEvidence.map((link) => Object.freeze({ evidenceLinkId: link.evidenceLinkId, evidenceSourceType: link.evidenceSourceType, evidenceQuality: link.evidenceQuality, reviewerStatus: link.reviewerStatus }))),
    contexts: Object.freeze(applicableAssertions.map((assertion) => assertion.context).filter(Boolean)),
    limitations: Object.freeze(limitations),
    contradictions: Object.freeze(contradictions),
    consensus: Object.freeze({ detected: explicitConsensusSources.length > 0, ruleApplied: consensusRule !== null, sourceRevisionIds: explicitConsensusSources.map((source) => source.revisionId).sort(), reason: consensusRule === null ? "NO_EXPLICIT_CONSENSUS_RULE" : explicitConsensusSources.length === 0 ? "RULE_NOT_SATISFIED" : "EXPLICIT_RULE_SATISFIED" }),
    openQuestions: Object.freeze(openQuestions),
    history: Object.freeze({ assertionRevisionIds: applicableAssertions.map((assertion) => assertion.revisionId), sourceRevisionIds: sourceIds, evidenceLinkIds: applicableEvidence.map((link) => link.evidenceLinkId) }),
    overallConfidence,
    missingData: Object.freeze(missingData),
    statisticalMetaAnalysisPerformed: false,
    generatedEditorialText: false,
  });
};
