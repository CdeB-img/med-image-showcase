import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { validateConsolidatedScientificSources } from "../src/knowledge-graph/scientific-consolidation/validate.mjs";

const result = validateConsolidatedScientificSources();
console.log(stableStringify(result));
if (!result.valid) process.exitCode = 1;

