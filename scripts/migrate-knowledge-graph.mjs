import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createKnowledgeGraphMigrationManifest } from "../src/knowledge-graph/migration/manifest.mjs";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "src/knowledge-graph/migration/knowledge-graph-migration-manifest.json");
const checkOnly = process.argv.includes("--check");
const validate = process.argv.includes("--validate");
const manifest = createKnowledgeGraphMigrationManifest({ root });
const serialized = `${stableStringify(manifest)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) throw new Error(`Missing migration manifest: ${outputPath}`);
  if (readFileSync(outputPath, "utf8") !== serialized) throw new Error(`Migration manifest drift: ${outputPath}`);
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
}

if (validate && manifest.errors.length > 0) throw new Error(`P3M-Web migration validation failed: ${JSON.stringify(manifest.errors)}`);
console.log(JSON.stringify({
  valid: manifest.errors.length === 0,
  mode: checkOnly ? "check" : "write",
  outputPath,
  status: manifest.status,
  manifestDigest: manifest.manifestDigest,
  counts: manifest.counts,
  validation: manifest.validation,
}, null, 2));
