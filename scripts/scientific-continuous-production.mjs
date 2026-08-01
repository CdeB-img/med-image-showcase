import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { createScientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { P10_CAMPAIGN_ID } from "../src/knowledge-graph/scientific-campaigns/continuous-wave/constants.mjs";
import { createP10ScientificProductionReport, renderP10ScientificProductionReportMarkdown } from "../src/knowledge-graph/scientific-campaigns/continuous-wave/report.mjs";
import { buildP10RuntimeBundle, loadP10RuntimeContext } from "../src/knowledge-graph/scientific-campaigns/continuous-wave/runtime.mjs";
import { validateTerritorialScientificProduction } from "../src/knowledge-graph/scientific-campaigns/continuous-wave/validate.mjs";

const root = process.cwd();
const valueFor = (name) => process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const action = valueFor("action") ?? "validate";
const check = process.argv.includes("--check");
const dryRun = process.argv.includes("--dry-run");
const requestedCampaignId = valueFor("campaign-id");
if (requestedCampaignId && requestedCampaignId !== P10_CAMPAIGN_ID) throw new Error(`P10_CAMPAIGN_ID_NOT_AVAILABLE:${requestedCampaignId}`);

const paths = Object.freeze({
  bundle: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/execution-bundle.json"),
  catalog: resolve(root, "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json"),
  requalification: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-requalification-registry.json"),
  manifest: resolve(root, `src/knowledge-graph/scientific-campaigns/continuous-wave/${P10_CAMPAIGN_ID}-manifest.json`),
  initialSnapshot: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-initial-snapshot.json"),
  postSnapshot: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-post-execution-snapshot.json"),
  trace: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-execution-trace.json"),
  coverage: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-coverage.json"),
  readiness: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-readiness.json"),
  queue: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-queue.json"),
  rollback: resolve(root, "src/knowledge-graph/scientific-campaigns/continuous-wave/p10-rollback-dry-run.json"),
  reportJson: resolve(root, "docs/p10-territorial-scientific-production-report.json"),
  reportMarkdown: resolve(root, "docs/p10-territorial-scientific-production-report.md"),
});

const json = (value) => `${stableStringify(value, 2)}\n`;
const writeAtomic = (path, content) => {
  const temporaryPath = `${path}.p10-tmp`;
  try {
    writeFileSync(temporaryPath, content, "utf8");
    renameSync(temporaryPath, path);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
};

const context = await loadP10RuntimeContext({ root });
const bundle = await buildP10RuntimeBundle({ root });
const validation = validateTerritorialScientificProduction({ bundle, baselineCatalog: context.baselineCatalog, territoryModel: context.territoryModel, root, inspectGit: true });
if (!validation.valid) {
  console.error(JSON.stringify({ valid: false, action, errors: validation.errors }, null, 2));
  process.exitCode = 1;
} else {
  const catalog = createScientificKnowledgeCatalog({ territorialCampaignCorpus: bundle.officialCorpus });
  const report = createP10ScientificProductionReport({ bundle, validation });
  const expected = new Map([
    [paths.bundle, json(bundle)],
    [paths.catalog, json(catalog)],
    [paths.requalification, json(bundle.requalificationRegistry)],
    [paths.manifest, json(bundle.manifest)],
    [paths.initialSnapshot, json(bundle.initialSnapshot)],
    [paths.postSnapshot, json(bundle.postSnapshot)],
    [paths.trace, json(bundle.execution)],
    [paths.coverage, json(bundle.coverage)],
    [paths.readiness, json(bundle.readiness)],
    [paths.queue, json(bundle.queue)],
    [paths.rollback, json(bundle.rollbackDryRun)],
    [paths.reportJson, json(report)],
    [paths.reportMarkdown, renderP10ScientificProductionReportMarkdown(report)],
  ]);

  if (action === "execute") {
    if (check) {
      const drift = [...expected].filter(([path, content]) => !existsSync(path) || readFileSync(path, "utf8") !== content).map(([path]) => path);
      console.log(JSON.stringify({ valid: drift.length === 0, action, campaignId: P10_CAMPAIGN_ID, bundleDigest: bundle.digest, catalogDigest: catalog.digest, drift }, null, 2));
      if (drift.length) process.exitCode = 1;
    } else {
      for (const [path, content] of expected) writeAtomic(path, content);
      console.log(JSON.stringify({ valid: true, action, campaignId: P10_CAMPAIGN_ID, status: bundle.status, selectedDomain: bundle.plan.selectedDomainId, filesWritten: expected.size, bundleDigest: bundle.digest, catalogDigest: catalog.digest, campaignsExecuted: 1, nextCampaignExecuted: false }, null, 2));
    }
  } else if (action === "audit") {
    console.log(JSON.stringify({ valid: true, sourcePath: bundle.preparedPackage.sourcePath, sourceDigest: bundle.preparedPackage.sourceDigest, trustStatus: bundle.preparedPackage.trustStatus, inventory: bundle.preparedPackage.inventory.counts, decisions: bundle.requalificationRegistry.counts }, null, 2));
  } else if (action === "prepared") {
    console.log(JSON.stringify(validation.layers.preparedPackage, null, 2));
  } else if (action === "plan") {
    console.log(JSON.stringify({ valid: true, algorithm: bundle.plan.algorithm, manualDomainSelection: bundle.plan.manualDomainSelection, candidates: bundle.plan.candidates, selectedDomainId: bundle.plan.selectedDomainId }, null, 2));
  } else if (action === "simulate") {
    console.log(JSON.stringify({ valid: bundle.simulations.identical, runs: 2, campaignId: bundle.manifest.campaignId, first: bundle.simulations.first, second: bundle.simulations.second }, null, 2));
  } else if (action === "replay") {
    console.log(JSON.stringify(validation.layers.replay, null, 2));
  } else if (action === "rollback") {
    if (!dryRun) throw new Error("P10_ROLLBACK_REQUIRES_DRY_RUN");
    console.log(JSON.stringify(validation.layers.rollback, null, 2));
  } else if (action === "coverage") {
    console.log(JSON.stringify(bundle.coverage, null, 2));
  } else if (action === "readiness") {
    console.log(JSON.stringify(bundle.readiness, null, 2));
  } else if (action === "queue") {
    console.log(JSON.stringify(bundle.queue, null, 2));
  } else if (action === "requalification") {
    console.log(JSON.stringify(bundle.requalificationRegistry, null, 2));
  } else if (action === "report") {
    console.log(JSON.stringify({ summary: report.summary, decision: report.decision, validation: report.validation }, null, 2));
  } else if (action === "validate") {
    console.log(JSON.stringify({ valid: validation.valid, version: validation.version, counts: validation.counts, layers: Object.fromEntries(Object.entries(validation.layers).map(([key, value]) => [key, value.valid])), errors: validation.errors }, null, 2));
  } else {
    throw new Error(`P10_ACTION_UNKNOWN:${action}`);
  }
}
