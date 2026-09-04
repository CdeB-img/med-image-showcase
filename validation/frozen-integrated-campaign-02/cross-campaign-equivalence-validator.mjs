#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const campaignDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(campaignDir, "../..");
const previousDir = path.join(repositoryRoot, "validation/frozen-integrated-campaign-01");
const errors = [];

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const readJson = (absolutePath) => JSON.parse(fs.readFileSync(absolutePath, "utf8"));
const digestFile = (absolutePath) => sha256(fs.readFileSync(absolutePath));
const walkFiles = (root) => fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(root, entry.name);
  return entry.isDirectory() ? walkFiles(target) : [target];
});
const fail = (message) => errors.push(message);

const configuration = readJson(path.join(campaignDir, "cross-campaign-equivalence.json"));
const v1TreeRecords = walkFiles(previousDir)
  .map((absolutePath) => path.relative(repositoryRoot, absolutePath).split(path.sep).join("/"))
  .sort()
  .map((relativePath) => `${digestFile(path.join(repositoryRoot, relativePath))}  ${relativePath}\n`)
  .join("");
const actualV1TreeDigest = sha256(v1TreeRecords);
if (actualV1TreeDigest !== configuration.sourceCampaignTreeDigest) {
  fail(`FIC01 v1 tree digest changed (${configuration.sourceCampaignTreeDigest} -> ${actualV1TreeDigest})`);
}

const v1RulesPath = path.join(previousDir, "campaign-rules.json");
const v1Rules = readJson(v1RulesPath);
const v2Manifest = readJson(path.join(campaignDir, "campaign-manifest.json"));
const v2BlockingRules = readJson(path.join(campaignDir, "blocking-nonblocking-rules.json"));
if (digestFile(v1RulesPath) !== v2BlockingRules.scientificRules?.sha256) fail("FIC01 scientific rule digest mismatch");
if (v2BlockingRules.scientificRules?.scientificMutation !== "NONE") fail("scientific blocking rules are not immutable");

const scenarioPairs = Object.entries(configuration.scenarioBindings ?? {});
for (const [v1File, v2File] of scenarioPairs) {
  const v1Path = path.join(previousDir, v1File);
  const v2 = readJson(path.join(campaignDir, v2File));
  const v1 = readJson(v1Path);
  if (v2.scientificDefinition?.mode !== "EXACT_REFERENCED_FIC01_V1_ARTIFACT") fail(`${v2File}: scientific reference mode mismatch`);
  if (v2.scientificDefinition?.scientificMutation !== "NONE") fail(`${v2File}: scientific mutation is not NONE`);
  if (digestFile(v1Path) !== v2.scientificDefinition?.sha256) fail(`${v2File}: referenced FIC01 digest mismatch`);
  const resolvedRef = path.resolve(campaignDir, v2.scientificDefinition?.ref ?? "");
  if (resolvedRef !== v1Path) fail(`${v2File}: reference does not resolve to ${v1File}`);
  if (v2.scenarioId !== v1.scenarioId || v2.version !== v1.version || v2.status !== v1.status) fail(`${v2File}: scientific identity/status/version drift`);
  if (v2.originalUserTextEn !== v1.initialUserIntent) fail(`${v2File}: original English fixture drift`);
}

const envelopePairs = Object.entries(configuration.acceptanceEnvelopeBindings ?? {});
for (const [v1File, v2File] of envelopePairs) {
  const v1Path = path.join(previousDir, v1File);
  const v2 = readJson(path.join(campaignDir, v2File));
  const v1 = readJson(v1Path);
  if (v2.scientificAcceptanceEnvelope?.mode !== "EXACT_REFERENCED_FIC01_V1_ARTIFACT") fail(`${v2File}: scientific envelope reference mode mismatch`);
  if (v2.scientificAcceptanceEnvelope?.scientificMutation !== "NONE") fail(`${v2File}: scientific envelope mutation is not NONE`);
  if (digestFile(v1Path) !== v2.scientificAcceptanceEnvelope?.sha256) fail(`${v2File}: referenced FIC01 envelope digest mismatch`);
  const resolvedRef = path.resolve(campaignDir, v2.scientificAcceptanceEnvelope?.ref ?? "");
  if (resolvedRef !== v1Path) fail(`${v2File}: envelope reference does not resolve to ${v1File}`);
  if (v2.scenarioId !== v1.scenarioId || v2.version !== v1.version) fail(`${v2File}: acceptance identity/version drift`);
}

if (JSON.stringify(v2Manifest.primaryScenarioIds) !== JSON.stringify(v1Rules.primaryScenarioIds)) fail("primary scenario distinction drift");
if (JSON.stringify(v2Manifest.optionalScenarioIds) !== JSON.stringify(v1Rules.optionalScenarioIds)) fail("optional scenario distinction drift");

const v1Taxonomy = readJson(path.join(previousDir, "first-divergence-taxonomy.json"));
const v2Taxonomy = readJson(path.join(campaignDir, "first-divergence-taxonomy.json"));
const v2StatusByCode = new Map((v2Taxonomy.statuses ?? []).map((entry) => [entry.code, entry.meaning]));
for (const entry of v1Taxonomy.statuses ?? []) {
  if (v2StatusByCode.get(entry.code) !== entry.meaning) fail(`shared divergence class changed: ${entry.code}`);
}
for (const requiredAddition of ["LANGUAGE_GATEWAY", "PRODUCT_ENTRY_ROUTER", "REG", "PROVIDER_TECHNICAL"]) {
  if (!v2StatusByCode.has(requiredAddition)) fail(`missing language-bound divergence class: ${requiredAddition}`);
}
if (configuration.scientificSemanticDrift !== 0) fail("scientificSemanticDrift must be 0");
if (configuration.equivalenceMechanism !== "V2_WRAPPERS_BIND_EXACT_V1_ARTIFACT_DIGESTS") fail("equivalence mechanism mismatch");

if (errors.length) {
  console.error("CROSS_CAMPAIGN_EQUIVALENCE_VALIDATOR=FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("CROSS_CAMPAIGN_EQUIVALENCE_VALIDATOR=PASS");
console.log("FACT_PACKETS_V1_V2=SEMANTICALLY_IDENTICAL");
console.log("SCIENTIFIC_ACCEPTANCE_ENVELOPES_V1_V2=IDENTICAL_BY_EXACT_ARTIFACT_REFERENCE");
console.log("BLOCKING_RULES_V1_V2=SCIENTIFICALLY_IDENTICAL_BY_EXACT_RULE_REFERENCE");
console.log("PRIMARY_OPTIONAL_DISTINCTION=PRESERVED");
console.log("FIRST_DIVERGENCE_TAXONOMY=PRESERVED_PLUS_LANGUAGE_BOUND_CLASSES");
console.log("FIC01_TO_FIC02_SCIENTIFIC_SEMANTIC_DRIFT=0");
console.log(`FIC01_V1_TREE_DIGEST=${actualV1TreeDigest}`);
