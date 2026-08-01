import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAutomaticScientificCampaignReport, renderAutomaticScientificCampaignMarkdownReport } from "../src/knowledge-graph/scientific-campaigns/report.mjs";

const outputPath = resolve(process.cwd(), "docs/p7-first-automatic-scientific-campaign-report.md");
const content = renderAutomaticScientificCampaignMarkdownReport(createAutomaticScientificCampaignReport({ root: process.cwd(), inspectGit: false }));
if (process.argv.includes("--check")) {
  if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== content) {
    console.error("P7 scientific campaign report is missing or stale.");
    process.exitCode = 1;
  } else {
    console.log(`P7 scientific campaign report is current: ${outputPath}`);
  }
} else {
  writeFileSync(outputPath, content, "utf8");
  console.log(`Generated ${outputPath}`);
}

