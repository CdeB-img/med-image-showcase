import { scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { validateCampaignDependencies } from "../src/knowledge-graph/knowledge-catalog/campaign-dependencies.mjs";

const validation = validateCampaignDependencies({ nodes: scientificKnowledgeCatalog.nodes, dependencies: scientificKnowledgeCatalog.dependencyRegistry });
console.log(JSON.stringify(validation, null, 2));
if (!validation.valid) process.exitCode = 1;
