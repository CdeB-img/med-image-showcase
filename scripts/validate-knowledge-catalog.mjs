import { validateScientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/validators.mjs";

const validation = validateScientificKnowledgeCatalog({ root: process.cwd(), inspectGit: true });
console.log(JSON.stringify({ valid: validation.valid, counts: validation.counts, layers: validation.layers, errors: validation.errors }, null, 2));
if (!validation.valid) process.exitCode = 1;
