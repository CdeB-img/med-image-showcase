import { createKnowledgeCatalogReport } from "../src/knowledge-graph/knowledge-catalog/report.mjs";

const report = createKnowledgeCatalogReport({ root: process.cwd(), inspectGit: true });
console.log(JSON.stringify({ reportId: report.reportId, generatedAt: report.generatedAt, gitInitialState: report.gitInitialState, summary: report.summary, campaigns: report.campaigns, contracts: report.contracts, validation: { valid: report.validation.valid, errors: report.validation.errors }, digest: report.digest }, null, 2));
if (!report.validation.valid) process.exitCode = 1;
