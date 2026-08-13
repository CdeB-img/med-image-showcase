import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateContract } from "../../../evaluator/core/contracts.mjs";
import {
  ARTIFACT_ROOT,
  DECISION_ROOT,
  EVALUATOR_CONFIGURATION_DIGEST,
  EVALUATOR_VERSION,
  FIXTURE_ROOT,
  PRECOMMITMENT_ROOT,
  REPOSITORY_ROOT,
  RESULT_ROOT,
  assertJsonEquals,
  buildFrozenArtifacts,
  decisionFileName,
  fixtureFileName,
  readJson,
  sha256,
  stableJson,
} from "../tools/protocol.mjs";

const VALIDATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));

export const validateB4Restart = () => {
  const errors = [];
  const assert = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const frozen = buildFrozenArtifacts();

  try {
    assertJsonEquals(
      path.resolve(PRECOMMITMENT_ROOT, "calibration-freeze-manifest.json"),
      frozen.baselineManifest,
    );
    assertJsonEquals(
      path.resolve(PRECOMMITMENT_ROOT, "fixture-expectation-manifest.json"),
      frozen.expectationManifest,
    );
    assertJsonEquals(
      path.resolve(PRECOMMITMENT_ROOT, "measurement-protocol.json"),
      frozen.measurementProtocol,
    );
    for (const { candidate } of frozen.fixtures) {
      assertJsonEquals(path.resolve(FIXTURE_ROOT, fixtureFileName(candidate)), candidate);
    }
    for (const decision of frozen.decisions) {
      assertJsonEquals(path.resolve(DECISION_ROOT, decisionFileName(decision)), decision);
    }
  } catch (error) {
    errors.push(error.message);
  }

  const execution = readJson(path.resolve(ARTIFACT_ROOT, "calibration-execution-manifest.json"));
  const calibration = readJson(path.resolve(ARTIFACT_ROOT, "evaluator-calibration-manifest.json"));
  const propertyResults = readJson(path.resolve(ARTIFACT_ROOT, "property-level-results.json"));
  const failureResults = readJson(
    path.resolve(ARTIFACT_ROOT, "failure-disposition-results.json"),
  );
  const equivalence = readJson(path.resolve(ARTIFACT_ROOT, "equivalence-results.json"));
  const antiOverfitting = readJson(path.resolve(ARTIFACT_ROOT, "anti-overfitting-audit.json"));
  const limitations = readJson(path.resolve(ARTIFACT_ROOT, "uncertainty-limitations.json"));

  assert(execution.evaluatorVersion === EVALUATOR_VERSION, "execution evaluator version");
  assert(
    execution.evaluatorConfigurationDigest === EVALUATOR_CONFIGURATION_DIGEST,
    "execution evaluator digest",
  );
  assert(execution.mode === "CALIBRATION_SYNTHETIC", "execution mode");
  assert(execution.provenance === "B4_SYNTHETIC_CALIBRATION", "execution provenance");
  assert(execution.calibrationFixtureCount === 38, "calibration fixture count");
  assert(execution.equivalenceDevelopmentPairCount === 5, "equivalence pair count");
  assert(execution.expectationMismatchCount === 0, "expectation mismatch count");
  assert(execution.llmProviderCalls === 0, "LLM/provider call count");
  assert(execution.evaluatorModifiedDuringCalibration === "NO", "evaluator mutation boundary");
  assert(execution.realHumanReferenceReview === "NOT_PERFORMED", "human review boundary");
  assert(execution.finalPD011ReferenceEligibility === "NO", "PD-011 eligibility boundary");
  assert(execution.blindEligibility === "NO", "blind eligibility boundary");

  const rawResultPaths = fs
    .readdirSync(RESULT_ROOT)
    .filter((file) => file.endsWith(".result.json"))
    .map((file) => path.resolve(RESULT_ROOT, file));
  assert(rawResultPaths.length === 38, "raw Calibration result count");
  for (const resultPath of rawResultPaths) {
    const result = readJson(resultPath);
    const contract = validateContract("evaluationResult", result);
    assert(contract.valid, `result schema: ${path.basename(resultPath)}`);
    assert(result.mode === "CALIBRATION_SYNTHETIC", `result mode: ${path.basename(resultPath)}`);
    assert(result.evaluatorIdentity.version === EVALUATOR_VERSION, "result evaluator version");
    assert(
      result.evaluatorIdentity.configurationDigest === EVALUATOR_CONFIGURATION_DIGEST,
      "result evaluator digest",
    );
    const observation = execution.calibrationObservations.find(
      (entry) => entry.candidateId === result.candidateId,
    );
    assert(Boolean(observation), `execution observation: ${result.candidateId}`);
    assert(observation?.expectationStatus === "MATCH", `expectation: ${result.candidateId}`);
    assert(
      observation?.resultSha256 === sha256(stableJson(result)),
      `result digest: ${result.candidateId}`,
    );
    assert(
      observation?.resultSha256 === observation?.deterministicReplaySha256,
      `deterministic replay: ${result.candidateId}`,
    );
  }

  const equivalenceRoot = path.resolve(RESULT_ROOT, "equivalence");
  const equivalencePaths = fs
    .readdirSync(equivalenceRoot)
    .filter((file) => file.endsWith(".result.json"));
  assert(equivalencePaths.length === 5, "equivalence raw result count");
  assert(equivalence.pairCount === 5 && equivalence.matchedCount === 5, "equivalence 5/5");
  assert(
    equivalence.observations.every(
      (entry) =>
        entry.expectationStatus === "MATCH" &&
        entry.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW" &&
        entry.realHumanReview === false &&
        entry.independentQualificationEvidence === false &&
        entry.resultSha256 === entry.deterministicReplaySha256,
    ),
    "equivalence authority and replay boundary",
  );

  assert(propertyResults.properties.length === 18, "P01-P18 property result count");
  assert(
    propertyResults.properties
      .filter((property) => property.absolute)
      .every(
        (property) =>
          property.compensable === false &&
          property.targetedProbeCount === 1 &&
          property.targetedExpectationAgreementCount === 1 &&
          property.threshold === "ABSOLUTE_NONCOMPENSABLE",
      ),
    "P01-P12 absolute non-compensable coverage",
  );
  assert(
    propertyResults.properties
      .filter((property) => !property.absolute)
      .every((property) => property.threshold === "THRESHOLD_NOT_YET_ADMITTED"),
    "P13-P18 threshold boundary",
  );

  assert(
    calibration.decision ===
      "SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION",
    "terminal decision",
  );
  assert(calibration.properties.p01ToP12TargetedDetection === "12/12", "P01-P12 detection");
  assert(calibration.properties.falsePassCountOnAbsoluteNegativeProbes === 0, "false pass count");
  assert(calibration.calibration.expectationMatches === 38, "38/38 Calibration agreement");
  assert(calibration.equivalence.matched === 5, "5/5 equivalence agreement");

  assert(
    Object.values(failureResults.dispositionCounts).reduce((sum, count) => sum + count, 0) === 38,
    "disposition accounting",
  );
  assert(antiOverfitting.precommitmentStatus === "COMMITTED_BEFORE_FIRST_OBSERVATION", "freeze commit");
  assert(antiOverfitting.evaluatorModifiedDuringCalibration === "NO", "anti-overfitting evaluator boundary");
  assert(antiOverfitting.postObservationRepairPerformed === false, "no post-observation repair");
  assert(antiOverfitting.blindContentAccessedOrCreated === false, "no blind content");
  assert(limitations.limitations.length >= 9, "limitations remain explicit");

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      calibrationResults: rawResultPaths.length,
      equivalenceResults: equivalencePaths.length,
      properties: propertyResults.properties.length,
      failureClassesExercised: failureResults.exercisedFailureClasses.length,
      dispositionsAccounted: Object.values(failureResults.dispositionCounts).reduce(
        (sum, count) => sum + count,
        0,
      ),
    },
    decision: calibration.decision,
    validatorPath: path.relative(REPOSITORY_ROOT, path.resolve(VALIDATOR_ROOT, "validate.mjs")),
  };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = validateB4Restart();
  if (!report.valid) {
    process.stderr.write(`${report.errors.join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `${report.decision}\nSEM-003B4 restart validated: ${report.counts.calibrationResults} Calibration results, ${report.counts.equivalenceResults} equivalences, ${report.counts.properties} properties, ${report.counts.dispositionsAccounted} dispositions accounted\n`,
    );
  }
}
