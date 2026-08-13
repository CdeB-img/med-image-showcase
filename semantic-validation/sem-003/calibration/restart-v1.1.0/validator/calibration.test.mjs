import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ARTIFACT_ROOT, readJson } from "../tools/protocol.mjs";
import { validateB4Restart } from "./validate.mjs";

const report = validateB4Restart();
const calibration = readJson(path.resolve(ARTIFACT_ROOT, "evaluator-calibration-manifest.json"));
const execution = readJson(path.resolve(ARTIFACT_ROOT, "calibration-execution-manifest.json"));
const propertyResults = readJson(path.resolve(ARTIFACT_ROOT, "property-level-results.json"));
const failureResults = readJson(
  path.resolve(ARTIFACT_ROOT, "failure-disposition-results.json"),
);
const equivalence = readJson(path.resolve(ARTIFACT_ROOT, "equivalence-results.json"));
const antiOverfitting = readJson(path.resolve(ARTIFACT_ROOT, "anti-overfitting-audit.json"));

test("B4-RESTART-C01 machine artifact set validates atomically", () => {
  assert.deepEqual(report.errors, []);
  assert.equal(report.valid, true);
  assert.equal(report.counts.calibrationResults, 38);
  assert.equal(report.counts.equivalenceResults, 5);
});

test("B4-RESTART-C02 P01-P12 are detected without false PASS and remain non-compensable", () => {
  assert.equal(calibration.properties.p01ToP12TargetedDetection, "12/12");
  assert.equal(calibration.properties.falsePassCountOnAbsoluteNegativeProbes, 0);
  const absolute = propertyResults.properties.filter((property) => property.absolute);
  assert.equal(absolute.length, 12);
  assert.equal(
    absolute.every(
      (property) =>
        property.compensable === false &&
        property.targetedProbeCount === 1 &&
        property.targetedExpectationAgreementCount === 1,
    ),
    true,
  );
});

test("B4-RESTART-C03 P13-P18 decisions are consumed without inventing thresholds", () => {
  const statistical = propertyResults.properties.filter((property) => !property.absolute);
  assert.equal(statistical.length, 6);
  assert.equal(
    statistical.every(
      (property) =>
        property.targetedExpectationAgreementCount === property.targetedProbeCount &&
        property.threshold === "THRESHOLD_NOT_YET_ADMITTED",
    ),
    true,
  );
});

test("B4-RESTART-C04 five B3 equivalences retain simulated authority", () => {
  assert.equal(equivalence.matchedCount, 5);
  assert.equal(
    equivalence.observations.every(
      (entry) =>
        entry.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW" &&
        entry.realHumanReview === false &&
        entry.independentQualificationEvidence === false,
    ),
    true,
  );
});

test("B4-RESTART-C05 dispositions remain distinct and fully accounted", () => {
  assert.equal(failureResults.dispositionCounts.SAFE_FAIL_CLOSED, 1);
  assert.equal(failureResults.dispositionCounts.PROVIDER_EXECUTION_FAILURE, 1);
  assert.equal(failureResults.dispositionCounts.NOT_EVALUABLE, 1);
  assert.equal(failureResults.dispositionCounts.ACCEPTABLE_NONCRITICAL_VARIATION, 1);
  assert.equal(
    Object.values(failureResults.dispositionCounts).reduce((sum, count) => sum + count, 0),
    38,
  );
});

test("B4-RESTART-C06 freeze, replay and anti-overfitting boundaries hold", () => {
  assert.equal(execution.expectationMismatchCount, 0);
  assert.equal(execution.llmProviderCalls, 0);
  assert.equal(execution.evaluatorModifiedDuringCalibration, "NO");
  assert.equal(antiOverfitting.postObservationRepairPerformed, false);
  assert.equal(antiOverfitting.blindContentAccessedOrCreated, false);
  assert.equal(
    execution.calibrationObservations.every(
      (entry) => entry.resultSha256 === entry.deterministicReplaySha256,
    ),
    true,
  );
});

test("B4-RESTART-C07 decision authorizes construction only", () => {
  assert.equal(
    calibration.decision,
    "SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION",
  );
  assert.equal(calibration.boundaries.realHumanReferenceReview, "NOT_PERFORMED");
  assert.equal(calibration.boundaries.finalPD011ReferenceEligibility, "NO");
  assert.equal(calibration.boundaries.blindEligibility, "NO");
  assert.equal(calibration.boundaries.semQualification, "NOT_CLAIMED");
  assert.equal(calibration.next, "SEM-003C — Independent Blind Construction & Sealing");
});
