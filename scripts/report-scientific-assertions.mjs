import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createKnowledgeGraphReport } from "../src/knowledge-graph/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = createKnowledgeGraphReport({ root });
console.log(JSON.stringify(report.scientificAssertionLayer, null, 2));
