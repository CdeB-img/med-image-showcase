import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { validateScientificGenerality } from "../src/knowledge-graph/scientific-consolidation/validate.mjs";

const result = validateScientificGenerality();
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;

