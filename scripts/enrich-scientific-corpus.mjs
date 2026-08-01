import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { createScientificCorpusReport } from "../src/knowledge-graph/scientific-corpus/report.mjs";

const domainArgument = process.argv.find((argument) => argument.startsWith("--domain="));
const domainIndex = process.argv.indexOf("--domain");
const domain = domainArgument?.split("=")[1] ?? (domainIndex >= 0 ? process.argv[domainIndex + 1] : "ecv-t1");
if (domain !== "ecv-t1") throw new Error(`Unsupported scientific corpus domain: ${domain}`);
const report = createScientificCorpusReport({ root: process.cwd() });
console.log(stableStringify({ domain, mode: "DETERMINISTIC_READ_ONLY_CORPUS_MATERIALIZATION", mutatedPublicContent: false, valid: report.validation.valid, counts: report.counts }));
if (!report.validation.valid) process.exitCode = 1;
