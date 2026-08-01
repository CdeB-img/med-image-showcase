import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createKnowledgeCatalogReport, renderKnowledgeCatalogMarkdownReport } from "../src/knowledge-graph/knowledge-catalog/report.mjs";

const outputPath = resolve(process.cwd(), "docs/p7-scientific-knowledge-catalog-report.md");
const report = createKnowledgeCatalogReport({ root: process.cwd(), inspectGit: false });
const content = renderKnowledgeCatalogMarkdownReport(report);
if (process.argv.includes("--check")) {
  if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== content) {
    console.error("Current Scientific Knowledge Catalog report is missing or stale.");
    process.exitCode = 1;
  } else {
    console.log(`Current Scientific Knowledge Catalog report is current: ${outputPath}`);
  }
} else {
  writeFileSync(outputPath, content, "utf8");
  console.log(`Generated ${outputPath}`);
}

