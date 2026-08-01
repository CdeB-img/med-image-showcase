import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const report = JSON.parse(readFileSync(resolve(process.cwd(), "docs/scientific-territory-report.json"), "utf8"));
console.log(JSON.stringify({ summary: report.summary, coverage: report.coverage, catalogComparison: report.catalogComparison, limits: report.limits }, null, 2));
