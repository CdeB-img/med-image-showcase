import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createKnowledgeGraphSnapshot, validateFrozenKnowledgeGraphSnapshot } from "../src/knowledge-graph/migration/snapshot.mjs";
import { stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "src/knowledge-graph/migration/snapshots/knowledge-graph-v1.0.0-before-migration.json");
const checkOnly = process.argv.includes("--check");
const gitSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
if (existsSync(outputPath)) {
  const frozen = JSON.parse(readFileSync(outputPath, "utf8"));
  const validation = validateFrozenKnowledgeGraphSnapshot(frozen);
  if (!validation.valid) throw new Error(`Frozen snapshot integrity failure: ${JSON.stringify(validation.errors)}`);
  console.log(JSON.stringify({ valid: true, mode: checkOnly ? "check-frozen" : "preserve-existing", outputPath, snapshotId: frozen.snapshotId, counts: frozen.counts }, null, 2));
} else if (checkOnly) {
  throw new Error(`Missing snapshot: ${outputPath}`);
} else {
  const snapshot = createKnowledgeGraphSnapshot({ root, gitSha });
  const serialized = `${stableStringify(snapshot)}\n`;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialized, "utf8");
  console.log(JSON.stringify({ valid: true, mode: "write", outputPath, snapshotId: snapshot.snapshotId, counts: snapshot.counts }, null, 2));
}
