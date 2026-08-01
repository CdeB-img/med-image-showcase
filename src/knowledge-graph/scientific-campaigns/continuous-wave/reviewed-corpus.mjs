import { sha256Digest } from "../../migration/stable-json.mjs";
import { createStructuredLiteratureSynthesis } from "../../structured-synthesis.mjs";
import {
  P10_CAMPAIGN_ID,
  P10_EXECUTED_AT,
  P10_PUBLICATION_GUARDS,
  P10_REVIEWER,
  P10_SELECTED_DOMAIN_ID,
  P10_SELECTED_NODE_ID,
} from "./constants.mjs";
import { segmentationSourceVerification } from "./segmentation-source-verification.mjs";
import { territoryAlignmentFor } from "./territory-alignment.mjs";

const freeze = (value) => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, freeze(nested)])));
};
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

const normalizeApplicabilityContext = (context, modality) => freeze({
  ...context,
  dimensions: context.dimensions.map((dimension) => {
    if (dimension.dimension !== "modality" || modality !== "NOT_APPLICABLE") return freeze(dimension);
    return freeze({ ...dimension, operator: "NOT_APPLICABLE", value: null });
  }),
});

const reviewedSource = (source) => {
  const verified = segmentationSourceVerification[source.pmid];
  const corrected = {
    ...source,
    recordType: "SourceRevision",
    publishedAt: verified.publicationDate,
    publicationDate: verified.publicationDate,
    sourceType: source.pmid === "38347141" ? "DELPHI_METHOD_FRAMEWORK" : source.sourceType,
    authority: source.journal,
    url: verified.metadataUrl,
    officialMetadataUrl: verified.metadataUrl,
    officialFullTextUrl: verified.fullTextUrl,
    fullTextAvailability: verified.availability,
    metadataAuthority: verified.metadataAuthority,
    documentStatus: verified.documentStatus,
    retrievedAt: verified.verifiedAt,
    sourceVerificationDigest: verified.verificationDigest,
    territoryAlignment: territoryAlignmentFor({ domainId: P10_SELECTED_DOMAIN_ID, key: source.pmid, objectType: "SourceRevision" }),
  };
  return freeze({ ...corrected, digest: sha256Digest({ ...corrected, digest: undefined }) });
};

const sourceIdentity = (source) => freeze({
  recordType: "SourceIdentity",
  stableId: source.stableId,
  sourceType: "SCIENTIFIC_PUBLICATION",
  canonicalUri: source.officialMetadataUrl,
  createdAt: P10_EXECUTED_AT,
  pmid: source.pmid,
  doi: source.doi,
});

const reviewedConcept = (concept, campaignManifest) => {
  const corrected = {
    ...concept,
    campaignId: P10_CAMPAIGN_ID,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: [P10_SELECTED_NODE_ID],
    status: "STRUCTURALLY_REVIEWED",
    territoryAlignment: territoryAlignmentFor({ domainId: concept.domainId, key: concept.key, objectType: "ScientificConceptRevision" }),
  };
  return freeze({ ...corrected, digest: sha256Digest({ ...corrected, digest: undefined }) });
};

const reviewedAssertion = (assertion, campaignManifest) => {
  const literalRequiresRetyping = assertion.objectEntityId === null && assertion.literalValue !== null && assertion.assertionType === "EntityObjectAssertion";
  const isQualified = assertion.polarity === "QUALIFIED" || assertion.polarity === "NEGATIVE" || assertion.reviewState === "QUALIFIED";
  const corrected = {
    ...assertion,
    campaignId: P10_CAMPAIGN_ID,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: [P10_SELECTED_NODE_ID],
    context: normalizeApplicabilityContext(assertion.context, assertion.modality),
    assertionType: literalRequiresRetyping ? "LiteralValueAssertion" : assertion.assertionType,
    scientificMaturity: assertion.scientificMaturity === "CONSENSUS_RECOMMENDATION" ? "DELPHI_FRAMEWORK_RECOMMENDATION" : assertion.scientificMaturity,
    status: isQualified ? "QUALIFIED" : "PROVENANCE_REVIEWED",
    reviewState: isQualified ? "QUALIFIED" : "PROVENANCE_REVIEWED",
    reviewType: "automatedConsistencyReview",
    automatedStructuralReview: true,
    automatedProvenanceReview: true,
    automatedConsistencyReview: true,
    scientificHumanReview: null,
    humanReviewed: false,
    reviewer: P10_REVIEWER,
    territoryAlignment: territoryAlignmentFor({ domainId: assertion.domainId, key: assertion.key, objectType: "ScientificAssertionRevision" }),
  };
  return freeze({ ...corrected, digest: sha256Digest({ ...corrected, digest: undefined }) });
};

const assertionIdentity = (assertion) => freeze({
  recordType: "ScientificAssertionIdentity",
  stableId: assertion.stableId,
  assertionType: assertion.assertionType,
  createdAt: P10_EXECUTED_AT,
  sourceRefs: assertion.sourceRefs,
});

const reviewedEvidence = (link, assertions, campaignManifest) => {
  const assertion = assertions.find((item) => item.revisionId === link.assertionRevisionId);
  const corrected = {
    ...link,
    campaignId: P10_CAMPAIGN_ID,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: [P10_SELECTED_NODE_ID],
    extraction: freeze({
      ...link.extraction,
      directAuthorStatement: false,
      sourceMeaningDirectlyExpressed: link.extraction.interpretationLevel === "DIRECT_STATEMENT",
      verbatimSourceTextRetained: false,
    }),
    applicability: assertion.context,
    reviewerStatus: assertion.status,
    reviewType: "automatedProvenanceReview",
    automatedStructuralReview: true,
    automatedProvenanceReview: true,
    automatedConsistencyReview: true,
    scientificHumanReview: null,
    reviewer: P10_REVIEWER,
    territoryAlignment: territoryAlignmentFor({ domainId: link.domainId, key: assertion.key, objectType: "EvidenceLink" }),
  };
  return freeze({ ...corrected, digest: sha256Digest({ ...corrected, digest: undefined }) });
};

const reviewedDecision = (decision, assertions, campaignManifest) => {
  const assertion = assertions.find((item) => item.revisionId === decision.assertionRevisionId);
  const corrected = {
    ...decision,
    recordType: "AutomatedScientificReviewDecision",
    campaignId: P10_CAMPAIGN_ID,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: [P10_SELECTED_NODE_ID],
    reviewer: P10_REVIEWER,
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
  };
  return freeze({ ...corrected, digest: sha256Digest({ ...corrected, digest: undefined }) });
};

export const buildReviewedSegmentationCorpus = ({ domainPackage, campaignManifest } = {}) => {
  if (domainPackage?.domainId !== P10_SELECTED_DOMAIN_ID) throw new Error("P10_REVIEWED_CORPUS_DOMAIN_INVALID");
  const sources = freeze(domainPackage.retainedSources.map(reviewedSource).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
  const sourceIdentities = freeze(sources.map(sourceIdentity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
  const concepts = freeze(domainPackage.concepts.map((item) => reviewedConcept(item, campaignManifest)).sort((a, b) => a.stableId.localeCompare(b.stableId)));
  const assertions = freeze(domainPackage.assertions.map((item) => reviewedAssertion(item, campaignManifest)).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
  const assertionIdentities = freeze(assertions.map(assertionIdentity).sort((a, b) => a.stableId.localeCompare(b.stableId)));
  const evidenceLinks = freeze(domainPackage.evidenceLinks.map((item) => reviewedEvidence(item, assertions, campaignManifest)).sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));
  const reviewDecisions = freeze(domainPackage.reviews.map((item) => reviewedDecision(item, assertions, campaignManifest)).sort((a, b) => a.decisionId.localeCompare(b.decisionId)));
  const contextDifferences = freeze(domainPackage.contextDifferences.map((item) => freeze({
    ...item,
    campaignId: P10_CAMPAIGN_ID,
    campaignDefinitionId: campaignManifest.campaignDefinitionId,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    selectedNodeIds: [P10_SELECTED_NODE_ID],
    territoryAlignment: territoryAlignmentFor({ domainId: item.domainId, key: item.contradictionId, objectType: "ScientificContextDifference" }),
  })));
  const baseSynthesis = createStructuredLiteratureSynthesis({
    query: { domainId: P10_SELECTED_DOMAIN_ID, conceptIds: concepts.map((item) => item.stableId) },
    assertionRevisions: assertions,
    evidenceLinks,
    sourceRevisions: sources,
  });
  const gaps = freeze(["TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED", "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED"]);
  const synthesis = freeze({
    ...baseSynthesis,
    recordType: "ScientificSynthesis",
    synthesisId: "noxia:radiology:scientific-synthesis:territorial-wave:segmentation:state-of-knowledge",
    key: "segmentation-state-of-knowledge",
    domainId: P10_SELECTED_DOMAIN_ID,
    campaignId: P10_CAMPAIGN_ID,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    territoryNodeId: territoryAlignmentFor({ domainId: P10_SELECTED_DOMAIN_ID }).domainNodeId,
    concepts: freeze(concepts.map((item) => item.key)),
    contradictions: contextDifferences,
    convergence: freeze({ state: "CONTEXT_DEPENDENT_CONVERGENCE", rule: "Only method-compatible validation statements are grouped; publication counts never establish consensus.", publicationMajorityUsed: false }),
    openQuestions: gaps,
    missingData: gaps,
    generatedEditorialText: false,
    statisticalMetaAnalysisPerformed: false,
    scientificHumanReview: null,
    deterministicDigest: sha256Digest({ assertions: assertions.map((item) => item.digest), evidence: evidenceLinks.map((item) => item.digest), sources: sources.map((item) => item.digest), gaps }),
  });
  const projection = freeze({
    recordType: "InternalScientificProjection",
    projectionId: "noxia:radiology:scientific-projection:territorial-wave:segmentation:state-of-knowledge",
    domainId: P10_SELECTED_DOMAIN_ID,
    campaignId: P10_CAMPAIGN_ID,
    campaignRevisionId: campaignManifest.campaignRevisionId,
    territoryNodeId: territoryAlignmentFor({ domainId: P10_SELECTED_DOMAIN_ID }).domainNodeId,
    knowledgeNodeIds: freeze([P10_SELECTED_NODE_ID, ...concepts.map((item) => item.stableId)].sort()),
    sourceIds: freeze(sources.map((item) => item.revisionId)),
    assertionIds: freeze(assertions.map((item) => item.revisionId)),
    evidenceLinkIds: freeze(evidenceLinks.map((item) => item.evidenceLinkId)),
    synthesisIds: freeze([synthesis.synthesisId]),
    concepts: synthesis.concepts,
    assertions,
    evidenceLinks,
    sources,
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
    ...P10_PUBLICATION_GUARDS,
    deterministicDigest: sha256Digest({ synthesis: synthesis.deterministicDigest, guards: P10_PUBLICATION_GUARDS }),
  });
  const material = {
    campaignId: P10_CAMPAIGN_ID,
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
    domainId: P10_SELECTED_DOMAIN_ID,
    campaignId: P10_CAMPAIGN_ID,
    ...material,
    syntheses: freeze([synthesis]),
    projections: freeze([projection]),
    gaps,
    corpusDigest: sha256Digest(material),
  });
};

export const summarizeReviewedCorpusCorrections = ({ preparedPackage, reviewedCorpus } = {}) => freeze({
  publicationDatesCorrected: reviewedCorpus.sources.filter((source) => preparedPackage.retainedSources.find((item) => item.revisionId === source.revisionId)?.publishedAt !== source.publishedAt).length,
  sourceTypesQualified: reviewedCorpus.sources.filter((source) => preparedPackage.retainedSources.find((item) => item.revisionId === source.revisionId)?.sourceType !== source.sourceType).length,
  assertionTypesCorrected: reviewedCorpus.assertions.filter((assertion) => preparedPackage.assertions.find((item) => item.revisionId === assertion.revisionId)?.assertionType !== assertion.assertionType).length,
  maturitiesQualified: reviewedCorpus.assertions.filter((assertion) => preparedPackage.assertions.find((item) => item.revisionId === assertion.revisionId)?.scientificMaturity !== assertion.scientificMaturity).length,
  applicabilityContextsCorrected: reviewedCorpus.assertions.filter((assertion) => {
    const prepared = preparedPackage.assertions.find((item) => item.revisionId === assertion.revisionId);
    return JSON.stringify(prepared?.context) !== JSON.stringify(assertion.context);
  }).length,
  analyticalSummariesDisambiguatedFromVerbatimText: reviewedCorpus.evidenceLinks.filter((link) => link.extraction.verbatimSourceTextRetained === false).length,
  reviewRecordsCorrected: reviewedCorpus.reviewDecisions.length,
  publicArtifactsCreated: 0,
});
