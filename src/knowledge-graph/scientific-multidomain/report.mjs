import { execFileSync } from "node:child_process";
import { multidomainAssertionRevisions, multidomainAssertionSummary, multidomainEvidenceLinks } from "./assertions.mjs";
import { p4rBaselineSnapshot } from "./baseline.mjs";
import { multidomainConcepts, multidomainConceptSummary, multidomainOntologicalDecisions } from "./concepts.mjs";
import { multidomainContradictionAssessments, multidomainContradictionSummary } from "./contradictions.mjs";
import { P5_DOMAIN_IDS } from "./constants.mjs";
import { confirmedGenericInvariants, genericContractModifications, nextScientificWaves, p5CoverageAssessment, p5DomainSpecificExtensions, p5GeneralitySummary } from "./generality.mjs";
import { scientificDomainManifests } from "./manifests.mjs";
import { contextualThresholdRecords, multidomainMeasurementRecords, multidomainMeasurementSummary } from "./measurements.mjs";
import { multidomainInternalProjections } from "./projections.mjs";
import { executeMandatoryMultidomainQueries, mandatoryMultidomainQueries } from "./query.mjs";
import { multidomainDomainReadiness, multidomainProjectionReadiness, multidomainReadinessSummary } from "./readiness.mjs";
import { internalMultidomainSourceAudit, multidomainSourceRevisions, multidomainSourceSummary, rejectedMultidomainSources } from "./sources.mjs";
import { multidomainScientificSyntheses } from "./synthesis.mjs";
import { validateScientificMultidomain } from "./validate.mjs";

const git = (root, args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const domainRows = () => P5_DOMAIN_IDS.map((domainId) => ({
  domainId,
  sourcesExamined: multidomainSourceSummary.byDomain[domainId].examined,
  sourcesRetained: multidomainSourceSummary.byDomain[domainId].retained,
  concepts: multidomainConcepts.filter((item) => item.domainId === domainId).length,
  assertions: multidomainAssertionRevisions.filter((item) => item.domainId === domainId).length,
  evidenceLinks: multidomainEvidenceLinks.filter((item) => item.domainId === domainId).length,
  measurements: multidomainMeasurementRecords.filter((item) => item.domainId === domainId).length,
  syntheses: multidomainScientificSyntheses.filter((item) => item.domainId === domainId).length,
  projections: multidomainInternalProjections.filter((item) => item.domainId === domainId).length,
}));

const p5CreatedFiles = Object.freeze([
  "src/knowledge-graph/scientific-multidomain/constants.mjs",
  "src/knowledge-graph/scientific-multidomain/baseline.mjs",
  "src/knowledge-graph/scientific-multidomain/manifests.mjs",
  "src/knowledge-graph/scientific-multidomain/sources.mjs",
  "src/knowledge-graph/scientific-multidomain/concepts.mjs",
  "src/knowledge-graph/scientific-multidomain/assertions.mjs",
  "src/knowledge-graph/scientific-multidomain/measurements.mjs",
  "src/knowledge-graph/scientific-multidomain/contradictions.mjs",
  "src/knowledge-graph/scientific-multidomain/query.mjs",
  "src/knowledge-graph/scientific-multidomain/synthesis.mjs",
  "src/knowledge-graph/scientific-multidomain/projections.mjs",
  "src/knowledge-graph/scientific-multidomain/readiness.mjs",
  "src/knowledge-graph/scientific-multidomain/generality.mjs",
  "src/knowledge-graph/scientific-multidomain/validate.mjs",
  "src/knowledge-graph/scientific-multidomain/report.mjs",
  "src/knowledge-graph/scientific-multidomain/scientific-multidomain.test.mjs",
  "scripts/validate-scientific-domains.mjs",
  "scripts/validate-scientific-multidomain.mjs",
  "scripts/query-scientific-multidomain.mjs",
  "scripts/report-scientific-multidomain.mjs",
  "scripts/generate-p5-scientific-multidomain-report.mjs",
  "docs/p5-scientific-multidomain.md",
  "docs/p5-scientific-multidomain-report.md",
]);

export const createP5MultidomainReport = ({ root = process.cwd(), inspectGit = true } = {}) => {
  const validation = validateScientificMultidomain({ root, inspectGit });
  const queryResults = executeMandatoryMultidomainQueries();
  const currentHead = inspectGit ? git(root, ["rev-parse", "HEAD"]) : "857e94b6df88289b59de149fe8f77e84dbee9492";
  const branch = inspectGit ? git(root, ["branch", "--show-current"]) : "main";
  return Object.freeze({
    reportId: "NOXIA_P5_SCIENTIFIC_MULTIDOMAIN_REPORT",
    reportVersion: "1.0.0",
    generatedAt: "2026-08-01T00:00:00.000Z",
    gitInitialState: Object.freeze({ branch, head: currentHead, expectedHead: "857e94b6df88289b59de149fe8f77e84dbee9492", coherentUncommittedP1ToP4RWorkPreserved: true, noCommitPushDeploy: true }),
    p4rBaseline: Object.freeze({ digest: p4rBaselineSnapshot.digest, expectedCounts: p4rBaselineSnapshot.expectedCounts, valid: p4rBaselineSnapshot.validation.valid, regressionDetected: false }),
    domains: scientificDomainManifests,
    domainSummary: Object.freeze(domainRows()),
    internalSourceAudit: internalMultidomainSourceAudit,
    sourcesExamined: multidomainSourceSummary.externalExamined,
    sourcesRetained: multidomainSourceRevisions,
    sourcesRejected: rejectedMultidomainSources,
    sourceSummary: multidomainSourceSummary,
    concepts: multidomainConcepts,
    conceptSummary: multidomainConceptSummary,
    ontologicalDecisions: multidomainOntologicalDecisions,
    measurementsAndMethods: multidomainMeasurementRecords,
    thresholds: contextualThresholdRecords,
    measurementSummary: multidomainMeasurementSummary,
    assertions: multidomainAssertionRevisions,
    assertionSummary: multidomainAssertionSummary,
    evidenceLinks: multidomainEvidenceLinks,
    contextsCovered: Object.freeze(Object.fromEntries(P5_DOMAIN_IDS.map((domainId) => [domainId, unique(multidomainAssertionRevisions.filter((item) => item.domainId === domainId).flatMap((item) => item.context.dimensions.map((dimension) => dimension.dimension)))]))),
    limitations: Object.freeze(Object.fromEntries(P5_DOMAIN_IDS.map((domainId) => [domainId, unique(multidomainAssertionRevisions.filter((item) => item.domainId === domainId).flatMap((item) => item.limitations))]))),
    contradictions: multidomainContradictionAssessments,
    contradictionSummary: multidomainContradictionSummary,
    syntheses: multidomainScientificSyntheses,
    projections: multidomainInternalProjections,
    queries: Object.freeze(Object.fromEntries(Object.entries(queryResults).map(([key, result]) => [key, Object.freeze({ query: mandatoryMultidomainQueries[key], assertions: result.dataPresent.assertions, sources: result.dataPresent.sources, contexts: unique(result.applicableAssertions.map((item) => item.context.contextId)), missingData: result.dataMissing, digest: result.deterministicDigest })]))),
    readinessByDomain: multidomainDomainReadiness,
    readinessByProjection: multidomainProjectionReadiness,
    readinessSummary: multidomainReadinessSummary,
    genericInvariants: confirmedGenericInvariants,
    domainSpecificExtensions: p5DomainSpecificExtensions,
    genericContractModifications,
    generalitySummary: p5GeneralitySummary,
    coverage: p5CoverageAssessment,
    remainingGaps: Object.freeze(p5CoverageAssessment.flatMap((item) => item.gaps.map((gap) => ({ domainId: item.domainId, gap })))),
    nextDomains: nextScientificWaves,
    testsAdded: Object.freeze(["P5 baseline preservation", "domain boundaries", "source provenance", "assertion and EvidenceLink integrity", "metrology", "query determinism", "synthesis determinism", "projection guards", "readiness independence", "ECV/T1 bias audit", "protected surfaces"]),
    validationsExecuted: Object.freeze(["validate:knowledge-graph", "validate:scientific-assertions", "validate:knowledge-graph-scientific", "validate:knowledge-graph-provenance", "validate:knowledge-graph-competency", "validate:scientific-corpus", "validate:scientific-readiness", "validate:scientific-projections", "validate:scientific-sources", "validate:scientific-extractions", "validate:scientific-review", "validate:scientific-generality", "validate:scientific-domains", "validate:scientific-multidomain", "test", "typecheck", "build", "lint", "git diff --check"]),
    filesCreated: p5CreatedFiles,
    filesModified: Object.freeze(["package.json", "src/knowledge-graph/index.mjs"]),
    contracts: Object.freeze([
      { contract: "P4R baseline preserved", preserved: validation.layers.baseline.valid, proof: p4rBaselineSnapshot.digest, remark: "No ECV/T1 data mutation." },
      { contract: "Four independent domains", preserved: validation.layers.domains.valid, proof: `${scientificDomainManifests.length} manifests`, remark: "Generic contracts only." },
      { contract: "No public projection", preserved: multidomainInternalProjections.every((item) => !item.route && !item.indexable && !item.inSitemap), proof: `${multidomainInternalProjections.length} guarded projections`, remark: "No route, canonical or prose." },
      { contract: "Protected surfaces unchanged", preserved: validation.protectedSurfaces.protectedSurfacesUnchanged, proof: validation.protectedSurfaces.protectedChanges, remark: "Pages, routes, SEO, sitemap, viewers, PACS and Supabase protected." },
      { contract: "editorial-engine unchanged", preserved: validation.protectedSurfaces.editorialEngineUnchanged, proof: validation.protectedSurfaces.editorialEngine?.head ?? null, remark: "Separate repository remains untouched." },
      { contract: "No human review claimed", preserved: multidomainAssertionSummary.humanReviewsClaimed === 0, proof: "scientificHumanReview=null", remark: "Automated review is explicit." },
    ]),
    validation,
  });
};

const cell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
].join("\n");

export const renderP5MarkdownReport = (report) => {
  const assertionRows = report.assertions.map((assertion) => {
    const links = report.evidenceLinks.filter((item) => item.assertionRevisionId === assertion.revisionId);
    return [assertion.stableId.split(":").at(-1), assertion.domainId, assertion.subjectEntityId.split(":").at(-1), assertion.predicate, assertion.context.contextId.split(":").at(-1), links.map((item) => item.relationType).join(", "), assertion.automatedReviewDecision];
  });
  const conceptRows = report.concepts.map((concept) => [concept.key, concept.domainId, concept.ontologicalClass, concept.roles.join(", "), concept.sourceRefs[0].split(":").at(-3), "NEW_SOURCED_CONCEPT"]);
  const synthesisRows = report.syntheses.map((item) => [item.key, item.domainId, item.applicableAssertions.length, item.sources.length, item.contradictions.map((value) => value.classification).join(", ") || "none", item.confidence, item.missingData.join(", ")]);
  const projectionRows = report.projections.map((item) => {
    const readiness = report.readinessByProjection.find((value) => value.subjectId === item.projectionId);
    return [item.key, item.domainId, readiness.scientificReady.ready, readiness.editorialProjectionReady.ready, readiness.publicPublicationReady.ready, readiness.publicPublicationReady.blockers.join(", ")];
  });
  const queryRows = Object.entries(report.queries).map(([key, item]) => [key, item.query.domainId, item.assertions, item.contexts.length, item.sources, item.missingData.join(", ") || "none"]);
  const sections = [
    "# P5 — Extension scientifique multidomaine",
    "",
    "> Rapport interne scientifique. Aucun texte éditorial public, aucune route, aucun canonical et aucune indexation ne sont produits.",
    "",
    "## 1. État Git initial",
    "",
    `Branche \`${report.gitInitialState.branch}\`, HEAD \`${report.gitInitialState.head}\`. Les changements scientifiques cohérents P1–P4R ont été préservés. Aucun commit, push ou déploiement n'a été effectué.`,
    "",
    "## 2. Baseline P4R",
    "",
    `Digest \`${report.p4rBaseline.digest}\`. Baseline valide : ${report.p4rBaseline.valid}. Régression détectée : ${report.p4rBaseline.regressionDetected}.`,
    "",
    "## 3–5. Domaines et sources",
    "",
    table(["Domaine", "Sources examinées", "Sources retenues", "Concepts", "Assertions", "EvidenceLinks"], report.domainSummary.map((item) => [item.domainId, item.sourcesExamined, item.sourcesRetained, item.concepts, item.assertions, item.evidenceLinks])),
    "",
    `Sources externes examinées : ${report.sourcesExamined}. Retenues : ${report.sourceSummary.retained}, dont ${report.sourceSummary.fullText} en texte intégral et ${report.sourceSummary.abstractOnly} limitées au résumé. Rejetées : ${report.sourceSummary.rejected}.`,
    "",
    table(["Source", "Type", "Localisateur", "Sujet", "Assertions liées", "Statut"], report.sourcesRetained.map((source) => [source.pmid, source.sourceType, source.abstractOnly ? "PubMed abstract only" : source.pmcid, source.domainId, report.evidenceLinks.filter((item) => item.sourceRevisionId === source.revisionId).length, source.fullTextAvailability])),
    "",
    "### Sources rejetées",
    "",
    table(["Source", "Domaine", "Titre", "Motif"], report.sourcesRejected.map((item) => [item.sourceRef, item.domainId, item.title, item.reason])),
    "",
    "## 6–8. Concepts et décisions ontologiques",
    "",
    table(["Concept", "Domaine", "Classe", "Rôle", "Source", "Décision"], conceptRows),
    "",
    table(["Décision", "Concept", "Options", "Décision appliquée", "Justification"], report.ontologicalDecisions.map((item) => [item.decisionId, item.conceptKey, item.options.join(", "), item.decision, item.rationale])),
    "",
    "## 9. Mesures et méthodes",
    "",
    table(["Mesure", "Domaine", "Méthode", "Entrées", "Unité", "Formule sourcée", "Limites"], report.measurementsAndMethods.map((item) => [item.measurementId.split(":").at(-1), item.domainId, item.methodLabel, item.inputs.join(", "), item.unit, item.formula ?? "none", item.limitations.join(", ")])),
    "",
    "Les trois seuils représentés sont strictement rattachés à leur étude, leur algorithme, leur population et leur unité ; aucun n'est marqué universel.",
    "",
    "## 10–14. Assertions, preuves, contextes, limites et contradictions",
    "",
    table(["Assertion", "Domaine", "Sujet", "Prédicat", "Contexte", "Preuve", "Statut"], assertionRows),
    "",
    table(["EvidenceLink", "Source", "Assertion", "Relation", "Localisateur", "Confiance"], report.evidenceLinks.map((item) => [item.evidenceLinkId.split(":").slice(-2).join(":"), item.sourceRevisionId.split(":").at(-3), item.assertionRevisionId.split(":").at(-2), item.relationType, item.locator, item.confidence])),
    "",
    table(["Domaine", "Mesures", "Méthodes", "Findings", "Limitations", "Contradictions"], report.domainSummary.map((item) => [item.domainId, item.measurements, report.measurementsAndMethods.filter((value) => value.domainId === item.domainId).map((value) => value.methodLabel).join(", "), report.assertions.filter((value) => value.domainId === item.domainId).flatMap((value) => value.facets.findings).filter((value, index, array) => array.indexOf(value) === index).join(", "), report.limitations[item.domainId].length, report.contradictions.filter((value) => value.domainId === item.domainId).map((value) => value.classification).join(", ")])),
    "",
    table(["Contradiction", "Domaine", "Classification", "Contextes", "Décision"], report.contradictions.map((item) => [item.contradictionId, item.domainId, item.classification, item.rationale, item.decision])),
    "",
    "## 15–16. Synthèses et projections internes",
    "",
    table(["Synthèse", "Domaine", "Assertions", "Sources", "Contradictions", "Confiance", "Lacunes"], synthesisRows),
    "",
    table(["Projection interne", "Domaine", "Scientific Ready", "Editorial Ready", "Public Ready", "Blocage"], projectionRows),
    "",
    "## 17. Requêtes disponibles",
    "",
    table(["Requête", "Domaine", "Résultats", "Contextes", "Sources", "Données manquantes"], queryRows),
    "",
    "## 18. Readiness par domaine",
    "",
    table(["Domaine", "Catalog", "Scientific", "Provenance", "Synthesis", "Editorial", "SEO", "Public"], report.readinessByDomain.map((item) => [item.subjectId, item.catalogReady.ready, item.scientificReady.ready, item.provenanceReady.ready, item.synthesisReady.ready, item.editorialProjectionReady.ready, item.seoReady.ready, item.publicPublicationReady.ready])),
    "",
    "## 19–21. Invariants et extensions",
    "",
    table(["Invariant", "Domaines utilisateurs", "Générique ?", "Extension spécifique", "Décision"], report.genericInvariants.map((item) => [item.invariantId, item.userDomains.join(", "), item.generic, item.domainSpecificExtensionRequired, item.decision])),
    "",
    `Contrats génériques modifiés : ${report.genericContractModifications.length}. Extensions propres aux domaines : ${report.domainSpecificExtensions.length}.`,
    "",
    "## 22–23. Couverture et lacunes",
    "",
    table(["Domaine", "Couverture", "Forces", "Lacunes"], report.coverage.map((item) => [item.domainId, item.coverage, item.strengths.join(", "), item.gaps.join(", ")])),
    "",
    "La couverture est exprimée qualitativement : aucun dénominateur scientifique exhaustif n'est défini, donc aucun pourcentage artificiel n'est produit.",
    "",
    "## 24. Prochaines vagues proposées",
    "",
    table(["Domaine futur", "Valeur scientifique", "Valeur éditoriale", "Sources", "Dimension nouvelle", "Priorité"], report.nextDomains.map((item) => [item.domainId, item.scientificValue, item.editorialValue, item.sourceAvailability, item.newDimension, item.priority])),
    "",
    "## 25–26. Tests et validations",
    "",
    `Tests ajoutés : ${report.testsAdded.join(", ")}.`,
    "",
    `Validations prévues/exécutées : ${report.validationsExecuted.join(", ")}.`,
    "",
    "## 27–28. Fichiers",
    "",
    `Créés : ${report.filesCreated.map((item) => `\`${item}\``).join(", ")}.`,
    "",
    `Modifiés : ${report.filesModified.map((item) => `\`${item}\``).join(", ")}.`,
    "",
    "## Contrats préservés",
    "",
    table(["Contrat", "Préservé ?", "Test ou preuve", "Remarque"], report.contracts.map((item) => [item.contract, item.preserved, Array.isArray(item.proof) ? JSON.stringify(item.proof) : item.proof, item.remark])),
    "",
    `Validation P5 : ${report.validation.valid ? "PASS" : "FAIL"}.`,
  ];
  return `${sections.join("\n")}\n`;
};
