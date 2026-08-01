import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { automaticCampaignExecutionTrace } from "../src/knowledge-graph/scientific-campaigns/execution.mjs";
import { executeScientificCampaign } from "../src/knowledge-graph/scientific-campaigns/generic-executor.mjs";
import { validateAutomaticScientificCampaign } from "../src/knowledge-graph/scientific-campaigns/validate.mjs";

const check = process.argv.includes("--check");
const root = process.cwd();
const tracePath = resolve(root, "src/knowledge-graph/scientific-campaigns/automatic-campaign-trace.json");
const catalogPath = resolve(root, "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json");
const traceContent = `${stableStringify(automaticCampaignExecutionTrace, 2)}\n`;
const catalogContent = `${stableStringify(scientificKnowledgeCatalog, 2)}\n`;
const p7Validation = validateAutomaticScientificCampaign({ root, inspectGit: false });

if (!p7Validation.valid) {
  console.error(JSON.stringify({ valid: false, errors: p7Validation.errors }, null, 2));
  process.exitCode = 1;
} else if (check) {
  const stale = [
    !existsSync(tracePath) || readFileSync(tracePath, "utf8") !== traceContent ? tracePath : null,
    !existsSync(catalogPath) || readFileSync(catalogPath, "utf8") !== catalogContent ? catalogPath : null,
  ].filter(Boolean);
  if (stale.length) {
    console.error(JSON.stringify({ valid: false, code: "SCIENTIFIC_CAMPAIGN_ARTIFACT_STALE", stale }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ valid: true, mode: "check", p7GoldenMasterTraceDigest: automaticCampaignExecutionTrace.traceDigest, currentCatalogDigest: scientificKnowledgeCatalog.digest, plannedCampaigns: scientificKnowledgeCatalog.campaigns.length }, null, 2));
  }
} else {
  const manifest = scientificKnowledgeCatalog.campaigns[0];
  const dryRun = manifest ? await executeScientificCampaign({ campaignManifest: manifest, catalog: scientificKnowledgeCatalog, mode: "DRY_RUN" }) : null;
  console.log(JSON.stringify({
    valid: true,
    mode: "dry-run",
    campaignDefinitionId: manifest?.campaignDefinitionId ?? null,
    campaignRevisionId: manifest?.campaignRevisionId ?? null,
    selectionDigest: manifest?.selectionDigest ?? null,
    dryRun,
    realCampaignExecuted: false,
    filesWritten: 0,
    nextCampaignStarted: false,
  }, null, 2));
}
