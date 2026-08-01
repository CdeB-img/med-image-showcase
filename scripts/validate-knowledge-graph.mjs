import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { validateKnowledgeGraph } from "../src/knowledge-graph/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = validateKnowledgeGraph({ root });
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
