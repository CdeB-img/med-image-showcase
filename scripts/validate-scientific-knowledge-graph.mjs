import {
  validateCompetencyCases,
  validateFamilyCompleteness,
  validateKnowledgeGraphSemantics,
  validateKnowledgeGraphStructure,
  validateMigrationIntegrity,
  validateProjectionReadiness,
  validateScientificAssertions,
  validateScientificKnowledgeGraph,
  validateScientificProvenance,
} from "../src/knowledge-graph/multilayer-validation.mjs";

const layerArgument = process.argv.find((argument) => argument.startsWith("--layer="));
const layer = layerArgument?.split("=")[1] ?? "all";
const validators = {
  structure: () => validateKnowledgeGraphStructure({ root: process.cwd() }),
  semantics: validateKnowledgeGraphSemantics,
  scientific: validateScientificAssertions,
  provenance: validateScientificProvenance,
  completeness: validateFamilyCompleteness,
  competency: validateCompetencyCases,
  migration: validateMigrationIntegrity,
  projection: validateProjectionReadiness,
  all: () => validateScientificKnowledgeGraph({ root: process.cwd() }),
};
if (!validators[layer]) throw new Error(`Unknown validation layer: ${layer}`);
const result = validators[layer]();
const validityFields = ["structureValid", "semanticsValid", "scientificValid", "provenanceValid", "coverageValid", "competencyValid", "migrationIntegrityValid", "projectionReady"];
const valid = layer === "all" ? validityFields.every((field) => result[field]) : validityFields.filter((field) => field in result).every((field) => result[field]);
console.log(JSON.stringify({ layer, valid, result }, null, 2));
if (!valid) process.exitCode = 1;
