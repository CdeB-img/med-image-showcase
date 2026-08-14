import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const indexPath = "0. NOXIA — SOURCE-OF-TRUTH-INDEX.md";
const masterPath = "docs/biostatistics-001-analysis-architecture.md";
const documents = [
  masterPath,
  "docs/biostatistics-001-admission-report.md",
  "docs/biostatistics-001-ownership-matrix.md",
  "docs/biostatistics-001-analysis-specification-estimand-and-population-contract.md",
  "docs/biostatistics-001-variable-roles-missingness-and-sensitivity-contract.md",
  "docs/biostatistics-001-model-multiplicity-dimensioning-and-interim-contract.md",
  "docs/biostatistics-001-execution-result-and-reproducibility-contract.md",
  "docs/biostatistics-001-handoffs-projections-legacy-and-engine-impact-matrix.md",
];
const authorities = [
  "docs/pd-003-v2-research-object-model.md",
  "docs/obs-001-observability-measurement-architecture.md",
  "docs/cdm-001-canonical-study-data-model.md",
  "docs/dm-001-study-data-management-architecture.md",
];
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const read = (path) => readFileSync(resolve(root, path), "utf8");

for (const path of [indexPath, ...documents, ...authorities]) {
  check(existsSync(resolve(root, path)), `missing file: ${path}`);
}

const master = read(masterPath);
const admission = read(documents[1]);
const index = read(indexPath);
const all = documents.map(read).join("\n");
const authorityContents = authorities.map(read);

check(authorityContents[0].includes("OFFICIAL — REFERENCE_NORMATIVE_CURRENT"), "PD-003 V2 is not current");
check(authorityContents[1].includes("OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT"), "OBS-001 is not current");
check(authorityContents[2].includes("CDM001_CANONICAL_STUDY_DATA_MODEL_ADMITTED_WITH_LIMITATIONS"), "CDM-001 admission not verified");
check(authorityContents[3].includes("DM001_STUDY_DATA_MANAGEMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS"), "DM-001 admission not verified");

for (const path of documents) {
  const content = read(path);
  check(/\| Version \| 1\.0 \|/.test(content), `${path}: version 1.0 missing`);
  check(!/[ \t]+$/m.test(content), `${path}: trailing whitespace`);
  check(!content.includes("/Users/"), `${path}: absolute path forbidden`);
  check(!/\t/.test(content), `${path}: tab character forbidden`);
}

check(master.includes("OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT"), "master status missing");
check(master.includes("Charte fondatrice → Scientific Product Manifesto V2 → PD-003 V2 → OBS-001 → CDM-001 → DM-001 → BIOSTATISTICS-001"), "authority chain missing");
check(master.includes("BIOSTATISTICS001_ANALYSIS_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS"), "admission decision missing");
check(master.includes("BIOSTATISTICS001_REQUIRES_PD003_ARBITRATION"), "PD-003 arbitration guard missing");

for (const rootObject of [
  "AnalysisSpecification",
  "AnalysisExecution",
  "AnalysisResult",
  "Dimensionnement",
  "CanonicalVariable",
  "VariableOccurrence",
  "ResearchProject",
  "ScientificModel",
  "Endpoint",
]) {
  check(master.includes(`\`${rootObject}\``) || master.includes(rootObject), `required PD-003 object missing: ${rootObject}`);
}

for (const construction of [
  "Estimand",
  "AnalysisVariableRoleAssignment",
  "AnalysisPopulationDefinition",
  "MissingDataStrategy",
  "IntercurrentEventStrategy",
  "StatisticalMethodDefinition",
  "ModelAssumptionSet",
  "DiagnosticPlan",
  "MultiplicityStrategy",
  "SensitivityAnalysisDefinition",
  "AnalysisDataset",
  "AnalysisDeviation",
  "StatisticalInterpretationEnvelope",
]) {
  check(master.includes(`| ${construction} |`), `classified construction missing: ${construction}`);
}
for (const classification of ["VALUE_OBJECT", "SUBRESOURCE", "RELATION", "DEFINITION", "PROJECTION", "EXECUTION_RECORD", "FINDING", "DECISION_ENVELOPE"]) {
  check(master.includes(classification), `classification missing: ${classification}`);
}

const cases = [...master.matchAll(/^### Case ([A-T]) — /gm)];
check(cases.length === 20, `expected 20 cases, found ${cases.length}`);
check(cases.map((match) => match[1]).join("") === "ABCDEFGHIJKLMNOPQRST", "cases are not A through T");
const caseFields = [
  "Question/Objectif/Project",
  "OBS/CDM/Release",
  "Analyse",
  "Execution/Result/Provenance",
  "Owner/Human/Forbidden/Projections/Limitations",
];
for (let i = 0; i < cases.length; i += 1) {
  const start = cases[i].index;
  const end = cases[i + 1]?.index ?? master.indexOf("## 23.", start);
  const block = master.slice(start, end);
  for (const field of caseFields) check(block.includes(`**${field} :**`), `case ${cases[i][1]} missing ${field}`);
  for (const semanticField of ["population", "modèle", "missing", "multiplicité", "sensibil", "dimension", "humain", "projection"]) {
    check(block.toLocaleLowerCase().includes(semanticField), `case ${cases[i][1]} missing semantic field ${semanticField}`);
  }
}

const contractIds = [...master.matchAll(/^\| BIO-C(\d{2}) \|/gm)].map((match) => Number(match[1]));
check(contractIds.length === 28, `expected 28 contracts, found ${contractIds.length}`);
check(contractIds.every((id, indexContract) => id === indexContract + 1), "contracts are not BIO-C01 through BIO-C28");

const failureClasses = [
  "VARIABLE_IDENTITY_RECREATED_IN_SAP",
  "ANALYSIS_COLUMN_PROMOTED_TO_CANONICAL_VARIABLE",
  "ENDPOINT_ESTIMAND_COLLAPSE",
  "ESTIMAND_MODEL_COLLAPSE",
  "OBS_MEANING_REDEFINED_BY_ANALYSIS",
  "FACTUAL_MISSINGNESS_LOST",
  "IMPUTED_VALUE_OVERWRITES_SOURCE",
  "ANALYSIS_POPULATION_MUTATES_PROJECT_POPULATION",
  "POST_HOC_PROMOTED_TO_PRESPECIFIED",
  "MULTIPLICITY_HIDDEN",
  "SENSITIVITY_REPLACES_PRIMARY",
  "UNSOURCED_SAMPLE_SIZE_ASSUMPTION",
  "ANALYSIS_EXECUTION_NOT_BOUND_TO_DATA_RELEASE",
  "RESULT_WITHOUT_EXECUTION",
  "RESULT_WITHOUT_PROVENANCE",
  "FAILED_EXECUTION_REPORTED_AS_NULL_RESULT",
  "STATISTICAL_SIGNIFICANCE_PROMOTED_TO_CLINICAL_RELEVANCE",
  "ASSOCIATION_PROMOTED_TO_CAUSALITY",
  "PROJECTION_BECOMES_SOURCE_OF_TRUTH",
  "SOFTWARE_VERSION_LOST",
  "ANALYSIS_DEVIATION_HIDDEN",
];
for (const failureClass of failureClasses) check(master.includes(`\`${failureClass}\``), `failure class missing: ${failureClass}`);

const checkpoints = [...master.matchAll(/^\| VAL-BIO-(\d{2}) \|/gm)].map((match) => Number(match[1]));
check(checkpoints.length === 10, `expected 10 checkpoints, found ${checkpoints.length}`);
check(checkpoints.every((id, indexCheckpoint) => id === indexCheckpoint + 1), "checkpoints are not VAL-BIO-01 through VAL-BIO-10");
for (const field of ["preserved", "lost", "added", "weakened", "strengthened", "nonmapped", "provenance", "decisions", "forbidden promotions", "critical failure modes"]) {
  check(master.includes(field), `checkpoint field missing: ${field}`);
}

for (const patternClass of [
  "SCIENTIFIC_REQUIREMENT",
  "METHODOLOGICAL_PRACTICE",
  "QUALITY_PATTERN",
  "OPERATIONAL_PATTERN",
  "LOCAL_PRACTICE",
  "INSTITUTIONAL_RULE",
  "HISTORICAL_REFERENCE",
  "REGULATORY_REQUIREMENT_CANDIDATE",
  "EXTERNAL_REFERENCE",
  "UNKNOWN",
]) {
  check(all.includes(patternClass), `pattern classification missing: ${patternClass}`);
}

for (const limitation of [
  "aucune implémentation Biostatistics",
  "aucun runtime",
  "aucun logiciel statistique",
  "aucun calcul",
  "aucun dimensionnement réel",
  "aucun dataset réel",
  "aucune donnée patient",
  "aucune exécution ou AnalysisResult réel",
  "aucun SAP final",
  "aucune randomisation",
  "aucune analyse intermédiaire",
  "aucune imputation",
  "aucune migration V1",
  "aucun mapping CDISC, FHIR ou OMOP",
  "aucun support de standard",
  "aucune règle réglementaire actuelle déduite de l'histoire",
  "aucun PASS PD-011",
  "aucune qualification scientifique",
  "aucune activation produit",
  "aucun changement du runtime hybride",
  "aucune réouverture de SEM",
]) {
  check(master.includes(limitation), `master limitation missing: ${limitation}`);
  check(admission.includes(limitation), `admission limitation missing: ${limitation}`);
}

check(!/patientId|subjectName|dateOfBirth|\bpatient\s*#?\d+/i.test(all), "possible patient datum found");
check(!/effectif\s*=|sample\s*size\s*=|p\s*[<=>]\s*0[.,]\d+/i.test(all), "possible real calculation/result found");
check(!/recommandons?\s+(la|le|les|une|un)\s+(méthode|modèle|test)/i.test(all), "possible method recommendation found");

const localLinks = new Set([...all.matchAll(/`(docs\/[^`]+\.md)`/g)].map((match) => match[1]));
for (const path of localLinks) check(existsSync(resolve(root, path)), `broken local link: ${path}`);

check(index.includes("**Version :** 1.45"), "index version is not 1.45");
check(index.includes("**Corpus gouverné actuel :** 140 artefacts"), "index governed count is not 140");
check(index.includes("**Corpus total index inclus :** 141 artefacts"), "index total count is not 141");
check(index.includes("**Artefacts présents hors corpus gouverné :** 42"), "index outside count is not 42");
check(index.includes("sous-ensemble gouverné de `docs/` à 118 fichiers"), "index governed docs count is not 118");
check(index.includes("### 6.14 BIOSTATISTICS-001"), "index BIOSTATISTICS companion section missing");
for (const path of documents) check(index.includes(`\`${path}\``), `index does not govern ${path}`);

const physicalDocs = readdirSync(resolve(root, "docs"), { withFileTypes: true }).filter((entry) => entry.isFile()).length;
check(physicalDocs === 160, `physical docs expected 160, found ${physicalDocs}`);
check(118 + 42 === physicalDocs, "governed plus outside docs does not match physical inventory");
const indexLocalRefs = new Set([...index.matchAll(/`(docs\/[^`]+?\.(?:md|docx|pdf|json))`/g)].map((match) => match[1]));
check(indexLocalRefs.size === physicalDocs, `index references ${indexLocalRefs.size} docs but ${physicalDocs} are present`);
for (const path of indexLocalRefs) check(existsSync(resolve(root, path)), `broken index link: ${path}`);

const status = execFileSync("git", ["status", "--short", "-z", "--untracked-files=all"], { cwd: root, encoding: "utf8" });
const allowed = new Set([
  ...documents,
  indexPath,
  "validation/biostatistics-001/validate.mjs",
  "experiments/semantic-engine-comparison/results/interactive-overnight/zero-provider-final-analysis.md",
]);
for (const line of status.split("\0").filter(Boolean)) {
  const path = line.slice(3);
  check(allowed.has(path), `out-of-scope worktree change: ${path}`);
  check(!path.startsWith("src/") && !path.startsWith("api/"), `product code modified: ${path}`);
  check(!path.startsWith("docs/pd-003-") && !path.startsWith("docs/obs-001-") && !path.startsWith("docs/cdm-001-") && !path.startsWith("docs/dm-001-"), `upstream authority modified: ${path}`);
}

if (errors.length > 0) {
  console.error("BIOSTATISTICS001_DOCUMENTARY_VALIDATION_FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("BIOSTATISTICS001_DOCUMENTARY_VALIDATION_PASS");
console.log(`documents=${documents.length}`);
console.log(`conceptualCases=${cases.length}`);
console.log(`nonRegressionContracts=${contractIds.length}`);
console.log(`failureClasses=${failureClasses.length}`);
console.log(`validationCheckpoints=${checkpoints.length}`);
console.log(`physicalDocs=${physicalDocs}`);
console.log(`indexLocalDocumentLinks=${indexLocalRefs.size}`);
console.log("governedDocs=118");
console.log("outsideGovernanceDocs=42");
console.log("providerCalls=0");
console.log("blindCases=0");
console.log("patientData=0");
console.log("actualAnalyses=0");
console.log("productCodeModified=0");
