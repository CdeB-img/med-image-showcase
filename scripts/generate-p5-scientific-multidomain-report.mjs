import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createP5MultidomainReport, renderP5MarkdownReport } from "../src/knowledge-graph/scientific-multidomain/report.mjs";

const root = process.cwd();
const report = createP5MultidomainReport({ root, inspectGit: true });
const output = resolve(root, "docs/p5-scientific-multidomain-report.md");
writeFileSync(output, renderP5MarkdownReport(report), "utf8");
console.log(`P5 multidomain report written to ${output}`);
if (!report.validation.valid) process.exitCode = 1;

