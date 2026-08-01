import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { assertionReviewSummary } from "../src/knowledge-graph/scientific-consolidation/review.mjs";
import { sourceConsolidationSummary } from "../src/knowledge-graph/scientific-consolidation/sources.mjs";
import { validateP4RConsolidation } from "../src/knowledge-graph/scientific-consolidation/validate.mjs";

const domainIndex = process.argv.indexOf("--domain");
const domain = domainIndex >= 0 ? process.argv[domainIndex + 1] : "ecv-t1";
if (domain !== "ecv-t1") throw new Error(`P4R consolidates ecv-t1 only; received ${domain}`);
const validation = validateP4RConsolidation();
console.log(stableStringify({ domain, deterministic: true, mutatesPublicContent: false, sourceConsolidationSummary, assertionReviewSummary, valid: validation.valid, errors: validation.errors }));
if (!validation.valid) process.exitCode = 1;

