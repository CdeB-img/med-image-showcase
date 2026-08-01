import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { engineEntries, planNoxiaPilotPublication, resolveEditorialPreview, runNoxiaPilot } from "./engine.mjs";
import { pilotEntities, sourceCatalog } from "./catalog.mjs";
import { noxiaEditorialAdapter, isPrivateOrReservedPath } from "./adapter.mjs";
import { supportedPilotTemplates } from "./renderer.mjs";

const knownEntityTypes = new Set(["modality", "anatomy", "sequence_family", "biomarker", "workflow", "tool", "service", "publication"]);
const knownEvidence = new Set(["UNSOURCED", "INTERNAL_SOURCE", "PRIMARY_SOURCE", "OFFICIAL_DOCUMENTATION", "PEER_REVIEWED", "CONSENSUS_OR_GUIDELINE", "DEPRECATED"]);
const knownRelations = new Set(["IS_A", "PART_OF", "APPLIES_TO", "USES", "MEASURES", "PRODUCES", "SUPPORTS", "DOCUMENTS", "IMPLEMENTED_BY", "RELATED_TO"]);

export const existingPublicPaths = (root) => {
  const app = readFileSync(join(root, "src/App.tsx"), "utf8");
  const projects = readFileSync(join(root, "src/data/projects.ts"), "utf8");
  const paths = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/gu)].map((match) => match[1]).filter((path) => !path.includes(":")));
  for (const match of projects.matchAll(/\bid:\s*"([^"]+)"/gu)) paths.add(`/projet/${match[1]}`);
  return paths;
};

export const validateNoxiaPilot = (root) => {
  const errors = [];
  const entityIds = new Set();
  const sourceIds = new Set(sourceCatalog.map((item) => item.id));
  const publicPaths = existingPublicPaths(root);
  for (const item of sourceCatalog) if (!existsSync(join(root, item.file))) errors.push(`missing-source:${item.id}`);
  for (const item of pilotEntities) {
    if (entityIds.has(item.entityId)) errors.push(`duplicate-entity:${item.entityId}`);
    entityIds.add(item.entityId);
    if (!knownEntityTypes.has(item.entityType)) errors.push(`unknown-entity-type:${item.entityId}`);
    if (!knownEvidence.has(item.evidenceStatus)) errors.push(`invalid-evidence:${item.entityId}`);
    if (!item.sourceRefs.every((sourceId) => sourceIds.has(sourceId))) errors.push(`unknown-source:${item.entityId}`);
    for (const relation of item.relations) {
      if (!knownRelations.has(relation.type)) errors.push(`invalid-relation-type:${item.entityId}`);
      if (!relation.targetId || !["sourced", "structural"].includes(relation.kind)) errors.push(`invalid-relation:${item.entityId}`);
    }
  }
  for (const item of pilotEntities) for (const relation of item.relations) if (!entityIds.has(relation.targetId)) errors.push(`unknown-entity-relation:${item.entityId}:${relation.targetId}`);
  const result = runNoxiaPilot();
  if (!result.validation.valid) errors.push(...result.validation.errors.map((error) => `engine:${error.code}`));
  for (const entry of engineEntries) {
    if (!publicPaths.has(entry.path)) errors.push(`unknown-public-target:${entry.id}`);
    if (isPrivateOrReservedPath(entry.path)) errors.push(`private-or-reserved-target:${entry.id}`);
    if (entry.metadata.canonical !== new URL(entry.path, noxiaEditorialAdapter.publicOrigin).toString().replace(/\/$/u, "")) errors.push(`canonical-mismatch:${entry.id}`);
    if (!supportedPilotTemplates.includes(entry.templateKey)) errors.push(`unsupported-template:${entry.id}`);
  }
  if (result.sitemap.urls.length !== 0) errors.push("public-sitemap-leak");
  if (planNoxiaPilotPublication().publishable.length !== 0) errors.push("publication-leak");
  if (!resolveEditorialPreview("/not-an-editorial-pilot").notFound) errors.push("editorial-404-missing");
  return { valid: errors.length === 0, errors, entityCount: pilotEntities.length, projectionCount: engineEntries.length, routeCount: Object.keys(result.routing.routes).length };
};
