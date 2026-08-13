import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { computeEvaluatorIdentity } from "../core/versioning.mjs";

const TOOL_ROOT = path.dirname(fileURLToPath(import.meta.url));
const EVALUATOR_ROOT = path.resolve(TOOL_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(EVALUATOR_ROOT, "../../..");
const REGISTRY_ROOT = path.resolve(EVALUATOR_ROOT, "registry");
const IDENTITY_PATH = path.resolve(REGISTRY_ROOT, "evaluator-identity.json");
const BINDING_PATH = path.resolve(
  REGISTRY_ROOT,
  "sem003c1r-comparative-evaluator-binding.json",
);
const FREEZE_PATH = path.resolve(
  REGISTRY_ROOT,
  "evaluator-post-c1r-freeze-manifest.json",
);
const C1_ROOT = path.resolve(REPOSITORY_ROOT, "experiments/semantic-engine-comparison");
const C1_FREEZE_PATH = path.resolve(C1_ROOT, "manifests/freeze-index.json");
const POST_B4R_FREEZE_PATH = path.resolve(
  REGISTRY_ROOT,
  "evaluator-post-b4r-freeze-manifest.json",
);
const DEVELOPMENT_FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const CHECK_ONLY = process.argv.includes("--check");
const CREATED_AT = "2026-08-14T12:00:00.000+02:00";
const BLIND_PURPOSE = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION";

const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sha256File = (filePath) => sha256(fs.readFileSync(filePath));
const relative = (filePath) => path.relative(REPOSITORY_ROOT, filePath);

const filesUnder = (root, predicate = () => true) =>
  fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const filePath = path.resolve(root, entry.name);
      return entry.isDirectory() ? filesUnder(filePath, predicate) : [filePath];
    })
    .filter(predicate)
    .sort((left, right) => relative(left).localeCompare(relative(right)));

const collectionDigest = (files) =>
  sha256(
    stableJson(
      files.map((filePath) => ({
        path: relative(filePath),
        sha256: sha256File(filePath),
      })),
    ),
  );

const trackedFiles = (paths) => {
  const output = execFileSync("git", ["ls-files", "-z", "--", ...paths], {
    cwd: REPOSITORY_ROOT,
  }).toString("utf8");
  return output
    .split("\0")
    .filter(Boolean)
    .map((entry) => path.resolve(REPOSITORY_ROOT, entry))
    .sort((left, right) => relative(left).localeCompare(relative(right)));
};

const assertOrWrite = (filePath, value, label) => {
  const serialized = stableJson(value);
  if (CHECK_ONLY) {
    if (!fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8") !== serialized) {
      throw new Error(`${label} is stale`);
    }
  } else {
    fs.writeFileSync(filePath, serialized);
  }
};

const identity = computeEvaluatorIdentity();
if (identity.version !== "1.2.0") {
  throw new Error(`C1R requires Evaluator 1.2.0, got ${identity.version}`);
}
assertOrWrite(IDENTITY_PATH, identity, "Evaluator identity");

const c1Freeze = JSON.parse(fs.readFileSync(C1_FREEZE_PATH, "utf8"));
if (
  c1Freeze.freezeDigest !==
    "6373b7b04838e75582048becb2efdf075b644740f1d3f6bbb381809ecdc010f1" ||
  c1Freeze.baselineCount !== 6 ||
  c1Freeze.targetEvaluator.version !== "1.1.0"
) {
  throw new Error("The original SEM-003C1 comparative freeze changed");
}

const binding = {
  schemaVersion: "1.0.0",
  contractType: "SEM003C1R_COMPARATIVE_EVALUATOR_BINDING",
  bindingId: "SEM003C1R-COMMON-BLIND-EVALUATOR-BINDING-01",
  status: "FROZEN_PRE_BLIND_EXECUTION",
  sourceComparativeFreeze: {
    freezeId: c1Freeze.freezeId,
    freezeDigest: c1Freeze.freezeDigest,
    previousEvaluatorVersion: c1Freeze.targetEvaluator.version,
    previousEvaluatorConfigurationDigest: c1Freeze.targetEvaluator.configurationDigest,
    baselineIds: c1Freeze.baselineManifests.map((entry) => entry.baselineId),
  },
  evaluator: {
    version: identity.version,
    configurationDigest: identity.configurationDigest,
  },
  evaluationMode: "FUTURE_SEM_RUNTIME",
  purpose: BLIND_PURPOSE,
  sourceType: "FUTURE_SEM_RUNTIME_OUTPUT",
  appliesUniformlyToAllBaselines: true,
  baselineCodeOrConfigurationChanged: false,
  semanticAdapterChanged: false,
  baselineManifestsRegenerated: false,
  blindAccessed: false,
  sealedReferenceAccessed: false,
  blindExecuted: false,
  providerCalls: 0,
  createdAt: CREATED_AT,
};
assertOrWrite(BINDING_PATH, binding, "SEM-003C1R comparative binding");

const candidateSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(EVALUATOR_ROOT, "contracts/candidate-semantic-representation.schema.json"),
    "utf8",
  ),
);
const protectedComparativeFiles = trackedFiles([
  "experiments/semantic-engine-comparison/baselines",
  "experiments/semantic-engine-comparison/adapters",
  "experiments/semantic-engine-comparison/contracts",
  "experiments/semantic-engine-comparison/prompts",
  "experiments/semantic-engine-comparison/manifests",
  "experiments/requirements-experiments-lock.txt",
]);
const codeFiles = filesUnder(path.resolve(EVALUATOR_ROOT, "core"), (filePath) =>
  filePath.endsWith(".mjs"),
);
const schemaFiles = filesUnder(path.resolve(EVALUATOR_ROOT, "contracts"), (filePath) =>
  filePath.endsWith(".json"),
);
const developmentFixtureFiles = filesUnder(
  DEVELOPMENT_FIXTURE_ROOT,
  (filePath) => filePath.endsWith(".candidate.json"),
);

const manifest = {
  schemaVersion: "1.0.0",
  contractType: "SEM003_EVALUATOR_POST_C1R_FREEZE_MANIFEST",
  freezeId: "SEM003C1R-EVALUATOR-FREEZE-01",
  evaluatorVersion: identity.version,
  previousEvaluatorVersion: "1.1.0",
  configurationDigest: identity.configurationDigest,
  previousConfigurationDigest:
    "b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd",
  codeDigest: collectionDigest(codeFiles),
  schemasDigest: collectionDigest(schemaFiles),
  propertyRegistryDigest: sha256File(
    path.resolve(REGISTRY_ROOT, "property-registry.json"),
  ),
  failureTaxonomyDigest: sha256File(
    path.resolve(REGISTRY_ROOT, "failure-disposition-registry.json"),
  ),
  supportedModes: candidateSchema.definitions.evaluationMode.enum,
  supportedPurposes: candidateSchema.properties.purpose.enum,
  blindQualificationPurpose: BLIND_PURPOSE,
  developmentFixtureCount: developmentFixtureFiles.length,
  developmentFixturesDigest: collectionDigest(developmentFixtureFiles),
  c1rContractTestsDigest: sha256File(path.resolve(EVALUATOR_ROOT, "c1r.test.mjs")),
  historicalB4RFreezeDigest: sha256File(POST_B4R_FREEZE_PATH),
  comparativeBindingDigest: sha256File(BINDING_PATH),
  protectedComparativeArtifacts: {
    fileCount: protectedComparativeFiles.length,
    digest: collectionDigest(protectedComparativeFiles),
    originalFreezeDigest: c1Freeze.freezeDigest,
    baselineCount: c1Freeze.baselineCount,
  },
  changeClassification: "ADDITIVE_PURPOSE_AND_MODE_BINDING_REPAIR",
  propertiesP01ToP18Changed: false,
  failureClassesChanged: false,
  level1RulesChanged: false,
  level2RulesChanged: false,
  thresholdsChanged: false,
  acceptanceEnvelopesChanged: false,
  blindCasesChanged: false,
  baselineCodeOrConfigurationChanged: false,
  semanticAdaptersChanged: false,
  blindAccessed: false,
  sealedReferenceAccessed: false,
  blindExecuted: false,
  providerCalls: 0,
  decision: "SEM003C1R_BLIND_QUALIFICATION_CONTRACT_READY",
  next: "SEM-003D-COMP — Common Blind Comparative Qualification Campaign",
  createdAt: CREATED_AT,
};
if (manifest.developmentFixtureCount !== 41) {
  throw new Error(`Expected 41 Development fixtures, got ${manifest.developmentFixtureCount}`);
}
assertOrWrite(FREEZE_PATH, manifest, "SEM-003C1R evaluator freeze manifest");

process.stdout.write(
  `SEM-003C1R freeze ${CHECK_ONLY ? "verified" : "generated"}: Evaluator ${identity.version} ${identity.configurationDigest}\n`,
);
