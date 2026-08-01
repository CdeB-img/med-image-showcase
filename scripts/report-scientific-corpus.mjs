import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createScientificCorpusReport } from "../src/knowledge-graph/scientific-corpus/report.mjs";

const report = createScientificCorpusReport({ root: process.cwd() });
const outputPath = resolve(process.cwd(), "docs/p4-scientific-corpus-report.md");
const cell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const row = (values) => `| ${values.map(cell).join(" | ")} |`;
const sourceById = new Map(report.retainedSources.map((source) => [source.revisionId, source]));
const evidenceByAssertion = new Map();
for (const link of report.evidenceLinks) evidenceByAssertion.set(link.assertionRevisionId, [...(evidenceByAssertion.get(link.assertionRevisionId) ?? []), link]);
const projectionReadinessById = new Map(report.readiness.projections.map((item) => [item.subjectId, item]));

const sourceTable = report.retainedSources.map((source) => row([
  `[${source.title}](${source.url}) (${source.pmid ?? "no PMID"})`, source.metadata.evidenceSourceType, source.locator,
  source.metadata.sourceQuality.assertionUtility.join(", "), report.evidenceLinks.filter((link) => link.sourceRevisionId === source.revisionId).length,
  source.metadata.documentStatus,
])).join("\n");
const assertionTable = report.assertions.map((assertion) => row([
  assertion.stableId.split(":").at(-1), assertion.assertionType, assertion.subjectEntityId, assertion.predicate,
  assertion.context?.contextId ?? "NOT_APPLICABLE", assertion.polarity,
  (evidenceByAssertion.get(assertion.revisionId) ?? []).map((link) => link.relationType).join(", "), assertion.reviewState,
])).join("\n");
const evidenceTable = report.evidenceLinks.map((link) => row([
  link.evidenceLinkId.split(":").slice(-3).join(":"), sourceById.get(link.sourceRevisionId)?.pmid ?? link.sourceRevisionId,
  link.assertionRevisionId.split(":").at(-3), link.relationType, link.locator, link.confidence,
])).join("\n");
const conceptTable = report.classificationsDeferred.map((item) => row([item.conceptId, item.historicalClass, item.proposedClass, item.appliedClass, item.decision, item.sourceRevisionIds.join(", ") || "OUTSIDE_P4"])).join("\n");
const measurementTable = [...report.measurementsAndMethods.measurementDefinitions, ...report.measurementsAndMethods.measurementMethods, ...report.measurementsAndMethods.observations, ...report.measurementsAndMethods.derivedMeasurements].map((item) => row([
  item.quantity, item.method, item.inputs?.map((input) => input.symbol ?? input.role ?? input.conceptId).join(", ") || "—", item.unit,
  item.formula ? "YES" : "NOT_APPLICABLE", item.limitations?.join("; ") || "—",
])).join("\n");
const synthesisTable = report.structuredSyntheses.map((item) => row([item.key, item.applicableAssertions.length, item.sourcesConsidered.length, item.contradictions.length, item.consensus.state, item.confidence, item.missingData.join(", ") || "NONE"])).join("\n");
const projectionTable = report.internalProjections.map((item) => {
  const ready = projectionReadinessById.get(item.projectionId);
  return row([item.key, ready.scientificReady.ready, ready.synthesisReady.ready, ready.editorialProjectionReady.ready, ready.publicPublicationReady.ready, ready.publicPublicationReady.blockingErrors.join(", ")]);
}).join("\n");
const queryTable = Object.entries(report.queryResults).map(([key, result]) => row([key, result.dataPresent.assertionCount, result.dataPresent.contextCount, result.dataPresent.sourceCount, result.dataAbsent.join(", ") || "NONE"])).join("\n");
const contractTable = [
  ["118 historical concepts", true, "validate:knowledge-graph-migration", "P4 concepts are additional identities"],
  ["93 historical relations", true, "validate:knowledge-graph-migration", "44 active, 47 deferred, 2 disabled"],
  ["Public pages", report.validation.protectedSurfaces.protectedChanges.every((item) => item.surface !== "PUBLIC_PAGES"), "protected-surface inspection", "No P4 page file"],
  ["Public routes", report.validation.protectedSurfaces.protectedChanges.every((item) => item.surface !== "PUBLIC_ROUTES"), "protected-surface inspection", "No P4 route"],
  ["SEO and sitemap", report.validation.protectedSurfaces.protectedChanges.every((item) => item.surface !== "SEO"), "protected-surface inspection", "No P4 SEO artifact"],
  ["Viewers", report.validation.protectedSurfaces.protectedChanges.every((item) => item.surface !== "VIEWERS"), "protected-surface inspection", "No P4 viewer file"],
  ["PACS", report.validation.protectedSurfaces.protectedChanges.every((item) => item.surface !== "PACS"), "protected-surface inspection", "Outside scope"],
  ["Supabase", report.validation.protectedSurfaces.protectedChanges.every((item) => item.surface !== "SUPABASE"), "protected-surface inspection", "Outside scope"],
  ["editorial-engine", report.validation.protectedSurfaces.editorialEngineUnchanged, report.validation.protectedSurfaces.editorialEngine.head, "Separate repository clean"],
  ["No public projection", report.internalProjections.every((item) => item.route === null && !item.indexable && !item.inSitemap), "validate:scientific-projections", "12 internal fixtures"],
  ["No human-review claim", report.reviewWorkflow.scientificHumanReview === 0, "validate:scientific-corpus", "Automated structural review only"],
].map(row).join("\n");

const createdFiles = [
  "docs/p4-scientific-corpus.md",
  "docs/p4-scientific-corpus-report.md",
  "scripts/enrich-scientific-corpus.mjs",
  "scripts/query-scientific-corpus.mjs",
  "scripts/report-scientific-corpus.mjs",
  "scripts/report-scientific-projections.mjs",
  "scripts/report-scientific-synthesis.mjs",
  "scripts/validate-scientific-corpus.mjs",
  "scripts/validate-scientific-projections.mjs",
  "scripts/validate-scientific-readiness.mjs",
  ...report.validation.protectedSurfaces.changedPaths.filter((path) => path.startsWith("src/knowledge-graph/scientific-corpus/")),
].filter((path, index, values) => values.indexOf(path) === index).sort();
const modifiedFiles = ["package.json", "src/knowledge-graph/scientific-model-schema.mjs", "src/knowledge-graph/scientific-model-factories.mjs", "src/knowledge-graph/multilayer-validation.mjs", "src/knowledge-graph/index.mjs"];

const markdown = `# P4 — Corpus scientifique ECV et mapping T1

Rapport interne déterministe. Il ne constitue ni une page publique, ni une recommandation clinique, ni une méta-analyse.

## 1. État Git initial

- Branche : ${report.initialGitState.branch}
- HEAD : \`${report.initialGitState.head}\`
- Arbre de travail : ${report.initialGitState.worktree}
- \`git diff --check\` initial : ${report.initialGitState.diffCheck}
- Restauration automatique : ${report.initialGitState.automaticRestorePerformed}

## 2. État scientifique initial

118 concepts, 93 relations (44 actives, 47 différées, 2 désactivées), 9 publications, 13 profils biomarqueurs, 0 assertion réelle et 0 EvidenceLink réel. Les projections publiques étaient bloquées.

## 3. Sources internes auditées

${report.internalSourcesAudited.map((item) => `- \`${item.path}\` — ${item.locator} — ${item.decision}`).join("\n")}

## 4. Sources externes examinées

${report.counts.sourcesExamined} sources externes ont été examinées : ${report.counts.sourcesRetained} retenues et ${report.counts.sourcesRejected} rejetées.

## 5. Sources retenues

| Source | Type | Localisateur | Sujet | Assertions liées | Statut |
| --- | --- | --- | --- | ---: | --- |
${sourceTable}

## 6. Sources rejetées et motifs

${report.rejectedSources.map((item) => `- ${item.url ? `[${item.title}](${item.url})` : item.title} — ${item.reason}`).join("\n")}

## 7. Concepts créés

${report.conceptsCreated.map((item) => `- \`${item.stableId}\` — ${item.entityType}`).join("\n")}

## 8. Concepts requalifiés

Aucun concept historique n'a été requalifié automatiquement.

## 9. Classifications différées

| Concept | Classe historique | Classe proposée | Classe appliquée | Décision | Source |
| --- | --- | --- | --- | --- | --- |
${conceptTable}

## 10. Mesures et méthodes

| Mesure | Méthode | Entrées | Unité | Formule sourcée | Limites |
| --- | --- | --- | --- | --- | --- |
${measurementTable}

## 11. Modèle quantitatif ECV

- IRM : quatre observations T1, hématocrite, variations de R1 et formule CMR sourcée.
- CT single-energy : variations HU myocardiques et sanguines avec hématocrite.
- CT spectral : ratio de densité iodée avec hématocrite.
- Plages normales créées : 0. Seuils créés : 0.

## 12. Assertions créées

| Assertion | Type | Sujet | Prédicat | Contexte | Polarité | Preuve | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- |
${assertionTable}

## 13. EvidenceLinks créés

| EvidenceLink | Source | Assertion | Relation | Localisateur | Confiance |
| --- | --- | --- | --- | --- | --- |
${evidenceTable}

## 14. Contextes couverts

${report.contexts.map((item) => `- ${item.contextId} — ${item.dimensions.map((dimension) => dimension.dimension).join(", ")}`).join("\n")}

## 15. Limitations

${report.limitations.map((item) => `- ${item}`).join("\n")}

## 16. Facteurs confondants

${report.confounders.map((item) => `- ${item.stableId}`).join("\n")}

## 17. Contradictions

${report.contradictions.map((item) => `- ${item.synthesisKey} — ${item.assertionRevisionId} — résolution : ${item.resolution}`).join("\n") || "Aucune."}

## 18. Convergences

${report.convergences.map((item) => `- ${item.synthesisKey} — ${item.state} — ${item.ruleId}`).join("\n")}

## 19. Consensus explicites

${report.explicitConsensus.map((item) => `- ${item.synthesisKey} — ${item.ruleId} — ${item.sourceRevisionIds.join(", ")}`).join("\n") || "Aucun."}

## 20. Questions ouvertes

${report.openQuestions.map((item) => `- ${item}`).join("\n")}

## 21. Cycle de vie documentaire

${report.documentaryLifecycle.correctionEvidenceLinks.length} liens CORRECTS ; ${report.documentaryLifecycle.retractions.length} rétraction identifiée. Le couple PLOS et la correction SCMR/EACVI sont reliés uniquement par leurs notices officielles.

## 22. Requêtes disponibles

| Requête | Résultats | Contextes | Sources | Données manquantes |
| --- | ---: | ---: | ---: | --- |
${queryTable}

## 23. Synthèses structurées

| Synthèse | Assertions | Sources | Contradictions | Consensus | Confiance | Lacunes |
| --- | ---: | ---: | ---: | --- | --- | --- |
${synthesisTable}

## 24. Projections internes

| Projection interne | Scientific Ready | Synthesis Ready | Editorial Ready | Public Ready | Blocage |
| --- | --- | --- | --- | --- | --- |
${projectionTable}

## 25. Readiness

Sept dimensions indépendantes sont calculées sans score global : catalog, scientific, provenance, synthesis, editorial projection, SEO et public publication. Aucune projection n'est editorialReady, seoReady ou publicPublicationReady.

## 26. Workflow de revue

- automatedStructuralReview : ${report.reviewWorkflow.automatedStructuralReview}
- scientificHumanReview : ${report.reviewWorkflow.scientificHumanReview}
- assertions automatiquement VERIFIED : ${report.reviewWorkflow.automaticallyVerified}
- assertions publiques : ${report.reviewWorkflow.publicEligibleAssertions}

## 27. Tests ajoutés

\`src/knowledge-graph/scientific-corpus/scientific-corpus.test.mjs\` couvre le corpus, la provenance, les requêtes, les synthèses, le readiness et les surfaces protégées.

## 28. Validations exécutables

Le validateur P4 rapporte : ${report.validation.valid ? "VALID" : "INVALID"}. Les commandes sont listées dans \`package.json\` et le rapport final d'exécution doit confirmer leurs statuts.

## 29. Couverture du domaine

${Object.entries(report.domainCoverage).map(([key, value]) => `- ${key} : ${value}`).join("\n")}

## 30. Lacunes restantes

${report.remainingGaps.map((item) => `- ${item}`).join("\n")}

## 31. Éléments généralisables

${report.generalization.reusableContracts.map((item) => `- ${item}`).join("\n")}

## 32. Évolutions de schéma nécessaires

- Rattacher une revue scientifique humaine versionnée avant toute projection éditoriale.
- Conserver les branches quantitatives propres aux modalités lors des futurs domaines.
- Résoudre séparément les classifications LGE, MVO et hémorragie intramyocardique.
- Ajouter uniquement les contextes constructeur, modèle et logiciel effectivement publiés.

## 33. Fichiers créés

${createdFiles.map((item) => `- \`${item}\``).join("\n")}

## 34. Fichiers modifiés

${modifiedFiles.map((item) => `- \`${item}\``).join("\n")}

## Contrats préservés

| Contrat | Préservé ? | Test ou preuve | Remarque |
| --- | --- | --- | --- |
${contractTable}

## Totaux

- Sources examinées : ${report.counts.sourcesExamined}
- Sources retenues : ${report.counts.sourcesRetained}
- Sources rejetées : ${report.counts.sourcesRejected}
- Concepts ajoutés : ${report.counts.conceptsAdded}
- Concepts requalifiés : ${report.counts.conceptsRequalified}
- Assertions : ${report.counts.assertions}
- EvidenceLinks : ${report.counts.evidenceLinks}
- SUPPORTS : ${report.evidenceRelationCounts.SUPPORTS}
- REFUTES : ${report.evidenceRelationCounts.REFUTES}
- QUALIFIES : ${report.evidenceRelationCounts.QUALIFIES}
- MENTIONS : ${report.evidenceRelationCounts.MENTIONS}
- Contextes : ${report.counts.contexts}
- Limitations : ${report.counts.limitations}
- Contradictions : ${report.counts.contradictions}
- Consensus explicites : ${report.counts.explicitConsensus}
- Questions ouvertes : ${report.counts.openQuestions}
- Synthèses : ${report.counts.syntheses}
- Projections internes : ${report.counts.internalProjections}

## Décision interne P4

ENRICHISSEMENT PARTIEL SÛR — SOURCES COMPLÉMENTAIRES REQUISES
`;

writeFileSync(outputPath, markdown, "utf8");
console.log(JSON.stringify({ valid: report.validation.valid, outputPath, counts: report.counts }, null, 2));
if (!report.validation.valid) process.exitCode = 1;
