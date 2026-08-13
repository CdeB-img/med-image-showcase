import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateContract } from "./core/contracts.mjs";
import { evaluateScientificUnderstanding } from "./core/evaluator.mjs";
import { computeEvaluatorIdentity } from "./core/versioning.mjs";
import { PROPERTY_ORDER, PROPERTY_REGISTRY } from "./core/registry.mjs";

const EVALUATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(EVALUATOR_ROOT, "../../..");
const DEVELOPMENT_ROOT = path.resolve(EVALUATOR_ROOT, "../corpus/development");
const FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const ARTIFACT_ROOT = path.resolve(EVALUATOR_ROOT, "artifacts");
const REGISTRY_ROOT = path.resolve(EVALUATOR_ROOT, "registry");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const loadPairs = () => {
  const files = fs.readdirSync(DEVELOPMENT_ROOT).sort();
  const cases = files
    .filter((file) => file.endsWith(".case.json"))
    .map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopes = files
    .filter((file) => file.endsWith(".envelope.json"))
    .map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopeByCaseId = new Map(envelopes.map((entry) => [entry.caseId, entry]));
  return new Map(
    cases.map((benchmarkCase) => [
      benchmarkCase.caseId,
      { benchmarkCase, envelope: envelopeByCaseId.get(benchmarkCase.caseId) },
    ]),
  );
};

const collectPropertyKeys = (value, result = []) => {
  if (Array.isArray(value)) {
    for (const entry of value) collectPropertyKeys(entry, result);
    return result;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      result.push(key);
      collectPropertyKeys(entry, result);
    }
  }
  return result;
};

const fail = (errors) => {
  const error = new Error(`SEM-003 evaluator validation failed (${errors.length})`);
  error.validationErrors = errors;
  throw error;
};

export const validateEvaluatorDevelopment = () => {
  const errors = [];
  const generatedCheck = spawnSync(
    process.execPath,
    ["semantic-validation/sem-003/evaluator/tools/generate-development-fixtures.mjs", "--check"],
    { cwd: REPOSITORY_ROOT, encoding: "utf8" },
  );
  if (generatedCheck.status !== 0) {
    errors.push(`GENERATED_ARTIFACT_CHECK_FAILED: ${generatedCheck.stderr || generatedCheck.stdout}`);
  }

  const expectedIdentity = computeEvaluatorIdentity();
  const recordedIdentity = readJson(path.join(REGISTRY_ROOT, "evaluator-identity.json"));
  if (!same(expectedIdentity, recordedIdentity)) {
    errors.push("EVALUATOR_IDENTITY_DIGEST_STALE");
  }

  const pairs = loadPairs();
  if (pairs.size !== 15) errors.push(`DEVELOPMENT_CASE_COUNT_EXPECTED_15_GOT_${pairs.size}`);
  const matrix = readJson(path.join(ARTIFACT_ROOT, "test-matrix.json"));
  const fixtureFiles = fs
    .readdirSync(FIXTURE_ROOT)
    .filter((file) => file.endsWith(".candidate.json"))
    .sort();
  if (fixtureFiles.length !== matrix.rows.length) {
    errors.push("FIXTURE_MATRIX_COUNT_MISMATCH");
  }

  const resultByCandidateId = new Map();
  for (const file of fixtureFiles) {
    const candidate = readJson(path.join(FIXTURE_ROOT, file));
    const contract = validateContract("candidate", candidate);
    if (!contract.valid) {
      errors.push(`CANDIDATE_SCHEMA_INVALID:${file}:${JSON.stringify(contract.errors)}`);
      continue;
    }
    const pair = pairs.get(candidate.caseId);
    if (!pair) {
      errors.push(`NON_DEVELOPMENT_CASE_REFERENCED:${candidate.caseId}`);
      continue;
    }
    try {
      const result = evaluateScientificUnderstanding({
        schemaVersion: "1.0.0",
        contractType: "BENCHMARK_EVALUATION_INPUT",
        evaluationId: `SEM3-EVAL-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}`,
        evaluationMode: "DEVELOPMENT_SYNTHETIC",
        benchmarkCase: pair.benchmarkCase,
        acceptanceEnvelope: pair.envelope,
        candidateOutput: candidate,
      });
      resultByCandidateId.set(candidate.candidateId, result);
    } catch (error) {
      errors.push(`EVALUATION_FAILED:${candidate.candidateId}:${error.message}`);
    }
  }

  for (const row of matrix.rows) {
    const result = resultByCandidateId.get(row.candidateId);
    if (!result) continue;
    const expected = row.expected;
    if (expected.level1 && result.level1.status !== expected.level1) {
      errors.push(`LEVEL1_MISMATCH:${row.candidateId}`);
    }
    if (expected.level2 && result.level2.status !== expected.level2) {
      errors.push(`LEVEL2_MISMATCH:${row.candidateId}`);
    }
    if (expected.disposition && result.disposition !== expected.disposition) {
      errors.push(`DISPOSITION_MISMATCH:${row.candidateId}`);
    }
    if (expected.propertyId) {
      const judgment = result.propertyJudgments.find(
        (entry) => entry.propertyId === expected.propertyId,
      );
      if (judgment?.judgment !== expected.propertyJudgment) {
        errors.push(`PROPERTY_JUDGMENT_MISMATCH:${row.candidateId}:${expected.propertyId}`);
      }
    }
  }

  const propertyRegistry = readJson(path.join(REGISTRY_ROOT, "property-registry.json"));
  if (propertyRegistry.propertyCount !== 18 || PROPERTY_ORDER.length !== 18) {
    errors.push("PROPERTY_REGISTRY_MUST_CONTAIN_18_PROPERTIES");
  }
  const absoluteProperties = propertyRegistry.properties.filter((property) => property.absolute);
  const statisticalProperties = propertyRegistry.properties.filter((property) => !property.absolute);
  if (absoluteProperties.length !== 12 || statisticalProperties.length !== 6) {
    errors.push("PROPERTY_FAMILY_COUNTS_EXPECTED_12_ABSOLUTE_AND_6_STATISTICAL");
  }
  for (const property of absoluteProperties) {
    const positive = [...resultByCandidateId.values()].some((result) =>
      result.propertyJudgments.some(
        (entry) => entry.propertyId === property.id && entry.judgment === "SATISFIED",
      ),
    );
    const negative = [...resultByCandidateId.values()].some((result) =>
      result.propertyJudgments.some(
        (entry) => entry.propertyId === property.id && entry.judgment === "VIOLATED",
      ),
    );
    if (!positive || !negative) errors.push(`ABSOLUTE_PROPERTY_FIXTURE_GAP:${property.id}`);
  }
  for (const property of statisticalProperties) {
    const adjudication = [...resultByCandidateId.values()].some((result) =>
      result.propertyJudgments.some(
        (entry) =>
          entry.propertyId === property.id && entry.judgment === "ADJUDICATION_REQUIRED",
      ),
    );
    if (!adjudication) errors.push(`STATISTICAL_ADJUDICATION_FIXTURE_GAP:${property.id}`);
  }

  const sourceFiles = [
    ...fs.readdirSync(path.join(EVALUATOR_ROOT, "core")).map((file) => path.join(EVALUATOR_ROOT, "core", file)),
    path.join(EVALUATOR_ROOT, "registry", "failure-disposition-registry.json"),
  ];
  const implementationSource = sourceFiles
    .filter((file) => fs.statSync(file).isFile())
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  if (/SEM3-(DEV|CAL)-/.test(implementationSource)) {
    errors.push("ANTI_OVERFIT_CASE_ID_FOUND_IN_EVALUATOR_IMPLEMENTATION");
  }
  const semanticKeys = [...pairs.values()].flatMap(({ envelope }) => [
    ...envelope.required.map((entry) => entry.semanticKey),
    ...envelope.prohibited.map((entry) => entry.semanticKey),
    ...envelope.optionalRelevant.map((entry) => entry.semanticKey),
  ]);
  for (const semanticKey of semanticKeys) {
    if (implementationSource.includes(semanticKey)) {
      errors.push(`ANTI_OVERFIT_SEMANTIC_KEY_FOUND:${semanticKey}`);
    }
  }

  const schemaFiles = fs
    .readdirSync(path.join(EVALUATOR_ROOT, "contracts"))
    .filter((file) => file.endsWith(".json"));
  const forbiddenKeys = new Set(["score", "aggregateScore", "threshold", "nRuns", "passFail"]);
  for (const file of schemaFiles) {
    const keys = collectPropertyKeys(readJson(path.join(EVALUATOR_ROOT, "contracts", file)));
    for (const key of keys) {
      if (forbiddenKeys.has(key)) errors.push(`FORBIDDEN_SCORING_KEY:${file}:${key}`);
    }
  }

  const coverage = readJson(path.join(ARTIFACT_ROOT, "evaluator-coverage.json"));
  if (
    coverage.calibrationCaseContentAccessedForEvaluatorTuning !== false ||
    coverage.calibrationExecuted !== false
  ) {
    errors.push("CALIBRATION_BOUNDARY_NOT_PRESERVED");
  }
  if (coverage.development.casesUsed !== 15 || coverage.development.caseIdsUnused.length !== 0) {
    errors.push("DEVELOPMENT_COVERAGE_INCOMPLETE");
  }

  if (errors.length > 0) fail(errors);
  return {
    valid: true,
    evaluatorVersion: recordedIdentity.version,
    configurationDigest: recordedIdentity.configurationDigest,
    schemas: 6,
    properties: PROPERTY_ORDER.length,
    absoluteProperties: absoluteProperties.length,
    statisticalProperties: statisticalProperties.length,
    developmentCases: pairs.size,
    syntheticCandidates: fixtureFiles.length,
    testMatrixRows: matrix.rows.length,
    results: resultByCandidateId.size,
    calibrationContentTuning: "NO",
    calibrationExecuted: "NO",
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateEvaluatorDevelopment();
  process.stdout.write(
    `SEM-003 evaluator validation PASS: ${result.schemas} schemas, ${result.properties} properties, ${result.developmentCases} Development cases, ${result.syntheticCandidates} candidates, Calibration tuning ${result.calibrationContentTuning}\n`,
  );
}
