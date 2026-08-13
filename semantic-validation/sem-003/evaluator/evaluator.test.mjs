import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateContract } from "./core/contracts.mjs";
import { evaluateScientificUnderstanding } from "./core/evaluator.mjs";
import { ABSOLUTE_PROPERTY_IDS, PROPERTY_ORDER, STATISTICAL_PROPERTY_IDS } from "./core/registry.mjs";
import { validateEvaluatorDevelopment } from "./validate.mjs";

const EVALUATOR_ROOT = path.dirname(fileURLToPath(import.meta.url));
const DEVELOPMENT_ROOT = path.resolve(EVALUATOR_ROOT, "../corpus/development");
const FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const loadPairs = () => {
  const files = fs.readdirSync(DEVELOPMENT_ROOT).sort();
  const cases = files.filter((file) => file.endsWith(".case.json")).map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopes = files.filter((file) => file.endsWith(".envelope.json")).map((file) => readJson(path.join(DEVELOPMENT_ROOT, file)));
  const envelopeByCaseId = new Map(envelopes.map((entry) => [entry.caseId, entry]));
  return new Map(cases.map((benchmarkCase) => [benchmarkCase.caseId, { benchmarkCase, envelope: envelopeByCaseId.get(benchmarkCase.caseId) }]));
};

const pairs = loadPairs();
const candidates = fs
  .readdirSync(FIXTURE_ROOT)
  .filter((file) => file.endsWith(".candidate.json"))
  .sort()
  .map((file) => readJson(path.join(FIXTURE_ROOT, file)));

const evaluate = (candidate) => {
  const pair = pairs.get(candidate.caseId);
  return evaluateScientificUnderstanding({
    schemaVersion: "1.0.0",
    contractType: "BENCHMARK_EVALUATION_INPUT",
    evaluationId: `SEM3-EVAL-${candidate.candidateId.replace("SEM3-EVAL-CAND-", "")}`,
    evaluationMode: "DEVELOPMENT_SYNTHETIC",
    benchmarkCase: pair.benchmarkCase,
    acceptanceEnvelope: pair.envelope,
    candidateOutput: candidate,
  });
};

const results = new Map(candidates.map((candidate) => [candidate.candidateId, evaluate(candidate)]));

test("all seven evaluator contracts compile and all 41 candidates conform", () => {
  assert.equal(candidates.length, 41);
  for (const candidate of candidates) assert.equal(validateContract("candidate", candidate).valid, true);
  for (const result of results.values()) assert.equal(validateContract("evaluationResult", result).valid, true);
});

test("all 15 exposed Development cases are used and no Calibration case is referenced", () => {
  assert.equal(pairs.size, 15);
  assert.deepEqual(new Set(candidates.map((candidate) => candidate.caseId)), new Set(pairs.keys()));
  assert.equal(candidates.some((candidate) => candidate.caseId.startsWith("SEM3-CAL-")), false);
});

test("five structurally different pairs preserve the same critical vector without form rejection", () => {
  const distributed = candidates.filter((candidate) => candidate.structureProfile === "DISTRIBUTED_EQUIVALENT");
  assert.equal(distributed.length, 5);
  for (const candidate of distributed) {
    const baselineId = candidate.candidateId.replace("-DISTRIBUTED", "-BASELINE");
    const baseline = results.get(baselineId);
    const result = results.get(candidate.candidateId);
    assert.deepEqual(result.level1.criticalVector, baseline.level1.criticalVector);
    assert.equal(result.level1.status, "PASS");
    assert.equal(result.disposition, "NOT_EVALUABLE");
    assert.equal(result.equivalence.classification, "REQUIRES_ADJUDICATION");
  }
});

test("twelve structurally close candidates exercise one negative for every absolute invariant", () => {
  const negatives = candidates.filter((candidate) => candidate.structureProfile === "NEAR_REFERENCE_WITH_SEMANTIC_DEFECT");
  assert.equal(negatives.length, 12);
  const violated = new Set(
    negatives.flatMap((candidate) =>
      results
        .get(candidate.candidateId)
        .propertyJudgments.filter((judgment) => judgment.judgment === "VIOLATED")
        .map((judgment) => judgment.propertyId),
    ),
  );
  for (const propertyId of ABSOLUTE_PROPERTY_IDS) assert.equal(violated.has(propertyId), true, propertyId);
  for (const candidate of negatives) assert.equal(results.get(candidate.candidateId).disposition, "SEMANTIC_FAILURE");
});

test("every absolute invariant also has a positive Development fixture", () => {
  const satisfied = new Set(
    [...results.values()].flatMap((result) =>
      result.propertyJudgments.filter((judgment) => judgment.judgment === "SATISFIED").map((judgment) => judgment.propertyId),
    ),
  );
  for (const propertyId of ABSOLUTE_PROPERTY_IDS) assert.equal(satisfied.has(propertyId), true, propertyId);
});

test("P13 through P18 produce adjudication mechanics without a score or threshold", () => {
  const adjudicated = new Set(
    [...results.values()].flatMap((result) =>
      result.propertyJudgments.filter((judgment) => judgment.judgment === "ADJUDICATION_REQUIRED").map((judgment) => judgment.propertyId),
    ),
  );
  assert.equal(STATISTICAL_PROPERTY_IDS.length, 6);
  for (const propertyId of STATISTICAL_PROPERTY_IDS) assert.equal(adjudicated.has(propertyId), true, propertyId);
  for (const result of results.values()) {
    assert.equal(Object.hasOwn(result, "score"), false);
    assert.equal(Object.hasOwn(result, "threshold"), false);
  }
});

test("first cause is explicit and downstream findings remain distinguishable", () => {
  const failing = [...results.values()].filter((result) => result.disposition === "SEMANTIC_FAILURE");
  assert.equal(failing.length, 12);
  for (const result of failing) {
    assert.ok(result.firstCause);
    assert.equal(result.firstCause.isFirstCause, true);
    assert.equal(result.findings.filter((finding) => finding.isFirstCause).length, 1);
    for (const finding of result.findings.slice(1)) assert.equal(finding.downstreamOf, result.firstCause.findingId);
  }
});

test("provider, safe fail-closed, and not-evaluable dispositions remain separate", () => {
  const dispositions = new Set([...results.values()].map((result) => result.disposition));
  assert.equal(dispositions.has("PROVIDER_EXECUTION_FAILURE"), true);
  assert.equal(dispositions.has("SAFE_FAIL_CLOSED"), true);
  assert.equal(dispositions.has("NOT_EVALUABLE"), true);
  const provider = [...results.values()].find((result) => result.disposition === "PROVIDER_EXECUTION_FAILURE");
  assert.equal(provider.findings.some((finding) => finding.failureClass === "PROVIDER_EXECUTION_FAILURE"), true);
});

test("the evaluator recognizes exactly the admitted 18 properties", () => {
  assert.equal(PROPERTY_ORDER.length, 18);
  for (const result of results.values()) assert.equal(result.propertyJudgments.length, 18);
});

test("the complete offline validator passes with generated artifacts unchanged", () => {
  const validation = validateEvaluatorDevelopment();
  assert.equal(validation.valid, true);
  assert.equal(validation.syntheticCandidates, 41);
  assert.equal(validation.calibrationContentTuning, "NO");
});
