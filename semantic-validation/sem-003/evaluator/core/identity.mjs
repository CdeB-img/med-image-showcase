import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SEM003_EVALUATOR_VERSION = "1.3.0";

const CORE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const IDENTITY_PATH = path.resolve(CORE_ROOT, "../registry/evaluator-identity.json");

export const loadEvaluatorIdentity = () => {
  const identity = JSON.parse(fs.readFileSync(IDENTITY_PATH, "utf8"));
  if (identity.version !== SEM003_EVALUATOR_VERSION) {
    throw new Error(
      `Evaluator identity version ${identity.version} does not match ${SEM003_EVALUATOR_VERSION}`,
    );
  }
  return identity;
};
