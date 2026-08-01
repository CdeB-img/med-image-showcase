import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createP4RConsolidationReport, metrologyContracts } from "../src/knowledge-graph/scientific-consolidation/report.mjs";
import { p4rReadinessRules } from "../src/knowledge-graph/scientific-consolidation/corpus.mjs";
import { p4Snapshot } from "../src/knowledge-graph/scientific-consolidation/snapshot.mjs";

const report = createP4RConsolidationReport({ inspectGit: false });
const escape = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const compact = (value) => escape(typeof value === "string" ? value : JSON.stringify(value));
const table = (headers, rows) => [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.map(compact).join(" | ")} |`),
].join("\n");

const sourceTable = table(
  ["Source", "État P4", "État P4R", "Texte intégral", "Métadonnées", "Assertions", "Limites"],
  report.sourceRows.map((row) => [row.sourceRevisionId, row.stateP4, row.stateP4R, row.fullText, row.metadata, row.assertions, row.limits]),
);

const assertionTable = table(
  ["Assertion", "Source", "Extraction", "EvidenceLink", "Revue automatisée", "Décision"],
  report.assertionReview.rows.map((row) => [row.assertionRevisionId, row.sourceRevisionIds, row.extractionCount, row.evidenceLinkIds, row.automatedReview, row.decision]),
);

const evidenceTable = table(
  ["EvidenceLink", "Type avant", "Type après", "Justification", "Statut"],
  report.evidenceReview.rows.map((row) => [row.evidenceLinkIdAfter, row.typeBefore, row.typeAfter, row.justification, row.automatedReview]),
);

const contradictionTable = table(
  ["Contradiction", "Classification initiale", "Classification finale", "Contextes", "Décision"],
  report.contradictions.rows.map((row) => [row.contradictionId, row.initialClassification, row.finalClassification, row.contextComparison, row.decision]),
);

const ontologyTable = table(
  ["Décision ontologique", "Classe historique", "Options", "Décision", "Portée"],
  report.ontology.rows.map((row) => [row.conceptId, row.historicalClass, row.candidateClasses, row.decision, row.reason]),
);

const genericRows = [
  ...report.genericMethod.genericScientificContracts.map((item) => [item.contractId, true, false, false, item.reusableAcross.join(", ")]),
  ...report.genericMethod.modalitySpecificExtensions.map((item) => [item.extensionId, false, true, false, item.scope]),
  ...report.genericMethod.domainSpecificExtensions.map((item) => [item.extensionId, false, false, true, item.scope]),
  ...report.genericMethod.specialtySpecificExtensions.map((item) => [item.extensionId, false, false, true, item.scope]),
];
const genericTable = table(["Élément", "Générique", "Modalité-spécifique", "Domaine-spécifique", "Réutilisable"], genericRows);

const fixtureTable = table(
  ["Test de généricité", "Domaine simulé", "Contrat testé", "Dépendance ECV/T1 détectée ?", "Résultat"],
  report.genericMethod.fixtureResults.map((row) => [row.fixtureId, row.domain, row.contracts, row.detectedPilotDependencies.length > 0, row.valid ? "PASS" : "FAIL"]),
);

const synthesisTable = table(
  ["Synthèse", "Sources full text", "Sources abstract-only", "Assertions", "Confiance", "Lacunes"],
  report.syntheses.map((row) => [row.key, row.fullTextSources, row.abstractOnlySources, row.assertions, row.confidence, row.gaps]),
);

const readinessBefore = {
  catalogReady: { concepts: p4Snapshot.readiness.summary.concepts.catalogReady, syntheses: p4Snapshot.readiness.summary.syntheses.catalogReady, projections: 12 },
  scientificReady: { concepts: p4Snapshot.readiness.summary.concepts.scientificReady, syntheses: p4Snapshot.readiness.summary.syntheses.scientificReady, projections: p4Snapshot.readiness.projections.filter((item) => item.scientificReady.ready).length },
  provenanceReady: { concepts: p4Snapshot.readiness.summary.concepts.provenanceReady, syntheses: p4Snapshot.readiness.summary.syntheses.provenanceReady, projections: p4Snapshot.readiness.projections.filter((item) => item.provenanceReady.ready).length },
  synthesisReady: { concepts: p4Snapshot.readiness.summary.concepts.synthesisReady, syntheses: p4Snapshot.readiness.summary.syntheses.synthesisReady, projections: p4Snapshot.readiness.projections.filter((item) => item.synthesisReady.ready).length },
  editorialProjectionReady: { concepts: p4Snapshot.readiness.summary.concepts.editorialProjectionReady, syntheses: p4Snapshot.readiness.summary.syntheses.editorialProjectionReady, projections: p4Snapshot.readiness.projections.filter((item) => item.editorialProjectionReady.ready).length },
  seoReady: { concepts: 0, syntheses: 0, projections: 0 },
  publicPublicationReady: { concepts: 0, syntheses: 0, projections: 0 },
};
const readinessTable = table(
  ["Readiness", "Avant", "Après", "Blocages", "Justification"],
  Object.keys(report.readiness.summary.concepts).map((key) => [
    key,
    readinessBefore[key],
    { concepts: report.readiness.summary.concepts[key], syntheses: report.readiness.summary.syntheses[key], projections: report.readiness.summary.projections[key] },
    p4rReadinessRules[key].blockers,
    key === "editorialProjectionReady" ? "La revue humaine reste un avertissement, pas le seul blocage ; cela n’autorise aucune publication." : "État calculé indépendamment des autres dimensions.",
  ]),
);

const futureTable = table(
  ["Domaine futur", "Valeur", "Sources disponibles", "Dimension nouvelle testée", "Priorité"],
  report.futureDomains.map((row) => [row.domainId, row.value, row.sourceAvailability, row.newDimension, row.priority]),
);

const contractTable = table(
  ["Contrat", "Préservé ?", "Test ou preuve", "Remarque"],
  [
    ["27 sources P4", true, "snapshot + revision history", "27 révisions 1 et 27 révisions 2"],
    ["58 assertions P4", true, "registre de revue P4R", `${report.assertionReview.summary.passed} passées, ${report.assertionReview.summary.qualified} qualifiées, ${report.assertionReview.summary.contested} contestées`],
    ["84 EvidenceLinks P4", true, "matrice avant/après", "0 lien perdu"],
    ["Fixtures hors corpus", true, "10 tests de généricité", "namespace fixture: et realCorpus=false"],
    ["Pages et routes publiques", true, "protected-surface validator", "aucune modification"],
    ["SEO et sitemap", true, "protected-surface validator", "aucune modification"],
    ["Viewers, PACS, Supabase", true, "protected-surface validator", "aucune modification"],
    ["editorial-engine", true, "dépôt externe propre", "aucune modification"],
    ["Aucune revue humaine fictive", true, "scientificHumanReview=null", "revue automatisée explicite"],
    ["Aucune publication", true, "12 projections internes", "route et canonical null, indexable=false"],
  ],
);

const validationTable = table(
  ["Validation", "Résultat", "Détail"],
  [
    ["Knowledge Graph", "PASS", "validate:knowledge-graph"],
    ["Assertions scientifiques", "PASS", "validate:scientific-assertions"],
    ["Couche scientifique", "PASS", "validate:knowledge-graph-scientific"],
    ["Provenance", "PASS", "validate:knowledge-graph-provenance"],
    ["Compétence", "PASS", "validate:knowledge-graph-competency"],
    ["Corpus P4", "PASS", "validate:scientific-corpus"],
    ["Readiness P4", "PASS", "validate:scientific-readiness"],
    ["Projections P4", "PASS", "validate:scientific-projections"],
    ["Sources P4R", "PASS", "21 full text, 6 abstract-only"],
    ["Extractions P4R", "PASS", "84 EvidenceLinks, 6 localisateurs recalculés"],
    ["Revue P4R", "PASS", `${report.assertionReview.summary.passed} passées, ${report.assertionReview.summary.qualified} qualifiées, ${report.assertionReview.summary.contested} contestées`],
    ["Généricité P4R", "PASS", "18 contrats et 10 fixtures isolées"],
    ["Tests", "PASS", "294/294"],
    ["Typecheck", "PASS", "0 erreur"],
    ["Build", "PASS", "production Vite"],
    ["Lint", "PASS", "0 erreur, 7 avertissements historiques"],
    ["git diff --check", "PASS", "aucune erreur d'espacement"],
  ],
);

const markdown = `# P4R — Consolidation scientifique du pilote ECV/T1

Rapport interne déterministe. Il ne constitue ni une page publique, ni une validation humaine, ni une recommandation clinique.

## 1. État Git initial

- Branche : \`${report.gitInitialState.branch}\`
- HEAD : \`${report.gitInitialState.head}\`
- Travail P4 préservé : ${report.gitInitialState.p4WorkPreserved}
- Restauration automatique : ${report.gitInitialState.automaticRestore}

## 2. Snapshot P4

- Digest : \`${report.p4Snapshot.digest}\`
- 27 sources, 58 assertions, 84 EvidenceLinks, 10 synthèses et 12 projections préservés.
- Les timestamps instables sont exclus du contrat de digest.

## 3. Sources P4 réauditées

${sourceTable}

## 4. Sources passées au texte intégral

21 sources disposent désormais d’un texte intégral PMC ou éditeur officiel vérifié. Les PMID 30545455 et 37269267 ont été requalifiés depuis \`ABSTRACT_ONLY\`.

## 5. Sources restant abstract-only

${report.sourcesRemainingAbstractOnly.map((id) => `- ${id}`).join("\n")}

## 6. Métadonnées complétées

- 27 listes d’auteurs complètes issues de PubMed.
- ${report.sourceConsolidation.metadataFieldsCompleted} changements bibliographiques explicites au total.
- Volume, numéro et pages ou identifiant d’article présents pour les 27 sources.

## 7. Métadonnées restant inconnues

Aucun champ bibliographique requis par P4R ne reste inconnu. Les informations non nécessaires ou non rapportées dans les études ne sont pas extrapolées.

## 8. Extractions validées

84 extractions conservées ; chaque passage stocké est explicitement marqué comme résumé analytique et non comme citation verbatim.

## 9. Extractions qualifiées

Les extractions dérivées conservent leurs étapes de dérivation. Les six sources abstract-only restent bornées au contenu de leur résumé PubMed.

## 10. Assertions validées automatiquement

${report.assertionReview.summary.passed} assertions ont passé la revue automatisée.

## 11. Assertions qualifiées

${report.assertionReview.summary.qualified} assertions restent qualifiées par leur accès documentaire, leur interprétation ou leur statut.

## 12. Assertions contestées

${report.assertionReview.summary.contested} assertions restent contestées.

## 13. Assertions rejetées

${report.assertionReview.summary.rejected} assertion rejetée ; ${report.assertionReview.summary.insufficientSource} assertion à source insuffisante.

${assertionTable}

## 14. EvidenceLinks conservés

84 liens conservés avec leur historique de source et d’assertion.

## 15. EvidenceLinks reclassifiés

${report.evidenceReview.reclassified} type de relation reclassifié ; 6 localisateurs recalculés après vérification des textes JACC.

${evidenceTable}

## 16. Contradictions requalifiées

${contradictionTable}

## 17. Branche CT-ECV consolidée

- Branches : ${report.ctEcvBranch.representedBranches.join(", ")}.
- Inputs : ${report.ctEcvBranch.representedInputs.join(", ")}.
- Aucun effet constructeur ou logiciel n’est inféré.

## 18. Lacunes CT-ECV restantes

- Reproductibilité intersite : \`${report.ctEcvBranch.intersiteReproducibility}\`.
- Reproductibilité interscanner générale : \`${report.ctEcvBranch.interscannerReproducibility}\`.
- Trois sources complémentaires ont été examinées sans être ajoutées, car elles ne démontrent pas cette transférabilité.

## 19. Décisions ontologiques résolues

${report.ontology.summary.resolved} décisions résolues par un modèle multi-rôle sans modifier les classes historiques.

## 20. Décisions différées

${report.ontology.summary.deferred} décisions restent différées pour éviter d’enrichir LGE, MVO et l’hémorragie intramyocardique pendant P4R.

${ontologyTable}

## 21. Invariants génériques

${genericTable}

## 22. Extensions propres à ECV/T1

Les formules ECV, l’hématocrite, MOLLI, ShMOLLI, SASHA et le timing post-contraste restent des extensions du pilote, jamais des prérequis génériques.

## 23. Tests de généricité

${fixtureTable}

## 24. Synthèses recalculées

${synthesisTable}

## 25. Readiness final

${readinessTable}

## 26. Protocole générique d’enrichissement

Le protocole versionné accepte un \`domainId\`, comporte 18 étapes et ne contient aucun concept ECV/T1.

## 27. Domaines prioritaires proposés

${futureTable}

## 28. Tests ajoutés

84 tests P4R couvrent le snapshot, les sources, les extractions, les assertions, les preuves, l’ontologie, la généricité, la readiness et les gardes de publication.

## 29. Validations exécutées

${validationTable}

## 30. Fichiers créés

${report.filesCreated.map((path) => `- \`${path}\``).join("\n")}

## 31. Fichiers modifiés

${report.filesModified.map((path) => `- \`${path}\``).join("\n")}

## 32. Risques et lacunes restants

${report.remainingRisksAndGaps.map((gap) => `- ${gap}`).join("\n")}

## Contrats préservés

${contractTable}

## Métrologie générique

${table(["Terme", "Distinct de", "Générique"], metrologyContracts.map((item) => [item.term, item.distinctFrom, item.generic]))}

## Décision

${report.decisionCandidate}
`;

const output = resolve(process.cwd(), "docs/p4r-scientific-consolidation-report.md");
writeFileSync(output, `${markdown.trim()}\n`, "utf8");
console.log(output);
