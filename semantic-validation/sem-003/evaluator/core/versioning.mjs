import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEM003_EVALUATOR_VERSION } from "./identity.mjs";

const CORE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const EVALUATOR_ROOT = path.resolve(CORE_ROOT, "..");
const REPOSITORY_ROOT = path.resolve(EVALUATOR_ROOT, "../../..");

const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sha256File = (filePath) => sha256(fs.readFileSync(filePath));
const relative = (filePath) => path.relative(REPOSITORY_ROOT, filePath);

export const evaluatorConfigurationFiles = () => {
  const roots = [
    path.resolve(EVALUATOR_ROOT, "contracts"),
    path.resolve(EVALUATOR_ROOT, "core"),
  ];
  const files = roots.flatMap((root) =>
    fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(root, entry.name)),
  );
  files.push(
    path.resolve(EVALUATOR_ROOT, "registry/property-registry.json"),
    path.resolve(EVALUATOR_ROOT, "registry/failure-disposition-registry.json"),
    path.resolve(EVALUATOR_ROOT, "registry/adjudication-authority-capabilities.json"),
    path.resolve(
      REPOSITORY_ROOT,
      "semantic-validation/sem-002/scientific-understanding-competence-contract.json",
    ),
    path.resolve(
      REPOSITORY_ROOT,
      "docs/sem-003-independent-scientific-understanding-benchmark-architecture.md",
    ),
    path.resolve(
      REPOSITORY_ROOT,
      "semantic-validation/sem-003/authoring/acceptance-envelope.schema.json",
    ),
  );
  return files.sort((left, right) => relative(left).localeCompare(relative(right)));
};

export const computeEvaluatorIdentity = () => {
  const files = evaluatorConfigurationFiles().map((filePath) => ({
    path: relative(filePath),
    sha256: sha256File(filePath),
  }));
  const authorityVersions = {
    SEM002: "1.0",
    SEM003: "1.0",
    acceptanceEnvelopeContract: "1.0.0",
    candidateSemanticRepresentationContract: "1.1.0",
    adjudicationContract: "1.1.0",
  };
  const configurationDigest = sha256(
    stableJson({
      version: SEM003_EVALUATOR_VERSION,
      authorityVersions,
      files,
    }),
  );
  return {
    schemaVersion: "1.0.0",
    contractType: "SEM003_EVALUATOR_IDENTITY",
    version: SEM003_EVALUATOR_VERSION,
    configurationDigest,
    authorityVersions,
    coveredComponents: [
      "evaluator core code",
      "seven evaluator schemas",
      "derived SEM-002 property registry",
      "normalized candidate contract",
      "adjudication contract",
      "adjudication authority capability matrix",
      "failure/disposition mapping",
      "SEM-002, SEM-003, and Acceptance Envelope contract versions",
    ],
    files,
  };
};
