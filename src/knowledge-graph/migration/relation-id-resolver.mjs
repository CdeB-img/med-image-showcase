import { relations } from "../catalog.mjs";

export const relationIdMigrationEntries = Object.freeze(relations.flatMap((relation) => relation.legacyRelationIds.map((legacyRelationId) => Object.freeze({
  oldId: legacyRelationId,
  newId: relation.relationId,
  reason: "Replace last-segment identity with full-endpoint deterministic identity.",
  status: "APPLIED",
  relationIdentityVersion: relation.relationIdentityVersion,
  digest: relation.relationIdentityDigest,
}))));

const migrationByOldId = new Map(relationIdMigrationEntries.map((entry) => [entry.oldId, entry]));
const relationByCurrentId = new Map(relations.map((relation) => [relation.relationId, relation]));

export const resolveRelationId = (relationId) => migrationByOldId.get(relationId)?.newId ?? (relationByCurrentId.has(relationId) ? relationId : null);

export const resolveRelation = (relationId) => {
  const currentId = resolveRelationId(relationId);
  return currentId ? relationByCurrentId.get(currentId) ?? null : null;
};
