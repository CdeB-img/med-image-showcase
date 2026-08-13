import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateContract } from "../../../evaluator/core/contracts.mjs";
import {
  DECISION_ROOT,
  EVALUATOR_CONFIGURATION_DIGEST,
  EVALUATOR_VERSION,
  FIXTURE_ROOT,
  buildFrozenArtifacts,
  decisionFileName,
  fixtureFileName,
  stableJson,
} from "../tools/protocol.mjs";

const frozen = buildFrozenArtifacts();

test("B4 freeze binds evaluator 1.1.0 and the 10 visible Calibration references", () => {
  assert.equal(frozen.baselineManifest.activeEvaluator.version, EVALUATOR_VERSION);
  assert.equal(
    frozen.baselineManifest.activeEvaluator.configurationDigest,
    EVALUATOR_CONFIGURATION_DIGEST,
  );
  assert.equal(frozen.pairs.length, 10);
  assert.equal(
    frozen.pairs.every(
      ({ benchmarkCase }) =>
        benchmarkCase.exposure.exposureStatus === "CALIBRATION_VISIBLE" &&
        benchmarkCase.exposure.eligibleForBlindQualification === false,
    ),
    true,
  );
});

test("B4 freezes every candidate and expectation before any observation", () => {
  assert.equal(frozen.fixtures.length, 38);
  assert.equal(frozen.expectations.length, 38);
  assert.equal(frozen.baselineManifest.observation.calibrationCandidateExecuted, false);
  assert.equal(frozen.baselineManifest.observation.resultObserved, false);
  for (const { candidate } of frozen.fixtures) {
    assert.equal(validateContract("candidate", candidate).valid, true);
    assert.equal(candidate.evaluationMode, "CALIBRATION_SYNTHETIC");
    assert.equal(candidate.sourceType, "B4_SYNTHETIC_CALIBRATION");
    assert.equal(
      fs.readFileSync(path.resolve(FIXTURE_ROOT, fixtureFileName(candidate)), "utf8"),
      stableJson(candidate),
    );
  }
});

test("B4 synthetic decisions preserve all human, blind and PD-011 boundaries", () => {
  assert.equal(frozen.decisions.length, 108);
  for (const decision of frozen.decisions) {
    assert.equal(validateContract("adjudicationDecisionRecord", decision).valid, true);
    assert.equal(decision.authorityClass, "SIMULATED_PLURALISTIC_EXPERT_REVIEW");
    assert.equal(decision.provenance.realHumanReview, false);
    assert.equal(decision.eligibility.developmentCalibration, true);
    assert.equal(decision.eligibility.formalIndependentQualification, false);
    assert.equal(decision.eligibility.blindReferenceAdmission, false);
    assert.equal(decision.eligibility.pd011FinalEvidence, false);
    assert.equal(
      fs.readFileSync(path.resolve(DECISION_ROOT, decisionFileName(decision)), "utf8"),
      stableJson(decision),
    );
  }
});

test("B4 precommits absolute, Level 2 and boundary coverage without a composite score", () => {
  const roleCount = (role) => frozen.expectations.filter((row) => row.role === role).length;
  assert.equal(roleCount("REFERENCE_CONFORMANT_POSITIVE"), 10);
  assert.equal(roleCount("ABSOLUTE_INVARIANT_NEGATIVE"), 12);
  assert.equal(roleCount("LEVEL2_SATISFIED_PROBE"), 6);
  assert.equal(roleCount("LEVEL2_VIOLATED_PROBE"), 6);
  assert.equal(roleCount("LEVEL2_ACCEPTABLE_WITH_RESERVE_PROBE"), 1);
  assert.equal(roleCount("BOUNDARY_DISPOSITION"), 3);
  assert.equal(frozen.measurementProtocol.metrics.noCompositeScore, true);
  assert.equal(frozen.measurementProtocol.evaluator.repetitionsPerFixture, 1);
  assert.equal(
    frozen.measurementProtocol.families.scientificUnderstanding.threshold,
    "THRESHOLD_NOT_YET_ADMITTED",
  );
});

test("B4 preserves the non-human and non-blind reference boundary", () => {
  const boundaries = frozen.measurementProtocol.boundaries;
  assert.equal(boundaries.realHumanReferenceReview, "NOT_PERFORMED");
  assert.equal(boundaries.finalPD011ReferenceEligibility, "NO");
  assert.equal(boundaries.blindEligibility, "NO");
  assert.equal(boundaries.llmProviderCalls, 0);
  assert.equal(boundaries.semRuntimeExecuted, false);
  assert.equal(boundaries.blindCreated, false);
});
