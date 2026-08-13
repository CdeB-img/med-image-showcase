import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VALIDATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CALIBRATION_ROOT = path.resolve(VALIDATOR_ROOT, "..");
const SEM003_ROOT = path.resolve(CALIBRATION_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(SEM003_ROOT, "../..");

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(REPOSITORY_ROOT, relativePath), "utf8"));
const sha256File = (relativePath) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.resolve(REPOSITORY_ROOT, relativePath)))
    .digest("hex");
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const aggregateDirectory = (relativePath) => {
  const absolutePath = path.resolve(REPOSITORY_ROOT, relativePath);
  const files = fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      path: `${relativePath}/${entry.name}`,
      sha256: sha256File(`${relativePath}/${entry.name}`),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return sha256(`${JSON.stringify(files, null, 2)}\n`);
};

const baseline = readJson(
  "semantic-validation/sem-003/calibration/baseline/calibration-baseline-manifest.json",
);
const assessment = readJson(
  "semantic-validation/sem-003/calibration/artifacts/preflight-blocking-assessment.json",
);
const antiOverfitting = readJson(
  "semantic-validation/sem-003/calibration/artifacts/anti-overfitting-audit.json",
);
const evaluatorIdentity = readJson(
  "semantic-validation/sem-003/evaluator/registry/evaluator-identity.json",
);
const propertyRegistry = readJson(
  "semantic-validation/sem-003/evaluator/registry/property-registry.json",
);
const candidateSchema = readJson(
  "semantic-validation/sem-003/evaluator/contracts/candidate-semantic-representation.schema.json",
);
const humanDecisionSchema = readJson(
  "semantic-validation/sem-003/evaluator/contracts/human-decision-record.schema.json",
);
const calibrationReferenceSet = readJson(
  "semantic-validation/sem-003/review/artifacts/calibration-reference-set.json",
);
const equivalenceStatus = readJson(
  "semantic-validation/sem-003/review/artifacts/equivalence-review-status.json",
);
const corpusRegistry = readJson(
  "semantic-validation/sem-003/corpus/registry/corpus-registry.json",
);

export const validateSem003B4Preflight = () => {
  const errors = [];
  const check = (condition, code) => {
    if (!condition) errors.push(code);
  };

  check(baseline.status === "FROZEN_PRE_EXECUTION", "BASELINE_NOT_FROZEN");
  check(
    baseline.evaluator.configurationDigest === evaluatorIdentity.configurationDigest,
    "EVALUATOR_CONFIGURATION_DIGEST_DRIFT",
  );
  check(
    baseline.evaluator.codeDigest ===
      aggregateDirectory("semantic-validation/sem-003/evaluator/core"),
    "EVALUATOR_CODE_DIGEST_DRIFT",
  );
  check(
    baseline.evaluator.schemasDigest ===
      aggregateDirectory("semantic-validation/sem-003/evaluator/contracts"),
    "EVALUATOR_SCHEMA_DIGEST_DRIFT",
  );
  check(
    baseline.evaluator.propertyRegistryDigest ===
      sha256File("semantic-validation/sem-003/evaluator/registry/property-registry.json"),
    "PROPERTY_REGISTRY_DIGEST_DRIFT",
  );
  check(
    baseline.evaluator.failureTaxonomyDigest ===
      sha256File("semantic-validation/sem-003/evaluator/registry/failure-disposition-registry.json"),
    "FAILURE_TAXONOMY_DIGEST_DRIFT",
  );
  check(
    baseline.calibrationReferenceSet.sha256 ===
      sha256File("semantic-validation/sem-003/review/artifacts/calibration-reference-set.json"),
    "CALIBRATION_REFERENCE_SET_DIGEST_DRIFT",
  );
  check(calibrationReferenceSet.cases.length === 10, "CALIBRATION_CASE_COUNT_NOT_TEN");
  check(
    calibrationReferenceSet.cases.every(
      (entry) =>
        entry.exposureStatus === "CALIBRATION_VISIBLE" &&
        entry.eligibleForDevelopmentCalibration === true &&
        entry.eligibleForFormalIndependentQualification === false &&
        entry.eligibleForBlindQualification === false,
    ),
    "CALIBRATION_REFERENCE_BOUNDARY_DRIFT",
  );

  const baselineCalibration = new Map(
    baseline.calibrationReferenceSet.cases.map((entry) => [entry.caseId, entry]),
  );
  for (const entry of calibrationReferenceSet.cases) {
    const frozen = baselineCalibration.get(entry.caseId);
    check(Boolean(frozen), `CALIBRATION_CASE_MISSING_FROM_BASELINE:${entry.caseId}`);
    check(
      frozen?.caseVersion === entry.caseVersion &&
        frozen?.envelopeVersion === entry.envelopeVersion &&
        frozen?.pairSha256 === entry.digests.pairSha256,
      `CALIBRATION_CASE_BASELINE_DRIFT:${entry.caseId}`,
    );
  }

  const developmentEntries = corpusRegistry.entries.filter(
    (entry) => entry.set === "DEVELOPMENT",
  );
  check(developmentEntries.length === 15, "DEVELOPMENT_CASE_COUNT_NOT_FIFTEEN");
  check(
    baseline.developmentReferenceSet.corpusRegistryDigest ===
      sha256File("semantic-validation/sem-003/corpus/registry/corpus-registry.json"),
    "DEVELOPMENT_REGISTRY_DIGEST_DRIFT",
  );

  const absoluteProperties = propertyRegistry.properties.filter((entry) => entry.absolute);
  check(absoluteProperties.length === 12, "ABSOLUTE_PROPERTY_COUNT_NOT_TWELVE");
  check(
    absoluteProperties.every(
      (entry) => entry.family === "SAFETY_FIDELITY_INVARIANT" && entry.compensable === false,
    ),
    "ABSOLUTE_PROPERTY_COMPENSABILITY_DRIFT",
  );

  const modes = candidateSchema.definitions.evaluationMode.enum;
  const sourceTypes = candidateSchema.properties.sourceType.enum;
  check(!modes.includes("CALIBRATION_SYNTHETIC"), "UNEXPECTED_CALIBRATION_MODE_PRESENT");
  check(
    !sourceTypes.includes("B4_SYNTHETIC_CALIBRATION"),
    "UNEXPECTED_CALIBRATION_SOURCE_TYPE_PRESENT",
  );
  check(
    humanDecisionSchema.properties.authority.const === "HUMAN_ADJUDICATION",
    "HUMAN_ADJUDICATION_AUTHORITY_DRIFT",
  );
  check(
    equivalenceStatus.pairs.length === 5 &&
      equivalenceStatus.pairs.every(
        (entry) =>
          entry.disposition === "SIMULATED_SEMANTICALLY_EQUIVALENT" &&
          entry.independentQualificationEvidence === false,
      ),
    "SIMULATED_EQUIVALENCE_STATUS_DRIFT",
  );

  const coreText = fs
    .readdirSync(path.resolve(SEM003_ROOT, "evaluator/core"))
    .map((name) => fs.readFileSync(path.resolve(SEM003_ROOT, "evaluator/core", name), "utf8"))
    .join("\n");
  const calibrationCaseIds = calibrationReferenceSet.cases.map((entry) => entry.caseId);
  const calibrationSemanticKeys = calibrationReferenceSet.cases.flatMap((entry) => {
    const slug = entry.caseId.replace("SEM3-CAL-", "").toLowerCase();
    const envelope = readJson(
      `semantic-validation/sem-003/corpus/calibration/${slug}.envelope.json`,
    );
    return [
      ...envelope.required,
      ...envelope.prohibited,
      ...envelope.optionalRelevant,
    ]
      .map((item) => item.semanticKey)
      .filter(Boolean);
  });
  check(
    calibrationCaseIds.every((caseId) => !coreText.includes(caseId)),
    "CALIBRATION_CASE_ID_FOUND_IN_EVALUATOR_CORE",
  );
  check(
    calibrationSemanticKeys.every((semanticKey) => !coreText.includes(semanticKey)),
    "CALIBRATION_SEMANTIC_KEY_FOUND_IN_EVALUATOR_CORE",
  );

  const forbiddenPaths = [
    "semantic-validation/sem-003/calibration/fixtures",
    "semantic-validation/sem-003/calibration/expectations/precommitted-expectations.json",
    "semantic-validation/sem-003/calibration/results/calibration-results.json",
    "semantic-validation/sem-003/calibration/metrics/property-calibration-matrix.json",
    "semantic-validation/sem-003/calibration/artifacts/evaluator-calibrated-freeze-manifest.json",
  ];
  check(
    forbiddenPaths.every((entry) => !fs.existsSync(path.resolve(REPOSITORY_ROOT, entry))),
    "POST_STOP_CALIBRATION_ARTIFACT_PRESENT",
  );
  check(assessment.decision === "SEM003B4_EVALUATOR_REPAIR_REQUIRED", "STOP_DECISION_DRIFT");
  check(assessment.calibrationExecutionStarted === false, "CALIBRATION_EXECUTION_STARTED");
  check(assessment.boundaries.semExecuted === false, "SEM_EXECUTION_RECORDED");
  check(assessment.boundaries.llmProviderCalls === 0, "LLM_PROVIDER_CALL_RECORDED");
  check(assessment.boundaries.blindCreated === false, "BLIND_CREATION_RECORDED");
  check(
    antiOverfitting.evaluatorConfigurationDigestBefore ===
      antiOverfitting.evaluatorConfigurationDigestAfter,
    "EVALUATOR_TUNED_FROM_CALIBRATION",
  );

  const controlIds = Object.values(assessment.controlStatus).flat();
  check(controlIds.length === 30, "B4_CONTROL_COUNT_NOT_THIRTY");
  check(new Set(controlIds).size === 30, "B4_CONTROL_IDS_NOT_UNIQUE");

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      decision: assessment.decision,
      evaluatorVersion: evaluatorIdentity.version,
      evaluatorConfigurationDigest: evaluatorIdentity.configurationDigest,
      calibrationCases: calibrationReferenceSet.cases.length,
      developmentCases: developmentEntries.length,
      preflightControlsPassed: assessment.controlStatus.PASS_PREFLIGHT.length,
      blockingControls: assessment.controlStatus.BLOCKING_FAILURE.length,
      controlsNotExecutedAfterStop: assessment.controlStatus.NOT_EXECUTED_AFTER_STOP.length,
      calibrationFixtures: assessment.fixtureCount,
      calibrationResults: assessment.resultCount,
      llmProviderCalls: assessment.boundaries.llmProviderCalls,
    },
  };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateSem003B4Preflight();
  if (!result.valid) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(result.summary, null, 2));
}
