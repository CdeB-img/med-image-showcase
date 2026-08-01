import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createKnowledgeGraphReport } from "../src/knowledge-graph/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
console.log(JSON.stringify(createKnowledgeGraphReport({ root }), null, 2));
