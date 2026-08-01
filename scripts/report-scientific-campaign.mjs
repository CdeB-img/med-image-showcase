import { createAutomaticScientificCampaignReport } from "../src/knowledge-graph/scientific-campaigns/report.mjs";

console.log(JSON.stringify(createAutomaticScientificCampaignReport({ root: process.cwd(), inspectGit: false }), null, 2));

