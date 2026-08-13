import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { evaluateScientificUnderstanding } from "../../../evaluator/core/evaluator.mjs";
import {
  ARTIFACT_ROOT,
  B3_EQUIVALENCE_PATH,
  DECISION_ROOT,
  EVALUATOR_CONFIGURATION_DIGEST,
  EVALUATOR_IDENTITY_PATH,
  EVALUATOR_ROOT,
  EVALUATOR_VERSION,
  FIXTURE_ROOT,
  PRECOMMITMENT_ROOT,
  REPOSITORY_ROOT,
  RESULT_ROOT,
  SEM003_ROOT,
  buildFrozenArtifacts,
  decisionFileName,
  fileSha256,
  fixtureFileName,
  readJson,
  relative,
  resultFileName,
  sha256,
  stableJson,
  writeJson,
} from "./protocol.mjs";

const EXECUTION_MANIFEST_PATH = path.resolve(
  ARTIFACT_ROOT,
  "calibration-execution-manifest.json",
);

if (fs.existsSync(EXECUTION_MANIFEST_PATH)) {
  throw new Error("B4 restart already executed; frozen observations cannot be overwritten");
}

const frozen = buildFrozenArtifacts();
const frozenFiles = [
  [path.resolve(PRECOMMITMENT_ROOT, "fixture-expectation-manifest.json"), frozen.expectationManifest],
  [path.resolve(PRECOMMITMENT_ROOT, "measurement-protocol.json"), frozen.measurementProtocol],
  [path.resolve(PRECOMMITMENT_ROOT, "calibration-freeze-manifest.json"), frozen.baselineManifest],
  ...frozen.fixtures.map(({ candidate }) => [
    path.resolve(FIXTURE_ROOT, fixtureFileName(candidate)),
    candidate,
  ]),
  ...frozen.decisions.map((decision) => [
    path.resolve(DECISION_ROOT, decisionFileName(decision)),
    decision,
  ]),
];
for (const [filePath, value] of frozenFiles) {
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== stableJson(value)) {
    throw new Error(`Precommitment drift before observation: ${relative(filePath)}`);
  }
}

const gitStatusAtStart = execFileSync("git", ["status", "--porcelain"], {
  cwd: REPOSITORY_ROOT,
  encoding: "utf8",
}).trim();
if (gitStatusAtStart) {
  throw new Error("Calibration execution requires a clean, committed precommitment worktree");
}
const freezeCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: REPOSITORY_ROOT,
  encoding: "utf8",
}).trim();
const startedAt = new Date().toISOString();

const identity = readJson(EVALUATOR_IDENTITY_PATH);
if (
  identity.version !== EVALUATOR_VERSION ||
  identity.configurationDigest !== EVALUATOR_CONFIGURATION_DIGEST
) {
  throw new Error("Evaluator identity differs before Calibration execution");
}

const digestResult = (result) =>
  crypto.createHash("sha256").update(stableJson(result)).digest("hex");

const expectationByCandidateId = new Map(
  frozen.expectationManifest.rows.map((row) => [row.candidateId, row]),
);

const evaluateCalibrationFixture = ({ pair, candidate, decisions }) => {
  const input = {
    schemaVersion: "1.1.0",
    contractType: "BENCHMARK_EVALUATION_INPUT",
    evaluationId: `SEM3-EVAL-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}`,
    evaluationMode: "CALIBRATION_SYNTHETIC",
    benchmarkCase: pair.benchmarkCase,
    acceptanceEnvelope: pair.envelope,
    candidateOutput: candidate,
    ...(decisions.length > 0 ? { adjudicationDecisionRecords: decisions } : {}),
  };
  const result = evaluateScientificUnderstanding(input);
  const replay = evaluateScientificUnderstanding(input);
  if (digestResult(result) !== digestResult(replay)) {
    throw new Error(`Deterministic replay changed: ${candidate.candidateId}`);
  }
  return { result, replayDigest: digestResult(replay) };
};

const compareExpectation = (row, result) => {
  const failures = [];
  const expected = row.expected;
  if (expected.level1 && result.level1.status !== expected.level1) {
    failures.push(`level1:${result.level1.status}!=${expected.level1}`);
  }
  if (expected.level2 && result.level2.status !== expected.level2) {
    failures.push(`level2:${result.level2.status}!=${expected.level2}`);
  }
  if (result.disposition !== expected.disposition) {
    failures.push(`disposition:${result.disposition}!=${expected.disposition}`);
  }
  if (expected.targetPropertyId) {
    const judgment = result.propertyJudgments.find(
      (entry) => entry.propertyId === expected.targetPropertyId,
    );
    if (!judgment || judgment.judgment !== expected.targetPropertyJudgment) {
      failures.push(
        `property:${expected.targetPropertyId}:${judgment?.judgment || "MISSING"}!=${expected.targetPropertyJudgment}`,
      );
    }
  }
  if (
    Number.isInteger(expected.openAdjudicationPacketCount) &&
    result.level2.adjudicationPackets.filter((packet) => packet.status === "OPEN").length !==
      expected.openAdjudicationPacketCount
  ) {
    failures.push("openAdjudicationPacketCount");
  }
  if (
    Number.isInteger(expected.absoluteViolationCount) &&
    result.criticalViolations.length !== expected.absoluteViolationCount
  ) {
    failures.push("absoluteViolationCount");
  }
  if (
    expected.falsePassForbidden &&
    ["ACCEPTABLE_SEMANTIC_EQUIVALENT", "ACCEPTABLE_NONCRITICAL_VARIATION"].includes(
      result.disposition,
    )
  ) {
    failures.push("falsePassForbidden");
  }
  if (
    expected.semanticPassForbidden &&
    ["ACCEPTABLE_SEMANTIC_EQUIVALENT", "ACCEPTABLE_NONCRITICAL_VARIATION"].includes(
      result.disposition,
    )
  ) {
    failures.push("semanticPassForbidden");
  }
  return failures;
};

const calibrationObservations = [];
for (const fixture of frozen.fixtures) {
  const row = expectationByCandidateId.get(fixture.candidate.candidateId);
  const { result, replayDigest } = evaluateCalibrationFixture(fixture);
  const expectationFailures = compareExpectation(row, result);
  writeJson(path.resolve(RESULT_ROOT, resultFileName(fixture.candidate)), result);
  calibrationObservations.push({
    candidateId: fixture.candidate.candidateId,
    caseId: fixture.pair.benchmarkCase.caseId,
    role: fixture.role,
    expectationStatus: expectationFailures.length === 0 ? "MATCH" : "MISMATCH",
    expectationFailures,
    resultPath: relative(path.resolve(RESULT_ROOT, resultFileName(fixture.candidate))),
    resultSha256: digestResult(result),
    deterministicReplaySha256: replayDigest,
    level1: result.level1.status,
    level2: result.level2.status,
    disposition: result.disposition,
  });
}

const developmentRoot = path.resolve(SEM003_ROOT, "corpus/development");
const developmentFixtureRoot = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const developmentDecisionRoot = path.resolve(developmentFixtureRoot, "adjudication");
const b3Equivalence = readJson(B3_EQUIVALENCE_PATH);
const equivalenceObservations = [];

for (const pairStatus of b3Equivalence.pairs) {
  const slug = pairStatus.caseId.replace("SEM3-DEV-", "").toLowerCase();
  const benchmarkCase = readJson(path.resolve(developmentRoot, `${slug}.case.json`));
  const envelope = readJson(path.resolve(developmentRoot, `${slug}.envelope.json`));
  const candidate = fs
    .readdirSync(developmentFixtureRoot)
    .filter((file) => file.endsWith(".candidate.json"))
    .map((file) => readJson(path.resolve(developmentFixtureRoot, file)))
    .find((entry) => entry.candidateId === pairStatus.candidateB);
  const decision = fs
    .readdirSync(developmentDecisionRoot)
    .filter((file) => file.endsWith(".decision.json"))
    .map((file) => readJson(path.resolve(developmentDecisionRoot, file)))
    .find((entry) => entry.target.candidateIds.includes(pairStatus.candidateB));
  if (!candidate || !decision) throw new Error(`B3 equivalence binding missing: ${pairStatus.pairId}`);
  const input = {
    schemaVersion: "1.1.0",
    contractType: "BENCHMARK_EVALUATION_INPUT",
    evaluationId: `SEM3-EVAL-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}`,
    evaluationMode: "DEVELOPMENT_SYNTHETIC",
    benchmarkCase,
    acceptanceEnvelope: envelope,
    candidateOutput: candidate,
    adjudicationDecisionRecords: [decision],
  };
  const result = evaluateScientificUnderstanding(input);
  const replay = evaluateScientificUnderstanding(input);
  const resultPath = path.resolve(
    RESULT_ROOT,
    "equivalence",
    `${pairStatus.pairId.toLowerCase()}.result.json`,
  );
  writeJson(resultPath, result);
  equivalenceObservations.push({
    pairId: pairStatus.pairId,
    caseId: pairStatus.caseId,
    candidateA: pairStatus.candidateA,
    candidateB: pairStatus.candidateB,
    authorityClass: decision.authorityClass,
    realHumanReview: decision.provenance.realHumanReview,
    independentQualificationEvidence: decision.eligibility.formalIndependentQualification,
    disposition: result.disposition,
    level1: result.level1.status,
    level2: result.level2.status,
    resultPath: relative(resultPath),
    resultSha256: digestResult(result),
    deterministicReplaySha256: digestResult(replay),
    expectationStatus:
      result.disposition === "ACCEPTABLE_SEMANTIC_EQUIVALENT" &&
      result.level1.status === "PASS" &&
      result.level2.status === "ADJUDICATION_DECISION_APPLIED" &&
      decision.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW" &&
      decision.provenance.realHumanReview === false
        ? "MATCH"
        : "MISMATCH",
  });
}

const allResults = calibrationObservations.map((observation) =>
  readJson(path.resolve(REPOSITORY_ROOT, observation.resultPath)),
);
const propertyRegistry = frozen.propertyRegistry;
const propertyLevel = propertyRegistry.properties.map((property) => {
  const judgments = allResults.flatMap((result) =>
    result.propertyJudgments.filter((entry) => entry.propertyId === property.id),
  );
  const count = (judgment) => judgments.filter((entry) => entry.judgment === judgment).length;
  const targeted = calibrationObservations.filter((observation) => {
    const row = expectationByCandidateId.get(observation.candidateId);
    return row.expected.targetPropertyId === property.id;
  });
  return {
    propertyId: property.id,
    alias: property.alias,
    family: property.family,
    absolute: property.absolute,
    compensable: property.compensable,
    applicableObservationCount: judgments.filter((entry) => entry.applicable).length,
    judgments: {
      satisfied: count("SATISFIED"),
      violated: count("VIOLATED"),
      notApplicable: count("NOT_APPLICABLE"),
      notEvaluable: count("NOT_EVALUABLE"),
      adjudicationRequired: count("ADJUDICATION_REQUIRED"),
    },
    targetedProbeCount: targeted.length,
    targetedExpectationAgreementCount: targeted.filter(
      (entry) => entry.expectationStatus === "MATCH",
    ).length,
    threshold: property.absolute ? "ABSOLUTE_NONCOMPENSABLE" : "THRESHOLD_NOT_YET_ADMITTED",
  };
});

const dispositionCounts = Object.fromEntries(
  [
    "ACCEPTABLE_SEMANTIC_EQUIVALENT",
    "ACCEPTABLE_NONCRITICAL_VARIATION",
    "SAFE_FAIL_CLOSED",
    "SEMANTIC_FAILURE",
    "PROVIDER_EXECUTION_FAILURE",
    "NOT_EVALUABLE",
  ].map((disposition) => [
    disposition,
    allResults.filter((result) => result.disposition === disposition).length,
  ]),
);
const failureClassCounts = {};
for (const result of allResults) {
  for (const finding of result.findings) {
    failureClassCounts[finding.failureClass] = (failureClassCounts[finding.failureClass] || 0) + 1;
  }
}

const propertyArtifact = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_PROPERTY_LEVEL_RESULTS",
  evaluatorVersion: EVALUATOR_VERSION,
  evaluatorConfigurationDigest: EVALUATOR_CONFIGURATION_DIGEST,
  observationCount: allResults.length,
  properties: propertyLevel,
  interpretation: {
    p01ToP12: "Absolute, non-compensable targeted detection and preservation checks.",
    p13ToP18:
      "Technical agreement with precommitted simulated Level 2 records only; no scientific threshold or PD-011 qualification is inferred.",
  },
};
writeJson(path.resolve(ARTIFACT_ROOT, "property-level-results.json"), propertyArtifact);

const failureDispositionArtifact = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_FAILURE_AND_DISPOSITION_RESULTS",
  calibrationObservationCount: allResults.length,
  dispositionCounts,
  failureClassCounts,
  exercisedFailureClasses: Object.keys(failureClassCounts).sort(),
  unexercisedFailureClasses: readJson(
    path.resolve(EVALUATOR_ROOT, "registry/failure-disposition-registry.json"),
  ).failureClasses.filter((entry) => !Object.hasOwn(failureClassCounts, entry)),
  rule: "Only observed failure classes are measured; boundary dispositions are not semantic successes.",
};
writeJson(
  path.resolve(ARTIFACT_ROOT, "failure-disposition-results.json"),
  failureDispositionArtifact,
);

const equivalenceArtifact = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_EQUIVALENCE_CALIBRATION_RESULTS",
  source: relative(B3_EQUIVALENCE_PATH),
  pairCount: equivalenceObservations.length,
  matchedCount: equivalenceObservations.filter((entry) => entry.expectationStatus === "MATCH").length,
  observations: equivalenceObservations,
  authorityBoundary:
    "All five decisions are simulated B3 Development evidence and are ineligible for independent qualification, blind admission, or PD-011 final evidence.",
};
writeJson(path.resolve(ARTIFACT_ROOT, "equivalence-results.json"), equivalenceArtifact);

const mismatchCount = calibrationObservations.filter(
  (entry) => entry.expectationStatus === "MISMATCH",
).length;
const equivalenceMismatchCount = equivalenceObservations.filter(
  (entry) => entry.expectationStatus === "MISMATCH",
).length;
const absoluteProbeRows = frozen.expectationManifest.rows.filter(
  (row) => row.role === "ABSOLUTE_INVARIANT_NEGATIVE",
);
const absoluteProbeMatches = absoluteProbeRows.filter(
  (row) =>
    calibrationObservations.find((entry) => entry.candidateId === row.candidateId)
      ?.expectationStatus === "MATCH",
).length;
const baselineRows = frozen.expectationManifest.rows.filter(
  (row) => row.role === "REFERENCE_CONFORMANT_POSITIVE",
);
const baselineMatches = baselineRows.filter(
  (row) =>
    calibrationObservations.find((entry) => entry.candidateId === row.candidateId)
      ?.expectationStatus === "MATCH",
).length;

const evaluatorUnchanged =
  readJson(EVALUATOR_IDENTITY_PATH).configurationDigest === EVALUATOR_CONFIGURATION_DIGEST &&
  fileSha256(EVALUATOR_IDENTITY_PATH) === frozen.baselineManifest.activeEvaluator.identitySha256;
const ready =
  mismatchCount === 0 &&
  equivalenceMismatchCount === 0 &&
  absoluteProbeMatches === 12 &&
  baselineMatches === 10 &&
  evaluatorUnchanged;
const decision = ready
  ? "SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION"
  : "SEM003B4_EVALUATOR_REPAIR_REQUIRED";

const uncertaintyArtifact = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_UNCERTAINTY_AND_LIMITATIONS",
  deterministicTechnicalUncertainty:
    "No replay divergence was observed in a deterministic local instrument; this does not estimate future SEM or provider variability.",
  limitations: [
    "REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED.",
    "FINAL_PD011_REFERENCE_ELIGIBILITY = NO.",
    "BLIND_ELIGIBILITY = NO.",
    "P13-P18 decision agreement measures decision-record consumption, not independent scientific judgment accuracy.",
    "N = 1 per deterministic fixture is technical and supplies no population-level competence estimate.",
    "No threshold is admitted for P13-P18.",
    "No SEM runtime, provider, LLM, browser, downstream, H29, Holdout, or blind package was executed.",
    "A synthetic provider-failure fixture tests disposition separation only; provider reliability is not measured.",
    "The Calibration-visible corpus cannot serve as future independent blind evidence.",
  ],
  residualUncertainty: [
    "Independent expert reference validity remains open.",
    "Evaluator performance on unexposed blind scientific content remains unknown.",
    "Future runtime adapter fidelity and provider execution reliability remain outside B4.",
  ],
};
writeJson(path.resolve(ARTIFACT_ROOT, "uncertainty-limitations.json"), uncertaintyArtifact);

const antiOverfittingArtifact = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_ANTI_OVERFITTING_AUDIT",
  freezeCommit,
  worktreeCleanBeforeFirstObservation: gitStatusAtStart === "",
  precommitmentStatus: "COMMITTED_BEFORE_FIRST_OBSERVATION",
  frozenFixtureCount: frozen.fixtures.length,
  frozenExpectationCount: frozen.expectations.length,
  frozenDecisionRecordCount: frozen.decisions.length,
  evaluatorModifiedDuringCalibration: evaluatorUnchanged ? "NO" : "YES",
  postObservationRepairPerformed: false,
  semRuntimeModified: false,
  goldModified: false,
  acceptanceEnvelopeModified: false,
  metricModifiedAfterObservation: false,
  decisionRuleModifiedAfterObservation: false,
  blindContentAccessedOrCreated: false,
  resultSelection: "ALL_RESULTS_COUNTED_NO_BEST_RUN_SELECTION",
  llmProviderCalls: 0,
};
writeJson(path.resolve(ARTIFACT_ROOT, "anti-overfitting-audit.json"), antiOverfittingArtifact);

const finishedAt = new Date().toISOString();
const executionManifest = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_CALIBRATION_EXECUTION_MANIFEST",
  restartId: frozen.baselineManifest.restartId,
  startedAt,
  finishedAt,
  freezeCommit,
  evaluatorVersion: EVALUATOR_VERSION,
  evaluatorConfigurationDigest: EVALUATOR_CONFIGURATION_DIGEST,
  mode: "CALIBRATION_SYNTHETIC",
  provenance: "B4_SYNTHETIC_CALIBRATION",
  repetitionsPerFixture: 1,
  calibrationFixtureCount: calibrationObservations.length,
  deterministicReplayCount: calibrationObservations.length + equivalenceObservations.length,
  equivalenceDevelopmentPairCount: equivalenceObservations.length,
  llmProviderCalls: 0,
  calibrationObservations,
  equivalenceObservations,
  expectationMismatchCount: mismatchCount + equivalenceMismatchCount,
  evaluatorModifiedDuringCalibration: evaluatorUnchanged ? "NO" : "YES",
  realHumanReferenceReview: "NOT_PERFORMED",
  finalPD011ReferenceEligibility: "NO",
  blindEligibility: "NO",
};
writeJson(EXECUTION_MANIFEST_PATH, executionManifest);

const calibrationManifest = {
  schemaVersion: "1.0.0",
  contractType: "SEM003B4_EVALUATOR_CALIBRATION_MANIFEST",
  decision,
  evaluator: {
    version: EVALUATOR_VERSION,
    configurationDigest: EVALUATOR_CONFIGURATION_DIGEST,
    modifiedDuringCalibration: evaluatorUnchanged ? "NO" : "YES",
  },
  calibration: {
    references: frozen.pairs.length,
    fixtures: calibrationObservations.length,
    expectationMatches: calibrationObservations.length - mismatchCount,
    expectationMismatches: mismatchCount,
    deterministicReplayMatches: calibrationObservations.filter(
      (entry) => entry.resultSha256 === entry.deterministicReplaySha256,
    ).length,
  },
  properties: {
    p01ToP12TargetedDetection: `${absoluteProbeMatches}/12`,
    referenceConformantPositiveAgreement: `${baselineMatches}/10`,
    falsePassCountOnAbsoluteNegativeProbes: absoluteProbeRows.filter((row) => {
      const observation = calibrationObservations.find(
        (entry) => entry.candidateId === row.candidateId,
      );
      return ["ACCEPTABLE_SEMANTIC_EQUIVALENT", "ACCEPTABLE_NONCRITICAL_VARIATION"].includes(
        observation?.disposition,
      );
    }).length,
    p13ToP18Threshold: "THRESHOLD_NOT_YET_ADMITTED",
  },
  equivalence: {
    matched: equivalenceObservations.length - equivalenceMismatchCount,
    total: equivalenceObservations.length,
    authorityClass: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
    realHumanReview: false,
  },
  boundaries: frozen.measurementProtocol.boundaries,
  next:
    decision ===
    "SEM003B4_EVALUATOR_CALIBRATED_READY_FOR_INDEPENDENT_BLIND_CONSTRUCTION"
      ? "SEM-003C — Independent Blind Construction & Sealing"
      : "Separate evaluator repair or normative arbitration mission according to the decision",
};
writeJson(path.resolve(ARTIFACT_ROOT, "evaluator-calibration-manifest.json"), calibrationManifest);

process.stdout.write(
  `${decision}\nCalibration: ${calibrationObservations.length - mismatchCount}/${calibrationObservations.length} expectations matched; equivalence: ${equivalenceObservations.length - equivalenceMismatchCount}/${equivalenceObservations.length}; LLM/provider calls: 0\n`,
);
