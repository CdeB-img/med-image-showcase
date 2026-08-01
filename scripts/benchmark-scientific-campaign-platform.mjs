import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { runP9IndustrialBenchmarks } from "../src/knowledge-graph/scientific-campaigns/industrial-benchmark.mjs";

const outputPath = resolve(process.cwd(), "docs/p9-industrial-benchmark-metrics.json");
const metrics = Object.freeze({
  benchmarkId: "NOXIA_P9_INDUSTRIAL_CAMPAIGN_PLATFORM",
  scope: "ISOLATED_SYNTHETIC_FIXTURES_NO_REAL_SCIENTIFIC_ENRICHMENT",
  measuredAt: "2026-08-01",
  results: runP9IndustrialBenchmarks(),
  p8Reference: Object.freeze({
    100: { planningMs: 0.119, validationMs: 0.428 },
    500: { planningMs: 0.366, validationMs: 3.121 },
    1000: { planningMs: 0.746, validationMs: 3.906 },
    5000: { planningMs: 4.825, validationMs: 184.592 },
  }),
  interpretation: "P9 scenarios include priority snapshots, projected-node reentry, dependencies, blocked campaigns, recurrent signals and campaign revisions; timings are therefore not directly equivalent to the flatter P8 selector benchmark.",
});
writeFileSync(outputPath, `${stableStringify(metrics, 2)}\n`, "utf8");
console.log(JSON.stringify({ valid: metrics.results.every((item) => item.deterministic && item.graphValid && item.dependenciesValid), outputPath, results: metrics.results }, null, 2));
