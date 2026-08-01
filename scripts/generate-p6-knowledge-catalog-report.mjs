import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createKnowledgeCatalogReport, renderKnowledgeCatalogMarkdownReport } from "../src/knowledge-graph/knowledge-catalog/report.mjs";

const report = createKnowledgeCatalogReport({ root: process.cwd(), inspectGit: true });
if (!report.validation.valid) {
  console.error(JSON.stringify(report.validation.errors, null, 2));
  process.exitCode = 1;
} else {
  const outputPath = resolve(process.cwd(), "docs/p6-scientific-knowledge-catalog-report.md");
  writeFileSync(outputPath, renderKnowledgeCatalogMarkdownReport(report), "utf8");
  console.log(`Generated ${outputPath}.`);
}
