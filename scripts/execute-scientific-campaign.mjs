import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { automaticCampaignExecutionTrace } from "../src/knowledge-graph/scientific-campaigns/execution.mjs";
import { validateAutomaticScientificCampaign } from "../src/knowledge-graph/scientific-campaigns/validate.mjs";

const check = process.argv.includes("--check");
const root = process.cwd();
const tracePath = resolve(root, "src/knowledge-graph/scientific-campaigns/automatic-campaign-trace.json");
const catalogPath = resolve(root, "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json");
const traceContent = `${stableStringify(automaticCampaignExecutionTrace, 2)}\n`;
const catalogContent = `${stableStringify(scientificKnowledgeCatalog, 2)}\n`;
const validation = validateAutomaticScientificCampaign({ root, inspectGit: false });

if (!validation.valid) {
  console.error(JSON.stringify({ valid: false, errors: validation.errors }, null, 2));
  process.exitCode = 1;
} else if (check) {
  const stale = [
    !existsSync(tracePath) || readFileSync(tracePath, "utf8") !== traceContent ? tracePath : null,
    !existsSync(catalogPath) || readFileSync(catalogPath, "utf8") !== catalogContent ? catalogPath : null,
  ].filter(Boolean);
  if (stale.length) {
    console.error(JSON.stringify({ valid: false, code: "AUTOMATIC_CAMPAIGN_ARTIFACT_STALE", stale }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ valid: true, mode: "check", campaignId: validation.selection.campaignId, traceDigest: automaticCampaignExecutionTrace.traceDigest, catalogDigest: scientificKnowledgeCatalog.digest, remainingCampaigns: scientificKnowledgeCatalog.campaigns.length }, null, 2));
  }
} else {
  writeFileSync(tracePath, traceContent, "utf8");
  writeFileSync(catalogPath, catalogContent, "utf8");
  console.log(JSON.stringify({ valid: true, mode: "execute", campaignId: validation.selection.campaignId, selectedAutomatically: true, manualDomainSelection: false, tracePath, traceDigest: automaticCampaignExecutionTrace.traceDigest, catalogPath, catalogDigest: scientificKnowledgeCatalog.digest, nextCampaignStarted: false }, null, 2));
}

