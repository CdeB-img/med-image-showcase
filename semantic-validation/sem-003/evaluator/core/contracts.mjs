import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const CORE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTRACT_ROOT = path.resolve(CORE_ROOT, "../contracts");

const readJson = (fileName) =>
  JSON.parse(fs.readFileSync(path.join(CONTRACT_ROOT, fileName), "utf8"));

const schemas = Object.freeze({
  candidate: readJson("candidate-semantic-representation.schema.json"),
  propertyJudgment: readJson("property-judgment.schema.json"),
  adjudicationPacket: readJson("adjudication-packet.schema.json"),
  humanDecisionRecord: readJson("human-decision-record.schema.json"),
  evaluationInput: readJson("evaluation-input.schema.json"),
  evaluationResult: readJson("evaluation-result.schema.json"),
});

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
  schemaId: "auto",
});

for (const schema of Object.values(schemas)) ajv.addSchema(schema);

const validators = Object.freeze(
  Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, ajv.getSchema(schema.$id)]),
  ),
);

const formatErrors = (errors = []) =>
  errors.map((entry) => ({
    path: entry.dataPath || "/",
    keyword: entry.keyword,
    message: entry.message || "schema validation failed",
  }));

export const validateContract = (contractName, value) => {
  const validator = validators[contractName];
  if (!validator) throw new Error(`Unknown evaluator contract: ${contractName}`);
  const valid = validator(value);
  return {
    valid: Boolean(valid),
    errors: valid ? [] : formatErrors(validator.errors),
  };
};

export const assertContract = (contractName, value) => {
  const result = validateContract(contractName, value);
  if (!result.valid) {
    const error = new Error(`${contractName} contract invalid`);
    error.code = "EVALUATOR_CONTRACT_INVALID";
    error.contractName = contractName;
    error.validationErrors = result.errors;
    throw error;
  }
  return value;
};

export const EVALUATOR_CONTRACT_SCHEMAS = schemas;
