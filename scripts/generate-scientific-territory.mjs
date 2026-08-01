import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { p9ScientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { createScientificTerritoryModel } from "../src/knowledge-graph/scientific-territory/model.mjs";
import { createTerritoryReport, renderTerritoryReportMarkdown } from "../src/knowledge-graph/scientific-territory/territory-report.mjs";

const root = process.cwd();
const check = process.argv.includes("--check");
const modelPath = resolve(root, "src/knowledge-graph/scientific-territory/scientific-territory-model.json");
const reportPath = resolve(root, "docs/scientific-territory-report.json");
const markdownPath = resolve(root, "docs/scientific-territory-report.md");
// The Territory Model is an upstream P9 contract. P10 enriches the catalogue
// against it; it must never be regenerated from the downstream P10 catalogue.
const catalog = p9ScientificKnowledgeCatalog;
const model = createScientificTerritoryModel({ catalog });
const report = createTerritoryReport(model);
const expected = new Map([
  [modelPath, stableStringify(model, 2)],
  [reportPath, stableStringify(report, 2)],
  [markdownPath, renderTerritoryReportMarkdown(report)],
]);

if (check) {
  const drift = [...expected].filter(([path, content]) => {
    try { return readFileSync(path, "utf8") !== content; } catch { return true; }
  }).map(([path]) => path);
  console.log(JSON.stringify({ valid: drift.length === 0, modelDigest: model.digest, drift }, null, 2));
  if (drift.length) process.exitCode = 1;
} else {
  for (const [path, content] of expected) writeFileSync(path, content);
  console.log(JSON.stringify({ generated: [...expected.keys()], modelDigest: model.digest, nodes: model.nodes.length }, null, 2));
}
