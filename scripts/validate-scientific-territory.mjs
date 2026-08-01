import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { p9ScientificKnowledgeCatalog } from "../src/knowledge-graph/knowledge-catalog/catalog-builder.mjs";
import { createScientificTerritoryModel } from "../src/knowledge-graph/scientific-territory/model.mjs";
import { validateScientificTerritoryModel } from "../src/knowledge-graph/scientific-territory/validate.mjs";

const root = process.cwd();
const catalog = p9ScientificKnowledgeCatalog;
const fileModel = JSON.parse(readFileSync(resolve(root, "src/knowledge-graph/scientific-territory/scientific-territory-model.json"), "utf8"));
const model = createScientificTerritoryModel({ catalog });
const validation = validateScientificTerritoryModel({ model, catalog, fileModel });
console.log(JSON.stringify(validation, null, 2));
if (!validation.valid) process.exitCode = 1;
