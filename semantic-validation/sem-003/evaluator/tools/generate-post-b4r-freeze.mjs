import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeEvaluatorIdentity } from "../core/versioning.mjs";

const TOOL_ROOT = path.dirname(fileURLToPath(import.meta.url));
const EVALUATOR_ROOT = path.resolve(TOOL_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(EVALUATOR_ROOT, "../../..");
const OUTPUT_PATH = path.resolve(
  EVALUATOR_ROOT,
  "registry/evaluator-post-b4r-freeze-manifest.json",
);
const CHECK_ONLY = process.argv.includes("--check");
const CREATED_AT = "2026-08-13T21:42:33.000Z";

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

const identity = computeEvaluatorIdentity();
if (
  identity.version !== "1.1.0" ||
  identity.configurationDigest !==
    "b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd"
) {
  throw new Error(
    "The post-B4R freeze is historical and cannot be regenerated from a successor Evaluator identity",
  );
}
const recordedIdentity = JSON.parse(
  fs.readFileSync(path.resolve(EVALUATOR_ROOT, "registry/evaluator-identity.json"), "utf8"),
);
if (stableJson(identity) !== stableJson(recordedIdentity)) {
  throw new Error("Cannot freeze a stale evaluator identity");
}

const codeFiles = filesUnder(path.resolve(EVALUATOR_ROOT, "core"), (filePath) =>
  filePath.endsWith(".mjs"),
);
const schemaFiles = filesUnder(
  path.resolve(EVALUATOR_ROOT, "contracts"),
  (filePath) => filePath.endsWith(".json"),
);
const developmentProofFiles = [
  path.resolve(EVALUATOR_ROOT, "evaluator.test.mjs"),
  path.resolve(EVALUATOR_ROOT, "b4r.test.mjs"),
  path.resolve(EVALUATOR_ROOT, "artifacts/test-matrix.json"),
  ...filesUnder(path.resolve(EVALUATOR_ROOT, "fixtures/development"), (filePath) =>
    filePath.endsWith(".json"),
  ),
];
const propertyRegistryPath = path.resolve(
  EVALUATOR_ROOT,
  "registry/property-registry.json",
);
const failureTaxonomyPath = path.resolve(
  EVALUATOR_ROOT,
  "registry/failure-disposition-registry.json",
);
const capabilityMatrixPath = path.resolve(
  EVALUATOR_ROOT,
  "registry/adjudication-authority-capabilities.json",
);
const b3EquivalencePath = path.resolve(
  EVALUATOR_ROOT,
  "../review/artifacts/equivalence-review-status.json",
);
const antiOverfittingPath = path.resolve(
  EVALUATOR_ROOT,
  "artifacts/b4r-anti-overfitting-audit.json",
);
const candidateSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(EVALUATOR_ROOT, "contracts/candidate-semantic-representation.schema.json"),
    "utf8",
  ),
);
const capabilityMatrix = JSON.parse(fs.readFileSync(capabilityMatrixPath, "utf8"));

const manifest = {
  schemaVersion: "1.0.0",
  contractType: "SEM003_EVALUATOR_POST_B4R_FREEZE_MANIFEST",
  evaluatorVersion: identity.version,
  previousEvaluatorVersion: "1.0.0",
  configurationDigest: identity.configurationDigest,
  previousConfigurationDigest:
    "13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5",
  codeDigest: collectionDigest(codeFiles),
  schemasDigest: collectionDigest(schemaFiles),
  propertyRegistryDigest: sha256File(propertyRegistryPath),
  failureTaxonomyDigest: sha256File(failureTaxonomyPath),
  adjudicationAuthorityCapabilitiesDigest: sha256File(capabilityMatrixPath),
  supportedModes: candidateSchema.definitions.evaluationMode.enum,
  supportedAdjudicationAuthorities: capabilityMatrix.authorities.map(
    (entry) => entry.authorityClass,
  ),
  developmentTestsDigest: collectionDigest(developmentProofFiles),
  B3EquivalenceDecisionSetDigest: sha256File(b3EquivalencePath),
  antiOverfittingAuditDigest: sha256File(antiOverfittingPath),
  calibrationScientificContentAccessed: false,
  calibrationExecuted: false,
  semExecuted: false,
  llmProviderCalls: 0,
  blindCreated: false,
  thresholdOrNIntroduced: false,
  restartRule:
    "SEM-003B4 must restart from this identity before any Calibration fixture, expectation, or result is created.",
  createdAt: CREATED_AT,
};

const serialized = stableJson(manifest);
if (CHECK_ONLY) {
  if (!fs.existsSync(OUTPUT_PATH) || fs.readFileSync(OUTPUT_PATH, "utf8") !== serialized) {
    throw new Error("SEM-003 post-B4R freeze manifest is stale");
  }
} else {
  fs.writeFileSync(OUTPUT_PATH, serialized);
}

process.stdout.write(
  `SEM-003 evaluator post-B4R freeze ${CHECK_ONLY ? "verified" : "generated"}: ${manifest.evaluatorVersion} ${manifest.configurationDigest}\n`,
);
