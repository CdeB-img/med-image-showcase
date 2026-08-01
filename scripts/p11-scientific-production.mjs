import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import p10Bundle from "../src/knowledge-graph/scientific-campaigns/continuous-wave/execution-bundle.json" with { type: "json" };
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { buildP11ExecutionBundle } from "../src/knowledge-graph/scientific-campaigns/territorial-wave/execution.mjs";
import { validateP11ContinuousTerritorialProduction } from "../src/knowledge-graph/scientific-campaigns/territorial-wave/validate.mjs";

const root = process.cwd();
const outputDirectory = path.join(root, "src/knowledge-graph/scientific-campaigns/territorial-wave");
const args = new Set(process.argv.slice(2));
const action = process.argv.find((value) => value.startsWith("--action="))?.split("=")[1] ?? "validate";
const check = args.has("--check");
const output = (value) => `${stableStringify(value, 2)}\n`;

const bundle = await buildP11ExecutionBundle({ root });
const validation = validateP11ContinuousTerritorialProduction({ bundle, p10Bundle, root, inspectGit: action === "validate" && !args.has("--no-git") });

if (!validation.valid) {
  console.error(JSON.stringify(validation, null, 2));
  process.exitCode = 1;
} else if (action === "execute") {
  const files = new Map([
    ["execution-bundle.json", bundle],
    ["p11-initial-snapshot.json", bundle.initialSnapshot],
    ["p11-post-execution-snapshot.json", bundle.postSnapshot],
    ["p11-requalification-registry.json", bundle.requalificationRegistry],
    ["p11-source-audit.json", bundle.sourceAudits],
    ["p11-selection-history.json", bundle.selectionHistory],
    ["p11-final-queue.json", bundle.finalQueue],
    ["p11-termination.json", bundle.termination],
    ["p11-coverage.json", bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, report: campaign.coverage }))],
    ["p11-readiness.json", bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, report: campaign.readiness }))],
  ]);
  for (const campaign of bundle.campaigns) {
    const prefix = campaign.manifest.campaignId;
    files.set(`${prefix}-manifest.json`, campaign.manifest);
    files.set(`${prefix}-execution-trace.json`, campaign.execution);
    files.set(`${prefix}-post-snapshot.json`, campaign.postSnapshot);
    files.set(`${prefix}-coverage.json`, campaign.coverage);
    files.set(`${prefix}-readiness.json`, campaign.readiness);
    files.set(`${prefix}-rollback-dry-run.json`, campaign.rollbackDryRun);
  }
  await mkdir(outputDirectory, { recursive: true });
  const differences = [];
  for (const [filename, value] of files) {
    const target = path.join(outputDirectory, filename);
    const expected = output(value);
    let existing = null;
    try { existing = await readFile(target, "utf8"); } catch {}
    if (existing !== expected) differences.push(filename);
    if (!check) await writeFile(target, expected, "utf8");
  }
  if (check && differences.length) {
    console.error(JSON.stringify({ valid: false, action, staleFiles: differences }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ valid: true, action, check, written: check ? 0 : files.size, campaigns: bundle.totals.campaignsExecuted, domains: bundle.campaigns.map((campaign) => campaign.domainId), finalCatalog: bundle.finalCatalog, next: bundle.termination.nextQueueEntry?.knowledgeNodeId ?? null }, null, 2));
  }
} else {
  const views = {
    audit: { sourceAudits: bundle.sourceAudits, requalification: bundle.requalificationRegistry.counts },
    plan: { selectionHistory: bundle.selectionHistory, termination: bundle.termination },
    simulate: bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, identical: campaign.simulations.identical, digest: campaign.simulations.first.immutableTraceDigest })),
    replay: bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, ...campaign.replay })),
    rollback: bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, ...campaign.rollbackDryRun })),
    coverage: bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, changed: campaign.coverage.rows.filter((row) => row.previousState !== row.state) })),
    readiness: bundle.campaigns.map((campaign) => ({ campaignId: campaign.manifest.campaignId, domainId: campaign.domainId, readiness: campaign.readiness })),
    queue: bundle.finalQueue,
    validate: validation,
    report: { totals: bundle.totals, finalCatalog: bundle.finalCatalog, termination: bundle.termination, validation },
  };
  console.log(JSON.stringify(views[action] ?? views.validate, null, 2));
}

