import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { createP4RConsolidationReport } from "../src/knowledge-graph/scientific-consolidation/report.mjs";

const domainIndex = process.argv.indexOf("--domain");
const domain = domainIndex >= 0 ? process.argv[domainIndex + 1] : "ecv-t1";
if (domain !== "ecv-t1") throw new Error(`P4R reports ecv-t1 only; received ${domain}`);
const report = createP4RConsolidationReport();
console.log(stableStringify(report));
if (!report.validation.valid) process.exitCode = 1;

