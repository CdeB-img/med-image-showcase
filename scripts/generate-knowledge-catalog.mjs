import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";
import { scientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";

const outputPath = resolve(process.cwd(), "src/knowledge-graph/knowledge-catalog/knowledge-catalog.json");
const content = `${stableStringify(scientificKnowledgeCatalog, 2)}\n`;
if (process.argv.includes("--check")) {
  if (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== content) {
    console.error("knowledge-catalog.json is missing or stale.");
    process.exitCode = 1;
  } else {
    console.log(`knowledge-catalog.json is current: ${scientificKnowledgeCatalog.summary.knowledgeNodes} KnowledgeNodes, digest ${scientificKnowledgeCatalog.digest}.`);
  }
} else {
  writeFileSync(outputPath, content, "utf8");
  console.log(`Generated ${outputPath}: ${scientificKnowledgeCatalog.summary.knowledgeNodes} KnowledgeNodes, digest ${scientificKnowledgeCatalog.digest}.`);
}
