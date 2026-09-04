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
  "language-contract.json",
  "provider-contract.json",
  "execution-protocol.md",
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
  "linguistic-acceptance-envelope.json",
  "human-adjudication-template.json",
  "first-divergence-taxonomy.json",
  "blocking-nonblocking-rules.json",
  "cross-campaign-equivalence.json",
  "campaign-definition-report.md",
  "cross-campaign-equivalence-validator.mjs",
  "campaign-definition-validator.mjs"
];
const scenarioFiles = ["scenario-a.json", "scenario-b.json", "scenario-c.json", "scenario-d.json", "scenario-e-optional.json"];
const envelopeFiles = ["acceptance-envelope-a.json", "acceptance-envelope-b.json", "acceptance-envelope-c.json", "acceptance-envelope-d.json", "acceptance-envelope-e-optional.json"];
const requiredComponentIds = [
  "REFERENCE_CORPUS", "REFERENCE_KNOWLEDGE_INDEX", "KNOWLEDGE_RUNTIME", "SCIENTIFIC_THINKING",
  "STUDY_DESIGN", "OBSERVABILITY_MEASUREMENT", "IMAGING", "BIOSTATISTICS", "CDM",
  "DATA_MANAGEMENT", "REG", "PROJECT_CONTRACT", "QRY_RUNTIME", "DOC002", "TMP001",
  "VAL_CURRENT_PROFILE", "STANDARD_PRODUCT_SURFACE", "LANGUAGE_GATEWAY_RUNTIME", "TRACE_RUNTIME",
  "PROVIDER_CONFIGURATION_INTENT"
];
const forbiddenDefinitionKeys = new Set(["goldProtocol", "goldSap", "goldProject", "goldImagingStrategy", "goldStatisticalModel", "expectedFullAnswer", "noxiaOutput", "executionResult", "actualTranscript", "actualTrace"]);
const expectedHistoricalReports = new Set([
  "docs/implementation/p1-e2e-03-standard-projection-product-wiring.md",
  "docs/implementation/p1-e2e-04-production-qualification-report.md",
  "docs/implementation/p1-e2e-05-second-turn-failure-report.md",
  "docs/implementation/p1-e2e-07-pre-project-intent-ownership-repair-report.md",
  "docs/implementation/p1-e2e-08-candidate-freeze-and-qualification-report.md",
  "docs/implementation/p1-trace-02a-contract-and-coverage-report.md",
  "docs/implementation/p1-trace-02b-capture-levels-report.md",
  "docs/implementation/p1-trace-02c-inspector-and-qualification-report.md",
  "docs/implementation/product-checkpoint-01l-production-deployment-qualification.md"
]);

const fail = (message) => errors.push(message);
const readText = (relativePath) => fs.readFileSync(path.join(campaignDir, relativePath), "utf8");
const readJson = (relativePath) => {
  try { return JSON.parse(readText(relativePath)); }
  catch (error) { fail(`${relativePath}: invalid JSON (${error.message})`); return {}; }
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const normalizedRelative = (absolutePath) => path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
const assertSafeRepositoryPath = (relativePath, context) => {
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  if (absolutePath !== repositoryRoot && !absolutePath.startsWith(`${repositoryRoot}${path.sep}`)) {
    fail(`${context}: path escapes repository (${relativePath})`);
    return null;
  }
  return absolutePath;
};
const walkFiles = (root) => fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(root, entry.name);
  return entry.isDirectory() ? walkFiles(target) : [target];
});
const resolveSelection = (selection, componentId) => {
  const selected = [];
  for (const relativePath of selection.paths ?? []) {
    const absolutePath = assertSafeRepositoryPath(relativePath, componentId);
    if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) { fail(`${componentId}: missing selected file ${relativePath}`); continue; }
    selected.push(absolutePath);
  }
  for (const relativeRoot of selection.roots ?? []) {
    const absoluteRoot = assertSafeRepositoryPath(relativeRoot, componentId);
    if (!absoluteRoot || !fs.existsSync(absoluteRoot) || !fs.statSync(absoluteRoot).isDirectory()) { fail(`${componentId}: missing selected root ${relativeRoot}`); continue; }
    selected.push(...walkFiles(absoluteRoot));
  }
  const extensions = selection.extensions ? new Set(selection.extensions) : null;
  const excluded = new Set(selection.excludeSegments ?? []);
  const files = [...new Set(selected.map(normalizedRelative))]
    .filter((relativePath) => ![...excluded].some((segment) => relativePath.split("/").includes(segment)))
    .filter((relativePath) => !extensions || extensions.has(path.extname(relativePath)))
    .sort();
  if (!files.length) fail(`${componentId}: empty frozen selection`);
  return files;
};
const compositeDigest = (files) => {
  const records = files.map((relativePath) => ({ path: relativePath, sha256: sha256(fs.readFileSync(path.join(repositoryRoot, relativePath))) }));
  return `sha256:${sha256(JSON.stringify(records))}`;
};
const findForbiddenKeys = (value, currentPath = "root") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${currentPath}.${key}`;
    if (forbiddenDefinitionKeys.has(key)) fail(`${childPath}: forbidden answer/execution field`);
    findForbiddenKeys(child, childPath);
  }
};

for (const requiredFile of requiredFiles) if (!fs.existsSync(path.join(campaignDir, requiredFile))) fail(`missing required file: ${requiredFile}`);
const actualTopLevelFiles = fs.readdirSync(campaignDir).sort();
if (JSON.stringify(actualTopLevelFiles) !== JSON.stringify([...requiredFiles].sort())) fail("campaign directory contains missing or unexpected top-level artifacts");

const manifest = readJson("campaign-manifest.json");
const language = readJson("language-contract.json");
const provider = readJson("provider-contract.json");
const linguistic = readJson("linguistic-acceptance-envelope.json");
const taxonomy = readJson("first-divergence-taxonomy.json");
const rules = readJson("blocking-nonblocking-rules.json");
const human = readJson("human-adjudication-template.json");
const scenarios = scenarioFiles.map((file) => ({ file, value: readJson(file) }));
const envelopes = envelopeFiles.map((file) => ({ file, value: readJson(file) }));

if (manifest.campaignId !== "FROZEN-INTEGRATED-CAMPAIGN-02" || manifest.campaignVersion !== "2.0.0" || manifest.campaignStatus !== "FROZEN") fail("campaign identity/version/status mismatch");
if (manifest.runtimeBaselineSha !== "992fc4ce8e2636de62418c5ef43108c8f0c36fd6") fail("runtime baseline mismatch");
if (manifest.previousCampaign !== "FROZEN-INTEGRATED-CAMPAIGN-01@1.0.0" || manifest.previousCampaignTreeDigest !== "f273736ebefecaa1d1a68b30252c0be842e41d8cd95ca04dbac6e70a40d7cd99") fail("previous campaign binding mismatch");
if (manifest.goldAnswerCount !== 0) fail("gold answer count must be zero");
if (manifest.languageGateway?.version !== "1.0.0" || manifest.languageGateway?.liveProviderCapability !== "NOT_VERIFIED") fail("Language Gateway freeze/limitation mismatch");
if (manifest.trace?.profileVersion !== "1.2.0" || manifest.trace?.captureLevel !== "LEVEL_2_DIAGNOSTIC") fail("TRACE freeze mismatch");

const expectedLanguages = { sourceUserLanguage: "EN", conversationLanguage: "EN", internalWorkingLanguage: "FR", productEntryRouterLanguage: "FR", canonicalInternalResponseLanguage: "FR", visibleResponseLanguage: "EN" };
for (const [key, value] of Object.entries(expectedLanguages)) {
  if (manifest.languages?.[key] !== value || language.languages?.[key] !== value) fail(`language mismatch: ${key}`);
}
if (language.projections?.inputTranslationRequired !== true || language.projections?.outputTranslationRequired !== true) fail("input/output translation must be required");
if (language.projections?.originalEnglishTextPreserved !== true || language.projections?.frenchWorkingTextIsDerived !== true || language.projections?.localizedEnglishResponseIsDerived !== true) fail("original/derived projection contract incomplete");
if (language.projections?.projectLanguageTruth !== "FRENCH_CANONICAL_INTERNAL_STATE" || language.projections?.localizedProseCreatesProjectTruth !== false) fail("Project language truth boundary mismatch");
if (provider.languageTranslation?.defaultModel !== "gemini-3.5-flash-lite" || provider.languageTranslation?.liveCapability !== "NOT_VERIFIED") fail("language provider intent/limitation mismatch");
if (provider.conversation?.effectiveDeploymentModel !== "UNKNOWN" || provider.persistentExtraction?.effectiveDeploymentModel !== "UNKNOWN") fail("unknown deployment overrides were invented");

if (manifest.primaryScenarioIds?.length !== 4 || manifest.optionalScenarioIds?.length !== 1) fail("primary/optional scenario counts mismatch");
if (new Set(manifest.scenarioIds ?? []).size !== 5) fail("scenario identities are missing or duplicated");
for (const { file, value } of scenarios) {
  if (!manifest.scenarioIds?.includes(value.scenarioId)) fail(`${file}: scenario not in manifest`);
  if (value.originalUserTextEn !== value.originalUserTextEn?.trim() || !value.originalUserTextEn) fail(`${file}: original English text missing`);
  if (value.languageBinding?.sourceUserLanguage !== "EN" || value.languageBinding?.internalWorkingLanguage !== "FR" || value.languageBinding?.visibleResponseLanguage !== "EN") fail(`${file}: language binding mismatch`);
  if (value.scientificDefinition?.scientificMutation !== "NONE") fail(`${file}: scientific mutation not NONE`);
  findForbiddenKeys(value, file);
}
if (scenarios.at(-1)?.value.status !== "OPTIONAL_STRESS_NOT_PRIMARY_GATE" || scenarios.at(-1)?.value.primaryGateIncluded !== false) fail("Scenario E is not explicitly optional/excluded");
for (const { file, value } of envelopes) {
  if (value.scientificAcceptanceEnvelope?.scientificMutation !== "NONE") fail(`${file}: scientific acceptance mutation not NONE`);
  if (value.linguisticAcceptanceEnvelopeRef !== "linguistic-acceptance-envelope.json") fail(`${file}: linguistic envelope binding mismatch`);
  findForbiddenKeys(value, file);
}
if (linguistic.evaluationMode !== "DETERMINISTIC_CONTRACT_CHECKS_WITHOUT_LITERAL_TEXT_EQUALITY") fail("linguistic acceptance mode mismatch");
for (const invariant of ["PRESERVE_NUMBERS", "PRESERVE_UNITS", "PRESERVE_NEGATION", "PRESERVE_UNCERTAINTY", "PRESERVE_UNKNOWN_WITHHELD_SEMANTICS", "RETURN_VISIBLE_OUTPUT_IN_ENGLISH"]) {
  if (!linguistic.must?.includes(invariant)) fail(`missing linguistic invariant: ${invariant}`);
}

const statusCodes = new Set((taxonomy.statuses ?? []).map((entry) => entry.code));
for (const code of ["LANGUAGE_GATEWAY", "PRODUCT_ENTRY_ROUTER", "QRY", "KNOWLEDGE", "OWNER_MECHANIC", "HANDOFF", "PROJECT", "REG", "TMP_DOC", "HOW_UX", "VALIDATION", "PROVIDER_TECHNICAL", "UNKNOWN"]) {
  if (!statusCodes.has(code)) fail(`missing divergence class: ${code}`);
}
if (rules.languageGatewayBudget?.maxCallsPerUserTurn !== 2 || rules.languageGatewayBudget?.maxRetriesPerProjection !== 0 || rules.languageGatewayBudget?.hiddenRetriesAllowed !== false) fail("language gateway budget mismatch");
if (JSON.stringify(manifest.campaignBudget) !== JSON.stringify(rules.campaignBudget)) fail("campaign budget drift between manifest and rules");
if (JSON.stringify(manifest.languageGatewayBudget) !== JSON.stringify(rules.languageGatewayBudget)) fail("language budget drift between manifest and rules");

if (human.status !== "EMPTY_TEMPLATE_NOT_EXECUTION_RESULT" || human.records?.length !== 5) fail("human adjudication template mismatch");
for (const record of human.records ?? []) {
  for (const [key, value] of Object.entries(record)) {
    if (key === "scenarioId") continue;
    if (!(value === null || (Array.isArray(value) && value.length === 0))) fail(`human field prepopulated: ${record.scenarioId}.${key}`);
  }
}

const componentIds = (manifest.frozenComponents ?? []).map((component) => component.id);
if (JSON.stringify(componentIds) !== JSON.stringify(requiredComponentIds)) fail("frozen component registry is incomplete or reordered");
for (const component of manifest.frozenComponents ?? []) {
  const files = resolveSelection(component.selection ?? {}, component.id ?? "UNKNOWN_COMPONENT");
  if (component.fileCount !== files.length) fail(`${component.id}: file count changed (${component.fileCount} -> ${files.length})`);
  const actualDigest = compositeDigest(files);
  if (actualDigest !== component.digest) fail(`${component.id}: digest changed (${component.digest} -> ${actualDigest})`);
}

const expectedDigestFiles = requiredFiles.filter((file) => file !== "campaign-manifest.json").sort();
if (JSON.stringify(Object.keys(manifest.definitionDigests ?? {}).sort()) !== JSON.stringify(expectedDigestFiles)) fail("definitionDigests must cover every non-manifest artifact exactly once");
for (const [relativePath, expectedDigest] of Object.entries(manifest.definitionDigests ?? {})) {
  const actualDigest = `sha256:${sha256(fs.readFileSync(path.join(campaignDir, relativePath)))}`;
  if (actualDigest !== expectedDigest) fail(`${relativePath}: definition digest changed`);
}

for (const file of requiredFiles) {
  const content = fs.readFileSync(path.join(campaignDir, file), "utf8");
  if (/\b(?:sk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{12,})\b/.test(content)) fail(`${file}: possible secret material detected`);
  if (/^(?:scenario-.+-result|execution-result|trace-run|transcript)/i.test(file)) fail(`${file}: execution artifact forbidden in definition directory`);
}

const gatewaySource = fs.readFileSync(path.join(repositoryRoot, "src/features/protocol-designer/conversation-language-gateway.ts"), "utf8");
const traceSource = fs.readFileSync(path.join(repositoryRoot, "src/features/protocol-designer/scientific-execution-trace.ts"), "utf8");
const bridgeSource = fs.readFileSync(path.join(repositoryRoot, "src/features/protocol-designer/product-bridge.ts"), "utf8");
if (!gatewaySource.includes('CONVERSATION_LANGUAGE_GATEWAY_VERSION = "1.0.0"')) fail("runtime Language Gateway version not evidenced");
if (!traceSource.includes('END_TO_END_TRACE_PROFILE_VERSION = "1.2.0"')) fail("runtime TRACE version not evidenced");
if (!bridgeSource.includes('DEFAULT_GEMINI_CONVERSATION_MODEL = "gemini-3.5-flash-lite"')) fail("runtime Gemini default model not evidenced");

try {
  const equivalenceOutput = execFileSync(process.execPath, [path.join(campaignDir, "cross-campaign-equivalence-validator.mjs")], { cwd: repositoryRoot, encoding: "utf8" });
  if (!equivalenceOutput.includes("CROSS_CAMPAIGN_EQUIVALENCE_VALIDATOR=PASS")) fail("cross-campaign equivalence did not pass");
} catch (error) { fail(`cross-campaign equivalence failed: ${error.stdout ?? error.message}`); }

try {
  execFileSync("git", ["cat-file", "-e", `${manifest.runtimeBaselineSha}^{commit}`], { cwd: repositoryRoot, stdio: "ignore" });
  const changedAfterBaseline = execFileSync("git", ["diff", "--name-only", `${manifest.runtimeBaselineSha}..HEAD`], { cwd: repositoryRoot, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  for (const changedPath of changedAfterBaseline) if (!changedPath.startsWith(`${campaignRelativeDir}/`)) fail(`committed runtime path changed after baseline: ${changedPath}`);
  for (const args of [["diff", "--name-only"], ["diff", "--cached", "--name-only"]]) {
    const changedPaths = execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    for (const changedPath of changedPaths) if (!changedPath.startsWith(`${campaignRelativeDir}/`)) fail(`tracked path outside campaign directory changed: ${changedPath}`);
  }
  const statusLines = execFileSync("git", ["status", "--porcelain=v1", "-uall"], { cwd: repositoryRoot, encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const actualHistoricalReports = new Set(statusLines.filter((line) => line.startsWith("?? docs/implementation/")).map((line) => line.slice(3)));
  if (actualHistoricalReports.size !== expectedHistoricalReports.size || [...expectedHistoricalReports].some((file) => !actualHistoricalReports.has(file))) fail("preserved historical report set changed");
  for (const line of statusLines) {
    const file = line.slice(3);
    if (line.startsWith("?? ") && (file.startsWith(`${campaignRelativeDir}/`) || file.startsWith("validation/frozen-integrated-campaign-01/execution-01/") || expectedHistoricalReports.has(file))) continue;
    if (!line.startsWith("?? ") && file.startsWith(`${campaignRelativeDir}/`)) continue;
    fail(`worktree change outside allowed definition/inherited evidence boundary: ${line}`);
  }
} catch (error) { fail(`git boundary verification failed: ${error.message}`); }

if (errors.length) {
  console.error("CAMPAIGN_DEFINITION_VALIDATOR=FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("CAMPAIGN_DEFINITION_VALIDATOR=PASS");
console.log("CAMPAIGN_ID=FROZEN-INTEGRATED-CAMPAIGN-02");
console.log("CAMPAIGN_VERSION=2.0.0");
console.log("CAMPAIGN_STATUS=FROZEN");
console.log(`RUNTIME_BASELINE_SHA=${manifest.runtimeBaselineSha}`);
console.log("PRIMARY_SCENARIO_COUNT=4");
console.log("OPTIONAL_SCENARIO_COUNT=1");
console.log("GOLD_ANSWER_COUNT=0");
console.log(`FROZEN_COMPONENT_COUNT=${manifest.frozenComponents.length}`);
console.log(`DEFINITION_DIGEST_COUNT=${Object.keys(manifest.definitionDigests).length}`);
console.log("FIC01_TO_FIC02_SCIENTIFIC_SEMANTIC_DRIFT=0");
console.log("FIC01_V1_FILES_CHANGED=0");
console.log("RUNTIME_FILES_CHANGED=0");
console.log("GEMINI_CALLS=0");
console.log("OPENAI_CALLS=0");
