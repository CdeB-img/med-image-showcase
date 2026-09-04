import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const fail = (message) => {
  throw new Error(message);
};
const requireValue = (condition, message) => {
  if (!condition) fail(message);
};
const unique = (values) => new Set(values);

const requiredFiles = [
  "owner-knowledge-coverage.schema.json",
  "owner-knowledge-needs.json",
  "owner-knowledge-coverage.json",
  "owner-knowledge-gap-matrix.json",
  "knowledge-runtime-reachability.json",
  "reference-knowledge-bridge-plan.md",
  "targeted-corpus-expansion-plan.json",
  "linked-study-propagation-assessment.json",
  "owner-knowledge-coverage-report.md",
];
for (const file of requiredFiles) {
  requireValue(existsSync(join(here, file)), `Missing required file: ${file}`);
}

const expectedOwners = [
  "KNOWLEDGE",
  "SCIENTIFIC_THINKING",
  "STUDY_DESIGN",
  "OBSERVABILITY_MEASUREMENT",
  "IMAGING",
  "BIOSTATISTICS",
  "CDM",
  "DATA_MANAGEMENT",
  "REG",
  "RESEARCH_PROJECT",
  "QRY",
];
const coverageStatuses = new Set([
  "COVERED_STRONG",
  "COVERED_PARTIAL",
  "COVERED_CONTEXT_LIMITED",
  "COVERED_BY_EXISTING_NOXIA_ASSET",
  "REFERENCE_EXISTS_BUT_NOT_RUNTIME_REACHABLE",
  "GAP_DOCUMENTARY",
  "GAP_RUNTIME_ACCESS",
  "GAP_OWNER_MECHANIC",
  "HUMAN_ONLY",
  "NOT_APPLICABLE",
  "UNKNOWN",
]);
const supportTypes = new Set([
  "REGULATORY_REQUIREMENT",
  "REGULATORY_GUIDANCE",
  "INTERNATIONAL_GUIDELINE",
  "METHODOLOGICAL_REFERENCE",
  "SCIENTIFIC_EVIDENCE",
  "BEST_PRACTICE",
  "REAL_STUDY_PATTERN",
  "INSTITUTIONAL_TEMPLATE",
  "CONSENSUS",
  "STANDARD",
]);
const readinessValues = new Set(["READY", "READY_WITH_LIMITATIONS", "NOT_READY", "UNKNOWN"]);
const gapClasses = new Set([
  "ENGINE_MECHANIC_GAP",
  "KNOWLEDGE_GAP",
  "PROJECT_CONTEXT_GAP",
  "RUNTIME_ACCESS_GAP",
  "HUMAN_JUDGMENT_REQUIRED",
]);
const gapPriorities = new Set([
  "P0_BLOCKS_FIRST_INTEGRATED_TEST",
  "P1_HIGH_VALUE_BEFORE_HUMAN_TEST",
  "P2_CAN_FOLLOW_INITIAL_TEST",
  "P3_LONG_TERM",
]);

const needsDoc = load(join(here, "owner-knowledge-needs.json"));
const coverageDoc = load(join(here, "owner-knowledge-coverage.json"));
const gapDoc = load(join(here, "owner-knowledge-gap-matrix.json"));
const runtimeDoc = load(join(here, "knowledge-runtime-reachability.json"));
const linkedAssessment = load(join(here, "linked-study-propagation-assessment.json"));
const expansionPlan = load(join(here, "targeted-corpus-expansion-plan.json"));
const corpus = load(join(here, "../reference-corpus-01/reference-corpus.json"));
const assets = load(join(here, "../reference-corpus-01/existing-noxia-assets.json"));
const linkedSets = load(join(here, "../reference-corpus-01/linked-study-sets.json"));

for (const doc of [needsDoc, coverageDoc, gapDoc, runtimeDoc, linkedAssessment, expansionPlan]) {
  requireValue(doc.MISSION_ID === "OWNER-KNOWLEDGE-COVERAGE-01", "Unexpected mission identity");
}

const needs = needsDoc.NEEDS;
requireValue(Array.isArray(needs) && needs.length === 72, "Expected exactly 72 bounded needs");
const needIds = needs.map((need) => need.NEED_ID);
requireValue(unique(needIds).size === needIds.length, "Duplicate NEED_ID");
requireValue(needs.every((need) => /^OKC01-N-\d{3}$/.test(need.NEED_ID)), "Invalid NEED_ID format");
requireValue(
  needs.every((need) => [
    "OWNER_REASONING_MECHANIC",
    "EXTERNAL_KNOWLEDGE_NEEDED",
    "PROJECT_CONTEXT_NEEDED",
    "HUMAN_JUDGMENT",
  ].every((field) => typeof need[field] === "string" && need[field].length > 0)),
  "Every need must preserve the four central distinctions",
);
const observedOwners = [...unique(needs.map((need) => need.OWNER))].sort();
requireValue(
  JSON.stringify(observedOwners) === JSON.stringify([...expectedOwners].sort()),
  "Need map must cover exactly the 11 scoped owners",
);
requireValue(
  JSON.stringify(Object.keys(needsDoc.OWNER_SCOPES).sort()) === JSON.stringify([...expectedOwners].sort()),
  "OWNER_SCOPES must cover exactly the 11 scoped owners",
);

const sourceIds = unique(corpus.SOURCES.map((source) => source.SOURCE_ID));
const assetIds = unique(assets.ASSETS.map((asset) => asset.ASSET_ID));
const coverage = coverageDoc.COVERAGE;
requireValue(Array.isArray(coverage) && coverage.length === needs.length, "Every need needs one coverage row");
requireValue(unique(coverage.map((row) => row.NEED_ID)).size === needs.length, "Duplicate coverage row");
requireValue(coverage.every((row) => needIds.includes(row.NEED_ID)), "Coverage references unknown need");

for (const owner of expectedOwners) {
  const readiness = coverageDoc.OWNER_READINESS[owner];
  requireValue(Boolean(readiness), `Missing readiness for ${owner}`);
  for (const field of [
    "OWNER_MECHANIC_READINESS",
    "KNOWLEDGE_COVERAGE_READINESS",
    "RUNTIME_KNOWLEDGE_ACCESS_READINESS",
    "FIRST_HUMAN_TEST_READINESS",
  ]) {
    requireValue(readinessValues.has(readiness[field]), `Invalid ${field} for ${owner}`);
  }
  requireValue(typeof readiness.REASON === "string" && readiness.REASON.length > 0, `Missing readiness reason for ${owner}`);
}

for (const row of coverage) {
  requireValue(row.STATUSES.every((status) => coverageStatuses.has(status)), `Invalid coverage status for ${row.NEED_ID}`);
  requireValue(row.SUPPORT_TYPES.every((supportType) => supportTypes.has(supportType)), `Invalid support type for ${row.NEED_ID}`);
  for (const sourceId of [...row.PRIMARY_SOURCE_IDS, ...row.SECONDARY_SOURCE_IDS]) {
    requireValue(sourceIds.has(sourceId), `Unknown source ${sourceId} in ${row.NEED_ID}`);
  }
  for (const assetId of row.EXISTING_NOXIA_ASSET_IDS) {
    requireValue(assetIds.has(assetId), `Unknown NOXIA asset ${assetId} in ${row.NEED_ID}`);
  }
  if (row.SUPPORT_TYPES.length > 0) {
    requireValue(
      row.PRIMARY_SOURCE_IDS.length + row.SECONDARY_SOURCE_IDS.length + row.EXISTING_NOXIA_ASSET_IDS.length > 0,
      `Support type without exact source or asset in ${row.NEED_ID}`,
    );
  }
  if (row.STATUSES.some((status) => status.startsWith("COVERED_") || status === "REFERENCE_EXISTS_BUT_NOT_RUNTIME_REACHABLE")) {
    requireValue(
      row.PRIMARY_SOURCE_IDS.length + row.SECONDARY_SOURCE_IDS.length + row.EXISTING_NOXIA_ASSET_IDS.length > 0,
      `Coverage claim without exact source or asset in ${row.NEED_ID}`,
    );
  }
}

const gaps = gapDoc.GAPS;
const gapIds = unique(gaps.map((gap) => gap.GAP_ID));
requireValue(gapIds.size === gaps.length, "Duplicate GAP_ID");
for (const gap of gaps) {
  requireValue(gap.CLASSES.length > 0 && gap.CLASSES.every((value) => gapClasses.has(value)), `Invalid gap class in ${gap.GAP_ID}`);
  requireValue(gapPriorities.has(gap.PRIORITY), `Invalid gap priority in ${gap.GAP_ID}`);
  requireValue(gap.AFFECTED_NEED_IDS.length > 0, `Gap without affected need: ${gap.GAP_ID}`);
  requireValue(gap.AFFECTED_NEED_IDS.every((needId) => needIds.includes(needId)), `Unknown need in ${gap.GAP_ID}`);
  requireValue(typeof gap.JUSTIFICATION === "string" && gap.JUSTIFICATION.length > 0, `Missing justification in ${gap.GAP_ID}`);
  requireValue(typeof gap.SAFE_DEGRADATION === "string" && gap.SAFE_DEGRADATION.length > 0, `Missing safe degradation in ${gap.GAP_ID}`);
  for (const needId of gap.AFFECTED_NEED_IDS) {
    const row = coverage.find((candidate) => candidate.NEED_ID === needId);
    requireValue(row.GAP_IDS.includes(gap.GAP_ID), `${gap.GAP_ID} is not linked back from ${needId}`);
  }
}
for (const row of coverage) {
  for (const gapId of row.GAP_IDS) {
    requireValue(gapIds.has(gapId), `Unknown gap ${gapId} in ${row.NEED_ID}`);
    const gap = gaps.find((candidate) => candidate.GAP_ID === gapId);
    requireValue(gap.AFFECTED_NEED_IDS.includes(row.NEED_ID), `${row.NEED_ID} is not linked back from ${gapId}`);
  }
}

requireValue(gapDoc.FIRST_RUNTIME_GAP.CLASSIFICATION === "REGISTRY_NOT_RUNTIME_VISIBLE", "Unexpected first runtime gap in matrix");
requireValue(runtimeDoc.FIRST_RUNTIME_GAP === "REGISTRY_NOT_RUNTIME_VISIBLE", "Unexpected first runtime gap in reachability audit");
requireValue(runtimeDoc.REFERENCE_CORPUS_RUNTIME_REACHABLE === "NO", "Reference Corpus 01 must remain runtime-invisible in this mission");
requireValue(runtimeDoc.PROVIDER_CALLS === 0, "Provider call count must remain zero");

const expectedStudySetIds = linkedSets.STUDY_SETS.map((set) => set.STUDY_SET_ID).sort();
const assessedStudySetIds = linkedAssessment.ASSESSMENTS.map((set) => set.STUDY_SET_ID).sort();
requireValue(unique(expectedStudySetIds).size === expectedStudySetIds.length, "Current linked-study registry contains duplicate identities");
requireValue(unique(assessedStudySetIds).size === assessedStudySetIds.length, "Linked-study assessment contains duplicate identities");
const requiredStudySetIds = [...linkedAssessment.ASSESSMENT_SCOPE.REQUIRED_STUDY_SET_IDS].sort();
const laterAcceptedStudySetIds = [...linkedAssessment.ASSESSMENT_SCOPE.LATER_ACCEPTED_STUDY_SET_IDS].sort();
requireValue(JSON.stringify(assessedStudySetIds) === JSON.stringify(requiredStudySetIds), "Linked-study assessment must cover its exact declared historical scope");
requireValue([...requiredStudySetIds, ...laterAcceptedStudySetIds].every((studySetId) => expectedStudySetIds.includes(studySetId)), "Declared linked-study identity is absent from the current registry");
requireValue(expectedStudySetIds.every((studySetId) => requiredStudySetIds.includes(studySetId) || laterAcceptedStudySetIds.includes(studySetId)), "Current linked-study registry contains an unclassified identity");

requireValue(expansionPlan.TARGETED_CORPUS_EXPANSION_REQUIRED === "YES", "Targeted corpus expansion must remain explicit");
for (const priority of expansionPlan.PRIORITIES) {
  requireValue(priority.PRIORITY === "P1_HIGH_VALUE_BEFORE_HUMAN_TEST", `Non-P1 item in active expansion plan: ${priority.PLAN_ID}`);
  requireValue(priority.GAP_IDS.length > 0, `Expansion item without gap: ${priority.PLAN_ID}`);
  for (const gapId of priority.GAP_IDS) {
    requireValue(gapIds.has(gapId), `Expansion references unknown gap ${gapId}`);
    const gap = gaps.find((candidate) => candidate.GAP_ID === gapId);
    requireValue(gap.TARGETED_CORPUS_EXPANSION === true, `Gap ${gapId} is not marked for corpus expansion`);
  }
}

for (const source of corpus.SOURCES) {
  requireValue(typeof source.SOURCE_CLASS === "string" && source.SOURCE_CLASS.length > 0, `Missing source class for ${source.SOURCE_ID}`);
  requireValue(typeof source.JURISDICTION === "string" && source.JURISDICTION.length > 0, `Missing jurisdiction for ${source.SOURCE_ID}`);
  requireValue(typeof source.DOCUMENT_VERSION === "string" && source.DOCUMENT_VERSION.length > 0, `Missing version for ${source.SOURCE_ID}`);
  requireValue(typeof source.CURRENT_OR_HISTORICAL === "string" && source.CURRENT_OR_HISTORICAL.length > 0, `Missing temporal status for ${source.SOURCE_ID}`);
  requireValue(Array.isArray(source.SUPERSEDES) && Array.isArray(source.SUPERSEDED_BY), `Missing supersession structure for ${source.SOURCE_ID}`);
  requireValue(typeof source.REGULATORY_APPLICABILITY === "string" && source.REGULATORY_APPLICABILITY.length > 0, `Missing applicability for ${source.SOURCE_ID}`);
  requireValue(!source.AUTHORITY_OR_EVIDENCE_CLASS.includes("NOXIA_NORMATIVE_AUTHORITY"), `External source promoted to NOXIA authority: ${source.SOURCE_ID}`);
  if (["C_PRACTICE_ARTIFACT", "E_LINKED_STUDY_ARTIFACT_SET"].includes(source.SOURCE_CLASS)) {
    requireValue(source.AUTHORITY_OR_EVIDENCE_CLASS.includes("NOT_NOXIA_AUTHORITY"), `Practice artifact lacks non-authority boundary: ${source.SOURCE_ID}`);
  }
}

const bridgePlan = readFileSync(join(here, "reference-knowledge-bridge-plan.md"), "utf8");
for (const marker of ["REGISTRY_NOT_RUNTIME_VISIBLE", "KnowledgeResult", "candidate", "Project truth", "ni accès PDF direct par owner", "sans Project write"]) {
  requireValue(bridgePlan.includes(marker), `Bridge plan missing boundary marker: ${marker}`);
}

const statusCounts = Object.fromEntries(
  [...coverageStatuses].map((status) => [status, coverage.filter((row) => row.STATUSES.includes(status)).length]),
);
const priorityCounts = Object.fromEntries(
  [...gapPriorities].map((priority) => [priority, gaps.filter((gap) => gap.PRIORITY === priority).length]),
);

console.log(JSON.stringify({
  STATUS: "PASS",
  OWNER_COUNT: expectedOwners.length,
  NEED_COUNT: needs.length,
  COVERAGE_ROW_COUNT: coverage.length,
  GAP_COUNT: gaps.length,
  SOURCE_COUNT: corpus.SOURCES.length,
  ASSET_COUNT: assets.ASSETS.length,
  LINKED_STUDY_SET_COUNT: linkedSets.STUDY_SETS.length,
  HISTORICAL_ASSESSED_STUDY_SET_COUNT: linkedAssessment.ASSESSMENTS.length,
  STATUS_COUNTS: statusCounts,
  PRIORITY_COUNTS: priorityCounts,
  FIRST_RUNTIME_GAP: runtimeDoc.FIRST_RUNTIME_GAP,
  PROVIDER_CALLS: runtimeDoc.PROVIDER_CALLS,
}, null, 2));
