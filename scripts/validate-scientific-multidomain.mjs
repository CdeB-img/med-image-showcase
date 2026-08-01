import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { validateScientificMultidomain } from "../src/knowledge-graph/scientific-multidomain/validate.mjs";

const result = validateScientificMultidomain();
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;

