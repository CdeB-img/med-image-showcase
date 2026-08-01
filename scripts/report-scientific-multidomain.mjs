import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { createP5MultidomainReport } from "../src/knowledge-graph/scientific-multidomain/report.mjs";

const report = createP5MultidomainReport();
console.log(stableStringify(report));
if (!report.validation.valid) process.exitCode = 1;

