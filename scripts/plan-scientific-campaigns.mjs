import { scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { executeScientificCampaign } from "../src/knowledge-graph/scientific-campaigns/generic-executor.mjs";

const dryRun = process.argv.includes("--dry-run");
if (!dryRun) {
  console.error(JSON.stringify({ valid: false, code: "SCIENTIFIC_CAMPAIGN_PLANNER_DRY_RUN_REQUIRED", hint: "Use --dry-run. P9 does not execute a real campaign." }, null, 2));
  process.exitCode = 1;
} else {
  const nextCampaign = scientificKnowledgeCatalog.campaigns[0] ?? null;
  const authorization = nextCampaign
    ? await executeScientificCampaign({ campaignManifest: nextCampaign, catalog: scientificKnowledgeCatalog, mode: "DRY_RUN" })
    : null;
  console.log(JSON.stringify({
    engine: "P9_INDUSTRIAL_SCIENTIFIC_CAMPAIGN_ENGINE",
    mode: "DRY_RUN",
    catalogueDigest: scientificKnowledgeCatalog.digest,
    planningDigest: scientificKnowledgeCatalog.planningDigest,
    campaigns: scientificKnowledgeCatalog.campaigns,
    nextCampaign,
    authorization,
    selectedDomainManually: false,
    realCampaignExecuted: false,
    publicationAuthorized: false,
  }, null, 2));
}
