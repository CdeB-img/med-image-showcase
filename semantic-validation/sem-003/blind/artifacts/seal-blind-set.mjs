import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BLIND_SET_ID,
  BLIND_SET_VERSION,
  CREATED_AT,
  P,
  blindCaseSpecs,
} from "../authoring/blind-authoring-source.mjs";

const ARTIFACTS_ROOT = path.dirname(fileURLToPath(import.meta.url));
const BLIND_ROOT = path.dirname(ARTIFACTS_ROOT);
const INPUT_ROOT = path.join(BLIND_ROOT, "input");
const REFERENCE_ROOT = path.join(BLIND_ROOT, "sealed-reference");
const REVIEW_ROOT = path.join(BLIND_ROOT, "review");
const COVERAGE_ROOT = path.join(BLIND_ROOT, "coverage");
const REGISTRY_ROOT = path.join(BLIND_ROOT, "registry");
const SEALED_AT = "2026-08-14T12:00:00.000Z";
const CONSTRUCTION_BASELINE_COMMIT = "38039f4220773f7265be60873e5c0fa680acc63e";
const EVALUATOR_VERSION = "1.1.0";
const EVALUATOR_DIGEST = "b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd";

const readJson = (target) => JSON.parse(fs.readFileSync(target, "utf8"));
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const writeJson = (target, value) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, serialize(value), "utf8");
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sha256File = (target) => sha256(fs.readFileSync(target));
const relative = (target) => path.relative(BLIND_ROOT, target).split(path.sep).join("/");
const filesWithSuffix = (directory, suffix) => fs
  .readdirSync(directory)
  .filter((entry) => entry.endsWith(suffix))
  .sort()
  .map((entry) => path.join(directory, entry));
const digestEntries = (files) => files.map((target) => ({
  path: relative(target),
  sha256: sha256File(target),
}));
const packageDigest = (entries) => sha256(JSON.stringify(entries));

const evaluatorIdentity = readJson(path.resolve(BLIND_ROOT, "../evaluator/registry/evaluator-identity.json"));
if (evaluatorIdentity.version !== EVALUATOR_VERSION || evaluatorIdentity.configurationDigest !== EVALUATOR_DIGEST) {
  throw new Error("EVALUATOR_IDENTITY_DRIFT");
}

const existingManifestPath = path.join(ARTIFACTS_ROOT, "blind-set-manifest.json");
if (fs.existsSync(existingManifestPath)) {
  if (process.argv.includes("--check")) {
    console.log("Blind set already sealed; use the deterministic validator for full verification.");
    process.exit(0);
  }
  throw new Error("IMMUTABLE_BLIND_SET: blind-set-manifest.json already exists");
}

const caseFiles = filesWithSuffix(path.join(REFERENCE_ROOT, "cases"), ".case.json");
const envelopeFiles = filesWithSuffix(path.join(REFERENCE_ROOT, "envelopes"), ".envelope.json");
const inputFiles = filesWithSuffix(path.join(INPUT_ROOT, "cases"), ".input.json");
if (caseFiles.length !== 15 || envelopeFiles.length !== 15 || inputFiles.length !== 15) {
  throw new Error("BLIND_PACKAGE_COUNT_INVALID");
}

for (const casePath of caseFiles) {
  const benchmarkCase = readJson(casePath);
  if (
    benchmarkCase.reviewStatus !== "SIMULATED_REFERENCE_REVIEW_COMPLETE" ||
    benchmarkCase.exposure.parentageStatus !== "BLIND_PARENTAGE_CLEAR" ||
    benchmarkCase.exposure.contaminationReview.status !== "CLEAR" ||
    benchmarkCase.exposure.eligibleForBlindQualification !== true
  ) {
    throw new Error(`BLIND_SEAL_GATE_OPEN: ${benchmarkCase.caseId}`);
  }
  benchmarkCase.exposure.exposureStatus = "BLIND_SEALED";
  benchmarkCase.exposure.exposureHistory.push({
    eventId: `exposure-${benchmarkCase.caseId.toLowerCase()}-sealed`,
    fromStatus: "BLIND_DESIGN_ONLY",
    toStatus: "BLIND_SEALED",
    occurredAt: SEALED_AT,
    actorRole: "NOXIA_PROJECT_GOVERNANCE_SEALING_OPERATION",
    reason: "All SEM-003C structural, reference, parentage and anti-leakage gates completed before any SEM output.",
  });
  writeJson(casePath, benchmarkCase);
}

const cases = caseFiles.map(readJson);
const envelopes = envelopeFiles.map(readJson);
const caseById = new Map(cases.map((entry) => [entry.caseId, entry]));
const envelopeByCaseId = new Map(envelopes.map((entry) => [entry.caseId, entry]));
const inputByCaseId = new Map(inputFiles.map((target) => {
  const input = readJson(target);
  return [input.caseId, { input, target }];
}));

const domainGroups = {};
const categories = {};
const propertyCoverage = Object.fromEntries(Object.values(P).map((propertyId) => [propertyId, 0]));
const turnCounts = {};
let multiTurnCases = 0;
for (const benchmarkCase of cases) {
  domainGroups[benchmarkCase.scientificScope.domainGroup] = (domainGroups[benchmarkCase.scientificScope.domainGroup] || 0) + 1;
  categories[benchmarkCase.scientificScope.scenarioCategory] = (categories[benchmarkCase.scientificScope.scenarioCategory] || 0) + 1;
  const turnCount = benchmarkCase.source.conversationTurns.length;
  turnCounts[turnCount] = (turnCounts[turnCount] || 0) + 1;
  if (turnCount > 1) multiTurnCases += 1;
  for (const propertyId of benchmarkCase.reference.applicableSEM002Properties) propertyCoverage[propertyId] += 1;
}

const coverage = {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_BLIND_COVERAGE_MATRIX",
  blindSetId: BLIND_SET_ID,
  blindSetVersion: BLIND_SET_VERSION,
  caseCount: cases.length,
  domainGroups,
  domainPercentages: Object.fromEntries(Object.entries(domainGroups).map(([key, value]) => [key, Number(((value / cases.length) * 100).toFixed(2))])),
  scenarioCategoryCoverage: categories,
  scenarioCategoriesCovered: Object.keys(categories).length,
  conversationStructure: {
    turnCounts,
    singleTurnCases: cases.length - multiTurnCases,
    multiTurnCases,
    multiTurnPercentage: Number(((multiTurnCases / cases.length) * 100).toFixed(2)),
    threeToFiveTurnsInclusive: cases.filter((entry) => entry.source.conversationTurns.length >= 3 && entry.source.conversationTurns.length <= 5).length,
    fiveToEightTurnsInclusive: cases.filter((entry) => entry.source.conversationTurns.length >= 5 && entry.source.conversationTurns.length <= 8).length,
    eightOrMoreTurns: cases.filter((entry) => entry.source.conversationTurns.length >= 8).length,
    genuineHistoryDependenceDeclared: cases.filter((entry) => entry.source.conversationTurns.length > 1).map((entry) => entry.caseId),
  },
  propertyCoverage,
  p01ToP12CoverageIsAbsoluteAndNonCompensable: true,
  p13ToP18Thresholds: "UNRESOLVED_FOR_FINAL_PD011_DECISION",
  aggregateScore: null,
  compositeMetric: false,
};
writeJson(path.join(COVERAGE_ROOT, "blind-coverage-matrix.json"), coverage);

const parentageReviewPath = path.join(REVIEW_ROOT, "blind-parentage-review.json");
const referenceReviewPath = path.join(REVIEW_ROOT, "blind-reference-review.json");
const inputEntries = digestEntries(inputFiles);
const referenceEntries = digestEntries([...caseFiles, ...envelopeFiles, parentageReviewPath, referenceReviewPath]);
const inputPackageDigest = packageDigest(inputEntries);
const referencePackageDigest = packageDigest(referenceEntries);

const registryEntries = cases.map((benchmarkCase) => {
  const envelope = envelopeByCaseId.get(benchmarkCase.caseId);
  const inputRecord = inputByCaseId.get(benchmarkCase.caseId);
  const fileSlug = path.basename(inputRecord.target, ".input.json");
  const casePath = path.join(REFERENCE_ROOT, "cases", `${fileSlug}.case.json`);
  const envelopePath = path.join(REFERENCE_ROOT, "envelopes", `${fileSlug}.envelope.json`);
  const caseDigest = sha256File(casePath);
  const envelopeDigest = sha256File(envelopePath);
  return {
    caseId: benchmarkCase.caseId,
    version: benchmarkCase.version,
    exposureStatus: "BLIND_SEALED",
    parentageStatus: "BLIND_PARENTAGE_CLEAR",
    qualificationStatus: "NOT_YET_EXECUTED",
    input: { path: relative(inputRecord.target), sha256: sha256File(inputRecord.target) },
    reference: {
      casePath: relative(casePath),
      caseSha256: caseDigest,
      envelopeId: envelope.envelopeId,
      envelopeVersion: envelope.version,
      envelopePath: relative(envelopePath),
      envelopeSha256: envelopeDigest,
      referencePairSha256: sha256(`${caseDigest}:${envelopeDigest}`),
    },
    simulatedReferenceReview: "COMPLETE_NOT_HUMAN",
    realHumanReferenceReview: "NOT_PERFORMED",
    finalPD011ReferenceEligibility: "NO",
  };
});

writeJson(path.join(REGISTRY_ROOT, "blind-registry.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_BLIND_REGISTRY",
  blindSetId: BLIND_SET_ID,
  version: BLIND_SET_VERSION,
  exposureStatus: "BLIND_SEALED",
  immutableAfterSeal: true,
  entries: registryEntries,
});

writeJson(path.join(ARTIFACTS_ROOT, "blind-input-manifest.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_BLIND_INPUT_MANIFEST",
  blindSetId: BLIND_SET_ID,
  version: BLIND_SET_VERSION,
  runtimeInjectionAllowlistRoot: "input/",
  containsAcceptanceEnvelopes: false,
  containsReferenceJudgments: false,
  containsSEMResults: false,
  files: inputEntries,
  inputPackageDigest,
});

writeJson(path.join(ARTIFACTS_ROOT, "sealed-reference-manifest.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_SEALED_REFERENCE_MANIFEST",
  blindSetId: BLIND_SET_ID,
  version: BLIND_SET_VERSION,
  sealedAt: SEALED_AT,
  runtimeAccess: "DENIED",
  files: referenceEntries,
  referencePackageDigest,
  reviewBasis: "SIMULATED_PLURALISTIC_REFERENCE_REVIEW_BEFORE_SEM_OUTPUT",
  realHumanReferenceReview: "NOT_PERFORMED",
  finalPD011ReferenceEligibility: "NO",
});

writeJson(path.join(ARTIFACTS_ROOT, "anti-leakage-audit.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_ANTI_LEAKAGE_AUDIT",
  auditedAt: SEALED_AT,
  semOutputUsedForAuthoring: false,
  providerOrLLMCalled: false,
  developmentOrCalibrationFixtureCopied: false,
  goldFrameCreated: false,
  blindReferencesPresentInRuntimeInputPackage: false,
  runtimeInjectionAllowlist: ["input/cases/*.input.json", "artifacts/blind-input-manifest.json"],
  runtimeReferenceDenylist: ["sealed-reference/**", "review/**", "registry/**", "coverage/**"],
  storageBoundary: "LOGICAL_AND_PATH_SEPARATION_IN_CANONICAL_GIT_REPOSITORY",
  confidentialityLimitation: "Repository access control remains an external operational responsibility; a digest proves identity and immutability, not confidentiality.",
  operationalRequirement: "SEM-003D must inject only the input package and must not mount or expose the sealed-reference package to SEM or the campaign operator.",
  result: "PASS_WITH_DECLARED_STORAGE_LIMITATION",
});

writeJson(path.join(ARTIFACTS_ROOT, "sem003d-execution-preparation.json"), {
  schemaVersion: "1.0.0",
  contractType: "SEM003D_EXECUTION_PREPARATION_ONLY",
  status: "PREPARED_NOT_EXECUTED",
  execute: false,
  nextMission: "SEM-003D — Qualification of Frozen SEM Against Sealed Blind Set",
  blindSetId: BLIND_SET_ID,
  blindSetVersion: BLIND_SET_VERSION,
  evaluator: { version: EVALUATOR_VERSION, configurationDigest: EVALUATOR_DIGEST },
  semConfiguration: "MUST_BE_FROZEN_AND_DIGESTED_IN_SEM003D",
  providerModelPromptsSchemas: "MUST_BE_FROZEN_AND_DIGESTED_IN_SEM003D",
  repetitions: "MUST_USE_PD011_PRECOMMITTED_VALUE; NOT_SET_BY_SEM003C",
  p13ToP18FinalDecision: "UNRESOLVED_FOR_FINAL_PD011_DECISION",
  thresholds: "NO_NEW_THRESHOLD_CREATED_BY_SEM003C",
  rules: [
    "No SEM modification during blind execution.",
    "No reference access by SEM or the campaign operator.",
    "No best-run selection and no silent exclusion.",
    "All provider, non-evaluable and semantic outcomes remain visible.",
    "No repair or reference amendment during the campaign.",
  ],
});

const coveragePath = path.join(COVERAGE_ROOT, "blind-coverage-matrix.json");
const parentageDigest = sha256File(parentageReviewPath);
const referenceReviewDigest = sha256File(referenceReviewPath);
const coverageDigest = sha256File(coveragePath);
const caseManifestEntries = registryEntries.map((entry) => ({
  caseId: entry.caseId,
  version: entry.version,
  inputDigest: entry.input.sha256,
  caseDigest: entry.reference.caseSha256,
  envelopeDigest: entry.reference.envelopeSha256,
  referenceDigest: entry.reference.referencePairSha256,
  reviewDigest: referenceReviewDigest,
  parentageStatus: entry.parentageStatus,
}));

writeJson(existingManifestPath, {
  schemaVersion: "1.0.0",
  contractType: "SEM003C_BLIND_SET_MANIFEST",
  blindSetId: BLIND_SET_ID,
  version: BLIND_SET_VERSION,
  createdAt: CREATED_AT,
  sealedAt: SEALED_AT,
  git: {
    branch: "main",
    constructionBaselineCommit: CONSTRUCTION_BASELINE_COMMIT,
    sealCommitIdentity: "RECORDED_BY_THE_GIT_COMMIT_CONTAINING_THIS_MANIFEST",
  },
  cases: caseManifestEntries,
  referenceReviewDigest,
  parentageReviewDigest: parentageDigest,
  coverageDigest,
  inputPackageDigest,
  referencePackageDigest,
  evaluatorTarget: { version: EVALUATOR_VERSION, configurationDigest: EVALUATOR_DIGEST },
  qualificationStatus: "NOT_YET_EXECUTED",
  sealStatus: "SEALED_FOR_SEM003D",
  exposureStatus: "BLIND_SEALED",
  immutableAfterSeal: true,
  allSealGatesGreen: true,
  realHumanReferenceReview: "NOT_PERFORMED",
  finalPD011ReferenceEligibility: "NO",
});

console.log(`Sealed ${blindCaseSpecs.length} independent blind cases for SEM-003D.`);

