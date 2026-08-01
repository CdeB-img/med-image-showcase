import { scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";

console.log(JSON.stringify({ engine: "P6_SCIENTIFIC_CAMPAIGN_ENGINE", catalogueDigest: scientificKnowledgeCatalog.digest, campaigns: scientificKnowledgeCatalog.campaigns, publicationAuthorized: false }, null, 2));
