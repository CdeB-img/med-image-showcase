import { readFileSync } from "node:fs";

import { evaluateScientificUnderstanding } from "../../../semantic-validation/sem-003/evaluator/core/evaluator.mjs";

const input = JSON.parse(readFileSync(0, "utf8"));
const result = evaluateScientificUnderstanding(input);
process.stdout.write(`${JSON.stringify(result)}\n`);
