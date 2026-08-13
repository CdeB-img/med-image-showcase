import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { validateSem003B4Preflight } from "./validate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(ROOT, relativePath), "utf8"));

const baseline = readJson("sem-003/calibration/baseline/calibration-baseline-manifest.json");
const assessment = readJson("sem-003/calibration/artifacts/preflight-blocking-assessment.json");
const propertyRegistry = readJson("sem-003/evaluator/registry/property-registry.json");
const candidateSchema = readJson(
  "sem-003/evaluator/contracts/candidate-semantic-representation.schema.json",
);
const humanDecisionSchema = readJson(
  "sem-003/evaluator/contracts/human-decision-record.schema.json",
);

test("B4-C01 evaluator identity matches the B2/B3 freeze", () => {
  assert.equal(
    baseline.evaluator.configurationDigest,
    "13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5",
  );
  assert.equal(baseline.evaluator.modifiedForB4, false);
});

test("B4-C02 the ten-reference B3 set is frozen by digest", () => {
  assert.equal(baseline.calibrationReferenceSet.caseCount, 10);
  assert.match(baseline.calibrationReferenceSet.sha256, /^[a-f0-9]{64}$/);
  assert.equal(baseline.calibrationReferenceSet.realHumanReferenceReview, "NOT_PERFORMED");
});

test("B4-C04/C05/C06 evaluator core remains free of Calibration identifiers", () => {
  const result = validateSem003B4Preflight();
  assert.equal(result.errors.some((entry) => entry.includes("FOUND_IN_EVALUATOR_CORE")), false);
});

test("B4-C07 all twelve Safety/Fidelity properties remain non-compensable", () => {
  const absolute = propertyRegistry.properties.filter((entry) => entry.absolute);
  assert.equal(absolute.length, 12);
  assert.equal(absolute.every((entry) => entry.compensable === false), true);
});

test("B4-C10 fails closed because no governed simulated-adjudication adapter exists", () => {
  assert.equal(humanDecisionSchema.properties.authority.const, "HUMAN_ADJUDICATION");
  assert.equal(
    assessment.controlStatus.BLOCKING_FAILURE.includes("B4-C10"),
    true,
  );
  assert.equal(
    assessment.blockers.some(
      (entry) => entry.blockerId === "B4-BLOCKER-02-SIMULATED-ADJUDICATION-ADAPTER-ABSENT",
    ),
    true,
  );
});

test("the frozen contract has no truthful B4 synthetic Calibration mode", () => {
  assert.equal(
    candidateSchema.definitions.evaluationMode.enum.includes("CALIBRATION_SYNTHETIC"),
    false,
  );
  assert.equal(
    candidateSchema.properties.sourceType.enum.includes("B4_SYNTHETIC_CALIBRATION"),
    false,
  );
});

test("B4-C27 evaluator identity did not change after preflight", () => {
  const audit = readJson("sem-003/calibration/artifacts/anti-overfitting-audit.json");
  assert.equal(
    audit.evaluatorConfigurationDigestBefore,
    audit.evaluatorConfigurationDigestAfter,
  );
});

test("B4-C28/B4-C29 no SEM runtime or provider was invoked", () => {
  assert.equal(assessment.boundaries.semExecuted, false);
  assert.equal(assessment.boundaries.llmProviderCalls, 0);
  assert.equal(assessment.boundaries.browserExecuted, false);
  assert.equal(assessment.boundaries.downstreamExecuted, false);
});

test("B4-C30 no blind or qualification artifact was created", () => {
  assert.equal(assessment.boundaries.blindCreated, false);
  assert.equal(assessment.boundaries.qualificationPerformed, false);
});

test("all B4-C01 through B4-C30 controls have an explicit non-success-masking status", () => {
  const ids = Object.values(assessment.controlStatus).flat().sort();
  const expected = Array.from({ length: 30 }, (_, index) =>
    `B4-C${String(index + 1).padStart(2, "0")}`,
  ).sort();
  assert.deepEqual(ids, expected);
});

test("the complete B4 preflight is internally consistent", () => {
  const result = validateSem003B4Preflight();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.summary.calibrationFixtures, 0);
  assert.equal(result.summary.calibrationResults, 0);
});
