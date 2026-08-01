import { validateAutomaticScientificCampaign } from "../src/knowledge-graph/scientific-campaigns/validate.mjs";

const validation = validateAutomaticScientificCampaign({ root: process.cwd(), inspectGit: true });
console.log(JSON.stringify({ valid: validation.valid, selection: validation.selection, counts: validation.counts, digests: validation.trace.digests, errors: validation.errors }, null, 2));
if (!validation.valid) process.exitCode = 1;

