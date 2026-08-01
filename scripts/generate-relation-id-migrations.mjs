import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { relations } from "../src/knowledge-graph/catalog.mjs";
import { RELATION_IDENTITY_ALGORITHM, RELATION_IDENTITY_VERSION } from "../src/knowledge-graph/relation-identity.mjs";
import { sha256Digest, stableStringify } from "../src/knowledge-graph/migration/stable-json.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = resolve(root, "src/knowledge-graph/migration/snapshots/knowledge-graph-v1.0.0-before-migration.json");
const outputPath = resolve(root, "src/knowledge-graph/migration/relation-id-migrations.json");
const checkOnly = process.argv.includes("--check");
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const currentByLegacyId = new Map(relations.flatMap((relation) => relation.legacyRelationIds.map((legacyRelationId) => [legacyRelationId, relation])));

const entries = snapshot.data.relations.map((legacyRelation) => {
  const current = currentByLegacyId.get(legacyRelation.relationId);
  if (!current) throw new Error(`No migrated relation found for ${legacyRelation.relationId}`);
  const material = {
    oldId: legacyRelation.relationId,
    newId: current.relationId,
    sourceEntityId: current.sourceId,
    relationType: current.relationType,
    targetEntityId: current.targetId,
    identityVersion: current.relationIdentityVersion,
    reason: "Legacy identity used endpoint slugs only; v2 hashes the complete namespaced endpoints, relation type, algorithm version and optional discriminator.",
    status: "APPLIED",
  };
  return { ...material, digest: sha256Digest(material) };
}).sort((left, right) => left.oldId.localeCompare(right.oldId));

if (entries.length !== relations.length || new Set(entries.map((entry) => entry.oldId)).size !== entries.length || new Set(entries.map((entry) => entry.newId)).size !== entries.length) {
  throw new Error("Relation identity migration is incomplete or contains duplicate identities.");
}

const contract = {
  formatVersion: "1.0.0",
  sourceSnapshotId: snapshot.snapshotId,
  sourceGraphVersion: snapshot.data.graphVersion,
  targetGraphVersion: "2.0.0",
  relationIdentityVersion: RELATION_IDENTITY_VERSION,
  algorithm: RELATION_IDENTITY_ALGORITHM,
  count: entries.length,
  entries,
};
const document = { ...contract, digest: sha256Digest(contract) };
const serialized = `${stableStringify(document)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) throw new Error(`Missing relation migration file: ${outputPath}`);
  if (readFileSync(outputPath, "utf8") !== serialized) throw new Error(`Relation migration drift detected: ${outputPath}`);
  console.log(JSON.stringify({ valid: true, mode: "check", outputPath, count: entries.length, digest: document.digest }, null, 2));
} else {
  writeFileSync(outputPath, serialized, "utf8");
  console.log(JSON.stringify({ valid: true, mode: "write", outputPath, count: entries.length, digest: document.digest }, null, 2));
}
