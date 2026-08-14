import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const indexPath = "0. NOXIA — SOURCE-OF-TRUTH-INDEX.md";
const masterPath = "docs/dm-001-study-data-management-architecture.md";
const documents = [
  masterPath,
  "docs/dm-001-admission-report.md",
  "docs/dm-001-ownership-matrix.md",
  "docs/dm-001-collection-source-and-ingestion-contract.md",
  "docs/dm-001-quality-query-correction-and-reconciliation-contract.md",
  "docs/dm-001-transformation-freeze-lock-release-and-audit-contract.md",
  "docs/dm-001-legacy-compatibility-and-engine-impact-matrix.md",
];
const authorities = {
  pd003: "docs/pd-003-v2-research-object-model.md",
  obs001: "docs/obs-001-observability-measurement-architecture.md",
  cdm001: "docs/cdm-001-canonical-study-data-model.md",
};
const newlyClassifiedOutside = [
  "docs/hybrid-runtime-integration-001-report.md",
  "docs/hybrid-runtime-prototype-01-report.md",
  "docs/noxia-core-transition-001-engine-lab-sem-recycling-and-capability-portfolio-report.md",
  "docs/noxia-post-hybrid-architecture-transition.md",
  "docs/sem-003d-comp-common-blind-comparative-qualification-report.md",
  "docs/sem-closure-001-report.md",
  "docs/sem-closure-001r-report.md",
];

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const read = (path) => readFileSync(resolve(root, path), "utf8");

for (const path of [indexPath, ...documents, ...Object.values(authorities)]) {
  check(existsSync(resolve(root, path)), `missing file: ${path}`);
}

const master = read(masterPath);
const admission = read(documents[1]);
const index = read(indexPath);
const allDm = documents.map((path) => read(path)).join("\n");
const pd003 = read(authorities.pd003);
const obs001 = read(authorities.obs001);
const cdm001 = read(authorities.cdm001);

check(pd003.includes("PD-003 V2"), "PD-003 V2 identity cannot be verified");
check(pd003.includes("OFFICIAL — REFERENCE_NORMATIVE_CURRENT"), "PD-003 V2 current status cannot be verified");
check(obs001.includes("OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT"), "OBS-001 current status cannot be verified");
check(cdm001.includes("OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT"), "CDM-001 current status cannot be verified");
check(cdm001.includes("CDM001_CANONICAL_STUDY_DATA_MODEL_ADMITTED_WITH_LIMITATIONS"), "CDM-001 admission decision cannot be verified");
check(cdm001.includes("Data Management et Biostatistics restent des responsabilités futures"), "CDM-001 upstream boundary cannot be verified");

for (const path of documents) {
  const content = read(path);
  check(/\| Version \| 1\.0 \|/.test(content), `${path}: version 1.0 missing`);
  check(!/[ \t]+$/m.test(content), `${path}: trailing whitespace`);
  check(!content.includes("/Users/"), `${path}: absolute path forbidden`);
  check(!/\t/.test(content), `${path}: tab character forbidden`);
}

check(
  master.includes("OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT"),
  "master status is not official normative specialized current",
);
check(
  master.includes("Charte fondatrice → Scientific Product Manifesto V2 → PD-003 V2 → OBS-001 → CDM-001"),
  "authority hierarchy missing from master",
);
check(
  master.includes("Aucun nouvel objet racine PD-003 n’est requis"),
  "PD-003 root arbitration is not explicit",
);
check(
  master.includes("CDM-001 reste inchangé"),
  "CDM non-redefinition statement missing",
);

const artefacts = [
  "DataManagementDefinition",
  "DataCollectionSpecification",
  "DataIngestionRecord",
  "DataQualityFinding",
  "DataQuery",
  "DataCorrectionRecord",
  "ReconciliationRecord",
  "TransformationDefinition",
  "TransformationExecution",
  "DataSnapshot",
  "DataFreeze",
  "DataLock",
  "DatasetRelease",
  "AuditEvent",
];
for (const artefact of artefacts) {
  check(master.includes(`| ${artefact} |`), `master artefact missing: ${artefact}`);
}
for (const classification of [
  "OPERATIONAL_ARTEFACT",
  "DEFINITION",
  "EXECUTION_RECORD",
  "FINDING",
  "DECISION_ENVELOPE",
  "PROJECTION",
  "AUDIT_RECORD",
]) {
  check(master.includes(classification), `artefact classification missing: ${classification}`);
}

const caseMatches = [...master.matchAll(/^### ([A-O]) — (.+)$/gm)];
check(caseMatches.length === 15, `expected 15 conceptual cases, found ${caseMatches.length}`);
check(
  caseMatches.map((match) => match[1]).join("") === "ABCDEFGHIJKLMNO",
  "conceptual cases are not exactly A through O",
);
const caseFields = [
  "Objets Project/CDM/OBS concernés",
  "Source prévue et réelle",
  "Occurrence",
  "Statut de valeur",
  "Missingness",
  "Qualité",
  "Query",
  "Correction",
  "Transformation",
  "Provenance",
  "Lineage",
  "Owner",
  "Décision humaine",
  "Objets interdits",
  "Projections concernées",
];
for (let indexCase = 0; indexCase < caseMatches.length; indexCase += 1) {
  const start = caseMatches[indexCase].index;
  const end = caseMatches[indexCase + 1]?.index ?? master.indexOf("## 18.", start);
  const block = master.slice(start, end);
  for (const field of caseFields) {
    check(block.includes(`**${field} :**`), `case ${caseMatches[indexCase][1]} missing field: ${field}`);
  }
}

const contracts = [
  "Data Management ne crée pas une CanonicalVariable.",
  "Un champ eCRF n’est pas propriétaire de l’identité de Variable.",
  "Une colonne dataset n’est pas propriétaire de l’identité de Variable.",
  "Une correction conserve l’état antérieur.",
  "Aucune correction silencieuse.",
  "Une query ne modifie aucune donnée à elle seule.",
  "Le missingness factuel reste distinct du traitement statistique.",
  "Une valeur absente n’est jamais imputée par Data Management.",
  "La source prévue reste distincte de la source réelle.",
  "La méthode prévue reste distincte de la méthode réelle.",
  "Toute transformation conserve ses parents de lignage.",
  "Une conversion d’unité est versionnée et traçable.",
  "Une dérivation ne masque pas ses occurrences sources.",
  "Un snapshot ne devient pas une seconde vérité.",
  "Un release ancien reste reconstructible après correction.",
  "Un lock ne peut être levé sans acteur, mandat et raison.",
  "Biostatistics ne modifie pas les occurrences sources.",
  "Data Management ne modifie pas MeasurementDefinition ou BiomarkerRole.",
  "Une pratique locale ne devient pas une règle générale.",
  "Aucun standard externe n’est déclaré implémenté sans preuve.",
];
for (let contractIndex = 0; contractIndex < contracts.length; contractIndex += 1) {
  const id = `DM-C${String(contractIndex + 1).padStart(2, "0")}`;
  check(master.includes(`| ${id} | ${contracts[contractIndex]} |`), `${id} missing or changed`);
}
check((master.match(/^\| DM-C\d{2} \|/gm) ?? []).length === 20, "contract count is not exactly 20");

for (const required of [
  "Research Project",
  "OBS et domaines spécialisés",
  "CDM-001",
  "Data Management",
  "future Biostatistics",
  "missingness décrit un fait",
  "DM ne remplace jamais une valeur absente par une estimation statistique",
  "source prévue",
  "source réelle",
  "Snapshot",
  "Freeze",
  "Lock",
  "Unlock",
  "Release",
  "Provenance",
  "Lineage",
]) {
  check(master.toLocaleLowerCase().includes(required.toLocaleLowerCase()), `master boundary missing: ${required}`);
}

const limitations = [
  "aucun moteur Data Management",
  "aucun stockage",
  "aucune base de données",
  "aucun eCRF fonctionnel",
  "aucun EDC",
  "aucun dataset réel",
  "aucune donnée patient",
  "aucune migration V1",
  "aucun mapping CDISC, FHIR ou OMOP implémenté",
  "aucune règle réglementaire n’est déclarée actuelle sans vérification",
  "aucune capacité Biostatistics n’est implémentée",
  "aucune campagne ou décision PD-011",
  "aucune activation produit",
  "aucune modification du runtime hybride",
  "aucune réouverture de SEM",
];
for (const limitation of limitations) {
  check(master.includes(limitation), `master limitation missing: ${limitation}`);
}
for (const limitation of [
  "aucun moteur Data Management implémenté",
  "aucun stockage",
  "aucune base de données",
  "aucun eCRF fonctionnel",
  "aucun EDC",
  "aucun dataset réel",
  "aucune donnée patient",
  "aucune migration V1",
  "aucun mapping CDISC/FHIR/OMOP implémenté",
  "aucune règle réglementaire déclarée actuelle sans vérification",
  "aucune Biostatistics",
  "aucune campagne PD-011",
  "aucune activation produit",
  "aucune modification du runtime hybride",
  "aucune réouverture SEM",
]) {
  check(admission.includes(limitation), `admission limitation missing: ${limitation}`);
}

check(!/patientId|subjectName|dateOfBirth|\bpatient\s*#?\d+/i.test(allDm), "possible patient datum found");
check(!/est conforme à (CDISC|FHIR|OMOP)|standard (CDISC|FHIR|OMOP) implémenté/i.test(allDm), "unproved standard implementation claim");
check(allDm.includes("zéro appel provider"), "provider zero statement missing");
check(allDm.includes("zéro Blind"), "Blind zero statement missing");
check(allDm.includes("zéro modification de code produit"), "product-code zero statement missing");

const localDocLinks = new Set();
for (const match of allDm.matchAll(/`(docs\/[^`]+\.md)`/g)) localDocLinks.add(match[1]);
for (const path of localDocLinks) {
  check(existsSync(resolve(root, path)), `broken local document link: ${path}`);
}

check(index.includes("**Version :** 1.44"), "index version is not 1.44");
check(index.includes("**Corpus gouverné actuel :** 132 artefacts"), "index governed count is not 132");
check(index.includes("**Corpus total index inclus :** 133 artefacts"), "index total count is not 133");
check(index.includes("**Artefacts présents hors corpus gouverné :** 42"), "index outside-governance count is not 42");
check(index.includes("sous-ensemble gouverné de `docs/` à 110 fichiers"), "index docs count is not 110");
check(index.includes("Quarante-deux fichiers de `docs/` restent présents hors corpus gouverné"), "index current physical inventory statement is stale");
check(index.includes("### 6.13 DM-001 — Data Management, cycle opérationnel et impacts"), "index DM companion section missing");
check(index.includes("ni dans les 132 artefacts du corpus gouverné courant, ni dans les 133 artefacts internes index inclus"), "index external-authority counts are stale");
for (const path of documents) check(index.includes(`\`${path}\``), `index does not govern ${path}`);
for (const path of newlyClassifiedOutside) {
  check(index.includes(`\`${path}\``), `index does not classify post-1.43 technical report: ${path}`);
}
check(index.includes("DM001_STUDY_DATA_MANAGEMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS"), "index admission decision missing");
const physicalDocCount = readdirSync(resolve(root, "docs"), { withFileTypes: true }).filter((entry) => entry.isFile()).length;
check(physicalDocCount === 152, `physical docs count expected 152, found ${physicalDocCount}`);
check(110 + 42 === physicalDocCount, "governed docs plus outside docs does not match physical inventory");
const indexLocalRefs = new Set([...index.matchAll(/`(docs\/[^`]+?\.(?:md|docx|pdf|json))`/g)].map((match) => match[1]));
check(indexLocalRefs.size === physicalDocCount, `index references ${indexLocalRefs.size} docs but ${physicalDocCount} are present`);
for (const path of indexLocalRefs) check(existsSync(resolve(root, path)), `broken index local link: ${path}`);

const status = execFileSync("git", ["status", "--short", "-z", "--untracked-files=all"], {
  cwd: root,
  encoding: "utf8",
});
const allowedChanges = new Set([
  ...documents,
  indexPath,
  "validation/dm-001/validate.mjs",
  "experiments/semantic-engine-comparison/results/interactive-overnight/zero-provider-final-analysis.md",
]);
for (const line of status.split("\0").filter(Boolean)) {
  const path = line.slice(3);
  check(allowedChanges.has(path), `out-of-scope worktree change: ${path}`);
  check(!path.startsWith("docs/cdm-001-"), `CDM file modified: ${path}`);
  check(!path.startsWith("src/") && !path.startsWith("api/"), `product code modified: ${path}`);
}

if (errors.length > 0) {
  console.error("DM001_DOCUMENTARY_VALIDATION_FAILED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("DM001_DOCUMENTARY_VALIDATION_PASS");
console.log(`documents=${documents.length}`);
console.log(`conceptualCases=${caseMatches.length}`);
console.log(`nonRegressionContracts=${contracts.length}`);
console.log(`operationalArtefacts=${artefacts.length}`);
console.log("pd003Authority=PASS");
console.log("obs001Authority=PASS");
console.log("cdm001Authority=PASS");
console.log("sourceOfTruthIndex=PASS");
console.log(`physicalDocs=${physicalDocCount}`);
console.log(`indexLocalDocumentLinks=${indexLocalRefs.size}`);
console.log("governedDocs=110");
console.log("outsideGovernanceDocs=42");
console.log("providerCalls=0");
console.log("blindCases=0");
console.log("patientData=0");
console.log("productCodeModified=0");
