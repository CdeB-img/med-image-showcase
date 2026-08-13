import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateContract } from "./core/contracts.mjs";
import { evaluateScientificUnderstanding } from "./core/evaluator.mjs";
import {
  ADJUDICATION_AUTHORITY_CAPABILITIES,
  prepareAdjudicationDecisions,
} from "./core/adjudication.mjs";
import { ABSOLUTE_PROPERTY_IDS, PROPERTY_ORDER } from "./core/registry.mjs";

const EVALUATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SEM003_ROOT = path.resolve(EVALUATOR_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(SEM003_ROOT, "../..");
const DEVELOPMENT_ROOT = path.resolve(SEM003_ROOT, "corpus/development");
const FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const DECISION_ROOT = path.resolve(FIXTURE_ROOT, "adjudication");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const loadDevelopmentPairs = () => {
  const files = fs.readdirSync(DEVELOPMENT_ROOT).sort();
  const cases = files
    .filter((file) => file.endsWith(".case.json"))
    .map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopes = files
    .filter((file) => file.endsWith(".envelope.json"))
    .map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  return new Map(
    cases.map((benchmarkCase) => [
      benchmarkCase.caseId,
      {
        benchmarkCase,
        envelope: envelopes.find((entry) => entry.caseId === benchmarkCase.caseId),
      },
    ]),
  );
};

const pairs = loadDevelopmentPairs();
const candidates = fs
  .readdirSync(FIXTURE_ROOT)
  .filter((file) => file.endsWith(".candidate.json"))
  .sort()
  .map((file) => readJson(path.join(FIXTURE_ROOT, file)));
const decisions = fs
  .readdirSync(DECISION_ROOT)
  .filter((file) => file.endsWith(".decision.json"))
  .sort()
  .map((file) => readJson(path.join(DECISION_ROOT, file)));
const simulatedDecisions = decisions.filter(
  (record) => record.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
);
const humanContractFixture = decisions.find(
  (record) => record.evidenceBasis === "CONTRACT_TEST_ONLY",
);

const evaluate = (candidate, adjudicationDecisionRecords = []) => {
  const pair = pairs.get(candidate.caseId);
  return evaluateScientificUnderstanding({
    schemaVersion: adjudicationDecisionRecords.length > 0 ? "1.1.0" : "1.0.0",
    contractType: "BENCHMARK_EVALUATION_INPUT",
    evaluationId: `SEM3-EVAL-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}`,
    evaluationMode: candidate.evaluationMode,
    benchmarkCase: pair.benchmarkCase,
    acceptanceEnvelope: pair.envelope,
    candidateOutput: candidate,
    ...(adjudicationDecisionRecords.length > 0 ? { adjudicationDecisionRecords } : {}),
  });
};

const genericCalibrationContractFixture = () => {
  const sourcePair = [...pairs.values()][0];
  const sourceCandidate = candidates.find(
    (candidate) =>
      candidate.caseId === sourcePair.benchmarkCase.caseId &&
      candidate.structureProfile === "CONSOLIDATED",
  );
  const caseId = "SEM3-EX-CALIBRATION-CONTRACT";
  const envelopeId = "SEM3-AE-EX-CALIBRATION-CONTRACT";
  const benchmarkCase = structuredClone(sourcePair.benchmarkCase);
  benchmarkCase.caseId = caseId;
  benchmarkCase.purpose = "CALIBRATION_AUTHORING";
  benchmarkCase.reviewStatus = "APPROVED_FOR_CALIBRATION";
  benchmarkCase.reference.acceptanceEnvelopeId = envelopeId;
  benchmarkCase.exposure.exposureStatus = "CALIBRATION_VISIBLE";
  benchmarkCase.exposure.eligibleForCalibration = true;
  benchmarkCase.exposure.eligibleForBlindQualification = false;
  benchmarkCase.exposure.exposureHistory = [
    {
      eventId: "exposure-generic-contract-calibration-visible",
      fromStatus: null,
      toStatus: "CALIBRATION_VISIBLE",
      occurredAt: "2026-08-13T00:00:00.000Z",
      actorRole: "EVALUATOR_CONTRACT_TEST",
      reason: "Generic metadata fixture with no Calibration scientific reference.",
    },
  ];
  const envelope = structuredClone(sourcePair.envelope);
  envelope.caseId = caseId;
  envelope.envelopeId = envelopeId;
  const candidate = structuredClone(sourceCandidate);
  candidate.schemaVersion = "1.1.0";
  candidate.purpose = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION";
  candidate.candidateId = "SEM3-EVAL-CAND-CALIBRATION-CONTRACT";
  candidate.caseId = caseId;
  candidate.envelopeId = envelopeId;
  candidate.evaluationMode = "CALIBRATION_SYNTHETIC";
  candidate.sourceType = "B4_SYNTHETIC_CALIBRATION";
  return { benchmarkCase, envelope, candidate };
};

test("B4R-C01/C02 generic Calibration mode and explicit synthetic provenance exist", () => {
  const candidateSchema = readJson(
    path.resolve(EVALUATOR_ROOT, "contracts/candidate-semantic-representation.schema.json"),
  );
  assert.equal(
    candidateSchema.definitions.evaluationMode.enum.includes("CALIBRATION_SYNTHETIC"),
    true,
  );
  assert.equal(candidateSchema.properties.sourceType.enum.includes("B4_SYNTHETIC_CALIBRATION"), true);
  const fixture = genericCalibrationContractFixture();
  assert.equal(validateContract("candidate", fixture.candidate).valid, true);
  const result = evaluateScientificUnderstanding({
    schemaVersion: "1.1.0",
    contractType: "BENCHMARK_EVALUATION_INPUT",
    evaluationId: "SEM3-EVAL-CALIBRATION-CONTRACT",
    evaluationMode: "CALIBRATION_SYNTHETIC",
    benchmarkCase: fixture.benchmarkCase,
    acceptanceEnvelope: fixture.envelope,
    candidateOutput: fixture.candidate,
  });
  assert.equal(result.mode, "CALIBRATION_SYNTHETIC");
});

test("B4R-C03 Calibration mode rejects Development metadata", () => {
  const source = candidates.find((candidate) => candidate.structureProfile === "CONSOLIDATED");
  const candidate = {
    ...structuredClone(source),
    schemaVersion: "1.1.0",
    purpose: "SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION",
    evaluationMode: "CALIBRATION_SYNTHETIC",
    sourceType: "B4_SYNTHETIC_CALIBRATION",
  };
  const pair = pairs.get(source.caseId);
  assert.throws(
    () =>
      evaluateScientificUnderstanding({
        schemaVersion: "1.1.0",
        contractType: "BENCHMARK_EVALUATION_INPUT",
        evaluationId: "SEM3-EVAL-CALIBRATION-WITH-DEVELOPMENT-METADATA",
        evaluationMode: "CALIBRATION_SYNTHETIC",
        benchmarkCase: pair.benchmarkCase,
        acceptanceEnvelope: pair.envelope,
        candidateOutput: candidate,
      }),
    (error) => error.code === "CALIBRATION_MODE_BOUNDARY_VIOLATION",
  );
});

test("B4R-C04 Calibration mode rejects Blind metadata structurally", () => {
  const fixture = genericCalibrationContractFixture();
  fixture.benchmarkCase.exposure.exposureStatus = "BLIND_SEALED";
  fixture.benchmarkCase.exposure.exposureHistory[0].toStatus = "BLIND_SEALED";
  assert.throws(
    () =>
      evaluateScientificUnderstanding({
        schemaVersion: "1.1.0",
        contractType: "BENCHMARK_EVALUATION_INPUT",
        evaluationId: "SEM3-EVAL-CALIBRATION-WITH-BLIND-METADATA",
        evaluationMode: "CALIBRATION_SYNTHETIC",
        benchmarkCase: fixture.benchmarkCase,
        acceptanceEnvelope: fixture.envelope,
        candidateOutput: fixture.candidate,
      }),
    (error) => error.code === "AUTHORING_REFERENCE_INVALID",
  );
});

test("B4R-C05/C06 Calibration mode cannot claim runtime or human provenance", () => {
  for (const sourceType of ["FUTURE_SEM_RUNTIME_OUTPUT", "HUMAN_ADJUDICATED_OUTPUT"]) {
    const fixture = genericCalibrationContractFixture();
    fixture.candidate.sourceType = sourceType;
    assert.equal(validateContract("candidate", fixture.candidate).valid, false);
  }
});

test("B4R-C07/C08 evaluator core contains no specific case ID or scientific semantic key", () => {
  const coreSource = fs
    .readdirSync(path.resolve(EVALUATOR_ROOT, "core"))
    .filter((file) => file.endsWith(".mjs"))
    .map((file) => fs.readFileSync(path.resolve(EVALUATOR_ROOT, "core", file), "utf8"))
    .join("\n");
  assert.equal(/SEM3-(DEV|CAL)-[A-Z0-9]/.test(coreSource), false);
  const developmentSemanticKeys = [...pairs.values()].flatMap(({ envelope }) => [
    ...envelope.required.map((entry) => entry.semanticKey),
    ...envelope.prohibited.map((entry) => entry.semanticKey),
    ...envelope.optionalRelevant.map((entry) => entry.semanticKey),
  ]);
  assert.equal(developmentSemanticKeys.some((semanticKey) => coreSource.includes(semanticKey)), false);
});

test("B4R-C09-C14 simulated decision, authority and eligibility remain separate", () => {
  assert.equal(simulatedDecisions.length, 5);
  for (const record of simulatedDecisions) {
    assert.equal(validateContract("adjudicationDecisionRecord", record).valid, true);
    assert.equal(record.decision, "EQUIVALENT");
    assert.equal(record.authorityClass, "SIMULATED_PLURALISTIC_EXPERT_REVIEW");
    assert.equal(record.provenance.realHumanReview, false);
    assert.equal(record.eligibility.developmentEvaluatorTesting, true);
    assert.equal(record.eligibility.developmentCalibration, true);
    assert.equal(record.eligibility.formalIndependentQualification, false);
    assert.equal(record.eligibility.blindReferenceAdmission, false);
    assert.equal(record.eligibility.pd011FinalEvidence, false);
  }
  const simulatedCapability = ADJUDICATION_AUTHORITY_CAPABILITIES.authorities.find(
    (entry) => entry.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
  );
  assert.deepEqual(simulatedCapability.allowedOperationalUses, [
    "DEVELOPMENT_EVALUATOR_TESTING",
    "DEVELOPMENT_CALIBRATION",
  ]);
});

test("B4R-C11 simulated authority cannot be relabeled human", () => {
  const promoted = structuredClone(simulatedDecisions[0]);
  promoted.provenance.realHumanReview = true;
  assert.equal(validateContract("adjudicationDecisionRecord", promoted).valid, false);
});

test("B4R-C15 human authority remains a distinct contract-only fixture", () => {
  assert.ok(humanContractFixture);
  assert.equal(validateContract("adjudicationDecisionRecord", humanContractFixture).valid, true);
  assert.equal(humanContractFixture.authorityClass, "HUMAN_ADJUDICATION");
  assert.equal(humanContractFixture.evidenceBasis, "CONTRACT_TEST_ONLY");
  assert.equal(humanContractFixture.provenance.realHumanReview, false);
  assert.equal(Object.values(humanContractFixture.eligibility).some(Boolean), false);
});

test("B4R-C16-C18 five B3 Development equivalences are consumed with simulated provenance", () => {
  for (const record of simulatedDecisions) {
    const candidateId = record.target.candidateIds.find((id) => id.endsWith("-DISTRIBUTED"));
    const candidate = candidates.find((entry) => entry.candidateId === candidateId);
    const result = evaluate(candidate, [record]);
    assert.equal(result.disposition, "ACCEPTABLE_SEMANTIC_EQUIVALENT");
    assert.equal(result.level2.status, "ADJUDICATION_DECISION_APPLIED");
    assert.equal(result.level2.adjudicationPackets.every((packet) => packet.status === "RESOLVED"), true);
    assert.equal(result.level2.appliedDecisions.length, record.target.packetIds.length);
    assert.equal(
      result.level2.appliedDecisions.every(
        (decision) =>
          decision.authorityClass === "SIMULATED_PLURALISTIC_EXPERT_REVIEW" &&
          decision.provenance.realHumanReview === false &&
          decision.eligibility.formalIndependentQualification === false,
      ),
      true,
    );
    assert.equal(result.equivalence.requiresIndependentQualificationEvidence, true);
  }
});

test("B4R-C19 all 41 historical fixtures retain their semantic result projection", () => {
  const projection = candidates.map((candidate) => {
    const result = evaluate(candidate);
    return {
      candidateId: candidate.candidateId,
      disposition: result.disposition,
      level1: result.level1.status,
      level2: result.level2.status,
      equivalence: result.equivalence.classification,
      judgments: result.propertyJudgments.map((judgment) => [
        judgment.propertyId,
        judgment.judgment,
      ]),
    };
  });
  const digest = crypto
    .createHash("sha256")
    .update(JSON.stringify(projection))
    .digest("hex");
  assert.equal(candidates.length, 41);
  assert.equal(digest, "69c2e322efdf1055a9a44e36c7ab61de550212f3938925c239537995ba20cdbd");
});

test("B4R-C20-C22 property and failure contracts are unchanged", () => {
  assert.equal(ABSOLUTE_PROPERTY_IDS.length, 12);
  assert.equal(PROPERTY_ORDER.length, 18);
  const propertyDigest = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.resolve(EVALUATOR_ROOT, "registry/property-registry.json")))
    .digest("hex");
  const failureDigest = crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.resolve(EVALUATOR_ROOT, "registry/failure-disposition-registry.json")))
    .digest("hex");
  assert.equal(propertyDigest, "f0db9a687df425fd844c80580914bb91b3c5382663307fa9aea696015c876a70");
  assert.equal(failureDigest, "a5e45a03676b049c8a6478c66dfbd218fcd29954e48e38cc74ab850b6a950e2b");
});

test("B4R-C23 decision lineage remains reconstructible end to end", () => {
  const record = simulatedDecisions[0];
  const candidate = candidates.find((entry) => entry.candidateId === record.target.candidateIds[1]);
  const result = evaluate(candidate, [record]);
  for (const applied of result.level2.appliedDecisions) {
    const packet = result.level2.adjudicationPackets.find(
      (entry) => entry.packetId === applied.packetId,
    );
    assert.equal(packet.decisionRecordId, record.recordId);
    assert.equal(applied.sourceDecisionId, record.sourceDecisionId);
    assert.equal(applied.reviewBasis, "SIMULATED_PLURALISTIC_EXPERT_REVIEW");
    assert.equal(result.evidenceTrace.includes(`adjudicationDecision:${record.sourceDecisionId}`), true);
  }
});

test("B4R-C24-C28 repair sources remain Development-only and offline", () => {
  const repairSources = [
    path.resolve(EVALUATOR_ROOT, "core/adjudication.mjs"),
    path.resolve(EVALUATOR_ROOT, "core/evaluator.mjs"),
    path.resolve(EVALUATOR_ROOT, "tools/generate-development-fixtures.mjs"),
  ].map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.equal(repairSources.includes("corpus/calibration"), false);
  assert.equal(repairSources.includes("calibration-results"), false);
  assert.equal(repairSources.includes("src/features/scientific-semantic-reconstruction"), false);
  assert.equal(repairSources.includes("Gemini"), false);
  assert.equal(repairSources.includes("BLIND_SEALED") && fs.existsSync(path.resolve(REPOSITORY_ROOT, "semantic-validation/sem-003/blind")), false);
  const prepared = prepareAdjudicationDecisions({
    adjudicationDecisionRecords: [],
    humanDecisionRecords: [],
    evaluationMode: "DEVELOPMENT_SYNTHETIC",
    benchmarkCase: [...pairs.values()][0].benchmarkCase,
    candidateOutput: candidates[0],
  });
  assert.equal(prepared.byPacketId.size, 0);
});
