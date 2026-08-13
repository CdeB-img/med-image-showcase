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
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const sourceCandidate = readJson(
  path.resolve(FIXTURE_ROOT, "body-composition-ambiguity-baseline.candidate.json"),
);
const sourceCase = readJson(
  path.resolve(DEVELOPMENT_ROOT, "body-composition-ambiguity.case.json"),
);
const sourceEnvelope = readJson(
  path.resolve(DEVELOPMENT_ROOT, "body-composition-ambiguity.envelope.json"),
);

const syntheticBlindReference = () => {
  const caseId = "SYNTHETIC-QUALIFICATION-CASE-001";
  const envelopeId = "SEM3-AE-QUALIFICATION-SYNTHETIC-001";
  const benchmarkCase = {
    ...structuredClone(sourceCase),
    schemaVersion: "1.0.0",
    contractType: "SEM003C_BLIND_BENCHMARK_CASE",
    purpose: "BLIND_QUALIFICATION_AUTHORING",
    caseId,
    reviewStatus: "SIMULATED_REFERENCE_REVIEW_COMPLETE",
    scientificScope: {
      ...structuredClone(sourceCase.scientificScope),
      domainGroup: "SYNTHETIC_CONTRACT_TEST_ONLY",
    },
    exposure: {
      ...structuredClone(sourceCase.exposure),
      exposureStatus: "BLIND_SEALED",
      exposureHistory: [
        {
          eventId: "synthetic-contract-test-sealed",
          fromStatus: "BLIND_DESIGN_ONLY",
          toStatus: "BLIND_SEALED",
          occurredAt: "2026-08-14T12:00:00.000Z",
          actorRole: "CONTRACT_TEST_FIXTURE",
          reason: "Synthetic non-campaign fixture for reference binding validation only.",
        },
      ],
      parentageStatus: "BLIND_PARENTAGE_CLEAR",
      eligibleForBlindQualification: true,
    },
    reference: {
      ...structuredClone(sourceCase.reference),
      acceptanceEnvelopeId: envelopeId,
    },
  };
  const acceptanceEnvelope = {
    ...structuredClone(sourceEnvelope),
    contractType: "SEM003C_BLIND_ACCEPTANCE_ENVELOPE",
    envelopeId,
    caseId,
    reviewStatus: "SIMULATED_REFERENCE_STABLE_FOR_BLIND_CONSTRUCTION",
    acceptableSemanticVariants: [
      ...structuredClone(sourceEnvelope.acceptableSemanticVariants),
      {
        ...structuredClone(sourceEnvelope.acceptableSemanticVariants[0]),
        variantId: "variant-synthetic-contract-alternative",
        label: "Alternative synthétique de validation contractuelle",
      },
    ],
  };
  const candidateOutput = {
    ...structuredClone(sourceCandidate),
    schemaVersion: "1.3.0",
    purpose: BLIND_PURPOSE,
    candidateId: "SEM3-EVAL-CAND-SYNTHETIC-QUALIFICATION-BINDING",
    caseId,
    caseVersion: benchmarkCase.version,
    envelopeId,
    envelopeVersion: acceptanceEnvelope.version,
    evaluationMode: "FUTURE_SEM_RUNTIME",
    sourceType: "FUTURE_SEM_RUNTIME_OUTPUT",
  };
  return { benchmarkCase, acceptanceEnvelope, candidateOutput };
};

const inputFor = (overrides = {}) => ({
  schemaVersion: "1.3.0",
  contractType: "BENCHMARK_EVALUATION_INPUT",
  evaluationId: "SEM3-EVAL-SYNTHETIC-BLIND-REFERENCE-BINDING",
  evaluationMode: "FUTURE_SEM_RUNTIME",
  benchmarkSet: "BLIND",
  ...syntheticBlindReference(),
  ...overrides,
});

test("C1R2-C01 a generic synthetic sealed Blind reference is contract-valid", () => {
  const input = inputFor();
  assert.equal(input.benchmarkCase.caseId, "SYNTHETIC-QUALIFICATION-CASE-001");
  assert.equal(validateContract("evaluationInput", input).valid, true);
});

test("C1R2-C02 the synthetic Blind reference reaches the unchanged evaluation mechanics", () => {
  const result = evaluateScientificUnderstanding(inputFor());
  assert.equal(result.mode, "FUTURE_SEM_RUNTIME");
  assert.equal(result.evaluatorIdentity.version, "1.3.0");
});

test("C1R2-C03 Blind evaluation requires an explicit BLIND benchmark set", () => {
  const missing = inputFor();
  delete missing.benchmarkSet;
  assert.equal(validateContract("evaluationInput", missing).valid, false);
  assert.equal(
    validateContract("evaluationInput", inputFor({ benchmarkSet: "CALIBRATION" })).valid,
    false,
  );
});

test("C1R2-C04 visible Development references cannot masquerade as Blind references", () => {
  const reference = syntheticBlindReference();
  const input = inputFor({
    benchmarkCase: sourceCase,
    acceptanceEnvelope: sourceEnvelope,
    candidateOutput: reference.candidateOutput,
  });
  assert.equal(validateContract("evaluationInput", input).valid, false);
});

test("C1R2-C05 purpose and source remain bound to Blind Qualification", () => {
  const wrongPurpose = inputFor();
  wrongPurpose.candidateOutput.purpose = DEVELOPMENT_PURPOSE;
  assert.equal(validateContract("evaluationInput", wrongPurpose).valid, false);
  const wrongSource = inputFor();
  wrongSource.candidateOutput.sourceType = "EVALUATOR_DEVELOPMENT_SYNTHETIC";
  assert.equal(validateContract("evaluationInput", wrongSource).valid, false);
});

test("C1R2-C06 only sealed and eligible Blind references pass the runtime boundary", () => {
  const unsealed = inputFor();
  unsealed.benchmarkCase.exposure.exposureStatus = "BLIND_DESIGN_ONLY";
  assert.throws(
    () => evaluateScientificUnderstanding(unsealed),
    (error) => error.code === "EVALUATOR_CONTRACT_INVALID",
  );
  const ineligible = inputFor();
  ineligible.benchmarkCase.exposure.eligibleForBlindQualification = false;
  assert.throws(
    () => evaluateScientificUnderstanding(ineligible),
    (error) => error.code === "EVALUATOR_CONTRACT_INVALID",
  );
});

test("C1R2-C07 Development and Calibration purposes and modes remain available", () => {
  const schema = readJson(
    path.resolve(EVALUATOR_ROOT, "contracts/candidate-semantic-representation.schema.json"),
  );
  assert.deepEqual(schema.properties.purpose.enum, [
    DEVELOPMENT_PURPOSE,
    CALIBRATION_PURPOSE,
    BLIND_PURPOSE,
  ]);
  assert.deepEqual(schema.definitions.evaluationMode.enum, [
    "DEVELOPMENT_SYNTHETIC",
    "CALIBRATION_SYNTHETIC",
    "FUTURE_SEM_RUNTIME",
    "HUMAN_ADJUDICATION",
  ]);
});

test("C1R2-C08 all 41 Development fixtures and B4 registries are unchanged", () => {
  const fixtureFiles = fs
    .readdirSync(FIXTURE_ROOT)
    .filter((entry) => entry.endsWith(".candidate.json"))
    .sort()
    .map((entry) => path.resolve(FIXTURE_ROOT, entry));
  const fixtureDigest = sha256(
    stableJson(
      fixtureFiles.map((filePath) => ({
        path: path.relative(REPOSITORY_ROOT, filePath),
        sha256: sha256(fs.readFileSync(filePath)),
      })),
    ),
  );
  assert.equal(fixtureFiles.length, 41);
  assert.equal(
    fixtureDigest,
    "b50a7f795fea663d911edf7f6334e8dc9ab2ba4334ceceee1a2f57f7a8f3e420",
  );
  assert.equal(
    sha256(fs.readFileSync(path.resolve(REGISTRY_ROOT, "property-registry.json"))),
    "f0db9a687df425fd844c80580914bb91b3c5382663307fa9aea696015c876a70",
  );
  assert.equal(
    sha256(fs.readFileSync(path.resolve(REGISTRY_ROOT, "failure-disposition-registry.json"))),
    "a5e45a03676b049c8a6478c66dfbd218fcd29954e48e38cc74ab850b6a950e2b",
  );
});

test("C1R2-C09 protected baselines and Blind benchmark assets remain untouched", () => {
  const protectedPaths = [
    "experiments/semantic-engine-comparison/baselines",
    "experiments/semantic-engine-comparison/adapters",
    "experiments/semantic-engine-comparison/contracts",
    "experiments/semantic-engine-comparison/prompts",
    "experiments/semantic-engine-comparison/manifests",
    "semantic-validation/sem-003/blind",
  ];
  const changed = spawnSync("git", ["diff", "--quiet", "HEAD", "--", ...protectedPaths], {
    cwd: REPOSITORY_ROOT,
  });
  assert.equal(changed.status, 0);
});

test("C1R2-C10 the successor identity, binding, and freeze are reproducible", () => {
  const check = spawnSync(
    process.execPath,
    ["semantic-validation/sem-003/evaluator/tools/generate-c1r2-freeze.mjs", "--check"],
    { cwd: REPOSITORY_ROOT, encoding: "utf8" },
  );
  assert.equal(check.status, 0, check.stderr || check.stdout);
  const binding = readJson(
    path.resolve(REGISTRY_ROOT, "sem003c1r2-comparative-evaluator-binding.json"),
  );
  assert.equal(binding.benchmarkSet, "BLIND");
  assert.equal(binding.referenceBinding.casePurpose, "BLIND_QUALIFICATION_AUTHORING");
  assert.equal(binding.referenceBinding.exposureStatus, "BLIND_SEALED");
});
