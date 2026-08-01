import { validateP9IndustrialPlatform } from "../src/knowledge-graph/scientific-campaigns/industrial-validation.mjs";
import { validateAutomaticScientificCampaign } from "../src/knowledge-graph/scientific-campaigns/validate.mjs";

const p7GoldenMaster = validateAutomaticScientificCampaign({ root: process.cwd(), inspectGit: true });
const industrialPlatform = validateP9IndustrialPlatform();
const valid = p7GoldenMaster.valid && industrialPlatform.valid;
console.log(JSON.stringify({ valid, p7GoldenMaster: { valid: p7GoldenMaster.valid, counts: p7GoldenMaster.counts, errors: p7GoldenMaster.errors }, industrialPlatform }, null, 2));
if (!valid) process.exitCode = 1;
