import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateContract } from "./core/contracts.mjs";
import { evaluateScientificUnderstanding } from "./core/evaluator.mjs";

const EVALUATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(EVALUATOR_ROOT, "../../..");
const DEVELOPMENT_ROOT = path.resolve(EVALUATOR_ROOT, "../corpus/development");
const FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const REGISTRY_ROOT = path.resolve(EVALUATOR_ROOT, "registry");
const BLIND_PURPOSE = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION";
const DEVELOPMENT_PURPOSE = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT";
const CALIBRATION_PURPOSE = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION";

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const sha256File = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const sourceCandidate = readJson(
  path.resolve(
    FIXTURE_ROOT,
    fs
      .readdirSync(FIXTURE_ROOT)
      .filter((entry) => entry.endsWith(".candidate.json"))
      .sort()[0],
  ),
);
const sourceCase = readJson(
  path.resolve(
    DEVELOPMENT_ROOT,
    `${sourceCandidate.caseId.replace("SEM3-DEV-", "").toLowerCase()}.case.json`,
  ),
);
const sourceEnvelope = readJson(
  path.resolve(
    DEVELOPMENT_ROOT,
    `${sourceCandidate.caseId.replace("SEM3-DEV-", "").toLowerCase()}.envelope.json`,
  ),
);

const asDevelopment = (purpose = DEVELOPMENT_PURPOSE) => ({
  ...structuredClone(sourceCandidate),
  purpose,
  evaluationMode: "DEVELOPMENT_SYNTHETIC",
  sourceType: "EVALUATOR_DEVELOPMENT_SYNTHETIC",
});

const asCalibration = (purpose = CALIBRATION_PURPOSE) => ({
  ...structuredClone(sourceCandidate),
  schemaVersion: "1.1.0",
  purpose,
  evaluationMode: "CALIBRATION_SYNTHETIC",
  sourceType: "B4_SYNTHETIC_CALIBRATION",
});

const asBlindQualification = (purpose = BLIND_PURPOSE) => ({
  ...structuredClone(sourceCandidate),
  schemaVersion: "1.2.0",
  purpose,
  evaluationMode: "FUTURE_SEM_RUNTIME",
  sourceType: "FUTURE_SEM_RUNTIME_OUTPUT",
});

test("C1R-C01 Blind Qualification has one explicit generic purpose", () => {
  const schema = readJson(
    path.resolve(EVALUATOR_ROOT, "contracts/candidate-semantic-representation.schema.json"),
  );
  assert.deepEqual(schema.properties.purpose.enum, [
    DEVELOPMENT_PURPOSE,
    CALIBRATION_PURPOSE,
    BLIND_PURPOSE,
  ]);
  assert.equal(validateContract("candidate", asBlindQualification()).valid, true);
});

test("C1R-C02 Development accepts only the Development purpose", () => {
  assert.equal(validateContract("candidate", asDevelopment()).valid, true);
  assert.equal(validateContract("candidate", asDevelopment(CALIBRATION_PURPOSE)).valid, false);
  assert.equal(validateContract("candidate", asDevelopment(BLIND_PURPOSE)).valid, false);
});

test("C1R-C03 Calibration accepts only the Calibration purpose", () => {
  assert.equal(validateContract("candidate", asCalibration()).valid, true);
  assert.equal(validateContract("candidate", asCalibration(DEVELOPMENT_PURPOSE)).valid, false);
  assert.equal(validateContract("candidate", asCalibration(BLIND_PURPOSE)).valid, false);
});

test("C1R-C04 Blind Qualification cannot be relabeled Development or Calibration", () => {
  assert.equal(
    validateContract("candidate", asBlindQualification(DEVELOPMENT_PURPOSE)).valid,
    false,
  );
  assert.equal(
    validateContract("candidate", asBlindQualification(CALIBRATION_PURPOSE)).valid,
    false,
  );
});

test("C1R-C05 the four existing Evaluator modes are unchanged", () => {
  const schema = readJson(
    path.resolve(EVALUATOR_ROOT, "contracts/candidate-semantic-representation.schema.json"),
  );
  assert.deepEqual(schema.definitions.evaluationMode.enum, [
    "DEVELOPMENT_SYNTHETIC",
    "CALIBRATION_SYNTHETIC",
    "FUTURE_SEM_RUNTIME",
    "HUMAN_ADJUDICATION",
  ]);
});

test("C1R-C06 Blind mode executes contract mechanics without Blind benchmark data", () => {
  const candidateOutput = asBlindQualification();
  const result = evaluateScientificUnderstanding({
    schemaVersion: "1.2.0",
    contractType: "BENCHMARK_EVALUATION_INPUT",
    evaluationId: "SEM3-EVAL-C1R-GENERIC-BLIND-PURPOSE-CONTRACT",
    evaluationMode: "FUTURE_SEM_RUNTIME",
    benchmarkCase: sourceCase,
    acceptanceEnvelope: sourceEnvelope,
    candidateOutput,
  });
  assert.equal(result.mode, "FUTURE_SEM_RUNTIME");
  assert.equal(result.evaluatorIdentity.version, "1.2.0");
});

test("C1R-C07 all 41 historical Development fixtures remain byte-identical", () => {
  const manifest = readJson(
    path.resolve(REGISTRY_ROOT, "evaluator-post-c1r-freeze-manifest.json"),
  );
  const fixtureFiles = fs
    .readdirSync(FIXTURE_ROOT)
    .filter((entry) => entry.endsWith(".candidate.json"));
  assert.equal(fixtureFiles.length, 41);
  assert.equal(manifest.developmentFixtureCount, 41);
  assert.equal(
    manifest.developmentFixturesDigest,
    "b50a7f795fea663d911edf7f6334e8dc9ab2ba4334ceceee1a2f57f7a8f3e420",
  );
  const changed = spawnSync(
    "git",
    ["diff", "--quiet", "HEAD", "--", "semantic-validation/sem-003/evaluator/fixtures/development"],
    { cwd: REPOSITORY_ROOT },
  );
  assert.equal(changed.status, 0);
});

test("C1R-C08 B4R registries and historical freeze remain unchanged", () => {
  const manifest = readJson(
    path.resolve(REGISTRY_ROOT, "evaluator-post-c1r-freeze-manifest.json"),
  );
  assert.equal(
    manifest.propertyRegistryDigest,
    "f0db9a687df425fd844c80580914bb91b3c5382663307fa9aea696015c876a70",
  );
  assert.equal(
    manifest.failureTaxonomyDigest,
    "a5e45a03676b049c8a6478c66dfbd218fcd29954e48e38cc74ab850b6a950e2b",
  );
  assert.equal(
    manifest.historicalB4RFreezeDigest,
    sha256File(path.resolve(REGISTRY_ROOT, "evaluator-post-b4r-freeze-manifest.json")),
  );
});

test("C1R-C09 no Blind data or baseline mutation is required by the repair", () => {
  const protectedPaths = [
    "experiments/semantic-engine-comparison/baselines",
    "experiments/semantic-engine-comparison/adapters",
    "experiments/semantic-engine-comparison/contracts",
    "experiments/semantic-engine-comparison/prompts",
    "experiments/semantic-engine-comparison/manifests",
    "experiments/requirements-experiments-lock.txt",
  ];
  const baselineChanged = spawnSync("git", ["diff", "--quiet", "HEAD", "--", ...protectedPaths], {
    cwd: REPOSITORY_ROOT,
  });
  assert.equal(baselineChanged.status, 0);
  const manifest = readJson(
    path.resolve(REGISTRY_ROOT, "evaluator-post-c1r-freeze-manifest.json"),
  );
  assert.equal(
    manifest.protectedComparativeArtifacts.digest,
    "e7262acbdfdbd7100f85c1e442e64f8698ca9b93b43fceda6407be80885f4d28",
  );
  const blindChanged = spawnSync(
    "git",
    ["diff", "--quiet", "HEAD", "--", "semantic-validation/sem-003/blind"],
    { cwd: REPOSITORY_ROOT },
  );
  assert.equal(blindChanged.status, 0);
});

test("C1R-C10 the new identity, binding, and freeze are reproducible", () => {
  const check = spawnSync(
    process.execPath,
    ["semantic-validation/sem-003/evaluator/tools/generate-c1r-freeze.mjs", "--check"],
    { cwd: REPOSITORY_ROOT, encoding: "utf8" },
  );
  assert.equal(check.status, 0, check.stderr || check.stdout);
  const binding = readJson(
    path.resolve(REGISTRY_ROOT, "sem003c1r-comparative-evaluator-binding.json"),
  );
  assert.equal(binding.purpose, BLIND_PURPOSE);
  assert.equal(binding.sourceComparativeFreeze.baselineIds.length, 6);
  assert.equal(binding.baselineCodeOrConfigurationChanged, false);
  assert.equal(binding.blindAccessed, false);
});
