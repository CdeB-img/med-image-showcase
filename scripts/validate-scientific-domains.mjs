import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { validateScientificDomains } from "../src/knowledge-graph/scientific-multidomain/validate.mjs";

const result = validateScientificDomains();
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;

