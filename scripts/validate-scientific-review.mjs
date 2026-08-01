import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { validateAutomatedScientificReview } from "../src/knowledge-graph/scientific-consolidation/validate.mjs";

const result = validateAutomatedScientificReview();
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;

