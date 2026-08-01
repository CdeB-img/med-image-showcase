import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildPilotTestSitemap, planNoxiaPilotPublication, runNoxiaPilot } from "../src/editorial/engine.mjs";
import { validateNoxiaPilot } from "../src/editorial/validate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validation = validateNoxiaPilot(root);
const pilotSitemap = buildPilotTestSitemap();
const publication = planNoxiaPilotPublication();
const result = runNoxiaPilot();
console.log(JSON.stringify({ validation, pilotSitemap, publicSitemapUrls: result.sitemap.urls, publication }, null, 2));
if (!validation.valid) process.exitCode = 1;
