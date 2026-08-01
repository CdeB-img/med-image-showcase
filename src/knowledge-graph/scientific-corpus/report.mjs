import { p4InitialGitState, p4InitialScientificState } from "./baseline.mjs";
import { evidenceRelationCounts, scientificAssertionRevisions, scientificEvidenceLinks } from "./assertions.mjs";
import { scientificCorpusConceptIdentities, ontologicalRequalificationDecisions } from "./concepts.mjs";
import { scientificApplicabilityContexts } from "./contexts.mjs";
import { derivedMeasurements, measurementDefinitions, measurementMethods, observations, quantitativeModelRecords } from "./measurements.mjs";
import { internalScientificProjections, projectionReadiness, projectionSummary } from "./projections.mjs";
import { competencyQueries, executeCompetencyQueries } from "./query.mjs";
import { conceptReadiness, readinessRules, readinessSummary, synthesisReadiness } from "./readiness.mjs";
import { internalSourceAudit, rejectedExternalSources, scientificSourceRevisions, sourceSelectionSummary } from "./sources.mjs";
import { scientificSyntheses } from "./synthesis.mjs";
import { validateScientificCorpus } from "./validate.mjs";

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

export const createScientificCorpusReport = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const validation = validateScientificCorpus({ root, inspectGit });
  const queries = executeCompetencyQueries();
  const limitations = unique([
    ...scientificAssertionRevisions.flatMap((assertion) => assertion.facets?.limitations ?? []),
    ...scientificEvidenceLinks.flatMap((link) => link.limitations ?? []),
  ]);
  const contradictions = scientificSyntheses.flatMap((synthesis) => synthesis.contradictions.map((item) => ({ synthesisKey: synthesis.key, ...item })));
  const explicitConsensus = scientificSyntheses.filter((synthesis) => synthesis.consensus.detected).map((synthesis) => ({ synthesisKey: synthesis.key, sourceRevisionIds: synthesis.consensus.sourceRevisionIds, ruleId: synthesis.consensus.ruleId }));
  const openQuestions = unique(scientificSyntheses.flatMap((synthesis) => synthesis.openQuestions));
  return Object.freeze({
    reportType: "P4_SCIENTIFIC_CORPUS_ECV_T1",
    generatedAt: "2026-07-31T00:00:00.000Z",
    initialGitState: p4InitialGitState,
    initialScientificState: p4InitialScientificState,
    internalSourcesAudited: internalSourceAudit,
    externalSourcesExamined: Object.freeze({ retained: scientificSourceRevisions.length, rejected: rejectedExternalSources.length }),
    retainedSources: scientificSourceRevisions,
    rejectedSources: rejectedExternalSources,
    sourceSelectionSummary,
    conceptsCreated: scientificCorpusConceptIdentities,
    conceptsRequalified: ontologicalRequalificationDecisions.filter((item) => item.decision === "APPLIED"),
    classificationsDeferred: ontologicalRequalificationDecisions.filter((item) => item.decision === "DEFERRED"),
    measurementsAndMethods: Object.freeze({ measurementDefinitions, measurementMethods, observations, derivedMeasurements }),
    quantitativeEcvModel: Object.freeze({ mr: derivedMeasurements.filter((item) => item.stableId.includes("ecv-mr")), ct: derivedMeasurements.filter((item) => item.stableId.includes("ecv-ct")), normalRangesCreated: 0, thresholdsCreated: 0 }),
    assertions: scientificAssertionRevisions,
    evidenceLinks: scientificEvidenceLinks,
    evidenceRelationCounts,
    contexts: scientificApplicabilityContexts,
    limitations: Object.freeze(limitations),
    confounders: Object.freeze(scientificCorpusConceptIdentities.filter((item) => item.entityType === "Confounder")),
    contradictions: Object.freeze(contradictions),
    convergences: Object.freeze(scientificSyntheses.map((synthesis) => ({ synthesisKey: synthesis.key, state: synthesis.convergence.state, ruleId: synthesis.convergence.ruleId }))),
    explicitConsensus: Object.freeze(explicitConsensus),
    openQuestions: Object.freeze(openQuestions),
    documentaryLifecycle: Object.freeze({ correctedSources: scientificSourceRevisions.filter((source) => source.metadata.documentStatus === "CORRECTED"), correctionEvidenceLinks: scientificEvidenceLinks.filter((link) => link.relationType === "CORRECTS"), retractions: scientificEvidenceLinks.filter((link) => link.relationType === "RETRACTS") }),
    queriesAvailable: competencyQueries,
    queryResults: queries,
    structuredSyntheses: scientificSyntheses,
    internalProjections: internalScientificProjections,
    readiness: Object.freeze({ rules: readinessRules, summary: readinessSummary, concepts: conceptReadiness, syntheses: synthesisReadiness, projections: projectionReadiness }),
    reviewWorkflow: Object.freeze({ automatedStructuralReview: scientificAssertionRevisions.length, scientificHumanReview: 0, automaticallyVerified: 0, publicEligibleAssertions: 0 }),
    validation,
    domainCoverage: Object.freeze({
      myocardialT1MappingMethods: "SUBSTANTIAL_PILOT_COVERAGE",
      cmrEcvDefinitionAndTechnicalContext: "SUBSTANTIAL_PILOT_COVERAGE",
      myocarditis: "PARTIAL_CLINICAL_COVERAGE",
      myocardialInfarction: "LIMITED_SINGLE_COHORT_COVERAGE",
      systemicAlAmyloidosis: "LIMITED_SINGLE_COHORT_COVERAGE",
      ctEcv: "PARTIAL_METHOD_AND_VALIDATION_COVERAGE",
      intersiteReproducibility: "PARTIAL_CMR_COVERAGE",
      ctEcvReproducibility: "ABSENT",
      manufacturerSpecificEffects: "PHANTOM_LEVEL_ONLY_NO_PRODUCT_CLAIMS",
      softwareVersionSpecificEffects: "ABSENT",
      coverageEstimateMethod: "CATEGORICAL_NO_OPAQUE_SCORE",
    }),
    remainingGaps: Object.freeze([
      "Scientific human review has not occurred.",
      "Author lists are stored as verified abbreviated citations, not asserted as complete lists.",
      "Several paywalled sources are localized to PubMed structured abstracts rather than full text.",
      "CT-ECV intersite reproducibility is absent from the retained corpus.",
      "Manufacturer, equipment-model and software-version clinical effects are not asserted where sources do not report them.",
      "No universal reference range, diagnostic threshold or cross-platform equivalence is represented.",
      "Clinical coverage is selective and is not a systematic review of every cardiomyopathy.",
    ]),
    generalization: Object.freeze({
      reusableContracts: ["SourceIdentity/Revision", "ScientificAssertionIdentity/Revision", "EvidenceLink", "ApplicabilityContext", "MeasurementDefinition/Method", "Observation", "DerivedMeasurement", "DeterministicQuery", "StructuredSynthesis", "MultidimensionalReadiness", "InternalProjection"],
      cardiacMrSpecific: ["MOLLI", "ShMOLLI", "SASHA", "T1 inputs", "gadolinium ECV formula", "magnetic field strength"],
      ctSpecific: ["pre/delayed attenuation", "iodine-density partition", "iodinated contrast", "radiation and late-phase context"],
      futureDomainMatrix: Object.freeze({ cerebralPerfusion: "REUSABLE_WITH_NEW_MEASUREMENT_DEFINITIONS", diffusion: "REUSABLE_WITH_NEW_ACQUISITION_CONTEXT", ADC: "REUSABLE", Tmax: "REUSABLE", CBF: "REUSABLE", CBV: "REUSABLE", OEF: "REUSABLE_WITH_MODALITY_CONTEXT", CMRO2: "REUSABLE_WITH_DERIVATION_MODEL", LGE: "ONTOLOGY_DECISION_DEFERRED", T2Mapping: "REUSABLE_WITH_METHOD_SPECIFIC_CONTEXT", MVO: "HISTORICAL_CLASSIFICATION_DECISION_REQUIRED", intramyocardialHemorrhage: "HISTORICAL_CLASSIFICATION_DECISION_REQUIRED", spectralCT: "REUSABLE_CT_BRANCH" }),
    }),
    counts: Object.freeze({ sourcesExamined: scientificSourceRevisions.length + rejectedExternalSources.length, sourcesRetained: scientificSourceRevisions.length, sourcesRejected: rejectedExternalSources.length, conceptsAdded: scientificCorpusConceptIdentities.length, conceptsRequalified: 0, classificationsDeferred: ontologicalRequalificationDecisions.length, quantitativeRecords: quantitativeModelRecords.length, assertions: scientificAssertionRevisions.length, evidenceLinks: scientificEvidenceLinks.length, contexts: scientificApplicabilityContexts.length, limitations: limitations.length, contradictions: contradictions.length, explicitConsensus: explicitConsensus.length, openQuestions: openQuestions.length, syntheses: scientificSyntheses.length, internalProjections: projectionSummary.count }),
  });
};
