import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { createP9IndustrialReport, renderP9IndustrialMarkdownReport } from "../src/knowledge-graph/scientific-campaigns/industrial-report.mjs";

const report = createP9IndustrialReport({ root: process.cwd() });
const jsonPath = resolve(process.cwd(), "docs/p9-scientific-platform-industrialization-report.json");
const markdownPath = resolve(process.cwd(), "docs/p9-scientific-platform-industrialization.md");
writeFileSync(jsonPath, `${stableStringify(report, 2)}\n`, "utf8");
writeFileSync(markdownPath, renderP9IndustrialMarkdownReport(report), "utf8");
console.log(JSON.stringify({ valid: report.validation.valid, jsonPath, markdownPath, decision: report.decision }, null, 2));
if (!report.validation.valid) process.exitCode = 1;
