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
  rejected: rejections.CANDIDATES.filter((item) => item.DISPOSITION === "REJECTED").length,
  deferred: rejections.CANDIDATES.filter((item) => item.DISPOSITION === "DEFERRED").length,
  classes: counts
}, null, 2));
