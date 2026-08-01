import { p4rConceptReadiness, p4rInternalScientificProjections, p4rProjectionReadiness, p4rReadinessSummary, p4rScientificSyntheses, p4rSynthesisReadiness } from "./corpus.mjs";
import { contradictionSummary, p4rContradictionAssessments } from "./contradictions.mjs";
import { P4R_VERSION } from "./constants.mjs";
import { domainSpecificExtensions, generalitySummary, genericScientificContracts, genericityResults, modalitySpecificExtensions, scientificExtensionPlan, specialtySpecificExtensions } from "./generality.mjs";
import { ontologyDecisionSummary, p4rOntologicalDecisions } from "./ontology.mjs";
import { assertionReviewSummary, consolidatedAssertionReviewDecisions, consolidatedAssertionRevisions, consolidatedEvidenceLinks, evidenceReviewMatrix } from "./review.mjs";
import { p4Snapshot } from "./snapshot.mjs";
import { consolidatedSourceRecords, sourceConsolidationSummary, supplementalCtSourceAudit } from "./sources.mjs";
import { validateP4RConsolidation } from "./validate.mjs";

const evidenceCountBySource = new Map();
for (const link of consolidatedEvidenceLinks) evidenceCountBySource.set(link.sourceRevisionId, (evidenceCountBySource.get(link.sourceRevisionId) ?? 0) + 1);

export const metrologyContracts = Object.freeze([
  { term: "accuracy", distinctFrom: ["precision"], generic: true },
  { term: "precision", distinctFrom: ["accuracy"], generic: true },
  { term: "repeatability", distinctFrom: ["reproducibility"], generic: true },
  { term: "reproducibility", distinctFrom: ["repeatability"], generic: true },
  { term: "interreader reproducibility", distinctFrom: ["intersite reproducibility", "interscanner reproducibility"], generic: true },
  { term: "correlation", distinctFrom: ["agreement"], generic: true },
  { term: "agreement", distinctFrom: ["correlation"], generic: true },
  { term: "bias", distinctFrom: ["error", "biological variability"], generic: true },
  { term: "calibration", distinctFrom: ["correlation"], generic: true },
]);

export const ctEcvBranchAudit = Object.freeze({
  representedBranches: Object.freeze(["single-energy attenuation-change ECV", "spectral iodine-density ECV"]),
  representedInputs: Object.freeze(["pre-contrast attenuation", "delayed attenuation", "iodine density", "hematocrit"]),
  representedLimits: Object.freeze(["misregistration", "timing", "radiation", "small single-center cohorts", "heterogeneous protocols"]),
  fullTextSources: consolidatedSourceRecords.filter((record) => (record.after.metadata.sourceQuality.assertionUtility ?? []).includes("CT_ECV") || (record.after.metadata.sourceQuality.assertionUtility ?? []).some((value) => value.startsWith("CT_"))).filter((record) => !record.after.metadata.abstractOnly).map((record) => record.after.revisionId),
  abstractOnlySources: consolidatedSourceRecords.filter((record) => (record.after.metadata.sourceQuality.assertionUtility ?? []).includes("CT_ECV") || (record.after.metadata.sourceQuality.assertionUtility ?? []).some((value) => value.startsWith("CT_"))).filter((record) => record.after.metadata.abstractOnly).map((record) => record.after.revisionId),
  supplementalSourcesExamined: supplementalCtSourceAudit,
  intersiteReproducibility: "NOT_DOCUMENTED_IN_SELECTED_CORPUS",
  interscannerReproducibility: "NOT_ESTABLISHED_FOR_GENERAL_TRANSFERABILITY",
  manufacturerComparison: "NOT_INFERRED",
  softwareComparison: "NOT_INFERRED",
});

export const createP4RConsolidationReport = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const validation = validateP4RConsolidation({ root, inspectGit });
  const sourceRows = consolidatedSourceRecords.map((record) => ({
    sourceRevisionId: record.after.revisionId,
    pmid: record.after.pmid,
    stateP4: record.before.metadata.fullTextAvailability,
    stateP4R: record.classification,
    fullText: !record.after.metadata.abstractOnly,
    metadata: record.metadataChanges,
    assertions: evidenceCountBySource.get(record.after.revisionId) ?? 0,
    limits: record.after.metadata.sourceQuality.limitations,
  }));
  const assertionRows = consolidatedAssertionReviewDecisions.map((decision) => {
    const assertion = consolidatedAssertionRevisions.find((item) => item.revisionId === decision.assertionRevisionId);
    return {
      assertionRevisionId: assertion.revisionId,
      statement: assertion.statement,
      sourceRevisionIds: decision.sourceRevisionIds,
      extractionCount: decision.evidenceLinkIds.length,
      evidenceLinkIds: decision.evidenceLinkIds,
      automatedReview: decision.decision,
      decision: decision.newStatus,
    };
  });
  const readinessRows = [
    ...p4rConceptReadiness.map((item) => ({ subjectId: item.subjectId, subjectType: item.subjectType, ...Object.fromEntries(Object.keys(p4rReadinessSummary.concepts).map((key) => [key, item[key].ready])) })),
    ...p4rSynthesisReadiness.map((item) => ({ subjectId: item.subjectId, subjectType: item.subjectType, ...Object.fromEntries(Object.keys(p4rReadinessSummary.syntheses).map((key) => [key, item[key].ready])) })),
    ...p4rProjectionReadiness.map((item) => ({ subjectId: item.subjectId, subjectType: item.subjectType, ...Object.fromEntries(Object.keys(p4rReadinessSummary.projections).map((key) => [key, item[key].ready])) })),
  ];
  return Object.freeze({
    reportType: "P4R_SCIENTIFIC_CONSOLIDATION_AND_GENERIC_METHOD_VALIDATION",
    version: P4R_VERSION,
    decisionCandidate: validation.valid ? "MÉTHODE SCIENTIFIQUE PILOTE CONSOLIDÉE — PASSER À L’EXTENSION MULTIDOMAINE" : "INTERVENTION TECHNIQUE REQUISE",
    gitInitialState: Object.freeze({ branch: "main", head: "857e94b6df88289b59de149fe8f77e84dbee9492", p4WorkPreserved: true, automaticRestore: false }),
    p4Snapshot: Object.freeze({ digest: p4Snapshot.digest, categoryDigests: p4Snapshot.categoryDigests, counts: validation.counts }),
    sourceConsolidation: sourceConsolidationSummary,
    sourceRows: Object.freeze(sourceRows),
    sourcesRemainingAbstractOnly: Object.freeze(sourceRows.filter((row) => !row.fullText).map((row) => row.sourceRevisionId)),
    metadataRemainingUnknown: Object.freeze([]),
    extractionReview: Object.freeze({ total: consolidatedEvidenceLinks.length, matrix: evidenceReviewMatrix }),
    assertionReview: Object.freeze({ summary: assertionReviewSummary, rows: assertionRows }),
    evidenceReview: Object.freeze({ preserved: consolidatedEvidenceLinks.length, reclassified: assertionReviewSummary.evidenceLinksReclassified, rows: evidenceReviewMatrix }),
    contradictions: Object.freeze({ summary: contradictionSummary, rows: p4rContradictionAssessments }),
    ctEcvBranch: ctEcvBranchAudit,
    metrology: metrologyContracts,
    ontology: Object.freeze({ summary: ontologyDecisionSummary, rows: p4rOntologicalDecisions }),
    genericMethod: Object.freeze({
      summary: generalitySummary,
      genericScientificContracts,
      domainSpecificExtensions,
      modalitySpecificExtensions,
      specialtySpecificExtensions,
      fixtureResults: genericityResults,
    }),
    syntheses: Object.freeze(p4rScientificSyntheses.map((synthesis) => ({
      key: synthesis.key,
      fullTextSources: synthesis.fullTextSources.length,
      abstractOnlySources: synthesis.abstractOnlySources.length,
      assertions: synthesis.applicableAssertions.length,
      confidence: synthesis.confidence,
      contradictions: synthesis.contradictions.length,
      gaps: synthesis.missingData,
    }))),
    projections: Object.freeze(p4rInternalScientificProjections.map((projection) => ({ projectionId: projection.projectionId, key: projection.key, internalOnly: projection.internalOnly, publicReady: false, gaps: projection.gaps }))),
    readiness: Object.freeze({ summary: p4rReadinessSummary, rows: readinessRows }),
    genericEnrichmentProtocol: Object.freeze({ domainParameter: "domainId", phaseCount: 18, containsEcvT1Terms: false }),
    futureDomains: scientificExtensionPlan,
    testsAdded: Object.freeze(["P4R consolidation unit tests", "source/extraction/review validators", "ten isolated genericity fixtures", "protected-surface guards"]),
    validation,
    filesCreated: Object.freeze([
      "src/knowledge-graph/scientific-consolidation/bibliography.mjs",
      "src/knowledge-graph/scientific-consolidation/constants.mjs",
      "src/knowledge-graph/scientific-consolidation/contradictions.mjs",
      "src/knowledge-graph/scientific-consolidation/corpus.mjs",
      "src/knowledge-graph/scientific-consolidation/generality.mjs",
      "src/knowledge-graph/scientific-consolidation/ontology.mjs",
      "src/knowledge-graph/scientific-consolidation/report.mjs",
      "src/knowledge-graph/scientific-consolidation/review.mjs",
      "src/knowledge-graph/scientific-consolidation/scientific-consolidation.test.mjs",
      "src/knowledge-graph/scientific-consolidation/snapshot.mjs",
      "src/knowledge-graph/scientific-consolidation/sources.mjs",
      "src/knowledge-graph/scientific-consolidation/validate.mjs",
      "scripts/consolidate-scientific-corpus.mjs",
      "scripts/generate-p4r-scientific-consolidation-report.mjs",
      "scripts/validate-scientific-sources.mjs",
      "scripts/validate-scientific-extractions.mjs",
      "scripts/validate-scientific-review.mjs",
      "scripts/validate-scientific-generality.mjs",
      "scripts/report-scientific-consolidation.mjs",
      "scripts/report-scientific-gaps.mjs",
      "scripts/report-scientific-extension-plan.mjs",
      "docs/p4r-scientific-consolidation.md",
      "docs/p4r-scientific-consolidation-report.md",
    ]),
    filesModified: Object.freeze(["package.json", "src/knowledge-graph/index.mjs", "src/knowledge-graph/scientific-model-schema.mjs"]),
    remainingRisksAndGaps: Object.freeze([
      "Six publications remain limited to their PubMed structured abstract for assertion extraction.",
      "CT-ECV intersite reproducibility is not demonstrated by the selected corpus.",
      "Automated scientific review is traceable but is not human expert validation.",
      "Three non-pilot ontological decisions remain deferred to avoid cross-domain enrichment.",
      "No public or SEO readiness decision is made in P4R.",
    ]),
  });
};
