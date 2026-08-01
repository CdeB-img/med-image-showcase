import { createAuthoritativeScientificRegistry, scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { validateCatalogReadinessIntegrity } from "../src/knowledge-graph/knowledge-catalog/readiness-integrity.mjs";
import { validateP8CorruptionReplays } from "../src/knowledge-graph/scientific-campaigns/industrial-validation.mjs";

const integrity = validateCatalogReadinessIntegrity({ catalog: scientificKnowledgeCatalog, registry: createAuthoritativeScientificRegistry() });
const corruptionReplays = validateP8CorruptionReplays();
const valid = integrity.valid && corruptionReplays.valid;
console.log(JSON.stringify({ valid, integrity, corruptionReplays }, null, 2));
if (!valid) process.exitCode = 1;
