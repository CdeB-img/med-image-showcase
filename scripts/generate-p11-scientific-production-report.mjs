import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import p10Bundle from "../src/knowledge-graph/scientific-campaigns/continuous-wave/execution-bundle.json" with { type: "json" };
import p11Bundle from "../src/knowledge-graph/scientific-campaigns/territorial-wave/execution-bundle.json" with { type: "json" };
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { createP11ScientificProductionReport, renderP11ScientificProductionReportMarkdown } from "../src/knowledge-graph/scientific-campaigns/territorial-wave/report.mjs";
import { validateP11ContinuousTerritorialProduction } from "../src/knowledge-graph/scientific-campaigns/territorial-wave/validate.mjs";

const root = process.cwd();
const check = process.argv.includes("--check");
const validation = validateP11ContinuousTerritorialProduction({ bundle: p11Bundle, p10Bundle, root, inspectGit: false });
if (!validation.valid) {
  console.error(JSON.stringify(validation, null, 2));
  process.exitCode = 1;
} else {
  const report = createP11ScientificProductionReport({ bundle: p11Bundle, validation });
  const outputs = new Map([
    [path.join(root, "docs/p11-continuous-territorial-scientific-production-report.json"), `${stableStringify(report, 2)}\n`],
    [path.join(root, "docs/p11-continuous-territorial-scientific-production-report.md"), renderP11ScientificProductionReportMarkdown(report)],
  ]);
  const stale = [];
  for (const [target, expected] of outputs) {
    let actual = null;
    try { actual = await readFile(target, "utf8"); } catch {}
    if (actual !== expected) stale.push(path.relative(root, target));
    if (!check) await writeFile(target, expected, "utf8");
  }
  if (check && stale.length) {
    console.error(JSON.stringify({ valid: false, stale }, null, 2));
    process.exitCode = 1;
  } else console.log(JSON.stringify({ valid: true, check, sections: Object.keys(report.sections).length, campaigns: report.summary.campaignsExecuted, decision: report.decision }, null, 2));
}

