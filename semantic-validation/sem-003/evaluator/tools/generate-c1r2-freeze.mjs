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
  "sem003c1r2-comparative-evaluator-binding.json",
);
const FREEZE_PATH = path.resolve(
  REGISTRY_ROOT,
  "evaluator-post-c1r2-freeze-manifest.json",
);
const C1_ROOT = path.resolve(REPOSITORY_ROOT, "experiments/semantic-engine-comparison");
const C1_FREEZE_PATH = path.resolve(C1_ROOT, "manifests/freeze-index.json");
const C1R_BINDING_PATH = path.resolve(
  REGISTRY_ROOT,
  "sem003c1r-comparative-evaluator-binding.json",
);
const C1R_FREEZE_PATH = path.resolve(
  REGISTRY_ROOT,
  "evaluator-post-c1r-freeze-manifest.json",
);
const DEVELOPMENT_FIXTURE_ROOT = path.resolve(EVALUATOR_ROOT, "fixtures/development");
const BLIND_CASE_SCHEMA_PATH = path.resolve(
  REPOSITORY_ROOT,
  "semantic-validation/sem-003/blind/contracts/blind-case.schema.json",
);
const BLIND_ENVELOPE_SCHEMA_PATH = path.resolve(
  REPOSITORY_ROOT,
  "semantic-validation/sem-003/blind/contracts/blind-acceptance-envelope.schema.json",
);
const CHECK_ONLY = process.argv.includes("--check");
const CREATED_AT = "2026-08-14T18:00:00.000+02:00";
const BLIND_PURPOSE = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION";
const HISTORICAL_C1R_FREEZE_DIGEST =
  "9d8a8d46111aa3f442f5975c9aaede5a0c807d64ea3a9da2f3363b2e4bb7725e";
const HISTORICAL_C1R_BINDING_DIGEST =
  "b7444f90622992286ef21c425c26142a517a7c6e33c2bd66cd4e3f136dad4279";

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
if (identity.version !== "1.3.0") {
  throw new Error(`C1R2 requires Evaluator 1.3.0, got ${identity.version}`);
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
if (
  sha256File(C1R_FREEZE_PATH) !== HISTORICAL_C1R_FREEZE_DIGEST ||
  sha256File(C1R_BINDING_PATH) !== HISTORICAL_C1R_BINDING_DIGEST
) {
  throw new Error("The historical SEM-003C1R freeze or binding changed");
}
const c1rBinding = JSON.parse(fs.readFileSync(C1R_BINDING_PATH, "utf8"));

const binding = {
  schemaVersion: "1.0.0",
  contractType: "SEM003C1R2_COMPARATIVE_EVALUATOR_BINDING",
  bindingId: "SEM003C1R2-COMMON-BLIND-EVALUATOR-BINDING-01",
  status: "FROZEN_PRE_BLIND_EXECUTION",
  sourceComparativeFreeze: {
    freezeId: c1Freeze.freezeId,
    freezeDigest: c1Freeze.freezeDigest,
    baselineIds: c1Freeze.baselineManifests.map((entry) => entry.baselineId),
  },
  supersedesBinding: {
    bindingId: c1rBinding.bindingId,
    digest: HISTORICAL_C1R_BINDING_DIGEST,
    evaluatorVersion: c1rBinding.evaluator.version,
    reason: "BLIND_REFERENCE_BINDING_CONTRACT_INCOMPLETE",
  },
  evaluator: {
    version: identity.version,
    configurationDigest: identity.configurationDigest,
  },
  evaluationMode: "FUTURE_SEM_RUNTIME",
  benchmarkSet: "BLIND",
  referenceBinding: {
    caseContractType: "SEM003C_BLIND_BENCHMARK_CASE",
    casePurpose: "BLIND_QUALIFICATION_AUTHORING",
    exposureStatus: "BLIND_SEALED",
    eligibleForBlindQualification: true,
    envelopeContractType: "SEM003C_BLIND_ACCEPTANCE_ENVELOPE",
    identityRule: "GENERIC_CONTRACT_IDENTITY_NO_CASE_PREFIX_RULE",
  },
  candidateBinding: {
    purpose: BLIND_PURPOSE,
    sourceType: "FUTURE_SEM_RUNTIME_OUTPUT",
    schemaVersion: "1.3.0",
  },
  appliesUniformlyToAllBaselines: true,
  baselineCodeOrConfigurationChanged: false,
  semanticAdapterChanged: false,
  baselineManifestsRegenerated: false,
  blindCasesChanged: false,
  acceptanceEnvelopesChanged: false,
  blindContentAccessed: false,
  sealedReferenceContentAccessed: false,
  blindExecuted: false,
  providerCalls: 0,
  createdAt: CREATED_AT,
};
assertOrWrite(BINDING_PATH, binding, "SEM-003C1R2 comparative binding");

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
  contractType: "SEM003_EVALUATOR_POST_C1R2_FREEZE_MANIFEST",
  freezeId: "SEM003C1R2-EVALUATOR-FREEZE-01",
  evaluatorVersion: identity.version,
  previousEvaluatorVersion: "1.2.0",
  configurationDigest: identity.configurationDigest,
  previousConfigurationDigest: c1rBinding.evaluator.configurationDigest,
  codeDigest: collectionDigest(codeFiles),
  schemasDigest: collectionDigest(schemaFiles),
  sourceBlindContractDigests: {
    caseSchema: sha256File(BLIND_CASE_SCHEMA_PATH),
    acceptanceEnvelopeSchema: sha256File(BLIND_ENVELOPE_SCHEMA_PATH),
  },
  propertyRegistryDigest: sha256File(
    path.resolve(REGISTRY_ROOT, "property-registry.json"),
  ),
  failureTaxonomyDigest: sha256File(
    path.resolve(REGISTRY_ROOT, "failure-disposition-registry.json"),
  ),
  supportedModes: candidateSchema.definitions.evaluationMode.enum,
  supportedPurposes: candidateSchema.properties.purpose.enum,
  benchmarkSet: "BLIND",
  blindQualificationPurpose: BLIND_PURPOSE,
  developmentFixtureCount: developmentFixtureFiles.length,
  developmentFixturesDigest: collectionDigest(developmentFixtureFiles),
  c1r2ContractTestsDigest: sha256File(path.resolve(EVALUATOR_ROOT, "c1r2.test.mjs")),
  historicalC1RFreezeDigest: HISTORICAL_C1R_FREEZE_DIGEST,
  historicalC1RBindingDigest: HISTORICAL_C1R_BINDING_DIGEST,
  comparativeBindingDigest: sha256File(BINDING_PATH),
  protectedComparativeArtifacts: {
    fileCount: protectedComparativeFiles.length,
    digest: collectionDigest(protectedComparativeFiles),
    originalFreezeDigest: c1Freeze.freezeDigest,
    baselineCount: c1Freeze.baselineCount,
  },
  blockingClassification: "BLIND_REFERENCE_BINDING_CONTRACT_INCOMPLETE",
  changeClassification: "ADDITIVE_GENERIC_BLIND_REFERENCE_BINDING_REPAIR",
  propertiesP01ToP18Changed: false,
  failureClassesChanged: false,
  dispositionsChanged: false,
  level1RulesChanged: false,
  level2RulesChanged: false,
  thresholdsChanged: false,
  semChanged: false,
  acceptanceEnvelopesChanged: false,
  blindCasesChanged: false,
  baselineCodeOrConfigurationChanged: false,
  semanticAdaptersChanged: false,
  blindContentAccessed: false,
  sealedReferenceContentAccessed: false,
  blindOutputRead: false,
  blindExecuted: false,
  providerCalls: 0,
  decision: "SEM003C1R2_BLIND_REFERENCE_BINDING_READY",
  next: "SEM-003D-COMP — Common Blind Comparative Qualification Campaign in a new clean worktree state",
  createdAt: CREATED_AT,
};
if (manifest.developmentFixtureCount !== 41) {
  throw new Error(`Expected 41 Development fixtures, got ${manifest.developmentFixtureCount}`);
}
if (
  manifest.developmentFixturesDigest !==
  "b50a7f795fea663d911edf7f6334e8dc9ab2ba4334ceceee1a2f57f7a8f3e420"
) {
  throw new Error("Development fixtures changed");
}
if (
  manifest.protectedComparativeArtifacts.digest !==
  "e7262acbdfdbd7100f85c1e442e64f8698ca9b93b43fceda6407be80885f4d28"
) {
  throw new Error("Protected SEM-003C1 comparative artifacts changed");
}
assertOrWrite(FREEZE_PATH, manifest, "SEM-003C1R2 evaluator freeze manifest");

process.stdout.write(
  `SEM-003C1R2 freeze ${CHECK_ONLY ? "verified" : "generated"}: Evaluator ${identity.version} ${identity.configurationDigest}\n`,
);
