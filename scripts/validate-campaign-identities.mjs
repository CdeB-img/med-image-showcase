import { validateCampaignIdentities } from "../src/knowledge-graph/scientific-campaigns/industrial-validation.mjs";

const validation = validateCampaignIdentities();
console.log(JSON.stringify(validation, null, 2));
if (!validation.valid) process.exitCode = 1;
