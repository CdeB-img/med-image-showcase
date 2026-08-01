import { sha256Digest } from "../../migration/stable-json.mjs";
import { createStructuredLiteratureSynthesis } from "../../structured-synthesis.mjs";
import { territoryAlignmentFor } from "../continuous-wave/territory-alignment.mjs";
import { P11_EXECUTED_AT, P11_PUBLICATION_GUARDS, P11_REVIEWER } from "./constants.mjs";
import { p11SourceVerification } from "./source-verification.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const digestRecord = (record) => freeze({ ...record, digest: sha256Digest({ ...record, digest: undefined }) });

const normalizeApplicabilityContext = (context, modality) => freeze({
  ...context,
  dimensions: context.dimensions.map((dimension) => {
    if (dimension.dimension !== "modality" || modality !== "NOT_APPLICABLE") return freeze(dimension);
    return freeze({ ...dimension, operator: "NOT_APPLICABLE", value: null });
  }),
});

const correctedPreparedAssertion = (assertion) => {
  if (assertion.domainId !== "t2-mapping" || assertion.key !== "three-t-bssfp-artifacts") return assertion;
  return {
    ...assertion,
    statement: { ...assertion.statement, text: "At 3 T, T2-prepared bSSFP is more susceptible to field-related artifacts." },
    facets: { ...assertion.facets, limitations: ["B0_B1_ARTIFACTS_AT_3T"] },
    limitations: ["B0_B1_ARTIFACTS_AT_3T"],
  };
};

const reviewedSource = (source) => {
  const verified = p11SourceVerification[source.pmid];
  if (!verified) throw new Error(`P11_SOURCE_VERIFICATION_MISSING:${source.pmid}`);
  const corrected = {
    ...source,
    recordType: "SourceRevision",
    publishedAt: verified.publicationDate,
    publicationDate: verified.publicationDate,
    authority: source.journal,
    url: verified.metadataUrl,
    officialMetadataUrl: verified.metadataUrl,
    officialFullTextUrl: verified.fullTextUrl,
    fullTextAvailability: verified.availability,
    abstractOnly: false,
    metadataAuthority: verified.metadataAuthority,
    fullTextAuthority: verified.fullTextAuthority,
    documentStatus: verified.documentStatus,
    correctionNoticeUrl: verified.correctionNoticeUrl,
    editorialCommentPmids: verified.editorialCommentPmids,
    retrievedAt: verified.verifiedAt,
    sourceVerificationDigest: verified.verificationDigest,
    authorsCompleteness: "COMPLETE_FROM_PUBMED",
    territoryAlignment: territoryAlignmentFor({ domainId: source.domainId, key: source.pmid, objectType: "SourceRevision" }),
  };
  return digestRecord(corrected);
};

const sourceIdentity = (source) => freeze({
  recordType: "SourceIdentity",
  stableId: source.stableId,
  sourceType: "SCIENTIFIC_PUBLICATION",
  canonicalUri: source.officialMetadataUrl,
  createdAt: P11_EXECUTED_AT,
  pmid: source.pmid,
  doi: source.doi,
});

const reviewedConcept = (concept, campaignManifest) => digestRecord({
  ...concept,
  campaignId: campaignManifest.campaignId,
  campaignDefinitionId: campaignManifest.campaignDefinitionId,
  campaignRevisionId: campaignManifest.campaignRevisionId,
  selectedNodeIds: campaignManifest.selectedNodeIds,
  status: "STRUCTURALLY_REVIEWED",
  territoryAlignment: territoryAlignmentFor({ domainId: concept.domainId, key: concept.key, objectType: "ScientificConceptRevision" }),
});

const reviewedAssertion = (preparedAssertion, campaignManifest) => {
  const assertion = correctedPreparedAssertion(preparedAssertion);
  const literalRequiresRetyping = assertion.objectEntityId === null && assertion.literalValue !== null && assertion.assertionType === "EntityObjectAssertion";
  const isQualified = assertion.polarity === "QUALIFIED" || assertion.polarity === "NEGATIVE" || assertion.reviewState === "QUALIFIED";
  return digestRecord({
    ...assertion,
    campaignId: campaignManifest.campaignId,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: campaignManifest.selectedNodeIds,
    context: normalizeApplicabilityContext(assertion.context, assertion.modality),
    assertionType: literalRequiresRetyping ? "LiteralValueAssertion" : assertion.assertionType,
    status: isQualified ? "QUALIFIED" : "PROVENANCE_REVIEWED",
    reviewState: isQualified ? "QUALIFIED" : "PROVENANCE_REVIEWED",
    reviewType: "automatedConsistencyReview",
    automatedStructuralReview: true,
    automatedProvenanceReview: true,
    automatedConsistencyReview: true,
    scientificHumanReview: null,
    humanReviewed: false,
    reviewer: P11_REVIEWER,
    territoryAlignment: territoryAlignmentFor({ domainId: assertion.domainId, key: assertion.key, objectType: "ScientificAssertionRevision" }),
  });
};

const assertionIdentity = (assertion) => freeze({
  recordType: "ScientificAssertionIdentity",
  stableId: assertion.stableId,
  assertionType: assertion.assertionType,
  createdAt: P11_EXECUTED_AT,
  sourceRefs: assertion.sourceRefs,
});

const reviewedEvidence = (preparedLink, assertions, campaignManifest) => {
  const assertion = assertions.find((item) => item.revisionId === preparedLink.assertionRevisionId);
  const narrowedT2 = assertion?.domainId === "t2-mapping" && assertion.key === "three-t-bssfp-artifacts";
  const analyticalSummary = narrowedT2
    ? "At 3 T, T2-prepared bSSFP is more susceptible to field-related artifacts."
    : preparedLink.extraction.analyticalSummary;
  return digestRecord({
    ...preparedLink,
    campaignId: campaignManifest.campaignId,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: campaignManifest.selectedNodeIds,
    extraction: freeze({
      ...preparedLink.extraction,
      passage: analyticalSummary,
      analyticalSummary,
      directAuthorStatement: false,
      sourceMeaningDirectlyExpressed: preparedLink.extraction.interpretationLevel === "DIRECT_STATEMENT",
      verbatimSourceTextRetained: false,
    }),
    applicability: assertion.context,
    limitations: narrowedT2 ? ["B0_B1_ARTIFACTS_AT_3T"] : preparedLink.limitations,
    reviewerStatus: assertion.status,
    reviewType: "automatedProvenanceReview",
    automatedStructuralReview: true,
    automatedProvenanceReview: true,
    automatedConsistencyReview: true,
    scientificHumanReview: null,
    reviewer: P11_REVIEWER,
    territoryAlignment: territoryAlignmentFor({ domainId: preparedLink.domainId, key: assertion.key, objectType: "EvidenceLink" }),
  });
};

const reviewedDecision = (preparedDecision, assertions, campaignManifest) => {
  const assertion = assertions.find((item) => item.revisionId === preparedDecision.assertionRevisionId);
  return digestRecord({
    ...preparedDecision,
    recordType: "AutomatedScientificReviewDecision",
    campaignId: campaignManifest.campaignId,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: campaignManifest.selectedNodeIds,
    reviewer: P11_REVIEWER,
    decision: assertion.status === "QUALIFIED" ? "AUTOMATED_REVIEW_QUALIFIED" : "AUTOMATED_REVIEW_PASSED",
    reviewType: "automatedConsistencyReview",
    automatedStructuralReview: true,
    automatedProvenanceReview: true,
    automatedConsistencyReview: true,
    automatedScientificReview: false,
    scientificHumanReview: null,
    previousStatus: "SOURCE_LOCALIZED",
    newStatus: assertion.status,
    territoryAlignment: assertion.territoryAlignment,
  });
};

const normalizedGaps = (domainPackage) => freeze(unique(domainPackage.gaps.map((gap) => gap === "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED" ? "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED" : gap)));

export const buildReviewedTerritorialDomainCorpus = ({ domainPackage, campaignManifest, existingRegistry } = {}) => {
  if (!domainPackage || domainPackage.nodeId !== campaignManifest.selectedNodeIds[0]) throw new Error("P11_REVIEWED_CORPUS_DOMAIN_MISMATCH");
  const existingSources = new Map(existingRegistry.sources.map((source) => [source.revisionId, source]));
  const supportingSources = freeze(domainPackage.retainedSources.map((source) => existingSources.get(source.revisionId) ?? reviewedSource(source)).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
  const sources = freeze(supportingSources.filter((source) => !existingSources.has(source.revisionId)));
  const sourceIdentities = freeze(sources.map(sourceIdentity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
  const concepts = freeze(domainPackage.concepts.map((item) => reviewedConcept(item, campaignManifest)).sort((a, b) => a.stableId.localeCompare(b.stableId)));
  const assertions = freeze(domainPackage.assertions.map((item) => reviewedAssertion(item, campaignManifest)).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
  const assertionIdentities = freeze(assertions.map(assertionIdentity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
  const evidenceLinks = freeze(domainPackage.evidenceLinks.map((item) => reviewedEvidence(item, assertions, campaignManifest)).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));
  const reviewDecisions = freeze(domainPackage.reviews.map((item) => reviewedDecision(item, assertions, campaignManifest)).sort((a, b) => a.decisionId.localeCompare(b.decisionId)));
  const contextDifferences = freeze(domainPackage.contextDifferences.map((item) => digestRecord({
    ...item,
    campaignId: campaignManifest.campaignId,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: campaignManifest.selectedNodeIds,
    territoryAlignment: territoryAlignmentFor({ domainId: item.domainId, key: item.contradictionId, objectType: "ScientificContextDifference" }),
  })));
  const baseSynthesis = createStructuredLiteratureSynthesis({
    query: { domainId: domainPackage.domainId, conceptIds: concepts.map((item) => item.stableId) },
    assertionRevisions: assertions,
    evidenceLinks,
    sourceRevisions: supportingSources,
  });
  const gaps = normalizedGaps(domainPackage);
  const preparedSynthesis = domainPackage.syntheses[0];
  const synthesis = freeze({
    ...baseSynthesis,
    recordType: "ScientificSynthesis",
    synthesisId: preparedSynthesis.synthesisId,
    key: preparedSynthesis.key,
    label: preparedSynthesis.label,
    domainId: domainPackage.domainId,
    campaignId: campaignManifest.campaignId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    territoryNodeId: territoryAlignmentFor({ domainId: domainPackage.domainId }).domainNodeId,
    concepts: freeze(concepts.map((item) => item.key)),
    contradictions: contextDifferences,
    convergence: freeze({ state: "CONTEXT_DEPENDENT_CONVERGENCE", rule: "Only method- and context-compatible assertions are grouped; publication counts never establish consensus.", publicationMajorityUsed: false }),
    openQuestions: gaps,
    missingData: gaps,
    generatedEditorialText: false,
    statisticalMetaAnalysisPerformed: false,
    scientificHumanReview: null,
    deterministicDigest: sha256Digest({ assertions: assertions.map((item) => item.digest), evidence: evidenceLinks.map((item) => item.digest), sources: supportingSources.map((item) => item.digest), gaps }),
  });
  const preparedProjection = domainPackage.projections[0];
  const projection = freeze({
    recordType: "InternalScientificProjection",
    projectionId: preparedProjection.projectionId,
    key: preparedProjection.key,
    label: preparedProjection.label,
    domainId: domainPackage.domainId,
    campaignId: campaignManifest.campaignId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    territoryNodeId: territoryAlignmentFor({ domainId: domainPackage.domainId }).domainNodeId,
    knowledgeNodeIds: freeze([domainPackage.nodeId, ...concepts.map((item) => item.stableId)].sort()),
    sourceIds: freeze(supportingSources.map((item) => item.revisionId)),
    assertionIds: freeze(assertions.map((item) => item.revisionId)),
    evidenceLinkIds: freeze(evidenceLinks.map((item) => item.evidenceLinkId)),
    synthesisIds: freeze([synthesis.synthesisId]),
    concepts: synthesis.concepts,
    assertions,
    evidenceLinks,
    sources: supportingSources,
    contexts: synthesis.contexts,
    limitations: synthesis.limitations,
    contradictions: contextDifferences,
    convergence: synthesis.convergence,
    questionsOpen: gaps,
    confidence: synthesis.overallConfidence,
    blockers: freeze([]),
    missingData: gaps,
    scientificHumanReview: null,
    prose: null,
    ...P11_PUBLICATION_GUARDS,
    deterministicDigest: sha256Digest({ synthesis: synthesis.deterministicDigest, guards: P11_PUBLICATION_GUARDS }),
  });
  const material = {
    campaignId: campaignManifest.campaignId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    sourceIdentities,
    sources,
    concepts,
    assertionIdentities,
    assertions,
    evidenceLinks,
    contextDifferences,
    reviewDecisions,
    syntheses: [synthesis],
    projections: [projection],
  };
  return freeze({
    status: "REVIEWED_CANDIDATE_READY_FOR_ATOMIC_EXECUTION",
    domainId: domainPackage.domainId,
    campaignId: campaignManifest.campaignId,
    supportingSourceIds: freeze(supportingSources.map((item) => item.revisionId)),
    reusedSourceIds: freeze(supportingSources.filter((source) => existingSources.has(source.revisionId)).map((item) => item.revisionId)),
    ...material,
    syntheses: freeze([synthesis]),
    projections: freeze([projection]),
    gaps,
    corpusDigest: sha256Digest(material),
  });
};

export const summarizeDomainCorrections = ({ preparedPackage, reviewedCorpus } = {}) => freeze({
  sourcesAdded: reviewedCorpus.sources.length,
  sourcesReused: reviewedCorpus.reusedSourceIds.length,
  assertionTypesCorrected: reviewedCorpus.assertions.filter((assertion) => preparedPackage.assertions.find((item) => item.revisionId === assertion.revisionId)?.assertionType !== assertion.assertionType).length,
  assertionStatementsNarrowed: reviewedCorpus.assertions.filter((assertion) => preparedPackage.assertions.find((item) => item.revisionId === assertion.revisionId)?.statement?.text !== assertion.statement?.text).length,
  applicabilityContextsCorrected: reviewedCorpus.assertions.filter((assertion) => JSON.stringify(preparedPackage.assertions.find((item) => item.revisionId === assertion.revisionId)?.context) !== JSON.stringify(assertion.context)).length,
  analyticalSummariesDisambiguatedFromVerbatimText: reviewedCorpus.evidenceLinks.filter((link) => link.extraction.verbatimSourceTextRetained === false).length,
  reviewRecordsCorrected: reviewedCorpus.reviewDecisions.length,
  publicArtifactsCreated: 0,
});

