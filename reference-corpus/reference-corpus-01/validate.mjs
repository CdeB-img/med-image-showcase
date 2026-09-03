#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const load = async (name) => JSON.parse(await readFile(path.join(root, name), "utf8"));
const fail = (message) => { throw new Error(message); };
const required = [
  "SOURCE_ID", "TITLE", "ORGANIZATION", "DOCUMENT_TYPE", "SOURCE_CLASS", "OFFICIAL_URL",
  "LOCAL_COPY_PATH", "FILE_FORMAT", "DOCUMENT_VERSION", "PUBLICATION_DATE", "EFFECTIVE_DATE",
  "RETRIEVAL_DATE", "SUPERSEDES", "SUPERSEDED_BY", "CURRENT_OR_HISTORICAL", "JURISDICTION",
  "LANGUAGE", "AUTHORITY_OR_EVIDENCE_CLASS", "REGULATORY_APPLICABILITY", "METHODOLOGICAL_RELEVANCE",
  "SCIENTIFIC_RELEVANCE", "PRACTICE_PATTERN_RELEVANCE", "OWNER_RELEVANCE", "LICENCE_OR_COPYRIGHT_STATUS",
  "LOCAL_COPY_ALLOWED", "REDISTRIBUTION_ALLOWED", "SHA256", "RETRIEVAL_QUALITY_TIER", "TARGET_DOMAINS",
  "NOTES", "UNCERTAINTIES"
];
const allowedClasses = new Set([
  "A_AUTHORITATIVE_OR_INSTITUTIONAL_REFERENCE", "B_SCIENTIFIC_OR_METHODOLOGICAL_REFERENCE",
  "C_PRACTICE_ARTIFACT", "D_FUNDING_OR_OPERATIONAL_RULE", "E_LINKED_STUDY_ARTIFACT_SET"
]);
const allowedDocumentTypes = new Set([
  "LAW_OR_REGULATION", "REGULATORY_GUIDANCE", "INTERNATIONAL_GUIDELINE", "STANDARD", "CONSENSUS",
  "SCIENTIFIC_GUIDELINE", "METHODS_REFERENCE", "BEST_PRACTICE", "INSTITUTIONAL_GUIDE", "FUNDING_RULE",
  "STUDY_PROTOCOL", "STATISTICAL_ANALYSIS_PLAN", "CASE_REPORT_FORM", "DATA_DICTIONARY", "DATA_MANAGEMENT_PLAN",
  "IMAGING_CHARTER", "CORE_LAB_MANUAL", "LAB_MANUAL", "MONITORING_PLAN", "SAFETY_PLAN", "PROCEDURE_MANUAL",
  "PUBLICATION", "OTHER"
]);
const allowedOwners = new Set([
  "KNOWLEDGE", "SCIENTIFIC_THINKING", "STUDY_DESIGN", "OBSERVABILITY_MEASUREMENT", "IMAGING",
  "BIOSTATISTICS", "CDM", "DATA_MANAGEMENT", "REG", "PROJECT", "TMP_DOC",
  "FUTURE_BUDGET_FEASIBILITY", "NONE"
]);
const requiredDomains = new Set([
  "GENERAL_CLINICAL_RESEARCH", "STUDY_DESIGN", "BIOSTATISTICS", "SAMPLE_SIZE_AND_DIMENSIONING",
  "DATA_MANAGEMENT", "CRF_AND_DATA_STANDARDS", "IMAGING_IN_CLINICAL_RESEARCH",
  "CORE_LAB_AND_CENTRAL_REVIEW", "QUALITY_AND_GCP", "REGULATORY", "SAFETY_AND_VIGILANCE",
  "PRIVACY_AND_DATA_PROTECTION", "FUNDING_AND_BUDGET", "FEASIBILITY_AND_RECRUITMENT",
  "REAL_STUDY_ARTIFACTS"
]);

const corpus = await load("reference-corpus.json");
const schema = await load("reference-corpus.schema.json");
const linked = await load("linked-study-sets.json");
const platforms = await load("platform-trial-reference-set.json");
const closure = await load("documentary-evidence-closure-01.json");
const reclassification = await load("targeted-gap-reclassification-01r.json");
const gap = await load("gap-matrix.json");
const rejections = await load("rejection-log.json");
const searches = await load("search-log.json");
const existing = await load("existing-noxia-assets.json");

if (schema.$id !== "noxia://reference-corpus/reference-corpus-01/schema" || !schema.$defs?.source) fail("invalid metadata schema identity");
if (corpus.MISSION_ID !== "REFERENCE-CORPUS-01") fail("wrong mission identity");
if (corpus.STATUS !== "NON_NORMATIVE_REFERENCE_REGISTRY_RUNTIME_BRIDGED_READ_ONLY") fail("wrong corpus status");
const ids = new Set();
const digests = new Map();
for (const source of corpus.SOURCES) {
  for (const key of required) if (!(key in source)) fail(`${source.SOURCE_ID ?? "UNKNOWN"}: missing ${key}`);
  if (!/^RC01-[A-E]-\d{3}$/.test(source.SOURCE_ID)) fail(`${source.SOURCE_ID}: invalid id`);
  if (ids.has(source.SOURCE_ID)) fail(`${source.SOURCE_ID}: duplicate id`);
  ids.add(source.SOURCE_ID);
  if (!allowedClasses.has(source.SOURCE_CLASS)) fail(`${source.SOURCE_ID}: invalid class`);
  if (!allowedDocumentTypes.has(source.DOCUMENT_TYPE)) fail(`${source.SOURCE_ID}: invalid document type`);
  if (!source.OFFICIAL_URL.startsWith("https://")) fail(`${source.SOURCE_ID}: non-HTTPS URL`);
  if (!source.JURISDICTION || !source.DOCUMENT_TYPE) fail(`${source.SOURCE_ID}: missing classification`);
  for (const key of ["SUPERSEDES", "SUPERSEDED_BY", "LANGUAGE", "OWNER_RELEVANCE", "TARGET_DOMAINS", "UNCERTAINTIES"]) if (!Array.isArray(source[key])) fail(`${source.SOURCE_ID}: ${key} must be an array`);
  if (!Array.isArray(source.OWNER_RELEVANCE) || !source.OWNER_RELEVANCE.length || source.OWNER_RELEVANCE.some((owner) => !allowedOwners.has(owner))) fail(`${source.SOURCE_ID}: owner relevance invalid`);
  if (/NOXIA_(CONSTITUTION|LEVEL_1|NORMATIVE_AUTHORITY)/.test(source.AUTHORITY_OR_EVIDENCE_CLASS)) fail(`${source.SOURCE_ID}: external authority promoted`);
  if (!source.LICENCE_OR_COPYRIGHT_STATUS) fail(`${source.SOURCE_ID}: missing licence status`);
  if (source.LOCAL_COPY_PATH) {
    if (source.LOCAL_COPY_ALLOWED !== "YES" || source.REDISTRIBUTION_ALLOWED !== "YES") fail(`${source.SOURCE_ID}: local copy without explicit storage and redistribution permission`);
    if (!source.SHA256) fail(`${source.SOURCE_ID}: local copy without digest`);
    const absolute = path.resolve(root, source.LOCAL_COPY_PATH);
    await access(absolute);
    const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
    if (digest !== source.SHA256) fail(`${source.SOURCE_ID}: digest mismatch`);
    if (digests.has(digest)) fail(`${source.SOURCE_ID}: duplicate local digest with ${digests.get(digest)}`);
    digests.set(digest, source.SOURCE_ID);
  } else if (source.SHA256 !== null) fail(`${source.SOURCE_ID}: remote-only source has digest`);
}
for (const asset of existing.ASSETS) {
  const absolute = path.resolve(root, asset.PATH);
  await access(absolute);
  const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
  if (digest !== asset.SHA256) fail(`${asset.ASSET_ID}: existing-asset digest mismatch`);
}
for (const set of linked.STUDY_SETS) {
  if (!set.LINKAGE_BASIS?.length || !set.LINKAGE_CONFIDENCE) fail(`${set.STUDY_SET_ID}: missing linkage basis`);
  for (const artifact of set.ARTIFACTS) if (!ids.has(artifact.SOURCE_ID)) fail(`${set.STUDY_SET_ID}: unknown artifact ${artifact.SOURCE_ID}`);
}
if (platforms.MISSION_ID !== "TARGETED-REFERENCE-CORPUS-01R" || platforms.TRIALS.length !== 5) fail("invalid bounded platform-trial set");
const platformFields = [
  "PLATFORM_TRIAL_ID", "STUDY_TITLE", "TRIAL_IDENTIFIERS", "SPONSOR", "CONDITION",
  "MASTER_PROTOCOL_ID", "DESIGN", "PLATFORM_FEATURES", "ARMS_OR_COHORT_MODEL", "SHARED_CONTROL",
  "ADAPTIVE_FEATURES", "DOCUMENTS", "DOCUMENT_VERSIONS", "AMENDMENT_RELATIONSHIPS", "PUBLICATIONS",
  "IMAGING_COMPONENT", "SOURCE_PROVENANCE", "LINKAGE_BASIS", "LINKAGE_CONFIDENCE",
  "COPYRIGHT_STATUS", "LOCAL_CONTENT_AVAILABILITY", "STUDY_SET_ID", "LIMITATIONS",
  "FUTURE_NOXIA_TRANSPOSITION",
];
const linkedIds = new Set(linked.STUDY_SETS.map((set) => set.STUDY_SET_ID));
const platformIds = new Set();
for (const trial of platforms.TRIALS) {
  for (const key of platformFields) if (!(key in trial)) fail(`${trial.PLATFORM_TRIAL_ID ?? "UNKNOWN"}: missing platform field ${key}`);
  if (platformIds.has(trial.PLATFORM_TRIAL_ID)) fail(`${trial.PLATFORM_TRIAL_ID}: duplicate platform id`);
  platformIds.add(trial.PLATFORM_TRIAL_ID);
  if (!linkedIds.has(trial.STUDY_SET_ID)) fail(`${trial.PLATFORM_TRIAL_ID}: unknown linked study set`);
  if (trial.DOCUMENTS.length < 2) fail(`${trial.PLATFORM_TRIAL_ID}: insufficient linked artifacts`);
  if (trial.DOCUMENTS.length !== trial.DOCUMENT_VERSIONS.length) fail(`${trial.PLATFORM_TRIAL_ID}: document/version cardinality mismatch`);
  for (const artifact of trial.DOCUMENTS) if (!ids.has(artifact.SOURCE_ID)) fail(`${trial.PLATFORM_TRIAL_ID}: unknown platform artifact ${artifact.SOURCE_ID}`);
}
if (closure.MISSION_ID !== "DOCUMENTARY-EVIDENCE-CLOSURE-01") fail("invalid documentary evidence closure identity");
if (closure.STATUS !== "NON_NORMATIVE_EVIDENCE_CLOSURE_PROJECTION_NOT_PATTERN_ADMISSION") fail("invalid documentary evidence closure status");
const closureArtifactFields = [
  "SOURCE_ID", "PLATFORM_TRIAL_ID", "STUDY_ID", "TRIAL_IDENTIFIERS", "ARTIFACT_ID", "ARTIFACT_TYPE",
  "TITLE", "VERSION", "DATE", "SOURCE_ORGANIZATION", "OFFICIAL_URL", "RETRIEVAL_DATE",
  "CURRENT_OR_HISTORICAL_STATUS", "SUPERSEDES", "SUPERSEDED_BY", "PROVENANCE", "UNCERTAINTIES",
  "PUBLICLY_ACCESSIBLE", "LOCAL_STORAGE_ALLOWED", "REPOSITORY_COMMIT_ALLOWED",
  "DERIVED_PATTERN_ANALYSIS_ALLOWED", "REDISTRIBUTION_ALLOWED", "CONTENT_READINESS_STATE", "CONTENT_LOCATORS",
];
const rightsStates = new Set(["YES", "NO", "UNKNOWN"]);
const contentStates = new Set(["METADATA_ONLY", "CONTENT_ACCESSIBLE_NOT_STORED", "LOCAL_DOCUMENT_AVAILABLE", "SECTION_INDEXED", "CLAIM_ANCHORED"]);
const inspectionStates = new Set(["YES", "PARTIAL", "NO"]);
const futureRetrievalStates = new Set(["YES", "UNCERTAIN", "NO"]);
const sourceReadinessStates = new Set(["YES", "PARTIAL", "NO"]);
const sourceById = new Map(corpus.SOURCES.map((source) => [source.SOURCE_ID, source]));
const linkedArtifactSourceIds = new Set(linked.STUDY_SETS.flatMap((set) => set.ARTIFACTS.map((artifact) => artifact.SOURCE_ID)));
const closureArtifactIds = new Set();
for (const artifact of closure.ARTIFACTS) {
  for (const key of closureArtifactFields) if (!(key in artifact)) fail(`${artifact.ARTIFACT_ID ?? "UNKNOWN"}: missing closure artifact field ${key}`);
  if (!ids.has(artifact.SOURCE_ID)) fail(`${artifact.ARTIFACT_ID}: unknown closure source ${artifact.SOURCE_ID}`);
  if (!linkedArtifactSourceIds.has(artifact.SOURCE_ID)) fail(`${artifact.ARTIFACT_ID}: source absent from linked-study registry`);
  if (!/^RC01-ART-\d{3}$/.test(artifact.ARTIFACT_ID) || closureArtifactIds.has(artifact.ARTIFACT_ID)) fail(`${artifact.ARTIFACT_ID}: invalid or duplicate closure artifact id`);
  closureArtifactIds.add(artifact.ARTIFACT_ID);
  if (artifact.PLATFORM_TRIAL_ID !== null && !platformIds.has(artifact.PLATFORM_TRIAL_ID)) fail(`${artifact.ARTIFACT_ID}: unknown platform identity`);
  if (artifact.OFFICIAL_URL !== sourceById.get(artifact.SOURCE_ID).OFFICIAL_URL) fail(`${artifact.ARTIFACT_ID}: canonical URL differs from source registry`);
  for (const key of ["PUBLICLY_ACCESSIBLE", "LOCAL_STORAGE_ALLOWED", "REPOSITORY_COMMIT_ALLOWED", "DERIVED_PATTERN_ANALYSIS_ALLOWED", "REDISTRIBUTION_ALLOWED"]) {
    if (!rightsStates.has(artifact[key])) fail(`${artifact.ARTIFACT_ID}: invalid ${key}`);
  }
  if (!contentStates.has(artifact.CONTENT_READINESS_STATE)) fail(`${artifact.ARTIFACT_ID}: invalid content-readiness state`);
  for (const key of ["TRIAL_IDENTIFIERS", "SUPERSEDES", "SUPERSEDED_BY", "PROVENANCE", "UNCERTAINTIES", "CONTENT_LOCATORS"]) if (!Array.isArray(artifact[key])) fail(`${artifact.ARTIFACT_ID}: ${key} must be an array`);
  if (artifact.CONTENT_READINESS_STATE === "CONTENT_ACCESSIBLE_NOT_STORED" && artifact.PUBLICLY_ACCESSIBLE !== "YES") fail(`${artifact.ARTIFACT_ID}: inaccessible artifact marked content-accessible`);
  if (artifact.CONTENT_READINESS_STATE !== "METADATA_ONLY" && !artifact.CONTENT_LOCATORS.length) fail(`${artifact.ARTIFACT_ID}: content-ready artifact lacks locator evidence`);
  if (artifact.REPOSITORY_COMMIT_ALLOWED !== "YES" && sourceById.get(artifact.SOURCE_ID).LOCAL_COPY_PATH !== null) fail(`${artifact.ARTIFACT_ID}: local file conflicts with repository-commit right`);
}
if (!closure.ARTIFACTS.every((artifact) => artifact.CONTENT_READINESS_STATE === "CONTENT_ACCESSIBLE_NOT_STORED")) fail("closure artifacts must remain accessible-not-stored evidence");
if (!Array.isArray(closure.RETRIEVAL_EVIDENCE) || closure.RETRIEVAL_EVIDENCE.length !== closure.ARTIFACTS.length) fail("retrieval evidence must cover every closure artifact exactly once");
const retrievalEvidenceArtifactIds = new Set();
for (const evidence of closure.RETRIEVAL_EVIDENCE) {
  for (const key of ["ARTIFACT_ID", "DOCUMENTARY_CONTENT_INSPECTED", "MINIMAL_DOCUMENT_STRUCTURE", "VERIFIED_SECTION_OR_THEME_REFERENCES", "PAGINATION_OR_STABLE_SECTION_IDENTIFIERS", "TRANSIENT_BINARY_SHA256", "REPRODUCIBILITY_LIMITATIONS"]) {
    if (!(key in evidence)) fail(`${evidence.ARTIFACT_ID ?? "UNKNOWN"}: missing retrieval-evidence field ${key}`);
  }
  if (!closureArtifactIds.has(evidence.ARTIFACT_ID) || retrievalEvidenceArtifactIds.has(evidence.ARTIFACT_ID)) fail(`${evidence.ARTIFACT_ID}: unknown or duplicate retrieval evidence`);
  retrievalEvidenceArtifactIds.add(evidence.ARTIFACT_ID);
  if (!inspectionStates.has(evidence.DOCUMENTARY_CONTENT_INSPECTED) || evidence.DOCUMENTARY_CONTENT_INSPECTED === "NO") fail(`${evidence.ARTIFACT_ID}: invalid documentary inspection state`);
  for (const key of ["MINIMAL_DOCUMENT_STRUCTURE", "VERIFIED_SECTION_OR_THEME_REFERENCES", "PAGINATION_OR_STABLE_SECTION_IDENTIFIERS", "REPRODUCIBILITY_LIMITATIONS"]) {
    if (!Array.isArray(evidence[key])) fail(`${evidence.ARTIFACT_ID}: ${key} must be an array`);
  }
  if (!evidence.MINIMAL_DOCUMENT_STRUCTURE.length || !evidence.VERIFIED_SECTION_OR_THEME_REFERENCES.length || !evidence.REPRODUCIBILITY_LIMITATIONS.length) fail(`${evidence.ARTIFACT_ID}: insufficient retrieval evidence`);
  const derivedText = [
    ...evidence.MINIMAL_DOCUMENT_STRUCTURE,
    ...evidence.VERIFIED_SECTION_OR_THEME_REFERENCES,
    ...evidence.PAGINATION_OR_STABLE_SECTION_IDENTIFIERS,
    ...evidence.REPRODUCIBILITY_LIMITATIONS,
  ];
  if (derivedText.some((value) => typeof value !== "string" || !value.trim() || value.length > 400)) fail(`${evidence.ARTIFACT_ID}: invalid or substantively long derived evidence`);
  if (evidence.TRANSIENT_BINARY_SHA256 !== null && !/^[a-f0-9]{64}$/.test(evidence.TRANSIENT_BINARY_SHA256)) fail(`${evidence.ARTIFACT_ID}: invalid transient digest`);
}
if ([...closureArtifactIds].some((artifactId) => !retrievalEvidenceArtifactIds.has(artifactId))) fail("retrieval evidence has a coverage gap");
for (const relation of closure.RELATIONSHIPS) {
  for (const key of ["RELATION_TYPE", "FROM_ARTIFACT_ID", "TO_ARTIFACT_ID", "LINKAGE_BASIS", "LINKAGE_CONFIDENCE", "LINKAGE_SOURCE"]) if (!(key in relation)) fail(`closure relation missing ${key}`);
  if (!closureArtifactIds.has(relation.FROM_ARTIFACT_ID) || !closureArtifactIds.has(relation.TO_ARTIFACT_ID)) fail(`${relation.RELATION_TYPE}: unknown artifact relation endpoint`);
  if (!relation.LINKAGE_BASIS.length || !["HIGH", "MEDIUM", "LOW"].includes(relation.LINKAGE_CONFIDENCE)) fail(`${relation.RELATION_TYPE}: invalid linkage evidence`);
  if (!relation.LINKAGE_SOURCE.startsWith("https://")) fail(`${relation.RELATION_TYPE}: non-official linkage URL`);
}
for (const relation of closure.VERSION_RELATIONSHIPS) {
  if (!ids.has(relation.EVIDENCE_SOURCE_ID)) fail(`unknown version-relation evidence ${relation.EVIDENCE_SOURCE_ID}`);
  if (!relation.FROM || !relation.TO || !relation.RELATION || !relation.CONFIDENCE) fail("incomplete version relation");
}
if (closure.PLATFORM_READINESS.length !== 5) fail("documentary closure must preserve exactly five platform trials");
if (new Set(closure.PLATFORM_READINESS.map((item) => item.PLATFORM_TRIAL_ID)).size !== 5) fail("duplicate platform readiness identity");
if (closure.PLATFORM_READINESS.some((item) => !platformIds.has(item.PLATFORM_TRIAL_ID))) fail("unknown platform readiness identity");
const platformReadinessFields = [
  "DOCUMENTARY_CONTENT_INSPECTED", "CONTENT_ACCESSIBLE_FOR_FUTURE_RETRIEVAL", "LOCAL_REPRODUCIBLE_CONTENT",
  "SECTION_INDEXED_IN_KNOWLEDGE", "DOC002R_SOURCE_READY", "PLATFORM_RUNTIME_CONTENT_READY",
  "PLATFORM_SECTION_INDEX_READY", "PLATFORM_REPRODUCIBLE_LOCAL_CONTENT_READY",
];
for (const item of closure.PLATFORM_READINESS) {
  for (const key of platformReadinessFields) if (!(key in item)) fail(`${item.PLATFORM_TRIAL_ID}: missing readiness field ${key}`);
  if (!inspectionStates.has(item.DOCUMENTARY_CONTENT_INSPECTED)) fail(`${item.PLATFORM_TRIAL_ID}: invalid inspection readiness`);
  if (!futureRetrievalStates.has(item.CONTENT_ACCESSIBLE_FOR_FUTURE_RETRIEVAL)) fail(`${item.PLATFORM_TRIAL_ID}: invalid future-retrieval readiness`);
  if (!sourceReadinessStates.has(item.DOC002R_SOURCE_READY)) fail(`${item.PLATFORM_TRIAL_ID}: invalid DOC002R source readiness`);
  if (item.LOCAL_REPRODUCIBLE_CONTENT !== "NO" || item.SECTION_INDEXED_IN_KNOWLEDGE !== "NO") fail(`${item.PLATFORM_TRIAL_ID}: remote evidence promoted to local or indexed readiness`);
  if (item.PLATFORM_RUNTIME_CONTENT_READY !== "NO" || item.PLATFORM_SECTION_INDEX_READY !== "NO" || item.PLATFORM_REPRODUCIBLE_LOCAL_CONTENT_READY !== "NO") fail(`${item.PLATFORM_TRIAL_ID}: unsupported platform runtime readiness`);
}
const readyPlatformCount = closure.PLATFORM_READINESS.filter((item) => item.PLATFORM_CONTENT_READY === "YES").length;
if (readyPlatformCount !== closure.PLATFORM_CONTENT_READY_COUNT || readyPlatformCount < 4) fail("platform content-readiness gate not satisfied");
const doc002rSourceReadyCount = closure.PLATFORM_READINESS.filter((item) => item.DOC002R_SOURCE_READY === "YES").length;
if (doc002rSourceReadyCount < 4) fail("DOC002R source-readiness gate not satisfied");
if (closure.PLATFORM_CONTENT_READY_MEANING !== "DOCUMENTARY_CONTENT_SUFFICIENTLY_ACCESSIBLE_FOR_LATER_CONTROLLED_DOC002R_ANALYSIS") fail("platform content readiness meaning is ambiguous");
if (closure.PLATFORM_RUNTIME_CONTENT_READY_COUNT !== 0 || closure.PLATFORM_SECTION_INDEX_READY_COUNT !== 0 || closure.PLATFORM_REPRODUCIBLE_LOCAL_CONTENT_READY_COUNT !== 0) fail("unsupported platform local/runtime readiness count");
if (closure.ENOUGH_DOCUMENTARY_EVIDENCE_FOR_ONE_DOC002R_PASS !== "YES") fail("bounded DOC002R evidence gate not satisfied");
if (!closure.PLATFORM_READINESS.every((item) => item.METADATA_READY === "YES" && item.LINKAGE_READY === "YES")) fail("platform metadata/linkage not ready");
const platformSourceIds = new Set(platforms.TRIALS.flatMap((trial) => trial.DOCUMENTS.map((artifact) => artifact.SOURCE_ID)));
const closurePlatformSourceIds = new Set(closure.ARTIFACTS.filter((artifact) => artifact.PLATFORM_TRIAL_ID !== null).map((artifact) => artifact.SOURCE_ID));
if (platformSourceIds.size !== closurePlatformSourceIds.size || [...platformSourceIds].some((sourceId) => !closurePlatformSourceIds.has(sourceId))) fail("platform artifact closure is incomplete");
if (closure.CHAIN_ASSESSMENT.SAME_STUDY_COMPLETE_CHAIN_FOUND !== "NO" || closure.CHAIN_ASSESSMENT.COMPLETE_CHAIN_COUNT !== 0) fail("unsupported complete same-study chain claim");
if (closure.CHAIN_ASSESSMENT.NEAR_COMPLETE_CHAIN_COUNT < 2 || closure.CHAIN_ASSESSMENT.FAMILIES.length < 2) fail("near-complete family fallback not satisfied");
for (const family of closure.CHAIN_ASSESSMENT.FAMILIES) {
  if (!linkedIds.has(family.STUDY_SET_ID) || family.LINKAGE_CONFIDENCE !== "HIGH") fail(`${family.STUDY_SET_ID}: invalid near-complete family`);
  if (!family.MISSING_ARTIFACT_CLASSES?.length) fail(`${family.STUDY_SET_ID}: missing artifact classes not explicit`);
}
for (const candidate of closure.DOC002R_EXTRACTION_CANDIDATES) {
  for (const key of ["candidateId", "candidateType", "sourceIds", "artifactIds", "studyOrPlatformIdentity", "reason", "relevantDocumentaryPhenomenon", "limitations"]) if (!(key in candidate)) fail(`${candidate.candidateId ?? "UNKNOWN"}: missing extraction-candidate field ${key}`);
  for (const sourceId of candidate.sourceIds) if (!ids.has(sourceId)) fail(`${candidate.candidateId}: unknown candidate source ${sourceId}`);
  for (const artifactId of candidate.artifactIds) if (!closureArtifactIds.has(artifactId)) fail(`${candidate.candidateId}: unknown candidate artifact ${artifactId}`);
  if (!candidate.limitations.includes("Candidate is not an admitted pattern")) fail(`${candidate.candidateId}: pattern-admission boundary absent`);
}
if (closure.BOUNDARIES.SECOND_REGISTRY_CREATED !== "NO" || closure.BOUNDARIES.DOC002_PATTERN_EXTRACTED !== "NO" || closure.BOUNDARIES.PRACTICE_RULE_ADMITTED !== "NO" || closure.BOUNDARIES.EXTERNAL_AUTHORITY_PROMOTED !== "NO" || closure.BOUNDARIES.LOCAL_BINARY_ADDED !== "NO" || closure.BOUNDARIES.RESTRICTED_ARCHIVE_ACCESSED !== "NO") fail("documentary closure boundary violated");
const expectedNewClosureSources = Array.from({ length: 12 }, (_, index) => `RC01-E-${String(index + 74).padStart(3, "0")}`);
if (expectedNewClosureSources.some((sourceId) => !ids.has(sourceId))) fail("documentary closure source range incomplete");
if (closure.COUNTS.NEW_SOURCES !== expectedNewClosureSources.length || closure.COUNTS.NEW_LOCAL_FILES !== 0 || closure.COUNTS.NEW_SECTION_INDEXED !== 0) fail("documentary closure counts invalid");
if (reclassification.MISSION_ID !== "TARGETED-REFERENCE-CORPUS-01R" || reclassification.RECLASSIFICATIONS.length !== 7) fail("invalid targeted gap reclassification");
for (const item of reclassification.RECLASSIFICATIONS) {
  if (!/^OKC01-X-\d{3}$/.test(item.PLAN_ID)) fail(`${item.PLAN_ID}: invalid plan id`);
  if (!["CLOSED_FOR_CURRENT_SCOPE", "STRONGLY_IMPROVED", "PARTIALLY_IMPROVED", "UNCHANGED", "BLOCKED_BY_ACCESS", "DEFERRED"].includes(item.RESULT)) fail(`${item.PLAN_ID}: invalid result`);
  for (const need of item.NEED_SUPPORT) {
    for (const sourceId of need.SOURCE_IDS) if (!ids.has(sourceId)) fail(`${item.PLAN_ID}: unknown mapped source ${sourceId}`);
  }
}
const gapDomains = new Set(gap.DOMAINS.map((item) => item.DOMAIN));
for (const domain of requiredDomains) if (!gapDomains.has(domain)) fail(`gap matrix missing ${domain}`);
for (const item of gap.DOMAINS) {
  const observed = corpus.SOURCES.filter((source) => source.TARGET_DOMAINS.includes(item.DOMAIN)).length;
  if (item.HIGH_VALUE_SOURCES_FOUND !== observed) fail(`${item.DOMAIN}: gap count ${item.HIGH_VALUE_SOURCES_FOUND} != ${observed}`);
}
if (!rejections.CANDIDATES.length || !searches.SEARCHES.length || !existing.ASSETS.length) fail("empty governance log");

const counts = Object.fromEntries([...allowedClasses].map((key) => [key, corpus.SOURCES.filter((source) => source.SOURCE_CLASS === key).length]));
console.log(JSON.stringify({
  status: "PASS",
  sources: corpus.SOURCES.length,
  localCopies: digests.size,
  linkedStudySets: linked.STUDY_SETS.length,
  linkedArtifacts: linked.STUDY_SETS.reduce((sum, set) => sum + set.ARTIFACTS.length, 0),
  platformTrials: platforms.TRIALS.length,
  platformArtifacts: platforms.TRIALS.reduce((sum, trial) => sum + trial.DOCUMENTS.length, 0),
  platformContentReady: readyPlatformCount,
  doc002rSourceReady: doc002rSourceReadyCount,
  platformRuntimeContentReady: closure.PLATFORM_RUNTIME_CONTENT_READY_COUNT,
  documentaryClosureArtifacts: closure.ARTIFACTS.length,
  retrievalEvidenceRecords: closure.RETRIEVAL_EVIDENCE.length,
  documentaryExtractionCandidates: closure.DOC002R_EXTRACTION_CANDIDATES.length,
  rejected: rejections.CANDIDATES.filter((item) => item.DISPOSITION === "REJECTED").length,
  deferred: rejections.CANDIDATES.filter((item) => item.DISPOSITION === "DEFERRED").length,
  classes: counts
}, null, 2));
