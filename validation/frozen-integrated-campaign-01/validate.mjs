#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const campaignDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(campaignDir, "../..");
const campaignRelativeDir = path.relative(repositoryRoot, campaignDir).split(path.sep).join("/");
const errors = [];

const requiredFiles = [
  "campaign-manifest.json",
  "campaign-rules.json",
  "scenario-a.json",
  "scenario-b.json",
  "scenario-c.json",
  "scenario-d.json",
  "scenario-e-optional.json",
  "acceptance-envelope-a.json",
  "acceptance-envelope-b.json",
  "acceptance-envelope-c.json",
  "acceptance-envelope-d.json",
  "acceptance-envelope-e-optional.json",
  "human-adjudication-template.json",
  "first-divergence-taxonomy.json",
  "execution-protocol.md",
  "campaign-definition-report.md",
  "validate.mjs"
];

const scenarioFiles = [
  "scenario-a.json",
  "scenario-b.json",
  "scenario-c.json",
  "scenario-d.json",
  "scenario-e-optional.json"
];
const envelopeFiles = [
  "acceptance-envelope-a.json",
  "acceptance-envelope-b.json",
  "acceptance-envelope-c.json",
  "acceptance-envelope-d.json",
  "acceptance-envelope-e-optional.json"
];
const requiredScenarioFields = [
  "scenarioId", "version", "title", "purpose", "initialUserIntent", "knownFacts",
  "unresolvedDecisions", "knownAbsences", "withheldInformation", "outOfScopeInformation",
  "allowedDeterministicResponses", "requiredCapabilities", "possibleOwners", "conditionalOwners",
  "humanDecisionCheckpoints", "terminalTarget", "campaignBudget", "provenance"
];
const requiredEnvelopeFields = [
  "scenarioId", "version", "mustRecognize", "mustPreserve", "mustConsider", "mustNotInvent",
  "mustNotDo", "acceptableAlternativeFamilies", "requiredOwnershipBoundaries",
  "requiredEvidenceBehavior", "requiredHumanBoundaries", "documentaryExpectations",
  "blockingFailureConditions", "nonBlockingFindingExamples", "humanReviewDimensions"
];
const supportedOwners = new Set([
  "SCIENTIFIC_THINKING",
  "STUDY_DESIGN",
  "OBSERVABILITY_MEASUREMENT",
  "IMAGING",
  "BIOSTATISTICS",
  "CDM",
  "DATA_MANAGEMENT",
  "KNOWLEDGE",
  "REG"
]);
const expectedDivergenceStatuses = [
  "NONE", "KNOWLEDGE", "OWNER_MECHANIC", "HANDOFF", "PROJECT",
  "QRY", "TMP_DOC", "HOW_UX", "VALIDATION", "UNKNOWN"
];
const forbiddenDefinitionKeys = new Set([
  "goldProtocol", "goldSap", "goldProject", "goldImagingStrategy", "goldStatisticalModel",
  "expectedFullAnswer", "noxiaOutput", "executionResult", "actualTranscript", "actualTrace"
]);

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(campaignDir, relativePath), "utf8");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readText(relativePath));
  } catch (error) {
    fail(`${relativePath}: invalid JSON (${error.message})`);
    return {};
  }
}

function sha256(bufferOrText) {
  return crypto.createHash("sha256").update(bufferOrText).digest("hex");
}

function normalizedRelative(absolutePath) {
  return path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
}

function assertSafeRepositoryPath(relativePath, context) {
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  if (absolutePath !== repositoryRoot && !absolutePath.startsWith(`${repositoryRoot}${path.sep}`)) {
    fail(`${context}: path escapes repository (${relativePath})`);
    return null;
  }
  return absolutePath;
}

function walkFiles(rootPath) {
  return fs.readdirSync(rootPath, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(rootPath, entry.name);
    return entry.isDirectory() ? walkFiles(candidate) : [candidate];
  });
}

function resolveSelection(selection, componentId) {
  const selected = [];
  for (const relativePath of selection.paths ?? []) {
    const absolutePath = assertSafeRepositoryPath(relativePath, componentId);
    if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      fail(`${componentId}: missing selected file ${relativePath}`);
      continue;
    }
    selected.push(absolutePath);
  }
  for (const relativeRoot of selection.roots ?? []) {
    const absoluteRoot = assertSafeRepositoryPath(relativeRoot, componentId);
    if (!absoluteRoot || !fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) {
      fail(`${componentId}: missing selected root ${relativeRoot}`);
      continue;
    }
    selected.push(...walkFiles(absoluteRoot));
  }
  const extensions = selection.extensions ? new Set(selection.extensions) : null;
  const excluded = new Set(selection.excludeSegments ?? []);
  const files = [...new Set(selected.map(normalizedRelative))]
    .filter((relativePath) => ![...excluded].some((segment) => relativePath.split("/").includes(segment)))
    .filter((relativePath) => !extensions || extensions.has(path.extname(relativePath)))
    .sort();
  if (files.length === 0) fail(`${componentId}: empty frozen selection`);
  return files;
}

function compositeDigest(files) {
  const records = files.map((relativePath) => ({
    path: relativePath,
    sha256: sha256(fs.readFileSync(path.join(repositoryRoot, relativePath)))
  }));
  return `sha256:${sha256(JSON.stringify(records))}`;
}

function findForbiddenKeys(value, currentPath = "root") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (forbiddenDefinitionKeys.has(key)) fail(`${childPath}: forbidden answer/execution field`);
    findForbiddenKeys(child, childPath);
  }
}

for (const requiredFile of requiredFiles) {
  if (!fs.existsSync(path.join(campaignDir, requiredFile))) fail(`missing required file: ${requiredFile}`);
}

const manifest = readJson("campaign-manifest.json");
const rules = readJson("campaign-rules.json");
const taxonomy = readJson("first-divergence-taxonomy.json");
const humanTemplate = readJson("human-adjudication-template.json");
const scenarios = scenarioFiles.map((file) => ({ file, value: readJson(file) }));
const envelopes = envelopeFiles.map((file) => ({ file, value: readJson(file) }));

if (manifest.campaignId !== "FROZEN-INTEGRATED-CAMPAIGN-01") fail("manifest campaignId mismatch");
if (manifest.campaignStatus !== "FROZEN") fail("manifest campaignStatus must be FROZEN");
if (manifest.frozenAtCommit !== "FROZEN_AT_COMMIT_PENDING") fail("frozenAtCommit must remain the pre-commit marker");
if (rules.status !== "FROZEN") fail("campaign rules are not FROZEN");
if (rules.traceCaptureLevel !== "LEVEL_2_DIAGNOSTIC") fail("TRACE level is not LEVEL_2_DIAGNOSTIC");
if (rules.productSurface !== "STANDARD" || rules.diagnosticSurface !== "EXPERT_TRACE") fail("surface identity mismatch");

const scenarioIds = scenarios.map(({ value }) => value.scenarioId);
if (new Set(scenarioIds).size !== scenarioIds.length) fail("scenario IDs are not unique");
for (const { file, value } of scenarios) {
  for (const field of requiredScenarioFields) if (!(field in value)) fail(`${file}: missing ${field}`);
  if (!value.version) fail(`${file}: missing version`);
  for (const owner of value.possibleOwners ?? []) if (!supportedOwners.has(owner)) fail(`${file}: unsupported owner ${owner}`);
  for (const entry of value.conditionalOwners ?? []) if (!supportedOwners.has(entry.owner)) fail(`${file}: unsupported conditional owner ${entry.owner}`);
  findForbiddenKeys(value, file);
  const expectedBudget = rules.campaignBudget ?? {};
  for (const [key, expected] of Object.entries(value.campaignBudget ?? {})) {
    if (expectedBudget[key] !== expected) fail(`${file}: budget ${key} differs from campaign rules`);
  }
}

const envelopeByScenario = new Map();
for (const { file, value } of envelopes) {
  for (const field of requiredEnvelopeFields) if (!(field in value)) fail(`${file}: missing ${field}`);
  if (!value.version) fail(`${file}: missing version`);
  if (envelopeByScenario.has(value.scenarioId)) fail(`${file}: duplicate envelope for ${value.scenarioId}`);
  envelopeByScenario.set(value.scenarioId, value);
  findForbiddenKeys(value, file);
  for (const dimension of value.humanReviewDimensions ?? []) {
    if (dimension.value !== null) fail(`${file}: human review dimension ${dimension.dimension} is prepopulated`);
  }
}
for (const scenarioId of scenarioIds) if (!envelopeByScenario.has(scenarioId)) fail(`unresolved envelope for ${scenarioId}`);

const manifestScenarioIds = manifest.scenarioIds ?? [];
if (JSON.stringify(manifestScenarioIds) !== JSON.stringify(scenarioIds)) fail("manifest scenario order/IDs do not resolve to scenario files");
for (const { value } of scenarios) {
  if (manifest.scenarioVersions?.[value.scenarioId] !== value.version) fail(`manifest scenario version mismatch for ${value.scenarioId}`);
  if (manifest.acceptanceEnvelopeVersions?.[value.scenarioId] !== envelopeByScenario.get(value.scenarioId)?.version) {
    fail(`manifest envelope version mismatch for ${value.scenarioId}`);
  }
}

if ((rules.primaryScenarioIds ?? []).length !== 4) fail("primary scenario count must be 4");
if ((rules.optionalScenarioIds ?? []).length !== 1) fail("optional scenario count must be 1");
for (const optionalId of rules.optionalScenarioIds ?? []) {
  if ((rules.primaryScenarioIds ?? []).includes(optionalId)) fail(`optional scenario ${optionalId} is included in primary gate`);
  const scenario = scenarios.find(({ value }) => value.scenarioId === optionalId)?.value;
  if (scenario?.status !== "OPTIONAL_STRESS_NOT_PRIMARY_GATE") fail(`optional scenario ${optionalId} status mismatch`);
}

const actualDivergenceStatuses = (taxonomy.statuses ?? []).map((entry) => entry.code);
if (JSON.stringify(actualDivergenceStatuses) !== JSON.stringify(expectedDivergenceStatuses)) fail("first-divergence taxonomy is incomplete or reordered");
if (!(taxonomy.rules?.length > 0) || !taxonomy.downstreamInvalidation) fail("first-divergence rules are incomplete");
if (!(rules.blockingFailureConditions?.length > 0) || !(rules.nonBlockingFindingExamples?.length > 0)) fail("blocking/non-blocking taxonomy is incomplete");

if ((humanTemplate.records ?? []).length !== scenarioIds.length) fail("human adjudication record count mismatch");
for (const record of humanTemplate.records ?? []) {
  for (const [key, value] of Object.entries(record)) {
    if (key === "scenarioId") continue;
    const empty = value === null || (Array.isArray(value) && value.length === 0);
    if (!empty) fail(`human template ${record.scenarioId}.${key} is prepopulated`);
  }
}

if (manifest.goldAnswerCount !== 0) fail("goldAnswerCount must be 0");
if (manifest.providerConfigurationIdentity?.readiness !== "PARTIAL") fail("provider readiness limitation must be explicit");
if (!manifest.providerConfigurationIdentity?.limitations?.length) fail("provider configuration limitations missing");

for (const component of manifest.frozenComponents ?? []) {
  if (!component.id || !component.digest || !component.selection) {
    fail("frozen component is missing id, digest or selection");
    continue;
  }
  const files = resolveSelection(component.selection, component.id);
  if (component.fileCount !== files.length) fail(`${component.id}: file count changed (${component.fileCount} -> ${files.length})`);
  const actualDigest = compositeDigest(files);
  if (actualDigest !== component.digest) fail(`${component.id}: digest changed (${component.digest} -> ${actualDigest})`);
}
if (!(manifest.frozenComponents?.length >= 13)) fail("required frozen component identities are incomplete");

for (const [relativePath, expectedDigest] of Object.entries(manifest.definitionDigests ?? {})) {
  const absolutePath = path.join(campaignDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`definition digest target missing: ${relativePath}`);
    continue;
  }
  const actualDigest = `sha256:${sha256(fs.readFileSync(absolutePath))}`;
  if (actualDigest !== expectedDigest) fail(`${relativePath}: definition digest changed`);
}
const expectedDigestFiles = requiredFiles.filter((file) => file !== "campaign-manifest.json").sort();
if (JSON.stringify(Object.keys(manifest.definitionDigests ?? {}).sort()) !== JSON.stringify(expectedDigestFiles)) {
  fail("definitionDigests does not cover every non-manifest campaign artifact exactly once");
}

for (const file of fs.readdirSync(campaignDir)) {
  if (/execution-result|scenario-result|trace-run|transcript/i.test(file)) fail(`execution artifact is forbidden in definition directory: ${file}`);
  const content = fs.readFileSync(path.join(campaignDir, file));
  if (/\b(?:sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{12,})\b/.test(content.toString("utf8"))) {
    fail(`${file}: possible secret or credential material detected`);
  }
}

try {
  execFileSync("git", ["cat-file", "-e", `${manifest.runtimeBaselineSha}^{commit}`], { cwd: repositoryRoot, stdio: "ignore" });
  const committedAfterBaseline = execFileSync("git", ["diff", "--name-only", `${manifest.runtimeBaselineSha}..HEAD`], { cwd: repositoryRoot, encoding: "utf8" })
    .trim().split("\n").filter(Boolean);
  for (const changedPath of committedAfterBaseline) {
    if (!changedPath.startsWith(`${campaignRelativeDir}/`)) fail(`committed runtime path changed after baseline: ${changedPath}`);
  }
  for (const args of [["diff", "--name-only"], ["diff", "--cached", "--name-only"]]) {
    const changedPaths = execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const changedPath of changedPaths) {
      if (!changedPath.startsWith(`${campaignRelativeDir}/`)) fail(`tracked path outside campaign directory changed: ${changedPath}`);
    }
  }
} catch (error) {
  fail(`git boundary verification failed: ${error.message}`);
}

if (errors.length > 0) {
  console.error("CAMPAIGN_DEFINITION_VALIDATOR=FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("CAMPAIGN_DEFINITION_VALIDATOR=PASS");
console.log(`CAMPAIGN_ID=${manifest.campaignId}`);
console.log(`RUNTIME_BASELINE_SHA=${manifest.runtimeBaselineSha}`);
console.log(`PRIMARY_SCENARIO_COUNT=${rules.primaryScenarioIds.length}`);
console.log(`OPTIONAL_SCENARIO_COUNT=${rules.optionalScenarioIds.length}`);
console.log(`FROZEN_COMPONENT_COUNT=${manifest.frozenComponents.length}`);
console.log(`DEFINITION_DIGEST_COUNT=${Object.keys(manifest.definitionDigests).length}`);
console.log("GOLD_ANSWER_COUNT=0");
console.log("RUNTIME_FILES_CHANGED=0");
